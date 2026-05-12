import { Body, Controller, Get, Header, Param, Patch, Post, Query, Request, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { FeedbackService } from './feedback.service';
import { GenerateFeedbackDto } from './dto/generate-feedback.dto';
import { RateFeedbackDto } from './dto/rate-feedback.dto';
import { ShareCardService } from './share-card.service';

@ApiTags('ai-feedback')
@ApiBearerAuth()
@Controller('ai/feedback')
@UseGuards(AuthGuard)
export class FeedbackController {
    constructor(
        private readonly feedbackService: FeedbackService,
        private readonly shareCard: ShareCardService,
    ) { }

    @Get('share/:habitId.svg')
    @Header('Content-Type', 'image/svg+xml')
    async shareCardSvg(
        @Param('habitId') habitId: string,
        @Request() req,
        @Query('locale') locale: string | undefined,
        @Res() res: Response,
    ) {
        const loc: 'en' | 'tr' = locale === 'tr' ? 'tr' : 'en';
        const svg = await this.shareCard.renderHabitCard(req.user.uid, habitId, loc);
        res.send(svg);
    }

    @Post()
    @Throttle({ ai: { limit: 5, ttl: 60_000 } })
    generate(@Body() dto: GenerateFeedbackDto, @Request() req) {
        const headerLocale = (req.headers['accept-language'] as string | undefined)?.split(',')[0]?.toLowerCase();
        const locale: 'en' | 'tr' =
            dto.locale ?? (headerLocale?.startsWith('tr') ? 'tr' : 'en');
        return this.feedbackService.generate(req.user.uid, dto.habitId, locale, dto.tone);
    }

    @Get()
    history(@Request() req, @Query('limit') limit?: string) {
        const n = limit ? Math.min(Number(limit), 100) : 20;
        return this.feedbackService.listForUser(req.user.uid, n);
    }

    @Patch(':id/rating')
    rate(@Param('id') id: string, @Body() dto: RateFeedbackDto, @Request() req) {
        return this.feedbackService.rate(req.user.uid, id, dto.rating);
    }
}
