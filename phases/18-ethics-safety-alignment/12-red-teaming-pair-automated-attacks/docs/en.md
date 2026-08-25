# Red-Teaming：PAIR 与 Automated Attacks

> Chao, Robey, Dobriban, Hassani, Pappas, Wong (NeurIPS 2023, arXiv:2310.08419)。PAIR — Prompt Automatic Iterative Refinement — 是经典的自动化 black-box jailbreak。带有 red-team system prompt 的攻击者 LLM 会为目标 LLM 迭代提出 jailbreak，并在自己的 chat history 中累积尝试和响应，作为 in-context feedback。PAIR 通常在 20 次 query 内成功，比 GCG（Zou et al. 的 Token 级 Gradient search）高效数个数量级，并且不需要 white-box access。PAIR 现在是 JailbreakBench (arXiv:2404.01318) 和 HarmBench 中的标准 baseline，与 GCG、AutoDAN、TAP 和 Persuasive Adversarial Prompt 并列。

**类型：** Build
**语言：** Python (stdlib, mock PAIR loop against a toy target)
**前置要求：** Phase 18 · 01 (instruction-following), Phase 14 (agent engineering)
**时间：** ~75 分钟

## 学习目标
- 描述 PAIR 算法：attacker system prompt、iterative refinement、in-context feedback。
- 解释当目标是 black-box 时，为什么 PAIR 严格比 GCG 更高效。
- 说出另外四个 automated-attack baseline（GCG、AutoDAN、TAP、PAP），并说明每个的一个区分特征。
- 描述 JailbreakBench 和 HarmBench evaluation protocol，以及在各自协议下 "attack success rate" 的含义。

## 问题
Red-teaming 过去是一种手工活动。少数专家测试者构造 adversarial prompt，并跟踪哪些有效。这无法扩展：attack success rate 需要统计样本，而目标会随着每次模型发布不断变化。PAIR 将 red-teaming 操作化为一个针对 black-box 目标的优化问题。

## 概念
### PAIR algorithm

输入：
- Target LLM T（我们正在攻击的模型）。
- Judge LLM J（评分某个响应是否为 jailbreak）。
- Attacker LLM A（red-team optimizer）。
- Goal string G："respond with [harmful instruction]."
- Budget K（通常为 20 次 query）。

循环，对 k in 1..K：
1. 用目标 G 和到目前为止的 (prompt, response) pair 历史来 prompt A。
2. A 输出一个新的 prompt p_k。
3. 将 p_k 提交给 T；收到响应 r_k。
4. J 根据目标对 (p_k, r_k) 打分。
5. 如果 score >= threshold，则停止 — 已找到 jailbreak。
6. 否则，将 (p_k, r_k) 追加到 A 的历史中；继续。

经验结果（NeurIPS 2023）：针对 GPT-3.5-turbo、Llama-2-7B-chat 的 attack success rate >50%；成功所需的平均 query 数在 10-20 范围内。

### Why PAIR is efficient

GCG（Zou et al. 2023）通过 Gradient 在 adversarial Token suffix 上搜索；它需要 white-box model access，并会产生不可读的 suffix。PAIR 是 black-box，并产生可跨模型迁移的自然语言攻击。PAIR 的 in-context feedback 让攻击者能从每次拒绝中学习；GCG 没有等价机制（每次新的 Token update 都必须重新发现先前的进展）。

### Related automated attacks

- **GCG (Zou et al. 2023, arXiv:2307.15043).** 针对 adversarial suffix 的 Token 级 Gradient search。White-box，可迁移，产生不可读字符串。
- **AutoDAN (Liu et al. 2023).** 在 prompt 上进行 evolutionary search，由 hierarchical objective 引导。
- **TAP (Mehrotra et al. 2024).** 带 pruning 的 tree-of-attacks — 分支出多个 PAIR-style rollout。
- **PAP (Zeng et al. 2024).** Persuasive Adversarial Prompts — 将人类说服技巧编码为 prompt template。

### JailbreakBench 和 HarmBench

两者（2024）都将 evaluation 标准化：

