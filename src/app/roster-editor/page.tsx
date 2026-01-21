'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { RosterFilePlayer, RosterFile } from '@/lib/types';
import { DEFAULT_MAPS } from '@/data/default-maps';

interface EditablePlayer extends RosterFilePlayer {
  expanded: boolean;
}

const createEmptyPlayer = (): EditablePlayer => ({
  name: '',
  army: '',
  listName: '',
  battleplanScores: {},
  expanded: false,
});

const createEmptyRoster = (): { teamName: string; players: EditablePlayer[] } => ({
  teamName: '',
  players: Array.from({ length: 8 }, createEmptyPlayer),
});

const STORAGE_PREFIX = 'aos-roster-';
const SAVED_ROSTERS_KEY = 'aos-saved-rosters';

// Get list of saved roster names
function getSavedRosterNames(): string[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(SAVED_ROSTERS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as string[];
  } catch {
    return [];
  }
}

// Save roster to localStorage
function saveRosterToStorage(roster: { teamName: string; players: EditablePlayer[] }) {
  if (typeof window === 'undefined') return;
  if (!roster.teamName.trim()) return; // Don't save without a name

  const key = STORAGE_PREFIX + roster.teamName;
  localStorage.setItem(key, JSON.stringify(roster));

  // Update saved rosters list
  const names = getSavedRosterNames();
  if (!names.includes(roster.teamName)) {
    names.push(roster.teamName);
    localStorage.setItem(SAVED_ROSTERS_KEY, JSON.stringify(names));
  }
}

