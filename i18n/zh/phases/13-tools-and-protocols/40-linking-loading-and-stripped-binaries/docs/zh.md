# 链接,加载和剥离符号后的二进制:PLT、GOT、导入、修正与函数识别

> 链接后的程序将调用其本身不包含的函数. 本课程读取链接器为这些调用写入三种格式表,沿着一次调用追踪到载体填充槽,然后在构建产品名称消失后找到其中的函数.

**Type:** Build
**Languages:** Python, C, x86-64 和 arm64 汇编
**Prerequisites:** Phase 13 · 32（从零理解 ELF）、33（反汇编与控制流）、38（调用约定）
**Time:** ~160 分钟

## 学习目标

- 根据重定位记录和符号表,判断链接器将处理为固定距离的PLT条目,带GOT槽位,还是动态重定位.
- 读取位置无关 ELF可执行文件的动态节、PLT 和 GOT,并使用 psABI 公式沿着一次调用穿过这些结构──
- 读取 COFF 目标文件(20字节文件头、40字节节表项、18字节符号记录、10字节重定位记录) 以及PE32+ 映像的导入、导出和基址重定位目录──
- 逐字解码 马赫-O 链式修改链,并将每个字与 `dyld_info`照顾
- 解释每种格式中`strip`删除什么,保留什么,并运行剥离后的程序证明它仍然可以工作.
- 用`LC_FUNCTION_STARTS`、序言扫描和调用目标恢复已剥离的手64 构建产品的函数起点,对照未剥离副本的符号表给每种方法评分,并使用FLIRT 式签名为函数命名──

## 问题

你将`main.c`与`libledger.dylib`链接,并问一个代理人:`main`在`0x1000005a0`调用了哪个函数――代理 反汇编该指令,读到 `bl 0x100000694`△该地址处有十二个字节:`adrp x16`,我知道.`ldr x16, [x16, #0x38]`,我知道.`br x16`应对行动的追踪`0x100004038`读到八个字节`00 00 00 00 00 00 10 80`报告程序通过一个损坏指标调用内核空间.

随后,你剥离了同一程序的静态构建产品,并问其中有多少函数――代理运行`nm`只有一个名字`__mh_execute_header`答案是一个.

两种答案都将文件作为正在运行的进程来阅读.`0x100004038`处的字是链式修改──第 63 位表示绑定,十二位表示下一个修改的位置,低位表示要绑定哪个导入──dyld 在 `main`运行前将该字替换为 `_puts`文件丢失了符号表,但保留了`LC_FUNCTION_STARTS`后者用九字节列出了所有五个函数的起点.

本课程使用Python 标准库构建五个读器:用于我们自己的目标文件的COFF 读器,以及读取导入,导出和基址重定位目录的PE32+ 读器;读取加载命令间接符号表、链式修改链和导出字典树的Mach-O 读器,并与`dyld_info`逐字核对;读取动态节、PLT 和 GOT的ELF读取器,加上预测这些目标文件经 PIE 链接会生成什么的规划器;使用四种方法查找已剥离的构建中函数、并为各方法评分的函数查找器;以及FLIRT式签名构建器,将重定位字节设为通配,并计算尾部的CRC16──

本机只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接 机器只能链接`clang -target`编译;由于没有安装ELF或PE链接器,这两种形式的已链接的视频由固定文件中的两个Python脚本按规范逐字节写出.`llvm-objdump`它们没有运行,正文会在相关的文献中明确指出这一点.

```figure
re-40-call-through-three-formats
```

## 链接器如何处理重定位

第32课读取重定位记录,第33课将`S + A - P`应用于一条`lea`△ 一条记录指定位置`P`、类型、符号`S`和加数`A`△x86-64 psABI 表 4.9 为每类型给出一个公式,其中`L`为符号的PLT条目位置,`G`为了它而移动,`GOT`为 GOT 地址,`B`为了影像的加载基址. 我们的目标文件涵盖了三种结果.

链接器将值写入字段,记录随着消失.`R_X86_64_PC32`属于这种情况. 不管如何加载地址,同一视频中的两个字节之间的距离都不变.

链接器创建一个PLT条目和一个GOT槽位──针对未定义函数的`R_X86_64_PLT32`属于这种情况.`L + A - P`转移的过程中,`.rela.plt`中中 `R_X86_64_JUMP_SLOT`记录通知动态链接器填充该槽位──

链接器为载体保留一个重定位.`R_X86_64_64`只有在加载时才知道自己的地址.`.rela.dyn`中中 `R_X86_64_RELATIVE`公式为`B + A`,我知道.

`main-x86_64-O1.o`有18条记录:`.text`中 14条`.data.rel.ro`中 2 条`.rodata`两条中`code/main.py`中中 `plan_dynamic_link()`将上述三条规则应用于这些记录以及`ledger-x86_64-O1.o`其他:

| 记录 | 数量 | 决策 | 原因 |
|---|---|---|---|
| 指向 `.rodata`、`.L.str`、`fns`、`.rodata` 中表的 `R_X86_64_PC32` | 16 | 原地处理 | 符号在输入中已定义 |
| 指向 `percent_change`、`grade`、`total`、`grade_label` 的 `R_X86_64_PLT32` | 4 | 直接调用，不使用 PLT | 在 `ledger-x86_64-O1.o` 中已定义，因此链接器将 PLT32 化简为 PC32 |
| 两次指向 `puts`、两次指向 `printf` 的 `R_X86_64_PLT32` | 4 | PLT 条目和 GOT 槽位 | 未定义，由共享库提供 |
| 指向 `fns[]` 中 `grade` 的 `R_X86_64_64` | 2 | `R_X86_64_RELATIVE` | PIE 中的绝对地址字段 |

两个导入产生 48 字节的 `.plt`其他地方的子.`.got.plt`(三个保留槽位加上两个槽位) 和48节的`.rela.plt`△两个相对重定位记录产生48字节`.rela.dyn`,这些数字来自将规范应用于我们的记录.`tiny-dyn-x86_64`针对相同的两个导入实现了该规划中的PLT部分,其大小与规划一致.

