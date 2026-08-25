# Parallel Tool Calls 和带 Tools 的 Streaming

> 三个独立天气查询如果串行执行，就是三次往返。并行运行后，总耗时会降到最慢的单个调用。现在每个 frontier provider 都能在单个 turn 中发出多个 tool call。收益是真实的；管道细节很微妙。本课会讲清两部分：parallel fan-out 和 streamed-argument 重组，重点关注 id-correlation 陷阱。

**类型：** Build
**语言：** Python（stdlib，thread pool + streaming harness）
**前置要求：** Phase 13 · 02（function calling deep dive）
**时间：** 约 75 分钟

## 学习目标

- 解释为什么存在 `parallel_tool_calls: true`，以及什么时候应该禁用它。
- 在 parallel fan-out 期间，将 streamed argument chunks 关联到正确的 tool-call id。
- 在过早解析之前，把部分 `arguments` string 重组为完整 JSON。
- 运行一个三城市天气 benchmark，展示 sequential vs parallel latency。

## 问题

没有 parallel calls 时，一个 agent 回答 “what is the weather in Bengaluru, Tokyo, and Zurich” 会这样做：

```
user -> LLM
LLM -> call get_weather(Bengaluru)
host -> run executor, reply with result
LLM -> call get_weather(Tokyo)
host -> run executor, reply with result
LLM -> call get_weather(Zurich)
host -> run executor, reply with result
LLM -> final text answer
```

三次 LLM 往返，每次还要付出 executor latency。大约是理想 wall-clock time 的 4 倍。

使用 parallel calls：

```
user -> LLM
LLM -> call get_weather(Bengaluru); call get_weather(Tokyo); call get_weather(Zurich)
host -> run all three executors concurrently, reply with three results
LLM -> final text answer
```

一次 LLM 往返。Executor 时间是三者最大值，而不是总和。在 OpenAI、Anthropic 和 Gemini 上的生产 benchmark 显示，对于 fan-out workloads，wall-clock 可减少 60% 到 70%。

代价是 correlation complexity。当三个调用乱序完成时，你的结果必须携带匹配的 `tool_call_id`，让 model 能把它们对齐。当结果以 stream 形式返回时，你必须先把部分 argument fragments 组装成完整 JSON，再执行。Gemini 3 加入 unique ids，部分原因就是解决一个真实问题：对同一个 tool 的两个 parallel calls 无法区分。

## 概念

### 启用 parallel

- **OpenAI。** `parallel_tool_calls: true` 默认开启。设置为 `false` 可强制 serial。
- **Anthropic。** 通过 `disable_parallel_tool_use: false` 实现 parallel（Claude 3.5 及以上默认开启）。设置为 `true` 可 serial。
- **Gemini。** 始终具备 parallel 能力；`tool_config.function_calling_config.mode = "AUTO"` 让 model 决定。

当 tools 有顺序依赖（`create_file` 然后 `write_file`）、某个调用的输出会影响另一个调用的输入，或者 rate limiter 无法承受 fan-out 时，禁用 parallel。

### Id correlation

model 发出的每个调用都有一个 `id`。host 返回的每个结果都必须包含同一个 id。没有这个 id，结果就会含糊不清。

- **OpenAI。** 每条 tool-role message 上的 `tool_call_id`。
- **Anthropic。** 每个 `tool_result` block 上的 `tool_use_id`。
- **Gemini。** 每个 `functionResponse` 上的 `id`（Gemini 3 及以上；Gemini 2 按 name 匹配，这会在同名 parallel calls 时出错）。

### 并发运行 calls

host 会在自己的 thread、coroutine 或 remote worker 上运行每个调用的 executor。最简单的 harness 使用 thread pool；生产环境使用 asyncio 配合 `asyncio.gather` 或 structured concurrency。完成顺序不可预测，id 才是标识符。

