# analyze 与 binary_overview 记录

> rea analyze 是 binary_overview 的 CLI 名字，这是一份派生记录，按一次构建统计 Ghidra 找到的东西：段、过程与已定义字符串。

你有同一四个函数的两个构建：arm64 可执行文件 `ledger-arm64-O1`，以及 x86-64 目标文件 `ledger-x86_64-O1.o`。在读任何函数之前，你想要每个构建一屏，说明它有多大以及 Ghidra 怎么看待它。`rea analyze` 就是那一屏。

读完本节后，你能对两个构建跑 `rea analyze`，并读出那十二个与十个段。你也能解释为什么一个构建有 13 个过程，另一个有 4 个。

## 一个 CLI 动词，一个组合操作 {#s-analyze-overview-one-cli-verb-one-composed-operation}

`analyze` 与 `inspect` 是 MCP 操作 `binary_overview` 的别名。配 Ghidra 时，该操作向桥问一个问题，`read_binary_inventory_summary`，并在一次回复里拿到段与两个计数。没有那个问题的 provider 走更老的路径：同时跑 `list_segments`、`list_procedures` 与 `list_strings`。无论哪条路，结果都是带长度的段以及那两个计数。输出 schema 有六个字段：`document`、`image_base`、`segments`、`segment_count`、`procedure_count` 与 `string_count`。每个段还可以带 `image_base` 与 `address_space`。

```listing
title: the two overview commands
source: capture/out/00-commands.txt
lang: text
note: Four lines from the command index. Each call imported its target into a fresh headless project and took 7 to 9 s. The times change on every run and are cut.
---
$ rea analyze fixtures/ledger-arm64-O1 --provider ghidra --format json
[exit 0] (…) -> 05-analyze-arm64-O1.json
$ rea analyze fixtures/ledger-x86_64-O1.o --provider ghidra --format json
[exit 0] (…) -> 05-analyze-x86_64-O1.json
```

**Composed operation：** 结果由其他操作构建出来的 rea 操作。它的 Evidence 记录点名 provider `rea-workflow`，把 Ghidra profile 作为 `upstream_analysis_profile` 携带，并有 `confidence: "derived"`。它的第一条 limitation 是 "Derived by an REA composed workflow."。其后是 Ghidra 的 limitations，每一条都以引擎、其版本以及产生它的操作开头，例如 `Ghidra (ghidra 12.1.4) read_binary_inventory_summary:`。profile 参数 `source_limitations: "provider-operation-caveats-v1"` 点名那条规则。像 `list_procedures` 这样的原始操作是 `observed`。

```listing
title: the provider block of a composed record
source: capture/out/05-analyze-arm64-O1.json
lang: json
note: Cut to the provider, the start of the analysis profile, and the two workflow parameters. The remaining profile parameters are the same in every Ghidra record of this manual.
---
"provider": {
  "id": "rea-workflow",
  "name": "REA composed investigation workflow",
  "version": "1"
},
"analysis_profile": {
  …
  "parameters": {
    "upstream_analysis_profile": {
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
      },
      …
    },
    "source_limitations": "provider-operation-caveats-v1",
    "workflow_revision": 4
  },
  …
},
```

## arm64 可执行文件 {#s-analyze-overview-the-arm64-executable}

```listing
title: binary_overview of ledger-arm64-O1
source: capture/out/05-analyze-arm64-O1.json
lang: json
note: Cut to the result. Nine of the twelve segment entries and eight of the nine limitations are cut.
---
"normalized_result": {
  "document": "target-01b5d08b08fb.bin",
  "image_base": "0x100000000",
  "segments": [
    {
      "name": "__TEXT",
      "start": "0x100000000",
      "end": "0x100000500",
      "length": 1280,
      "image_base": "0x100000000",
      "address_space": "ram"
    },
    {
      "name": "__text",
      "start": "0x100000500",
      "end": "0x100000740",
      "length": 576,
      "image_base": "0x100000000",
      "address_space": "ram"
    },
    …
    {
      "name": "EXTERNAL",
      "start": "0x10000c000",
      "end": "0x10000c200",
      "length": 512,
      "image_base": "0x100000000",
      "address_space": "ram"
    }
  ],
  "segment_count": 12,
  "procedure_count": 13,
  "string_count": 39
},
"confidence": "derived",
"authority": "shipped-artifact",
"environment": null,
"limitations": [
  "Derived by an REA composed workflow.",
  …
],
```

