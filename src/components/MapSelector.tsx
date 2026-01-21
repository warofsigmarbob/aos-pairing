'use client';

import { GameMap } from '@/lib/types';

interface MapSelectorProps {
  availableMaps: GameMap[];
  selectedMaps: GameMap[];
  onSelectionChange: (maps: GameMap[]) => void;
  maxSelection?: number;
}

export function MapSelector({
  availableMaps,
  selectedMaps,
  onSelectionChange,
  maxSelection = 4,
}: MapSelectorProps) {
  const isSelected = (map: GameMap) =>
    selectedMaps.some((m) => m.id === map.id);

  const toggleMap = (map: GameMap) => {
    if (isSelected(map)) {
      // Remove from selection
      onSelectionChange(selectedMaps.filter((m) => m.id !== map.id));
    } else if (selectedMaps.length < maxSelection) {
      // Add to selection (maintain order)
      onSelectionChange([...selectedMaps, map]);
    }
  };

  const getSelectionOrder = (map: GameMap) => {
    const index = selectedMaps.findIndex((m) => m.id === map.id);
    return index >= 0 ? index + 1 : null;
  };

  return (
    <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-2">
        Select {maxSelection} Maps
        <span className="text-sm font-normal text-zinc-500 ml-2">
          ({selectedMaps.length}/{maxSelection} selected)
        </span>
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        Click maps in the order they will be played
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {availableMaps.map((map) => {
          const selected = isSelected(map);
          const order = getSelectionOrder(map);
          const disabled = !selected && selectedMaps.length >= maxSelection;

          return (
            <button
              key={map.id}
              onClick={() => toggleMap(map)}
              disabled={disabled}
              className={`
                relative p-3 rounded border text-left transition-all
                ${selected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : disabled
                    ? 'border-zinc-200 dark:border-zinc-800 opacity-50 cursor-not-allowed'
                    : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
                }
              `}
            >
              {order && (
                <span className="absolute top-1 right-1 w-6 h-6 bg-blue-500 text-white text-sm rounded-full flex items-center justify-center font-medium">
                  {order}
                </span>
              )}
              <span className="block font-medium text-sm">{map.name}</span>
              {map.description && (
                <span className="block text-xs text-zinc-500 mt-1 truncate">
                  {map.description}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedMaps.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <h4 className="text-sm font-medium mb-2">Play Order:</h4>
          <ol className="list-decimal list-inside text-sm text-zinc-600 dark:text-zinc-400">
            {selectedMaps.map((map) => (
              <li key={map.id}>{map.name}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
