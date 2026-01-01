
import React from 'react';
import {
  Sparkles,
  BookOpen,
  Trash2,
  Heart,
  Sword,
  Shield,
  Gamepad2,
  Utensils,
  Star
} from 'lucide-react-native';
import { Quest, QuestCategory, Reward } from './types';

export const CATEGORY_METADATA: Record<QuestCategory, { icon: React.ReactNode, color: string, label: string }> = {
  care: {
    icon: <Heart size={24} color="#fb7185" />,
    color: '#fb7185',
    label: 'Kişisel Bakım'
  },
  study: {
    icon: <BookOpen size={24} color="#60a5fa" />,
    color: '#3b82f6',
    label: 'Bilgelik Yolu'
  },
  clean: {
    icon: <Trash2 size={24} color="#10b981" />,
    color: '#10b981',
    label: 'Krallık Temizliği'
  },
  magic: {
    icon: <Sparkles size={24} color="#f59e0b" />,
    color: '#f59e0b',
    label: 'Özel Görev'
  },
};

export const INITIAL_REWARDS: Reward[] = [
  { id: '1', name: 'Efsanevi Pizza Gecesi', cost: 500, type: 'real', icon: '🍕', isUnlocked: false },
  { id: '2', name: '30 Dakika Ekran Zamanı', cost: 150, type: 'digital', icon: '🎮', isUnlocked: false },
  { id: '3', name: 'Geç Uyuma Hakkı (1 Saat)', cost: 300, type: 'real', icon: '🌙', isUnlocked: false },
  { id: '4', name: 'Yeni Kahraman Kıyafeti', cost: 100, type: 'digital', icon: '🛡️', isUnlocked: false },
  { id: '5', name: 'Park Macerası Seçimi', cost: 400, type: 'real', icon: '🌳', isUnlocked: false },
];

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'q1',
    titleKey: 'Diş Fırçalama Ritüeli',
    description: 'Dişlerini fırçalayarak inci beyazı kalkanını güçlendir!',
    xpReward: 20,
    status: 'active',
    category: 'care',
    createdAt: Date.now()
  },
  {
    id: 'q2',
    titleKey: 'Oda Toplama Büyüsü',
    description: 'Oyuncak canavarları ait oldukları kutulara hapset.',
    xpReward: 50,
    status: 'active',
    category: 'clean',
    createdAt: Date.now()
  },
];
