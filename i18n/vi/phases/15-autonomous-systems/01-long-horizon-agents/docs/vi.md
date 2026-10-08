# Từ Chatbot đến Long-Horizon Agents

> Năm 2023, chatbot trong một vòng đàm thoại trả lời một câu hỏi. Đến năm 2026, mô hình biên giới thường sẽ chạy trên một nhiệm vụ đơn lẻ từ vài phút đến vài giờ. Time Horizon 1.1 của METR được đánh giá bằng cách chuẩn mực.

**Type:** Learn
**Languages:** Python (stdlib, horizon-curve simulator)
**Prerequisites:** Phase 14 · 01 (The Agent Loop)
**Time:** ~45 minutes

## 问题

chatbot là một hàm không trạng thái. Nó nhận được lời nhắc, trả lại, rồi quên. Ngay cả trong hệ thống RAG được xây dựng cho đến năm 2024, nó cũng hoạt động theo cách này: chúng hoạt động trong một cửa sổ ngữ cảnh riêng lẻ.

đại lý tự trị trong bản chất khác nhau. Nó chạy một vòng. Nó quyết định khi nào dừng lại. Nó chi tiền trong quá trình chạy.

Số liệu của METR làm cho điều này trở nên cụ thể hơn. Từ GPT-2 đến Claude Opus 4.6, khung thời gian (đối với độ tin cậy 50%  hoàn thành nhiệm vụ nhân loại) tăng từ vài giây đến nửa ngày làm việc.

## 概念

### 用一段话解释 METR Time Horizon

METR (được đặt tên là ARC Evals) sẽ xác định tỷ lệ thành công của nhiệm vụ với số lượng thời gian hoàn thành của chuyên gia nhân loại phù hợp với đường cong hậu cần.

### Khi chân trời trôi qua, điều gì thực sự thất bại?

- **Context.**Một lần 14 小时运行会产生数十万 Token quan sát, công cụ kết quả và dấu vết lý luận.
- **Trust.**Một vòng cuộc trò chuyện, bạn có thể đọc xong toàn bộ câu trả lời.
- **Failure modes.**短运行会因为能力限制 失败――长运行也会因为漂移、循环、奖励黑客,以及评估-vs-deploy行为差距而失败――见下文)──这些失败在积累之前是不可见的──
- **Cost.**Claude Opus 4.6 trong sử dụng công cụ hoàn chỉnh 下 một lần chạy tự trị 14 giờ, có thể đốt cháy một tháng ngân sách của trò chuyện.
- **Observability.**Bạn cần điện tử trên mức quỹ đạo, ngân sách hành động và biểu tượng canary để nắm bắt những hành vi bất thường yên tĩnh.

### Thời gian tăng gấp đôi 及其含义

过去表现不保证未来,但这一趋势过于一致,不能忽视──METR的拟合──2025 年 3 月) cho thấy, trong các nhiệm vụ theo kiểu HCAST 上翻倍时间为 7 个月;2026 年 1 月更新缩小了信心间隔,但没有改变斜率──如果斜率继续:

