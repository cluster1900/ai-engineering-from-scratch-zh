# 如何读这本手册

> 本手册每一段 listing 都来自用 Ghidra 12.1.4 跑的一次已录制的 rea 6.7.0 运行，对象是为本手册写的程序，每条规则都能追溯到按权威排序的源。

本手册讲解 rea，也就是 6.7.0 的 `rea-agents` 包，配 Ghidra 12.1.4 provider。它跟着一个问题，从你编译出的文件走到一份可以核对的 Evidence 记录。问题是某个函数做什么，以及工具如何知道。

## 这本手册写给谁 {#s-front-who-this-manual-is-for}

你写 C、Python 或 JavaScript，并用 Claude、Cursor、Codex、OpenClaw、Hermes，或任何读 SKILL.md 的 coding agent。你从未用反编译器读过机器码，并想核对 agent 对编译程序告诉你的话。

读完最后一部分后，你能：

- 读出编译程序的文件头、段、符号与重定位，并把地址映射到文件偏移。
- 在你构建的程序上用 Ghidra provider 跑 rea，并读它的 Evidence 记录：confidence、authority、limitations 与 unknowns。
- 找到一个函数，读它的汇编与伪代码，跟着它的引用，并说出反编译输出哪里不完整。
- 通过在输入网格上跑两边，以及在掩去重定位后比较字节，证明重建的函数与原函数相等。
- 经 MCP 从 agent 驱动 rea，并维护一份把观察到的与推断出的分开的证据台账。

有五课比 rea 本身挖得更深。[ELF 课](phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch) 建一个文件读取器。[反汇编课](phases/13-tools-and-protocols/33-disassembly-and-control-flow) 建解码器与控制流图。[提升课](phases/13-tools-and-protocols/34-lifting-to-pseudocode) 建 lifter。[证据课](phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns) 建台账，[证明课](phases/13-tools-and-protocols/36-rebuild-and-prove-equal) 证明重建相等。本手册只跟着 rea 与 Ghidra。

## 它是怎么做成的 {#s-front-how-it-was-made}

手册钉住 `rea-agents` 6.7.0，发布于 2026-10-18，标签 `rea-agents-6.7.0`，即提交 `27dc42d10249f0410904a75c0997842eb03b931c`。它钉住 Ghidra 12.1.4 PUBLIC（构建于 2026-Sep-21）以及 OpenJDK 21.0.12.1。事实在 2026-10-18 核实。Release 6.7.0 也包含 6.6.0 的改动，后者打了标签但未发布到 npm。WebAssembly provider、Go provider、raw-binary 格式以及 `DISCLAIMER.md` 出现在 6.5.0。本手册只描述 6.7.0，每一次捕获都为它重新录过。

事实来自七类源，按权威排序。两类冲突时，更高的赢，正文也会说明。

| Rank | Source | What the manual takes from it | Source key |
|---|---|---|---|
| 1 | 钉住标签上的 rea 源码，`27dc42d` | 关于 rea 如何工作的每一条主张 | 各节源文件，在手册源里 |
| 2 | 钉住标签上的 rea 文档 | 文档行为、限制与使用规则 | `readme`、`cli`、`mcp`、`ghidra`、`native`、`install`、`readiness`、`ledgers`、`jsgraph` 或 `design` 与一个标题 |
| 3 | [捕获的运行](manuals/reverse-engineering-101/capture/out) | 每一段 listing 和每一张图里的每一个数字 | 捕获文件名 |
| 4 | ELF、Mach-O、x86-64 与 AArch64 规范 | 格式、编码与调用约定 | `spec` 与一节 |
| 5 | 程序分析论文 | 反汇编、结构化、类型恢复与反编译器评估 | `paper` 与标题 |
| 6 | 成文法与法院判决 | 分析与互操作的法律 | `law` 与引用 |
| 7 | 工具发行说明 | Ghidra 与其他工具版本 | 发行版及其日期 |

来自 rea README、`DISCLAIMER.md` 与文档的引用，都对照标签 `rea-agents-6.7.0` 上的页面核对过。来自成文法、规范与论文的引用取自官方文本。本仓库不复制任何源文件。

## 捕获套件 {#s-front-the-capture-kit}

[捕获套件](manuals/reverse-engineering-101/capture) 驱动真实的 `rea` 命令行及其带 Ghidra provider 的 MCP 服务器。它把它们的返回写到 [输出目录](manuals/reverse-engineering-101/capture/out)，并且只用 Python 标准库。`python3 capture/run.py` 记录一切。`python3 capture/run.py --check` 再记到临时目录，并在掩去每次都会变的值之后与已录集合比较。

对象需要 Ghidra、JDK 和 Node，所以套件不能在仓库 CI 里跑。缺少 rea 6.7.0、Ghidra 12.1.4 或 JDK 21 时，`--check` 打印 `skipped` 和原因并以 0 退出。每一个捕获文件都记在同一台机器上：

| Item | Value |
|---|---|
| Host | 一台 Apple silicon 笔记本，macOS 26.2，build 25C56，arm64 |
| rea | 来自 npx 缓存的 `rea-agents` 6.7.0，Node 22.22.0 |
| Ghidra | 来自 Homebrew 的 12.1.4 PUBLIC，`GHIDRA_INSTALL_DIR=/opt/homebrew/Cellar/ghidra/12.1.4/libexec` |
| JDK | 来自 Homebrew 的 OpenJDK 21.0.12.1，`JAVA_HOME=/opt/homebrew/opt/openjdk@21` |
| clang | Apple clang 17.0.0，target `arm64-apple-darwin25.2.0` |
| Recorded on | 2026-10-18 |

