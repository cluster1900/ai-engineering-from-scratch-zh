# Caching nhanh và Caching ngữ nghĩa 经济学

> **Pricing snapshot 日期为 2026-04。**Các tuyên bố số dưới đây phản ánh thẻ giá bán hàng được thu thập khi phát hành bài học này; trong các bài đăng dưới đây, xin trước tiên đối chiếu

> Caching 发生在两层──L2(provider-level)prompt/prefix caching 会为重复 prefix 复用注意 KV  Anthropic 的快速缓存文件 宣称,在长时间的提示上最高可降低90% 成本、降低 85%延迟; đối với Claude 3.5 Sonnet, cache đọc 为$0.30/M，而 fresh 为 $3.00/M,TTL 为 5 分钟,1 giờ TTL 选项有2x write premium(docs.anthropic.com,2026-04)。OpenAI prompt caching 会 tự động ứng dụng cho các yêu cầu của ≥1024 token,并将 cached input 定价相对新鲜约90%折扣(platform.openai.com,2026-04); chính xác mỗi mô hình cached rate 取决于现场率卡──L1(app-level) semantic caching 会在嵌入式相似性命中完全跳过LLM──Vendor 95%精度指的是匹配正确度,而不是  报告的击率  报告的击率不是从10%开封聊) 升级到结构化 FAQ) 不等;((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((

**Type:** Learn
**Languages:** Python (stdlib, toy two-layer cache simulator)
**前置要求：**Giai đoạn 17 · 04 (vLLM Serving Internals), Giai đoạn 17 · 06 (SGLang RadixAttention)
**Time:** ~60 分钟

## Học mục tiêu
- 区分 L2 prompt/prefix caching(provider 侧 KV 复用) với L1 semantic caching(对相似提示 绕过 LLM)。
- 解释  Antropic 的`cache_control`显式标记,以及两个 TTL 选项 ((5 phút và 1 giờ) và các nhân giá của nó.
- 根据击率、快速/响应混合和代币价格,计算预期月度节省。
- Nói về việc làm cho tỷ lệ tăng trưởng tương đồng 5-10x, cũng như sẽ làm cho tỷ lệ tấn công 崩 của động lực- nội dung chống mô hình.

## 问题
Bạn cung cấp cho dịch vụ RAG của riêng bạn thêm bộ nhớ cache nhanh hơn. Tài khoản không thay đổi. Bạn đo tỷ lệ hit; chỉ 7%. Các yêu cầu của bạn trông như tĩnh, nhưng thực tế không phải là  hệ thống yêu cầu .

Ngoài ra, đại lý của bạn sẽ trả lời mỗi câu hỏi của người dùng và chạy 10 cuộc gọi công cụ. 10 yêu cầu đều trong bộ nhớ nhớ trước khi bạn đến nhà cung cấp.

Caching là một thỏa thuận, không phải là một cờ.

## 概念
### L2  Caching prompt/prefix của nhà cung cấp

Nhà cung cấp  lưu trữ cacheable tiền đề chú ý KV, và tiếp theo phù hợp với các yêu cầu của tiền đề 上复用它──你只支付一次写费,读 几乎免费──

**Anthropic (Claude 3.5 / 3.7 / 4 series)**: yêu cầu 中的显式 `cache_control`marker──你标记哪些块可缓存──TTL:5 phút(chi phí viết 为 1.25x cơ sở) hoặc 1 giờ(chi phí viết 为 2x cơ sở)──Cache đọc:Claude 3.5 Sonnet 上为$0.30/M，而 fresh 为 $3.00/M 便宜 10x(docs.anthropic.com,截至2026-04)。不同型号的价格 不同(Opus/Haiku 分别发布);始终交叉核对现场价格页面──

**OpenAI**Đối với ≥1024 mã thông báo của yêu cầu tự động lưu trữ(platform.openai.com,2026-04)。 không có cờ hiển nhiên。 在当前 gpt-4o/gpt-5 tỷ lệ thẻ trên, lưu trữ đầu vào 约比 鲜便宜 10x。doc 和 phát hành ghi chú đều không phát hành chính thức hit-rate cơ sở; báo cáo cộng đồng trong sự chú ý thiết kế yêu cầu 后大多集中在 3060%。监控`usage.cached_tokens`Để đo lường tình hình của mình.

**Google (Gemini)**: Thông qua API hiển nhiên làm caching bối cảnh; 1M-token context có nghĩa là thu nhập của caching lớn hơn.

**Self-hosted (vLLM, SGLang)**:Phase 17 · 06 介绍 RadixAttention  在您自己的计算上采用相同模式──

### L1  ứng dụng 级 cache ngữ nghĩa

Trong khi đó, bạn có thể tìm thấy các yêu cầu được lưu trữ tương tự như trong bản ghi nhớ trong cache.

Mở nguồn: Redis Vector Similarity、GPTCache、Qdrant。 Thương mại: Portkey Cache、Helicone Cache。

Các tuyên bố chính xác của nhà cung cấp chỉ là phản ứng được lưu trữ trả lời trong ngữ nghĩa phù hợp với tần suất, chứ không phải là tần suất phát sinh.

- - Tự nói chuyện mở: 10-15%
- Các câu hỏi thường gặp / hỗ trợ có cấu trúc: 40-70%。
- Câu hỏi mã: 20-30%
- Các đại lý giọng nói lặp lại các lời nhắc:50-80%

### Phương pháp chống đồng đều hóa

Bạn đại lý và phát hành 10 cuộc gọi công cụ. Tất cả 10 trong số đó đều có cùng một hệ thống mã hóa 4K-quýu động. Anthropic cache viết là theo yêu cầu của; lần đầu tiên cache-tập trong nhà cung cấp  nhìn thấy nhanh chóng sau khoảng 300 ms hoàn thành.

修复:batch với chuỗi-lần đầu tiên  单独发起请求 1, rồi trong cache 1 已填充 后再触发 2-10──给第一个工具调用 增加300 ms;节省 5-10x 账单──

### Các nội dung động chống mô hình

Hệ thống của bạn nhanh chóng trông giống như:

```
You are a helpful assistant. The current time is 14:32:17.
User ID: abc123. Today is Tuesday...
```

Mỗi yêu cầu đều là duy nhất. Mỗi yêu cầu đều được ghi vào.

修复:把所有真正静态的内容移动到缓存前;把动态内容 添加到缓存边界 之后:

```
[cacheable]
You are a helpful assistant. [rules, examples, instructions]
[/cacheable]
[dynamic, not cached]
Current time: 14:32:17. User: abc123.
```

ProjectDiscovery 通过这种方式将缓存 hit rate从7% 提升到74%,并发布该解剖.

### Lưu trữ hàng loạt + cache cho tải trọng làm việc qua đêm

Các API hàng loạt(Phase 17 · 15) trong vòng quay 24 giờ 下 cung cấp 50% giảm giá.

### Những con số mà bạn nên nhớ

Điểm giá là dữ liệu được thu thập từ các tài liệu nhà cung cấp liên kết từ năm 2026-04, và sẽ thay đổi mỗi tháng tùy thuộc vào chúng trước khi kiểm tra lại.

- Anthropic được lưu trữ đọc:Claude 3.5 Sonnet 上 $0.30/M, khoảng hơn đầu vào mới 便宜 10x(docs.anthropic.com) 👇
- Antropic cache write premium:1.25x(5-min TTL) hoặc 2x(1-hour TTL)。
- OpenAI tự động lưu trữ: áp dụng cho ≥1024 mã thông báo; trên thẻ giá hiện tại, đầu vào lưu trữ 定价约为 10% của đầu vào mới(platform.openai.com) 👇
- Tỷ lệ truy cập cache ngữ nghĩa(được báo cáo bởi cộng đồng):tương tự mở chat 约 ~ 10%; FAQ có cấu trúc 最高约 ~ 70%── không phải là đường cơ sở được xác định bởi nhà cung cấp。
- ProjectDiscovery: thông qua sẽ động chuyển 移出 tiền tố, tỷ lệ hit từ 7% → 74%
- Phân tích chống đồng bộ: báo cáo điển hình cho thấy, khi N 个 yêu cầu song song 错过第一次 cache viết 时,账单会膨胀 510x。


```figure
semantic-cache-hit
```

## Sử dụng nó
`code/main.py`模拟混合工作负载 上的 L1 + L2缓存――报告撞击率、账单,并显示并行处罚――

## 交付 nó
本课产 出 `outputs/skill-cache-auditor.md`❖ Đưa ra mô hình nhanh chóng và lưu lượng truy cập, nó sẽ kiểm tra tính dự trữ và đề xuất tái cấu trúc.

## 练习
1. 运行 `code/main.py`❖ chuyển đổi cờ song song ❖ tính toán biến đổi bao nhiêu?
2. Hệ thống của bạn nhanh chóng có ngày hạn.
3. Trong trường hợp tỷ lệ đến yêu cầu được xác định, tính toán break-even của 1 giờ TTL ((2x viết) với 5 phút TTL ((1.25x viết)
4. Từ ngữ cache ở ngưỡng 0.95 下命中 20%── ở mức 0.85 下命中 50%, nhưng bạn thấy những phản ứng được lưu trữ trong cache sai lầm── chọn ngưỡng chính xác 并说明 lý do──
5. Bạn đối với mỗi câu hỏi người dùng hàng 10 个 song song phụ truy vấn.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| L2 prompt cache | "prefix cache" | Provider 存储重复 prefix 的 KV |
| `cache_control` | "Anthropic cache marker" | 标记 cacheable blocks 的显式 attribute |
| Cache write premium | "write tax" | 从首次 miss 到 cache 的额外成本（1.25x 或 2x） |
| L1 semantic cache | "embedding cache" | 调用 LLM 前在 app-level 进行 hash-and-embed |
| GPTCache | "LLM caching lib" | 流行的 OSS L1 cache library |
| Cache hit rate | "hits / total" | 从 cache 服务的 requests 占比 |
| Parallelization anti-pattern | "the N-write trap" | N 个 parallel requests 会 N 次 miss cache |
| Dynamic content trap | "the time-in-prompt trap" | prefix 中的 dynamic bytes 会破坏 hit rate |
| RadixAttention | "intra-replica cache" | SGLang 的 prefix-cache implementation |

## 延伸阅读
- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) chính thức `cache_control`ngữ nghĩa và TTLs
- [OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching) hành vi lưu trữ tự động và đủ điều kiện.
- [TianPan — Semantic Caching for LLMs Production](https://tianpan.co/blog/2026-04-10-semantic-caching-llm-production)
- [ProjectDiscovery — Cut LLM Costs 59% With Prompt Caching](https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching)
- [DigitalOcean / Anthropic — Prompt Caching](https://www.digitalocean.com/blog/prompt-caching-with-digital-ocean)
