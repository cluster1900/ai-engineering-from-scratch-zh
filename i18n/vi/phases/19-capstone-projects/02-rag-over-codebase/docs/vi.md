# Capstone 02  Codebase 上的 RAG(跨 Repo Tìm kiếm ngữ nghĩa)

> 2026 năm, mỗi tổ chức kỹ thuật nghiêm ngặt sẽ chạy một công trình có thể hiểu ý nghĩa và không chỉ phù hợp với mã tìm kiếm nội bộ của chuỗi.

**类型：**Capstone
**语言：**Python(nghĩa) 、TypeScript(API + UI)
**前置要求：**Giai đoạn 5 (nền tảng NLP) Giai đoạn 7 (những người biến đổi) Giai đoạn 11 (kỹ thuật LLM) Giai đoạn 13 (các công cụ) Giai đoạn 17 (tếch cơ sở hạ tầng)
**练习到的 Phases：**P5 · P7 · P11 · P13 · P17
**时间：**30 小时

## 问题
Đến năm 2026, mỗi đại lý mã hóa biên giới sẽ chuẩn bị cho các lớp lấy lại mã, bởi vì chỉ dựa vào các cửa sổ ngữ cảnh không thể giải quyết được các vấn đề ở repo ở ở ở ở ở ở ở 1M-Token của Claude có ích; nhưng nó sẽ không loại bỏ nhu cầu về việc lấy lại xếp hạng.

Bạn sẽ thông qua chỉ mục một nhóm hạm đội thực tế để học được điều này, thay vì chỉ chỉ chỉ mục một repo hướng dẫn, và đo MRR@10、 trích dẫn trung thành và độ tươi mới tăng dần── các chế độ thất bại đều là ở cấp cơ sở hạ tầng: một monorepo tệp 100k、 một lần thay đổi một nửa tệp、 một phải vượt qua bốn repos 才能 trả lời đúng câu hỏi──

## 概念
AST-thông thức đường ống thụ sử dụng tree-sitter 解析每个文件,提取函数和类节点,并在节点边界而不是固定 Token windows 上切 chunk。 mỗi chunk 会得到三种表示:dense Embedding(Voyage-code-3 或 nomic-embed-code) ̇sparse BM25 thuật ngữ,以及一句简短的自然语言摘要──摘要 增加了第三种可检索模态:用户会问 如何是 X授权,而摘要会提到 authz,即使代码里只有`check_permission`

Khám phá là một bộ sưu tập hợp hợp chất. Một truy vấn 会同时触发密集 和 BM25 tìm kiếm,合并 top-k,并把联盟 交给跨编码重新排名(Cohere rerank-3 或 bge-reranker-v2-gemma-2b) ・重新排名列 会进入长文段合成器(带快速缓存的Claude Sonnet 4.7,或自主主主机Llama 3.3 70B),并要求每个索赔都用 和线程范围引用;;没有引用的答案文件将被后过拒绝;;

