# 链接、加载与剥离符号后的二进制：PLT、GOT、导入、修正与函数识别

> 链接后的程序会调用自身并不包含的函数。本课读取链接器为这些调用写入三种格式的表，沿着一次调用追踪到加载器填充的槽位，并在构建产物的名称消失后找回其中的函数。

**Type:** Build
**Languages:** Python, C, x86-64 和 arm64 汇编
**Prerequisites:** Phase 13 · 32（从零理解 ELF）、33（反汇编与控制流）、38（调用约定）
**Time:** ~160 分钟

## 学习目标

- 根据重定位记录和符号表，判断链接器将其处理为固定距离、带 GOT 槽位的 PLT 条目，还是动态重定位。
- 读取位置无关 ELF 可执行文件的动态节、PLT 和 GOT，并用 psABI 公式沿着一次调用贯穿这些结构。
- 读取 COFF 目标文件（20 字节文件头、40 字节节表项、18 字节符号记录、10 字节重定位记录）以及 PE32+ 映像的导入、导出和基址重定位目录。
- 逐字解码 Mach-O 链式修正链，并将每个字与 `dyld_info` 对照。
- 说明每种格式中 `strip` 删除什么、保留什么，并运行剥离后的程序证明它仍能工作。
- 用 `LC_FUNCTION_STARTS`、序言扫描和调用目标恢复已剥离 arm64 构建产物的函数起点，对照未剥离副本的符号表给每种方法评分，并用 FLIRT 式签名为函数命名。

## 问题

你将 `main.c` 与 `libledger.dylib` 链接，并询问一个 agent：`main` 在 `0x1000005a0` 调用了哪个函数。agent 反汇编该指令，读到 `bl 0x100000694`。该地址处有十二个字节：`adrp x16`、`ldr x16, [x16, #0x38]`、`br x16`。agent 沿加载操作追踪到 `0x100004038`，读到八个字节 `00 00 00 00 00 00 10 80`，报告说程序通过一个损坏的指针调用了内核空间。

随后，你剥离了同一程序的静态构建产物，并询问其中有多少个函数。agent 运行 `nm`，只看到一个名称 `__mh_execute_header`，于是回答一个。

两个答案都把文件当作正在运行的进程来读。`0x100004038` 处的字是链式修正。第 63 位表示绑定，十二个位表示下一个修正的位置，低位表示要绑定哪个导入。dyld 在 `main` 运行前将该字替换为 `_puts` 的地址。剥离后的文件失去了符号表，却保留了 `LC_FUNCTION_STARTS`，后者用九个字节列出了全部五个函数的起点。

本课用 Python 标准库构建五个读取器：用于我们自己目标文件的 COFF 读取器，以及读取导入、导出和基址重定位目录的 PE32+ 读取器；读取加载命令、桩、间接符号表、链式修正链和导出字典树的 Mach-O 读取器，并与 `dyld_info` 逐字核对；读取动态节、PLT 和 GOT 的 ELF 读取器，加上预测这些目标文件经 PIE 链接会生成什么的规划器；用四种方法查找已剥离构建中函数、并为各方法评分的函数查找器；以及 FLIRT 式签名构建器，将重定位字节设为通配，并计算尾部的 CRC16。

本机只能链接 Mach-O。arm64 可执行文件和 dylib 已完成链接、符号剥离并实际运行。ELF 和 COFF 目标文件在这里用 `clang -target` 编译；由于没有安装 ELF 或 PE 链接器，这两种格式的已链接映像由 fixtures 文件夹中的两个 Python 脚本按规范逐字节写出。`llvm-objdump` 和库探测程序都能读取它们。它们并未运行，正文会在相关之处明确指出这一点。

```figure
re-40-call-through-three-formats
```

## 链接器如何处理重定位

第 32 课读取了重定位记录，第 33 课将 `S + A - P` 应用于一条 `lea`。一条记录指定位置 `P`、类型、符号 `S` 和加数 `A`。x86-64 psABI 表 4.9 为每种类型给出一个公式，其中 `L` 为符号的 PLT 条目位置，`G` 为其 GOT 偏移，`GOT` 为 GOT 地址，`B` 为映像的加载基址。我们的目标文件涵盖三种结果。

链接器将值写入字段，记录随之消失。针对输入中已定义符号的 `R_X86_64_PC32` 属于这种情况。无论加载地址如何，同一映像中两个字节之间的距离都不变。

链接器创建一个 PLT 条目和一个 GOT 槽位。针对未定义函数的 `R_X86_64_PLT32` 属于这种情况。调用处得到 `L + A - P`，即到条目的距离。条目经槽位跳转。`.rela.plt` 中的 `R_X86_64_JUMP_SLOT` 记录通知动态链接器填充该槽位。

链接器为加载器保留一个重定位。`R_X86_64_64` 是八字节绝对地址，而位置无关可执行文件直到加载时才知道自己的地址。记录变为 `.rela.dyn` 中的 `R_X86_64_RELATIVE`，公式为 `B + A`。

`main-x86_64-O1.o` 有 18 条记录：`.text` 中 14 条、`.data.rel.ro` 中 2 条、`.rodata` 中 2 条。`code/main.py` 中的 `plan_dynamic_link()` 将上述三条规则应用于这些记录以及 `ledger-x86_64-O1.o`：

| 记录 | 数量 | 决策 | 原因 |
|---|---|---|---|
| 指向 `.rodata`、`.L.str`、`fns`、`.rodata` 中表的 `R_X86_64_PC32` | 16 | 原地处理 | 符号在输入中已定义 |
| 指向 `percent_change`、`grade`、`total`、`grade_label` 的 `R_X86_64_PLT32` | 4 | 直接调用，不使用 PLT | 在 `ledger-x86_64-O1.o` 中已定义，因此链接器将 PLT32 化简为 PC32 |
| 两次指向 `puts`、两次指向 `printf` 的 `R_X86_64_PLT32` | 4 | PLT 条目和 GOT 槽位 | 未定义，由共享库提供 |
| 指向 `fns[]` 中 `grade` 的 `R_X86_64_64` | 2 | `R_X86_64_RELATIVE` | PIE 中的绝对地址字段 |

两个导入产生 48 字节的 `.plt`（PLT0 加上两个 16 字节条目）、40 字节的 `.got.plt`（三个保留槽位加上两个槽位）和 48 字节的 `.rela.plt`。两个相对重定位记录产生 48 字节的 `.rela.dyn`。这些数字来自将规范应用于我们的记录。手工构建的 `tiny-dyn-x86_64` 针对相同的两个导入实现了此规划中的 PLT 部分，其大小与规划一致。

从 binutils 2.31（H.J. Lu，2018-02-13）和 LLVM 7.0.0（D43383，2018-02-20）开始，编译器对每次调用都写入 `PLT32`，不论目标已定义与否。决定权在链接器。因此，目标文件中的 `PLT32` 只表示“一次调用”，不能说明是否会存在 PLT 条目。其他构建中还会出现两类类型。`R_X86_64_GOTPCRELX` 和 `R_X86_64_REX_GOTPCRELX`（`G + GOT + A - P`）请求不带 PLT 的 GOT 槽位，这是 `-fno-plt` 产生的形式；符号为本地符号时，链接器可能将其松弛为直接的 `lea` 或 `call`（psABI 附录 B）。`R_X86_64_32` 和 `R_X86_64_32S` 无法容纳 PIE 中的地址，会导致链接失败。我们的两个目标文件均未出现这两类情况。

## 动态节、PLT 与 GOT

gABI 第 5 章指出，参与动态链接的可执行文件具有一个 `PT_INTERP` 程序头，它必须位于所有可加载段之前；还具有一个覆盖 `.dynamic` 节的 `PT_DYNAMIC`。该节是 `Elf64_Dyn` 二元组数组，每组包含有符号标签和值，以 `DT_NULL` 结束。

`tiny-dyn-x86_64` 由 `build_tiny_dyn_elf.py` 按 gABI 和 psABI 写出，共 5,184 字节。它的动态节在 `0x1000` 处包含十二个二元组：

