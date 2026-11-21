import { spawn } from "node:child_process";
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const run = (args, env) =>
  spawn(npm, args, {
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: process.platform === "win32",
  });
const backend = run(["run", "dev", "-w", "server"], { PORT: "4000" });
const frontend = run(
  [
    "run",
    "dev",
    "-w",
    "frontend",
    "--",
    ...process.argv
      .slice(2)
      .filter((a) => a !== "--strictPort")
      .map((a) => (a === "--host" ? "--hostname" : a)),
  ],
  {},
);
function stop() {
  frontend.kill();
  backend.kill();
}
process.once("SIGTERM", stop);
process.once("SIGINT", stop);
frontend.once("exit", () => backend.kill());
