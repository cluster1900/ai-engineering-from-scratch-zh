# 开通通讯 GenAI  端到端追踪工具 呼叫

> 一个代理调用了五种工具、三个MCP服务器和两个子代理──你需要一个贯穿所有环节的痕迹──OpenTelemetry GenAI语义公约 (v1.37 及以上版本中的稳定属性) 是2026年标准,并由 Datadog、Langfuse、Arize Phoenix、OpenLLMetry 和 AgentOps 原生支持──本课会列列必需属性,解读跨度层次结构(代理 → LLM →工具),并提供一个stdlib发射器,你可以将其连接到任何OTel出口商的跨度──

**Type:** Build
**Languages:** Python (stdlib, OTel span emitter)
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 08 (MCP client)
**Time:** ~75 minutes

## 学习目标
- 解释LLM跨度和工具执行跨度所需的OTel GenAI属性.
- 构建覆盖代理循环,LLM调用,工具调用和MCP客户端发送的跟踪层次结构.
- 决定要捕获哪些内容 (选择) 以及默认要编辑哪些内容.
- 在不重写工具代码的情况下,将跨度发送到本地收藏家 (Jaeger、Langfuse) .

## 问题
一个2026年2月的错误案例:用户报告 我的代理有时需要30秒才响应;其他时候只需3秒──没有痕迹──记录显示LLM电话,但没有显示工具发送、MCP服务器回路,也没有显示子代理──你只能猜──最后你发现:某个MCP服务器偶尔会在冷启动时卡住──

没有端到端追踪,你无法定位这个问题.

这些公约在2025-2026年由OpenTelemetry的语义会议组定型――它们定义了稳定的属性名称,因此Datadog、Langfuse、Phoenix、OpenLLMetry 和 AgentOps 都能解析相同的跨度――只需要仪器一次;即可发送到任意的后端――

## 概念
### 跨度等级

```
agent.invoke_agent  (top, INTERNAL span)
 ├── llm.chat       (CLIENT span)
 ├── tool.execute   (INTERNAL)
 │    └── mcp.call  (CLIENT span)
 ├── llm.chat       (CLIENT span)
 └── subagent.invoke (INTERNAL)
```

整个流程嵌套在同一条标签下面.

### 要求属性

根据2025-2026年的 Semconv:

