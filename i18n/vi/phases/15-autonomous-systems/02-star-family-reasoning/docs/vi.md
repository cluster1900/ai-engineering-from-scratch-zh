# STAR, V-STAR, Quiet-STAR  Định lý tự học

> Chuyện tự cải tiến nhỏ nhất nằm trong lý trí. Mô hình tạo ra một chuỗi suy nghĩ, giữ lại những kết quả được trả lời đúng, và điều chỉnh kết quả này. Đây là STaR. V-STaR.

**Type:** 学习
**Languages:** Python (stdlib, bootstrap-loop 模拟器)
**Prerequisites:** Phase 13 · 01-03 (Reasoning and CoT), Phase 15 · 01 (long-horizon 框架)
**Time:** ~60 分钟

## 问题

Học mô hình thực hiện Lý luận theo cách trực tiếp, là thu thập các dấu vết lý luận được viết bởi con người.

STaR (Self-Teught Reasoner, Zelikman et al., 2022) đề xuất một vấn đề: Nếu để mô hình viết ra lý luận của riêng mình, và dựa trên câu trả lời đã biết cho chúng打分, sẽ làm thế nào? vòng lặp là:

1. 采样一个推理痕迹 和答案──
2. Nếu câu trả lời cuối cùng là đúng, hãy giữ dấu vết này.
3. Trong những dấu vết được giữ lại trên...
4. Đổi lại

Nó có hiệu lực. GSM8K và CommonsenseQA đều được nâng cấp trong trường hợp không có dấu hiệu nhân tạo mới. Nhưng vòng lặp này có một sự khác biệt nội tại: bất kỳ lý luận nào có thể tạo ra câu trả lời chính xác sẽ được giữ lại, bất kể lý luận có đáng tin cậy hay không.

## 概念

### STaR: trong hiệu quả kết quả trên bootstrap

Từ một mô hình cơ bản có một loại suy luận 能力 能力 开始──在每个训练问题上,采样一个理性和答案──如果答案与标签匹配,就保留这个 (vấn đề, lý luận, câu trả lời) 三次──在保留集合上细调模型──重复──

Có một sự thay đổi rất quan trọng. Nếu mô hình không thể trả lời được một vấn đề, vòng lặp này sẽ không thể học được từ nó.**rationalization**Đối với vấn đề thất bại của mô hình, hãy đưa câu trả lời chính xác như một lời khuyên, và nhắc lại mô hình tạo ra một lý luận hướng đến câu trả lời đó.

原论文结果 (Zelikman et al., 2022): Một mô hình cơ bản GPT-J 通过多轮带合理化的STaR, trên GSM8K tăng từ 5.8% 提升到 10.7%,绝对提升约 5个百分点。 trên CommonsenseQA,STaR 训练的GPT-J 6B 达到72.5%,接近精细调的GPT-3 175B (~73%),而后者是在人工标注理性上训练、规模大约30倍的模型。

### V-STaR: dùng DPO 训练 xác minh

STaR 会丢弃错误理性――Hosseini et al. (2024) 观察到这些也是数据:每一对 (rationale, "có đúng không") 都可以训练验证者──他们使用正确和错误解法上直接偏好优化来构建排名──在推断时间,采样N 个理性,并选择验证器 排名最高的一个──

报告的差异: trên GSM8K 和 MATH 上,相比较前 Self-Improvement Baselines 提升 +4 đến +17 个百分点, phần lớn lợi ích từ việc xác minh sẽ được sử dụng cho sự lựa chọn thời gian suy luận, chứ không phải để sử dụng cho việc chỉnh sửa kỹ thuật máy phát thêm.

### Quiet-STAR: Mỗi token của bên trong

Zelikman et al. (2024)  đề xuất: Nếu mô hình học tập ở mỗi vị trí của Token tạo ra một lý luận nội bộ ngắn gọn, chứ không chỉ nằm giữa vấn đề và câu trả lời, sẽ làm thế nào?

Kết quả:Mistral 7B trong trường hợp không có điều chỉnh kỹ lưỡng cụ thể về nhiệm vụ, trong GSM8K trên không-shot  tuyệt đối biểu hiện từ 5,9%  nâng lên 10,9%,CommonsenseQA từ 36,3%  nâng lên 47,2%。模型学会了" khi nào để suy nghĩ":困难 Token 会得到更长的内部理性;简单 Token 几乎没有──

### Tại sao ba người đều có mối quan tâm chung về an ninh?

三种方法都使用最终答案作为渐进信号. Một cách lý luận có lỗi 得到正确答案的合理化,无论是利用捷径、猜测,还是使用无法泛化的模式,都会正向强化. Trong vấn đề phân phối 问题,这个捷径有效.

V-STaR xác minh bằng cách học về lý lẽ để giảm thiểu vấn đề này, nhưng xác minh là được đào tạo trên cùng một tập hợp nhãn. Nó có thể học được định dạng tốt nhưng sai lý, thay vì sự không chắc chắn trung thực.

