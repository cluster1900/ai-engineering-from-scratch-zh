# LLM 可观测性 Stack 选择

> LăngSmith, Lăngfuse, Comet Opik) chia thành hai loại. LăngSmith, Lăngfuse, Lăngfuse, Phương tiện phát triển (LangSmith, Lăngfuse, Comet Opik) đưa giám sát và đánh giá, quản lý nhanh, phát hành phiên bản lại cùng nhau. Gateway/ Toolkit: Helicone, SigNoz, OpenLLMetry, Phoenix) tập trung vào tầm xa. Lăngfuse là một nền tảng được cấp phép MIT, và đạt được sự cân bằng tốt về lĩnh vực OSS.

**Type:** Learn
**Languages:** Python (stdlib, toy trace-sampling simulator)
**前置要求：**Giai đoạn 17 · 08 (Tỷ lệ định nghĩa), Giai đoạn 14 (Kỹ thuật đại lý)
**Time:** ~60 分钟

## Học mục tiêu
- 区分开发平台(打包:evals + prompt + sessions)
- Để phân tích các công cụ chính của chúng, hãy xem xét các trường hợp sử dụng thích hợp nhất.
- 解释 OpenTelemetry  gắn bó mô hình, nó cho phép bạn đặt cửa khẩu  công cụ với nền tảng đánh giá độc lập 组合起来.
- Nói ra sự khác biệt về chi phí năm 2026 ((Arize AX's zero-copy method vs monolithic ingest),并说明 khoảng 100x số lần của AX.

## 问题
Bạn trên đường một chức năng LLM  Nó có thể làm việc. Nhưng bạn không thấy các thất bại nhanh chóng, vòng vòng công cụ, hồi quy thời gian trễ, tăng chi phí, hoặc tỷ lệ hit cache nhanh chóng. Bạn Google LLM quan sát, bạn sẽ thấy tám công cụ đều tuyên bố có thể giải quyết cùng một vấn đề, và giá cả cũng chia thành ba tầng.

它们解决不是同一个问题. LangSmith 回答为什么这次 LangGraph run 失败了? Phoenix 回答我的RAG管道是否漂浮? Helicone 回答哪个应用正在烧 टोकन? Langfuse 回答我能自主主办整个东西? 工具不同,受众不同──

选择涉及四个轴:stack(LongChain?Raw SDK?multi-vendor?) 许可证容忍度(仅接受 MIT?Elastic 可以?$100/mo？$1000/mo?) và tự chủ (đáng lẽ phải có một người tốt?

## 概念
### 两类

**开发平台**Hãy đưa ra các bài kiểm tra và đánh giá, lập tức quản lý, phiên bản dữ liệu, phiên bản phiên bản, phiên bản lặp lại cùng nhau. Bạn chạy thử nghiệm, xem có bất kỳ lời nhắc nào có hiệu quả, hãy đưa lời nhắc mới và người chiến thắng cũ lên bộ dữ liệu.

**Gateway/telemetry 工具**Để kết luận các cuộc gọi làm công cụ hóa thu thập  nhanh chóng, phản ứng, token, latency, model, chi phí, Helicone, SigNoz, OpenLLMetry, Phoenix, hơn nhẹ.

### Langfuse  OSS 平衡

- Core Apache / MIT được cấp phép; thông qua Docker tự lưu trữ.
- Cloud free tier: 50K events/month.
- Evals, quản lý nhanh chóng, truy cập dữ liệu, tập hợp dữ liệu, có sự phủ sóng hợp lý đối với bốn tính năng nền tảng phát triển.
- Bạn muốn LangSmith có chức năng cấp, nhưng phải tự chủ hoặc giữ giấy phép OSS.

### Phoenix (Arize)  Telemetry-first,OpenTelemetry-native

- Hành động tự chủ 很简单.
- 非常擅长 RAG 和漂移可视化──嵌入空间散射图片 是一等功能──
- Không phải là thiết kế cho thời gian phát triển và thời gian quan sát.
- Điểm ngọt: đường ống RAG  phát triển l động debugging,并与独立门户 搭配用于生产

### Arize AX  chơi quy mô

- Thị trường thương mại 通過冰山/Parquet 实现零拷贝数据湖 集成。
- 声称在尺度下比单石可观性(Datadog-class)便宜约100x──计算方式:你把痕迹存在自己 S3 上的Parquet 中;Arize 直接读取──
- Điểm ngọt ngào:> 10M dấu vết/ngày 已有数据湖 想要LLM cụ thể bảng điều khiển Nhưng không muốn trả Datadog 价格──

### LangSmith  LangChain/LangGraph  ưu tiên

- Thương mại, $ 39 / người dùng / tháng.
- Đối với các chồng LangChain và LangGraph là tốt nhất trong lớp. Nếu bạn không sử dụng cả hai, sức hấp dẫn sẽ yếu rất nhiều.
- Địa điểm ngọt ngào: Đội đã tham gia vào LangChain,并愿意付费──

### Helicone  基于代理的最低可行

- 通过把 `OPENAI_API_BASE`替换为 Helicone proxy,15-30 分钟完成设置──
- MIT cấp phép;100K req/mo 免费, trả $20/mo +
- 包含 failover, caching, rate limits  也可充当 gateway──
- Độ sâu của các dấu vết đa bước đối với đại lý kém hơn.
- Sweet spot:快速开始、单堆应用、需要 gateway +可观观性 合一。

### Opik (Comet)  nền tảng phát triển OSS

- Apache 2.0, hoàn toàn OSS.
- 功能集与 Langfuse 类似,带有彗星 传承──
- Địa điểm ngọt ngào: đã sử dụng ML 团队 của Comet, hy vọng có được LLM 可观测性在同一面板中.

### SigNoz  OpenTelemetry-first 完整APM

- Apache 2.0: thông qua OpenTelemetry đồng thời xử lý chung APM và LLM:
- Điểm ngọt ngào:跨服务和 LLM gọi của thống nhất可观测性.

### 粘合层:OpenTelemetry + GenAI các quy ước ngữ nghĩa

OpenTelemetry vào cuối năm 2025 đã công bố các quy ước ngữ nghĩa GenAI`gen_ai.system``gen_ai.request.model``gen_ai.usage.input_tokens`(■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

1. Từ mỗi cuộc gọi LLM  phát hành phù hợp với các công ước của GenAI OTel.
2. 路由到门口 (Helicone / Portkey) dùng vào mỗi ngày.
3. 双写到 eval平台 (Phoenix / Langfuse) được sử dụng để lùi lại.
4. 归档到数据湖(Iceberg), được sử dụng thông qua Arize AX hoặc DuckDB thực hiện phân tích dài hạn.

### 陷: trong phạm vi sai lầm

Trong khuôn khổ đại lý 内部做工具化 (ví dụ: thêm dấu vết LangSmith) sẽ đưa bạn 合到这个框架.

### Chọn mẫu  Anh không thể giữ được tất cả mọi thứ

Khi số lượng yêu cầu > 1M yêu cầu/ngày 时, chi phí lưu giữ đầy đủ sẽ vượt quá các cuộc gọi LLM.

### Bạn nên nhớ số

- Lớp đám mây miễn phí Langfuse: 50K sự kiện/tháng.
- LangSmith: 39 đô la/người dùng/tháng.
- Helicone miễn phí: 100K req/tháng.
- Arize AX tuyên bố: trên quy mô 下比 đơn phương 便宜约 100x。
- Công ước OpenTelemetry GenAI: 2025 发布: 2026  phổ biến


```figure
i4-otel-glue
```

## Sử dụng nó
`code/main.py`模拟在不同保留策略(100%摄入,样本,样本+错误) 下一天 1M dấu vết.

## 交付 nó
本课会产出 `outputs/skill-observability-stack.md` Theo xếp hàng, quy mô, ngân sách, tư thế giấy phép  chọn các công cụ

## 练习
1. Bạn của đội sử dụng LangChain,并希望 OSS tự lưu trữ khả năng quan sát.
2. Trong 5M dấu vết / ngày và Datadog 报价 $ 150K / tháng 时, tính toán Arize AX của break-even:
3. 设计一组你的组织指导 应要求每一个LLM call 都必须包含的OpenTelemetry GenAI属性──
4. Phê-ni-x chỉ có đủ để sản xuất không?
5. Helicone có 20ms thay thế trênhead... khi P99 TTFT là 300 ms, nó có thể chấp nhận được?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| OpenLLMetry | “OTel for LLMs” | 面向 LLMs 的开源 OpenTelemetry instrumentation |
| GenAI conventions | “OTel attributes” | LLM calls 的标准 OTel attribute names |
| LangSmith | “LangChain observability” | 与 LangChain ecosystem 打包的 commercial platform |
| Langfuse | “OSS LangSmith” | 具备类似功能集的 MIT OSS |
| Phoenix | “Arize dev tool” | OpenTelemetry-native dev/eval platform |
| Arize AX | “scale observability” | Commercial zero-copy Iceberg/Parquet observability |
| Helicone | “proxy observability” | 收集 LLM telemetry + gateway features 的 HTTP proxy |
| Opik | “Comet LLM” | 来自 Comet 的 Apache 2.0 OSS dev platform |
| Session replay | “trace rerun” | 带 tool calls 的完整 agent session replay |
| Eval | “offline test” | 在 labeled dataset 上运行 candidate model/prompt |

## 延伸阅读
- [SigNoz — 2026 顶级 LLM 可观测性工具](https://signoz.io/comparisons/llm-observability-tools/)
- [Langfuse — Arize AX Alternative analysis](https://langfuse.com/faq/all/best-phoenix-arize-alternatives)
- [PremAI — 设置 Langfuse、LangSmith、Helicone、Phoenix](https://blog.premai.io/llm-observability-setting-up-langfuse-langsmith-helicone-phoenix/)
- [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Arize Phoenix docs](https://docs.arize.com/phoenix)
- [Helicone docs](https://docs.helicone.ai/)
