import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorLog } from './error-log.entity';
import { AdminGuard } from '../insights/admin.guard';

@ApiTags('audit')
@ApiSecurity('admin-token')
@SkipThrottle()
@Controller('admin/errors')
@UseGuards(AdminGuard)
export class AuditController {
    constructor(
        @InjectRepository(ErrorLog) private readonly logs: Repository<ErrorLog>,
    ) { }

    @Get()
    async list(@Query('limit') limit?: string) {
        const n = limit ? Math.min(Number(limit), 200) : 50;
        return this.logs.find({
            order: { occurredAt: 'DESC' },
            take: n,
        });
    }
}
