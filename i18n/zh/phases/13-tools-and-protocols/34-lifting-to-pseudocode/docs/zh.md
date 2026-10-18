# 提升为伪代码:从零构建 IR、SSA与结构化

> 反编译器的输出是一个隐藏推导过程的断言.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 32（从零理解 ELF）、Phase 13 · 33（反汇编与控制流）
**Time:** ~150 分钟

## 学习目标

- 将已解码的 x86-64 指令升级为小型 IR(中表示),显式表达标志,加载,存储,分支,调用和返回──
- 将槽位转换为局部变量,将系统V参数寄存器转换为形参.
- 在控制边界放置phi 函数,构建最小的SSA (静态单赋值形式),然后进行替换,简化和死代码消除.
- 利用后控制节点和回边,从控制流图中恢复`if`带`else`的`if`,我知道.`while`和 `do while`,我知道.
- 乘以`0x66666667`解释为除以 10,并证明这个恒等关系.
- 逐行阅读同一组函数的字符,指出每处差异背后的指令或猜测.

## 问题所在

你向 rea 请`ledger-x86_64-O1.o`中 中`percent_change`后10秒后给出了答案:

```c
undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)

{
  long lVar1;
  undefined1 auVar2 [16];
  undefined1 auVar3 [16];
  
  if (param_1 != 0) {
    lVar1 = (long)((param_2 - param_1) * 100);
    auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
    auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
    return auVar3;
  }
  auVar2._8_8_ = 0;
  auVar2._0_8_ = param_3;
  return auVar2 << 0x40;
}
```

源码只有四行,接收两个`int`值并返回一个`int`希德拉却报告了一个16字节返回值,以及源码中不存在的第三个参数.

作为一个`procedure_pseudo_code`结果回归,并给记录附上一条限制说明:伪代码是Ghidra反编译器的输出,不是原始源码,也不与Hopper 输出文本等价──`compare_functions`工具按文本行对伪代码进行差异比较. 它自己的维度记录写着汇编是不透明的提供方文,并说明无法进行重定位归结.

实际上,DX-Ball的记录显示了价格.`FUN_00406400(void)`调用`__ftol()`◎指令视图却显示一个输入和一个x87表达式──代理 之所以继续调查,只是因为两个视图相互矛盾──

本课构建反编译器隐藏起来的推导过程――你将从第33课解码的56条指令发出,升级为IR,重新命名为SSA,进行简化并恢复结构――然后将你的`percent_change`,我知道.`grade`和 `total`伪代码与Ghidra的输出并排对照,解释每一个差异.测试将使用clang编译你的输出,并输入网格上运行它,与源码进行对比.

```figure
lifting-stages-percent-change
```

## 测试样例与参考判断

`code/fixtures/ledger.c`是课程这一部分的共用测试样本:

```c
int percent_change(int before, int after) {
    if (before == 0) return 0;
    return (after - before) * 100 / before;
}

int grade(int score) {
    switch (score / 10) {
    case 10:
    case 9: return 4;
    case 8: return 3;
    case 7: return 2;
    case 6: return 1;
    default: return 0;
    }
}

int total(const int *values, int count) {
    int sum = 0;
    for (int i = 0; i < count; i++) sum += values[i];
    return sum;
}
```

文件和目标文件中还包含`grade_label`演示也会提升它. 本课程测试是上面的三个函数.

目标文件使用`clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c ledger.c`构建──旁边还存放用于槽位章节的`-O0`目标文件.`code/fixtures/README.md`列出了两个构建命令,每个目标文件的SHA-256,以及生成Ghidra测试样本的实际命令. 在固定版本的工具链上,构建结果可逐字节复现.

解码器的参考判断是`llvm-objdump -d -r`△已提交的文本已对两个目标文件产生.`ledger-x86_64-O1.objdump.txt`和 `ledger-x86_64-O0.objdump.txt`一个测试会解析这些文件,并逐步比较指令的地址,字节和AT&T文本.`-O1`关于"全56条指令"以及`-O0`任何指令都安装在固定路径下.`llvm-objdump`现在,第二次测试还会在现场运行,再进行一次比较.

参考工具打印的`percent_change`下面:

```text
0000000000000000 <percent_change>:
       0: 85 ff                        	testl	%edi, %edi
       2: 74 09                        	je	0xd <percent_change+0xd>
       4: 29 fe                        	subl	%edi, %esi
       6: 6b c6 64                     	imull	$0x64, %esi, %eax
       9: 99                           	cltd
       a: f7 ff                        	idivl	%edi
       c: c3                           	retq
       d: 31 c0                        	xorl	%eax, %eax
       f: c3                           	retq
```

## 阶段1:从字节到命令

第33课 构建了解码器.本课保留了一个小副本,让代码能够独立运行.`ledger.c`在`-O0`和 `-O1`下生成的操作码.遇到其他操作码时,它会抛出.`DecodeError`附带地址和操作码字节.

解码器遵循Intel SDM第2卷第2.1节规定的字节顺序:首先是前,然后是操作码、ModR/M、SIB、位移量,最后是立即数量──第2.2.1节加入REX 前,它是`0x40`到了`0x4F`之间一个字节,必须紧邻操作码之前――REX.W 选择 64 位操作数,REX.R 扩展 `reg`字段,REX.X 扩展 SIB 索引,REX.B 扩展 `r/m`或SIB基址──第 2.1.3节定义了ModR/M的三个字段`mod`,我知道.`reg`,我知道.`r/m`及SIB的三个段`scale`,我知道.`index`,我知道.`base`在64位模式下,`mod = 00`与`r/m = 101`组合表示相对于下一条指令的32位位移量 (第2.2.1.6节)

