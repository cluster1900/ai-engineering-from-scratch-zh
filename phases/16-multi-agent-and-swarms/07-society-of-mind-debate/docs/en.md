# Society of Mind 与 Multi-Agent Debate

> Minsky 在 1986 年的前提，即 intelligence 是一个由专家组成的 society，每隔十年都会被重新发现一次。2023 年，Du et al. 将它变成了一个具体算法：多个 LLM instances 提出答案，阅读彼此的答案，critique，并更新。经过 N 轮后，它们收敛到一个 consensus，在六个 reasoning 与 factuality 任务上超过 zero-shot CoT 和 reflection。有两个发现很重要：**multiple agents** 和 **multiple rounds** 都独立贡献效果。society 胜过 single-agent monologue；multi-round exchange 胜过 one-shot voting。

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## 问题
Self-consistency，也就是对一个 model 采样多次并取多数答案，是你能附加上的最便宜的 reasoning 改进。它有效，但很快会饱和。你可以把 samples 翻倍，却看不到另一次有意义的提升。

Debate 打破了这种饱和。不是从一个 model 取 N 个独立 samples，而是让 N 个 agents 阅读彼此的 reasoning 并 revise。samples 之间的相关性下降（它们不再是 i.i.d.），并且 convergence point 常常在 i.i.d. voting 自信地错误时给出正确答案。

## 概念
### Du et al. 2023 算法

来自 arXiv:2305.14325 (ICML 2024)：

1. N 个 agents 中的每一个都为问题生成一个初始答案。
2. 对 round r = 2..R：向每个 agent 展示其他 agents 在 round r-1 的答案，并要求它“considering these, give your updated answer.”
3. R 轮后，对最终答案做 majority-vote。

论文在 MMLU、GSM8K、biographies、MATH 和 factuality benchmarks 上测试。Debate 持续优于 CoT 和 Self-Reflection。

### 两个独立旋钮

同一篇论文中的 ablations：

- **Agent count alone**（1 轮，对 N 个结果做 majority vote）在多数任务上超过 single-agent，但会进入平台期。
- **Round count alone**（1 个 agent 看到自己的先前 reasoning）几乎没有帮助，也就是 reflection 的已知弱点。
- **Both together** 带来大幅提升。多个 agents 之间的 multi-round exchange 驱动了增益。

### 为什么有效

两个机制：

1. **暴露于分歧。** 当一个 agent 看到另一个 agent 的 reasoning chain 得出不同结论时，它必须要么 justify，要么 update。无论哪种方式，round r+1 的 context 都比 round r 更丰富。
2. **相关错误减少。** 在 self-consistency 中，所有 samples 都来自同一个 model，因此 errors 相关，你会平均到一个自信但错误的答案。不同 models 或不同 seeds 会去相关。不同的 *debated views* 会进一步去相关。

### Heterogeneous debate

A-HMAD 和相关后续工作为不同 agents 使用 *不同 base models*。Llama + Claude + GPT debate 会减少 monoculture collapse（Lesson 26），因为一个 model family 的相关错误不会被其他 model family 共享。

缺点：弱 model 参与 debate 时可能会把 consensus 拉向它的错误答案（见 “Should we be going MAD?”, arXiv:2311.17371）。

### NLSOM — 129-agent 扩展

Zhuge et al.（“Mindstorms in Natural Language-Based Societies of Mind,” arXiv:2305.17066）将这个想法扩展到了 129 成员 societies。结果是：specialization 和 self-organization 随规模涌现，并且系统在 visual question answering 等任务上优于 single-agent。

### Failure modes

- **Sycophancy cascade。** 所有 agents 都顺从听起来最自信的那个 agent。Debate 坍缩成最大声的观点。提示 adversarial roles（“one agent must argue the counter-position”）会有帮助。
- **Topic drift。** 多轮 debate 会偏离原始问题。缓解措施：每轮重新注入问题。
- **Compute blowup。** N agents × R rounds = N·R 次 LLM calls，每次 call 的 context 都在增长。一个 5-agent、5-round debate 是 25 次 calls，并且 context 持续增长。每个问题的成本可能超过单次 CoT call 的 10×。

