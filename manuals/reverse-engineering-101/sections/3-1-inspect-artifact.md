# inspect-artifact

> inspect-artifact 把文件当作容器来读，对其做哈希，点名其格式，并返回一份 Evidence 记录，告诉你下一步该跑哪个工具。

你用 clang 从 `ledger.c` 与 `ledger-main.c` 构建了 `ledger-arm64-O1`。某个 agent 即将分析它，你希望第一次调用便宜、离线，并对它没做的事诚实。`inspect-artifact` 就是那次调用。它不需要 Ghidra，大约一秒返回，其记录以下一个工具的名字结束。

读完本节后，你能在你构建的文件上跑 `inspect-artifact`，并读它的 manifest 与那一个 occurrence。你也能说出为什么记录把 `open_binary` 点名为下一步探测。

## 一条命令，一份记录 {#s-inspect-artifact-one-command-one-record}

```listing
title: the command and its exit
source: capture/out/00-commands.txt
lang: text
note: Two lines from the command index. The time in parentheses changes on every run and is cut.
---
$ rea inspect-artifact fixtures/ledger-arm64-O1 --format json
[exit 0] (…) -> 03-inspect-artifact.json
```

记录来自 provider `rea-artifact-graph`，名为 "REA safe artifact graph provider"，版本 1。没有分析引擎在跑。工具打开文件、对其做哈希、从头点名格式，并把文件作为容器构建一份清单。

**Artifact graph：** rea 为一份文件及其内部文件构建的清单。节点是一份不同的内容，以其 SHA-256 标识。occurrence 是该内容出现的一个位置，带逻辑路径。边把容器连到成员。

```listing
title: the head of the record
source: capture/out/03-inspect-artifact.json
lang: json
note: The substeps array and everything after it are cut. The capture kit masks local_path.
---
{
  "evidence_id": "ev_0e878985…",
  "subject": {
    "name": "ledger-arm64-O1",
    "digest": {
      "sha256": "01b5d08b…"
    },
    "local_path": "$CAPTURE/fixtures/ledger-arm64-O1",
    "format": "mach-o",
    "architecture": null
  },
  "provider": {
    "id": "rea-artifact-graph",
    "name": "REA safe artifact graph provider",
    "version": "1"
  },
  …
  "operation": "inspect_artifact",
  "parameters": {
    "integrity_policy": "fail"
  },
  …
}
```

SHA-256 是 `00-fixtures.txt` 为该文件列出的那个，之后关于该文件的每一份记录都带同一 digest。`format` 是 `mach-o`，从 magic 字节读出。`architecture` 是 `null`。这个 provider 不读 `cputype`，[下一节](#s-inspect-binary-layout-and-the-load-image) 展示做这件事的工具。唯一参数是 `integrity_policy`，设为 `fail`。

## manifest 与 occurrence {#s-inspect-artifact-the-manifest-and-the-occurrence}

记录有一个子步骤 `inventory_artifact`，带 `status: "completed"`，并在内部嵌套自己的 Evidence 记录。它的 manifest 统计该图。

```listing
title: the manifest, the node, and the occurrence
source: capture/out/03-inspect-artifact.json
lang: json
note: Cut from the inventory substep to the manifest counts, the one node, and the one occurrence.
---
"manifest": {
  "manifest_id": "agm_8e2e5c4c…",
  …
  "graph_sha256": "b6c8ab6f…",
  "node_count": 1,
  "occurrence_count": 1,
  "edge_count": 0
},
"nodes": [
  {
    "artifact_id": "art_8906b5a7…",
    "format": "mach-o",
    "sha256": "01b5d08b…",
    "size": 33872,
    …
    "content_state": "materialized",
    "limitations": []
  }
],
"occurrences": [
  {
    "occurrence_id": "occ_35a9bb48…",
    …
    "logical_path": ".",
    "entry_kind": "file",
    "artifact_kind": "executable",
    "artifact_format": "mach-o",
    "declared_size": 33872,
    …
    "executable": true,
    "encrypted": false,
    "hash_status": "verified",
    …
  }
],
```

一个节点、一个 occurrence、没有边。可执行文件是它自己的容器，没有成员。limitation "Artifact has no child container entries." 用文字说了同一件事。节点报告 `size: 33872`，即 `00-fixtures.txt` 里的字节数，以及 `content_state: "materialized"`。occurrence 有 `logical_path: "."`，即根，以及 `artifact_kind: "executable"`。对 `.asar` 或 `.zip`，每个成员文件都会在这里带着自己的节点与路径出现。

## 分支与下一步探测 {#s-inspect-artifact-branches-and-the-next-probe}

```listing
title: what the inspection did not do
source: capture/out/03-inspect-artifact.json
lang: json
note: The hypotheses and contradictions arrays are empty and are cut with the coverage block.
---
"unexplored_branches": [
  {
    "branch_id": "aib_ff20889e…",
    "reason": "format-specific-analysis-required",
    "detail": "open_binary was not run by provider-neutral artifact inspection.",
    "next_probe": {
      "operation": "open_binary",
      "rationale": "Bind one deep native provider before function-level analysis.",
      "authority": "native-analysis-provider"
    },
    …
  }
],
…
"confidence": "observed",
"authority": "shipped-artifact",
"environment": null,
"limitations": [
  "Artifact has no child container entries.",
  "Inspection derives bounded static hypotheses and next probes; it does not execute the artifact or claim format-specific semantics."
],
```

rea 为它列出的每一个下一步探测构建一条未探索分支，原因为 `format-specific-analysis-required`。第二条 limitation 是同一文件里的常量。记录是 `observed`，authority 为 `shipped-artifact`：rea 读了你给它的文件字节，并未从另一份记录派生。`coverage` 块报告 `complete-within-substeps`，带一个子步骤、一次观察、一条分支、一次探测，且无所省略。

```figure
id: fig-3-1
kind: tree
title: the inspect-artifact record for ledger-arm64-O1
claim: One cheap read gives a hashed subject, a one-node inventory, and an explicit branch that names open_binary as the next probe.
caption: Read from the top. The teal box is the record, the green boxes are what it saw, and the amber box is what it left for a later tool. From capture/out/03-inspect-artifact.json.
```

## 这份记录不是什么 {#s-inspect-artifact-what-the-record-is-not}

这份记录不是格式解析。它不持有加载命令、段、符号，也不持有入口点。对那些，[下一节](#s-inspect-binary-layout-and-the-load-image) 跑 `inspect-macho`。对函数，[第 4 部分](#s-open-binary-and-the-headless-bridge) 用分支点名的工具 `open_binary` 绑定 Ghidra。整份记录 198 行，大多重复 subject digest。那种重复就是重点：每一个嵌套记录都能独立站稳，并仍点名同一字节。

```takeaways
- 先跑 `inspect-artifact`：它不需要引擎，大约一秒返回。
- 在把容器当作扁平之前，先读 `node_count`、`occurrence_count` 与 `edge_count`。
- 把 `unexplored_branches` 当作记录没跑的工具列表。
- 把 subject 的 `sha256` 带进之后关于同一文件的每一份记录。
```

Sources: capture/out/00-commands.txt, capture/out/00-fixtures.txt, capture/out/03-inspect-artifact.json; rea 6.7.0 at 27dc42d: src/application/InvestigationProviders.ts, src/domain/artifactInspection.ts, src/artifacts/inventory/reader.ts
