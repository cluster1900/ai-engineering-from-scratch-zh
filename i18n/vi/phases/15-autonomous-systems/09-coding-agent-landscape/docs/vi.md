# Cơ quan lập trình tự trị 版图(2026)

> SWE-bench Verified trong vòng 3 năm từ 4%  nâng lên 80,9%。 cùng một Claude Sonnet 4.5 trên SWE-agent v1 đạt 43,2%, trên Cline tự trị đạt 59,8%  Ngày nay xung quanh mô hình của trình bọc và mô hình chính nó cũng quan trọng như vậy。 OpenHands(đã được gọi là OpenDevin) là nền tảng được cấp phép MIT hoạt động nhất, nó có CodeAct loop sẽ trực tiếp thực hiện các hành động của Python trong hộp rác, chứ không phải là cuộc gọi JSON。头条数字 công cụ che giấu một phương pháp học vấn đề 个 SWE-bench Verified 任务中有 161 任务 chỉ cần 1:52 行 sửa đổi, trong khi SWE-bench Pro10 行任务) trên cùng một biên giới mô hình nhận được chỉ 2359%。

**类型：**Học tập
**语言：**Python(stdlib,CodeAct vs JSON tool-call đối với)
**先修要求：**Giai đoạn 14 · 07(sử dụng công cụ),Giai đoạn 15 · 01(Các chất có tầm nhìn dài)
**时间：**45 phút

## 问题

                                                                                                                                                                                                                                                              

Trong giai đoạn 2022 đến 2026, lĩnh vực này nhận ra sàn sườn  lấy lại lớp, lập kế hoạch, hộp rác, chỉnh sửa-tham khảo vòng lặp, định dạng phản hồi  là chịu trách nhiệm cấu trúc. Claude Sonnet 4.5 trên SWE-agent v1 trên SWE-bench được xác minh đạt 43,2%; cùng một mô hình đặt trên sàn tự trị của Cline có điểm số là 59,8%.

Vấn đề kèm theo là điểm chuẩn 和会掩盖退步──SWE-bench Verified 已接近和,而轻任务尾(500 个任务中有 161 个只需要 ≤2 行) 会拉高顶部分数──真实世界质量更适合在SWE-bench Pro(10+ 行修改) như vậy phân bố trên đo, nơi cùng một hệ thống dẫn đầu vẫn chỉ có 2359%──

## 概念

### 用一段话 hiểu SWE-bench

SWE-bench(Jimenez et al.) 选择带有基底真相补丁的真实 GitHub issues,并要求代理 生成一个补丁,让测试套件 通过──SWE-bench Verified(OpenAI,2024) là một bộ 500 nhiệm vụ được chọn qua nhân tạo,移除含糊和损坏的任务──SWE-bench Pro 是更难的后后版本  任务要求 10+ 行修改, hiện tại các đại lý biên giới được phân chia thành 2359%──

### 2022 → 2026 曲线 thực sự说明了什么

- **2022**: các mô hình nghiên cứu trong ban đầu SWE lên khoảng 4%
- **2024**:GPT-4 + bàn phẳng kiểu Devin khoảng 14%;SWE-agent khoảng 12%。
- **2025**:Claude 3.5/3.7 Sonnet trong Aider và SWE-agent 中推进到4055% 区间──
- **2026**Claude Sonnet 4.5 và các đối thủ cạnh tranh biên giới trên bảng xếp hạng SWE đã xác minh lên đạt 7080%+──Epoch AI's leaderboard 会实时追踪这一情况──

Đây là một số điểm được xác định trong các nghiên cứu về các phương pháp kiểm tra và kiểm tra.

### CodeAct vs JSON 工具调用

OpenHands(All-Hands-AI,arXiv:2407.16741, tiền thân là OpenDevin) đã đặt cược vào một cấu trúc cụ thể: không để mô hình phát hành bởi máy chủ giải mã và thực hiện các cuộc gọi công cụ JSON, mà hãy để mô hình phát hành mã Python, và được thực hiện bởi hạt nhân kiểu Jupyter trong hộp rác.

权衡如下:

- **JSON tool calls**Mỗi hành động là một lượt; dễ kiểm tra; tính kết hợp có giới hạn; được xác định là an toàn hơn, vì mỗi cuộc gọi đều qua xác nhận rõ ràng.
- **CodeAct**Một hành động có thể là một chương trình toàn bộ; có tính kết hợp; cần hộp cát cứng(OpenHands sử dụng cách ly Docker); các chế độ thất bại bao gồm thời gian chạy sandbox 允许的任何行为。

两种架构都已用于生产.CodeAct trong open platform占主导.OpenHands.Smogents.

### 2026 版图中的 bàn phế

| Scaffold | License | Execution model | Notable property |
|---|---|---|---|
| OpenHands (OpenDevin) | MIT | Docker 中的 CodeAct | 最活跃的 open platform；event-stream 可 replay |
| SWE-agent | MIT | Agent-Computer Interface (ACI) | 第一个端到端 SWE-bench scaffold |
| Aider | Apache-2 | local repo 中 edit-via-diff | Minimal scaffold，regression stability 强 |
| Cline | Apache-2 | 带 tool policy 的 VS Code agent | Sonnet 4.5 上得分最高的 open scaffold |
| Devin (Cognition) | Proprietary | Managed VM + planner | 第一个“AI software engineer”产品类别 |
| Claude Code | Proprietary | Permission modes + routines | Lesson 10 会详细讲解 agent loop |

