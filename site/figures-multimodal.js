/* figures-multimodal.js — Phase 12（Multimodal AI）的交互式课程图示。
   在 lesson-figures.js 之后加载，使用共享的 LF 工具包，并通过
   LF.register 注册。无依赖，仅使用 ES5，通过 CSS 变量设置主题。创作方式与
   docs/en.md 中 fenced ```figure 块相同。 */
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

  function txt(x, y, s, anchor, color, size) {
    return svgEl('text', { x: String(x), y: String(y), 'text-anchor': anchor || 'middle', 'font-size': String(size || 10), 'font-family': 'monospace', fill: color || 'var(--ink-soft,#555)' }, [document.createTextNode(s)]);
  }

  // ── contrastive-matrix：CLIP InfoNCE 相似度 Matrix，拖动 temperature ────────
  function contrastiveMatrix(host) {
    var n = 5;
    var labels = ['狗', '汽车', '树', '船', '鸟'];
    // 固定在 [-1,1] 范围内的 cosine 相似度；对角线较高，非对角线较低。
    var sim = [
      [0.92, 0.18, 0.24, 0.10, 0.30],
      [0.15, 0.90, 0.12, 0.40, 0.08],
      [0.27, 0.10, 0.88, 0.14, 0.35],
      [0.12, 0.42, 0.16, 0.91, 0.06],
      [0.33, 0.09, 0.38, 0.07, 0.89]
    ];
    var state = { tau: 0.10 };
    var W = 520, H = 280, PAD = 70, CELL = Math.min((W - PAD - 20) / n, (H - 34 - 20) / n);
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var tau = Math.max(0.01, state.tau);
      var r, c, x, y, diag = 0;
      for (r = 0; r < n; r++) {
        // 对图像 r 与所有文本组成的一行执行 Softmax（InfoNCE 分子）。
        var sc = [];
        for (c = 0; c < n; c++) { sc.push(sim[r][c] / tau); }
        var mx = Math.max.apply(null, sc);
        var ex = sc.map(function (s) { return Math.exp(s - mx); });
        var sum = ex.reduce(function (a, b) { return a + b; }, 0);
        var probs = ex.map(function (e) { return e / sum; });
        diag += probs[r];
        for (c = 0; c < n; c++) {
          x = PAD + c * CELL; y = 34 + r * CELL;
          svg.appendChild(svgEl('rect', { x: x.toFixed(1), y: y.toFixed(1), width: (CELL - 2).toFixed(1), height: (CELL - 2).toFixed(1), fill: 'var(--blueprint,#3553ff)', 'fill-opacity': probs[c].toFixed(3), stroke: c === r ? 'var(--warn,#b8870f)' : 'var(--rule-soft,#ddd)', 'stroke-width': c === r ? '1.5' : '0.5' }));
        }
        svg.appendChild(txt((PAD - 8).toFixed(1), (y + CELL / 2 + 3).toFixed(1), '图像：' + labels[r], 'end', 'var(--ink-soft,#555)'));
      }
      for (c = 0; c < n; c++) {
        x = PAD + c * CELL;
        svg.appendChild(txt((x + CELL / 2).toFixed(1), '26', '文本：' + labels[c], 'middle', 'var(--ink-mute,#777)'));
      }
      var acc = diag / n;
      meta.textContent = '匹配对概率质量 ' + (acc * 100).toFixed(0) + '%  ·  对角线带有描边  ·  ' + (state.tau < 0.06 ? '低 τ：Matrix 收紧为清晰的对角线' : state.tau > 0.25 ? '高 τ：各行趋于平坦，配对混在一起' : '均衡');
      formula.textContent = 'L = −log softmax(sim / τ)[匹配项],  τ = ' + tau.toFixed(2) + '   ·   每个图像行和文本列都通过 Softmax 聚焦到匹配对';
    };
    var grid = el('div', {}, [slider(state, 'tau', 'temperature τ', 0.02, 0.5, 0.01)]);
    shell(host, '对比 MATRIX', '拖动 τ', grid, [svg, meta, formula],
      'CLIP 会为 Batch 中的每张图像与每条说明文字进行评分，从而形成相似度 Matrix。对比 Loss 将对角线上的匹配对拉近，并将非对角线项推远。除以较小的 temperature 会使 Softmax 更尖锐，让对角线亮起；较大的 temperature 会使其趋于平坦，Model 也就不再区分不同配对。');
    state._render();
  }

  // ── cross-attention-fusion：文本 query 关注图像 patch key ──────────────────
  function crossAttentionFusion(host) {
    var texts = ['一只', '红色', '鸟', '在', '树枝上'];
    var patches = 8;
    var nt = texts.length;
    var state = { focus: 2, sharp: 1.4 };
    // 每个文本 Token 与每个图像 patch 的固定亲和度（鸟位于 patch 4-5）。
    var aff = [
      [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
      [0.2, 0.3, 0.5, 0.7, 0.8, 0.6, 0.3, 0.2],
      [0.1, 0.2, 0.4, 0.8, 1.0, 0.9, 0.4, 0.2],
      [0.4, 0.4, 0.3, 0.3, 0.3, 0.4, 0.5, 0.5],
      [0.3, 0.2, 0.2, 0.3, 0.4, 0.6, 0.9, 1.0]
    ];
    var W = 520, H = 250, PAD = 64, CELL = (W - PAD - 20) / patches;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var s = Math.max(0.1, state.sharp), r, c, x, y, peak = 0, peakCol = 0;
      var rowH = (H - 50) / nt;
      for (r = 0; r < nt; r++) {
        var logits = [];
        for (c = 0; c < patches; c++) { logits.push(aff[r][c] * s); }
        var mx = Math.max.apply(null, logits);
        var ex = logits.map(function (z) { return Math.exp(z - mx); });
        var sum = ex.reduce(function (a, b) { return a + b; }, 0);
        var probs = ex.map(function (e) { return e / sum; });
        for (c = 0; c < patches; c++) {
          x = PAD + c * CELL; y = 30 + r * rowH;
          svg.appendChild(svgEl('rect', { x: x.toFixed(1), y: y.toFixed(1), width: (CELL - 2).toFixed(1), height: (rowH - 3).toFixed(1), fill: 'var(--blueprint,#3553ff)', 'fill-opacity': probs[c].toFixed(3), stroke: r === state.focus && c === probs.indexOf(Math.max.apply(null, probs)) ? 'var(--warn,#b8870f)' : 'var(--rule-soft,#ddd)', 'stroke-width': '0.5' }));
        }
        if (r === state.focus) { peak = Math.max.apply(null, probs); peakCol = probs.indexOf(peak); }
        svg.appendChild(txt((PAD - 8).toFixed(1), (y + rowH / 2 + 3).toFixed(1), texts[r], 'end', r === state.focus ? 'var(--blueprint,#3553ff)' : 'var(--ink-soft,#555)'));
      }
      for (c = 0; c < patches; c++) {
        x = PAD + c * CELL;
        svg.appendChild(txt((x + CELL / 2).toFixed(1), '24', 'p' + c, 'middle', 'var(--ink-mute,#777)', 9));
      }
      meta.textContent = '“' + texts[state.focus] + '”将其 ' + (peak * 100).toFixed(0) + '% 的 Attention 放在 patch ' + peakCol + ' 上  ·  行 = 文本 query，列 = 图像 patch';
      formula.textContent = 'A = softmax(Q_text · Kᵀ_image)，各行之和为 1   ·   更高的锐度会让每个 query 在对应 patch 上形成峰值';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'focus', '高亮的文本 Token', 0, nt - 1, 1),
      slider(state, 'sharp', 'Attention 锐度', 0.3, 4.0, 0.1)
    ]);
    shell(host, 'CROSS-ATTENTION 融合', '拖动 query 和锐度', grid, [svg, meta, formula],
      '在视觉语言 Model 中，每个文本 Token 都是一个 query，它会关注所有图像 patch key。这个网格是一张 Attention 图：行是文本 Token，列是图像 patch，并且每一行通过 Softmax 归一化为一。像“鸟”这样的实义词会集中到包含该对象的 patch 上，语言正是通过这种方式在像素中建立指代。');
    state._render();
  }

  // ── modality-projection：在共享空间中对齐图像和文本 Vector ───────────────
  function modalityProjection(host) {
    var state = { align: 0 };
    var W = 360, H = 260, CX = 70, CY = 150, R = 120;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var imgDeg0 = 78, txtDeg0 = 14; // 初始状态未对齐
    function vec(deg, color, label) {
      var rad = deg * Math.PI / 180;
      var x2 = CX + R * Math.cos(rad), y2 = CY - R * Math.sin(rad);
      svg.appendChild(svgEl('line', { x1: CX, y1: CY, x2: x2.toFixed(1), y2: y2.toFixed(1), stroke: color, 'stroke-width': '2.5' }));
      svg.appendChild(txt((x2 + 6).toFixed(1), (y2 - 2).toFixed(1), label, 'start', color, 11));
    }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var t = clamp(state.align, 0, 1);
      // 当 t -> 1 时，两个 Vector 都会收敛到共同的 45 度方向。
      var target = 46;
      var imgDeg = imgDeg0 + t * (target - imgDeg0);
      var txtDeg = txtDeg0 + t * (target - txtDeg0);
      svg.appendChild(svgEl('path', { d: 'M ' + CX + ' ' + CY + ' L ' + (CX + R) + ' ' + CY, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      vec(imgDeg, 'var(--blueprint,#3553ff)', '图像');
      vec(txtDeg, 'var(--warn,#b8870f)', '文本');
      var cos = Math.cos((imgDeg - txtDeg) * Math.PI / 180);
      num.innerHTML = cos.toFixed(3) + ' <small>cosine</small>';
      meta.textContent = '投影之间的夹角 ' + Math.abs(imgDeg - txtDeg).toFixed(0) + '°  ·  ' + (cos > 0.97 ? '已对齐：匹配对指向相同方向' : cos > 0.6 ? '部分对齐' : '未对齐：位于不同子空间');
      formula.textContent = 'enc_img(x) → ℝ^d ← enc_txt(y)，通过 Training 最大化匹配对的 cos(z_img, z_txt)';
    };
    var grid = el('div', {}, [slider(state, 'align', '投影 Training 进度', 0, 1, 0.02)]);
    shell(host, '模态投影', '拖动以对齐匹配对', grid, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula],
      '独立的图像 encoder 和文本 encoder 会落在各自的空间中，因此一对匹配项起初会指向不同方向。学习得到的投影会将两者映射到同一个共享的 d 维空间中，Training 则让匹配 Vector 共同旋转，直到它们的 cosine 接近 1。对齐后，只需一种距离度量就能跨模态进行比较。');
    state._render();
  }

  // ── cfg-guidance-scale：guided = uncond + w (cond - uncond) ────────────────
  function cfgGuidanceScale(host) {
    var state = { w: 3.0 };
    var W = 520, H = 240, PAD = 40;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // 一维示意图：预测是数轴上的一个点；各 Vector 相加。
    var uncond = 1.4, cond = 3.6; // 基础预测（例如去噪估计）
    var XMIN = 0, XMAX = 9;
    function px(v) { return PAD + (v - XMIN) / (XMAX - XMIN) * (W - 2 * PAD); }
    var axisY = 120;
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var w = state.w;
      var guided = uncond + w * (cond - uncond);
      var gClamp = clamp(guided, XMIN, XMAX);
      svg.appendChild(svgEl('line', { x1: PAD, y1: axisY, x2: W - PAD, y2: axisY, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
      function tick(v, color, label, dy) {
        svg.appendChild(svgEl('circle', { cx: px(v).toFixed(1), cy: String(axisY), r: '5', fill: color }));
        svg.appendChild(txt(px(v).toFixed(1), String(axisY + dy), label, 'middle', color, 10));
      }
      // 从 uncond 沿 cond 方向绘制箭头，并按 w 缩放
      svg.appendChild(svgEl('line', { x1: px(uncond).toFixed(1), y1: String(axisY - 26), x2: px(gClamp).toFixed(1), y2: String(axisY - 26), stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      svg.appendChild(txt(px((uncond + gClamp) / 2).toFixed(1), String(axisY - 34), 'w · (cond − uncond)', 'middle', 'var(--blueprint,#3553ff)', 10));
      tick(uncond, 'var(--ink-mute,#999)', '无条件', 22);
      tick(cond, 'var(--warn,#b8870f)', '条件', 38);
      tick(gClamp, 'var(--blueprint,#3553ff)', '引导后', 54);
      // 多样性／锐度条
      var diversity = clamp(1 / (1 + 0.5 * w), 0, 1);
      var sharp = clamp(w / 12, 0, 1);
      svg.appendChild(txt(PAD.toFixed(1), '200', '多样性', 'start', 'var(--ink-soft,#555)', 10));
      svg.appendChild(svgEl('rect', { x: String(PAD), y: '204', width: (diversity * 180).toFixed(1), height: '8', fill: 'var(--ink-mute,#999)' }));
      svg.appendChild(txt((W / 2 + 20).toFixed(1), '200', 'Prompt 遵循度', 'start', 'var(--ink-soft,#555)', 10));
      svg.appendChild(svgEl('rect', { x: String(W / 2 + 20), y: '204', width: (sharp * 180).toFixed(1), height: '8', fill: 'var(--blueprint,#3553ff)' }));
      num.innerHTML = 'w = ' + w.toFixed(1);
      meta.textContent = w <= 1.05 ? 'w ≈ 1：预测靠近无条件结果，多样性较高，但对 Prompt 的遵循较弱'
        : w >= 9 ? 'w 非常高：结果饱和且锐利，但多样性更低，也更容易产生瑕疵'
          : '引导估计从无条件结果向 Prompt 方向推进了 ' + ((guided - uncond)).toFixed(1);
      formula.textContent = 'ε_guided = ε_uncond + w · (ε_cond − ε_uncond),  w = ' + w.toFixed(1) + '   ·   w=1 是普通条件预测，更大的 w 会进行过度外推';
    };
    var grid = el('div', {}, [slider(state, 'w', 'guidance scale w', 1.0, 12.0, 0.1)]);
    shell(host, 'CLASSIFIER-FREE GUIDANCE', '拖动 w', grid, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula],
      'Classifier-free guidance 会运行 diffusion Model 两次，一次带 Prompt，一次不带 Prompt，然后沿两者差值的方向进行外推。scale 为 1 时是普通条件预测；更高的 scale 会进一步推向 Prompt，用多样性换取遵循度。推得过远会导致样本饱和并失真，因此实际使用的 scale 通常位于中间区间。');
    state._render();
  }

  // ── vq-codebook：连续 encoder 输出吸附到最近的 code ──────────────────────
  function vqCodebook(host) {
    var state = { logK: 4 };
    var W = 520, H = 240, PAD = 34;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // 二维空间中的一组固定连续 encoder 输出；结果是确定性的。
    var enc = [
      [0.12, 0.18], [0.22, 0.74], [0.55, 0.30], [0.78, 0.62],
      [0.40, 0.88], [0.66, 0.12], [0.88, 0.40], [0.32, 0.46],
      [0.50, 0.66], [0.14, 0.92], [0.92, 0.84], [0.70, 0.92]
    ];
    function px(x) { return PAD + x * (W - 2 * PAD); }
    function py(y) { return H - PAD - y * (H - 2 * PAD); }
    function codebook(K) {
      // 覆盖单位正方形的确定性 code 网格。
      var side = Math.max(1, Math.round(Math.sqrt(K)));
      var pts = [], i, j;
      for (i = 0; i < side; i++) {
        for (j = 0; j < side; j++) {
          if (pts.length >= K) { break; }
          pts.push([(i + 0.5) / side, (j + 0.5) / side]);
        }
      }
      return pts;
    }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var K = Math.round(Math.pow(2, state.logK));
      var codes = codebook(K);
      var used = {}, totErr = 0;
      // 绘制 codebook Vector
      codes.forEach(function (c) {
        svg.appendChild(svgEl('rect', { x: (px(c[0]) - 4).toFixed(1), y: (py(c[1]) - 4).toFixed(1), width: '8', height: '8', fill: 'none', stroke: 'var(--ink-mute,#999)', 'stroke-width': '1' }));
      });
      enc.forEach(function (e) {
        // 最近的 code（Quantization）
        var best = 0, bd = 1e9, k;
        for (k = 0; k < codes.length; k++) {
          var dx = e[0] - codes[k][0], dy = e[1] - codes[k][1];
          var d = dx * dx + dy * dy;
          if (d < bd) { bd = d; best = k; }
        }
        used[best] = 1; totErr += Math.sqrt(bd);
        svg.appendChild(svgEl('line', { x1: px(e[0]).toFixed(1), y1: py(e[1]).toFixed(1), x2: px(codes[best][0]).toFixed(1), y2: py(codes[best][1]).toFixed(1), stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1' }));
        svg.appendChild(svgEl('circle', { cx: px(e[0]).toFixed(1), cy: py(e[1]).toFixed(1), r: '3.5', fill: 'var(--blueprint,#3553ff)' }));
        svg.appendChild(svgEl('rect', { x: (px(codes[best][0]) - 3).toFixed(1), y: (py(codes[best][1]) - 3).toFixed(1), width: '6', height: '6', fill: 'var(--warn,#b8870f)' }));
      });
      var usage = Object.keys(used).length;
      var avgErr = totErr / enc.length;
      num.innerHTML = K + ' <small>个 code</small>';
      meta.textContent = enc.length + ' 个 Vector 使用了 ' + K + ' 个 code 中的 ' + usage + ' 个  ·  平均 Quantization 误差 ' + avgErr.toFixed(3) + '  ·  bits/Token ' + state.logK;
      formula.textContent = 'z_q = argmin_k ‖z_e − e_k‖,  codebook 大小 K = ' + K + '   ·   更大的 K → 更低的误差，但需要学习更多 code';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'logK', 'codebook 大小 (2^x)', 2, 8, 1, function (v) { return String(Math.round(Math.pow(2, v))); })
    ]);
    shell(host, 'VQ CODEBOOK', '拖动 codebook 大小', grid, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula],
      'VQ-VAE encoder 会生成连续 Vector（蓝点），但 Model 需要离散 Token。每个 Vector 都会吸附到最近的 codebook 条目（橙色方块），从而把图像转换为整数 code 序列。更大的 codebook 能进行更精细的 Quantization，降低重建误差，但每个 Token 会占用更多 bit，并可能出现始终未被使用的 code。');
    state._render();
  }

  // ── video-temporal-patches：Token = 帧数 × (H/p)(W/p) ─────────────────────
  function videoTemporalPatches(host) {
    var state = { frames: 8, patch: 16, tubelet: 2 };
    var GRID = 224; // 假设每帧为 224x224
    var W = 520, H = 230, PAD = 30;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var p = state.patch, F = state.frames, tub = state.tubelet;
      var perSide = Math.floor(GRID / p);
      var spatial = perSide * perSide;
      var temporal = Math.max(1, Math.floor(F / tub));
      var tokens = spatial * temporal;
      // 绘制一帧具有代表性的网格及堆叠指示
      var face = 120, ox = 40, oy = 36, depth = 5;
      var stack = Math.min(temporal, 6);
      var s;
      for (s = stack - 1; s >= 0; s--) {
        var sx = ox + s * depth * 4, sy = oy + s * depth * 2;
        svg.appendChild(svgEl('rect', { x: sx.toFixed(1), y: sy.toFixed(1), width: String(face), height: String(face), fill: s === 0 ? 'var(--bg-surface,#eee)' : 'var(--bg,#fafaf5)', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'fill-opacity': (1 - s * 0.12).toFixed(2) }));
      }
      // 在最前面的一帧上绘制 patch 网格
      var i, j;
      for (i = 0; i <= perSide; i++) {
        svg.appendChild(svgEl('line', { x1: (ox + i * face / perSide).toFixed(1), y1: String(oy), x2: (ox + i * face / perSide).toFixed(1), y2: String(oy + face), stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '0.6', 'stroke-opacity': '0.55' }));
        svg.appendChild(svgEl('line', { x1: String(ox), y1: (oy + i * face / perSide).toFixed(1), x2: String(ox + face), y2: (oy + i * face / perSide).toFixed(1), stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '0.6', 'stroke-opacity': '0.55' }));
      }
      svg.appendChild(txt((ox + face / 2).toFixed(1), String(oy + face + 18), '每帧 ' + perSide + ' × ' + perSide + ' 个 patch', 'middle', 'var(--ink-soft,#555)', 10));
      // 右侧读数
      svg.appendChild(txt('300', '60', F + ' 帧', 'start', 'var(--ink-soft,#555)', 11));
      svg.appendChild(txt('300', '82', '÷ ' + tub + ' (tubelet) = ' + temporal + ' 个时间单元', 'start', 'var(--ink-mute,#777)', 10));
      svg.appendChild(txt('300', '108', spatial + ' 个空间 patch', 'start', 'var(--ink-soft,#555)', 11));
      svg.appendChild(txt('300', '134', temporal + ' × ' + spatial + ' =', 'start', 'var(--ink-mute,#777)', 11));
      svg.appendChild(txt('300', '160', fmtInt(tokens) + ' 个 Token', 'start', 'var(--blueprint,#3553ff)', 15));
      num.innerHTML = fmtInt(tokens) + ' <small>个 Token</small>';
      meta.textContent = F + ' 帧 · ' + GRID + '² px · patch ' + p + ' · tubelet ' + tub + '  ·  ' + spatial + ' 个空间单元 × ' + temporal + ' 个时间单元';
      formula.textContent = 'Token 数 = ⌊帧数 / tubelet⌋ · (H/p)·(W/p) = ' + temporal + ' · ' + spatial + ' = ' + fmtInt(tokens) + '   ·   Token 数决定 Attention 成本';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'frames', '帧数', 1, 64, 1),
      slider(state, 'patch', 'patch 大小 (px)', 8, 56, 4),
      slider(state, 'tubelet', 'tubelet（帧/Token）', 1, 8, 1)
    ]);
    shell(host, '视频时空 PATCH', '拖动帧数和 patch 大小', grid, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula],
      '视频会同时在空间和时间维度上进行 Tokenization。每个 224 像素的帧会被拆分为空间 patch 网格，多个帧则沿时间维度组成 tubelet。Token 总数等于时间单元数乘以空间单元数，而 Attention 成本会随 Token 数量的平方增长，因此采用细粒度 patch 的长视频片段会让资源预算急剧膨胀。增大 patch 和 tubelet 是将成本保持在可处理范围内的主要手段。');
    state._render();
  }

  // ── audio-text-ctc：单调对齐，blank 折叠为更短的文本 ───────────────────────
  function audioTextCtc(host) {
    var state = { frames: 12, dup: 1 };
    var target = ['C', 'A', 'T'];
    var W = 520, H = 240, PAD = 30;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var T = state.frames, dup = state.dup;
      // 构造确定性的单调发射序列：将目标字母分布到各帧中，
      // 使用重复项（dup），其余位置由 blank 填充。
      var emit = [];
      var spoken = target.length * dup;
      // 将字母放在中间区域，在两端和字母之间放置 blank。
      var lead = Math.max(0, Math.floor((T - spoken) / 2));
      var f, idx = 0;
      for (f = 0; f < T; f++) {
        if (f >= lead && idx < spoken) {
          emit.push(target[Math.floor(idx / dup)]);
          idx++;
        } else {
          emit.push('_'); // blank
        }
      }
      // CTC 折叠：先移除重复项，再移除 blank。
      var collapsed = [], prev = null, k;
      for (k = 0; k < emit.length; k++) {
        if (emit[k] !== prev) { if (emit[k] !== '_') { collapsed.push(emit[k]); } }
        prev = emit[k];
      }
      var cellW = (W - 2 * PAD) / T;
      // 顶行：带有发射符号的音频帧
      for (f = 0; f < T; f++) {
        var x = PAD + f * cellW;
        var isBlank = emit[f] === '_';
        svg.appendChild(svgEl('rect', { x: (x + 1).toFixed(1), y: '40', width: (cellW - 2).toFixed(1), height: '34', fill: isBlank ? 'var(--bg-surface,#eee)' : 'var(--blueprint,#3553ff)', 'fill-opacity': isBlank ? '0.5' : '0.8', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '0.5' }));
        svg.appendChild(txt((x + cellW / 2).toFixed(1), '62', emit[f] === '_' ? '∅' : emit[f], 'middle', isBlank ? 'var(--ink-mute,#999)' : 'var(--bg,#fafaf5)', 12));
      }
      svg.appendChild(txt(PAD.toFixed(1), '32', T + ' 个音频帧（∅ = blank）', 'start', 'var(--ink-mute,#777)', 10));
      // 向下指向折叠后文本的对齐路径箭头
      var ty = 150, tStep = (W - 2 * PAD) / Math.max(1, target.length);
      for (k = 0; k < target.length; k++) {
        var tx = PAD + (k + 0.5) * tStep;
        svg.appendChild(svgEl('rect', { x: (tx - 16).toFixed(1), y: ty.toFixed(1), width: '32', height: '30', fill: 'var(--warn,#b8870f)', 'fill-opacity': '0.75', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '0.5' }));
        svg.appendChild(txt(tx.toFixed(1), (ty + 20).toFixed(1), target[k], 'middle', 'var(--bg,#fafaf5)', 13));
      }
      svg.appendChild(txt(PAD.toFixed(1), (ty - 8).toFixed(1), '折叠重复项，移除 blank →', 'start', 'var(--ink-mute,#777)', 10));
      var ok = collapsed.join('') === target.join('');
      num.innerHTML = T + ' → ' + collapsed.length + ' <small>帧 → 字符</small>';
      meta.textContent = '发射序列“' + emit.join('') + '”折叠为“' + collapsed.join('') + '”  ·  ' + (ok ? '与目标 CAT 匹配' : '尚未拼出 CAT');
      formula.textContent = 'CTC：多种对齐映射到同一个 Label · collapse(a a _ b) = a b   ·   blank 将重复项隔开，使“AA”得以保留';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'frames', '音频帧数', 4, 24, 1),
      slider(state, 'dup', '每个字母占用的帧数', 1, 4, 1)
    ]);
    shell(host, '音频-文本 CTC', '拖动帧数和持续时间', grid, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula],
      '音频是很长的帧序列，而转录文本很短。CTC 允许 Model 在每一帧发射一个 Label 或 blank，然后通过合并重复项并移除 blank 来折叠输出。对齐保持单调，时间只会向前推进，而 blank Token 能让真正的双字母不至于折叠成一个字母。多种帧级对齐都可以映射到相同的最终文本。');
    state._render();
  }

  LF.register({
    'contrastive-matrix': contrastiveMatrix,
    'cross-attention-fusion': crossAttentionFusion,
    'modality-projection': modalityProjection,
    'cfg-guidance-scale': cfgGuidanceScale,
    'vq-codebook': vqCodebook,
    'video-temporal-patches': videoTemporalPatches,
    'audio-text-ctc': audioTextCtc
  });
})();
