import { HttpModule, Module } from '@nestjs/common';
import { DockerHubController } from './docker-hub.controller';
import { DockerHubService } from './docker-hub.service';

@Module({
  imports: [HttpModule],
  controllers: [DockerHubController],
  providers: [DockerHubService],
})
export class DockerHubModule {}
