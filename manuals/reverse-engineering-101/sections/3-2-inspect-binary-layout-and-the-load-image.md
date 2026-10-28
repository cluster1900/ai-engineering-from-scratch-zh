# inspect-binary-layout and the load image

> 在 macOS 上，inspect-binary-layout 以 capability_unavailable 拒绝，而 inspect-macho 是不依赖引擎的段、节、加载命令、导入与导出读取器。

你在捕获用的 Mac 上跑了 `rea inspect-binary-layout fixtures/ledger-x86_64-O1.o --format json`。它以退出码 1 结束，打印的是一份 JSON 错误，而不是布局。没有东西坏了。rea 6.7.0 有两个不依赖引擎的布局读取器，而这一个只在 Linux x64 上跑。

读完本节后，你能读懂那份错误信封，并点名其背后的主机规则。你也能从 `inspect-macho` 读出 `ledger-arm64-O1` 的加载映像：四个段、17 条加载命令、六个导入与六个导出。

## 错误信封 {#s-inspect-binary-layout-and-the-load-image-the-error-envelope}

```listing
title: inspect-binary-layout on macOS
source: capture/out/04-inspect-binary-layout.json
lang: json
note: The whole file. The CLI exit status was 1.
---
{
  "code": "capability_unavailable",
  "category": "unsupported_provider",
  "message": "The initial real-verified pwntools artifact profile supports Linux x64 only.",
  "retryable": false,
  "remediation": {
    "action": "The initial real-verified pwntools artifact profile supports Linux x64 only."
  },
  "details": {
    "provider_id": "pwntools-elf",
    "operation": "inspect_binary_layout",
    "reason": "The initial real-verified pwntools artifact profile supports Linux x64 only."
  }
}
```

rea 里每一次失败都是这个形状：`code`、`category`、`message`、`retryable`、`remediation.action`，以及可选的 `details` 对象。provider 是 `pwntools-elf`。当 `process.platform` 不是 `linux` 或 `process.arch` 不是 `x64` 时，它的解码器在找 Python 之前就抛出 `AnalysisCapabilityUnavailableError`。消息是同一文件里的常量。除非主机是 Linux x64 且 `REA_PWNTOOLS_PYTHON` 是绝对路径，否则 MCP 服务器把该工具列为不可用。退出状态遵循未能完成的操作的 CLI 规则 {{cli §Output and exit status}}。

