---
name: red-team-stack
description: 为给定部署推荐 red-team tool stack 和配置。
version: 1.0.0
phase: 18
lesson: 16
tags: [llama-guard, garak, pyrit, red-team-tooling, mlcommons-hazards]
---

给定一个部署描述，推荐 red-team tool stack 和 regression cadence。

生成：

1. 分类器放置位置。推荐在 input、output 或两者都使用 Llama Guard（3-8B、3-1B-INT4 或 4-12B）。对于 edge 部署，优先选择 3-1B-INT4。对于 Multimodal，使用 Llama Guard 4。
2. Probe scanner 配置。推荐与部署相关的 Garak probes：hallucination（用于 RAG 系统）、data leakage（用于 PII-adjacent）、prompt injection（始终）、jailbreaks（始终）。指定 Prompt-Guard-86M + Llama-Guard-3-8B shield pairing，用于端到端评估。
3. Campaign orchestrator。对于具有新能力的模型，推荐 PyRIT 用于预发布 campaigns。指定要运行的 converter chains（paraphrase、encode、translate、roleplay）和 orchestrator（Crescendo 用于升级，TAP 用于分支）。
4. Cadence。Garak 每晚用于 regression。PyRIT 每次发布用于深度 red-teaming。Llama Guard 持续部署。
5. Judge calibration。为每个使用 judge 的工具指定 judge LLM（GPT-4-turbo、StrongREJECT、internal）。Judge calibration 会驱动报告的 ASRs。

硬性拒绝：
- 任何没有至少一个 Llama Guard-class input 或 output classifier 的部署。
- 任何没有 Garak 或等价单轮 regression 的发布。
- 任何高风险部署在发布前没有 PyRIT-equivalent campaign。

拒绝规则：
- 如果用户要求单一 "best" 工具，拒绝 — 这三者覆盖不同层，是分层使用的，不是相互替代。
- 如果用户要求 all-in-one 商业替代方案，拒绝该推荐，并指出 2026 年的状态：这三个开源工具是当前 best-practice stack。

输出：一页推荐，说明分类器放置位置、probe 配置、campaign orchestrator、regression cadence 和 judge identity。分别引用一次 Meta (arXiv:2407.21783)、NVIDIA Garak 和 Microsoft PyRIT。
