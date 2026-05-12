import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { t } from '../services/i18n';

const FACES = ['😞', '🙁', '😐', '🙂', '😊', '😄', '🤩', '🌟', '🔥', '💯'];

export default function MoodPicker({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
    return (
        <View accessibilityRole="radiogroup">
            <Text style={typography.caption}>{t('habit.moodLabel')}</Text>
            <View style={styles.row}>
                {FACES.map((face, i) => {
                    const score = i + 1;
                    const selected = value === score;
                    return (
                        <Pressable
                            key={score}
                            onPress={() => onChange(score)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}
                            accessibilityLabel={`Mood ${score} of 10`}
                            style={[styles.cell, selected ? styles.cellSelected : null]}
                        >
                            <Text style={styles.face}>{face}</Text>
                            <Text style={[typography.caption, selected ? { color: colors.text } : null]}>{score}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginTop: spacing.s },
    cell: {
        width: 44,
        paddingVertical: spacing.s,
        alignItems: 'center',
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.m,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cellSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    face: { fontSize: 18 },
});
