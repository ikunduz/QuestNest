/**
 * Security Utilities for HeroQuest
 * 
 * This module provides:
 * - PIN hashing with SHA-256 + salt
 * - Rate limiting for authentication attempts
 * - Input sanitization to prevent XSS/injection
 * - Validation functions for user inputs
 */

import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// CONSTANTS
// ============================================

const RATE_LIMIT_KEY = '@security_rate_limit';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const PIN_SALT = 'HeroQuest_SecureSalt_2026'; // Static salt for consistency

// ============================================
// PIN HASHING
// ============================================

/**
 * Hash a PIN using SHA-256 with salt
 * @param pin - The 4-digit PIN to hash
 * @returns Hashed PIN string
 */
export const hashPin = async (pin: string): Promise<string> => {
    const saltedPin = `${PIN_SALT}:${pin}`;
    const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        saltedPin
    );
    return hash;
};

/**
 * Verify a PIN against its hash
 * @param pin - The PIN to verify
 * @param hashedPin - The stored hash to compare against
 * @returns true if PIN matches
 */
export const verifyPin = async (pin: string, hashedPin: string): Promise<boolean> => {
    const newHash = await hashPin(pin);
    return newHash === hashedPin;
};

// ============================================
// RATE LIMITING
// ============================================

interface RateLimitData {
    attempts: number;
    lockoutUntil: number | null;
    lastAttempt: number;
}

/**
 * Get rate limit data from storage
 */
const getRateLimitData = async (userId: string): Promise<RateLimitData> => {
    try {
        const key = `${RATE_LIMIT_KEY}_${userId}`;
        const data = await AsyncStorage.getItem(key);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Failed to get rate limit data:', e);
    }
    return { attempts: 0, lockoutUntil: null, lastAttempt: 0 };
};

/**
 * Save rate limit data to storage
 */
