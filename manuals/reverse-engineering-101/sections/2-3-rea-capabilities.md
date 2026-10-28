# rea capabilities

> rea capabilities 按声明的副作用给每个操作分组，好让你在调用前就知道它会不会启动进程、写文件，或改会话数据库。

某个 agent 即将对你给它的文件调用工具。有些 rea 操作启动 Java 进程，有些写入运行时目录。三个会改分析数据库里的名字，Hopper 操作会打开窗口。你想在调用前拿到那份列表，而不是之后。`rea capabilities` 打印它，同一份记录作为 MCP 工具 `binary_session` 到达 agent。

读完本节后，你能读懂一个 capability group，点名七个 effect 标志，并挑出什么都不改的操作。

## 命令及其记录 {#s-rea-capabilities-the-command-and-its-record}

`capabilities` 与 `providers` 一起注册，帮助把 `capabilities` 描述为 provider 能力与副作用列表。两者都打印会话状态，也就是 `binary_session` 经 MCP 返回的同一对象。没有打开目标时它以 `open: false` 开始：

```listing
title: the head of the status record
source: capture/out/02-capabilities.json
lang: json
note: Cut to the first group of the first provider block and the first fields of the ghidra candidate. The other three groups of that block, the other three target-free blocks, and the other three candidates are cut.
---
{
  "open": false,
  "cleanup_pending": false,
  "capabilities": [
    {
      "provider": {
        "id": "native-macos",
        "name": "macOS native inspection utilities",
        "version": null
      },
      "shared_limitations": [
        "Availability and textual formats depend on the installed macOS/Xcode toolchain."
      ],
      "groups": [
        {
          "operations": [
            "capture_native_ui_scenario",
            "observe_native_calls"
          ],
          "effects": [
            "launches_process",
            "may_show_ui",
            "may_access_network",
            "may_write_filesystem"
          ],
          "limitations": [],
          "available": true,
          "reason": null,
          "availability_code": null
        },
        …
  ],
  "analysis_provider_binding": null,
  "analysis_provider_candidates": [
    {
      "provider": {
        "id": "ghidra",
        "name": "Ghidra",
        "version": null
      },
      "availability": {
        "status": "available",
…
```

捕获里记录有九个顶层字段：`open`、`cleanup_pending`、`capabilities`、`analysis_provider_binding`、`analysis_provider_candidates`、`analysis_run`、`analysis_activity`、`provider_operation_health` 与 `server_identity`。`capabilities` 持有 19 个不需要已绑定 provider 的操作，分在四个 provider 块里：`native-macos`、`rea-artifact-graph`、`rea-dotnet-static` 与 `sqlite`。例子是 `inspect_artifact`、`inspect_macho`，以及托管的 .NET 读取器。`analysis_provider_candidates` 持有四个深度 provider，带可用性与各自的 provider 块。`analysis_provider_binding` 是 `null`，因为没有打开目标，每个候选者都报告 `target_support.status: "unknown"`，原因为 `No target is open.`。

捕获里 `cleanup_pending` 为 false。当会话持有它未能清理的 provider 进程或文件时，它变为 true。它可以在 `open: false` 时为 true {{mcp Identity and discovery}}。打开下一个目标前读它，因为已关闭的目标并不证明其资源已释放。

有一个不需要目标的操作在捕获用的 Mac 上不可用。`inspect_sqlite_database` 的 `available: false`，代码为 `unsupported_version`。其原因说它需要 Node.js 24.15 或更新的 24.x，或 Node.js 26 及以后。捕获用的 Mac 跑 Node 22.22.0。

