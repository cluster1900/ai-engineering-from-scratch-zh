# Capstone 02  कोडबेस 上的 RAG(跨 Repo सेमेन्टिक खोज)

> 2026 साल, प्रत्येक कठोर इंजीनियरिंग संगठन एक ऐसा शहर चलाएगा जो अर्थ को समझ सकता है और केवल एक स्ट्रिंग के आंतरिक कोड खोज को मेल नहीं खाता है। SourceGraph Amp、Cursor के कोडबेस उत्तर、Augment के उद्यम ग्राफ、Aider के repomap、Pinterest के आंतरिक MCP, आकार में एक ही है।

**类型：**कैपस्टोन
**语言：**पायथन(इंग्ज़ेशन) 、टाइपस्क्रिप्ट(एपीआई + UI)
**前置要求：**चरण 5 (NLP नींव) चरण 7 (ट्रांसफॉर्मर) चरण 11 (LLM इंजीनियरिंग) चरण 13 (उपकरण) चरण 17 (संरचना)
**练习到的 Phases：**P5 · P7 · P11 · P13 · P17
**时间：**30 小时

## 问题
2026 तक, प्रत्येक सीमा कोडिंग एजेंट को कोडबेस रिट्रीवल लेयर के लिए तैयार किया जाएगा, क्योंकि केवल संदर्भ विंडो पर ∞ पार रेपो ∞ समस्या को हल नहीं किया जा सकता है। क्लाउड का 1M-टोकन संदर्भ उपयोगी है; लेकिन यह रैंक प्राप्त करने की आवश्यकता को समाप्त नहीं करेगा। कच्चे टुकड़ों के लिए सरल कॉस्सीन खोज करें, उत्पन्न कोड में सरल खोज करें, मोनोरेपो डुप्लिकेट करें, साथ ही बहुत कम आयात किए गए प्रतीकों के साथ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ 

आप एक ट्यूटोरियल रेपो को इंडेक्स करने के बजाय, इस बिंदु को सीखने के लिए एक वास्तविक बेड़े के एक समूह को इंडेक्स करेंगे, और MRR@10 को मापेंगे, उद्धरण निष्ठा और वृद्धिशील ताज़ापन।

## 概念
एएसटी-जागरूक सेवन पाइपलाइन उपयोग वृक्ष-सितार 解析 प्रत्येक फाइल,提取 फ़ंक्शन 和 वर्ग नोड्स, और नोड सीमाओं में बजाय फिक्स्ड टोकन विंडो 上切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 切 `check_permission`

रिट्रीवल है हाइब्रिड के. एक क्वेरी 会同时触发密集 和 BM25 खोजें,合并 top-k,并把 संघ 交给跨编码重新排名(Cohere rerank-3 或 bge-reranker-v2-gemma-2b) ⋅ पुनः排名 सूची 会进入长文段合成器(带即时缓存的Claude Sonnet 4.7,或自主主托管的Llama 3.3 70B),并要求每个索赔都用 和线程范围 引用──没有引用的答案文件会被后过拒绝──

