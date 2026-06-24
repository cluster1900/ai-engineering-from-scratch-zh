/* figures-llms-systems.js: Phase 10（从零构建 LLMs）、
   Phase 12（Multimodal）和 Phase 13（tools 与 protocols）的交互式课程图示。
   在 lesson-figures.js 之后加载，并通过 window.LF.register 注册。Vanilla ES5，
   无 deps，通过 CSS vars 设置 theme。编写方式使用相同的 fenced block：
       ```figure
       beam-search
       ``` */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl, slider = LF.slider;

  // ── beam-search：每一步保留累计 logprob 最高的 top-B 序列 ─────
  function beamSearch(host) {
    var state = { B: 3, steps: 4 };
    var W = 520, H = 240, PAD = 26;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // 任意 node 的候选子项使用确定性的逐步 log-probs
    var STEP_LP = [-0.22, -0.51, -0.92, -1.39, -1.90];
    function px(s) { return PAD + s / state.steps * (W - 2 * PAD); }
    function py(rank, rows) { return PAD + (rank + 0.5) / rows * (H - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var B = state.B, rows = B;
      // 每个存活 beam 是一个累计 log-prob；root 是 log-prob 为 0 的一个 beam
      var beams = [{ lp: 0, y: py(0, 1), x: px(0) }];
      var s, kept = 1;
      for (s = 1; s <= state.steps; s++) {
        var cands = [];
        beams.forEach(function (b) {
          for (var c = 0; c < B; c++) { cands.push({ lp: b.lp + STEP_LP[c], from: b }); }
        });
        cands.sort(function (a, z) { return z.lp - a.lp; });
        var survivors = cands.slice(0, B);
        survivors.forEach(function (c, r) {
          c.x = px(s); c.y = py(r, B);
          svg.appendChild(svgEl('line', { x1: c.from.x, y1: c.from.y, x2: c.x, y2: c.y,
            stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.4', opacity: '0.55' }));
        });
        // 被丢弃的候选项淡出显示
        cands.slice(B).forEach(function (c, r) {
          var dy = py(B + r, B + cands.length - B);
          svg.appendChild(svgEl('line', { x1: c.from.x, y1: c.from.y, x2: px(s), y2: dy,
            stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1', 'stroke-dasharray': '3 3', opacity: '0.5' }));
        });
        beams = survivors; kept = survivors.length;
      }
      // 将保留下来的 nodes 绘制在最上层
      beams.forEach(function (b) {
        svg.appendChild(svgEl('circle', { cx: b.x, cy: b.y, r: '4', fill: 'var(--blueprint,#3553ff)' }));
      });
      svg.appendChild(svgEl('circle', { cx: px(0), cy: py(0, 1), r: '5', fill: 'var(--ink,#1a1a1a)' }));
      var best = beams[0].lp;
      meta.textContent = (B === 1 ? 'B = 1 是 greedy decoding' : '每一步保留 B = ' + B + ' 个 beams')
        + '  ·  最佳序列 log-prob ' + best.toFixed(2);
      formula.textContent = '将每个 beam 扩展为 B 个子项，按 Σ log p 打分，保留 top ' + B + '  ·  ' + state.steps + ' 步';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'B', 'beam width B', 1, 5, 1),
      slider(state, 'steps', 'decode 步数', 1, 5, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['BEAM SEARCH']), el('span', {}, ['拖动 beam width'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['每一步都会把每个存活 beam 扩展成 B 个候选 continuation，用累计 log-probability 评分，并且只保留最好的 B 个。Greedy decoding 是 B 等于 1 的特殊情况：只有一条路径，没有回溯。更宽的 beams 会探索更多路径，但 compute 成本也会按比例增加。'])
    ]));
    state._render();
  }

  // ── speculative-decoding：draft length、acceptance rate 与最终 speedup ─
  function speculativeDecoding(host) {
    var state = { gamma: 4, accept: 0.7 };
    var rows = el('div', {});
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var g = state.gamma, a = state.accept;
      // 第一次拒绝前的期望 accepted prefix length（verifier 仍会
      // 发出一个 correction token），上限为 g；如果全部 g 个通过，再加 bonus token
      var expAcc = 0, prob = 1, i;
      for (i = 1; i <= g; i++) { expAcc += prob * a; prob *= a; }
      var allPass = Math.pow(a, g);
      // 每次 verify pass 产生的 tokens：accepted run + 1（correction 或 bonus）
      var tokensPerPass = expAcc + 1;
      // 一次 verify pass 替代 tokensPerPass 个顺序 target 步骤
      var speedup = tokensPerPass;
      while (rows.firstChild) rows.removeChild(rows.firstChild);
      // g 个 draft tokens 的可视行：到 floor(expAcc) 为止显示 accepted（蓝色），然后一个 verify token
      var acceptedShown = Math.min(g, Math.round(expAcc));
      var strip = el('div', { class: 'lf-grid' });
      for (i = 0; i < g; i++) {
        var on = i < acceptedShown;
        var b = el('i'); b.style.width = '100%';
        if (!on) b.style.background = 'var(--rule-soft,#ccc)';
        var lab = el('label', {}, ['draft ' + (i + 1), el('b', {}, [on ? '接受' : '拒绝'])]);
        if (!on) lab.style.opacity = '0.45';
        strip.appendChild(el('div', { class: 'lf-ctrl' }, [lab, el('div', { class: 'lf-bar' }, [b])]));
      }
      rows.appendChild(strip);
      num.innerHTML = speedup.toFixed(2) + ' <small>x tokens / verify pass</small>';
      meta.textContent = '期望接受 ' + expAcc.toFixed(2) + ' / ' + g + ' 个 drafts  ·  全部 ' + g
        + ' 个通过概率 ' + (allPass * 100).toFixed(0) + '%  ·  每次 pass 由 target 额外生成 1 个 token';
      formula.textContent = 'draft γ = ' + g + ' tokens，在一次 target pass 中 verify，accept rate α = ' + a.toFixed(2)
        + '  →  每次 target call 约 ' + speedup.toFixed(2) + ' tokens';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'gamma', 'draft length γ', 1, 8, 1),
      slider(state, 'accept', 'acceptance rate α', 0.1, 0.99, 0.01)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['SPECULATIVE DECODING']), el('span', {}, ['拖动 draft 与 accept rate'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [rows, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['一个小型 draft model 以低成本提出 γ 个 tokens；大型 target model 在一次并行 pass 中 verify 它们，接受最长的正确 prefix，然后自己再发出一个 token。一致率越高，被接受的 run 越长，每次 pass 能替代的 target calls 也越多。'])
    ]));
    state._render();
  }

  // ── moe-routing：tokens 到 top-k experts，active vs total params，balance ──
  function moeRouting(host) {
    var state = { experts: 8, topk: 2 };
    var W = 520, H = 200, PAD = 24;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var bar = el('i');
    var barWrap = el('div', { class: 'lf-bar' }, [bar]);
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var TOKENS = 6;
    // 确定性 routing：token t 偏好的 experts 从 (t*3) mod E 开始
    function routeOf(t, E, k) {
      var picks = [], j;
      for (j = 0; j < k; j++) { picks.push((t * 3 + j) % E); }
      return picks;
    }
    state._render = function () {
      var E = state.experts, k = Math.min(state.topk, E);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var tokX = PAD, expX = W - PAD - 8;
      var load = [], e;
      for (e = 0; e < E; e++) { load.push(0); }
      var t;
      for (t = 0; t < TOKENS; t++) {
        var ty = PAD + (t + 0.5) / TOKENS * (H - 2 * PAD);
        svg.appendChild(svgEl('circle', { cx: tokX, cy: ty, r: '4', fill: 'var(--ink,#1a1a1a)' }));
        var picks = routeOf(t, E, k);
        picks.forEach(function (pe) {
          load[pe]++;
          var ey = PAD + (pe + 0.5) / E * (H - 2 * PAD);
          svg.appendChild(svgEl('line', { x1: tokX + 4, y1: ty, x2: expX, y2: ey,
            stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1', opacity: '0.5' }));
        });
      }
      for (e = 0; e < E; e++) {
        var ey = PAD + (e + 0.5) / E * (H - 2 * PAD);
        var busy = load[e] > 0;
        svg.appendChild(svgEl('rect', { x: expX, y: ey - 5, width: '8', height: '10',
          fill: busy ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#ccc)' }));
      }
      var activeFrac = k / E;
      num.innerHTML = (activeFrac * 100).toFixed(0) + ' <small>% 的 expert params 处于 active</small>';
      bar.style.width = (activeFrac * 100).toFixed(0) + '%';
      // load balance：理想状态是每个 expert 承担 TOKENS*k/E；报告 max/avg imbalance
      var avg = TOKENS * k / E;
      var mx = Math.max.apply(null, load);
      var imbal = avg > 0 ? mx / avg : 1;
      barWrap.classList.toggle('over', imbal > 1.6);
      meta.textContent = '每个 token 路由到 ' + E + ' 个 experts 中的 top-' + k + '  ·  load imbalance (max/avg) ' + imbal.toFixed(2)
        + (imbal > 1.6 ? '  ·  需要 balancing loss' : '  ·  相对均衡');
      formula.textContent = 'active fraction = k / E = ' + k + ' / ' + E + ' = ' + (activeFrac * 100).toFixed(0)
        + '%  ·  total params 不变，compute 随 k 缩放';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'experts', 'experts E', 2, 12, 1),
      slider(state, 'topk', 'top-k routed', 1, 4, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['MIXTURE OF EXPERTS']), el('span', {}, ['拖动 experts 和 k'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, barWrap, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['router 会把每个 token 发送到 E 个 experts 中的 top-k。每个 token 只运行 E 个 expert blocks 中的 k 个，因此 active compute 是 k over E 这个 fraction，虽然每个 parameter 仍然保存在 memory 中。不均匀 routing 会让少数 experts 过载，这就是 MoE training 要加入 load-balancing loss 的原因。'])
    ]));
    state._render();
  }

  // ── context-window-slide：超出固定 window 的 tokens 会被丢弃 ─────────
  function contextWindowSlide(host) {
    var state = { seq: 14, window: 8 };
    var W = 520, H = 130, PAD = 20;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var MAX = 24;
    state._render = function () {
      var n = state.seq, win = state.window;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var firstKept = Math.max(0, n - win);
      var cw = (W - 2 * PAD) / MAX;
      var bw = cw * 0.82, gap = cw * 0.18;
      var y = PAD + 18;
      var i;
      for (i = 0; i < n; i++) {
        var x = PAD + i * cw + gap / 2;
        var inWin = i >= firstKept;
        svg.appendChild(svgEl('rect', { x: x.toFixed(1), y: y, width: bw.toFixed(1), height: '28', rx: '2',
          fill: inWin ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#ccc)',
          opacity: inWin ? '1' : '0.6' }));
      }
      // window bracket
      var wx0 = PAD + firstKept * cw, wx1 = PAD + n * cw;
      svg.appendChild(svgEl('rect', { x: wx0.toFixed(1), y: (y - 8).toFixed(1),
        width: (wx1 - wx0).toFixed(1), height: '44', fill: 'none',
        stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5' }));
      var dropped = Math.max(0, n - win);
      num.innerHTML = dropped + ' <small>tokens 被丢弃</small>';
      meta.textContent = 'sequence ' + n + ' tokens · window ' + win + '  ·  '
        + (dropped > 0 ? '最旧的 ' + dropped + ' 个超出 rolling context' : '全部仍能放入');
      formula.textContent = 'Attention 只能看到最后 ' + win + ' 个位置；index '
        + firstKept + ' 之前的 tokens 不再被 attend';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'seq', 'sequence length', 1, MAX, 1),
      slider(state, 'window', 'context window', 1, 16, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['CONTEXT WINDOW']), el('span', {}, ['拖动 length 直到超过 window'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['模型只能在固定 window 上做 attend。随着 sequence 长度超过它，最旧的 tokens 会滑出橙色框，并且不再对 Attention 可见。这就是 rolling context：近期 tokens 保留，早期 tokens 会被遗忘，除非它们被 summarization 或 retrieval 带回。'])
    ]));
    state._render();
  }

  // ── perplexity-loss：perplexity = e^loss，随机猜 V 的 perplexity 为 V ───────────────
  function perplexityLoss(host) {
    var state = { loss: 2.0, logV: 4.7 };
    var W = 520, H = 200, PAD = 32, LMAX = 7;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function human(x) { var u = ['', 'K', 'M']; var i = 0; while (x >= 1000 && i < u.length - 1) { x /= 1000; i++; } return x.toFixed(x < 10 ? 1 : 0) + u[i]; }
    function px(l) { return PAD + l / LMAX * (W - 2 * PAD); }
    var PPMAX = Math.exp(LMAX);
    function py(pp) { return H - PAD - Math.log(pp) / Math.log(PPMAX) * (H - 2 * PAD); }
    state._render = function () {
      var loss = state.loss, V = Math.pow(10, state.logV);
      var pp = Math.exp(loss);
      var randomLoss = Math.log(V);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var d = '', i;
      for (i = 0; i <= 120; i++) { var l = LMAX * i / 120; d += (i ? 'L' : 'M') + px(l).toFixed(1) + ' ' + py(Math.exp(l)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      // random baseline：loss = ln V 处的竖线
      var rx = px(Math.min(LMAX, randomLoss));
      svg.appendChild(svgEl('line', { x1: rx, y1: PAD, x2: rx, y2: H - PAD,
        stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5', 'stroke-dasharray': '4 3' }));
      svg.appendChild(svgEl('circle', { cx: px(Math.min(LMAX, loss)), cy: py(pp), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      num.innerHTML = (pp < 1000 ? pp.toFixed(pp < 10 ? 2 : 0) : human(pp)) + ' <small>perplexity</small>';
      meta.textContent = 'cross-entropy ' + loss.toFixed(2) + ' nats  ·  在 V = ' + human(V)
        + ' 上随机猜测的 loss ln V = ' + randomLoss.toFixed(2) + '，perplexity ' + human(V);
      formula.textContent = 'perplexity = e^loss   ·   对 V 个 tokens 做 uniform guess 的 loss 是 ln V，perplexity 正好是 V';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'loss', 'cross-entropy loss (nats)', 0.1, 7.0, 0.05),
      slider(state, 'logV', 'vocabulary V (10^x)', 2, 5.5, 0.1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['PERPLEXITY']), el('span', {}, ['拖动 loss'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['Perplexity 是 cross-entropy loss 的指数，可以理解为模型在每个 token 上需要区分的等可能选择的有效数量。如果模型在大小为 V 的 vocabulary 上 uniform guess，它的 perplexity 正好是 V（橙色线），所以任何有用的模型都必须明显低于这条线。'])
    ]));
    state._render();
  }

  // ── continuous-batching：GPU slots 的 static vs continuous 填充 ────────────
  function continuousBatching(host) {
    var state = { mode: 'continuous', slots: 4 };
    var W = 520, H = 200, PAD = 26;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var bar = el('i');
    var barWrap = el('div', { class: 'lf-bar' }, [bar]);
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // 到达 slots 的 request lengths（以 steps 计），确定性
    var LENS = [3, 7, 2, 9, 4, 6, 5, 8, 3, 7];
    var STEPS = 12;
    state._render = function () {
      var S = state.slots;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var rowH = (H - 2 * PAD) / S, cw = (W - 2 * PAD) / STEPS;
      var busy = 0, total = S * STEPS;
      var queue = LENS.slice(S); // 前 S 个之后剩余的 requests
      var qi = 0;
      var r;
      for (r = 0; r < S; r++) {
        var y = PAD + r * rowH + 2;
        var t = 0;
        var curLen = LENS[r];
        var start = 0;
        while (t < STEPS) {
          // 从 start 开始运行当前 request curLen 个 steps
          var runEnd = Math.min(STEPS, start + curLen);
          var x = PAD + start * cw;
          svg.appendChild(svgEl('rect', { x: x.toFixed(1), y: y.toFixed(1),
            width: ((runEnd - start) * cw - 2).toFixed(1), height: (rowH - 4).toFixed(1), rx: '2',
            fill: 'var(--blueprint,#3553ff)', opacity: '0.85' }));
          busy += (runEnd - start);
          t = runEnd;
          if (state.mode === 'continuous' && qi < queue.length) {
            // 立即用下一个排队 request 重新填充空出的 slot
            start = t; curLen = queue[qi++];
          } else {
            // static：slot 空闲，直到整个 batch 在 max length 处结束
            break;
          }
        }
      }
      var util;
      if (state.mode === 'static') {
        // static batch 一直运行到第一个 batch 中最长的 request 结束
        var maxLen = Math.max.apply(null, LENS.slice(0, S));
        var work = 0, k;
        for (k = 0; k < S; k++) { work += Math.min(STEPS, LENS[k]); }
        util = work / (S * Math.min(STEPS, maxLen));
        // 为 static 绘制 idle tails（灰色）
        for (r = 0; r < S; r++) {
          var ll = Math.min(STEPS, LENS[r]);
          var maxl = Math.min(STEPS, maxLen);
          if (ll < maxl) {
            var yy = PAD + r * rowH + 2;
            svg.appendChild(svgEl('rect', { x: (PAD + ll * cw).toFixed(1), y: yy.toFixed(1),
              width: ((maxl - ll) * cw - 2).toFixed(1), height: (rowH - 4).toFixed(1), rx: '2',
              fill: 'var(--rule-soft,#ccc)', opacity: '0.7' }));
          }
        }
      } else {
        util = busy / total;
      }
      var pct = Math.round(util * 100);
      num.innerHTML = pct + ' <small>% GPU utilization</small>';
      bar.style.width = pct + '%';
      barWrap.classList.toggle('over', pct < 60);
      meta.textContent = state.mode === 'continuous'
        ? '已完成的 slots 会立即从 queue 重新填充，因此 batch 保持满载'
        : '每个 slot 都要等到 batch 中最长的 request 完成后，新的 request 才会开始';
      formula.textContent = 'utilization = busy slot-steps / total slot-steps  ·  ' + S + ' 个 slots，' + STEPS + ' 个 steps';
    };
    var sel = LF.select(state, 'mode', 'batching', [['continuous', 'continuous'], ['static', 'static']]);
    var grid = el('div', { class: 'lf-grid' }, [
      sel,
      slider(state, 'slots', 'GPU slots', 2, 6, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['CONTINUOUS BATCHING']), el('span', {}, ['切换 static 与 continuous'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, barWrap, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['batch 中的 requests 会在不同时间完成，因为它们生成的 tokens 数量不同。Static batching 会让每个 slot 保持到最长 request 结束，留下灰色的 idle time。Continuous batching 会在每个 slot 空出的瞬间从 queue 重新填充，让 GPU 保持满载并提升 utilization。'])
    ]));
    state._render();
  }

  // ── image-patch-tokens：将图像切分成 (size/patch)^2 个 patch tokens ────
  function imagePatchTokens(host) {
    var state = { size: 224, patch: 16 };
    var W = 520, H = 240, PAD = 16, BOX = 200;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var size = state.size, patch = state.patch;
      var perSide = Math.max(1, Math.ceil(size / patch));
      var n = perSide * perSide;
      var padded = perSide * patch;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var ox = PAD, oy = (H - BOX) / 2, cell = BOX / perSide;
      svg.appendChild(svgEl('rect', { x: ox, y: oy.toFixed(1), width: BOX, height: BOX,
        fill: 'var(--bg-surface,#eee)', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.5' }));
      var i;
      for (i = 1; i < perSide; i++) {
        var g = ox + i * cell;
        svg.appendChild(svgEl('line', { x1: g.toFixed(1), y1: oy.toFixed(1), x2: g.toFixed(1), y2: (oy + BOX).toFixed(1),
          stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '0.8', opacity: '0.7' }));
        var gy = oy + i * cell;
        svg.appendChild(svgEl('line', { x1: ox, y1: gy.toFixed(1), x2: (ox + BOX), y2: gy.toFixed(1),
          stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '0.8', opacity: '0.7' }));
      }
      // 右侧的一条 token squares，数量封顶以便可读
      var tx = ox + BOX + 28, ty = oy, ts = 12, cols = 6;
      var shown = Math.min(n, 36);
      for (i = 0; i < shown; i++) {
        var cx = tx + (i % cols) * (ts + 3);
        var cy = ty + Math.floor(i / cols) * (ts + 3);
        svg.appendChild(svgEl('rect', { x: cx.toFixed(1), y: cy.toFixed(1), width: ts, height: ts, rx: '2',
          fill: 'var(--blueprint,#3553ff)', opacity: '0.8' }));
      }
      num.innerHTML = LF.fmtInt(n) + ' <small>patch tokens</small>';
      meta.textContent = perSide + ' x ' + perSide + ' grid  ·  每个 ' + patch + ' x ' + patch
        + ' px patch 会变成一个 token' + (padded !== size ? ' · 图像 padded 到 ' + padded + 'px' : '') + '（再加上 ViT 中的一个 CLS token）';
      formula.textContent = 'tokens = ⌈size / patch⌉² = ⌈' + size + ' / ' + patch + '⌉² = ' + perSide + '² = ' + n;
    };
    var grid = el('div', { class: 'lf-grid' }, [
      LF.select(state, 'size', 'image size (px)', [['224', 224], ['256', 256], ['336', 336], ['384', 384], ['448', 448]]),
      LF.select(state, 'patch', 'patch size (px)', [['8', 8], ['14', 14], ['16', 16], ['32', 32]])
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['IMAGE PATCH TOKENS']), el('span', {}, ['选择 image 和 patch size'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['Vision Transformer 会把图像切成固定大小 patches 的 grid，并把每个 patch 当作一个 token，就像文本里的一个词一样。token count 是 size over patch 的平方，所以 patch size 减半会让 sequence 和 Attention 成本变成四倍。'])
    ]));
    state._render();
  }

  // ── multimodal-fusion：两个 encoders 进入共享空间，early vs late ─────
  function multimodalFusion(host) {
    var state = { mode: 'late' };
    var W = 520, H = 230, PAD = 20;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function box(x, y, w, h, label, fill) {
      var g = svgEl('g', {}, []);
      g.appendChild(svgEl('rect', { x: x, y: y, width: w, height: h, rx: '3',
        fill: fill || 'var(--bg-surface,#eee)', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.2' }));
      var t = svgEl('text', { x: (x + w / 2).toFixed(1), y: (y + h / 2 + 4).toFixed(1),
        'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': '11', fill: 'var(--ink,#1a1a1a)' });
      t.appendChild(document.createTextNode(label));
      g.appendChild(t);
      return g;
    }
    function arrow(x1, y1, x2, y2) {
      return svgEl('line', { x1: x1, y1: y1, x2: x2, y2: y2,
        stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.6' });
    }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var imgY = 36, txtY = 150, colW = 92, colH = 36, h2 = 18;
      // inputs
      svg.appendChild(box(PAD, imgY, colW, colH, '图像', 'var(--bg,#fafaf5)'));
      svg.appendChild(box(PAD, txtY, colW, colH, '文本', 'var(--bg,#fafaf5)'));
      // encoders
      var encX = PAD + colW + 40;
      svg.appendChild(box(encX, imgY, colW, colH, 'img enc'));
      svg.appendChild(box(encX, txtY, colW, colH, 'txt enc'));
      svg.appendChild(arrow(PAD + colW, imgY + h2, encX, imgY + h2));
      svg.appendChild(arrow(PAD + colW, txtY + h2, encX, txtY + h2));
      // projection 到 shared space
      var projX = encX + colW + 40;
      if (state.mode === 'late') {
        // 各自独立 projection；fusion 是在最后比较两个 vectors
        svg.appendChild(box(projX, imgY, colW, colH, 'proj'));
        svg.appendChild(box(projX, txtY, colW, colH, 'proj'));
        svg.appendChild(arrow(encX + colW, imgY + h2, projX, imgY + h2));
        svg.appendChild(arrow(encX + colW, txtY + h2, projX, txtY + h2));
        var sx = projX + colW + 30, sy = (imgY + txtY) / 2;
        svg.appendChild(box(sx, sy, 70, colH, 'shared', 'var(--bg-surface,#eee)'));
        svg.appendChild(arrow(projX + colW, imgY + h2, sx, sy + 6));
        svg.appendChild(arrow(projX + colW, txtY + h2, sx, sy + colH - 6));
      } else {
        // early fusion：tokens 拼接为一个 stream，并被 joint modeling
        var fy = (imgY + txtY) / 2;
        svg.appendChild(box(projX, fy, 80, colH, 'concat', 'var(--bg-surface,#eee)'));
        svg.appendChild(arrow(encX + colW, imgY + h2, projX, fy + 8));
        svg.appendChild(arrow(encX + colW, txtY + h2, projX, fy + colH - 8));
        var jx = projX + 80 + 30;
        svg.appendChild(box(jx, fy, 78, colH, 'joint xfmr'));
        svg.appendChild(arrow(projX + 80, fy + h2, jx, fy + h2));
      }
      meta.textContent = state.mode === 'late'
        ? 'late fusion：分别 encode 每种 modality，project 到同一个 space，在最后比较（CLIP-style）'
        : 'early fusion：把 image 和 text tokens 交错成一个 sequence，并进行 joint modeling';
      formula.textContent = state.mode === 'late'
        ? 'sim = cos( proj(img enc(image)), proj(txt enc(text)) )'
        : 'joint = transformer( [ img tokens ; text tokens ] )';
    };
    var grid = el('div', {}, [LF.select(state, 'mode', 'fusion point', [['late fusion', 'late'], ['early fusion', 'early']])]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['MULTIMODAL FUSION']), el('span', {}, ['切换 early 与 late'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['image encoder 和 text encoder 会分别把自己的 input 映射成 vectors。Late fusion 把两者 project 到共享 embedding space，并且只在最后比较它们，CLIP 这类 contrastive models 就是这样对齐图像和 captions 的。Early fusion 从一开始就拼接 token streams 并进行 joint modeling，让两种 modalities 在整个过程中彼此 attend。'])
    ]));
    state._render();
  }

  // ── mcp-tool-call：client 到 server 的 JSON-RPC round trip，result 进入 context ─
  function mcpToolCall(host) {
    var state = { step: 2 };
    var W = 520, H = 250, PAD = 18;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var code = el('div', { class: 'lf-formula' });
    var meta = el('div', { class: 'lf-meta' });
    var STEPS = [
      'tools/list：client 询问 server 存在哪些 functions',
      'server 返回可用 functions 及其 schemas 的 registry',
      'tools/call：client 使用 arguments 调用 get_weather',
      'server 运行 function 并返回 result',
      'result 被追加到 context，model 继续生成'
    ];
    var CODE = [
      '--> { "jsonrpc": "2.0", "id": 1, "method": "tools/list" }',
      '<-- { "result": { "tools": [ { "name": "get_weather", ... } ] } }',
      '--> { "jsonrpc": "2.0", "id": 2, "method": "tools/call",\n      "params": { "name": "get_weather", "arguments": { "city": "Pune" } } }',
      '<-- { "id": 2, "result": { "content": [ { "type": "text", "text": "31 C, 晴朗" } ] } }',
      'context += tool result  ->  model 写出最终答案'
    ];
    function box(x, y, w, h, label, active) {
      var g = svgEl('g', {});
      g.appendChild(svgEl('rect', { x: x, y: y, width: w, height: h, rx: '4',
        fill: active ? 'var(--blueprint,#3553ff)' : 'var(--bg-surface,#eee)',
        stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.2' }));
      var t = svgEl('text', { x: (x + w / 2).toFixed(1), y: (y + h / 2 + 4).toFixed(1),
        'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': '11',
        fill: active ? 'var(--bg,#fafaf5)' : 'var(--ink,#1a1a1a)' });
      t.appendChild(document.createTextNode(label));
      g.appendChild(t);
      return g;
    }
    state._render = function () {
      var s = state.step;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var bw = 120, bh = 38;
      var clientX = PAD, serverX = W - PAD - bw, midY = 30;
      var clientActive = (s === 0 || s === 2 || s === 4);
      var serverActive = (s === 1 || s === 3);
      svg.appendChild(box(clientX, midY, bw, bh, 'client / host', clientActive));
      svg.appendChild(box(serverX, midY, bw, bh, 'MCP server', serverActive));
      // server 下方的 registry
      svg.appendChild(box(serverX, midY + bh + 16, bw, 30, 'fn registry', s === 1));
      // client 下方的 context
      svg.appendChild(box(clientX, midY + bh + 16, bw, 30, 'model context', s === 4));
      // 二者之间的 message arrow
      var ay = midY + bh + 92;
      var goingRight = (s === 0 || s === 2);
      var x1 = clientX + bw, x2 = serverX;
      if (goingRight) {
        svg.appendChild(svgEl('line', { x1: x1, y1: ay, x2: x2, y2: ay, stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
        svg.appendChild(svgEl('polygon', { points: (x2) + ',' + ay + ' ' + (x2 - 9) + ',' + (ay - 5) + ' ' + (x2 - 9) + ',' + (ay + 5), fill: 'var(--blueprint,#3553ff)' }));
      } else if (s === 1 || s === 3) {
        svg.appendChild(svgEl('line', { x1: x2, y1: ay, x2: x1, y2: ay, stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
        svg.appendChild(svgEl('polygon', { points: (x1) + ',' + ay + ' ' + (x1 + 9) + ',' + (ay - 5) + ' ' + (x1 + 9) + ',' + (ay + 5), fill: 'var(--blueprint,#3553ff)' }));
      }
      var dir = svgEl('text', { x: (W / 2).toFixed(1), y: (ay - 10).toFixed(1), 'text-anchor': 'middle',
        'font-family': 'monospace', 'font-size': '10', fill: 'var(--ink-mute,#777)' });
      dir.appendChild(document.createTextNode(goingRight ? 'request -->' : (s === 4 ? 'result 回流' : '<-- response')));
      svg.appendChild(dir);
      // step label
      var lbl = svgEl('text', { x: (W / 2).toFixed(1), y: (H - 14).toFixed(1), 'text-anchor': 'middle',
        'font-family': 'monospace', 'font-size': '10.5', fill: 'var(--ink-soft,#555)' });
      lbl.appendChild(document.createTextNode((s + 1) + ' / ' + STEPS.length + '  ' + STEPS[s]));
      svg.appendChild(lbl);
      code.textContent = CODE[s];
      meta.textContent = 'JSON-RPC 2.0 通过 transport 传输  ·  result 会成为 model 接下来读取的 context message';
    };
    var grid = el('div', {}, [slider(state, 'step', 'round-trip step', 0, 4, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['MCP TOOL CALL']), el('span', {}, ['拖动查看 round trip'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, code, meta])]),
      el('div', { class: 'lf-cap' }, ['Model Context Protocol 使用 JSON-RPC 在 client 和 server 之间通信。client 会先列出 server 暴露的 functions，然后用 name 和 arguments 调用其中一个。server 运行它并返回 structured result，client 将 result 追加到 model context 中，让下一步 generation 可以使用它。'])
    ]));
    state._render();
  }

  LF.register({
    'beam-search': beamSearch,
    'speculative-decoding': speculativeDecoding,
    'moe-routing': moeRouting,
    'context-window-slide': contextWindowSlide,
    'perplexity-loss': perplexityLoss,
    'continuous-batching': continuousBatching,
    'image-patch-tokens': imagePatchTokens,
    'multimodal-fusion': multimodalFusion,
    'mcp-tool-call': mcpToolCall
  });
})();
