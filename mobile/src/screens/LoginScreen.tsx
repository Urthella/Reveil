import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

import { authService } from '../services/api';

export default function LoginScreen({ navigation }: any) {
    const handleLogin = async () => {
        try {
            await authService.syncUser();
            // In a real app, successful login leads here
            // For now, we simulate navigation to Dashboard
            navigation.replace('Dashboard');
        } catch (error) {
            alert('Login failed: Backend not reachable?');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Reveil</Text>
            <Text style={styles.subtitle}>Sign in to start your journey</Text>
            <Button title="Login (Mock)" onPress={handleLogin} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 30,
        color: '#666',
    },
});
