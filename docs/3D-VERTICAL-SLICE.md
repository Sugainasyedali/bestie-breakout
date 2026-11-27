# Bestie Breakout 4.0: first-level vertical slice

The active implementation is **The Locked Village Gate**, a separate 3D mode in the existing lobby. Ready both players, then the host selects **Play 3D village**. The classic campaign remains available during development; it has not been presented as 36 converted 3D levels.

The requested 4.0 destination is 36 levels across six new worlds. The user explicitly requires testing the first 3D level in two browser clients before expanding that campaign. That browser acceptance gate is still pending: the managed preview relay fails to start. Do not mark the complete 4.0 specification finished or expand the campaign before that gate passes.

## Implemented

- React Three Fiber / Three.js canvas, separate environment, character, camera, controls and HUD modules.
- Two original GLB assets with skinned meshes and 14 skeletal animation clips, crossfaded by state rather than restarted with every snapshot. Generated art is **provisional**, not finished professional character art. Existing character IDs select Pip/Fern, profile color tints clothing, equipped rewards have a simple accessory representation.
- Rapier on the authoritative Node server: capsule character controllers, slopes, autostep, ground snapping, gravity, grounded jumping, acceleration, friction, ladder traversal, falling and respawn. Rendering follows server snapshots; local movement prediction is not implemented yet.
- Camera-relative 3D movement, sprint, jump, object interaction and grounded drop. Mouse/touch drag rotates the third-person camera, wheel adjusts distance, obstacle ray intersections shorten the camera arm. Teammate labels, distance and compass text help locate the other player.
- Orchard route, tower route, pressure plate lowering the ladder, latch securing it, two individually owned keys, item carrying and drops, two gate locks, both-player exit check. Shared checkpoint activates when both players meet at the village marker.
- Fixed 40 Hz simulation, ~13 Hz snapshots, 20 Hz client intent. Finite bounded inputs, monotonic sequence numbers, round checks, short input timeout, authoritative proximity/ownership checks, host-only lifecycle, disconnect freeze and reconnection retain the same world.
- Full-viewport HUD, browser fullscreen request, quick chat and character reactions, keyboard rebinding, virtual joystick, swapping touch-control sides, three graphics presets and low-quality suggestion on devices reporting <=4 logical cores.
- Versioned attempt persistence through existing save queue and PostgreSQL tables. Migration 002 records content versions without deleting level IDs or old progress. Both authenticated participants use the same existing save transaction. Level 1 v4 and classic level 1 share accumulated legacy progression; attempts record their different content versions. World-map reorganization awaits the campaign rollout.

## Play the village

1. Player 1 (orchard): go around the low orchard wall, collect the golden key with E, then hold the purple plate near the tower.
2. Player 2 (tower): approach the lowered ladder and press E. Hold W to climb, walk to the purple latch, and press E to secure the ladder.
3. Player 2 collects the blue key upstairs. Return to the ladder, press E and hold S to descend.
4. Both cross the central river bridge. Press E near your matching lock by the northern gate.
5. Once both keys are delivered, walk through the gate and meet in the exit circle.

WASD move, Shift sprints, Space jumps, E interacts, F drops when grounded, Tab shows objectives, Escape opens settings (host also pauses). Drag to rotate the camera; scroll to zoom. Touch movement and actions appear on coarse-pointer devices. Both renderer-ready messages are required before the initial countdown advances.

## Validation

Run `npm ci`, `npm run db:setup`, `npm test`, and `npm run build`. Build original assets with `node scripts/build-adventurers.mjs`.

Tests use the actual Rapier world to walk legal routes, climb, collect and deliver keys, reject wrong-player collection, test gravity and closed gates, and complete only with both players. A Socket.IO test plays the full level using two separate connections and tests pause, disconnect, resume and shared results. PGlite tests exercise idempotent migration and save transactions for two authenticated profile records while retaining prior classic progress. These are not substitutes for the required two-browser graphics and input test or live Neon verification.

## Remaining acceptance and later milestones

- Two real browser clients: WebGL/GLB appearance, interaction feel, camera clipping, fullscreen, mobile sizes and performance. No browser screenshots or performance numbers have been claimed.
- Live Neon authentication, storage, real-time subscriptions and persistence verification.
- Production character art and animation review, supported skin/hair/outfit customization, additional action animations.
- Client prediction/latency tuning, more flexible touch layout, teammate picture-in-picture if useful.
- Reusable crates, elevators, counterweights, boats, paddling, swimming, bridges, ziplines and other later-level mechanics.
- Distinct new world environments and all remaining 35 authored 3D levels, with safe migration of classic campaign presentation.
- VFX, richer audio, animation polish and performance profiling on actual mobile hardware.

No external models, music or Pepelo assets were downloaded. Reference research used Tafusoft's public product description for cooperation and accessibility principles only.
