# verify_reconstruction

> verify_reconstruction 对照一份比较记录为每一条已声明主张打分，而其 pass 表示 provider 文本匹配，绝不是两个函数相等。

你磁盘上有 `ledger.c` 的两个构建，`-O1` 与 `-O2` 可执行文件，以及来自[第 5.5 节](#s-compare-and-compare-functions) 的两份 `compare_functions` 记录。你想让 rea 告诉你 `total` 在两者里是否是同一个函数。那个问题的工具是 `verify_reconstruction`，捕获调用了它一次，带四条主张，得到两次通过与两次失败。读完本节后，你能写一份结构主张的规范，并读 rea 为每一条主张返回的状态。你也能说出一次通过证明什么、不证明什么。

## The specification {#s-verify-reconstruction-the-specification}

**规范：** `verify_reconstruction` 的输入：一个 `name` 与至少一条主张的列表。每一条主张有一个 `claim_id`、一个 `title`、一个 `kind`、一个 `dimension`，以及一个 `comparison_evidence_id`（[捕获](manuals/reverse-engineering-101/capture/out/10-mcp-02-tools-list.json)）。最后一个是会话里已有的一份比较记录的 `ev_` id。种类点名该记录的生产者。一条 `behavioral` 主张指向一份 `compare_process_captures` 记录，一条 `structural-function` 主张指向一份 `compare_functions` 记录，一条 `structural-artifact` 主张指向一份 `compare_artifacts` 记录。一条 `structural-function` 主张点名九个维度之一：`overall`、`identity`、`pseudocode`、`assembly`、`comments`、`calls`、`references`、`strings_names` 或 `cfg`。

捕获套件在[第 5.5 节](#s-compare-and-compare-functions) 的两份比较记录上构建了四条主张：`percent_change` 的伪代码与汇编，以及 `total` 的伪代码与汇编。

```listing
title: the specification the capture sent
source: capture/out/10-mcp-22-verify-reconstruction.json
lang: json
note: The second and third claims are cut. The response follows the request in the same file.
---
{
  "request": {
    "jsonrpc": "2.0",
    "id": 22,
    "method": "tools/call",
    "params": {
      "name": "verify_reconstruction",
      "arguments": {
        "specification": {
          "name": "ledger functions rebuilt at -O2 against the -O1 build",
          "claims": [
            {
              "claim_id": "percent-change-pseudocode",
              "title": "percent_change: the Ghidra pseudocode is the same text in the -O1 and -O2 builds",
              "kind": "structural-function",
              "dimension": "pseudocode",
              "comparison_evidence_id": "ev_2161e17a…"
            },
            …
            {
              "claim_id": "total-assembly",
              "title": "total: the Ghidra assembly is the same text in the -O1 and -O2 builds",
              "kind": "structural-function",
              "dimension": "assembly",
              "comparison_evidence_id": "ev_40ba96d8…"
            }
          ]
        }
      }
    }
  },
  …
}
```

该工具没有 CLI 命令。它是没有 CLI 命令的 65 个 MCP 工具之一，所以一次性的 `rea` 调用不能跑它。经 MCP，处理器用 `session.exportEvidenceBundle()` 取当前连接的包，并对照它验证规范。其比较 id 不在该包里的主张会以 `Missing comparison Evidence` 让整次调用失败。其两个源不是 `analyze_function` 记录的比较通不过源检查。

那条规则解释了捕获的顺序。步骤 15 的 `close_binary` 清空了 `-O1` 目标的保留记录。两份 `-O1` dossier 在步骤 20 与 21 回到账本。`compare_functions` 在记录比较之前先记录其两个内联输入。然后步骤 23 的 `import_evidence_bundle` 调用报告 `imported: 6` 与 `total: 15`（[捕获](manuals/reverse-engineering-101/capture/out/10-mcp-23-import-evidence-bundle-O1.json)）。包 `O1` 持有八份记录，而两次比较已经恢复了其中两份。

## What rea returned {#s-verify-reconstruction-what-rea-returned}

响应是一份像其他每一个结果一样的 Evidence 记录，带着 `subject: null`、provider `rea-reconstruction-verifier` 版本 `1`、谓词 `rea.reconstruction-verification`、`confidence: "derived"`，以及 `authority: "analyst-inference"`。`parameters` 持有规范的 SHA-256 与主张 id，所以当一条主张改变时记录的 id 也会改变。

```listing
title: the verification record, head and summary
source: capture/out/10-mcp-22-verify-reconstruction.json
lang: json
note: The analysis_profile, the per-claim items, the probes, and the evidence links are cut.
---
      "structuredContent": {
        "evidence_id": "ev_ccbaea4b…",
        "subject": null,
        "provider": {
          "id": "rea-reconstruction-verifier",
          "name": "REA reconstruction verifier",
          "version": "1"
        },
        …
        "normalized_result": {
          "status": "fail",
          "specification_sha256": "9e8d22fa…",
          "summary": {
            "total": 4,
            "passed": 2,
            "failed": 2,
            "unknown": 0,
            "behavioral": 0,
            "structural": 4
          },
          …
          "limitations": [
            "Pass means every declared claim passed; it does not establish global implementation equivalence."
          ]
        },
        "confidence": "derived",
        "authority": "analyst-inference",
        …
```

整体 `status` 遵循一条规则：任一主张失败时是 `fail`，否则任一主张未解决时是 `unknown`，否则是 `pass`。`summary` 按状态与按种类计数主张。记录自己的 `limitations` 加上 "Artifact identity is unavailable for this observation."，也就是 `createEvidence` 追加给没有主体的任何记录的那条。

## The status of one claim {#s-verify-reconstruction-the-status-of-one-claim}

**主张状态：** `pass`、`fail` 或 `unknown`，按固定顺序从三个输入计算。首先，任何限制让主张变成 `unknown`。限制来自源的权威。

源 dossier 里不完整的调用覆盖也是一条限制。它适用于一条 `calls` 主张，以及没有其他已变更维度的一条 `overall` 主张。其次，观察到的状态为 `changed`、`added`、`removed` 或 `contradiction` 让主张变成 `fail`。第三，观察到的状态为 `unknown` 或 `truncated`，或比较上打开的残余未知事项，让主张变成 `unknown`。其余所有情况下主张是 `pass`。

对一条 `structural-function` 主张，观察到的状态是比较记录里具名维度的 `status`。

```listing
title: the total-assembly claim
source: capture/out/10-mcp-22-verify-reconstruction.json
lang: json
note: The evidence_links array and 28 of the 30 limitation strings are cut. The Residual unknown line is the one this claim adds to the limitations of the comparison record.
---
                "claim_id": "total-assembly",
                "kind": "structural-function",
                "dimension": "assembly",
                "status": "fail",
                "observed_status": "changed",
                "comparison_evidence_id": "ev_40ba96d8…",
                "left_evidence_ids": [
                  "ev_a1fe53ff…"
                ],
                "right_evidence_ids": [
                  "ev_bfe3275b…"
                ],
                …
                "unknown_ids": [
                  "unk_823f4184…"
                ],
                "limitations": [
                  "Artifact identity is unavailable for this observation.",
                  …
                  "Residual unknown: Function comparison is changed (comparison ev_40ba96d8…)",
                  …
                ]
```

两条 `percent_change` 主张通过，尽管比较记录 `ev_2161e17a` 整体是 `unknown`。每一条主张只读自己的维度，而 `ev_2161e17a` 把伪代码与汇编都报告为 `unchanged`。其一个未知维度是 `references`。它打开的残余未知事项只点名 `overall` 与 `references`，所以两条主张都不在 `unknown_ids` 里列出它。对 `references` 或对 `overall` 的主张会读到 `unknown`。

两条 `total` 主张失败，因为 `ev_40ba96d8` 把伪代码与汇编报告为 `changed`，且其八个维度里有五个都变了。`unknown_ids` 条目不是验证器发明的。每当其状态不是 `unchanged` 时，`compare_functions` 就记录一个残余未知事项，问题为 `Function comparison is changed (comparison ev_...)`，对变更的严重性为 `medium`。验证器在包里找到那个未知事项，在两条 `total` 主张上列出其 id，并将其问题抄进限制。主张仍然读作 `fail`，因为在上面的顺序里，一次已变更的观察排在打开的未知事项之上。

如果一条主张出来是 `unknown`，该调用会再记录一个它自己的未知事项。当整体状态是 `unknown` 时，处理器用验证器推荐的探针记录问题 "Does the reconstruction satisfy every declared claim?"。一次 `pass` 与一次 `fail` 不记录新东西，且这里的 `recommended_probes` 为空。

```figure
id: fig-7-1
kind: tree
title: four claims over two comparison records
claim: Each claim takes its status from one dimension of one comparison record, and the total claims also carry the unknown that compare_functions recorded.
caption: Read top down. The verification record cites four claims, each claim cites one comparison record, and each comparison record cites a left and a right dossier. Amber claims passed and dashed rose claims failed. Ids are cut to their first eight hex digits. From capture/out/10-mcp-22-verify-reconstruction.json.
```

## What a pass does not prove {#s-verify-reconstruction-what-a-pass-does-not-prove}

每一份验证记录的固定限制这样说：`"Pass means every declared claim passed; it does not establish global implementation equivalence."`。一条 `structural-function` 维度能通过的主张是「同样的 provider 文本」，因为 `compare_functions` 对 Ghidra 打印的伪代码与汇编做行 diff。伪代码与汇编维度在每一份比较记录里带着一条附注：`"Exact provider text is compared without address or generated-name normalization; layout-only differences do not establish a behavior change."`。汇编维度加上：`"Assembly is opaque provider text; relocation normalization is unavailable."`（[捕获](manuals/reverse-engineering-101/capture/out/10-mcp-20-compare-functions-percent-change.json)）。rea 6.7.0 里没有任何东西运行一个函数或编译一个函数。一条通过的主张表示两份反编译器输出逐行匹配，一条失败的主张表示它们不匹配。

对 `ledger` 夹具有两个后果。尽管两个构建来自同一源行，`total` 主张仍然失败。`-O2` 把循环展开成 62 条指令，而 `-O1` 有 13 条（[捕获](manuals/reverse-engineering-101/capture/out)）。不同的文本并不意味着不同的行为。

反过来也成立。在查找表里带错误常量的重建与原件有同样的汇编文本。文本永远不显示那一个不同的数据字节，所以一条文本主张可以在错误的函数上通过。[第 7.2 节](#s-a-proof-harness-outside-rea) 构建解决这两种情况的两项检查。

rea 仓库有一个供自己使用的更宽验证器。rea 文档的 readiness 页描述 `npm run verify:readiness`，一次带名为 `verify-reconstruction-closure` 阶段的九阶段符合性运行，并说明它是什么：

```rule
label: the readiness verifier is not a tool
source: readiness Reconstruction readiness conformance
---
The report evaluator belongs to the verifier of the repository. It is not a public REA tool.
```

其聚合规则是要抄进你自己 harness 的那条：

```rule
label: nothing weaker than pass adds up to pass
source: readiness Required stages
---
A stage result of fail, unknown, unsupported, truncated, or skipped never adds up to pass.
```

```takeaways
- 在调用 verify_reconstruction 之前，把两份 dossier 与比较记录放进同一个连接。
- 在读整体状态之前，先读每一条主张的 observed_status 与 unknown_ids。
- 把一条通过的结构主张当作「同样的 Ghidra 文本」，并自己证明行为与字节。
- 在 close_binary 之前导出包，因为关闭会清空保留的记录。
```

Sources: capture/out/10-mcp-22-verify-reconstruction.json, 10-mcp-20-compare-functions-percent-change.json, 10-mcp-21-compare-functions-total.json, 10-mcp-11-analyze-function-total-O1.json, 10-mcp-18-analyze-function-total-O2.json, 10-mcp-23-import-evidence-bundle-O1.json, 10-mcp-02-tools-list.json, 10-mcp-session.txt; rea at rea-agents-6.7.0 (27dc42d): src/domain/reconstructionVerification.ts, src/domain/reconstructionUnknowns.ts, src/domain/functionCallCoverage.ts, src/server/registerInvestigationTools.ts, src/server/registerFunctionComparisonTool.ts, src/domain/functionComparisonDimensions.ts, src/domain/evidence.ts, src/cliCommandNames.ts; rea docs/reconstruction-readiness.md
