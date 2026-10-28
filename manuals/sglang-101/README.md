# SGLang 101

SGLang 0.5.22，从笔记本上的一次请求到一群 GPU，补上旗标列表没写明的判断。文档会告诉你 `sglang serve` 的 535 个选项各自做什么。本手册告诉你哪些才重要、每个功能为什么存在、哪些默认值假定了你并没有的机器，以及我们改动它们时测到了什么。网页版在 [aiengineeringfromscratch.com/manual-sglang-101.html](https://aiengineeringfromscratch.com/manual-sglang-101.html)。每个课程发行版会附上 PDF，文件名为 `aiefs-manual-sglang-101.pdf`。

## 里面有什么

- 7 个部分共 29 节，外加七节参考。第 1 部分安装 SGLang、检查服务器，并跟着一次请求穿过它。第 2 部分跟着一次请求穿过三个进程和调度器。第 3 部分是 KV cache。第 4 部分让每次前向更快，第 5 部分测量一台服务器。第 6 部分把一个模型铺到多块 GPU 上，第 7 部分运维 SGLang，并以 SGLang 作为 Miles 的 rollout 引擎收尾。
- 每一节讲同一个故事：代价、显而易见的修法以及它为什么失败、SGLang 做了什么、该测什么、我们对默认值的立场，以及一起真实事故和它的链接。
- 每个数字都带四种标签之一：我们测到的、代码、SGLang 团队之外工程师的现场报告，或团队或厂商的声明。
- 一张封面、63 张用 figure kit 根据 capture 与代码画出的图，以及根据 GPU 运行绘制的图表。
- `capture/` 里的 capture kit：在 Apple silicon 上通过 MLX 启动真实服务器，发送请求，跑官方基准，并把看到的内容写到 `capture/out/`。
- `capture/gpu/` 里的 GPU 套件：在一块 NVIDIA GPU 上跑八种服务器配置和三种子的基准扫描，并记录每次运行的 GPU 时钟与温度。

## 文件

| 路径 | 内容 |
|---|---|
| `manual.json` | 清单：钉选、各部分、调色板、源，以及封面 |
| `front.md`, `sections/` | 正文，每节一个文件 |
| `figures/src/` | 图源，构建到 `figures/*.svg` |
| `capture/` | kit 及其录制输出，在 `capture/out/` |
| `capture/gpu/` | GPU 套件、其输出在 `capture/gpu/out-gb10/`，以及图表数据在 `capture/gpu/summary/` |

## 版本钉

| 项 | 值 |
|---|---|
| SGLang | 0.5.22，标签 `v0.5.22`，提交 `baa9befa381511cd4d56f83980951e5a45fffc6d`，打标于 2026-10-13 |
| Miles | v0.1.2，提交 `a22fd824`，仅用于第 7.2 节 |
| 已验证 | 2026-10-16 |

## 录制主机

| 项 | 版本 |
|---|---|
| 主机 | macOS 26.2，Apple silicon，arm64 |
| SGLang | 0.5.22，来自带 `srt_mps` extra 的标签 |
| 框架 | PyTorch 2.13.0，MLX 0.32.4，Python 3.12.12 |
| 模型 | `mlx-community/Qwen3-0.6B-4bit` |

GPU 运行录在一台 NVIDIA DGX Spark 上，一块 GB10（compute capability 12.1，aarch64），SGLang 0.5.22 来自 PyPI，PyTorch 2.14.1+cu130，CUDA 13.0，模型为 `Qwen/Qwen3-30B-A3B-Instruct-2507` 及其 FP8 checkpoint。`capture/README.md` 说明如何跑 GPU 套件。

## 运行 kit

```bash
cd manuals/sglang-101
python3 capture/run.py --check
```

用 SGLang 环境里的 Python 来跑。检查会再次启动同样的四台服务器，记录到临时目录，并比较不得改变的事实：temperature 0 时的文本、token 与 cached-token 计数、请求计数、每个 token 的 KV 字节数、指标名，以及选项列表。如果没有 SGLang 0.5.22 和 Apple silicon 上的 MLX，检查会打印 `skipped` 及原因并以 0 退出。完整跑一遍要约 20 到 25 分钟，`capture/README.md` 列出它写入的每个文件。

## 构建与检查

在仓库根目录：

```bash
node manuals/_shared/figkit.js build manuals/sglang-101
node site/build-manuals.js
node scripts/audit_manuals.js --manual sglang-101
```

在装好 kit 的主机上，审核会跑 capture 检查，大约 25 分钟。传 `--skip-capture` 可跳过。审核必须报告 `TOTAL 0`。约定见 [manuals/AUTHORING.md](../AUTHORING.md)。
