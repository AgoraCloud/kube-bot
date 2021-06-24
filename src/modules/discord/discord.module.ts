import { ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { Client as DiscordClient } from 'discord.js';
import { Config, DiscordConfig } from 'src/config/configuration.interface';

const discordFactory = {
  provide: DiscordClient,
  useFactory: (configService: ConfigService<Config>) => {
    const discordClient: DiscordClient = new DiscordClient({
      allowedMentions: { parse: ['users', 'roles'] },
    });
    const botToken: string =
      configService.get<DiscordConfig>('discord').bot.token;
    discordClient.login(botToken);
    return discordClient;
  },
  inject: [ConfigService],
};

@Module({
  providers: [discordFactory, DiscordService],
})
export class DiscordModule {}
