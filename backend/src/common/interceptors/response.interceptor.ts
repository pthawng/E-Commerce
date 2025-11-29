import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();

    return next.handle().pipe(
      map((data) => {
        // Detect pagination format
        const isPaginated = data && typeof data === 'object' && 'items' in data && 'meta' in data;

        return {
          success: true,
          statusCode: response.statusCode,
          message: data?.message ?? 'OK',
          path: request.url,
          timestamp: new Date().toISOString(),
          data: isPaginated ? data.items : (data ?? null),
          meta: isPaginated ? data.meta : null,
        };
      }),
    );
  }
}
