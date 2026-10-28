# compare_functions and rea compare

> compare_functions 在八个维度上对两份 dossier 做 diff，并把每一个报告为 unchanged、changed 或 unknown，而其汇编维度是一次没有重定位规范化的文本 diff。

你以 `-O2` 重建了 `ledger.c`，并想在信任关于 `-O1` 构建的主张之前知道编译器改了哪些函数。抓取为 `_percent_change` 与 `_total` 问了 rea 那个问题，两个构建轮流打开。读完本节后，你能读一份比较记录，并说出其八个维度各自比较什么。你也能点名把字节级证明留在 rea 之外的那条限制。

## Two dossiers in, one derived record out {#s-compare-and-compare-functions-two-dossiers-in-one-derived-record-out}

`compare_functions` 把两份完整的 Evidence 记录作为 `left` 与 `right` 接受。每一份用 `parseEvidence` 解析，所以带被篡改 id 的记录被拒绝。每一份必须是谓词类型为 `rea.analysis` 的 `analyze_function` 记录，否则工具回答 "Expected analyze_function Evidence"。抓取传入了它几轮调用之前收到的 dossier。

```listing
title: the request for _percent_change across the two builds
source: capture/out/10-mcp-20-compare-functions-percent-change.json
lang: json
note: The kit kept each evidence_id and replaced the complete dossier with a marker that names the file holding it.
---
"name": "compare_functions",
"arguments": {
  "left": {
    "evidence_id": "ev_b492c85e…",
    "record": "<cut by run.py: the complete analyze_function record, see 10-mcp-09-analyze-function-percent-change-O1.json>"
  },
  "right": {
    "evidence_id": "ev_142cc943…",
    "record": "<cut by run.py: the complete analyze_function record, see 10-mcp-17-analyze-function-percent-change-O2.json>"
  }
}
```

