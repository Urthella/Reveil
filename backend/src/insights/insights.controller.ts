import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiSecurity } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { InsightsService } from './insights.service';
import { AdminGuard } from './admin.guard';

@ApiTags('insights')
@ApiSecurity('admin-token')
@SkipThrottle()
@Controller('admin/insights')
@UseGuards(AdminGuard)
export class InsightsController {
    constructor(private readonly insights: InsightsService) { }

    @Get()
    get() {
        return this.insights.getPlatformInsights();
    }
}
