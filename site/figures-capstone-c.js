(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }

  var el = LF.el, svgEl = LF.svgEl;
  var INK = 'var(--ink,#1a1a1a)', SOFT = 'var(--ink-soft,#555)', MUTE = 'var(--ink-mute,#777)';
  var BP = 'var(--blueprint,#3553ff)', BG = 'var(--bg,#fafaf5)', SURF = 'var(--bg-surface,#eee)';
  var RULE = 'var(--rule-soft,#ddd)', WARN = 'var(--warn,#b8870f)';

  function anim(attr, vals, dur, extra) {
    var a = { attributeName: attr, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animate', a);
  }
  function animT(type, vals, dur, extra) {
    var a = { attributeName: 'transform', type: type, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animateTransform', a);
  }
  function card(host, label, hint, svg, caption) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [hint])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out' }, [svg])]),
      el('div', { class: 'lf-cap' }, [caption])
    ]));
  }
  function txt(x, y, s, fill, size, anchor) {
    return svgEl('text', {
      x: x, y: y, fill: fill || SOFT, 'font-size': size || 11,
      'font-family': 'var(--font-mono,monospace)', 'text-anchor': anchor || 'middle'
    }, [svgEl('tspan', {}, [document.createTextNode(s)])]);
  }

  // ── 32：Embedding lookup — 一个 id 选择一行，并与位置 Vector 相加 ────────
  function embeddingLookup(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    var tx = 40, ty = 28, rw = 96, rh = 26, rows = 6;
    svg.appendChild(txt(tx + rw / 2, ty - 8, 'Token 表  (V, D)', MUTE, 10));
    var i;
    for (i = 0; i < rows; i++) {
      var ry = ty + i * rh;
      svg.appendChild(svgEl('rect', { x: tx, y: ry, width: rw, height: rh - 3, rx: 3, fill: i === 3 ? 'none' : BG, stroke: RULE, 'stroke-width': '1' }));
      svg.appendChild(txt(tx - 8, ry + 16, 'id ' + i, MUTE, 8, 'end'));
    }
    // 落在所选行（id 3）上的高亮框
    var sel = svgEl('rect', { x: tx - 2, y: ty - 2, width: rw + 4, height: rh - 1, rx: 4, fill: BP, opacity: '0.14', stroke: BP, 'stroke-width': '2.4' });
    sel.appendChild(anim('y', (ty - 2) + ';' + (ty - 2 + 3 * rh) + ';' + (ty - 2 + 3 * rh), '3s', { keyTimes: '0;0.45;1' }));
    svg.appendChild(sel);
    svg.appendChild(txt(tx + rw / 2, ty + 3 * rh + 16, '第 3 行', BP, 9));
    // 箭头：所选行向右流向稠密 Vector
    var flow = svgEl('path', { d: 'M' + (tx + rw + 4) + ' ' + (ty + 3 * rh + 11) + ' H300', fill: 'none', stroke: BP, 'stroke-width': '2', 'stroke-dasharray': '6 5' });
    flow.appendChild(anim('stroke-dashoffset', '22;0', '1s', { begin: '1.2s' }));
    svg.appendChild(flow);
    // Token Vector（D 个单元格）
    var vx = 308, vy = ty + 3 * rh - 4, cell = 18;
    var tg = svgEl('g', {});
    for (i = 0; i < 5; i++) tg.appendChild(svgEl('rect', { x: vx + i * cell, y: vy, width: cell - 2, height: 22, rx: 2, fill: BP, opacity: (0.3 + i * 0.12).toFixed(2) }));
    tg.appendChild(txt(vx + 5 * cell / 2, vy - 6, 'Token Vector (D)', BP, 9));
    tg.appendChild(anim('opacity', '0;0;1;1', '3s', { keyTimes: '0;0.55;0.75;1', fill: 'freeze' }));
    svg.appendChild(tg);
    // 其下方是位置 Vector，然后是加号与求和结果
    var py = vy + 64;
    var pg = svgEl('g', {});
    for (i = 0; i < 5; i++) pg.appendChild(svgEl('rect', { x: vx + i * cell, y: py, width: cell - 2, height: 22, rx: 2, fill: WARN, opacity: (0.3 + i * 0.12).toFixed(2) }));
    pg.appendChild(txt(vx + 5 * cell / 2, py + 36, '位置 Vector (D)', WARN, 9));
    svg.appendChild(pg);
    svg.appendChild(txt(vx + 5 * cell + 16, (vy + py) / 2 + 16, '+', INK, 18, 'middle'));
    var sumg = svgEl('g', {});
    for (i = 0; i < 5; i++) sumg.appendChild(svgEl('rect', { x: vx + 5 * cell + 30 + i * cell, y: (vy + py) / 2 + 4, width: cell - 2, height: 22, rx: 2, fill: INK, opacity: (0.25 + i * 0.13).toFixed(2) }));
    sumg.appendChild(txt(vx + 5 * cell + 30 + 5 * cell / 2, (vy + py) / 2 - 4, '输入 (B,T,D)', INK, 9));
    sumg.appendChild(anim('opacity', '0;0;1;1', '3s', { keyTimes: '0;0.7;0.9;1', fill: 'freeze' }));
    svg.appendChild(sumg);
    card(host, 'EMBEDDING LOOKUP', '选择行 · 加上位置',
      svg,
      'Token id 不是用于算术运算的数值，而是索引。该 id 从 Token 表中选择一行，返回一个稠密 Vector，Model 将其视为该 id 的含义。位置本身同样没有固有的 Vector，因此需要按位置槽查找一个并行的 positional Embedding，并逐元素求和。得到的结果就是第一个 Attention block 所使用的 (B, T, D) Tensor。');
  }

  // ── 34：Transformer block — 两条 residual 旁路跳过各自的子层 ────────
  function transformerBlock(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' });
    var sx = 200, w = 120;
    function block(y, h, label, sub, fill, stroke) {
      var g = svgEl('g', {});
      g.appendChild(svgEl('rect', { x: sx, y: y, width: w, height: h, rx: 5, fill: fill, stroke: stroke, 'stroke-width': '1.8' }));
      g.appendChild(txt(sx + w / 2, y + (sub ? h / 2 - 2 : h / 2 + 4), label, stroke === BP ? BP : SOFT, 11));
      if (sub) g.appendChild(txt(sx + w / 2, y + h / 2 + 12, sub, MUTE, 8));
      return g;
    }
    svg.appendChild(txt(sx + w / 2, 16, '输入  (B, T, D)', INK, 10));
    var ln1 = block(28, 26, 'LayerNorm 1', '', SURF, MUTE);
    var attn = block(64, 40, 'Attention', 'causal · multi-head', BG, BP);
    var add1 = block(116, 24, '添加 residual', '', BG, MUTE);
    var ln2 = block(150, 24, 'LayerNorm 2', '', SURF, MUTE);
    var mlp = block(182, 38, 'MLP  D→4D→D', '', BG, BP);
    [ln1, attn, add1, ln2, mlp].forEach(function (g) { svg.appendChild(g); });
    // 沿垂直主干向下流动
    var spine = svgEl('line', { x1: sx + w / 2, y1: 28, x2: sx + w / 2, y2: 220, stroke: RULE, 'stroke-width': '2' });
    svg.appendChild(spine);
    // 第一条 residual 旁路：从输入绕过 Attention 进入 add1
    var rp1 = svgEl('path', { d: 'M' + sx + ' 30 C 120 30, 120 128, ' + sx + ' 128', fill: 'none', stroke: BP, 'stroke-width': '2', 'stroke-dasharray': '7 5' });
    rp1.appendChild(anim('stroke-dashoffset', '120;0', '2.2s'));
    svg.appendChild(rp1);
    svg.appendChild(txt(96, 80, 'residual', BP, 9, 'middle'));
    // 第二条 residual 旁路：从 add1 绕过 MLP 进入输出
    var rp2 = svgEl('path', { d: 'M' + sx + ' 132 C 120 132, 120 232, ' + sx + ' 232', fill: 'none', stroke: BP, 'stroke-width': '2', 'stroke-dasharray': '7 5' });
    rp2.appendChild(anim('stroke-dashoffset', '120;0', '2.2s', { begin: '0.5s' }));
    svg.appendChild(rp2);
    // 一个信号 Token 沿主干向下穿过 block
    var dot = svgEl('circle', { r: 5, fill: WARN });
    dot.appendChild(anim('cy', '28;220', '2.6s'));
    dot.setAttribute('cx', sx + w / 2);
    svg.appendChild(dot);
    svg.appendChild(txt(sx + w / 2, 238, '输出  (B, T, D)', INK, 10));
    // 右侧的 pre-LN 注释
    svg.appendChild(txt(420, 60, 'pre-LN：', INK, 10, 'middle'));
    svg.appendChild(txt(420, 76, 'norm 位于', SOFT, 9, 'middle'));
    svg.appendChild(txt(420, 90, '旁路内部，', SOFT, 9, 'middle'));
    svg.appendChild(txt(420, 104, '因此', SOFT, 9, 'middle'));
    svg.appendChild(txt(420, 118, 'residual', SOFT, 9, 'middle'));
    svg.appendChild(txt(420, 132, '路径在深层中', SOFT, 9, 'middle'));
    svg.appendChild(txt(420, 146, '始终保持纯净', BP, 9, 'middle'));
    card(host, 'TRANSFORMER BLOCK', '两条 residual 旁路',
      svg,
      '该 block 恰好包含两个子层和两条 residual 路径。输入发生分叉：一个副本流经 LayerNorm 和 Attention，另一个副本直接跳到加法操作。围绕 MLP 会重复同样的分叉。正是这条纯净的旁路让 Gradient 能够抵达深层堆栈的底部，而将 norm 放在旁路内部（pre-LN），则使堆栈无需借助 warmup 也能完成 Training。');
  }

  // ── 35：GPT 组装 — block 堆栈，head 重新绑定到 Token 表 ──
  function gptAssembly(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' });
    var cx = 200, w = 150;
    svg.appendChild(txt(cx + w / 2, 16, 'Token ids  (B, T)', INK, 10));
    // 合并 Token Embedding 与位置 Embedding
    svg.appendChild(svgEl('rect', { x: cx, y: 24, width: 66, height: 30, rx: 4, fill: BG, stroke: BP, 'stroke-width': '1.8' }));
    svg.appendChild(txt(cx + 33, 43, 'tok emb', BP, 9));
    svg.appendChild(svgEl('rect', { x: cx + 84, y: 24, width: 66, height: 30, rx: 4, fill: BG, stroke: WARN, 'stroke-width': '1.8' }));
    svg.appendChild(txt(cx + 117, 43, 'pos emb', WARN, 9));
    svg.appendChild(txt(cx + 75, 70, '⊕', INK, 14));
    // 将 12 个 block 的堆栈显示为压缩条，并从上到下依次亮起
    var by = 84, bh = 11, n = 12, i;
    for (i = 0; i < n; i++) {
      var yy = by + i * (bh + 1);
      var r = svgEl('rect', { x: cx + 20, y: yy, width: w - 40, height: bh, rx: 2, fill: BP, opacity: '0.16', stroke: BP, 'stroke-width': '0.8' });
      r.appendChild(anim('opacity', '0.16;0.9;0.16', '3.2s', { begin: (i * 0.14) + 's' }));
      svg.appendChild(r);
    }
    svg.appendChild(txt(cx - 6, by + 6 * (bh + 1), '12 个 block', MUTE, 9, 'end'));
    var ly = by + n * (bh + 1) + 6;
    svg.appendChild(svgEl('rect', { x: cx + 20, y: ly, width: w - 40, height: 22, rx: 3, fill: SURF, stroke: MUTE, 'stroke-width': '1.4' }));
    svg.appendChild(txt(cx + w / 2, ly + 15, '最终 LayerNorm', SOFT, 9));
    // LM head
    var hy = ly + 32;
    svg.appendChild(svgEl('rect', { x: cx + 20, y: hy, width: w - 40, height: 26, rx: 4, fill: BG, stroke: BP, 'stroke-width': '1.8' }));
    svg.appendChild(txt(cx + w / 2, hy + 17, 'LM head → logits', BP, 9));
    // weight tying 弧线：head 复用 Token 表
    var tie = svgEl('path', { d: 'M' + (cx + 20) + ' ' + (hy + 13) + ' C 90 ' + (hy + 13) + ', 90 39, ' + cx + ' 39', fill: 'none', stroke: BP, 'stroke-width': '1.8', 'stroke-dasharray': '6 5' });
    tie.appendChild(anim('stroke-dashoffset', '200;0', '2.6s'));
    svg.appendChild(tie);
    svg.appendChild(txt(78, (hy + 39) / 2 + 20, '权重', BP, 9, 'middle'));
    svg.appendChild(txt(78, (hy + 39) / 2 + 32, '绑定', BP, 9, 'middle'));
    // 右侧的参数统计
    svg.appendChild(txt(440, 70, '总计 124M', INK, 11, 'middle'));
    svg.appendChild(txt(440, 88, '50257 × 768', SOFT, 9, 'middle'));
    svg.appendChild(txt(440, 102, '+ 1024 × 768', SOFT, 9, 'middle'));
    svg.appendChild(txt(440, 116, '+ 12 个 block', SOFT, 9, 'middle'));
    svg.appendChild(txt(440, 132, 'head 无额外权重', BP, 9, 'middle'));
    svg.appendChild(txt(440, 146, '（已绑定）', BP, 9, 'middle'));
    card(host, 'GPT 组装', 'Embedding · 堆叠 · 绑定',
      svg,
      '整个 124M Model 由以下部分组成：一个 Token 表、一个与其相加的位置表、依次亮起的十二个相同 block、一个最终 LayerNorm，以及一个 language-model head。head 不包含新权重，而是复用转置后的 Token Embedding Matrix，因此在这一规模下，weight tying 可节省约 38M 个参数，并使参数总数与参考实现完全一致。');
  }

  // ── 37：权重重映射 — 将 pretrained 名称重新连接到本地名称 ────────
  function weightRemap(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    var lx = 30, rx = 330, w = 168, rh = 34, gap = 10, y0 = 40;
    var src = ['wte', 'h.0.attn.c_attn', 'h.0.mlp.c_fc'];
    var dst = ['tok_embed', 'blocks.0.attn.qkv', 'blocks.0.mlp.fc1'];
    svg.appendChild(txt(lx + w / 2, 24, 'pretrained 名称', MUTE, 10));
    svg.appendChild(txt(rx + w / 2, 24, '本地 Model', BP, 10));
    var i;
    for (i = 0; i < src.length; i++) {
      var y = y0 + i * (rh + gap);
      svg.appendChild(svgEl('rect', { x: lx, y: y, width: w, height: rh, rx: 4, fill: BG, stroke: RULE, 'stroke-width': '1.4' }));
      svg.appendChild(txt(lx + w / 2, y + 21, src[i], SOFT, 10));
      svg.appendChild(svgEl('rect', { x: rx, y: y, width: w, height: rh, rx: 4, fill: BP, opacity: '0.1', stroke: BP, 'stroke-width': '1.6' }));
      svg.appendChild(txt(rx + w / 2, y + 21, dst[i], BP, 10));
      // 一个 Tensor 数据包沿映射器连线移动，只有通过 shape 检查后才会落位
      var midY = y + rh / 2;
      var wire = svgEl('path', { d: 'M' + (lx + w) + ' ' + midY + ' H' + (lx + w + 60) + ' L' + (rx - 60) + ' ' + midY + ' H' + rx, fill: 'none', stroke: RULE, 'stroke-width': '1.2', 'stroke-dasharray': '4 4' });
      svg.appendChild(wire);
      var pkt = svgEl('rect', { x: lx + w, y: midY - 6, width: 14, height: 12, rx: 2, fill: i === 2 ? WARN : BP });
      pkt.appendChild(anim('x', (lx + w) + ';' + (rx - 14) + ';' + (rx - 14), '3s', { begin: (i * 0.5) + 's', keyTimes: '0;0.7;1' }));
      if (i === 2) pkt.appendChild(anim('opacity', '1;1;0.15', '3s', { begin: '1s', keyTimes: '0;0.7;1' }));
      svg.appendChild(pkt);
    }
    // 中间的 shape 检查闸门
    svg.appendChild(svgEl('rect', { x: 248, y: y0, width: 24, height: 3 * (rh + gap) - gap, rx: 4, fill: SURF, stroke: MUTE, 'stroke-width': '1.4' }));
    svg.appendChild(txt(260, y0 - 6, 'shape', MUTE, 8));
    svg.appendChild(txt(260, y0 + (3 * (rh + gap) - gap) / 2, '检查', MUTE, 8, 'middle'));
    svg.appendChild(txt(rx + w / 2 + 16, y0 + 2 * (rh + gap) + 21, '✗ 已记录不匹配', WARN, 8, 'start'));
    card(host, '权重重映射', '重命名 · shape 检查 · 赋值',
      svg,
      '发布的 Checkpoint 携带的是原始实现的参数名称，而不是你的参数名称。加载器是一个 string-to-string 映射器，随后执行一次统一的 shape 检查：匹配的 Tensor 会在 no_grad 下复制到对应的本地名称，不匹配的 Tensor 则会被记录并拒绝，而不是盲目复制。每次赋值都会留下记录，因此错误加载会出现在报告中，而不会等到生成时才以无意义的输出悄然暴露。');
  }

  // ── 39：SFT Loss masking — instruction Token 设为 -100，仅对 response 评分 ─
  function sftMasking(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 220' });
    var toks = ['<INST>', 'capital', 'of', 'France', '<RESP>', 'Paris', 'is', 'it'];
    var mask = [0, 0, 0, 0, 0, 1, 1, 1]; // 1 = response，参与评分
    var bw = 56, gap = 4, x0 = 24, y = 56;
    svg.appendChild(txt(x0, 38, '一个 causal 序列', MUTE, 10, 'start'));
    var i;
    for (i = 0; i < toks.length; i++) {
      var x = x0 + i * (bw + gap);
      var scored = mask[i] === 1;
      svg.appendChild(svgEl('rect', { x: x, y: y, width: bw, height: 30, rx: 3, fill: scored ? BG : SURF, stroke: scored ? BP : MUTE, 'stroke-width': scored ? '1.8' : '1.2' }));
      svg.appendChild(txt(x + bw / 2, y + 20, toks[i], scored ? BP : MUTE, 9));
      // 每个 Token 下方的 Loss 标签
      var ly = y + 56;
      if (scored) {
        svg.appendChild(txt(x + bw / 2, ly, 'CE', BP, 9));
      } else {
        svg.appendChild(txt(x + bw / 2, ly, '-100', MUTE, 9));
      }
    }
    // 标记已 mask 的 instruction 区域的括号
    var instW = 5 * (bw + gap) - gap;
    svg.appendChild(svgEl('path', { d: 'M' + x0 + ' ' + (y - 8) + ' V' + (y - 14) + ' H' + (x0 + instW) + ' V' + (y - 8), fill: 'none', stroke: MUTE, 'stroke-width': '1.4' }));
    svg.appendChild(txt(x0 + instW / 2, y - 20, 'instruction · 已 mask，Gradient 为零', MUTE, 9));
    var respX = x0 + 5 * (bw + gap);
    var respW = 3 * (bw + gap) - gap;
    svg.appendChild(svgEl('path', { d: 'M' + respX + ' ' + (y - 8) + ' V' + (y - 14) + ' H' + (respX + respW) + ' V' + (y - 8), fill: 'none', stroke: BP, 'stroke-width': '1.6' }));
    svg.appendChild(txt(respX + respW / 2, y - 20, 'response · 参与评分', BP, 9));
    // Gradient 仅流入 response 区域
    var gy = y + 78;
    var grad = svgEl('path', { d: 'M' + (respX + respW / 2) + ' ' + gy + ' V' + (gy + 24), fill: 'none', stroke: BP, 'stroke-width': '2', 'stroke-dasharray': '5 4' });
    grad.appendChild(anim('stroke-dashoffset', '0;18', '1s'));
    svg.appendChild(grad);
    svg.appendChild(svgEl('polygon', { points: (respX + respW / 2 - 4) + ',' + (gy + 24) + ' ' + (respX + respW / 2 + 4) + ',' + (gy + 24) + ' ' + (respX + respW / 2) + ',' + (gy + 32), fill: BP }));
    svg.appendChild(txt(respX + respW / 2, gy + 46, '更新', BP, 9));
    card(host, 'SFT LOSS MASK', 'instruction 关闭 · response 评分',
      svg,
      'Instruction tuning 使用边界 Token 将每个样本打包为一个序列，但 instruction 是给定内容，并非学习目标。collate 函数将这些位置设为 ignore_index -100，使 cross-entropy 完全跳过它们。只有 response 边界之后的 Token 才会贡献 Loss，因此 Gradient 教会 Model 生成答案，而不是记住 Prompt。');
  }

  // ── 43：HDF5 buffer-then-extend — buffer 填满、Dataset 扩容、写入范围 ─
  function hdf5Buffer(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    // 左侧传入的 Token 流
    svg.appendChild(txt(60, 36, '已 Tokenize 的文档', MUTE, 10));
    var fy = 50;
    var b;
    for (b = 0; b < 4; b++) {
      var dot = svgEl('circle', { r: 4, fill: BP });
      dot.appendChild(svgEl('animateMotion', { dur: '2.4s', repeatCount: 'indefinite', path: 'M30 ' + (fy + 14) + ' H150', begin: (b * 0.6) + 's' }));
      svg.appendChild(dot);
    }
    // 填充到 chunk 大小的内存 buffer
    var bx = 156, by = 50, bw = 110, bh = 28;
    svg.appendChild(svgEl('rect', { x: bx, y: by, width: bw, height: bh, rx: 3, fill: 'none', stroke: MUTE, 'stroke-width': '1.6' }));
    svg.appendChild(txt(bx + bw / 2, by - 8, 'buffer（= chunk）', MUTE, 9));
    var fill = svgEl('rect', { x: bx + 1, y: by + 1, width: 0, height: bh - 2, rx: 2, fill: BP, opacity: '0.45' });
    fill.appendChild(anim('width', '0;' + (bw - 2) + ';' + (bw - 2) + ';0;0', '3.2s', { keyTimes: '0;0.5;0.6;0.62;1' }));
    svg.appendChild(fill);
    // 填满时出现 flush 箭头
    var flush = svgEl('path', { d: 'M' + (bx + bw) + ' ' + (by + bh / 2) + ' H' + (bx + bw + 40), fill: 'none', stroke: BP, 'stroke-width': '2', 'stroke-dasharray': '6 4' });
    flush.appendChild(anim('stroke-dashoffset', '20;0', '0.8s', { begin: '1.6s' }));
    flush.appendChild(anim('opacity', '0;0;1;1;0', '3.2s', { keyTimes: '0;0.48;0.52;0.9;1' }));
    svg.appendChild(flush);
    svg.appendChild(txt(bx + bw + 20, by - 8, 'flush', BP, 8));
    // 每次 flush 时按一个 chunk 扩容的 HDF5 Dataset
    var hx = 320, hy = 46, ch = 36, chunks = 4, cyc;
    svg.appendChild(txt(hx + (chunks * (ch + 4)) / 2, hy - 12, '可扩容的 HDF5 Dataset', SOFT, 9));
    for (cyc = 0; cyc < chunks; cyc++) {
      var cxp = hx + cyc * (ch + 4);
      var c = svgEl('rect', { x: cxp, y: hy, width: ch, height: 40, rx: 3, fill: BP, opacity: '0.12', stroke: BP, 'stroke-width': '1.4' });
      if (cyc === chunks - 1) {
        c.setAttribute('stroke-dasharray', '4 3');
        c.appendChild(anim('opacity', '0;0.12;0.5;0.5', '3.2s', { keyTimes: '0;0.55;0.7;1', fill: 'freeze' }));
      }
      svg.appendChild(c);
    }
    svg.appendChild(txt(hx + (chunks - 1) * (ch + 4) + ch / 2, hy + 58, '新范围', BP, 8));
    // Training 时的 mmap 读取标记
    svg.appendChild(svgEl('rect', { x: hx, y: 150, width: chunks * (ch + 4) - 4, height: 26, rx: 3, fill: SURF, stroke: MUTE, 'stroke-width': '1.4' }));
    svg.appendChild(txt(hx + (chunks * (ch + 4)) / 2 - 2, 167, 'mmap slice → Batch buffer', SOFT, 9));
    var rd = svgEl('rect', { x: hx, y: 151, width: 30, height: 24, rx: 2, fill: WARN, opacity: '0.4' });
    rd.appendChild(anim('x', hx + ';' + (hx + chunks * (ch + 4) - 34) + ';' + hx, '4s'));
    svg.appendChild(rd);
    card(host, 'HDF5 CORPUS', 'buffer · 扩容 · mmap 读取',
      svg,
      '逐个写入文档会使文件产生碎片；一次性写入全部内容则会在崩溃时丢失整个 shard。可靠的方法是 buffer-then-extend：累积 Token，直到 buffer 达到 chunk 大小；将 Dataset 精确扩容一个 chunk；然后写入新范围。在 Training 时，memory-mapped slice 会直接将 hyperslab 从 page cache 复制到 Batch buffer。');
  }

  // ── 46：Gradient accumulation — micro-batch 累积 Gradient，最后一次才 step ──
  function gradAccum(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    var n = 4, bw = 70, gap = 22, x0 = 36, y = 40;
    svg.appendChild(txt(260, 22, '一个 effective Batch = 4 个 micro-batch', MUTE, 10));
    // 一个跨 micro-batch 逐步填满的 Gradient buffer 条
    var gy = 150, gx = x0, gw = n * (bw + gap) - gap;
    svg.appendChild(svgEl('rect', { x: gx, y: gy, width: gw, height: 24, rx: 3, fill: 'none', stroke: MUTE, 'stroke-width': '1.6' }));
    svg.appendChild(txt(gx, gy - 8, '累积 Gradient buffer', MUTE, 9, 'start'));
    var fill = svgEl('rect', { x: gx + 1, y: gy + 1, width: 0, height: 22, rx: 2, fill: BP, opacity: '0.4' });
    fill.appendChild(anim('width', '0;' + (gw / 4) + ';' + (gw / 2) + ';' + (3 * gw / 4) + ';' + (gw - 2) + ';0;0', '4s', { keyTimes: '0;0.2;0.4;0.6;0.85;0.9;1' }));
    svg.appendChild(fill);
    var i;
    for (i = 0; i < n; i++) {
      var x = x0 + i * (bw + gap);
      var last = i === n - 1;
      var g = svgEl('g', {});
      g.appendChild(svgEl('rect', { x: x, y: y, width: bw, height: 40, rx: 4, fill: BG, stroke: BP, 'stroke-width': '1.6' }));
      g.appendChild(txt(x + bw / 2, y + 18, 'micro ' + (i + 1), BP, 9));
      g.appendChild(txt(x + bw / 2, y + 32, 'Loss / 4', SOFT, 8));
      g.appendChild(anim('opacity', '0.35;1;0.35', '4s', { begin: (i * 0.5) + 's', keyTimes: '0;0.5;1' }));
      svg.appendChild(g);
      // scaled-backward 箭头向下进入 buffer
      var arr = svgEl('line', { x1: x + bw / 2, y1: y + 40, x2: x + bw / 2, y2: gy, stroke: last ? WARN : BP, 'stroke-width': '1.6', 'stroke-dasharray': '5 4' });
      arr.appendChild(anim('stroke-dashoffset', '0;18', '0.9s', { begin: (i * 0.5) + 's' }));
      svg.appendChild(arr);
      if (last) svg.appendChild(txt(x + bw / 2, y + 54, '同步', WARN, 8));
    }
    // buffer 填满后，Optimizer step 仅执行一次
    var sx = gx + gw + 18;
    var stepg = svgEl('g', {});
    stepg.appendChild(svgEl('rect', { x: sx, y: gy - 4, width: 86, height: 32, rx: 5, fill: WARN, opacity: '0.16', stroke: WARN, 'stroke-width': '2' }));
    stepg.appendChild(txt(sx + 43, gy + 16, 'Optimizer step', WARN, 9));
    stepg.appendChild(anim('opacity', '0.15;0.15;1;0.15', '4s', { keyTimes: '0;0.82;0.88;1' }));
    svg.appendChild(stepg);
    svg.appendChild(txt(sx + 43, gy + 44, '每个 effective', MUTE, 8));
    svg.appendChild(txt(sx + 43, gy + 56, 'Batch 执行一次', MUTE, 8));
    card(host, 'GRADIENT ACCUMULATION', '累积 Gradient · 最后一次 step',
      svg,
      '当 accelerator 只能容纳 32 个样本，而 Loss 曲线需要 512 个样本时，就逐个 micro-batch 运行 backward pass，让 Gradient 在参数 buffer 中累加。每个 Loss 都除以累积次数，使累加结果与一次完整 Batch 的 backward 相同；只有在 buffer 填满时，Optimizer 才会执行一次 step，并将同步推迟到最后一个 micro-batch。');
  }

  // ── 47：原子 Checkpoint — 写入临时文件、fsync、重命名覆盖完好文件 ────
  function atomicCheckpoint(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    // 左侧的 payload 分桶汇集到一个文件中
    var px = 30, py = 36, bw = 116, bh = 18, gap = 5;
    var parts = ['Model', 'Optimizer', 'scheduler', 'step + Loss', 'RNG 状态'];
    svg.appendChild(txt(px + bw / 2, py - 10, 'Checkpoint payload', MUTE, 9));
    var i;
    for (i = 0; i < parts.length; i++) {
      var yy = py + i * (bh + gap);
      var r = svgEl('rect', { x: px, y: yy, width: bw, height: bh, rx: 2, fill: BP, opacity: '0.12', stroke: BP, 'stroke-width': '1' });
      r.appendChild(anim('opacity', '0.12;0.6;0.12', '3.5s', { begin: (i * 0.2) + 's' }));
      svg.appendChild(r);
      svg.appendChild(txt(px + bw / 2, yy + 13, parts[i], SOFT, 8));
    }
    // 流入临时文件
    var tx = 220, ty = 70;
    var flow = svgEl('path', { d: 'M' + (px + bw) + ' ' + (py + 50) + ' H' + tx, fill: 'none', stroke: BP, 'stroke-width': '2', 'stroke-dasharray': '6 5' });
    flow.appendChild(anim('stroke-dashoffset', '22;0', '1s'));
    svg.appendChild(flow);
    svg.appendChild(svgEl('rect', { x: tx, y: ty, width: 96, height: 46, rx: 5, fill: 'none', stroke: MUTE, 'stroke-width': '1.6', 'stroke-dasharray': '4 4' }));
    svg.appendChild(txt(tx + 48, ty + 20, 'ckpt.tmp', MUTE, 10));
    svg.appendChild(txt(tx + 48, ty + 36, '写入 + fsync', MUTE, 8));
    // 原子重命名弧线指向最终文件名
    var fx = 400, fy = 70;
    var ren = svgEl('path', { d: 'M' + (tx + 96) + ' ' + (ty + 23) + ' C ' + (fx - 20) + ' ' + (ty + 23) + ', ' + (fx - 20) + ' ' + (fy + 23) + ', ' + fx + ' ' + (fy + 23), fill: 'none', stroke: BP, 'stroke-width': '2', 'stroke-dasharray': '7 5' });
    ren.appendChild(anim('stroke-dashoffset', '40;0', '1.4s', { begin: '1s' }));
    svg.appendChild(ren);
    svg.appendChild(txt((tx + fx) / 2 + 48, ty + 6, 'os.replace', BP, 9, 'middle'));
    svg.appendChild(txt((tx + fx) / 2 + 48, ty - 8, '原子操作', BP, 8, 'middle'));
    var fin = svgEl('g', {});
    fin.appendChild(svgEl('rect', { x: fx, y: fy, width: 96, height: 46, rx: 5, fill: BP, opacity: '0.14', stroke: BP, 'stroke-width': '2.2' }));
    fin.appendChild(txt(fx + 48, fy + 20, 'ckpt.pt', BP, 10));
    fin.appendChild(txt(fx + 48, fy + 36, '始终有效', SOFT, 8));
    fin.appendChild(anim('opacity', '0.2;0.2;1;1', '2.4s', { keyTimes: '0;0.55;0.75;1', fill: 'freeze' }));
    svg.appendChild(fin);
    // 崩溃闪电击中临时文件，但永远不会击中最终文件
    var bolt = svgEl('g', {});
    bolt.appendChild(svgEl('polygon', { points: (tx + 48) + ',150 ' + (tx + 40) + ',172 ' + (tx + 52) + ',172 ' + (tx + 44) + ',192', fill: 'none', stroke: WARN, 'stroke-width': '2' }));
    bolt.appendChild(txt(tx + 48, 206, '此处崩溃？', WARN, 8));
    bolt.appendChild(txt(tx + 48, 218, '旧文件仍安全', WARN, 8));
    bolt.appendChild(anim('opacity', '0;1;0', '2.4s'));
    svg.appendChild(bolt);
    card(host, '原子 CHECKPOINT', '写入临时文件 · 重命名覆盖',
      svg,
      '恢复 Training 需要完整的 Training 状态，包括 Model、Optimizer、scheduler、step 计数器，以及每个随机性来源的 RNG 状态，否则恢复后的 Loss 曲线将偏离未中断运行的曲线。保存时先写入临时文件，执行 fsync，然后重命名覆盖最终文件名。由于 POSIX rename 是原子操作，写入过程中发生崩溃时，之前完好的 Checkpoint 会保持不变，而不会留下一个只写入一半的损坏文件。');
  }

  LF.register({
    'cc-embedding-lookup': embeddingLookup,
    'cc-transformer-block': transformerBlock,
    'cc-gpt-assembly': gptAssembly,
    'cc-weight-remap': weightRemap,
    'cc-sft-loss-mask': sftMasking,
    'cc-hdf5-corpus': hdf5Buffer,
    'cc-grad-accumulation': gradAccum,
    'cc-atomic-checkpoint': atomicCheckpoint
  });
})();
