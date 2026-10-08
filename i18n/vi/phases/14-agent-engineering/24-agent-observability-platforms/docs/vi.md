# Thuộc hữu 可观测性: Langfuse, Phoenix, Opik

> 三个开源代理可观测性平台主导了 2026 年──Langfuse (MIT)  每月 6M+ cài đặt, theo dõi + quản lý nhanh chóng + đánh giá + phiên bản lặp lại──Arize Phoenix (Elastic 2.0)  深入的代理 专用评估、RAG 相关性、OpenInference tự động dụng cụ──Comet Opik (Apache 2.0)  tự động hóa nhanh chóng 优化、guardrails、LLM-judge 幻觉检测──

**类型：**Học tập
**语言：**Python (stdlib)
**前置要求：**Giai đoạn 14 · 23 (OTel GenAI)
**时间：**45 phút

## Học mục tiêu

- Nói về ba nền tảng đại lý nguồn mở hàng đầu có thể xem xét và giấy phép.
- 区分每个平台最擅长的方面:Langfuse (giải phóng nhanh mgrm + các phiên)  Phoenix (RAG + tự động dụng cụ)  Opik (tích cực + tháp) 
- 解释 tại sao đến năm 2026, 89% báo cáo tổ chức đã triển khai Cung viên 可观测性.
- 实现一个带有LLM- thẩm phán 评估的 stdlib trace-to-dashboard pipeline。

## 问题

OTel GenAI (Lớp 23) đã cho bạn một kế hoạch. Bạn vẫn cần một nền tảng để hấp thụ thời gian, hoạt động đánh giá, lưu trữ các phiên bản nhanh chóng, và tiết lộ sự lùi.

## 核心概念

### Langfuse (MIT)

- Mỗi tháng 6M+ SDK cài đặt,19k+ GitHub sao.
- 功能:tracing、带 versioning + gameground's prompt management、评估(LLM-as-judge、user反、自定义)、session replacements──
- 2025 年 6 月:原先的商业模块(LLM-as-a-judge、注释队列、快速实验、Playground) ở MIT 下
-                                                                                                                                                                                                                                                               

### Arize Phoenix (Lí thư 2.0)

- Hơn sâu hơn Agent 专用评估:trace clustering, phát hiện bất thường, đối diện với sự liên quan của RAG.
- Tự dụng tự động mởInference
- Có thể sử dụng với quản lý phiên bản Arize AX  hợp tác để sản xuất
- 没有快速版本  定位是与更广泛平台配合使用的漂移/行为-regression工具
-                                                                                                                                                                                                                                                                   

### Sao chổi Opik (Apache 2.0)

- Thông qua thử nghiệm A/B 实现自动化快速 优化.
- Guardrails (khóa bản PII, hạn chế về chủ đề)
- LLM- thẩm phán 幻觉检测。
- Từ Comet  tự đo lường điểm: Opik logs + evals dùng thời gian 23.44s, trong khi Langfuse là 327.15s (khoảng 14x khoảng cách)  sẽ đưa các điểm chuẩn của nhà cung cấp 视为方向性参考──
- 最擅长: vòng tối ưu hóa, tự động hóa thử nghiệm, thực thi bảo vệ.

###  行业数据

Theo Maxim(2026 năm phân tích thực địa):89% tổ chức đã triển khai Agent 可观测性; vấn đề chất lượng là rào cản sản xuất chính nhất(32% người được hỏi đề cập đến chúng)

### 如何选择

| 需求 | 选择 |
|------|------|
| 带 prompt management 的一体化方案 | Langfuse |
| 深度 RAG 评估 + drift | Phoenix |
| 自动化 optimization + guardrails | Opik |
| 开放 license，不要 ELv2 | Langfuse (MIT) 或 Opik (Apache 2.0) |
| Datadog / New Relic 集成 | 任意 — 它们都导出 OTel |

### Mô hình này dễ dàng xuất hiện ở nơi

- **没有 eval strategy。**Không có đánh giá về việc theo dõi, chỉ là việc khai thác gỗ đắt tiền.
- **没有 grounding 的自建 LLM-judge。**Chế độ CRITIC (Dạy học 05) 适用  thẩm phán 需要外部工具进行事实验证──
- **Prompt versions 没有关联到 traces。**Khi một sự suy giảm xuất hiện, bạn không thể phân chia cho đến khi gây ra vấn đề.


```figure
wb-trace-ingest
```

##  xây dựng nó

`code/main.py`实现 một nhà thu thập dấu vết STDlib + thẩm phán đánh giá LLM:

- Giống GenAI 形态的跨度──
- 按会议 分组,标记失败 runs(guardrail trips、低置信度 evals)
- Một thẩm phán LLM có kịch bản, theo quy tắc đối với phản ứng của đại lý 评分──
- 类似仪表板的摘要: tỷ lệ thất bại, lý do thất bại hàng đầu, phân phối điểm số bình thường.

运行:

```
python3 code/main.py
```

输出: điểm đánh giá của mỗi phiên và phân loại thất bại, phù hợp với Langfuse/Phoenix/Opik 会展示的内容──

## Sử dụng nó

- **Langfuse**tự lưu trữ hoặc đám mây; thông qua OTel hoặc các SDK của chúng 接入。
- **Arize Phoenix**tự lưu trữ; tự động công cụ OpenInference。
- **Comet Opik**tự lưu trữ hoặc đám mây; vòng tối ưu hóa tự động hóa.
- **Datadog LLM Observability**适合已运行 Datadog 的混合 ops+ML 团队。

## 交付 nó

`outputs/skill-obs-platform-wiring.md`选择一个平台,并将追踪 + đánh giá + phiên bản nhanh chóng 接入现有代理──

## 练习

1. Để lấy dấu vết của OTel trong một tuần, đưa ra đám mây Langfuse.
2. Để viết một danh mục của bạn về trường học của bạn, hãy viết một bài viết về trường học của bạn.
3. So sánh phiên bản Langfuse nhanh với tập hợp dấu vết của Phoenix.
4. Đọc các tài liệu bảo vệ của Opik.
5. Trong cơ thể của bạn trên điểm chuẩn Đây là ba nền tảng ở bỏ qua số lượng nhà cung cấp ở ra; đo lường bản thân bạn ở đây

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Tracing | “Spans collector” | Ingest OTel / SDK spans；按 session 建索引 |
| Prompt management | “Prompt CMS” | 关联到 traces 的 versioned prompts |
| LLM-as-judge | “Automated eval” | 单独的 LLM 按 rubric 对 Agent output 评分 |
| Session replay | “Trace playback” | 逐步回放过去的 runs 以便 debugging |
| RAG relevancy | “Retrieval quality” | retrieved context 是否匹配 query |
| Trace clustering | “Behavioral grouping” | 对相似 runs 聚类，用于 drift detection |
| Guardrail enforcement | “Policy at log time” | 对 logged content 做 PII/toxicity/scope checks |

## 延伸阅读

- [Langfuse docs](https://langfuse.com/) theo dõi, xác định, nhanh chóng
- [Arize Phoenix docs](https://docs.arize.com/phoenix) tự động dụng cụ  trôi
- [Comet Opik](https://www.comet.com/site/products/opik/) tối ưu hóa + tháp bảo vệ
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 3 nền tảng đều tiêu thụ kế hoạch
