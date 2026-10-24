// Lesson math helpers (port of upstream d014a5405 #598 for the zh renderer).
// Lesson docs write inline math as $...$ and display math as ```math fences
// or $$ blocks. Money and shell dollars stay text; \$ is a literal dollar.
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AIFS_LessonMath = api;
})(typeof self !== 'undefined' ? self : this, function () {
  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escapeInline(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function isSpace(ch) {
    return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\u00a0';
  }

  function isWordChar(ch) {
    return /[A-Za-z0-9_]/.test(ch);
  }

  function closingDollar(text, start) {
    for (var j = start; j < text.length; j++) {
      var ch = text.charAt(j);
      if (ch === '\\') {
        j++;
        continue;
      }
      if (ch !== '$') continue;
      if (j > start && !isSpace(text.charAt(j - 1)) && !isWordChar(text.charAt(j + 1))) return j;
      return -1;
    }
    return -1;
  }

  function splitInlineMath(text) {
    var parts = [];
    var plain = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (ch === '\\' && text.charAt(i + 1) === '$') {
        plain += '$';
        i++;
        continue;
      }
      if (ch === '$' && text.charAt(i + 1) === '$') {
        plain += '$$';
        i++;
        continue;
      }
      if (ch === '$' && i + 1 < text.length && !isSpace(text.charAt(i + 1)) && !isWordChar(text.charAt(i - 1))) {
        var end = closingDollar(text, i + 1);
        if (end > 0) {
          if (plain) parts.push({ text: plain });
          plain = '';
          parts.push({ math: text.slice(i + 1, end) });
          i = end;
          continue;
        }
      }
      plain += ch;
    }
    if (plain) parts.push({ text: plain });
    return parts;
  }

  function mathBlock(tex) {
    return '<div class="math-display" data-math="display">' + escapeHtml(tex.trim()) + '</div>';
  }

  // Returns null, { tex } for a one-line $$...$$, or { open: true } for a lone $$.
  function matchDisplayMath(line) {
    var m = line.match(/^\s*\$\$(.*?)(\$\$)?\s*$/);
    if (!m) return null;
    if (m[2]) return m[1].trim() ? { tex: m[1] } : null;
    return m[1].trim() ? null : { open: true };
  }

  // Formats one line of inline markdown. Code spans and math are kept out of
  // escaping and emphasis; `format` receives escaped text and returns HTML.
  function formatInline(text, format) {
    var kept = [];
    function keep(html) {
      kept.push(html);
      return '\u0000' + (kept.length - 1) + '\u0000';
    }
    text = text.replace(/`([^`]+)`/g, function (m, code) {
      return keep('<code>' + escapeInline(code) + '</code>');
    });
    text = splitInlineMath(text).map(function (part) {
      if (part.math == null) return part.text;
      return keep('<span class="math-inline" data-math="inline">' + escapeHtml(part.math) + '</span>');
    }).join('');
    text = escapeInline(text);
    if (format) text = format(text);
    return text.replace(/\u0000(\d+)\u0000/g, function (m, index) { return kept[Number(index)]; });
  }

  function extractMath(md) {
    var found = [];
    var lines = md.split(/\r?\n/);
    var inCode = false;
    var mathFence = [];
    var mathStart = 0;
    var block = null;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (block) {
        if (line.trim() === '$$') {
          found.push({ display: true, tex: block.join('\n').trim(), line: i + 1 });
          block = null;
        } else {
          block.push(line);
        }
        continue;
      }
      var fence = line.match(/^```(\w*)/);
      if (fence) {
        if (inCode === 'math') found.push({ display: true, tex: mathFence.join('\n').trim(), line: mathStart });
        if (inCode) {
          inCode = false;
        } else {
          inCode = fence[1] || 'code';
          mathFence = [];
          mathStart = i + 1;
        }
        continue;
      }
      if (inCode === 'math') {
        mathFence.push(line);
        continue;
      }
      if (inCode) continue;
      if (line.trim() === '$$') {
        block = [];
        continue;
      }
      var single = line.match(/^\s*\$\$(.+?)\$\$\s*$/);
      if (single) {
        found.push({ display: true, tex: single[1].trim(), line: i + 1 });
        continue;
      }
      var masked = line.replace(/`[^`]+`/g, function (m) { return new Array(m.length + 1).join(' '); });
      splitInlineMath(masked).forEach(function (part) {
        if (part.math != null) found.push({ display: false, tex: part.math, line: i + 1 });
      });
    }
    return found;
  }

  return {
    splitInlineMath: splitInlineMath,
    extractMath: extractMath,
    mathBlock: mathBlock,
    matchDisplayMath: matchDisplayMath,
    formatInline: formatInline
  };
});
