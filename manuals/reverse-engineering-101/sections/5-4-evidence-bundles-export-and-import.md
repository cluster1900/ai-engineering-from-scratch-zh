# export_evidence_bundle, evidence-export, and evidence-import

> Evidence 包是规范 JSON 里的七个已排序数组，所以同样的记录从 MCP 服务器与从 CLI 给出同样的字节。

你的 agent 的 MCP 连接今晚关闭，随之关闭的还有它在 `ledger-arm64-O1` 上收集的八份记录。明天一位同事想在另一台 Mac 上检查它们，而且不要 Ghidra。读完本节后，你能把一次会话导出为一个包，并在没有引擎的情况下读其摘要。你也能把它导入一次新会话或一次 CLI 检查。

## export_evidence_bundle {#s-evidence-bundles-export-and-import-export-evidence-bundle}

**Evidence 包：** 带七个数组的一个 JSON 对象。它们是 `artifacts`、`providers`、`environments`、`scenarios`、`captures`、`unknowns` 与 `records`。前五个从记录本身构建。它们持有作为摘要、格式与体系结构的不同主体、不同的 provider，以及不同的环境。然后是受控重放记录与过程抓取记录。记录按 `evidence_id` 排序，顺序没有含义。

MCP 工具接受一个 `path` 与一个 `overwrite` 标志。它以路径、字节数，以及记录与未知事项计数作答。

```listing
title: export_evidence_bundle after eight calls on ledger-arm64-O1
source: capture/out/10-mcp-14-export-evidence-bundle-O1.json
lang: json
note: The request and the text copy of the result are cut.
---
"structuredContent": {
  "result": {
    "path": "$WORK/bundle-O1.json",
    "bytes": 178853,
    "records": 8,
    "unknowns": 0
  }
}
```

写入是规范且原子的。`writeEvidenceBundle` 再次验证包并流式写出规范 JSON 部件。`writeTextParts` 用 `wx` 与模式 `0600` 创建暂存文件并同步它。然后当 `overwrite` 为真时把文件重命名到目标上，或当目标不得已存在时硬链接它。契约说同样的话：一次完整的包导出把规范 JSON 流进一个以一个原子步骤出现的文件 {{mcp Tool results}}。

抓取把服务器写的文件复制到 `11-bundle-O1.json`，抓取目录被掩码，并加上一个换行。其七个数组持有一个工件、一个 provider、无环境、无场景、无抓取、无未知事项，以及八份记录。

```listing
title: the two bundle files of the capture
source: capture/out/11-bundles.txt
lang: text
note: Nothing is cut.
---
94fca3db…  178398  11-bundle-O1.json (the bytes export_evidence_bundle wrote, with the capture path masked and a newline added)
6130b135…  286433  11-bundle-O2.json (the bytes export_evidence_bundle wrote, with the capture path masked and a newline added)
```

## inspect-evidence-bundle {#s-evidence-bundles-export-and-import-inspect-evidence-bundle}

你不需要 rea 的引擎，也不需要一次会话，就能读一个包。`rea inspect-evidence-bundle` 接受带 `path`、`detail` 以及可选 `filters` 的一个 JSON 参数，并在没有载荷的情况下为每份记录打印一行。MCP 工具 `get_evidence_bundle` 为一次活动会话的记录共享该投影。

```listing
title: the summary of bundle O1, the first row and the first dossier row
source: capture/out/11-inspect-evidence-bundle-O1.json
lang: json
note: The subject and provider of each row, the second row, and the last five rows are cut.
---
{
  "kind": "evidence-bundle-summary",
  "filters": {},
  "total_retained_records": 8,
  "matching_records": 8,
  "unknown_revisions": 0,
  "records": [
    {
      "evidence_id": "ev_2c883c7b…",
      …
      "operation": "procedure_assembly",
      …
      "limitation_count": 6,
      "native_dossier": {
        "available": false,
        "reason": "different-operation"
      }
    },
    …
    {
      "evidence_id": "ev_41e8ca1c…",
      …
      "operation": "analyze_function",
      "confidence": "observed",
      "authority": "shipped-artifact",
      "analysis_profile_digest": "3fc72c9b…",
      "retention": "complete-record",
      "limitation_count": 10,
      "native_dossier": {
        "available": true,
        "procedure_address": "0x100000518",
        "procedure_name": "_grade",
        …
```

