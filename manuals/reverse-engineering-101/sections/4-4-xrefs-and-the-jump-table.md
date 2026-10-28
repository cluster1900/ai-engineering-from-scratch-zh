# xrefs 与跳转表

> xrefs 列出引用某一个地址的那些地址，而对 _grade 的那一次引用，展示出优化器对 switch 及其调用者做了什么。

`main` 调用 `grade_label`，而 `grade_label` 调用 `grade`。你问 `xrefs` 谁引用 `0x100000518` 上的 `_grade`，得到一个地址 `0x10000811a`，它不在任何函数里。答案是对的，它告诉你关于这次构建的两件事。

读完本节后，你能读一份 `xrefs` 结果，并在 dossier 里找到每种引用的种类。你也能在 `grade` 的两个构建里把跳转表与值表区分开。

## 这次调用 {#s-xrefs-and-the-jump-table-the-call}

```listing
title: xrefs for the entry of _grade
source: capture/out/10-mcp-07-xrefs-grade.json
lang: json
note: The request arguments, the result, and two of the seven limitations.
---
"name": "xrefs",
"arguments": {
  "address": "0x100000518"
}
…
"normalized_result": [
  "0x10000811a"
],
…
"limitations": [
  …
  "The direct address list projects exact Ghidra references to one address but does not expose their kinds; procedure_references and analyze_function preserve available kind metadata.",
  "Synthetic Ghidra entry-point references without actionable memory sources are omitted.",
  …
],
```

桥向 Ghidra 的 `ReferenceManager` 询问对该地址的每一次引用。它跳过合成的入口点引用，收集互不相同的源地址，并排序。结果只有地址。dossier 的 `incoming_references` facet 保留每种引用的种类，调用、跳转或数据。

## 0x10000811a 上是什么 {#s-xrefs-and-the-jump-table-what-is-at-0x10000811a}

