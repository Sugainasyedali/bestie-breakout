import type { Challenge } from "./engine.js";

const toppings = ["Basil", "Tomato", "Olive", "Cheese"];

export const levels: Challenge[] = [
  {
    title: "Delivery Dash",
    objective: "Deliver to the alley apartment and the rooftop café using your partner’s street map.",
    limit: 115,
    stages: [
      {
        mode: "route",
        role: 0,
        hint: "The dispatcher has the map. Guide the courier around the closed storefronts to the apartment.",
        map: [
          "#############",
          "#A..#..~#..G#",
          "###.#.###.#.#",
          "#...#.....#.#",
          "#B#...###...#",
          "#############",
        ],
      },
      {
        mode: "route",
        role: 1,
        hint: "Swap the map and the delivery bag. The rooftop café is beyond the central staircase.",
        map: [
          "#############",
          "#B....#....G#",
          "#.###.#.###.#",
          "#.##....#...#",
          "#A...##...#.#",
          "#############",
        ],
      },
    ],
  },
  {
    title: "Topping Towers",
    objective: "Build two stacked specialty pizzas, layer by layer, from the reader’s recipe.",
    limit: 90,
    stages: [
      {
        mode: "sequence",
        role: 0,
        labels: toppings,
        code: [1, 3, 0, 2],
        hint: "Read the garden tower from the base up. The cook adds each topping in that exact order.",
        map: [
          "###########",
          "#A..#..a..#",
          "#.........#",
          "#..b..#..B#",
          "###########",
        ],
      },
      {
        mode: "sequence",
        role: 1,
        labels: toppings,
        code: [3, 1, 2, 3, 0, 1],
        hint: "Trade recipe cards for the double-decker. Some layers repeat, so call every ingredient.",
        map: [
          "###########",
          "#B#..b..#A#",
          "#.........#",
          "#..#a.#...#",
          "###########",
        ],
      },
    ],
  },
  {
    title: "Food Truck Fix",
    objective: "Find the spare motor, deliver it to the truck, and reconnect the starter parts.",
    limit: 135,
    stages: [
      {
        mode: "route",
        role: 1,
        hint: "The mechanic has the yard plan. Guide the parts runner through the salvage aisles to the spare motor.",
        map: [
          "#############",
          "#B...#.....G#",
          "#.##.###.##.#",
          "#..#.....#..#",
          "#A...###...##",
          "#############",
        ],
      },
      {
        mode: "cargo",
        hint: "One mechanic braces the motor. The other pushes it along the service lane; brace again before each push.",
        map: [
          "#############",
          "#..###....#.#",
          "#A..........#",
          "#..C......G.#",
          "#B..........#",
          "#..#.....##.#",
          "#############",
        ],
      },
      {
        mode: "sequence",
        labels: ["Coupler", "Belt", "Valve", "Igniter"],
        code: [0, 1, 2, 3],
        hint: "Read out the service card and install the starter train in assembly order.",
        map: [
          "###########",
          "#A...#..a.#",
          "#..#...#..#",
          "#.b..#...B#",
          "###########",
        ],
      },
    ],
  },
  {
    title: "Order Up!",
    objective: "Clear three customer tickets in order before the lunch bell.",
    limit: 112,
    stages: [
      {
        mode: "sequence",
        role: 0,
        labels: toppings,
        code: [1, 3, 0],
        hint: "Table one ordered a garden slice. The ticket reader calls the toppings in order.",
        map: ["#########", "#A.....B#", "#..#.#..#", "#a.....b#", "#########"],
      },
      {
        mode: "sequence",
        role: 1,
        labels: toppings,
        code: [2, 3, 2, 1],
        hint: "Swap stations for table two. Confirm each repeat before adding it.",
        map: ["#########", "#B.#...A#", "#.......#", "#a...#.b#", "#########"],
      },
      {
        mode: "rhythm",
        labels: toppings,
        code: [3, 0, 1, 3, 2],
        hint: "Take turns finishing the final ticket. Call the handoff after each topping.",
        map: ["#########", "#A..#..B#", "#.#...#.#", "#b.....a#", "#########"],
      },
    ],
  },
  {
    title: "Grand Opening Rush",
    objective: "Receive the delivery, cook the opening-night order, and deliver it to the party.",
    limit: 150,
    stages: [
      {
        mode: "cargo",
        hint: "Brace the flour shipment for your partner, then push. Repeat until it reaches the prep counter.",
        map: [
          "#############",
          "#....##...#.#",
          "#A..........#",
          "#..C.....G..#",
          "#B..........#",
          "#.###..##...#",
          "#############",
        ],
      },
      {
        mode: "sequence",
        role: 1,
        labels: toppings,
        code: [1, 0, 2, 3, 1, 3],
        hint: "Read the head chef’s six-layer opening-night special to the cook.",
        map: ["###########", "#B..#....A#", "#..#...#..#", "#a.....#.b#", "###########"],
      },
      {
        mode: "rhythm",
        labels: ["Stretch", "Sauce", "Bake", "Box"],
        code: [0, 1, 2, 3, 0, 1, 2, 3],
        hint: "Follow the kitchen line’s illuminated work order. Alternate callers and confirm each station on the beat.",
        map: ["###########", "#A...#...B#", "#.#.....#.#", "#a...#...b#", "###########"],
      },
      {
        mode: "route",
        role: 0,
        hint: "Guide the courier through the evening crowd to the last customer at the lantern square.",
        map: [
          "#############",
          "#A...#...#.G#",
          "#.##.#.#.#..#",
          "#..#...#....#",
          "#B...#...##.#",
          "#############",
        ],
      },
    ],
  },
];
