import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { ApiResponse, PaginatedResponse } from '@shared';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse> | Promise<Observable<ApiResponse>> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();

    return next.handle().pipe(
      map((data): ApiResponse => {
        // Detect pagination format
        const isPaginated = data && typeof data === 'object' && 'items' in data && 'meta' in data;
        const paginatedData = data as PaginatedResponse<any> | undefined;

        return {
          success: true,
          statusCode: response.statusCode,
          message: data?.message ?? 'OK',
          path: request.url,
          timestamp: new Date().toISOString(),
          // FIX: For pagination, we store the full result (items, meta, links)
          // inside the data field so FE hooks can unwrap it correctly.
          data: isPaginated ? data : (data ?? null),
          // We also keep meta at top level for backward compat or easy access
          meta: isPaginated ? (data as any).meta : null,
        };
      }),
    );
  }
}
