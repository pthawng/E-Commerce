import { BadRequestException, ForbiddenException, GatewayTimeoutException } from '@nestjs/common';
import { ErrorClassifierService } from '../error-classifier.service';

describe('ErrorClassifierService', () => {
  const service = new ErrorClassifierService();

  it('classifies validation, security, infrastructure and unexpected errors', () => {
    expect(service.classify(new BadRequestException())).toBe('Validation');
    expect(service.classify(new ForbiddenException())).toBe('Security');
    expect(service.classify(new GatewayTimeoutException())).toBe('Infrastructure');
    expect(service.classify(new Error('boom'))).toBe('Unexpected');
  });
});
