# 卡普斯通 02 代码基础上的RAG(跨 Repo语义搜索)

> 2026年,每个严的工程组织都会运行一个能理解意义而不仅仅是匹配字符串的内部代码搜索――源图 Amp、Cursor 的代码库答案、Augment 的企业图、Aider 的复制图、Pinterest 的内部MCP,形态都一样――摄入多个备份,使用树座解析,对函数和类级别的部分做嵌入,混合搜索,重新排名,并使用引用 回答──本标题石 要求你构建一个系统:能处理 10 个备份中 2M 行代码,并能在每次推进后完成增进重新索引──

**类型：**石头
**语言：**字符串的使用方式
**前置要求：**阶段第五期 (NLP基础) 阶段第七期 (转型器) 阶段第十一期 (LLM工程) 阶段第十三期 (工具) 阶段第十七期 (基础设施)
**练习到的 Phases：**五·七·十一·十三·十七
**时间：**30 小时

## 问题
到2026年,每个边境编码代理都将准备编码库检索层,因为仅靠文本窗口无法解决跨 repo 问题;;Claude的1M-Token文本有帮助;但它不会消除排名检索需求;;对原始块做简单的代码搜索,将在生成代码、monorepo重复,以及很少被进口的符号 长尾上污染结果;;生产级答案是:在AST意识的块上做混合型(dense + BM25) 搜索,加上重新排名,并由符号引用图支.

你会通过索引一组真实机队来学习这一点,而不是仅仅索引一个教程备考,并衡量MRR@10、引用忠诚度和增量新鲜度──失败模式都是基础设施层面的:一个100k文件单机备考"",一次改动一半文件的推动"",一个必须跨四个备考才能正确回答查询──

## 概念
通过使用树座器解析每个文件,提取函数和类节点,并将节点界限而不是固定的代币窗户 上切块.每个块会得到三种表示:密集嵌入 () 旅行代码-3或名义嵌入代码) 节 BM25术语,以及一句简短的自然语言摘要.摘要增加了第三种可检索模态:用户会问 X是如何授权的,而摘要会提到 authz,即使代码里只有`check_permission`,我知道.

查询会同时触发密集和BM25搜索,合并 top-k,并把联盟交给跨编码重新排名的名单 (Cohere rerank-3 或 bge-reranker-v2-gemma-2b) ◎重新排名的名单 会进入长文本合成器(带即时缓存的Claude Sonnet 4.7,或自主托管的Llama 3.3 70B),并要求每个索赔都用 和线程范围引用;;没有引用的答案将被后过 拒绝.

增长新鲜性是基础设施问题. 按会触发不同:哪些文件变了,哪些符号变了. 只有受影响的部分会重新嵌入.

## 架构
```
git push --> webhook --> ingest worker (LlamaIndex Workflow)
                           |
                           v
             tree-sitter parse + AST chunk
                           |
            +--------------+----------------+
            v              v                v
          dense        BM25 index       summary (LLM)
        (Voyage / bge)  (Tantivy)        (Haiku 4.5)
            |              |                |
            +------> Qdrant / pgvector <----+
                            |
                            v
                      symbol graph (Neo4j / kuzu)
                            |
  query --> LangGraph agent (retrieve -> rerank -> synth)
                            |
                            v
                 Claude Sonnet 4.7 1M context
                            |
                            v
                 answer + file:line citations
```

## 技术
- 解析:带 17种语言语法的树手 (Python、TS、Rust、Go、Java、C++等)
- 密集嵌入式:旅行代码-3(托管) 或名字嵌入式代码-v1.5(自主托管),bge-code-v1倒退
- 率指数:带 BM25F 的率(率),对符号名称和体做场重量
- 矢量DB:Qdrant 1.12,支持混合搜索;或面向50M矢量 以下团队的pgvector + pgvectorskala
- 部分摘要模型:Claude Haiku 4.5 或 Gemini 2.5 闪存,带快速缓存
- 排名:Cohere排名-3或自托管 bge-排名-2b
- 编排:LlamaIndex工作流 用于摄入,长图 用于查询代理
- 合成器:Claude Sonnet 4.7 ((1M文本),带快速缓存
- 符号图:Neo4j(管理) 或 kuzu(嵌入式),用于进口和调用边缘
- 观察性:每个检索+合成步骤的长跨度


```figure
ce-hybrid-retrieval
```

## 构建它
1. **Ingestion walker。**在每个按上遍历的历史──收集已更改的文件──对每个文件,使用树座器解析,提取函数和类节点及其完整的源跨度──输出分类记录`{repo, path, start_line, end_line, symbol, body}`,我知道.

2. **Chunk summarizer。**将块量打包进海库4.5调用,并在系统序言上使用快速缓存.

3. **Embedding pool。**两个并行队列:密集的旅行码-3批量128) 和总结的模型`{repo, path, start_line, end_line, symbol, kind}`,我知道.

4. **BM25 index。**字段权重的蒂维指数:符号名称重量4,符号体重量1,总重量2──它既支持 找到名为X查询的函数,也支持 找到X查询的函数──

