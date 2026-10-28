# Evidence 记录

> 每一次成功的 rea 观察都是一份带十六个字段的严格记录，而其 id 是对语义内容的 SHA-256，文件路径留在外面。

一个 agent 告诉你，当 `before` 为 0 时 `_percent_change` 返回 0。你想知道 rea 观察到了什么、哪个引擎说的，以及另一台机器上的同一主张是否会带着同一个 id。抓取把答案放在[一份 Evidence 记录](manuals/reverse-engineering-101/capture/out/10-mcp-09-analyze-function-percent-change-O1.json)里。读完本节后，你能读一份 Evidence 记录的全部十六个字段，并说出哪三个承载信任决定。你也能从一份已抓取的记录重新计算一个 `ev_` id。

## 每一次成功观察的一份记录 {#s-the-evidence-record-one-record-for-every-successful-observation}

**Evidence 记录：** rea 对一次成功观察返回的那一种记录类型。模式是带十六个字段的一个严格对象。带额外字段的记录被拒绝，省略字段的记录也被拒绝。没有调用者或被调用者集合的操作仍然写入 `relationship_coverage`，值为 `null`。MCP 服务器把完整的规范记录返回两次，一次作为 `structuredContent`，一次作为文本副本 {{mcp Tool results}}。

```listing
title: the sixteen fields of the _percent_change dossier record
source: capture/out/10-mcp-09-analyze-function-percent-change-O1.json
lang: json
note: The profile parameters, the raw result, the normalized result, nine of the ten limitations, and the coverage diagnostics are cut. The kit replaced the text copy of the record with a marker.
---
"evidence_id": "ev_b492c85eb9570bd5f8e866f94523122c8600ea0106603d90e9ea5445cf757b2a",
"subject": {
  "name": "ledger-arm64-O1",
  "digest": {
    "sha256": "01b5d08b08fb94678be5919d0e753d44b505a53107c95b94634f0e5d41c9e375"
  },
  "format": "mach-o",
  "architecture": "arm64",
  "local_path": "$CAPTURE/fixtures/ledger-arm64-O1"
},
"provider": {
  "id": "ghidra",
  "name": "Ghidra",
  "version": "12.1.4"
},
"analysis_profile": {
  …
  "digest": "3fc72c9b4b78498fb992b938f8f3389dc670244a293c1d40abf5e1d10162ed3b"
},
"predicate_type": "rea.analysis",
"operation": "analyze_function",
"parameters": {
  "procedure": "_percent_change"
},
"raw_result": {
  …
},
"normalized_result": {
  …
},
"confidence": "observed",
"authority": "shipped-artifact",
"environment": null,
"limitations": [
  "The session serves operations only after Ghidra reports default auto-analysis complete; incomplete analysis does not expose partial results.",
  …
],
"relationship_coverage": {
  "status": "complete",
  …
},
"locations": [],
"evidence_links": []
```

| 字段 | 在本记录里 | 它持有什么 |
|---|---|---|
| `evidence_id` | `ev_b492c85eb957` 再加 52 个十六进制数字 | `ev_` 与一个 SHA-256 |
| `subject` | `ledger-arm64-O1`，sha256 `01b5d08b08fb`，`mach-o`，`arm64`，一条路径 | 被分析的文件，或 `null` |
| `provider` | `ghidra`，Ghidra，`12.1.4` | 产生该事实的引擎 |
| `analysis_profile` | 摘要 `3fc72c9b4b7` | 已提交的引擎设置，或 `null` |
| `predicate_type` | `rea.analysis` | 主张的种类 |
| `operation` | `analyze_function` | 产生该记录的工具 |
| `parameters` | `{"procedure": "_percent_change"}` | 调用者输入，按原样 |
| `raw_result` | Ghidra 报告 | provider 形式，或 `null` |
| `normalized_result` | dossier，16 个键 | agent 读的规范结果 |
| `confidence` | `observed` | `observed`、`derived` 或 `inferred` |
| `authority` | `shipped-artifact` | 五种来源种类之一 |
| `environment` | `null` | 一次运行的平台与隔离，或 `null` |
| `limitations` | 10 个字符串 | 该事实不覆盖什么 |
| `relationship_coverage` | `complete` | 调用者与被调用者集合是完整、部分还是未知，或其他操作上的 `null` |
| `locations` | `[]` | 地址、范围、路径或文件偏移 |
| `evidence_links` | `[]` | 本记录派生自的那些 `ev_` id |

主体 `format` 是 28 个容器名之一，从 `mach-o` 与 `elf` 到 `javascript` 与 `directory`。体系结构是十个家族之一：`x86`、`x86_64`、`arm`、`arm64`、`mips`、`6502`、`riscv`、`powerpc`、`m68k` 与 `hexagon`。只有 `raw-binary` 格式可以有体系结构 `6502` 或 `m68k`。一个位置有五种形状之一：`address`、`address-range`、`artifact-path`、`file-offset` 或 `file-offset-range`。

