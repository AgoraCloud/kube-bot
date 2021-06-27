import { DockerImageName } from './../docker-hub/dto/docker-hub-webhook-payload.dto';
import { KubernetesIngressPrefix } from './schemas/kubernetes-ingress-prefix.enum';
import { Config } from '../../config/configuration.interface';
import { ConfigService } from '@nestjs/config';
import { DeploymentSucceededEvent } from './../../events/deployment-succeeded.event';
import { DeploymentProcessingEvent } from './../../events/deployment-processing.event';
import { DeploymentFailedEvent } from './../../events/deployment-failed.event';
import { KubernetesDeployment } from './schemas/kubernetes-deployment.enum';
import { KubernetesNamespace } from './schemas/kubernetes-namespace.enum';
import { ContainerImagePushedEvent } from './../../events/container-image-pushed.event';
import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Event } from '../../events/events.enum';
import {
  AppsV1Api,
  CoreV1Api,
  CoreV1Event,
  Informer,
  KubeConfig,
  makeInformer,
  PatchUtils,
  V1Container,
  V1Deployment,
  V1ObjectReference,
} from '@kubernetes/client-node';
import {
  DockerImageTag,
  DockerRepository,
} from '../docker-hub/dto/docker-hub-webhook-payload.dto';
import { IncomingMessage } from 'http';
import { EventReason, EventRelatedKind } from './schemas/kubernetes-event.enum';

@Injectable()
export class KubernetesService implements OnModuleInit {
  private readonly baseDomain: string;
  private readonly logger: Logger = new Logger(KubernetesService.name);

  constructor(
    @Inject(KubeConfig) private readonly kc: KubeConfig,
    @Inject(AppsV1Api) private readonly k8sAppsV1Api: AppsV1Api,
    @Inject(CoreV1Api) private readonly k8sCoreV1Api: CoreV1Api,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService<Config>,
  ) {
    this.baseDomain = this.configService.get<string>('domain');
  }

  async onModuleInit(): Promise<void> {
    // Start the namespaced event informers for all Kubernetes namespaces
    for (const namespace of Object.values(KubernetesNamespace)) {
      await this.startNamespacedEventInformer(namespace);
    }
    this.logger.log(
      '👀 Kubernetes event informers are initialized and running',
    );
  }

  /**
   * Update a Kubernetes deployment
   * @param namespace the deployment namespace
   * @param deploymentName the deployment name
   * @returns the updated kubernetes deployment
   */
  private async updateDeployment(
    namespace: KubernetesNamespace,
    deploymentName: KubernetesDeployment,
  ): Promise<{
    response: IncomingMessage;
    body: V1Deployment;
  }> {
    return this.k8sAppsV1Api.patchNamespacedDeployment(
      deploymentName,
      namespace,
      {
        spec: {
          template: {
            metadata: {
              labels: {
                deployedAt: `${new Date().getTime()}`,
              },
            },
          },
        },
      },
      undefined,
      undefined,
      undefined,
      undefined,
      {
        headers: {
          'Content-type': PatchUtils.PATCH_FORMAT_STRATEGIC_MERGE_PATCH,
        },
      },
    );
  }

  /**
   * Set up and start the Kubernetes event informer for a
   * specific namespace
   * @param namespace The events Kubernetes namespace
   */
  private async startNamespacedEventInformer(namespace: string): Promise<void> {
    const informer: Informer<CoreV1Event> = makeInformer(
      this.kc,
      `/apis/events.k8s.io/v1/namespaces/${namespace}/events`,
      () => {
        return this.k8sCoreV1Api.listNamespacedEvent(namespace);
      },
    );
    informer.on('add', (event: CoreV1Event) => this.onEventAdded(event));
    await informer.start();
  }

  /**
   * Sends an event that notifies team members on Discord when a
   * deployment update succeeds
   * @param event the Kubernetes event
   */
  private async onEventAdded(event: CoreV1Event): Promise<void> {
    const eventRegarding: V1ObjectReference = (event as any)
      .regarding as V1ObjectReference;
    if (
      event.reason !== EventReason.Started ||
      !eventRegarding ||
      eventRegarding.kind !== EventRelatedKind.Pod ||
      !eventRegarding.name ||
      !eventRegarding.namespace
    ) {
      return;
    }

    if (
      (eventRegarding.namespace === KubernetesNamespace.AgoraCloudWaleed ||
        eventRegarding.namespace === KubernetesNamespace.AgoraCloudMarc) &&
      eventRegarding.name.includes(DockerImageName.Server)
    ) {
      return;
    }
    if (
      eventRegarding.namespace === KubernetesNamespace.AgoraCloudSaid &&
      eventRegarding.name.includes(DockerImageName.Ui)
    ) {
      return;
    }

    try {
      const { body: updatedPod } = await this.k8sCoreV1Api.readNamespacedPod(
        eventRegarding.name,
        eventRegarding.namespace,
      );
      const podContainers: V1Container[] = updatedPod.spec?.containers;
      if (!podContainers) return;
      const deploymentImage: {
        imageRepository: DockerRepository;
        imageTag: DockerImageTag;
      } = this.getImageNameFromContainers(podContainers);
      this.eventEmitter.emit(
        Event.DeploymentSucceeded,
        new DeploymentSucceededEvent(
          deploymentImage.imageRepository,
          deploymentImage.imageTag,
          this.generateIngressLink(deploymentImage.imageTag),
        ),
      );
    } catch (err) {
      this.logger.error({
        error: `Error retrieving pod ${eventRegarding.name} in namespace ${eventRegarding.namespace}`,
        failureReason: err.response?.body?.message,
      });
    }
  }

