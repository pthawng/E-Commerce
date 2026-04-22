import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let errors: any = null;
    let code: string | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object') {
        const r: any = res;
        message = r.message || r.error || 'Error';
        code = r.code || null; // Extract business code if present
        if (Array.isArray(r.message)) {
          errors = r.message;
          message = 'Validation failed';
        }
      }
    } else {
      // Log non-HttpExceptions as errors
      this.logger.error(
        `Unhandled Exception: ${exception instanceof Error ? exception.message : exception}`,
      );
      if (exception instanceof Error && exception.stack) {
        this.logger.error(exception.stack);
      }
    }

    // Pro-Level Debug Logging
    this.logger.error(`[${request.method}] ${request.url} - Status: ${status}`);
    this.logger.error(`Request Body: ${JSON.stringify(request.body, null, 2)}`);
    if (errors) {
      this.logger.error(`Validation Errors: ${JSON.stringify(errors, null, 2)}`);
    } else if (exception instanceof HttpException) {
      this.logger.error(`Exception Detail: ${JSON.stringify(exception.getResponse(), null, 2)}`);
    }

    if (!code && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      code = 'INTERNAL_SERVER_ERROR';
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      code: code || undefined, // Business code for FE mapping
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      errors,
      meta: null,
      data: null,
    });
  }
}
