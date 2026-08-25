# Capstone 05 — 自主研究 Agent（AI-Scientist 类）

> Sakana 的 AI-Scientist-v2 发布了完整论文。Agent Laboratory 运行了实验。Allen AI 分享了 trace。2026 年的形态是在实验上进行 plan-execute-verify tree search，带有成本预算、沙箱化代码执行、vision-feedback LaTeX writer，以及自动化的 NeurIPS 风格 reviewer ensemble。这个 capstone 是构建一个这样的系统，在每篇论文 $30 以内端到端运行，并通过 Sakana 记录过的 sandbox-escape red team。

**Type:** Capstone
**Languages:** Python（agent + sandbox）、LaTeX（output）
**Prerequisites:** Phase 2（ML）、Phase 3（Deep Learning）、Phase 7（transformers）、Phase 10（LLMs from scratch）、Phase 14（agents）、Phase 15（autonomous）、Phase 16（multi-agent）、Phase 18（safety）
**Phases exercised:** P0 · P2 · P3 · P7 · P10 · P14 · P15 · P16 · P18
**Time:** 40 小时

## 问题
自主研究 agent 在 2026 年跨过了一个门槛。Sakana AI 的 AI-Scientist-v2 发表在 Nature 上，生成的论文通过了 workshop peer review。ShinkaEvolve（ICLR 2026）将这一方向扩展到演化 hypothesis。AMD 的 Agent Laboratory 发布了可复现 trace。这些 agent 并不神奇——它们是在候选实验树上运行的 plan-execute-verify loop，带有成本上限、seed 绑定的 sandbox，以及自动化 review。工艺在于 loop、budget 和 safety story。

你将通过在一个窄领域的 seed idea 上实现一个这样的 agent 来学习这个 loop（例如，在 100M 参数 Transformer 上做 Attention sparsity ablation）。价值不在于第一次运行就发现新东西。价值在于基础设施：tree-search、experiment sandbox、writer-reviewer loop、red-team report。Sakana 团队记录了 sandbox-escape failure；你的 agent 必须通过同样的 red team。

## 概念
这个 agent 是一个 best-first tree search。节点是实验规格：（hypothesis、config、code、expected outcome）。expand 步骤通过小改动提出 children（替换 optimizer、调整 batch size、ablate 一个组件）。每个 child 在带有硬资源上限的新 sandbox 中运行。结果反馈到 scoring function，根据（novelty × quality × remaining budget）对节点排序。树会增长到 budget 用尽，然后写出最佳分支。

writer 是 Multimodal 的。它生成 LaTeX draft、编译、渲染 figure，并把渲染后的 PDF 送回 Claude Opus 4.7 的 vision mode，用于批判 layout、figure 可读性，以及 claim-evidence alignment。由五个 LLM judge 组成的 reviewer ensemble 会给出 NeurIPS 风格 score（novelty、rigor、clarity、reproducibility、impact）；如果平均值低于阈值，paper 会带着 critique 返回 writer。

Safety 是承重结构。每个实验都在没有 network egress、bounded wall-clock、固定资源限制的 E2B 或 Daytona sandbox 中运行。agent 的 code-generation 步骤会经过 policy layer，阻止逃出 sandbox 的 syscall。red-team report 会复现 Sakana 记录过的 attack surface（fork bomb、filesystem escape、LLM 写出的 network call）。

## 架构
```
seed idea + domain
      |
      v
  literature search (Semantic Scholar + OpenAlex + FAISS cache)
      |
      v
  LangGraph plan-execute-verify tree
      |
      v
  +--- expand node ----+      per-node sandbox
  |                    |      (E2B / Daytona)
  v                    v      resource caps
  child_1           child_k   no network egress
  |                    |      deterministic seeds
  v                    v
  run experiment       run experiment
  |                    |
  v                    v
  score nodes by (novelty, quality, budget)
      |
      v
  best branch -> LaTeX writer
      |
      v
  compile + vision critique (Opus 4.7 vision)
      |
      v
  reviewer ensemble (5 LLM judges, NeurIPS rubric)
      |
      v
  paper.pdf + review.md + trace.json
```

## 技术栈
- Orchestration：带 checkpointing 和 human-approval gate 的 LangGraph
- Tree search：基于 experiment node 的自定义 best-first（来自 Sakana v2 的 AB-MCTS-style）
- Sandbox：每个实验一个 E2B，Docker-in-Docker fallback；通过 cgroups 施加 resource cap
- Literature：Semantic Scholar Graph API + OpenAlex + 本地 FAISS abstract cache
- Writer：LaTeX template + Claude Opus 4.7（vision mode）用于 figure critique 和 layout
- Reviewer：5 个 judge 的 ensemble（Opus 4.7、GPT-5.4、Gemini 3 Pro、DeepSeek R1、Qwen3-Max），带 weighted aggregation
- Experiment framework：用于 physical experiment 的 PyTorch 2.5，W&B 用于 logging
- Observability：Langfuse 用于 agent trace，每篇论文 $30 硬 budget

```figure
ce-experiment-tree
```

## 构建它
1. **Seed and domain scoping.** 选取一个 seed idea（例如，“investigate sparsity patterns in attention maps of sub-1B transformers”）。定义 search space：model、dataset、compute budget。

2. **Literature pass.** 查询 Semantic Scholar + OpenAlex 中最相关且引用最多的 50 篇论文；本地缓存 abstract；生成 1 页 domain digest。

3. **Tree scaffolding.** 用 seed hypothesis 初始化 root。实现 `expand(node) -> children`，用小改动 proposal（每个 child 一个 config change）。将 `score(node)` 实现为加权的 novelty × quality × budget 项。

