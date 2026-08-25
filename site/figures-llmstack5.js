/* figures-llmstack5.js：用于 Phase 10（从零构建 LLM）、Phase 11（LLM 工程）
   和 Phase 12（Multimodal AI）的 SMIL 动画课程图示。
   在 lesson-figures.js 之后加载，并通过 window.LF.register 注册。
   原生 ES5，无依赖，通过 CSS 变量设置主题。每个图示都是自动运行的
   SVG 动画（仅使用 SMIL，不使用 JS 循环驱动帧）。编写方式：
       ```figure
       l5-data-pipeline
       ``` */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;

  var BP = 'var(--blueprint,#3553ff)';
  var INK = 'var(--ink,#1a1a1a)';
  var SOFT = 'var(--ink-soft,#555)';
  var MUTE = 'var(--ink-mute,#777)';
  var RULE = 'var(--rule-soft,#ddd)';
  var SURF = 'var(--bg-surface,#eee)';
  var WARN = 'var(--warn,#b8870f)';
  var MONO = 'var(--font-mono,monospace)';
  var EASE = '0.23 1 0.32 1';

  function anim(attr, vals, dur, extra) {
    var a = { attributeName: attr, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) { for (var k in extra) { a[k] = extra[k]; } }
    return svgEl('animate', a);
  }
  function txt(x, y, s, size, fill, anchor) {
    var a = { x: x, y: y, 'font-family': MONO, 'font-size': size, fill: fill };
    if (anchor) { a['text-anchor'] = anchor; }
    var t = svgEl('text', a);
    t.appendChild(document.createTextNode(s));
    return t;
  }
  function box(x, y, w, h, stroke, fill, sw) {
    return svgEl('rect', { x: x, y: y, width: w, height: h, rx: 4, fill: fill || 'none', stroke: stroke, 'stroke-width': sw || 1.3 });
  }
  // 单次挂载入场动画：从 opacity 0 淡入，同时从 95% 增长至 100%
  // 缩放中心为图示中心点 (cx, cy)。仅运行一次，之后由循环动画接管。
  function entry(g, cx, cy) {
    var common = { dur: '0.7s', begin: '0s', fill: 'freeze', repeatCount: '1', calcMode: 'spline', keyTimes: '0;1', keySplines: EASE };
    g.setAttribute('opacity', '0');
    var o = { attributeName: 'opacity', values: '0;1' }, k;
    for (k in common) { o[k] = common[k]; }
    g.appendChild(svgEl('animate', o));
    var t = { attributeName: 'transform', type: 'translate', values: (cx * 0.05).toFixed(1) + ' ' + (cy * 0.05).toFixed(1) + ';0 0' };
    for (k in common) { t[k] = common[k]; }
    g.appendChild(svgEl('animateTransform', t));
    var s = { attributeName: 'transform', type: 'scale', values: '0.95;1', additive: 'sum' };
    for (k in common) { s[k] = common[k]; }
    g.appendChild(svgEl('animateTransform', s));
    return g;
  }
  function card(host, label, sub, svg, cap) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [sub])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out' }, [svg])]),
      el('div', { class: 'lf-cap' }, [cap])
    ]));
  }

  // ── l5-data-pipeline：文档流经各层过滤器，只有保留下来的数据才会组成 Batch ──
  function dataPipeline(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    var g = svgEl('g');
    g.appendChild(svgEl('line', { x1: 24, y1: 77, x2: 470, y2: 77, stroke: RULE, 'stroke-width': 1 }));
    var i;
    for (i = 0; i < 3; i++) {
      g.appendChild(svgEl('rect', { x: 22, y: 56 + i * 9, width: 44, height: 7, fill: SURF, stroke: MUTE, 'stroke-width': 0.8 }));
    }
    g.appendChild(txt(44, 104, '原始文本', 9, MUTE, 'middle'));
    var names = ['去重', '质量过滤', '打包'];
    for (i = 0; i < 3; i++) {
      var sx = 110 + i * 100;
      g.appendChild(box(sx, 61, 72, 32, BP));
      g.appendChild(txt(sx + 36, 81, names[i], 10, BP, 'middle'));
    }
    g.appendChild(txt(146, 150, '重复内容', 8.5, WARN, 'middle'));
    g.appendChild(txt(246, 150, '低质量内容', 8.5, WARN, 'middle'));
    for (i = 0; i < 6; i++) {
      var bx = 420 + (i % 2) * 30, by = 52 + Math.floor(i / 2) * 17;
      var cell = svgEl('rect', { x: bx, y: by, width: 26, height: 13, fill: BP, opacity: 0 });
      var at = 0.56 + i * 0.055;
      cell.appendChild(anim('opacity', '0;0;0.85;0.85;0', '5s', { keyTimes: '0;' + at.toFixed(3) + ';' + (at + 0.04).toFixed(3) + ';0.94;1' }));
      g.appendChild(cell);
    }
    g.appendChild(txt(448, 118, 'Batch', 8.5, SOFT, 'middle'));
    function doc(path, begin, fill, opVals, opTimes, kp, kt) {
      var c = svgEl('circle', { r: 4.5, fill: fill, opacity: 0 });
      var m = { dur: '5s', repeatCount: 'indefinite', path: path, begin: begin, calcMode: 'linear', keyPoints: kp, keyTimes: kt };
      c.appendChild(svgEl('animateMotion', m));
      c.appendChild(anim('opacity', opVals, '5s', { begin: begin, keyTimes: opTimes }));
      g.appendChild(c);
    }
    doc('M 44 77 L 432 77', '0s', BP, '0;1;1;0;0', '0;0.05;0.5;0.58;1', '0;1;1', '0;0.52;1');
    doc('M 44 77 L 146 77 L 146 132', '0.35s', MUTE, '0;1;1;0;0', '0;0.05;0.32;0.44;1', '0;0.65;1;1', '0;0.3;0.42;1');
    doc('M 44 77 L 246 77 L 246 132', '0.7s', MUTE, '0;1;1;0;0', '0;0.05;0.4;0.52;1', '0;0.786;1;1', '0;0.38;0.5;1');
    entry(g, 260, 115);
    svg.appendChild(g);
    card(host, 'PRETRAINING 数据管线', '过滤、打包，让 GPU 持续满载', svg,
      '数 TB 的原始文本会先流过去重和质量过滤器，再被打包为固定长度的序列。最终只有一小部分能够保留下来，而数据管线生成 Batch 的速度必须快于 GPU 消耗 Batch 的速度，否则整个集群都要等待 dataloader。');
  }

  // ── l5-spec-decode-eagle：draft 提出候选，一次 verifier 前向传播完成确认 ──
  function specDecode(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 220' });
    var g = svgEl('g');
    g.appendChild(box(8, 88, 50, 26, MUTE));
    g.appendChild(txt(33, 105, 'draft', 9, MUTE, 'middle'));
    g.appendChild(box(160, 16, 220, 26, INK, 'none', 1.4));
    g.appendChild(txt(270, 33, 'verifier：一次前向传播', 9.5, INK, 'middle'));
    var sweep = svgEl('rect', { x: 66, y: 80, width: 78, height: 42, fill: BP, opacity: 0 });
    sweep.appendChild(anim('x', '66;66;320;320', '5.5s', { calcMode: 'linear', keyTimes: '0;0.28;0.52;1' }));
    sweep.appendChild(anim('opacity', '0;0;0.16;0.16;0;0', '5.5s', { keyTimes: '0;0.26;0.3;0.52;0.58;1' }));
    g.appendChild(sweep);
    var slotX = [70, 154, 238, 322];
    var appear = ['0;0.05;0.09;0.93;1', '0;0.095;0.135;0.93;1', null, null];
    var i;
    for (i = 0; i < 4; i++) {
      var gs = svgEl('g', { opacity: 0 });
      gs.appendChild(svgEl('rect', { x: slotX[i], y: 84, width: 70, height: 34, rx: 4, fill: 'none', stroke: MUTE, 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }));
      gs.appendChild(txt(slotX[i] + 35, 106, 'd' + (i + 1), 10, SOFT, 'middle'));
      if (i < 2) {
        gs.appendChild(anim('opacity', '0;0;0.9;0.9;0', '5.5s', { keyTimes: appear[i] }));
      } else {
        var s0 = i === 2 ? '0.14' : '0.185', s1 = i === 2 ? '0.18' : '0.225';
        var e0 = i === 2 ? '0.56' : '0.5', e1 = i === 2 ? '0.62' : '0.56';
        gs.appendChild(anim('opacity', '0;0;0.9;0.9;0;0', '5.5s', { keyTimes: '0;' + s0 + ';' + s1 + ';' + e0 + ';' + e1 + ';1' }));
      }
      g.appendChild(gs);
    }
    var accTimes = ['0;0.34;0.38;0.93;1', '0;0.42;0.46;0.93;1'];
    for (i = 0; i < 2; i++) {
      var acc = svgEl('rect', { x: slotX[i], y: 84, width: 70, height: 34, rx: 4, fill: BP, opacity: 0 });
      acc.appendChild(anim('opacity', '0;0;0.5;0.5;0', '5.5s', { keyTimes: accTimes[i] }));
      g.appendChild(acc);
    }
    var xm = svgEl('path', { d: 'M 263 91 L 283 111 M 283 91 L 263 111', stroke: WARN, 'stroke-width': 2, fill: 'none', opacity: 0 });
    xm.appendChild(anim('opacity', '0;0;1;1;0;0', '5.5s', { keyTimes: '0;0.5;0.53;0.58;0.63;1' }));
    g.appendChild(xm);
    var fix = svgEl('g', { opacity: 0 });
    fix.appendChild(svgEl('rect', { x: 238, y: 84, width: 70, height: 34, rx: 4, fill: BP }));
    fix.appendChild(txt(273, 106, '重新采样', 8.5, 'var(--bg,#fafaf5)', 'middle'));
    fix.appendChild(anim('opacity', '0;0;1;1;0', '5.5s', { keyTimes: '0;0.6;0.66;0.93;1', calcMode: 'spline', keySplines: EASE + ';' + EASE + ';' + EASE + ';' + EASE }));
    g.appendChild(fix);
    g.appendChild(txt(260, 190, '一次 verifier 前向传播：接受两个 Token，修正一个 Token', 9, MUTE, 'middle'));
    entry(g, 260, 110);
    svg.appendChild(g);
    card(host, 'SPECULATIVE DECODING', 'draft 成本低，只需验证一次', svg,
      'draft head 提出四个低成本 Token。一次 verifier 前向传播会同时为它们评分：接受一致的前缀，拒绝首个不一致的 Token，并用 residual distribution 中的样本替换它，之后的所有 Token 都会被丢弃。如果全部接受，verifier 还会额外发出一个 Token，因此在精确保留 verifier distribution 的同时，一次大 Model 前向传播最多可以生成 N+1 个 Token。');
  }

  // ── l5-prod-app-paths：cache miss 要走完整路径，cache hit 几乎没有成本 ──
  function prodApp(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' });
    var g = svgEl('g');
    var stages = [[12, 62, '请求', SOFT], [100, 60, '防护', BP], [186, 60, 'cache', BP], [272, 54, 'RAG', BP], [352, 50, 'LLM', BP], [428, 78, '响应', INK]];
    g.appendChild(svgEl('line', { x1: 74, y1: 73, x2: 428, y2: 73, stroke: RULE, 'stroke-width': 1 }));
    var i;
    for (i = 0; i < 6; i++) {
      g.appendChild(box(stages[i][0], 58, stages[i][1], 30, stages[i][3]));
      g.appendChild(txt(stages[i][0] + stages[i][1] / 2, 77, stages[i][2], 9.5, stages[i][3], 'middle'));
    }
    g.appendChild(svgEl('path', { d: 'M 216 88 C 216 150 300 150 340 150 L 400 150 C 452 150 460 120 462 92', fill: 'none', stroke: RULE, 'stroke-width': 1.2, 'stroke-dasharray': '5 4' }));
    g.appendChild(txt(310, 164, 'cache hit 捷径', 8.5, MUTE, 'middle'));
    var missTag = txt(216, 50, 'miss', 8.5, WARN, 'middle');
    missTag.setAttribute('opacity', 0);
    missTag.appendChild(anim('opacity', '0;0;1;1;0;0', '6s', { keyTimes: '0;0.12;0.16;0.3;0.36;1' }));
    g.appendChild(missTag);
    var flash = svgEl('rect', { x: 186, y: 58, width: 60, height: 30, rx: 4, fill: BP, opacity: 0 });
    flash.appendChild(anim('opacity', '0;0;0.4;0;0', '6s', { keyTimes: '0;0.58;0.62;0.68;1' }));
    g.appendChild(flash);
    var miss = svgEl('circle', { r: 4.5, fill: BP, opacity: 0 });
    miss.appendChild(svgEl('animateMotion', { dur: '6s', repeatCount: 'indefinite', path: 'M 20 73 L 460 73', calcMode: 'linear', keyPoints: '0;1;1', keyTimes: '0;0.4;1' }));
    miss.appendChild(anim('opacity', '0;1;1;0;0', '6s', { keyTimes: '0;0.04;0.4;0.47;1' }));
    g.appendChild(miss);
    var hit = svgEl('circle', { r: 4.5, fill: BP, opacity: 0 });
    hit.appendChild(svgEl('animateMotion', { dur: '6s', repeatCount: 'indefinite', path: 'M 20 73 L 216 73 L 216 88 C 216 150 320 150 400 150 C 452 150 460 120 462 95', calcMode: 'linear', keyPoints: '0;0;1;1', keyTimes: '0;0.55;0.78;1' }));
    hit.appendChild(anim('opacity', '0;0;1;1;0;0', '6s', { keyTimes: '0;0.55;0.58;0.78;0.84;1' }));
    g.appendChild(hit);
    g.appendChild(txt(60, 208, 'miss', 9, SOFT, 'end'));
    g.appendChild(txt(60, 228, 'hit', 9, SOFT, 'end'));
    g.appendChild(svgEl('rect', { x: 72, y: 198, width: 240, height: 12, fill: 'none', stroke: RULE, 'stroke-width': 1 }));
    g.appendChild(svgEl('rect', { x: 72, y: 218, width: 240, height: 12, fill: 'none', stroke: RULE, 'stroke-width': 1 }));
    var mb = svgEl('rect', { x: 72, y: 198, width: 0, height: 12, fill: WARN });
    mb.appendChild(anim('width', '0;0;220;220;0', '6s', { calcMode: 'linear', keyTimes: '0;0.08;0.4;0.94;1' }));
    g.appendChild(mb);
    var hb = svgEl('rect', { x: 72, y: 218, width: 0, height: 12, fill: BP });
    hb.appendChild(anim('width', '0;0;14;14;0', '6s', { calcMode: 'linear', keyTimes: '0;0.55;0.78;0.94;1' }));
    g.appendChild(hb);
    g.appendChild(txt(320, 208, '约 2 秒，完整 Token 成本', 8.5, MUTE));
    g.appendChild(txt(320, 228, '约 50 ms，几乎免费', 8.5, MUTE));
    entry(g, 260, 125);
    svg.appendChild(g);
    card(host, '生产环境 LLM 服务', '两个请求，两条截然不同的路径', svg,
      '一个请求没有命中任何 cache，因此要承担完整路径的成本：guardrails、retrieval 和 Model 本身。延迟以秒计，还要支付完整的 Token 成本。片刻后到来的相同请求会在 cache 处提前结束，并以几乎为零的成本在数毫秒内返回。生产环境中的 LLM 工程，很大程度上就是让第二条路径成为常态。');
  }

  // ── l5-state-graph-ledger：显式 graph，每条 edge 都写入 checkpoint ──
  function stateGraph(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' });
    var g = svgEl('g');
    var nodes = [[50, 70, 80, 'Model', BP], [210, 26, 80, 'Tools', BP], [210, 114, 80, '人工审批', WARN], [390, 114, 70, 'END', MUTE]];
    var i;
    for (i = 0; i < 4; i++) {
      g.appendChild(box(nodes[i][0], nodes[i][1], nodes[i][2], 32, nodes[i][4]));
      g.appendChild(txt(nodes[i][0] + nodes[i][2] / 2, nodes[i][1] + 20, nodes[i][3], 10, nodes[i][4], 'middle'));
    }
    g.appendChild(svgEl('line', { x1: 130, y1: 78, x2: 210, y2: 48, stroke: RULE, 'stroke-width': 1.2 }));
    g.appendChild(svgEl('line', { x1: 210, y1: 56, x2: 130, y2: 90, stroke: RULE, 'stroke-width': 1.2 }));
    g.appendChild(svgEl('line', { x1: 130, y1: 98, x2: 210, y2: 126, stroke: RULE, 'stroke-width': 1.2 }));
    g.appendChild(svgEl('line', { x1: 290, y1: 130, x2: 390, y2: 130, stroke: RULE, 'stroke-width': 1.2 }));
    var walker = svgEl('circle', { r: 5, fill: BP, opacity: 0 });
    walker.appendChild(svgEl('animateMotion', { dur: '6s', repeatCount: 'indefinite', path: 'M 90 86 L 250 42 L 90 86 L 250 130 L 425 130', calcMode: 'linear', keyPoints: '0;0.25;0.5;0.75;0.75;1;1', keyTimes: '0;0.15;0.3;0.45;0.72;0.88;1' }));
    walker.appendChild(anim('opacity', '0;1;1;0;0', '6s', { keyTimes: '0;0.04;0.88;0.94;1' }));
    g.appendChild(walker);
    var ring = svgEl('circle', { cx: 250, cy: 130, r: 24, fill: 'none', stroke: WARN, 'stroke-width': 1.5, opacity: 0 });
    ring.appendChild(anim('opacity', '0;0;0.9;0.9;0;0', '6s', { keyTimes: '0;0.48;0.52;0.68;0.74;1' }));
    g.appendChild(ring);
    var itx = txt(250, 172, 'interrupt：等待审批', 8.5, WARN, 'middle');
    itx.setAttribute('opacity', 0);
    itx.appendChild(anim('opacity', '0;0;1;1;0;0', '6s', { keyTimes: '0;0.48;0.52;0.68;0.74;1' }));
    g.appendChild(itx);
    g.appendChild(txt(60, 206, 'checkpointer', 9, MUTE));
    var cpAt = [0.15, 0.3, 0.45, 0.88];
    for (i = 0; i < 4; i++) {
      var cp = svgEl('rect', { x: 170 + i * 36, y: 194, width: 30, height: 16, rx: 2, fill: BP, opacity: 0 });
      cp.appendChild(anim('opacity', '0;0;0.8;0.8;0', '6s', { keyTimes: '0;' + cpAt[i] + ';' + (cpAt[i] + 0.04).toFixed(2) + ';0.94;1' }));
      g.appendChild(cp);
    }
    entry(g, 260, 125);
    svg.appendChild(g);
    card(host, 'AGENT 状态机', '循环变成了可以暂停的 graph', svg,
      '这是绘制为显式 graph 的同一个 ReAct 循环。执行游标依次经过 Model、Tools 和人工审批 node，每次 transition 都会向下方的 ledger 写入 checkpoint。到达人工审批 node 时，执行会直接停止：由于状态已经持久化，graph 之后可以继续运行，也可以回退到任意更早的 checkpoint，再从那里沿不同路径创建分支。');
  }

  // ── l5-framework-fit：四块白板，分别对应一种核心 abstraction ──
  function frameworkFit(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 260' });
    var g = svgEl('g');
    g.appendChild(txt(260, 20, '白板测试：你的问题是什么形状？', 9.5, MUTE, 'middle'));
    function panel(x, y, name, tag, sketch, vals, times) {
      var p = svgEl('g', { opacity: 0.35 });
      p.appendChild(svgEl('rect', { x: x, y: y, width: 240, height: 102, fill: 'none', stroke: RULE, 'stroke-width': 1 }));
      p.appendChild(txt(x + 10, y + 20, name, 10.5, INK));
      p.appendChild(txt(x + 10, y + 92, tag, 8.5, MUTE));
      var i;
      for (i = 0; i < sketch.length; i++) { p.appendChild(sketch[i]); }
      p.appendChild(anim('opacity', vals, '6s', { keyTimes: times }));
      g.appendChild(p);
    }
    panel(10, 32, 'LangGraph', '你画出 graph：typed state、edge', [
      svgEl('circle', { cx: 158, cy: 62, r: 7, fill: 'none', stroke: BP, 'stroke-width': 1.4 }),
      svgEl('circle', { cx: 204, cy: 84, r: 7, fill: 'none', stroke: BP, 'stroke-width': 1.4 }),
      svgEl('circle', { cx: 158, cy: 106, r: 7, fill: 'none', stroke: BP, 'stroke-width': 1.4 }),
      svgEl('line', { x1: 164, y1: 66, x2: 198, y2: 81, stroke: BP, 'stroke-width': 1.1 }),
      svgEl('line', { x1: 198, y1: 88, x2: 164, y2: 103, stroke: BP, 'stroke-width': 1.1 })
    ], '0.35;1;1;0.35;0.35', '0;0.03;0.21;0.26;1');
    panel(270, 32, 'CrewAI', '你画出组织结构图：角色 + 任务', [
      svgEl('rect', { x: 420, y: 52, width: 36, height: 14, rx: 2, fill: 'none', stroke: BP, 'stroke-width': 1.4 }),
      svgEl('rect', { x: 396, y: 90, width: 32, height: 14, rx: 2, fill: SURF, stroke: MUTE, 'stroke-width': 1 }),
      svgEl('rect', { x: 448, y: 90, width: 32, height: 14, rx: 2, fill: SURF, stroke: MUTE, 'stroke-width': 1 }),
      svgEl('line', { x1: 432, y1: 66, x2: 412, y2: 90, stroke: MUTE, 'stroke-width': 1.1 }),
      svgEl('line', { x1: 444, y1: 66, x2: 464, y2: 90, stroke: MUTE, 'stroke-width': 1.1 })
    ], '0.35;0.35;1;1;0.35;0.35', '0;0.25;0.28;0.46;0.51;1');
    panel(10, 148, 'AutoGen', '你画出对话：Agent 轮流发言', [
      svgEl('rect', { x: 146, y: 174, width: 62, height: 18, rx: 9, fill: 'none', stroke: BP, 'stroke-width': 1.4 }),
      svgEl('rect', { x: 168, y: 202, width: 62, height: 18, rx: 9, fill: SURF, stroke: MUTE, 'stroke-width': 1 })
    ], '0.35;0.35;1;1;0.35;0.35', '0;0.5;0.53;0.71;0.76;1');
    panel(270, 148, 'Agno', '你画出一个方框：Agent + 完整配套', [
      svgEl('rect', { x: 418, y: 168, width: 50, height: 30, rx: 4, fill: 'none', stroke: BP, 'stroke-width': 1.4 }),
      svgEl('rect', { x: 414, y: 212, width: 12, height: 12, fill: SURF, stroke: MUTE, 'stroke-width': 1 }),
      svgEl('rect', { x: 436, y: 212, width: 12, height: 12, fill: SURF, stroke: MUTE, 'stroke-width': 1 }),
      svgEl('rect', { x: 458, y: 212, width: 12, height: 12, fill: SURF, stroke: MUTE, 'stroke-width': 1 })
    ], '0.35;0.35;1;1;0.35', '0;0.75;0.78;0.97;1');
    entry(g, 260, 130);
    svg.appendChild(g);
    card(host, 'FRAMEWORK 权衡', '让 abstraction 匹配问题的形状', svg,
      '每个 framework 都有一种核心 abstraction，也就是你会在白板上画出的东西。LangGraph 画的是 state graph，CrewAI 画的是组织结构图，AutoGen 画的是对话，Agno 画的是附带 Tools 的单个 Agent。选择画法与你的问题相匹配的 framework；强行套用错误的形状，意味着你必须亲手补写缺失的 abstraction，而且往往要写两遍。');
  }

  // ── l5-vlm-recipe-knobs：五个推子，其中 data mix 升得最高 ──
  function vlmRecipe(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    var g = svgEl('g');
    g.appendChild(txt(40, 26, '对最终 benchmark 的影响', 9, MUTE));
    g.appendChild(svgEl('line', { x1: 40, y1: 192, x2: 480, y2: 192, stroke: MUTE, 'stroke-width': 1 }));
    var bars = [['encoder', 88, false], ['connector', 34, false], ['LLM 大小', 60, false], ['data mix', 126, true], ['分辨率', 72, false]];
    var i;
    for (i = 0; i < 5; i++) {
      var bx = 60 + i * 86, h = bars[i][1], s = 0.05 + i * 0.06;
      var attrs = bars[i][2] ? { fill: BP } : { fill: SURF, stroke: MUTE, 'stroke-width': 1 };
      attrs.x = bx; attrs.y = 182; attrs.width = 48; attrs.height = 10;
      var bar = svgEl('rect', attrs);
      var kt = '0;' + s.toFixed(2) + ';' + (s + 0.14).toFixed(2) + ';0.9;1';
      var ks = '0 0 1 1;' + EASE + ';0 0 1 1;0.42 0 1 1';
      bar.appendChild(anim('height', '10;10;' + h + ';' + h + ';10', '5s', { keyTimes: kt, calcMode: 'spline', keySplines: ks }));
      bar.appendChild(anim('y', '182;182;' + (192 - h) + ';' + (192 - h) + ';182', '5s', { keyTimes: kt, calcMode: 'spline', keySplines: ks }));
      g.appendChild(bar);
      g.appendChild(txt(bx + 24, 208, bars[i][0], 9, SOFT, 'middle'));
    }
    var mark = svgEl('g', { opacity: 0 });
    mark.appendChild(txt(60 + 3 * 86 + 24, 44, '优先调整这里', 9, BP, 'middle'));
    mark.appendChild(svgEl('line', { x1: 60 + 3 * 86 + 24, y1: 50, x2: 60 + 3 * 86 + 24, y2: 60, stroke: BP, 'stroke-width': 1.2 }));
    mark.appendChild(anim('opacity', '0;0;1;1;0', '5s', { keyTimes: '0;0.42;0.48;0.9;1' }));
    g.appendChild(mark);
    entry(g, 260, 120);
    svg.appendChild(g);
    card(host, 'VLM 配方旋钮', '经 ablation 验证仍然稳定的排序', svg,
      '这是在 MM1、Idefics2、Cambrian-1 和 Prismatic 的 ablation 表中始终成立的排序。data mixture 对 benchmark 的影响最大，image encoder 次之，而大多数论文最关注的 connector 影响最小。当 VLM 表现不佳时，应先调整最高的那个推子。');
  }

  // ── l5-onevision-budget：一份固定预算，三种打包方式 ──
  function onevisionBudget(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    var g = svgEl('g');
    g.appendChild(txt(60, 66, '0', 8.5, MUTE, 'middle'));
    g.appendChild(txt(460, 66, '约 3-4K 个视觉 Token', 8.5, MUTE, 'end'));
    g.appendChild(svgEl('rect', { x: 60, y: 78, width: 400, height: 58, fill: 'none', stroke: INK, 'stroke-width': 1.4 }));
    function pack(rects, label, vals, times) {
      var p = svgEl('g', { opacity: 0 });
      var i;
      for (i = 0; i < rects.length; i++) { p.appendChild(rects[i]); }
      p.appendChild(txt(260, 166, label, 9.5, SOFT, 'middle'));
      p.appendChild(anim('opacity', vals, '6s', { keyTimes: times }));
      g.appendChild(p);
    }
    pack([svgEl('rect', { x: 66, y: 84, width: 310, height: 46, fill: BP, opacity: 0.75 })],
      '单张图像：AnyRes tile，约 2900 个 Token', '0;1;1;0;0', '0;0.05;0.3;0.34;1');
    var multi = [], i;
    for (i = 0; i < 6; i++) { multi.push(svgEl('rect', { x: 66 + i * 64, y: 84, width: 56, height: 46, fill: BP, opacity: 0.55 })); }
    pack(multi, '多张图像：6 张图像，每张 729 个 Token', '0;0;1;1;0;0', '0;0.333;0.373;0.63;0.67;1');
    var vid = [];
    for (i = 0; i < 12; i++) { vid.push(svgEl('rect', { x: 66 + i * 32, y: 84, width: 26, height: 46, fill: BP, opacity: 0.4 })); }
    pack(vid, '视频：32 帧，每帧 81 个 Token，经过 pooling', '0;0;1;1;0', '0;0.667;0.707;0.96;1');
    entry(g, 260, 115);
    svg.appendChild(g);
    card(host, 'ONEVISION TOKEN 预算', '同一个容器，三种打包方式', svg,
      'LLaVA-OneVision 将每个样本的视觉 Token 预算大致固定在数千个 Token，只改变打包方式：一张采用高 AnyRes 分辨率的图像、若干张采用中等分辨率的图像，或 32 帧经过 pooling、每帧缩减至 81 个 Token 的视频。由于每种场景的成本大致相同，一个 Model 可以同时在三者上 Training，而不会让其中任何一种占据主导。');
  }

  // ── l5-native-pretrain：后期拼接的墙与交错砌筑的墙 ──
  function nativePretrain(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' });
    var g = svgEl('g');
    function brick(x, y, vision, s) {
      var r = svgEl('rect', { x: x, y: y, width: 44, height: 18, fill: vision ? BP : SURF, stroke: vision ? BP : MUTE, 'stroke-width': 1, opacity: 0 });
      r.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: '0;' + s.toFixed(3) + ';' + (s + 0.05).toFixed(3) + ';0.93;1' }));
      return r;
    }
    g.appendChild(txt(70, 48, 'post-hoc：先处理文本，再拼接视觉能力', 9.5, SOFT));
    var i;
    for (i = 0; i < 6; i++) { g.appendChild(brick(70 + i * 50, 64, false, 0.03 + i * 0.045)); }
    g.appendChild(brick(70 + 6 * 50, 64, true, 0.38));
    g.appendChild(brick(70 + 7 * 50, 64, true, 0.44));
    var crack = svgEl('path', { d: 'M 367 58 L 362 68 L 371 76 L 364 88', stroke: WARN, 'stroke-width': 2, fill: 'none', opacity: 0 });
    crack.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: '0;0.5;0.54;0.93;1' }));
    g.appendChild(crack);
    var clab = txt(367, 108, 'alignment debt', 8.5, WARN, 'middle');
    clab.setAttribute('opacity', 0);
    clab.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: '0;0.5;0.54;0.93;1' }));
    g.appendChild(clab);
    g.appendChild(txt(70, 148, '原生方式：从第一步开始交错处理', 9.5, SOFT));
    var mix = [false, true, false, false, true, false, true, false];
    for (i = 0; i < 8; i++) { g.appendChild(brick(70 + i * 50, 164, mix[i], 0.03 + i * 0.045)); }
    var seam = txt(270, 210, '没有接缝', 8.5, BP, 'middle');
    seam.setAttribute('opacity', 0);
    seam.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: '0;0.42;0.48;0.93;1' }));
    g.appendChild(seam);
    entry(g, 260, 125);
    svg.appendChild(g);
    card(host, '原生 MULTIMODAL PRETRAINING', '建造同一面墙的两种方式', svg,
      'post-hoc Training 会先铺设数万亿个文本 Token，最后再粘接视觉能力；这条接缝就是 alignment debt，会表现为 catastrophic forgetting、回答漂移以及视觉与文本不一致。InternVL3 从第一步开始就同时铺设文本、交错数据和 caption 数据，因此视觉 Token 是这面墙的原生成员，而不是后来拼接上去的扩展。');
  }

  // ── l5-emu3-next-token：一个游标写入文本、图像和视频 Token ──
  function emuNextToken(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 220' });
    var g = svgEl('g');
    g.appendChild(txt(260, 26, '一个 decoder、一套 vocabulary、一个 Loss：预测下一个 Token', 9.5, MUTE, 'middle'));
    var i;
    for (i = 0; i < 12; i++) {
      var attrs = { x: 40 + i * 37, y: 104, width: 34, height: 28, rx: 3, opacity: 0 };
      if (i < 3) { attrs.fill = SURF; attrs.stroke = MUTE; attrs['stroke-width'] = 1; }
      else if (i < 8) { attrs.fill = BP; }
      else { attrs.fill = WARN; }
      var cell = svgEl('rect', attrs);
      var f = i * 0.0733 + 0.02;
      cell.appendChild(anim('opacity', '0;0;1;1;0', '5s', { keyTimes: '0;' + f.toFixed(3) + ';' + (f + 0.03).toFixed(3) + ';0.94;1' }));
      g.appendChild(cell);
    }
    var xs = [], ts = [];
    for (i = 0; i < 13; i++) { xs.push(34 + i * 37); ts.push((i * 0.0733).toFixed(3)); }
    ts[12] = '1';
    var cursor = svgEl('rect', { x: 34, y: 96, width: 3, height: 44, fill: INK });
    cursor.appendChild(anim('x', xs.join(';'), '5s', { calcMode: 'discrete', keyTimes: ts.join(';') }));
    g.appendChild(cursor);
    g.appendChild(txt(94, 160, '文本', 9, SOFT, 'middle'));
    g.appendChild(txt(242, 160, '图像 Token', 9, BP, 'middle'));
    g.appendChild(txt(408, 160, '视频 Token', 9, WARN, 'middle'));
    entry(g, 260, 110);
    svg.appendChild(g);
    card(host, 'EMU3 NEXT-TOKEN GENERATION', '一个 head，三种 modality', svg,
      'Emu3 训练单个 Llama 风格 decoder，在一套共享 vocabulary 上执行 next-token prediction，其中的文本、VQ 图像 Token 和 3D 视频 Token 都只是 vocabulary entry。不需要 diffusion schedule，不需要 CLIP Loss，也不需要第二个 objective。同一个 head 以相同方式扫过序列，就可以写出句子、图像或视频片段，因此同一个 Model 能够同时成为 Emu3-Chat 和 Emu3-Gen。');
  }

  // ── l5-janus-decouple：两个前门，一座共享大厅 ──
  function janusDecouple(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' });
    var g = svgEl('g');
    g.appendChild(box(215, 95, 100, 60, INK, 'none', 1.4));
    g.appendChild(txt(265, 120, '共享', 9.5, INK, 'middle'));
    g.appendChild(txt(265, 134, 'Transformer', 9.5, INK, 'middle'));
    var top = svgEl('g');
    top.appendChild(txt(28, 32, '理解', 9, BP));
    top.appendChild(svgEl('rect', { x: 28, y: 48, width: 30, height: 24, fill: SURF, stroke: SOFT, 'stroke-width': 1 }));
    top.appendChild(txt(43, 86, '图像', 8.5, MUTE, 'middle'));
    top.appendChild(box(96, 48, 86, 24, BP));
    top.appendChild(txt(139, 64, 'SigLIP', 9.5, BP, 'middle'));
    top.appendChild(svgEl('line', { x1: 58, y1: 60, x2: 96, y2: 60, stroke: RULE, 'stroke-width': 1.2 }));
    top.appendChild(svgEl('line', { x1: 182, y1: 60, x2: 218, y2: 96, stroke: RULE, 'stroke-width': 1.2 }));
    top.appendChild(svgEl('line', { x1: 312, y1: 96, x2: 352, y2: 62, stroke: RULE, 'stroke-width': 1.2 }));
    top.appendChild(txt(358, 64, '文本回答', 9.5, SOFT));
    var ud = svgEl('circle', { r: 4, fill: BP, opacity: 0 });
    ud.appendChild(svgEl('animateMotion', { dur: '6s', repeatCount: 'indefinite', path: 'M 34 60 L 139 60 L 250 108 L 356 62', calcMode: 'linear', keyPoints: '0;1;1', keyTimes: '0;0.4;1' }));
    ud.appendChild(anim('opacity', '0;1;1;0;0', '6s', { keyTimes: '0;0.04;0.4;0.46;1' }));
    top.appendChild(ud);
    top.appendChild(anim('opacity', '1;1;0.3;0.3;1', '6s', { keyTimes: '0;0.46;0.5;0.95;1' }));
    g.appendChild(top);
    var bot = svgEl('g');
    bot.appendChild(txt(28, 226, '生成', 9, WARN));
    bot.appendChild(txt(28, 196, 'Prompt', 9, SOFT));
    bot.appendChild(svgEl('line', { x1: 70, y1: 192, x2: 218, y2: 152, stroke: RULE, 'stroke-width': 1.2 }));
    bot.appendChild(svgEl('line', { x1: 312, y1: 152, x2: 346, y2: 188, stroke: RULE, 'stroke-width': 1.2 }));
    bot.appendChild(box(346, 178, 84, 24, WARN));
    bot.appendChild(txt(388, 194, 'VQ decoder', 8.5, WARN, 'middle'));
    bot.appendChild(svgEl('rect', { x: 446, y: 180, width: 10, height: 10, fill: BP, opacity: 0.9 }));
    bot.appendChild(svgEl('rect', { x: 458, y: 180, width: 10, height: 10, fill: BP, opacity: 0.45 }));
    bot.appendChild(svgEl('rect', { x: 446, y: 192, width: 10, height: 10, fill: BP, opacity: 0.3 }));
    bot.appendChild(svgEl('rect', { x: 458, y: 192, width: 10, height: 10, fill: BP, opacity: 0.7 }));
    var gd = svgEl('circle', { r: 4, fill: WARN, opacity: 0 });
    gd.appendChild(svgEl('animateMotion', { dur: '6s', repeatCount: 'indefinite', path: 'M 34 192 L 250 145 L 388 188 L 452 190', calcMode: 'linear', keyPoints: '0;0;1;1', keyTimes: '0;0.5;0.9;1' }));
    gd.appendChild(anim('opacity', '0;0;1;1;0;0', '6s', { keyTimes: '0;0.5;0.54;0.88;0.94;1' }));
    bot.appendChild(gd);
    bot.appendChild(anim('opacity', '0.3;0.3;1;1;0.3', '6s', { keyTimes: '0;0.46;0.5;0.95;1' }));
    g.appendChild(bot);
    entry(g, 260, 125);
    svg.appendChild(g);
    card(host, 'JANUS-PRO 解耦 ENCODER', '两个前门，一座大厅', svg,
      '理解任务需要 semantic Feature，生成任务需要便于重建的 code，而一个 encoder 无法同时满足两者。Janus-Pro 让理解任务通过 SigLIP，让生成任务通过 VQ Tokenizer，同时让两种任务共享同一个 Transformer 主体。两个前门，一座大厅，任何一项任务都不必为另一项任务承担质量代价。');
  }

  // ── l5-thinker-talker：文本尚在生成时，语音已经开始流式输出 ──
  function thinkerTalker(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    var g = svgEl('g');
    g.appendChild(txt(20, 79, 'THINKER', 9, BP));
    g.appendChild(txt(20, 91, '文本 Token', 7.5, MUTE));
    g.appendChild(txt(20, 139, 'TALKER', 9, WARN));
    g.appendChild(txt(20, 151, '语音 Token', 7.5, MUTE));
    function row(y, attrs, off) {
      var i;
      for (i = 0; i < 7; i++) {
        var a = { x: 140 + i * 48, y: y, width: 40, height: 26, rx: 3, opacity: 0 }, k;
        for (k in attrs) { a[k] = attrs[k]; }
        var c = svgEl('rect', a);
        var f = off + i * 0.07;
        c.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: '0;' + f.toFixed(3) + ';' + (f + 0.04).toFixed(3) + ';0.94;1' }));
        g.appendChild(c);
      }
    }
    row(62, { fill: 'none', stroke: BP, 'stroke-width': 1.3 }, 0.05);
    row(122, { fill: WARN, 'fill-opacity': 0.8 }, 0.19);
    var mark = svgEl('line', { x1: 160, y1: 44, x2: 160, y2: 168, stroke: WARN, 'stroke-width': 1.2, 'stroke-dasharray': '4 4', opacity: 0 });
    mark.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: '0;0.19;0.24;0.94;1' }));
    g.appendChild(mark);
    var mlab = txt(168, 40, '首段音频约 350 ms', 8.5, WARN);
    mlab.setAttribute('opacity', 0);
    mlab.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: '0;0.19;0.24;0.94;1' }));
    g.appendChild(mlab);
    var wave = svgEl('path', { d: 'M 478 135 q 4 -12 8 0 q 4 12 8 0 q 4 -12 8 0', stroke: WARN, 'stroke-width': 1.4, fill: 'none', opacity: 0 });
    wave.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: '0;0.24;0.3;0.94;1' }));
    g.appendChild(wave);
    g.appendChild(svgEl('line', { x1: 140, y1: 190, x2: 468, y2: 190, stroke: MUTE, 'stroke-width': 1 }));
    g.appendChild(svgEl('path', { d: 'M 462 186 L 470 190 L 462 194', fill: 'none', stroke: MUTE, 'stroke-width': 1 }));
    g.appendChild(txt(468, 205, '时间', 8.5, MUTE, 'end'));
    g.appendChild(txt(304, 226, 'Thinker 仍在生成文本时，Talker 已经开始流式输出', 8.5, MUTE, 'middle'));
    entry(g, 260, 120);
    svg.appendChild(g);
    card(host, 'THINKER-TALKER 拆分', '并行数据流满足延迟预算', svg,
      'Qwen2.5-Omni 将语音管线拆分开来：大型 Thinker 以文本 Token 形式生成回复，小型 Talker 则并行地将这些 Token 转换为语音 Token，只落后两三个 Token。当句子的大部分内容尚未生成时，第一段音频就已经到达扬声器，这正是往返延迟能够保持在 500 ms 对话阈值以内的原因。');
  }

  LF.register({
    'l5-data-pipeline': dataPipeline,
    'l5-spec-decode-eagle': specDecode,
    'l5-prod-app-paths': prodApp,
    'l5-state-graph-ledger': stateGraph,
    'l5-framework-fit': frameworkFit,
    'l5-vlm-recipe-knobs': vlmRecipe,
    'l5-onevision-budget': onevisionBudget,
    'l5-native-pretrain': nativePretrain,
    'l5-emu3-next-token': emuNextToken,
    'l5-janus-decouple': janusDecouple,
    'l5-thinker-talker': thinkerTalker
  });
})();
