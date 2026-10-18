# 编译器惯用模式：优化如何改写代码，以及如何反向读懂它

> 优化编译器会用成本更低的指令形态替换源码结构。每种形态都有推导依据，本课构建一个反向执行推导、并对照源码验证的识别器。

**Type:** Build
**Languages:** Python, C, x86-64 assembly, AArch64 assembly
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、Phase 13 · 34（提升为伪代码）、Phase 13 · 38（调用约定）
**Time:** ~150 分钟

## 学习目标

- 利用 Granlund-Montgomery 界限推导除以任意常量时的魔数和移位量，并从 clang 生成的常量恢复除数。
- 说出 LLVM 降低 `switch` 的五种方式，并从目标文件读取条目数量、表位置和条目内容。
- 将向量化循环解读为通道数、累加器数、每轮元素数、迭代次数掩码、归约和余数循环。
- 识别尾调用、内联的被调用函数、无分支选择，以及转化为 `memset` 或 `memcpy` 的循环。
- 对 x86-64 与 AArch64、`-O0` 至 `-O3` 的每种惯用模式，报告证据指令及解码出的源码形式。
- 将结果与 Ghidra、angr、radare2、rizin 和 lldb 对同一字节的输出比较。

## 问题

你用 `-O2` 编译了 `idioms.c`，问智能体 `div7u` 做什么。智能体读到 `imulq $0x24924925, %rax, %rax`，回答说该函数乘以 613566757，再移位、相加。每个字都没错，但这个函数计算的是 `x / 7`。

同一目标文件中，还有一个七分支却完全没有跳转的 `switch`，一个变成跳转表的五分支 `switch`，一个变成 `sete` 和 `cmovne` 的双分支 `switch`，以及一个遍历 `n` 个整数的循环：每轮在两个 `xmm` 寄存器中处理八个整数，再用第二个循环处理剩余元素。在 `-O0` 下，同一源码生成了 `divl`、七条目的跳转表和一个标量循环；在 `-O1` 下，七分支 switch 变成值表，而向量循环尚未出现。

这些形态就是惯用模式。编译器依据其源码中可查的规则生成每一种模式，也可以将它们解码回原始结构。解码依赖算术，而算术可以验证。第 34 课证明了其中一种，即乘以 `0x66666667`。本课构建覆盖所有这些模式的识别器，对我们自己代码的 18 个构建运行，并将全部 373 项报告与 C 源码验证。

```figure
re-39-idioms-by-level
```

## 惯用模式是有推导依据的形态

惯用模式是编译器针对一种源码结构生成的指令序列。它之所以能被识别，是因为具有固定形态、操作数携带推导所预测的常量，而且形态不同于程序员通常手写的代码。

`code/main.py` 中的识别器处理 `llvm-objdump -d -r` 的文本；第 33 课已将它确立为指令边界的参考基准。识别器将每个函数解析为含地址、字节、助记符、操作数及后续重定位行的指令。读取目标文件只为取得两类信息：值表所在 `.rodata` 的字节，以及链接前保存跳转表目标的 `.rela.rodata` 条目。

每项检测都是一条 `Idiom` 记录，包含 `kind`、解码出的 `source` 形式、`evidence` 地址列表、`detail` 字典和 `verified` 标志。标志来自 C 源码。`parse_source()` 读取 `idioms.c`，找到每个函数，提取 `/` 与 `%` 后的除数、`*` 后的乘数、`switch` 分支及其值、`? :` 运算符、`for` 循环和被调用者。除法模式的除数出现在函数除法列表中时即获验证；查找表条目与分支值相同或相差固定倍数时即获验证；尾调用的被调用者在源码中确实被调用时即获验证。演示报告以 `unverified` 列表结束，测试套件断言全部 18 个构建的该列表都为空。

解码需要名称。识别器按清单顺序对每个函数的基本块运行小型符号求值器，依据第 38 课的 System V 和 AAPCS64 调用约定，将源码参数名放入参数寄存器。栈槽按操作数文本跟踪，因此能穿过 `-O0` 代码的溢出保存操作。在每个块入口合并前驱状态；若状态不同，先前模式分配的名称优先于常量。正因此，`digest` 中的 `cmovll %edx, %eax` 可读回 `sum % 10 < 5 ? sum % 10 : 5`：循环模式将累加器命名为 `sum`，除法模式将商命名为 `sum / 10`，取模模式将结果命名为 `sum % 10`。源码写作 `rem > 5 ? 5 : rem`，两种表达式都取 `rem` 和 5 的较小值，并在 `rem == 5` 时一致。

## 除以常量

Granlund 和 Montgomery 的《Division by Invariant Integers using Multiplication》（PLDI 1994）用乘法和移位替代 `n / d`。选择移位量 `s` 和乘数 `m = ceil(2^s / d)`。只要误差 `e = m * d - 2^s` 足够小，范围内所有 `n` 的 `floor(n * m / 2^s)` 就等于 `floor(n / d)`。对无符号 32 位 `n`，界限是 `e <= 2^(s - 32)`；对满足 `|n| < 2^31` 的有符号 `n`，界限为 `e <= 2^(s - 31)`，并在 `n` 为负时通过符号修正加 1，因为向下取整对负商的舍入方向不符。

`main.py` 中的 `magic_numbers(d, bits, signed)` 从 32 开始向上搜索 `s`，返回第一组满足界限的参数。该搜索能复现夹具中 clang 生成的每个常量。

### 手算无符号除以 10

`2^35 / 10 = 3435973836.8`，向上取整为 `3435973837 = 0xCCCCCCCD`。误差是 `0xCCCCCCCD * 10 - 2^35 = 2`，而 `s = 35` 的界限为 `2^3 = 8`。若 `s = 34`，误差为 6，超过界限 4，因此 35 是最小移位量。以 `n = 123` 检查：`123 * 3435973837 = 422624781951`，`422624781951 >> 35 = 12`。

clang 在 x86-64 的 `-O2` 下为 `div10u` 生成的正是这一形式：

```text
       0: 89 f9                        	movl	%edi, %ecx
       2: b8 cd cc cc cc               	movl	$0xcccccccd, %eax
       7: 48 0f af c1                  	imulq	%rcx, %rax
       b: 48 c1 e8 23                  	shrq	$0x23, %rax
```

`0x23` 即 35。`movl %edi, %ecx` 将 32 位参数零扩展到 64 位寄存器，这是无符号形式。识别器从向双操作数 `imulq` 提供输入的 `movl $imm` 读取乘数，读取移位量，然后调用 `divisor_from_magic(0xCCCCCCCD, 35)`。该函数尝试 `2^35 // m = 10` 和 11，并接受 10，因为 `magic_numbers(10)` 返回相同乘数和移位量。

