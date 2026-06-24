/* figures-math2.js - math foundations interactive widgets (phase 01)。
   在 lesson-figures.js 之后加载，并通过 window.LF 注册。原生 ES5，
   无依赖，通过 CSS vars 控制 theme。每个 widget 都确定性渲染。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl, slider = LF.slider, select = LF.select;
  var fmtInt = LF.fmtInt, clamp = LF.clamp;

  // ── svd-rank-reconstruction：保留 k 个 singular values，观察 energy 恢复 ──
  function svdRank(host) {
    // 一个固定的 8x8 pattern。它的 singular values 已内置（递减），因此
    // energy retained = sum(top-k sigma^2) / sum(all sigma^2) 是精确的。
    var sigma = [9.0, 5.4, 3.1, 1.8, 1.0, 0.55, 0.28, 0.12];
    var n = sigma.length;
    var total = 0, i;
    for (i = 0; i < n; i++) { total += sigma[i] * sigma[i]; }
    var state = { k: 2 };
    var W = 520, H = 230, PAD = 30, CELL = 18, GX = 360;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var bar = el('i');
    var barWrap = el('div', { class: 'lf-bar' }, [bar]);
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function cell(r, c) {
      // [0,1] 内的平滑、适合 low-rank 的 target intensity
      return 0.5 + 0.5 * Math.cos((r + c) * Math.PI / (n - 1));
    }
    state._render = function () {
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      var keep = state.k, energy = 0, j;
      for (j = 0; j < keep; j++) { energy += sigma[j] * sigma[j]; }
      var frac = energy / total;
      // reconstruction quality 随 retained energy 缩放：将 cell 向 grey 混合
      var r, c;
      for (r = 0; r < n; r++) {
        for (c = 0; c < n; c++) {
          var v = cell(r, c);
          var approx = 0.5 + (v - 0.5) * frac;
          var g = Math.round(clamp(approx, 0, 1) * 255);
          svg.appendChild(svgEl('rect', {
            x: PAD + c * CELL, y: PAD + r * CELL, width: CELL - 1, height: CELL - 1,
            fill: 'rgb(' + g + ',' + g + ',' + g + ')'
          }));
        }
      }
      // 右侧的 singular-value spectrum bars
      var maxS = sigma[0], bw = 14, sx = GX;
      for (j = 0; j < n; j++) {
        var bh = sigma[j] / maxS * 120;
        var on = j < keep;
        svg.appendChild(svgEl('rect', {
          x: sx + j * (bw + 4), y: PAD + 120 - bh, width: bw, height: bh,
          fill: on ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#ddd)'
        }));
      }
      num.innerHTML = (frac * 100).toFixed(1) + ' <small>% energy</small>';
      bar.style.width = (frac * 100).toFixed(1) + '%';
      meta.textContent = 'rank ' + keep + ' / ' + n + '  ·  存储 ' + (keep * (2 * n + 1)) +
        ' 个数字，而完整形式需要 ' + (n * n) + ' 个  ·  蓝色 bars 是保留的 singular values';
      formula.textContent = 'A_k = sum_{i<k} sigma_i u_i v_iT   ·   energy = sum top-k sigma^2 / sum all sigma^2';
    };
    var grid = el('div', {}, [slider(state, 'k', '保留的 singular values (k)', 1, n, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['SVD LOW-RANK']), el('span', {}, ['拖动 rank k'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), barWrap, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['保留最大的 k 个 singular values 会得到 Matrix 的最佳 rank-k approximation。最前面的少数项捕获了大部分 energy，因此 low rank 可以在存储少得多数字的同时，几乎精确地 reconstruct 这个 pattern。这就是 compression 和 low-rank adapters 背后的核心思想。'])
    ]));
    state._render();
  }

  // ── tensor-broadcast：两个 shape 的 trailing dims 是否对齐？ ──────────────────
  function tensorBroadcast(host) {
    var state = { a0: 8, a1: 1, a2: 3, b0: 1, b1: 4, b2: 3 };
    var rows = el('div', {});
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var a = [state.a0, state.a1, state.a2];
      var b = [state.b0, state.b1, state.b2];
      var out = [], ok = true, i, why = '';
      for (i = 0; i < 3; i++) {
        var x = a[i], y = b[i];
        if (x === y) { out.push(x); }
        else if (x === 1) { out.push(y); }
        else if (y === 1) { out.push(x); }
        else { ok = false; out.push('x'); if (!why) { why = 'dim ' + i + ': ' + x + ' vs ' + y + '（两者都不是 1）'; } }
      }
      while (rows.firstChild) { rows.removeChild(rows.firstChild); }
      function shapeRow(label, vals, hi) {
        var cells = [];
        vals.forEach(function (v, idx) {
          var stretched = hi && (a[idx] === 1 || b[idx] === 1) && a[idx] !== b[idx] && (label !== 'result');
          cells.push(el('span', {
            class: 'lf-formula',
            style: 'display:inline-block;min-width:34px;text-align:center;padding:4px 6px;margin:2px;border:1px solid var(--rule-soft,#ddd);color:' +
              (v === 'x' ? 'var(--warn,#b8870f)' : 'var(--ink,#1a1a1a)')
          }, [String(v)]));
        });
        return el('div', { style: 'display:flex;align-items:center;gap:8px;margin:4px 0' },
          [el('span', { class: 'lf-meta', style: 'min-width:62px' }, [label])].concat(cells));
      }
      rows.appendChild(shapeRow('shape A', a, true));
      rows.appendChild(shapeRow('shape B', b, true));
      rows.appendChild(shapeRow('result', out, false));
      status.innerHTML = ok ? '可 broadcast' : '不匹配';
      meta.textContent = ok ? 'result shape (' + out.join(', ') + ')  ·  1 会拉伸以匹配另一个维度'
        : '无法 broadcast  ·  ' + why;
      formula.textContent = '对齐 trailing dims；每一对必须相等，或其中一个为 1';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'a0', 'A dim 0', 1, 8, 1), slider(state, 'b0', 'B dim 0', 1, 8, 1),
      slider(state, 'a1', 'A dim 1', 1, 8, 1), slider(state, 'b1', 'B dim 1', 1, 8, 1),
      slider(state, 'a2', 'A dim 2', 1, 8, 1), slider(state, 'b2', 'B dim 2', 1, 8, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['BROADCASTING']), el('span', {}, ['拖动两个 shapes'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [rows, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['Broadcasting 让不同 shapes 的 arrays 可以在不复制数据的情况下组合。把 shapes 从右侧对齐；每一对 dimensions 必须相等，或者其中一个必须是 1 并被拉伸。其他任何冲突都是错误。这就是 bias Vector 能干净地加到整个 batch 上的原因。'])
    ]));
    state._render();
  }

  // ── logsumexp-stability：naive exp 会 overflow，max-subtraction 保持有限 ─
  function logsumexpStability(host) {
    var base = [1.0, 0.5, -0.3];
    var state = { big: 700 };
    var rows = el('div', {});
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var x = [state.big].concat(base);
      // naive: log(sum(exp(x)))  -- exp(710+) 在 float64 中会 overflow 到 Infinity
      var naiveSum = 0, i;
      for (i = 0; i < x.length; i++) { naiveSum += Math.exp(x[i]); }
      var naive = Math.log(naiveSum);
      // stable: m + log(sum(exp(x - m)))
      var m = x[0];
      for (i = 1; i < x.length; i++) { if (x[i] > m) { m = x[i]; } }
      var s = 0;
      for (i = 0; i < x.length; i++) { s += Math.exp(x[i] - m); }
      var stable = m + Math.log(s);
      var overflow = !isFinite(naive);
      while (rows.firstChild) { rows.removeChild(rows.firstChild); }
      function line(label, val, warn) {
        return el('div', { style: 'display:flex;justify-content:space-between;margin:4px 0' }, [
          el('span', { class: 'lf-meta' }, [label]),
          el('span', { class: 'lf-formula', style: 'color:' + (warn ? 'var(--warn,#b8870f)' : 'var(--blueprint,#3553ff)') },
            [isFinite(val) ? val.toFixed(4) : 'Infinity (overflow)'])
        ]);
      }
      rows.appendChild(line('naive log(sum exp x)', naive, overflow));
      rows.appendChild(line('stable m + log(sum exp(x-m))', stable, false));
      status.innerHTML = overflow ? 'naive 会 overflow' : '两者一致';
      meta.textContent = overflow
        ? 'exp(' + state.big + ') 超出 float64 范围（约 exp 709），因此 naive sum 是 Infinity；stable form 返回 ' + stable.toFixed(4)
        : '这两个 forms 在代数上等价，并且此处都是有限值（max = ' + m + '）';
      formula.textContent = 'logsumexp(x) = m + log( sum exp(x - m) ),  m = max(x)';
    };
    var grid = el('div', {}, [slider(state, 'big', '最大 logit value', 1, 1500, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['LOG-SUM-EXP']), el('span', {}, ['拖动 logit'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [rows, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['直接计算 log(sum(exp(x))) 时，只要任意 logit 超过约 709，exp 就会超出 float64 范围并 overflow。先减去最大值会把最大项平移到 exp(0) = 1，因此 sum 保持有限。结果完全相同，因为被减去的最大值会在 log 外部加回来。'])
    ]));
    state._render();
  }

  // ── norm-unit-balls：L1 diamond、L2 circle、Linf square；读取点的 norm ─
  function normUnitBalls(host) {
    var state = { which: 'l2', px: 0.6, py: 0.5 };
    var W = 260, H = 230, CX = 130, CY = 115, R = 90;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    function toX(u) { return CX + u * R; }
    function toY(v) { return CY - v * R; }
    state._render = function () {
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      // axes
      svg.appendChild(svgEl('line', { x1: toX(-1.3), y1: CY, x2: toX(1.3), y2: CY, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('line', { x1: CX, y1: toY(-1.3), x2: CX, y2: toY(1.3), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      // unit ball
      var shape;
      if (state.which === 'l1') {
        shape = svgEl('polygon', { points: [toX(1) + ',' + toY(0), toX(0) + ',' + toY(1), toX(-1) + ',' + toY(0), toX(0) + ',' + toY(-1)].join(' '), fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' });
      } else if (state.which === 'linf') {
        shape = svgEl('rect', { x: toX(-1), y: toY(1), width: 2 * R, height: 2 * R, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' });
      } else {
        shape = svgEl('circle', { cx: CX, cy: CY, r: R, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' });
      }
      svg.appendChild(shape);
      // 点及其 Vector
      svg.appendChild(svgEl('line', { x1: CX, y1: CY, x2: toX(state.px), y2: toY(state.py), stroke: 'var(--ink-mute,#999)', 'stroke-width': '1.5' }));
      svg.appendChild(svgEl('circle', { cx: toX(state.px), cy: toY(state.py), r: '5', fill: 'var(--warn,#b8870f)' }));
      var ax = Math.abs(state.px), ay = Math.abs(state.py);
      var norm = state.which === 'l1' ? ax + ay : state.which === 'linf' ? Math.max(ax, ay) : Math.sqrt(ax * ax + ay * ay);
      var nm = state.which === 'l1' ? 'L1' : state.which === 'linf' ? 'Linf' : 'L2';
      num.innerHTML = norm.toFixed(3) + ' <small>' + nm + ' norm</small>';
      var formula = state.which === 'l1' ? '|x| + |y|' : state.which === 'linf' ? 'max(|x|, |y|)' : 'sqrt(x^2 + y^2)';
      meta.textContent = nm + ' of (' + state.px.toFixed(2) + ', ' + state.py.toFixed(2) + ') = ' + formula + '  ·  轮廓线是所有 norm 为 1 的点';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      select(state, 'which', 'norm', [['L2 (Euclidean)', 'l2'], ['L1 (Manhattan)', 'l1'], ['Linf (max)', 'linf']]),
      slider(state, 'px', 'point x', -1.2, 1.2, 0.05),
      slider(state, 'py', 'point y', -1.2, 1.2, 0.05)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['NORM UNIT BALLS']), el('span', {}, ['选择一个 norm'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta])]),
      el('div', { class: 'lf-cap' }, ['norm 衡量长度，它的 unit ball 是所有长度为一的 Vector。L2 对平方求和并得到 circle；L1 对绝对值求和并得到 diamond；Linf 取最大坐标并得到 square。你选择的 norm 会改变“接近”的含义，这就是它会塑造 regularization 和 distance 的原因。'])
    ]));
    state._render();
  }

  // ── monte-carlo-pi：quarter circle 内部的比例用于估计 pi ────────
  function monteCarloPi(host) {
    var state = { n: 200 };
    var W = 230, H = 230, PAD = 14, S = 200;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // deterministic low-discrepancy points（使用 golden ratio conjugate 的 additive recurrence），
    // 因此该图每次渲染都相同。
    var g1 = 0.7548776662466927, g2 = 0.5698402909980532;
    state._render = function () {
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      svg.appendChild(svgEl('rect', { x: PAD, y: PAD, width: S, height: S, fill: 'none', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('path', { d: 'M ' + PAD + ' ' + PAD + ' A ' + S + ' ' + S + ' 0 0 1 ' + (PAD + S) + ' ' + (PAD + S), fill: 'none', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.5' }));
      var inside = 0, i;
      var px = 0.123, py = 0.456;
      for (i = 0; i < state.n; i++) {
        px = (px + g1) % 1; py = (py + g2) % 1;
        var hit = (px * px + py * py) <= 1;
        if (hit) { inside++; }
        if (state.n <= 1200) {
          svg.appendChild(svgEl('circle', {
            cx: PAD + px * S, cy: PAD + (1 - py) * S, r: '1.6',
            fill: hit ? 'var(--blueprint,#3553ff)' : 'var(--ink-mute,#bbb)'
          }));
        }
      }
      var est = 4 * inside / state.n;
      num.innerHTML = est.toFixed(4) + ' <small>~ pi</small>';
      meta.textContent = fmtInt(state.n) + ' 个点中有 ' + inside + ' 个在内部  ·  error ' + Math.abs(est - Math.PI).toFixed(4) + '  ·  按 1/sqrt(N) 收缩';
      formula.textContent = 'pi ~ 4 * (quarter circle 内的点数) / N   ·   true pi = 3.14159';
    };
    var grid = el('div', {}, [slider(state, 'n', 'samples N', 20, 5000, 20)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['MONTE CARLO PI']), el('span', {}, ['拖动 sample count'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['在 unit square 中散布点，并统计有多少落在 quarter circle 内。这个比例就是面积比 pi/4，因此乘以四即可估计 pi。更多 samples 会让估计更紧，但 error 只按 N 的平方根倒数下降，这是 Monte Carlo 的定义性成本。'])
    ]));
    state._render();
  }

  // ── linear-system-conditioning：两条线趋近于 parallel，condition 迅速变大 ─
  function linearConditioning(host) {
    // System：line1 x + y = 2（固定）。line2 的 slope 由控件调节，使其趋近 line1。
    var state = { tilt: 60 };
    var W = 260, H = 230, CX = 130, CY = 115, SC = 28;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function toX(x) { return CX + x * SC; }
    function toY(y) { return CY - y * SC; }
    state._render = function () {
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      // Line 1: a1 x + b1 y = c1  ->  x + y = 2
      var a1 = 1, b1 = 1, c1 = 2;
      // 当 tilt -> 100 时，Line 2 angle 接近 line 1。line1 direction angle 为 135deg。
      var t = state.tilt / 100;
      var ang = (135 - 55 * t) * Math.PI / 180; // 80deg .. 135deg
      var a2 = Math.cos(ang), b2 = Math.sin(ang);
      var c2 = a2 * 1 + b2 * 1; // 强制两条线都经过 solution (1,1)
      var det = a1 * b2 - a2 * b1;
      // 通过 singular values 计算 2x2 Matrix 的 condition number
      var M = [[a1, b1], [a2, b2]];
      var ata00 = M[0][0] * M[0][0] + M[1][0] * M[1][0];
      var ata01 = M[0][0] * M[0][1] + M[1][0] * M[1][1];
      var ata11 = M[0][1] * M[0][1] + M[1][1] * M[1][1];
      var tr = ata00 + ata11, dt = ata00 * ata11 - ata01 * ata01;
      var disc = Math.sqrt(Math.max(0, tr * tr / 4 - dt));
      var l1 = tr / 2 + disc, l2 = tr / 2 - disc;
      var cond = Math.sqrt(l1 / Math.max(l2, 1e-12));
      function drawLine(a, b, c, st) {
        // a x + b y = c，sample x range
        var pts = [], xx;
        for (xx = -4; xx <= 4.01; xx += 8) {
          if (Math.abs(b) > 1e-6) { pts.push([xx, (c - a * xx) / b]); }
        }
        if (pts.length === 2) {
          svg.appendChild(svgEl('line', { x1: toX(pts[0][0]), y1: toY(pts[0][1]), x2: toX(pts[1][0]), y2: toY(pts[1][1]), stroke: st, 'stroke-width': '2' }));
        }
      }
      svg.appendChild(svgEl('line', { x1: toX(-4), y1: CY, x2: toX(4), y2: CY, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('line', { x1: CX, y1: toY(-4), x2: CX, y2: toY(4), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      drawLine(a1, b1, c1, 'var(--ink-mute,#999)');
      drawLine(a2, b2, c2, 'var(--blueprint,#3553ff)');
      svg.appendChild(svgEl('circle', { cx: toX(1), cy: toY(1), r: '5', fill: 'var(--warn,#b8870f)' }));
      num.innerHTML = (cond < 1000 ? cond.toFixed(1) : cond.toExponential(1)) + ' <small>cond number</small>';
      meta.textContent = (cond > 50 ? 'ill-conditioned: ' : 'well-conditioned: ') +
        'det = ' + det.toFixed(3) + '  ·  近乎 parallel 的 lines 会让 intersection 对 noise 极度敏感';
      formula.textContent = 'kappa = sigma_max / sigma_min   ·   b 中的小 noise 最多会使 solution 偏移 kappa 倍';
    };
    var grid = el('div', {}, [slider(state, 'tilt', '将 line 2 向 line 1 倾斜', 0, 98, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['CONDITIONING']), el('span', {}, ['拖向 parallel'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['一个 2x2 system 就是两条 lines 的 intersection。当 lines 以较大角度相交时，solution 清晰且稳定。随着它们向 parallel 倾斜，determinant 变小，condition number 暴涨，输入中极小的变化也会让 intersection 大幅摆动。Ill-conditioned systems 会放大 noise。'])
    ]));
    state._render();
  }

  // ── random-walk-diffusion：1D walk 的 spread 按 sqrt(t) 增长 ──────────
  function randomWalkDiffusion(host) {
    var state = { t: 50 };
    var W = 520, H = 220, PAD = 30;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var TMAX = 200;
    // 通过每个 walker 的固定 sign sequence 生成若干 deterministic sample paths
    var walkers = 7;
    function step(seed, k) {
      // {-1,+1} 中的 deterministic pseudo-sign
      var v = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453;
      v = v - Math.floor(v);
      return v < 0.5 ? -1 : 1;
    }
    function px(s) { return PAD + s / TMAX * (W - 2 * PAD); }
    function py(v) { return H / 2 - v / Math.sqrt(TMAX) * (H / 2 - PAD) * 0.9; }
    state._render = function () {
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      svg.appendChild(svgEl('line', { x1: PAD, y1: H / 2, x2: W - PAD, y2: H / 2, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      // theoretical +/- one std envelope: std = sqrt(t)
      var dUp = '', dDn = '', i;
      for (i = 0; i <= 120; i++) {
        var s = TMAX * i / 120;
        var sd = Math.sqrt(s);
        dUp += (i ? 'L' : 'M') + px(s).toFixed(1) + ' ' + py(sd).toFixed(1) + ' ';
        dDn += (i ? 'L' : 'M') + px(s).toFixed(1) + ' ' + py(-sd).toFixed(1) + ' ';
      }
      svg.appendChild(svgEl('path', { d: dUp, fill: 'none', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5', 'stroke-dasharray': '4 3' }));
      svg.appendChild(svgEl('path', { d: dDn, fill: 'none', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5', 'stroke-dasharray': '4 3' }));
      var w, ends = [];
      for (w = 0; w < walkers; w++) {
        var pos = 0, d = '';
        d += 'M' + px(0).toFixed(1) + ' ' + py(0).toFixed(1) + ' ';
        var k;
        for (k = 1; k <= state.t; k++) {
          pos += step(w + 1, k);
          d += 'L' + px(k).toFixed(1) + ' ' + py(pos).toFixed(1) + ' ';
        }
        ends.push(pos);
        svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.2', opacity: '0.7' }));
        svg.appendChild(svgEl('circle', { cx: px(state.t), cy: py(pos), r: '3', fill: 'var(--blueprint,#3553ff)' }));
      }
      var sdTheory = Math.sqrt(state.t);
      num.innerHTML = sdTheory.toFixed(2) + ' <small>std = sqrt(t)</small>';
      meta.textContent = 't = ' + state.t + ' steps  ·  endpoints 按 sqrt(t) 扩散，而不是按 t  ·  虚线橙色是 +/- one std envelope';
      formula.textContent = 'each step +/-1 with equal odds  ·  Var(position) = t,  std = sqrt(t)';
    };
    var grid = el('div', {}, [slider(state, 't', 'steps t', 1, TMAX, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['RANDOM WALK']), el('span', {}, ['拖动 step count'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['一维 walk 在每个 tick 采取 plus-or-minus-one step。Steps 相互独立，因此 variances 相加：t steps 后 variance 是 t，从起点出发的典型距离是 t 的平方根。Diffusion 扩散得很慢，这就是 walk 会四处游走但很少径直远离的原因。'])
    ]));
    state._render();
  }

  // ── roots-of-unity：n 个 complex nth-roots 均匀分布在 unit circle 上 ───
  function rootsOfUnity(host) {
    var state = { n: 5 };
    var W = 260, H = 240, CX = 130, CY = 120, R = 95;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      svg.appendChild(svgEl('line', { x1: CX - R - 14, y1: CY, x2: CX + R + 14, y2: CY, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('line', { x1: CX, y1: CY - R - 14, x2: CX, y2: CY + R + 14, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('circle', { cx: CX, cy: CY, r: R, fill: 'none', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1.5' }));
      var pts = '', k;
      var coords = [];
      for (k = 0; k < state.n; k++) {
        var ang = 2 * Math.PI * k / state.n;
        var x = CX + R * Math.cos(ang), y = CY - R * Math.sin(ang);
        coords.push([x, y]);
        pts += (k ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      }
      pts += 'Z';
      svg.appendChild(svgEl('path', { d: pts, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1', opacity: '0.45' }));
      coords.forEach(function (c, k2) {
        svg.appendChild(svgEl('line', { x1: CX, y1: CY, x2: c[0], y2: c[1], stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '0.8' }));
        svg.appendChild(svgEl('circle', { cx: c[0], cy: c[1], r: k2 === 0 ? '5' : '4', fill: k2 === 0 ? 'var(--warn,#b8870f)' : 'var(--blueprint,#3553ff)' }));
      });
      num.innerHTML = state.n + ' <small>roots</small>';
      meta.textContent = '间隔 ' + (360 / state.n).toFixed(1) + ' deg  ·  k = 0（橙色）始终是 1  ·  当 n > 1 时它们的和为 0';
      formula.textContent = 'z_k = exp(2*pi*i*k/n) = cos(2*pi*k/n) + i*sin(2*pi*k/n),  k = 0..n-1';
    };
    var grid = el('div', {}, [slider(state, 'n', 'n (number of roots)', 1, 16, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['ROOTS OF UNITY']), el('span', {}, ['拖动 n'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['n 个 complex nth-roots of unity 是 z 的 n 次方等于一的解。它们以 two pi k over n 的 angles 均匀分布在 unit circle 上，其中一个始终位于 1。这些均匀间隔的点就是 discrete Fourier transform 背后的 sampling frequencies。'])
    ]));
    state._render();
  }

  // ── graph-degree-distribution：degrees 之和等于 edge count 的两倍 ─────────
  function graphDegrees(host) {
    var state = { nodes: 6, edges: 7 };
    var W = 260, H = 240, CX = 130, CY = 110, R = 80;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      var n = state.nodes;
      var maxEdges = n * (n - 1) / 2;
      var e = Math.min(state.edges, maxEdges);
      // deterministic edge list：按固定顺序枚举所有 pairs，取前 e 个
      var pairs = [], i, j;
      for (i = 0; i < n; i++) { for (j = i + 1; j < n; j++) { pairs.push([i, j]); } }
      // 交错排列，让早期 edges 分散在 ring 周围，而不是聚在一起
      pairs.sort(function (a, b) { return ((a[1] - a[0]) - (b[1] - b[0])) || (a[0] - b[0]); });
      var deg = [];
      for (i = 0; i < n; i++) { deg.push(0); }
      var used = pairs.slice(0, e);
      var coords = [];
      for (i = 0; i < n; i++) {
        var ang = 2 * Math.PI * i / n - Math.PI / 2;
        coords.push([CX + R * Math.cos(ang), CY + R * Math.sin(ang)]);
      }
      used.forEach(function (p) {
        deg[p[0]]++; deg[p[1]]++;
        svg.appendChild(svgEl('line', { x1: coords[p[0]][0], y1: coords[p[0]][1], x2: coords[p[1]][0], y2: coords[p[1]][1], stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1.4' }));
      });
      coords.forEach(function (c, idx) {
        svg.appendChild(svgEl('circle', { cx: c[0], cy: c[1], r: '11', fill: 'var(--blueprint,#3553ff)' }));
        svg.appendChild(svgEl('text', { x: c[0], y: c[1] + 4, 'text-anchor': 'middle', 'font-size': '11', 'font-family': 'monospace', fill: 'var(--bg,#fafaf5)' }, []));
        svg.lastChild.appendChild(document.createTextNode(String(deg[idx])));
      });
      var sumDeg = 0;
      for (i = 0; i < n; i++) { sumDeg += deg[i]; }
      num.innerHTML = sumDeg + ' <small>= 2 * ' + used.length + ' edges</small>';
      meta.textContent = '每个 node label 是它的 degree  ·  average degree ' + (sumDeg / n).toFixed(2) +
        (e < state.edges ? '  ·  capped at ' + maxEdges + ' (complete graph)' : '');
      formula.textContent = 'handshake lemma: sum of degrees = 2 * (number of edges)';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'nodes', 'nodes', 3, 10, 1),
      slider(state, 'edges', 'edges', 0, 20, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['GRAPH DEGREES']), el('span', {}, ['拖动 nodes 和 edges'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['每条 edge 接触两个 nodes，因此会让它们各自的 degree 增加一。把所有 nodes 的 degrees 加起来，就恰好把每条 edge 计数了两次。这个 handshake lemma 对任意 graph 都成立，并且要求 odd-degree nodes 的数量必须是偶数。'])
    ]));
    state._render();
  }

  LF.register({
    'svd-rank-reconstruction': svdRank,
    'tensor-broadcast': tensorBroadcast,
    'logsumexp-stability': logsumexpStability,
    'norm-unit-balls': normUnitBalls,
    'monte-carlo-pi': monteCarloPi,
    'linear-system-conditioning': linearConditioning,
    'random-walk-diffusion': randomWalkDiffusion,
    'roots-of-unity': rootsOfUnity,
    'graph-degree-distribution': graphDegrees
  });
})();
