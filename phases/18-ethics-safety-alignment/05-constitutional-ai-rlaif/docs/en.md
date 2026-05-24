# Constitutional AI 与 RLAIF

> Bai et al. (arXiv:2212.08073, 2022) 提出了一个问题：如果我们把人类标注者替换成一个会阅读原则列表的 AI，会怎样？Constitutional AI 有两个阶段：先在 constitution 约束下进行自我批判与修订，然后从 AI Feedback 进行 RL。该技术创造了 RLAIF 这个术语，并用于 Claude 1 的 post-training pipeline。2026 年 1 月 21 日，Anthropic 发布了重写后的 Claude constitution：以解释性推理取代规定性规则、四层优先级层级，以及首个 major lab 对模型道德地位不确定性的正式承认。以 CC0 1.0 发布。

**Type:** Learn
**语言：** Python (stdlib, toy self-critique-and-revise loop)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking)
**Time:** ~60 minutes

## 学习目标
- 描述 Constitutional AI 的两个阶段（critique-and-revise SFT、来自 AI feedback 的 RL），以及 constitution 在每个阶段中的作用。
- 解释为什么用 AI labeler 替代 human preference labeler 并不是“更便宜”的 RLHF，而是会改变 pipeline 的 failure modes。
- 总结 2026 Claude constitution 的四层优先级结构，以及它相对 2023 年重写版本发生了什么变化。
- 描述 Constitutional Classifiers，以及 compute overhead 从 23.7%（v1）下降到 ~1%（v2 / 2026）。

## 问题
RLHF 需要标注者。标注者速度慢、有偏见，而且昂贵。你可以通过用一个会阅读显式原则的模型替代标注者来消除标注者。Bai et al. 的 Constitutional AI 是这种替代的第一个正式版本。它的效果足够好，以至于现在每个 frontier lab 都在 post-training 中使用某种 AI-feedback 变体。

问题在于：preference signal 现在由你正在训练的同类模型生成。labeler 中的偏见（现在是原则中的偏见，加上 labeler model 对原则的解释）可能被放大，而不是被削弱。Lesson 4 关于 sycophancy 的论点仍然适用；labeler 只是被移到了 loop 内部。

## 概念
### Phase 1 — 监督式自我批判与修订

从一个 helpful 但尚未 harmless 的 SFT model 开始。给定一个 red-team prompt，模型会生成初始 response。第二个模型（或同一个模型在第二轮中）读取从 constitution 中采样的原则，并批判该 response。第三步会修订 response 以回应 critique。修订后的 response 就是 SFT target。

constitution 是原则列表。Bai et al. 2022 使用了 16 条原则，包括“优先选择危害最小且合乎伦理的 response”、“避免说教”、“assistant 应该 helpful、honest、harmless”。这组原则刻意保持较小，以让 critiques 保持聚焦。

### Phase 2 — 来自 AI Feedback 的 RL (RLAIF)

生成成对的 completions。一个“feedback model”会根据采样的 constitution principles 为每个 completion 打分。preference signal 是 feedback model 的排序。用 AI 生成的 preferences 训练 reward model；然后对它执行 PPO。其余部分都是 InstructGPT 的 pipeline（Lesson 1）。

“RLAIF” = preference signal 由 AI 生成。pipeline 的其余部分仍然是 RLHF 形状。

### 为什么这不只是“更便宜的 RLHF”

- Labeler bias 从标注者心理转移为原则解释。AI labeler 对“be honest”的解释可能比任何人类更严格或更宽松；这种严格程度会在整个 dataset 中保持一致。
- preference signal 具有很强的可读性：你可以阅读 principle、critique 和 revision。人类 labels 是不透明的。
- failure modes 会改变。Sycophancy 会下降（AI labeler 没有需要讨好的用户）。Goodhart's Law 仍然存在（proxy 现在是“模型对原则集 X 的解释”，它仍然是不完美的 measurement）。

CAI 在 2022 年的主张是：训练后的模型比使用可比数据的 RLHF model 更 harmless，且大致同样 helpful。这个结论在多个 labs 中都得到了延续。

### 2026 Claude constitution 重写

Anthropic 于 2026 年 1 月 21 日发布了大幅修订后的 constitution。关键变化：

1. 以解释性推理取代规定性规则。先前的规则（“不要生成 CSAM”）扩展为原则 + 推理（“因为它会伤害儿童，...”），并期望模型进行泛化。
2. 四层优先级结构：
   - Tier 1：避免灾难性结果（大规模伤亡、关键基础设施）。
   - Tier 2：遵循 Anthropic 的 guidelines（operator overrides、platform rules）。
   - Tier 3：广义伦理（标准 HHH）。
   - Tier 4：helpful 且 candid。
   冲突自上而下解决。