在 AArch64 上，同一函数是 `mov w8, #0xcccd; movk w8, #0xcccc, lsl #16; umull x8, w0, w8; lsr x0, x8, #35`。常量分成两个 16 位半部到达，乘法为 `umull`，移位量以十进制书写。识别器拼接半部后，报告同一个除数。

### 手算无符号除以 7：加法修正

`2^35 / 7 = 4908534052.57`，向上取整为 `4908534053 = 0x124924925`，需要 33 位。误差 3 不超过界限 8，因此移位量为 35，且更小的移位量均不成立。32 位乘法无法容纳该乘数，所以编译器乘以低 32 位 `0x24924925`，再按固定序列加回被除数：

```text
      32: 48 69 c0 25 49 92 24         	imulq	$0x24924925, %rax, %rax
      39: 48 c1 e8 20                  	shrq	$0x20, %rax
      3d: 29 c7                        	subl	%eax, %edi
      3f: d1 ef                        	shrl	%edi
      41: 01 f8                        	addl	%edi, %eax
      43: c1 e8 02                     	shrl	$0x2, %eax
```

将它读作 `t = (n * 0x24924925) >> 32`，然后 `q = (((n - t) >> 1) + t) >> 2`。总移位量为 `32 + 1 + 2 = 35`。当 `n = 100` 时：`t = 14`，`(100 - 14) >> 1 = 43`，`43 + 14 = 57`，`57 >> 2 = 14`。识别器在右移 32 位之后检测 `sub`、`shr`、`add`、`shr` 尾部，给乘数加回 `2^32`，恢复出 7。`evaluate_division()` 精确执行这套序列，测试在 32 位边界值上将其与 `n // 7` 比较。AArch64 形式是 `sub w9, w0, w8; add w8, w8, w9, lsr #1; lsr w0, w8, #2`，因为带移位加法是一条指令，所以少一条。

### 手算有符号除以 3

`2^32 / 3 = 1431655765.33`，向上取整为 `1431655766 = 0x55555556`，误差 2，`s = 32` 时的有符号界限为 `2^1 = 2`。恰好满足界限，因此移位量是 32，clang 使用 `shrq $0x20`。当 `n = -7` 时，乘积为 `-10021590362`，算术右移 32 位得到 `-3`；符号位已置位，修正加 1，结果为 `-2`，正是 C 中的 `-7 / 3`。有符号夹具 `div10s` 和 `div3s` 都对乘积副本执行 `shrq $0x3f`，再接 `addl` 实现修正。

### 常量本身不能说明什么

只有乘数无法确定除数。`0x66666667` 配合移位 34 表示 10；相同乘数配合移位 33 则表示 5，第 34 课已展示过。因此识别器始终将乘数与总移位量配对，`clangMatchesAlgorithm` 字段记录该组合是否正是搜索算法产生的组合。2 的幂从不使用乘法，`magic_numbers()` 会拒绝它们，因为编译器改用带符号偏置的移位；下一节的 `mod8s` 展示这一形态。

### 惯用模式属于指令选择阶段

在 `-O0` 下，`div10u` 是 `movl $0xa, %ecx; xorl %edx, %edx; divl %ecx`，`div10s` 是 `cltd; idivl %ecx`。但同一目标文件里的 `digest` 用 `imulq $0x66666667` 将循环和除以 10。一个参数解释了差异：夹具 `idioms-x86_64-nofastisel-O0.o` 使用 `-O0 -mllvm -fast-isel=false` 构建，其中每次除法都变成乘法，包括使用 `movl $0xcccccccd, %ecx; imulq %rcx, %rax; shrq $0x23` 的 `div10u`。硬件除法是快速指令选择器在 `-O0` 下的选择；乘法是 SelectionDAG 的降低结果，来自 LLVM 的 `UnsignedDivisionByConstantInfo` 和 `SignedDivisionByConstantInfo`。`digest` 中包含除法的块还包含 `switch`，因此该块交给了 SelectionDAG。识别器同时报告 `hardware idivl` 与 `magic multiply` 两种形式，图中展示了混合形式的 `-O0` 函数。

## 取模跟随商

`x % d` 等于 `x - (x / d) * d`。编译器先用上述模式计算商，再乘回除数并相减。x86-64 上乘回 10 是 `addl %ecx, %ecx; leal (%rcx,%rcx,4), %ecx`，即 `2 * q * 5`。AArch64 上只需一条 `msub w0, w8, w9, w0`，它在 `w9 = 10` 时计算 `w0 - w8 * w9`。识别器沿复制操作跟踪商寄存器，通过 `add`、`lea`、`shl`、`imul` 跟踪累计因子，当因子等于除数时接受后续 `sub`。

同一个商还供其他表达式使用时，报告会保留两种模式。在 `-O1` 下，编译器在 `digest` 中只计算一次 `sum / 10`，同时用于 `switch` 索引和取模。在 x86-64 上，它甚至两次合并该商：取模用 `leal (%rax,%rsi), %edi`，switch 用 `addl %esi, %eax`。识别器报告一次除法和一次取模，并将商标为共享。如果报告在此丢掉除法，`switch` 索引就难以读懂。

对 2 的幂做有符号取模有独立形态，因为它根本不计算商：

```text
      92: 8d 48 07                     	leal	0x7(%rax), %ecx
      95: 85 ff                        	testl	%edi, %edi
      97: 0f 49 cf                     	cmovnsl	%edi, %ecx
      9a: 83 e1 f8                     	andl	$-0x8, %ecx
      9d: 29 c8                        	subl	%ecx, %eax
```

对负数 `x`，代码在掩码前加偏置 7，使截断按 C 要求向零舍入。掩码后的值是舍入到 8 的倍数的 `x`，相减后留下 `x % 8`。AArch64 使用 `negs w8, w0; and w9, w0, #0x7; and w8, w8, #0x7; csneg w0, w9, w8, mi`：同时掩码 `x` 和 `-x`，再按符号选择并取负。Ghidra 将此规则命名为 `RuleSignMod2nOpt`，简介为“转换 INT_SREM 形式：`(V + (sign >> (64-n)) & (2^n-1)) - (sign >> (64-n)) => V s% 2^n`”。

在 `-O0` 下，AArch64 用 `sdiv w9, w8, w10; mul w9, w9, w10; subs w0, w8, w9` 表达取模。识别器也接受这种形式，并报告 `hardware sdiv + mul + subs`。

