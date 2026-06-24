# STaR, V-STaR, Quiet-STaR — Self-Taught Reasoning

> 最小的自我改进循环就位于 rationale 内部。模型生成一段 chain of thought，保留那些得到正确答案的结果，并在这些结果上 fine-tune。这就是 STaR。V-STaR 加入 verifier，让 inference-time selection 更好。Quiet-STaR 把 rationale 下沉到每个 Token。三者都有效。它们都不是魔法：这个循环会保留任何恰好得到正确答案的捷径。

**Type:** 学习
**Languages:** Python (stdlib, bootstrap-loop 模拟器)
**Prerequisites:** Phase 13 · 01-03 (Reasoning and CoT), Phase 15 · 01 (long-horizon 框架)
**Time:** ~60 分钟

## 问题

教模型进行 Reasoning 的直接方式，是收集人类编写的 reasoning traces。这既昂贵又缓慢，并且受限于人类愿意写多少高质量 chain-of-thought。

STaR (Self-Taught Reasoner, Zelikman et al., 2022) 提出一个问题：如果让模型编写自己的 rationales，并根据已知答案给它们打分，会怎样？循环是：

1. 采样一个 reasoning trace 和答案。
2. 如果最终答案正确，就保留这个 trace。
3. 在保留下来的 traces 上 fine-tune。
4. 重复。

它有效。GSM8K 和 CommonsenseQA 都在没有新增人工标注的情况下获得提升。但这个循环有一个内置偏差：任何产生正确答案的 rationale 都会被保留，无论 reasoning 本身是否可靠。V-STaR (Hosseini et al., 2024) 用 learned verifier 修补这一点；Quiet-STaR (Zelikman et al., 2024) 将这个想法泛化到 per-Token internal rationales。

## 概念

### STaR：在有效结果上 bootstrap

从一个具备某种弱 reasoning 能力的 base model 开始。在每个训练问题上，采样一个 rationale 和答案。如果答案与标签匹配，就保留这个 (problem, rationale, answer) triple。在保留集合上 fine-tune 模型。重复。

有一个变化很重要。如果模型永远无法答对某个问题，这个循环就无法从它身上学习。STaR 加入了 **rationalization**：对于模型失败的问题，把正确答案作为提示注入，并重新 prompt 模型生成一个导向该答案的 rationale。Rationalized rationales 会被加入训练集。

原论文结果 (Zelikman et al., 2022)：一个 GPT-J base model 通过多轮带 rationalization 的 STaR，在 GSM8K 上从 5.8% 提升到 10.7%，绝对提升约 5 个百分点。在 CommonsenseQA 上，STaR 训练的 GPT-J 6B 达到 72.5%，接近 fine-tuned GPT-3 175B (~73%)，而后者是在人工标注 rationales 上训练、规模约大 30 倍的模型。

### V-STaR：用 DPO 训练 verifier

STaR 会丢弃错误 rationales。Hosseini et al. (2024) 观察到这些也是数据：每一对 (rationale, "is this correct") 都可以训练 verifier。他们在正确和错误解法上使用 Direct Preference Optimization 来构建 ranker。在 inference time，采样 N 个 rationales，并选择 verifier 排名最高的一个。

报告的差异：在 GSM8K 和 MATH 上，相比先前的 self-improvement baselines 提升 +4 到 +17 个百分点，其中大部分收益来自将 verifier 用于 inference-time selection，而不是用于额外的 generator fine-tuning。

### Quiet-STaR：每个 Token 的内部推理依据

Zelikman et al. (2024) 提出：如果模型学习在每个 Token 位置生成一个短的 internal rationale，而不只是位于问题和答案之间，会怎样？Quiet-STaR 训练模型在每个预测 Token 之前发出一个隐藏的 "thought"，然后通过 learned weight 将 thought-aware prediction 与 baseline prediction 混合。

结果：Mistral 7B 在没有 task-specific fine-tuning 的情况下，在 GSM8K 上的 zero-shot 绝对表现从 5.9% 提升到 10.9%，CommonsenseQA 从 36.3% 提升到 47.2%。模型学会了 "when to think"：困难 Token 会得到更长的 internal rationales；简单 Token 几乎没有。

### 为什么三者都有共同的安全顾虑

三种方法都使用最终答案作为 Gradient 信号。一个通过有缺陷的 reasoning 得到正确答案的 rationale，无论是利用捷径、猜测，还是使用无法泛化的模式，都会被正向强化。在 in-distribution 问题上，这个捷径有效。在 out-of-distribution 问题上，它会静默失效。

V-STaR 的 verifier 通过学习对 rationales 排序来缓解这一点，但 verifier 是在同一套标签集上训练的。它可能学会偏好格式良好但错误的 reasoning，而不是诚实的不确定性。更安全的设计，是将 STaR-style 数据与 (a) process-supervised reward models（奖励中间步骤，而不只是答案）以及 (b) 能打破简单捷径的 held-out OOD evaluation 结合起来。

