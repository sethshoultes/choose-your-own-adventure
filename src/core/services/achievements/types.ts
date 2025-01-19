export type AchievementType = 
  | 'STORY_MASTER'
  | 'DECISION_MAKER'
  | 'ATTRIBUTE_MASTER'
  | 'GENRE_EXPLORER'
  | 'EQUIPMENT_COLLECTOR';

export interface Achievement {
  id: AchievementType;
  title: string;
  description: string;
  icon: string;
  requirements: {
    choicesMade?: number;
    storiesCompleted?: number;
    maxAttributeLevel?: number;
    uniqueGenres?: number;
    uniqueEquipment?: number;
  };
  xpReward: number;
  unlockedAt?: string;
}

export interface AchievementProgress {
  uniqueGenres: number;
  uniqueEquipment: number;
  choicesMade?: number;
  storiesCompleted?: number;
  maxAttributeLevel?: number;
}