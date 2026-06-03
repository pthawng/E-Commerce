import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';

export type ErrorClassification =
  | 'Validation'
  | 'Business'
  | 'Infrastructure'
  | 'Security'
  | 'Unexpected';

@Injectable()
export class ErrorClassifierService {
  classify(error: unknown): ErrorClassification {
    if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
      return 'Security';
    }

    if (error instanceof BadRequestException || error instanceof UnprocessableEntityException) {
      return 'Validation';
    }

    if (error instanceof ConflictException) {
      return 'Business';
    }

    if (error instanceof HttpException) {
      const status = error.getStatus();
      if (status >= 400 && status < 500) return 'Business';
      if (status >= 500) return 'Infrastructure';
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
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
}
