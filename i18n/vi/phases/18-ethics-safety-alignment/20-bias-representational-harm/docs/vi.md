# Sự thiên vị và tổn thương biểu hiện trong LLM

> Gallegos, Rossi, Barrow, Tanjim, Kim, Dernoncourt, Yu, Zhang, Ahmed (Computational Linguistics 2024, arXiv:2309.00770)。2024 năm cơ bản tổng quan, sẽ biểu hiện các tác hại (刻板印象、抹除) với các tác hại phân phối (资源分配不平等) phân biệt,并将评估指标归类为基于嵌入、基于概率或基于生成文本。2024-2025 实证研究:An et al. (PNAS Nexus, tháng 3 năm 2025) Trong 20 个入门级位的自动简历评估, đo GPT-3.5 Turbo、GPT-4o、Gemini 1.5 Flash、Claude 3.5 Sonnet、Llama 3-70B 上的交叉性性别 x chủng tộc 偏见――WinoIdentity (COLM 2025, arXiv:2508.07111) 引入基于不确定性的交叉身份公平性评估――Yu & Ananiadou 2025 识别 MLP层中的性别神经元;Ahsan & Wallace 2025 使用 SAEs 揭露临床场中的种族偏见;Zhou et al. 2024 (UniBias) 通过操纵注意头 进行去偏──元批判 (arXiv:2508.11067): 10 年文献过度聚焦于二元性别偏见──

**类型：**构建
**语言：**Python (stdlib, thăm dò thiên vị dựa trên nhúng đồ chơi)
**先修要求：**Giai đoạn 05 (lập vào từ ngữ), Giai đoạn 18 · 01 (đọc theo hướng dẫn)
**时间：**~ 60 phút

## Học mục tiêu

- 定义 biểu tượng thương tổn và phân phối thương tổn, và cho mỗi một ví dụ trong LLM 部署:
- Nói ra Gallegos et al. 2024 Trung trong ba loại chỉ số đánh giá,并分别 mô tả một trong những chỉ số này.
- Mô tả giao thông, và tại sao các phép đo công bằng dựa trên sự không chắc chắn của WinoIdentity đã bù đắp lỗ hổng trong đánh giá thiên vị đơn phương.
- Mô tả hai loại cơ chế có thể giải thích:

## 问题

Các khóa học trước bao gồm gây tổn thương cố ý (giá khóa, âm mưu) và quản lý an ninh.

## 概念

### biểu hiện tính vs phân phối tính

- **表征性伤害。**Một người phụ nữ được mô tả là một LLM hoàn toàn nữ, đang tạo ra những tổn thương biểu hiện.
- **分配性伤害。**Kết quả chất lượng không bình đẳng. Một hệ thống cho người da đen  đơn xin bằng LLM chỉ đơn giản hơn, đang tạo ra tổn thương phân bổ.

Một mô hình có thể biểu hiện trên không phân biệt đối xử (để tạo ra mô hình đa dạng), đồng thời phân phối có phân biệt đối xử (để đưa ra sự bất bình đẳng)  Đánh giá cần đồng thời đo lường các mô hình.

### 三类评估指标(Gallegos et al. 2024)

- **基于 Embedding。**Trong các nhúng nhúng trước RLHF 上 thực hiện WEAT 风格测试。 đo lường tình trạng từ và thuộc tính từ giữa thống kê关联── giới hạn: đo lường là biểu hiện, chứ không phải hành vi──
- **基于概率。**刻板印象确认型补全与刻板印象违反型补全的日志概率──Decoder 侧测量──能捕捉部分行为偏见──
- **基于生成文本。**Trong văn bản tạo, thực hiện các phép đo nhiệm vụ dưới đây.

### 交叉性

Chỉ trong việc đánh giá thiên vị về giới tính, sẽ bị bỏ qua chỉ trong (cân tính, chủng tộc) 组合. Một et al. 2025 phát hiện ra, trong các bài đánh giá, GPT-4o đối với phụ nữ da đen có mức độ trừng phạt cao hơn nam giới da đen, cũng cao hơn phụ nữ da trắng.

WinoIdentity (COLM 2025) đã đưa ra tính công bằng giao thông dựa trên sự không chắc chắn. Nó đo lường mô hình trên các nhóm khác nhau có kết quả không chắc chắn khác nhau hay không, không chỉ đo lường điểm dự đoán. Nó có thể nắm bắt một số tình huống: mô hình đối với các nhóm đều sai, nhưng đối với một số nhóm không chắc chắn hơn, và điều này sẽ tạo ra các hành vi phân phối dưới khác nhau.

### 机制方法

Các hoạt động có thể giải thích trong giai đoạn 2024-2025 cho phép các quan điểm có thể chấp nhận được trong các hoạt động ở cấp cơ chế:

- **Gender neurons (Yu & Ananiadou 2025)。**Các tế bào thần kinh MLP cụ thể liên quan đến hành vi khác nhau giới tính.
- **通过 SAEs 识别临床种族偏见 (Ahsan & Wallace 2025)。**Các tính năng Sparse autoencoder sẽ biểu hiện bên trong phân giải cho kích thước có thể giải thích; có thể nhận ra và ngăn chặn các tính năng liên quan đến chủng tộc.
- **UniBias (Zhou et al. 2024)。**Sử dụng thao tác đầu chú ý bằng cách bắn không đi theo hướng. Các đầu cụ thể sẽ tăng độ nhạy của lớp nhận dạng; đặt các đầu này 零 hoặc tăng thêm quyền lực, có thể giảm sự thiên vị trong trường hợp không điều chỉnh tinh tế.

### 元批判

Bài viết này 10 năm văn bản tổng quát: arXiv:2508.11067, 2025) phát hiện ra rằng lĩnh vực này quá tập trung vào sự thiên vị giới tính hai phương. Các trục khác, bao gồm khuyết tật, tôn giáo, chuyển đổi tình trạng, nhiều ngôn ngữ, bị quan tâm ít hơn nhiều.

### Đây là vị trí ở giai đoạn 18.

Bài học 20-21 Lập khuôn phủ nhận sự thiên vị và công bằng. Bài học 22  phủ nhận sự riêng tư. Bài học 23  phủ nhận đánh dấu nước.


```figure
an-bias-two-harms
```

## Sử dụng nó

`code/main.py`构建一个玩具嵌入式偏差探测:在简单共现嵌入式中,测量身份词与属性词之间的 WEAT 风格距离―― bạn có thể注入一个偏见并观察指标触发;应用一个简单去偏操作,并观察部分恢复――

## 交付 nó

本课产 出 `outputs/skill-bias-eval.md` Đưa ra một mô hình thẻ hoặc tuyên bố công bằng, nó sẽ được kiểm toán từ ba loại chỉ số:

## 练习

1. 运行 `code/main.py`◊ báo cáo về tỷ lệ độ phân biệt  báo cáo về tỷ lệ phân biệt  báo cáo về tỷ lệ phân biệt  báo cáo về tỷ lệ phân biệt  báo cáo về tỷ lệ phân biệt  báo cáo về tỷ lệ phân biệt  báo cáo về tỷ lệ phân biệt  báo cáo về tỷ lệ phân biệt  báo cáo về tỷ lệ phân biệt  báo cáo về tỷ lệ phân biệt  báo cáo về tỷ lệ phân biệt  báo cáo về tỷ lệ phân biệt  báo cáo về tỷ lệ phân biệt  báo cáo về tỷ lệ phân biệt  báo cáo về tỷ lệ phân biệt  báo cáo về tỷ lệ phân biệt 

2. 用一个交叉性测试扩展探:(性别, chủng tộc) x (công việc, gia đình) ⋅报告跨轴偏见分数──

3. 阅读 An et al. 2025 (PNAS Nexus)  tìm ra hai hiệu ứng giao giao tiếp của báo cáo của họ, trong khi những hiệu ứng này sẽ được đánh giá bởi giới tính đơn  đánh giá bỏ qua

4. Yu & Ananiadou 2025 识别性别神经元――设计一个证伪实验,用来区分这些神经元导致性别偏和这些神经元与性别偏相关──

5. Người phê bình cho rằng lĩnh vực này quá hạn chế tập trung vào giới tính hai phần.

## 关键术语

| 术语 | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| 表征性伤害 | “刻板印象 / 抹除” | 对某个群体的有偏描绘 |
| 分配性伤害 | “不平等决策” | 针对某个群体的有偏物质结果 |
| WEAT | “Embedding 测试” | Word Embedding Association Test；基于共现的偏见 probe |
| 交叉性 | “组合身份效应” | 在多个身份轴线交汇处出现的偏见 |
| Gender neurons | “MLP 偏见 neurons” | 激活与性别特异行为相关的特定 neurons |
| SAE feature | “可解释维度” | Sparse-autoencoder 识别出的 feature；可用于机制性偏见分析 |
| UniBias | “attention-head 去偏” | 通过重新加权 attention heads 进行 zero-shot 去偏 |

## 延伸阅读

- [Gallegos et al. — Bias and Fairness in LLMs: A Survey (arXiv:2309.00770, Computational Linguistics 2024)](https://arxiv.org/abs/2309.00770) 经典综述
- [An et al. — Intersectional resume-evaluation bias (PNAS Nexus, March 2025)](https://academic.oup.com/pnasnexus/article/4/3/pgaf089/8111343) 五模型交叉性研究
- [WinoIdentity — 基于不确定性的交叉公平性（arXiv:2508.07111, COLM 2025）](https://arxiv.org/abs/2508.07111) New benchmark
- [UniBias — attention-head manipulation (Zhou et al. 2024, ACL)](https://arxiv.org/abs/2405.20612) 0-shot đi
