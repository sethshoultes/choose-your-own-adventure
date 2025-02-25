import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { XPNotification } from '../XPNotification';

describe('XPNotification', () => {
  it('renders XP amount and source', () => {
    render(
      <XPNotification
        xp={100}
        source="Quest completion"
        onComplete={() => {}}
      />
    );

    expect(screen.getByText('+100 XP')).toBeInTheDocument();
    expect(screen.getByText('Quest completion')).toBeInTheDocument();
  });

  it('calls onComplete after timeout', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    render(
      <XPNotification
        xp={100}
        source="Quest completion"
        onComplete={onComplete}
      />
    );

    vi.advanceTimersByTime(3000);
    expect(onComplete).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('cleans up timeout on unmount', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    const { unmount } = render(
      <XPNotification
        xp={100}
        source="Quest completion"
        onComplete={onComplete}
      />
    );

    unmount();
    vi.advanceTimersByTime(3000);
    expect(onComplete).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});