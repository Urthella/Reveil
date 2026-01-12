import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit } from './habit.entity';
import { CreateHabitDto } from './dto/create-habit.dto';

@Injectable()
export class HabitsService {
    constructor(
        @InjectRepository(Habit)
        private habitsRepository: Repository<Habit>,
    ) { }

    async create(createHabitDto: CreateHabitDto, userId: string): Promise<Habit> {
        const habit = this.habitsRepository.create({
            ...createHabitDto,
            userId,
        });
        return this.habitsRepository.save(habit);
    }

    async findAll(userId: string): Promise<Habit[]> {
        return this.habitsRepository.find({ where: { userId } });
    }

    async findOne(id: string, userId: string): Promise<Habit | null> {
        return this.habitsRepository.findOne({ where: { id, userId } });
    }

    async remove(id: string, userId: string): Promise<void> {
        await this.habitsRepository.delete({ id, userId });
    }
}