## switch 的五种降低方式

LLVM 在两个位置决定 `switch` 形态。`SimplifyCFG::simplifySwitchLookup` 在 `-O1` 及以上运行：当至少有三个分支、各分支都产生常量，且目标支持查找表时，将 switch 转为值表。其表类别是 `SingleValueKind`、`LinearMapKind`、`BitMapKind` 和 `ArrayKind`。`-O0` 流水线不运行该过程。剩余 switch 进入指令选择阶段的 `SwitchLowering::findJumpTables`：当簇至少有 `min-jump-table-entries` 个条目（默认 4）且足够密集时构建跳转表。密度条件为 `NumCases * 100 >= Range * MinDensity`，普通函数的 `jump-table-density` 为 10，`-Os` 下为 40。剩余情况变为对分支常量的二分查找，由 `splitWorkItem` 选择枢轴。夹具为每种结果提供一个函数。

| 函数 | 源码 | `-O0` x86-64 | `-O2` x86-64 | `-O2` AArch64 |
|---|---|---|---|---|
| `linear_switch` | 分支 0 至 6 返回 10 至 70 | 7 条目跳转表 | 线性映射 `10*k + 10`，默认 -1 | `madd` 和 `csinv` |
| `table_switch` | 分支 0 至 6 返回 10 至 60，再返回 71 | 7 条目跳转表 | `.rodata+0x28` 处的查找表 | `.rodata+0x0` 处的查找表 |
| `call_switch` | 分支 0 至 4 调用五个指针中的一个 | 5 条目跳转表 | 5 条目跳转表 | 比较树，枢轴 1 |
| `sparse_switch` | 分支 1、100、10000、1000000、100000000 | 比较链 | 比较树，枢轴 9999 | 比较树，枢轴 9999 |
| `two_cases` | 分支 3、4 返回 7、9 | 比较链 | 选择链 `k != 3 ? (k == 4)*9 : 7` | 两条 `csel` |

### 从目标文件读取查找表

`-O2` 下的 `table_switch`：

```text
      d0: b8 ff ff ff ff               	movl	$0xffffffff, %eax
      d5: 83 ff 06                     	cmpl	$0x6, %edi
      d8: 77 0c                        	ja	0xe6 <table_switch+0x16>
      da: 89 f8                        	movl	%edi, %eax
      dc: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		00000000000000df:  R_X86_64_PC32	.rodata+0x24
      e3: 8b 04 81                     	movl	(%rcx,%rax,4), %eax
      e6: c3                           	retq
```

边界检查 `cmpl $6; ja` 表示有 7 个有效条目。重定位加数 `0x24` 加上 RIP 相对字段的 4 字节，将表定位到 `.rodata+0x28`，这正是第 33 课推导的规则。该处字节为 `0a 00 00 00 14 00 00 00 ...`，因此条目为 `[10, 20, 30, 40, 50, 60, 71]`，与源码分支值相等。汇编器在 `.s` 文件中将表命名为 `.Lswitch.table.table_switch`，并附注释 `@switch.table.table_switch`。目标文件中只剩重定位和字节。这里没有跳转，因此控制流图有三个块。

AArch64 形式通过 `adrp x8` 和 `add x8, x8, #0x0` 拼出表地址，两者各带一条指向 `.rodata` 的重定位，再用 `ldr w0, [x8, w0, uxtw #2]` 加载。识别器从 `add` 的重定位读取加数。

### 完全没有表的线性映射

`linear_switch` 对 0 至 6 的 `k` 返回 `10 * (k + 1)`。`simplifySwitchLookup` 检测到仿射关系，改为生成算术操作：

```text
      b0: 83 ff 07                     	cmpl	$0x7, %edi
      b3: 8d 04 bf                     	leal	(%rdi,%rdi,4), %eax
      b6: 8d 4c 00 0a                  	leal	0xa(%rax,%rax), %ecx
      ba: b8 ff ff ff ff               	movl	$0xffffffff, %eax
      bf: 0f 42 c1                     	cmovbl	%ecx, %eax
```

求值器将 `leal (%rdi,%rdi,4)` 读为 `5*k`，将 `leal 0xa(%rax,%rax)` 读为 `10*k + 10`，将 `cmpl $7` 后的 `cmovb` 读为 `k < 7 ? 10*k + 10 : -1`。随后识别器用每个源码分支检查公式，并将模式标记为已验证。AArch64 通过 `madd w8, w0, w8, w9` 和 `csinv w0, w8, wzr, lo` 得到相同表达式，其中带 `wzr` 的 `csinv` 在默认路径产生 `-1`。

### 从重定位读取跳转表

`-O2` 下的 `call_switch` 与第 33 课在 `-O0` 的 `grade` 中恢复的形态相同：`cmpl $4; ja`、指向 `.rodata-0x4` 的 `leaq`、读取 4 字节条目的 `movslq`、`addq`，再接 `jmpq *%rax`。五个条目是 `.rela.rodata` 中的重定位，`target = addend - 4k` 得到 `0x10c, 0x107, 0x10e, 0x110, 0x109`，分别指向五个不同块，每个块通过函数指针尾跳转。`dispatch` 夹具将其扩展为 16 个分支：x86-64 上有 16 条重定位；AArch64 上则是 16 个单字节组成的压缩表，用 `ldrb w11, [x9, x8]` 读取，以 `add x10, x10, x11, lsl #2` 乘以 4，再以指向第一个分支块的 `adr` 为基址。识别器从字节表解码出 `[0x24, 0x74, 0x54, ...]`，并报告 `compressed: true`。

### 同一个 switch 的四种优化级别

`digest` 包含对 `sum / 10` 的 switch，分支为 6 至 10，值为 1、2、4、8、8，随后将结果乘以 16。在 x86-64 上，它在 `-O0` 下为跳转表，在 `-O1` 下为条目 `[16, 32, 64, 128, 128]` 的查找表，到 `-O2` 和 `-O3` 又变回跳转表，其四个分支块分别保存 `0x10`、`0x20`、`0x40`、`0x80`。从 `-O1` 起，乘以 16 移入了分支；在 `-O0` 下，分支保存 1、2、4、8，乘法仍在 switch 之后。对 `-O1` 查找表，识别器将条目与源码值比较，找到固定比率，并报告 `foldedFactor: 16`。AArch64 的 `-O2` 形式是枢轴为 8 的比较树，含对 6、7、8 的相等测试，以及范围测试 `sub w9, w9, #9; cmp w9, #2; b.hs`，用两条测试操作覆盖分支 9 和 10。识别器报告 `rangeTests: [[9, 10]]`。

