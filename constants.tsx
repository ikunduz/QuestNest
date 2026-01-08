
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

import i18n from './i18n';

export const getCategoryMetadata = (): Record<QuestCategory, { icon: React.ReactNode, color: string, label: string }> => ({
  care: {
    icon: <Heart size={24} color="#fb7185" />,
    color: '#fb7185',
    label: i18n.t('categories.care')
  },
  study: {
    icon: <BookOpen size={24} color="#60a5fa" />,
    color: '#3b82f6',
    label: i18n.t('categories.study')
  },
  clean: {
    icon: <Trash2 size={24} color="#10b981" />,
    color: '#10b981',
    label: i18n.t('categories.clean')
  },
  magic: {
    icon: <Sparkles size={24} color="#f59e0b" />,
    color: '#f59e0b',
    label: i18n.t('categories.magic')
  },
});

export const getInitialRewards = (): Reward[] => [
  { id: '1', name: i18n.t('initialRewards.pizzaNight'), cost: 500, type: 'real', icon: '🍕', isUnlocked: false },
  { id: '2', name: i18n.t('initialRewards.screenTime'), cost: 150, type: 'digital', icon: '🎮', isUnlocked: false },
  { id: '3', name: i18n.t('initialRewards.lateSleep'), cost: 300, type: 'real', icon: '🌙', isUnlocked: false },
  { id: '4', name: i18n.t('initialRewards.heroOutfit'), cost: 100, type: 'digital', icon: '🛡️', isUnlocked: false },
  { id: '5', name: i18n.t('initialRewards.parkAdventure'), cost: 400, type: 'real', icon: '🌳', isUnlocked: false },
];

export const getInitialQuests = (): Quest[] => [
  {
    id: 'q1',
    titleKey: i18n.t('initialQuests.brushTeethTitle'),
    description: i18n.t('initialQuests.brushTeethDesc'),
    xpReward: 20,
    status: 'active',
    category: 'care',
    createdAt: Date.now()
  },
  {
    id: 'q2',
    titleKey: i18n.t('initialQuests.cleanRoomTitle'),
    description: i18n.t('initialQuests.cleanRoomDesc'),
    xpReward: 50,
    status: 'active',
    category: 'clean',
    createdAt: Date.now()
  },
];
