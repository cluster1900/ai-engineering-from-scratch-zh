# Capstone 08 — 面向受监管垂直领域的生产级 RAG Chatbot

> 到 2026 年，Harvey、Glean、Mendable 和 LlamaCloud 都采用相同的生产架构。使用 docling 或 Unstructured 摄取内容，并使用 ColPali 处理视觉内容。采用混合搜索。使用 bge-reranker-v2-gemma 重新排序。使用 Claude Sonnet 4.7 进行合成，并以 60-80% 的命中率使用 Prompt caching。使用 Llama Guard 4 和 NeMo Guardrails 提供防护。使用 Langfuse 和 Phoenix 进行监控。基于包含 200 个问题的 Golden set，使用 RAGAS 进行评分。在受监管领域（法律、临床、保险）构建一个系统，Capstone 的通过标准是通过 Golden set、Red team 和漂移 Dashboard。

**Type:** Capstone
**Languages:** Python（pipeline + API）、TypeScript（Chat UI）
**Prerequisites:** Phase 5（NLP）、Phase 7（Transformer）、Phase 11（LLM Engineering）、Phase 12（Multimodal）、Phase 17（基础设施）、Phase 18（安全）
**Phases exercised:** P5 · P7 · P11 · P12 · P17 · P18
**Time:** 30 小时

## 问题

受监管领域的 RAG（法律合同、临床试验方案、保险政策）是 2026 年交付最多的生产架构，因为它的 ROI 显而易见，风险也十分具体。Harvey（Allen & Overy）为法律领域构建了这套系统。Mendable 提供开发者文档版本。Glean 覆盖企业搜索。其模式是：以高保真度摄取内容，通过重新排序执行混合检索，使用引文强制和 Prompt caching 进行合成，通过多层安全机制提供防护，并持续监控漂移。

困难之处不在 Model，而在于能够感知司法管辖区的合规性（HIPAA、GDPR、SOC2）、引文级别的可审计性、成本控制（Prompt caching 命中率较高时可获得 60-90% 的折扣）、通过 RAGAS 忠实度检测幻觉，以及在源文档已经更新但索引未能同步时检测漂移。本 Capstone 要求你围绕包含 200 个问题的 Golden set 交付所有这些能力，并同时提供一套 Red team 测试。

## 概念

Pipeline 包含两个部分。**摄取**：docling 或 Unstructured 解析结构化文档；ColPali 处理视觉内容丰富的文档；分块会获得摘要、标签和基于角色的访问标签。Vector 被写入 pgvector + pgvectorscale（Vector 数量少于 5000 万）或 Qdrant Cloud；稀疏 BM25 与其并行运行。**对话**：LangGraph 处理记忆和多轮交互；每个查询都会执行混合检索、使用 bge-reranker-v2-gemma-2b 重新排序、使用 Claude Sonnet 4.7（启用 Prompt caching）进行合成、让输出通过 Llama Guard 4 和 NeMo Guardrails，并生成以引文为锚点的响应。

Evaluation stack 包含四层。**Golden set**（200 组带引文标签的 Q/A）用于验证正确性。**Red team**（jailbreak、PII 提取尝试、领域外问题）用于验证安全性。**RAGAS** 在每一轮自动评估忠实度、答案相关性和 Context 精度。**漂移 Dashboard**（Arize Phoenix）每周监控检索质量和幻觉分数。

Prompt caching 是控制成本的关键手段。Claude 4.5+ 和 GPT-5+ 支持缓存 system Prompt + 检索到的 Context。当命中率达到 60-80% 时，单次查询成本可降低 3-5 倍。Pipeline 必须围绕稳定前缀进行设计（system Prompt + 重新排序后的 Context 放在前面），以获得较高的缓存命中率。

## 架构

