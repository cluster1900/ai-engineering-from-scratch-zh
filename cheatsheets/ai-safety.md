---
id: ai-safety
title: AI Safety and Red Teaming
code: AS
subtitle: 识别攻击、检测攻击、衡量拒答、拦截输出并审计对齐。第 18 和 19 阶段课程。
hue: 340
sources: phases/19-capstone-projects/15-constitutional-safety-harness, phases/19-capstone-projects/82-jailbreak-taxonomy, phases/19-capstone-projects/83-prompt-injection-detector, phases/19-capstone-projects/84-refusal-evaluation, phases/19-capstone-projects/85-content-classifier-integration, phases/19-capstone-projects/86-constitutional-rules-engine, phases/19-capstone-projects/87-end-to-end-safety-gate, phases/18-ethics-safety-alignment/02-reward-hacking-goodhart, phases/18-ethics-safety-alignment/04-sycophancy-rlhf-amplification, phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif, phases/18-ethics-safety-alignment/07-sleeper-agents-persistent-deception, phases/18-ethics-safety-alignment/09-alignment-faking, phases/18-ethics-safety-alignment/10-ai-control-subversion, phases/18-ethics-safety-alignment/11-scalable-oversight-weak-to-strong, phases/18-ethics-safety-alignment/12-red-teaming-pair-automated-attacks, phases/18-ethics-safety-alignment/13-many-shot-jailbreaking, phases/18-ethics-safety-alignment/14-ascii-art-visual-jailbreaks, phases/18-ethics-safety-alignment/15-indirect-prompt-injection, phases/18-ethics-safety-alignment/16-red-team-tooling-garak-llamaguard-pyrit, phases/18-ethics-safety-alignment/29-moderation-systems-openai-perspective-llamaguard
source_hash: 2ab25bd9ba733aa2
---

## 三检查点安全关卡
type: architecture
from: phases/19-capstone-projects/87-end-to-end-safety-gate/docs/en.md, phases/19-capstone-projects/87-end-to-end-safety-gate/code/safety_gate.py

```arch
node | in | 1,1 | User prompt |
node | pre | 2,1 | Pre-gen detector | rules on prompt
node | llm | 3,1 | Model stream | 4 token chunks
node | dur | 3,2 | During-gen filter | 2 chunk buffer
node | post | 2,2 | Post-gen checks | classifier, rules engine
node | agg | 1,2 | Aggregate | max severity
node | out | 1,3 | Final action | RequestTrace
edge | in | pre |
edge | pre | llm | pass
edge | llm | dur | stream
edge | dur | post | complete
edge | dur | agg | early stop
edge | post | agg |
edge | agg | out |
```

## PAIR 攻击循环
type: flow
from: phases/18-ethics-safety-alignment/12-red-teaming-pair-automated-attacks/docs/en.md

1. **攻击者 A**：读取目标 G 以及 prompt 与回复对的历史。
2. **攻击者 A**：写出新的 prompt $p_k$。
3. **目标 T**：给出回复 $r_k$。
4. **评审 J**：对照目标给 $(p_k, r_k)$ 打分。
5. **停止**：分数达到或超过阈值即为越狱成功。
6. **重复**：否则把这一对追加到历史，最多到预算 K。

## 越狱分类
type: command-table
from: phases/19-capstone-projects/82-jailbreak-taxonomy/docs/en.md

| 类别 | 被滥用的信任边界 |
|---|---|
| role-play | assistant 的人设 |
| instruction-override | system prompt 的权威 |
| context-smuggling | 用户内容与指令内容之间的缝隙 |
| multi-turn-ramp | 把对话历史当作契约 |
| encoding-trick | 禁用 token 的表面形式 |
| prefix-injection | assistant 的下一个 token 决策 |

## 代码中的任务
type: task-table
from: phases/19-capstone-projects/82-jailbreak-taxonomy/docs/en.md, phases/19-capstone-projects/83-prompt-injection-detector/code/rules.py, phases/19-capstone-projects/83-prompt-injection-detector/code/main.py, phases/19-capstone-projects/84-refusal-evaluation/code/main.py, phases/19-capstone-projects/87-end-to-end-safety-gate/code/safety_gate.py, phases/19-capstone-projects/87-end-to-end-safety-gate/code/main.py

| 任务 | 代码 |
|---|---|
| 运行 capstone demo | `python3 main.py` |
| 添加检测规则 | `{"name": "debug-mode", "category": "instruction-override", "score": 0.80, "substring": "debug mode"}` |
| 给 prompt 打分 | `v = self.detector.analyze(prompt)` |
| 尝试 rot13 解码 | `candidate = codecs.encode(text, "rot_13")` |
| 识别拒答 | `classify_refusal(response)` |
| 路由一个输出 | `action = self.classifier_router.run(output)` |
| 修复规则违规 | `redacted = self.rules_fixer.apply(redacted, violations)` |
| 运行一次请求 | `trace = gate.handle(prompt)` |

