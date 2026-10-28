# 如何阅读本手册

> 安装 SGLang，部署你的模型，再弄清对你的流量真正重要的那几个设置，以及我们改动它们时测到的数字。

本手册写给想在本周把开源模型跑上自己 GPU 的工程师。它从一台能应答的服务器开始，到一支你能量化并运维的机群结束。

这些命令会建好环境、安装 SGLang、启动服务器，并给它发一条请求：

```bash
uv venv --python 3.12
source .venv/bin/activate
uv pip install --prerelease=allow "sglang==0.5.22"
sglang serve --model-path Qwen/Qwen3-8B --host 127.0.0.1 --port 30000 \
  --enable-cache-report --enable-metrics --mem-fraction-static 0.85
curl -s http://127.0.0.1:30000/generate -H 'Content-Type: application/json' \
  -d '{"text": "The capital of France is", "sampling_params": {"max_new_tokens": 12, "temperature": 0}}'
```

[第 1.1 节](#s-install-sglang-and-serve-your-first-model) 逐步跑它们，并给出每步该看到的输出以及常见错误的修法。我们在一块 NVIDIA L4 上用 SGLang 0.5.22 跑了 uv 安装和服务器命令。Apple silicon 步骤来自我们的 Mac 运行，Docker 命令跟的是 SGLang 安装页。本手册里每个实测数字都会点名来源机器：一块 NVIDIA L4、一台 NVIDIA DGX Spark，或那台 Mac。

## 读完本手册后你能做什么 {#s-front-what-you-can-do-after-this-manual}

- 安装 SGLang，部署一个模型，并在大约十分钟内从它的两套 API 拿到第一个答案。
- 为你的 GPU 划定 KV pool，并修好内存不足的服务器。
- 按你的流量调优服务器：共享 prompt、长文档、多用户，或 FP8。
- 给你自己的服务器做基准，并用它的指标在生产里盯着它。
- 选择如何扩到多块 GPU，并在相信一份公开基准之前先评判它。

## 本手册写给谁 {#s-front-who-this-manual-is-for}

你已经通过 API 调用过模型，现在想自己服务一个开源模型。你知道 token 和 GPU 是什么。你还没有调过服务引擎，想在为设置付钱之前知道哪些才重要。

`sglang serve --help` 在 0.5.22 列出 535 个选项。SGLang 文档把它们各自描述清楚了。本手册告诉你第一天该改哪些，以及哪些默认值假定了你并没有的机器。它还展示我们在 GPU 上改动每一项时发生了什么。

## 各部分的顺序 {#s-front-how-the-parts-are-ordered}

第 1 部分启动服务器并检查它。第 2 部分跟着一次请求穿过各个进程和调度器。第 3 部分是 KV cache，它决定一块 GPU 服务多少用户。

第 4 部分让每次前向更快，第 5 部分测量一台服务器。第 6 部分把一个模型铺到多块 GPU 上。第 7 部分运维 SGLang，并以强化学习收尾。参考里放查找表以及 [本手册是怎么写成的](#s-ref-how-this-manual-was-made)：

```parts
```

每一节都以「我们的立场」收尾，说明该做什么，并附上一小份行动清单。今天就要答案时先读那些。想知道理由时再读其余部分。

有七课把本手册用到的想法讲得更深。[服务内部一课](phases/17-infrastructure-and-production/04-vllm-serving-internals) 搭建 paged attention 和 continuous batching。[Goodput 一课](phases/17-infrastructure-and-production/08-inference-metrics-goodput) 定义指标。[Speculative decoding 一课](phases/17-infrastructure-and-production/05-eagle3-speculative-decoding) 搭建 EAGLE-3，[量化一课](phases/17-infrastructure-and-production/09-production-quantization) 覆盖格式。[服务选型一课](phases/17-infrastructure-and-production/28-self-hosted-serving-selection)、[推理优化一课](phases/10-llms-from-scratch/12-inference-optimization) 和 [prompt 缓存一课](phases/11-llm-engineering/15-prompt-caching) 凑齐这一组。本手册只跟 SGLang 走。

## 图里的颜色 {#s-front-colour-in-figures}

每种色相在每张图里保持一种含义：

```palette
```

[图 0.1](#fig-0-1) 用我们 capture 里的交换教你箭头样式。

```figure
id: fig-0-1
kind: sequence
title: reading a sequence figure in this manual
claim: Each arrow style marks one kind of exchange, and every label is a real name, message, or number from our recorded runs.
caption: Read each numbered row from the tail of the arrow to its head, and the note under each label names the style. From capture/out/cache-experiment.txt, server-default.log, and the out-of-memory run in section 3.2.
```

Sources: manual.json; capture/gpu/out-l4/server-default.command.txt, capture/gpu/out-l4/generate.txt; capture/out/serve-help.txt, cache-experiment.txt, server-default.log; docs/docs/get-started/install.mdx at v0.5.22.
