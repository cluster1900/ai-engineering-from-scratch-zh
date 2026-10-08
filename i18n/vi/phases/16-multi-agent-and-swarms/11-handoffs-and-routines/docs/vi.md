# Handoffs và Routines  无状态编排

> OpenAI của Swarm(2024 年 10 月) sẽ đa đại lý 编排提炼为两个原语:**routines**(Kể như hướng dẫn của hệ thống nhanh chóng + công cụ) và **handoffs**(trở lại một công cụ khác của Đại lý)。 không có trạng thái机, không có nhánh DSLLLM 通过调用正确的 handoff tool 来路由。OpenAI Agents SDK(2025 年 3 月) là người kế thừa cấp sản xuất của nó。 Swarm 本身仍然是最清晰的概念参考它的全部源码只有几百行。 mô hình này 传播很快,因为 API 表面大致就是agent = prompt + tools; handoff = hàm trả lại đại lý──限制:无状态,因此记忆是调用方的问题。

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## 问题

Mỗi khung đa đại lý đều muốn bạn học được DSL: LongGraph của nó: các nút và cạnh, CrewAI của đội ngũ và nhiệm vụ, AutoGen của GroupChat và quản lý.

Swarm 走向相反方向: sử dụng mô hình đã có năng lực gọi công cụ 能力──Handffs 变成 tool calls──Orchestrator chính là người đang nắm bắt cuộc đối thoại──status机隐含在代理的系统提示中──

## 概念

### 两个原语

**Routine。**定义 Agent 角色和可用工具的系统提示──可以把它看作一组有作用域的指示:你是分类代理;如果用户问退款,就交给退款代理──

**Handoff。**Một công cụ có thể được điều chỉnh, nó trả lại một đối tượng mới của Agent.

```
def transfer_to_refunds():
    return refund_agent  # Swarm sees Agent return → switch active agent

triage_agent = Agent(
    name="triage",
    instructions="Route the user to the right specialist.",
    functions=[transfer_to_refunds, transfer_to_sales, transfer_to_support],
)
```

Hệ thống của đại lý phân loại nhanh chóng  để nó dựa trên thông tin người dùng chọn đúng đắn của giao dịch.

### Tại sao nó lan nhanh

- **API 小。**Chỉ cần học hai khái niệm.
- **使用模型已经会做的事。**Các công cụ gọi đã đạt được cấp độ sản xuất trong các nhà cung cấp.
- **没有状态机负担。**Bạn không cần phải mô tả biểu đồ; Các lời nhắc của đại lý mô tả chúng sẽ được trao cho ai.

### 无 trạng thái取舍

Swarm trong các chạy 间明确无状态的. 框架 trong một run 期间保留消息历史,但不会持久化任何东西. 记忆,连续性,长期运行任务全都是调用方的问题.

Trong môi trường sản xuất, OpenAI Agents SDK,2025 年 3 月), đây là một trong những thay đổi chính:SDK đã thêm vào quản lý phiên nội bộ, bảo vệ và theo dõi, đồng thời giữ lại giao dịch.

### Thống / tình yêu 适合的场景

- **Triage patterns。**Một đại lý sẽ chuyển người dùng sang chuyên gia.
- **基于技能的 handoffs。**Nếu nhiệm vụ cần mã, hãy gọi cho người lập trình; nếu cần nghiên cứu, hãy gọi cho nhà nghiên cứu.
- **短而有边界的对话。**Hỗ trợ khách hàng, câu hỏi thường xuyên về vé, quy trình làm việc đơn giản.

### Đội đông 吃力的场景

- **带共享 memory 的长 sessions。**Handoffs sẽ đưa trạng thái trò chuyện lại để đặt cho một đặc vụ mới ngay lập tức với lịch sử. Không có bộ nhớ quản lý, không thể duy trì trạng thái giữa các đặc vụ.
- **并行执行。**Handoff là một lần một đại lý hoạt động 会切换;;
- **Audit 和 replay。**无状态 runs 很难精确重播; Handoff của LLM 选择不是确定性的。

### OpenAI Agents SDK(2025 年 3 月)

sinh sản cấp kế thừa đã thêm:

- **Session state。**跨 runs 的持久线子──
- **Guardrails。**输入/输出 xác nhận hooks.
- **Tracing。**Mỗi cuộc gọi và giao hàng đều được ghi lại.
- **Handoff filters。**控制交付 时转移哪些上下文──

Handoff nguyên ngữ được giữ lại; sản xuất có thể sử dụng xung quanh nó.

### Swarm vs GroupChat

两者都使用 LLM-驱动路由, nhưng sự khác biệt nằm ở**谁选择下一个**- Có thể là:

