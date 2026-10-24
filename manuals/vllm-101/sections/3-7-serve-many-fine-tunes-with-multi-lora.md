# 用 multi-LoRA 服务多个微调模型

> 一个基础模型可以服务多个 LoRA adapter，adapter 的数量和 rank 决定了代价。

你有同一个基础模型的多个微调版本。读完本节后，你能从一个基础模型出发，按请求服务不同的 LoRA adapter。

## 开启 LoRA 启动服务器 {#s-serve-many-fine-tunes-with-multi-lora-start-the-server-with-lora-on}

LoRA adapter 是叠加在基础模型之上的一小组额外权重。服务器保留一份基础模型，并为每个请求应用它所指定的 adapter。针对不同 adapter 的请求可以在同一个 batch 中运行。

```bash
vllm serve Qwen/Qwen3-8B \
  --enable-lora \
  --lora-modules support=/adapters/support legal=/adapters/legal \
  --max-loras 4 --max-lora-rank 64
```

每个路径是一个 PEFT 格式的文件夹，大多数训练库都写出这种格式。它包含 `adapter_config.json` 和 `adapter_model.safetensors` 中的权重。vLLM 也能读取 `adapter_model.bin`。路径也可以是一个 Hugging Face 仓库名。

请求通过 `model` 字段中的名字选择 adapter：

```bash
curl http://localhost:8000/v1/chat/completions -H "Content-Type: application/json" \
  -d '{"model": "support", "messages": [{"role": "user", "content": "Reset my password"}]}'
```

`/v1/models` 会列出基础模型和每个 adapter。

2026-10-23 我们在 L4 节点上共享的第二块 GPU 上运行了这套配置。我们使用了 `Qwen/Qwen3-0.6B` 和两个公开的 adapter，rank 分别为 8 和 64。`/v1/models` 列出了基础模型、`support` 和 `legal`，对每个 adapter 的聊天请求都返回了 HTTP 200。

## 确定三个限制的大小 {#s-serve-many-fine-tunes-with-multi-lora-size-the-three-limits}

| 参数 | 默认值 | 它限制什么 |
|---|---|---|
| `--max-loras` | 1 | 在 GPU 上一个 batch 中可以运行的 adapter 数 |
| `--max-lora-rank` | 16 | 服务器接受的最大 adapter rank |
| `--max-cpu-loras` | 未设置 | 保存在 CPU 内存中、随时可加载的 adapter 数 |

每个 batch 默认只允许一个 adapter，对于有很多 adapter 的服务器来说太低了。针对第二个 adapter 的请求要等第一个 adapter 的 batch 完成。把 `--max-loras` 提高到同时繁忙的 adapter 数量。

把 `--max-lora-rank` 设成你的 adapter 中最大的 rank，不要更高。vLLM 文档不建议使用像 256 这样大的默认值，因为服务器会按最大的 rank 预留显存。

## 在服务器运行时加载 adapter {#s-serve-many-fine-tunes-with-multi-lora-load-adapters-while-the-server-runs}

要在不重启的情况下添加 adapter，用 `VLLM_ALLOW_RUNTIME_LORA_UPDATING=True` 启动服务器。然后带着名字和路径 POST 到 `/v1/load_lora_adapter`，要移除时 POST 到 `/v1/unload_lora_adapter`。只有在你信任服务器的每个调用方时才开启它，因为这个路由会从调用方给出的路径加载文件。

## 了解 LoRA 在其他地方带来的变化 {#s-serve-many-fine-tunes-with-multi-lora-know-what-lora-changes-elsewhere}

- **Prefix cache。** adapter 是每个 block key 的一部分。两个 adapter 从不共享缓存的 block，即使 prompt 相同。
- **CUDA graph。** vLLM 为带 adapter 的 batch 捕获单独的 graph。更多的 adapter 和更多的 graph 尺寸会增加启动时间和显存。
- **名字。** 从 0.31 起，adapter 不能与被服务的模型同名。

未在我们的硬件上测量。我们没有在 L4 或 GB10 上测量 adapter 数量或 rank 带来的代价。

```takeaways
- 一个基础模型服务多个 adapter，请求按名字选择其中之一。
- 把 --max-loras 提高到繁忙 adapter 的数量，并把 rank 上限设为你最大的 rank。
- 两个 adapter 从不共享 prefix cache 的 block。
```

Sources: the vLLM source at v0.31.0 (vllm/config/lora.py, vllm/lora/lora_model.py, vllm/lora/peft_helper.py, vllm/lora/utils.py, vllm/v1/core/kv_cache_utils.py), vLLM documentation at v0.31.0 (docs/features/lora.md), the release notes for v0.31.0, capture/gpu/out-l4/livecheck-2026-10-23.txt.
