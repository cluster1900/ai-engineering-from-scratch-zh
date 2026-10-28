# list_procedures 与函数体

> list_procedures 返回 Ghidra 定义的每一个函数，内部与外部都算，thunk 保持区分，而 dossier 函数体告诉你每一个拥有多少字节。

你写了四个函数和一个 `main`。Ghidra 列出 13 个过程，其中四个地址像 `EXTERNAL:0x1`，而你叫作 `main` 的那个被命名为 `entry`。这些事实每一个都在文件里有理由，这份列表就是学它们的地方。

读完本节后，你能对全部 13 个过程做出交代，并能把一个 thunk 与其外部目标区分开。你也能把一个函数体读成闭区间地址范围。

## 这份清单 {#s-list-procedures-and-function-bodies-the-inventory}

```listing
title: five of the thirteen procedures
source: capture/out/10-mcp-05-list-procedures.json
lang: json
note: Cut from normalized_result: one external function, two internal functions, and one thunk. The other nine entries have the same shape.
---
"normalized_result": [
  {
    "address": "EXTERNAL:0x1",
    "value": "/usr/lib/libSystem.B.dylib::___stack_chk_fail",
    "procedure": {
      "external": true,
      "thunk": false,
      "thunk_target": null
    }
  },
  …
  {
    "address": "0x100000518",
    "value": "_grade",
    "procedure": {
      "external": false,
      "thunk": false,
      "thunk_target": null
    }
  },
  …
  {
    "address": "0x1000005d0",
    "value": "entry",
    "procedure": {
      "external": false,
      "thunk": false,
      "thunk_target": null
    }
  },
  {
    "address": "0x100000740",
    "value": "___stack_chk_fail",
    "procedure": {
      "external": false,
      "thunk": true,
      "thunk_target": "EXTERNAL:0x1"
    }
  },
  …
],
```

桥从两个 Ghidra 迭代器为每个程序构建一次列表，内部函数与外部函数。它按入口地址去掉重复。对每个函数它记录 `external`、`thunk`，以及有则已解析的 `thunk_target`。值是带限定的符号名，这就是为什么外部条目带着它们的库路径。记录的限制陈述规则：`"External functions and local thunks are distinct; procedure metadata identifies both and preserves a thunk target when Ghidra resolves one."`。

| 地址 | 名称 | 种类 | 从哪来 |
|---|---|---|---|
| `EXTERNAL:0x1` to `EXTERNAL:0x4` | `___stack_chk_fail`, `_atoi`, `_fwrite`, `_printf` | external | 第 3.2 节里六个 `libSystem` 导入中的四个 |
| `0x100000500` | `_percent_change` | 内部，24 字节 | `ledger.c` |
| `0x100000518` | `_grade` | 内部，60 字节 | `ledger.c` |
| `0x100000554` | `_total` | 内部，52 字节 | `ledger.c` |
| `0x100000588` | `_grade_label` | 内部，72 字节 | `ledger.c` |
| `0x1000005d0` | `entry` | 内部，368 字节 | `ledger-main.c` 里的 `main`，由 `LC_MAIN` 命名 |
| `0x100000740` to `0x100000764` | 同样四个名字 | thunk，各 12 字节 | `__stubs` 节，48 字节 |

