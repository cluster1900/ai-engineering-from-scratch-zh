# SGLang 101 capture kit

本 kit 通过 MLX 后端在 Apple silicon 上启动真实的 SGLang 0.5.22 服务器，向它发请求，跑官方基准，并把看到的内容写到 `out/`。手册里每一段 listing 和每一个实测数字都来自这些文件。

## 要求

- 一台 macOS 14 或更新版本的 Apple silicon Mac。
- 从该标签安装并带 `srt_mps` extra 的 SGLang 0.5.22（见手册 front matter）。
- `PATH` 上有 `sglang` 命令，第一次还要有网络，好把 `mlx-community/Qwen3-0.6B-4bit` 下到 Hugging Face 缓存。

## 运行

```bash
python3 capture/run.py           # record everything into capture/out/
python3 capture/run.py --check   # record into a temporary directory and compare
python3 capture/run.py --only small-pool   # record one server configuration
```

用 SGLang 环境里的 Python 来跑。完整跑一遍会启动四台服务器，在录制用的 Mac 上要约 20 到 25 分钟。`--check` 同样久。如果没有 SGLang 0.5.22 和 Apple silicon 上的 MLX，`--check` 会打印 `skipped` 及原因并以 0 退出。

## 它记录什么

| 服务器 | 加在公共旗标上的旗标 | 文件 |
|---|---|---|
| default | 无 | `generate.txt`, `cache-experiment.txt`, `bench-random-c1.txt`, `bench-random-c8.txt`, `bench-random-c32.txt`, `bench-shared-prefix.txt`, `metrics.txt` |
| no-radix-cache | `--disable-radix-cache` | `no-radix-cache-bench-shared-prefix.txt`, `no-radix-cache-metrics.txt` |
| no-overlap | `--disable-overlap-schedule` | `no-overlap-bench-random-c8.txt`（服务器崩溃，见日志） |
| small-pool | `--max-total-tokens 4096` | `small-pool-bench-long-output-c16.txt`, `small-pool-metrics.txt` |

公共旗标是 `--model-path mlx-community/Qwen3-0.6B-4bit --disable-cuda-graph --enable-cache-report --enable-metrics --mem-fraction-static 0.4`，并设 `SGLANG_USE_MLX=1`。每台服务器写入 `server-<name>.log`，`server-<name>.command.txt` 保存确切命令。`serve-help.txt` 是 `sglang serve --help` 的输出，`environment.json` 记录版本。每个 `.txt` 旁边的基准 JSONL 保存基准写出的逐次运行记录。

`one_request.py` 发一次原生 `/generate` 请求和一次 OpenAI chat 请求。`cache_experiment.py` 把同一段 3,000 token 的 system prompt 以三种形式各发五次：原样、开头加随机 request id，以及结尾加同一个 id。

## `--check` 比较什么

计时每次都会变，所以检查比较的是不得改变的事实：

- temperature 0 时的生成文本与 token 计数
- 每种 cache 情形的中位 cached tokens，以及两种 id 情形是否分别低于 50 和高于 2,900
- 每次基准的成功请求数以及输入、输出 token 合计
- 每份服务器日志里的 `bytes_per_slot`、tree cache 行，以及任何 `RuntimeError` 行
- 指标名集合与 `sglang serve` 选项集合
- 服务器命令

基准输出里的绝对 home 路径会换成 `~`。

`oom-exploratory.log` 不是本 kit 录的。它来自 kit 出现之前的一次探索性运行，用的是默认 memory fraction，第 3.2 节说明了这一点。

## GPU 套件

`gpu/` 里是面向一块 NVIDIA GPU 的第二套 kit。它需要 Linux、NVIDIA 驱动、来自 PyPI 的 `sglang==0.5.22`，以及 `PATH` 上的 `sglang` 命令。我们在自己的机器上录制，不在 CI 里录。第一台服务器启动前，`run.py` 和 `sweep.py` 会下载模型以及 `sglang.benchmark.serving` 的 `random` 数据集要读的 ShareGPT 文件，并用 `--dataset-path` 传入。随后它们为每台服务器和每次基准设置 `HF_HUB_OFFLINE=1`，因此 capture 不会再联系 Hub。跑过一次之后，或者模型已在你的 Hugging Face 缓存里时，只要你自己设好 `HF_HUB_OFFLINE=1`，kit 就可以离线工作。把 `SGLANG_KIT_DATASET` 设成 `ShareGPT_V3_unfiltered_cleaned_split.json` 的本地副本可跳过那次下载。用 `SGLANG_KIT_PROFILE` 选择硬件配置：

