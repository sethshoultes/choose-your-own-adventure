import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LevelUpModal } from '../LevelUpModal';
import type { LevelUpResult } from '../../../core/services/progression/ProgressionService';

describe('LevelUpModal', () => {
  const mockResult: LevelUpResult = {
    newLevel: 5,
    attributePoints: 2,
    unlockedFeatures: ['Special Abilities']
  };

  it('renders level up information', () => {
    render(
      <LevelUpModal
        result={mockResult}
        onClose={() => {}}
        onAttributePointsAssigned={() => {}}
        visible={true}
      />
    );

    expect(screen.getByText('Level Up!')).toBeInTheDocument();
    expect(screen.getByText(/level 5/i)).toBeInTheDocument();
    expect(screen.getByText(/2 points/i)).toBeInTheDocument();
    expect(screen.getByText('Special Abilities')).toBeInTheDocument();
  });

  it('handles close button click', () => {
    const onClose = vi.fn();
    
    render(
      <LevelUpModal
        result={mockResult}
        onClose={onClose}
        onAttributePointsAssigned={() => {}}
        visible={true}
      />
    );

    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('handles attribute points assignment', () => {
    const onAttributePointsAssigned = vi.fn();
    
    render(
      <LevelUpModal
        result={mockResult}
        onClose={() => {}}
        onAttributePointsAssigned={onAttributePointsAssigned}
        visible={true}
      />
    );

    fireEvent.click(screen.getByText('Assign Points'));
    expect(onAttributePointsAssigned).toHaveBeenCalled();
  });

  it('does not render when not visible', () => {
    render(
      <LevelUpModal
        result={mockResult}
        onClose={() => {}}
        onAttributePointsAssigned={() => {}}
        visible={false}
      />
    );

    expect(screen.queryByText('Level Up!')).not.toBeInTheDocument();
  });
});