### 对比

| Method | Training signal | Inference cost | Data waste | Known failure mode |
|---|---|---|---|---|
| STaR | 如果正确，则保留 (rationale, answer) | 1x | 丢弃所有错误 rationales | shortcut rationales |
| STaR + rationalization | 上述方法 + 带正确答案提示的重试 | 1x | 更少 | rationalized rationales 可能不可信 |
| V-STaR | STaR + 来自两个类别的 DPO verifier | Nx (best-of-N) | 最小 | verifier 可能强化自信的错误 |
| Quiet-STaR | per-Token rationale + mixing weight | 1.5-3x | 最小 | 仍然是 answer-conditioned Gradient |

### 它在 2026 stack 中的位置

STaR 已经不新了。但这个模式在 2025-2026 年到处重现。可验证数学问题上的 RL (DeepSeek-R1, Kimi-k1.5, o1) 是 STaR 的 answer-conditioned Gradient 信号的放大版。Process reward models (Lightman et al., 2023; OpenAI's "Let's verify step by step") 是 process-supervised 替代方案。AlphaEvolve (Lesson 3) 是面向代码的 STaR，只是用 program evaluator 替代了标签。Darwin Godel Machine (Lesson 4) 是面向 agent scaffolding 自身的 STaR。

理解 STaR 会让所有这些都变得清晰。它是最小可行的 self-improvement loop。


```figure
reflection-loop
```

## 使用它

`code/main.py` 会在一个 toy arithmetic task 上运行模拟 STaR 循环。你可以观察：

- accuracy 如何随 bootstrap rounds 上升。
- 捷径如何混入：模拟器包含一个 "lazy" rationale 类，它有 40% 的时间得到正确答案，但泛化很差。观察 STaR 是否会保留它们。
- 一个 verifier（V-STaR 风格）如何在 inference 中提供帮助，但无法完全剪除训练期间引入的捷径。

## 交付它

`outputs/skill-star-loop-reviewer.md` 帮助你在训练前审计一个拟议的 self-taught-reasoning pipeline。

## 练习

1. 运行模拟器。将 shortcut frequency 设为零，然后设为 0.4。尽管两次运行都在训练分布上达到 >90%，最终 accuracy 会相差多少？

2. 给模拟器添加一个 held-out OOD test。从不同分布中抽取问题，并在 in-distribution 和 OOD sets 上评估 bootstrapped model。量化差距。

3. 阅读 Quiet-STaR 论文 (arXiv:2403.09629) Section 3。分别用三句话解释 "end-of-thought" Token 和 mixing-weight head。

4. 将 STaR 的 keep-if-correct filter 与一种 process-supervised 替代方案比较，后者会独立奖励每个 rationale step。识别 labelling cost 差异和可能的质量差异。

5. 设计一个评估，用来捕获 deployed model 中的 shortcut rationales。它不必完美，但必须能打破 STaR 循环会强化的最简单捷径。

## 关键术语

| Term | What people say | What it actually means |
|---|---|---|
| STaR | "Self-Taught Reasoner" | 在得到正确答案的模型生成 rationales 上 fine-tune；重复 |
| Rationalization | "Hinted retry" | 注入正确答案，并在 base model 失败的问题上重新 prompt 生成 rationale |
| V-STaR | "Verifier STaR" | 在正确和错误 rationales 上 DPO-train 一个 verifier，并将其用于 inference-time selection |
| Quiet-STaR | "Per-token rationales" | 在每个 Token 位置生成隐藏 thoughts；与 baseline prediction 混合 |
| Answer-conditioned gradient | "Outcome-based signal" | 训练循环奖励最终答案，而不是 reasoning steps |
| Process reward model | "Step-level verifier" | 在 per-step correctness 上训练的 reward model，而不是 outcome；与 STaR 形成对比 |
| Shortcut rationale | "Right answer, wrong reasoning" | 一个通过无法泛化的模式得到标签的 rationale；STaR 会保留这些 |

## 延伸阅读

- [Zelikman et al. (2022). STaR: Bootstrapping Reasoning With Reasoning](https://arxiv.org/abs/2203.14465) — 原始论文。
- [Hosseini et al. (2024). V-STaR: Training Verifiers for Self-Taught Reasoners](https://arxiv.org/abs/2402.06457) — 加入用于 inference-time selection 的 DPO verifier。
- [Zelikman et al. (2024). Quiet-STaR: Language Models Can Teach Themselves to Think Before Speaking](https://arxiv.org/abs/2403.09629) — per-Token 内部 rationales。
- [Lightman et al. (2023). Let's Verify Step by Step](https://arxiv.org/abs/2305.20050) — process reward models，即替代 Gradient 信号。
- [DeepSeek-R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) — 可验证任务上的 RL，将 STaR 扩展到 frontier training。
