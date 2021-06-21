import { BadRequestException } from '@nestjs/common';

export class InvalidDockerHubTokenException extends BadRequestException {
  constructor() {
    super('Invalid token');
  }
}
