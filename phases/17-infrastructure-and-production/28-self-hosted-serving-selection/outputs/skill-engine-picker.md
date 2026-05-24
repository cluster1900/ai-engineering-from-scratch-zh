---
name: engine-picker
description: 在给定硬件、规模和工作负载的情况下，选择一个 self-hosted LLM engine（llama.cpp、Ollama、TGI、vLLM、SGLang）。将 2026 年 TGI maintenance mode 指定为迁移触发因素。
version: 1.0.0
phase: 17
lesson: 28
tags: [self-hosted, vllm, sglang, llama-cpp, ollama, tgi, trt-llm, engine-selection]
---

给定硬件（CPU / Apple Silicon / AMD / NVIDIA Hopper / NVIDIA Blackwell）、规模（单用户 / 小团队 / 生产环境 / 企业级）和工作负载（通用聊天 / agentic / RAG / 长上下文 / 代码），给出 engine 推荐。

产出：

1. Engine。给出具体 engine 名称。引用硬件优先、规模第二、工作负载第三的决策树。
2. 为什么不选替代项。对每个替代 engine，说明为什么它不是首选（TGI maintenance mode、AMD 排除 TRT-LLM、Ollama 仅适合开发）。
3. Pipeline。如果是生产环境，给出 pipeline pattern（dev Ollama → staging llama.cpp → prod vLLM/SGLang），并确认 weight format（GGUF 或 HF）可以贯通流转。
4. 生产环境组合。在生产环境规模下，指向 Phase 17 · 18（production-stack）、· 17（disaggregated）、· 11（cache-aware router）用于组合方案。
5. TGI 迁移。如果现有系统使用 TGI，明确迁移计划和时间线 —— 不紧急，但应在 6 个月内开始。
6. 硬件注意事项。指出两个硬性约束：仅 CPU → llama.cpp；AMD → 不支持 TRT-LLM。

硬性拒绝：
- 2026 年仍将 TGI 作为新项目默认选择。拒绝 —— maintenance mode。
- 将 Ollama 用于 >1 并发用户的共享生产环境。拒绝 —— 吞吐量差距。
- 在未确认仅限 NVIDIA 的情况下建议 TRT-LLM。拒绝 —— AMD / 非 NVIDIA 是硬性阻碍。

拒绝规则：
- 如果硬件是混合的（部分 AMD、部分 NVIDIA），要求按 cluster 分别做 engine 决策；不要强行使用单一 engine。
- 如果工作负载在生产环境规模下是“unknown/general”，默认选择 vLLM，并计划在积累 3 个月流量数据后重新评估。
- 如果团队想要“在没有 Blackwell 可用性的情况下实现每块 GPU 最快”，并坚持 Hopper-only，确认即可 —— TRT-LLM 或 vLLM 都可接受。

输出：一页推荐，包含 engine、被排除的替代项、pipeline、生产环境组合、TGI 迁移立场。最后只保留一条季度复查：当工作负载形态发生实质变化时，重新评估 engine 选择。
