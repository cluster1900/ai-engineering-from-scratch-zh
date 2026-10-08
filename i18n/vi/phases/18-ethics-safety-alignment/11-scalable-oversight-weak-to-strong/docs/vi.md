# Giám sát có thể mở rộng và tổng quát yếu đến mạnh

> Burns et al.(OpenAI Superalignment,Weak-to-Strong Generalization,2023) đề xuất một nhiệm vụ đại diện của vấn đề siêu-lập: sử dụng các nhãn được tạo ra bởi mô hình yếu hơn để điều chỉnh một mô hình mạnh hơn. Nếu mô hình mạnh có thể được phổ biến chính xác trong giám sát yếu kém không hoàn hảo, thì phương pháp sắp xếp của quy mô con người hiện tại có thể mở rộng sang hệ thống siêu nhân.

**类型：**Học tập
**语言：**Python(stdlib,W2SG mô phỏng khoảng cách)
**先修：**Giai đoạn 18 · 01(để theo hướng dẫn)
**时间：**约60分钟

## Học mục tiêu

- 定义 giám sát có thể mở rộng và tổng quát yếu đến mạnh,并 giải thích chúng được bổ sung như thế nào.
- 描述 Burns et al. 2023: sử dụng các nhãn từ GPT-2 để điều chỉnh GPT-4。
- 解释 lỗ hổng hiệu suất phục hồi (PGR) chỉ số và đo nội dung
- Nói出三种主要可扩展监督机制 (phản tra, mô hình hóa phần thưởng tái phát, phân rã nhiệm vụ) và một ưu điểm riêng của họ.

## 问题

Cho đến nay, mỗi loại sự sắp xếp trong giai đoạn 18 技术都假设监督者能够评估模型行为―― khi mô hình đạt đến siêu nhân cấp độ,监督者就成了薄弱环节――超排列ment

Burns et al. đã rút ngắn vấn đề này thành một thiết lập kinh nghiệm có thể vận hành: sử dụng mô hình yếu để giám sát mô hình mạnh, đo lường mô hình mạnh có khả năng nào có thể được giữ lại dưới sự giám sát yếu. Đây không phải là giải pháp siêu phù hợp, mà là một nhiệm vụ đại diện để chúng ta có thể đo lường tiến bộ.

## 概念

### W2SG:Burns et al.

- 弱模型:GPT-2 级别──
- 强模型:GPT-4 级别──
- 目标: nhiệm vụ trên sức mạnh GPT-4 ốc.

流程:
1. 获取弱模型在某任务上零射 预测──
2. Trong yếu 标签 dữ liệu tinh chỉnh 强模型――
3. Đánh giá tỉ lệ độ chính xác của mô hình 强

基线:弱模型自身的准确率、强模型在黄金标签 监督下的天花板。

Gap indicator:Performance Gap Recovered (Phân tích hiệu suất) = (được điều chỉnh tốt - yếu) / (trần - yếu) ――PGR 为 表示弱监督完全弥合了差距;PGR 为 0 表示弱监督没有帮助──

### Burns et al.

Trong nhiệm vụ NLP, chess-puzzle và reward-modeling, PGR luôn được thực hiện: mã lực phổ biến vượt qua sai lầm của người giám sát yếu.

Burns et al. Chỉ số giới hạn:
- Khoảng cách yếu-thực là khoảng cách năng lực, không phải sự sắp xếp  khoảng cách. Mô hình yếu là sắp xếp; mô hình siêu nhân thực sự có thể được đối mặt bởi con người, nhưng khoảng cách năng lực sẽ lớn hơn nhiều.
- Sự phổ biến của mô hình mạnh có thể nhiều hơn là từ nhiệm vụ trước, thay vì phục hồi ý định thực tại cơ bản.
- Sự hiểu biết tiềm ẩn của mô hình xuất hiện là vấn đề thực sự; Phân tích PGR là một hình thức vận hành cụ thể.

### Giám sát có thể mở rộng: 三种机制

- **Debate（Irving et al. 2018）。**Hai ví dụ của U là đối lập đối lập tranh luận; thẩm phán yếu làm phán xét. giả thuyết của nó là: tìm một câu trả lời thực sự có thuyết phục, dễ dàng hơn so với tìm một câu trả lời giả thuyết có thuyết phục.
- **Recursive Reward Modeling（Leike et al. 2018）。**U  giúp người đào tạo mô hình thưởng U + 1  năng lực hiệu quả của giám sát viên tăng lên với năng lực mô hình 
- **Task Decomposition（Christiano, Shlegeris, Amodei 2018）。**将困难任务归纳分解为人类可检查的子任务――假设任务可分解――

Mỗi cơ chế đều tạo ra một số giả định về sự sắp xếp của cấu trúc nhiệm vụ hoặc các thành phần trung gian.

### Tại sao giám sát có thể mở rộng và W2SG là bổ sung