| 标签 | 编号 | 值 | 含义 |
|---|---|---|---|
| `DT_NEEDED` | 1 | `libc.so.6` | 字符串表偏移 `0xb`，指定要加载的库 |
| `DT_HASH` | 4 | `0x1a0` | SysV 哈希表 |
| `DT_STRTAB` | 5 | `0x188` | `.dynstr` |
| `DT_SYMTAB` | 6 | `0x140` | `.dynsym`，每条目 24 字节 |
| `DT_STRSZ` | 10 | `0x15` | 21 字节的字符串 |
| `DT_SYMENT` | 11 | `0x18` | 24 |
| `DT_PLTGOT` | 3 | `0x10c0` | `.got.plt` |
| `DT_PLTRELSZ` | 2 | `0x30` | 两条 24 字节记录 |
| `DT_PLTREL` | 20 | 7 | 记录类型为 `DT_RELA` |
| `DT_JMPREL` | 23 | `0x1b8` | `.rela.plt` |
| `DT_FLAGS_1` | `0x6ffffffb` | `0x08000000` | `DF_1_PIE`，GNU 标签 |
| `DT_NULL` | 0 | 0 | 结束 |

gABI 解释了为何将 `DT_JMPREL` 分开：它“保存仅与过程链接表相关的重定位条目的地址。将这些重定位条目分离后，如果启用了延迟绑定，动态链接器就可在进程初始化期间忽略它们”。`DT_FLAGS` 中的 `DF_BIND_NOW`、`DT_FLAGS_1` 中的 `DF_1_NOW` 或环境中的 `LD_BIND_NOW` 会关闭延迟绑定，使动态链接器在启动时处理这些条目。

### PLT0 与 puts 的条目

psABI 第 5.2 节在图 5.2 中给出这两种形态。以下是我们文件中的字节：

```text
     1f0: ff 35 d2 0e 00 00    pushq  0xed2(%rip)      # 0x10c8 = GOT+8
     1f6: ff 25 d4 0e 00 00    jmpq   *0xed4(%rip)     # 0x10d0 = GOT+16
     1fc: 0f 1f 40 00          nopl   (%rax)

     200: ff 25 d2 0e 00 00    jmpq   *0xed2(%rip)     # 0x10d8 = GOT+24, the slot for puts
     206: 68 00 00 00 00       pushq  $0x0             # index 0 into DT_JMPREL
     20b: e9 e0 ff ff ff       jmp    0x1f0            # PLT0
```

亲手计算一次。RIP 相对位移以后一条指令为基准。`0x1f6 + 0xed2 = 0x10c8`，即 `.got.plt + 8`。`0x1fc + 0xed4 = 0x10d0`，即 `.got.plt + 16`。`0x206 + 0xed2 = 0x10d8`，即第四个槽位。`0x210 - 0x20 = 0x1f0`，即 PLT0。每个条目都是 16 字节，因此 `exit` 的条目从 `0x210` 开始，将 `$0x1` 入栈，并读取 `0x10e0`。

GOT 保留三个槽位。psABI 5.2 规定：第零个条目保存 `_DYNAMIC` 的地址，而“全局偏移表中的条目一和二也予以保留”。我们的 `.got.plt` 内容为 `0x1000, 0, 0, 0x206, 0x216`。glibc 加载文件时，将自己的 `struct link_map` 填入槽位一，将 `_dl_runtime_resolve` 填入槽位二。文件中的槽位三保存 `0x206`，即 `puts@plt` 内部的 `pushq`。psABI 指出，该槽位“最初……保存紧随其后的 pushq 指令的地址”。

因此，第一次调用执行 `call 0x200`，`jmpq *0x10d8` 落到 `pushq $0`，`jmp 0x1f0` 使 GOT+8 入栈并经 GOT+16 跳入解析器；解析器读取 `DT_JMPREL` 的第 0 条记录 `R_X86_64_JUMP_SLOT puts`，在 `libc.so.6` 中查找 `puts`，将其地址写入 `0x10d8`，然后跳转过去。第二次调用只需执行 `call`、`jmpq *0x10d8` 就能抵达。Drepper 写道：“因此，除第一次调用外，所有调用的开销‘只有’一次间接跳转。”psABI 关于 `%r11` 的脚注解释了第 38 课中的一个寄存器选择：它是临时寄存器，因此“PLT 中的代码不需要溢出保存任何寄存器”。

`.text` 中 `0x227` 处的调用点字节为 `e8 d4 ff ff ff`，而 `0x22c - 0x2c = 0x200`。`llvm-objdump` 将其打印为 `callq 0x200 <puts@plt>`，并根据 `.rela.plt` 记录为条目命名，`plt_entries()` 也用同样的方法命名。

### 文件中没有什么

该文件没有 `PT_GNU_RELRO`。Jakub Jelinek 于 2004-01-06 在 binutils 邮件列表中提出 RELRO：将只在重定位期间写入的节移到可写段开头，使动态链接器随后能用 `mprotect` 将其设为只读。GNU ld 的默认脚本将 `.init_array`、`.fini_array`、`.data.rel.ro`、`.dynamic` 和 `.got` 放入其中，但对于 `.got.plt`，仅将三个保留槽位共 24 字节放入，因为其余槽位会延迟写入。这就是部分 RELRO。`-z now` 设置 `DF_BIND_NOW`，并将整个 `.got.plt` 放入其中，形成完整 RELRO，因为启动后不再发生写入。glibc 的 `_dl_protect_relro` 对页对齐范围调用 `mprotect(start, end - start, PROT_READ)`。`-fno-plt` 在编译器端更进一步：调用经由 `jmpq *name@GOTPCREL(%rip)`，无法延迟绑定，GCC 手册称“所有外部符号都在加载时解析”。

该文件也没有版本节。真正链接 `libc.so.6` 会添加 `.gnu.version`，每个 `.dynsym` 条目对应一个 `Elfxx_Half`；还会添加 `.gnu.version_r`，其中每个库对应一个 `Verneed`，每个版本名对应一条 `Vernaux` 记录。`printf@GLIBC_2.2.5` 意味着：`printf` 在 `.gnu.version` 中的条目保存一个索引；`vna_other` 等于该索引的 `Vernaux` 的 `vna_name` 为“GLIBC_2.2.5”，归属于 `vn_file` 为“libc.so.6”的 `Verneed`。索引 0 表示本地，1 表示全局，第 15 位（`VERSYM_HIDDEN`、`0x8000`）让链接器看不到某个版本。

哈希表是 SysV `DT_HASH`，包含一个桶和一条三项链，共 24 字节。动态链接器需要 `DT_HASH` 或 `DT_GNU_HASH` 来查找文件中的符号。此文件不导出任何内容，也没有在这里运行，因此尚未验证 glibc 是否接受单桶表。

### .dynsym、.symtab 与 strip

gABI 将 `.dynsym` 和 `.dynstr` 规定为分配内存的节，将 `.symtab` 和 `.strtab` 规定为不分配内存的节。动态链接器读取前一对，从不读取后一对。Drepper 说：“普通符号表不在运行时使用，因此没有必要从二进制中剥离它。它对性能没有影响。”

GNU `strip --strip-all` 删除 `.symtab`、`.strtab`、`.debug_*` 和 `.comment`。所有分配内存的节都会保留：`.interp`、`.dynsym`、`.dynstr`、`.gnu.hash`、`.gnu.version*`、`.rela.dyn`、`.rela.plt`、`.plt`、`.text`、`.rodata`、`.eh_frame`、`.init_array`、`.dynamic`、`.got`、`.got.plt`、`.data`、`.bss` 以及 note。节头会保留，除非添加 `--strip-section-headers`（binutils 2.41）或运行 `llvm-strip --strip-sections`。`--strip-debug` 保留符号。`--only-keep-debug` 写出调试文件，随后可用 `--add-gnu-debuglink` 在剥离后的文件中引用它，并在 `.gnu_debuglink` 中保存 CRC32；`ld --build-id` 写入 `.note.gnu.build-id`，便于调试器匹配二者。

## COFF 目标文件

`clang -target x86_64-pc-windows-msvc -O1 -fno-asynchronous-unwind-tables -c` 生成了 `main-x86_64.obj` 和 `ledger-x86_64.obj`。PE Format 页面定义了这种目标文件：20 字节文件头，没有可选头，节表每项 40 字节，符号表每条记录 18 字节，每个节的重定位记录为 10 字节。

`code/main.py` 中的 `CoffObject` 读取这四部分。文件头给出机器类型 `0x8664`、10 个节、37 条符号记录，以及为 0 的 `SizeOfOptionalHeader`。节表列出 `.text`、`.data`、`.bss`、六个名为 `.rdata` 的节和 `/16`。以 `/` 开头的名称是字符串表中的十进制偏移，字符串表以自身的四字节大小字段开头；`/16` 解析为 `.llvm_addrsig`，也就是 `llvm-objdump -h` 打印的名称。

