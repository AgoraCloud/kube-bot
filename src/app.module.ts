import { HealthModule } from './modules/health/health.module';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { commaDelimitedLogLevel } from './utils/regex.patterns';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DiscordModule } from './modules/discord/discord.module';
import { DockerHubModule } from './modules/docker-hub/docker-hub.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { KubernetesModule } from './modules/kubernetes/kubernetes.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import * as Joi from 'joi';
import { LogLevel } from './config/configuration.interface';
import { LoggerModule } from './modules/logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production')
          .default('development'),
        PORT: Joi.number().default(3000),
        LOG_LEVEL: Joi.string()
          .pattern(new RegExp(commaDelimitedLogLevel))
          .default(`${LogLevel.Warn},${LogLevel.Error}`),
        DOMAIN: Joi.string().domain().required(),
        DISCORD_BOT_TOKEN: Joi.string().required(),
        DISCORD_BOT_CHANNEL_ID: Joi.string().required().length(18),
        DISCORD_BOT_ROLES_SERVER_ID: Joi.string().required().length(18),
        DISCORD_BOT_ROLES_UI_ID: Joi.string().required().length(18),
        DISCORD_BOT_USERS_SAID_ID: Joi.string().required().length(18),
        DISCORD_BOT_USERS_WALEED_ID: Joi.string().required().length(18),
        DISCORD_BOT_USERS_MARC_ID: Joi.string().required().length(18),
        DOCKER_HUB_TOKEN: Joi.string().alphanum().required().length(24),
      }),
    }),
    EventEmitterModule.forRoot(),
    DiscordModule,
    DockerHubModule,
    KubernetesModule,
    LoggerModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
