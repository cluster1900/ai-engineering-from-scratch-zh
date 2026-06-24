/* figures-math.js — Phase 1（数学基础）的交互式课程图示。
   在 lesson-figures.js 之后加载，仅使用共享 LF 工具包，并通过 CSS vars
   沿用同一 blueprint 主题。使用相同的 fenced-block 语法：
       ```figure
       vector-projection
       ``` */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl, slider = LF.slider, select = LF.select;

  // ── vector-projection: 将 a 投影到 b 上，观察垂足滑动 ─────────────────────
  function vectorProjection(host) {
    var state = { degB: 25, lenA: 2.4, degA: 70 };
    var W = 520, H = 230, OX = 60, OY = H - 40, U = 52;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function arrow(x2, y2, st, w) { return svgEl('line', { x1: OX, y1: OY, x2: OX + x2 * U, y2: OY - y2 * U, stroke: st, 'stroke-width': w || '2.5' }); }
    state._render = function () {
      var ra = state.degA * Math.PI / 180, rb = state.degB * Math.PI / 180;
      var ax = state.lenA * Math.cos(ra), ay = state.lenA * Math.sin(ra);
      var bx = Math.cos(rb), by = Math.sin(rb);                 // b 是单位方向
      var dot = ax * bx + ay * by;                              // a·b, |b|=1
      var projLen = dot;                                        // 标量投影 = |a|cos(theta)
      var px = projLen * bx, py = projLen * by;                 // projection Vector (a·b/|b|^2) b
      var lenA = Math.sqrt(ax * ax + ay * ay);
      var theta = Math.acos(LF.clamp(dot / (lenA || 1), -1, 1)) * 180 / Math.PI;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(arrow(3.4 * bx, 3.4 * by, 'var(--ink-mute,#999)', '2'));     // b 的方向
      svg.appendChild(arrow(ax, ay, 'var(--blueprint,#3553ff)'));                  // a
      svg.appendChild(arrow(px, py, 'var(--warn,#b8870f)', '3'));                  // 到 b 上的投影
      svg.appendChild(svgEl('line', { x1: OX + ax * U, y1: OY - ay * U, x2: OX + px * U, y2: OY - py * U, stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1', 'stroke-dasharray': '4 3' }));
      num.innerHTML = projLen.toFixed(2) + ' <small>投影长度</small>';
      meta.textContent = '角 θ = ' + theta.toFixed(0) + '°  ·  proj = |a|cos θ = ' + projLen.toFixed(2) + (projLen < 0 ? '  （方向与 b 相反）' : '');
      formula.textContent = 'proj_b a = (a·b / |b|²) b   ·   scalar = |a|cos θ   ·   b shown as unit Vector (grey)';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'degB', 'b 的角度', 0, 180, 1),
      slider(state, 'degA', 'a 的角度', 0, 180, 1),
      slider(state, 'lenA', 'a 的长度', 0.4, 3.4, 0.1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['VECTOR PROJECTION']), el('span', {}, ['拖动角度'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['蓝色是 a，灰色是 b 的方向，橙色是 a 在 b 上投下的影子。标量投影 |a|cos θ 在两个 Vector 垂直时缩小到零，在角度超过 90° 后变为负数。虚线是从 a 垂直到 b 上垂足的线段。'])
    ]));
    state._render();
  }

  // ── matrix-transform: 一个 2x2 Matrix 让单位正方形变形 ───────────────────
  function matrixTransform(host) {
    var state = { a: 1, b: 0.5, c: 0, d: 1 };
    var W = 520, H = 230, CX = 260, CY = 120, U = 42;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function P(x, y) { return (CX + x * U) + ' ' + (CY - y * U); }
    function quad(p, st, fill) { return svgEl('path', { d: 'M ' + P(p[0][0], p[0][1]) + ' L ' + P(p[1][0], p[1][1]) + ' L ' + P(p[2][0], p[2][1]) + ' L ' + P(p[3][0], p[3][1]) + ' Z', fill: fill, stroke: st, 'stroke-width': '2' }); }
    state._render = function () {
      var a = state.a, b = state.b, c = state.c, d = state.d;
      var det = a * d - b * c;
      var unit = [[0, 0], [1, 0], [1, 1], [0, 1]];
      var tf = unit.map(function (v) { return [a * v[0] + b * v[1], c * v[0] + d * v[1]]; });
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: 20, y1: CY, x2: W - 20, y2: CY, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('line', { x1: CX, y1: 12, x2: CX, y2: H - 12, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      svg.appendChild(quad(unit, 'var(--ink-mute,#999)', 'none'));
      svg.appendChild(quad(tf, 'var(--blueprint,#3553ff)', det < 0 ? 'var(--warn,#b8870f)' : 'var(--blueprint,#3553ff)'));
      var img = svg.lastChild; img.setAttribute('fill-opacity', '0.12');
      num.innerHTML = det.toFixed(2) + ' <small>行列式</small>';
      meta.textContent = (det < 0 ? '方向被翻转  ·  ' : det === 0 ? '坍缩成一条线  ·  ' : '') + '面积缩放为 ' + Math.abs(det).toFixed(2) + 'x';
      formula.textContent = 'M = [[' + a.toFixed(1) + ', ' + b.toFixed(1) + '], [' + c.toFixed(1) + ', ' + d.toFixed(1) + ']]   ·   det = ad − bc = ' + det.toFixed(2);
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'a', 'a  (M₁₁)', -2, 2, 0.1),
      slider(state, 'b', 'b  (M₁₂)', -2, 2, 0.1),
      slider(state, 'c', 'c  (M₂₁)', -2, 2, 0.1),
      slider(state, 'd', 'd  (M₂₂)', -2, 2, 0.1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['MATRIX TRANSFORM']), el('span', {}, ['拖动四个元素'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['灰色是单位正方形；蓝色是它在 M 作用下的图像。M 的列表示基 Vector 落到的位置。行列式 ad − bc 是该平行四边形的有符号面积：它是这个 Matrix 缩放面积的因子，并且在变换翻转方向时变为负数。'])
    ]));
    state._render();
  }

  // ── eigen-directions: 对称 2x2 Matrix 缩放其 eigenvectors，并旋转其他方向 ─
  function eigenDirections(host) {
    var state = { a: 2, c: 0.8, d: 1, deg: 30 };
    var W = 520, H = 230, CX = 200, CY = 120, U = 34;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function arrow(vx, vy, st, w) { return svgEl('line', { x1: CX, y1: CY, x2: CX + vx * U, y2: CY - vy * U, stroke: st, 'stroke-width': w || '2' }); }
    state._render = function () {
      var a = state.a, b = state.c, d = state.d;                 // 对称：M = [[a,b],[b,d]]
      var tr = a + d, det = a * d - b * b;
      var disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
      var l1 = tr / 2 + disc, l2 = tr / 2 - disc;                // 实 eigenvalues（对称）
      function eigvec(l) {
        var ex = b, ey = l - a;
        if (Math.abs(ex) < 1e-6 && Math.abs(ey) < 1e-6) { ex = 1; ey = 0; }
        var n = Math.sqrt(ex * ex + ey * ey); return [ex / n, ey / n];
      }
      var v1 = eigvec(l1), v2 = eigvec(l2);
      var r = state.deg * Math.PI / 180, gx = Math.cos(r), gy = Math.sin(r);
      var tx = a * gx + b * gy, ty = b * gx + d * gy;            // 将 M 应用于一般 Vector
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: 20, y1: CY, x2: 380, y2: CY, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('line', { x1: CX, y1: 12, x2: CX, y2: H - 12, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      [v1, v2].forEach(function (v) {                            // eigenvectors 的两个方向：不变轴
        svg.appendChild(svgEl('line', { x1: CX - v[0] * 80, y1: CY + v[1] * 80, x2: CX + v[0] * 80, y2: CY - v[1] * 80, stroke: 'var(--ink-mute,#999)', 'stroke-width': '1', 'stroke-dasharray': '4 3' }));
      });
      svg.appendChild(arrow(v1[0] * l1 / 2, v1[1] * l1 / 2, 'var(--warn,#b8870f)', '3'));   // 缩放后的 eigenvector 1
      svg.appendChild(arrow(v2[0] * l2 / 2, v2[1] * l2 / 2, 'var(--warn,#b8870f)', '3'));   // 缩放后的 eigenvector 2
      svg.appendChild(arrow(gx, gy, 'var(--rule-soft,#bbb)', '1.5'));                       // 一般输入
      svg.appendChild(arrow(tx, ty, 'var(--blueprint,#3553ff)', '2.5'));                    // 它的图像（已旋转）
      num.innerHTML = 'λ = ' + l1.toFixed(2) + ', ' + l2.toFixed(2);
      meta.textContent = 'eigenvalues 会拉伸虚线轴  ·  灰色输入 Vector 离轴时会旋转成蓝色';
      formula.textContent = 'M = [[' + a.toFixed(1) + ', ' + b.toFixed(1) + '], [' + b.toFixed(1) + ', ' + d.toFixed(1) + ']]   ·   Mv = λv only along the eigen-axes';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'a', 'a  (M₁₁)', -2, 3, 0.1),
      slider(state, 'd', 'd  (M₂₂)', -2, 3, 0.1),
      slider(state, 'c', '非对角 b', -2, 2, 0.1),
      slider(state, 'deg', '一般 Vector 角度', 0, 360, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['EIGEN-DIRECTIONS']), el('span', {}, ['拖动 Matrix'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['对于对称 Matrix，eigenvectors 是虚线轴，而 Matrix 只是按 eigenvalue 对沿这些轴的任何对象进行拉伸（橙色）。离开这些轴的一般灰色 Vector 会同时拉伸并旋转成蓝色图像。拖动它的角度：只有在 eigen-axis 上，输出才会保持与输入平行。'])
    ]));
    state._render();
  }

  // ── derivative-tangent: f(x)=x^3-3x 在 x0 处的切线 ───────────────────────
  function derivativeTangent(host) {
    var state = { x0: -1.6 };
    var W = 520, H = 230, PAD = 30, XR = 2.4, YR = 4.2;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function f(x) { return x * x * x - 3 * x; }
    function df(x) { return 3 * x * x - 3; }
    function px(x) { return PAD + (x + XR) / (2 * XR) * (W - 2 * PAD); }
    function py(y) { return H / 2 - (y / YR) * (H / 2 - PAD); }
    state._render = function () {
      var x0 = state.x0, slope = df(x0), y0 = f(x0);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(0), x2: W - PAD, y2: py(0), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('line', { x1: px(0), y1: PAD, x2: px(0), y2: H - PAD, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      var d = '', i; for (i = 0; i <= 140; i++) { var x = -XR + 2 * XR * i / 140; d += (i ? 'L' : 'M') + px(x).toFixed(1) + ' ' + py(f(x)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      var xL = -XR, xRr = XR;                                    // 切线：y = y0 + slope*(x-x0)
      svg.appendChild(svgEl('line', { x1: px(xL), y1: py(y0 + slope * (xL - x0)), x2: px(xRr), y2: py(y0 + slope * (xRr - x0)), stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.8' }));
      svg.appendChild(svgEl('circle', { cx: px(x0), cy: py(y0), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      num.innerHTML = slope.toFixed(2) + ' <small>斜率 f′(x₀)</small>';
      meta.textContent = 'x₀ = ' + x0.toFixed(2) + '  ·  f(x₀) = ' + y0.toFixed(2) + '  ·  ' + (Math.abs(slope) < 0.05 ? '水平：临界点' : slope > 0 ? '上升' : '下降');
      formula.textContent = "f(x) = x³ − 3x   ·   f′(x) = 3x² − 3   ·   tangent y = f(x₀) + f′(x₀)(x − x₀)";
    };
    var grid = el('div', {}, [slider(state, 'x0', '点 x₀', -2.3, 2.3, 0.05)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['DERIVATIVE / TANGENT']), el('span', {}, ['拖动 x₀'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['导数是切线的斜率。对于 f(x) = x³ − 3x，它等于 3x² − 3，并在 x = ±1 处为零，这两个临界点处橙色直线变成水平。它们之间函数下降，外侧函数上升。Gradient Descent 正是读取这个斜率来决定向哪个方向迈步。'])
    ]));
    state._render();
  }

  // ── chain-rule: y = sin(a x^2) 的 dy/dx，是局部导数的乘积 ────────────────
  function chainRule(host) {
    var state = { x: 1.0, a: 1.5 };
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var rows = el('div', {});
    function bar(label, value, ref) {
      var b = el('i'); b.style.width = LF.clamp(Math.abs(value) / ref * 100, 0, 100).toFixed(0) + '%';
      if (value < 0) b.style.background = 'var(--warn,#b8870f)';
      return el('div', { class: 'lf-ctrl' }, [el('label', {}, [label, el('b', {}, [value.toFixed(3)])]), el('div', { class: 'lf-bar' }, [b])]);
    }
    state._render = function () {
      var x = state.x, a = state.a;
      var u = a * x * x;                 // 内层：u = a x^2
      var dydu = Math.cos(u);            // 外层导数：d/du sin(u) = cos(u)
      var dudx = 2 * a * x;              // 内层导数：du/dx = 2 a x
      var dydx = dydu * dudx;            // 链式法则乘积
      while (rows.firstChild) rows.removeChild(rows.firstChild);
      rows.appendChild(bar('dy/du = cos(a x²)', dydu, 1));
      rows.appendChild(bar('du/dx = 2 a x', dudx, Math.max(1, 2 * Math.abs(a) * 2)));
      rows.appendChild(bar('dy/dx = 乘积', dydx, Math.max(1, 2 * Math.abs(a) * 2)));
      num.innerHTML = dydx.toFixed(3) + ' <small>dy/dx</small>';
      meta.textContent = 'y = sin(' + u.toFixed(2) + ') = ' + Math.sin(u).toFixed(3) + '  ·  局部斜率相乘：' + dydu.toFixed(2) + ' × ' + dudx.toFixed(2);
      formula.textContent = 'y = sin(a x²)   ·   dy/dx = cos(a x²) · 2 a x   ·   outer derivative × inner derivative';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'x', 'x', -2.5, 2.5, 0.05),
      slider(state, 'a', 'a', 0.2, 3, 0.1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['CHAIN RULE']), el('span', {}, ['拖动 x 和 a'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [rows, el('div', { style: 'margin-top:12px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['复合函数 y = sin(a x²) 的求导方式，是把两个局部斜率相乘：外层的 cos(a x²) 和内层的 2 a x。每条橙色或蓝色条都是一个因子；它们的乘积就是下方的条。这正是 Backpropagation 逐个链接地把 gradients 推过整个 network 时应用的规则。'])
    ]));
    state._render();
  }

  // ── gaussian-pdf: 拖动均值和标准差，给一倍 sigma 区间上色 ────────────────
  function gaussianPdf(host) {
    var state = { mu: 0, sigma: 1 };
    var W = 520, H = 220, PAD = 30, XLO = -6, XHI = 6;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function px(x) { return PAD + (x - XLO) / (XHI - XLO) * (W - 2 * PAD); }
    var YMAX = 1 / (0.4 * Math.sqrt(2 * Math.PI));            // 在允许的最小 sigma 处达到峰值
    function pdf(x, mu, s) { return Math.exp(-0.5 * Math.pow((x - mu) / s, 2)) / (s * Math.sqrt(2 * Math.PI)); }
    function py(y) { return H - PAD - y / YMAX * (H - 2 * PAD); }
    state._render = function () {
      var mu = state.mu, s = state.sigma, peak = pdf(mu, mu, s);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: H - PAD, x2: W - PAD, y2: H - PAD, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      var shade = 'M ' + px(mu - s).toFixed(1) + ' ' + py(0).toFixed(1) + ' ', i, x;   // +-1 sigma 区间 = 约 68%
      for (i = 0; i <= 60; i++) { x = (mu - s) + 2 * s * i / 60; shade += 'L ' + px(x).toFixed(1) + ' ' + py(pdf(x, mu, s)).toFixed(1) + ' '; }
      shade += 'L ' + px(mu + s).toFixed(1) + ' ' + py(0).toFixed(1) + ' Z';
      svg.appendChild(svgEl('path', { d: shade, fill: 'var(--blueprint,#3553ff)', 'fill-opacity': '0.16', stroke: 'none' }));
      var d = '';
      for (i = 0; i <= 160; i++) { x = XLO + (XHI - XLO) * i / 160; d += (i ? 'L' : 'M') + px(x).toFixed(1) + ' ' + py(pdf(x, mu, s)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      svg.appendChild(svgEl('line', { x1: px(mu), y1: py(0), x2: px(mu), y2: py(peak), stroke: 'var(--ink-mute,#999)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      num.innerHTML = peak.toFixed(3) + ' <small>峰值密度</small>';
      meta.textContent = 'μ = ' + mu.toFixed(2) + '  ·  σ = ' + s.toFixed(2) + '  ·  阴影 ±1σ 包含约 68% 的质量';
      formula.textContent = 'p(x) = exp(−½((x−μ)/σ)²) / (σ√(2π))   ·   area always integrates to 1';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'mu', '均值 μ', -4, 4, 0.1),
      slider(state, 'sigma', '标准差 σ', 0.4, 3, 0.05)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['GAUSSIAN PDF']), el('span', {}, ['拖动 μ 和 σ'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['均值会让钟形曲线左右平移；标准差设置它的宽度。更小的 σ 会产生更高、更窄的峰，因为总面积固定为 1。阴影带是 μ ± σ，无论你把曲线放在哪里，它总是捕获约 68% 的概率。'])
    ]));
    state._render();
  }

  // ── bayes-update: 用先验、敏感度、FPR 得到医学检测的后验 ───────────────
  function bayesUpdate(host) {
    var state = { prior: 1, sens: 95, fpr: 5 };
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var rows = el('div', {});
    function bar(label, value) {
      var b = el('i'); b.style.width = (value * 100).toFixed(1) + '%';
      return el('div', { class: 'lf-ctrl' }, [el('label', {}, [label, el('b', {}, [(value * 100).toFixed(1) + '%'])]), el('div', { class: 'lf-bar' }, [b])]);
    }
    state._render = function () {
      var pr = state.prior / 100;            // P(disease)
      var sens = state.sens / 100;           // P(+ | disease)
      var fpr = state.fpr / 100;             // P(+ | healthy)
      var pPos = sens * pr + fpr * (1 - pr); // 检测为阳性的总概率
      var post = pPos > 0 ? sens * pr / pPos : 0;   // Bayes：P(disease | +)
      while (rows.firstChild) rows.removeChild(rows.firstChild);
      rows.appendChild(bar('先验 P(disease)', pr));
      rows.appendChild(bar('后验 P(disease | +)', post));
      num.innerHTML = (post * 100).toFixed(1) + ' <small>% 在给定 + 时患病</small>';
      meta.textContent = '阳性检测出现的比例是 ' + (pPos * 100).toFixed(1) + '%  ·  当疾病罕见时，大多数都是误报';
      formula.textContent = 'P(D|+) = sens·prior / (sens·prior + fpr·(1−prior)) = ' + (sens).toFixed(2) + '·' + pr.toFixed(3) + ' / ' + pPos.toFixed(4);
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'prior', '先验 P(disease) %', 0.1, 50, 0.1),
      slider(state, 'sens', '敏感度 P(+|D) %', 50, 100, 0.5),
      slider(state, 'fpr', 'false-positive rate %', 0.5, 30, 0.5)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['BAYES UPDATE']), el('span', {}, ['拖动先验、敏感度和 FPR'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [rows, el('div', { style: 'margin-top:12px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['Bayes 的反直觉之处：一种影响 1/100 人的疾病，即使检测准确率为 95%，阳性结果中的大多数人仍然是健康的，因为来自庞大健康人群的假阳性会淹没少量真实病例。只有当先验足够高、真实病例数量超过误报时，后验才会明显上升。'])
    ]));
    state._render();
  }

  // ── entropy-kl: 两个 4-bin 分布，H(p) 和 KL(p||q) ───────────────────────
  function entropyKl(host) {
    var state = { p0: 5, p1: 3, p2: 2, p3: 1, q0: 1, q1: 2, q2: 3, q3: 4 };
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var rows = el('div', {});
    function norm(v) { var s = v.reduce(function (a, x) { return a + x; }, 0) || 1; return v.map(function (x) { return x / s; }); }
    state._render = function () {
      var p = norm([state.p0, state.p1, state.p2, state.p3]);
      var q = norm([state.q0, state.q1, state.q2, state.q3]);
      var H = -p.reduce(function (a, pi) { return a + (pi > 0 ? pi * Math.log2(pi) : 0); }, 0);
      var KL = p.reduce(function (a, pi, i) { return a + (pi > 0 && q[i] > 0 ? pi * Math.log2(pi / q[i]) : 0); }, 0);
      while (rows.firstChild) rows.removeChild(rows.firstChild);
      p.forEach(function (pi, i) {
        var bp = el('i'); bp.style.width = (pi * 100).toFixed(0) + '%';
        var bq = el('i'); bq.style.width = (q[i] * 100).toFixed(0) + '%'; bq.style.background = 'var(--ink-mute,#999)';
        rows.appendChild(el('div', { class: 'lf-ctrl' }, [
          el('label', {}, ['bin ' + i, el('b', {}, ['p ' + (pi * 100).toFixed(0) + '% · q ' + (q[i] * 100).toFixed(0) + '%'])]),
          el('div', { class: 'lf-bar' }, [bp]), el('div', { class: 'lf-bar' }, [bq])
        ]));
      });
      num.innerHTML = H.toFixed(2) + ' <small>bits H(p)</small>';
      meta.textContent = 'KL(p‖q) = ' + KL.toFixed(3) + ' bits  ·  始终 ≥ 0，只有当 p = q 时为零  ·  非对称：KL(p‖q) ≠ KL(q‖p)';
      formula.textContent = 'H(p) = −Σ pᵢ log₂ pᵢ   ·   KL(p‖q) = Σ pᵢ log₂(pᵢ / qᵢ)';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'p0', 'p bin 0', 0, 10, 1), slider(state, 'q0', 'q bin 0', 0, 10, 1),
      slider(state, 'p1', 'p bin 1', 0, 10, 1), slider(state, 'q1', 'q bin 1', 0, 10, 1),
      slider(state, 'p2', 'p bin 2', 0, 10, 1), slider(state, 'q2', 'q bin 2', 0, 10, 1),
      slider(state, 'p3', 'p bin 3', 0, 10, 1), slider(state, 'q3', 'q bin 3', 0, 10, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['ENTROPY & KL']), el('span', {}, ['调整 p（蓝色）和 q（灰色）'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [rows, el('div', { style: 'margin-top:12px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['Entropy H(p) 衡量蓝色分布的平均惊讶度，当四个 bin 完全相等时达到最大。KL(p‖q) 衡量用为 q 构建的编码来编码来自 p 的样本时额外付出的 bits；它永不为负，只有两者匹配时为零，并且不对称。Cross-entropy 训练最小化的正是这个差距。'])
    ]));
    state._render();
  }

  // ── pca-axes: 相关点云，从 covariance Matrix 得到 principal axes ───────
  function pcaAxes(host) {
    var state = { rho: 0.7, scale: 1.4 };
    var W = 520, H = 230, CX = 200, CY = 115, U = 70;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var seeds = []; var s = 12345;
    function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
    function gz() { return Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd()); }
    var i; for (i = 0; i < 120; i++) seeds.push([gz(), gz()]);
    state._render = function () {
      var rho = state.rho, sc = state.scale;
      var sx = sc, sy = 0.55;
      // 生成点的 covariance：x = sx*z1, y = sy*(rho*z1 + sqrt(1-rho^2)*z2)
      var cxx = sx * sx, cyy = sy * sy, cxy = sx * sy * rho;
      var tr = cxx + cyy, det = cxx * cyy - cxy * cxy;
      var disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
      var l1 = tr / 2 + disc, l2 = tr / 2 - disc;      // 沿两条 principal axes 的方差
      function eig(l) { var ex = cxy, ey = l - cxx; if (Math.abs(ex) < 1e-9 && Math.abs(ey) < 1e-9) { ex = 1; ey = 0; } var n = Math.sqrt(ex * ex + ey * ey); return [ex / n, ey / n]; }
      var v1 = eig(l1), v2 = eig(l2);
      var pct = l1 / (l1 + l2) * 100;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: 20, y1: CY, x2: 380, y2: CY, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('line', { x1: CX, y1: 12, x2: CX, y2: H - 12, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      seeds.forEach(function (z) {
        var x = sx * z[0], y = sy * (rho * z[0] + Math.sqrt(1 - rho * rho) * z[1]);
        svg.appendChild(svgEl('circle', { cx: CX + x * U, cy: CY - y * U, r: '2', fill: 'var(--ink-mute,#999)', 'fill-opacity': '0.6' }));
      });
      var a1 = Math.sqrt(l1) * U * 2, a2 = Math.sqrt(l2) * U * 2;   // 轴长约等于标准差
      svg.appendChild(svgEl('line', { x1: CX - v1[0] * a1, y1: CY + v1[1] * a1, x2: CX + v1[0] * a1, y2: CY - v1[1] * a1, stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '3' }));
      svg.appendChild(svgEl('line', { x1: CX - v2[0] * a2, y1: CY + v2[1] * a2, x2: CX + v2[0] * a2, y2: CY - v2[1] * a2, stroke: 'var(--warn,#b8870f)', 'stroke-width': '2.5' }));
      num.innerHTML = pct.toFixed(1) + ' <small>% variance on PC1</small>';
      meta.textContent = 'principal variances λ₁ = ' + l1.toFixed(2) + ', λ₂ = ' + l2.toFixed(2) + '  ·  蓝色 = PC1（分散最大），橙色 = PC2';
      formula.textContent = 'PCs are eigenvectors of the covariance Σ  ·  eigenvalues λ = variance explained along each axis';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'rho', '相关系数 ρ', -0.95, 0.95, 0.05),
      slider(state, 'scale', 'x 分散度', 0.6, 2.2, 0.05)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['PCA AXES']), el('span', {}, ['拖动相关性'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['PCA 会找到 covariance Matrix 的 eigenvectors。蓝色轴（PC1）指向分散度最大的方向；橙色轴（PC2）与它垂直，并捕获剩余部分。eigenvalues 是各轴方向上的方差，因此随着点云变得更拉长、更相关，PC1 上解释的 variance 会上升。'])
    ]));
    state._render();
  }

  // ── fourier-synthesis: 谐波求和，逐渐逼近方波/锯齿波 ───────────────────
  function fourierSynthesis(host) {
    var state = { a1: 100, a2: 0, a3: 33, a4: 0 };
    var W = 520, H = 220, PAD = 24;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function px(t) { return PAD + t * (W - 2 * PAD); }                 // t 在一个周期内位于 [0,1]
    function py(v) { return H / 2 - v * (H / 2 - PAD) / 1.4; }
    state._render = function () {
      var amp = [state.a1 / 100, state.a2 / 100, state.a3 / 100, state.a4 / 100];
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(0), x2: W - PAD, y2: py(0), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      var k;
      for (k = 0; k < 4; k++) {                                        // 淡色的单个谐波
        if (amp[k] === 0) continue;
        var dk = '', i; for (i = 0; i <= 200; i++) { var t = i / 200; dk += (i ? 'L' : 'M') + px(t).toFixed(1) + ' ' + py(amp[k] * Math.sin(2 * Math.PI * (2 * k + 1) * t)).toFixed(1) + ' '; }
        svg.appendChild(svgEl('path', { d: dk, fill: 'none', stroke: 'var(--ink-mute,#999)', 'stroke-width': '1', opacity: '0.4' }));
      }
      var d = '', i2; for (i2 = 0; i2 <= 240; i2++) {                  // 求和后的波形
        var tt = i2 / 240, v = 0, kk;
        for (kk = 0; kk < 4; kk++) v += amp[kk] * Math.sin(2 * Math.PI * (2 * kk + 1) * tt);
        d += (i2 ? 'L' : 'M') + px(tt).toFixed(1) + ' ' + py(v).toFixed(1) + ' ';
      }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      var square = Math.abs(state.a1 - 100) < 12 && Math.abs(state.a2) < 12 && state.a3 > 20 && Math.abs(state.a4) < 12;
      meta.textContent = '1f、3f、5f、7f 处的谐波  ·  振幅 ' + amp.map(function (a) { return a.toFixed(2); }).join(', ') + (square ? '  ·  奇次谐波 1, 1/3, 1/5 构造方波' : '');
      formula.textContent = 'f(t) = Σ aₖ sin(2π(2k+1)t)   ·   any periodic signal is a sum of sines';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'a1', '振幅 · 第 1 谐波', 0, 100, 1),
      slider(state, 'a2', '振幅 · 第 3 谐波', 0, 100, 1),
      slider(state, 'a3', '振幅 · 第 5 谐波', 0, 100, 1),
      slider(state, 'a4', '振幅 · 第 7 谐波', 0, 100, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['FOURIER SYNTHESIS']), el('span', {}, ['添加谐波'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['每个周期信号都是基频整数倍处正弦波的和。淡灰色曲线是各个奇次谐波；蓝色曲线是它们的和。把它们设置为满幅的 1、1/3、1/5、1/7，求和结果会开始变得像方波，这是用 Fourier series 逼近方波的经典方式。'])
    ]));
    state._render();
  }

  // ── convex-vs-nonconvex: 碗形与崎岖地形，descent 会被卡住 ───────────────
  function convexVsNonconvex(host) {
    var state = { kind: 'convex', x0: -2.6 };
    var W = 520, H = 230, PAD = 30, XR = 3;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function f(x) { return state.kind === 'convex' ? 0.5 * x * x : 0.18 * x * x + Math.sin(3 * x); }
    function df(x) { return state.kind === 'convex' ? x : 0.36 * x + 3 * Math.cos(3 * x); }
    var YMAX = 4.5;
    function px(x) { return PAD + (x + XR) / (2 * XR) * (W - 2 * PAD); }
    function py(y) { return H - PAD - (y + 1.5) / YMAX * (H - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var d = '', i, x; for (i = 0; i <= 180; i++) { x = -XR + 2 * XR * i / 180; d += (i ? 'L' : 'M') + px(x).toFixed(1) + ' ' + py(f(x)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      var xc = state.x0, t, pts = [];                          // 从所选起点进行 Gradient Descent
      for (t = 0; t < 80; t++) { pts.push(xc); xc = xc - 0.08 * df(xc); xc = LF.clamp(xc, -XR, XR); }
      pts.forEach(function (xi, idx) { if (idx % 4 === 0) svg.appendChild(svgEl('circle', { cx: px(xi), cy: py(f(xi)), r: '2.5', fill: 'var(--ink-mute,#999)' })); });
      var end = pts[pts.length - 1];
      svg.appendChild(svgEl('circle', { cx: px(end), cy: py(f(end)), r: '5', fill: 'var(--warn,#b8870f)' }));
      var atGlobal = state.kind === 'convex' || Math.abs(end) < 0.6;
      num.innerHTML = atGlobal ? '全局最小值' : '卡住：局部最小值';
      meta.textContent = '落在 x = ' + end.toFixed(2) + '  ·  ' + (state.kind === 'convex' ? '一个谷底：任何起点都会到达底部' : '多个谷底：起点决定你会落入哪一个');
      formula.textContent = state.kind === 'convex' ? 'f(x) = ½x²   ·   one minimum, every descent path converges there' : 'f(x) = 0.18x² + sin(3x)   ·   several local minima trap descent';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      select(state, 'kind', '地形', [['convex 碗形', 'convex'], ['non-convex（崎岖）', 'nonconvex']]),
      slider(state, 'x0', '起点 x', -2.9, 2.9, 0.1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['CONVEX VS NON-CONVEX']), el('span', {}, ['切换地形'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['convex 碗形只有一个最小值，所以 Gradient Descent 可以从任何起点到达它。non-convex 地形有多个谷底：灰色轨迹会顺坡滚入最近的那一个，橙色点可能停在并非全局最优的局部最小值。拖动起点，观察不同盆地如何捕获路径。'])
    ]));
    state._render();
  }

  LF.register({
    'vector-projection': vectorProjection,
    'matrix-transform': matrixTransform,
    'eigen-directions': eigenDirections,
    'derivative-tangent': derivativeTangent,
    'chain-rule': chainRule,
    'gaussian-pdf': gaussianPdf,
    'bayes-update': bayesUpdate,
    'entropy-kl': entropyKl,
    'pca-axes': pcaAxes,
    'fourier-synthesis': fourierSynthesis,
    'convex-vs-nonconvex': convexVsNonconvex
  });
})();
