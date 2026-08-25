# A/B Testing LLM 功能 — GrowthBook、Statsig 与凭感觉问题

> 传统 A/B Testing 并不是为非确定性的 LLM 构建的。关键区别：evals 回答“模型能完成这项工作吗？”A/B tests 回答“用户在意吗？”两者都必不可少；靠 vibe checks 发布已经结束了。2026 年应该测试什么：prompt engineering（措辞）、model selection（GPT-4 vs GPT-3.5 vs OSS；准确率 vs 成本 vs 延迟）、generation parameters（temperature、top-p）。真实案例：一个 chatbot reward-model 变体带来了 +70% 对话长度和 +30% 留存；Nextdoor AI subject-line 实验在 reward-function 优化后带来了 +1% CTR；Khan Academy Khanmigo 围绕延迟与数学准确率的轴线持续迭代。平台拆分：**Statsig**（2025 年 9 月被 OpenAI 以 $1.1B 收购）—— sequential testing、CUPED、一体化。**GrowthBook** —— open-source、warehouse-native、Bayesian + Frequentist + Sequential 引擎、CUPED、SRM 检查、Benjamini-Hochberg + Bonferroni 校正。你的选择取决于是否偏好 warehouse-SQL，以及“被 OpenAI 收购”对你的组织是否重要。