从二分之一2.31(H.J. Lu,2018-02-13) 和LLVM 7.0.0(D43383,2018-02-20)开始,编译器对每次调用都写入 `PLT32`无论目标已定义或否.`PLT32`仅表示一次调用,不能说明是否会存在 PLT 条目.`R_X86_64_GOTPCRELX`和 `R_X86_64_REX_GOTPCRELX`(`G + GOT + A - P`没有带 PLT 的 GOT 槽位,这是`-fno-plt`产生的形式;符号为本地符号时,链接器可能将其松为直接的`lea`或`call`其他国家:`R_X86_64_32`和 `R_X86_64_32S`无法容纳PIE中地址,会导致链接失败.

## 动态节、PLT与GOT

 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键字: 关键`PT_INTERP`程序头,它必须在所有可加载段之前;还有一个覆盖.`.dynamic`节的`PT_DYNAMIC`,这是一个问题.`Elf64_Dyn`组分数,每个组包含符号标签和值,以`DT_NULL`结束.

`tiny-dyn-x86_64`由`build_tiny_dyn_elf.py`按GABI 和 psABI 写出,共 5,184 字节.`0x1000`处包含十二个二元组:

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

现在,我们要做什么?`DT_JMPREL`分开:它保存与进程链接表相关的重定位条目的地址.将这些重定位条目的地址分开后,如果启用延迟绑定,动态链接器就可在进程启动期间忽略它们.`DT_FLAGS`中中 `DF_BIND_NOW`,我知道.`DT_FLAGS_1`中中 `DF_1_NOW`或环境中`LD_BIND_NOW`关闭延迟绑定,使动态链接器在启动时处理这些条款.

### 和的条目

图 5.2 中给出了这两种形态:

```text
     1f0: ff 35 d2 0e 00 00    pushq  0xed2(%rip)      # 0x10c8 = GOT+8
     1f6: ff 25 d4 0e 00 00    jmpq   *0xed4(%rip)     # 0x10d0 = GOT+16
     1fc: 0f 1f 40 00          nopl   (%rax)

     200: ff 25 d2 0e 00 00    jmpq   *0xed2(%rip)     # 0x10d8 = GOT+24, the slot for puts
     206: 68 00 00 00 00       pushq  $0x0             # index 0 into DT_JMPREL
     20b: e9 e0 ff ff ff       jmp    0x1f0            # PLT0
```

亲手计算一次──RIP 相对位移后一条指令为基准──`0x1f6 + 0xed2 = 0x10c8`其他`.got.plt + 8`,我知道.`0x1fc + 0xed4 = 0x10d0`其他`.got.plt + 16`,我知道.`0x206 + 0xed2 = 0x10d8`现在,我们要做什么?`0x210 - 0x20 = 0x1f0`它们的每个条目都是16字节,因此`exit`的条目从`0x210`开始,将`$0x1`进,并读取`0x10e0`,我知道.

关闭三槽位. 关闭第零条条目保存`_DYNAMIC`其他地方的地址,而全局偏移表中的条目一和二也保留──我们的`.got.plt`内容为`0x1000, 0, 0, 0x206, 0x216`,我会把自己的文件加载.`struct link_map`填入槽位一,将 `_dl_runtime_resolve`填入槽位二──文件中的槽位三保存 `0x206`其他`puts@plt`内部的`pushq`SABI 指出,该槽位最初......保存紧随其后的推指令的地址──

因此,第一次调用执行`call 0x200`没有任何`jmpq *0x10d8`落到`pushq $0`没有任何`jmp 0x1f0`使 GOT+8 入并经 GOT+16 跳入解析器;解析器读取 `DT_JMPREL`关于" 十条记录"`R_X86_64_JUMP_SLOT puts`在`libc.so.6`中查找 `puts`将其地址写入`0x10d8`接着跳转过去.第二次调用只需要执行.`call`,我知道.`jmpq *0x10d8`由于此,除了第一次调用外,所有调用开销只有一次间接跳转`%r11`脚注解释了第38课中的寄存器选择:它是临时寄存器,因此PLT中代码不需要溢出保存任何寄存器──

`.text`中 中`0x227`处的调用点字节为`e8 d4 ff ff ff`现在,`0x22c - 0x2c = 0x200`,我知道.`llvm-objdump`打印的`callq 0x200 <puts@plt>`根据`.rela.plt`记录为条目命名,`plt_entries()`也用同样的方法命名.

### 文件中没有什么

文件没有`PT_GNU_RELRO`◎ 雅各布·杰林克 2004-01-06 在二维服务邮件列表中提出RELRO:将只在重定位期间转移写入节段到可写段开头,使动态链接器随后能够使用`mprotect`将其设置为只读的 GNU id 的默认脚本将 `.init_array`,我知道.`.fini_array`,我知道.`.data.rel.ro`,我知道.`.dynamic`和 `.got`放入其中,但对于`.got.plt`只有三个保留槽位共24字节放入,因为剩余槽位会延迟写入.`-z now`设置`DF_BIND_NOW`并将整个`.got.plt`放入其中,形成完整的RELRO,因为启动后不再发生.`_dl_protect_relro`页面对齐范围调用`mprotect(start, end - start, PROT_READ)`,我知道.`-fno-plt`在编译器端更进一步:调用经由 `jmpq *name@GOTPCREL(%rip)`没有延迟绑定,GCC 手册称 所有外部符号都在加载时解析──

文件也没有版本节.`libc.so.6`加入`.gnu.version`每个人都`.dynsym`条目对应一个`Elfxx_Half`另外还会添加`.gnu.version_r`它们中的每一个都应对一个`Verneed`为了应对一条`Vernaux`记录.`printf@GLIBC_2.2.5`意思是:`printf`在`.gnu.version`中的条目保存一个索引;`vna_other`根据这个索引.`Vernaux`的`vna_name`为GLIBC_2.2.5,属于`vn_file`为了libc.so.6的`Verneed`△索引 0 表示本地,1 表示全局,第15位(`VERSYM_HIDDEN`,我知道.`0x8000`让链接器看不到某个版本.

哈希表是SysV `DT_HASH`包含一个桶和一个三条链,共24字节.`DT_HASH`或`DT_GNU_HASH`文件中符号. 文件不导出任何内容,也没有运行,因此尚未验证是否接受单桶表.

### ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,

们都在`.dynsym`和 `.dynstr`规定的内存的节节,将`.symtab`和 `.strtab`规则为不分配内存的节动态链接器读取前一对,从不读取后一对.

广州`strip --strip-all`删除`.symtab`,我知道.`.strtab`,我知道.`.debug_*`和 `.comment`△所有分配内存的节都会保留:`.interp`,我知道.`.dynsym`,我知道.`.dynstr`,我知道.`.gnu.hash`,我知道.`.gnu.version*`,我知道.`.rela.dyn`,我知道.`.rela.plt`,我知道.`.plt`,我知道.`.text`,我知道.`.rodata`,我知道.`.eh_frame`,我知道.`.init_array`,我知道.`.dynamic`,我知道.`.got`,我知道.`.got.plt`,我知道.`.data`,我知道.`.bss`及注:节头将保留,除非添加`--strip-section-headers`运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行 运行`llvm-strip --strip-sections`,我知道.`--strip-debug`留符号.`--only-keep-debug`写出调试文件,然后可用`--add-gnu-debuglink`在剥离后的文件中引用它,并`.gnu_debuglink`中保存 CRC32;`ld --build-id`写入`.note.gnu.build-id`便于调试器匹配二者.

## 目标文件

`clang -target x86_64-pc-windows-msvc -O1 -fno-asynchronous-unwind-tables -c`生成`main-x86_64.obj`和 `ledger-x86_64.obj`△PE格式 页面定义了这种目标文件:20 字节文件头,没有可选头,节表每项40 字节,符号表每条记录18 字节,每个节重定位记录为10 字节.

`code/main.py`中中 `CoffObject`读取这四部分. 文件头给出机器类型.`0x8664`、10 个节、37 条符号记录,以及为 0 的`SizeOfOptionalHeader`节表列出`.text`,我知道.`.data`,我知道.`.bss`六个名为`.rdata`节和`/16` `/`开头的名称是字符串表中的十进制偏移,字符串表以自己的四字节大小字段开头;`/16`解析为`.llvm_addrsig`现在,我还在`llvm-objdump -h`打印的名称──

37条记录包含辅助记录.节符号.`.rdata`节的选择值为 2,即any,每个都以MSVC修饰后的名称保存一个字符串字面量:`??_C@_04JDDJEAHN@even?$AA@`连接器都保留一个副本.`.file`辅助记录为主.c──`llvm-objdump -t`打印它们为`[ 0]`,我知道.`AUX scnlen ...`,我知道.`[ 2]`等,跳过辅助记录索引;测试会将我们的索引与名称与本文相比较.

重定位包括:`.text`中 14 条 `IMAGE_REL_AMD64_REL32`及`.rdata`中 4 条 `IMAGE_REL_AMD64_ADDR64`,我知道.`REL32`对于重定位后的节目32位地址,这相当于内置.`-4`的`R_X86_64_PC32` 记录带加数`-4`由于记录有更多数字段,而COFF记录没有.`ledger-x86_64.obj`在`0x36`,我知道.`0x84`和 `0x93`有三条`REL32`第32课`ledger-x86_64-O1.o`关于`R_X86_64_PC32`代码的格式的差异只在于这个四个写在哪里.`ADDR64`是八字节绝对地址,对应字符串指针表 `labels`像是,在视频中变为基址重定位.`R_X86_64_64`变为`R_X86_64_RELATIVE`像一个人一样.

| | ELF `Elf64_Rela` | COFF 重定位 | Mach-O `relocation_info` |
|---|---|---|---|
| 记录大小 | 24 字节 | 10 字节 | 8 字节 |
| 字段 | 偏移、`r_info` 中的类型与符号、加数 | 偏移、符号索引、类型 | 地址，随后为含 symbolnum:24、pcrel:1、length:2、extern:1、type:4 的 32 位字 |
| 加数 | 显式给出 | 无，存于被修正字段内 | 无，或在真正记录之前有一条 `ARM64_RELOC_ADDEND` 记录 |
| 对 `puts` 的调用 | `R_X86_64_PLT32 puts-0x4` | `IMAGE_REL_AMD64_REL32 puts` | `ARM64_RELOC_BRANCH26 _puts` |

## 导入,导出与基址重定位

`tiny-x86_64.exe`由`build_tiny_pe.py`写出,共 2,560 字节. 它与微型ELF的任务相同:调用.`msvcrt.dll`中中 `puts`和 `exit`,它还导出了一个名称,并带着一个基址重定位,因此本课需要三个目录.`pefile`其他国家`llvm-objdump -p`它们都能读取它,它们的捕获输出都是测试具.

逐步浏览头部──MS-DOS 以`MZ`开头,在偏移`0x3c`处保存 `e_lfanew`值为`0x40`,我知道.`0x40`处是签名`PE\0\0` 随后是COFF文件头:机器类型`0x8664`个节,一个节.`SizeOfOptionalHeader`对于 240 个特征值`0x22`支持土地址) 可选头`Magic`字段开头,值为`0x20b`表示PE32+──`AddressOfEntryPoint`为`0x1000`没有任何`ImageBase`为`0x140000000`没有任何`SectionAlignment`为`0x1000`没有任何`FileAlignment`为`0x200`没有任何`SizeOfImage`为`0x5000`没有任何`Subsystem`为3(控制台)`DllCharacteristics`的`0x8160`解码为`HIGH_ENTROPY_VA 0x0020`,我知道.`DYNAMIC_BASE 0x0040`,我知道.`NX_COMPAT 0x0100`和 `TERMINAL_SERVER_AWARE 0x8000`△随后有16个由RVA和大小组成的数据目录.其中4个已设置:导出目录位于`0x2080`小`0x4d`导入目录位于`0x2000`小`0x28`基址重定位目录位于`0x4000`小`0xc` 位于`0x2040`小`0x18`,我知道.

映像中的地址是RVA,即对载基址的偏移.`.text`的RVA为`0x1000`文件`0x200`其他`.rdata`的RVA为`0x2000`位于`0x400`其他`.data`的RVA为`0x3000`位于`0x600`其他`.reloc`的RVA为`0x4000`位于`0x800`,我知道.`PeImage.rva_to_offset()`实现的就是这个表.

### 导入目录

车`0x2000`处由20字节导入描述符组成,以全零描述符终止的数组. 我们的数组只有一个:导入查找表.`0x2028`、时间 0、转发链 0、名称 `0x2068`、导入地址表 `0x2040`△名称 RVA 指向 msvcrt.dll──查找表保存 64 位条目,以零结束──第 63 位置位表示按序号导入,序号位于第 15 至 0 位──第 63 位清零表示第 30 至 0 位是提示/名称 条目的 RVA:先是 16 位提示值,即导出名称指针表中的索引,然后是 ASCII 名称──我们的条目为`0x2058`提示值:`0x2060`(提示值 0,出口)

规范指出,在视频绑定之前,与导入查找表的内容完全相同.`0x2040`两种RVA,测试验证`0x2028`处的24字节等于`0x2040`处的 24 字节──绑定期间,导入地址表的条目会被导入符号的 32 位(PE32) 或 64 位(PE32+) 地址覆盖──Windows 加载器在入口点运行前完成此事──这里没有延迟绑定,也没有──代码直接访问槽位:

```text
    100b: ff 15 2f 10 00 00    call qword ptr [rip + 0x102f]   # 0x1011 + 0x102f = 0x2040, the IAT slot of puts
    1013: ff 15 2f 10 00 00    call qword ptr [rip + 0x102f]   # 0x1019 + 0x102f = 0x2048, the IAT slot of exit
```

`FF /2`是间接近调用. 两条命令的字节相同,因为后者位于前者后的八字节,读取的槽位也位于前一槽位后的八字节.`iat_calls()`在代码节中扫描`ff 15`增加六和位移,再依据导入目录为槽位命名.

### 导出目录

车`0x2080`处是 40 字节导出目录表:标志、时间、版本、指向tiny-x86_64.exe的名称 RVA、序号基数 1、1个地址表条目、1个名称指针──随后有三张表──`0x20a8`处的导出地址表保存一个RVA `0x1000`,我知道.`0x20ac`处的导出名称指针表保存一个指向字符串tiny_entry的RVA──`0x20b0`处的导出序号表保存一个16位未加基数的索引 0──名称 `k`映射到地址条目`ordinals[k]`导出序号为`ordinals[k] + ordinal base`规范还补充了一个我们没有使用的规则:如果地址条旨在导出节内,它就是一个转发字符串,例如`MYDLL.expfunc`名称指针表则按字典序列,以支持二分查找──

### 基址重定位

`.reloc`保存多块. 每块以页面 RVA 和块大小开头,然后是16位条目,高四位为类型,低十二位为页面内偏移. 我们唯一的块包含:页面.`0x3000`、大小 12、条目 `0xa000`、类型10:即`IMAGE_REL_BASED_DIR64`、偏移0,以及一个类型0的填充条目`IMAGE_REL_BASED_ABSOLUTE`│ │ │ │ │ │ │ │`0x3000`处的八字节保存`0x1400020d0`视频基址加上字符串被手动链接的RVA. 如果载体将视频放到其他位置,它就将基址差值加到该字段.规范说明:视频文件不包含COFF重定位......视频以 .reloc节中的基址重定位形式包含重定位信息.`/DYNAMICBASE`现在,我们有视频.`.reloc`和 `DYNAMIC_BASE`,我知道.

没有可分离的符号表.`PointerToSymbolTable`对于视频应为零,因为COFF调试信息已被放弃,名称存储在单独的PDB中.`.pdata`在其中,`RUNTIME_FUNCTION`条目的是出于每个分配空间或调用其他函数的函数的起止地址──叶函数不在表中──

## 机器人 映像:加载命令,与间接符号表

`ledger_main`链接后的手 64 可执行文件.`otool -h`印19条 装载命令和标志`0x00200085`,我知道.`MH_NOUNDEFS 0x1`,我知道.`MH_DYLDLINK 0x4`,我知道.`MH_TWOLEVEL 0x80`和 `MH_PIE 0x200000`相加即得到该值.`LC_SEGMENT_64`(`__PAGEZERO`,我知道.`__TEXT`,我知道.`__DATA_CONST`,我知道.`__LINKEDIT`),两条 `LC_LOAD_DYLIB`首先`@rpath/libledger.dylib`后`/usr/lib/libSystem.B.dylib`),以及各条`LC_DYLD_CHAINED_FIXUPS`,我知道.`LC_DYLD_EXPORTS_TRIE`,我知道.`LC_SYMTAB`,我知道.`LC_DYSYMTAB`,我知道.`LC_LOAD_DYLINKER`,我知道.`LC_UUID`,我知道.`LC_BUILD_VERSION`,我知道.`LC_SOURCE_VERSION`,我知道.`LC_MAIN`,我知道.`LC_RPATH`,我知道.`LC_FUNCTION_STARTS`,我知道.`LC_DATA_IN_CODE`和 `LC_CODE_SIGNATURE`,我知道.`MachoFile.command_names()`返回与`otool -l`相同且顺序一致的列表.