`document` 不是你点名的那个文件。它是 `target-01b5d08b08fb.bin`，也就是 rea 在其运行时根下做的私有副本。名字是 `target-` 加上 SHA-256 的前十二位十六进制。[第 4.1 节](#s-open-binary-and-the-headless-bridge) 展示那份副本如何做成。

这十二个段是 Ghidra 内存块。它们不同于[第 3.2 节](#s-inspect-binary-layout-and-the-load-image) 的四条 `LC_SEGMENT_64` 命令。Ghidra 把 `__TEXT` 拆成 1280 字节的头范围及其五个节。它把 `__DATA_CONST` 拆成 `__got`、`__const`，以及它们之后的 16296 字节。它把 `__LINKEDIT` 拆成 1104 个已用字节，以及到下一页的填充。

末端是开区间：`__text` 从 `0x100000500` 跑到 `0x100000740`，下一块从 `0x100000740` 开始。最后一块 `EXTERNAL` 根本不在文件里。Ghidra 为导入函数创建它，[第 4.2 节](#s-list-procedures-and-function-bodies) 展示其中四个住在那里。

这 13 个过程是 `ledger.c` 的四个函数、`LC_MAIN` 指向的 `entry` 函数、四个 thunk，以及四个外部函数。thunk 在 `__stubs` 里，外部函数在 `EXTERNAL` 里。这 39 个字符串是 Ghidra 定义为字符串数据的全部，[第 4.5 节](#s-list-strings) 会放好每一个。

## x86-64 可重定位目标文件 {#s-analyze-overview-the-x86-64-relocatable-object}

```listing
title: binary_overview of ledger-x86_64-O1.o
source: capture/out/05-analyze-x86_64-O1.json
lang: json
note: Cut to the result. The .comment, .rela.rodata, .rela.text, .strtab, .symtab, and _elfHeader entries are cut.
---
"normalized_result": {
  "document": "target-9a4a8082ba5e.o",
  "image_base": "0x100000",
  "segments": [
    {
      "name": ".text",
      "start": "0x100000",
      "end": "0x10009f",
      "length": 159,
      "image_base": "0x100000",
      "address_space": "ram"
    },
    {
      "name": ".rodata",
      "start": "0x1000a0",
      "end": "0x1000f0",
      "length": 80,
      "image_base": "0x100000",
      "address_space": "ram"
    },
    {
      "name": ".rodata.str1.1",
      "start": "0x1000f0",
      "end": "0x1000fa",
      "length": 10,
      "image_base": "0x100000",
      "address_space": "ram"
    },
    …
    {
      "name": "_elfSectionHeaders",
      "start": "_elfSectionHeaders:0x0",
      "end": "_elfSectionHeaders:0x2c0",
      "length": 704,
      "image_base": "0x100000",
      "address_space": "_elfSectionHeaders"
    }
  ],
  "segment_count": 10,
  "procedure_count": 4,
  "string_count": 20
},
```

该目标文件有三个已加载块与另外七个。`.text` 持有四个函数的 159 字节代码。`.rodata` 持有 80 字节，`grade` 的值表在 `0x1000b4`，以及 `grade_label` 的偏移表。`.rodata.str1.1` 持有十个字节：五个标签 `F`、`D`、`C`、`B`、`A`，各自带终止符。

另外七块住在各自的地址空间里。记录在 `address_space` 里点名每个空间，并把地址写成 `.comment:0x0` 或 `_elfSectionHeaders:0x0`。那种拼写是每份记录都带着的 Ghidra limitation 里的规则："Default-space addresses use lowercase 0x-prefixed hexadecimal; other address spaces use <percent-encoded-space>:0x<hex>."

四个过程，不是 13 个。目标文件没有 `main`、没有 stub，也没有导入，所以没有外部的可列。`_elfSectionHeaders` 的 704 字节是十一个 64 字节的节头，也就是[第 32 课](phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch) 首先解析的那张表。

| | `ledger-arm64-O1` | `ledger-x86_64-O1.o` |
|---|---|---|
| `document` | `target-01b5d08b08fb.bin` | `target-9a4a8082ba5e.o` |
| `target_format`, `architecture` | `mach-o`, `arm64` | `elf`, `x86_64` |
| `segment_count` | 12 | 10 |
| 代码块 | `__text`，576 字节 | `.text`，159 字节 |
| `procedure_count` | 13 | 4 |
| `string_count` | 39 | 20 |
| 配置 `digest` | `3fc72c9b` 再加 56 位 | `769518a8` 再加 56 位 |

```figure
id: fig-3-5
kind: comparison
title: the two overviews side by side
claim: The same four functions give 13 procedures in a linked executable and 4 in a relocatable object, because stubs, externals, and an entry point exist only after linking.
caption: Read each column top to bottom. The green box names the Ghidra document, the list is every block with its length, and the violet box is the record's confidence. From capture/out/05-analyze-arm64-O1.json and 05-analyze-x86_64-O1.json.
```

## 概览没说什么 {#s-analyze-overview-what-the-overview-does-not-say}

这份记录没有函数大小，也没有入口点。它报告映像基址：可执行文件是 `0x100000000`，目标文件是 `0x100000`。对目标文件来说，那个基址是 Ghidra 选的放置位置。

计数也有限制，记录写明了："Counts use the complete defined-string inventory and the same local/external function inventory as list_strings and list_procedures. They do not establish discovery of undefined strings or unidentified functions." 13 个过程的计数是 Ghidra 识别出的。Ghidra 没有当作函数找到的代码不在计数里。

要大小，用[第 4.2 节](#s-list-procedures-and-function-bodies) 里每个函数的 `body`。要入口点，用[第 3.2 节](#s-inspect-binary-layout-and-the-load-image) 里的 `LC_MAIN`。两个 profile digest 不同，`3fc72c9b` 对 `769518a8`，因为 `target_format` 与 `architecture` 在 profile 参数里面。[第 5.3 节](#s-snapshots-and-the-answer-cache) 展示缓存答案只在整个 digest 匹配时才重放。

```takeaways
- 对每个构建跑一次 `rea analyze`，并把 `document` 名字与记录一起保留。
- 把 Ghidra 内存块与加载命令、ELF 节分开计数。
- 只在已链接的可执行文件里预期 thunk、外部符号与 `entry`。
- 把 `confidence: "derived"` 读成背后站着三份原始记录的标志。
```

Sources: capture/out/00-commands.txt, capture/out/05-analyze-arm64-O1.json, capture/out/05-analyze-x86_64-O1.json; rea 6.7.0 at 27dc42d: src/cliCommandNames.ts, src/application/InvestigationProviders.ts, src/application/EnhancedTools.ts, src/application/WorkflowEvidence.ts, src/contracts/toolOutputSchemaGroups.ts, src/contracts/toolOutputSchemaPrimitives.ts, src/ghidra/GhidraTargetSnapshot.ts, src/ghidra/GhidraInventoryValues.ts, bridge/ghidra/ReaGhidraBridge.java
