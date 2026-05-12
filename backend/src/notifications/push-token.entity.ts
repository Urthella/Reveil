import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, Unique, Index } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
@Unique('UQ_push_token_per_user', ['userId', 'token'])
export class PushToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;

    @Column()
    token: string; // Expo push token

    @Column({ default: 'expo' })
    platform: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
