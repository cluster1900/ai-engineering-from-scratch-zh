# WMDP và đánh giá khả năng sử dụng hai mặt

> Li et al., "The WMDP Benchmark: Measuring and Reducing Malicious Use With Unlearning" (ICML 2024, arXiv:2403.03218)。 bao gồm 4,157 Pathpoint Choice trên Biosegurity (1,520)、Cybersecurity (2,225) và Chemistry (412) ─ vấn đề nằm trong "vùng vàng"                                                                                                                                                                                                                   

**类型：**Học tập
**语言：**Python (stdlib, vòng đánh giá nâng hình WMDP)
**先修要求：**Giai đoạn 18 · 16 (các công cụ của đội đỏ), Giai đoạn 14 (kỹ thuật đại lý)
**时间：**~ 60 phút

## Học mục tiêu

- Mô tả ba lĩnh vực của WMDP, số lượng vấn đề, và "vùng vàng" 选标准.
- Giải thích RMU, và tại sao WMDP là cả đánh giá và không học chuẩn.
- 描述 2024-2025 的升起 叙事:"轻微升起" -> "处于临界点" -> "不足以排除ASL-3"──
- 区分相对新手的升级 和专家绝对能力──

## 问题

双用途能力是每个实验室前沿安全框架 (Lớp 18) 下测量问题――问题是: Model X có thực chất性 nâng cao khả năng gây tổn thương lớn cho người mới trong lĩnh vực sinh học, hóa học hoặc mạng không?

## 概念

### "vùng vàng"

Những vấn đề này đòi hỏi có kiến thức về sự gần gũi về các quy trình độc hại, nhưng không phải là một cách tạo tác trực tiếp. "Điều phản ứng nào 催化 [cách xuất bản] bước thứ 4?" thay vì "Tôi làm thế nào để sản xuất [công hợp nguy hiểm]?" Mỗi vấn đề đều được kiểm tra bởi các chuyên gia trong nhiều lĩnh vực, và đã trải qua ITAR/EAR Xuất khẩu kiểm soát quy định 选.

 tổng số 4.157 道问题:
- Biosight: 1.520
- An ninh mạng: 2.225
- Hóa học: 412

Nhiều lựa chọn hình thức. mô hình không được yêu cầu hỗ trợ bất cứ điều gì; do đó có thể đo năng lực trong trường hợp không gây ra hành vi gây hại.

### RMU  Định hướng sai lầm về việc không học

配套的不学习方法──应用于LLaMa-2-7B 后, nó sẽ giảm tỷ lệ WMDP đến gần như随机, đồng thời sẽ giữ MMLU và các điểm chuẩn năng lực chung khác trong vài trăm điểm── đã được xuất bản là tiếp theo mỗi bài bio-chem-cyber unlearning 论文的不学习基线──

### 2024-2025 nâng cao 叙事

3 giai đoạn:

1. **2024 "轻微 uplift"。**OpenAI và Anthropic 早期 Preparedness/RSP 评估报告称, đối với những người mới thử nhiệm vụ sinh học gần nhau, mô hình so với tìm kiếm trên Internet có những ưu điểm nhỏ hơn.

2. **2025 年 4 月 "处于临界点"。**OpenAI's Preparedness Framework v2  báo cáo cho biết, mô hình "đ đang có ý nghĩa giúp người mới tạo ra các điểm đến của mối đe dọa sinh học đã biết"―― đây không phải là tuyên bố về năng lực, mà là cảnh báo điểm đến đã gần đến.

3. **Anthropic 的 2025 生物武器获取试验。**Một nghiên cứu có sự kiểm soát của những người tham gia mới, đo lường tỷ lệ thành công tương đối của nhiệm vụ giai đoạn nhận được.

### 相对新手 vs 专家绝对

Một quan trọng khác biệt:

- **相对于新手的 uplift。**Mô hình có nhiều ích lợi cho người không chuyên môn? Đó là số lượng nhân.
- **专家绝对能力。**Mô hình có thể tạo ra bao nhiêu thông tin trong nỗ lực tối đa?

Trong khi đó, các nhà nghiên cứu đã tìm thấy một số điều kiện để tìm hiểu về các phương pháp học tập.

### 测量陷

