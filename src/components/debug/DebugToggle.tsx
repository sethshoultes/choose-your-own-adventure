import React from 'react';
import { Bug } from 'lucide-react';
import { useDebugStore } from '../../core/debug/DebugManager';

export function DebugToggle() {
  const { enabled, toggleDebug } = useDebugStore();

  return (
    <button
      onClick={toggleDebug}
      className={`fixed top-4 left-4 p-2 rounded-full shadow-lg transition-colors ${
        enabled ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
      }`}
      title={enabled ? 'Disable debug mode' : 'Enable debug mode'}
    >
      <Bug className="w-5 h-5" />
      <span className="sr-only">
        {enabled ? 'Disable debug mode' : 'Enable debug mode'}
      </span>
    </button>
  );
}