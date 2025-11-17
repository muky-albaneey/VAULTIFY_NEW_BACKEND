import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | string[];
    let error: string;
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message || 'An error occurred';
        error = responseObj.error || exception.name;
        details = responseObj.details || null;
        
        // Handle validation errors
        if (Array.isArray(message)) {
          // Validation pipe errors
          message = message;
        }
      } else {
        message = exception.message || 'An error occurred';
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || 'Internal server error';
      error = exception.name || 'Error';
      
      // Log unexpected errors
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
        `${request.method} ${request.url}`,
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'InternalServerError';
      
      this.logger.error(
        'Unknown error occurred',
        JSON.stringify(exception),
        `${request.method} ${request.url}`,
      );
    }

    // Format response for frontend
    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: error,
      message: message,
      ...(details && { details }),
    };

    // Log error for debugging (except for client errors 4xx)
    if (status >= 500) {
      this.logger.error(
        `Error ${status}: ${message}`,
        JSON.stringify(errorResponse),
        `${request.method} ${request.url}`,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `Client error ${status}: ${message}`,
        `${request.method} ${request.url}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}