37 条记录包含辅助记录。节符号（存储类别 3）带有一条辅助记录，保存节长度、重定位数量、校验和及 COMDAT 选择策略。五个 `.rdata` 节的选择值为 2，即“any”，每个都以 MSVC 修饰后的名称保存一个字符串字面量：`??_C@_04JDDJEAHN@even?$AA@` 就是字符串“even”。链接器各保留一个副本。最后一条记录是 `.file`，辅助记录为“main.c”。`llvm-objdump -t` 将它们打印为 `[ 0]`、`AUX scnlen ...`、`[ 2]` 等，跳过辅助记录索引；测试会将我们的索引与名称对同该文本比较。

重定位包括：`.text` 中 14 条 `IMAGE_REL_AMD64_REL32`，以及 `.rdata` 中 4 条 `IMAGE_REL_AMD64_ADDR64`。`REL32` 是“相对于重定位之后那个字节的 32 位地址”。这相当于内置了 `-4` 的 `R_X86_64_PC32`：ELF 记录携带加数 `-4`，因为记录有加数字段，而 COFF 记录没有。`ledger-x86_64.obj` 在 `0x36`、`0x84` 和 `0x93` 有三条 `REL32`，第 32 课的 `ledger-x86_64-O1.o` 的三条 `R_X86_64_PC32` 也在同样的三个偏移处。代码相同，格式的差异只在于这个四写在哪里。`ADDR64` 是八字节绝对地址，对应字符串指针表 `labels`，在映像中变为基址重定位，就像 `R_X86_64_64` 变为 `R_X86_64_RELATIVE` 一样。

| | ELF `Elf64_Rela` | COFF 重定位 | Mach-O `relocation_info` |
|---|---|---|---|
| 记录大小 | 24 字节 | 10 字节 | 8 字节 |
| 字段 | 偏移、`r_info` 中的类型与符号、加数 | 偏移、符号索引、类型 | 地址，随后为含 symbolnum:24、pcrel:1、length:2、extern:1、type:4 的 32 位字 |
| 加数 | 显式给出 | 无，存于被修正字段内 | 无，或在真正记录之前有一条 `ARM64_RELOC_ADDEND` 记录 |
| 对 `puts` 的调用 | `R_X86_64_PLT32 puts-0x4` | `IMAGE_REL_AMD64_REL32 puts` | `ARM64_RELOC_BRANCH26 _puts` |

## PE 映像：导入、导出与基址重定位

`tiny-x86_64.exe` 由 `build_tiny_pe.py` 写出，共 2,560 字节。它与微型 ELF 的任务相同：调用 `msvcrt.dll` 中的 `puts` 和 `exit`。它还导出一个名称，并携带一条基址重定位，因此本课需要的三个目录齐全。`pefile` 2024.8.26 和 `llvm-objdump -p` 都能读取它，两者的捕获输出都是测试夹具。

逐步浏览头部。MS-DOS 桩以 `MZ` 开头，在偏移 `0x3c` 处保存 `e_lfanew`，值为 `0x40`。`0x40` 处是签名 `PE\0\0`。随后是 COFF 文件头：机器类型 `0x8664`、4 个节、`SizeOfOptionalHeader` 为 240、特征值 `0x22`（可执行映像、支持大地址）。可选头以 `Magic` 字段开头，值为 `0x20b`，表示 PE32+。`AddressOfEntryPoint` 为 `0x1000`，`ImageBase` 为 `0x140000000`，`SectionAlignment` 为 `0x1000`，`FileAlignment` 为 `0x200`，`SizeOfImage` 为 `0x5000`，`Subsystem` 为 3（控制台）。`DllCharacteristics` 的 `0x8160` 解码为 `HIGH_ENTROPY_VA 0x0020`、`DYNAMIC_BASE 0x0040`、`NX_COMPAT 0x0100` 和 `TERMINAL_SERVER_AWARE 0x8000`。随后是 16 个由 RVA 和大小组成的数据目录。其中四个已设置：导出目录位于 `0x2080`、大小 `0x4d`，导入目录位于 `0x2000`、大小 `0x28`，基址重定位目录位于 `0x4000`、大小 `0xc`，IAT 位于 `0x2040`、大小 `0x18`。

映像中的地址是 RVA，即相对于加载基址的偏移。节表将其映射为文件偏移：`.text` 的 RVA 为 `0x1000`，位于文件 `0x200`；`.rdata` 的 RVA 为 `0x2000`，位于 `0x400`；`.data` 的 RVA 为 `0x3000`，位于 `0x600`；`.reloc` 的 RVA 为 `0x4000`，位于 `0x800`。`PeImage.rva_to_offset()` 实现的就是此表。

### 导入目录

RVA `0x2000` 处是由 20 字节导入描述符组成、以全零描述符终止的数组。我们的数组只有一项：导入查找表 `0x2028`、时间戳 0、转发链 0、名称 `0x2068`、导入地址表 `0x2040`。名称 RVA 指向“msvcrt.dll”。查找表保存 64 位条目，以零结束。第 63 位置位表示按序号导入，序号位于第 15 至 0 位。第 63 位清零表示第 30 至 0 位是 hint/name 条目的 RVA：先是 16 位提示值，即“导出名称指针表中的索引”，然后是 ASCII 名称。我们的条目为 `0x2058`（提示值 0，“puts”）和 `0x2060`（提示值 0，“exit”）。

规范指出，IAT “在映像绑定之前，与导入查找表的内容完全相同”。我们位于 `0x2040` 的 IAT 保存同样的两个 RVA，测试验证 `0x2028` 处的 24 字节等于 `0x2040` 处的 24 字节。“绑定期间，导入地址表的条目会被导入符号的 32 位（PE32）或 64 位（PE32+）地址覆盖。”Windows 加载器在入口点运行前完成此事。这里没有延迟绑定，也没有桩。代码直接访问槽位：

```text
    100b: ff 15 2f 10 00 00    call qword ptr [rip + 0x102f]   # 0x1011 + 0x102f = 0x2040, the IAT slot of puts
    1013: ff 15 2f 10 00 00    call qword ptr [rip + 0x102f]   # 0x1019 + 0x102f = 0x2048, the IAT slot of exit
```

`FF /2` 是间接近调用。这两条指令的字节相同，因为后者位于前者之后八字节，读取的槽位也位于前一槽位之后八字节。`iat_calls()` 在代码节中扫描 `ff 15`，加上六和位移，再依据导入目录为槽位命名。

### 导出目录

RVA `0x2080` 处是 40 字节导出目录表：标志、时间戳、版本、指向“tiny-x86_64.exe”的名称 RVA、序号基数 1、1 个地址表条目、1 个名称指针。随后有三张表。`0x20a8` 处的导出地址表保存一个 RVA `0x1000`。`0x20ac` 处的导出名称指针表保存一个指向字符串“tiny_entry”的 RVA。`0x20b0` 处的导出序号表保存一个 16 位未加基数的索引 0。名称 `k` 映射到地址条目 `ordinals[k]`，导出序号为 `ordinals[k] + ordinal base`。规范还补充了一条我们没有用到的规则：若地址条目指向导出节内部，它就是一个转发字符串，例如 `MYDLL.expfunc`；名称指针表则“按字典序排列，以支持二分查找”。

### 基址重定位

`.reloc` 保存多个块。每块以页面 RVA 和块大小开头，随后是 16 位条目，高四位为类型，低十二位为页内偏移。我们的唯一块包含：页面 `0x3000`、大小 12、条目 `0xa000`、类型 10，即 `IMAGE_REL_BASED_DIR64`、偏移 0，以及一个类型 0 的填充条目 `IMAGE_REL_BASED_ABSOLUTE`。RVA `0x3000` 处的八字节保存 `0x1400020d0`，即映像基址加上字符串“linked by hand”的 RVA。如果加载器将映像放到其他位置，它就把基址差值加到该字段。规范说明：“映像文件不包含 COFF 重定位……映像以 .reloc 节中的基址重定位形式包含重定位信息（除非映像具有 IMAGE_FILE_RELOCS_STRIPPED 属性）。”当前 link.exe 默认开启 `/DYNAMICBASE`，因此映像带有 `.reloc` 和 `DYNAMIC_BASE`。

