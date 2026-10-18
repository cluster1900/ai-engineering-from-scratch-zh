# 调用约定与栈帧：System V、Windows x64 和 AArch64

> 反汇编能显示函数读取哪些寄存器，但只有 ABI 说明这些寄存器的含义，而 ABI 由目标文件头决定。因此，本课先读文件头，再用安排寄存器的规则逐一核对。

**Type:** Build
**Languages:** Python, C, x86-64 and AArch64 assembly
**Prerequisites:** Phase 13 · 32（从零构建 ELF）、Phase 13 · 33（反汇编与控制流）
**Time:** ~140 分钟

## 学习目标

- 根据目标文件头选择调用约定：ELF x86-64 使用 System V psABI，COFF AMD64 使用 Microsoft x64，ELF AArch64 使用 AAPCS64，Mach-O arm64 使用 Apple 变体。
- 为每种 ABI 逐字节解码一个函数的序言，将每个保存寄存器、返回地址和帧指针定位到相对入口栈指针的偏移。
- 从函数先读后写的寄存器推断参数寄存器，从入口栈指针上方的加载推断栈参数槽。
- 区分 System V 的独立寄存器序列、Microsoft x64 的按位置分配槽，以及 AAPCS64 的 NGRN 和 NSRN 计数器。
- 将每项推断与源码签名、规范规则，以及编译器在 `.pdata`、`.xdata` 和 `.eh_frame` 中生成的栈展开数据核对。
- 比较 Ghidra、IDA、Binary Ninja、radare2、rizin 和 angr 如何命名和恢复相同事实，并记录输出与源码的差异。

## 问题

你以 `-O2` 为 Linux x86-64 编译 `convention.c`，然后询问 radare2 6.2.4，`eight_args` 有哪些参数。它回答七个：`rdi`、`rsi`、`rdx`、`r8`、`r9`、`rsp+0x8`、`rsp+0x10`。C 源码却有八个参数。字节只在 `leaq (%rdx,%rcx), %rax` 中读取 `%rcx` 一次，工具的变量恢复漏掉了仅出现在地址中的寄存器。

接着你在 rizin 0.9.1 中打开同一文件的 Windows 构建。它将约定报告为 `amd64`，找到了 `r8`、`rcx`、`rdx` 和三个栈槽。目标文件是 COFF，因此约定应为 Microsoft x64，第四个寄存器参数是 `r9`，栈槽应有四个。两个工具在同一源码中漏掉了不同寄存器。

清单是指令序列，调用约定则是清单之外的契约：哪些寄存器携带参数、哪些必须由被调用者保留、返回地址和栈参数在哪里，以及调用者必须在栈指针上方预留什么空间。四份文档定义了本课的契约：System V AMD64 psABI（版本 1.0，构建日期 2025 年 3 月 12 日）第 3.2.1 至 3.2.3 节；Microsoft x64 调用约定、栈使用、序言和尾声页面（页面日期从 2018-12-17 至 2025-03-19）；Arm AAPCS64 2025Q4 版（2026 年 1 月 23 日）第 6.1 至 6.9 节；Apple arm64 平台说明。本课阅读这些规则，将其应用于同一 C 文件的三类编译结果，构建把清单转成经过核对的参数位置、保存寄存器和帧偏移列表的分析器。

```figure
re-38-three-frames
```

## 文件头决定使用哪本规范

`convention.c` 有十二个函数：`leaf_add`、`eight_args`、`mixed`、`by_value`、`big_ret`、`sum_varargs`、`keeps`，以及五个调用相同形态 `extern` 函数的调用者。结构体使用 `long long`，因为 MSVC 目标的 `long` 为 4 字节，其他目标为 8 字节，而结构体大小改变会改变约定。Apple clang 17.0.0 在本机编译七次：`-target x86_64-unknown-linux-gnu`、`x86_64-pc-windows-msvc` 和 `aarch64-unknown-linux-gnu` 各取 `-O0`、`-O2`，再用 `arm64-apple-macos` 编译 `-O2`。未安装 Linux 或 Windows 头文件，因此源码自行声明所需内容，只包含 clang 自带的 `stdarg.h` 和 `stddef.h`。

`code/main.py` 中的 `describe_object()` 读取四字节魔数和一个机器字段，从而确定契约：

| 文件头 | 字段 | 值 | 规范 |
|---|---|---|---|
| `7f 45 4c 46` ELF | 偏移 0x12 的 `e_machine` | 62 | System V AMD64 psABI |
| `64 86` COFF | 偏移 0 的 `Machine` | 0x8664 | Microsoft x64 |
| `7f 45 4c 46` ELF | `e_machine` | 183 | AAPCS64 |
| `cf fa ed fe` Mach-O 64 | 偏移 4 的 `cputype` | 0x0100000c | 带 Apple 差异的 AAPCS64 |

三个契约在下表几乎每一行都不同。每个值都来自表头所指文档，并通过夹具测试核对。

| 规则 | System V psABI | Microsoft x64 | AAPCS64 |
|---|---|---|---|
| 整数参数 | `%rdi %rsi %rdx %rcx %r8 %r9`，取下一个空闲寄存器 | `RCX RDX R8 R9`，按位置 | `x0` 至 `x7`，按 NGRN |
| 浮点参数 | `%xmm0` 至 `%xmm7`，取下一个空闲寄存器 | `XMM0` 至 `XMM3`，按位置 | `v0` 至 `v7`，按 NSRN |
| 整数结果 | `%rax`，再 `%rdx` | `RAX` | `x0`，再 `x1` |
| 浮点结果 | `%xmm0`，再 `%xmm1` | `XMM0` | `v0` |
| 结果过大，寄存器装不下 | 地址通过 `%rdi` 传入，“如同第一个参数”，再通过 `%rax` 返回 | 指针通过 `RCX` 传入，参数向右移，通过 `RAX` 返回 | 地址放在 `x8`，不影响 `x0` 至 `x7` |
| 被调用者保存 | `%rbp %rbx %r12` 至 `%r15` | `RBX RBP RDI RSI RSP R12` 至 `R15`，`XMM6` 至 `XMM15` | `r19` 至 `r29`、`SP`、`v8` 至 `v15` 的低 64 位 |
| 入口处第一个栈参数 | `8(%rsp)` | `40(%rsp)`，位于 32 字节影子存储区上方 | `0(sp)` |
| 栈指针以下 | 128 字节红区 | “视为易失” | 无红区（Apple：128 字节） |
| 调用处对齐 | 入口处 `(%rsp + 8)` 为 16 的倍数 | 序言、尾声之外按 16 字节对齐 | `SP mod 16 = 0` |
| 可变参数标记 | `%al` 保存使用的向量寄存器数上界 | 浮点值同时复制到整数寄存器 | 无寄存器标记；Apple 使用 8 字节栈槽 |

## System V：两个独立寄存器序列与红区

