# Các API hàng  50% giảm giá trở thành tiêu chuẩn ngành

> Mỗi nhà cung cấp chính đều cung cấp API lô nhịp không đồng bộ, với 50% giảm giá và khoảng 24 giờ quay lại. OpenAI, Google, cũng như hầu hết các nền tảng suy luận (Fireworks batch tier, cùng lô) đều thực hiện cùng một mô hình.

**Type:** Learn
**Languages:** Python (stdlib, toy batch-vs-sync cost simulator)
**前置要求：**Giai đoạn 17 · 14 (Tầm dự trữ nhanh chóng & ngữ nghĩa)
**Time:** ~45 minutes

## Học mục tiêu
- Nói ra ba nhà cung cấp API loạt ((OpenAI、Anthropic、Google) cùng với chung 50% giảm giá + 24h quay lại 保证。
- 计算 qua đêm Classification workload 中叠加批 + cost of cached-input,并与同步-未存基线对比──
- Để phân chia một khối lượng làm việc cho tương tác / bán tương tác / lô,并说明 đường dẫn lý do.
- Nói ra hai rào cản: tương tác phần nào của người dùng hơn 24h và chuyển hướng kế hoạch xuất khẩu

## 问题
Bạn của nhóm đã phát hành một hệ thống sản xuất báo cáo hàng đêm.50,000 tài liệu, tổng kết cá nhân, tổng kết tập hợp, tái lập bản tin điều hành.

batch 能给你50%折扣──你还在系统提示(所有50k cuộc gọi 共享) 启动缓存提示──叠加后,账单降至180$/night约为基线的9%──同一个管道,只改了三个配置──

Batch là LLM, nhưng rất ít người sử dụng các bàn tay. Lý do chính là ở cấp độ tổ chức: nhóm nghĩ rằng nó là thời gian thực, nhưng SLA thực tế là vào buổi sáng.

## 概念
### 3 bộ API

**OpenAI Batch API**Trên truyền tải bao gồm các yêu cầu danh sách file JSONL.`/v1/batches`Endpoint── đáp ứng các mục nhập 条件 cache cũng có thể được cung cấp giá vào cache trên cơ sở này──

**Anthropic Message Batches**: JSONL upload──24 giờ quay lại──50% giảm giá── hỗ trợ`cache_control` cache viết là hiển nhiên, đọc sẽ xảy ra tự động trong lô

**Google Vertex AI Batch Prediction**: BigQuery hoặc GCS input──Gemini có tương tự 50% giảm giá──与Vertex管道集成──

### Hình ngữ: không đồng bộ, không chậm

Batch là 我承诺在24小时内回归不是这会花24小时──典型P50 là 2-6小时──供应商会在 GPU 库存利用不足的非高峰窗口调度你的批量──

### Với cache 叠加

Một bản tóm tắt tài liệu 50k, sử dụng cùng một hệ thống mã thông báo 4K:

- Đồng thời không lưu trữ:50000 × ($input × 4000 + $sản lượng × 200), theo tỷ lệ đầy đủ。
- Đồng bộ lưu trữ: hệ thống prompt 在首次写后被缓存; còn lại 49999 lần nhận được giá rẻ 10x của đầu vào.
- Nhóm lưu trữ:以上全部,再加上 đọc 和 viết 两者的50%折扣──

叠加效果:batch + cache = 约为同步未缓存账单的10%──任何一夜运行且拥有共享系统提示的工作负载都应该使用它──

### Phân loại tải trọng công việc

**Interactive** User wait for response──TTFT  rất quan trọng──使用带 prompt caching của cuộc gọi đồng bộ──不能批次──

**Semi-interactive** Người dùng gửi nhiệm vụ, vài phút sau quay lại xem.

**Batch** User expect results by morning hoặc next hour──Content pipelines、大规模分类、离线分析──始终批量,始终叠加缓存──

常见错误: Vì đường ống là sản xuất, nên hãy xếp tất cả mọi thứ vào loại tương tác.

### - Interactivity

Một số chức năng trông tương tác, nhưng có thể chịu đựng 5-10 phút. Ví dụ:带有refresh 按的每晚客户健康报告──用户点击refresh;等待10分钟是可接受的──团队却把它做成同步──50个并发发 refresh的成本,是批量发送通过电子邮件的10x──

Câu hỏi cần phải đặt ra là: 24 giờ có nghĩa là gì với người dùng này? Nếu câu trả lời là họ sẽ không nhận ra, hãy đạp nó.

### Output-scheme 陷

Các định dạng tập tin hàng bởi nhà cung cấp và khác nhau:

- OpenAI: JSONL, mỗi lần một yêu cầu.
- Anthropic:JSONL, mỗi行一个消息; phản ứng định dạng 内嵌。
- Vertex:BigQuery bảng hoặc带 TFRecord của GCS tiền tố.

跨供应商编写 one batch client nghĩa là mỗi nhà cung cấp đều cần mã bộ chuyển đổi.

### Bạn nên nhớ số

- Thảm giá hàng loạt của nhà cung cấp: đầu vào + đầu ra 统一 50%。
- SLA quay trở lại:保证 24 小时,典型P50 为 2-6 小时──
- 叠加 batch + input được lưu trữ trong cache:约为同步未存储成本的10%──
- Quy tắc phân loại tải trọng làm việc: Nếu thời gian trễ 24h có thể chấp nhận,始终批量──


```figure
batch-lane-triage
```

## Sử dụng nó
`code/main.py`Để một khối lượng công việc 50k tài liệu  tính toán Sync, Sync + cache, batch, batch + cache của chi phí.

## 交付 nó
本课会产出 `outputs/skill-batch-triager.md`❖ Định tính chất tải trọng công việc, phân dòng đến tương tác/bộ bán/chất,并 ước tính tiết kiệm ❖

## 练习
1. 运行 `code/main.py`△ Đối với một đường ống 100k-doc, sử dụng hệ thống 3K-token prompt 和 500-token output, tính toán đầy đủ hàng loạt(batch + cache) so với đường cơ sở đồng bộ hóa của tiết kiệm。
2.  chọn một trong ba tính năng của sản phẩm thực tế bạn quen thuộc.
3. Người dùng phàn nàn báo cáo của họ đã mất 3 giờ. Đây là sai lầm hàng loạt, hay hợp pháp tương tác?
4. SLA trả lại API của bạn là 24h, nhưng P99 là 20h. Bạn làm thế nào để giao tiếp với người dùng trong trường hợp cạnh trên hệ thống dòng thấp là gì?
5. 计算 break-even:shared-prefix length  đạt bao nhiêu thời gian, batch + cache 会比 riêng bạn đặt GPU lên qua đêm 运行便宜 hơn?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Batch API | “async discount” | 50% off，24h turnaround |
| JSONL | “batch format” | 每行一个 JSON request；OpenAI/Anthropic standard |
| Message Batches | “Anthropic batch” | Anthropic 的 batch API product name |
| Batch prediction | “Vertex batch” | Vertex AI 的 batch API product |
| Turnaround SLA | “24h promise” | 保证，不是典型值；典型是 2-6h |
| Workload triage | “interactivity decision” | Interactive / semi / batch routing decision |
| Output schema | “response format” | 每个 provider 的 JSONL layout；不可移植 |
| Stacked discount | “batch + cache” | 两者都适用时，约为 uncached sync bill 的 10% |

## 延伸阅读
- [OpenAI Batch API](https://platform.openai.com/docs/guides/batch) định dạng JSONL 和 `/v1/batches`ngữ nghĩa.
- [Anthropic Message Batches](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing) định dạng lô 和 `cache_control`tương tác.
- [Vertex AI Batch Prediction](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/batch-prediction) Nhóm sinh đôi 语义。
- [Finout — OpenAI vs Anthropic API Pricing 2026](https://www.finout.io/blog/openai-vs-anthropic-api-pricing-comparison)
- [Zen Van Riel — LLM API Cost Comparison 2026](https://zenvanriel.com/ai-engineer-blog/llm-api-cost-comparison-2026/)
