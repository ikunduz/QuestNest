import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Register device for push notifications
 * Returns the Expo Push Token
 */
export async function registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
    }

    try {
        // Check existing permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Request permission if not granted
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Push notification permission denied');
            return null;
        }

        // Get Expo Push Token
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const token = await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
        });

        // Android-specific channel setup
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'QuestNest',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#fbbf24',
            });
        }

        console.log('Push token:', token.data);
        return token.data;

    } catch (error) {
        console.error('Error registering for push notifications:', error);
        return null;
    }
}

/**
 * Save push token to user record in Supabase
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('users')
            .update({ expo_push_token: token })
            .eq('id', userId);

        if (error) {
            console.error('Error saving push token:', error);
        } else {
            console.log('Push token saved to user record');
        }
    } catch (e) {
        console.error('Error saving push token:', e);
    }
}

/**
 * Send local notification (works in Expo Go)
 */
export async function sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>
): Promise<void> {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: 'default',
        },
        trigger: null, // Show immediately
    });
}

/**
 * Send push notification to specific users via Expo Push API
 * This works when users have valid push tokens
 */
export async function sendPushToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>
): Promise<void> {
    try {
        // Get push tokens for target users
        const { data: users, error } = await supabase
            .from('users')
            .select('expo_push_token')
            .in('id', userIds)
            .not('expo_push_token', 'is', null);

        if (error || !users || users.length === 0) {
            console.log('No push tokens found for users');
            return;
        }

        const tokens = users
            .map(u => u.expo_push_token)
            .filter(Boolean) as string[];

        if (tokens.length === 0) return;

        // Send to Expo Push API
        const messages = tokens.map(token => ({
            to: token,
            sound: 'default' as const,
            title,
            body,
            data,
        }));

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });

        const result = await response.json();
        console.log('Push notification result:', result);

    } catch (e) {
        console.error('Error sending push notification:', e);
    }
}

/**
 * Send notification to all family members except sender
 */
export async function notifyFamily(
    familyId: string,
    excludeUserId: string,
    title: string,
    body: string
): Promise<void> {
    try {
        // Get all family members except the sender
        const { data: members, error } = await supabase
            .from('users')
            .select('id, expo_push_token')
            .eq('family_id', familyId)
            .neq('id', excludeUserId)
            .not('expo_push_token', 'is', null);

        if (error || !members || members.length === 0) return;

        const tokens = members
            .map(m => m.expo_push_token)
            .filter(Boolean) as string[];

        if (tokens.length === 0) return;

        const messages = tokens.map(token => ({
            to: token,
            sound: 'default' as const,
            title,
            body,
        }));

        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messages),
        });

    } catch (e) {
        console.error('Error notifying family:', e);
    }
}

/**
 * Notify children in family about new quest
 */
export async function notifyQuestAdded(
    familyId: string,
    questTitle: string,
    parentName: string
): Promise<void> {
    try {
        const { data: children } = await supabase
            .from('users')
            .select('id, expo_push_token')
            .eq('family_id', familyId)
            .eq('role', 'child')
            .not('expo_push_token', 'is', null);

        if (!children || children.length === 0) return;

        const tokens = children
            .map(c => c.expo_push_token)
            .filter(Boolean) as string[];

        if (tokens.length === 0) return;

        const messages = tokens.map(token => ({
            to: token,
            sound: 'default' as const,
            title: '⚔️ New Quest!',
            body: `${parentName} added: "${questTitle}"`,
        }));

        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messages),
        });

    } catch (e) {
        console.error('Error notifying quest added:', e);
    }
}

/**
 * Notify parents about completed quest
 */
export async function notifyQuestCompleted(
    familyId: string,
    questTitle: string,
    childName: string
): Promise<void> {
    try {
        const { data: parents } = await supabase
            .from('users')
            .select('id, expo_push_token')
            .eq('family_id', familyId)
            .eq('role', 'parent')
            .not('expo_push_token', 'is', null);

        if (!parents || parents.length === 0) return;

        const tokens = parents
            .map(p => p.expo_push_token)
            .filter(Boolean) as string[];

        if (tokens.length === 0) return;

        const messages = tokens.map(token => ({
            to: token,
            sound: 'default' as const,
            title: '🎉 Quest Completed!',
            body: `${childName} completed: "${questTitle}"`,
        }));

        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messages),
        });

    } catch (e) {
        console.error('Error notifying quest completed:', e);
    }
}

/**
 * Notify family about new message
 */
export async function notifyNewMessage(
    familyId: string,
    senderId: string,
    senderName: string,
    messagePreview: string
): Promise<void> {
    const preview = messagePreview.length > 50
        ? messagePreview.slice(0, 50) + '...'
        : messagePreview;

    await notifyFamily(familyId, senderId, `💬 ${senderName}`, preview);
}
