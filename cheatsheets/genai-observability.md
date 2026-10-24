---
id: genai-observability
title: OpenTelemetry GenAI and Agent Observability
code: OG
subtitle: 发出 gen_ai.* span、对 trace 采样、导出指标、选择平台并调试 trace。代码来自课程中的标准库实现。
hue: 25
sources: phases/13-tools-and-protocols/20-opentelemetry-genai, phases/14-agent-engineering/23-otel-genai-conventions, phases/14-agent-engineering/24-agent-observability-platforms, phases/17-infrastructure-and-production/13-llm-observability, phases/19-capstone-projects/11-llm-observability-dashboard, phases/19-capstone-projects/28-observability-otel-traces, projects/agent-trace-debugger
source_hash: 413430fbc0d5ea57
---

## Agent span 层级
type: architecture
from: phases/13-tools-and-protocols/20-opentelemetry-genai/docs/en.md, phases/13-tools-and-protocols/20-opentelemetry-genai/code/main.py

```arch
node | agent | 1,1 | agent.invoke_agent | INTERNAL, root span | process
node | llm | 2,1 | llm.chat | CLIENT, LLM provider | model
node | tool | 2,2 | tool.execute | INTERNAL | process
node | mcp | 3,2 | mcp.call | CLIENT, traceparent | process
node | sub | 2,3 | subagent.invoke | INTERNAL | process
node | exp | 3,1 | Exporter | OTLP to any backend | store
edge | agent | llm | parentSpanId
edge | agent | tool | parentSpanId
edge | tool | mcp | _meta.traceparent
edge | agent | sub | parentSpanId
edge | llm | exp | spans
```

## 要设置的属性
type: concepts
from: phases/13-tools-and-protocols/20-opentelemetry-genai/docs/en.md, phases/14-agent-engineering/23-otel-genai-conventions/docs/en.md

- **`gen_ai.operation.name`**：`chat`、`embeddings`、`execute_tool`、`invoke_agent`。
- **`gen_ai.provider.name`**：`openai`、`anthropic`、`aws.bedrock`、`google.vertex`。
- **`gen_ai.request.model`**：你请求的模型。
- **`gen_ai.response.model`**：实际处理该调用的模型。路由可能改变它。
- **`gen_ai.usage.input_tokens`**：输入 token。`gen_ai.usage.output_tokens` 给出输出 token。
- **`gen_ai.response.id`**：供应商的响应 id，用于关联。
- **`gen_ai.tool.name`**：工具。`gen_ai.tool.call.id` 标识一次调用。
- **`gen_ai.data_source.id`**：RAG 步骤读取的语料或存储。

## 在代码中埋点
type: task-table
from: phases/13-tools-and-protocols/20-opentelemetry-genai/code/main.py, phases/14-agent-engineering/23-otel-genai-conventions/code/main.py, phases/19-capstone-projects/28-observability-otel-traces/code/main.py, phases/17-infrastructure-and-production/13-llm-observability/code/main.ts

| 任务 | 代码 |
|---|---|
| 启动子 span | `start_span(name, kind, parent=root)` |
| 构造 traceparent | `f"00-{mcp_span.trace_id}-{mcp_span.span_id}-01"` |
| 以引用形式存储内容 | `tracer.add_content(chat, key, prompt)` |
| 用 span 包裹工作 | `with builder.span(name, attributes=..., parent=...)` |
| 每行写一个 span | `JSONLExporter(path=trace_path)` |
| 统计工具调用 | `metrics.counter("tools_called_total")` |
| 渲染 Prometheus 文本 | `prometheus_exposition(registry)` |
| 在 exporter 中采样 | `makeSamplingExporter(consoleExporter, 0.05)` |

## 带指标的 span 构造器
type: annotated-code
lang: python
from: phases/19-capstone-projects/28-observability-otel-traces/code/main.py, phases/19-capstone-projects/28-observability-otel-traces/docs/en.md