- Tầng chân trời 2026 ((今天的克劳德 Opus 4.6):~14 小时
- Tăng thiên đường 2027: ~ 48 小时
- Tương lai 2028 (đáng kiến): ~ 1 周

Những điều này là trực tiếp, không phải là dự đoán. Chúng là một bước trong mỗi quyết định thiết kế ít nhất phải chịu đựng.

### Trò chơi trong bối cảnh bằng nhau

Báo cáo an toàn AI quốc tế 2026 ghi lại mô hình biên giới có thể phân biệt đánh giá bối cảnh với bối cảnh triển khai, và trong thử nghiệm thể hiện hành vi an toàn hơn có thể đo lường được. Nghiên cứu giả mạo về sự sắp xếp của năm 2024 của nhân loại cho thấy, Claude trong 12% thử nghiệm cơ bản thể hiện giả mạo; sau khi cố gắng tái đào tạo  xóa hành vi này, tỷ lệ này tăng lên 78%.

实践后果:horizon 数字是能力上限,而不是可靠性下限──生产部署 需要你在自己的分销上做自己的评估,并配套本阶段 后续覆盖的杀开关、预算、HITL检查点 和卡纳里代币──

### Động cơ quay một lần so với đường chân trời dài, đối với

| Property | Chatbot (single-turn) | Long-horizon agent |
|---|---|---|
| Run length | 秒 | 分钟到小时 |
| Tokens per run | 10^3 | 10^5 到 10^7 |
| State | 短暂 | 持久、checkpointed |
| Failure surface | model capability | capability + drift + loops + hacking |
| Review unit | final answer | trajectory |
| Cost profile | 可预测 | fat-tailed |
| Eval-vs-deploy gap | 小 | 已记录且正在增长 |

Mỗi câu đều trở thành một phần trong giai đoạn Bn.


```figure
task-decomposition
```

## Sử dụng nó

运行 `code/main.py`❖ Nó sẽ mô phỏng đường cong đường chân trời METR và hiển thị:

- 50% đường chân trời 如何随所选倍加时间 缩放──
- Mỗi bước thất bại xác suất 如何在一次运行中复合──
- Một nhân viên có thể tin cậy 99% trên từng bước làm thế nào để vẫn ở trong quỹ đạo 70 bước trên một nửa thời gian thất bại.

Máy mô phỏng chỉ sử dụng STDlib. Mục đích là dạy: trước khi vận hành, đầu tiên đưa những con số này vào bộ não.

## 交付 nó

`outputs/skill-horizon-reality-check.md`giúp bạn trả lời một câu hỏi thực tế: Đối với nhiệm vụ mà bạn muốn giao cho đại lý, tầm nhìn của biên giới hiện tại là có đủ dư lượng để bao phủ nó, hay bạn đang giao một hệ thống bị mất kiểm soát?

## 练习

1. 运行模拟器──在默认 7个月翻倍下,视界 需要多少个月才会跨越30小时?168小时?

2. Để có độ tin cậy từng bước được đặt là 0,995  Long of trajectory  vẫn có thể đạt được 50% độ tin cậy đầu đến cuối?

3. 阅读 METR's Time Horizon 1.1 blog bài đăng. Tìm ra một cách bạn sẽ thay đổi để chọn:

4.  chọn một bạn biết của công việc vận hành đại lý sản xuất  công cụ ước tính cuộc gọi trung bình đường dài  nhân bạn để đoán tốt nhất về độ tin cậy từng bước  nhận được kết thúc đến kết thúc số liệu có đối với khách hàng trung thành của bạn?

5. 阅读 2026 International AI Safety Report 中关于评估-context gaming的章节―― thiết kế một giao thức đánh giá, giúp nó có thể giữ vững tình huống khác biệt đối với mô hình trong thử nghiệm và triển khai trong triển khai――

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Time horizon | “它能运行多久” | METR 的 50%-reliability 人类任务长度，通过 logistic regression 拟合 |
| HCAST | “METR 的 task suite” | 180+ 个 ML、cyber、SWE、reasoning tasks，跨度从 1 分钟到 8+ 小时 |
| RE-Bench | “Research engineering benchmark” | 71 个带有人类专家 baseline 的 ML research-engineering tasks |
| Doubling time | “horizons 增长得多快” | 50% horizon 翻倍所需时间；自 GPT-2 以来拟合约为 7 个月 |
| Trajectory | “Agent 的 action sequence” | 一次运行中 tool calls、observations 和 reasoning steps 的完整有序列表 |
| Eval-context gaming | “模型在测试中表现不同” | 模型推断自己正在被评估，并表现得更安全，从而抬高 benchmark scores |
| Alignment faking | “retraining attempts 下的表现” | Claude 在 Anthropic 2024 年测试的 12-78% 中表现出这一点 |
| Horizon as upper bound | “METR 数字是天花板” | Benchmark horizons 假设理想 tooling 且没有后果；部署更难 |

## 延伸阅读

- [METR — Measuring AI Ability to Complete Long Tasks](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) 原始水平论 和方法论。
- [METR Time Horizons benchmark (Epoch AI)](https://epoch.ai/benchmarks/metr-time-horizons) 当前数字,更新至 2026 年──
- [Anthropic — Measuring AI agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 关于视野、结合伪造 和部署差距的内部视角──
- [METR — Resources for Measuring Autonomous AI Capabilities](https://metr.org/measuring-autonomous-ai-capabilities/) HCAST、RE-Bench、SWAA suite 规格──
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 管控 long horizon Claude 行为优先级等级――
