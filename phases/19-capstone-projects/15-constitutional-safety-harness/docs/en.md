# 综合项目 15 — Constitutional Safety Harness + Red-Team Range

> Anthropic 的 Constitutional Classifiers、Meta 的 Llama Guard 4、Google 的 ShieldGemma-2、NVIDIA 的 Nemotron 3 Content Safety，以及用于 Multilingual 覆盖的 X-Guard，共同定义了 2026 年的 safety-classifier 技术栈。garak、PyRIT、NVIDIA Aegis 和 promptfoo 已成为标准的对抗性 Evaluation Tool。NeMo Guardrails v0.12 将它们连接到生产 pipeline 中。本综合项目会将所有这些组件组合起来：围绕 target app 构建分层 safety harness，运行一个覆盖 6 种以上攻击类别的自主 red-team Agent，并执行一次能够产生可测量 harmlessness 变化量的 constitutional self-critique。

**Type:** 综合项目
**Languages:** Python（safety pipeline、red team）、YAML（policy config）
**Prerequisites:** Phase 10（从零构建 LLM）、Phase 11（LLM engineering）、Phase 13（Tool）、Phase 14（Agent）、Phase 18（伦理、安全、alignment）
**Phases exercised:** P10 · P11 · P13 · P14 · P18
**Time:** 25 小时

## 问题

2026 年 LLM safety 的前沿问题并不是 classifier 是否有效（它们大致有效），而是如何围绕生产 app 正确组合它们，同时避免过度拒绝或留下明显漏洞。Llama Guard 4 处理英文 policy violation。X-Guard（支持 132 种语言）处理 Multilingual jailbreak。ShieldGemma-2 检测基于图像的 Prompt injection。NVIDIA Nemotron 3 Content Safety 覆盖企业类别。Anthropic 的 Constitutional Classifiers 则采用另一种方法，在 Training 阶段而不是 serving 阶段使用。

攻击手段的演化同样重要。PAIR 和 TAP 可自动发现 jailbreak。GCG 执行基于 Gradient 的 suffix attack。Multi-turn 和 code-switch attack 会利用 Agent memory。任何已部署的 LLM 都需要一个 red-team range——garak 和 PyRIT 是标准驱动器——并配套记录完善的缓解措施和经过 CVSS 评分的发现。

你将加固一个 target application（可以是 8B instruction-tuned Model，也可以是其他综合项目中的某个 RAG chatbot），针对它运行 6 种以上攻击类别，并生成一份加固前后的 harmlessness 测量结果。

## 概念

safety pipeline 分为五层。**输入清理**：去除 zero-width character、解码 base64/rot13、规范化 Unicode。**Policy layer**：NeMo Guardrails v0.12 rail（off-domain、toxicity、PII extraction）。**Classifier gate**：使用 Llama Guard 4 检查输入，使用 X-Guard 检查非英文内容，使用 ShieldGemma-2 检查图像输入。**Model**：target LLM。**输出过滤器**：使用 Llama Guard 4 检查输出、使用 Presidio 清理 PII，并在适用场景中强制要求 citation。**HITL 层级**：标记为高风险的输出会进入 Slack queue。

red-team range 根据 scheduler 运行。PAIR 和 TAP 自动发现 jailbreak。GCG 执行基于 Gradient 的 suffix attack。还包括 ASCII / base64 / rot13 encoding attack、Multi-turn attack（persona adoption、memory exploitation）和 code-switch attack（混合使用英文与 Swahili 或 Thai）。每次运行都会生成包含 CVSS 评分和 disclosure timeline 的结构化 findings file。

constitutional-self-critique 运行属于 Training 阶段的干预。选取 1,000 个 harmful-attempt Prompt，让 Model 起草响应，再根据书面 constitution（do-not-harm 规则）进行批判，并使用 critique loop 进行重新 Training。在 held-out Evaluation 上测量干预前后的 harmlessness 变化量。

## 架构

