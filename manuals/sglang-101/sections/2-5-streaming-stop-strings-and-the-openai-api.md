# 流式、stop string 与 OpenAI API

> SGLang 在调度器里检查停止条件，在 detokenizer 里拼出文本，它的原生 `/generate` 端点报告 OpenAI 格式省掉的计时与缓存数据。

你把回复流到聊天窗口，stop string 前面的最后一个词却晚到。或者 speculative decoding 开着时，stop string 本身漏进了文本。或者客户端根本不显示 `cached_tokens`，你无法判断 prompt 有没有打中缓存。这三件事都是关于文本在哪里生成、谁报告什么的决定。

读完本节后，你能在原生 `/generate` 端点和 OpenAI 端点之间做选择。你能读懂原生响应里的每一项计时字段，并解释为什么流式文本有时会等。

## 一台服务器上的两套 API {#s-streaming-stop-strings-and-the-openai-api-two-apis-on-one-server}

**原生 API：** SGLang 自己的端点，主要是 `POST /generate`。它接受文本或 token id 以及 `sampling_params`，并返回带 SGLang 自有数据的 `meta_info` 对象。

**OpenAI API：** `/v1/chat/completions`、`/v1/completions` 和 `/v1/models` 端点，格式是 OpenAI 客户端期待的那种。服务器在 tokenize 之前先套 chat template。

