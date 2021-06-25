import { DeploymentProcessingEvent } from './../../events/deployment-processing.event';
import { DeploymentFailedEvent } from './../../events/deployment-failed.event';
import { DeploymentSucceededEvent } from './../../events/deployment-succeeded.event';
import {
  DockerRepository,
  DockerImageTag,
} from './../docker-hub/dto/docker-hub-webhook-payload.dto';
import { Config, DiscordConfig } from 'src/config/configuration.interface';
import { ConfigService } from '@nestjs/config';
import { ContainerImagePushedEvent } from './../../events/container-image-pushed.event';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Client as DiscordClient, TextChannel } from 'discord.js';
import { Event } from 'src/events/events.enum';

@Injectable()
export class DiscordService implements OnModuleInit {
  private botChannel: TextChannel;
  private readonly discordConfig: DiscordConfig;
  private readonly logger: Logger = new Logger(DiscordService.name);

  constructor(
    @Inject(DiscordClient) private readonly discordClient: DiscordClient,
    private readonly configService: ConfigService<Config>,
  ) {
    this.discordConfig = this.configService.get<DiscordConfig>('discord');
  }

  async onModuleInit(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.discordClient.on('ready', () => {
        try {
          this.getBotChannel();
        } catch (err) {
          reject(err);
        }
        resolve();
      });

      /**
       * Stop the app from starting up if KubeBot is not initialized
       * and running in 5 seconds
       */
      setTimeout(() => {
        reject('🤖 Timed out initializing KubeBot');
      }, 5000);
    }).then(() => this.logger.log('🤖 KubeBot is initialized and running'));
  }

  /**
   * Gets the bot channel id from the bots configuration values,
   * then fetches the bot text channel from cache
   */
  private getBotChannel(): void {
    this.botChannel = this.discordClient.channels.cache.get(
      this.discordConfig.bot.channelId,
    ) as TextChannel;
    if (!this.botChannel) {
      throw '🤖 Could not fetch the KubeBot channel';
    }
  }

  /**
   * Sends a message to the bot channel
   * @param message the message to send
   */
  private async sendMessage(message: string): Promise<void> {
    await this.botChannel.send(message);
  }

  /**
   * Generates a discord mention snippet for roles or users based on the
   * given docker repository and image tag
   * @param dockerRepository the docker repository
   * @param dockerImageTag the docker image tag
   * @returns the mention snippet
   */
  private getMentionSnippet(
    dockerRepository: DockerRepository,
    dockerImageTag: DockerImageTag,
  ): string {
    // Mention users: <@USER_ID>
    // Mention roles: <@&ROLE_ID>
    let mentionSnippet = '<@';
    if (dockerRepository === DockerRepository.AgoraCloudServer) {
      if (
        dockerImageTag == DockerImageTag.MainLatest ||
        dockerImageTag == DockerImageTag.DevelopLatest
      ) {
        mentionSnippet += `&${this.discordConfig.roles.serverRoleId}`;
      } else if (dockerImageTag == DockerImageTag.SaidLatest) {
        mentionSnippet += this.discordConfig.users.saidsUserId;
      }
    } else if (dockerRepository === DockerRepository.AgoraCloudUi) {
      if (
        dockerImageTag == DockerImageTag.MainLatest ||
        dockerImageTag == DockerImageTag.DevelopLatest
      ) {
        mentionSnippet += `&${this.discordConfig.roles.uiRoleId}`;
      } else if (dockerImageTag == DockerImageTag.WaleedLatest) {
        mentionSnippet += this.discordConfig.users.waleedsUserId;
      } else if (dockerImageTag == DockerImageTag.MarcLatest) {
        mentionSnippet += this.discordConfig.users.marcsUserId;
      }
    }
    mentionSnippet += '>';
    return mentionSnippet;
  }

  /**
   * Handles the container.image.pushed event
   * @param payload the container.image.pushed event payload
   */
  @OnEvent(Event.ContainerImagePushed)
  private async handleContainerImagePushedEvent(
    payload: ContainerImagePushedEvent,
  ): Promise<void> {
    const mentionSnippet: string = this.getMentionSnippet(
      payload.imageRepository,
      payload.imageTag,
    );
    const fullContainerName = `\`${payload.imageRepository}:${payload.imageTag}\``;
    await this.sendMessage(
      `${mentionSnippet} 🔔 DockerHub webhook notification received for ${fullContainerName}`,
    );
  }

  /**
   * Handles the kubernetes.deployment.processing event
   * @param payload the kubernetes.deployment.processing event payload
   */
  @OnEvent(Event.DeploymentProcessing)
  private async handleDeploymentProcessingEvent(
    payload: DeploymentProcessingEvent,
  ): Promise<void> {
    const mentionSnippet: string = this.getMentionSnippet(
      payload.imageRepository,
      payload.imageTag,
    );
    const fullContainerName = `\`${payload.imageRepository}:${payload.imageTag}\``;
    await this.sendMessage(
      `${mentionSnippet} 🧠 Kubernetes deployment for ${fullContainerName} is being processed`,
    );
  }

  /**
   * Handles the kubernetes.deployment.failed event
   * @param payload the kubernetes.deployment.failed event payload
   */
  @OnEvent(Event.DeploymentFailed)
  private async handleDeploymentFailedEvent(
    payload: DeploymentFailedEvent,
  ): Promise<void> {
    const mentionSnippet: string = this.getMentionSnippet(
      payload.imageRepository,
      payload.imageTag,
    );
    const fullContainerName = `\`${payload.imageRepository}:${payload.imageTag}\``;
    const failureReason = `\`\`\`${payload.failureReason}\`\`\``;
    await this.sendMessage(
      `${mentionSnippet} ❌ Kubernetes deployment for ${fullContainerName} failed ${failureReason}`,
    );
  }

  /**
   * Handles the kubernetes.deployment.succeeded event
   * @param payload the kubernetes.deployment.succeeded event payload
   */
  @OnEvent(Event.DeploymentSucceeded)
  private async handleDeploymentSucceededEvent(
    payload: DeploymentSucceededEvent,
  ): Promise<void> {
    const mentionSnippet: string = this.getMentionSnippet(
      payload.imageRepository,
      payload.imageTag,
    );
    const fullContainerName = `\`${payload.imageRepository}:${payload.imageTag}\``;
    await this.sendMessage(
      `${mentionSnippet} ✔️ Kubernetes deployment for ${fullContainerName} succeeded. Please visit this [link](${payload.ingressLink}) to view your changes.`,
    );
  }
}
