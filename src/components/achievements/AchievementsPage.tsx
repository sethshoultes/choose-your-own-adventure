import React from 'react';
import { Trophy } from 'lucide-react';
import { AchievementList } from './AchievementList';

export function AchievementsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      <div className="flex justify-center mb-16">
        <img
          src="https://adventurebuildrstorage.storage.googleapis.com/wp-content/uploads/2024/10/11185818/AdventureBuildr-Logo-e1731351627826.png"
          alt="AdventureBuildr Logo"
          className="w-auto"
        />
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <Trophy className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Achievements</h1>
            <p className="text-gray-600">Track your progress and unlock rewards</p>
          </div>
        </div>

        <AchievementList />
      </div>
    </div>
  );
}