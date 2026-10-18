# 程序解剖：从零编写 ELF 读取器

> 编译后的程序是一组相互指向的表。自己编写的读取器能给出可以逐字节核对的输出。

**Type:** Build
**Languages:** Python（标准库）、C（仅用于测试夹具）
**Prerequisites:** Phase 0 · 01（开发环境），已安装 clang；Python 3.10 或更高版本；十六进制运算
**Time:** ~120 分钟

## 学习目标

- 说明本系列每个分析目标的授权规则，以及 17 U.S.C. 1201(f) 的四项限制。
- 使用 `struct.unpack` 读取 ELF 文件头、节头表和两个字符串表。
- 根据 gABI 与 x86-64 psABI 中的名称解码 `.symtab` 条目与 `.rela` 记录。
- 返回指定函数的准确字节，并将每个文件偏移映射到所属结构。
- 读取程序头，通过 `PT_LOAD` 将虚拟地址映射为文件偏移。
- 读取 Mach-O 目标文件的加载命令，并指出每个命令对应的 ELF 概念。

## 开始之前：授权与法律

第 32 至 36 课的每个目标都是你自己编写并编译的程序。源码是 `code/fixtures/ledger.c`，其中包含四个简短的 C 函数。源码、编译命令和生成的目标文件都由你掌握。这里没有需要解读的许可证、需要绕过的保护，也不会打开任何第三方代码。本系列不涉及软件保护、许可证检查或不属于你的程序。

这条规则的原因在于，法律将反汇编视为复制。在 *Sega Enterprises Ltd. v. Accolade, Inc.*, 977 F.2d 1510 (9th Cir. 1992) 案中，法院认定反汇编过程中产生的中间副本属于《版权法》意义上的复制。随后法院判定：“当反汇编是获取受版权保护的计算机程序中所体现的思想和功能要素的唯一途径，且寻求此类获取具有正当理由时，反汇编在法律上构成对该受版权保护作品的合理使用。”

第二个案例是 *Sony Computer Entertainment, Inc. v. Connectix Corp.*, 203 F.3d 596 (9th Cir. 2000)。Connectix 在开发模拟器时复制了 PlayStation BIOS，法院认定这些复制属于合理使用。两个案例都保护了研究行为，但都不保护最终产品中的复制代码。

两项成文法划定了边界。17 U.S.C. 1201(f) 允许“已合法取得计算机程序副本使用权”的人绕过访问控制，但“唯一目的必须是识别和分析使独立创建的计算机程序与其他程序实现互操作所必需的程序要素”。四项限制必须同时满足：副本合法、目的为互操作、相关要素此前并非“可轻易获得”，且分析本身不构成其他侵权。第 1201(f) 条只是反规避规则的例外；复制是否合法仍需依据合理使用判断。

在欧盟，Directive 2009/24/EC 第 5(3) 条涉及研究。拥有副本使用权的人可以“观察、研究或测试程序的运行，以确定程序任一要素背后的思想和原理”。这一权利适用于加载、显示、运行、传输或存储程序期间。

第 6 条允许在“为取得实现独立创建的计算机程序互操作所需信息而不可或缺”时，无须权利人授权即可进行反编译。其条件与 1201(f) 对应：行为由被许可人实施、信息此前并非可轻易获得，且行为限定于必要部分。第 6(2) 条禁止将结果用于其他目的，或用于表达形式实质相似的程序。第 8 条规定，与第 6 条或第 5(3) 条相违背的合同条款无效。

| 来源 | 允许的行为 | 条件 |
|---|---|---|
| 17 U.S.C. 1201(f) | 绕过访问控制以分析程序 | 合法副本、互操作目的、信息不易获得、不构成侵权 |
| Directive 2009/24/EC 第 5(3) 条 | 观察、研究和测试运行中的程序 | 有权使用副本，行为处于正常加载和运行范围内 |
| Directive 2009/24/EC 第 6 条 | 反编译 | 被许可人、互操作目的、信息不易获得、仅限必要部分 |
| *Sega v. Accolade* | 构成合理使用的反汇编 | 获取思想和功能要素的唯一途径，且理由正当 |
| *Sony v. Connectix* | 逆向工程过程中的中间复制 | 最终产品不侵权 |

这些说明来自法条与判决意见，不构成法律建议。以后遇到不属于你的目标时，应先取得书面授权再打开文件，并将授权与证据一起保存。Reverse Engineering 101 手册第 2.1 节列出了完整引用及欧盟法院（CJEU）的案例。

## 问题

你编译了 `ledger.c`，并对目标文件运行了 `llvm-objdump -t`。输出列出 `percent_change` 的值为 `0000000000000000`，大小为 `0000000000000010`。这个 1,768 字节文件中的哪 16 字节属于该函数？列表还在偏移 `0x36` 处显示 `R_X86_64_PC32 .rodata+0x10`，而文件中该位置的四个字节都是零。它们最终会变成什么？表从 `0x14` 开始，为何加数却是 `0x10`？

rea 使用 `inspect_binary_layout` 回答布局问题，但该工具仅在 Linux x64 上提供，并通过 `REA_PWNTOOLS_PYTHON` 使用 pwntools 4.15.0。这台 Mac 上没有它。`address_to_file_offset` 需要 Ghidra 会话，以及 SHA-256 匹配的原始文件完整字节副本。`inspect_artifact` 按路径和内容哈希列出容器中的内容，却不会读取目标文件内部的表。因此，你将用约 950 行 Python、`struct.unpack` 和零外部依赖自己编写读取器。测试将每张表与一次性采集并保存为夹具的 `llvm-objdump` 文本进行比较。