| 操作码字节 | 形式 | 测试样例中的示例 |
|---|---|---|
| `01 29 31 39 85 89` | `op Ev, Gv` | `29 fe` `subl %edi, %esi` |
| `03 2b 3b 8b 8d` | `op Gv, Ev` | `03 04 97` `addl (%rdi,%rdx,4), %eax` |
| 带 REX.W 的 `63` | `movsxd Gv, Ev` | `48 63 c7` `movslq %edi, %rax` |
| `69` 和 `6b` | `imul Gv, Ev, imm` | `48 69 c0 67 66 66 66` |
| `83 /0 /5 /7` | `add sub cmp Ev, imm8` | `83 c1 fa` `addl $-0x6, %ecx` |
| `c1 /5 /7` | `shr sar Ev, imm8` | `48 c1 f9 22` `sarq $0x22, %rcx` |
| `f7 /7` | `idiv Ev` | `f7 ff` `idivl %edi` |
| `ff /0 /4` | `inc Ev`, `jmp Ev` | `48 ff c2` `incq %rdx` |
| `70` 到 `7f`、`eb`、`e8` | `jcc rel8`、`jmp rel8`、`call rel32` | `74 09` `je 0xd` |
| `99`, `c3`, `90`, `0f 1f` | `cltd`, `retq`, `nop` | `66 0f 1f 44 00 00` `nopw (%rax,%rax)` |

`grade+0x23`处的`leaq (%rip), %rcx`长七字节,位移量为零.`0x36`处携带一个重定位项`R_X86_64_PC32.rodata+0x10`升级器会在阶段3 解析它.

## 阶段2:基本块与控制节点

基本块是一个语句序列,顶部只有一个入口,底部只有一个出口――这一定来自Allen (Allen) 1970),每篇反编译器论文都会沿用――`build_blocks()`收集块首地址:函数入口、函数内每一个跳转目标,以及每一个跳转或返回命令后的地址──每块后续由其最后一个命令决定──条件跳转有两个后续,`jmp`有一个.`ret`没有后继,以普通命令结尾的块则顺序落入下一个块首地址。

`-O1`下一个`total`有五个基本部分:

| 基本块 | 指令 | 后继 |
|---|---|---|
| `0x40` | `testl %esi, %esi`，然后是 `jle 0x5c` | `0x5c`、`0x44` |
| `0x44` | `movl %esi, %ecx`, `xorl %edx, %edx`, `xorl %eax, %eax`, `nopw` | `0x50` |
| `0x50` | `addl (%rdi,%rdx,4), %eax`, `incq %rdx`, `cmpq %rdx, %rcx`, `jne 0x50` | `0x50`, `0x5b` |
| `0x5b` | `retq` | 出口 |
| `0x5c` | `xorl %eax, %eax`，然后是 `retq` | 出口 |

`immediate_dominators()`实现了库珀·哈维和肯尼迪的代算法,2001年. 根据逆后序遍历基本块,对已处理的前驱的控制节点进行交换,直到不再变化.`total`得到了它`0x44`支配`0x50`得到了`0x50`通过回边控制自己,阶段8正是这个发现循环.

同一个函数还会再运行两次.`dominance_frontiers()`使用它构建SSA.`post_dominators()`则在添加虚拟出口节点的反向图上运行它,寻找汇合点.

## 阶段3:提升为小型 IR

包含六种语句:`Assign`,我知道.`Store`,我知道.`Branch`,我知道.`Jump`,我知道.`IndirectJump`和 `Return`△表达式包括常量、变量、带位宽的二元运算、转换`sext`,我知道.`zext`,我知道.`trunc`其他五种形式只存在于稍后简化和消除:`Flags`,我知道.`Cond`,我知道.`Concat`,我知道.`SignFill`和 `Symbolic`,我知道.

寄存器被表示为其64位寄存器族命名的变量──写入`%eax`是对`rax`一次位宽为32个`Assign`读取`%eax`则是以32位宽读取`rax`在64位模式下,32位写入会零扩展到整个寄存器,因此随后对相同值进行64位读取是一次.`zext`升级器不知道到达该读取位置是什么定义,所以先记录读取位宽,让SSA在阶段5插入转换.

| 指令 | IR 语句 |
|---|---|
| `subl %edi, %esi` | `flags = cmp(esi, edi)`，然后是 `esi = esi - edi` |
| `testl %edi, %edi` | `flags = test(edi, edi)` |
| `je 0xd` | `if je(flags) goto 0xd else goto 0x4` |
| `xorl %eax, %eax` | `eax = 0` |
| `cltd` | `edx = signfill(eax)` |
| `idivl %edi` | `dividend = edx:eax`, `eax = dividend / edi`, `edx = dividend % edi` |
| `movslq %edi, %rax` | `rax = sext64(edi)` |
| `sarq $0x22, %rcx` | `rcx = rcx >>s 34` |
| `shrq $0x3f, %rax` | `rax = rax >>u 63` |
| `addl (%rdi,%rdx,4), %eax` | `flags = add(eax, load32(rdi + rdx * 4))`，然后是 `eax = eax + load32(rdi + rdx * 4)` |
| `leaq (%rip), %rcx` 及其重定位项 | `rcx = &.rodata+0x14` |
| `pushq %rbp`、`movq %rsp, %rbp`、`subq $0x10, %rsp`、`popq %rbp` | 不生成语句，仅用于栈帧管理 |
| `retq` | `return rax` |

### 将标志表示为变量

每条设定条件码的命令都会以名为`flags`变量,每条条件都会变化.`cmp a, b`写入`cmp(a, b)`没有任何`test a, b`写入`test(a, b)`没有任何`sub`则作为副作用写入同样`cmp`形态`jcc`变为`Branch(Cond(cc, flags), target, fallthrough)`△当条件码与标志在阶段6相遇时,条件码决定比较运算符:

| 条件码 | 在 `cmp(a, b)` 之后 | 在 `test(a, a)` 之后 |
|---|---|---|
| `je` | `a == b` | `a == 0` |
| `jne` | `a != b` | `a != 0` |
| `jl`、`jge`、`jle`、`jg` | 有符号 `<`、`>=`、`<=`、`>` | 与 0 进行有符号比较 |
| `jb`、`jae`、`jbe`、`ja` | 无符号 `<`、`>=`、`<=`、`>` | 与 0 进行无符号比较 |

