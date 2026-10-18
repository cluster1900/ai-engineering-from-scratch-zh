# 调用约定与:系统V、Windows x64 和AArch64

> 反汇编能显示函数读取哪些寄存器,但只有ABI说明这些寄存器的含义,而ABI由目标文件头决定.

**Type:** Build
**Languages:** Python, C, x86-64 and AArch64 assembly
**Prerequisites:** Phase 13 · 32（从零构建 ELF）、Phase 13 · 33（反汇编与控制流）
**Time:** ~140 分钟

## 学习目标

- 根据目标文件头选择调用约定:ELF x86-64 使用系统V psABI,COFF AMD64 使用微软 x64,ELF AArch64 使用AAPCS64,Mach-O arm64 使用果 变体。
- 为每种ABI 逐字节解码一个函数的序言,将每个保存寄存器,返回地址和指针定位到相对入口指针的偏移.
- 从函数先读后写的寄存器推断参数寄存器,从入口指针上方的加载推断参数槽.
- 区分 System V 的独立寄存器序列,微软 x64 的按位置分配槽,以及 AAPCS64 的 NGRN 和 NSRN 计量器.
- 根据本文的规定,`.pdata`,我知道.`.xdata`和 `.eh_frame`产生的数据核对应
- 比较Ghidra、IDA、二进制忍者、radar2、rizin 和 angr 如何命名和恢复相同的事实,并记录输出与源码的差异──

## 问题

你的`-O2`为Linux x86-64 编译 `convention.c`然后问雷达2.6.2.4,`eight_args`答案是七个:`rdi`,我知道.`rsi`,我知道.`rdx`,我知道.`r8`,我知道.`r9`,我知道.`rsp+0x8`,我知道.`rsp+0x10`源码只有八个参数.`leaq (%rdx,%rcx), %rax`中读取 `%rcx`一次,工具的变量恢复失去了仅在地址中的寄存器.

接下来你在Rizin 0.9.1中打开相同文件的Windows 构建.`amd64`找到了`r8`,我知道.`rcx`,我知道.`rdx`目标文件是COFF,因此约定应为微软x64,第四个寄存器参数是`r9`槽应该有四个. 两个工具在同一源码中丢失了不同的存储器.

列表是指令序列,调用约定则是单独的契约:哪些寄存器携带参数,哪些必须由调用者保留,返回地址和参数在哪里,以及调用者必须在指针上预留什么空间.四份文件定义了本课程的契约:系统V AMD64 psABI(版本 1.0,构建日期 2025年3月12日) 3.2.1至3.2.3节;微软 x64调用约定,语使用,序列和尾页面(页面日期从2018-12-17至 2025-03-19);Arm AAPCS644 版2026年1月23日) 6.1至6.9节;果应应64 平台说明.这些规则,其规则,用于编辑文件的相同类型,将编译器的位置转移,编译器的位置转移和核分类.

```figure
re-38-three-frames
```

## 文件头决定使用哪本规范

`convention.c`有十二个函数:`leaf_add`,我知道.`eight_args`,我知道.`mixed`,我知道.`by_value`,我知道.`big_ret`,我知道.`sum_varargs`,我知道.`keeps`五个调调相同形态`extern`函数的调用者──结构体使用 `long long`由于MSVC的目标`long`其他目标为8字节,而结构体大小变化会改变约定.`-target x86_64-unknown-linux-gnu`,我知道.`x86_64-pc-windows-msvc`和 `aarch64-unknown-linux-gnu`不同`-O0`,我知道.`-O2`再使用`arm64-apple-macos`编译`-O2`△未安装Linux或Windows文件,因此源码自行声明所需内容,只包含自带的语音`stdarg.h`和 `stddef.h`,我知道.

`code/main.py`中中 `describe_object()`读取四字节魔数和一个机器字段,从而确定契约:

| 文件头 | 字段 | 值 | 规范 |
|---|---|---|---|
| `7f 45 4c 46` ELF | 偏移 0x12 的 `e_machine` | 62 | System V AMD64 psABI |
| `64 86` COFF | 偏移 0 的 `Machine` | 0x8664 | Microsoft x64 |
| `7f 45 4c 46` ELF | `e_machine` | 183 | AAPCS64 |
| `cf fa ed fe` Mach-O 64 | 偏移 4 的 `cputype` | 0x0100000c | 带 Apple 差异的 AAPCS64 |

几乎每行都有不同的协议. 每个值都来自表头所指文档,并通过了核对测试.

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

## 系统V:两个独立寄存器序列与红区

psABI 3.2.3 将每个参数的每个八字节单元分类为INTEGER、SSE或MEMORY,然后从两个相互影响的列表分配寄存器──INTEGER 取序列 %rdi、%rsi、%rdx、%rcx、%r8、%r9 中下一个可用寄存器;SSE 取`%xmm0`至 `%xmm7`如果某个参数的任意八字节单元没有可存储器,整个参数就通过传递,内存参数以逆序(从右到左) 压。

