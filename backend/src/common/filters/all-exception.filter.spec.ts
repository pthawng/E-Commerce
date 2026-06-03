import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AllExceptionFilter } from './all-exception.filter';

function host(exceptionRequest: Record<string, unknown>) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return {
    response: { status, json },
    argumentsHost: {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({
          method: 'POST',
          url: '/api/admin/system/settings',
          body: {},
          headers: {},
          correlationId: 'corr-error',
          ...exceptionRequest,
        }),
      }),
    } as any,
  };
}

describe('AllExceptionFilter', () => {
  it('returns correlation id and validation classification', () => {
    const filter = new AllExceptionFilter();
    const { argumentsHost, response } = host({});

    filter.catch(new BadRequestException('Invalid input'), argumentsHost);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: expect.objectContaining({
          correlationId: 'corr-error',
          errorClass: 'Validation',
        }),
      }),
    );
  });

  it('classifies forbidden errors as security', () => {
    const filter = new AllExceptionFilter();
    const { response, argumentsHost } = host({});

    filter.catch(new ForbiddenException('Forbidden'), argumentsHost);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: expect.objectContaining({ errorClass: 'Security' }),
      }),
    );
  });
});
