# inspect-wasm-artifact and the WABT provider

> rea 6.7.0 在模块的一份私有副本上跑三个 WABT 1.0.42 程序，并返回一份观察到的 Evidence 记录，带着 section、类型化接口，以及解码后的 WAT。

你手写了 `capture/fixtures/wasm/ledger.wat`，带与 `ledger.c` 同样的四个函数，并用 `wat2wasm` 把它汇编成 `ledger.wasm`。你请 rea 6.7.0 检查该模块，在 CLI 上与经 MCP，两个入口返回同一份 Evidence 记录。读完本节后，你能设置 WABT provider 并读该记录。你也能说出该记录不证明什么。

## Setup {#s-inspect-wasm-artifact-setup}

WebAssembly 不是原生目标。对模块的 `open_binary` 返回带约束 `wasm_requires_static_inspection` 的 `target_unavailable`，且错误点名要做的 `inspect_wasm_artifact` 调用。该工具需要你自己安装的三个 WABT 程序。把 `REA_WABT_BIN_DIRECTORY` 设为持有 `wasm-validate`、`wasm-objdump` 与 `wasm2wat` 的绝对目录。只有当该变量是绝对路径时工具才可用，且 `binary_session` 报告该可用性。

```listing
title: the WABT block of the version record
source: capture/out/00-versions.txt
lang: text
note: The fourth program, wat2wasm, built the fixture. rea does not run it.
---
REA_WABT_BIN_DIRECTORY=/opt/homebrew/bin
$ /opt/homebrew/bin/wasm-validate --version
1.0.42
[exit 0]
$ /opt/homebrew/bin/wasm-objdump --version
1.0.42
[exit 0]
$ /opt/homebrew/bin/wasm2wat --version
1.0.42
[exit 0]
```

## The command and the record {#s-inspect-wasm-artifact-the-command-and-the-record}

CLI 命令是 `rea inspect-wasm-artifact PATH`。在捕获里它在大约两秒后以 0 退出，并打印一份 Evidence 记录。

```listing
title: the CLI call
source: capture/out/00-commands.txt
lang: text
note: The time is cut, because it changes with every recording.
---
$ rea inspect-wasm-artifact fixtures/wasm/ledger.wasm --format json
[exit 0] (… s) -> 16-inspect-wasm-artifact.json
```

```listing
title: the head of the inspect_wasm_artifact record
source: capture/out/16-inspect-wasm-artifact.json
lang: json
note: The ids and digests are cut to eight characters. The normalized_result follows.
---
{
  "evidence_id": "ev_3a09e4b0…",
  "subject": {
    "name": "ledger.wasm",
    "digest": {
      "sha256": "699f6ff7…"
    },
    "local_path": "$CAPTURE/fixtures/wasm/ledger.wasm",
    "format": "file",
    "architecture": null
  },
  "provider": {
    "id": "wabt-artifact",
    "name": "REA WABT artifact adapter",
    "version": "wabt@1.0.42"
  },
  "analysis_profile": null,
  "predicate_type": "rea.analysis",
  "operation": "inspect_wasm_artifact",
  "parameters": {
    "path": "$CAPTURE/fixtures/wasm/ledger.wasm",
    "glue_paths": [],
    "candidate_paths": []
  },
```

主体格式是 `file`，体系结构是 `null`，因为没有原生格式适用。provider 版本点名 WABT 发行版。该记录是 `observed`，权威为 `shipped-artifact`，因为磁盘上的字节是源。两个空数组是可选输入。`glue_paths` 点名其 `.wasm` 字符串字面量 rea 会链到候选模块的那些 JavaScript 文件，而 `candidate_paths` 点名那些模块。

## What rea ran {#s-inspect-wasm-artifact-what-rea-ran}

rea 把模块复制进私有工作区，作为只读的 `module.wasm`。然后它从 `REA_WABT_BIN_DIRECTORY` 点名的目录跑三个程序。每一个程序必须正好打印 `1.0.42` 作为其版本。如果有一个不打印，rea 就不跑它。`tool_profile` 记录跑了什么。

```listing
title: the tool profile, first command
source: capture/out/16-inspect-wasm-artifact.json
lang: json
note: The source commit, the digests, and the wasm-objdump and wasm2wat entries are cut. They have the arguments -h -x and --enable-all.
---
"tool_profile": {
  "source": "https://github.com/WebAssembly/wabt",
  "release": "1.0.42",
  …
  "commands": [
    {
      "tool": "wasm-validate",
      "path": "/opt/homebrew/Cellar/wabt/1.0.42_1/bin/wasm-validate",
      "sha256": "99a52c78…",
      "version_banner": "1.0.42\n",
      "arguments": [
        "--enable-all",
        "module.wasm"
      ]
    },
    …
  ],
  "timeout_ms": 30000,
  "output_budget_bytes": 33554432
},
```

