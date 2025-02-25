import React from 'react';
import { supabase } from '../lib/supabase';

type Props = {
  username?: string;
  currentComponent?: string;
};

export function Footer({ username, currentComponent }: Props) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex flex-col">
          <p className="text-sm text-gray-600">
            {username ? `Logged in as ${username}` : 'Adventure Game'}
          </p>
          <p className="text-xs text-gray-400">
            Component: {currentComponent || 'Unknown'}
          </p>
        </div>
        <p className="text-sm text-gray-500">© 2025 AdventureBuildr Text Adventure Games</p>
      </div>
    </footer>
  );
}