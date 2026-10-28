# list_strings

> list_strings 返回 Ghidra 定义为 Data 的每一个字符串，其中包含加载器元数据与符号碎片，并排除 Ghidra 没有定义的任何文本。

你期望五个标签与三个格式字符串。`list_strings` 返回 39 项，其中包括 `/usr/lib/dyld`、`_label`、`_`，以及一个空字符串。每一个都是文件里真实的一串字节。这份列表对 Ghidra 定义过的内容是完整的，也仅限于那些。

读完本节后，你能把这 39 个字符串各自放到其 load command 里。你也能说出空结果证明什么、不证明什么。

## 这次调用 {#s-list-strings-the-call}

```listing
title: list_strings and three of its items
source: capture/out/10-mcp-08-list-strings.json
lang: json
note: The request arguments, three items cut from the 39, and the two string limitations of the seven.
---
"name": "list_strings",
"arguments": {}
…
{
  "address": "0x100000770",
  "value": "F",
  "string": {
    "encoding": "US-ASCII",
    "termination": "present_or_not_required",
    "byte_length": 2
  }
},
…
{
  "address": "0x1000007cf",
  "value": "",
  "string": {
    "encoding": "US-ASCII",
    "termination": "present_or_not_required",
    "byte_length": 1
  }
},
…
{
  "address": "0x1000080c7",
  "value": "_label",
  "string": {
    "encoding": "US-ASCII",
    "termination": "present_or_not_required",
    "byte_length": 7
  }
},
…
"limitations": [
  …
  "Only Ghidra-defined string Data is observed; packed or undefined string bytes may be absent. Completeness applies to that inventory, and an empty search does not establish that text is absent from the artifact. If an address is known, use read_bytes and xrefs to inspect bytes and references.",
  "Charset is reported, while a non-missing terminator cannot distinguish a present terminator from a fixed or Pascal layout.",
  …
],
```

桥遍历程序里每一个已定义的数据项，并留下带字符串值的那些。对每一项它记下字符集、所需终止符是否缺失，以及字节长度。每一项都是 Ghidra 的加载器或分析器创建的 `Data` 对象。一串可打印字节如果没有任何分析器把它变成 `Data`，就不在列表里。第一条限制固定在 rea 里，文档说的一样：

```rule
label: what an empty result proves
source: ghidra §Admitted inventory semantics
---
Packed or undefined literals, Rust strings among them, can be missing from the list. An empty result does not prove that the text is not in the file.
```

`termination` 有两个值。`missing` 表示需要空字节的字符串类型却没有。`present_or_not_required` 覆盖其余一切，因为 Ghidra 分不清存在的终止符与不需要终止符的布局。`byte_length` 把终止符也算进去：`F` 是两个字节。

## 六个位置里的三十九个字符串 {#s-list-strings-thirty-nine-strings-in-six-places}

