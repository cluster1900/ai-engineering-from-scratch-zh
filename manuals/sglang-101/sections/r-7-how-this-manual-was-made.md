# 这本手册是怎么做成的

> 本页记录版本、源、机器，以及手册里每条事实和每个数字背后的捕获套件。

## 版本 {#s-ref-how-this-manual-was-made-the-version}

手册钉住 SGLang 0.5.22，于 2026-10-13 打标签，提交 `baa9befa381511cd4d56f83980951e5a45fffc6d`。事实在 2026-10-16 核实。SGLang 大约每三周发一版，0.5.20 到 0.5.22 之间改过好些默认值。为旧版本写的配方在这一版上可能错，各节会标明哪里。

## 源，按权威排序 {#s-ref-how-this-manual-was-made-the-sources-ranked}

事实来自七类源，按权威排序。两类冲突时，更高的赢，正文也会说明。

| 等级 | 源 | 手册从中取用 | 引用为 |
|---|---|---|---|
| 1 | 钉住标签上的 SGLang 源码，`baa9befa` | 每一个默认值和每一种机制 | 各节 Sources 行里的文件列表 |
| 2 | [Mac 上](manuals/sglang-101/capture/out)和 [GPU 上](manuals/sglang-101/capture/gpu)的捕获运行 | 每一段 listing 和每一个标成测得的数字 | 捕获文件名 |
| 3 | SGLang 的 issue 与 pull request | 事故，以及每个特性的设计史 | `issue` 及其编号 |
| 4 | 论文 | RadixAttention 的原始设计，以及 SGLang 实现的方法 | `paper` 与标题 |
| 5 | 钉住标签上的 SGLang 文档 | 文档行为，对照代码核实 | `docs` 与标题 |
| 6 | 独立现场报告 | 我们跑不了的 GPU 配置，例如一台服务器很多块 GPU | `field`、作者与月份 |
| 7 | SGLang 团队与厂商报告 | 主张，一律标成作者的主张 | `team` 或厂商，以及月份 |

文档故意排在代码之下。在 0.5.22，文档仍列出代码已删的两种 attention backend。它给的 HiCache prefetch 超时也与代码不同。我们说默认值，指的是代码设的值。

## 四种证据 {#s-ref-how-this-manual-was-made-four-kinds-of-evidence}

手册里每一个数字在正文里都带下面四种标签之一。

**我们测到：** 数字来自我们在 [Mac 上](manuals/sglang-101/capture/out)或 [GPU 上](manuals/sglang-101/capture/gpu)的运行，记在下表那些机器上。你可以跑套件拿到同样的事实。

**代码：** 默认值或机制来自钉住标签上的 SGLang 源码。Sources 行列出文件。

**现场报告：** SGLang 团队之外的工程师或公司跑了 SGLang 并发表结果。正文点名他们、月份、他们陈述时的版本，以及他们调了什么。

**团队报告** 或 **厂商报告：** SGLang 团队、RadixArk 或硬件厂商发表的数字。我们按他们的主张复述，并在有独立结果时对照。

DeepEP 和跨很多 GPU 的 prefill-decode 拆分需要我们没有的硬件。那些节由代码和现场报告撑起论证，标签也会说明。

## 捕获套件 {#s-ref-how-this-manual-was-made-the-capture-kit}

[捕获套件](manuals/sglang-101/capture) 通过 MLX 后端在 Apple silicon 上启动真正的 SGLang 服务器。它发请求、跑官方基准，并把看到的写到 [输出目录](manuals/sglang-101/capture/out)。`python3 capture/run.py` 记录一切。`python3 capture/run.py --check` 再记到临时目录，并比较不得变的事实。那些事实是 temperature 0 下生成的文本、token 与 cached-token 计数，以及请求计数。每个 token 的 KV 字节数和指标名也是事实。

计时每次都会变，所以检查不比较它们。

套件需要带 MLX extra 的 SGLang 0.5.22，跑在 Apple silicon 上，因此不能在仓库 CI 里跑。没有那套环境时，`--check` 打印 `skipped` 和原因并以 0 退出。Mac 运行的每个文件都记在同一台机器上：

| 项 | 值 |
|---|---|
| 主机 | 一台 Apple silicon 笔记本，macOS 26.2，build 25C56，arm64 |
| SGLang | 0.5.22，从标签安装，带 `srt_mps` extra |
| Frameworks | PyTorch 2.13.0，MLX 0.32.4，Python 3.12.12 |
| 模型 | `mlx-community/Qwen3-0.6B-4bit` |
| 服务器旗标 | `SGLANG_USE_MLX=1`，`--disable-cuda-graph`，`--enable-cache-report`，`--enable-metrics`，`--mem-fraction-static 0.4` |
| 录制于 | 2026-10-16 |

