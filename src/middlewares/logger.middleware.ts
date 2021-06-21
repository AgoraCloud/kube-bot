import { NextFunction, Request, Response } from 'express';
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

/**
 * A middleware that logs information about every API request.
 * From: https://github.com/julien-sarazin/nest-playground/issues/1#issuecomment-682588094
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger: Logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const now: number = Date.now();
    const { method, originalUrl: url, ip } = req;
    const userAgent: string = req.get('user-agent') || '';
    res.on('finish', () => {
      const { statusCode } = res;
      this.logger.log(
        `${method} ${url} ${statusCode} +${
          Date.now() - now
        }ms - ${userAgent} ${ip}`,
      );
    });
    next();
  }
}
