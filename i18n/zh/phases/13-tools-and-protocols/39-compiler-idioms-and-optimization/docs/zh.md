# 编译器惯用模式:优化如何改写代码,以及如何反向阅读它

> 优化编译器将使用更低成本的指令形态替代源码结构――每个形态都有推导依据,本课程构建了一个反向执行推导――并对照源码验证的识别器――

**Type:** Build
**Languages:** Python, C, x86-64 assembly, AArch64 assembly
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、Phase 13 · 34（提升为伪代码）、Phase 13 · 38（调用约定）
**Time:** ~150 分钟

## 学习目标

- 利用格兰兰德-蒙特哥默里界限推导除任意常量时的魔数和移位数,并从中生成的常量恢复除数.
- 说出LLVM 降低 `switch`五种方式,并从目标文件读取条目数量,表位置和条目内容.
- 转量化循环将解读为通道数,累加器数,每轮元素数,代次掩码,归约和余数循环.
- 识别尾调用、内联的被调用函数、无分支选择,以及转化为`memset`或`memcpy`循环
- 对于 x86-64 与 AArch64`-O0`至 `-O3`报告证据指令及解码的源码形式
- 将结果与Ghidra、angr、radar2、rizin 和 lldb对同一节的输出比较

## 问题

你用了`-O2`编译了`idioms.c`问智能体`div7u`做什么?智能体读到`imulq $0x24924925, %rax, %rax`答案是,这个函数乘以613566757,再移位、相加.`x / 7`,我知道.

另一个7分支,却没有跳转.`switch`转换成一个跳转表的五分支`switch`变成一个`sete`和 `cmovne`两分支的`switch`并且一个遍历`n`个整数循环:每轮在两个`xmm`寄存器中处理八个整数,再使用第二循环处理剩余元素.`-O0`下,相同的源码生成了`divl`七条目的跳转表和一个标志量循环;在`-O1`下,七分支开关 变成值表,而向量循环尚未出现.

这些形式是常用的模式. 编译器根据其源码中可查的规则生成每个模式,也可以将它们解码回原始结构.`0x66666667`△本课程构建覆盖所有这些模式的识别器,对我们自己的代码的18个构建运行,并将全部 373 项报告与C源码验证.

```figure
re-39-idioms-by-level
```

## 常用模式是有推导的形式

惯用模式是编译器针对源码结构生成的命令序列. 它的原因是可以识别,因为它具有固定形状,操作数携带推导预测的常量,并且形状与程序员通常手写的代码不同.

`code/main.py`中的识别器处理`llvm-objdump -d -r`文本;第33课已被确定为指令边界的参考基准.识别器将每个函数分为包含地址,字节,助记符,操作数及后续重定位的指令.`.rodata`字节,以及链接前保存跳转表目标的 `.rela.rodata`条目:

每项检测都是一条条`Idiom`记录,包含`kind`解码出`source`形式`evidence`地址列表`detail`字典和 `verified`标志――标志来自C源码――`parse_source()`读取`idioms.c`找到每个函数,提取`/`与`%`后数除数`*`后乘数`switch`分支及其值`? :`运算符`for`循环和调用者──除法模式的除数出现在函数除法列表中即得到验证;查找表条目与分支值相同或相差的固定倍数时即得到验证; 尾调用者在源码中确实被调用时即得到验证──演示报告`unverified`列表结束,测试套件断言全部18个构建的列表都为空.

解码需要名称――识别器按清单顺序对每个函数的基本块运行小符号求值器,根据第38课的系统V和AAPCS64调用约定,将源码参数名放入参数寄存器――槽按操作数文本跟踪,因此可以穿过`-O0`代码的溢出保存操作――在每个块入口合并前驱状态;若状态不同,先前模式分配的名称优先于常量――因此,`digest`中中 `cmovll %edx, %eax`可读回`sum % 10 < 5 ? sum % 10 : 5`循环模式将累加器命名为`sum`除法模式将商名为`sum / 10`取模模式将结果命名为`sum % 10`◎ 源码写作`rem > 5 ? 5 : rem`两种表达式都取`rem`和 5 的较小值,并`rem == 5`时一致.

## 除了常量

格兰隆和蒙特哥马利的使用乘法 (PLDI 1994) 用乘法和移位替代的不变整数分`n / d`△选择移位量`s`和乘数`m = ceil(2^s / d)`只是一个错误.`e = m * d - 2^s`足够小,范围所有`n`的`floor(n * m / 2^s)`像这样.`floor(n / d)`△对无符号 32位`n`界限是`e <= 2^(s - 32)`满足`|n| < 2^31`没有符号`n`界限为`e <= 2^(s - 31)`并且`n`由于向下取消了负商的转向不符.

`main.py`中中 `magic_numbers(d, bits, signed)`从 32 开始上升搜索`s`返回第一组满足界限参数.

### 没有符号除以10

`2^35 / 10 = 3435973836.8`为了`3435973837 = 0xCCCCCCCD`△误差是`0xCCCCCCCD * 10 - 2^35 = 2`现在,`s = 35`界限为`2^3 = 8`若`s = 34`误差为6,超过4界限,因此35是最小移位量.`n = 123`检查:`123 * 3435973837 = 422624781951`没有任何`422624781951 >> 35 = 12`,我知道.

在 x86-64 的`-O2`下为`div10u`生成的正是这样的形式:

```text
       0: 89 f9                        	movl	%edi, %ecx
       2: b8 cd cc cc cc               	movl	$0xcccccccd, %eax
       7: 48 0f af c1                  	imulq	%rcx, %rax
       b: 48 c1 e8 23                  	shrq	$0x23, %rax
```

`0x23`现在,我已经知道了.`movl %edi, %ecx`将32位参数零扩展到64位寄存器,这是无符号形式.`imulq`提供输入的`movl $imm`读取乘数,读取移位量,然后调用`divisor_from_magic(0xCCCCCCCD, 35)`△该函数尝试`2^35 // m = 10`和 11,并接受 10,因为 `magic_numbers(10)`返回相同乘数和移位量.

在Aarch64上,相同函数是`mov w8, #0xcccd; movk w8, #0xcccc, lsl #16; umull x8, w0, w8; lsr x0, x8, #35`常量分成两个16位半部 达成乘法为`umull`移位量以十进制书写――识别器拼接半部后,报告同一个除数――

### 没有符号除以7加法修正

`2^35 / 7 = 4908534052.57`为了`4908534053 = 0x124924925`需要33位.误差3不超过8界限,因此移位量为35,且更小的移位量均不成立.32位乘法无法容纳这个乘数,所以编译器乘以低32位.`0x24924925`按固定序列加回被除数:

```text
      32: 48 69 c0 25 49 92 24         	imulq	$0x24924925, %rax, %rax
      39: 48 c1 e8 20                  	shrq	$0x20, %rax
      3d: 29 c7                        	subl	%eax, %edi
      3f: d1 ef                        	shrl	%edi
      41: 01 f8                        	addl	%edi, %eax
      43: c1 e8 02                     	shrl	$0x2, %eax
```

将它读作`t = (n * 0x24924925) >> 32`然后`q = (((n - t) >> 1) + t) >> 2`△总移位量为`32 + 1 + 2 = 35`,当`n = 100`时:`t = 14`没有任何`(100 - 14) >> 1 = 43`没有任何`43 + 14 = 57`没有任何`57 >> 2 = 14`△识别器在右移 32 位后检测 `sub`,我知道.`shr`,我知道.`add`,我知道.`shr`尾部,给乘数加回`2^32`恢复出7`evaluate_division()`精确执行这个序列,测试在32位边界值上将其与`n // 7`比较:Aarch64 形式是`sub w9, w0, w8; add w8, w8, w9, lsr #1; lsr w0, w8, #2`因为带移位加法是一条命令,所以少一条.

### 算有符号除3

`2^32 / 3 = 1431655765.33`为了`1431655766 = 0x55555556`误差2`s = 32`时的有符号界限为`2^1 = 2`恰好满足界限,因此移位量是32个.`shrq $0x20`,当`n = -7`时,乘积为`-10021590362`算术右移 32 位得到`-3`符号位已置位,修正加 1,结果为 `-2`现在,我们在中.`-7 / 3`有符号具`div10s`和 `div3s`城市对乘积副本执行`shrq $0x3f`接下来`addl`实现修改.

### 常量本身不能说明什么

只有乘数无法确定除数――`0x66666667`配合移位34 表示 10;同乘数配合移位33 表示 5,第34 课已显示.因此识别器始终将乘数与总移位量配对,`clangMatchesAlgorithm`字段记录该组合是否正确是搜索算法产生的组合──2 的从不使用乘法,`magic_numbers()`由于编译器改用符号偏移的移位,会拒绝它们.`mod8s`展示这一形态.

### 惯用模式属于指令选择阶段

在`-O0`下,`div10u`是 `movl $0xa, %ecx; xorl %edx, %edx; divl %ecx`没有任何`div10s`是 `cltd; idivl %ecx`只是在同一目标文件中`digest`用`imulq $0x66666667`将循环和除以10. 一个参数解释了差异:`idioms-x86_64-nofastisel-O0.o`使用 `-O0 -mllvm -fast-isel=false`构建,其中每次除法都变成乘法,包括使用`movl $0xcccccccd, %ecx; imulq %rcx, %rax; shrq $0x23`的`div10u`△硬件除法是快速指令选择器在`-O0`下的选择;乘法是选择日的降低结果,来自LLVM的 `UnsignedDivisionByConstantInfo`和 `SignedDivisionByConstantInfo`,我知道.`digest`中包含除法块还包含`switch`于是该块交给了选择DAG.`hardware idivl`与`magic multiply`两种形式,图中显示混合形式`-O0`函数――

## 取模跟随商

`x % d`等于`x - (x / d) * d`〔编译器先用上述模式计算商,再乘回除数并相减──x86-64 上乘回10 是`addl %ecx, %ecx; leal (%rcx,%rcx,4), %ecx`其他`2 * q * 5`│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │`msub w0, w8, w9, w0`现在,它在`w9 = 10`时计算`w0 - w8 * w9`识别器沿复制操作跟踪商寄存器,通过 `add`,我知道.`lea`,我知道.`shl`,我知道.`imul`随着累计因子,当因子等于除数时接受后续`sub`,我知道.

报告将保留两种模式.`-O1`下,编译器在`digest`中只计算一次`sum / 10`同时使用`switch`在 x86-64 上,它甚至两次合并该商:取模用`leal (%rax,%rsi), %edi`切换使用`addl %esi, %eax`‧ 识别器报告一次除法和一次取模,并将商标共享.`switch`索引很难理解.

对于2的做有符号取取自主形态,因为它根本不计算商:

```text
      92: 8d 48 07                     	leal	0x7(%rax), %ecx
      95: 85 ff                        	testl	%edi, %edi
      97: 0f 49 cf                     	cmovnsl	%edi, %ecx
      9a: 83 e1 f8                     	andl	$-0x8, %ecx
      9d: 29 c8                        	subl	%ecx, %eax
```

对负数`x`代码在掩码前加偏向 7,使截断按C 要求向零舍入.掩码后的值是截入到8的倍数.`x`相减后留下`x % 8`△AArch64 使用 `negs w8, w0; and w9, w0, #0x7; and w8, w8, #0x7; csneg w0, w9, w8, mi`同时掩码`x`和 `-x`按符号选择并取负负.`RuleSignMod2nOpt`简介为转换 INT_SREM 形式:`(V + (sign >> (64-n)) & (2^n-1)) - (sign >> (64-n)) => V s% 2^n`──

在`-O0`下,AArch64使用`sdiv w9, w8, w10; mul w9, w9, w10; subs w0, w8, w9`表达取模──识别器也接受这种形式,并报告`hardware sdiv + mul + subs`,我知道.

## 转换的五种降低方式

在两个位置决定`switch`形态`SimplifyCFG::simplifySwitchLookup`在`-O1`及以上运行:当至少有三个分支,每个分支都产生常量,并且目标支持查找表时,将转换为值表.`SingleValueKind`,我知道.`LinearMapKind`,我知道.`BitMapKind`和 `ArrayKind`,我知道.`-O0`流水线不运行该过程. 剩余交换进入命令选择阶段.`SwitchLowering::findJumpTables`没有什么.`min-jump-table-entries`个条目(默认 4)且足够密集时构建跳转表――密度条件为 `NumCases * 100 >= Range * MinDensity`普通函数的`jump-table-density`为10个`-Os`下为40――剩余情况变为分支常量二分查找,由 `splitWorkItem`选择枢轴―― 具备为每种结果提供一个函数――

| 函数 | 源码 | `-O0` x86-64 | `-O2` x86-64 | `-O2` AArch64 |
|---|---|---|---|---|
| `linear_switch` | 分支 0 至 6 返回 10 至 70 | 7 条目跳转表 | 线性映射 `10*k + 10`，默认 -1 | `madd` 和 `csinv` |
| `table_switch` | 分支 0 至 6 返回 10 至 60，再返回 71 | 7 条目跳转表 | `.rodata+0x28` 处的查找表 | `.rodata+0x0` 处的查找表 |
| `call_switch` | 分支 0 至 4 调用五个指针中的一个 | 5 条目跳转表 | 5 条目跳转表 | 比较树，枢轴 1 |
| `sparse_switch` | 分支 1、100、10000、1000000、100000000 | 比较链 | 比较树，枢轴 9999 | 比较树，枢轴 9999 |
| `two_cases` | 分支 3、4 返回 7、9 | 比较链 | 选择链 `k != 3 ? (k == 4)*9 : 7` | 两条 `csel` |

### 从目标文件读取查找表

`-O2`下一个`table_switch`其他:

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

边界检查`cmpl $6; ja`表示有7个有效条目.`0x24`加上 RIP 相对字段的4字节,将表定位到`.rodata+0x28`现在,这正是第33节的规则.`0a 00 00 00 14 00 00 00 ...`为了`[10, 20, 30, 40, 50, 60, 71]`汇编器在 `.s`文件中将表命名为`.Lswitch.table.table_switch`并附注释`@switch.table.table_switch`△目标文件中只剩重定位和字节──这里没有跳转,因此控制流图有三个块──

通过Aarch64 形式`adrp x8`和 `add x8, x8, #0x0`拼出表地址,两者各带一条指向`.rodata`重定位,再使用`ldr w0, [x8, w0, uxtw #2]`载载识别器`add`重定位读取加数:

### 完全没有表的线性映射

`linear_switch`对于0至6个`k`返回`10 * (k + 1)`,我知道.`simplifySwitchLookup`检测到仿射关系,改为生成算术操作:

```text
      b0: 83 ff 07                     	cmpl	$0x7, %edi
      b3: 8d 04 bf                     	leal	(%rdi,%rdi,4), %eax
      b6: 8d 4c 00 0a                  	leal	0xa(%rax,%rax), %ecx
      ba: b8 ff ff ff ff               	movl	$0xffffffff, %eax
      bf: 0f 42 c1                     	cmovbl	%ecx, %eax
```

求值器将`leal (%rdi,%rdi,4)`读为`5*k`将`leal 0xa(%rax,%rax)`读为`10*k + 10`将`cmpl $7`后者`cmovb`读为`k < 7 ? 10*k + 10 : -1`◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎`madd w8, w0, w8, w9`和 `csinv w0, w8, wzr, lo`得到相同的表达,其中带`wzr`的`csinv`在默认路径产生`-1`,我知道.

### 从重定位读取跳转表

`-O2`下一个`call_switch`与第33课`-O0`的`grade`中恢复的形态相同:`cmpl $4; ja`向`.rodata-0x4`的`leaq`、读取 4 字节条目的 `movslq`,我知道.`addq`接下来`jmpq *%rax`五条条目是`.rela.rodata`中的重定位,`target = addend - 4k`得到了`0x10c, 0x107, 0x10e, 0x110, 0x109`分别指向五个不同的块,每个块通过函数指针尾跳转.`dispatch`具将其扩展为16个分支:x86-64 上有16条重定位;AArch64 上则是16个单字节组成的缩写表,用`ldrb w11, [x9, x8]`读取,以`add x10, x10, x11, lsl #2`乘以4再指向第一个分支块`adr`为基址──识别器从字节表解码出 `[0x24, 0x74, 0x54, ...]`并报告`compressed: true`,我知道.

