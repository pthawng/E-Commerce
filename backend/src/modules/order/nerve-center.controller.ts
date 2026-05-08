import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map } from 'rxjs';

@Controller('nerve-center')
export class NerveCenterController {
  constructor(private eventEmitter: EventEmitter2) {}

  @Sse('stream')
  streamEvents(): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, 'nerve.center.event').pipe(
      map((payload: any) => ({
        data: payload,
      })),
    );
  }
}