### Tại sao sàn nhà chiếm chủ quyền

Một lần chạy mã hóa là một bài học đường dài (đọc 1) ⋅可靠性会跨步骤复合──scaffolding 在三个地方带来分数:

1. **Retrieval**: tìm thấy các tệp chính xác cần đọc là một cái hộp ──SWE-agent của ACI, OpenHands của file-index, cũng như Aider của repo-map đều đang giải quyết vấn đề này──
2. **Verifier loop**:运行测试、读取堆痕迹、再试,在SWE-bench 上能带来10+ 分差──
3. **Failure containment**: xuất lỗi có thể lăn lại hộp cát 能 ngăn ngừa thiệt hại tích lũy── có vòng lặp xác minh và không vòng lặp xác minh cùng một mô hình, trông giống như hai sản phẩm khác nhau──

### Chỉ số chuẩn 和与真实分布

OpenHands tác giả và Epoch AI đều chỉ ra SWE-bench Verified  tồn tại đuôi dễ dàng:500 个任务中有 161 个 chỉ cần 12 行修改。高分部分由这个 đuôi 驱动。SWE-bench Pro 限定为10+ 行修改, ngay cả trong các hệ thống biên giới,分数也只有2359%。

选择代理的含义是: trên bản truy cập lỗi của bạn trên một tập hợp giống như Pro của bạn.


```figure
a5-scaffold-delta
```

## Sử dụng nó

`code/main.py`Trong một phân phối nhiệm vụ nhỏ cố định, so sánh hai bàn phế liệu đại lý đồ chơi:

1. Một **JSON tool-call**Đàn, mỗi lượt đã hành động.
2. Một **CodeAct**Đàn, mỗi hành động có thể phát ra một đoạn đoạn Python.

两者都使用 stub model( định nghĩa quy tắc), do đó so sánh sẽ把架与模型质量隔离──输见显示 CodeAct架 用更少转 解决更多任务,代价是每个动作的爆炸半径更大──

## 交付 nó

`outputs/skill-scaffold-audit.md` giúp bạn trong việc áp dụng các trình đặt trình điều hành mã hóa được đề xuất  trước khi thực hiện kiểm toán: chất lượng tìm kiếm, sự hiện diện của người kiểm tra, cách ly hộp cát, cũng như phù hợp với phân phối điểm tham khảo.

## 练习

1. 运行 `code/main.py`Trong cùng một tập nhiệm vụ trên, mỗi giàn cầu cần bao nhiêu lượt quay?

2. 阅读 OpenHands paper(arXiv:2407.16741)。 Bài báo này 认为 CodeAct 在复杂任务上优于JSON tool calls。 tìm ra giấy 承认一个失败模式,并写一句说明该模式 什么时候会在生产中占主导──

3. Từ backlog lỗi của bạn 中选择一个需要跨两个文件 修改 10+ 行的任务――估计边界模型 在 (a) JSON tool calls 和 (b) CodeAct 下的端到端成功概率――说明差距的理由――

4. SWE-bench Verified có 161 tập tin đơn  2 行 nhiệm vụ  cấu trúc một loại trừ chúng  số lượng 

5. 阅读 Tạo SWE-bench Verified(OpenAI) ―― giải thích được sử dụng để di chuyển các phương pháp cụ thể của các nhiệm vụ mơ hồ,并 nói ra một loại giải pháp 会漏掉的类别。

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|---|---|---|
| SWE-bench | “Coding benchmark” | 带有 ground-truth patches 和 test suites 的真实 GitHub issues |
| SWE-bench Verified | “Cleaned subset” | 500 个经过人工筛选的任务，存在 easier-tail |
| SWE-bench Pro | “Harder subset” | 10+ 行修改；frontier 得分为 23–59% |
| CodeAct | “Code-as-action” | Agent 发出 Python；Jupyter-style kernel 在 sandbox 中执行 |
| JSON tool call | “Function calling” | 每个 action 都是执行前经过验证的 structured JSON payload |
| Scaffold | “Agent framework” | 围绕基础模型的 retrieval + planner + executor + verifier loop |
| ACI (Agent-Computer Interface) | “SWE-agent's format” | 为 LLM ergonomics 设计的 command set，而不是 human shells |
| Verifier loop | “Test-and-retry” | 运行 tests、读取 output、修订 patch；最大的非模型可靠性收益 |

## 延伸阅读

- [Jimenez et al. — SWE-bench](https://www.swebench.com/) Định nghĩa chuẩn và phương pháp học
- [OpenAI — Introducing SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) bộ phận được sắp xếp là 如何构建的──
- [Wang et al. — OpenHands: An Open Platform for AI Software Developers](https://arxiv.org/abs/2407.16741) CodeAct 架构和事件流 设计──
- [Epoch AI — SWE-bench leaderboard](https://epoch.ai/benchmarks) 实时追踪的分数──
- [Anthropic — Measuring agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) khung độ tin cậy của các tác nhân mã hóa đường chân trời dài
