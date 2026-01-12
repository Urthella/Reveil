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

    @ManyToOne(() => User, (user) => user.id)
    user: User;

    @Column()
    userId: string; // FK

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