PE 映像没有可供剥离的符号表。文件头的 `PointerToSymbolTable` “对于映像应为零，因为 COFF 调试信息已弃用”，名称存于单独的 PDB 中。每个映像都会保留导入目录、导出目录；对于 64 位代码，还会保留 `.pdata`，其中的 `RUNTIME_FUNCTION` 条目指出每个分配栈空间或调用其他函数的函数的起止地址。叶函数不在表中。

## Mach-O 映像：加载命令、桩与间接符号表

`ledger_main` 是链接后的 arm64 可执行文件。`otool -h` 打印 19 条加载命令和标志 `0x00200085`。`MH_NOUNDEFS 0x1`、`MH_DYLDLINK 0x4`、`MH_TWOLEVEL 0x80` 和 `MH_PIE 0x200000` 相加即得到该值。19 条命令包括四条 `LC_SEGMENT_64`（`__PAGEZERO`、`__TEXT`、`__DATA_CONST`、`__LINKEDIT`），两条 `LC_LOAD_DYLIB`（先 `@rpath/libledger.dylib`，后 `/usr/lib/libSystem.B.dylib`），以及各一条 `LC_DYLD_CHAINED_FIXUPS`、`LC_DYLD_EXPORTS_TRIE`、`LC_SYMTAB`、`LC_DYSYMTAB`、`LC_LOAD_DYLINKER`、`LC_UUID`、`LC_BUILD_VERSION`、`LC_SOURCE_VERSION`、`LC_MAIN`、`LC_RPATH`、`LC_FUNCTION_STARTS`、`LC_DATA_IN_CODE` 和 `LC_CODE_SIGNATURE`。`MachoFile.command_names()` 返回与 `otool -l` 相同且顺序一致的列表。

`__TEXT` 从 `0x100000000` 开始。`__text` 位于 `0x100000558`，长 256 字节，只有 `main`，因为四个 ledger 函数位于 dylib 中。`__stubs` 位于 `0x100000658`，长 84 字节，包含七个十二字节桩。`__DATA_CONST` 从 `0x100004000` 开始，包含长 64 字节的 `__got`，其中有八个指针槽位、节类型为 `S_NON_LAZY_SYMBOL_POINTERS`；还包含长 32 字节的 `__const`，即 `main.c` 的 `fns[]` 和 `names[]` 表。

### 手工解析一个桩

`_puts` 的桩位于 `0x100000694`：

```text
    30 00 00 90    adrp x16, 0x100004000
    10 1e 40 f9    ldr  x16, [x16, #0x38]
    00 02 1f d6    br   x16
```

`0x90000030` 是 `adrp`。寄存器编号在低五位，值为 16。`immlo` 在第 30 至 29 位，值为 0。`immhi` 在第 23 至 5 位，值为 1。结果为 `immhi << 2 | immlo = 4`，单位是 4,096 字节的页，因此目标页是指令所在页 `0x100000000` 加上 `0x4000`。`0xf9401e10` 是 `ldr`，带有按 8 缩放的无符号 12 位偏移：第 21 至 10 位为 7，乘 8 为 `0x38`，因此加载读取 `0x100004038`。`0xd61f0200` 是 `br x16`。ld64 源码中的 arm64 桩正是这个三指令 `StubAtom`。

槽位属于哪个名称，由间接符号表决定。`LC_DYSYMTAB` 指向 15 个符号表索引。桩节用 `reserved1` 指出自己那段索引的起点，用 `reserved2` 指出每个桩的大小（12）。指针节使用 `reserved1`，每个槽位为八字节。`__stubs` 从索引 0 开始，`__got` 从索引 7 开始，因此桩 5 映射到符号表条目 10，即 `_puts`，`__got` 的槽位 7 也映射到同一条目。`otool -Iv` 打印这两段索引，`indirect_table()` 复现其中每一行。

### 两级命名空间

`nm -m` 打印 `(undefined) external _puts (from libSystem)` 和 `(undefined) external _grade (from libledger)`。库的信息来自符号记录本身。`nlist.h` 将 `GET_LIBRARY_ORDINAL(n_desc)` 定义为 `n_desc` 的第 15 至 8 位：1 对应第一条 `LC_LOAD_DYLIB`，2 对应第二条，`0xfe` 表示动态查找，`0xff` 表示可执行文件。`ld(1)` 说明：“使用 -two_levelnamespace（默认选项）时，链接器仅在命令行指定的 dylib 中查找符号，并记录它们在哪个 dylib 中找到。”`nm_lines()` 根据 `n_type`、`n_sect`、`n_desc` 和 `n_value` 渲染十二条记录，测试将其输出与捕获的 `nm -m` 逐行比较。用 `-Wl,-flat_namespace` 重新链接，再读取 `otool -h`，即可看到 `MH_TWOLEVEL` 位消失。

## 逐字节理解链式修正

`LC_DYLD_CHAINED_FIXUPS` 是一条 `linkedit_data_command`：`dataoff 0x8000`、`datasize 208`。这 208 字节遵循 `fixup-chains.h`。

头部有七个 32 位字段：`fixups_version 0`、`starts_offset 32`、`imports_offset 80`、`symbols_offset 112`、`imports_count 8`、`imports_format 1`（`DYLD_CHAINED_IMPORT`）、`symbols_format 0`（未压缩）。`llvm-objdump --macho --chained-fixups` 打印这七个值，测试对它们进行比较。

偏移 32 处是 `dyld_chained_starts_in_image`：`seg_count 4` 和四个偏移，每个段一个，没有修正的段取零。只有 `__DATA_CONST` 有修正。其 `dyld_chained_starts_in_segment` 内容为 `size 24`、`page_size 0x4000`、`pointer_format 6`（`DYLD_CHAINED_PTR_64_OFFSET`，“目标是虚拟内存偏移”）、`segment_offset 0x4000`、`max_valid_pointer 0`、`page_count 1`，以及一个为 0 的 `page_start`。`DYLD_CHAINED_PTR_START_NONE`，即 `0xffff`，表示该页没有修正。

链从文件偏移 `0x4000 + 0` 开始。每个 64 位字携带两项信息：应在此写入什么，以及下一个字在哪里。

```text
  dyld_chained_ptr_64_bind    ordinal:24  addend:8  reserved:19  next:12  bind:1 = 1
  dyld_chained_ptr_64_rebase  target:36   high8:8   reserved:7   next:12  bind:1 = 0
```

读取第一个字 `0x8010000000000000`。第 63 位置位，表示绑定。`next` 位于第 62 至 51 位，值为 `0x002`，单位为 4 字节，因此下一个修正在八字节之后。序号为 0。读取 `0x4058` 处的第十二个字 `0x00000000000006db`。第 63 位清零，表示重设基址。`next` 为 0，表示链结束。目标为 `0x6db`，这是虚拟内存偏移，加上映像基址 `0x100000000` 后成为 `0x1000006db`，即 `__cstring` 中的字符串“odd”。前一个字 `0x00100000000006d6` 则将 `names[0]` 重设基址后指向“even”。

遍历访问十二个字：`__got` 中序号为 0 到 7 的八次绑定，`__const` 中序号为 0 的两次绑定（`fns[]` 的两个条目都指向 `_grade`），以及 `names[]` 的两次基址重设。`chained_fixups()` 返回它们及其文件偏移和原始字，测试将十二对 `(offset, raw)` 与 `dyld_info -fixup_chain_details` 比较，后者对第一项打印 `raw: 0x8010000000000000 bind: (next: 002, bindOrdinal: 0x000000)`。

偏移 80 处的导入表有八个 32 位条目：`lib_ordinal:8`、`weak_import:1`、`name_offset:23`，名称位于偏移 112。序号 0 到 3 是来自库 1 的 `_grade`、`_grade_label`、`_percent_change`、`_total`，序号 4 到 7 是来自库 2 的 `___stack_chk_fail`、`___stack_chk_guard`、`_printf`、`_puts`。`fixup_rows()` 连接两张表，生成 `dyld_info -fixups` 打印的行，例如 `__DATA_CONST __got 0x100004038 bind libSystem/_puts`；测试比较全部十二行。

