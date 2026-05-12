import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HabitsService } from './habits.service';
import { HabitsController } from './habits.controller';
import { Habit } from './habit.entity';
import { HabitLog } from '../tracking/habit-log.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([Habit, HabitLog]), AuthModule],
    controllers: [HabitsController],
    providers: [HabitsService],
})
export class HabitsModule { }
