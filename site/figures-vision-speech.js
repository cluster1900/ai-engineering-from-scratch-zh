/* figures-vision-speech.js — Phase 4（computer
   vision）和 Phase 6（speech & audio）的交互式课程图示。在 lesson-figures.js 之后加载，
   并通过 window.LF 注册 widgets。Vanilla ES5，无 deps，通过 CSS
   vars 设置主题。创作方式与 docs/en.md 中的 fenced block 相同：
       ```figure
       convolution-kernel
       ``` */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl, slider = LF.slider, select = LF.select;
  var clamp = LF.clamp;

  function shell(label, hint, grid, outKids, caption) {
    return el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [hint])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, outKids)]),
      el('div', { class: 'lf-cap' }, [caption])
    ]);
  }

  // ── convolution-kernel：在固定 8x8 image 上滑动一个 3x3 kernel ──────────
  function convolutionKernel(host) {
    var IMG = [
      [10, 12, 14, 80, 82, 16, 14, 12],
      [11, 13, 15, 81, 83, 17, 15, 13],
      [12, 14, 16, 82, 84, 18, 16, 14],
      [13, 15, 17, 83, 85, 19, 17, 15],
      [12, 14, 90, 90, 90, 90, 16, 14],
      [11, 13, 15, 17, 19, 17, 15, 13],
      [10, 12, 14, 16, 18, 16, 14, 12],
      [9, 11, 13, 15, 17, 15, 13, 11]
    ];
    var KERNELS = {
      identity: [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
      edge: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]],
      blur: [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
      sharpen: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]]
    };
    var DIV = { identity: 1, edge: 1, blur: 9, sharpen: 1 };
    var N = 8, OUT = N - 2;
    var state = { kernel: 'edge', wx: 0, wy: 0 };
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });

    function conv(ox, oy) {
      var k = KERNELS[state.kernel], s = 0, a, b;
      for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) s += k[a][b] * IMG[oy + a][ox + b];
      return s / DIV[state.kernel];
    }
    function gray(v) { return clamp(v, 0, 255) / 255; }

    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var cell = 22, gx = 8, gy = 18, gx2 = 300, r, c;
      svg.appendChild(svgEl('text', { x: gx, y: 12, fill: 'var(--ink-mute,#777)', 'font-size': '10', 'font-family': 'monospace' }, [tnode('输入 8x8')]));
      svg.appendChild(svgEl('text', { x: gx2, y: 12, fill: 'var(--ink-mute,#777)', 'font-size': '10', 'font-family': 'monospace' }, [tnode('输出 6x6')]));
      for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
        svg.appendChild(svgEl('rect', { x: gx + c * cell, y: gy + r * cell, width: cell - 1, height: cell - 1, fill: 'var(--blueprint,#3553ff)', opacity: gray(IMG[r][c]).toFixed(3) }));
      }
      var wx = state.wx, wy = state.wy;
      svg.appendChild(svgEl('rect', { x: gx + wx * cell - 1, y: gy + wy * cell - 1, width: 3 * cell, height: 3 * cell, fill: 'none', stroke: 'var(--warn,#b8870f)', 'stroke-width': '2' }));
      var ocell = 24;
      for (r = 0; r < OUT; r++) for (c = 0; c < OUT; c++) {
        var ov = conv(c, r);
        var hot = (c === wx && r === wy);
        svg.appendChild(svgEl('rect', { x: gx2 + c * ocell, y: gy + r * ocell, width: ocell - 1, height: ocell - 1, fill: 'var(--blueprint,#3553ff)', opacity: gray(ov).toFixed(3), stroke: hot ? 'var(--warn,#b8870f)' : 'none', 'stroke-width': '2' }));
      }
      var out = conv(wx, wy);
      meta.textContent = 'window 位于 (' + wx + ',' + wy + ')  ·  输出 = ' + out.toFixed(1) + (DIV[state.kernel] > 1 ? '  (sum / ' + DIV[state.kernel] + ')' : '');
      var k = KERNELS[state.kernel];
      formula.textContent = '输出 = Σ kernel · patch   ·   kernel 行 [' + k[0].join(' ') + '] [' + k[1].join(' ') + '] [' + k[2].join(' ') + ']';
    };
    function tnode(t) { return document.createTextNode(t); }

    var grid = el('div', { class: 'lf-grid' }, [
      select(state, 'kernel', 'kernel', [['edge detect', 'edge'], ['blur (box)', 'blur'], ['sharpen', 'sharpen'], ['identity', 'identity']]),
      slider(state, 'wx', 'window x', 0, OUT - 1, 1),
      slider(state, 'wy', 'window y', 0, OUT - 1, 1)
    ]);
    host.appendChild(shell('CONVOLUTION KERNEL', '选择一个 kernel，滑动 window',
      grid, [svg, meta, formula],
      'Convolution 会把一个小 kernel 覆盖到 image 的每个 3x3 patch 上，并对逐元素乘积求和。edge kernel 会抵消平坦区域并点亮垂直带；blur 会平均邻居；sharpen 会相对于周围放大中心。由于 window 无法以边界为中心，输出在每一边都会少两个 pixels。'));
    state._render();
  }

  // ── pooling：在 4x4 grid 上做 2x2 max 或 average pooling，stride 为 2 ──────────
  function pooling(host) {
    var GRID = [
      [3, 8, 2, 1],
      [5, 1, 9, 4],
      [7, 2, 6, 3],
      [1, 4, 0, 8]
    ];
    var MAXV = 9;
    var state = { mode: 'max' };
    var svg = svgEl('svg', { viewBox: '0 0 520 220' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });

    function poolWindow(br, bc) {
      var vals = [GRID[br][bc], GRID[br][bc + 1], GRID[br + 1][bc], GRID[br + 1][bc + 1]];
      if (state.mode === 'max') {
        var m = vals[0], mi = 0, i;
        for (i = 1; i < 4; i++) if (vals[i] > m) { m = vals[i]; mi = i; }
        return { val: m, contrib: mi };
      }
      var sum = vals[0] + vals[1] + vals[2] + vals[3];
      return { val: sum / 4, contrib: -1 };
    }

    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var cell = 40, gx = 14, gy = 30, gx2 = 320, r, c;
      svg.appendChild(svgEl('text', { x: gx, y: 20, fill: 'var(--ink-mute,#777)', 'font-size': '11', 'font-family': 'monospace' }, [tx('输入 4x4')]));
      svg.appendChild(svgEl('text', { x: gx2, y: 20, fill: 'var(--ink-mute,#777)', 'font-size': '11', 'font-family': 'monospace' }, [tx('输出 2x2')]));
      for (r = 0; r < 4; r++) for (c = 0; c < 4; c++) {
        var win = poolWindow(Math.floor(r / 2) * 2, Math.floor(c / 2) * 2);
        var local = (r % 2) * 2 + (c % 2);
        var picked = state.mode === 'max' && win.contrib === local;
        svg.appendChild(svgEl('rect', { x: gx + c * cell, y: gy + r * cell, width: cell - 2, height: cell - 2, fill: 'var(--blueprint,#3553ff)', opacity: (0.18 + 0.72 * GRID[r][c] / MAXV).toFixed(3), stroke: picked ? 'var(--warn,#b8870f)' : 'none', 'stroke-width': '2.5' }));
        svg.appendChild(svgEl('text', { x: gx + c * cell + (cell - 2) / 2, y: gy + r * cell + (cell - 2) / 2 + 4, fill: 'var(--bg,#fafaf5)', 'font-size': '13', 'font-family': 'monospace', 'text-anchor': 'middle' }, [tx(String(GRID[r][c]))]));
      }
      for (r = 0; r < 2; r++) for (c = 0; c < 2; c++) {
        var p = poolWindow(r * 2, c * 2);
        svg.appendChild(svgEl('rect', { x: gx2 + c * cell, y: gy + r * cell, width: cell - 2, height: cell - 2, fill: 'var(--blueprint,#3553ff)', opacity: (0.18 + 0.72 * p.val / MAXV).toFixed(3) }));
        svg.appendChild(svgEl('text', { x: gx2 + c * cell + (cell - 2) / 2, y: gy + r * cell + (cell - 2) / 2 + 4, fill: 'var(--bg,#fafaf5)', 'font-size': '13', 'font-family': 'monospace', 'text-anchor': 'middle' }, [tx(state.mode === 'max' ? String(p.val) : p.val.toFixed(1))]));
      }
      meta.textContent = state.mode === 'max'
        ? '每个 2x2 window 保留最大值（在输入中用轮廓标出）'
        : '每个 2x2 window 保留四个值的平均值';
      formula.textContent = '2x2 window，stride 2  ·  4x4 → 2x2  ·  ' + (state.mode === 'max' ? 'out = max(window)' : 'out = mean(window)');
    };
    function tx(t) { return document.createTextNode(t); }

    var grid = el('div', { class: 'lf-grid' }, [
      select(state, 'mode', 'pooling', [['max', 'max'], ['average', 'average']])
    ]);
    host.appendChild(shell('POOLING', 'max 或 average',
      grid, [svg, meta, formula],
      'Pooling 通过把每个 window 汇总成一个值来下采样 feature map。stride 为 2 的 2x2 window 会把两个维度都减半，将 4x4 grid 变成 2x2。Max pooling 会转发每个 window 中最强的 activation（已高亮）；average pooling 会转发 mean。结果更小、对平移更 tolerant，并且让下一层更便宜。'));
    state._render();
  }

  // ── receptive-field：一个深层 neuron 能看到多少 input pixels ────────────
  function receptiveField(host) {
    var state = { layers: 4, k: 3, stride: 1 };
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });

    state._render = function () {
      var rf = 1, jump = 1, L;
      for (L = 0; L < state.layers; L++) {
        rf = rf + (state.k - 1) * jump;
        jump = jump * state.stride;
      }
      num.innerHTML = rf + ' <small>x ' + rf + ' pixels</small>';
      meta.textContent = state.layers + ' 个 conv layers  ·  kernel ' + state.k + '  ·  stride ' + state.stride + '  ·  一个 output neuron 能看到宽 ' + rf + ' pixels 的区域';
      formula.textContent = 'RF 每层增长 (k − 1) · Π(strides)   ·   RF = 1 + Σ (k − 1) · s^(layer−1)';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'layers', 'conv layers', 1, 12, 1),
      slider(state, 'k', 'kernel size', 1, 7, 2),
      slider(state, 'stride', 'stride', 1, 3, 1)
    ]);
    host.appendChild(shell('RECEPTIVE FIELD', '堆叠 layers',
      grid, [num, meta, formula],
      'CNN 深处的 neuron 看不到整张 image，只能看到通过下方每一层传给它的 patch。每个 kernel 都会让这个 patch 扩宽 (kernel − 1)，而任何 stride 都会放大后续所有 layers 的覆盖范围。堆叠小 kernels 是 network 低成本构建大 receptive field 的方式，无需使用一个巨大的 filter。'));
    state._render();
  }

  // ── conv-output-size：floor((W - K + 2P)/S) + 1，配有条带图 ───────
  function convOutputSize(host) {
    var state = { W: 32, K: 3, S: 1, P: 1 };
    var svg = svgEl('svg', { viewBox: '0 0 520 200' });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });

    function outSize() {
      return Math.floor((state.W - state.K + 2 * state.P) / state.S) + 1;
    }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var out = outSize();
      var valid = out >= 1 && (state.W - state.K + 2 * state.P) >= 0;
      var x0 = 30, y0 = 70, full = 460;
      var unit = full / (state.W + 2 * state.P);
      if (state.P > 0) {
        svg.appendChild(svgEl('rect', { x: x0, y: y0, width: (state.P * unit).toFixed(1), height: 40, fill: 'var(--rule-soft,#ddd)' }));
        svg.appendChild(svgEl('rect', { x: (x0 + (state.P + state.W) * unit).toFixed(1), y: y0, width: (state.P * unit).toFixed(1), height: 40, fill: 'var(--rule-soft,#ddd)' }));
      }
      svg.appendChild(svgEl('rect', { x: (x0 + state.P * unit).toFixed(1), y: y0, width: (state.W * unit).toFixed(1), height: 40, fill: 'var(--blueprint,#3553ff)', opacity: '0.22' }));
      svg.appendChild(svgEl('rect', { x: x0, y: y0, width: (state.K * unit).toFixed(1), height: 40, fill: 'none', stroke: 'var(--warn,#b8870f)', 'stroke-width': '2' }));
      var i, maxBars = Math.min(out, 64);
      for (i = 0; i < maxBars && valid; i++) {
        var cx = x0 + (i * state.S + state.K / 2) * unit;
        svg.appendChild(svgEl('circle', { cx: cx.toFixed(1), cy: y0 + 60, r: '2.4', fill: 'var(--blueprint,#3553ff)' }));
      }
      svg.appendChild(svgEl('text', { x: x0, y: y0 - 12, fill: 'var(--ink-mute,#777)', 'font-size': '11', 'font-family': 'monospace' }, [t('padded input = ' + (state.W + 2 * state.P) + '（灰色 = padding，方框 = kernel）')]));
      svg.appendChild(svgEl('text', { x: x0, y: y0 + 90, fill: 'var(--ink-mute,#777)', 'font-size': '11', 'font-family': 'monospace' }, [t('output positions = ' + (valid ? out : 0))]));
      num.innerHTML = (valid ? out : 0) + ' <small>x ' + (valid ? out : 0) + '</small>';
      meta.textContent = valid ? 'W ' + state.W + '  K ' + state.K + '  S ' + state.S + '  P ' + state.P + '  →  每边 ' + out
        : 'kernel 大于 padded input：没有有效输出';
      formula.textContent = 'out = floor((W − K + 2P) / S) + 1 = floor((' + state.W + ' − ' + state.K + ' + ' + (2 * state.P) + ') / ' + state.S + ') + 1';
    };
    function t(s) { return document.createTextNode(s); }
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'W', 'input W', 4, 64, 1),
      slider(state, 'K', 'kernel K', 1, 11, 1),
      slider(state, 'S', 'stride S', 1, 4, 1),
      slider(state, 'P', 'padding P', 0, 5, 1)
    ]);
    host.appendChild(shell('CONV OUTPUT SIZE', '拖动 W、K、S、P',
      grid, [svg, num, meta, formula],
      'Convolution 输出的 spatial size 遵循一个公式：floor((W − K + 2P) / S) + 1。Padding P 添加边界，让 kernel 可以触及 edges 并保持 size；stride S 会跳过 positions 并缩小输出。"Same" padding 会选择 P，使输出匹配输入；"valid" padding 使用 P = 0，并按 K − 1 缩小。'));
    state._render();
  }

  // ── cnn-param-count：conv weight sharing 对比 dense layer ──────────────────
  function cnnParamCount(host) {
    var state = { cin: 64, cout: 128, k: 3, hw: 32 };
    var num = el('span', { class: 'lf-num' });
    var bar = el('i');
    var barWrap = el('div', { class: 'lf-bar' }, [bar]);
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function human(x) { var u = ['', 'K', 'M', 'B'], i = 0; while (x >= 1000 && i < u.length - 1) { x /= 1000; i++; } return x.toFixed(x < 10 ? 2 : 1) + u[i]; }

    state._render = function () {
      var conv = (state.k * state.k * state.cin + 1) * state.cout;
      var inFeat = state.cin * state.hw * state.hw;
      var outFeat = state.cout * state.hw * state.hw;
      var dense = (inFeat + 1) * outFeat;
      var ratio = dense / conv;
      num.innerHTML = human(conv) + ' <small>conv params</small>';
      bar.style.width = clamp(state.k * state.k * state.cin * state.cout / 1e6 * 4, 2, 100) + '%';
      meta.textContent = '同一张 ' + state.hw + 'x' + state.hw + ' map 上的 dense layer = ' + human(dense) + ' params  ·  多 ' + human(ratio) + 'x';
      formula.textContent = 'conv = (K·K·Cin + 1)·Cout = (' + state.k + '·' + state.k + '·' + state.cin + ' + 1)·' + state.cout + '   ·   与 spatial size 无关';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'cin', 'in channels', 1, 512, 1),
      slider(state, 'cout', 'out channels', 1, 512, 1),
      slider(state, 'k', 'kernel size', 1, 7, 1),
      slider(state, 'hw', 'feature map side', 8, 64, 1)
    ]);
    host.appendChild(shell('CNN PARAM COUNT', 'conv vs dense',
      grid, [num, barWrap, meta, formula],
      'Convolution layer 的成本是 (K·K·Cin + 1)·Cout 个 weights，并在每个 spatial position 复用这一个 kernel。连接同一个 feature map 的 dense layer 则需要为每对 input-output pixel 单独准备一个 weight，数量会随 image size 爆炸。Weight sharing 正是 CNN 能小到足以在 images 上训练的原因。'));
    state._render();
  }

  // ── spectrogram-window：STFT window size 与 time-frequency 取舍 ───
  function spectrogramWindow(host) {
    var state = { win: 256 };
    var SR = 16000;
    var svg = svgEl('svg', { viewBox: '0 0 520 220' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });

    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var W = 520, H = 220, x0 = 40, y0 = 16, gw = 440, gh = 168;
      var cols = 8, rows = 8;
      var winSec = state.win / SR;
      var freqRes = SR / state.win;
      var tFrac = clamp(state.win / 2048, 0.04, 1);
      var cw = gw / cols, ch = gh / rows;
      var r, c;
      for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
        var timeSpread = tFrac;
        var freqSpread = 1 - tFrac;
        var op = 0.12 + 0.55 * (0.5 * timeSpread * (1 - Math.abs((c + 0.5) / cols - 0.5) * 2) + 0.5 * freqSpread * (1 - Math.abs((r + 0.5) / rows - 0.5) * 2));
        svg.appendChild(svgEl('rect', { x: x0 + c * cw, y: y0 + r * ch, width: cw - 1.5, height: ch - 1.5, fill: 'var(--blueprint,#3553ff)', opacity: clamp(op, 0.05, 0.95).toFixed(3) }));
      }
      svg.appendChild(svgEl('text', { x: x0, y: y0 + gh + 16, fill: 'var(--ink-mute,#777)', 'font-size': '11', 'font-family': 'monospace' }, [t('time →')]));
      svg.appendChild(svgEl('text', { x: 8, y: y0 + 8, fill: 'var(--ink-mute,#777)', 'font-size': '11', 'font-family': 'monospace' }, [t('freq')]));
      meta.textContent = 'window ' + state.win + ' samples = ' + (winSec * 1000).toFixed(1) + ' ms  ·  freq bins 每 ' + freqRes.toFixed(1) + ' Hz 一个  ·  '
        + (state.win <= 256 ? 'time 上清晰，frequency 上模糊' : state.win >= 1024 ? 'frequency 上清晰，time 上模糊' : '平衡');
      formula.textContent = 'time res = window / SR，freq res = SR / window   ·   乘积固定（uncertainty）';
    };
    function t(s) { return document.createTextNode(s); }
    var grid = el('div', {}, [slider(state, 'win', 'STFT window (samples)', 64, 2048, 64)]);
    host.appendChild(shell('SPECTROGRAM WINDOW', '拖动 window size',
      grid, [svg, meta, formula],
      'Spectrogram 会把 signal 切成多个 windows，并对每个 window 做 Fourier transform。短 window 能精确定位事件发生的时间，但会把能量扩散到 frequency 上；长 window 能细致分辨 pitch，但会把它涂抹到 time 上。两种 resolution 的乘积固定，所以每个选择都是用一个换另一个。'));
    state._render();
  }

  // ── mel-scale：linear Hz 对比 mel curve ─────────────────────────────
  function melScale(host) {
    var state = { f: 4000 };
    var FMAX = 16000;
    var W = 520, H = 220, PAD = 40;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function mel(f) { return 2595 * Math.log(1 + f / 700) / Math.LN10; }
    var MELMAX = mel(FMAX);
    function px(f) { return PAD + f / FMAX * (W - 2 * PAD); }
    function pyMel(m) { return H - PAD - m / MELMAX * (H - 2 * PAD); }

    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: H - PAD, x2: W - PAD, y2: PAD, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1.5', 'stroke-dasharray': '4 4' }));
      var d = '', i;
      for (i = 0; i <= 120; i++) { var f = FMAX * i / 120; d += (i ? 'L' : 'M') + px(f).toFixed(1) + ' ' + pyMel(mel(f)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2.2' }));
      var m = mel(state.f);
      svg.appendChild(svgEl('line', { x1: px(state.f), y1: pyMel(m), x2: px(state.f), y2: H - PAD, stroke: 'var(--warn,#b8870f)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      svg.appendChild(svgEl('line', { x1: PAD, y1: pyMel(m), x2: px(state.f), y2: pyMel(m), stroke: 'var(--warn,#b8870f)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      svg.appendChild(svgEl('circle', { cx: px(state.f), cy: pyMel(m), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      svg.appendChild(svgEl('text', { x: W - PAD - 4, y: H - PAD - 6, fill: 'var(--ink-mute,#777)', 'font-size': '11', 'font-family': 'monospace', 'text-anchor': 'end' }, [tx('Hz →')]));
      svg.appendChild(svgEl('text', { x: PAD - 6, y: PAD + 10, fill: 'var(--ink-mute,#777)', 'font-size': '11', 'font-family': 'monospace', 'text-anchor': 'end' }, [tx('mel')]));
      num.innerHTML = Math.round(m) + ' <small>mel</small>';
      var fracHz = state.f / FMAX, fracMel = m / MELMAX;
      meta.textContent = state.f + ' Hz 是 Hz axis 的 ' + Math.round(fracHz * 100) + '%，但只到 mel axis 的 ' + Math.round(fracMel * 100) + '%  ·  high frequencies 被压缩';
      formula.textContent = 'mel = 2595 · log10(1 + f / 700)   ·   虚线是用于对比的 linear identity';
    };
    function tx(s) { return document.createTextNode(s); }
    var grid = el('div', {}, [slider(state, 'f', 'frequency (Hz)', 100, FMAX, 100)]);
    host.appendChild(shell('MEL SCALE', '拖动 frequency',
      grid, [svg, num, meta, formula],
      '人耳对 low frequencies 的分辨更细，对 high ones 的分辨更粗。mel scale 会弯曲 linear Hz 来匹配这一点：它在 1 kHz 以下接近 linear，在其以上明显压缩，所以从 8 到 9 kHz 的跳变跨越的 mels 远少于从 200 到 300 Hz。Mel filterbanks 会把 resolution 用在耳朵真正关心的位置。'));
    state._render();
  }

  // ── nyquist-aliasing：fs/2 以上的 sampling 会折叠成虚假的 low frequency ───
  function nyquistAliasing(host) {
    var state = { f: 7, fs: 20 };
    var W = 520, H = 220, PAD = 28, DUR = 1;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function px(t) { return PAD + t / DUR * (W - 2 * PAD); }
    function py(v) { return H / 2 - v * (H / 2 - PAD); }
    function aliasFreq(f, fs) {
      var fn = fs / 2;
      var m = f % fs;
      if (m > fn) m = fs - m;
      return m;
    }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(0), x2: W - PAD, y2: py(0), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      var d = '', i;
      for (i = 0; i <= 400; i++) { var t = DUR * i / 400; d += (i ? 'L' : 'M') + px(t).toFixed(1) + ' ' + py(Math.sin(2 * Math.PI * state.f * t)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--rule-soft,#bbb)', 'stroke-width': '1.5' }));
      var fa = aliasFreq(state.f, state.fs);
      var over = state.f > state.fs / 2;
      var n = Math.floor(state.fs * DUR), k, sx = [], sy = [];
      for (k = 0; k <= n; k++) { var ts = k / state.fs; sx.push(ts); sy.push(Math.sin(2 * Math.PI * state.f * ts)); }
      var ad = '';
      for (k = 0; k < sx.length; k++) { ad += (k ? 'L' : 'M') + px(sx[k]).toFixed(1) + ' ' + py(sy[k]).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: ad, fill: 'none', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5', 'stroke-dasharray': '5 3' }));
      for (k = 0; k < sx.length; k++) { svg.appendChild(svgEl('circle', { cx: px(sx[k]), cy: py(sy[k]), r: '3', fill: 'var(--blueprint,#3553ff)' })); }
      status.innerHTML = over ? 'aliased → ' + fa.toFixed(1) + ' Hz' : 'sampled cleanly';
      meta.textContent = 'signal ' + state.f + ' Hz  ·  sample rate ' + state.fs + ' Hz  ·  Nyquist = ' + (state.fs / 2) + ' Hz  ·  ' + (over ? '高于 Nyquist：dots 描绘出虚假的 ' + fa.toFixed(1) + ' Hz wave' : '低于 Nyquist：被忠实捕获');
      formula.textContent = '当 f > fs/2 时出现 alias   ·   f_alias = |f − round(f/fs)·fs|';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'f', 'signal frequency (Hz)', 1, 30, 1),
      slider(state, 'fs', 'sample rate (Hz)', 4, 40, 1)
    ]);
    host.appendChild(shell('NYQUIST & ALIASING', '拖动 frequency 和 rate',
      grid, [svg, status, meta, formula],
      '灰色是真实 signal，蓝色 dots 是 samples，虚线是这些 dots 暗示的 wave。只要 sample rate 超过 signal frequency 的两倍，samples 就能重建原始 signal。把 frequency 推过 Nyquist (fs/2) 后，同样的 dots 会描绘出一个更低且虚假的 frequency：这就是 aliasing，也是 audio 在 sampling 前需要 low-pass filtered 的原因。'));
    state._render();
  }

  LF.register({
    'convolution-kernel': convolutionKernel,
    'pooling': pooling,
    'receptive-field': receptiveField,
    'conv-output-size': convOutputSize,
    'cnn-param-count': cnnParamCount,
    'spectrogram-window': spectrogramWindow,
    'mel-scale': melScale,
    'nyquist-aliasing': nyquistAliasing
  });
})();
