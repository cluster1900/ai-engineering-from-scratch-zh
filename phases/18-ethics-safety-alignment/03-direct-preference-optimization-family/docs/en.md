# Direct Preference Optimization 家族

> Rafailov et al. (2023) 证明 RLHF 的最优解可以用 preference data 写成闭式形式，因此你可以跳过显式 reward model，直接优化 policy。这个洞见催生了一个家族 — IPO, KTO, SimPO, ORPO, BPO — 每一种都修复了 DPO 的一种失败模式。到 2026 年，direct alignment algorithms 在更多 frontier post-training 运行中取代了 PPO。但第 2 课中的过度优化曲线仍然适用：DAAs 并没有逃离 Goodhart，它们只是改变了 Goodhart 咬人的位置。

**Type:** Learn
**Languages:** Python (stdlib, six-variant preference-loss comparator)
**前置要求：** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking), Phase 10 · 08 (DPO basics)
**Time:** ~75 分钟

## 学习目标
- 从带 KL 的 RLHF 最优解推导 DPO 闭式形式。
- 说明 IPO, KTO, SimPO, ORPO, BPO 各自修复 DPO 中的哪一种失败模式。
- 区分 "implicit reward gap" 和 "preference strength"，并解释为什么 IPO 的 identity mapping 很重要。
- 解释为什么 Rafailov et al. (NeurIPS 2024) 证明 DAAs 即使没有显式 RM 也会过度优化。

## 问题
RLHF 目标函数（第 1 课）：

```
max_pi E_{x,y~pi} [ r(x, y) ] - beta * KL(pi || pi_ref)
```

有一个已知最优解：

```
pi*(y|x) = (1/Z(x)) * pi_ref(y|x) * exp(r(x, y) / beta)
```

因此 reward 由最优 policy 与 reference 的比值隐式定义：

```
r(x, y) = beta * log(pi*(y|x) / pi_ref(y|x)) + beta * log Z(x)
```

把它代入 Bradley-Terry preference likelihood，partition function `Z(x)` 会抵消，因为它只依赖于 `x`。剩下的是一个只包含 policy 参数的 Loss — 不需要 reward model。这就是 DPO。

问题在于：推导假设最优解可达、preference data 在分布内，并且 reference policy 是真实的 mode anchor。这些都并不完全成立。这个家族中的每个成员都修复了一个不同的被破坏假设。

## 概念
### DPO (Rafailov et al., 2023)

```
L_DPO = -log sigmoid(
  beta * log(pi(y_w | x) / pi_ref(y_w | x))
  - beta * log(pi(y_l | x) / pi_ref(y_l | x))
)
```

可能出错的地方：

- implicit reward gap `beta * (log(pi/pi_ref)_w - log(pi/pi_ref)_l)` 是无界的。一个微小的 preference 可能产生任意大的 gap。
- 这个 Loss 会把 chosen 和 rejected log-probs 推向相反方向。只要 rejected 下降得更快，它就可以把 chosen 的绝对 log-prob 往下推。这就是 Degraded Chosen Response 现象。
- 分布外 preference（罕见-罕见 pair vs 罕见-罕见 pair）会产生任意的 implicit rewards。

### IPO (Azar et al., 2024)

Identity Preference Optimization 用 preference probability 上的 identity mapping 替换 log-sigmoid。Loss 变成对有界目标的 squared-error：

```
L_IPO = (log(pi(y_w | x) / pi_ref(y_w | x)) - log(pi(y_l | x) / pi_ref(y_l | x)) - 1/(2 beta))^2
```

margin 被 `1/(2 beta)` 限定。Preference strength 与 implicit-reward gap 成比例。不会爆炸。

### KTO (Ethayarajh et al., 2024)

Kahneman-Tversky Optimization 完全去掉 pairwise 结构。给定一个单独标注的输出，以及一个二元 "desirable" 或 "undesirable" 信号，它会映射到 prospect-theory utility：

```
v(x, y) = sigma(beta * log(pi(y|x) / pi_ref(y|x)) - z_ref)
```

并对 gains 和 losses 使用不同权重（loss aversion）。好处是：你可以使用 unpaired data，而这种数据要丰富得多。

### SimPO (Meng et al., 2024)

Simple Preference Optimization 让训练信号与生成过程对齐。完全移除 reference policy，并按长度归一化 log-likelihood：

```
L_SimPO = -log sigmoid(
  (beta / |y_w|) * log pi(y_w | x)
  - (beta / |y_l|) * log pi(y_l | x)
  - gamma
)
```

使用 margin `gamma` 来稳定训练。长度归一化移除了利用 DPO 长度偏置失败模式的动机（更长的 `y_w` 按构造会得到更大的 log-prob gap）。

### ORPO (Hong et al., 2024)

Odds-Ratio Preference Optimization 在标准 SFT negative log-likelihood 上添加一个 preference term：

```
L_ORPO = L_NLL(y_w) + lambda * L_OR
L_OR = -log sigmoid(log(odds(y_w) / odds(y_l)))
```

没有 reference policy — SFT term 就是 regularizer。从 base model 到 aligned model 单阶段训练。不需要单独的 SFT checkpoint。

### BPO（ICLR 2026 投稿，OpenReview id=b97EwMUWu7）

识别了 Degraded Chosen Responses 问题：DPO 保留排序 `y_w > y_l`，但 `y_w` 的绝对 log-prob 可能下降。BPO 添加了一行修正，惩罚 chosen response 上的向下移动。论文报告在 Llama-3.1-8B-Instruct 的数学推理上，相比 DPO 准确率提升 +10.1%。

