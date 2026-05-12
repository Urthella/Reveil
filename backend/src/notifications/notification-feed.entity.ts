import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity()
export class NotificationFeedItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    userId: string;

    @Column()
    title: string;

    @Column('text')
    body: string;

    @Column()
    kind: string; // 'reminder' | 'digest' | 'test'

    @Column({ nullable: true })
    habitId: string;

    @CreateDateColumn()
    sentAt: Date;
}