因此，`0x100004038` 处的“损坏指针”其实是导入 7。dyld 在加载时遍历此链一次，并将 `_puts` 的地址写入槽位。Apple 在 WWDC22 演讲中这样解释：“在 DATA 中的 64 位指针位置，有些位包含到下一个修正位置的偏移。其中还打包了一个位，用来说明该修正是绑定还是基址重设。”Xcode 13 将该格式设为部署目标 macOS 12 或 iOS 15 的默认格式，Xcode 13.3 又扩展到 macOS 11 和 iOS 13.4。该格式没有延迟绑定。所有槽位都在 `main` 运行前完成绑定。

### 它替代的布局

`ledger_main_nochain` 使用相同链接过程，但添加 `-Wl,-no_fixup_chains`。它改用 `LC_DYLD_INFO_ONLY`，包含四张字节编码表：基址重设 8 字节、绑定 72 字节、延迟绑定 120 字节、导出 64 字节。它还有链式文件中不存在的三个节：`__TEXT,__stub_helper`（108 字节）、仅 16 字节且保存 `___stack_chk_guard` 与 `dyld_stub_binder` 的 `__got`，以及 `__DATA,__la_symbol_ptr`（56 字节，七个槽位）。`dyld_info -fixups` 列出七行 `lazy-bind` 和七条基址重设，每条都将一个延迟槽位指向它在 `__stub_helper` 中自己的跳板。跳板将索引入栈并跳到 `dyld_stub_binder`，后者解析名称并写入槽位。这就是前文 PLT 和 GOT 的 Mach-O 形态：`__la_symbol_ptr` 对应 `.got.plt`，`__stub_helper` 对应 PLT0 和 `pushq $index`，`dyld_stub_binder` 对应 `_dl_runtime_resolve`。`code/main.py` 报告该文件的偏移和节，但不解码绑定操作码；实践实验要求完成这部分。

### 导出字典树

`LC_DYLD_EXPORTS_TRIE` 是一棵前缀树。每个节点先是 uleb128 编码的终端数据大小；若非零，接着是 uleb128 标志和 uleb128 偏移；然后是一个字节的子节点数量；每个子节点包含一条字符串边和一个 uleb128 节点偏移。`exports_trie()` 遍历这棵树。对于 `libledger.dylib`，它返回 `_percent_change 0x410`、`_grade 0x428`、`_total 0x464`、`_grade_label 0x498`，即 `dyld_info -exports` 打印的四个偏移。对于可执行文件，它返回 `__mh_execute_header`、`_fns` 和 `_main`。

## strip 留下什么

Apple 的 `strip(1)` 说明，对动态链接可执行文件不带选项运行时，其行为相当于 `-u -r`：保留未定义符号和动态引用的符号。`-x` 删除本地符号。`-N` 删除整个符号表和字符串表。“对于动态共享库，最大剥离级别通常是 -x”，因为“动态链接过程只使用全局符号”。

我们在测试夹具中观察到：`strip ledger_main` 将 `LC_SYMTAB` 从 12 条减为 10 条，并删除 `_main`、`_fns` 和 `_names`。八个未定义导入保留下来，因为 dyld 需要它们的名称来绑定；`__mh_execute_header` 也保留，因为它是 `REFERENCED_DYNAMICALLY`。第十条记录是一个类型为 `N_OPT`、名为 `radr://5614542` 的 stab，Apple 工具写入它来保证表永不为空；`nm` 不打印它。剥离后的程序打印与原版相同的三行，并以 0 退出。`LC_FUNCTION_STARTS` 仍有一个起点，即 `main`。

不带选项的 `strip libledger.dylib` 比手册中通常的 `-x` 更彻底：`LC_SYMTAB` 有 0 条记录，`nm` 打印“no symbols”。导出字典树仍在相同偏移处列出四个函数，因为 dyld 通过字典树绑定，从不通过 `LC_SYMTAB`。`LC_FUNCTION_STARTS` 仍列出四个起点。实验 C 将一个新的 `main.c` 与剥离后的 dylib 链接，以表明链接器也依赖这棵字典树。

| 内容 | ELF 在 `--strip-all` 后 | PE 映像 | Mach-O 在 `strip` 后 |
|---|---|---|---|
| 静态符号表 | 删除 | 映像中从不存在 | 本地名称与已定义名称被删除，未定义导入保留 |
| 加载器绑定的名称 | `.dynsym` 和 `.dynstr` 保留 | 导入目录保留 | 导入保留在 `LC_SYMTAB` 和链式导入表中 |
| 导出的名称 | `.dynsym` 保留 | 导出目录保留 | 导出字典树保留 |
| 函数起点 | `.eh_frame` 的 FDE，除非构建时禁用了展开表 | 非叶函数的 `.pdata` | `LC_FUNCTION_STARTS` 保留 |
| 调试信息 | `.debug_*` 删除 | 位于 PDB，从不在映像中 | 位于 dSYM，从不在映像中 |
| 节头或加载命令头 | 除非使用 `--strip-section-headers`，否则保留 | 保留 | 保留 |

## 没有符号时查找函数

`static-arm64-O2` 将 `main-arm64-O2.o` 与 `ledger-arm64-O2.o` 链接为一个可执行文件，`__text` 中有五个函数。未剥离文件的 `nm -n` 是真实基准：`_main` 位于 `0x100000500`（244 字节），`_percent_change` 位于 `0x1000005f4`（24），`_grade` 位于 `0x10000060c`（60），`_total` 位于 `0x100000648`（248），`_grade_label` 位于 `0x100000740`（72）。`static-arm64-O2.stripped` 的 `__text` 中没有 `N_SECT` 符号。`FunctionFinder` 在其上运行四种方法，`score()` 将每个列表与真实基准比较。

### LC_FUNCTION_STARTS

该命令指向 `__LINKEDIT` 中的九个字节：`80 0a f4 01 18 3c f8 01 00`。格式是 uleb128 增量，第一个以 `__TEXT` 地址为基准。`80 0a` 为 `0x500`，因此第一个起点是 `0x100000500`。`f4 01` 为 `0xf4`，得到 `0x1000005f4`。`18` 得到 `0x10000060c`，`3c` 得到 `0x100000648`，`f8 01` 得到 `0x100000740`，`00` 结束列表。在 `-O0` 和 `-O2` 下都是五个全部找出，且无误报。链接器为栈展开器和崩溃报告器写入此表，`strip` 不会改动它。Ghidra 在“Mach-O Function Starts”分析器中读取它，`dyld_info -function_starts` 打印它，LIEF 将它暴露为 `function_starts`。

### 序言扫描

Ghidra 的 AARCH64 起点模式以 `fd 7b bf a9` 开始，即 `stp x29, x30, [sp, #-0x10]!`。在我们的文件中，它在两个优化级别都只找到 0/5。clang 先生成 `sub sp, sp, #N`，再生成正偏移的 `stp x29, x30, [sp, #M]`，因此从未出现前索引形式。对 `sub sp, sp, #imm` 使用掩码 `(word & 0xff0003ff) == 0xd10003ff`，在每个函数都有栈帧的 `-O0` 下能找到 5/5，而在 `-O2` 下只找到 1/5，因为 `percent_change`、`grade`、`total` 和 `grade_label` 都是完全没有栈帧的叶函数。`percent_change` 以 `cbz w0, ...` 开始。序言扫描反映的是编译器选择生成的内容，第 38 课已经展示过，很多时候编译器根本不生成序言。

这里两种扫描都没有误报，因为程序很小。诸如 x86-64 的 `push rbp` 所对应的 `55` 这类单字节模式，会命中其他指令的内部；因此 Ghidra 的 x86-64 模式文件会把 `55 48 89 e5` 这样的后置模式与 `ret` 或 `nop` 这样的前置模式配对，要求前置模式结束前一个函数。

### 调用目标

`__text` 中的每个 `bl` 都指向函数起点，因为编译器不会为 C 代码生成跳入函数中间的 `bl`。编码为 `0x94000000`，带有有符号 26 位字偏移。`0x1000005a0` 处的 `bl` 字节为 `3d 00 00 94`：`0x3d` 是 61，乘 4 是 `0xf4`，因此目标为 `0x100000694`。在 `ledger_main` 中，这是 `_puts` 的桩。在静态构建中，`call_targets()` 收集 `__text` 内部的目标，丢弃落入 `__stubs` 的目标，并加入 `LC_MAIN` 入口，因为没有任何函数调用 `main`。两个优化级别都找到了 5/5。Nucleus（Andriesse、Slowinska、Bos，2017）基于这一思路检测编译器生成代码中的函数；Andriesse 等人在 2016 年的测量表明，函数边界是反汇编的难点，比指令边界更难。

