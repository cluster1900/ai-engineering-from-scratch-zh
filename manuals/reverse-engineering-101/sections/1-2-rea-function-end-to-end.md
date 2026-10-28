# rea function，端到端

> 一次 `rea function` 调用打开文件、绑定 Ghidra、导入私有副本、经套接字问一个问题，并在大约八秒内打印一份 Evidence 记录。

你键入了 `rea function fixtures/ledger-arm64-O1 _percent_change --provider ghidra --format json`。大约八秒后，stdout 上到了 1881 行 JSON，退出状态是 0。某处有关于 `before == 0` 的答案，旁边是源码里从未有过的反编译产物。

读完本节后，你能读出那份记录的每一个顶层字段，并说出是系统的哪一部分写的。你也能指出 Ghidra 伪代码与你的 C 不一致的那一处。

## 命令 {#s-rea-function-end-to-end-the-command}

```listing
title: the recorded command
source: capture/out/00-commands.txt
lang: text
note: The time is cut, because it changes with every recording and stays between 7 and 9 s, as [the kit notes](manuals/reverse-engineering-101/capture/README.md) record.
---
$ rea function fixtures/ledger-arm64-O1 _percent_change --provider ghidra --format json
[exit 0] (… s) -> 06-function-percent-change.json
```

`function` 接受路径与 procedure，并以 `{ procedure }` 为参数跑 MCP 操作 `analyze_function`。`--provider ghidra` 点名引擎，`--format json` 与 `--filter-output` 在命令运行前于可执行边界读取。没有 `--format` 时，终端输出是 TOON，退出 `0` 表示操作完成。结果仍可能持有部分证据、警告或未决问题 {{cli Output and exit status}}。[图](#fig-1-2) 跟着这次调用穿过系统。

```figure
id: fig-1-2
kind: sequence
title: one rea function run, step by step
claim: One command opens the file, binds Ghidra, launches a headless JVM on a private copy, asks one question on a socket, and returns one Evidence record.
caption: Read top to bottom, one numbered row per step. Rows 1 and 12 come from the command record, and the names and the digest from the function capture. The file copy name comes from the overview capture. The deadlines come from the source at the tag.
```

## 从命令到桥 {#s-rea-function-end-to-end-from-the-command-to-the-bridge}

1. 会话解析 Mach-O 头、读取架构并对文件做哈希。记录的 `subject` 带着结果：`mach-o`、`arm64`，以及 `00-fixtures.txt` 为 `ledger-arm64-O1` 列出的 SHA-256。
2. 注册表选出 `ghidra`，因为命令要求了它，并记录 `selection_source: "request"`。
3. provider 构建 analysis profile，一份版本化契约名列表，例如 `function_body_evidence: "complete-inclusive-ranges-v1"`，并对其做哈希。记录里的 digest `3fc72c9b…` 就是这个哈希。
4. 客户端建私有运行时根并分配 `bridge.sock`。它在再次哈希的同时把文件复制为 `target-<sha256[0:12]>.bin`。然后以 `ghidra.Ghidra ghidra.app.util.headless.AnalyzeHeadless`、`-import`、`-readOnly` 与 `-deleteProject` 启动 `java`。副本是 `target-01b5d08b08fb.bin`，overview 记录把该名显示为它的 `document`（[捕获](manuals/reverse-engineering-101/capture/out/05-analyze-arm64-O1.json)）。启动截止是 330,000 ms。
5. 客户端发送 `ping`。只有当 `run_id`、token、profile digest、目标 SHA-256 与 `analysis_complete` 全部匹配时，它才接受会话。
6. 客户端写入一行请求 `analyze_function` 的 JSON。Ghidra 跑分析并写回一行 JSON。
7. rea 把该操作的 limitation 句子加进答案，并把结果存成一份 Evidence 记录。
8. 客户端以 10 s 截止发送 `shutdown`，Ghidra 删除项目。

## 逐字段读记录 {#s-rea-function-end-to-end-the-record-field-by-field}

```listing
title: the head of the record
source: capture/out/06-function-percent-change.json
lang: json
note: Cut after the provider. The analysis profile and the results follow in the next listings.
---
{
  "evidence_id": "ev_b492c85e…",
  "subject": {
    "name": "ledger-arm64-O1",
    "digest": {
      "sha256": "01b5d08b…"
    },
    "local_path": "$CAPTURE/fixtures/ledger-arm64-O1",
    "format": "mach-o",
    "architecture": "arm64"
  },
  "provider": {
    "id": "ghidra",
    "name": "Ghidra",
    "version": "12.1.4"
  },
…
```

`evidence_id` 对语义内容做哈希，并排除 `subject.name` 与 `subject.local_path`，所以同一字节在另一路径下得到同一 id。`provider` 点名引擎及其版本。下一个字段把答案绑到引擎设置：

```listing
title: the analysis profile
source: capture/out/06-function-percent-change.json
lang: json
note: Cut to five of the 25 parameters and the digest.
---
  "analysis_profile": {
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
      "import_mode": "ephemeral-source-immutable",
      …
      "loader": "auto-from-header",
      …
    },
    "digest": "3fc72c9b…"
  },
  "predicate_type": "rea.analysis",
  "operation": "analyze_function",
  "parameters": {
    "procedure": "_percent_change"
  },
```

**Analysis profile：** provider 已承诺的设置，对 RFC 8785 规范 JSON 做哈希。改一个契约版本，digest 就变，rea 据此拒绝旧快照（[第 5.3 节](#s-snapshots-and-the-answer-cache)）。`predicate_type` 是默认标签 `rea.analysis`，`operation` 是 MCP 名。`parameters` 是调用者输入，也是身份的一部分。

`raw_result` 在 `value` 下持有 provider 原生 dossier，并带自己的空 `limitations`，`normalized_result` 把同一 dossier 作为规范结果持有。`confidence` 是 `observed`，`authority` 是 `shipped-artifact`，这是对磁盘上文件做静态读取的默认值。`environment` 是 `null`，因为什么都没跑。

`limitations` 有十个字符串：每个 Ghidra 操作都带的四个、`analyze_function` 的五个，以及关于 macOS 原生反编译器的一个（[捕获](manuals/reverse-engineering-101/capture/out)）。`locations` 与 `evidence_links` 为空。`relationship_coverage` 的状态是 `complete`，它唯一的诊断说只返回已解析的 Ghidra call 引用。[图](#fig-1-3) 摆出那 16 个字段。

```figure
id: fig-1-3
kind: structure
title: the 16 fields of one Evidence record
claim: Every field of the record is either identity, provenance, the answer, or a limit on the answer, and the id covers all of them except the display names.
caption: Read the field, its value in this record, and the note. From capture/out/06-function-percent-change.json, with the field list from src/domain/evidence.ts at the tag.
```

## normalized_result 里面 {#s-rea-function-end-to-end-inside-normalized-result}

**Procedure：** 函数身份。`_percent_change` 在 `0x100000500`，其体是从 `0x100000500` 到 `0x100000517`（含）的一个区间，24 字节，`contains_entry` 为 true。FunctionManager 签名读作 `undefined _percent_change()`，因为 Ghidra 的符号不带类型。`native_api` 下反编译器的视图读作 `ulong _percent_change(ulong param_1,int param_2)`，每个参数带 `confidence: "low"`。你的源码写的是 `int percent_change(int before, int after)`。两者都是观察，正如 limitation 所说："Types and calling conventions are Ghidra decompiler observations, not source declarations."

```listing
title: the six instructions
source: capture/out/06-function-percent-change.json
lang: json
note: Nothing is cut from the assembly array.
---
    "assembly": [
      "0x100000500: cbz w0, 0x100000514",
      "0x100000504: sub w8, w1, w0",
      "0x100000508: mov w9, #0x64",
      "0x10000050c: mul w8, w8, w9",
      "0x100000510: sdiv w0, w8, w0",
      "0x100000514: ret"
    ],
```

六条各四字节的指令凑成 24 字节。`cbz w0` 是你的 `if (before == 0) return 0;`，`before` 在 `w0`，`mov w9, #0x64` 是 100。伪代码讲得更长：

```listing
title: the pseudocode, with its newlines expanded
source: capture/out/06-function-percent-change.json
lang: text
note: The pseudocode field is one JSON string. This listing shows it line by line, and every line is a substring of that string.
---
ulong _percent_change(ulong param_1,int param_2)
{
  uint uVar1;
  int iVar2;
  iVar2 = (int)param_1;
  if (iVar2 != 0) {
    uVar1 = 0;
    if (iVar2 != 0) {
      uVar1 = ((param_2 - iVar2) * 100) / iVar2;
    }
    param_1 = (ulong)uVar1;
  }
  return param_1;
}
```

外层 `if` 是你的守卫。内层 `if` 不在你的源码里。`native_value_flow` 显示它从哪里来。操作 `0x100000510#7`、`#8`、`#9` 与 `#10` 是常量 0 的 `COPY`、一个 `INT_NOTEQUAL`、一个 `CBRANCH`，以及一个 `INT_SDIV`。四个都带着 `sdiv` 指令的地址。Ghidra 对 `sdiv` 的模型在除数为 0 时给出 0，反编译器把那个模型打印成第二次检查。

两次检查都正确，一次是多余的，只有源码告诉你是哪一次。[第 4.6 节](#s-analyze-function-and-pseudocode) 与[提升课](phases/13-tools-and-protocols/34-lifting-to-pseudocode) 挖得更深。

**References：** dossier 列出两条入边引用。一条是来自 `0x1000006a0` 的 `UNCONDITIONAL_CALL`，在 Ghidra 命名为 `entry`、位于 `0x1000005d0`、长 368 字节的函数内。另一条是来自 `0x100008118`、没有所属 procedure 的 `DATA` 引用，在 overview 列出的从 `0x100008000` 起的 `__LINKEDIT` 段内（[捕获](manuals/reverse-engineering-101/capture/out/05-analyze-arm64-O1.json)）。唯一的出边引用是 `cbz` 的 `CONDITIONAL_JUMP`。`callers` 点名 `entry`，`callees` 为空，因为该函数什么都不调用。`unresolved_calls` 为空，`facet_availability` 把 dossier 的全部八个 facet 标为可用。

**Basic blocks：** 三个，在 `0x100000500`、`0x100000504` 与 `0x100000514`，带排他的 `end` 值。body 区间用含端点，正如其契约名 `complete-inclusive-ranges-v1` 所说。比较地址时把两种约定分开。

`native_value_flow` 持有 13 个 p-code 操作与 13 条 `truncated: false` 的 def-use 边。每个操作都带 `is_dead: true`，limitation 解释该标志镜像 Java AST，而 `block_membership` 报告真实成员关系。每次都先读 limitations，再读数字。

```takeaways
- 跑 `rea function PATH NAME --provider ghidra --format json` 并保存整份记录。
- 在信任别的任何东西之前，用你自己的 `shasum -a 256` 核对 `subject.digest.sha256`。
- 在 `normalized_result` 之前先读 `confidence`、`authority` 与 `limitations`。
- 把伪代码与汇编对照，并预期源码里从未有过的反编译器检查。
```

Sources: cli Output and exit status (rea docs/cli.md); rea at 27dc42d: src/cli/coreBinaryCommands.ts, src/cliCommandNames.ts, src/cliOutput.ts, src/domain/binaryTarget.ts, src/application/BinaryTargetResolver.ts, src/application/binary/AnalysisProviderRegistry.ts, src/ghidra/GhidraAnalysisProfile.ts, src/ghidra/GhidraClient.ts, src/ghidra/GhidraTargetSnapshot.ts, src/ghidra/GhidraJavaLaunch.ts, src/ghidra/GhidraLauncher.ts, src/config/providerStartupTimeout.ts, src/ghidra/GhidraClientStartup.ts, src/ghidra/GhidraSessionValues.ts, src/ghidra/GhidraClientWire.ts, bridge/ghidra/ReaGhidraBridge.java, src/ghidra/GhidraProviderClient.ts, src/server/registerEvidenceTools.ts, src/domain/evidence.ts, src/domain/analysisProfile.ts, src/domain/relationshipCoverage.ts; capture/README.md; capture/fixtures/ledger.c; capture/out/00-commands.txt, 00-fixtures.txt, 02-capabilities.json, 05-analyze-arm64-O1.json, 06-function-percent-change.json
