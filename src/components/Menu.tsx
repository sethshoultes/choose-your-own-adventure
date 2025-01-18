import React, { useState } from 'react';
import { Menu as MenuIcon, X, Home, User, Users, Settings, Bug, Zap } from 'lucide-react';
import { LogoutButton } from './LogoutButton';
import { supabase } from '../lib/supabase';
import { DebugPanel } from './debug/DebugPanel';
import { useDebugStore } from '../core/debug/DebugManager';

type Props = {
  username: string | null;
  onNavigate?: (page: 'home' | 'characters' | 'profile') => void;
};

export function Menu({ username, onNavigate }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { enabled: debugEnabled, toggleDebug } = useDebugStore();

  React.useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleNavigation = (page: 'home' | 'characters' | 'profile') => {
    if (onNavigate) {
      onNavigate(page);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {debugEnabled && <DebugPanel />}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-2 flex items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
          aria-label="Toggle menu"
        >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-600" />
        ) : (
          <MenuIcon className="w-6 h-6 text-gray-600" />
        )}
        </button>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu panel */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* User info */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {username || 'Guest'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation items */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {[
                {
                  label: 'Home',
                  icon: <Home className="w-5 h-5" />,
                  onClick: () => handleNavigation('home')
                },
                {
                  label: 'Characters',
                  icon: <Users className="w-5 h-5" />,
                  onClick: () => handleNavigation('characters')
                },
                {
                  label: 'Profile Settings',
                  icon: <Settings className="w-5 h-5" />,
                  onClick: () => handleNavigation('profile')
                },
               isAdmin && {
                 label: 'Test Panel',
                 icon: <Zap className="w-5 h-5" />,
                 onClick: () => handleNavigation('test')
               },
                isAdmin && {
                  label: 'Debug Console',
                  icon: <Bug className="w-5 h-5" />,
                  onClick: toggleDebug,
                  active: debugEnabled,
                  badge: debugEnabled ? 'Active' : undefined
                }
              ].filter(Boolean).map((item) => (
                <li key={item.label}>
                  <button
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 ${
                      item.active ? 'bg-indigo-50' : ''
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer actions */}
          <div className="p-4 border-t">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}