`eight_args(a, b, c, d, e, f, g, h)`在`-O2`下占 27 字节:

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

首先使用六个寄存器,再从`8(%rsp)`和 `16(%rsp)`载两次.`%rbp`基址时,psABI图 3.3 将内存参数8字节单元0 放入`16(%rbp)`它们是未被压缩的入口.`8(%rsp)`,我知道.`g`位于8号`h`位于16个.

`mixed(int i, double d, long long l, float f)`展示两个列表.`%edi`和 `%rsi`它们的存储器,即第一,第二个整体存储器,`%xmm0`,我知道.`%xmm1`首先,第二个SSE寄存器.`cvtsi2sd %edi, %xmm2`在其中`%xmm2`是先写后读的临时寄存器.`cvtsi2sd`作为一个射器,它可以在线观看.`mixed`报告为 `xmm0`,我知道.`xmm1`,我知道.`xmm2`的`(double arg1, double arg2, double arg3)`,我知道.

`by_value(struct pair p)`将16字节结构体分成两个整体8字节单元,通过`%rdi`,我知道.`%rsi`传入,返回也使用两个寄存器:`leaq 0x1(%rdi), %rax; leaq -0x1(%rsi), %rdx; retq`,我知道.`big_ret(long long seed)`返回 32 字节,属于MEMORY类.psABI 规定调用者提供返回值空间,并将该存储地址通过 %rdi 作为第一个参数传递──于是`seed`移到`%rsi`函数以`movq %rdi, %rax`开始,因为返回时%rax 应包含调用者通过%rdi 传入的地址──

红区是系统V的另一种特征.psABI 3.2.2 规定:%rsp 所指位置以下的 128 字节区域视为保留,信号或中断处理器不得修改.`-O0`下,`eight_args`执行`pushq %rbp; movq %rsp, %rbp`转向`-0x8(%rbp)`至 `-0x30(%rbp)`存储六次,没有`subq`这些存储处于以下48字节内.`sum_varargs`的`-O2`构建用`subq $0x58, %rsp`分配88字节,然后将寄存器保存区写在`-0x58(%rsp)`至 `-0x80(%rsp)`字节:最深达指针以下 128 字节,用满红区──用`-mno-red-zone`构建相同文件后,`leaf_add`增加`pushq %rax`和 `addq $0x8, %rsp`将8字节局部变量放到指针上方

可变参数调用额外使用寄存器──%al 作为隐藏参数,指定已使用的向量寄存器数量,是 0 至 8 的上界──`call_varargs`在`-O2`用`xorl %eax, %eax`设置它,在`-O0`用`movb $0x0, %al`设置.`sum_varargs`首先读取它:`testb %al, %al; je`在未使用的向量寄存器时跳过八次`movaps %xmmN`保存.

## 微软x64:按位置分配,影子存储区和无红区

微软规则按位置分配──整数参数通过RCX、RDX、R8、R9 传入;浮点参数通过XMM0L、XMM1L、XMM2L、XMM3L 传入──前四个参数中浮点和双精度参数根据位置通过XMM0 - XMM3 传递──同`mixed`到了时候`%ecx`,我知道.`%xmm1`,我知道.`%r8`,我知道.`%xmm3`槽0是整数,所以用`RCX`槽1是双,所以用`XMM1`槽3是漂浮的,所以用`XMM3`,我知道.`XMM0`和 `XMM2`没有什么.

调用者也必须预留空间. 调用者总是必须分配足够的空间来存储四个寄存器参数,即便调用者没有这么多参数.`0(%rsp)`为了回归地址,`8(%rsp)`至 `39(%rsp)`作为四个家庭槽,第一个参数位于`40(%rsp)`,我知道.`eight_args`在`-O2`读取`0x28(%rsp)`,我知道.`0x30(%rsp)`,我知道.`0x38(%rsp)`,我知道.`0x40(%rsp)`其他国家:

调用者一侧展示了计算.`-O2`的`call8`执行`subq $0x48, %rsp`现在,再将5 6, 7, 8 存活到`0x20(%rsp)`至 `0x38(%rsp)`然后执行`movl $1, %ecx`等──72 字节由32 字节影子区、32 字节的四个参数组成,以及使返回地址落在16 字节边界的8 字节组成──`call_varargs`只有寄存器参数,仍然使用`subq $0x28, %rsp`分配:32 字节影子区加8 字节对齐.`keeps`压入三个非易失寄存器 (第24节),再执行`subq $0x20, %rsp`让我们`ext`获得返回地址下方的32个字节影子区──

结构体遵循自己的规则. 任何装不进8字节,或大小不是1、2、4、8字节的参数,都必须按引用传递.`by_value`在`%rcx`通过了这些信息.`%rdx`接收结构体副本指针:调用者必须为返回值分配内存,将指针作为第一个参数传入,其余参数向右移动一位──`call_pair`用`movaps`在`0x20(%rsp)`构造副本,通过`leaq 0x20(%rsp), %rdx`传入副本,通过`leaq 0x38(%rsp), %rcx`传入结果缓冲区,再从`0x40(%rsp)`读回`.b`,我知道.

