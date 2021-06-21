import { DockerHubWebhookPayloadDto } from './dto/docker-hub-webhook-payload.dto';
import { TokenParamDto } from './dto/token-param.dto';
import { DockerHubService } from './docker-hub.service';
import { Body, Controller, Param, Post } from '@nestjs/common';

@Controller('webhooks/:token/docker')
export class DockerHubController {
  constructor(private readonly dockerHubService: DockerHubService) {}

  /**
   * Handles the DockerHub container image push webhook
   * @param token the webhook token
   * @param dockerHubWebhookPayloadDto the DockerHub webhook payload
   */
  @Post()
  onContainerImagePush(
    @Param() { token }: TokenParamDto,
    @Body() dockerHubWebhookPayloadDto: DockerHubWebhookPayloadDto,
  ) {
    return this.dockerHubService.onContainerImagePush(
      token,
      dockerHubWebhookPayloadDto,
    );
  }
}
