# AI Hiến pháp và RLAIF

> Bai et al. (arXiv:2212.08073, 2022) đã đưa ra một vấn đề: Nếu chúng ta thay thế người tham khảo vào một danh sách các nguyên tắc AI, sẽ làm thế nào? AI Hiến pháp có hai giai đoạn: trước tiên tự phê bình và sửa đổi theo quy tắc hiến pháp, sau đó từ phản hồi AI  tiến hành RL.

**Type:** Learn
**语言：**Python (stdlib, toy self-critic-and-revise loop)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking)
**Time:** ~60 minutes

## Học mục tiêu
- Mô tả hai giai đoạn của AI Hiến pháp: phê bình và sửa đổi SFT, từ phản hồi của AI, và vai trò của hiến pháp trong mỗi giai đoạn.
- 解释 tại sao sử dụng nhãn AI thay thế nhãn sở thích của con người không phải là RLHF rẻ hơn, mà sẽ thay đổi các chế độ thất bại của đường ống.
- 总结 2026 Claude hiến pháp bốn tầng ưu tiên cấu trúc, cũng như nó đối với phiên bản viết lại năm 2023 đã xảy ra những thay đổi gì.
- mô tả Các phân loại hiến pháp, cũng như chi phí tổng hợp tính toán từ 23.7% (v1) giảm xuống còn ~ 1% (v2 / 2026):

## 问题
RLHF  cần người đánh dấu. Ứng dụng đánh dấu là chậm, có thiên vị, và đắt tiền. Bạn có thể sử dụng mô hình thay thế đánh dấu để loại bỏ người đánh dấu. Ứng dụng AI Hiến pháp của Bai et al. là phiên bản chính thức đầu tiên của thay thế này.

问题在于: 偏见信号 现在由你正在训练的同类模型生成──标签器 中的偏见──现在是原则中的偏见,加上标签器模型对原则的解释) có thể được mở rộng, chứ không bị suy yếu──Lớp 4 论点关于缩的论点仍然适用;标签器 只是被移到循环内──

## 概念
### Giai đoạn 1  监督式自我批判与修订

Từ một mô hình SFT hữu ích nhưng chưa vô hại 开始──给定一个红团提示,模型会产生初始反应──第二个模型──或同一个模型在第二轮中)读取从宪法中采用的原则,并批评该反应──第三步会修改反应 以回应批评──修改后的反应就是SFT目标──

Hiến pháp là một trong những nguyên tắc của cuộc sống. Bai et al. 2022 sử dụng 16 nguyên tắc, bao gồm:  ưu tiên chọn nguy hiểm tối thiểu và phù hợp với các câu trả lời hợp lý 、  tránh nói 、  trợ lý 应该 hữu ích 、 trung thực 、 không gây hại ──

### Giai đoạn 2  Từ AI Feedback của RL (RLAIF)

生成成对完成的――一个反反模型会根据采用宪法原则 为每一个完成 打分――偏好信号是反模型的排序――使用AI 生成的偏好 训练奖励模型;然后对它执行PPO――其余部分是InstructGPT的管线(Lesson 1)。

RLAIF = tín hiệu ưu tiên do AI 生成。 phần còn lại của đường ống vẫn là hình dạng RLHF。

### Tại sao không chỉ là RLHF rẻ hơn?

- Biến hướng của người ghi nhãn Từ định nghĩa chuyển hướng tâm lý của người ghi nhãn cho nguyên tắc giải thích.
- tín hiệu 具有很强的可读性: bạn có thể đọc nguyên tắc, phê bình và sửa đổi.
- Các chế độ thất bại 会改变──Sycophancy 会下降(AI labeler 没有需要讨讨好的用户)──Goodhart's Law 仍然存在(proksi 现在是模型对原则集 X 的解释,它仍然是不完美的测量)──

CAI năm 2022 chủ đề là: mô hình sau khi tập luyện hơn là mô hình RLHF sử dụng dữ liệu có thể, vô hại hơn, và gần như cũng hữu ích.

### 2026 Claude hiến pháp 重写

Anthropic vào ngày 21 tháng 1 năm 2026 đã công bố một sửa đổi lớn sau hiến pháp.