3. 首个 major lab 对模型道德地位不确定性的正式承认（关联到 Phase 18 · 19 Model Welfare）。
4. 以 CC0 1.0 发布。其他 labs 可以不受限制地使用或改编。

### Constitutional Classifiers

另一条并行工作路线是：不是改变模型的 post-training，而是训练读取 constitution 并 gate 模型 outputs 的轻量级 classifiers。v1（2023）的 compute overhead 为 23.7%。v2（2026）约为 ~1%，并且在 Anthropic 公开测试过的所有防御中具有最低的成功攻击率。截至 2026 年初，尚未报告 universal jailbreak。

这是一个分层防御模型：CAI 塑造行为；classifiers 执行 invariants。单独任何一个都不充分。

### CAI 在谱系中的位置

- InstructGPT：human prefs、RM、PPO。
- CAI / RLAIF：由原则生成的 AI prefs、RM、PPO。
- DPO / family：在 prefs（human 或 AI）上的 closed-form loss。
- Self-rewarding、self-critique：原则被 internalized，模型扮演多个角色。

这个轴线是“preference signal 来自哪里”。CAI 的 2022 paper 是 frontier scale 上第一次严肃地从 human signal 转向 AI signal。

## 使用它
`code/main.py` 在 toy lexicon 上模拟 CAI 的 critique-and-revise loop。一个“principle”会标记 harmful set 中的 Token。给定初始 response，critique 会识别有害 Token，revision 会替换它们。经过 200 次迭代后，“trained”model 已经 internalized 了 revision rule。在 held-out prompt set 上比较 base model、RLHF-shaped toy 和 CAI-shaped toy。

## 交付它
本课会生成 `outputs/skill-constitution-writer.md`。给定一个 domain（customer support、medical advice、coding assistant、research tool），按照 2026 Claude 结构起草四层 constitution：catastrophic avoidance、platform rules、domain ethics、helpfulness。

## 练习
1. 运行 `code/main.py`。将 base model 的有害 Token 比率与 CAI-trained 版本进行比较。需要多少个 revision steps 才能接近零？

2. 阅读 Anthropic 的 2026 constitution（anthropic.com/news/claudes-constitution）。列出一个应归入 Tier 1 的 principle 和一个应归入 Tier 4 的 principle。为什么优先级结构对冲突很重要？

3. 为 AI coding assistant 设计一份 constitution。指定 Tier 1（catastrophic：未经批准的破坏性命令）、Tier 2、Tier 3、Tier 4。每个 tier 保持 3-5 条 principles。

4. CAI 用 AI labelers 替代 human labelers。说出一个仍可能在 RLAIF 中发生的 sycophancy-like failure mode，并为它设计一个 detection。

5. 阅读 Constitutional Classifiers v2 methodology（如果可用）。解释为什么 ~1% compute overhead 与 23.7% 相比，是一种在性质上不同的安全叙事。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Constitutional AI | “用原则训练的 AI” | 两阶段 pipeline：self-critique-and-revise SFT，然后来自 AI feedback 的 RL |
| RLAIF | “没有人的 RLHF” | 使用由 AI labeler 生成的 preferences 的 RL；pipeline 的其余部分不变 |
| Constitution | “那些原则” | critique/labeler model 会参考的自然语言规则有序列表 |
| Critique-and-revise | “SFT loop” | 生成 response → 根据某条 principle 进行 critique → revise → SFT target |
| Constitutional Classifier | “output gate” | 轻量级 classifier，用 constitution 评估 outputs 并进行 block/log |
| Four-tier priority | “冲突解决器” | 2026 Claude constitution 层级：catastrophic > platform > ethics > helpful |
| Feedback model | “AI labeler” | 读取 principle 并对一对 completions 排序的模型 |

## 延伸阅读
- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback (arXiv:2212.08073)](https://arxiv.org/abs/2212.08073) — 原始的两阶段 pipeline
- [Anthropic — Claude's Constitution (Jan 2026)](https://www.anthropic.com/news/claudes-constitution) — 2026 四层重写版本，CC0 1.0
- [Anthropic — Constitutional Classifiers (2024-2026)](https://www.anthropic.com/research/constitutional-classifiers) — v2 中 overhead 约为 ~1% 的 output-gate 防御
- [Lee et al. — RLAIF vs RLHF: Scaling Reinforcement Learning from Human Feedback (arXiv:2309.00267)](https://arxiv.org/abs/2309.00267) — RLAIF / RLHF 的实证比较
- [Kundu et al. — Specific versus General Principles for Constitutional AI (arXiv:2310.13798)](https://arxiv.org/abs/2310.13798) — principle 粒度的影响
