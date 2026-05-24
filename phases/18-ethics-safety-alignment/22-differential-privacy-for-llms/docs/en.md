# LLMs 的 Differential Privacy

> DP-SGD 仍然是标准做法：注入噪声的 Gradient 更新提供形式化的 (epsilon, delta) 保证。计算、内存和效用方面的开销都很大；参数高效的 DP fine-tuning (LoRA + DP-SGD) 是常见的 2025 配置 (ACM 2025)。两类证据存在张力：基于 Canary 的 membership inference (Duan et al., 2024) 报告称对语言模型的成功有限；training-data extraction (Carlini et al., 2021; Nasr et al., 2025) 恢复了大量逐字记忆内容。解决方式 (arXiv:2503.06808, March 2025)：差距在于测量对象不同：插入的 Canary vs “最容易被提取”的数据。新的 Canary 设计支持无需 shadow models 的 Loss-based MIA，并给出了首个针对真实数据训练、且具备现实 DP 保证的 LLM 的非平凡 DP audit。替代方案：PMixED (arXiv:2403.15638)：在 inference time 通过 next-token 分布上的 mixture of experts 进行 private prediction；DP synthetic data generation (Google Research 2024)。新兴攻击：Differential Privacy Reversal via LLM Feedback，即 confidence-score 泄漏。

**Type:** Build
**Languages:** Python (stdlib, DP-SGD 噪声注入和 ε-δ accountant 演示)
**Prerequisites:** Phase 01 · 09（信息论），Phase 10 · 01（大模型训练）
**Time:** ~60 分钟

## 学习目标
- 定义 (epsilon, delta)-differential privacy，并说明 DP-SGD 流程。
- 解释 2024-2025 年的张力：Canary MIA 与 training-data extraction 给出了不同图景。
- 描述 PMixED，以及为什么 inference-time private prediction 是 DP training 的替代方案。
- 描述 Differential Privacy Reversal via LLM Feedback 攻击。

## 问题
LLMs 会记忆。Carlini et al. 2021 表明，生产语言模型会按需逐字复现训练文本。DP 是形式化防御：训练模型，使其输出在可证明意义上对任何单个训练样本不敏感。2024-2025 年的证据显示，DP-SGD 是必要的，但已部署的 ε 值可能并不匹配威胁模型。

## 概念
### (ε, δ)-differential privacy

