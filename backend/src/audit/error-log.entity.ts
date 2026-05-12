import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity()
export class ErrorLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ nullable: true })
    userId: string;

    @Column({ type: 'int' })
    statusCode: number;

    @Column()
    method: string;

    @Column()
    path: string;

    @Column('text')
    message: string;

    @Column('text', { nullable: true })
    stack: string;

    @CreateDateColumn()
    occurredAt: Date;
}