`__TEXT`从`0x100000000`开始.`__text`位于`0x100000558`长 256 字节,只有`main`由于四个账本函数位于Dylib 中.`__stubs`位于`0x100000658`长84字节,包含七个十二字节──`__DATA_CONST`从`0x100004000`开始,包含长 64 字节的 `__got`它们中有8个指针槽位,节型为`S_NON_LAZY_SYMBOL_POINTERS`包含长 32 字节的`__const`其他`main.c`的`fns[]`和 `names[]`面包

### 手工解析一个

`_puts`位于`0x100000694`其他:

```text
    30 00 00 90    adrp x16, 0x100004000
    10 1e 40 f9    ldr  x16, [x16, #0x38]
    00 02 1f d6    br   x16
```

`0x90000030`是 `adrp`寄存器编号在低五位,值为16──`immlo`在第30至29位,值为0`immhi`在第23至5位,值为1──结果为`immhi << 2 | immlo = 4`单位为4,096字节的页面,因此目标页面是指令所在页面.`0x100000000`加上`0x4000`,我知道.`0xf9401e10`是 `ldr`带有按8缩放的无符号12位偏移:第21至10位为7,乘8为`0x38`为了让我们可以`0x100004038`,我知道.`0xd61f0200`是 `br x16`64 源码中的手 64 正是这个命令`StubAtom`,我知道.

