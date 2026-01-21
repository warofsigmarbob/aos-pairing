import { GameMap, createGameMap } from '@/lib/types';

// Default 12 AOS Battleplans/Maps
// These can be customized or replaced via file upload
export const DEFAULT_MAPS: GameMap[] = [
  createGameMap({
    name: 'Passing Seasons',
    twist: `In battle rounds 2 and 4, if you are the underdog, you can use the 'Burgeoning Rejuvenation' ability. In battle rounds 3 and 5, while you are the underdog, your army has the 'Powerful Resurgence' ability.

Once Per Battle Round, Start of Battle Round
BURGEONING REJUVENATION
Effect: Pick 1 of the following:
- Heal (D3) every friendly unit contesting an Oakenbrow objective.
- For the rest of the battle round, while a friendly unit is contesting a Gnarlroot:
  - If it has a ward save, add 1 to ward rolls for that unit.
  - If it does not have a ward save, it has WARD (6+).

Passive
POWERFUL RESURGENCE
Effect: Add 1 to wound rolls for combat attacks made by friendly units while they are contesting a Gnarlroot objective.`,
    scoring: `Each player scores victory points at the end of each of their turns as follows:
- In battle rounds 1, 3 and 5, score 5 victory points for each Gnarlroot objective that you control.
- In battle rounds 2 and 4, score 5 victory points for each Oakenbrow objective that you control.`,
    layoutImage1: '/battleplans/passing-seasons-1.png',
    layoutImage2: '/battleplans/passing-seasons-2.png',
  }),
  createGameMap({ name: 'Paths of the Fey' }),
  createGameMap({ name: 'Roiling Roots' }),
  createGameMap({ name: 'Cyclic Shifts' }),
  createGameMap({ name: 'Surge of Slaughter' }),
  createGameMap({ name: 'Linked Ley Lines' }),
  createGameMap({ name: 'Noxious Nexus' }),
  createGameMap({ name: 'The Liferoots' }),
  createGameMap({ name: 'Bountiful Equinox' }),
  createGameMap({ name: 'Lifecycle' }),
  createGameMap({ name: 'Creeping Corruption' }),
  createGameMap({ name: 'Grasp of Thorns' }),
];
