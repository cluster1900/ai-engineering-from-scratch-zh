# 编译和 CUDA graph 是如何捕获的

> 本页解释 torch.compile、piecewise 与 full graph，以及捕获大小。

vLLM 每次启动的最后一段时间都花在编译和捕获上。读完本节后，你能说出每个优化级别开启了什么，以及为什么 full CUDA graph 无法覆盖每个 batch。

## 两个独立的工具 {#s-how-compile-and-cuda-graphs-are-captured-two-separate-tools}

**torch.compile** 把模型的 Python 代码 trace 成一个 graph，并生成融合 kernel。融合会把小操作（例如 norm 和量化步骤）合并成一个 kernel。编译好的代码进入 `~/.cache/vllm/torch_compile_cache` 下的 cache。用相同设置第二次启动时会跳过大部分工作。服务器在处理第一个请求之前完成所有编译。

**CUDA graph** 记录一串形状固定的 kernel 启动，并用一次 CPU 调用回放它。小 batch 的一个 decode step 有几百个很短的 kernel，graph 消除了逐个启动它们的 CPU 开销。

## graph 模式 {#s-how-compile-and-cuda-graphs-are-captured-the-graph-modes}

graph 需要固定的形状，而 attention 并不总是满足。一个 batch 可能混合了不同长度的 prompt。vLLM 用模式来处理这一点：

| 模式 | 记录什么 |
|---|---|
| `NONE` | 什么都不记录 |
| `PIECEWISE` | 除 attention 以外的所有部分，围绕每次 attention 调用分段记录 |
| `FULL_DECODE_ONLY` | 整个 step，但只针对全是单 token decode 的 batch |
| `FULL_AND_PIECEWISE` | attention backend 允许时记录整个 step，否则分段记录 |

默认是 `FULL_AND_PIECEWISE`。运行时，一个 dispatcher 根据每个 batch 的 token 数、请求数以及是否均匀来选择模式。如果 attention backend 无法为某个 batch 回放 full graph，dispatcher 就使用 piecewise graph。

在 L4 和 GB10 上，FlashAttention 2 只对均匀的 batch（例如纯 decode step）支持 full graph。带新 prompt 的混合 batch 以 piecewise 方式运行。

## 优化级别 {#s-how-compile-and-cuda-graphs-are-captured-the-optimization-levels}

`-O0` 到 `-O3` 一起设置编译和 graph：

| 级别 | 编译 | Graph | 融合 |
|---|---|---|---|
| `-O0` | 关 | 关 | 关 |
| `-O1` | 开 | piecewise | norm 和激活量化 |
| `-O2`，默认 | 开 | full 和 piecewise | 更多，例如 all-reduce 与 norm 融合 |
| `-O3` | 在 0.31.0 中与 `-O2` 相同 | | |

你自己设置的参数优先于级别。`--enforce-eager` 一个开关就关闭编译和 graph。从 0.31.0 起，它还会关闭启动时的 kernel 预热，而 `-O0` 会保留预热。

## 捕获大小 {#s-how-compile-and-cuda-graphs-are-captured-capture-sizes}

vLLM 为一组 batch 大小捕获 graph。比最大值还大的 batch 不使用 full graph 运行。`--max-cudagraph-capture-size` 设置最大值，`--cudagraph-capture-sizes` 设置列表。大小越多，启动时间和 GPU 内存的开销就越大，而这部分内存要从 KV 池里扣除。

`vllm bench startup` 分别在冷的和热的编译 cache 下测量启动，让你看到每种选择的代价。

```takeaways
- torch.compile 融合 kernel，CUDA graph 消除启动开销。它们是两个独立的工具。
- 默认模式在 attention backend 允许的地方记录 full graph，其他地方分段记录。
- -O2 是默认值，在 0.31.0 中 -O3 等同于 -O2，而 --enforce-eager 还会跳过预热。
```

Sources: the vLLM source at v0.31.0 (vllm/config/compilation.py, vllm/config/model.py, vllm/v1/attention/backends/flash_attn.py, vllm/benchmarks/startup.py), vLLM documentation at v0.31.0 (docs/design/optimization_levels.md, docs/design/torch_compile.md, docs/design/cuda_graphs.md), the release notes for v0.31.0.