## FLIRT 式签名

Hex-Rays 在文档中这样描述 FLIRT：模式是“函数的前 32 个字节，其中所有可变字节都被标记”，可变字节来自修正和外部引用，模式存于树中；在模式之后，“我们从位置 33 开始计算字节的 CRC16，直到遇到第一个可变字节”，并保存该长度。模式和 CRC 相同的两个函数，通过尾部某个不同位置的字节来区分，再通过它们引用的名称区分。若任何信息都无法区分冲突，则“由人类智慧解决”。长度不足四字节且没有外部引用的函数被排除，而且“除了函数名称，签名文件不包含原始库中的任何字节”。

`signatures_from_object()` 从 `ledger-arm64-O2.o` 和 `main-arm64-O2.o` 构建这类签名，就像 FLAIR 从库的目标文件构建签名一样。每条 `relocation_info` 记录覆盖一个四字节字，这些字节成为可变字节。rizin 解析器记录的 `.pat` 行布局依次为：模式、CRC 长度、CRC16、函数长度、`:0000` 和名称，以及每个引用名称对应的 `^offset name`：

```text
A00000342800004B890C8052087D091B000DC01AC0035FD6 00 0000 0018 :0000 _percent_change
E8CC8C52C8CCAC72087C289B09FD7FD308FD62930801090B081900511F110071 04 9AAF 003C :0000 _grade ^0000 l_switch.table.grade ^0001 l_switch.table.grade
E8CC8C52C8CCAC72087C289B09FD7FD308FD62930801090B081900511F110071 04 9AAF 0048 :0000 _grade_label ^0000 l_switch.table.grade_label ^0001 l_switch.table.grade_label ^0002 _labels ^0003 _labels
```

`_percent_change` 长 24 字节，因此模式就是整个函数，CRC 长度为 0。`_grade` 长 60 字节，第一个重定位在字节 36，因此 CRC 覆盖四个字节。CRC16 使用公开 `.pat` 解析器中的算法：多项式 `0x8408`，初值 `0xffff`，取反，再交换两个字节。ASCII 字符串“123456789”的结果为 `0x6e90`，测试将此值固定下来。

`match_signatures()` 在已剥离构建的每个函数起点尝试每个签名，先匹配模式，再匹配 CRC。在 `-O0` 下，五个函数都恢复名称，没有冲突。在 `-O2` 下，上面两行发生冲突。`grade_label` 内联了 `grade`，因此两个函数共享前 36 个字节以及那四个 CRC 字节。两个签名在 `0x10000060c` 和 `0x100000740` 都匹配。尾部将它们区分开：字节 44 处，`_grade` 是 `20`，`_grade_label` 是 `28`，分别对应 `ldr w0, [x9, w8, uxtw #2]` 与 `ldr x8, [x9, w8, uxtw #3]`，长度分别为 60 和 72。报告记录两次冲突和作出判定的字节。两个优化级别下都成功命名 5/5。

测试 `test_object_bytes_equal_linked_bytes_outside_relocated_words` 检查这一前提：每个目标文件函数的所有非可变字节，都等于已链接可执行文件相同偏移处的字节，因此链接器只修改了重定位的字。`_total` 没有重定位，也完全没有可变字节。

### 工具如何运用同样的思路

IDA Pro 9.4 随附各处理器的 FLIRT 签名，以及用于构建签名的 `sigmake` 工具；IDA Free 仅支持 x86 和 x86-64，限非商业使用。Lumina 是一个以函数 md5 为键存储函数元数据的服务器，会跳过不足 32 字节的函数。Ghidra 12.1.4（Apache-2.0）具有 Function ID：对助记符和寻址模式计算完整哈希，使其“能抵抗链接引起的变化”；另有加入常量操作数的特定哈希，按匹配指令评分，用父子函数打破平局；其随附数据库只覆盖 Visual Studio 库，你可从自己的二进制填充自建数据库。Binary Ninja 6.0 Krypton（商业版，另有 Free 版）使用 WARP（Apache-2.0）：函数 GUID 是对基本块 GUID 计算的 UUIDv5，每个基本块 GUID 又是在清零“所有可重定位指令”并删除 NOP 后，对块字节计算的 UUIDv5，并以被调用函数、调用者和相邻函数为约束。BinDiff 8（Apache-2.0）按固定步骤顺序匹配两个二进制中的函数，从哈希匹配，到流图 MD 索引，再到调用序列匹配；它根据匹配的边、块、指令和流图 MD 索引加权计算相似度。Diaphora 3.4.3（AGPL-3.0，仅适用于 IDA）加入小素数乘积：将每个助记符映射为素数，以乘积表示函数，形成与顺序无关的多重集指纹。radare2 6.2.4（LGPL-3.0）具有 zignatures（`zg`、`z/`、`zb`），并用 `zfs` 读取 FLIRT `.sig` 文件；rizin 0.9.1（LGPL-3.0）用 `Fc` 从打开的二进制创建 `.pat` 或 `.sig`，用 `Fs` 应用签名。

IDA 和 Binary Ninja 为闭源工具，这里的介绍依据其文档。本机未安装 radare2 和 rizin，其命令引用自各自手册和源码。实际在这些夹具上运行的工具包括 Command Line Tools 中的 `clang`、`ld`、`llvm-objdump`、`otool`、`nm`、`strip` 和 `dyld_info`，以及通过探测程序运行的 LIEF 1.0.0、pyelftools 0.33 和 pefile 2024.8.26。LIEF 读取了这里的所有格式，包括自 0.17.0 起支持的 COFF 目标文件；它对 `ledger_main` 报告十次绑定和两次基址重设，即同样的十二次修正。pyelftools 只读取 ELF 文件。pefile 以 `PEFormatError: 'DOS Header magic not found.'` 拒绝了 `main-x86_64.obj`，但成功读取微型映像。

## 亲手构建

运行演示：

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries
python3 code/main.py
```

输出是一份包含五部分的 JSON 报告。`elf` 保存两个目标文件的重定位数量、链接规划，以及 `tiny-dyn-x86_64` 的动态节、PLT 和 GOT。`coff` 保存两个目标文件的节、重定位、函数和未定义名称。`pe` 保存 `tiny-x86_64.exe` 的头部、目录、导入、导出、基址重定位和 IAT 调用。`macho` 保存 `ledger_main` 的桩、链式修正、修正行和导出，`ledger_main_nochain` 的旧布局，dylib，以及两份剥离报告。`identification` 保存 `-O0` 和 `-O2` 下的真实基准、带评分的四种方法，以及签名和冲突。

预期结构：

```json
{
  "elf": {"linkPlan": {"pltSymbols": ["puts", "printf"], "sizes": {".plt": 48, ".got.plt": 40, ".rela.plt": 48, ".rela.dyn": 48}, "...": "..."}, "tiny-dyn-x86_64": {"...": "..."}},
  "coff": {"main-x86_64.obj": {"...": "..."}},
  "pe": {"imports": [{"dll": "msvcrt.dll", "iat": "0x2040", "...": "..."}], "...": "..."},
  "macho": {"ledger_main": {"flags": "0x200085", "fixupRows": ["__DATA_CONST __got 0x100004000 bind libledger/_grade", "..."], "...": "..."}, "strip": {"...": "..."}},
  "identification": {"O2": {"methods": {"functionStarts": {"recall": "5/5"}, "prologueSub": {"recall": "1/5"}, "...": "..."}, "correctNames": 5}}
}
```

按以下顺序阅读 `code/main.py`：

1. `ElfFile` 读取头部、节、两张符号表和重定位，`dynamic_entries()`、`jump_slots()`、`plt_entries()` 和 `plt0()` 读取已链接映像。
2. `plan_dynamic_link()` 将表 4.9 和第 5.2 节应用于可重定位目标文件的重定位记录。
3. `CoffObject` 读取文件头、节表、带辅助记录的 18 字节符号记录，以及 10 字节重定位记录。
4. `PeImage` 读取 MS-DOS 桩、PE 签名、可选头、数据目录、节，以及导入、导出和基址重定位目录，`iat_calls()` 解码 `ff 15`。
5. `MachoFile` 读取加载命令、段、`nlist` 记录、间接符号表、桩、链式修正、导出字典树和目标文件重定位。
6. `FunctionFinder` 运行四种起点查找器，`score()` 将每种结果与真实基准比较。
7. `signatures_from_object()` 和 `match_signatures()` 构建并应用 FLIRT 式签名。
8. `parse_*` 函数读取捕获的工具文本，供测试对照。

更多命令：`python3 code/main.py elf FILE`、`coff FILE`、`pe FILE` 和 `macho FILE` 各打印一份报告。`python3 code/main.py plan OBJECT...` 打印任意一组 ELF 目标文件的链接规划。`python3 code/main.py functions STRIPPED UNSTRIPPED OBJECT...` 在你自己的另一对构建产物上为查找器和签名评分。

## 实际使用

对你构建的程序，按以下顺序使用读取器。

1. 读取头部，确定格式与种类：可重定位目标文件、可执行文件或共享库。读取器会拒绝不认识的内容，这种拒绝本身也是信息。
2. 列出导入及其提供者：使用 `DT_NEEDED` 和 `.dynsym`、导入目录，或链式导入表与 `LC_LOAD_DYLIB`。对该列表中名称的每次调用都会离开当前映像。
3. 手工沿着一次调用追到它的槽位。记下调用字节、桩或 PLT 字节、槽位地址、文件中的字，以及加载器在那里写入的内容。如果文件中的字看似垃圾数据，在下结论前先将其当作修正来解码。
4. 将符号表与导出和函数起点比较。加载器需要的名称会在 `strip` 后保留，仅调试器需要的名称则不会。说明缺失名称原本属于哪一组。
5. 在已剥离构建上运行可用的查找器，并趁未剥离副本还在时对照它评分。优先采用链接器写入的表，即 `LC_FUNCTION_STARTS`、`.pdata` 或 `.eh_frame`，而不是字节模式，并用调用目标填补空缺。
6. 从自己的目标文件构建签名并应用。记录每次冲突及区分它的字节。若两个签名都声称某个名称匹配，在尾部或引用名称作出判定前，该结果都应视为未知。

将捕获的工具文本与文件一起保存。工具链变化时重新捕获，因为输出清单变化意味着测试夹具也发生变化。

## 交互实验

### 实验 A：手工分析 PLT

在 `code` 目录中启动 Python：

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries/code
python3 -q
```