### 同一个交换器的四种优化级别

`digest`包含对`sum / 10`交换器的分支为6到10,值为1,2,4,8,然后结果将乘以16――在x86-64上,它在`-O0`下为跳转表,在`-O1`下为条目`[16, 32, 64, 128, 128]`查找表,到`-O2`和 `-O3`转换表,其四个分支块分别保存`0x10`,我知道.`0x20`,我知道.`0x40`,我知道.`0x80`从`-O1`起,乘以16 移入分支;在`-O0`下,分支保存1、2、4、8,乘法仍在转换后.对.`-O1`查找表,识别器将条目与源码值进行比较,找到固定比率,并报告`foldedFactor: 16`│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │`-O2`形式是枢轴为8的比较树,含有6、7、8的相等测试,以及范围测试.`sub w9, w9, #9; cmp w9, #2; b.hs`通过两条测试操作覆盖分支 9 和 10 识别器报告`rangeTests: [[9, 10]]`,我知道.

两个参数会移动这些边界.`-fno-jump-tables`在 x86-64 上将`table_switch`,我知道.`call_switch`和 `digest`转为比较树,七分支函数的枢轴为 2 和 4 ・AArch64 上,`-mllvm -min-jump-table-entries=4`仍让`call_switch`保持比较树,因此对该目标的五分支间接调用开关,条目数量不是决定因素.`idioms-arm64-jt4-O2.o`记录了这次运行.

墨西哥湾委员会将做出两项决定.`tree-switch-conversion.cc`中,使用 `jump_table_cluster`,我知道.`bit_test_cluster`,我知道.`switch_decision_tree`和 `switch_conversion`类:`-ftree-switch-conversion`在`-O2`开启,`-fjump-tables`和 `-fbit-tests`在`-O1`开启,跳转表 价值来自`case-values-threshold`默认值由机器决定. 这台机器未安装GCC,因此这些名称来自GCC源码和手册,可在编译器探险器中检查.

## 循环:向量化、展开或替换

的循环向量化器`-O2`,我知道.`-O3`,我知道.`-Os`开启,在`-O0`,我知道.`-O1`关闭,这条规则可追溯到2014年1月的LLVM 3.4──`-O2`下一个`sum_n`展示了这种形态的每个部分:

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

保护条件`cmpl $7; ja`代送入标量循环的8次以下.`andl $0x7ffffff8`将代数向下放入为8个倍数.`xmm`累加器,每个包含四个32位通道,因此向量化因子为4交错因子为2循环后,`paddd`两条`pshufd`其他两条`paddd`和 `movd`将八个通道归为整数.`0x270`处的循环是处理最后0至7个元素的标量余数循环.识别器通过回边找到循环,识别SIMD寄存器,从`paddd`读取通道数,统计不同加加器,将步长 `0x20`除以4报告`4 lanes x 2 accumulators = 8 elements per iteration`已以字段形式记录掩码,保护条件,归约和余数循环.`ldp q2, q3`两条`add v.4s`,我知道.`addv s0, v0.4s`和 `fmov w8, s0`完成同样的工作.

固定代次数会消除循环.`sum4`由一条 `movdqu`归约和`movd`构成,没有回边.`poly8`无法量化,因为每轮依赖于一轮加加加器,所以编译器将将它展开八次:从`%rdi`的偏移 0 至 `0x1c`加载八次,每次后都左移 5位再相减,计算`acc * 31`△识别器统计同基址的连续移动加载,报告`loop unrolled by 8, no back edge`△AArch64的相同载荷以四对`ldp`现场

用`-fno-vectorize -fno-slp-vectorize`关闭向量化器后,`sum_n`变为展开八次的标量循环,包含八条`addl k(%rdi,%rdx,4), %eax`和 `addq $8`更多的循环`sum4`则变成四次加法──识别器对前者报告`unrolled loop`,我知道.`copies: 8`和 `indexStep: 8`报告`copies: 4`,我知道.

第33课`-O2`的`total`在中找到两条回边,称它们为两个循环;本课进一步指出,它们是同一源码循环的向量主体和标量余数部分.`is_loop()`检查这个条件,因为AArch64的`digest`包含向后跳到共享默认块的分支,它们不是循环,而识别器的第一版误认为它是向量循环.

### 变成调用循环

从`-O1`起,`LoopIdiomRecognize`将逐字节存储零的循环转换为`memset`调用.`-O2`下一个`fill`是 `testl %esi, %esi; jle; movl %esi, %edx; xorl %esi, %esi; jmp memset@PLT`◎该调用是带`R_X86_64_PLT32 memset-0x4`重定位的尾跳转,函数的`retq`只有现在空路径――识别器报告`store loop recognized as memset(...)`并且对照源码循环验证,因为源码从未直接调用`memset`,我知道.

`copy16`用常量16调用`memcpy`后端将其内联为`movups (%rsi), %xmm0; movups %xmm0, (%rdi)`没有超过每次`memcpy`最多8次存储限制.`-O0`下,同调用为两对八字节`movq`△使用`-fno-builtin`时,调用保留为带`movl $0x10, %edx`的`jmp memcpy@PLT`其他`fill`保存循环,向量化器然后将其转换为每轮两次16字节`movups`存储器 识别器 构建报告`vectorized store loop: 2 x 16-byte stores = 32 bytes per iteration`,我知道.

