# Phương pháp dòng công việc của nhân loại:简单优于复杂

> Schluntz và Zhang (Anthropic,2024 年 12 月) phân biệt các dòng chảy công việc (预定义路径) và các đại lý (动态工具使用) 五种工作流模式 覆盖大多数情况――从直接 API调用开始――只有当步无法预测时,才添加代理――

**类型：**Học tập + xây dựng
**语言：**Python (stdlib)
**先修要求：**Giai đoạn 14 · 01 (Thử lý vận hành)
**时间：**约60分钟

## Học mục tiêu

- Nói về 5 kiểu quy trình làm việc của Anthropic: chuỗi nhanh, đường dẫn, song song, nhạc công, người đánh giá, người tối ưu hóa.
- Giải thích sự khác biệt giữa các đại lý và dòng công việc, cũng như chi phí xây dựng riêng của họ.
- 识别何时选择工作流而不是代理(反之亦然)
- Sử dụng STDlib  nhắm vào LLM kịch bản  thực hiện tất cả 5 kiểu mẫu.

## 问题

团队 thường xuyên vì mục đích nên sử dụng một chức năng调用 giải quyết vấn đề giới thiệu các khung đa đại lý.

## 概念

### Phòng làm việc đối với các đại lý

- **Workflow。**通过预定义代码路径编排的 LLM 和工具──工程师 拥有图――
- **Agent。**LLM 动态 chỉ huy các công cụ của riêng mình并采取 các bước của riêng mình.

两者都有适用场景――Workflow 更便宜、更快,也更容易调试――Agents 能解锁开放式问题,但会让失败模式更难推理――

### LLM tăng cường

五种模式的基础:一个LLM 接入三种能力  tìm kiếm(khám phá) 、工具(行动) 、记忆(persistence) ‖ bất kỳ cuộc gọi API nào đều có thể sử dụng những năng lực này。

### 5 kiểu

1. **Prompt chaining。**Loại đầu ra của cuộc gọi 1 được sử dụng như một mục nhập của cuộc gọi 2.

2. **Routing。**CLASSIFYER LLM  chọn để调用 downstream LLM hoặc công cụ.

3. **Parallelization。**并发运行 N 个 LLM gọi,聚合结果──两种形态:sectioning(不同块) 和投票(同步提示,运行 N 次,多数/综合)

4. **Orchestrator-workers。**tổ chức LLM 动态决定运行哪些工人(同样是 LLM),并综合它们的输出──类似于代理循环,但管家不会无限循环──

5. **Evaluator-optimizer。**Một LLM  đưa ra câu trả lời, một LLM  đánh giá nó.

### Giao dịch công việc 胜过代理的地方

- **可预测任务。**Nếu có thể đưa ra một bước, thì nên đưa ra.
- **受成本约束的任务。**Các dòng công việc có một số bước giới hạn; các đại lý có thể không kiểm soát sự gia tăng.
- **受合规约束的任务。**Các kiểm toán mong muốn đọc biểu đồ, thay vì đưa ra kết luận từ quỹ đạo.

### Các đại lý 胜过工作流的地方

- **开放式研究。**Khi bước tiếp theo phụ thuộc vào nội dung của bước tiếp theo trở lại khi.
- **可变长度任务。**需要数分钟到数小时,步骤数未知工作.
- **新领域。**Khi bạn còn không biết đúng dòng công việc 时  先探索,后再编码──

### Quản lý ngữ cảnh 配套内容

"Kỹ thuật ngữ hiệu quả cho các đại lý AI" (Anthropic 2025) đã hình thành các ngành học gần nhau: cửa sổ 2007k là ngân sách, không phải là một thiết bị chứa.


```figure
workflow-chain
```

##  xây dựng nó

`code/main.py` đối với `ScriptedLLM`实现了全部五种工作流模式:

- `prompt_chain(input, steps)` 顺序执行。
- `route(input, classifier, handlers)` phân loại + vận chuyển
- `parallel_vote(prompt, n, aggregator)` 运行 N 次并聚聚¬¬¬¬¬¬¬¬¬¬¬
- `orchestrator_workers(task, workers)` nhạc sĩ  chọn công nhân。
- `evaluator_optimizer(task, proposer, evaluator, max_iter)` 循环直到通过.

运行:

```
python3 code/main.py
```

Mỗi mẫu sẽ in dấu vết riêng của mình. Tổng số các mã của mỗi mẫu là khoảng 10-15 dòng; chi phí khung thường được đo bằng hàng ngàn dòng.

## Sử dụng nó

- Hầu hết các nhiệm vụ sử dụng các cuộc gọi trực tiếp của API.
- Chỉ có một mô hình hiện tại thực sự cần trạng thái bền vững (LangGraph)  đồng thời mô hình diễn viên (AutoGen v0.4) hoặc mô hình vai trò (CrewAI) 
- Khi bạn muốn Claude Code sử dụng 形态、但不想重建时, chọn Claude Agent SDK。

## 交付 nó

`outputs/skill-workflow-picker.md`会为给定任务描述选择正确模式, bao gồm lý luận quyết định, cũng như các con đường của việc xây dựng lại cho đại lý khi các dòng công việc không đủ thời gian.

## 练习

1. Sử dụng ngưỡng tin cậy  thực hiện đường dẫn  thấp hơn ngưỡng -> nâng cấp cho con người  Đối với hỗ trợ cấp 1  Ví dụ, ngưỡng này  nên rơi ở đâu?
2.  Đưa `parallel_vote`Thêm thời gian nghỉ... khi có cuộc gọi, làm thế nào để bạn tập hợp trong tình trạng thiếu phiếu bầu?
3. - Đưa đi.`evaluator_optimizer`改成 bandit: xuyên lặp bảo vệ đầu ra 2 đầu ra, vì vậy kết quả tốt xuất hiện tối nay sẽ không bị kết quả xấu xuất hiện tối hậu bao phủ.
4. 将 prompt chaining 与 routing 结合:router 选择三条链 中一条──衡量 Token 成本,并与单个大提示替代方案比较──
5. 选择你的一个生产功能―― vẽ ra biểu đồ quy trình làm việc――统计步骤数――这里代理 真的会更好吗?

## 关键术语

| 术语 | 人们常说什么 | 它实际意味着什么 |
|------|----------------|------------------------|
| Workflow | "预定义 flow" | Engineer 拥有的 LLM 和 tool calls graph |
| Agent | "Autonomous AI" | Model 拥有的 graph；动态 tool direction |
| Augmented LLM | "带 tools 的 LLM" | LLM + search + tools + memory；原子单元 |
| Prompt chaining | "顺序 calls" | call N 的输出是 call N+1 的输入 |
| Routing | "Classifier dispatch" | 选择由哪条 chain/model 处理输入 |
| Parallelization | "Fan out" | N 个并发 calls；通过 sectioning 或 voting 聚合 |
| Orchestrator-workers | "Dispatcher agent" | Orchestrator LLM 动态选择 specialist LLMs |
| Evaluator-optimizer | "Proposer + judge" | 迭代直到 evaluator 通过；Self-Refine 的泛化 |

## 延伸阅读

- [Anthropic, Building Effective Agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) 五种工作流模式
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 配套方法
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) biểu đồ trạng thái 何時值其成本
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) 产品化的 dàn nhạc-người làm việc mô hình
