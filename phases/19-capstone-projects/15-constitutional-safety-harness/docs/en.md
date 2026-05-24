# 综合项目 15 — Constitutional Safety Harness + Red-Team Range

> Anthropic 的 Constitutional Classifiers、Meta 的 Llama Guard 4、Google 的 ShieldGemma-2、NVIDIA 的 Nemotron 3 Content Safety，以及用于 Multilingual 覆盖的 X-Guard，共同定义了 2026 年的 safety-classifier stack。garak、PyRIT、NVIDIA Aegis 和 promptfoo 成为标准的 adversarial evaluation 工具。NeMo Guardrails v0.12 将它们接入 production pipeline。这个 capstone 会把所有内容连接起来：围绕目标 app 构建 layered safety harness，运行覆盖 6+ 攻击家族的 autonomous red-team agent，并执行一次 constitutional self-critique run，产出可衡量的 harmlessness delta。

**类型：** Capstone
**语言：** Python（safety pipeline、red team）、YAML（policy configs）
**先修要求：** Phase 10（从零构建 LLMs）、Phase 11（LLM engineering）、Phase 13（tools）、Phase 14（agents）、Phase 18（ethics、safety、alignment）
**涉及阶段：** P10 · P11 · P13 · P14 · P18
**时间：** 25 小时

## 问题

2026 年 LLM safety 的前沿问题，不在于 classifier 是否有效（大体上有效），而在于如何围绕 production app 正确组合它们，既不过度拒答，也不留下明显漏洞。Llama Guard 4 处理英文 policy violations。X-Guard（132 种语言）处理 Multilingual jailbreak。ShieldGemma-2 捕获基于图像的 prompt injection。NVIDIA Nemotron 3 Content Safety 覆盖 enterprise categories。Anthropic 的 Constitutional Classifiers 是一种独立方法，用于 training 阶段而不是 serving 阶段。

攻击演化同样重要。PAIR 和 TAP 自动化发现 jailbreak。GCG 运行基于 Gradient 的 suffix attacks。Multi-turn 和 code-switch attacks 利用 agent memory。任何已部署的 LLM 都需要一个 red-team range，garak 和 PyRIT 是 canonical drivers，并且还需要记录 mitigations 和按 CVSS 评分的 findings。

你将加固一个目标 application（一个 8B instruction-tuned model，或其他 capstones 中的一个 RAG chatbot），对其运行 6+ 攻击家族，并产出 before/after harmlessness measurement。

## 概念

safety pipeline 有五层。**Input sanitize**：移除 zero-width chars，解码 base64/rot13，规范化 Unicode。**Policy layer**：NeMo Guardrails v0.12 rails（off-domain、toxicity、PII extraction）。**Classifier gate**：输入侧使用 Llama Guard 4，非英文使用 X-Guard，图像输入使用 ShieldGemma-2。**Model**：目标 LLM。**Output filter**：输出侧使用 Llama Guard 4，Presidio PII scrub，并在适用场景执行 citation enforcement。**HITL tier**：被标记为 high-risk 的输出进入 Slack queue。

red-team range 按 scheduler 运行。PAIR 和 TAP 自主发现 jailbreak。GCG 运行基于 Gradient 的 suffix attacks。ASCII / base64 / rot13 encoding attacks。Multi-turn attacks（persona adoption、memory exploitation）。Code-switch attacks（混合英语与 Swahili 或 Thai）。每次运行都会产出一个结构化 findings file，包含 CVSS scoring 和 disclosure timeline。

constitutional-self-critique run 是 training-time intervention。取 1k 个 harmful-attempt prompts，让 model 起草响应，根据书面 constitution（do-not-harm rules）进行 critique，并在 critique loop 上 retrain。在 held-out eval 上测量 before/after harmlessness delta。

## 架构

```
request (text / image / multilingual)
      |
      v
input sanitize (strip zero-width, decode, normalize)
      |
      v
NeMo Guardrails v0.12 rails (off-domain, policy)
      |
      v
classifier gate:
  Llama Guard 4 (English)
  X-Guard (multilingual, 132 langs)
  ShieldGemma-2 (image prompts)
  Nemotron 3 Content Safety (enterprise)
      |
      v (allowed)
target LLM
      |
      v
output filter: Llama Guard 4 + Presidio PII + citation check
      |
      v
HITL tier for flagged outputs

parallel:
  red-team scheduler
    -> garak (classic attacks)
    -> PyRIT (orchestrated red team)
    -> autonomous jailbreak agent (PAIR + TAP)
    -> GCG suffix attacks
    -> multilingual / code-switch
    -> multi-turn persona adoption

output: CVSS-scored findings + disclosure timeline + before/after harmlessness delta
```

## 技术栈

- Safety classifiers：Llama Guard 4、ShieldGemma-2、NVIDIA Nemotron 3 Content Safety、X-Guard
- Guardrail framework：NeMo Guardrails v0.12 + OPA
- Red-team drivers：garak（NVIDIA）、PyRIT（Microsoft Azure）、NVIDIA Aegis、promptfoo
- Jailbreak agents：PAIR（Chao et al., 2023）、Tree-of-Attacks（TAP）、GCG suffix
- Constitutional training：Anthropic-style self-critique loop + SFT on critiques
- PII scrub：Presidio
- Target：一个 8B instruction-tuned model，或其他 capstones 中的一个 RAG chatbot

## 构建它

1. **目标设置。** 在 vLLM 上启动一个 8B instruction-tuned model（或复用另一个 capstone 中的 RAG chatbot）。这是被测 app。

