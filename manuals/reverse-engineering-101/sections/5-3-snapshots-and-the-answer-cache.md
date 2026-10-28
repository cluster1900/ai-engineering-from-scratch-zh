# AnalysisSnapshot 与精确匹配答案缓存

> 快照在绑定到目标摘要与配置摘要的查询 id 下缓存精确答案，而一次变更调用的分发会关掉缓存。

抓取对每个函数跑了一次 `rea function fixtures/ledger-arm64-O1 NAME --provider ghidra`，共四次，每次花 7.9 到 9.0 秒（[抓取](manuals/reverse-engineering-101/capture/out/00-commands.txt)）。每一次都把同样的 33,872 字节导入一个新的 Ghidra 项目，再把项目扔掉。你希望关于同一文件的第二个问题是免费的。读完本节后，你能说出快照能回答哪些调用，并亲手构建查询 id。你也能预测 rea 何时拒绝重放或保存。

## 三种叫作快照的东西 {#s-snapshots-and-the-answer-cache-three-things-called-a-snapshot}

这个词在 rea 里覆盖三样东西，其中只有一样是你可以保留的缓存。

**目标快照：** Ghidra 启动器用 `-readOnly` 与 `-deleteProject` 导入的输入私有副本。会话关闭时它被删除，分析没有任何东西从中幸存。每一个新的 provider 会话都把目标再次导入一个新的临时项目 {{mcp Ghidra first-query deadlines and recovery}}。

**分析快照缓存：** 一个会话的内存表，`AnalysisSnapshotCache`，为一个目标身份持有最多 10,000 项。这就是本节讲的缓存。

**快照文件：** `close_binary` 写入、`open_binary` 读取的 JSON 文件。它持有目标身份、provider 绑定、缓存项与会话的 Evidence 包。CLI 文档说明它是什么、不是什么。它持有缓存的观察，不是已保存的 provider 数据库。只有符合条件的精确查询能复用结果，而新的或实时的查询仍可启动 provider {{cli Save and reuse analysis snapshots}}。

## 查询 id {#s-snapshots-and-the-answer-cache-the-query-id}

**查询 id：** `query_` 后跟持有四样东西的规范 JSON 的 SHA-256：目标、绑定、操作与参数。目标是无路径身份，`sha256`、`kind`、`format` 与 `architecture`。`raw-binary` 目标还带着其 `entry_point`。绑定是 provider 及其分析配置。对抓取来说，那是以 `01b5d08b` 开头的摘要、`executable`、`mach-o`、`arm64`、Ghidra `12.1.4`，以及下面的配置。

```listing
title: the Ghidra analysis profile that every cache key carries
source: capture/out/05-analyze-arm64-O1.json
lang: json
note: The profile as the binary_overview record carries it. Twenty of the twenty-five parameters are cut.
---
"upstream_analysis_profile": {
  "provider": {
    "id": "ghidra",
    "name": "Ghidra",
    "version": "12.1.4"
  },
  "parameters": {
    "target_kind": "executable",
    "target_format": "mach-o",
    "architecture": "arm64",
    …
    "function_references": "complete-body-and-entry-reference-manager-v2",
    …
    "analyzer_preset": "ghidra-default"
  },
  "digest": "3fc72c9b…"
},
```

参数是版本字符串，Ghidra 适配器做出的每一份观察契约一个。摘要是对 provider 与参数的规范 JSON 的 SHA-256。只有当绑定的 provider 与摘要等于所选配置时，缓存项才匹配。把 `function_references` 从 `-v2` 移到 `-v3` 的发行版会改变摘要。然后在旧摘要下做的每一项都停止匹配。这就是本节论点里精确的含义。