psABI 3.2.3 将每个参数的每个八字节单元分类为 INTEGER、SSE 或 MEMORY，然后从互不影响的两个列表分配寄存器。INTEGER 取“序列 %rdi、%rsi、%rdx、%rcx、%r8、%r9 中下一个可用寄存器”；SSE 取 `%xmm0` 至 `%xmm7`。“如果某参数的任意八字节单元没有可用寄存器，整个参数就通过栈传递”，内存参数“以逆序（从右到左）压栈”。

`eight_args(a, b, c, d, e, f, g, h)` 在 `-O2` 下占 27 字节：

```text
      10: 48 01 fe                     	addq	%rdi, %rsi
      13: 48 8d 04 0a                  	leaq	(%rdx,%rcx), %rax
      17: 48 01 f0                     	addq	%rsi, %rax
      1a: 4c 01 c0                     	addq	%r8, %rax
      1d: 4c 01 c8                     	addq	%r9, %rax
      20: 48 03 44 24 08               	addq	0x8(%rsp), %rax
      25: 48 03 44 24 10               	addq	0x10(%rsp), %rax
      2a: c3                           	retq
```

先使用六个寄存器，再从 `8(%rsp)` 和 `16(%rsp)` 加载两次。当 `%rbp` 为帧基址时，psABI 图 3.3 将“内存参数八字节单元 0”放在 `16(%rbp)`，这等于尚未压栈的入口处 `8(%rsp)`。`g` 位于 8，`h` 位于 16。

`mixed(int i, double d, long long l, float f)` 展示两个列表。整数占用 `%edi` 和 `%rsi`，即第一、第二个 INTEGER 寄存器；double 和 float 占用 `%xmm0`、`%xmm1`，即第一、第二个 SSE 寄存器。首条指令是 `cvtsi2sd %edi, %xmm2`，其中 `%xmm2` 是先写后读的临时寄存器。若分析器把 `cvtsi2sd` 的目标视为读取，就会虚构第三个浮点参数。radare2 正是这样，将 `mixed` 报告为位于 `xmm0`、`xmm1`、`xmm2` 的 `(double arg1, double arg2, double arg3)`。

`by_value(struct pair p)` 将 16 字节结构体分成两个 INTEGER 八字节单元，通过 `%rdi`、`%rsi` 传入，返回也用两个寄存器：`leaq 0x1(%rdi), %rax; leaq -0x1(%rsi), %rdx; retq`。`big_ret(long long seed)` 返回 32 字节，属于 MEMORY 类。psABI 规定“调用者提供返回值空间，并将该存储地址通过 %rdi 作为第一个参数传递”。于是 `seed` 移到 `%rsi`，函数以 `movq %rdi, %rax` 开始，因为“返回时 %rax 应包含调用者通过 %rdi 传入的地址”。

红区是 System V 的另一特征。psABI 3.2.2 规定：“%rsp 所指位置以下的 128 字节区域视为保留，信号或中断处理器不得修改。”在 `-O0` 下，`eight_args` 先执行 `pushq %rbp; movq %rsp, %rbp`，再向 `-0x8(%rbp)` 至 `-0x30(%rbp)` 存储六次，没有 `subq`。这些存储位于栈指针以下 48 字节内。`sum_varargs` 的 `-O2` 构建用 `subq $0x58, %rsp` 分配 88 字节，然后将寄存器保存区写在 `-0x58(%rsp)` 至 `-0x80(%rsp)`：最深达栈指针以下 128 字节，用满红区。用 `-mno-red-zone` 构建同一文件后，`leaf_add` 增加 `pushq %rax` 和 `addq $0x8, %rsp`，将 8 字节局部变量放到栈指针上方。

可变参数调用额外使用一个寄存器。“%al 作为隐藏参数，指定已使用的向量寄存器数量”，是 0 至 8 的上界。`call_varargs` 在 `-O2` 用 `xorl %eax, %eax` 设置它，在 `-O0` 用 `movb $0x0, %al` 设置。`sum_varargs` 首先读取它：`testb %al, %al; je` 在未使用向量寄存器时跳过八次 `movaps %xmmN` 保存。

## Microsoft x64：按位置分配、影子存储区与无红区

Microsoft 规则按位置分配。“整数参数通过 RCX、RDX、R8、R9 传入；浮点参数通过 XMM0L、XMM1L、XMM2L、XMM3L 传入。”“前四个参数中的浮点和双精度参数根据位置通过 XMM0 - XMM3 传递。”同一 `mixed` 到达时为 `%ecx`、`%xmm1`、`%r8`、`%xmm3`：槽 0 是整数，所以用 `RCX`；槽 1 是 double，所以用 `XMM1`；槽 3 是 float，所以用 `XMM3`。`XMM0` 和 `XMM2` 空着。

调用者还必须预留空间。“调用者始终必须分配足以存储四个寄存器参数的空间，即便被调用者没有这么多参数。”文档称其为影子存储区或 home 地址，四个槽“实际上归被调用函数所有”。入口处 `0(%rsp)` 为返回地址，`8(%rsp)` 至 `39(%rsp)` 为四个 home 槽，第一个栈参数位于 `40(%rsp)`。`eight_args` 在 `-O2` 读取 `0x28(%rsp)`、`0x30(%rsp)`、`0x38(%rsp)`、`0x40(%rsp)`，即 40、48、56、64。

调用者一侧展示了计算。`-O2` 的 `call8` 先执行 `subq $0x48, %rsp`，再将 5、6、7、8 存到 `0x20(%rsp)` 至 `0x38(%rsp)`，然后执行 `movl $1, %ecx` 等。72 字节由 32 字节影子区、32 字节的四个栈参数，以及使返回地址落在 16 字节边界的 8 字节组成。`call_varargs` 只有寄存器参数，仍用 `subq $0x28, %rsp` 分配：32 字节影子区加 8 字节对齐。`keeps` 压入三个非易失寄存器（24 字节），再执行 `subq $0x20, %rsp`，让 `ext` 获得返回地址下方的 32 字节影子区。

结构体遵循自己的规则。“任何装不进 8 字节，或大小不是 1、2、4、8 字节的参数，都必须按引用传递。”“16 字节参数按引用传递。”因此 `by_value` 在 `%rcx` 的隐藏结果指针之后，通过 `%rdx` 接收结构体副本指针：“调用者必须为返回值分配内存，将指针作为第一个参数传入，其余参数向右移动一位。”`call_pair` 用 `movaps` 在 `0x20(%rsp)` 构造副本，通过 `leaq 0x20(%rsp), %rdx` 传入副本，通过 `leaq 0x38(%rsp), %rcx` 传入结果缓冲区，再从 `0x40(%rsp)` 读回 `.b`。

这里没有红区。“RSP 当前地址以下的所有内存都视为易失：操作系统、调试器（在用户调试会话中）或中断处理器可能覆盖该内存。”`-O0` 的 `leaf_add` 需要 8 字节局部空间，通过入口处 `pushq %rax` 和 `retq` 前的 `popq %rcx` 获取，使用两条单字节指令代替 `subq` 和 `addq`。栈使用页面对叶函数的定义为：“叶函数不需要函数表条目。它不能修改包括 RSP 在内的任何非易失寄存器。”