把 39 个地址排序，它们落入六段。每一段是[第 3.2 节](#s-inspect-binary-layout-and-the-load-image) 里的一条 load command。

| 位置 | 地址 | 计数 | 示例 |
|---|---|---|---|
| 头部里的 load command 字符串 | `0x100000404`, `0x100000490` | 2 | `/usr/lib/dyld`, `/usr/lib/libSystem.B.dylib` |
| `__TEXT,__cstring`，文件偏移 1904 | `0x100000770` to `0x1000007cf` | 10 | `F`, `D`, `C`, `B`, `A`, `usage: ledger <before> <after> [score...]\n`, `change %d%%\n`, `total %d\n`, `score %d grade %s\n`, and one empty string |
| `LC_DYLD_CHAINED_FIXUPS` 导入名，文件偏移 32768 | `0x100008069` to `0x1000080a7` | 6 | `___stack_chk_fail`, `_atoi`, `_printf` |
| `LC_DYLD_EXPORTS_TRIE` 边标签，文件偏移 32944 | `0x1000080b2` to `0x100008111` | 7 | `_`, `_label`, `grade`, `main`, `percent_change`, `total` |
| `LC_SYMTAB` 字符串表，文件偏移 33304 | `0x10000821a` to `0x1000082a5` | 13 | `__mh_execute_header`, `_grade_label`, `_labels` |
| `LC_CODE_SIGNATURE` 标识符，文件偏移 33456 | `0x10000831c` | 1 | `ledger-arm64-O1` |

`__cstring` 里的十个是程序自己的文本。该节是 95 字节，而[第 3.4 节](#s-analyze-overview) 里 Ghidra 给它的块是 96。该块一直跑到 `__const` 在 `0x1000007d0` 的起点。`0x1000007cf` 上多出来的那个字节是对齐填充，Ghidra 把它定义成长度为 1 的空字符串。那一项是真实且无害的，你会在每一个已链接映像里看到这类填充。

导出 trie 是导出名的前缀树。它的边把共享前缀只存一次。因此 Ghidra 的字符串数据持有七个碎片，`_`、`_label`、`_mh_execute_header`、`grade`、`main`、`percent_change` 与 `total`，而不是六个导出名。`LC_SYMTAB` 的字符串表持有十三个完整名字，与 `nsyms` 的 13 匹配。最后一个字符串是代码签名的标识符，也就是链接器嵌入的输出文件名。这就是为什么抓取套件警告说，不同的输出名会给出不同的字节。

```figure
id: fig-4-7
kind: structure
title: the 39 strings of ledger-arm64-O1 by load command
claim: Ten of the 39 strings are the program's text, and the other 29 are names and paths that the loader and the linker keep in the file.
caption: Read top to bottom by address. Each row names the load command, the address range, the count, and one example. From capture/out/10-mcp-08-list-strings.json and 04-inspect-macho.json.
```

## 一个函数引用的字符串 {#s-list-strings-strings-a-function-refers-to}

`_grade_label` 的 dossier 有一个带一项的 `referenced_strings` facet，`0x100000770` 上的 `F`，来自 `0x1000005c8` 的那次加载。该函数并不加载 `F`。它从 `0x100004030` 的 `_labels` 加载一个指针，那是 `__DATA_CONST` 里 40 字节的 `__const`，持有指向五个标签的五个指针。Ghidra 跟着第一个指针，记下它背后的字符串，其 `referenced_names` facet 从同一条指令列出 `_labels` 与 `s_F_100000770`。把被引用的字符串读成函数能到达的字符串，而不是唯一的那个。

在 x86-64 目标文件里，同样五个标签坐在 `.rodata.str1.1` 里，也就是[第 3.4 节](#s-analyze-overview) 里那十字节的块，而 `string_count` 是 20。[第 32 课](phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch) 读持有另外十个的 ELF 字符串表。

## 这份清单证明不了什么 {#s-list-strings-what-the-inventory-cannot-prove}

限制在规则的第一个词里：`defined`。三种文本不是 `Data`。编译器可以把字符串打包进结构体。分析器可以跳过没有终止符的字符串。程序可以在运行时构建字符串。列表里一个都没有。

抓取目标没有那些，所以这 39 项就是整个文件。对一个你没有构建的目标，把缺失的字符串当作未知。当你知道一个地址时，`read_bytes` 返回字节，`xrefs` 返回谁使用它们，正如限制所说。[第 5.2 节](#s-residual-unknowns-and-coverage) 展示 rea 如何记录那种未知。

```takeaways
- 在读值之前，先把字符串地址排序，并把每一段映射到一条 load command。
- 预期每一个已链接映像里都有符号名、库路径、trie 碎片与填充。
- 把缺失的字符串当作未知，然后在你知道的地址上用 `read_bytes`。
- 把 `referenced_strings` 读成函数经一次加载到达的文本。预期函数会用更多。
```

Sources: capture/out/10-mcp-08-list-strings.json, capture/out/04-inspect-macho.json, capture/out/05-analyze-arm64-O1.json, capture/out/10-mcp-12-analyze-function-grade-label-O1.json, capture/fixtures/ledger-arm64-O1, capture/README.md; rea 6.7.0 at 27dc42d: bridge/ghidra/ReaGhidraBridge.java, src/ghidra/GhidraProviderCapabilities.ts; rea docs/ghidra-provider.md
