import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit } from './habit.entity';
import { HabitLog } from '../tracking/habit-log.entity';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';

@Injectable()
export class HabitsService {
    constructor(
        @InjectRepository(Habit)
        private habitsRepository: Repository<Habit>,
        @InjectRepository(HabitLog)
        private logsRepository: Repository<HabitLog>,
    ) { }

    async create(createHabitDto: CreateHabitDto, userId: string): Promise<Habit> {
        const habit = this.habitsRepository.create({
            ...createHabitDto,
            userId,
        });
        return this.habitsRepository.save(habit);
    }

    async findAll(
        userId: string,
        category?: string,
        includePaused = false,
        q?: string,
    ): Promise<Habit[]> {
        await this.autoResumeExpiredPauses(userId);
        const qb = this.habitsRepository
            .createQueryBuilder('h')
            .where('h.userId = :userId', { userId });
        if (category) qb.andWhere('h.category = :category', { category });
        if (!includePaused) {
            qb.andWhere('h.active = :active', { active: true });
            const today = new Date().toISOString().slice(0, 10);
            qb.andWhere('(h.pausedUntil IS NULL OR h.pausedUntil <= :today)', { today });
        }
        if (q && q.trim().length > 0) {
            const needle = `%${q.trim().toLowerCase()}%`;
            // Find habit IDs whose recent log notes contain the needle, then OR
            // that into the title match. Two queries keep the SQL portable
            // across SQLite (no ILIKE) and Postgres.
            const habitIdsByNote: { habitId: string }[] = await this.logsRepository
                .createQueryBuilder('log')
                .select('DISTINCT log.habitId', 'habitId')
                .where('log.userId = :userId', { userId })
                .andWhere('log.notes IS NOT NULL')
                .andWhere('LOWER(log.notes) LIKE :needle', { needle })
                .getRawMany();
            const matchingIds = habitIdsByNote.map((r) => r.habitId);
            qb.andWhere(
                matchingIds.length > 0
                    ? '(LOWER(h.title) LIKE :needle OR h.id IN (:...matchingIds))'
                    : 'LOWER(h.title) LIKE :needle',
                { needle, matchingIds },
            );
        }
        qb.orderBy('h.sortIndex', 'ASC').addOrderBy('h.createdAt', 'DESC');
        return qb.getMany();
    }

    /** Clears `pausedUntil` and re-activates habits whose pause window has ended. */
    private async autoResumeExpiredPauses(userId: string): Promise<void> {
        const today = new Date().toISOString().slice(0, 10);
        const due = await this.habitsRepository
            .createQueryBuilder('h')
            .where('h.userId = :userId', { userId })
            .andWhere('h.pausedUntil IS NOT NULL')
            .andWhere('h.pausedUntil <= :today', { today })
            .getMany();
        for (const habit of due) {
            habit.pausedUntil = null as any;
            habit.active = true;
            await this.habitsRepository.save(habit);
        }
    }

    async reorder(userId: string, items: { id: string; sortIndex: number }[]): Promise<{ updated: number }> {
        if (!items?.length) return { updated: 0 };
        // Verify ownership in bulk so callers can't reorder someone else's habits.
        const ids = items.map((i) => i.id);
        const owned = await this.habitsRepository.find({ where: ids.map((id) => ({ id, userId })) });
        const ownedIds = new Set(owned.map((h) => h.id));
        let updated = 0;
        for (const item of items) {
            if (!ownedIds.has(item.id)) continue;
            await this.habitsRepository.update({ id: item.id }, { sortIndex: item.sortIndex });
            updated++;
        }
        return { updated };
    }

    async findOne(id: string, userId: string): Promise<Habit> {
        const habit = await this.habitsRepository.findOne({ where: { id } });
        if (!habit) throw new NotFoundException('Habit not found');
        if (habit.userId !== userId) throw new ForbiddenException();
        return habit;
    }

    async update(id: string, userId: string, dto: UpdateHabitDto): Promise<Habit> {
        const habit = await this.findOne(id, userId);
        Object.assign(habit, dto);
        // Setting pausedUntil to a future date implies the habit is paused; clearing it resumes.
        if (dto.pausedUntil !== undefined) {
            const today = new Date().toISOString().slice(0, 10);
            if (dto.pausedUntil && dto.pausedUntil > today) {
                habit.active = false;
            } else if (dto.pausedUntil == null) {
                // If the caller didn't also explicitly set `active`, infer resume.
                if (dto.active === undefined) habit.active = true;
                habit.pausedUntil = null as any;
            }
        }
        return this.habitsRepository.save(habit);
    }

    async remove(id: string, userId: string): Promise<{ deleted: true }> {
        await this.findOne(id, userId);
        await this.habitsRepository.delete({ id });
        return { deleted: true };
    }
}
