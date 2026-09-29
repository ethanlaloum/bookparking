import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  PayloadTooLargeException,
} from '@nestjs/common';

import { PhotoTooLargeError } from '../../../domain/errors/PhotoTooLargeError';

interface JsonResponse {
  status(code: number): { json(body: unknown): void };
}

@Catch(PayloadTooLargeException)
export class PhotoTooLargeFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<JsonResponse>()
      .status(HttpStatus.PAYLOAD_TOO_LARGE)
      .json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        message: new PhotoTooLargeError().message,
      });
  }
}