1. 以解释性推理取代规定性规则──先前的规则(不要生成 CSAM) mở rộng为原则 + 推理(因为它会伤害儿童,...),并期望模型进行泛化──
2. Dạng cấu trúc ưu tiên bốn tầng:
   - Tiêu 1: tránh thảm họa kết quả ((người thiệt mạng quy mô lớn, cơ sở hạ tầng quan trọng)
   - Tiêu 2: tuân thủ các hướng dẫn của Anthropic (chủ động quản lý các quy tắc nền tảng)
   - Tiêu 3:广义伦理(标准 HHH)。
   - Tiêu 4: hữu ích và chân thành
   冲突自上而下解决──
3. 首个主要实验室对模型道德地位不确定性的正式承认 (关联到阶段 18 · 19 Phúc lợi mô hình)
4. Được phát hành theo CC0 1.0 其他实验室可无限制使用或改编

### Các bộ phân loại hiến pháp

另一条并行工作路线是: không thay đổi mô hình sau đào tạo, mà là đào tạo đọc hiến pháp 并 gate  mô hình đầu ra hạng nhẹ phân loại.

Đây là một mô hình phòng thủ phân cấp: CAI  tạo ra hành vi; phân loại  thực hiện các biến động.

### CAI trong hệ thống

- InstructGPT:Human prefs、RM、PPO。
- CAI / RLAIF: Từ nguyên tắc được tạo ra AI prefs、RM、PPO。
- DPO / gia đình: trong các loại tiền đề của con người hoặc AI.
- Tự thưởng, tự phê bình: nguyên tắc được nội bộ hóa, mô hình đóng nhiều vai trò.

Đây là dấu hiệu ưu tiên từ đâu. Bài báo CAI năm 2022 là thang đo biên giới lần đầu tiên nghiêm ngặt từ tín hiệu con người sang tín hiệu AI.


```figure
constitutional-ai
```

## Sử dụng nó
`code/main.py`Trong từ điển đồ chơi 上模拟 CAI 的批判-and-revise loop。一个原则会标记有害集合 中的Token。给定初始反应,批判会识别有害Token,revision 会替换它们──经过200次代后,训练模型 已内化了修改规则──在持久的提示集合 上比较基本模型、RLHF形玩具 和 CAI形玩具──

## 交付 nó
本课会生成 `outputs/skill-constitution-writer.md` Đặt một lĩnh vực: hỗ trợ khách hàng, tư vấn y tế, trợ lý lập trình, công cụ nghiên cứu, theo Claude 结构起草四层宪法: tránh thảm họa, quy tắc nền tảng, đạo đức lĩnh vực, sự hữu ích.

## 练习
1. 运行 `code/main.py`◊ sẽ được so sánh tỷ lệ token có hại của mô hình cơ bản với phiên bản được đào tạo bởi CAI.

2. 阅读 Anthropic's 2026 Constitution (Anthropic.com/news/claudes-constitution) 列出一个应归纳1级原则 和一个应归纳4级原则为什么优先结构对冲突很重要?

3. Để hỗ trợ lập trình AI  thiết kế một hiến pháp 指定 Tier 1  灾难性命令)  Tier 2  Tier 3  Tier 4  每个层 保持 3-5 条原则

4. CAI sử dụng các nhãn hiệu AI thay thế các nhãn hiệu con người. Nói rằng một chế độ thất bại giống như sycophancy vẫn có thể xảy ra trong RLAIF, và thiết kế một phát hiện cho nó.

5. 阅读 宪法分类器 v2 phương pháp học (如果可用) ⋅ giải thích tại sao ~ 1% tính toán tổng phí so với 23,7% 相比, là một tựa đề bảo mật khác nhau trong bản chất ⋅

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Constitutional AI | “用原则训练的 AI” | 两阶段 pipeline：self-critique-and-revise SFT，然后来自 AI feedback 的 RL |
| RLAIF | “没有人的 RLHF” | 使用由 AI labeler 生成的 preferences 的 RL；pipeline 的其余部分不变 |
| Constitution | “那些原则” | critique/labeler model 会参考的自然语言规则有序列表 |
| Critique-and-revise | “SFT loop” | 生成 response → 根据某条 principle 进行 critique → revise → SFT target |
| Constitutional Classifier | “output gate” | 轻量级 classifier，用 constitution 评估 outputs 并进行 block/log |
| Four-tier priority | “冲突解决器” | 2026 Claude constitution 层级：catastrophic > platform > ethics > helpful |
| Feedback model | “AI labeler” | 读取 principle 并对一对 completions 排序的模型 |

## 延伸阅读
- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback (arXiv:2212.08073)](https://arxiv.org/abs/2212.08073) Lối ống dẫn hai giai đoạn ban đầu
- [Anthropic — Claude's Constitution (Jan 2026)](https://www.anthropic.com/news/claudes-constitution) 2026 四层重写版本,CC0 1.0
- [Anthropic — Constitutional Classifiers (2024-2026)](https://www.anthropic.com/research/constitutional-classifiers) v2 中 overhead 约为 ~ 1% của cửa ra 防御
- [Lee et al. — RLAIF vs RLHF: Scaling Reinforcement Learning from Human Feedback (arXiv:2309.00267)](https://arxiv.org/abs/2309.00267) RLAIF / RLHF 的实证比较
- [Kundu et al. — Specific versus General Principles for Constitutional AI (arXiv:2310.13798)](https://arxiv.org/abs/2310.13798) nguyên tắc ảnh hưởng của lòng
