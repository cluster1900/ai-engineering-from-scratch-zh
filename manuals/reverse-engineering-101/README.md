# Reverse Engineering 101

rea，也就是 6.7.0 的 `rea-agents` 包，配 Ghidra 12.1.4 provider，从第一次 `rea doctor` 到一个在 MCP 上维护证据台账的 agent。网页版在 [aiengineeringfromscratch.com/manual-reverse-engineering-101.html](https://aiengineeringfromscratch.com/manual-reverse-engineering-101.html)。每个课程发行版会附上 PDF，文件名为 `aiefs-manual-reverse-engineering-101.pdf`。

## 里面有什么

- 8 个部分共 26 节，外加六节参考。第 1 部分把 rea 放进一页，第 2 部分讲分析权与安装，第 3 到 5 部分讲工件、Ghidra provider 与 Evidence 记录，第 6 部分讲 JavaScript 与 WASM，第 7 部分证明重建相等，第 8 部分从 agent 驱动 rea。
- 一张封面，以及图表索引列出的那些图，用 figure kit 从捕获文件画出。它们在网页上会动，打印时显示最后一帧。
- `capture/` 里的 capture kit，只用 Python 标准库。它跑真实的 `rea` 命令行及其带 Ghidra 的 MCP 服务器，并把返回内容写到 `capture/out/`。
- 从 `capture/out/` 裁出的 listing，以及对照钉住标签上的 rea README 与文档核对过的引用。
- 为本手册写的四个 fixture 程序：带四个函数的 `ledger.c`、`ledger-main.c`、一个六文件 JavaScript 应用，以及一个 WebAssembly 文本模块。fixture 里还有一份 rea 6.5.0 写出的 Evidence bundle，以及两个给 `rea setup` 用的小型 Claude Code 配置文件。

## 文件

| 路径 | 内容 |
|---|---|
| `manual.json` | 清单：钉选、各部分、调色板、源，以及封面 |
| `front.md`, `sections/` | 正文，每节一个文件 |
| `figures/src/` | 图源，构建到 `figures/*.svg` |
| `capture/` | 套件、其 fixture，以及录制输出在 `capture/out/` |
| `examples/` | `mcp-registration.json`，第 8.1 节列出的 MCP 注册 |

## 版本钉

| 项 | 值 |
|---|---|
| rea | `rea-agents` 6.7.0，发布于 2026-10-18，标签 `rea-agents-6.7.0`，提交 `27dc42d10249f0410904a75c0997842eb03b931c` |
| Ghidra | 12.1.4 PUBLIC，构建于 2026-Sep-21 |
| JDK | OpenJDK 21.0.12.1 |
| 已验证 | 2026-10-18 |

Release 6.7.0 包含 6.6.0 的改动，后者打了标签但未发布到 npm。WebAssembly 与 Go provider、raw-binary 格式，以及 `DISCLAIMER.md` 出现在 6.5.0。本手册每一条主张都描述 6.7.0，每一次捕获也都用它重新录过。

## 录制主机

套件录在一台装 macOS 26.2 的 Apple silicon Mac 上，版本如下：

| 项 | 版本 |
|---|---|
| rea | 来自 npx 缓存的 `rea-agents` 6.7.0，Node 22.22.0 |
| Ghidra | 来自 Homebrew 的 12.1.4，`GHIDRA_INSTALL_DIR=/opt/homebrew/Cellar/ghidra/12.1.4/libexec` |
| JDK | 来自 Homebrew 的 OpenJDK 21.0.12.1，`JAVA_HOME=/opt/homebrew/opt/openjdk@21` |
| clang | Apple clang 17.0.0 |
| WABT | 来自 Homebrew 的 1.0.42。`inspect-wasm-artifact` 通过 `REA_WABT_BIN_DIRECTORY` 跑其工具。 |

## 跑套件

```bash
cd manuals/reverse-engineering-101
python3 capture/run.py --check
```

检查会再捕获到临时目录。然后在掩去时间戳、时长、run id、临时路径和进程 id 之后，把每个文件与 `capture/out/` 比较。若缺少 rea 6.7.0、Ghidra 12.1.4 或 JDK 21，检查会打印 `skipped` 和原因并以 0 退出。在录制主机上完整跑一遍大约 125 秒，`capture/README.md` 列出它写出的每个文件和做的每一次裁剪。

跑 `python3 capture/run.py` 可重新录制文件，跑 `python3 capture/run.py --build-fixtures` 可重建 fixture 二进制。换一个 clang 会改可执行文件和目标文件，随之改掉 `capture/out/` 里每一个 SHA-256、`evidence_id` 和 bundle digest，所以重建需要一次新录制。

## 构建与检查

从仓库根目录：

```bash
node manuals/_shared/figkit.js build manuals/reverse-engineering-101
node site/build-manuals.js
node scripts/audit_manuals.js --manual reverse-engineering-101
```

在装有 rea、Ghidra 和 JDK 的主机上，审计会跑完整捕获检查，大约两分钟。设 `AIEFS_CAPTURE_SKIP=1` 可跳过该检查。审计必须报告 `TOTAL 0`。契约见 [manuals/AUTHORING.md](../AUTHORING.md)。
