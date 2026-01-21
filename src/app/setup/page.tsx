'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/FileUpload';
import { MapSelector } from '@/components/MapSelector';
import { Team, GameMap, TournamentState } from '@/lib/types';
import { DEFAULT_MAPS } from '@/data/default-maps';
import {
  saveTournamentState,
  saveMyTeam,
  saveOpponentTeam,
  loadMyTeam,
  loadOpponentTeam,
} from '@/lib/storage';

export default function SetupPage() {
  const router = useRouter();
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [opponentTeam, setOpponentTeam] = useState<Team | null>(null);
  const [availableMaps, setAvailableMaps] = useState<GameMap[]>(DEFAULT_MAPS);
  const [selectedMaps, setSelectedMaps] = useState<GameMap[]>([]);

  // Load saved teams on mount
  useEffect(() => {
    const savedMyTeam = loadMyTeam();
    const savedOpponentTeam = loadOpponentTeam();
    if (savedMyTeam) setMyTeam(savedMyTeam);
    if (savedOpponentTeam) setOpponentTeam(savedOpponentTeam);
  }, []);

  const handleMyTeamLoaded = (team: Team) => {
    setMyTeam(team);
    saveMyTeam(team);
  };

  const handleOpponentTeamLoaded = (team: Team) => {
    setOpponentTeam(team);
    saveOpponentTeam(team);
  };

  const canStartTournament =
    myTeam !== null &&
    opponentTeam !== null &&
    selectedMaps.length === 4;

  const startTournament = () => {
    if (!myTeam || !opponentTeam || selectedMaps.length !== 4) return;

    const initialState: TournamentState = {
      myTeam,
      opponentTeam,
      allMaps: availableMaps,
      selectedMaps,
      currentRound: 1,
      phase: 'select-my-defender',
      myDefender: null,
      opponentDefender: null,
      myAttackers: null,
      opponentAttackers: null,
      myAvailablePlayers: [...myTeam.players],
      opponentAvailablePlayers: [...opponentTeam.players],
      pairings: [],
      status: 'in-progress',
    };

    saveTournamentState(initialState);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Tournament Setup</h1>
          <button
            onClick={() => router.push('/roster-editor')}
            className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Roster Editor
          </button>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Load your team rosters and select the 4 battleplans in order
        </p>

        <div className="space-y-6">
          {/* Team uploads */}
          <div className="grid md:grid-cols-2 gap-4">
            <FileUpload
              label="My Team"
              team={myTeam}
              onTeamLoaded={handleMyTeamLoaded}
            />
            <FileUpload
              label="Opponent Team"
              team={opponentTeam}
              onTeamLoaded={handleOpponentTeamLoaded}
            />
          </div>

          {/* Map selection */}
          <MapSelector
            availableMaps={availableMaps}
            selectedMaps={selectedMaps}
            onSelectionChange={setSelectedMaps}
            maxSelection={4}
          />

          {/* Start button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={startTournament}
              disabled={!canStartTournament}
              className={`
                px-6 py-3 rounded-lg font-semibold text-lg transition-all
                ${canStartTournament
                  ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                  : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed'
                }
              `}
            >
              Start Tournament
            </button>
          </div>

          {/* Requirements checklist */}
          {!canStartTournament && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4">
              <p className="font-medium mb-2">To start the tournament:</p>
              <ul className="space-y-1">
                <li className={myTeam ? 'text-green-600' : ''}>
                  {myTeam ? '✓' : '○'} Upload your team roster (8 players)
                </li>
                <li className={opponentTeam ? 'text-green-600' : ''}>
                  {opponentTeam ? '✓' : '○'} Upload opponent team roster (8 players)
                </li>
                <li className={selectedMaps.length === 4 ? 'text-green-600' : ''}>
                  {selectedMaps.length === 4 ? '✓' : '○'} Select 4 battleplans in order
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
