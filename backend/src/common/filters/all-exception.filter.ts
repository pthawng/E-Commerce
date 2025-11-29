import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const res = exception.getResponse();

      // res có thể là string hoặc object
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object') {
        const r: any = res;
        message = r.message || r.error || 'Error';

        // Nếu là validation error (class-validator)
        if (Array.isArray(r.message)) {
          errors = r.message;
          message = 'Validation failed';
        }
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      errors,
      meta: null,
      data: null,
    });
  }
}