答案是来自 provider `rea-function-comparison` 版本 `1` 的一份新 Evidence 记录。其谓词类型是 `rea.function-comparison`，置信度 `derived`，权威 `analyst-inference`。两个输入 id 作为参数与作为 `evidence_links` 出现。该记录没有主体，所以它带着关于工件身份的自动限制（[Evidence 记录](#s-the-evidence-record)）。在它被记录之前，两个输入被记录进会话账本，这就是为什么后来的[导入](#s-evidence-bundles-export-and-import)发现两份 O1 记录已经在那里。

```listing
title: the head of the _percent_change comparison
source: capture/out/10-mcp-20-compare-functions-percent-change.json
lang: json
note: The dimensions, the changes, and the limitations are cut.
---
"normalized_result": {
  "status": "unknown",
  "function_match": {
    "status": "matched",
    "method": "symbol",
    "left_name": "_percent_change",
    "right_name": "_percent_change"
  },
  "left_subject_sha256": "01b5d08b…",
  "right_subject_sha256": "8bbbaa58…",
  "summary": {
    "unchanged": 7,
    "changed": 0,
    "unknown": 1
  },
```

**函数匹配：** rea 如何决定两份 dossier 描述同一个函数。按 `symbol` 的 `matched` 表示两个过程名相等。`mismatched` 或 `ambiguous` 匹配以方法 `explicit` 报告，而一次模糊匹配让整个比较变成 `unknown`。

## The eight dimensions {#s-compare-and-compare-functions-the-eight-dimensions}

`compareDimensions` 以固定顺序跑八次比较：`identity`、`pseudocode`、`assembly`、`comments`、`calls`、`references`、`strings_names` 与 `cfg`。每一个维度有一个状态 `unchanged`、`changed` 或 `unknown`，以及一个左摘要与右摘要。它还有一个左计数与右计数、两个文本维度的 `text_delta`，以及一个 `conclusion_kind`。整体状态在任一维度为 unknown 时是 `unknown`，否则在任一维度 changed 时是 `changed`，否则是 `unchanged`。

当任一份 dossier 在 `facet_availability` 里声明所需 facet 不可用时，一个维度也是带空计数的 `unknown`。没有声明的空 facet 有同样效果。调用维度还读 `relationship_coverage`。

| Dimension | What is compared | `_percent_change` | `_total` |
|---|---|---|---|
| `identity` | the normalized identity of the procedure | unchanged | unchanged |
| `pseudocode` | the decompiler text, as lines | unchanged, 272 and 272 code points | changed, 300 to 2904 code points |
| `assembly` | the listing text, as lines | unchanged, 161 and 161 | changed, 336 to 1866 |
| `comments` | comment text at normalized offsets | unchanged, 0 and 0 | unchanged, 0 and 0 |
| `calls` | the resolved callees | unchanged, 1 and 1 | unchanged, 1 and 1 |
| `references` | reference endpoints and kinds | unknown, 3 and 3 | changed, 4 to 13 |
| `strings_names` | referenced strings and names | unchanged, 1 and 1 | changed, 2 to 11 |
| `cfg` | the basic blocks and edges, address-normalized | unchanged, 3 and 3 | changed, 5 to 16 |

## One unknown dimension {#s-compare-and-compare-functions-one-unknown-dimension}

`_percent_change` 比较有七个 `unchanged` 维度与一个 `unknown`，所以整份记录是 `unknown`。未知维度是 `references`。两侧有三个引用与同样的具名端点。每一份 dossier 的一个入站引用是没有源过程的 `DATA` 引用，所以那个端点没有名字。

```listing
title: the references dimension of the _percent_change comparison
source: capture/out/10-mcp-20-compare-functions-percent-change.json
lang: json
note: Nothing inside the dimension is cut.
---
{
  "dimension": "references",
  "left_count": 3,
  "right_count": 3,
  "evidence_links": [
    "ev_b492c85e…",
    "ev_142cc943…"
  ],
  "limitations": [
    "Unnamed reference endpoints have no stable identity across different artifacts, so equal named endpoints do not establish equal references."
  ],
  "status": "unknown",
  "left_digest": null,
  "right_digest": null,
  "text_delta": null,
  "conclusion_kind": "unresolved_branch"
},
```

该规则只在两份 dossier 来自不同文件时适用。在一个文件内部，地址是稳定身份。`-O1` 与 `-O2` 构建是不同文件。所以 rea 不能说左边的未命名端点就是右边的那个。种类不同的边仍然计为变更，这就是为什么 `_total` 的引用维度读作 `changed`。

在整体状态之前先读摘要。一个未知维度让整份记录变成 `unknown`，并打开严重性为 `high` 的一个残余未知事项（[残余未知事项](#s-residual-unknowns-and-coverage)）。另外七个维度保留各自的状态。关于 `_percent_change` 的伪代码或汇编的主张仍然通过（[验证](#s-verify-reconstruction)）。关于 `references` 或 `overall` 的主张不通过。

两次比较的 `calls` 维度都带着两条限制，每一侧一条。每一条说只返回已解析的 Ghidra 调用引用。它们限定 `unchanged` 状态，并不改变它。

## The text dimensions {#s-compare-and-compare-functions-the-text-dimensions}

两个文本维度是带预算的行 diff：100 ms 与 10,000 次编辑。跑出预算的 diff 让维度变成 `unknown`，限制为 `"Bounded line diff exceeded its time or edit-distance limit."`。计数是文本的码点数。`text_delta` 报告加入的行、删除的行与 hunk。两个文本维度都带着限制 `"Exact provider text is compared without address or generated-name normalization; layout-only differences do not establish a behavior change."`。

对 `_total`，伪代码在 11 个 hunk 里增加了 109 行并丢掉了 11 行（`10-mcp-21-compare-functions-total.json`）。汇编在 2 个 hunk 里增加了 61 行并丢掉了 12 行。`_total` 的 `-O2` 构建有 16 个基本块，而 `-O1` 构建有 5 个，以及 13 个引用，而它曾有 4 个。那些是 rea 陈述的事实，记录停在那里。编译器为什么做那个变更，是你要用两份汇编 listing 回答的问题。

```figure
id: fig-5-6
kind: comparison
title: compare_functions on two functions across the -O1 and -O2 builds
claim: The compiler left _percent_change the same on seven dimensions with references unknown, changed _total on five, and rea reports counts without saying why.
caption: Read each table top to bottom. Amber rows are changed dimensions, and the dashed row is unknown. From capture/out/10-mcp-20-compare-functions-percent-change.json and 10-mcp-21-compare-functions-total.json.
```

## The assembly limit {#s-compare-and-compare-functions-the-assembly-limit}

每一个汇编维度都带着两条限制，不论其状态是 `unchanged` 还是 `changed`。

```listing
title: the assembly dimension of the _total comparison
source: capture/out/10-mcp-21-compare-functions-total.json
lang: json
note: Nothing inside the dimension is cut.
---
{
  "dimension": "assembly",
  "left_count": 336,
  "right_count": 1866,
  "evidence_links": [
    "ev_a1fe53ff…",
    "ev_bfe3275b…"
  ],
  "limitations": [
    "Exact provider text is compared without address or generated-name normalization; layout-only differences do not establish a behavior change.",
    "Assembly is opaque provider text; relocation normalization is unavailable."
  ],
  "status": "changed",
  "left_digest": "40e2d441…",
  "right_digest": "e1140153…",
  "text_delta": {
    "added_lines": 61,
    "removed_lines": 12,
    "hunks": 2
  },
  "conclusion_kind": "derived_relationship"
},
```

rea 在任何 diff 跑之前附上这些字符串。dossier 的汇编是 Ghidra 的 listing 文本，地址与已解析操作数在文本里面。该工具逐行比较那份文本。它不解码指令，它不知道链接器会修补哪些操作数字节，也不能掩掉它们。同一代码在不同地址的两份副本 diff 为 `changed`，一份可重定位对象与其已链接映像比较也 diff 为 `changed`。跨引擎同样成立：当两份 dossier 来自不同 provider 时，两个文本维度都变成 `unknown`，带着 `"Exact text comparison requires one provider identity."`。

因此一个 `unchanged` 汇编维度表示来自一个引擎的相等文本，而一个 `changed` 表示不同文本。两者都不是关于字节的陈述。字节级证明把重定位字段清零，并比较被引用的表。[第 36 课](phases/13-tools-and-protocols/36-rebuild-and-prove-equal) 构建那个证明，而第 7 部分对同一夹具跑它。引用维度有自己的限制，因为它比较端点而不是种类：`"Reference endpoints differ independently of provider reference-kind metadata."`。

## rea compare on two bundles {#s-compare-and-compare-functions-rea-compare-on-two-bundles}

`rea compare LEFT RIGHT`，也写作 `rea compare-bundles`，在没有会话的情况下比较两个包文件。它按 `evidence_id` 工作：两个包里都有的记录被比较，只在一个包里的记录是未解决分支。整体状态在一次变更未解决时立刻是 `unknown`。

```listing
title: rea compare on the O1 and O2 bundles
source: capture/out/14-compare-bundles.json
lang: json
note: Nine of the ten changes are cut, and so are the closing limitations.
---
{
  "status": "unknown",
  "left_bundle_sha256": "47160c2d…",
  "right_bundle_sha256": "e0a9fe04…",
  "summary": {
    "records_unchanged": 0,
    "records_added": 0,
    "records_removed": 0,
    "records_changed": 0,
    "unknowns_unchanged": 0,
    "unknowns_added": 0,
    "unknowns_removed": 0,
    "unknowns_advanced": 0,
    "unknowns_diverged": 0,
    "unresolved": 10
  },
  "changes": [
    {
      "entity": "evidence",
      "key": "ev_142cc943…",
      "classification": "unknown",
      "conclusion_kind": "unresolved_branch",
      "left_evidence_ids": [],
      "right_evidence_ids": [
        "ev_142cc943…"
      ],
      "left_digest": null,
      "right_digest": "142cc943…",
      "limitations": [
        "EvidenceBundle has no inventory completeness marker; one-sided membership may reflect incomplete capture."
      ]
    },
```

十个未解决，没有 unchanged，没有 removed。两个包来自两个不同文件，`ledger-arm64-O1` 与 `ledger-arm64-O2`。没有 `evidence_id` 在两者里，十份记录每一份都是单侧的。该工具不把单侧记录叫作 `removed`，因为包没有完整性标记。

它报告的摘要是规范字节的摘要。`47160c2d` 是没有套件尾随换行的包 O1 的摘要（[导出与导入](#s-evidence-bundles-export-and-import)）。`rea compare` 为一构建的两个包回答「这个证据集里什么变了」。对两个构建，工具是 `compare_functions`，一次一个函数。

```takeaways
- 把完整的 `analyze_function` 记录传给 `compare_functions`，绝不要传摘要或视图。
- 先读 `summary.unknown`，再读未知与已变更维度，然后读 `limitations`。
- 把 unchanged 汇编维度当作来自一个引擎的相等文本，绝不当作相等字节。
- 对一构建的包跑 `rea compare`，否则预期每一份记录都未解决。
```

Sources: capture/out/10-mcp-20-compare-functions-percent-change.json, capture/out/10-mcp-21-compare-functions-total.json, capture/out/14-compare-bundles.json, capture/out/12-evidence-export.txt; phases/13-tools-and-protocols/36-rebuild-and-prove-equal; rea 6.7.0 at 27dc42d: src/domain/functionComparisonSchemas.ts, src/domain/functionComparisonDimensions.ts, src/domain/functionComparisonNormalization.ts, src/domain/functionComparisonResults.ts, src/domain/bundleComparison.ts, src/server/registerFunctionComparisonTool.ts, src/cliEvidenceCommands.ts, src/application/EvidenceBundleCommands.ts; rea docs/mcp-contracts.md