`xorl %eax, %eax`直接提升为`eax = 0` 设置标志写成`add`风格的标志,测试样例中没有跳转读取这些标志──`xor`这种模式在`grade`虽然它很重要,但Ghidra没有保留它.

### 及其他

`cltd`用`%eax`的符号位填满`%edx`,我知道.`idivl %edi`将 64 位寄存器对 `%edx:%eax`除了`%edi`商写入`%eax`余数写入`%edx`提升器首先将此寄存器对写入名为`dividend`暂时变量──这样,余数语句读取是旧的.`%eax`在SSA中,高半部呈现为低半部.`signfill`化简器将这个寄存器对化简为低半,除法也变成32位的`/`,我知道.

### - 下面的槽位

在`-O0`下,Clang 将每个局部变量保持在内.`percent_change`让我`%edi`存到`-0x8(%rbp)`让你`%esi`存到`-0xc(%rbp)`接下来,每次使用都回来.升降器会寻找下一个.`movq %rsp, %rbp`的`pushq %rbp`在这个函数序言之后,基址为`%rbp`没有索引,带有移动数量的内存操作数,将成为名字.`local_<hex>`变量.`-0x8(%rbp)`应对`local_8`没有任何`-0xc(%rbp)`应对`local_c`,我知道.

命令本身不产生IR,对`%rsp`的`subq`和 `addq`也不生成. 其他内存操作数仍然保持为 `Load`或`Store`,我知道.

### 重定位

`grade`中中 `leaq (%rip), %rcx`在文件中的位移量为零.偏移.`0x36`处的重定位项是`R_X86_64_PC32.rodata+0x10`链接器会将 `S + A - P`写入该字段――`S`是 `.rodata`的地址,`A`是加数`0x10`没有任何`P`是字段地址──随后指令计算`next_ip + disp = (P + 4) + S + A - P = S + A + 4`,我知道.

升级器在没有链接器的情况下应用相同的运算.目标偏移等于加数加字段到命令末尾的距离,即`0x10 + 4 = 0x14`〔IR〕写为`rcx = &.rodata+0x14`现在,这个位置的表格存放了五个.`int`值`1, 2, 3, 4, 4`,我知道.

## 阶段4:从调用约定恢复参数

系统 V AMD64 psABI 第 3.2.3 节规定,INTEGER 类参数依次通过 `%rdi`,我知道.`%rsi`,我知道.`%rdx`,我知道.`%rcx`,我知道.`%r8`,我知道.`%r9`传递――结果先通过`%rax`通过了`%rdx`返回. 节 3.2.1 说明,`%rbp`,我知道.`%rbx`和 `%r12`到了`%r15`属于调用方,必须保留;其余寄存器属于调用方.

`collect_params()`应用一条规则:在函数内先读后写的参数寄存器就是形参.其中的序号最高寄存器决定参数数量,因此只读`%rsi`、从不读`%rdi`函数仍然有两个参数.`percent_change`读取`%edi`和 `%esi`现在,我们有`param_1`和 `param_2`,我知道.`grade`只有读取`%edi`,我知道.`total`将`%rdi`作为 64 位基址读取,将 `%esi`作为32位计数读取:

现在就能解释Ghidra 的`param_3`了.`idivl`写入`%rdx`现在,我们可以通过.`%rax:%rdx`返回 128 位 INTEGER──在目标文件中,没有调用方可告诉我们返回值是否有多宽──Ghidra 将保留两个寄存器为返回值──

在返回零的路上,`xorl %eax, %eax`只是写入`%eax`德拉 在该路径上将`%rdx`作为函数输入读取,这个输入就变成了`param_3`△指令没有错误. 函数签名是猜测指令没有明确规定的部分.

## 阶段 5:SSA,每个定义一个名字

提升之后,`grade`写入`rax`写入`rcx`三次――Cytron、Ferrante、Rosen、Wegman 和 Zadeck,1991) 定义静态单个赋值形式:每个变量恰好被赋值一次,汇合点处的phi 函数从到达此处的定义中进行选择.`insert_phis()`和 `rename()`遵循这两节的方法.

`total`美国国家安全局的列表显示了构建结果:

```text
block 0x44 -> 0x50
  ecx_1 = esi_0
  edx_1 = 0
  eax_1 = 0
block 0x50 -> 0x50, 0x5b
  eax_2 = phi(0x44: eax_1, 0x50: eax_3)
  rdx_2 = phi(0x44: edx_1, 0x50: rdx_3)
  flags_2 = phi(0x44: flags_1, 0x50: flags_5)
  flags_3 = add(eax_2, load32(rdi_0 + rdx_2 * 4))
  eax_3 = eax_2 + load32(rdi_0 + rdx_2 * 4)
  flags_4 = inc(rdx_2, 1)
  rdx_3 = rdx_2 + 1
  flags_5 = cmp(zext64(ecx_1), rdx_3)
  if jne(flags_5) goto 0x50 else goto 0x5b
```

寄存器的版本0是函数入口处的值.`esi_0`和 `rdi_0`是参数.`0x50`两个前驱:初始化块和自身,所以每个循环中都有定义的变量都会在这里得到一个phi.`flags_2`这个字符是死代码. 最小的SSA 放置它,因为两个前驱都定义了.`flags`阶段 6 也会删除它,因为没有任何地方读取它.

重命名步骤还会修改位宽.`edx_1 = 0`是 32 位定义,`rdx_3 = rdx_2 + 1`是 64 位定义,因此`rdx_2`采用较大的位宽――`cmpq %rdx, %rcx`对于`%rcx`的读取是64位,而其定义是`ecx_1 = esi_0`是32位,因此该使用变为`zext64(ecx_1)`,最终伪代码中的每一次转换都来自于这个条例.

