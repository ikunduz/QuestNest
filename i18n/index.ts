import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from './en.json';
import tr from './tr.json';

const i18n = new I18n({ en, tr });

// Cihaz dilini al ('tr-TR' -> 'tr')
i18n.locale = Localization.locale.split('-')[0];

// Fallback: dil bulunamazsa İngilizce kullan
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
