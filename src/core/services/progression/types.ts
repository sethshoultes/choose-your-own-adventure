export interface LevelUpResult {
  newLevel: number;
  attributePoints: number;
  unlockedFeatures?: string[];
}

export interface XPAward {
  amount: number;
  source: string;
  timestamp: string;
}

export interface ProgressionState {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  attributePoints: number;
  recentAwards: XPAward[];
}