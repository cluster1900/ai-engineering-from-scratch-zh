# 返回合法的 JSON 和 tool call

> 结构化输出让模型生成合法的 JSON，其代价可以在你自己的 schema 上测量。

你的应用需要总能被解析的 JSON。读完本节后，你能请求结构化输出并检查它的代价。

## 请求一个 schema {#s-return-valid-json-and-tool-calls-ask-for-a-schema}

使用结构化输出时，vLLM 把每个下一个 token 限制在能让输出对你的 schema 保持合法的 token 中。模型无法生成破坏 schema 的文本。你在请求中要求它，而不是用服务器参数。

使用 OpenAI 客户端时，用 `response_format`：

```python
from openai import OpenAI

client = OpenAI(base_url="http://localhost:8000/v1", api_key="EMPTY")
schema = {
    "type": "object",
    "properties": {"city": {"type": "string"}, "days": {"type": "integer"}},
    "required": ["city", "days"],
}
reply = client.chat.completions.create(
    model="Qwen/Qwen3-8B",
    messages=[{"role": "user", "content": "Plan a trip to Lisbon. Answer in JSON."}],
    response_format={"type": "json_schema", "json_schema": {"name": "trip", "schema": schema}},
)
print(reply.choices[0].message.content)
```

对于其他限制，在 `extra_body` 中发送 `structured_outputs`。它接受 `json`、`json_object`、`regex`、`choice`、`grammar` 或 `structural_tag` 之一。0.12.0 版本移除了旧的 `guided_json` 和 `guided_*` 字段。使用它们的教程已经过时了。

## 了解服务器上运行了什么 {#s-return-valid-json-and-tool-calls-know-what-runs-on-the-server}

默认的后端设置是 `auto`，它会为请求选择一个后端。你也可以指定一个：`xgrammar`、`guidance`、`outlines` 或 `lm-format-enforcer`。服务器第一次见到你的 schema 时会把它编译成语法，并缓存结果。在每一步中，它构建一个允许 token 的掩码，并在采样前应用它。

由此带来两个代价：

- 使用新 schema 的第一个请求要等待编译。
- 每一步都要构建掩码，这会为每个 token 增加 CPU 时间。

未在我们的硬件上测量。我们没有在 L4 或 GB10 上测量编译或掩码的代价。

## 返回 tool call {#s-return-valid-json-and-tool-calls-return-tool-calls}

对于 tool call，用适合你的模型 tool 格式的解析器启动服务器：

```bash
vllm serve Qwen/Qwen3-8B --enable-auto-tool-choice --tool-call-parser hermes
```

解析器把模型的文本转换成响应中的 `tool_calls` 字段。选择与你的模型家族匹配的解析器。vLLM 文档列出了它们。

## 避开两个已知问题 {#s-return-valid-json-and-tool-calls-avoid-two-known-problems}

- **Speculative decoding。** schema 和 speculation 方法可能在下一个 token 上产生分歧。0.31 上的一个 issue 显示，某个模型在使用 MTP speculation 时出现了非法 JSON，这个 issue 现已关闭。在同时依赖两者之前，分别在开启和不开启 `--speculative-config` 时测试你的 schema。
- **推理模型。** 先思考再回答的模型需要 schema 只作用于回答部分。为你的模型设置推理解析器，让限制在思考结束后才开始。[推理模型页](#s-serve-reasoning-models)给出了这个参数。

## 检查结果 {#s-return-valid-json-and-tool-calls-check-the-result}

即使开启了结构化输出，也要在客户端解析每一个响应。统计解析失败的次数，以及在 JSON 闭合前就达到 `max_tokens` 的请求数。被 token 上限截断的响应不是合法的 JSON。

```takeaways
- 在请求中用 response_format 或 structured_outputs 请求 schema。
- 不要使用 guided_* 字段，它们已在 0.12.0 中移除。
- 在依赖 schema 之前，先用 speculative decoding 和推理模型测试它。
```

Sources: the vLLM source at v0.31.0 (vllm/config/structured_outputs.py, vllm/v1/structured_output/), vLLM documentation at v0.31.0 (docs/features/structured_outputs.md, docs/features/tool_calling.md), vLLM issue 60830.
