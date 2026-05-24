---
name: sampling-tuner
description: 为给定的生成任务选择 decoding strategy（greedy / temperature / top-k / top-p / min-p / speculative）。
version: 1.0.0
phase: 7
lesson: 7
tags: [gpt, sampling, decoding, inference]
---

给定一个生成任务（代码、创意写作、推理、对话、结构化输出）以及延迟/质量目标，输出：

1. Sampling method。以下之一：greedy、temperature-only、top-k、top-p、min-p、beam-k、speculative。用一句话说明原因。
2. Parameter values。Temperature、top-k、top-p、min-p、repetition penalty — 给出与任务类型绑定的具体数值。（例如：代码使用 temperature 0.2 + top-p 1.0；聊天使用 min-p 0.1 + temperature 0.7。）
3. Stop conditions。`max_new_tokens`、stop Token 列表、基于模式的 stop（例如闭合 `</tool_call>`）。
4. Determinism toggle。固定 seed 以保证可复现性；标明该用例（eval、legal）是否需要它。
5. Quality check。针对任务目标的一行测试（编译/通过 unit tests、事实性、格式有效性等）。

拒绝为结构化输出或代码补全推荐 temperature > 1.0 — hallucination 风险会显著上升。拒绝为开放式对话推荐纯 greedy — 模型会循环。 当模型可能生成模板/tools 时，如果没有指定 stop Token 列表，则拒绝交付 sampling config。
