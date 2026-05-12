import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { NotificationsService } from './notifications.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { LogNotificationEventDto } from './dto/log-event.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
    constructor(private readonly service: NotificationsService) { }

    @Post('token')
    registerToken(@Body() dto: RegisterTokenDto, @Request() req) {
        return this.service.registerToken(req.user.uid, dto);
    }

    @Get('reminders')
    listReminders(@Request() req) {
        return this.service.listReminders(req.user.uid);
    }

    @Post('reminders')
    createReminder(@Body() dto: CreateReminderDto, @Request() req) {
        return this.service.createReminder(req.user.uid, dto);
    }

    @Delete('reminders/:id')
    deleteReminder(@Param('id') id: string, @Request() req) {
        return this.service.deleteReminder(req.user.uid, id);
    }

    @Post('test')
    sendTest(@Request() req, @Body() body: { title?: string; body?: string }) {
        return this.service.sendTestPush(
            req.user.uid,
            body?.title ?? 'Reveil',
            body?.body ?? 'A gentle nudge — keep your streak going today.',
        );
    }

    @Post('events')
    logEvent(@Body() dto: LogNotificationEventDto, @Request() req) {
        return this.service.logEvent(req.user.uid, dto);
    }

    @Get('feed')
    feed(@Request() req) {
        return this.service.listFeed(req.user.uid);
    }
}
