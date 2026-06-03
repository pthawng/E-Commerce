import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
  UnprocessableEntityException,
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
    let errors: unknown = null;
    let code: string | null = null;
    const correlationId =
      request.correlationId ||
      request.headers?.['x-correlation-id'] ||
      request.requestId ||
      request.headers?.['x-request-id'];
    const classification = this.classify(exception);
    const errorContext = this.extractErrorContext(request);

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object') {
        const r = res as { message?: unknown; error?: string; code?: string };
        message =
          typeof r.message === 'string'
            ? r.message
            : Array.isArray(r.message)
              ? 'Validation failed'
              : r.error || 'Error';
        code = r.code || null; // Extract business code if present
        if (Array.isArray(r.message)) {
          errors = r.message;
          message = 'Validation failed';
        }
      }
    } else {
      // Log non-HttpExceptions as errors
      this.logger.error(this.formatErrorLog(exception, correlationId, classification));
      if (exception instanceof Error && exception.stack) {
        this.logger.error(exception.stack);
      }
    }

    // Pro-Level Debug Logging
    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} correlationId=${
        correlationId || 'none'
      } classification=${classification} context=${JSON.stringify(errorContext)}`,
    );
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
      meta: {
        correlationId,
        errorClass: classification,
        errorContext,
      },
      data: null,
    });
  }

  private classify(exception: unknown) {
    if (exception instanceof UnauthorizedException || exception instanceof ForbiddenException) {
      return 'Security';
    }
    if (
      exception instanceof BadRequestException ||
      exception instanceof UnprocessableEntityException
    ) {
      return 'Validation';
    }
    if (exception instanceof ConflictException) {
      return 'Business';
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status >= 400 && status < 500) return 'Business';
      if (status >= 500) return 'Infrastructure';
    }
    if (exception instanceof Error) {
      const message = exception.message.toLowerCase();
      if (
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('redis') ||
        message.includes('database')
      ) {
        return 'Infrastructure';
      }
    }
    return 'Unexpected';
  }

  private formatErrorLog(
    exception: unknown,
    correlationId: string | undefined,
    classification: string,
  ) {
    const message = exception instanceof Error ? exception.message : String(exception);
    return `Unhandled Exception: ${message} correlationId=${
      correlationId || 'none'
    } classification=${classification}`;
  }

  private extractErrorContext(request: {
    user?: Record<string, unknown>;
    params?: Record<string, unknown>;
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
  }) {
    const user = request.user ?? {};
    const params = request.params ?? {};
    const body = request.body ?? {};
    const query = request.query ?? {};

    return {
      userId: user.userId ?? user.id,
      staffId: user.staffId,
      orderId: params.orderId ?? params.id ?? body.orderId ?? query.orderId,
      paymentId: params.paymentId ?? body.paymentId ?? query.paymentId,
      eventId: params.eventId ?? body.eventId ?? query.eventId,
    };
  }
}
