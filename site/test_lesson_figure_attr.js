const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'lesson.html'), 'utf8');

// Browser escapeHtml (textContent -> innerHTML) escapes only &, < and >.
function browserEscapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function figureMarkup(raw) {
  const line = html.split('\n').find((l) => l.includes('class="lesson-figure" data-figure="'));
  assert.ok(line, 'lesson.html has no figure block renderer');
  const attrSrc = html.match(/function escapeAttr\(str\) \{[\s\S]*?\n\s*\}/);
  assert.ok(attrSrc, 'lesson.html has no escapeAttr');
  const ctx = { raw, out: '', escapeHtml: browserEscapeHtml };
  vm.runInNewContext(attrSrc[0] + '\n' + line.trim(), ctx);
  return ctx.out;
}

// Minimal HTML attribute reader: a double-quoted value ends at the first ".
function readAttr(markup, name) {
  const m = markup.match(new RegExp('\\s' + name + '="([^"]*)"'));
  assert.ok(m, `no ${name} attribute in ${markup}`);
  return m[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

test('a figure block with a JSON argument keeps the full value in data-figure', () => {
  const raw = 'iso-machine {"machine":"self-attention"}\n';
  const markup = figureMarkup(raw);
  const value = readAttr(markup, 'data-figure');
  assert.equal(value, raw.trim());
  const json = value.slice(value.indexOf(' ') + 1);
  assert.deepEqual(JSON.parse(json), { machine: 'self-attention' });
  assert.match(markup, /^<div class="lesson-figure" data-figure="[^"]*"><\/div>$/);
});

test('a figure block with quotes, ampersands and angle brackets round-trips', () => {
  const raw = `iso-machine {"label":"a & b <c> 'd'"}`;
  assert.equal(readAttr(figureMarkup(raw), 'data-figure'), raw);
});

test('a plain figure id still renders unchanged', () => {
  assert.equal(readAttr(figureMarkup('attention-matrix\n'), 'data-figure'), 'attention-matrix');
});
