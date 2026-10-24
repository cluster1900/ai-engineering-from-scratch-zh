# 用 radixark/miles 镜像在一块 GPU 上运行 GRPO

> 一个容器、一个小模型和一个启动脚本，大约十分钟就能在单块 GPU 上得到一个有日志记录的 GRPO 步。

我们从一个空文件夹开始，以一个完成并写入日志文件的 GRPO 步结束。模型是 Qwen3-0.6B，数据是 GSM8K，所以训练能放进一块 GPU，每一步只需几分钟。

读完本节后，你能在一块 GPU 上启动 GRPO 训练。你还能找到证明第一步已完成的日志行。

**我们的结果：** 在一块 GB10 上运行 Qwen3-0.6B 的 12 步训练中，第一步耗时 233 s，步耗时中位数为 167 s。

```figure
id: fig-1-1
kind: flow
title: One GRPO step on one GPU
claim: Each step runs rollout, scoring, log probabilities, training, and a weight update, in that order, on one GPU.
caption: Medians of our 48-step run, made before we added the heat guard, so no pause could occur. Qwen3-0.6B on one GB10. The numbers follow the order of the arrows.
```

## 检查你需要什么 {#s-run-grpo-on-one-gpu-check-what-you-need}

你需要一块 NVIDIA GPU、Docker 和 NVIDIA container toolkit。先运行这个检查：

```bash
docker run --rm --gpus all radixark/miles:latest nvidia-smi --query-gpu=name,memory.total --format=csv
```

你应该能看到 GPU 名称。如果 Docker 提示无法选择设备驱动，安装 NVIDIA container toolkit 并重启 Docker。

```listing
title: the GPU check on our machine
source: capture/gpu/out-gb10/gpu-check.txt
lang: text
note: The GB10 shares one memory pool between the CPU and the GPU, so it reports no separate GPU memory.
---
name, memory.total [MiB]
NVIDIA GB10, [N/A]
```