## 消失或变成跳转调调

`tail_caller`返回`tail_target(x + 1)`在`-O0`下,它是`addl $0x1, %edi; callq tail_target@PLT; addq $0x10, %rsp; popq %rbp; retq`在`-O2`下,只有`incl %edi; jmp tail_target@PLT`调用者消失,被调用者直接返回调用者的调用者──AArch64 上是带 `R_AARCH64_JUMP26`的`b tail_target`识别器将带调用重定位的`jmp`或`b`视为尾调用――第33课的递归下降必须将其视为函数出口,因为目标位于函数之外――

`twice_sum`调用`leaf_add`在`-O0`下存在`callq leaf_add@PLT`从`-O1`起,`leaf_add`的函数体`leal (%rdi,%rsi), %eax`现在`twice_sum`现在,不再保留调用.`-O0`下,clang 为每个函数标记`optnone`和 `noinline`只有强制的内联器.`twice_sum`调用了`leaf_add`,如果没有找到调用或尾跳转,就在调用者中寻找调用者的函数体形态:删除目标操作数后的助记符和源操作数.`add w8, w1, w0`能匹配被调用者中`add w0, w1, w0`找到一个匹配就是证据.

`dispatch`同时结合两种模式:一个16条跳转表,每个分支都是`movl %esi, %edi; jmp fN@PLT`△识别器报告一个开关和16个调用,并全部与源码中的16次调用验证.

## 成为数据移动的分支

`clamp_max`是 `movl %esi, %eax; cmpl %esi, %edi; cmovgl %edi, %eax`求值器将 求值器将`%edi`命名为`a`,我知道.`%esi`命名为`b`记录比较,再将`cmovg`解读为`a > b ? a : b`根据原始码.`abs_int`是 `movl %edi, %eax; negl %eax; cmovsl %edi, %eax`读作`-x < 0 ? x : -x`        `cmp w0, #0; cneg w0, w0, mi`读作`x < 0 ? -x : x`,我知道.`is_pos`是 `xorl %eax, %eax; testl %edi, %edi; setg %al`其他`(x > 0)`△GCC将将此类转换称为`-fif-conversion`,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`cmov`选择――LLVM 的 选择`X86CmovConversion`判断过程有利可图`cmov`再转回分支,这也解释了同一源码在循环中可能出现一种形式.

在`-O0`下,这些模式都不存在.`clamp_max`对于其他国家,`jle`向同一槽的两个存储和一次加载.`-O0`下不报告模式,从`-O1`起报告`branchless select`图直观证明了这一事实.

`mul9`只有一个条`leal (%rdi,%rdi,8), %eax`识别器报告`strength reduction`和 `x * 9`由于源码确实乘以9......只有源码包含这个因子,所以才这样报告;缩小表索引的`lea`不应被认可源码乘法.

## 两种看起来像常用的模式的强化特性

保护器是编译器的特性,会被智能体误读为程序逻辑的形态.`canary.c`在 x86-64 Linux 上使用`-fstack-protector-strong`编译,得到:

```text
       7: 64 48 8b 04 25 28 00 00 00   	movq	%fs:0x28, %rax
      10: 48 89 44 24 40               	movq	%rax, 0x40(%rsp)
      26: 64 48 8b 0c 25 28 00 00 00   	movq	%fs:0x28, %rcx
      2f: 48 3b 4c 24 40               	cmpq	0x40(%rsp), %rcx
      34: 75 05                        	jne	0x3b <with_canary+0x3b>
      3b: e8 00 00 00 00               	callq	0x40 <plain_leaf>
		000000000000003c:  R_X86_64_PLT32	__stack_chk_fail-0x4
```

`%fs:0x28`是一个的`tcbhead_t`中中 `stack_guard`字节偏移为40;LLVM 的`getIRStackGuard`为glibc、bionic 和 Fuchsia 指定这个槽──函数序言将保护值复制到缓冲区上方,尾声比较,失败路径调用 `__stack_chk_fail`△AArch64 Linux 上,保护值从全局 `__stack_chk_guard`经过 GOT,`adrp`和 `ldr`取得,失败路径为`bl __stack_chk_fail`‧识别器报告保护值来源、槽、比较和失败调用──没有数组`plain_leaf`在`strong`下没有鱼;该模式保护有数组`alloca`或局部变量地址被获取的函数――研究笔记还记录了MSVC`/GS`形式:cookie与`%rsp`混合,通过`__security_check_cookie`检查――机器上没有MSVC链接器,因此这种形式仅根据编译器汇编输出描述――

`-fcf-protection=full`将`endbr64`子`f3 0f 1e fa`对于支持控制流强制保护的处理器,它是间接支付点;在其他处理器上,作为`nop`执行──Ghidra 的 x86-64 函数起始模式因此包含带 `endbr64`之前的`push rbp; mov rbp, rsp`变体――识别器将其报告为`cet landing pad`避免将开始于四个不寻常字节的函数误判为数据.

## 反编译器会折叠哪些模式

第37课中的每一个反编译器都会重写规则执行其中一部分推导.`ruleaction.cc`中为规则命名──`RuleDivOpt`是将 INT_MULT 与移位形式转为 INT_DIV 或 INT_SDIV,包含形式`sub( (zext(V)*c), d) >> e => V / (2^n/(c-1)) where n = d*8 + e`及使用`sext`和 `s>>`没有变体的符号.`RuleModOpt`是简化优化INT_REM 和INT_SREM的表达式──`RuleDivTermAdd`处理加法修正,`RuleSignDiv2`将`(V + -1*(V s>> 31)) s>> 1`转成`V s/ 2`没有任何`RulePositiveDiv`则将符号位为零的值有符号除法转为无符号除法. 第37课采集了第33课的Ghidra 12.1.4`-O1`下一个`grade`输出,其中写着`uVar2 = param_1 / 10 - 6;`说明除法已被折叠了.

不用Java也可以看到这些规则的输入.`code/fixtures/idioms-x86_64-O2.lifts.json`保存了`div10s`七条命令对应 112条条,其中7条是标记各条令开始的`IMARK`,其中有.`unique[95a00:8] = sext(0x66666667)`之后的`RAX = RAX * unique[95a00:8]`及`RCX = RCX >> unique[d1a00:4]`,我知道.`RAX = RAX s>> unique[c5c00:4]`,我知道.`shrq`带41个操作,`sarq`带 40 个,大多用于计算标志位.`RuleDivOpt`在该流中匹配乘法和两次移位,死代码消除则消除无人读取的标志.

对于本课`-O2`目标文件运行,`idioms-x86_64-O2.angr.json`保存了20个函数的反编译输出. 它折叠无符号形式:`div10u`为`return a0 / 10;`没有折叠的符号形式:`div10s`为`v1 = a0 * 1717986919; return ((long long)(v1) >> 0x22) + (v1 >> 63);`没有任何`mod10s`为`a0 - (...) * 2 * 5`对对`div7u`它们输出了`(a0 / 7 + ((a0 * 6 / 7 & 0xffffffff) >> 1 & 0xffffffff) & 0xffffffff) >> 2`修改项仍存在算术形式.`mul9`折叠为`a0 * 9`,我知道.`linear_switch`为`(a0 < 7 ? a0 * 10 + 10 : 0xffffffff)`,我知道.`clamp_max`为`((int)a1 < (int)a0 ? a0 : a1)`,我知道.`is_pos`为`a0 > 0`,我知道.`fill`为`return memset(a0, 0, a1);`,它会`table_switch`输出为不含表值的加载`*(int *)(4 * a0 + 4195400)`其他`sum_n`使用 `_mm_add_epi32`和 `_mm_shuffle_epi32`内建函数;`tail_caller`为`tail_target(); return;`丢失参数.`digest`中的跳转表变成了`goto *((void *)(...))`没有任何问题.

从源码构建到研究缓存的雷达2 6.2.4 和里 0.9.1 也对相同的目标文件运行.`pdc`将`div10s`输出为`rax = rax * 0x66666667; rcx >>>= 0x3f; rax >>= 0x22; eax += ecx`没有折叠的寄存器级假C;`table_switch`为`eax = dword [rcx + rax*4]`在`lea`上附 `RELOC 32 .rodata`注释──里津 没有内建反编译器;其 `aoi`将`imul`印发为 128 位乘积.lldb-1703.0.236.21 加载 ELF 目标文件后,`disassemble -n div10s`输出与`llvm-objdump`类似的七条指令,因为它们都使用LLVM反汇编器――Capstone 5.0.7 解码相同字节,并报告`ret`,我知道.`mode64`等分组;它只是解码器,解码器输出从未包含惯用模式.这里没有运行 IDA Pro 和二元忍者;其文档描述了发生这种重写阶段,即微码优化和MLIL到HLIL的过程,本课不声称它们具体折叠的模式.

编译器 Explorer 用于正向验证.`idioms.c`选择如x86-64 lang 18.1.0或ARM64 GCC 14.2.0 的编译器条目,再设置参数――该服务列出约1,050个C编译器条目,并提供API:`GET /api/compilers/c`返回标识符,`POST /api/compiler/<id>/compile`以 JSON 返回汇编.Matt Godbolt 在2019年ACM队列文章中使用它演示除法、置位计数、链式条件和求和模式──可用它获得这个机器无法生成的GCC输出,将GCC 跳转表值和GCC 12起的`-O2`量化默认设置,与具中的语输出比较

## 构建自己

运行演示:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization
python3 code/main.py
```

输出是一个JSON报告. 对18个构建中的每个构建,它列出了每个函数及其常用的模式,包括类型,源码形式,证据地址,验证状态和细节段.最后给出了各构建的类型矩阵,两个构建.`-O2`与`-O3`比较,以及`unverified`列表:

预期结构如下:

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

按以下顺序阅读 `code/main.py`其他:

1. `parse_listing()`两种结构`llvm-objdump -d -r`文本转成函数、指令和附带重定位──
2. `ElfFile`读取节、符号和 `.rela.*`条目,`words()`读取表条目──
3. `magic_numbers()`,我知道.`divisor_from_magic()`和 `evaluate_division()`分别实现格兰德-蒙特哥默的正向推导"",反向推导及指令序列求值――
4. `parse_source()`从 C 文件提取验证所需的结构.
5. `Evaluator`是个块运行,为寄存器和槽命名的符号分析过程.
6. `find_divisions()`和 `find_modulos()`匹配乘法、移位、修正、乘回和2的等形式──
7. `find_switches()`分类跳转表,查找表,线性映射,选择链,比较树和比较链.
8. `find_vector_loops()`,我知道.`find_unrolled_loops()`,我知道.`find_tail_calls()`,我知道.`find_inlined_calls()`,我知道.`find_selects()`,我知道.`find_memory_builtins()`,我知道.`find_stack_protector()`,我知道.`find_cet()`和 `find_strength_reduction()`覆盖其余模式――
9. `analyze_function()`按照运行这些步骤,将每个模式的结果名称送入下一轮求值器.

还有三个命令.`python3 code/main.py scan FILE.objdump.txt [FUNCTION]`查找目标文件和相应的C文件.`python3 code/main.py magic DIVISOR [signed]`输出乘数,移位,差异以及恒等式是否存在在边界值上.`python3 code/main.py figure-data`输出图示嵌入的数据.

## 使用它

为了自己构建的新目标文件,按下列顺序使用识别器.

1. 从目标文件采集`llvm-objdump -d -r`输出,并将准确编译命令一起保存.
2. 对清单运行`scan`首先读`unverified`条目──每项都值得查看对应证据的地址──
3. 对于每一个法则`algorithm`,我知道.`clangMatchesAlgorithm`为真时,编译器选择最小有效移位量;为假时,说明编译器有你尚不清楚的理由,应记下常量――
4. 对于每个交换器,比较各优化级别.`lowering`△表变成树或树变成表,标志着可从LLVM源码中指出的值.
5. 对于每一个循环读取`elementsPerIteration`和 `scalarRemainderLoop`确认第33课报告的两条回边对应一个源码循环.
6. 用一个反编译器处理相同的目标文件,将其文本引用在每个模式旁边,并记录它折叠的模式.

## 交互实验

### 实验A:推导魔数,再找到它

在`code`目录中启动Python:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization/code
python3 -q
```

