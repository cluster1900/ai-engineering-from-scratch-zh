# 服务推理模型

> 推理模型在回答之前先写出它的思考，而推理解析器让思考不混进回答文本。

你的 Qwen3 服务器在你期待简短回答的地方返回了一大段思考。读完本节后，你能把思考与回答分开、关闭思考，并限制它的长度。

我们没有为本手册测量推理模型的速度。我们在一块 L4 上用 Qwen3-8B-FP8 检查了本页的字段和开关，包括 `reasoning` 字段、按请求和按服务器设置的 `enable_thinking`、思考预算，以及流中的顺序。其余内容来自 vLLM 文档和 0.31.0 的源码。

## 了解模型写出了什么 {#s-serve-reasoning-models-know-what-the-model-writes}

**推理模型：** 先写出推理步骤（放在 `<think>` 和 `</think>` 这样的标记之间），再写最终回答的模型。Qwen3、DeepSeek-R1 和 QwQ 都是例子。Qwen3 默认会思考。

没有推理解析器时，vLLM 把整个输出放在 `content` 中返回。回答就会以思考开头。思考也计入 `max_tokens`，所以较短的上限可能在回答开始之前就结束了请求。

## 开启解析器 {#s-serve-reasoning-models-turn-on-the-parser}

用适合你的模型家族的解析器启动服务器。对于 Qwen3，解析器是 `qwen3`：

```bash
vllm serve Qwen/Qwen3-8B --reasoning-parser qwen3 2>&1 | tee server.log
```

默认没有解析器。vLLM 不会根据模型名选择解析器。vLLM 文档列出了每个支持的家族对应的解析器名，例如 DeepSeek-R1 和 QwQ 用 `deepseek_r1`。

使用解析器时，聊天响应有两个文本字段：

| 字段 | 内容 |
|---|---|
| `choices[0].message.reasoning` | 思考内容，不含标记 |
| `choices[0].message.content` | 最终回答 |

在流中，每个 chunk 把新文本放在 `delta.reasoning` 或 `delta.content` 中。旧版本把这个字段叫作 `reasoning_content`。在 0.31.0 中响应字段是 `reasoning`，所以要更新仍在读旧名字的客户端。

## 关闭或限制思考 {#s-serve-reasoning-models-turn-the-thinking-off-or-limit-it}

你有三种控制方式：

- **针对单个请求。** 在请求体中发送 `"chat_template_kwargs": {"enable_thinking": false}`。使用 OpenAI 客户端时，把它放在 `extra_body` 中。
- **针对整个服务器。** 用 `--default-chat-template-kwargs '{"enable_thinking": false}'` 启动服务器。请求仍然可以用它自己的 `chat_template_kwargs` 重新开启思考。
- **给思考设预算。** 在请求中发送 `thinking_token_budget`。当思考达到这么多 token 时，vLLM 会让模型结束思考并开始回答。解析器必须开启。

`enable_thinking` 这个名字来自 Qwen3 的 chat template。其他家族用其他名字，所以请阅读你的模型的 chat template。

## 了解 JSON 和 tool 有哪些变化 {#s-serve-reasoning-models-know-what-changes-for-json-and-tools}

开启推理解析器后，结构化输出只作用于思考结束之后的回答。思考本身是自由文本。Qwen3 解析器也支持 tool call，所以一个请求可以同时返回 `reasoning` 和 `tool_calls`。对于 tool call，还要用 `--enable-auto-tool-choice` 和一个 tool call 解析器启动服务器，例如 Qwen3 用 `--tool-call-parser hermes`。[JSON 页](#s-return-valid-json-and-tool-calls)说明了如何请求 schema。

给带思考的请求设置较大的 `max_tokens`。如果上限在思考中途结束了请求，`content` 为空，`finish_reason` 为 `length`。被上限截断的响应不是合法的 JSON。

## 检查配置 {#s-serve-reasoning-models-check-the-setup}

发送一个开启思考的请求和一个关闭思考的请求：

```bash
curl -s http://localhost:8000/v1/chat/completions -H "Content-Type: application/json" \
  -d '{"model": "Qwen/Qwen3-8B", "messages": [{"role": "user", "content": "Is 91 a prime number?"}], "max_tokens": 2048}'
```

第一个回复在 `reasoning` 和 `content` 中都有文本。在请求体中加上 `"chat_template_kwargs": {"enable_thinking": false}` 再发送一次。第二个回复的 `reasoning` 字段为空或不存在，`content` 很短。

```takeaways
- 用 --reasoning-parser 启动推理模型，让思考离开回答文本。
- 从 content 读回答，从 reasoning 读思考。
- 用 enable_thinking 关闭思考，或用 thinking_token_budget 限制它。
```

Sources: vLLM documentation at v0.31.0 (docs/features/reasoning_outputs.md, docs/features/structured_outputs.md), the vLLM source at v0.31.0 (vllm/reasoning/, vllm/config/structured_outputs.py, vllm/config/reasoning.py, vllm/entrypoints/launchers/cli_args.py, vllm/entrypoints/openai/chat_completion/protocol.py, vllm/sampling_params.py), capture/gpu/out-l4/livecheck-2026-10-22.txt.
