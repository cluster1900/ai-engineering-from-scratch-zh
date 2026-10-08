# A/B Testing LLM 功能  GrowthBook、Statsig và với cảm giác vấn đề

> 传统A/B Testing không phải là một LLM không chắc chắn 构建的. 关键区别:evals 回答模型能完成这项工作吗?A/B tests 回答用户意意吗?两者都必不可少; dựa trên vibe checks 发布已结束.**Statsig**(Năm 2025, tháng 9 được OpenAI lấy $1.1B 收购)  thử nghiệm theo dõi CUPED、一体化**GrowthBook** mã nguồn mở √ kho-độc địa √ Bayesian + Frequentist + Sequential 引擎、CUPED、SRM 检查、Benjamini-Hochberg + Bonferroni 校正──

**Type:** Learn
**Languages:** Python (stdlib, toy sequential test simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 20 (Progressive Deployment)
**Time:** ~60 minutes

## Học mục tiêu
- 区分 evals(模型能完成这项工作吗) và A/B test(用户在意吗)
- 列举三个可测试轴线(prompt、model、parameters),并为每个轴线选择指标──
- 解释 CUPED、 kiểm tra theo dõi 和 Benjamini-Hochberg nhiều điểm so sánh chỉnh sửa.
- 基于仓库-SQL 姿态和企业收购立场,在Statsig或 GrowthBook 之间做选择──

## 问题
Bạn đã đăng nó. Bạn đã đăng tải tỷ lệ chuyển đổi như tiếng ồn. Bạn đổ lỗi cho chỉ số. Bạn đã đăng một mô hình mới, nhưng tỷ lệ chuyển đổi không thay đổi.

Evals trả lời liệu mô hình có thể hoàn thành nhiệm vụ trên một tập hợp nhãn hiệu không. Chúng không trả lời liệu người dùng có thích xuất hơn không. Chỉ có một thí nghiệm trực tuyến được kiểm soát mới có thể trả lời câu hỏi này, và giả định là thí nghiệm có đủ sức mạnh, kiểm soát không chắc chắn, và làm cho nhiều so sánh được chỉnh sửa.

## 概念
### Các thử nghiệm Evals vs A/B

**Evals** 离线、带标签集合、法官(rubric、LLM-as-judge或人工)  trả lời: 在这个固定分布上,输出是否正确/ 有帮助/安全?

**A/B test** 在线、真实用户、随机分配──答:新变体 đã thúc đẩy các chỉ số cấp người dùng quan trọng?

两者都需要──Evals 在曝光前捕捉回归;A/B 在上线后确认产品影响──

### Điều gì để kiểm tra

1. **Prompt engineering** 措辞、系统-prompt 结构、示例──指标: nhiệm vụ thành công率、用户留存、成本/请求──
2. **Model selection** GPT-4 vs GPT-3.5-Turbo vs Llama-OSS──指标: chính xác(任务) + chi phí/ yêu cầu + độ trễ P99──多目标──
3. **Generation parameters** nhiệt độ, đỉnh, tối đa_tokens.

### CUPED  方差降低

Các thí nghiệm được kiểm soát sử dụng dữ liệu trước thí nghiệm.

实现:Statsig 和 GrowthBook đã được thực hiện.

### Kiểm tra theo trình tự

经典 A/B 假设 cố định样本量──序列测试(peek-and-decide) 在重复查看时控制错误阳性率──始终有效序列程序──mSPRT、Howard's confidence sequences)让你在明确赢家出现时提前停止──

### 多重比较校正

Trong 95%  độ tin cậy dưới 20 thử nghiệm A / B, sẽ do ngẫu nhiên tạo ra một dương tính sai. Bonferroni sửa chữa sẽ chặt chẽ mỗi thử nghiệm của α;Benjamini-Hochberg kiểm soát tỷ lệ phát hiện sai.

### SRM  tỷ lệ mẫu không phù hợp

Hash phân bổ sẽ phân phối người dùng theo thời gian cho các biến thể. Nếu 50/50 chia phần thực tế được 47/53, chỉ ra một cái gì đó đã bị hỏng.

### Statsig vs GrowthBook

**Statsig**- Có thể là:
- Được mở bởi OpenAI với giá 1,1 tỷ đô la 收购(2025 年 9 月) ・ Được lưu trữ,SaaS。
- Kiểm tra theo trình độ CUPED  quần thể bị bỏ qua
- Kết hợp: cờ tính năng + thí nghiệm + khả năng quan sát.
- Ưu điểm: Đội đã muốn đóng gói sản phẩm, và không muốn OpenAI sở hữu quyền.

**GrowthBook**- Có thể là:
- Open-source (MIT); warehouse-native( trực tiếp từ Snowflake/BigQuery/Redshift 读取)
- 多种引擎: Bayesian, Frequentist, Sequential,
- CUPED、SRM、Bonferroni、BH sửa chữa。
- Self-host hoặc quản lý đám mây.
- 最适合: kho-SQL 团队, dữ liệu nhóm kiểm soát chỉ mục cấp,希望使用OSS。

### Không xác định làm cho hiệu quả thống kê trở nên phức tạp

Đồng thời sẽ tạo ra các kết quả khác nhau. Các tính toán năng lượng truyền thống giả định IID quan sát.

### Kết quả thực tế của trường hợp

- Mô hình thưởng chatbot 变体: +70% đối với độ dài của bài nói, +30% 留存。
- Các dòng chủ đề tiếp theo: chức năng phần thưởng 优化后 +1% CTR。
- Khan Academy Khanmigo: xung quanh sự chậm trễ và tỷ lệ xác thực toán học cân nhắc kéo dài 代。

### 反模式: Với cảm giác trên đường

Mỗi kỹ sư chuyên nghiệp đều có thể nói rằng một chức năng được phát hành vì cảm thấy tốt hơn và không có A/B. Hầu hết trong số họ đã không nhận thấy chỉ số sản phẩm đã xảy ra trong nhiều tháng. A/B là hàm bắt buộc.

### Bạn nên nhớ số

- Statsig 被 OpenAI 收购: $1.1B,2025 年 9 月。
- GrowthBook: mã nguồn mở MIT;Bayesian + Frequentist + Sequential。
- CUPED 方差降低30-70%
- LLM không xác định → +30-50% 样本量缓冲──


```figure
mx-sequential-test
```

## Sử dụng nó
`code/main.py`模拟一个带有固定边界和序列边界的序列A/B test──展示序列 如何让你提前停止──

## 交付 nó
本课生成 `outputs/skill-ab-plan.md` Đưa ra thay đổi tính năng, tải trọng làm việc, đường cơ sở, chọn nền tảng, cửa, kích thước mẫu.

## 练习
1. 运行 `code/main.py`◊ Đối với đường chuyển đổi 3%  dự kiến nâng 5% để đạt 80% năng lượng  cần bao nhiêu lượng mẫu?
2. Đối với một người được chăm sóc sức khỏe  giám sát trên địa điểm  khách hàng chọn Statsig hoặc GrowthBook。
3. 设计一个A/B,测试 GPT-4 vs GPT-3.5 在成本-per-resolved-ticket 上的表现──初级计量,防线计量,二级分别是什么?
4. Canary của bạn đã qua, nhưng A / B  hiển thị -1,2% chuyển đổi. Bạn sẽ phát hành?
5. Để CUPED được áp dụng cho một giai đoạn trước, tương đương với giai đoạn sau, tương đương với 60% giai đoạn trước.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Eval | “offline test” | 对模型能力的带标签集合评估 |
| A/B test | “experiment” | 面向用户的在线随机比较 |
| CUPED | “variance reduction” | 用前期回归来降低方差 |
| Sequential test | “peek-ok test” | 允许提前停止的 always-valid procedure |
| Multiple comparison | “the family error” | 运行许多测试会放大 false positives |
| Bonferroni | “tight correction” | 将 α 除以测试数量 |
| Benjamini-Hochberg | “BH FDR” | false-discovery-rate 控制，较不保守 |
| SRM | “bad split” | Sample ratio mismatch；分配 bug |
| Statsig | “OpenAI owned” | 商业一体化平台，2025 年被收购 |
| GrowthBook | “the OSS one” | MIT warehouse-native 平台 |
| mSPRT | “sequential probability ratio test” | 经典 sequential procedure |

## 延伸阅读
- [GrowthBook — How to A/B Test AI](https://blog.growthbook.io/how-to-a-b-test-ai-a-practical-guide/)
- [Statsig — Beyond Prompts: Data-Driven LLM Optimization](https://www.statsig.com/blog/llm-optimization-online-experimentation)
- [Statsig vs GrowthBook comparison](https://www.statsig.com/perspectives/ab-testing-feature-flags-comparison-tools)
- [Deng et al. — CUPED](https://www.exp-platform.com/Documents/2013-02-CUPED-ImprovingSensitivityOfControlledExperiments.pdf)
- [Howard — Confidence Sequences](https://arxiv.org/abs/1810.08240)
