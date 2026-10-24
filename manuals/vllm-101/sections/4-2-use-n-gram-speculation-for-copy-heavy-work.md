# 对大量复制的工作使用 n-gram 投机解码

> n-gram 投机解码不需要 draft 模型，当回答在复制 prompt 时有收益，但它会关闭异步调度。

你的用户发来文档并要求修改。读完本节后，你能判断什么时候 n-gram 投机解码胜过 draft 模型。

**我们的结果：** 在我们的 L4 上，用随机 prompt、128 token 输出时，n-gram 把一个用户的每 token 时间从 242 ms 降到 77 ms。

## 打开它 {#s-use-n-gram-speculation-for-copy-heavy-work-turn-it-on}

n-gram 投机解码根据请求中已有的文本猜测接下来的 token。它取输出的最后几个 token，在请求的前文里找到相同的 token。然后它提议在那之后出现过的 token。接着目标模型在一次前向中检查这些猜测，[投机解码页](#s-how-speculative-decoding-checks-drafts)解释了这一点。

它不需要 draft 模型，所以不会为权重多占 GPU 内存。用一个投机配置启动服务器：

```bash
vllm serve Qwen/Qwen3-8B \
  --speculative-config '{"method": "ngram", "num_speculative_tokens": 3, "prompt_lookup_max": 4}'
```

`num_speculative_tokens` 是每一步的猜测数。`prompt_lookup_max` 是提议器尝试匹配的最长 token 串。我们的运行用的就是这两个值。

## 知道它什么时候有收益 {#s-use-n-gram-speculation-for-copy-heavy-work-know-when-it-pays}

提议器只能猜出请求里已经出现过的文本。复制 prompt 的工作能给它很多匹配：

- 修改用户发来的文档
- 引用原文的摘要
- 保留大部分行的代码改动
- 从长输入中抽取字段

开放式聊天很少复制。对这类工作，大多数猜测会失败，每一步只写出一个 token，和不用投机解码时一样。

## 看我们的运行结果 {#s-use-n-gram-speculation-for-copy-heavy-work-see-what-our-run-shows}

**我们测得** 2026-10-22 在我们 L4 节点的[共享 GPU 会话](#l4-sessions)中，用 `Qwen/Qwen3-8B` 比较了有无 n-gram 投机解码时的每 token 时间。那块 GPU 只有 2,928 token 的池，所以我们测了 1 个和 4 个用户，各两个种子。prompt 来自基准测试工具的随机数据集，输入 512 token，输出 128 token。

```figure
id: fig-4-2
kind: chart
title: the time per token with n-gram speculation
claim: On our L4, n-gram speculation cut the median time per token to about a third for one user and to 37 percent for four users.
caption: Each bar is the median of two runs. Lower is faster. From capture/gpu/summary/l4-gpu1.json.
```

| 用户数，L4 共享 GPU 会话 | 中位 TPOT，无 / n-gram | 输出 tok/s，无 / n-gram | P99 ITL，无 / n-gram | 中位 SM 时钟，无 / n-gram |
|---|---|---|---|---|
| 1 | 241.7 / 76.6 ms | 3.98 / 7.39 | 274 / 284 ms | 375 / 413 MHz |
| 4 | 272.6 / 101.3 ms | 13.02 / 19.22 | 290 / 1,691 ms | 428 / 443 MHz |

GPU 运行在 375 到 443 MHz，远低于满频，因为这块 GPU 是共享的，而且在降频。时间慢就是这个原因。请读两列之间的比值，而不是绝对时间。n-gram 运行的时钟高约 10%，和三倍的收益相比很小。

在一个用户时，输出提高了 86%。在四个用户时提高了 48%，而最差的 token 间隔从 290 ms 增长到 1,691 ms。我们没有追查这个间隔的原因。

我们没有记录接受计数器，所以说不出有多少猜测匹配上了。请把我们的收益只看作随机 prompt 和 128 token 输出下的结果。在你自己的 prompt 上，收益取决于输出复制了多少输入。

另一个团队报告了同样的局限，这一点我们自己没有测量。2025 年底发布的论文 "Speculative Decoding: Performance or Illusion?" 研究了 vLLM 中的投机解码。它发现接受长度在请求之间、数据集之间变化很大。我们自己的运行也显示，更低的中位数可能掩盖更差的尾部。在四个用户时，中位每 token 时间下降了，而 P99 ITL 上升了。

## 知道它的代价 {#s-use-n-gram-speculation-for-copy-heavy-work-know-what-it-costs}

- n-gram 投机解码会关闭异步调度，日志里只有一条警告。[异步调度页](#s-leave-async-scheduling-on)列出了会这样做的方法。
- 它运行在旧的 model runner 上，而不是 Model Runner V2。

## 在你的 prompt 上检查收益 {#s-use-n-gram-speculation-for-copy-heavy-work-check-the-gain-on-your-prompts}

用你自己的一部分流量，分别在有和没有这个配置时运行。保留真实的输出长度，不要用 `--ignore-eos`。比较中位 TPOT、P99 ITL 和 P99 TTFT，而不只是中位数。然后从 `/metrics` 读两个计数器：

```bash
curl -s http://localhost:8000/metrics | grep -E "spec_decode_num_(draft|accepted)_tokens"
```

用被接受的 token 数除以 draft token 数。占比高说明你的输出在复制 prompt，这个方法有收益。占比低说明更值得测试 EAGLE3 这样的 draft 模型。

```takeaways
- 对修改、引用、代码改动和抽取，试试 n-gram 投机解码。
- 在你自己的 prompt 上测量接受率和 P99 ITL。
- 在日志里查看异步调度已关闭的警告。
```

Sources: capture/gpu/summary/l4-gpu1.json (load.vllm-fast-b, load.vllm-ngram), the vLLM source at v0.31.0 (vllm/config/vllm.py, vllm/v1/spec_decode/), vLLM documentation at v0.31.0 (docs/features/speculative_decoding), Speculative Decoding: Performance or Illusion? (arXiv 2601.11580).
