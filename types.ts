
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
  type?: 'daily' | 'routine';
  completedAt?: number;
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
  id: string;
  family_id: string;
  role: Role;
  xp: number;
  level: number;
  name: string;
  streak: number;
  avatar?: string;
  heroClass?: 'knight' | 'mage' | 'ranger';
  lastBlessingFrom?: ParentType;
  pin_hash?: string;
  parent_type?: ParentType;
}

export type EvolutionStage = 'egg' | 'hatching' | 'baby' | 'teen' | 'adult';

export interface PetState {
  id: string;
  name: string;
  type: string;
  level: number;
  stage: EvolutionStage;
  evolution: number; // Current progress to next goal (0-100)
  goldSpent: number; // Total gold spent in current stage
  evolutionStartTime?: number; // When the 24h wait started
  happiness: number;
  energy: number;
  lastUpdate: number;
}

export interface Family {
  id: string;
  name: string;
  family_code: string;
}