一个常见 bug：按 call-list 顺序回复结果，而不是按完成顺序回复。这通常能工作，因为 model 只关心 `tool_call_id`，但如果某个结果丢失或重复，乱序提交会让调试更困难。优先按完成顺序回复，并显式带上 ids。

### Streaming tool calls

当 model 以 stream 形式输出时，`arguments` 会分片到达。三个 parallel calls 的三条 chunk stream 会在线路上交错。你需要为每个 id 准备一个 accumulator。

按 provider 的结构：

- **OpenAI。** 每个 chunk 是 `choices[0].delta.tool_calls[i].function.arguments`（partial string）。chunk 携带 `index`（call list 中的位置）。你按 index 累积，在 `id` 首次出现时读取它，并在 `finish_reason = "tool_calls"` 时解析 JSON。
- **Anthropic。** Stream events 是 `message_start`，然后每个 block 一个 `content_block_start`，类型为 `tool_use`（包含 id、name、空 input）。`content_block_delta` events 携带 `input_json_delta` chunks。`content_block_stop` 关闭每个 block。
- **Gemini。** `streamFunctionCallArguments`（Gemini 3 及以上）发出带 `functionCallId` 的 chunks，因此 calls 可以干净地交错。Gemini 3 之前，streaming 每次返回一个完整 call。

### Partial JSON 和 parse-early 陷阱

在 `arguments` 完整之前不能解析。像 `{"city": "Beng` 这样的 partial JSON 不是有效 JSON，会抛错。正确的门控点是 provider 的 end-of-call 信号：OpenAI 的 `finish_reason = "tool_calls"`、Anthropic 的 `content_block_stop`，或 Gemini 的 stream-end event。只有到那时才尝试 `json.loads`。更健壮的做法是使用 incremental JSON parser，在结构完成时产出 events；OpenAI 的 streaming guide 推荐这种做法，用于展示实时 “thinking” indicator 的 UX。Brace-counting 作为完整性测试并不可靠（quoted strings 或 escaped content 里的 braces 会导致 false positives），只能作为非正式 debug heuristic。

### Out-of-order completion

```
call_A: fast API, returns first
call_B: slow API, returns second
call_C: median API, returns third
```

host reply 仍然必须引用 ids：

```
[{role: "tool", tool_call_id: "call_A", content: ...},
 {role: "tool", tool_call_id: "call_B", content: ...},
 {role: "tool", tool_call_id: "call_C", content: ...}]
```

在 OpenAI 或 Anthropic 上，reply 中的顺序不影响正确性。Gemini 只要 ids 匹配，就接受任意顺序。

### Benchmark：sequential vs parallel

`code/main.py` 中的 harness 模拟三个 executor，latency 分别为 400、600 和 800 ms。Sequential 运行总共需要 1800 ms。Parallel 运行需要 max(400, 600, 800) = 800 ms。差异是常量，而不是比例，所以 savings 会随着 tool count 增长。

真实世界注意事项：parallel calls 会给下游 APIs 增加压力。对 rate-limited service 做 10 路 fan-out 会失败。Phase 13 · 17 会覆盖 gateway-level backpressure；retry semantics 计划放在未来阶段。

### Streaming fan-out 的 wall-clock

如果 model 本身以 stream 形式输出，你可以在某个 call 的 arguments 完整后立即开始执行，而不是等所有 calls 都 finalize。这是 OpenAI 记录过的一种优化，但并非所有 SDK 都暴露。本课的 harness 会这么做：只要模拟 stream 产出完整 argument object，host 就会启动那个 call。

```figure
tp-parallel-fanout
```

## 使用它

`code/main.py` 有两部分。第一部分使用 `concurrent.futures.ThreadPoolExecutor`，顺序和并行运行三个模拟 weather calls，并打印 wall-clock time。第二部分回放一个假的 streaming response，也就是在同一条 stream 上交错的三个 parallel calls 的 `arguments` chunks，并用 `StreamAccumulator` 按 id 重组。没有 LLM，没有网络，只有重组逻辑。

关注点：