两个参数会移动这些边界。`-fno-jump-tables` 在 x86-64 上将 `table_switch`、`call_switch` 和 `digest` 的 switch 转为比较树，七分支函数的枢轴为 2 和 4。AArch64 上，`-mllvm -min-jump-table-entries=4` 仍让 `call_switch` 保持比较树，因此对该目标上五分支间接调用 switch，条目数量不是决定因素。夹具 `idioms-arm64-jt4-O2.o` 记录了这次运行。

GCC 将两个决策都放在 `tree-switch-conversion.cc` 中，使用 `jump_table_cluster`、`bit_test_cluster`、`switch_decision_tree` 和 `switch_conversion` 类。`-ftree-switch-conversion` 在 `-O2` 开启，`-fjump-tables` 和 `-fbit-tests` 在 `-O1` 开启，跳转表阈值来自 `case-values-threshold`，默认值由机器决定。这台机器未安装 GCC，因此这些名称来自 GCC 源码和手册，可在 Compiler Explorer 中检查。

## 循环：向量化、展开或替换

LLVM 的循环向量化器在 `-O2`、`-O3`、`-Os` 开启，在 `-O0`、`-O1` 关闭，这条规则可追溯到 2014 年 1 月的 LLVM 3.4。`-O2` 下的 `sum_n` 展示了这种形态的每个部分：

```text
     1f6: 83 fe 07                     	cmpl	$0x7, %esi
     1f9: 77 09                        	ja	0x204 <sum_n+0x14>
     206: 81 e2 f8 ff ff 7f            	andl	$0x7ffffff8, %edx
     230: f3 0f 6f 14 37               	movdqu	(%rdi,%rsi), %xmm2
     235: 66 0f fe c2                  	paddd	%xmm2, %xmm0
     239: f3 0f 6f 54 37 10            	movdqu	0x10(%rdi,%rsi), %xmm2
     23f: 66 0f fe ca                  	paddd	%xmm2, %xmm1
     243: 48 83 c6 20                  	addq	$0x20, %rsi
     24a: 75 e4                        	jne	0x230 <sum_n+0x40>
     24c: 66 0f fe c8                  	paddd	%xmm0, %xmm1
     250: 66 0f 70 c1 ee               	pshufd	$0xee, %xmm1, %xmm0
     262: 66 0f 7e c8                  	movd	%xmm1, %eax
     270: 03 04 97                     	addl	(%rdi,%rdx,4), %eax
     279: 75 f5                        	jne	0x270 <sum_n+0x80>
```

保护条件 `cmpl $7; ja` 将少于 8 次的迭代送入标量循环。掩码 `andl $0x7ffffff8` 将迭代次数向下舍入为 8 的倍数。循环体每轮加载 32 字节，进入两个 `xmm` 累加器，每个含四个 32 位通道，因此向量化因子为 4、交错因子为 2。循环之后，`paddd`、两条 `pshufd`、另外两条 `paddd` 和 `movd` 将八个通道归约为一个整数。`0x270` 处的循环是处理最后 0 至 7 个元素的标量余数循环。识别器通过回边找到循环，识别 SIMD 寄存器，从 `paddd` 读取通道数，统计不同累加器，将步长 `0x20` 除以 4，报告 `4 lanes x 2 accumulators = 8 elements per iteration`，并以字段形式记录掩码、保护条件、归约和余数循环。AArch64 用 `ldp q2, q3`、两条 `add v.4s`、`addv s0, v0.4s` 和 `fmov w8, s0` 完成相同工作。

固定迭代次数会消除循环。`sum4` 由一条 `movdqu`、归约和 `movd` 构成，没有回边。`poly8` 无法向量化，因为每轮依赖上一轮累加器，于是编译器将它展开八次：从 `%rdi` 的偏移 0 至 `0x1c` 加载八次，每次之后都左移 5 位再相减，计算 `acc * 31`。识别器统计同一基址的连续偏移加载，报告 `loop unrolled by 8, no back edge`。AArch64 的相同加载以四对 `ldp` 出现。

用 `-fno-vectorize -fno-slp-vectorize` 关闭向量化器后，`sum_n` 变为展开八次的标量循环，包含八条 `addl k(%rdi,%rdx,4), %eax` 和 `addq $8`，再加余数循环。`sum4` 则变成四次加法。识别器对前者报告 `unrolled loop`、`copies: 8` 和 `indexStep: 8`，对后者报告 `copies: 4`。

第 33 课在 `-O2` 的 `total` 中找到两条回边，称它们为两个循环；本课进一步指出，它们是同一个源码循环的向量主体和标量余数部分。只有回边目标能够再次到达该回边时，它才构成循环。`is_loop()` 检查这一条件，因为 AArch64 的 `digest` 含有向后跳到共享默认块的分支，它们不是循环，而识别器第一版误将其计为向量循环。

### 变成库调用的循环

从 `-O1` 起，`LoopIdiomRecognize` 将逐字节存零的循环转为 `memset` 调用。`-O2` 下的 `fill` 是 `testl %esi, %esi; jle; movl %esi, %edx; xorl %esi, %esi; jmp memset@PLT`。该调用是带 `R_X86_64_PLT32 memset-0x4` 重定位的尾跳转，函数的 `retq` 只出现在空路径。识别器报告 `store loop recognized as memset(...)`，并对照源码循环验证，因为源码从未直接调用 `memset`。

`copy16` 用常量 16 调用 `memcpy`，x86 后端将其内联为 `movups (%rsi), %xmm0; movups %xmm0, (%rdi)`，未超过每次 `memcpy` 最多 8 次存储的限制。在 `-O0` 下，同一调用为两对 8 字节 `movq`。使用 `-fno-builtin` 时，调用保留为带 `movl $0x10, %edx` 的 `jmp memcpy@PLT`；`fill` 保留循环，向量化器随后将其转为每轮两次 16 字节 `movups` 存储。识别器为该构建报告 `vectorized store loop: 2 x 16-byte stores = 32 bytes per iteration`。

## 消失或变成跳转的调用

`tail_caller` 返回 `tail_target(x + 1)`。在 `-O0` 下，它是 `addl $0x1, %edi; callq tail_target@PLT; addq $0x10, %rsp; popq %rbp; retq`；在 `-O2` 下，只有 `incl %edi; jmp tail_target@PLT`。调用者栈帧消失，被调用者直接返回调用者的调用者。AArch64 上是带 `R_AARCH64_JUMP26` 的 `b tail_target`。识别器将带调用重定位的 `jmp` 或 `b` 视为尾调用。第 33 课的递归下降必须将它视为函数出口，因为目标位于函数之外。