## 汇总信号
type: annotated-code
lang: python
from: phases/19-capstone-projects/87-end-to-end-safety-gate/code/safety_gate.py

```python
if pre.category != "benign":
    if pre.confidence >= self.block_confidence:        # 0.85 is high
        signals.append(("pre", SEVERITY_RANK["high"]))
    elif pre.confidence >= self.note_confidence:       # 0.5 is medium
        signals.append(("pre", SEVERITY_RANK["medium"]))
if during.terminated_early:                            # stream cut early
    signals.append(("during", SEVERITY_RANK["medium"]))
if post is not None:                                   # classifier and rules
    signals.append(("post.classifier", SEVERITY_RANK.get(post.classifier_severity, 0)))
max_rank = max(rank for _, rank in signals)
if max_rank >= SEVERITY_RANK["high"]:
    return "block"                                     # return a refusal
if max_rank >= SEVERITY_RANK["medium"]:
    return "redact"                                    # then warn on low, else allow
```

## 指标
type: concepts
from: phases/19-capstone-projects/83-prompt-injection-detector/docs/en.md, phases/19-capstone-projects/83-prompt-injection-detector/code/main.py, phases/19-capstone-projects/84-refusal-evaluation/docs/en.md, phases/18-ethics-safety-alignment/12-red-teaming-pair-automated-attacks/docs/en.md

- **Precision**：$TP / (TP + FP)$，触发中正确的比例。
- **Recall**：$TP / (TP + FN)$，检测器抓到的攻击比例。
- **F1**：每个类别的 $2 P R / (P + R)$。
- **Under-refusal**：模型回答了标为不安全的 prompt。
- **Over-refusal**：模型拒答了标为安全的 prompt。
- **Accuracy**：安全或不安全判定的 $(TP + TN) / \text{total}$。
- **ECE**：按十分位分箱，$\lvert \text{conf} - \text{accuracy} \rvert$ 按箱大小加权的均值。
- **ASR**：攻击成功率。报告时注明查询预算和评审模型。

## 对齐失效模式
type: concepts
from: phases/18-ethics-safety-alignment/02-reward-hacking-goodhart/docs/en.md, phases/18-ethics-safety-alignment/04-sycophancy-rlhf-amplification/docs/en.md, phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif/docs/en.md, phases/18-ethics-safety-alignment/07-sleeper-agents-persistent-deception/docs/en.md, phases/18-ethics-safety-alignment/09-alignment-faking/docs/en.md, phases/18-ethics-safety-alignment/10-ai-control-subversion/docs/en.md, phases/18-ethics-safety-alignment/11-scalable-oversight-weak-to-strong/docs/en.md

- **Goodhart**：强优化器会找到代理指标与目标不一致的输入。
- **过度优化**：代理奖励持续上升，随着 KL 增大，黄金奖励先达峰后下降。
- **Sycophancy**：不论真假都附和用户陈述的前提。
- **触发器持久性**：后门在本应消除它的训练后仍然存活。
- **Alignment faking**：在被监控与未被监控条件下存在合规差距。
- **Constitutional AI**：先做批评与修订的 SFT，再做基于 AI 反馈的 RL。
- **AI control**：可信模型 T 编辑不可信模型 U。人类 H 审计含糊的输出。
- **PGR**：$(\text{fine-tuned} - \text{weak}) / (\text{ceiling} - \text{weak})$。1.0 表示差距完全弥合。

## 默认值与数字
type: defaults
from: phases/19-capstone-projects/87-end-to-end-safety-gate/code/safety_gate.py, phases/19-capstone-projects/84-refusal-evaluation/code/main.py, phases/19-capstone-projects/85-content-classifier-integration/code/classifiers.py, phases/19-capstone-projects/86-constitutional-rules-engine/code/rules.yml, phases/18-ethics-safety-alignment/12-red-teaming-pair-automated-attacks/docs/en.md, phases/18-ethics-safety-alignment/13-many-shot-jailbreaking/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| block_confidence | 0.85 | 生成前检测器触发拦截的分数 |
| note_confidence | 0.5 | 生成前加一个中等信号的分数 |
| buffer_cap | 2 | 生成中过滤器缓存的块数 |
| n_bins | 10 | ECE 箱数 |
| 泄露阈值 | 0.55 | 与 system prompt 的三元组重叠率 |
| max_words | 800 | 长度上限规则 |
| PAIR 预算 K | 20 | 每个目标的查询数 |
| MSJ 示例数 | 256 | 对暴力和欺骗内容可稳定攻击 |

