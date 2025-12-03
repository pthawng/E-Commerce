import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { ApiResponse, PaginatedResponse } from '@shared/types';
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
        // Detect pagination format (PaginatedResponse)
        const isPaginated = data && typeof data === 'object' && 'items' in data && 'meta' in data;

        // Extract message if exists in data, otherwise use default
        const message = data?.message ?? 'OK';

        // If data has message, remove it from data payload
        let responseData = data;
        if (data && typeof data === 'object' && 'message' in data) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { message: _, ...rest } = data as any;
          responseData = rest;
        }

        return {
          success: true,
          statusCode: response.statusCode,
          message,
          path: request.url,
          timestamp: new Date().toISOString(),
          data: isPaginated ? (data as PaginatedResponse<any>).items : (responseData ?? null),
          meta: isPaginated ? (data as PaginatedResponse<any>).meta : null,
        };
      }),
    );
  }
}
