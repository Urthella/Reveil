import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Habit {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column()
    frequency: string; // 'daily', 'weekly', etc.

    @Column({ default: 1 })
    targetCount: number;

    @Column({ nullable: true })
    timeOfDay: string; // 'morning', 'afternoon', 'evening'

    @Column({ default: 'general' })
    category: string; // 'health' | 'productivity' | 'mindfulness' | 'social' | 'recovery' | 'general'

    /** Paused habits stay in the DB but are hidden from default views and reminders. */
    @Column({ default: true })
    active: boolean;

    /** Optional ISO date (YYYY-MM-DD) until which the habit auto-pauses. The
     *  habits service auto-clears this and re-activates the habit once today
     *  is past the date. */
    @Column({ nullable: true })
    pausedUntil: string;

    /** Lower = higher in the list. Default 0 keeps newly created habits at the top
     *  when sorted ASC by sortIndex with createdAt as a tie-breaker. */
    @Column({ type: 'int', default: 0 })
    sortIndex: number;

    /** How many days per week the user wants to complete this habit (1..7).
     *  Default 7 matches the legacy "every day" assumption. Used to scale
     *  the consistency score so a 4×/week target hits 100% at 4/7 days. */
    @Column({ type: 'int', default: 7 })
    weeklyTarget: number;

    @ManyToOne(() => User, (user) => user.id)
    user: User;

    @Column()
    userId: string; // FK

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
