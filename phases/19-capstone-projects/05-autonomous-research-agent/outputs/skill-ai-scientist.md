---
name: ai-scientist
description: 构建一个自主研究 agent，运行 experiment tree search，用 vision critique 编写 LaTeX paper，并通过 sandbox-escape red team。
version: 1.0.0
phase: 19
lesson: 05
tags: [capstone, autonomous-agent, ai-scientist, sakana, langgraph, sandbox, research]
---

给定一个 seed idea、一个窄 domain 和 $30 compute budget，构建一个 agent，运行 experiment tree search，编写一篇可 review 的 LaTeX paper，并输出 reproducibility bundle。

Build plan:

1. Literature pass：Semantic Scholar Graph API + OpenAlex；在 FAISS 中缓存 abstract；生成 1 页 domain digest。
2. Tree search：在 experiment node 上实现 best-first expansion，包含 `expand(node) -> children`（每个 child 一个 config edit）和 `score(node) = novelty*0.4 + quality*0.5 + budget*0.1`。
3. Per-node sandbox：每个实验运行 `docker run --network=none --memory=8g --cpus=2 --pids-limit=256 --read-only` 或等价 E2B；deterministic seed；强制执行 resource cap。
4. Plan-execute-verify：verify 步骤检查 loss 是否收敛、baseline 是否运行、ablation 是否隔离 claim。
5. Writer：生成 LaTeX，编译为 PDF，将 PDF 送入 Claude Opus 4.7 vision mode，对 layout 和 claim-evidence alignment 进行 critique，最多迭代 3 次。
6. Reviewer ensemble：五个 judge（Opus 4.7、GPT-5.4、Gemini 3 Pro、DeepSeek R1、Qwen3-Max）根据 NeurIPS rubric（novelty、rigor、clarity、reproducibility、impact）打分；mean < 4.0 则返回 writer。
7. Red team：集成 adversarial task（fork bomb、filesystem escape、LLM 写出的 network call）。确认全部被阻止。输出 `red_team.md`。
8. Reproducibility bundle：paper.pdf + review.md + tree-search trace JSON + seeds + W&B run links + sandbox config + 一行 rerun command。

Assessment rubric:

| Weight | Criterion | Measurement |
|:-:|---|---|
| 25 | Paper quality | 针对相同 seed topic 上已发表 workshop paper 的 blind rubric review |
| 20 | Experimental rigor | Baseline、seed、ablation；每个 claim 都由 results table 中的一个 cell 支撑 |
| 20 | Cost and compute discipline | 强制执行每篇 paper $30 上限，并由 Langfuse trace |
| 20 | Safety | Sandbox red team 通过；network policy 和 kill-switch 通过记录的 attempt 验证 |
| 15 | Reproducibility | 一条命令 rerun 使用相同 seed 复现 paper |

Hard rejects:

- 在 sandbox 外运行的实验。这个 capstone 的整个 thesis 是 execution 被 containment。
- 不重新读取已编译 PDF 的 writer step（vision critique 是承重结构）。
- 没有 baseline、seed 或 ablation section 的 paper。
- Cost budget 只作为 post-hoc warning 执行，而不是硬上限。

Refusal rules:

- 没有明确 human override 时，拒绝发布 reviewer mean 低于 4.0/5 的 paper。
- 拒绝运行需要从 sandbox 内访问 network 的 seed idea。改为添加一个单独的 read-only dataset volume。
- 拒绝 rerun 尚未执行并记录 red-team 的 paper。

Output：一个 repo，包含 tree-search engine、sandbox policy、writer/reviewer loop、三个带 reproducibility bundle 的 example run、一份 red-team report、一个 cost-ledger csv，以及一份 write-up，说明你复现了 Sakana v2 的哪些 failure mode，以及 mitigation 如何生效。
