# 开放电气 GenAI 语义约定

> 开通通信的GenAI SIG(2024年4月启动) 定义了代理远程测量标准方案──跨域名称、属性和内容捕获规则 会在各供应商之间收收,因此代理痕迹在 Datadog、Grafana、Jaeger 和 Honeycomb 中表示相同的含义──

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 13 (LangGraph), Phase 14 · 24 (Observability Platforms)
**Time:** ~60 分钟

## 学习目标
- 描述GenAI跨度类别:模型/客户、代理、工具──
- 区分 `invoke_agent`客户与内部范围以及它们各自的适用场景.
- 列出顶层 GenAI属性:提供商名称,请求模型,数据源ID.
- 解释内容捕获合同:选择,`OTEL_SEMCONV_STABILITY_OPT_IN`、外部参考建议──

## 问题
每个供应商都发明了自己的跨度名称――操作团队最终要为每个框架分开构建仪表板――OpenTelemetry的GENAI SIG 通过定义一个整体生态都对齐的标准来解决这个问题――

## 概念
### 跨度类别

1. **Model / client spans.**覆盖原始LLM调用──由供应商开发开发开发方案 (SDKs) 及框架模型适配器发出──
2. **Agent spans.** `create_agent`构造代理`invoke_agent`运行代理时)
3. **Tool spans.**每次调用工具 一个;通过父母-孩子关系 连接到代理跨度.

### 代理跨度命名

- 标签:如果已命名,则为`invoke_agent {gen_ai.agent.name}`落为`invoke_agent`,我知道.
- 的类型:
  - **CLIENT** 用于远程代理服务 (OpenAI助理API、Bedrock代理) 👇
  - **INTERNAL** 用于过程中的代理框架 (长链,机组,本地反应)

### 关键属性

- `gen_ai.provider.name` `anthropic`,我知道.`openai`,我知道.`aws.bedrock`,我知道.`google.vertex`,我知道.
- `gen_ai.request.model`模型身份证
- `gen_ai.response.model` 解析后的模型可能因路由而不同于请求)
- `gen_ai.agent.name`代理标识符
- `gen_ai.operation.name` `chat`,我知道.`completion`,我知道.`invoke_agent`,我知道.`tool_call`,我知道.
- `gen_ai.data_source.id`为了RAG:查询哪个体或商店

人类的AI 蓝色AI 推理AWS 床 开放AI 都是技术的特定公约.

### 内容捕获

默认规则:仪器 默认 SHOULD NOT 捕获输入/输出──捕获 通过以下方式选择:

- `gen_ai.system_instructions`
- `gen_ai.input.messages`
- `gen_ai.output.messages`

推的生产模式:将内容存储在外部 (S3、你的日志存储),在跨度上记录引用 (Punker ID,而不是散文) ⋅这是27课内容中毒的方法

### 稳定性

截至2026年3月,大多数会议仍是实验性的.

```
OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental
```

数据库 v1.37+ 会将GenAI属性原生映射到其LLM可观性方案──其他后台──Grafana、Honeycomb、Jaeger) 支持原始属性──

### 这个模式很容易出错的地方

- **在 spans 中捕获完整 prompts。**客户数据将进入运营可读的痕迹.
- **没有 `gen_ai.provider.name`。**缺失时,多供应商仪表板 会失效.
- **没有 parent links 的 spans。**会产生孤立的工具范围――始终传播的背景――
- **没有设置 stability opt-in。**后期升级时,你的属性可能会被重新命名.


```figure
ae-genai-span-tree
```

## 构建它
`code/main.py`实现一个匹配GenAI公约的 stdlib跨度发射器:

- 带 GenAI属性方案的`Span`,我知道.
- 带`start_span`嵌的背景`Tracer`,我知道.
- 一个经过剧本的代理运行,会发出:`create_agent`,我知道.`invoke_agent`对于 LLM 调用而言`chat`跨度
- 一种内容捕获模式,将提示存储在外部,并跨度上记录ID.

运行它:

```
python3 code/main.py
```

输出:一棵包含所有必需的GenAI属性的跨度树,以及一个显示选择内容引用的"外部商店"――

## 使用它
- **Datadog LLM Observability**它们是对象的.
- **Langfuse / Phoenix / Opik**机器人 生态
- **Jaeger / Honeycomb / Grafana Tempo**原始的OTel痕迹;从GenAI属性构建仪表板──
- **Self-hosted** 使用GenAI处理器 运行OTel收藏器。

## 交付它
`outputs/skill-otel-genai.md`将OTel GenAI跨度 接入现有代理,并带有内容捕获默认和外部参考存储.

## 练习
1. 使用 `invoke_agent`你的课程01 反应循环――发送到一个Jaeger实例――
2. 在"仅引用"模式中添加内容捕获:提示 写入SQLite,跨度属性 只携带行 ID──
3. 阅读 `gen_ai.data_source.id`关于此,我们将把它连接到你的第九课.
4. 设置`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`并验证你的属性不会被收藏者重新命名.
5. 构建一个仪表板:仅从GenAI属性看"哪些工具错误与哪些模型相关"――

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GenAI SIG | "OpenTelemetry GenAI group" | 定义 schema 的 OTel working group |
| invoke_agent | "Agent span" | 表示一次 agent run 的 span name |
| CLIENT span | "Remote call" | 调用 remote agent service 的 span |
| INTERNAL span | "In-process" | in-process agent run 的 span |
| gen_ai.provider.name | "Provider" | anthropic / openai / aws.bedrock / google.vertex |
| gen_ai.data_source.id | "RAG source" | retrieval 命中了哪个 corpus/store |
| Content capture | "Prompt logging" | 对 messages 的 opt-in capture；prod 中存储在外部 |
| Stability opt-in | "Preview mode" | 用于固定 experimental conventions 的 env var |

## 延伸阅读
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 规范
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) 默认提供GenAI跨度
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) 内置 OTel 跨度
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) W3C 追踪环境 传播