运行:

```python
from main import *
magic_numbers(10), magic_numbers(10, signed=True)
magic_numbers(7), magic_numbers(7, signed=True)
divisor_from_magic(0x66666667, 34, signed=True), divisor_from_magic(0x66666667, 33, signed=True)
```

第一次调用前,先在纸上计算`ceil(2^35 / 10)`然后在`idioms.c`副本中添加`unsigned div13(unsigned x) { return x / 13; }`用`build_fixtures.sh`中央命令以`-O2`构建,将清单中的常量与`magic_numbers(13)`照顾

### 实验B:表与树

```python
listing = load_listing("idioms-x86_64-O2.objdump.txt")
elf = load_elf("idioms-x86_64-O2.o")
sources = load_source("idioms.c")
[i.to_dict() for i in analyze_function(listing, "table_switch", elf, sources)]
[i.to_dict() for i in analyze_function(listing, "sparse_switch", elf, sources)]
elf.words(".rodata", 0x28, 7)
```

在`table_switch`副本中把`71`改回`70`以`-O2`重建,观察查找表变成线性映射.再把一个分支值改成1000,观察它仍然保持.`ArrayKind`面包

### 实验C:三种设置下循环

```python
for name in ("idioms-x86_64-O1", "idioms-x86_64-O2", "idioms-x86_64-novec-O2"):
    print(name, [i.source for i in analyze_function(load_listing(name + ".objdump.txt"), "sum_n", load_elf(name + ".o"), sources)])
```

手绘 `-O2`下一个`sum_n`控制流图,标记保护条件,掩码,向量主体,归约和余数循环,再与`detail`字段比较.

### 实验D:共享商

```python
for name in ("idioms-x86_64-O1", "idioms-arm64-O1"):
    print([(i.kind, i.source, i.detail.get("sharedQuotient")) for i in analyze_function(load_listing(name + ".objdump.txt"), "digest", load_elf(name + ".o"), sources)])
```

阅读 `digest`的`-O1`清单,找到 x86-64 上将商与符号修改合并的两条指令,再解释为什么AArch64 构建只需要一条――

## 实践实验

在具中加入位运算技巧,并扩展识别器.

要求:

- 使用GCC内建函数和移位或运算旋转,编写`popcount`,我知道.`ctz`,我知道.`rotl`函数,在`-O2`下分别带和不带`-mpopcnt -mbmi`构建,将目标文件和清单一起提交.
- 识别`TargetLowering::expandCTPOP`生成的`0x55555555`,我知道.`0x33333333`,我知道.`0x0f0f0f0f`,我知道.`0x01010101`位数序列,报告为`popcount`并以四个常量作为证据.
- 将`rep bsfl`识别为`tzcnt`或`bsf`编码,将 `roll %cl`识别为旋转,并将两者解码回内建函数――
- 在`parse_source()`验证中加入新类别,使 `popcount`模式只在源码调用`__builtin_popcount`时才被验证.
- 为每种模式添加一个从具清单读取常量测试.

成功标准:`python3 code/main.py`在两个建构中,都将有三个新类别报告.`verified: true`测试套件仍在报告空中`unverified`列表:

## 本课产物

