import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { ErrorLog } from './error-log.entity';
import { ErrorLogFilter } from './error-log.filter';
import { AuditController } from './audit.controller';
import { AdminGuard } from '../insights/admin.guard';

@Module({
    imports: [TypeOrmModule.forFeature([ErrorLog])],
    controllers: [AuditController],
    providers: [
        AdminGuard,
        ErrorLogFilter,
        { provide: APP_FILTER, useClass: ErrorLogFilter },
    ],
})
export class AuditModule { }
