import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Habit } from '../habits/habit.entity';
import { AuthModule } from '../auth/auth.module';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
    imports: [TypeOrmModule.forFeature([Habit]), AuthModule, TrackingModule],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }
