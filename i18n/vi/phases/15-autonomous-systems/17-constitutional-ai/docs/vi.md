# AI Hiến pháp và quy tắc

> Anthropic 发表于 2026 年 1 月 22 日 Claude Constitution 共 79 页,采用 CC0 授权. Nó chuyển từ quy tắc dựa trên đối tác đối tác đối tác đối tác dựa trên lý luận, và thiết lập bốn cấp độ ưu tiên: 1) an toàn và hỗ trợ giám sát con người, 2) đạo đức, 3) hướng dẫn nhân văn, 4) có tính chất. Hành vi được phân chia thành lệnh cấm cứng mã hóa: n nâng cao khả năng vũ khí sinh học, CSAM) và mặc định mềm mã hóa: người dùng và người dùng đều không thể bao gồm, người dùng sau có thể xác định các biên giới trong phiên bản ban đầu của năm 2022 n định định nghĩa về bản quyền phê bình và RLAIF n tập độc hại.

**Type:** Learn
**Languages:** Python (stdlib, four-tier priority resolver)
**前置要求：**Giai đoạn 15 · 06 (định hướng tự động hóa nghiên cứu), Giai đoạn 15 · 10 (权限模式)
**Time:** ~60 minutes

## 问题

Một đại lý đã được triển khai sẽ gặp các đầu vào mà nhà thiết kế chưa từng thấy. Không có bất kỳ quy tắc nào dài đủ để bao phủ chúng. Không còn bất kỳ quy tắc nào ngắn đến có thể áp dụng nhanh chóng dưới áp lực tính toán.

基于规则的对齐(RBA): liệt kê tất cả những điều không được phép. 查查很快,易审计,不可能保持最新,并且经常会对它未预见的相近类比过度拒绝. 基于推理的对齐 (基于推理的对齐) 根据Claude Constitution:编码原则,让模型推理――能扩展到未见的案例,更难审计,失败模式是原则误用,而不是漏掉规则――

2026 Hiến pháp  đưa ra một lập trường trung gian rõ ràng. Lệnh cấm mã hóa, cũng là sự sai lầm của nó không phụ thuộc vào các yếu tố sau đây.

## 概念

### Tỷ lệ cấp 4

1. **安全与支持人类监督。**                                                                                                                                                                                                                                                              
2. **伦理。**诚实、避免伤害个人、不欺骗、不操纵──当它与人类指南冲突时,伦理优先──
3. **Anthropic 指南。**Anthropic 认为重要的操作规范:产品范围、交互模式、何时使用哪些工具──
4. **有用性。**tối thiểu. Trong phạm vi ưu tiên cao nhất có thể hữu ích.

Khi xung đột cấp độ, cấp độ cao hơn chiến thắng. Đây là hình thức tương tự như Unix  ưu tiên hoặc mạng QoS: khung này nhằm tạo ra kết quả giải pháp có thể dự đoán được, chứ không nhất thiết là hành vi tốt nhất trên bất kỳ chiều kích nào.

### Thiết lập lệnh cấm cứng và mặc định mềm

**Hardcoded:**
- 生物武器 / CBRN 能力提升
- CSAM
- Các cuộc tấn công vào cơ sở hạ tầng quan trọng
- Khi được hỏi trực tiếp, lừa dối người dùng về thông tin về danh tính mô hình

操作方不能覆盖这些.用户也不能覆盖这些.它们会在可能的情况下执行模型权重层 (RLHF / Constitutional AI 训练),否则在推理层执行――

**Soft-coded default（操作方可调整）：**
- 响应长度默认值
- Chủ đề phạm vi (模型可以拒绝操作方部署范围之外的主题)
- 风格(正式 vs 随意)
- 工具使用模式

操作方调整发生在声明边界内.操作方不能通过重新命名来移除硬码禁令.

### 2022 CAI 训练

原始 AI Hiến pháp ((Bai et al., 2022) luyện tập vô hại:

1. 针对一组提示 生成响应──
2. 要求模型根据一套宪法 (明式原则) 批判每个响应──
3. 根据批判修订响应──
4. Đối với cặp sửa đổi sau đó  thực hiện RLAIF (reinforcement learning from AI feedback)

Kết quả: mô hình sẽ sử dụng giải thích có nguyên tắc từ chối yêu cầu gây hại, thay vì từ chối một cách tổng quát.

### Dựa trên lý thuyết, chúng ta có thể nắm bắt được những gì chúng ta bỏ lỡ.

**能抓住：**
- Các hoạt động cơ bản được phép ban đầu được kết hợp theo cách không được dự đoán, nhưng nguyên tắc rõ ràng là áp dụng trong trường hợp.
- Một loại yêu cầu mới rất gần với những điều bị cấm.
- Tùy thuộc vào việc anh không nói X không cho phép kỹ thuật xã hội tấn công.

**会漏掉：**
- Sử dụng nguyên tắc khác biệt của tấn công  người dùng yêu cầu làm như vậy, vì vậy hữu ích nói có thể)
- Hai nguyên tắc có sự xung đột không ngờ, và các giai đoạn theo thứ tự bao gồm các tình huống không rõ ràng.
- 训练周期中原则解释的缓慢漂移 (trong giải thích)

### 2023  tham gia thử nghiệm

Anthropic năm 2023 đã thực hiện một thí nghiệm, so sánh hiến pháp được viết bởi công ty với hiến pháp được tạo ra thông qua thông tin công khai (khoảng 1.000 người được hỏi ở Mỹ) ⋅ hai phiên bản được thống nhất trên nguyên tắc khoảng 50% ⋅ ở phân biệt, phiên bản nguồn gốc công khai nghiêm ngặt hơn về một số vấn đề (trong việc xử lý nội dung chính trị), trong các vấn đề khác dễ dàng hơn (trong việc tiết lộ bản thân của AI) ⋅2026 hiến pháp không được đưa vào nguồn gốc công khai ⋅ đây là một phát hiện của các hồ sơ tài liệu trong phương pháp này.

### Tại sao lệnh cấm mã hóa là cần thiết

 Chỉ dựa trên lý thuyết, đối tượng không thể đóng kín 长尾.  Người tấn công nếu có thể làm cho mô hình chấp nhận một giả định.

### Hiến pháp 位于中的哪里

Constitution não é um kill switch của Bài học 14。 nó nằm ở tầng mô hình: trọng lực mô hình được đào tạo để có nội dung ưu tiên。 Kill switch 和 canary token 位于运行时层:运行时允许什么。 cả hai đều cần。 Nếu trọng lực mô hình quá lỏng lẻo, dẫn đến việc chạy thực hiện tất cả các động tác sai lầm, đây là vấn đề thời gian chạy。 Nếu hạn chế thời gian chạy quá hạn, dẫn đến mô hình từ chối tất cả các động tác chính xác, đây cũng là vấn đề thời gian chạy。 các tầng khác nhau bao gồm các loại khác nhau。


```figure
mx-priority-tiers
```

## Sử dụng nó

`code/main.py`实现一个最小四级优先级解决方案――解决方案 接收一个拟议动作和一组原则评估(an toàn, đạo đức, hướng dẫn, hữu ích),并返回该动作、拒绝或修改后的动作──司机 运行一小组案例:明确允许、明确不允许、硬码禁令、跨层级模糊案例──

## 交付 nó

`outputs/skill-constitution-review.md`审计 một số cấp độ hiến pháp của một bộ phận: những gì là mã hóa cứng, những gì là mã hóa mềm, cách vận hành có thể được điều chỉnh ở đâu, cũng như bốn cấp độ có thực sự là giải quyết thứ tự không.

## 练习

1. 运行 `code/main.py`❖ xác nhận ngay cả khi hữu ích  rất cao, lệnh cấm cứng cũng sẽ触发── sửa đổi giải quyết, để quyền lợi của hữu ích trọng trọng cao hơn đạo đức;观察失败模式──

2. 阅读 Claude Constitution(公开,79 页,CC0) ―― tìm ra một nguyên tắc mà bạn cho là quy định không đầy đủ―― viết hai đoạn说明 về những khác biệt cụ thể,并 đưa ra một biểu diễn nghiêm ngặt hơn――

3. Đối với đại lý hỗ trợ khách hàng  thiết kế một nhóm mặc định có mã mềm 操作方能调整什么?操作方不能触摸什么?

4. 阅读 Bai et al. 2022 CAI 论文。 mô tả một quy trình phê bình và sửa đổi AI Hiến pháp 循环会比毛毯 quy tắc 产生更差结果的案例──识别该类──

5. Một thí nghiệm tham gia năm 2023 của Anthropic cho thấy, có khoảng 50% sự phân biệt giữa các nguyên tắc công chúng và các nguyên tắc công ty.

## 关键术语

| Term | 人们常说 | 实际含义 |
|---|---|---|
| Constitutional AI | “Anthropic 的对齐方法” | 针对书面 constitution 的自我批判 + RLAIF |
| Reason-based alignment | “原则，而不是规则” | 模型基于原则进行推理，以处理未见案例 |
| Hardcoded prohibition | “永远不要做 X” | 操作方或用户都不能覆盖的基于规则的禁止项 |
| Soft-coded default | “操作方可调整” | 在声明边界内的行为，由操作方控制 |
| Four-tier hierarchy | “优先级顺序” | safety > ethics > guidelines > helpfulness |
| RLAIF | “AI feedback RL” | reward 来自模型生成批判的 RL |
| Participatory constitution | “公众来源原则” | 2023 Anthropic 实验；与公司原则约 50% 分歧 |
| Principle drift | “解释滑移” | 模型解读固定原则文本的方式缓慢变化 |

## 延伸阅读

- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 79 页 CC0 文档。
- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback](https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback) 2022 原始论文──
- [Anthropic — Collective Constitutional AI (2023)](https://www.anthropic.com/research/collective-constitutional-ai-aligning-a-language-model-with-public-input) 参与式实验──
- [Anthropic — Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) Hiến pháp trong RSP  trong vị trí.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) Hiến pháp trong quá trình triển khai dài hạn