版本 6.7.0 就是这样的发行版。对这个 Mach-O 目标，参数列表保持其 25 个名字，两个值移动了。`instruction_references` 从 `exact-address-incoming-v1` 到 `exact-address-incoming-without-synthetic-entry-v2`。`function_boundary_observations` 从 `ghidra-function-boundary-limitations-v3` 到 `-v4`。摘要从 `966e6016…` 到 `3fc72c9b…`，所以没有 6.5.0 快照项匹配 6.7.0 会话。一次 Ghidra 会话做出了包摘要的全部八行，所以它们都带着摘要 `3fc72c9b…`（[导出与导入](#s-evidence-bundles-export-and-import)）。

## 缓存回答哪些调用 {#s-snapshots-and-the-answer-cache-which-calls-the-cache-answers}

`isSnapshotCacheable` 在任何 provider 跑之前决定，一次调用是否能从缓存回答。当下列全部成立时，调用符合条件。

- 操作不是有状态的那些：`health`、`current_address`、`current_procedure`、`current_document`、`goto_address` 或 `list_documents`。
- 限定到文档的操作点名其 `document`。
- 默认到光标的操作，例如 `xrefs`，点名其 `address`。
- 能力声明 `mutatesArtifact: false`、非 `live` 的 `cachePolicy`，以及没有权限变更。
- 其 `cachePolicy` 是 `snapshot`，或者它不写文件系统。

Ghidra 适配器把除变更操作与 `list_documents` 之外的每一个操作标为 `cachePolicy: "snapshot"`。`prepareSessionExecution` 计算 id 并查找。`BinarySession` 在不碰 provider 的情况下返回命中。重放的答案带着一条额外限制：`"Loaded from a local REA analysis snapshot; this call did not re-run the provider."`。

重放的记录点名现在打开的目标的路径。函数 `rebindEvidenceToTargetPath` 把那条路径写入已存记录。`evidence_id` 不变，因为路径在哈希之外。在 Windows 上，Ghidra 必须在重放之前承认源文件，所以缓存命中仍可启动 provider。

在未命中时 provider 跑，结果绑定到配置与目标。然后创建并记录一份 Evidence 记录，并在 id 下存一项缓存。

抓取没有展示重放，因为其 25 次 MCP 调用里没有两次有相同的操作与参数。`open_binary` 之后第一次由 Ghidra 支撑的调用是 `list_procedures`，无头导入跑时花了 6 到 7 秒。该目标上之后的每一次分析调用都不到 100 ms（[抓取](manuals/reverse-engineering-101/capture/out/10-mcp-session.txt)）。那些后来的调用快，是因为桥已经在跑，不是因为缓存。带 `"procedure": "_percent_change"` 的重复 `analyze_function` 会是第一次重放。

```figure
id: fig-5-4
kind: decision
title: one analyze_function call through the snapshot cache
claim: A cacheable call becomes a query id over target, binding, operation, and parameters, and a mutating call turns the cache off before it reaches Ghidra.
caption: Read top to bottom. The dashed reply is a replay, and the solid call is a provider run. The dashed amber arrow is the state change that a mutating call makes before its dispatch. Values are from the function capture and the session capture.
```

## 保存与加载 {#s-snapshots-and-the-answer-cache-save-and-load}

`close_binary` 接受 `snapshot_path` 与 `overwrite`。`closeWithSnapshot` 排空进行中的调用，导出快照，写入文件，并关闭 provider。其回执加上 `primitive_entries`、`workflow_entries` 与 `evidence_records`。`open_binary` 也接受 `snapshot_path`，在打开目标之前读文件，并把项导入新会话。抓取关闭两个目标时都没有路径，所以其两次 `close_binary` 结果是 `null`（`10-mcp-15-close-binary-O1.json`，`10-mcp-25-close-binary-O2.json`）。在 CLI 上标志是 `--snapshot`。

精确的缓存命中通常在 rea 启动 provider 进程之前被读取 {{cli Save and reuse analysis snapshots}}。在 Windows 上 Ghidra provider 可以先启动，因为它必须承认源文件。

加载文件是一次完整检查。项必须按规范 id 顺序，每一个查询 id 被重新计算且必须匹配。没有 id 出现两次。每一项必须在包里有一份带同一配置与同一结果的 Evidence 记录。另一目标的包记录会让整个文件失败。

写入是原子的：文件以模式 `0600` 暂存、同步，并重命名或硬链接到位。导入到目标或配置不同的会话会以 "Analysis snapshot profile_mismatch: target, provider, or analysis profile does not match the active binary" 失败。

## 变更调用之前的失效 {#s-snapshots-and-the-answer-cache-invalidation-before-a-mutating-call}

有些 Ghidra 操作写入会话数据库，例如重命名函数或添加注释的 `annotate_native_function`。它们每一个都在其 `effects` 里列出 `mutates_artifact`，并带着点名后果的限制。

```listing
title: a mutating operation as binary_session describes it
source: capture/out/10-mcp-04-binary-session.json
lang: json
note: Two of the three limitations are cut.
---
{
  "operations": [
    "annotate_native_function"
  ],
  "effects": [
    "mutates_artifact",
    "launches_process",
    "may_write_filesystem"
  ],
  "limitations": [
    …
    "Metadata edits invalidate immutable analysis snapshots and are discarded on close. CLI returns the updated dossier before session cleanup; this is not a saved Ghidra project."
  ],
  "available": true,
  "reason": null,
  "availability_code": null
}
```

在 rea 把这样的调用送给 provider 之前，`BinarySession` 调用 `invalidateSnapshot`。缓存被清空，并设置一个标志。从那时起每一次查找都返回空，每一个新结果都不存储，导出以 "Analysis snapshots are unavailable because analysis metadata may have changed" 失败。错误加上出路：用 `export_evidence_bundle` 导出 Evidence，不带快照关闭目标，再重新打开。变更之后的导入以同样方式被拒绝。

在 6.7.0，顺序是：先失效，再调用 provider。失败的回复不能证明写入没有到达 Ghidra。所以失败的变更调用也会关掉缓存。6.4.0 发行版用另一种顺序，只在成功调用之后失效。

CLI 文档陈述规则。一次元数据写入清除活动会话的快照缓存，即使其回复失败。provider 可能已经应用了写入 {{cli Save and reuse analysis snapshots}}。

```takeaways
- 用相同参数重复一次查询以得到缓存答案，并读加上的限制。
- 在注解任何东西之前，用 `close_binary` 与 `snapshot_path` 保存快照。
- 在 rea 升级之后预期 `profile_mismatch` 拒绝，并重新跑分析。
- 把快照当作对过去问题的答案，绝不当作已保存的 Ghidra 项目。
```

Sources: capture/README.md; capture/out/00-commands.txt, capture/out/05-analyze-arm64-O1.json, capture/out/10-mcp-04-binary-session.json, capture/out/10-mcp-09-analyze-function-percent-change-O1.json, capture/out/10-mcp-15-close-binary-O1.json, capture/out/10-mcp-25-close-binary-O2.json, capture/out/10-mcp-session.txt, capture/fixtures/bundle-rea-6.5.0-O1.json; rea 6.7.0 at 27dc42d: src/domain/analysisSnapshot.ts, src/domain/analysisProfile.ts, src/domain/evidence.ts, src/application/binary/AnalysisSnapshotCache.ts, src/application/binary/BinarySession.ts, src/application/binary/BinarySessionExecution.ts, src/application/binary/BinarySessionRecords.ts, src/application/JsonFiles.ts, src/server/registerCloseLifecycleTool.ts, src/server/registerSessionTools.ts, src/ghidra/GhidraLauncher.ts, src/ghidra/GhidraAnalysisProfile.ts, src/ghidra/GhidraProviderCapabilities.ts; rea docs/cli.md, rea docs/mcp-contracts.md
