import { spawn } from 'node:child_process';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const run = (label, args) => {
  const child = spawn(npmCmd, args, { stdio: 'inherit' });
  child.on('exit', (code, signal) => {
    if (signal) {
      // eslint-disable-next-line no-console
      console.log(`[dev:all] ${label} exited (signal ${signal})`);
      return;
    }
    // eslint-disable-next-line no-console
    console.log(`[dev:all] ${label} exited (code ${code ?? 0})`);
  });
  return child;
};

const web = run('web', ['run', 'dev']);
const api = run('api', ['run', 'dev:server']);

const stopAll = (exitCode = 0) => {
  for (const child of [web, api]) {
    if (!child?.killed) {
      child.kill('SIGTERM');
    }
  }
  process.exit(exitCode);
};

for (const child of [web, api]) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      stopAll(code);
    }
  });
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

