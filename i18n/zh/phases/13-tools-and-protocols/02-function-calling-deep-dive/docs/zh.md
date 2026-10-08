# 函数调用 深入解析  OpenAI,人类,双胞胎

> 两家边境供应商在2024年收到了同一个工具调用循环,然后在其他地方分开了.`tools`和 `tool_calls`△人类使用`tool_use`和 `tool_result`块──双子使用 `functionDeclarations`和唯一的ID相关性──本课将会有三者并排差异,让在一个提供商上交付的代码在移植到另一个提供商时不会坏掉──

**Type:** Build
**Languages:** Python (stdlib, schema translators)
**Prerequisites:** Phase 13 · 01（the tool interface）
**Time:** ~75 分钟

## 学习目标
- 说出OpenAI、人类和双胞胎函数调用有效载荷 之间三类形状差异
- 将一个工具声明 翻译成三个提供商格式,并预测严格模式限制 会在哪里不同.
- 在每个供应商中使用 `tool_choice`强制禁止或自动选择工具的呼叫.
- 了解每个供应商的硬度限制 (工具数量,方案深度,参数长度),以及违反限制时各自发出错误签名.

## 问题
函数调用请求的形状因供应商而异. 下面是2026生产堆中三个具体例子:

**OpenAI Chat Completions / Responses API.**你传入`tools: [{type: "function", function: {name, description, parameters, strict}}]`模型的反应 包含`choices[0].message.tool_calls: [{id, type: "function", function: {name, arguments}}]`在其中`arguments`是你必须解析的JSON字符串.`strict: true`) 通过限制解码强制遵守方案.

**Anthropic Messages API.**你传入`tools: [{name, description, input_schema}]`△反应 以`content: [{type: "text"}, {type: "tool_use", id, name, input}]`返回.`input`已被解析了,不是字符串.`user`信息包含`{type: "tool_result", tool_use_id, content}`区块

**Google Gemini API.**你传入`tools: [{functionDeclarations: [{name, description, parameters}]}]`(嵌套在`functionDeclarations`下) ⋅反应 以 `candidates[0].content.parts: [{functionCall: {name, args, id}}]`到了,其中`id`在双子座3 及以上版本中是唯一的,用于并行调用相关性.`{functionResponse: {name, id, response}}`,我知道.

一个团队在OpenAI上写了天气代理,只是为了管道,移植到人类,需要花两天,再移植到双胞胎,也需要一天.

本课构建一个翻译,将三种格式统一成一个法典工具声明,并在边缘做路由――第13阶段 · 17 会把同一模式泛化成LLM门户──

## 概念
### 共同结构

每个提供商都需要五种东西:

1. **Tool list.**每个工具的名称,描述和输入方案.
2. **Tool choice.**强制使用特定工具,禁止工具,或让模型决定.
3. **Call emission.**命名工具和参数的结构化输出――
4. **Call id.**将响应关联到正确的电话 ()
5. **Result injection.**一个消息或封锁,将结果 绑定回调.

### 个别的场比形状不同

| Aspect | OpenAI | Anthropic | Gemini |
|--------|--------|-----------|--------|
| Declaration envelope | `{type: "function", function: {...}}` | `{name, description, input_schema}` | `{functionDeclarations: [{...}]}` |
| Schema field | `parameters` | `input_schema` | `parameters` |
| Response container | assistant message 上的 `tool_calls[]` | type 为 `tool_use` 的 `content[]` | type 为 `functionCall` 的 `parts[]` |
| Arguments type | stringified JSON | parsed object | parsed object |
| Id format | `call_...`（OpenAI 生成） | `toolu_...`（Anthropic） | UUID（Gemini 3+） |
| Result block | role `tool`, `tool_call_id` | 带 `tool_result`, `tool_use_id` 的 `user` | 带匹配 `id` 的 `functionResponse` |
| Force-a-tool | `tool_choice: {type: "function", function: {name}}` | `tool_choice: {type: "tool", name}` | `tool_config: {function_calling_config: {mode: "ANY"}}` |
| Forbid tools | `tool_choice: "none"` | `tool_choice: {type: "none"}` | `mode: "NONE"` |
| Strict schema | `strict: true` | schema-is-schema（始终 enforce） | request level 的 `responseSchema` |

### 你实际上会遇到的限制

- **OpenAI.**每个请求 最多 128 个工具――方案深度 5――论文字符串 <= 8192字节――严格模式 要求没有`$ref`没有重叠的`oneOf`现在,我们要去.`anyOf`现在,我们要去.`allOf`每个房地产都在`required`在中.
- **Anthropic.**每个请求最多64个工具. 方案深度实际上没有上限,但实际上限制为10个.
- **Gemini.**每个请求最多 64 个函数──方案类型是OpenAPI 3.0子集──与JSON方案 2020-12 略有差异──自双子座3起,并行调用使用独特的ID──

### `tool_choice`行为

只有一个不同的名称.

- **Auto.**模型 选择工具 或文本──默认值──
- **Required / Any.**模型必须至少使用一个工具.
- **None.**模型不需要调用工具.

另外,每个提供商都有一个独特的模式:

- **OpenAI.**按名称 强制使用特定工具──
- **Anthropic.**按名称 强制使用特定工具;`disable_parallel_tool_use`标志区分单个对多个.
- **Gemini.** `mode: "VALIDATED"`让每个反应都通过了方案验证器,无论模型的意图如何.

### 并行通话