可变参数被调用者会把寄存器写入 home 槽。“对于可变参数或无原型函数，浮点值必须同时复制到对应的通用寄存器。”`sum_varargs` 在 `-O2` 先执行一次 `pushq %rax`，再将 `%rdx`、`%r8`、`%r9` 存到 `0x18(%rsp)`、`0x20(%rsp)`、`0x28(%rsp)`，即入口偏移 16、24、32，分别是第二、第三、第四个寄存器参数的 home 槽。其 `va_list` 为 `leaq 0x18(%rsp), %rax`，即 `%rdx` 的 home 槽，也是第一个未命名参数。

## AAPCS64，以及 Apple 的修改

AAPCS64 6.8.2 使用两个计数器逐条应用规则。C.9 规定整数参数“复制到 x[NGRN] 的最低有效位”，然后增加 NGRN；C.1 对浮点参数使用 NSRN 做同样处理。C.12 规定不超过 `8 - NGRN` 个双字的复合类型“复制到连续通用寄存器”。C.13 规定参数一旦进入栈，“NGRN 设为 8”，之后不再回到通用寄存器。`eight_args` 使用 `x0` 至 `x7`，不触碰栈。`mixed` 为 `w0`、`d0`、`x1`、`s1`。`by_value` 的输入和输出都是 `x0`、`x1`。

6.9 规定，若结果可通过寄存器传参，“就通过相同寄存器返回”；否则“内存块地址应通过 x8 作为附加参数传入函数”。`big_ret` 写入 `str x0, [x8]`、`stur q0, [x8, #0x8]`、`str x9, [x8, #0x18]`，从不写 `x0`。`call_big` 设置 `mov x8, sp`，而 `seed` 仍留在 `x0`，因为 6.9 还说明“被调用者无须保留 x8 中的值”，且 `x8` 不是参数寄存器之一。

6.1.1 规定：“子程序调用必须保留寄存器 r19-r29 和 SP 的内容。”6.4.5.2 规定在公共接口处满足“SP mod 16 = 0”。栈为满递减栈，“任何线程都不得读写”其下方的非活动区域，因此 Linux `-O0` 的 `leaf_add` 为 8 字节局部变量生成 `sub sp, sp, #0x10`，而 System V 在这里使用红区。

6.4.6 定义帧记录：“栈上由两个 64 位值构成的帧记录……低地址双字应指向前一帧记录，高地址双字应包含进入当前函数时传入 LR 的值。”“未规定帧记录在栈帧中的位置。”clang 在这个文件中展示了两种位置。Linux `-O2` 的 `keeps` 用 `stp x29, x30, [sp, #-0x30]!; mov x29, sp` 将记录放到底部；同一函数在 `-O0` 用 `sub sp, sp, #0x20; stp x29, x30, [sp, #0x10]; add x29, sp, #0x10` 将它放到顶部。

Apple arm64 说明保留寄存器和对齐规则，修改帧、红区及可变参数调用。“帧指针寄存器 x29 必须始终指向有效帧记录；某些函数，例如叶函数或尾调用，可以不在此列表中创建条目。”Apple 的 `keeps` 先保存 `x22, x21, x20, x19`，再将记录放在顶部：`stp x29, x30, [sp, #0x20]; add x29, sp, #0x20`。“平台保留 x18，不要使用它。”“ARM64 红区由栈指针正下方的 128 字节组成”，但 clang 对 `-O0` 叶函数仍生成 `sub sp, sp, #0x10`，所以默认不使用红区。可变参数分配到“适当数量的 8 字节栈槽”，“va_list 类型是 char* 的别名”。Apple 上 `call_varargs` 将 10、20、30 存入 `[sp]`、`[sp, #8]`、`[sp, #0x10]`，只传 `w0`；Linux 构建传 `w1`、`w2`、`w3`，并以 `b extva` 尾调用。Apple 的 `sum_varargs` 将 `add x8, sp, #0x10`，即调用者栈指针，作为 `va_list`；Linux 的 `sum_varargs` 将 `x1` 至 `x7`、`q0` 至 `q7` 保存到 224 字节帧中，并通过 `mov x8, #-0x38; movk x8, #0xff80, lsl #32` 将结构字段 `__gr_offs` 初始化为 -56、`__vr_offs` 初始化为 -128。

符号也不同。Mach-O 为每个 C 符号添加 `_` 前缀，因此清单显示 `_keeps`，第一个函数出现在私有标签 `ltmp0` 下。分析器通过符号表重命名标签。

## 三次手动解码函数序言

`keeps(int n)` 在循环中调用 `ext(i)`，需要跨调用保留 `n`、`i` 和 `acc`，因此每种 ABI 都必须保存寄存器。读取各目标 `-O2` 构建的起始字节。

System V，共 4 字节：

1. `55` 是寄存器编号位于低三位的 `push r64`：`50 + 5`，即 `%rbp`。深度为 8，`%rbp` 保存在入口偏移 -8。
2. `41 56`：`41` 是设置了 `B` 的 REX，`56` 是 `50 + 6`。REX.B 将 6 扩展到 14：`pushq %r14`，位置 -16。
3. `53` 是 `50 + 3`：`pushq %rbx`，位置 -24。

三次压栈共 24 字节，再加返回地址的 8 字节，32 是 16 的倍数，因此循环内的 `callq ext` 无须 `subq` 就能对齐。这里没有 `movq %rsp, %rbp`，所以该构建没有帧指针。函数体将 `%rbp` 用作保存 `acc` 的被调用者保存寄存器（`xorl %ebp, %ebp`、`addl %eax, %ebp`）。尾声是镜像操作：`5b 41 5e 5d c3`。

Microsoft x64，共 7 字节：

1. `56` 是位置 -8 的 `pushq %rsi`，`57` 是位置 -16 的 `pushq %rdi`，`53` 是位置 -24 的 `pushq %rbx`。三者在此均为非易失寄存器，而 `RDI` 和 `RSI` 在 System V 下曾是参数寄存器。
2. `48 83 ec 20`：REX.W、带 8 位立即数的操作码 `83 /5`，ModRM `ec` 为 `11 101 100`，即 `subq $0x20, %rsp`。深度为 56。

56 加返回地址等于 64，满足对齐。32 字节就是应提供给 `ext` 的影子存储区。尾声页面只允许“add RSP,constant 或 lea RSP,constant[FPReg]，后接零个或多个 8 字节寄存器弹栈，再接 return 或 jmp”；实际字节为 `48 83 c4 20 5b 5f 5e c3`。

AArch64，四个字共 16 字节，小端：

