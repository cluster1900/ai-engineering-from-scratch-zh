# Direct Preference Optimization 家族

> Rafailov et al. (2023) 证明，RLHF 的最优解可以用 preference data 写成闭式形式，因此你可以跳过显式 reward model，直接优化 policy。这个洞见催生了一个家族：IPO、KTO、SimPO、ORPO、BPO，每个方法都修复了 DPO 的一个 failure mode。到 2026 年，direct alignment algorithms 在 frontier post-training 运行中的使用已经多于 PPO。但 Lesson 2 中的 over-optimization 曲线仍然适用：DAAs 并没有逃离 Goodhart，它们只是改变了问题咬人的位置。

**Type:** Learn
**Languages:** Python (stdlib, 六种 preference-loss comparator)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking), Phase 10 · 08 (DPO basics)
**Time:** ~75 分钟

## Learning Objectives

- 从带 KL 的 RLHF 最优解推导 DPO 闭式形式。
- 说明 IPO、KTO、SimPO、ORPO、BPO 各自修复了 DPO 中的哪种 failure mode。
- 区分“implicit reward gap”和“preference strength”，并解释 IPO 的 identity mapping 为什么重要。
- 解释为什么 Rafailov et al. (NeurIPS 2024) 证明 DAAs 即使没有显式 RM 也会 over-optimize。

## 问题

RLHF objective（Lesson 1）：

```text
max_pi E_{x,y~pi} [ r(x, y) ] - beta * KL(pi || pi_ref)
```

有一个已知最优解：

```text
pi*(y|x) = (1/Z(x)) * pi_ref(y|x) * exp(r(x, y) / beta)
```

因此 reward 由 optimal policy 与 reference 的比值隐式定义：

```text
r(x, y) = beta * log(pi*(y|x) / pi_ref(y|x)) + beta * log Z(x)
```

把它代入 Bradley-Terry preference likelihood 后，partition function `Z(x)` 会抵消，因为它只依赖 `x`。剩下的是一个只含 policy parameters 的 loss，不再需要 reward model。这就是 DPO。

问题在于：这个推导假设最优解可达、preference data 是 in-distribution，并且 reference policy 是真正的 mode anchor。这些条件没有一个完全成立。家族中的每个成员都修复了一个不同的被违背假设。

## 概念

### DPO (Rafailov et al., 2023)

```text
L_DPO = -log sigmoid(
  beta * log(pi(y_w | x) / pi_ref(y_w | x))
  - beta * log(pi(y_l | x) / pi_ref(y_l | x))
)
```

可能出错的地方：

- implicit reward gap `beta * (log(pi/pi_ref)_w - log(pi/pi_ref)_l)` 是无界的。一个很小的 preference 也可能产生任意大的 gap。
- 这个 loss 会把 chosen 和 rejected 的 log-probs 往相反方向推。只要 rejected 下降得更快，它就可以把 chosen 的绝对 log-prob 也往下推。这就是 Degraded Chosen Response 现象。
- Out-of-distribution preferences（稀有样本对稀有样本）会产生任意的 implicit rewards。

### IPO (Azar et al., 2024)

Identity Preference Optimization 用 preference probability 上的 identity mapping 替换 log-sigmoid。loss 变成 bounded target 上的 squared-error：

```text
L_IPO = (log(pi(y_w | x) / pi_ref(y_w | x)) - log(pi(y_l | x) / pi_ref(y_l | x)) - 1/(2 beta))^2
```

margin 被 `1/(2 beta)` 限定。preference strength 与 implicit-reward gap 成比例。不会爆掉。

### KTO (Ethayarajh et al., 2024)

Kahneman-Tversky Optimization 完全去掉 pairwise 结构。给定一个单独标注的 output，以及一个二元的 “desirable” 或 “undesirable” 信号，它会映射到 prospect-theory utility：

```text
v(x, y) = sigma(beta * log(pi(y|x) / pi_ref(y|x)) - z_ref)
```

并对 gains 和 losses 使用不同权重（loss aversion）。好处是：你可以使用 unpaired data，而这类数据要丰富得多。

### SimPO (Meng et al., 2024)

Simple Preference Optimization 让训练信号与生成过程对齐。完全移除 reference policy，并按长度归一化 log-likelihood：

```text
L_SimPO = -log sigmoid(
  (beta / |y_w|) * log pi(y_w | x)
  - (beta / |y_l|) * log pi(y_l | x)
  - gamma
)
```

使用 margin `gamma` 来稳定训练。长度归一化移除了利用 DPO length-bias failure mode 的激励（更长的 `y_w` 会在构造上带来更大的 log-prob gap）。

### ORPO (Hong et al., 2024)

Odds-Ratio Preference Optimization 在标准 SFT negative log-likelihood 上添加一个 preference term：

```text
L_ORPO = L_NLL(y_w) + lambda * L_OR
L_OR = -log sigmoid(log(odds(y_w) / odds(y_l)))
```

没有 reference policy，SFT term 就是 regularizer。从 base model 到 aligned model 只需单阶段训练。无需单独的 SFT checkpoint。

### BPO (ICLR 2026 submission, OpenReview id=b97EwMUWu7)

识别了 Degraded Chosen Responses 问题：DPO 会保持排序 `y_w > y_l`，但 `y_w` 的绝对 log-prob 可能下降。BPO 增加了一个单行修正，对 chosen response 的下降移动施加惩罚。据报告，在 Llama-3.1-8B-Instruct 的数学推理任务上，相比 DPO 准确率提升 +10.1%。