如果对任意两个仅相差一个样本的数据集，以及任意事件 S，一个 randomized algorithm M 满足：
P(M(D) in S) <= e^ε * P(M(D') in S) + δ。

解释：输出分布足够接近（由 ε 参数化），使任何单个个体的贡献都不能被可靠推断，除非以 δ 的概率发生例外。

### DP-SGD

Abadi et al. 2016。标准流程：
1. 采样一个 mini-batch。
2. 计算 per-example gradients。
3. 将每个 per-example gradient 裁剪到阈值 C。
4. 对裁剪后的 gradients 求和，并加入 std 为 σ * C 的 Gaussian noise。
5. 使用带噪声的和来更新参数。

隐私成本由 accountant 跟踪（Moments Accountant、Rényi DP accountant）。LLM 文献中报告的 ε 值会因威胁模型、数据敏感性和效用目标而大幅变化；不存在普适的“安全”默认 ε。已发表示例在某些 LLM 训练设置中大致覆盖 ε ≈ 1–10，但这些只是示例，并非推荐默认值。较低的 ε 通常需要更多噪声，并可能增加效用损失。

### LoRA + DP-SGD

对 frontier model 做完整 DP-SGD 代价过高。LoRA (Hu et al. 2022) 将 Gradient 更新限制在一个小型 adapter 中，从而减少 per-example gradient 存储。LoRA + DP-SGD 是常见的 2025 配置。DP 保证适用于 adapter；base model 保持固定。

### 2024-2025 年的张力

两条证据线：

- **Canary MIA (Duan et al. 2024)。** 将唯一 Canary 插入训练数据，测量 membership-inference attacker 是否能识别它们。报告称在语言模型上的成功有限。这表明 MIA 很难。
- **Training-data extraction (Carlini 2021, Nasr et al. 2025)。** 用 prefix 提示模型；测量它是否能从训练中恢复逐字文本。报告称存在大量记忆。这表明在相关意义上 MIA 很容易。

2025 年 3 月的解决方式 (arXiv:2503.06808)：二者测量的是不同事物。MIA 问的是“样本 e 是否在 D 中？”对象是插入的 Canary。Extraction 问的是“我能从 D 中恢复什么？”对隐私而言，“最容易被提取”的样本才重要；Canary 会低估这一点，因为它们并未被优化为容易提取。

新的 Canary 设计。无需 shadow models 的 Loss-based MIA。首个针对真实数据上的 LLM、且具备现实 DP 保证的非平凡 DP audit。

### DP training 的替代方案

- **PMixED (arXiv:2403.15638)。** inference time 的 private prediction。在 next-token 分布上使用 mixture of experts；每个 expert 看到一份训练数据 shard；聚合时加入噪声以实现 DP。完全避免 DP training。
- **DP synthetic data generation (Google Research 2024)。** 使用 DP-SGD 进行 LoRA-fine-tune，采样 synthetic data，再在 synthetic data 上训练下游 classifier。

二者都绕开了完整 DP training 的效用成本，但代价是采用不同的威胁模型。

### 通过 LLM Feedback 逆转 Differential Privacy

2025 年新兴攻击。将 DP-trained model 的 confidence scores 用作 oracle 来重新识别个体。即使输出不泄漏，confidence distributions 也可能泄漏。

防御方式：不要暴露 confidences，或在暴露前对其截断/量化。这是 (ε, δ)-DP training 之外的额外要求。

### 这在 Phase 18 中的位置

Lessons 20-21 是 bias/fairness。Lesson 22 是隐私。Lesson 23 是通过 watermarking 实现 provenance。Lesson 27 覆盖监管层面的 data-provenance 层。

## 使用它
`code/main.py` 在一个 toy binary-classification 数据集上模拟 DP-SGD。你可以扫过 noise multiplier σ 和 clipping norm C，并跟踪 (ε, δ) budget 与 accuracy cost。一个 “canary attack” 会插入一个唯一训练样本，并测量 log-loss test 在 DP 前后是否能检测到它。

## 交付它
本课会产出 `outputs/skill-dp-audit.md`。给定某个语言模型部署的 DP claim，它会 audit：(ε, δ) 值、使用的 accountant、MIA evaluation protocol，以及是否已经评估 confidence-exposure vectors。

## 练习
1. 运行 `code/main.py`。扫过 σ ∈ {0.5, 1.0, 2.0}，并报告 (ε, δ)-accuracy 权衡。识别效用崩溃的临界点。

2. 实现 Canary 插入和 log-loss test。测量在 σ = 1.0 时，DP-SGD 前后的检测率。

3. 阅读 Nasr et al. 2025 关于 training-data extraction 的内容。为什么 extraction success 不会在中等 ε 下崩溃？这对将 MIA 作为 evaluation 意味着什么？

4. 设计一个使用 PMixED (arXiv:2403.15638) 的部署，使其完全在 inference time 运行。PMixED 解决了哪种 DP-SGD 未解决的威胁模型？

5. 概述 DP Reversal via LLM Feedback 攻击。设计一个限制 confidence-score 泄漏的对策，并估算其部署成本。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| DP | “(ε, δ)-differential privacy” | 形式化隐私：在相邻数据集变化下，输出分布保持接近 |
| DP-SGD | “noise-injected SGD” | Gradient clipping + Gaussian noise addition；标准 DP training |
| LoRA + DP-SGD | “efficient private fine-tune” | 在 low-rank adapters 上做 DP-SGD；标准 2025 配置 |
| MIA | “membership inference” | 判断某个样本是否出现在训练数据中的攻击 |
| Canary | “inserted watermark example” | 用于测量 DP 泄漏的唯一训练样本 |
| PMixED | “private inference mixture” | 在 inference time 通过 next-token 分布上的 mixture-of-experts 实现 DP |
| DP Reversal | “confidence leakage attack” | 使用模型 confidence 作为 oracle 进行重新识别的攻击 |

## 延伸阅读
- [Abadi et al. — DP-SGD (arXiv:1607.00133)](https://arxiv.org/abs/1607.00133) — 标准 DP training algorithm
- [Carlini et al. — Extracting Training Data (arXiv:2012.07805)](https://arxiv.org/abs/2012.07805) — 经典 extraction 论文
- [Duan et al. — Canary MIA on LLMs (arXiv:2402.07841, 2024)](https://arxiv.org/abs/2402.07841) — 成功有限的 MIA
- [Kowalczyk et al. — Auditing DP for LLMs (arXiv:2503.06808, March 2025)](https://arxiv.org/abs/2503.06808) — 对该张力的解决
- [PMixED (arXiv:2403.15638)](https://arxiv.org/abs/2403.15638) — inference-time 私有预测
