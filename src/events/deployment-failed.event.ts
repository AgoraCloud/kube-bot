import {
  DockerRepository,
  DockerImageTag,
} from './../modules/docker-hub/dto/docker-hub-webhook-payload.dto';

/**
 * Payload of the kubernetes.deployment.failed event
 */
export class DeploymentFailedEvent {
  imageRepository!: DockerRepository;
  imageTag!: DockerImageTag;
  failureReason!: string;

  constructor(
    imageRepository: DockerRepository,
    imageTag: DockerImageTag,
    failureReason: string,
  ) {
    this.imageRepository = imageRepository;
    this.imageTag = imageTag;
    this.failureReason = failureReason;
  }
}
