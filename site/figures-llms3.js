/* figures-llms3.js：用于 Phase 07（深入学习 Transformer）和 Phase 10
   （从零构建 LLM）的 SMIL 动画课程图表。在 lesson-figures.js 之后加载，
   并通过 window.LF.register 注册。使用原生 ES5，无依赖，通过 CSS
   变量适配主题。每个图表都是自动运行的 SVG 动画（仅使用 SMIL，不使用 JS
   循环，绝不会挂起）。编写方式仍使用相同的 fenced block：
       ```figure
       bert-mlm
       ``` */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;

  var BP = 'var(--blueprint,#3553ff)';
  var INK = 'var(--ink,#1a1a1a)';
  var MUTE = 'var(--ink-mute,#999)';
  var SOFT = 'var(--rule-soft,#ddd)';
  var WARN = 'var(--warn,#b8870f)';

  function anim(attr, vals, dur, extra) {
    var a = { attributeName: attr, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animate', a);
  }
  function card(host, label, sub, svg, cap) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [sub])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out' }, [svg])]),
      el('div', { class: 'lf-cap' }, [cap])
    ]));
  }

  // ── expert-routing：每个 Token 被路由到 E 个 expert 中的 top-k，其余保持空闲 ──
  function expertRouting(host) {
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var toks = ['the', 'cat', 'sat', 'down'];
    var tx0 = 30, tw = 56, tg = 10, ty = 30;
    var E = 4, ex0 = 320, ew = 150, eh = 34, eg = 16, eyTop = 24;
    // 位于中间的 router
    var routerX = 180;
    svg.appendChild(svgEl('rect', { x: routerX, y: 90, width: 70, height: 56, rx: 5, fill: 'none', stroke: BP, 'stroke-width': 1.6 }));
    svg.appendChild(svgEl('text', { x: routerX + 35, y: 122, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': 11, fill: BP }, [document.createTextNode('router')]));
    // 右侧的 expert
    for (var e = 0; e < E; e++) {
      var ey = eyTop + e * (eh + eg);
      svg.appendChild(svgEl('rect', { x: ex0, y: ey, width: ew, height: eh, rx: 4, fill: SOFT, stroke: MUTE, 'stroke-width': 1 }));
      svg.appendChild(svgEl('text', { x: ex0 + 10, y: ey + 22, 'font-family': 'var(--font-mono,monospace)', 'font-size': 11, fill: INK }, [document.createTextNode('expert ' + (e + 1))]));
      // expert 被选中时产生脉冲效果（每个 Token 从 4 个 expert 中选择 2 个，循环执行）
      var lit = svgEl('rect', { x: ex0, y: ey, width: ew, height: eh, rx: 4, fill: BP, opacity: 0 });
      var phase = (e * 0.22).toFixed(2);
      lit.appendChild(anim('opacity', '0;0.7;0;0', '4.4s', { keyTimes: '0;' + phase + ';' + (Number(phase) + 0.2).toFixed(2) + ';1' }));
      svg.appendChild(lit);
    }
    // 左侧的 Token，每个 Token 向其选择的 2 个 expert 发出路由光束
    var pick = [[0, 2], [1, 3], [0, 3], [1, 2]];
    toks.forEach(function (t, i) {
      var x = tx0 + i * (tw + tg);
      svg.appendChild(svgEl('rect', { x: x, y: ty, width: tw, height: 28, rx: 4, fill: SOFT, stroke: MUTE, 'stroke-width': 1 }));
      svg.appendChild(svgEl('text', { x: x + tw / 2, y: ty + 19, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': 11, fill: INK }, [document.createTextNode(t)]));
      // 一个路由 Token 按 Token → router → expert 的路径移动
      pick[i].forEach(function (e, j) {
        var ey = eyTop + e * (eh + eg) + eh / 2;
        var d = 'M ' + (x + tw / 2) + ' ' + (ty + 28) + ' Q ' + routerX + ' 118 ' + ex0 + ' ' + ey;
        var beam = svgEl('path', { d: d, fill: 'none', stroke: BP, 'stroke-width': 1.4, 'stroke-dasharray': '5 5', opacity: 0.18 });
        beam.appendChild(anim('opacity', '0.12;0.8;0.12', '4.4s', { begin: (i * 0.22 + j * 0.05) + 's' }));
        beam.appendChild(anim('stroke-dashoffset', '20;0', '0.9s'));
        svg.appendChild(beam);
      });
    });
    svg.appendChild(svgEl('text', { x: W / 2, y: 224, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': 10, fill: MUTE }, [document.createTextNode('每个 Token 激活 E 个 expert 中的 top-k，其余保持空闲')]));
    card(host, 'MIXTURE OF EXPERTS', '将每个 Token 路由到少数几个 expert',
      svg, 'Dense block 会为每个 Token 运行一个 FFN。MoE block 将其替换为多个 expert FFN，并使用 router 把每个 Token 仅发送到其中的 top-k。总参数量随 expert 数量扩展，但每个 Token 的 compute 只随 k 扩展，因此 Model 可以变得更大，却不会因此变慢。');
  }

  // ── encoder-decoder：source 只编码一次，decoder 逐步执行 cross-attention ─
  function encoderDecoder(host) {
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var encX = 70, decX = 360, n = 4, by = 40, bh = 34, bg = 10;
    // encoder stack（左侧）：填充一次并保持点亮
    for (var i = 0; i < n; i++) {
      var ey = by + i * (bh + bg);
      var er = svgEl('rect', { x: encX, y: ey, width: 90, height: bh, rx: 4, fill: SOFT, stroke: MUTE, 'stroke-width': 1 });
      er.appendChild(anim('fill', 'var(--bg,#fafaf5);' + SOFT + ';' + SOFT, '4s', { keyTimes: '0;0.2;1', fill: 'freeze', repeatCount: '1' }));
      svg.appendChild(er);
    }
    svg.appendChild(svgEl('text', { x: encX + 45, y: 28, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)',
      'font-size': 11, fill: MUTE }, [document.createTextNode('ENCODER')]));
    svg.appendChild(svgEl('text', { x: decX + 45, y: 28, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)',
      'font-size': 11, fill: BP }, [document.createTextNode('DECODER')]));
    // decoder stack（右侧）
    for (i = 0; i < n; i++) {
      var dy = by + i * (bh + bg);
      svg.appendChild(svgEl('rect', { x: decX, y: dy, width: 90, height: bh, rx: 4, fill: 'none', stroke: BP, 'stroke-width': 1.4 }));
      // 从 encoder 指向该 decoder layer 的 cross-attention 连接依次点亮
      var link = svgEl('line', { x1: encX + 90, y1: dy + bh / 2, x2: decX, y2: dy + bh / 2,
        stroke: BP, 'stroke-width': 1.6, 'stroke-dasharray': '5 4', opacity: 0.2 });
      link.appendChild(anim('opacity', '0.15;0.9;0.15', '4s', { begin: (1.4 + i * 0.3) + 's' }));
      link.appendChild(anim('stroke-dashoffset', '18;0', '0.9s'));
      svg.appendChild(link);
    }
    // 生成的 Token 逐个出现在 decoder 下方
    var outs = ['le', 'chat', 'dort'];
    outs.forEach(function (t, j) {
      var ox = decX + j * 34;
      var oc = svgEl('rect', { x: ox, y: 200, width: 30, height: 24, rx: 3, fill: BP, opacity: 0 });
      oc.appendChild(anim('opacity', '0;0;1;1', '4s', { keyTimes: '0;' + (0.55 + j * 0.12).toFixed(2) + ';' + (0.62 + j * 0.12).toFixed(2) + ';1' }));
      svg.appendChild(oc);
    });
    svg.appendChild(svgEl('text', { x: encX + 45, y: 218, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)',
      'font-size': 11, fill: MUTE }, [document.createTextNode('the cat sleeps')]));
    card(host, 'ENCODER – DECODER', 'cross-attention 依次点亮',
      svg, 'Encoder 会完整读取一次 source，并固定一份稠密 representation。随后，decoder 逐个 Token 生成输出，并在每一层对该 representation 执行 cross-attention。翻译、摘要和转录都采用这种相同的输入到输出结构。');
  }

  // ── rnn-vs-parallel：串行 hidden state 缓慢前进，与一次完成的 Attention 对比 ──
  function rnnVsParallel(host) {
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var n = 6, bw = 54, gap = 10, x0 = 40;
    function row(y, label, color) {
      svg.appendChild(svgEl('text', { x: 8, y: y - 14, 'font-family': 'var(--font-mono,monospace)', 'font-size': 10, fill: color }, [document.createTextNode(label)]));
      for (var i = 0; i < n; i++) {
        var x = x0 + i * (bw + gap);
        svg.appendChild(svgEl('rect', { x: x, y: y, width: bw, height: 28, rx: 3, fill: SOFT, stroke: MUTE, 'stroke-width': 1 }));
      }
    }
    row(50, 'RNN — 串行', MUTE);
    row(160, 'TRANSFORMER — 并行', BP);
    // RNN：一个 hidden state Token 缓慢地从左向右移动
    var hs = svgEl('circle', { cx: x0 + bw / 2, cy: 64, r: 9, fill: WARN });
    var path = 'M ' + (x0 + bw / 2) + ' 64 L ' + (x0 + (n - 1) * (bw + gap) + bw / 2) + ' 64';
    var mo = svgEl('animateMotion', { dur: '4s', repeatCount: 'indefinite', path: 'M 0 0 L ' + ((n - 1) * (bw + gap)) + ' 0', keyPoints: '0;1', keyTimes: '0;1', calcMode: 'linear' });
    hs.appendChild(mo);
    svg.appendChild(hs);
    // 并行：所有 block 反复同时点亮
    for (var i = 0; i < n; i++) {
      var x = x0 + i * (bw + gap);
      var fl = svgEl('rect', { x: x, y: 160, width: bw, height: 28, rx: 3, fill: BP, opacity: 0 });
      fl.appendChild(anim('opacity', '0;0.85;0;0', '4s', { keyTimes: '0;0.1;0.4;1' }));
      svg.appendChild(fl);
    }
    // 并行行的 cross-attention 网络，以淡色绘制并产生流动效果
    for (i = 0; i < n; i++) {
      for (var j = i + 1; j < n; j++) {
        var ax = x0 + i * (bw + gap) + bw / 2, bx = x0 + j * (bw + gap) + bw / 2;
        if (j - i > 2) continue;
        var web = svgEl('path', { d: 'M ' + ax + ' 160 Q ' + (ax + bx) / 2 + ' 130 ' + bx + ' 160',
          fill: 'none', stroke: BP, 'stroke-width': 1, opacity: 0.18 });
        web.appendChild(anim('opacity', '0;0.5;0;0', '4s', { keyTimes: '0;0.12;0.45;1' }));
        svg.appendChild(web);
      }
    }
    svg.appendChild(svgEl('text', { x: W / 2, y: 214, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)',
      'font-size': 11, fill: MUTE }, [document.createTextNode('串行：t+1 等待 t   对比   并行：一次 matmul')]));
    card(host, '为什么选择 TRANSFORMER', '串行 state 与并行 Attention',
      svg, 'RNN 每次只向前传递一个 hidden state，因此包含 1,000 个 Token 的输入需要执行 1,000 个串行步骤。Transformer 允许每个位置通过一次并行 Matrix multiply 关注其他所有位置。正是这一项选择，也就是舍弃 recurrence，使性能曲线在 2017 年后仍能继续扩展。');
  }

  // ── draft-verify-tokens：低成本 drafter 提议，verifier 接受或拒绝 ─
  function draftVerifyTokens(host) {
    var W = 520, H = 220;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var n = 5, bw = 64, gap = 12, x0 = 60, dy = 50, vy = 140;
    svg.appendChild(svgEl('text', { x: 8, y: dy + 17, 'font-family': 'var(--font-mono,monospace)', 'font-size': 9, fill: MUTE }, [document.createTextNode('DRAFT')]));
    svg.appendChild(svgEl('text', { x: 8, y: vy + 17, 'font-family': 'var(--font-mono,monospace)', 'font-size': 9, fill: BP }, [document.createTextNode('VERIFY')]));
    var accepted = [1, 1, 1, 0, 0]; // 最后两个被拒绝
    for (var i = 0; i < n; i++) {
      var x = x0 + i * (bw + gap);
      // draft Token 从左到右快速出现
      var d = svgEl('rect', { x: x, y: dy, width: bw, height: 30, rx: 4, fill: SOFT, stroke: MUTE, 'stroke-width': 1, opacity: 0 });
      d.appendChild(anim('opacity', '0;1;1;1', '5s', { keyTimes: '0;' + (0.05 + i * 0.04).toFixed(2) + ';0.95;1' }));
      svg.appendChild(d);
      // verifier pass：一次扫描检查全部 Token，然后标记接受（蓝色）或拒绝（警告色）
      var ok = accepted[i];
      var v = svgEl('rect', { x: x, y: vy, width: bw, height: 30, rx: 4,
        fill: 'none', stroke: ok ? BP : WARN, 'stroke-width': 1.6, opacity: 0 });
      v.appendChild(anim('opacity', '0;0;1;1', '5s', { keyTimes: '0;0.55;0.62;1' }));
      svg.appendChild(v);
      var vfill = svgEl('rect', { x: x, y: vy, width: bw, height: 30, rx: 4, fill: ok ? BP : WARN, opacity: 0 });
      vfill.appendChild(anim('opacity', '0;0;' + (ok ? '0.8' : '0.25') + ';' + (ok ? '0.8' : '0.25'), '5s', { keyTimes: '0;0.62;0.7;1' }));
      svg.appendChild(vfill);
      svg.appendChild(svgEl('text', { x: x + bw / 2, y: vy + 47, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)',
        'font-size': 10, fill: ok ? BP : WARN }, [document.createTextNode(ok ? '接受' : '拒绝')]));
    }
    // 一个 verifier 扫描条从头移动到尾，用于表示“一次 forward pass”
    var sweep = svgEl('rect', { x: x0 - 6, y: vy - 6, width: 6, height: 42, fill: BP, opacity: 0.6 });
    sweep.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'translate',
      values: '0 0;' + ((n - 1) * (bw + gap) + bw) + ' 0', dur: '5s', repeatCount: 'indefinite', keyTimes: '0;1' }));
    sweep.appendChild(anim('opacity', '0;0.6;0.6;0;0', '5s', { keyTimes: '0;0.5;0.6;0.65;1' }));
    svg.appendChild(sweep);
    card(host, 'SPECULATIVE DECODING', 'draft → verify → 保留前缀',
      svg, '低成本 drafter 通过多次快速的小型 pass 提议若干 Token。随后，大 Model 在一次 forward pass 中验证所有 Token，接受与自身 Probability Distribution 匹配的最长前缀，并拒绝其余部分。当 draft 足够好时，只需一次大型步骤的成本就能获得多个 Token，而且不会改变输出 Probability Distribution。');
  }

  // ── multi-token-predict：对一个 hidden state 使用多个未来 Token 进行监督 ─
  function multiTokenPredict(host) {
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var hx = 90, hy = 150, hw = 80, hh = 40;
    // 共享的 hidden state
    var h = svgEl('rect', { x: hx, y: hy, width: hw, height: hh, rx: 5, fill: BP, opacity: 0.85 });
    svg.appendChild(h);
    svg.appendChild(svgEl('text', { x: hx + hw / 2, y: hy + 25, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)',
      'font-size': 11, fill: 'var(--bg,#fafaf5)' }, [document.createTextNode('h_t')]));
    // 三个串联的 depth head：t+1、t+2、t+3，每个 head 都会进一步细化并输出
    var depths = ['t+1', 't+2', 't+3'];
    var px = hx + hw + 60;
    depths.forEach(function (lab, k) {
      var y = 40 + k * 56;
      var box = svgEl('rect', { x: px, y: y, width: 70, height: 36, rx: 4, fill: 'none', stroke: BP, 'stroke-width': 1.4 });
      svg.appendChild(box);
      svg.appendChild(svgEl('text', { x: px + 35, y: y + 23, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)',
        'font-size': 11, fill: BP }, [document.createTextNode('MTP ' + lab)]));
      // 从 hidden state 流向该 head，交错执行（顺序细化）
      var ln = svgEl('path', { d: 'M ' + (hx + hw) + ' ' + (hy + hh / 2) + ' C ' + (px - 30) + ' ' + (hy + hh / 2) + ' ' + (px - 30) + ' ' + (y + 18) + ' ' + px + ' ' + (y + 18),
        fill: 'none', stroke: BP, 'stroke-width': 1.5, 'stroke-dasharray': '5 4', opacity: 0.25 });
      ln.appendChild(anim('opacity', '0.2;0.9;0.2', '3.6s', { begin: (k * 0.5) + 's' }));
      ln.appendChild(anim('stroke-dashoffset', '18;0', '0.8s'));
      svg.appendChild(ln);
      // 预测的 Token 从右侧弹出
      var tok = svgEl('rect', { x: px + 100, y: y + 4, width: 30, height: 28, rx: 3, fill: BP, opacity: 0 });
      tok.appendChild(anim('opacity', '0;1;1;0.3', '3.6s', { keyTimes: '0;' + (0.15 + k * 0.15).toFixed(2) + ';0.85;1', begin: (k * 0.5) + 's' }));
      svg.appendChild(tok);
    });
    svg.appendChild(svgEl('text', { x: hx + hw / 2, y: hy + hh + 22, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)',
      'font-size': 10, fill: MUTE }, [document.createTextNode('一个 hidden state')]));
    card(host, 'MULTI-TOKEN PREDICTION', '一个 state，多个未来结果',
      svg, '标准 Training 会监督每个 hidden state 仅预测一个 next Token，这是一种较弱的信号。MTP 增加多个 depth head，每个 head 预测更远一步的 Token，并以串联方式保留因果顺序。更丰富的信号能够强化 backbone，经过 Training 的 head 还可以在 Inference 时兼作 speculative drafter。');
  }

  // ── self-critique-loop：draft answer 循环经历 critique 和 revision ─
  function selfCritiqueLoop(host) {
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var cx = 260, cy = 120, r = 78;
    var stages = [
      { a: -90, t: 'draft' },
      { a: 30, t: 'critique' },
      { a: 150, t: 'revise' }
    ];
    // 循环环路
    svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: SOFT, 'stroke-width': 2 }));
    // 一个表示活动状态的 Token 沿环路移动
    var dot = svgEl('circle', { cx: cx + r, cy: cy, r: 7, fill: BP });
    dot.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'rotate',
      values: '0 ' + cx + ' ' + cy + ';360 ' + cx + ' ' + cy, dur: '6s', repeatCount: 'indefinite' }));
    svg.appendChild(dot);
    stages.forEach(function (s, i) {
      var rad = s.a * Math.PI / 180;
      var nx = cx + r * Math.cos(rad), ny = cy + r * Math.sin(rad);
      var node = svgEl('circle', { cx: nx, cy: ny, r: 11, fill: 'var(--bg,#fafaf5)', stroke: BP, 'stroke-width': 1.6 });
      node.appendChild(anim('fill', 'var(--bg,#fafaf5);' + BP + ';var(--bg,#fafaf5);var(--bg,#fafaf5)', '6s', { keyTimes: '0;' + (0.04 + i * 0.333).toFixed(3) + ';' + (0.2 + i * 0.333).toFixed(3) + ';1' }));
      svg.appendChild(node);
      var lx = nx + (s.a === 30 ? 18 : s.a === 150 ? -18 : 0);
      svg.appendChild(svgEl('text', { x: lx, y: ny + (s.a === -90 ? -18 : 30), 'text-anchor': 'middle',
        'font-family': 'var(--font-mono,monospace)', 'font-size': 11, fill: BP }, [document.createTextNode(s.t)]));
    });
    // 为 critique 节点提供输入的书面 constitution
    svg.appendChild(svgEl('rect', { x: 30, y: 80, width: 96, height: 70, rx: 4, fill: 'none', stroke: MUTE, 'stroke-width': 1 }));
    svg.appendChild(svgEl('text', { x: 78, y: 72, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': 10, fill: MUTE }, [document.createTextNode('constitution')]));
    [0, 1, 2].forEach(function (k) {
      svg.appendChild(svgEl('line', { x1: 42, y1: 100 + k * 16, x2: 114, y2: 100 + k * 16, stroke: MUTE, 'stroke-width': 1, opacity: 0.6 }));
    });
    var feed = svgEl('line', { x1: 126, y1: 115, x2: cx + r * Math.cos(30 * Math.PI / 180) - 12, y2: cy + r * Math.sin(30 * Math.PI / 180),
      stroke: WARN, 'stroke-width': 1.4, 'stroke-dasharray': '4 4', opacity: 0.4 });
    feed.appendChild(anim('stroke-dashoffset', '16;0', '1s'));
    feed.appendChild(anim('opacity', '0.2;0.8;0.2', '6s', { begin: '2s' }));
    svg.appendChild(feed);
    card(host, 'CONSTITUTIONAL AI', '无需人工参与的 critique 与 revise',
      svg, '无需付费请人工提供 preference Label，Model 可以自行评分。它先起草答案，再依据一份书面原则 constitution 对 draft 进行 critique，然后完成 revise。修订后的数据对会成为 Training signal，因此大部分 alignment 工作都在 Model 自身的循环中完成。');
  }

  // ── loss-masking：assistant Token 参与 Loss 计算，Prompt Token 被 mask ─
  function lossMasking(host) {
    var W = 520, H = 200;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var seq = [
      { t: 'system', m: 0 }, { t: 'You', m: 0 }, { t: 'are', m: 0 }, { t: 'helpful', m: 0 },
      { t: 'user', m: 0 }, { t: 'capital?', m: 0 },
      { t: 'assistant', m: 1 }, { t: 'Paris', m: 1 }, { t: '.', m: 1 }
    ];
    var x0 = 14, bw = 52, gap = 6, ty = 70;
    seq.forEach(function (s, i) {
      var x = x0 + i * (bw + gap);
      var on = s.m === 1;
      svg.appendChild(svgEl('rect', { x: x, y: ty, width: bw, height: 34, rx: 4,
        fill: on ? 'var(--bg,#fafaf5)' : SOFT, stroke: on ? BP : MUTE, 'stroke-width': on ? 1.6 : 1 }));
      svg.appendChild(svgEl('text', { x: x + bw / 2, y: ty + 22, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)',
        'font-size': 9, fill: on ? BP : MUTE }, [document.createTextNode(s.t)]));
      // 每个 Token 上方表示 Loss 贡献的柱形
      var lossH = on ? 30 : 0;
      var bar = svgEl('rect', { x: x + 14, y: ty - 6, width: bw - 28, height: 4, rx: 2, fill: on ? BP : SOFT });
      if (on) {
        bar.setAttribute('y', String(ty - lossH));
        bar.setAttribute('height', '0');
        bar.appendChild(anim('height', '0;' + lossH + ';' + lossH + ';0', '3.5s', { keyTimes: '0;0.25;0.85;1', begin: (0.6 + (i - 6) * 0.18) + 's' }));
        bar.appendChild(anim('y', (ty) + ';' + (ty - lossH) + ';' + (ty - lossH) + ';' + ty, '3.5s', { keyTimes: '0;0.25;0.85;1', begin: (0.6 + (i - 6) * 0.18) + 's' }));
      }
      svg.appendChild(bar);
    });
    svg.appendChild(svgEl('text', { x: 14, y: 30, 'font-family': 'var(--font-mono,monospace)', 'font-size': 10, fill: BP }, [document.createTextNode('Loss ↑ 仅作用于 assistant Token')]));
    svg.appendChild(svgEl('text', { x: 14, y: ty + 56, 'font-family': 'var(--font-mono,monospace)', 'font-size': 10, fill: MUTE }, [document.createTextNode('Prompt Token 被 mask，Gradient = 0')]));
    card(host, 'SFT LOSS MASKING', '学习回复，而不是 Prompt',
      svg, '一个聊天示例包含 system、user 和 assistant turn，但 Model 应该只接受如何生成 assistant turn 的 Training。Loss masking 会将每个 Prompt Token 上的 Gradient 清零，使 Model 学会回答问题，而不是记忆并复述问题。');
  }

  // ── activation-recompute：存储少量 Checkpoint，重新计算其余部分 ────────
  function activationRecompute(host) {
    var W = 520, H = 220;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var n = 8, bw = 46, gap = 10, x0 = 50, fy = 60, by = 140;
    svg.appendChild(svgEl('text', { x: 8, y: fy + 18, 'font-family': 'var(--font-mono,monospace)', 'font-size': 9, fill: MUTE }, [document.createTextNode('FWD')]));
    svg.appendChild(svgEl('text', { x: 8, y: by + 18, 'font-family': 'var(--font-mono,monospace)', 'font-size': 9, fill: BP }, [document.createTextNode('BWD')]));
    var ckpt = { 0: 1, 3: 1, 6: 1 }; // 保留 activation 的 layer
    for (var i = 0; i < n; i++) {
      var x = x0 + i * (bw + gap);
      var kept = ckpt[i];
      // forward pass：计算每个 layer，只有 Checkpoint 保持实心
      var f = svgEl('rect', { x: x, y: fy, width: bw, height: 30, rx: 3,
        fill: kept ? BP : SOFT, stroke: kept ? BP : MUTE, 'stroke-width': 1, opacity: kept ? 0.85 : 1 });
      if (!kept) {
        // 非 Checkpoint activation 逐渐消失（丢弃以节省 memory）
        f.appendChild(anim('opacity', '1;1;0.12;0.12', '5s', { keyTimes: '0;0.28;0.36;1' }));
      }
      svg.appendChild(f);
      if (kept) svg.appendChild(svgEl('text', { x: x + bw / 2, y: fy - 6, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': 8, fill: BP }, [document.createTextNode('保存')]));
      // backward pass 槽位
      svg.appendChild(svgEl('rect', { x: x, y: by, width: bw, height: 30, rx: 3, fill: 'none', stroke: SOFT, 'stroke-width': 1 }));
    }
    // backward sweep：从最近的 Checkpoint 开始，由右向左重新计算被丢弃的 layer
    var rc = svgEl('rect', { x: 0, y: by, width: bw, height: 30, rx: 3, fill: WARN, opacity: 0.5 });
    rc.appendChild(anim('x', (x0 + (n - 1) * (bw + gap)) + ';' + x0, '5s', { keyTimes: '0;1', begin: '0s', calcMode: 'linear' }));
    rc.appendChild(anim('opacity', '0;0;0.55;0.55;0', '5s', { keyTimes: '0;0.45;0.5;0.95;1' }));
    svg.appendChild(rc);
    svg.appendChild(svgEl('text', { x: W / 2, y: by + 52, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)',
      'font-size': 10, fill: MUTE }, [document.createTextNode('在 backward 期间重新计算被丢弃的 activation')]));
    card(host, 'GRADIENT CHECKPOINTING', '用 FLOPs 换取 memory',
      svg, 'Backward 需要 forward activation，但全部保留会超出 memory 预算。Checkpointing 只保存少数几个 layer（实心），并丢弃其余 layer。在 backward 期间，每个被丢弃的区段都会从最近的 Checkpoint 开始重新计算。通过增加少量 compute，可以显著降低峰值 memory。');
  }

  LF.register({
    'expert-routing': expertRouting,
    'encoder-decoder': encoderDecoder,
    'rnn-vs-parallel': rnnVsParallel,
    'draft-verify-tokens': draftVerifyTokens,
    'multi-token-predict': multiTokenPredict,
    'self-critique-loop': selfCritiqueLoop,
    'loss-masking': lossMasking,
    'activation-recompute': activationRecompute
  });
})();
