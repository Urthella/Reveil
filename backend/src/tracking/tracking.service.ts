import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HabitLog } from './habit-log.entity';
import { CreateLogDto } from './dto/create-log.dto';
import { Habit } from '../habits/habit.entity';

@Injectable()
export class TrackingService {
    constructor(
        @InjectRepository(HabitLog)
        private logsRepository: Repository<HabitLog>,
        @InjectRepository(Habit)
        private habitsRepository: Repository<Habit>,
    ) { }

    async logCompletion(dto: CreateLogDto, userId: string): Promise<HabitLog> {
        const habit = await this.habitsRepository.findOne({ where: { id: dto.habitId } });
        if (!habit) throw new NotFoundException('Habit not found');
        if (habit.userId !== userId) throw new ForbiddenException();

        const existing = await this.logsRepository.findOne({
            where: { habitId: dto.habitId, date: dto.date },
        });

        // Enforce a 1-freeze-per-rolling-7-days budget per habit. Editing an
        // already-frozen day on the same date is fine; only NEW freezes count.
        if (dto.frozen === true && !existing?.frozen) {
            const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
            const recentFreezes = await this.logsRepository
                .createQueryBuilder('log')
                .where('log.habitId = :habitId', { habitId: dto.habitId })
                .andWhere('log.frozen = :frozen', { frozen: true })
                .andWhere('log.date >= :since', { since: sevenDaysAgo })
                .andWhere('log.date < :date', { date: dto.date })
                .getCount();
            if (recentFreezes >= 1) {
                throw new BadRequestException(
                    'You have already used your freeze for this week. Try again in a few days.',
                );
            }
        }

        if (existing) {
            existing.completed = dto.completed ?? existing.completed;
            existing.frozen = dto.frozen ?? existing.frozen;
            existing.moodScore = dto.moodScore ?? existing.moodScore;
            existing.notes = dto.notes ?? existing.notes;
            return this.logsRepository.save(existing);
        }

        const log = this.logsRepository.create({
            habitId: dto.habitId,
            userId,
            date: dto.date,
            completed: dto.completed ?? true,
            frozen: dto.frozen ?? false,
            moodScore: dto.moodScore,
            notes: dto.notes,
        });
        return this.logsRepository.save(log);
    }

    async deleteLog(id: string, userId: string): Promise<{ deleted: true }> {
        const log = await this.logsRepository.findOne({ where: { id } });
        if (!log) throw new NotFoundException('Log not found');
        if (log.userId !== userId) throw new ForbiddenException();
        await this.logsRepository.delete({ id });
        return { deleted: true };
    }

    async getHistory(habitId: string, userId: string): Promise<HabitLog[]> {
        return this.logsRepository.find({
            where: { habitId, userId },
            order: { date: 'DESC' },
        });
    }

    async getRecentLogs(userId: string, sinceDate: string): Promise<HabitLog[]> {
        return this.logsRepository
            .createQueryBuilder('log')
            .where('log.userId = :userId', { userId })
            .andWhere('log.date >= :sinceDate', { sinceDate })
            .orderBy('log.date', 'DESC')
            .getMany();
    }
}
