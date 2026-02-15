import { spawn } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const parseDotEnvPort = () => {
  try {
    if (!fs.existsSync('.env')) {
      return null;
    }
    const raw = fs.readFileSync('.env', 'utf8');
    const lines = raw.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      if (key !== 'PORT') continue;
      let value = trimmed.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      const port = Number(value);
      return Number.isFinite(port) ? port : null;
    }
  } catch {
    return null;
  }
  return null;
};

const isPortFree = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', (err) => {
      if (err?.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }
      resolve(false);
    });
    server.listen({ port }, () => {
      server.close(() => resolve(true));
    });
  });

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

const apiPort = Number(process.env.PORT) || parseDotEnvPort() || 5174;
let api = null;
isPortFree(apiPort).then((free) => {
  if (!free) {
    // eslint-disable-next-line no-console
    console.log(`[dev:all] api port ${apiPort} is already in use; skipping api start (assuming it's already running)`);
    return;
  }
  api = run('api', ['run', 'dev:server']);
});

const stopAll = (exitCode = 0) => {
  for (const child of [web, api].filter(Boolean)) {
    if (!child?.killed) {
      child.kill('SIGTERM');
    }
  }
  process.exit(exitCode);
};

for (const child of [web, api].filter(Boolean)) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      stopAll(code);
    }
  });
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));
