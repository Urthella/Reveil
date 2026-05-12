export interface Badge {
    id: string;
    label: string;
    description: string;
    threshold: number;     // streak in days required
    earned: boolean;
    progress: number;      // 0..1 toward this badge
}

const BADGE_DEFS: Omit<Badge, 'earned' | 'progress'>[] = [
    { id: 'spark', label: 'Spark', description: '3-day streak', threshold: 3 },
    { id: 'momentum', label: 'Momentum', description: 'One-week streak', threshold: 7 },
    { id: 'rooted', label: 'Rooted', description: 'Two-week streak', threshold: 14 },
    { id: 'identity', label: 'Identity', description: '30-day streak', threshold: 30 },
    { id: 'dedicated', label: 'Dedicated', description: '90-day streak', threshold: 90 },
    { id: 'forged', label: 'Forged', description: '180-day streak', threshold: 180 },
];

export function computeBadges(streak: number): Badge[] {
    return BADGE_DEFS.map((b) => ({
        ...b,
        earned: streak >= b.threshold,
        progress: Math.max(0, Math.min(1, streak / b.threshold)),
    }));
}
