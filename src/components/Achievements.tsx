import React from 'react';
import { Trophy, Star, Swords, Scroll, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LoadingIndicator } from './LoadingIndicator';

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked_at?: string;
  achievement_type: string;
  xp_reward: number;
}

export function Achievements() {
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (err) {
      console.error('Error loading achievements:', err);
      setError(err instanceof Error ? err.message : 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'STORY_MASTER':
        return <Scroll className="w-6 h-6 text-purple-600" />;
      case 'DECISION_MAKER':
        return <Swords className="w-6 h-6 text-blue-600" />;
      case 'GENRE_EXPLORER':
        return <Star className="w-6 h-6 text-yellow-600" />;
      default:
        return <Trophy className="w-6 h-6 text-emerald-600" />;
    }
  };

  if (loading) {
    return <LoadingIndicator message="Loading achievements..." />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading achievements: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 rounded-lg">
          <Trophy className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Achievements</h1>
          <p className="text-gray-600">Track your progress and unlock rewards</p>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          {achievements.length} achievements unlocked
        </h2>
      </div>

      <div className="grid gap-4">
        {/* Story Master */}
        <div className={`p-6 rounded-lg border ${achievements.find(a => a.achievement_type === 'STORY_MASTER') ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg">
              <Scroll className={`w-6 h-6 ${achievements.find(a => a.achievement_type === 'STORY_MASTER') ? 'text-purple-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Story Master</h3>
                {achievements.find(a => a.achievement_type === 'STORY_MASTER') && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
              <p className="text-gray-600 mb-2">Complete 10 story arcs</p>
              <div className="flex items-center gap-2 text-sm">
                <div className="font-medium">0/10 stories</div>
                <div className="text-indigo-600">+1000 XP</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decision Maker */}
        <div className={`p-6 rounded-lg border ${achievements.find(a => a.achievement_type === 'DECISION_MAKER') ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg">
              <Swords className={`w-6 h-6 ${achievements.find(a => a.achievement_type === 'DECISION_MAKER') ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Decision Maker</h3>
                {achievements.find(a => a.achievement_type === 'DECISION_MAKER') && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
              <p className="text-gray-600 mb-2">Make 100 choices</p>
              <div className="flex items-center gap-2 text-sm">
                <div className="font-medium">0/100 choices</div>
                <div className="text-indigo-600">+500 XP</div>
              </div>
            </div>
          </div>
        </div>

        {/* Attribute Master */}
        <div className={`p-6 rounded-lg border ${achievements.find(a => a.achievement_type === 'ATTRIBUTE_MASTER') ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg">
              <Star className={`w-6 h-6 ${achievements.find(a => a.achievement_type === 'ATTRIBUTE_MASTER') ? 'text-emerald-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Attribute Master</h3>
                {achievements.find(a => a.achievement_type === 'ATTRIBUTE_MASTER') && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
              <p className="text-gray-600 mb-2">Reach level 10 in any attribute</p>
              <div className="flex items-center gap-2 text-sm">
                <div className="font-medium">Level 0/10</div>
                <div className="text-indigo-600">+750 XP</div>
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Collector */}
        <div className={`p-6 rounded-lg border ${achievements.find(a => a.achievement_type === 'EQUIPMENT_COLLECTOR') ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg">
              <Trophy className={`w-6 h-6 ${achievements.find(a => a.achievement_type === 'EQUIPMENT_COLLECTOR') ? 'text-yellow-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Equipment Collector</h3>
                {achievements.find(a => a.achievement_type === 'EQUIPMENT_COLLECTOR') && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
              <p className="text-gray-600 mb-2">Collect 10 unique pieces of equipment</p>
              <div className="flex items-center gap-2 text-sm">
                <div className="font-medium">9/10 items</div>
                <div className="text-indigo-600">+300 XP</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}