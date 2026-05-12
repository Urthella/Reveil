import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity()
export class NotificationEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    userId: string;

    @Index()
    @Column()
    eventType: string; // 'tap' | 'dismiss' | 'shown'

    @Column({ nullable: true })
    reminderId: string;

    @Column({ nullable: true })
    habitId: string;

    @CreateDateColumn()
    occurredAt: Date;
}
