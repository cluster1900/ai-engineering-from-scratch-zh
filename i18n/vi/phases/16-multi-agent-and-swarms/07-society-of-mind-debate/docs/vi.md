# Phương pháp xã hội tâm trí và tranh luận đa tác nhân

> Minsky trong giả định năm 1986, đó là trí thông minh là một xã hội được tạo thành bởi các chuyên gia, mỗi thập kỷ sẽ được phát hiện lại một lần. Năm 2023, Du et al. sẽ biến nó thành một thuật toán cụ thể: nhiều trường hợp LLM  đưa ra câu trả lời, đọc câu trả lời lẫn nhau, phê bình, và cập nhật.**multiple agents**和 **multiple rounds**Thành phố độc lập đóng góp hiệu quả. xã hội thắng hơn một đại lý đơn độc. trao đổi đa vòng thắng hơn một lần bỏ phiếu.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## 问题
Sự nhất quán, nghĩa là đối với một mô hình 采样多次并取多数答案, là lý luận rẻ nhất bạn có thể thêm vào 改进. Nó hiệu quả, nhưng bạn có thể tăng gấp đôi các mẫu, nhưng không nhìn đến một lần khác có ý nghĩa nâng cao.

Cuộc tranh luận đã phá vỡ kiểu này 和── không phải lấy N 个 độc lập mẫu từ một mô hình, mà hãy để N 个 đại lý đọc lý luận lẫn nhau và xem xét.

## 概念
### Du et al. 2023 算法

Từ arXiv:2305.14325 (ICML 2024):

1. Mỗi đại lý trong số đó đều tạo ra một câu trả lời ban đầu cho vấn đề.
2. Đối với vòng r = 2..R: Đối với mỗi đại lý  hiển thị các đại lý khác trong vòng r-1 của câu trả lời,并 yêu cầu nó  xem xét những, cho câu trả lời cập nhật của bạn.
3. R 轮后, đối với câu trả lời cuối cùng làm đa số phiếu bầu.

论文在 MMLU、GSM8K、 tiểu sử、MATH 和 thực tế điểm chuẩn 上测试。

### Hai vòng tròn độc lập

同一篇论文中的 ablations:

- **Agent count alone**(1 vòng, đối với N 个 kết quả làm bỏ phiếu đa số) trên hầu hết các nhiệm vụ hơn một đại lý, nhưng sẽ vào giai đoạn nền tảng.
- **Round count alone**(1 个代理 见自己的先前推理) hầu như không giúp đỡ, đó là điểm yếu của phản ánh.
- **Both together**Tạo sự tăng trưởng đáng kể.

### Tại sao hiệu quả

Hai cơ chế:

1. **暴露于分歧。**Khi một đại lý nhìn thấy chuỗi lý luận của một đại lý khác đưa ra kết luận khác nhau, nó phải phải biện minh, hoặc cập nhật.
2. **相关错误减少。**Trong sự nhất quán, tất cả các mẫu đều đến từ cùng một mô hình, do đó sai lầm  liên quan, bạn sẽ trung bình đến một tự tin nhưng sai lầm câu trả lời  Các mô hình khác nhau hoặc hạt giống khác nhau sẽ liên quan  Các quan điểm khác nhau sẽ liên quan hơn 

### Cuộc tranh luận đa dạng

A-HMAD 和相关后续工作为不同代理 使用 *不同基模型*──Llama + Claude + GPT cuộc tranh luận 会减少单种植崩(Lớp 26), vì các lỗi liên quan đến một gia đình mô hình sẽ không được chia sẻ bởi các gia đình mô hình khác.

缺点: yếu mô hình  tham gia cuộc tranh luận 时可能会把共识 拉向它的错误答案 ((见 

### NLSOM  129-agent 扩展

Zhuge et al. Mindstorms in Natural Language-Based Societies of Mind, arXiv:2305.17066) sẽ mở rộng ý tưởng này đến 129 xã hội thành viên. Kết quả là: chuyên môn hóa và tự tổ chức 随规模涌现,并且系统在视觉问题答等任务上优于单代理.

### Các chế độ thất bại

- **Sycophancy cascade。**Tất cả các đại lý đều tuân theo nghe thấy người đại lý tự tin nhất.
- **Topic drift。**Nhiều vòng tranh luận 会偏离原始问题──缓解措施: mỗi vòng tái nhập vấn đề──
- **Compute blowup。**N đại lý × R vòng = N·R lần lần LLM gọi, mỗi lần gọi ngữ cảnh đều đang tăng lên. Một cuộc tranh luận 5 đại lý,5 vòng là 25 lần gọi, và ngữ cảnh tiếp tục tăng lên.


```figure
multi-agent-debate
```

##  xây dựng nó
`code/main.py`Trong một vấn đề toán học, chạy cuộc tranh luận 3 đại lý × 3 vòng, trong đó mỗi đại lý đều bắt đầu từ một câu trả lời khác nhau.

Demo này cho thấy hai tác dụng quan trọng:

- Một vòng trao đổi sẽ giúp các đại lý gần hơn với câu trả lời chính xác.
- vòng 2  后额外轮次显示 lợi nhuận giảm ]] phù hợp với cao nguyên của Du et al.

运行:

```
python3 code/main.py
```

## Sử dụng nó
`outputs/skill-debate-configurator.md`Để giải thích các vấn đề khác nhau, chúng ta cần phải tìm hiểu các vấn đề khác nhau về các vấn đề khác nhau.

## 交付 nó
Nếu muốn lên mạng tranh luận:

- **将 rounds 上限设为 3。**Du et al.  cho thấy 3 vòng đã thu được phần lớn lợi ích hơn là chi phí, không phải chất lượng.
- **将 agents 上限设为 5。**超过 5 后, ngữ cảnh bùng nổ 和成本占主导.
- **默认 heterogeneous。**池中 ít nhất hai mô hình cơ sở khác nhau.
- **Adversarial slot。**Một đại lý được nhắc đến bất cứ cách nào cũng phải không đồng ý.
- **记录每一轮。**                                                                                                                                                                                                                                                              

## 练习
1. 运行 `code/main.py`, sau đó sẽ đếm vòng 设为 5, quan sát lợi nhuận giảm.
2. 添加一个带有敌意作用的第四个代理: luôn luôn không đồng ý với đa số hiện tại.
3. 绘制(打印) điểm đồng thuận mỗi vòng( đứng ở phần lớn trả lời trên các đại lý ví dụ)  Nó đạt 1.0 khi nào?
4. 阅读 Du et al. Phần 4 ablations。 sử dụng mã này 复现 agents-only vs rounds-only vs both 结果。
5. 阅读 Chúng ta nên đi điên? (arXiv:2311.17371),并列出 hai biến thể tranh luận bên ngoài vòng tròn, ví dụ: thẩm phán dẫn đầu chuỗi tranh luận, đối thủ.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Society of Mind | “Minsky 的想法” | Intelligence 是互动专家集合；1986 年的 framing 现在通过 LLM debate 被 operationalized。 |
| Multi-agent debate | “Agents 争论” | N 个 agents 提出答案、相互 critique、经过 R 轮 revise，然后 majority-vote。 |
| Consensus | “他们达成一致” | 不是 epistemic truth，只是 fraction-on-majority-answer。可能自信地错误。 |
| Rounds | “Exchange steps” | 一轮 = 每个 agent 读取其他 agents 并 update 一次。 |
| Heterogeneous debate | “混合 model families” | 使用不同 base models 来去相关 errors。 |
| Sycophancy cascade | “每个人都同意那个大声的人” | 一种 debate failure：agents 不管正确性如何，都顺从最自信的 agent。 |
| NLSOM | “129-agent society” | Natural-language society of mind；Zhuge et al. 的 scaled version。 |
| Correlated error | “同一个 model，同一个 bug” | self-consistency 饱和的原因；跨不同 views 的 debate 会去相关。 |

## 延伸阅读
- [Du et al. — 通过 Multiagent Debate 提升 Language Models 的事实性与推理能力](https://arxiv.org/abs/2305.14325) Bức giấy tham chiếu,ICML 2024
- [Zhuge et al. — Mindstorms in Natural Language-Based Societies of Mind](https://arxiv.org/abs/2305.17066) 129-agent NLSOM
- [Should we be going MAD? A Look at Multi-Agent Debate Strategies for LLMs](https://arxiv.org/abs/2311.17371) các biến thể tranh luận chuẩn
- [Debate project page](https://composable-models.github.io/llm_debate/) Mã của Du et al. ∆emos và chi tiết về việc trừ
