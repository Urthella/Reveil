import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

function csvEscape(value: string): string {
    if (/[",\n\r]/.test(value)) return '"' + value.replace(/"/g, '""') + '"';
    return value;
}

/** Minimal RFC-4180 CSV parser: handles quoted fields, escaped quotes, and CRLF/LF. */
export function parseCsv(input: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < input.length; i++) {
        const c = input[i];
        if (inQuotes) {
            if (c === '"') {
                if (input[i + 1] === '"') { field += '"'; i++; }
                else inQuotes = false;
            } else {
                field += c;
            }
            continue;
        }
        if (c === '"') { inQuotes = true; continue; }
        if (c === ',') { row.push(field); field = ''; continue; }
        if (c === '\r') continue; // ignore CR
        if (c === '\n') {
            row.push(field);
            field = '';
            if (row.length > 1 || row[0] !== '') rows.push(row);
            row = [];
            continue;
        }
        field += c;
    }
    if (field !== '' || row.length > 0) {
        row.push(field);
        if (row.length > 1 || row[0] !== '') rows.push(row);
    }
    return rows;
}
import { User } from './user.entity';
import { Habit } from '../habits/habit.entity';
import { HabitLog } from '../tracking/habit-log.entity';
import { FeedbackLog } from '../feedback/feedback.entity';
import { Reminder } from '../notifications/reminder.entity';
import { PushToken } from '../notifications/push-token.entity';

@Injectable()
export class UserExportService {
    constructor(
        @InjectRepository(User) private readonly users: Repository<User>,
        @InjectRepository(Habit) private readonly habits: Repository<Habit>,
        @InjectRepository(HabitLog) private readonly logs: Repository<HabitLog>,
        @InjectRepository(FeedbackLog) private readonly feedback: Repository<FeedbackLog>,
        @InjectRepository(Reminder) private readonly reminders: Repository<Reminder>,
        @InjectRepository(PushToken) private readonly tokens: Repository<PushToken>,
    ) { }

    async exportFor(userId: string) {
        const [user, habits, logs, feedback, reminders, tokens] = await Promise.all([
            this.users.findOne({ where: { id: userId } }),
            this.habits.find({ where: { userId } }),
            this.logs.find({ where: { userId }, order: { date: 'DESC' } }),
            this.feedback.find({ where: { userId }, order: { generatedAt: 'DESC' } }),
            this.reminders.find({ where: { userId } }),
            this.tokens.find({ where: { userId } }),
        ]);

        return {
            exportedAt: new Date().toISOString(),
            schemaVersion: 1,
            user,
            habits,
            habitLogs: logs,
            aiFeedback: feedback,
            reminders,
            pushTokens: tokens.map((t) => ({
                id: t.id,
                platform: t.platform,
                createdAt: t.createdAt,
                // token deliberately omitted — sensitive
            })),
            counts: {
                habits: habits.length,
                habitLogs: logs.length,
                aiFeedback: feedback.length,
                reminders: reminders.length,
                pushTokens: tokens.length,
            },
        };
    }

    async exportCsv(userId: string): Promise<string> {
        const [habits, logs] = await Promise.all([
            this.habits.find({ where: { userId } }),
            this.logs.find({ where: { userId } }),
        ]);
        const habitById = new Map(habits.map((h) => [h.id, h]));
        const rows = [
            ['date', 'habit_id', 'habit_title', 'category', 'completed', 'frozen', 'mood_score', 'notes'],
            ...logs.map((l) => {
                const h = habitById.get(l.habitId);
                return [
                    l.date,
                    l.habitId,
                    h?.title ?? '',
                    h?.category ?? '',
                    String(!!l.completed),
                    String(!!l.frozen),
                    l.moodScore != null ? String(l.moodScore) : '',
                    l.notes ?? '',
                ];
            }),
        ];
        return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
    }

    /**
     * Replace the user's data with the contents of an export bundle. Validates
     * shape and ownership; only the authenticated user's `userId` is honored —
     * any inconsistent rows are silently dropped to prevent cross-account writes.
     */
    async importFor(userId: string, payload: any): Promise<{ habits: number; logs: number; feedback: number; reminders: number }> {
        if (!payload || typeof payload !== 'object') {
            throw new Error('Payload must be an object');
        }
        if (typeof payload.schemaVersion !== 'number') {
            throw new Error('Missing schemaVersion');
        }

        // Wipe the user's current rows in dependency order.
        await this.tokens.delete({ userId });
        await this.feedback.delete({ userId });
        await this.reminders.delete({ userId });
        const existing = await this.habits.find({ where: { userId } });
        for (const h of existing) await this.logs.delete({ habitId: h.id });
        await this.habits.delete({ userId });

        // Habits
        const incomingHabits: any[] = Array.isArray(payload.habits) ? payload.habits : [];
        const ownedHabitIds = new Set<string>();
        for (const h of incomingHabits) {
            if (!h?.id || typeof h.title !== 'string') continue;
            ownedHabitIds.add(h.id);
            await this.habits.save(this.habits.create({
                id: h.id,
                userId,
                title: h.title,
                description: h.description ?? undefined,
                frequency: h.frequency ?? 'daily',
                targetCount: typeof h.targetCount === 'number' ? h.targetCount : 1,
                timeOfDay: h.timeOfDay ?? undefined,
                category: h.category ?? 'general',
                active: h.active !== false,
                sortIndex: typeof h.sortIndex === 'number' ? h.sortIndex : 0,
            }));
        }

        // Logs (only for habits we just imported, keyed by date for idempotency)
        const incomingLogs: any[] = Array.isArray(payload.habitLogs) ? payload.habitLogs : [];
        let logCount = 0;
        for (const l of incomingLogs) {
            if (!l?.habitId || !ownedHabitIds.has(l.habitId)) continue;
            if (typeof l.date !== 'string') continue;
            await this.logs.save(this.logs.create({
                userId,
                habitId: l.habitId,
                date: l.date,
                completed: l.completed !== false,
                frozen: !!l.frozen,
                moodScore: typeof l.moodScore === 'number' ? l.moodScore : undefined,
                notes: l.notes ?? undefined,
            }));
            logCount++;
        }

        // AI feedback
        const incomingFeedback: any[] = Array.isArray(payload.aiFeedback) ? payload.aiFeedback : [];
        let feedbackCount = 0;
        for (const f of incomingFeedback) {
            if (typeof f?.feedbackText !== 'string') continue;
            await this.feedback.save(this.feedback.create({
                userId,
                habitId: f.habitId && ownedHabitIds.has(f.habitId) ? f.habitId : undefined,
                feedbackText: f.feedbackText,
                source: ['claude', 'openai', 'rule'].includes(f.source) ? f.source : 'rule',
                consistencyScore: typeof f.consistencyScore === 'number' ? f.consistencyScore : 0,
                streak: typeof f.streak === 'number' ? f.streak : 0,
                rating: f.rating === 1 || f.rating === -1 ? f.rating : 0,
            }));
            feedbackCount++;
        }

        // Reminders
        const incomingReminders: any[] = Array.isArray(payload.reminders) ? payload.reminders : [];
        let reminderCount = 0;
        for (const r of incomingReminders) {
            if (typeof r?.time !== 'string') continue;
            await this.reminders.save(this.reminders.create({
                userId,
                habitId: r.habitId && ownedHabitIds.has(r.habitId) ? r.habitId : undefined,
                time: r.time,
                weekdays: typeof r.weekdays === 'string' ? r.weekdays : '1,2,3,4,5,6,7',
                enabled: r.enabled !== false,
                message: r.message ?? undefined,
            }));
            reminderCount++;
        }

        return {
            habits: ownedHabitIds.size,
            logs: logCount,
            feedback: feedbackCount,
            reminders: reminderCount,
        };
    }

    /**
     * Import a CSV produced by `exportCsv`. Looks up habits by title (case-insensitive);
     * creates missing ones with sensible defaults. Existing rows for the same
     * (habit, date) are upserted. Reports per-row outcomes.
     */
    async importCsv(userId: string, csv: string): Promise<{ habitsCreated: number; logsUpserted: number; skipped: number }> {
        if (typeof csv !== 'string' || !csv.trim()) {
            throw new Error('CSV body is empty');
        }
        const rows = parseCsv(csv);
        if (rows.length === 0) return { habitsCreated: 0, logsUpserted: 0, skipped: 0 };
        const header = rows[0].map((c) => c.toLowerCase());
        const idx = (name: string) => header.indexOf(name);
        const dateI = idx('date');
        const titleI = idx('habit_title');
        const completedI = idx('completed');
        const frozenI = idx('frozen');
        const moodI = idx('mood_score');
        const notesI = idx('notes');
        const categoryI = idx('category');
        if (dateI < 0 || titleI < 0) {
            throw new Error('CSV missing required date or habit_title columns');
        }

        const titleToHabit = new Map<string, string>();
        for (const h of await this.habits.find({ where: { userId } })) {
            titleToHabit.set(h.title.trim().toLowerCase(), h.id);
        }

        let habitsCreated = 0;
        let logsUpserted = 0;
        let skipped = 0;

        for (let r = 1; r < rows.length; r++) {
            const row = rows[r];
            const date = (row[dateI] ?? '').trim();
            const title = (row[titleI] ?? '').trim();
            if (!date || !title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                skipped++;
                continue;
            }
            let habitId = titleToHabit.get(title.toLowerCase());
            if (!habitId) {
                const habit = await this.habits.save(this.habits.create({
                    userId,
                    title,
                    frequency: 'daily',
                    targetCount: 1,
                    category: categoryI >= 0 ? (row[categoryI] || 'general') : 'general',
                    active: true,
                    sortIndex: 0,
                }));
                habitId = habit.id;
                titleToHabit.set(title.toLowerCase(), habitId);
                habitsCreated++;
            }
            const existing = await this.logs.findOne({ where: { habitId, date } });
            const completed = completedI >= 0 ? row[completedI]?.toLowerCase() === 'true' : true;
            const frozen = frozenI >= 0 ? row[frozenI]?.toLowerCase() === 'true' : false;
            const moodRaw = moodI >= 0 ? row[moodI] : '';
            const mood = moodRaw && /^\d+$/.test(moodRaw) ? Number(moodRaw) : undefined;
            const notes = notesI >= 0 ? row[notesI] || undefined : undefined;
            if (existing) {
                existing.completed = completed;
                existing.frozen = frozen;
                if (mood != null) existing.moodScore = mood;
                if (notes) existing.notes = notes;
                await this.logs.save(existing);
            } else {
                await this.logs.save(this.logs.create({
                    userId,
                    habitId,
                    date,
                    completed,
                    frozen,
                    moodScore: mood,
                    notes,
                }));
            }
            logsUpserted++;
        }

        return { habitsCreated, logsUpserted, skipped };
    }

    async deleteAllFor(userId: string): Promise<{ deleted: true }> {
        // Delete in dependency order. The push tokens, feedback, reminders, logs first.
        await this.tokens.delete({ userId });
        await this.feedback.delete({ userId });
        await this.reminders.delete({ userId });
        const habits = await this.habits.find({ where: { userId } });
        for (const habit of habits) {
            await this.logs.delete({ habitId: habit.id });
        }
        await this.habits.delete({ userId });
        await this.users.delete({ id: userId });
        return { deleted: true };
    }
}