```figure
elf-byte-map
```

## 文件就是指向其他表的表

System V gABI 第 4 章图 4-1 展示了同一文件的两个视图。链接视图包含 ELF 文件头、可选的程序头表、节，以及必需的节头表。执行视图包含 ELF 文件头、必需的程序头表、段，以及可选的节头表。gABI 中有一句话决定了整个读取器的设计：“只有 ELF 文件头在文件中的位置是固定的。”其他所有结构都通过另一个结构中存储的偏移来定位。

gABI 还固定了标量类型，并声明“ELF 不使用位域”。`Elf64_Addr` 和 `Elf64_Off` 各占 8 字节，`Elf64_Half` 占 2 字节，`Elf64_Word` 占 4 字节，`Elf64_Xword` 占 8 字节。x86-64 psABI 第 4.1.1 节要求使用 `ELFCLASS64`、`ELFDATA2LSB`，`e_machine` 为 `EM_X86_64`（62），`e_flags` 为 0。小端字节序加上固定宽度意味着：使用带 `<` 前缀的 `struct.unpack`，一次调用就能读取一条记录。

`ledger-x86_64-O1.o` 的前 64 字节：

```text
00000000: 7f45 4c46 0201 0100 0000 0000 0000 0000  .ELF............
00000010: 0100 3e00 0100 0000 0000 0000 0000 0000  ..>.............
00000020: 0000 0000 0000 0000 2804 0000 0000 0000  ........(.......
00000030: 0000 0000 4000 0000 0000 4000 0b00 0100  ....@.....@.....
```

对照 gABI 的“ELF Header”页面阅读这些字节。`e_ident` 占 16 字节，包含 `7f 45 4c 46`（魔数，即识别文件格式的固定字节）、类别 2（64 位）、数据编码 1（小端）、版本 1、OS ABI 0（System V）及填充。

接着，`e_type` 的 `0x0001` 表示 `ET_REL`，即可重定位目标文件。`e_machine` 的 `0x003e` 为 62，即 `EM_X86_64`。目标文件没有入口点，因此 `e_entry` 为零；它没有程序头，因此 `e_phoff` 为零。`e_shoff` 为 `0x428`，即节头表的文件偏移。最后一行包含 `e_ehsize` `0x40`、`e_phentsize` 0、`e_phnum` 0、`e_shentsize` `0x40`、`e_shnum` `0x0b`（11 个节头），以及 `e_shstrndx` `0x0001`。

读取器用一次调用解析这一行：

```python
fields = struct.unpack_from("<HHIQQQIHHHHHH", data, 16)
```

格式字符串对应从左到右读取的 gABI 图示：两个半字、一个字、三个 8 字节值、一个字、六个半字。读取器拒绝魔数、类别或字节序不符的文件，也拒绝不符合 64 和 56 的 `e_shentsize` 或 `e_phentsize` 值。宽度一旦错误，后续所有偏移都会出错，因此检查必须放在最前面。

## 节头与两个字符串表

每个节头都是一个 64 字节的 `Elf64_Shdr`（gABI 图 4-8）：`sh_name`、`sh_type`、`sh_flags`、`sh_addr`、`sh_offset`、`sh_size`、`sh_link`、`sh_info`、`sh_addralign`、`sh_entsize`。格式字符串为 `<IIQQQQIIQQ`。`sh_name` 是索引为 `e_shstrndx` 的节中的偏移，名称在第一个零字节处结束。本目标文件的 `e_shstrndx` 为 1，clang 将该节命名为 `.strtab`，因此同一张表同时存储节名称和符号名称。

读取器输出 -O1 目标文件的 11 个节头：

```text
Idx Name             Type         Flags   Offset     Size       Addr Link Info Align
  0                  NULL                    0x0      0x0        0x0    0    0     0
  1 .strtab          STRTAB                0x368     0xbe        0x0    0    0     1
  2 .text            PROGBITS     AX        0x40     0x9f        0x0    0    0    16
  3 .rela.text       RELA         I        0x2a8     0x48        0x0   10    2     8
  4 .rodata          PROGBITS     A         0xe0     0x50        0x0    0    0     8
  5 .rela.rodata     RELA         I        0x2f0     0x78        0x0   10    4     8
  6 .rodata.str1.1   PROGBITS     AMS      0x130      0xa        0x0    0    0     1
  7 .comment         PROGBITS     MS       0x13a     0x2f        0x0    0    0     1
  8 .note.GNU-stack  PROGBITS              0x169      0x0        0x0    0    0     1
  9 .llvm_addrsig    LLVM_ADDRSIG E        0x368      0x0        0x0   10    0     1
 10 .symtab          SYMTAB                0x170    0x138        0x0    1    9     8
```

索引 0 是保留的空节头。`.text` 在文件偏移 `0x40` 处存放 159 字节代码，紧接文件头，标志为 `A`（在内存中分配）和 `X`（可执行）。`.rodata` 存放 80 字节只读数据。`.rodata.str1.1` 存放五个标签字符串 `F\0D\0C\0B\0A\0`，共 10 字节，标志为 `M`（可合并）和 `S`（字符串）。

`.comment` 存放 47 字节的编译器标记 `\0Apple clang version 17.0.0 (clang-1700.6.3.2)\0`。`.llvm_addrsig` 的类型是 `0x6fff4c03`，位于 gABI 保留给操作系统专用类型的 `SHT_LOOS` 至 `SHT_HIOS` 范围内，LLVM 的 `ELF.h` 给出了它的名称。其标志 `E` 为 `SHF_EXCLUDE`，因此链接器会丢弃它。