1. `a9bd7bfd` 是预索引 `stp`。位 31:30 的 `10` 选择 64 位寄存器，位 25:23 的 `011` 选择预索引，位 22 为 0 表示存储。位 21:15 的 imm7 为 `1111010`，即 -6，乘以 8 得 -48。位 14:10 的 Rt2 为 30，位 9:5 的 Rn 为 31（`sp`），位 4:0 的 Rt 为 29。`stp x29, x30, [sp, #-0x30]!` 令栈指针下降 48，将 `x29` 存到 -48、`x30` 存到 -40。
2. `f9000bf5` 是带无符号 12 位偏移、按 8 缩放的 `str`：位 21:10 的 imm12 为 2，Rn 为 `sp`，Rt 为 21。`str x21, [sp, #0x10]` 对应入口偏移 -32。
3. `910003fd` 是立即数 `add`：imm12 为 0，Rn 为 `sp`，Rd 为 29。`mov x29, sp` 让帧指针指向 -48 处的记录。
4. `a9024ff4` 是带有符号偏移的 `stp`：imm7 为 4，缩放为 32。Rt2 为 19，Rt 为 20。`stp x20, x19, [sp, #0x20]` 将 `x20` 放在 -16，`x19` 放在 -8。

栈帧共 48 字节：`x29` 位于 0，`x30` 位于 8，`x21` 位于 16，24 处有 8 字节填充，`x20` 位于 32，`x19` 位于 40。记录的低地址字指向前一记录，下一个字保存 LR，符合 6.4.6。`cmp w0, #0x1` 位于第一、第二次存储之间，是调度器将它移入了序言；分析器容许栈操作之间出现比较或算术指令。

## 编译器将相同事实写了两遍

序言解析是一种推导。编译器还为栈展开器生成另一种表达，两者必须一致。

Windows 上的第二种表达是 `.pdata` 和 `.xdata`。不带 `-fno-asynchronous-unwind-tables` 构建 `-O2` 目标文件，`llvm-objdump -h` 显示 `.xdata` 为 0x34 字节，`.pdata` 为 0x48 字节。0x48 即 72，对应六条 12 字节的 `RUNTIME_FUNCTION`，每条带三个 `IMAGE_REL_AMD64_ADDR32NB` 重定位。六个函数是 `sum_varargs`、`keeps`、`call8`、`call_varargs`、`call_pair`、`call_big`。另外六个是叶函数，异常处理页面说明：“若查找不到函数表条目，则假定代码属于叶函数，RSP 直接指向返回指针。”

`keeps` 的 `.xdata` 字节为 `01 07 04 00 07 32 03 30 02 70 01 60`。`UNWIND_INFO` 开头的 3 位是 Version，随后 5 位是 Flags：版本为 1，无标志。SizeOfProlog 为 7，CountOfCodes 为 4，FrameRegister 和 FrameOffset 均为 0。每条 `UNWIND_CODE` 包含一个序言内偏移，以及一个编码操作码和信息的字节。`07 32`：在偏移 7 处，操作码 2 是 `UWOP_ALLOC_SMALL`，信息值 3 表示 `3 * 8 + 8 = 32` 字节。`03 30`：操作码 0 是 `UWOP_PUSH_NONVOL`，寄存器编号 3 是 `rbx`。`02 70`：`rdi`。`01 60`：`rsi`。这些编码按执行顺序的逆序存放，描述的三个压栈操作和 32 字节分配与 `56 57 53 48 83 ec 20` 字节完全一致。`sum_varargs` 的条目为 `01 01 01 00 01 02 00 00`：1 字节序言，包含一条编码，即分配 8 字节的 `UWOP_ALLOC_SMALL`。这就是展开器眼中的 `pushq %rax`：一次分配，因为 `%rax` 是易失寄存器，这里并没有保存寄存器值的语义。

在 Linux 上，第二条推导路径是 `.eh_frame`，它由 psABI 4.2.4 定义，并由 DWARF 5 第 6.4 节规定编码。对可重定位目标文件运行 `llvm-dwarfdump --eh-frame`，会为每个函数打印一个 FDE，并解析 `R_X86_64_PC32` 重定位，因此得到的地址范围可以直接使用。对于 `keeps`：

```text
  DW_CFA_def_cfa_offset: +16
  DW_CFA_def_cfa_offset: +24
  DW_CFA_def_cfa_offset: +32
  DW_CFA_offset: RBX -32
  DW_CFA_offset: R14 -24
  DW_CFA_offset: RBP -16
```

CFA 是调用前的栈指针，比入口栈指针高 8，因此 `RBP -16` 对应入口偏移 -8，`R14 -24` 对应 -16，`RBX -32` 对应 -24，而最深的 CFA 偏移 32 就是 24 字节栈帧加上返回地址。AArch64 上 `keeps` 的 FDE 写着 `DW_CFA_def_cfa: W29 +48`，并列出 `W29 -48`、`W30 -40`、`W21 -32`、`W20 -16`、`W19 -8`。这里的 CFA 就是入口栈指针本身，所以这些偏移无需换算就是栈帧偏移；当帧记录有效时，CFA 以 `x29` 为基准定义。`eh_frame_cross_check()` 会对两个目标文件各自的全部 12 个 FDE 做这项比较。有一个条目需要格外注意：System V 下的 `call8` 在函数体中途压入两个传出参数，因此最深的 CFA 偏移为 32，而序言栈帧大小为 8；检查时比较的是函数体中栈指针达到的最深深度 24，再加上 8。

## 各工具如何称呼这些概念

这个领域的每个工具都有表示调用约定的数据结构，也都有为函数分配调用约定的分析过程。它们的名称不同，遗漏之处也不同。闭源工具的介绍依据其文档；开源工具则已在测试样本上实际运行，输出记录与目标文件一同保存。

**Ghidra 12.1.4（Apache-2.0）。** 规则位于 SLEIGH 语言定义旁的编译器规格文件 `.cspec` 中。`x86-64-gcc.cspec` 声明了名为 `__stdcall` 的 `<default_proto>`，注明“源自 2016 年 4 月的 System V Application Binary Interface AMD64 Architecture Processor Supplement”。它使用 `<pentry>` 列表指定 `XMM0_Qa` 到 `XMM7_Qa` 以及 `RDI, RSI, RDX, RCX, R8, R9`，栈条目从偏移 8 开始，为不超过 16 字节的类型提供 `join_dual_class` 规则，输出为 `XMM0_Qa, XMM1_Qa, RAX, RDX`，其余情况使用 `hidden_return`。`x86-64-win.cspec` 声明 `__fastcall`，用四个 `<group>` 元素将 `XMM0_Qa` 与 `RCX`、`XMM1_Qa` 与 `RDX` 等逐一配对，这正是按位置分配的规则；栈条目从偏移 40 开始，对 3、5、6 或 7 字节的结构体使用 `convert_to_ptr`，注释写着“只有大小为 8、16、32、64 位的结构体才能装入寄存器”；`unaffected` 列出 `RBX RBP RDI RSI RSP R12` 到 `R15` 以及 `XMM6` 到 `XMM15`，栈偏移 8 到 39 的 `localrange` 就是影子存储区。`AARCH64.cspec` 声明 `__cdecl`，第一个条目是带有 `storage="hiddenret"` 的 `x8`，随后是 `q0` 到 `q7` 和 `x0` 到 `x7`；对 17 字节及以上的结构体使用 `convert_to_ptr`，`killedbycall` 包含 `x8`，注释写着“间接结果位置寄存器，未体现在 pentry 列表中”。反编译器的最后阶段名为“Establish Function's Prototype”；分析器名为“Call Convention ID”和“Decompiler Parameter ID”；程序选项“Prototype Evaluation”选择默认模型。

