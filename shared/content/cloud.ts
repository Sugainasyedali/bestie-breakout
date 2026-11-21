import type { Challenge } from "./engine.js";

export const levels: Challenge[] = [
  {
    title: "Cloud Courier",
    objective: "Deliver the royal weather parcel to the gold mooring on the far island.",
    limit: 105,
    stages: [
      {
        mode: "cargo",
        hint: "One courier secures the parcel while the other pushes. Rearm the sling for each shove toward the mooring.",
        map: [
          "#############",
          "#...##...##.#",
          "#...........#",
          "#A.C......G.#",
          "#B..........#",
          "#.##...##...#",
          "#############",
        ],
      },
    ],
  },
  {
    title: "Wind Tunnel",
    objective: "Operate the fans and pilot both gliders through the two sky passages.",
    limit: 110,
    stages: [
      {
        mode: "wind",
        role: 0,
        hint: "The pilot follows the channel. Call for the fan before entering the gust tiles.",
        map: [
          "#############",
          "#A..~..######",
          "####.#..~...#",
          "#B...##.###.#",
          "#.#####...~G#",
          "#############",
        ],
      },
      {
        mode: "wind",
        role: 1,
        hint: "Trade the fan controls. Follow the upper jet around the island before banking toward the beacon.",
        map: [
          "#############",
          "#B..~...#####",
          "#######.~...#",
          "#A......###.#",
          "#...###..~.G#",
          "#############",
        ],
      },
    ],
  },
  {
    title: "Gravity Flip",
    objective: "Reverse gravity at the marked seams and guide both explorers to safety.",
    limit: 120,
    stages: [
      {
        mode: "gravity",
        role: 0,
        hint: "One explorer steers and one operates the inverter. Agree on a direction before each flip.",
        map: [
          "#############",
          "#A..~....####",
          "#.######.####",
          "#B..##...~.G#",
          "#############",
        ],
      },
      {
        mode: "gravity",
        role: 1,
        hint: "Exchange roles at the ceiling dock. The winding return tunnel has two gravity seams.",
        map: [
          "#############",
          "#B...#....G.#",
          "###~##.######",
          "#A..~.......#",
          "#############",
        ],
      },
    ],
  },
  {
    title: "Bridge Builders",
    objective: "Lay two sky bridges and reunite on the builders’ landing pads.",
    limit: 130,
    stages: [
      {
        mode: "build",
        role: 0,
        hint: "At each gap the builder places a plank in front of the runner. Cross one plank at a time.",
        map: [
          "#############",
          "#A..++...####",
          "#.######.####",
          "#B...#...++G#",
          "#############",
        ],
      },
      {
        mode: "pads",
        hint: "Stand on the two survey plates together to secure the final span.",
        map: [
          "#############",
          "#A..#...#..a#",
          "#.#...#...#.#",
          "#.#.#...#.#.#",
          "#B..#...#..b#",
          "#############",
        ],
      },
    ],
  },
  {
    title: "Storm Summit",
    objective: "Weather the gale, restore the cloud bridge, and reach the twin summit beacons.",
    limit: 145,
    stages: [
      {
        mode: "wind",
        role: 1,
        hint: "Call out each exposed bend before the pilot enters the storm current.",
        map: [
          "#############",
          "#B.~..#....G#",
          "#.###.#~.##.#",
          "#A..#..~..#.#",
          "#############",
        ],
      },
      {
        mode: "build",
        role: 0,
        hint: "The lookout changes places with the pilot. Cross each gap on the builder’s signal.",
        map: [
          "#############",
          "#A.++..#...G#",
          "######+#.####",
          "#B.....+....#",
          "#############",
        ],
      },
      {
        mode: "pads",
        hint: "Circle the storm eye, split at the fork, and light both summit beacons together.",
        map: [
          "#############",
          "#A..#.....#a#",
          "#.#.#.###.#.#",
          "#.#...#.....#",
          "#B..#...###b#",
          "#############",
        ],
      },
    ],
  },
];
