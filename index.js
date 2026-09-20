// Universal startup file for Node.js hosts (cPanel, Render, Railway, Glitch, Heroku)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distServer = path.join(__dirname, 'dist', 'server.cjs');
const distIndex = path.join(__dirname, 'dist', 'index.cjs');

if (fs.existsSync(distServer)) {
  await import(distServer);
} else if (fs.existsSync(distIndex)) {
  await import(distIndex);
} else {
  await import('./server.ts');
}
