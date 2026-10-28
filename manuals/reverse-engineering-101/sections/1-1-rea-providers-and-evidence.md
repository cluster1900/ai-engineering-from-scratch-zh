# rea、provider 与 Evidence

> rea 标准化问题、会话与 Evidence 记录，并把导入、分析与反编译留给它绑定的引擎，这里是 Ghidra 12.1.4。

你用 `clang -O1` 编译了 `ledger.c`，想知道当 `before` 为 0 时 `_percent_change` 的机器码做什么。你可以在 Ghidra 里打开文件自己读 listing。你也可以问 rea，rea 替你问 Ghidra，并返回一份说明它发现了什么以及如何知道的记录。本节划清这两个程序之间的线。

读完本节后，你能说出 rea 给 Ghidra 加了什么、它从不做什么，以及一个问题该用哪个适配器。

## rea 标准化的三件事 {#s-rea-providers-and-evidence-three-things-rea-standardizes}

**Evidence：** 每一次成功的分析调用都返回的那一种记录类型。它是有 16 个字段的严格对象。字段是 `evidence_id`、`subject`、`provider`、`analysis_profile`、`predicate_type`、`operation`、`parameters`、`raw_result`、`normalized_result`、`confidence`、`authority`、`environment`、`limitations`、`relationship_coverage`、`locations` 与 `evidence_links`。

