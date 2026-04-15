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
      // ... handled below ...
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
