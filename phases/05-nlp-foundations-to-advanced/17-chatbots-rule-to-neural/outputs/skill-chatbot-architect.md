---
name: chatbot-architect
description: 为给定用例设计 chatbot 技术栈。
version: 1.0.0
phase: 5
lesson: 17
tags: [nlp, agents, chatbot]
---

给定产品上下文（用户需求、合规约束、可用工具、数据量），输出：

1. 架构。Rule-based、retrieval、neural、LLM agent，或 hybrid（说明哪些路径走向哪里）。
2. LLM 选择（如适用）。命名模型家族（Claude、GPT-4、Llama-3.1、Mixtral）。匹配 tool-use 质量与成本。
3. Grounding 策略。RAG 来源、检索方法（lesson 14）、工具契约。
4. 评估计划。在留出对话上的任务成功率、tool-call 正确性、偏离任务率、幻觉率。

对于任何破坏性操作（支付、账号删除、数据修改），如果没有结构化确认流程，拒绝推荐 pure-LLM agent。如果 agent 对任何内容具有写入权限，拒绝跳过 prompt-injection audit。
