import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, Response } from 'express';
import { ErrorLog } from './error-log.entity';
import { captureException } from './sentry';

/**
 * Catches every thrown exception, persists 5xx (and any unhandled error) to
 * the audit log, then mirrors NestJS's default response shape to the client.
 *
 * 4xx errors are not persisted — they're noise from validation, unauth
 * attempts, etc., and would drown out the signal.
 */
@Catch()
export class ErrorLogFilter implements ExceptionFilter {
    private readonly logger = new Logger('ErrorLogFilter');

    constructor(
        @InjectRepository(ErrorLog) private readonly logs: Repository<ErrorLog>,
    ) { }

    async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();
        const req = ctx.getRequest<Request>();

        const isHttp = exception instanceof HttpException;
        const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        const message = isHttp
            ? (exception.getResponse() as any)?.message ?? exception.message
            : (exception as Error)?.message ?? 'Internal error';
        const stack = (exception as Error)?.stack;

        if (status >= 500) {
            try {
                await this.logs.save(
                    this.logs.create({
                        userId: (req as any)?.user?.uid ?? undefined,
                        statusCode: status,
                        method: req.method,
                        path: req.originalUrl ?? req.url,
                        message: typeof message === 'string' ? message : JSON.stringify(message),
                        stack: stack ?? undefined,
                    }),
                );
            } catch (err: any) {
                this.logger.error(`Failed to persist error log: ${err.message}`);
            }
            this.logger.error(`${req.method} ${req.url} → ${status}: ${message}`);
            captureException(exception, {
                method: req.method,
                path: req.originalUrl ?? req.url,
                userId: (req as any)?.user?.uid,
                statusCode: status,
            });
        }

        res.status(status).json({
            statusCode: status,
            message,
            ...(isHttp ? {} : { error: 'Internal Server Error' }),
        });
    }
}
