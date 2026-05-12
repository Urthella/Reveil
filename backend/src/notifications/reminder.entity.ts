import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Habit } from '../habits/habit.entity';

@Entity()
export class Reminder {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    userId: string;

    @Index()
    @Column({ nullable: true })
    habitId: string;

    @ManyToOne(() => Habit, { nullable: true, onDelete: 'CASCADE' })
    habit: Habit;

    @Column() // HH:mm 24h
    time: string;

    @Column({ default: '1,2,3,4,5,6,7' }) // ISO weekday list, 1=Mon..7=Sun
    weekdays: string;

    @Column({ default: true })
    enabled: boolean;

    @Column({ nullable: true })
    message: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
