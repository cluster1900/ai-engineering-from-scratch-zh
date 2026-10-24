# 服务长上下文和混合模型

> 长上下文和混合模型都会改变 vLLM 计算显存的方式，而且两者都可能因为一个被错误信息掩盖的原因在启动时失败。

你想要比默认更长的上下文，或者你服务的模型混合了 attention 层与滑动窗口层或状态空间层。读完本节后，你能有意识地设置最大长度，并读懂 cache 对每种层做了什么。

本手册没有运行长上下文模型或混合模型。本页内容来自 vLLM 文档、0.31.0 的源码和版本说明。

## 有意识地设置最大长度 {#s-serve-long-contexts-and-hybrid-models-set-the-maximum-length-on-purpose}

如果你不设置 `--max-model-len`，vLLM 会从模型配置中读取长度。`Qwen/Qwen3-8B` 的长度是 40,960 token。按每 token 144 KiB 计算，以这个长度服务一个请求需要 5.6 GiB 的 KV cache。在 24 GB 的 GPU 上，16.4 GB 的权重留下的空间可能连一个这样的请求都放不下，于是启动失败。

把 `--max-model-len` 设为你的用户发送的最长 prompt 加回答的长度。池的大小不变。更短的上限只是防止单个请求占满整个池，并让启动检查得以通过。

## 升级后检查长度 {#s-serve-long-contexts-and-hybrid-models-check-the-length-after-an-upgrade}

有些模型用 YaRN 之类的缩放方法扩展上下文。在 0.30.0 版本中，vLLM 修改了对 YaRN 的处理，以与 Hugging Face Transformers 库保持一致。对某些模型来说，vLLM 从配置推导出的长度变短了。版本说明给出的一个模型从 131,072 token 变成了 32,768 token。

升级后，读启动日志中推导出的长度。如果它变了，就自己设置 `--max-model-len`，或者确认模型仍然支持更长的长度。

## 了解混合模型如何使用 cache {#s-serve-long-contexts-and-hybrid-models-know-how-a-hybrid-model-uses-the-cache}

混合模型有不止一种层。vLLM 把每种层放进各自的 KV cache 组。下表给出了每个组的规则。

| 层的类型 | 保存什么 | 缓存的前缀何时命中 |
|---|---|---|
| 全 attention | 每个 token 的 key 和 value | 前缀的每个 block 都还在 cache 中 |
| 滑动窗口 | 最后一个窗口内 token 的 key 和 value | 最后一个窗口内的 block 都还在 cache 中 |
| 状态空间，例如 Mamba | 每个请求一个状态，而不是每个 token 一项 | prompt 中该位置必须有已保存的状态，而保存状态的规则在不同版本之间有变化 |

分组设计让一个池可以服务所有类型的层。这也意味着，在相同的 prompt 下，混合模型的前缀缓存命中率与全 attention 模型不同。

## 避开已移除和已改名的参数 {#s-serve-long-contexts-and-hybrid-models-avoid-the-removed-and-renamed-flags}

混合模型的支持变化很快。0.29 到 0.32 之间有三项变化值得注意：

- Mamba cache 的 `all` 模式在 0.30 中被弃用，它会让 vLLM 使用旧版 model runner。0.32 版本移除了它。
- 0.31 版本把 `--enable-mamba-fine-grained-prefix-cache` 改名为 `--enable-mamba-shared-prefix-checkpoint`。
- 移除 `all` 模式后，一个尚未关闭的 issue 报告 `--mamba-block-size` 不再起作用。

如果升级后混合模型启动变慢或占用更多显存，先检查这些参数。`--disable-hybrid-kv-cache-manager` 会关闭分组，可用来测试问题是否由分组引起。

## 检查设置 {#s-serve-long-contexts-and-hybrid-models-check-the-setup}

启动服务器并读池大小那一行。它给出在你的最大长度下的最大并发数：

```bash
grep "GPU KV cache size" server.log
```

池大小那一行只在启动成功时才会打印。如果启动因关于 KV cache 和最大长度的错误而停止，就降低 `--max-model-len`，直到这一行打印出来。然后读它的并发数，并与你计划以满长度服务的用户数比较。

```takeaways
- 把最大模型长度设为你最长的请求，而不是模型的上限。
- 每次升级后读一下推导出的长度。
- 预期混合模型的前缀缓存命中率会不同，并用你的 prompt 测试。
```

Sources: vLLM documentation at v0.31.0 (docs/design/hybrid_kv_cache_manager.md, docs/configuration/optimization.md), the vLLM source at v0.31.0 (vllm/config/scheduler.py, vllm/config/cache.py), the release notes for v0.30.0, v0.31.0, and v0.32.0, vLLM issue 60838, the model config of Qwen/Qwen3-8B.
