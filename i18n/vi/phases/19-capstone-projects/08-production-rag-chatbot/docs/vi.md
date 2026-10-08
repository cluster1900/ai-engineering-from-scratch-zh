# Capstone 08  面向受监管垂直领域的生产RAG Chatbot

> Harvey、Glean、Mendable 和 LlamaCloud trong 2026 năm đều chạy cùng một sản xuất 形态── sử dụng docling hoặc Unstructured 以及面向视觉内容的 ColPali 进行摄入──Hybrid search── sử dụng bge-reranker-v2-gemma 重新排序── sử dụng Claude Sonnet 4.7 合成,并通过快速缓存 达到 60-80% hit rate──使用 Llama Guard 4 和 NeMo Guardrails 防护──使用 Langfuse 和 Phoenix 观测──使用 RAGAS 在 200 题 黄金套评分 上分──在监管领域(法律、临床、保险) 构建一个系统,这个顶点标准是通过黄金套设和漂移团队 和仪表板──

**Type:** Capstone
**Languages:** Python (pipeline + API), TypeScript (chat UI)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P5 · P7 · P11 · P12 · P17 · P18
**Time:** 30 小时

## 问题
Trong lĩnh vực giám sát RAG( hợp đồng pháp luật、 thử nghiệm lâm sàng方案、保险保单) là hình thức giao hàng thường nhất đến sản xuất năm 2026, vì ROI 明确,风险 cũng rất cụ thể.Harvey (Allen & Overy) xây dựng nó cho bối cảnh pháp luật.

难点不在模型──难点是管辖区意识的遵守(HIPAA、GDPR、SOC2) 引用 级别的审计性、成本控制(当击率 很高时,快速缓存可带来 60-90% 折扣) 通过RAGAS trung thành 进行幻觉检测,以及当源文档更新但索引未跟上时进行漂移检测──这个顶点 要求你在200题黄金套上交付完整系统,并配套红团套套──

## 概念
Đường ống có hai bên.**Ingestion**:docling hoặc Unstructured 解析结构化文档;ColPali 处理视觉丰富的文档;chunks 会获得总结、tags 和角色基准访问标签。Vectors 进入pgvector + pgvector scale(低于50M vectors) hoặc Qdrant Cloud;sparse BM25 并行运行。**Conversation**:LangGraph  xử lý bộ nhớ và nhiều lượt; mỗi truy vấn  thực hiện truy xuất lai, sử dụng bge-reranker-v2-gemma-2b tái xếp hạng, sử dụng Claude Sonnet 4.7(quan nhanh) tổng hợp, thông qua Llama Guard 4 和 NeMo Guardrails  xử lý输出,并发出引用扎响应──

Đánh giá xếp hàng có bốn tầng.**Golden set**(200 个带引用的标注 Q/A) dùng để chính xác.**Red team**(giá khóa, cố gắng lấy PII, các câu hỏi ngoài lĩnh vực) được sử dụng cho an toàn.**RAGAS**tự động đánh giá từng vòng sự trung thành / phù hợp với câu trả lời / chính xác trong bối cảnh.**Drift dashboard**(Arize Phoenix) Hỏi kiểm tra hàng tuần về chất lượng và điểm ảo giác.

Caching nhanh là成本杆──Claude 4.5+ 和 GPT-5+ 支持缓存 hệ thống nhắc + lấy lại ngữ cảnh──在 60-80% hit rate 下,单次查询 成本下降 3-5x──管线 必须围绕稳定前设计(系统提示 + xếp hạng lại ngữ cảnh trước), để đạt được tỷ lệ hit cache cao──

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
- Tiêu thụ: dùng Unstructured.io hoặc docling  xử lý cấu trúc hóa tài liệu; dùng ColPali  xử lý video phong phú PDF
- Vector DB: 低于 50M vector 时使用 pgvector + pgvector scale;否则使用 Qdrant Cloud
- Sparse: 带 trọng lượng trường của Tantivy BM25
- 编排: LlamaIndex Workflows(ngháp) + LangGraph(sự nói chuyện)
- Đơn vị xếp hạng lại: 自托管 bge-ranker-v2-gemma-2b hoặc tổ chức Voyage
- LLM: 带 prompt caching của Claude Sonnet 4.7; fallback vì tự lưu trữ Llama 3.3 70B
- Eval: RAGAS 0.2 online, DeepEval dùng cho ảo giác và jailbreak suite
- Khả năng quan sát: Langfuse tự lưu trữ,带 dòng ghi chú;Arize Phoenix dùng để dẫn dắt
- Guardrails: Llama Guard 4 phân loại đầu vào/ ra ngoài,NeMo Guardrails v0.12 chính sách,Presidio PII scrub
- Theo dõi: các phần trên của các nhãn truy cập dựa trên vai trò; được sử dụng thẻ pháp lý của GDPR/HIPAA


