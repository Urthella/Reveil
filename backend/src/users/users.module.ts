import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserExportService } from './export.service';
import { User } from './user.entity';
import { Habit } from '../habits/habit.entity';
import { HabitLog } from '../tracking/habit-log.entity';
import { FeedbackLog } from '../feedback/feedback.entity';
import { Reminder } from '../notifications/reminder.entity';
import { PushToken } from '../notifications/push-token.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Habit, HabitLog, FeedbackLog, Reminder, PushToken]),
        AuthModule,
    ],
    providers: [UsersService, UserExportService],
    controllers: [UsersController],
    exports: [UsersService, UserExportService],
})
export class UsersModule { }
