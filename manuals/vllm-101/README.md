# vLLM 101

本手册讲解 vLLM 0.31.0，从你的第一个服务器讲到一个你能规划规模、调优和调试的部署，每个决定都有实测的答案。文档告诉你每个 flag 做什么。本手册告诉你哪些 flag 对你的 GPU 和流量重要，以及我们改动它们后发生了什么。网页版在 [aiengineeringfromscratch.com/manual-vllm-101.html](https://aiengineeringfromscratch.com/manual-vllm-101.html)，课程的每个 release 都会附上 PDF `aiefs-manual-vllm-101.pdf`。

## 内容

- 8 个部分共 44 节，之后是八个参考节。第 1 到 7 部分按你的工作顺序排列。你先启动服务器，规划规模，按流量调优，再加上提速功能。然后你测量它，横向扩展它，运维和调试它。第 8 部分讲解 vLLM 的内部原理，供某个默认值让你意外时查阅。
- 每页回答一个问题，并以一个证明改动有效的检查结尾。
- 每个实测数字都注明机器、日期、时钟和种子数。我们无法测量的页面会说明这一点。
- 一张封面图和 26 张用 figure kit 绘制的图，其中的图表根据 GPU 运行绘制。
- 一个参考部分，包含 flag 表、指标，以及手册引用的 GitHub issue 索引。它还有版本锁定、术语表、来源，以及带完整表格的实验记录。

## 文件

| 路径 | 内容 |
|---|---|
| `manual.json` | 清单：版本锁定、各部分、配色、来源、封面图 |
| `front.md`, `sections/` | 正文，每节一个文件 |
| `figures/src/` | 图的源文件，构建为 `figures/*.svg` |
| `capture/gpu/summary/` | 表格和图表读取的 GPU 扫描摘要：`l4.json`、`l4-gpu1.json`、`gb10.json` |
| `capture/gpu/out-l4/`, `capture/gpu/out-gb10/` | 代码清单所截取的服务器日志和实时检查 |
| `capture/gpu/incidents/` | 故障排查页面展示的故障日志 |

## 版本锁定

| 项目 | 值 |
|---|---|
| vLLM | 0.31.0，commit `db9527a46873454610df6dbedf79a36d6bf1a7f6`，发布于 2026-10-05 |
| CUDA wheel 要求的 PyTorch | 2.13.0 |
| 核实日期 | 2026-10-22 |

## 录制主机

| 项目 | NVIDIA L4 | DGX Spark |
|---|---|---|
| GPU | NVIDIA L4，compute capability 8.9，24 GB | NVIDIA GB10，compute capability 12.1，128 GB 统一内存 |
| CPU 架构 | x86_64 | aarch64 |
| 驱动 | 615.71.09 | 580.159.03 |
| vLLM 的运行方式 | 虚拟环境中的 pip wheel | 镜像 `vllm/vllm-openai:v0.31.0` |
| 模型 | `Qwen/Qwen3-8B`、它的 FP8 checkpoint，以及 EAGLE3 draft `Tengyunw/qwen3_8b_eagle3` | `Qwen/Qwen3-30B-A3B-Instruct-2507` |

L4 的时钟随温度和节点上的其他任务变化，因此前言把 L4 运行分成四个时段。只在同一个时段内比较两个 L4 数字。

## 如何阅读

从前言“如何阅读本手册”开始。它给出启动服务器的五条命令，然后是各部分的顺序和四个 L4 时段。完整地读一遍第 1 部分。之后，直接去回答你问题的那一页。用[实验记录](https://aiengineeringfromscratch.com/manual-vllm-101.html#s-ref-lab-notes)核对数字或重复运行。

## 重新运行扫描

GPU 运行来自 SGLang 101 的扫描工具 `manuals/sglang-101/capture/gpu/sweep.py`。它为每台机器提供一个 profile，为每张表提供一个 vLLM 配置。它需要一块 NVIDIA GPU、vLLM 0.31.0 和 SGLang 0.5.22 的 benchmark 客户端。[实验记录](https://aiengineeringfromscratch.com/manual-vllm-101.html#s-ref-lab-notes)给出种子、服务器设置、池大小和时钟规则。[benchmark 页面](https://aiengineeringfromscratch.com/manual-vllm-101.html#s-benchmark-your-server-in-15-minutes)打印完整的客户端命令。

本手册没有离线 capture 检查。`capture/gpu/` 中存储的日志和摘要就是记录，audit 会对照它们检查每个代码清单。

## 构建与检查

在仓库根目录下运行：

```bash
node manuals/_shared/figkit.js build manuals/vllm-101
node site/build-manuals.js
node scripts/audit_manuals.js --manual vllm-101
```

audit 必须报告 `TOTAL 0`。契约见 [manuals/AUTHORING.md](../AUTHORING.md)。
