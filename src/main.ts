import { LoggerService } from './modules/logger/logger.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Config } from './config/configuration.interface';

declare const module: any;

async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Get configuration values
  const configService: ConfigService<Config> = app.get(ConfigService);
  const port: number = configService.get<number>('port');

  app.useGlobalPipes(
    new ValidationPipe({ forbidUnknownValues: true, whitelist: true }),
  );
  // Use the custom LoggerService for logging
  app.useLogger(app.get(LoggerService));

  await app.listen(port);

  // Hot Reload
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
