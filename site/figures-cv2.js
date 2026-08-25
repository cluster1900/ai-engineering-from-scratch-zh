/* figures-cv2.js — 用于 Phase 4（computer vision）的动画 SVG 课程图示。
   在 lesson-figures.js 之后加载，并通过 window.LF 注册组件。
   每个图示都是一个自动运行的 SMIL 动画，用于演示一个 CV 概念：不使用 JS
   timer，也不使用计算循环。原生 ES5，无依赖，通过 CSS 变量适配主题。
   编写方式与 docs/en.md 中的 fenced block 相同：
       ```figure
       object-detection-nms
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
  function animT(type, vals, dur, extra) {
    var a = { attributeName: 'transform', type: type, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animateTransform', a);
  }
  function txt(x, y, s, size, anchor) {
    return svgEl('text', { x: x, y: y, fill: 'var(--ink-mute,#777)', 'font-size': size || 10, 'font-family': 'monospace', 'text-anchor': anchor || 'start' }, [document.createTextNode(s)]);
  }
  var BLUE = 'var(--blueprint,#3553ff)', INK = 'var(--ink,#1a1a1a)', SOFT = 'var(--rule-soft,#ddd)', WARN = 'var(--warn,#b8870f)', MUTE = 'var(--ink-mute,#777)';

  // ── object-detection-nms (06)：候选框依次出现，NMS 剔除重叠框 ──
  function objectDetectionNms(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    svg.appendChild(svgEl('rect', { x: 14, y: 24, width: 240, height: 200, fill: 'var(--bg-surface,#eee)', stroke: SOFT }));
    svg.appendChild(txt(14, 18, '场景 · 所有候选框'));
    // “object”的轮廓
    svg.appendChild(svgEl('ellipse', { cx: 130, cy: 130, rx: 58, ry: 70, fill: BLUE, opacity: '0.16' }));
    // 相互重叠的原始候选框（使用虚线绘制，呈现提议框的效果）
    var raw = [[80, 70, 100, 120], [92, 80, 96, 116], [70, 64, 118, 132], [104, 92, 88, 104]];
    raw.forEach(function (b, i) {
      var r = svgEl('rect', { x: b[0], y: b[1], width: b[2], height: b[3], fill: 'none', stroke: WARN, 'stroke-width': '1.4', 'stroke-dasharray': '4 3', opacity: '0' });
      r.appendChild(anim('opacity', '0;0.9;0.9;0.15;0.15', '5s', { begin: (i * 0.12) + 's', keyTimes: '0;0.18;0.5;0.62;1' }));
      svg.appendChild(r);
    });
    // 最终保留的框，最后绘制，使用实线
    var win = svgEl('rect', { x: 78, y: 66, width: 104, height: 126, fill: 'none', stroke: BLUE, 'stroke-width': '2.6', opacity: '0' });
    win.appendChild(anim('opacity', '0;0;1;1', '5s', { keyTimes: '0;0.55;0.72;1' }));
    svg.appendChild(win);
    var lab = svgEl('rect', { x: 78, y: 52, width: 56, height: 13, fill: BLUE, opacity: '0' });
    lab.appendChild(anim('opacity', '0;0;1;1', '5s', { keyTimes: '0;0.6;0.78;1' }));
    svg.appendChild(lab);
    var lt = svgEl('text', { x: 82, y: 62, fill: 'var(--bg,#fafaf5)', 'font-size': '9', 'font-family': 'monospace', opacity: '0' }, [document.createTextNode('狗 0.94')]);
    lt.appendChild(anim('opacity', '0;0;1;1', '5s', { keyTimes: '0;0.6;0.78;1' }));
    svg.appendChild(lt);
    // 右侧列：依次亮起的 NMS 步骤标签
    var steps = ['1 · 密集的候选框网格', '2 · 为每个框评分', '3 · 按 objectness 排序', '4 · 移除高 IoU 重叠框', '5 · 每个 object 保留一个框'];
    steps.forEach(function (s, i) {
      var y = 56 + i * 34;
      var dot = svgEl('circle', { cx: 296, cy: y - 4, r: '5', fill: SOFT });
      dot.appendChild(anim('fill', SOFT + ';' + SOFT + ';' + BLUE + ';' + BLUE, '5s', { keyTimes: '0;' + (0.12 + i * 0.16).toFixed(2) + ';' + (0.2 + i * 0.16).toFixed(2) + ';1' }));
      svg.appendChild(dot);
      svg.appendChild(txt(310, y, s, 11));
    });
    host.appendChild(shell('OBJECT DETECTION · NMS', '候选框依次出现，重叠框被剔除', svg,
      'YOLO head 会在每个 grid cell 预测一个框，因此一个 object 会产生许多相互重叠的候选框（虚线）。Non-maximum suppression 按 confidence 对它们排序，保留最强的框，并删除与其重叠程度过高的所有框。最终，每个 object 只会留下一个紧密贴合的框。'));
  }

  // ── segmentation-flood (07)：Encoder→bottleneck→Decoder，区域以 flood-fill 方式展开 ──
  function segmentationFlood(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    svg.appendChild(txt(14, 16, '输入图像'));
    svg.appendChild(txt(330, 16, '逐像素 mask'));
    // 一个 6x6 区域图：为每个单元分配一个 class id，并以波浪形式进行 flood-fill
    var N = 6, cell = 26, gx = 14, gy = 26, gx2 = 330;
    var classOf = [
      [0, 0, 0, 1, 1, 1], [0, 0, 1, 1, 1, 1], [0, 2, 2, 1, 1, 1],
      [2, 2, 2, 2, 1, 1], [2, 2, 2, 2, 2, 1], [2, 2, 2, 2, 2, 2]
    ];
    var classFill = [BLUE, WARN, INK];
    var r, c;
    for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
      // 左侧：灰度输入
      svg.appendChild(svgEl('rect', { x: gx + c * cell, y: gy + r * cell, width: cell - 1.5, height: cell - 1.5, fill: BLUE, opacity: (0.1 + 0.5 * ((r * 3 + c * 2) % 5) / 5).toFixed(3) }));
      // 右侧：class mask 根据与左上角的距离逐步展开
      var dist = (r + c) / 10;
      var cl = classOf[r][c];
      var m = svgEl('rect', { x: gx2 + c * cell, y: gy + r * cell, width: cell - 1.5, height: cell - 1.5, fill: classFill[cl], opacity: '0' });
      var dcl = Math.min(0.85, dist);
      m.appendChild(anim('opacity', '0;0;0.8;0.8', '4s', { keyTimes: '0;' + dcl.toFixed(2) + ';' + (dcl + 0.12).toFixed(2) + ';1' }));
      svg.appendChild(m);
    }
    // 连接 Encoder 侧与 Decoder 侧的 skip connection 弧线
    var arc = svgEl('path', { d: 'M 175 70 C 240 30, 300 30, 330 70', fill: 'none', stroke: BLUE, 'stroke-width': '1.8', 'stroke-dasharray': '6 4', opacity: '0.7' });
    var arcLen = '170';
    arc.setAttribute('stroke-dasharray', arcLen);
    arc.setAttribute('stroke-dashoffset', arcLen);
    arc.appendChild(anim('stroke-dashoffset', arcLen + ';0;0;' + arcLen, '4s'));
    svg.appendChild(arc);
    svg.appendChild(txt(210, 28, 'skip connection', 9));
    // 一个沿 skip connection 弧线移动的像素
    var dot = svgEl('circle', { r: '4', fill: WARN });
    var mp = svgEl('animateMotion', { dur: '4s', repeatCount: 'indefinite', path: 'M 175 70 C 240 30, 300 30, 330 70', keyPoints: '0;1;1', keyTimes: '0;0.5;1' });
    dot.appendChild(mp);
    svg.appendChild(dot);
    host.appendChild(shell('SEMANTIC SEGMENTATION', '为每个像素标注 class，区域逐步展开', svg,
      'Segmentation 是对每个像素进行 Classification。Encoder 压缩图像以获取 Context，Decoder 将其上采样回完整分辨率，而 skip connection 则跨层传递精细的空间细节，使边界保持清晰。观察 mask 向外展开时，每个像素如何确定自己的 class。'));
  }

  // ── gan-minimax (09)：G 将噪声转换为图像，D 的判定来回摆动 ───
  function ganMinimax(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    svg.appendChild(txt(14, 16, '噪声 z'));
    svg.appendChild(txt(150, 16, 'Generator G'));
    svg.appendChild(txt(300, 16, '生成图像'));
    svg.appendChild(txt(430, 16, 'Critic D'));
    // 左侧闪烁的噪声点
    var i;
    for (i = 0; i < 9; i++) {
      var nx = 18 + (i % 3) * 18, ny = 40 + Math.floor(i / 3) * 18;
      var n = svgEl('circle', { cx: nx, cy: ny, r: '4', fill: MUTE });
      n.appendChild(anim('opacity', '0.3;1;0.3', '0.9s', { begin: (i * 0.1) + 's' }));
      svg.appendChild(n);
    }
    // 指向 G 的箭头
    svg.appendChild(svgEl('path', { d: 'M 86 70 L 138 70', stroke: SOFT, 'stroke-width': '2', 'marker-end': '' }));
    // G 模块
    svg.appendChild(svgEl('rect', { x: 138, y: 40, width: 70, height: 60, fill: BLUE, opacity: '0.16', stroke: BLUE }));
    // 生成图像：一个 4x4 网格，在循环过程中从噪声逐渐清晰为连贯的图案
    var gx = 290, gy = 40, cs = 18, r, c;
    for (r = 0; r < 4; r++) for (c = 0; c < 4; c++) {
      var target = ((r < 2) === (c < 2)) ? 0.85 : 0.18; // 一个 2x2 的“人脸”块状图案
      var rect = svgEl('rect', { x: gx + c * cs, y: gy + r * cs, width: cs - 1.5, height: cs - 1.5, fill: BLUE });
      var noisy = (0.2 + 0.6 * ((r * 7 + c * 5) % 4) / 4).toFixed(2);
      rect.appendChild(anim('opacity', noisy + ';' + target + ';' + target, '4.5s', { keyTimes: '0;0.7;1' }));
      svg.appendChild(rect);
    }
    // 指向 D 的箭头
    svg.appendChild(svgEl('path', { d: 'M 364 70 L 414 70', stroke: SOFT, 'stroke-width': '2' }));
    // D 的 P(real) 仪表条
    svg.appendChild(svgEl('rect', { x: 430, y: 50, width: 70, height: 12, fill: 'var(--bg-surface,#eee)' }));
    var gauge = svgEl('rect', { x: 430, y: 50, width: 18, height: 12, fill: WARN });
    gauge.appendChild(anim('width', '12;30;20;46;38', '4.5s', { calcMode: 'spline', keySplines: '.4 0 .6 1;.4 0 .6 1;.4 0 .6 1;.4 0 .6 1', keyTimes: '0;0.3;0.55;0.8;1' }));
    gauge.appendChild(anim('fill', WARN + ';' + WARN + ';' + BLUE, '4.5s', { keyTimes: '0;0.6;1' }));
    svg.appendChild(gauge);
    svg.appendChild(txt(430, 80, 'P(real) →', 9));
    // 底部相互拉扯的 Loss 条
    svg.appendChild(txt(14, 150, 'minimax — G 将分数推高，D 将分数压低', 11));
    var seesaw = svgEl('line', { x1: 60, y1: 190, x2: 460, y2: 190, stroke: INK, 'stroke-width': '2.5' });
    seesaw.appendChild(animT('rotate', '-7 260 190;7 260 190;-7 260 190', '4.5s'));
    svg.appendChild(seesaw);
    svg.appendChild(svgEl('circle', { cx: 260, cy: 196, r: '4', fill: BLUE }));
    var gL = svgEl('text', { x: 70, y: 178, fill: BLUE, 'font-size': '10', 'font-family': 'monospace' }, [document.createTextNode('G')]);
    var dL = svgEl('text', { x: 446, y: 178, fill: WARN, 'font-size': '10', 'font-family': 'monospace' }, [document.createTextNode('D')]);
    svg.appendChild(gL); svg.appendChild(dL);
    host.appendChild(shell('GAN · MINIMAX 博弈', '一方生成，一方评判', svg,
      'Generator 将噪声 Vector 转换为图像；Critic 对图像看起来有多真实进行评分。二者相互对抗训练：Generator 将 Critic 的 P(real) 推高，Critic 则将其压低。随着跷跷板逐渐趋于平衡，生成图像会从噪声逐渐变得清晰并形成结构。'));
  }

  // ── diffusion-denoise (10)：带噪网格逐步还原为清晰图像 ────────
  function diffusionDenoise(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 220' });
    svg.appendChild(txt(14, 16, 'x_T  纯噪声'));
    svg.appendChild(txt(360, 16, 'x_0  样本'));
    // 一个 6x6 网格：每个单元从随机噪声 opacity 逐渐变为目标图像
    var N = 6, cell = 28, gx = 150, gy = 30;
    var target = [
      [0.1, 0.1, 0.7, 0.7, 0.1, 0.1], [0.1, 0.7, 0.9, 0.9, 0.7, 0.1],
      [0.7, 0.9, 0.3, 0.3, 0.9, 0.7], [0.7, 0.9, 0.3, 0.3, 0.9, 0.7],
      [0.1, 0.7, 0.9, 0.9, 0.7, 0.1], [0.1, 0.1, 0.7, 0.7, 0.1, 0.1]
    ];
    var r, c;
    for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
      var rect = svgEl('rect', { x: gx + c * cell, y: gy + r * cell, width: cell - 2, height: cell - 2, fill: BLUE });
      // 五个 denoise 步骤：噪声 opacity 先游移，再收敛到目标值
      var v = ((r * 11 + c * 7) % 5) / 5;
      var v2 = ((r * 5 + c * 13) % 5) / 5;
      var t = target[r][c];
      rect.appendChild(anim('opacity', v.toFixed(2) + ';' + v2.toFixed(2) + ';' + ((v2 + t) / 2).toFixed(2) + ';' + t.toFixed(2) + ';' + t.toFixed(2), '5s', { keyTimes: '0;0.3;0.6;0.85;1' }));
      svg.appendChild(rect);
    }
    // 从 T 递减到 0 的步骤计数器
    var counter = svgEl('text', { x: 260, y: 212, fill: BLUE, 'font-size': '13', 'font-family': 'monospace', 'text-anchor': 'middle' }, [document.createTextNode('t = 1000')]);
    var ct = svgEl('animate', { attributeName: 'opacity', values: '1;1', dur: '5s', repeatCount: 'indefinite' });
    counter.appendChild(ct);
    // 使用类似 <set> 的链式值模拟倒计时很困难；改用扫过的箭头
    svg.appendChild(counter);
    // 向右扫过的 denoise 箭头，带有移动标记
    svg.appendChild(svgEl('line', { x1: 150, y1: 200, x2: 318, y2: 200, stroke: SOFT, 'stroke-width': '2' }));
    var head = svgEl('polygon', { points: '0,-4 8,0 0,4', fill: WARN });
    var mp = svgEl('animateMotion', { dur: '5s', repeatCount: 'indefinite', path: 'M 150 200 L 318 200' });
    head.appendChild(mp);
    svg.appendChild(head);
    svg.appendChild(txt(150, 196, '反向过程：逐步预测并减去噪声', 9));
    host.appendChild(shell('DIFFUSION · DENOISING', '从纯噪声生成样本', svg,
      'Diffusion Model 学习每次移除少量噪声。采样从纯 Gaussian noise 网格开始并反向推进：每一步都会预测噪声并将其减去，使结构逐渐显现。将这个微小的 denoise 步骤重复足够多次，一幅连贯的图像便会从静态噪声中凝聚出来。'));
  }

  // ── nerf-rays (13)：camera 向 volume 投射射线，样本逐步累积 ─
  function nerfRays(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    svg.appendChild(txt(14, 16, 'camera'));
    svg.appendChild(txt(300, 16, 'volume（density · colour field）'));
    // camera 原点
    var ox = 40, oy = 120;
    svg.appendChild(svgEl('circle', { cx: ox, cy: oy, r: '6', fill: INK }));
    svg.appendChild(svgEl('rect', { x: ox - 4, y: oy - 12, width: 8, height: 24, fill: 'none', stroke: INK, 'stroke-width': '1.5' }));
    // 隐式 object：volume 中的柔和团块
    svg.appendChild(svgEl('ellipse', { cx: 380, cy: 120, rx: 64, ry: 78, fill: BLUE, opacity: '0.14' }));
    svg.appendChild(svgEl('ellipse', { cx: 380, cy: 120, rx: 34, ry: 44, fill: BLUE, opacity: '0.2' }));
    // 三条呈扇形展开的射线，通过 dashoffset 逐步绘制
    var rays = [[ox, oy, 470, 60], [ox, oy, 480, 120], [ox, oy, 470, 180]];
    rays.forEach(function (rr, i) {
      var len = 460;
      var line = svgEl('line', { x1: rr[0], y1: rr[1], x2: rr[2], y2: rr[3], stroke: SOFT, 'stroke-width': '1.4', 'stroke-dasharray': len, 'stroke-dashoffset': len });
      line.appendChild(anim('stroke-dashoffset', len + ';0;0', '4s', { begin: (i * 0.25) + 's', keyTimes: '0;0.6;1' }));
      svg.appendChild(line);
      // 沿每条射线前进的采样点，在团块内部逐渐变亮
      var s;
      for (s = 0; s < 8; s++) {
        var t = s / 7;
        var sx = rr[0] + (rr[2] - rr[0]) * t;
        var sy = rr[1] + (rr[3] - rr[1]) * t;
        var inside = sx > 320 && sx < 444;
        var pt = svgEl('circle', { cx: sx, cy: sy, r: inside ? '3.2' : '2', fill: inside ? BLUE : MUTE, opacity: '0' });
        pt.appendChild(anim('opacity', '0;0;' + (inside ? '1' : '0.5') + ';' + (inside ? '1' : '0.5'), '4s', { begin: (i * 0.25 + s * 0.05) + 's', keyTimes: '0;' + (0.1 + t * 0.5).toFixed(2) + ';' + (0.2 + t * 0.5).toFixed(2) + ';1' }));
        svg.appendChild(pt);
      }
    });
    // 右侧边缘累积得到的像素色块
    var i2;
    for (i2 = 0; i2 < 3; i2++) {
      var px = svgEl('rect', { x: 488, y: 50 + i2 * 60, width: 18, height: 40, fill: BLUE, opacity: '0' });
      px.appendChild(anim('opacity', '0;0;0.85;0.85', '4s', { begin: (i2 * 0.25) + 's', keyTimes: '0;0.7;0.9;1' }));
      svg.appendChild(px);
    }
    svg.appendChild(txt(150, 215, '沿每条射线前进，向 MLP 查询 density + colour，积分 → 一个像素', 9));
    host.appendChild(shell('NeRF · VOLUME RENDERING', '射线对 field 采样，colour 通过积分累积', svg,
      'NeRF 将场景存储为一个函数：向它提供 3D point 和 view direction，它会返回 density 和 colour。渲染一个像素时，从 camera 投射一条射线，沿射线对各点采样，在每个点查询 MLP，并从前向后对 density-weighted colour 进行积分。每条射线都会将穿过空间的一条线压缩为一个像素。'));
  }

  // ── clip-contrastive (18)：NxN similarity Matrix，对角线逐渐亮起 ────────
  function clipContrastive(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    svg.appendChild(txt(86, 18, '文本 Embedding →'));
    var N = 5, cell = 30, gx = 86, gy = 30;
    // 行 = 图像，列 = caption；构建 Matrix
    var r, c;
    for (r = 0; r < N; r++) {
      svg.appendChild(txt(gx - 8, gy + r * cell + 20, '图像', 9, 'end'));
      for (c = 0; c < N; c++) {
        var diag = r === c;
        var rect = svgEl('rect', { x: gx + c * cell, y: gy + r * cell, width: cell - 2, height: cell - 2, fill: diag ? BLUE : MUTE, 'stroke': SOFT, 'stroke-width': '0.5' });
        if (diag) {
          rect.appendChild(anim('opacity', '0.2;0.2;1;1', '4s', { keyTimes: '0;0.3;0.6;1' }));
        } else {
          rect.appendChild(anim('opacity', '0.5;0.5;0.12;0.12', '4s', { keyTimes: '0;0.3;0.6;1' }));
        }
        svg.appendChild(rect);
      }
    }
    // 沿对角线移动的扫光高亮
    var hl = svgEl('rect', { x: gx, y: gy, width: cell - 2, height: cell - 2, fill: 'none', stroke: WARN, 'stroke-width': '2.5' });
    var pts = [];
    for (r = 0; r < N; r++) pts.push((gx + r * cell) + ',' + (gy + r * cell));
    var mp = svgEl('animateMotion', { dur: '4s', repeatCount: 'indefinite', path: 'M 0 0' });
    // 构建一条沿对角线单元移动的路径
    var pd = 'M 0 0';
    for (r = 1; r < N; r++) pd += ' L ' + (r * cell) + ' ' + (r * cell);
    mp.setAttribute('path', pd);
    mp.setAttribute('begin', '0.4s');
    hl.appendChild(mp);
    svg.appendChild(hl);
    // 图例
    svg.appendChild(svgEl('rect', { x: 300, y: 70, width: 14, height: 14, fill: BLUE }));
    svg.appendChild(txt(320, 81, '匹配的（图像，caption）— 拉近', 11));
    svg.appendChild(svgEl('rect', { x: 300, y: 96, width: 14, height: 14, fill: MUTE, opacity: '0.5' }));
    svg.appendChild(txt(320, 107, '不匹配的配对 — 推远', 11));
    svg.appendChild(txt(300, 150, '对每一行和每一列应用 softmax', 10));
    svg.appendChild(txt(300, 166, '推动对角线分数升高', 10));
    host.appendChild(shell('CLIP · CONTRASTIVE MATRIX', '匹配的配对落在对角线上', svg,
      'CLIP 将图像和 caption 映射为同一共享空间中的 Embedding。对于一批 N 个配对，它会构建一个 NxN similarity Matrix，并通过 Training 让对角线上的真实配对获得高分，同时让所有非对角线配对获得低分。观察匹配配对被拉近、不匹配配对被推远时，对角线如何逐渐变亮。'));
  }

  // ── metric-embedding (20)：点按 class 聚集，query 寻找邻居 ─
  function metricEmbedding(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    svg.appendChild(txt(14, 16, 'Embedding 空间 — metric learning 将相同 class 拉近'));
    // 三个 cluster：分散的起始位置和紧密的结束位置
    var clusters = [
      { cx: 130, cy: 150, fill: BLUE, start: [[60, 60], [200, 90], [90, 200], [180, 190], [50, 130]] },
      { cx: 300, cy: 90, fill: WARN, start: [[360, 180], [240, 200], [330, 200], [380, 60], [260, 50]] },
      { cx: 400, cy: 170, fill: INK, start: [[330, 70], [460, 70], [450, 200], [340, 210], [410, 60]] }
    ];
    clusters.forEach(function (cl) {
      cl.start.forEach(function (s, i) {
        var ang = i / cl.start.length * 6.28;
        var ex = cl.cx + Math.cos(ang) * 22;
        var ey = cl.cy + Math.sin(ang) * 22;
        var dot = svgEl('circle', { cx: s[0], cy: s[1], r: '5', fill: cl.fill, opacity: '0.85' });
        dot.appendChild(anim('cx', s[0] + ';' + ex.toFixed(0) + ';' + ex.toFixed(0) + ';' + s[0], '6s', { calcMode: 'spline', keySplines: '.4 0 .2 1;0 0 1 1;.4 0 .2 1', keyTimes: '0;0.4;0.7;1' }));
        dot.appendChild(anim('cy', s[1] + ';' + ey.toFixed(0) + ';' + ey.toFixed(0) + ';' + s[1], '6s', { calcMode: 'spline', keySplines: '.4 0 .2 1;0 0 1 1;.4 0 .2 1', keyTimes: '0;0.4;0.7;1' }));
        svg.appendChild(dot);
      });
    });
    // query 点，以及在 cluster 变得紧密后扩张的 top-k 圆环
    var q = svgEl('circle', { cx: 130, cy: 150, r: '6', fill: 'none', stroke: WARN, 'stroke-width': '2.5' });
    svg.appendChild(q);
    var ring = svgEl('circle', { cx: 130, cy: 150, r: '5', fill: 'none', stroke: WARN, 'stroke-width': '1.5', opacity: '0' });
    ring.appendChild(anim('r', '5;5;48;48', '6s', { keyTimes: '0;0.45;0.65;1' }));
    ring.appendChild(anim('opacity', '0;0;0.9;0', '6s', { keyTimes: '0;0.45;0.65;1' }));
    svg.appendChild(ring);
    svg.appendChild(txt(220, 230, 'query → 按 cosine distance 找到的最近邻 = 相同 class', 10));
    host.appendChild(shell('METRIC LEARNING · RETRIEVAL', '相同 class 的点聚集，query 圈出其邻居', svg,
      'Retrieval 按照 Embedding 空间中的距离对候选项排序。Metric learning 会塑造这个空间：triplet loss 或 contrastive loss 将相同 class 的点拉近，并将其他 class 推远。当 cluster 足够紧密后，按 cosine distance 找到的 query 最近邻便能可靠地给出正确答案。'));
  }

  // ── depth-rays (26)：RGB 网格 → depth Gradient，扫描线按距离着色 ─
  function depthSweep(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    svg.appendChild(txt(14, 16, 'RGB frame'));
    svg.appendChild(txt(300, 16, '预测 depth（近 → 远）'));
    var N = 6, cell = 28, gx = 14, gy = 28, gx2 = 300;
    // 每个单元的 depth 值：向右上方逐渐远离的场景（天空较远，地面较近）
    var depthOf = function (r, c) { return (c * 0.6 + (5 - r) * 0.7) / 6.6; };
    var r, c;
    for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
      // 左侧：相对平坦的 RGB 纹理
      svg.appendChild(svgEl('rect', { x: gx + c * cell, y: gy + r * cell, width: cell - 1.5, height: cell - 1.5, fill: BLUE, opacity: (0.2 + 0.35 * ((r * 3 + c) % 4) / 4).toFixed(3) }));
      // 右侧：depth 单元，随着垂直扫描线横向扫过而显示
      var d = depthOf(r, c);
      var col = d < 0.4 ? WARN : (d < 0.7 ? BLUE : INK);
      var op = (0.25 + 0.6 * (1 - d)).toFixed(3); // 越近越亮
      var dep = svgEl('rect', { x: gx2 + c * cell, y: gy + r * cell, width: cell - 1.5, height: cell - 1.5, fill: col, opacity: '0' });
      var reveal = Math.min(0.85, c / N);
      dep.appendChild(anim('opacity', '0;0;' + op + ';' + op, '4s', { keyTimes: '0;' + reveal.toFixed(2) + ';' + (reveal + 0.12).toFixed(2) + ';1' }));
      svg.appendChild(dep);
    }
    // 从左向右扫过 depth map 的扫描线
    var scan = svgEl('line', { x1: gx2, y1: gy, x2: gx2, y2: gy + N * cell, stroke: WARN, 'stroke-width': '2.5' });
    scan.appendChild(anim('x1', gx2 + ';' + (gx2 + N * cell), '4s'));
    scan.appendChild(anim('x2', gx2 + ';' + (gx2 + N * cell), '4s'));
    svg.appendChild(scan);
    // depth 图例条
    svg.appendChild(svgEl('rect', { x: 14, y: 206, width: 20, height: 10, fill: WARN }));
    svg.appendChild(txt(38, 215, '近', 9));
    svg.appendChild(svgEl('rect', { x: 78, y: 206, width: 20, height: 10, fill: BLUE }));
    svg.appendChild(txt(102, 215, '中', 9));
    svg.appendChild(svgEl('rect', { x: 138, y: 206, width: 20, height: 10, fill: INK }));
    svg.appendChild(txt(162, 215, '远', 9));
    svg.appendChild(txt(230, 215, '一个 RGB frame → 每个像素一个距离，无需 stereo 或 LiDAR', 9));
    host.appendChild(shell('MONOCULAR DEPTH', '输入一个 frame，输出每个像素的距离', svg,
      'Monocular depth Model 将单个 RGB frame 映射为每个像素的距离。冻结的 ViT Encoder 读取透视、纹理和学到的场景 Prior；轻量 Decoder 将其上采样为密集的 depth map。近处表面明亮发光，远处表面逐渐隐退，这一切都来自单张图像，无需 stereo rig 或 depth sensor。'));
  }

  LF.register({
    'object-detection-nms': objectDetectionNms,
    'segmentation-flood': segmentationFlood,
    'cv-gan-image': ganMinimax,
    'cv-diffusion-image': diffusionDenoise,
    'nerf-rays': nerfRays,
    'clip-contrastive': clipContrastive,
    'metric-embedding': metricEmbedding,
    'depth-sweep': depthSweep
  });
})();