开放AI 的`parallel_tool_calls: true`发出多次电话,然后使用工具角色回复,每个电话都被运行.`tool_call_id`应应一个入口.`disable_parallel_tool_use: false`(截至Claude 3.5 的默认值) 启用多个. 双子座2 允许并行通话,但没有提供稳定的ID;双子座3 增加 UUID,因此,非订单响应可以干净地相关.

### 流媒体

三者都支持流媒体工具调用──线程格式 不同:

- **OpenAI.** `tool_calls[i].function.arguments`达尔塔的部分会增加到达.`finish_reason: "tool_calls"`,我知道.
- **Anthropic.**阻塞启动/阻塞 delta/阻塞停止事件──`input_json_delta`部分论点.
- **Gemini.** `streamFunctionCallArguments`发出带 发出带`functionCallId`它们是个模拟的部分,因此多个平行调用可以交错.

阶段13 · 03 会深入讲平行+流动重组――本课聚焦宣言 和单次调用形式――

### 错误和修复

不有效论证错误的表现也不同.

- **OpenAI (non-strict).**模型返回`arguments: "{bad json}"`您的JSON解析器失败,您输入错误信息并重新调用.
- **OpenAI (strict).**在解码期间发生验证;不有效的JSON 不可能出现,但可能出现`refusal`,我知道.
- **Anthropic.** `input`可能包含意想不到的字段;方案是建议的.需要服务器方面验证.
- **Gemini.**开启API 3.0 奇特:对象字段 上的 `enum`你需要自我验证.

### 翻译模式

你代码中的可нони工具声明看起来像这样的形式由你选择):

```python
Tool(
    name="get_weather",
    description="Use when ...",
    input_schema={"type": "object", "properties": {...}, "required": [...]},
    strict=True,
)
```

三小函数将它翻译成三种提供形式.`code/main.py`通过每个提供商的响应形状做回路. 无需网络,本课教授是形状,不是HTTP.

制作团队将把这个翻译员包进`AbstractToolset`它们是什么?`UniversalToolNode`长度图`BaseTool`通过"LlamaIndex" (LlamaIndex) 提供了"OpenAI"的 API.


```figure
function-call-args
```

## 使用它
`code/main.py`定义一个法典`Tool`数据类,以及三个翻译器,用来发出OpenAI、Anthropic 和 Gemini声明 JSON──然后它将每个形状的手工制作供应商响应解析为同一个可нони化呼叫对象,展示语义在表层下是相同的──运行它,并并排差三个声明──

需要观察的点:

- 三个声明区块只在包装和字段名称上不同.
- 三个响应区块的差异在于调用位置位置位`tool_calls`,我知道.`content[]`区块`parts[]`进入) 
- 一个`canonical_call()`函数从全部三种反应形 中提取 `{id, name, args}`,我知道.

## 交付它
本课产出发 `outputs/skill-provider-portability-audit.md`△给出一个面向某个供应商的功能调用集成,这种技能会产生可移植性审计:它取决于哪些供应商的限制,哪些领域需要更名,以及将其移植到其他供应商时会出现什么断裂.

## 练习
1. 运行`code/main.py`验证三个供应商声明JSON都序列化到一个底层`Tool`修改了经典工具,添加一个enum参数,并确认只有双子座翻译器需要处理OpenAPI奇怪.

2. 为了每个供应商 添加一个`ListToolsResponse`分析师从模型中`list_tools`或发现呼叫 后返回的内容中提取工具列表――OpenAI 原生没有这个项;记录这个不对称性――

3. 实现`tool_choice`转换:将法典`ToolChoice(mode="force", tool_name="x")`映射到三种提供商形状――然后映射`mode="any"`和 `mode="none"`△检查本课的差异表

4. 选择三个提供商中的一个,从头到尾阅读其函数调用指南――找出其方案规范中一个其他两个不支持的领域――候选项:OpenAI`strict`‧人类类`disable_parallel_tool_use`子`function_calling_config.allowed_function_names`,我知道.

5. 写一个测试向量:一个论点 违反声明的方案的工具调用――将它运行过每个提供商的验证器(01课中的 stdlib验证器可以作为代理),并记录触发了哪些错误――记录你在生产中会为了严格使用哪个提供商――

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Function calling | "Tool use" | 用于 structured tool-call emission 的 provider-level API |
| Tool declaration | "Tool spec" | Name + description + JSON Schema input payload |
| `tool_choice` | "Force / forbid" | Auto / required / none / specific-name modes |
| Strict mode | "Schema enforcement" | OpenAI flag，用于约束 decoding 以匹配 schema |
| `tool_use` block | "Anthropic's call shape" | 带 id、name、input 的 inline content block |
| `functionCall` part | "Gemini's call shape" | 包含 name、args 和 id 的 `parts[]` entry |
| Arguments-as-string | "Stringified JSON" | OpenAI 将 args 作为 JSON string 返回，而不是 object |
| Parallel tool calls | "Fan-out in one turn" | 一个 assistant message 中的多个 tool calls |
| Refusal | "Model declines" | strict-mode-only 的 refusal block，而不是 call |
| OpenAPI 3.0 subset | "Gemini schema quirk" | Gemini 使用一种类似 JSON-Schema 的 dialect，存在细微差异 |

## 延伸阅读
- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) 包含严格模式和并行调用的可信引用
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) `tool_use`和 `tool_result`区块语义
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling)平行调用,独特的ID和OpenAPI子集
- [Vertex AI — Function calling reference](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling)双子座的企业级表面
- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs)严格模式方案强制执行细节