```python
metrics = MetricsRegistry()
builder = SpanBuilder(exporters=[jsonl, in_mem], metrics=metrics)
with builder.span("gen_ai.chat", attributes={GEN_AI_SYSTEM: "anthropic",
        GEN_AI_OPERATION_NAME: "chat"}, kind="CLIENT") as chat_span:
    chat_span.attributes[GEN_AI_USAGE_INPUT_TOKENS] = 412
    with builder.span("gen_ai.tool.execution", parent=chat_span,
            attributes={GEN_AI_TOOL_NAME: "read_file"}) as tool1:
        tool1.attributes[GEN_AI_TOOL_RESULT_BYTES] = 1024
print(prometheus_exposition(metrics))  # tools_called_total, tool_latency_ms
```

## 运行课程代码
type: command-table
from: phases/13-tools-and-protocols/20-opentelemetry-genai/code/main.py, phases/14-agent-engineering/23-otel-genai-conventions/docs/en.md, phases/19-capstone-projects/28-observability-otel-traces/docs/en.md, phases/19-capstone-projects/11-llm-observability-dashboard/code/ts/README.md, phases/19-capstone-projects/11-llm-observability-dashboard/docs/en.md

| 命令 | 作用 |
|---|---|
| `python code/main.py` | 第 13.20 课，打印一条 trace 的 span |
| `OTEL_CAPTURE_CONTENT=1 python code/main.py` | 加入 prompt 和 completion 事件 |
| `python3 code/main.py` | 第 14.23 课，打印 span 树和内容存储 |
| `python3 -m pytest code/tests/ -v` | 第 19.28 课，检查往返与分桶 |
| `npm start` | 生成 1200 个合成 span，打印汇总 |
| `npm run serve` | 在 `PORT` 上提供 ingest 和仪表盘服务 |

## 调试 trace：agent-trace-debugger
type: flow
from: projects/agent-trace-debugger/solution/main.ts, projects/agent-trace-debugger/solution/cli.ts, projects/agent-trace-debugger/project.json

1. **`parseTrace`**：每行一个 JSON 对象。遇到坏行时停止并给出行号。
2. **`validateTree`**：拒绝重复 id、环、缺失的父节点、超出父节点范围的子节点。
3. **`unionDuration`**：合并重叠的子区间，而不是相加。
4. **`analyze`**：独占时间等于包含时间减去子区间并集。
5. **`analyze`**：`slowest` 指出独占时间最大的 span。
6. **`render`**：写出独立 HTML，名称已转义并对错误着色。
7. **cli.ts**：`--baseline` 增加 `wall_time_delta_ms`、`token_delta`、`error_delta`。

## Trace 调试器命令
type: annotated-code
lang: bash
from: projects/agent-trace-debugger/README.md, projects/agent-trace-debugger/solution/cli.ts

```bash
python3 scripts/project_test.py agent-trace-debugger --init learning-artifacts/agent-trace-debugger
python3 scripts/project_test.py agent-trace-debugger --stage 1 --path learning-artifacts/agent-trace-debugger --strict
python3 scripts/project_test.py agent-trace-debugger --all --solution --strict
node cli.ts --input samples/trace.jsonl --baseline samples/before.jsonl --output trace.html --json trace.json
node cli.ts --format otlp --input samples/otlp.json --output otlp-trace.html --json otlp-trace.json
```

