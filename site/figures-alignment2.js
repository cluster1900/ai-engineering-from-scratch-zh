/* figures-alignment2.js — Phase 18（伦理、安全、alignment）和 Phase 9
   （Reinforcement Learning）的交互式课程图示。在 lesson-figures.js 之后加载，
   并通过 window.LF 注册。无依赖，仅使用 ES5，通过 CSS 变量适配主题。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl, slider = LF.slider, select = LF.select;
  var clamp = LF.clamp, fmtInt = LF.fmtInt;

  function frame(host, label, hint, grid, outKids, caption) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [hint])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, outKids)]),
      el('div', { class: 'lf-cap' }, [caption])
    ]));
  }

  // ── ppo-clip：clipped surrogate 会将 [1-eps, 1+eps] 之外的更新拉平 ─
  function ppoClip(host) {
    var W = 520, H = 230, PAD = 34;
    var state = { adv: 1, eps: 0.2 };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var RMIN = 0, RMAX = 2;
    function clipped(r, A, eps) {
      var lo = 1 - eps, hi = 1 + eps;
      var rc = r < lo ? lo : r > hi ? hi : r;
      return A >= 0 ? Math.min(r * A, rc * A) : Math.max(r * A, rc * A);
    }
    function px(r) { return PAD + (r - RMIN) / (RMAX - RMIN) * (W - 2 * PAD); }
    function py(v, span) { return H / 2 - v / span * (H / 2 - PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var A = state.adv, eps = state.eps, span = Math.max(0.6, Math.abs(A) * (1 + eps));
      svg.appendChild(svgEl('line', { x1: PAD, y1: H / 2, x2: W - PAD, y2: H / 2, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      var rx = px(1);
      svg.appendChild(svgEl('line', { x1: rx, y1: PAD, x2: rx, y2: H - PAD, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      var lx = px(1 - eps), hx = px(1 + eps);
      svg.appendChild(svgEl('line', { x1: lx, y1: PAD, x2: lx, y2: H - PAD, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'stroke-dasharray': '4 3' }));
      svg.appendChild(svgEl('line', { x1: hx, y1: PAD, x2: hx, y2: H - PAD, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'stroke-dasharray': '4 3' }));
      var i, r, du = '', dc = '';
      for (i = 0; i <= 120; i++) { r = RMIN + (RMAX - RMIN) * i / 120; du += (i ? 'L' : 'M') + px(r).toFixed(1) + ' ' + py(r * A, span).toFixed(1) + ' '; }
      for (i = 0; i <= 120; i++) { r = RMIN + (RMAX - RMIN) * i / 120; dc += (i ? 'L' : 'M') + px(r).toFixed(1) + ' ' + py(clipped(r, A, eps), span).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: du, fill: 'none', stroke: 'var(--ink-mute,#999)', 'stroke-width': '1.5', 'stroke-dasharray': '4 3' }));
      svg.appendChild(svgEl('path', { d: dc, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2.2' }));
      var rNow = 1 + eps + (A >= 0 ? 0.35 : -0.35);
      rNow = rNow < RMIN ? RMIN : rNow > RMAX ? RMAX : rNow;
      svg.appendChild(svgEl('circle', { cx: px(rNow), cy: py(clipped(rNow, A, eps), span), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      var sign = A >= 0 ? '正' : '负';
      status.innerHTML = 'advantage 为' + sign;
      meta.textContent = 'clip 范围 [' + (1 - eps).toFixed(2) + ', ' + (1 + eps).toFixed(2) + ']  ·  ' + (A >= 0 ? '奖励好的 action，但在 r > 1+eps 后停止' : '惩罚不好的 action，但在 r < 1-eps 后停止');
      formula.textContent = 'L = min( r·A,  clip(r, 1-eps, 1+eps)·A )   ·   eps = ' + eps.toFixed(2) + ', A = ' + A.toFixed(1);
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'adv', 'advantage A', -2, 2, 0.1),
      slider(state, 'eps', 'clip epsilon', 0.05, 0.4, 0.01)
    ]);
    frame(host, 'PPO CLIP', '拖动 advantage 和 epsilon',
      grid, [svg, el('div', { style: 'margin-top:12px' }, [status]), meta, formula],
      'PPO 将 advantage 乘以新旧 policy 之间的 probability ratio r。灰线是原始乘积 r·A；蓝线是 clipped surrogate。当 ratio 沿有利方向离开 1-eps 到 1+eps 的区间后，clip 会将 objective 拉平，使其 Gradient 消失，从而避免每次更新让 policy 偏离采集数据时所用的 policy 太远。');
    state._render();
  }

  // ── reward-model：Bradley-Terry 偏好，让 chosen 的分数高于 rejected ────
  function rewardModel(host) {
    var state = { gap: 1.2 };
    var W = 520, H = 150, PAD = 30;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function px(s) { return PAD + (s + 4) / 8 * (W - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var sChosen = state.gap / 2, sRejected = -state.gap / 2;
      var pPrefer = 1 / (1 + Math.exp(-(sChosen - sRejected)));
      var loss = -Math.log(Math.max(1e-6, pPrefer));
      svg.appendChild(svgEl('line', { x1: PAD, y1: H - PAD, x2: W - PAD, y2: H - PAD, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      var rx = px(sRejected), cx = px(sChosen), y = H - PAD;
      svg.appendChild(svgEl('line', { x1: rx, y1: y, x2: rx, y2: PAD, stroke: 'var(--ink-mute,#999)', 'stroke-width': '8' }));
      svg.appendChild(svgEl('text', { x: rx, y: PAD - 6, 'text-anchor': 'middle', 'font-size': '10', fill: 'var(--ink-mute,#777)', 'font-family': 'monospace' }, [document.createTextNode('rejected ' + sRejected.toFixed(2))]));
      svg.appendChild(svgEl('line', { x1: cx, y1: y, x2: cx, y2: PAD, stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '8' }));
      svg.appendChild(svgEl('text', { x: cx, y: PAD - 6, 'text-anchor': 'middle', 'font-size': '10', fill: 'var(--blueprint,#3553ff)', 'font-family': 'monospace' }, [document.createTextNode('chosen ' + sChosen.toFixed(2))]));
      num.innerHTML = (pPrefer * 100).toFixed(1) + ' <small>% P(chosen ≻ rejected)</small>';
      meta.textContent = '分数差距 ' + state.gap.toFixed(2) + '  ·  偏好 Loss ' + loss.toFixed(3) + '  ·  ' + (state.gap < 0.4 ? '不确定：分数几乎持平' : state.gap > 2.5 ? '确信：chosen 明显更高' : '正在学习排序');
      formula.textContent = 'P(chosen ≻ rejected) = sigmoid( r(chosen) − r(rejected) )   ·   loss = −log P';
    };
    var grid = el('div', {}, [slider(state, 'gap', '分数差距  r(chosen) − r(rejected)', 0, 4, 0.05)]);
    frame(host, 'REWARD MODEL', '拖动分数差距',
      grid, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula],
      'Reward Model 将人类偏好转换为 Scalar 分数。对于每一组被人类标记为 chosen 优于 rejected 的回答，Bradley-Terry objective 会训练 Model，使 chosen 回答获得更高分数。分数差距越大，Model 认为人类偏好 chosen 回答的 Probability 就越高，偏好 Loss 也越小。');
    state._render();
  }

  // ── constitutional-ai：原则会标记并修订有害回答 ────────
  function constitutionalAI(host) {
    var principles = [
      { name: '无害性', flags: '伤害性请求', sev: 0.9 },
      { name: '诚实性', flags: '捏造的陈述', sev: 0.5 },
      { name: '隐私', flags: '个人数据泄露', sev: 0.7 },
      { name: '非欺骗性', flags: '操纵性表述', sev: 0.4 }
    ];
    var state = { which: 0 };
    var rows = el('div', {});
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var which = Number(state.which);
      while (rows.firstChild) rows.removeChild(rows.firstChild);
      var p = principles[which];
      principles.forEach(function (pr, i) {
        var on = i === which;
        var bar = el('i'); bar.style.width = (pr.sev * 100).toFixed(0) + '%';
        if (!on) bar.style.background = 'var(--rule-soft,#ccc)';
        var lab = el('label', {}, [pr.name, el('b', {}, [on ? '已触发' : '通过'])]);
        if (!on) lab.style.opacity = '0.5';
        rows.appendChild(el('div', { class: 'lf-ctrl' }, [lab, el('div', { class: 'lf-bar' }, [bar])]));
      });
      status.innerHTML = '修订：' + p.flags;
      meta.textContent = '原则“' + p.name + '”标记了草稿（严重程度 ' + p.sev.toFixed(2) + '）  ·  Model 先进行批评，再重写以遵守原则';
      formula.textContent = '回答 → 根据原则进行批评 → 修订后的回答   ·   无需人类 Label，constitution 就是信号';
    };
    var grid = el('div', {}, [select(state, 'which', '触发的原则',
      principles.map(function (pr, i) { return [pr.name, String(i)]; }))]);
    frame(host, 'CONSTITUTIONAL AI', '选择原则',
      grid, [rows, el('div', { style: 'margin-top:12px' }, [status]), meta, formula],
      'Constitutional AI 使用一组书面原则取代人类标注者。草稿回答会依次接受每条原则的检查；你选择的原则会标记一项违规，Model 根据该原则批评自己的回答，然后进行修订以遵守原则。修订后的回答会成为 Training 信号，因此无害性是通过规则而非逐样本的人类反馈来教授的。');
    state._render();
  }

  // ── actor-critic：来自 TD error 的 advantage A = Q - V 驱动更新 ───
  function actorCritic(host) {
    var W = 520, H = 200, PAD = 32;
    var state = { td: 0.6, value: 1.0 };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var SPAN = 2.5;
    function py(v) { return H / 2 - v / SPAN * (H / 2 - PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var V = state.value, Q = V + state.td, A = Q - V;
      var baseX = PAD + 40, qX = W - PAD - 40;
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(0), x2: W - PAD, y2: py(0), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      // critic baseline V
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(V), x2: W - PAD, y2: py(V), stroke: 'var(--ink-mute,#999)', 'stroke-width': '1.5', 'stroke-dasharray': '4 3' }));
      svg.appendChild(svgEl('text', { x: PAD + 4, y: py(V) - 6, 'font-size': '10', fill: 'var(--ink-mute,#777)', 'font-family': 'monospace' }, [document.createTextNode('V (critic) = ' + V.toFixed(2))]));
      // 实际 return Q
      svg.appendChild(svgEl('circle', { cx: qX, cy: py(Q), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      svg.appendChild(svgEl('text', { x: qX, y: py(Q) - 10, 'text-anchor': 'end', 'font-size': '10', fill: 'var(--blueprint,#3553ff)', 'font-family': 'monospace' }, [document.createTextNode('Q = V + delta = ' + Q.toFixed(2))]));
      // 从 V 到 Q 的 advantage 条
      var col = A >= 0 ? 'var(--blueprint,#3553ff)' : 'var(--warn,#b8870f)';
      svg.appendChild(svgEl('line', { x1: qX, y1: py(V), x2: qX, y2: py(Q), stroke: col, 'stroke-width': '6' }));
      status.innerHTML = 'advantage A = ' + A.toFixed(2);
      meta.textContent = 'TD error delta = ' + state.td.toFixed(2) + '  ·  ' + (A > 0.05 ? '好于预期：推动 actor 选择此 action' : A < -0.05 ? '差于预期：推动 actor 远离此 action' : '符合预期：更新幅度很小');
      formula.textContent = 'delta = r + gamma·V(s\') − V(s)   ·   A = Q − V = delta   ·   actor update ∝ A · grad log pi';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'td', 'TD error  delta', -2, 2, 0.05),
      slider(state, 'value', 'critic baseline  V', -1.5, 1.5, 0.05)
    ]);
    frame(host, 'ACTOR-CRITIC', '拖动 TD error',
      grid, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula],
      'critic 估算状态的 value V（灰色 baseline）；actor 提出产生 return Q（蓝点）的 action。advantage A = Q - V，等于一步 TD error，用于衡量该 action 的表现比 critic 的预期更好还是更差。正 advantage 会推动 actor 选择该 action，负 advantage 会推动它远离该 action，而 critic 则会将 baseline 移向观察到的 return。');
    state._render();
  }

  // ── interpretability-probe：probe accuracy 随层级深入而上升 ────────
  function interpretabilityProbe(host) {
    var W = 520, H = 210, PAD = 36, NL = 24;
    var state = { layer: 12, depth: 0.5 };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // probe accuracy：随 layer index 呈 logistic 上升；中点由 depth 设置
    function acc(layer) {
      var mid = NL * (0.2 + 0.6 * state.depth);
      var a = 0.5 + 0.48 / (1 + Math.exp(-(layer - mid) / 2.2));
      return a;
    }
    function px(l) { return PAD + l / (NL - 1) * (W - 2 * PAD); }
    function py(a) { return H - PAD - (a - 0.5) / 0.5 * (H - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(0.5), x2: W - PAD, y2: py(0.5), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('text', { x: PAD - 4, y: py(0.5) + 3, 'text-anchor': 'end', 'font-size': '9', fill: 'var(--ink-mute,#777)', 'font-family': 'monospace' }, [document.createTextNode('随机水平')]));
      var d = '', l;
      for (l = 0; l < NL; l++) { d += (l ? 'L' : 'M') + px(l).toFixed(1) + ' ' + py(acc(l)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      var L = state.layer, a = acc(L);
      svg.appendChild(svgEl('line', { x1: px(L), y1: PAD, x2: px(L), y2: H - PAD, stroke: 'var(--ink-mute,#999)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      svg.appendChild(svgEl('circle', { cx: px(L), cy: py(a), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      num.innerHTML = (a * 100).toFixed(1) + ' <small>% probe accuracy</small>';
      meta.textContent = '第 ' + L + ' 层，共 ' + (NL - 1) + ' 层  ·  ' + (a < 0.62 ? '概念尚无法被线性解码' : a > 0.9 ? '该层中已清晰存在此概念' : '概念正在形成');
      formula.textContent = '在 layer activation 上训练 linear classifier  ·  高 accuracy ⇒ 该概念在此深度可被线性读取';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'layer', 'layer index', 0, NL - 1, 1),
      slider(state, 'depth', '概念形成的位置（早期 ↔ 后期）', 0, 1, 0.05)
    ]);
    frame(host, 'INTERPRETABILITY PROBE', '拖动 layer',
      grid, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula],
      'linear probe 是一种简单的 classifier，经过训练后可从某一层的 activation 中读取概念。probe accuracy 接近随机水平，表示该概念在此处无法被线性解码；高 accuracy 则表示可以。让 probe 逐步深入 network，可以看到概念逐渐变得可线性读取；interpretability 研究人员正是通过这种方式，定位欺骗意图等 feature 最早出现的位置。');
    state._render();
  }

  // ── sae-features：将 dense activation 分解为 sparse features ──────────
  function saeFeatures(host) {
    var state = { l1: 1.0 };
    var feats = [0.95, 0.82, 0.74, 0.61, 0.52, 0.44, 0.36, 0.29, 0.21, 0.14, 0.09, 0.05];
    var rows = el('div', {});
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      while (rows.firstChild) rows.removeChild(rows.firstChild);
      var thr = state.l1 * 0.18; // L1 越高 -> activation threshold 越高 -> 保留下来的越少
      var active = 0, recon = 0, total = 0;
      feats.forEach(function (f) { total += f; });
      feats.forEach(function (f, i) {
        var on = f >= thr;
        var val = on ? f : 0;
        if (on) { active++; recon += f; }
        var bar = el('i'); bar.style.width = (val / 0.95 * 100).toFixed(0) + '%';
        if (!on) bar.style.background = 'var(--rule-soft,#ccc)';
        var lab = el('label', {}, ['f' + (i + 1) + (on ? '' : ' ·'), el('b', {}, [on ? val.toFixed(2) : '关闭'])]);
        if (!on) lab.style.opacity = '0.4';
        rows.appendChild(el('div', { class: 'lf-ctrl' }, [lab, el('div', { class: 'lf-bar' }, [bar])]));
      });
      var reconPct = recon / total * 100;
      num.innerHTML = feats.length + ' 个 feature 中有 <small>' + active + ' 个处于 active 状态</small>';
      meta.textContent = '重建了 dense Vector 的 ' + reconPct.toFixed(0) + '%  ·  ' + (state.l1 < 0.5 ? '低 L1：dense、polysemantic features' : state.l1 > 1.8 ? '高 L1：非常 sparse，可能丢失信号' : 'sparse 且 monosemantic');
      formula.textContent = 'minimize  ‖x − decode(f)‖² + lambda·‖f‖₁   ·   lambda = ' + state.l1.toFixed(2) + '   ·   lambda 越高 ⇒ active features 越少';
    };
    var grid = el('div', {}, [slider(state, 'l1', 'sparsity coefficient  lambda (L1)', 0.1, 2.5, 0.05)]);
    frame(host, 'SPARSE AUTOENCODER', '拖动 L1 coefficient',
      grid, [rows, el('div', { style: 'margin-top:12px' }, [num]), meta, formula],
      'sparse autoencoder 将 dense activation 分解为数量大得多的 features，其中大多数保持关闭。feature activation 上的 L1 penalty 决定编码有多 sparse。penalty 太小，features 会保持 dense 和 polysemantic；penalty 太大，则少数 features 会承载全部信息，但重建效果会受损。理想点会产生少量 active、monosemantic features，每个 feature 都代表一个人类可读的概念。');
    state._render();
  }

  // ── jailbreak-defense：攻击成功率下降，但过度拒绝率上升 ─────────
  function jailbreakDefense(host) {
    var W = 520, H = 210, PAD = 36;
    var state = { strength: 0.5 };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // 攻击成功率随防御增强而下降；对正常 Prompt 的过度拒绝率则会上升
    function asr(s) { return 0.85 * Math.exp(-2.6 * s); }
    function refuse(s) { return 0.02 + 0.6 * Math.pow(s, 2.2); }
    function px(s) { return PAD + s * (W - 2 * PAD); }
    function py(v) { return H - PAD - clamp(v, 0, 1) * (H - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: H - PAD, x2: W - PAD, y2: H - PAD, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      function curve(fn, st) { var d = '', i, s; for (i = 0; i <= 100; i++) { s = i / 100; d += (i ? 'L' : 'M') + px(s).toFixed(1) + ' ' + py(fn(s)).toFixed(1) + ' '; } svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: st, 'stroke-width': '2' })); }
      curve(asr, 'var(--warn,#b8870f)');
      curve(refuse, 'var(--blueprint,#3553ff)');
      var s = state.strength, a = asr(s), r = refuse(s);
      var mx = px(s);
      svg.appendChild(svgEl('line', { x1: mx, y1: PAD, x2: mx, y2: H - PAD, stroke: 'var(--ink-mute,#999)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      svg.appendChild(svgEl('circle', { cx: mx, cy: py(a), r: '4.5', fill: 'var(--warn,#b8870f)' }));
      svg.appendChild(svgEl('circle', { cx: mx, cy: py(r), r: '4.5', fill: 'var(--blueprint,#3553ff)' }));
      status.innerHTML = '攻击成功率 ' + (a * 100).toFixed(0) + '%';
      meta.textContent = '琥珀色：jailbreak 成功率 ' + (a * 100).toFixed(0) + '%  ·  蓝色：对正常 Prompt 的过度拒绝率 ' + (r * 100).toFixed(0) + '%  ·  ' + (s < 0.3 ? '过于宽松' : s > 0.8 ? '过于严格' : '平衡');
      formula.textContent = 'filter 越强 ⇒ 攻击成功率越低，错误拒绝率越高   ·   调整到两条曲线的拐点';
    };
    var grid = el('div', {}, [slider(state, 'strength', '防御强度', 0, 1, 0.02)]);
    frame(host, 'JAILBREAK DEFENSE', '拖动防御强度',
      grid, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula],
      '阻止对抗性 Prompt 的安全 filter 也可能拒绝无害请求。随着防御强度提高，琥珀色的攻击成功率曲线会下降，但由于正常请求也被拦截，蓝色的过度拒绝曲线会上升。这里不存在无代价的选择：运行点应选在拐点处，从而在阻止大多数 jailbreak 的同时，不拒绝过多合法用户。');
    state._render();
  }

  // ── scalable-oversight：弱 judge 通过 debate 监督强 Agents ─────
  function scalableOversight(host) {
    var W = 520, H = 210, PAD = 36;
    var state = { difficulty: 0.5, mode: 'debate' };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // 无辅助的弱 judge accuracy 会随难度快速下降；oversight protocols 下降得更慢
    function direct(x) { return 0.5 + 0.45 * Math.exp(-3.2 * x); }
    function debate(x) { return 0.5 + 0.45 * Math.exp(-1.3 * x); }
    function recurse(x) { return 0.5 + 0.45 * Math.exp(-1.0 * x); }
    function aided(x) { return state.mode === 'recursion' ? recurse(x) : debate(x); }
    function px(x) { return PAD + x * (W - 2 * PAD); }
    function py(v) { return H - PAD - (v - 0.5) / 0.5 * (H - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(0.5), x2: W - PAD, y2: py(0.5), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('text', { x: PAD - 4, y: py(0.5) + 3, 'text-anchor': 'end', 'font-size': '9', fill: 'var(--ink-mute,#777)', 'font-family': 'monospace' }, [document.createTextNode('随机水平')]));
      function curve(fn, st, dash) { var d = '', i, x; for (i = 0; i <= 100; i++) { x = i / 100; d += (i ? 'L' : 'M') + px(x).toFixed(1) + ' ' + py(fn(x)).toFixed(1) + ' '; } var a = { d: d, fill: 'none', stroke: st, 'stroke-width': '2' }; if (dash) a['stroke-dasharray'] = '4 3'; svg.appendChild(svgEl('path', a)); }
      curve(direct, 'var(--ink-mute,#999)', true);
      curve(aided, 'var(--blueprint,#3553ff)', false);
      var x = state.difficulty, vu = direct(x), va = aided(x), mx = px(x);
      svg.appendChild(svgEl('line', { x1: mx, y1: PAD, x2: mx, y2: H - PAD, stroke: 'var(--ink-mute,#999)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      svg.appendChild(svgEl('circle', { cx: mx, cy: py(vu), r: '4', fill: 'var(--ink-mute,#999)' }));
      svg.appendChild(svgEl('circle', { cx: mx, cy: py(va), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      status.innerHTML = 'oversight accuracy ' + (va * 100).toFixed(0) + '%';
      meta.textContent = '灰色：judge 单独判断 ' + (vu * 100).toFixed(0) + '%  ·  蓝色：judge + ' + state.mode + ' ' + (va * 100).toFixed(0) + '%  ·  提升 ' + ((va - vu) * 100).toFixed(0) + ' 个百分点';
      formula.textContent = state.mode === 'debate'
        ? '两个强 Agents 展开辩论；弱 judge 选择更站得住脚的回答'
        : '将任务拆分为可检查的子任务；弱 judge 验证每个部分';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'difficulty', '任务难度', 0, 1, 0.02),
      select(state, 'mode', 'oversight protocol', [['debate', 'debate'], ['recursion', 'recursion']])
    ]);
    frame(host, 'SCALABLE OVERSIGHT', '拖动任务难度',
      grid, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula],
      '弱 judge 无法直接检查强 Agent 在困难任务上的表现：随着难度上升，灰色曲线会下降至随机水平。oversight protocols 可以帮助 judge 跟上强 Agent。在 debate 中，两个强 Agents 展开辩论，由 judge 选择更站得住脚的一方；在 recursion 中，任务被分解为 judge 能够验证的多个部分。无论采用哪种方式，蓝色曲线下降得都更慢，因此对于 judge 单独无法解决的任务，其表现仍能保持在随机水平之上。');
    state._render();
  }

  LF.register({
    'ppo-clip': ppoClip,
    'reward-model': rewardModel,
    'constitutional-ai': constitutionalAI,
    'actor-critic': actorCritic,
    'interpretability-probe': interpretabilityProbe,
    'sae-features': saeFeatures,
    'jailbreak-defense': jailbreakDefense,
    'scalable-oversight': scalableOversight
  });
})();