```
文档（合同、方案、政策）
      |
      v
docling / Unstructured 解析 + ColPali 处理视觉内容
      |
      v
分块 + 摘要 + 角色标签 + 司法管辖区标签
      |
      v
pgvector + pgvectorscale  +  BM25 (Tantivy)
      |
查询 + 角色 + 司法管辖区
      |
      v
LangGraph 对话 Agent
   +--- 检索（混合）
   +--- 按角色 + 司法管辖区过滤
   +--- 重新排序（bge-reranker-v2-gemma-2b 或 Voyage rerank-2）
   +--- 合成（Claude Sonnet 4.7，启用 Prompt caching）
   +--- 防护（Llama Guard 4 + NeMo Guardrails + Presidio 输出 PII 清理）
   +--- 引用 + 返回
      |
      v
Evaluation：
  RAGAS 忠实度 / answer_relevance / context_precision（在线）
  Langfuse 标注队列（抽样）
  Arize Phoenix 漂移（每周）
  Red team 测试套件（发布前）
```

## 技术栈

- 摄取：使用 Unstructured.io 或 docling 处理结构化文档；使用 ColPali 处理视觉内容丰富的 PDF
- Vector DB：Vector 数量少于 5000 万时使用 pgvector + pgvectorscale；否则使用 Qdrant Cloud
- 稀疏检索：使用带字段权重的 Tantivy BM25
- 编排：LlamaIndex Workflows（摄取）+ LangGraph（对话）
- Re-ranker：自托管 bge-reranker-v2-gemma-2b 或托管式 Voyage rerank-2
- LLM：启用 Prompt caching 的 Claude Sonnet 4.7；回退方案为自托管 Llama 3.3 70B
- Evaluation：在线使用 RAGAS 0.2，使用 DeepEval 运行幻觉和 jailbreak 测试套件
- 可观测性：带标注队列的自托管 Langfuse；使用 Arize Phoenix 监控漂移
- Guardrails：Llama Guard 4 输入/输出分类器、NeMo Guardrails v0.12 策略、Presidio PII 清理
- 合规：分块上的基于角色的访问标签；用于 GDPR/HIPAA 的司法管辖区标签

```figure
canary-rollout
```

## 构建

1. **摄取。** 使用 Unstructured 或 docling 解析语料库（严肃的构建应包含 1000-10000 份文档）。对于扫描页面或视觉内容较多的页面，通过 ColPali 进行路由。生成带摘要、角色标签和司法管辖区标签的分块。

2. **建立索引。** 将 Dense Embedding（Voyage-3 或 Nomic-embed-v2）写入 pgvector + pgvectorscale。通过 Tantivy 建立 BM25 辅助索引。将角色和司法管辖区过滤条件作为 payload。

3. **混合检索。** 首先按角色和司法管辖区过滤；然后并行执行稠密检索和 BM25；使用 reciprocal rank fusion 合并；将前 20 个结果交给 Re-ranker；将前 5 个结果交给合成阶段。

4. **使用 Prompt caching 进行合成。** 将 system Prompt + 静态策略放入缓存头；将重新排序后的 Context 作为缓存扩展；将用户问题作为不缓存的后缀。稳定运行时，目标缓存命中率为 60-80%。

5. **Guardrails。** 对输入使用 Llama Guard 4；NeMo Guardrails rails 阻止领域外问题或策略禁止的主题；Presidio 清理输出中意外出现的 PII；使用后置过滤器强制执行引文要求。

6. **Golden set。** 由领域专家标注 200 组 Q/A，每组包含（答案、引文）。基于精确引文匹配、答案正确性和忠实度（RAGAS）对 Agent 评分。

7. **Red team。** 准备 50 个对抗性 Prompt：jailbreak（PAIR、TAP）、PII 外泄尝试、领域外问题、跨司法管辖区泄漏。使用通过/失败和严重程度进行评分。

8. **漂移 Dashboard。** Arize Phoenix 每周跟踪检索质量（nDCG、引文忠实度）。下降 5% 时发出警报。

9. **成本报告。** Langfuse：Prompt caching 命中率、每次查询的 Token 数、按阶段拆分的每次查询成本。

## 使用

