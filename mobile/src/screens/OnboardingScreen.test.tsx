import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OnboardingScreen from './OnboardingScreen';

describe('OnboardingScreen', () => {
    it('renders the first slide and the action buttons', () => {
        const navigation = { replace: jest.fn() };
        render(
            <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 640 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
                <OnboardingScreen navigation={navigation} />
            </SafeAreaProvider>,
        );

        // First slide is rendered (TR or EN copy depending on locale).
        const firstSlide = screen.queryByText(/Build habits/i) ?? screen.queryByText(/Kalıcı/i);
        expect(firstSlide).toBeTruthy();

        // At least one Skip and one Next/Start button label appears somewhere.
        expect(screen.getAllByText(/Skip|Geç/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Next|İleri/i).length).toBeGreaterThan(0);
    });
});
