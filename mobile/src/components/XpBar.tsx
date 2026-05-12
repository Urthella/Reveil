import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ProgressBar from './ProgressBar';
import { LevelInfo } from '../services/api';
import { getLocale } from '../services/i18n';
import { colors, spacing, typography } from '../theme';

export default function XpBar({ progress }: { progress: LevelInfo }) {
    const pct = Math.round((progress.xpInLevel / progress.xpToNextLevel) * 100);
    const tr = getLocale() === 'tr';
    return (
        <View>
            <View style={styles.row}>
                <Text style={typography.bodyStrong}>
                    {tr ? 'Seviye' : 'Level'} {progress.level}
                </Text>
                <Text style={typography.caption}>
                    {progress.xpInLevel} / {progress.xpToNextLevel} XP
                </Text>
            </View>
            <View style={{ marginTop: spacing.xs }}>
                <ProgressBar value={pct} label={`Level ${progress.level} progress`} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
