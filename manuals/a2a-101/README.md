# A2A 101

本手册讲解 v1.0.1 版 Agent2Agent 协议，从它的用途讲到每个请求和响应。网页版在 [aiengineeringfromscratch.com/manual-a2a-101.html](https://aiengineeringfromscratch.com/manual-a2a-101.html)，课程的每个 release 都会附上 PDF `aiefs-manual-a2a-101.pdf`。

## 内容

- 7 个部分共 28 节：一页讲清协议、AgentCard、数据模型、操作、绑定、安全与扩展，以及实现 A2A。之后是七个参考节。
- 31 张图，用 figure kit 根据 capture 文件绘制。它们在网页上有动画，印刷版中是静态的。
- `capture/` 中的 capture kit：三个 agent 和一个 planner，用 Python 编写，没有依赖。手册中的每个代码清单都来自 `capture/out/` 中的一个文件。
- 一份登记表，列出规范、proto、文档和参考 SDK 之间的 40 处冲突，以及每处冲突在上游的状态，另有写作时发现的 20 处差异。
- 对 Python、JavaScript、Java、Go、.NET 和 Rust SDK 的 14 种行为的比较，以及用官方测试套件测试 capture kit 的一次运行。

## 文件

| 路径 | 内容 |
|---|---|
| `manual.json` | 清单：版本锁定、各部分、配色、来源 |
| `front.md`, `sections/` | 正文，每节一个文件 |
| `figures/src/` | 图的源文件，构建为 `figures/*.svg` |
| `capture/` | kit 及其录制的输出（在 `capture/out/` 中） |
| `research/sources/` | v1.0.1 版的规范、proto 和文档页面的副本，附带其许可证 |
| `research/*.md` | 各节引用的事实摘要和研究笔记 |

## 运行 kit

```bash
cd manuals/a2a-101
python3 capture/run.py --check
```

检查会在端口 41241 到 41243 上启动三个 agent，重放每次录制的交互，并报告 `capture/out/` 中的每个文件是否仍然一致。运行 `python3 capture/run.py` 可以重新录制这些文件。`capture/README.md` 介绍了每个 agent，以及 kit 与参考 SDK 的不同之处。

## 构建与检查

在仓库根目录下运行：

```bash
node manuals/_shared/figkit.js build manuals/a2a-101
node site/build-manuals.js
node scripts/audit_manuals.js --manual a2a-101
```

audit 必须报告 `TOTAL 0`。契约见 [manuals/AUTHORING.md](../AUTHORING.md)。
