# 安装 vLLM 并部署你的第一个模型

> 从一台空机器到你自己的 vLLM 服务器流式返回的第一个 token，只需要三条命令和一个请求。

你有一块 NVIDIA GPU 和一个模型名，想要一个属于自己的 OpenAI 兼容端点。读完本节后，你能安装 vLLM、启动服务器、向它发送请求，并读懂启动日志。

每条命令我们都使用 vLLM 0.31.0。vLLM 大约每两周发布一个新的 minor 版本，所以要在安装命令里固定版本。

## 先检查 GPU {#s-install-vllm-and-serve-your-first-model-check-the-gpu-first}

首先，检查驱动能否看到你的 GPU。运行这条命令：

```bash
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv
```

每块 GPU 显示一行，包含它的名称和显存。如果提示找不到命令，先安装 NVIDIA 驱动再继续。vLLM 不会替你安装驱动。

对照下表检查机器的其余部分。它来自 vLLM 0.31.0 的安装指南。我们没有测试这些下限。

| 你需要 | 0.31.0 的要求 |
|---|---|
| 操作系统 | uv 和 pip 方式需要 Linux，或 Windows 上的 WSL。Docker 需要装有 NVIDIA container toolkit 的主机 |
| GPU | NVIDIA，compute capability 7.5 或更高，例如 T4、L4、A100 或 H100 |
| 驱动 | 默认 wheel 需要足够新、支持 CUDA 12.9 的驱动，CUDA 13 镜像需要 R580 或更新版本 |
| Python | 3.10 至 3.13 |
| Hugging Face token | 只有访问受限的模型才需要，设置为 `HF_TOKEN` |

## 安装 vLLM {#s-install-vllm-and-serve-your-first-model-install-vllm}

三种方式选一种。除非有理由选别的，否则用第一种。

**方式 1，uv。** uv 会创建一个干净的 Python 环境，并挑选与你的 CUDA 驱动匹配的 PyTorch 版本。

```bash
uv venv --python 3.12 --seed
source .venv/bin/activate
uv pip install vllm==0.31.0 --torch-backend=auto
```

**方式 2，pip。** 用 Python 3.12 新建一个虚拟环境，然后安装同一个版本。

```bash
python3.12 -m venv .venv && source .venv/bin/activate
pip install vllm==0.31.0
```

**方式 3，Docker。** 官方镜像包含 vLLM、PyTorch 和 CUDA。我们在 arm64 的 DGX Spark 上拉取了 `vllm/vllm-openai:v0.31.0`，它能正常运行。

```bash
docker run --rm --gpus all --ipc=host -p 8000:8000 \
  -v ~/.cache/huggingface:/root/.cache/huggingface \
  vllm/vllm-openai:v0.31.0 Qwen/Qwen3-0.6B --reasoning-parser qwen3
```

镜像会替你启动服务器，所以用 Docker 时可以跳过下一步。要挂载你的 Hugging Face 缓存，否则容器每次启动都会重新下载权重。用 `docker logs` 查看容器的日志。

用 `vllm --version` 检查安装。你会看到 `0.31.0`。

