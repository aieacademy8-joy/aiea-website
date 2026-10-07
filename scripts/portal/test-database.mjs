// Runs ONLY an in-memory database. There is no URL, project link, or network client.
import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

// The checked-in inventory is reviewed separately from the SQL. Do not derive
// expected assertions from the same file at runtime: deletion would then pass.
function validateInventory(actual, expected) {
  if (!Array.isArray(expected) || !expected.length ||
      expected.some(label => typeof label !== 'string' || !label.trim()) ||
      new Set(expected).size !== expected.length) throw new Error('Invalid expected assertion inventory');
  if (new Set(actual).size !== actual.length) throw new Error('Duplicate executed assertion');
  const missing = expected.filter(label => !actual.includes(label));
  const unexpected = actual.filter(label => !expected.includes(label));
  if (missing.length || unexpected.length) throw new Error(
    `Assertion inventory mismatch: missing=${JSON.stringify(missing)} unexpected=${JSON.stringify(unexpected)}`);
}

if (process.argv[2] === '--self-test') {
  assert.doesNotThrow(() => validateInventory(['a', 'b'], ['a', 'b']));
  assert.throws(() => validateInventory(['a'], ['a', 'b']), /inventory mismatch/);
  assert.throws(() => validateInventory(['a', 'c'], ['a', 'b']), /inventory mismatch/);
  assert.throws(() => validateInventory(['a', 'a'], ['a', 'b']), /Duplicate/);
  assert.throws(() => validateInventory(['a', 'b', 'c'], ['a', 'b']), /inventory mismatch/);
  assert.throws(() => validateInventory([], []), /Invalid expected/);
  assert.throws(() => validateInventory(['a'], ['a', 'a']), /Invalid expected/);
  console.log('PASS 7 runner inventory self-tests (missing, replaced, duplicate, extra, empty and invalid inventory)');
} else {

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const runtime = process.argv[2];
if (!runtime) throw new Error('Usage: node scripts/portal/test-database.mjs /absolute/path/to/@electric-sql/pglite/dist/index.js');
const { PGlite } = await import(pathToFileURL(resolve(runtime)).href);
const db = new PGlite();
const executed = [];
try {
  const expected = JSON.parse(await readFile(resolve(root, 'supabase/tests/assertions.json'), 'utf8'));
  await db.exec(await readFile(resolve(root, 'supabase/tests/bootstrap.pglite.sql'), 'utf8'));
  for (const name of (await readdir(resolve(root, 'supabase/migrations'))).filter(n => n.endsWith('.sql')).sort()) {
    await db.exec(await readFile(resolve(root, 'supabase/migrations', name), 'utf8'));
    console.log(`PASS migration ${name}`);
  }
  console.log((await db.query('select version()')).rows[0].version);
  const results = await db.exec(await readFile(resolve(root, 'supabase/tests/foundation.sql'), 'utf8'));
  for (const result of results) for (const row of result.rows ?? []) {
    if (typeof row.result === 'string' && row.result.startsWith('PASS ')) {
      executed.push(row.result.slice(5));
      console.log(row.result);
    }
  }
  validateInventory(executed, expected);
  console.log(`PASS ${executed.length} database assertions; exact named inventory matched; synthetic auth/JWT claims only; Supabase integration remains unverified`);
} catch (error) {
  console.error('FAIL', error.message, error.code ?? '', error.where ?? '');
  process.exitCode = 1;
} finally {
  await db.close();
}
}
