import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Habit } from '../habits/habit.entity';
import { HabitLog } from '../tracking/habit-log.entity';
import { FeedbackLog } from '../feedback/feedback.entity';
import { NotificationEvent } from '../notifications/notification-event.entity';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';
import { AdminGuard } from './admin.guard';

@Module({
    imports: [TypeOrmModule.forFeature([User, Habit, HabitLog, FeedbackLog, NotificationEvent])],
    controllers: [InsightsController],
    providers: [InsightsService, AdminGuard],
})
export class InsightsModule { }
