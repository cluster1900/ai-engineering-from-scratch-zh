# --grammar-backend 与结构化输出

> SGLang 把 JSON schema 或正则变成每一步 decode 的 token 掩码，并在批循环之外编译每份语法。

你的智能体让模型做一次工具调用，并用 `json.loads` 解析回复。多数回复能解析。少数缺了括号、带了尾注释，或有 schema 不允许的字段，智能体就重试。每次重试花一整次生成和一整次往返，延迟的慢尾现在由重试组成。

读完本节后，你能用 JSON schema、正则或 EBNF 语法约束输出。你也能解释掩码的代价、读语法队列，并决定生成之后还要检查什么。

## 显而易见的修法，以及它为何失败 {#s-structured-outputs-with-xgrammar-the-obvious-fix-and-why-it-fails}

显而易见的修法是生成后再校验，失败就重试。那样能用，也一直慢。它在你最在乎的情形里也会失败。温度为 0 时，同一条 prompt 的重试给出同一条坏回复。

**Constrained decoding：** 在采样器选 token 之前，去掉每一个会破坏语法的 token。输出于是满足后端强制的每条规则，那些规则就成了服务器的属性。

## SGLang 做什么 {#s-structured-outputs-with-xgrammar-what-sglang-does}

一条请求在采样参数里带一个约束：`json_schema`、`regex`、`ebnf` 或 `structural_tag`。OpenAI chat API 把 `response_format` 映射到同样的字段。`--grammar-backend` 选编译它的引擎。v0.5.22 的默认是 `xgrammar`，其他选择是 `outlines`、`llguidance` 和 `none`。

```figure
id: fig-4-8
kind: flow
title: one constrained request from arrival to sampling
claim: A schema compiles once in a thread pool while the request waits in the grammar queue, then masks the logits at every decode step.
caption: Read left to right. The cache key is the constraint type and its text. A cache hit skips the thread pool. From GrammarManager and ModelRunner._preprocess_logits at v0.5.22.
```

1. **Look up.** 语法管理器用约束类型和它的文本建键，例如 `("json", schema)`。该键的已编译语法立刻从缓存回来。
2. **Compile.** 未命中时，编译在线程池里开始并返回 future。请求进语法队列，而不是等待队列。
3. **Admit.** 每个调度器循环轮询这些 future。有张量或数据并行时，只有语法在每个 rank 都就绪才准入请求。任一 rank 编译失败就失败。无效语法被缓存成无效，所以下一条同 schema 的请求立刻失败。
4. **Mask.** 每一步语法填一份词表位掩码，模型运行器在采样前把它应用到 logits。有 overlap 调度器时，下一步的掩码在 GPU 跑当前步时建好。
5. **Advance.** 采样之后，语法接受选中的 token。有 speculative decoding 时，它回滚被拒的 draft token。

