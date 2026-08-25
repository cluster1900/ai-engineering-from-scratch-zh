/* figures-capstone-d.js - Phase 19 capstone 的动画课程图示
   涵盖 51-87 范围内的项目（query rewriting / HyDE、经典指标、
   perplexity + calibration、ZeRO sharding、pipeline parallel、jailbreak
   taxonomy、prompt-injection detector、constitutional rules engine）。
   在 lesson-figures.js 之后加载，通过 window.LF 注册。仅使用 SMIL motion，
   不使用 JS 循环或 rAF。ES5、无依赖，通过 CSS 变量适配主题。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var svgEl = LF.svgEl, el = LF.el;

  function svg(h) { return svgEl('svg', { viewBox: '0 0 520 ' + h }); }
  function shell(host, label, sub, node, cap) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [sub])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out' }, [node])]),
      el('div', { class: 'lf-cap' }, [cap])
    ]));
  }
  function anim(attr, vals, dur, extra) {
    var a = { attributeName: attr, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animate', a);
  }
  function txt(x, y, s, size, fill, anchor) {
    var t = svgEl('text', { x: x, y: y, 'text-anchor': anchor || 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': size || '11', fill: fill || 'var(--ink,#1a1a1a)' });
    t.appendChild(document.createTextNode(s));
    return t;
  }
  function rect(x, y, w, h, fill, stroke) {
    return svgEl('rect', { x: x, y: y, width: w, height: h, rx: '4', fill: fill || 'var(--bg-surface,#eee)', stroke: stroke || 'var(--rule-soft,#ddd)', 'stroke-width': '1.4' });
  }

  // ── cd-hyde-vector (67)：query Vector 未命中，假设文档落入目标区域 ─
  function cdHyde(host) {
    var s = svg(250), CX = 150, CY = 130, R = 96;
    s.appendChild(svgEl('circle', { cx: CX, cy: CY, r: R, fill: 'none', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1.2', 'stroke-dasharray': '4 4' }));
    s.appendChild(txt(CX, 26, 'Embedding 空间', '10', 'var(--ink-mute,#777)'));
    // 目标区域 = 答案文档所在的位置
    var tgX = CX + 64, tgY = CY - 40;
    s.appendChild(svgEl('circle', { cx: tgX, cy: tgY, r: '26', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.4' }));
    s.appendChild(txt(tgX, tgY + 4, '文档', '10', 'var(--blueprint,#3553ff)'));
    // 原始 query Vector 指向了错误方向
    var qX = CX - 58, qY = CY + 46;
    s.appendChild(svgEl('line', { x1: CX, y1: CY, x2: qX, y2: qY, stroke: 'var(--ink-mute,#777)', 'stroke-width': '2' }));
    s.appendChild(txt(qX - 4, qY + 14, 'query Vector', '9', 'var(--ink-mute,#777)', 'middle'));
    // 假设文档 Vector 从 query 方向扫向目标
    var hyp = svgEl('line', { x1: CX, y1: CY, x2: qX, y2: qY, stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2.4' });
    hyp.appendChild(svgEl('animate', { attributeName: 'x2', values: qX + ';' + tgX + ';' + tgX + ';' + qX, keyTimes: '0;0.45;0.85;1', dur: '4.2s', repeatCount: 'indefinite' }));
    hyp.appendChild(svgEl('animate', { attributeName: 'y2', values: qY + ';' + tgY + ';' + tgY + ';' + qY, keyTimes: '0;0.45;0.85;1', dur: '4.2s', repeatCount: 'indefinite' }));
    s.appendChild(hyp);
    // 移动的端点标记
    var tip = svgEl('circle', { cx: qX, cy: qY, r: '5', fill: 'var(--blueprint,#3553ff)' });
    tip.appendChild(svgEl('animate', { attributeName: 'cx', values: qX + ';' + tgX + ';' + tgX + ';' + qX, keyTimes: '0;0.45;0.85;1', dur: '4.2s', repeatCount: 'indefinite' }));
    tip.appendChild(svgEl('animate', { attributeName: 'cy', values: qY + ';' + tgY + ';' + tgY + ';' + qY, keyTimes: '0;0.45;0.85;1', dur: '4.2s', repeatCount: 'indefinite' }));
    s.appendChild(tip);
    // 右侧列：LLM 先编写一个虚构答案
    var bx = 320;
    s.appendChild(txt(bx, 56, 'LLM 编写一个', '10', 'var(--ink-soft,#555)', 'start'));
    s.appendChild(txt(bx, 70, '假设答案：', '10', 'var(--ink-soft,#555)', 'start'));
    var rows = ['"AbortMultipartOnFail', '会中止 S3 上传', '并递减', '重试预算..."'];
    var i;
    for (i = 0; i < rows.length; i++) {
      var ln = txt(bx, 96 + i * 18, rows[i], '9', 'var(--blueprint,#3553ff)', 'start');
      ln.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;0;1;1', keyTimes: '0;' + (0.1 + i * 0.06).toFixed(2) + ';' + (0.22 + i * 0.06).toFixed(2) + ';1', dur: '4.2s', repeatCount: 'indefinite' }));
      s.appendChild(ln);
    }
    s.appendChild(txt(bx, 188, 'Embedding 它，', '9', 'var(--ink-mute,#777)', 'start'));
    s.appendChild(txt(bx, 202, '而不是问题', '9', 'var(--ink-mute,#777)', 'start'));
    shell(host, 'HyDE QUERY REWRITE', '虚构答案落入目标区域', s,
      '原始 query Vector 指向错误区域，因此答案文档永远无法进入 top-N。HyDE 要求 Model 编写能够回答该问题的文档，然后改为对这个假设答案执行 Embedding，使 retrieval Vector 落到真实文档所在的位置。');
  }

  // ── cd-bleu-overlap (71)：将 candidate n-gram 与 reference 进行匹配 ─────
  function cdBleu(host) {
    var s = svg(230), PAD = 30, ROWY = 70, refY = 150, bw = 56, gap = 10;
    var cand = ['the', 'cat', 'sat', 'on', 'mat'];
    var ref = ['the', 'cat', 'sat', 'on', 'a', 'mat'];
    // candidate 中匹配的索引（the、cat、sat、on、mat 均存在）
    var matched = [1, 1, 1, 1, 1];
    s.appendChild(txt(PAD, ROWY - 16, 'candidate', '10', 'var(--ink-soft,#555)', 'start'));
    s.appendChild(txt(PAD, refY - 14, 'reference', '10', 'var(--ink-soft,#555)', 'start'));
    var i;
    for (i = 0; i < cand.length; i++) {
      var cx = PAD + i * (bw + gap);
      var on = matched[i];
      var box = rect(cx, ROWY, bw, 28, on ? 'var(--bg-surface,#eee)' : 'var(--bg,#fafaf5)', on ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#ddd)');
      box.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0.4;1;1', keyTimes: '0;' + (0.12 + i * 0.12).toFixed(2) + ';1', dur: '3.6s', repeatCount: 'indefinite' }));
      s.appendChild(box);
      s.appendChild(txt(cx + bw / 2, ROWY + 19, cand[i], '11', on ? 'var(--blueprint,#3553ff)' : 'var(--ink-mute,#777)'));
    }
    for (i = 0; i < ref.length; i++) {
      var rx = PAD + i * (bw * 5 / 6 + gap);
      s.appendChild(rect(rx, refY, bw - 6, 26, 'var(--bg,#fafaf5)', 'var(--rule-soft,#ddd)'));
      s.appendChild(txt(rx + (bw - 6) / 2, refY + 18, ref[i], '10', 'var(--ink-mute,#777)'));
    }
    // 逐条淡入的匹配连线
    for (i = 0; i < cand.length; i++) {
      var x1 = PAD + i * (bw + gap) + bw / 2;
      var rIdx = i < 4 ? i : 5;
      var x2 = PAD + rIdx * (bw * 5 / 6 + gap) + (bw - 6) / 2;
      var mline = svgEl('line', { x1: x1, y1: ROWY + 28, x2: x2, y2: refY, stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.4', opacity: '0.7' });
      mline.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;0;0.7;0.7', keyTimes: '0;' + (0.12 + i * 0.12).toFixed(2) + ';' + (0.2 + i * 0.12).toFixed(2) + ';1', dur: '3.6s', repeatCount: 'indefinite' }));
      s.appendChild(mline);
    }
    var score = txt(440, ROWY + 4, '5/5', '12', 'var(--blueprint,#3553ff)', 'start');
    score.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;0;1;1', keyTimes: '0;0.7;0.8;1', dur: '3.6s', repeatCount: 'indefinite' }));
    s.appendChild(score);
    s.appendChild(txt(440, ROWY + 20, 'precision', '8', 'var(--ink-mute,#777)', 'start'));
    s.appendChild(txt(440, ROWY + 40, 'BP < 1', '9', 'var(--warn,#b8870f)', 'start'));
    s.appendChild(txt(440, ROWY + 54, '（过短）', '8', 'var(--ink-mute,#777)', 'start'));
    shell(host, 'BLEU N-GRAM OVERLAP', '统计匹配、截断计数、施加惩罚', s,
      'BLEU 本质上是在计数。candidate 中每个出现在 reference 里的 n-gram 都会得到一次匹配；截断后的匹配数除以 candidate 长度，就是 modified n-gram precision。比 reference 更短的 candidate 会受到 brevity penalty，因此即使一个残缺片段具有很高的 precision，最终得分仍会降低。ROUGE-L 则奖励 longest common subsequence。');
  }

  // ── cd-reliability (73)：calibration reliability diagram 向对角线移动 ─
  function cdReliability(host) {
    var s = svg(250), X0 = 60, Y0 = 30, SZ = 180, Y1 = Y0 + SZ;
    // 坐标轴
    s.appendChild(svgEl('line', { x1: X0, y1: Y0, x2: X0, y2: Y1, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
    s.appendChild(svgEl('line', { x1: X0, y1: Y1, x2: X0 + SZ, y2: Y1, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
    // perfect calibration 对角线
    s.appendChild(svgEl('line', { x1: X0, y1: Y1, x2: X0 + SZ, y2: Y0, stroke: 'var(--ink-mute,#777)', 'stroke-width': '1.2', 'stroke-dasharray': '4 4' }));
    s.appendChild(txt(X0 + SZ - 4, Y0 + 30, '完美', '9', 'var(--ink-mute,#777)', 'end'));
    s.appendChild(txt(X0 + SZ / 2, Y1 + 22, '预测 confidence', '9', 'var(--ink-soft,#555)'));
    var lab = svgEl('text', { x: X0 - 16, y: Y0 + SZ / 2, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': '9', fill: 'var(--ink-soft,#555)', transform: 'rotate(-90 ' + (X0 - 16) + ' ' + (Y0 + SZ / 2) + ')' });
    lab.appendChild(document.createTextNode('观测 accuracy'));
    s.appendChild(lab);
    // 五个 confidence bin：overconfident（位于对角线下方），随后向上滑至对角线
    var confs = [0.1, 0.3, 0.5, 0.7, 0.9];
    var acc = [0.08, 0.2, 0.34, 0.5, 0.62]; // overconfident
    var i;
    for (i = 0; i < confs.length; i++) {
      var cx = X0 + confs[i] * SZ;
      var yBad = Y1 - acc[i] * SZ;
      var yGood = Y1 - confs[i] * SZ;
      // 从基线延伸到数据点的柱线
      var bh = (yBad < yGood ? yBad : yGood);
      var dot = svgEl('circle', { cx: cx, cy: yBad, r: '5', fill: 'var(--blueprint,#3553ff)' });
      dot.appendChild(svgEl('animate', { attributeName: 'cy', values: yBad + ';' + yGood + ';' + yGood + ';' + yBad, keyTimes: '0;0.4;0.7;1', dur: '4.5s', begin: (i * 0.08) + 's', repeatCount: 'indefinite' }));
      s.appendChild(dot);
      // gap 线（ECE contribution）
      var gapl = svgEl('line', { x1: cx, y1: yBad, x2: cx, y2: yGood, stroke: 'var(--warn,#b8870f)', 'stroke-width': '2' });
      gapl.appendChild(svgEl('animate', { attributeName: 'y1', values: yBad + ';' + yGood + ';' + yGood + ';' + yBad, keyTimes: '0;0.4;0.7;1', dur: '4.5s', begin: (i * 0.08) + 's', repeatCount: 'indefinite' }));
      s.appendChild(gapl);
    }
    var tag = txt(X0 + 14, Y0 + 14, 'ECE：与对角线的 gap', '9', 'var(--warn,#b8870f)', 'start');
    s.appendChild(tag);
    shell(host, 'CALIBRATION RELIABILITY', 'confidence 与 accuracy', s,
      '按声明的 confidence 对预测进行分箱，并绘制观测 accuracy。经过 calibration 的 Model 会落在对角线上。橙色 gap 表示 Model 声称的 confidence 超过了实际表现；expected calibration error 是这些 gap 按 bin 加权后的平均值。Perplexity 询问 held-out 文本是否合理，而 calibration 询问 confidence 是否诚实。');
  }

  // ── cd-zero-shard (78)：Optimizer state 分散到各 rank，先 scatter 再 gather ─
  function cdZero(host) {
    var s = svg(240), n = 4, PAD = 36, bw = 88, gap = (520 - 2 * PAD - n * bw) / (n - 1);
    var topY = 44, optY = 96, optH = 70;
    s.appendChild(txt(PAD, 28, '每个 rank：完整参数，但只有 1/N 的 optimiser', '10', 'var(--ink-soft,#777)', 'start'));
    var i;
    for (i = 0; i < n; i++) {
      var x = PAD + i * (bw + gap);
      // 完整参数带（复制）
      s.appendChild(rect(x, topY, bw, 22, 'var(--bg-surface,#eee)', 'var(--rule-soft,#ddd)'));
      s.appendChild(txt(x + bw / 2, topY + 15, '参数', '9', 'var(--ink-mute,#777)'));
      // 仅包含当前 rank 拥有的 optimiser shard
      var shard = rect(x, optY, bw, optH, 'var(--bg-surface,#eee)', 'var(--blueprint,#3553ff)');
      s.appendChild(shard);
      s.appendChild(txt(x + bw / 2, optY + 26, 'Adam', '9', 'var(--blueprint,#3553ff)'));
      s.appendChild(txt(x + bw / 2, optY + 40, 'shard ' + i, '9', 'var(--blueprint,#3553ff)'));
      s.appendChild(txt(x + bw / 2, optY + optH + 16, 'rank ' + i, '9', 'var(--ink-soft,#555)'));
      // reduce_scatter 输入箭头（Gradient shard 到达）
      var rs = svgEl('path', { d: 'M ' + (x + bw / 2) + ' ' + (optY - 14) + ' L ' + (x + bw / 2) + ' ' + (optY - 2), stroke: 'var(--ink-mute,#777)', 'stroke-width': '2' });
      s.appendChild(rs);
      var rsm = svgEl('circle', { cx: x + bw / 2, cy: optY - 14, r: '3.5', fill: 'var(--warn,#b8870f)' });
      rsm.appendChild(svgEl('animate', { attributeName: 'cy', values: (optY - 28) + ';' + (optY - 4), keyTimes: '0;1', dur: '1.8s', begin: '0s', repeatCount: 'indefinite' }));
      rsm.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;1;1;0', keyTimes: '0;0.2;0.8;1', dur: '1.8s', repeatCount: 'indefinite' }));
      s.appendChild(rsm);
      // allgather 脉冲：完成 step 后向外广播更新后的 shard
      var pulse = svgEl('circle', { cx: x + bw / 2, cy: optY + optH / 2, r: '4', fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' });
      pulse.appendChild(svgEl('animate', { attributeName: 'r', values: '4;26', keyTimes: '0;1', dur: '1.8s', begin: '0.9s', repeatCount: 'indefinite' }));
      pulse.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0.7;0', keyTimes: '0;1', dur: '1.8s', begin: '0.9s', repeatCount: 'indefinite' }));
      s.appendChild(pulse);
    }
    s.appendChild(txt(PAD, 218, 'reduce_scatter Gradient 输入', '9', 'var(--warn,#b8870f)', 'start'));
    s.appendChild(txt(520 - PAD, 218, 'allgather 参数输出', '9', 'var(--blueprint,#3553ff)', 'end'));
    shell(host, 'ZeRO STATE SHARDING', '每个 rank 分配 1/N 的 optimiser', s,
      '原生 DDP 会在每个 rank 上复制 optimiser state，而它是整个技术栈中占用最大的分配项。ZeRO stage 1 让每个 rank 只保留 1/N 的 Adam moments。reduce_scatter 将对应的 Gradient shard 交付给每个 rank，由其在本地执行 step，然后 allgather 广播更新后的 parameter shard，使每个 rank 重建完整 Model。内存占用线性下降；网络传输成本等同于一次 allreduce。');
  }

  // ── cd-pipeline-bubble (79)：microbatch 流经各 stage，bubble 逐步排空 ──
  function cdPipeline(host) {
    var s = svg(240), N = 4, M = 4, PAD = 50, cellW = 57, cellH = 26, gap = 6;
    var rowY = 40;
    var i, j;
    // stage 行标签
    for (i = 0; i < N; i++) {
      s.appendChild(txt(PAD - 8, rowY + i * (cellH + gap) + 17, 'stage ' + i, '9', 'var(--ink-soft,#555)', 'end'));
      // 基线轨道
      s.appendChild(svgEl('line', { x1: PAD, y1: rowY + i * (cellH + gap) + cellH / 2, x2: PAD + (M + N) * cellW, y2: rowY + i * (cellH + gap) + cellH / 2, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '0.6' }));
    }
    // 对角流：microbatch m 在时间 t = m + i 时占用 stage i
    var period = 4.4;
    for (j = 0; j < M; j++) {
      for (i = 0; i < N; i++) {
        var slot = j + i;
        var x = PAD + slot * cellW + 4;
        var y = rowY + i * (cellH + gap);
        var c = rect(x, y, cellW - 8, cellH, 'var(--bg-surface,#eee)', 'var(--blueprint,#3553ff)');
        var begin = (slot * 0.18).toFixed(2);
        c.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0.12;1;1;0.35', keyTimes: '0;0.18;0.7;1', dur: period + 's', begin: begin + 's', repeatCount: 'indefinite' }));
        s.appendChild(c);
        var lab = txt(x + (cellW - 8) / 2, y + 17, 'mb' + j, '9', 'var(--blueprint,#3553ff)');
        lab.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;1;1;0.4', keyTimes: '0;0.18;0.7;1', dur: period + 's', begin: begin + 's', repeatCount: 'indefinite' }));
        s.appendChild(lab);
      }
    }
    // bubble 阴影：右上角和左下角的空闲三角形
    s.appendChild(txt(PAD + (M + N - 1) * cellW, rowY - 6, 'bubble', '9', 'var(--warn,#b8870f)', 'middle'));
    var bub = svgEl('path', { d: 'M ' + (PAD + M * cellW) + ' ' + rowY + ' L ' + (PAD + (M + N - 1) * cellW) + ' ' + rowY + ' L ' + (PAD + (M + N - 1) * cellW) + ' ' + (rowY + (N - 1) * (cellH + gap)) + ' Z', fill: 'var(--warn,#b8870f)', opacity: '0.12' });
    s.appendChild(bub);
    s.appendChild(txt(PAD, 215, 'bubble 比例 = (N-1)/(M+N-1)  =  3/7  ≈  43%，其中 M=4、N=4', '10', 'var(--ink-soft,#555)', 'start'));
    shell(host, 'PIPELINE PARALLEL', 'microbatch 填充各个 stage', s,
      '每个 stage 位于独立的 rank 上；一个 microbatch 进入 stage 0，将其 activation 交给 stage 1，并随时间沿对角线依次传递。阴影三角形就是 bubble，也就是 pipeline 填充和排空期间的空闲时间。每个 step 使用更多 microbatch 可以缩小 bubble：(N-1)/(M+N-1) 会从 M=4 时的 43% 降至 M=64 时的 5% 以下。');
  }

  // ── cd-attack-taxonomy (82)：围绕 assistant 的六种 trust boundary ──────
  function cdTaxonomy(host) {
    var s = svg(260), CX = 260, CY = 130, R = 92;
    var cats = [
      ['role-play', 'persona'],
      ['instruction-override', 'system authority'],
      ['context-smuggling', 'content/instruction gap'],
      ['multi-turn-ramp', 'history as contract'],
      ['encoding-trick', 'surface form'],
      ['prefix-injection', 'next-token']
    ];
    // assistant 核心
    s.appendChild(svgEl('circle', { cx: CX, cy: CY, r: '34', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.6' }));
    s.appendChild(txt(CX, CY - 2, 'assistant', '10', 'var(--blueprint,#3553ff)'));
    s.appendChild(txt(CX, CY + 12, 'trust 核心', '9', 'var(--ink-mute,#777)'));
    var i;
    for (i = 0; i < 6; i++) {
      var ang = (i / 6) * 2 * Math.PI - Math.PI / 2;
      var nx = CX + R * Math.cos(ang), ny = CY + R * Math.sin(ang);
      // 辐条
      s.appendChild(svgEl('line', { x1: CX + 34 * Math.cos(ang), y1: CY + 34 * Math.sin(ang), x2: nx, y2: ny, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
      // 沿辐条向内移动的攻击脉冲，各类别交错开始
      var pulse = svgEl('circle', { cx: nx, cy: ny, r: '3.5', fill: 'var(--warn,#b8870f)' });
      pulse.appendChild(svgEl('animate', { attributeName: 'cx', values: nx + ';' + (CX + 36 * Math.cos(ang)), keyTimes: '0;1', dur: '2.4s', begin: (i * 0.4) + 's', repeatCount: 'indefinite' }));
      pulse.appendChild(svgEl('animate', { attributeName: 'cy', values: ny + ';' + (CY + 36 * Math.sin(ang)), keyTimes: '0;1', dur: '2.4s', begin: (i * 0.4) + 's', repeatCount: 'indefinite' }));
      pulse.appendChild(svgEl('animate', { attributeName: 'opacity', values: '1;1;0', keyTimes: '0;0.7;1', dur: '2.4s', begin: (i * 0.4) + 's', repeatCount: 'indefinite' }));
      s.appendChild(pulse);
      // 节点
      var anchor = Math.cos(ang) > 0.2 ? 'start' : Math.cos(ang) < -0.2 ? 'end' : 'middle';
      var lx = nx + (anchor === 'start' ? 8 : anchor === 'end' ? -8 : 0);
      s.appendChild(svgEl('circle', { cx: nx, cy: ny, r: '6', fill: 'var(--bg,#fafaf5)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.4' }));
      s.appendChild(txt(lx, ny - 2, cats[i][0], '9', 'var(--ink,#1a1a1a)', anchor));
      s.appendChild(txt(lx, ny + 10, cats[i][1], '8', 'var(--ink-mute,#777)', anchor));
    }
    shell(host, 'JAILBREAK TAXONOMY', '六种 trust boundary', s,
      '没有 taxonomy 的 safety harness 无异于抛硬币。六个类别中的每一个都对应攻击会滥用的一种 trust boundary，范围从 assistant persona 到其 next-token 决策。为 boundary 命名，可以把攻击流转化为直方图，把直方图转化为 coverage chart，再把图表转化为下一个 sprint。');
  }

  // ── cd-output-router (85)：三个输出 classifier 汇入 policy router ─────
  function cdRouter(host) {
    var s = svg(250), PAD = 24, clsX = 36, clsW = 150, rtX = 244, rtW = 96;
    var cls = [
      [60, 'toxicity', '侮辱词 / 骚扰', 'low'],
      [125, 'PII', 'email · SSN · card', 'medium'],
      [190, 'leakage', 'system-prompt 回显', 'high']
    ];
    s.appendChild(txt(clsX, 28, 'Model 输出 → 三个 classifier 并行运行', '10', 'var(--ink-soft,#555)', 'start'));
    var actions = [
      [54, '记录', 'var(--ink-mute,#777)'],
      [104, '警告', 'var(--ink-soft,#555)'],
      [154, '脱敏', 'var(--warn,#b8870f)'],
      [204, '阻止', 'var(--warn,#b8870f)']
    ];
    // router 节点
    s.appendChild(rect(rtX, 96, rtW, 64, 'var(--bg-surface,#eee)', 'var(--blueprint,#3553ff)'));
    s.appendChild(txt(rtX + rtW / 2, 122, 'policy', '11', 'var(--blueprint,#3553ff)'));
    s.appendChild(txt(rtX + rtW / 2, 138, 'router', '11', 'var(--blueprint,#3553ff)'));
    var i;
    for (i = 0; i < cls.length; i++) {
      var cy = cls[i][0];
      s.appendChild(rect(clsX, cy, clsW, 44, 'var(--bg,#fafaf5)', 'var(--rule-soft,#ddd)'));
      s.appendChild(txt(clsX + clsW / 2, cy + 18, cls[i][1], '11', 'var(--ink,#1a1a1a)'));
      s.appendChild(txt(clsX + clsW / 2, cy + 34, cls[i][2], '8', 'var(--ink-mute,#777)'));
      // 传入 router 的判定数据包，各分类器交错发送
      var pkt = svgEl('circle', { cx: clsX + clsW + 4, cy: cy + 22, r: '4.5', fill: 'var(--warn,#b8870f)' });
      pkt.appendChild(svgEl('animate', { attributeName: 'cx', values: (clsX + clsW + 4) + ';' + rtX, keyTimes: '0;1', dur: '1.4s', begin: (i * 0.3) + 's', repeatCount: 'indefinite' }));
      pkt.appendChild(svgEl('animate', { attributeName: 'cy', values: (cy + 22) + ';128', keyTimes: '0;1', dur: '1.4s', begin: (i * 0.3) + 's', repeatCount: 'indefinite' }));
      pkt.appendChild(svgEl('animate', { attributeName: 'opacity', values: '1;1;0', keyTimes: '0;0.7;1', dur: '1.4s', begin: (i * 0.3) + 's', repeatCount: 'indefinite' }));
      s.appendChild(pkt);
      s.appendChild(svgEl('line', { x1: clsX + clsW, y1: cy + 22, x2: rtX, y2: 128, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '0.8' }));
    }
    // action 阶梯，最高 severity 胜出 → block 亮起
    for (i = 0; i < actions.length; i++) {
      var ay = actions[i][0];
      var hot = (i === 3);
      var ab = rect(rtX + rtW + 22, ay, 90, 30, 'var(--bg,#fafaf5)', hot ? 'var(--warn,#b8870f)' : 'var(--rule-soft,#ddd)');
      if (hot) ab.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0.3;0.3;1;1;0.3', keyTimes: '0;0.6;0.72;0.95;1', dur: '4.2s', repeatCount: 'indefinite' }));
      s.appendChild(ab);
      s.appendChild(txt(rtX + rtW + 22 + 45, ay + 19, actions[i][1], '10', actions[i][2]));
    }
    s.appendChild(txt(rtX + rtW + 22 + 45, 26, 'severity → action', '8', 'var(--ink-mute,#777)'));
    shell(host, 'OUTPUT POLICY ROUTER', 'classifier → severity → action', s,
      '仅检查输入还不够；输出侧 classifier 会看到实际响应，并判断它能否安全交付。三个独立 classifier（toxicity、PII、leakage）返回 severity，router 根据最严重的发现选择 action：记录、警告、脱敏或阻止。classifier 与 streaming 并行运行，因此延迟会隐藏在最终 flush 之前。');
  }

  // ── cd-constitution-loop (86)：draft、rules、fixer、revised、再次检查 ─────────
  function cdConstitution(host) {
    var s = svg(240), CX = 260, CY = 116;
    var nodes = [
      [90, 70, 'draft'],
      [260, 50, 'rules engine'],
      [430, 70, 'fixer'],
      [430, 170, 'revised'],
      [260, 190, 'rules 第 2 次检查'],
      [90, 170, 'verdict']
    ];
    var i;
    // 圆环连接路径，圆点沿此路径移动（圆角六边形顺序）
    var pts = [];
    for (i = 0; i < nodes.length; i++) { pts.push([nodes[i][0], nodes[i][1]]); }
    var pathD = 'M ' + pts[0][0] + ' ' + pts[0][1];
    for (i = 1; i < pts.length; i++) { pathD += ' L ' + pts[i][0] + ' ' + pts[i][1]; }
    pathD += ' Z';
    s.appendChild(svgEl('path', { d: pathD, fill: 'none', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1.4', 'stroke-dasharray': '5 5' }));
    // rules engine 节点上的违规标记脉冲
    for (i = 0; i < nodes.length; i++) {
      var nx = nodes[i][0], ny = nodes[i][1];
      var isRule = (i === 1 || i === 4);
      s.appendChild(svgEl('rect', { x: nx - 52, y: ny - 15, width: 104, height: 30, rx: '5', fill: 'var(--bg-surface,#eee)', stroke: isRule ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#ddd)', 'stroke-width': '1.4' }));
      s.appendChild(txt(nx, ny + 4, nodes[i][2], '10', isRule ? 'var(--blueprint,#3553ff)' : 'var(--ink,#1a1a1a)'));
    }
    // 使用 animateMotion 沿循环移动的 Token
    var mover = svgEl('circle', { r: '6', fill: 'var(--warn,#b8870f)' });
    var motion = svgEl('animateMotion', { dur: '5.4s', repeatCount: 'indefinite', path: pathD });
    mover.appendChild(motion);
    s.appendChild(mover);
    // 在 rules engine 处闪烁的违规徽标
    var badge = txt(CX, 30, '违规：代码缺少可运行代码块', '9', 'var(--warn,#b8870f)');
    badge.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;1;1;0', keyTimes: '0;0.1;0.25;0.4', dur: '5.4s', repeatCount: 'indefinite' }));
    s.appendChild(badge);
    var ok = txt(CX, 218, '已接受：修订内容满足所有规则', '9', 'var(--blueprint,#3553ff)');
    ok.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;0;1;1;0', keyTimes: '0;0.6;0.72;0.92;1', dur: '5.4s', repeatCount: 'indefinite' }));
    s.appendChild(ok);
    shell(host, 'CONSTITUTIONAL RULES', 'draft → 修复 → 再次检查', s,
      '一条规则由名称、predicate 和解释组成；缺少其中任何一项，都只能算模糊倾向。constitution 以 YAML 形式存放在版本控制中。engine 标记每项违规，fixer 提出修订，然后执行第二次检查，确认修订内容满足所有规则，之后才接受响应或将其升级处理。');
  }

  LF.register({
    'cd-hyde-vector': cdHyde,
    'cd-bleu-overlap': cdBleu,
    'cd-reliability-diagram': cdReliability,
    'cd-zero-shard': cdZero,
    'cd-pipeline-bubble': cdPipeline,
    'cd-attack-taxonomy': cdTaxonomy,
    'cd-output-router': cdRouter,
    'cd-constitution-loop': cdConstitution
  });
})();
