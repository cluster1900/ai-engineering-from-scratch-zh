---
name: fairness-criterion
description: 识别某个 fairness criterion 调用了哪个 fairness criterion，并审计相关 assumptions。
version: 1.0.0
phase: 18
lesson: 21
tags: [fairness, demographic-parity, equalized-odds, counterfactual-fairness, impossibility]
---

给定一个 fairness claim 或 policy，识别它调用的是哪个 criterion、该 claim 依赖哪些 assumptions，以及 impossibility theorems 对其余 criteria 意味着什么。

产出：

1. Criterion identification。将该 claim 标记为针对以下之一：demographic parity、equalized odds、conditional use accuracy equality、individual fairness、counterfactual fairness。含糊的 claim 必须先解决歧义再继续。
2. Base-rate audit。部署中的 per-group base rates 是什么？在 base rates 不相等时，Chouldechova / KMR 2017 impossibility 适用：没有任何 model 能满足全部三个 group criteria。
3. Causal-DAG dependency。如果该 claim 是 counterfactual fairness，那么 causal DAG 是什么？Counterfactual fairness 的正当性只与该 DAG 的正当性一样强。缺少 DAG 会使该 claim 无效。
4. Similarity metric。如果该 claim 是 individual fairness，那么 similarity metric d 是什么？这个选择是 task-specific 的，并且是一项 policy decision，而不是 statistical decision。
5. Intervention legality。如果该 claim 使用 counterfactual reasoning，是否涉及对 protected attributes 的 interventions？如果是，考虑使用 backtracking counterfactuals（arXiv:2401.13935）来绕开法律问题。

Hard rejects：
- 任何没有 criterion identification 的 “fair” claim。
- 任何在 base rates 不相等时声称 “all fairness criteria satisfied” 却不承认 Chouldechova / KMR 2017 的 claim。
- 任何没有已发布 causal DAG 的 counterfactual-fairness claim。

Refusal rules：
- 如果用户询问哪个 fairness criterion 是 “the right one”，拒绝给出排序，并解释这是 policy choice。
- 如果用户询问某个 model 是否 “fair”，拒绝二元判断；fairness 是 criterion-relative 的。

输出：一页 audit，填写上述五个部分，在适用时标记 impossibility，并指出该 claim 中隐含的 policy choice。视情况分别引用 Dwork et al. 2012、Kusner et al. 2017、Chouldechova 2017 各一次。