Sự tươi mới tăng lên là vấn đề cơ sở hạ tầng. Gít đẩy 会触发 khác nhau: những tài liệu đã thay đổi, những biểu tượng đã thay đổi. Chỉ có những mảnh bị ảnh hưởng sẽ được tái nhúng.

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
- Phân tích:带 17 种语言 ngữ pháp của cây-sitter ((Python、TS、Rust、Go、Java、C++ 等)
- Thiết lập mật:Voyage-code-3(hosted) hoặc nomic-embed-code-v1.5(self-host),bge-code-v1 fallback
- Chỉ số Sparse:带 BM25F 的 Tantivy(Rust), đối với tên biểu tượng 和 thân làm cân bằng trường
- Dây DB:Qdrant 1.12, hỗ trợ tìm kiếm lai; hoặc đối diện với 50M dây 以下团队的 pgvector + pgvectorskala
- Mô hình tổng kết phân đoạn: Claude Haiku 4.5 hoặc Gemini 2.5 Flash, với bộ nhớ cache nhanh
- Tỷ lệ xếp hạng lại:Cohere renank-3 hoặc tự托管 bge-renanker-v2-gemma-2b
- Orchestration:LlamaIndex Workflows dùng để hấp thụ,LangGraph dùng để truy vấn
- Synthesizer:Claude Sonnet 4.7 ((1M context),带 prompt caching
- Chữ biểu tượng:Neo4j(được quản lý) hoặc kuzu(đã nhúng), được sử dụng để nhập khẩu và các cạnh gọi
- Khả năng quan sát: mỗi bước lấy + tổng hợp của Langfuse trải dài


```figure
ce-hybrid-retrieval
```

##  xây dựng nó
1. **Ingestion walker。**Trong mỗi nút bấm 上遍历 git lịch sử。 thu thập các tập tin đã thay đổi。 đối với mỗi tập tin, sử dụng tree-sitter 解析,提取 hàm 和 lớp nút  và toàn bộ nguồn span。输出 chunk record `{repo, path, start_line, end_line, symbol, body}`

2. **Chunk summarizer。**将 chunks 批量打包进 Haiku 4.5 cuộc gọi, và sử dụng trình ghi nhớ nhanh trên hệ thống.

3. **Embedding pool。**两个并行队列:density(Voyage-code-3 batch 128) và tổng kết(同一个模型,但输入总结字符串)`{repo, path, start_line, end_line, symbol, kind}`

4. **BM25 index。**Chỉ số Tantivy có trọng lượng trường:tín hiệu tên trọng lượng 4,tín hiệu trọng lượng cơ thể 1,tín tích tổng thể 2。 nó既支持  Tìm hàm có tên X 查询,也支持  Tìm hàm làm X 查询。

5. **Symbol graph。**Đối với mỗi phần  biên ghi chép: nhập khẩu(hơn tập tin này sử dụng từ biểu tượng repo Z của Y) 、 gọi(hơn chức năng này 调用 lớp C trên phương pháp M) 、 thừa kế。存入 kuzu。 trong thời gian truy vấn sử dụng nó xuyên biên giới repo 扩展检索。

6. **Query agent。**包含三个节点的 LangGraph──`retrieve`并行触发 密度 + BM25,按 (repo, path, symbol) 去重──`rerank`Trong top-50 上运行 cross-encoder,并保留 top-10。`synth`调用 Claude Sonnet 4.7,把重新排名的块 放进文本,缓存系统提示,并要求文件:line citations──

7. **Citation enforcement。**解析 mô hình đầu ra; bất cứ gì `(repo/path:start-end)`Đề xuất của Anchor sẽ được đánh dấu là yêu cầu lại hoặc bị bỏ rơi. Chỉ để người dùng trả lời lại với câu trả lời được trích dẫn.

8. **Incremental re-index。**Mỗi lần webhook, tính toán biểu tượng cấp độ khác nhau. Chỉ cần tái nhúng 文本发生变化的块.

9. **Eval。**标注 100 个跨 repo câu hỏi,并给出黄金文件:line answers──衡量MRR@10、nDCG@10、引用忠诚度(带可验证 ancors的索赔比例) 以及p50/p99 latency──

## Sử dụng nó
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

## 交付 nó
Kỹ năng được giao `outputs/skill-codebase-rag.md`△给定一组 repos 语料, nó có thể khởi động đường ống thụ, index lai và trình đơn truy vấn,并为任何跨 repo 问题返回带引用的答案── Rubric:

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Retrieval quality | 在 100-question held-out set 上的 MRR@10 和 nDCG@10 |
| 20 | Citation faithfulness | answer claims 中带可验证 file:line anchors 的比例 |
| 20 | Latency and scale | 在 indexed corpus size 上 10k QPS 时的 p95 query latency |
| 20 | Incremental indexing correctness | 从 git push 到可被搜索的时间，在 50-file commit 上衡量 |
| 15 | UX and answer formatting | Citation 可点击性、snippet previews、follow-up affordance |
| **100** | | |

## 练习
1. Để thay thế Voyage-code-3 thành tự-hỗ trợ nomic-embed-code──衡量 MRR@10 delta── báo cáo bắt đầu xếp hạng lại 后差距是否缩小──

2. 向 corpus 注入 20% code được tạo ra (LLM-produced boilerplate)并重新评估──观察 lấy lại độc hại──向 payload 添加一个生成旗,并降低权重──

3. Trong quy mô cơ thể của bạn trên điểm tham khảo tìm kiếm lai Qdrant với pgvector + pgvector quy mô.

4. 添加一个基于样本的漂移检查:每周重新运行100问题 eval──当 MRR@10 下降 > 5% 时告警──

5. 扩展到跨语言符号解析度:一个Python function 通过gRPC 调用Go service──使用符号图将它们关联起来──

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
- [Sourcegraph Amp](https://ampcode.com) Kiểm tra mã liên quan đến cấp 生产
- [Sourcegraph Cody RAG architecture](https://sourcegraph.com/blog/how-cody-understands-your-codebase) 本 capstone 的参考 sâu lặn
- [Aider repo-map](https://aider.chat/docs/repomap.html) tree-sitter 排序的 repo 视图
- [Augment Code enterprise graph](https://www.augmentcode.com) 商业 biểu tượng biểu đồ RAG
- [Qdrant hybrid search docs](https://qdrant.tech/documentation/concepts/hybrid-queries/) Thực hiện tham chiếu
- [Voyage AI code embeddings](https://docs.voyageai.com/docs/embeddings) Chi tiết về mã hành trình-3
- [Cohere rerank-3](https://docs.cohere.com/reference/rerank) Quý vị liên kết mã hóa chéo
- [Pinterest MCP internal search](https://medium.com/pinterest-engineering) nền tảng nội bộ 参考
