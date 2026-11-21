export const missions = [
  [
    "Button Disaster",
    "Stand on the pink pad while your friend crosses. Press E at the relay beyond the gate to let both friends escape.",
    "Switches",
    "Switchyard",
  ],
  [
    "Don’t Drop It!",
    "Flank the crate, then walk right together. Jump over the bumpers together to keep your cargo level.",
    "Coordination",
    "Cargo run",
  ],
  [
    "Blind Maze",
    "The scout can see the safe route. Guide the runner using the direction buttons before time runs out.",
    "Navigation",
    "Fog garden",
  ],
  [
    "Memory Panic",
    "The reader sees the code. Tell the operator which fruit buttons to press across three rounds.",
    "Memory",
    "Signal station",
  ],
  [
    "Trust Issues",
    "The operator holds the bridge open while the runner crosses. Swap jobs at the flag, then meet at the exit.",
    "Trust",
    "Cloud crossing",
  ],
  [
    "Pizza Panic",
    "The picker sends ingredients. The chef adds them in recipe order and serves. Finish as many as you can before closing!",
    "Teamwork",
    "Pizza kitchen",
  ],
] as const;
export const fruit = ["Cherry", "Lemon", "Mint", "Berry"];
export const toppings = ["Cheese", "Tomato", "Mushroom", "Olive"];
export const directions = ["Up", "Right", "Down", "Left"];
export const chats = [
  "HELP ME!",
  "WAIT FOR ME!",
  "WHAT ARE YOU DOING?",
  "RUNNN!",
  "NICE!",
  "OOPS!",
  "TRUST ME!",
  "NOOOO!",
  "WE DID IT!",
  "I HAVE NO IDEA!",
  ...directions,
  ...fruit,
  ...toppings,
];
export type Profile = {
  name: string;
  color: string;
  shape: string;
  avatar: string;
};
export type Player = Profile & {
  id: string;
  online: boolean;
  ready: boolean;
  x: number;
  y: number;
  vy: number;
  ground: boolean;
  dir: number;
};
export type Result = {
  mission: number;
  win: boolean;
  seconds: number;
  mistakes: number;
  correct: number;
  score: number;
  stars: number;
  title: string;
};
export type View = {
  code: string;
  host: string;
  players: Player[];
  phase: "lobby" | "game" | "results";
  mission: number;
  paused: boolean;
  time: number;
  progress: number;
  mistakes: number;
  correct: number;
  keyTaken: boolean;
  gate: boolean;
  relay: boolean;
  box: number;
  bridge: boolean;
  runner: number;
  recipe: number[];
  tray: number[];
  stock: number[];
  sequence: number[];
  maze: number[];
  cell: number;
  history: Result[];
};
export type Input = { move: number; jump: boolean };
export type Ack = (r: {
  error?: string;
  id?: string;
  token?: string;
  code?: string;
}) => void;
export interface ClientEvents {
  create: (p: Profile, a: Ack) => void;
  join: (p: { code: string; profile: Profile }, a: Ack) => void;
  restore: (p: { code: string; token: string }, a: Ack) => void;
  command: (s: string) => void;
  input: (p: Input) => void;
  action: (n: number) => void;
  chat: (s: string) => void;
}
export interface ServerEvents {
  state: (v: View) => void;
  message: (p: { id: string; text: string }) => void;
  notice: (s: string) => void;
}

// Both the authoritative simulation and the renderer use the mission clock.
export const bridgeCenter = (remaining: number) =>
  398 + Math.sin((100 - remaining) * 1.45) * 53;