अतिरिक्त ताज़ापन बुनियादी ढांचे का मुद्दा है। यह एक अंतर है: कौन से फाइलें बदल गई हैं, कौन से प्रतीक बदल गए हैं। केवल प्रभावित टुकड़े ही बदल गए हैं।

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
- पार्सिंग:带 17 种语言语法的树-sitter(पायथन、TS、Rust、Go、Java、C++ इत्यादि)
- घने एम्बेडिंग्स:यात्रा-कोड-3(होस्ट) या नाम-एम्बेड-कोड-v1.5(स्व-होस्ट),bge-कोड-v1 fallback
- स्परस सूचकांक:带 BM25F 的 Tantivy(रस्ट), प्रतीकों के नाम 和 शरीर के लिए किया गया क्षेत्र-वजन
- वेक्टर DB:Qdrant 1.12, हाइब्रिड खोज का समर्थन; या 50M वेक्टर की ओर मुड़ो
- टुकड़ा सारांश मॉडलःक्लाउड हैकु 4.5 या मिथुन 2.5 फ्लैश, रैपिड कैशिंग के साथ
- पुनर्गठनःसहयोगी पुनर्गठन-3 या स्व托管 bge-पुनर्गठन-v2-gemma-2b
- ऑर्केस्ट्रेशनःLlamaIndex वर्कफ़्लोस इंगेजमेंट के लिए,LangGraph क्वेरी एजेंट के लिए
- संश्लेषक:क्लाउड सोनेट 4.7 ((1M संदर्भ),带 शीघ्र कैशिंग
- प्रतीक ग्राफःNeo4j(प्रबंधित) या kuzu(इम्बेड), आयात के लिए तथा कॉल किनारों के लिए
- अवलोकनशीलताः प्रत्येक पुनर्प्राप्ति + संश्लेषण चरण के Langfuse स्पैन


```figure
ce-hybrid-retrieval
```

##  इसे निर्माण
1. **Ingestion walker。**प्रत्येक पुश हुक में ऊपर से गुजरना इतिहास में गया गया है। संग्रह में बदल गई फ़ाइलें। प्रत्येक फ़ाइल के लिए, पेड़-सइटर के साथ, 解析,提取 फ़ंक्शन और वर्ग नोड्स  और इसके पूर्ण स्रोत अवधि।`{repo, path, start_line, end_line, symbol, body}`

2. **Chunk summarizer。**इस फ़ंक्शन को एक वाक्य के साथ संक्षेप में प्रस्तुत करें, इसका सार्वजनिक अनुबंध और दुष्प्रभावों को समझाएं।

3. **Embedding pool。**两个并行队列:density(Voyage-code-3 batch 128)和总结(同一个模型,但输入总结字符串)`{repo, path, start_line, end_line, symbol, kind}`

4. **BM25 index。**क्षेत्र-वजनित टैंटिवी सूचकांकः प्रतीक नाम वजन 4, प्रतीक शरीर वजन 1, संक्षेप वजन 2── यह既支持 X 查询 नामक फ़ंक्शन खोजें,也支持 X 查询 करते फ़ंक्शन खोजें──

5. **Symbol graph。**प्रत्येक टुकड़े के लिए रिकॉर्ड किनारों:आयात(यह फ़ाइल रेपो Z के प्रतीक Y) 、कॉल से आती है(यह फ़ंक्शन 调用了C वर्ग M) 、 विरासत──存入 kuzu──在查询时间中使用它跨 repo सीमा 扩展检索──

6. **Query agent。**包含三个节点的 LangGraph──`retrieve`并行触发 घन + BM25,按 (रिपो, पथ, प्रतीक) 去重──`rerank`शीर्ष-50 में क्रॉस-एन्कोडर चलाने के लिए, शीर्ष-10 को बनाए रखें।`synth`调用Claude Sonnet 4.7,把重排块 放进文本,缓存系统提示,并要求文件:line citations──

7. **Citation enforcement。**解析 मॉडल आउटपुट;任何没有 `(repo/path:start-end)`एंकर का दावा है कि इसे पुनः पूछने या छोड़ने के लिए चिह्नित किया जाएगा।

8. **Incremental re-index。**प्रत्येक वेबहुक में, गणना प्रतीक स्तर भिन्नताएँ  केवल पुनः सम्मिलित करना 文本发生发生变的块──为进口发生变的块 重新计算符号边缘── मापने का लक्ष्य: 2M-LOC बेड़े पर, एक बार 50 फ़ाइल धक्का के पुनः सूचकांक 60 सेकंड में पूरा करें

9. **Eval。**标注 100 个跨 repo प्रश्न,并给出金档:line answers──衡量MRR@10、nDCG@10、引用忠诚度(带可验证 एंकर के दावे उदाहरण) तथा p50/p99 विलंबता──

## इसका उपयोग करें
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

## 交付 यह
उपलब्ध कौशल `outputs/skill-codebase-rag.md`△ दिए एक सेट repos 语料, यह शुरू कर सकता है सेवन पाइपलाइन、 हाइब्रिड सूचकांक 和 क्वेरी एजेंट,并 किसी भी跨 repo  प्रश्न के लिए वापसी带引用的答案── Rubric:

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Retrieval quality | 在 100-question held-out set 上的 MRR@10 和 nDCG@10 |
| 20 | Citation faithfulness | answer claims 中带可验证 file:line anchors 的比例 |
| 20 | Latency and scale | 在 indexed corpus size 上 10k QPS 时的 p95 query latency |
| 20 | Incremental indexing correctness | 从 git push 到可被搜索的时间，在 50-file commit 上衡量 |
| 15 | UX and answer formatting | Citation 可点击性、snippet previews、follow-up affordance |
| **100** | | |

## अभ्यास
1.                                                                                                                                                                                                                                                               

2. ओर corpus 注入 20% उत्पन्न कोड (LLM-उत्पादित बॉयलरप्लेट)并重新评估──观察 पुनर्प्राप्ति विषाक्तता──向 उपयोगिता भार 添加一个生成旗,并降低这些击的权重──

3. अपने शरीर आकार में ऊपर बेंचमार्क Qdrant हाइब्रिड खोज के साथ pgvector + pgvector पैमाने में।

4. 添加一个样本式漂移检查:每周重新运行100 प्रश्न eval──当 MRR@10 下降 > 5% 时告警──

5. 扩展到跨语言符号解析度:一个Python函数 通过gRPC 调用Go सेवा──使用符号图将它们关联起来──

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
- [Sourcegraph Amp](https://ampcode.com) 生产级 क्रॉस-रेपो कोड इंटेलिजेंस
- [Sourcegraph Cody RAG architecture](https://sourcegraph.com/blog/how-cody-understands-your-codebase) 本 capstone 的参考 गहरे गोताखोरी
- [Aider repo-map](https://aider.chat/docs/repomap.html) पेड़-sitter 排序的 repo 视图
- [Augment Code enterprise graph](https://www.augmentcode.com) 商业 प्रतीक-ग्राफ RAG
- [Qdrant hybrid search docs](https://qdrant.tech/documentation/concepts/hybrid-queries/) संदर्भ कार्यान्वयन
- [Voyage AI code embeddings](https://docs.voyageai.com/docs/embeddings) यात्रा-कोड-3 विवरण
- [Cohere rerank-3](https://docs.cohere.com/reference/rerank) क्रॉस-कोडर संदर्भ
- [Pinterest MCP internal search](https://medium.com/pinterest-engineering) आंतरिक मंच 参考