这些行按 `evidence_id` 顺序，所以第一行是 `procedure_assembly` 记录，而 `_grade` dossier 是第三行。不是 dossier 的一行把 `native_dossier` 报告为不可用，原因为 `different-operation`。八行点名四个 `analyze_function` dossier，`_percent_change`、`_grade`、`_total` 与 `_grade_label`，以及 `list_procedures`、`procedure_assembly`、`xrefs` 与 `list_strings` 各一份记录。每一行都带着同一个配置摘要 `3fc72c9b…`，因为一次 Ghidra 会话产生了它们全部。O2 包有两行，即 -O2 构建的 `_total` 与 `_percent_change` dossier（`11-inspect-evidence-bundle-O2.json`）。

契约点名摘要接受的过滤器。可选的 `filters` 匹配精确的 `evidence_id`、`operation`、`target_sha256`、`analysis_profile_digest` 或 `procedure_address` {{mcp Tool results}}。

## evidence-export and evidence-import on the CLI {#s-evidence-bundles-export-and-import-evidence-export-and-evidence-import-on-the-cli}

`rea evidence-export SOURCE OUTPUT` 读一个包、验证它，并以规范形式再写一遍。答案是路径、字节数与记录计数。抓取把 `11-bundle-O1.json` 导出到一个工作文件并比较了摘要。

```listing
title: the MCP export and the CLI export of the same records
source: capture/out/12-evidence-export.txt
lang: text
note: Nothing is cut.
---
94fca3db…  178398  export_evidence_bundle over MCP, out/11-bundle-O1.json
47160c2d…  178397  evidence-export over the CLI, $WORK/canonical-O1.json
same bytes as the MCP export: no
same JSON content as the MCP export: yes
```

那一字节的差异是套件追加到其副本的换行。去掉它，副本有 178,397 字节与摘要 `47160c2d`，也就是 CLI 文件的摘要。对同样的记录，MCP 服务器与 CLI 写出同样的规范字节，这就是本节论点所承诺的。

`rea evidence-import PATH` 验证一个包并报告其计数。在 CLI 上没有会话，所以 `imported` 与 `total` 都是文件里的记录数：`13-evidence-import.json` 里是 `{"imported": 8, "unknowns_added": 0, "total": 8}`。CLI 文档划出界限：分开的 CLI 调用读完整的已保存记录 {{cli Import, export and compare Evidence}}。

## import_evidence_bundle into a live session {#s-evidence-bundles-export-and-import-import-evidence-bundle-into-a-live-session}

在 MCP 里，同一个动词合并进连接的账本。处理器读并验证文件，调用 `importEvidenceBundle`，并以加入的记录、加入的未知事项修订，以及新的总数作答。账本加入它未持有的每一份记录，并保留它已持有的记录。它拒绝其 id 已持有但内容不同的记录："Conflicting evidence record"。

```listing
title: bundle O1 imported into the session that analysed O2
source: capture/out/10-mcp-23-import-evidence-bundle-O1.json
lang: json
note: The request and the text copy of the result are cut.
---
"result": {
  "imported": 6,
  "unknowns_added": 0,
  "total": 15
}
```

八份里的六份，总数十五。该会话之前已关闭 O1，而 `close_binary` 会清空账本，即使没有二进制打开 {{mcp Retained application Evidence inputs}}。打开另一个目标或重启当前目标会保留记录。

所以当 O2 打开时，O1 记录已经没了。然后 `compare_functions` 跑了两次，内联传入 `_percent_change` 与 `_total` 的 O1 dossier。该工具在自己的结果之前记录两侧。那两份 O1 记录回到了账本，所以导入加入了另外六份。

这十五份是六份新记录与已经在那里的九份：

