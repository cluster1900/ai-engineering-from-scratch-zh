/* figures-nlp2.js — Phase 5（NLP foundations 到 advanced）的交互式课程图示。
   在 lesson-figures.js 之后加载，使用共享 LF toolkit，并通过 LF.register 注册。
   无依赖，仅 ES5，通过 CSS vars 使用主题。编写方式与 docs/en.md 中的
   fenced ```figure block 相同。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl, slider = LF.slider, clamp = LF.clamp, fmtInt = LF.fmtInt;

  function shell(host, label, hint, grid, outKids, cap) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [hint])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, outKids)]),
      el('div', { class: 'lf-cap' }, [cap])
    ]));
  }

  function svgText(x, y, str, anchor, fill, size) {
    return svgEl('text', { x: x, y: y, 'text-anchor': anchor || 'start', 'font-size': size || '10', 'font-family': 'monospace', fill: fill || 'var(--ink-soft,#555)' }, [document.createTextNode(str)]);
  }

  // ── bow-tfidf：原始 term frequency vs tf-idf = tf · log(N/df) ───────────────
  function bowTfidf(host) {
    var state = { term: 0 };
    // 三个短文档，固定计数。N = 3 个文档。
    var docs = [
      { name: 'doc1', tf: { the: 4, cat: 2, sat: 1, mat: 1 } },
      { name: 'doc2', tf: { the: 3, dog: 2, ran: 1 } },
      { name: 'doc3', tf: { the: 5, cat: 1, fox: 2 } }
    ];
    var terms = ['the', 'cat', 'sat', 'mat', 'dog', 'ran', 'fox'];
    var N = docs.length;
    function df(t) { var c = 0, i; for (i = 0; i < docs.length; i++) { if (docs[i].tf[t]) { c++; } } return c; }
    var rows = el('div', {});
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var t = terms[clamp(Math.round(state.term), 0, terms.length - 1)];
      var dft = df(t);
      var idf = Math.log(N / dft);
      while (rows.firstChild) { rows.removeChild(rows.firstChild); }
      var maxW = 0, i;
      for (i = 0; i < docs.length; i++) { var w = (docs[i].tf[t] || 0) * idf; if (w > maxW) { maxW = w; } }
      maxW = Math.max(maxW, 0.001);
      docs.forEach(function (d) {
        var tf = d.tf[t] || 0;
        var w = tf * idf;
        var bar = el('i'); bar.style.width = (w / maxW * 100).toFixed(1) + '%';
        if (w <= 0.0001) { bar.style.background = 'var(--rule-soft,#ccc)'; }
        rows.appendChild(el('div', { class: 'lf-ctrl' }, [
          el('label', {}, [d.name + '  tf=' + tf, el('b', {}, [w.toFixed(3)])]),
          el('div', { class: 'lf-bar' }, [bar])
        ]));
      });
      meta.textContent = '"' + t + '" 出现在 ' + dft + ' / ' + N + ' 个文档中  ·  ' + (dft === N ? '出现在每个文档中：idf 为 0，权重坍缩' : dft === 1 ? '稀有：高 idf 提升它的权重' : 'idf ' + idf.toFixed(3));
      formula.textContent = 'tf-idf = tf · log(N / df) = tf · log(' + N + ' / ' + dft + ') = tf · ' + idf.toFixed(3);
    };
    var sel = LF.select(state, 'term', 'term', terms.map(function (t, i) { return [t, i]; }));
    var orig = state._render;
    state._render = function () { state.term = Number(state.term); orig(); };
    var grid = el('div', {}, [sel]);
    shell(host, 'BAG OF WORDS / TF-IDF', '选择一个 term', grid, [rows, meta, formula],
      'Bag of Words 统计原始频率，所以 "the" 看起来在所有地方都很重要。TF-IDF 会把每个计数乘以 log(N 除以 document-frequency)：出现在每个文档中的词 idf 为零，权重会坍缩；而只出现在一个文档中的词会获得高 idf 并上升。稀有且有区分度的词会胜出。');
    state._render();
  }

  // ── rnn-unroll：h_t = tanh(W h_{t-1} + U x_t)，作为 cell 链展开 ───────────
  function rnnUnroll(host) {
    var state = { len: 5 };
    var W = 520, H = 200;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var Wh = 0.6, Ux = 0.5, xs = [1.0, -0.5, 0.8, 0.2, -0.3, 0.6, -0.1, 0.4];
    state._render = function () {
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      var n = clamp(Math.round(state.len), 1, 8);
      var step = (W - 60) / n, cy = 96, cw = Math.min(48, step - 16), ch = 40;
      var h = 0, i;
      for (i = 0; i < n; i++) {
        var cx = 30 + i * step + (step - cw) / 2;
        var ccx = cx + cw / 2;
        h = Math.tanh(Wh * h + Ux * xs[i]);
        if (i > 0) {
          var prevCx = 30 + (i - 1) * step + (step - cw) / 2 + cw;
          svg.appendChild(svgEl('line', { x1: prevCx.toFixed(1), y1: (cy + ch / 2).toFixed(1), x2: cx.toFixed(1), y2: (cy + ch / 2).toFixed(1), stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.6' }));
        }
        svg.appendChild(svgEl('rect', { x: cx.toFixed(1), y: cy.toFixed(1), width: cw.toFixed(1), height: ch.toFixed(1), rx: '3', fill: 'var(--bg-surface,#eee)', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
        svg.appendChild(svgText(ccx.toFixed(1), (cy + ch / 2 + 4).toFixed(1), 'h' + i, 'middle', 'var(--ink-soft,#555)', '11'));
        svg.appendChild(svgText(ccx.toFixed(1), (cy - 22).toFixed(1), 'x' + i, 'middle', 'var(--ink-mute,#777)', '10'));
        svg.appendChild(svgEl('line', { x1: ccx.toFixed(1), y1: (cy - 16).toFixed(1), x2: ccx.toFixed(1), y2: cy.toFixed(1), stroke: 'var(--ink-mute,#999)', 'stroke-width': '1' }));
        svg.appendChild(svgText(ccx.toFixed(1), (cy + ch + 16).toFixed(1), h.toFixed(2), 'middle', 'var(--blueprint,#3553ff)', '9'));
      }
      meta.textContent = 'sequence length ' + n + '  ·  state 从左向右传递  ·  final h' + (n - 1) + ' = ' + h.toFixed(3);
      formula.textContent = 'h_t = tanh(W · h_{t-1} + U · x_t)   ·   W = ' + Wh + ', U = ' + Ux + '  (每一步使用相同 weights)';
    };
    var grid = el('div', {}, [slider(state, 'len', 'sequence length', 1, 8, 1)]);
    shell(host, 'RNN UNROLLED', '拖动长度', grid, [svg, meta, formula],
      'Recurrent network 是在每个 time step 应用同一个 cell，并共享相同 weights。沿时间展开后，它会变成一条链：每个 cell 用 tanh 将新输入折叠进前一个 hidden state，然后把结果向前传递。最终 state 已经看过整个序列，这也是长序列会让 Gradient 很难向后传回的原因。');
    state._render();
  }

  // ── lstm-gates：forget 擦除，input 写入，output 暴露 cell state ──
  function lstmGates(host) {
    var state = { f: 0.7, i: 0.5, o: 0.8 };
    var W = 520, H = 180;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var cPrev = 1.0, cand = 0.8; // 上一个 cell state，candidate value
    function bar(x, y, w, val, vmax, color, label) {
      var hh = Math.abs(val) / vmax * 60;
      svg.appendChild(svgEl('rect', { x: x.toFixed(1), y: (y - hh).toFixed(1), width: w.toFixed(1), height: hh.toFixed(1), fill: color, 'fill-opacity': '0.75' }));
      svg.appendChild(svgEl('line', { x1: x.toFixed(1), y1: y.toFixed(1), x2: (x + w).toFixed(1), y2: y.toFixed(1), stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
      svg.appendChild(svgText((x + w / 2).toFixed(1), (y + 16).toFixed(1), label, 'middle', 'var(--ink-mute,#777)', '9'));
      svg.appendChild(svgText((x + w / 2).toFixed(1), (y - hh - 4).toFixed(1), val.toFixed(2), 'middle', 'var(--ink-soft,#555)', '9'));
    }
    state._render = function () {
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      var kept = state.f * cPrev;
      var written = state.i * cand;
      var cNew = kept + written;
      var hOut = state.o * Math.tanh(cNew);
      var baseY = 120, bw = 70, gap = 24, x0 = 36, vmax = 2.0;
      bar(x0, baseY, bw, cPrev, vmax, 'var(--ink-mute,#999)', 'c_{t-1}');
      bar(x0 + (bw + gap), baseY, bw, kept, vmax, 'var(--warn,#b8870f)', 'f·c (保留)');
      bar(x0 + 2 * (bw + gap), baseY, bw, written, vmax, 'var(--blueprint,#3553ff)', 'i·g (写入)');
      bar(x0 + 3 * (bw + gap), baseY, bw, cNew, vmax, 'var(--blueprint,#3553ff)', 'c_t');
      bar(x0 + 4 * (bw + gap), baseY, bw, hOut, vmax, 'var(--blueprint,#3553ff)', 'h_t = o·tanh');
      meta.textContent = 'forget 保留旧 state 的 ' + (state.f * 100).toFixed(0) + '%  ·  input 写入 candidate 的 ' + (state.i * 100).toFixed(0) + '%  ·  output 暴露 ' + (state.o * 100).toFixed(0) + '%';
      formula.textContent = 'c_t = f · c_{t-1} + i · g  =  ' + state.f.toFixed(2) + '·' + cPrev.toFixed(1) + ' + ' + state.i.toFixed(2) + '·' + cand.toFixed(1) + ' = ' + cNew.toFixed(2) + '   ·   h_t = o · tanh(c_t)';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'f', 'forget gate f', 0, 1, 0.02),
      slider(state, 'i', 'input gate i', 0, 1, 0.02),
      slider(state, 'o', 'output gate o', 0, 1, 0.02)
    ]);
    shell(host, 'LSTM GATES', '拖动 gates', grid, [svg, meta, formula],
      'LSTM cell state 是由 gates 编辑的记忆。forget gate 擦除旧 state 的一部分，input gate 写入新 candidate 的一部分，两者相加形成下一个 cell state。随后 output gate 控制这个 state 有多少作为 hidden Vector 泄露出去。接近零或一的 gates 能让 cell 在许多步骤中保持一个值，而不会让 Gradient vanish。');
    state._render();
  }

  // ── seq2seq-alignment：encoder-decoder Attention，行求和为 1 ─────────────
  function seq2seqAlignment(host) {
    var state = { sharp: 1.0 };
    var src = ['the', 'red', 'house', '.'];
    var tgt = ['la', 'maison', 'rouge', '.'];
    // 基础 alignment logits：target row -> source columns。包含重排。
    var base = [
      [2.0, 0.2, 0.4, 0.1],
      [0.3, 0.5, 2.2, 0.1],
      [0.2, 2.1, 0.5, 0.1],
      [0.1, 0.1, 0.2, 2.4]
    ];
    var W = 520, H = 240, PAD = 70;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var n = src.length;
    var CELL = (W - PAD - 14) / n;
    state._render = function () {
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      var s = Math.max(0.1, state.sharp), r, c;
      for (r = 0; r < n; r++) {
        var row = base[r].map(function (z) { return Math.exp(z * s); });
        var sum = row.reduce(function (a, b) { return a + b; }, 0);
        var probs = row.map(function (e) { return e / sum; });
        for (c = 0; c < n; c++) {
          var x = PAD + c * CELL, y = 30 + r * CELL;
          svg.appendChild(svgEl('rect', { x: x.toFixed(1), y: y.toFixed(1), width: (CELL - 2).toFixed(1), height: (CELL - 2).toFixed(1), fill: 'var(--blueprint,#3553ff)', 'fill-opacity': probs[c].toFixed(3), stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '0.5' }));
        }
        svg.appendChild(svgText((PAD - 6).toFixed(1), (30 + r * CELL + CELL / 2).toFixed(1), tgt[r], 'end', 'var(--ink-soft,#555)', '10'));
      }
      for (c = 0; c < n; c++) {
        svg.appendChild(svgText((PAD + c * CELL + CELL / 2).toFixed(1), '24', src[c], 'middle', 'var(--ink-mute,#777)', '10'));
      }
      meta.textContent = 'rows = target tokens, columns = source tokens  ·  每一行都通过 softmax 归一到 1  ·  非对角 cells 显示重排';
      formula.textContent = 'context_t = Σ_s align[t][s] · encoder_s   ·   align = 对每个 target token 在 source 上做 softmax';
    };
    var grid = el('div', {}, [slider(state, 'sharp', 'alignment sharpness', 0.2, 3.0, 0.05)]);
    shell(host, 'SEQ2SEQ ALIGNMENT', '拖动 sharpness', grid, [svg, meta, formula],
      'Attention 为 decoder 提供 source 上的软 alignment。每个 target token 读取每个 encoder state 的加权混合，并且这些 weights 在 source row 上 softmax 到一。这里 "maison" 关注 "house"，"rouge" 关注 "red"，所以非对角 cells 揭示了翻译所需的重排。更尖锐的 weights 会选择一个 source word；更平坦的 weights 会混合多个。');
    state._render();
  }

  // ── edit-distance：Levenshtein DP Matrix、最小编辑路径、距离读数 ───
  function editDistance(host) {
    var pairs = [['kitten', 'sitting'], ['flaw', 'lawn'], ['sunday', 'saturday'], ['book', 'back']];
    var state = { pair: 0 };
    var W = 520, H = 250;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      var pr = pairs[clamp(Math.round(state.pair), 0, pairs.length - 1)];
      var a = pr[0], b = pr[1], m = a.length, n = b.length;
      var D = [], i, j;
      for (i = 0; i <= m; i++) { D.push([]); for (j = 0; j <= n; j++) { D[i].push(0); } }
      for (i = 0; i <= m; i++) { D[i][0] = i; }
      for (j = 0; j <= n; j++) { D[0][j] = j; }
      for (i = 1; i <= m; i++) {
        for (j = 1; j <= n; j++) {
          var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
          D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + cost);
        }
      }
      // 回溯最小编辑路径。
      var path = {}; i = m; j = n;
      while (i > 0 || j > 0) {
        path[i + ',' + j] = 1;
        if (i > 0 && j > 0) {
          var cst = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
          if (D[i][j] === D[i - 1][j - 1] + cst) { i--; j--; continue; }
        }
        if (i > 0 && D[i][j] === D[i - 1][j] + 1) { i--; continue; }
        j--;
      }
      path['0,0'] = 1;
      var ox = 70, oy = 56, cell = Math.min(46, (W - ox - 12) / (n + 1), (H - oy - 12) / (m + 1));
      for (j = 0; j <= n; j++) { if (j > 0) { svg.appendChild(svgText((ox + j * cell + cell / 2).toFixed(1), (oy - cell / 2 + 4).toFixed(1), b.charAt(j - 1), 'middle', 'var(--ink-mute,#777)', '11')); } }
      for (i = 0; i <= m; i++) { if (i > 0) { svg.appendChild(svgText((ox - cell / 2).toFixed(1), (oy + i * cell + cell / 2 + 4).toFixed(1), a.charAt(i - 1), 'middle', 'var(--ink-mute,#777)', '11')); } }
      for (i = 0; i <= m; i++) {
        for (j = 0; j <= n; j++) {
          var on = path[i + ',' + j];
          svg.appendChild(svgEl('rect', { x: (ox + j * cell).toFixed(1), y: (oy + i * cell).toFixed(1), width: (cell - 1.5).toFixed(1), height: (cell - 1.5).toFixed(1), fill: on ? 'var(--blueprint,#3553ff)' : 'var(--bg-surface,#eee)', 'fill-opacity': on ? '0.5' : '0.4', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '0.5' }));
          svg.appendChild(svgText((ox + j * cell + cell / 2).toFixed(1), (oy + i * cell + cell / 2 + 4).toFixed(1), String(D[i][j]), 'middle', on ? 'var(--blueprint,#3553ff)' : 'var(--ink-soft,#555)', '10'));
        }
      }
      num.innerHTML = D[m][n] + ' <small>次编辑</small>';
      meta.textContent = '"' + a + '" → "' + b + '"  ·  高亮 cells 是最小编辑路径  ·  右下角是距离';
      formula.textContent = 'D[i][j] = min( D[i-1][j]+1 del, D[i][j-1]+1 ins, D[i-1][j-1]+[a≠b] sub )';
    };
    var sel = LF.select(state, 'pair', '字符串对', pairs.map(function (p, i) { return [p[0] + ' → ' + p[1], i]; }));
    var orig = state._render;
    state._render = function () { state.pair = Number(state.pair); orig(); };
    var grid = el('div', {}, [sel]);
    shell(host, 'EDIT DISTANCE', '选择一组字符串', grid, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula],
      'Levenshtein distance 会填充一张表，其中每个 cell 都表示用 insert、delete 和 substitute 将一个 prefix 变成另一个 prefix 的最低成本。每个 cell 都取三个邻居中的最小值，所以右下角就是整段字符串的距离。回溯这些选择可以恢复实际编辑路径，拼写检查器和翻译指标正是这样对齐文本的。');
    state._render();
  }

  // ── ngram-backoff：更高 n 捕获更多上下文，但计数更稀疏 ────────
  function ngramBackoff(host) {
    var state = { n: 2 };
    // 玩具语料的 Token 数和词表；观测到的 n-grams 会随 n 增大而减少。
    var tokens = 100000, vocab = 5000;
    var num = el('span', { class: 'lf-num' });
    var bar = el('i');
    var barWrap = el('div', { class: 'lf-bar' }, [bar]);
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function human(x) { var u = ['', 'K', 'M', 'B', 'T'], i = 0; while (x >= 1000 && i < u.length - 1) { x /= 1000; i++; } return x.toFixed(x < 10 ? 1 : 0) + u[i]; }
    state._render = function () {
      var n = clamp(Math.round(state.n), 1, 5);
      var possible = Math.pow(vocab, n);
      // 实际见过的不同 n-grams 受语料长度约束，并会饱和。
      var observed = Math.min(tokens - n + 1, possible);
      var coverage = observed / possible;
      num.innerHTML = (coverage * 100 < 0.001 ? coverage.toExponential(1) : (coverage * 100).toFixed(coverage * 100 < 1 ? 4 : 1) + '%') + ' <small>的 n-grams 被见过</small>';
      bar.style.width = Math.max(1, Math.min(100, coverage * 100)).toFixed(2) + '%';
      barWrap.classList.toggle('over', coverage < 0.001);
      meta.textContent = n + '-gram：' + human(observed) + ' 个已观测，' + human(possible) + ' 个可能  ·  ' + (n >= 4 ? '严重稀疏：大多数上下文从未见过，需要 back off 到更低的 n' : n === 1 ? 'unigram：没有上下文，但每个计数都密集' : '更多上下文，更少计数');
      formula.textContent = 'P(w | history of n-1) 需要 length-n grams 的计数  ·  V^n = ' + vocab + '^' + n + ' = ' + human(possible) + ' 种可能';
    };
    var grid = el('div', {}, [slider(state, 'n', 'n (gram order)', 1, 5, 1)]);
    shell(host, 'N-GRAM SPARSITY', '拖动 n', grid, [num, barWrap, meta, formula],
      'n-gram model 根据前 n-1 个词预测下一个词。提高 n 可以捕获更多上下文，但可能的 grams 数量是词表大小的 n 次方，所以语料实际观测到的比例会向零坍缩。大多数长上下文从未出现过，这就是为什么高阶模型必须 smooth 未见过的 grams，并 back off 到更短、更密集的 grams。');
    state._render();
  }

  // ── ner-bio-tagging：每个 Token 的 BIO tags，拖动哪个 span 是 entity ──────
  function nerBioTagging(host) {
    var toks = ['Barack', 'Obama', 'visited', 'New', 'York', 'last', 'week'];
    // 候选 entity spans：[startIndex, length, type]
    var spans = [
      [0, 2, 'PER'],
      [3, 2, 'LOC'],
      [0, 1, 'PER']
    ];
    var state = { span: 0 };
    var W = 520, H = 130;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      var sp = spans[clamp(Math.round(state.span), 0, spans.length - 1)];
      var start = sp[0], len = sp[1], type = sp[2];
      var n = toks.length, bw = (W - 30) / n, x0 = 15, tags = [];
      var i;
      for (i = 0; i < n; i++) {
        var tag = 'O';
        if (i === start) { tag = 'B-' + type; }
        else if (i > start && i < start + len) { tag = 'I-' + type; }
        tags.push(tag);
        var inside = tag !== 'O';
        var x = x0 + i * bw;
        svg.appendChild(svgEl('rect', { x: (x + 3).toFixed(1), y: '34', width: (bw - 6).toFixed(1), height: '34', rx: '3', fill: inside ? 'var(--blueprint,#3553ff)' : 'var(--bg-surface,#eee)', 'fill-opacity': inside ? (tag.charAt(0) === 'B' ? '0.8' : '0.5') : '0.4', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
        svg.appendChild(svgText((x + bw / 2).toFixed(1), '55', toks[i], 'middle', 'var(--ink-soft,#555)', '10'));
        svg.appendChild(svgText((x + bw / 2).toFixed(1), '88', tag, 'middle', inside ? 'var(--blueprint,#3553ff)' : 'var(--ink-mute,#777)', '9'));
      }
      meta.textContent = 'entity span "' + toks.slice(start, start + len).join(' ') + '" 被标注为 ' + type + '  ·  B = begin, I = inside, O = outside';
      formula.textContent = 'BIO：entity 的第一个 Token 获得 B-TYPE，后续 Token 获得 I-TYPE，其余都是 O';
    };
    var sel = LF.select(state, 'span', 'entity span', spans.map(function (s, i) { return [toks.slice(s[0], s[0] + s[1]).join(' ') + ' (' + s[2] + ')', i]; }));
    var orig = state._render;
    state._render = function () { state.span = Number(state.span); orig(); };
    var grid = el('div', {}, [sel]);
    shell(host, 'NER BIO TAGGING', '选择 entity', grid, [svg, meta, formula],
      'Named-entity recognition 被表述为逐 Token tagging。BIO scheme 用 B-TYPE 标记 entity 的第一个 Token，用 I-TYPE 标记每个后续 Token，并用 O 标记所有其他 Token。这样 sequence labeler 就能表达多词 entity 和精确边界："New York" 会变成 B-LOC 然后 I-LOC，不同于两个独立的单词地点。');
    state._render();
  }

  // ── sentiment-logits：求和后的词权重 → logit → sigmoid → probability ───
  function sentimentLogits(host) {
    var words = ['great', 'not', 'terrible', 'okay'];
    var state = { w0: 1.6, w1: -0.4, w2: -1.8, w3: 0.2, bias: 0.0 };
    var keys = ['w0', 'w1', 'w2', 'w3'];
    var W = 520, H = 120;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      var logit = state.bias, i;
      for (i = 0; i < keys.length; i++) { logit += state[keys[i]]; }
      var prob = 1 / (1 + Math.exp(-logit));
      var bw = (W - 30) / words.length, x0 = 15, vmax = 2.0, baseY = 70;
      for (i = 0; i < words.length; i++) {
        var v = state[keys[i]];
        var hh = Math.abs(v) / vmax * 40;
        var x = x0 + i * bw;
        var up = v >= 0;
        svg.appendChild(svgEl('rect', { x: (x + bw / 2 - 14).toFixed(1), y: (up ? baseY - hh : baseY).toFixed(1), width: '28', height: hh.toFixed(1), fill: up ? 'var(--blueprint,#3553ff)' : 'var(--warn,#b8870f)', 'fill-opacity': '0.75' }));
        svg.appendChild(svgEl('line', { x1: x.toFixed(1), y1: baseY.toFixed(1), x2: (x + bw).toFixed(1), y2: baseY.toFixed(1), stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '0.5' }));
        svg.appendChild(svgText((x + bw / 2).toFixed(1), (baseY + 18).toFixed(1), words[i], 'middle', 'var(--ink-soft,#555)', '10'));
        svg.appendChild(svgText((x + bw / 2).toFixed(1), (up ? baseY - hh - 4 : baseY + hh + 28).toFixed(1), v.toFixed(2), 'middle', 'var(--ink-mute,#777)', '9'));
      }
      num.innerHTML = (prob * 100).toFixed(1) + '% <small>positive</small>';
      meta.textContent = '求和后的 logit ' + logit.toFixed(2) + '  ·  sigmoid → ' + (prob >= 0.5 ? 'positive' : 'negative') + '  ·  蓝色提升，橙色降低';
      formula.textContent = 'logit = bias + Σ wᵢ = ' + logit.toFixed(2) + '   ·   P(positive) = σ(logit) = 1 / (1 + e^−logit)';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'w0', '"great" weight', -2, 2, 0.05),
      slider(state, 'w1', '"not" weight', -2, 2, 0.05),
      slider(state, 'w2', '"terrible" weight', -2, 2, 0.05),
      slider(state, 'w3', '"okay" weight', -2, 2, 0.05),
      slider(state, 'bias', 'bias', -2, 2, 0.05)
    ]);
    shell(host, 'SENTIMENT LOGITS', '拖动词权重', grid, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula],
      '线性文本 classifier 会用学到的 weight 为每个词打分，将它们与 bias 相加得到一个 logit，然后通过 sigmoid 压缩为 probability。正权重把结果推向 positive sentiment，负权重则拉向相反方向。决策在 probability 为二分之一时翻转，也就是求和后的 logit 穿过零的位置。');
    state._render();
  }

  LF.register({
    'bow-tfidf': bowTfidf,
    'rnn-unroll': rnnUnroll,
    'lstm-gates': lstmGates,
    'seq2seq-alignment': seq2seqAlignment,
    'edit-distance': editDistance,
    'ngram-backoff': ngramBackoff,
    'ner-bio-tagging': nerBioTagging,
    'sentiment-logits': sentimentLogits
  });
})();
