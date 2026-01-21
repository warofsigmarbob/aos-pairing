'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TournamentState, Player } from '@/lib/types';
import { loadTournamentState, clearTournamentState, saveTournamentState, popFromHistory, loadHistory } from '@/lib/storage';
import { PairingActions } from '@/components/PairingActions';
import { TeamPanel } from '@/components/TeamPanel';
import { Round3Preview } from '@/components/Round3Preview';
import { BattleplanDetails } from '@/components/BattleplanDetails';

export default function Home() {
  const router = useRouter();
  const [tournamentState, setTournamentState] = useState<TournamentState | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  // Track which friendly player's matchups are being shown (by listName)
  const [showMatchupsFor, setShowMatchupsFor] = useState<string | null>(null);
  // Track which battleplan details to show (by round number, null = show pairing actions)
  const [showBattleplanDetails, setShowBattleplanDetails] = useState<number | null>(null);

  useEffect(() => {
    const state = loadTournamentState();
    if (state && state.status === 'in-progress') {
      setTournamentState(state);
    }
    setHistoryCount(loadHistory().length);
    setLoading(false);
  }, []);

  const handleStateChange = (newState: TournamentState) => {
    setTournamentState(newState);
    saveTournamentState(newState, true); // Add current state to history before saving new
    setHistoryCount(loadHistory().length);
  };

  const handleUndo = () => {
    const previousState = popFromHistory();
    if (previousState) {
      setTournamentState(previousState);
      saveTournamentState(previousState, false); // Save without adding to history
      setHistoryCount(loadHistory().length);
      setSelectedPlayers([]);
    }
  };

  const handlePlayerClick = (player: Player) => {
    const isAlreadySelected = selectedPlayers.some((p) => p.id === player.id);
    if (isAlreadySelected) {
      setSelectedPlayers(selectedPlayers.filter((p) => p.id !== player.id));
    } else {
      // Check max selection based on phase
      const phase = tournamentState?.phase;
      const maxSelection =
        phase === 'offer-my-attackers' || phase === 'offer-opponent-attackers' ? 2 : 1;

      if (selectedPlayers.length < maxSelection) {
        setSelectedPlayers([...selectedPlayers, player]);
      } else if (maxSelection === 1) {
        // Replace selection for single-select phases
        setSelectedPlayers([player]);
      }
    }
  };

  const clearSelection = () => {
    setSelectedPlayers([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  // No tournament in progress - show options
  if (!tournamentState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold">AOS Team Pairing</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Warhammer Age of Sigmar Team Tournament Pairing Tool
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/setup')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start New Tournament
            </button>
            <button
              onClick={() => router.push('/roster-editor')}
              className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Roster Editor
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tournament completed
  if (tournamentState.status === 'completed') {
    // Group pairings by round/map
    const pairingsByRound = tournamentState.selectedMaps.map((map, idx) => ({
      map,
      round: idx + 1,
      pairings: tournamentState.pairings.filter((p) => p.round === idx + 1),
    }));

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Tournament Complete!</h1>

          {pairingsByRound.map(({ map, round, pairings }) => (
            <div key={map.id} className="mb-6 bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
              <h2 className="font-semibold text-lg mb-3">
                Round {round}: {map.name}
              </h2>
              <div className="space-y-2">
                {pairings.map((pairing) => (
                  <div key={pairing.id} className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                    <span className="text-blue-600 font-medium">{pairing.myPlayer.army}</span>
                    <span className="text-zinc-400">vs</span>
                    <span className="text-red-600 font-medium">{pairing.opponentPlayer.army}</span>
                    {pairing.isAutoPaired && <span className="text-xs text-zinc-400 ml-2">(auto)</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              clearTournamentState();
              setTournamentState(null);
            }}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Start New Tournament
          </button>
        </div>
      </div>
    );
  }

  // Tournament in progress - show pairing interface
  const { myTeam, opponentTeam, selectedMaps, currentRound } = tournamentState;
  const currentMap = selectedMaps[currentRound - 1];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Back button */}
            <button
              onClick={handleUndo}
              disabled={historyCount === 0}
              className={`
                p-2 rounded-lg border transition-all
                ${historyCount > 0
                  ? 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 cursor-pointer'
                  : 'border-zinc-200 dark:border-zinc-800 opacity-40 cursor-not-allowed'
                }
              `}
              title={historyCount > 0 ? `Undo (${historyCount} steps available)` : 'No history'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 14L4 9l5-5"/>
                <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/>
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">
                Round {currentRound}: {currentMap.name}
              </h1>
              {historyCount > 0 && (
                <p className="text-xs text-zinc-500">{historyCount} undo step{historyCount !== 1 ? 's' : ''} available</p>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset the tournament?')) {
                clearTournamentState();
                setTournamentState(null);
                setSelectedPlayers([]);
                setHistoryCount(0);
              }
            }}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded"
          >
            Reset
          </button>
        </div>

        {/* Round/Map progress - clickable to show battleplan details */}
        <div className="flex justify-center gap-2 mb-6">
          {selectedMaps.map((map, idx) => {
            const roundNum = idx + 1;
            const roundPairings = tournamentState.pairings.filter((p) => p.round === roundNum);
            const isComplete = roundPairings.length === 2;
            const isCurrent = roundNum === currentRound;
            const isShowingDetails = showBattleplanDetails === roundNum;

            return (
              <button
                key={map.id}
                onClick={() => setShowBattleplanDetails(isShowingDetails ? null : roundNum)}
                className={`px-4 py-2 rounded text-sm transition-all cursor-pointer ${
                  isShowingDetails
                    ? 'ring-2 ring-purple-500 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                    : isCurrent
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : isComplete
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                }`}
                title={`Click to ${isShowingDetails ? 'hide' : 'view'} ${map.name} details`}
              >
                <div className="font-medium">R{roundNum}</div>
                <div className="text-xs opacity-75">{map.name}</div>
              </button>
            );
          })}
        </div>

        {/* Round 3 Preview */}
        {currentRound === 3 && (
          <Round3Preview state={tournamentState} />
        )}

        {/* Main pairing area */}
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {/* My Team Panel */}
          <TeamPanel
            teamName={myTeam.name}
            players={myTeam.players}
            state={tournamentState}
            isMyTeam={true}
            selectedIds={selectedPlayers.map((p) => p.id)}
            onPlayerClick={handlePlayerClick}
            showMatchupsFor={showMatchupsFor}
            onToggleMatchups={setShowMatchupsFor}
          />

          {/* Center - Actions/Status or Battleplan Details */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            {showBattleplanDetails !== null ? (
              <BattleplanDetails
                battleplan={selectedMaps[showBattleplanDetails - 1]}
                onClose={() => setShowBattleplanDetails(null)}
              />
            ) : (
              <PairingActions
                state={tournamentState}
                selectedPlayers={selectedPlayers}
                onStateChange={handleStateChange}
                onClearSelection={clearSelection}
              />
            )}
          </div>

          {/* Opponent Team Panel */}
          <TeamPanel
            teamName={opponentTeam.name}
            players={opponentTeam.players}
            state={tournamentState}
            isMyTeam={false}
            selectedIds={selectedPlayers.map((p) => p.id)}
            onPlayerClick={handlePlayerClick}
            showMatchupsFor={showMatchupsFor}
            onToggleMatchups={setShowMatchupsFor}
          />
        </div>

        {/* All pairings summary */}
        {tournamentState.pairings.length > 0 && (
          <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold mb-3">All Pairings</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedMaps.map((map, idx) => {
                const roundNum = idx + 1;
                const roundPairings = tournamentState.pairings.filter((p) => p.round === roundNum);

                return (
                  <div key={map.id} className="bg-zinc-50 dark:bg-zinc-800 rounded p-3">
                    <p className="text-xs font-medium text-zinc-500 mb-2">R{roundNum}: {map.name}</p>
                    {roundPairings.length === 0 ? (
                      <p className="text-xs text-zinc-400">No pairings yet</p>
                    ) : (
                      <div className="space-y-1">
                        {roundPairings.map((pairing) => (
                          <div key={pairing.id} className="text-xs">
                            <span className="text-blue-600">{pairing.myPlayer.army}</span>
                            {' vs '}
                            <span className="text-red-600">{pairing.opponentPlayer.army}</span>
                            {pairing.isAutoPaired && <span className="text-zinc-400"> (auto)</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
