import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import tr from './tr.json';

const LANGUAGE_KEY = 'questnest_language';

const i18n = new I18n({ en, tr });

// Get device locale safely - native module might not be ready in production
let deviceLocale = 'en';
try {
    const locales = getLocales();
    deviceLocale = locales[0]?.languageCode || 'en';
} catch (e) {
    console.warn('[i18n] Failed to get device locale, using default:', e);
}

// Set initial locale (will be overridden by saved preference if exists)
i18n.locale = deviceLocale === 'tr' ? 'tr' : 'en';

// Fallback: use English if translation not found
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Load saved language preference
export const loadSavedLanguage = async (): Promise<string> => {
    try {
        const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLang && (savedLang === 'en' || savedLang === 'tr')) {
            i18n.locale = savedLang;
            return savedLang;
        }
    } catch (e) {
        console.error('Failed to load language preference:', e);
    }
    return i18n.locale;
};

// Change language and persist
export const changeLanguage = async (lang: 'en' | 'tr'): Promise<void> => {
    i18n.locale = lang;
    try {
        await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch (e) {
        console.error('Failed to save language preference:', e);
    }
};

// Get current language
export const getCurrentLanguage = (): string => {
    return i18n.locale;
};

export default i18n;
