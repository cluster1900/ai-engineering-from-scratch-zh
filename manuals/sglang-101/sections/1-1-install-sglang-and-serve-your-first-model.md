# 安装 SGLang 并部署你的第一个模型

> 大约十分钟里，我们安装 SGLang，在一块 GPU 上启动服务器，并从它拿到与我们录制运行相同的答案。

我们从一台带一块 NVIDIA GPU 及其驱动的 Linux 机器开始。结束时，30000 端口上有一台能回答 `curl` 和 OpenAI Python 客户端的服务器。

读完本节后，你能用 uv 或 Docker 安装 SGLang 并启动服务器。你也能把它的第一批答案与我们的对比，并修好常见的启动错误。

## 你需要什么 {#s-install-sglang-and-serve-your-first-model-what-you-need}

- 带一块 NVIDIA GPU、驱动支持 CUDA 13 的 Linux。SGLang 0.5.22 只发布 CUDA 13 的 wheel 和镜像 {{docs}}。
- 本节模型 `Qwen/Qwen3-8B` 需要 24 GB GPU 内存。内存更少时，用 `Qwen/Qwen3-0.6B`。步骤不变，输出里的数字会变。
- 大约 16 GB 空闲磁盘，放 `Qwen/Qwen3-8B` 的权重。
- 带 NVIDIA Container Toolkit 的 Docker，或带 `uv` 的 Python 3.11 及以上。

本节每一段输出都录在一块 24 GB 的 NVIDIA L4 上。Listing 会点名 capture 文件，所以你可以逐行把你的运行与我们的对比。

## 检查 GPU {#s-install-sglang-and-serve-your-first-model-check-the-gpu}

先检查驱动能看到 GPU：

```bash
nvidia-smi
```

表格会列出你的 GPU 和驱动版本。如果找不到命令，先装 NVIDIA 驱动再继续。没有它，SGLang 启动不了。

## 安装 SGLang {#s-install-sglang-and-serve-your-first-model-install-sglang}

选一条路径。在只有 GPU 驱动的机器上用 Docker。在已有完整 CUDA toolkit（包括 `nvcc`）的机器上用 uv。