```
$ chat --role=analyst --jurisdiction=GDPR
> 根据我们的合同，EU 用户资料的数据保留义务是什么？
[retrieve]  混合检索前 20 个结果，已按 GDPR + analyst-role 过滤
[rerank]    保留前 5 个结果
[synth]     claude-sonnet-4.7，缓存命中率 74%，0.8s
答案：
  合同（2024-03-11 签订的 Master Services Agreement，第 12.4 节）
  要求根据 GDPR 第 17 条，在终止后 30 天内删除 EU 用户资料。
  DPA 修正案（DPA-v2.1，第 5 节）针对“受限”类别数据，
  将此期限进一步缩短至 14 天。
  引文：[MSA-2024-03-11 s12.4, DPA-v2.1 s5]
```

## 交付

`outputs/skill-production-rag.md` 描述了交付物。这是一个部署于受监管领域、带有合规标签、通过评分标准验证，并使用实时漂移监控进行观测的 Chatbot。

| 权重 | 标准 | 衡量方式 |
|:-:|---|---|
| 25 | RAGAS 忠实度 + 答案相关性 | Golden set（200 组 Q/A）上的在线分数 |
| 20 | 引文正确性 | 包含可验证来源锚点的答案比例 |
| 20 | Guardrail 覆盖率 | Llama Guard 4 通过率 + jailbreak 测试套件结果 |
| 20 | 成本/延迟工程 | Prompt cache 命中率、p95 延迟、每次查询成本 |
| 15 | 漂移监控 Dashboard | 展示每周检索质量趋势的 Phoenix 实时 Dashboard |
| **100** | | |

## 练习

1. 在不同司法管辖区下构建第二个语料库切片（例如，在 GDPR 之外增加 HIPAA）。使用包含 20 个问题的跨司法管辖区探测集，证明角色和司法管辖区过滤能够防止跨域泄漏。

2. 测量一周生产流量中的 Prompt cache 命中率。找出哪些查询会破坏缓存前缀。重新设计其结构。

3. 添加使用 10k Token 摘要缓冲区的多轮记忆。测量忠实度是否会随着对话增长而下降。

4. 将 Claude Sonnet 4.7 替换为自托管 Llama 3.3 70B。测量每次查询成本和忠实度差异。

5. 添加“不确定”模式：如果重新排序后的最高分低于阈值，Agent 不回答问题，而是说明“我没有可信度足够高的引文”。测量错误自信的降低程度。

## 关键术语

| 术语 | 人们通常怎么说 | 实际含义 |
|------|-----------------|------------------------|
| Prompt caching | “缓存 system + Context” | Claude/OpenAI 功能：命中时，缓存的前缀 Token 可获得 60-90% 的折扣 |
| RAGAS | “RAG 评估器” | 自动评估忠实度、答案相关性和 Context 精度 |
| Golden set | “带标签的 Evaluation” | 200 组以上由专家标注且带引文的 Q/A；作为 Ground truth |
| 司法管辖区标签 | “合规标签” | 附加到分块上的 GDPR/HIPAA/SOC2 范围；由检索过滤器强制执行 |
| 引文忠实度 | “有依据的答案比例” | 可由检索到的来源片段支持的声明比例 |
| 漂移 | “检索质量衰减” | nDCG 或引文分数的每周变化；警报阈值为 5% |
| Red team | “对抗性 Evaluation” | 发布前的 jailbreak、PII 提取和领域外探测 |

## 延伸阅读

- [Harvey AI](https://www.harvey.ai) — 法律领域生产技术栈参考
- [Glean 企业搜索](https://www.glean.com) — 企业规模 RAG 参考
- [Mendable 文档](https://mendable.ai) — 开发者文档 RAG 参考
- [LlamaCloud Parse + Index](https://docs.cloud.llamaindex.ai/llamaparse/getting_started) — 托管式摄取
- [Anthropic Prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) — 成本控制手段参考
- [RAGAS 0.2 文档](https://docs.ragas.io/) — 规范的 RAG Evaluation framework
- [Arize Phoenix](https://github.com/Arize-ai/phoenix) — 漂移可观测性参考
- [Llama Guard 4](https://www.llama.com/docs/model-cards-and-prompt-formats/llama-guard-4/) — 2026 年安全分类器
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) — 策略 rail framework
