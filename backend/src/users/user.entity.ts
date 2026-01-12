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

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
