import { Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthGuard } from '../auth/auth.guard';
import { DigestService } from './digest.service';
import { DigestScheduler } from './digest.scheduler';
import { AdminGuard } from '../insights/admin.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@ApiTags('digest')
@Controller('digest')
export class DigestController {
    constructor(
        private readonly digest: DigestService,
        private readonly scheduler: DigestScheduler,
        @InjectRepository(User) private readonly users: Repository<User>,
    ) { }

    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @Get('weekly')
    async weekly(@Request() req, @Query('locale') queryLocale?: string) {
        const user = await this.users.findOne({ where: { id: req.user.uid } });
        const headerLocale = (req.headers['accept-language'] as string | undefined)?.split(',')[0]?.toLowerCase();
        const locale: 'en' | 'tr' =
            (queryLocale === 'tr' || queryLocale === 'en' ? queryLocale : null) ??
            (user?.locale === 'tr' ? 'tr' : null) ??
            (headerLocale?.startsWith('tr') ? 'tr' : 'en');
        return this.digest.buildForUser(req.user.uid, locale);
    }

    /** Admin-only manual trigger — fan out the weekly digest push immediately. */
    @ApiSecurity('admin-token')
    @SkipThrottle()
    @UseGuards(AdminGuard)
    @Post('run-now')
    runNow() {
        return this.scheduler.runOnce();
    }
}