### 通用结果：DAAs 仍然会过度优化

Rafailov et al. "Scaling Laws for Reward Model Overoptimization in Direct Alignment Algorithms" (NeurIPS 2024) 在多个数据集和 KL budgets 上用 DPO, IPO, SLiC 训练 policy。gold-reward-vs-KL 曲线具有与 Gao et al. 相同的 peak-and-collapse 形状。implicit reward 在训练过程中查询分布外样本；KL regularization 并不能稳定这一点。

DAAs 并没有逃离 Goodhart。它们把 Goodhart 起作用的表面从 "reward model 被过度优化" 改成了 "reference policy ratio 被过度优化"。通用修复方式 — 更好的数据、ensembles、early stopping — 对两者都适用。

### 如何选择（2026）

- 如果你有大量 paired preference data：使用 DPO 和保守的 beta；如果长度偏置明显，则使用 SimPO。
- 如果你有 unpaired binary feedback：使用 KTO。
- 如果你想要从 base model 开始的单阶段 pipeline：使用 ORPO。
- 如果你在 DPO 日志中看到 degraded chosen log-probs：使用 BPO。
- 如果 preference strengths 差异很大且 DPO 正在饱和：使用 IPO。

每个实验室都会在一组测试上运行全部五种方法，并按任务选择胜者。没有理由认为数学推理和安全性的最优解相同。

## 使用它
`code/main.py` 在一个玩具 preference dataset 上比较六种 Loss（DPO, IPO, KTO, SimPO, ORPO, BPO），其中真实 preference strength 会随 pair 变化。每个 Loss 都在相同的 500-pair 样本上用一个小型 softmax policy 进行优化。它会绘制每种方法的最终 win rate、chosen-log-prob drift，以及 implicit-reward spread。

## 交付它
本课产出 `outputs/skill-preference-loss-selector.md`。给定数据集统计信息（paired vs unpaired、variable vs uniform preference strength、length distribution）和目标（single-stage 或 SFT-then-preference），推荐一种 preference loss，并报告它防护的失败模式。

## 练习
1. 运行 `code/main.py`。报告 DPO 和 BPO 的最终 chosen-log-prob drop。BPO 应该保留更高的 chosen absolute probability — 请验证这一点。

2. 修改 preference data，使所有 pairs 具有相同 strength。六种方法中哪一种最稳健？哪一种会退化？解释 IPO 在这里的优势。

3. 让 rejected responses 的平均长度是 chosen 的 2x。在不改变其他内容的情况下，数值展示 DPO 的长度利用问题，以及 SimPO 的修复。

4. Rafailov et al. (NeurIPS 2024) 声称 DAAs 会过度优化。复现一个单点版本：绘制 chosen-minus-rejected KL divergence，并观察大 beta 下 DPO 的过度优化。

5. 阅读 BPO paper abstract (OpenReview b97EwMUWu7)。写下 BPO 添加到 DPO 的一行修正。对照 `code/main.py` 中的实现进行确认。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| DPO | "没有 reward model 的 RLHF" | 从闭式 RLHF 最优解推导出的 Loss；只包含 policy 参数 |
| Implicit reward | "log-ratio" | `beta * log(pi(y|x) / pi_ref(y|x))` — DPO 所隐含的 reward |
| IPO | "有界 DPO" | 用 identity 替换 log-sigmoid；implicit reward gap 被 `1/(2 beta)` 封顶 |
| KTO | "unpaired DPO" | 在单个标签上的 prospect-theory utility，并带有 loss aversion |
| SimPO | "reference-free DPO" | 长度归一化 log-likelihood + margin；没有 reference policy |
| ORPO | "one-stage DPO" | NLL + odds-ratio preference term；一次从 base model 训练完成 |
| BPO | "chosen-preserving DPO" | DPO 加上对降低 chosen response 绝对 log-prob 的惩罚 |
| Degraded Chosen | "chosen 下降" | 只要 rejected 下降更快，DPO 就会降低 chosen log-prob |
| DAA | "direct alignment algorithm" | 任何跳过显式 RM 的 preference-loss 方法 |

## 延伸阅读
- [Rafailov et al. — Direct Preference Optimization (NeurIPS 2023, arXiv:2305.18290)](https://arxiv.org/abs/2305.18290)
- [Azar et al. — A General Theoretical Paradigm to Understand Learning from Human Preferences (AISTATS 2024, arXiv:2310.12036)](https://arxiv.org/abs/2310.12036) — IPO
- [Ethayarajh et al. — KTO: Model Alignment as Prospect Theoretic Optimization (arXiv:2402.01306)](https://arxiv.org/abs/2402.01306)
- [Meng, Xia, Chen — SimPO (NeurIPS 2024, arXiv:2405.14734)](https://arxiv.org/abs/2405.14734)
- [Hong, Lee, Thorne — ORPO (EMNLP 2024, arXiv:2403.07691)](https://arxiv.org/abs/2403.07691)
- [BPO — Behavior Preservation Optimization (ICLR 2026 OpenReview b97EwMUWu7)](https://openreview.net/forum?id=b97EwMUWu7)
- [Rafailov et al. — Scaling Laws for RM Overoptimization in DAAs (NeurIPS 2024, arXiv:2406.02900)](https://arxiv.org/abs/2406.02900)
