// Core data types for AOS Team Tournament Pairing

export interface Player {
  id: string;
  name: string;
  army: string;
  listName?: string;
  // Battleplan scores: map of battleplan name to score (1-6)
  // 1 = weak, 6 = strong, 4+ = good
  battleplanScores?: Record<string, number>;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  // Matchup matrix: myListName -> opponentListName -> score (1-6)
  // Stored on opponent team file, maps MY lists vs THEIR lists
  matchupMatrix?: Record<string, Record<string, number>>;
}

export interface GameMap {
  id: string;
  name: string;
  description?: string;
  // Detailed battleplan info
  twist?: string;
  scoring?: string;
  // Two layout images (paths to images in public folder)
  layoutImage1?: string;
  layoutImage2?: string;
}

export interface Pairing {
  id: string;
  mapId: string;
  mapName: string;
  round: number; // 1-4
  myPlayer: Player;
  opponentPlayer: Player;
  isAutoPaired: boolean;
}

// Tournament state - simplified: 4 rounds, one per map
export interface TournamentState {
  // Teams
  myTeam: Team;
  opponentTeam: Team;

  // Maps
  allMaps: GameMap[];
  selectedMaps: GameMap[]; // 4 selected maps

  // Current round (1-4, each round = one map)
  currentRound: number;
  phase: PairingPhase;

  // Current round selections
  myDefender: Player | null;
  opponentDefender: Player | null;
  myAttackers: [Player, Player] | null;
  opponentAttackers: [Player, Player] | null;

  // Remaining players (across entire tournament)
  myAvailablePlayers: Player[];
  opponentAvailablePlayers: Player[];

  // All pairings
  pairings: Pairing[];

  // Tournament status
  status: 'setup' | 'in-progress' | 'completed';
}

export type PairingPhase =
  | 'select-my-defender'
  | 'select-opponent-defender'
  | 'offer-my-attackers'
  | 'offer-opponent-attackers'
  | 'opponent-chooses' // Opponent defender picks from my attackers
  | 'i-choose'         // My defender picks from opponent attackers
  | 'round-complete'
  | 'tournament-complete';

// File upload types - player data from JSON file (id is generated)
export interface RosterFilePlayer {
  name: string;
  army: string;
  listName?: string;
  battleplanScores?: Record<string, number>;
}

export interface RosterFile {
  teamName: string;
  players: RosterFilePlayer[];
  // Optional matchup matrix for opponent rosters
  // Maps: myListName -> opponentListName -> score (1-6)
  matchupMatrix?: Record<string, Record<string, number>>;
}

export interface MapsFile {
  maps: Omit<GameMap, 'id'>[];
}

// Helper to generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Helper to create a player with ID
export function createPlayer(data: Omit<Player, 'id'>): Player {
  return {
    id: generateId(),
    ...data,
  };
}

// Helper to create a team with ID
export function createTeam(name: string, players: Omit<Player, 'id'>[]): Team {
  return {
    id: generateId(),
    name,
    players: players.map(createPlayer),
  };
}

// Helper to create a map with ID
export function createGameMap(data: Omit<GameMap, 'id'>): GameMap {
  return {
    id: generateId(),
    ...data,
  };
}

// Score helpers
export const GOOD_SCORE_THRESHOLD = 4;

export function getPlayerBattleplanScore(player: Player, battleplanName: string): number | null {
  if (!player.battleplanScores) return null;
  return player.battleplanScores[battleplanName] ?? null;
}

export function isGoodScore(score: number | null): boolean {
  return score !== null && score >= GOOD_SCORE_THRESHOLD;
}

export function getScoreColor(score: number | null): string {
  if (score === null) return 'text-zinc-400';
  if (score >= 5) return 'text-green-600 dark:text-green-400';
  if (score >= 4) return 'text-lime-600 dark:text-lime-400';
  if (score >= 3) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 2) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

export function getScoreBgColor(score: number | null): string {
  if (score === null) return 'bg-zinc-100 dark:bg-zinc-800';
  if (score >= 5) return 'bg-green-100 dark:bg-green-900';
  if (score >= 4) return 'bg-lime-100 dark:bg-lime-900';
  if (score >= 3) return 'bg-yellow-100 dark:bg-yellow-900';
  if (score >= 2) return 'bg-orange-100 dark:bg-orange-900';
  return 'bg-red-100 dark:bg-red-900';
}

// Matchup matrix helpers
export function getMatchupScore(
  matrix: Record<string, Record<string, number>> | undefined,
  myListName: string,
  opponentListName: string
): number | null {
  if (!matrix) return null;
  return matrix[myListName]?.[opponentListName] ?? null;
}

// Check if current battleplan is the best (or tied for best) among selected battleplans
export function isBestBattleplanForPlayer(
  player: Player,
  currentBattleplanName: string,
  selectedBattleplanNames: string[]
): boolean {
  if (!player.battleplanScores) return false;

  const currentScore = getPlayerBattleplanScore(player, currentBattleplanName);
  if (currentScore === null) return false;

  // Find the max score among all selected battleplans
  const maxScore = Math.max(
    ...selectedBattleplanNames.map(name => getPlayerBattleplanScore(player, name) ?? 0)
  );

  // Current is best if it equals the max
  return currentScore === maxScore && maxScore > 0;
}

// Get the highest threshold (6, 5, 4) for which this is the "last chance" battleplan
// Returns null if not a last chance for any threshold
export function getLastChanceThreshold(
  player: Player,
  currentBattleplanName: string,
  remainingBattleplanNames: string[]
): 6 | 5 | 4 | null {
  if (!player.battleplanScores) return null;

  const currentScore = getPlayerBattleplanScore(player, currentBattleplanName);
  if (currentScore === null || currentScore < 4) return null;

  // Check each threshold from highest to lowest
  for (const threshold of [6, 5, 4] as const) {
    if (currentScore >= threshold) {
      // Count how many remaining battleplans (including current) have this threshold or higher
      const countAtThreshold = remainingBattleplanNames.filter(name => {
        const score = getPlayerBattleplanScore(player, name);
        return score !== null && score >= threshold;
      }).length;

      // If only 1 (the current one), it's the last chance at this threshold
      if (countAtThreshold === 1) {
        return threshold;
      }
    }
  }

  return null;
}

// Get medal rank (1=gold, 2=silver, 3=bronze) for a matchup score against a defender
// Returns null if not in top 3
export function getMedalRank(
  score: number | null,
  allScores: (number | null)[]
): 1 | 2 | 3 | null {
  if (score === null) return null;

  // Get unique sorted scores (descending), excluding nulls
  const validScores = allScores.filter((s): s is number => s !== null);
  const uniqueSorted = [...new Set(validScores)].sort((a, b) => b - a);

  const rank = uniqueSorted.indexOf(score);
  if (rank === 0) return 1; // Gold
  if (rank === 1) return 2; // Silver
  if (rank === 2) return 3; // Bronze
  return null;
}

// Check if this is the last good battleplan for a player among remaining battleplans
export function isLastGoodBattleplan(
  player: Player,
  currentBattleplanName: string,
  remainingBattleplanNames: string[]
): boolean {
  if (!player.battleplanScores) return false;

  const currentScore = getPlayerBattleplanScore(player, currentBattleplanName);
  if (!isGoodScore(currentScore)) return false;

  // Check if any other remaining battleplan has a good score
  const otherGoodBattleplans = remainingBattleplanNames
    .filter(name => name !== currentBattleplanName)
    .filter(name => isGoodScore(getPlayerBattleplanScore(player, name)));

  return otherGoodBattleplans.length === 0;
}
