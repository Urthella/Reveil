import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
    @PrimaryColumn()
    id: string; // Firebase UID

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    displayName: string;

    @Column({ nullable: true })
    photoUrl: string;

    /** Quiet hours start (HH:mm, 24h). Reminders are suppressed between these. */
    @Column({ nullable: true })
    quietHoursStart: string;

    @Column({ nullable: true })
    quietHoursEnd: string;

    @Column({ default: 'en' })
    locale: string;

    /** Whether the Sunday weekly digest push + email is delivered. */
    @Column({ default: true })
    digestEnabled: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
