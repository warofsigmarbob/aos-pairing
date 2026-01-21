'use client';

import { Player, TournamentState } from '@/lib/types';
import {
  setMyDefender,
  setOpponentDefender,
  setMyAttackers,
  setOpponentAttackers,
  opponentChoosesAttacker,
  iChooseAttacker,
  advanceToNextRound,
  getPhaseDescription,
} from '@/lib/pairing-logic';

interface PairingActionsProps {
  state: TournamentState;
  selectedPlayers: Player[];
  onStateChange: (state: TournamentState) => void;
  onClearSelection: () => void;
}

export function PairingActions({
  state,
  selectedPlayers,
  onStateChange,
  onClearSelection,
}: PairingActionsProps) {
  const { phase, currentRound, selectedMaps } = state;
  const currentMap = selectedMaps[currentRound - 1];

  const handleConfirm = () => {
    let newState: TournamentState;

    switch (phase) {
      case 'select-my-defender':
        if (selectedPlayers.length !== 1) return;
        newState = setMyDefender(state, selectedPlayers[0]);
        break;

      case 'select-opponent-defender':
        if (selectedPlayers.length !== 1) return;
        newState = setOpponentDefender(state, selectedPlayers[0]);
        break;

      case 'offer-my-attackers':
        if (selectedPlayers.length !== 2) return;
        newState = setMyAttackers(state, selectedPlayers as [Player, Player]);
        break;

      case 'offer-opponent-attackers':
        if (selectedPlayers.length !== 2) return;
        newState = setOpponentAttackers(state, selectedPlayers as [Player, Player]);
        break;

      case 'opponent-chooses':
        if (selectedPlayers.length !== 1) return;
        newState = opponentChoosesAttacker(state, selectedPlayers[0]);
        break;

      case 'i-choose':
        if (selectedPlayers.length !== 1) return;
        newState = iChooseAttacker(state, selectedPlayers[0]);
        break;

      case 'round-complete':
        newState = advanceToNextRound(state);
        break;

      case 'tournament-complete':
        newState = { ...state, status: 'completed' };
        break;

      default:
        return;
    }

    onClearSelection();
    onStateChange(newState);
  };

  const getRequiredCount = (): number => {
    switch (phase) {
      case 'offer-my-attackers':
      case 'offer-opponent-attackers':
        return 2;
      case 'select-my-defender':
      case 'select-opponent-defender':
      case 'opponent-chooses':
      case 'i-choose':
        return 1;
      default:
        return 0;
    }
  };

  const getSelectionLabel = (): string => {
    switch (phase) {
      case 'select-my-defender':
        return 'Select your defender from your roster';
      case 'select-opponent-defender':
        return "Select opponent's defender from their roster";
      case 'offer-my-attackers':
        return 'Select 2 attackers from your roster to offer';
      case 'offer-opponent-attackers':
        return "Select opponent's 2 attackers from their roster";
      case 'opponent-chooses':
        return 'Which of your attackers did opponent pick?';
      case 'i-choose':
        return "Choose one of opponent's attackers";
      default:
        return '';
    }
  };

  const getConfirmButtonText = (): string => {
    switch (phase) {
      case 'select-my-defender':
      case 'select-opponent-defender':
        return 'Confirm Defender';
      case 'offer-my-attackers':
      case 'offer-opponent-attackers':
        return 'Confirm Attackers';
      case 'opponent-chooses':
        return "Confirm Opponent's Choice";
      case 'i-choose':
        return 'Confirm My Choice';
      case 'round-complete':
        return `Start Round ${currentRound + 1} (${selectedMaps[currentRound]?.name || 'Next'})`;
      case 'tournament-complete':
        return 'View Results';
      default:
        return 'Confirm';
    }
  };

  const canConfirm = (): boolean => {
    const required = getRequiredCount();
    if (required === 0) return true; // round-complete or tournament-complete
    return selectedPlayers.length === required;
  };

  const requiredCount = getRequiredCount();
  const isSelectionPhase = requiredCount > 0;

  // Get pairings for current round
  const currentRoundPairings = state.pairings.filter((p) => p.round === currentRound);

  return (
    <div className="space-y-4">
      {/* Round and Map indicator */}
      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-center">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Round {currentRound} of 4
        </span>
        <p className="font-bold text-lg">{currentMap.name}</p>
      </div>

      {/* Phase description */}
      <div className="text-center">
        <h3 className="font-bold text-lg">{getPhaseDescription(phase)}</h3>
        {isSelectionPhase && (
          <p className="text-sm text-zinc-500 mt-1">{getSelectionLabel()}</p>
        )}
      </div>

      {/* Selection counter */}
      {isSelectionPhase && (
        <div className="flex items-center justify-center gap-2">
          <div className={`text-2xl font-bold ${
            selectedPlayers.length === requiredCount ? 'text-green-600' : 'text-zinc-400'
          }`}>
            {selectedPlayers.length} / {requiredCount}
          </div>
          {selectedPlayers.length > 0 && (
            <button
              onClick={onClearSelection}
              className="text-xs text-red-500 hover:text-red-600 underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Selected players display */}
      {selectedPlayers.length > 0 && (
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
          <p className="text-xs text-zinc-500 mb-2">Selected:</p>
          <div className="space-y-1">
            {selectedPlayers.map((player) => (
              <div key={player.id} className="text-sm font-medium">
                {player.name} <span className="text-zinc-400">({player.army})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Round complete message */}
      {phase === 'round-complete' && (
        <div className="text-center py-4">
          <p className="text-green-600 dark:text-green-400 font-medium">
            Round {currentRound} complete!
          </p>
          <p className="text-sm text-zinc-500 mt-1">
            {currentRoundPairings.length} pairings for {currentMap.name}
          </p>
        </div>
      )}

      {/* Tournament complete message */}
      {phase === 'tournament-complete' && (
        <div className="text-center py-4">
          <p className="text-green-600 dark:text-green-400 font-bold text-xl">
            Tournament Complete!
          </p>
          <p className="text-sm text-zinc-500 mt-1">
            All {state.pairings.length} pairings done
          </p>
        </div>
      )}

      {/* Current round pairings */}
      {currentRoundPairings.length > 0 && phase !== 'tournament-complete' && (
        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
          <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-2">
            Pairings for {currentMap.name}:
          </p>
          <div className="space-y-1">
            {currentRoundPairings.map((pairing) => (
              <div key={pairing.id} className="text-sm flex justify-between">
                <span className="text-blue-600 font-medium">{pairing.myPlayer.name}</span>
                <span className="text-zinc-400">vs</span>
                <span className="text-red-600 font-medium">{pairing.opponentPlayer.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={!canConfirm()}
        className={`
          w-full py-3 rounded-lg font-semibold transition-all text-lg
          ${canConfirm()
            ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
            : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed'
          }
        `}
      >
        {getConfirmButtonText()}
      </button>
    </div>
  );
}