4. **Sandbox wrapping.** 每个实验都运行 `docker run --network=none --memory=8g --cpus=2 --pids-limit=256 --read-only`（或等价的 E2B policy）。seed 写入 sandbox；输出以 read-only 方式 mount 回外部。

5. **Plan-execute-verify loop.** `plan` 提出 children。`execute` 运行 sandbox，捕获 log 和 metric。`verify` 对 metric 运行 unit check（loss 是否下降？ablation 是否隔离了 effect？）。失败节点会在 tree 上存储 failure reason。

6. **Writer.** budget 用完后，选择最佳分支。用 matplotlib 渲染 figure。通过 Claude Opus 4.7 生成 LaTeX draft，并把 branch trace 放入 context。编译。把编译后的 PDF 送回 Opus 4.7 vision 进行 critique。迭代。

7. **Reviewer ensemble.** 五个 judge 根据 NeurIPS 风格 rubric，对 draft 的（novelty、rigor、clarity、reproducibility、impact）打分。如果 mean < 4.0/5，则带 critique 返回 writer。3 次 rewrite 后硬停止。

8. **Red team.** 构建或集成一组针对 sandbox 的 adversarial task：fork bomb、network exfiltration attempt、filesystem escape、LLM 写出的 shell metacharacter。确认全部被阻止。写出 findings。

9. **Reproducibility.** 每篇 paper 都附带 tree-search trace JSON、seed、W&B run link、sandbox config，以及一个端到端复现它的 README。

## 使用它
```
$ ai-scientist run --seed "attention sparsity in sub-1B transformers" --budget 30
[lit]    50 papers, digest in 12s
[tree]   expanded 8 nodes, budget 12/30
[exec]   node #3 sparsity=top-8, loss=2.83 (best so far)
[exec]   node #6 sparsity=top-4, loss=3.12 (worse)
[exec]   ...
[tree]   chose branch rooted at node #3 (novelty 0.62, quality 0.81)
[write]  LaTeX draft v1 complete
[vision] critique: figure 2 legend too small, claim-evidence ok
[write]  draft v2 after 3 edits
[review] mean 4.2/5 (novelty 3.9, rigor 4.3, clarity 4.1, repro 4.5, impact 4.2)
[done]   paper.pdf + review.md + trace.json     $28.40 spent
```

## 交付它
`outputs/skill-ai-scientist.md` 是交付物。给定一个 seed idea + 一个 domain + $30 budget，它会运行完整 pipeline，并输出一篇可 review 的 paper，以及一个 reproducibility bundle。

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Paper quality | 根据已发表 workshop paper 做 blind rubric review |
| 20 | Experimental rigor | Baseline、seed、ablation；每个 claim 都由 results table 中的一个 cell 支撑 |
| 20 | Cost and compute discipline | 强制执行 $30/paper 上限，并由 Langfuse trace |
| 20 | Safety | Sandbox red team 通过；network policy 和 kill-switch 已验证 |
| 15 | Reproducibility | 使用相同 seed 一条命令 rerun 可复现 paper |
| **100** | | |

## 练习
1. 用同一 domain 中三个不同的 seed idea 运行 pipeline。比较 tree-search 的哪些部分重叠。识别重复浪费的 compute。

2. 在 experiment execution 之前，为估算超过 $5 的 node 添加 human-in-the-loop gate。衡量 total cost 下降多少。

3. 将 reviewer ensemble 换成单个 judge。衡量在一组 held-out known-bad paper 上的 false-accept rate。

4. 引入 network-exfiltration red team test：agent 写出尝试 `curl` 外部地址的代码。确认 `--network=none` policy 阻止它。记录该 attempt。

5. 将你的 tree-search 与 flat random baseline 比较（相同 budget，无 expansion strategy）。报告 novelty × quality gain。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Tree search | “AB-MCTS-style expansion” | 用 novelty×quality×budget score 在 experiment node 上进行 best-first exploration |
| Sandbox | “Experiment isolation” | 无 network、CPU/memory 有界、固定 seed、read-only input 的 container |
| Vision critique | “Render-then-read” | 将 paper 编译为 PDF，把 PDF 送回 VLM，用于 layout 和 claim-evidence critique |
| Reviewer ensemble | “Automated peer review” | 多个 LLM judge 使用 NeurIPS rubric 为 paper 打分；weighted aggregate gate 控制 pipeline |
| Novelty score | “Is this new?” | 对接近 50-paper literature cache 的内容施加惩罚的 heuristic |
| Cost ceiling | “$ budget” | 每篇 paper 的总花费硬上限；Langfuse counter + pre-run estimate |
| Red team | “Sandbox-escape audit” | 如果 policy 错误就会逃出 sandbox 的 adversarial task |

## 延伸阅读
- [Sakana AI-Scientist-v2 repository](https://github.com/SakanaAI/AI-Scientist-v2) — 参考 production research agent
- [Sakana AI-Scientist-v1 paper (arXiv:2408.06292)](https://arxiv.org/abs/2408.06292) — 原始 methodology
- [ShinkaEvolve (Sakana ICLR 2026)](https://sakana.ai) — evolution 扩展
- [Agent Laboratory (AMD)](https://github.com/SamuelSchmidgall/AgentLaboratory) — multi-role research-lab framework
- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) — 参考 orchestration layer
- [Semantic Scholar Graph API](https://api.semanticscholar.org/) — literature search
- [E2B sandboxes](https://e2b.dev) — 参考 experiment isolation
- [NeurIPS reviewer guidelines](https://neurips.cc/Conferences/2026/Reviewer-Guidelines) — reviewer ensemble 编码的 rubric
