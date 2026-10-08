#  面向受监管垂直领域的生产RAG聊天机器人

> 哈维、格林、可调用和LlamaCloud 在2026年都运行同样的生产 形态──使用 docling 或非结构化以及面向视觉内容的 ColPali 进行摄入──混合搜索──使用 bge-reranker-v2-gemma 重新排序──使用Claude Sonnet 4.7 合成,并通过快速缓存 达到60-80%的击率──使用 Llama Guard 4 和 NeMo Guardrails 防护──使用 Langfuse 和 Phoenix 观测──使用RAGAS 在200个题的黄金套评分上分──在监管领域(法律、临床、保险) 构建一个系统,这个顶点标准是通过黄金套和漂移团队和仪表板────

**Type:** Capstone
**Languages:** Python (pipeline + API), TypeScript (chat UI)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**五·七·十一·十二·十七·十八
**Time:** 30 小时

## 问题
监管领域的RAG(法律合同、临床试验方案、保险保单) 是2026年最常交付到生产的形态,因为ROI明确,风险也很具体.哈维 (艾伦和奥维) 为法律场景构建了它.

难点不在模型――难点是司法管辖意识的合规性(HIPAA、GDPR、SOC2) 引用 级别的审计性、成本控制(当击率 很高时,快速缓存可带来 60-90% 折扣) 通过RAGAS忠诚度 进行幻觉检测,以及当源文档更新但索引未跟上时进行漂移检测――这个顶点 要求你在200题黄金套上交付完整系统,并配套红团套套――

## 概念
管道有两侧.**Ingestion**文件或无结构解析结构化文档;ColPali 处理视觉丰富的文档;分类 会获得总结、标签和基于角色的访问标签──矢量 进入pgvector + pgvectorskala(低于50M矢量) 或Qdrant Cloud;sparse BM25并行运行──**Conversation**通过Llama Guard 4 和 NeMo Guardrails 处理输出,并发出引用结的响应――

评估堆有四层.**Golden set**为了正确性,使用200个引用的标签.**Red team**(监狱中,试图获取PII,问题不在域内) 用于安全性.**RAGAS**自动逐轮评估忠诚性/答案相关性/文本精确性──**Drift dashboard**监控检查质量和幻觉评分.

快速缓存是成本杆──Claude 4.5+ 和 GPT-5+ 支持缓存系统提示+检索文本──在60至80%的击率下,单次查询 成本下降3-5x──管道必须围绕稳定前设计(系统提示+重新排名文本首先),以实现高缓存击率──

## 架构
```
documents（contracts, protocols, policies）
      |
      v
docling / Unstructured parse + 用于 visuals 的 ColPali
      |
      v
chunks + summaries + role-labels + jurisdiction tags
      |
      v
pgvector + pgvectorscale  +  BM25 (Tantivy)
      |
query + role + jurisdiction
      |
      v
LangGraph conversational agent
   +--- retrieve (hybrid)
   +--- 按 role + jurisdiction 过滤
   +--- rerank (bge-reranker-v2-gemma-2b or Voyage rerank-2)
   +--- synthesize (Claude Sonnet 4.7, prompt cached)
   +--- guard (Llama Guard 4 + NeMo Guardrails + Presidio output PII scrub)
   +--- cite + return
      |
      v
eval:
  RAGAS faithfulness / answer_relevance / context_precision（online）
  Langfuse annotation queue（sampled）
  Arize Phoenix drift（weekly）
  red team suite（pre-release）
```

## 技术
- 摄入: 用 Unstructured.io 或 docling 处理结构化文档;用 ColPali 处理视觉丰富的 PDF 文件
- 矢量DB: 低于50M矢量时使用pgvector + pgvectorskale;否则使用Qdrant Cloud
- 带场重量 的Tantivy BM25
- 编排:LlamaIndex工作流程(内存) + 长图(对话)
- 排名:自托管 bge-reanker-v2-gemma-2b 或主机旅行排名-2
- 带快速缓存的Claude Sonnet 4.7;倒退为自主托管的Llama 3.3 70B
- ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
- 观察性:自主主主持的Langfuse,带注释队列;Arize Phoenix 用于漂移
- 防护轨道:Llama Guard 4输出分类器,NeMo Guardrails v0.12政策,Presidio PII扫描
- 合规性:部分上的角色基于访问标签;用于GDPR/HIPAA的管辖区标签


```figure
canary-rollout
```

## 构建它
1. **Ingestion.**使用未结构化或文档解析你的作品 (通常为1000-10000个文档) ⋅对于扫描页面/视觉密集页面,路由到ColPali──生成带总结、角色标签、司法管辖标签的部分──

