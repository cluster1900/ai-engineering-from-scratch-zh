/* figures-ml.js — 面向 Phase 2（classical ML）的交互式、主题感知课程图示。
   在 lesson-figures.js 之后加载，并通过 LF.register({...}) 注册 widgets。
   Vanilla ES5，无 deps，通过 CSS vars 适配主题。沿用相同的 fenced-block 编写方式：
       ```figure
       linear-regression-fit
       ```  */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl, slider = LF.slider, select = LF.select;

  // ── linear-regression-fit：拖动 slope + intercept，观察 MSE ───────────
  function linearRegressionFit(host) {
    // 固定的 12 个散点，沿 y ≈ 0.7x + 1.4 分布，并带有确定性 jitter
    var X = [0.4, 1.1, 1.8, 2.3, 3.0, 3.6, 4.2, 5.0, 5.7, 6.4, 7.1, 7.8];
    var Y = [2.0, 1.9, 2.9, 2.7, 3.8, 3.5, 4.6, 4.4, 5.7, 5.3, 6.5, 6.2];
    var state = { m: 0.7, b: 1.4 };
    var W = 520, H = 230, PAD = 32, XMAX = 8.4, YMAX = 7.5;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function px(x) { return PAD + x / XMAX * (W - 2 * PAD); }
    function py(y) { return H - PAD - y / YMAX * (H - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: H - PAD, x2: W - PAD, y2: H - PAD, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      var se = 0, i;
      for (i = 0; i < X.length; i++) {
        var pred = state.m * X[i] + state.b;
        se += (Y[i] - pred) * (Y[i] - pred);
        svg.appendChild(svgEl('line', { x1: px(X[i]), y1: py(Y[i]), x2: px(X[i]), y2: py(pred), stroke: 'var(--warn,#b8870f)', 'stroke-width': '1', opacity: '0.7' }));
      }
      var x1 = 0, x2 = XMAX;
      svg.appendChild(svgEl('line', { x1: px(x1), y1: py(state.m * x1 + state.b), x2: px(x2), y2: py(state.m * x2 + state.b), stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      for (i = 0; i < X.length; i++) { svg.appendChild(svgEl('circle', { cx: px(X[i]), cy: py(Y[i]), r: '4', fill: 'var(--ink,#1a1a1a)' })); }
      var mse = se / X.length;
      status.innerHTML = 'MSE = ' + mse.toFixed(3);
      meta.textContent = 'line y = ' + state.m.toFixed(2) + 'x + ' + state.b.toFixed(2) + '  ·  ' + X.length + ' 个点  ·  橙色条表示 residual';
      formula.textContent = 'MSE = (1/n) Σ (yᵢ − (m·xᵢ + b))²   ·   least squares 会找到使它最小的 m, b';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'm', 'slope m', -0.5, 2.0, 0.01),
      slider(state, 'b', 'intercept b', -2.0, 5.0, 0.05)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['LINEAR REGRESSION 拟合']), el('span', {}, ['拖动 slope 和 intercept'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['每条橙色条都是一个 residual，也就是点与直线之间的距离。对它们平方并取平均，就得到 mean squared error。least squares 只是选择一组 slope 和 intercept，让这个平均值尽可能小。'])
    ]));
    state._render();
  }

  // ── logistic-sigmoid：拖动 w 和 b，找到 decision boundary ─────────────
  function logisticSigmoid(host) {
    var state = { w: 1.5, b: 0.0 };
    var W = 520, H = 220, PAD = 32, XR = 6;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function sig(x) { return 1 / (1 + Math.exp(-(state.w * x + state.b))); }
    function px(x) { return PAD + (x + XR) / (2 * XR) * (W - 2 * PAD); }
    function py(p) { return H - PAD - p * (H - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(0.5), x2: W - PAD, y2: py(0.5), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      var d = '', i; for (i = 0; i <= 160; i++) { var x = -XR + 2 * XR * i / 160; d += (i ? 'L' : 'M') + px(x).toFixed(1) + ' ' + py(sig(x)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      var xb = state.w === 0 ? null : -state.b / state.w;
      if (xb !== null && xb > -XR && xb < XR) {
        svg.appendChild(svgEl('line', { x1: px(xb), y1: PAD, x2: px(xb), y2: H - PAD, stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5' }));
        svg.appendChild(svgEl('circle', { cx: px(xb), cy: py(0.5), r: '4', fill: 'var(--warn,#b8870f)' }));
      }
      status.innerHTML = xb === null ? '没有 boundary' : 'x* = ' + xb.toFixed(2) + ' <small>在 p = 0.5 处</small>';
      meta.textContent = 'steepness 随 |w| 增大  ·  boundary 随 b 平移  ·  输出是 (0, 1) 内的 probability';
      formula.textContent = 's(x) = 1 / (1 + e^−(w·x + b))   ·   decision boundary 位于 w·x + b = 0  →  x* = −b/w';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'w', 'weight w', -4, 4, 0.05),
      slider(state, 'b', 'bias b', -5, 5, 0.05)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['LOGISTIC SIGMOID']), el('span', {}, ['拖动 w 和 b'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['Logistic Regression 会把一个 linear score 通过 sigmoid 压缩成 probability。weight 控制曲线转弯的陡峭程度；bias 让曲线向左或向右滑动。橙色线是 decision boundary，也就是 probability 穿过二分之一的位置。'])
    ]));
    state._render();
  }

  // ── svm-margin：旋转 boundary，拓宽街道，标记 support vectors ─
  function svmMargin(host) {
    // 两个 linearly separable 的 cluster（固定）。class +1 在右上，class -1 在左下
    var POS = [[6.0, 5.4], [6.8, 4.6], [5.4, 6.2], [7.2, 5.8], [6.4, 6.8], [7.8, 6.0]];
    var NEG = [[2.2, 3.0], [3.0, 2.2], [1.6, 2.4], [3.4, 3.2], [2.6, 1.6], [1.8, 3.6]];
    var state = { ang: 45, margin: 1.0 };
    var W = 520, H = 240, PAD = 30, AX = 9;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var CX = 4.6, CY = 4.0; // 直线经过这个中点
    function px(x) { return PAD + x / AX * (W - 2 * PAD); }
    function py(y) { return H - PAD - y / AX * (H - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var rad = state.ang * Math.PI / 180;
      // boundary 的 unit normal
      var nx = Math.cos(rad), ny = Math.sin(rad);
      // boundary direction（与 normal 垂直）
      var dx = -ny, dy = nx;
      function lineAt(off, stroke, dash) {
        var ox = CX + nx * off, oy = CY + ny * off;
        var L = 12;
        svg.appendChild(svgEl('line', {
          x1: px(ox - dx * L), y1: py(oy - dy * L), x2: px(ox + dx * L), y2: py(oy + dy * L),
          stroke: stroke, 'stroke-width': dash ? '1' : '2', 'stroke-dasharray': dash ? '4 3' : 'none'
        }));
      }
      lineAt(state.margin, 'var(--rule-soft,#bbb)', true);
      lineAt(-state.margin, 'var(--rule-soft,#bbb)', true);
      lineAt(0, 'var(--blueprint,#3553ff)', false);
      function dist(p) { return (p[0] - CX) * nx + (p[1] - CY) * ny; }
      var sv = 0, i, p, d;
      for (i = 0; i < POS.length; i++) {
        p = POS[i]; d = dist(p);
        var onP = Math.abs(d - state.margin) < 0.35;
        if (onP) sv++;
        svg.appendChild(svgEl('circle', { cx: px(p[0]), cy: py(p[1]), r: onP ? '6' : '4', fill: 'var(--blueprint,#3553ff)', stroke: onP ? 'var(--warn,#b8870f)' : 'none', 'stroke-width': '2' }));
      }
      for (i = 0; i < NEG.length; i++) {
        p = NEG[i]; d = dist(p);
        var onN = Math.abs(d + state.margin) < 0.35;
        if (onN) sv++;
        svg.appendChild(svgEl('circle', { cx: px(p[0]), cy: py(p[1]), r: onN ? '6' : '4', fill: 'var(--ink-mute,#999)', stroke: onN ? 'var(--warn,#b8870f)' : 'none', 'stroke-width': '2' }));
      }
      status.innerHTML = sv + ' <small>support vectors</small>';
      meta.textContent = 'margin width ' + (2 * state.margin).toFixed(2) + '  ·  金色圈出的点位于 margin 上  ·  街道越宽，generalization 越好';
      formula.textContent = '在满足 yᵢ(w·xᵢ + b) ≥ 1 的条件下最大化 margin 2/‖w‖   ·   只有 support vectors 会定义 boundary';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'ang', 'boundary angle', 0, 180, 1),
      slider(state, 'margin', 'margin width', 0.3, 2.5, 0.05)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['SVM MARGIN']), el('span', {}, ['旋转 boundary，拓宽街道'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['support vector machine 不只是把两个 class 分开，它会尽可能把 boundary 推到远离两边的位置。虚线标出 margin；那些碰到虚线、被金色圈出的点就是 support vectors。移动其他任何点，结果都不会改变。'])
    ]));
    state._render();
  }

  // ── knn-smoothness：增大 k，probability 曲线会变平滑 ─────────────
  function knnSmoothness(host) {
    // 1D 二分类点：x position, class（1 或 0）。确定性布局。
    var PTS = [
      [0.6, 1], [1.0, 1], [1.4, 0], [1.8, 1], [2.3, 1], [2.7, 0], [3.1, 1],
      [3.6, 0], [4.0, 0], [4.5, 1], [4.9, 0], [5.3, 0], [5.8, 0], [6.2, 1],
      [6.7, 0], [7.1, 0], [7.6, 0], [8.0, 1]
    ];
    var state = { k: 3 };
    var W = 520, H = 220, PAD = 30, XMAX = 8.6;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function px(x) { return PAD + x / XMAX * (W - 2 * PAD); }
    function py(p) { return H - PAD - p * (H - 2 * PAD); }
    function probAt(x, k) {
      var sorted = PTS.slice().sort(function (a, b) { return Math.abs(a[0] - x) - Math.abs(b[0] - x); });
      var s = 0, i; for (i = 0; i < k && i < sorted.length; i++) s += sorted[i][1];
      return s / Math.min(k, sorted.length);
    }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(0.5), x2: W - PAD, y2: py(0.5), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      var d = '', i; for (i = 0; i <= 200; i++) { var x = XMAX * i / 200; d += (i ? 'L' : 'M') + px(x).toFixed(1) + ' ' + py(probAt(x, state.k)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      for (i = 0; i < PTS.length; i++) {
        svg.appendChild(svgEl('circle', { cx: px(PTS[i][0]), cy: py(PTS[i][1] ? 0.96 : 0.04), r: '4', fill: PTS[i][1] ? 'var(--blueprint,#3553ff)' : 'var(--ink-mute,#999)' }));
      }
      var regime = state.k <= 2 ? '锯齿状 · overfit' : state.k >= 11 ? '平坦 · underfit' : '均衡';
      status.innerHTML = 'k = ' + state.k + ' <small>· ' + regime + '</small>';
      meta.textContent = '顶部点是 class 1，底部点是 class 0  ·  曲线表示由 k 个 nearest points 得到的 P(class 1)';
      formula.textContent = 'P(y = 1 | x) = (k 个 nearest 中 class 1 的占比)   ·   小 k 会跟随噪声，大 k 会把噪声抹平';
    };
    var grid = el('div', {}, [slider(state, 'k', 'k (number of neighbors)', 1, 17, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['K-NN SMOOTHNESS']), el('span', {}, ['拖动 k'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['当 k = 1 时，prediction 会完全复制最近的那个点，因此曲线呈锯齿状，并拟合每一个偶然细节。增大 k 会在更多 neighbors 上求平均，使 boundary 逐渐平滑；当 k 非常大时，它会变平并趋向整体 class rate，忽略局部结构。'])
    ]));
    state._render();
  }

  // ── kmeans-step：逐步查看 Lloyd iterations，观察 WCSS 下降 ────────────
  function kmeansStep(host) {
    // 固定的 2D 点，位于三个松散 blobs 中
    var PTS = [
      [1.8, 7.4], [2.4, 8.0], [1.4, 6.8], [2.8, 7.0], [2.0, 8.4], [1.2, 7.8],
      [7.6, 7.2], [8.2, 7.8], [7.0, 6.8], [8.6, 7.0], [7.8, 8.2], [8.0, 6.4],
      [4.4, 1.8], [5.0, 2.4], [3.8, 1.4], [5.4, 1.8], [4.0, 2.6], [4.8, 1.2]
    ];
    // 故意让初始 centroids 偏离中心，使它们会迁移
    var INIT = [[3.5, 5.5], [6.0, 5.0], [5.0, 3.5]];
    var state = { iter: 0 };
    var W = 520, H = 240, PAD = 28, AX = 10;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var COLORS = ['var(--blueprint,#3553ff)', 'var(--warn,#b8870f)', 'var(--ink,#1a1a1a)'];
    function px(x) { return PAD + x / AX * (W - 2 * PAD); }
    function py(y) { return H - PAD - y / AX * (H - 2 * PAD); }
    // 确定性地预计算 Lloyd iterations（最多 6 步）
    function assign(cs) {
      var a = [], i, j;
      for (i = 0; i < PTS.length; i++) {
        var best = 0, bd = 1e9;
        for (j = 0; j < cs.length; j++) {
          var dx = PTS[i][0] - cs[j][0], dy = PTS[i][1] - cs[j][1], dd = dx * dx + dy * dy;
          if (dd < bd) { bd = dd; best = j; }
        }
        a.push(best);
      }
      return a;
    }
    function update(a) {
      var cs = [], j; for (j = 0; j < 3; j++) { var sx = 0, sy = 0, n = 0, i;
        for (i = 0; i < PTS.length; i++) if (a[i] === j) { sx += PTS[i][0]; sy += PTS[i][1]; n++; }
        cs.push(n ? [sx / n, sy / n] : INIT[j]);
      }
      return cs;
    }
    function wcss(cs, a) { var s = 0, i; for (i = 0; i < PTS.length; i++) { var c = cs[a[i]]; var dx = PTS[i][0] - c[0], dy = PTS[i][1] - c[1]; s += dx * dx + dy * dy; } return s; }
    var FRAMES = [], cur = INIT.map(function (c) { return c.slice(); }), t;
    for (t = 0; t <= 6; t++) {
      var a = assign(cur);
      FRAMES.push({ cs: cur.map(function (c) { return c.slice(); }), a: a, wcss: wcss(cur, a) });
      cur = update(a);
    }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var f = FRAMES[Math.min(state.iter, FRAMES.length - 1)];
      var i;
      for (i = 0; i < PTS.length; i++) {
        svg.appendChild(svgEl('circle', { cx: px(PTS[i][0]), cy: py(PTS[i][1]), r: '4', fill: COLORS[f.a[i]], opacity: '0.85' }));
      }
      for (i = 0; i < f.cs.length; i++) {
        var cx = px(f.cs[i][0]), cy = py(f.cs[i][1]);
        svg.appendChild(svgEl('path', { d: 'M ' + (cx - 7) + ' ' + cy + ' L ' + (cx + 7) + ' ' + cy + ' M ' + cx + ' ' + (cy - 7) + ' L ' + cx + ' ' + (cy + 7), stroke: COLORS[i], 'stroke-width': '2.5' }));
        svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: '8', fill: 'none', stroke: COLORS[i], 'stroke-width': '2' }));
      }
      status.innerHTML = 'WCSS = ' + f.wcss.toFixed(2);
      meta.textContent = '第 ' + state.iter + ' / 6 次 iteration  ·  十字是 centroids  ·  WCSS 每一步都会下降，直到 assignments 不再变化';
      formula.textContent = '重复：把每个点 assign 到最近的 centroid → 把每个 centroid 移到其 cluster mean   ·   WCSS = Σ ‖x − μ‖²';
    };
    var grid = el('div', {}, [slider(state, 'iter', 'iteration', 0, 6, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['K-MEANS STEP']), el('span', {}, ['逐步查看 iterations'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['K-means 在两个步骤之间交替：把每个点 assign 到最近的 centroid，然后把每个 centroid 移到其 points 的 mean。within-cluster sum of squares 只会下降，因此一旦没有点切换 cluster，algorithm 就会收敛。'])
    ]));
    state._render();
  }

  // ── decision-tree-depth：更深的 tree，更多 splits，overfitting 警告 ─────
  function decisionTreeDepth(host) {
    var state = { depth: 3 };
    var W = 520, H = 220, PAD = 24;
    // 数据大约有 4 个真实区域；超过 depth ~2（3 个 leaves）后就会 overfit
    var REAL_LEAVES = 4;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var depth = state.depth;
      var levels = depth + 1;
      var topY = PAD, botY = H - PAD;
      var dy = (botY - topY) / Math.max(1, depth);
      var L;
      // 逐层绘制 binary tree
      for (L = 0; L <= depth; L++) {
        var nodes = Math.pow(2, L);
        var y = depth === 0 ? (topY + botY) / 2 : topY + L * dy;
        var i;
        for (i = 0; i < nodes; i++) {
          var x = PAD + (i + 0.5) / nodes * (W - 2 * PAD);
          var leaf = (L === depth);
          if (L > 0) {
            var pnodes = Math.pow(2, L - 1);
            var pi = Math.floor(i / 2);
            var pxv = PAD + (pi + 0.5) / pnodes * (W - 2 * PAD);
            var pyv = topY + (L - 1) * dy;
            svg.appendChild(svgEl('line', { x1: pxv, y1: pyv, x2: x, y2: y, stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1' }));
          }
          var over = leaf && nodes > REAL_LEAVES;
          svg.appendChild(svgEl('circle', { cx: x, cy: y, r: leaf ? '6' : '5', fill: leaf ? (over ? 'var(--warn,#b8870f)' : 'var(--blueprint,#3553ff)') : 'var(--bg,#fafaf5)', stroke: leaf ? 'none' : 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
        }
      }
      var splits = Math.pow(2, depth) - 1;
      var leaves = Math.pow(2, depth);
      var over = leaves > REAL_LEAVES;
      status.innerHTML = splits + ' <small>internal splits · ' + leaves + ' leaves</small>';
      meta.textContent = (over ? '超出数据本身：用 ' + leaves + ' 个 leaves 去拟合约 ' + REAL_LEAVES + ' 个真实区域，tree 开始记忆噪声' : 'depth ' + depth + ': 仍在追踪真实结构');
      formula.textContent = '一个 depth-d binary tree 最多有 2^d − 1 个 splits 和 2^d 个 leaves   ·   d = ' + depth + '  →  ' + splits + ' 个 splits, ' + leaves + ' 个 leaves';
    };
    var grid = el('div', {}, [slider(state, 'depth', 'max depth', 0, 6, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['DECISION TREE DEPTH']), el('span', {}, ['拖动 max depth'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['depth 每增加一层，leaves 会翻倍，tree 能切分出的区域也会快速增加。少量 splits 能捕捉真实结构；超过这个范围后，leaves 会变成金色，表示 tree 正在逐点拟合，而不是拟合 pattern。'])
    ]));
    state._render();
  }

  // ── feature-scaling：raw 拉长 contours 与 scaled 圆形 contours 的对比 ────────
  function featureScaling(host) {
    var state = { mode: 'raw' };
    var W = 520, H = 240, PAD = 30, CX = 260, CY = 120;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var raw = state.mode === 'raw';
      var ax = raw ? 210 : 90, ay = 70; // raw 时 x-radius 更宽，scaled 时接近圆形
      var k;
      for (k = 1; k <= 4; k++) {
        svg.appendChild(svgEl('ellipse', { cx: CX, cy: CY, rx: ax * k / 4, ry: ay * k / 4, fill: 'none', stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1.2' }));
      }
      svg.appendChild(svgEl('circle', { cx: CX, cy: CY, r: '4', fill: 'var(--ink,#1a1a1a)' }));
      // Gradient Descent 路径：从固定起点走向中心
      var sx = CX - (raw ? 200 : 80), sy = CY - 62;
      var path = 'M ' + sx + ' ' + sy + ' ', x = sx, y = sy, i;
      for (i = 0; i < 9; i++) {
        // step 与 local Gradient 成比例：在陡峭（短）轴方向更大
        var gx = (x - CX) / (ax * ax), gy = (y - CY) / (ay * ay);
        var scale = raw ? 7200 : 2600;
        x -= gx * scale; y -= gy * scale;
        path += 'L ' + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
        svg.appendChild(svgEl('circle', { cx: x, cy: y, r: '3', fill: 'var(--blueprint,#3553ff)' }));
      }
      svg.appendChild(svgEl('path', { d: path, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5', 'stroke-dasharray': '4 3' }));
      svg.appendChild(svgEl('circle', { cx: sx, cy: sy, r: '4', fill: 'var(--warn,#b8870f)' }));
      meta.textContent = raw ? 'raw features：contours 被拉长，因此 descent 会在狭窄谷地中来回 zig-zag' : 'standardized：contours 接近圆形，因此 descent 几乎直奔 minimum';
      formula.textContent = raw ? 'feature scales 不一致 → 拉长的 loss surface → 缓慢、振荡的 convergence' : 'x′ = (x − μ) / σ   →   每个 feature 具有 unit variance → 圆形碗面 → 快速 descent';
    };
    var grid = el('div', {}, [select(state, 'mode', 'features', [['raw (unscaled)', 'raw'], ['standardized', 'scaled']])]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['FEATURE SCALING']), el('span', {}, ['切换 raw 与 standardized'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['当 features 处在不同 scales 上时，loss surface 会变成一条又长又窄的谷地，Gradient Descent 会在两侧墙壁之间反复弹跳。把每个 feature standardize 到 zero mean 和 unit variance 后，碗面会变圆，因此同一个 algorithm 几乎可以直线走到 minimum。'])
    ]));
    state._render();
  }

  // ── naive-bayes：观察一个值，比较 likelihoods，读取 posterior ──
  function naiveBayes(host) {
    // 一个 feature 上的两个 class-conditional gaussians，priors 相等
    var muA = 0.38, muB = 0.66, sd = 0.12;
    var state = { x: 0.5 };
    var W = 520, H = 220, PAD = 30;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var bar = el('i');
    var barWrap = el('div', { class: 'lf-bar' }, [bar]);
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function gauss(x, mu) { return Math.exp(-0.5 * Math.pow((x - mu) / sd, 2)); }
    function px(x) { return PAD + x * (W - 2 * PAD); }
    function py(v) { return H - PAD - v * (H - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      [{ mu: muA, st: 'var(--ink-mute,#999)' }, { mu: muB, st: 'var(--blueprint,#3553ff)' }].forEach(function (g) {
        var d = '', i; for (i = 0; i <= 120; i++) { var x = i / 120; d += (i ? 'L' : 'M') + px(x).toFixed(1) + ' ' + py(gauss(x, g.mu)).toFixed(1) + ' '; }
        svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: g.st, 'stroke-width': '2' }));
      });
      var tx = px(state.x);
      svg.appendChild(svgEl('line', { x1: tx, y1: PAD, x2: tx, y2: H - PAD, stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5' }));
      var la = gauss(state.x, muA), lb = gauss(state.x, muB);
      // priors 相等 → posterior 就是归一化后的 likelihood
      var postB = lb / (la + lb || 1);
      svg.appendChild(svgEl('circle', { cx: tx, cy: py(la), r: '4', fill: 'var(--ink-mute,#999)' }));
      svg.appendChild(svgEl('circle', { cx: tx, cy: py(lb), r: '4', fill: 'var(--blueprint,#3553ff)' }));
      bar.style.width = (postB * 100).toFixed(1) + '%';
      status.innerHTML = 'P(B | x) = ' + postB.toFixed(3);
      meta.textContent = 'observed x = ' + state.x.toFixed(2) + '  ·  likelihood A ' + la.toFixed(3) + '  ·  likelihood B ' + lb.toFixed(3) + '  ·  equal priors';
      formula.textContent = 'P(B | x) = P(x | B)·P(B) / Σ_c P(x | c)·P(c)   ·   在 equal priors 下，更大的 likelihood 获胜';
    };
    var grid = el('div', {}, [slider(state, 'x', 'observed feature value', 0.02, 0.98, 0.01)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['NAIVE BAYES']), el('span', {}, ['拖动 observed value'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), barWrap, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['每个 class 都有自己的钟形曲线，描述该 feature 的分布。橙色线是你观察到的值；两个点表示每个 class 生成它的可能性。Bayes 会把这些 likelihoods 按 priors 加权，转换成 posterior 条，也就是这个点属于 class B 的 probability。'])
    ]));
    state._render();
  }

  // ── class-imbalance：始终预测 majority 带来的 accuracy 悖论 ───────
  function classImbalance(host) {
    var state = { ratio: 5 }; // positive-class percent
    var N = 1000;
    var W = 520, H = 120, PAD = 24;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var bar = el('i');
    var barWrap = el('div', { class: 'lf-bar' }, [bar]);
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var pos = state.ratio / 100, neg = 1 - pos;
      var inner = W - 2 * PAD;
      var split = PAD + neg * inner;
      svg.appendChild(svgEl('rect', { x: PAD, y: 40, width: (neg * inner).toFixed(1), height: '40', fill: 'var(--ink-mute,#999)' }));
      svg.appendChild(svgEl('rect', { x: split.toFixed(1), y: 40, width: (pos * inner).toFixed(1), height: '40', fill: 'var(--warn,#b8870f)' }));
      // 一个“预测 majority（negative）”的 classifier
      var acc = neg; // accuracy = 它预测正确的占比 = negatives
      var recall = 0; // 它从不预测 positive → true positives 为零
      bar.style.width = (acc * 100).toFixed(1) + '%';
      barWrap.classList.toggle('over', pos < 0.2);
      status.innerHTML = (acc * 100).toFixed(1) + '% <small>accuracy · 0% recall</small>';
      meta.textContent = '全部预测为 negative：捕捉所有 ' + Math.round(neg * N) + ' 个 negatives，漏掉所有 ' + Math.round(pos * N) + ' 个 positives  ·  金色 = 从未被找到的 positives';
      formula.textContent = 'accuracy = (1 − positive rate)   ·   recall = 0   ·   这里的高 accuracy 没有意义';
    };
    var grid = el('div', {}, [slider(state, 'ratio', 'positive-class ratio (%)', 1, 50, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['CLASS IMBALANCE']), el('span', {}, ['拖动 positive ratio'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), barWrap, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['当某个 class 很少见时，一个始终预测 majority 的 classifier 可以拿到很高的 accuracy，却抓不到任何你真正关心的 cases。金色切片，也就是它永远找不到的 positives，对 accuracy 来说是不可见的。这就是在 imbalanced data 上 recall 和 F1 很重要的原因。'])
    ]));
    state._render();
  }

  // ── k-fold-cv：划分为 k 个 folds，每轮留出一个 ──────────────────
  function kFoldCv(host) {
    var state = { k: 5 };
    var W = 520, ROWH = 26, PAD = 24;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' 220' });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var k = state.k;
      var H = PAD * 2 + k * ROWH;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var cellW = (W - 2 * PAD) / k;
      var round, fold;
      for (round = 0; round < k; round++) {
        var y = PAD + round * ROWH;
        for (fold = 0; fold < k; fold++) {
          var x = PAD + fold * cellW;
          var held = (fold === round);
          svg.appendChild(svgEl('rect', { x: x.toFixed(1), y: y.toFixed(1), width: (cellW - 3).toFixed(1), height: (ROWH - 6).toFixed(1), fill: held ? 'var(--warn,#b8870f)' : 'var(--blueprint,#3553ff)', opacity: held ? '1' : '0.32' }));
        }
      }
      var trainFrac = (k - 1) / k;
      status.innerHTML = k + '-fold <small>· ' + k + ' 轮</small>';
      meta.textContent = '每轮在 ' + (k - 1) + ' 个 folds（' + Math.round(trainFrac * 100) + '%）上 training，并在金色 fold 上 validation  ·  每个 example 都恰好被 held out 一次';
      formula.textContent = '把 data 分成 k 个相等 folds → 对每个 fold，在其余 k−1 个 folds 上 train，并在该 fold 上 score → 对 k 个 scores 取平均';
    };
    var grid = el('div', {}, [slider(state, 'k', 'number of folds k', 2, 10, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['K-FOLD CROSS-VALIDATION']), el('span', {}, ['拖动 k'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['每一行是一轮：金色 fold 被留出用于 validation，蓝色 folds 用于 training。轮换 held-out fold 意味着每个 example 都会被评分一次，而对 k 个 scores 取平均，比单次 split 能给出更稳定的估计。'])
    ]));
    state._render();
  }

  LF.register({
    'linear-regression-fit': linearRegressionFit,
    'logistic-sigmoid': logisticSigmoid,
    'svm-margin': svmMargin,
    'knn-smoothness': knnSmoothness,
    'kmeans-step': kmeansStep,
    'decision-tree-depth': decisionTreeDepth,
    'feature-scaling': featureScaling,
    'naive-bayes': naiveBayes,
    'class-imbalance': classImbalance,
    'k-fold-cv': kFoldCv
  });
})();
