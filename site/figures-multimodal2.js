/* figures-multimodal2.js — Phase 12（Multimodal AI）的动画课程图示，
   第二组。在 lesson-figures.js 之后加载，使用共享的 LF 工具包，并
   通过 LF.register 注册。无依赖，仅限 ES5，通过 CSS 变量设置主题。每个图示
   都是自行运行的 SMIL 动画（无 JS 循环，无实际计算）。编写方式与
   docs/en.md 中带围栏的 ```figure 块相同。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;

  function wrap(host, svg) { host.appendChild(el('div', { class: 'lf-out' }, [svg])); }
  function svgFor(h) { return svgEl('svg', { viewBox: '0 0 520 ' + h }); }
  function txt(x, y, s, anchor, color, size) {
    return svgEl('text', { x: String(x), y: String(y), 'text-anchor': anchor || 'middle', 'font-size': String(size || 10), 'font-family': 'monospace', fill: color || 'var(--ink-soft,#555)' }, [document.createTextNode(s)]);
  }
  function anim(attr, vals, kt, dur, extra) {
    var a = { attributeName: attr, values: vals, keyTimes: kt, dur: dur, repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animate', a);
  }
  function cap(host, label, hint, text) {
    host.insertBefore(el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [hint])]), host.firstChild);
    host.appendChild(el('div', { class: 'lf-cap' }, [text]));
    host.classList.add('lf');
  }

  // ── mm-patch-n-pack：不同分辨率的图像汇入一个打包序列 ───────────────────
  function patchNPack(host) {
    var svg = svgFor(250), B = 'var(--blueprint,#3553ff)', W = 'var(--warn,#b8870f)';
    var imgs = [
      { x: 18, y: 30, w: 70, h: 54, n: 4, col: B },     // 横向图像，4 个 patch
      { x: 18, y: 96, w: 40, h: 80, n: 3, col: W },      // 纵向图像，3 个 patch
      { x: 18, y: 188, w: 56, h: 40, n: 2, col: B }      // 小图像，2 个 patch
    ];
    svg.appendChild(txt(53, 18, '不同分辨率的图像', 'middle', 'var(--ink-mute,#777)', 10));
    svg.appendChild(txt(360, 18, '一个打包序列（块对角 mask）', 'middle', 'var(--ink-mute,#777)', 10));
    var slot = 0, total = imgs.reduce(function (a, im) { return a + im.n; }, 0), seqX = 230, cw = 26;
    imgs.forEach(function (im, gi) {
      svg.appendChild(svgEl('rect', { x: im.x, y: im.y, width: im.w, height: im.h, fill: 'none', stroke: im.col, 'stroke-width': '1.4', 'stroke-opacity': '0.7' }));
      var k;
      for (k = 0; k < im.n; k++) {
        var cy = im.y + (k + 0.5) * im.h / im.n;
        var dot = svgEl('circle', { cx: im.x + im.w / 2, cy: cy.toFixed(1), r: '5', fill: im.col });
        var destX = seqX + slot * cw + cw / 2;
        var delay = (slot * 0.18).toFixed(2) + 's';
        dot.appendChild(anim('cx', (im.x + im.w / 2) + ';' + destX + ';' + destX, '0;0.5;1', '3.6s', { begin: delay }));
        dot.appendChild(anim('cy', cy.toFixed(1) + ';' + '128;128', '0;0.5;1', '3.6s', { begin: delay }));
        svg.appendChild(dot);
        slot++;
      }
    });
    // 序列轨道
    svg.appendChild(svgEl('rect', { x: seqX, y: 110, width: total * cw, height: 36, fill: 'none', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
    var s2;
    for (s2 = 1; s2 < total; s2++) {
      svg.appendChild(svgEl('line', { x1: seqX + s2 * cw, y1: 110, x2: seqX + s2 * cw, y2: 146, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1', 'stroke-dasharray': '2 2' }));
    }
    svg.appendChild(txt(seqX + total * cw / 2, 166, total + ' 个 patch Token · 0 padding', 'middle', 'var(--ink-soft,#555)', 10));
    wrap(host, svg);
    cap(host, 'PATCH-N-PACK', '图像汇入一个序列',
      '每张图像都保留其原始宽高比，并贡献各自数量的 patch：一张宽图表、一张长收据、一个小图标。Patch-n-pack 将它们全部拼接成单个 Transformer 序列，并使用块对角 mask，使一张图像只会 Attention 自己的 patch。无需调整为正方形，也不会浪费 padding Token。');
  }

  // ── mm-llava-projector：ViT patch dim 1024 通过 MLP 映射到 LLM dim 4096 ──
  function llavaProjector(host) {
    var svg = svgFor(220), B = 'var(--blueprint,#3553ff)';
    svg.appendChild(txt(60, 20, 'ViT patch', 'middle', 'var(--ink-mute,#777)', 10));
    svg.appendChild(txt(260, 20, '2 层 MLP', 'middle', 'var(--ink-mute,#777)', 10));
    svg.appendChild(txt(450, 20, 'LLM Token', 'middle', 'var(--ink-mute,#777)', 10));
    var i;
    // 左侧：短 Vector（dim 1024）
    for (i = 0; i < 4; i++) {
      var ly = 50 + i * 38;
      svg.appendChild(svgEl('rect', { x: 30, y: ly, width: 60, height: 14, fill: B, 'fill-opacity': '0.7' }));
    }
    svg.appendChild(txt(60, 200, 'dim 1024', 'middle', 'var(--ink-soft,#555)', 10));
    // 带脉冲填充效果的 MLP 框
    var mlp = svgEl('rect', { x: 200, y: 50, width: 120, height: 142, rx: '4', fill: B, 'fill-opacity': '0.12', stroke: B, 'stroke-width': '1.4' });
    mlp.appendChild(anim('fill-opacity', '0.10;0.30;0.10', '0;0.5;1', '2.4s'));
    svg.appendChild(mlp);
    svg.appendChild(txt(260, 116, '1024 -> 4096', 'middle', B, 11));
    svg.appendChild(txt(260, 132, 'GELU -> 4096', 'middle', B, 11));
    // 沿路径流入 LLM 的 Token
    for (i = 0; i < 4; i++) {
      var sy = 57 + i * 38, ey = 57 + i * 38;
      var p = svgEl('circle', { r: '4', fill: B });
      var mo = svgEl('animateMotion', { dur: '2.4s', repeatCount: 'indefinite', path: 'M 90 ' + sy + ' L 200 116 L 320 116 L 420 ' + ey, begin: (i * 0.3).toFixed(2) + 's' });
      p.appendChild(mo);
      svg.appendChild(p);
    }
    // 右侧：长 Vector（dim 4096）
    for (i = 0; i < 4; i++) {
      var ry = 50 + i * 38;
      svg.appendChild(svgEl('rect', { x: 400, y: ry, width: 100, height: 14, fill: B, 'fill-opacity': '0.85' }));
    }
    svg.appendChild(txt(450, 200, 'dim 4096', 'middle', 'var(--ink-soft,#555)', 10));
    wrap(host, svg);
    cap(host, 'LLAVA PROJECTOR', 'patch 转换为 LLM Token',
      'LLaVA 用最简单的桥接方式取代了 Q-Former 瓶颈：一个 2 层 MLP，将每个冻结的 ViT patch Embedding 从视觉维度映射到语言 Model 的 Embedding 维度。每个 patch 都会成为 LLM 在自身输入序列中读取的一个 Token，并直接使用语言 Model Loss 进行 Training。更简单的方案胜出了。');
  }

  // ── mm-mrope-axes：三个旋转轴（时间、高度、宽度）以各自速率旋转 ────────
  function mropeAxes(host) {
    var svg = svgFor(220), B = 'var(--blueprint,#3553ff)', W = 'var(--warn,#b8870f)';
    var axes = [
      { cx: 100, label: '时间', col: B, dur: '6s' },
      { cx: 260, label: '高度', col: W, dur: '3.4s' },
      { cx: 420, label: '宽度', col: 'var(--ink-mute,#999)', dur: '2s' }
    ];
    svg.appendChild(txt(260, 22, 'M-RoPE：一个位置，三种旋转', 'middle', 'var(--ink-mute,#777)', 11));
    axes.forEach(function (a) {
      var cy = 110, r = 46;
      svg.appendChild(svgEl('circle', { cx: a.cx, cy: cy, r: r, fill: 'none', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
      var g = svgEl('g', {});
      g.appendChild(svgEl('line', { x1: a.cx, y1: cy, x2: a.cx + r, y2: cy, stroke: a.col, 'stroke-width': '2.4' }));
      g.appendChild(svgEl('circle', { cx: a.cx + r, cy: cy, r: '4', fill: a.col }));
      g.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'rotate', from: '0 ' + a.cx + ' ' + cy, to: '-360 ' + a.cx + ' ' + cy, dur: a.dur, repeatCount: 'indefinite' }));
      svg.appendChild(g);
      svg.appendChild(txt(a.cx, cy + 70, a.label, 'middle', a.col, 11));
    });
    svg.appendChild(txt(260, 210, '时间最慢 · 宽度最快', 'middle', 'var(--ink-soft,#555)', 10));
    wrap(host, svg);
    cap(host, 'M-ROPE 三轴', '时间、高度、宽度分别旋转',
      'Qwen2-VL 为每个 Token 提供一个由三部分组成的位置，并让每个部分围绕自己的轴旋转：时间、高度和宽度。时间轴旋转缓慢，因此一小时后的某一帧仍处于不同的相位；空间轴旋转得更快，用于编码 patch 网格。一个不依赖绝对位置表的方案，就能同时覆盖单张图像、多图像 Batch 和长视频。');
  }

  // ── mm-video-token-budget：不断提高的 FPS 让 Token 数越过 Context 界线 ─
  function videoTokenBudget(host) {
    var svg = svgFor(230), B = 'var(--blueprint,#3553ff)', W = 'var(--warn,#b8870f)';
    var PAD = 40, W0 = 520, H0 = 230, baseY = 190, topY = 30;
    svg.appendChild(svgEl('line', { x1: PAD, y1: baseY, x2: W0 - 20, y2: baseY, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
    svg.appendChild(svgEl('line', { x1: PAD, y1: baseY, x2: PAD, y2: topY, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
    // Context window 上限线
    var ceil = 78;
    svg.appendChild(svgEl('line', { x1: PAD, y1: ceil, x2: W0 - 20, y2: ceil, stroke: W, 'stroke-width': '1.2', 'stroke-dasharray': '5 4' }));
    svg.appendChild(txt(W0 - 24, ceil - 5, 'Context 上限', 'end', W, 10));
    svg.appendChild(txt(PAD - 6, topY + 6, 'Token', 'end', 'var(--ink-mute,#777)', 9));
    svg.appendChild(txt(W0 - 20, baseY + 16, '每秒帧数', 'end', 'var(--ink-mute,#777)', 10));
    // 逐渐升高的柱形，展示 Token 数如何随 FPS 成倍增加
    var fps = [1, 2, 4, 8, 16], bw = 56, gap = 30;
    fps.forEach(function (f, i) {
      var bx = PAD + 24 + i * (bw + gap);
      var full = Math.min(baseY - topY, 14 * f + 18);
      var hh = full.toFixed(0);
      var bar = svgEl('rect', { x: bx, y: baseY, width: bw, height: '0', fill: full > (baseY - ceil) ? W : B, 'fill-opacity': '0.8' });
      var d = (i * 0.25).toFixed(2) + 's';
      bar.appendChild(anim('height', '0;' + hh, '0;1', '2.6s', { begin: d, fill: 'freeze' }));
      bar.appendChild(anim('y', baseY + ';' + (baseY - full).toFixed(0), '0;1', '2.6s', { begin: d, fill: 'freeze' }));
      svg.appendChild(bar);
      svg.appendChild(txt(bx + bw / 2, baseY + 16, f + ' fps', 'middle', 'var(--ink-soft,#555)', 10));
    });
    wrap(host, svg);
    cap(host, '视频 TOKEN 预算', '每秒帧数让 Token 成倍增加',
      '视觉 Token 数随采样帧数增长，而帧数等于 FPS 乘以时长。采样率翻倍，Token 数也会翻倍，因此一小时长的视频会迅速超出任何固定的 Context window。有三条出路：强行使用百万 Token Context、跨设备拆分的 ring attention，以及激进的 pooling 或 agentic retrieval，从不一次性加载整个视频。');
  }

  // ── mm-action-tokens：连续关节信号对齐到 256 个离散区间之一 ──────────────
  function actionTokens(host) {
    var svg = svgFor(220), B = 'var(--blueprint,#3553ff)', W = 'var(--warn,#b8870f)';
    var PAD = 40, W0 = 520, midY = 96;
    svg.appendChild(txt(W0 / 2, 20, '连续关节目标 -> 离散动作 Token', 'middle', 'var(--ink-mute,#777)', 10));
    // 连续正弦路径（关节角度随时间变化）
    var d = '', i;
    for (i = 0; i <= 120; i++) {
      var x = PAD + (W0 - 2 * PAD) * i / 120;
      var y = midY + 46 * Math.sin(i / 120 * Math.PI * 3);
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1.5' }));
    // 水平区间网格线
    var b;
    for (b = -2; b <= 2; b++) {
      var by = midY + b * 23;
      svg.appendChild(svgEl('line', { x1: PAD, y1: by, x2: W0 - PAD, y2: by, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '0.8' }));
    }
    // 从曲线对齐到最近区间的采样点
    var samples = [10, 30, 50, 70, 90, 110];
    samples.forEach(function (si, k) {
      var x = PAD + (W0 - 2 * PAD) * si / 120;
      var cy = midY + 46 * Math.sin(si / 120 * Math.PI * 3);
      var binned = midY + Math.round((cy - midY) / 23) * 23;
      var dot = svgEl('circle', { cx: x.toFixed(1), cy: cy.toFixed(1), r: '4.5', fill: B });
      var overlay = svgEl('circle', { cx: x.toFixed(1), cy: cy.toFixed(1), r: '4.5', fill: W, 'fill-opacity': '0' });
      var bg = (k * 0.3).toFixed(2) + 's';
      var cyVals = cy.toFixed(1) + ';' + cy.toFixed(1) + ';' + binned.toFixed(1) + ';' + binned.toFixed(1);
      dot.appendChild(anim('cy', cyVals, '0;0.4;0.6;1', '3.2s', { begin: bg }));
      overlay.appendChild(anim('cy', cyVals, '0;0.4;0.6;1', '3.2s', { begin: bg }));
      overlay.appendChild(anim('fill-opacity', '0;0;1;1', '0;0.4;0.6;1', '3.2s', { begin: bg }));
      svg.appendChild(dot);
      svg.appendChild(overlay);
    });
    svg.appendChild(txt(W0 / 2, 200, '256 个区间 -> 词表 ID · 10 DOF = 每步 10 个 Token', 'middle', 'var(--ink-soft,#555)', 10));
    wrap(host, svg);
    cap(host, '动作 TOKENIZATION', '关节目标对齐到离散区间',
      'vision-language-action Model 必须输出电机指令，但 Transformer 使用 Token 表达。RT-2 将每个归一化关节目标离散到 256 个区间之一，并把该区间映射到词表 ID，因此一个 10-DOF 动作会变成十个普通 Token。如今，为图像生成说明文字的同一个 decoder 也能写出控制轨迹，这正是网络规模知识能够迁移到机器人的原因。');
  }

  // ── mm-doc-layout：页面逐个解析为带类型的布局区域 ────────────────────────
  function docLayout(host) {
    var svg = svgFor(250), B = 'var(--blueprint,#3553ff)', W = 'var(--warn,#b8870f)', G = 'var(--ink-mute,#999)';
    // 页面轮廓
    svg.appendChild(svgEl('rect', { x: 150, y: 20, width: 220, height: 210, fill: 'var(--bg,#fafaf5)', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1.2' }));
    svg.appendChild(txt(260, 14, '无需 OCR 的 Model 输出带类型的区域', 'middle', 'var(--ink-mute,#777)', 10));
    var regions = [
      { x: 162, y: 32, w: 196, h: 26, col: W, lab: '标题' },
      { x: 162, y: 66, w: 92, h: 96, col: B, lab: '文本' },
      { x: 264, y: 66, w: 94, h: 60, col: G, lab: '图示' },
      { x: 264, y: 134, w: 94, h: 28, col: B, lab: '文本' },
      { x: 162, y: 170, w: 196, h: 50, col: W, lab: '表格' }
    ];
    regions.forEach(function (rg, i) {
      var box = svgEl('rect', { x: rg.x, y: rg.y, width: rg.w, height: rg.h, fill: rg.col, 'fill-opacity': '0', stroke: rg.col, 'stroke-width': '1.4', 'stroke-opacity': '0' });
      var bg = (i * 0.5).toFixed(2) + 's';
      box.appendChild(anim('stroke-opacity', '0;0;0.9;0.9', '0;0.45;0.55;1', '3.5s', { begin: bg }));
      box.appendChild(anim('fill-opacity', '0;0;0.12;0.12', '0;0.45;0.55;1', '3.5s', { begin: bg }));
      svg.appendChild(box);
      var lbl = svgEl('text', { x: (rg.x + 4).toFixed(0), y: (rg.y + 13).toFixed(0), 'font-size': '9', 'font-family': 'monospace', fill: rg.col, 'fill-opacity': '0' }, [document.createTextNode(rg.lab)]);
      lbl.appendChild(anim('fill-opacity', '0;0;0.95;0.95', '0;0.5;0.6;1', '3.5s', { begin: bg }));
      svg.appendChild(lbl);
    });
    svg.appendChild(txt(60, 130, '文本', 'middle', B, 11));
    svg.appendChild(txt(60, 150, '布局', 'middle', W, 11));
    svg.appendChild(txt(60, 170, '图像', 'middle', G, 11));
    svg.appendChild(txt(60, 110, '三路输入流', 'middle', 'var(--ink-soft,#555)', 10));
    wrap(host, svg);
    cap(host, '文档布局', '页面解析为带类型的区域',
      '文档不是照片。标题、正文、图示和表格各自的含义都与它们在页面上的位置有关。Donut 和 Nougat 等无需 OCR 的 Model 会读取页面图像并直接输出结构化标记，而具备布局感知能力的 encoder 会同时融合三路输入流：文本内容、边界框布局和图像 patch。“Total: $1,245”所在的位置也是答案的一部分。');
  }

  // ── mm-maxsim：每个查询词分别找到最匹配的页面 patch ──────────────────────
  function maxSim(host) {
    var svg = svgFor(240), B = 'var(--blueprint,#3553ff)', W = 'var(--warn,#b8870f)';
    svg.appendChild(txt(110, 18, '查询词 Vector', 'middle', 'var(--ink-mute,#777)', 10));
    svg.appendChild(txt(400, 18, '页面 patch Vector', 'middle', 'var(--ink-mute,#777)', 10));
    var qY = [60, 110, 160], qX = 90;
    var patches = [];
    var pc, pr, idx = 0;
    for (pr = 0; pr < 4; pr++) {
      for (pc = 0; pc < 4; pc++) {
        patches.push({ x: 340 + pc * 34, y: 50 + pr * 34, i: idx++ });
      }
    }
    patches.forEach(function (p) {
      svg.appendChild(svgEl('rect', { x: p.x, y: p.y, width: 26, height: 26, fill: B, 'fill-opacity': '0.12', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '0.6' }));
    });
    var best = [5, 10, 14]; // 每个查询词的 argmax patch 索引
    var terms = ['Q3', '收入', '图表'];
    qY.forEach(function (y, k) {
      svg.appendChild(svgEl('circle', { cx: qX, cy: y, r: '7', fill: W, 'fill-opacity': '0.85' }));
      svg.appendChild(txt(qX - 14, y + 4, terms[k], 'end', 'var(--ink-soft,#555)', 10));
      var tp = patches[best[k]];
      var tx = tp.x + 13, ty = tp.y + 13;
      // 从查询词延伸到其 MaxSim patch 的连接线
      var ln = svgEl('line', { x1: qX, y1: y, x2: qX, y2: y, stroke: W, 'stroke-width': '1.6', 'stroke-opacity': '0.7' });
      var bg = (k * 0.6).toFixed(2) + 's';
      ln.appendChild(anim('x2', qX + ';' + tx, '0;1', '3s', { begin: bg, fill: 'freeze' }));
      ln.appendChild(anim('y2', y + ';' + ty, '0;1', '3s', { begin: bg, fill: 'freeze' }));
      svg.appendChild(ln);
      // 作为 MaxSim 胜出者的 patch 亮起
      var winner = svgEl('rect', { x: tp.x, y: tp.y, width: 26, height: 26, fill: W, 'fill-opacity': '0', stroke: W, 'stroke-width': '1.6', 'stroke-opacity': '0' });
      winner.appendChild(anim('fill-opacity', '0;0;0.55;0.55', '0;0.7;0.85;1', '3s', { begin: bg }));
      winner.appendChild(anim('stroke-opacity', '0;0;1;1', '0;0.7;0.85;1', '3s', { begin: bg }));
      svg.appendChild(winner);
    });
    svg.appendChild(txt(260, 224, '分数 = 每个查询词的最大 patch 相似度之和', 'middle', 'var(--ink-soft,#555)', 10));
    wrap(host, svg);
    cap(host, '后期交互 MAXSIM', '每个词找到自己的最佳 patch',
      'Text-RAG 将整个页面压缩为一个 Vector，因而丢失图表和表格。ColPali 为每个图像 patch 和每个查询词各保留一个 Vector，然后通过 MaxSim 评分：每个查询词取其与所有页面 patch 的最大相似度，而页面得分是这些最大值之和。关于某张图表的查询可以直接匹配到包含该图表的确切 patch，中间无需 OCR 步骤。');
  }

  // ── mm-agent-loop：感知 -> 推理 -> 行动 -> 观察，不断循环 ──────────────────
  function agentLoop(host) {
    var svg = svgFor(240), B = 'var(--blueprint,#3553ff)', W = 'var(--warn,#b8870f)';
    var CX = 260, CY = 130, R = 78;
    var nodes = [
      { a: -90, lab: '感知', sub: '截图' },
      { a: 0, lab: '推理', sub: '规划' },
      { a: 90, lab: '行动', sub: '点击 (x,y)' },
      { a: 180, lab: '观察', sub: '新状态' }
    ];
    svg.appendChild(txt(CX, 20, 'Multimodal Agent 循环', 'middle', 'var(--ink-mute,#777)', 11));
    // 环
    svg.appendChild(svgEl('circle', { cx: CX, cy: CY, r: R, fill: 'none', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1.2', 'stroke-dasharray': '4 4' }));
    var pts = nodes.map(function (n) {
      var rad = n.a * Math.PI / 180;
      return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad), lab: n.lab, sub: n.sub };
    });
    pts.forEach(function (p, i) {
      var node = svgEl('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: '8', fill: B });
      node.appendChild(anim('r', '8;12;8', '0;0.5;1', '4s', { begin: (i * 1).toFixed(0) + 's' }));
      svg.appendChild(node);
      var ly = p.y < CY ? p.y - 14 : p.y + 22;
      svg.appendChild(txt(p.x.toFixed(1), ly.toFixed(1), p.lab, 'middle', 'var(--ink-soft,#555)', 11));
      svg.appendChild(txt(p.x.toFixed(1), (ly + (p.y < CY ? -12 : 13)).toFixed(1), p.sub, 'middle', 'var(--ink-mute,#999)', 9));
    });
    // 一个 Token 沿循环顺时针移动
    var path = 'M ' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1) +
      ' A ' + R + ' ' + R + ' 0 0 1 ' + pts[1].x.toFixed(1) + ' ' + pts[1].y.toFixed(1) +
      ' A ' + R + ' ' + R + ' 0 0 1 ' + pts[2].x.toFixed(1) + ' ' + pts[2].y.toFixed(1) +
      ' A ' + R + ' ' + R + ' 0 0 1 ' + pts[3].x.toFixed(1) + ' ' + pts[3].y.toFixed(1) +
      ' A ' + R + ' ' + R + ' 0 0 1 ' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
    var trav = svgEl('circle', { r: '5', fill: W });
    trav.appendChild(svgEl('animateMotion', { dur: '4s', repeatCount: 'indefinite', path: path }));
    svg.appendChild(trav);
    svg.appendChild(txt(CX, 232, '重复直至任务完成 · 错误会不断累积', 'middle', 'var(--ink-soft,#555)', 10));
    wrap(host, svg);
    cap(host, 'AGENT 循环', '感知、推理、行动、观察',
      'computer-use Agent 会运行一个循环：感知屏幕、围绕目标进行推理、输出点击坐标或输入字符串等结构化动作，然后观察由此产生的截图并再次循环。每一轮都是一次 Multimodal Model 调用，而准确定位到正确像素是最困难的部分。由于错误会被带入下一次观察，恢复能力与初始规划同样重要。');
  }

  LF.register({
    'mm-patch-n-pack': patchNPack,
    'mm-llava-projector': llavaProjector,
    'mm-mrope-axes': mropeAxes,
    'mm-video-token-budget': videoTokenBudget,
    'mm-action-tokens': actionTokens,
    'mm-doc-layout': docLayout,
    'mm-maxsim': maxSim,
    'mm-agent-loop': agentLoop
  });
})();
