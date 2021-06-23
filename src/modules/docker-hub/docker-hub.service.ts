import { ContainerImagePushedEvent } from './../../events/container-image-pushed.event';
import { DockerHubWebhookPayloadDto } from './dto/docker-hub-webhook-payload.dto';
import { InvalidDockerHubTokenException } from './../../exceptions/invalid-docker-hub-token.exception';
import { Config, DockerHubConfig } from 'src/config/configuration.interface';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HttpService, Injectable, Logger } from '@nestjs/common';
import { Event } from 'src/events/events.enum';

@Injectable()
export class DockerHubService {
  private readonly dockerHubToken: string;
  private readonly logger: Logger = new Logger(DockerHubService.name);
  private readonly webhookImageCounter: { [key: string]: number } = {};

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService<Config>,
    private readonly httpService: HttpService,
  ) {
    this.dockerHubToken =
      this.configService.get<DockerHubConfig>('dockerHub').token;
  }

  /**
   * Handles the DockerHub container image push webhook
   * @param token the webhook token
   * @param dockerHubWebhookPayloadDto the DockerHub webhook payload
   */
  onContainerImagePush(
    token: string,
    dockerHubWebhookPayloadDto: DockerHubWebhookPayloadDto,
  ): void {
    this.validateToken(token);
    this.validateWebhookCallback(dockerHubWebhookPayloadDto.callback_url);

    /**
     * DockerHub will send 3 webhook calls for each container image that is built since we target 3 architectures.
     * The webhookImageCounter keeps track of how many webhook calls have been received for each image. This is
     * done to make sure that the container image is updated in Kubernetes only when all the architecture images
     * have been pushed to DockerHub and are available to be pulled by the Kubernetes cluster.
     */
    const fullImageName = `${dockerHubWebhookPayloadDto.repository.repo_name}:${dockerHubWebhookPayloadDto.push_data.tag}`;
    if (!this.webhookImageCounter[fullImageName]) {
      this.webhookImageCounter[fullImageName] = 1;
      return;
    }
    this.webhookImageCounter[fullImageName] += 1;
    if (this.webhookImageCounter[fullImageName] !== 3) {
      return;
    }
    this.webhookImageCounter[fullImageName] = 0;

    this.logger.log(
      `DockerHub webhook received for ${dockerHubWebhookPayloadDto.repository.repo_name}:${dockerHubWebhookPayloadDto.push_data.tag}`,
    );
    this.eventEmitter.emit(
      Event.ContainerImagePushed,
      new ContainerImagePushedEvent(
        dockerHubWebhookPayloadDto.repository.repo_name,
        dockerHubWebhookPayloadDto.push_data.tag,
      ),
    );
  }

  /**
   * Validates the token parameter supplied by DockerHub in the request url
   * @param token the webhook token
   */
  private validateToken(token: string): void {
    if (token !== this.dockerHubToken) {
      throw new InvalidDockerHubTokenException();
    }
  }

  /**
   * Makes a POST request to the supplied callback url in the webhook payload
   * to verify that the webhook has been successfully processed
   * @param callbackUrl the supplied webhook callback url
   */
  private async validateWebhookCallback(callbackUrl: string): Promise<void> {
    try {
      await this.httpService
        .post(callbackUrl, { state: 'success' })
        .toPromise();
      this.logger.log(`DockerHub webhook callback validated (${callbackUrl})`);
    } catch (err: any) {
      this.logger.error(
        `Error validating DockerHub webhook callback (${callbackUrl})`,
      );
    }
  }
}
