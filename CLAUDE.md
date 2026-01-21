# Warhammer AOS Team Tournament Pairing App

## Project Overview

A Next.js application to manage team pairings for Warhammer Age of Sigmar team tournaments. The app helps the owner to do the pairings for his team. the other team will be the opponent and will not see the app (but will do the pairing in real life) the app is useed by me to get an edge in the tournament.

## Tournament Rules

### Structure

- **Maps**: 4 maps selected from a pool of 12 available maps
- **Teams**: 2 teams, each with 8 players and 8 army lists
- **Pairing**: Sequential pairing across maps (Map 1, then Map 2, etc.)

### Pairing Process (per map)

1. Each team selects a **defender** from their remaining player pool
2. Each team offers **2 attackers** (against the opponent's defender)
3. Each defender **chooses 1 attacker** from the 2 offered
4. The chosen attacker is **paired** with the defender for that map
5. The unchosen attacker **returns to the pool**
6. Repeat for turn 1 and 2
7. turn 3 is the same as turn 1 and 2 but the attacking list that is not chosen in turn 3 be automatically paired with the last list in the roster of the opponent..
So there is no turn4 per se because the choice in the previous turns automatically pair the last list in the roster of the opponent.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS 4
- **State**: React state (localStorage for persistence)
- **Language**: TypeScript

## Data Models

### Player

```typescript
interface Player {
  id: string;
  name: string;
  army: string;        // Army faction name
  listName?: string;   // Optional list variant name
}
```

### Team

```typescript
interface Team {
  id: string;
  name: string;
  players: Player[];   // 8 players
}
```

### Map

```typescript
interface Map {
  id: string;
  name: string;
  description?: string;
}
```

### Pairing

```typescript
interface Pairing {
  mapId: string;
  teamAPlayer: Player;
  teamBPlayer: Player;
}
```

### TournamentState

```typescript
interface TournamentState {
  teamA: Team;
  teamB: Team;
  selectedMaps: Map[];           // 4 selected maps
  currentMapIndex: number;       // 0-3
  pairings: Pairing[];           // Completed pairings
  availablePlayersA: Player[];   // Remaining unpaired players
  availablePlayersB: Player[];
  currentPhase: PairingPhase;
}

type PairingPhase =
  | 'select-defenders'
  | 'offer-attackers'
  | 'choose-attacker-a'
  | 'choose-attacker-b'
  | 'round-complete';
```

## File Structure

```
src/
├── app/
│   ├── page.tsx              # Main pairing interface
│   ├── setup/
│   │   └── page.tsx          # Tournament setup (load rosters, select maps)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── TeamPanel.tsx         # Display team roster and available players
│   ├── MapSelector.tsx       # Select 4 maps from 12
│   ├── DefenderSelector.tsx  # Select defender for current round
│   ├── AttackerOffer.tsx     # Offer 2 attackers
│   ├── AttackerChoice.tsx    # Defender chooses 1 attacker
│   ├── PairingsList.tsx      # Show completed pairings
│   ├── CurrentRound.tsx      # Current round status/actions
│   └── FileUpload.tsx        # Upload roster/map files
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   ├── storage.ts            # LocalStorage helpers
│   └── pairing-logic.ts      # Pairing state machine logic
└── data/
    └── default-maps.ts       # Default 12 AOS maps
```

## Implementation Plan

### Phase 1: Core Data & Types

1. Create TypeScript interfaces in `lib/types.ts`
2. Create default maps data in `data/default-maps.ts`
3. Create localStorage helpers in `lib/storage.ts`

### Phase 2: Setup Page

1. Create `/setup` page with:
   - File upload for Team A roster (JSON/CSV)
   - File upload for Team B roster (JSON/CSV)
   - Map selection UI (pick 4 from 12)
   - Start tournament button

### Phase 3: Main Pairing Interface

1. Create main page layout with:
   - Left panel: Team A (players, defender selection, attacker offering)
   - Right panel: Team B (same)
   - Center: Current map, phase indicator, action buttons
   - Bottom: Completed pairings list

### Phase 4: Pairing State Machine

1. Implement phase transitions:
   - `select-defenders` → Both teams pick defender
   - `offer-attackers` → Both teams offer 2 attackers
   - `choose-attacker-a` → Team A defender picks
   - `choose-attacker-b` → Team B defender picks
   - `round-complete` → Show result, advance to next round

### Phase 5: Polish & Persistence

1. Save/load tournament state to localStorage
2. Undo functionality
3. Export pairings summary
4. Responsive design for different screen sizes

## File Formats

### Roster File (JSON)

```json
{
  "teamName": "Team Alpha",
  "players": [
    { "name": "Player 1", "army": "Stormcast Eternals", "listName": "Shootcast" },
    { "name": "Player 2", "army": "Skaven", "listName": "Verminlord Spam" }
  ]
}
```

### Maps File (JSON) - Optional

```json
{
  "maps": [
    { "name": "Ours for the Taking", "description": "..." },
    { "name": "Scorched Earth", "description": "..." }
  ]
}
```

## Current Status

- [x] Project initialized with Next.js 16 + Tailwind CSS 4
- [x] Phase 1: Core Data & Types
- [x] Phase 2: Setup Page
- [x] Phase 3: Main Pairing Interface
- [x] Phase 4: Pairing State Machine
- [ ] Phase 5: Polish & Persistence
