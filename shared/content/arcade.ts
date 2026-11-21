import type { Challenge } from "./engine.js";

export const levels: Challenge[] = [
  {
    title: "Rhythm Relay",
    objective: "Pass a syncopated beat between decks, then clear the encore without losing the rhythm.",
    limit: 80,
    stages: [
      {
        mode: "rhythm",
        labels: ["Kick", "Clap", "Hat", "Bass"],
        code: [0, 2, 1, 2, 0, 3],
        map: ["###########", "#A...#...B#", "#..#...#..#", "#....G....#", "###########"],
        hint: "Trade beats between the left and right decks. Call the next sound before your turn ends.",
      },
      {
        mode: "rhythm",
        labels: ["Kick", "Clap", "Hat", "Bass"],
        code: [3, 0, 2, 1, 3, 2, 0, 1],
        map: ["###########", "#A.#...#.B#", "#...#G#...#", "#.........#", "###########"],
        hint: "The encore changes the opening note. Keep the handoff steady through all eight notes.",
      },
    ],
  },
  {
    title: "Color Swap",
    objective: "Decode two banks of neon lamps. Exchange the decoder and switchboard for the second circuit.",
    limit: 80,
    stages: [
      {
        mode: "sequence",
        role: 1,
        labels: ["Cyan", "Lime", "Pink", "Amber"],
        code: [2, 1, 0, 3, 1],
        map: ["#########", "#A.....B#", "#.##.##.#", "#..#G#..#", "#########"],
        hint: "Read the decal on your lamps to the switchboard operator. Call the names rather than their positions.",
      },
      {
        mode: "sequence",
        role: 0,
        labels: ["Amber", "Pink", "Cyan", "Lime"],
        code: [1, 2, 0, 3, 0, 2],
        map: ["#########", "#B..#..A#", "#.#...#.#", "#...G...#", "#########"],
        hint: "Swap seats. The lamps have changed positions on this switchboard, so name every color.",
      },
    ],
  },
  {
    title: "Laser Logic",
    objective: "Bounce the cabinet’s beam into two receivers. Work back from the target to find the right reflections.",
    limit: 100,
    stages: [
      {
        mode: "mirrors",
        map: [
          "###########",
          "#A.../....#",
          "#..#...#..#",
          "#..#...#..#",
          "#B.../...G#",
          "###########",
        ],
        hint: "Aim the first corner down the column, then send the beam right into the low receiver.",
      },
      {
        mode: "mirrors",
        map: [
          "###########",
          "#B....G...#",
          "#.##...#..#",
          "#A../..#..#",
          "#..#......#",
          "#..././...#",
          "###########",
        ],
        hint: "The second cabinet has three corners. Send the beam under the barrier and back up to its receiver.",
      },
    ],
  },
  {
    title: "Pixel Pairs",
    objective: "Match each pixel glyph on your partner’s display with its twin on your keypad.",
    limit: 75,
    stages: [
      {
        mode: "sequence",
        role: 0,
        labels: ["Ghost", "Heart", "Key", "Crown"],
        code: [3, 1, 3, 0, 2],
        map: ["#########", "#A.#.#.B#", "#...G...#", "#.##.##.#", "#########"],
        hint: "Describe the glyphs in reading order. Your partner finds each matching twin on the keypad.",
      },
      {
        mode: "sequence",
        role: 1,
        labels: ["Gem", "Shell", "Star", "Coin"],
        code: [2, 0, 3, 2, 1, 0],
        map: ["#########", "#B#...#A#", "#...G...#", "#.#...#.#", "#########"],
        hint: "Trade displays. Match the six bonus glyphs; listen for both pairs of repeated glyphs.",
      },
    ],
  },
  {
    title: "High Score Heist",
    objective: "Crack the vault code, reroute the security laser, and reach both extraction pads before the arcade closes.",
    limit: 125,
    stages: [
      {
        mode: "sequence",
        role: 1,
        labels: ["Coin", "Lock", "Bolt", "Chip"],
        code: [0, 3, 1, 2, 1, 3],
        map: ["###########", "#A.#...#.B#", "#.........#", "###..G..###", "###########"],
        hint: "The lookout reads the six-symbol vault combination. The hacker enters it one symbol at a time.",
      },
      {
        mode: "mirrors",
        map: [
          "###########",
          "#....../.G#",
          "#..#.#....#",
          "#A./.#....#",
          "#....#....#",
          "#B./.../..#",
          "###########",
        ],
        hint: "Slip the beam under the vault wall, climb the far column, and turn right into the sensor.",
      },
      {
        mode: "pads",
        map: [
          "###########",
          "#A..#b...##",
          "##..#.#...#",
          "#.....###.#",
          "#.###.....#",
          "#...a#...B#",
          "###########",
        ],
        hint: "Cross the security aisles and hold both extraction pads together to cash out.",
      },
    ],
  },
];
