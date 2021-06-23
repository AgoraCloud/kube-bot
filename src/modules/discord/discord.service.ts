import { Config, DiscordConfig } from 'src/config/configuration.interface';
import { ConfigService } from '@nestjs/config';
import { ContainerImagePushedEvent } from './../../events/container-image-pushed.event';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Client as DiscordClient, TextChannel } from 'discord.js';
import { Event } from 'src/events/events.enum';

@Injectable()
export class DiscordService implements OnModuleInit {
  private readonly logger: Logger = new Logger(DiscordService.name);
  private botChannel: TextChannel;

  constructor(
    @Inject(DiscordClient) private readonly discordClient: DiscordClient,
    private readonly configService: ConfigService<Config>,
  ) {}

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
    const botChannelId: string =
      this.configService.get<DiscordConfig>('discord').botChannelId;
    this.botChannel = this.discordClient.channels.cache.get(
      botChannelId,
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
   * Handles the container.image.pushed event
   * @param payload the container.image.pushed event payload
   */
  @OnEvent(Event.ContainerImagePushed)
  private async handleContainerImagePushedEvent(
    payload: ContainerImagePushedEvent,
  ): Promise<void> {
    await this.sendMessage(
      `🔔 DockerHub webhook notification received for \`${payload.imageRepository}:${payload.imageTag}\``,
    );
  }
}
