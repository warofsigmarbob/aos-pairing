'use client';

import { Player } from '@/lib/types';

interface PlayerSelectorProps {
  players: Player[];
  selectedIds: string[];
  onSelect: (player: Player) => void;
  maxSelection?: number;
  disabled?: boolean;
  highlightColor?: 'blue' | 'red' | 'green';
}

export function PlayerSelector({
  players,
  selectedIds,
  onSelect,
  maxSelection = 1,
  disabled = false,
  highlightColor = 'blue',
}: PlayerSelectorProps) {
  const isSelected = (player: Player) => selectedIds.includes(player.id);
  const canSelect = selectedIds.length < maxSelection;

  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
    red: 'border-red-500 bg-red-50 dark:bg-red-950',
    green: 'border-green-500 bg-green-50 dark:bg-green-950',
  };

  return (
    <div className="space-y-2">
      {players.map((player) => {
        const selected = isSelected(player);
        const clickable = !disabled && (selected || canSelect);

        return (
          <button
            key={player.id}
            onClick={() => clickable && onSelect(player)}
            disabled={!clickable}
            className={`
              w-full p-3 rounded-lg border text-left transition-all
              ${selected
                ? colorClasses[highlightColor]
                : disabled || !canSelect
                  ? 'border-zinc-200 dark:border-zinc-800 opacity-50 cursor-not-allowed'
                  : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 cursor-pointer'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium block">{player.name}</span>
                <span className="text-sm text-zinc-500">
                  {player.army}
                  {player.listName && ` - ${player.listName}`}
                </span>
              </div>
              {selected && (
                <span
                  className={`text-sm font-medium ${
                    highlightColor === 'blue'
                      ? 'text-blue-600'
                      : highlightColor === 'red'
                        ? 'text-red-600'
                        : 'text-green-600'
                  }`}
                >
                  Selected
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
