# Đánh niệm: Học tập tăng cường bằng lời nói

> 基于 Gradient的RL 需要数千次试验和一个GPU cluster 才能修复一种失败模式――Reflection(Shinn et al., NeurIPS 2023) sử dụng ngôn ngữ tự nhiên để hoàn thành việc này: sau mỗi lần thất bại của một thử nghiệm, đại lý viết một đoạn suy nghĩ, sẽ lưu trữ nó vào bộ nhớ tập thể,并让下一次试验基于此段记忆──这是Letta's sleep-time computing、Claude Code's CLAUDE.md learning,以及 pro-workflow's learning-rule 背后的模式──

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 02 (ReWOO)
**Time:** ~60 minutes

## Học mục tiêu
- Nói ra ba thành phần của Nhận thức (Reflection) và tác dụng của trí nhớ tập trung.
- 实现一个stdlib Reflection loop,包含二进制评估器、反射缓冲 和全新的重试――
- 针对给定任务, trong các nguồn phản hồi quy mô, học thuyết và tự đánh giá 之间做选择――
- Giải thích tại sao sự tăng cường bằng lời nói có thể nắm bắt RL dựa trên Gradient  cần hàng ngàn lần thử nghiệm để sửa lỗi.

## 问题
Một đại lý nhiệm vụ thất bại. Trong RL tiêu chuẩn, bạn sẽ chạy lại hàng ngàn lần thử nghiệm, tính toán gradient, nâng cấp trọng lượng.

Nhắc nghiệm: Shinn et al., arXiv:2303.11366) đưa ra một vấn đề khác: Nếu đại lý chỉ nghĩ về lý do tại sao mình thất bại,并把这个想法放进快速里再试一次,会怎样?

Kết quả là: trên ALFWorld, nó vượt qua ReAct và các đường cơ sở không được điều chỉnh tốt khác. Trên HotpotQA, nó có sự nâng cao nào đó so với ReAct. Trong việc tạo ra mã (HumanEval/MBPP), nó đạt được trạng thái hiện đại của thời điểm đó.

## 概念
### Ba thành phần

```
Actor         : generates a trajectory (ReAct-style loop)
Evaluator     : scores the trajectory — binary, heuristic, or self-eval
Self-Reflector: writes a natural-language reflection on the failure
```

Tóm lại một cấu trúc dữ liệu:

```
Episodic memory: list of prior reflections, prepended to the next trial's prompt
```

Một lần thử nghiệm 会运行 Actor。Evaluator 对它打分──如果分数 低,Self-Reflector 会产生一段反思(我选错工具,因为我把问题误读成在问题X,而它实际上在问题Y)。

### Ba loại đánh giá

1. **Scalar**  外部二进制信号――ALFWorld thành công hoặc thất bại――HumanEval tests 通过或失败――最简单,信号 最强――
2. **Heuristic** 预定义的失败签名── Nếu đại lý 连续两次产生相同行动,就标记为卡卡── Nếu quỹ đạo 超过50 bước,就标记为不效──
3. **Self-evaluated** LLM đối với quỹ đạo của mình 打分──当没有基础真理 时需要它──Signal 较弱;适合与工具基底验证 搭配使用(Lớp 05  CRITIC) 。

Các phương pháp được sử dụng là hỗn hợp: có thể sử dụng thời gian sử dụng scalar, không thể sử dụng thời gian sử dụng tự-eval, học thuật như đường ray an toàn.

### Tại sao điều này nói chung

Nhận xét thay vì là một thuật toán mới, không giống như là một mô hình được đặt tên.

- Letta's sleep-time computation (Dạy học 08): một đại lý độc lập phản ánh những cuộc trò chuyện trong quá khứ,并写入记忆块――
- Claude Code của `CLAUDE.md`/ save memory 模式:将反思 捕获为学习,并预pendi đến các buổi tương lai。
- Pro-workflow của`/learn-rule`lệnh:将 sửa đổi 捕获为显式规则──
- Các nút phản xạ của LangGraph: một nút đối với đầu ra 打分, và trong khi cần phải路由到精炼.

Tất cả đều đến từ cùng một cái nhìn: ngôn ngữ tự nhiên là một phương tiện đủ phong phú, có thể mang theo giữa các cuộc chạy  Tôi đã học được gì từ thất bại ──

### 什么时候有效,什么时候无效

Nhận xét 适用于:

- Có tín hiệu thất bại rõ ràng (trình thử nghiệm thất bại, lỗi công cụ, câu trả lời sai)
- task class 可复现(sự hỏi cùng loại sẽ xuất hiện một lần nữa)。
- suy nghĩ có không gian để cải thiện quỹ đạo (có đủ ngân sách hành động)

Nhận xét không thích hợp cho:

- Đại lý lần đầu tiên đã thành công.
- 失败来自外部因素 (tạm dịch: mạng bị hỏng, công cụ bị hỏng) 反思 (tạm dịch: mạng bị hỏng) đối với các hoạt động trong tương lai không có sự giúp đỡ nào.
- Nhìn lại  biến thành một niềm tin  để một lần thỉnh thoảng chạy  lưu trữ một đoạn truyện.

2026 年的陷:memory rot──Reflections 会累积; trong số đó có một số đã过时或错误;随着episodic buffer 变大,重新运行 会变慢──缓解方法:定期紧缩(Lesson 06)、对反思 设置 TTL,或使用单独的睡眠时间清洁剂(Letta)。


```figure
react-trace
```

##  xây dựng nó
`code/main.py`Trong một trò chơi giải trí trên thực hiện Nhận thức: tạo ra một danh sách 3 yếu tố, làm cho tổng số của nó 等等于目标值。Actor 产出候选人清单;Evaluator 检查 sum;Self-Reflector 写一行关于哪里出错的诊断── Nhận thức sẽ vào bộ nhớ tập thể,供下一次试用──

Các thành phần:

- `Actor`Một chính sách kịch bản, trong khi nhìn vào những phản ánh sẽ được cải thiện.
- `Evaluator.binary()` 基于目标总量的通过/失败──
- `SelfReflector` 生成一行 chẩn đoán thất bại
- `EpisodicMemory` Một danh sách giới hạn của ngữ nghĩa TTL

运行:

```
python3 code/main.py
```

Trace 展示三次试点──试点1 失败,存储一段反思;试点2 看到反思 后有改进但仍失败;试点3 成功──与基线运行(无反思)对比它会卡在试点1的答案上──

## Sử dụng nó
LangGraph sẽ phản ánh như mô hình nút 提供──Claude Code 的 `/memory`lệnh và pro-workflow của `/learn-rule`Để mở bộ đệm tập thể bên ngoài thành một Markdown 文件。Letta của tính toán thời gian ngủ trong thời gian ngừng hoạt động  Bản phản xạ, làm cho đại lý chính  tiếp tục bị trễ 约束。 OpenAI Agents SDK không trực tiếp cung cấp phản xạ; bạn có thể sử dụng một theo điểm số  từ chối quỹ đạo tự xác định Guardrail, cũng như một người có thể vượt qua chạy bộ nhớ được giữ gìn `Session`Để xây dựng nó.

## 交付 nó
`outputs/skill-reflexion-buffer.md`创建并维护一个节奏缓冲,包含反思捕捉、TTL 和减倍――给定一个任务类 和一次失败,它会产生一段真正帮助下一次试验的反思(而不是泛泛的要更谨慎) 

## 练习
1. Từ đánh giá nhị phân chuyển sang trở lại đường đo (đến mục tiêu có nhiều cách xa hơn) của đánh giá quy mô.
2. Để suy nghĩ thêm 10 thử nghiệm của TTL.
3. 实现 heuristic evaluator: Nếu cùng một hành động lặp lại xuất hiện,就将试验标记为卡住.
4. Sử dụng会忽略反思的反思的演员运行反思――为了迫使演员注意到它们,最小反思的快速工程是什么?
5. 阅读 bài báo suy tư 中关于AlfWorld的第4节 从概念上复现 130% thành công tỷ lệ cải thiện: đối với vanilla ReAct,关键 delta là gì?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Reflexion | “Self-correction” | Shinn et al. 2023 — Actor、Evaluator、Self-Reflector 加 episodic memory |
| Verbal reinforcement | “Learning without gradients” | prepend 到下一次 trial prompt 的自然语言 reflection |
| Episodic memory | “Per-task reflections” | 针对一个 task class 的 prior reflections bounded buffer |
| Scalar evaluator | “Binary success signal” | 来自 ground truth 的 pass/fail 或 numeric score |
| Heuristic evaluator | “Pattern-based detector” | 预定义 failure signatures（例如 stuck-loop、too-many-steps） |
| Self-evaluator | “LLM-as-judge on own trace” | 没有 ground truth 时使用的 lower-signal fallback — 与 tool-grounded verification 搭配 |
| Memory rot | “Stale reflections” | Episodic buffer 被过时 entries 填满；用 compaction/TTL 修复 |
| Sleep-time reflection | “Async self-reflection” | 在 hot path 之外运行 Self-Reflector，使 primary agent 保持快速 |

## 延伸阅读
- [Shinn et al., Reflexion: Language Agents with Verbal Reinforcement Learning (arXiv:2303.11366)](https://arxiv.org/abs/2303.11366) 经典 giấy
- [Letta, Sleep-time Compute](https://www.letta.com/blog/sleep-time-compute) sản xuất 中的 async phản xạ
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) Để quản lý bộ đệm tập thể  như một phần của bối cảnh
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) mô hình nút phản xạ