**IDA Pro 和 IDA Free（Hex-Rays，商业软件；当前版本 9.4，构建号 9.4.260714）。** 函数类型是通过 SetType 设置的 C 声明，“IDA 会使用类型信息，在反汇编中添加函数参数信息注释”。标准约定无法表达的位置使用 IDA 自己的约定书写：`int __usercall func@<ebx>(int x, int y@<esi>)` 将结果放入 `EBX`，将 `y` 放入 `ESI`；`@<^12.4>` 则通过偏移和大小指定栈位置。`__userpurge` 与之相同，但由被调用者清理栈。同一页面还列出表示被破坏寄存器集合的 `__spoils`，以及表示本课手工恢复的隐式参数的 `__hidden`、`__return_ptr` 和 `__struct_ptr`。反编译器的“Decompile as call”操作允许为单条指令指定 `__usercall` 原型。IDA Free 仅支持 x86 和 x86-64。

**Binary Ninja 6.0“Krypton”（Vector 35，商业软件；另有可反编译 x86、x86_64、ARMv7 和 AArch64 的 Free 版本）。** `Platform`“包含与二进制执行环境有关的全部信息，主要是所用调用约定、操作系统和架构”，平台列表包括 `linux-x86_64`、`windows-x86_64`、`linux-aarch64` 和 `mac-aarch64`，每个平台都有 `default_calling_convention`。`CallingConvention` 包含 `int_arg_regs`、`float_arg_regs`、`callee_saved_regs`、`caller_saved_regs`、`int_return_reg`、`high_int_return_reg`、`float_return_reg`，以及两个直接编码本课差异的标志：`arg_regs_share_index` 表示“为 True 时，无论参数类型如何，第 N 个参数都会占用整数和浮点寄存器列表中的第 N 个槽位”；`stack_reserved_for_arg_regs` 表示“Windows x64 调用约定使用的影子／归位空间”。`eligible_for_heuristics`、`required_arg_regs` 和 `required_clobbered_regs` 驱动其启发式调用约定检测。平台类型是 `types/platform/` 下的 C 头文件，每个平台名称对应一个文件。

**radare2 6.2.4（LGPL-3.0，本课已实际运行）。** `afcl` 列出架构插件已知的调用约定：x86-64 下为 `amd64 amd64syscall dlang golang golang_abi0 ms p9 reg swift`，AArch64 下为 `arm64 dlang golang p9 reg swift`。`afc` 报告当前函数的调用约定，`afcr` 打印从 `cc.amd64.arg0: rdi` 到 `arg5: r9` 以及 `ret0: rax` 的信息，配置保存在名为 `cc-ARCH-BITS.sdb` 的 SDB 文件中。radare2 为 ELF 目标文件选择 `amd64`，为 COFF 目标文件选择 `ms`，这一区分是正确的。`afv` 列出参数和变量，`afs` 打印签名。对于 Linux 的 `-O2` 目标文件，`afv` 为 `eight_args` 找到了七个参数，漏掉了 `rcx`；对于 Windows 目标文件，它找到了 `rcx, rdx, r8` 和四个栈槽位，漏掉了 `r9`。两个漏掉的寄存器都只出现在 `lea` 内部。对于 `mixed`，它在 Linux 上报告 `double arg1 @ xmm0, arg2 @ xmm1, arg3 @ xmm2`，在 Windows 上则完全没有报告参数。对于 AArch64，它为 `eight_args` 找到了 `x0` 到 `x7`；对 `big_ret` 则列出 `x0` 和 `double arg2 @ d1`，而函数实际读取的是 `x8`，并将一个常量加载到 `q1`。每个 `afs` 签名都以 `void` 开头，因为工具没有推断返回类型。在 `-O0` 下，每个参数都存入栈帧，`afv` 因而找到了 `eight_args` 的全部八个参数，其中两个栈参数位于 `rbp+0x10` 和 `rbp+0x18`。

**rizin 0.9.1（LGPL-3.0，本课已实际运行）和 Cutter 2.5.0。** `afcl` 列出 `amd64 amd64syscall ms reg swift`。`afc` 对 COFF 目标文件返回 `amd64`，说明 Microsoft 配置虽然存在，却没有根据文件格式被选中。`afi` 对 Linux 上的 `eight_args` 列出七个参数，同样漏掉 `rcx`；对 Windows 则列出 `r8, rcx, rdx` 和三个栈槽位，既漏掉 `r9`，也漏掉 `0x40` 处的槽位。`afv` 不存在；列出变量的命令是 `afvl`。Cutter 是 rizin 的图形前端。

**angr 10.0.3（BSD-2，本课已实际运行）。** 先运行 `CFGFast`，再运行 `CompleteCallingConventions(recover_variables=True)`，会根据二进制格式将 `function.calling_convention` 设为 `SimCCSystemVAMD64`、`SimCCMicrosoftAMD64` 或 `SimCCAArch64`，并将 `function.prototype` 设为一个签名。它在三个目标平台上都恢复了 `eight_args` 的全部八个参数；将 x86-64 上 `big_ret` 的隐藏指针恢复为 `(BOT*, long long) -> BOT*`，将 Windows 上 `by_value` 按引用传递的结构体恢复为 `(BOT*, BOT*) -> BOT*`，将 System V 下的可变参数函数 `sum_varargs` 恢复为 `(long long, ...)`。它的不足与 radare2 不同：System V 和 AArch64 上的 `mixed` 都被恢复为 `(long long, long long, double, float)`，寄存器正确但顺序错误，因为整数列表打印在浮点列表之前；AArch64 上的 `big_ret` 被恢复为 `(long long) -> double`，说明它漏掉了 `x8` 约定，并将向量存储操作误读为结果；AArch64 上的 `sum_varargs` 则被恢复为 16 个参数，也就是整个寄存器保存区。

**其他工具。** Hopper 6.6.0 是面向 macOS 和 Linux 的商业反汇编器和反编译器；本课未运行或记录其调用约定处理情况。lldb 1703 和 gdb 可通过 `frame info` 和 `register read` 显示实时栈帧，这是第 42 课对同一组偏移的动态观察方式。Compiler Explorer 可从源码并排显示三份汇编清单，是在字节中寻找某条规则前确认它的最快途径。

