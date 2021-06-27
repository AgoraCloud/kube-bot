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
  Informer,
  KubeConfig,
  makeInformer,
  PatchUtils,
  V1Container,
  V1Deployment,
  V1DeploymentCondition,
} from '@kubernetes/client-node';
import {
  DockerImageTag,
  DockerRepository,
} from '../docker-hub/dto/docker-hub-webhook-payload.dto';
import { IncomingMessage } from 'http';
import {
  DeploymentConditionStatus,
  DeploymentConditionType,
} from './schemas/kubernetes-deployment-conditions.enum';

@Injectable()
export class KubernetesService implements OnModuleInit {
  private readonly baseDomain: string;
  private readonly logger: Logger = new Logger(KubernetesService.name);

  constructor(
    @Inject(KubeConfig) private readonly kc: KubeConfig,
    @Inject(AppsV1Api) private readonly k8sAppsV1Api: AppsV1Api,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService<Config>,
  ) {
    this.baseDomain = this.configService.get<string>('domain');
  }

  async onModuleInit(): Promise<void> {
    // Start the namespaced deployment informers for all Kubernetes namespaces
    for (const namespace of Object.values(KubernetesNamespace)) {
      await this.startNamespacedDeploymentInformer(namespace);
    }
    this.logger.log(
      '👀 Kubernetes deployment informers are initialized and running',
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
                deployedAt: `${new Date()}`,
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
   * Set up and start the Kubernetes deployment informer for a
   * specific namespace
   * @param namespace The deployments Kubernetes namespace
   */
  private async startNamespacedDeploymentInformer(
    namespace: KubernetesNamespace,
  ): Promise<void> {
    const informer: Informer<V1Deployment> = makeInformer(
      this.kc,
      `/apis/apps/v1/namespaces/${namespace}/deployments`,
      () => {
        return this.k8sAppsV1Api.listNamespacedDeployment(namespace);
      },
    );
    informer.on('update', (deployment: V1Deployment) =>
      this.onDeploymentUpdate(deployment),
    );
    informer.on('error', (deployment: V1Deployment) =>
      this.onDeploymentError(deployment),
    );
    await informer.start();
  }

  /**
   * Sends an event that notifies team members on Discord when a
   * deployment update succeeds
   * @param deployment the Kubernetes deployment
   */
  private onDeploymentUpdate(deployment: V1Deployment): void {
    const conditions: V1DeploymentCondition[] = deployment.status?.conditions;
    if (!conditions) return;
    const availableDeploymentConditionIndex: number = conditions.findIndex(
      (c: V1DeploymentCondition) =>
        c.type === DeploymentConditionType.Available &&
        c.status === DeploymentConditionStatus.True,
    );
    const progressingDeploymentConditionIndex: number = conditions.findIndex(
      (c: V1DeploymentCondition) =>
        c.type === DeploymentConditionType.Progressing &&
        c.status === DeploymentConditionStatus.True,
    );
    if (
      availableDeploymentConditionIndex === -1 ||
      progressingDeploymentConditionIndex === -1
    ) {
      return;
    }

    const deploymentContainers: V1Container[] =
      deployment.spec?.template?.spec?.containers;
    if (!deploymentContainers) return;
    const deploymentImage: {
      imageRepository: DockerRepository;
      imageTag: DockerImageTag;
    } = this.getImageNameFromContainers(deploymentContainers);

    this.eventEmitter.emit(
      Event.DeploymentSucceeded,
      new DeploymentSucceededEvent(
        deploymentImage.imageRepository,
        deploymentImage.imageTag,
        this.generateIngressLink(deploymentImage.imageTag),
      ),
    );
  }

  /**
   * Extracts the failure reason from the Kubernetes deployment
   * and sends an event that notifies team members on Discord
   * with the deployment failure reason
   * @param deployment the Kubernetes deployment
   */
  private onDeploymentError(deployment: V1Deployment): void {
    const conditions: V1DeploymentCondition[] = deployment.status?.conditions;
    if (!conditions) return;
    const failureReason: string = conditions
      .filter((condition: V1DeploymentCondition) => condition.message)
      .join(' \n ');

    const deploymentContainers: V1Container[] =
      deployment.spec?.template?.spec?.containers;
    if (!deploymentContainers) return;
    const deploymentImage: {
      imageRepository: DockerRepository;
      imageTag: DockerImageTag;
    } = this.getImageNameFromContainers(deploymentContainers);

    this.eventEmitter.emit(
      Event.DeploymentFailed,
      new DeploymentFailedEvent(
        deploymentImage.imageRepository,
        deploymentImage.imageTag,
        failureReason,
      ),
    );
  }

  /**
   * Get a Kubernetes deployments image from the deployments containers
   * @param containers the Kubernetes deployment containers
   * @returns the deployments image
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
      ? `${ingressPrefix}.${this.baseDomain}`
      : this.baseDomain;
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
      this.eventEmitter.emit(
        Event.DeploymentProcessing,
        new DeploymentProcessingEvent(
          payload.imageRepository,
          payload.imageTag,
        ),
      );
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
