/* figures-agent-skills.js: staged SVG explanations for the Agent Skills track.
   Loads after lesson-figures.js and registers through window.LF. */
(function () {
  'use strict';

  var LF = window.LF;
  if (!LF) return;

  var el = LF.el;
  var svgEl = LF.svgEl;
  var figureCounter = 0;

  function ensureStyles() {
    if (document.getElementById('agent-skill-figure-styles')) return;
    var style = document.createElement('style');
    style.id = 'agent-skill-figure-styles';
    style.textContent = [
      '.asf-shell{border:1px solid var(--rule-soft,#ddd);background:var(--bg,#fafaf5);margin:28px 0;font-family:var(--font-body,serif)}',
      '.asf-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:12px 16px;border-bottom:1px solid var(--rule-soft,#ddd);font-family:var(--font-mono,monospace);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-mute,#777)}',
      '.asf-head strong{color:var(--blueprint,#3553ff);font-weight:600}',
      '.asf-body{padding:16px}',
      '.asf-controls{display:grid;grid-template-columns:auto auto auto minmax(150px,1fr);align-items:center;gap:8px;margin-bottom:14px}',
      '.asf-button{min-height:44px;padding:7px 11px;border:1px solid var(--rule-soft,#ddd);background:var(--bg,#fafaf5);color:var(--ink,#111);font-family:var(--font-mono,monospace);font-size:.68rem;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:transform var(--motion-press,160ms) var(--ease-out,cubic-bezier(.23,1,.32,1)),border-color var(--motion-feedback,180ms) ease,color var(--motion-feedback,180ms) ease,background-color var(--motion-feedback,180ms) ease}',
      '.asf-button:hover,.asf-button:focus-visible{border-color:var(--blueprint,#3553ff);color:var(--blueprint,#3553ff)}',
      '.asf-button:active:not(:disabled){transform:scale(.97)}',
      '.asf-button:disabled{cursor:default;opacity:.42}',
      '.asf-range-wrap{display:grid;grid-template-columns:minmax(100px,1fr) auto;align-items:center;gap:10px}',
      '.asf-range{width:100%;accent-color:var(--blueprint,#3553ff)}',
      '.asf-count{font-family:var(--font-mono,monospace);font-size:.68rem;white-space:nowrap;color:var(--ink-mute,#777)}',
      '.asf-canvas{overflow-x:auto;overscroll-behavior-inline:contain;border:1px solid var(--rule-soft,#ddd);background:var(--bg-surface,#f3f1e8)}',
      '.asf-svg{display:block;width:100%;min-width:0;height:auto;color:var(--blueprint,#3553ff)}',
      '.asf-zone rect{fill:var(--blueprint-tint,rgba(53,83,255,.08));stroke:var(--rule-soft,#ddd);stroke-width:1;stroke-dasharray:5 5}',
      '.asf-zone text{fill:var(--ink-mute,#777);font-family:var(--font-mono,monospace);font-size:12px;letter-spacing:.1em;text-transform:uppercase}',
      '.asf-edge{opacity:.12;transform:translateY(5px);transform-box:fill-box;transform-origin:center;transition:opacity 280ms var(--ease-out,cubic-bezier(.23,1,.32,1)),transform 280ms var(--ease-out,cubic-bezier(.23,1,.32,1))}',
      '.asf-edge.is-visible{opacity:.82;transform:none}',
      '.asf-edge path{fill:none;stroke:var(--blueprint,#3553ff);stroke-width:2}',
      '.asf-edge.is-warning path{stroke:var(--warn,#b8870f)}',
      '.asf-edge-label{fill:var(--ink-mute,#777);font-family:var(--font-mono,monospace);font-size:11px;text-anchor:middle;paint-order:stroke;stroke:var(--bg-surface,#f3f1e8);stroke-width:5;stroke-linejoin:round}',
      '.asf-node{opacity:.2;transform:translateY(8px);transform-box:fill-box;transform-origin:center;transition:opacity 280ms var(--ease-out,cubic-bezier(.23,1,.32,1)),transform 280ms var(--ease-out,cubic-bezier(.23,1,.32,1))}',
      '.asf-node.is-visible{opacity:.68;transform:none}',
      '.asf-node.is-current{opacity:1;transform:translateY(-5px)}',
      '.asf-node rect{fill:var(--bg,#fafaf5);stroke:var(--rule-soft,#ddd);stroke-width:1.5}',
      '.asf-node.is-visible rect{stroke:var(--blueprint,#3553ff)}',
      '.asf-node.is-current rect{fill:var(--blueprint,#3553ff);stroke:var(--blueprint,#3553ff)}',
      '.asf-node.is-warning rect{stroke:var(--warn,#b8870f)}',
      '.asf-node.is-current.is-warning rect{fill:var(--warn,#b8870f);stroke:var(--warn,#b8870f)}',
      '.asf-node.is-decision rect{stroke-dasharray:5 4}',
      '.asf-title{fill:var(--ink,#111);font-family:var(--font-mono,monospace);font-size:14px;font-weight:600}',
      '.asf-detail{fill:var(--ink-mute,#777);font-family:var(--font-mono,monospace);font-size:11px}',
      '.asf-node.is-compact .asf-title{font-size:11.5px}',
      '.asf-node.is-compact .asf-detail{font-size:9.5px}',
      '.asf-node.is-current .asf-title,.asf-node.is-current .asf-detail{fill:var(--bg,#fafaf5)}',
      '.asf-step-note{min-height:70px;margin-top:12px;padding:12px 14px;border-left:3px solid var(--blueprint,#3553ff);background:var(--blueprint-tint,rgba(53,83,255,.08))}',
      '.asf-step-note strong{display:block;margin-bottom:4px;font-family:var(--font-mono,monospace);font-size:.74rem;letter-spacing:.05em;text-transform:uppercase;color:var(--blueprint,#3553ff)}',
      '.asf-step-note span{display:block;font-size:.92rem;line-height:1.5;color:var(--ink-soft,#555)}',
      '.asf-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}',
      '.asf-caption{padding:12px 16px;border-top:1px solid var(--rule-soft,#ddd);font-size:.92rem;line-height:1.55;color:var(--ink-soft,#555)}',
      '@media(max-width:640px){.asf-body{padding:12px}.asf-controls{grid-template-columns:repeat(3,minmax(0,1fr))}.asf-range-wrap{grid-column:1/-1}.asf-button{padding-inline:6px}.asf-svg{min-width:660px}.asf-step-note{min-height:0}}',
      '@media(prefers-reduced-motion:reduce){.asf-edge,.asf-node{transition:none!important}.asf-button{transition:border-color var(--motion-feedback,180ms) ease,color var(--motion-feedback,180ms) ease,background-color var(--motion-feedback,180ms) ease}.asf-button:active:not(:disabled){transform:none}}',
      '@media print{.asf-controls{display:none!important}.asf-canvas{overflow:visible}.asf-svg{min-width:0}.asf-edge,.asf-node{opacity:1!important;transform:none!important;transition:none!important}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function N(id, x, y, title, detail, stage, kind, width, height) {
    return {
      id: id,
      x: x,
      y: y,
      title: title,
      detail: detail || '',
      stage: stage || 0,
      kind: kind || '',
      width: width || 150,
      height: height || 62
    };
  }

  function E(from, to, stage, label, tone, points) {
    return {
      from: from,
      to: to,
      stage: stage || 0,
      label: label || '',
      tone: tone || '',
      points: points || null
    };
  }

  function Z(x, y, width, height, label) {
    return { x: x, y: y, width: width, height: height, label: label };
  }

  function S(label, detail, focus) {
    return { label: label, detail: detail, focus: focus || [] };
  }

  function lines(value) {
    if (Array.isArray(value)) return value;
    return String(value || '').split('|');
  }

  function splitLongToken(token, maxChars) {
    var chunks = [];
    var rest = token;
    while (rest.length > maxChars) {
      var minimum = Math.max(2, Math.floor(maxChars * 0.45));
      var cut = -1;
      for (var index = maxChars; index >= minimum; index -= 1) {
        if (/[-_/.+]/.test(rest.charAt(index - 1))) {
          cut = index;
          break;
        }
      }
      if (cut < 0) cut = maxChars;
      chunks.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    if (rest) chunks.push(rest);
    return chunks;
  }

  function wrapLine(value, maxChars) {
    var words = String(value || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [''];
    var wrapped = [];
    var current = '';
    words.forEach(function (word) {
      splitLongToken(word, maxChars).forEach(function (chunk) {
        var candidate = current ? current + ' ' + chunk : chunk;
        if (candidate.length <= maxChars) {
          current = candidate;
          return;
        }
        if (current) wrapped.push(current);
        current = chunk;
      });
    });
    if (current) wrapped.push(current);
    return wrapped;
  }

  function wrappedLines(value, maxChars) {
    return lines(value).reduce(function (result, line) {
      return result.concat(wrapLine(line, maxChars));
    }, []);
  }

  function nodeTextLayout(node) {
    var available = Math.max(28, node.width - 24);
    var rawTitle = lines(node.title);
    var rawDetail = node.detail ? lines(node.detail) : [];
    var compact = rawTitle.some(function (line) { return line.length * 8.4 > available; }) ||
      rawDetail.some(function (line) { return line.length * 6.6 > available; });
    if (!compact) {
      return {
        compact: false,
        title: rawTitle,
        detail: rawDetail,
        titleY: node.y + 23,
        detailY: node.y + 27 + rawTitle.length * 17,
        titleStep: 17,
        detailStep: 14
      };
    }

    var title = wrappedLines(node.title, Math.max(5, Math.floor(available / 6.9)));
    var detail = node.detail ? wrappedLines(node.detail, Math.max(6, Math.floor(available / 5.7))) : [];
    var titleStep = 13;
    var detailStep = 11;
    var titleHeight = 15 + Math.max(0, title.length - 1) * titleStep;
    var detailHeight = detail.length ? 12 + Math.max(0, detail.length - 1) * detailStep : 0;
    var totalHeight = titleHeight + (detail.length ? 1 + detailHeight : 0);
    var top = node.y + Math.max(2, (node.height - totalHeight) / 2);
    var titleY = top + 12;
    return {
      compact: true,
      title: title,
      detail: detail,
      titleY: titleY,
      detailY: titleY + Math.max(0, title.length - 1) * titleStep + 14,
      titleStep: titleStep,
      detailStep: detailStep
    };
  }

  function nodeCenter(node) {
    return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
  }

  function edgePath(edge, nodes) {
    if (edge.points && edge.points.length) {
      return edge.points.map(function (point, index) {
        return (index ? 'L' : 'M') + point[0] + ' ' + point[1];
      }).join(' ');
    }
    var from = nodes[edge.from];
    var to = nodes[edge.to];
    var a = nodeCenter(from);
    var b = nodeCenter(to);
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var x1 = a.x;
    var y1 = a.y;
    var x2 = b.x;
    var y2 = b.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      x1 = dx >= 0 ? from.x + from.width : from.x;
      x2 = dx >= 0 ? to.x : to.x + to.width;
    } else {
      y1 = dy >= 0 ? from.y + from.height : from.y;
      y2 = dy >= 0 ? to.y : to.y + to.height;
    }
    var mx = (x1 + x2) / 2;
    var my = (y1 + y2) / 2;
    if (Math.abs(dx) >= Math.abs(dy)) return 'M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2;
    return 'M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + my + ' ' + x2 + ' ' + my + ' ' + x2 + ' ' + y2;
  }

  function textBlock(node, className, value, startY, lineHeight) {
    var text = svgEl('text', { x: node.x + 12, y: startY, class: className });
    lines(value).forEach(function (line, index) {
      text.appendChild(svgEl('tspan', {
        x: node.x + 12,
        dy: index === 0 ? '0' : String(lineHeight)
      }, [document.createTextNode(line)]));
    });
    return text;
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function makeFigure(config) {
    return function (host) {
      ensureStyles();
      figureCounter += 1;
      var uid = 'asf-' + figureCounter;
      var maxStep = config.steps.length - 1;
      var state = { step: 0 };
      var timer = 0;
      var announcementTimer = 0;
      var titleId = uid + '-title';
      var descId = uid + '-desc';
      var noteDetailId = uid + '-note-detail';
      var nodeMap = {};
      var nodeViews = [];
      var edgeViews = [];

      config.nodes.forEach(function (node) { nodeMap[node.id] = node; });

      var svg = svgEl('svg', {
        class: 'asf-svg',
        viewBox: config.viewBox || '0 0 760 480',
        role: 'img',
        'aria-labelledby': titleId + ' ' + descId,
        focusable: 'false'
      });
      svg.appendChild(svgEl('title', { id: titleId }, [document.createTextNode(config.title)]));
      svg.appendChild(svgEl('desc', { id: descId }, [document.createTextNode(config.description)]));

      var defs = svgEl('defs');
      var marker = svgEl('marker', {
        id: uid + '-arrow', markerWidth: '8', markerHeight: '8', refX: '7', refY: '4', orient: 'auto', markerUnits: 'strokeWidth'
      }, [svgEl('path', { d: 'M0 0 L8 4 L0 8 Z', fill: 'var(--blueprint,#3553ff)' })]);
      var warnMarker = svgEl('marker', {
        id: uid + '-warn-arrow', markerWidth: '8', markerHeight: '8', refX: '7', refY: '4', orient: 'auto', markerUnits: 'strokeWidth'
      }, [svgEl('path', { d: 'M0 0 L8 4 L0 8 Z', fill: 'var(--warn,#b8870f)' })]);
      defs.appendChild(marker);
      defs.appendChild(warnMarker);
      svg.appendChild(defs);

      (config.zones || []).forEach(function (zone) {
        svg.appendChild(svgEl('g', { class: 'asf-zone' }, [
          svgEl('rect', { x: zone.x, y: zone.y, width: zone.width, height: zone.height }),
          svgEl('text', { x: zone.x + 10, y: zone.y + 18 }, [document.createTextNode(zone.label)])
        ]));
      });

      config.edges.forEach(function (edge) {
        var group = svgEl('g', { class: 'asf-edge' + (edge.tone === 'warning' ? ' is-warning' : '') });
        var path = svgEl('path', {
          d: edgePath(edge, nodeMap),
          'marker-end': 'url(#' + (edge.tone === 'warning' ? uid + '-warn-arrow' : uid + '-arrow') + ')'
        });
        group.appendChild(path);
        if (edge.label) {
          var fromCenter = nodeCenter(nodeMap[edge.from]);
          var toCenter = nodeCenter(nodeMap[edge.to]);
          var labelX = edge.points && edge.points.length ? edge.points[Math.floor(edge.points.length / 2)][0] : (fromCenter.x + toCenter.x) / 2;
          var labelY = edge.points && edge.points.length ? edge.points[Math.floor(edge.points.length / 2)][1] - 7 : (fromCenter.y + toCenter.y) / 2 - 7;
          group.appendChild(svgEl('text', { x: labelX, y: labelY, class: 'asf-edge-label' }, [document.createTextNode(edge.label)]));
        }
        svg.appendChild(group);
        edgeViews.push({ config: edge, element: group });
      });

      config.nodes.forEach(function (node) {
        var layout = nodeTextLayout(node);
        var nodeClass = 'asf-node' + (node.kind === 'decision' ? ' is-decision' : '') + (node.kind === 'warning' ? ' is-warning' : '') + (layout.compact ? ' is-compact' : '');
        var group = svgEl('g', { class: nodeClass, 'data-node': node.id });
        group.appendChild(svgEl('rect', { x: node.x, y: node.y, width: node.width, height: node.height, rx: '0' }));
        group.appendChild(textBlock(node, 'asf-title', layout.title, layout.titleY, layout.titleStep));
        if (layout.detail.length) {
          group.appendChild(textBlock(node, 'asf-detail', layout.detail, layout.detailY, layout.detailStep));
        }
        svg.appendChild(group);
        nodeViews.push({ config: node, element: group });
      });

      var previous = el('button', { class: 'asf-button', type: 'button' }, ['Previous']);
      var next = el('button', { class: 'asf-button', type: 'button' }, ['Next']);
      var replay = el('button', { class: 'asf-button', type: 'button' }, ['Replay']);
      var range = el('input', {
        class: 'asf-range', type: 'range', min: '0', max: String(maxStep), step: '1', value: '0',
        'aria-label': '图表步骤',
        'aria-describedby': noteDetailId,
        'aria-valuetext': '第 1 步，共 ' + config.steps.length + ': ' + config.steps[0].label
      });
      var count = el('span', { class: 'asf-count', 'aria-hidden': 'true' }, ['1 / ' + config.steps.length]);
      var noteTitle = el('strong');
      var noteDetail = el('span', { id: noteDetailId });
      var note = el('div', { class: 'asf-step-note' }, [noteTitle, noteDetail]);
      var status = el('span', { class: 'asf-status', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });

      function currentFocus() {
        var step = config.steps[state.step];
        return step.focus && step.focus.length ? step.focus : config.nodes.filter(function (node) {
          return node.stage === state.step;
        }).map(function (node) { return node.id; });
      }

      function render() {
        var focus = currentFocus();
        nodeViews.forEach(function (view) {
          var visible = view.config.stage <= state.step;
          var current = focus.indexOf(view.config.id) !== -1;
          view.element.classList.toggle('is-visible', visible);
          view.element.classList.toggle('is-current', current);
          if (current) view.element.setAttribute('aria-current', 'step');
          else view.element.removeAttribute('aria-current');
        });
        edgeViews.forEach(function (view) {
          view.element.classList.toggle('is-visible', view.config.stage <= state.step);
        });
        range.value = String(state.step);
        range.setAttribute('aria-valuetext', 'Step ' + (state.step + 1) + ' of ' + config.steps.length + ': ' + config.steps[state.step].label);
        count.textContent = (state.step + 1) + ' / ' + config.steps.length;
        previous.disabled = state.step === 0;
        next.disabled = state.step === maxStep;
        noteTitle.textContent = config.steps[state.step].label;
        noteDetail.textContent = config.steps[state.step].detail;
      }

      function clearTimer() {
        if (!timer) return;
        window.clearTimeout(timer);
        timer = 0;
      }

      function announceStep() {
        if (announcementTimer) window.clearTimeout(announcementTimer);
        status.textContent = '';
        announcementTimer = window.setTimeout(function () {
          announcementTimer = 0;
          status.textContent = 'Step ' + (state.step + 1) + ' of ' + config.steps.length + ': ' + config.steps[state.step].label + '. ' + config.steps[state.step].detail;
        }, 0);
      }

      function setStep(step, announce) {
        state.step = Math.max(0, Math.min(maxStep, step));
        render();
        if (announce) announceStep();
      }

      function pause() {
        clearTimer();
      }

      function resume() {
        if (timer || state.step >= maxStep || prefersReducedMotion()) return;
        timer = window.setTimeout(function advance() {
          timer = 0;
          if (state.step >= maxStep) return;
          setStep(state.step + 1);
          resume();
        }, config.delay || 850);
      }

      function staticFrame() {
        clearTimer();
        setStep(maxStep);
      }

      previous.addEventListener('click', function () {
        pause();
        setStep(state.step - 1, true);
      });
      next.addEventListener('click', function () {
        pause();
        setStep(state.step + 1, true);
      });
      replay.addEventListener('click', function () {
        pause();
        if (prefersReducedMotion()) setStep(maxStep, true);
        else {
          setStep(0, true);
          resume();
        }
      });
      range.addEventListener('input', function () {
        pause();
        setStep(Number(range.value));
      });

      var controls = el('div', { class: 'asf-controls' }, [
        previous,
        next,
        replay,
        el('div', { class: 'asf-range-wrap' }, [range, count])
      ]);
      var shell = el('section', { class: 'asf-shell' }, [
        el('div', { class: 'asf-head' }, [
          el('strong', {}, [config.title]),
          el('span', {}, [config.hint || '逐步穿过边界'])
        ]),
        el('div', { class: 'asf-body' }, [
          controls,
          el('div', { class: 'asf-canvas', tabindex: '0', 'aria-label': '可滚动的图表画布' }, [svg]),
          note,
          status
        ]),
        el('div', { class: 'asf-caption' }, [config.caption])
      ]);
      host.appendChild(shell);
      render();
      LF.addMotionController(host, { pause: pause, resume: resume, staticFrame: staticFrame });
      LF.registerDisposer(host, function () {
        clearTimer();
        if (announcementTimer) window.clearTimeout(announcementTimer);
      });
    };
  }

  var figures = {
    'skill-package-anatomy': makeFigure({
      title: 'Skill 包剖析',
      hint: '打开完整的可部署单元',
      description: '树状图展示一个发布就绪 Skill 包中的 SKILL.md、references、scripts 和 assets。',
      viewBox: '0 0 760 430',
      zones: [Z(18, 18, 724, 392, '一个可部署目录')],
      nodes: [
        N('bundle', 290, 42, 'release-readiness', '包根目录', 0, '', 180, 58),
        N('entry', 35, 150, 'SKILL.md', '身份 + 流程', 1, '', 140, 64),
        N('refs', 205, 150, 'references/', '分支规则', 1, '', 140, 64),
        N('scripts', 375, 150, 'scripts/', '确定性辅助程序', 1, '', 140, 64),
        N('assets', 545, 150, 'assets/', '输出材料', 1, '', 140, 64),
        N('policy', 185, 292, 'release-policy.md', '领域约束', 2, '', 150, 62),
        N('format', 350, 292, 'changelog-format.md', '格式契约', 2, '', 160, 62),
        N('inspect', 520, 292, 'inspect_release.py', '证据收集器', 2, '', 150, 62),
        N('checklist', 590, 342, 'release-checklist.md', '交付物模板', 2, '', 145, 62)
      ],
      edges: [
        E('bundle', 'entry', 1), E('bundle', 'refs', 1), E('bundle', 'scripts', 1), E('bundle', 'assets', 1),
        E('refs', 'policy', 2), E('refs', 'format', 2), E('scripts', 'inspect', 2), E('assets', 'checklist', 2)
      ],
      steps: [
        S('目录就是单元', '对整个包根目录进行安装、版本管理、审查和移除。', ['bundle']),
        S('四项职责', 'SKILL.md 负责路由和指导。References 负责解释。Scripts 负责计算。Assets 成为输出。', ['entry', 'refs', 'scripts', 'assets']),
        S('每个指针都必须能够解析', '只复制入口文件却缺少配套文件，得到的是一个损坏的包。', ['policy', 'format', 'inspect', 'checklist'])
      ],
      caption: '包完整性涵盖工作流指名的每个文件。发布 catalog 条目前，先验证目录树。'
    }),

    'skill-runtime-lifecycle': makeFigure({
      title: 'Skill 运行时生命周期',
      hint: '沿着身份进入经过验证的工作',
      description: 'Skill 从包发现到验证、选择、激活、执行和核验的生命周期。',
      viewBox: '0 0 920 500',
      nodes: [
        N('discover', 30, 55, 'Discover', '查找包', 0, '', 130, 60),
        N('validate', 190, 55, 'Validate', '元数据 + 布局', 1, '', 140, 60),
        N('catalog', 360, 55, 'Catalog', '名称 + 描述', 2, '', 140, 60),
        N('select', 535, 55, 'Select?', '显式或隐式', 3, 'decision', 140, 60),
        N('unloaded', 730, 25, '保持未加载', '无匹配', 4, 'warning', 150, 54),
        N('activate', 730, 125, 'Activate', '正文进入 Context', 4, '', 150, 60),
        N('body', 535, 230, '加载 SKILL.md', '工作流程', 5, '', 150, 60),
        N('resources', 350, 230, '披露资源', '仅所需分支', 6, '', 155, 60),
        N('execute', 165, 230, '请求执行', '宿主 Tool + 策略', 7, '', 155, 60),
        N('artifact', 30, 340, '产物 + 证据', '可观察结果', 8, '', 155, 60),
        N('verify', 250, 340, 'Verify', '独立关卡', 9, '', 135, 60)
      ],
      edges: [
        E('discover', 'validate', 1), E('validate', 'catalog', 2), E('catalog', 'select', 3),
        E('select', 'unloaded', 4, '无匹配', 'warning'), E('select', 'activate', 4, 'selected'),
        E('activate', 'body', 5), E('body', 'resources', 6), E('resources', 'execute', 7),
        E('execute', 'artifact', 8), E('artifact', 'verify', 9)
      ],
      steps: [
        S('发现并不等于激活', '运行时首先找到一个潜在包。', ['discover']),
        S('尽早拒绝格式错误的包', '验证在 Model 看到条目之前保护 catalog。', ['validate']),
        S('发布紧凑的路由元数据', '只有身份和触发信息需要占用 catalog 空间。', ['catalog']),
        S('选择是一个独立决策', '宿主特定的显式操作或由描述驱动的 Model 匹配都可以选择该包。', ['select']),
        S('选择可以弃权', '无匹配时正文保持未加载。匹配则激活正文。', ['unloaded', 'activate']),
        S('激活会加载流程', '正文进入 Model 可见的 Context，但不会因此获得任何 Tool 权限。', ['body']),
        S('披露遵循分支', '只读取当前需要的 references、scripts 或 assets。', ['resources']),
        S('执行始终由宿主控制', 'Agent 在当前策略下请求 Tool 或 scripts。', ['execute']),
        S('随产物返回证据', '流畅的声明不如路径、观察结果和退出结果有力。', ['artifact']),
        S('验证闭合循环', '独立于生成结果的 Model 检查结果。', ['verify'])
      ],
      caption: '按生命周期阶段诊断故障。已发现、已选择、已激活、已执行和已验证是不同状态。'
    }),

    'skill-tool-orthogonality': makeFigure({
      title: 'Skill 流程与 Tool 能力',
      hint: '将如何执行与能执行什么分开',
      description: '一个反馈循环：已激活的 Skill 指导流程，宿主 Tool 则为最终产物返回观察结果。',
      viewBox: '0 0 760 500',
      zones: [Z(28, 22, 704, 450, '流程循环')],
      nodes: [
        N('goal', 300, 42, '用户目标', '定义结果', 0, '', 160, 58),
        N('skill', 300, 128, '已激活的 Skill', '流程性知识', 1, '', 160, 60),
        N('procedure', 300, 220, '决策规则', '选择下一项操作', 2, 'decision', 160, 60),
        N('tool', 60, 220, 'MCP 或本地 Tool', '类型化能力', 3, '', 170, 60),
        N('observation', 60, 330, 'Observation', '证据，而非权限', 4, '', 170, 60),
        N('artifact', 540, 220, 'Artifact', '契约约定的输出', 5, '', 150, 60),
        N('verify', 540, 330, 'Verification', '独立检查', 6, '', 150, 60)
      ],
      edges: [
        E('goal', 'skill', 1), E('skill', 'procedure', 2), E('procedure', 'tool', 3), E('tool', 'observation', 4),
        E('observation', 'procedure', 4, '反馈证据', '', [[145, 330], [145, 300], [280, 300], [280, 250], [300, 250]]),
        E('procedure', 'artifact', 5), E('artifact', 'verify', 6)
      ],
      steps: [
        S('用户拥有目标', '任务起点位于 Skill 和 Tool 之上。', ['goal']),
        S('Skill 提供方法', '它提供流程和决策边界。', ['skill']),
        S('流程选择一种能力', '指名某个 Tool 并不会创建或授权它。', ['procedure']),
        S('宿主公开真正的 Tool', 'Tool 契约定义实际可以请求的内容。', ['tool']),
        S('观察结果更新判断', 'Tool 输出作为证据返回，而不是作为优先级更高的指令。', ['observation', 'procedure']),
        S('流程生成产物', 'Skill 将观察结果转化为所需输出。', ['artifact']),
        S('验证保持独立', '产物必须通过独立于 Model 叙述之外的检查。', ['verify'])
      ],
      caption: 'Skill 回答如何处理工作。Tool 回答宿主可以执行哪项操作。'
    }),

    'skill-validation-order': makeFigure({
      title: 'Skill 验证顺序',
      hint: '在第一个被破坏的不变量处失败',
      description: '一条从 frontmatter 分隔符到正文和资源规则的自左向右验证流水线。',
      viewBox: '0 0 860 230',
      nodes: [
        N('frontmatter', 20, 78, 'Frontmatter', 'delimiters', 0, '', 125, 62),
        N('scalar', 160, 78, 'Scalar 元数据', '安全解析', 1, '', 125, 62),
        N('name', 300, 78, '名称 = 目录', '稳定身份', 2, '', 135, 62),
        N('required', 450, 78, '必填字段', '名称 + 描述', 3, '', 135, 62),
        N('extensions', 600, 78, '已知扩展', '适配器 allowlist', 4, '', 125, 62),
        N('body', 740, 78, '正文 + 资源', '深层规则', 5, '', 105, 62)
      ],
      edges: [E('frontmatter', 'scalar', 1), E('scalar', 'name', 2), E('name', 'required', 3), E('required', 'extensions', 4), E('extensions', 'body', 5)],
      steps: [
        S('查找文档边界', '不要从格式错误的标头中推断元数据。', ['frontmatter']),
        S('仅解析预期结构', '在进行更深层检查之前，拒绝意外的元数据类型。', ['scalar']),
        S('证明包身份', '声明的名称必须与所在目录一致。', ['name']),
        S('要求提供路由元数据', '缺少身份或描述会阻止发布 catalog。', ['required']),
        S('指明宿主特定语义', '未知扩展需要明确的适配器决策。', ['extensions']),
        S('然后检查正文和资源', '只有在低成本结构检查通过后，深层检查才有意义。', ['body'])
      ],
      caption: '低成本结构检查应先失败，以免次要内容错误掩盖第一个被破坏的不变量。'
    }),

    'skill-discovery-pipeline': makeFigure({
      title: '发现编译器流水线',
      hint: '将文件系统候选项编译为 catalog',
      description: '配置的根目录依次经过枚举、包验证、来源记录、冲突解决、预算应用和 catalog 发布。',
      viewBox: '0 0 980 250',
      nodes: [
        N('roots', 20, 88, '配置的根目录', 'workspace、user、admin', 0, '', 130, 66),
        N('enumerate', 165, 88, 'Enumerate', '直接 Skill 目录', 1, '', 120, 66),
        N('entry', 300, 88, '查找 SKILL.md', '一个入口点', 2, '', 120, 66),
        N('validate', 435, 88, '验证包', '结构 + 限制', 3, '', 120, 66),
        N('provenance', 570, 88, '附加来源信息', '作用域 + 来源', 4, '', 125, 66),
        N('collision', 710, 88, '解决冲突', '声明的策略', 5, 'decision', 120, 66),
        N('budget', 845, 38, '应用预算', '有界 catalog', 6, '', 120, 62),
        N('publish', 845, 148, '发布条目', '名称 + 描述 + 路径', 7, '', 120, 62)
      ],
      edges: [
        E('roots', 'enumerate', 1), E('enumerate', 'entry', 2), E('entry', 'validate', 3), E('validate', 'provenance', 4),
        E('provenance', 'collision', 5), E('collision', 'budget', 6), E('budget', 'publish', 7)
      ],
      steps: [
        S('从声明的根目录开始', '发现作用域是运行时策略，而不是包属性。', ['roots']),
        S('保留包边界', '检查直接 Skill 目录，而不是发布每个嵌套示例。', ['enumerate']),
        S('定位一个入口点', '只有在预期位置存在 SKILL.md 时，目录才会成为候选项。', ['entry']),
        S('先验证，再使其可见', '格式错误的包不应占用 catalog 空间。', ['validate']),
        S('携带来源身份', '作用域和来源信息使重名问题可诊断。', ['provenance']),
        S('按策略解决名称问题', '明确选择保留、限定名称、拒绝或设置优先级。', ['collision']),
        S('为准确的序列化结果编制预算', 'catalog 大小由宿主管理，活动 Context 则使用另一项独立预算。', ['budget']),
        S('发布紧凑元数据', 'Model 看到的是路由身份，而不是完整的包目录树。', ['publish'])
      ],
      caption: '发现是一个确定性编译过程。在诊断信息中保留被拒绝和被遮蔽的候选项。'
    }),

    'skill-disclosure-levels': makeFigure({
      title: '三个披露层级',
      hint: '仅当任务确有需要时才允许 Context 进入',
      description: '三个堆叠层级分别展示 catalog 元数据、活动 SKILL.md 正文和分支特定资源。',
      viewBox: '0 0 760 470',
      zones: [Z(65, 30, 630, 390, '为一个任务准入的 Context')],
      nodes: [
        N('level1', 150, 62, '第 1 层：catalog 元数据', '名称 + 描述', 0, '', 460, 72),
        N('level2', 150, 184, '第 2 层：SKILL.md 正文', '工作流 + 决策图', 1, '', 460, 72),
        N('level3', 150, 306, '第 3 层：支持资源', 'references + scripts + assets', 2, '', 460, 72)
      ],
      edges: [E('level1', 'level2', 1, '已选择 Skill'), E('level2', 'level3', 2, '分支需要详细信息')],
      steps: [
        S('第 1 层负责路由', '名称和描述让 Model 无需加载正文即可区分符合条件的 Skill。', ['level1']),
        S('第 2 层开始工作', '激活会加载足够的流程，以便安全地选择分支并开始工作。', ['level2']),
        S('第 3 层提供精确信息', '只有选定的分支才能将 references、scripts 或 assets 引入 Context。', ['level3'])
      ],
      caption: '渐进式披露是分阶段准入 Context，而不是提升权限。'
    }),

    'skill-reference-map': makeFigure({
      title: '单跳引用图',
      hint: '让每个分支都可直接到达',
      description: 'SKILL.md 直接指向 Python、container、documentation 和 report-template references。',
      viewBox: '0 0 760 390',
      nodes: [
        N('skill', 300, 42, 'SKILL.md', '决策图', 0, '', 160, 62),
        N('python', 30, 245, 'python-release.md', 'Python 分支', 1, '', 155, 62),
        N('container', 210, 245, 'container-release.md', '镜像分支', 1, '', 165, 62),
        N('docs', 405, 245, 'docs-release.md', '文档分支', 1, '', 145, 62),
        N('template', 575, 245, 'report-template.md', '输出契约', 1, '', 155, 62)
      ],
      edges: [E('skill', 'python', 1, 'Python'), E('skill', 'container', 1, 'container'), E('skill', 'docs', 1, 'docs'), E('skill', 'template', 1, '所有分支')],
      steps: [
        S('正文就是地图', '激活应展示默认工作流和每个加载条件。', ['skill']),
        S('分支指向一跳之外', '直接链接让资源可达性可以被观察，并使无关指南保持未加载状态。', ['python', 'container', 'docs', 'template'])
      ],
      caption: '直接决策图优于主题堆砌。每个支持文件都应有明确的加载条件。'
    }),

    'skill-resource-containment': makeFigure({
      title: '资源包含性关卡',
      hint: '读取前解析真实目标',
      description: '决策树会拒绝绝对路径、父目录遍历、symlink 逃逸、错误文件类型和超大资源。',
      viewBox: '0 0 940 590',
      nodes: [
        N('request', 35, 60, '请求的路径', '相对包输入', 0, '', 145, 62),
        N('escape', 225, 60, '绝对路径或父目录逃逸？', '../ or /root', 1, 'decision', 170, 62),
        N('reject1', 470, 18, 'Reject', '无效输入结构', 2, 'warning', 125, 52),
        N('resolve', 470, 105, '解析路径', '真实包根目录', 2, '', 140, 60),
        N('inside', 650, 105, '目标位于根目录下？', '解析 symlink 后', 3, 'decision', 150, 62),
        N('reject2', 815, 45, 'Reject', '逃逸根目录', 4, 'warning', 110, 52),
        N('type', 650, 230, '文件类型符合预期？', '允许的常规文件', 4, 'decision', 150, 62),
        N('reject3', 815, 230, 'Reject', '错误文件或特殊文件', 5, 'warning', 110, 52),
        N('limit', 455, 350, '在大小限制内？', '有界 Context 读取', 5, 'decision', 155, 62),
        N('reject4', 670, 390, 'Reject', '超大资源', 6, 'warning', 130, 52),
        N('load', 255, 455, '加载资源', '记录原因 + 字节数', 6, '', 150, 62)
      ],
      edges: [
        E('request', 'escape', 1), E('escape', 'reject1', 2, 'yes', 'warning'), E('escape', 'resolve', 2, 'no'),
        E('resolve', 'inside', 3), E('inside', 'reject2', 4, 'no', 'warning'), E('inside', 'type', 4, 'yes'),
        E('type', 'reject3', 5, 'no', 'warning'), E('type', 'limit', 5, 'yes'),
        E('limit', 'reject4', 6, 'no', 'warning'), E('limit', 'load', 6, 'yes')
      ],
      steps: [
        S('从不受信任的相对路径开始', '在包含性检查证明安全之前，请求只是数据。', ['request']),
        S('拒绝明显的逃逸语法', '绝对路径和父目录片段绝不能进入文件系统解析。', ['escape']),
        S('以包根目录为基准进行解析', '字符串前缀无法检测 symlink 或规范化逃逸。', ['reject1', 'resolve']),
        S('比较解析后的路径', '真实目标必须保持在真实包根目录之内。', ['inside']),
        S('检查操作和文件类型', '仅满足包含性要求并不能使 socket、device 或错误后缀变得有效。', ['reject2', 'type']),
        S('限制 Context 准入', '拒绝意外类型以及超过声明大小限制的文件。', ['reject3', 'limit']),
        S('携带证据加载，否则拒绝', '记录资源、分支原因和字节数，但不记录 secret。', ['reject4', 'load'])
      ],
      caption: '解析后的包含性检查保护包边界，但无法证明包内内容可信。'
    }),

    'skill-invocation-stages': makeFigure({
      title: '五个调用阶段',
      hint: '明确指出失败的具体边界',
      description: '一条从已发现到已完成的状态路径，包含已拒绝、未选择和已阻止出口。',
      viewBox: '0 0 940 470',
      nodes: [
        N('discovered', 25, 75, 'Discovered', '包存在', 0, '', 125, 60),
        N('eligible', 180, 75, 'Eligible', '参与者 + 策略允许', 1, '', 130, 60),
        N('selected', 340, 75, 'Selected', '宿主身份或描述', 2, '', 130, 60),
        N('activated', 500, 75, 'Activated', '正文位于 Context 中', 3, '', 130, 60),
        N('executing', 660, 75, 'Executing', '工作开始', 4, '', 130, 60),
        N('completed', 820, 75, 'Completed', '输出已验证', 5, '', 105, 60),
        N('denied', 180, 245, 'Denied', '参与者或策略阻止', 1, 'warning', 130, 58),
        N('notselected', 340, 330, '未选择', '未达到阈值', 2, 'warning', 130, 58),
        N('blocked', 500, 245, 'Blocked', '缺少能力或批准', 4, 'warning', 150, 58)
      ],
      edges: [
        E('discovered', 'eligible', 1), E('discovered', 'denied', 1, '被策略阻止', 'warning'),
        E('eligible', 'selected', 2), E('eligible', 'notselected', 2, '路由器弃权', 'warning'),
        E('selected', 'activated', 3), E('activated', 'executing', 4), E('activated', 'blocked', 4, '缺少权限', 'warning'),
        E('executing', 'completed', 5)
      ],
      steps: [
        S('Discovered', '包存在于配置的作用域中。尚无参与者使用它。', ['discovered']),
        S('符合条件或被拒绝', '策略决定该参与者是否可以请求 Skill。', ['eligible', 'denied']),
        S('已选择或未选择', '宿主解析显式身份。Model 路由比较 catalog 描述，并且可以弃权。', ['selected', 'notselected']),
        S('Activated', '正文进入工作 Context。这仍不等于执行 Tool。', ['activated']),
        S('执行中或被阻止', '只有具备能力、权限和批准时，工作才会开始。', ['executing', 'blocked']),
        S('Completed', '独立验证将尝试执行的工作流转变为已完成的工作流。', ['completed'])
      ],
      caption: '单一的 skill_used 标志会隐藏路由、策略、能力或验证失败的具体边界。'
    }),

    'skill-routing-abstention': makeFigure({
      title: '带弃权机制的路由',
      hint: '比较相关性前先按策略筛选',
      description: '请求先经过参与者资格审查和描述比较，然后由明确匹配决策选择激活、询问或弃权。',
      viewBox: '0 0 800 500',
      nodes: [
        N('request', 40, 55, '用户请求', '任务 Context', 0, '', 145, 60),
        N('eligible', 235, 55, '筛选资格', '参与者 + 宿主策略', 1, '', 155, 60),
        N('compare', 445, 55, '比较描述', '仅符合条件的 catalog', 2, '', 170, 60),
        N('clear', 445, 180, '有一个明确匹配？', '阈值 + 差值', 3, 'decision', 170, 62),
        N('activate', 75, 350, '激活 Skill', '明确且符合条件的胜出项', 4, '', 155, 60),
        N('ask', 320, 350, '询问或正常推理', '存在歧义的近似匹配', 4, 'warning', 180, 60),
        N('none', 590, 350, '不要激活', '无匹配', 4, 'warning', 155, 60)
      ],
      edges: [
        E('request', 'eligible', 1), E('eligible', 'compare', 2), E('compare', 'clear', 3),
        E('clear', 'activate', 4, 'yes'), E('clear', 'ask', 4, 'ambiguous', 'warning'), E('clear', 'none', 4, '无匹配', 'warning')
      ],
      steps: [
        S('从请求开始', '路由应保留任务意图，而不是只统计关键词。', ['request']),
        S('先按权限筛选', '被阻止的最高匹配项不得压制得分较低但符合条件的候选项。', ['eligible']),
        S('比较有界描述', '能力、触发条件、Context 和排除条件共同决定相关性。', ['compare']),
        S('要求有明确胜出项', '符合条件的最高分仍需满足阈值和消除歧义的差值。', ['clear']),
        S('激活、询问或弃权', '证据不足时，不做选择是一种有意的结果。', ['activate', 'ask', 'none'])
      ],
      caption: '路由器只对符合条件的 Skill 排名，并保留显式弃权路径。'
    }),

    'skill-argument-boundaries': makeFigure({
      title: '参数边界转换',
      hint: '保留意图，但不执行文本',
      description: '用户文本依次变为解析后的参数、Skill Context、类型化 Tool 调用和经过验证的执行输入。',
      viewBox: '0 0 860 270',
      zones: [Z(15, 30, 830, 190, '文本先变为数据，再变为类型化输入')],
      nodes: [
        N('text', 35, 92, '用户文本', '带引号的请求', 0, '', 135, 62),
        N('parser', 200, 92, '宿主解析器', '语法 + 引号', 1, '', 135, 62),
        N('bound', 365, 92, '绑定的参数', '经过验证的值', 2, '', 140, 62),
        N('context', 535, 92, 'Skill Context', '流程看到的是数据', 3, '', 135, 62),
        N('tool', 700, 92, '类型化 Tool 调用', 'schema 再次验证', 4, '', 135, 62)
      ],
      edges: [E('text', 'parser', 1), E('parser', 'bound', 2), E('bound', 'context', 3), E('context', 'tool', 4)],
      steps: [
        S('用户文本不是命令字符串', '保持原始意图和引号可见。', ['text']),
        S('宿主拥有命令语法', 'Slash commands、变量和引号由适配器处理。', ['parser']),
        S('绑定并验证值', '必需参数、默认值和允许的结构成为显式数据。', ['bound']),
        S('指令使用数据', 'Skill 选择分支，而不将原始文本插入 shell。', ['context']),
        S('类型化 Tool 再次验证', '进入执行阶段需要 schema 和有界参数 Vector。', ['tool'])
      ],
      caption: '每个表示边界都应验证值，不得将用户控制的文本视为代码。'
    }),

    'skill-host-adapter': makeFigure({
      title: '可移植核心与宿主适配器',
      hint: '将扩展置于核心契约之外',
      description: '可移植 Skill 包和宿主适配器为同一个运行时激活边界提供不同输入。',
      viewBox: '0 0 860 500',
      zones: [Z(25, 35, 365, 390, '可移植包'), Z(470, 35, 365, 390, '宿主适配器')],
      nodes: [
        N('bundle', 130, 70, '可移植包', '跨宿主目录', 0, '', 155, 60),
        N('skill', 55, 180, 'SKILL.md', '核心流程', 1, '', 130, 58),
        N('refs', 205, 180, 'references/', '分支详细信息', 1, '', 130, 58),
        N('scripts', 130, 285, 'scripts/', 'helpers', 1, '', 130, 58),
        N('adapter', 575, 70, '宿主适配器', '运行时特定代码', 2, '', 155, 60),
        N('discovery', 495, 180, '发现路径', '搜索位置', 3, '', 135, 58),
        N('api', 650, 180, '激活 API', '如何加载', 3, '', 135, 58),
        N('policy', 495, 285, '调用策略', '谁可以选择', 3, '', 135, 58),
        N('binding', 650, 285, '参数绑定', '宿主语法', 3, '', 135, 58),
        N('runtime', 345, 425, '运行时激活', '核心 + 适配器语义', 4, '', 170, 58)
      ],
      edges: [
        E('bundle', 'skill', 1), E('bundle', 'refs', 1), E('bundle', 'scripts', 1),
        E('adapter', 'discovery', 3), E('adapter', 'api', 3), E('adapter', 'policy', 3), E('adapter', 'binding', 3),
        E('bundle', 'runtime', 4), E('adapter', 'runtime', 4)
      ],
      steps: [
        S('保留可移植包', '入口文件及其配套文件应在脱离某个宿主后仍然易于理解。', ['bundle']),
        S('将核心职责放在一起', '流程、references 和辅助程序作为一个目录整体迁移。', ['skill', 'refs', 'scripts']),
        S('明确适配器', '运行时语义需要显式的兼容层。', ['adapter']),
        S('宿主行为保持宿主特定', '发现、激活 API、策略字段和参数语法都属于这一层。', ['discovery', 'api', 'policy', 'binding']),
        S('在运行时边界进行组合', '适配器激活可移植包，而不改写其核心声明。', ['runtime'])
      ],
      caption: '不要把某个宿主字段提升为虚假的通用标准。测试赋予它意义的适配器。'
    }),

    'skill-authority-chain': makeFigure({
      title: '权限与执行链',
      hint: '激活提出建议，宿主授予权限',
      description: '已激活的 Skill 会影响 Model 提案，该提案必须通过能力、权限、批准、隔离和验证检查。',
      viewBox: '0 0 980 330',
      nodes: [
        N('skill', 20, 105, '已激活的 Skill', '流程 Context', 0, '', 125, 62),
        N('model', 165, 105, 'Model 提案', '结构化操作', 1, '', 125, 62),
        N('capability', 310, 105, '能力注册表', '操作存在', 2, '', 135, 62),
        N('permission', 465, 105, '权限策略', '参与者 + 目标', 3, '', 130, 62),
        N('approval', 615, 105, '需要批准？', '后果关卡', 4, 'decision', 135, 62),
        N('executor', 775, 55, '隔离执行器', '有界作用范围', 5, '', 140, 62),
        N('stop', 775, 200, '停止并报告', '批准被拒绝', 5, 'warning', 140, 58),
        N('observe', 20, 245, 'Observation', '执行证据', 6, '', 125, 58),
        N('verify', 180, 245, '验证关卡', '契约通过', 7, '', 135, 58)
      ],
      edges: [
        E('skill', 'model', 1), E('model', 'capability', 2), E('capability', 'permission', 3), E('permission', 'approval', 4),
        E('approval', 'executor', 5, '允许或已授予'), E('approval', 'stop', 5, 'denied', 'warning'),
        E('executor', 'observe', 6, '', '', [[845, 117], [930, 117], [930, 275], [145, 275]]), E('observe', 'verify', 7)
      ],
      steps: [
        S('激活会改变 Context', 'Skill 可以影响提案，但不会授予任何权限。', ['skill']),
        S('表示操作', '执行前审查 argv、cwd、路径、网络、凭据和副作用。', ['model']),
        S('仅公开所需能力', '无法通过宿主请求不存在的操作。', ['capability']),
        S('授权参与者和目标', '权限策略约束此操作及其作用域。', ['permission']),
        S('针对实际后果请求批准', '只有目标和影响具体明确时，批准才有意义。', ['approval']),
        S('执行或停止', '已授予的权限仍在隔离环境内运行。拒绝不会产生副作用。', ['executor', 'stop']),
        S('捕获观察结果', '退出码、diff、文件和 Tool 结果成为证据。', ['observe']),
        S('独立验证', '包含性和授权无法证明结果正确。', ['verify'])
      ],
      caption: '能力、权限、批准、sandbox 和验证分别保护不同属性。确保每一层都清晰可见。'
    }),

    'skill-trust-surface': makeFigure({
      title: '完整的 Skill 信任面',
      hint: '标明每条边由谁控制',
      description: '包指令、references、任务内容、scripts、宿主 Tool、文件、网络、凭据和外部影响共同构成一个威胁面。',
      viewBox: '0 0 900 560',
      nodes: [
        N('package', 30, 55, 'Skill 包', '由发布者控制', 0, '', 145, 60),
        N('resources', 30, 150, 'References + assets', '支持内容', 0, '', 145, 60),
        N('untrusted', 30, 245, '不受信任的任务内容', 'issue、web、document', 0, 'warning', 160, 60),
        N('instructions', 260, 135, 'Model 指令', '混合信任 Context', 1, 'decision', 160, 66),
        N('scripts', 260, 285, 'Scripts + dependencies', '代码供应链', 2, 'warning', 160, 64),
        N('requests', 485, 190, '请求的操作', '结构化提案', 3, 'decision', 160, 66),
        N('host', 690, 190, '宿主 Tool + 执行器', '执行点', 4, '', 170, 66),
        N('files', 620, 355, 'Files', '读取 + 写入', 5, '', 110, 54),
        N('network', 750, 355, 'Network', 'egress', 5, 'warning', 110, 54),
        N('credentials', 620, 455, '环境 + 凭据', 'secret 作用域', 5, 'warning', 150, 58),
        N('effects', 780, 455, '外部影响', '发布、删除、计费', 5, 'warning', 110, 58)
      ],
      edges: [
        E('package', 'instructions', 1), E('resources', 'instructions', 1), E('untrusted', 'instructions', 1, '数据，而非权限', 'warning'),
        E('instructions', 'requests', 3), E('scripts', 'requests', 3), E('requests', 'host', 4),
        E('host', 'files', 5), E('host', 'network', 5, '', 'warning'), E('host', 'credentials', 5, '', 'warning'), E('host', 'effects', 5, '', 'warning')
      ],
      steps: [
        S('盘点每个内容来源', '包文件和任务输入都能影响 Model，但它们具有不同的权限。', ['package', 'resources', 'untrusted']),
        S('将数据与指令分开', '当不受信任的内容跨越此边界时，就会发生 Prompt injection。', ['instructions']),
        S('检查代码供应链', 'Scripts 和 dependencies 可以在不出现在文字说明中的情况下请求产生影响。', ['scripts']),
        S('结构化所提议的操作', '在任何执行器启动前审查操作。', ['requests']),
        S('在宿主边界强制执行', 'Model 无法自行提供隔离或权限策略。', ['host']),
        S('约束每个后果面', '文件、网络、凭据和外部影响需要各自独立的策略。', ['files', 'network', 'credentials', 'effects'])
      ],
      caption: '信任是贯穿包来源、内容、运行时、能力、隔离、凭证和证据的一条声明链。'
    }),

    'skill-approval-decision': makeFigure({
      title: '审批取决于后果',
      hint: '根据可逆性、范围和影响作出决策',
      description: '决策树将本地可逆操作路由至沙箱执行，将超出范围的操作路由至审批，并在审批被拒时停止。',
      viewBox: '0 0 900 570',
      nodes: [
        N('action', 35, 65, '拟议操作', '目标 + 后果', 0, '', 145, 60),
        N('reversible', 225, 65, '可逆 + 本地？', '可以回滚', 1, 'decision', 165, 62),
        N('scope', 470, 35, '在预先批准的范围内？', '执行者 + 操作 + 目标', 2, 'decision', 185, 62),
        N('impact', 470, 180, '外部、破坏性、高成本或敏感？', '严重后果', 2, 'decision', 205, 76),
        N('execute', 700, 35, '在沙箱中执行', '仍保持隔离控制', 3, '', 165, 62),
        N('ask', 700, 220, '请求限定范围的审批', '展示确切后果', 3, 'warning', 165, 62),
        N('granted', 500, 360, 'Granted', '不可变操作记录', 4, '', 135, 58),
        N('denied', 700, 360, 'Denied', 'stop', 4, 'warning', 135, 58),
        N('result', 500, 470, '有界执行', '重新验证 + 核验', 5, '', 160, 60)
      ],
      edges: [
        E('action', 'reversible', 1), E('reversible', 'scope', 2, 'yes'), E('reversible', 'impact', 2, 'no'),
        E('scope', 'execute', 3, 'yes'), E('scope', 'ask', 3, 'no', 'warning'), E('impact', 'ask', 3, 'yes', 'warning'), E('impact', 'execute', 3, 'no'),
        E('ask', 'granted', 4, 'granted'), E('ask', 'denied', 4, 'denied', 'warning'),
        E('execute', 'result', 5), E('granted', 'result', 5)
      ],
      steps: [
        S('明确操作名称', '无法根据允许使用通用 shell 的模糊请求来评估审批。', ['action']),
        S('检查可逆性和本地性', '本地可逆操作通常可以纳入预授权策略。', ['reversible']),
        S('检查范围或后果', '超出范围或影响重大的工作需要审慎的权限决策。', ['scope', 'impact']),
        S('执行或请求审批', '审批不能替代沙箱隔离，沙箱隔离也不等同于审批。', ['execute', 'ask']),
        S('遵守决策', '一次授权仅约束一个操作。拒绝授权则停止该操作。', ['granted', 'denied']),
        S('启动前重新验证', '执行器再次检查规范化后的目标，并在操作完成后核验结果。', ['result'])
      ],
      caption: '审批应展示确切目标和后果。它绝不会禁用隔离，也不会授权后续目标。'
    }),

    'skill-workflow-extraction': makeFigure({
      title: '判断与确定性工作',
      hint: '将每项行为放在可测试的位置',
      description: '任务依次经过 Model 分类、分支参考资料、确定性证据收集、Model 解读、产物契约和核验。',
      viewBox: '0 0 950 300',
      zones: [Z(15, 25, 920, 225, '可观测的工作流契约')],
      nodes: [
        N('task', 30, 100, '任务请求', '触发边界', 0, '', 125, 62),
        N('classify', 175, 100, 'Model 判断', '分类 + 选择分支', 1, 'decision', 135, 62),
        N('reference', 330, 100, 'Reference', '分支特定规则', 2, '', 135, 62),
        N('script', 485, 100, '脚本或 Tool', '收集证据', 3, '', 135, 62),
        N('interpret', 640, 100, 'Model 判断', '解读证据', 4, 'decision', 135, 62),
        N('artifact', 795, 55, '产物契约', '必需输出', 5, '', 135, 62),
        N('verify', 795, 160, 'Verification', '机器 + 人工', 6, '', 135, 62)
      ],
      edges: [E('task', 'classify', 1), E('classify', 'reference', 2), E('reference', 'script', 3), E('script', 'interpret', 4), E('interpret', 'artifact', 5), E('artifact', 'verify', 6)],
      steps: [
        S('从真实触发事件开始', '工作流候选项始于有界事件和预期产物。', ['task']),
        S('使用判断处理歧义', 'Model 对任务进行分类并选择分支。', ['classify']),
        S('加载准确的领域规则', '参考资料仅为选定分支提供详细信息。', ['reference']),
        S('自动收集确定性证据', '脚本和类型化 Tool 执行解析、计数、查询和验证。', ['script']),
        S('解读观测结果', 'Model 综合证据，而不是模拟确定性解析。', ['interpret']),
        S('按照产物契约写入', '必需字段和路径使完成状态成为可观测的声明。', ['artifact']),
        S('通过另一种机制核验', '机器检查和经过校准的人工审查完成工作流闭环。', ['verify'])
      ],
      caption: '使用 Model 判断进行分类和综合。使用代码完成可重复的计算并检验不变量。'
    }),

    'skill-eval-layers': makeFigure({
      title: '六层 Skill 发布门禁',
      hint: '不要用平均值掩盖硬性失败',
      description: '六个评估层共同构成发布门禁：结构、路由、行为、脚本、安全性和可移植性。',
      viewBox: '0 0 780 590',
      nodes: [
        N('structure', 210, 35, '1. 包结构', '静态契约', 0, '', 360, 58),
        N('routing', 210, 115, '2. 触发路由', '精确率 + 召回率 + 弃权', 1, '', 360, 58),
        N('behavior', 210, 195, '3. 产物行为', '基线 vs 处理组', 2, '', 360, 58),
        N('scripts', 210, 275, '4. 脚本正确性', '测试夹具 + 边界情况', 3, '', 360, 58),
        N('safety', 210, 355, '5. 安全性 + 权限', '硬性边界情况', 4, 'warning', 360, 58),
        N('portability', 210, 435, '6. 打包 + 可移植性', '全新安装 + 宿主 Matrix', 5, '', 360, 58),
        N('gate', 270, 520, '发布门禁', '所有必需层均通过', 6, 'decision', 240, 52)
      ],
      edges: [E('structure', 'routing', 1), E('routing', 'behavior', 2), E('behavior', 'scripts', 3), E('scripts', 'safety', 4), E('safety', 'portability', 5), E('portability', 'gate', 6)],
      steps: [
        S('Structure', '对包标识、文件、链接、限制和必需章节进行 lint 检查。', ['structure']),
        S('Routing', '衡量正例、负例、近似匹配、竞争 Skill 和弃权。', ['routing']),
        S('Behavior', '在使用与不使用该 Skill 的情况下，对相同的 Model、Tool、测试夹具和预算进行比较。', ['behavior']),
        S('Scripts', '在 Model 运行之外测试确定性辅助程序，包括重复状态和部分状态。', ['scripts']),
        S('Safety', '要求每个权限和隔离控制用例均通过。再有力的文字表述也无法抵消违规。', ['safety']),
        S('打包和可移植性', '安装完整目录树，并测试必需的宿主能力或已声明的回退方案。', ['portability']),
        S('仅通过门禁发布', '报告失败层及其证据，而不是将所有结果压缩为一个分数。', ['gate'])
      ],
      caption: '每个评估层回答不同的问题。通过一层绝不能替代通过另一层。'
    }),

    'skill-package-install': makeFigure({
      title: '全新安装完整性路径',
      hint: '测试已安装目录树，而不只是源代码',
      description: '源 Skill 包依次转化为 manifest、完整的已安装目录树、经过验证的包、已发现的 catalog 条目和评估冒烟测试。',
      viewBox: '0 0 900 270',
      nodes: [
        N('source', 25, 92, '源代码包', '已审查的目录树', 0, '', 135, 62),
        N('manifest', 190, 92, '构建 manifest', '规范路径 + 哈希', 1, '', 140, 62),
        N('install', 360, 92, '安装完整目录树', '空白目标位置', 2, '', 145, 62),
        N('hash', 535, 92, '验证路径 + 哈希', '检测缺失或漂移', 3, '', 145, 62),
        N('discover', 710, 45, '发现已安装的 Skill', '真实范围', 4, '', 160, 62),
        N('smoke', 710, 155, '运行评估冒烟测试', '已安装副本', 5, '', 160, 62)
      ],
      edges: [E('source', 'manifest', 1), E('manifest', 'install', 2), E('install', 'hash', 3), E('hash', 'discover', 4), E('discover', 'smoke', 5)],
      steps: [
        S('从完整的源目录树开始', '发布单元包括每个被引用的文件、脚本、资产和测试夹具。', ['source']),
        S('描述预期字节', '规范相对路径和哈希使漂移可观测。', ['manifest']),
        S('安装到空白目标位置', '干净的目录树会暴露遗漏文件和升级后残留的过期文件。', ['install']),
        S('激活前验证', '拒绝包含缺失、新增、重写或不匹配文件的包。', ['hash']),
        S('探测真实发现流程', '已安装范围和宿主 catalog 必须能够找到预期标识。', ['discover']),
        S('执行已安装的冒烟测试', '仅源代码成功无法证明安装程序或运行时行为。', ['smoke'])
      ],
      caption: '包测试应检验已安装副本。源目录树测试会遗漏安装程序和升级故障。'
    }),

    'skill-authoring-loop': makeFigure({
      title: 'Skill 编写修复循环',
      hint: '修改应对失败负责的层',
      description: '工作流经过观测、契约定义、打包和评估，再按失败层分类并修复，且仅在通过门禁后发布。',
      viewBox: '0 0 980 610',
      nodes: [
        N('observe', 30, 55, '观测工作流', '真实专家实践', 0, '', 145, 60),
        N('contract', 210, 55, '定义契约', '触发条件 + 产物 + 安全性', 1, '', 145, 60),
        N('package', 390, 55, '打包流程', '主体 + 辅助程序', 2, '', 145, 60),
        N('eval', 570, 55, '运行分层评估', '重复 + 比较', 3, '', 145, 60),
        N('failure', 750, 55, '失败类别？', '正确路由修复', 4, 'decision', 155, 60),
        N('routing', 50, 250, 'Routing', '描述或策略', 5, '', 135, 58),
        N('behavior', 210, 250, 'Behavior', '主体、参考资料、Tool', 5, '', 135, 58),
        N('script', 370, 250, 'Script', '确定性代码', 5, '', 135, 58),
        N('safety', 530, 250, 'Safety', '权限 + 隔离', 5, 'warning', 135, 58),
        N('portability', 690, 250, 'Portability', '适配器或回退方案', 5, '', 135, 58),
        N('reeval', 370, 400, '重新运行受影响的评估', '保留所有追踪记录', 6, '', 170, 60),
        N('release', 625, 500, '发布完整包', '门禁已通过', 7, '', 190, 60)
      ],
      edges: [
        E('observe', 'contract', 1), E('contract', 'package', 2), E('package', 'eval', 3), E('eval', 'failure', 4),
        E('failure', 'routing', 5, 'routing'), E('failure', 'behavior', 5, 'behavior'), E('failure', 'script', 5, 'script'),
        E('failure', 'safety', 5, 'safety', 'warning'), E('failure', 'portability', 5, 'portability'),
        E('routing', 'reeval', 6), E('behavior', 'reeval', 6), E('script', 'reeval', 6), E('safety', 'reeval', 6), E('portability', 'reeval', 6),
        E('reeval', 'eval', 6, '新证据', '', [[455, 400], [455, 355], [642, 355], [642, 115]]),
        E('failure', 'release', 7, '通过门禁')
      ],
      steps: [
        S('观测真实工作', '从证据而非宽泛的主题标签中提取稳定流程。', ['observe']),
        S('定义可观测契约', '先编写触发条件、产物、核验和权限边界。', ['contract']),
        S('分别封装各项职责', '将判断、确定性工作、参考资料和输出放在可测试的位置。', ['package']),
        S('运行分层评估', '将路由、行为、脚本、安全性和可移植性作为相互独立的证据。', ['eval']),
        S('对失败进行分类', '发布门禁应识别实际发生故障的层。', ['failure']),
        S('修复应对失败负责的层', '当失败源于安装程序、脚本、沙箱或宿主适配器时，不要添加文字说明。', ['routing', 'behavior', 'script', 'safety', 'portability']),
        S('使用新证据重新运行', '保留每次运行的追踪记录，并检查未修改层是否出现回归。', ['reeval']),
        S('仅在通过门禁后发布', '将完整包及其兼容性证据一并交付。', ['release'])
      ],
      caption: '修复应对失败负责的层，然后再次执行门禁。绝不能让平均值掩盖严重的安全回归。'
    })
  };

  LF.register(figures);
})();
