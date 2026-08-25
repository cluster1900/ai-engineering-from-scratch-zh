/* figures-cv3.js — Phase 4（计算机视觉）的动画 SVG 课程图示，
   第二批。加载于 lesson-figures.js 之后，并通过 window.LF 注册组件。
   每个图示都是一个自行运行的 CV 概念 SMIL 动画：
   不使用 JS 定时器，不执行计算循环。原生 ES5，无依赖，通过 CSS 变量适配主题。
   编写方式与 docs/en.md 中的以下 fenced block 相同：
       ```figure
       cv3-roialign-sampling
       ``` */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;

  function shell(label, hint, svg, caption) {
    return el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [hint])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out' }, [svg])]),
      el('div', { class: 'lf-cap' }, [caption])
    ]);
  }
  function anim(attr, vals, dur, extra) {
    var a = { attributeName: attr, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animate', a);
  }
  function txt(x, y, s, size, anchor) {
    return svgEl('text', { x: x, y: y, fill: 'var(--ink-mute,#777)', 'font-size': size || 10, 'font-family': 'monospace', 'text-anchor': anchor || 'start' }, [document.createTextNode(s)]);
  }
  var BLUE = 'var(--blueprint,#3553ff)', INK = 'var(--ink,#1a1a1a)', SOFT = 'var(--rule-soft,#ddd)', WARN = 'var(--warn,#b8870f)', MUTE = 'var(--ink-mute,#777)';

  // ── cv3-roialign-sampling (08)：proposal box 的采样点位于网格之外 ──
  function roialignSampling(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    svg.appendChild(txt(14, 16, 'feature map · 整数 pixel 网格'));
    var gx = 18, gy = 26, cell = 30, N = 6, r, c;
    for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
      svg.appendChild(svgEl('rect', { x: gx + c * cell, y: gy + r * cell, width: cell, height: cell, fill: BLUE, opacity: (0.06 + 0.12 * ((r * 2 + c) % 4)).toFixed(3), stroke: SOFT, 'stroke-width': '0.6' }));
    }
    // 带有小数角点的 proposal box，轻微滑动以展示错位
    var box = svgEl('rect', { x: 70, y: 64, width: 118, height: 110, fill: 'none', stroke: WARN, 'stroke-width': '2', 'stroke-dasharray': '5 3' });
    box.appendChild(anim('x', '70;78;70', '5s', { keyTimes: '0;0.5;1' }));
    svg.appendChild(box);
    svg.appendChild(txt(70, 60, 'RoI proposal（小数坐标）', 9));
    // 四个 bilinear 采样点，每个点与其读取的四个相邻单元格一同脉动
    var pts = [[100, 94], [150, 94], [100, 144], [150, 144]];
    pts.forEach(function (p, i) {
      var d = svgEl('circle', { cx: p[0], cy: p[1], r: '4', fill: WARN, opacity: '0' });
      d.appendChild(anim('opacity', '0;0;1;1', '5s', { begin: (i * 0.2) + 's', keyTimes: '0;0.25;0.4;1' }));
      svg.appendChild(d);
      // 指向周围四个整数单元格中心的十字线（bilinear 权重）
      var ring = svgEl('circle', { cx: p[0], cy: p[1], r: '14', fill: 'none', stroke: WARN, 'stroke-width': '1', opacity: '0' });
      ring.appendChild(anim('opacity', '0;0;0.6;0;0', '5s', { begin: (i * 0.2) + 's', keyTimes: '0;0.4;0.55;0.8;1' }));
      svg.appendChild(ring);
    });
    // 输出：右侧整齐、固定尺寸的 2x2 pooled 网格
    svg.appendChild(txt(320, 60, '对齐后的 2x2 输出', 9));
    var ox = 330, oy = 70, oc = 44, rr, cc;
    for (rr = 0; rr < 2; rr++) for (cc = 0; cc < 2; cc++) {
      var o = svgEl('rect', { x: ox + cc * oc, y: oy + rr * oc, width: oc - 3, height: oc - 3, fill: BLUE, stroke: BLUE, opacity: '0' });
      o.appendChild(anim('opacity', '0;0;0.7;0.7', '5s', { keyTimes: '0;0.55;0.75;1' }));
      svg.appendChild(o);
    }
    // 从 RoI 指向输出的箭头
    var arr = svgEl('line', { x1: 196, y1: 120, x2: 322, y2: 120, stroke: MUTE, 'stroke-width': '1.5', 'stroke-dasharray': '130', 'stroke-dashoffset': '130' });
    arr.appendChild(anim('stroke-dashoffset', '130;130;0;0', '5s', { keyTimes: '0;0.45;0.7;1' }));
    svg.appendChild(arr);
    svg.appendChild(txt(320, 150, 'bilinear interpolation，', 10));
    svg.appendChild(txt(320, 165, '不对 box 进行舍入', 10));
    host.appendChild(shell('MASK R-CNN · RoIAlign', '采样点落在 pixel 之间', svg,
      'RoIPool 会将 proposal box 两次吸附到整数 feature 网格，这些舍入操作会让 mask 产生不足一个 pixel 的模糊偏移。RoIAlign 保留 box 的小数坐标：它在每个输出 bin 内放置一组固定采样点，并通过对周围四个单元格执行 bilinear interpolation 来读取每个点。不进行舍入，因此 mask 会落在物体实际所在的位置。'));
  }

  // ── cv3-latent-compression (11)：图像网格缩小为小型 latent，再还原 ──
  function latentCompression(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    svg.appendChild(txt(14, 16, '3 x 512 x 512 图像'));
    svg.appendChild(txt(220, 16, '4 x 64 x 64 latent'));
    svg.appendChild(txt(380, 16, '解码后的图像'));
    // 左侧大网格（以 8x8 代替），每个单元格在 encoder 读取时逐渐淡出
    var i;
    function grid(ox, oy, n, c, fillTarget, begin, kt) {
      var r, cc;
      for (r = 0; r < n; r++) for (cc = 0; cc < n; cc++) {
        var rect = svgEl('rect', { x: ox + cc * c, y: oy + r * c, width: c - 1.5, height: c - 1.5, fill: BLUE, opacity: '0' });
        var base = (0.18 + 0.45 * ((r * 3 + cc * 2) % 5) / 5).toFixed(2);
        rect.appendChild(anim('opacity', '0;' + base + ';' + base + ';' + base, '5s', { begin: begin, keyTimes: kt }));
        svg.appendChild(rect);
      }
    }
    grid(14, 30, 8, 21, BLUE, '0s', '0;0.12;0.9;1');
    // 向小网格收缩的 VAE encoder 楔形
    var enc = svgEl('polygon', { points: '186,40 210,90 210,150 186,200', fill: BLUE, opacity: '0.16', stroke: BLUE });
    svg.appendChild(enc);
    svg.appendChild(txt(186, 218, 'VAE encoder', 9));
    // 小型 latent 网格（4x4），在楔形触发时变亮
    var lx = 224, ly = 70, lc = 22, r, cc;
    for (r = 0; r < 4; r++) for (cc = 0; cc < 4; cc++) {
      var lr = svgEl('rect', { x: lx + cc * lc, y: ly + r * lc, width: lc - 2, height: lc - 2, fill: WARN, opacity: '0' });
      var v = (0.3 + 0.5 * ((r * 5 + cc * 3) % 4) / 4).toFixed(2);
      lr.appendChild(anim('opacity', '0;0;' + v + ';' + v, '5s', { keyTimes: '0;0.3;0.45;1' }));
      svg.appendChild(lr);
    }
    // 向外扩展还原的 decoder 楔形
    var dec = svgEl('polygon', { points: '326,90 350,40 350,200 326,150', fill: BLUE, opacity: '0.16', stroke: BLUE });
    svg.appendChild(dec);
    svg.appendChild(txt(322, 218, 'VAE decoder', 9));
    grid(360, 30, 8, 21, BLUE, '0s', '0;0.55;0.78;1');
    svg.appendChild(txt(150, 226, '(3*512*512)/(4*64*64) = 去噪计算量减少 48x', 9));
    host.appendChild(shell('STABLE DIFFUSION · LATENT SPACE', '在 64x64 中执行 diffusion，而不是 512x512', svg,
      'Pixel-space diffusion 每一步都要对 786,432 个值执行 Backpropagation。Stable Diffusion 训练一个 VAE，将 3x512x512 图像压缩为 4x64x64 latent（橙色小网格），在其中运行整个去噪循环，随后再解码回 pixel。对 latent 执行 Attention 的成本降低了 48x，正因如此，开放权重的 text-to-image 才具备实用性。'));
  }

  // ── cv3-ctc-collapse (19)：逐帧字符预测折叠为字符串 ───
  function ctcCollapse(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    svg.appendChild(txt(14, 16, 'CRNN 逐帧预测（每个时间步一列）'));
    var labels = ['h', 'h', '_', 'e', 'l', 'l', '_', 'l', 'o', 'o'];
    var x0 = 22, cw = 44, top = 40;
    var i;
    for (i = 0; i < labels.length; i++) {
      var cx = x0 + i * cw;
      var box = svgEl('rect', { x: cx, y: top, width: cw - 6, height: 34, fill: labels[i] === '_' ? MUTE : BLUE, opacity: '0' });
      box.appendChild(anim('opacity', '0;0.8;0.8', '5s', { begin: (i * 0.08) + 's', keyTimes: '0;0.18;1' }));
      svg.appendChild(box);
      var t = svgEl('text', { x: cx + (cw - 6) / 2, y: top + 23, fill: 'var(--bg,#fafaf5)', 'font-size': '14', 'font-family': 'monospace', 'text-anchor': 'middle', opacity: '0' }, [document.createTextNode(labels[i] === '_' ? 'ε' : labels[i])]);
      t.appendChild(anim('opacity', '0;1;1', '5s', { begin: (i * 0.08) + 's', keyTimes: '0;0.2;1' }));
      svg.appendChild(t);
    }
    // 步骤 1 标签：合并重复项。步骤 2：删除 blank。动画括号从下方扫过
    svg.appendChild(txt(14, 100, '规则 1 · 合并相邻重复项', 10));
    svg.appendChild(txt(14, 116, '规则 2 · 删除 blank ε', 10));
    var sweep = svgEl('rect', { x: x0, y: top, width: cw - 6, height: 34, fill: 'none', stroke: WARN, 'stroke-width': '2.5' });
    var path = 'M 0 0';
    for (i = 1; i < labels.length; i++) path += ' L ' + (i * cw) + ' 0';
    var mp = svgEl('animateMotion', { dur: '5s', repeatCount: 'indefinite', path: path, keyTimes: '0;0.2;0.95;1', keyPoints: '0;0;1;1', calcMode: 'linear' });
    sweep.appendChild(mp);
    svg.appendChild(sweep);
    // 折叠后的结果，字符逐个落入
    var out = 'hello';
    var ox = 180, oy = 175;
    for (i = 0; i < out.length; i++) {
      var oc = svgEl('text', { x: ox + i * 30, y: oy, fill: BLUE, 'font-size': '28', 'font-family': 'monospace', opacity: '0' }, [document.createTextNode(out[i])]);
      oc.appendChild(anim('opacity', '0;0;1;1', '5s', { keyTimes: '0;0.6;' + (0.7 + i * 0.04).toFixed(2) + ';1' }));
      svg.appendChild(oc);
    }
    svg.appendChild(txt(180, 200, 'h h ε e l l ε l o o  ->  "hello"', 10));
    host.appendChild(shell('OCR · CTC COLLAPSE', '帧标签折叠为一个字符串', svg,
      'CRNN 在每个时间步输出一个字符（或 blank ε），无需与 input 建立固定对齐。CTC 定义了折叠规则：先合并连续出现的相同标签，再删除 blank。两个 l 序列之间的 blank 正是防止 "hello" 被折叠成 "helo" 的关键。Training 会对所有能够折叠为目标的对齐方式求和。'));
  }

  // ── cv3-pose-heatmap (21)：Gaussian 峰值逐渐清晰，骨架随之绘制 ───
  function poseHeatmap(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' });
    svg.appendChild(txt(14, 16, '逐关键点 heatmap（argmax = 关节）'));
    svg.appendChild(txt(300, 16, '组装后的骨架'));
    // 左侧：模糊的 heatmap 光斑逐渐收敛为峰值
    var hx = 90, hy = 110;
    var blob = svgEl('circle', { cx: hx, cy: hy, r: '46', fill: WARN, opacity: '0.18' });
    blob.appendChild(anim('r', '46;46;20;20', '5s', { keyTimes: '0;0.3;0.55;1' }));
    blob.appendChild(anim('opacity', '0.16;0.16;0.4;0.4', '5s', { keyTimes: '0;0.3;0.55;1' }));
    svg.appendChild(blob);
    var peak = svgEl('circle', { cx: hx, cy: hy, r: '5', fill: WARN, opacity: '0' });
    peak.appendChild(anim('opacity', '0;0;1;1', '5s', { keyTimes: '0;0.5;0.6;1' }));
    svg.appendChild(peak);
    svg.appendChild(txt(60, 180, 'K 个 heatmap 之一', 9));
    // 右侧：约 17 个关节；这里使用由关节与骨骼组成的紧凑骨架
    var J = {
      head: [400, 50], neck: [400, 78], sho_l: [372, 86], sho_r: [428, 86],
      elb_l: [360, 122], elb_r: [440, 122], hip_l: [384, 140], hip_r: [416, 140],
      kne_l: [380, 184], kne_r: [420, 184], ank_l: [378, 222], ank_r: [422, 222]
    };
    var bones = [['head', 'neck'], ['neck', 'sho_l'], ['neck', 'sho_r'], ['sho_l', 'elb_l'], ['sho_r', 'elb_r'],
      ['neck', 'hip_l'], ['neck', 'hip_r'], ['hip_l', 'kne_l'], ['hip_r', 'kne_r'], ['kne_l', 'ank_l'], ['kne_r', 'ank_r']];
    bones.forEach(function (b, i) {
      var a = J[b[0]], z = J[b[1]];
      var len = Math.round(Math.hypot(z[0] - a[0], z[1] - a[1])) + 2;
      var ln = svgEl('line', { x1: a[0], y1: a[1], x2: z[0], y2: z[1], stroke: BLUE, 'stroke-width': '2.4', 'stroke-dasharray': len, 'stroke-dashoffset': len });
      ln.appendChild(anim('stroke-dashoffset', len + ';' + len + ';0;0', '5s', { begin: (i * 0.06) + 's', keyTimes: '0;0.4;0.75;1' }));
      svg.appendChild(ln);
    });
    var k;
    for (k in J) {
      var d = svgEl('circle', { cx: J[k][0], cy: J[k][1], r: '3.4', fill: WARN, opacity: '0' });
      d.appendChild(anim('opacity', '0;0;1;1', '5s', { keyTimes: '0;0.45;0.6;1' }));
      svg.appendChild(d);
    }
    svg.appendChild(txt(60, 236, '为每个关节回归一个 Gaussian，并取 argmax pixel', 9));
    host.appendChild(shell('POSE · HEATMAP REGRESSION', '峰值逐渐清晰，骨骼完成连接', svg,
      '姿态 Model 不会直接回归坐标。它为每个关键点输出一个 heatmap，并在 Training 时让 Gaussian 凸起覆盖真实关节；argmax pixel 就是该关节的坐标。当全部 K 个峰值确定后，通过固定的人体图结构（top-down）或 association fields（bottom-up）将关节连接为骨架。'));
  }

  // ── cv3-gaussian-splat (22)：重叠光斑通过 alpha 合成为场景 ──
  function gaussianSplat(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    svg.appendChild(txt(14, 16, '一组带方向的 3D Gaussians，经排序和 alpha 合成'));
    // 一组椭圆 splat，从前向后逐个淡入并构成形状
    var splats = [
      [150, 150, 70, 40, 18, BLUE, 0.22], [210, 110, 55, 34, -22, BLUE, 0.26],
      [280, 150, 64, 38, 8, WARN, 0.24], [330, 110, 46, 30, 30, BLUE, 0.28],
      [200, 175, 50, 26, -10, INK, 0.2], [300, 95, 40, 24, 14, WARN, 0.3],
      [250, 140, 78, 44, 0, BLUE, 0.18], [360, 160, 44, 30, -18, INK, 0.22]
    ];
    splats.forEach(function (s, i) {
      var g = svgEl('ellipse', { cx: s[0], cy: s[1], rx: s[2], ry: s[3], fill: s[5], opacity: '0', transform: 'rotate(' + s[4] + ' ' + s[0] + ' ' + s[1] + ')' });
      g.appendChild(anim('opacity', '0;0;' + s[6] + ';' + s[6], '5s', { begin: (i * 0.18) + 's', keyTimes: '0;0.1;0.4;1' }));
      svg.appendChild(g);
    });
    // 一条从前向后扫过的“深度排序”线
    var sort = svgEl('line', { x1: 130, y1: 60, x2: 130, y2: 210, stroke: WARN, 'stroke-width': '1.5', opacity: '0.7' });
    sort.appendChild(anim('x1', '130;390;390', '5s', { keyTimes: '0;0.55;1' }));
    sort.appendChild(anim('x2', '130;390;390', '5s', { keyTimes: '0;0.55;1' }));
    svg.appendChild(sort);
    svg.appendChild(txt(420, 70, '每个 splat：', 9));
    svg.appendChild(txt(420, 86, 'mu, R, s,', 9));
    svg.appendChild(txt(420, 100, 'alpha, SH', 9));
    svg.appendChild(txt(420, 124, '执行 rasterise，', 9));
    svg.appendChild(txt(420, 138, '而非 ray march', 9));
    svg.appendChild(txt(14, 228, '每条 ray 无需查询 MLP；将每个 blob 投影到 2D，并以 100+ fps 混合', 9));
    host.appendChild(shell('3D GAUSSIAN SPLATTING', 'blob 经投影与混合，无需 ray marching', svg,
      '一个场景由数百万个 3D Gaussians 构成，每个 Gaussian 都携带中心、rotation+scale Covariance、不透明度以及与视角相关的颜色。渲染过程会将每个 blob 投影为 2D 椭圆，按深度排序，并从前向后执行 alpha 合成；NeRF 需要数百次 MLP 查询才能近似实现同样的混合效果。因此，splat 能以 100+ fps 渲染，并在数分钟内完成 Training。'));
  }

  // ── cv3-rectified-flow (23)：直线路径与弯曲的 diffusion 噪声->数据路径 ───
  function rectifiedFlow(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    var nx = 70, ny = 180, dx = 440, dy = 70;
    svg.appendChild(svgEl('circle', { cx: nx, cy: ny, r: '7', fill: MUTE }));
    svg.appendChild(txt(40, 205, 'x_T 噪声'));
    svg.appendChild(svgEl('circle', { cx: dx, cy: dy, r: '7', fill: BLUE }));
    svg.appendChild(txt(412, 60, 'x_0 数据'));
    // 弯曲的 DDPM 轨迹（许多小步）
    var curve = 'M 70 180 C 120 60, 220 230, 300 90 S 400 140, 440 70';
    var cv = svgEl('path', { d: curve, fill: 'none', stroke: MUTE, 'stroke-width': '1.6', 'stroke-dasharray': '5 4', opacity: '0.7' });
    svg.appendChild(cv);
    svg.appendChild(txt(120, 130, 'DDPM：弯曲路径，约 1000 步', 10));
    // 圆点沿曲线以许多小步向前移动
    var slow = svgEl('circle', { r: '4', fill: MUTE });
    var sm = svgEl('animateMotion', { dur: '5s', repeatCount: 'indefinite', path: curve, keyTimes: '0;0.1;0.2;0.3;0.4;0.5;0.6;0.7;0.8;0.9;1', keyPoints: '0;0.1;0.2;0.3;0.4;0.5;0.6;0.7;0.8;0.9;1', calcMode: 'discrete' });
    slow.appendChild(sm);
    svg.appendChild(slow);
    // 笔直的 rectified-flow 线
    var line = 'M 70 180 L 440 70';
    var st = svgEl('path', { d: line, fill: 'none', stroke: BLUE, 'stroke-width': '2.4', 'stroke-dasharray': '388', 'stroke-dashoffset': '388' });
    st.appendChild(anim('stroke-dashoffset', '388;0;0', '5s', { keyTimes: '0;0.5;1' }));
    svg.appendChild(st);
    svg.appendChild(txt(250, 165, 'rectified flow：直线路径，约 20 步', 10));
    // 沿直线进行几次大步移动
    var fast = svgEl('circle', { r: '5', fill: BLUE });
    var fm = svgEl('animateMotion', { dur: '5s', repeatCount: 'indefinite', path: line, keyTimes: '0;0.25;0.5;0.75;1', keyPoints: '0;0.25;0.5;0.75;1', calcMode: 'discrete' });
    fast.appendChild(fm);
    svg.appendChild(fast);
    host.appendChild(shell('RECTIFIED FLOW', '拉直路径，用 20 步完成采样', svg,
      'DDPM 学习从噪声到数据的弯曲轨迹，因此要忠实完成积分，需要数百个小步。Rectified flow 训练 Model 沿噪声样本与数据点之间的直线移动。直线路径需要的积分步数少得多，因此 SD3 和 FLUX 可以用 20 步完成采样（蒸馏后仅需 1-4 步），而不是 1000 步。'));
  }

  // ── cv3-open-vocab (24)：文本 Prompt 点亮场景中匹配的物体 ─
  function openVocab(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    // Prompt 胶囊
    svg.appendChild(svgEl('rect', { x: 14, y: 18, width: 150, height: 26, rx: '13', fill: BLUE, opacity: '0.16', stroke: BLUE }));
    svg.appendChild(svgEl('text', { x: 26, y: 36, fill: BLUE, 'font-size': '13', 'font-family': 'monospace' }, [document.createTextNode('Prompt: "橙子"')]));
    // 场景
    svg.appendChild(svgEl('rect', { x: 14, y: 56, width: 360, height: 160, fill: 'var(--bg-surface,#eee)', stroke: SOFT }));
    // 物体：三个橙子（匹配项）和两个干扰项（苹果、盒子）
    var objs = [
      [70, 110, 'orange', true], [150, 160, 'orange', true], [250, 100, 'orange', true],
      [320, 170, 'apple', false], [110, 190, 'box', false]
    ];
    objs.forEach(function (o, i) {
      var match = o[3];
      if (o[2] === 'box') {
        svg.appendChild(svgEl('rect', { x: o[0] - 16, y: o[1] - 16, width: 32, height: 32, fill: INK, opacity: '0.35' }));
      } else {
        svg.appendChild(svgEl('circle', { cx: o[0], cy: o[1], r: '18', fill: match ? WARN : MUTE, opacity: '0.4' }));
      }
      // 仅在匹配项上显示的 mask 轮廓，并附带 instance id
      if (match) {
        var ring = svgEl('circle', { cx: o[0], cy: o[1], r: '22', fill: 'none', stroke: WARN, 'stroke-width': '2.4', 'stroke-dasharray': '138', 'stroke-dashoffset': '138' });
        ring.appendChild(anim('stroke-dashoffset', '138;138;0;0', '5s', { begin: (i * 0.25) + 's', keyTimes: '0;0.3;0.6;1' }));
        svg.appendChild(ring);
        var id = svgEl('text', { x: o[0], y: o[1] - 28, fill: WARN, 'font-size': '10', 'font-family': 'monospace', 'text-anchor': 'middle', opacity: '0' }, [document.createTextNode('#' + (i + 1))]);
        id.appendChild(anim('opacity', '0;0;1;1', '5s', { begin: (i * 0.25) + 's', keyTimes: '0;0.55;0.7;1' }));
        svg.appendChild(id);
      }
    });
    // 单次 forward pass 箭头
    svg.appendChild(txt(390, 80, '一次 forward', 10));
    svg.appendChild(txt(390, 95, 'pass：', 10));
    svg.appendChild(txt(390, 120, '所有匹配的', 10));
    svg.appendChild(txt(390, 135, 'mask +', 10));
    svg.appendChild(txt(390, 150, 'instance id', 10));
    svg.appendChild(txt(14, 227, '无需 detector cascade — 输入文本，输出所有匹配的 mask', 9));
    host.appendChild(shell('SAM 3 · OPEN-VOCAB SEGMENTATION', '一个名词短语选中所有匹配项', svg,
      'Promptable Concept Segmentation 接收一个简短名词短语，并在单次处理中返回每个匹配物体的 mask 和 instance ID。灰色苹果与盒子保持未选中状态；三个橙子则会显示轮廓和编号。早期系统会将 text-grounded detector 串联到独立的 segmenter，并在衔接处累积误差。SAM 3 将这一 cascade 合并到单个 Model 中。'));
  }

  // ── cv3-track-assoc (27)：t 帧中的 detection 通过 IoU 与 t-1 帧的 track 匹配 ─
  function trackAssoc(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    svg.appendChild(txt(14, 16, 't-1 时的 track（实线）+ t 时的 detection（虚线），通过 IoU 匹配'));
    // 三个预测 track box（实线，带 ID），以及附近的三个 detection（虚线）
    var tracks = [[60, 60, 70, 60, '#1', BLUE], [220, 90, 64, 64, '#2', BLUE], [360, 70, 72, 58, '#3', BLUE]];
    var dets = [[70, 68, 70, 60], [230, 100, 64, 64], [372, 80, 72, 58]];
    tracks.forEach(function (t, i) {
      svg.appendChild(svgEl('rect', { x: t[0], y: t[1], width: t[2], height: t[3], fill: 'none', stroke: t[5], 'stroke-width': '2' }));
      svg.appendChild(svgEl('text', { x: t[0] + 4, y: t[1] - 4, fill: t[5], 'font-size': '11', 'font-family': 'monospace' }, [document.createTextNode(t[4])]));
      // detection 从偏移位置滑入并与对应 track 重叠（即完成匹配）
      var d = dets[i];
      var box = svgEl('rect', { x: d[0] + 26, y: d[1] + 22, width: d[2], height: d[3], fill: 'none', stroke: WARN, 'stroke-width': '1.6', 'stroke-dasharray': '5 3' });
      box.appendChild(anim('x', (d[0] + 26) + ';' + d[0] + ';' + d[0], '5s', { begin: (i * 0.15) + 's', keyTimes: '0;0.55;1' }));
      box.appendChild(anim('y', (d[1] + 22) + ';' + d[1] + ';' + d[1], '5s', { begin: (i * 0.15) + 's', keyTimes: '0;0.55;1' }));
      svg.appendChild(box);
      // 对齐后显示“已匹配”标记，并沿用 ID
      var id = svgEl('text', { x: d[0] + d[2] / 2, y: d[1] + d[3] + 18, fill: WARN, 'font-size': '10', 'font-family': 'monospace', 'text-anchor': 'middle', opacity: '0' }, [document.createTextNode('保留 ' + t[4])]);
      id.appendChild(anim('opacity', '0;0;1;1', '5s', { begin: (i * 0.15) + 's', keyTimes: '0;0.6;0.75;1' }));
      svg.appendChild(id);
    });
    // 底部的 cost matrix / Hungarian 提示
    svg.appendChild(txt(14, 196, 'IoU cost matrix -> Hungarian assignment -> 跨帧保持 ID', 10));
    var bx = 14, by = 206;
    var rr, cc;
    for (rr = 0; rr < 3; rr++) for (cc = 0; cc < 3; cc++) {
      var on = rr === cc;
      var cellr = svgEl('rect', { x: bx + cc * 18, y: by + rr * 9, width: 16, height: 7, fill: on ? BLUE : MUTE, opacity: '0' });
      cellr.appendChild(anim('opacity', '0;0;' + (on ? '0.9' : '0.2') + ';' + (on ? '0.9' : '0.2'), '5s', { keyTimes: '0;0.6;0.75;1' }));
      svg.appendChild(cellr);
    }
    host.appendChild(shell('MULTI-OBJECT TRACKING · ASSOCIATION', 'detection 吸附到 track，ID 得以延续', svg,
      'Tracking-by-detection 会在每一帧运行 detector，然后判断哪个新 box 对应哪个旧 track。它通过 IoU（通常还会结合运动与外观）为每个 (track, detection) 组合评分，使用 Hungarian algorithm 求解 assignment，并将匹配成功的 ID 传递到下一帧。未匹配的 detection 会启动新 track；未匹配的 track 会逐渐失效。真正的产物是身份，而不是 box。'));
  }

  LF.register({
    'cv3-roialign-sampling': roialignSampling,
    'cv3-latent-compression': latentCompression,
    'cv3-ctc-collapse': ctcCollapse,
    'cv3-pose-heatmap': poseHeatmap,
    'cv3-gaussian-splat': gaussianSplat,
    'cv3-rectified-flow': rectifiedFlow,
    'cv3-open-vocab': openVocab,
    'cv3-track-assoc': trackAssoc
  });
})();
