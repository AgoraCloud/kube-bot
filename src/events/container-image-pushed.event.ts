import {
  DockerRepository,
  DockerImageTag,
} from './../modules/docker-hub/dto/docker-hub-webhook-payload.dto';
/**
 * Payload of the container.image.pushed event
 */
export class ContainerImagePushedEvent {
  imageRepository!: DockerRepository;
  imageTag!: DockerImageTag;

  constructor(imageRepository: DockerRepository, imageTag: DockerImageTag) {
    this.imageRepository = imageRepository;
    this.imageTag = imageTag;
  }
}
