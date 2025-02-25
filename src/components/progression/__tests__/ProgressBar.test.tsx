import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../ProgressBar';
import { ServiceRegistry } from '../../../core/services/ServiceRegistry';
import { ProgressionService } from '../../../core/services/progression/ProgressionService';

// Mock ServiceRegistry
vi.mock('../../../core/services/ServiceRegistry', () => ({
  ServiceRegistry: {
    getInstance: vi.fn(() => ({
      get: vi.fn(() => ({
        getXPForLevel: (level: number) => level * 1000
      }))
    }))
  }
}));

describe('ProgressBar', () => {
  it('renders correctly with valid props', () => {
    render(
      <ProgressBar
        currentXP={500}
        level={1}
      />
    );

    // Check for level display
    expect(screen.getByText('Level 1')).toBeInTheDocument();
    
    // Check for XP display
    expect(screen.getByText('500 XP')).toBeInTheDocument();
    expect(screen.getByText('1000 XP needed')).toBeInTheDocument();
  });

  it('calculates progress percentage correctly', () => {
    render(
      <ProgressBar
        currentXP={750}
        level={1}
      />
    );

    // Progress should be 75%
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('handles edge cases', () => {
    render(
      <ProgressBar
        currentXP={0}
        level={1}
      />
    );

    // Should show 0%
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('handles service errors gracefully', () => {
    // Mock service error
    vi.mocked(ServiceRegistry.getInstance).mockImplementationOnce(() => ({
      get: () => { throw new Error('Service error'); }
    }));

    render(
      <ProgressBar
        currentXP={500}
        level={1}
      />
    );

    // Should show fallback content
    expect(screen.getByText('Service unavailable')).toBeInTheDocument();
  });
});