**Thunk：** 一个小函数，唯一工作是把控制转给另一个函数。四个 thunk 坐在 `__stubs` 里，也就是[第 3.2 节](#s-inspect-binary-layout-and-the-load-image) 里 `0x100000740` 上那 48 字节的节。每一个都是 12 字节的桩，到达真正的 `libSystem` 函数。Ghidra 把那个函数表示成其 `EXTERNAL` 块里的一项，也就是[第 3.4 节](#s-analyze-overview) 里最后一个段。两个不是函数的导入，`___stack_chk_guard` 与 `___stderrp`，不出现在这里，因为它们是数据。

`entry` 就是 `_main`。`inspect-macho` 在 `0x1000005d0` 导出 `_main`，而 `LC_MAIN` 用 `entryoff` 1488 指向那里。Ghidra 把入口点命名为 `entry`，并把 `_main` 保留为同一地址上的第二个符号。文档说，函数入口上的次要符号，例如导入的 `_main` 标签，被接受为选择器 {{native §Exact CLI selectors}}，所以 `rea function fixtures/ledger-arm64-O1 _main` 能工作。

```figure
id: fig-4-3
kind: structure
title: the thirteen procedures of ledger-arm64-O1
claim: Five internal functions fill the 576 bytes of __text without a gap, four thunks fill __stubs, and four externals live in a block Ghidra made.
caption: Read top to bottom by address. Grey rows are outside the file, green rows are code in __text, violet rows are the thunks Ghidra resolved. From capture/out/10-mcp-05-list-procedures.json and the five dossiers.
```

## 函数体 {#s-list-procedures-and-function-bodies-function-bodies}

这份清单没有大小。函数的大小在其 `analyze_function` dossier 的 `procedure.body` 里，而[第 4.6 节](#s-analyze-function-and-pseudocode) 读那份记录的其余部分。

```listing
title: the procedure block of the _grade dossier
source: capture/out/06-function-grade.json
lang: json
note: Cut from normalized_result. The pseudocode and every later facet are cut.
---
"procedure": {
  "address": "0x100000518",
  "name": "_grade",
  "classification": {
    "external": false,
    "thunk": false,
    "thunk_target": null,
    "provenance": "ghidra-function-manager"
  },
  "body": {
    "available": true,
    "provenance": "ghidra-function-body-address-set",
    "ranges": [
      {
        "start": "0x100000518",
        "end": "0x100000553"
      }
    ],
    "total_bytes": 60,
    "span_bytes": 60,
    "non_contiguous": false,
    "contains_entry": true
  },
  "signature": "undefined _grade()",
  "locals": []
},
```

**函数体：** Ghidra 赋给一个函数的地址集合，报告为带闭区间终点的范围。`_grade` 拥有 `0x100000518` 到 `0x100000553`，60 字节，而 `_total` 从 `0x100000554` 开始。配置文件把这份契约命名为 `function_body_evidence: "complete-inclusive-ranges-v1"`。记录里另外三个字段用开区间终点：`binary_overview` 的段、dossier 的 `basic_blocks`，以及 `list_segments` 的内存块。在加一之前先读字段名。

五个内部函数体加起来：24 + 60 + 52 + 72 + 368 是 576，也就是 `__text` 的大小。代码节没有一个字节属于两个函数，也没有一个字节不属于任何一个。对全部五个，`span_bytes` 等于 `total_bytes`，且 `non_contiguous` 为 false。当它们不同时，函数有空隙，空隙里的字节不属于那个函数。研究记录过一个 16 位情形，503 字节的函数体跨度为 517。

## 选择一个过程 {#s-list-procedures-and-function-bodies-selecting-a-procedure}

每一个函数操作都接受一个 `procedure` 字符串。读它的规则：

```rule
label: names before addresses
source: native §Exact CLI selectors
---
When a selector matches an exact symbol name in the database, the name wins over a bare hexadecimal address.
```

带 `0x` 前缀或地址空间前缀的字符串是地址。任何其他字符串先当作符号名来试。一个匹配多个函数的名字以 `ambiguous` 失败，并带上入口地址列表。一个什么都不匹配的名字以 `not_found` 失败，[第 4.6 节](#s-analyze-function-and-pseudocode) 把它显示成 MCP 错误 `invalid_request`。

```takeaways
- 在比较两个构建之前，先把过程数成内部、thunk 与外部。
- 读 `__stubs` 大小并除以 thunk 数量，求出桩大小。
- 把内部函数体的 `total_bytes` 加起来，并与代码节大小比较。
- 把 `body.ranges` 里的 `end` 当作闭区间，把每一个其他 `end` 当作开区间。
```

Sources: capture/out/10-mcp-05-list-procedures.json, capture/out/06-function-grade.json, capture/out/10-mcp-09-analyze-function-percent-change-O1.json, capture/out/10-mcp-11-analyze-function-total-O1.json, capture/out/10-mcp-12-analyze-function-grade-label-O1.json, capture/out/04-inspect-macho.json; rea 6.7.0 at 27dc42d: bridge/ghidra/ReaGhidraBridge.java, src/ghidra/GhidraProviderCapabilities.ts; rea docs/native-investigation.md
