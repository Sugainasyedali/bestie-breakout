import type { Challenge } from './engine.js';

export const levels: Challenge[] = [
  {
    title: 'Conveyor Chaos',
    objective: 'Send two toy shipments down different belts. Coordinate each transfer to land the parcels on their shipping marks.',
    limit: 150,
    stages: [
      {
        mode: 'conveyor',
        hint: 'The first belt runs east. Brace the parcel and feed it onto the marked track.',
        map: [
          '#############',
          '#...........#',
          '#.A.C.>>.G..#',
          '#..B........#',
          '#############',
        ],
      },
      {
        mode: 'conveyor',
        hint: 'The return belt runs west. Position the pusher on the right of the crate.',
        map: [
          '#############',
          '#...........#',
          '#..G.<<.C.A.#',
          '#........B..#',
          '#############',
        ],
      },
    ],
  },
  {
    title: 'Magnet Mayhem',
    objective: 'Guide the steel cores into opposite sockets with the magnetic controls.',
    limit: 145,
    stages: [
      {
        mode: 'magnet',
        hint: 'Coordinate the magnetic tool with the mover. The first socket is east of the core.',
        map: [
          '#############',
          '#......##...#',
          '#.A.C...G...#',
          '#..B........#',
          '#############',
        ],
      },
      {
        mode: 'magnet',
        hint: 'The second socket is behind you. Circle around the core to move it west.',
        map: [
          '#############',
          '#......B....#',
          '#..G....C.A.#',
          '#.......#...#',
          '#...........#',
          '#############',
        ],
      },
    ],
  },
  {
    title: 'Assembly Mix-up',
    objective: 'Read the private blueprints and fit each toy part in order. Swap stations for the second blueprint.',
    limit: 105,
    stages: [
      {
        mode: 'sequence',
        labels: ['Axle', 'Wheel', 'Spring', 'Cap'],
        code: [0, 2, 1, 3],
        hint: 'Call out the four parts in blueprint order. The assembler fits them at the workbench.',
        role: 0,
        map: ['###########', '#A...#...B#', '#....G....#', '###########'],
      },
      {
        mode: 'sequence',
        labels: ['Shell', 'Key', 'Cog', 'Wing'],
        code: [2, 0, 3, 1, 2],
        hint: 'Trade blueprints. This wind-up bird needs five parts, including a second cog.',
        role: 1,
        map: ['###########', '#A...#...B#', '#....G....#', '###########'],
      },
    ],
  },
  {
    title: 'Forklift Frenzy',
    objective: 'Guide the forklift around the stacked pallets and through the guarded loading dock.',
    limit: 110,
    stages: [
      {
        mode: 'route',
        hint: 'The guide calls the turns through the pallet aisle. Operate the safety tool at marked crossings.',
        role: 0,
        map: [
          '#############',
          '#A..#.......#',
          '###.#.#####.#',
          '#B#...#...#.#',
          '#.#####.#.#~#',
          '#.....*.#..G#',
          '#############',
        ],
      },
    ],
  },
  {
    title: 'Factory Shutdown',
    objective: 'Enter the master-stop sequence, clear the final shipping belt, and stand on both emergency cutoffs.',
    limit: 150,
    stages: [
      {
        mode: 'sequence',
        labels: ['Pump', 'Valve', 'Motor', 'Brake'],
        code: [2, 0, 1, 3],
        hint: 'Relay the shutdown sequence from the instruction plate to the operator.',
        map: ['#########', '#A.....B#', '#...G...#', '#########'],
      },
      {
        mode: 'conveyor',
        hint: 'Clear the last package from the belt before cutting power.',
        map: [
          '#############',
          '#...........#',
          '#.A.C.>.G...#',
          '#..B........#',
          '#############',
        ],
      },
      {
        mode: 'pads',
        hint: 'Take the outer passages and stand on both power cutoffs at once.',
        map: [
          '#############',
          '#A.###.###.B#',
          '#..#.....#..#',
          '#..#.#.#.#..#',
          '#....a#b....#',
          '#############',
        ],
      },
    ],
  },
];
