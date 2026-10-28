# address-to-file-offset

> address-to-file-offset 把一个虚拟地址映射到 Ghidra 加载到那里的文件字节，段加载命令让你能手算核对答案。

`inspect-macho` 说 `_grade` 导出在 `0x100000518`。你想在十六进制查看器里打开 `ledger-arm64-O1` 并读那些字节，所以需要该地址的文件偏移。一条 rea 命令回答那个问题，Mach-O 加载命令让你不用 rea 也能算出同一个数。

读完本节后，你能用 `rea address-to-file-offset` 把地址变成文件偏移。你也能从 `LC_SEGMENT_64` 字段做同样的算术，并说出两者何时会不一致。

## 命令 {#s-address-to-file-offset-the-command}

```listing
title: the command and its exit
source: capture/out/00-commands.txt
lang: text
note: Two lines from the command index. The time in parentheses changes on every run and is cut.
---
$ rea address-to-file-offset fixtures/ledger-arm64-O1 0x100000518 --provider ghidra --format json
[exit 0] (…) -> 08-address-to-file-offset.json
```

在捕获用的 Mac 上，这次调用花了 7 到 9 秒。每一个需要 Ghidra 的 one-shot CLI 调用都会把目标导入全新的 headless 项目。[第 4.1 节](#s-open-binary-and-the-headless-bridge) 详细展示那份代价，同一问题在已打开的 MCP 会话里不到 100 ms。

```listing
title: the answer and the rule behind it
source: capture/out/08-address-to-file-offset.json
lang: json
note: Cut from the record. The subject, provider, and analysis_profile blocks and five of the six limitations are cut.
---
"operation": "address_to_file_offset",
"parameters": {
  "address": "0x100000518"
},
"raw_result": {
  "address": "0x100000518",
  "file_offset": 1304
},
"normalized_result": {
  "address": "0x100000518",
  "file_offset": 1304
},
"confidence": "observed",
"authority": "shipped-artifact",
…
"limitations": [
  …
  "Offsets come from Ghidra source-byte mappings, not virtual-address arithmetic. Uninitialized memory, missing mappings and ambiguous mappings fail explicitly.",
  …
],
```

答案是 1304。记录是 `observed`：Ghidra 报告了它在该地址加载的是哪个文件字节，rea 把数字传了过去。

## 从加载命令做算术 {#s-address-to-file-offset-the-arithmetic-from-the-load-command}

**File offset：** 文件中一个字节的位置，从零起算。**Virtual address：** 加载器映射包含它的段之后，同一字节在内存中的位置。一个段把从 `fileoff` 起的 `filesize` 字节映射到从 `vmaddr` 起的 `vmsize` 字节，所以在一个段内，两个位置相差一个常数。

从[上一节](#s-inspect-binary-layout-and-the-load-image)看，`__TEXT` 的 `vmaddr` 是 `0x100000000`，`fileoff` 是 0。该段内任意字节的规则是 `offset = address - vmaddr + fileoff`。对 `_grade`，那是 `0x100000518 - 0x100000000 + 0`，即 `0x518`，即 1304。

section 给出第二次核对。`__text` 的 `address` 是 `0x100000500`，`file_offset` 是 1280。函数在 section 之后 `0x18` 字节，即 24 字节，所以它的偏移是 `1280 + 24`，同样是 1304。在字节 1304 打开 fixture，你会看到 `e8 cc 8c 52`。那是 `mov w8, #0x6667` 的小端编码，也就是 [第 4.3 节](#s-procedure-assembly) 里 `_grade` 的第一条指令。

| Method | Inputs | Result |
|---|---|---|
| Segment rule | `vmaddr` `0x100000000`, `fileoff` 0 | `0x100000518 - 0x100000000 + 0` = 1304 |
| Section rule | `address` `0x100000500`, `file_offset` 1280 | `1280 + (0x518 - 0x500)` = 1304 |
| rea with Ghidra | the address | `file_offset: 1304` |

```figure
id: fig-3-4
kind: structure
title: from 0x100000518 to file offset 1304
claim: The segment rule, the section rule, and Ghidra's source mapping give the same byte, 1304, and that byte starts the first instruction of _grade.
caption: Read each row left to right. Green boxes are load command facts, grey boxes are your arithmetic, the violet box is Ghidra's answer. From capture/out/04-inspect-macho.json, 08-address-to-file-offset.json, and the fixture bytes.
```

ELF 规则形状相同。对可加载段是 `offset = address - p_vaddr + p_offset`，对 section 是 `sh_offset`。[第 32 课](phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch) 在 `ledger-x86_64-O1.o` 上做那种算术。可重定位目标没有程序头表，所以没有段把它放到内存里。当[第 3.4 节](#s-analyze-overview) 显示该目标的 `.text` 在 `0x100000` 时，那个数是 Ghidra 选的放置，不是文件里的事实。

## Ghidra 实际做什么 {#s-address-to-file-offset-what-ghidra-does-instead}

桥不做计算。`addressToFileOffset` 向 Ghidra 询问该地址的 memory block，并要求是已初始化的块。否则以 `invalid_request` 失败，消息为 "Address has no initialized file-backed memory"。然后它遍历该块的 source mapping。它只保留 `FileBytes` 从文件偏移 0 开始、且原始字节具有已承认目标 SHA-256 的映射。它要求恰好一个这样的映射，并拒绝高于 2^53 - 1 的偏移。

回复只带 `address` 与 `file_offset`。rea 的输出 schema 也允许 `provider_file_offset`、`image_base_file_offset` 与 `source_path`，而 6.7.0 的 Ghidra provider 把它们留空。

三个地址显示三种结果。捕获只跑了第一行。另外两行来自上面的桥代码。

| Address | Where it is | Outcome |
|---|---|---|
| `0x100000518` | `__text`, initialized, one `FileBytes` mapping | `file_offset` 1304 |
| `0x0` | `__PAGEZERO`, `filesize` 0, no file bytes | `invalid_request`, no initialized file-backed memory |
| `EXTERNAL:0x1` | Ghidra's external space for imported functions | `invalid_request`, no file bytes at all |

这就是为什么 limitation 说偏移不是虚拟地址算术。对 `__TEXT`、`__DATA_CONST` 以及 `__LINKEDIT` 已用的 1104 字节，你的算术与 Ghidra 的映射一致。在你的公式仍能算出数字而 Ghidra 拒绝的地方，它们不一致。那些地方是 `__PAGEZERO` 的 4 GiB、字节 33872 之后的填充，以及[第 4.2 节](#s-list-procedures-and-function-bodies) 的 `EXTERNAL` 块。

```takeaways
- 问 Ghidra 之前，先从段算 `address - vmaddr + fileoff`，再比较。
- 用 section 的 `file_offset` 做第二次核对：`1280 + 0x18` 是 1304。
- 对 `__PAGEZERO`、`EXTERNAL`，以及任何有两个映射的地址，预期 `invalid_request`。
- 在十六进制查看器里把别人指向字节时，引用文件偏移。
```

Sources: capture/out/00-commands.txt, capture/out/04-inspect-macho.json, capture/out/08-address-to-file-offset.json, capture/fixtures/ledger-arm64-O1; rea 6.7.0 at 27dc42d: bridge/ghidra/ReaGhidraBridge.java, src/contracts/toolOutputSchemaGroups.ts