`sh_link` 和 `sh_info` 两列是表之间的指针。`.rela.text` 的 `sh_info` 为 2、`sh_link` 为 10：它修补第 2 节，并从第 10 节获取符号。`.symtab` 的 `sh_link` 为 1，指向符号名称字符串表；`sh_info` 为 9，表示第一个非局部符号的索引。每一行的 `sh_addr` 都为零，因为目标文件还没有地址；地址由链接器分配。

gABI 的两条规则让读取器能够绘制完整文件映射：节“连续且不重叠”，文件“可以包含未使用空间”。读取器按偏移对每个结构排序，并填入空隙：

```text
     0x0 +64    header   ELF header
    0x40 +159   section  .text
    0xdf +1     gap      inactive space
    0xe0 +80    section  .rodata
   0x130 +10    section  .rodata.str1.1
   0x13a +47    section  .comment
   0x169 +7     gap      inactive space
   0x170 +312   section  .symtab
   0x2a8 +72    section  .rela.text
   0x2f0 +120   section  .rela.rodata
   0x368 +190   section  .strtab
   0x426 +2     gap      inactive space
   0x428 +704   table    section header table
```

三个空隙共 10 字节，都是为了对齐。`.rodata` 的 `sh_addralign` 为 8，因此从 `0xe0` 而不是 `0xdf` 开始。`.symtab` 的对齐要求为 8，因此 `.comment` 之后有七个字节未使用。节头表本身也按 8 字节对齐。

`SHT_NOBITS` 类型的节完全不占文件字节，因此映射会跳过它们。本目标文件没有这种类型的节，但已链接程序中的 `.bss` 属于此类；如果读取器在那里盲目信任 `sh_size`，就可能读到文件末尾之外。

## 符号：绑定、类型、所属节、值与大小

`Elf64_Sym` 占 24 字节（gABI 图 4-18）：`st_name`、`st_info`、`st_other`、`st_shndx`、`st_value`、`st_size`，格式为 `<IBBHQQ`。`st_info` 打包了两个字段：高四位为绑定属性，低四位为类型。gABI 定义的绑定为 `STB_LOCAL` 0、`STB_GLOBAL` 1、`STB_WEAK` 2；类型为 `STT_NOTYPE` 0、`STT_OBJECT` 1、`STT_FUNC` 2、`STT_SECTION` 3、`STT_FILE` 4。`st_other` 的低两位存放可见性，这里全部为 `STV_DEFAULT` 0。

```text
Idx            Value   Size Bind   Type    Section          Name
  0              0x0      0 LOCAL  NOTYPE  *UND*
  1              0x0      0 LOCAL  FILE    *ABS*            ledger.c
  2              0x0     20 LOCAL  OBJECT  .rodata          labels.rel
  3              0x0      0 LOCAL  SECTION .rodata          .rodata
  4              0x2      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.1
  5              0x4      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.2
  6              0x6      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.3
  7              0x8      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.4
  8              0x0      0 LOCAL  SECTION .rodata.str1.1   .rodata.str1.1
  9              0x0     16 GLOBAL FUNC    .text            percent_change
 10             0x10     46 GLOBAL FUNC    .text            grade
 11             0x40     31 GLOBAL FUNC    .text            total
 12             0x60     63 GLOBAL FUNC    .text            grade_label
```

索引 0 是保留的未定义符号。`st_shndx` 指定定义符号的节，另有三个保留值：`SHN_UNDEF` 0、用于文件名的 `SHN_ABS` `0xfff1`，以及 `SHN_COMMON` `0xfff2`。节符号名称为空，因此 `llvm-objdump` 会打印节本身的名称，读取器也如此处理。gABI 规定“所有具有 STB_LOCAL 绑定的符号都排在弱符号和全局符号之前”，这里体现为前九行，也正因此 `.symtab` 在 `sh_info` 中记录了 9。

在可重定位目标文件中，由于 `sh_addr` 为零，`st_value` 是符号所在节内的偏移。因此函数的文件偏移为 `sh_offset + st_value - sh_addr`，长度为 `st_size`：

```python
section = elf.sections[symbol.st_shndx]
file_offset = section.sh_offset + (symbol.st_value - section.sh_addr)
code = elf.data[file_offset : file_offset + symbol.st_size]
```

对 `percent_change` 而言，偏移是 `0x40 + 0`，16 个字节为 `85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3`。大小与起始位置同样重要。`grade` 在 `.text` 的偏移 `0x3e` 处结束。紧随其后的两个字节 `66 90` 是编译器添加的 `nop` 空操作指令，用来让 `total` 从 `0x40` 这一 16 字节边界开始。这两个字节不属于任何符号。第 33 课以 `st_size` 作为反汇编器的停止条件，第 36 课在比较重新构建的结果之前会屏蔽这些填充字节。

## 重定位：零字节意味着什么

`Elf64_Rela` 占 24 字节（gABI 图 4-23）：`r_offset`、`r_info` 和有符号的 `r_addend`，格式为 `<QQq`。重定位记录描述链接时需要修补的位置及计算方式。gABI 用两个宏拆分 `r_info`：`ELF64_R_SYM(i)` 为 `i >> 32`，`ELF64_R_TYPE(i)` 为 `i & 0xffffffff`。在可重定位文件中，`r_offset` 是表的 `sh_info` 所指定节内的偏移。类型名称和公式来自 x86-64 psABI 表 4.9，其中 `S` 是符号值，`A` 是加数，`P` 是被修补的位置，`L` 是过程链接表（PLT）条目。`R_X86_64_64` 为 `S + A`，`R_X86_64_PC32` 为 `S + A - P`，`R_X86_64_PLT32` 为 `L + A - P`。

