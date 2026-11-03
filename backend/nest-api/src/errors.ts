import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { OwnerRequest } from './auth';

@Catch()
export class SafeErrors implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const req = host.switchToHttp().getRequest<OwnerRequest>();
    const res = host.switchToHttp().getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    if (error instanceof HttpException) {
      status = error.getStatus();
      const response = error.getResponse();
      message = typeof response === 'string' ? response : (response as { message: string | string[] }).message;
    } else if (error instanceof Prisma.PrismaClientInitializationError ||
      (error instanceof Prisma.PrismaClientKnownRequestError && ['P1001','P1002','P1008','P1017','P2024'].includes(error.code))) {
      status = 503; message = 'Database temporarily unavailable';
    } else if (typeof error === 'object' && error !== null && 'type' in error) {
      if (error.type === 'entity.too.large') { status = 413; message = 'Request body too large'; }
      else if (error.type === 'entity.parse.failed') { status = 400; message = 'Malformed JSON'; }
    }
    if (status >= 500) message = status === 503 ? 'Service temporarily unavailable' : 'Internal server error';
    res.status(status).json({ statusCode: status, message, requestId: req.requestId });
  }
}
