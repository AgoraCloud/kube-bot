import {
  DockerRepository,
  DockerImageTag,
} from './../modules/docker-hub/dto/docker-hub-webhook-payload.dto';

/**
 * Payload of the kubernetes.deployment.succeeded event
 */
export class DeploymentSucceededEvent {
  imageRepository!: DockerRepository;
  imageTag!: DockerImageTag;
  ingressLink!: string;

  constructor(
    imageRepository: DockerRepository,
    imageTag: DockerImageTag,
    ingressLink: string,
  ) {
    this.imageRepository = imageRepository;
    this.imageTag = imageTag;
    this.ingressLink = ingressLink;
  }
}