运行：

```python
from main import *
elf = load_elf("tiny-dyn-x86_64")
[(e.tag_name, e.text) for e in elf.dynamic_entries()]
elf.plt0()
[(e.symbol, hex(e.address), hex(e.slot), hex(e.slot_initial)) for e in elf.plt_entries()]
[hex(w) for w in elf.got_plt_words()]
```

每次调用之前，先根据上文的字节计算答案。然后将 `build_tiny_dyn_elf.py` 中的 `IMPORTS` 改为三个名称，重新构建，并在读取之前预测 `.plt`、`.got.plt` 和 `.rela.plt` 的新大小。

### 实验 B：一个链式修正

```python
exe = load_macho("ledger_main")
stub = next(s for s in exe.stubs() if s.symbol == "_puts")
stub.lines()
raw = int.from_bytes(exe.read(stub.slot, 8), "little")
hex(raw), raw >> 63, (raw >> 51) & 0xfff, raw & 0xffffff
[(i.index, i.name, i.library) for i in exe.chained_fixups()["imports"]]
```

先在纸上解码绑定字：绑定位、以四字节为单位的 `next` 字段、序号。然后读取八字节之后的字，确认它是下一个修正。再读取链中位于 `0x100004058` 的最后一个字，解释为何它的 `next` 为零。

### 实验 C：剥离与重新链接

在 fixtures 目录中，将一个新程序与完全剥离后的 dylib 链接：

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries/code/fixtures
clang -target arm64-apple-macos -O1 main.c -L. -lledger.stripped -Wl,-rpath,@executable_path -o /tmp/relinked
nm /tmp/relinked | grep ' U '
dyld_info -exports libledger.stripped.dylib
```

即使库的 `LC_SYMTAB` 为空，链接仍能成功，因为链接器读取导出字典树。然后运行 `python3 ../main.py macho libledger.stripped.dylib`，比较 `symtab`、`exports` 和 `functionStarts`。接着改用 `-N` 剥离静态构建，看看 `dyld_info -function_starts` 仍会打印什么。

### 实验 D：冲突

```python
from main import *
stripped = load_macho("static-arm64-O2.stripped")
sigs = signatures_from_object(load_macho("ledger-arm64-O2.o"))
[s.pat_line() for s in sigs]
starts = FunctionFinder(stripped).function_starts()
match_signatures(sigs, stripped, starts)
```

阅读两条冲突记录。然后从 `ledger-arm64-O0.o` 构建签名，与 `static-arm64-O0.stripped` 匹配，并根据 `.pat` 行解释为何 `-O0` 下没有冲突。接着将 `PATTERN_LENGTH` 缩短到 16，统计有多少函数发生冲突。

## 实践实验

解码旧版绑定表，并添加 PE 查找器。

要求：

- 将 `ledger_main_nochain` 的 `LC_DYLD_INFO_ONLY` 基址重设、绑定和延迟绑定操作码流解码为包含段、节、地址、类型及目标的行，使其与捕获的 `dyld_info -fixups` 文本中的 21 行一致。
- 在 `build_tiny_dyn_elf.py` 中添加 `PT_GNU_RELRO` 程序头和带 `DF_BIND_NOW` 的 `DT_FLAGS`，将 `.got.plt` 移入覆盖范围，使 `llvm-objdump -p` 显示新头部。在 fixtures README 中说明这复现了完整 RELRO 的哪一部分，以及哪一部分只能由 glibc 执行。
- 为 PE32+ 映像编写 `.pdata` 读取器，以及使用 `RUNTIME_FUNCTION` 起始地址的函数查找器。用 `clang -target x86_64-pc-windows-msvc -c` 构建一个目标文件，不加 `-fno-asynchronous-unwind-tables`，读取其 `.pdata` 重定位，并说明哪些函数是该表省略的叶函数。
- 为每个读取器编写与捕获工具文本进行比较的测试。

成功标准：`python3 code/main.py macho ledger_main_nochain` 打印与 `dyld_info` 相同的 21 行修正；微型 ELF 携带能被 `llvm-objdump` 列出的 `PT_GNU_RELRO`；`.pdata` 查找器命名它能找到的函数，并列出它无法找到的叶函数。

## 本课产物

本课包含 `outputs/skill-linking-loading-and-stripped-binaries.md`。用它将你构建的程序转化为一份报告：列出导入及提供者，将一次调用追踪到加载器填充的槽位，说明 `strip` 删除与保留的内容，并对已剥离构建中的函数起点和名称恢复进行评分。它要求以未剥离副本为真实基准，为每个结论提供捕获的工具清单，并记录每次冲突。

## 验证

运行演示和确定性测试套件：

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries
python3 code/main.py
python3 code/tests/test_main.py
```

验证应证明：

- `tiny-dyn-x86_64` 的动态节与 `llvm-objdump -p` 逐标签一致，且 `DT_FLAGS_1` 携带 `DF_1_PIE`
- 两条 `R_X86_64_JUMP_SLOT` 记录与 `llvm-objdump -R` 一致，并分别命名 `puts` 和 `exit`
- PLT0 将 GOT+8 入栈并经 GOT+16 跳转，每个条目读取自己的槽位并将索引入栈，每个槽位保存其自身 `pushq` 的地址
- 微型 ELF 的节和程序头与 `llvm-objdump -h -p` 一致
- 两个 ELF 目标文件的重定位记录与 `llvm-objdump -r` 一致
- 链接规划找出两个 PLT 符号、四次直接调用、两条相对重定位，以及微型映像各部分的大小
- COFF 节表、含辅助记录的 37 条符号记录以及重定位与 `llvm-objdump -h -t -r` 一致，且 `/16` 解析为 `.llvm_addrsig`
- `ledger` 的三条 COFF `REL32` 记录位于三个 ELF `PC32` 偏移处
- PE 头部、`DllCharacteristics` 和数据目录与 `llvm-objdump -p` 一致
- 导入目录、hint/name 条目和 IAT 与 `llvm-objdump` 及 `pefile` 一致，且绑定之前 IAT 等于查找表
- 导出目录和 `DIR64` 基址重定位可正确解码，重定位后的指针指向字符串“linked by hand”
- RVA `0x100b` 处的 `ff 15` 解析到 `puts` 的 IAT 槽位
- Mach-O 标志、19 个加载命令名称和两个库与 `otool` 一致
- 七个桩可解码并对应到八个 `__got` 槽位，间接符号表与 `otool -Iv` 一致
- 链式修正头部与 `llvm-objdump --macho --chained-fixups` 一致
- 链遍历复现 `dyld_info -fixup_chain_details` 的全部十二个原始字
- 修正行和导入表与 `dyld_info -fixups` 及 `-imports` 一致
- dylib 及其剥离副本的导出字典树与 `dyld_info -exports` 一致
- 对于可执行文件及其剥离副本，`nm_lines()` 等于 `nm -m`
- `strip` 删除 `_main`、`_fns` 和 `_names`，保留九个名称和一条 `radr://5614542` stab，且剥离后的程序打印相同输出
- 旧布局具有 `LC_DYLD_INFO_ONLY`、七个延迟指针，以及指向 `__stub_helper` 的基址重设
- arm64 目标文件重定位与 `llvm-objdump -r` 一致
- `LC_FUNCTION_STARTS` 在两个优化级别都恢复 5/5，且与 `nm` 和 `dyld_info -function_starts` 一致
- `sub sp` 扫描在 `-O0` 找到 5/5，在 `-O2` 找到 1/5，而 `stp` 栈帧扫描一个也找不到
- `bl` 目标加上 `LC_MAIN` 入口恢复 5/5
- 签名在两个优化级别都命名全部五个函数，并记录由字节 44 区分的 `grade` 冲突
- “123456789”的 CRC16 为 `0x6e90`，且 `main` 的 GOT 加载指令对覆盖的八个字节是可变字节
- 每个非可变目标文件字节都等于对应的已链接字节
- 演示与图示数据报告相同地址，且站点模块以 ES5 嵌入相同数据