  /**
   * Gets the container image name from a Kubernetes container
   * @param containers the Kubernetes containers
   * @returns the container image name
   */
  private getImageNameFromContainers(containers: V1Container[]): {
    imageRepository: DockerRepository;
    imageTag: DockerImageTag;
  } {
    const imageName: string = containers[0].image;
    const imageRepository: string = imageName.slice(0, imageName.indexOf(':'));
    const imageTag: string = imageName.slice(imageName.indexOf(':') + 1);
    return {
      imageRepository: imageRepository as DockerRepository,
      imageTag: imageTag as DockerImageTag,
    };
  }

  /**
   * Generates a Kubernetes ingress link from a container image tag
   * @param imageTag the container image tag
   * @returns an ingress link
   */
  private generateIngressLink(imageTag: DockerImageTag): string {
    let ingressPrefix: KubernetesIngressPrefix;
    if (imageTag === DockerImageTag.DevelopLatest) {
      ingressPrefix = KubernetesIngressPrefix.Development;
    } else if (imageTag === DockerImageTag.SaidLatest) {
      ingressPrefix = KubernetesIngressPrefix.Said;
    } else if (imageTag === DockerImageTag.WaleedLatest) {
      ingressPrefix = KubernetesIngressPrefix.Waleed;
    } else if (imageTag === DockerImageTag.MarcLatest) {
      ingressPrefix = KubernetesIngressPrefix.Marc;
    }
    return ingressPrefix
      ? `https://${ingressPrefix}.${this.baseDomain}`
      : `https://${this.baseDomain}`;
  }

  /**
   * Handles the container.image.pushed event
   * @param payload the container.image.pushed event payload
   */
  @OnEvent(Event.ContainerImagePushed)
  private async handleContainerImagePushedEvent(
    payload: ContainerImagePushedEvent,
  ): Promise<void> {
    try {
      if (payload.imageRepository === DockerRepository.AgoraCloudServer) {
        if (payload.imageTag === DockerImageTag.MainLatest) {
          await this.updateDeployment(
            KubernetesNamespace.AgoraCloudProduction,
            KubernetesDeployment.AgoraCloudProductionServer,
          );
        } else if (payload.imageTag === DockerImageTag.DevelopLatest) {
          await this.updateDeployment(
            KubernetesNamespace.AgoraCloudDevelopment,
            KubernetesDeployment.AgoraCloudDevelopmentServer,
          );
          await this.updateDeployment(
            KubernetesNamespace.AgoraCloudWaleed,
            KubernetesDeployment.AgoraCloudWaleedServer,
          );
          await this.updateDeployment(
            KubernetesNamespace.AgoraCloudMarc,
            KubernetesDeployment.AgoraCloudMarcServer,
          );
        } else if (payload.imageTag === DockerImageTag.SaidLatest) {
          await this.updateDeployment(
            KubernetesNamespace.AgoraCloudSaid,
            KubernetesDeployment.AgoraCloudSaidServer,
          );
        }
      } else if (payload.imageRepository === DockerRepository.AgoraCloudUi) {
        if (payload.imageTag === DockerImageTag.MainLatest) {
          await this.updateDeployment(
            KubernetesNamespace.AgoraCloudProduction,
            KubernetesDeployment.AgoraCloudProductionUi,
          );
        } else if (payload.imageTag === DockerImageTag.DevelopLatest) {
          await this.updateDeployment(
            KubernetesNamespace.AgoraCloudDevelopment,
            KubernetesDeployment.AgoraCloudDevelopmentUi,
          );
          await this.updateDeployment(
            KubernetesNamespace.AgoraCloudSaid,
            KubernetesDeployment.AgoraCloudSaidUi,
          );
        } else if (payload.imageTag === DockerImageTag.WaleedLatest) {
          await this.updateDeployment(
            KubernetesNamespace.AgoraCloudWaleed,
            KubernetesDeployment.AgoraCloudWaleedUi,
          );
        } else if (payload.imageTag === DockerImageTag.MarcLatest) {
          await this.updateDeployment(
            KubernetesNamespace.AgoraCloudMarc,
            KubernetesDeployment.AgoraCloudMarcUi,
          );
        }
      }
      setTimeout(() => {
        this.eventEmitter.emit(
          Event.DeploymentProcessing,
          new DeploymentProcessingEvent(
            payload.imageRepository,
            payload.imageTag,
          ),
        );
      }, 1000);
    } catch (err) {
      const failureReason: string = err.response?.body?.message;
      this.logger.error({
        error: `Error updating deployment for ${payload.imageRepository}:${payload.imageTag}`,
        failureReason,
      });
      this.eventEmitter.emit(
        Event.DeploymentFailed,
        new DeploymentFailedEvent(
          payload.imageRepository,
          payload.imageTag,
          failureReason,
        ),
      );
    }
  }
}
