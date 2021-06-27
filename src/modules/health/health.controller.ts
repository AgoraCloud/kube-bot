import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

@Controller('api/health')
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly memoryHealthIndicator: MemoryHealthIndicator,
  ) {}

  /**
   * Get the readiness state of the kube-bot
   */
  @HealthCheck()
  @Get('readiness')
  readinessCheck(): Promise<HealthCheckResult> {
    return this.healthCheck();
  }

  /**
   * Get the liveness state of the kube-bot
   */
  @HealthCheck()
  @Get('liveness')
  livenessCheck(): Promise<HealthCheckResult> {
    return this.healthCheck();
  }

  /**
   * Checks if the kube-bot is healthy
   */
  private async healthCheck(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      async () =>
        this.memoryHealthIndicator.checkHeap('memoryHeap', 300 * 1024 * 1024),
      async () =>
        this.memoryHealthIndicator.checkRSS('memoryRss', 300 * 1024 * 1024),
    ]);
  }
}
