# Tự tinh chỉnh và CRITIC:代式输出改进

> Bản chất tự tinh chỉnh (Madaan et al., 2023) để một LLM trong vòng lặp đóng vai trò ba: tạo ra phản hồi hoặc tinh chỉnh.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 03 (Reflexion)
**Time:** ~60 分钟

## Học mục tiêu

- Nói ra ba prompt của Self-Refine (tạo ra phản hồi, lọc), và giải thích tại sao lịch sử về prompt tinh chỉnh (tạo ra phản hồi, lọc) là rất quan trọng.
- 解释 CRITIC 的关键洞见: không có nền tảng bên ngoài, LLM 在自我验证上不可靠──
- 实现一个带历史和可选外部验证器的自定义循环──
- Đưa mô hình này vào các cửa sổ bảo vệ đầu ra của Antropic's evaluator-optimizer workflow và OpenAI Agents SDK.

## 问题

Một đại lý tạo ra một câu trả lời gần như chính xác. Có lẽ một đoạn mã có lỗi tổng hợp. Có lẽ một bản tóm tắt. Có lẽ một kế hoạch bị bỏ lỡ.

Tự tinh chỉnh  thể hiện: sử dụng một mô hình đơn lẻ, không cần dữ liệu đào tạo, không cần RL, cũng có thể làm điều này. Nhưng có một vấn đề: LLM không giỏi thực tế cứng làm tự xác minh.

Hai bài báo này cùng nhau xác định mô hình cố định cải tiến 2026: tạo, xác minh, tinh chỉnh, qua thời gian dừng lại.

## 概念

### Tự tinh chỉnh (Madaan et al., NeurIPS 2023)

Một LLM, ba vai trò:

```
generate(task)            -> output_0
feedback(task, output_0)  -> critique_0
refine(task, output_0, critique_0, history) -> output_1
feedback(task, output_1)  -> critique_1
refine(task, output_1, critique_1, history) -> output_2
...
stop when feedback says "no issues" or budget exhausted.
```

关键细节:`refine`Sẽ thấy toàn bộ lịch sử, tức là tất cả các phát hành và chỉ trích trước đây, vì vậy nó sẽ không lặp lại sai lầm.

Kết quả trung tâm: trên 7 nhiệm vụ (math、code、acronym、dialog) trung bình mang lại +20 sự nâng cao tuyệt đối, bao gồm GPT-4── không cần đào tạo、 không cần các công cụ bên ngoài、 mô hình đơn lẻ──

### CRITIC ((Gou et al., arXiv:2305.11738, v4 tháng 2 năm 2024)

Đề xuất về sự thật, điều này không đáng tin cậy.`verify(task, output, tools)`替换 `feedback(task, output)`, trong số đó `tools`Bao gồm:

- Sử dụng công cụ tìm kiếm của các tuyên bố thực tế.
- Sử dụng trình giải mã chính xác mã.
- Sử dụng máy tính toán học.
- 领域特定验证器 (khám tử kiểm tra, kiểm tra kiểu, đèn chiếu)

Verifier sẽ tạo ra một bài phê bình cấu trúc dựa trên kết quả của các công cụ.

核心结果:CRITIC 在事实性任务上优于自炼,因为批判有基地──在没有外部验证者的任务上(创意写字、格式化),CRITIC 会退化为自炼──

### 停止条件

两种常见形态:

1. **Verifier 通过。**Bài kiểm tra ngoại bộ  trở lại thành công. Có điều kiện có thể sử dụng trong lần đầu tiên.
2. **没有发出 feedback。**Mô hình nói tạo ra tốt hơn. 成本更低但不可靠; phải搭配最大化 cap──

2026 默认做法:组合二者── Nếu người xác minh 通过, hoặc mô hình nói 且 lặp đi lặp lại >= 2, hoặc lặp đi lặp lại >= max_iterations,则停止──

### Thử nghiệm-Tích cực (Anthropic, 2024)

Anthropic trong bài viết tháng 12 năm 2024 đã đặt tên cho nó là năm kiểu quy trình làm việc.

- Đánh giá: Give output打分并生成 phê bình.
- Optimizer: theo chỉ trích 修订输出。

循环直到评估者通过──这就是人类表述中的自我精炼/CRITIC──人类补充的关键工程细节是:评估者和优化者提示 应该有明显不同的结构,这样的模型才不会只是膠盖──

### Các cửa sổ bảo vệ đầu ra của OpenAI Agents SDK

OpenAI Agents SDK sẽ sử dụng mô hình này như là output guardrails 提供──guardrail là trên đại lý 最终输出上运行的验证者──如果 guardrail 触发(raise `OutputGuardrailTripwireTriggered`),输遇被拒绝,agent có thể thử lại.

### 2026 năm của crater

- **Rubber-stamp loops。**Cùng một mô hình sử dụng cùng một kiểu cách nhanh chóng làm thế hệ và phê bình, sẽ nhận được đến  trông tốt với tôi── sử dụng các lời nhắc khác nhau trên cấu trúc, hoặc sử dụng mô hình nhỏ hơn, rẻ hơn làm phê bình──
- **过度 refine。**Mỗi lần tinh chỉnh vượt qua sẽ tăng độ trễ và Token.
- **在 trivial tasks 上使用 CRITIC。**Nếu không có kiểm chứng bên ngoài, CRITIC sẽ trở lại tự tinh chỉnh; đừng trả cho kiểm chứng stub 支付延迟。


```figure
self-refine
```

##  xây dựng nó

`code/main.py`Trong một nhiệm vụ đồ chơi 上实现 Self-Refine 和 CRITIC: given topic, generate a brief bullet list──verifier 检查格式──3 viên đạn, mỗi ít hơn 60 ký tự──CRITIC 增加一个外部──fact verifier,用于惩罚已知幻觉──

组件:

- `generate` nhà sản xuất kịch bản.
- `feedback` Tự phê bình theo kiểu LLM。
- `verify_external` Kiểm tra cơ bản theo kiểu CRITIC。
- `refine` 根据历史 改写输出。
- Stop condition  verifier  thông qua hoặc tối đa 4 lần lặp lại.

运行:

```
python3 code/main.py
```

So sánh Tự tinh chỉnh và kết quả hoạt động của CRITIC.

## Sử dụng nó

Phân tích đánh giá của Anthropic là sử dụng ngôn ngữ thân thiện với Claude biểu diễn mô hình này. Phân tích đầu ra của OpenAI Agents SDK 呈 CRITIC 形态(phân tích có thể được调用工具) ――LangGraph 提供一个读起来像自炼反射节点――Google's Gemini 2.5 Computer Use 增加了每步安全评估器,这是CRITIC的一个变体:每个行动在 commit都会被验证――

## 交付 nó

`outputs/skill-refine-loop.md`会根据任务形状、verifier可用性和反复预算、配置评估器-优化器循环──输出生成器、评估器/verifier 和优化器的提示,以及停止政策──

## 练习

1. Sử dụng tối đa các lần lặp lại = 1 运行 trò chơi này.
2. Để thay thế xác minh bên ngoài thành xác minh tiếng ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn ồn                                                                                                                                                                                                 
3. 实现一个 generator-critic on different models 变体: mô hình lớn 生成, mô hình nhỏ phê bình.
4. 阅读CRITIC Section 3 ((arXiv:2305.11738 v4) ❖说出三类验证工具类,并为每类给出一个例子――
5. 将 OpenAI Agents SDK của `output_guardrails`映射到Critic's verifier role──SDK làm gì sai, làm gì lại?

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|----------------|------------------------|
| Self-Refine | “会修复自己的 LLM” | 在一个 model 中执行 Generate -> feedback -> refine loop，并带 history |
| CRITIC | “Tool-grounded verification” | 用外部 verifier（search、code、calc、tests）替换 feedback |
| Evaluator-Optimizer | “Anthropic workflow pattern” | 两个角色：evaluator 打分，optimizer 修订，并循环到收敛 |
| Output guardrail | “Post-hoc check” | OpenAI Agents SDK validator，在 agent 生成输出后运行 |
| Verify step | “Critique phase” | 承重决策点：grounded 还是 self-rated |
| Refine history | “Model 已经尝试过的内容” | 先前 outputs + critiques 被前置到 refine prompt；去掉后质量会崩塌 |
| Rubber-stamp loop | “Self-agreement failure” | 相同 prompt 的 critique 返回 “looks good”；用结构上不同的 prompts 修复 |
| Stop condition | “Convergence test” | Verifier 通过，或没有 feedback 且达到 iteration cap；绝不能只有单一条件 |

## 延伸阅读

- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) 经典 giấy
- [Gou et al., CRITIC (arXiv:2305.11738)](https://arxiv.org/abs/2305.11738) Kiểm tra dựa trên công cụ
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) mô hình lưu lượng công việc đánh giá- tối ưu hóa
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) 作为Critic-shaped verifiers 的输出护
