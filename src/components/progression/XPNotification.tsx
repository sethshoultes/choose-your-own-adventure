import React, { useEffect } from 'react';
import { Star } from 'lucide-react';

interface Props {
  xp: number;
  source: string;
  onComplete: () => void;
}

export function XPNotification({ xp, source, onComplete }: Props) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed bottom-24 right-4 animate-slide-up">
      <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <Star className="w-4 h-4" />
        <div>
          <p className="font-medium">+{xp} XP</p>
          <p className="text-xs text-indigo-200">{source}</p>
        </div>
      </div>
    </div>
  );
}