```figure
canary-rollout
```

##  xây dựng nó
1. **Ingestion.**Sử dụng Unstructured hoặc docling 解析 your corpus (tự xây dựng nghiêm túc thường là 1000-10000 个文档) ⋅ Đối với các trang quét / 视觉密集页面,路由到 ColPali──生成带总结、角色标签、管辖标签的块──

2. **Index.**Thiết lập mật độ ((Voyage-3 hoặc Nomic-embed-v2)写入 pgvector + pgvector scale──通过Tantivy 建立BM25 side-index──Role 和 jurisdiction filters──作为有效载荷──

3. **Hybrid retrieve.**先按角色+管辖权 过;然后并行密集 + BM25;用相互级合并 合并;top-20 送进重排;top-5 送进合成──

4. **Synthesize with prompt caching.**Hệ thống prompt + chính sách tĩnh  đặt tiêu đề cache;được xếp hạng lại ngữ cảnh  như mở rộng cache; user question  như hậu tố không được lưu trữ cache。 trạng thái ổn định 目标是 60-80% tỷ lệ hit cache。

5. **Guardrails.**输入经过 Llama Guard 4;NeMo Guardrails rail 阻止域外问题或政策禁止主题;Presidio 清理输出中的意外PII;引号执法后过──

6. **Golden set.**By lĩnh vực chuyên gia 标注 200 个 Q/A cặp,包含 (trả lời, trích dẫn) ⋅ theo chính xác-quoting phù hợp、trả lời chính xác、truyền (RAGAS) đối với đại lý 评分。

7. **Red team.**50 个 个 đối lập: jailbreaks(PAIR、TAP)、PII cố gắng thoát khỏi miền 、bỏ qua pháp lý──用 pass/fail 和 nghiêm trọng 评分──

8. **Drift dashboard.**Arize Phoenix 每周跟踪检索质量 (nDCG, 引用忠诚度) ⋅ 下降 5% 时告警, ⋅

9. **Cost report.**Langfuse: tốc độ lưu trữ hit ∞ token mỗi truy vấn ∞ theo giai đoạn phân chia của $/ truy vấn ∞

## Sử dụng nó
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

## 交付 nó
`outputs/skill-production-rag.md`mô tả được giao tiếp. Một bộ phận trong lĩnh vực giám sát chatbot, mang nhãn tuân thủ, thông qua rubric,并 sử dụng giám sát drift trực tiếp.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | RAGAS faithfulness + answer relevance | golden set（200 Q/A）上的 online scores |
| 20 | Citation correctness | 带可验证 source anchors 的 answers 占比 |
| 20 | Guardrail coverage | Llama Guard 4 pass rate + jailbreak suite results |
| 20 | Cost / latency engineering | Prompt-cache hit rate、p95 latency、$/query |
| 15 | Drift monitoring dashboard | Phoenix live dashboard，带每周 retrieval-quality trend |
| **100** | | |

## 练习
1. Trong một thẩm quyền khác 下构建第二个体片 (例如在GDPR之外加入HIPAA) ⋅ 在 20 bài thi điều tra liên bang thẩm quyền 上展示角色+司法过 如何防止跨界泄漏──

2. 测量一周生产 lưu lượng truy cập  prompt-cache hit rate── tìm ra những truy vấn 破坏 cache prefix──重新组织──

3. 添加带 10k-token summary buffer của bộ nhớ nhiều lượt.

4. Để thay thế cho Llama 3.3 70B.

5. 添加 不确定模式: Nếu điểm số được xếp hạng lại cao hơn 低于门, đại lý nói  Tôi không có trích dẫn tự tin, thay vì trả lời.

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
- [Harvey AI](https://www.harvey.ai) 参考法律 sản xuất hàng đống
- [Glean enterprise search](https://www.glean.com) quy mô doanh nghiệp 下的参考RAG
- [Mendable documentation](https://mendable.ai) các nhà phát triển-doc RAG 参考
- [LlamaCloud Parse + Index](https://docs.llamaindex.ai/en/stable/examples/llama_cloud/llama_parse/) Tiêu thụ quản lý
- [Anthropic prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) 成本杆参考
- [RAGAS 0.2 documentation](https://docs.ragas.io/) 标准 RAG framework eval
- [Arize Phoenix](https://github.com/Arize-ai/phoenix) 参考 drift observability
- [Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/) Định dạng an toàn 2026
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) Quản lý đường sắt chính sách