现在,我们已经退出了SSA.`coalesce_webs()`将每个phi与其参数合并成一个称为web的变量,并为这个web赋予一个名称. 这适用于编译器生成这些函数的结构.但遇到并行复制时可能失效,例如同一汇合点的两个phi 交换值.本课程不处理这种情况.Cytron第7节描述了通过色彩实现通用SSA 退出方法.

## 阶段 6:化简"",替换与死代码消除

`optimize()`反复执行三轮处理,直到不再变化. 化简器按照下列规则自底上改写表达式:

| 改写前 | 改写后 |
|---|---|
| `Cond(je, cmp(a, b))` | `a == b`，其余九种条件码同理 |
| `Cond(jle, test(a, a))` | `a <= 0` |
| `x + (-6)` | `x - 6` |
| `trunc32(zext64(x))`，其中 `x` 为 32 位 | `x` |
| 对 64 位操作数执行 `trunc32(a + b)` | `trunc32(a) + trunc32(b)` |
| `(signfill(x): x) / d` | 位宽为 32 的 `x / d` |
| `load32(base + idx * 4)` | `base[idx]` |
| `trunc32(p >>s 34) + trunc32(p >>u 63)`，其中 `p = sext64(x) * 0x66666667` | `x / 10` |

前向替换将一个定义转移到其唯一使用点. 这条规则有三个条件:使用点位于同一基本块;使用点是一个语句而不是phi;如果定义包含加载,那么定义与使用之间不能有存储或调用.常量或节地址可以转换到 phi 以外的任意位置,因为phi的参数必须保持为变量,才能构建网页.

已被删除目标没有使用,并且表达式没有调用赋值或phi.`percent_change`中,余数 `edx_2 = dividend_1 % edi_0`是死代码,所以先被删除.`edx_1 = signfill(eax_1)`只有一个使用点,被换成.`dividend_1 = edx_1:eax_1`,我知道.

寄存器对规则后将`signfill(eax_1):eax_1`化简为`eax_1`除法变成`eax_1 / edi_0`现在`eax_1 = esi_1 * 100`只有一个使用点,`esi_1 = esi_0 - edi_0`也只有一个使用点,两者都被移入返回语句.`flags`定义被换成分支条件后消失.

```c
return (param_2 - param_1) * 100 / param_1;
```

### 乘以0x66666667

`grade`将分数除以10,但没有产生声.`idiv`,它先生成`imulq $0x66666667, %rax, %rax`另一个副本执行`sarq $0x22, %rcx`然后执行`shrq $0x3f, %rax`格兰兰和蒙哥马利的论文 通过乘法进行不变整数的分数 (PLDI 1994) 描述了这种方法.`m`和移位量`s`让每个人都在`x`城市满足`(x * m) >> s`等于`x / d`,我知道.

这里`m = 0x66666667 = 1717986919`没有任何`s = 34`运算可以核对:`2^34 / 10 = 1717986918.4`为了`1717986919`△误差是`m * 10 - 2^34 = 6`应让恒等关系对每32位`x`错误乘以`2^31`必须保持在`2^34`因此,差距最大为8――6不超过八,所以对每个非负面`int`没有任何`(x * m) >> 34`城市等于`floor(x / 10)`,我知道.

对于负数`x`对于 C 的除法而言,`shrq $0x3f`提取乘积的符号位,恰好在`x`负时等于1――加上它即可修改进方向――

`magic_divisor(m, s)`检验对候选人值.`d`计算为`2^s`除了`m`整数商,并尝试`d`和 `d + 1`只有当`m`等于`2^s / d`只有接受一个误差的结果,`d` 乘数配合`s = 33`得到了`d = 5`这也是正确的,因为`0x66666667`同样是`2^33 / 5`升取整体结果. 一个测试会在 2,406 个值上将这个恒等关系与 `c_div(x, 10)`比较,其中包括`int`范围的两个端点.

启用识别时,`grade`显示为`ecx_1 = param_1 / 10 - 6;`◎关闭识别时,演示会打印原始形式:

```c
rax_1 = (long)param_1 * 0x66666667;
ecx_1 = (int)(rax_1 >> 34) + (int)((unsigned long)rax_1 >> 63) - 6;
```

两种形式都能编译,也计算出相同的值. 保留这个开关. 当你读到未研究的编译器生成的代码时,原始形式才是真实的表达.

## 阶段7:从使用方式推断类型

机器码只有位宽,没有类型.`infer_types()`将三类证据转换为C类型――定义位宽为32的网址是`int`网页是`long`如果某个网站是访问元素`base[idx]`基址,且元素大小为4字节,它就是`int *`△指针类型会沿复制和传播,因此`-O0`下一个`local_8 = param_1`让两者都成为`int *`△返回类型取决于`return`语句中值的位宽──

`total`结果是`int total(int *param_1, int param_2)`德拉写的是`int total(long param_1,uint param_2)`升器将带比例因子的加载作为指标证据; 升器则保留寄存器位宽,将访问写成`*(int *)(param_1 + uVar2 * 4)`两者都看不到`const`它们也无法分辨.`int *`和 `unsigned *`,我知道.

李、Avgerinos 和 Brumley(TIE,NDSS 2011) 将类型恢复表述为格上的约束求解──结果是一个上界和一个下界,而不是单一猜测──诺南、洛基诺夫 和科克(Retypd,PLDI 2016) 加入多态和递归──他们报告,利用编译器留下的惯用模式,对`const`标签回复率达到98%. 本课程采用了这条研究路线中最低价的两条规则,并指出它们看不到什么.

无符号运算保留在表达式中,不体现在变量类型里──`cmpl $0x4, %ecx`后者`ja`打印为`(unsigned int)ecx_1 > 4`没有任何`shrq`打印为`(unsigned long)rax_1 >> 63`△变量仍然保持符号类型,这样读者既能看到寄存器值,也能看到命令在哪个位置将其视为无符号值.