| 概念 | Ghidra | IDA | Binary Ninja | radare2 / rizin | angr | 本课 |
|---|---|---|---|---|---|---|
| 调用约定对象 | `.cspec` 中的 `prototype` | 函数类型中的调用约定关键字 | `Platform` 上的 `CallingConvention` | `afc` 名称、`cc-ARCH-BITS.sdb` | `SimCC` 子类 | `expected_locations(abi, name)` |
| 各目标平台的默认约定 | 每个 cspec 的 `<default_proto>` | 编译器设置 | `Platform.default_calling_convention` | `afc=`、`anal.cc` | 按格式选择 | `describe_object()` |
| 参数寄存器 | `<pentry>` 列表，用 `<group>` 表示按位置分配 | `__usercall` 中的 `@<reg>` | `int_arg_regs`、`float_arg_regs`、`arg_regs_share_index` | `cc.NAME.argN` | `ARG_REGS`、`FP_ARG_REGS` | `INT_ARG_REGS`、`FLOAT_ARG_REGS` |
| 影子存储区 | `localrange` 的栈偏移 8 到 39 | 隐式处理 | `stack_reserved_for_arg_regs` | `cc.ms.argn=stack` | `STACKARG_SP_DIFF` | `STACK_ARG_BASE[WIN64] = 40` |
| 隐藏结果指针 | `hidden_return`、`storage="hiddenret"` | `__return_ptr`、`__hidden` | 返回类型大于 `int_return_reg` 的容量 | 未建模 | 第一个参数为 `BOT*` | `HIDDEN_RETURN_REG` |
| 被调用者保存寄存器 | `<unaffected>` | `__spoils` 列出相反的集合 | `callee_saved_regs` | 配置文件 | `CALLEE_CLEANUP` 和架构 | `CALLEE_SAVED` |
| 为函数指定约定 | “Call Convention ID”分析器、“Establish Function's Prototype” | 用户或类型库 | 使用 `required_arg_regs` 做启发式检测 | `afc`、`afva`、`aaft` | `CallingConventionAnalysis` | 先读后写分析加规范规则 |

## 动手构建

运行演示：

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames
python3 code/main.py
```

输出是一份 JSON 报告。对于七个目标文件中的每一个，它列出格式、机器类型和 ABI；对于十二个函数中的每一个，它给出序言字节、保存的寄存器及其入口偏移、栈帧大小、帧指针、参数寄存器、栈参数偏移、溢出保存位置、返回寄存器或隐藏指针、调用深度，以及调用者传出参数所用的寄存器和存储操作。每个函数的报告都以检查结果结尾：规则、由签名得出的期望值、从字节观察到的值，以及两者是否一致。报告最后是两种展开信息交叉检查和工具输出记录。84 次函数分析共运行 489 项检查，489 项全部一致。

预期结构：

```json
{
  "objects": {
    "convention-x86_64-windows-O2": {
      "format": "COFF", "machine": "AMD64", "abi": "Microsoft x64", "checks": "73/73 agree",
      "functions": {
        "keeps": {
          "prologue": ["56  pushq %rsi", "57  pushq %rdi", "53  pushq %rbx", "48 83 ec 20  subq $0x20, %rsp"],
          "frameBytes": 56,
          "savedRegisters": [{"register": "rsi", "entryOffset": -8}, {"register": "rdi", "entryOffset": -16}, {"register": "rbx", "entryOffset": -24}],
          "parameterRegisters": ["rcx"],
          "returnRegisters": ["rax"],
          "calls": [{"callee": "ext", "depth": 56}],
          "checks": [{"rule": "Microsoft x64: the caller must always allocate ...", "expected": "at least 32 bytes ...", "observed": [56], "agree": true}, "..."]
        }
      }
    }
  },
  "sehCrossCheck": ["..."],
  "ehFrameCrossCheck": {"...": "..."}
}
```

按以下顺序阅读 `code/main.py`：

1. `describe_object()` 读取 ELF、COFF 或 Mach-O 头部及符号表，返回 ABI 和函数列表。
2. `parse_listing()` 将 `llvm-objdump -d -r` 文本拆分为函数，保留每个调用和跳转的重定位目标，并按对应语法的标记去除注释：AT&T 使用 `#`，AArch64 使用 `//` 和 `;`，因为后者的 `#` 用来引入立即数。
3. `effect_x86()` 和 `effect_arm()` 将一条指令转换为读取、地址读取、写入、加载、存储和栈指针增量。AT&T 的最后一个操作数是目的操作数；AArch64 的第一个操作数是目的操作数，存储、比较和分支指令除外。`lea` 读取地址，但不加载任何内容。`mov`、`cvtsi2sd`、`setcc` 和清零惯用法 `xor r, r` 的目的操作数都只写不读。调用会写入整个易失寄存器集合。前索引存储在访问前移动 `sp`，后索引加载则在访问后移动它。
4. `analyze_function()` 对函数体遍历一次，直到遇到第一个 `ret` 或尾跳转。它跟踪栈指针相对入口值向下移动的深度，因此内存操作数 `disp(%rsp)` 的入口偏移为 `disp - depth`，而 `disp(%rbp)` 的偏移为 `frame_pointer + disp`。它记录先读后写的参数类寄存器、位于 ABI 第一个栈参数偏移处或其上方的加载、将参数寄存器存入栈帧的操作、对当前栈指针下方的访问，以及每次调用时的深度。
5. `_return_registers()` 会保留退出前最后一次访问为写入的结果寄存器。作为数据操作数读取会排除该候选项；作为地址基址读取则不会，因此在 Microsoft x64 下的 `big_ret` 中，`movq %rcx, %rax` 后通过 `(%rax)` 进行存储时，`rax` 仍被保留为候选结果寄存器。
6. `expected_locations()` 将三套规范应用于 C 签名：System V 的两份列表与八字节分类、Microsoft 的位置槽位与按引用传递的结构体，以及 AAPCS64 的计数器和用于大于 16 字节结果的 `x8`。
7. `run_checks()` 比较两者，并加入栈帧规则：被写入的被调用者保存寄存器必须先保存；每次调用时必须满足 `(rsp + 8) % 16 == 0` 或 `sp % 16 == 0`；每次 Microsoft 调用都必须有 32 字节影子空间；Microsoft 和 AAPCS64 下不得访问栈指针下方，System V 下最多访问其下方 128 字节；尾声必须与序言对应，并将栈指针恢复到入口值。
8. `seh_cross_check()` 和 `eh_frame_cross_check()` 读取未使用 `-fno-asynchronous-unwind-tables` 构建的目标文件的展开数据，并与序言解析结果进行比较。

另有三个命令。`python3 code/main.py analyze convention-x86_64-windows-O2 keeps` 打印单个函数。`python3 code/main.py object FILE` 打印根据头部得出的判断。`python3 code/main.py seh` 打印每个具有 `UNWIND_INFO` 的函数的解码结果。

## 实际使用

对你构建的新目标文件，按以下顺序使用分析器。

1. 运行 `python3 code/main.py object FILE.o`，记下它给出的 ABI。如果头部与构建命令不一致，先停下来；两者必有一个不对。
2. 在目标文件旁保存 `llvm-objdump -d -r FILE.o` 的输出，然后运行分析。先阅读序言字节和保存的寄存器，再看其他内容，并将栈帧大小与压栈操作及 `sub` 对照。
3. 根据源码签名核对参数寄存器和栈偏移。签名无法解释的寄存器可能是隐藏指针、可变参数标记，或被分析器误判为参数的临时寄存器。最后一种情况属于指令效果表的缺陷，应使用适用于该指令的一般规则修复。
4. 如果有检查结果不一致，逐一阅读。每项检查都注明其依据的规则，因此先检查规则，再检查字节，最后检查分析器。
5. 如果目标文件有展开数据，运行交叉检查。两条相互吻合的推导路径，是本课能够提供的最有力证据。
6. 如果安装了其他工具，记录精确命令及其输出并进行比较。一致之处有三条推导路径相互印证；不一致之处则给出一个具体寄存器和一条具体指令供你检查，这就是第 35 课所说的一项发现。

