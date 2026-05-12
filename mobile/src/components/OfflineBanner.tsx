import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { colors, spacing, typography } from '../theme';

export default function OfflineBanner() {
    const [offline, setOffline] = useState(false);

    useEffect(() => {
        return NetInfo.addEventListener((state) => {
            const reachable = state.isConnected && state.isInternetReachable !== false;
            setOffline(!reachable);
        });
    }, []);

    if (!offline) return null;

    return (
        <View
            style={styles.banner}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            accessibilityLabel="You are offline. Changes will sync when you are back online."
        >
            <Text style={styles.text}>You're offline · changes will sync when you're back online.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        backgroundColor: colors.warning,
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.m,
        alignItems: 'center',
    },
    text: {
        ...typography.caption,
        color: '#1A1A22',
        fontWeight: '600',
    },
});