MCP 处理器可以在引擎启动之前跑一次预检。它在引擎回答之后构建记录。它用活动目标、provider 与操作调用 `createEvidence`。同一次调用传入参数、结果、配置、原始结果、限制、位置与链接。

有些工具把缩减的参数集交给记录。处理器先记录任何源记录，再记录本记录，然后返回它。在 Ghidra 会话内部，二进制会话做同样的调用。

三个默认值填上生产者省略的内容。当生产者没有点名置信度或权威时，记录得到 `observed` 与 `shipped-artifact`。主体名是路径的最后一段。当根本没有目标时，记录得到限制 `"Artifact identity is unavailable for this observation."`。

## 置信度与权威 {#s-the-evidence-record-confidence-and-authority}

**置信度：** 三个词之一，`observed`、`derived` 或 `inferred`。它是一个类别，绝不是一个数字。**权威：** 事实背后的来源种类，`shipped-artifact`、`controlled-replay`、`historical-reference`、`external-service` 或 `analyst-inference` 之一。这两个字段由生产者设定，而抓取展示四个生产者。

| 生产者 | `confidence` | `authority` | 记录 |
|---|---|---|---|
| `analyze_function`，provider `ghidra` | `observed` | `shipped-artifact` | `10-mcp-09-analyze-function-percent-change-O1.json` |
| `binary_overview`，provider `rea-workflow` | `derived` | `shipped-artifact` | `05-analyze-arm64-O1.json` |
| `compare_functions`，provider `rea-function-comparison` | `derived` | `analyst-inference` | `10-mcp-20-compare-functions-percent-change.json` |
| `inspect_analysis_view`，provider `rea-analysis-view` | `derived` | `shipped-artifact` | `15-js-app-view-summary.json` |
| `record_unknown`，provider `rea-unknown-registry` | `derived` | `analyst-inference` | 抓取里没有 |

小心读 `observed`。在 dossier 里它表示 rea 记录了 Ghidra 返回的内容，以磁盘上的字节为权威。它并不表示伪代码就是程序的源码。provider 文档这样说。汇编是完整的 Ghidra Listing 文本，而伪代码是 Ghidra 反编译器产生的 {{ghidra Admitted function-analysis semantics}}。

`binary_overview` 记录是 `derived`，因为一个 rea 工作流从 provider 调用计算出它。它的第一条限制这样说：`"Derived by an REA composed workflow."` 另外八条是它继承的 Ghidra 限制。每一条以 provider、其版本与操作开头，例如 `"Ghidra (ghidra 12.1.4) read_binary_inventory_summary:"`（`05-analyze-arm64-O1.json`）。[第 35 课](phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns) 用同样三个词与同样五种权威在纯 Python 里构建一份账本。

## 限制、位置与链接 {#s-the-evidence-record-limitations-locations-and-links}

`limitations` 是普通字符串的数组，生产者把自己的追加到它继承的那些上。比较记录展示两种。它的第一条是没有主体的记录的自动那条。接下来 26 条是两侧的 dossier 限制，每一条以 `Left:` 或 `Right:` 为前缀。

```listing
title: the trust fields of the compare_functions record
source: capture/out/10-mcp-20-compare-functions-percent-change.json
lang: json
note: Of the 27 limitations, the first two are shown.
---
"confidence": "derived",
"authority": "analyst-inference",
"environment": null,
"limitations": [
  "Artifact identity is unavailable for this observation.",
  "Left: Cancelling an active Ghidra request terminates its ephemeral database and discards session annotations. The selected target remains open; the next provider query imports the original artifact again.",
  …
],
"locations": [],
"evidence_links": [
  "ev_b492c85eb9570bd5f8e866f94523122c8600ea0106603d90e9ea5445cf757b2a",
  "ev_142cc943d8259d42ce5d62ad5eb0417fcde4de4ee9a20afbfe1fdbc51ed3d259"
]
```

`evidence_links` 点名一份派生记录由哪些记录计算而来。比较链接它比较的两份 dossier，而视图链接其父记录。`locations` 说出在工件里何处看到该事实。`15-js-app.json` 里的 JavaScript 记录带着一个 `artifact-path` 位置，`artifact-root`。Ghidra dossier 一个都不带，因为它的地址住在 `normalized_result` 里面。

`analysis_profile` 即使为空也是身份的一部分。该字段始终存在，作为配置对象或作为 `null`，两种值都计入记录的身份 {{mcp Tool results}}。

