import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  correlationId: string;
  requestId: string;
  userId?: string;
  actorType?: string;
  ipAddress?: string;
  userAgent?: string;
  path?: string;
  method?: string;
}

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  run<T>(context: RequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  get(): RequestContext | undefined {
    return this.storage.getStore();
  }

  merge(partial: Partial<RequestContext>): void {
    const current = this.storage.getStore();
    if (!current) return;
    Object.assign(current, partial);
  }

  getCorrelationId(): string | undefined {
    return this.get()?.correlationId;
  }
}
