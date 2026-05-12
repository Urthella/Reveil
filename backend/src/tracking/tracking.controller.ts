import { Controller, Delete, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { CreateLogDto } from './dto/create-log.dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('tracking')
@ApiBearerAuth()
@Controller('tracking')
@UseGuards(AuthGuard)
export class TrackingController {
    constructor(private readonly trackingService: TrackingService) { }

    @Post('log')
    logCompletion(@Body() createLogDto: CreateLogDto, @Request() req) {
        return this.trackingService.logCompletion(createLogDto, req.user.uid);
    }

    @Delete('log/:id')
    deleteLog(@Param('id') id: string, @Request() req) {
        return this.trackingService.deleteLog(id, req.user.uid);
    }

    @Get('history/:habitId')
    getHistory(@Param('habitId') habitId: string, @Request() req) {
        return this.trackingService.getHistory(habitId, req.user.uid);
    }
}