-O1 目标文件有八条记录：

```text
  .rela.text       0x36 R_X86_64_PC32          .rodata+0x10
  .rela.text       0x84 R_X86_64_PC32          .rodata+0x24
  .rela.text       0x93 R_X86_64_PC32          .rodata-0x4
  .rela.rodata      0x0 R_X86_64_PC32          .rodata.str1.1
  .rela.rodata      0x4 R_X86_64_PC32          .L.str.1+0x4
  .rela.rodata      0x8 R_X86_64_PC32          .L.str.2+0x8
  .rela.rodata      0xc R_X86_64_PC32          .L.str.3+0xc
  .rela.rodata     0x10 R_X86_64_PC32          .L.str.4+0x10
```

拆解第一条记录。偏移 `0x36` 位于 `grade` 内，后者范围为 `0x10` 至 `0x3e`。`0x33` 处的指令是 `48 8d 0d 00 00 00 00`，即计算 RIP 相对地址的 `lea`，其四字节位移位于 `0x36`。处理器将该位移加到下一条指令的地址 `0x3a` 上。

编译器希望结果为 `.rodata + 0x14`，那里是一张包含五个 32 位值 `1, 2, 3, 4, 4` 的表的起点。因此存储值必须为 `(.rodata + 0x14) - 0x3a`。公式 `S + A - P` 在 `P = 0x36` 时得到 `.rodata + A - 0x36`。令两者相等可得 `A = 0x14 - 4 = 0x10`。加数包含目标偏移减去位移字段与指令末尾之间的四个字节。

这张表体现了 clang 在 -O1 下编译 `grade` 中 `switch` 的方式。代码通过乘以 `0x66666667` 和两次移位计算 `score / 10`，再减去 6、与 4 比较，然后索引该表。-O1 ELF 目标文件没有为该表保留符号；引用是节符号 `.rodata` 加上一个加数，只有同一源码的 arm64 构建将它命名为 `l_switch.table.grade`。第二条记录位于 `grade_label` 的 `0x84`，指向 `.rodata + 0x28` 处第二张由 8 字节值组成的表。第三条位于 `0x93`，指向 `.rodata + 0x0`，即 `labels.rel` 的起点。

五条 `.rela.rodata` 记录填充 `labels.rel`。每个条目位于偏移 `4i`，加数也是 `4i`，因此 `S + A - P` 化简为字符串地址减去表基址。`grade_label` 用 `movslq` 读取条目，再加回表基址，就得到指针。第一条记录引用节符号 `.rodata.str1.1`，加数为 0，因为字符串 `F` 从该节的第一个字节开始。其余记录引用 `.L.str.1` 至 `.L.str.4`，它们是编译器为 `D`、`C`、`B`、`A` 生成的局部标签。

同一源码在三种优化级别下会编译出三种不同的表。不借助反汇编器，读取器也能展示差异：

| 构建 | `labels` 的位置 | `grade` 如何选择 | `grade_label` 如何到达 `grade` |
|---|---|---|---|
| -O0 | `.data`，五个 8 字节指针，五条 `R_X86_64_64` 记录 | `.rodata` 中的跳转表：五条指向 `.text` 的 `R_X86_64_PC32` 记录 | 带有 `R_X86_64_PLT32 grade-0x4` 的调用 |
| -O1 | `.rodata` 中的 `labels.rel`，五个 32 位相对条目 | `.rodata+0x14` 处的值表，一条 `R_X86_64_PC32` | 已内联，没有调用 |
| -O2 | 与 -O1 相同 | 与 -O1 相同 | 已内联，`total` 增长到 140 字节 |

在 -O0 下，`switch` 是真正的跳转表，五个条目分别指回 `.text` 中的 `+0x91`、`+0x8c`、`+0x87`、`+0x82` 和 `+0x86`。对 `grade` 的调用带有同样的 `-0x4` 加数，原因与 `lea` 相同。在 -O1 下，优化器发现每个分支都返回常量，于是用结果表替代跳转。第 33 课将解码这两种形态。

## 程序头：加载器的视图

可重定位目标文件没有程序头，因此 `e_phnum` 为 0。可执行文件和共享目标文件则包含程序头，加载器只读取这些信息。`Elf64_Phdr` 占 56 字节（gABI 图 5-1）：`p_type`、`p_flags`、`p_offset`、`p_vaddr`、`p_paddr`、`p_filesz`、`p_memsz`、`p_align`，格式为 `<IIQQQQQQ`。gABI 为 `PT_LOAD` 条目规定三条规则：按 `p_vaddr` 升序排列；`p_memsz` 大于 `p_filesz` 的部分用零填充；`p_vaddr` 与 `p_offset` 对 `p_align` 取模同余。

本系列的每个目标都是你自己构建的程序，而这台 Mac 上没有能从 `ledger.o` 生成 Linux 可执行文件的链接器。因此夹具 `tiny-x86_64` 来自 `code/fixtures/build_tiny_elf.py`，它用 `struct.pack` 写出 736 字节。文件包含 ELF 文件头、两个程序头、36 字节的 `_start`、3 字节的 `.rodata`、符号表和六个节头。`_start` 向文件描述符 1 写入 `ok\n`，然后以状态码 42 退出。它能在 Linux x86-64 上运行；在这里，它是覆盖程序头处理路径的测试夹具。

