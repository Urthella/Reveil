import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { densityScale, useDensity } from '../services/density';

export default function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
    const density = useDensity();
    const scale = densityScale(density);
    return (
        <View
            style={[
                styles.card,
                { padding: Math.round(spacing.m * scale) },
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.l,
        borderWidth: 1,
        borderColor: colors.border,
    },
});