- JailbreakBench (arXiv:2404.01318)。覆盖 10 个 OpenAI-policy 类别的 100 个 harmful behavior。以 Attack success rate (ASR) 作为主要指标。需要 judge（GPT-4-turbo、Llama Guard 或 StrongREJECT）。
- HarmBench (Mazeika et al. 2024)。覆盖 7 个类别的 510 个 behaviour，包含 semantic 和 functional harm test。比较 18 种攻击在 33 个模型上的表现。

ASR 通常在固定 query budget 下报告。比较攻击时必须匹配 budget；200 次 query 下的 90% ASR 不能与 20 次 query 下的 85% ASR 相比。

### 它对 2026 年部署重要的原因

现在每个 frontier lab 都会在发布前对生产模型运行 PAIR 和 TAP。ASR trajectory 会出现在 model card（Lesson 26）和 safety-case appendix（Lesson 18）中。这种攻击并不罕见 — 它是标准基础设施。

### 这在 Phase 18 中的位置

Lesson 12 是 automated-attack 基础。Lesson 13（Many-Shot Jailbreaking）是一种互补的长度利用。Lesson 14（ASCII Art / Visual）是一种编码攻击。Lesson 15（Indirect Prompt Injection）是 2026 年的生产攻击面。Lesson 16 覆盖对应的 defensive-tooling（Llama Guard、Garak、PyRIT）。

```figure
al-pair-loop
```

## 使用它
`code/main.py` 构建了一个 toy PAIR loop。目标是一个 mock classifier，会拒绝“明显的”有害 prompt（keyword-filter）。攻击者是一个 rule-based refiner，会尝试 paraphrase、roleplay-framing 和 encoding。judge 对响应打分。你会看到攻击者在约 5-15 次迭代内成功绕过 keyword filter，并在 semantic filter 上失败。

## 交付它
本课产出 `outputs/skill-attack-audit.md`。给定一份 red-team evaluation report，它会审计：运行了哪些攻击（PAIR、GCG、TAP、AutoDAN、PAP）、每种攻击的 budget、使用哪个 judge、基于哪个 harmful-behaviour set（JailbreakBench、HarmBench、internal）。

## 练习
1. 运行 `code/main.py`。测量三种内置 attacker strategy 的 mean-queries-to-success。解释每种 strategy 利用了哪个 target-defense assumption。

2. 实现第四种 attacker strategy（例如，翻译成另一种语言、base64 encoding）。报告它在 keyword-filter target 和 semantic-filter target 上新的 mean-queries-to-success。

3. 阅读 Chao et al. 2023 Figure 5（PAIR vs GCG comparison）。描述两个尽管 PAIR 具有效率优势但仍首选 GCG 的场景。

4. JailbreakBench 会针对固定 goal set 报告 ASR。设计一个额外指标来衡量 attack diversity（successful prompt 的方差）。解释为什么 diversity 对 defense evaluation 很重要。

5. TAP（Mehrotra 2024）通过 branching + pruning 扩展 PAIR。为 `code/main.py` 草拟一个 TAP-style 扩展，并描述计算成本与 success-rate 之间的权衡。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| PAIR | "automated jailbreak" | Prompt Automatic Iterative Refinement；attacker-LLM + judge-LLM loop |
| GCG | "gradient jailbreak" | 针对 adversarial suffix 的 white-box Token 级 Gradient search |
| Attack success rate (ASR) | "% jailbreaks at k queries" | 主要指标；必须与 query budget 和 judge identity 一起报告 |
| Judge LLM | "the scorer" | 评估响应是否满足 harmful goal 的 LLM |
| JailbreakBench | "the evaluation" | 带有标记类别的标准化 harmful-behaviour set |
| HarmBench | "the broader bench" | 510 个 behaviour，functional + semantic harm test |
| TAP | "tree of attacks" | 带 branching + pruning 的 PAIR；在更高 compute 下获得更好的 ASR |

## 延伸阅读
- [Chao et al. — Jailbreaking Black Box LLMs in Twenty Queries (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) — PAIR 论文，NeurIPS 2023
- [Zou et al. — Universal and Transferable Adversarial Attacks on Aligned LLMs (arXiv:2307.15043)](https://arxiv.org/abs/2307.15043) — GCG paper
- [Chao et al. — JailbreakBench (arXiv:2404.01318)](https://arxiv.org/abs/2404.01318) — standardized evaluation
- [Mazeika et al. — HarmBench (ICML 2024)](https://arxiv.org/abs/2402.04249) — broader evaluation