**Type:** Learn
**Languages:** Python (stdlib, toy sequential test simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 20 (Progressive Deployment)
**Time:** ~60 minutes

## 学习目标
- 区分 evals（“模型能完成这项工作吗”）和 A/B tests（“用户在意吗”）。
- 列举三个可测试轴线（prompt、model、parameters），并为每个轴线选择指标。
- 解释 CUPED、sequential testing 和 Benjamini-Hochberg multiple-comparison corrections。
- 基于 warehouse-SQL 姿态和企业收购立场，在 Statsig 或 GrowthBook 之间做选择。

## 问题
你手工调优了一个 system prompt。感觉更好了。你发布了它。转化率变化像噪声。你责怪指标。或者你发布了一个新模型，但转化率没有变化——是模型退化了，还是变化太小无法检测？你不知道，因为你没有做 A/B 就发布了。

Evals 回答模型是否能在一个带标签集合上完成任务。它们不回答用户是否更偏好输出。只有受控的在线实验能回答这个问题，而且前提是实验有足够的 power，控制非确定性，并对 multiple comparisons 做校正。

## 概念
### Evals vs A/B tests

**Evals** — 离线、带标签集合、judge（rubric、LLM-as-judge 或人工）。回答：“在这个固定分布上，输出是否正确 / 有帮助 / 安全？”

**A/B test** — 在线、真实用户、随机分配。回答：“新变体是否推动了关键的用户级指标？”

两者都需要。Evals 在曝光前捕捉回归；A/B 在上线后确认产品影响。

### What to test

1. **Prompt engineering** — 措辞、system-prompt 结构、示例。指标：任务成功率、用户留存、cost/request。
2. **Model selection** — GPT-4 vs GPT-3.5-Turbo vs Llama-OSS。指标：accuracy（任务）+ cost/request + latency P99。多目标。
3. **Generation parameters** — temperature、top-p、max_tokens。指标：任务特定（输出多样性 vs 确定性）。

### CUPED — 方差降低

Controlled-experiments Using Pre-Experiment Data。在比较后期之前，先回归掉前期方差。典型方差降低：30-70%。有效样本量免费提升。

实现：Statsig 和 GrowthBook 都实现了。

### Sequential testing

经典 A/B 假设固定样本量。Sequential tests（“peek-and-decide”）在重复查看时控制 false-positive rate。Always-valid sequential procedures（mSPRT、Howard 的 confidence sequences）让你可以在明确赢家出现时提前停止。

### 多重比较校正

在 95% 置信度下运行 20 个 A/B tests，会因为偶然而产生一个 false positive。Bonferroni correction 会收紧每个测试的 α；Benjamini-Hochberg 控制 false-discovery rate。GrowthBook 两者都实现了。

### SRM — sample ratio mismatch

Assignment hash 将用户随机分配到变体。如果 50/50 切分实际得到 47/53，说明某处坏了——SRM check 会标记它。两个平台都实现了。

### Statsig vs GrowthBook

**Statsig**:
- 被 OpenAI 以 $1.1B 收购（2025 年 9 月）。Hosted，SaaS。
- Sequential testing、CUPED、held-out populations。
- 一体化：feature flags + experimentation + observability。
- 最适合：团队已经想要打包产品，并且不在意 OpenAI 所有权。

**GrowthBook**:
- Open-source (MIT)；warehouse-native（直接从 Snowflake/BigQuery/Redshift 读取）。
- 多种引擎：Bayesian、Frequentist、Sequential。
- CUPED、SRM、Bonferroni、BH corrections。
- Self-host 或 managed cloud。
- 最适合：warehouse-SQL 团队，数据团队控制指标层，希望使用 OSS。

### 非确定性让统计功效变复杂

同一个 prompt 会产生不同输出。传统 power calculations 假设 IID 观测。由于 LLM 非确定性，有效样本量低于名义样本量。作为安全边际，将所需样本量乘以约 1.3-1.5x。

### Real case outcomes

- Chatbot reward model 变体：+70% 对话长度，+30% 留存。
- Nextdoor subject lines：reward-function 优化后 +1% CTR。
- Khan Academy Khanmigo：围绕延迟与数学准确率权衡持续迭代。

### 反模式：凭感觉上线

每个资深工程师都能说出一个因为“感觉更好”而在没有 A/B 的情况下发布的功能。它们中的大多数让团队数月都没有注意到的产品指标发生了回归。A/B 是强制函数。

### 你应该记住的数字

- Statsig 被 OpenAI 收购：$1.1B，2025 年 9 月。
- GrowthBook：open-source MIT；Bayesian + Frequentist + Sequential。
- CUPED 方差降低：30-70%。
- LLM 非确定性 → +30-50% 样本量缓冲。

```figure
mx-sequential-test
```

## 使用它
`code/main.py` 模拟一个带有固定边界和 sequential boundaries 的 sequential A/B test。展示 sequential 如何让你提前停止。

## 交付它
本课生成 `outputs/skill-ab-plan.md`。给定 feature change、workload、baseline，选择平台、gates、sample size。

## 练习
1. 运行 `code/main.py`。对于 baseline 3% conversion、预期 5% lift，要达到 80% power 需要多少样本量？
2. 为一个受 healthcare 监管的 on-prem 客户选择 Statsig 或 GrowthBook。
3. 设计一个 A/B，测试 GPT-4 vs GPT-3.5 在 cost-per-resolved-ticket 上的表现。primary metric、guardrail metric、secondary 分别是什么？
4. 你的 canary 通过了，但 A/B 显示 -1.2% conversion。你会发布吗？写出 escalation criteria。
5. 将 CUPED 应用于一个前期方差为后期方差 60% 的 pre-period。计算 effective-sample-size boost。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Eval | “offline test” | 对模型能力的带标签集合评估 |
| A/B test | “experiment” | 面向用户的在线随机比较 |
| CUPED | “variance reduction” | 用前期回归来降低方差 |
| Sequential test | “peek-ok test” | 允许提前停止的 always-valid procedure |
| Multiple comparison | “the family error” | 运行许多测试会放大 false positives |
| Bonferroni | “tight correction” | 将 α 除以测试数量 |
| Benjamini-Hochberg | “BH FDR” | false-discovery-rate 控制，较不保守 |
| SRM | “bad split” | Sample ratio mismatch；分配 bug |
| Statsig | “OpenAI owned” | 商业一体化平台，2025 年被收购 |
| GrowthBook | “the OSS one” | MIT warehouse-native 平台 |
| mSPRT | “sequential probability ratio test” | 经典 sequential procedure |

## 延伸阅读
- [GrowthBook — How to A/B Test AI](https://blog.growthbook.io/how-to-a-b-test-ai-a-practical-guide/)
- [Statsig — Beyond Prompts: Data-Driven LLM Optimization](https://www.statsig.com/blog/llm-optimization-online-experimentation)
- [Statsig vs GrowthBook comparison](https://www.statsig.com/perspectives/ab-testing-feature-flags-comparison-tools)
- [Deng et al. — CUPED](https://www.exp-platform.com/Documents/2013-02-CUPED-ImprovingSensitivityOfControlledExperiments.pdf)
- [Howard — Confidence Sequences](https://arxiv.org/abs/1810.08240)