5. **Symbol graph。**对于每个分块记录边缘:进口(这个文件使用来自 repo Z 的符号 Y) 、调用了C类上方的方法 M) 、继承──存入 kuzu──在查询时间使用它跨 repo 边界 扩展检索──

6. **Query agent。**包含三个节点的长图.`retrieve`并行触发密集 + BM25,按 (回应,路径,符号) 去重──`rerank`在前50上运行跨编码器,并保留前10`synth`调用Claude Sonnet 4.7,把重新排名的块 放入文本,缓存系统提示,并要求文件:行引用──

7. **Citation enforcement。**解析模型输出;任何没有`(repo/path:start-end)`号的索赔将被标记为重新请求或丢弃.

8. **Incremental re-index。**每次网,计算符号水平不同――只重新嵌入文本发生变化的块――为进口发生变化的块 重新计算符号边缘――衡量目标:对2M-LOC舰队进行一次50档案推进的重新索引在60秒内完成――

9. **Eval。**标签100个跨回复问题,并给出黄金文件:线答量──衡量MRR@10、nDCG@10、引用忠诚度(带可验证 anchors的索赔比如) 以及p50/p99延迟──

## 使用它
```
$ code-rag ask "how is S3 multipart abort wired into our retry budget?"
[retrieve]  12 chunks dense + 7 chunks bm25, 16 unique after dedup
[rerank]    top-5 kept (cohere rerank-3)
[synth]     claude-sonnet-4.7, cache hit rate 68%, 2.1s
answer:
  Multipart aborts are triggered by `AbortMultipartOnFail` in
  services/uploader/retry.go:122-148, which decrements the per-bucket
  retry budget defined in config/budgets.yaml:34-51 ...
  citations: [services/uploader/retry.go:122-148, config/budgets.yaml:34-51,
              libs/s3client/multipart.ts:44-61]
```

## 交付它
能提供的技能`outputs/skill-codebase-rag.md`△给定一组备份语料,它可以启动摄入管道、混合指数和查询代理,并为任何跨备份 问题返回带引用的答案──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Retrieval quality | 在 100-question held-out set 上的 MRR@10 和 nDCG@10 |
| 20 | Citation faithfulness | answer claims 中带可验证 file:line anchors 的比例 |
| 20 | Latency and scale | 在 indexed corpus size 上 10k QPS 时的 p95 query latency |
| 20 | Incremental indexing correctness | 从 git push 到可被搜索的时间，在 50-file commit 上衡量 |
| 15 | UX and answer formatting | Citation 可点击性、snippet previews、follow-up affordance |
| **100** | | |

## 练习
1. 将旅行代码-3 替换为自主托管的名义嵌入代码――衡量MRR@10 delta――报告启动重新排名后差距是否缩小――

2. 向 corpus 注入20%生成代码 (LLM生产的炉板)并重新评估――观察检索中毒――向有效载荷 添加一个生成旗,并降低这些击中的权重――

3. 在你的体积上,基准 Qdrant混合搜索与pgvector +pgvector尺度.

4. 增加一个基于样本的漂移检查:每周重新运行100个问题评估――当MRR@10 下降 > 5% 时告警――

5. 扩展到跨语言符号分辨率:一个Python函数 通过gRPC调用Go服务──使用符号图将它们关联起来──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| AST-aware chunking | “Function-level splits” | 在 tree-sitter node boundaries 而不是固定 Token windows 上切分代码 |
| Hybrid search | “Dense + sparse” | 并行运行 BM25 和 Vector search，合并 top-k，然后 rerank |
| Cross-encoder rerank | “Second-stage rank” | 将每个 (query, candidate) pair 放在一起评分的 model，比 cosine 更准确 |
| Prompt caching | “Cached system prompt” | 2026 年 Claude / OpenAI feature，可将重复 prefix Tokens 最高折扣 90% |
| Symbol graph | “Code graph” | 跨 files 和 repos 的 imports、calls、inheritance edges |
| Citation faithfulness | “Grounded answer rate” | 用户可以通过点击 anchor 并阅读 referenced span 来验证的 claims 比例 |
| Incremental re-index | “Push-to-search time” | 从 git push 到 changed symbols 可被查询的 wall-clock 时间 |

## 延伸阅读
- [Sourcegraph Amp](https://ampcode.com) 生产级跨度代码智能
- [Sourcegraph Cody RAG architecture](https://sourcegraph.com/blog/how-cody-understands-your-codebase) 本顶石的参考深度潜水
- [Aider repo-map](https://aider.chat/docs/repomap.html)树 排序的回复 视图
- [Augment Code enterprise graph](https://www.augmentcode.com) 商业象征图RAG
- [Qdrant hybrid search docs](https://qdrant.tech/documentation/concepts/hybrid-queries/)参考实施
- [Voyage AI code embeddings](https://docs.voyageai.com/docs/embeddings)旅行代码-3详细信息
- [Cohere rerank-3](https://docs.cohere.com/reference/rerank)跨编码器参考
- [Pinterest MCP internal search](https://medium.com/pinterest-engineering)内部平台 参考
