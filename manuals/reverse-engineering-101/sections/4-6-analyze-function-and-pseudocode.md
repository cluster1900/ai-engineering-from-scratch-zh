# analyze_function and pseudocode

> analyze_function 返回带十六个 facet 的一份 dossier，而其伪代码是反编译器的一次阅读，你要用同一份记录里的汇编与字节来核对。

你要了 `percent_change`，得到一个返回 `ulong` 并两次测试 `iVar2 != 0` 的函数。源码返回 `int` 并只测试一次。同一份记录里的指令是对的，而它们周围的文本是对这些指令的一次阅读。学会把两者区分开，正是本节要做的事。

读完本节后，你能读一份 dossier 的十六个 facet。你能标出哪些伪代码行跟自一条指令，哪些是猜测。你也能读一个不存在的名字的错误。

## 这份 dossier {#s-analyze-function-and-pseudocode-the-dossier}

`rea function` 是 `analyze_function` 的 CLI 名。对 `_grade` 的 CLI 运行与同一会话里的 MCP 调用产生了同一个 `evidence_id`，`ev_41e8ca1c` 再加 56 位数字。该 id 是记录语义内容的哈希，文件路径与显示名被排除在外。[第 5.1 节](#s-the-evidence-record) 读记录的每一个字段。本节读其 `normalized_result`，它有十六个 facet。

```listing
title: the pseudocode, the blocks, and the signature facts of _grade
source: capture/out/06-function-grade.json
lang: json
note: Cut from normalized_result. The procedure, assembly, reference, and value-flow facets are cut, and so are the parameter entries of native_api.
---
"pseudocode": "\nundefined4 _grade(int param_1)\n\n{\n  uint uVar1;\n  \n  uVar1 = param_1 / 10 - 6;\n  if (uVar1 < 5) {\n    return *(undefined4 *)(&DAT_1000007d0 + (ulong)uVar1 * 4);\n  }\n  return 0;\n}\n\n",
…
"basic_blocks": [
  {
    "start": "0x100000518",
    "end": "0x10000053c",
    "successors": [
      "0x10000053c",
      "0x10000054c"
    ]
  },
  …
],
"native_api": {
  "available": true,
  "provenance": "ghidra-high-function",
  "signature_source": "default",
  "calling_convention": "__cdecl",
  …
      "data_type": "undefined4",
      "size_bytes": 4,
      "storage": "w0:4",
      "confidence": "low",
  …
  "jump_tables": [],
  "pseudocode": {
    "classification": "decompiler-generated-non-source",
    "compilable": false
  },
  …
  "limitations": [
    "Types and calling conventions are Ghidra decompiler observations, not source declarations.",
    "Register variables, compiler-generated blocks, and pointer arithmetic remain decompiler artifacts.",
    "Pseudocode is neither original source nor guaranteed to compile."
  ]
},
```

伪代码是一个 JSON 字符串。解码后读作：

```c
undefined4 _grade(int param_1)

{
  uint uVar1;
  
  uVar1 = param_1 / 10 - 6;
  if (uVar1 < 5) {
    return *(undefined4 *)(&DAT_1000007d0 + (ulong)uVar1 * 4);
  }
  return 0;
}
```

| Facet | For `_grade` | What it holds |
|---|---|---|
| `procedure` | 入口 `0x100000518`，函数体 60 字节 | [第 4.2 节](#s-list-procedures-and-function-bodies) 的身份与函数体 |
| `pseudocode` | 一个字符串 | 反编译器文本 |
| `assembly` | 15 行 | [第 4.3 节](#s-procedure-assembly) 的 Listing 文本 |
| `comments` | 空 | 入口处的数据库注释 |
| `callers`, `callees` | 空，空 | 仅已解析的函数 |
| `incoming_references`, `outgoing_references` | 1, 2 | 带类型的边，如[第 4.4 节](#s-xrefs-and-the-jump-table) |
| `unresolved_calls` | 空 | 目标没有已知过程的调用点 |
| `referenced_strings`, `referenced_names` | 空, 2 | `LAB_10000054c`, `DAT_1000007d0` |
| `basic_blocks` | 3 | 起点、开区间终点、后继 |
| `native_api` | `__cdecl`，`signature_source` default | 类型、存储、置信度、`jump_tables` |
| `native_value_flow` | 14 个操作，12 条 def-use 边 | 高 p-code，`truncated: false` |
| `facet_availability` | 八个 facet，全部 `available: true` | 每个 facet 是否被观察到 |
| `limitations` | 4 | 该 facet 自己的限制 |

**Dossier：** rea 对一个函数的合成记录的名字。桥从五个 Ghidra 源构建它：FunctionManager、Listing、ReferenceManager、BasicBlockModel 与反编译器。记录级限制点名全部五个。记录带着十条限制，结果再多四条，`native_api` 三条，`native_value_flow` 五条。读它们一次。它们用 rea 的话说明本节用例子展示的内容。

签名事实是要读的第一件事。`signature_source` 是 `default`，意思是没有分析器或用户设置原型，而每一个参数与返回值都带着 `confidence: "low"`。桥只在来源是 `analysis` 时给出 `medium`。`native_api.pseudocode.compilable` 是 `false`，而第三条 `native_api` 限制就写在 Java 源码本身里。

```figure
id: fig-4-8
kind: structure
title: the sixteen facets of the _grade dossier
claim: One record holds the identity, the text, the edges, the blocks, the signature facts, and the value flow of one function, each with its own limits.
caption: Read top to bottom. The left column is the facet name, the middle column is its value for _grade, the right column says what the facet holds. From capture/out/06-function-grade.json.
```

## procedure_pseudo_code：仅文本 {#s-analyze-function-and-pseudocode-procedure-pseudo-code-the-text-alone}

`rea decompile` 是 `procedure_pseudo_code` 的 CLI 名。它只返回文本，别的什么都不返回。

```listing
title: the pseudocode of _total
source: capture/out/07-decompile-total.json
lang: json
note: Cut to the operation, the start of the text, and the two decompiler limitations of the seven.
---
"operation": "procedure_pseudo_code",
"parameters": {
  "procedure": "_total"
},
"raw_result": {
  "value": "\nint _total(int *param_1,uint param_2)\n\n{\n  int iVar1;\n  ulong uVar2;\n  \n  if (0 < (int)param_2) {\n…
  "limitations": []
},
…
"limitations": [
  …
  "Pseudocode is Ghidra decompiler output, not original source and not text-equivalent to Hopper output.",
  "External functions and functions without an analyzable body return null; other decompiler failures remain explicit.",
  …
],
```

```c
int _total(int *param_1,uint param_2)

{
  int iVar1;
  ulong uVar2;
  
  if (0 < (int)param_2) {
    iVar1 = 0;
    uVar2 = (ulong)param_2;
    do {
      iVar1 = *param_1 + iVar1;
      uVar2 = uVar2 - 1;
      param_1 = param_1 + 1;
    } while (uVar2 != 0);
    return iVar1;
  }
  return 0;
}
```

桥为每个程序打开一个带 C 输出、语法树与跳转加载开启、且没有指令限制的 `DecompInterface`。每次调用是 `decompileFunction(function, 0, monitor)`，没有超时，而外部或无函数体的函数返回 `null`。文本是结果的 `getC()` 输出。

`_total` 读起来不错。带 `uVar2 - 1` 的 `do` 循环，就是汇编里 `subs x9, x9, #0x1` 与 `b.ne` 做出的旋转循环。指针类型 `int *param_1` 跟自加载 `ldr w10, [x0], #0x4`。唯一未决的问题是 `uint param_2`。源码说 `int count`。指令把 `w1` 当作有符号比较一次，然后在 `x9` 里倒数，所以两种类型都合适，而 Ghidra 挑了一个。

## 文本不完整或出错的地方 {#s-analyze-function-and-pseudocode-where-the-text-is-incomplete-or-wrong}

**反编译器产物：** 一行伪代码，是反编译器为表达机器码所需要的，而没有任何源码行产生它。`native_api` 限制点名三种：寄存器变量、编译器生成的块，以及指针算术。抓取里的三份记录展示文本与指令之间三种空隙。

```listing
title: _percent_change, text and instructions
source: capture/out/10-mcp-09-analyze-function-percent-change-O1.json
lang: json
note: The pseudocode string and the complete assembly array of the dossier.
---
"pseudocode": "\nulong _percent_change(ulong param_1,int param_2)\n\n{\n  uint uVar1;\n  int iVar2;\n  \n  iVar2 = (int)param_1;\n  if (iVar2 != 0) {\n    uVar1 = 0;\n    if (iVar2 != 0) {\n      uVar1 = ((param_2 - iVar2) * 100) / iVar2;\n    }\n    param_1 = (ulong)uVar1;\n  }\n  return param_1;\n}\n\n",
"assembly": [
  "0x100000500: cbz w0, 0x100000514",
  "0x100000504: sub w8, w1, w0",
  "0x100000508: mov w9, #0x64",
  "0x10000050c: mul w8, w8, w9",
  "0x100000510: sdiv w0, w8, w0",
  "0x100000514: ret"
],
```

六条指令。`cbz w0, 0x100000514` 在 `before` 为零时跳到 `ret`，而在那条路径上 `w0` 为零，函数返回它。另一条路径计算 `(w1 - w0) * 100`，并用 `sdiv w0, w8, w0` 做除法。两条路径都在 `w0` 里返回 32 位。

伪代码说函数返回 `ulong`，八个字节，并返回 `param_1`，也就是整个 `x0`。ABI 与源码说四个字节。文本里没有任何东西标出这个差别。记录标出了：`return_type.data_type` 是 `ulong`，`confidence` 是 `low`，`signature_source` 是 `default`。第二个 `if (iVar2 != 0)` 重复了一次指令只做一次的测试。它不改变任何值，也不在指令里。

```figure
id: fig-4-9
kind: comparison
title: percent_change as written and as decompiled
claim: Four source lines became fourteen lines of pseudocode, and the three marked lines describe only the registers.
caption: Read the source first, then the pseudocode. The rose marks name the return width, the repeated test, and the return of the whole register. From capture/fixtures/ledger.c and capture/out/10-mcp-09-analyze-function-percent-change-O1.json.
```

`_grade` 展示第二种空隙。反编译文本把表保留为 `*(undefined4 *)(&DAT_1000007d0 + (ulong)uVar1 * 4)`。地址是对的，元素大小是对的，那五个值却不在那里。[第 3.3 节](#s-address-to-file-offset) 把 `0x1000007d0` 变成文件偏移 2000，那里的 20 字节是 `1, 2, 3, 4, 4`。返回类型是 `undefined4`，四个字节意义未知。文本不完整，你从字节把它补全。

`grade` 的 x86-64 构建展示第三种。其伪代码有一行 `uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);`，作为默认返回值。

```listing
title: grade on x86-64, the default value as an expression
source: capture/out/07-decompile-grade-x86_64-O1.json
lang: json
note: The start of the pseudocode string, cut after the line that writes the default value.
---
"value": "\nuint grade(int param_1)\n\n{\n  uint uVar1;\n  uint uVar2;\n  \n  uVar2 = param_1 / 10 - 6;\n  uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);\n…
```

那一行背后的指令是[第 4.3 节](#s-procedure-assembly) 里 `0x10002a` 上的 `XOR EAX, EAX`。寄存器是零。Ghidra 把它写成 `param_1` 的符号异或积的符号位。那是同一位的两种拼写，而反编译器没有把它们消去。对每一个 `int` 值都是 0，所以文本并非假。一个信任文本的读者会相信默认值取决于分数，而这是假的。

[第 34 课](phases/13-tools-and-protocols/34-lifting-to-pseudocode) 编译这段文本，并在一张网格上对照源码测试它。然后把它自己的 lifter 输出放在 Ghidra 的旁边，并对 `percent_change`、`grade` 与 `total` 里的每一个差别做出交代。

三种情形得出的规则很短。汇编 facet 是观察到的。伪代码是关于一次派生阅读的观察到的文本。在复述文本说了什么之前，用存储核对类型，用字节核对常量，用块核对分支。

## 一个不存在的名字 {#s-analyze-function-and-pseudocode-a-name-that-does-not-exist}

```listing
title: analyze_function for a procedure that is not there
source: capture/out/10-mcp-13-analyze-function-missing.json
lang: json
note: The request arguments, the error flag, and the decoded error. The text content is the same JSON on one line. The `diagnostics` object in `details` is cut. It holds the run id, the temporary paths, the process id, the Ghidra output, and `remote_code: "not_found"`.
---
"name": "analyze_function",
"arguments": {
  "procedure": "_nothing"
}
…
"isError": true
…
"decoded_text": {
  "error": {
    "code": "invalid_request",
    "category": "invalid_input",
    "message": "Analysis input is invalid. Check the arguments and try again.",
    "retryable": true,
    "remediation": {
      "action": "Correct the listed arguments and retry."
    },
    "details": {
      "operation": "analyze_function",
      "issues": [
        {
          "path": [],
          "reason": "invalid_value",
          "message": "Unknown Ghidra procedure name or address: _nothing"
        }
      ],
      …
    }
  }
}
```

桥先把 `_nothing` 当作符号名来试，再当作地址，并以 `not_found` 失败。错误里的 `diagnostics` 对象显示桥发送的远程码 `not_found`。客户端把远程码 `invalid_request`、`not_found` 与 `ambiguous` 映射到 `AnalysisInputError`。那个错误投影到码 `invalid_request`。错误以带 `isError: true` 且没有结果的文本到达 MCP 客户端。服务器日志显示时间花在哪里。

```listing
title: the failed call in the server log
source: capture/out/10-mcp-server.log
lang: jsonl
note: Lines 10 and 11. The first is the bridge layer, the second is the server layer. The time and durationMs values change on every run and are cut.
---
{"level":40,"time":…,"application":"rea","mode":"mcp","layer":"ghidra-bridge","method":"analyze_function","status":"error","msg":"Ghidra bridge request completed"}
{"level":40,"time":…,"application":"rea","mode":"mcp","layer":"server","tool":"analyze_function","durationMs":…,"status":"error","msg":"MCP tool execution completed"}
```

这次查找是到 Ghidra 的一次套接字往返，总共几毫秒。`retryable` 是 `true`：从[第 4.2 节](#s-list-procedures-and-function-bodies) 改正名字再调用。会话保持打开，Ghidra 项目保持已导入。

## 拿一份 dossier 做什么 {#s-analyze-function-and-pseudocode-what-to-do-with-a-dossier}

按这个顺序读十六个 facet。从 `procedure` 看函数体、从 `assembly` 看处理器做什么开始。然后读 `basic_blocks` 看形状、读引用看边，最后读 `pseudocode`。[第 5.5 节](#s-compare-and-compare-functions) 比较同一函数两个构建的两份 dossier。[第 7.2 节](#s-a-proof-harness-outside-rea) 展示决定从这段文本重建是否等于原件的测试。

要看每一行伪代码从哪里来，跑 [Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler) 机器。它从 x86-64 fixture 目标文件经九个站反编译 `percent_change`，从头部到伪代码。页上的指令、IR 与伪代码就是第 34 课课程 lifter 打印的那些。把构建切到 `-O0` 可看到栈槽变成局部变量，关掉符号可看到名字变成未知。

```takeaways
- 在信任伪代码里的类型之前，先读 `signature_source` 与参数的 `confidence`。
- 用汇编与字节核对文本里的每一个常量与表地址。
- 把 `compilable: false` 当作关于伪代码文本的事实，不要把它报告成缺陷。
- 对未知名字预期带 `retryable: true` 的 `invalid_request`，然后改正名字。
```

Sources: capture/out/06-function-grade.json, capture/out/10-mcp-10-analyze-function-grade-O1.json, capture/out/07-decompile-total.json, capture/out/07-decompile-grade-x86_64-O1.json, capture/out/10-mcp-09-analyze-function-percent-change-O1.json, capture/out/10-mcp-11-analyze-function-total-O1.json, capture/out/10-mcp-12-analyze-function-grade-label-O1.json, capture/out/10-mcp-13-analyze-function-missing.json, capture/out/10-mcp-server.log, capture/fixtures/ledger.c, capture/fixtures/ledger-arm64-O1; rea 6.7.0 at 27dc42d: src/cliCommandNames.ts, src/domain/evidence.ts, src/ghidra/GhidraProviderCapabilities.ts, src/ghidra/GhidraProviderClient.ts, src/domain/analysisErrorProjection.ts, src/server/toolResult.ts, bridge/ghidra/ReaGhidraBridge.java; the Inside a Decompiler machine: scripts/decompiler-machine/fixture.mjs, scripts/decompiler-machine/model.mjs