## 阶段8:从图中恢复结构

科文特斯 (Cifuentes) 1994 第6章 将图中的区域与高级语言的结构形态匹配――先处理循环(6.6.1),再处理双路条件(6.6.2),最后处理多路条件(6.6.3)。Yakdan、Eschweiler、Gerhards-Padilla 和 Smith(NDSS 2015) 走了另一条路――他们推每个节点执行的条件,再从这些条件构建结构,不依赖固定形态――其动机来自一个测量:`goto`它们的结构方法在1,530个核心函数中没有产生任何这样的语句.

`structure()`首先,它需要第二阶段提供两个事实.`Branch`结尾的块,其直接后控制节点就是条件分支的汇合点. 回边指向控制其源节点的块边.自然循环则是无需经过循环的,才能达到回边源节点的这些块的集合.

对于汇合点为`j`的`Branch`其他:

- 如果`j`是跳转目标,生成`if (!cond) { fallthrough region }`然后从`j`继续.
- 如果`j`是顺序落入后后后,生成`if (cond) { target region }`然后从`j`继续.
- 如果`j`是函数出口,两个分支都会回来.`if (cond) {... }`另一个分支放在后面,不使用`else`这就是.`percent_change`和 `total`中的提前回归
- 否则生成`if (cond) { target } else { fallthrough }`然后从`j`继续.`-O0`下一个`percent_change`这就是情况:两个分支都存储`local_4`并且函数尾声处汇合──

对于循环:

- 如果循环头`Branch`结尾,且有一个后继位于循环外,生成`while (cond) { body }`,我知道.`-O0`下一个`total`是这种形态:循环头比较`local_14`和 `local_c`通过`jge`离开
- 如果循环头也是带回边块,或者出口位于循环锁块,则产生`do { body } while (cond);`,我知道.`-O1`下一个`total`是这种形态:块 `0x50`执行加法、递增、比较,然后跳回自己.

`IndirectJump`会结束一个块,并且没有后继.`-O0`下一个`grade`使用真正的跳转表:`jmpq *%rax`通过`.rodata+0x0`处的五个相对偏移量跳转,第33课会解析这些目标.`0x76`,我知道.`0x7f`,我知道.`0x88`和 `0x91`处的四块只能通过间接跳转到达,因此没有升级.`switch`,我知道.

### - 换机做了什么?

在`-O1`下,clang 没有为`grade`保持跳转表――它计算`score / 10 - 6`结果将作为无符号数与4比较,然后从`.rodata+0x14`处包含五个`int`表中加载回值.一次无符号比较就覆盖了.`score / 10 < 6`和 `score / 10 > 10`两种情况――负差值作为无符号数量很大,因此也无法通过检查――

表中存放`1, 2, 3, 4, 4`分别对应商 6 到 10 条`return`的`switch`变成了一个`if`和一次数组读取──提升器原样生成这种结构,并按表的节内偏移将其命名为`lookup_14`,我知道.

通过启发式规则确定.`table_values()`从表起点读取,直到任意`.text`重定位项引用的下一个 `.rodata`在此目标文件中,下一个被引用的偏移是`0x28`其他`grade_label`表,因此`lookup_14`有一个`(0x28 - 0x14) / 4 = 5`项──与4的无符号比较也吻合──Ghidra 同样不知道表长──它写成`*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)`查找五个值的工作留给读者.

## 与 吉德拉 并排对照

演示会打印每对结果.`code/fixtures/ghidra/*.json`据了解,在2026年10-14年,`npx -y rea-agents@6.5.0 decompile ledger-x86_64-O1.o <function> --provider ghidra --format json`,每条记录都带有`confidence: observed`和 `authority: shipped-artifact`文本是观察结果,但文本内部的断言是推导的,而记录没有指出哪些是推导结果.

### 百分比_变化

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
int percent_change(int param_1, int param_2)   | undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)
{                                              | {
  if (param_1 == 0) {                          |   long lVar1;
    return 0;                                  |   undefined1 auVar2 [16];
  }                                            |   undefined1 auVar3 [16];
  return (param_2 - param_1) * 100 / param_1;  |   if (param_1 != 0) {
}                                              |     lVar1 = (long)((param_2 - param_1) * 100);
                                               |     auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
                                               |     auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
                                               |     return auVar3;
                                               |   }
                                               |   auVar2._8_8_ = 0;
                                               |   auVar2._0_8_ = param_3;
                                               |   return auVar2 << 0x40;
                                               | }
```

| 差异 | 指令或猜测 |
|---|---|
| 返回类型 `undefined1 [16]` 与 `int` | 猜测。`idivl` 写入 `%rax` 和 `%rdx`，且没有调用方确定返回位宽，因此两个寄存器都被保留。 |
| `param_3` | 由第一个猜测引出的猜测。返回零的路径上只有 `%eax` 被写入，所以 `%rdx` 被作为输入读取。 |
| `lVar1 / (long)param_1 & 0xffffffff` 与 `/ param_1` | 来自指令。`cltd` 加 `idivl` 对符号扩展后的 32 位值做 64 位除法，再截断到 32 位。两段文本都在描述这个过程。我们的版本用 `signfill` 规则化简了寄存器对。 |
| 保留 `lVar1 % (long)param_1` | 源于返回类型。在我们的分析中，`%rdx` 中的余数是死值；在 Ghidra 的分析中，它是活值。 |
| `if (param_1 != 0)`，后面才是零值情况 | 源于指令顺序。`je 0xd` 跳到返回零的位置。Ghidra 先放计算分支，我们先放较小分支。两者都正确。 |
| `return auVar2 << 0x40` | 猜测。反编译器用一个低半部装有 `param_3`、再移到高半部的 16 字节值，表达 `%rax = 0` 且 `%rdx` 未知的情况。 |

`code/fixtures/ghidra/ledger-x86_64-O1.ghidra-repaired.c`中修复版只修改了这个函数,测试将在81对输入上将它与源码进行比较.

### 级别

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
static const int lookup_14[5] = {1, 2, 3, 4, 4}; | uint grade(int param_1)
int grade(int param_1)                         | {
{                                              |   uint uVar1;
  int eax_1;                                   |   uint uVar2;
  int ecx_1;                                   |   
                                               |   uVar2 = param_1 / 10 - 6;
  ecx_1 = param_1 / 10 - 6;                    |   uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);
  eax_1 = 0;                                   |   if (uVar2 < 5) {
  if ((unsigned int)ecx_1 <= 4) {              |     uVar1 = *(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4);
    eax_1 = lookup_14[(unsigned long)(unsigned int)ecx_1]; |   }
  }                                            |   return uVar1;
  return eax_1;                                | }
}                                              |
```

