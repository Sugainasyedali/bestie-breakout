import type { Challenge } from './engine.js';

export const levels: Challenge[] = [
  {
    title: 'Twin Switch Tango',
    objective: 'Reach the two royal pressure plates together. Keep one partner planted while the other finishes.',
    limit: 100,
    stages: [
      {
        mode: 'pads',
        hint: 'Follow your own gallery. The plates stay engaged while you stand on them.',
        map: [
          '#############',
          '#A..#...#..B#',
          '###.#.#.#.###',
          '#...#.#.#...#',
          '#.###.#.###.#',
          '#....a#b....#',
          '#############',
        ],
      },
      {
        mode: 'pads',
        hint: 'The second pair sits in the opposite gallery. Take the tunnels beneath the pillars.',
        map: [
          '#############',
          '#A....#....B#',
          '#.###.#.###.#',
          '#.#b#...#a#.#',
          '#.#.#####.#.#',
          '#...........#',
          '#############',
        ],
      },
    ],
  },
  {
    title: 'Crate Date',
    objective: 'Move the royal crates onto the lower and upper loading marks to build a supply stack.',
    limit: 150,
    stages: [
      {
        mode: 'cargo',
        hint: 'Brace the first crate while the pusher lines it up with the lower loading mark.',
        map: [
          '#############',
          '#...........#',
          '#.A.C...G...#',
          '#..B..##....#',
          '#...........#',
          '#############',
        ],
      },
      {
        mode: 'cargo',
        hint: 'Push the top crate sideways along the loading bay, then get below it and push north.',
        map: [
          '#############',
          '#.......G...#',
          '#..###......#',
          '#.A.C.......#',
          '#..B........#',
          '#############',
        ],
      },
    ],
  },
  {
    title: 'Royal Roller',
    objective: 'Escort the royal cannonball to its catcher. Take the bends together and steer clear of the trap lane.',
    limit: 140,
    stages: [
      {
        mode: 'conveyor',
        hint: 'Push east onto the roller track, then circle below the ball and send it north to the catcher.',
        map: [
          '#############',
          '#.......G...#',
          '#..~~~......#',
          '#.A.C.>.....#',
          '#..B........#',
          '#############',
        ],
      },
    ],
  },
  {
    title: 'Mirror Hallway',
    objective: 'Find the twin reflections in the looking glass, then restore the ray to the royal crest.',
    limit: 145,
    stages: [
      {
        mode: 'pads',
        labels: ['Mirror'],
        hint: 'The looking glass reverses your partner’s horizontal controls. Count the same steps toward the matching plates.',
        map: [
          '#############',
          '#A....#....B#',
          '#####.#.#####',
          '#a....#....b#',
          '#############',
        ],
      },
      {
        mode: 'mirrors',
        hint: 'Send the ray east from its source, south at the first mirror, and east again into the crest.',
        map: [
          '#############',
          '#A..../.....#',
          '#..B........#',
          '#...../..G..#',
          '#############',
        ],
      },
    ],
  },
  {
    title: 'Clockwork Escape',
    objective: 'Set the escapement, carry a gear to the axle, and release both locks before the clock winds down.',
    limit: 180,
    stages: [
      {
        mode: 'sequence',
        labels: ['Bell', 'Gear', 'Dial', 'Key'],
        code: [2, 0, 3, 1],
        hint: 'The reader sees the dial order. Call each symbol for the partner at the winding mechanism.',
        map: ['#########', '#A.....B#', '#...G...#', '#########'],
      },
      {
        mode: 'cargo',
        hint: 'Push the loose gear along the lower lane, then lift it one square onto its axle.',
        map: [
          '#############',
          '#......G....#',
          '#.A.C.......#',
          '#..B........#',
          '#############',
        ],
      },
      {
        mode: 'pads',
        hint: 'Meet the two escape locks on either side of the central clock.',
        map: [
          '#############',
          '#A...#.#...B#',
          '###..#.#..###',
          '#..a.....b..#',
          '#############',
        ],
      },
    ],
  },
];