在 Apple silicon 上，MLX 运行时只在带 `--mlx-enable-sampling` 时应用语法掩码。没有那个旗标，每一步 decode 都取最高 logit，像 [第 4.6 节](#s-deterministic-inference-and-logprobs) 从帮助文本展示的那样。

**Grammar queue：** 语法仍在编译的请求列表。`/metrics` 把它的长度导出为 `sglang:num_grammar_queue_reqs`。

## Jump-forward 在 v0.5.22 未启用 {#s-structured-outputs-with-xgrammar-jump-forward-is-not-active-at-v0-5-22}

SGLang 论文描述了 jump-forward decoding。当语法只允许一种续写，例如固定文本 `{"name": "` 时，服务器不跑模型就写下去。v0.5.22 的语法类仍有 jump-forward 方法。对运行时的搜索在语法类之外找不到调用者。调度器不用它们，所以即便在固定文本里也预期每个 token 一次前向。我们是在代码里读到的，没有跑计时测试。

## 要量什么 {#s-structured-outputs-with-xgrammar-what-to-measure}

在你自己的 schema 上量三件事。第一，带新 schema 的第一条请求的首 token 时间，对比带同一 schema 的第二条。差值是编译时间。第二，你真实并发下有约束和无约束的逐 token 延迟。掩码每一步都花 CPU 时间。第三，负载下的语法队列长度。

Varad More 的现场报告 {{field Varad More 2026-04}} 在一块 A10G 上对 16 个从 2B 到 9B 的模型量了结构化生成。16 个里有 14 个 vLLM 更快。报告没有把编译时间和每 token 代价分开，所以把它当成要量的理由，不要当成判决。

## 我们在 GB10 上测到的 {#s-structured-outputs-with-xgrammar-what-we-measured-on-a-gb10}

我们在一块 NVIDIA GB10 上对 `Qwen/Qwen3-30B-A3B-Instruct-2507` 跑了一次小探测，用默认的 `xgrammar` 后端。探测问 "Describe one GPU for a model server as a JSON object." 五次，一次一条请求。schema 有四个必填字段、从 1 到 1024 的整数 `memory_gb`、厂商的 `enum`，以及不允许额外属性。

| Request | Constraint | Latency | Completion tokens | Valid |
|---|---|---|---|---|
| 1 | none | 3,943.9 ms | 128 | no schema |
| 2 | a new schema | 1,636.6 ms | 41 | yes |
| 3 | the same schema | 1,309.2 ms | 41 | yes |
| 4 | the same schema | 1,310.9 ms | 41 | yes |
| 5 | a second new schema | 1,291.1 ms | 41 | yes |

**我们测到** 一次运行，所以把表读成方向。每条受约束的回复都是恰好四个字段的合法 JSON。无约束的回复跑到 128 token 上限，并发明了自己的键，例如 `gpu_id` 和 `power_consumption`。

第一条受约束请求大约比重复的贵 330 ms。第二个新 schema 没有这种代价。我们的读法是，第一次代价属于启动后的第一份语法。编译一份小 schema 短得看不出来，相对 41 个 token 的 decode。

schema 固定了形状，没有固定事实。受约束的回复点名 "NVIDIA A100" 带 40 GB，无约束的给了它 "80 GB GDDR6"。语法检查句法，你的校验器仍检查含义。

## 我们的立场 {#s-structured-outputs-with-xgrammar-our-position}

约束每一个程序要解析的响应。掩码给每一步加活，重试则整条请求再来一遍。我们没有按步量掩码的代价。

不要信任语法后端会强制每个 JSON Schema 关键字。用一条试图打破它的请求，测试消费者依赖的每个关键字，例如 `minLength`、`pattern`、`minimum` 和 `enum`。在服务器后面为要紧的字段保留一个便宜的校验器。

每次部署后发一条受约束请求，这样第一个用户请求不用付语法后端的启动代价。在 GB10 上那条第一次请求付了大约 330 ms。我们的探测显示第二个新的小 schema 没有额外代价。

## 事故 {#s-structured-outputs-with-xgrammar-incidents}

**一条 schema 规则在没有错误的情况下被丢掉。** Issue #37707（2026-09-03）：用 xgrammar 时，一个字符串字段在同时还带 `pattern` 时接受了短于其 `minLength` 的值。同一报告说 outlines 丢掉了 `pattern` 和数值边界。本手册核验时该 issue 仍开着。

**推测下语法工作随输出长度增长。** Issue #38863（2026-09-10）：有 speculative decoding 时，主机建位掩码的 CPU 时间随输出长度增长。原因是一个回滚方法每次调用都拷贝一份调试列表。该 issue 作为性能报告仍开着。

```takeaways
- 对每一个程序要解析的响应使用 json_schema 或 response_format。
- 用一条设计来打破它的请求，测试你依赖的每个 JSON Schema 关键字。
- 部署后发一条受约束请求，好让用户不用付第一份语法的代价。
- 在负载下加新 schema 时，留意 sglang:num_grammar_queue_reqs。
```

Sources: capture/out/serve-help.txt, capture/gpu/out-gb10/structured.txt, capture/gpu/structured_probe.py, python/sglang/srt/constrained/grammar_manager.py (process_req_with_grammar, get_ready_grammar_requests), constrained/base_grammar_backend.py, constrained/xgrammar_backend.py, model_executor/model_runner.py (_preprocess_logits), sampling/sampling_params.py, arg_groups/serving_hook.py (handle_grammar_backend), arg_groups/choices.py (GRAMMAR_BACKEND_CHOICES), and observability/metrics_collector.py at v0.5.22; SGLang paper (arXiv 2312.07104); issues #37707 and #38863; field report by Varad More (2026-04-22).