### Đối với

| Method | Training signal | Inference cost | Data waste | Known failure mode |
|---|---|---|---|---|
| STaR | 如果正确，则保留 (rationale, answer) | 1x | 丢弃所有错误 rationales | shortcut rationales |
| STaR + rationalization | 上述方法 + 带正确答案提示的重试 | 1x | 更少 | rationalized rationales 可能不可信 |
| V-STaR | STaR + 来自两个类别的 DPO verifier | Nx (best-of-N) | 最小 | verifier 可能强化自信的错误 |
| Quiet-STaR | per-Token rationale + mixing weight | 1.5-3x | 最小 | 仍然是 answer-conditioned Gradient |

### Nó ở vị trí trung tâm của 2026

STaR đã không mới. Nhưng mô hình này trong 2025-2026 năm đến hiện tại. RL (DeepSeek-R1, Kimi-k1.5, o1) trên các vấn đề toán học là phiên bản mở rộng của STaR.

Nhận thức STaR sẽ làm cho tất cả những điều này trở nên rõ ràng. Đó là vòng tự cải thiện tối thiểu có thể làm được.


```figure
reflection-loop
```

## Sử dụng nó

`code/main.py`会在一个玩具算术任务 上运行模拟 STaR循环―― Bạn có thể xem:

- độ chính xác 如何随随 bootstrap vòng 上升──
- 捷径如何混入:模拟器包含一个"惰" lý luận类, nó có 40% thời gian nhận được câu trả lời chính xác, nhưng phổ biến rất khác biệt.
- Một xác minh (V-STaR 风格) làm thế nào để cung cấp sự giúp đỡ trong suy luận, nhưng không thể hoàn toàn cắt giảm trong quá trình đào tạo.

## 交付 nó

`outputs/skill-star-loop-reviewer.md` giúp bạn trong việc kiểm tra trước khi tập luyện một dự kiến tự học lý luận ống dẫn.

## 练习

1. 运行模拟器──将快捷频率 设为零,然后设为0.4──尽管两次运行都在训练分布上达到>90%,最终精度会相差多少?

2. 给模拟器添加一个持续的OOD test――从不同分布中抽取问题,并在分发和OOD set 上评估 bootstrapped model――量化差距――

3. 阅读 Quiet-STaR 论文 (arXiv:2403.09629) Phần 3。分别用三句话解释 "sự suy nghĩ kết thúc" Địa chỉ 和 trọng lượng hỗn hợp đầu。

4. Để so sánh bộ lọc giữ nếu STaR đúng với một phương pháp thay thế được giám sát bởi quy trình, sau đó sẽ được thưởng độc lập cho mỗi bước hợp lý.

5. Thiết kế một đánh giá, để nắm bắt các lý luận tắt trong mô hình được triển khai. Nó không nhất thiết là hoàn hảo, nhưng phải có thể phá vỡ các đường lối đơn giản nhất của vòng lặp STaR.

## 关键术语

| Term | What people say | What it actually means |
|---|---|---|
| STaR | "Self-Taught Reasoner" | 在得到正确答案的模型生成 rationales 上 fine-tune；重复 |
| Rationalization | "Hinted retry" | 注入正确答案，并在 base model 失败的问题上重新 prompt 生成 rationale |
| V-STaR | "Verifier STaR" | 在正确和错误 rationales 上 DPO-train 一个 verifier，并将其用于 inference-time selection |
| Quiet-STaR | "Per-token rationales" | 在每个 Token 位置生成隐藏 thoughts；与 baseline prediction 混合 |
| Answer-conditioned gradient | "Outcome-based signal" | 训练循环奖励最终答案，而不是 reasoning steps |
| Process reward model | "Step-level verifier" | 在 per-step correctness 上训练的 reward model，而不是 outcome；与 STaR 形成对比 |
| Shortcut rationale | "Right answer, wrong reasoning" | 一个通过无法泛化的模式得到标签的 rationale；STaR 会保留这些 |

## 延伸阅读

- [Zelikman et al. (2022). STaR: Bootstrapping Reasoning With Reasoning](https://arxiv.org/abs/2203.14465) 原始论文──
- [Hosseini et al. (2024). V-STaR: Training Verifiers for Self-Taught Reasoners](https://arxiv.org/abs/2402.06457) 加入用于 lựa chọn thời gian suy luận của DPO xác minh viên。
- [Zelikman et al. (2024). Quiet-STaR: Language Models Can Teach Themselves to Think Before Speaking](https://arxiv.org/abs/2403.09629) mỗi token 内部 rationales。
- [Lightman et al. (2023). Let's Verify Step by Step](https://arxiv.org/abs/2305.20050) mô hình phần thưởng quá trình,即替代 Gradient 信号。
- [DeepSeek-R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) RL trên nhiệm vụ chứng minh, sẽ mở rộng đến đào tạo biên giới.