| 差异 | 指令或猜测 |
|---|---|
| 两者都有 `param_1 / 10 - 6` | 来自指令。两者都识别出了 `0x66666667` 惯用模式。 |
| `uVar1 = -(param_1 >> 0x1f) ^ (uint)(... >> 0x3f)` 与 `eax_1 = 0` | 来自 `grade+0x1a` 处的 `xorl %eax, %eax`。寄存器为零。Ghidra 将 `xor` 表达为 `param_1` 的符号与乘积符号位的异或，这是同一个位的两种写法，却没有将两者消去。对每个 `int`，值都为 0，测试在 141 个分数上验证了这一点。相信文本的读者会误以为默认值依赖分数。 |
| `uVar2 < 5` 与 `(unsigned int)ecx_1 <= 4` | 来自 `cmpl $0x4, %ecx`，随后是 `ja`。条件相同。Ghidra 将 `uVar2` 定为 `uint`，我们则在使用处转换。 |
| `*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)` 与 `lookup_14[...]` | 来自指令加重定位。Ghidra 加载目标文件时，将 `.rodata` 放在 `0x001000a0`，所以 `0x001000b4` 就是 `.rodata + 0x14`。它应用了重定位并保留字节地址。我们为表命名，并读取了其中五个值。 |
| `uint` 返回值与 `int` | 两边都是猜测。指令只说明是 32 位。 |

### 总数

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
int total(int *param_1, int param_2)           | int total(long param_1,uint param_2)
{                                              | {
  int eax_1;                                   |   int iVar1;
  int ecx_1;                                   |   ulong uVar2;
  long rdx_1;                                  |   
                                               |   if (0 < (int)param_2) {
  if (param_2 <= 0) {                          |     uVar2 = 0;
    return 0;                                  |     iVar1 = 0;
  }                                            |     do {
  ecx_1 = param_2;                             |       iVar1 = iVar1 + *(int *)(param_1 + uVar2 * 4);
  rdx_1 = 0;                                   |       uVar2 = uVar2 + 1;
  eax_1 = 0;                                   |     } while (param_2 != uVar2);
  do {                                         |     return iVar1;
    eax_1 = eax_1 + param_1[rdx_1];            |   }
    rdx_1 = rdx_1 + 1;                         |   return 0;
  } while ((unsigned long)(unsigned int)ecx_1 != rdx_1); | }
  return eax_1;                                |
}                                              |
```

| 差异 | 指令或猜测 |
|---|---|
| `int *param_1` 与 `long param_1` | 我们根据 `addl (%rdi,%rdx,4), %eax` 作出的推断。Ghidra 保留了位宽。 |
| `uint param_2` 与 `(int)param_2`，对比 `int param_2` | Ghidra 选择无符号类型，因为 `cmpq %rdx, %rcx` 比较的是零扩展后的计数。我们保留 `int`，在比较处转换。 |
| 两者都有 `do { } while` | 来自块跳回自身的指令 `jne 0x50`。编译器旋转了循环。`-O0` 目标文件保留 `while`。 |
| 保留 `ecx_1 = param_2`，对比 `param_2 != uVar2` | 我们的替换规则仅限于同一基本块。复制 `movl %esi, %ecx` 位于初始化块，而比较位于循环内，所以变量保留。Ghidra 则传播了它。 |
| `(unsigned long)(unsigned int)ecx_1` | 来自指令。`movl %esi, %ecx` 执行零扩展，64 位比较读取整个寄存器。 |

行为测试会原样编译 `grade`和 `total`,我只加两行`typedef`根据`.rodata+0x14`处二十个字节给出的`DAT_001000b4`在输入网格上,两个函数都与源码一致.

## 研究对伪代码阅读的启示

通过基准自带的断言,大约五分之一的函数能够重新编译并通过基准自带的断言. 通过他们的6.7B模型修改,该比例升至52.74%的输出后,该比例升至52.74%的结果.

、拉夫和米辛斯基 (arXiv 2609.05370,2026年9月) 解释了这一差距.他们使用了300个GitHub库函数和287个基于CVE的函数. 最强的修改模型将Ghidra的构建成功率从75%提高到90%,但行为匹配率从74%降至62%.即使候选人通过基准中的所有测试,模糊测试输入仍然可能产生不同结果.

他们追踪原因很简单:凭空编制的字段,类型,被调用函数和保护条件,替换了反编译器留在文本中显而易见的未知项.

这就是升降机打印.`(unsigned long)(unsigned int)ecx_1`对于未解答的跳转,它打印说明而不是`switch`对于表,它使用`lookup_14`没有模型可以编制标签.`code/main.py`中阅读的推导过程──Ghidra 的 `undefined1 [16]`很难看,但诚实.`int percent_change(int, int)`虽然正确,但理由不对.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode
python3 code/main.py
```

演示会解码`-O1`目标文件的全部四个函数,并将每个条例与提交的函数进行处理.`llvm-objdump`文本比较.`percent_change`,我知道.`grade`和 `total`后印关闭除法识别后的 字符.`grade`,我知道.`-O0`版本的`percent_change`,我知道.`total`和 `grade_label`总和汇总:

```json
{
  "functions": ["grade", "grade_label", "percent_change", "total"],
  "instructions": 56,
  "blocks": {"percent_change": 3, "grade": 3, "total": 5, "grade_label": 4},
  "phis": {"percent_change": 0, "grade": 1, "total": 2, "grade_label": 1},
  "objdumpDifferences": 0
}
```

按以下顺序阅读 `code/main.py`其他:

1. `read_object()`读取 ELF64 可重定位目标文件的节头,符号表和`.rela`节
2. `decode_one()`和 `render_att()`解码一条命令,并按 `llvm-objdump`打印它的方式.
3. `build_blocks()`,我知道.`immediate_dominators()`和 `dominance_frontiers()`建筑图的相关事实――
4. `lift_insn()`将一条命令转换为IR语句,并解析重定位.
5. `insert_phis()`和 `rename()`构建SSA,并插入位宽转换――
6. `make_simplifier()`,我知道.`substitute_once()`和 `remove_dead_code()`在`optimize()`运行中
7. `collect_params()`,我知道.`coalesce_webs()`和 `infer_types()`为网名并推断类型──
8. `structure()`配合`post_dominators()`和 `natural_loops()`生成 C 函数体──
9. `lift_function()`串联各阶段,`lift_all()`则携带被调用函数签名,提升整个目标文件.

## 实际使用

要升级你自己的目标文件中的函数,使用 `clang -target x86_64-unknown-linux-gnu -c`构建它,然后调用`lift_all(read_object(path))`解码器抛出`DecodeError`时,从消息中读取操作码字节,在SDM操作码映射表中查找它,再在文件顶部表中增加一个.`lift_insn()`增加一条规则――结构化器生成`goto`时,使用 `IrPrinter`印图,判断缺少哪条形态规则──每次增加的内容都很小,现有测试会对照`llvm-objdump`或是检查它.

在安装后,对同一函数运行 rea,并将两段文本并排放置――在相信任何一段文本之前,先填写差异表――有指令依据的差异是表达方式的选择;没有指令依据的差异是猜测,而且猜测可能出现任意一方――

## 交互实验

### 实验A:让一个函数经过五个阶段

在`code`现在打开Python:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode/code
python3 -q
```

运行:

```python
from main import *
obj = read_object(FIXTURES / "ledger-x86_64-O1.o")
lifted = lift_function(obj, "percent_change")
for insn in lifted.decoded: print(f"0x{insn.address:x}: {insn.raw.hex(' ')}  {insn.att()}")
print(lifted.ir_text)
print(lifted.ssa_text)
print(lifted.pseudocode)
```

随着`%esi`如何从`subl %edi, %esi`变成`esi_1 = esi_0 - edi_0`变化`(param_2 - param_1)`〔字节〕`fe`是 `subl`其他国家`mod = 11`,我知道.`reg = edi`,我知道.`r/m = esi`,我知道.

### 实验B:除法惯用模式

```python
print(lift_function(obj, "grade", recognize_division=False).pseudocode)
print(magic_divisor(0x66666667, 34), magic_divisor(0x66666667, 33), magic_divisor(0x66666667, 31))
```

第一个行印原始乘法和移位.`10 5 None`△请推为什么同一乘数在移位数量减少时表示除以 5,以及为什么移位数31不满足差异界──

### 实验C:新目标文件让解码器停下来

以 `-O2`构建测试样例并提升它:

```bash
clang -target x86_64-unknown-linux-gnu -O2 -fno-asynchronous-unwind-tables -c fixtures/ledger.c -o "$TMPDIR/ledger-O2.o"
python3 -c 'from main import *; from pathlib import Path; import os; lift_all(read_object(Path(os.environ["TMPDIR"]) / "ledger-O2.o"))'
```

解码器在`0x56`处停止,报告`opcode 81 is outside the fixture subset`操作码`81`是带32位立即数的第1组形式.`andl $0x7ffffff8, %edx`着在`total`在向量化循环中使用它.`decode_one()`的`0x83`旁边,重新运行,并记录下下来哪个操作码让你停下来.`llvm-objdump`检查.

### 实验 D:Ghidra 在中级默认值

```python
print(ghidra_pseudocode("grade"))
for score in (-25, 0, 59, 60, 100, 115):
    sign = -(score >> 31)
    product_sign = ((score * 0x66666667) & ((1 << 64) - 1)) >> 63
    print(score, sign ^ product_sign)