```text
Program headers:
  PT_LOAD          r-x offset=0x0 vaddr=0x400000 filesz=0x2e0 memsz=0x2e0 align=0x1000
  PT_GNU_STACK     rw- offset=0x0 vaddr=0x0 filesz=0x0 memsz=0x0 align=0x10

entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

唯一的 `PT_LOAD` 将整个 736 字节文件映射到 `0x400000`。读取器找到包含某地址的 `PT_LOAD`，再计算 `p_offset + (address - p_vaddr)`，即可将地址映射为文件偏移。入口点的计算是 `0 + (0x4000b0 - 0x400000) = 0xb0`，正是 `.text` 的起点。

这就是 rea 的 `address_to_file_offset` 背后的计算。对 Ghidra 目标，该工具返回 `{address, file_offset}`；Hopper 提供方还会返回 `provider_file_offset` 和 `image_base_file_offset`。工具需要完整的原始文件副本，且副本的 SHA-256 必须与目标匹配。rea 的 `inspect_binary_layout` 文档中还有一句值得牢记的话：“链接地址不是运行时地址。”位置无关可执行文件会加载到内核选择的基址，只有文件偏移是稳定坐标。

程序头也解释了为何剥离信息后的可执行文件仍能运行。链接器可以完全移除节头表，此时 `e_shoff` 变为零。遍历节的工具会看不到任何内容，而加载器从来就不依赖这些节头。

## Mach-O 中的对应概念

Apple 没有发布 Mach-O 的文字版规范。XNU 源码中的头文件就是规范：`EXTERNAL_HEADERS/mach-o/loader.h`、`nlist.h` 和 `reloc.h`。夹具 `ledger-arm64-O1.o` 由同一个 `ledger.c` 使用 `clang -target arm64-apple-macos -O1 -fno-asynchronous-unwind-tables -c` 构建。

`mach_header_64` 占 32 字节：`magic`、`cputype`、`cpusubtype`、`filetype`、`ncmds`、`sizeofcmds`、`flags`、`reserved`。魔数为 `0xfeedfacf`，即 `MH_MAGIC_64`。`cputype` 为 `0x0100000c`，即 `CPU_TYPE_ARM64`。`filetype` 为 1，即 `MH_OBJECT`。`ncmds` 为 5，`sizeofcmds` 为 616：加载命令占据文件头之后的 616 字节，每条命令均以 `{cmd, cmdsize}` 开始。标志 `0x2000` 为 `MH_SUBSECTIONS_VIA_SYMBOLS`。

```text
Load commands:
  0 LC_SEGMENT_64                cmdsize=472 at 0x20
  1 LC_BUILD_VERSION             cmdsize=24 at 0x1f8
  2 LC_LINKER_OPTIMIZATION_HINT  cmdsize=16 at 0x210
  3 LC_SYMTAB                    cmdsize=24 at 0x220
  4 LC_DYSYMTAB                  cmdsize=80 at 0x238
```

`LC_SEGMENT_64`（0x19）对应 ELF 的两张表。其 `segment_command_64` 包含 `segname`、`vmaddr`、`vmsize`、`fileoff`、`filesize`、`maxprot`、`initprot`、`nsects` 和 `flags`。同一命令中紧接着 `nsects` 条 `section_64` 记录，每条 80 字节。`loader.h` 关于 `MH_OBJECT` 的注释说，这些节位于“一个没有段填充的无名单一段中”。夹具正是如此：一个空名称的段，`fileoff` 为 648，`filesize` 为 456，包含五个节。

```text
  Idx Section                    Addr   Size Offset Reloff Nreloc Type
    1 __TEXT,__text               0x0   0xd0    648   1104      6 S_REGULAR
    2 __DATA,__const             0xd0   0x28    856   1152      5 S_REGULAR
    3 __TEXT,__cstring           0xf8    0xa    896      0      0 S_CSTRING_LITERALS
    4 __TEXT,__const            0x108   0x40    912      0      0 S_REGULAR
    5 __LD,__compact_unwind     0x148   0x80    976   1192      4 S_REGULAR