在一台只有驱动的 L4 主机上，`pip install sglang==0.5.22` 没有报错就结束了。随后服务器的前四次启动都失败了，每次缺 toolkit 里不同的部分。[第 7.1 节](#s-operating-sglang) 列出那四个错误和修法。

### 用 Docker {#s-install-sglang-and-serve-your-first-model-with-docker}

拉取本手册测试的版本的镜像：

```bash
docker pull lmsysorg/sglang:v0.5.22
```

我们钉住标签。`latest` 标签会移到每个新发行版，而发行版会改默认值。

### 用 uv {#s-install-sglang-and-serve-your-first-model-with-uv}

建一个环境，并钉住版本安装 SGLang：

```bash
uv venv --python 3.12
source .venv/bin/activate
uv pip install --prerelease=allow "sglang==0.5.22"
```

保留 `--prerelease=allow`。SGLang 的部分依赖只发布预发行版，没有这个旗标时，更老的 uv 会不声不响地装上 SGLang 0.5.9 {{docs}}。

现在检查版本：

```bash
sglang version
```

```listing
title: the installed version
source: capture/gpu/out-gb10/sglang-version.txt
lang: text
---
$ sglang version
sglang version: 0.5.22
git revision: N/A
```

如果看到别的版本，说明安装挑了别的发行版。钉住版本再跑一次安装命令。

## 启动服务器 {#s-install-sglang-and-serve-your-first-model-start-the-server}

在你装了 SGLang 的环境里启动服务器。这是我们录制的 L4 运行用的命令：

```bash
sglang serve --model-path Qwen/Qwen3-8B --host 127.0.0.1 --port 30000 \
  --enable-cache-report --enable-metrics --mem-fraction-static 0.85
```

用 Docker 时，在容器里跑同一台服务器。挂上你的 Hugging Face 缓存，这样权重只下一次：

```bash
docker run --rm --gpus all --ipc=host --shm-size 32g -p 127.0.0.1:30000:30000 \
  -v "$HOME/.cache/huggingface:/root/.cache/huggingface" \
  lmsysorg/sglang:v0.5.22 \
  sglang serve --model-path Qwen/Qwen3-8B --host 0.0.0.0 --port 30000 \
  --enable-cache-report --enable-metrics --mem-fraction-static 0.85
```

我们跑的是 uv 路径。Docker 命令跟的是 SGLang 安装页 {{docs}}。它用 `--host 0.0.0.0`，因为端口必须在容器外打开。`-p` 上的 `127.0.0.1:` 前缀把那个端口留在你自己的机器上。服务器没有 API key，所以不要把它发布到网络接口上。

命令里有三个旗标是我们的选择：

- `--enable-cache-report` 把 `cached_tokens` 放进每个响应。没有它，客户端看不到自己请求的缓存命中。
- `--enable-metrics` 打开 `/metrics` 端点，[第 1.2 节](#s-check-that-the-server-is-healthy) 会读它。
- `--mem-fraction-static 0.85` 设定 SGLang 拿多少 GPU 内存。[第 3.2 节](#s-mem-fraction-static-and-startup-sizing) 展示怎么选这个值。

第一次启动会下载权重。然后服务器划好内存并准备 kernel。等到这段 listing 的最后一行：

```listing
title: the startup lines of our L4 server
source: capture/gpu/out-l4/server-default.log
lang: text
note: Five lines from the startup log. The import, download, and warning lines between them are cut.
---
[2026-10-17 14:42:45] KV Cache is allocated. dtype: torch.bfloat16, #tokens: 22939, K size: 1.58 GB, V size: 1.58 GB
…
[2026-10-17 14:43:36] max_total_num_tokens=22939, chunked_prefill_size=4096, max_prefill_tokens=16384, max_running_requests=2048, context_len=40960, available_gpu_mem=1.31 GB
…
[2026-10-17 14:43:36] Tree cache initialized: source=default impl=UnifiedRadixCache hybrid_swa=False hybrid_ssm=False hicache_attached=False
[2026-10-17 14:43:37] Engine startup timings (s): load_weight=3.73, kv_cache_allocation=0.40, scheduler_e2e=59.11, cuda_graph={prefill=48.33, decode=2.61, target_verify=0.00, draft_prefill=0.00, draft_decode=0.00, draft_extend=0.00}, tokenizer_e2e=69.10
…
[2026-10-17 14:43:38] The server is fired up and ready to roll!
```

我们的权重已经在磁盘上，所以加载只用了 3.73 s。启动仍然花了大约一分钟。那一分钟里大部分，48.33 s，花在为 prefill 捕获 CUDA graph 上。同一台机器上之后的启动可以复用 `~/.cache/sglang` 里编译好的 kernel。

### 如果服务器启动不了 {#s-install-sglang-and-serve-your-first-model-if-the-server-does-not-start}

读日志里最后一行错误，然后在这里找到它：

- **日志提到 `Python.h`、`nvcc` 或 `-lcudart`。** 主机没有完整的 CUDA toolkit。走 Docker 路径，或者按 [第 7.1 节](#s-operating-sglang) 做那四项修复。
- **日志说 GPU 内存不足。** 模型和它的缓存装不下。降低 `--mem-fraction-static`，或者用更小的模型。[第 3.2 节](#s-mem-fraction-static-and-startup-sizing) 展示那次崩溃和修法。
- **下载失败。** 检查网络和模型名。设了 `HF_HUB_OFFLINE=1` 时，模型必须已经在缓存里。
- **别的程序占了 30000 端口。** 用 `--port 30001` 启动服务器，并在下面每条请求里用那个端口。

## 用 curl 发一条请求 {#s-install-sglang-and-serve-your-first-model-send-a-request-with-curl}

打开第二个终端。向 SGLang 的原生 API 发一条请求：

```bash
curl -s http://127.0.0.1:30000/generate \
  -H 'Content-Type: application/json' \
  -d '{"text": "The capital of France is", "sampling_params": {"max_new_tokens": 12, "temperature": 0}}'
```

我们的 L4 服务器这样回答：

```listing
title: the answer from the native API
source: capture/gpu/out-l4/generate.txt
lang: json
note: Cut from the /generate response. The token ids, the request id, and the timing fields other than e2e_latency are cut.
---
  "text": " Paris. The capital of Italy is Rome. The capital of",
…
  "meta_info": {
…
    "finish_reason": {
      "type": "length",
      "length": 12
…
    "prompt_tokens": 5,
…
    "completion_tokens": 12,
    "cached_tokens": 2,
…
    "e2e_latency": 0.7252887019421905,
```

在 temperature 0 下，你用 `Qwen/Qwen3-8B` 得到的文本可以和我们的逐字一致。答案在 12 个 token 后停下，因为我们要了 12 个，`finish_reason` 写着 `length`。

五个 prompt token 里有两个已经在缓存里。启动时，服务器给自己发了 prompt "The capital city of France is"。我们的 prompt 与那个 warm-up prompt 共享前两个 token，所以前缀缓存跳过了它们。

## 通过 OpenAI API 发同一个问题 {#s-install-sglang-and-serve-your-first-model-send-the-same-question-through-the-openai-api}

大多数客户端用 OpenAI chat API，SGLang 在同一端口上提供它。先用 curl 发一条 chat 请求：

```bash
curl -s http://127.0.0.1:30000/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model": "default", "messages": [{"role": "user", "content": "Name one planet. Answer in one word."}], "max_tokens": 64, "temperature": 0, "chat_template_kwargs": {"enable_thinking": false}}'
```

```listing
title: the answer from the OpenAI chat API
source: capture/gpu/out-l4/generate.txt
lang: json
note: Cut from the /v1/chat/completions response. The id, the timestamp, and the metadata block are cut.
---
  "model": "default",
…
      "message": {
        "role": "assistant",
        "content": "Earth",
…
      "finish_reason": "stop",
…
  "usage": {
    "prompt_tokens": 21,
    "total_tokens": 23,
    "completion_tokens": 2,
    "prompt_tokens_details": {
      "cached_tokens": 0
    },
    "reasoning_tokens": 0
```

问题有七个词，变成了 21 个 prompt token。Chat template 在消息周围加了角色标记，所以规划上下文长度时要把它们算进去。`"enable_thinking": false` 关掉 Qwen3 的 thinking 模式，所以答案只有一个词，`reasoning_tokens` 是 0。

现在用 OpenAI 客户端从 Python 发同一条请求：

```python
from openai import OpenAI

client = OpenAI(base_url="http://127.0.0.1:30000/v1", api_key="none")
response = client.chat.completions.create(
    model="default",
    messages=[{"role": "user", "content": "Name one planet. Answer in one word."}],
    max_tokens=64,
    temperature=0,
    extra_body={"chat_template_kwargs": {"enable_thinking": False}},
)
print(response.choices[0].message.content)
```

脚本打印响应的 `content` 字段。我们的 capture 用 Python 标准库发了同样的 JSON body，拿到 `Earth`。服务器没设 `--api-key` 时，SGLang 不检查 key，所以任何值都行。

## 停止服务器 {#s-install-sglang-and-serve-your-first-model-stop-the-server}

在服务器终端按 **Ctrl+C** 停止服务器 {{docs}}。生产里只向主进程发停止信号。[第 7.1 节](#s-operating-sglang) 解释原因。

## 在 Apple silicon Mac 上 {#s-install-sglang-and-serve-your-first-model-on-an-apple-silicon-mac}

SGLang 也能通过 MLX 后端在 Apple silicon 上跑。你需要 macOS 14 或更新版本，以及大约 8 GB 空闲磁盘。从该标签安装带 MLX extra 的 SGLang：

```bash
git clone --branch v0.5.22 --depth 1 https://github.com/sgl-project/sglang.git
cd sglang
uv venv -p 3.12 .venv && source .venv/bin/activate
cp python/pyproject_other.toml python/pyproject.toml
uv pip install -e "python[srt_mps]"
```

在我们的 Mac 上，安装花了 3 分 15 秒。用一个小的 4-bit 模型启动服务器：

```bash
SGLANG_USE_MLX=1 sglang serve --model-path mlx-community/Qwen3-0.6B-4bit \
  --disable-cuda-graph --enable-cache-report --mem-fraction-static 0.4
```

然后发和上面相同的 `/generate` 请求。我们的 Mac 回答 " Paris, and the capital of Germany is Berlin. The capital"。更小的模型给出别的文本，token 计数保持不变。在你还用来做其他事的 Mac 上要设 `--mem-fraction-static`。[第 3.2 节](#s-mem-fraction-static-and-startup-sizing) 展示我们没设它时得到的崩溃。

```takeaways
- 在安装命令和镜像标签里都钉住 SGLang 版本。
- 在只有 GPU 驱动的主机上用 Docker 镜像。
- 用 --enable-cache-report 和 --enable-metrics 启动服务器。
- 发第一条请求之前，等 ready 行出现。
- 改任何设置之前，先把你的第一批答案与录制的答案对比。
```

Sources: capture/gpu/out-gb10/sglang-version.txt, capture/gpu/out-l4/server-default.command.txt, capture/gpu/out-l4/server-default.log, capture/gpu/out-l4/generate.txt, capture/gpu/out-l4/environment.json, capture/one_request.py, capture/gpu/incidents/l4-toolchain-failures.txt, capture/out/generate.txt, docs/docs/get-started/install.mdx and docs/docs/get-started/quickstart.mdx at v0.5.22, docs/docs/hardware-platforms/apple_metal.mdx and python/pyproject_other.toml at v0.5.22.
