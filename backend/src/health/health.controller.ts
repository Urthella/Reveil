import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('health')
@SkipThrottle()
@Controller()
export class HealthController {
    private readonly startedAt = Date.now();
    private readonly version = process.env.APP_VERSION || '1.0.0';

    constructor(@InjectDataSource() private readonly ds: DataSource) { }

    @Get('health')
    async health() {
        let dbOk = false;
        try {
            await this.ds.query('SELECT 1');
            dbOk = true;
        } catch {
            dbOk = false;
        }
        return {
            status: dbOk ? 'ok' : 'degraded',
            db: dbOk,
            uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
            timestamp: new Date().toISOString(),
        };
    }

    @Get('version')
    version_() {
        return {
            name: 'reveil-backend',
            version: this.version,
            node: process.version,
        };
    }
}
