/**
 * ProgressionHandler Class
 * 
 * This class manages character progression events in the AdventureBuildr game engine.
 * It handles XP awards, level-ups, and achievement triggers based on player choices
 * and game events. The handler works alongside the auto-save system to ensure
 * progression data is reliably persisted.
 * 
 * Key Features:
 * - Choice-based XP awards
 * - Level-up processing
 * - Achievement integration
 * - Progress tracking
 * - State persistence
 * 
 * Data Flow:
 * 1. Choice event reception
 * 2. XP calculation and award
 * 3. Level-up check and processing
 * 4. Achievement validation
 * 5. State persistence
 * 
 * @see GameEngine for game state integration
 * @see ProgressionService for XP management
 * @see AchievementService for achievement tracking
 */

import type { Character, GameHistoryEntry } from '../types';
import { ProgressionService } from '../services/progression/ProgressionService';
import { AchievementService } from '../services/achievements/AchievementService';
import { supabase } from '../../lib/supabase';
import { debugManager } from '../debug/DebugManager';

export class ProgressionHandler {
  /**
   * Handles progression after a player makes a choice
   * Awards XP, checks for level-ups, and triggers achievements
   * 
   * @param character Current character
   * @param choice Selected choice text
   * @param history Game history
   * @param callbacks Progression event callbacks
   * @throws Error if progression handling fails
   * 
   * @example
   * ```typescript
   * await progressionHandler.handleChoiceMade(
   *   character,
   *   selectedChoice,
   *   gameHistory,
   *   {
   *     onXP: showXPNotification,
   *     onLevelUp: handleLevelUp,
   *     onAchievementUnlocked: showAchievement
   *   }
   * );
   * ```
   */
  public async handleChoiceMade(
    character: Character,
    choice: string,
    history: GameHistoryEntry[],
    callbacks: {
      onXP?: (amount: number, source: string) => void;
      onLevelUp: (result: LevelUpResult) => void;
      onAchievementUnlocked?: (achievement: Achievement) => void;
    }
  ): Promise<void> {
    try {
      // Update choice count in user_stats
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Get current stats
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('choices_made')
        .eq('user_id', user.id)
        .single();

      const currentChoices = (currentStats?.choices_made || 0) + 1;

      // Award XP for making a choice
      const multiplier = ProgressionService.calculateChoiceMultiplier(
        choice,
        history,
        character
      );
      
      const { levelUp, xpAwarded } = await ProgressionService.awardXP(
        character,
        'CHOICE_MADE',
        { multiplier }
      );

      // Notify about XP gain
      callbacks.onXP?.(xpAwarded, 'Choice made');

      // Handle level up
      if (levelUp) {
        const levelUpResult = await ProgressionService.processLevelUp(character);
        if (levelUpResult) {
          debugManager.log('Character leveled up', 'success', { levelUpResult });
          callbacks.onLevelUp(levelUpResult);
        }
      }

      // Check for achievements
      await AchievementService.checkAchievements(character, {
        choicesMade: currentChoices,
        onAchievementUnlocked: callbacks.onAchievementUnlocked
      });
    } catch (error) {
      debugManager.log('Error in progression handler', 'error', { error });
      throw error;
    }
  }
}

/**
 * Integration Points:
 * 
 * 1. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private async handleChoice(choiceId: number): Promise<void> {
 *      const choice = this.state.currentScene.choices
 *        .find(c => c.id === choiceId);
 *        
 *      await this.progressionHandler.handleChoiceMade(
 *        this.character,
 *        choice.text,
 *        this.state.history,
 *        {
 *          onXP: this.handleXP,
 *          onLevelUp: this.handleLevelUp,
 *          onAchievementUnlocked: this.handleAchievement
 *        }
 *      );
 *    }
 *    ```
 * 
 * 2. UI Components
 *    ```typescript
 *    // In StoryScene component
 *    const handleChoice = async (choiceId: number) => {
 *      setLoading(true);
 *      try {
 *        await gameEngine.handleChoice(choiceId, {
 *          onXP: (amount, source) => {
 *            showXPNotification(amount, source);
 *          },
 *          onLevelUp: (result) => {
 *            showLevelUpModal(result);
 *          },
 *          onAchievementUnlocked: (achievement) => {
 *            showAchievementNotification(achievement);
 *          }
 *        });
 *      } catch (error) {
 *        handleError(error);
 *      } finally {
 *        setLoading(false);
 *      }
 *    };
 *    ```
 * 
 * 3. Database Integration
 *    ```sql
 *    -- User stats tracking
 *    CREATE TABLE user_stats (
 *      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *      user_id uuid REFERENCES auth.users(id),
 *      choices_made integer DEFAULT 0,
 *      total_xp integer DEFAULT 0,
 *      created_at timestamptz DEFAULT now(),
 *      updated_at timestamptz DEFAULT now()
 *    );
 *    
 *    -- Character progression
 *    CREATE TABLE character_progression (
 *      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *      character_id uuid REFERENCES characters(id),
 *      level integer NOT NULL DEFAULT 1,
 *      experience_points integer NOT NULL DEFAULT 0,
 *      attribute_points integer NOT NULL DEFAULT 0,
 *      updated_at timestamptz DEFAULT now()
 *    );
 *    ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   await progressionHandler.handleChoiceMade(
 *     character,
 *     choice,
 *     history,
 *     callbacks
 *   );
 * } catch (error) {
 *   debugManager.log('Progression handling failed', 'error', { error });
 *   // Continue game but notify user of progression issue
 *   showError('Unable to process progression. Please try again later.');
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always handle progression errors gracefully
 * 2. Validate progression data
 * 3. Maintain progression consistency
 * 4. Log progression events
 * 5. Handle edge cases
 * 
 * Performance Optimization:
 * ```typescript
 * // Batch progression updates
 * const batchProgressionUpdates = async (
 *   updates: ProgressionUpdate[]
 * ) => {
 *   const results = await Promise.all(
 *     updates.map(update => 
 *       handleProgressionUpdate(update)
 *         .catch(error => {
 *           debugManager.log('Update failed', 'error', { error });
 *           return null;
 *         })
 *     )
 *   );
 *   return results.filter(Boolean);
 * };
 * 
 * // Cache progression data
 * const progressionCache = new Map<string, ProgressionState>();
 * 
 * const getCachedProgression = async (
 *   characterId: string
 * ): Promise<ProgressionState> => {
 *   if (!progressionCache.has(characterId)) {
 *     const state = await loadProgressionState(characterId);
 *     progressionCache.set(characterId, state);
 *   }
 *   return progressionCache.get(characterId)!;
 * };
 * ```
 * 
 * The handler works alongside the auto-save system to ensure progression data
 * is reliably persisted after each choice and level-up event.
 * 
 * @see ProgressionService for XP and leveling
 * @see AchievementService for achievements
 * @see GameEngine for game state
 */