import assert from 'node:assert/strict';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import test from 'node:test';
import { RateLimiter } from './rate-limit';

test('RateLimiter uses socket address by default', () => {
  const limiter = new RateLimiter({ requestsPerMinute: 1 });
  const request = new IncomingMessage(new Socket());
  request.headers['x-forwarded-for'] = '203.0.113.10';
  Object.defineProperty(request.socket, 'remoteAddress', {
    value: '127.0.0.1',
  });

  assert.equal(limiter.isAllowed('127.0.0.1'), true);
  assert.equal(limiter.middleware(request, fakeResponse(), 1), false);
});

test('RateLimiter honors forwarded headers only when trusted', () => {
  const limiter = new RateLimiter({
    requestsPerMinute: 1,
    trustProxyHeaders: true,
  });
  const firstRequest = new IncomingMessage(new Socket());
  const secondRequest = new IncomingMessage(new Socket());

  firstRequest.headers['x-forwarded-for'] = '203.0.113.10';
  secondRequest.headers['x-forwarded-for'] = '203.0.113.10';

  assert.equal(limiter.middleware(firstRequest, fakeResponse(), 1), true);
  assert.equal(limiter.middleware(secondRequest, fakeResponse(), 1), false);
});

function fakeResponse() {
  return {
    statusCode: 200,
    setHeader() {},
    end() {},
  } as unknown as ServerResponse;
}
