/* figures-infra.js：Phase 17（infrastructure 和
   production）的交互式 lesson 图示。加载在 lesson-figures.js 之后，并通过 window.LF.register 注册。
   Vanilla ES5，无依赖，通过 CSS vars 使用 theme。编写方式仍是相同的 fenced block：
       ```figure
       data-parallel
       ``` */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl, slider = LF.slider, select = LF.select, fmtInt = LF.fmtInt;

  // ── data-parallel：将 global batch 拆成每个 GPU 的 shard，执行 all-reduce ──
  function dataParallel(host) {
    var state = { gpus: 4, batch: 256 };
    var W = 520, H = 210, PAD = 24;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var g = state.gpus, B = state.batch;
      var shard = Math.ceil(B / g);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var colW = (W - 2 * PAD) / g, boxW = Math.min(colW - 10, 84), top = 34, boxH = 64;
      var i;
      for (i = 0; i < g; i++) {
        var cx = PAD + i * colW + (colW - boxW) / 2;
        svg.appendChild(svgEl('rect', { x: cx.toFixed(1), y: top, width: boxW.toFixed(1), height: boxH, rx: '3',
          fill: 'var(--bg-surface,#eee)', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.2' }));
        var lab = svgEl('text', { x: (cx + boxW / 2).toFixed(1), y: (top + 26).toFixed(1), 'text-anchor': 'middle',
          'font-family': 'monospace', 'font-size': '10', fill: 'var(--ink,#1a1a1a)' });
        lab.appendChild(document.createTextNode('GPU ' + (i + 1)));
        svg.appendChild(lab);
        var cp = svgEl('text', { x: (cx + boxW / 2).toFixed(1), y: (top + 44).toFixed(1), 'text-anchor': 'middle',
          'font-family': 'monospace', 'font-size': '9', fill: 'var(--ink-mute,#777)' });
        cp.appendChild(document.createTextNode('完整副本'));
        svg.appendChild(cp);
        var shB = svgEl('rect', { x: cx.toFixed(1), y: (top + boxH + 10).toFixed(1), width: boxW.toFixed(1), height: '20', rx: '2',
          fill: 'var(--blueprint,#3553ff)', opacity: '0.85' });
        svg.appendChild(shB);
        var sl = svgEl('text', { x: (cx + boxW / 2).toFixed(1), y: (top + boxH + 24).toFixed(1), 'text-anchor': 'middle',
          'font-family': 'monospace', 'font-size': '9', fill: 'var(--bg,#fafaf5)' });
        sl.appendChild(document.createTextNode(shard + ' 行'));
        svg.appendChild(sl);
      }
      var ry = top + boxH + 48;
      svg.appendChild(svgEl('line', { x1: PAD, y1: ry, x2: W - PAD, y2: ry, stroke: 'var(--warn,#b8870f)', 'stroke-width': '2' }));
      var rl = svgEl('text', { x: (W / 2).toFixed(1), y: (ry + 16).toFixed(1), 'text-anchor': 'middle',
        'font-family': 'monospace', 'font-size': '10', fill: 'var(--warn,#b8870f)' });
      rl.appendChild(document.createTextNode('在 ' + g + ' 个 GPU 间 all-reduce gradients'));
      svg.appendChild(rl);
      num.innerHTML = g + 'x <small>吞吐量（理想）</small>';
      meta.textContent = 'global batch ' + B + ' 拆成 ' + g + ' 个 shard，每个 shard ' + shard + ' 行  ·  每个 GPU 保存一份完整 model 副本';
      formula.textContent = 'per-GPU batch = ceil(' + B + ' / ' + g + ') = ' + shard + '  ·  gradients 由 all-reduce 求和，weights 保持同步';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'gpus', 'GPU 数量', 1, 8, 1),
      slider(state, 'batch', 'global batch size', 8, 1024, 8)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['DATA PARALLELISM']), el('span', {}, ['拖动 GPU 数量'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['每个 GPU 都保存一份完整的 model 副本，并处理 global batch 的不同切片。在 backward pass 之后，all-reduce 会对每个 GPU 的 gradients 求和，让这些副本保持一致。吞吐量会随 GPU 数量接近线性扩展，但内存不会下降，因为每个 device 仍然存储整个 model。'])
    ]));
    state._render();
  }

  // ── tensor-parallel：按列拆分 matmul，聚合 partial outputs ────
  function tensorParallel(host) {
    var state = { gpus: 4, dim: 4096 };
    var W = 520, H = 200, PAD = 24;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var g = state.gpus, d = state.dim;
      var colsEach = Math.ceil(d / g);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var mx = PAD, my = 40, mw = W - 2 * PAD, mh = 90;
      svg.appendChild(svgEl('rect', { x: mx, y: my, width: mw, height: mh, fill: 'none',
        stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.4' }));
      var i;
      for (i = 0; i < g; i++) {
        var sx = mx + i * mw / g;
        svg.appendChild(svgEl('rect', { x: sx.toFixed(1), y: my, width: (mw / g - 2).toFixed(1), height: mh, rx: '2',
          fill: 'var(--blueprint,#3553ff)', opacity: (0.4 + 0.5 * (i % 2)).toFixed(2) }));
        var lab = svgEl('text', { x: (sx + mw / g / 2).toFixed(1), y: (my + mh / 2 + 4).toFixed(1), 'text-anchor': 'middle',
          'font-family': 'monospace', 'font-size': '10', fill: 'var(--bg,#fafaf5)' });
        lab.appendChild(document.createTextNode('GPU ' + (i + 1)));
        svg.appendChild(lab);
      }
      var gy = my + mh + 28;
      svg.appendChild(svgEl('line', { x1: PAD, y1: gy, x2: W - PAD, y2: gy, stroke: 'var(--warn,#b8870f)', 'stroke-width': '2' }));
      var gl = svgEl('text', { x: (W / 2).toFixed(1), y: (gy + 16).toFixed(1), 'text-anchor': 'middle',
        'font-family': 'monospace', 'font-size': '10', fill: 'var(--warn,#b8870f)' });
      gl.appendChild(document.createTextNode('all-gather partial outputs，组成完整结果'));
      svg.appendChild(gl);
      num.innerHTML = colsEach + ' <small>列 / GPU</small>';
      meta.textContent = 'weight matrix W 按列拆分到 ' + g + ' 个 GPU 上  ·  每个 GPU 保存 1/' + g + ' 的 parameters';
      formula.textContent = 'Y = X·W  with W = [W₁ | … | W' + (g > 1 ? 'ₙ' : '₁') + ']，每个 GPU 计算 X·Wᵢ 然后 all-gather  ·  mem/GPU ≈ d/' + g + ' cols = ' + colsEach;
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'gpus', 'GPU 数量', 1, 8, 1),
      slider(state, 'dim', '输出宽度（列）', 512, 8192, 256)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['TENSOR PARALLELISM']), el('span', {}, ['拖动 GPU 数量'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['通过把 weight matrix 切成列块，可以把一个大型 matmul 拆到多个 GPU 上。每个 GPU 用完整 input 乘以自己的切片，产生 partial output，然后 all-gather 将这些切片拼接成完整结果。每个 GPU 上的 parameters 会按 GPU 数量下降，这就是让单个 device 放不下的一层得以被服务的方式。'])
    ]));
    state._render();
  }

  // ── pipeline-parallel：micro-batches 增加时，bubble fraction 下降 ───────
  function pipelineParallel(host) {
    var state = { micro: 4, stages: 4 };
    var W = 520, H = 210, PAD = 24;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var bar = el('i');
    var barWrap = el('div', { class: 'lf-bar' }, [bar]);
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var m = state.micro, s = state.stages;
      var totalSlots = m + s - 1;
      var bubbleFrac = (s - 1) / (m + s - 1);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var rowH = (H - 2 * PAD) / s, cw = (W - 2 * PAD) / totalSlots;
      var r, c;
      for (r = 0; r < s; r++) {
        var y = PAD + r * rowH + 2;
        for (c = 0; c < totalSlots; c++) {
          var x = PAD + c * cw;
          // stage r 处理 micro-batch (c - r)；当 0 <= c-r < m 时忙碌
          var mb = c - r;
          var busy = mb >= 0 && mb < m;
          svg.appendChild(svgEl('rect', { x: x.toFixed(1), y: y.toFixed(1), width: (cw - 2).toFixed(1), height: (rowH - 4).toFixed(1), rx: '2',
            fill: busy ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#ccc)',
            opacity: busy ? '0.85' : '0.6' }));
        }
        var sl = svgEl('text', { x: (PAD - 4).toFixed(1), y: (y + rowH / 2).toFixed(1), 'text-anchor': 'end',
          'font-family': 'monospace', 'font-size': '9', fill: 'var(--ink-mute,#777)' });
        sl.appendChild(document.createTextNode('S' + (r + 1)));
        svg.appendChild(sl);
      }
      num.innerHTML = (bubbleFrac * 100).toFixed(1) + ' <small>% bubble（空闲）</small>';
      bar.style.width = (bubbleFrac * 100).toFixed(1) + '%';
      barWrap.classList.toggle('over', bubbleFrac > 0.4);
      meta.textContent = m + ' 个 micro-batches 穿过 ' + s + ' 个 stages  ·  灰色单元格是在填充和排空时的 idle pipeline bubble';
      formula.textContent = 'bubble fraction = (stages − 1) / (micro-batches + stages − 1) = ' + (s - 1) + ' / ' + (m + s - 1) + ' = ' + (bubbleFrac * 100).toFixed(1) + '%';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'micro', 'micro-batches', 1, 16, 1),
      slider(state, 'stages', 'pipeline stages', 2, 8, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['PIPELINE PARALLELISM']), el('span', {}, ['拖动 micro-batch 数量'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, barWrap, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['model 被拆成多个 stage，每个 GPU 一个 stage，micro-batches 像流水线一样流过它们。在 pipeline 填充和排空时，有些 stage 会空闲，这就是灰色 bubble。bubble fraction 是（stages 减一）除以（micro-batches 加 stages 减一），所以送入更多 micro-batches 会把固定的填充与排空成本摊薄到接近零。'])
    ]));
    state._render();
  }

  // ── zero-sharding：ZeRO stages 依次 shard optimizer、gradients、params ─────
  function zeroSharding(host) {
    var state = { stage: '2', gpus: 8 };
    var num = el('span', { class: 'lf-num' });
    var rows = el('div', {});
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // mixed precision Adam 中每个 parameter 的字节数：params 2、grads 2、opt states 12
    var COMPONENTS = [
      { key: 'params', label: 'parameters (fp16)', bytes: 2, shardAt: 3 },
      { key: 'grads', label: 'gradients (fp16)', bytes: 2, shardAt: 2 },
      { key: 'opt', label: 'optimizer states (Adam)', bytes: 12, shardAt: 1 }
    ];
    state._render = function () {
      var stage = Number(state.stage), g = state.gpus;
      var total = 0, i;
      while (rows.firstChild) rows.removeChild(rows.firstChild);
      var maxBytes = 16; // 完整 per-param footprint，用于 bar scale
      for (i = 0; i < COMPONENTS.length; i++) {
        var c = COMPONENTS[i];
        var sharded = stage >= c.shardAt;
        var perGpu = sharded ? c.bytes / g : c.bytes;
        total += perGpu;
        var bw = el('i'); bw.style.width = Math.min(100, perGpu / maxBytes * 100).toFixed(1) + '%';
        if (sharded) bw.style.background = 'var(--warn,#b8870f)';
        var lab = el('label', {}, [c.label + (sharded ? ' ÷ ' + g : ''),
          el('b', {}, [perGpu.toFixed(2) + ' B/param'])]);
        rows.appendChild(el('div', { class: 'lf-ctrl' }, [lab, el('div', { class: 'lf-bar' }, [bw])]));
      }
      num.innerHTML = total.toFixed(2) + ' <small>bytes / param / GPU</small>';
      meta.textContent = 'ZeRO stage ' + stage + '  ·  ' + g + ' 个 GPU  ·  '
        + (stage === 0 ? '未 shard 任何内容（普通 data parallel）'
          : stage === 1 ? 'optimizer states 已 sharded'
            : stage === 2 ? 'optimizer states + gradients 已 sharded'
              : 'optimizer states + gradients + parameters 已 sharded');
      formula.textContent = 'full footprint 16 B/param  →  sharded components 分布到 ' + g + ' 个 GPU 上  →  每个 GPU ' + total.toFixed(2) + ' B/param';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      select(state, 'stage', 'ZeRO stage', [['stage 0', '0'], ['stage 1', '1'], ['stage 2', '2'], ['stage 3', '3']]),
      slider(state, 'gpus', 'data-parallel GPUs', 2, 64, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['ZERO SHARDING']), el('span', {}, ['选择 ZeRO stage'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [num, rows, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['普通 data parallelism 会在每个 GPU 上复制完整的 optimizer state、gradients 和 parameters。ZeRO 分阶段移除这种冗余：stage 1 shard 较重的 Adam optimizer states，stage 2 加上 gradients，stage 3 加上 parameters 本身。每个 stage 都会进一步降低 per-GPU memory，用少量通信换取训练大得多的 models 的能力。'])
    ]));
    state._render();
  }

  // ── gpu-memory-breakdown：stacked training memory 与 GPU capacity 对比 ──────────
  function gpuMemoryBreakdown(host) {
    var state = { params: 7, batch: 8 };
    var GB = 1e9, REF = 80; // 一张 80 GB GPU
    var num = el('span', { class: 'lf-num' });
    var rows = el('div', {});
    var bar = el('i');
    var barWrap = el('div', { class: 'lf-bar' }, [bar]);
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var N = state.params * 1e9; // params in billions
      var weights = N * 2 / GB;
      var grads = N * 2 / GB;
      var opt = N * 12 / GB;
      // activations：粗略的 per-sample cost 随 batch 增长，这里用一个简单线性模型
      var acts = state.batch * state.params * 0.6;
      var total = weights + grads + opt + acts;
      var parts = [
        { label: 'weights (2 B)', v: weights },
        { label: 'gradients (2 B)', v: grads },
        { label: 'optimizer states (Adam ~12 B)', v: opt },
        { label: 'activations (batch ' + state.batch + ')', v: acts }
      ];
      while (rows.firstChild) rows.removeChild(rows.firstChild);
      parts.forEach(function (p) {
        var bw = el('i'); bw.style.width = Math.min(100, p.v / REF * 100).toFixed(1) + '%';
        rows.appendChild(el('div', { class: 'lf-ctrl' }, [
          el('label', {}, [p.label, el('b', {}, [p.v.toFixed(1) + ' GB'])]),
          el('div', { class: 'lf-bar' }, [bw])
        ]));
      });
      num.innerHTML = total.toFixed(total < 100 ? 1 : 0) + ' <small>GB 总计</small>';
      var pct = Math.min(100, total / REF * 100);
      bar.style.width = pct + '%';
      barWrap.classList.toggle('over', total > REF);
      meta.textContent = (total > REF ? '⚠ 超过 ' : '') + '一张 ' + REF + ' GB GPU 的 ' + Math.round(total / REF * 100) + '%  ·  训练时 optimizer states 占主导';
      formula.textContent = state.params + 'B params × (2 + 2 + 12) B = ' + (weights + grads + opt).toFixed(0) + ' GB fixed, + ' + acts.toFixed(1) + ' GB activations';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'params', 'model params（十亿）', 1, 70, 1),
      slider(state, 'batch', 'batch size', 1, 64, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['TRAINING MEMORY']), el('span', {}, ['拖动 params 和 batch'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [num, rows, barWrap, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['训练内存不只是 weights。在 mixed-precision Adam 中，每个 parameter 的 fp16 weight 占两字节，gradient 占两字节，optimizer states 约占十二字节，所以在任何 activation 之前，固定成本大约是每个 parameter 十六字节。Activations 随 batch size 扩展。这就是为什么一个适合 inference 的 model，可能大到无法在一张 GPU 上训练。'])
    ]));
    state._render();
  }

  // ── throughput-latency：batch size 同时提高 throughput 和 per-request latency ─
  function throughputLatency(host) {
    var state = { batch: 16 };
    var W = 520, H = 220, PAD = 36, BMAX = 128;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // throughput 饱和（类似 Amdahl）；latency 随 batch 增加（排队 + 计算）
    function thru(b) { return 4000 * b / (b + 24); } // tokens/sec，逐渐饱和
    function lat(b) { return 20 + 0.9 * b; }          // 每个 request 的 ms，线性
    var TMAX = thru(BMAX), LMAX = lat(BMAX);
    // knee：每单位 latency 的边际 throughput 下降最多的位置；这里接近饱和开始处
    var knee = 24;
    function px(b) { return PAD + b / BMAX * (W - 2 * PAD); }
    function pyT(t) { return H - PAD - t / TMAX * (H - 2 * PAD); }
    function pyL(l) { return H - PAD - l / LMAX * (H - 2 * PAD); }
    state._render = function () {
      var b = state.batch;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var d = '', i, x;
      for (i = 0; i <= 100; i++) { x = 1 + (BMAX - 1) * i / 100; d += (i ? 'L' : 'M') + px(x).toFixed(1) + ' ' + pyT(thru(x)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      var d2 = '';
      for (i = 0; i <= 100; i++) { x = 1 + (BMAX - 1) * i / 100; d2 += (i ? 'L' : 'M') + px(x).toFixed(1) + ' ' + pyL(lat(x)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d2, fill: 'none', stroke: 'var(--ink-mute,#999)', 'stroke-width': '2', 'stroke-dasharray': '4 3' }));
      var kx = px(knee);
      svg.appendChild(svgEl('line', { x1: kx, y1: PAD, x2: kx, y2: H - PAD, stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5', 'stroke-dasharray': '3 3' }));
      svg.appendChild(svgEl('circle', { cx: px(b), cy: pyT(thru(b)), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      svg.appendChild(svgEl('circle', { cx: px(b), cy: pyL(lat(b)), r: '4', fill: 'var(--ink-mute,#999)' }));
      num.innerHTML = fmtInt(Math.round(thru(b))) + ' <small>tokens/sec</small>';
      meta.textContent = 'batch ' + b + '  ·  per-request latency ' + lat(b).toFixed(0) + ' ms  ·  knee 接近 batch ' + knee + '（橙色）';
      formula.textContent = '更大的 batch → throughput 上升并趋于饱和，latency 线性上升  ·  在 knee 处选择 batch，取得两者的较好平衡';
    };
    var grid = el('div', {}, [slider(state, 'batch', 'batch size', 1, BMAX, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['THROUGHPUT / LATENCY']), el('span', {}, ['拖动 batch size'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['蓝线是 throughput，灰色虚线是 per-request latency。更大的 batch 会让 GPU 更忙，所以每秒总 tokens 数会上升，但每个单独 request 要在其他 request 后面等待更久，因此 latency 也会上升。knee（橙色）是 throughput 增长明显放缓而 latency 继续上升的位置，也就是大多数 serving 系统瞄准的 batch size。'])
    ]));
    state._render();
  }

  // ── autoscaling：replicas 跟随 incoming QPS，保持 latency 低于 target ──
  function autoscaling(host) {
    var state = { qps: 120, cap: 40 };
    var W = 520, H = 200, PAD = 26;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var RMAX = 12;
    state._render = function () {
      var qps = state.qps, cap = state.cap;
      var replicas = Math.max(1, Math.ceil(qps / cap));
      var shown = Math.min(RMAX, replicas);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var perRow = 6, bw = 56, bh = 30, gx = 14, gy = 18, ox = PAD, oy = 36;
      var i;
      for (i = 0; i < shown; i++) {
        var col = i % perRow, row = Math.floor(i / perRow);
        var x = ox + col * (bw + gx), y = oy + row * (bh + gy);
        // 当前 replica 上的 load
        var thisLoad = Math.min(cap, qps - i * cap);
        var fillFrac = Math.max(0, thisLoad) / cap;
        svg.appendChild(svgEl('rect', { x: x.toFixed(1), y: y.toFixed(1), width: bw, height: bh, rx: '3',
          fill: 'var(--bg-surface,#eee)', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.1' }));
        svg.appendChild(svgEl('rect', { x: x.toFixed(1), y: (y + bh - bh * fillFrac).toFixed(1), width: bw, height: (bh * fillFrac).toFixed(1), rx: '3',
          fill: 'var(--blueprint,#3553ff)', opacity: '0.85' }));
      }
      if (replicas > RMAX) {
        var more = svgEl('text', { x: (ox + 5 * (bw + gx)).toFixed(1), y: (oy + 2 * (bh + gy) + 14).toFixed(1),
          'font-family': 'monospace', 'font-size': '11', fill: 'var(--ink-mute,#777)' });
        more.appendChild(document.createTextNode('+ 还有 ' + (replicas - RMAX) + ' 个'));
        svg.appendChild(more);
      }
      var headroom = replicas * cap - qps;
      num.innerHTML = replicas + ' <small>replicas</small>';
      meta.textContent = qps + ' QPS  ·  每个 replica ' + cap + ' QPS  ·  headroom ' + headroom + ' QPS 可让 latency 保持低于 target';
      formula.textContent = 'replicas = ceil(QPS / per-replica capacity) = ceil(' + qps + ' / ' + cap + ') = ' + replicas;
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'qps', 'incoming load (QPS)', 0, 480, 10),
      slider(state, 'cap', 'per-replica capacity (QPS)', 10, 80, 5)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['AUTOSCALING']), el('span', {}, ['拖动 incoming load'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['autoscaler 会增加和移除 replicas，让输入 load 保持在 capacity 范围内，并让 latency 低于 target。replica 数量等于 load 除以单个 replica 能服务的量，并向上取整。提高 QPS，replicas 就会启动；降低 QPS，它们就会缩回去，这正是同时控制 latency 和 cost 的方式。'])
    ]));
    state._render();
  }

  // ── cost-per-token：GPU price 和 throughput 决定每 1M tokens 的成本 ────
  function costPerToken(host) {
    var state = { price: 2.5, tps: 2000 };
    var num = el('span', { class: 'lf-num' });
    var bar = el('i');
    var barWrap = el('div', { class: 'lf-bar' }, [bar]);
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var REF = 5; // $5 / 1M tokens，作为视觉参考
    state._render = function () {
      var price = state.price, tps = state.tps;
      var tokensPerHr = tps * 3600;
      var costPerMillion = price / tokensPerHr * 1e6;
      num.innerHTML = '$' + costPerMillion.toFixed(costPerMillion < 1 ? 3 : 2) + ' <small>/ 1M tokens</small>';
      bar.style.width = Math.min(100, costPerMillion / REF * 100).toFixed(1) + '%';
      barWrap.classList.toggle('over', costPerMillion > REF);
      meta.textContent = '$' + price.toFixed(2) + '/hr GPU  ·  ' + fmtInt(tps) + ' tokens/sec  ·  每小时服务 ' + (tokensPerHr / 1e6).toFixed(1) + 'M tokens';
      formula.textContent = 'cost/1M = (price/hr) / (tokens/sec × 3600) × 10⁶ = (' + price.toFixed(2) + ' / ' + fmtInt(tokensPerHr) + ') × 10⁶ = $' + costPerMillion.toFixed(3);
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'price', 'GPU price ($/hr)', 0.5, 12, 0.1),
      slider(state, 'tps', 'throughput (tokens/sec)', 100, 8000, 100)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['COST PER TOKEN']), el('span', {}, ['拖动 price 和 throughput'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [num, barWrap, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['Serving economics 可以归结为两个数字：GPU 每小时成本，以及它在这一小时内产生多少 tokens。每百万 tokens 成本，就是每小时价格除以每小时服务的 tokens 数，再缩放到一百万。吞吐量翻倍会让单位成本减半，这就是为什么 batching、quantization 和更快的 kernels 都会直接转化为更低的 per-token price。'])
    ]));
    state._render();
  }

  // ── roofline：arithmetic intensity 决定 memory-bound 与 compute-bound ──────
  function roofline(host) {
    var state = { logAI: 1.2 };
    var W = 520, H = 230, PAD = 40;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var PEAK = 1000;      // peak compute，GFLOP/s（任意单位）
    var BW = 8;           // memory bandwidth，GB/s 单位 -> attainable = BW * AI
    var ridge = PEAK / BW; // 两种 regime 相遇时的 arithmetic intensity
    var AIMIN = 0.5, AIMAX = 1000;
    function lx(ai) { return PAD + (Math.log10(ai) - Math.log10(AIMIN)) / (Math.log10(AIMAX) - Math.log10(AIMIN)) * (W - 2 * PAD); }
    function ly(perf) { return H - PAD - (Math.log10(perf) - Math.log10(8)) / (Math.log10(PEAK) - Math.log10(8)) * (H - 2 * PAD); }
    function attainable(ai) { return Math.min(PEAK, BW * ai); }
    state._render = function () {
      var ai = Math.pow(10, state.logAI);
      var perf = attainable(ai);
      var bound = ai < ridge ? 'memory-bound' : 'compute-bound';
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      // roofline：倾斜的 memory roof，接着是平坦的 compute roof
      var d = '', i, a;
      for (i = 0; i <= 100; i++) {
        a = Math.pow(10, Math.log10(AIMIN) + (Math.log10(AIMAX) - Math.log10(AIMIN)) * i / 100);
        d += (i ? 'L' : 'M') + lx(a).toFixed(1) + ' ' + ly(attainable(a)).toFixed(1) + ' ';
      }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      // ridge line
      var rx = lx(ridge);
      svg.appendChild(svgEl('line', { x1: rx, y1: PAD, x2: rx, y2: H - PAD, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      // kernel marker
      svg.appendChild(svgEl('circle', { cx: lx(ai), cy: ly(perf), r: '5', fill: 'var(--warn,#b8870f)' }));
      var rl = svgEl('text', { x: (rx + 4).toFixed(1), y: (PAD + 12).toFixed(1), 'font-family': 'monospace', 'font-size': '9', fill: 'var(--ink-mute,#777)' });
      rl.appendChild(document.createTextNode('ridge ' + ridge.toFixed(0) + ' FLOP/B'));
      svg.appendChild(rl);
      num.innerHTML = bound + ' <small>at AI ' + ai.toFixed(ai < 10 ? 1 : 0) + ' FLOP/B</small>';
      meta.textContent = 'attainable ' + perf.toFixed(0) + ' GFLOP/s  ·  ' + (ai < ridge ? '受 memory bandwidth 限制：需要更多 reuse 来喂饱它' : '正在让 compute units 饱和：接近 peak');
      formula.textContent = 'attainable = min(peak compute, bandwidth × AI)  ·  ridge at AI = peak/BW = ' + ridge.toFixed(0) + ' FLOP/byte';
    };
    var grid = el('div', {}, [slider(state, 'logAI', 'arithmetic intensity (10^x FLOP/byte)', -0.3, 3, 0.05)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['ROOFLINE']), el('span', {}, ['拖动 arithmetic intensity'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['Arithmetic intensity 是一个 kernel 每移动一个 byte 所执行的 FLOPs。左侧倾斜的 roof 表示性能受 memory bandwidth 限制；右侧平坦的 roof 表示性能受原始 compute 限制。ridge 是两者相遇的位置。位于 ridge 左下方的 kernel（橙色）是 memory-bound，修复方向是更多 data reuse，而不是更快的 chip。'])
    ]));
    state._render();
  }

  LF.register({
    'data-parallel': dataParallel,
    'tensor-parallel': tensorParallel,
    'pipeline-parallel': pipelineParallel,
    'zero-sharding': zeroSharding,
    'gpu-memory-breakdown': gpuMemoryBreakdown,
    'throughput-latency': throughputLatency,
    'autoscaling': autoscaling,
    'cost-per-token': costPerToken,
    'roofline': roofline
  });
})();
