import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { habitsService } from '../services/api';

export default function DashboardScreen() {
    const [habits, setHabits] = useState([]);

    useEffect(() => {
        loadHabits();
    }, []);

    const loadHabits = async () => {
        try {
            const data = await habitsService.getAll();
            setHabits(data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Dashboard</Text>
            <FlatList
                data={habits}
                keyExtractor={(item: any) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.habitTitle}>{item.title}</Text>
                        <Text>{item.frequency}</Text>
                    </View>
                )}
                ListEmptyComponent={<Text>No habits found. Add some!</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        marginTop: 40,
    },
    card: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    habitTitle: {
        fontSize: 18,
        fontWeight: '600',
    }
});
