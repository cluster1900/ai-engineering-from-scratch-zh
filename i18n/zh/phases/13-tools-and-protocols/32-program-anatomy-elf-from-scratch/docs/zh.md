# 程序解剖:从零编写 ELF 读取器

> 编译后程序是一个相互指向的表.

**Type:** Build
**Languages:** Python（标准库）、C（仅用于测试夹具）
**Prerequisites:** Phase 0 · 01（开发环境），已安装 clang；Python 3.10 或更高版本；十六进制运算
**Time:** ~120 分钟

## 学习目标

- 解释本系列的每个分析目标授权规则,以及17 U.S.C. 1201 (f) 的四项限制.
- 使用 `struct.unpack`读取ELF文件头,节头表和两个字符串表.
- 根据gABI与x86-64 psABI 中的名称解码 `.symtab`条目与`.rela`记录.
- 返回指定函数的准确字节,并将每个文件偏移映射到其属结构.
- 读取程序头,通过 `PT_LOAD`将虚拟地址映射为文件偏移.
- 读取Mach-O 目标文件的加载命令,并指出每个命令对应的ELF概念.

## 开始之前:授权与法律

第32至36课的每个目标都是你自己编写和编译的程序.`code/fixtures/ledger.c`包含四个简短的C函数──源码、编译命令和生成的目标文件都是由你掌握的──这里没有需要解读许可证、需要绕过保护,也不会打开任何第三方代码──本系列不涉及软件保护、许可证检查或不属于你的程序──

法律将反汇编视为复制. 在 *Sega Enterprises Ltd. v. Accolade, Inc.*, 977 F.2d 1510 (1992年9月9日) 案中,法院认定反汇编过程中产生的中间副本属于版权法意义上的复制.

第二个案例是*索尼计算机娱乐公司诉康涅狄格公司*,203 F.3d 596 (2000年9月9日) ⋅康涅狄格在开发模拟器时复制了PlayStation BIOS,法院认为这些复制属于合理使用.

两项成文法划出边界. 17 U.S.C. 1201 (f) 允许已合法获得计算机程序副本使用权的人绕过访问控制,但唯一的目的必须是识别和分析使独立创建的计算机程序与其他程序实现互操作所需的程序元素. 四项限制必须同时满足:副本合法,目的是互操作的.相关因素此前并非易获得,并且分析本身不构成其他侵犯权.

在欧盟,2009/24/EC第5条 (3) 条涉及研究. 拥有副本使用权的人可以观察研究或测试程序的运行,以确定程序背后的思想和原理.

第六条 允许在实现独立创建的计算机程序互操作中,无需权利人授权进行反编译.

| 来源 | 允许的行为 | 条件 |
|---|---|---|
| 17 U.S.C. 1201(f) | 绕过访问控制以分析程序 | 合法副本、互操作目的、信息不易获得、不构成侵权 |
| Directive 2009/24/EC 第 5(3) 条 | 观察、研究和测试运行中的程序 | 有权使用副本，行为处于正常加载和运行范围内 |
| Directive 2009/24/EC 第 6 条 | 反编译 | 被许可人、互操作目的、信息不易获得、仅限必要部分 |
| *Sega v. Accolade* | 构成合理使用的反汇编 | 获取思想和功能要素的唯一途径，且理由正当 |
| *Sony v. Connectix* | 逆向工程过程中的中间复制 | 最终产品不侵权 |

这些说明来自法条和判决意见,不构成法律建议. 后遇到不属于你的目标时,应先获得书面授权重新开文件,并将授权与证据一起保存.

## 问题

你编译了`ledger.c`已实现目标文件`llvm-objdump -t`◎输出列出`percent_change`的价值为`0000000000000000`为了`0000000000000010`△这1768字节文件中哪个16字节属于这个函数?列表还在偏移中`0x36`处显示`R_X86_64_PC32 .rodata+0x10`文件中这个位置的四个字节是零.`0x14`开始,为什么增加数量是`0x10`现在,我们要去.

使用 `inspect_binary_layout`回答局面问题,但该工具仅在Linux x64上提供,并通过`REA_PWNTOOLS_PYTHON`没有任何工具.`address_to_file_offset`需要Ghidra 会话,以及 SHA-256 匹配的原始文件完整字节副本.`inspect_artifact`根据路径和内容, 哈希列出容器中的内容, 不读取目标文件内部表.`struct.unpack`和零外部依赖于自己编写读器.测试将每张表与一次性采集并保存为具.`llvm-objdump`文本进行比较.

