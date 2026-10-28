# ResidualUnknown、record_unknown 与 coverage

> 一个未知事项是带有自己 id 与修订链的持久记录，而任何结果里的空列表都告诉你去检查覆盖。

`_percent_change` [dossier](manuals/reverse-engineering-101/capture/out/10-mcp-09-analyze-function-percent-change-O1.json) 列出 `"callees": []`。一个 agent 读那一行，就写出该函数什么都不调用。记录支撑的比那更少。它说明 Ghidra 解析了哪些调用，而 rea 对仍然开放的东西有一种记录类型。读完本节后，你能读一份 ResidualUnknown 的字段，用 `record_unknown` 打开一个，并说出空列表证明什么。

## 空列表证明什么 {#s-residual-unknowns-and-coverage-what-an-empty-list-proves}

dossier 有一个空的 `callees` 数组，并在 840 行之后有一条关于它的限制。Callees 只持有已解析的目标。记录说这个集合是完整的：`relationship_coverage.status` 是 `complete`，且 `unresolved_calls` 为空。Complete 表示 Ghidra 返回了每一次已解析的调用引用。它并不表示 Ghidra 找到了程序在运行时能做的每一次调用。

```listing
title: an empty list and the limitation that qualifies it
source: capture/out/10-mcp-09-analyze-function-percent-change-O1.json
lang: json
note: Line 1052 and line 1894 of the file. Everything between them is cut.
---
"callees": [],
…
"Resolved reference metadata identifies computed, indirect, external, call, jump, and data edges; unresolved targetless flows remain unknown, and function classifications distinguish thunks and externals.",
```

provider 文档陈述同样的界限：调用者与被调用者列表只持有 Ghidra 解析过的函数 {{ghidra Admitted function-analysis semantics}}。

每一个 rea 工具背后的设计规则更短：缺失的覆盖表示未知，而不是不存在 {{design Define the contract}}。

**关系覆盖：** Evidence 记录的字段 `relationship_coverage`，陈述调用者与被调用者集合有多完整。其状态是 `complete`、`partial` 或 `unknown`。`partial` 值列出其限制，并可点名受限的方向。`unknown` 值给出理由。当 provider 对 `procedure_callers` 或 `procedure_callees` 不报告覆盖时，rea 写入 `unknown`。报告无覆盖的任何其他操作的记录有 `null`。

provider 注意事项留在 `limitations` 里，不会让覆盖变成部分。同一份契约设定 `complete` 的界限。它表示 rea 在没有已知读限制的情况下返回了该集合。它并不声称运行时可能出现的每一条边 {{design Define the contract}}。

dossier 有一部分用数字声明其覆盖。值流报告它是否被截断，以及省略了多少操作、输入与边。`inspect-evidence-bundle` 为包里的每一份 dossier 重复那些数字。

```listing
title: the coverage numbers of one dossier in the bundle summary
source: capture/out/11-inspect-evidence-bundle-O1.json
lang: json
note: One of the eight records. The fields before native_dossier are cut.
---
"native_dossier": {
  "available": true,
  "procedure_address": "0x100000500",
  "procedure_name": "_percent_change",
  "value_flow": {
    "status": "observed",
    "truncated": false,
    "omitted_operations_lower_bound": 0,
    "known_omitted_inputs": 0,
    "known_omitted_edges": 0
  }
}
```

这里的零是 rea 站得住脚的计数。别处的空数组是没有这类陈述的计数。契约说明那些字段是干什么的：`native_dossier.value_flow` 自己报告截断、不可用元数据与未知元数据 {{mcp Tool results}}。

