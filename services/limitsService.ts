/**
 * Limits Service for HeroQuest
 * 
 * Manages daily message, photo, and voice limits for free/premium users.
 * Tracks usage per family per day.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// LIMITS CONFIGURATION
// ============================================

export const LIMITS = {
    FREE: {
        DAILY_MESSAGES: 5,
        DAILY_PHOTOS: 2,
        DAILY_VOICE: 1,
        STORAGE_DAYS: 1,
        MAX_CHILDREN: 1,
    },
    PREMIUM: {
        DAILY_MESSAGES: 30,
        DAILY_PHOTOS: 10,
        DAILY_VOICE: 5,
        STORAGE_DAYS: 7,
        MAX_CHILDREN: 3,
    }
};

// ============================================
// TYPES
// ============================================

interface DailyUsage {
    date: string; // YYYY-MM-DD
    messages: number;
    photos: number;
    voice: number;
}

interface UsageResult {
    allowed: boolean;
    remaining: number;
    limit: number;
    type: 'message' | 'photo' | 'voice';
}

// ============================================
// STORAGE KEYS
// ============================================

const getUsageKey = (familyId: string) => `questnest_usage_${familyId}`;

const getTodayDate = (): string => {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
};

// ============================================
// USAGE TRACKING
// ============================================

/**
 * Get today's usage for a family
 */
const getDailyUsage = async (familyId: string): Promise<DailyUsage> => {
    try {
        const key = getUsageKey(familyId);
        const stored = await AsyncStorage.getItem(key);

        if (stored) {
            const usage: DailyUsage = JSON.parse(stored);
            // Reset if it's a new day
            if (usage.date !== getTodayDate()) {
                return { date: getTodayDate(), messages: 0, photos: 0, voice: 0 };
            }
            return usage;
        }

        return { date: getTodayDate(), messages: 0, photos: 0, voice: 0 };
    } catch (error) {
        console.error('[Limits] Error getting usage:', error);
        return { date: getTodayDate(), messages: 0, photos: 0, voice: 0 };
    }
};

/**
 * Save today's usage for a family
 */
const saveDailyUsage = async (familyId: string, usage: DailyUsage): Promise<void> => {
    try {
        const key = getUsageKey(familyId);
        await AsyncStorage.setItem(key, JSON.stringify(usage));
    } catch (error) {
        console.error('[Limits] Error saving usage:', error);
    }
};

// ============================================
// LIMIT CHECKS
// ============================================

/**
 * Check if user can send a message
 */
export const canSendMessage = async (
    familyId: string,
    isPremium: boolean
): Promise<UsageResult> => {
    const usage = await getDailyUsage(familyId);
    const limit = isPremium ? LIMITS.PREMIUM.DAILY_MESSAGES : LIMITS.FREE.DAILY_MESSAGES;
    const remaining = Math.max(0, limit - usage.messages);

    return {
        allowed: usage.messages < limit,
        remaining,
        limit,
        type: 'message'
    };
};

/**
 * Check if user can send a photo
 */
export const canSendPhoto = async (
    familyId: string,
    isPremium: boolean
): Promise<UsageResult> => {
    const usage = await getDailyUsage(familyId);
    const limit = isPremium ? LIMITS.PREMIUM.DAILY_PHOTOS : LIMITS.FREE.DAILY_PHOTOS;
    const remaining = Math.max(0, limit - usage.photos);

    return {
        allowed: usage.photos < limit,
        remaining,
        limit,
        type: 'photo'
    };
};

/**
 * Check if user can send a voice message
 */
export const canSendVoice = async (
    familyId: string,
    isPremium: boolean
): Promise<UsageResult> => {
    const usage = await getDailyUsage(familyId);
    const limit = isPremium ? LIMITS.PREMIUM.DAILY_VOICE : LIMITS.FREE.DAILY_VOICE;
    const remaining = Math.max(0, limit - usage.voice);

    return {
        allowed: usage.voice < limit,
        remaining,
        limit,
        type: 'voice'
    };
};

// ============================================
// USAGE RECORDING
// ============================================

/**
 * Record a message sent
 */
export const recordMessageSent = async (familyId: string): Promise<void> => {
    const usage = await getDailyUsage(familyId);
    usage.messages++;
    await saveDailyUsage(familyId, usage);
};

/**
 * Record a photo sent
 */
export const recordPhotoSent = async (familyId: string): Promise<void> => {
    const usage = await getDailyUsage(familyId);
    usage.photos++;
    await saveDailyUsage(familyId, usage);
};

/**
 * Record a voice message sent
 */
export const recordVoiceSent = async (familyId: string): Promise<void> => {
    const usage = await getDailyUsage(familyId);
    usage.voice++;
    await saveDailyUsage(familyId, usage);
};

// ============================================
// USAGE SUMMARY
// ============================================

/**
 * Get a summary of today's usage
 */
export const getUsageSummary = async (
    familyId: string,
    isPremium: boolean
): Promise<{
    messages: { used: number; limit: number; remaining: number };
    photos: { used: number; limit: number; remaining: number };
    voice: { used: number; limit: number; remaining: number };
}> => {
    const usage = await getDailyUsage(familyId);
    const limits = isPremium ? LIMITS.PREMIUM : LIMITS.FREE;

    return {
        messages: {
            used: usage.messages,
            limit: limits.DAILY_MESSAGES,
            remaining: Math.max(0, limits.DAILY_MESSAGES - usage.messages)
        },
        photos: {
            used: usage.photos,
            limit: limits.DAILY_PHOTOS,
            remaining: Math.max(0, limits.DAILY_PHOTOS - usage.photos)
        },
        voice: {
            used: usage.voice,
            limit: limits.DAILY_VOICE,
            remaining: Math.max(0, limits.DAILY_VOICE - usage.voice)
        }
    };
};

// ============================================
// STORAGE DURATION
// ============================================

/**
 * Get the storage duration in days based on premium status
 */
export const getStorageDays = (isPremium: boolean): number => {
    return isPremium ? LIMITS.PREMIUM.STORAGE_DAYS : LIMITS.FREE.STORAGE_DAYS;
};

/**
 * Get the max children allowed based on premium status
 */
export const getMaxChildren = (isPremium: boolean): number => {
    return isPremium ? LIMITS.PREMIUM.MAX_CHILDREN : LIMITS.FREE.MAX_CHILDREN;
};

// ============================================
// RESET (for testing)
// ============================================

/**
 * Reset daily usage (for testing purposes)
 */
export const resetDailyUsage = async (familyId: string): Promise<void> => {
    const key = getUsageKey(familyId);
    await AsyncStorage.removeItem(key);
};
