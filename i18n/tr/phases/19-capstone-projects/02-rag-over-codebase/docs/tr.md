# Capstone 02  Codebase 上的 RAG(跨 Repo Semantic Search)

> 2026 yıl, her ciddi mühendislik organizi sadece bir kod arayışı değil anlamı anlayabilen bir kod arama yapacaktır. Source Graph Amp、Cursor'un kod tabanı cevapları、Augment'ın işletme grafi、Aider'in repomap、Pinterest'ın iç MCP'leri, şekillidir.

**类型：**Kap taşı
**语言：**Python(İçimi) 、TypeScript(API + UI)
**前置要求：**5. aşama (NLP temelleri) 7. aşama (transformatörler) 11. aşama (LLM mühendisliği) 13. aşama (örnekler) 17. aşama (infrastür)
**练习到的 Phases：**P5 · P7 · P11 · P13 · P17
**时间：**30 saat

## 问题
2026 yılına kadar, her sınır kodlama ajanı, sadece bağlam pencerelerinde çözülemez olduğu için kod tabanı geri alım aşamasına hazır olacak. Claude'un 1M-Token bağlamı yardımcı olacaktır. Ancak sıralama geri alım ihtiyacını ortadan kaldırmayacaktır.

Bu konuyu öğrenmek için bir ders repo'sunu indeksilemek yerine, MRR@10'u ölçmek ve bu yüzden de bu şekilde bir dizi yenilik ve yenilik yaparak bir dizi referans oluşturmak gerekir.

## 概念
AST-Ağır içme borusu kullan ağaç-sitter 解析每个文件,提取 function 和 class nodes, ve node boundaries instead of fixed Token windows 上切 chunk。 her chunk 会得到三种表示:dense Embedding(Voyage-code-3 veya nomic-embed-code)、sparse BM25 terimleri,以及一句简短的自然语言概要──概要 增加了第三种可检索模态:用户会问 如何是X授权,而概要会提到 authz,即使代码里只有`check_permission`- Evet.

Retrieval is hybrid of──一个查询 会同时触发密集 和 BM25 aramaları,合并 top-k,并把 union 交给跨编码重排器(Cohere rerank-3 或 bge-reranker-v2-gemma-2b)──重排列列列 会进入长文本合成器(带快速缓存的Claude Sonnet 4.7,或自主主主机Llama 3.3 70B),并要求每个索赔都用 和线域引用──没有引用的答案文件将被后过拒绝──

Gelişmiş tazelik, altyapı sorunudır. Git push 会触发 diff: hangi dosyalar değişti, hangi semboller değişti. Sadece etkilenen parçalar yeniden yerleştirilmektedir.

