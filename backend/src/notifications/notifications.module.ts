import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushToken } from './push-token.entity';
import { Reminder } from './reminder.entity';
import { NotificationEvent } from './notification-event.entity';
import { NotificationFeedItem } from './notification-feed.entity';
import { Habit } from '../habits/habit.entity';
import { User } from '../users/user.entity';
import { ExpoPushClient } from './expo-push.client';
import { ReminderScheduler } from './reminder.scheduler';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([PushToken, Reminder, Habit, User, NotificationEvent, NotificationFeedItem]),
        HttpModule,
        AuthModule,
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService, ExpoPushClient, ReminderScheduler],
    exports: [NotificationsService],
})
export class NotificationsModule { }
