import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('../services/api', () => ({
    trackingService: {
        history: jest.fn(async () => [
            { id: 'l1', habitId: 'h1', date: '2026-05-01', completed: true, moodScore: 8, notes: 'Felt great' },
            { id: 'l2', habitId: 'h1', date: '2026-04-30', completed: false, moodScore: undefined, notes: undefined },
        ]),
        log: jest.fn(),
    },
    habitsService: {
        remove: jest.fn(),
        get: jest.fn(async () => ({
            id: 'h1',
            title: 'Test habit',
            frequency: 'daily',
            targetCount: 1,
            category: 'general',
            active: true,
            createdAt: '2026-05-01',
        })),
        update: jest.fn(),
    },
}));

jest.mock('@react-navigation/native', () => ({
    useFocusEffect: (cb: () => void) => {
        const React = require('react');
        React.useEffect(cb, []);
    },
}));

import HabitDetailScreen from './HabitDetailScreen';

describe('HabitDetailScreen', () => {
    it('shows today section, mood picker, and the history list', async () => {
        const navigation = { navigate: jest.fn(), goBack: jest.fn() };
        const route = { params: { habitId: 'h1' } };

        render(
            <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 640 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
                <HabitDetailScreen route={route} navigation={navigation} />
            </SafeAreaProvider>,
        );

        await waitFor(() => expect(screen.getByText(/How did it feel/)).toBeTruthy());
        expect(screen.getByText(/Mark done/)).toBeTruthy();
        expect(screen.getByText('2026-05-01')).toBeTruthy();
        expect(screen.getByText('Felt great')).toBeTruthy();
        expect(screen.getAllByText(/Completed/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Skipped/).length).toBeGreaterThan(0);
    });
});