## Yapılandırma
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
- Parsing:带 17 种语言语法的树-sitter(Python、TS、Rust、Go、Java、C++等)
- Sıkı yerleşimler:Voyage-code-3(hosted) veya nomik-embed-code-v1.5(self-host),bge-code-v1 fallback
- Çöp indeksi:带 BM25F 的 Tantivy(Kırıklık), simge adı 和 vücut yapma alan ağırlığı
- Vektör DB:Qdrant 1.12, hibrid arama destekleme; veya 50M vektörlere bakım aşağıdaki grup pgvector + pgvector ölçeği
- Bölüm özetli modeli:Claude Haiku 4.5 veya Gemini 2.5 Flash, çabuk önbelleğe alınması
- Yeniden sıralama:Cohere renank-3 veya自托管 bge-renanker-v2-gemma-2b
- Orkestra:LlamaIndex İş akışları, sorgu ajanı için kullanılır
- Sintezör:Claude Sonnet 4.7 ((1M bağlamı),带 prompt caching
- Simge grafiği:Neo4j( yönetilen) veya kuzu( gömülü), ithalat için kullanılır
- Gözlem: Her çekim + sentez adım ̆ Langfuse uzanır


```figure
ce-hybrid-retrieval
```

## Yapın onu.
1. **Ingestion walker。**Bu, her bir dosyanın değişik dosyalarını toplamak için kullanılır.`{repo, path, start_line, end_line, symbol, body}`- Evet.

2. **Chunk summarizer。**Bu fonksiyonu, açıklama ve yan etkileri ile açıklamak için bir cümle kullanın.

3. **Embedding pool。**两个并行队:densse(Voyage-code-3 batch 128)和总结(同一个模型,但输入总结 string) ――将向量 写入 Qdrant,并带上 payload `{repo, path, start_line, end_line, symbol, kind}`- Evet.

4. **BM25 index。**Alan ağırlığı Tantivy indeksi:simbol adı ağırlığı 4,simbol vücut ağırlığı 1,cadı ağırlığı 2。

5. **Symbol graph。**Bu dosya her parça için repo Z simgesi Y'den kullanılır. Bu fonksiyon C sınıfının üstündeki yöntem M'yi kullanıyor.

6. **Query agent。**包含三个节点的 LangGraph──`retrieve`并行触发 dense + BM25,按 (repo, yol, sembol) 去重──`rerank`En üst 50'de, en üst 10'da kalmadı.`synth`调用 Claude Sonnet 4.7,把重新排列的块 放进文本,缓存系统提示,并要求文件:line citations──

7. **Citation enforcement。**解析 model çıkışı; herhangi hiç `(repo/path:start-end)`Anchor'ın iddiaları yeniden sormak veya terk etmek için işaretlenmiştir. Sadece kullanıcıya geri dönmekle alıntılı cevaplar ile.

8. **Incremental re-index。**Her webhauk 时,计算符号级别差──只重新嵌入文本发生变化的块──为进口发生变化的块 重新计算符号边──衡量目标:对2M-LOC filos,一次50文件推的重索引在60秒内完成──

9. **Eval。**标注100 个跨 repo soru,并给出金档:line answers──衡量MRR@10、nDCG@10、引用忠诚度(带可验证 ancors的索赔例如) 以及 p50/p99 latency──

## Kullan
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

## - Söyle.
Yapabilir yetenekler `outputs/skill-codebase-rag.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                    

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Retrieval quality | 在 100-question held-out set 上的 MRR@10 和 nDCG@10 |
| 20 | Citation faithfulness | answer claims 中带可验证 file:line anchors 的比例 |
| 20 | Latency and scale | 在 indexed corpus size 上 10k QPS 时的 p95 query latency |
| 20 | Incremental indexing correctness | 从 git push 到可被搜索的时间，在 50-file commit 上衡量 |
| 15 | UX and answer formatting | Citation 可点击性、snippet previews、follow-up affordance |
| **100** | | |

## 练习
1. Yolculuk-kod-3'ü kendi kendine konutlanmış isim-özel kodlara değiştirmek için kullanmak.

2. Korkma,                                                                                                                                                                                                                                                             

3. Üst referans Qdrant hibrid arama ile pgvector + pgvector ölçeği.

4. 添加一个基于样本的漂移检查:每周重新运行100问题 eval──当 MRR@10 下降 > 5% 时告警──

5. 扩展到跨语言符号解析:一个Python函数 通过gRPC 调用Go service──使用符号图将它们关联起来──

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
- [Sourcegraph Amp](https://ampcode.com) 生产级 çapraz rapor kod istihbaratı
- [Sourcegraph Cody RAG architecture](https://sourcegraph.com/blog/how-cody-understands-your-codebase) 本 capstone 的参考 derin dalış
- [Aider repo-map](https://aider.chat/docs/repomap.html) ağaç bekçisi 排序的 repo 视图
- [Augment Code enterprise graph](https://www.augmentcode.com) 商业 sembol-grafi RAG
- [Qdrant hybrid search docs](https://qdrant.tech/documentation/concepts/hybrid-queries/) Referans uygulanması
- [Voyage AI code embeddings](https://docs.voyageai.com/docs/embeddings) Gezi kodu-3 detayları
- [Cohere rerank-3](https://docs.cohere.com/reference/rerank) Çaplak kodlayıcı referansı
- [Pinterest MCP internal search](https://medium.com/pinterest-engineering) İçerideki platform 参考