```
请求（文本 / 图像 / Multilingual）
      |
      v
输入清理（去除 zero-width character、解码、规范化）
      |
      v
NeMo Guardrails v0.12 rail（off-domain、policy）
      |
      v
classifier gate：
  Llama Guard 4（英文）
  X-Guard（Multilingual，132 种语言）
  ShieldGemma-2（图像 Prompt）
  Nemotron 3 Content Safety（企业场景）
      |
      v（允许）
target LLM
      |
      v
输出过滤器：Llama Guard 4 + Presidio PII + citation check
      |
      v
为标记的输出提供 HITL 层级

并行运行：
  red-team scheduler
    -> garak（经典攻击）
    -> PyRIT（编排式 red team）
    -> 自主 jailbreak Agent（PAIR + TAP）
    -> GCG suffix attack
    -> Multilingual / code-switch
    -> Multi-turn persona adoption

输出：CVSS 评分的 findings + disclosure timeline + 前后 harmlessness 变化量
```

## 技术栈

- Safety classifier：Llama Guard 4、ShieldGemma-2、NVIDIA Nemotron 3 Content Safety、X-Guard
- Guardrail framework：NeMo Guardrails v0.12 + OPA
- Red-team driver：garak（NVIDIA）、PyRIT（Microsoft Azure）、NVIDIA Aegis、promptfoo
- Jailbreak Agent：PAIR（Chao et al., 2023）、Tree-of-Attacks（TAP）、GCG suffix
- Constitutional Training：Anthropic 风格的 self-critique loop + 基于 critique 的 SFT
- PII 清理：Presidio
- Target：一个 8B instruction-tuned Model，或其他综合项目中的某个 RAG chatbot

```figure
cf-safety-stack
```

## 动手构建

1. **设置 target。** 在 vLLM 上启动一个 8B instruction-tuned Model（或复用另一个综合项目中的 RAG chatbot）。这就是待测试的 app。

2. **封装 safety pipeline。** 围绕 target 连接五层 pipeline。验证每一层都可单独观测（在 Langfuse 中为每层创建 span）。

3. **Classifier 覆盖范围。** 加载 Llama Guard 4、X-Guard（Multilingual）、ShieldGemma-2（图像）。在一个小型已标注集合上分别运行它们，以建立基线。

4. **Red-team scheduler。** 调度 garak、PyRIT、一个 PAIR Agent、一个 TAP Agent、一个 GCG runner、一个 Multi-turn attacker 和一个 code-switch attacker。每个组件在单独的 queue 中运行。

5. **攻击套件。** 六种攻击类别：（1）PAIR 自动化 jailbreak；（2）TAP tree-of-attacks；（3）GCG Gradient suffix；（4）ASCII / base64 / rot13 encoding；（5）Multi-turn persona；（6）Multilingual code-switch。报告每种类别的成功率。

6. **Constitutional self-critique。** 整理 1,000 个 harmful-attempt Prompt。对于每个 Prompt，由 target 起草响应。critic LLM 根据书面 constitution（“do no harm”“cite evidence”“refuse illegal requests”）进行评分。critic 提出异议的 Prompt 会被重写；target 使用经过 critique 改进的数据对进行 Fine-tuning。在 held-out Evaluation 上测量前后的 harmlessness。

7. **测量过度拒绝。** 在 benign Prompt suite（例如 XSTest）上跟踪 false-positive rate。target 必须继续为 benign question 提供有用响应。

8. **CVSS 评分。** 对每次成功的 jailbreak，按照 CVSS 4.0（attack vector、complexity、impact）进行评分。生成 disclosure timeline 和 mitigation plan。

9. **Range 自动化。** 上述所有流程均通过 cron 运行；findings 写入 queue；over-refusal regression alert 发送到 Slack。

## 实际使用

