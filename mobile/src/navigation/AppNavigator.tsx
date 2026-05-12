import React, { useLayoutEffect } from 'react';
import { Pressable, Text } from 'react-native';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HabitsScreen from '../screens/HabitsScreen';
import CreateHabitScreen from '../screens/CreateHabitScreen';
import HabitDetailScreen from '../screens/HabitDetailScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import RemindersScreen from '../screens/RemindersScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DigestScreen from '../screens/DigestScreen';
import NotificationFeedScreen from '../screens/NotificationFeedScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import { colors, spacing, typography } from '../theme';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export type RootStackParamList = {
    Onboarding: undefined;
    Login: undefined;
    Dashboard: undefined;
    Habits: undefined;
    CreateHabit: { habitId?: string } | undefined;
    HabitDetail: { habitId: string; title: string };
    Feedback: { habitId?: string };
    Reminders: undefined;
    Profile: undefined;
    Digest: undefined;
    NotificationFeed: undefined;
    Privacy: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        ...DefaultTheme.colors,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        primary: colors.primary,
        border: colors.border,
        notification: colors.primary,
    },
};

function DashboardWithHeader(props: any) {
    const { navigation } = props;
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Pressable
                    onPress={() => navigation.navigate('Profile')}
                    style={{ paddingHorizontal: spacing.s }}
                >
                    <Text style={[typography.caption, { color: colors.primary }]}>Profile</Text>
                </Pressable>
            ),
        });
    }, [navigation]);
    return <DashboardScreen {...props} />;
}

interface Props {
    initialRoute: keyof RootStackParamList;
}

export default function AppNavigator({ initialRoute }: Props) {
    return (
        <NavigationContainer ref={navigationRef} theme={navTheme}>
            <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{
                    headerStyle: { backgroundColor: colors.surface },
                    headerTitleStyle: { color: colors.text },
                    headerTintColor: colors.primary,
                    contentStyle: { backgroundColor: colors.background },
                }}
            >
                <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Dashboard" component={DashboardWithHeader} options={{ title: 'Reveil' }} />
                <Stack.Screen name="Habits" component={HabitsScreen} options={{ title: 'Habits' }} />
                <Stack.Screen
                    name="CreateHabit"
                    component={CreateHabitScreen}
                    options={({ route }) => ({ title: route.params?.habitId ? 'Edit Habit' : 'New Habit' })}
                />
                <Stack.Screen
                    name="HabitDetail"
                    component={HabitDetailScreen}
                    options={({ route }) => ({ title: route.params.title })}
                />
                <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ title: 'AI Feedback' }} />
                <Stack.Screen name="Reminders" component={RemindersScreen} options={{ title: 'Reminders' }} />
                <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
                <Stack.Screen name="Digest" component={DigestScreen} options={{ title: 'Weekly digest' }} />
                <Stack.Screen name="NotificationFeed" component={NotificationFeedScreen} options={{ title: 'Notifications' }} />
                <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacy' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
