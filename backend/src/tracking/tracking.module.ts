import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { HabitLog } from './habit-log.entity';
import { Habit } from '../habits/habit.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([HabitLog, Habit]), AuthModule],
    controllers: [TrackingController],
    providers: [TrackingService],
    exports: [TrackingService],
})
export class TrackingModule { }