抓取里另外两个空列表带着同样的教训。`14-compare-bundles.json` 里的 `rea compare` 列出只在一个包里的十条记录。它把每一条都分类为带结论种类 `unresolved_branch` 的 `unknown`，因为包没有标记说它是完整的（[compare](#s-compare-and-compare-functions)）。`15-js-app-view-summary.json` 里的 JavaScript 摘要视图对一个六文件应用报告 `"semantic_unknowns": 118`。它把语义覆盖标为 `unknown`（[应用图](#s-analyze-javascript-application)）。[图](#fig-5-3) 把三份列表并排放。

```figure
id: fig-5-3
kind: comparison
title: three empty lists and what each one proves
claim: An empty callees array with complete coverage, a zero unknown count, and a one-sided bundle record each prove that nothing was observed, never that nothing exists.
caption: Read each column top to bottom, from the captured value to the record's own words to what you can say. From capture/out/10-mcp-09-analyze-function-percent-change-O1.json, 10-mcp-14-export-evidence-bundle-O1.json, and 14-compare-bundles.json.
```

## ResidualUnknown 记录 {#s-residual-unknowns-and-coverage-the-residualunknown-record}

**残余未知：** 证据尚未解决的一个问题。它作为带 `unk_` id、修订链、状态以及会关闭它的证据的记录保留。残余未知有这些字段。

| 字段 | 取值 |
| --- | --- |
| `unknown_id` | `unk_` 与对 `domain`、`question`、`scope_digest` 以及存在时的 `comparison_conclusion_scope` 的 SHA-256 |
| `revision` | 从 1 起的整数 |
| `previous_revision_digest` | 前一修订的摘要，或修订 1 的 `null` |
| `revision_digest` | 不含本字段的记录的 SHA-256 |
| `scope_digest` | 主体工件的 SHA-256，或 `null` |
| `question` | 非空文本，空白已折叠 |
| `status` | `open`、`investigating`、`blocked`、`contradicted` 或 `resolved` |
| `severity` | `low`、`medium`、`high` 或 `critical` |
| `domain` | 自由文本，rea 自己的比较用 `function-comparison` |
| `comparison_conclusion_scope` | 可选：比较的 `ev_` id 与未知事项所关的维度，仅在 `function-comparison` 域 |
| `supporting_evidence_ids`, `contradicting_evidence_ids` | `ev_` id，同一 id 不同时出现在两个列表 |
| `required_authority`, `required_confidence`, `required_environment` | 什么证据会解决该问题 |
| `recommended_probes` | `operation` 与 `rationale` 对 |
| `relationships` | 对另一个 `unk_` id 的 `depends-on`、`related-to` 或 `contradicts` |
| `resolution` | `null`，或带至少一个 `ev_` id 的 `verified`，或 `withdrawn`，或 `out-of-scope` |
| `mutation_evidence_ids` | 改变该未知事项的记录的 `ev_` id，至少一个 |

模式拒绝打破十一条规则之一的记录。其中四条保持身份与修订链健全。未知 id 必须匹配其自身字段的哈希。修订摘要必须匹配。只有修订 1 没有前驱。只有已解决的未知事项带着决议。

另外七条检查证据与链接。被反驳的未知事项需要反驳证据。未知事项不能关联自己，且没有关系可以出现两次。没有证据 id 可以在一个列表里出现两次，也没有 id 可以既支持又反驳该未知事项。比较范围必须点名支持或反驳该未知事项的一次比较。它只允许在 `function-comparison` 域。

id 让问题成为身份。`createResidualUnknown` 折叠问题里的空白，然后对 `domain`、`question`、`scope_digest` 以及未知事项有时的比较范围的规范 JSON 做哈希。同一域里关于同一目标的同一问题总有同一个 `unk_` id。因此带那个问题的第二次 `record_unknown` 回答 `already-exists`。当输入点名反驳证据时，首个状态是 `contradicted`，否则是 `open`。

一次改变是新修订，绝不是编辑。`update_unknown` 接受 `expected_revision` 与完整的新状态。账本对未知 id 回答 `not-found`，并在期望修订过期时回答 `revision-conflict`。新修订的 `revision` 加一，并把旧的 `revision_digest` 作为其 `previous_revision_digest`。

`list_unknowns` 按 `status`、`severity` 与 `domain` 过滤，并按 id 顺序返回当前头。默认返回全部。给出 `offset` 与 `limit` 以得到一页。结果给出 `total` 与 `next_offset`，最后一页上为 `null`。

每一次变更本身就是一份 Evidence 记录。其 provider 是 `rea-unknown-registry` 版本 `1`，其谓词类型是 `rea.residual-unknown-mutation`。其置信度是 `derived`，权威是 `analyst-inference`。它带着一条限制：`"Registry mutation evidence records analyst intent, not proof of the answer."` 未知事项的 `mutation_evidence_ids` 点名那些记录，于是两本账本共享一份哈希链接的历史。

```figure
id: fig-5-2
kind: structure
title: a ResidualUnknown and its revision chain
claim: An unknown keeps its id across revisions, each revision names the digest of the one before, and each change writes its own Evidence record.
caption: Read left to right. Revision 1 is the unknown that registerFunctionComparisonTool.ts records for the _total comparison in the comparison capture. The right column shows the fields that an update_unknown call changes.
```

## rea 自己打开的未知事项 {#s-residual-unknowns-and-coverage-unknowns-that-rea-opens-itself}

agent 用 `record_unknown` 打开未知事项，而 rea 自己也会打开一些。`compare_functions` 只要状态不是 `unchanged` 就记录一个。域是 `function-comparison`。`changed` 比较得到严重度 `medium`。其支持证据是左侧 dossier 与比较记录，其反驳证据是右侧 dossier，所以其首个状态是 `contradicted`。

`unknown` 比较得到严重度 `high`，三条记录都支持它。每个未知事项在 `comparison_conclusion_scope` 里点名该比较。`changed` 比较在那里点名其已改变的维度。`unknown` 比较点名其未知维度并加上维度 `overall`。两者都要求 `shipped-artifact` 权威与 `observed` 置信度，并都推荐一个探针：`analyze_function`，理由是 "Capture complete dossiers for both functions under the same target context."

抓取两次撞上这条规则。`10-mcp-21-compare-functions-total.json` 里的 `_total` 比较是 `changed`，所以它打开一个状态为 `contradicted` 的 `medium` 未知事项。`10-mcp-20-compare-functions-percent-change.json` 里的 `_percent_change` 比较在其引用维度上是 `unknown`。它打开一个状态为 `open`、范围到 `overall` 与 `references` 的 `high` 未知事项。

没有文件显示这两条记录，因为两次包导出都在任何比较之前跑。因此抓取里每一个计数都读作 `"unknowns": 0` 或 `"unknown_revisions": 0`。`rea compare` 摘要为未知历史保留单独计数器，`unknowns_added`、`unknowns_advanced` 与 `unknowns_diverged`（`14-compare-bundles.json`），而由于同一原因它们全部为零。

验证工具在无法完成时做同样的事。标签上的用户可见错误目录列出每一个记录的问题，例如重建验证的 "Does the reconstruction satisfy every declared claim?"。[第 35 课](phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns) 在 Python 里构建同样的账本，以问题为身份，以所需权威为关闭条件。

```takeaways
- 在把空列表叫作「没有」之前，先读 `relationship_coverage` 与 `limitations`。
- 用 `record_unknown` 记录一个开放问题，并点名会关闭它的权威。
- 把 `expected_revision` 传给 `update_unknown`，并在 `revision-conflict` 之后重读该未知事项。
- 只用观察到的记录的 `evidence_ids` 关闭未知事项，绝不用一句话。
```

Sources: capture/out/10-mcp-09-analyze-function-percent-change-O1.json, capture/out/11-inspect-evidence-bundle-O1.json, capture/out/10-mcp-14-export-evidence-bundle-O1.json, capture/out/10-mcp-20-compare-functions-percent-change.json, capture/out/10-mcp-21-compare-functions-total.json, capture/out/14-compare-bundles.json, capture/out/15-js-app-view-summary.json; phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns; rea 6.7.0 at 27dc42d: src/domain/residualUnknown.ts, src/domain/relationshipCoverage.ts, src/domain/evidence.ts, src/application/binary/BinarySession.ts, src/application/investigation/EvidenceLedger.ts, src/application/investigation/UnknownEvidence.ts, src/server/registerSessionRecordTools.ts, src/server/registerFunctionComparisonTool.ts, src/server/recordDerivedEvidence.ts, docs/user-visible-errors.csv; rea docs/ghidra-provider.md, rea docs/tool-design.md, rea docs/mcp-contracts.md
