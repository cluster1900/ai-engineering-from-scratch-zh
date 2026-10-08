# Capstone 11  LLM 可观测性与 Eval Dashboard

> Langfuse chuyển sang cốt lõi mở. Arize Phoenix  phát hành 2026 GenAI semconv 映射. Helicone 和 Braintrust 都加码按用户成本归因之.

**Type:** Capstone
**Languages:** TypeScript (UI), Python / TypeScript (ingest + evals), SQL (ClickHouse)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P11 · P13 · P17 · P18
**Time:** 25 小时

## 问题
Đến năm 2026, mỗi hoạt động sẽ có một nhóm AI 团队 sẽ ở bên cạnh mô hình 保留 một trình độ quan sát 成本归因――幻觉检测――漂移监控――jailbreak 信号――SLO bảng điều khiển――PII 泄露告警――开源参考实现  Langfuse、Phoenix、OpenLLMetry  已经围绕了 OpenTelemetry GenAI 收为摄入方案――现在你可以使用一个SDK仪器 覆盖OpenAI、Anthropic、Google、LangChain、LlamaIndex 和 vLLM,并发送兼容的跨度――

Bạn sẽ xây dựng một bảng điều khiển tự lưu trữ, nó ít nhất từ bốn loại SDK gia đình ăn, nhắm vào các dấu vết lấy mẫu 运行一小组 eval jobs,检测漂移并发告警――衡门:给定一个故意注入的回归(一个开始产生 PII的提示), bảng điều khiển có thể nắm bắt nó trong vòng 5 phút并触发告警――

## 概念
Ingest 使用 OTLP HTTP──SDK 生成 GenAI-semconv trải dài:`gen_ai.system``gen_ai.request.model``gen_ai.usage.input_tokens``gen_ai.response.id``llm.prompts``llm.completions`❖ Spans 落入 ClickHouse làm phân tích cột;metadata(users、session、app)落入 Postgres。

Evals 作为批次工作 在样本追踪 上运行──DeepEval 评估忠诚度、毒性和答案相关性──当 trace 携带检索背景时,RAGAS 评估检索指标──自定义 LLM-法官 运行域特定检查(PII rò rỉ、政策外响应)──Eval runs 会作为链接到父母追踪的评估跨度 写回同一个 ClickHouse──

Khám phá lưu động 观察随时间变化的 Embedding 空间分布(基于 prompt Embeddings 的 PSI 或 KL divergence) cũng như đánh giá điểm 趋势。Alerts 进入 Prometheus AlertManager,然后到 Slack / PagerDuty。UI 使用 Next.js 15 和 Recharts。

## 架构
```
production apps:
  OpenAI SDK  +  Anthropic SDK  +  Google GenAI SDK
  LangChain + LlamaIndex + vLLM
       |
       v
  OpenTelemetry SDK with GenAI semconv
       |
       v  OTLP HTTP
  collector (ingest, sample, fan-out)
       |
       +-------------+-----------+
       v             v           v
   ClickHouse    Postgres    S3 archive
   (spans)       (metadata)  (raw events)
       |
       +---> eval jobs (DeepEval, RAGAS, LLM-judge)
       |     sampled or all-trace
       |     write eval spans back
       |
       +---> drift detector (PSI / KL on prompt embeddings)
       |
       +---> Prometheus metrics -> Alertmanager -> Slack / PagerDuty
       |
       v
   Next.js 15 dashboard (Recharts)
```

