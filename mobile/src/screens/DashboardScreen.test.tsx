import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('../services/api', () => ({
    feedbackService: {
        history: jest.fn(async () => []),
        generate: jest.fn(),
    },
    dashboardService: {
        get: jest.fn(async () => ({
            habits: [
                {
                    id: 'h1',
                    title: 'Morning Run',
                    frequency: 'daily',
                    targetCount: 1,
                    timeOfDay: 'morning',
                    consistencyScore: 67,
                    currentStreak: 3,
                    completedToday: true,
                    completedDays: 20,
                    last7: [1, 0, 1, 1, 0, 1, 1],
                },
            ],
            consistencyScore: 72,
            currentStreak: 4,
            longestStreak: 7,
            completedToday: 1,
            totalHabits: 1,
            weeklySummary: Array.from({ length: 7 }, (_, i) => ({
                date: `2026-04-${27 + i}`.slice(0, 10),
                completed: i % 2,
                total: 1,
            })),
            badges: [
                { id: 'spark', label: 'Spark', description: '3-day streak', threshold: 3, earned: true, progress: 1 },
                { id: 'momentum', label: 'Momentum', description: 'One-week streak', threshold: 7, earned: true, progress: 1 },
                { id: 'rooted', label: 'Rooted', description: 'Two-week streak', threshold: 14, earned: false, progress: 0.5 },
            ],
            categoryBreakdown: [
                { category: 'health', habitCount: 1, consistencyScore: 67, currentStreak: 3 },
            ],
            progress: { xp: 250, level: 2, xpInLevel: 150, xpToNextLevel: 300 },
        })),
    },
}));

// useFocusEffect collapses to a normal effect in tests so we don't need a real navigation tree.
jest.mock('@react-navigation/native', () => ({
    useFocusEffect: (cb: () => void) => {
        const React = require('react');
        React.useEffect(cb, []);
    },
}));

import DashboardScreen from './DashboardScreen';

describe('DashboardScreen', () => {
    it('renders consistency, streak, and habit cards from the dashboard service', async () => {
        const navigation = { navigate: jest.fn() };
        render(
            <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 640 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
                <DashboardScreen navigation={navigation} />
            </SafeAreaProvider>,
        );

        await waitFor(() => expect(screen.getByText('72%')).toBeTruthy());
        expect(screen.getByText('4d')).toBeTruthy(); // overall streak
        expect(screen.getAllByText('1/1').length).toBeGreaterThan(0); // today indicator (also appears in weekly chart cells)
        expect(screen.getByText(/Morning Run/)).toBeTruthy();
        expect(screen.getByText(/20\/30 days/)).toBeTruthy();
    });
});