槽位属于哪个名称,由间接符号表决定.`LC_DYSYMTAB`指向15个符号表索引.`reserved1`指出自己那段索引的起点,用`reserved2`指出每个大小(12);;指针节使用 `reserved1`每个槽位为八字节.`__stubs`从索引 0 开始,`__got`从索引7开始,因此 5映射到符号表条目10即`_puts`没有任何`__got`槽位 7 也映射到同一条目.`otool -Iv`打印这两个索引,`indirect_table()`复现其中每一行.

### 两级命名空间

`nm -m`打印`(undefined) external _puts (from libSystem)`和 `(undefined) external _grade (from libledger)`库的信息来自符号记录本身.`nlist.h`将`GET_LIBRARY_ORDINAL(n_desc)`定义为`n_desc`十五至八位:1对应第一条`LC_LOAD_DYLIB`对于第二条,`0xfe`表示动态查找,`0xff`表示可执行文件.`ld(1)`说明:使用 -two_levelnamespace (默认选项) 时,链接器只在命令行指定的dylib中查找符号,并记录它们在哪个dylib中找到──`nm_lines()`根据`n_type`,我知道.`n_sect`,我知道.`n_desc`和 `n_value`染十二条记录,测试将其输出和捕获`nm -m`逐行比较.`-Wl,-flat_namespace`重新链接,再读取 `otool -h`现在可以看到`MH_TWOLEVEL`位消失.

## 逐字节理解链式修改

`LC_DYLD_CHAINED_FIXUPS`是一条`linkedit_data_command`其他:`dataoff 0x8000`,我知道.`datasize 208`〔这208〕字节 遵循`fixup-chains.h`,我知道.

头部有七个32位字段:`fixups_version 0`,我知道.`starts_offset 32`,我知道.`imports_offset 80`,我知道.`symbols_offset 112`,我知道.`imports_count 8`,我知道.`imports_format 1`(`DYLD_CHAINED_IMPORT`) `symbols_format 0`没有压缩`llvm-objdump --macho --chained-fixups`打印这七个值,测试对它们进行比较.

偏移 32 处是`dyld_chained_starts_in_image`其他:`seg_count 4`和四个偏移,每个段子,没有修改的段取零.`__DATA_CONST`有修改.`dyld_chained_starts_in_segment`内容为`size 24`,我知道.`page_size 0x4000`,我知道.`pointer_format 6`(`DYLD_CHAINED_PTR_64_OFFSET`目标是虚拟内存移动)`segment_offset 0x4000`,我知道.`max_valid_pointer 0`,我知道.`page_count 1`并且一个为0的`page_start`,我知道.`DYLD_CHAINED_PTR_START_NONE`其他`0xffff`表示该页面没有修改.

链从文件移动`0x4000 + 0`开始──每 64 位字体携带两条信息:应在此写什么,以及下一个字体在哪里──

```text
  dyld_chained_ptr_64_bind    ordinal:24  addend:8  reserved:19  next:12  bind:1 = 1
  dyld_chained_ptr_64_rebase  target:36   high8:8   reserved:7   next:12  bind:1 = 0
```

读取第一个字`0x8010000000000000`◎第 63 位置位,表示绑定──`next`位于第62 至 51 位,值为`0x002`单位为4字节,因此下一个修正在八字节后――序号为0――读取`0x4058`处的第十二个字母`0x00000000000006db`△第 63 位清零,表示重设基址──`next`为0,表示链结束.`0x6db`现在,这是虚拟内存移动,加上视频基址.`0x100000000`后成为`0x1000006db`其他`__cstring`中的字符串odd──前一个字符`0x00100000000006d6`则将`names[0]`重设基址后指向平──

遍历访问十二个字:`__got`序号为0到7的8次绑定,`__const`中序号为0的两次绑定`fns[]`两条条都指向`_grade`),以及`names[]`两次基址重设`chained_fixups()`返回它们及其文件偏移和原始字,测试将12对 `(offset, raw)`与`dyld_info -fixup_chain_details`比较,后者对第一项打印`raw: 0x8010000000000000 bind: (next: 002, bindOrdinal: 0x000000)`,我知道.