```figure
multi-agent-debate
```

## 构建它
`code/main.py` 在一个数学问题上运行 3-agent × 3-round debate，其中每个 agent 都从一个不同的（可能错误的）答案开始。Agents 是脚本化的，每个 agent 都通过按脚本化 confidence 对邻居答案加权平均来“updates”。Convergence 在逐轮 log 中可见。

该 demo 展示两个关键效果：

- 单轮 exchange 会让 agents 更接近正确答案。
- round 2 之后的额外轮次显示 diminishing returns（符合 Du et al. 的 plateau）。

运行：

```
python3 code/main.py
```

## 使用它
`outputs/skill-debate-configurator.md` 为新任务配置 debate：agents 数量、rounds 数量、heterogeneity（same model vs mixed）、role assignment（symmetric vs one-adversarial）。它还会在运行前估算 Token 成本。

## 交付它
如果你要上线 debate：

- **将 rounds 上限设为 3。** Du et al. 显示 3 轮捕获了大部分增益。更多是成本，不是质量。
- **将 agents 上限设为 5。** 超过 5 后，context bloat 和成本占主导。
- **默认 heterogeneous。** 池中至少两个不同 base models。
- **Adversarial slot。** 一个 agent 被提示无论如何都要 disagree。打破 sycophancy。
- **记录每一轮。** 隐藏 intermediate rounds 的 debate systems 无法 debug 或 audit。

## 练习
1. 运行 `code/main.py`，然后将 round count 设为 5，观察 diminishing returns。到哪一轮 additional convergence 停止？
2. 添加一个带 adversarial role 的第四个 agent：始终 disagree with the current majority。这会破坏还是改善 convergence？
3. 绘制（打印）每轮的 agreement score（站在 majority answer 上的 agents 比例）。它什么时候达到 1.0？这是否等同于“correct”？
4. 阅读 Du et al. Section 4 ablations。使用这份 code 复现 “agents-only” vs “rounds-only” vs “both” 结果。
5. 阅读 “Should we be going MAD?” (arXiv:2311.17371)，并列出 round-robin 之外的两个 debate variants，例如 judge-led、chain-of-debate、adversarial。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Society of Mind | “Minsky 的想法” | Intelligence 是互动专家集合；1986 年的 framing 现在通过 LLM debate 被 operationalized。 |
| Multi-agent debate | “Agents 争论” | N 个 agents 提出答案、相互 critique、经过 R 轮 revise，然后 majority-vote。 |
| Consensus | “他们达成一致” | 不是 epistemic truth，只是 fraction-on-majority-answer。可能自信地错误。 |
| Rounds | “Exchange steps” | 一轮 = 每个 agent 读取其他 agents 并 update 一次。 |
| Heterogeneous debate | “混合 model families” | 使用不同 base models 来去相关 errors。 |
| Sycophancy cascade | “每个人都同意那个大声的人” | 一种 debate failure：agents 不管正确性如何，都顺从最自信的 agent。 |
| NLSOM | “129-agent society” | Natural-language society of mind；Zhuge et al. 的 scaled version。 |
| Correlated error | “同一个 model，同一个 bug” | self-consistency 饱和的原因；跨不同 views 的 debate 会去相关。 |

## 延伸阅读
- [Du et al. — 通过 Multiagent Debate 提升 Language Models 的事实性与推理能力](https://arxiv.org/abs/2305.14325) — reference paper，ICML 2024
- [Zhuge et al. — Mindstorms in Natural Language-Based Societies of Mind](https://arxiv.org/abs/2305.17066) — 129-agent NLSOM
- [Should we be going MAD? A Look at Multi-Agent Debate Strategies for LLMs](https://arxiv.org/abs/2311.17371) — benchmark debate variants
- [Debate project page](https://composable-models.github.io/llm_debate/) — Du et al. 的 code、demos 和 ablation details