```figure
elf-byte-map
```

## 文件就是指向其他表表的表

系统 VGABI 第4章图 4-1 展示了同一文件的两个视图.链接视图包含ELF文件头,可选程序头,以及必要程序头,以及必要程序头,以及可选节头.gABI中有一句话决定了整个读器的设计:只有ELF文件头在文件中位置是固定的.其他所有结构都通过另一个结构中存储的偏移来定位.

据了解,GABI还确定了标量类型,并声明ELF不使用位域──`Elf64_Addr`和 `Elf64_Off`占8字节,`Elf64_Half`占 2 字节,`Elf64_Word`占4字节,`Elf64_Xword`占 8 字节──x86-64 psABI 第4.1.1 节要求使用 `ELFCLASS64`,我知道.`ELFDATA2LSB`没有任何`e_machine`为`EM_X86_64`其他国家`e_flags`为零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零零`<`之前的`struct.unpack`现在,我可以读一条记录.

`ledger-x86_64-O1.o`的前 64 字节:

```text
00000000: 7f45 4c46 0201 0100 0000 0000 0000 0000  .ELF............
00000010: 0100 3e00 0100 0000 0000 0000 0000 0000  ..>.............
00000020: 0000 0000 0000 0000 2804 0000 0000 0000  ........(.......
00000030: 0000 0000 4000 0000 0000 4000 0b00 0100  ....@.....@.....
```

对于对照的GABI的SELF头页面阅读这些字节.`e_ident`占16字节,包含`7f 45 4c 46`系统 V 及填充──

接着,`e_type`的`0x0001`表示`ET_REL`据了解,`e_machine`的`0x003e`为62个,即`EM_X86_64`△目标文件没有入口点,因此`e_entry`为零;它没有程序头,因此`e_phoff`没有什么.`e_shoff`为`0x428`文件的转移.最后一行包含`e_ehsize` `0x40`,我知道.`e_phentsize`没有`e_phnum`没有`e_shentsize` `0x40`,我知道.`e_shnum` `0x0b`其他国家`e_shstrndx` `0x0001`,我知道.

读取器用一次调用解析这一行:

```python
fields = struct.unpack_from("<HHIQQQIHHHHHH", data, 16)
```

格式字符串对应从左到右读取的 gABI图:两个半字、一个字、三个8字节值、一个字、六个半字──读取器拒绝魔数、类别或字节序不符的文件,也拒绝不符合64和56的`e_shentsize`或`e_phentsize`值――宽度一旦错误,后续所有的偏移都会出错,因此检查必须放在最前面――

## 节头与两个字符表

每个节目都是64字节的.`Elf64_Shdr`其他类型:`sh_name`,我知道.`sh_type`,我知道.`sh_flags`,我知道.`sh_addr`,我知道.`sh_offset`,我知道.`sh_size`,我知道.`sh_link`,我知道.`sh_info`,我知道.`sh_addralign`,我知道.`sh_entsize`│ 格式字符串为`<IIQQQQIIQQ`,我知道.`sh_name`是引号为`e_shstrndx`节中的偏移,名称在第一个零字节处结束.`e_shstrndx`为1,clang将该节命名为`.strtab`于是,同一张表同时存储节名称和符号名称──

读取器输出 -O1 目标文件的11节目:

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

索引0是保留的空节头.`.text`在文件移动中`0x40`处存放 159 字节代码,紧接文件头,标志为`A`及 存储中分发`X`执行的`.rodata`存放 80 字节只读数据.`.rodata.str1.1`存放五个标签符串`F\0D\0C\0B\0A\0`共 10 字节,标志为`M`子和子`S`现在,我在做什么?

`.comment`存放 47 字节的编译器标记`\0Apple clang version 17.0.0 (clang-1700.6.3.2)\0`,我知道.`.llvm_addrsig`的类型是`0x6fff4c03`存储给操作系统专用类型`SHT_LOOS`至 `SHT_HIOS`范围,LLVM 的 `ELF.h`给出了它的名称.`E`为`SHF_EXCLUDE`接下来,链接器会丢弃它.