偏移 80 处的导入表有八个32 位条目:`lib_ordinal:8`,我知道.`weak_import:1`,我知道.`name_offset:23`名称位于偏移 112──序号0到3是来自库1的`_grade`,我知道.`_grade_label`,我知道.`_percent_change`,我知道.`_total`序号4到7是来自库2的.`___stack_chk_fail`,我知道.`___stack_chk_guard`,我知道.`_printf`,我知道.`_puts`,我知道.`fixup_rows()`连接两张表,生成 `dyld_info -fixups`打印的行,例如`__DATA_CONST __got 0x100004038 bind libSystem/_puts`测试比较全部十二行

因此,`0x100004038`处的损坏指针实际上是导入7――在加载时穿过链接一次,并将`_puts`果在WWDC22演讲中解释说:在数据中64位指标位置,有些位包含到下一个修正位置的偏移.其中还打包了一个位,用来说明该修正是绑定还是基址重设.Xcode 13将该格式设置为部署目标 macOS 12或iOS 15的默认格式,Xcode 13.3也扩展到 macOS 11和iOS 13.4.`main`运行前完成绑定――

### 它替代了布局

`ledger_main_nochain`使用相同的链接过程,但添加`-Wl,-no_fixup_chains`,它被改用了.`LC_DYLD_INFO_ONLY`包含四张字节编码表:基址重设8字节"",绑定72字节"",延迟绑定120字节"",导出64字节"",它还有链式文件中不存在的三个节目:`__TEXT,__stub_helper`只有16字节且保存`___stack_chk_guard`与`dyld_stub_binder`的`__got`及`__DATA,__la_symbol_ptr`们的生活,`dyld_info -fixups`列出七行 `lazy-bind`和七条基址重设,每条都将有一个延迟槽位指向它在`__stub_helper`中自己的跳板──跳板将索引并跳到`dyld_stub_binder`后者解析名称并写入槽位──这是前文 PLT 和 GOT 的马克-奥形态:`__la_symbol_ptr`应对`.got.plt`没有任何`__stub_helper`对应 PLT0 和 `pushq $index`没有任何`dyld_stub_binder`应对`_dl_runtime_resolve`,我知道.`code/main.py`报告文件的偏移和节,但不解码绑定操作码;实践实验要求完成这一部分.

### 导出字典树

`LC_DYLD_EXPORTS_TRIE`是一个前树──每个节点先是 uleb128 编码的终端数据大小;若非零,接着是 uleb128 标志和 uleb128 偏移;然后是一个字节的子节点数量;每个节点包含一个字符串边和一个 uleb128 节点偏移──`exports_trie()`穿过树林.`libledger.dylib`现在,它回来了.`_percent_change 0x410`,我知道.`_grade 0x428`,我知道.`_total 0x464`,我知道.`_grade_label 0x498`其他`dyld_info -exports`印的四个偏移.`__mh_execute_header`,我知道.`_fns`和 `_main`,我知道.

## 脱衣 留下什么

果的`strip(1)`解释说,当动态链接可执行文件不带选项运行时,其行为相当于`-u -r`保留未定义符号和动态引用的符号.`-x`删除本地符号――`-N`删除整个符号表和字符串表. 对于动态共享库,最大剥离级别通常是 -x,因为动态链接过程只使用全局符号.

我们在测试中观察到:`strip ledger_main`将`LC_SYMTAB`从 12 条减为 10 条,并删除 `_main`,我知道.`_fns`和 `_names`八个未定义的导入保留下来,因为需要它们的名称来绑定;`__mh_execute_header`也保留,因为它是`REFERENCED_DYNAMICALLY`△第十条记录是一个类型为`N_OPT`、名为 `radr://5614542`果工具写入它,以保证表永远不会空.`nm`不印它. 剥离后的程序印出与原版相同的三行,并以0退出.`LC_FUNCTION_STARTS`仍然有一个起点,即`main`,我知道.

带选项`strip libledger.dylib`比手册中通常的`-x`更彻底:`LC_SYMTAB`有一个记录,`nm`印无符号──导出字典树仍在相同偏移处列出四个函数,因为已过字典树绑定,从不过`LC_SYMTAB`,我知道.`LC_FUNCTION_STARTS`仍然有四个起点.`main.c`链接器也依赖于这个字典树.

| 内容 | ELF 在 `--strip-all` 后 | PE 映像 | Mach-O 在 `strip` 后 |
|---|---|---|---|
| 静态符号表 | 删除 | 映像中从不存在 | 本地名称与已定义名称被删除，未定义导入保留 |
| 加载器绑定的名称 | `.dynsym` 和 `.dynstr` 保留 | 导入目录保留 | 导入保留在 `LC_SYMTAB` 和链式导入表中 |
| 导出的名称 | `.dynsym` 保留 | 导出目录保留 | 导出字典树保留 |
| 函数起点 | `.eh_frame` 的 FDE，除非构建时禁用了展开表 | 非叶函数的 `.pdata` | `LC_FUNCTION_STARTS` 保留 |
| 调试信息 | `.debug_*` 删除 | 位于 PDB，从不在映像中 | 位于 dSYM，从不在映像中 |
| 节头或加载命令头 | 除非使用 `--strip-section-headers`，否则保留 | 保留 | 保留 |

## 没有符号时查找函数

`static-arm64-O2`将`main-arm64-O2.o`与`ledger-arm64-O2.o`链接为一个可执行文件,`__text`中有五个函数.未剥离文件.`nm -n`是真实基准:`_main`位于`0x100000500`其他地方`_percent_change`位于`0x1000005f4`(24)`_grade`位于`0x10000060c`(60),`_total`位于`0x100000648`其他国家`_grade_label`位于`0x100000740`(72) `static-arm64-O2.stripped`的`__text`中没有`N_SECT`符号:`FunctionFinder`在运行四种方法,`score()`将每个列表与真实基准进行比较.

### 开始

命令指向`__LINKEDIT`中中九字节:`80 0a f4 01 18 3c f8 01 00` 格式是128 增量,第一个以`__TEXT`地址为基准.`80 0a`为`0x500`所以第一个起点是`0x100000500`,我知道.`f4 01`为`0xf4`得到了`0x1000005f4`,我知道.`18`得到了`0x10000060c`没有任何`3c`得到了`0x100000648`没有任何`f8 01`得到了`0x100000740`没有任何`00`结束列表.`-O0`和 `-O2`链接器为展开器和崩报告器写入表,`strip`没有改变它. 格拉在Mach-O函数开始分析器中读取它,`dyld_info -function_starts`打印它,生活将它暴露出来.`function_starts`,我知道.

### 序言扫描

吉德拉的AARCH64 起点模式以`fd 7b bf a9`开始,即`stp x29, x30, [sp, #-0x10]!`在我们的文件中,它在两个优化级别中只能找到0/5──clang先生成`sub sp, sp, #N`转移到正确的`stp x29, x30, [sp, #M]`由于此,从未出现过前索引形式.`sub sp, sp, #imm`使用掩码`(word & 0xff0003ff) == 0xd10003ff`在每个函数都有`-O0`下能找到5/5,而在`-O2`下只找到1/5,因为`percent_change`,我知道.`grade`,我知道.`total`和 `grade_label`都是完全没有的叶函数.`percent_change`以 `cbz w0, ...`开始──序言扫描反映了编译器选择生成的内容,第38课已经显示,很多时候编译器根本不生成序言──

由于程序很小,所以没有错误报道.`push rbp`应对的`55`这类单字节模式,会命中其他命令的内部;因此Ghidra的x86-64模式文件会把`55 48 89 e5`这种后置模式与`ret`或`nop`这样的前置模式配对,要求前置模式结束前一个函数.

