/**
 * Result of a level-up event
 * Contains information about the new level and rewards
 */
export interface LevelUpResult {
  /** The character's new level */
  newLevel: number;
  /** Number of attribute points awarded */
  attributePoints: number;
  /** Optional array of features unlocked at this level */
  unlockedFeatures?: string[];
}

/**
 * Represents an XP award event
 * Tracks the amount, source, and timing of XP gains
 */
export interface XPAward {
  /** Amount of XP awarded */
  amount: number;
  /** Description of what awarded the XP */
  source: string;
  /** ISO timestamp of when the XP was awarded */
  timestamp: string;
}

/**
 * Current state of a character's progression
 * Tracks levels, XP, and recent awards
 */
export interface ProgressionState {
  /** Current character level */
  level: number;
  /** Total XP accumulated */
  currentXP: number;
  /** XP required for next level */
  nextLevelXP: number;
  /** Available attribute points */
  attributePoints: number;
  /** Recent XP awards */
  recentAwards: XPAward[];
}