两个端点都建成同一个内部请求，并穿过 [第 2.1 节](#s-sglang-serve-and-the-three-processes) 里的那三个进程。差别在于回来的是什么。

## 原生响应告诉你什么 {#s-streaming-stop-strings-and-the-openai-api-what-the-native-response-tells-you}

我们的 capture kit 发一次原生请求，temperature 0，要 12 个输出 token。

```listing
title: one native /generate response
source: capture/out/generate.txt
lang: json
note: The output_ids list and the weight_versions list are cut.
---
{
  "text": " Paris, and the capital of Germany is Berlin. The capital",
  …
  "meta_info": {
    "id": "e272e3ffc4064bfeaa0223b86408e107",
    "finish_reason": {
      "type": "length",
      "length": 12
    },
    "prompt_tokens": 5,
    …
    "num_retractions": 0,
    …
    "queue_time": 0.0002437499351799488,
    "reasoning_tokens": 0,
    "completion_tokens": 12,
    "cached_tokens": 2,
    …
    "cached_tokens_details": {
      "device": 2,
      "host": 0
    },
    "dp_rank": null,
    "e2e_latency": 0.9496850408613682,
    …
    "first_token_latency": 0.8885334208607674,
    …
    "decode_throughput": 179.8807619469758,
    …
  }
}
```

每个字段都回答你在生产里会问的一个问题：

- `finish_reason` 说明为什么停下：这里是 `length`，因为请求要了 12 个 token，也拿到了 12 个。
- `queue_time` 是 0.24 ms，所以请求没有等。负载上来时，这个数字会在请求在队列里等待时变大。
- `first_token_latency` 是 889 ms，`e2e_latency` 是 950 ms。冷服务器上，首 token 占了大部分时间。
- `num_retractions` 是 0。[第 2.3 节](#s-admission-and-retraction) 解释非零值要付什么代价。
- `cached_tokens` 是 5 个 prompt token 里的 2 个，全在设备上，没有来自主机内存的。

我们 kit 第一条请求上的两个缓存 token 是个小谜题，答案干净。接受流量之前，服务器用 prompt `The capital city of France is` 做 warm-up {{code}}。我们的 prompt 是 `The capital of France is`。前两个 token 在 radix tree 里对上了 warm-up。缓存不在乎是哪个用户发来的前缀。

## OpenAI 响应告诉你什么 {#s-streaming-stop-strings-and-the-openai-api-what-the-openai-response-tells-you}

```listing
title: the OpenAI chat response
source: capture/out/generate.txt
lang: json
note: The id, the created time, and the metadata block are cut.
---
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Ardens",
        "reasoning_content": null
      },
      "logprobs": null,
      "finish_reason": "stop",
      "matched_stop": 151645
    }
  ],
  "usage": {
    "prompt_tokens": 21,
    "total_tokens": 25,
    "completion_tokens": 4,
    "prompt_tokens_details": {
      "cached_tokens": 0
    },
    "reasoning_tokens": 0
  },
```

我们要求用一个词说出一颗行星。4-bit 的 0.6B 模型回答 "Ardens"，那不是行星。用小模型评判服务引擎时把这点记着。引擎做完了它的活：在 token 151645（end-of-turn token）停下，并报告了 `matched_stop`。

`cached_tokens` 字段之所以在，只因为我们的服务器带着 `--enable-cache-report` 跑。没有这个旗标，SGLang 会从 OpenAI usage 里省略缓存细节，即便它为每条请求都算过 {{code}}。原生 `meta_info` 不论怎样都报告 `cached_tokens`。

给 Mac 读者的一条说明。在 v0.5.22 的 MLX 上，除非你传 `--mlx-enable-sampling`，否则 decode 是贪心的，因此 `temperature`、grammar mask 和输出 logprobs 在那里不起作用。`sglang serve` 的帮助文本这么说。我们的 kit 用 temperature 0，所以输出两种方式都一样。[第 4.6 节](#s-deterministic-inference-and-logprobs) 覆盖 GPU 上的采样与 logprobs。

## Stop string 在哪里检查 {#s-streaming-stop-strings-and-the-openai-api-where-stop-strings-are-checked}

**停止条件：** 结束一条请求的规则。它可以是 stop token、stop string、正则、`max_new_tokens` 上限、中止，或 grammar 结束。

SGLang 在调度器里、每一步之后、按固定顺序检查停止条件 {{code}}。Stop string 的检查排在 end-of-sequence token 之前。代码注释给出了原因。Speculative decoding 可以在一步里接受多个 token。按 token 检查只会裁掉最后一个 token，stop string 的其余部分会漏进输出。Detokenizer 只从输出里裁掉匹配到的 stop 文本。

```figure
id: fig-2-5
kind: sequence
title: one streamed request with a stop string
claim: The scheduler decides when a request stops, the detokenizer turns ids into text, and the output streamer holds back text that could start a stop string.
caption: Read top to bottom. Blue lifelines are SGLang processes, the olive lifeline is the client, dotted indigo arrows are streamed chunks. Behaviour from schedule_batch.py, output_streamer.py, and detokenizer_manager.py at v0.5.22.
```

## 为什么流式文本会等 {#s-streaming-stop-strings-and-the-openai-api-why-streamed-text-waits}

有两条规则会推迟一块 {{code}}：

- **不完整字符。** Detokenizer 用每请求两个偏移做增量解码。如果新文本以不完整的 UTF-8 字符结尾，它会等下一个 token 再发送任何东西。
- **可能的 stop string。** 如果文本尾巴可能是 stop string 的开头，output streamer 会把它扣住。如果后续 token 补全了 stop string，那段文本永远不会出现。如果没有，扣住的文本会和下一块一起出去。

在默认的 `--stream-interval 1` 下，SGLang 每一步之后都流式发送。非流式请求仍然每 50 个 token（`SGLANG_FORCE_STREAM_INTERVAL`）在服务器内部发送一次进度，好让 TokenizerManager 能跟踪它 {{code}}。

## 一起事故：永远不动的 detokenizer {#s-streaming-stop-strings-and-the-openai-api-an-incident-the-detokenizer-that-never-moved}

当 token 永远补不成一个字符时，不完整字符规则有代价 {{issue #34740}}。文本以替换字符 U+FFFD 结尾时，detokenizer 就在等。永远补不成字符的字节 token 永远推不进偏移。于是每一步都重新解码整段尾巴，工作量随长度平方增长。报告是在一个把 id 100 填满的测试设置里发现的，那个 id 在 DeepSeek-V4-Pro 上解成 U+FFFD。我们核对时 issue 仍开着。

## 我们的立场 {#s-streaming-stop-strings-and-the-openai-api-our-position}

调试、测量或自建客户端时，用原生 `/generate` 端点。它的 `meta_info` 告诉你每条请求的排队时间、首 token 延迟、缓存命中和收回。OpenAI 格式大多没有这些位置。

已经讲那种格式的应用，用 OpenAI 端点。每台服务器都用 `--enable-cache-report` 启动，好让那些客户端也能看见缓存命中。我们没有测过代价，而且 [第 3 部分](#s-prefix-friendly-prompts) 会展示这个数字值多少。

```takeaways
- 用 /generate 调试和测量，并读它的 meta_info 字段。
- 用 --enable-cache-report 启动服务器，好让 OpenAI 客户端看见 cached_tokens。
- 预期当尾巴可能是 stop string 开头时，流式文本会等。
- 小模型答错时，把引擎和模型分开评判。
```

Sources: python/sglang/srt/entrypoints/http_server.py (warm-up prompt, /generate), python/sglang/srt/entrypoints/openai/serving_chat.py (enable_cache_report), python/sglang/srt/managers/schedule_batch.py (update_finish_state, check_match_stop_str_prefix), python/sglang/srt/managers/scheduler_components/output_streamer.py, python/sglang/srt/managers/detokenizer_manager.py, python/sglang/srt/environ.py (SGLANG_FORCE_STREAM_INTERVAL), python/sglang/srt/arg_groups/fields/serving.py at v0.5.22; capture/out/generate.txt and capture/one_request.py; capture/out/serve-help.txt for --mlx-enable-sampling; issue https://github.com/sgl-project/sglang/issues/34740.
