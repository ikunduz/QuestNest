// Tema sabitleri ve renk paletleri

export type ThemeType = 'hero' | 'fairy' | 'magical' | 'ocean';

export interface ThemeColors {
    background: string;
    cardBackground: string;
    accent: string;
    accentSecondary: string;
    text: string;
    textSecondary: string;
    border: string;
}

export interface Theme {
    id: ThemeType;
    name: string;
    emoji: string;
    colors: ThemeColors;
    currency: { name: string; emoji: string };
    structure: { name: string; emoji: string };
}

export const THEMES: Record<ThemeType, Theme> = {
    hero: {
        id: 'hero',
        name: 'Kahraman',
        emoji: '⚔️',
        colors: {
            background: '#0f172a',
            cardBackground: '#1e293b',
            accent: '#fbbf24',
            accentSecondary: '#f59e0b',
            text: '#ffffff',
            textSecondary: '#94a3b8',
            border: '#334155',
        },
        currency: { name: 'Altın', emoji: '💰' },
        structure: { name: 'Kale', emoji: '🏰' },
    },
    fairy: {
        id: 'fairy',
        name: 'Peri',
        emoji: '🧚',
        colors: {
            background: '#1a1625',
            cardBackground: '#2d2640',
            accent: '#f472b6',
            accentSecondary: '#ec4899',
            text: '#ffffff',
            textSecondary: '#c4b5fd',
            border: '#4c3d5e',
        },
        currency: { name: 'Kristal', emoji: '💎' },
        structure: { name: 'Peri Bahçesi', emoji: '🌸' },
    },
    magical: {
        id: 'magical',
        name: 'Büyülü',
        emoji: '🦄',
        colors: {
            background: '#0f1729',
            cardBackground: '#1e2a45',
            accent: '#a78bfa',
            accentSecondary: '#8b5cf6',
            text: '#ffffff',
            textSecondary: '#c4b5fd',
            border: '#3b3a5c',
        },
        currency: { name: 'Yıldız', emoji: '⭐' },
        structure: { name: 'Sihirli Orman', emoji: '🌳' },
    },
    ocean: {
        id: 'ocean',
        name: 'Deniz',
        emoji: '🌊',
        colors: {
            background: '#0a1628',
            cardBackground: '#132f4c',
            accent: '#22d3ee',
            accentSecondary: '#06b6d4',
            text: '#ffffff',
            textSecondary: '#7dd3fc',
            border: '#1e4976',
        },
        currency: { name: 'İnci', emoji: '🐚' },
        structure: { name: 'Sualtı Sarayı', emoji: '🏰' },
    },
};

export const getTheme = (themeId: ThemeType): Theme => {
    return THEMES[themeId] || THEMES.hero;
};
