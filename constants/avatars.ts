// Avatar sabitleri

export interface Avatar {
    id: string;
    emoji: string;
    label: { en: string; tr: string };
}

export const CHILD_AVATARS: Avatar[] = [
    { id: 'knight', emoji: '🛡️', label: { en: 'Knight', tr: 'Şövalye' } },
    { id: 'mage', emoji: '🧙', label: { en: 'Mage', tr: 'Büyücü' } },
    { id: 'ranger', emoji: '🏹', label: { en: 'Ranger', tr: 'Okçu' } },
    { id: 'princess', emoji: '👸', label: { en: 'Princess', tr: 'Prenses' } },
    { id: 'prince', emoji: '🤴', label: { en: 'Prince', tr: 'Prens' } },
    { id: 'ninja', emoji: '🥷', label: { en: 'Ninja', tr: 'Ninja' } },
    { id: 'dragon', emoji: '🐉', label: { en: 'Dragon', tr: 'Ejderha' } },
    { id: 'unicorn', emoji: '🦄', label: { en: 'Unicorn', tr: 'Unicorn' } },
    { id: 'fairy', emoji: '🧚', label: { en: 'Fairy', tr: 'Peri' } },
    { id: 'mermaid', emoji: '🧜‍♀️', label: { en: 'Mermaid', tr: 'Deniz Kızı' } },
];

export const PARENT_AVATARS = {
    mom: [
        { id: 'queen', emoji: '👑', label: { en: 'Queen', tr: 'Kraliçe' } },
        { id: 'wizard_f', emoji: '🧙‍♀️', label: { en: 'Wise Woman', tr: 'Bilge Kadın' } },
        { id: 'guardian_f', emoji: '🦸‍♀️', label: { en: 'Guardian', tr: 'Koruyucu' } },
    ],
    dad: [
        { id: 'king', emoji: '👑', label: { en: 'King', tr: 'Kral' } },
        { id: 'wizard_m', emoji: '🧙‍♂️', label: { en: 'Wise Man', tr: 'Bilge Adam' } },
        { id: 'guardian_m', emoji: '🦸‍♂️', label: { en: 'Guardian', tr: 'Koruyucu' } },
    ],
};

export const getAvatarEmoji = (avatarId: string): string => {
    const allAvatars = [
        ...CHILD_AVATARS,
        ...PARENT_AVATARS.mom,
        ...PARENT_AVATARS.dad,
    ];
    const avatar = allAvatars.find(a => a.id === avatarId);
    return avatar?.emoji || '👤';
};
