import axios from 'axios';
import { Platform } from 'react-native';
import { getCurrentToken } from './auth';

// Override at runtime by setting EXPO_PUBLIC_API_URL when starting Expo,
// e.g. EXPO_PUBLIC_API_URL=http://192.168.1.20:3000/api npm start
const ENV_OVERRIDE = (process.env as any).EXPO_PUBLIC_API_URL as string | undefined;
const BASE_URL =
    ENV_OVERRIDE ||
    (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api');

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
});

api.interceptors.request.use(async (config) => {
    config.headers = config.headers ?? {};
    try {
        const token = await getCurrentToken();
        config.headers.Authorization = `Bearer ${token}`;
    } catch {
        // not signed in — let the request through; backend will 401
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err?.response?.status ?? 0;
        // Only forward server-side problems; 4xx are usually expected business errors.
        if (status >= 500 || status === 0) {
            // Lazy-import to avoid a circular dep at module load time.
            try {
                require('./sentry').captureException(err, {
                    url: err?.config?.url,
                    method: err?.config?.method,
                    status,
                });
            } catch { /* ignore */ }
        }
        return Promise.reject(err);
    },
);

export type HabitCategory =
    | 'health'
    | 'productivity'
    | 'mindfulness'
    | 'social'
    | 'recovery'
    | 'general';

export interface Habit {
    id: string;
    title: string;
    description?: string;
    frequency: string;
    targetCount: number;
    timeOfDay?: string;
    category?: HabitCategory;
    active?: boolean;
    weeklyTarget?: number;
    pausedUntil?: string | null;
    createdAt: string;
}

export interface HabitWithProgress extends Habit {
    consistencyScore: number;
    currentStreak: number;
    completedToday: boolean;
    completedDays: number;
    last7?: number[];
}

export interface HabitLog {
    id: string;
    habitId: string;
    date: string;
    completed: boolean;
    frozen?: boolean;
    moodScore?: number;
    notes?: string;
}

export interface FeedbackLog {
    id: string;
    habitId?: string;
    feedbackText: string;
    source: 'openai' | 'rule';
    consistencyScore: number;
    streak: number;
    rating: -1 | 0 | 1;
    generatedAt: string;
}

export interface Badge {
    id: string;
    label: string;
    description: string;
    threshold: number;
    earned: boolean;
    progress: number;
}

export interface CategoryRollup {
    category: HabitCategory;
    habitCount: number;
    consistencyScore: number;
    currentStreak: number;
}

export interface LevelInfo {
    xp: number;
    level: number;
    xpInLevel: number;
    xpToNextLevel: number;
}

export interface DashboardResponse {
    habits: HabitWithProgress[];
    consistencyScore: number;
    currentStreak: number;
    longestStreak: number;
    completedToday: number;
    totalHabits: number;
    weeklySummary: { date: string; completed: number; total: number }[];
    badges: Badge[];
    categoryBreakdown: CategoryRollup[];
    progress: LevelInfo;
}

export const authService = {
    syncUser: async () => {
        const { data } = await api.post('/users/sync');
        return data;
    },
    me: async () => {
        const { data } = await api.get('/users/me');
        return data;
    },
    exportData: async (): Promise<unknown> => {
        const { data } = await api.get('/users/me/export');
        return data;
    },
    exportCsv: async (): Promise<string> => {
        const { data } = await api.get('/users/me/export.csv', { responseType: 'text' });
        return data as string;
    },
    deleteMe: async (): Promise<{ deleted: true }> => {
        const { data } = await api.delete('/users/me');
        return data;
    },
    updatePreferences: async (input: {
        quietHoursStart?: string | null;
        quietHoursEnd?: string | null;
        locale?: 'en' | 'tr';
        digestEnabled?: boolean;
    }) => {
        const { data } = await api.patch('/users/me/preferences', input);
        return data;
    },
};

export const healthService = {
    health: async () => {
        const { data } = await api.get('/health');
        return data as { status: string; db: boolean; uptimeSeconds: number };
    },
    version: async () => {
        const { data } = await api.get('/version');
        return data as { name: string; version: string; node: string };
    },
};

export const habitsService = {
    list: async (
        params?: { category?: HabitCategory; includePaused?: boolean; q?: string },
    ): Promise<Habit[]> => {
        const query: Record<string, unknown> = {};
        if (params?.category) query.category = params.category;
        if (params?.includePaused) query.includePaused = true;
        if (params?.q?.trim()) query.q = params.q.trim();
        const { data } = await api.get('/habits', { params: Object.keys(query).length ? query : undefined });
        return data;
    },
    get: async (id: string): Promise<Habit> => {
        const { data } = await api.get(`/habits/${id}`);
        return data;
    },
    create: async (input: {
        title: string;
        frequency: string;
        description?: string;
        targetCount?: number;
        timeOfDay?: string;
        category?: HabitCategory;
        weeklyTarget?: number;
    }): Promise<Habit> => {
        const { data } = await api.post('/habits', input);
        return data;
    },
    update: async (
        id: string,
        input: Partial<{
            title: string;
            description: string;
            frequency: string;
            targetCount: number;
            timeOfDay: string;
            category: HabitCategory;
            active: boolean;
            weeklyTarget: number;
            pausedUntil: string | null;
        }>,
    ): Promise<Habit> => {
        const { data } = await api.patch(`/habits/${id}`, input);
        return data;
    },
    remove: async (id: string) => {
        await api.delete(`/habits/${id}`);
    },
    reorder: async (items: { id: string; sortIndex: number }[]): Promise<{ updated: number }> => {
        const { data } = await api.post('/habits/reorder', { items });
        return data;
    },
};

export const trackingService = {
    log: async (input: {
        habitId: string;
        date: string;
        completed: boolean;
        frozen?: boolean;
        moodScore?: number;
        notes?: string;
    }): Promise<HabitLog> => {
        const { data } = await api.post('/tracking/log', input);
        return data;
    },
    history: async (habitId: string): Promise<HabitLog[]> => {
        const { data } = await api.get(`/tracking/history/${habitId}`);
        return data;
    },
    removeLog: async (logId: string): Promise<{ deleted: true }> => {
        const { data } = await api.delete(`/tracking/log/${logId}`);
        return data;
    },
};

export const dashboardService = {
    get: async (): Promise<DashboardResponse> => {
        const { data } = await api.get('/dashboard');
        return data;
    },
};

export interface WeeklyDigest {
    weekEndDate: string;
    summary: string;
    overall: {
        consistencyScore: number;
        completedDays: number;
        totalDays: number;
        currentStreak: number;
    };
    perHabit: {
        habitId: string;
        title: string;
        category: HabitCategory;
        consistencyScore: number;
        completedDays: number;
        currentStreak: number;
    }[];
    topHabit?: { habitId: string; title: string; consistencyScore: number };
    needsAttention?: { habitId: string; title: string; consistencyScore: number };
}

export const digestService = {
    weekly: async (locale?: 'en' | 'tr'): Promise<WeeklyDigest> => {
        const { data } = await api.get('/digest/weekly', {
            params: locale ? { locale } : undefined,
        });
        return data;
    },
};

export const feedbackService = {
    generate: async (
        habitId?: string,
        locale?: 'en' | 'tr',
        tone?: 'gentle' | 'firm' | 'playful' | 'coach',
    ): Promise<FeedbackLog> => {
        const body: Record<string, unknown> = {};
        if (habitId) body.habitId = habitId;
        if (locale) body.locale = locale;
        if (tone) body.tone = tone;
        const { data } = await api.post('/ai/feedback', body);
        return data;
    },
    history: async (): Promise<FeedbackLog[]> => {
        const { data } = await api.get('/ai/feedback');
        return data;
    },
    rate: async (id: string, rating: -1 | 0 | 1): Promise<FeedbackLog> => {
        const { data } = await api.patch(`/ai/feedback/${id}/rating`, { rating });
        return data;
    },
    shareCardSvg: async (habitId: string, locale: 'en' | 'tr' = 'en'): Promise<string> => {
        const { data } = await api.get(`/ai/feedback/share/${habitId}.svg`, {
            params: { locale },
            responseType: 'text',
        });
        return data as string;
    },
};

export default api;