id 是 `ev_` 加上语义内容的 SHA-256。同一字节上的同一观察在任何机器上得到同一 id。当 `relationship_coverage` 的值为 `null` 时，id 也覆盖它。所以更旧的 rea 给出的记录可能在更新的版本里通不过检查（[第 5.4 节](#s-evidence-bundles-export-and-import)）。`confidence` 是 `observed`、`derived` 或 `inferred` 之一，`authority` 说明何种源支撑该事实。

MCP 文档给工具定下规则。产生证据的工具把完整的规范 Evidence 记录返回两次：一次作为文本，一次作为 structured content {{mcp Tool results}}。[第 1.2 节](#s-rea-function-end-to-end) 逐字段读一份记录，[第 5 部分](#p-5) 完整覆盖该记录。

**Provider：** 统一接口后面的分析引擎。`GhidraProvider implements AnalysisProviderCandidate`，并提供 `identity()`、`capabilities()`、`inspectAvailability()`、`inspectTargetSupport(target)`、`resolveAnalysisProfile(...)` 与 `createClient(...)`。在 6.7.0，会话持有四个深度 provider：`hopper`、`ghidra`、`ida` 与 `kuna`，外加不需要引擎的辅助 provider。本手册只用 `ghidra`。Kuna 是你自己安装的程序，它已录的覆盖在 Linux 上，捕获用的 Mac 报告它为 `not_configured`。

注册表按 id 排序候选者，并在不启动它的情况下选出一个。注册顺序从不改变选择，也不改变调用者看到的内容。一旦绑定，provider 保持绑定：rea 不会在运行时失败后换入另一个 provider {{mcp Identity and discovery}}。

**Adapter：** 调用者到达会话的方式。one-shot CLI 有 153 条命令和一个别名，MCP 服务器有 207 个工具和 6 个 prompt。捕获的 `server_identity.catalog.counts` 报告这些数字（[捕获](manuals/reverse-engineering-101/capture/out/02-capabilities.json)）。两种适配器共享一个 `BinarySession`，它为 CLI 与 MCP 服务器拥有那一个活动目标。CLI 名用连字符，MCP 名在词之间用 `_`。native 家族打破规则：`rea function` 调用 `analyze_function`，`rea decompile` 调用 `procedure_pseudo_code`，`rea analyze` 调用 `binary_overview`。

rea 不为你规划一次调查。维护者在路线图里写下了分工（[rea issue 32](https://github.com/morluto/rea/issues/32)）。agent 选择目标，并从检查、捕获、追踪与比较结果构建调查。同一文本要求工具结果把观察、推断与未知分开。所以计划留在你或你的 agent 那里，rea 用你可以核对的记录回答每一个问题。

捕获在同一文件上用了两种适配器：

```listing
title: four one-shot commands and their exit status
source: capture/out/00-commands.txt
lang: text
note: Cut to the first four commands. The time of each command is cut, because it changes with every recording, and the other commands are cut.
---
$ rea doctor --provider ghidra --format json --filter-output healthy,environment_healthy,scope,scope_checks
[exit 0] (… s) -> 01-doctor-ghidra.json

$ rea capabilities --format json
[exit 0] (… s) -> 02-capabilities.json

$ rea inspect-artifact fixtures/ledger-arm64-O1 --format json
[exit 0] (… s) -> 03-inspect-artifact.json

$ rea inspect-binary-layout fixtures/ledger-x86_64-O1.o --format json
[exit 1] (… s) -> 04-inspect-binary-layout.json
…
```

前三条命令大约一秒结束，因为它们都不启动 Ghidra。第四条失败，[第 3.2 节](#s-inspect-binary-layout-and-the-load-image) 解释原因。[图](#fig-1-1) 把每个名字放在线的一侧。

```figure
id: fig-1-1
kind: layers
title: what rea standardizes and what it leaves to Ghidra
claim: rea owns the adapters, the session, and the Evidence record, and Ghidra owns import, analysis, and decompilation, with one JSON line per question between them.
caption: Read each stack from the top down. The counts come from the capabilities and overview captures, and the file names from the fixture list. The class names come from the architecture diagram of rea at the tag.
```

## rea 留给 Ghidra 的 {#s-rea-providers-and-evidence-what-rea-leaves-to-ghidra}

rea 没有自己的反汇编器，也没有自己的反编译器。对原生可执行文件，它在全新的临时项目上启动 `analyzeHeadless`，并导入该文件的私有副本。它让 Ghidra 的默认自动分析跑完，然后经套接字提问。答案是 Ghidra 的。

每一份 `analyze_function` 记录在 limitations 里写明，函数 dossier 拼接了 Ghidra FunctionManager、Listing、ReferenceManager、BasicBlockModel 与反编译器所报告的内容（[捕获](manuals/reverse-engineering-101/capture/out/06-function-percent-change.json)）。provider 文档划了同一条线。伪代码是 Ghidra 反编译器产出的，它与汇编都不是原始源码 {{ghidra Admitted function-analysis semantics}}。

**Bridge：** `ReaGhidraBridge.java`，一个 `GhidraScript`，由 `analyzeHeadless` 作为最后一个 post-script 运行，然后在 Unix 套接字上服务请求。请求是一行 JSON，`{ id, token, method, params }`，回复是 `{ id, ok: true, result }` 或 `{ id, ok: false, error }`。桥经一个 Java `switch` 回答 17 个 inventory 方法与 13 个 function 方法。[第 4 部分](#p-4) 跟着每一个。

Ghidra 也拥有代价。在捕获用的 Mac 上，每个需要 Ghidra 的 one-shot 命令花了 7 到 9 秒（[捕获](manuals/reverse-engineering-101/capture)）。导入与自动分析占了大部分时间。在一次 MCP 会话里，第一次 Ghidra 调用花了 5 到 7 秒（[捕获](manuals/reverse-engineering-101/capture)）。同一文件上之后的每次调用都不到 100 ms。

## rea 自己读什么 {#s-rea-providers-and-evidence-what-rea-reads-by-itself}

在任何引擎跑之前，rea 读文件。它从 `7f 45 4c 46`、`MZ` 以及四个 Mach-O magic 值检测 ELF。它以 64 KiB 块对每个目标做 SHA-256。它认识十种架构：`x86`、`x86_64`、`arm`、`arm64`、`mips`、`6502`、`riscv`、`powerpc`、`m68k` 与 `hexagon`。原始二进制没有头，所以调用者点名其架构。只有原始二进制可以是 `6502` 或大端 `m68k`，其入口地址必须适合处理器。

两条命令在没有 Java 的情况下显示结果。`rea inspect-artifact` 用 provider `rea-artifact-graph` 遍历文件，并在不到一秒内返回 Evidence 记录，不需要 Java（[捕获](manuals/reverse-engineering-101/capture/out/03-inspect-artifact.json)）。在 macOS 上，`rea inspect-macho` 经 `xcrun` 跑 Xcode 工具，大约花了三秒（[捕获](manuals/reverse-engineering-101/capture/out/04-inspect-macho.json)）。[第 3 部分](#p-3) 读那些记录。

## 原生代码之外的格式 {#s-rea-providers-and-evidence-formats-beyond-native-code}

rea 还有三个本手册会碰到的读取器。`inspect-wasm-artifact` 经 WABT 工具读 WebAssembly 模块。`inspect-go-binary` 读 Go 构建信息。raw-binary 格式打开没有头的文件，架构与入口地址由你点名。捕获在 fixture 模块上跑了 `inspect-wasm-artifact`，命令以 0 退出（[捕获](manuals/reverse-engineering-101/capture/out/16-inspect-wasm-artifact.json)）。[第 6.2 节](#s-inspect-wasm-artifact) 读那份记录。

```takeaways
- 向 rea 要一份 Evidence 记录，怀疑时再读 Ghidra 自己的 listing。
- 一个问题用 CLI，多问一次会话用 MCP 服务器。
- 把那 16 个字段当作契约，把 `normalized_result` 里的 dossier 当作 Ghidra 的答案。
- 对一个文件的第一个 Ghidra 问题预期 7 到 9 秒，之后是毫秒级。
```

Sources: mcp Tool results, Identity and discovery (rea docs/mcp-contracts.md); ghidra Admitted function-analysis semantics (rea docs/ghidra-provider.md); rea at 27dc42d: src/domain/evidence.ts, src/ghidra/GhidraProvider.ts, src/composition/binary.ts, src/application/binary/AnalysisProviderRegistry.ts, src/application/binary/BinarySession.ts, src/cliCommandNames.ts, src/ghidra/GhidraClient.ts, src/ghidra/GhidraClientWire.ts, src/ghidra/protocol.ts, src/ghidra/GhidraInventoryValues.ts, src/ghidra/GhidraFunctionValues.ts, bridge/ghidra/ReaGhidraBridge.java, src/domain/binaryTarget.ts, src/application/BinaryTargetResolver.ts, src/domain/binaryTargetTypes.ts, src/catalogIdentity.ts, src/go/GoBinaryProvider.ts, src/wasm/WabtArtifactProvider.ts, src/kuna/KunaProvider.ts, docs/architecture.mermaid, docs/roadmap.md; rea issue 32 (roadmap); capture/README.md; capture/out/00-commands.txt, 00-fixtures.txt, 02-capabilities.json, 03-inspect-artifact.json, 04-inspect-macho.json, 05-analyze-arm64-O1.json, 06-function-percent-change.json, 10-mcp-session.txt, 16-inspect-wasm-artifact.json
