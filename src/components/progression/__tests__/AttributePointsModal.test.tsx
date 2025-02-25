import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttributePointsModal } from '../AttributePointsModal';
import type { Character } from '../../../core/types';

describe('AttributePointsModal', () => {
  const mockCharacter: Character = {
    id: '123',
    name: 'Test Character',
    genre: 'Fantasy',
    attributes: [
      { name: 'Strength', value: 5, description: 'Physical power' },
      { name: 'Intelligence', value: 5, description: 'Mental acuity' }
    ],
    equipment: [],
    backstory: '',
    attribute_points: 3
  };

  it('renders character attributes', () => {
    render(
      <AttributePointsModal
        character={mockCharacter}
        onClose={() => {}}
        onSave={() => {}}
        visible={true}
      />
    );

    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Points remaining: 3')).toBeInTheDocument();
  });

  it('handles attribute increases', () => {
    render(
      <AttributePointsModal
        character={mockCharacter}
        onClose={() => {}}
        onSave={() => {}}
        visible={true}
      />
    );

    // Find and click the increase button for Strength
    const increaseButtons = screen.getAllByText('+');
    fireEvent.click(increaseButtons[0]);

    // Check if points remaining decreased
    expect(screen.getByText('Points remaining: 2')).toBeInTheDocument();
  });

  it('handles attribute decreases', () => {
    render(
      <AttributePointsModal
        character={mockCharacter}
        onClose={() => {}}
        onSave={() => {}}
        visible={true}
      />
    );

    // First increase then decrease
    const increaseButtons = screen.getAllByText('+');
    const decreaseButtons = screen.getAllByText('-');
    
    fireEvent.click(increaseButtons[0]);
    fireEvent.click(decreaseButtons[0]);

    // Check if points remaining is back to original
    expect(screen.getByText('Points remaining: 3')).toBeInTheDocument();
  });

  it('prevents attributes going below 1', () => {
    render(
      <AttributePointsModal
        character={mockCharacter}
        onClose={() => {}}
        onSave={() => {}}
        visible={true}
      />
    );

    // Try to decrease attribute at 5
    const decreaseButtons = screen.getAllByText('-');
    fireEvent.click(decreaseButtons[0]);

    // Value should still be 5
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('prevents attributes going above 10', () => {
    const highCharacter = {
      ...mockCharacter,
      attributes: [
        { name: 'Strength', value: 10, description: 'Physical power' }
      ]
    };

    render(
      <AttributePointsModal
        character={highCharacter}
        onClose={() => {}}
        onSave={() => {}}
        visible={true}
      />
    );

    // Try to increase attribute at 10
    const increaseButtons = screen.getAllByText('+');
    fireEvent.click(increaseButtons[0]);

    // Value should still be 10
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('handles save action', async () => {
    const onSave = vi.fn();
    
    render(
      <AttributePointsModal
        character={mockCharacter}
        onClose={() => {}}
        onSave={onSave}
        visible={true}
      />
    );

    // Make some changes
    const increaseButtons = screen.getAllByText('+');
    fireEvent.click(increaseButtons[0]);

    // Save changes
    fireEvent.click(screen.getByText('Save Changes'));
    
    expect(onSave).toHaveBeenCalled();
  });

  it('handles close action', () => {
    const onClose = vi.fn();
    
    render(
      <AttributePointsModal
        character={mockCharacter}
        onClose={onClose}
        onSave={() => {}}
        visible={true}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});