- GroupChat:由外部的选择器 (由外部的选择器) (由外部的选择器 (由外部的选择器) (由外部的选择器) (由外部的选择器 (由外部的选择器) (由外部的选择器) (由外部的选择器) (由外部的选择器) (由外部的选择器) (由外部的选择器) (由外部的选择器) (由外部的选择器) (由外部的选择器) (由外部的选择器) (由外部的选择器) (由外部的选择器) 下一个讲话器) (由外部的选择器) (由外部的选择器) (由外部的选择器) (由外部的选择器) (由外部的选择器) (由外部的选择器) (由外部的选择器)
- Swarm: 当前代理 通过调用交付工具 选择它的继任者──

Swarm là Agent quyết định bước tiếp theo là gì ;GroupChat là manager quyết định bước tiếp theo là gì ;;Swarm là quyết định tồn tại trong cuộc gọi công cụ của đại lý hoạt động ;GroupChat là quyết định tồn tại trong`GroupChatManager`Ở giữa.


```figure
sw-handoff-routing
```

##  xây dựng nó

`code/main.py`Từ zero thực hiện Swarm: một lớp dữ liệu của đại lý, một cơ chế giao dịch, một công cụ, một vòng chạy của đại lý.

Demo: Một đại lý phân loại 会路由到退款,销售或支持专家―― mỗi chuyên gia đều có công cụ riêng――run loop sẽ in mỗi lần giao tiếp――

运行:

```
python3 code/main.py
```

## Sử dụng nó

`outputs/skill-handoff-designer.md`Để thiết kế các nhiệm vụ giao giao hàng: có những đại lý nào, chúng có thể điều chỉnh những giao hàng nào, sẽ chuyển giao những gì trên và dưới đây.

##  phát hành nó

Danh sách kiểm tra:

- **Handoff logging。**Mỗi lần giao đều ghi vào một sự kiện theo dõi, bao gồm từ đại lý đến đại lý, chụp ảnh xung quanh.
- **上下文转移规则。**quyết định giao hàng 时移动什么: toàn bộ lịch sử
- **Handoff guardrail。**Khi giao cho một chuyên gia có quyền sử dụng các công cụ khác nhau, họ phải được chứng nhận nếu không, họ có thể bắt buộc phải đưa ra các giao cho người khác.
- **Loop detection。**Hai đại lý quay lại để bỏ tay là thường见失败; sử dụng đơn giản kiểm tra vòng cuối cùng của K kiểm tra 检测。
- **Fallback agent。**Nếu mục tiêu giao không tồn tại, thì quay lại giá trị bảo mật.

## 练习

1. 运行 `code/main.py`,trial to refund agent. Confirm 2nd round active agent là refund.
2. 添加循环-detection 规则: Nếu cùng hai đại lý đã liên tục bỏ tay 3 lần,则强制退出;;
3. 阅读 OpenAI Agents SDK docs 中关于 handoff filter 的内容──实现一个总结-on-handoff版本:
4. Để cho phép người dùng dùng dùng cho phép tiêm nhanh hơn, vì sao?
5. 阅读 Swarm cookbook(https://developers.openai.com/cookbook/examples/orchestrating_agents）。找出Một quyết định thiết kế rõ ràng của Swarm, và giải thích OpenAI Agents SDK đã thay đổi nó hoặc giữ nó.

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| Routine | “Agent prompt” | System prompt + tool list。定义角色和可用 handoffs。 |
| Handoff | “转交给另一个 Agent” | active agent 可以调用的一个 tool，它返回新的 Agent。runtime 会切换 active agent。 |
| Stateless | “runs 之间没有 memory” | Swarm 不持久化任何东西；memory 是调用方的责任。 |
| Active agent | “现在谁在说话” | 当前掌握对话的 Agent。Handoff 会改变它。 |
| Context transfer | “handoff 时移动什么” | incoming agent 能看到哪些 history 的策略：full、last N 或 summarized。 |
| Handoff loop | “Agents 来回 ping-pong” | 两个 Agents 不断 hand back 给对方的失败模式。 |
| OpenAI Agents SDK | “生产级 Swarm” | 2025 年 3 月的后继者；在 handoff 原语之上添加 sessions、guardrails、tracing。 |
| Handoff filter | “转移时的 gate” | SDK feature，用于在 handoff 边界检查和修改上下文。 |

## 延伸阅读

- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) 参考性阐述
- [OpenAI Swarm repo](https://github.com/openai/swarm) 原始实现, như một khái niệm để lưu giữ
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) 带 sessions 和 tracing 的生产级后继者
- [Anthropic handoff-in-Claude notes](https://docs.anthropic.com/en/docs/claude-code) Claude Code subagents  làm thế nào để thông qua `Task`Sử dụng mô hình tương tự như giao hàng