**Capability group：** 共享一个 `available` 标志、一份 effect 列表与一份 limitation 列表的操作列表。`effects` 列表只点名为 true 的标志。一个操作的完整 limitation 列表是该块的 `shared_limitations` 后接该组的 `limitations`。组不可用时，`reason` 与 `availability_code` 说明原因。会话从每个 provider 的描述符构建这些组，所以字段名对每个 provider 都相同。[图](#fig-2-3) 展示一个。

```figure
id: fig-2-3
kind: structure
title: one capability group, analyze_function under ghidra
claim: A capability group answers four questions before any call: is the operation available, what does it start, what does it write, and what does it change.
caption: Read the field, its value for the analyze_function group in the ghidra block, and the note. From capture/out/02-capabilities.json, with the schema from src/contracts/toolOutputSchemaPrimitives.ts at the tag.
```

## 七种 effect {#s-rea-capabilities-the-seven-effects}

一组的 `effects` 列表从固定的七个标志里点名。列表未点名的标志对该组每一个操作都为 false。

| Flag | Meaning | True in the capture for |
|---|---|---|
| `mutates_artifact` | 操作改分析数据库：名字或注释 | 3 个 Ghidra 操作，6 个 Hopper 操作 |
| `launches_process` | 操作启动程序，这里是 Ghidra JVM 或 macOS 工具 | 每一个 Ghidra、Hopper 与 Kuna 操作，12 个不需要目标的 |
| `may_show_ui` | 可以打开窗口 | 每一个 Hopper 操作，4 个 IDA 操作，2 个不需要目标的 |
| `may_access_network` | 操作可以打开连接 | 每一个 IDA 适配器操作，2 个不需要目标的 |
| `may_write_filesystem` | 操作写文件，这里是运行时根与项目 | 每一个 Ghidra 与 Kuna 操作，6 个 Hopper 操作，6 个不需要目标的 |
| `changes_permissions` | 操作改文件或进程权限 | 无 |
| `requires_root` | 操作需要 root | 无 |

两个标志需要再看一眼。`mutates_artifact` 听起来像写你的文件，其实不是。Ghidra 块的一条共享 limitation 说："The imported Program and temporary project are ephemeral and deleted on close. Annotation operations edit session database metadata; original executable bytes are never written."（[捕获](manuals/reverse-engineering-101/capture/out/02-capabilities.json)）。设了它的三个操作，`annotate_native_function`、`set_address_name` 与 `set_addresses_names`，在 Ghidra 的数据库里重命名符号，编辑随会话一起消失。

`may_write_filesystem` 对每一个 Ghidra 操作都为 true，即便是 `list_documents`。第一次调用写入运行时根、私有副本与项目（[第 1.2 节](#s-rea-function-end-to-end)）。[图](#fig-2-4) 按 provider 统计这些标志。

```figure
id: fig-2-4
kind: comparison
title: declared effects by provider in the capture
claim: Every Ghidra operation declares launches_process and may_write_filesystem, three also declare mutates_artifact, and no operation in the capture declares changes_permissions or requires_root.
caption: Read one column per provider and one row per flag, and each cell counts the operations that declare the flag. Counted from the capabilities capture.
```

## 四个候选，一个绑定 {#s-rea-capabilities-four-candidates-one-bound}

```listing
title: the three candidates that are not available
source: capture/out/02-capabilities.json
lang: json
note: Cut to the provider and availability of hopper, ida, and kuna. Their diagnostics, their target support, and their provider blocks are cut.
---
    {
      "provider": {
        "id": "hopper",
        "name": "Hopper Disassembler",
        "version": null
      },
      "availability": {
        "status": "unavailable",
        "code": "executable_missing",
        "reason": "Hopper launcher is missing or not executable: /Applications/Hopper Disassembler.app/Contents/MacOS/hopper",
…
    {
      "provider": {
        "id": "ida",
        "name": "IDA MCP adapter",
        "version": "1"
      },
      "availability": {
        "status": "unavailable",
        "code": "not_configured",
        "reason": "Set REA_IDA_MCP_CONFIG to an upstream IDA MCP JSON registration; see docs/ida-provider.md.",
…
    {
      "provider": {
        "id": "kuna",
        "name": "Kuna",
        "version": null
      },
      "availability": {
        "status": "unavailable",
        "code": "not_configured",
        "reason": "Set REA_KUNA_COMMAND to the absolute path of a caller-supplied kuna executable (verified with 1.833). REA does not download, install or update Kuna.",
…
```

`ghidra` 候选是 `available`，其 `diagnostics` 重复[第 2.2 节](#s-rea-doctor-and-the-ghidra-provider) 的八项检查，路径相同。它的块有 22 组与 30 个操作。一组是 `read_binary_inventory_summary`，也就是[第 3.4 节](#s-analyze-overview) 那些计数背后的操作。`hopper` 以代码 `executable_missing` 不可用，`ida` 与 `kuna` 以 `not_configured` 不可用。

每个不可用的候选仍列出其操作：Hopper 37 个、IDA 13 个、Kuna 13 个。Hopper 与 IDA 组的 `available: true`，除了 Hopper 的 `search_bytes`，它为 `available: false`，原因为 "Masked byte search has not been verified for Hopper."。每一个 Kuna 组都是 `available: false`，代码为 `not_configured`，原因与候选相同。本手册没有跑 Kuna，因为它已录的覆盖只在 Linux 上，而捕获主机是 Mac。

引擎可用性与操作可用性是两件不同的事实。文档把两者分开：这些命令描述二进制会话的 provider 以及辅助能力 {{cli Choose a provider}}。带 `--provider ghidra` 或 `provider_id: "ghidra"` 时，只有 Ghidra 块适用。

## Limitations 是声明的一部分 {#s-rea-capabilities-limitations-are-part-of-the-declaration}

每一个 Ghidra 操作在自己的之前都带着四条共享 limitation。会话只在默认自动分析完成后才服务操作。Program 与项目是短暂的。取消请求会终止数据库并丢弃注解。地址是默认空间里的小写 `0x` 十六进制（[捕获](manuals/reverse-engineering-101/capture/out/02-capabilities.json)）。

然后每组加上自己的，这些才是你在把空列表当真之前要读的句子。`list_strings` 说空搜索并不证明文本不在文件里。`procedure_callers` 不声明自己的 limitation。

它的答案带着 `relationship_coverage`。该字段里的 Ghidra 诊断说 rea 只返回已解析的 call 引用。Ghidra 未解析的计算调用或间接调用保持未知（[捕获](manuals/reverse-engineering-101/capture/out/06-function-percent-change.json)）。它们背后的设计规则：缺失的覆盖意味着未知，而不是不存在 {{design Define the contract}}。

## tools/list 里的第二套词汇 {#s-rea-capabilities-a-second-vocabulary-in-tools-list}

记录以 `server_identity` 结束。它的 `catalog` 持有两样东西：计数，以及目录的三个 SHA-256 digest：

```listing
title: the catalog in server_identity
source: capture/out/02-capabilities.json
lang: json
note: Cut to the catalog. The digests are cut to eight hex digits, and the other fields of server_identity are cut.
---
    "catalog": {
      "counts": {
        "cli_commands": 153,
        "mcp_tools": 207,
        "mcp_prompts": 6
      },
      "digests": {
        "tools_sha256": "af39310c…",
        "prompts_sha256": "7152916a…",
        "combined_sha256": "96d8f6e6…"
      }
    },
```

目录没有按工具的条目。每个 MCP 工具的副作用在 `tools/list` 返回的 tool annotations 里：

```listing
title: the tools/list entry for xrefs
source: capture/out/10-mcp-02-tools-list.json
lang: json
note: Cut to the name, the title, and the annotations. The description and the two schemas are cut.
---
        {
          "name": "xrefs",
          "title": "Xrefs",
          …
          "annotations": {
            "readOnlyHint": false,
            "destructiveHint": false,
            "idempotentHint": true,
            "openWorldHint": false
          },
          …
```

在源码里，`xrefs` 有 `mutatesSession: true`，因为每个答案都进入 Evidence 台账。rea 从那些 effect 派生 annotations，所以 `readOnlyHint` 为 false。`xrefs` 的 provider capability 仍不点名 `mutates_artifact`。两套词汇回答两个问题。capability 说引擎对你的机器做什么，annotations 说工具对 MCP 会话做什么。读与你的问题匹配的那一套，不要混用。

```takeaways
- 在新机器上第一次调用之前，跑 `rea capabilities --format json`。
- 把 `launches_process` 与 `may_write_filesystem` 当作每一个 Ghidra 操作的代价。
- 除非你想要会话内重命名，否则避开 `annotate_native_function`、`set_address_name` 与 `set_addresses_names`。
- 在把空结果读成不存在之前，先读共享 limitations 与每组的 `limitations`。
```

Sources: cli Choose a provider (rea docs/cli.md); mcp Identity and discovery (rea docs/mcp-contracts.md); design Define the contract (rea docs/tool-design.md); rea at 27dc42d: src/cli/utilityCommands.ts, src/application/binary/BinarySessionStatus.ts, src/contracts/toolOutputSchemaPrimitives.ts, src/contracts/toolEffects.ts, src/serverIdentity.ts, src/catalogIdentity.ts, src/domain/relationshipCoverage.ts, src/ghidra/GhidraProviderCapabilities.ts, src/kuna/KunaProvider.ts, docs/kuna-provider.md, bridge/ghidra/ReaGhidraBridge.java; capture/out/02-capabilities.json, 06-function-percent-change.json, 10-mcp-02-tools-list.json
