import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Secure Storage Adapter for Supabase
 * Uses expo-secure-store on native platforms, localStorage on web
 */
const SecureStorageAdapter = {
    getItem: async (key: string): Promise<string | null> => {
        try {
            if (Platform.OS === 'web') {
                return localStorage.getItem(key);
            }
            return await SecureStore.getItemAsync(key);
        } catch (error) {
            console.error('SecureStore getItem error:', error);
            return null;
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem(key, value);
                return;
            }
            await SecureStore.setItemAsync(key, value);
        } catch (error) {
            console.error('SecureStore setItem error:', error);
        }
    },
    removeItem: async (key: string): Promise<void> => {
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem(key);
                return;
            }
            await SecureStore.deleteItemAsync(key);
        } catch (error) {
            console.error('SecureStore removeItem error:', error);
        }
    }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: SecureStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