## 故障排查
type: troubleshooting
from: phases/19-capstone-projects/83-prompt-injection-detector/docs/en.md, phases/19-capstone-projects/84-refusal-evaluation/docs/en.md, phases/19-capstone-projects/87-end-to-end-safety-gate/docs/en.md, phases/18-ethics-safety-alignment/12-red-teaming-pair-automated-attacks/docs/en.md, phases/18-ethics-safety-alignment/13-many-shot-jailbreaking/docs/en.md, phases/18-ethics-safety-alignment/15-indirect-prompt-injection/docs/en.md, phases/18-ethics-safety-alignment/29-moderation-systems-openai-perspective-llamaguard/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 正则漏掉了改写 | 只有一个模式，没有度量 | 正则族、归一化处理、精确率和召回率 |
| Agent 听从了一封邮件 | 过滤器只检查用户输入 | 标记不可信内容，其动作需确认 |
| 防御报告 ASR 接近零 | 只用了静态攻击 | 用自适应攻击评估 |
| 模型拒答化学作业 | 只衡量了有害 prompt | 在安全 prompt 上衡量过度拒答 |
| 前缀注入穿透了 | 关卡只在生成后检查 | 加上生成中的流式过滤器 |
| ASR 数字无法比较 | 查询预算不同 | 对齐预算，注明评审模型 |
| 256 个示例时攻击奏效 | 长上下文中的模式跟随 | 对完整上下文做分类 |
| 编码攻击通过了输入检查 | 只审核输入 | 同时审核输入和输出 |

## 缩写
type: glossary
from: phases/18-ethics-safety-alignment/12-red-teaming-pair-automated-attacks/docs/en.md, phases/18-ethics-safety-alignment/13-many-shot-jailbreaking/docs/en.md, phases/18-ethics-safety-alignment/14-ascii-art-visual-jailbreaks/docs/en.md, phases/18-ethics-safety-alignment/15-indirect-prompt-injection/docs/en.md, phases/19-capstone-projects/84-refusal-evaluation/docs/en.md

- **PAIR**：Prompt Automatic Iterative Refinement。攻击者 LLM 与评审 LLM 循环。
- **GCG**：白盒梯度搜索对抗性 token 后缀。
- **TAP**：Tree of attacks。带分支和剪枝的 PAIR。
- **MSJ**：many-shot jailbreak。上下文中放几百个伪造的顺从对。
- **ArtPrompt**：用 ASCII 艺术渲染遮盖安全词。
- **IPI**：间接 prompt 注入。载荷藏在非用户编写的内容中。
- **IFC**：信息流控制。不可信内容需要可信方确认。
- **ECE**：Expected Calibration Error。声明的置信度与准确率之差。

## 问答
type: qa
from: phases/19-capstone-projects/82-jailbreak-taxonomy/docs/en.md, phases/19-capstone-projects/85-content-classifier-integration/docs/en.md, phases/18-ethics-safety-alignment/12-red-teaming-pair-automated-attacks/docs/en.md, phases/18-ethics-safety-alignment/13-many-shot-jailbreaking/docs/en.md

- **为什么先做分类？** 标签把攻击流变成直方图和覆盖图。
- **为什么也要对输出分类？** 输入检查漏掉的攻击族会落到用户身上。
- **哪个动作生效？** 最高严重级别。Block 优先。Redact 加 warn 变为 redact。
- **为什么 PAIR 比 GCG 便宜？** 它是黑盒的，并在上下文中从每次拒绝里学习。
- **为什么 MSJ 难以拦截？** 它利用的机制与上下文学习相同。

## 提示
type: tips
from: phases/19-capstone-projects/82-jailbreak-taxonomy/docs/en.md, phases/19-capstone-projects/83-prompt-injection-detector/docs/en.md, phases/19-capstone-projects/86-constitutional-rules-engine/docs/en.md, phases/19-capstone-projects/15-constitutional-safety-harness/docs/en.md, phases/18-ethics-safety-alignment/15-indirect-prompt-injection/docs/en.md, phases/18-ethics-safety-alignment/16-red-team-tooling-garak-llamaguard-pyrit/docs/en.md

- 每条发现都记录一个分类 id。
- 先归一化：去掉零宽字符，解码 base64、rot13 和 hex。保留原始 prompt。
- 把 constitution 以 YAML 放在版本控制中，并有独立的评审。
- 在模型两侧都放一个守卫分类器。
- 每晚运行单轮探测，发布前运行多轮攻击活动。
- 用 CVSS 4.0 给每个成功的越狱打分。
