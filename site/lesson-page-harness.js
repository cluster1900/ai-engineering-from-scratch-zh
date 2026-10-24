// Test harness: loads parseMd and its helpers out of lesson.html into a sandbox
// so node tests exercise the real zh lesson renderer.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const NAMES = ['parseMd', 'inlineFormat', 'inlineEmphasisAndLinks', 'escapeHtml', 'escapeAttr', 'slugify',
  'renderCodeBlock', 'highlightSyntax', 'splitTableRow'];

function functionSource(html, name) {
  const start = html.indexOf('function ' + name + '(');
  if (start < 0) return '';
  let depth = 0;
  for (let i = html.indexOf('{', start); i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error('unbalanced function ' + name);
}

function loadLessonRenderer() {
  const html = fs.readFileSync(path.join(__dirname, 'lesson.html'), 'utf8');
  const sandbox = { window: {}, module: {} };
  sandbox.self = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'lesson-math.js'), 'utf8'), sandbox);
  const src = NAMES.map(n => functionSource(html, n)).join('\n');
  // lesson.html's escapeHtml goes through the DOM; node has none, so use the
  // same text-node escaping without it.
  const domFree = "escapeHtml = function (str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };";
  vm.runInContext(src + '\n' + domFree + '\nwindow.parseMd = parseMd;', sandbox);
  return sandbox.window.parseMd;
}

module.exports = { loadLessonRenderer };
