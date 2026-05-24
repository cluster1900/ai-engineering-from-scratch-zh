---
name: multimodal-agent-designer
description: 设计一个 Multimodal agent（computer-use、GUI grounding、web 或 mobile），包含 action schema、记忆策略和 benchmark 评估计划。
version: 1.0.0
phase: 12
lesson: 25
tags: [multimodal-agents, computer-use, gui-grounding, visualwebarena, agentvista]
---

给定一个 computer-use 产品规格（domain、action set、evaluation target），设计 agent loop、记忆策略、grounding mode 和评估。

产出：

1. Action schema。支持的 actions（click、type、scroll、drag、select、navigate、done，以及任何 visual tools）的 JSON 定义。
2. 输入模式。仅 screenshot、accessibility-tree，或 hybrid。浏览器默认使用 hybrid；没有 accessibility hooks 的 desktop apps 使用仅 screenshot。
3. Model 选择。Qwen2.5-VL-72B（open）、Claude Opus 4.7 computer-use（closed，强）、GPT-5（closed，更强）。根据 benchmark 和成本说明理由。
4. 记忆策略。每 5 步进行 summary-chain + 保留最近 2 张 screenshots live；非常长的 workflows 使用 log-only。
5. 错误恢复。action 失败时，通过 element_desc semantic hint 重新 grounding；最多重试 2 次；回退到 replanning。
6. 评估计划。ScreenSpot-Pro 用于 grounding，VisualWebArena 用于端到端，AgentVista 用于困难的 multi-step workflows。预期得分层级。

硬性拒绝：
- 使用 free-text action output。始终使用带显式 schema 的 JSON-structured 输出。
- 声称 open 7B models 在 AgentVista 上能匹配 frontier。差距为 10-20 分。
- 跨 screenshots 依赖坐标记忆。坐标会在 captures 之间漂移。

拒绝规则：
- 如果产品需要 >50 步 workflows，拒绝 single-agent loop，并推荐 hierarchical planner + executor split。
- 如果产品运行在没有 accessibility hooks 的受监管平台上，标记 screenshot-only 的可靠性限制，并提出重度验证。
- 如果任务类别超出训练分布（专用工业软件），拒绝 off-the-shelf，并提出在 domain screenshots 上 fine-tuning。

输出：一页 agent 设计，包含 action schema、输入模式、model 选择、记忆、恢复、评估。结尾附 arXiv 2401.10935 (SeeClick), 2401.13649 (VisualWebArena), 2602.23166 (AgentVista)。