捕获套件把 ELF 对象交给该工具，因为 `inspect_binary_layout` 是为 ELF 写的。在装了 pwntools 4.15.0 的 Linux x64 主机上，它返回节、段、符号与重定位。[第 2.3 节](#s-rea-capabilities) 展示每个操作如何在你调用前声明可用性，[参考](#s-ref-errors) 列出捕获产生的每一个错误码。

## inspect-macho 与它所跑的工具 {#s-inspect-binary-layout-and-the-load-image-inspect-macho-and-the-tools-it-runs}

`inspect-macho` 是 macOS 读取器，来自 provider `native-macos`，"macOS native inspection utilities"。它跑七条主机命令，并把每一条记为 provenance。

```listing
title: the provenance of one inspect-macho run
source: capture/out/04-inspect-macho.json
lang: json
note: Cut to the tool names and three of the commands. Each entry also records the executable SHA-256, the exit code, and the output sizes.
---
"provenance": [
  {
    "tool": "lipo",
    "command": [
      "/Library/Developer/CommandLineTools/usr/bin/lipo",
      "-detailed_info",
      "$ARTIFACT"
    ],
    …
  },
  {
    "tool": "otool",
    "command": [
      "/Library/Developer/CommandLineTools/usr/bin/llvm-otool",
      "-h",
      "-l",
      "$ARTIFACT"
    ],
    …
  },
  {
    "tool": "nm",
    …
  },
  {
    "tool": "dyld_info",
    "command": [
      "/Library/Developer/CommandLineTools/usr/bin/dyld_info",
      "-imports",
      "$ARTIFACT"
    ],
    …
  },
  {
    "tool": "dyld_info",
    …
  },
  {
    "tool": "dwarfdump",
    …
  },
  {
    "tool": "vtool",
    …
  }
],
```

命令列表在 provider 里是固定的。它跑 `lipo -detailed_info` 来发现切片。对每个切片它跑 `otool -h -l`、`nm -gjU --no-dyldinfo`、`dyld_info -imports`、`dyld_info -exports` 与 `dwarfdump --uuid`。它把 `vtool -show-build` 当作可选的额外项来跑。这次运行不启动 Java，只需几秒。当你期望的名字缺失时，记住记录的一条 limitation："Imports and exports combine dyld_info and nm; stripped or toolchain-hidden symbols may be absent."

```figure
id: fig-3-2
kind: comparison
title: two layout commands on the capture Mac
claim: The same host refuses one layout reader on platform and answers the other with 17 load commands, because each reader names its own prerequisites.
caption: Left to right in each column. Solid arrows are calls, the dashed rose arrow is the failure, the dashed ink arrow is a reply. From capture/out/04-inspect-binary-layout.json and 04-inspect-macho.json.
```

## 加载映像 {#s-inspect-binary-layout-and-the-load-image-the-load-image}

```listing
title: header facts and the entry point
source: capture/out/04-inspect-macho.json
lang: json
note: Cut from normalized_result to the header, the entry point, and the build metadata. rea names the build platform and tool codes from loader.h.
---
"format": "mach-o",
"selected_architecture": {
  "name": "arm64",
  "container_file_offset": 0
},
"endian": "little",
"word_size": 64,
"file_type": "2",
"flags": [
  "0x00200085"
],
"uuid": "59A1CCA5-97D1-3661-99DA-666BC2BB38D7",
"entrypoints": {
  "items": [
    {
      "file_offset": 1488
    }
  ],
  …
},
…
"build_metadata": {
  "items": [
    {
      "platform": "MACOS",
      "minimum_os": "26.0",
      "sdk": "26.2",
      …
```

**Load command：** Mach-O 头后面那份列表里的一条记录，带一个 `cmd` 类型与一个 `cmdsize`。Apple 不发布散文规格，所以 XNU 源码里的 `loader.h` 头文件就是参考。`file_type` 2 是 `MH_EXECUTE`。标志 `0x00200085` 是 `MH_NOUNDEFS` 0x1、`MH_DYLDLINK` 0x4、`MH_TWOLEVEL` 0x80 与 `MH_PIE` 0x200000 相加。入口点来自 `LC_MAIN`，其 `entryoff` 是 1488，也就是 0x5d0。把它加到下面的 `__TEXT` 地址上，就得到 `0x1000005d0`，即 `_main` 导出。

四条 `LC_SEGMENT_64` 命令就是加载映像。每个 `segment_command_64` 点名一个 `vmaddr`、一个 `vmsize`、一个 `fileoff`、一个 `filesize`、两个保护字段，以及 `nsects`，它的 `section_64` 记录跟在同一条命令里面。

| Segment | `vmaddr` | `vmsize` | `fileoff` | `filesize` | `initprot` | `nsects` |
|---|---|---|---|---|---|---|
| `__PAGEZERO` | `0x0` | 4294967296 | 0 | 0 | 0 | 0 |
| `__TEXT` | `0x100000000` | 16384 | 0 | 16384 | 5, read and execute | 5 |
| `__DATA_CONST` | `0x100004000` | 16384 | 16384 | 16384 | 3, read and write | 2 |
| `__LINKEDIT` | `0x100008000` | 16384 | 32768 | 1104 | 1, read | 0 |

```listing
title: the __TEXT segment and its five sections
source: capture/out/04-inspect-macho.json
lang: json
note: Cut from the segments collection. Permissions, alignment, and flags are cut from each section.
---
{
  "name": "__TEXT",
  "vm_address": "0x100000000",
  "vm_size": 16384,
  "file_offset": 0,
  "file_size": 16384,
  …
  "sections": {
    "items": [
      {
        "segment": "__TEXT",
        "name": "__text",
        "address": "0x100000500",
        "size": 576,
        "file_offset": 1280,
        …
      },
      {
        "segment": "__TEXT",
        "name": "__stubs",
        "address": "0x100000740",
        "size": 48,
        "file_offset": 1856,
        …
      },
      {
        "segment": "__TEXT",
        "name": "__cstring",
        "address": "0x100000770",
        "size": 95,
        "file_offset": 1904,
        …
      },
      {
        "segment": "__TEXT",
        "name": "__const",
        "address": "0x1000007d0",
        "size": 64,
        "file_offset": 2000,
        …
      },
      {
        "segment": "__TEXT",
        "name": "__unwind_info",
        "address": "0x100000810",
        "size": 96,
        "file_offset": 2064,
        …
      }
    ],
```

`__PAGEZERO` 用没有文件字节的方式保留地址空间的前 4 GiB，好让空指针永远到不了已映射内存。`__TEXT` 从 `0x100000000` 开始，映射文件的前 16384 字节。它的代码节 `__text` 在 `0x100000500` 持有 576 字节，[第 4 部分](#s-list-procedures-and-function-bodies) 会交代其中每一字节。`__cstring` 持有格式字符串与五个标签，`__const` 持有[跳转表那一节](#s-xrefs-and-the-jump-table) 所读的两张查找表。

`__LINKEDIT` 段没有节。其他加载命令按文件偏移指向它。

| Command | Offset in the file | Size |
|---|---|---|
| `LC_DYLD_CHAINED_FIXUPS` | 32768 | 176 |
| `LC_DYLD_EXPORTS_TRIE` | 32944 | 104 |
| `LC_FUNCTION_STARTS` | 33048 | 8 |
| `LC_SYMTAB`, 13 symbols | `symoff` 33056, `stroff` 33304 | `strsize` 152 |
| `LC_CODE_SIGNATURE` | 33456 | 416 |

最后一条命令结束于 33872，即文件大小。在 ELF 里，加载器读程序头表，链接器读节头表，两张表都由 ELF 头指向。在 Mach-O 里只有一份列表，且 `LC_SEGMENT_64` 在命令内部携带其节。[第 32 课](phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch) 从规格为两种格式构建读取器，并把每条加载命令与其 ELF 概念对齐。

```figure
id: fig-3-3
kind: layers
title: the load image of ledger-arm64-O1
claim: Four segments map 33872 file bytes into three address ranges, and every other load command points into the last one by file offset.
caption: Read from the lowest address at the top. The left column is the address, the right column is the file offset. The dashed box has no file bytes. From capture/out/04-inspect-macho.json.
```

## 导入与导出 {#s-inspect-binary-layout-and-the-load-image-imports-and-exports}

```listing
title: the exported functions
source: capture/out/04-inspect-macho.json
lang: json
note: Cut from the exports collection. The __mh_execute_header entry and the weak and reexport fields are cut.
---
"exports": {
  "items": [
    …
    {
      "name": "_grade",
      "address": "0x100000518",
      …
    },
    {
      "name": "_grade_label",
      "address": "0x100000588",
      …
    },
    {
      "name": "_main",
      "address": "0x1000005d0",
      …
    },
    {
      "name": "_percent_change",
      "address": "0x100000500",
      …
    },
    {
      "name": "_total",
      "address": "0x100000554",
      …
    }
  ],
  "total": null,
  "exhaustive": false,
  "limitations": [
    "Merged nm/dyld_info results may be incomplete for stripped binaries."
  ]
},
```

六个导出：五个函数，以及位于 `0x100000000` 的 `__mh_execute_header`。来自 `libSystem` 的六个导入：`___stack_chk_fail`、`___stack_chk_guard`、`___stderrp`、`_atoi`、`_fwrite` 与 `_printf`。

一个依赖：`/usr/lib/libSystem.B.dylib`。rea 只把 dylib 加载命令列为依赖。动态链接器 `/usr/lib/dyld` 留在加载命令的 `LC_LOAD_DYLINKER` 那一行。

导入与导出集合都写着 `exhaustive: false`，因为各自合并了两个工具的文本。记录不承诺列表完整，你也不该承诺。[第 4.2 节](#s-list-procedures-and-function-bodies) 展示 Ghidra 看到的同名符号，[下一节](#s-address-to-file-offset) 把 `0x100000518` 变成文件偏移。

```takeaways
- 在任何不是 Linux x64 的主机上，预期 `inspect-binary-layout` 给出 `capability_unavailable`。
- 在重试任何事之前，先读 `code`、`category` 与 `details.provider_id`。
- 在 macOS 上跑 `inspect-macho`，并先读四行 `LC_SEGMENT_64`。
- 在说某个符号不存在之前，先检查每个集合上的 `exhaustive`。
```

Sources: capture/out/00-commands.txt, capture/out/04-inspect-binary-layout.json, capture/out/04-inspect-macho.json; rea 6.7.0 at 27dc42d: src/contracts/errorSchemas.ts, src/native/pwntools/PwntoolsDecoder.ts, src/server/createServer.ts, src/native/NativeMachoInspection.ts, src/native/parsers/otool.ts; rea docs/cli.md
