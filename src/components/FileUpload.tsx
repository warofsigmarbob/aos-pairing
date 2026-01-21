'use client';

import { useRef } from 'react';
import { Team, Player, createPlayer, generateId, RosterFile } from '@/lib/types';

interface FileUploadProps {
  label: string;
  team: Team | null;
  onTeamLoaded: (team: Team) => void;
}

export function FileUpload({ label, team, onTeamLoaded }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text) as RosterFile;

      if (!data.teamName || !Array.isArray(data.players)) {
        throw new Error('Invalid roster file format');
      }

      if (data.players.length !== 8) {
        throw new Error(`Roster must have exactly 8 players, found ${data.players.length}`);
      }

      const team: Team = {
        id: generateId(),
        name: data.teamName,
        players: data.players.map((p): Player => createPlayer({
          name: p.name,
          army: p.army,
          listName: p.listName,
          battleplanScores: p.battleplanScores,
        })),
        matchupMatrix: data.matchupMatrix,
      };

      onTeamLoaded(team);
    } catch (err) {
      alert(`Error loading roster: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Reset input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-3">{label}</h3>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
        id={`file-${label}`}
      />

      <label
        htmlFor={`file-${label}`}
        className="inline-block px-4 py-2 bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black rounded cursor-pointer hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
      >
        {team ? 'Change Roster' : 'Upload Roster'}
      </label>

      {team && (
        <div className="mt-4">
          <p className="font-medium text-green-600 dark:text-green-400 mb-2">
            {team.name} ({team.players.length} players)
          </p>
          <ul className="text-sm space-y-1 max-h-48 overflow-y-auto">
            {team.players.map((player) => (
              <li key={player.id} className="text-zinc-600 dark:text-zinc-400">
                <span className="font-medium">{player.name}</span>
                {' - '}
                <span>{player.army}</span>
                {player.listName && (
                  <span className="text-zinc-500"> ({player.listName})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