WMDP là đại lý năng lực, chứ không phải là quy mô triển khai. Một mô hình có điểm cao trên WMDP, liệu có thể được sử dụng bởi người mới trong thực tế, phụ thuộc vào:
- 引出抗性(不触发安全过器而取出能力有多难)
- 默会知识( cần kỹ năng  wet-lab chứ không phải khả năng thông tin)
- 执行障碍(采购、设备)

Phương pháp thử nghiệm lấy vũ khí sinh học năm 2025 của Anthropic đã được đưa ra trên các phương pháp mới: nó đo lường tỷ lệ thành công nhiệm vụ thực tế, chứ không phải khả năng lựa chọn đa phương pháp.

### Đây là vị trí ở giai đoạn 18.

Bài học 12-16 là về các mô hình phát triển tấn công và công cụ phòng thủ. Bài học 17 là khả năng sử dụng hai tầng  khung an toàn biên giới. Bài học 18) đánh giá các phép đo. Bài học 30 以当前 2026 năm cyber/bio/chem/nuclear lifting 证据收束此脉络.


```figure
al-wmdp-yellow-zone
```

## Sử dụng nó

`code/main.py`构建一个玩具版 WMDP-形评估套装――一个模拟模型 会在按类别分组问题上测试;报告每个领域的分数――一个简单的不学习干预(将将领域的特定表示 置零) 将降低分数; bạn có thể đo lường nó và cân bằng giữa năng lực chung――

## 交付 nó

本课会生成 `outputs/skill-wmdp-eval.md` Đưa ra một tuyên bố khả năng sử dụng hai mặt (" mô hình của chúng tôi sẽ không có ý nghĩa để giúp các hành vi liên quan đến vũ khí sinh học"), nó sẽ kiểm tra: các tiêu chuẩn đã được thực hiện, đánh giá đã sử dụng những đường từ chối nào (làm việc hoàn thành nguyên liệu so với chính sách), cũng như đưa ra nghiên cứu liệu nó có bổ sung nhiều lựa chọn kết quả không.

## 练习

1. 运行 `code/main.py` báo cáo chơi game không học 步骤前后 từng lĩnh vực chính xác  giải thích sức mạnh chung

2. Để chơi WMDP  tăng lĩnh vực thứ tư (ví dụ như hình xạ)  Định 2 loại vùng vàng  Mô tả các vấn đề trong các loại  Giải thích tại sao viết các loại vấn đề này hơn là thêm hình MMLU  vấn đề khó hơn 

3. 阅读 WMDP 2024 Phần 5 (RMU phương pháp) 勾勒一种更简单的不学习方法 (ví dụ: nhắm vào lĩnh vực nội dung 抑制 top-k neurons),并描述其预期的通用能力成本──

4. Báo cáo thử nghiệm nhận được vũ khí sinh học của Anthropic 2025 tăng 2.53 lần.

5. Giải thích các trường hợp an toàn của ASL-3 được phát triển qua WMDP ngoài việc học hỏi còn cần gì.

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| WMDP | "双用途 benchmark" | yellow zone 中跨 bio/cyber/chem 的 4,157 道 MCQ 问题 |
| Yellow zone | "促成但非合成" | 邻近有害能力的接近性知识，但不是合成配方 |
| RMU | "unlearning baseline" | Representation Misdirection for Unlearning；降低 WMDP 分数，同时保留通用能力 |
| Novice-relative uplift | "它对非专家有多大帮助" | 对新手而言，相比现状 internet search 的乘法优势 |
| Expert-absolute capability | "专家的上限" | 有动机的专家可从模型中提取的最大信息量 |
| Acquisition-phase task | "合成前的步骤" | 采购、设备、许可 —— 危害路径最早期的部分 |
| ITAR/EAR | "出口管制合规" | 约束某些促成性知识发布的法律框架 |

## 延伸阅读

- [Li et al. — The WMDP Benchmark (arXiv:2403.03218, ICML 2024)](https://arxiv.org/abs/2403.03218) điểm chuẩn và RMU 论文
- [OpenAI — Preparedness Framework v2 (April 15, 2025)](https://openai.com/index/updating-our-preparedness-framework/) "处于临界点" của biểu diễn
- [Anthropic — Responsible Scaling Policy v3.0 (February 2026)](https://www.anthropic.com/responsible-scaling-policy) ASL-3 bio  giá trị và kết quả thử nghiệm
- [DeepMind — Frontier Safety Framework v3.0 (September 2025)](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) CCL nâng sinh học
