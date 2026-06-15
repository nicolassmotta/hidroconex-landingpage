import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "cmd.exe" : "npm";
const npmArgs = isWindows ? ["/c", "npm.cmd", "run", "dev:web"] : ["run", "dev:web"];

const processes = [
  spawn("node", ["server/server.js"], {
    stdio: "inherit",
    shell: false,
  }),
  spawn(npmCommand, npmArgs, {
    stdio: "inherit",
    shell: false,
  }),
];

function shutdown(signal) {
  for (const childProcess of processes) {
    if (!childProcess.killed) {
      childProcess.kill(signal);
    }
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

for (const childProcess of processes) {
  childProcess.on("exit", (code) => {
    if (code && code !== 0) {
      shutdown("SIGTERM");
      process.exit(code);
    }
  });
}
