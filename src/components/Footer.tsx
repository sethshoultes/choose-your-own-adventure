import React from 'react';
import { supabase } from '../lib/supabase';

type Props = {
  username?: string;
};

export function Footer({ username }: Props) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {username ? `Logged in as ${username}` : 'Adventure Game'}
        </p>
        <p className="text-sm text-gray-500">© 2024 Adventure Game</p>
      </div>
    </footer>
  );
}