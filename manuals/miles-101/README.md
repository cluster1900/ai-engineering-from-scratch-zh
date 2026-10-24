# Miles 101

本手册讲解用 Miles 对语言模型做强化学习，从在一块 GPU 上运行一次 GRPO 讲到一次你能信任的运行。手册先让运行跑起来，然后讲如何规划它的规模、检查它是否正确，以及在它失败时找到原因。网页版在 [aiengineeringfromscratch.com/manual-miles-101.html](https://aiengineeringfromscratch.com/manual-miles-101.html)，课程的每个 release 都会附上 PDF `aiefs-manual-miles-101.pdf`。

## 内容

- 8 个部分共 34 节，之后是五个参考节。第 1 部分在一块 GPU 上运行 GRPO，加上 watchdog，并读懂前十步。第 2 部分规划运行规模，第 3 部分给出配方，第 4 部分讲速度和稳定性。第 5 部分检查运行，第 6 部分横向扩展，第 7 部分调试，第 8 部分讲解 Miles 的内部原理。
- 每一行实测结果都来自在一台 DGX Spark 上录制的运行，每页都说明结果的适用范围。一块 GPU 无法展示的内容，页面会说明哪些只是我们从源码中读到的。
- 一张封面图和 18 张用 figure kit 根据运行和代码绘制的图。
- `capture/` 中的 capture kit，不需要 GPU 即可检查存储的输出。
- `capture/gpu/` 中的 GPU kit，在 DGX Spark 上启动运行。

## 文件

| 路径 | 内容 |
|---|---|
| `manual.json` | 清单：版本锁定、各部分、配色、来源、封面图 |
| `front.md`, `sections/` | 正文，每节一个文件 |
| `figures/src/` | 图的源文件，构建为 `figures/*.svg` |
| `capture/run.py` | capture kit：`--check` 比较存储的输出，不带参数运行则根据原始运行日志重建摘要 |
| `capture/gpu/` | GPU kit：`miles_grpo.py` 启动运行，`watchdog.sh` 停止引擎已退出的运行，`heat-guard.sh` 在 GPU 过热时暂停容器，`summarize_miles.py` 写出摘要 |
| `capture/gpu/out-gb10/`, `capture/gpu/out-l4/` | 代码清单所截取的日志和检查 |
| `capture/gpu/summary/miles-gb10-lab.json` | 表格和图表读取的逐步数据和中位数 |

## 版本锁定

| 项目 | 值 |
|---|---|
| 镜像 | `radixark/miles@sha256:c64fa344e3a86715f03c0a1b6a422c474e0035355591a2f6da87bf52a74c52da`，arm64 |
| 镜像中的 Miles | main `08752a1283`，2026-10-15 |
| 镜像中的 SGLang | `0.5.22.dev46+g7b6993a` |
| 核实日期 | 2026-10-22 |

## 录制主机

| 项目 | 值 |
|---|---|
| 机器 | NVIDIA DGX Spark，一块 GB10 GPU，128 GB 由 CPU 与 GPU 共享的内存 |
| 模型 | `Qwen/Qwen3-0.6B`，除非运行名给出了其他规模 |
| 数据 | GSM8K prompt，配合二值数学奖励 |
| 训练器 | 一块 GPU 上的 FSDP，与 SGLang 引擎共置 |

GB10 在数小时的负载下会变热，因此 heat guard 在 84 C 时暂停容器。耗时数字来自没有被任何暂停影响的干净步，或来自加上 heat guard 之前的运行。有两次 logprob 检查是在 NVIDIA L4 上用 Miles 镜像之外的 SGLang 0.5.22 运行的，它们的文件注明了这一点。

## 如何阅读

从前言“如何阅读本手册”开始。它给出首次运行的五条命令，以及会改变你做法的五个结果。它还定义了三个术语：heat guard、暂停和干净步。运行第 1.1 节时，在第二个终端里运行第 1.2 节的 watchdog，因为引擎已退出的运行不会自己停止。用[实验记录](https://aiengineeringfromscratch.com/manual-miles-101.html#s-ref-lab-notes)核对数字或重复运行。

## 运行 kit

```bash
cd manuals/miles-101
python3 capture/run.py --check
```

检查不需要 GPU，也不需要网络。它用 16 个答案那次运行存储的错误时间重放 watchdog 规则。它根据暂停日志标出暂停，并根据存储的步计算每个中位数。然后它检查每个引用的值是否仍在其文件中。原始运行日志留在 DGX Spark 上。没有它们时，检查会对新摘要打印 `skipped`，只比较存储的输出。把 `MILES_LAB_RUNS` 设为一个包含 `status.txt` 的运行文件夹，就能同时重建摘要并进行比较。用这个文件夹运行 `python3 capture/run.py` 会替换存储的摘要和暂停日志。

## 构建与检查

在仓库根目录下运行：

```bash
node manuals/_shared/figkit.js build manuals/miles-101
node site/build-manuals.js
node scripts/audit_manuals.js --manual miles-101
```

audit 会运行 capture 检查。它必须报告 `TOTAL 0`。契约见 [manuals/AUTHORING.md](../AUTHORING.md)。
