# 公平性标准 — 群体、个体、反事实

> 三个家族构成了 fairness 文献的结构。Group fairness：demographic parity、equalized odds、conditional use accuracy equality —— 在平均意义上，受保护群体之间具有相等的比率。Individual fairness（Dwork et al. 2012）：相似个体获得相似决策；对决策映射施加 Lipschitz condition。Counterfactual fairness（Kusner et al. 2017）：如果在 counterfactual 地改变敏感属性时决策保持不变，那么该决策对个体就是 fair 的。2024 theoretical result（NeurIPS 2024）：CF 与 accuracy 之间存在内在 trade-off；一种 model-agnostic 方法可以将 optimal-but-unfair predictor 转换为 CF predictor，并使 accuracy loss 有界。Backtracking counterfactuals（arXiv:2401.13935，2024 年 1 月）：一种新范式，避免要求对法律保护属性进行 intervention。Philosophical reconciliation（ICLR Blogposts 2024）：在 causal graphs 下，满足某些 group fairness 度量会蕴含 counterfactual fairness。

**类型：** Learn
**语言：** Python（stdlib，three-criteria comparison）
**先修：** Phase 18 · 20（bias），Phase 02（classical ML）
**时间：** 约 60 分钟

## 学习目标

- 说出三个 group-fairness criteria（demographic parity、equalized odds、conditional use accuracy equality）以及一个 impossibility result。
- 通过 Dwork et al. 2012 的 Lipschitz formulation 描述 individual fairness。
- 描述 counterfactual fairness 及其对 causal graph 的依赖。
- 解释 backtracking counterfactuals，以及它们为什么能绕开 protected-attribute intervention 问题。

## 问题

Lesson 20 讨论的是 bias measurement。Lesson 21 讨论的是定义 measurement 应服务的 fairness standard。这三个家族给出了结构上不同的标准 —— 一个 model 可以是 group-fair 但 individual-unfair，也可以是 counterfactually fair 但 group-unfair。选择某个标准是一项 policy decision；没有任何标准是普遍最优的。

## 概念

### Group fairness

