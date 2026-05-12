import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme';

interface Props {
    /** 1 = completed, 0 = skipped/empty, -1 = frozen. Oldest → newest. */
    days: number[];
    cellSize?: number;
}

/**
 * 7-cell horizontal strip showing the last week. Used as an at-a-glance
 * indicator on the dashboard habit cards.
 */
export default function Sparkline({ days, cellSize = 8 }: Props) {
    if (!days?.length) return null;
    return (
        <View style={styles.row} accessibilityLabel={`Last ${days.length} days strip`}>
            {days.map((d, i) => {
                const bg = d === 1 ? colors.success : d === -1 ? colors.secondary : colors.surfaceAlt;
                return (
                    <View
                        key={i}
                        style={[
                            styles.cell,
                            { width: cellSize, height: cellSize, backgroundColor: bg },
                        ]}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 2, marginTop: spacing.xs },
    cell: { borderRadius: 2 },
});
