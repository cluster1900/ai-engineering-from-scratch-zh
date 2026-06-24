/* figures-llms2.js：Phase 10 的第二批交互式课程图示
   （LLMs from scratch）。在 lesson-figures.js 之后加载，并通过
   window.LF.register 注册。Vanilla ES5，无依赖，通过 CSS vars 使用主题。写法
   与相同的 fenced block 一致：
       ```figure
       rmsnorm-vs-layernorm
       ``` */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl, slider = LF.slider, select = LF.select, fmtInt = LF.fmtInt;

  // ── rmsnorm-vs-layernorm：feature vector 上的 center+scale 与仅 scale 对比 ─
  function rmsnormVsLayernorm(host) {
    var feats = [2.4, -1.2, 0.8, 3.1, -0.6, 1.7];
    var state = { mode: 'rmsnorm', shift: 0 };
    var W = 520, H = 200, PAD = 28, N = feats.length;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function px(i) { return PAD + (i + 0.5) / N * (W - 2 * PAD); }
    function py(v) { return H / 2 - v * 22; }
    state._render = function () {
      var x = feats.map(function (f) { return f + state.shift; });
      var mean = x.reduce(function (a, b) { return a + b; }, 0) / N;
      var ss = x.reduce(function (a, b) { return a + b * b; }, 0) / N;
      var meanSq = x.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / N;
      var rms = Math.sqrt(ss + 1e-5);
      var std = Math.sqrt(meanSq + 1e-5);
      var out;
      if (state.mode === 'rmsnorm') { out = x.map(function (v) { return v / rms; }); }
      else { out = x.map(function (v) { return (v - mean) / std; }); }
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(0), x2: W - PAD, y2: py(0), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      var i;
      for (i = 0; i < N; i++) {
        svg.appendChild(svgEl('rect', { x: (px(i) - 9).toFixed(1), y: Math.min(py(0), py(x[i])).toFixed(1), width: '6', height: Math.abs(py(x[i]) - py(0)).toFixed(1), fill: 'var(--ink-mute,#999)', opacity: '0.6' }));
        svg.appendChild(svgEl('rect', { x: (px(i) + 3).toFixed(1), y: Math.min(py(0), py(out[i])).toFixed(1), width: '6', height: Math.abs(py(out[i]) - py(0)).toFixed(1), fill: 'var(--blueprint,#3553ff)' }));
      }
      var outMean = out.reduce(function (a, b) { return a + b; }, 0) / N;
      num.innerHTML = (state.mode === 'rmsnorm' ? 'RMS ' + rms.toFixed(2) : 'std ' + std.toFixed(2)) + ' <small>除数</small>';
      meta.textContent = state.mode === 'rmsnorm'
        ? '不做 mean subtraction：输出 mean ' + outMean.toFixed(2) + '（shift 会保留）· 更便宜，不做 centering'
        : '先减去 mean ' + mean.toFixed(2) + '：输出 mean ' + outMean.toFixed(2) + '（重新居中到 0）';
      formula.textContent = state.mode === 'rmsnorm'
        ? 'RMSNorm: xᵢ / sqrt(mean(x²) + ε)   ·   跳过 mean，保留 scale'
        : 'LayerNorm: (xᵢ − mean) / sqrt(var + ε)   ·   先 center 再 scale';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      select(state, 'mode', 'normalization', [['RMSNorm', 'rmsnorm'], ['LayerNorm', 'layernorm']]),
      slider(state, 'shift', '添加常量 shift', -2, 2, 0.1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['RMSNORM vs LAYERNORM']), el('span', {}, ['切换并调整 shift'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['灰色是原始 feature vector，蓝色是归一化后的输出。LayerNorm 先减去 mean，再除以标准差，把每个 Vector 重新居中到零。RMSNorm 完全跳过 mean，改为除以 root-mean-square，因此更便宜，并保留任何常量 shift。添加一个 shift，观察 LayerNorm 如何吸收它，而 RMSNorm 会让它通过。'])
    ]));
    state._render();
  }

  // ── swiglu-ffn：gate 路径调制 value 路径，与普通 ReLU 对比 ──────────
  function swigluFfn(host) {
    var state = { x: 1.2, mode: 'swiglu' };
    var W = 520, H = 200, PAD = 30;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var wV = 1.0, wG = 0.8;
    function swish(z) { return z / (1 + Math.exp(-z)); }
    function relu(z) { return z > 0 ? z : 0; }
    function out(x) {
      var v = x * wV;
      if (state.mode === 'swiglu') { return v * swish(x * wG); }
      return relu(v);
    }
    function px(x) { return PAD + (x + 4) / 8 * (W - 2 * PAD); }
    function py(y) { return H - PAD - (y + 4) / 8 * (H - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: px(-4), y1: py(0), x2: px(4), y2: py(0), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('line', { x1: px(0), y1: py(-4), x2: px(0), y2: py(4), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      var d = '', i;
      for (i = 0; i <= 160; i++) { var x = -4 + 8 * i / 160; d += (i ? 'L' : 'M') + px(x).toFixed(1) + ' ' + py(out(x)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      var y = out(state.x);
      svg.appendChild(svgEl('circle', { cx: px(state.x), cy: py(y), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      var v = state.x * wV, g = swish(state.x * wG);
      num.innerHTML = y.toFixed(3) + ' <small>输出</small>';
      meta.textContent = state.mode === 'swiglu'
        ? 'value 路径 ' + v.toFixed(2) + ' × gate swish(' + (state.x * wG).toFixed(2) + ') = ' + g.toFixed(2) + '  →  ' + y.toFixed(2)
        : '普通 FFN：ReLU(' + v.toFixed(2) + ') = ' + y.toFixed(2) + '（无 gate）';
      formula.textContent = state.mode === 'swiglu'
        ? 'SwiGLU: (x·W) ⊙ swish(x·V)   ·   gate 平滑调制 value'
        : 'ReLU FFN: max(0, x·W)   ·   硬截断，无第二路径';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      select(state, 'mode', 'feed-forward', [['SwiGLU (gated)', 'swiglu'], ['ReLU (plain)', 'relu']]),
      slider(state, 'x', '输入 x', -4, 4, 0.1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['SWIGLU FEED-FORWARD']), el('span', {}, ['切换并拖动 x'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['普通 FFN 会把输入经过一个 Matrix 和 ReLU：在零点形成硬折角。SwiGLU 从同一输入拆成两条路径，一个 value x·W 和一个 gate swish(x·V)，再把二者相乘。gate 会按坐标平滑地放大或缩小 value，给 network 一个柔性的、可学习的开关；现代开源模型更偏好这种方式，而不是平直的 ReLU。'])
    ]));
    state._render();
  }

  // ── rlhf-pipeline：SFT → reward model → PPO，三个阶段与数据流 ────
  function rlhfPipeline(host) {
    var state = { stage: 0 };
    var W = 520, H = 210, PAD = 18;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var STAGES = [
      { name: 'SFT', sub: 'supervised fine-tune', data: 'demonstrations', out: 'policy π₀' },
      { name: 'Reward', sub: '训练 reward model', data: 'preference pairs', out: 'reward r(x,y)' },
      { name: 'PPO', sub: 'RL 优化', data: 'prompts + reward', out: 'aligned policy π' }
    ];
    var DESC = [
      '阶段 1 — SFT：在人类编写的 demonstrations 上 fine-tune 基础模型，得到起始 policy。',
      '阶段 2 — Reward Model：在 chosen-vs-rejected pairs 上训练一个模型，用来为 response 的质量打分。',
      '阶段 3 — PPO：用 reward model 优化 policy，并加入回到 SFT policy 的 KL penalty。'
    ];
    function box(x, y, w, h, label, sub, active) {
      var g = svgEl('g', {});
      g.appendChild(svgEl('rect', { x: x, y: y, width: w, height: h, rx: '4',
        fill: active ? 'var(--blueprint,#3553ff)' : 'var(--bg-surface,#eee)',
        stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.2' }));
      var t = svgEl('text', { x: (x + w / 2).toFixed(1), y: (y + 20).toFixed(1), 'text-anchor': 'middle',
        'font-family': 'monospace', 'font-size': '12', fill: active ? 'var(--bg,#fafaf5)' : 'var(--ink,#1a1a1a)' });
      t.appendChild(document.createTextNode(label));
      g.appendChild(t);
      var s = svgEl('text', { x: (x + w / 2).toFixed(1), y: (y + 36).toFixed(1), 'text-anchor': 'middle',
        'font-family': 'monospace', 'font-size': '9', fill: active ? 'var(--bg,#fafaf5)' : 'var(--ink-mute,#777)' });
      s.appendChild(document.createTextNode(sub));
      g.appendChild(s);
      return g;
    }
    function caption(x, y, txt, st) {
      var t = svgEl('text', { x: x.toFixed(1), y: y.toFixed(1), 'text-anchor': 'middle',
        'font-family': 'monospace', 'font-size': '9.5', fill: st });
      t.appendChild(document.createTextNode(txt));
      return t;
    }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var bw = 134, bh = 48, gap = (W - 2 * PAD - 3 * bw) / 2, midY = 80;
      var i, xs = [];
      for (i = 0; i < 3; i++) { xs.push(PAD + i * (bw + gap)); }
      for (i = 0; i < 3; i++) {
        svg.appendChild(box(xs[i], midY, bw, bh, STAGES[i].name, STAGES[i].sub, i === state.stage));
        svg.appendChild(caption(xs[i] + bw / 2, midY - 14, STAGES[i].data + ' →', 'var(--ink-mute,#777)'));
        svg.appendChild(caption(xs[i] + bw / 2, midY + bh + 18, '→ ' + STAGES[i].out, 'var(--ink-soft,#555)'));
        if (i < 2) {
          var ax = xs[i] + bw, bx = xs[i + 1];
          svg.appendChild(svgEl('line', { x1: ax, y1: midY + bh / 2, x2: bx, y2: midY + bh / 2, stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
          svg.appendChild(svgEl('polygon', { points: bx + ',' + (midY + bh / 2) + ' ' + (bx - 8) + ',' + (midY + bh / 2 - 4) + ' ' + (bx - 8) + ',' + (midY + bh / 2 + 4), fill: 'var(--blueprint,#3553ff)' }));
        }
      }
      meta.textContent = DESC[state.stage];
      formula.textContent = 'SFT(demos) → RM(preferences) → PPO(maximize reward − β·KL[π ‖ π₀])';
    };
    var grid = el('div', {}, [slider(state, 'stage', 'pipeline stage', 0, 2, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['RLHF PIPELINE']), el('span', {}, ['逐步查看各阶段'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['RLHF 分三个阶段运行。首先，supervised fine-tuning 通过人类 demonstrations 教基础模型遵循指令。然后，reward model 从 preference pairs 中学习为 responses 打分。最后，PPO 优化 policy 以最大化该 reward，同时 KL penalty 让它保持接近 SFT model，避免漂移到 reward hacking。'])
    ]));
    state._render();
  }

  // ── dpo-loss：chosen 与 rejected 之间的 margin，由 beta 缩放 ───────────
  function dpoLoss(host) {
    var state = { beta: 0.3, gap: 0.0 };
    var W = 520, H = 200, PAD = 32, GMAX = 6;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
    function loss(gap, beta) { return -Math.log(sigmoid(beta * gap)); }
    function px(g) { return PAD + (g + GMAX) / (2 * GMAX) * (W - 2 * PAD); }
    var LMAX = loss(-GMAX, state.beta);
    function py(l, lmax) { return H - PAD - Math.min(l, lmax) / lmax * (H - 2 * PAD); }
    state._render = function () {
      var beta = state.beta;
      var lmax = Math.max(0.5, loss(-GMAX, beta));
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: px(0), y1: PAD, x2: px(0), y2: H - PAD, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      var d = '', i;
      for (i = 0; i <= 160; i++) { var g = -GMAX + 2 * GMAX * i / 160; d += (i ? 'L' : 'M') + px(g).toFixed(1) + ' ' + py(loss(g, beta), lmax).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      var l = loss(state.gap, beta);
      svg.appendChild(svgEl('circle', { cx: px(state.gap), cy: py(l, lmax), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      num.innerHTML = l.toFixed(3) + ' <small>DPO loss</small>';
      meta.textContent = state.gap > 0.5 ? 'chosen 领先 rejected：Loss 较小，模型已经更偏好正确答案'
        : state.gap < -0.5 ? 'rejected 领先 chosen：Loss 较大，需要强 Gradient 来修正'
          : '平局：Loss ≈ ' + loss(0, beta).toFixed(2) + '（−log ½ 由 β 缩放）';
      formula.textContent = 'L = −log σ( β · ( (logπ(yc) − logπref(yc)) − (logπ(yr) − logπref(yr)) ) )   ·   β = ' + beta.toFixed(2);
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'beta', 'β (KL strength)', 0.05, 1.0, 0.05),
      slider(state, 'gap', 'chosen − rejected margin', -GMAX, GMAX, 0.1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['DPO LOSS']), el('span', {}, ['拖动 β 和 margin'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['DPO 跳过单独的 reward model：它直接训练 policy，使 chosen response 的得分高于 rejected response，二者都相对于冻结的 reference 来衡量。Loss 是 β 乘以该 margin 后的 −log σ。正 margin（chosen 领先）会把 Loss 推向零；负 margin 会产生较大的 Gradient。β 控制隐式 KL constraint 向 reference 拉回的力度。'])
    ]));
    state._render();
  }

  // ── paged-kv-cache：固定 pages 与 contiguous 对比，fragmentation 和 waste ─────
  function pagedKvCache(host) {
    var state = { seq: 70, page: 16 };
    var W = 520, H = 210, PAD = 18;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var bar = el('i');
    var barWrap = el('div', { class: 'lf-bar' }, [bar]);
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var SLOTS = 128; // contiguous reservation 必须按最大长度过量分配
    var MAXLEN = 128;
    state._render = function () {
      var seq = state.seq, page = state.page;
      var pages = Math.ceil(seq / page);
      var paged = pages * page;
      var pagedWaste = paged - seq;
      var contigWaste = MAXLEN - seq; // contiguous 会预先保留完整最大长度
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var cols = 32, cw = (W - 2 * PAD) / cols, ch = 12;
      // contiguous 行：一个 MAXLEN reservation，已使用部分为蓝色，reserved-but-empty 为灰色
      var rowY = 40, i;
      var ttop = svgEl('text', { x: PAD, y: (rowY - 8).toFixed(1), 'font-family': 'monospace', 'font-size': '10', fill: 'var(--ink-mute,#777)' });
      ttop.appendChild(document.createTextNode('contiguous：预先保留最大长度'));
      svg.appendChild(ttop);
      for (i = 0; i < MAXLEN; i++) {
        var cx = PAD + (i % cols) * cw, cy = rowY + Math.floor(i / cols) * (ch + 2);
        svg.appendChild(svgEl('rect', { x: cx.toFixed(1), y: cy.toFixed(1), width: (cw - 2).toFixed(1), height: ch, rx: '1',
          fill: i < seq ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#ccc)', opacity: i < seq ? '0.9' : '0.5' }));
      }
      // paged 行：按需分配 pages，只有最后一个 page 部分浪费
      var rowY2 = rowY + 4 * (ch + 2) + 30;
      var tbot = svgEl('text', { x: PAD, y: (rowY2 - 8).toFixed(1), 'font-family': 'monospace', 'font-size': '10', fill: 'var(--ink-mute,#777)' });
      tbot.appendChild(document.createTextNode('paged：' + pages + ' 个 page，每个 ' + page + '，只有最后一个部分空闲'));
      svg.appendChild(tbot);
      for (i = 0; i < paged; i++) {
        var px2 = PAD + (i % cols) * cw, py2 = rowY2 + Math.floor(i / cols) * (ch + 2);
        var usedCell = i < seq;
        svg.appendChild(svgEl('rect', { x: px2.toFixed(1), y: py2.toFixed(1), width: (cw - 2).toFixed(1), height: ch, rx: '1',
          fill: usedCell ? 'var(--blueprint,#3553ff)' : 'var(--warn,#b8870f)', opacity: usedCell ? '0.9' : '0.55' }));
        if (i % page === 0) {
          svg.appendChild(svgEl('line', { x1: px2.toFixed(1), y1: py2.toFixed(1), x2: px2.toFixed(1), y2: (py2 + ch).toFixed(1), stroke: 'var(--ink,#1a1a1a)', 'stroke-width': '1' }));
        }
      }
      var savedPct = Math.round((1 - paged / MAXLEN) * 100);
      num.innerHTML = pagedWaste + ' <small>cells wasted (paged)</small>';
      bar.style.width = Math.max(2, Math.min(100, savedPct)) + '%';
      meta.textContent = 'contiguous 浪费 ' + contigWaste + ' 个已保留 cell · paged 只浪费 ' + pagedWaste
        + '（最后一个 page）· 已保留内存减少 ' + savedPct + '%';
      formula.textContent = 'pages = ⌈seq / page⌉ = ⌈' + seq + ' / ' + page + '⌉ = ' + pages
        + '  ·  每个 sequence 的 internal waste ≤ page − 1，而不是 max − seq';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'seq', 'sequence length', 1, MAXLEN, 1),
      slider(state, 'page', 'page (block) size', 4, 32, 4)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['PAGED KV CACHE']), el('span', {}, ['拖动 length 和 page size'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, barWrap, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['contiguous KV cache 会为每个 request 预先保留完整的最大 sequence length，所以大部分空间会空着（灰色）。PagedAttention 把 cache 存在按需分配的固定大小 pages 中：只有最终 page 会部分空闲（橙色）。Internal waste 从 max 减 length 降到最多一个 page，这就是 paged caches 能在同一块 GPU 上容纳更多并发 sequences 的原因。'])
    ]));
    state._render();
  }

  // ── expert-capacity：capacity factor 与 tokens，对比 dropped 和 wasted slots ─────
  function expertCapacity(host) {
    var state = { cap: 1.25, tokens: 64 };
    var W = 520, H = 200, PAD = 24, E = 8;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // 确定性的倾斜 routing：expert e 获得固定比例的 Tokens
    var SHARE = [0.22, 0.18, 0.15, 0.13, 0.11, 0.09, 0.07, 0.05];
    state._render = function () {
      var T = state.tokens, cap = state.cap;
      var perExpert = Math.floor(cap * T / E); // 每个 expert 的 capacity slots
      var loads = SHARE.map(function (s) { return Math.round(s * T); });
      var sum = loads.reduce(function (a, b) { return a + b; }, 0);
      loads[0] += (T - sum); // 保持 total 精确等于 T
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var bw = (W - 2 * PAD) / E - 8, dropped = 0, wasted = 0, e;
      var maxBar = H - 2 * PAD;
      var capRef = Math.max(1, Math.max.apply(null, loads), perExpert);
      var capY = H - PAD - perExpert / capRef * maxBar;
      for (e = 0; e < E; e++) {
        var x = PAD + e * ((W - 2 * PAD) / E) + 4;
        var load = loads[e];
        var routed = Math.min(load, perExpert);
        var over = Math.max(0, load - perExpert);
        dropped += over; wasted += Math.max(0, perExpert - load);
        var hUsed = routed / capRef * maxBar;
        svg.appendChild(svgEl('rect', { x: x.toFixed(1), y: (H - PAD - hUsed).toFixed(1), width: bw.toFixed(1), height: hUsed.toFixed(1), fill: 'var(--blueprint,#3553ff)', opacity: '0.9' }));
        if (over > 0) {
          var hOver = over / capRef * maxBar;
          svg.appendChild(svgEl('rect', { x: x.toFixed(1), y: (H - PAD - hUsed - hOver).toFixed(1), width: bw.toFixed(1), height: hOver.toFixed(1), fill: 'var(--warn,#b8870f)', opacity: '0.7' }));
        }
      }
      svg.appendChild(svgEl('line', { x1: PAD, y1: capY.toFixed(1), x2: W - PAD, y2: capY.toFixed(1), stroke: 'var(--ink,#1a1a1a)', 'stroke-width': '1', 'stroke-dasharray': '4 3' }));
      num.innerHTML = dropped + ' <small>tokens dropped</small>';
      meta.textContent = 'capacity ' + perExpert + ' / expert · dropped ' + dropped + '（overflow，橙色）· idle ' + wasted
        + ' slots（wasted compute）· ' + (cap < 1 ? '过紧' : cap > 1.5 ? '过松' : '均衡');
      formula.textContent = 'capacity = ⌊capacity_factor · tokens / experts⌋ = ⌊' + cap.toFixed(2) + ' · ' + T + ' / ' + E + '⌋ = ' + perExpert;
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'cap', 'capacity factor', 0.5, 2.0, 0.05),
      slider(state, 'tokens', 'batch 中的 Tokens', 16, 128, 8)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['EXPERT CAPACITY']), el('span', {}, ['拖动 capacity 和 tokens'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['MoE layer 中的每个 expert 都有固定数量的 Token slots，由 capacity factor 决定。Routing 不均匀，因此热门 experts 会 overflow，额外的 Tokens 会被丢弃（虚线上方的橙色）。factor 设得过低会丢弃许多 Tokens；设得过高则轻载 experts 会空闲，浪费 padded compute。这个 factor 需要调到让两者都较小。'])
    ]));
    state._render();
  }

  // ── sliding-window-attention：宽度为 w 的 banded mask 与完整 O(N^2) 对比 ────────
  function slidingWindowAttention(host) {
    var state = { window: 4 };
    var W = 520, H = 240, PAD = 24, N = 16;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var GRID = 200;
    state._render = function () {
      var w = state.window;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var ox = PAD, oy = (H - GRID) / 2, cell = GRID / N;
      var active = 0, full = 0, i, j;
      for (i = 0; i < N; i++) {
        for (j = 0; j < N; j++) {
          var causal = j <= i;
          if (causal) full++;
          var inWindow = causal && (i - j) < w;
          if (inWindow) active++;
          var fill;
          if (inWindow) fill = 'var(--blueprint,#3553ff)';
          else if (causal) fill = 'var(--rule-soft,#ccc)';
          else fill = 'var(--bg,#fafaf5)';
          svg.appendChild(svgEl('rect', { x: (ox + j * cell).toFixed(1), y: (oy + i * cell).toFixed(1),
            width: (cell - 1).toFixed(1), height: (cell - 1).toFixed(1),
            fill: fill, opacity: inWindow ? '0.9' : '0.5' }));
        }
      }
      svg.appendChild(svgEl('rect', { x: ox, y: oy.toFixed(1), width: GRID, height: GRID, fill: 'none', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1' }));
      var saved = Math.round((1 - active / full) * 100);
      num.innerHTML = active + ' <small>of ' + full + ' attended pairs</small>';
      meta.textContent = 'window w = ' + w + ' · 每个 Token 看到前面 ' + (w - 1) + ' 个以及自身 · '
        + '相比完整 causal attention，pairs 减少 ' + saved + '%';
      formula.textContent = 'attend(i, j) iff 0 ≤ i − j < w   ·   当 w ≪ N 时，cost O(N·w) vs full O(N²)';
    };
    var grid = el('div', {}, [slider(state, 'window', 'window size w', 1, N, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['SLIDING WINDOW ATTENTION']), el('span', {}, ['拖动 window width'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['行是 queries，列是 keys。蓝色 cells 是 Token 实际 attend 的 pairs；灰色 cells 位于 causal triangle 内，但被 window 截掉；白色是未来，始终被 mask。完整 causal Attention 会填满整个下三角，成本为 O(N²)。宽度为 w 的 sliding window 只保留带状对角线，使成本降到 O(N·w)，因此长 context 仍可负担。'])
    ]));
    state._render();
  }

  // ── differential-attention：两个 softmax maps 相减，λ 抵消 noise ────
  function differentialAttention(host) {
    var state = { lambda: 0.6 };
    var W = 520, H = 200, PAD = 30, N = 8;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // map1：Token 2 处的真实 signal peak 加上宽泛 noise；map2：相同的宽泛 noise
    var sig = [0.04, 0.06, 0.55, 0.07, 0.05, 0.07, 0.06, 0.10];
    var noise = [0.10, 0.13, 0.11, 0.14, 0.12, 0.15, 0.13, 0.12];
    function norm(a) { var s = a.reduce(function (x, y) { return x + y; }, 0); return a.map(function (v) { return v / s; }); }
    state._render = function () {
      var lam = state.lambda;
      var m1 = norm(sig.map(function (v, i) { return v + noise[i]; }));
      var m2 = norm(noise.slice());
      var diff = m1.map(function (v, i) { return Math.max(0, v - lam * m2[i]); });
      var ds = diff.reduce(function (a, b) { return a + b; }, 0) || 1;
      var out = diff.map(function (v) { return v / ds; });
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var cw = (W - 2 * PAD) / N;
      var i, peak = out[2];
      var maxV = Math.max.apply(null, out.concat(m1));
      for (i = 0; i < N; i++) {
        var x = PAD + i * cw;
        var h1 = m1[i] / maxV * 60;
        svg.appendChild(svgEl('rect', { x: (x + 2).toFixed(1), y: (90 - h1).toFixed(1), width: (cw / 2 - 3).toFixed(1), height: h1.toFixed(1), fill: 'var(--ink-mute,#999)', opacity: '0.6' }));
        var ho = out[i] / maxV * 60;
        svg.appendChild(svgEl('rect', { x: (x + cw / 2).toFixed(1), y: (170 - ho).toFixed(1), width: (cw / 2 - 3).toFixed(1), height: ho.toFixed(1), fill: 'var(--blueprint,#3553ff)' }));
      }
      var t1 = svgEl('text', { x: PAD, y: '24', 'font-family': 'monospace', 'font-size': '9.5', fill: 'var(--ink-mute,#777)' });
      t1.appendChild(document.createTextNode('map 1（signal + noise）'));
      svg.appendChild(t1);
      var t2 = svgEl('text', { x: PAD, y: '104', 'font-family': 'monospace', 'font-size': '9.5', fill: 'var(--blueprint,#3553ff)' });
      t2.appendChild(document.createTextNode('map1 − λ·map2（去噪后）'));
      svg.appendChild(t2);
      num.innerHTML = (peak * 100).toFixed(0) + ' <small>% mass on the true token</small>';
      meta.textContent = lam < 0.3 ? 'λ 较小：减去得少，宽泛 noise 仍会保留'
        : lam > 0.9 ? 'λ 较大：激进抵消，signal 更尖锐'
          : 'λ = ' + lam.toFixed(2) + '：common-mode noise 被抵消，真实 peak 凸显出来';
      formula.textContent = 'Attn = softmax(Q₁K₁) − λ · softmax(Q₂K₂)   ·   shared noise 被减去，signal 保留下来';
    };
    var grid = el('div', {}, [slider(state, 'lambda', 'λ (subtraction weight)', 0, 1.0, 0.05)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['DIFFERENTIAL ATTENTION']), el('span', {}, ['拖动 λ'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['Differential attention 会计算两个独立的 softmax maps，并从第一个中减去按学习得到的 λ 缩放后的第二个。两个 maps 都携带相同的宽泛 Attention noise，因此相减会把它作为 common mode 抵消，而真正的 signal peak（这里是 token 2）会保留。提高 λ 会更激进地相减，把 mass 更尖锐地集中到相关 Token 上，而不是分散到无关 context 中。'])
    ]));
    state._render();
  }

  // ── weight-tying：复用 embedding matrix 作为 output projection ──────
  function weightTying(host) {
    var state = { logV: 15, dim: 768 };
    var W = 520, H = 190, PAD = 22;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function human(x) { var u = ['', 'K', 'M', 'B']; var i = 0; while (x >= 1000 && i < u.length - 1) { x /= 1000; i++; } return x.toFixed(x < 10 ? 1 : 0) + u[i]; }
    function box(x, y, w, h, label, fill) {
      var g = svgEl('g', {});
      g.appendChild(svgEl('rect', { x: x, y: y, width: w, height: h, rx: '3', fill: fill, stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.2' }));
      var t = svgEl('text', { x: (x + w / 2).toFixed(1), y: (y + h / 2 + 4).toFixed(1), 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': '10.5', fill: 'var(--ink,#1a1a1a)' });
      t.appendChild(document.createTextNode(label));
      g.appendChild(t);
      return g;
    }
    state._render = function () {
      var vocab = Math.pow(2, state.logV), d = state.dim;
      var saved = vocab * d;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(box(PAD, 30, 150, 44, 'input embedding', 'var(--blueprint,#3553ff)'));
      svg.appendChild(box(W - PAD - 150, 116, 150, 44, 'output projection', 'var(--blueprint,#3553ff)'));
      // tie 箭头：复用同一个 Matrix（转置后）
      svg.appendChild(svgEl('line', { x1: PAD + 75, y1: 74, x2: W - PAD - 75, y2: 116, stroke: 'var(--warn,#b8870f)', 'stroke-width': '2', 'stroke-dasharray': '5 3' }));
      var tt = svgEl('text', { x: (W / 2).toFixed(1), y: '100', 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': '10', fill: 'var(--warn,#b8870f)' });
      tt.appendChild(document.createTextNode('tied：同一个 V×d Matrix，转置后使用'));
      svg.appendChild(tt);
      num.innerHTML = human(saved) + ' <small>params saved</small>';
      meta.textContent = 'vocab ' + human(vocab) + ' × dim ' + d + ' = 用一个 Matrix 替代两个 · readout 复用 Embedding';
      formula.textContent = 'logits = h · Eᵀ   ·   saved = vocab × d_model = ' + human(vocab) + ' × ' + d + ' = ' + human(saved);
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'logV', 'vocabulary (2^x)', 10, 18, 1),
      slider(state, 'dim', 'model dim d', 128, 4096, 128)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['WEIGHT TYING']), el('span', {}, ['拖动 vocab 和 dim'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['input Embedding 会把每个 Token id 映射到 d 维 Vector；output projection 会把 hidden Vector 映射回 vocabulary 中每个条目的 logit。二者都是 vocab×d Matrix，扮演互逆角色，因此许多模型会把它们 tie 在一起：output layer 复用转置后的 Embedding。这会移除整块 vocab×d_model 参数；当 vocabulary 宽达数万 Tokens 时，节省非常可观。'])
    ]));
    state._render();
  }

  LF.register({
    'rmsnorm-vs-layernorm': rmsnormVsLayernorm,
    'swiglu-ffn': swigluFfn,
    'rlhf-pipeline': rlhfPipeline,
    'dpo-loss': dpoLoss,
    'paged-kv-cache': pagedKvCache,
    'expert-capacity': expertCapacity,
    'sliding-window-attention': slidingWindowAttention,
    'differential-attention': differentialAttention,
    'weight-tying': weightTying
  });
})();
