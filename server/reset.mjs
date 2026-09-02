import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dbPath = join(dirname(fileURLToPath(import.meta.url)), 'data.sqlite');

for (const suffix of ['', '-journal', '-wal', '-shm']) {
  rmSync(`${dbPath}${suffix}`, { force: true });
}

console.log('Base local borrada. Corre `npm run server` para recrearla con datos de ejemplo.');