- sequential timer 达到 1.8 秒。parallel timer 在相同 fake latencies 下达到 0.8 秒。
- accumulator 通过按 id buffering，并且只在每个 call 的 JSON 完整时解析，处理乱序到达的 chunks。
- executor 在某个 id 的 arguments finalize 后立即启动，而不是等所有 streams 结束。

## 交付它

本课会产出 `outputs/skill-parallel-call-safety-check.md`。给定一个 tool registry，该 skill 会审计哪些 tools 可以安全 parallelize，哪些有 ordering dependencies，哪些会压垮下游 rate limits，并返回一个带有 per-tool `parallel_safe` flags 的修订 registry。

## 练习

1. 运行 `code/main.py` 并改变模拟 latencies。确认 parallel-to-sequential ratio 近似为 `max/sum`（真实运行会因 thread scheduling、serialization 和 harness overhead 而略微偏离理想值）。在什么 latency distribution 下 parallel 不再重要？

2. 扩展 accumulator，处理 “call was cancelled mid-stream” 情况：丢弃它的 buffer 并发出一个 `cancelled` event。哪个 provider 明确记录了这种情况？检查 Anthropic 的 `content_block_stop` 语义和 OpenAI 的 `finish_reason: "length"` 行为。

3. 用 `asyncio.gather` 替换 thread pool。对两者做 benchmark。你应该能看到 async 有小幅收益，因为 context-switch cost 更低，但前提是 executors 做真实 I/O。

4. 选择两个不应 parallelize 的 tools（例如 `create_file` 然后 `write_file`）。向 registry 添加一个 `ordering_dependency` graph，并基于该 graph 对 parallel fan-out 做 gate。这是 dependency-aware scheduling 的最小机制，未来的 agent-engineering phase 会将其形式化。

5. 阅读 OpenAI 的 parallel-function-calling section 和 Anthropic 的 `disable_parallel_tool_use` docs。找出 Anthropic 建议禁用 parallelism 的一个真实世界 tool type。（提示：对同一资源的 consequential mutations。）

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Parallel tool calls | “一个 turn 里的 fan-out” | Model 在单个 assistant message 中发出多个 tool calls |
| `parallel_tool_calls` | “OpenAI 的 flag” | 启用或禁用 multi-call emission |
| `disable_parallel_tool_use` | “Anthropic 的反向开关” | Opt-out flag；默认启用 parallel |
| Tool call id | “Correlation handle” | 每次调用的标识符，result message 必须原样回显 |
| Accumulator | “Stream buffer” | 用于 partial `arguments` chunks 的 per-id string buffer |
| Out-of-order completion | “最快的先返回” | Parallel calls 以不可预测的顺序完成；ids 是粘合剂 |
| Dependency graph | “Ordering constraints” | 某些 tools 的输出会进入其他 tools 的输入；不能 parallelize |
| Parse-early trap | “JSON.parse 炸了” | 尝试解析不完整的 `arguments` string |
| `streamFunctionCallArguments` | “Gemini 3 feature” | 带有每次调用 unique id 的 streamed argument chunks |
| Completion-order reply | “不要等全部完成” | 结果一到就回复，并按 id 标记 |

## 延伸阅读

- [OpenAI — Parallel function calling](https://platform.openai.com/docs/guides/function-calling#parallel-function-calling) — 默认行为和 opt-out flag
- [Anthropic — Tool use: implementing tool use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implementing-tool-use) — `disable_parallel_tool_use` 和 result batching
- [Google — Gemini function calling parallel section](https://ai.google.dev/gemini-api/docs/function-calling) — 来自 Gemini 3 的 id-correlated parallel calls
- [OpenAI — Streaming responses with tools](https://platform.openai.com/docs/api-reference/responses-streaming) — OpenAI streams 的 chunked argument reassembly
- [Anthropic — Streaming messages](https://docs.anthropic.com/en/api/messages-streaming) — 带 `input_json_delta` 的 `content_block_delta`
