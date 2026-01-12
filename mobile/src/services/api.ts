import axios from 'axios';
import { Platform } from 'react-native';

// Android Emulator: 10.0.2.2
// iOS Simulator: localhost
// Physical Device: Your LAN IP (e.g., 192.168.1.x)
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

const api = axios.create({
    baseURL: BASE_URL,
});

// Mock Token for development
const MOCK_TOKEN = 'mock-token';

api.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${MOCK_TOKEN}`;
    return config;
});

export const authService = {
    syncUser: async () => {
        try {
            const response = await api.post('/users/sync');
            return response.data;
        } catch (error) {
            console.error('Sync User Error:', error);
            throw error;
        }
    },
};

export const habitsService = {
    getAll: async () => {
        try {
            const response = await api.get('/habits');
            return response.data;
        } catch (error) {
            console.error('Get Habits Error:', error);
            throw error;
        }
    },
    create: async (title: string, frequency: string) => {
        try {
            const response = await api.post('/habits', { title, frequency });
            return response.data;
        } catch (error) {
            console.error('Create Habit Error:', error);
            throw error;
        }
    },
};

export default api;
