import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const target = resolve(__dirname, '../apps/web/node_modules/@enscribe/enscribe/dist/naming.js');

const original = `import { randomUUID } from "crypto";`;
const patched = `const randomUUID = () => globalThis.crypto.randomUUID();`;

import { existsSync } from 'fs';
if (!existsSync(target)) {
  console.log('patch-enscribe: target not found, skipping');
  process.exit(0);
}
const content = readFileSync(target, 'utf8');
if (content.includes(original)) {
  writeFileSync(target, content.replace(original, patched));
  console.log('patched @enscribe/enscribe: replaced Node crypto import');
} else if (content.includes(patched)) {
  console.log('@enscribe/enscribe already patched');
} else {
  console.warn('patch-enscribe: unexpected naming.js content — skipping');
}
