# 并行工具 电话和带工具 的流媒体

> 三独立天气查询 如果串行执行,就是三次往返.并行运行后,总耗时将降至最慢的单个调用.现在每个边境提供商都能在单个轮到发出多个工具调用.收益是真实的.管道细节很微妙.本课程讲述两个部分:平行风扇和流媒体论点 重组,重点关注 id-相关陷.

**类型：**建立
**语言：**鱼鱼,鱼鱼,鱼鱼,鱼鱼
**前置要求：**阶段13 · 02(调用深度潜水的功能)
**时间：**约75分钟

## 学习目标

- 解释为什么存在`parallel_tool_calls: true`什么时候应该禁用它?
- 在平行风扇中,将流动论点块关联到正确的工具调用ID.
- 在过早解析之前,把部分`arguments`字符串重组为完整JSON。
- 运行一个三城市天气基准,显示连续与并行延迟.

## 问题

没有平行电话 时,一个代理 回答 在孟加拉,东京和苏黎世有什么天气

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

升的时间是4倍.

使用并行调用:

```
user -> LLM
LLM -> call get_weather(Bengaluru); call get_weather(Tokyo); call get_weather(Zurich)
host -> run all three executors concurrently, reply with three results
LLM -> final text answer
```

在OpenAI、Anthropic 和 Gemini 上的生产基准显示,对于风扇式工作负载,墙钟可减少60%至70%──

代价是相关性复杂性. 当三个调用乱序完成时,你的结果必须携带匹配的结果.`tool_call_id`让模型能够把它们放在一起. 当结果以流式形式返回时,你必须先把部分参数片段组装成完整的JSON,再执行.

## 概念

### 启用并行

- **OpenAI。** `parallel_tool_calls: true`默认开启.`false`强制连载.
- **Anthropic。**通过`disable_parallel_tool_use: false`实现并行 (→ 及以上默认开启) 设置为`true`非常有趣.
- **Gemini。**始终具有平行能力;`tool_config.function_calling_config.mode = "AUTO"`让模型决定.

当工具有序依赖`create_file`然后`write_file`) 、某种调用输入会影响另一个调用输入,或者率限制器不能承受风扇式的,禁用并行式.

### 相关性

模型中每一个调用都有一个调用`id`◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎

- **OpenAI。**每条工具角色信息 上的`tool_call_id`,我知道.
- **Anthropic。**每个`tool_result`区块上`tool_use_id`,我知道.
- **Gemini。**每个`functionResponse`上的`id`(双子三及以上;双子二按名称匹配,这会在同名的并行调用中出错)

### 并发运行电话

东方会在自己的线程、流程或远程工作者 上运行每个调用执行器──最简单的使用线程池;生产环境使用异步配合`asyncio.gather`完成顺序不可预测,id 才是标识符.

一个常见错误:按呼叫单 顺序回复结果,而不是按完成顺序回复.`tool_call_id`但是如果某个结果丢失或重复,乱序提交会使调试更困难――优先按完成顺序回复,并显然带上IDs――

### 流媒体工具的呼叫

当模型以流式输出时,`arguments`会议分片到达. 三条平行电话的三条零件流会在线上交错.

按供应商的结构:

- **OpenAI。**每个小块都是`choices[0].delta.tool_calls[i].function.arguments`部分字符串:`index`根据索引 累积,在 `id`首次出现时读取它,并`finish_reason = "tool_calls"`时解析JSON──
- **Anthropic。**流动事件是`message_start`然后每个街区都有一块.`content_block_start`类型为`tool_use`(包含 id、name、空输入)`content_block_delta`事件 携带 `input_json_delta`子,子.`content_block_stop`关闭每一个街区.
- **Gemini。** `streamFunctionCallArguments`发出带 发出带 发出带`functionCallId`由于这些问题,我们可以在线电话发送.

### 部分JSON和解析早期陷

