/* figures-foundations2.js — Phase 4（computer vision）、Phase 6（speech &
   audio）和 Phase 8（generative AI）的交互式课程图示。在 lesson-figures.js
   之后加载，并通过 window.LF 注册 widget。使用原生 ES5，无依赖，
   通过 CSS 变量设置主题。编写方式与 docs/en.md 中的 fenced block 相同：
       ```figure
       data-augmentation
       ``` */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl, slider = LF.slider, select = LF.select;
  var clamp = LF.clamp, lerp = LF.lerp, fmtInt = LF.fmtInt;

  function shell(label, hint, grid, outKids, caption) {
    return el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [hint])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, outKids)]),
      el('div', { class: 'lf-cap' }, [caption])
    ]);
  }
  function tx(s) { return document.createTextNode(s); }

  // ── data-augmentation：一张源图像，四个变换后的副本 ───────────────────────
  function dataAugmentation(host) {
    var SRC = [
      [0, 0, 6, 6, 0, 0],
      [0, 6, 9, 9, 3, 0],
      [6, 9, 2, 2, 9, 3],
      [3, 9, 2, 2, 9, 6],
      [0, 3, 9, 9, 6, 0],
      [0, 0, 3, 6, 0, 0]
    ];
    var N = 6;
    var state = { mode: 'flip', copies: 4 };
    var svg = svgEl('svg', { viewBox: '0 0 520 200' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });

    function sample(r, c, variant) {
      if (state.mode === 'flip') { return SRC[r][variant % 2 ? N - 1 - c : c]; }
      if (state.mode === 'rotate') {
        var q = variant % 4, rr = r, cc = c, t;
        while (q-- > 0) { t = rr; rr = cc; cc = N - 1 - t; }
        return SRC[rr][cc];
      }
      if (state.mode === 'crop') {
        var off = variant % 3;
        var sr = clamp(r + off - 1, 0, N - 1), sc = clamp(c + off - 1, 0, N - 1);
        return SRC[sr][sc];
      }
      var shift = (variant - 1) * 2;
      return clamp(SRC[r][c] + shift, 0, 9);
    }

    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var gap = 16, x0 = 8, y0 = 28;
      var cell = Math.min(18, (520 - 2 * x0 - 30 - (state.copies - 1) * gap) / (N * (state.copies + 1)), (200 - y0 - 8) / N);
      svg.appendChild(svgEl('text', { x: x0, y: 18, fill: 'var(--ink-mute,#777)', 'font-size': '10', 'font-family': 'monospace' }, [tx('源图像')]));
      var p, r, c;
      for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
        svg.appendChild(svgEl('rect', { x: x0 + c * cell, y: y0 + r * cell, width: cell - 1, height: cell - 1, fill: 'var(--blueprint,#3553ff)', opacity: (0.08 + 0.9 * SRC[r][c] / 9).toFixed(3) }));
      }
      var bx = x0 + N * cell + 30;
      for (p = 1; p <= state.copies; p++) {
        var px0 = bx + (p - 1) * (N * cell + gap);
        svg.appendChild(svgEl('text', { x: px0, y: 18, fill: 'var(--warn,#b8870f)', 'font-size': '10', 'font-family': 'monospace' }, [tx('增强 ' + p)]));
        for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
          svg.appendChild(svgEl('rect', { x: px0 + c * cell, y: y0 + r * cell, width: cell - 1, height: cell - 1, fill: 'var(--blueprint,#3553ff)', opacity: (0.08 + 0.9 * sample(r, c, p) / 9).toFixed(3) }));
        }
      }
      var base = 1000;
      meta.textContent = '每次处理都会生成一个新视图  ·  ' + base + ' 张图像 x ' + (state.copies + 1) + ' = ' + fmtInt(base * (state.copies + 1)) + ' 个有效样本';
      formula.textContent = 'augment(x) 在改变像素的同时保留 Label  ·  Model 会看到更多变化，从而获得更好的泛化能力';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      select(state, 'mode', '变换', [['水平翻转', 'flip'], ['旋转 90°', 'rotate'], ['随机裁剪', 'crop'], ['颜色扰动', 'color']]),
      slider(state, 'copies', '增强副本数', 1, 4, 1)
    ]);
    host.appendChild(shell('DATA AUGMENTATION', '选择一种变换',
      grid, [svg, meta, formula],
      'Data Augmentation 会对每张 Training 图像应用保持 Label 不变的变换，例如翻转、旋转、裁剪和颜色偏移，使一个已标注样本变成多个样本。Neural Network 永远不会两次看到完全相同的输入，并会学习在这些变化下仍然有效的 Feature，从而扩展有效 Dataset，无需收集更多数据即可抑制过拟合。'));
    state._render();
  }

  // ── transfer-learning：冻结 pretrained backbone，Training head ─────────────
  function transferLearning(host) {
    var TOTAL = 24, FULL = 24e6;
    var state = { frozen: 18 };
    var svg = svgEl('svg', { viewBox: '0 0 520 150' });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function human(x) { var u = ['', 'K', 'M', 'B'], i = 0; while (x >= 1000 && i < u.length - 1) { x /= 1000; i++; } return x.toFixed(x < 10 ? 1 : 0) + u[i]; }

    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var frozen = clamp(state.frozen, 0, TOTAL), trainable = TOTAL - frozen;
      var x0 = 30, y0 = 40, bw = 460 / TOTAL, bh = 46, i;
      for (i = 0; i < TOTAL; i++) {
        var isFrozen = i < frozen;
        svg.appendChild(svgEl('rect', { x: x0 + i * bw, y: y0, width: bw - 1.5, height: bh, fill: isFrozen ? 'var(--rule-soft,#ddd)' : 'var(--blueprint,#3553ff)', opacity: isFrozen ? '0.9' : '0.85' }));
      }
      svg.appendChild(svgEl('text', { x: x0, y: y0 - 10, fill: 'var(--ink-mute,#777)', 'font-size': '11', 'font-family': 'monospace' }, [tx('输入 →  ' + frozen + ' 个冻结层（灰色）  ·  ' + trainable + ' 个可 Training 层（蓝色）  → head')]));
      var fracTrain = trainable / TOTAL;
      var trainableParams = FULL * fracTrain;
      var epochs = Math.max(2, Math.round(2 + 22 * fracTrain));
      svg.appendChild(svgEl('text', { x: x0, y: y0 + bh + 22, fill: 'var(--ink-mute,#777)', 'font-size': '11', 'font-family': 'monospace' }, [tx('Gradient 仅流经蓝色层')]));
      num.innerHTML = human(trainableParams) + ' <small>个可 Training 参数</small>';
      meta.textContent = 'backbone 有 ' + Math.round(fracTrain * 100) + '% 参与 Training  ·  在小型 Dataset 上大约需要 ' + epochs + ' 个 Epoch 才能收敛';
      formula.textContent = '冻结层保留 pretrained 权重，不贡献 Gradient  ·  可 Training 参数更少 → 所需数据和计算量更少';
    };
    var grid = el('div', {}, [slider(state, 'frozen', '冻结层数', 0, TOTAL, 1)]);
    host.appendChild(shell('TRANSFER LEARNING', '拖动冻结分界线',
      grid, [svg, num, meta, formula],
      'pretrained backbone 已经掌握边缘、纹理和形状等通用 Feature。Transfer Learning 会冻结这些较低层，仅在目标任务上 Training 顶部几层和一个新的 head。可 Training 参数更少，意味着需要存储的 Gradient 更少、拟合所需数据大幅减少，并且收敛更快；Dataset 很小时应冻结更多层，Dataset 较大且差异明显时则少冻结一些层。'));
    state._render();
  }

  // ── batchnorm-inference：Training 时的 batch 统计量与 running average ──────
  function batchnormInference(host) {
    var POP_MEAN = 0.0, POP_STD = 1.0;
    var state = { batch: 8, seed: 3 };
    var svg = svgEl('svg', { viewBox: '0 0 520 200' });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function rng(s) { var x = Math.sin(s * 12.9898) * 43758.5453; return x - Math.floor(x); }
    function gauss(s) { var u = Math.max(1e-6, rng(s)), v = rng(s + 7.13); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var W = 520, H = 200, PAD = 30, n = state.batch, i, sum = 0, sumsq = 0, xs = [];
      for (i = 0; i < n; i++) { var g = POP_MEAN + POP_STD * gauss(state.seed * 31 + i * 1.7); xs.push(g); sum += g; sumsq += g * g; }
      var bMean = sum / n, bVar = sumsq / n - bMean * bMean, bStd = Math.sqrt(Math.max(1e-6, bVar));
      function px(v) { return W / 2 + v / 4 * (W - 2 * PAD) / 2; }
      svg.appendChild(svgEl('line', { x1: PAD, y1: 70, x2: W - PAD, y2: 70, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      for (i = 0; i < n; i++) { svg.appendChild(svgEl('circle', { cx: px(xs[i]), cy: 70, r: '4', fill: 'var(--blueprint,#3553ff)', opacity: '0.8' })); }
      svg.appendChild(svgEl('line', { x1: px(bMean), y1: 50, x2: px(bMean), y2: 90, stroke: 'var(--warn,#b8870f)', 'stroke-width': '2' }));
      svg.appendChild(svgEl('text', { x: PAD, y: 44, fill: 'var(--warn,#b8870f)', 'font-size': '11', 'font-family': 'monospace' }, [tx('Training：当前 batch  μ=' + bMean.toFixed(2) + '  σ=' + bStd.toFixed(2))]));
      svg.appendChild(svgEl('line', { x1: PAD, y1: 150, x2: W - PAD, y2: 150, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('line', { x1: px(POP_MEAN), y1: 130, x2: px(POP_MEAN), y2: 170, stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      svg.appendChild(svgEl('text', { x: PAD, y: 124, fill: 'var(--ink-mute,#777)', 'font-size': '11', 'font-family': 'monospace' }, [tx('Inference：running average  μ=' + POP_MEAN.toFixed(2) + '  σ=' + POP_STD.toFixed(2))]));
      var err = Math.abs(bMean - POP_MEAN) + Math.abs(bStd - POP_STD);
      num.innerHTML = err.toFixed(3) + ' <small>batch 与总体的差距</small>';
      meta.textContent = '每个 batch 包含 ' + n + ' 个样本  ·  ' + (n <= 4 ? '小 batch：估计噪声大，归一化不稳定' : n >= 32 ? '大 batch：估计稳定且接近总体' : '中等 batch：估计结果可用');
      formula.textContent = 'train：使用当前 batch 的 μ,σ 归一化  ·  eval：使用 Training 期间收集的 running average 归一化';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'batch', 'batch 大小', 1, 64, 1),
      slider(state, 'seed', '重新采样 batch', 1, 20, 1)
    ]);
    host.appendChild(shell('BATCHNORM：TRAIN vs EVAL', '拖动 batch 大小',
      grid, [svg, num, meta, formula],
      'Training 期间，BatchNorm 使用当前 mini-batch 的均值和方差对每个 activation 进行归一化（橙色），并在后台累积 running average。Inference 时，它会切换到这些冻结的 running average（蓝色），从而以确定性方式处理单个输入。小 batch 会使每个 batch 的统计量噪声变大，因此极小 batch 会损害 BatchNorm，并促使人们采用 Group Norm 或 Layer Norm。'));
    state._render();
  }

  // ── ctc-collapse：逐 frame 字符折叠为 transcript ──────────────────────────
  function ctcCollapse(host) {
    var FRAMES = ['_', 'h', 'h', 'e', '_', 'l', 'l', '_', 'l', 'l', 'o', 'o', '_'];
    var state = { stage: 2 };
    var svg = svgEl('svg', { viewBox: '0 0 520 170' });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });

    function collapseRepeats(seq) {
      var out = [], prev = null, i;
      for (i = 0; i < seq.length; i++) { if (seq[i] !== prev) { out.push(seq[i]); } prev = seq[i]; }
      return out;
    }
    function removeBlanks(seq) { return seq.filter(function (c) { return c !== '_'; }); }

    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var shown;
      if (state.stage === 0) { shown = FRAMES.slice(); }
      else if (state.stage === 1) { shown = collapseRepeats(FRAMES); }
      else { shown = removeBlanks(collapseRepeats(FRAMES)); }
      var x0 = 20, y0 = 50, cw = 36, i;
      var stageLabel = state.stage === 0 ? '原始逐 frame argmax（' + FRAMES.length + ' 个 frame）'
        : state.stage === 1 ? '合并相邻重复项' : '移除 blank Token "_"';
      svg.appendChild(svgEl('text', { x: x0, y: 30, fill: 'var(--ink-mute,#777)', 'font-size': '11', 'font-family': 'monospace' }, [tx(stageLabel)]));
      for (i = 0; i < shown.length; i++) {
        var blank = shown[i] === '_';
        svg.appendChild(svgEl('rect', { x: x0 + i * cw, y: y0, width: cw - 4, height: 36, fill: blank ? 'var(--rule-soft,#ddd)' : 'var(--blueprint,#3553ff)', opacity: blank ? '0.7' : '0.85' }));
        svg.appendChild(svgEl('text', { x: x0 + i * cw + (cw - 4) / 2, y: y0 + 24, fill: 'var(--bg,#fafaf5)', 'font-size': '16', 'font-family': 'monospace', 'text-anchor': 'middle' }, [tx(blank ? '∅' : shown[i])]));
      }
      var transcript = removeBlanks(collapseRepeats(FRAMES)).join('');
      svg.appendChild(svgEl('text', { x: x0, y: y0 + 70, fill: 'var(--warn,#b8870f)', 'font-size': '13', 'font-family': 'monospace' }, [tx('最终 transcript："' + transcript + '"')]));
      num.innerHTML = shown.length + ' <small>个当前阶段的符号</small>';
      meta.textContent = state.stage === 0 ? 'acoustic Model 每个 audio frame 输出一个符号，其中包含重复项和 blank'
        : state.stage === 1 ? '同一符号的连续重复序列合并为一个' : '移除 blank，留下文本';
      formula.textContent = 'CTC decode：先折叠重复项，再移除 blank  ·  blank 使 Model 能够区分真正的双写字母';
    };
    var grid = el('div', {}, [slider(state, 'stage', 'decode 阶段（0 原始 → 1 合并 → 2 最终）', 0, 2, 1)]);
    host.appendChild(shell('CTC COLLAPSE', '逐步完成 decoding',
      grid, [svg, num, meta, formula],
      'CTC 允许 acoustic Model 在不知道对齐关系的情况下，每个 frame 输出一个 Label。Decoding 按顺序执行两个步骤：首先将任意连续的相同符号折叠为一个，然后删除 blank Token。blank 至关重要，它位于两个真正的 "l" frame 之间，因此 "hello" 能够保留两个字母，而不会将它们合并为一个。'));
    state._render();
  }

  // ── mfcc-pipeline：spectrogram → mel → log → DCT → 保留 N 个系数 ────────────
  function mfccPipeline(host) {
    var state = { keep: 13 };
    var MELS = 40;
    var svg = svgEl('svg', { viewBox: '0 0 520 170' });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });

    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var stages = ['spectrogram', 'mel filterbank', 'log', 'DCT', 'MFCC'];
      var x0 = 16, y0 = 30, sw = 96, gap = 4, i;
      for (i = 0; i < stages.length; i++) {
        var sx = x0 + i * (sw + gap);
        svg.appendChild(svgEl('rect', { x: sx, y: y0, width: sw, height: 40, fill: i === stages.length - 1 ? 'var(--blueprint,#3553ff)' : 'var(--bg-surface,#eee)', opacity: i === stages.length - 1 ? '0.85' : '1', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
        svg.appendChild(svgEl('text', { x: sx + sw / 2, y: y0 + 24, fill: i === stages.length - 1 ? 'var(--bg,#fafaf5)' : 'var(--ink-soft,#555)', 'font-size': '10', 'font-family': 'monospace', 'text-anchor': 'middle' }, [tx(stages[i])]));
        if (i < stages.length - 1) {
          svg.appendChild(svgEl('text', { x: sx + sw + gap / 2 - 1, y: y0 + 26, fill: 'var(--ink-mute,#777)', 'font-size': '12', 'font-family': 'monospace', 'text-anchor': 'middle' }, [tx('→')]));
        }
      }
      var bx = 16, by = 110, bw = 488 / MELS;
      for (i = 0; i < MELS; i++) {
        var kept = i < state.keep;
        var energy = Math.exp(-i * 0.12);
        svg.appendChild(svgEl('rect', { x: bx + i * bw, y: by, width: bw - 0.8, height: 36, fill: kept ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#ddd)', opacity: kept ? (0.3 + 0.7 * energy).toFixed(3) : '0.5' }));
      }
      svg.appendChild(svgEl('text', { x: bx, y: by - 6, fill: 'var(--ink-mute,#777)', 'font-size': '10', 'font-family': 'monospace' }, [tx('cepstral 系数：保留蓝色，舍弃灰色（共 ' + MELS + ' 个）')]));
      num.innerHTML = state.keep + ' <small>个保留的 MFCC 系数</small>';
      meta.textContent = '保留 ' + MELS + ' 个系数中的前 ' + state.keep + ' 个  ·  ' + (state.keep <= 8 ? '粗略：仅保留平滑的 spectral envelope' : state.keep >= 26 ? '精细：包含类似音高的细节和噪声' : 'speech 的典型值（12-13）');
      formula.textContent = 'STFT power → mel filterbank → log → DCT → 保留低阶系数  ·  DCT 将 envelope 压缩到最前面的少量系数中';
    };
    var grid = el('div', {}, [slider(state, 'keep', '保留的 cepstral 系数', 4, 40, 1)]);
    host.appendChild(shell('MFCC PIPELINE', '拖动系数数量',
      grid, [svg, num, meta, formula],
      'MFCC 采用固定的 pipeline：获取 spectrogram，将其映射到按 mel 间隔排列的 filter，取 log 来模拟响度感知，然后应用 DCT。DCT 会将平滑的 spectral envelope 压缩到最前面的少量系数中，因此只保留最低的 12-13 个系数，即可捕获用于区分 phoneme 的 vocal-tract 形状，同时舍弃高阶系数中的音高和噪声。'));
    state._render();
  }

  // ── autoencoder-bottleneck：重建质量与 latent dimension 的关系 ────────────
  function autoencoderBottleneck(host) {
    var DIN = 16;
    var SIGNAL = [];
    (function () { var i; for (i = 0; i < DIN; i++) { SIGNAL.push(0.5 + 0.45 * Math.sin(i * 0.9) + 0.18 * Math.sin(i * 2.7)); } })();
    var state = { latent: 4 };
    var svg = svgEl('svg', { viewBox: '0 0 520 180' });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });

    function reconstruct(z) {
      var coeffs = [], k2;
      for (k2 = 0; k2 < z; k2++) {
        var c = 0, i2;
        for (i2 = 0; i2 < DIN; i2++) { c += (SIGNAL[i2] - 0.5) * Math.cos(Math.PI * (k2 + 0.5) * i2 / DIN); }
        coeffs.push(c * 2 / DIN);
      }
      var rec = [], i3, kk;
      for (i3 = 0; i3 < DIN; i3++) {
        var s = 0.5;
        for (kk = 0; kk < z; kk++) { s += coeffs[kk] * Math.cos(Math.PI * (kk + 0.5) * i3 / DIN); }
        rec.push(s);
      }
      return rec;
    }

    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var rec = reconstruct(state.latent);
      var x0 = 30, y0 = 16, gw = 460, gh = 110, i;
      function px(i) { return x0 + i / (DIN - 1) * gw; }
      function py(v) { return y0 + gh - clamp(v, -0.2, 1.2) / 1.4 * gh; }
      var od = '', rd = '';
      for (i = 0; i < DIN; i++) { od += (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(SIGNAL[i]).toFixed(1) + ' '; rd += (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(rec[i]).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: od, fill: 'none', stroke: 'var(--ink-mute,#999)', 'stroke-width': '2' }));
      svg.appendChild(svgEl('path', { d: rd, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2', 'stroke-dasharray': '5 3' }));
      svg.appendChild(svgEl('text', { x: x0, y: y0 + gh + 22, fill: 'var(--ink-mute,#777)', 'font-size': '11', 'font-family': 'monospace' }, [tx('灰色 = 输入（' + DIN + ' 维）   ·   蓝色虚线 = 从 ' + state.latent + ' 维 bottleneck 重建的结果')]));
      var mse = 0;
      for (i = 0; i < DIN; i++) { mse += (rec[i] - SIGNAL[i]) * (rec[i] - SIGNAL[i]); }
      mse /= DIN;
      var ratio = DIN / state.latent;
      num.innerHTML = mse.toFixed(4) + ' <small>重建 MSE</small>';
      meta.textContent = ratio.toFixed(1) + 'x 压缩（' + DIN + ' → ' + state.latent + '）  ·  ' + (state.latent <= 2 ? 'bottleneck 太小：细节丢失' : state.latent >= DIN - 1 ? 'bottleneck 较宽：近乎完美，但没有压缩' : '在保留主要结构的同时完成压缩');
      formula.textContent = 'x → encoder → z（' + state.latent + ' 维）→ decoder → x̂  ·  bottleneck 迫使 Neural Network 仅保留重要信息';
    };
    var grid = el('div', {}, [slider(state, 'latent', 'bottleneck 维度', 1, DIN, 1)]);
    host.appendChild(shell('AUTOENCODER BOTTLENECK', '拖动 latent dimension',
      grid, [svg, num, meta, formula],
      'autoencoder 会将输入压缩到狭窄的 bottleneck 中，并在另一端将其重建。较宽的 bottleneck 会复制所有内容，却学不到任何东西；极小的 bottleneck 会迫使 Neural Network 舍弃细节，只保留主要结构，因此随着压缩程度提高，重建误差也会上升。最佳平衡点会保留信号并丢弃噪声，这种学习到的 code 就是有用的 representation。'));
    state._render();
  }

  // ── normalizing-flow：可逆映射、base → target、log-det Jacobian ────────────
  function normalizingFlow(host) {
    var state = { a: 1.4 };
    var W = 520, H = 210, PAD = 34;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function base(z) { return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI); }
    function fwd(z, a) { return z + a * Math.tanh(z); }
    function dfwd(z, a) { var th = Math.tanh(z); return 1 + a * (1 - th * th); }

    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var a = state.a, i;
      var xs = [], baseY = [], tgtY = [];
      for (i = 0; i <= 160; i++) { var z = -3.4 + 6.8 * i / 160; xs.push(z); }
      function px(x) { return PAD + (x + 3.6) / 7.2 * (W - 2 * PAD); }
      var maxP = 0;
      var pts = [];
      for (i = 0; i < xs.length; i++) {
        var z = xs[i], x = fwd(z, a);
        var pz = base(z), jac = Math.abs(dfwd(z, a));
        var pxden = pz / jac;
        pts.push({ z: z, x: x, pz: pz, px: pxden });
        if (pz > maxP) maxP = pz; if (pxden > maxP) maxP = pxden;
      }
      function py(p) { return H - PAD - p / maxP * (H - 2 * PAD); }
      var bd = '', td = '';
      for (i = 0; i < pts.length; i++) { bd += (i ? 'L' : 'M') + px(pts[i].z).toFixed(1) + ' ' + py(pts[i].pz).toFixed(1) + ' '; td += (i ? 'L' : 'M') + px(pts[i].x).toFixed(1) + ' ' + py(pts[i].px).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: bd, fill: 'none', stroke: 'var(--ink-mute,#999)', 'stroke-width': '2' }));
      svg.appendChild(svgEl('path', { d: td, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2.2' }));
      svg.appendChild(svgEl('text', { x: PAD, y: PAD - 6, fill: 'var(--ink-mute,#777)', 'font-size': '11', 'font-family': 'monospace' }, [tx('灰色 = base Gaussian p(z)   ·   蓝色 = pushed-forward density p(x)')]));
      var logdetAt0 = Math.log(Math.abs(dfwd(0, a)));
      num.innerHTML = logdetAt0.toFixed(3) + ' <small>z=0 处的 log|det J|</small>';
      meta.textContent = 'flow 强度 a = ' + a.toFixed(2) + '  ·  ' + (a < 0.3 ? '接近 identity：target 仍接近 base' : a > 1.8 ? '强 warp：density 在映射压缩的位置聚集' : '中等 warp，形成 multi-modal 形状');
      formula.textContent = 'x = z + a·tanh(z)  可逆  ·  p(x) = p(z) / |dx/dz|  ·  log p(x) = log p(z) − log|det J|';
    };
    var grid = el('div', {}, [slider(state, 'a', 'flow 强度 a', 0, 2.5, 0.05)]);
    host.appendChild(shell('NORMALIZING FLOW', '拖动 flow 参数',
      grid, [svg, num, meta, formula],
      'normalizing flow 通过可逆函数将简单的 base density（灰色 Gaussian）映射为复杂的 target（蓝色）。由于映射可逆，change-of-variables 公式可以给出精确的 density：除以 Jacobian determinant 的绝对值，或者在 log 空间中减去 log|det J|。映射拉伸空间的位置，density 会变稀；映射压缩空间的位置，density 会聚集。由于所有计算都是精确的，flow 可以通过 Maximum Likelihood Estimation 进行 Training。'));
    state._render();
  }

  // ── score-matching：score Vector field 与 Langevin sampling 步骤 ───────────
  function scoreMatching(host) {
    var state = { steps: 18, step: 0.06 };
    var W = 520, H = 240, PAD = 24;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var MODES = [{ x: -1.1, y: 0.4 }, { x: 1.2, y: -0.5 }];
    function dens(x, y) { var s = 0, m; for (m = 0; m < MODES.length; m++) { var dx = x - MODES[m].x, dy = y - MODES[m].y; s += Math.exp(-2 * (dx * dx + dy * dy)); } return s + 1e-6; }
    function score(x, y) {
      var sx = 0, sy = 0, w = 0, m;
      for (m = 0; m < MODES.length; m++) { var dx = x - MODES[m].x, dy = y - MODES[m].y; var g = Math.exp(-2 * (dx * dx + dy * dy)); w += g; sx += g * (-4 * dx); sy += g * (-4 * dy); }
      return { x: sx / w, y: sy / w };
    }
    function gx(x) { return PAD + (x + 2.4) / 4.8 * (W - 2 * PAD); }
    function gy(y) { return H - PAD - (y + 2.0) / 4.0 * (H - 2 * PAD); }

    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var ix, iy;
      for (ix = -2; ix <= 2; ix += 0.5) for (iy = -1.6; iy <= 1.6; iy += 0.5) {
        var s = score(ix, iy);
        var mag = Math.sqrt(s.x * s.x + s.y * s.y) + 1e-6;
        var ux = s.x / mag, uy = s.y / mag, L = 11;
        var x1 = gx(ix), y1 = gy(iy), x2 = gx(ix) + ux * L, y2 = gy(iy) - uy * L;
        svg.appendChild(svgEl('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: 'var(--ink-mute,#999)', 'stroke-width': '1', opacity: '0.7' }));
        svg.appendChild(svgEl('circle', { cx: x2, cy: y2, r: '1.6', fill: 'var(--ink-mute,#999)' }));
      }
      var m;
      for (m = 0; m < MODES.length; m++) { svg.appendChild(svgEl('circle', { cx: gx(MODES[m].x), cy: gy(MODES[m].y), r: '6', fill: 'none', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '2' })); }
      var px = -2.0, py = 1.4, path = '', i;
      for (i = 0; i <= state.steps; i++) {
        path += (i ? 'L' : 'M') + gx(px).toFixed(1) + ' ' + gy(py).toFixed(1) + ' ';
        var sc = score(px, py);
        px = px + state.step * sc.x;
        py = py + state.step * sc.y;
      }
      svg.appendChild(svgEl('path', { d: path, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.6', 'stroke-dasharray': '4 3' }));
      svg.appendChild(svgEl('circle', { cx: gx(px), cy: gy(py), r: '5', fill: 'var(--warn,#b8870f)' }));
      var finalDens = dens(px, py);
      num.innerHTML = finalDens.toFixed(3) + ' <small>样本所在位置的 density</small>';
      meta.textContent = state.steps + ' 个 Langevin 步骤  ·  样本沿灰色箭头上升，进入高 density mode';
      formula.textContent = 'score s(x) = ∇ₓ log p(x)  ·  Langevin：x ← x + ε·s(x)（+ 噪声）  ·  箭头指向数据密集的位置';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'steps', 'Langevin 步骤数', 0, 40, 1),
      slider(state, 'step', '步长 ε', 0.01, 0.2, 0.01)
    ]);
    host.appendChild(shell('SCORE MATCHING', '拖动步骤数',
      grid, [svg, num, meta, formula],
      'score-based Model 学习 score，即 log-density 的 Gradient；图中灰色 Vector field 指向数据密集的位置。生成过程不需要显式 density：从噪声开始，沿 score 反复移动（Langevin dynamics，每一步加入少量噪声）。橙色样本沿箭头离开空旷区域，并最终落入高 density mode，这正是 Diffusion Model 生成样本的方式。'));
    state._render();
  }

  LF.register({
    'data-augmentation': dataAugmentation,
    'transfer-learning': transferLearning,
    'batchnorm-inference': batchnormInference,
    'ctc-collapse': ctcCollapse,
    'mfcc-pipeline': mfccPipeline,
    'autoencoder-bottleneck': autoencoderBottleneck,
    'normalizing-flow': normalizingFlow,
    'score-matching': scoreMatching
  });
})();