`twice_sum` 调用 `leaf_add`。在 `-O0` 下存在 `callq leaf_add@PLT`；从 `-O1` 起，`leaf_add` 的函数体 `leal (%rdi,%rsi), %eax` 出现在 `twice_sum` 内，不再保留调用。在 `-O0` 下，clang 为每个函数标记 `optnone` 和 `noinline`，只运行强制内联器。识别器从源码知道 `twice_sum` 调用了 `leaf_add`，若没有找到调用或尾跳转，就在调用者中寻找被调用者的函数体形态：去掉目标操作数后的助记符和源操作数。因此 AArch64 调用者中的 `add w8, w1, w0` 能匹配被调用者中的 `add w0, w1, w0`。找到一次匹配就是证据。

`dispatch` 同时结合两种模式：一个 16 条目跳转表，每个分支都是 `movl %esi, %edi; jmp fN@PLT`。识别器报告一个 switch 和 16 个尾调用，并全部与源码中的 16 次调用验证。

## 变成数据移动的分支

`clamp_max` 是 `movl %esi, %eax; cmpl %esi, %edi; cmovgl %edi, %eax`。求值器将 `%edi` 命名为 `a`、`%esi` 命名为 `b`，记录比较，再将 `cmovg` 解读为 `a > b ? a : b`，与源码一致。`abs_int` 是 `movl %edi, %eax; negl %eax; cmovsl %edi, %eax`，读作 `-x < 0 ? x : -x`；AArch64 则写作 `cmp w0, #0; cneg w0, w0, mi`，读作 `x < 0 ? -x : x`。`is_pos` 是 `xorl %eax, %eax; testl %edi, %edi; setg %al`，即 `(x > 0)`。GCC 将这类转换称为 `-fif-conversion`，LLVM 则称为 `cmov` 选择。LLVM 的 `X86CmovConversion` 过程判断有利时可将 `cmov` 再转回分支，这也解释了同一源码在循环中可能出现任一种形态。

在 `-O0` 下，这些模式都不存在。`clamp_max` 是比较、`jle`、向同一槽的两次存储及一次加载。识别器在 `-O0` 下不报告模式，从 `-O1` 起报告 `branchless select`，图示直观展示了这一事实。

`mul9` 只有一条 `leal (%rdi,%rdi,8), %eax`，识别器报告 `strength reduction` 和 `x * 9`，因为源码确实乘以 9。只有源码包含这个因子时才这样报告；缩放表索引的 `lea` 不应被认作源码乘法。

## 两种看起来像惯用模式的加固特性

栈保护器是编译器特性，会留下容易被智能体误读为程序逻辑的形态。`canary.c` 在 x86-64 Linux 上使用 `-fstack-protector-strong` 编译，得到：

```text
       7: 64 48 8b 04 25 28 00 00 00   	movq	%fs:0x28, %rax
      10: 48 89 44 24 40               	movq	%rax, 0x40(%rsp)
      26: 64 48 8b 0c 25 28 00 00 00   	movq	%fs:0x28, %rcx
      2f: 48 3b 4c 24 40               	cmpq	0x40(%rsp), %rcx
      34: 75 05                        	jne	0x3b <with_canary+0x3b>
      3b: e8 00 00 00 00               	callq	0x40 <plain_leaf>
		000000000000003c:  R_X86_64_PLT32	__stack_chk_fail-0x4
```

`%fs:0x28` 是 glibc 的 `tcbhead_t` 中的 `stack_guard`，字节偏移为 40；LLVM 的 `getIRStackGuard` 为 glibc、bionic 和 Fuchsia 指定这个槽。函数序言将保护值复制到缓冲区上方，尾声比较，失败路径调用 `__stack_chk_fail`。AArch64 Linux 上，保护值从全局 `__stack_chk_guard` 经 GOT、`adrp` 和 `ldr` 取得，失败路径为 `bl __stack_chk_fail`。识别器报告保护值来源、槽、比较和失败调用。没有数组的 `plain_leaf` 在 `strong` 下没有 canary；该模式保护有数组、`alloca` 或局部变量地址被获取的函数。研究笔记还记录了 MSVC `/GS` 形式：cookie 与 `%rsp` 混合，通过 `__security_check_cookie` 检查。机器上没有 MSVC 链接器，因此这种形态仅根据编译器汇编输出描述。

`-fcf-protection=full` 将 `endbr64`（字节 `f3 0f 1e fa`）放到每个函数的第一条指令处。对支持控制流强制保护的处理器，它是间接分支落点；在其他处理器上作为 `nop` 执行。Ghidra 的 x86-64 函数起始模式因此包含带 `endbr64` 前缀的 `push rbp; mov rbp, rsp` 变体。识别器将其报告为 `cet landing pad`，避免把以四个不寻常字节开始的函数误判为数据。

## 反编译器会折叠哪些模式

第 37 课中的每个反编译器都会以重写规则执行其中部分推导。Ghidra 在 `ruleaction.cc` 中为规则命名。`RuleDivOpt` 是“将 INT_MULT 与移位形式转为 INT_DIV 或 INT_SDIV”，包含形式 `sub( (zext(V)*c), d) >> e => V / (2^n/(c-1)) where n = d*8 + e`，以及使用 `sext` 和 `s>>` 的有符号变体。`RuleModOpt` 是“简化优化 INT_REM 和 INT_SREM 的表达式”。`RuleDivTermAdd` 处理加法修正，`RuleSignDiv2` 将 `(V + -1*(V s>> 31)) s>> 1` 转成 `V s/ 2`，`RulePositiveDiv` 则将符号位为零的值的有符号除法转成无符号除法。第 37 课采集了 Ghidra 12.1.4 对第 33 课 `-O1` 下 `grade` 的输出，其中写着 `uVar2 = param_1 / 10 - 6;`，说明除法已被折叠。

不用 Java 也能看到这些规则的输入。虚拟环境中的 pypcode 4.0.1 使用与 Ghidra 相同的 SLEIGH 规范提升代码，`code/fixtures/idioms-x86_64-O2.lifts.json` 保存了 `div10s` 的原始 P-code：七条指令对应 112 个条目，其中 7 个是标记各指令开始的 `IMARK`。其中有 `unique[95a00:8] = sext(0x66666667)` 之后的 `RAX = RAX * unique[95a00:8]`，以及 `RCX = RCX >> unique[d1a00:4]`、`RAX = RAX s>> unique[c5c00:4]`。`shrq` 带 41 个操作，`sarq` 带 40 个，大多用于计算标志位。`RuleDivOpt` 在该流中匹配乘法和两次移位，死代码消除则去掉无人读取的标志。