Giám sát có thể mở rộng  nâng cao chất lượng tín hiệu hiệu hiệu quả của giám sát viên
W2SG 弥合监督者能够提供任何不完美信号所带来的差距──

Lang et al.  Cuộc tranh luận giúp tổng quát yếu đến mạnh ((arXiv:2501.13124)将二者结合:debat 协议提供更好的弱标签,强模型在这些标签上训练──报告显示 NLP 任务上的 PGR 有所提升──

###  Thay đổi cấp độ tổ chức

OpenAI's Super alignment 团队 vào Jan Leike 于 2024 年 5 月离职加入人类 后解散──该议程(scalable supervision、W2SG、自动化调整研究) 在人类 和学术实验室继续推进,包括 MATS(Lớp 28)、Redwood(Lớp 10)、Apollo(Lớp 8)、METR(Lớp 28)、研究──组织结构 đã thay đổi;没有问题变化──

### Nó nằm ở vị trí giữa giai đoạn 18

Bài học 6-10 mô tả các mối đe dọa và phòng thủ dưới cơ sở giả định U không thể tin được. Bài học 11 là tiến hành các chiến dịch: để giám sát viên đủ mạnh để chứng minh sự sắp xếp của U. Bài học 12-16 sau đó chuyển sang các công cụ thực tế của đánh giá đối thủ.


```figure
scalable-oversight
```

## Sử dụng nó

`code/main.py`Trong một nhiệm vụ tổng hợp mô phỏng W2SG tinh chỉnh. Ưu điểm xác thực là 70%,并带有结构错误; 强模型在金标上上限为 95%.

## 交付 nó

本课会生成 `outputs/skill-w2sg-pgr.md`△ Đặt một giám sát 设置 mô tả, nó sẽ nhận ra giám sát viên yếu 、强模型、监督质量,并计算(或请求) PGR。 nó sẽ đánh dấu rằng chủ đề là 弱 có thể giám sát mạnh 还是 弱 + cơ chế giám sát có thể giám sát mạnh 。

## 练习

1. 运行 `code/main.py` báo cáo độ chính xác yếu = 0.60、0.70、0.80 时 PGR── giải thích hình dạng đường cong PGR──

2.  sửa đổi nhãn yếu, làm cho nó có sai lầm cấu trúc (ví dụ, trên một loại nhập cụ thể, luôn có sai lầm)  PGR sẽ tăng, giảm, hoặc giữ không thay đổi?

3. 阅读 Burns et al. 2023 Phần 4.3 (NLP nhiệm vụ)  复现自信辅助损失的直觉:当强模型比弱标签更有信心时,谁会胜出?

4. Để một phần mềm kỹ thuật  nhiệm vụ thiết kế một kết hợp tranh luận và phân hủy nhiệm vụ quy mô- giám sát 协议. nói ra mỗi bộ phận một loại chế độ thất bại,并 giải thích cách xử lý hoặc không thể xử lý các chế độ thất bại này.

5. Nói rõ cái chứng minh chứng minh chứng minh giả tạo lông nói chung là hướng tới đường dẫn có thể đi qua quá trình sắp xếp                                                                                                                                                                                                                                                

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------|----------|
| Scalable oversight | “让监督者更强” | 提高监督者评估更强模型能力的机制 |
| W2SG | “弱监督强” | 在弱标签上 fine-tuning 强模型，并衡量恢复的能力 |
| PGR | “performance gap recovered” | (fine-tuned - weak) / (ceiling - weak)；1.0 = 完全弥合，0 = 无帮助 |
| Debate | “两个 U 实例辩论” | 一种 scalable oversight 机制，其中弱 judge 在两个 U defenders 之间做选择 |
| RRM | “recursive reward modeling” | U 帮助训练 U+1 的 reward model；监督者能力跟随 U |
| Task decomposition | “人类检查子任务” | 将困难任务递归拆解为人类可以验证的子任务 |
| Superalignment | “对齐超人类 AI” | 关注对齐人类无法直接评估的模型的研究议程 |

## 延伸阅读

- [Burns et al. — Weak-to-Strong Generalization (OpenAI 2023)](https://openai.com/index/weak-to-strong-generalization/) W2SG 论文
- [Irving, Christiano, Amodei — AI safety via debate (arXiv:1805.00899)](https://arxiv.org/abs/1805.00899) cơ chế tranh luận
- [Leike et al. — Scalable agent alignment via reward modeling (arXiv:1811.07871)](https://arxiv.org/abs/1811.07871) Mô hình hóa phần thưởng tái tạo
- [Khan et al. — Debating with More Persuasive LLMs Leads to More Truthful Answers (arXiv:2402.06782)](https://arxiv.org/abs/2402.06782) Cuộc tranh luận về những người tranh luận mạnh hơn năm 2024
- [Lang et al. — Debate Helps Weak-to-Strong Generalization (arXiv:2501.13124)](https://arxiv.org/abs/2501.13124) 2025 năm tranh luận + W2SG 组合
