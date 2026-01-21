'use client';

import { TournamentState } from '@/lib/types';

interface Round3PreviewProps {
  state: TournamentState;
}

export function Round3Preview({ state }: Round3PreviewProps) {
  const {
    currentRound,
    phase,
    myAvailablePlayers,
    opponentAvailablePlayers,
    myDefender,
    opponentDefender,
    myAttackers,
    opponentAttackers,
    selectedMaps,
  } = state;

  // Only show in round 3
  if (currentRound !== 3) return null;

  const map3 = selectedMaps[2];
  const map4 = selectedMaps[3];

  // Calculate who will be auto-paired based on current state
  const getPreviewData = () => {
    // Players not selected as defender or attacker yet
    const myRemaining = myAvailablePlayers.filter(
      (p) =>
        p.id !== myDefender?.id &&
        !myAttackers?.some((a) => a.id === p.id)
    );
    const oppRemaining = opponentAvailablePlayers.filter(
      (p) =>
        p.id !== opponentDefender?.id &&
        !opponentAttackers?.some((a) => a.id === p.id)
    );

    return {
      myRemaining,
      oppRemaining,
      myNotOffered: myRemaining, // Players I didn't offer as attackers
      oppNotOffered: oppRemaining, // Players opponent didn't offer
    };
  };

  const preview = getPreviewData();

  // Show different previews based on phase
  const renderPreview = () => {
    // Before attackers are set - show who will be "not offered"
    if (phase === 'select-my-defender' || phase === 'select-opponent-defender') {
      return (
        <div className="text-sm text-zinc-500">
          <p>Round 3: After choices, remaining players will auto-pair to {map4.name}</p>
        </div>
      );
    }

    // After defenders selected, before attackers
    if (phase === 'offer-my-attackers' || phase === 'offer-opponent-attackers') {
      return (
        <div className="space-y-3">
          <div className="text-sm">
            <p className="font-medium text-amber-600 dark:text-amber-400 mb-2">
              Round 3 Preview - Choose carefully!
            </p>
            <p className="text-zinc-500 text-xs mb-2">
              After this round, remaining players auto-pair to {map4.name}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-medium text-blue-600 mb-1">Your remaining ({myAvailablePlayers.length}):</p>
              <ul className="space-y-1">
                {myAvailablePlayers.map((p) => (
                  <li key={p.id} className={`
                    px-2 py-1 rounded
                    ${p.id === myDefender?.id ? 'bg-blue-100 dark:bg-blue-900 font-medium' : 'bg-zinc-100 dark:bg-zinc-800'}
                  `}>
                    {p.army}
                    {p.id === myDefender?.id && ' (Defender)'}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-red-600 mb-1">Opponent remaining ({opponentAvailablePlayers.length}):</p>
              <ul className="space-y-1">
                {opponentAvailablePlayers.map((p) => (
                  <li key={p.id} className={`
                    px-2 py-1 rounded
                    ${p.id === opponentDefender?.id ? 'bg-red-100 dark:bg-red-900 font-medium' : 'bg-zinc-100 dark:bg-zinc-800'}
                  `}>
                    {p.army}
                    {p.id === opponentDefender?.id && ' (Defender)'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }

    // After attackers set - show choice outcomes
    if ((phase === 'i-choose' || phase === 'opponent-chooses') && myAttackers && opponentAttackers) {
      // Find who was NOT offered
      const myNotOffered = myAvailablePlayers.find(
        (p) => p.id !== myDefender?.id && !myAttackers.some((a) => a.id === p.id)
      );
      const oppNotOffered = opponentAvailablePlayers.find(
        (p) => p.id !== opponentDefender?.id && !opponentAttackers.some((a) => a.id === p.id)
      );

      return (
        <div className="space-y-3">
          <p className="font-medium text-amber-600 dark:text-amber-400 text-sm">
            Round 3 Outcome Preview
          </p>

          {/* Show what happens with each choice */}
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
              {map3.name} (this round):
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-medium">{myDefender?.army}</span>
                <span className="text-zinc-400">vs</span>
                <span className="text-red-600">Your choice from: {opponentAttackers.map(a => a.army).join(' or ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">Opponent picks from: {myAttackers.map(a => a.army).join(' or ')}</span>
                <span className="text-zinc-400">vs</span>
                <span className="text-red-600 font-medium">{opponentDefender?.army}</span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">
              {map4.name} (auto-paired):
            </p>
            <div className="space-y-1 text-xs">
              <p className="text-zinc-600 dark:text-zinc-400">
                Unchosen attackers + not-offered players will auto-pair:
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-blue-600">
                  <p className="font-medium">Your side:</p>
                  <p>• Unchosen from [{myAttackers.map(a => a.army).join(', ')}]</p>
                  {myNotOffered && <p>• {myNotOffered.army} (not offered)</p>}
                </div>
                <div className="text-xl text-zinc-400">↔</div>
                <div className="text-red-600 text-right">
                  <p className="font-medium">Opponent:</p>
                  <p>• Unchosen from [{opponentAttackers.map(a => a.army).join(', ')}]</p>
                  {oppNotOffered && <p>• {oppNotOffered.army} (not offered)</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Show specific scenarios */}
          {phase === 'i-choose' && (
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-xs">
              <p className="font-medium mb-2">If you choose...</p>
              {opponentAttackers.map((attacker) => {
                const unchosen = opponentAttackers.find((a) => a.id !== attacker.id);
                return (
                  <div key={attacker.id} className="mb-2 p-2 bg-white dark:bg-zinc-900 rounded">
                    <p className="font-medium text-green-600">→ {attacker.army}:</p>
                    <p className="text-zinc-500 ml-2">
                      {map3.name}: {myDefender?.army} vs {attacker.army}
                    </p>
                    <p className="text-purple-600 ml-2">
                      {map4.name} will have: {unchosen?.army} (unchosen) + {oppNotOffered?.army} (not offered)
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border-2 border-amber-300 dark:border-amber-700 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span className="font-semibold text-amber-600 dark:text-amber-400">Round 3 - Final Pairing Round</span>
      </div>
      {renderPreview()}
    </div>
  );
}
