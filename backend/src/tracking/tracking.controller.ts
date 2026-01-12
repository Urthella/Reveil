import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { CreateLogDto } from './dto/create-log.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('tracking')
@UseGuards(AuthGuard)
export class TrackingController {
    constructor(private readonly trackingService: TrackingService) { }

    @Post('log')
    logCompletion(@Body() createLogDto: CreateLogDto, @Request() req) {
        return this.trackingService.logCompletion(createLogDto, req.user.uid);
    }

    @Get('history/:habitId')
    getHistory(@Param('habitId') habitId: string, @Request() req) {
        return this.trackingService.getHistory(habitId, req.user.uid);
    }
}