## 交互实验

### 实验 A：一条指令，三种效果

在 `code` 目录中启动 Python：

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames/code
python3 -q
```

运行：

```python
from main import *
effect(Instruction(0, "48 8d 04 0a", "leaq", "(%rdx,%rcx), %rax"), SYSV)
effect(Instruction(0, "f2 0f 2a d7", "cvtsi2sd", "%edi, %xmm2"), SYSV)
effect(Instruction(0, "a9bd7bfd", "stp", "x29, x30, [sp, #-0x30]!"), AAPCS64)
```

每次调用前，先写下你预期的读取、地址读取、写入和栈增量。然后使用 `ldp`，将 `[sp, #-0x30]!` 改为 `[sp], #0x30`，观察增量如何从 `sp_delta` 移到 `post_sp_delta`。

### 实验 B：keeps 的栈帧

```python
info, listing = load_fixture("convention-aarch64-linux-O2")
keeps = analyze_function("keeps", listing["keeps"], info.abi)
keeps.saved
keeps.frame_pointer
[c.to_dict() for c in frame_cells(keeps)]
```

将偏移与上面的手工解码结果比较。然后加载 `convention-arm64-macos-O2` 并运行相同的三行代码；帧记录会移到 -16，四个寄存器位于其下方。接着加载 `convention-x86_64-linux-O2-fp`，查看 `keeps` 的 `saved`：帧指针回来了，同时还出现一条 `pushq %rax`，它唯一的作用是让调用时的 `(rsp + 8)` 成为 16 的倍数。

### 实验 C：mixed 的先读后写分析

```python
info, listing = load_fixture("convention-x86_64-linux-O2")
mixed = analyze_function("mixed", listing["mixed"], info.abi)
mixed.param_registers
mixed.return_registers
expected_locations(SYSV, "mixed")["parameters"]
expected_locations(WIN64, "mixed")["parameters"]
```

System V 的列表为 `rdi, xmm0, rsi, xmm1`，Microsoft 的列表为 `rcx, xmm1, r8, xmm3`。现在加载 Windows 目标文件，再次运行前三行。然后打开 Linux 目标文件的 radare2 输出记录，找到 `[afv mixed]`：三个 double。找出导致第三个 double 出现的那条指令。

### 实验 D：展开器的第二份判断

```python
for row in seh_cross_check():
    print(row["function"], row["sizeOfProlog"], row["unwindPushes"], row["unwindAllocBytes"], row["agree"])
for row in eh_frame_cross_check("convention-x86_64-linux-O2-eh"):
    print(row["function"], row["cfiSaved"], row["cfiMaxOffset"], row["deepestStack"], row["agree"])
```

在 SEH 表中找到 `sum_varargs` 的 `pushq %rax`，解释为什么展开编码将它记录为分配。再在 `.eh_frame` 表中找到 `call8`，解释其中的 32。

## 实践实验

添加第四个目标平台和第四套规范。

要求：

- 使用 `-target x86_64-apple-macos -O2` 编译 `convention.c`，并记录汇编清单。扩展 `describe_object()`，使其读取 Mach-O 的 `cputype` 0x01000007，并映射到 Apple 在 x86-64 上遵循的 System V psABI，同时处理 `_` 符号前缀。
- 检查每个函数是否通过 System V 检查。记录你在序言中发现的唯一差异：Darwin 在所有优化级别都保留帧指针。
- 添加使用 `-fstack-protector-strong` 构建的 Linux x86-64 目标文件。扩展序言扫描，将从 `%fs:0x28` 加载栈金丝雀以及将其存入局部变量下方的操作记录为一个 `canary` 单元，并将 `ret` 前的比较记录为保护尾声的检查。
- 添加一项测试，确保当金丝雀存储被计为溢出保存的参数时，测试会失败。
- 在运行分析器之前，手工写出 `with_canary` 风格代码的栈帧布局，并将图示与测试放在一起。

成功标准是：`python3 code/main.py` 报告新目标文件的所有检查均一致，而且受保护函数的栈帧单元显示金丝雀位于局部变量与保存的寄存器之间。

## 本课产物

本课提供 `outputs/skill-calling-conventions-and-stack-frames.md`。使用它，将你构建的目标文件、其汇编清单和 C 签名转换为参数位置、栈帧布局、返回寄存器，并逐项核对推断是否符合所依据的规则和编译器生成的展开数据。它要求先根据头部判定 ABI，禁止将 `cvtsi2sd` 或 `xor r, r` 的目的操作数视为读取，并在首次发现不一致时停止。

## 验证

运行演示和确定性测试套件：

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明：

- 七个目标文件的 ELF、COFF 和 Mach-O 头部对应 System V、Microsoft x64、AAPCS64 和 Apple arm64
- 每个目标文件的符号表都列出相同的十二个函数，并正确处理 Mach-O 的 `_` 前缀和 `ltmp0` 标签
- 汇编清单解析器保留 `ext` 作为调用目标，并完整保留 `#-0x30` 等 AArch64 立即数
- `leaq (%rdx,%rcx), %rax` 读取两个地址寄存器而不加载数据；`xorl %eax, %eax` 和 `cvtsi2sd` 的目的操作数只写不读；前索引 `stp` 在存储前移动 `sp`，后索引 `ldp` 则在加载后移动它
- `-O2` 下的 `keeps` 在 System V 上以 `55 41 56 53` 开头，栈帧为 24 字节且没有帧指针；在 Microsoft x64 上以 `56 57 53 48 83 ec 20` 开头，栈帧为 56 字节；在 AArch64 上首先出现 `a9bd7bfd`，帧记录位于 -48
- Apple 构建将帧记录放在 -16，位于四个保存的寄存器上方
- Linux 上的每个函数在 `-O0` 下都有帧指针，在 `-O2` 下则没有；`-fno-omit-frame-pointer` 会恢复帧指针，并带来用于对齐的压栈操作
- `-O0` 叶函数在 System V 下使用 8 字节红区，在 Microsoft x64 下使用 `pushq %rax`，在 AAPCS64 下使用 `sub sp, sp, #0x10`；`-mno-red-zone` 会消除红区使用
- 每个尾声都与其序言对应，栈指针恢复到入口值
- 在两个优化级别下，`eight_args` 都分别读取六个寄存器及偏移 8、16 的槽位，四个寄存器及偏移 40 到 64 的槽位，或 `x0` 到 `x7`
- `mixed` 在 System V 下使用 `rdi, xmm0, rsi, xmm1`，在 Microsoft x64 下使用 `rcx, xmm1, r8, xmm3`，两者都用 `xmm0` 返回结果
- 16 字节结构体在 System V 和 AAPCS64 下通过两个寄存器传递，在 Microsoft x64 下则在隐藏指针之后按引用传递
- 32 字节结构体通过 `rdi`、`rcx` 或 `x8` 返回
- 可变参数被调用者会读取 `%al`，将 `rdx, r8, r9` 归位到 16、24、32，保存 `x1` 到 `x7` 和 `q0` 到 `q7`，或在 Apple 上读取调用者的栈指针
- 调用者设置预期寄存器，将 7 和 8 存到偏移 0 和 8，或将 5 到 8 存到偏移 32 到 56；在可变参数调用前清零 `%al`，并通过 `rdi`、`rcx` 或 `x8` 传递结果缓冲区地址
- 全部 489 项检查都与各自的规则一致
- 六个 `UNWIND_INFO` 条目与序言解析结果吻合，叶函数则没有这些条目
- 24 个 FDE 与保存寄存器的偏移和最深栈指针位置吻合
- 工具输出记录包含 radare2 的 `amd64` 和 `ms`、rizin 对 COFF 目标文件给出的 `amd64`、漏掉的 `rcx`、三个 double，以及 angr 的原型
- 嵌入站点模块的图示数据与分析器输出相等

## 生产环境中的失败模式

| 失败情况 | 能力不足的工具会报告什么 | 分析必须证明什么 |
|---|---|---|
| 将 COFF 目标文件按 System V 读取 | 将函数从未读取的 `rdi` 和 `rsi` 视为参数 | 头部给出 0x8664；调用约定是 Microsoft x64 |
| 寄存器只在 `lea` 内被读取 | 为八参数函数报告七个参数 | 基址和索引寄存器都属于读取 |
| 将 `cvtsi2sd` 的目的操作数计为读取 | `xmm2` 中出现第三个 double 参数 | 对 `xmm2` 的首次写入就是写入；`mixed` 只有两个 SSE 参数 |
| 将位置槽位误读为独立序列 | 将 Windows 上的 double 参数判定为 `xmm0` | 槽位 1 是 `XMM1`，槽位 3 是 `XMM3` |
| 将 `push rbp` 视为建立帧指针 | 在把 `rbp` 用作累加器的 `-O2` 函数中报告帧指针 | 只有压栈后的 `mov %rsp, %rbp` 才会建立帧指针 |
| 从入口栈指针测量红区 | “栈指针下方”有 216 字节 | 执行 88 字节的 `sub` 后，是当前栈指针下方的 128 字节 |
| 将影子存储区视为局部变量 | 栈参数位于 8 到 32 | Microsoft 栈参数从 40 开始 |
| 将 `lea` 视为加载 | 可变参数被调用者的 `0x60(%rsp)` 处有一个栈参数 | `lea` 计算的是 `overflow_arg_area`，并未加载数据 |
| 将隐藏指针视为普通参数 | `big_ret(void *, long long)` | 经由该指针执行存储，且它分别被复制到 `rax`、`rax`，或保留在 `x8` 中 |
| 将最深 CFA 与序言栈帧比较 | 对压入传出参数的调用者报告不匹配 | 应与函数体中栈指针达到的最深位置比较 |
| 根据 ISA 直接断定调用约定 | 为 COFF 目标文件报告 `amd64` | 文件格式选择规范，ISA 再选择寄存器 |
| 只信任单个工具给出的原型 | 三个 double，或十六个可变参数 | 必须得到源码签名或第二条推导路径的印证 |

## 操作准则

在读取第一条指令前先读头部，并明确所用规范。用相对于入口栈指针的偏移标定每个保存的寄存器和每个参数，再根据将它放到该位置的规则，以及编译器为同一栈帧写出的展开数据进行核对。在字节或源码确认之前，只把工具给出的原型视为一项待验证的主张。

## 延伸阅读

- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, Version 1.0 (sections 3.2.1 to 3.2.3, 4.2.4)](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Microsoft x64 calling convention](https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention)
- [Microsoft x64 stack usage](https://learn.microsoft.com/en-us/cpp/build/stack-usage)
- [Microsoft x64 prolog and epilog](https://learn.microsoft.com/en-us/cpp/build/prolog-and-epilog)
- [Microsoft x64 exception handling: RUNTIME_FUNCTION, UNWIND_INFO, UNWIND_CODE](https://learn.microsoft.com/en-us/cpp/build/exception-handling-x64)
- [Arm Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64), release 2025Q4](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst)
- [Apple: Writing ARM64 code for Apple platforms](https://developer.apple.com/documentation/xcode/writing-arm64-code-for-apple-platforms)
- [DWARF Debugging Information Format Version 5, section 6.4 Call Frame Information](https://dwarfstd.org/doc/DWARF5.pdf)
- [Clang driver frame-pointer defaults, `useFramePointerForTargetByDefault` in `CommonArgs.cpp`](https://github.com/llvm/llvm-project/blob/main/clang/lib/Driver/ToolChains/CommonArgs.cpp)
- [Clang command line reference: `-fomit-frame-pointer`, `-momit-leaf-frame-pointer`](https://clang.llvm.org/docs/ClangCommandLineReference.html)
- [Fedora 38 change: frame pointers by default](https://fedoraproject.org/wiki/Changes/fno-omit-frame-pointer)
- [Ubuntu 24.04: performance engineering with frame pointers by default](https://ubuntu.com/blog/ubuntu-performance-engineering-with-frame-pointers-by-default)
- [Ghidra compiler specification: `x86-64-gcc.cspec`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/x86/data/languages/x86-64-gcc.cspec)
- [Ghidra compiler specification: `x86-64-win.cspec`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/x86/data/languages/x86-64-win.cspec)
- [Ghidra compiler specification: `AARCH64.cspec`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/AARCH64/data/languages/AARCH64.cspec)
- [Hex-Rays: SetType and the `__usercall` convention](https://docs.hex-rays.com/ida-actions/settype)
- [Hex-Rays: Decompile as call](https://docs.hex-rays.com/ida-actions/hx_userdefinedcall)
- [Binary Ninja API 6.0: `callingconvention` module](https://api.binary.ninja/binaryninja.callingconvention-module.html)
- [Binary Ninja API 6.0: `platform` module](https://api.binary.ninja/binaryninja.platform-module.html)
- [Binary Ninja user documentation: platform types](https://docs.binary.ninja/guide/types/platformtypes.html)
- [The Official Radare2 Book: calling conventions](https://book.rada.re/analysis/calling_conventions.html)
- [The Official Radare2 Book: code analysis](https://book.rada.re/analysis/code_analysis.html)
- [angr documentation: decompiler analysis passes, including calling convention recovery](https://docs.angr.io/en/latest/analyses/decompiler.html)
- [radare2 6.2.4 release](https://github.com/radareorg/radare2/releases/tag/6.2.4)
- [rizin 0.9.1 release](https://github.com/rizinorg/rizin/releases/tag/v0.9.1)
