import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/Card';
import { notificationFeedService, NotificationFeedItem } from '../services/notifications';
import { getLocale } from '../services/i18n';
import { colors, spacing, typography } from '../theme';

const KIND_ICON: Record<NotificationFeedItem['kind'], string> = {
    reminder: '⏰',
    digest: '📅',
    test: '🧪',
};

export default function NotificationFeedScreen() {
    const [items, setItems] = useState<NotificationFeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await notificationFeedService.list();
            setItems(data);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            load();
        }, [load]),
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    const tr = getLocale() === 'tr';

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <FlatList
                data={items}
                keyExtractor={(it) => it.id}
                contentContainerStyle={styles.content}
                ItemSeparatorComponent={() => <View style={{ height: spacing.s }} />}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            load();
                        }}
                        tintColor={colors.primary}
                    />
                }
                renderItem={({ item }) => (
                    <Card>
                        <View style={styles.row}>
                            <Text style={styles.icon}>{KIND_ICON[item.kind] ?? '🔔'}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={typography.bodyStrong}>{item.title}</Text>
                                <Text style={[typography.body, { marginTop: spacing.xs }]}>{item.body}</Text>
                                <Text style={[typography.caption, { marginTop: spacing.xs }]}>
                                    {new Date(item.sentAt).toLocaleString()} · {item.kind}
                                </Text>
                            </View>
                        </View>
                    </Card>
                )}
                ListEmptyComponent={
                    <Text style={typography.body}>
                        {tr ? 'Henüz bildirim yok.' : 'No notifications yet.'}
                    </Text>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    content: { padding: spacing.l, gap: spacing.s },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.m },
    icon: { fontSize: 24 },
});
