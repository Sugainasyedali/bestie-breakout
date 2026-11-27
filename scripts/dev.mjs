import {existsSync} from "node:fs";
if(existsSync(".env"))process.loadEnvFile(".env");
import { spawn } from "node:child_process";
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Start both services with npm run dev.");
const run = (args, env) =>
  spawn(process.execPath, [npmCli, ...args], {
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: false,
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
