import React from 'react';
import { AlertCircle, UserCircle } from 'lucide-react';

type Props = {
  session: any;
};

export function AuthStatus({ session }: Props) {
  if (!session) {
    return (
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-yellow-50 border-t border-yellow-200">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-yellow-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            You are not logged in. Your progress will not be saved. Please sign in or create an account to save your progress.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 p-4">
      <div className="flex items-center gap-2 text-gray-600 bg-white px-4 py-2 rounded-lg shadow-lg">
        <UserCircle className="w-5 h-5" />
        <span className="text-sm font-medium">{session.user.email}</span>
      </div>
    </div>
  );
}