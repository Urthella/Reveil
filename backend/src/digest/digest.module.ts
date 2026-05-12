import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { DigestService } from './digest.service';
import { DigestController } from './digest.controller';
import { DigestScheduler } from './digest.scheduler';
import { EmailClient } from './email.client';
import { Habit } from '../habits/habit.entity';
import { HabitLog } from '../tracking/habit-log.entity';
import { User } from '../users/user.entity';
import { PushToken } from '../notifications/push-token.entity';
import { NotificationFeedItem } from '../notifications/notification-feed.entity';
import { ExpoPushClient } from '../notifications/expo-push.client';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../insights/admin.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([Habit, HabitLog, User, PushToken, NotificationFeedItem]),
        HttpModule,
        AuthModule,
    ],
    providers: [DigestService, DigestScheduler, ExpoPushClient, EmailClient, AdminGuard],
    controllers: [DigestController],
    exports: [DigestService, DigestScheduler],
})
export class DigestModule { }