## 生产环境中的失败模式

| 失败情况 | 能力不足的工具如何报告 | 分析必须证明什么 |
|---|---|---|
| `bl` 或 `call` 落入桩 | “调用了 0x694 处的未命名函数” | 桩的字节、它加载的槽位，以及该槽位绑定的导入 |
| 从文件读取 GOT 字 | “损坏指针 0x8010000000000007” | 第 63 位表示绑定，`next` 为 2，序号 7 是来自库 2 的 `_puts` |
| 目标文件中的 `PLT32` | “每次调用都经过 PLT” | 已定义符号被化简为直接距离，只有未定义符号才获得条目 |
| 将部分 RELRO 误读为完整 RELRO | “GOT 是只读的” | 不使用 `-z now` 时，`.got.plt` 中三个保留槽位之后的槽位位于 `PT_GNU_RELRO` 之外 |
| 将 COFF `REL32` 与 ELF `PC32` 比较 | “Windows 构建使用了不同重定位” | 偏移相同，`-4` 分别存于 ELF 加数和 COFF 字段中 |
| 加载前读取 IAT | “导入指向字符串” | 加载器绑定之前，IAT 等于查找表，而这些字符串属于 hint/name 条目 |
| 已剥离的 dylib | “没有符号，也没有导出” | 导出字典树和 `LC_FUNCTION_STARTS` 列出每个函数 |
| 在已剥离可执行文件上运行 `nm` | “一个函数” | `LC_FUNCTION_STARTS` 用九字节列出五个起点 |
| 在 `-O2` 下扫描序言 | “一个函数” | 四个叶函数没有栈帧，调用目标和起点表能找到它们 |
| 两个函数共享 36 个字节 | “grade_label 就是 grade” | 尾部字节 44 以及长度 60 和 72 将冲突区分开 |
| 在另一台机器的构建产物上运行工具 | 本文中的数字 | 从你自己的测试夹具重新捕获每份清单 |

## 操作准则

从调用点沿每次外部调用追到加载器填充的槽位；在把槽位里的字称作地址之前，先按格式定义将其解码。记录加载器仍然需要什么之后，才进行符号剥离。扫描字节之前，先从链接器写入的表恢复函数起点；对照带符号副本给每种查找器评分，并记录每次签名冲突及区分冲突的字节。

## 延伸阅读

- [System V gABI，第 5 章：程序加载与动态链接](https://www.sco.com/developers/gabi/latest/ch5.dynamic.html)
- [System V 应用二进制接口，AMD64 架构处理器补充规范：第 5.2 节与表 4.9](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Drepper，《如何编写共享库》，版本 4.1.2](https://akkadia.org/drepper/dsohowto.pdf)
- [Drepper，《ELF 符号版本控制》](https://akkadia.org/drepper/symbol-versioning)
- [Jelinek，《对 DSO/可执行文件进行少量加固以抵御利用》，binutils 邮件列表，2004-01-06](https://www.sourceware.org/ml/binutils/2004-01/msg00070.html)
- [Taylor，《链接器 relro》，2008](https://www.airs.com/blog/archives/189)
- [binutils 提交 bd7ab16b：为调用使用 PLT32，2018-02-13](https://gnu.googlesource.com/binutils-gdb/+/bd7ab16b4537788ad53521c45469a1bdae84ad4a) 和 [LLVM D43383](https://reviews.llvm.org/D43383)
- [GNU Binutils：strip](https://sourceware.org/binutils/docs/binutils/strip.html) 和 [llvm-objcopy](https://llvm.org/docs/CommandGuide/llvm-objcopy.html)
- [Microsoft，PE 格式](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [CALL 指令参考，FF /2](https://www.felixcloutier.com/x86/call)
- [Apple，mach-o/loader.h](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h) 和 [mach-o/nlist.h](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/nlist.h)
- [Apple dyld, mach-o/fixup-chains.h](https://github.com/apple-oss-distributions/dyld/blob/main/include/mach-o/fixup-chains.h)
- [Apple ld64, stub_arm64.hpp](https://github.com/apple-oss-distributions/ld64/blob/main/src/ld/passes/stubs/stub_arm64.hpp)
- [Xcode 13 发布说明：链式修正](https://developer.apple.com/documentation/xcode-release-notes/xcode-13-release-notes) 和 [WWDC22 第 110362 场，《快速链接：改善构建与启动时间》](https://developer.apple.com/videos/play/wwdc2022/110362/)
- [strip(1)](https://keith.github.io/xcode-man-pages/strip.1.html)、[ld(1)](https://keith.github.io/xcode-man-pages/ld.1.html) 和 [dyld(1)](https://keith.github.io/xcode-man-pages/dyld.1.html)
- [Hex-Rays，深入理解 IDA F.L.I.R.T. 技术](https://docs.hex-rays.com/core/flirt/concepts/ida-f.l.i.r.t.-technology-in-depth) 和 [Lumina 概览](https://docs.hex-rays.com/add-ons/lumina/overview)
- [Ghidra Function ID 帮助](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/FunctionID/src/main/help/help/topics/FunctionID/FunctionID.html) 和 [AARCH64 函数起点模式](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/AARCH64/data/patterns/AARCH64_LE_patterns.xml)
- [Vector 35，WARP](https://github.com/Vector35/warp) 和 [Binary Ninja WARP 指南](https://docs.binary.ninja/guide/warp.html)
- [BinDiff 手册](https://www.zynamics.com/bindiff/manual/) 和 [BinDiff 源码](https://github.com/google/bindiff)
- [Diaphora](https://github.com/joxeankoret/diaphora)
- [rizin pat.c，.pat 解析器](https://github.com/rizinorg/rizin/blob/dev/librz/sign/pat.c)、[radare2 flirt.c](https://github.com/radareorg/radare2/blob/master/libr/anal/flirt.c) 和 [radare2 手册：Zignatures](https://book.rada.re/signatures/zignatures.html)
- [Andriesse 等，《对完整规模 x86/x64 二进制反汇编的深入分析》（USENIX Security 2016）](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/andriesse) 和 [Andriesse、Slowinska、Bos，《与编译器无关的二进制函数检测》（EuroS&P 2017）](https://danielandriesse.com/papers/eurosp-2017.pdf)
- [Bao 等，ByteWeight（USENIX Security 2014）](https://www.usenix.org/conference/usenixsecurity14/technical-sessions/presentation/bao) 和 [Shin、Song、Moazzezi，《用神经网络识别二进制中的函数》（USENIX Security 2015）](https://www.usenix.org/conference/usenixsecurity15/technical-sessions/presentation/shin)
- [LIEF 更新日志](https://lief.re/doc/latest/changelog.html)、[pyelftools](https://github.com/eliben/pyelftools) 和 [pefile](https://github.com/erocarrera/pefile)