// Load roster from localStorage
function loadRosterFromStorage(teamName: string): { teamName: string; players: EditablePlayer[] } | null {
  if (typeof window === 'undefined') return null;
  const key = STORAGE_PREFIX + teamName;
  const data = localStorage.getItem(key);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Delete roster from localStorage
function deleteRosterFromStorage(teamName: string) {
  if (typeof window === 'undefined') return;
  const key = STORAGE_PREFIX + teamName;
  localStorage.removeItem(key);

  // Update saved rosters list
  const names = getSavedRosterNames().filter(n => n !== teamName);
  localStorage.setItem(SAVED_ROSTERS_KEY, JSON.stringify(names));
}

export default function RosterEditorPage() {
  const [activeTab, setActiveTab] = useState<'roster' | 'matchups'>('roster');
  const [roster, setRoster] = useState(createEmptyRoster());
  const [savedRosters, setSavedRosters] = useState<string[]>([]);
  const [opponentRoster, setOpponentRoster] = useState<RosterFile | null>(null);
  const [matchupMatrix, setMatchupMatrix] = useState<Record<string, Record<string, number>>>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const opponentFileInputRef = useRef<HTMLInputElement>(null);

  // Load saved rosters list on mount
  useEffect(() => {
    setSavedRosters(getSavedRosterNames());
  }, []);

  // Auto-save to localStorage when roster changes (debounced)
  useEffect(() => {
    if (!roster.teamName.trim()) return;

    const timer = setTimeout(() => {
      saveRosterToStorage(roster);
      setSavedRosters(getSavedRosterNames());
      setLastSaved(new Date().toLocaleTimeString());
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [roster]);

  // Load a saved roster
  const handleLoadSaved = useCallback((teamName: string) => {
    const loaded = loadRosterFromStorage(teamName);
    if (loaded) {
      setRoster(loaded);
    }
  }, []);

  // Delete a saved roster
  const handleDeleteSaved = useCallback((teamName: string) => {
    if (confirm(`Delete saved roster "${teamName}"?`)) {
      deleteRosterFromStorage(teamName);
      setSavedRosters(getSavedRosterNames());
      // If we deleted the current roster, clear it
      if (roster.teamName === teamName) {
        setRoster(createEmptyRoster());
      }
    }
  }, [roster.teamName]);

  // Get all battleplan names from default maps
  const battleplanNames = DEFAULT_MAPS.map((m) => m.name);

  // Update team name
  const updateTeamName = (name: string) => {
    setRoster((prev) => ({ ...prev, teamName: name }));
  };

  // Update player field
  const updatePlayer = (index: number, field: keyof EditablePlayer, value: string | boolean) => {
    setRoster((prev) => ({
      ...prev,
      players: prev.players.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  };

  // Update player battleplan score
  const updatePlayerScore = (playerIndex: number, battleplanName: string, score: number | null) => {
    setRoster((prev) => ({
      ...prev,
      players: prev.players.map((p, i) => {
        if (i !== playerIndex) return p;
        const newScores = { ...p.battleplanScores };
        if (score === null) {
          delete newScores[battleplanName];
        } else {
          newScores[battleplanName] = score;
        }
        return { ...p, battleplanScores: newScores };
      }),
    }));
  };

  // Toggle player expansion
  const togglePlayerExpansion = (index: number) => {
    updatePlayer(index, 'expanded', !roster.players[index].expanded);
  };

  // Import roster from JSON
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text) as RosterFile;

      if (!data.teamName || !Array.isArray(data.players)) {
        throw new Error('Invalid roster file format');
      }

      // Pad to 8 players if needed
      const players: EditablePlayer[] = data.players.slice(0, 8).map((p) => ({
        ...p,
        expanded: false,
      }));
      while (players.length < 8) {
        players.push(createEmptyPlayer());
      }

      setRoster({ teamName: data.teamName, players });
    } catch (err) {
      alert(`Error loading roster: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Export roster to JSON
  const handleExport = () => {
    const validPlayers = roster.players.filter((p) => p.name.trim() !== '');
    if (validPlayers.length === 0) {
      alert('Please add at least one player');
      return;
    }

    const exportData: RosterFile = {
      teamName: roster.teamName || 'My Team',
      players: validPlayers.map(({ expanded, ...player }) => ({
        ...player,
        battleplanScores: Object.keys(player.battleplanScores || {}).length > 0
          ? player.battleplanScores
          : undefined,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${roster.teamName || 'roster'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import opponent roster for matchup editing
  const handleImportOpponent = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text) as RosterFile;

      if (!data.teamName || !Array.isArray(data.players)) {
        throw new Error('Invalid roster file format');
      }

      setOpponentRoster(data);
      // Initialize matchup matrix from file or empty
      setMatchupMatrix(data.matchupMatrix || {});
    } catch (err) {
      alert(`Error loading opponent roster: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    if (opponentFileInputRef.current) {
      opponentFileInputRef.current.value = '';
    }
  };

  // Update matchup score
  const updateMatchupScore = (myListName: string, oppListName: string, score: number | null) => {
    setMatchupMatrix((prev) => {
      const newMatrix = { ...prev };
      if (!newMatrix[myListName]) {
        newMatrix[myListName] = {};
      }
      if (score === null) {
        delete newMatrix[myListName][oppListName];
        if (Object.keys(newMatrix[myListName]).length === 0) {
          delete newMatrix[myListName];
        }
      } else {
        newMatrix[myListName][oppListName] = score;
      }
      return newMatrix;
    });
  };

  // Export opponent roster with matchup matrix
  const handleExportOpponentWithMatchups = () => {
    if (!opponentRoster) return;

    const exportData: RosterFile = {
      ...opponentRoster,
      matchupMatrix: Object.keys(matchupMatrix).length > 0 ? matchupMatrix : undefined,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${opponentRoster.teamName}-with-matchups.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get my list names for matchup matrix
  const myListNames = roster.players
    .filter((p) => p.name.trim() !== '')
    .map((p) => p.listName || p.name);

  // Get opponent list names
  const oppListNames = opponentRoster?.players.map((p) => p.listName || p.name) || [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Roster Editor</h1>
          <Link
            href="/"
            className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Back to Pairing
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'roster'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            Edit Roster
          </button>
          <button
            onClick={() => setActiveTab('matchups')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'matchups'
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            Matchup Matrix
          </button>
        </div>

        {/* Roster Editor Tab */}
        {activeTab === 'roster' && (
          <div className="space-y-6">
            {/* Saved Rosters */}
            {savedRosters.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                <label className="block text-sm font-medium mb-2">Saved Rosters</label>
                <div className="flex flex-wrap gap-2">
                  {savedRosters.map((name) => (
                    <div
                      key={name}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        roster.teamName === name
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'bg-zinc-100 dark:bg-zinc-800'
                      }`}
                    >
                      <button
                        onClick={() => handleLoadSaved(name)}
                        className="hover:underline"
                      >
                        {name}
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(name)}
                        className="ml-1 text-red-500 hover:text-red-700 text-xs"
                        title="Delete"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Import/Export buttons */}
            <div className="flex gap-3 items-center flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-roster"
              />
              <label
                htmlFor="import-roster"
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 rounded cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-700"
              >
                Import JSON
              </label>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Export JSON
              </button>
              <button
                onClick={() => {
                  setRoster(createEmptyRoster());
                  setLastSaved(null);
                }}
                className="px-4 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50 dark:hover:bg-red-950"
              >
                New Roster
              </button>
              {/* Auto-save indicator */}
              {lastSaved && roster.teamName.trim() && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  Auto-saved at {lastSaved}
                </span>
              )}
            </div>

            {/* Team Name */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
              <label className="block text-sm font-medium mb-2">
                Team Name
                {!roster.teamName.trim() && (
                  <span className="text-amber-600 dark:text-amber-400 ml-2 text-xs font-normal">
                    (enter a name to enable auto-save)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={roster.teamName}
                onChange={(e) => updateTeamName(e.target.value)}
                placeholder="Enter team name..."
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800"
              />
            </div>

            {/* Players */}
            <div className="space-y-3">
              <h2 className="font-semibold text-lg">Players (8)</h2>
              {roster.players.map((player, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                >
                  {/* Player main row */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium text-zinc-500 w-6">#{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => togglePlayerExpansion(index)}
                        className="text-xs text-blue-500 hover:text-blue-700 underline"
                      >
                        {player.expanded ? 'Hide scores' : 'Battleplan scores'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                        placeholder="Player name"
                        className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800"
                      />
                      <input
                        type="text"
                        value={player.army}
                        onChange={(e) => updatePlayer(index, 'army', e.target.value)}
                        placeholder="Army"
                        className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800"
                      />
                      <input
                        type="text"
                        value={player.listName || ''}
                        onChange={(e) => updatePlayer(index, 'listName', e.target.value)}
                        placeholder="List name (optional)"
                        className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800"
                      />
                    </div>
                  </div>

                  {/* Battleplan scores (expandable) */}
                  {player.expanded && (
                    <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-950">
                      <p className="text-sm font-medium mb-3">Battleplan Scores (1-6, leave empty for no score)</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {battleplanNames.map((bp) => (
                          <div key={bp} className="flex items-center gap-2">
                            <label className="text-xs text-zinc-500 w-20 truncate" title={bp}>
                              {bp.replace('Battleplan ', 'BP')}
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="6"
                              value={player.battleplanScores?.[bp] ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                  updatePlayerScore(index, bp, null);
                                } else {
                                  const num = parseInt(val, 10);
                                  if (num >= 1 && num <= 6) {
                                    updatePlayerScore(index, bp, num);
                                  }
                                }
                              }}
                              className="w-12 px-2 py-1 text-center border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matchup Matrix Tab */}
        {activeTab === 'matchups' && (
          <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>How it works:</strong> First, make sure you have your roster filled in the "Edit Roster" tab.
                Then import an opponent roster here to create the matchup matrix (your lists vs their lists).
                The matrix will be saved in the opponent's roster file.
              </p>
            </div>

            {/* Import opponent */}
            <div className="flex gap-3 items-center">
              <input
                ref={opponentFileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportOpponent}
                className="hidden"
                id="import-opponent"
              />
              <label
                htmlFor="import-opponent"
                className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded cursor-pointer hover:bg-red-200 dark:hover:bg-red-800"
              >
                Import Opponent Roster
              </label>
              {opponentRoster && (
                <>
                  <span className="text-sm text-zinc-500">
                    Loaded: <strong className="text-red-600">{opponentRoster.teamName}</strong>
                  </span>
                  <button
                    onClick={handleExportOpponentWithMatchups}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Export with Matchups
                  </button>
                </>
              )}
            </div>

            {/* Matrix grid */}
            {myListNames.length > 0 && oppListNames.length > 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="p-2 text-left bg-zinc-100 dark:bg-zinc-800 sticky left-0">
                        Your List / Opponent
                      </th>
                      {oppListNames.map((opp) => (
                        <th
                          key={opp}
                          className="p-2 text-center text-red-600 font-medium min-w-[80px]"
                          title={opp}
                        >
                          <span className="block truncate max-w-[80px]">{opp}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myListNames.map((myList) => (
                      <tr key={myList} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td
                          className="p-2 font-medium text-blue-600 bg-zinc-50 dark:bg-zinc-800 sticky left-0"
                          title={myList}
                        >
                          <span className="block truncate max-w-[120px]">{myList}</span>
                        </td>
                        {oppListNames.map((oppList) => {
                          const score = matchupMatrix[myList]?.[oppList];
                          return (
                            <td key={oppList} className="p-1 text-center">
                              <input
                                type="number"
                                min="1"
                                max="6"
                                value={score ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '') {
                                    updateMatchupScore(myList, oppList, null);
                                  } else {
                                    const num = parseInt(val, 10);
                                    if (num >= 1 && num <= 6) {
                                      updateMatchupScore(myList, oppList, num);
                                    }
                                  }
                                }}
                                className={`w-12 px-2 py-1 text-center border rounded ${
                                  score === undefined
                                    ? 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                                    : score >= 5
                                      ? 'border-green-400 bg-green-50 dark:bg-green-950'
                                      : score >= 4
                                        ? 'border-lime-400 bg-lime-50 dark:bg-lime-950'
                                        : score >= 3
                                          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950'
                                          : score >= 2
                                            ? 'border-orange-400 bg-orange-50 dark:bg-orange-950'
                                            : 'border-red-400 bg-red-50 dark:bg-red-950'
                                }`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-8 text-center text-zinc-500">
                {myListNames.length === 0 && (
                  <p>Please fill in your roster in the "Edit Roster" tab first.</p>
                )}
                {myListNames.length > 0 && oppListNames.length === 0 && (
                  <p>Import an opponent roster to start editing matchups.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