2. **Index.**密集嵌入式 ((Voyage-3 或 Nomic-embed-v2)写入 pgvector + pgvector尺度──通过Tantivy 建立BM25侧索引──角色和管辖区过器作为有效载荷──

3. **Hybrid retrieve.**先按角色+管辖权 过;然后并行密集 + BM25;用相互级合并 合并;前-20 送进重排;前-5 送进合成──

4. **Synthesize with prompt caching.**系统提示+静态政策 放置缓存标题;重新排名的文本 作为缓存扩展;用户问题 作为未缓存后尾──稳定状态 目标是60~80%的缓存击中率──

5. **Guardrails.**输入经过Llama Guard 4;NeMo Guardrails轨道 阻止域外问题或政策禁止的话题;Presidio 清理输出中的意外 PII;引文执行后过──

6. **Golden set.**由领域专家标注 200个Q/A对,包含 (答案,引用) ⋅根据准确引用匹配、答案正确度、忠诚度 (RAGAS) 对代理评分──

7. **Red team.**五十个对抗提示:入狱入入入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入境入入入境入境入境入境入入入境入境入入境入入入入入境入入入入境入入入入境入入入入入入境入入入入境入入入入境入入入入入入入入入入入入入境入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入入

8. **Drift dashboard.**鱼每周追踪检索质量 (nDCG 引用忠诚度) 鱼下降5% 时告警警

9. **Cost report.**按阶段分拆的$/query──

## 使用它
```
$ chat --role=analyst --jurisdiction=GDPR
> 根据我们的合同，EU 用户资料的数据保留义务是什么？
[retrieve]  hybrid top-20 filtered to GDPR + analyst-role
[rerank]    top-5 kept
[synth]     claude-sonnet-4.7, cache hit 74%, 0.8s
answer:
  该合同（Section 12.4, Master Services Agreement dated 2024-03-11）
  要求在终止后 30 天内删除 EU 用户资料，以遵守 GDPR
  Article 17。DPA amendment（DPA-v2.1, Section 5）将该期限扩展为
  “restricted”类别数据的 14 天。
  citations: [MSA-2024-03-11 s12.4, DPA-v2.1 s5]
```

## 交付它
`outputs/skill-production-rag.md`描述可交付的内容. 一部署在监管领域的聊天机器人,带有合规标签,通过条款,并使用现场漂移监测.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | RAGAS faithfulness + answer relevance | golden set（200 Q/A）上的 online scores |
| 20 | Citation correctness | 带可验证 source anchors 的 answers 占比 |
| 20 | Guardrail coverage | Llama Guard 4 pass rate + jailbreak suite results |
| 20 | Cost / latency engineering | Prompt-cache hit rate、p95 latency、$/query |
| 15 | Drift monitoring dashboard | Phoenix live dashboard，带每周 retrieval-quality trend |
| **100** | | |

## 练习
1. 在另一个司法管辖区 下构建第二个体格片 (例如在GDPR之外加入HIPAA) ⋅在20个题目跨司法管辖区调查上展示角色+司法管辖区过 如何防止跨司法管辖区泄露――

2. 测量一周的生产流量的快速缓存击率――找出哪些查询破坏了缓存前――重新组织――

3. 添加带10k代币总结缓冲的多转记忆量与对话增长,忠诚性 是否下降

4. 将克劳德·索尼特4.7 替换为自主托管的Llama 3.3 70B──测量$/查询 和忠诚的德尔塔──

5. 添加 不确定模式:如果最高重排分数低于门,代理说我没有自信的引用,而不是回答.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Prompt caching | “Cached system + context” | Claude/OpenAI 功能：cache hit 时 cached prefix tokens 可享 60-90% 折扣 |
| RAGAS | “RAG evaluator” | 自动评分 faithfulness、answer relevance、context precision |
| Golden set | “Labeled eval” | 200+ 个专家标注的带 citations 的 Q/A；ground truth |
| Jurisdiction tag | “Compliance label” | 附加到 chunks 的 GDPR/HIPAA/SOC2 scope；由 retrieval filter 强制执行 |
| Citation faithfulness | “Grounded answer rate” | 由可检索 source spans 支撑的 claims 占比 |
| Drift | “Retrieval quality decay” | nDCG 或 citation score 的每周变化；alert threshold 5% |
| Red team | “Adversarial eval” | Pre-release jailbreak、PII extraction、off-domain probes |

## 延伸阅读
- [Harvey AI](https://www.harvey.ai) 参考法律生产堆
- [Glean enterprise search](https://www.glean.com)企业规模 下的参考RAG
- [Mendable documentation](https://mendable.ai)开发人员文件 RAG 参考
- [LlamaCloud Parse + Index](https://docs.llamaindex.ai/en/stable/examples/llama_cloud/llama_parse/)管理摄入
- [Anthropic prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) 成本杆参考
- [RAGAS 0.2 documentation](https://docs.ragas.io/) 标准RAG评估框架
- [Arize Phoenix](https://github.com/Arize-ai/phoenix) 参考漂移可观测性
- [Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/)2026年安全分类
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/)政策铁路框架