```

每个节通过 `segname` 指明所属段，因此两个名为 `__const` 的节并不相同：一个是 `__DATA,__const`，另一个是 `__TEXT,__const`。重定位通过 `reloff` 和 `nreloc` 按节存放；ELF 则为每个目标节设置单独的 `.rela.X` 节。

每条 `relocation_info` 占 8 字节，首先是有符号的 `r_address`，随后是一个 32 位字段，打包为 `r_symbolnum`（24 位）、`r_pcrel`（1 位）、`r_length`（2 位）、`r_extern`（1 位）和 `r_type`（4 位）。六条 `__text` 记录是三对 `ARM64_RELOC_PAGE21` 与 `ARM64_RELOC_PAGEOFF12`，每次表引用对应一对。arm64 的 `adrp` 加 `add` 实现了 x86-64 一条 `lea` 的作用，因此每次引用都需要两条记录。五条 `__DATA,__const` 记录为 `ARM64_RELOC_UNSIGNED`，`r_length` 为 3，因此每条修补一个 8 字节绝对指针。

在 -O1 下，arm64 构建将 `labels` 保留为普通指针，而 x86-64 构建生成了相对表。

`LC_SYMTAB`（0x2）包含 `symoff` 1240、`nsyms` 17、`stroff` 1512、`strsize` 176，1512 加 176 等于文件大小 1688。每个 `nlist_64` 占 16 字节：`n_strx`、`n_type`、`n_sect`、`n_desc`、`n_value`。`n_type` 是位域。`N_TYPE`（掩码 `0x0e`）等于 `N_SECT`（`0xe`），表示符号定义在序号为 `n_sect` 的节中，序号从 1 开始。`N_EXT`（`0x01`）标记外部符号。

`nlist_64` 没有大小字段。为获取 `_percent_change` 的 24 字节，读取器使用同一节中下一个符号的地址，即位于 `0x18` 的 `_grade`。这里的 C 符号带有前导 `_`，因此函数名为 `_percent_change`。

`LC_DYSYMTAB`（0xb）记录了与 ELF `sh_info` 相同的局部符号优先规则：`ilocalsym` 0、`nlocalsym` 13、`iextdefsym` 13、`nextdefsym` 4。`LC_BUILD_VERSION`（0x32）以打包的 `XXXX.YY.ZZ` 整数记录 `platform` 1（macOS）、`minos` 26.0 和 `sdk` 26.2。正因为这条命令，arm64 夹具必须以字节形式提交；在使用另一 SDK 的 Mac 上构建会产生不同文件。

读取器的 `compare_formats` 将两个文件并排比较：

| 概念 | ELF，`ledger-x86_64-O1.o` | Mach-O，`ledger-arm64-O1.o` |
|---|---|---|
| 文件标识 | `e_ident` `7f 45 4c 46`，类别 64，数据 LSB | `magic` `0xfeedfacf` |
| 机器架构 | `e_machine` 62，`EM_X86_64` | `cputype` `0x100000c`，`CPU_TYPE_ARM64` |
| 文件种类 | `e_type` 1，`ET_REL` | `filetype` 1，`MH_OBJECT` |
| 表的位置 | `e_shoff` `0x428`，11 个节头 | 5 条加载命令，位于文件头后的 616 字节 |
| 代码 | `.text` 位于 `0x40`，大小 `0x9f`，标志 `AX` | 无名段内的 `__TEXT,__text` 位于 648，大小 `0xd0` |
| 符号名称 | `.symtab`（第 10 节），通过 `sh_link` 1 在 `.strtab` 中查找名称 | `LC_SYMTAB` 的 `symoff` 1240、`nsyms` 17，名称位于 `stroff` 1512 |
| 符号大小 | `st_size`：`percent_change` 为 16 字节 | 没有对应字段：下一符号减去当前符号，得到 24 字节 |
| 重定位 | `.rela.text`，3 条记录，`R_X86_64_PC32` | `__text` 的 `reloff` 1104，6 条记录，`PAGE21` 与 `PAGEOFF12` |
| 函数字节 | `percent_change`：`0x40` 处的 16 字节 | `_percent_change`：`0x288` 处的 24 字节 |

rea 通过 `inspect_macho` 读取 Mach-O，该工具经由 `xcrun` 运行 `otool -h -l`、`nm -gjU`、`dyld_info -imports -exports` 和 `dwarfdump --uuid`。你的读取器不需要这些工具，但会读取与 `otool -l` 输出相同的 `symoff` 和 `stroff`。rea 的 `open_binary` 工具通过魔数识别 ELF、MZ、PE，以及单架构或通用 Mach-O，还会自行读取偏移 18 处的 `e_machine`。这正是你在这里实现的前 20 字节解析。对于没有文件头的文件，需要提供 `format: raw-binary`、架构和入口地址。Ghidra 提供方拒绝通用二进制文件，要求先提取单架构切片。你的读取器遇到 `0xcafebabe` 时也这样处理。

## 自己构建

运行仅使用标准库的读取器：

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
```

演示读取 `ledger-x86_64-O1.o`，输出文件头、节、符号、重定位和文件偏移映射；随后输出四个函数的字节串，读取 `ledger-arm64-O1.o` 并输出比较表；最后输出 `tiny-x86_64` 的程序头。预期输出包括：

```text
percent_change: 16 bytes at file offset 0x40: 85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3
grade: 46 bytes at file offset 0x50: 48 63 c7 48 69 c0 67 66 66 66 ...
entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

传入路径可读取单个文件：`python3 code/main.py code/fixtures/ledger-x86_64-O0.o`。读取器根据前四个字节选择 ELF 或 Mach-O。

按以下顺序阅读 `code/main.py`：

1. `ElfFile._read_header()` 检查魔数、类别、字节序和条目大小，然后解包文件头。
2. `ElfFile._read_sections()` 与 `read_cstring()` 读取节头表，并通过 `e_shstrndx` 解析名称。
3. `ElfFile._read_symbols()` 拆分 `st_info`，通过 `sh_link` 解析名称，并保持保留节索引可读。
4. `ElfFile._read_relocations()` 遍历每个 `SHT_RELA` 节，拆分 `r_info`，并依据表 4.9 为类型命名。
5. `ElfFile.function_span()` 与 `function_bytes()` 将符号转化为文件范围及其中的字节。
6. `ElfFile.file_offset_map()` 按偏移排序每个结构，并补入未使用空间。
7. `ElfFile._read_program_headers()` 与 `address_to_file_offset()` 处理可执行文件。
8. `MachOFile` 读取文件头、加载命令、包含节的 `LC_SEGMENT_64`、`LC_SYMTAB`、`LC_BUILD_VERSION`，以及每个节的重定位。
9. `compare_formats()` 用从两个文件中读取的值展示同一概念的对应关系。

## 使用它

在后续课程中，先将本课的 `code` 目录加入 `sys.path`，再通过 `from main import ElfFile` 导入读取器。第 33 课会请求 `function_bytes` 和 `relocations_for(".text")`。第 35 课将其输出记录为观察证据。第 36 课获取重定位偏移，以便在字节比较前屏蔽相应位置。

使用相同的 `clang -target x86_64-unknown-linux-gnu -c` 命令，将自己编写的 C 编译为目标文件，再用读取器分析。只有 x86-64 psABI 表 4.9 列出的重定位名称才可添加；只有 gABI 或生成文件的工具链文档记载的节类型才可添加。遇到没有对应名称的值时，读取器打印十六进制数，而不是猜测。

## 交互实验

### 实验 A：手动读取文件头

在 `code` 目录中启动 Python：

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch/code
python3 -q
```

