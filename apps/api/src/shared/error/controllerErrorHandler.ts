import { HttpException, HttpStatus, Logger } from '@nestjs/common';

export interface ErrorLogContext {
  name: string;
  method: string;
  userId?: string;
  [id: string]: string | undefined;
}

const logger = new Logger('ControllerErrorHandler');

export const controllerErrorHandler = (
  error: unknown,
  context: ErrorLogContext,
): never => {
  if (error instanceof HttpException) throw error;

  logger.error({
    ...context,
    errorClass: error instanceof Error ? error.constructor.name : typeof error,
    errorMessage: error instanceof Error ? error.message : undefined,
  });

  throw new HttpException(
    'Une erreur inattendue est survenue',
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
};
