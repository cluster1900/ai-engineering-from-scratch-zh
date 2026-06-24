/* figures-dl.js — Phase 3（Deep Learning core）的交互式课程图示。
   在 lesson-figures.js 之后加载；通过 LF.register 注册九个 widget。
   无依赖，仅 ES5，通过 CSS vars 使用主题。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl, slider = LF.slider, select = LF.select, clamp = LF.clamp;

  // ── perceptron-boundary：拖动 weights，移动 decision line ──────────
  function perceptronBoundary(host) {
    // 两个线性可分的 clusters（确定性，data space 中的 x,y 在 [-3,3]）。
    var pos = [[1.4, 1.2], [2.0, 0.6], [1.0, 2.1], [2.4, 1.7], [0.7, 1.0], [1.8, 2.4]];
    var neg = [[-1.3, -1.0], [-2.0, -0.5], [-0.8, -1.8], [-2.3, -1.6], [-0.6, -0.7], [-1.7, -2.2]];
    var state = { w1: 1, w2: 1, b: 0 };
    var W = 520, H = 230, PAD = 28, RNG = 3;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function px(x) { return PAD + (x + RNG) / (2 * RNG) * (W - 2 * PAD); }
    function py(y) { return H - PAD - (y + RNG) / (2 * RNG) * (H - 2 * PAD); }
    function score(p) { return state.w1 * p[0] + state.w2 * p[1] + state.b; }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      // 坐标轴
      svg.appendChild(svgEl('line', { x1: px(-RNG), y1: py(0), x2: px(RNG), y2: py(0), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('line', { x1: px(0), y1: py(-RNG), x2: px(0), y2: py(RNG), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      // decision line w1 x + w2 y + b = 0 → y = -(w1 x + b)/w2（或垂直线）
      if (Math.abs(state.w2) > 1e-6) {
        var xa = -RNG, xb = RNG;
        var ya = -(state.w1 * xa + state.b) / state.w2;
        var yb = -(state.w1 * xb + state.b) / state.w2;
        svg.appendChild(svgEl('line', { x1: px(xa), y1: py(ya), x2: px(xb), y2: py(yb), stroke: 'var(--warn,#b8870f)', 'stroke-width': '2' }));
      } else if (Math.abs(state.w1) > 1e-6) {
        var xv = -state.b / state.w1;
        svg.appendChild(svgEl('line', { x1: px(xv), y1: py(-RNG), x2: px(xv), y2: py(RNG), stroke: 'var(--warn,#b8870f)', 'stroke-width': '2' }));
      }
      var miss = 0;
      pos.forEach(function (p) {
        var ok = score(p) > 0;
        if (!ok) miss++;
        svg.appendChild(svgEl('circle', { cx: px(p[0]), cy: py(p[1]), r: '5', fill: ok ? 'var(--blueprint,#3553ff)' : 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      });
      neg.forEach(function (p) {
        var ok = score(p) < 0;
        if (!ok) miss++;
        svg.appendChild(svgEl('rect', { x: px(p[0]) - 4, y: py(p[1]) - 4, width: '8', height: '8', fill: ok ? 'var(--ink-mute,#999)' : 'none', stroke: 'var(--ink-mute,#999)', 'stroke-width': '2' }));
      });
      var total = pos.length + neg.length;
      status.innerHTML = miss + ' <small>/ ' + total + ' 误分类</small>';
      meta.textContent = miss === 0 ? '所有点都正确：这条线分开了两个 classes' : '实心 = 正确，空心 = 位于 line 的错误一侧';
      formula.textContent = '当  ' + state.w1.toFixed(1) + '·x + ' + state.w2.toFixed(1) + '·y + (' + state.b.toFixed(1) + ') > 0 时预测 +';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'w1', 'weight w1', -3, 3, 0.1),
      slider(state, 'w2', 'weight w2', -3, 3, 0.1),
      slider(state, 'b', 'bias b', -3, 3, 0.1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['PERCEPTRON BOUNDARY']), el('span', {}, ['拖动 weights'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['Perceptron 通过 w·x + b 的符号进行预测，因此它的 decision surface 是一条直线。拖动 weights 和 bias 来旋转并平移这条线，直到每个蓝色圆点都位于正侧，每个灰色方块都位于负侧。'])
    ]));
    state._render();
  }

  // ── mlp-forward：拖动 inputs，观察一个 2-3-1 net 触发 ───────────────────
  function mlpForward(host) {
    // 固定 weights：W1 是 3x2，b1 长度为 3；w2 长度为 3，b2 是 scalar。tanh hidden + output。
    var W1 = [[1.2, -0.8], [-0.5, 1.4], [0.9, 0.7]], b1 = [0.1, -0.2, 0.0];
    var w2 = [1.1, -1.3, 0.8], b2 = 0.2;
    var state = { x1: 0.6, x2: -0.4 };
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function tanh(z) { var e = Math.exp(2 * z); return (e - 1) / (e + 1); }
    function actFill(a) { // a 在 [-1,1] → +1 时为 blueprint，-1 时为 bg
      var t = (a + 1) / 2;
      return 'rgba(53,83,255,' + (0.12 + 0.78 * t).toFixed(3) + ')';
    }
    var inX = 90, hidX = 260, outX = 430;
    var inY = [80, 150], hidY = [55, 115, 175], outY = 115;
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var x = [state.x1, state.x2];
      var h = [0, 0, 0], j, i;
      for (j = 0; j < 3; j++) { var z = b1[j]; for (i = 0; i < 2; i++) z += W1[j][i] * x[i]; h[j] = tanh(z); }
      var zo = b2; for (j = 0; j < 3; j++) zo += w2[j] * h[j];
      var out = tanh(zo);
      // input→hidden 的 edges
      for (j = 0; j < 3; j++) for (i = 0; i < 2; i++) {
        var wgt = W1[j][i];
        svg.appendChild(svgEl('line', { x1: inX, y1: inY[i], x2: hidX, y2: hidY[j], stroke: wgt >= 0 ? 'var(--blueprint,#3553ff)' : 'var(--warn,#b8870f)', 'stroke-width': (0.4 + Math.abs(wgt)).toFixed(2), opacity: '0.45' }));
      }
      // hidden→output 的 edges
      for (j = 0; j < 3; j++) {
        svg.appendChild(svgEl('line', { x1: hidX, y1: hidY[j], x2: outX, y2: outY, stroke: w2[j] >= 0 ? 'var(--blueprint,#3553ff)' : 'var(--warn,#b8870f)', 'stroke-width': (0.4 + Math.abs(w2[j])).toFixed(2), opacity: '0.45' }));
      }
      // nodes：input（原始值，为 fill cue 缩放到 [-1,1]）、hidden、output
      [0, 1].forEach(function (i2) {
        svg.appendChild(svgEl('circle', { cx: inX, cy: inY[i2], r: '15', fill: actFill(clamp(x[i2], -1, 1)), stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.2' }));
      });
      h.forEach(function (hv, j2) {
        svg.appendChild(svgEl('circle', { cx: hidX, cy: hidY[j2], r: '15', fill: actFill(hv), stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.2' }));
      });
      svg.appendChild(svgEl('circle', { cx: outX, cy: outY, r: '18', fill: actFill(out), stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      num.innerHTML = out.toFixed(3) + ' <small>output</small>';
      meta.textContent = 'hidden = [' + h.map(function (v) { return v.toFixed(2); }).join(', ') + ']  ·  节点越深 = activation 越强';
      formula.textContent = 'h = tanh(W₁x + b₁),  y = tanh(w₂·h + b₂)';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'x1', 'input x1', -2, 2, 0.05),
      slider(state, 'x2', 'input x2', -2, 2, 0.05)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['MLP FORWARD PASS']), el('span', {}, ['拖动两个 inputs'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['两个 inputs 通过固定 weights 输入三个 hidden units，每个都经 tanh 压缩，然后组合成一个 output。蓝色 edges 是 positive weights，金色是 negative；节点阴影显示你设置的 inputs 使每个 unit 触发的强度。'])
    ]));
    state._render();
  }

  // ── backprop-vanishing：跨 depth 的 activation derivatives 乘积 ─────
  function backpropVanishing(host) {
    var state = { act: 'sigmoid', depth: 10 };
    var W = 520, H = 220, PAD = 34;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // 代表性的每层 derivative magnitude（典型 mid-activation regime）
    function dPerLayer() {
      if (state.act === 'sigmoid') return 0.25;   // max sigmoid'(x) = 0.25
      if (state.act === 'tanh') return 0.42;       // 远离 0 时的典型 |tanh'|
      return 1.0;                                  // active units 的 relu derivative = 1
    }
    function px(layer) { return PAD + (state.depth <= 1 ? 0 : (layer / (state.depth)) * (W - 2 * PAD)); }
    function py(logmag) { // logmag 在 [-9, 0] → bottom..top
      var t = clamp((logmag + 9) / 9, 0, 1);
      return H - PAD - t * (H - 2 * PAD);
    }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(0), x2: W - PAD, y2: py(0), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      var per = dPerLayer(), mag = 1, d = '', l;
      var lastLog = 0;
      for (l = 0; l <= state.depth; l++) {
        var lg = l * Math.log(per) / Math.LN10; // l layers 之后 mag 的 log10
        lastLog = lg;
        d += (l ? 'L' : 'M') + px(l).toFixed(1) + ' ' + py(lg).toFixed(1) + ' ';
      }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      for (l = 0; l <= state.depth; l += Math.max(1, Math.round(state.depth / 10))) {
        svg.appendChild(svgEl('circle', { cx: px(l), cy: py(l * Math.log(per) / Math.LN10), r: '2.5', fill: 'var(--blueprint,#3553ff)' }));
      }
      mag = Math.pow(per, state.depth);
      status.innerHTML = mag < 1e-4 ? '≈ ' + mag.toExponential(1) + ' <small>gradient</small>' : mag.toFixed(4) + ' <small>gradient</small>';
      var verdict = state.act === 'relu' ? 'stable：derivative 保持为 1，Gradient 可以穿过 depth'
        : (mag < 1e-3 ? 'vanished：Gradient 太小，无法训练早期 layers' : '随 depth 缩小');
      meta.textContent = '每层因子 ' + per.toFixed(2) + '  ·  经过 ' + state.depth + ' layers  ·  ' + verdict;
      formula.textContent = '∂L/∂early ∝ Π σ′(zₗ) ≈ (' + per.toFixed(2) + ')^depth   (log scale)';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      select(state, 'act', 'activation', [['sigmoid', 'sigmoid'], ['tanh', 'tanh'], ['relu', 'relu']]),
      slider(state, 'depth', 'depth (layers)', 2, 20, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['VANISHING GRADIENTS']), el('span', {}, ['选择 activation，拖动 depth'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['Backprop 会在每层乘上一个 activation derivative。Sigmoid 将该 derivative 上限限制在 0.25，tanh 保持低于 1，因此在 deep nets 中乘积会塌缩到接近 0（注意 log axis）。ReLU 对 active units 保持 derivative 为 1，这就是它让 deep training 变得可行的原因。'])
    ]));
    state._render();
  }

  // ── optimizer-trajectory：ill-conditioned bowl 上的 SGD vs Momentum vs Adam
  function optimizerTrajectory(host) {
    var state = { opt: 'momentum', lr: 0.08 };
    var W = 520, H = 230, PAD = 26, STEPS = 30;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // f(x,y) = 0.5*(a x^2 + b y^2)，ravine：a 小、b 大 → ill-conditioned
    var A = 1.0, B = 20.0, X0 = -2.6, Y0 = 0.9;
    var RX = 3, RY = 1.2;
    function px(x) { return PAD + (x + RX) / (2 * RX) * (W - 2 * PAD); }
    function py(y) { return H / 2 - (y / RY) * (H / 2 - PAD); }
    function run() {
      var x = X0, y = Y0, pts = [[x, y]];
      var beta = 0.9, vx = 0, vy = 0;          // momentum / adam first moment
      var b2 = 0.999, sx = 0, sy = 0, t = 0;   // adam second moment
      var eps = 1e-8;
      for (var s = 0; s < STEPS; s++) {
        var gx = A * x, gy = B * y;
        if (state.opt === 'sgd') {
          x -= state.lr * gx; y -= state.lr * gy;
        } else if (state.opt === 'momentum') {
          vx = beta * vx + gx; vy = beta * vy + gy;
          x -= state.lr * vx; y -= state.lr * vy;
        } else { // adam
          t++;
          vx = beta * vx + (1 - beta) * gx; vy = beta * vy + (1 - beta) * gy;
          sx = b2 * sx + (1 - b2) * gx * gx; sy = b2 * sy + (1 - b2) * gy * gy;
          var mhx = vx / (1 - Math.pow(beta, t)), mhy = vy / (1 - Math.pow(beta, t));
          var shx = sx / (1 - Math.pow(b2, t)), shy = sy / (1 - Math.pow(b2, t));
          x -= state.lr * 8 * mhx / (Math.sqrt(shx) + eps);
          y -= state.lr * 8 * mhy / (Math.sqrt(shy) + eps);
        }
        if (!isFinite(x) || !isFinite(y) || Math.abs(x) > RX || Math.abs(y) > RY) { pts.push([clamp(x, -RX, RX), clamp(y, -RY, RY)]); break; }
        pts.push([x, y]);
      }
      return pts;
    }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      // ravine contours（ellipses）
      [0.3, 0.7, 1.2].forEach(function (lvl) {
        svg.appendChild(svgEl('ellipse', { cx: px(0), cy: py(0), rx: (px(Math.sqrt(2 * lvl / A)) - px(0)).toFixed(1), ry: (py(0) - py(Math.sqrt(2 * lvl / B))).toFixed(1), fill: 'none', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
      });
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(0), x2: W - PAD, y2: py(0), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      var pts = run(), d = '';
      pts.forEach(function (p, i) { d += (i ? 'L' : 'M') + px(p[0]).toFixed(1) + ' ' + py(p[1]).toFixed(1) + ' '; });
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.6' }));
      pts.forEach(function (p, i) { if (i % 2 === 0 || i === pts.length - 1) svg.appendChild(svgEl('circle', { cx: px(p[0]), cy: py(p[1]), r: i === pts.length - 1 ? '5' : '2.4', fill: 'var(--blueprint,#3553ff)' })); });
      svg.appendChild(svgEl('circle', { cx: px(0), cy: py(0), r: '3', fill: 'var(--warn,#b8870f)' }));
      var last = pts[pts.length - 1];
      var dist = Math.sqrt(last[0] * last[0] + last[1] * last[1]);
      status.innerHTML = '‖θ − θ*‖ = ' + dist.toFixed(3);
      meta.textContent = '金色点是 minimum  ·  ' + (state.opt === 'sgd' ? 'plain SGD 在陡峭的 ravine 壁面间 zig-zag' : state.opt === 'momentum' ? 'Momentum 平均掉 zig-zag，并沿 valley 下滚' : 'Adam 对每个 axis 重新缩放，因此 steep 和 flat directions 会一起推进');
      formula.textContent = 'f(x,y) = ½(x² + 20y²)   condition number 20  ·  ' + STEPS + ' 步';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      select(state, 'opt', 'optimizer', [['SGD', 'sgd'], ['Momentum', 'momentum'], ['Adam', 'adam']]),
      slider(state, 'lr', 'learning rate', 0.01, 0.18, 0.005)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['OPTIMIZER TRAJECTORY']), el('span', {}, ['选择 optimizer，拖动 lr'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['Loss 是一条狭窄的 ravine：沿 x 平缓，沿 y 陡峭二十倍。Plain SGD 在陡峭壁面间反弹，并沿 valley 缓慢爬行。Momentum 平滑反弹；Adam 归一化每个 direction，使两个 axes 以相近 rate converge。'])
    ]));
    state._render();
  }

  // ── weight-init-variance：三种 schemes 的 activation std 随 depth 变化 ────
  function weightInitVariance(host) {
    var state = { scheme: 'xavier', fanin: 256 };
    var L = 10;
    var W = 520, H = 220, PAD = 34;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // linear/tanh stack 的 Variance recursion：var_out = n * w_var * var_in。
    // gain g = n * w_var。naive：w_var = 1（g = n，爆炸）。xavier：w_var=1/n（g≈1）。
    // he：w_var=2/n 且 relu 减半 → effective g≈1。
    function gain() {
      var n = state.fanin;
      if (state.scheme === 'naive') return n * 1.0 / 50;        // 缩放后便于看见增长
      if (state.scheme === 'xavier') return n * (1.0 / n);      // = 1
      return 0.5 * n * (2.0 / n);                               // he with relu halving = 1
    }
    function px(l) { return PAD + l / L * (W - 2 * PAD); }
    function py(logstd) { // log10(std) 在 [-4,4]
      var t = clamp((logstd + 4) / 8, 0, 1);
      return H - PAD - t * (H - 2 * PAD);
    }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(0), x2: W - PAD, y2: py(0), stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      var g = gain(), varc = 1, d = '', l, lastStd = 1;
      for (l = 0; l <= L; l++) {
        var std = Math.sqrt(varc);
        lastStd = std;
        d += (l ? 'L' : 'M') + px(l).toFixed(1) + ' ' + py(Math.log(std) / Math.LN10).toFixed(1) + ' ';
        varc *= g;
      }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      for (l = 0; l <= L; l++) { var v = Math.pow(g, l); svg.appendChild(svgEl('circle', { cx: px(l), cy: py(Math.log(Math.sqrt(v)) / Math.LN10), r: '2.6', fill: 'var(--blueprint,#3553ff)' })); }
      status.innerHTML = lastStd < 1e-3 ? '≈ ' + lastStd.toExponential(1) + ' <small>std @ L10</small>' : lastStd.toFixed(lastStd < 10 ? 2 : 0) + ' <small>std @ L10</small>';
      var verdict = state.scheme === 'naive' ? 'exploding：activations 逐层放大失控'
        : 'stable：variance 在所有十层中保持接近 1';
      meta.textContent = '每层 gain ' + g.toFixed(2) + '  ·  ' + verdict;
      formula.textContent = state.scheme === 'naive' ? 'Var = 1（过大）  →  gain = n·Var 随 width 增长'
        : state.scheme === 'xavier' ? 'Var(w) = 1/n  →  gain ≈ 1' : 'Var(w) = 2/n  →  ReLU 后 gain ≈ 1';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      select(state, 'scheme', 'init scheme', [['naive (large)', 'naive'], ['Xavier / Glorot', 'xavier'], ['He / Kaiming', 'he']]),
      slider(state, 'fanin', 'fan-in n', 64, 1024, 64)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['WEIGHT INIT VARIANCE']), el('span', {}, ['选择一个 scheme'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['每一层都会将 activation variance 乘以 n·Var(w) 的 gain。Naive large weights 让该 gain 随 width 增长，因此 activations 会爆炸（log axis）。Xavier 设置 Var(w)=1/n，He 为 ReLU 设置 2/n，二者都把 gain 保持在接近 1，使 signal magnitude 在 depth 上保持平稳。'])
    ]));
    state._render();
  }

  // ── dropout-mask：拖动 p，丢弃确定比例的 units ───────────
  function dropoutMask(host) {
    var state = { p: 0.3 };
    var N = 24;
    var W = 520, H = 200, COLS = 8, PAD = 24;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var rows = Math.ceil(N / COLS);
      var cw = (W - 2 * PAD) / COLS, ch = (H - 2 * PAD) / rows;
      var r = Math.min(cw, ch) / 2 - 5;
      var dropped = 0, i;
      var nDrop = Math.round(state.p * N);
      var dropSet = {};
      for (i = 0; i < nDrop; i++) { dropSet[Math.floor((i + 0.5) * N / Math.max(1, nDrop))] = true; }
      for (i = 0; i < N; i++) {
        var col = i % COLS, row = Math.floor(i / COLS);
        var cx = PAD + col * cw + cw / 2, cy = PAD + row * ch + ch / 2;
        var off = !!dropSet[i];
        if (off) dropped++;
        svg.appendChild(svgEl('circle', { cx: cx.toFixed(1), cy: cy.toFixed(1), r: r.toFixed(1), fill: off ? 'var(--rule-soft,#ddd)' : 'var(--blueprint,#3553ff)', stroke: off ? 'var(--rule-soft,#ccc)' : 'var(--blueprint,#3553ff)', 'stroke-width': '1', opacity: off ? '0.45' : '1' }));
      }
      var scale = 1 / (1 - Math.min(0.95, state.p));
      status.innerHTML = dropped + ' <small>/ ' + N + ' 已丢弃</small>';
      meta.textContent = '保留的 units 按 1/(1−p) = ' + scale.toFixed(2) + ' 缩放，因此 expected sum 不变';
      formula.textContent = '以 prob p = ' + state.p.toFixed(2) + ' drop 每个 unit，然后将 survivors 除以 (1 − p)';
    };
    var grid = el('div', {}, [slider(state, 'p', 'dropout rate p', 0, 0.9, 0.05)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['DROPOUT MASK']), el('span', {}, ['拖动 rate'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['Dropout 在每一步将比例 p 的 units 置零，使 network 不能依赖任何单个 unit。因为只有 survivors 传递 signal，它们会按 1/(1−p) 放大，以保持 expected activation 相同；test time 使用完整 layer，不做 scaling。'])
    ]));
    state._render();
  }

  // ── batchnorm-effect：移动 input，观察 BN 重新居中 ───────────────
  function batchnormEffect(host) {
    var state = { shift: 1.4, scaleIn: 1.8 };
    var W = 520, H = 220, PAD = 30;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var RNG = 6;
    function px(x) { return PAD + (x + RNG) / (2 * RNG) * (W - 2 * PAD); }
    function py(v, peak) { return H - PAD - (v / peak) * (H - 2 * PAD); }
    function gauss(x, mu, sd) { return Math.exp(-0.5 * Math.pow((x - mu) / sd, 2)); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: px(0), y1: PAD, x2: px(0), y2: H - PAD, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      var muIn = state.shift, sdIn = Math.max(0.2, state.scaleIn);
      var i, d1 = '', d2 = '';
      // pre-activation distribution（已 shift 和 scale）
      for (i = 0; i <= 140; i++) { var x = -RNG + 2 * RNG * i / 140; d1 += (i ? 'L' : 'M') + px(x).toFixed(1) + ' ' + py(gauss(x, muIn, sdIn), 1).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d1, fill: 'none', stroke: 'var(--ink-mute,#999)', 'stroke-width': '2' }));
      // BN 之后：zero mean，unit variance
      for (i = 0; i <= 140; i++) { var x2 = -RNG + 2 * RNG * i / 140; d2 += (i ? 'L' : 'M') + px(x2).toFixed(1) + ' ' + py(gauss(x2, 0, 1), 1).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d2, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      status.innerHTML = 'μ ' + muIn.toFixed(2) + ' → 0 <small>· σ ' + sdIn.toFixed(2) + ' → 1</small>';
      meta.textContent = '灰色是原始 pre-activation，蓝色是 batch norm 之后  ·  每个 batch 都会重新居中并重新缩放';
      formula.textContent = 'x̂ = (x − μ_B) / √(σ²_B + ε),  then  y = γ·x̂ + β';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'shift', 'input mean shift', -3, 3, 0.1),
      slider(state, 'scaleIn', 'input spread σ', 0.3, 3, 0.1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['BATCH NORM']), el('span', {}, ['拖动 input shift'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['下层送上的 mean 和 spread（灰色）无论如何，batch norm 都会减去 batch mean 并除以 batch standard deviation，把 distribution 拉回 zero mean 和 unit variance（蓝色）。Learnable γ 和 β 再让 network 在不同 scale 有用时重新拉伸它。'])
    ]));
    state._render();
  }

  // ── learning-curves：capacity vs train/val loss，标记 early stopping ───────
  function learningCurves(host) {
    var state = { cap: 6 };
    var W = 520, H = 230, PAD = 34, CMAX = 14;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // train 单调下降；val 是 U-shaped（bias term 下降，variance term 上升）
    function train(c) { return 0.3 + 4.5 / (c + 0.5); }
    function val(c) { return 4.5 / (c + 0.5) + 0.11 * c + 0.45; }
    var best = 1, bv = 1e9, c;
    for (c = 1; c <= CMAX; c++) { if (val(c) < bv) { bv = val(c); best = c; } }
    var YMAX = Math.max(val(1), train(1), val(CMAX)) + 0.4;
    function px(c2) { return PAD + (c2 - 1) / (CMAX - 1) * (W - 2 * PAD); }
    function py(y) { return H - PAD - (y / YMAX) * (H - 2 * PAD); }
    function curve(fn, stroke) { var d = '', i; for (i = 0; i <= 80; i++) { var x = 1 + (CMAX - 1) * i / 80; d += (i ? 'L' : 'M') + px(x).toFixed(1) + ' ' + py(fn(x)).toFixed(1) + ' '; } return svgEl('path', { d: d, fill: 'none', stroke: stroke, 'stroke-width': '2' }); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: px(best), y1: PAD, x2: px(best), y2: H - PAD, stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5', 'stroke-dasharray': '4 3' }));
      svg.appendChild(curve(train, 'var(--ink-mute,#999)'));
      svg.appendChild(curve(val, 'var(--blueprint,#3553ff)'));
      svg.appendChild(svgEl('circle', { cx: px(state.cap), cy: py(val(state.cap)), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      svg.appendChild(svgEl('circle', { cx: px(state.cap), cy: py(train(state.cap)), r: '4', fill: 'var(--ink-mute,#999)' }));
      var gap = val(state.cap) - train(state.cap);
      status.innerHTML = 'gap ' + gap.toFixed(2) + ' <small>· ' + (state.cap < best ? 'underfit' : state.cap > best ? 'overfit' : 'best') + '</small>';
      meta.textContent = 'train ' + train(state.cap).toFixed(2) + '  ·  val ' + val(state.cap).toFixed(2) + '  ·  在 capacity ' + best + ' early stop（金线）';
      formula.textContent = 'train loss 随 capacity 下降；val loss 呈 U-shaped；在 val 触底处 stop';
    };
    var grid = el('div', {}, [slider(state, 'cap', 'model capacity / epochs', 1, CMAX, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['LEARNING CURVES']), el('span', {}, ['拖动 capacity'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['灰色是 training loss，蓝色是 validation loss。更高 capacity 总能降低 training loss，但 validation loss 会先触底，随后在 model 开始记忆噪声时上升。不断扩大的 gap 是 overfit 信号；金线标记 early stopping 会冻结 model 的位置。'])
    ]));
    state._render();
  }

  // ── gradient-clipping：通过 cap norm 驯服 exploding update ────────
  function gradientClipping(host) {
    var state = { thresh: 1.0, norm: 4.0 };
    var W = 520, H = 200, PAD = 32, GMAX = 8;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var bar = el('i');
    var barWrap = el('div', { class: 'lf-bar' }, [bar]);
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function px(g) { return PAD + g / GMAX * (W - 2 * PAD); }
    function py(g) { return H - PAD - g / GMAX * (H - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      // identity line y = x（threshold 之前的 clipped output）
      svg.appendChild(svgEl('line', { x1: px(0), y1: py(0), x2: px(GMAX), y2: py(GMAX), stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      // clip response：out = min(g, thresh)
      var t = state.thresh;
      var d = 'M' + px(0) + ' ' + py(0) + ' L' + px(t) + ' ' + py(t) + ' L' + px(GMAX) + ' ' + py(t);
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      // threshold marker
      svg.appendChild(svgEl('line', { x1: px(t), y1: PAD, x2: px(t), y2: H - PAD, stroke: 'var(--warn,#b8870f)', 'stroke-width': '1', 'stroke-dasharray': '2 3' }));
      var clipped = Math.min(state.norm, t);
      var raw = state.norm;
      // 当前点
      svg.appendChild(svgEl('circle', { cx: px(raw), cy: py(clipped), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      var scale = raw > t ? t / raw : 1;
      status.innerHTML = clipped.toFixed(2) + ' <small>clipped norm</small>';
      bar.style.width = Math.min(100, clipped / GMAX * 100) + '%';
      barWrap.classList.toggle('over', raw > t);
      meta.textContent = raw > t ? 'exploding：raw norm ' + raw.toFixed(2) + ' 按 ' + scale.toFixed(2) + ' 缩放到 cap'
        : '在 budget 内：Gradient 原样通过';
      formula.textContent = 'if ‖g‖ > τ:  g ← g · τ / ‖g‖   →   clipped = min(‖g‖, τ) = min(' + raw.toFixed(1) + ', ' + t.toFixed(1) + ')';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'thresh', 'clip threshold τ', 0.2, 6, 0.1),
      slider(state, 'norm', 'raw gradient norm', 0.2, 8, 0.1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['GRADIENT CLIPPING']), el('span', {}, ['拖动 threshold 和 norm'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), barWrap, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['当 Gradient norm 突增时，单步更新可能会把 weights 推下悬崖。Clipping 会将任何 norm 超过 threshold τ 的 Gradient 重新缩放回 τ，保持 direction 但限制 magnitude。低于 τ 时 Gradient 不变；高于 τ 时 update 被约束为 min(‖g‖, τ)。'])
    ]));
    state._render();
  }

  LF.register({
    'perceptron-boundary': perceptronBoundary,
    'mlp-forward': mlpForward,
    'backprop-vanishing': backpropVanishing,
    'optimizer-trajectory': optimizerTrajectory,
    'weight-init-variance': weightInitVariance,
    'dropout-mask': dropoutMask,
    'batchnorm-effect': batchnormEffect,
    'learning-curves': learningCurves,
    'gradient-clipping': gradientClipping
  });
})();
