import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit } from '../habits/habit.entity';
import { TrackingService } from '../tracking/tracking.service';
import { computeStats, daysAgoIso } from '../common/stats.util';

function escapeXml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

const CATEGORY_ICON: Record<string, string> = {
    health: '💪',
    productivity: '🎯',
    mindfulness: '🧘',
    social: '🫂',
    recovery: '🌱',
    general: '⭐',
};

@Injectable()
export class ShareCardService {
    constructor(
        @InjectRepository(Habit) private habits: Repository<Habit>,
        private tracking: TrackingService,
    ) { }

    async renderHabitCard(userId: string, habitId: string, locale: 'en' | 'tr' = 'en'): Promise<string> {
        const habit = await this.habits.findOne({ where: { id: habitId } });
        if (!habit) throw new NotFoundException('Habit not found');
        if (habit.userId !== userId) throw new ForbiddenException();

        const since = daysAgoIso(30);
        const logs = (await this.tracking.getRecentLogs(userId, since)).filter((l) => l.habitId === habitId);
        const stats = computeStats(logs, 30, habit.weeklyTarget ?? 7);

        // Build the 7-day strip (oldest → newest).
        const last7: ('completed' | 'frozen' | 'skipped' | 'empty')[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = daysAgoIso(i);
            const entry = logs.find((l) => l.date === d);
            if (!entry) last7.push('empty');
            else if (entry.frozen) last7.push('frozen');
            else last7.push(entry.completed ? 'completed' : 'skipped');
        }

        const tr = locale === 'tr';
        const labelStreak = tr ? 'gün seri' : 'day streak';
        const labelConsistency = tr ? 'tutarlılık' : 'consistency';
        const tagline = tr ? 'Reveil ile alışkanlık inşa ediyorum.' : 'Building habits with Reveil.';
        const icon = CATEGORY_ICON[habit.category ?? 'general'] ?? '⭐';
        const title = `${icon} ${escapeXml(habit.title)}`;

        const dotFill = (state: 'completed' | 'frozen' | 'skipped' | 'empty') => {
            switch (state) {
                case 'completed': return '#00C851';
                case 'frozen': return '#03DAC6';
                case 'skipped': return '#CF6679';
                default: return '#23232E';
            }
        };
        const dots = last7
            .map((s, i) => `<rect x="${56 + i * 70}" y="380" width="48" height="48" rx="10" fill="${dotFill(s)}"/>`)
            .join('');

        return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 480" width="600" height="480">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1A1A22"/>
      <stop offset="100%" stop-color="#0F0F14"/>
    </linearGradient>
  </defs>
  <rect width="600" height="480" rx="32" fill="url(#bg)" stroke="#2A2A36" stroke-width="2"/>
  <text x="40" y="64" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="#7A7A8C">REVEIL</text>
  <text x="40" y="120" font-family="Helvetica, Arial, sans-serif" font-size="36" font-weight="700" fill="#FFFFFF">${title}</text>

  <text x="40" y="220" font-family="Helvetica, Arial, sans-serif" font-size="120" font-weight="800" fill="#6C63FF">${stats.currentStreak}</text>
  <text x="40" y="260" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="#B0B0C0">${labelStreak}</text>

  <text x="360" y="200" font-family="Helvetica, Arial, sans-serif" font-size="56" font-weight="700" fill="#FFFFFF">${stats.consistencyScore}%</text>
  <text x="360" y="232" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#B0B0C0">${labelConsistency}</text>

  <text x="40" y="360" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#7A7A8C">${tr ? 'Son 7 gün' : 'Last 7 days'}</text>
  ${dots}

  <text x="40" y="460" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#7A7A8C">${escapeXml(tagline)}</text>
</svg>`;
    }
}