2. **包装 safety pipeline。** 围绕目标接入五层 pipeline。验证每一层都可单独观测（Langfuse 中每层一个 span）。

3. **Classifier 覆盖。** 加载 Llama Guard 4、X-Guard（Multilingual）、ShieldGemma-2（image）。在一个小型 labeled set 上运行每个 classifier，以建立 baselines。

4. **Red-team scheduler。** 调度 garak、PyRIT、一个 PAIR agent、一个 TAP agent、一个 GCG runner、一个 multi-turn attacker 和一个 code-switch attacker。每个都在单独 queue 上运行。

5. **Attack suite。** 六个攻击家族：(1) PAIR automated jailbreak，(2) TAP tree-of-attacks，(3) GCG gradient suffix，(4) ASCII / base64 / rot13 encoding，(5) multi-turn persona，(6) multilingual code-switch。报告每个家族的 success rate。

6. **Constitutional self-critique。** 筛选 1k 个 harmful-attempt prompts。对于每个 prompt，目标先起草响应。一个 critic LLM 根据书面 constitution（“do no harm”、“cite evidence”、“refuse illegal requests”）评分。critic 提出异议的 prompts 会被重写；目标在 critique-improved pairs 上 fine-tune。在 held-out eval 上测量 before/after harmlessness。

7. **Over-refusal measurement。** 在 benign prompt suite（例如 XSTest）上跟踪 false-positive rate。目标必须在 benign questions 上保持 helpful。

8. **CVSS scoring。** 对每个成功的 jailbreak，按 CVSS 4.0 评分（attack vector、complexity、impact）。产出 disclosure timeline 和 mitigation plan。

9. **Range automation。** 以上所有内容都在 cron 上运行；findings 写入 queue；over-refusal regression alerts 发送到 Slack。

## 使用它

```
$ safety probe --model=target --family=PAIR --budget=50
[attacker]   PAIR agent running on target
[attack]     attempt 1/50: disguise query as academic research ... blocked
[attack]     attempt 2/50: appeal to roleplay ... blocked
[attack]     attempt 3/50: chain-of-thought coax ... SUCCEEDED
[finding]    CVSS 4.8 medium: roleplay bypass on target
[range]      7 successes out of 50 (14% success rate)
```

## 交付它

`outputs/skill-safety-harness.md` 是交付物。一个 production-grade layered safety pipeline，加上可复现的 red-team range，并包含 before/after harmlessness deltas。

| 权重 | 标准 | 如何测量 |
|:-:|---|---|
| 25 | Attack-surface coverage | 覆盖 6+ 攻击家族、2+ 种语言 |
| 20 | True-positive / false-positive trade-off | Attack block rate vs XSTest benign pass rate |
| 20 | Self-critique delta | held-out eval 上的 before/after harmlessness |
| 20 | Documentation and disclosure | 带 timeline 的 CVSS-scored findings |
| 15 | Automation and repeatability | 所有内容在 cron 上运行并带 alerts |
| **100** | | |

## 练习

1. 在 RAG chatbot 上运行 garak 的 prompt-injection plugin，并比较有无 output-filter layer 时的 attack success rate。

2. 添加第七个攻击家族：通过 retrieved documents 的 indirect prompt injection。测量所需的额外防御。

3. 实现一个 “refuse-with-help” 模式：当 guardrail 阻断时，目标提供一个更安全的相关答案，而不是直接拒绝。测量 XSTest delta。

4. Multilingual coverage gap：找出一种 X-Guard 表现不足的语言。提出一个面向它的 fine-tune dataset。

5. 在 30B model 上运行 constitutional self-critique，并测量 delta 是否随规模提升。

## 关键术语

| 术语 | 常见说法 | 实际含义 |
|------|-----------------|------------------------|
| Layered safety | “Defense in depth” | 在 input、gate、output、HITL 多处设置 guardrails |
| Llama Guard 4 | “Meta's safety classifier” | 2026 年参考级 input/output content classifier |
| PAIR | “Jailbreak agent” | 关于 LLM-driven jailbreak discovery 的论文（Chao et al.） |
| TAP | “Tree-of-Attacks” | PAIR 的 tree-search 变体 |
| GCG | “Greedy coordinate gradient” | 基于 Gradient 的 adversarial suffix attack |
| Constitutional self-critique | “Anthropic-style training” | Target drafts -> critic scores -> rewrite -> retrain |
| XSTest | “Benign probe set” | 用于 over-refusal regression 的 benchmark |
| CVSS 4.0 | “Severity score” | safety findings 的标准 vulnerability scoring |

## 延伸阅读

- [Anthropic Constitutional Classifiers](https://www.anthropic.com/research/constitutional-classifiers) — training-time reference
- [Meta Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/) — 2026 年 input/output classifier
- [Google ShieldGemma-2](https://huggingface.co/google/shieldgemma-2b) — image + Multimodal safety
- [NVIDIA Nemotron 3 Content Safety](https://developer.nvidia.com/blog/building-nvidia-nemotron-3-agents-for-reasoning-multimodal-rag-voice-and-safety/) — enterprise reference
- [X-Guard (arXiv:2504.08848)](https://arxiv.org/abs/2504.08848) — 132-language Multilingual safety
- [garak](https://github.com/NVIDIA/garak) — NVIDIA red-team toolkit
- [PyRIT](https://github.com/Azure/PyRIT) — Microsoft red-team framework
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) — rail framework
- [PAIR (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) — jailbreak agent paper