`sh_link`和 `sh_info`两列是表之间的指针.`.rela.text`的`sh_info`两个`sh_link`为 10:它修改第2节,并从第10节获取符号.`.symtab`的`sh_link`为 1,指向符号名称字符串表;`sh_info`为 9,表示第一个非局部符号索引.`sh_addr`由于目标文件还没有地址;地址由链接器分配.

gABI的两条规则让读取器能够绘制完整文件映射:节连续且不重叠,文件可以包含未使用空间──读取器按偏移对每个结构排序,并填补空隙:

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

三个空隙共10字节,都是为了齐齐.`.rodata`的`sh_addralign`于是从`0xe0`而不是`0xdf`开始.`.symtab`对于对齐要求为8,因此`.comment`之后有七字节未使用. 节头表本身也按8字节对齐.

`SHT_NOBITS`类型节完全不占文件字节,因此映射会跳过它们. 本目标文件没有这种类型节节,但已链接程序中.`.bss`属于这个类别;如果读取器在那里盲目信任`sh_size`读到文件的最后.

## 符号:绑定,类型,属节,值与大小

`Elf64_Sym`占 24 字节 ((gABI 图 4-18):`st_name`,我知道.`st_info`,我知道.`st_other`,我知道.`st_shndx`,我知道.`st_value`,我知道.`st_size`格式为`<IBBHQQ`,我知道.`st_info`打包了两个字段:高四位为绑定属性,低四位为类型――gABI 定义的绑定为`STB_LOCAL`没有`STB_GLOBAL`其他`STB_WEAK`类型为`STT_NOTYPE`没有`STT_OBJECT`其他`STT_FUNC`两`STT_SECTION`其他`STT_FILE`其他`st_other`现在,我们在这个地方,`STV_DEFAULT`没有任何

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

索引 0 是保留的未定义符号.`st_shndx`指定定义符号的节,另有三个保留值:`SHN_UNDEF`用于文件名`SHN_ABS` `0xfff1`及`SHN_COMMON` `0xfff2`节符号名称为空,因此`llvm-objdump`会打印节本身的名称,读取器也如此处理.gABI 规定所有具有 STB_LOCAL 绑定符号都排在弱符号和全局符号之前,这里体现为前九行,也正因此`.symtab`在`sh_info`记录了9个.

在可重定位目标文件中,由于`sh_addr`为零,`st_value`是符号所在节内的偏移.因此函数的文件偏移为`sh_offset + st_value - sh_addr`长度为`st_size`其他:

```python
section = elf.sections[symbol.st_shndx]
file_offset = section.sh_offset + (symbol.st_value - section.sh_addr)
code = elf.data[file_offset : file_offset + symbol.st_size]
```

对于`percent_change`而言,偏移是`0x40 + 0`十六个字节为`85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3`△大小与起点位置同样重要.`grade`在`.text`的偏移`0x3e`处结束――紧随其后的两个字节`66 90`是编译器添加的`nop`操作指令,用于让`total`从`0x40`这一16字节边界开始. 这两字节不属于任何符号.`st_size`作为反汇编器的停止条件, 第36课将在比较重建结果之前屏蔽这些填充字节.

## 重定位:零字节意味着什么

`Elf64_Rela`占 24 字节:`r_offset`,我知道.`r_info`和有符号的`r_addend`格式为`<QQq`△重定位记录描述链接需要修复位置及计算方式──gABI 用两个宏分区`r_info`其他:`ELF64_R_SYM(i)`为`i >> 32`没有任何`ELF64_R_TYPE(i)`为`i & 0xffffffff`在可重定位文件中,`r_offset`是表的`sh_info`所指定节内的偏移──类型名称和公式来自x86-64 psABI表 4.9,其中`S`是符号值,`A`是加数,`P`是修复的位置,`L`是过程链接表 条目`R_X86_64_64`为`S + A`没有任何`R_X86_64_PC32`为`S + A - P`没有任何`R_X86_64_PLT32`为`L + A - P`,我知道.

目标文件有八条记录:

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

拆解第一条记录.偏移.`0x36`位于`grade`内,后者范围为`0x10`至 `0x3e`,我知道.`0x33`处的指令是`48 8d 0d 00 00 00 00`计算 RIP 相对地址的`lea`其四字节位移位于`0x36`处理器将被移动到下一条命令的地址`0x3a`上面.

编译器希望结果为 `.rodata + 0x14`那里有一个包含5个32位值`1, 2, 3, 4, 4`由于这些数据的存储值必须为`(.rodata + 0x14) - 0x3a`△公式`S + A - P`在`P = 0x36`时得到`.rodata + A - 0x36`令两者相等可行`A = 0x14 - 4 = 0x10`△加数包含目标偏移减移字段与指令末尾之间的四个字节──

这张表现了在 - O1 下编译 `grade`中 中`switch`通过乘乘的方式.`0x66666667`和两次移位计算`score / 10`引用是节符号. 引用是节符号.`.rodata`加上一个加号,只有相同的源码的Arm64 构建将命名为`l_switch.table.grade` 第二条记录位于`grade_label`的`0x84`向向`.rodata + 0x28`处第二张由8字节值组成的表.`0x93`向向`.rodata + 0x0`其他`labels.rel`起点的.

五条 五条`.rela.rodata`记录填充`labels.rel`△每条目都偏移`4i`增加数量也是`4i`为了`S + A - P`化简为字符串地址减去表基址。`grade_label`用`movslq`读取条目,再加回表基址,就得到指针.`.rodata.str1.1`增加为0,因为字符串`F`开始了第一节.`.L.str.1`至 `.L.str.4`它们是编译器.`D`,我知道.`C`,我知道.`B`,我知道.`A`生成的局部标签

同一源码在三种优化级别下会编译出三种不同的表.

| 构建 | `labels` 的位置 | `grade` 如何选择 | `grade_label` 如何到达 `grade` |
|---|---|---|---|
| -O0 | `.data`，五个 8 字节指针，五条 `R_X86_64_64` 记录 | `.rodata` 中的跳转表：五条指向 `.text` 的 `R_X86_64_PC32` 记录 | 带有 `R_X86_64_PLT32 grade-0x4` 的调用 |
| -O1 | `.rodata` 中的 `labels.rel`，五个 32 位相对条目 | `.rodata+0x14` 处的值表，一条 `R_X86_64_PC32` | 已内联，没有调用 |
| -O2 | 与 -O1 相同 | 与 -O1 相同 | 已内联，`total` 增长到 140 字节 |

在 -O0下,`switch`是真正的跳转表,五条目分别指回`.text`中中 `+0x91`,我知道.`+0x8c`,我知道.`+0x87`,我知道.`+0x82`和 `+0x86`对对`grade`调用带有同样`-0x4`增加数,原因与`lea`同样.在 -O1 下,优化器发现每个分支都回归常量,因此用结果表替换跳转.

## 程序头:加载器的视图

可重定位目标文件没有程序头,因此`e_phnum`为实现文件和共享目标文件包含程序头,载体只读取这些信息.`Elf64_Phdr`占 56 字节:`p_type`,我知道.`p_flags`,我知道.`p_offset`,我知道.`p_vaddr`,我知道.`p_paddr`,我知道.`p_filesz`,我知道.`p_memsz`,我知道.`p_align`格式为`<IIQQQQQQ`    `PT_LOAD`条目规定三条规则:按 `p_vaddr`升序排列;`p_memsz`很大`p_filesz`的部分用零填充;`p_vaddr`与`p_offset`对于`p_align`取模同余──

这系列的每个目标都是你自己构建的程序,而这台Mac上没有任何方法.`ledger.o`生成Linux可执行文件的链接器.`tiny-x86_64`现在`code/fixtures/build_tiny_elf.py`它们是用`struct.pack`写出736字节.文件包含ELF文件头,两个程序头,36字节.`_start`字节的`.rodata`符号表和六节头`_start`向文件描述符 1 写入 `ok\n`系统可以在Linux x86-64上运行;在这里,它是覆盖程序头处理路径的测试器.

```text
Program headers:
  PT_LOAD          r-x offset=0x0 vaddr=0x400000 filesz=0x2e0 memsz=0x2e0 align=0x1000
  PT_GNU_STACK     rw- offset=0x0 vaddr=0x0 filesz=0x0 memsz=0x0 align=0x10

entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

唯一的`PT_LOAD`将整个736字节文件映射到`0x400000`△读取器找到包含某地址的 `PT_LOAD`再计算`p_offset + (address - p_vaddr)`即可将地址映射为文件偏移.`0 + (0x4000b0 - 0x400000) = 0xb0`现在,我在做什么?`.text`起点的.

这就是真正的.`address_to_file_offset`背后的计算――对Ghidra 目标,该工具返回`{address, file_offset}`珀提供方还会回来`provider_file_offset`和 `image_base_file_offset`◊工具需要完整的原始文件副本,而副本的SHA-256必须与目标匹配.`inspect_binary_layout`文档中还有一句值得记住的话: 链接地址不是运行时地址.

程序头也解释了为什么在剥离信息后的可执行文件仍然可以运行.`e_shoff`变为零. 遍历节的工具会看不到任何内容,而载体从来不依赖这些节点.

## 机器的应对概念

果没有发布Mach-O的文字版规范.`EXTERNAL_HEADERS/mach-o/loader.h`,我知道.`nlist.h`和 `reloc.h`具`ledger-arm64-O1.o`通过同一个`ledger.c`使用 `clang -target arm64-apple-macos -O1 -fno-asynchronous-unwind-tables -c`构建

`mach_header_64`占32 字节:`magic`,我知道.`cputype`,我知道.`cpusubtype`,我知道.`filetype`,我知道.`ncmds`,我知道.`sizeofcmds`,我知道.`flags`,我知道.`reserved`魔数为`0xfeedfacf`其他`MH_MAGIC_64`,我知道.`cputype`为`0x0100000c`其他`CPU_TYPE_ARM64`,我知道.`filetype`为 1,即`MH_OBJECT`,我知道.`ncmds`为 5,`sizeofcmds`为 616: 载命令占据文件头后的 616字节,每条命令均为`{cmd, cmdsize}`开始――标志`0x2000`为`MH_SUBSECTIONS_VIA_SYMBOLS`,我知道.

```text
Load commands:
  0 LC_SEGMENT_64                cmdsize=472 at 0x20
  1 LC_BUILD_VERSION             cmdsize=24 at 0x1f8
  2 LC_LINKER_OPTIMIZATION_HINT  cmdsize=16 at 0x210
  3 LC_SYMTAB                    cmdsize=24 at 0x220
  4 LC_DYSYMTAB                  cmdsize=80 at 0x238
```

`LC_SEGMENT_64`应对ELF的两张表.`segment_command_64`包含`segname`,我知道.`vmaddr`,我知道.`vmsize`,我知道.`fileoff`,我知道.`filesize`,我知道.`maxprot`,我知道.`initprot`,我知道.`nsects`和 `flags`,我在同一条命令中紧接着`nsects`条 条`section_64`记录,每条 80 字节.`loader.h`关于`MH_OBJECT`的注释是,这些节目位于一个没有段子的无名单一段子中.`fileoff`为648,`filesize`为456,包含五节.

```text
  Idx Section                    Addr   Size Offset Reloff Nreloc Type
    1 __TEXT,__text               0x0   0xd0    648   1104      6 S_REGULAR
    2 __DATA,__const             0xd0   0x28    856   1152      5 S_REGULAR
    3 __TEXT,__cstring           0xf8    0xa    896      0      0 S_CSTRING_LITERALS
    4 __TEXT,__const            0x108   0x40    912      0      0 S_REGULAR
    5 __LD,__compact_unwind     0x148   0x80    976   1192      4 S_REGULAR
```

每个节目都通过了`segname`指明所属段,因此两个名为`__const`节不相同:一个是`__DATA,__const`另一个是`__TEXT,__const`◎重定位通过`reloff`和 `nreloc`按节存放;ELF则为每个目标节设置单独`.rela.X`节

每条`relocation_info`占8字节,首先是有符号的`r_address`随后是一个32位字段,打包为`r_symbolnum`其他类型`r_pcrel`没有任何其他方法`r_length`两位`r_extern`及`r_type`六条 六条`__text`记录是三对`ARM64_RELOC_PAGE21`与`ARM64_RELOC_PAGEOFF12`对于应对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对`adrp`加  `add`实现了 x86-64 一条 `lea`由于它是个重要的因素,因此每次引用都需要两条记录.`__DATA,__const`记录为`ARM64_RELOC_UNSIGNED`没有任何`r_length`为3,因此每条修补一个8字节绝对指针.

在 -O1 下,arm64 构建将`labels`保持为普通指针,而 x86-64 构建产生相对表.

`LC_SYMTAB`包含`symoff`其他国家`nsyms`没有任何`stroff`其他国家`strsize`文件大小1688──每一个`nlist_64`占 16 字节:`n_strx`,我知道.`n_type`,我知道.`n_sect`,我知道.`n_desc`,我知道.`n_value`,我知道.`n_type`是位域.`N_TYPE`,我没有什么可说的.`0x0e`)等于`N_SECT`(`0xe`),表示符号定义在序号为`n_sect`节中,序号从 1 开始.`N_EXT`(`0x01`)标记外部符号――

`nlist_64`没有小字段.`_percent_change`读取器使用同一节中下一个符号的地址,即位于`0x18`的`_grade`,这里的C符号带有前导.`_`,因此函数名为`_percent_change`,我知道.

`LC_DYSYMTAB`(0xb) 与ELF记录`sh_info`相同的局部符号优先规则:`ilocalsym`没有`nlocalsym`其他`iextdefsym`其他`nextdefsym`其他`LC_BUILD_VERSION`打包的`XXXX.YY.ZZ`整数记录`platform`其他技术`minos`两月`sdk`由于该命令,arm64 具必须以字节形式提交;在使用另一个SDK的Mac上构建会产生不同的文件.

读取器的`compare_formats`将两个文件并排比较:

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

通过`inspect_macho`读取马克·奥,该工具经由 `xcrun`运行`otool -h -l`,我知道.`nm -gjU`,我知道.`dyld_info -imports -exports`和 `dwarfdump --uuid`你的读取器不需要这些工具,但会读取与`otool -l`输出相同的`symoff`和 `stroff`的区域`open_binary`工具通过数量识别ELF、MZ、PE,以及单架构或通用Mach-O,也会自动读取偏移18个处的`e_machine`对于没有文件头的文件,需要提供`format: raw-binary`、架构和入口地址──Ghidra 提供者拒绝通用二进制文件,要求先提取单架构片──你的读取器遇到`0xcafebabe`时也这样处理.

## 构建自己

运行仅使用标准库的读取器:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
```

演示读取`ledger-x86_64-O1.o`输出文件头节符号重定位和文件偏移映射;然后输出四个函数的字节串,读取`ledger-arm64-O1.o`并输出比较表;最后输出`tiny-x86_64`预期输出包括:

```text
percent_change: 16 bytes at file offset 0x40: 85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3
grade: 46 bytes at file offset 0x50: 48 63 c7 48 69 c0 67 66 66 66 ...
entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

传入路径可读取单个文件:`python3 code/main.py code/fixtures/ledger-x86_64-O0.o`△读取器根据前四字节选择ELF或Mach-O──

按以下顺序阅读 `code/main.py`其他:

1. `ElfFile._read_header()`检查魔数,类别,字节序列和条目大小,然后解包文件头.
2. `ElfFile._read_sections()`与`read_cstring()`读取节头表,并通过 `e_shstrndx`解析名称──
3. `ElfFile._read_symbols()`拆分`st_info`通过`sh_link`解析名称,并保持保留节索引可读。
4. `ElfFile._read_relocations()`遍历每一个`SHT_RELA`节,拆分`r_info`根据表 4.9 为类型命名.
5. `ElfFile.function_span()`与`function_bytes()`将符号转化为文件范围及其中的字节.
6. `ElfFile.file_offset_map()`按偏移排序每个结构,并补入未使用空间.
7. `ElfFile._read_program_headers()`与`address_to_file_offset()`处理可执行文件.
8. `MachOFile`读取文件头,加载命令,包含节目.`LC_SEGMENT_64`,我知道.`LC_SYMTAB`,我知道.`LC_BUILD_VERSION`为了使每个节目重定位.
9. `compare_formats()`通过两个文件中读取的价值来展示相同概念的对应关系.

## 使用它

在后续课程中,先将本课的.`code`目录加入`sys.path`通过了`from main import ElfFile`导入读取器──第33课会请求 `function_bytes`和 `relocations_for(".text")`△第35课将其输出记录用于观察证据.

使用相同的`clang -target x86_64-unknown-linux-gnu -c`命令,将自己编写的C编译为目标文件,再使用读取器分析――只有 x86-64 psABI表 4.9 列出的重定位名称才可添加;只有 gABI 或生成文件的工具链文档记载节类型才可添加――遇到没有应名称的值时,读取器打印了十六进制数,而不是猜测――

## 交互实验

### 实验A:手动读取文件头

在`code`目录中启动Python:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch/code
python3 -q
```

运行:

```python
import struct
from main import ElfFile, FIXTURES
data = (FIXTURES / "ledger-x86_64-O1.o").read_bytes()
data[:4], data[4], data[5]
struct.unpack_from("<HHIQQQIHHHHHH", data, 16)
elf = ElfFile(data)
elf.header.e_shoff, elf.header.e_shnum, elf.sections[elf.header.e_shstrndx].name
```

显示组`e_type`为了`e_machine`为了62`e_shoff`为1064年,即`0x428`最后一行表明第1节`.strtab`存储节名称――

### 实验B:开关 背后的值表

```python
rodata = elf.section_bytes(elf.section(".rodata"))
[int.from_bytes(rodata[i : i + 4], "little") for i in range(0x14, 0x28, 4)]
[int.from_bytes(rodata[i : i + 8], "little") for i in range(0x28, 0x50, 8)]
[r for r in elf.relocations_for(".text") if r.symbol == ".rodata"]
```

两张表都读出`1, 2, 3, 4, 4`照相`ledger.c`检查:`grade(65)`计算`65 / 10 - 6 = 0`读取条目0,得到1,即 `case 6`的值.`grade(100)`读取条目 4,得到 4,即 `case 10`与`case 9`共用值──

### 实验C:同一源码的三种构建

```python
for level in ("O0", "O1", "O2"):
    obj = ElfFile.from_path(FIXTURES / f"ledger-x86_64-{level}.o")
    print(level, [s.name for s in obj.sections if s.name in (".data", ".rodata")])
    print(level, sorted({r.type_name for r in obj.relocations}))
    print(level, {s.name: s.st_size for s in obj.symbols if s.type == "FUNC"})
```

目标文件有`.data`节和三种重定位类型──-O1 与 -O2 目标文件没有 `.data`只有一个类型.`total`在 -O0 下为 66 字节,-O1 下为 31 字节,-O2 下为 140 字节──

### 实验 D:Mach-O 中的相同函数

```python
from main import MachOFile
macho = MachOFile.from_path(FIXTURES / "ledger-arm64-O1.o")
[(c.name, c.cmdsize) for c in macho.load_commands]
macho.function_span("_percent_change")
macho.function_bytes("_percent_change")[:4].hex()
```

函数范围为文件偏移 648 处的 24 字节──前四个字节是`a0000034`命令`0x340000a0`作为一个小组,`llvm-objdump -d`将其输出为`cbz w0, 0x14`,这是一个.`before == 0`保护检查,与 x86-64 构建中编码为 `85 ff 74 09`检查相同.

## 实践实验

扩展读取器,使其支持已链接程序. 在Linux x86-64机器上,运行.`clang -O1 -shared -fPIC code/fixtures/ledger.c -o libledger.so`加入`main`后运行`clang -O1 code/fixtures/ledger.c -o ledger_main`然后用读器分析这两个文件.

要求:

- 用同样的`Elf64_Sym`布局读取`.dynsym`因为`SHT_DYNSYM`为11个,而记录格式不变.
- 将`.dynamic`读取为由`d_tag`和 `d_val`组成的`Elf64_Dyn`记录,并依据gABI动态部分页面命名`DT_NEEDED`,我知道.`DT_STRTAB`,我知道.`DT_SYMTAB`,我知道.`DT_RELA`和 `DT_JMPREL`,我知道.
- 将`st_shndx`为`SHN_UNDEF`的未定义符号列为导入项,将 `.rela.plt`中中 `R_X86_64_JUMP_SLOT`记录列为到达它们调用位置.
- 根据GABI一个目标文件段包含一个或多个节目的规则,每个节目将`PT_LOAD`段映射到其包含的节点.
- 用`address_to_file_offset`证明,共享目标文件中每个已定义函数的字节与`function_bytes`的回报值相同.
- 两份文件`llvm-objdump -h -t -r -p`和 `llvm-objdump -T`文本采集到`code/fixtures/`测试中与读取器输出比较.

成功标准:导入列表,段映射和每个函数范围均与采集工具的输出和测试期间不运行工具.

## 评分实验

五个关于本课件的题目. 用你构建的代码找到每个答案,然后写入.`code/lab_answers.json`△数字写成数字,或写成`"0x40"`这样十六进制字符串;列表写成JSON列表.

1. `t1`现在,我们已经开始了.
2. `t2`百分比变化的小幅.
3. `t3`文件偏移,写成十六进制.
4. `t4`列表中的重定位类型名,排序后写成列表
5. `t5`列表中.rodata+0x14 处的五个Int值,写成列表

检查你的答案:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/lab.py
```

检查器在已提交的固定上使用 `code/main.py`计算每个期望值.`PASS`,我知道.`FAIL`或`TODO`只有五个问题全部通过,才以0退出.`python3 code/lab.py my-answers.json`可检查另一个文件.`code/tests/test_lab.py`证明检查器接受正确答案并拒绝错误答案──

### 看它运行

[Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler)机器把本课作为它的前两个工位来运行.`percent_change`目标文件的头部,柜子开放`.text`并读取这个符号. 关闭符号,可以看到符号表提供的事实.

## 本课产物

本课产出发 `outputs/skill-program-anatomy-elf-from-scratch.md`△可用于Claude、Cursor、Codex、OpenClaw、Hermes或任何读取SKILL.md的智能体.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

测试套件验证以下事实:

- 在三个 x86-64 目标文件及微型可执行文件中,每个节目的索引,名称,大小,地址和类型都与采集`llvm-objdump -h`文本一致
- 每个符号的值,绑定,类型,属性节,大小和名称都与采集`llvm-objdump -t`文本一致
- 每个重定位偏移,类型名称,符号和加数都与采集`llvm-objdump -r`文本一致,包括 -O0 下的 `R_X86_64_PLT32`和 `R_X86_64_64`
- `tiny-x86_64`两项程序都与采集有关.`llvm-objdump -p`文本一致,而目标文件没有程序头
- `percent_change`位于文件偏移`0x40`长度 16 字节,字节符合预期,且每个函数都位于`.text`在内
- 文件偏移映射恰好覆盖每个 件的每个字节一次,并且 -O1 目标文件的三个对齐空隙位置正确
- `tiny-x86_64`通过的入口点`PT_LOAD`映射到文件偏移`0xb0`转移到其他地方的目标文件拒绝地址映射
- 机器人文件头条,每条装载命令,段,五节,`LC_SYMTAB`和 `LC_BUILD_VERSION`城市与采集`--private-headers`文本一致
- 马赫-奥符号与15条重定位都与采集的`llvm-objdump`文本一致,且`_percent_change`位于偏移 648,长度 24 字节
- 错误魔数、32位类别、大端文件、截断表、通用二进制文件和C源文件都会触发`FormatError`
- `build_tiny_elf.py`逐字节复现已提交的 `tiny-x86_64`
- 图示模块 `site/figures-re-32.js`包含`ledger-x86_64-O1.o`的准确字节

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

读取可信的文件头,沿其偏移定位结构,并根据定义字段规范命名每个字段.将用于比较工具输出提交为件,让比较无需运行工具.

## 延伸阅读

- [System V gABI, 第 4 章：目标文件](https://www.sco.com/developers/gabi/latest/ch4.intro.html)与[ELF Header](https://www.sco.com/developers/gabi/latest/ch4.eheader.html)现在[Sections](https://www.sco.com/developers/gabi/latest/ch4.sheader.html)现在[Symbol Table](https://www.sco.com/developers/gabi/latest/ch4.symtab.html)与[Relocation](https://www.sco.com/developers/gabi/latest/ch4.reloc.html)页面
- [System V gABI, 第 5 章：程序头](https://www.sco.com/developers/gabi/latest/ch5.pheader.html)与[Dynamic Linking](https://www.sco.com/developers/gabi/latest/ch5.dynamic.html)
- [System V ABI, AMD64 Architecture Processor Supplement](https://gitlab.com/x86-psABIs/x86-64-ABI)排列第 4 个:重定位类型
- [Apple XNU `loader.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h)现在[`nlist.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/nlist.h)与[`reloc.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/reloc.h)
- [17 U.S.C. 1201](https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title17-section1201&num=0&edition=prelim)与[Directive 2009/24/EC](https://eur-lex.europa.eu/eli/dir/2009/24/oj/eng)
- [Sega v. Accolade, 977 F.2d 1510](https://law.resource.org/pub/us/case/reporter/F2/977/977.F2d.1510.92-15655.html)与[Sony v. Connectix, 203 F.3d 596](https://law.resource.org/pub/us/case/reporter/F3/203/203.F3d.596.99-15852.html)
- [rea 6.5.0 `docs/binary-diagnostics.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/binary-diagnostics.md)与[`docs/ghidra-provider.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/ghidra-provider.md)