限制是 8 MiB 输入、每个程序 30 s，以及 32 MiB 输出。

rea 在每个程序之前与之后检查副本的摘要。它也在命令之后再次检查每个程序的摘要。摘要标识程序的字节。它不证明谁发布了该程序。

## Sections {#s-inspect-wasm-artifact-sections}

`sections` 数组持有七个 section，带着它们的字节范围以及每一个里的条目计数。

```listing
title: the seven sections of ledger.wasm
source: capture/out/16-inspect-wasm-artifact.json
lang: json
note: The Function, Memory, Export, and Code entries are cut. They start at 41, 48, 53, and 113.
---
"artifact": {
  "path": "$CAPTURE/fixtures/wasm/ledger.wasm",
  "sha256": "699f6ff7…",
  "bytes": 290
},
"validation": "valid",
"sections": [
  {
    "kind": "Type",
    "start": 10,
    "end": 26,
    "bytes": 16,
    "description": "count: 3"
  },
  {
    "kind": "Import",
    "start": 28,
    "end": 39,
    "bytes": 11,
    "description": "count: 1"
  },
  …
  {
    "kind": "Data",
    "start": 273,
    "end": 290,
    "bytes": 17,
    "description": "count: 1"
  }
],
```

该文件是 290 字节。魔数与版本的八个字节在最前。每一个 section 以一字节 id 与一个长度开始，载荷跟着。因此 Type 载荷从偏移 `0x0a` 开始，也就是 10。数据段在地址 1024 持有五个等级标签，相隔两个字节。

## The typed interface {#s-inspect-wasm-artifact-the-typed-interface}

该记录把导入与导出持有两次。`imports` 与 `exports` 数组保留精确的 WAT 形式。`interface` 条目为每一个加上方向、索引，以及一份已解析签名。

```listing
title: two interface entries
source: capture/out/16-inspect-wasm-artifact.json
lang: json
note: The memory export and three function exports are cut.
---
"interface": {
  "state": "complete",
  "entries": [
    {
      "direction": "import",
      "module": "env",
      "name": "log",
      "kind": "func",
      "index": 0,
      "signature": {
        "kind": "func",
        "params": [
          "i32"
        ],
        "results": []
      },
      "wat_form": "(import \"env\" \"log\" (func (;0;) (type 0)))",
      "issue": null
    },
    …
    {
      "direction": "export",
      "module": null,
      "name": "percent_change",
      "kind": "func",
      "index": 1,
      "signature": {
        "kind": "func",
        "params": [
          "i32",
          "i32"
        ],
        "results": [
          "i32"
        ]
      },
      "wat_form": "(export \"percent_change\" (func 1))",
      "issue": null
    },
    …
```

`percent_change` 接受两个 `i32` 值并返回一个，与 C 函数同样的形状。导入 `env.log` 是函数 0，所以模块的四个函数是 1 到 4。第二个工具 `compare_wasm_interfaces` 读两份这样的记录，并把每一个导入与导出报告为 added、removed、changed 或 unchanged。它不读文件，也不跑任何 WABT 程序。

## The WAT {#s-inspect-wasm-artifact-the-wat}

`wat` 字段持有 `wasm2wat` 打印的文本、其 SHA-256 `37eab56a…`，以及表示 `decoded-wat`。`percent_change` 的体是栈形式上的 C 函数。它测试第一个参数是否为零。然后它压入 0，或者计算减法、乘以 100，以及有符号除法。

```listing
title: percent_change in the text form
source: capture/out/16-inspect-wasm-artifact.json
lang: text
note: Cut from normalized_result.wat.text. The other three function bodies are cut.
---
  (func (;1;) (type 1) (param i32 i32) (result i32)
    local.get 0
    i32.eqz
    if (result i32)  ;; label = @1
      i32.const 0
    else
      local.get 1
      local.get 0
      i32.sub
      i32.const 100
      i32.mul
      local.get 0
      i32.div_s
    end)
```

文本形式里有两样东西呼应第 4 部分。`grade` 体是带十二个目标的 `br_table`，也就是 clang 为 `ledger-x86_64-O1.o` 里同一个 `switch` 构建的跳转表的 WebAssembly 形式。`grade_label` 体调用函数 2，然后调用函数 0，也就是导入的 `env.log`。然后它把等级的两倍加到 1024，也就是数据段的地址，每个标签两个字节。你可以在没有反编译器的情况下从 WAT 读出那一点，因为该模块没有剥离的符号，也没有重定位。

## Limitations {#s-inspect-wasm-artifact-limitations}