### 通用结论：DAAs 仍然会 over-optimize

Rafailov et al. “Scaling Laws for Reward Model Overoptimization in Direct Alignment Algorithms” (NeurIPS 2024) 在多个数据集和不同 KL budgets 下，用 DPO、IPO、SLiC 训练 policies。gold-reward-vs-KL 曲线呈现出与 Gao et al. 相同的 peak-and-collapse 形状。implicit reward 会在训练期间查询 out-of-distribution samples；KL regularization 无法稳定这一点。

DAAs 并没有逃离 Goodhart。它们只是把问题咬人的表面从“reward model 被 over-optimized”改成了“reference policy ratio 被 over-optimized”。通用修复方法，也就是更好的数据、ensembles、early stopping，对两者都适用。

### 如何选择（2026）

- 如果你有大量 paired preference data：使用保守 beta 的 DPO；如果长度偏差明显，则使用 SimPO。
- 如果你有 unpaired binary feedback：KTO。
- 如果你想要从 base model 出发的单阶段 pipeline：ORPO。
- 如果你在 DPO logs 中看到 degraded chosen log-probs：BPO。
- 如果 preference strengths 差异很大且 DPO 正在饱和：IPO。

每个 lab 都会在一组评测上跑完这五种方法，然后按任务选择赢家。没有理由认为数学推理和安全性的最优解相同。


```figure
dpo-margin
```

## Use It

`code/main.py` 在一个 toy preference dataset 上比较六种 losses（DPO、IPO、KTO、SimPO、ORPO、BPO），其中 true preference strength 会随 pair 变化。每个 loss 都在相同的 500-pair sample 上，用一个小型 softmax policy 优化。它会按方法绘制 final win rate、chosen-log-prob drift 和 implicit-reward spread。

## Ship It

本课产出 `outputs/skill-preference-loss-selector.md`。给定 dataset statistics（paired vs unpaired、variable vs uniform preference strength、length distribution）和目标（single-stage 或 SFT-then-preference），推荐一个 preference loss，并报告它防护的 failure mode。

## 练习

1. 运行 `code/main.py`。报告 DPO 和 BPO 的最终 chosen-log-prob drop。BPO 应该保留更高的 chosen absolute probability，请验证这一点。

2. 修改 preference data，让所有 pairs 都有相同 strength。六种方法中哪一种最 robust？哪一种退化？解释 IPO 在这里的优势。

3. 让 rejected responses 的平均长度变成 chosen 的 2 倍。在不改变其他任何内容的情况下，用数值展示 DPO 的 length exploitation 以及 SimPO 的修复。

4. Rafailov et al. (NeurIPS 2024) 声称 DAAs 会 over-optimize。复现一个单点版本：绘制 chosen-minus-rejected KL divergence，并观察大 beta 下 DPO 的 over-optimization。

5. 阅读 BPO paper abstract (OpenReview b97EwMUWu7)。写下 BPO 添加到 DPO 的那一行修正。对照 `code/main.py` 中的实现确认。

## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| DPO | “没有 reward model 的 RLHF” | 从 RLHF 闭式最优解推导出的 loss；只含 policy parameters |
| Implicit reward | “log-ratio” | `beta * log(pi(y\|x) / pi_ref(y\|x))`，也就是 DPO 隐含的 reward |
| IPO | “bounded DPO” | 用 identity 替换 log-sigmoid；implicit reward gap 被 `1/(2 beta)` 限制 |
| KTO | “unpaired DPO” | 在带有 loss aversion 的单标签上使用 prospect-theory utility |
| SimPO | “reference-free DPO” | 长度归一化 log-likelihood + margin；没有 reference policy |
| ORPO | “one-stage DPO” | NLL + odds-ratio preference term；从 base model 单次训练完成 |
| BPO | “chosen-preserving DPO” | DPO 加上对 chosen response 绝对 log-prob 下降的惩罚 |
| Degraded Chosen | “chosen 下降了” | 只要 rejected 下降得更快，DPO 就会降低 chosen log-prob |
| DAA | “direct alignment algorithm” | 任何跳过显式 RM 的 preference-loss 方法 |

## Further Reading

- [Rafailov et al. — Direct Preference Optimization (NeurIPS 2023, arXiv:2305.18290)](https://arxiv.org/abs/2305.18290)
- [Azar et al. — A General Theoretical Paradigm to Understand Learning from Human Preferences (AISTATS 2024, arXiv:2310.12036)](https://arxiv.org/abs/2310.12036) — IPO
- [Ethayarajh et al. — KTO: Model Alignment as Prospect Theoretic Optimization (arXiv:2402.01306)](https://arxiv.org/abs/2402.01306)
- [Meng, Xia, Chen — SimPO (NeurIPS 2024, arXiv:2405.14734)](https://arxiv.org/abs/2405.14734)
- [Hong, Lee, Thorne — ORPO (EMNLP 2024, arXiv:2403.07691)](https://arxiv.org/abs/2403.07691)
- [BPO — Behavior Preservation Optimization (ICLR 2026 OpenReview b97EwMUWu7)](https://openreview.net/forum?id=b97EwMUWu7)
- [Rafailov et al. — Scaling Laws for RM Overoptimization in DAAs (NeurIPS 2024, arXiv:2406.02900)](https://arxiv.org/abs/2406.02900)