angr 10.0.3 对本课 `-O2` 目标文件运行，`idioms-x86_64-O2.angr.json` 保存了 20 个函数的反编译输出。它折叠无符号形式：`div10u` 为 `return a0 / 10;`；但不折叠有符号形式：`div10s` 为 `v1 = a0 * 1717986919; return ((long long)(v1) >> 0x22) + (v1 >> 63);`，`mod10s` 为 `a0 - (...) * 2 * 5`。对 `div7u`，它输出 `(a0 / 7 + ((a0 * 6 / 7 & 0xffffffff) >> 1 & 0xffffffff) & 0xffffffff) >> 2`，修正项仍以算术形式存在。它将 `mul9` 折叠为 `a0 * 9`、`linear_switch` 为 `(a0 < 7 ? a0 * 10 + 10 : 0xffffffff)`、`clamp_max` 为 `((int)a1 < (int)a0 ? a0 : a1)`、`is_pos` 为 `a0 > 0`、`fill` 为 `return memset(a0, 0, a1);`。它将 `table_switch` 输出为不含表值的加载 `*(int *)(4 * a0 + 4195400)`；`sum_n` 使用 `_mm_add_epi32` 和 `_mm_shuffle_epi32` 内建函数；`tail_caller` 为 `tail_target(); return;`，丢失参数。`digest` 中的跳转表变成 `goto *((void *)(...))`，并展开表地址算术。

从源码构建到研究缓存的 radare2 6.2.4 和 rizin 0.9.1 也对同一目标文件运行。radare2 的 `pdc` 将 `div10s` 输出为 `rax = rax * 0x66666667; rcx >>>= 0x3f; rax >>= 0x22; eax += ecx`，这是没有折叠的寄存器级伪 C；`table_switch` 为 `eax = dword [rcx + rax*4]`，在 `lea` 上附 `RELOC 32 .rodata` 注释。rizin 没有内建反编译器；其 `aoi` 将 `imul` 的 RzIL 打印为 128 位乘积。lldb-1703.0.236.21 加载 ELF 目标文件后，`disassemble -n div10s` 输出与 `llvm-objdump` 相同的七条指令，因为两者都使用 LLVM 反汇编器。Capstone 5.0.7 解码相同字节，并报告 `ret`、`mode64` 等分组；它只是解码器，解码器输出从不会包含惯用模式。这里未运行 IDA Pro 和 Binary Ninja；其文档描述了发生此类重写的阶段，即 microcode 优化和 MLIL 到 HLIL 的过程，本课不声称它们具体折叠哪些模式。

Compiler Explorer 用于正向验证。粘贴 `idioms.c`，选择如“x86-64 clang 18.1.0”或“ARM64 GCC 14.2.0”的编译器条目，再设置参数。该服务列出约 1,050 个 C 编译器条目，并提供 API：`GET /api/compilers/c` 返回标识符，`POST /api/compiler/<id>/compile` 以 JSON 返回汇编。Matt Godbolt 在 2019 年 ACM Queue 文章中用它演示了除法、置位计数、链式条件和求和模式。可用它取得这台机器无法生成的 GCC 输出，将 GCC 跳转表阈值及 GCC 12 起的 `-O2` 向量化默认设置，与夹具中的 clang 输出比较。

## 自己构建

运行演示：

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization
python3 code/main.py
```

输出是一份 JSON 报告。对 18 个构建中的每一个，它列出每个函数及其惯用模式，包括类别、源码形式、证据地址、验证状态和详细字段。最后给出各构建的类别矩阵、两种架构的 `-O2` 与 `-O3` 比较，以及 `unverified` 列表。

预期结构如下：

```json
{
  "builds": {
    "idioms-x86_64-O2": {
      "arch": "x86_64", "level": "O2", "flags": "x86_64",
      "functions": {
        "div7u": [{"kind": "division", "source": "x / 7", "evidence": ["0x30", "0x32", "0x39", "0x3d", "0x3f", "0x41", "0x43"], "verified": true, "form": "magic multiply with add fix-up", "magic": "0x24924925", "effectiveMagic": "0x124924925", "shift": 35, "...": "..."}],
        "table_switch": [{"kind": "switch", "source": "switch (k) as lookup table", "table": ".rodata+0x28", "entries": 7, "values": [10, 20, 30, 40, 50, 60, 71], "...": "..."}],
        "sum_n": [{"kind": "vector loop", "lanes": 4, "accumulators": 2, "elementsPerIteration": 8, "...": "..."}]
      }
    }
  },
  "kindMatrix": {"idioms-x86_64-O2": {"division": 5, "modulo": 3, "switch": 6, "vector loop": 3, "...": "..."}},
  "sameCodeAtO2AndO3": {"x86_64": {"identical": true}, "arm64": {"identical": false, "differences": ["..."]}},
  "unverified": []
}
```

按以下顺序阅读 `code/main.py`：

1. `parse_listing()` 将两种架构的 `llvm-objdump -d -r` 文本转成函数、指令和附带重定位。
2. `ElfFile` 读取节、符号和 `.rela.*` 条目，`words()` 读取表条目。
3. `magic_numbers()`、`divisor_from_magic()` 和 `evaluate_division()` 分别实现 Granlund-Montgomery 的正向推导、反向推导及指令序列求值。
4. `parse_source()` 从 C 文件提取验证所需的结构。
5. `Evaluator` 是逐块运行、为寄存器和栈槽命名的符号分析过程。
6. `find_divisions()` 和 `find_modulos()` 匹配乘法、移位、修正、乘回和 2 的幂等形式。
7. `find_switches()` 分类跳转表、查找表、线性映射、选择链、比较树和比较链。
8. `find_vector_loops()`、`find_unrolled_loops()`、`find_tail_calls()`、`find_inlined_calls()`、`find_selects()`、`find_memory_builtins()`、`find_stack_protector()`、`find_cet()` 和 `find_strength_reduction()` 覆盖其余模式。
9. `analyze_function()` 按顺序运行这些步骤，将每种模式的结果名称送入下一轮求值器。

还有三个命令。`python3 code/main.py scan FILE.objdump.txt [FUNCTION]` 对一份清单运行识别器，并在旁边查找目标文件和匹配的 C 文件。`python3 code/main.py magic DIVISOR [signed]` 输出乘数、移位、误差，以及恒等式在边界值上是否成立。`python3 code/main.py figure-data` 输出图示嵌入的数据。

## 使用它

对自己构建的新目标文件，按以下顺序使用识别器。

1. 从目标文件采集 `llvm-objdump -d -r` 输出，并将准确编译命令一同保存。识别器从清单头读取架构。
2. 对清单运行 `scan`，先读 `unverified` 条目。每项要么是源码解析器漏掉的结构，要么是识别器误读的形态，都值得查看对应证据地址。
3. 对每个除法读取 `algorithm`。`clangMatchesAlgorithm` 为真时，编译器选择了最小有效移位量；为假时，说明编译器有你尚不清楚的理由，应记下常量。
4. 对每个 switch，比较各优化级别的 `lowering`。表变成树或树变成表，标志着可从 LLVM 源码中指出的阈值。
5. 对每个循环读取 `elementsPerIteration` 和 `scalarRemainderLoop`，再确认第 33 课报告的两条回边对应一个源码循环。
6. 用一个反编译器处理同一目标文件，将其文本引用在每种模式旁边，并记录它折叠了哪些模式。这份记录是第 45 课的基线。

## 交互实验

### 实验 A：推导魔数，再找到它

在 `code` 目录中启动 Python：

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization/code
python3 -q
```