## 技术
- Ingest: OpenTelemetry SDK + GenAI các quy ước ngữ nghĩa; OTLP HTTP vận chuyển
- Bộ sưu tập: Bộ sưu tập điện toán mở, với bộ xử lý lấy mẫu đuôi ((用于成本控制)
- lưu trữ: ClickHouse 存 span,Postgres 存 siêu dữ liệu,S3 存 raw event archive
- Evals: DeepEval, RAGAS 0.2, Arize Phoenix đánh giá gói, tùy chỉnh LLM- thẩm phán
- Drift: PSI / KL trên các tích hợp nhanh chóng (phản dịch-giới chuyển) hàng tuần
- Alert: Prometheus Alertmanager -> Slack / PagerDuty
- UI: Next.js 15 App Router + Recharts + server actions
- 开箱即用支持的 SDK: OpenAI, Anthropic, Google GenAI, LangChain, LlamaIndex, vLLM


```figure
ce-otel-drift
```

##  xây dựng nó
1. **Collector config.** cấu hình OpenTelemetry Collector, chứa máy nhận HTTP OTLP, một bộ lưu giữ dấu vết lỗi 100% và dấu vết thành công 10% của người dùng, cũng như các nhà xuất khẩu của ClickHouse và S3.

2. **ClickHouse schema.**表 `spans`của các cột 镜像 GenAI semconv:`gen_ai_system``gen_ai_request_model``input_tokens``output_tokens``latency_ms``prompt_hash``trace_id``parent_span_id`, thêm một trong những túi JSON được sử dụng để tải trọng dài.

3. **SDK coverage test.**Sử dụng mỗi SDK(OpenAI、Anthropic、Google、LangChain、LlamaIndex、vLLM) và OpenLLMetry tự động dụng cụ 编写一个小型客户端应用──验证每个 SDK 都能生成经典 GenAI span,并落入 ClickHouse──

4. **Eval jobs.**Một công việc được lên lịch 读取最近15分钟的样本痕迹,并运行 DeepEval trung thành, độc tính và sự liên quan của câu trả lời.

5. **Custom LLM-judge.**Một thẩm phán rò rỉ PII: Định một phản ứng,调用 một giám sát LLM để đánh giá khả năng rò rỉ PII.

6. **Drift detection.**Công việc hàng tuần 计算本周 汇集 nhanh chóng 嵌入与过去 4 周基线 之间的 PSI。 Nếu PSI 超过门,则告警。

7. **Dashboard.**Sử dụng Next.js 15,包含页面:view(spans/sec、cost/user、p95 latency) 、traces(search + waterfall) 、evals(trend trung thành、toxicity) 、drift(PSI theo thời gian) 、alert。

8. **Alerting chain.**Prometheus exporter 读取 eval score aggregates 和 latency percentiles;Alertmanager sẽ đưa ra các cảnh báo 路由到Slack, sẽ đưa ra các vi phạm quan trọng 路由到PagerDuty。

9. **Regression probe.**Đánh vào một lỗi: được đánh giá chatbot có 1% khả năng bắt đầu tiết lộ SSN giả mạo.

## Sử dụng nó
```
$ curl -X POST https://my-otel-collector/v1/traces -d @trace.json
[collector]  accepted 1 trace, 3 spans
[clickhouse] inserted 3 spans (app=chat, user=u_42)
[eval]       DeepEval faithfulness 0.82, toxicity 0.03
[drift]      weekly PSI 0.08 (below 0.2 threshold)
[ui]         live at https://obs.example.com
```

## 交付 nó
`outputs/skill-llm-observability.md`là giao hàng vật chất, cho một ứng dụng LLM, bảng điều khiển có thể ngâm được các dấu vết của nó, vận hành đánh giá, phát hành cảnh báo, và hiển thị chi phí / người dùng phân chia trong Next.js.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Trace-schema coverage | 生成 canonical GenAI spans 的 SDK families 数量（目标：6+） |
| 20 | Eval correctness | DeepEval / RAGAS scores 对比 hand-labeled set |
| 20 | Dashboard UX | 注入 regression 的 MTTR（目标低于 5 分钟） |
| 20 | Cost / scale | 持续以 1k spans/sec ingest 且无 backlog |
| 15 | Alerting + drift detection | Prometheus/Alertmanager chain 端到端演练 |
| **100** | | |

## 练习
1. Vì khung haystack 添加 tùy chỉnh công cụ 验证 cânonical span 以忠实的`gen_ai.*`thuộc tính 落入 ClickHouse。

2. Trong cùng một số lượng các dấu vết 上把 DeepEval 换 thành Phoenix đánh giá.

3. 强化漂移探测器: theo app-id chứ không phải toàn局计算 PSI── hiển thị các đường dẫn dẫn dốc trên mỗi ứng dụng──

4. 添加一个" user impact" 页面:cost-per-user 和 failure-rate-per-user,并带有闪光线──

5.  xây dựng một chính sách lấy mẫu đuôi: giữ lại dấu vết độc tính 100% > 0,5 , tiếp tục đối với các dấu vết còn lại làm mẫu phân tầng 10% 

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GenAI semconv | "OTel LLM attributes" | 2025 OpenTelemetry spec，用于 LLM span attributes（system、model、tokens） |
| Tail sampling | "Post-trace sample" | Collector 在 trace 完成后决定保留还是丢弃（可以查看 errors） |
| PSI | "Population stability index" | 比较两个分布的 drift metric；> 0.2 通常表示有意义的 drift |
| LLM-judge | "Eval as model" | 一个 LLM 按 rubric（faithfulness、toxicity、PII）为另一个 LLM 的 output 打分 |
| Tail-sampling policy | "Keep-rule" | 决定哪些 traces 持久化、哪些丢弃的规则；errored + sample-rate |
| Eval span | "Linked eval trace" | 携带 eval score、并链接到原始 LLM call span 的 child span |
| Cost per user | "Unit economics" | 在一个窗口内归因到某个 user_id 的美元成本；关键 product metric |

## 延伸阅读
- [Langfuse](https://github.com/langfuse/langfuse) 参考 mở lõi quan sát được 平台
- [Arize Phoenix](https://github.com/Arize-ai/phoenix)  có hỗ trợ dẫn dốc mạnh khác tham chiếu
- [OpenLLMetry (Traceloop)](https://github.com/traceloop/openllmetry) gia đình SDK tự động dụng cụ
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) quy trình tiêu thụ
- [Helicone](https://www.helicone.ai) 另一个 lưu trữ khả năng quan sát
- [Braintrust](https://www.braintrust.dev) 另一个 eval-first nền tảng
- [ClickHouse documentation](https://clickhouse.com/docs) cửa hàng span cột
- [DeepEval](https://github.com/confident-ai/deepeval) thư viện đánh giá