配置的 provider 与记录的 `provider` 不同时，以 `"Analysis profile provider does not match Evidence provider"` 拒绝。配置摘要是对其 provider 与参数的规范 JSON 的 SHA-256。[快照缓存](#s-snapshots-and-the-answer-cache) 把同一摘要用作其键的一部分。

## id 是语义内容的哈希 {#s-the-evidence-record-the-id-is-a-hash-of-the-semantic-content}

**语义投影：** id 对其做哈希的那份记录视图。它保留 `subject.digest`、`subject.format` 与 `subject.architecture`，并丢掉 `subject.name` 与 `subject.local_path`。每一个其他字段按原样进入，`relationship_coverage` 在值为 `null` 时也进入。发行版 6.5.0 把值为 `null` 的覆盖字段留在哈希之外。因此发行版 6.7.0 拒绝 6.5.0 包里此类记录的 id（[导出与导入](#s-evidence-bundles-export-and-import)）。

id 是 `ev_` 加上该投影以规范 JSON 的 SHA-256。对象键按 RFC 8785 要求排序。`parseEvidence` 在它读的每一份记录上重新计算哈希，并以 `"Evidence semantic identifier does not match its record"` 拒绝不匹配。

你可以用几行 Node 做同样的检查。下面的脚本排序键、无空格序列化、丢掉两个显示字段，并做哈希。给它一个包文件与一个记录索引，以检查包里的一份记录。

```javascript
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const canonical = (value) => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
};

const file = JSON.parse(readFileSync(process.argv[2], "utf8"));
const pick = (value, index) => {
  if (value.response) return value.response.result.structuredContent;
  if (value.records) return value.records[index];
  return value;
};
const record = pick(file, Number(process.argv[3] ?? 0));
const { evidence_id, subject, ...rest } = record;
const projection = {
  subject: subject === null ? null : { digest: subject.digest, format: subject.format, architecture: subject.architecture },
  ...rest,
};
const digest = createHash("sha256").update(canonical(projection)).digest("hex");
console.log(evidence_id, evidence_id === `ev_${digest}` ? "match" : "mismatch");
```

对 `05-analyze-arm64-O1.json` 跑，它打印 `ev_91bddcdbd53ddd56996c6009458495bbd91fdc8c885238b33432e67691cf1f06 match`，也就是该文件第 2 行上的 id。对 `10-mcp-09-analyze-function-percent-change-O1.json` 跑，它匹配 `ev_b492c85eb9570bd5f8e866f94523122c8600ea0106603d90e9ea5445cf757b2a`。它也匹配 `10-mcp-20` 里的比较记录，并且在索引 0 时匹配 `11-bundle-O1.json` 里的第一条记录。`subject.local_path` 里被掩码的 `$CAPTURE` 路径什么都不改变，因为那个字段在哈希之外。

抓取里有两个文件不匹配，两者教同一条规则。`15-js-app.json` 失败，因为套件用 `--filter-output` 从 `normalized_result` 里切掉了 `graph` 与 `semantic_graph`。`15-js-app-view-summary.json` 失败，因为套件在 `normalized_result.summary.input_path` 里以及在 `locations` 里把抓取目录掩成了 `$CAPTURE`。`subject` 里的路径在哈希之外。别处的路径在哈希之内，带着路径的记录在每台机器上得到不同的 id。

```figure
id: fig-5-1
kind: structure
title: the sixteen fields of one Evidence record
claim: The id hashes every field of the record except subject.name and subject.local_path, so the same observation of the same bytes gets the same id anywhere.
caption: Read top to bottom. Solid rows enter the hash and dashed rows are display fields. Values are from the function capture, digests shown by their first hex digits.
```

[Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler?symbols=off) 机器把一次反编译的每一阶段记进一份证据账本。账本使用同样三个置信度词，并加上一个未知事项的托盘。这个链接打开关掉符号表的那次运行，于是你可以看到哪些事实从 observed 移到 unknown。

```takeaways
- 在 `normalized_result` 之前先读 `confidence`、`authority` 与 `limitations`，并把三者都抄进笔记。
- 把 `observed` 当作「rea 记录了引擎输出」，绝不当作「源码被恢复了」。
- 重新计算你从另一台机器收到的每一份记录的 `ev_` id。
- 在你自己的记录里把路径留在 `normalized_result` 与 `locations` 之外，否则 id 会按机器变化。
```

Sources: capture/out/10-mcp-09-analyze-function-percent-change-O1.json, capture/out/10-mcp-20-compare-functions-percent-change.json, capture/out/05-analyze-arm64-O1.json, capture/out/15-js-app.json, capture/out/15-js-app-view-summary.json, capture/out/11-bundle-O1.json; phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns; rea 6.7.0 at 27dc42d: src/domain/evidence.ts, src/domain/relationshipCoverage.ts, src/domain/canonicalDigest.ts, src/domain/analysisProfile.ts, src/domain/binaryTargetTypes.ts, src/server/registerEvidenceTools.ts, src/application/binary/BinarySession.ts, src/application/investigation/UnknownEvidence.ts; rea docs/mcp-contracts.md, rea docs/ghidra-provider.md; the Inside a Decompiler machine: scripts/decompiler-machine/model.mjs
