import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import en from './en.json';
import tr from './tr.json';

const i18n = new I18n({ en, tr });

// Cihaz dilini al
const deviceLocale = getLocales()[0]?.languageCode || 'en';
i18n.locale = deviceLocale;

// Fallback: dil bulunamazsa İngilizce kullan
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