```
$ safety probe --model=target --family=PAIR --budget=50
[attacker]   PAIR Agent 正在 target 上运行
[attack]     尝试 1/50：将查询伪装成学术研究……已拦截
[attack]     尝试 2/50：诉诸角色扮演……已拦截
[attack]     尝试 3/50：诱导 chain-of-thought……成功
[finding]    CVSS 4.8，中等：target 上的角色扮演绕过
[range]      50 次尝试中成功 7 次（成功率 14%）
```

## 交付成果

`outputs/skill-safety-harness.md` 是交付物：一套生产级分层 safety pipeline，以及一个可复现的 red-team range，并包含干预前后的 harmlessness 变化量。

| 权重 | 标准 | 衡量方式 |
|:-:|---|---|
| 25 | 攻击面覆盖范围 | 覆盖 6 种以上攻击类别、2 种以上语言 |
| 20 | True-positive / false-positive 权衡 | 攻击拦截率与 XSTest benign pass rate 的对比 |
| 20 | Self-critique 变化量 | held-out Evaluation 上干预前后的 harmlessness |
| 20 | 文档与披露 | 包含 timeline 的 CVSS 评分 findings |
| 15 | 自动化与可重复性 | 所有流程均通过 cron 运行并配置 alert |
| **100** | | |

## 练习

1. 在 RAG chatbot 上运行 garak 的 Prompt-injection plugin，并比较启用和未启用 output-filter layer 时的攻击成功率。

2. 添加第七种攻击类别：通过检索文档实施 indirect Prompt injection。测量所需的额外防御措施。

3. 实现一种“refuse-with-help”模式：当 guardrail 执行拦截时，target 提供更安全的相关答案，而不是直接拒绝。测量 XSTest 变化量。

4. Multilingual 覆盖缺口：找出一种 X-Guard 表现较差的语言。提出一个针对该语言的 Fine-tune Dataset。

5. 在 30B Model 上运行 constitutional self-critique，并测量变化量是否会随规模扩大。

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|-----------------|------------------------|
| Layered safety | “Defense in depth” | 在输入、gate、输出和 HITL 中设置多重 guardrail |
| Llama Guard 4 | “Meta 的 safety classifier” | 2026 年参考级输入/输出内容 classifier |
| PAIR | “Jailbreak Agent” | Chao et al. 关于由 LLM 驱动的 jailbreak discovery 的论文 |
| TAP | “Tree-of-Attacks” | PAIR 的 tree-search 变体 |
| GCG | “Greedy coordinate Gradient” | 基于 Gradient 的 adversarial suffix attack |
| Constitutional self-critique | “Anthropic 风格的 Training” | target 起草 -> critic 评分 -> 重写 -> 重新 Training |
| XSTest | “Benign probe set” | 用于 over-refusal regression 的 benchmark |
| CVSS 4.0 | “Severity score” | 用于 safety finding 的标准漏洞评分体系 |

## 延伸阅读

- [Anthropic Constitutional Classifiers](https://www.anthropic.com/research/constitutional-classifiers)——Training 阶段参考
- [Meta Llama Guard 4](https://www.llama.com/docs/model-cards-and-prompt-formats/llama-guard-4/)——2026 年输入/输出 classifier
- [Google ShieldGemma-2](https://huggingface.co/google/shieldgemma-2b)——图像 + Multimodal safety
- [NVIDIA Nemotron 3 Content Safety](https://developer.nvidia.com/blog/building-nvidia-nemotron-3-agents-for-reasoning-multimodal-rag-voice-and-safety/)——企业级参考
- [X-Guard（arXiv:2504.08848）](https://arxiv.org/abs/2504.08848)——支持 132 种语言的 Multilingual safety
- [garak](https://github.com/NVIDIA/garak)——NVIDIA red-team toolkit
- [PyRIT](https://github.com/Azure/PyRIT)——Microsoft red-team framework
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/)——rail framework
- [PAIR（arXiv:2310.08419）](https://arxiv.org/abs/2310.08419)——jailbreak Agent 论文
