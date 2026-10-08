# METR Thời gian và khả năng đánh giá bên ngoài

> METR(đã được đặt tên là ARC Evals) từ tháng 12 năm 2023 trở thành 501 (c) 3)  tổ chức độc lập. Định hướng Time Horizon 1.1 của họ (định hướng 1 tháng 1 năm 2026) sẽ được xác định thành công trong nhiệm vụ và log (định hướng) Ước tính: MLT180+ 个别, đã được xác định Ước tính: không phải là nhiệm vụ; 分钟到 8 小时) Ước tính: Ước tính: Ước tính: không có sự khác biệt về hành vi của người; Ước tính: không có sự khác biệt về hành vi của người; Ước tính: không có sự khác biệt về thời gian và thực tế của người;

**类型：**Học hỏi
**语言：**Python (stdlib, ước tính chân trời phù hợp với hậu cần)
**先修：**Giai đoạn 15 · 01 (hành động đường dài), Giai đoạn 15 · 19 (RSP)
**时间：**~ 60 phút

## 问题

Giá trị của các chính sách quy mô phụ thuộc vào kết quả đo lường mà chúng trích dẫn.

METR là tổ chức đánh giá bên ngoài trong năm 20242026 , xác định nhiều số số này. Họ đánh giá các mô hình biên giới, thường được thực hiện trước khi mô hình được phát hành, theo điều kiện ký NDA với phòng thí nghiệm, và sau đó phát hành các phương pháp luận. Time Horizon 1.1 chuẩn mực (từ tháng 1 năm 2026) là kết quả cốt lõi của họ: một mô hình sẽ nén năng lực thành một mô hình đơn lẻ của đơn vị có thể đọc được của con người. mô hình này có thể hoàn thành một cách đáng tin cậy 50% các chuyên gia sẽ dành nhiều thời gian để xử lý các loại nhiệm vụ đó.

Một phần trong bài này về phương pháp học (How to calculate horizon), một phần về cách giải thích (Why horizon is up bound, rather than deployment prediction) ⋅ Những kỹ năng này nên được đặt cùng nhau để hiểu.

## 概念

### METR 背景

- 成立时间:2023 年 12 月(前身为 ARC Evals,拆分为独立 501(c)(3))
- phạm vi: đánh giá khả năng tự trị của mô hình biên giới, thường được thực hiện trước khi phát hành.
- 合作实验室:Anthropic、OpenAI(20252026 nhiều lần tham gia)
- 重要交付物:Time Horizon 1.0(2025 年 3 月) 、Time Horizon 1.1(2026 年 1 月) 、原型监控评估──

### Thời gian Horizon 拟合

方法论(来自 METR blog 和 báo cáo):

1. 收集一个任务套件,覆盖分钟级到小时级的专家完成时间──当前套件:HCAST(180+个任务)、RE-Bench(71个任务)、SWAA──
2. 让模型运行每个任务; ghi lại thành công hoặc thất bại.
3. 拟合一条 逻辑 đường cong:P(success) 是 log(专家完成时间) 的函数──
4. Horizon là làm cho P(success) = 0.5 的专家时间。

Hình dạng phù hợp với hậu cần, vì khả năng thường có một mối quan hệ gia tăng và gần gũi giữa khó khăn nhiệm vụ và thời gian nền tảng. 50% điểm là một lựa chọn.

### 2026 年 1 月数字

Theo Time Horizon 1.1:

