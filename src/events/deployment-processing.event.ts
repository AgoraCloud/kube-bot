import {
  DockerRepository,
  DockerImageTag,
} from './../modules/docker-hub/dto/docker-hub-webhook-payload.dto';

/**
 * Payload of the kubernetes.deployment.processing event
 */
export class DeploymentProcessingEvent {
  imageRepository!: DockerRepository;
  imageTag!: DockerImageTag;

  constructor(imageRepository: DockerRepository, imageTag: DockerImageTag) {
    this.imageRepository = imageRepository;
    this.imageTag = imageTag;
  }
}
