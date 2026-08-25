/* figures-speech2.js — Phase 6（语音与音频）的动画课程图示。
   在 lesson-figures.js 之后加载，并通过 window.LF 注册组件。
   原生 ES5，无依赖，通过 CSS 变量适配主题。使用 SMIL 动画的 SVG，无 JavaScript 循环动画。
   编写方式与 docs/en.md 中的 fenced block 相同：
       ```figure
       sp-ctc-alignment
       ``` */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;

  function shell(label, hint, svg, caption) {
    return el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [hint])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out' }, [svg])]),
      el('div', { class: 'lf-cap' }, [caption])
    ]);
  }
  function tx(t) { return document.createTextNode(t); }
  function anim(attrs) { return svgEl('animate', attrs); }
  function label(x, y, t, anchor) {
    return svgEl('text', { x: x, y: y, fill: 'var(--ink-mute,#777)', 'font-size': '10', 'font-family': 'monospace', 'text-anchor': anchor || 'start' }, [tx(t)]);
  }

  // ── sp-asr-attention：decoder 对 encoder 音频帧执行 Cross-Attention ──────
  function asrAttention(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    // 顶部排列 encoder 音频帧，底部输出 decoder Token，
    // 每个新 Token 都会点亮一条柔和的 Cross-Attention 权重对角带。
    var frames = 12, fw = 38, x0 = 22, ftop = 44, fh = 26;
    svg.appendChild(label(x0, 28, 'encoder：30 秒 log-mel 帧'));
    var i;
    for (i = 0; i < frames; i++) {
      var energy = (0.35 + 0.5 * Math.abs(Math.sin(i * 0.7))).toFixed(2);
      svg.appendChild(svgEl('rect', { x: x0 + i * fw, y: ftop, width: fw - 5, height: fh, fill: 'var(--blueprint,#3553ff)', opacity: energy, rx: '2' }));
    }
    // decoder 从左到右输出 Token
    var toks = ['<sot>', 'the', 'cat', 'sat'];
    var dy = 168;
    svg.appendChild(label(x0, 150, 'decoder：执行 Cross-Attention，每次输出一个 Token'));
    toks.forEach(function (t, k) {
      var tcx = x0 + k * 70;
      var g = svgEl('text', { x: tcx, y: dy, fill: 'var(--blueprint,#3553ff)', 'font-size': '13', 'font-family': 'monospace', opacity: '0' }, [tx(t)]);
      g.appendChild(anim({ attributeName: 'opacity', values: '0;0;1;1', keyTimes: ['0', (0.12 + k * 0.2).toFixed(2), (0.2 + k * 0.2).toFixed(2), '1'].join(';'), dur: '6s', repeatCount: 'indefinite' }));
      svg.appendChild(g);
      // 覆盖当前关注帧的柔和 Attention 带（单调漂移）
      var focus = Math.round(k / (toks.length - 1) * (frames - 3)) + 1;
      var band = svgEl('rect', { x: x0 + focus * fw - 3, y: ftop - 4, width: fw * 2.4, height: fh + 8, fill: 'var(--warn,#b8870f)', opacity: '0', rx: '3' });
      var bandVals = ['0', '0', '0.28', '0.28', '0'];
      var bandTimes = ['0', (0.12 + k * 0.2).toFixed(2), (0.22 + k * 0.2).toFixed(2), (0.3 + k * 0.2).toFixed(2), (0.4 + k * 0.2).toFixed(2)];
      if (0.4 + k * 0.2 < 1) { bandVals.push('0'); bandTimes.push('1'); }
      band.appendChild(anim({ attributeName: 'opacity', values: bandVals.join(';'), keyTimes: bandTimes.join(';'), dur: '6s', repeatCount: 'indefinite' }));
      svg.appendChild(band);
    });
    svg.appendChild(label(x0, 208, 'Attention 从左向右漂移：学习得到的软对齐（没有 blank Token）'));
    host.appendChild(shell('ASR CROSS-ATTENTION', 'decoder 关注音频',
      svg,
      'Whisper 是一个 encoder-decoder。encoder 将 30 秒的 log-mel 窗口转换为一排音频帧，decoder 每次输出一个 Token，并在每一步对这些帧执行 Cross-Attention。高亮带展示了 Attention 如何随着转录推进而从左向右漂移。这是一种学习得到的软对齐，而不是 CTC Model 使用的固定逐帧 Label。'));
  }

  // ── sp-eer-crossover：FAR 与 FRR 曲线在 EER 阈值处相交 ─────
  function eerCrossover(host) {
    var W = 520, H = 230, PAD = 34;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    function px(t) { return PAD + t * (W - 2 * PAD); }
    function py(v) { return H - PAD - v * (H - 2 * PAD); }
    // FRR 随阈值升高而上升，FAR 随之下降；两者在 t=0.5 附近相交，即 EER。
    function far(t) { return Math.exp(-3.2 * t); }
    function frr(t) { return Math.exp(-3.2 * (1 - t)); }
    function path(fn) { var d = '', i; for (i = 0; i <= 60; i++) { var t = i / 60; d += (i ? 'L' : 'M') + px(t).toFixed(1) + ' ' + py(fn(t)).toFixed(1) + ' '; } return d; }
    svg.appendChild(svgEl('line', { x1: PAD, y1: H - PAD, x2: W - PAD, y2: H - PAD, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
    svg.appendChild(label(PAD, 22, '错误率与决策阈值'));
    svg.appendChild(svgEl('path', { d: path(far), fill: 'none', stroke: 'var(--ink-mute,#999)', 'stroke-width': '2' }));
    svg.appendChild(svgEl('path', { d: path(frr), fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
    svg.appendChild(label(px(0.06), py(far(0.06)) - 6, 'FAR'));
    svg.appendChild(label(px(0.82), py(frr(0.82)) - 6, 'FRR'));
    // 滑动的阈值线
    var thr = svgEl('line', { x1: px(0.2), y1: PAD, x2: px(0.2), y2: H - PAD, stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5' });
    thr.appendChild(anim({ attributeName: 'x1', values: [px(0.15), px(0.85), px(0.5), px(0.5)].join(';'), keyTimes: '0;0.45;0.75;1', dur: '6s', repeatCount: 'indefinite' }));
    thr.appendChild(anim({ attributeName: 'x2', values: [px(0.15), px(0.85), px(0.5), px(0.5)].join(';'), keyTimes: '0;0.45;0.75;1', dur: '6s', repeatCount: 'indefinite' }));
    svg.appendChild(thr);
    // EER 交点标记，阈值稳定在此处时脉动
    var cy = py(far(0.5));
    var dot = svgEl('circle', { cx: px(0.5), cy: cy, r: '5', fill: 'var(--warn,#b8870f)', opacity: '0' });
    dot.appendChild(anim({ attributeName: 'opacity', values: '0;0;1;1', keyTimes: '0;0.7;0.78;1', dur: '6s', repeatCount: 'indefinite' }));
    dot.appendChild(anim({ attributeName: 'r', values: '5;5;7;5', keyTimes: '0;0.78;0.88;1', dur: '6s', repeatCount: 'indefinite' }));
    svg.appendChild(dot);
    svg.appendChild(label(px(0.5) + 10, cy - 8, 'EER：FAR = FRR'));
    host.appendChild(shell('EER 交点', '滑动阈值',
      svg,
      '提高阈值会拒绝更多真实说话者（FRR 上升）；降低阈值则会接受更多冒充者（FAR 上升）。橙色线扫过不同阈值，最后停在两条曲线的交点。这个唯一的交点就是 Equal Error Rate，也是每个说话者验证排行榜都会引用的指标。'));
  }

  // ── sp-tts-stack：文本 -> mel spectrogram -> waveform，三个阶段 ────────
  function ttsStack(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    // 阶段 1：文本 Token
    svg.appendChild(label(18, 22, '文本 -> Token'));
    ['hel', 'lo', 'wor', 'ld'].forEach(function (t, i) {
      var bx = 18 + i * 36;
      svg.appendChild(svgEl('rect', { x: bx, y: 32, width: 32, height: 22, fill: 'var(--blueprint,#3553ff)', opacity: '0.25', rx: '2' }));
      svg.appendChild(svgEl('text', { x: bx + 16, y: 47, fill: 'var(--ink,#222)', 'font-size': '10', 'font-family': 'monospace', 'text-anchor': 'middle' }, [tx(t)]));
    });
    // 阶段 2：mel 网格，单元格渐显
    svg.appendChild(label(18, 90, 'acoustic model -> mel spectrogram'));
    var cols = 7, rows = 3, cw = 40, ch = 14, gx = 18, gy = 100;
    var r, c;
    for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
      var energy = (Math.sin(c * 0.6 + r * 0.9) * 0.4 + 0.5) * (1 - r / rows * 0.5);
      var cell = svgEl('rect', { x: gx + c * cw, y: gy + r * ch, width: cw - 1, height: ch - 1, fill: 'var(--blueprint,#3553ff)', opacity: '0' });
      cell.appendChild(anim({ attributeName: 'opacity', values: ['0', '0', energy.toFixed(2), energy.toFixed(2)].join(';'), keyTimes: ['0', (0.15 + c / cols * 0.35).toFixed(2), (0.25 + c / cols * 0.35).toFixed(2), '1'].join(';'), dur: '5s', repeatCount: 'indefinite' }));
      svg.appendChild(cell);
    }
    // 阶段 3：vocoder -> waveform 变形
    svg.appendChild(label(18, 178, 'vocoder -> waveform'));
    var wy = 205, wx0 = 18, wlen = 484;
    function wavePath(amp, freq) { var d = '', i; for (i = 0; i <= 80; i++) { var x = wx0 + wlen * i / 80; var y = wy + amp * Math.sin(i * freq) * (0.4 + 0.6 * Math.sin(i * 0.15)); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '; } return d; }
    var flat = ''; var k; for (k = 0; k <= 80; k++) { flat += (k ? 'L' : 'M') + (wx0 + wlen * k / 80).toFixed(1) + ' ' + wy + ' '; }
    var wave = svgEl('path', { d: flat, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.6' });
    wave.appendChild(anim({ attributeName: 'd', values: [flat, flat, wavePath(16, 0.9), wavePath(13, 1.3)].join(';'), keyTimes: '0;0.55;0.8;1', dur: '5s', repeatCount: 'indefinite' }));
    svg.appendChild(wave);
    host.appendChild(shell('TTS 技术栈', '从文本到 mel，再到 waveform',
      svg,
      '现代 text-to-speech 分三个阶段运行。frontend 将字符串转换为 Token，acoustic model 逐列绘制 mel spectrogram，vocoder 再将 mel 转换为可听的 waveform。端到端 flow-matching Model 模糊了后两个阶段之间的边界，但在分析和调试合成语音时，这幅三阶段图仍然适用。'));
  }

  // ── sp-codec-tokens：RVQ codebook 栈输入 autoregressive decoder ────
  function codecTokens(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    svg.appendChild(label(18, 22, 'residual vector quantization：每帧使用 4 个 codebook'));
    var rows = 4, steps = 5, x0 = 30, y0 = 36, cw = 48, ch = 26, gap = 12;
    // codebook 层级 Label
    var lv;
    for (lv = 0; lv < rows; lv++) {
      svg.appendChild(label(0, y0 + lv * (ch + gap) + 17, 'q' + lv, 'start'));
    }
    var r, c;
    for (r = 0; r < rows; r++) for (c = 0; c < steps; c++) {
      var bx = x0 + c * (cw + gap), by = y0 + r * (ch + gap);
      var fill = r === 0 ? 'var(--warn,#b8870f)' : 'var(--blueprint,#3553ff)';
      var rect = svgEl('rect', { x: bx, y: by, width: cw, height: ch, fill: fill, opacity: '0', rx: '2' });
      var t = 0.1 + c / steps * 0.6 + r * 0.02;
      rect.appendChild(anim({ attributeName: 'opacity', values: ['0', '0', (r === 0 ? 0.85 : 0.55).toFixed(2), (r === 0 ? 0.85 : 0.55).toFixed(2)].join(';'), keyTimes: ['0', t.toFixed(2), (t + 0.06).toFixed(2), '1'].join(';'), dur: '5s', repeatCount: 'indefinite' }));
      svg.appendChild(rect);
    }
    svg.appendChild(label(x0, y0 + rows * (ch + gap) + 6, 'q0 = semantic（语言内容）   q1..q3 = 声学细节'));
    // 求和 -> 输出 waveform
    svg.appendChild(label(18, 210, 'decoder 对 code 求和 ->'));
    var wy = 222, wx0 = 150, wlen = 350;
    function wavePath(amp) { var d = '', i; for (i = 0; i <= 70; i++) { var x = wx0 + wlen * i / 70; var y = wy + amp * Math.sin(i * 1.1) * (0.5 + 0.5 * Math.cos(i * 0.2)); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '; } return d; }
    var flat = ''; var k; for (k = 0; k <= 70; k++) { flat += (k ? 'L' : 'M') + (wx0 + wlen * k / 70).toFixed(1) + ' ' + wy + ' '; }
    var wave = svgEl('path', { d: flat, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.6' });
    wave.appendChild(anim({ attributeName: 'd', values: [flat, flat, wavePath(14), wavePath(11)].join(';'), keyTimes: '0;0.7;0.88;1', dur: '5s', repeatCount: 'indefinite' }));
    svg.appendChild(wave);
    host.appendChild(shell('NEURAL CODEC TOKENS', '从 RVQ codebook 到 waveform',
      svg,
      'Neural audio codec 使用 residual vector quantization 将声音离散化：第一个 codebook 捕获信号，之后每个 codebook 都对剩余 residual 进行 quantization。将第一个 codebook 拆分为 semantic 部分（语言内容，以金色显示），并与其余声学信息分开，Transformer 就能像预测单词一样预测语音 Token。decoder 对每帧选中的 code 求和，将其还原为 waveform。'));
  }

  // ── sp-vad-cascade：由语音/静音状态和 hangover timer 控制的 waveform ───
  function vadCascade(host) {
    var W = 520, H = 230, PAD = 18;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var wy = 70, wlen = W - 2 * PAD;
    svg.appendChild(label(PAD, 28, '这个 20 ms 帧是语音吗？Silero VAD 逐帧判断'));
    // 分段：静音、语音、短暂停顿、语音、长时间静音（轮次结束）
    var segs = [[0, 0.12, 0], [0.12, 0.42, 1], [0.42, 0.5, 0], [0.5, 0.74, 1], [0.74, 1, 0]];
    segs.forEach(function (s) {
      var sx = PAD + s[0] * wlen, ex = PAD + s[1] * wlen;
      var d = '', i, npts = Math.max(2, Math.round((s[1] - s[0]) * 90));
      for (i = 0; i <= npts; i++) { var x = sx + (ex - sx) * i / npts; var amp = s[2] ? 22 * Math.sin(i * 1.4) * (0.6 + 0.4 * Math.sin(i * 0.3)) : 1.5 * Math.sin(i * 2.0); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (wy + amp).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: s[2] ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#bbb)', 'stroke-width': s[2] ? '1.6' : '1' }));
    });
    // VAD 决策轨道
    svg.appendChild(label(PAD, 128, 'VAD 决策'));
    segs.forEach(function (s) {
      var sx = PAD + s[0] * wlen;
      svg.appendChild(svgEl('rect', { x: sx, y: 136, width: (s[1] - s[0]) * wlen - 2, height: 16, fill: s[2] ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#eee)', opacity: s[2] ? '0.8' : '0.6' }));
    });
    // hangover timer 在最终静音期间逐渐填满，随后触发轮次结束
    svg.appendChild(label(PAD, 178, '静音 hangover -> 触发轮次结束'));
    var hbX = PAD + 0.74 * wlen, hbW = 0.26 * wlen - 4;
    svg.appendChild(svgEl('rect', { x: hbX, y: 186, width: hbW, height: 14, fill: 'none', stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1' }));
    var fill = svgEl('rect', { x: hbX, y: 186, width: '0', height: 14, fill: 'var(--warn,#b8870f)', opacity: '0.7' });
    fill.appendChild(anim({ attributeName: 'width', values: ['0', '0', hbW.toFixed(0), hbW.toFixed(0)].join(';'), keyTimes: '0;0.74;0.95;1', dur: '5s', repeatCount: 'indefinite' }));
    svg.appendChild(fill);
    var fire = svgEl('circle', { cx: hbX + hbW + 8, cy: 193, r: '5', fill: 'var(--warn,#b8870f)', opacity: '0' });
    fire.appendChild(anim({ attributeName: 'opacity', values: '0;0;1;0', keyTimes: '0;0.94;0.96;1', dur: '5s', repeatCount: 'indefinite' }));
    svg.appendChild(fire);
    host.appendChild(shell('VAD + TURN-TAKING', '语音、停顿、hangover、轮次结束',
      svg,
      '检测器将每个 20 ms 帧标记为语音或静音。句子中间的短暂停顿不能结束当前轮次，因此必须等静音 hangover timer 完全填满后，才能触发 end-pointing。hangover 设置得太短会打断用户；设置得太长则会让助手一直等待。只有持续静音超过 timer 时，当前轮次才会结束。'));
  }

  // ── sp-fullduplex：两路并行音频流 + inner-monologue 文本 ───────
  function fullDuplex(host) {
    var W = 520, H = 230, PAD = 18;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var wlen = W - 2 * PAD;
    function wavePath(yc, amp, freq, phase) { var d = '', i; for (i = 0; i <= 90; i++) { var x = PAD + wlen * i / 90; var y = yc + amp * Math.sin(i * freq + phase) * (0.55 + 0.45 * Math.sin(i * 0.12 + phase)); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '; } return d; }
    // 用户输入流（持续到达）
    svg.appendChild(label(PAD, 26, '用户音频输入（Mimi Token，持续到达）'));
    var inW = svgEl('path', { d: wavePath(54, 16, 1.0, 0), fill: 'none', stroke: 'var(--ink-mute,#999)', 'stroke-width': '1.6' });
    inW.appendChild(anim({ attributeName: 'd', values: [wavePath(54, 16, 1.0, 0), wavePath(54, 16, 1.0, 1.6), wavePath(54, 16, 1.0, 3.2)].join(';'), keyTimes: '0;0.5;1', dur: '4s', repeatCount: 'indefinite' }));
    svg.appendChild(inW);
    // inner-monologue 文本轨道（中间表示）
    svg.appendChild(label(PAD, 110, 'inner-monologue 文本（中间表示，而非独立阶段）'));
    ['the', 'weather', 'is', 'sunny', 'today'].forEach(function (w, i) {
      var bx = PAD + i * 96;
      var g = svgEl('text', { x: bx, y: 134, fill: 'var(--blueprint,#3553ff)', 'font-size': '13', 'font-family': 'monospace', opacity: '0' }, [tx(w)]);
      g.appendChild(anim({ attributeName: 'opacity', values: '0;0;1;1', keyTimes: ['0', (0.1 + i * 0.13).toFixed(2), (0.2 + i * 0.13).toFixed(2), '1'].join(';'), dur: '4s', repeatCount: 'indefinite' }));
      svg.appendChild(g);
    });
    // Model 自身的输出流，同时生成
    svg.appendChild(label(PAD, 176, "Model 音频输出（同时生成，full-duplex）"));
    var outW = svgEl('path', { d: wavePath(202, 0, 1.3, 0), fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.6' });
    outW.appendChild(anim({ attributeName: 'd', values: [wavePath(202, 0, 1.3, 0), wavePath(202, 0, 1.3, 0), wavePath(202, 18, 1.3, 1.2), wavePath(202, 14, 1.3, 2.4)].join(';'), keyTimes: '0;0.3;0.65;1', dur: '4s', repeatCount: 'indefinite' }));
    svg.appendChild(outW);
    host.appendChild(shell('FULL-DUPLEX SPEECH', '同时聆听和说话',
      svg,
      '流水线式语音 Agent 存在延迟下限，因为每个阶段都必须等待前一个阶段完成。full-duplex Model 将流水线合并：它在接收用户输入流的同时输出自己的音频流，并将 inner-monologue 文本作为中间表示，而不是必经的独立阶段。聆听与说话能够重叠，这正是实现 200 ms 响应延迟的方式。'));
  }

  // ── sp-wer-align：reference 与 hypothesis 的 edit-distance 对齐 ───────
  function werAlign(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 220' });
    // reference 与 hypothesis 之间包含一次 substitution、一次 deletion 和一次 insertion
    var cols = [
      { ref: 'turn', hyp: 'turn', op: 'ok' },
      { ref: 'on', hyp: 'on', op: 'ok' },
      { ref: 'the', hyp: '', op: 'del' },
      { ref: 'kitchen', hyp: 'chicken', op: 'sub' },
      { ref: '', hyp: 'now', op: 'ins' },
      { ref: 'lights', hyp: 'lights', op: 'ok' }
    ];
    var n = cols.length, cw = 80, x0 = 14;
    svg.appendChild(label(x0, 26, 'reference'));
    svg.appendChild(label(x0, 150, 'hypothesis（ASR 输出）'));
    var colors = { ok: 'var(--blueprint,#3553ff)', sub: 'var(--warn,#b8870f)', del: 'var(--ink-mute,#999)', ins: 'var(--warn,#b8870f)' };
    cols.forEach(function (c, i) {
      var cx = x0 + i * cw;
      if (c.ref) {
        svg.appendChild(svgEl('rect', { x: cx, y: 36, width: cw - 8, height: 26, fill: 'var(--rule-soft,#eee)', rx: '2' }));
        svg.appendChild(svgEl('text', { x: cx + (cw - 8) / 2, y: 54, fill: 'var(--ink,#222)', 'font-size': '11', 'font-family': 'monospace', 'text-anchor': 'middle' }, [tx(c.ref)]));
      }
      if (c.hyp) {
        svg.appendChild(svgEl('rect', { x: cx, y: 160, width: cw - 8, height: 26, fill: c.op === 'ok' ? 'var(--rule-soft,#eee)' : 'rgba(184,135,15,0.18)', rx: '2' }));
        svg.appendChild(svgEl('text', { x: cx + (cw - 8) / 2, y: 178, fill: 'var(--ink,#222)', 'font-size': '11', 'font-family': 'monospace', 'text-anchor': 'middle' }, [tx(c.hyp)]));
      }
      // 按顺序绘制对齐连线
      var lk = svgEl('line', { x1: cx + (cw - 8) / 2, y1: 64, x2: cx + (cw - 8) / 2, y2: 158, stroke: colors[c.op], 'stroke-width': c.op === 'ok' ? '1.5' : '2', 'stroke-dasharray': c.op === 'ok' ? '0' : '4 3', opacity: '0' });
      lk.appendChild(anim({ attributeName: 'opacity', values: '0;0;1;1', keyTimes: ['0', (0.1 + i * 0.12).toFixed(2), (0.2 + i * 0.12).toFixed(2), '1'].join(';'), dur: '5s', repeatCount: 'indefinite' }));
      svg.appendChild(lk);
      if (c.op !== 'ok') {
        var tag = svgEl('text', { x: cx + (cw - 8) / 2, y: 116, fill: colors[c.op], 'font-size': '9', 'font-family': 'monospace', 'text-anchor': 'middle', opacity: '0' }, [tx(c.op.toUpperCase())]);
        tag.appendChild(anim({ attributeName: 'opacity', values: '0;0;1;1', keyTimes: ['0', (0.2 + i * 0.12).toFixed(2), (0.3 + i * 0.12).toFixed(2), '1'].join(';'), dur: '5s', repeatCount: 'indefinite' }));
        svg.appendChild(tag);
      }
    });
    svg.appendChild(label(x0, 210, 'WER = (S + D + I) / N = (1 + 1 + 1) / 5 = 60%'));
    host.appendChild(shell('WORD ERROR RATE', '将 reference 与 hypothesis 对齐',
      svg,
      'Word Error Rate 是一种 edit distance。转录文本与 reference 逐词对齐，每处不匹配都会被计为 substitution、deletion 或 insertion。三者之和除以 reference 的单词数，就是 WER。这里包含一次 substitution（kitchen 变为 chicken）、一次 deletion（the）和一次 insertion（now）；reference 共有五个单词，因此 WER 为百分之六十。'));
  }

  // ── sp-voice-factorize：拆分内容与说话者，替换说话者，再重新组合 ───
  function voiceFactorize(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    var wlen = 150;
    function wavePath(x0, yc, amp, freq, phase) { var d = '', i; for (i = 0; i <= 50; i++) { var x = x0 + wlen * i / 50; var y = yc + amp * Math.sin(i * freq + phase) * (0.5 + 0.5 * Math.sin(i * 0.18)); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '; } return d; }
    // 左侧的源音频片段
    svg.appendChild(label(18, 24, '源音频：人物 A 说 "hello"'));
    svg.appendChild(svgEl('path', { d: wavePath(18, 56, 16, 1.1, 0), fill: 'none', stroke: 'var(--ink-mute,#999)', 'stroke-width': '1.6' }));
    // 分解为内容 Token 与说话者 A 的 Embedding
    svg.appendChild(label(210, 24, '分解'));
    var cTok = svgEl('rect', { x: 210, y: 40, width: 92, height: 22, fill: 'var(--blueprint,#3553ff)', opacity: '0', rx: '2' });
    cTok.appendChild(anim({ attributeName: 'opacity', values: '0;0;0.7;0.7', keyTimes: '0;0.18;0.3;1', dur: '6s', repeatCount: 'indefinite' }));
    svg.appendChild(cTok);
    var cLab = svgEl('text', { x: 256, y: 55, fill: 'var(--bg,#fff)', 'font-size': '10', 'font-family': 'monospace', 'text-anchor': 'middle', opacity: '0' }, [tx('内容')]);
    cLab.appendChild(anim({ attributeName: 'opacity', values: '0;0;1;1', keyTimes: '0;0.18;0.3;1', dur: '6s', repeatCount: 'indefinite' }));
    svg.appendChild(cLab);
    var spkA = svgEl('circle', { cx: 256, cy: 92, r: '14', fill: 'var(--ink-mute,#999)', opacity: '0' });
    spkA.appendChild(anim({ attributeName: 'opacity', values: '0;0;0.8;0.8;0.25;0.25', keyTimes: '0;0.18;0.3;0.45;0.55;1', dur: '6s', repeatCount: 'indefinite' }));
    svg.appendChild(spkA);
    svg.appendChild(label(238, 120, 'spk A（丢弃）'));
    // 换入参考说话者 B 的 Embedding
    svg.appendChild(label(18, 150, '参考音频：人物 B 的 5 秒录音'));
    var spkB = svgEl('circle', { cx: 256, cy: 92, r: '14', fill: 'var(--warn,#b8870f)', opacity: '0' });
    spkB.appendChild(anim({ attributeName: 'opacity', values: '0;0;0;0.85;0.85', keyTimes: '0;0.45;0.5;0.6;1', dur: '6s', repeatCount: 'indefinite' }));
    svg.appendChild(spkB);
    var swap = svgEl('path', { d: 'M 110 168 Q 200 150 244 100', fill: 'none', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5', 'stroke-dasharray': '4 3', opacity: '0' });
    swap.appendChild(anim({ attributeName: 'opacity', values: '0;0;0.9;0.9;0;0', keyTimes: '0;0.45;0.55;0.7;0.8;1', dur: '6s', repeatCount: 'indefinite' }));
    svg.appendChild(swap);
    // 重新组合 -> 输出使用 B 声音的 waveform
    svg.appendChild(label(330, 24, '重新组合 -> B 说 "hello"'));
    var out = svgEl('path', { d: wavePath(338, 92, 0, 1.4, 0), fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.6' });
    out.appendChild(anim({ attributeName: 'd', values: [wavePath(338, 92, 0, 1.4, 0), wavePath(338, 92, 0, 1.4, 0), wavePath(338, 92, 17, 1.4, 0.5)].join(';'), keyTimes: '0;0.65;1', dur: '6s', repeatCount: 'indefinite' }));
    svg.appendChild(out);
    svg.appendChild(label(18, 220, '内容相同，说话者身份已替换；必须添加不可听 watermark'));
    host.appendChild(shell('语音分解', '拆分、替换说话者、重新组合',
      svg,
      '语音克隆和语音转换都建立在同一种分解之上：将说了什么与是谁说的分开。源音频片段被分解为内容表示和说话者 Embedding；随后丢弃源说话者，并换入来自人物 B 五秒参考音频的 Embedding。将内容与新的说话者重新组合，就能得到 B 说出相同话语的结果，因此 consent gate 和 watermark 必不可少。'));
  }

  LF.register({
    'sp-asr-attention': asrAttention,
    'sp-eer-crossover': eerCrossover,
    'sp-tts-stack': ttsStack,
    'sp-codec-tokens': codecTokens,
    'sp-vad-cascade': vadCascade,
    'sp-fullduplex': fullDuplex,
    'sp-wer-align': werAlign,
    'sp-voice-factorize': voiceFactorize
  });
})();
