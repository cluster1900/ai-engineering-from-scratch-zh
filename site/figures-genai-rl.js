/* figures-genai-rl.js — Phase 8（generative AI）
   和 Phase 9（Reinforcement Learning）的交互式课程图示。加载于 lesson-figures.js 之后，
   并通过 window.LF 注册。无依赖，仅 ES5，通过 CSS vars 设置主题。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl, slider = LF.slider, select = LF.select;
  var clamp = LF.clamp;

  function frame(host, label, hint, grid, outKids, caption) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [hint])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, outKids)]),
      el('div', { class: 'lf-cap' }, [caption])
    ]));
  }

  // ── diffusion-denoise：去掉噪声后逐渐浮现的一维信号 ──────
  function diffusionDenoise(host) {
    var W = 520, H = 240, PAD = 30, N = 96, T = 50;
    var state = { t: 35 };
    // 固定的干净信号 x0 和固定的噪声样本，因此渲染是确定性的
    var x0 = [], noise = [], i, seed = 12345;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff * 2 - 1; }
    for (i = 0; i < N; i++) {
      var u = i / (N - 1);
      x0.push(0.6 * Math.sin(u * Math.PI * 2) + 0.25 * Math.sin(u * Math.PI * 6));
      noise.push(rnd());
    }
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function px(j) { return PAD + j / (N - 1) * (W - 2 * PAD); }
    function py(v) { return H / 2 - v / 1.6 * (H / 2 - PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: H / 2, x2: W - PAD, y2: H / 2, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      // alpha_bar 从 1（干净，t=0）下降到约 0（纯噪声，t=T）
      var ab = Math.pow(Math.cos((state.t / T) * Math.PI / 2), 2);
      var sA = Math.sqrt(ab), sN = Math.sqrt(1 - ab), d = '', j;
      for (j = 0; j < N; j++) {
        var xt = sA * x0[j] + sN * noise[j];
        d += (j ? 'L' : 'M') + px(j).toFixed(1) + ' ' + py(xt).toFixed(1) + ' ';
      }
      // 干净目标的淡色残影
      var dc = '';
      for (j = 0; j < N; j++) { dc += (j ? 'L' : 'M') + px(j).toFixed(1) + ' ' + py(x0[j]).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: dc, fill: 'none', stroke: 'var(--ink-mute,#999)', 'stroke-width': '1.5', 'stroke-dasharray': '4 3', opacity: '0.5' }));
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.8' }));
      meta.textContent = 't = ' + state.t + ' / ' + T + '  ·  信号 ' + Math.round(sA * 100) + '%  ·  噪声 ' + Math.round(sN * 100) + '%  ·  ' + (state.t < 8 ? '几乎干净' : state.t > 42 ? '接近纯噪声' : '去噪中');
      formula.textContent = 'x_t = sqrt(alpha_bar_t) x_0 + sqrt(1 - alpha_bar_t) noise   ·   alpha_bar_t = cos^2((t/T)·pi/2)';
    };
    var grid = el('div', {}, [slider(state, 't', 'timestep t（0 = 干净，T = 噪声）', 0, T, 1)]);
    frame(host, 'DIFFUSION 去噪', '拖动 timestep',
      grid, [svg, meta, formula],
      'Diffusion model 学习反转加噪过程。在 t = T 时，信号是纯噪声；随着 t 向 0 下降，模型会一步步移除噪声，底层信号（灰色虚线）重新浮现。每个 x_t 都是干净信号与同一份噪声按 schedule 加权得到的固定混合。');
    state._render();
  }

  // ── noise-schedule：Diffusion 步骤中的 linear 与 cosine alpha_bar ──────
  function noiseSchedule(host) {
    var W = 520, H = 220, PAD = 32, T = 1000;
    var state = { sched: 'cosine', t: 500 };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function ab(t) { return state.sched === 'cosine' ? Math.pow(Math.cos((t / T) * Math.PI / 2), 2) : Math.pow(1 - t / T, 2.2); }
    function px(t) { return PAD + t / T * (W - 2 * PAD); }
    function py(v) { return H - PAD - v * (H - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: H - PAD, x2: W - PAD, y2: H - PAD, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      var d = '', i, t;
      for (i = 0; i <= 160; i++) { t = T * i / 160; d += (i ? 'L' : 'M') + px(t).toFixed(1) + ' ' + py(ab(t)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      var mx = px(state.t), v = ab(state.t);
      svg.appendChild(svgEl('line', { x1: mx, y1: PAD, x2: mx, y2: H - PAD, stroke: 'var(--ink-mute,#999)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      svg.appendChild(svgEl('circle', { cx: mx, cy: py(v), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      var snr = v / Math.max(1e-6, 1 - v);
      meta.textContent = 'alpha_bar = ' + v.toFixed(3) + '  ·  SNR = ' + snr.toFixed(2) + '  ·  ' + (state.sched === 'cosine' ? 'cosine 在中间步骤保留信号更久' : 'linear 会过早破坏信号');
      formula.textContent = state.sched === 'cosine'
        ? 'alpha_bar_t = cos^2((t/T)·pi/2)   ·   SNR(t) = alpha_bar_t / (1 - alpha_bar_t)'
        : 'alpha_bar_t = (1 - t/T)^2.2   ·   SNR(t) = alpha_bar_t / (1 - alpha_bar_t)';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      select(state, 'sched', 'schedule', [['cosine', 'cosine'], ['linear', 'linear']]),
      slider(state, 't', 'diffusion step t', 0, T, 10)
    ]);
    frame(host, '噪声 SCHEDULE', '选择一个 schedule',
      grid, [svg, meta, formula],
      'alpha_bar 是第 t 步仍然保留的信号比例，它与剩余噪声的比值就是信噪比。linear schedule 会在早期步骤快速抹除信号；cosine schedule 在中段衰减更平缓，让有用信号保留更久，并为模型提供信息量更高的中间目标。');
    state._render();
  }

  // ── vae-latent-grid：在二维 latent space 中移动，观察解码形状的变形 ─
  function vaeLatentGrid(host) {
    var W = 520, H = 240, CX = 380, CY = 120, R = 78;
    var state = { z1: 0, z2: 0 };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // 左侧：带有移动点的 latent plane；右侧：由 (z1,z2) 解码得到的参数化形状
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var planeX = 40, planeY = 40, planeW = 160, planeH = 160;
      svg.appendChild(svgEl('rect', { x: planeX, y: planeY, width: planeW, height: planeH, fill: 'none', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('line', { x1: planeX, y1: planeY + planeH / 2, x2: planeX + planeW, y2: planeY + planeH / 2, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('line', { x1: planeX + planeW / 2, y1: planeY, x2: planeX + planeW / 2, y2: planeY + planeH, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      var dx = planeX + planeW / 2 + state.z1 / 3 * (planeW / 2);
      var dy = planeY + planeH / 2 - state.z2 / 3 * (planeH / 2);
      svg.appendChild(svgEl('circle', { cx: dx, cy: dy, r: '5', fill: 'var(--blueprint,#3553ff)' }));
      // 解码：z1 控制瓣数/尖锐度，z2 控制圆润与星形之间的变化
      var pts = 80, k, dpath = '';
      var lobes = 3 + Math.round((state.z1 + 3) / 6 * 5); // 3..8
      var spike = (state.z2 + 3) / 6; // 0..1
      for (k = 0; k <= pts; k++) {
        var ang = k / pts * Math.PI * 2;
        var rad = R * (1 - spike * 0.55 * Math.abs(Math.cos(lobes * ang / 2)));
        var x = CX + rad * Math.cos(ang), y = CY + rad * Math.sin(ang);
        dpath += (k ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      }
      dpath += 'Z';
      svg.appendChild(svgEl('path', { d: dpath, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      meta.textContent = 'latent (z1, z2) = (' + state.z1.toFixed(1) + ', ' + state.z2.toFixed(1) + ')  ·  解码为 ' + lobes + ' 瓣  ·  ' + (spike < 0.25 ? '圆润' : spike > 0.7 ? '尖锐' : '混合');
      formula.textContent = 'x = decoder(z),  z ~ N(0, I)   ·   相邻的 z 会解码为相似形状（平滑 latent space）';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'z1', 'latent z1', -3, 3, 0.1),
      slider(state, 'z2', 'latent z2', -3, 3, 0.1)
    ]);
    frame(host, 'VAE LATENT GRID', '拖动 z1 和 z2',
      grid, [svg, meta, formula],
      'VAE 将输入映射到平滑的 latent space，并把其中的点解码回输出。左侧方块是该空间的一个切片；圆点是你的 latent code。移动圆点会让右侧解码出的形状连续变形，因为 decoder 被训练为让相邻 code 产生相邻输出。');
    state._render();
  }

  // ── gan-minimax：generator 与 discriminator 的平衡及失败模式 ──────
  function ganMinimax(host) {
    var W = 520, H = 220, PAD = 34;
    // bal：-1 = generator 大幅领先，0 = 均衡，+1 = discriminator 大幅领先
    var state = { bal: 0 };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function px(b) { return PAD + (b + 1) / 2 * (W - 2 * PAD); }
    function py(v) { return H - PAD - clamp(v, 0, 3) / 3 * (H - 2 * PAD); }
    // D 在假样本上的准确率随 bal 上升；当 D 很确定时，传给 G 的 gradient 会消失
    function dLoss(b) { return 0.4 + 0.9 * (1 - Math.abs(b)); } // 胜者在两端 Loss 最低
    function gLoss(b) { return 0.5 + 1.4 * (b + 1) / 2; } // D 越强，generator 越吃力
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: H - PAD, x2: W - PAD, y2: H - PAD, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      // bal = 0 处的均衡标记
      var ex = px(0);
      svg.appendChild(svgEl('line', { x1: ex, y1: PAD, x2: ex, y2: H - PAD, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      function curve(fn, st) { var d = '', i, b; for (i = 0; i <= 100; i++) { b = -1 + 2 * i / 100; d += (i ? 'L' : 'M') + px(b).toFixed(1) + ' ' + py(fn(b)).toFixed(1) + ' '; } svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: st, 'stroke-width': '2' })); }
      curve(dLoss, 'var(--ink-mute,#999)');
      curve(gLoss, 'var(--blueprint,#3553ff)');
      var b = state.bal;
      svg.appendChild(svgEl('circle', { cx: px(b), cy: py(gLoss(b)), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      svg.appendChild(svgEl('circle', { cx: px(b), cy: py(dLoss(b)), r: '4', fill: 'var(--ink-mute,#999)' }));
      var mode;
      if (b > 0.55) mode = 'discriminator 过强：gradient 消失';
      else if (b < -0.55) mode = 'generator 占优：存在 mode collapse 风险';
      else mode = '接近均衡：有用的 gradient 可以流动';
      status.innerHTML = mode;
      meta.textContent = 'generator loss ' + gLoss(b).toFixed(2) + '  ·  discriminator loss ' + dLoss(b).toFixed(2) + '  ·  传给 G 的 gradient ' + ((1 - Math.abs(b)) * 100).toFixed(0) + '%';
      formula.textContent = 'min_G max_D  E[log D(x)] + E[log(1 - D(G(z)))]   ·   平衡会让博弈保持有信息量';
    };
    var grid = el('div', {}, [slider(state, 'bal', '平衡（-1 = G 领先，+1 = D 领先）', -1, 1, 0.05)]);
    frame(host, 'GAN MINIMAX', '拖动平衡',
      grid, [svg, el('div', { style: 'margin-top:12px' }, [status]), meta, formula],
      'GAN 是一个双人博弈：generator（蓝色）试图骗过 discriminator（灰色），而 discriminator 试图区分真实与伪造。两者必须一起变强。如果 discriminator 决定性获胜，它传给 generator 的 gradient 会消失；如果 generator 领先过快，就可能 collapse 到少数输出上。健康的训练会停留在虚线标记的均衡附近。');
    state._render();
  }

  // ── qlearning-gridworld：4x4 网格，训练 episode 中的 value 快照 ──
  function qlearningGridworld(host) {
    var W = 520, H = 240, GRID = 4, CELL = 52, OX = 40, OY = 18;
    var GOAL = 3, PIT = 9; // index = row*4 + col；goal 在 (0,3)，pit 在 (2,1)
    var state = { ep: 200 };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // 通过 deterministic 4x4 上的 value iteration 收敛得到的 value（gamma 0.9，step -0.04）
    var GAMMA = 0.9, STEP = -0.04, Rgoal = 1, Rpit = -1;
    function neighbors(s) {
      var r = Math.floor(s / GRID), c = s % GRID, out = [];
      if (r > 0) out.push(s - GRID); if (r < GRID - 1) out.push(s + GRID);
      if (c > 0) out.push(s - 1); if (c < GRID - 1) out.push(s + 1);
      return out;
    }
    var Vstar = []; var i;
    for (i = 0; i < GRID * GRID; i++) Vstar.push(0);
    Vstar[GOAL] = Rgoal; Vstar[PIT] = Rpit;
    (function () { var it, s, nb, best, k; for (it = 0; it < 200; it++) { for (s = 0; s < GRID * GRID; s++) { if (s === GOAL || s === PIT) continue; nb = neighbors(s); best = -1e9; for (k = 0; k < nb.length; k++) best = Math.max(best, Vstar[nb[k]]); Vstar[s] = STEP + GAMMA * best; } } })();
    function valueAt(s, ep) { if (s === GOAL) return Rgoal; if (s === PIT) return Rpit; return Vstar[s] * clamp(ep / 300, 0, 1); }
    function shade(v) {
      // 将 [-1,1] 中的 v 映射为 blueprint（正值）或 warn（负值）的透明度
      if (v >= 0) return { fill: 'var(--blueprint,#3553ff)', op: (0.08 + 0.6 * Math.min(1, v)).toFixed(2) };
      return { fill: 'var(--warn,#b8870f)', op: (0.08 + 0.6 * Math.min(1, -v)).toFixed(2) };
    }
    function bestDir(s, ep) {
      var nb = neighbors(s), best = -1e9, dir = null, k;
      for (k = 0; k < nb.length; k++) { var vv = valueAt(nb[k], ep); if (vv > best) { best = vv; dir = nb[k]; } }
      return dir;
    }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var s, r, c;
      for (s = 0; s < GRID * GRID; s++) {
        r = Math.floor(s / GRID); c = s % GRID;
        var x = OX + c * CELL, y = OY + r * CELL;
        var v = valueAt(s, state.ep), sh = shade(v);
        svg.appendChild(svgEl('rect', { x: x, y: y, width: CELL, height: CELL, fill: sh.fill, opacity: sh.op, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
        var cx = x + CELL / 2, cy = y + CELL / 2;
        if (s === GOAL) { svg.appendChild(svgEl('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', 'font-size': '12', fill: 'var(--ink,#1a1a1a)', 'font-family': 'monospace' }, [document.createTextNode('GOAL')])); }
        else if (s === PIT) { svg.appendChild(svgEl('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', 'font-size': '13', fill: 'var(--ink,#1a1a1a)', 'font-family': 'monospace' }, [document.createTextNode('PIT')])); }
        else {
          svg.appendChild(svgEl('text', { x: cx, y: y + CELL - 6, 'text-anchor': 'middle', 'font-size': '9', fill: 'var(--ink-mute,#777)', 'font-family': 'monospace' }, [document.createTextNode(v.toFixed(2))]));
          if (state.ep > 20) {
            var dir = bestDir(s, state.ep);
            if (dir != null) {
              var dr = Math.floor(dir / GRID) - r, dc = (dir % GRID) - c;
              var ax = cx + dc * 14, ay = (cy - 4) + dr * 14;
              svg.appendChild(svgEl('line', { x1: cx, y1: cy - 4, x2: ax, y2: ay, stroke: 'var(--ink,#1a1a1a)', 'stroke-width': '1.6' }));
              svg.appendChild(svgEl('circle', { cx: ax, cy: ay, r: '2.4', fill: 'var(--ink,#1a1a1a)' }));
            }
          }
        }
      }
      meta.textContent = 'episode ' + state.ep + ' / 300  ·  ' + (state.ep < 30 ? 'value 仍接近零' : state.ep < 200 ? 'value 正从 goal 扩散' : 'policy 已收敛');
      formula.textContent = 'Q(s,a) <- Q(s,a) + alpha [ r + gamma max_a\' Q(s\',a\') - Q(s,a) ]   ·   gamma = 0.9';
    };
    var grid = el('div', {}, [slider(state, 'ep', '训练 episodes', 0, 300, 10)]);
    frame(host, 'Q-LEARNING GRIDWORLD', '拖动 episodes',
      grid, [svg, meta, formula],
      'agent 学习到达 goal 并避开 pit。格子的底色表示学到的 state value（蓝色好，琥珀色差），箭头表示 greedy policy。早期 value 接近零；随着训练推进，value 会从 goal 向外传播，箭头会排列成一条绕开 pit 的路径。');
    state._render();
  }

  // ── value-iteration-gamma：沿一维链条向 goal 传播的 value ─
  function valueIterationGamma(host) {
    var W = 520, H = 200, N = 10, CELL = 44, OX = 36, OY = 70;
    var state = { gamma: 0.9 };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // goal 位于最右侧格子，reward 为 1；每一步没有 cost；V(s) = gamma^(dist)
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var g = state.gamma, i, vals = [];
      for (i = 0; i < N; i++) vals.push(Math.pow(g, (N - 1 - i)));
      for (i = 0; i < N; i++) {
        var x = OX + i * CELL, y = OY, v = vals[i];
        var op = (0.08 + 0.7 * v).toFixed(2);
        svg.appendChild(svgEl('rect', { x: x, y: y, width: CELL - 4, height: CELL - 4, fill: 'var(--blueprint,#3553ff)', opacity: op, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
        var cx = x + (CELL - 4) / 2;
        svg.appendChild(svgEl('text', { x: cx, y: y + (CELL - 4) / 2 + 4, 'text-anchor': 'middle', 'font-size': '9', fill: 'var(--ink,#1a1a1a)', 'font-family': 'monospace' }, [document.createTextNode(v.toFixed(2))]));
        if (i === N - 1) svg.appendChild(svgEl('text', { x: cx, y: y - 8, 'text-anchor': 'middle', 'font-size': '10', fill: 'var(--ink-mute,#777)', 'font-family': 'monospace' }, [document.createTextNode('GOAL')]));
        if (i < N - 1) { svg.appendChild(svgEl('line', { x1: x + CELL - 6, y1: y + (CELL - 4) / 2, x2: x + CELL + 2, y2: y + (CELL - 4) / 2, stroke: 'var(--ink-mute,#999)', 'stroke-width': '1.2' })); }
      }
      var reach = vals[0];
      meta.textContent = 'gamma = ' + g.toFixed(2) + '  ·  距 goal 9 步的 value = ' + reach.toFixed(3) + '  ·  ' + (g < 0.6 ? '短视：远期 reward 衰减' : g > 0.95 ? '长视：value 贯穿整条链' : '中等 horizon');
      formula.textContent = 'V(s) = gamma^(distance to goal)   ·   更高的 gamma 会让 value 从 goal 传播得更远';
    };
    var grid = el('div', {}, [slider(state, 'gamma', 'discount gamma', 0.1, 0.99, 0.01)]);
    frame(host, 'VALUE ITERATION', '拖动 gamma',
      grid, [svg, meta, formula],
      'Value iteration 会把 reward 从 goal 开始一步步向后传递。在这条链上，唯一的 reward 位于最右侧格子，因此每个 state 的价值等于 gamma 的“距 goal 距离”次方。较小的 gamma 会让远期 reward 几乎没有价值（短视）；接近 1 的 gamma 会把强 value 一直带回链条起点。');
    state._render();
  }

  // ── epsilon-greedy：explore/exploit 划分与累积 regret ────────────
  function epsilonGreedy(host) {
    var W = 520, H = 210, PAD = 32, N = 500;
    var state = { eps: 0.1, decay: 1 }; // decay 1 = fixed，0 = decaying schedule
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var bar = el('i');
    var barWrap = el('div', { class: 'lf-bar' }, [bar]);
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function epsAt(t) { return state.decay > 0.5 ? state.eps : state.eps / (1 + t / 60); }
    function px(t) { return PAD + t / N * (W - 2 * PAD); }
    function py(v, vmax) { return H - PAD - clamp(v / vmax, 0, 1) * (H - 2 * PAD); }
    var GAP = 0.4; // 每次 exploratory pull（次优臂）的 regret cost
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: H - PAD, x2: W - PAD, y2: H - PAD, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      var t, regret = 0, pts = [], vmax = 1e-6;
      for (t = 0; t <= N; t++) { regret += epsAt(t) * GAP; pts.push(regret); }
      vmax = pts[N];
      var d = '';
      for (t = 0; t <= N; t += 5) { d += (t ? 'L' : 'M') + px(t).toFixed(1) + ' ' + py(pts[t], vmax).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      var e0 = epsAt(0), eEnd = epsAt(N);
      bar.style.width = (e0 * 100).toFixed(0) + '%';
      meta.textContent = '初始 explore ' + Math.round(e0 * 100) + '% / exploit ' + Math.round((1 - e0) * 100) + '%  ·  结束 explore ' + Math.round(eEnd * 100) + '%  ·  总 regret ' + vmax.toFixed(1);
      formula.textContent = state.decay > 0.5
        ? 'fixed epsilon：regret 会永远线性增长  ·  P(explore) = ' + state.eps.toFixed(2)
        : 'decaying epsilon_t = epsilon_0 / (1 + t/60)  ·  随着 exploration 减少，regret 趋于平坦';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'eps', 'epsilon（explore rate）', 0, 0.5, 0.01),
      select(state, 'decay', 'schedule', [['fixed', '1'], ['decaying', '0']])
    ]);
    frame(host, 'EPSILON-GREEDY', '拖动 epsilon',
      grid, [el('div', { class: 'lf-meta' }, ['动作中的 explore 占比']), barWrap, svg, meta, formula],
      'agent 以 epsilon 的概率 explore 一个随机动作；否则 exploit 当前最优估计。条形图显示 explore/exploit 的划分，曲线表示累积 regret，也就是没有始终选择最佳臂而放弃的 reward。fixed epsilon 会让 regret 永远累积；decaying schedule 会先在早期 explore，随后 exploit，因此 regret 会变平。');
    state._render();
  }

  // ── discount-horizon：effective horizon 与几何权重衰减 ─────────
  function discountHorizon(host) {
    var W = 520, H = 210, PAD = 32, TMAX = 40;
    var state = { gamma: 0.9 };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function px(t) { return PAD + t / TMAX * (W - 2 * PAD); }
    function py(w) { return H - PAD - w * (H - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: H - PAD, x2: W - PAD, y2: H - PAD, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      var g = state.gamma, t;
      for (t = 0; t <= TMAX; t++) {
        var w = Math.pow(g, t);
        svg.appendChild(svgEl('rect', { x: px(t) - 3, y: py(w), width: 6, height: (H - PAD) - py(w), fill: 'var(--blueprint,#3553ff)', opacity: '0.85' }));
      }
      var hor = 1 / (1 - g);
      // 标记 effective horizon
      var hx = px(Math.min(TMAX, hor));
      svg.appendChild(svgEl('line', { x1: hx, y1: PAD, x2: hx, y2: H - PAD, stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5', 'stroke-dasharray': '4 3' }));
      num.innerHTML = hor.toFixed(1) + ' <small>步 horizon</small>';
      meta.textContent = 'gamma = ' + g.toFixed(2) + '  ·  horizon 处的权重 = ' + Math.pow(g, hor).toFixed(2) + '（约 1/e）  ·  20 步后的 reward 权重为 ' + Math.pow(g, 20).toFixed(3);
      formula.textContent = 'return = sum_t gamma^t r_t   ·   effective horizon = 1/(1 - gamma)   ·   权重按几何级数衰减';
    };
    var grid = el('div', {}, [slider(state, 'gamma', 'discount gamma', 0.5, 0.99, 0.01)]);
    frame(host, 'DISCOUNT HORIZON', '拖动 gamma',
      grid, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula],
      '距离当前 t 步的未来 reward 会按 gamma^t 加权，因此权重会按几何级数下降（柱状条）。虚线标记 effective horizon 1/(1 - gamma)，此处权重已下降到约 1/e。提高 gamma 会拉长这个 horizon，让 agent 关注更远未来的 reward。');
    state._render();
  }

  // ── policy-gradient-landscape：Gradient ascent 爬向 reward 峰值 ──────
  function policyGradientLandscape(host) {
    var W = 520, H = 230, PAD = 30;
    var state = { lr: 0.15, steps: 14, theta0: -2.4 };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // reward J(theta)：平滑的峰形 landscape，最大值接近 theta = 1.2
    function J(t) { return 3 * Math.exp(-0.35 * (t - 1.2) * (t - 1.2)) + 0.4 * Math.exp(-0.8 * (t + 2) * (t + 2)); }
    function grad(t) { var h = 1e-3; return (J(t + h) - J(t - h)) / (2 * h); }
    function px(t) { return PAD + (t + 3.5) / 7 * (W - 2 * PAD); }
    function py(v) { return H - PAD - v / 3.4 * (H - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var d = '', i, x;
      for (i = 0; i <= 140; i++) { x = -3.5 + 7 * i / 140; d += (i ? 'L' : 'M') + px(x).toFixed(1) + ' ' + py(J(x)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '2' }));
      var th = state.theta0, pts = [], t;
      for (t = 0; t <= state.steps; t++) { pts.push(th); th = th + state.lr * grad(th); th = clamp(th, -3.4, 3.4); }
      var pd = '';
      pts.forEach(function (p, idx) { pd += (idx ? 'L' : 'M') + px(p).toFixed(1) + ' ' + py(J(p)).toFixed(1) + ' '; });
      svg.appendChild(svgEl('path', { d: pd, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5', 'stroke-dasharray': '4 3' }));
      pts.forEach(function (p, idx) { svg.appendChild(svgEl('circle', { cx: px(p), cy: py(J(p)), r: idx === pts.length - 1 ? '5' : '3', fill: 'var(--blueprint,#3553ff)' })); });
      var last = pts[pts.length - 1];
      var atPeak = Math.abs(last - 1.2) < 0.2;
      status.innerHTML = atPeak ? '到达峰值' : 'J(theta) = ' + J(last).toFixed(2);
      meta.textContent = 'theta = ' + last.toFixed(2) + '  ·  reward ' + J(last).toFixed(3) + ' / ' + J(1.2).toFixed(2) + ' max  ·  ' + (state.lr > 0.6 ? 'large lr：可能越过峰值' : '爬升中');
      formula.textContent = 'theta <- theta + lr · grad_theta J(theta)   ·   ascent 会朝更高 expected reward 移动';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'lr', 'learning rate', 0.02, 1.0, 0.02),
      slider(state, 'steps', 'steps', 1, 40, 1),
      slider(state, 'theta0', 'start theta', -3.2, 3.2, 0.1)
    ]);
    frame(host, 'POLICY GRADIENT', '拖动 learning rate',
      grid, [svg, el('div', { style: 'margin-top:12px' }, [status]), meta, formula],
      'Policy gradient 方法会沿着提升 expected reward 的方向调整 policy 参数 theta。这里灰色曲线是 reward landscape，圆点是向峰值爬升的 ascent steps。较小的 rate 会缓慢爬升；过大的 rate 会越过峰值；如果从左侧开始，左边的局部凸起可能困住爬升过程。');
    state._render();
  }

  LF.register({
    'diffusion-denoise': diffusionDenoise,
    'noise-schedule': noiseSchedule,
    'vae-latent-grid': vaeLatentGrid,
    'gan-minimax': ganMinimax,
    'qlearning-gridworld': qlearningGridworld,
    'value-iteration-gamma': valueIterationGamma,
    'epsilon-greedy': epsilonGreedy,
    'discount-horizon': discountHorizon,
    'policy-gradient-landscape': policyGradientLandscape
  });
})();
