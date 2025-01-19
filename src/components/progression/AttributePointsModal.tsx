import React, { useState } from 'react';
import { Dumbbell, Save } from 'lucide-react';
import type { Character, CharacterAttribute } from '../../types';
import { LoadingIndicator } from '../LoadingIndicator';
import { supabase } from '../../lib/supabase';
import { debugManager } from '../../core/debug/DebugManager';

interface Props {
  character: Character;
  onClose: () => void;
  onSave: (updatedCharacter: Character) => void;
  visible: boolean;
}

export function AttributePointsModal({ character, onClose, onSave, visible }: Props) {
  const [attributes, setAttributes] = useState<CharacterAttribute[]>(character.attributes);
  const [remainingPoints, setRemainingPoints] = useState(character.attribute_points || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!visible) return null;

  const handleAttributeChange = (index: number, change: number) => {
    const newValue = attributes[index].value + change;
    
    // Validate changes
    if (change > 0 && remainingPoints <= 0) return;
    if (newValue < 1 || newValue > 10) return;

    const newAttributes = [...attributes];
    newAttributes[index] = {
      ...newAttributes[index],
      value: newValue
    };

    setAttributes(newAttributes);
    setRemainingPoints(remainingPoints - change);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const { error } = await supabase
        .from('characters')
        .update({
          attributes,
          attribute_points: remainingPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', character.id);

      if (error) throw error;

      debugManager.log('Attributes updated', 'success', {
        characterId: character.id,
        newAttributes: attributes
      });

      onSave({
        ...character,
        attributes,
        attribute_points: remainingPoints
      });
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attributes');
      debugManager.log('Error saving attributes', 'error', { error: err });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Dumbbell className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Assign Attribute Points</h2>
            <p className="text-gray-600">
              Points remaining: {remainingPoints}
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {attributes.map((attr, index) => (
            <div key={attr.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">
                  {attr.name}
                  <span className="block text-xs text-gray-500">
                    {attr.description}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAttributeChange(index, -1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-gray-100 disabled:opacity-50"
                    disabled={attr.value <= 1}
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{attr.value}</span>
                  <button
                    onClick={() => handleAttributeChange(index, 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-gray-100 disabled:opacity-50"
                    disabled={remainingPoints <= 0 || attr.value >= 10}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600"
                  style={{ width: `${(attr.value / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <LoadingIndicator size="sm" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}