运行：

```python
import struct
from main import ElfFile, FIXTURES
data = (FIXTURES / "ledger-x86_64-O1.o").read_bytes()
data[:4], data[4], data[5]
struct.unpack_from("<HHIQQQIHHHHHH", data, 16)
elf = ElfFile(data)
elf.header.e_shoff, elf.header.e_shnum, elf.sections[elf.header.e_shstrndx].name
```

该元组显示 `e_type` 为 1、`e_machine` 为 62、`e_shoff` 为 1064，即 `0x428`。最后一行表明第 1 节 `.strtab` 存储节名称。

### 实验 B：switch 背后的值表

```python
rodata = elf.section_bytes(elf.section(".rodata"))
[int.from_bytes(rodata[i : i + 4], "little") for i in range(0x14, 0x28, 4)]
[int.from_bytes(rodata[i : i + 8], "little") for i in range(0x28, 0x50, 8)]
[r for r in elf.relocations_for(".text") if r.symbol == ".rodata"]
```

两张表都读出 `1, 2, 3, 4, 4`。对照 `ledger.c` 检查：`grade(65)` 计算 `65 / 10 - 6 = 0`，读取条目 0，得到 1，即 `case 6` 的值。`grade(100)` 读取条目 4，得到 4，即 `case 10` 与 `case 9` 共用的值。

### 实验 C：同一源码的三种构建

```python
for level in ("O0", "O1", "O2"):
    obj = ElfFile.from_path(FIXTURES / f"ledger-x86_64-{level}.o")
    print(level, [s.name for s in obj.sections if s.name in (".data", ".rodata")])
    print(level, sorted({r.type_name for r in obj.relocations}))
    print(level, {s.name: s.st_size for s in obj.symbols if s.type == "FUNC"})
```

-O0 目标文件有 `.data` 节和三种重定位类型。-O1 与 -O2 目标文件没有 `.data`，且只有一种类型。`total` 在 -O0 下为 66 字节，-O1 下为 31 字节，-O2 下为 140 字节。

### 实验 D：Mach-O 中的同一函数

```python
from main import MachOFile
macho = MachOFile.from_path(FIXTURES / "ledger-arm64-O1.o")
[(c.name, c.cmdsize) for c in macho.load_commands]
macho.function_span("_percent_change")
macho.function_bytes("_percent_change")[:4].hex()
```

函数范围为文件偏移 648 处的 24 字节。前四个字节是 `a0000034`，即指令 `0x340000a0` 的小端形式，`llvm-objdump -d` 将其输出为 `cbz w0, 0x14`。它就是 `before == 0` 的保护检查，与 x86-64 构建中编码为 `85 ff 74 09` 的检查相同。

## 实践实验

扩展读取器，使其支持已链接程序。在 Linux x86-64 机器上，运行 `clang -O1 -shared -fPIC code/fixtures/ledger.c -o libledger.so`，并在添加 `main` 后运行 `clang -O1 code/fixtures/ledger.c -o ledger_main`，然后用读取器分析这两个文件。

要求：

- 用相同的 `Elf64_Sym` 布局读取 `.dynsym`，因为 `SHT_DYNSYM` 为 11，而记录格式不变。
- 将 `.dynamic` 读取为由 `d_tag` 和 `d_val` 组成的 `Elf64_Dyn` 记录，并依据 gABI“Dynamic Section”页面命名 `DT_NEEDED`、`DT_STRTAB`、`DT_SYMTAB`、`DT_RELA` 和 `DT_JMPREL`。
- 将 `st_shndx` 为 `SHN_UNDEF` 的未定义符号列为导入项，将 `.rela.plt` 中的 `R_X86_64_JUMP_SLOT` 记录列为到达它们的调用位置。
- 根据 gABI“一个目标文件段包含一个或多个节”的规则，将每个 `PT_LOAD` 段映射到其包含的节。
- 用 `address_to_file_offset` 证明，共享目标文件中每个已定义函数的字节与 `function_bytes` 的返回值相同。
- 将两个文件的 `llvm-objdump -h -t -r -p` 和 `llvm-objdump -T` 文本采集到 `code/fixtures/`，并在测试中与读取器输出比较。

成功标准：导入列表、段映射和每个函数范围均与采集的工具输出一致，且测试期间不运行工具。

## 本课产物

本课产出 `outputs/skill-program-anatomy-elf-from-scratch.md`。可将其用于 Claude、Cursor、Codex、OpenClaw、Hermes 或任何读取 SKILL.md 的智能体。该技能将用户构建的编译目标文件或可执行文件转化为布局报告，给出每个结构、符号和重定位的文件范围，并对照采集的工具输出验证。

## 验证

运行演示和确定性测试套件：

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

测试套件验证以下事实：

