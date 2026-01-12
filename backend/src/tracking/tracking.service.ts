import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HabitLog } from './habit-log.entity';
import { CreateLogDto } from './dto/create-log.dto';

@Injectable()
export class TrackingService {
    constructor(
        @InjectRepository(HabitLog)
        private logsRepository: Repository<HabitLog>,
    ) { }

    async logCompletion(createLogDto: CreateLogDto, userId: string): Promise<HabitLog> {
        const log = this.logsRepository.create({
            ...createLogDto,
            userId,
        });
        return this.logsRepository.save(log);
    }

    async getHistory(habitId: string, userId: string): Promise<HabitLog[]> {
        return this.logsRepository.find({
            where: { habitId, userId },
            order: { date: 'DESC' },
        });
    }
}