- **Demographic parity.** P(Y=1 | A=a) = P(Y=1 | A=a')，对所有群体成立。相等的 acceptance rates。
- **Equalized odds.** P(Y=1 | Y*=y, A=a) = P(Y=1 | Y*=y, A=a')。群体之间具有相等的 TPR 和 FPR。
- **Conditional use accuracy equality.** P(Y*=y | Y=y, A=a) = P(Y*=y | Y=y, A=a')。群体之间具有相等的 predictive value。

Impossibility（Chouldechova, Kleinberg-Mullainathan-Raghavan 2017）：在 base rates 不相等时，这三者无法同时满足。

### Individual fairness

Dwork et al. 2012。如果对于某个 task-specific similarity metric d，decision map f 满足 |f(x) - f(x')| <= L * d(x, x')，其中 L 是某个 Lipschitz constant，那么 f 就是 individually fair。相似个体获得相似决策。

这要求定义 d。这是 policy question，而不是 statistical question。

### Counterfactual fairness

Kusner et al. 2017。若在 population 的 causal model 下，当个体 i 的敏感属性被 counterfactually altered 时，决策保持不变，那么该决策对个体 i 就是 counterfactually fair 的。

这需要一个 causal DAG。DAG 是一种 modeling choice。Counterfactual fairness 的正当性只与该 DAG 的正当性一样强。

### CF-vs-accuracy trade-off

NeurIPS 2024 theoretical：counterfactual fairness 与 predictive accuracy 之间存在内在 trade-off。一种 model-agnostic 方法可以将 optimal-but-unfair predictor 转换为 CF predictor，并付出有界的 accuracy cost。该 accuracy cost 取决于 optimal unfair predictor 中 sensitive-attribute coefficient 的大小。

### Backtracking counterfactuals

arXiv:2401.13935（2024 年 1 月）。传统 counterfactuals 要求对敏感属性进行 interventions —— “如果这个人是另一种 gender，决策会改变吗”。在法律上，这有问题：在 classification law 中，protected attributes 不能被 intervened on。

Backtracking counterfactuals 反转方向：不是对属性进行 intervention，而是询问该个体实际特征的哪种组合会产生 counterfactual outcome。这绕开了法律异议。

### Philosophical reconciliation

ICLR Blogposts 2024。当手中有 causal graph 时，满足某些 group-fairness measures 会蕴含 counterfactual fairness。这三个家族并非彼此正交；它们是同一底层 causal structure 的不同侧面。

这并不能解决 impossibility theorems（base rates 不相等仍然会阻止 simultaneous group fairness）。但它表明，“group” 与 “individual / counterfactual” 之间看似对立，部分是由于没有明确 causal model 而造成的 artifact。

### 本课在 Phase 18 中的位置

Lesson 20 是 bias measurement。Lesson 21 是 fairness definition。Lesson 22 是 privacy（differential privacy）。Lesson 23 是 watermarking。这些是 allocation-adjacent lessons，用来补充 deception-adjacent Lessons 7-11。

```figure
an-fairness-trilemma
```

## 使用它

`code/main.py` 构建一个 toy binary-classification dataset，其中包含一个 sensitive attribute 和不相等的 base rates。在一个 simple classifier 上计算 demographic parity、equalized odds 和 conditional use accuracy equality。观察这三个 metrics 彼此不一致。应用针对 demographic parity 的 re-weighting，并观察它对另外两个指标的成本。

## 交付它

本课会生成 `outputs/skill-fairness-criterion.md`。给定一个 fairness claim 或 policy，识别其声称的是哪个 criterion、在声称的 unequal base rates 下 model 是否能够满足其余 criteria，以及该 claim 依赖于什么 causal DAG。

## 练习

1. 运行 `code/main.py`。报告默认数据上的三个 group metrics。应用 demographic-parity-targeted re-weighting 并重新报告。

2. 使用非敏感特征上的 L2 实现 Dwork et al. 2012 的 individual-fairness metric。报告有多少对样本违反 Lipschitz 且 constant L=1。

3. 阅读 Kusner et al. 2017。为 resume scoring 构造一个简单的 two-feature causal DAG，并识别它蕴含的 counterfactual-fairness condition。

4. 2024 backtracking-counterfactuals 论文避免了对 protected attributes 的 intervention。描述一个这对 legal compliance 很重要的场景。

5. ICLR 2024 reconciliation 认为 group fairness 和 counterfactual fairness 是同一结构的不同侧面。在 `code/main.py` 中选择三个 criteria 中的两个，并说明会使它们等价的 causal assumption。

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Demographic parity | “equal rates” | P(Y=1 | A=a) 在群体之间相等 |
| Equalized odds | “equal TPR/FPR” | 群体之间相等的 true-positive 和 false-positive rates |
| Conditional use accuracy | “equal PPV/NPV” | 群体之间相等的 predictive values |
| Individual fairness | “Lipschitz condition” | 相似个体获得相似决策 |
| Counterfactual fairness | “causal alteration invariance” | 在 counterfactual attribute alteration 下决策保持不变 |
| Backtracking counterfactual | “explain via actuals” | Counterfactual 是从 outcome 向后推理，而不是从 attribute 向前推理 |
| Impossibility theorem | “the three conflict” | Chouldechova / KMR 2017：在 base rates 不相等时，group criteria 相互排斥 |

## 延伸阅读

- [Dwork et al. — Fairness through Awareness (arXiv:1104.3913)](https://arxiv.org/abs/1104.3913) — individual fairness
- [Kusner, Loftus, Russell, Silva — Counterfactual Fairness (arXiv:1703.06856)](https://arxiv.org/abs/1703.06856) — counterfactual fairness
- [Chouldechova — Fair prediction with disparate impact (arXiv:1703.00056)](https://arxiv.org/abs/1703.00056) — impossibility
- [Backtracking Counterfactuals (arXiv:2401.13935)](https://arxiv.org/abs/2401.13935) — protected-attribute interventions 的新范式