在此没有红区──RSP 当前地址 下的所有内存都视为易失:操作系统、调试器`-O0`的`leaf_add`需要8 字节局部空间,通过入口处`pushq %rax`和 `retq`前的`popq %rcx`获取,使用两条单字节指令代替`subq`和 `addq`△使用页面对叶函数的定义为:叶函数不需要函数表条目──它不能修改包括 RSP 在内的任何非易失寄存器──

可变参数被调用者将寄存器写入了房间槽.对于可变参数或无原型函数,浮点值必须同时复制到对应的通用寄存器.`sum_varargs`在`-O2`执行一次`pushq %rax`再将`%rdx`,我知道.`%r8`,我知道.`%r9`存到`0x18(%rsp)`,我知道.`0x20(%rsp)`,我知道.`0x28(%rsp)`进口偏移 16、24、32,分别是第二、第三、第四个寄存器参数的家槽.`va_list`为`leaq 0x18(%rsp), %rax`其他`%rdx`是第一位未命名参数.

## 果的修改

AAPCS64 6.8.2 使用两个计数器逐条应用规则──C.9 规定整数参数复制到 x[NGRN]的最低有效位,然后增加 NGRN;C.1 对浮点参数使用 NSRN 做同样处理──C.12 规定不超过`8 - NGRN`个双字的复合类型复制到连续通用寄存器──C.13 规定参数一旦进入,NGRN 设为8,之后不再返回通用寄存器──`eight_args`使用 `x0`至 `x7`没有触碰.`mixed`为`w0`,我知道.`d0`,我知道.`x1`,我知道.`s1`,我知道.`by_value`输入和输出都是`x0`,我知道.`x1`,我知道.

6.9 规定,若结果可通过寄存器传参,就通过相同寄存器返回;否则内存块地址应通过 x8 作为附加参数传入函数。`big_ret`写入`str x0, [x8]`,我知道.`stur q0, [x8, #0x8]`,我知道.`str x9, [x8, #0x18]`没有写`x0`,我知道.`call_big`设置`mov x8, sp`现在,`seed`仍然留在`x0`由于6.9 进一步说明,调用者不需要保留 x8 中的值,`x8`不是参数寄存器之一.

6.1.1 规定: 子程序调用必须保留寄存器 r19-r29 和 SP 的内容.`-O0`的`leaf_add`为 8 字节局部变量生成`sub sp, sp, #0x10`而系统V则在此使用红区.

6.4.6 定义记录:上由两个64位值构成的记录......低地址双字符应指向前一记录,高地址双字符应包含进入当前函数时传入 LR的值──未规定记录在中的位置──clang 在此文件中显示了两种位置──Linux`-O2`的`keeps`用`stp x29, x30, [sp, #-0x30]!; mov x29, sp`将记录放到底部;同一个函数在`-O0`用`sub sp, sp, #0x20; stp x29, x30, [sp, #0x10]; add x29, sp, #0x10`将它放到顶部.

果 arm64 说明保留寄存器和对齐规则,修改、红区及可变参数调用.指针寄存器 x29 必须始终指向有效记录;某些函数,例如叶函数或尾调用,不能在此列表中创建条目.果的`keeps`保存`x22, x21, x20, x19`记录将放在顶部:`stp x29, x30, [sp, #0x20]; add x29, sp, #0x20`平台保留x18,不要使用它ARM64 红区由指针正正方下面的 128 字节组成,但对`-O0`叶函数仍在生成`sub sp, sp, #0x10`默认不使用红区──可变参数分配到适当数量的8字节槽,va_list 类型是果上的别名──果上`call_varargs`将10,2030存入`[sp]`,我知道.`[sp, #8]`,我知道.`[sp, #0x10]`只是传说`w0`Linux 构建传 `w1`,我知道.`w2`,我知道.`w3`并以`b extva`尾调用──果的`sum_varargs`将`add x8, sp, #0x10`调用者指针,作为`va_list`Linux 的`sum_varargs`将`x1`至 `x7`,我知道.`q0`至 `q7`保存到224 字节中,并通过 `mov x8, #-0x38; movk x8, #0xff80, lsl #32`将结构字段 `__gr_offs`开始为 -56`__vr_offs`始化为 -128──

符号也不同. 为了每个C符号添加.`_`现在,我已经知道了.`_keeps`现在的第一个函数是私有标签`ltmp0`下――分析器通过符号表重命名标签――

## 三次手动解码函数序言

`keeps(int n)`在循环中调用`ext(i)`需要跨调用保留`n`,我知道.`i`和 `acc`因此,每种ABI都必须保存寄存器.`-O2`构建的起始字节──

系统 V,共 4 字节:

1. `55`是寄存器编号位于低三位的`push r64`其他:`50 + 5`其他`%rbp`度为 8,`%rbp`存在入口偏移 -8
2. `41 56`其他:`41`是设置了`B`的,`56`是 `50 + 6`△REX.B将扩展到14个:`pushq %r14`位置 -16
3. `53`是 `50 + 3`其他:`pushq %rbx`位置 -24