我们的 GPU 是一台 DGX Spark GB10，有 128 GB 共享内存。我们没有测试更小的卡。[第 2.1 节](#s-pick-a-model-size)讲模型规模与内存。

## 拉取镜像并记录你拉取的版本 {#s-run-grpo-on-one-gpu-pull-the-image-and-record-what-you-pulled}

`latest` 标签会变动。在训练之前记录镜像 digest 和 Miles commit，以便日后比较不同的训练。

```bash
docker pull radixark/miles:latest
docker image inspect --format "{{index .RepoDigests 0}} {{.Architecture}}" radixark/miles:latest
docker run --rm --entrypoint git radixark/miles:latest -C /root/miles log -1 --format="%h %cs %s"
docker run --rm --entrypoint /opt/sglang/bin/python3 radixark/miles:latest -c "import sglang;print(sglang.__version__)"
```

```listing
title: the image we ran
source: capture/gpu/out-gb10/image-identity.txt
lang: text
note: The digest, the CPU architecture, the Miles commit, and the SGLang version inside the image.
---
radixark/miles@sha256:c64fa344e3a86715f03c0a1b6a422c474e0035355591a2f6da87bf52a74c52da arm64
08752a1283 2026-10-15 fix(ci): keep host networks out of the builder disk cleanup (#4130)
0.5.22.dev46+g7b6993a
```

这个镜像为 `arm64` 和 `amd64` 构建。它自带一份 SGLang 构建，也就是 rollout 引擎。使用这份构建，不要往镜像里再装一个 SGLang。

## 建一个实验文件夹 {#s-run-grpo-on-one-gpu-make-a-lab-folder}

容器从一个文件夹中读取启动脚本、模型和数据，你把这个文件夹挂载到 `/root/lab`。创建它，并把本手册的启动脚本下载进去：

```bash
mkdir -p ~/miles-lab/runs ~/.cache/huggingface
curl -fsSL -o ~/miles-lab/miles_grpo.py https://raw.githubusercontent.com/rohitg00/ai-engineering-from-scratch/main/manuals/miles-101/capture/gpu/miles_grpo.py
```

如果你有本仓库的克隆，改为在仓库根目录运行 `cp manuals/miles-101/capture/gpu/miles_grpo.py ~/miles-lab/`。第二个文件夹是训练要挂载的模型缓存。如果它不存在，Docker 会以 root 身份创建它，之后在主机上的下载就会失败。

启动脚本第一次运行时，会把 `Qwen/Qwen3-0.6B` 和 `zhuzilin/gsm8k` 数据集下载到这个文件夹。然后它构建 Miles 命令并启动它。

## 读懂启动脚本使用的设置 {#s-run-grpo-on-one-gpu-read-the-settings-the-launcher-uses}

启动脚本向 Miles 传递 36 个参数。其中大多数保持默认值。下面这些决定了训练的形态：

| 参数 | 取值 | 它决定什么 |
|---|---|---|
| `--colocate` | 开启 | 训练器和 rollout 引擎共享同一块 GPU，轮流使用 |
| `--train-backend` | `fsdp` | 训练器使用 PyTorch FSDP。Miles 的默认训练器 Megatron 需要先做 checkpoint 转换 |
| `--rollout-batch-size` | 32 | 每步的 prompt 数 |
| `--n-samples-per-prompt` | 8 | 每个 prompt 的回答数，它们组成一个组 |
| `--global-batch-size` | 256 | 每次 optimizer 更新的样本数，即 32 乘以 8 |
| `--rollout-max-response-len` | 1024 | 最长回答，单位为 token |
| `--rm-type` | `math` | 最终答案正确时 reward 为 1，否则为 0 |
| `--sglang-mem-fraction-static` | 0.4 | rollout 引擎为权重和 KV cache 保留的 GPU 显存比例 |

**组（Group）：** 一个 prompt 在一步中得到的所有回答。GRPO 用每个回答的 reward 与其所在组的平均 reward 相比来打分。

rollout batch size 按 prompt 计数，global batch size 按样本计数。32 个 prompt 各有 8 个回答，一次 rollout 产生 256 个样本，所以每一步做一次 optimizer 更新。

## 给训练添加参数 {#s-run-grpo-on-one-gpu-add-flags-to-a-run}

启动脚本从环境变量读取设置。在 `docker run` 那一行上用 `-e` 设置每一个：

| 变量 | 默认值 | 它设置什么 |
|---|---|---|
| `MILES_NUM_ROLLOUT` | 12 | 步数 |
| `MILES_RUN` | `plain` | 训练名称，用来命名 `runs/` 下存放步事件的文件夹 |
| `MILES_SEED` | 不设置 | 训练器种子和 rollout 种子 |
| `MILES_MODEL` | `Qwen3-0.6B` | 启动脚本下载的 Qwen 模型 |
| `MILES_EXTRA_ARGS` | 空 | 更多 Miles 参数，追加在启动脚本的 36 个参数之后 |

本手册中的每个配方都通过 `MILES_EXTRA_ARGS` 添加参数。例如，下面这行添加了[第 4.4 节](#s-lower-the-logprob-gap)的 top-p 和 top-k 设置：

```bash
-e MILES_EXTRA_ARGS="--rollout-top-p 0.95 --rollout-top-k 64"
```

当一个参数既在启动脚本里、又在 `MILES_EXTRA_ARGS` 里时，以 `MILES_EXTRA_ARGS` 中的值为准，因为 Miles 保留最后一个值。我们引擎显存比例为 0.25 的训练就是这样设置的。有一个例外。设置 `MILES_TRUE_ON_POLICY=1` 时，启动脚本会把它的真正同策略参数追加在 `MILES_EXTRA_ARGS` 之后，所以以这些参数为准。这种模式的 attention backend 要改用 `MILES_SGLANG_ATTENTION` 和 `MILES_FSDP_ATTENTION` 设置。

## 启动训练 {#s-run-grpo-on-one-gpu-start-the-run}

挂载 GPU、实验文件夹和你的模型缓存，运行容器：

```bash
cd ~/miles-lab
docker run --rm --name miles-plain --gpus all --ipc=host --shm-size 32g --ulimit memlock=-1 \
  -v "$HOME/miles-lab:/root/lab" -v "$HOME/.cache/huggingface:/root/.cache/huggingface" \
  -e MILES_NUM_ROLLOUT=12 -e MILES_RUN=plain \
  radixark/miles:latest python /root/lab/miles_grpo.py > runs/plain.log 2>&1
```

我们的 12 步训练在 GB10 上从第一行日志到最后一行共用了 35 分钟。在放手让训练自己运行之前，先在第二个终端里启动[第 1.2 节](#s-add-a-watchdog)的 watchdog。

要提前结束训练，在另一个终端里停掉它的容器：

```bash
docker stop miles-plain
```

给每次训练单独的容器名、`MILES_RUN` 和日志文件，这样两次训练永远不会共用一个日志。

## 读启动日志行 {#s-run-grpo-on-one-gpu-read-the-startup-lines}

在另一个终端里用 `tail -f runs/plain.log` 打开日志。训练先启动 Ray，然后是 rollout 引擎，然后是训练器。下面这些行告诉你每个部分都已启动：

```listing
title: the startup of a colocated run
source: capture/gpu/out-gb10/plain-first-step.log
lang: text
note: Three lines from our 12-step run. The middle of each long line is cut.
---
[2026-10-17 15:53:16.726 launcher] common.py:290 - EXEC: export PYTHONUNBUFFERED=1 && ray start --head --node-ip-address 127.0.0.1 --num-gpus 1 …
(CommandActor pid=2546) [2026-10-17 15:54:38] Load weight end. elapsed=5.85 s, type=Qwen3ForCausalLM, avail mem=94.82 GB, mem usage=1.40 GB.
(CommandActor pid=2546) [2026-10-17 15:54:40] KV Cache is allocated. dtype: torch.bfloat16, #tokens: 345645, K size: 18.46 GB, V size: 18.46 GB
```

引擎加载了 1.40 GB 的权重，并为 345,645 个 token 的 KV cache 留出空间。一步最多需要 256 个各 1,024 token 的回答，再加上它们的 prompt。

如果五分钟内没有出现 `KV Cache is allocated` 行，说明 rollout 引擎没有启动。在它上面的行里找 `Error` 或 `AssertionError`，并参见[第 7.1 节](#s-troubleshoot-by-symptom)。

## 找到第一个完成的步 {#s-run-grpo-on-one-gpu-find-the-first-finished-step}

训练器记录一行 `step 0` 和一行 `perf 0` 时，一步就结束了。搜索它们：

```bash
grep -c " - step [0-9]*: {" runs/plain.log
```

这个计数就是已完成的步数。我们的第一步记录了这些行：

```listing
title: the first step, from rollout to timers
source: capture/gpu/out-gb10/plain-first-step.log
lang: text
note: Each line is cut to the fields that this section uses.
---
(FSDPTrainRayActor pid=2551) [2026-10-17 15:56:48.271 actor_cell00000_rank00000] log_utils.py:125 - rollout 0: {'rollout/response_lengths': 739.92578125, … 'rollout/raw_reward': 0.62890625, …
(FSDPTrainRayActor pid=2551) [2026-10-17 15:58:15.687 actor_cell00000_rank00000] log_utils.py:554 - step 0: { … 'train/train_rollout_logprob_abs_diff': 0.015336457639932632, …
(FSDPTrainRayActor pid=2551) [2026-10-17 15:58:15.688 actor_cell00000_rank00000] perf.py:56 - perf 0: {'perf/sleep_time': 2.1116080284118652, … 'perf/update_weights_time': 0.6647534370422363, … 'perf/step_time': 233.29494333267212, …
```

在这次 12 步训练中，第一步耗时 233 s，步耗时中位数为 167 s。在一个典型步中，rollout 耗时 57 s，训练阶段耗时 105 s，其中 25 s 用于计算 log probability。从训练器到引擎的权重更新耗时 0.65 s。

本页的两张图使用的是同一配置的 48 步训练。它的步耗时中位数为 152.6 s，rollout 中位数为 47.5 s。它后面的步写出的回答更短，所以中位数更低。

[第 1.3 节](#s-read-your-first-ten-steps)讲解如何在前十步中解读这些数字。
```figure
id: fig-1-1b
kind: chart
title: Where the time of one step goes
claim: Training and rollout take almost all of a step, and the hand-offs take about 2 s.
caption: Median seconds per phase over our 48-step run, made before we added the heat guard. The log-probability pass and the gradient step together make the training phase.
```


```takeaways
- 每次训练前记录镜像 digest 和 Miles commit。
- rollout batch 按 prompt 设置，global batch 按样本设置。
- 先等到 KV cache 那一行出现，再相信引擎已经启动。
- 用日志中的 step 行统计已完成的步数。
```

Sources: capture/gpu/miles_grpo.py; capture/gpu/out-gb10/gpu-check.txt; capture/gpu/out-gb10/image-identity.txt; capture/gpu/out-gb10/plain-first-step.log; capture/gpu/summary/miles-gb10-lab.json (runs.plain); Miles arguments at main 08752a12.
