import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  constructor(adapterHost: HttpAdapterHost) {
    super(adapterHost.httpAdapter);
  }

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      return super.catch(exception, host);
    }

    switch (exception.code) {
      case 'P2002':
        return super.catch(
          new ConflictException(`Already exists${this.fields(exception)}`),
          host,
        );
      case 'P2025':
        return super.catch(new NotFoundException('Not found'), host);
      case 'P2003':
        return super.catch(
          new BadRequestException('Related record does not exist'),
          host,
        );
      default:
        return super.catch(exception, host);
    }
  }

  private fields(exception: Prisma.PrismaClientKnownRequestError): string {
    const target = exception.meta?.target;
    if (Array.isArray(target)) {
      return `: ${target.join(', ')}`;
    }
    return typeof target === 'string' ? `: ${target}` : '';
  }
}
