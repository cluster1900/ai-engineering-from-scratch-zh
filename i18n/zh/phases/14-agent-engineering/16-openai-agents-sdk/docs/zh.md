# 开放AI代理 SDK: 交付,护卫,追踪

> 基于响应API构建轻量级多代理框架的OpenAI代理SDK.`transfer_to_<agent>`工具──防护车 会在输入或输出上触发──追踪默认开启──

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## 学习目标
- 解释了OpenAI代理SDK的五个原始因素.
- 解释手稿:为什么它们被建成工具,模型看到的名称,形状是什么以及文本如何转移.
- 区分输入护,输出护和工具护;解释`run_in_parallel`与阻塞模式.
- 用dlib 实现一个带有手柄 + 护 + 跨度式追踪的运行时间.

## 问题
无法干净委托的代理人最终将所有内容都放在一个提示中. 没有护的代理人会交付PII,违反政策的输出,或者永远循环.

## 概念
### 五个原始

1. **Agent.**士学位+指令+工具+手工士学位――
2. **Handoff.**委托给另一个代理.`transfer_to_<agent_name>`工具.
3. **Guardrail.**进行验证. 对于输入 (仅第一个代理) 输出 (仅最后一个代理) 或工具调用 (每个功能工具).
4. **Session.**跨转的自动对话历史──
5. **Tracing.**技术技术的发展,技术的发展,

### 作为工具的手渡

模型会在它的工具列表中看到`transfer_to_billing_agent`调用它将向运行时间发出信号:

1. 复制对话背景或通过`nest_handoff_history`现在,我们要做什么?
2. 使用目标代理的指示 初始化目标代理.
3. 用目标代理继续运行.

这就是产品的监督模式.

### 防护

三种类型:

- **Input guardrails.**在第一个代理的输入上运行. 在任何LLM电话之前拒绝不安全或超出范围的请求.
- **Output guardrails.**在最后一个代理的输出上运行. 捕获PII泄露,违反政策,错误的反应.
- **Tool guardrails.**按函数工具运行――验证参数检查权限审计执行――

模式:

- **Parallel**道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道道
- **Blocking**(`run_in_parallel=False`护护法师先运行.如果触发,主要电话不会浪费代币.

三线电将抛出`InputGuardrailTripwireTriggered`现在,`OutputGuardrailTripwireTriggered`,我知道.

### 追踪

默认开启. 每次LLM的代人,工具的呼叫,支持和护都会发出一个跨度.`OPENAI_AGENTS_DISABLE_TRACING=1`我会退出.`add_trace_processor(processor)`它们将扩展到您自己的后端,同时也发送到OpenAI的后端.

### 会议

`Session`将对话历史存储在后端中(SQLite、Redis、自定义)`Runner.run(agent, input, session=session)`会自动加载并添加.

### 这个模式很容易出错的地方

- **Handoff drift.**代理A手放下给B,B又放下给A.
- **Guardrail bypass.**工具保护只在功能工具上触发;内置工具(文件阅读器,网页搜索) 需要单独的政策.
- **Over-tracing.**包含敏感内容.与OTel GenAI内容捕获规则.


```figure
ae-agent-handoff
```

## 构建它
`code/main.py`实现了 SDK 形状:

- `Agent`,我知道.`FunctionTool`,我知道.`Handoff`(作为带有转移语义的功能工具)
- 带输入/输出/工具护,送货和跳转计数器`Runner`,我知道.
- 一个简单的跨度发射器,用于显示痕迹形状.
- 一个分类代理,根据用户的查询,将手放到账单或支持;

运行:

```
python3 code/main.py
```

标志着两次成功的交付,一个输入护旅行,以及一个与真实的SDK相对的发射内容的跨度树.

## 使用它
- **OpenAI Agents SDK**为了开放AI的第一产品.
- **Claude Agent SDK**(课17),用于克劳德第一产品.
- **LangGraph**(课 13) 用于你想要的明确状态和持久简历的情况.
- **Custom**为了实现这一目标,我们需要精确控制

## 交付它
`outputs/skill-agents-sdk-scaffold.md`机架 一个代理SDK应用程序,包含分类代理、补贴、输入/输出/工具护、会议商店和跟踪处理器──

## 练习
1. 添加交付跳转计数:超过N 次转移 后拒绝;; 追踪这个行为;;
2. 将`nest_handoff_history`实现为一个选项:在转移前将之前的消息崩成一个总结.
3. 编写一个阻断输出防护车──比较会触发它的提示与通过提示的延迟──
4. 将`add_trace_processor`连接到JSON记录器. 它对每个跨度发射的形状是什么?
5. 阅读SDK文件.将你的玩具端口到`openai-agents-python`你在哪些地方建模错了?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | "LLM + instructions" | SDK 中的 Agent type；拥有 tools 和 handoffs |
| Handoff | "Transfer" | 模型调用以 delegate 给另一个 agent 的 tool |
| Guardrail | "Policy check" | 对 input / output / tool invocation 的 validation |
| Tripwire | "Guardrail trip" | guardrail 拒绝时抛出的 exception |
| Session | "History store" | runs 之间持久化的 conversation memory |
| Tracing | "Spans" | 覆盖 LLM + tool + handoff + guardrail 的内置 observability |
| Blocking guardrail | "Sequential check" | Guardrail 先运行；trip 时不浪费 Token |
| Parallel guardrail | "Concurrent check" | Guardrail 同时运行；latency 更低，trip 时浪费 Token |

## 延伸阅读
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/)原始品,手套,护卫,追踪
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) 克劳德风格的同行
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)什么时候真正应该使用手柄
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 代理 SDK 范围 映射到的标准
