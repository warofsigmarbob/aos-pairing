'use client';

import { useState } from 'react';
import {
  Player,
  TournamentState,
  getPlayerBattleplanScore,
  getScoreColor,
  getScoreBgColor,
  getMatchupScore,
  isBestBattleplanForPlayer,
  getLastChanceThreshold,
  getMedalRank,
} from '@/lib/types';

interface TeamPanelProps {
  teamName: string;
  players: Player[];
  state: TournamentState;
  isMyTeam: boolean;
  selectedIds: string[];
  onPlayerClick: (player: Player) => void;
  showMatchupsFor: string | null; // listName of friendly player whose matchups are shown
  onToggleMatchups: (listName: string | null) => void;
}

export function TeamPanel({
  teamName,
  players,
  state,
  isMyTeam,
  selectedIds,
  onPlayerClick,
  showMatchupsFor,
  onToggleMatchups,
}: TeamPanelProps) {
  const color = isMyTeam ? 'blue' : 'red';
  const { phase, myAvailablePlayers, opponentAvailablePlayers, myDefender, opponentDefender, myAttackers, opponentAttackers, pairings } = state;

  // Determine if this panel is active for selection based on phase
  const isActiveForSelection = () => {
    if (isMyTeam) {
      return (
        phase === 'select-my-defender' ||
        phase === 'offer-my-attackers' ||
        phase === 'opponent-chooses' // Select which of MY attackers opponent chose (step 6)
      );
    } else {
      return (
        phase === 'select-opponent-defender' ||
        phase === 'offer-opponent-attackers' ||
        phase === 'i-choose' // I choose from opponent's attackers (step 5)
      );
    }
  };

  // Get player status
  const getPlayerStatus = (player: Player): { status: string; color: string } | null => {
    if (isMyTeam) {
      if (myDefender?.id === player.id) return { status: 'Defender', color: 'blue' };
      if (myAttackers?.some((a) => a.id === player.id)) return { status: 'Attacker', color: 'blue' };
    } else {
      if (opponentDefender?.id === player.id) return { status: 'Defender', color: 'red' };
      if (opponentAttackers?.some((a) => a.id === player.id)) return { status: 'Attacker', color: 'red' };
    }
    return null;
  };

  // Check if player is paired (in any round)
  const isPlayerPaired = (playerId: string): boolean => {
    return pairings.some((p) =>
      isMyTeam ? p.myPlayer.id === playerId : p.opponentPlayer.id === playerId
    );
  };

  // Check if player is available
  const isPlayerAvailable = (playerId: string): boolean => {
    const availableList = isMyTeam ? myAvailablePlayers : opponentAvailablePlayers;
    return availableList.some((p) => p.id === playerId);
  };

  // Check if player can be selected in current phase
  const canSelectPlayer = (player: Player): boolean => {
    if (!isActiveForSelection()) return false;

    const paired = isPlayerPaired(player.id);
    if (paired) return false;

    const available = isPlayerAvailable(player.id);

    // For "i-choose" phase, can only select from opponent's offered attackers
    if (phase === 'i-choose' && !isMyTeam) {
      return opponentAttackers?.some((a) => a.id === player.id) ?? false;
    }

    // For "opponent-chooses" phase, can only select from my offered attackers
    if (phase === 'opponent-chooses' && isMyTeam) {
      return myAttackers?.some((a) => a.id === player.id) ?? false;
    }

    // For defender selection
    if (
      (phase === 'select-my-defender' && isMyTeam) ||
      (phase === 'select-opponent-defender' && !isMyTeam)
    ) {
      return available;
    }

    // For attacker offering - exclude the defender
    if (phase === 'offer-my-attackers' && isMyTeam) {
      return available && myDefender?.id !== player.id;
    }
    if (phase === 'offer-opponent-attackers' && !isMyTeam) {
      return available && opponentDefender?.id !== player.id;
    }

    return false;
  };

  const isSelected = (playerId: string) => selectedIds.includes(playerId);
  const active = isActiveForSelection();

  // Get current and remaining battleplan names for score display
  const currentBattleplanName = state.selectedMaps[state.currentRound - 1]?.name ?? '';
  const remainingBattleplanNames = state.selectedMaps
    .slice(state.currentRound - 1)
    .map((m) => m.name);

  // State for showing future scores popup - Set allows multiple open at once
  const [expandedScores, setExpandedScores] = useState<Set<string>>(new Set());

  // Get player's score for current battleplan
  const getPlayerScore = (player: Player) => {
    return getPlayerBattleplanScore(player, currentBattleplanName);
  };

  // Get all selected battleplan names for star indicator
  const selectedBattleplanNames = state.selectedMaps.map((m) => m.name);

  // Check if we're in defender selection phase (for star indicator)
  const isDefenderPhase = phase === 'select-my-defender' || phase === 'select-opponent-defender';

  // Check if we're in attacker selection phase (for medal indicator)
  const isAttackerPhase =
    phase === 'offer-my-attackers' ||
    phase === 'offer-opponent-attackers' ||
    phase === 'i-choose' ||
    phase === 'opponent-chooses';

  // Matchup matrix is stored on opponent team
  const matchupMatrix = state.opponentTeam.matchupMatrix;
  const hasMatchupMatrix = !!matchupMatrix && Object.keys(matchupMatrix).length > 0;

  // Get the defender for medal calculations
  const currentDefender = isMyTeam ? opponentDefender : myDefender;
  const defenderListName = currentDefender?.listName || currentDefender?.name || '';

  // Calculate all matchup scores for medal ranking
  const getAllMatchupScoresVsDefender = (): (number | null)[] => {
    if (!hasMatchupMatrix || !defenderListName) return [];
    const availablePlayers = isMyTeam ? myAvailablePlayers : opponentAvailablePlayers;
    return availablePlayers.map((p) => {
      const listName = p.listName || p.name;
      return isMyTeam
        ? getMatchupScore(matchupMatrix, listName, defenderListName)
        : getMatchupScore(matchupMatrix, defenderListName, listName);
    });
  };

  const allMatchupScores = isAttackerPhase ? getAllMatchupScoresVsDefender() : [];

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-lg p-4 border-2 transition-colors ${
      active ? (isMyTeam ? 'border-blue-400' : 'border-red-400') : 'border-zinc-200 dark:border-zinc-800'
    }`}>
      <h2 className={`font-semibold text-lg mb-3 ${isMyTeam ? 'text-blue-600' : 'text-red-600'}`}>
        {teamName}
      </h2>

      {active && (
        <p className={`text-xs mb-2 font-medium ${isMyTeam ? 'text-blue-500' : 'text-red-500'}`}>
          Click to select
        </p>
      )}

      <div className="space-y-2">
        {players.map((player) => {
          const playerStatus = getPlayerStatus(player);
          const paired = isPlayerPaired(player.id);
          const available = isPlayerAvailable(player.id);
          const canSelect = canSelectPlayer(player);
          const selected = isSelected(player.id);
          const score = getPlayerScore(player);
          const hasScores = !!player.battleplanScores && Object.keys(player.battleplanScores).length > 0;
          const playerListName = player.listName || player.name;

          // Star indicator: show if this is the best battleplan for this player (defender AND attacker phases)
          const isBestBattleplan = (isDefenderPhase || isAttackerPhase) && !paired && hasScores
            ? isBestBattleplanForPlayer(player, currentBattleplanName, selectedBattleplanNames)
            : false;

          // Last chance threshold (6, 5, or 4)
          const lastChanceThreshold = !paired
            ? getLastChanceThreshold(player, currentBattleplanName, remainingBattleplanNames)
            : null;

          // Medal for attacker matchup (only during attacker phases, only for available players)
          const matchupScoreVsDefender = isAttackerPhase && !paired && hasMatchupMatrix && defenderListName
            ? (isMyTeam
                ? getMatchupScore(matchupMatrix, playerListName, defenderListName)
                : getMatchupScore(matchupMatrix, defenderListName, playerListName))
            : null;
          const medalRank = isAttackerPhase && !paired
            ? getMedalRank(matchupScoreVsDefender, allMatchupScores)
            : null;

          // Matchup score: for opponent players, show score vs selected friendly list (manual toggle)
          const matchupScore = !isMyTeam && showMatchupsFor
            ? getMatchupScore(matchupMatrix, showMatchupsFor, playerListName)
            : null;
          // Is this friendly player's matchups being shown?
          const isShowingMatchups = isMyTeam && showMatchupsFor === playerListName;

          // Determine if this is a choosable attacker (highlight differently)
          const isChoosableAttacker =
            (phase === 'i-choose' && !isMyTeam && opponentAttackers?.some((a) => a.id === player.id)) ||
            (phase === 'opponent-chooses' && isMyTeam && myAttackers?.some((a) => a.id === player.id));

          return (
            <div
              key={player.id}
              onClick={() => canSelect && onPlayerClick(player)}
              role={canSelect ? 'button' : undefined}
              tabIndex={canSelect ? 0 : undefined}
              onKeyDown={(e) => {
                if (canSelect && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onPlayerClick(player);
                }
              }}
              className={`
                w-full p-3 rounded-lg text-left transition-all
                ${paired
                  ? 'bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-800'
                  : selected
                    ? `${isMyTeam ? 'bg-blue-100 dark:bg-blue-950 border-2 border-blue-500 ring-2 ring-blue-300' : 'bg-red-100 dark:bg-red-950 border-2 border-red-500 ring-2 ring-red-300'}`
                    : isChoosableAttacker
                      ? 'bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-400 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900'
                      : playerStatus
                        ? `${playerStatus.color === 'blue' ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800' : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'}`
                        : canSelect
                          ? `bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer ${isMyTeam ? 'hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950' : 'hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950'}`
                          : available
                            ? 'bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
                            : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 opacity-40'
                }
              `}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{player.army}</span>
                    {/* Star for best battleplan (defender selection) */}
                    {isBestBattleplan && (
                      <span
                        className="text-yellow-500"
                        title="Best battleplan for this list among the 4 rounds"
                      >
                        ★
                      </span>
                    )}
                    {/* Medal for attacker matchup ranking */}
                    {medalRank !== null && (
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                          medalRank === 1
                            ? 'bg-yellow-300 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100'
                            : medalRank === 2
                              ? 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100'
                              : 'bg-orange-300 dark:bg-orange-700 text-orange-900 dark:text-orange-100'
                        }`}
                        title={`#${medalRank} best matchup vs ${defenderListName} (score: ${matchupScoreVsDefender})`}
                      >
                        {medalRank === 1 ? '🥇' : medalRank === 2 ? '🥈' : '🥉'}
                      </span>
                    )}
                    {/* Score badge for current battleplan */}
                    {score !== null && (
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded ${getScoreColor(score)} ${getScoreBgColor(score)}`}
                        title={`Score for ${currentBattleplanName}: ${score}`}
                      >
                        {score}
                      </span>
                    )}
                    {/* Last chance warning with threshold */}
                    {lastChanceThreshold !== null && (
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                          lastChanceThreshold === 6
                            ? 'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300'
                            : lastChanceThreshold === 5
                              ? 'bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300'
                              : 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300'
                        }`}
                        title={`Last chance for a ${lastChanceThreshold}${lastChanceThreshold < 6 ? '+' : ''} score!`}
                      >
                        ⚠ Last {lastChanceThreshold}{lastChanceThreshold < 6 ? '+' : ''}
                      </span>
                    )}
                    {/* Matchup score for opponent players (manual toggle) */}
                    {!isMyTeam && matchupScore !== null && (
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded ${getScoreColor(matchupScore)} ${getScoreBgColor(matchupScore)} ring-2 ring-purple-400`}
                        title={`Matchup vs ${showMatchupsFor}: ${matchupScore}`}
                      >
                        M:{matchupScore}
                      </span>
                    )}
                  </div>
                  <div className="text-zinc-500 text-xs">
                    <span>{player.name}</span>
                    {player.listName && <span className="text-zinc-400"> · {player.listName}</span>}
                  </div>
                  {/* Action buttons row */}
                  <div className="flex gap-3 mt-1">
                    {/* Future scores button */}
                    {hasScores && remainingBattleplanNames.length > 1 && !paired && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedScores((prev) => {
                            const next = new Set(prev);
                            if (next.has(player.id)) {
                              next.delete(player.id);
                            } else {
                              next.add(player.id);
                            }
                            return next;
                          });
                        }}
                        className="text-xs text-blue-500 hover:text-blue-700 underline"
                      >
                        {expandedScores.has(player.id) ? 'Hide rounds' : 'Rounds'}
                      </button>
                    )}
                    {/* Matchup toggle button - only for my team */}
                    {isMyTeam && hasMatchupMatrix && !paired && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMatchups(isShowingMatchups ? null : playerListName);
                        }}
                        className={`text-xs underline ${isShowingMatchups ? 'text-purple-600 font-bold' : 'text-purple-500 hover:text-purple-700'}`}
                      >
                        {isShowingMatchups ? 'Hide matchups' : 'Matchups'}
                      </button>
                    )}
                  </div>
                  {/* Future scores popup - shows all 4 rounds in order */}
                  {expandedScores.has(player.id) && hasScores && (
                    <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">
                      <p className="font-medium mb-1">Scores by round:</p>
                      <div className="flex gap-1">
                        {state.selectedMaps.map((map, idx) => {
                          const roundNum = idx + 1;
                          const bpScore = getPlayerBattleplanScore(player, map.name);
                          const isCurrent = roundNum === state.currentRound;
                          const isPast = roundNum < state.currentRound;
                          return (
                            <span
                              key={map.id}
                              className={`px-1.5 py-0.5 rounded ${getScoreColor(bpScore)} ${getScoreBgColor(bpScore)} ${isCurrent ? 'ring-2 ring-blue-500' : ''} ${isPast ? 'opacity-50' : ''}`}
                              title={`R${roundNum}: ${map.name}`}
                            >
                              R{roundNum}: {bpScore ?? '-'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  {selected && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${isMyTeam ? 'text-blue-600 bg-blue-200 dark:bg-blue-800' : 'text-red-600 bg-red-200 dark:bg-red-800'}`}>
                      Selected
                    </span>
                  )}
                  {playerStatus && !selected && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${playerStatus.color === 'blue' ? 'text-blue-600 bg-blue-100 dark:bg-blue-900' : 'text-red-600 bg-red-100 dark:bg-red-900'}`}>
                      {playerStatus.status}
                    </span>
                  )}
                  {paired && (
                    <span className="text-xs font-medium text-green-600">Paired</span>
                  )}
                  {isChoosableAttacker && !selected && (
                    <span className="text-xs font-bold text-yellow-600 bg-yellow-200 dark:bg-yellow-800 px-2 py-0.5 rounded">
                      Choose?
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