套件启动四台服务器：默认配置、一台关掉 radix cache、一台关掉 overlap scheduler，以及一台 4,096 token 的 pool。关掉 overlap scheduler 的服务器在 0.5.22 的第一批真实 batch 上崩溃了，套件故意记下那次崩溃。[第 2.4 节](#s-the-overlap-scheduler) 读它。

## GPU 套件 {#s-ref-how-this-manual-was-made-the-gpu-kit}

[GPU 套件](manuals/sglang-101/capture/gpu) 在 NVIDIA GPU 上跑同一思路。[它的 run 脚本](manuals/sglang-101/capture/gpu/run.py) 启动八种服务器配置，并写入 [GB10 运行日志](manuals/sglang-101/capture/gpu/out-gb10)。[sweep 脚本](manuals/sglang-101/capture/gpu/sweep.py) 用三个 seed 重复每个基准点，并记录每次运行的 GPU 时钟和温度。[summary 脚本](manuals/sglang-101/capture/gpu/summarize.py) 为每台机器写一份摘要：[GB10 摘要数据](manuals/sglang-101/capture/gpu/summary/gb10.json)、[L4 摘要数据](manuals/sglang-101/capture/gpu/summary/l4.json)，以及 [被限速的 L4 摘要数据](manuals/sglang-101/capture/gpu/summary/l4-throttled.json)。[Miles summary 脚本](manuals/sglang-101/capture/gpu/summarize_miles.py) 写入 [Miles 摘要数据](manuals/sglang-101/capture/gpu/summary/miles-gb10.json)。图表读这四个文件。

下面每一行是 GPU 套件的一次 sweep。链接打开它的摘要文件，各节给出它用到的那些运行的日期和时钟。

```lab-runs
```

每一份 GB10 运行日志和 GB10 摘要数据都记在同一台机器上：

| 项 | 值 |
|---|---|
| 主机 | 一台 NVIDIA DGX Spark，Ubuntu 24.04，aarch64 |
| GPU | NVIDIA GB10，compute capability 12.1，121.7 GiB 与 CPU 共享的内存 |
| SGLang | 来自 PyPI 的 0.5.22，sglang-kernel 0.4.9，flashinfer 0.7.1 |
| Frameworks | PyTorch 2.14.1+cu130，CUDA 13.0，驱动 580.159.03，Python 3.12.3 |
| Models | `Qwen/Qwen3-30B-A3B-Instruct-2507`、它的 FP8 检查点，以及 EAGLE-3 draft `lmsys/SGLang-EAGLE3-Qwen3-30B-A3B-Instruct-2507-SpecForge-Nex` |
| 服务器旗标 | `--enable-cache-report`，`--enable-metrics`，`--mem-fraction-static 0.7` |
| 录制于 | 2026-10-16 |

套件还有一个在 NVIDIA L4 上跑 Qwen3-8B 的 `l4` profile，写出了 [L4 运行日志](manuals/sglang-101/capture/gpu/out-l4) 和 [L4 摘要数据](manuals/sglang-101/capture/gpu/summary/l4.json)。第 1 部分用那台 L4 服务器做 listing。我们第一次 L4 sweep 跑热并被限速，[第 5.1 节](#s-sglang-benchmark-serving) 把它当事故讲。随后我们在每次运行前把 L4 冷却到 72°C 再跑。[第 4.3 节](#s-quantization)、[第 4.4 节](#s-speculative-decoding) 和第 5.1 节用那些运行，第 5.1 节还显示冷却后的卡在长负载下仍会降时钟。

## 约定 {#s-ref-how-this-manual-was-made-conventions}

每条命令都用 `sglang serve` 启动服务器。更旧的 `python -m sglang.launch_server` 在 0.5.22 仍可用，并打印弃用警告。端口是默认的 `30000`。记录输出里的 `~` 表示家目录。

引用点名一个位置。`{{issue #35129}}` 点名 SGLang 仓库里的一个 issue。`{{field Jarvislabs 2026-05}}` 按作者和月份点名一份现场报告，正文会链过去。一节所依据的 SGLang 源文件只列一次，在节末 Sources 行。listing 原样复制捕获文件的行，`…` 标出 note 解释的裁剪。

网页上的图会动，Replay 按钮再跑一遍步骤。打印和减少动效显示最后一帧。

Sources: manual.json; capture/README.md; capture/run.py; capture/gpu/run.py, capture/gpu/sweep.py, capture/gpu/summarize.py, capture/gpu/summarize_miles.py, capture/gpu/out-gb10/environment.json, capture/gpu/out-l4/environment.json; capture/out/environment.json, server-no-overlap.log.