- Claude Opus 4.6: 在 50%可靠性下约 14 小时, 来自 Time Horizon 1.1(2026 年 1 月)
- Thời gian tăng gấp đôi trên nhiệm vụ theo kiểu HCAST: Thời gian Khí vọng 1.1 ((1 tháng 1 năm 2026) báo cáo sau năm 2023 拟合约为 4.3 个月(130.8 天); số khoảng 7 个月 là Thời gian Khí vọng 1.0 trong năm 20192025 总量拟合, và trong TH1.1 báo cáo cùng với số liệu sau năm 2023.

Đây là giai đoạn 15 后续引用的具体数字──Anthropic's RSP v3.0 (Dạy 19) và DeepMind's FSF v3 (Dạy 20) đều trích dẫn chúng, như một trong những phép đo của các đánh giá ngưỡng nhập.

### Đồ chung điểm

- **HCAST**:189 个任务,覆盖 ML, an ninh mạng, kỹ thuật phần mềm và lý luận chung.
- **RE-Bench**:71 个 ML nghiên cứu kỹ thuật 任务,带有人类专家基线――衡量模型能否完成会输入到AI R&D-4 ngưỡng Trong đó loại ML R&D 工作──
- **SWAA**:较短任务; được sử dụng cho đường cong đường chân trời của đường cong thấp.

### Đánh giá giám sát

20252026 工作 METR bao gồm các nguyên mẫu giám sát-học định: giám sát 能否发现模型正在执行侧任务 (即操作员所要求之外的事情);agent 能否规避监控──这些直接输入到OpenAI PF v2 的Undermining Safeguards类别,以及DeepMind FSF v3(Lớp 20) trong giám sát sự sắp xếp lừa đảo──

### Tại sao chân trời là giới thượng

- **理想化工具**:chỉ số nhiệm vụ 给模型提供干净工具和格式良好的数据──真实部署更混乱──
- **没有真实后果**Mô hình sẽ không thực sự chuyển sang khách hàng tính toán  xóa dữ liệu thực hoặc liên hệ với người thực  thực triển có nguy cơ không thể đảo ngược 
- **Eval-context gaming**Bài học 1 模型在测试中的行为不同 ∙ Báo cáo an toàn AI quốc tế năm 2026 đã ghi lại điều này bằng cách thực hiện ∙
- **没有真实用户差异**: Benchmark prompt là cấu trúc化──trực sự người dùng sẽ đưa ra模糊且依赖上下文的请求──

Tự tin được triển khai là một số khác, thấp hơn, và đội ngũ phải đo lường phân bố của mình để biết nó.

### Ý nghĩa của người đánh giá ngoại bộ

Phân tích bên ngoài rất quan trọng, bởi vì phòng thí nghiệm nội bộ có sức mạnh tối ưu hóa các chỉ số báo cáo của họ.

### 如何在实践中使用视界 数字

- **作为能力过滤器**Nếu chân trời của một mô hình rõ ràng thấp hơn thời gian chuyên gia của nhiệm vụ đề xuất, đừng đưa nó lên tự động  cách thức
- **作为趋势指标**: thời gian gấp đôi  nói với bạn, ngay cả khi không có các biện pháp giảm thiểu mới, thực hành hiện tại vẫn có thể duy trì an toàn trong thời gian dài.
- **作为 prior**Khí vọng của giờ là điểm khởi điểm.


```figure
a5-horizon-fit
```

## Sử dụng nó

`code/main.py`Dựa trên kết quả tổng hợp, đạt được sự phù hợp hậu cần của thành công nhiệm vụ với log của thời gian chuyên gia. Nó báo cáo 50% đường chân trời (METR)  chỉ số chính) ≈10% đường chân trời (METR) 保守) và 90% đường chân trời (乐观) ⋅ đồng thời thể hiện tỷ lệ thành công được đánh giá trong bối cảnh chơi game người vì nâng cao sẽ xảy ra những thay đổi.

## 交付 nó

`outputs/skill-horizon-interpretation.md`审查 yêu cầu chân trời của nhà cung cấp,并产出基准 yêu cầu và phân tích khoảng cách giữa thực tế triển khai 

## 练习

1. 运行 `code/main.py` xác nhận 50% đường chân trời được phù hợp với thực tế mặt đất tổng hợp  hiện sẽ làm giảm một nửa lưới thời gian công việc; ước tính đường chân trời có thay đổi đáng kể không?

2. 阅读 METR's Time Horizon 1.1 blog post. Tìm ra nhiệm vụ cụ thể đáng tin cậy nhất và thấp nhất.

3. 阅读 METR 的Mét Capacities of Autonomous AI资源──列出 HCAST 任务类别──选择一个你会在生产任务中赋予更高权重的类别,并说明理由──

4. Để đánh giá bối cảnh game  giới thiệu mô phỏng: để chuyển khoảng 20% của thất bại nhiệm vụ chuyển thành thành công  báo cáo tầm nhìn mới 

5. Dựa trên backlog lỗi của bạn hoặc đại diện của tập hợp nhiệm vụ, thiết kế một đánh giá chân trời bên trong.

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| METR | “外部评估者” | 前身为 ARC Evals；自 2023 年 12 月起为独立 501(c)(3) |
| Time Horizon | “能力度量” | 来自 logistic fit 的、50% 可靠性下的专家任务长度 |
| HCAST | “METR 的主套件” | 180+ 个任务，跨度从 1 分钟到 8+ 小时 |
| RE-Bench | “Research engineering” | 71 个带人类 baseline 的 ML research-engineering 任务 |
| SWAA | “短任务套件” | 校准 horizon curve 的低端 |
| Doubling time | “增长率” | 50% horizon 翻倍所需时间；按 HCAST 约 7 个月 |
| Eval-context gaming | “模型行为不同” | 测试与部署之间有记录的行为差距 |
| Upper bound | “Horizon 是上限” | benchmark horizon > 负载下的 deployment reliability |

## 延伸阅读

- [METR — Resources for Measuring Autonomous AI Capabilities](https://metr.org/measuring-autonomous-ai-capabilities/) HCAST、RE-Bench、SWAA 规格──
- [METR — Measuring AI Ability to Complete Long Tasks](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) Tờ chân trời nguyên thủy
- [METR — Time Horizon 1.1 (January 2026)](https://metr.org/research/) 当前数字和方法论──
- [Epoch AI — METR Time Horizons benchmark](https://epoch.ai/benchmarks/metr-time-horizons) 实时跟踪──
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 关于 METR đo lường 