运行：

```python
from main import *
magic_numbers(10), magic_numbers(10, signed=True)
magic_numbers(7), magic_numbers(7, signed=True)
divisor_from_magic(0x66666667, 34, signed=True), divisor_from_magic(0x66666667, 33, signed=True)
```

第一次调用前，先在纸上计算 `ceil(2^35 / 10)`。然后在 `idioms.c` 的副本中添加 `unsigned div13(unsigned x) { return x / 13; }`，用 `build_fixtures.sh` 中的命令以 `-O2` 构建，将清单中的常量与 `magic_numbers(13)` 对照。

### 实验 B：表与树

```python
listing = load_listing("idioms-x86_64-O2.objdump.txt")
elf = load_elf("idioms-x86_64-O2.o")
sources = load_source("idioms.c")
[i.to_dict() for i in analyze_function(listing, "table_switch", elf, sources)]
[i.to_dict() for i in analyze_function(listing, "sparse_switch", elf, sources)]
elf.words(".rodata", 0x28, 7)
```

在 `table_switch` 的副本中把 `71` 改回 `70`，以 `-O2` 重建，观察查找表变成线性映射。再把一个分支值改成 1000，观察它仍然保持 `ArrayKind` 表。

### 实验 C：三种设置下的循环

```python
for name in ("idioms-x86_64-O1", "idioms-x86_64-O2", "idioms-x86_64-novec-O2"):
    print(name, [i.source for i in analyze_function(load_listing(name + ".objdump.txt"), "sum_n", load_elf(name + ".o"), sources)])
```

手绘 `-O2` 下 `sum_n` 的控制流图，标出保护条件、掩码、向量主体、归约和余数循环，再与 `detail` 字段比较。

### 实验 D：共享的商

```python
for name in ("idioms-x86_64-O1", "idioms-arm64-O1"):
    print([(i.kind, i.source, i.detail.get("sharedQuotient")) for i in analyze_function(load_listing(name + ".objdump.txt"), "digest", load_elf(name + ".o"), sources)])
```

阅读 `digest` 的 `-O1` 清单，找到 x86-64 上将商与符号修正合并的两条指令，再解释为何 AArch64 构建只需一条。

## 实践实验

在夹具中加入位运算技巧，并扩展识别器。

要求：

- 使用 GCC 内建函数和移位或运算旋转，编写 `popcount`、`ctz`、`rotl` 函数，在 `-O2` 下分别带和不带 `-mpopcnt -mbmi` 构建，将目标文件和清单一起提交。
- 识别 `TargetLowering::expandCTPOP` 生成的 `0x55555555`、`0x33333333`、`0x0f0f0f0f`、`0x01010101` 置位计数序列，报告为 `popcount`，并以四个常量作为证据。
- 将 `rep bsfl` 识别为 `tzcnt` 或 `bsf` 的编码，将 `roll %cl` 识别为旋转，并将两者解码回内建函数。
- 在 `parse_source()` 验证中加入新类别，使 `popcount` 模式只有在源码调用 `__builtin_popcount` 时才被验证。
- 为每种模式添加一个从夹具清单读取常量的测试。

成功标准：`python3 code/main.py` 在两个构建中都将三个新类别报告为 `verified: true`，测试套件仍报告空的 `unverified` 列表。

## 本课产物

本课包含 `outputs/skill-compiler-idioms-and-optimization.md`。用它将清单、目标文件及其源码转成经过验证的惯用模式报告，并附反编译器比较。它要求每项断言有证据地址、每个除法有魔数推导、每个 switch 有降低类别和条目来源、每种模式有引用的反编译器输出行。

## 验证

运行演示和确定性测试套件：

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明：

- 清单解析器从 `-O2` 目标文件读取 25 个函数，保留字节，并将 `R_X86_64_PC32 .rodata+0x24` 附到 `table_switch` 中的 `leaq`
- ELF 读取器从 `.rodata+0x28` 返回 `[10, 20, 30, 40, 50, 60, 71]`，并读取 `.rela.rodata` 的十条重定位
- `magic_numbers` 返回移位 35 的 `0xcccccccd`、移位 34 的 `0x66666667`、移位 35 且带加法形式的 `0x124924925`、移位 32 的 `0x55555556`，以及移位 33 的 `0xaaaaaaab`
- 对 2 至 64 中每个不是 2 的幂的除数，无论有符号还是无符号，恒等式都在 32 位边界值上成立
- `divisor_from_magic` 从参数对恢复 10、5、7、3，并拒绝错误配对
- 加法修正序列精确计算 `n // 7`
- 四个 x86-64 除法报告正确乘数、移位、除数和形式，四个 AArch64 除法解码 `mov` 和 `movk`
- `-O0` 使用 `divl` 和 `idivl`，`-O0 -fast-isel=false` 使用乘法，而 `-O0` 的 `digest` 混合两者
- 取模可识别为乘回、`msub`、2 的幂、`sdiv` 加 `mul` 加 `subs`，以及硬件 `idivl`
- 共享商在 `-O1` 下同时保留除法和取模
- 两种架构在 `-O2` 下的五种降低方式均被分类，含公式、值、目标、枢轴和选择表达式
- `-O0` 下的 switch 在 x86-64 上是跳转表，在 AArch64 上是比较链
- x86-64 的 `digest` switch 依次为跳转表、折叠因子为 16 的查找表、四个不同目标的跳转表；AArch64 上则为带 9 至 10 范围测试的比较树
- `-fno-jump-tables` 生成比较树，16 分支 `dispatch` 在 x86-64 上从重定位读取目标，在 AArch64 上从压缩字节表读取
- 向量循环报告 4 通道、2 累加器、每轮 8 元素，以及掩码、保护条件、归约和余数循环
- 固定迭代次数循环被完全向量化或完全展开，`-fno-vectorize` 按 8 次展开
- `-O1` 没有向量化；x86-64 上 `-O2` 与 `-O3` 相同；AArch64 上只在 `call_switch` 不同，`-O3` 有 17 条指令、`-O2` 有 18 条
- `-fno-builtin` 将存储循环转为向量化存储循环，并将 `memcpy` 保留为调用
- 尾调用、`memset` 替换、内联 16 字节复制，以及 `-O0` 的双移动复制都被识别
- 从 `-O1` 起能根据函数体形态找到内联的被调用者
- 选择表达式解码为 `a > b ? a : b`、`-x < 0 ? x : -x`、`(x > 0)` 和 `sum % 10 < 5 ? sum % 10 : 5`
- 栈保护器报告 `%fs:0x28`、槽和 `__stack_chk_fail`，CET 构建中的每个函数都报告 `endbr64`
- 源码解析器读取函数指针参数、switch 分支、调用和累加器名称
- 每个构建的每种模式都被验证，类别矩阵匹配
- 交互图示嵌入的数据与分析输出相同

