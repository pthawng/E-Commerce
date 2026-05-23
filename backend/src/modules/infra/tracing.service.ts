import { Injectable, OnModuleInit } from '@nestjs/common';
import { Span, SpanStatusCode, trace, Tracer } from '@opentelemetry/api';

@Injectable()
export class TracingService implements OnModuleInit {
  private tracer: Tracer;

  onModuleInit() {
    this.tracer = trace.getTracer('ray-paradis-backend');
  }

  async trace<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, any>,
  ): Promise<T> {
    return this.tracer.startActiveSpan(name, async (span) => {
      if (attributes) {
        span.setAttributes(attributes);
      }
      try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message,
        });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  getTracer(): Tracer {
    return this.tracer;
  }
}
