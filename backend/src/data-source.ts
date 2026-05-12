import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './users/user.entity';
import { Habit } from './habits/habit.entity';
import { HabitLog } from './tracking/habit-log.entity';
import { FeedbackLog } from './feedback/feedback.entity';
import { PushToken } from './notifications/push-token.entity';
import { Reminder } from './notifications/reminder.entity';

const driver = (process.env.DB_DRIVER ?? 'sqlite').toLowerCase();

const entities = [User, Habit, HabitLog, FeedbackLog, PushToken, Reminder];
const migrations = [__dirname + '/migrations/*.{ts,js}'];

export const dataSourceOptions: DataSourceOptions = driver === 'postgres'
    ? {
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_NAME ?? 'reveil',
        entities,
        migrations,
        synchronize: false,
    }
    : {
        type: 'sqlite',
        database: process.env.DB_PATH ?? 'reveil.sqlite',
        entities,
        migrations,
        synchronize: false,
    };

export default new DataSource(dataSourceOptions);
