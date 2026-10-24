'use strict';
// Mutation tests for scripts/audit_cheatsheets.js: copy the repo's cheat sheets
// into a temp tree, break one thing, and check that the audit reports it.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

function tree() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-'));
  for (const part of ['cheatsheets', 'manuals', 'phases', 'projects', 'site/cheatsheet-evidence.js', 'scripts/audit_cheatsheets.js']) {
    if (fs.existsSync(path.join(ROOT, part))) fs.cpSync(path.join(ROOT, part), path.join(dir, part), { recursive: true });
  }
  return dir;
}

function run(dir) {
  try {
    return { code: 0, out: execFileSync('node', ['scripts/audit_cheatsheets.js'], { cwd: dir, encoding: 'utf8', stdio: 'pipe' }) };
  } catch (error) {
    return { code: error.status, out: `${error.stdout}${error.stderr}` };
  }
}

function firstSheet(dir) {
  return fs.readdirSync(path.join(dir, 'cheatsheets')).filter(n => n.endsWith('.md') && n !== 'AUTHORING.md').sort()[0];
}

test('the repo passes', () => {
  const r = run(ROOT);
  assert.strictEqual(r.code, 0, r.out);
});

test('a fact that is not in the from files fails', () => {
  const dir = tree();
  const file = path.join(dir, 'cheatsheets', firstSheet(dir));
  const text = fs.readFileSync(file, 'utf8');
  const mutated = text.replace(/`([A-Z][A-Z0-9]*_[A-Z0-9_]+)`/, '`$1_NOT_IN_SOURCE`');
  assert.notStrictEqual(mutated, text, 'the sheet has no CONSTANT_NAME fact to mutate');
  fs.writeFileSync(file, mutated);
  const r = run(dir);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /_NOT_IN_SOURCE" is not in its from files/);
});

test('an evidence line past the end of the file fails', () => {
  const dir = tree();
  // Pick a sheet whose evidence cites a full `path.md:line` (some use only abbreviations).
  const evDir = path.join(dir, 'cheatsheets', 'evidence');
  const name = fs.readdirSync(evDir).sort().find(n => /\.md:\d+/.test(fs.readFileSync(path.join(evDir, n), 'utf8')));
  const file = path.join(evDir, name);
  const text = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, text.replace(/(\.md):(\d+)/, '$1:999999'));
  const r = run(dir);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /is outside/);
});

test('an evidence range that ends on a blank line fails', () => {
  const dir = tree();
  const evDir = path.join(dir, 'cheatsheets', 'evidence');
  const pending = fs.readFileSync(path.join(dir, 'site', 'cheatsheet-evidence.js'), 'utf8');
  // Find a sheet that is not on the pending list and cites a full repo path, then
  // stretch that ref to end on a blank line of the cited file.
  for (const name of fs.readdirSync(evDir).sort()) {
    if (pending.includes(`'${name.replace(/\.md$/, '')}',`)) continue;
    const file = path.join(evDir, name);
    const text = fs.readFileSync(file, 'utf8');
    const match = text.match(/((?:phases|manuals)\/[A-Za-z0-9_.\-/]+\.md):(\d+)(?![\d-])/);
    if (!match) continue;
    const lines = fs.readFileSync(path.join(dir, match[1]), 'utf8').split('\n');
    const start = Number(match[2]);
    const blank = lines.findIndex((line, i) => i >= start && !line.trim()) + 1;
    if (blank <= start) continue;
    fs.writeFileSync(file, text.replace(match[0], `${match[1]}:${start}-${blank}`));
    const r = run(dir);
    assert.strictEqual(r.code, 1, r.out);
    assert.match(r.out, new RegExp(`${name}: .*ends on a blank line`));
    return;
  }
  assert.fail('no sheet outside the pending list cites a full .md path');
});

test('a translated evidence title fails', () => {
  const dir = tree();
  const file = path.join(dir, 'cheatsheets', 'evidence', firstSheet(dir));
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines[0] = lines[0].replace('# Evidence:', '# 证据：');
  fs.writeFileSync(file, lines.join('\n'));
  assert.strictEqual(run(dir).code, 1);
});

test('a broken relative link and an unclosed fence fail', () => {
  const dir = tree();
  const file = path.join(dir, 'cheatsheets', firstSheet(dir));
  fs.appendFileSync(file, '\n[x](../no-such-file.md)\n\n```bash\nopen\n');
  const r = run(dir);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /does not resolve/);
  assert.match(r.out, /never closed/);
});

test('an evidence heading that does not name its block fails', () => {
  const dir = tree();
  const file = path.join(dir, 'cheatsheets', 'evidence', firstSheet(dir));
  const text = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, text.replace(/^## .*$/m, '## 无关的标题'));
  const r = run(dir);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /no section heading contains the block title/);
});
