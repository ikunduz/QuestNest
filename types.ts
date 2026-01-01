
export type Role = 'parent' | 'child';
export type ParentType = 'mom' | 'dad';

export type QuestStatus = 'active' | 'pending_approval' | 'completed';

export type QuestCategory = 'care' | 'study' | 'clean' | 'magic';

export interface Quest {
  id: string;
  titleKey: string;
  description: string;
  xpReward: number;
  status: QuestStatus;
  category: QuestCategory;
  proofUrl?: string;
  createdAt: number;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  type: 'real' | 'digital';
  icon: string;
  isUnlocked: boolean;
}

export interface UserState {
  role: Role;
  xp: number;
  level: number;
  name: string;
  streak: number;
  avatar?: string; // Base64 or class name
  heroClass?: 'knight' | 'mage' | 'ranger';
  lastBlessingFrom?: ParentType;
}
