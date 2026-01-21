import {
  Player,
  Pairing,
  TournamentState,
  PairingPhase,
  generateId,
} from './types';

// Create a new pairing
function createPairing(
  mapId: string,
  mapName: string,
  round: number,
  myPlayer: Player,
  opponentPlayer: Player,
  isAutoPaired: boolean = false
): Pairing {
  return {
    id: generateId(),
    mapId,
    mapName,
    round,
    myPlayer,
    opponentPlayer,
    isAutoPaired,
  };
}

// Remove a player from available list
function removePlayer(players: Player[], playerId: string): Player[] {
  return players.filter((p) => p.id !== playerId);
}

// Set my defender
export function setMyDefender(
  state: TournamentState,
  player: Player
): TournamentState {
  return {
    ...state,
    myDefender: player,
    phase: state.opponentDefender ? 'offer-my-attackers' : 'select-opponent-defender',
  };
}

// Set opponent defender
export function setOpponentDefender(
  state: TournamentState,
  player: Player
): TournamentState {
  return {
    ...state,
    opponentDefender: player,
    phase: state.myDefender ? 'offer-my-attackers' : 'select-my-defender',
  };
}

// Set my attackers (2 players offered to opponent's defender)
export function setMyAttackers(
  state: TournamentState,
  attackers: [Player, Player]
): TournamentState {
  return {
    ...state,
    myAttackers: attackers,
    phase: 'offer-opponent-attackers',
  };
}

// Set opponent attackers (2 players offered to my defender)
export function setOpponentAttackers(
  state: TournamentState,
  attackers: [Player, Player]
): TournamentState {
  return {
    ...state,
    opponentAttackers: attackers,
    phase: 'i-choose', // I choose first, then opponent chooses
  };
}

// I choose one of opponent's attackers (NOW FIRST - step 5)
export function iChooseAttacker(
  state: TournamentState,
  chosenAttacker: Player
): TournamentState {
  const { opponentAttackers, myDefender, currentRound, selectedMaps } = state;

  if (!opponentAttackers || !myDefender) return state;

  const currentMap = selectedMaps[currentRound - 1];

  // Create pairing: my defender vs opponent chosen attacker
  const pairing = createPairing(
    currentMap.id,
    currentMap.name,
    currentRound,
    myDefender,
    chosenAttacker,
    false
  );

  // Remove chosen attacker and my defender from available pools
  const newMyAvailable = removePlayer(state.myAvailablePlayers, myDefender.id);
  const newOpponentAvailable = removePlayer(state.opponentAvailablePlayers, chosenAttacker.id);

  return {
    ...state,
    pairings: [...state.pairings, pairing],
    myAvailablePlayers: newMyAvailable,
    opponentAvailablePlayers: newOpponentAvailable,
    opponentAttackers: null,
    myDefender: null,
    phase: 'opponent-chooses', // Now go to opponent choosing
  };
}

// Opponent's defender chooses one of my attackers (NOW SECOND - step 6)
export function opponentChoosesAttacker(
  state: TournamentState,
  chosenAttacker: Player
): TournamentState {
  const { myAttackers, opponentDefender, currentRound, selectedMaps } = state;

  if (!myAttackers || !opponentDefender) return state;

  const currentMap = selectedMaps[currentRound - 1];

  // Create pairing: my chosen attacker vs opponent defender
  const pairing = createPairing(
    currentMap.id,
    currentMap.name,
    currentRound,
    chosenAttacker,
    opponentDefender,
    false
  );

  // Remove chosen attacker and opponent defender from available pools
  let newMyAvailable = removePlayer(state.myAvailablePlayers, chosenAttacker.id);
  let newOpponentAvailable = removePlayer(state.opponentAvailablePlayers, opponentDefender.id);

  let newPairings = [...state.pairings, pairing];
  let nextPhase: PairingPhase = 'round-complete';

  // Check if this is round 3 - auto-pair remaining players for round 4
  if (currentRound === 3 && newMyAvailable.length === 2 && newOpponentAvailable.length === 2) {
    const map4 = selectedMaps[3];

    // Auto-pair the remaining 2 players on each side
    const autoPairing1 = createPairing(
      map4.id,
      map4.name,
      4,
      newMyAvailable[0],
      newOpponentAvailable[0],
      true
    );
    const autoPairing2 = createPairing(
      map4.id,
      map4.name,
      4,
      newMyAvailable[1],
      newOpponentAvailable[1],
      true
    );

    newPairings.push(autoPairing1, autoPairing2);
    newMyAvailable = [];
    newOpponentAvailable = [];
    nextPhase = 'tournament-complete';
  }

  return {
    ...state,
    pairings: newPairings,
    myAvailablePlayers: newMyAvailable,
    opponentAvailablePlayers: newOpponentAvailable,
    myAttackers: null,
    opponentDefender: null,
    phase: nextPhase,
  };
}

// Advance to next round
export function advanceToNextRound(state: TournamentState): TournamentState {
  const nextRound = state.currentRound + 1;

  if (nextRound > 4 || state.myAvailablePlayers.length === 0) {
    return {
      ...state,
      status: 'completed',
      phase: 'tournament-complete',
    };
  }

  return {
    ...state,
    currentRound: nextRound,
    phase: 'select-my-defender',
    myDefender: null,
    myAttackers: null,
    opponentDefender: null,
    opponentAttackers: null,
  };
}

// Get phase description for UI
export function getPhaseDescription(phase: PairingPhase): string {
  switch (phase) {
    case 'select-my-defender':
      return 'Select your defender';
    case 'select-opponent-defender':
      return "Select opponent's defender";
    case 'offer-my-attackers':
      return 'Select 2 attackers to offer';
    case 'offer-opponent-attackers':
      return "Select opponent's 2 attackers";
    case 'opponent-chooses':
      return 'Opponent chooses from your attackers';
    case 'i-choose':
      return "Choose from opponent's attackers";
    case 'round-complete':
      return 'Round complete';
    case 'tournament-complete':
      return 'Tournament complete!';
    default:
      return phase;
  }
}
