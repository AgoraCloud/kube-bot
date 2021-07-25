import { ContainerImagePushedEvent } from './../../events/container-image-pushed.event';
import { DockerHubWebhookPayloadDto } from './dto/docker-hub-webhook-payload.dto';
import { InvalidDockerHubTokenException } from './../../exceptions/invalid-docker-hub-token.exception';
import { Config, DockerHubConfig } from '../../config/configuration.interface';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HttpService, Injectable, Logger } from '@nestjs/common';
import { Event } from '../../events/events.enum';

@Injectable()
export class DockerHubService {
  private readonly dockerHubToken: string;
  private readonly logger: Logger = new Logger(DockerHubService.name);

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
  async onContainerImagePush(
    token: string,
    dockerHubWebhookPayloadDto: DockerHubWebhookPayloadDto,
  ): Promise<void> {
    this.validateToken(token);
    this.logger.log(
      `DockerHub webhook notification received for ${dockerHubWebhookPayloadDto.repository.repo_name}:${dockerHubWebhookPayloadDto.push_data.tag}`,
    );
    this.eventEmitter.emit(
      Event.ContainerImagePushed,
      new ContainerImagePushedEvent(
        dockerHubWebhookPayloadDto.repository.repo_name,
        dockerHubWebhookPayloadDto.push_data.tag,
      ),
    );
    await this.validateWebhookCallback(dockerHubWebhookPayloadDto.callback_url);
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