### 调用目标

`__text`中间的每个`bl`编译器不会为C代码生成跳进函数中间的`bl`编码为`0x94000000`带有有符号 26位字符偏移`0x1000005a0`处的`bl`字节为`3d 00 00 94`其他:`0x3d`是61,乘4 是`0xf4`为了实现这一目标`0x100000694`在`ledger_main`中,这是`_puts`在静态构建中,`call_targets()`收集`__text`内部目标,丢弃落入`__stubs`的目标,并加入 `LC_MAIN`进入,因为没有任何调用函数`main`△两个优化级别都得到了5/5──核子(Andriesse、Slowinska、Bos,2017) 基于此思路检测编译器生成代码中的函数;Andriesse 等人在2016年的测量表明,函数边界是反汇编的难点,比指令边界更难──

## 爱情 式签名

六射线在文档中描述了FLIRT:模式是函数前32个字节,其中所有可变字节都标记,可变字节来自修改和外部引用,模式存留在树里;在模式之后,我们从位置33开始计算字节的CRC16,直到遇到第一个可变字节,并保存该长度.模式和CRC相似的两个函数,通过尾部某个不同位置的字节来区分,再通过它们引用的名称区分.如果任何信息都无法区分冲突,则由人类智慧解决.

`signatures_from_object()`从`ledger-arm64-O2.o`和 `main-arm64-O2.o`构建这种签名,就像FLAIR的目标文件库构建签名一样.`relocation_info`记录覆盖一个四字节字,这些字节成为可变字节.`.pat`行布局依次为:模式、CRC 长度、CRC16、函数长度、`:0000`和名称,以及每个引用名称对应的`^offset name`其他:

```text
A00000342800004B890C8052087D091B000DC01AC0035FD6 00 0000 0018 :0000 _percent_change
E8CC8C52C8CCAC72087C289B09FD7FD308FD62930801090B081900511F110071 04 9AAF 003C :0000 _grade ^0000 l_switch.table.grade ^0001 l_switch.table.grade
E8CC8C52C8CCAC72087C289B09FD7FD308FD62930801090B081900511F110071 04 9AAF 0048 :0000 _grade_label ^0000 l_switch.table.grade_label ^0001 l_switch.table.grade_label ^0002 _labels ^0003 _labels
```

`_percent_change`长 24 字节,因此模式就是整个函数,CRC长度为 0。`_grade`长 60 字节,第一个重定位在 36 字节,因此CRC 覆盖四个字节──CRC16 使用公开 `.pat`解析器中的算法:多项式`0x8408`初值`0xffff`取反,再交换两个字节.`0x6e90`测试将此值固定下来.

`match_signatures()`在已经分离的构建中,每个函数起点尝试每个签名,先匹配模式,再匹配CRC.`-O0`下,五个函数都恢复名称,没有冲突.`-O2`下,上两条发生冲突.`grade_label`,我在.`grade`两个函数共享前36个字节以及四个CRC字节.`0x10000060c`和 `0x100000740`尾部将它们分开:字节 44 处,`_grade`是 `20`没有任何`_grade_label`是 `28`分别对应`ldr w0, [x9, w8, uxtw #2]`与`ldr x8, [x9, w8, uxtw #3]`长度分别为60和72――报告记录两次冲突和决定字节――两种优化级别都成功命名 5/5――

测试`test_object_bytes_equal_linked_bytes_outside_relocated_words`检查这个前提:每个目标文件函数的所有非可变字节,都等于已链接可执行文件的相同偏移的字节,因此链接器只修改了重定位的字节.`_total`没有重定位,也完全没有可变字节.

### 工具如何运用同样思路

附加处理器的FLIRT签名,以及用于构建签名的签名`sigmake`工具;IDA Free 仅支持x86 和 x86-64,限于非商业使用.Lumina 是一个以函数 md5 为关键存储函数数据的服务器,将跳过不足32字节的函数.Ghidra 12.1.4(Apache-2.0) 有功能 ID:对助记符和寻址模式计算完整的哈希,使其能抵制链接的变化;另外有加入常量操作的特定哈希,根据配合指令评分,使用父子函数打平局;其附加数据库只覆盖Visual Studio库,从自己的二进制中可以填充自动数据库.`zg`,我知道.`z/`,我知道.`zb`),并使用`zfs`读取 爱情`.sig`文件;rizin 0.9.1(LGPL-3.0) 用`Fc`从开放的二进制创建`.pat`或`.sig`用`Fs`应用签名.

根据其文档,IDA 和二元忍者为闭源工具,这里介绍. 本机未安装雷达2 和里津,其命令引用各自的手册和源码.`clang`,我知道.`ld`,我知道.`llvm-objdump`,我知道.`otool`,我知道.`nm`,我知道.`strip`和 `dyld_info`通过探测程序运行的LIEF 1.0.0 工具 0.33 和个人资料 2024.8.26 LIEF 已阅读了所有形式,包括自 0.17.0 起支持的COFF 目标文件;它对`ledger_main`报告十次绑定和两次基址重设,即同样的十二次修正.`PEFormatError: 'DOS Header magic not found.'`拒绝了`main-x86_64.obj`没有什么可说的.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries
python3 code/main.py
```

输出是一个包含五部分的JSON报告.`elf`保存两个目标文件的重定位数量,链接规划,以及`tiny-dyn-x86_64`动态节,PLT 和 GOT.`coff`保存两个目标文件的节、重定位、函数和未定义名称──`pe`保存`tiny-x86_64.exe`标题,目录,导入,导出,基址重定位和IAT调用`macho`保存`ledger_main`、链式修改、修改行和导出,`ledger_main_nochain`其他国家和地区的经济发展`identification`保存`-O0`和 `-O2`下面的四种评价方法,以及签名和冲突

预期结构:

```json
{
  "elf": {"linkPlan": {"pltSymbols": ["puts", "printf"], "sizes": {".plt": 48, ".got.plt": 40, ".rela.plt": 48, ".rela.dyn": 48}, "...": "..."}, "tiny-dyn-x86_64": {"...": "..."}},
  "coff": {"main-x86_64.obj": {"...": "..."}},
  "pe": {"imports": [{"dll": "msvcrt.dll", "iat": "0x2040", "...": "..."}], "...": "..."},
  "macho": {"ledger_main": {"flags": "0x200085", "fixupRows": ["__DATA_CONST __got 0x100004000 bind libledger/_grade", "..."], "...": "..."}, "strip": {"...": "..."}},
  "identification": {"O2": {"methods": {"functionStarts": {"recall": "5/5"}, "prologueSub": {"recall": "1/5"}, "...": "..."}, "correctNames": 5}}
}
```

按以下顺序阅读 `code/main.py`其他:

1. `ElfFile`读取头部节 两张符号表和重定位,`dynamic_entries()`,我知道.`jump_slots()`,我知道.`plt_entries()`和 `plt0()`读取已链接视频──
2. `plan_dynamic_link()`将4.9表和5.2节应用于可重定位目标文件的重定位记录.
3. `CoffObject`读取文件头,节表,带辅助记录的18字节符号记录,以及10字节重定位记录.
4. `PeImage`读取MS-DOS 、PE 签名、可选头目录、节目,以及导入,导出和基址重定位目录,`iat_calls()`解码 `ff 15`,我知道.
5. `MachoFile`读取加载命令段段`nlist`记录、间接符号表、、链式修改、导出字典树和目标文件重定位──
6. `FunctionFinder`运行四种起点搜索器,`score()`将每种结果与真实基准进行比较.
7. `signatures_from_object()`和 `match_signatures()`构建并应用 FLIRT 式签名──
8. `parse_*`函数读取捕获的工具文本,供测试对照.

更多命令:`python3 code/main.py elf FILE`,我知道.`coff FILE`,我知道.`pe FILE`和 `macho FILE`各打印一份报告.`python3 code/main.py plan OBJECT...`打印任意一组 ELF 目标文件的链接规划――`python3 code/main.py functions STRIPPED UNSTRIPPED OBJECT...`在你自己的另一种建筑物上搜索器和签名评分.

## 实际使用

对于你构建的程序,按下列顺序使用读取器.

1. 读取头部,确定格式与类型:可重定位目标文件、可执行文件或共享库──读取器会拒绝不认识的内容,这种拒绝本身也是信息──
2. 列出导入及其提供者:使用 `DT_NEEDED`和 `.dynsym`、导入目录,或链式导入表与`LC_LOAD_DYLIB`对该列表中名称的每次调用都会离开当前视频
3. 手工沿着一次调用追赶到它的槽位.记下调用字节,或PLT字节,槽位地址,文件中的字,以及载体在那里写的内容.如果文件中的字看起来像垃圾数据,在下结论前将其作为修改来解码.
4. 标志表与输出和函数起点比较.`strip`后保留,仅调试器需要的名称则不会.说明缺失名称原本属于哪一组.
5. 在已剥离的构建上运行可用的搜索器,并利用未剥离的副本还在对照它评分.`LC_FUNCTION_STARTS`,我知道.`.pdata`或`.eh_frame`没有字节模式,并用调用目标填补空缺.
6. 根据自己的目标文件构建签名并应用.记录每次冲突及分辨其字节. 如果两个签名都声称某个名称匹配,在尾部或引用名称的决定前,该结果都应视为未知.

随着工具链变化,将捕获的工具文本与文件一起保存.

## 交互实验

### 实验 A:手工分析 PLT

在`code`目录中启动Python:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries/code
python3 -q
```

