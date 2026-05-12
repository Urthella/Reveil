import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

/**
 * Initial Reveil schema. Driver-aware so the same migration works on
 * SQLite (dev) and Postgres (prod). Use this with `DB_SYNC=false`.
 */
export class InitialSchema1746300000000 implements MigrationInterface {
    name = 'InitialSchema1746300000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPg = queryRunner.connection.driver.options.type === 'postgres';
        const uuid = isPg ? 'uuid' : 'varchar';
        const text = isPg ? 'text' : 'text';

        await queryRunner.createTable(new Table({
            name: 'user',
            columns: [
                { name: 'id', type: 'varchar', isPrimary: true },
                { name: 'email', type: 'varchar', isUnique: true },
                { name: 'displayName', type: 'varchar', isNullable: true },
                { name: 'photoUrl', type: 'varchar', isNullable: true },
                { name: 'createdAt', type: isPg ? 'timestamp' : 'datetime', default: isPg ? 'now()' : 'CURRENT_TIMESTAMP' },
                { name: 'updatedAt', type: isPg ? 'timestamp' : 'datetime', default: isPg ? 'now()' : 'CURRENT_TIMESTAMP' },
            ],
        }));

        await queryRunner.createTable(new Table({
            name: 'habit',
            columns: [
                { name: 'id', type: uuid, isPrimary: true },
                { name: 'title', type: 'varchar' },
                { name: 'description', type: 'varchar', isNullable: true },
                { name: 'frequency', type: 'varchar' },
                { name: 'targetCount', type: 'int', default: 1 },
                { name: 'timeOfDay', type: 'varchar', isNullable: true },
                { name: 'userId', type: 'varchar' },
                { name: 'createdAt', type: isPg ? 'timestamp' : 'datetime', default: isPg ? 'now()' : 'CURRENT_TIMESTAMP' },
                { name: 'updatedAt', type: isPg ? 'timestamp' : 'datetime', default: isPg ? 'now()' : 'CURRENT_TIMESTAMP' },
            ],
        }));

        await queryRunner.createTable(new Table({
            name: 'habit_log',
            columns: [
                { name: 'id', type: uuid, isPrimary: true },
                { name: 'date', type: 'varchar' },
                { name: 'completed', type: 'boolean', default: true },
                { name: 'moodScore', type: 'int', isNullable: true },
                { name: 'notes', type: 'varchar', isNullable: true },
                { name: 'userId', type: 'varchar' },
                { name: 'habitId', type: uuid },
                { name: 'createdAt', type: isPg ? 'timestamp' : 'datetime', default: isPg ? 'now()' : 'CURRENT_TIMESTAMP' },
            ],
        }));
        await queryRunner.createUniqueConstraint('habit_log', new TableUnique({
            name: 'UQ_habit_log_per_day',
            columnNames: ['habitId', 'date'],
        }));
        await queryRunner.createIndex('habit_log', new TableIndex({ columnNames: ['date'] }));
        await queryRunner.createIndex('habit_log', new TableIndex({ columnNames: ['habitId'] }));

        await queryRunner.createTable(new Table({
            name: 'feedback_log',
            columns: [
                { name: 'id', type: uuid, isPrimary: true },
                { name: 'userId', type: 'varchar' },
                { name: 'habitId', type: uuid, isNullable: true },
                { name: 'feedbackText', type: text },
                { name: 'source', type: 'varchar', default: "'rule'" },
                { name: 'consistencyScore', type: 'int', default: 0 },
                { name: 'streak', type: 'int', default: 0 },
                { name: 'generatedAt', type: isPg ? 'timestamp' : 'datetime', default: isPg ? 'now()' : 'CURRENT_TIMESTAMP' },
            ],
        }));
        await queryRunner.createIndex('feedback_log', new TableIndex({ columnNames: ['userId'] }));
        await queryRunner.createIndex('feedback_log', new TableIndex({ columnNames: ['habitId'] }));

        await queryRunner.createTable(new Table({
            name: 'push_token',
            columns: [
                { name: 'id', type: uuid, isPrimary: true },
                { name: 'userId', type: 'varchar' },
                { name: 'token', type: 'varchar' },
                { name: 'platform', type: 'varchar', default: "'expo'" },
                { name: 'createdAt', type: isPg ? 'timestamp' : 'datetime', default: isPg ? 'now()' : 'CURRENT_TIMESTAMP' },
                { name: 'updatedAt', type: isPg ? 'timestamp' : 'datetime', default: isPg ? 'now()' : 'CURRENT_TIMESTAMP' },
            ],
        }));
        await queryRunner.createUniqueConstraint('push_token', new TableUnique({
            name: 'UQ_push_token_per_user',
            columnNames: ['userId', 'token'],
        }));
        await queryRunner.createIndex('push_token', new TableIndex({ columnNames: ['userId'] }));

        await queryRunner.createTable(new Table({
            name: 'reminder',
            columns: [
                { name: 'id', type: uuid, isPrimary: true },
                { name: 'userId', type: 'varchar' },
                { name: 'habitId', type: uuid, isNullable: true },
                { name: 'time', type: 'varchar' },
                { name: 'weekdays', type: 'varchar', default: "'1,2,3,4,5,6,7'" },
                { name: 'enabled', type: 'boolean', default: true },
                { name: 'message', type: 'varchar', isNullable: true },
                { name: 'createdAt', type: isPg ? 'timestamp' : 'datetime', default: isPg ? 'now()' : 'CURRENT_TIMESTAMP' },
                { name: 'updatedAt', type: isPg ? 'timestamp' : 'datetime', default: isPg ? 'now()' : 'CURRENT_TIMESTAMP' },
            ],
        }));
        await queryRunner.createIndex('reminder', new TableIndex({ columnNames: ['userId'] }));
        await queryRunner.createIndex('reminder', new TableIndex({ columnNames: ['habitId'] }));

        // Foreign keys (Postgres only — SQLite enforces via PRAGMA which is off by default).
        if (isPg) {
            await queryRunner.createForeignKey('habit', new TableForeignKey({
                columnNames: ['userId'],
                referencedTableName: 'user',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }));
            await queryRunner.createForeignKey('habit_log', new TableForeignKey({
                columnNames: ['habitId'],
                referencedTableName: 'habit',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }));
            await queryRunner.createForeignKey('feedback_log', new TableForeignKey({
                columnNames: ['habitId'],
                referencedTableName: 'habit',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }));
            await queryRunner.createForeignKey('push_token', new TableForeignKey({
                columnNames: ['userId'],
                referencedTableName: 'user',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }));
            await queryRunner.createForeignKey('reminder', new TableForeignKey({
                columnNames: ['habitId'],
                referencedTableName: 'habit',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('reminder');
        await queryRunner.dropTable('push_token');
        await queryRunner.dropTable('feedback_log');
        await queryRunner.dropTable('habit_log');
        await queryRunner.dropTable('habit');
        await queryRunner.dropTable('user');
    }
}