在 uv 和 pip 方式下，第一次启动会编译 FlashInfer kernel，因此需要带 `nvcc` 的 CUDA toolkit，并把 `CUDA_HOME` 指向它。Docker 镜像里自带一个。我们在一台只装了驱动的主机上用 uv 安装 vLLM 0.31.0，每次启动都因 `Could not find nvcc` 而停止。安装 toolkit，设置 `CUDA_HOME`，然后重新启动。[按症状排障页](#s-troubleshoot-by-symptom)讲到了这个问题，以及 toolkit 版本不匹配的情况。

## 启动服务器 {#s-install-vllm-and-serve-your-first-model-start-the-server}

现在启动一个小模型。Qwen3-0.6B 有 6 亿参数，所以它的 BF16 权重大约需要 1.2 GB。

```bash
vllm serve Qwen/Qwen3-0.6B --reasoning-parser qwen3 2>&1 | tee server.log
```

服务器监听 8000 端口。第一次启动要下载权重，所以比之后的启动更慢。

`tee` 命令把日志显示在终端里，同时写入 `server.log`。后面的页面会用 `grep` 搜索这个文件，所以每次启动都保持这个文件名。

Qwen3 是推理模型。它先在 `<think>` 标签之间写出思考过程，然后才写答案。`--reasoning-parser qwen3` 让 vLLM 把思考过程从答案文本中移出来。不加这个参数，思考过程会留在答案开头。[推理模型页](#s-serve-reasoning-models)会讲解这个 parser。

启动日志很长。其中六行告诉你大部分需要知道的东西。下面的 listing 取自我们的 DGX Spark，那里部署的是更大的 Qwen3-30B-A3B。你的日志行形式相同，只是数字更小。

```listing
title: the startup lines to read, from a DGX Spark
source: capture/gpu/out-gb10/server-load-vllm.log
lang: text
note: Six lines cut from the start of the log. The banner, the full engine config, and the route list are cut.
---
(APIServer pid=1) INFO 10-21 10:53:02 [api_utils.py:347]  ▄▄ ▄█ █     █     █ ▀▄▀ █  version 0.31.0
(EngineCore pid=143) INFO 10-21 10:53:14 [gpu_worker.py:479] Using V2 Model Runner
(EngineCore pid=143) INFO 10-21 10:53:17 [cuda.py:526] Using FLASH_ATTN attention backend out of potential backends: ['FLASH_ATTN', 'FLASHINFER', 'TRITON_ATTN', 'FLEX_ATTENTION'].
(EngineCore pid=143) INFO 10-21 10:58:45 [model_runner.py:407] Model loading took 56.93 GiB memory and 330.542793 seconds
(EngineCore pid=143) INFO 10-21 10:59:46 [gpu_worker.py:692] Available KV cache memory: 31.32 GiB
(EngineCore pid=143) INFO 10-21 10:59:46 [kv_cache_utils.py:2464] GPU KV cache size: 234,960 tokens, Maximum concurrency for 8,192 tokens per request: 28.68x
```

按这个顺序读这些行：

1. **版本。** 它必须与你固定的版本一致。
2. **Model runner。** vLLM 0.31.0 在 CUDA 上默认使用 V2 model runner。有些功能会让它切回 V1，这一行会显示出来。
3. **Attention backend。** vLLM 会为你的 GPU 选一个。改变 KV cache 的数据类型可能会改变这一行。
4. **模型加载。** 这一行给出权重占用的显存和加载耗时。
5. **可用 KV cache 显存。** 这一行给出扣除权重和启动 profile 之后，留给 KV cache 的显存。
6. **KV cache 大小。** 这一行给出缓存能容纳的 token 数，以及能同时容纳多少个满长度请求。第 2 部分从这一行开始。

日志出现 `Application startup complete.` 时，服务器就绪。在我们的 DGX Spark 上，57 GiB 的权重花了大约八分钟。模型加载行给出 330.5 秒，其中 325 秒用在读取权重文件上。

```figure
id: fig-1-2
kind: structure
title: the six startup lines to read
claim: Six startup lines show the version, the runner, the attention backend, the weight memory, the free KV memory, and the pool size.
caption: Read each row from left to right: the log line, our value on the DGX Spark, and what it decides. From capture/gpu/out-gb10/server-load-vllm.log.
```

## 发送第一个请求 {#s-install-vllm-and-serve-your-first-model-send-the-first-request}

打开第二个终端。用 curl 发送一个聊天请求：

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "Qwen/Qwen3-0.6B", "messages": [{"role": "user", "content": "Name three prime numbers."}], "max_tokens": 64, "chat_template_kwargs": {"enable_thinking": false}}'
```

`chat_template_kwargs` 字段只为这一个请求关闭思考，所以 64 个 token 足够写出答案。回复是一个 JSON 对象。答案文本在 `choices[0].message.content` 里，token 计数在 `usage` 里。服务器日志中会新出现一行，显示请求路径和 `200 OK`。

如果保持思考开启，模型可能把 64 个 token 全部花在思考上。这时思考过程进入 `reasoning` 字段，`content` 为 null，`finish_reason` 为 `length`。我们在 L4 上正好遇到了这种情况。给开启思考的请求设置大得多的 `max_tokens`。

服务器使用 OpenAI API 协议，所以 OpenAI Python 客户端无需改动代码就能用：

```python
from openai import OpenAI

client = OpenAI(base_url="http://localhost:8000/v1", api_key="EMPTY")
stream = client.chat.completions.create(
    model="Qwen/Qwen3-0.6B",
    messages=[{"role": "user", "content": "Name three prime numbers."}],
    stream=True,
    extra_body={"chat_template_kwargs": {"enable_thinking": False}},
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="", flush=True)
```

服务器流式返回 token 时，它们会逐个打印出来。这就是你的第一个流式 token。

## 输出不一样时 {#s-install-vllm-and-serve-your-first-model-when-the-output-is-different}

- **服务器因显存不足错误而停止。** 另一个程序在使用 GPU，或者模型太大。阅读[显存不足页](#s-fix-out-of-memory-at-startup)。
- **答案以一大段 `<think>` 开头。** 服务器运行时没有 reasoning parser。用 `--reasoning-parser qwen3` 启动它，或者在请求里发送 `"chat_template_kwargs": {"enable_thinking": false}`。
- **答案为空，且 `finish_reason` 为 `length`。** 思考用光了全部 `max_tokens`。调大 `max_tokens`，或者为这个请求关闭思考。
- **请求返回 404。** 请求里的模型名必须与 `vllm serve` 中的名称一致。运行 `curl http://localhost:8000/v1/models` 查看它。
- **回答使用的采样参数与你设置的不同。** 默认情况下，vLLM 使用模型仓库中的采样设置。用 `--generation-config vllm` 启动服务器，就会改用 vLLM 的默认值。
- **启动要花好几分钟。** 第一次启动要下载权重。在 DGX Spark 上，0.31.0 加载大模型权重很慢。

```takeaways
- 在每条安装命令里固定 vLLM 版本。
- 用 `tee server.log` 启动服务器，每次启动都读那六行启动日志。
- 在接入应用之前，先用 curl 发一个请求。
```

Sources: vLLM documentation at v0.31.0 (docs/getting_started/quickstart.md, docs/getting_started/installation/gpu.md, docs/getting_started/installation/gpu.cuda.inc.md, docs/deployment/docker.md, docs/features/reasoning_outputs.md), capture/gpu/out-gb10/server-load-vllm.log, issue 58726, capture/gpu/out-l4/livecheck-2026-10-23.txt.

This sentence is deliberately left in English to prove that the residual English gate fails the pull request.
