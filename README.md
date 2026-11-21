# Bestie Breakout

A two-player browser arcade with private guest rooms, six cooperative missions, and original artwork. Each friend uses their own browser and controls their own seat.

## Run locally

Install Node.js 22.12+ or 24 and npm. Extract the project, open a terminal in the folder containing this README, and run the following commands. PowerShell, Command Prompt, and Unix shells are supported.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The root development script starts Next.js and the persistent multiplayer service on port 4000. To run them independently, use two terminals from the project root:

```sh
npm run dev -w server
```

```sh
npm run dev -w frontend
```

Both packages also accept `npm run dev` from their own directories. The frontend proxies Socket.IO locally, so a second device on the same LAN can open the first device's LAN IP on port 3000 if the firewall permits inbound traffic.

## Play together

1. Open two independent browser windows (a private window works). Open both from the address bar so their session storage starts independently.
2. Choose **Play now** and customize each guest. Create a private room in one window and join with the six-character code in the other.
3. Both players select **Ready up**. The host starts the game.
4. Use A/D or arrow keys to move, W/Space to jump, E to use mechanisms, or the touch buttons below the canvas. The host can pause with Escape. Sound starts muted. Open the in-game settings for independent music and effects switches and volume. The fullscreen control uses the browser’s fullscreen mode when available.
5. Use the quick-chat menu for callouts, directions, fruits, and pizza ingredients. Both friends see emoji reactions. Each mission result offers host-controlled replay, progression after success, or return to lobby.

| Mission | How to win |
| --- | --- |
| Button Disaster | Hold the switch, jump the obstacle, cross the gate, and activate the relay beside the flag. Both players reach the exit. |
| Don’t Drop It! | Stay beside the crate and move together. Coordinate jumps over each bumper. |
| Blind Maze | The scout reads the gold path and sends directions. The runner enters each step. |
| Memory Panic | The reader shares the sequence. The operator enters three increasingly long codes. |
| Trust Issues | Toggle the bridge for the runner. Roles reverse at the far flag. Both must finish. |
| Pizza Panic | Pick ingredients into shared stock. The chef adds them in order and serves before closing. One correct order clears the mission. |

## Checks and production builds

```sh
npm test
npm run check -w frontend
npm run build
```

The gameplay tests exercise all six rulesets. A real Socket.IO integration test uses three independent connections, handles invalid and full rooms, moves both players through the pressure gate, compares authoritative results, replays, restores a disconnected host, and exchanges chat.

Run the compiled apps in separate terminals with `npm start -w server` and `npm start -w frontend`.

## Deploy separately

Keep the npm workspace together in one repository so both deploys can load shared TypeScript contracts.

- **Render or another persistent Node host** — select the repository root. Build with `npm ci --include=dev && npm run build -w server`. Start with `npm start -w server`. Use a single instance, set the health check to `/health`, and use the platform-provided PORT. Set CLIENT_ORIGIN to the exact public frontend origin. Multiple allowed origins can be comma-separated.
- **Vercel** — import the same repository, choose the Next.js preset, and set the project root to `frontend`. Enable access to files outside the root directory for the shared contracts. Set NEXT_PUBLIC_SERVER_URL to the public HTTPS origin of the Node service before building. Use the default Next.js build. This public URL contains no credentials.
- The frontend example environment file can be copied to `frontend/.env.local`. Set server variables in the process environment or hosting dashboard. The backend example lists the supported settings.

## Multiplayer protocol

The Express/Socket.IO server owns membership, readiness, pause state, positions, timers, correct answers, scores, and results. Clients send intent. They never report their own position, score, or win. The 40 Hz server simulation sends room snapshots roughly 13 times per second while playing. Phaser interpolates movement between snapshots. HTTP long-polling supports the local same-origin proxy and separate service origins.

| Client event | Purpose |
| --- | --- |
| create, join | Validate the profile and reserve one of two seats. Acknowledgment includes the room code, player ID, and private reconnect token. |
| restore | Restore a disconnected seat using its token. |
| command | Ready, start, pause/resume, replay, next, lobby, or leave. Lifecycle transitions validate host and phase. |
| input, action | Submit direction/jump and contextual puzzle actions. Roles and interactions are checked server-side. |
| chat | Send a predefined callout or emoji to room members. |

The server emits individual `state` snapshots and `message` events. Reader-only sequences and scout-only maze routes are filtered per seat. Reconnect tokens are never broadcast. A disconnected player's simulation stops, their seat is reserved for two minutes, and a connected partner inherits host controls. Rejoining restores the seat. Explicit departure or expiry returns the remaining player to the lobby. Empty rooms are discarded.

## Source map and limitations

- `frontend/app` contains the React menus, session UI, Phaser canvas, sound, and styles. Original mission postcards and hero art live under `frontend/public/art`.
- `server/src/game.ts` is the authoritative simulation. `server/src/index.ts` owns room transport and lifecycle. The shared types are independent of both render and transport code.
- Rooms and scores exist in memory. Restarting the Node service clears sessions. Persistent profiles could be added by saving completed results to a database in the finish path. The current release supports exactly two players per room.
- Phaser fills the browser viewport and keeps puzzle coordinates consistent across clients. Portrait platforming uses a camera that follows the local player. The mission clock waits for both renderers to load and the shared introduction to finish. The game supports touch controls and preset chat. Voice calls are external. Temporary network interruptions pause play for both participants.

## 3.0 cloud setup and verification status

Copy the root .env.example to .env. Supply the existing Neon database, authentication, private profile bucket and optional realtime settings. Generate separate secrets of at least 32 characters for NEON_AUTH_COOKIE_SECRET and GAME_TICKET_SECRET. Run npm run db:setup using the direct database connection. Runtime queries use DATABASE_URL_POOLED. The root development launcher passes .env to both services.

Configure Neon Auth allowed origins and password-reset callback URLs. Configure storage CORS for your frontend origin. Use a persistent SAVE_QUEUE_DIR volume on the game server so queued saves survive restarts. On separate hosting, configure server-only secrets in each service's environment settings.

The added levels use cooperative tactical board puzzles with stage-specific controls. The original six missions retain their original gameplay. Accounts have profile editing, avatar upload, settings, achievements, cosmetic selection, recent sessions and public leaderboard opt-in.

Verification still pending for live Neon authentication, storage, realtime and cloud persistence because credentials were unavailable in the development workspace. Equipped cosmetics render on the characters. Saved audio, reduced-motion and control preferences load when entering gameplay. Account statistics subscribe to the optional sealed realtime query. Account deletion includes a password and explicit confirmation form. Treat this branch as an integration preview until those checks and integrations are completed.