| 配置档 | 模型 | 内存比例 | 输出 |
|---|---|---|---|
| `gb10` | `Qwen/Qwen3-30B-A3B-Instruct-2507`、其 FP8 检查点，以及 EAGLE-3 draft `lmsys/SGLang-EAGLE3-Qwen3-30B-A3B-Instruct-2507-SpecForge-Nex` | 0.7 | `gpu/out-gb10/`, `gpu/summary/gb10.json` |
| `l4` | `Qwen/Qwen3-8B`、`Qwen/Qwen3-8B-FP8`，以及 EAGLE-3 draft `Tengyunw/qwen3_8b_eagle3` | 0.85 | `gpu/out-l4/`, `gpu/summary/l4.json` |

```bash
SGLANG_KIT_PROFILE=gb10 python3 capture/gpu/run.py
SGLANG_KIT_PROFILE=gb10 python3 capture/gpu/run.py --check
python3 capture/gpu/sweep.py --profile gb10 --sweep load --configs default fp8 eagle3 no-cuda-graph
python3 capture/gpu/summarize.py gb10
```

| 文件 | 做什么 |
|---|---|
| `gpu/run.py` | 启动八台服务器：默认、无 CUDA graph、无 radix 缓存、无重叠、4,096 token 池、带 FP8 KV 缓存的 FP8 权重、EAGLE-3，以及确定性推理。`--only eagle3-no-env` 检查 EAGLE-3 上下文长度拒绝，`--only idle-probe` 跑 `ttft_idle_probe.py` |
| `gpu/offline.py` | 下载一次模型与 ShareGPT 文件，然后设 `HF_HUB_OFFLINE=1`，并为每次 `random` 基准加上 `--dataset-path` |
| `gpu/sweep.py` | 以种子 1、2、3 和 `--output-details` 跑 `load`、`rate`、`prefix`、`waves`、`working-set` 与 `mixed` sweep，写入 `gpu/runs/<profile>/<sweep>/<config>/`。`dp2`、`dp2-tokens`、`tp2`、`pd` 与 `pd-swap` 配置需要 `CUDA_VISIBLE_DEVICES` 里两块 GPU，`vllm` 用与 SGLang 在该卡上相同的 KV 池启动 vLLM |
| `gpu/miles_grpo.py` | 在 `radixark/miles` 镜像里用 Miles 跑一段短 GRPO 任务，普通或带 `MILES_TRUE_ON_POLICY=1`，跑 `MILES_NUM_ROLLOUT` 步（默认 12），可选 `MILES_SEED` 作训练与 rollout 种子 |
| `gpu/miles_summary.py` | 把 Miles 日志收成 `gpu/summary/miles-gb10.json`：逐步 reward、回答长度、rollout 时间、rollout 与训练 log-probability 差，以及阶段计时器 |
| `gpu/summarize.py` | 把各次运行收成 `gpu/summary/<profile>.json`：每个点的中位、最低与最高值，goodput，以及 TTFT 与 TPOT 分位数 |
| `gpu/determinism_probe.py` | 在 temperature 0 下单独发同一提示五次，再在大小为 16 的 batch 里发五次，并统计不同答案数 |
| `gpu/structured_probe.py` | 发一个无 schema 的问题，再带一个新 JSON schema，同一 schema 再两次，以及第二个新 schema |
| `gpu/incidents/` | 手册所述事件的证据：L4 上的工具链失败、热节流、GB10 上的内存守卫，以及驱动内存消息 |

每次 sweep 运行前，`gpu/sweep.py` 最多等 900 s，让 GPU 凉到 65 C。运行期间它每秒采样一次 `nvidia-smi`，写到该次运行旁边的 `.gpu.csv`。`gpu/summarize.py` 给每个点加上中位 SM clock、最高温度，以及带 thermal slowdown bit 的样本占比。Goodput 统计的是首 token 低于 1 s、平均每 token 时间低于 100 ms 的请求。

`vllm` 配置需要单独环境里的 vLLM，由 `VLLM_BIN` 命名。它把 `--num-gpu-blocks-override` 钉成 SGLang 在同一块卡上拿到的 pool，干净 L4 上是 1,506 个 16 token 的 block，并把 `--max-model-len` 上限设为 8,192，因为 pool 装不下一条满上下文请求时 vLLM 会拒绝启动。它还设 `VLLM_USE_FLASHINFER_SAMPLER=0`。在我们的 L4 上，`pip install vllm` 带来的 FlashInfer 0.7.0.post1 sampler 没法用同一次安装的 CUDA 13.4 编译器编过，基准就按贪心采样。

`gb10` 配置的 EAGLE-3 服务器需要 `SGLANG_ALLOW_OVERWRITE_LONGER_CONTEXT_LEN=1`，因为 draft 声明 2,048 token 的上下文，而 target 声明 262,144。kit 会设置它，并写入 `server-eagle3.command.txt`。

GPU 套件的 `--check` 比较每次基准的 token 与请求计数、生成的 token 计数、每条 structured 回答是否合法、temperature 0 单独跑时不同答案的数量、指标名、服务器命令，以及每份服务器日志里的 `max_running_requests` 行。如果没有 Linux、CUDA，以及该配置够用的 GPU 内存，它会打印 `skipped` 及原因并以 0 退出。
