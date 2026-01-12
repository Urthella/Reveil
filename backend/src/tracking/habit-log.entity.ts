import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Habit } from '../habits/habit.entity';

@Entity()
export class HabitLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    date: string; // YYYY-MM-DD

    @Column({ default: true })
    completed: boolean;

    @Column({ nullable: true })
    moodScore: number; // 1-10

    @Column({ nullable: true })
    notes: string;

    @ManyToOne(() => User)
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Habit)
    habit: Habit;

    @Column()
    habitId: string;

    @CreateDateColumn()
    createdAt: Date;
}