```

每一行都打印了0―― 吉德拉的`uVar1`确实很难阅读,但命令`xorl %eax, %eax`两字符就表达了同样的意思.

## 实践实验

为`-O0`下一个`grade`添加`switch`恢复

要求:

- 读取`ledger-x86_64-O0.o`的`.rela.rodata`中五重定位项,每个项都是`R_X86_64_PC32.text+offset`根据`.rodata+0x0`处的表计算五个案例 目标――
- 为 IR 添加`Switch`终结指令,包含索引表达,目标列表以及从表达上载之前的指标`ja`得到了认可分支.
- 为了切换块的每个目标设置一个后续,让控制节点、后控制节点和SSA 仍然正常工作.
- 生成 `switch (local_10) { case 0:... }`为了实现目标,`case`,并将共用函数尾声放在汇合点之后.
- 对于无法确定表边界间接跳转,保留说明.
- 用语文编译结果,并测试中的分数网格上与源码比较.

成功标准是:`-O0`下一个`grade`与`-O1`下一个`grade`在整个网格上输出相同,恢复结果包含一个`switch`没有`goto`,我知道.

## 交付产物

本课产出发 `outputs/skill-lifting-to-pseudocode.md`△使用它升级一个函数,为每行提供推,并填写与反编译器文本的差异表.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

套件共25个测试――验证证证:

- 对于两个目标文件的每条指令,`llvm-objdump`文本一致;若安装了`llvm-objdump`现场运营的结果也一致
- 雷克斯,莫德尔/M,西布以及`leaq (%rip), %rcx`的位移字段偏移均按照 SDM 的描述解码
- 遇到子集之外的操作码时抛出`DecodeError`而不是猜测.
- 读取器列出四个函数和三个`.text`重定位项
- `total`有五块,`0x44`支配`0x50`没有任何`0x50`是自行循环的循环头
- `%rdi`和 `%rsi`变为`param_1`和 `param_2`且`total`中中 `param_1`为`int *`
- `test`和 `cmp`配合`je`,我知道.`jle`,我知道.`ja`和 `jge`变为`==`,我知道.`<=`没有符号`>`和 `<`
- 美国国家安全局`total`循环头放置两个活跃的phi 函数,在`percent_change`中不放置任何东西
- `percent_change`,我知道.`grade`和 `total`伪代码与预期文本相同
- 启用识别时,`grade`显示`param_1 / 10 - 6`关闭识别时,显示原始乘法
- `0x66666667`配合移位数 34 表示除以 10,配合移位数 33 表示除以 5,且恒等关系在输入网格上建立
- `-O0`下的槽位变成了`local_4`,我知道.`local_8`,我知道.`local_c`没有指针
- 通过重定位,在`.rodata+0x14`处的表中读取到`1, 2, 3, 4, 4`
- `-O0`下一个`grade`间接跳转连接四个未升级的块一起被报告
- 基德拉测试样例包含16 字节返回值,`param_3`没有简化`xor`和 `long param_1`
- 已成成的六个单元可用`clang -std=c11 -Wall -Werror`为`x86_64-unknown-linux-gnu`编译
- 提升后函数、修复后字母 文本和源码,在输入网格上打印相同的232行

## 生产环境中的失效模式

| 失效情况 | 浅层阅读的结论 | 推导过程必须展示的内容 |
|---|---|---|
| 反编译器扩大返回值位宽 | “返回 16 字节结构体” | `idivl` 写入 `%rdx`，且没有调用方确定其位宽 |
| 反编译器增加参数 | “接收三个参数” | 只是因为猜测了返回位宽，才在一条路径上读取该寄存器 |
| 未识别惯用模式 | “乘以魔数常量” | 乘数是 `2^s / d` 向上取整的结果，且满足误差界 |
| 识别了惯用模式，却丢失 `xor` | “默认值依赖输入” | `xorl %eax, %eax` 写入零，同一位的两种表达相互抵消 |
| 指针被定为整数类型 | “接收一个 long” | 从该寄存器进行带比例因子的 4 字节加载，是指针的证据 |
| 表长未知 | “读出了表的范围” | 下一个被引用的偏移或节末尾限定表边界，且范围检查与此吻合 |
| 误读循环结构 | “while 循环” | 循环头没有出口，闩锁块向后跳转，因此是 `do while` |
| 猜测间接跳转 | “有五个 case 的 switch” | 目标来自 `.rela.rodata`，否则应报告跳转未解析 |
| 跨存储进行替换 | “一个表达式” | 将已加载的值移过存储或调用，会改变含义 |
| 修订模型编辑文本 | “能够编译，看起来没错” | 构建成功率上升，行为匹配率下降，编造的保护条件替换了显式未知项 |
| 解码器猜测未知操作码 | “反汇编看起来没问题” | 抛出含地址与字节的 `DecodeError`，然后增加一个经 `llvm-objdump` 验证的表项 |

## 操作原则

将假代码视为你还没有看到的推导过程――用你能读懂的升级器,从命令重现它――将两段文本并排,为每行差异写出后面的命令或猜测――编译两者;如果有源代码,就运行两者并与源代码比较――一行代码只要没有指令依据,无论读起来多么整洁,都仍然是猜测――

## 延伸阅读

- [Intel SDM Volume 2, chapter 2, Instruction Format](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [System V AMD64 psABI, section 3.2, Function Calling Sequence](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Cytron et al., Efficiently Computing Static Single Assignment Form and the Control Dependence Graph, TOPLAS 1991](https://doi.org/10.1145/115372.115320)
- [Cooper, Harvey, Kennedy, A Simple, Fast Dominance Algorithm, 2001](https://www.cs.tufts.edu/~nr/cs257/archive/keith-cooper/dom14.pdf)
- [Cifuentes, Reverse Compilation Techniques, PhD thesis, QUT 1994](https://eprints.qut.edu.au/36820/)
- [Yakdan et al., No More Gotos, NDSS 2015](https://www.ndss-symposium.org/ndss2015/ndss-2015-programme/no-more-gotos-decompilation-using-pattern-independent-control-flow-structuring-and-semantics/)
- [Granlund, Montgomery, Division by Invariant Integers using Multiplication, PLDI 1994](https://doi.org/10.1145/178243.178249)
- [Lee, Avgerinos, Brumley, TIE, NDSS 2011](https://www.ndss-symposium.org/ndss2011/tie-principled-reverse-engineering-of-types-in-binary-programs/)
- [Noonan, Loginov, Cok, Polymorphic Type Inference for Machine Code, PLDI 2016](https://arxiv.org/abs/1603.05495)
- [LLM4Decompile, EMNLP 2024](https://arxiv.org/abs/2403.05286)
- [DecompileBench, Findings of ACL 2025](https://aclanthology.org/2025.findings-acl.1194/)
- [Liu, Raff, Micinski, When LLM Decompilers Recompile More and Preserve Less, 2026](https://arxiv.org/abs/2609.05370)
- [rea 6.5.0 Ghidra provider notes](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/ghidra-provider.md)
- 本课讨论的 rea 6.5.0 源码位于标签 `3b79af2`其他:`src/domain/functionComparisonDimensions.ts`,我知道.`website/evidence/dx-ball-sound-pan.md`,我知道.
