import { useCallback } from 'react';

export function useNavigate() {
  const navigateToHome = useCallback(() => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new CustomEvent('navigationChange', { detail: { page: 'home' } }));
  }, []);

  const navigateToCharacters = useCallback(() => {
    window.history.pushState({}, '', '/characters');
    window.dispatchEvent(new CustomEvent('navigationChange', { detail: { page: 'characters' } }));
  }, []);

  return { navigateToHome, navigateToCharacters };
}