- 三个 x86-64 目标文件及微型可执行文件中，每个节的索引、名称、大小、地址与种类都与采集的 `llvm-objdump -h` 文本一致
- 每个符号的值、绑定、类型、所属节、大小与名称都与采集的 `llvm-objdump -t` 文本一致
- 每个重定位的偏移、类型名称、符号与加数都与采集的 `llvm-objdump -r` 文本一致，包括 -O0 下的 `R_X86_64_PLT32` 和 `R_X86_64_64`
- `tiny-x86_64` 的两个程序头都与采集的 `llvm-objdump -p` 文本一致，而目标文件没有程序头
- `percent_change` 位于文件偏移 `0x40`，长度 16 字节，字节符合预期，且每个函数都位于 `.text` 内
- 文件偏移映射恰好覆盖每个夹具的每个字节一次，且 -O1 目标文件的三个对齐空隙位置正确
- `tiny-x86_64` 的入口点通过 `PT_LOAD` 映射到文件偏移 `0xb0`，而可重定位目标文件拒绝地址映射
- Mach-O 文件头、每条加载命令、段、五个节、`LC_SYMTAB` 和 `LC_BUILD_VERSION` 都与采集的 `--private-headers` 文本一致
- Mach-O 符号与 15 条重定位都与采集的 `llvm-objdump` 文本一致，且 `_percent_change` 位于偏移 648，长度 24 字节
- 错误魔数、32 位类别、大端文件、截断的表、通用二进制文件和 C 源文件都会触发 `FormatError`
- `build_tiny_elf.py` 逐字节复现已提交的 `tiny-x86_64`
- 图示模块 `site/figures-re-32.js` 包含 `ledger-x86_64-O1.o` 的准确字节

## 生产环境中的失败模式

| 失败 | 不严谨的读取会报告什么 | 读取器必须证明什么 |
|---|---|---|
| 将 `st_value` 当成文件偏移 | “`percent_change` 在 0 处” | 偏移为 `sh_offset + st_value - sh_addr`，这里是 `0x40` |
| 将填充计为代码 | “`grade` 有 48 字节” | `st_size` 为 46，之后的 `66 90` 不属于任何符号 |
| 从错误的表读取节名称 | 乱码名称或异常 | `e_shstrndx` 指定名称表，这里是第 1 节 |
| 对 `SHT_NOBITS` 盲目信任 `sh_size` | 读到文件末尾之外 | `.bss` 不占文件字节，映射应跳过它 |
| 将零字节读成操作数 | “`lea 0(%rip)`” | `0x36` 处的 `.rela.text` 记录指定 `.rodata+0x10` |
| 将加数读成目标偏移 | “表从 `0x10` 开始” | `S + A - P` 结合指令末尾得到 `0x14` |
| 对剥离信息的可执行文件遍历节 | “文件没有代码” | `PT_LOAD` 映射加载器使用的每个地址 |
| 将链接地址视为运行时地址 | 随机基址下得到错误偏移 | 从 `PT_LOAD` 得到的文件偏移才是稳定坐标 |
| 只按 `sectname` 查找 Mach-O 节 | 两个 `__const` 节被合并成一个 | 名称应为 `segname,sectname` |
| 期待 `nlist_64` 有大小字段 | 异常或零字节 | 同一节内的下一个符号标记函数终点 |
| 将通用二进制文件当成单一 Mach-O 读取 | “未知魔数 `0xcafebabe`” | 拒绝读取，并要求提供单架构切片 |
| 在另一台 Mac 上重建 arm64 目标文件 | “夹具变了” | `LC_BUILD_VERSION` 记录 SDK，因此已提交的字节才是夹具 |

## 操作准则

读取可信的文件头，沿着其中的偏移定位结构，并依据定义字段的规范为每个字段命名。将用于比较的工具输出提交为夹具，让比较无需运行工具。当规范没有为某个值命名时，就打印数值。能够逐字节核对的读取器，才是后续每节课的可靠基础。

## 延伸阅读

- [System V gABI, 第 4 章：目标文件](https://www.sco.com/developers/gabi/latest/ch4.intro.html) 与 the [ELF Header](https://www.sco.com/developers/gabi/latest/ch4.eheader.html), [Sections](https://www.sco.com/developers/gabi/latest/ch4.sheader.html), [Symbol Table](https://www.sco.com/developers/gabi/latest/ch4.symtab.html), 与 [Relocation](https://www.sco.com/developers/gabi/latest/ch4.reloc.html) 页面
- [System V gABI, 第 5 章：程序头](https://www.sco.com/developers/gabi/latest/ch5.pheader.html) 与 [Dynamic Linking](https://www.sco.com/developers/gabi/latest/ch5.dynamic.html)
- [System V ABI, AMD64 Architecture Processor Supplement](https://gitlab.com/x86-psABIs/x86-64-ABI), 表 4.9：重定位类型
- [Apple XNU `loader.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h), [`nlist.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/nlist.h), 与 [`reloc.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/reloc.h)
- [17 U.S.C. 1201](https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title17-section1201&num=0&edition=prelim) 与 [Directive 2009/24/EC](https://eur-lex.europa.eu/eli/dir/2009/24/oj/eng)
- [Sega v. Accolade, 977 F.2d 1510](https://law.resource.org/pub/us/case/reporter/F2/977/977.F2d.1510.92-15655.html) 与 [Sony v. Connectix, 203 F.3d 596](https://law.resource.org/pub/us/case/reporter/F3/203/203.F3d.596.99-15852.html)
- [rea 6.5.0 `docs/binary-diagnostics.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/binary-diagnostics.md) 与 [`docs/ghidra-provider.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/ghidra-provider.md)
