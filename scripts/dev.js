const { spawn } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

const processes = [];

const run = (name, command, args, cwd) => {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
    }
  });

  processes.push(child);
  return child;
};

run("backend", "npm", ["run", "dev"], path.join(rootDir, "backend"));
run("frontend", "npm", ["run", "dev"], path.join(rootDir, "frontend"));

const shutdown = () => {
  for (const child of processes) {
    if (!child.killed) {
      child.kill();
    }
  }
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
