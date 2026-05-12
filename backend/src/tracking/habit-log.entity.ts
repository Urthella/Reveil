import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique, Index } from 'typeorm';
import { User } from '../users/user.entity';
import { Habit } from '../habits/habit.entity';

@Entity()
@Unique('UQ_habit_log_per_day', ['habitId', 'date'])
export class HabitLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    date: string; // YYYY-MM-DD

    @Column({ default: true })
    completed: boolean;

    /** True for "freeze days" — gaps the user explicitly protects (e.g. sick day).
     * Streak math walks past frozen days without breaking. */
    @Column({ default: false })
    frozen: boolean;

    @Column({ type: 'int', nullable: true })
    moodScore: number;

    @Column({ nullable: true })
    notes: string;

    @ManyToOne(() => User)
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Habit, { onDelete: 'CASCADE' })
    habit: Habit;

    @Index()
    @Column()
    habitId: string;

    @CreateDateColumn()
    createdAt: Date;
}