运行:

```python
from main import *
elf = load_elf("tiny-dyn-x86_64")
[(e.tag_name, e.text) for e in elf.dynamic_entries()]
elf.plt0()
[(e.symbol, hex(e.address), hex(e.slot), hex(e.slot_initial)) for e in elf.plt_entries()]
[hex(w) for w in elf.got_plt_words()]
```

在每次调用之前,先根据上文的字节计算答案.`build_tiny_dyn_elf.py`中中 `IMPORTS`改为三个名称,重建,并读取之前预测 `.plt`,我知道.`.got.plt`和 `.rela.plt`现在,我在着.

### 实验B:一个链式修改

```python
exe = load_macho("ledger_main")
stub = next(s for s in exe.stubs() if s.symbol == "_puts")
stub.lines()
raw = int.from_bytes(exe.read(stub.slot, 8), "little")
hex(raw), raw >> 63, (raw >> 51) & 0xfff, raw & 0xffffff
[(i.index, i.name, i.library) for i in exe.chained_fixups()["imports"]]
```

首先在纸上解码绑定字:绑定位以四字节为单位`next`字段、序号──然后读取八字节后的字符,确认它是下一个修正──再读取链中位于 `0x100004058`解释为什么?`next`没有什么.

### 实验C:剥离与重新链接

在目前的设置中,将一个新的程序与完全剥离后的Dlib 链接:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries/code/fixtures
clang -target arm64-apple-macos -O1 main.c -L. -lledger.stripped -Wl,-rpath,@executable_path -o /tmp/relinked
nm /tmp/relinked | grep ' U '
dyld_info -exports libledger.stripped.dylib
```

现在,我们要做什么?`LC_SYMTAB`为空,链接仍然能成功,因为链接器读取导出字典树――然后运行`python3 ../main.py macho libledger.stripped.dylib`其他`symtab`,我知道.`exports`和 `functionStarts`接着改用`-N`剥离静态构建,看看`dyld_info -function_starts`仍会打印什么.

### 实验 D:冲突

```python
from main import *
stripped = load_macho("static-arm64-O2.stripped")
sigs = signatures_from_object(load_macho("ledger-arm64-O2.o"))
[s.pat_line() for s in sigs]
starts = FunctionFinder(stripped).function_starts()
match_signatures(sigs, stripped, starts)
```

阅读两条冲突记录.`ledger-arm64-O0.o`构建签名,与`static-arm64-O0.stripped`匹配,并根据`.pat`行解释为什么`-O0`下没有冲突. 下将.`PATTERN_LENGTH`缩短到16个,统计有多少函数发生冲突.

## 实践实验

解码旧版绑定表,并添加 PE 查找器──

要求:

- 将`ledger_main_nochain`的`LC_DYLD_INFO_ONLY`基址重设、绑定和延迟绑定操作码流解码为包含段段、节段、地址、类型及目标的行,使其与捕获的行 `dyld_info -fixups`文本中21 行一致──
- 在`build_tiny_dyn_elf.py`中添加 `PT_GNU_RELRO`程序头和带`DF_BIND_NOW`的`DT_FLAGS`将`.got.plt`移入覆盖范围,使 `llvm-objdump -p`显示新头部──在固定式中 README 中说明这复现了完整的RELRO的哪一部分,以及哪一部分只能由Glibc执行──
- 为PE32+ 影像编写`.pdata`读取器以及使用`RUNTIME_FUNCTION`起始地址的函数查找器──用 `clang -target x86_64-pc-windows-msvc -c`构建一个目标文件,不加`-fno-asynchronous-unwind-tables`读取其`.pdata`重定位,并说明哪些函数是该表省略的叶函数.
- 为每一个读者编写与捕获工具文本进行比较测试.

成功标准:`python3 code/main.py macho ledger_main_nochain`打印与`dyld_info`相同的 21 行修正;微型 ELF 携带能被 `llvm-objdump`列出的`PT_GNU_RELRO`其他`.pdata`查找器命名它能找到的函数,并列出它无法找到的叶函数──

## 本课产物

本课包含`outputs/skill-linking-loading-and-stripped-binaries.md`◎将您构建的程序转化为一个报告:列出导入及提供商,将一次调用追踪到载体填充的槽位,说明`strip`删除和保留的内容,并对已剥离的构建中的函数起点和名称恢复进行评价. 它要求以未剥离的副本为真实基准,为每个结论提供捕获的工具清单,并记录每次冲突.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries
python3 code/main.py
python3 code/tests/test_main.py
```

验证应证明:

- `tiny-dyn-x86_64`动态节与`llvm-objdump -p`逐标签一致,且`DT_FLAGS_1`携带`DF_1_PIE`
- 两条`R_X86_64_JUMP_SLOT`记录与`llvm-objdump -R`一致,并分别命名`puts`和 `exit`
-  PLT0 将 GOT+8 进入并经 GOT+16 跳转,每个条目读取自己的槽位并将索引,每个槽位保存其自身 `pushq`的地址
- 微型ELF的节目和程序头条与`llvm-objdump -h -p`一致
- 两个ELF 目标文件的重定位记录与`llvm-objdump -r`一致
- 链接规划找出两个PLT符号,4次直接调用,2条相对重定位,以及微型视频各部分的大小
- 包含辅助记录的37条符号记录以及重定位与`llvm-objdump -h -t -r`一致,且`/16`解析为`.llvm_addrsig`
- `ledger`    `REL32`记录位于三个ELF`PC32`偏移处
- 首部`DllCharacteristics`和数据目录与`llvm-objdump -p`一致
- 导入目录、提示/名称 条目和IAT与 `llvm-objdump`及 `pefile`一致,且绑定之前,IAT等于查找表
- 导出目录和 `DIR64`基址重定位可正确解码,重定位后的指针指向字符串手动链接
- 车`0x100b`处的`ff 15`解析到`puts`的 IAT 槽位
- 机器人标志 十九个载荷命令名称和两个库与`otool`一致
- 七个可解码并对应到八个`__got`槽位,间接符号表与 `otool -Iv`一致
- 链式修改头部与`llvm-objdump --macho --chained-fixups`一致
- 链遍历复现`dyld_info -fixup_chain_details`它们全部是12个字母
- 修正行和导入表与`dyld_info -fixups`及 `-imports`一致
- 及其剥离副本的导出字典树与`dyld_info -exports`一致
- 对于可执行文件及其副本,`nm_lines()`等于`nm -m`
- `strip`删除`_main`,我知道.`_fns`和 `_names`保留九个名称和一条`radr://5614542`打印和输出相同的程序
- 旧布局具有`LC_DYLD_INFO_ONLY`七个延迟指针,以及指向`__stub_helper`的基址重设
- arm64 目标文件重定位与 `llvm-objdump -r`一致
- `LC_FUNCTION_STARTS`在两个优化级别中恢复5/5,并且与`nm`和 `dyld_info -function_starts`一致
- `sub sp`扫描在`-O0`找到5/5,在`-O2`找到1/5,而`stp`扫描一个也找不到
- `bl`目标加上`LC_MAIN`进入恢复 5/5
- 签名在两个优化级别中命名全部五个函数,并记录由字节44分的`grade`冲突
- 123456789的CRC16 为`0x6e90`且`main`关于"加载指令"的八字节是可变字节
- 每个不可变的目标文件字节都等于对应的已链接字节
- 演示与图形数据报告相同地址,站点模块与ES5嵌入相同数据

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

从调用点沿每次外部调用追随加载器填充的槽位;在把槽位中的字称作地址之前,先按格式定义将解码.记录加载器仍然需要什么之后,才进行符号剥离.扫描字节之前,先从链接器编写的表恢复函数起点;对照带符号副本给每个搜索器评分,并记录每次签名冲突和区分冲突的字节.

## 延伸阅读

- [System V gABI，第 5 章：程序加载与动态链接](https://www.sco.com/developers/gabi/latest/ch5.dynamic.html)
- [System V 应用二进制接口，AMD64 架构处理器补充规范：第 5.2 节与表 4.9](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Drepper，《如何编写共享库》，版本 4.1.2](https://akkadia.org/drepper/dsohowto.pdf)
- [Drepper，《ELF 符号版本控制》](https://akkadia.org/drepper/symbol-versioning)
- [Jelinek，《对 DSO/可执行文件进行少量加固以抵御利用》，binutils 邮件列表，2004-01-06](https://www.sourceware.org/ml/binutils/2004-01/msg00070.html)
- [Taylor，《链接器 relro》，2008](https://www.airs.com/blog/archives/189)
- [binutils 提交 bd7ab16b：为调用使用 PLT32，2018-02-13](https://gnu.googlesource.com/binutils-gdb/+/bd7ab16b4537788ad53521c45469a1bdae84ad4a)和 [LLVM D43383](https://reviews.llvm.org/D43383)
- [GNU Binutils：strip](https://sourceware.org/binutils/docs/binutils/strip.html)和 [llvm-objcopy](https://llvm.org/docs/CommandGuide/llvm-objcopy.html)
- [Microsoft，PE 格式](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [CALL 指令参考，FF /2](https://www.felixcloutier.com/x86/call)
- [Apple，mach-o/loader.h](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h)和 [mach-o/nlist.h](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/nlist.h)
- [Apple dyld, mach-o/fixup-chains.h](https://github.com/apple-oss-distributions/dyld/blob/main/include/mach-o/fixup-chains.h)
- [Apple ld64, stub_arm64.hpp](https://github.com/apple-oss-distributions/ld64/blob/main/src/ld/passes/stubs/stub_arm64.hpp)
- [Xcode 13 发布说明：链式修正](https://developer.apple.com/documentation/xcode-release-notes/xcode-13-release-notes)和 [WWDC22 第 110362 场，《快速链接：改善构建与启动时间》](https://developer.apple.com/videos/play/wwdc2022/110362/)
- [strip(1)](https://keith.github.io/xcode-man-pages/strip.1.html),我知道.[ld(1)](https://keith.github.io/xcode-man-pages/ld.1.html)和 [dyld(1)](https://keith.github.io/xcode-man-pages/dyld.1.html)
- [Hex-Rays，深入理解 IDA F.L.I.R.T. 技术](https://docs.hex-rays.com/core/flirt/concepts/ida-f.l.i.r.t.-technology-in-depth)和 [Lumina 概览](https://docs.hex-rays.com/add-ons/lumina/overview)
- [Ghidra Function ID 帮助](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/FunctionID/src/main/help/help/topics/FunctionID/FunctionID.html)和 [AARCH64 函数起点模式](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/AARCH64/data/patterns/AARCH64_LE_patterns.xml)
- [Vector 35，WARP](https://github.com/Vector35/warp)和 [Binary Ninja WARP 指南](https://docs.binary.ninja/guide/warp.html)
- [BinDiff 手册](https://www.zynamics.com/bindiff/manual/)和 [BinDiff 源码](https://github.com/google/bindiff)
- [Diaphora](https://github.com/joxeankoret/diaphora)
- [rizin pat.c，.pat 解析器](https://github.com/rizinorg/rizin/blob/dev/librz/sign/pat.c),我知道.[radare2 flirt.c](https://github.com/radareorg/radare2/blob/master/libr/anal/flirt.c)和 [radare2 手册：Zignatures](https://book.rada.re/signatures/zignatures.html)
- [Andriesse 等，《对完整规模 x86/x64 二进制反汇编的深入分析》（USENIX Security 2016）](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/andriesse)和 [Andriesse、Slowinska、Bos，《与编译器无关的二进制函数检测》（EuroS&P 2017）](https://danielandriesse.com/papers/eurosp-2017.pdf)
- [Bao 等，ByteWeight（USENIX Security 2014）](https://www.usenix.org/conference/usenixsecurity14/technical-sessions/presentation/bao)和 [Shin、Song、Moazzezi，《用神经网络识别二进制中的函数》（USENIX Security 2015）](https://www.usenix.org/conference/usenixsecurity15/technical-sessions/presentation/shin)
- [LIEF 更新日志](https://lief.re/doc/latest/changelog.html),我知道.[pyelftools](https://github.com/eliben/pyelftools)和 [pefile](https://github.com/erocarrera/pefile)
