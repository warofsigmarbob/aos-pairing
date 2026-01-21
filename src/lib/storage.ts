import { TournamentState, Team, GameMap } from './types';

const STORAGE_KEYS = {
  TOURNAMENT_STATE: 'aos-pairing-tournament',
  TOURNAMENT_HISTORY: 'aos-pairing-history',
  MY_TEAM: 'aos-pairing-my-team',
  OPPONENT_TEAM: 'aos-pairing-opponent-team',
  CUSTOM_MAPS: 'aos-pairing-custom-maps',
} as const;

// Tournament state persistence
export function saveTournamentState(state: TournamentState, addToHistory: boolean = false): void {
  if (typeof window === 'undefined') return;

  if (addToHistory) {
    // Save current state to history before updating
    const currentState = loadTournamentState();
    if (currentState) {
      pushToHistory(currentState);
    }
  }

  localStorage.setItem(STORAGE_KEYS.TOURNAMENT_STATE, JSON.stringify(state));
}

export function loadTournamentState(): TournamentState | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.TOURNAMENT_STATE);
  if (!data) return null;
  try {
    return JSON.parse(data) as TournamentState;
  } catch {
    return null;
  }
}

export function clearTournamentState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.TOURNAMENT_STATE);
  localStorage.removeItem(STORAGE_KEYS.TOURNAMENT_HISTORY);
}

// History management
function pushToHistory(state: TournamentState): void {
  if (typeof window === 'undefined') return;
  const history = loadHistory();
  history.push(state);
  // Keep max 50 states in history
  if (history.length > 50) {
    history.shift();
  }
  localStorage.setItem(STORAGE_KEYS.TOURNAMENT_HISTORY, JSON.stringify(history));
}

export function loadHistory(): TournamentState[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.TOURNAMENT_HISTORY);
  if (!data) return [];
  try {
    return JSON.parse(data) as TournamentState[];
  } catch {
    return [];
  }
}

export function popFromHistory(): TournamentState | null {
  if (typeof window === 'undefined') return null;
  const history = loadHistory();
  if (history.length === 0) return null;

  const previousState = history.pop()!;
  localStorage.setItem(STORAGE_KEYS.TOURNAMENT_HISTORY, JSON.stringify(history));
  return previousState;
}

export function canUndo(): boolean {
  return loadHistory().length > 0;
}

// Team persistence (for reuse across tournaments)
export function saveMyTeam(team: Team): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.MY_TEAM, JSON.stringify(team));
}

export function loadMyTeam(): Team | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.MY_TEAM);
  if (!data) return null;
  try {
    return JSON.parse(data) as Team;
  } catch {
    return null;
  }
}

export function saveOpponentTeam(team: Team): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.OPPONENT_TEAM, JSON.stringify(team));
}

export function loadOpponentTeam(): Team | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.OPPONENT_TEAM);
  if (!data) return null;
  try {
    return JSON.parse(data) as Team;
  } catch {
    return null;
  }
}

// Custom maps persistence
export function saveCustomMaps(maps: GameMap[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CUSTOM_MAPS, JSON.stringify(maps));
}

export function loadCustomMaps(): GameMap[] | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_MAPS);
  if (!data) return null;
  try {
    return JSON.parse(data) as GameMap[];
  } catch {
    return null;
  }
}

// Clear all stored data
export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}