三次压共 24 字节,再加回地址的 8 字节,32 是 16 的倍数,因此循环内`callq ext`无需`subq`没有什么可见的.`movq %rsp, %rbp`现在,我们没有一个指针.`%rbp`用作保存`acc`的被调用者保存寄存器(`xorl %ebp, %ebp`,我知道.`addl %eax, %ebp`尾声是镜像操作:`5b 41 5e 5d c3`,我知道.

微软x64,共 7 字节:

1. `56`是位置-8 的`pushq %rsi`没有任何`57`是位置 -16 的`pushq %rdi`没有任何`53`是位置 -24 的`pushq %rbx`△三者均为不易寄存器,而`RDI`和 `RSI`在系统V下曾是参数寄存器.
2. `48 83 ec 20`带8位立即操作码`83 /5`,,,,,,`ec`为`11 101 100`其他`subq $0x20, %rsp`度为56

56 加返回地址等于 64,满足对齐.32字节就是应提供给.`ext`后接零个或多个 8字节寄存器弹,再接回或 jmp;实际字节为`48 83 c4 20 5b 5f 5e c3`,我知道.

,四个字共 16 字节,小端:

1. `a9bd7bfd`是预索引`stp`位 31:30 的`10`选择 64位寄存器,位 25:23 的 `011`选择预索引,位 22 为 0 表示存储.位 21:15 的 信息`1111010`换句话说,在一个小时内,`sp`位 4:0 的Rt 为 29。`stp x29, x30, [sp, #-0x30]!`让指针下降48将`x29`存到48岁,`x30`存到 -40
2. `f9000bf5`没有符号 12位偏移按 8 缩放`str`位 21:10 的 进口为 2,Rn 为`sp`现在,我们要做什么?`str x21, [sp, #0x10]`对应入口偏移 -32
3. `910003fd`是立即数`add`        `sp`现在,我们要去做什么?`mov x29, sp`让指针指向 -48处的记录.
4. `a9024ff4`是带有符号的偏移`stp`,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`stp x20, x19, [sp, #0x20]`将`x20`放在 -16,`x19`放在 -8 

共 48 字节:`x29`位于0`x30`位于8号`x21`位于1624处有8字节填充,`x20`位于32个`x19`位于 40。记录的低地址字指向前一记录,下一个字保存 LR,符合 6.4.6。`cmp w0, #0x1`位于第一次存储之间,是调度器将它移入序列中;分析器允许操作之间出现比较或算术指令.

## 编译器将两次写出相同的事实

序言解析是一种推导.编译器也为展开器生成另一种表达,两者必须一致.

窗户上面的第二种表达是`.pdata`和 `.xdata`不带`-fno-asynchronous-unwind-tables`构建`-O2`目标文件,`llvm-objdump -h`显示`.xdata`为0x34字节,`.pdata`为0x48字节──0x48 即72,对应六条 12字节的`RUNTIME_FUNCTION`两条三条`IMAGE_REL_AMD64_ADDR32NB`重定位──六个函数是`sum_varargs`,我知道.`keeps`,我知道.`call8`,我知道.`call_varargs`,我知道.`call_pair`,我知道.`call_big`若查找不到函数表条目,则假定代码属于叶函数,RSP 直接指向返回指针

`keeps`的`.xdata`字节为`01 07 04 00 07 32 03 30 02 70 01 60`,我知道.`UNWIND_INFO`开头的3位是版本,随后的5位是旗:版本为1,无标志;;Prolog的尺寸为7,CountOfCodes为4,FrameRegister和FrameOffset均为0──每条`UNWIND_CODE`包含一个序言内偏移,以及一个编码操作码和信息字节.`07 32`移动 7 处,操作码 2 是`UWOP_ALLOC_SMALL`,信息值 3 表示 `3 * 8 + 8 = 32`字节──`03 30`操作码 0 是`UWOP_PUSH_NONVOL`寄存器编号 3 是`rbx`,我知道.`02 70`其他:`rdi`,我知道.`01 60`其他:`rsi`△这些编码按执行顺序进行逆序存储,描述三个压操作和32字节分配和`56 57 53 48 83 ec 20`字节完全一致.`sum_varargs`的条目为`01 01 01 00 01 02 00 00`字节序言,包含一条编码,即分配8字节的`UWOP_ALLOC_SMALL`这就是展览器眼中的.`pushq %rax`由于:一次分配`%rax`是易失寄存器,这里并没有保存寄存器值的语义──

在Linux上,第二条推导路径是`.eh_frame`根据DWARF 5 第6.4节规定编码.`llvm-dwarfdump --eh-frame`给每个函数打印一个FDE,并解析`R_X86_64_PC32`重定位,因此得到的地址范围可以直接使用.`keeps`其他:

```text
  DW_CFA_def_cfa_offset: +16
  DW_CFA_def_cfa_offset: +24
  DW_CFA_def_cfa_offset: +32
  DW_CFA_offset: RBX -32
  DW_CFA_offset: R14 -24
  DW_CFA_offset: RBP -16
```

指针比入口指针高8,因此`RBP -16`对应入口偏移 -8,`R14 -24`对应-16,`RBX -32`对应 -24,而最深的CFA偏移32就是24字节加上返回地址──Aarch64 上`keeps`写着`DW_CFA_def_cfa: W29 +48`并列出`W29 -48`,我知道.`W30 -40`,我知道.`W21 -32`,我知道.`W20 -16`,我知道.`W19 -8`                                                                                                                                                                                                                                                              `x29`为准确定义.`eh_frame_cross_check()`对于两个目标文件进行了这次比较.`call8`在函数体中压入两个传输参数,因此最深的CFA偏移为 32,而序言小为 8;检查时比较是函数体中指针达到最深的深度 24,再加上 8。

## 各工具如何称呼这些概念

根据其文档介绍,开源工具已经在测试样本上实际运行,输出记录和目标文件一起保存.

**Ghidra 12.1.4（Apache-2.0）。**规则位于SLEIGH 语言定义旁边的编译器规格文件 `.cspec`在中.`x86-64-gcc.cspec`声明名为`__stdcall`的`<default_proto>`,注明源自 2016 年 4 月的系统 V 应用程序二进制接口 AMD64 架构处理器补充──它使用 `<pentry>`列表指定`XMM0_Qa`到了`XMM7_Qa`及`RDI, RSI, RDX, RCX, R8, R9`条目从偏移 8 开始,为不超过 16 字节的类型提供 `join_dual_class`规则,输出为`XMM0_Qa, XMM1_Qa, RAX, RDX`其他情况使用`hidden_return`,我知道.`x86-64-win.cspec`声明`__fastcall`用四个`<group>`元素将`XMM0_Qa`与`RCX`,我知道.`XMM1_Qa`与`RDX`按位置分配的规则,从偏移40开始,对3,5,6或7字节的结构体使用.`convert_to_ptr`只有大小的8、16、32、64位的结构体才能装入寄存器;`unaffected`列出`RBX RBP RDI RSI RSP R12`到了`R15`及`XMM6`到了`XMM15`偏移8到39的`localrange`这就是影子储存区.`AARCH64.cspec`声明`__cdecl`首先,我们要做什么?`storage="hiddenret"`的`x8`之后是`q0`到了`q7`和 `x0`到了`x7`;对 17 字节及以上的结构体使用`convert_to_ptr`没有任何`killedbycall`包含`x8`注释写着间接结果位置寄存器,未体现在门户列表中──反编译器的最后阶段名为 建立函数的原型;分析器名为 调用公约 ID和 解编译参数 ID;程序选项 原型评估 选择默认模型──

**IDA Pro 和 IDA Free（Hex-Rays，商业软件；当前版本 9.4，构建号 9.4.260714）。**函数类型是通过SetType 设置的C 声明,IDA会使用类型信息,在反汇编中添加函数参数信息注释──标准约定无法表达位置使用IDA自己的约定书写:`int __usercall func@<ebx>(int x, int y@<esi>)`将结果放入`EBX`将`y`放入`ESI`其他`@<^12.4>`则通过偏移和大小指定位置.`__userpurge`同样,但由调用者清理.`__spoils`及表示本课程恢复的隐式参数`__hidden`,我知道.`__return_ptr`和 `__struct_ptr`△反编译器的 解译作为调用操作允许为单条指令指定`__usercall`原型──IDA 免费 仅支持 x86 和 x86-64──

**Binary Ninja 6.0“Krypton”（Vector 35，商业软件；另有可反编译 x86、x86_64、ARMv7 和 AArch64 的 Free 版本）。** `Platform`包含与二进制执行环境相关的所有信息,主要用于调用定制,操作系统和架构,平台列表包括`linux-x86_64`,我知道.`windows-x86_64`,我知道.`linux-aarch64`和 `mac-aarch64`每个平台都有`default_calling_convention`,我知道.`CallingConvention`包含`int_arg_regs`,我知道.`float_arg_regs`,我知道.`callee_saved_regs`,我知道.`caller_saved_regs`,我知道.`int_return_reg`,我知道.`high_int_return_reg`,我知道.`float_return_reg`两种直接编码的课程差异标志:`arg_regs_share_index`表示为 True 时,无论参数类型如何,第 N 个参数都会占占整数和浮点寄存器列表中的第 N 槽位;`stack_reserved_for_arg_regs`表示Windows x64 调用约定使用的影子/归位空间──`eligible_for_heuristics`,我知道.`required_arg_regs`和 `required_clobbered_regs`驱动其启发式调用约定检测――平台类型是`types/platform/`下一篇 文件,每个平台名称对应一个文件.

**radare2 6.2.4（LGPL-3.0，本课已实际运行）。** `afcl`列出架构插件已知的调用约定:x86-64 下为 `amd64 amd64syscall dlang golang golang_abi0 ms p9 reg swift`现在,我们在上.`arm64 dlang golang p9 reg swift`,我知道.`afc`报告当前函数调用约定,`afcr`打印从`cc.amd64.arg0: rdi`到了`arg5: r9`及`ret0: rax`信息,配置保存在名为 `cc-ARCH-BITS.sdb`发展目标文件选择 发展目标文件选择`amd64`,为 COFF 目标文件选择 `ms`这种区别是正确的.`afv`列出参数和变量,`afs`打印签名.`-O2`目标文件,`afv`为`eight_args`找到了七个参数,错了`rcx`对于Windows 目标文件,它找到了`rcx, rdx, r8`没有任何槽,没有任何槽.`r9`两个丢失的寄存器都出现了.`lea`内部――对于`mixed`现在,它在Linux上报告.`double arg1 @ xmm0, arg2 @ xmm1, arg3 @ xmm2`在Windows上则完全没有报告参数.`eight_args`找到了`x0`到了`x7`对`big_ret`则列出`x0`和 `double arg2 @ d1`函数实际上读取的是`x8`并且将会有常量加载到`q1`每个人都`afs`签名都以`void`开头,因为工具没有推断返回类型.`-O0`下,每个参数都存储,`afv`由于找到了`eight_args`只有两个参数.`rbp+0x10`和 `rbp+0x18`,我知道.

**rizin 0.9.1（LGPL-3.0，本课已实际运行）和 Cutter 2.5.0。** `afcl`列出`amd64 amd64syscall ms reg swift`,我知道.`afc`对COFF 目标文件返回`amd64`微软配置虽然存在,但没有根据文件格式被选中.`afi`对于Linux上`eight_args`列出7个参数,同样丢失`rcx`对于Windows 则列出`r8, rcx, rdx`两个槽,已经漏掉了`r9`,也错过了`0x40`处的槽位──`afv`不存在;列出变量命令是`afvl`子是子的图形前端.

**angr 10.0.3（BSD-2，本课已实际运行）。**运行前`CFGFast`运行`CompleteCallingConventions(recover_variables=True)`根据二进制格式将`function.calling_convention`设为`SimCCSystemVAMD64`,我知道.`SimCCMicrosoftAMD64`或`SimCCAArch64`并将`function.prototype`设为一个签名. 它在三个目标平台上恢复了.`eight_args`总共八个参数,将是x86-64 上`big_ret`隐藏指针恢复为`(BOT*, long long) -> BOT*`将窗户上`by_value`根据引用传递的结构体恢复为`(BOT*, BOT*) -> BOT*`,将系统V 下的可变参数函数`sum_varargs`恢复为`(long long, ...)`,它与雷达2不同:系统V和AArch64上`mixed`城市被恢复为`(long long, long long, double, float)`寄存器正确但顺序错误,因为整数列表在浮点列表之前打印;AArch64 上的 `big_ret`被恢复为`(long long) -> double`解释它丢了`x8`约定,并将向量存储操作误读为结果;AArch64 上的 `sum_varargs`则被恢复为16个参数,也就是整个寄存器保存区.

**其他工具。**Hopper 6.6.0 是面向macOS和Linux的商业反汇编译器和反编译器;本课程未运行或记录其调用约定处理情况.`frame info`和 `register read`显示实时,这是第42课对同一组偏移的动态观察方法──编译器探险器可从源码并排显示三份编编单,在字节中寻找某条规则前确认它的最快途径──

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

运行演示:

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames
python3 code/main.py
```

输出是一个JSON报告.对于七个目标文件中的每一个,它列出了格式,机器类型和ABI;对于十二个函数中的每一个,它给出了序列字符,保存的寄存器及其输入偏移,大小,指针,参数寄存器,参数偏移,溢出保存位置,返回寄存器或隐藏指针,调用深度,以及调用者传输参数所使用的寄存器和存储操作.每个函数报告都以检查结果结尾:规则,签名所获得的期望值,从字符节中观察到的,以及最后两项是否一致.报告函数是两个信息交换检查工具和输出记录.

预期结构:

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

按以下顺序阅读 `code/main.py`其他:

1. `describe_object()`读取 ELF、COFF 或 Mach-O 头部及符号表,返回 ABI 和函数列表──
2. `parse_listing()`将`llvm-objdump -d -r`文本分为函数,保留每个调用和跳转的重定位目标,并按应对语法标记删除注释:AT&T 使用 `#`     `//`和 `;`因为后者.`#`为了引入即时数量.
3. `effect_x86()`和 `effect_arm()`将一条命令转换为读取,地址读取,写入,加载,存储和指针增量――AT&T的最后操作数是目的操作数;AArch64的第一个操作数是目的操作数,存储,比较和分支命令除外――`lea`读取地址,但不加载任何内容.`mov`,我知道.`cvtsi2sd`,我知道.`setcc`和清零惯例法`xor r, r`目的操作数都只写不读.调用会写入整个易失寄存器集合.`sp`后索引加载则在访问后移动它.
4. `analyze_function()`在一个函数中,一次,直到遇到第一个.`ret`或尾跳转. 它跟踪指针对进值移动的深度向下,因此内存操作数`disp(%rsp)`的入口偏移为`disp - depth`现在,`disp(%rbp)`的偏移为`frame_pointer + disp`△它记录了前读后写的参数类寄存器,位于ABI第一个参数偏移处或其上方的载荷,将参数寄存器存入操作,对当前指标下访问以及每次调用时的深度.
5. `_return_registers()`作为数据操作数读取会排除该选项;作为地址基址读取不会,因此在微软x64下面`big_ret`在中,`movq %rcx, %rax`后通过`(%rax)`进行存储时,`rax`仍被保留为候选结果寄存器.
6. `expected_locations()`将三套规范应用于C签名:系统V的两个列表与八字节分类,微软的位置槽位与引用传递结构体,以及AAPCS64的计量器和用于超过16字节的结果.`x8`,我知道.
7. `run_checks()`比较两者并加入规则:被调用者保存寄存器必须先保存;每次调用时必须满足`(rsp + 8) % 16 == 0`或`sp % 16 == 0`每次微软调用都必须有32字节影子空间;微软和AAPCS64下不得访问指针下面,系统V下最多访问其下面 128字节;尾声必须与序言对应,并将指针恢复到输入值.
8. `seh_cross_check()`和 `eh_frame_cross_check()`读取未使用 `-fno-asynchronous-unwind-tables`构建目标文件的展开数据,并与序言解析结果进行比较.

另外有三个命令.`python3 code/main.py analyze convention-x86_64-windows-O2 keeps`打印单个函数――`python3 code/main.py object FILE`打印根据部长的判断.`python3 code/main.py seh`打印每一个具有`UNWIND_INFO`的函数的解码结果──

## 实际使用

对于您构建的新目标文件,按下列顺序使用分析器.

1. 运行`python3 code/main.py object FILE.o`记下它给出的ABI. 如果头部与构建命令不一致,先停下来;
2. 在目标文件旁保存`llvm-objdump -d -r FILE.o`输出,然后运行分析. 首先阅读序言字节和保存的寄存器,再看其他内容,并将大小与压操作及`sub`照顾
3. 根据源码签名核对参数寄存器和偏移.签名无法解释的寄存器可能是隐藏指针,可变参数标记,或被分析器误判为参数的临时寄存器.最后一个情况属于命令效果表的缺陷,应适用于该命令的一般规则修复.
4. 如果检查结果不一致,逐一阅读. 每项检查都注明了其依据的规则,因此先检查规则,再检查字节,最后检查分析器.
5. 如果有开放的数据,运行交叉检查――两条相互相容的推导路径,这是本课程能提供的最有力的证据――
6. 如果安装了其他工具,记录精确命令及其输出并进行比较.一致的三条路径相互印证;不一致的处则给出一个具体寄存器和一个具体指令,以便检查,这是第35课所说的一个发现.

## 交互实验

### 实验A:一条指令,三种效果

在`code`目录中启动Python:

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames/code
python3 -q
```

运行:

```python
from main import *
effect(Instruction(0, "48 8d 04 0a", "leaq", "(%rdx,%rcx), %rax"), SYSV)
effect(Instruction(0, "f2 0f 2a d7", "cvtsi2sd", "%edi, %xmm2"), SYSV)
effect(Instruction(0, "a9bd7bfd", "stp", "x29, x30, [sp, #-0x30]!"), AAPCS64)
```

每次调用前,先写下你预期的读取,地址读取,写入和增量――然后使用`ldp`将`[sp, #-0x30]!`改为`[sp], #0x30`观察如何增加`sp_delta`移到`post_sp_delta`,我知道.

### 实验B:保持的

```python
info, listing = load_fixture("convention-aarch64-linux-O2")
keeps = analyze_function("keeps", listing["keeps"], info.abi)
keeps.saved
keeps.frame_pointer
[c.to_dict() for c in frame_cells(keeps)]
```

将偏移与上述手工解码结果相比.`convention-arm64-macos-O2`并运行相同的三行代码;记录将移至 -16,四个寄存器位于其下面.`convention-x86_64-linux-O2-fp`查看`keeps`的`saved`指针回来了,同时又出现了一条条`pushq %rax`只有它能调整时间.`(rsp + 8)`成为16的倍数.

### 实验C:混合的先读后写分析

```python
info, listing = load_fixture("convention-x86_64-linux-O2")
mixed = analyze_function("mixed", listing["mixed"], info.abi)
mixed.param_registers
mixed.return_registers
expected_locations(SYSV, "mixed")["parameters"]
expected_locations(WIN64, "mixed")["parameters"]
```

系统V 的列表为`rdi, xmm0, rsi, xmm1`微软的列表为`rcx, xmm1, r8, xmm3`现在加载Windows 目标文件,再次运行前三行.然后打开Linux 目标文件的雷达2 输出记录,找到`[afv mixed]`找出导致第三个双出现的条例.

### 实验D:展开器的第二个判断

```python
for row in seh_cross_check():
    print(row["function"], row["sizeOfProlog"], row["unwindPushes"], row["unwindAllocBytes"], row["agree"])
for row in eh_frame_cross_check("convention-x86_64-linux-O2-eh"):
    print(row["function"], row["cfiSaved"], row["cfiMaxOffset"], row["deepestStack"], row["agree"])
```

在 SEH 表中找到`sum_varargs`的`pushq %rax`解释为什么开编码将记录为分配.`.eh_frame`表中找到`call8`解释其中的32个.

## 实践实验

添加第四个目标平台和第四套规范.

要求:

- 使用 `-target x86_64-apple-macos -O2`编译`convention.c`并记录汇编清单――扩展`describe_object()`让它读取马赫-奥的`cputype`系统V在 x86-64 上下载,同时处理`_`符号前──
- 检查每个函数是否通过系统V检查――记录你在序言中发现的唯一差异:达尔文在所有优化级别中保留了指针――
- 添加使用 `-fstack-protector-strong`构建的Linux x86-64 目标文件──扩展序言扫描,将从 `%fs:0x28`运载金丝雀以及将其存储在局部变量下面的操作记录为一个`canary`单元,并将 `ret`预测记录为保护尾声的检查
- 添加一个测试,确保当金丝雀储存被计为溢出保存参数时,测试会失败.
- 在运行分析器之前,手工写出`with_canary`风格代码的布局,并将图像与测试放在一起.

成功标准是:`python3 code/main.py`报告新目标文件的所有检查均一致,并且保护函数的单元显示金雀位于局部变量和保存存储器之间.

## 本课产物

本课提供 `outputs/skill-calling-conventions-and-stack-frames.md`△使用它,将你构建的目标文件,其汇编清单和C 签名转换为参数位置,布局,返回寄存器,并逐项核对推断是否符合依赖的规则和编译器生成的展开数据.`cvtsi2sd`或`xor r, r`目的操作数视为读取,并第一次发现不一致时停止.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- 七个目标文件的ELF、COFF 和 Mach-O 头部对应系统 V、微软 x64、AAPCS64 和果 arm64
- 每个目标文件的符号表都列出了相同的12个函数,并正确处理Mach-O的`_`前和`ltmp0`标签
- 汇编清单解析器保留 `ext`作为调用目标,并完整保留`#-0x30`等 AArch64 立即数
- `leaq (%rdx,%rcx), %rax`读取两个地址寄存器而不加载数据;`xorl %eax, %eax`和 `cvtsi2sd`目的操作数只写不读;前索引 `stp`在存储前移动`sp`后索引`ldp`则在加载后移动它
- `-O2`下一个`keeps`在系统 V 上`55 41 56 53`开头,为24字节且没有指针;在微软x64上`56 57 53 48 83 ec 20`开头,为56字节;在AArch64上首先出现`a9bd7bfd`记录在48年
- 果公司将记录在 - 16 个存储器上.
- Linux上每个函数都在`-O0`没有指针,在`-O2`下则没有;`-fno-omit-frame-pointer`恢复指针,并带来对齐的压力操作
- `-O0`叶函数在系统V 下使用 8 字节红区,在微软x64 下使用 `pushq %rax`在AAPCS64 下使用 `sub sp, sp, #0x10`其他`-mno-red-zone`会消除红区使用
- 每个尾声都与其序言对应,指针恢复到进口值
- 在两个优化级别下,`eight_args`两个分别读取六个寄存器和偏移 8、16个槽位,四个寄存器和偏移 40 到 64个槽位,或`x0`到了`x7`
- `mixed`在系统V 下使用`rdi, xmm0, rsi, xmm1`在微软x64下使用`rcx, xmm1, r8, xmm3`两者都用`xmm0`返回结果
- 16 字节结构体在系统V和AAPCS64下通过两个寄存器传递,在微软x64下则在隐藏指针后按引用传递
- 32 字节 结构体通过`rdi`,我知道.`rcx`或`x8`返回
- 可变参数被调用者会读取 `%al`将`rdx, r8, r9`归位到16、24、32,保存`x1`到了`x7`和 `q0`到了`q7`果上读调用者的指标
- 调用者设置预期寄存器,将7和8存到偏移0和8,或将5到8存到偏移32到56;在可变参数调用前清零`%al`通过`rdi`,我知道.`rcx`或`x8`传递结果缓冲区地址
- 所有489项检查都符合各自的规则
- 六个`UNWIND_INFO`条目与序言解析结果相符,叶函数则没有这些条目
- 24个FDE与保存寄存器的偏移和最深指针位置相符
- 工具输出记录包含雷达2 的`amd64`和 `ms`对COFF的目标文件的说明`amd64`失去了`rcx`、三双,以及原型的
- 嵌入站点模块的图形数据与分析器输出相等

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

在读取第一条指令前读头部,并明确使用规范. 根据将其放到该位置的规则,并根据编译器对同一条字节或源码的开放数据进行核查. 在字节或源码确认之前,只将工具的原型视为一个待验证的主张.

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
