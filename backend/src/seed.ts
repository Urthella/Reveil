import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from './app.module';
import { User } from './users/user.entity';
import { Habit } from './habits/habit.entity';
import { HabitLog } from './tracking/habit-log.entity';
import { FeedbackLog } from './feedback/feedback.entity';

const DEMO_USER_ID = 'demo-user';
const DEMO_EMAIL = 'demo@reveil.app';

interface SeedHabit {
    title: string;
    description: string;
    frequency: 'daily' | 'weekly';
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
    completionRate: number; // 0..1 — share of last 30 days marked completed
}

const HABITS: SeedHabit[] = [
    {
        title: 'Daily Reading',
        description: 'Read at least 10 pages of any book.',
        frequency: 'daily',
        timeOfDay: 'evening',
        completionRate: 0.8,
    },
    {
        title: 'Morning Run',
        description: '20 minutes of light cardio after waking up.',
        frequency: 'daily',
        timeOfDay: 'morning',
        completionRate: 0.55,
    },
    {
        title: 'No Social Media',
        description: 'Stay off social platforms for the full day.',
        frequency: 'daily',
        timeOfDay: 'anytime',
        completionRate: 0.4,
    },
];

function isoDaysAgo(n: number): string {
    return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}

async function run() {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
    const log = new Logger('Seed');

    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const habitRepo = app.get<Repository<Habit>>(getRepositoryToken(Habit));
    const logRepo = app.get<Repository<HabitLog>>(getRepositoryToken(HabitLog));
    const feedbackRepo = app.get<Repository<FeedbackLog>>(getRepositoryToken(FeedbackLog));

    log.log('Resetting demo user…');
    const existingHabits = await habitRepo.find({ where: { userId: DEMO_USER_ID } });
    for (const h of existingHabits) {
        await logRepo.delete({ habitId: h.id });
    }
    await feedbackRepo.delete({ userId: DEMO_USER_ID });
    await habitRepo.delete({ userId: DEMO_USER_ID });
    await userRepo.delete({ id: DEMO_USER_ID });

    log.log('Creating demo user…');
    const user = await userRepo.save(
        userRepo.create({
            id: DEMO_USER_ID,
            email: DEMO_EMAIL,
            displayName: 'Reveil Demo',
        }),
    );

    log.log('Creating habits + 30 days of logs…');
    for (const seed of HABITS) {
        const habit = await habitRepo.save(
            habitRepo.create({
                title: seed.title,
                description: seed.description,
                frequency: seed.frequency,
                timeOfDay: seed.timeOfDay,
                userId: user.id,
            }),
        );

        const logs: HabitLog[] = [];
        for (let i = 0; i < 30; i++) {
            // Bias toward more recent days completing more often.
            const recencyBoost = (30 - i) / 60; // 0..0.5
            const probability = Math.min(1, seed.completionRate + recencyBoost - 0.25);
            if (Math.random() < probability) {
                logs.push(
                    logRepo.create({
                        habitId: habit.id,
                        userId: user.id,
                        date: isoDaysAgo(i),
                        completed: true,
                        moodScore: 5 + Math.floor(Math.random() * 5),
                    }),
                );
            }
        }
        await logRepo.save(logs);
        log.log(`  · ${seed.title}: ${logs.length}/30 days`);
    }

    log.log('Done. Demo user id: ' + DEMO_USER_ID);
    await app.close();
}

run().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', err);
    process.exit(1);
});
