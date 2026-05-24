---
name: production-rag
description: 部署一个受监管领域的 RAG chatbot，具备角色 + 司法辖区过滤、prompt caching、guardrails 和实时 drift monitoring。
version: 1.0.0
phase: 19
lesson: 08
tags: [capstone, rag, chatbot, regulated, llama-guard, nemo-guardrails, ragas, langfuse]
---

给定一个受监管领域语料库（法律合同、临床试验方案、保险保单或类似内容），部署一个 chatbot，能够用可验证引用进行回答，遵守角色和司法辖区访问策略，并接受 drift monitoring。

构建计划：

1. 使用 docling 或 Unstructured 解析语料库；将视觉信息丰富的文档路由到 ColPali。输出带有角色和司法辖区标签的 chunks。
2. 将 dense（Voyage-3 或 Nomic-embed-v2）索引到 pgvector + pgvectorscale；通过 Tantivy 建立 sparse BM25。
3. 连接 LangGraph conversational agent：retrieve（按角色 + 司法辖区过滤，hybrid dense+BM25，reciprocal rank fusion）、rerank（bge-reranker-v2-gemma-2b 或 Voyage rerank-2）、synth（Claude Sonnet 4.7，启用 prompt caching）。
4. 使用稳定前缀组装 prompts：system preamble -> policy block -> reranked context -> user query。目标 prompt-cache hit rate 为 60-80%。
5. Guardrails：在输入和输出上使用 Llama Guard 4，使用 NeMo Guardrails v0.12 rails 处理 off-domain 和策略禁止的问题，在输出上使用 Presidio PII scrub，并执行 citation enforcement post-filter。
6. 构建一个包含 200 个问题、由专家标注的 golden set，带有（answer, citations）。按 exact-citation match、answer correctness、RAGAS faithfulness 评分。
7. 构建一个 50-prompt red team（PAIR、TAP、PII extraction、off-domain、cross-jurisdiction probes）。
8. Arize Phoenix drift dashboard 每周跟踪 retrieval nDCG 和 citation faithfulness；在下降 5% 时告警。
9. Langfuse cost report：prompt-cache hit rate、tokens per query、按阶段统计的 $/query。

评估标准：

| Weight | Criterion | Measurement |
|:-:|---|---|
| 25 | RAGAS faithfulness + answer relevance | 200-question golden set 上的在线分数 |
| 20 | Citation correctness | 带有可验证 source anchors 的答案占比 |
| 20 | Guardrail coverage | Llama Guard 4 pass rate + jailbreak suite result |
| 20 | Cost / latency engineering | Prompt-cache hit rate、p95 latency、$/query |
| 15 | Drift monitoring dashboard | 带有每周 retrieval-quality 趋势的实时 Phoenix dashboard |

硬性拒收：

- 任何泄露 cross-jurisdiction data 的 chatbot。必须在 retrieval 之前强制执行 role+jurisdiction filtering，而不是之后。
- 破坏 cache prefixes 的 synthesis prompts（在 system 和 context 之间重排 policy）。这会摧毁 cache economics。
- 没有记录 red-team runs 的 guardrail 配置。
- 没有 citations 的答案；没有可验证 anchors 的 citations。

拒绝规则：

- 如果每个 chunk 上没有 jurisdiction tags，拒绝在受监管领域部署。
- 拒绝使用专家标注的 golden set 问题来训练 retrieval。污染会摧毁 eval 可信度。
- 如果 README 中没有明确的 SOC2/HIPAA/GDPR applicability matrix，拒绝声称“compliant”。

输出：一个 repo，其中包含 ingestion pipeline、LangGraph conversational agent、200-question golden set、50-prompt red team、Phoenix drift dashboard、Langfuse cost dashboard，以及一份 write-up，说明你观察到的前三种 citation-breakage patterns，并给出每一种对应的 retrieval 或 prompt 修复方案。