该记录有[第 5 部分](#s-the-evidence-record) 描述的一切：一个 `evidence_id`、一个 `confidence`、一个 `authority`，以及五条 `limitations`。该记录不反编译这些函数。它给出 WAT 文本，而读那份文本是你的工作。

```listing
title: the five limitations of the record
source: capture/out/16-inspect-wasm-artifact.json
lang: json
note: Nothing is cut.
---
"limitations": [
  "WAT is a decoded representation, not original source or proof of runtime behavior. Custom annotations may retain payloads, but WAT does not establish original binary layout or round-trip byte identity. Original bytes and objdump output remain authoritative.",
  "Imports and exports retain exact top-level WABT WAT forms. Names remain escaped producer text; unescaped objdump display names are not parsed as unambiguous identifiers.",
  "JavaScript references are AST-observed static literals only. Candidate matches are associations, not proven data flow, URL-to-file identity or runtime loading. Computed references and aliases are not resolved.",
  "No target execution or implicit fetch. WABT tools are trusted caller-supplied executables; SHA-256 identifies their bytes, not publisher authenticity. No OS memory sandbox is claimed.",
  "Each subprocess has a 30-second deadline and 32 MiB combined output budget. Oversized output fails instead of producing truncated success."
],
```

第一条限制说 WAT 是一种解码表示。WAT 不展示原始源码，也不证明运行时行为。该记录只对字节与工具输出是 `observed`。字段 `runtime_execution` 与 `network_fetch` 都读作 `not-performed`，因为 rea 从不跑该模块。

## Over MCP {#s-inspect-wasm-artifact-over-mcp}

经 MCP，工具是带同样 `path` 的 `inspect_wasm_artifact`。会话的步骤 24 在 404 ms 后返回 `ok`。回复是一次工具结果。其 `structuredContent` 是同一份 Evidence 记录，带着同一个 id `ev_3a09e4b0…`。其 `_meta` 带着[第 8.1 节](#s-the-rea-mcp-server) 的不可信内容标记。

```listing
title: the head of the MCP result
source: capture/out/10-mcp-24-inspect-wasm-artifact.json
lang: json
note: The text copy and the rest of the record are cut.
---
"result": {
  "_meta": {
    "provenance": {
      "untrusted_content": true,
      "source": "analysis_target"
    }
  },
  …
  "structuredContent": {
    "evidence_id": "ev_3a09e4b0…",
```

会话保留该记录，所以 `export_evidence_bundle` 把它与其他记录一起写进一个包。对大模块，第一次调用时传 `detail: "summary"`。然后 rea 保留完整记录。它返回计数、验证结果，以及 WAT 身份，没有 WAT 文本。你用 `inspect_analysis_view` 读完整记录的各页。

## A cross-check with wabt {#s-inspect-wasm-artifact-a-cross-check-with-wabt}

捕获还在没有 rea 的情况下对模块跑了 `wasm-objdump -h -x`，在 `16-wabt.txt` 里。那里的 section 表有与记录里 `headers` 文本同样的七行。Type 从 `0x0000000a` 开始，Data 在 `0x00000122` 结束，也就是 290。这些偏移与 `sections` 一致。[图](#fig-6-2) 画出从两个入口到那一份记录的路径。

```figure
id: fig-6-2
kind: flow
title: inspect_wasm_artifact on ledger.wasm
claim: rea copies the module, runs three WABT programs with checked versions, and returns one observed record that the CLI and MCP share.
caption: Read top to bottom. Solid arrows are calls, and dashed arrows are the program outputs that rea parses. Grey boxes are the WABT programs outside rea. From capture/out/16-inspect-wasm-artifact.json and 10-mcp-24-inspect-wasm-artifact.json.
```

```takeaways
- 在调用该工具之前，把 `REA_WABT_BIN_DIRECTORY` 设为带 WABT 1.0.42 的绝对目录。
- 跑 `rea inspect-wasm-artifact PATH --format json`，或经 MCP 调用 `inspect_wasm_artifact`。
- 先读 `sections`，再读 `interface`，然后读 `wat.text` 里的一个函数体。
- 在你从 WAT 报告任何东西之前，先读那五条限制。
```

Sources: src/cliCommandNames.ts, src/contracts/wasm/wasmToolContracts.ts, src/wasm/WabtArtifactProvider.ts, src/wasm/WabtRelease.ts, src/server/createServer.ts, src/application/BinaryTargetResolver.ts at rea-agents-6.7.0 (27dc42d); rea docs/wasm-artifacts.md (Offline WebAssembly artifacts, Compare core-module interfaces); capture/fixtures/wasm/ledger.wat, capture/fixtures/ledger.c; capture/out/16-inspect-wasm-artifact.json, 10-mcp-24-inspect-wasm-artifact.json, 10-mcp-session.txt, 16-wabt.txt, 00-commands.txt, 00-fixtures.txt, 00-versions.txt