该地址在 `__LINKEDIT` 里，它从 `0x100008000` 开始，映射文件偏移 32768。差值 `0x11a` 是 282，所以那个字节在文件偏移 33050。[第 3.2 节](#s-inspect-binary-layout-and-the-load-image) 列出偏移 33048 上 8 字节的 `LC_FUNCTION_STARTS`。这次引用指向函数起点表。

**函数起点：** 一张无符号 LEB128 差值表，每个函数一项，dyld 与调试器用它在剥离映像里找函数入口。fixture 里的八个字节是 `80 0a 18 3c 34 48 00 00`。第一个差值是 `0x500`，给出 `0x100000500`，`_percent_change`。第二个，在偏移 33050，是 `0x18`，给出 `0x100000518`，`_grade`。然后 `0x3c` 给出 `_total`，`0x34` 给出 `_grade_label`，`0x48` 给出 `entry`。Ghidra 的 Mach-O 加载器把每一项标成对其所命名函数的数据引用，而 dossier 正好显示这一点。

```listing
title: the one incoming reference of _grade
source: capture/out/06-function-grade.json
lang: json
note: Cut from incoming_references. The target_procedure block repeats the procedure block of section 4.2 and is cut.
---
"incoming_references": [
  {
    "source_address": "0x10000811a",
    "target_address": "0x100000518",
    "source_procedure": null,
    …
    "kind": {
      "available": true,
      "provenance": "ghidra-reference-manager",
      "type": "DATA",
      "flow": false,
      "call": false,
      "jump": false,
      "data": true,
      …
    }
  }
],
```

`source_procedure` 是 `null`，因为没有函数拥有这张表。种类是 `DATA`，且 `call` 为 false。所以代码里没有任何东西调用 `_grade`。对比 `_grade_label`，其 dossier 列出两次传入引用。一次是来自 `entry` 内部 `0x1000006ec` 的 `UNCONDITIONAL_CALL`。另一次是来自 `0x10000811c` 的 `DATA` 引用，也就是同一张表的第四项。

```listing
title: the two incoming references of _grade_label
source: capture/out/10-mcp-12-analyze-function-grade-label-O1.json
lang: json
note: Cut from incoming_references to the addresses and the reference types.
---
"source_address": "0x1000006ec",
"target_address": "0x100000588",
…
"type": "UNCONDITIONAL_CALL",
…
"source_address": "0x10000811c",
"target_address": "0x100000588",
"source_procedure": null,
…
"type": "DATA",
```

源码做的那次调用，从 `grade_label` 到 `grade`，消失了。在 `-O1` 下 clang 把 `grade` 内联进了 `grade_label`。`_grade_label` 的汇编在 `0x100000588` 到 `0x1000005a4` 重复了[第 4.3 节](#s-procedure-assembly) 的整段乘法与比较序列。`_grade` 的 dossier 从另一侧说同样的话：`callers` 是空列表，且 `relationship_coverage.status` 是 `complete`。Ghidra 返回了每一次已解析的调用引用，其中没有一个以 `_grade` 为目标。`_grade` 仍然作为函数存在，因为它被导出，而唯一引用它的是链接器写的一张表。

```figure
id: fig-4-6
kind: tree
title: every reference to the four ledger functions
claim: entry calls three of the four functions, the function starts table refers to all four, and nothing calls _grade because its body was inlined.
caption: Read across each row. Green boxes on the left are call sites inside entry, violet boxes are the functions, green boxes on the right are entries of LC_FUNCTION_STARTS. From the four analyze_function dossiers and capture/fixtures/ledger-arm64-O1.
```

## 并不存在的跳转表 {#s-xrefs-and-the-jump-table-the-jump-table-that-is-not-there}

抓取里每一个 dossier 的 `native_api` facet 都有 `"jump_tables": []`，而配置文件把契约命名为 `jump_table_evidence: "typed-case-default-blocks-v1"`。如果 Ghidra 找到一张，就会填这个字段。它一张都没找到，因为在 `-O1` 下两个编译器都没有为 `grade` 里的 switch 发出跳转表。两者都把五种情形变成五个返回值的表与一次边界检查。

| 构建 | 转移 | 表 | `grade` 里的块 |
|---|---|---|---|
| `ledger-x86_64-O0.o`，第 33 课 fixture | `jmpq *%rax` | `.rodata+0x0`，五个 `R_X86_64_PC32` 重定位，目标 `0x91`, `0x88`, `0x7f`, `0x76`, `0x76` | 有表 8 个，无表 3 个 |
| `ledger-x86_64-O1.o`，本次抓取 | 无，一次 `JA` | `DAT_001000b4`，`.rodata+0x14`，值 `1, 2, 3, 4, 4` | 3 |
| `ledger-arm64-O1`，本次抓取 | 无，一次 `b.hi` | `__TEXT,__const` 里的 `0x1000007d0`，值 `1, 2, 3, 4, 4` | 3 |

**跳转表：** 一张代码地址表，一次间接跳转对其索引，于是一条指令到达若干块中的一块。**值表：** 一张数据表，一次加载对其索引，于是一条指令返回若干值中的一个。前者改变控制流图。后者改变一次加载。在 `-O0` 下 x86-64 目标文件有前者，而在目标文件里它的五项是带 `.rela.rodata` 里五个重定位的零字节。在 `-O1` 下两个构建都有后者。

`_grade` 的 `outgoing_references` 点名 dossier 确实看到的两条边。一条是从 `0x100000538` 到 `0x10000054c` 的 `CONDITIONAL_JUMP`。另一条是从 `0x100000544` 到 `0x1000007d0` 的 `DATA` 读。`referenced_names` facet 把目标标为 `LAB_10000054c` 与 `DAT_1000007d0`。[第 4.6 节](#s-analyze-function-and-pseudocode) 的反编译器把第二个保留为字节地址，从不列出那五个值。

```figure
id: fig-4-5
kind: comparison
title: a jump table at -O0 and a value table at -O1
claim: At -O0 an indirect jump through five relocated entries reaches five case blocks, and at -O1 one load from five values replaces all of them.
caption: Read each column top to bottom. The left column comes from the lesson 33 fixture ledger-x86_64-O0.o, the right from the arm64 dossier. The green boxes are data in the file, the violet boxes are what Ghidra saw. From phases/13-tools-and-protocols/33-disassembly-and-control-flow/code/fixtures and capture/out/06-function-grade.json.
```

[第 33 课](phases/13-tools-and-protocols/33-disassembly-and-control-flow) 用规则 `S + A - P` 从重定位恢复 `-O0` 表。它展示有表与无表的控制流图：8 个块与 11 条边，对上 3 个块与一次未解析的跳转。

当 Ghidra 没有解析跳转表时，情形块从 `callers`、`callees` 与 `basic_blocks` 里缺失。dossier 限制说，未解析的计算流不会表示为边。`unresolved_calls` facet 列出每一个目标没有已知过程的调用点。经一张表的未解析间接跳转不是调用，所以不出现在那个 facet 里。空的 `jump_tables` 列表并不证明函数没有 switch。像你在这里做的那样，读转移指令与表字节。

```takeaways
- 在把一个 `xrefs` 地址叫作调用者之前，先把它解析到其段与 load command。
- 用 dossier 里的 `incoming_references` 弄清一次引用是调用还是数据。
- 把导出函数上的 `callers: []` 当作内联的迹象，然后检查调用者的函数体。
- 点名字节展示的是什么：跳转表改变图，值表改变一次加载。
```

Sources: capture/out/10-mcp-07-xrefs-grade.json, capture/out/06-function-grade.json, capture/out/10-mcp-12-analyze-function-grade-label-O1.json, capture/out/10-mcp-09-analyze-function-percent-change-O1.json, capture/out/10-mcp-11-analyze-function-total-O1.json, capture/out/06-function-grade-x86_64-O1.json, capture/out/04-inspect-macho.json, capture/fixtures/ledger-arm64-O1; phases/13-tools-and-protocols/33-disassembly-and-control-flow/code/fixtures/ledger-x86_64-O0.objdump.txt; rea 6.7.0 at 27dc42d: bridge/ghidra/ReaGhidraBridge.java, src/ghidra/GhidraProviderCapabilities.ts