const saveRateLimitData = async (userId: string, data: RateLimitData): Promise<void> => {
    try {
        const key = `${RATE_LIMIT_KEY}_${userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save rate limit data:', e);
    }
};

/**
 * Check if user is currently rate limited
 * @param userId - User identifier for rate limiting
 * @returns Object with blocked status and remaining lockout time
 */
export const checkRateLimit = async (userId: string): Promise<{
    blocked: boolean;
    remainingTime: number;
    attemptsRemaining: number;
}> => {
    const data = await getRateLimitData(userId);
    const now = Date.now();

    // Check if currently locked out
    if (data.lockoutUntil && now < data.lockoutUntil) {
        return {
            blocked: true,
            remainingTime: Math.ceil((data.lockoutUntil - now) / 1000),
            attemptsRemaining: 0
        };
    }

    // Lockout expired, reset if needed
    if (data.lockoutUntil && now >= data.lockoutUntil) {
        await resetAttempts(userId);
        return {
            blocked: false,
            remainingTime: 0,
            attemptsRemaining: MAX_ATTEMPTS
        };
    }

    return {
        blocked: false,
        remainingTime: 0,
        attemptsRemaining: MAX_ATTEMPTS - data.attempts
    };
};

/**
 * Record a failed authentication attempt
 * @param userId - User identifier
 * @returns Updated rate limit status
 */
export const recordFailedAttempt = async (userId: string): Promise<{
    locked: boolean;
    attemptsRemaining: number;
    lockoutDuration: number;
}> => {
    const data = await getRateLimitData(userId);
    const now = Date.now();

    data.attempts += 1;
    data.lastAttempt = now;

    // Check if should lock out
    if (data.attempts >= MAX_ATTEMPTS) {
        data.lockoutUntil = now + LOCKOUT_DURATION_MS;
        await saveRateLimitData(userId, data);
        return {
            locked: true,
            attemptsRemaining: 0,
            lockoutDuration: Math.ceil(LOCKOUT_DURATION_MS / 1000)
        };
    }

    await saveRateLimitData(userId, data);
    return {
        locked: false,
        attemptsRemaining: MAX_ATTEMPTS - data.attempts,
        lockoutDuration: 0
    };
};

/**
 * Reset failed attempts (call after successful auth)
 * @param userId - User identifier
 */
export const resetAttempts = async (userId: string): Promise<void> => {
    await saveRateLimitData(userId, {
        attempts: 0,
        lockoutUntil: null,
        lastAttempt: 0
    });
};

// ============================================
// INPUT SANITIZATION
// ============================================

/**
 * Sanitize text input to prevent XSS and injection attacks
 * Removes HTML tags, script content, and dangerous characters
 * @param input - Raw user input
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
    if (!input || typeof input !== 'string') return '';

    return input
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove script tags and content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove event handlers
        .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
        .replace(/on\w+\s*=\s*'[^']*'/gi, '')
        // Remove javascript: URLs
        .replace(/javascript:/gi, '')
        // Remove data: URLs (potential XSS vector)
        .replace(/data:/gi, '')
        // Escape special HTML characters
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        // Remove null bytes
        .replace(/\0/g, '')
        // Trim whitespace
        .trim();
};

/**
 * Sanitize name input (less strict, allows common name characters)
 * @param name - User's name input
 * @returns Sanitized name
 */
export const sanitizeName = (name: string): string => {
    if (!name || typeof name !== 'string') return '';

    return name
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove script content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Only allow letters, numbers, spaces, hyphens, and common name characters
        .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s\-']/g, '')
        // Limit length
        .substring(0, 50)
        .trim();
};

/**
 * Sanitize family code input
 * @param code - Family code input
 * @returns Sanitized and formatted code
 */
export const sanitizeFamilyCode = (code: string): string => {
    if (!code || typeof code !== 'string') return '';

    return code
        // Only allow alphanumeric and hyphen
        .replace(/[^a-zA-Z0-9\-]/g, '')
        // Convert to uppercase
        .toUpperCase()
        // Limit length
        .substring(0, 15)
        .trim();
};

// ============================================
// VALIDATION
// ============================================

/**
 * Validate family code format (NAME-XXXX)
 * @param code - Family code to validate
 * @returns true if valid format
 */
export const validateFamilyCode = (code: string): boolean => {
    if (!code || typeof code !== 'string') return false;

    // Format: NAME-XXXX (at least 4 chars before hyphen, 4 alphanumeric after)
    const pattern = /^[A-Z]{1,20}-[A-Z0-9]{4}$/;
    return pattern.test(code.toUpperCase());
};

/**
 * Validate PIN format
 * @param pin - PIN to validate
 * @returns true if valid 4-digit PIN
 */
export const validatePin = (pin: string): boolean => {
    if (!pin || typeof pin !== 'string') return false;

    // Must be exactly 4 digits
    const pattern = /^\d{4}$/;
    return pattern.test(pin);
};

/**
 * Validate name
 * @param name - Name to validate
 * @returns Object with valid status and error message
 */
export const validateName = (name: string): { valid: boolean; error?: string } => {
    if (!name || typeof name !== 'string') {
        return { valid: false, error: 'İsim gerekli' };
    }

    const trimmed = name.trim();

    if (trimmed.length < 2) {
        return { valid: false, error: 'İsim en az 2 karakter olmalı' };
    }

    if (trimmed.length > 50) {
        return { valid: false, error: 'İsim çok uzun' };
    }

    // Check for invalid characters
    if (/<[^>]*>/.test(name)) {
        return { valid: false, error: 'Geçersiz karakterler' };
    }

    return { valid: true };
};

// ============================================
// SECURE STORAGE HELPERS
// ============================================

/**
 * Check if we're in a secure context (for web compatibility)
 */
export const isSecureContext = (): boolean => {
    // In React Native, we're always in a "secure" context
    // This is mainly for web compatibility checks
    return true;
};

/**
 * Generate a random secure ID
 */
export const generateSecureId = async (): Promise<string> => {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};