## 生产环境中的失败模式

| 失败 | 不严谨的工具报告 | 分析必须证明什么 |
|---|---|---|
| 乘以很大的奇数常量 | “乘以 1717986919” | 常量是某个 `d` 对应的 `ceil(2^s / d)`，误差满足界限，移位量是最小有效值 |
| 右移 32 位后的加法修正 | 五条算术指令 | 乘数为 33 位，尾部是同一方法的加法形式 |
| 相同乘数、不同移位 | 相同除数 | 移位决定除数：34 对应 10，33 对应 5 |
| 对 2 的幂有符号取模 | “加 7、掩码、相减” | 偏置使舍入向零，结果为 `x % 8` |
| 从 `.rodata` 索引加载 | “跳转表” | 它是值查找表，条目从加数加 4 处的字节读取 |
| 仿射算术加 `cmov` | “计算 10k + 10” | 这是降低为线性映射的 switch，并与每个源码分支验证 |
| 按序分割的比较链 | “一串 if” | 对分支常量的二分查找，并明确枢轴 |
| 向后分支到默认块 | “循环” | 目标通过无条件跳转离开区域，属于共享尾部 |
| 一个函数中两条回边 | “两个循环” | 一个源码循环的向量主体及其标量余数部分 |
| `jmp memset@PLT` 没有 `ret` | “函数没有返回” | 尾调用通过被调用者返回，替代了存储循环 |
| 调用图缺少被调用者 | “从未调用” | 已内联：调用者中出现被调用者的函数体形态 |
| `%fs:0x28` 加载和比较 | “读取线程局部数据” | 栈保护 canary，失败路径指向 `__stack_chk_fail` |
| 函数起始四个奇怪字节 | “函数前的数据” | `endbr64`，即 CET 落点 |
| 反编译器展示原始算术 | “工具错了” | 工具没有应用折叠；推导给出源码形式，引用输出记录差距 |

## 操作准则

匹配形态，反向执行推导，写出能证明它的常量。为每种模式报告证据地址和解码出的源码形式，对照自己编译的源码逐一验证，并引用每个反编译器对相同字节输出的内容。

## 延伸阅读

- [Granlund, Montgomery, "Division by Invariant Integers using Multiplication" (PLDI 1994)](https://gmplib.org/~tege/divcnst-pldi94.pdf)
- [Warren, Hacker's Delight, 2nd edition, Chapter 10: Integer Division By Constants](https://www.informit.com/store/hackers-delight-9780321842688)
- [Lemire, Kaser, Kurz, "Faster Remainder by Direct Computation" (2019)](https://arxiv.org/abs/1902.01961)
- [libdivide, header-only division by runtime constants](https://github.com/ridiculousfish/libdivide)
- [LLVM `DivisionByConstantInfo.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Support/DivisionByConstantInfo.cpp)
- [LLVM `SwitchLoweringUtils.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/SwitchLoweringUtils.cpp) and [`TargetLoweringBase.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/TargetLoweringBase.cpp)
- [LLVM `SimplifyCFG.cpp`, `simplifySwitchLookup`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Transforms/Utils/SimplifyCFG.cpp)
- [LLVM Auto-Vectorization documentation](https://llvm.org/docs/Vectorizers.html) and [LLVM 3.4 release notes](https://releases.llvm.org/3.4/docs/ReleaseNotes.html)
- [LLVM `LoopIdiomRecognize.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Transforms/Scalar/LoopIdiomRecognize.cpp)
- [LLVM `X86CmovConversion.cpp`](https://github.com/llvm/llvm-project/blob/release/20.x/llvm/lib/Target/X86/X86CmovConversion.cpp)
- [LLVM `StackProtector.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/StackProtector.cpp) and [`X86ISelLoweringCall.cpp`, `getIRStackGuard`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Target/X86/X86ISelLoweringCall.cpp)
- [glibc `sysdeps/x86_64/nptl/tls.h`, `tcbhead_t`](https://sourceware.org/git/?p=glibc.git;a=blob;f=sysdeps/x86_64/nptl/tls.h)
- [GCC `tree-switch-conversion.cc`](https://github.com/gcc-mirror/gcc/blob/master/gcc/tree-switch-conversion.cc), [GCC Optimize Options](https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html), and [GCC 12 release notes](https://gcc.gnu.org/gcc-12/changes.html)
- [Ghidra decompiler `ruleaction.cc`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/decompile/cpp/ruleaction.cc)
- [angr decompiler documentation](https://docs.angr.io/en/latest/analyses/decompiler.html)
- [radare2 book: decompilers](https://book.rada.re/arch/decompile.html)
- [Compiler Explorer API](https://github.com/compiler-explorer/compiler-explorer/blob/main/docs/API.md)
- [Godbolt, "Optimizations in C++ Compilers: A practical journey", ACM Queue 17(5), 2019](https://queue.acm.org/detail.cfm?id=3372264)
- [Microsoft, `/GS` (Buffer Security Check)](https://learn.microsoft.com/en-us/cpp/build/reference/gs-buffer-security-check)