- `gen_ai.operation.name` `"chat"`,我知道.`"text_completion"`,我知道.`"embeddings"`,我知道.`"execute_tool"`,我知道.`"invoke_agent"`,我知道.
- `gen_ai.provider.name` `"openai"`,我知道.`"anthropic"`,我知道.`"google"`,我知道.`"azure_openai"`,我知道.
- `gen_ai.request.model` 请求的模型字符串(例如 `"gpt-4o-2024-08-06"`
- `gen_ai.response.model` 实际提供服务的模式──
- `gen_ai.usage.input_tokens`现在,`gen_ai.usage.output_tokens`,我知道.
- `gen_ai.response.id` 用关联的供应商响应ID.

对于工具范围:

- `gen_ai.tool.name`工具标识符──
- `gen_ai.tool.call.id` 具体的呼叫 ID──
- `gen_ai.tool.description`工具描述 (可选)

对于代理时间:

- `gen_ai.agent.name`现在,`gen_ai.agent.id`现在,`gen_ai.agent.description`,我知道.

### 子类型

- `SpanKind.CLIENT`用于跨越过程界限的调用 (LLM提供商,MCP服务器)
- `SpanKind.INTERNAL`用于代理 自身的循环步骤和工具执行.

### 选择内容捕获

默认情况下,跨度 携带指标和时间,而不是提示或完成.`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`内容的含量.

### 跨度事件

代币级事件可以作为跨度事件添加:

- `gen_ai.content.prompt`输入信息──
- `gen_ai.content.completion`输出消息──
- `gen_ai.content.tool_call`记录下来的工具呼叫.

事件在一个时间内按时间排序,便于详细重演.

### 出口商

 OTel 跨度可导出到:

- **Jaeger / Tempo.**现场服务.
- **Langfuse.**面向LLM可观化代币使用
- **Arize Phoenix.**值+追踪结合――
- **Datadog.**商业产品;原生解析 `gen_ai.*`属性
- **Honeycomb.**专导向;便于查询.

它们都使用OTLP,也就是电线格式.

### 跨MCP传播

当MCP客户端调用服务器时,把W3C追踪标题注入请求――可流动的HTTP支持标准标题――Stdio不原生携带HTTP标题;该规范的2026路线图 讨论在JSON-RPC调用上添加`_meta.traceparent`字段.

在发布之前:手动在每个请求的`_meta`中包含追踪──服务器记录追踪ID──

### 计量

除了跨度之外,GenAI Semconv还定义了指标:

- `gen_ai.client.token.usage`历史图
- `gen_ai.client.operation.duration`历史图
- `gen_ai.tool.execution.duration`历史图

将这些用于不需要每次通话的仪表板.

### 代理Ops 层

据悉,在该项目中,有了大量的技术,包括: 机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,机器人,


```figure
t3-span-waterfall
```

## 使用它
`code/main.py`会把OTel形的跨度发送到stdout (采用类似OTLP-JSON的格式),用于调用LLM、发送两个工具,并进行一次MCP回路旅行的代理──没有真实出口者本课聚焦于跨度形状和属性集合──把输出粘贴到OTLP兼容的观众中,或直接阅读它──

需要关注的点:

- 所有的跨度共享同一个追踪ID.
- 通过父母与孩子的联系`parentSpanId`编码.
- 必须`gen_ai.*`已填充的属性.
- 内容捕获默认关闭;其中一个场景会通过环境打开它.

## 交付它
本课会产出 `outputs/skill-otel-genai-instrumentation.md`△给出一个代理代码基础,该技能会生成一个仪器计划:在哪里添加跨度、填充哪些属性,以及目标出口者是哪些──

## 练习
1. 运行`code/main.py`△统计范围 数量,并识别哪些是客户,哪些是内部.

2. 打开内容捕获,确认出现`gen_ai.content.prompt`和 `gen_ai.content.completion`事件对 PII的影响注意.

3. 添加工具执行指标`gen_ai.tool.execution.duration`按每次调用将其作为一个 histogram 样本发送.

4. 将从母体代理传播到MCP请求的追踪`_meta.traceparent`字段――验证MCP服务器会看到相同的痕迹ID――

5. 阅读 OTel GenAI semconv 标签. 找出一个中列出的 semconv,但本课代码没有发送的属性.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| OTel | "OpenTelemetry" | 用于 traces、metrics、logs 的开放标准 |
| GenAI semconv | "GenAI semantic conventions" | LLM / tool / agent spans 的稳定 attribute names |
| `gen_ai.*` | "The attribute namespace" | 所有 GenAI attributes 都共享此前缀 |
| Span | "Timed operation" | 一个具有 start、end 和 attributes 的 work unit |
| Trace | "Cross-span ancestry" | 共享同一个 trace id 的 spans 树 |
| SpanKind | "CLIENT / SERVER / INTERNAL" | 关于 span direction 的提示 |
| OTLP | "OpenTelemetry Line Protocol" | exporters 使用的 wire format |
| Opt-in content | "Prompt / completion capture" | 默认关闭；通过 env var 启用 |
| traceparent | "W3C header" | 跨 services 传播 trace context |
| Exporter | "Backend-specific shipper" | 将 spans 发送到 Jaeger / Datadog / 等的组件 |

## 延伸阅读
- [OpenTelemetry — GenAI semconv](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 基因AI范围、计量和事件权力公约
- [OpenTelemetry — GenAI spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/) LLM 和工具执行跨度属性列表
- [OpenTelemetry — GenAI agent spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/)代理级`invoke_agent`跨度
- [open-telemetry/semantic-conventions — GenAI spans](https://github.com/open-telemetry/semantic-conventions/blob/main/docs/gen-ai/gen-ai-spans.md) GitHub 托管的权威来源
- [Datadog — LLM OTel semantic convention](https://www.datadoghq.com/blog/llm-otel-semantic-convention/)生产一体化 讲解