## 默认值与数字
type: defaults
from: phases/13-tools-and-protocols/20-opentelemetry-genai/code/main.py, phases/19-capstone-projects/11-llm-observability-dashboard/code/main.py, phases/19-capstone-projects/11-llm-observability-dashboard/code/ts/src/spans.ts, phases/19-capstone-projects/11-llm-observability-dashboard/code/ts/src/index.ts, phases/19-capstone-projects/28-observability-otel-traces/docs/en.md, phases/17-infrastructure-and-production/13-llm-observability/code/main.ts, projects/agent-trace-debugger/solution/cli.ts, projects/agent-trace-debugger/README.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `OTEL_CAPTURE_CONTENT` | `"0"` | 设为 1 以捕获 prompt 和 completion |
| `TailSampler` `sample_rate` | `0.10` | 错误和 PII 评估总是保留 |
| `ObservabilityStore` 容量 | `10_000` | span 的环形缓冲区 |
| `PORT` | `8011` | 设为 `SERVE=1` 以启动 HTTP 服务器 |
| 高成本 span | `totalTokens > 8000` | 采样 exporter 总是保留 |
| `--format` | `jsonl` | 也可用 `otlp`。基线文件保持 JSONL |
| `--output` | `trace.html` | `--json` 写出报告文件 |

## 故障排查
type: troubleshooting
from: phases/14-agent-engineering/23-otel-genai-conventions/docs/en.md, phases/14-agent-engineering/24-agent-observability-platforms/docs/en.md, phases/17-infrastructure-and-production/13-llm-observability/docs/en.md, phases/13-tools-and-protocols/20-opentelemetry-genai/docs/en.md, projects/agent-trace-debugger/solution/main.ts, projects/agent-trace-debugger/README.md

| 症状 | 原因 | 修复 |
|---|---|---|
| trace 中有 PII 和密钥 | span 中捕获了完整 prompt | 内容存放在外部，span 上放引用 ID |
| 多供应商仪表盘出错 | 没有 `gen_ai.provider.name` | 在每个 LLM span 上设置它 |
| 孤立的工具 span | span 没有父链接 | 始终传播上下文 |
| 升级后属性被改名 | 没有选择稳定版 | 设置 `OTEL_SEMCONV_STABILITY_OPT_IN` |
| trace 中没有 MCP 服务器 | Stdio 不带 HTTP 头 | 在每个请求的 `_meta` 中放入 traceparent |
| 无法二分定位回归 | prompt 版本没有关联到 trace | 在 trace 上记录 prompt 版本 |
| `child outside parent` | 子区间超出父区间 | 导入前统一时钟 |

## 选择平台
type: comparison
from: phases/14-agent-engineering/24-agent-observability-platforms/docs/en.md, phases/17-infrastructure-and-production/13-llm-observability/docs/en.md

| 因素 | Langfuse | Phoenix | Opik |
|---|---|---|---|
| 许可证 | MIT | Elastic License 2.0 | Apache 2.0 |
| 最擅长 | Prompt 管理、会话 | RAG 相关性、漂移 | 优化、护栏 |
| Prompt 版本管理 | 有 | 无 | A/B 实验 |
| 免费额度 | 50K events/month | 自托管 | 自托管或云 |
| 适用场景 | 需要带 prompt 的一体化方案 | 深度 RAG 评估与漂移 | 自动化优化 |

## 问答
type: qa
from: phases/13-tools-and-protocols/20-opentelemetry-genai/docs/en.md, phases/14-agent-engineering/23-otel-genai-conventions/docs/en.md, phases/17-infrastructure-and-production/13-llm-observability/docs/en.md, phases/19-capstone-projects/11-llm-observability-dashboard/docs/en.md, phases/14-agent-engineering/24-agent-observability-platforms/docs/en.md

- **CLIENT 还是 INTERNAL？** CLIENT 跨越进程边界。INTERNAL 是 agent 循环和工具执行。
- **`invoke_agent` 用哪种 kind？** 远程 agent 服务用 CLIENT。进程内框架用 INTERNAL。
- **规模化时保留什么？** 100% 错误、100% 高成本、5% 成功。
- **什么时候漂移是真的？** PSI 高于 0.2 通常意味着有意义的漂移。
- **只做 tracing 够吗？** 不够。没有评估的 tracing 只是昂贵的日志。
- **哪些指标是直方图？** `gen_ai.client.token.usage`、`gen_ai.client.operation.duration`、`gen_ai.tool.execution.duration`。