- 来自调用 17 与 18 的两份 O2 dossier。
- 比较作为其源记录的两份 O1 dossier。
- 来自调用 20 与 21 的两份比较记录。
- 来自调用 22 的 `verify_reconstruction` 记录。
- 两次比较打开的未知事项的两份变更记录（[残余未知事项](#s-residual-unknowns-and-coverage)）。

[图](#fig-5-5) 跟着包从会话到其四个读者。

```figure
id: fig-5-5
kind: flow
title: one bundle from the MCP session to four readers
claim: One canonical file leaves the session, and the CLI summary, the CLI export, the CLI import, and a second MCP session all read it without Ghidra.
caption: Read left to right. Solid teal is a durable write, solid ink a call. From capture/out/10-mcp-14-export-evidence-bundle-O1.json, 11-bundles.txt, 11-inspect-evidence-bundle-O1.json, 12-evidence-export.txt, 13-evidence-import.json, and 10-mcp-23-import-evidence-bundle-O1.json.
```

## A bundle from an earlier release {#s-evidence-bundles-export-and-import-a-bundle-from-an-earlier-release}

读包的发行版用自己的哈希规则检查每一个 id。套件保留了 rea 6.5.0 为本手册写的 O1 包，并在 6.7.0 把它交给 `rea evidence-import`。导入以退出码 1 停下。

```listing
title: rea 6.7.0 refuses the O1 bundle of rea 6.5.0
source: capture/out/13-evidence-import-rea-6.5.0.json
lang: json
note: The remediation and the details are cut.
---
{
  "error": "Analysis failed",
  "code": "evidence_integrity_mismatch",
  "category": "integrity_mismatch",
  "message": "Evidence bundle does not match the bundle schema at records.3.evidence_id: Evidence semantic identifier does not match its record. Supply an unmodified bundle written by export_evidence_bundle or rea evidence-export.",
  "retryable": false,
  …
}
```

包字节就是 6.5.0 写的字节。发行版 6.5.0 把值为 `null` 的 `relationship_coverage` 留在语义投影之外，而 6.7.0 把它哈希为 `null`（[Evidence 记录](#s-the-evidence-record)）。旧包的记录 0 到 2 是带覆盖的 `analyze_function` dossier，它们的 id 仍然验证通过。记录 3 是 `list_procedures` 记录，第一份带 `null` 覆盖的，所以它是第一个失败的 id。

该错误不可重试，且 rea 不迁移已保存的 Evidence。把 rea 版本与你归档的每一个包一起保留，这样你就能用那个版本再读包。要在新发行版上使用旧证据，用那个发行版再跑分析并导出一个新包。

```takeaways
- 在 `close_binary` 之前导出一个包，因为关闭会清空账本。
- 在你把包导入任何地方之前，用 `rea inspect-evidence-bundle` 读它。
- 当两个人交换证据时，比较包摘要，绝不要比较文件名。
- 当会话已持有部分记录时，预期 `imported` 低于记录计数。
- 把 rea 版本与每一个包一起归档，并在升级之后重新生成证据。
```

Sources: capture/README.md; capture/out/10-mcp-14-export-evidence-bundle-O1.json, capture/out/10-mcp-23-import-evidence-bundle-O1.json, capture/out/11-bundle-O1.json, capture/out/11-bundles.txt, capture/out/11-inspect-evidence-bundle-O1.json, capture/out/11-inspect-evidence-bundle-O2.json, capture/out/12-evidence-export.json, capture/out/12-evidence-export.txt, capture/out/13-evidence-import.json, capture/out/13-evidence-import-rea-6.5.0.json, capture/fixtures/bundle-rea-6.5.0-O1.json; rea 6.7.0 at 27dc42d: src/domain/evidenceBundle.ts, src/server/registerSessionRecordTools.ts, src/application/EvidenceBundleFiles.ts, src/application/EvidenceBundleCommands.ts, src/application/JsonFiles.ts, src/cliEvidenceCommands.ts, src/cli/analysisViewCommands.ts, src/application/investigation/EvidenceLedger.ts, src/server/registerFunctionComparisonTool.ts, src/server/sessionEvidence.ts; rea docs/mcp-contracts.md, rea docs/cli.md