本课包含`outputs/skill-compiler-idioms-and-optimization.md`△它将清单,目标文件及其源码转化为经验的惯例模式报告,并附加反编译器比较. 它要求每个断言都有证据地址,每个除法都有魔术推导数,每个开关都有降低类别和条目来源,每个模式都有引用的反编译器输出行程.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- 清单解析器从`-O2`目标文件读取 25 个函数,保留字节,并将 `R_X86_64_PC32 .rodata+0x24`附到`table_switch`中中 `leaq`
- 读取器从 `.rodata+0x28`返回`[10, 20, 30, 40, 50, 60, 71]`并读取`.rela.rodata`的十条重定位
- `magic_numbers`返回移位 35 的 `0xcccccccd`移位 34 的`0x66666667`移位 35 且带加法形式的`0x124924925`移位 32 的`0x55555556`移位 33 的`0xaaaaaaab`
- 对2至64中每一个不为2的除数,无论有符号还是没有符号,恒等式都在32位边界值上成立
- `divisor_from_magic`从参数对恢复 10、5、7、3,并拒绝错误配对
- 加法修正序列精确计算`n // 7`
- 解法报告正确乘数,移位,除数和形式,四个Aarch64解法码`mov`和 `movk`
- `-O0`使用 `divl`和 `idivl`没有任何`-O0 -fast-isel=false`使用乘法,而`-O0`的`digest`混合两者
- 取模可识别为乘回`msub`,我知道.`sdiv`加  `mul`加  `subs`及硬件`idivl`
- 共同商务`-O1`下同时保留除法和取模
- 两种架构在`-O2`下五种降低方式均分类,含公式,值,目标,枢轴和选择表达式
- `-O0`下的开关在 x86-64 上是跳转表,在 AArch64 上是比较链
- 没有什么问题`digest`按次为跳转表"",折叠因子为16个搜索表"",四个不同的目标跳转表";AArch64 上则为9至10个范围测试的比较树
- `-fno-jump-tables`生成比较树,16 分支 `dispatch`在 x86-64 上从重定位读取目标,在 AArch64 上从缩写节表读取
- 量循环报告 4 通道、2 累加器、每轮8个元素,以及掩码、保护条件、归约和余数循环
- 固定代次数循环完全向量化或完全展开,`-fno-vectorize`按 8 次展开
- `-O1`没有向量化;x86-64 上`-O2`与`-O3`像AArch64上只在`call_switch`不同的,`-O3`有17条命令.`-O2`有18条
- `-fno-builtin`将储存循环转化为量化储存循环,并将`memcpy`保存为调用
- 尾调用,`memset`替换、内联 16 字节复制,以及`-O0`双移动复制都被识别
- 从`-O1`起能根据函数体形态找到内联的调用者
- 选择表达式解码为`a > b ? a : b`,我知道.`-x < 0 ? x : -x`,我知道.`(x > 0)`和 `sum % 10 < 5 ? sum % 10 : 5`
- 保护器报告 `%fs:0x28`槽和槽`__stack_chk_fail`CET 构建中的每个函数都报告`endbr64`
- 源码解析器读取函数指针参数、开关 分支、调用和累加器名称
- 每个构建的每种模式都得到验证,类矩阵匹配
- 交互图像嵌入式数据与分析输出相同

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

匹配形态,反向执行推导,写出能证明它的常量――对每种模式报告证据地址和编码出出的源码形式,对照自己编译的源码逐一验证,并引用每个反编译器对相同字节输出的内容――

## 延伸阅读

- [Granlund, Montgomery, "Division by Invariant Integers using Multiplication" (PLDI 1994)](https://gmplib.org/~tege/divcnst-pldi94.pdf)
- [Warren, Hacker's Delight, 2nd edition, Chapter 10: Integer Division By Constants](https://www.informit.com/store/hackers-delight-9780321842688)
- [Lemire, Kaser, Kurz, "Faster Remainder by Direct Computation" (2019)](https://arxiv.org/abs/1902.01961)
- [libdivide, header-only division by runtime constants](https://github.com/ridiculousfish/libdivide)
- [LLVM `DivisionByConstantInfo.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Support/DivisionByConstantInfo.cpp)
- [LLVM `SwitchLoweringUtils.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/SwitchLoweringUtils.cpp)其他[`TargetLoweringBase.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/TargetLoweringBase.cpp)
- [LLVM `SimplifyCFG.cpp`, `simplifySwitchLookup`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Transforms/Utils/SimplifyCFG.cpp)
- [LLVM Auto-Vectorization documentation](https://llvm.org/docs/Vectorizers.html)其他[LLVM 3.4 release notes](https://releases.llvm.org/3.4/docs/ReleaseNotes.html)
- [LLVM `LoopIdiomRecognize.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Transforms/Scalar/LoopIdiomRecognize.cpp)
- [LLVM `X86CmovConversion.cpp`](https://github.com/llvm/llvm-project/blob/release/20.x/llvm/lib/Target/X86/X86CmovConversion.cpp)
- [LLVM `StackProtector.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/StackProtector.cpp)其他[`X86ISelLoweringCall.cpp`, `getIRStackGuard`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Target/X86/X86ISelLoweringCall.cpp)
- [glibc `sysdeps/x86_64/nptl/tls.h`, `tcbhead_t`](https://sourceware.org/git/?p=glibc.git;a=blob;f=sysdeps/x86_64/nptl/tls.h)
- [GCC `tree-switch-conversion.cc`](https://github.com/gcc-mirror/gcc/blob/master/gcc/tree-switch-conversion.cc)现在[GCC Optimize Options](https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html)其他[GCC 12 release notes](https://gcc.gnu.org/gcc-12/changes.html)
- [Ghidra decompiler `ruleaction.cc`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/decompile/cpp/ruleaction.cc)
- [angr decompiler documentation](https://docs.angr.io/en/latest/analyses/decompiler.html)
- [radare2 book: decompilers](https://book.rada.re/arch/decompile.html)
- [Compiler Explorer API](https://github.com/compiler-explorer/compiler-explorer/blob/main/docs/API.md)
- [Godbolt, "Optimizations in C++ Compilers: A practical journey", ACM Queue 17(5), 2019](https://queue.acm.org/detail.cfm?id=3372264)
- [Microsoft, `/GS` (Buffer Security Check)](https://learn.microsoft.com/en-us/cpp/build/reference/gs-buffer-security-check)
