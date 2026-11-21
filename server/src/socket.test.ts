import test from "node:test";
import assert from "node:assert/strict";
import { io } from "socket.io-client";
import { makeServer } from "./index.js";
import type { AddressInfo } from "node:net";
import type { View } from "../../shared/model.js";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function until(f: () => boolean) {
  for (let i = 0; i < 250; i++) {
    if (f()) return;
    await sleep(20);
  }
  throw Error("Expected synchronized state timed out");
}
test("three independent clients exercise room lifecycle and play through first mission", async () => {
  const server = makeServer();
  await new Promise<void>((r) => server.http.listen(0, "127.0.0.1", r));
  const url = "http://127.0.0.1:" + (server.http.address() as AddressInfo).port;
  const clients = Array.from({ length: 3 }, () => io(url, { forceNew: true })),
    states: View[] = [];
  clients.forEach((c, i) => c.on("state", (v: View) => (states[i] = v)));
  const [a, b, c] = clients;
  const p = { name: "Alpha", shape: "Bunny", color: "#ff99af", avatar: "★" };
  try {
    const seat = await a.emitWithAck("create", p);
    assert.match(seat.code, /^[A-F0-9]{6}$/);
    assert.ok(
      (await b.emitWithAck("join", { code: "NOPE00", profile: p })).error,
    );
    await b.emitWithAck("join", {
      code: seat.code,
      profile: { ...p, name: "Beta" },
    });
    assert.ok(
      (await c.emitWithAck("join", { code: seat.code, profile: p })).error,
    );
    a.emit("command", "start");
    await until(() => states[0]?.players.length === 2);
    assert.equal(states[0].phase, "lobby");
    a.emit("command", "ready");
    b.emit("command", "ready");
    await until(() => states[0].players.every((p) => p.ready));
    a.emit("command", "start");
    await until(() => states[1].phase === "game");
    assert.equal(states[0].mission, states[1].mission);
    a.emit("loaded", states[0].round);
    await sleep(150);
    assert.equal(states[0].time, 90);
    assert.equal(states[0].intro, 1.8);
    b.emit("loaded", states[1].round);
    await until(() => states[0].intro === 0 && states[1].intro === 0);
    a.emit("input", { move: 1 });
    await until(() => states[0].players[0].x > 211);
    a.emit("input", { move: 0 });
    await until(() => states[1].gate);
    b.emit("input", { move: 1 });
    await until(() => states[1].players[1].x > 264);
    b.emit("input", { move: 1, jump: true });
    await until(() => states[0].players[1].x > 540);
    b.emit("action", -1);
    await until(() => states[1].relay);
    a.emit("input", { move: 1 });
    await until(() => states[0].players[0].x > 264);
    a.emit("input", { move: 1, jump: true });
    await until(
      () => states[1].phase === "results" && states[0].phase === "results",
    );
    assert.deepEqual(states[0].history, states[1].history);
    assert.ok(states[0].outro > 0);
    await until(() => states[0].outro === 0 && states[1].outro === 0);
    a.emit("command", "again");
    await until(() => states[1].phase === "game");
    assert.equal(states[1].history.length, 0);
    a.disconnect();
    await until(() => !states[1].players[0].online);
    assert.notEqual(states[1].host, seat.id);
    a.connect();
    await new Promise<void>((r) => a.once("connect", r));
    const restored = await a.emitWithAck("restore", seat);
    assert.equal(restored.id, seat.id);
    await until(() => states[1].players[0].online);
    const received = new Promise<any>((r) => b.once("message", r));
    a.emit("chat", "NICE!");
    assert.equal((await received).text, "NICE!");
  } finally {
    clients.forEach((c) => c.disconnect());
    server.close();
  }
});
