import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';
import { navigationRef } from '../navigation/AppNavigator';
import { habitsService } from './api';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Wires up the OS notification tap handler. Call once at app startup.
 * When a push contains `habitId` in its data payload, navigate the user
 * straight to that habit's detail screen.
 */
let _deepLinkSubscription: { remove: () => void } | null = null;
let _categoriesRegistered = false;

async function registerCategoriesOnce(): Promise<void> {
    if (_categoriesRegistered) return;
    try {
        // Reminder push: "Snooze 30 min" + "Mark done" actions.
        await Notifications.setNotificationCategoryAsync('reminder', [
            { identifier: 'snooze', buttonTitle: 'Snooze 30 min', options: { opensAppToForeground: false } },
            { identifier: 'done', buttonTitle: 'Mark done', options: { opensAppToForeground: true } },
        ]);
        // Feedback push: jump-to-rate.
        await Notifications.setNotificationCategoryAsync('feedback', [
            { identifier: 'rate-up', buttonTitle: '👍', options: { opensAppToForeground: true } },
            { identifier: 'rate-down', buttonTitle: '👎', options: { opensAppToForeground: true } },
        ]);
        _categoriesRegistered = true;
    } catch { /* setNotificationCategoryAsync unavailable on web */ }
}

export function setupNotificationDeepLinking(): () => void {
    if (_deepLinkSubscription) return () => _deepLinkSubscription?.remove();
    registerCategoriesOnce().catch(() => undefined);
    _deepLinkSubscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
        const data = response?.notification?.request?.content?.data as
            | { habitId?: string; reminderId?: string; feedbackId?: string }
            | undefined;
        const actionIdentifier = response?.actionIdentifier;

        // Best-effort tap analytics.
        api
            .post('/notifications/events', {
                eventType: 'tap',
                habitId: data?.habitId,
                reminderId: data?.reminderId,
            })
            .catch(() => undefined);

        // Handle action buttons before falling through to default tap behaviour.
        if (actionIdentifier === 'snooze') {
            // Re-schedule the same notification in 30 minutes.
            try {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: response.notification.request.content.title ?? 'Reveil',
                        body: response.notification.request.content.body ?? 'Reminder',
                        data: data ?? {},
                        categoryIdentifier: 'reminder',
                    },
                    trigger: { seconds: 30 * 60 } as any,
                });
            } catch { /* scheduling unavailable */ }
            return;
        }
        if (actionIdentifier === 'rate-up' || actionIdentifier === 'rate-down') {
            if (data?.feedbackId) {
                api.patch(`/ai/feedback/${data.feedbackId}/rating`, {
                    rating: actionIdentifier === 'rate-up' ? 1 : -1,
                }).catch(() => undefined);
            }
            if (navigationRef.isReady()) {
                navigationRef.navigate('Feedback', {});
            }
            return;
        }

        if (!navigationRef.isReady()) return;
        if (data?.feedbackId) {
            navigationRef.navigate('Feedback', {});
            return;
        }
        if (!data?.habitId) return;
        try {
            const habit = await habitsService.get(data.habitId);
            navigationRef.navigate('HabitDetail', { habitId: habit.id, title: habit.title });
        } catch {
            navigationRef.navigate('Dashboard');
        }
    });
    return () => {
        _deepLinkSubscription?.remove();
        _deepLinkSubscription = null;
    };
}

export async function ensurePushPermission(): Promise<boolean> {
    if (!Device.isDevice) return false;
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === 'granted') return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.status === 'granted';
}

/**
 * Registers the device with Expo's push service and tells the backend.
 * Returns the token (or null if not on a real device or permission denied).
 */
export async function registerForPush(): Promise<string | null> {
    if (!Device.isDevice) return null;
    const granted = await ensurePushPermission();
    if (!granted) return null;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Reveil',
            importance: Notifications.AndroidImportance.DEFAULT,
        });
    }

    try {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        await api.post('/notifications/token', { token, platform: 'expo' });
        return token;
    } catch (err) {
        console.warn('Push registration failed:', err);
        return null;
    }
}

export interface ReminderInput {
    habitId?: string;
    time: string; // HH:mm
    weekdays?: string;
    enabled?: boolean;
    message?: string;
}

export interface NotificationFeedItem {
    id: string;
    title: string;
    body: string;
    kind: 'reminder' | 'digest' | 'test';
    habitId?: string;
    sentAt: string;
}

export const notificationFeedService = {
    list: async (): Promise<NotificationFeedItem[]> => {
        const { data } = await api.get('/notifications/feed');
        return data;
    },
};

export const remindersService = {
    list: async () => {
        const { data } = await api.get('/notifications/reminders');
        return data as Array<{
            id: string;
            habitId?: string;
            time: string;
            weekdays: string;
            enabled: boolean;
            message?: string;
        }>;
    },
    create: async (input: ReminderInput) => {
        const { data } = await api.post('/notifications/reminders', input);
        return data;
    },
    remove: async (id: string) => {
        await api.delete(`/notifications/reminders/${id}`);
    },
    sendTestPush: async () => {
        const { data } = await api.post('/notifications/test', {});
        return data as { sent: number };
    },
};
