/* figures-claude-certifications.js：Claude 认证课程的交互式机制实验。
   在 lesson-figures.js 和主题 figure 模块之后加载，
   然后通过 window.LF 注册。Vanilla ES5，无依赖。 */
(function () {
  'use strict';

  var LF = window.LF;
  if (!LF) return;

  var el = LF.el;
  var slider = LF.slider;
  var select = LF.select;
  var clamp = LF.clamp;

  function ensureStyles() {
    if (document.getElementById('cert-figure-styles')) return;
    var style = document.createElement('style');
    style.id = 'cert-figure-styles';
    style.textContent = [
      '.cf-shell{border:1px solid var(--rule-soft,#ddd);background:var(--bg,#fafaf5);margin:28px 0;font-family:var(--font-body,serif)}',
      '.cf-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:12px 16px;border-bottom:1px solid var(--rule-soft,#ddd);font-family:var(--font-mono,monospace);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-mute,#777)}',
      '.cf-head strong{color:var(--blueprint,#3553ff);font-weight:600}',
      '.cf-body{padding:16px}',
      '.cf-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 22px}',
      '.cf-output{margin-top:18px;padding-top:16px;border-top:1px dashed var(--rule-soft,#ddd)}',
      '.cf-status{font-family:var(--font-display,monospace);font-size:clamp(2rem,7vw,3.4rem);line-height:1;color:var(--blueprint,#3553ff)}',
      '.cf-status small{display:block;margin-top:8px;font-family:var(--font-mono,monospace);font-size:.68rem;line-height:1.45;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-soft,#555)}',
      '.cf-meta,.cf-formula{margin-top:8px;font-family:var(--font-mono,monospace);font-size:.7rem;line-height:1.5;color:var(--ink-mute,#777)}',
      '.cf-formula{color:var(--ink-soft,#555)}',
      '.cf-caption{padding:12px 16px;border-top:1px solid var(--rule-soft,#ddd);font-size:.92rem;line-height:1.55;color:var(--ink-soft,#555)}',
      '.cf-meter-list{display:grid;gap:10px;margin-top:14px}',
      '.cf-meter-row{display:grid;gap:4px}',
      '.cf-meter-label{display:flex;justify-content:space-between;gap:12px;font-family:var(--font-mono,monospace);font-size:.68rem;color:var(--ink-soft,#555)}',
      '.cf-meter{height:10px;overflow:hidden;background:var(--rule-soft,#ddd)}',
      '.cf-meter>i{display:block;width:100%;height:100%;background:var(--blueprint,#3553ff);transform:scaleX(0);transform-origin:left;transition:transform 120ms var(--ease-out,cubic-bezier(.23,1,.32,1))}',
      '.cf-meter.is-warning>i{background:var(--warn,#b8870f)}',
      '.cf-pipeline{display:grid;grid-template-columns:repeat(var(--cf-steps),minmax(0,1fr));gap:6px;margin-top:14px}',
      '.cf-step{min-height:72px;padding:9px;border:1px solid var(--rule-soft,#ddd);background:var(--bg-surface,#eee);font-family:var(--font-mono,monospace);font-size:.65rem;line-height:1.35;color:var(--ink-mute,#777)}',
      '.cf-step strong,.cf-step span{display:block}',
      '.cf-step strong{margin-bottom:5px;color:var(--ink,#111)}',
      '.cf-step.is-done{border-color:var(--blueprint,#3553ff);color:var(--blueprint,#3553ff)}',
      '.cf-step.is-active{border-color:var(--blueprint,#3553ff);background:var(--blueprint,#3553ff);color:var(--bg,#fff)}',
      '.cf-step.is-active strong{color:var(--bg,#fff)}',
      '.cf-lanes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}',
      '.cf-lane{padding:10px;border:1px solid var(--rule-soft,#ddd);font-family:var(--font-mono,monospace);font-size:.68rem;text-align:center;color:var(--ink-mute,#777)}',
      '.cf-lane.is-active{border-color:var(--blueprint,#3553ff);background:var(--blueprint-tint,rgba(53,83,255,.08));color:var(--blueprint,#3553ff)}',
      '@media(max-width:640px){.cf-grid{grid-template-columns:1fr}.cf-pipeline{grid-template-columns:1fr}.cf-lanes{grid-template-columns:1fr}.cf-step{min-height:0}}',
      '@media(prefers-reduced-motion:reduce){.cf-meter>i,.cf-shell .lf-bar i{transition:none}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function labelControls(root) {
    var groups = root.querySelectorAll('.lf-ctrl');
    for (var index = 0; index < groups.length; index++) {
      var control = groups[index].querySelector('input,select');
      var label = groups[index].querySelector('label');
      if (!control || !label || control.getAttribute('aria-label')) continue;
      var name = '';
      for (var node = label.firstChild; node; node = node.nextSibling) {
        if (node.nodeType === 3) name += node.nodeValue;
      }
      control.setAttribute('aria-label', name.trim() || '交互值');
    }
  }

  function shell(host, config, controls, output) {
    ensureStyles();
    var section = el('section', { class: 'cf-shell' }, [
      el('div', { class: 'cf-head' }, [
        el('strong', {}, [config.title]),
        el('span', {}, [config.hint || '更改输入'])
      ]),
      el('div', { class: 'cf-body' }, [controls, output]),
      el('div', { class: 'cf-caption' }, [config.caption])
    ]);
    host.appendChild(section);
    labelControls(section);
  }

  function meterRow(name) {
    var value = el('span', {}, ['0']);
    var fill = el('i');
    var meter = el('div', {
      class: 'cf-meter', role: 'progressbar',
      'aria-label': name,
      'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0'
    }, [fill]);
    return {
      root: el('div', { class: 'cf-meter-row' }, [
        el('div', { class: 'cf-meter-label' }, [el('span', {}, [name]), value]),
        meter
      ]),
      update: function (score, warning) {
        var safe = clamp(Math.round(score), 0, 100);
        value.textContent = safe + '%';
        meter.setAttribute('aria-valuenow', String(safe));
        meter.classList.toggle('is-warning', !!warning);
        fill.style.transform = 'scaleX(' + (safe / 100).toFixed(3) + ')';
      }
    };
  }

  function makeDecision(config) {
    return function (host) {
      var state = { a: config.a.defaultValue, b: config.b.defaultValue };
      var status = el('div', { class: 'cf-status', 'aria-live': 'polite' });
      var meta = el('div', { class: 'cf-meta' });
      var formula = el('div', { class: 'cf-formula' });
      var list = el('div', { class: 'cf-meter-list' });
      var rows = config.choices.map(function (choice) {
        var row = meterRow(choice.name);
        list.appendChild(row.root);
        return row;
      });

      state._render = function () {
        var bestIndex = 0;
        var bestScore = -1;
        config.choices.forEach(function (choice, index) {
          var score = choice.base + choice.a * ((state.a - 50) / 50) + choice.b * ((state.b - 50) / 50);
          score = clamp(score, 0, 100);
          rows[index].update(score, false);
          if (score > bestScore) {
            bestIndex = index;
            bestScore = score;
          }
        });
        var best = config.choices[bestIndex];
        status.innerHTML = best.name + '<small>' + best.why + '</small>';
        meta.textContent = config.a.label + ' ' + state.a + '  ·  ' + config.b.label + ' ' + state.b + '  ·  适配度 ' + Math.round(bestScore) + '%';
        formula.textContent = config.formula;
      };

      var controls = el('div', { class: 'cf-grid' }, [
        slider(state, 'a', config.a.label, 0, 100, 1),
        slider(state, 'b', config.b.label, 0, 100, 1)
      ]);
      var output = el('div', { class: 'cf-output' }, [status, list, meta, formula]);
      shell(host, config, controls, output);
      state._render();
    };
  }

  function makeThreshold(config) {
    return function (host) {
      var state = { signal: config.signal.defaultValue, impact: config.impact.defaultValue, cut: config.cut };
      var status = el('div', { class: 'cf-status', 'aria-live': 'polite' });
      var meta = el('div', { class: 'cf-meta' });
      var formula = el('div', { class: 'cf-formula' });
      var scoreMeter = meterRow(config.scoreLabel || '决策风险');
      var lanes = config.decisions.map(function (name) {
        var lane = el('div', { class: 'cf-lane' }, [name]);
        return lane;
      });

      state._render = function () {
        var score = Math.round(state.signal * config.signalWeight + state.impact * (1 - config.signalWeight));
        var index = score < state.cut ? 0 : score < state.cut + config.escalationBand ? 1 : 2;
        lanes.forEach(function (lane, laneIndex) { lane.classList.toggle('is-active', laneIndex === index); });
        scoreMeter.update(score, index === 2);
        status.innerHTML = config.decisions[index] + '<small>' + config.reasons[index] + '</small>';
        meta.textContent = config.signal.label + ' ' + state.signal + '  ·  ' + config.impact.label + ' ' + state.impact + '  ·  阈值 ' + state.cut;
        formula.textContent = config.formula;
      };

      var controls = el('div', { class: 'cf-grid' }, [
        slider(state, 'signal', config.signal.label, 0, 100, 1),
        slider(state, 'impact', config.impact.label, 0, 100, 1),
        slider(state, 'cut', config.thresholdLabel || '审核阈值', 20, 80, 1)
      ]);
      var output = el('div', { class: 'cf-output' }, [status, scoreMeter.root, el('div', { class: 'cf-lanes' }, lanes), meta, formula]);
      shell(host, config, controls, output);
      state._render();
    };
  }

  function makePipeline(config) {
    return function (host) {
      var state = { step: 0 };
      var status = el('div', { class: 'cf-status', 'aria-live': 'polite' });
      var meta = el('div', { class: 'cf-meta' });
      var pipeline = el('div', { class: 'cf-pipeline', style: '--cf-steps:' + config.steps.length });
      var cards = config.steps.map(function (step, index) {
        var card = el('div', { class: 'cf-step' }, [
          el('strong', {}, [(index + 1) + '. ' + step.name]),
          el('span', {}, [step.short])
        ]);
        pipeline.appendChild(card);
        return card;
      });

      state._render = function () {
        cards.forEach(function (card, index) {
          card.classList.toggle('is-done', index < state.step);
          card.classList.toggle('is-active', index === state.step);
          card.querySelector('span').textContent = index < state.step ? '已验证' : index === state.step ? config.steps[index].short : '等待中';
        });
        var active = config.steps[state.step];
        status.innerHTML = active.name + '<small>' + active.detail + '</small>';
        meta.textContent = '阶段 ' + (state.step + 1) + ' / ' + config.steps.length + '  ·  ' + config.formula;
      };

      var controls = el('div', {}, [slider(state, 'step', config.controlLabel || '当前阶段', 0, config.steps.length - 1, 1)]);
      var output = el('div', { class: 'cf-output' }, [status, pipeline, meta]);
      shell(host, config, controls, output);
      state._render();
    };
  }

  function makeEquation(config) {
    return function (host) {
      var state = { a: config.a.defaultValue, b: config.b.defaultValue };
      var status = el('div', { class: 'cf-status', 'aria-live': 'polite' });
      var meta = el('div', { class: 'cf-meta' });
      var formula = el('div', { class: 'cf-formula' });
      var resultMeter = meterRow(config.meterLabel);

      state._render = function () {
        var result = config.calculate(state.a, state.b);
        resultMeter.update(result.percent, result.warning);
        status.innerHTML = result.value + '<small>' + result.status + '</small>';
        meta.textContent = result.meta;
        formula.textContent = result.formula;
      };

      var controls = el('div', { class: 'cf-grid' }, [
        slider(state, 'a', config.a.label, config.a.min, config.a.max, config.a.step),
        slider(state, 'b', config.b.label, config.b.min, config.b.max, config.b.step)
      ]);
      var output = el('div', { class: 'cf-output' }, [status, resultMeter.root, meta, formula]);
      shell(host, config, controls, output);
      state._render();
    };
  }

  function makeReadiness(config) {
    return function (host) {
      var state = { knowledge: 55, practice: 35, evidence: 25 };
      var status = el('div', { class: 'cf-status', 'aria-live': 'polite' });
      var meta = el('div', { class: 'cf-meta' });
      var readiness = meterRow('路线准备度');

      state._render = function () {
        var score = Math.round(state.knowledge * config.weights[0] + state.practice * config.weights[1] + state.evidence * config.weights[2]);
        var stage = score >= 80 ? config.ready : score >= 60 ? config.near : config.build;
        readiness.update(score, score < 60);
        status.innerHTML = score + '%<small>' + stage + '</small>';
        meta.textContent = config.formula + '  ·  最薄弱的维度：' + [
          ['知识', state.knowledge], ['实践', state.practice], ['证据', state.evidence]
        ].sort(function (x, y) { return x[1] - y[1]; })[0][0];
      };

      var controls = el('div', { class: 'cf-grid' }, [
        slider(state, 'knowledge', config.labels[0], 0, 100, 1),
        slider(state, 'practice', config.labels[1], 0, 100, 1),
        slider(state, 'evidence', config.labels[2], 0, 100, 1)
      ]);
      var output = el('div', { class: 'cf-output' }, [status, readiness.root, meta]);
      shell(host, config, controls, output);
      state._render();
    };
  }

  function contextCache(host) {
    ensureStyles();
    var state = { mode: 'prefix' };
    var stage = el('div');
    state._render = function () {
      while (stage.firstChild) stage.removeChild(stage.firstChild);
      var name = state.mode === 'prefix' ? 'prompt-cache-hit' : 'semantic-cache';
      var figure = window.LESSON_FIGURES && window.LESSON_FIGURES[name];
      if (figure) figure(stage, {});
      labelControls(stage);
    };
    var controls = el('div', { class: 'cf-grid' }, [
      select(state, 'mode', '缓存机制', [['Provider 前缀缓存', 'prefix'], ['应用语义缓存', 'semantic']])
    ]);
    shell(host, {
      title: 'CONTEXT 缓存实验',
      hint: '切换机制，然后拖动控件',
      caption: '前缀缓存会跳过重复的 Prompt 计算。语义缓存会为相似查询复用之前的答案。前者精确且位于 Provider 端，后者近似且位于应用端，因此其阈值属于安全决策。'
    }, controls, el('div', { class: 'cf-output' }, [stage]));
    state._render();
  }

  var decisions = {
    '01-claude-model-fit': {
      title: 'MODEL 适配度计算器', hint: '更改延迟和推理需求',
      a: { label: '延迟压力', defaultValue: 65 }, b: { label: '推理复杂度', defaultValue: 55 },
      choices: [
        { name: 'Haiku', base: 60, a: 34, b: -28, why: '当延迟占主导且任务范围明确时，使用最快的层级。' },
        { name: 'Sonnet', base: 76, a: 4, b: 8, why: '当速度和推理都很重要时，使用均衡的层级。' },
        { name: 'Opus', base: 58, a: -24, b: 36, why: '只有当任务复杂度足以抵偿成本时，才使用推理能力最强的层级。' }
      ],
      formula: '适配度 = 基线 + 延迟系数 + 推理系数',
      caption: 'Model 选择取决于工作负载，而不是排行榜。调整约束，观察最佳适配项如何变化。'
    },
    '16-multi-agent-topology': {
      title: '编排拓扑', hint: '更改耦合度和并行度',
      a: { label: '任务耦合度', defaultValue: 55 }, b: { label: '并行工作量', defaultValue: 60 },
      choices: [
        { name: '单 Agent', base: 72, a: 22, b: -30, why: '当各步骤高度相互依赖时，保持单一 Context。' },
        { name: '监督者', base: 74, a: 5, b: 10, why: '当工作可以拆分，但决策仍需由一个负责人统筹时，使用监督者。' },
        { name: '对等 Agent 群', base: 55, a: -28, b: 36, why: '仅对具有明确合并契约的独立工作使用对等 Agent。' }
      ],
      formula: '拓扑适配度需要在依赖成本与可用并行度之间取得平衡',
      caption: '更多 Agent 会增加协调成本。只有当任务足够独立、能够安全合并时，并行处理才有帮助。'
    },
    '18-tool-discovery-contract': {
      title: 'TOOL 发现预算', hint: '更改 Tool 数量和歧义程度',
      a: { label: '可用 Tool', defaultValue: 45 }, b: { label: '请求歧义程度', defaultValue: 50 },
      choices: [
        { name: '全部公开', base: 70, a: -36, b: -12, why: '仅当注册表较小且意图明确时，才公开全部 Tool。' },
        { name: '渐进式发现', base: 78, a: 20, b: 16, why: '先展示一小组相关 Tool，仅在必要时扩展。' },
        { name: '固定工作流', base: 60, a: -8, b: 26, why: '当歧义程度较高但流程已知时，使用固定序列。' }
      ],
      formula: '随着无关 Tool 和模糊意图增加，选择质量会下降',
      caption: 'Model 无法从不受限制的 Tool 列表中做出良好选择。渐进式发现会在执行前缩小选择范围。'
    },
    '22-sla-value-tradeoff': {
      title: 'SLA 价值权衡', hint: '更改业务影响和可靠性需求',
      a: { label: '业务影响', defaultValue: 65 }, b: { label: '可靠性需求', defaultValue: 70 },
      choices: [
        { name: '辅助式工作流', base: 74, a: -12, b: -20, why: '当价值中等或不确定性仍然较高时，让人保持控制。' },
        { name: '受控自动化', base: 78, a: 8, b: 12, why: '通过可衡量的关卡和明确的回退机制自动化常规路径。' },
        { name: '确定性服务', base: 54, a: 20, b: 32, why: '当可靠性占主导时，将关键不变量移到 Model 之外。' }
      ],
      formula: '架构适配度 = 捕获的业务价值 - 故障暴露程度',
      caption: '最佳 AI 架构是仍能捕获预期价值的最小概率性范围。'
    },
    '23-architecture-tradeoff': {
      title: '架构选择', hint: '更改新鲜度和工作流复杂度',
      a: { label: '知识新鲜度', defaultValue: 70 }, b: { label: '工作流复杂度', defaultValue: 55 },
      choices: [
        { name: '仅 Prompt', base: 70, a: -28, b: -18, why: '对于稳定知识和范围明确的转换，仅使用 Prompt。' },
        { name: 'RAG 服务', base: 68, a: 36, b: -5, why: '当答案依赖不断变化或私有的知识时执行检索。' },
        { name: 'Agent 工作流', base: 58, a: 4, b: 38, why: '仅当系统必须选择操作并为其排序时，才添加 Agent。' }
      ],
      formula: '从能够满足新鲜度和操作需求的最简单架构开始',
      caption: 'Prompt、检索和 Agent 解决的是不同问题。只有当需求明确要求时，才应引入复杂度。'
    }
  };

  var thresholds = {
    '02-responsible-ai-risk': ['负责任的 AI 风险', 'Model 不确定性', '用户影响', ['允许', '人工审核', '阻止并升级'], ['低风险用途仍在政策范围内。', '审核者必须在发布前消除不确定性。', '高影响的不确定性越过了停止边界。']],
    '06-data-analysis-confidence': ['分析置信度', '证据缺口', '决策影响', ['附带说明发布', '验证来源', '停止分析'], ['证据支持范围明确的结论。', '重新计算或检索缺失的证据。', '不要将薄弱证据转化为确信的决策。']],
    '07-human-review-threshold': ['人工交接', 'Model 不确定性', '可逆性成本', ['自动完成', '请求审核', '升级给负责人'], ['该操作风险低且可逆。', '应由人工确认建议的操作。', '必须由承担责任的负责人做出决定。']],
    '11-mcp-permission-boundary': ['MCP 权限边界', '请求的权限', '资源敏感度', ['允许限定范围的调用', '需要审批', '拒绝请求'], ['该调用遵守最小权限契约。', '必须由人工批准扩大的范围。', '请求的能力超出了 Server 边界。']],
    '13-secrets-threat-model': ['SECRET 暴露风险', '暴露可能性', '凭证影响范围', ['安全继续', '轮换并调查', '控制事件'], ['没有 Secret 越过 Model 或日志边界。', '将潜在暴露视为安全事件信号。', '在执行其他任何操作之前撤销访问权限。']],
    '20-batch-review-confidence': ['批量审核关卡', '提取不确定性', '记录关键程度', ['接受批次', '抽样并审核', '隔离批次'], ['该批次达到了质量下限。', '发布前检查按风险加权的样本。', '在理解故障模式之前停止传播。']],
    '21-provenance-escalation': ['来源关卡', '缺乏支持的声明', '决策后果', ['引用来源后回答', '检索证据', '升级不确定性'], ['每项实质性声明都有可追溯的证据。', '系统必须检索或请求缺失的支持材料。', '后果过于严重，不能提供缺乏支持的答案。']],
    '27-governance-approval-flow': ['治理审批', '政策偏差', '受影响人群', ['标准发布', '风险审批', '管理层叫停'], ['常规控制措施足以覆盖此次发布。', '该偏差需要有记录的风险接受。', '该变更超出了授权权限。']]
  };

  var pipelines = {
    '03-prompt-contract': ['PROMPT 契约', '契约阶段', ['意图', '输入', '约束', '输出', '测试'], ['定义 Model 必须支持的决策。', '明确必需的 Context，并拒绝缺少字段的输入。', '说明边界、拒绝规则和不变量。', '声明下游代码使用的确切结构。', '运行正常、边界、对抗性和数据缺失场景。']],
    '05-document-vision-pipeline': ['文档与 VISION PIPELINE', 'Pipeline 阶段', ['摄取', '分段', '提取', '验证', '路由'], ['保留页面和图像标识。', '按照语义和视觉边界进行拆分。', '返回带有来源坐标的字段。', '检查 schema、总数和跨页一致性。', '将低置信度场景发送给正确的负责人。']],
    '08-messages-lifecycle': ['MESSAGES API 生命周期', '请求阶段', ['编排', '发送', '检查', '继续', '记录'], ['构建有序的角色、内容块和限制。', '提交一个明确的请求边界。', '读取停止原因、用量和返回的内容块。', '追加 Tool 结果或下一轮用户消息。', '持久化调试和成本分析所需的 Trace。']],
    '09-structured-output-recovery': ['结构化输出恢复', '恢复阶段', ['生成', '解析', '验证', '修复', '升级'], ['请求声明的 schema。', '将响应视为不可信的字节。', '检查类型、范围和业务不变量。', '使用确切的验证错误重试一次。', '返回类型化故障，而不是猜测。']],
    '12-agent-hook-lifecycle': ['AGENT HOOK 生命周期', 'Hook 阶段', ['启动', 'Tool 前', '执行', 'Tool 后', '停止'], ['创建 Trace 和政策 Context。', '在产生副作用之前对参数进行授权。', '运行范围受限的操作。', '记录输出、成本和已变更状态。', '关闭资源并发布最终结果。']],
    '14-eval-observability-loop': ['EVAL 与可观测性循环', '反馈阶段', ['Dataset', '运行', '评分', 'Trace', '改进'], ['对代表性案例和故障切片进行版本管理。', '执行确切的候选配置。', '衡量任务、安全性、延迟和成本。', '将聚合故障关联到单条 Trace。', '每次更改一个假设，然后重新运行同一组案例。']],
    '15-team-agent-loop': ['团队 AGENT 循环', '团队阶段', ['规划', '分配', '执行', '审核', '合并'], ['编写验收标准并明确责任归属。', '为每个 Agent 提供范围明确且互不重叠的工作区域。', '产出可检查的工作和验证证据。', '检查正确性、冲突和遗漏范围。', '仅在所有契约一致后进行集成。']],
    '19-memory-rule-precedence': ['MEMORY 与规则优先级', '解析阶段', ['当前请求', '仓库规则', '实时代码', '项目 Memory', '全局默认值'], ['在权限范围内，以最新的明确指令为准。', '应用距离最近且仍在维护的项目契约。', '根据当前实现验证行为。', '仅在检查是否发生漂移后使用持久 Context。', '最后才回退到通用偏好。']],
    '25-identity-permission-path': ['身份与权限路径', '授权阶段', ['认证', '解析行为者', '授权', '执行', '审计'], ['验证所提供的身份。', '绑定用户、租户和委托的服务身份。', '按照最小权限评估资源和操作。', '仅执行已授权的操作。', '记录行为者、决策、目标和结果。']],
    '28-adr-lifecycle': ['ADR 生命周期', '决策阶段', ['Context', '选项', '决策', '后果', '重新审视'], ['说明约束以及做出决策的原因。', '使用相同标准比较可行的替代方案。', '明确选定的方案和承担责任的负责人。', '记录收益、成本、风险和后续事项。', '当假设或指标发生变化时重新评估。']]
  };

  var figures = {
    '00-certification-route-map': makeReadiness({
      title: '认证路线准备度', hint: '评估证据，而不是信心', labels: ['考试知识', '限时练习', '已交付证据'], weights: [0.35, 0.3, 0.35],
      ready: '可以参加限时完整模拟考试', near: '弥补最薄弱的维度，然后重新测试', build: '返回课程并产出证据',
      formula: '35% 知识 + 30% 限时练习 + 35% 产物',
      caption: '准备度并不取决于你对考试蓝图有多熟悉，而取决于你能解释什么、能在时间压力下完成什么，以及能用产物证明什么。'
    }),
    '04-context-cache': contextCache,
    '10-tool-loop-budget': makeEquation({
      title: 'TOOL 循环预算', hint: '更改调用上限和成功率', meterLabel: '成功完成率',
      a: { label: 'Tool 最大调用次数', min: 1, max: 20, step: 1, defaultValue: 8 }, b: { label: '每次调用的成功率（%）', min: 10, max: 95, step: 1, defaultValue: 65 },
      calculate: function (calls, success) { var p = 1 - Math.pow(1 - success / 100, calls); return { value: (p * 100).toFixed(1) + '%', status: calls > 12 ? '完成率会上升，但失控循环的暴露风险现在很高。' : '限制循环范围，并检查每个停止原因。', percent: p * 100, warning: calls > 12, meta: '最多 ' + calls + ' 次调用  ·  每次调用有 ' + success + '% 的概率推进任务', formula: 'P(至少一次成功) = 1 - (1 - p)^calls' }; },
      caption: 'Tool 循环需要明确的调用预算、终止条件和类型化故障。增加重试可以提高完成率，但也会增加延迟、成本和副作用风险。'
    }),
    '17-session-context-budget': makeEquation({
      title: 'SESSION CONTEXT 预算', hint: '更改历史记录和压缩比例', meterLabel: '已使用的 Context',
      a: { label: '原始历史 Token', min: 1000, max: 200000, step: 1000, defaultValue: 80000 }, b: { label: '压缩后保留比例（%）', min: 5, max: 100, step: 1, defaultValue: 35 },
      calculate: function (tokens, retained) { var used = Math.round(tokens * retained / 100); var pct = used / 100000 * 100; return { value: used.toLocaleString('en-US') + ' Token', status: pct > 80 ? '继续之前再次压缩，或按需检索。' : 'Session 保留决策，同时为新工作留出空间。', percent: pct, warning: pct > 80, meta: tokens.toLocaleString('en-US') + ' 个原始 Token  ·  压缩后保留 ' + retained + '%', formula: '活跃 Context = 历史 Token × 保留比例' }; },
      caption: 'Session Memory 应保留决策、约束和未解决状态，而不是重放每个 Token。压缩是一个信息设计问题。'
    }),
    '24-rag-ranking': makeEquation({
      title: 'RAG 排名阈值', hint: '更改相关性和证据覆盖率', meterLabel: '答案支持度',
      a: { label: '检索相关性（%）', min: 0, max: 100, step: 1, defaultValue: 72 }, b: { label: '证据覆盖率（%）', min: 0, max: 100, step: 1, defaultValue: 68 },
      calculate: function (relevance, coverage) { var support = relevance * 0.55 + coverage * 0.45; return { value: Math.round(support) + '% 支持度', status: support >= 75 ? '生成带有引用的答案，并保留排序后的证据。' : support >= 55 ? '再次检索或缩小问题范围。' : '拒绝回答，因为语料库不足以支持答案。', percent: support, warning: support < 55, meta: relevance + '% 相关性  ·  ' + coverage + '% 声明覆盖率', formula: '支持度 = 0.55 × 相关性 + 0.45 × 证据覆盖率' }; },
      caption: '检索质量不仅取决于最近邻相似度。选定的证据还必须覆盖答案准备提出的声明。'
    }),
    '26-latency-cost-slo': makeEquation({
      title: '延迟与成本 SLO', hint: '更改缓存命中率和 Model 延迟', meterLabel: '已使用的延迟预算',
      a: { label: '缓存命中率（%）', min: 0, max: 100, step: 1, defaultValue: 60 }, b: { label: '未缓存延迟（ms）', min: 200, max: 6000, step: 100, defaultValue: 2400 },
      calculate: function (hit, latency) { var effective = hit / 100 * 80 + (1 - hit / 100) * latency; var pct = effective / 2000 * 100; return { value: Math.round(effective) + ' ms', status: effective <= 2000 ? '混合路径达到了 2 秒目标。' : '减少 Model 工作量、提高安全缓存命中率，或更改 SLO。', percent: pct, warning: effective > 2000, meta: hit + '% 的命中耗时 80 ms  ·  未命中耗时 ' + latency + ' ms', formula: '混合延迟 = 命中率 × 80 ms + 未命中率 × 未缓存延迟' }; },
      caption: '平均值会掩盖架构。必须将 Model 延迟、缓存行为和允许的服务目标作为一个系统进行衡量。'
    })
  };

  Object.keys(decisions).forEach(function (id) { figures[id] = makeDecision(decisions[id]); });
  Object.keys(thresholds).forEach(function (id) {
    var item = thresholds[id];
    figures[id] = makeThreshold({
      title: item[0], hint: '调整风险和阈值', signal: { label: item[1], defaultValue: 45 }, impact: { label: item[2], defaultValue: 60 },
      cut: 50, signalWeight: 0.55, escalationBand: 20, decisions: item[3], reasons: item[4],
      scoreLabel: '综合决策分数', thresholdLabel: '审核阈值', formula: '分数 = 55% 信号 + 45% 影响；阈值决定控制路径',
      caption: '可靠的系统会将不确定性和后果转化为明确的控制路径。调整审核阈值会改变自动化政策，而不会改变 Model 给出的事实。'
    });
  });
  Object.keys(pipelines).forEach(function (id) {
    var item = pipelines[id];
    figures[id] = makePipeline({
      title: item[0], hint: '拖动并逐步查看该机制', controlLabel: item[1],
      steps: item[2].map(function (name, index) { return { name: name, short: item[3][index], detail: item[3][index] }; }),
      formula: '每个已验证阶段都会成为下一阶段的契约',
      caption: '逐步推进各个阶段，并检查每个边界上的契约。可靠性来自明确的状态转换，而不是寄希望于一个冗长的 Prompt 能处理整个工作流。'
    });
  });

  [
    ['29-associate-capstone-readiness', 'ASSOCIATE CAPSTONE', ['工作流决策', '场景练习', '交接证据'], [0.35, 0.35, 0.3]],
    ['30-developer-capstone-readiness', 'DEVELOPER CAPSTONE', ['API 机制', '经过测试的实现', '运维资料包'], [0.3, 0.4, 0.3]],
    ['31-architect-foundation-readiness', 'ARCHITECT FOUNDATIONS CAPSTONE', ['模式选择', '权衡练习', '架构资料包'], [0.35, 0.3, 0.35]],
    ['32-architect-professional-readiness', 'ARCHITECT PROFESSIONAL CAPSTONE', ['系统判断力', '故障演练', '治理证据'], [0.3, 0.35, 0.35]]
  ].forEach(function (item) {
    figures[item[0]] = makeReadiness({
      title: item[1], hint: '衡量你能够证明的内容', labels: item[2], weights: item[3],
      ready: 'Capstone 证据已经可以接受 rubric 审核', near: '修复最薄弱的证据，然后重新运行验证器', build: '在宣称准备就绪之前完成缺失的产物',
      formula: Math.round(item[3][0] * 100) + '% 知识 + ' + Math.round(item[3][1] * 100) + '% 实践 + ' + Math.round(item[3][2] * 100) + '% 证据',
      caption: '当另一位工程师无需重新推断你的意图，就能检查决策、运行验证器并操作结果时，Capstone 才算完成。'
    });
  });

  LF.register(figures);
})();