套件在 `00-commands.txt` 里记录每一条 one-shot 命令，各自带退出状态与时间。它在 `10-mcp-*.json` 里记录一次 25 次交换的 MCP 会话，以及两份 Evidence bundle。完整跑一遍大约 125 秒，每个需要 Ghidra 的 one-shot 命令大约 7 到 9 秒。录制主机上的两次运行给出了相同的记录（[捕获说明](manuals/reverse-engineering-101/capture/README.md)）。每一个 fixture 都是为本手册写的程序，`00-fixtures.txt` 列出它们的哈希。

## 约定 {#s-front-conventions}

每条命令里的 `rea` 都指名 6.7.0 命令行。套件从 npx 缓存以 `node .../node_modules/rea-agents/scripts/rea.mjs` 启动它，`rea mcp` 指名同一包的 MCP 服务器。

`$CAPTURE` 表示捕获目录，`$OUT` 表示 `capture/out/`，`$WORK` 表示套件的工作目录，`$HOME` 表示家目录。每次都会变的值写成 `<hash>`、`<ts>` 这类记号。地址是小写 `0x` 十六进制，与 rea 打印的一样。带前导 `_` 的 `_percent_change` 是 Mach-O 符号，`percent_change` 是 C 名与 ELF 符号。

每一节在手册源里记录自己的源，审计在那里检查每一条引用和每一个数字。各节正文不展示它们。源参考会列出它们。listing 原样复制捕获文件的行，`…` 标出 note 解释的裁剪。

网页上的图会动，Replay 按钮再跑一遍步骤，打印和减少动效显示最后一帧。

## 第一次运行 {#s-front-a-first-run}

你需要 rea 6.7.0、Ghidra 12.1.4，以及在 `PATH` 上或在 `JAVA_HOME` 里的 JDK 21。装好之后，这次运行不再用网络。导出那两条路径，然后问 doctor：

```bash
export GHIDRA_INSTALL_DIR=/opt/homebrew/Cellar/ghidra/12.1.4/libexec
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
rea doctor --provider ghidra --format json
```

在捕获用的 Mac 上，报告开头像这样：

```listing
title: the doctor verdict for the Ghidra scope
source: capture/out/01-doctor-ghidra.json
lang: json
note: Cut to the two verdicts and the scope. The nine checks are cut, and section 2.2 reads them.
---
{
  "healthy": true,
  "environment_healthy": false,
  "scope": {
    "mode": "explicit",
    "clients": [],
    "providers": [
      "ghidra"
    ],
    "skill": false,
    "target": null
  },
…
```

然后构建 fixture。把 `capture/fixtures/ledger.c` 和 `ledger-main.c` 复制到临时目录并编译：

```bash
clang -O1 -o ledger-arm64-O1 ledger.c ledger-main.c
rea function ledger-arm64-O1 _percent_change --provider ghidra --format json
```

换一个 clang 会给出别的字节，随之给出别的 SHA-256 和别的 `evidence_id`，所以你的记录在这些字段上会与捕获不同。捕获把它的运行记成这样：

```listing
title: the first question
source: capture/out/00-commands.txt
lang: text
note: The time is cut, because it changes with every recording and stays between 7 and 9 s.
---
$ rea function fixtures/ledger-arm64-O1 _percent_change --provider ghidra --format json
[exit 0] (… s) -> 06-function-percent-change.json
```

把 `capture/out/06-function-percent-change.json` 和你自己的输出并排打开。[第 1.2 节](#s-rea-function-end-to-end) 逐字段读它。

## 各部分如何排序 {#s-front-how-the-parts-are-ordered}

第 1 部分把 rea 放进一页。第 2 部分讲分析权与安装。第 3 到 5 部分拆开一次调查：文件本身、Ghidra provider，以及 Evidence 记录。第 6 部分讲 JavaScript 与 WebAssembly。第 7 部分在 rea 之外证明重建相等。第 8 部分从 agent 驱动 rea，参考部分则放查找表：

```parts
```

## 图中的颜色 {#s-front-colour-in-figures}

每一种色相在每一张图里只保留一个含义：

```palette
```

[图](#fig-0-1) 用录制的 MCP 会话里的交换，教八种箭头样式。

```figure
id: fig-0-1
kind: sequence
title: reading a sequence figure in this manual
claim: Each of the eight arrow styles marks one kind of exchange, and every label except the model call is a real name or message from the recorded session.
caption: Read each numbered row from the tail of the arrow to its head, and the note under each label names the style. Rows 1 to 8 come from the MCP session captures and the server log. Row 9 is the model call the kit does not record.
```

第 9 行的模型调用属于 agent，[第 8 部分](#p-8) 用它自己的 lifeline 画出。

Sources: manual.json; rea LICENSE, DISCLAIMER.md; capture/README.md; capture/run.py; capture/fixtures/ledger.c, ledger-main.c; capture/out/00-commands.txt, 00-fixtures.txt, 00-versions.txt, 01-doctor-ghidra.json, 06-function-percent-change.json, 10-mcp-03-open-binary-O1.json, 10-mcp-09-analyze-function-percent-change-O1.json, 10-mcp-13-analyze-function-missing.json, 10-mcp-14-export-evidence-bundle-O1.json, 10-mcp-server.log, 10-mcp-session.txt