在`arguments`完整之前不能解析.`{"city": "Beng`这种部分JSON 不是有效的JSON,会抛错.`finish_reason = "tool_calls"`类的`content_block_stop`只有在那时才尝试`json.loads`△更健壮的做法是使用增量JSON解析器,在结构完成时产出事件;OpenAI的流媒体指南推这种做法,用于展示实时的思考指标的UX──数数作为完整性测试并不可靠引列或逃逸内容中的数会导致虚假积极),只能作为非正式的调试数──

### 订单外完成

```
call_A: fast API, returns first
call_B: slow API, returns second
call_C: median API, returns third
```

仍然必须引用 id:

```
[{role: "tool", tool_call_id: "call_A", content: ...},
 {role: "tool", tool_call_id: "call_B", content: ...},
 {role: "tool", tool_call_id: "call_C", content: ...}]
```

在OpenAI或人类上,回答中的顺序不会影响正确性.

### 基准:序列与平行

`code/main.py`中的运行需要最大的400,600,800),=800 ms;;差异是常量,而不是比例,所以节省会随着工具数量增长.

真实世界注意事项:并行通话 会给下游API 增加压力――对限速服务做10路风扇-out 会失败――13期 ·17期 会覆盖门户层次压力;退缩语义 计划放在未来阶段――

### 流动风扇的墙钟

如果模型本人以流式形式输出,你可以在某个调用后立即开始执行某个调用的参数,而不是等所有调用都完成.这是OpenAI记录的优化,但并不是所有的SDK都暴露.本课程的利用会这样做:只要模拟流式生成完整的参数对象,主机就会启动那个调用.


```figure
tp-parallel-fanout
```

## 使用它

`code/main.py`有两个部分.`concurrent.futures.ThreadPoolExecutor`顺序和并行运行三个模拟的天气调用,并打印墙钟时间.`arguments`子,并用`StreamAccumulator`按 id 重组──没有LLM,没有网络,只有重组逻辑──

关注点:

- 连续计时器 达到1.8秒.
- 通过按 id 缓冲,并且只在每个调用的 JSON 完整时解析,处理乱序到达的块──
- 执行器在某个 id 的参数完成后立即启动,而不是等所有流程结束.

## 交付它

本课会产出 `outputs/skill-parallel-call-safety-check.md`△给一个工具注册表,该技能 会审计哪些工具可以安全相对,哪些有订单依赖,哪些会压下游率限制,并返回一个带有每工具`parallel_safe`旗的修订登记簿──

## 练习

1. 运行`code/main.py`并改变模拟延迟――确认平行到序列比近似为`max/sum`(真实运行会因线程安排,串行和带上层成本而略偏离理想值)

2. 扩展蓄积器,处理 通话被取消中流 情况:丢弃缓冲器并发出一个`cancelled`哪个提供商确实记录了这种情况?`content_block_stop`语义和开放AI 的`finish_reason: "length"`行为

3. 用`asyncio.gather`换线程池――对两者做基准――你应该看到异步有小幅收益,因为语境切换成本更低,但前提是执行者做真实I/O――

4. 选择两个不应对并行的工具 (例如:`create_file`然后`write_file`加入一个`ordering_dependency`这是一个依赖意识的规划的最小机制,未来的代理工程阶段将会其形式化.

5. 阅读OpenAI的并行函数调用部分 和人类的`disable_parallel_tool_use`建议禁用平行主义的一个真实世界工具类型――

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

- [OpenAI — Parallel function calling](https://platform.openai.com/docs/guides/function-calling#parallel-function-calling) 默认行为和拒绝签署
- [Anthropic — Tool use: implementing tool use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implementing-tool-use) `disable_parallel_tool_use`和结果批量
- [Google — Gemini function calling parallel section](https://ai.google.dev/gemini-api/docs/function-calling)来自双子座3的ID相关的并行电话
- [OpenAI — Streaming responses with tools](https://platform.openai.com/docs/api-reference/responses-streaming) OpenAI流的分断论点重组
- [Anthropic — Streaming messages](https://docs.anthropic.com/en/api/messages-streaming)带`input_json_delta`的`content_block_delta`
