import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { User } from '../users/user.entity';
import { Habit } from '../habits/habit.entity';

@Entity()
export class FeedbackLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    userId: string;

    @ManyToOne(() => User)
    user: User;

    @Index()
    @Column({ nullable: true })
    habitId: string;

    @ManyToOne(() => Habit, { nullable: true, onDelete: 'SET NULL' })
    habit: Habit;

    @Column('text')
    feedbackText: string;

    @Column({ default: 'rule' })
    source: string; // 'openai' | 'rule'

    @Column({ type: 'int', default: 0 })
    consistencyScore: number;

    @Column({ type: 'int', default: 0 })
    streak: number;

    /** -1 = thumbs down, 0 = unrated, 1 = thumbs up */
    @Column({ type: 'int', default: 0 })
    rating: number;

    @CreateDateColumn()
    generatedAt: Date;
}
