import React from 'react';
import { Loader2 } from 'lucide-react';

type Props = {
  fullScreen?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  currentComponent?: string;
};

export function LoadingIndicator({ fullScreen = false, message, size = 'md', currentComponent }: Props) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`animate-spin text-indigo-600 ${sizeClasses[size]}`} />
      {message && (
        <p className="text-gray-600 text-sm">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      {content}
    </div>
  );
}