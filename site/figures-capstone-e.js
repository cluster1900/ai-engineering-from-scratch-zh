(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }

  var el = LF.el, svgEl = LF.svgEl;
  var INK = 'var(--ink,#1a1a1a)', SOFT = 'var(--ink-soft,#555)', MUTE = 'var(--ink-mute,#777)';
  var BP = 'var(--blueprint,#3553ff)', BG = 'var(--bg,#fafaf5)', SURF = 'var(--bg-surface,#eee)';
  var RULE = 'var(--rule-soft,#ddd)', WARN = 'var(--warn,#b8870f)';
  var EASE = '0.23 1 0.32 1';

  function anim(attr, vals, dur, extra) {
    var a = { attributeName: attr, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animate', a);
  }
  function animT(type, vals, dur, extra) {
    var a = { attributeName: 'transform', type: type, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animateTransform', a);
  }
  function card(host, label, hint, svg, caption) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [hint])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out' }, [svg])]),
      el('div', { class: 'lf-cap' }, [caption])
    ]));
  }
  function txt(x, y, s, fill, size, anchor) {
    return svgEl('text', {
      x: x, y: y, fill: fill || SOFT, 'font-size': size || 11,
      'font-family': 'var(--font-mono,monospace)', 'text-anchor': anchor || 'middle'
    }, [svgEl('tspan', {}, [document.createTextNode(s)])]);
  }
  // 单次入场：以 (cx, cy) 为中心从 95% 尺寸淡入，使用强 ease-out
  function entry(g, cx, cy, begin) {
    var dx = (cx * 0.05).toFixed(1), dy = (cy * 0.05).toFixed(1);
    var e = { dur: '0.8s', begin: begin, fill: 'freeze', calcMode: 'spline', keySplines: EASE, keyTimes: '0;1' };
    g.setAttribute('opacity', '0');
    g.appendChild(animT('translate', dx + ' ' + dy + ';0 0', '0.8s', { begin: begin, fill: 'freeze', calcMode: 'spline', keySplines: EASE, keyTimes: '0;1', additive: 'sum', repeatCount: '1' }));
    g.appendChild(animT('scale', '0.95;1', '0.8s', { begin: begin, fill: 'freeze', calcMode: 'spline', keySplines: EASE, keyTimes: '0;1', additive: 'sum', repeatCount: '1' }));
    g.appendChild(anim('opacity', '0;1', '0.8s', { begin: begin, fill: 'freeze', calcMode: 'spline', keySplines: EASE, keyTimes: '0;1', repeatCount: '1' }));
  }

  // ── 01：带 hooks 和截断机制的 plan / act / observe / recover 回路 ───
  function ceAgentLoop(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' });
    var track = 'M130 70 L330 70 A20 20 0 0 1 350 90 L350 160 A20 20 0 0 1 330 180 L130 180 A20 20 0 0 1 110 160 L110 90 A20 20 0 0 1 130 70 Z';
    svg.appendChild(svgEl('path', { d: track, fill: 'none', stroke: RULE, 'stroke-width': '1.5', 'stroke-dasharray': '3 4' }));
    var stations = [['规划', 110, 70, '0s'], ['行动', 350, 70, '1.1s'], ['观察', 350, 180, '2.5s'], ['恢复', 110, 180, '3.6s']];
    var i;
    for (i = 0; i < stations.length; i++) {
      var st = stations[i];
      var g = svgEl('g', {});
      g.appendChild(svgEl('rect', { x: st[1] - 32, y: st[2] - 13, width: 64, height: 26, rx: 5, fill: BG, stroke: BP, 'stroke-width': '1.6' }));
      g.appendChild(txt(st[1], st[2] + 4, st[0], INK, 10));
      g.appendChild(anim('opacity', '0.45;1;0.45;0.45', '5s', { begin: st[3], keyTimes: '0;0.08;0.2;1' }));
      svg.appendChild(g);
    }
    // Tool 调用经过边界时触发的 hook 标记
    svg.appendChild(txt(230, 52, 'PreToolUse', MUTE, 8));
    var pin1 = svgEl('circle', { cx: 230, cy: 70, r: 4, fill: BP });
    pin1.appendChild(anim('opacity', '0.25;1;0.25;0.25', '5s', { begin: '0.55s', keyTimes: '0;0.06;0.14;1' }));
    svg.appendChild(pin1);
    svg.appendChild(txt(230, 200, 'PostToolUse', MUTE, 8));
    var pin2 = svgEl('circle', { cx: 230, cy: 180, r: 4, fill: BP });
    pin2.appendChild(anim('opacity', '0.25;1;0.25;0.25', '5s', { begin: '3.0s', keyTimes: '0;0.06;0.14;1' }));
    svg.appendChild(pin2);
    // 一圈代表一个 turn
    var token = svgEl('circle', { r: 5, fill: WARN });
    token.appendChild(svgEl('animateMotion', { dur: '5s', repeatCount: 'indefinite', path: track }));
    svg.appendChild(token);
    svg.appendChild(txt(230, 118, 'turn 47 / 50', SOFT, 11));
    svg.appendChild(svgEl('rect', { x: 180, y: 130, width: 100, height: 6, rx: 3, fill: SURF }));
    var budget = svgEl('rect', { x: 180, y: 130, width: 10, height: 6, rx: 3, fill: BP });
    budget.appendChild(anim('width', '10;94', '5s'));
    svg.appendChild(budget);
    // 体积过大的 observation 在重新进入 Context 前被截断
    svg.appendChild(txt(296, 218, 'observe:', MUTE, 8, 'end'));
    var obs = svgEl('rect', { x: 300, y: 208, width: 6, height: 12, rx: 2, fill: SURF, stroke: RULE, 'stroke-width': '1' });
    obs.appendChild(anim('width', '6;150;150;26;26', '5s', { keyTimes: '0;0.3;0.55;0.62;1' }));
    svg.appendChild(obs);
    var cut = svgEl('line', { x1: 326, y1: 204, x2: 326, y2: 224, stroke: WARN, 'stroke-width': '2' });
    cut.appendChild(anim('opacity', '0;0;1;1', '5s', { keyTimes: '0;0.55;0.62;1' }));
    svg.appendChild(cut);
    svg.appendChild(txt(390, 240, '8MB stdout，重新进入前已截断', MUTE, 8));
    card(host, 'AGENT TURN 回路', '一圈 = 一个 turn',
      svg,
      'harness 运行一个由规划、行动、观察和恢复组成的回路，每跑一圈都会消耗 50-turn 预算中的一个 turn。每次 Tool 调用经过边界时都会触发 PreToolUse 和 PostToolUse hooks；体积过大的 observation（例如 8MB 的 ripgrep 输出）会在重新进入 Context window 前被截断。');
  }

  // ── 02：dense 与 BM25 并行执行，union 合并结果，re-ranker 重新排序 ────
  function ceHybridRetrieval(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    svg.appendChild(svgEl('rect', { x: 20, y: 103, width: 64, height: 34, rx: 5, fill: BG, stroke: BP, 'stroke-width': '2' }));
    svg.appendChild(txt(52, 124, 'query', INK, 10));
    svg.appendChild(svgEl('rect', { x: 130, y: 46, width: 96, height: 34, rx: 5, fill: BG, stroke: BP, 'stroke-width': '1.6' }));
    svg.appendChild(txt(178, 67, 'dense (hnsw)', SOFT, 9));
    svg.appendChild(svgEl('rect', { x: 130, y: 160, width: 96, height: 34, rx: 5, fill: BG, stroke: WARN, 'stroke-width': '1.6' }));
    svg.appendChild(txt(178, 181, 'bm25 (terms)', SOFT, 9));
    var up = svgEl('path', { d: 'M84 112 C110 112,104 63,130 63', fill: 'none', stroke: BP, 'stroke-width': '1.5', 'stroke-dasharray': '5 4' });
    up.appendChild(anim('stroke-dashoffset', '18;0', '1s'));
    svg.appendChild(up);
    var dn = svgEl('path', { d: 'M84 128 C110 128,104 177,130 177', fill: 'none', stroke: WARN, 'stroke-width': '1.5', 'stroke-dasharray': '5 4' });
    dn.appendChild(anim('stroke-dashoffset', '18;0', '1s', { begin: '0.2s' }));
    svg.appendChild(dn);
    // 候选结果从两个索引流入 union
    var routes = [['M226 63 C252 63,256 112,280 114', BP, '0s'], ['M226 63 C252 63,256 112,280 114', BP, '1s'],
      ['M226 177 C252 177,256 128,280 126', WARN, '0.5s'], ['M226 177 C252 177,256 128,280 126', WARN, '1.5s']];
    var i;
    for (i = 0; i < routes.length; i++) {
      var d = svgEl('circle', { r: 4, fill: routes[i][1], opacity: '0.85' });
      d.appendChild(svgEl('animateMotion', { dur: '2s', repeatCount: 'indefinite', path: routes[i][0], begin: routes[i][2] }));
      svg.appendChild(d);
    }
    svg.appendChild(svgEl('rect', { x: 280, y: 100, width: 58, height: 40, rx: 5, fill: BP, opacity: '0.1', stroke: BP, 'stroke-width': '1.8' }));
    svg.appendChild(txt(309, 118, 'union', BP, 10));
    svg.appendChild(txt(309, 132, 'top-k', SOFT, 8));
    var mid = svgEl('line', { x1: 338, y1: 120, x2: 366, y2: 120, stroke: BP, 'stroke-width': '2', 'stroke-dasharray': '5 4' });
    mid.appendChild(anim('stroke-dashoffset', '18;0', '1s'));
    svg.appendChild(mid);
    svg.appendChild(txt(432, 46, 'cross-encoder rerank', MUTE, 9));
    svg.appendChild(svgEl('rect', { x: 366, y: 54, width: 132, height: 150, rx: 6, fill: 'none', stroke: RULE, 'stroke-width': '1.4', 'stroke-dasharray': '4 4' }));
    // 合并后的顺序为 a、b、c；re-ranker 将 c 提升到首位
    var chips = [['chunk a  0.31', 70, '0 0;0 0;0 32;0 32', RULE, SOFT],
      ['chunk b  0.58', 102, '0 0;0 0;0 32;0 32', RULE, SOFT],
      ['chunk c  0.87', 134, '0 0;0 0;0 -64;0 -64', BP, BP]];
    for (i = 0; i < chips.length; i++) {
      var c = chips[i];
      var cg = svgEl('g', {});
      cg.appendChild(svgEl('rect', { x: 378, y: c[1], width: 108, height: 22, rx: 4, fill: c[3] === BP ? BP : BG, 'fill-opacity': c[3] === BP ? '0.12' : '1', stroke: c[3], 'stroke-width': c[3] === BP ? '2' : '1.3' }));
      cg.appendChild(txt(432, c[1] + 15, c[0], c[4], 9));
      cg.appendChild(animT('translate', c[2], '5s', { calcMode: 'spline', keySplines: EASE + ';' + EASE + ';' + EASE, keyTimes: '0;0.35;0.55;1' }));
      svg.appendChild(cg);
    }
    var cite = txt(432, 224, '答案引用最高排名 chunk 的 file:line', SOFT, 9);
    cite.appendChild(anim('opacity', '0.25;0.25;1;1', '5s', { keyTimes: '0;0.5;0.65;1' }));
    svg.appendChild(cite);
    card(host, 'HYBRID RETRIEVAL', 'dense + bm25 - rerank',
      svg,
      'query 会同时触发两种搜索：对 Embedding 执行 dense nearest-neighbor 搜索，以及对 terms 执行 sparse BM25 搜索。两者的 union 被送入 cross-encoder，由它重新排列列表；仅靠 BM25 时会被埋没的 chunk 因此升至首位。synthesizer 必须引用最终保留内容的 file 和 line。');
  }

  // ── 03：将 streaming voice pipeline 展示为低于 800ms 的 latency waterfall ────────
  function ceVoiceLatency(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    var rows = [['mic 输入', 54], ['asr partial', 86], ['turn 检测', 118], ['llm tokens', 150], ['tts 输出', 182]];
    var i;
    for (i = 0; i < rows.length; i++) svg.appendChild(txt(62, rows[i][1] + 12, rows[i][0], MUTE, 8, 'end'));
    // 每个阶段都在上一阶段结束前启动：采用 pipeline，而非顺序执行
    var bars = [[78, 54, 200, SURF, '0;0.015;0.333;0.93;1', MUTE],
      [104, 86, 202, BP, '0;0.053;0.373;0.93;1', ''],
      [305, 118, 34, BP, '0;0.373;0.427;0.93;1', ''],
      [339, 150, 76, BP, '0;0.427;0.547;0.93;1', ''],
      [398, 182, 50, BP, '0;0.52;0.6;0.93;1', '']];
    for (i = 0; i < bars.length; i++) {
      var b = bars[i];
      var r = svgEl('rect', { x: b[0], y: b[1], width: 0, height: 16, rx: 3, fill: b[3], opacity: i === 0 ? '1' : String(0.35 + i * 0.16), stroke: b[5] || 'none', 'stroke-width': '1' });
      r.appendChild(anim('width', '0;0;' + b[2] + ';' + b[2] + ';0', '6s', { keyTimes: b[4] }));
      svg.appendChild(r);
    }
    svg.appendChild(svgEl('line', { x1: 70, y1: 214, x2: 490, y2: 214, stroke: RULE, 'stroke-width': '1' }));
    svg.appendChild(txt(70, 228, '0', MUTE, 8));
    svg.appendChild(txt(238, 228, '400ms', MUTE, 8));
    svg.appendChild(svgEl('line', { x1: 406, y1: 42, x2: 406, y2: 214, stroke: WARN, 'stroke-width': '1.5', 'stroke-dasharray': '5 4' }));
    svg.appendChild(txt(410, 40, '800ms 预算', WARN, 8, 'start'));
    svg.appendChild(svgEl('line', { x1: 398, y1: 202, x2: 398, y2: 214, stroke: BP, 'stroke-width': '2' }));
    svg.appendChild(txt(370, 228, '首段音频 780ms', SOFT, 8));
    // barge-in：用户再次说话，tts 在话语中途取消
    var burst = svgEl('rect', { x: 448, y: 54, width: 0, height: 16, rx: 3, fill: WARN, opacity: '0.85' });
    burst.appendChild(anim('width', '0;0;42;42;0', '6s', { keyTimes: '0;0.6;0.667;0.93;1' }));
    svg.appendChild(burst);
    svg.appendChild(txt(468, 48, 'barge-in', WARN, 7));
    var cut = svgEl('line', { x1: 448, y1: 178, x2: 448, y2: 202, stroke: WARN, 'stroke-width': '2' });
    cut.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: '0;0.6;0.62;0.93;1' }));
    svg.appendChild(cut);
    var canc = txt(452, 178, '已取消', WARN, 7, 'start');
    canc.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: '0;0.6;0.64;0.93;1' }));
    svg.appendChild(canc);
    card(host, 'VOICE LATENCY WATERFALL', '采用 pipeline，而非顺序执行',
      svg,
      '每个阶段都会在结束前将流传入下一阶段：用户仍在说话时，ASR 已经发出 partials；turn detector 会根据结束信号触发；TTS 则在 800ms 首段音频预算内启动。当用户在 900ms 时 barge-in，TTS 会立即取消，ASR 随即重新接管。');
  }

  // ── 04：late interaction，每个 query Token 选择得分最高的 patch ─────
  function ceLateInteraction(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 260' });
    svg.appendChild(txt(266, 44, '以 patch 网格表示的 pdf 页面', MUTE, 9));
    svg.appendChild(svgEl('rect', { x: 193, y: 53, width: 146, height: 146, rx: 4, fill: 'none', stroke: RULE, 'stroke-width': '1.4' }));
    var gx, gy;
    for (gy = 0; gy < 4; gy++) for (gx = 0; gx < 4; gx++) {
      svg.appendChild(svgEl('rect', { x: 200 + gx * 34, y: 60 + gy * 34, width: 30, height: 30, rx: 2, fill: SURF, stroke: RULE, 'stroke-width': '1', opacity: '0.85' }));
    }
    svg.appendChild(txt(62, 52, 'query Tokens', MUTE, 9));
    var chips = [['q: net', 64], ['q: margin', 116], ['q: 2024', 168]];
    var i;
    for (i = 0; i < chips.length; i++) {
      svg.appendChild(svgEl('rect', { x: 30, y: chips[i][1], width: 64, height: 22, rx: 4, fill: BG, stroke: BP, 'stroke-width': '1.5' }));
      svg.appendChild(txt(62, chips[i][1] + 15, chips[i][0], SOFT, 9));
    }
    // 每个 Token 都会为每个 patch 评分；锥形区域表示完整的配对关系
    var cone = svgEl('polygon', { points: '94,75 193,55 193,197', fill: BP, opacity: '0.04' });
    cone.appendChild(anim('opacity', '0.03;0.08;0.03', '4s'));
    svg.appendChild(cone);
    var picks = [[75, 283, 109, 268, 94], [127, 249, 143, 234, 128], [179, 317, 177, 302, 162]];
    for (i = 0; i < picks.length; i++) {
      var p = picks[i], bg = String(i * 0.35) + 's';
      var ln = svgEl('line', { x1: 94, y1: p[0], x2: p[1], y2: p[2], stroke: BP, 'stroke-width': '1.8', 'stroke-dasharray': '210' });
      ln.appendChild(anim('stroke-dashoffset', '210;0;0;210', '5s', { begin: bg, keyTimes: '0;0.22;0.9;1' }));
      svg.appendChild(ln);
      var hl = svgEl('rect', { x: p[3], y: p[4], width: 30, height: 30, rx: 2, fill: BP, opacity: '0' });
      hl.appendChild(anim('opacity', '0;0.55;0.55;0', '5s', { begin: bg, keyTimes: '0;0.25;0.9;1' }));
      svg.appendChild(hl);
    }
    var sumG = svgEl('g', {});
    sumG.appendChild(svgEl('rect', { x: 398, y: 60, width: 100, height: 26, rx: 4, fill: BP, opacity: '0.1', stroke: BP, 'stroke-width': '1.6' }));
    sumG.appendChild(txt(448, 77, '最大值之和', BP, 9));
    entry(sumG, 448, 73, '0.2s');
    svg.appendChild(sumG);
    var bws = [64, 46, 58];
    for (i = 0; i < bws.length; i++) {
      var bar = svgEl('rect', { x: 398, y: 102 + i * 20, width: bws[i], height: 10, rx: 2, fill: BP, opacity: '0' });
      bar.appendChild(anim('opacity', '0;1;1;0', '5s', { begin: (i * 0.35) + 's', keyTimes: '0;0.3;0.9;1' }));
      svg.appendChild(bar);
    }
    var tot = txt(398, 178, '得分 1.68', BP, 10, 'start');
    tot.appendChild(anim('opacity', '0;0;1;1;0', '5s', { keyTimes: '0;0.55;0.62;0.9;1' }));
    svg.appendChild(tot);
    card(host, 'LATE INTERACTION MAXSIM', '对 patches 取每个 Token 的最大值',
      svg,
      '不使用 OCR，也不使用 pooled Vector：页面保持为图像，并被 Embedding 为数千个 patch Vectors。每个 query Token 都会与每个 patch 进行评分，只保留其中的最大值，再将各 Token 的最大值相加得到页面得分。表格、图表和手写内容都可直接在 patch 层面完成匹配。');
  }

  // ── 05：在金额预算内对实验执行 best-first tree search ──────
  function ceExperimentTree(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 260' });
    svg.appendChild(txt(200, 26, 'best-first 扩展', MUTE, 9));
    svg.appendChild(svgEl('circle', { cx: 200, cy: 50, r: 13, fill: BG, stroke: BP, 'stroke-width': '2' }));
    svg.appendChild(txt(200, 54, 'seed', INK, 7));
    var edges = [[200, 62, 96, 105, '0;0.04;0.1;0.96;1'], [200, 62, 200, 105, '0;0.07;0.13;0.96;1'], [200, 62, 304, 105, '0;0.1;0.16;0.96;1'],
      [304, 131, 258, 183, '0;0.36;0.44;0.96;1'], [304, 131, 352, 183, '0;0.4;0.48;0.96;1']];
    var i;
    for (i = 0; i < edges.length; i++) {
      var e = edges[i];
      var ln = svgEl('line', { x1: e[0], y1: e[1], x2: e[2], y2: e[3], stroke: RULE, 'stroke-width': '1.4', 'stroke-dasharray': '130' });
      ln.appendChild(anim('stroke-dashoffset', '130;130;0;0;130', '6s', { keyTimes: e[4] }));
      svg.appendChild(ln);
    }
    var nodes = [[96, 118, '0.42', '0;0.08;0.14;0.96;1'], [200, 118, '0.55', '0;0.11;0.17;0.96;1'], [304, 118, '0.71', '0;0.14;0.2;0.96;1'],
      [258, 196, '0.62', '0;0.42;0.48;0.96;1'], [352, 196, '0.83', '0;0.46;0.52;0.96;1']];
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var g = svgEl('g', { opacity: '0' });
      g.appendChild(svgEl('circle', { cx: n[0], cy: n[1], r: 13, fill: BG, stroke: BP, 'stroke-width': '1.5' }));
      g.appendChild(txt(n[0], n[1] + 3, n[2], INK, 8));
      g.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: n[3] }));
      g.appendChild(animT('translate', '0 5;0 5;0 0;0 0;0 5', '6s', { keyTimes: n[3] }));
      svg.appendChild(g);
    }
    // 得分最高的节点会被扩展
    var ring = svgEl('circle', { cx: 304, cy: 118, r: 18, fill: 'none', stroke: BP, 'stroke-width': '2.4', opacity: '0' });
    ring.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: '0;0.28;0.34;0.96;1' }));
    svg.appendChild(ring);
    var best = svgEl('path', { d: 'M200 50 L304 118 L352 196', fill: 'none', stroke: BP, 'stroke-width': '3', 'stroke-dasharray': '300', opacity: '0.85' });
    best.appendChild(anim('stroke-dashoffset', '300;300;0;0;300', '6s', { keyTimes: '0;0.58;0.72;0.96;1' }));
    svg.appendChild(best);
    var doc = svgEl('g', { opacity: '0' });
    doc.appendChild(svgEl('rect', { x: 396, y: 178, width: 56, height: 40, rx: 4, fill: BP, opacity: '0.1', stroke: BP, 'stroke-width': '1.8' }));
    doc.appendChild(txt(424, 201, '论文', BP, 9));
    doc.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: '0;0.74;0.8;0.96;1' }));
    doc.appendChild(animT('translate', '0 5;0 5;0 0;0 0;0 5', '6s', { keyTimes: '0;0.74;0.8;0.96;1' }));
    svg.appendChild(doc);
    svg.appendChild(svgEl('rect', { x: 472, y: 60, width: 16, height: 150, rx: 3, fill: 'none', stroke: RULE, 'stroke-width': '1.2' }));
    var fuel = svgEl('rect', { x: 474, y: 62, width: 12, height: 146, rx: 2, fill: WARN, opacity: '0.7' });
    fuel.appendChild(anim('y', '62;200', '6s'));
    fuel.appendChild(anim('height', '146;8', '6s'));
    svg.appendChild(fuel);
    svg.appendChild(txt(480, 226, '$30', MUTE, 8));
    card(host, '实验 TREE SEARCH', '扩展最佳节点，消耗预算',
      svg,
      '每个节点都是一个在 sandbox 中运行并于运行后评分的实验。搜索会扩展得分最高而非最新的节点，因此 0.71 分支会获得子节点，而它的同级节点则停止扩展。预算计量器会随每次运行而下降；预算耗尽时，最佳分支将被整理成论文。');
  }

  // ── 06：pod 上触发告警，通过图遍历定位根因，再执行 gated remediation ────────
  function ceRootcauseWalk(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' });
    svg.appendChild(txt(100, 30, 'knowledge graph 遍历', MUTE, 9));
    var boxes = [['deployment', 56], ['replicaset', 116], ['pod', 176]];
    var i;
    for (i = 0; i < boxes.length; i++) {
      svg.appendChild(svgEl('rect', { x: 63, y: boxes[i][1] - 12, width: 74, height: 24, rx: 4, fill: BG, stroke: BP, 'stroke-width': '1.4' }));
      svg.appendChild(txt(100, boxes[i][1] + 3, boxes[i][0], SOFT, 8));
    }
    svg.appendChild(svgEl('rect', { x: 173, y: 164, width: 74, height: 24, rx: 4, fill: BG, stroke: BP, 'stroke-width': '1.4' }));
    svg.appendChild(txt(210, 179, 'node', SOFT, 8));
    svg.appendChild(svgEl('line', { x1: 100, y1: 68, x2: 100, y2: 104, stroke: RULE, 'stroke-width': '1.4' }));
    svg.appendChild(svgEl('line', { x1: 100, y1: 128, x2: 100, y2: 164, stroke: RULE, 'stroke-width': '1.4' }));
    svg.appendChild(svgEl('line', { x1: 137, y1: 176, x2: 173, y2: 176, stroke: RULE, 'stroke-width': '1.4' }));
    svg.appendChild(txt(110, 90, 'owns', MUTE, 7, 'start'));
    svg.appendChild(txt(110, 150, 'owns', MUTE, 7, 'start'));
    var flash = svgEl('rect', { x: 59, y: 160, width: 82, height: 32, rx: 5, fill: 'none', stroke: WARN, 'stroke-width': '2', opacity: '0' });
    flash.appendChild(anim('opacity', '0;1;0;1;0;0', '6s', { keyTimes: '0;0.03;0.06;0.09;0.12;1' }));
    svg.appendChild(flash);
    var al = txt(100, 214, '告警：OOMKilled', WARN, 9);
    al.appendChild(anim('opacity', '0;1;1;0.2', '6s', { keyTimes: '0;0.05;0.6;1' }));
    svg.appendChild(al);
    // Agent 沿 ownership 边向上遍历，再沿 scheduling 边向外遍历
    var walker = svgEl('circle', { r: 4.5, fill: BP });
    walker.appendChild(svgEl('animateMotion', { dur: '6s', repeatCount: 'indefinite', begin: '0.4s', path: 'M100 176 L100 116 L100 56 L100 116 L100 176 L210 176' }));
    svg.appendChild(walker);
    var visits = [[63, 104, '1.2s'], [63, 44, '2.0s'], [173, 164, '4.6s']];
    for (i = 0; i < visits.length; i++) {
      var v = svgEl('rect', { x: visits[i][0], y: visits[i][1], width: 74, height: 24, rx: 4, fill: BP, opacity: '0' });
      v.appendChild(anim('opacity', '0;0.22;0.22;0', '6s', { begin: visits[i][2], keyTimes: '0;0.05;0.5;1' }));
      svg.appendChild(v);
    }
    svg.appendChild(txt(390, 44, '已排序的假设', MUTE, 9));
    var hyp = [['limits 过低  0.86', 70, 160, '0;0.55;0.68;1'], ['node 内存压力  0.51', 110, 95, '0;0.59;0.72;1'], ['错误的 rollout  0.22', 150, 42, '0;0.63;0.76;1']];
    for (i = 0; i < hyp.length; i++) {
      svg.appendChild(txt(300, hyp[i][1] - 5, hyp[i][0], SOFT, 8, 'start'));
      var bar = svgEl('rect', { x: 300, y: hyp[i][1], width: 0, height: 12, rx: 2, fill: BP, opacity: String(0.9 - i * 0.25) });
      bar.appendChild(anim('width', '0;0;' + hyp[i][2] + ';' + hyp[i][2], '6s', { keyTimes: hyp[i][3] }));
      svg.appendChild(bar);
    }
    var gate = svgEl('rect', { x: 294, y: 56, width: 190, height: 32, rx: 5, fill: 'none', stroke: WARN, 'stroke-width': '1.6', 'stroke-dasharray': '5 4' });
    gate.appendChild(anim('opacity', '0;0;0.3;1;0.3;1', '6s', { keyTimes: '0;0.7;0.78;0.86;0.94;1' }));
    svg.appendChild(gate);
    var appr = txt(300, 100, '正在等待 slack 审批', WARN, 8, 'start');
    appr.appendChild(anim('opacity', '0;0;1;1', '6s', { keyTimes: '0;0.72;0.8;1' }));
    svg.appendChild(appr);
    card(host, '根因遍历', '获批前保持只读',
      svg,
      '一个 OOMKilled 告警落在 pod 上。Agent 沿 ownership 边向上遍历至 deployment，再沿 scheduling 边向外遍历至 node，并在每一跳提取一段 telemetry。假设按照证据权重排序，即便是胜出的假设，也必须先通过人工审批 gate，才能执行任何 remediation。');
  }

  // ── 07：一个产物贯穿 data、sft、dpo、quantize 和 serve 阶段 ─────────────────
  function ceFinetuneStages(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    svg.appendChild(svgEl('line', { x1: 30, y1: 150, x2: 500, y2: 150, stroke: RULE, 'stroke-width': '1.5' }));
    var st = [[62, 'data', '去重 + pii'], [157, 'sft', 'axolotl'], [247, 'dpo', 'trl pairs'], [337, 'quantize', 'awq 4-bit'], [437, 'serve', 'vllm + eagle']];
    var i;
    for (i = 0; i < st.length; i++) {
      svg.appendChild(svgEl('line', { x1: st[i][0], y1: 144, x2: st[i][0], y2: 156, stroke: BP, 'stroke-width': '2' }));
      svg.appendChild(txt(st[i][0], 172, st[i][1], SOFT, 9));
      svg.appendChild(txt(st[i][0], 186, st[i][2], MUTE, 7));
    }
    // Model 块在每个工位发生变化：学习、对齐、缩小
    var blk = svgEl('g', {});
    var outer = svgEl('rect', { x: 40, y: 96, width: 44, height: 36, rx: 4, fill: BG, stroke: BP, 'stroke-width': '2' });
    outer.appendChild(anim('width', '44;44;26;26', '6s', { keyTimes: '0;0.58;0.68;1' }));
    blk.appendChild(outer);
    var tint = svgEl('rect', { x: 42, y: 98, width: 40, height: 32, rx: 3, fill: BP, opacity: '0' });
    tint.appendChild(anim('opacity', '0;0;0.18;0.18;0.4;0.4', '6s', { keyTimes: '0;0.18;0.3;0.38;0.5;1' }));
    tint.appendChild(anim('width', '40;40;22;22', '6s', { keyTimes: '0;0.58;0.68;1' }));
    blk.appendChild(tint);
    blk.appendChild(txt(62, 117, '8b', INK, 9));
    blk.appendChild(animT('translate', '0 0;0 0;95 0;95 0;185 0;185 0;275 0;275 0;375 0;375 0', '6s',
      { keyTimes: '0;0.1;0.18;0.3;0.38;0.5;0.58;0.7;0.78;1' }));
    blk.appendChild(anim('opacity', '0;1;1;0', '6s', { keyTimes: '0;0.04;0.94;1' }));
    svg.appendChild(blk);
    var q = txt(437, 84, '4-bit', WARN, 8);
    q.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: '0;0.6;0.68;0.94;1' }));
    svg.appendChild(q);
    for (i = 0; i < 3; i++) {
      var tok = svgEl('circle', { cy: 114, r: 3, fill: BP, opacity: '0' });
      tok.appendChild(anim('cx', '452;452;506;506', '6s', { keyTimes: '0;' + (0.8 + i * 0.02) + ';' + (0.92 + i * 0.02) + ';1' }));
      tok.appendChild(anim('opacity', '0;0;1;0', '6s', { keyTimes: '0;' + (0.8 + i * 0.02) + ';' + (0.9 + i * 0.02) + ';1' }));
      svg.appendChild(tok);
    }
    card(host, 'FINE-TUNE 流水线', '输入 yaml，输出 endpoint',
      svg,
      '一个产物贯穿整条 pipeline。清洗后的 data 被送入 SFT，后者向 base Model 注入任务行为；DPO 进一步加深对齐；Quantization 将 Model 块缩减到 4-bit，同时不改变它学到的内容；最终提供的 endpoint 则通过 speculative decoding 以流式方式输出 Tokens。');
  }

  // ── 09：recipes 快速修复大多数文件，Agent loop 反复处理其余文件 ─────
  function ceMigrationFunnel(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' });
    svg.appendChild(svgEl('rect', { x: 28, y: 96, width: 72, height: 48, rx: 5, fill: BG, stroke: BP, 'stroke-width': '1.8' }));
    svg.appendChild(txt(64, 116, '50 个 repos', SOFT, 9));
    svg.appendChild(txt(64, 130, 'java 8', MUTE, 8));
    svg.appendChild(svgEl('line', { x1: 100, y1: 120, x2: 288, y2: 120, stroke: SURF, 'stroke-width': '10' }));
    svg.appendChild(txt(194, 102, '确定性 recipes', MUTE, 9));
    svg.appendChild(txt(194, 142, '约 75% 的编辑，可审计 diffs', SOFT, 8));
    svg.appendChild(svgEl('rect', { x: 420, y: 74, width: 72, height: 40, rx: 5, fill: BP, opacity: '0.1', stroke: BP, 'stroke-width': '1.8' }));
    svg.appendChild(txt(456, 91, 'ci 通过', BP, 9));
    svg.appendChild(txt(456, 105, '创建 pr', SOFT, 8));
    svg.appendChild(svgEl('rect', { x: 420, y: 186, width: 72, height: 40, rx: 5, fill: 'none', stroke: WARN, 'stroke-width': '1.6', 'stroke-dasharray': '4 4' }));
    svg.appendChild(txt(456, 203, '失败', WARN, 9));
    svg.appendChild(txt(456, 217, '分类体系', WARN, 8));
    var i;
    for (i = 0; i < 3; i++) {
      var dot = svgEl('circle', { r: 4, fill: BP });
      dot.appendChild(svgEl('animateMotion', { dur: '3s', repeatCount: 'indefinite', begin: i + 's', path: 'M104 120 L288 120 L420 94' }));
      svg.appendChild(dot);
    }
    // 存在歧义的文件转入 build、classify、fix 循环
    var hard = svgEl('circle', { r: 4, fill: WARN });
    hard.appendChild(svgEl('animateMotion', { dur: '6s', repeatCount: 'indefinite', begin: '0.5s', path: 'M104 120 L250 120 C290 124,306 148,316 168', calcMode: 'linear', keyPoints: '0;0.55;0.55;1;1', keyTimes: '0;0.3;0.4;0.55;1' }));
    svg.appendChild(hard);
    var loop = svgEl('circle', { cx: 330, cy: 190, r: 26, fill: 'none', stroke: BP, 'stroke-width': '2', 'stroke-dasharray': '5 5' });
    loop.appendChild(animT('rotate', '0 330 190;360 330 190', '4s'));
    svg.appendChild(loop);
    svg.appendChild(txt(330, 193, 'Agent loop', SOFT, 7));
    svg.appendChild(txt(330, 232, 'build - classify - fix - rerun', MUTE, 7));
    var okOut = svgEl('circle', { r: 4, fill: BP });
    okOut.appendChild(svgEl('animateMotion', { dur: '6s', repeatCount: 'indefinite', path: 'M352 176 C390 150,406 120,436 100', calcMode: 'linear', keyPoints: '0;0;1;1', keyTimes: '0;0.62;0.82;1' }));
    okOut.appendChild(anim('opacity', '0;0;1;1;0;0', '6s', { keyTimes: '0;0.62;0.66;0.8;0.84;1' }));
    svg.appendChild(okOut);
    var failOut = svgEl('circle', { r: 4, fill: WARN });
    failOut.appendChild(svgEl('animateMotion', { dur: '6s', repeatCount: 'indefinite', path: 'M352 204 C384 216,402 208,432 206', calcMode: 'linear', keyPoints: '0;0;1;1', keyTimes: '0;0.78;0.94;1' }));
    failOut.appendChild(anim('opacity', '0;0;1;1;0;0', '6s', { keyTimes: '0;0.78;0.82;0.94;0.98;1' }));
    svg.appendChild(failOut);
    svg.appendChild(txt(30, 240, '每个 repo 的上限：30 分钟、$8、20 turns', MUTE, 8, 'start'));
    card(host, '迁移漏斗', 'recipes 优先，Agent 其次',
      svg,
      '大多数文件直接通过确定性 recipes，最终进入 CI 通过的分支。少数存在歧义的文件会转入 Agent loop，由它执行 build、对失败进行分类、应用修复，并在硬性上限内重新运行。仍然失败的项目会连同一个示例 diff 一起归入分类体系。');
  }

  // ── 10：architect 将任务分派到并行 worktrees，handoffs 是风险点 ────
  function ceTeamHandoff(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 270' });
    var arch = svgEl('g', {});
    arch.appendChild(svgEl('rect', { x: 208, y: 16, width: 104, height: 26, rx: 5, fill: BG, stroke: BP, 'stroke-width': '2' }));
    arch.appendChild(txt(260, 33, 'architect', INK, 10));
    entry(arch, 260, 29, '0.1s');
    svg.appendChild(arch);
    var feed = svgEl('line', { x1: 260, y1: 42, x2: 260, y2: 58, stroke: BP, 'stroke-width': '1.6', 'stroke-dasharray': '4 3' });
    feed.appendChild(anim('stroke-dashoffset', '14;0', '1s'));
    svg.appendChild(feed);
    svg.appendChild(svgEl('rect', { x: 140, y: 58, width: 240, height: 20, rx: 4, fill: BP, opacity: '0.08', stroke: BP, 'stroke-width': '1.3', 'stroke-dasharray': '4 3' }));
    svg.appendChild(txt(260, 72, '任务看板', BP, 9));
    // 四位 coder 以不同速度清空看板
    var lanes = [[95, 'coder a', 0.42], [205, 'coder b', 0.58], [315, 'coder c', 0.5], [425, 'coder d', 0.68]];
    var i;
    for (i = 0; i < lanes.length; i++) {
      var L = lanes[i];
      svg.appendChild(svgEl('line', { x1: L[0], y1: 78, x2: L[0], y2: 96, stroke: RULE, 'stroke-width': '1.3' }));
      svg.appendChild(svgEl('rect', { x: L[0] - 38, y: 96, width: 76, height: 86, rx: 5, fill: BG, stroke: RULE, 'stroke-width': '1.4' }));
      svg.appendChild(txt(L[0], 112, L[1], SOFT, 9));
      svg.appendChild(txt(L[0], 126, 'worktree', MUTE, 7));
      svg.appendChild(svgEl('rect', { x: L[0] - 28, y: 152, width: 56, height: 8, rx: 2, fill: SURF }));
      var fill = svgEl('rect', { x: L[0] - 28, y: 152, width: 0, height: 8, rx: 2, fill: BP });
      fill.appendChild(anim('width', '0;0;56;56', '6s', { keyTimes: '0;0.08;' + L[2] + ';1' }));
      svg.appendChild(fill);
      svg.appendChild(svgEl('line', { x1: L[0], y1: 182, x2: 260, y2: 204, stroke: RULE, 'stroke-width': '1.2', opacity: '0.7' }));
    }
    svg.appendChild(svgEl('circle', { cx: 260, cy: 210, r: 7, fill: BP }));
    svg.appendChild(txt(260, 230, 'merge', MUTE, 8));
    var clash = svgEl('circle', { cx: 260, cy: 210, r: 12, fill: 'none', stroke: WARN, 'stroke-width': '2', opacity: '0' });
    clash.appendChild(anim('opacity', '0;0;1;0;1;0;0', '6s', { keyTimes: '0;0.68;0.71;0.74;0.77;0.8;1' }));
    svg.appendChild(clash);
    var clashTxt = txt(260, 246, '冲突：b vs d', WARN, 8);
    clashTxt.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: '0;0.68;0.72;0.86;1' }));
    svg.appendChild(clashTxt);
    svg.appendChild(svgEl('line', { x1: 267, y1: 210, x2: 320, y2: 210, stroke: RULE, 'stroke-width': '1.3' }));
    var rev = svgEl('g', {});
    rev.appendChild(svgEl('rect', { x: 320, y: 197, width: 84, height: 26, rx: 5, fill: BG, stroke: BP, 'stroke-width': '1.6', 'stroke-dasharray': '4 3' }));
    rev.appendChild(txt(362, 214, 'reviewer', SOFT, 9));
    rev.appendChild(anim('opacity', '0.35;0.35;1;1', '6s', { keyTimes: '0;0.8;0.86;1' }));
    svg.appendChild(rev);
    svg.appendChild(svgEl('line', { x1: 404, y1: 210, x2: 432, y2: 210, stroke: RULE, 'stroke-width': '1.3' }));
    var tst = svgEl('g', {});
    tst.appendChild(svgEl('rect', { x: 432, y: 197, width: 76, height: 26, rx: 5, fill: BP, opacity: '0.1', stroke: BP, 'stroke-width': '1.6' }));
    tst.appendChild(txt(470, 214, '测试：通过', BP, 9));
    tst.appendChild(anim('opacity', '0.25;0.25;1;1', '6s', { keyTimes: '0;0.88;0.94;1' }));
    svg.appendChild(tst);
    card(host, 'FACTORY HANDOFFS', '并行通道，一次 merge',
      svg,
      'architect 将计划冻结到任务看板上，四位 coder 在并行 worktrees 中领取任务，每个人都按自己的进度完成。merge 是 handoff 最容易失败的地方：两位 coder 修改了同一个文件，冲突随即闪现；解决后，diff 才会通过 reviewer gate 和隔离测试。');
  }

  // ── 11：span 流入，eval sparkline 下跌，在五分钟内告警 ─────
  function ceOtelDrift(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 260' });
    var srcs = [['openai sdk', 40], ['anthropic sdk', 76], ['langchain', 112]];
    var i;
    for (i = 0; i < srcs.length; i++) {
      svg.appendChild(svgEl('rect', { x: 24, y: srcs[i][1], width: 86, height: 20, rx: 4, fill: BG, stroke: RULE, 'stroke-width': '1.3' }));
      svg.appendChild(txt(67, srcs[i][1] + 13, srcs[i][0], SOFT, 8));
    }
    var lanes = ['M110 50 C150 50,150 84,178 86', 'M110 86 L178 88', 'M110 122 C150 122,150 92,178 90'];
    for (i = 0; i < lanes.length; i++) {
      svg.appendChild(svgEl('path', { d: lanes[i], fill: 'none', stroke: RULE, 'stroke-width': '1.2' }));
      var sp = svgEl('circle', { r: 3, fill: BP });
      sp.appendChild(svgEl('animateMotion', { dur: '2s', repeatCount: 'indefinite', begin: (i * 0.66) + 's', path: lanes[i] }));
      svg.appendChild(sp);
    }
    svg.appendChild(svgEl('rect', { x: 178, y: 72, width: 74, height: 32, rx: 4, fill: BG, stroke: BP, 'stroke-width': '1.6' }));
    svg.appendChild(txt(215, 91, 'otel collector', SOFT, 8));
    var pipe = svgEl('line', { x1: 252, y1: 88, x2: 288, y2: 88, stroke: BP, 'stroke-width': '1.8', 'stroke-dasharray': '5 4' });
    pipe.appendChild(anim('stroke-dashoffset', '18;0', '1s'));
    svg.appendChild(pipe);
    svg.appendChild(svgEl('rect', { x: 288, y: 74, width: 60, height: 30, fill: BG, stroke: BP, 'stroke-width': '1.5' }));
    svg.appendChild(svgEl('ellipse', { cx: 318, cy: 74, rx: 30, ry: 7, fill: BG, stroke: BP, 'stroke-width': '1.5' }));
    svg.appendChild(svgEl('ellipse', { cx: 318, cy: 104, rx: 30, ry: 7, fill: 'none', stroke: BP, 'stroke-width': '1.5' }));
    svg.appendChild(txt(318, 95, 'clickhouse', SOFT, 8));
    svg.appendChild(txt(412, 120, 'eval jobs 对 traces 采样', MUTE, 8));
    // 注入的 regression 进入 eval 数据流，随后分数下降
    var drop = svgEl('circle', { cx: 318, r: 3.5, fill: WARN, opacity: '0' });
    drop.appendChild(anim('cy', '112;112;168;168', '6s', { keyTimes: '0;0.32;0.42;1' }));
    drop.appendChild(anim('opacity', '0;0;1;0;0', '6s', { keyTimes: '0;0.32;0.42;0.5;1' }));
    svg.appendChild(drop);
    var reg = txt(310, 168, '注入的 regression', WARN, 7, 'end');
    reg.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: '0;0.34;0.4;0.6;1' }));
    svg.appendChild(reg);
    svg.appendChild(svgEl('line', { x1: 60, y1: 160, x2: 60, y2: 236, stroke: RULE, 'stroke-width': '1' }));
    svg.appendChild(svgEl('line', { x1: 60, y1: 236, x2: 490, y2: 236, stroke: RULE, 'stroke-width': '1' }));
    svg.appendChild(txt(56, 158, 'faithfulness', MUTE, 8, 'end'));
    var spark = svgEl('path', {
      d: 'M60 176 L100 173 L140 178 L180 174 L220 177 L260 173 L300 176 L316 222 L360 219 L400 223 L440 220 L470 221',
      fill: 'none', stroke: BP, 'stroke-width': '2', 'stroke-dasharray': '520', 'stroke-dashoffset': '520'
    });
    spark.appendChild(anim('stroke-dashoffset', '520;0;0', '6s', { keyTimes: '0;0.7;1' }));
    svg.appendChild(spark);
    svg.appendChild(svgEl('line', { x1: 60, y1: 206, x2: 490, y2: 206, stroke: WARN, 'stroke-width': '1.3', 'stroke-dasharray': '5 4' }));
    svg.appendChild(txt(486, 200, '告警下限', WARN, 8, 'end'));
    var alert = svgEl('g', { opacity: '0' });
    alert.appendChild(svgEl('rect', { x: 336, y: 142, width: 128, height: 22, rx: 4, fill: WARN, 'fill-opacity': '0.12', stroke: WARN, 'stroke-width': '1.6' }));
    alert.appendChild(txt(400, 157, '告警在 5 分钟内触发', WARN, 8));
    alert.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: '0;0.46;0.52;0.95;1' }));
    alert.appendChild(animT('translate', '0 5;0 5;0 0;0 0;0 5', '6s', { keyTimes: '0;0.46;0.52;0.95;1' }));
    svg.appendChild(alert);
    card(host, '从 DRIFT 到告警', 'semconv spans，采样 evals',
      svg,
      'GenAI-semconv spans 从四个 SDK 家族流出，经由 collector 进入 ClickHouse，eval jobs 会在那里为采样 traces 评分。注入的 regression 到达后，faithfulness sparkline 跌破告警下限，页面随即发出告警，整个过程处于五分钟检测预算内。');
  }

  LF.register({
    'ce-agent-loop': ceAgentLoop,
    'ce-hybrid-retrieval': ceHybridRetrieval,
    'ce-voice-latency': ceVoiceLatency,
    'ce-late-interaction': ceLateInteraction,
    'ce-experiment-tree': ceExperimentTree,
    'ce-rootcause-walk': ceRootcauseWalk,
    'ce-finetune-stages': ceFinetuneStages,
    'ce-migration-funnel': ceMigrationFunnel,
    'ce-team-handoff': ceTeamHandoff,
    'ce-otel-drift': ceOtelDrift
  });
})();
