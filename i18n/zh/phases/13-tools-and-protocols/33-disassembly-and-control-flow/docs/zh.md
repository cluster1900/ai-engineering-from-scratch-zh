# 反汇编与控制流:从字节到可验证的图

> 反汇编单是断言哪些字节是指令;本课将构建解码器和图,检查这一断言.

**Type:** Build
**Languages:** Python, C, x86-64 assembly
**Prerequisites:** Phase 13 · 32（从零构建 ELF）
**Time:** ~150 分钟

## 学习目标

- 根据英特尔SDM第2卷第2章的规则,解码账本测试样例中的x86-64指令子集──
- 对于每种建物指令,`llvm-objdump -d`对于检验证解码器
- 对于相同字节运行线性扫描和递归下降,并解释各自的错误位置.
- 将指令分为基本块,构建带类型边的控制流图.
- 用库珀·哈维和肯尼迪的代代算法计算直接控制节点,并通过回边寻找循环.
- 从指向跳转表的重定位条目恢复间接跳转的目标──

## 问题

你用了`-O0`编译了`ledger.c`然后问一个代理:`grade`如何做?代理调用反汇编器、读取清单,回答说这个函数以目标未知的`jmpq *%rax`结束了. 随后它写出了一个假代码.`return 0`,我知道.

你用了`llvm-objdump -d`打开同一个目标文件,看跳转后有四块,分别存储4、3、2、1──它们一直在清单里──清单没有说明执行如何达到这些块,因此工具将它们作为死代码──

清单只回答一个问题:哪些字节构成哪条指令――它不会说明哪些指令会执行――以什么顺序执行――从哪里开始执行――为了回答这些问题,还需要三种结构:控制流能达到的字节、基本块,以及块之间的边缘――

rea 6.5.0 没有自己的反汇编器――如果要深入分析,其 README 要求你自行提供Ghidra、Hopper或 IDA──离线检查时,rea 也能调用你安装的GNUobjdump或Rizin──它的调用图会停止步向未解析的目标:调用者/被调用者只包含已解析的函数......没有目标的计算类型控制流仍然未知──

```figure
re-33-sweep-vs-descent
```

## 指令格式的每个节目都有应对规则

印特尔SDM 第2卷图 2-1 给出每条指令的字节顺序.首先是可选前,然后是三个操作码字节,再后面是可选的ModRM字节和可选的SIB字节.然后是0、1、2或4字节的位移,然后是0、1、2或4字节的立即数量.整条指令最多15字节.SDM 2.3.11) .AMD APM 第3卷第1章第1章第1.1 至篇 1.7节更小的幅描述相同的格式,适合交叉对应.

因此,解码器是一个连串的小决策,每个决策背后都能在手册中找到对应说明.

### 分为四组

发展发展目标 2.1.1 列出了传统前──第 1 组包含`F0`锁 和重复前 `F2`,我知道.`F3`◎第2组包含六种段覆盖`2E`是 `%cs`其他国家和地区的经济发展`66`操作数大小覆盖.`67`现在,我在这个地方.

手册说每组可以使用一个前,但编译器会产生更多.`ledger-x86_64-O0.o`中偏移 `0xf2`没有什么东西可以填满.`66 66 66 66 66 2e 0f 1f 84 00 00 00 00 00`连续出现了五个`66`,我知道.`llvm-objdump`打印的`nopw %cs:(%rax,%rax)`解码器收集所有前字节,稍后再判断真正发挥作用的.

`66`对于SSE指令,它是选择操作码的强制前,因此`66 0f ef c0`是 `pxor %xmm0, %xmm0`而不是什么16位操作.`F3 0f 6f`是 `movdqu`△解码器首先查找强制前和第二个操作码字节组合.`66`才表示16位操作数──

### 增加四个位,而且必须紧紧操作码

SDM 2.2.1 将REX 定义为`40`到了`4F`之间一个字节,格式为 `0100WRXB`,我知道.`W`选择 64 位操作数――`R`扩展ModRM的规则`X`扩展SIB的指数 字段。`B`扩展ModRM的 r/m 字段、SIB的基础 字段或操作码字节中的寄存器(表 2-4);;REX 必须紧接在操作码或转义字节之前;如果REX 后面跟随传统前,它就会被忽略──

在`48 89 e5`中,字节 `48`是设置了`W`操作码的操作码`89`是 `MOV r/m, r`,,,,,,`e5`选择将`%rsp`移入`%rbp`掉REX,剩下的字节就变成了`movl %esp, %ebp`,我知道.

只有有任何 REX,编码4至7就会选择`%spl`,我知道.`%bpl`,我知道.`%sil`,我知道.`%dil`没有什么.`%ah`,我知道.`%ch`,我知道.`%dh`,我知道.`%bh` 解码器维护两张表

### 操作码分布在两张映射表中

单字节操作码最常见的.`0F`转义到双字节映射表,而`0F 38`或`0F 3A`转义到样例从未使用的三字节映射表(SDM 2.1.2)──有些操作码将ModRM的法规 字段用作额外的三字节映射位,手册中写作 `/digit`,我知道.`83 /7`是带8位立即数的`cmp`没有任何`83 /5`是 `sub`没有任何`FF /4`是间接`jmp`,我知道.

`code/main.py`中部解码器覆盖了四个例子目标文件中的操作码以及少量相近操作码.`mov`,我知道.`lea`,我知道.`movslq`,我知道.`movzbl`,我知道.`imul`移位`test`和 `idiv`及`push`,我知道.`pop`,我知道.`call`,我知道.`ret`十六种条件跳转多字节`nop`其他操作码都会被抛出,带着地址和原因.`DecodeError`测的解码器比停止工作的解码器更糟糕.

### 选择操作数

 SDM 2.1.3 将ModRM 分为`mod`没有人能让你知道.`reg`其他地方`r/m`没有什么可做.`mod = 11`表示 r/m 是寄存器──`mod = 00`,我知道.`01`,我知道.`10`分别表示无位移、8位位移或32位位位移的内存寻址。`r/m = 100`表示后面跟着一个SIB字节.`scale`没有任何其他方法`index`其他地方`base`(2:0);指数为`100`表示没有索引寄存器──

在表2-2中,有两个特殊规则在64位模式下很重要.`mod = 00`且`r/m = 101`不是`(%rbp)`根据下一条指令的32位位移 (SDM 2.2.1.6)`mod = 00`且SIB的基础为`101`则表示没有基址寄存器的32位位移动──

以 `-O0`下一个`grade`中中 `8d 44 08 fa`操作码`8D`是 `lea`〔ModRM〕`44`是 `01 000 100`位位移 条 为`%eax`后面跟着SIB.SIB.`08`是 `00 001 000`缩放因子 1 索引`%rcx`基址`%rax`位移字节 位移字节`fa`是 -6──AT&T 文本为 `leal -0x6(%rax,%rcx), %eax`计算是开关索引`score / 10 - 6`,我知道.

### 位移是链接器的写入位置

`48 8d 0d 00 00 00 00`是 `leaq (%rip), %rcx`在可重定位目标文件中,它们是占位符.`.rela.text`中偏移 `0x69`的条目写着`R_X86_64_PC32.rodata-0x4`〔psABI〕表 4.9) 将`R_X86_64_PC32`定义为`S + A - P`符号地址加上加数,再减去该字段的地址──

处理器将该字段添加到下一条指令的地址,因此最终目标是`S + A + (end - P)`为了这条`lea`现在,我在做了什么?`end - P`为4,目标是`.rodata + (-4) + 4 =.rodata + 0x0`△加数 -4 预先补偿了这四节. 样本中的每个 RIP 相对操作数都包含这个 -4,因此`-O1`的`lea`上的`.rodata+0x10`实际上意味着`.rodata+0x14`,我知道.

解码器记录每条命令内部位移字段的偏移――`resolve_reference()`在重定位表中查找这个偏移,并报告链接后操作数将指向哪里.`leaq (%rip), %rcx`转变成位于`.rodata+0x0`他们的表现.

### 立即数最多32位,只有一个例外

根据SDM 2.2.1.5 规定,在64位模式下,即时数量仍然最多32位,并进行符号扩展.`MOV r64, imm64`带`REX.W`的`B8+r`),AT&T 语法称之为`movabsq`△对于算术操作,解码器将8位立即读取为有符号数`83 c1 fa`是 `addl $-0x6, %ecx`);对于移位计数和重排选择器,则读取为无符号数`pshufd $0xee`        `llvm-objdump`输出一致.

快分支,`push`和 `pop`默认使用64位操作数并忽略 `66`解码器无需读取操作数大小前,就会将它们命名为`pushq`,我知道.`popq`,我知道.`callq`和 `retq`,我知道.

## 手工解码 一条命令

在信任代码之前,先在纸上解码`grade`中中 `48 69 c0 67 66 66 66`,我知道.

1. `48`位于`40`到了`4F`之间,因此是`W = 1`操作数大小为64位.
2. `69`是 `IMUL r, r/m, imm32`,我知道.
3. `c0`是ModRM`11 000 000`寄存器形式,reg 为 `%rax`为了`%rax`,我知道.
4. 下一个四节是小端序立即数:`0x66666667`,我知道.
5. 据了解,在该地区,`imulq $0x66666667, %rax, %rax`,我知道.

总计七字节,`llvm-objdump`印的文本完全相同. 这个常数是一个倒数,让可以通过乘法和随后的.`sarq $0x22`实现除以10──第34课 还会遇到这个操作,届时升机将将其恢复为`score / 10`,我知道.

解码器在`Decoder.decode()`,我知道.`_State.modrm()`和 `_State.finish()`按照此顺序阅读,并将每个分支与其文档字符串中标记的SDM小节对应起来.

## 线性扫描

施瓦兹·德布雷 和安德鲁斯 在"执行代码的拆除"中复制 (2002年WCRE) 第3.1节描述了线性扫描:从代码节的第一个字节开始,解码一条命令,再从后面的字节继续,直到最后.`objdump`如此工作,`llvm-objdump`这也是如此.

```python
def linear_sweep(code: bytes, start: int = 0, end: int | None = None) -> SweepResult:
    position = start
    while position < end:
        try:
            instruction = decode(code[:end], position)
        except DecodeError:
            undecodable.append((position, code[position]))
            position += 1
            continue
        instructions.append(instruction)
        position = instruction.end
```

这种方法有一个失败模式,论文图 1 显示它. 数据字节被解码为命令,然后解码器会暂时错过真正的命令边界. 在 x86 上,解码器通常在几字节内重新同步,这使得错误难以发现.

线性扫描也是本课的参考判定器.`llvm-objdump -d`一致,而`llvm-objdump`现在,我们正在寻找一个好方法.`code/fixtures/*.objdump.txt`△测试将每一行解析为地址、字节和文本,删除 `#`后的注释,再进行比较. 四个目标文件分别包含86、56、84 和 11条指令,总计237条,解码器全部匹配.

## 递归下降

同一论文第3.2节将第二种方法称为递归遍历――从已知入口开始,解码直到遇到控制转移――对于直接跳转,从目标继续;对于条件分支,从目标和下一条指令继续;对于调用,从后续继续,因为调用者会回来;对于回来,则停止――维护已访问地址集合,确保遍历能够终止――

```python
if instruction.flow == "branch":
    worklist.append(instruction.target)
    address = instruction.end
elif instruction.flow == "indirect-jump":
    table = resolver(instruction, instructions) if resolver else None
    if table is None:
        unresolved.append(instruction)
        break
```

通过这种方法的失败模式恰恰相反.间接跳转的字节里没有目标,遍历会在这里停止,所有只能通过跳转到达的块都仍然未知.`main.py`中回降会将这种情况记录为冲突并停止该路径,让重叠显现,而不是静默地解码两次.

安德里斯等使用981个编译器生成的二进制文件评价了9个反汇编译器 (USENIX Security 2016) ⋅真实编译器输出中的内嵌数据和重叠代码,比文献假设更少见,而困难的基本任务是恢复函数边界――请记住这两个结论:下一节的陷在编译器输出中很少见,而`grade`间接跳转很常见.

## 一线性扫描错误,递归下降正确的样本

`code/fixtures/sweep-trap.s`是24字节的手写汇编,函数体内包含一张四字节的表.`movzbl (%rcx,%rax), %eax`索引该表,再跳过它.

```asm
lookup:
        movslq  %edi, %rax
        leaq    .Ltable(%rip), %rcx
        movzbl  (%rcx,%rax), %eax
        jmp     .Ldone
.Ltable:
        .byte   0x31, 0xc0, 0x90, 0x48
.Ldone:
        addl    $1, %eax
        retq
```

使用 `clang -target x86_64-unknown-linux-gnu -c sweep-trap.s`构建它. 四个表字节经过特意挑选,可以解码成看似合理的指令.`31 c0`是 `xorl %eax, %eax`没有任何`90`是 `nop`,我知道.`48`现在,我们在线扫描将其与真实进行.`addl $1, %eax`印发为 印发为 印发为`addq $0x1, %rax`获的`llvm-objdump`输出正是这样:

```text
       e: eb 04                        	jmp	0x14 <lookup+0x14>
      10: 31 c0                        	xorl	%eax, %eax
      12: 90                           	nop
      13: 48 83 c0 01                  	addq	$0x1, %rax
      17: c3                           	retq
```

这份清单看不出任何损坏:每个字节都被解码,每个字符都存在,还有`retq`,但清单仍然有三个错误.`0xe`跳转的目标是`0x14`清单中没有任何指令.`0x14`开始了.`0x14`执行的是32位`addl`清单上显示了64个字节.`addq`四个表字节也被显示为代码.

从`lookup`符号开始的递归下降解码出六条命令,沿跳转到达`0x14`报告`addl $0x1, %eax`,它没有将四个表字节或`plus_one`在前面的八个填写字节中,任何一个都被定为指令.`main.py`中中 `trap_report()`打印比较结果:

```json
"linearSweep": {
  "instructions": 9,
  "atJumpTarget": {"starts": "0x13", "text": "addq\t$0x1, %rax", "startsAtTarget": false},
  "claimedDataBytes": 4,
  "claimedPaddingBytes": 8
},
"recursiveDescent": {
  "instructions": 6,
  "atJumpTarget": "addl\t$0x1, %eax",
  "claimedDataBytes": 0,
  "claimedPaddingBytes": 0
}
```

测试`test_sweep_and_objdump_share_the_same_mistake`断言,`llvm-objdump`在`0x13`打印了`addq $0x1, %rax`△参考判定器是线性扫描,也继承了它的盲点.

## 基本块

艾伦在1970年在"控制流分析"中定义了基本块:一段只能从首条指令进入、从最后条指令离开的指令序列.

构建过程对按地址排序已解码命令执行两次扫描――第一次收集首次命令:入口、分支或跳转目标、表目标,以及任何控制转移后的命令――第二次在每个首次命令以及地址序列中的每个空隙处开始一个新的块――

```python
for instruction in self.instructions:
    if instruction.address in leaders or current is None or current.end != instruction.address:
        current = Block(instruction.address, [])
        self.blocks[instruction.address] = current
    current.instructions.append(instruction)
```

边由每个块的最后条命令决定――回归没有后继;跳转一个,标记为`jump`条件分支有两个,分别标记为`taken`和 `fallthrough`△块末尾的普通命令顺序落入下一个块,这发生在下一个命令是分支目标时.间接跳转后的后续是表中的目标,标记为`table`如果没有目标,则将该块记入`unresolved`,我知道.

另一方面, 进入无法达到的块是不可达的块.`-O0`下对`grade`如果一个块的起始地址落在另一种方法清单的某条命令内部,就是陷样例中的重叠情况.

## 总的控制流图

`-O1`下一个`total`有31节 13条命令:

```text
      40: 85 f6                        	testl	%esi, %esi
      42: 7e 18                        	jle	0x5c <total+0x1c>
      44: 89 f1                        	movl	%esi, %ecx
      46: 31 d2                        	xorl	%edx, %edx
      48: 31 c0                        	xorl	%eax, %eax
      4a: 66 0f 1f 44 00 00            	nopw	(%rax,%rax)
      50: 03 04 97                     	addl	(%rdi,%rdx,4), %eax
      53: 48 ff c2                     	incq	%rdx
      56: 48 39 d1                     	cmpq	%rdx, %rcx
      59: 75 f5                        	jne	0x50 <total+0x10>
      5b: c3                           	retq
      5c: 31 c0                        	xorl	%eax, %eax
      5e: c3                           	retq
```

首指令分别是`0x40`,我没有什么.`0x44`(`jle`之后)`0x50`(`jne`目标)`0x5b`(`jne`之后) 和`0x5c`(`jle`目标: 五块

| 起点 | 终点 | 类型 | 原因 |
|---|---|---|---|
| `0x40` | `0x44` | fallthrough | `jle` 未跳转，计数为正 |
| `0x40` | `0x5c` | taken | 计数为零或负数，返回 0 |
| `0x44` | `0x50` | fallthrough | `nopw` 是块内的对齐填充，执行会经过它 |
| `0x50` | `0x50` | taken | `jne 0x50`，即循环 |
| `0x50` | `0x5b` | fallthrough | 循环退出，返回总和 |

`0x4a`处的六字节`nopw`是填充,让`0x50`处的循环头位于16字节边界.`0x44`最后一条`retq`之后,`0x5f`处的单字节`nop`没有路径可以到达它.`unreachable()`现在我们要去.

在`-O2`下,同一函数有140字节和两个循环.`0x80`处的SSE2循环通过`paddd`每轮加8个值, 标量余项在`0xc0`处理――CFG 有两条回边:`0x80 -> 0x80`和 `0xc0 -> 0xc0`测试套件检查了这两边.

## 用代算法计算控制节点

如果从入口到块`b`通过块的每条路径都过了块`d`则称`d`支配`b`,我知道.`b`直接控制节点,是`b`控制节点中距离`b`最近的一个──这个概念经 Allen(1970) 可追溯到Prosser(1959),第 34 课正是依赖于这种结构正确放置`if`和 `while`,我知道.

库珀·哈维和肯尼迪撰写了"简单,快速统治算法" (2001) 它们认为,采用紧表示、按逆序运行的数据流算法,大约1000节点以下图上优于伦加华-塔尔扬 (1979) 论文说其目的不是提出一种新算法,而是说明简单算法在实践中也能胜利,并且适合教学.

```python
def intersect(first: int, second: int) -> int:
    while first != second:
        while number[first] > number[second]:
            first = idom[first]
        while number[second] > number[first]:
            second = idom[second]
    return first

changed = True
while changed:
    changed = False
    for start in order[1:]:
        processed = [p for p in self.predecessors(start) if p in idom]
        candidate = processed[0]
        for other in processed[1:]:
            candidate = intersect(other, candidate)
        if idom.get(start) != candidate:
            idom[start] = candidate
            changed = True
```

`number`保存每个块在逆后序中的位置,入口为0──`intersect`通过两个指针沿着当前的支配树上升走,直到相遇.`<`进行比较.本代码使用逆后序号,因此比较符是`>`余部分都遵循论文的伪代码.

对于`-O1`下一个`total`结果是`idom(0x44) = 0x40`,我知道.`idom(0x50) = 0x44`,我知道.`idom(0x5b) = 0x50`和 `idom(0x5c) = 0x40`边边`0x50 -> 0x50`是回边,因为目标支配源节点;回边标志着循环 (Allen 1970) .`back_edges()`返回这条边.`test_dominators_on_a_hand_built_diamond_with_a_loop`在带汇合点的16字节序列上运行相同代码,让`intersect`处理两个前驱.

## 下级中级跳转表

在`-O0`下,将会`grade`中中 `switch`编译为位置无关跳转表的常用形式:

```text
      5d: 83 e8 04                     	subl	$0x4, %eax
      60: 77 38                        	ja	0x9a <grade+0x6a>
      62: 48 8b 45 f0                  	movq	-0x10(%rbp), %rax
      66: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		0000000000000069:  R_X86_64_PC32	.rodata-0x4
      6d: 48 63 04 81                  	movslq	(%rcx,%rax,4), %rax
      71: 48 01 c8                     	addq	%rcx, %rax
      74: ff e0                        	jmpq	*%rax
```

读成四个事实.`subl $0x4`后跟`ja`是边界检查:大于 4 的索引转到 `0x9a`由于这个问题,我们可以看到一个问题.`leaq`将表地址放入`%rcx`现在,我们已经说明了这个地址为`.rodata+0x0`,我知道.`movslq`以4为缩小因子加载一个有符号32位条目.`addq`面积的距离从表到应对案例块.

目标文件中的每一个表字节都是零.`.rela.rodata`中的重定位形式存在:

```text
RELOCATION RECORDS FOR [.rodata]:
OFFSET           TYPE                     VALUE
0000000000000000 R_X86_64_PC32            .text+0x91
0000000000000004 R_X86_64_PC32            .text+0x8c
0000000000000008 R_X86_64_PC32            .text+0x87
000000000000000c R_X86_64_PC32            .text+0x82
0000000000000010 R_X86_64_PC32            .text+0x86
```

对偏移`4k`的第`k`项应用`S + A - P`△存储值为`.text + A - (.rodata + 4k)`代码再加上`.rodata + 0`所以目标是`.text + A - 4k`△第 0 项是`0x91 - 0 = 0x91`首项是`0x8c - 4 = 0x88`其他问题`0x87 - 8 = 0x7f`◎第3、4项分别是`0x82 - 12 = 0x76`和 `0x86 - 16 = 0x76`,我知道.`score / 10`据了解,在C源码的不同类型中,C源码的不同类型是C源码的不同类型,包括9和10共享类型.

`recover_table()`执行这些计算.`jump_table_resolver()`从`jmpq`找到生成该寄存器值的后匹配常规形式`addq`载它`movslq`、生成基址的`leaq`及执行边境检查`ja`△回归下降 然后将四个不同的目标加入待处理集合并继续.已链接可执行文件表包含最终值,没有重定位;此时同一个函数读取有符号32位条目并加上表地址,`evidence`记录生成目标所使用的路径――

下面是`-O0`下一个`grade`数据来自`python3 code/main.py cfg code/fixtures/ledger-x86_64-O0.o grade`其他:

| 方法 | 指令数 | 块数 | 边数 | 字节 | 问题 |
|---|---|---|---|---|---|
| 线性扫描 | 34 | 9 | 7 | 118 代码 + 10 填充 | 5 个不可达块，没有进入四个 case 块的边，填充被解码为 `nopw` |
| 递归下降 | 25 | 3 | 2 | 82 代码 | 36 个代码字节从未到达，`0x74` 处的 `jmpq *%rax` 未解析 |
| 带表的递归下降 | 33 | 8 | 11 | 118 代码 | 无 |

恢复表表后,控制树完整了.`idom`是包含跳转的块`0x62`,我知道.`0xa1`的`idom`是入口`0x30`因为来自`0x9a`默认路径无需经过`0x62`能到达`0xa1`,我知道.

## 优化器在 - O1 下对等级做了什么

你可能见过这样的描述:`grade`是一个编译为跳转表的交换.`-O1`和 `-O2`下,`grade`中根本没有间接跳转:

```text
      2c: 83 f9 04                     	cmpl	$0x4, %ecx
      2f: 77 0c                        	ja	0x3d <grade+0x2d>
      31: 89 c8                        	movl	%ecx, %eax
      33: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		0000000000000036:  R_X86_64_PC32	.rodata+0x10
      3a: 8b 04 81                     	movl	(%rcx,%rax,4), %eax
      3d: c3                           	retq
```

重定位加数 `0x10`增加通常的4,得到表地址.`.rodata+0x14`装载只是普通的`movl`为了`01 00 00 00 02 00 00 00 03 00 00 00 04 00 00 00 04 00 00 00`△编译器使用包含五个返回值的表取代了五个案例块.`find_value_tables()`报告的内容为`value-table`条目为`[1, 2, 3, 4, 4]`没有带有`evidence: "bytes"`,我知道.

`-O2`下一个`grade_label`更多的. 包含五个字符串指针.`labels`数组,变成位置`.rodata+0x0`、包含五个32位偏移表. 每个都带有针对字符节的图表.`R_X86_64_PC32`重定位,函数将表地址加到所加载的条目上.`recover_table()`读取这五个重定位,回来`.rodata.str1.1`中的偏移`0, 2, 4, 6, 8`它们分别保存`F`,我知道.`D`,我知道.`C`,我知道.`B`,我知道.`A`◎恢复跳转表的相同计算也可以恢复相对数据表,因为它们都是已知偏移的.`S + A - P`,我知道.

这两个构建版本带来的教训是:按字节呈现的实际情况命名.跳转表改变控制流图,值表改变一次加载.

## 雷亚和吉德拉在这里提供什么

配合Ghidra 12.1.4提供商,将`procedure_assembly`中函数的列表文本作为一个字符串返回.`inspect_native_instruction`返回单条指令的字节,长度,解码文本,操作数代币,带类型引用和控制流,其中返回操作根据p代码 分类.`xrefs`返回吉德拉的`ReferenceManager.getReferencesTo`提供排序去重源地址──`analyze_function`包含函数的CFG 和 `body`,我知道.`procedure_info`将函数体表示为两端都包含的地址范围,并提醒:不能将空隙和共享尾部视为函数拥有的字节──

这些事实都是Ghidra的归降和分析器结果的序列化形式.`instruction_flow_evidence`,我知道.`function_references`和 `jump_table_evidence`由于这种情况,由于Ghidra 找不到表时,控制流是未知,因此结果会标志着产生它的规则,但无法展示推导过程.

现在你已经在同一目标文件上运行了推过程.`python3 code/main.py cfg`合同的内容对照,意味着你有两个独立的推导;不一致的处则提供一个可检查的具体地址,这正是第35节的未知项.

从程序安全角度提醒一点:Capstone 6.0.0-Alpha10(2026-07-21) 修复了CVE-2026-55893 和CVE-2026-55894 涉及越界读写,5.0.9(2026-05-28) 则回移动了CVE 修复──解码器读取的字节并非自发生成──15 字节限制──`_Cursor.byte()`截止检查,以及拒绝猜测未知的操作码,都在保护`main.py`避免处理超出其设计范围的输入.

## 动手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/main.py
```

输出是一个JSON报告. 它给出每个样本目标文件与参考判定器的一致性;给出每个函数的指令数,块数和边数,以三个方法. 它还列出不可达成的块,未解析间接跳转,回边,直接控制节点以及所有表,最后给出陷样本的比较.

预期结构:

```json
{
  "fixtures": {
    "ledger-x86_64-O0.o": {
      "oracle": "86/86 instructions agree with llvm-objdump",
      "functions": {
        "grade": {
          "range": "0x30-0xa6",
          "paddingBytes": 10,
          "linearSweep": {"instructions": 34, "blocks": 9, "edges": 7, "unreachableBlocks": ["0x76", "0x7f", "0x88", "0x91", "0xa6"], "...": "..."},
          "recursiveDescent": {"instructions": 25, "blocks": 3, "edges": 2, "unresolvedIndirectJumps": ["0x74"], "...": "..."},
          "recursiveDescentWithTables": {"instructions": 33, "blocks": 8, "edges": 11, "...": "..."},
          "tables": [{"kind": "jump-table", "table": ".rodata+0x0", "count": 5, "entries": ["0x91", "0x88", "0x7f", "0x76", "0x76"], "evidence": "relocation", "...": "..."}]
        }
      }
    }
  },
  "sweepTrap": {"...": "..."}
}
```

按以下顺序阅读 `code/main.py`其他:

1. `ElfObject`读取节头、符号和 `.rela.*`条目,`symbolize()`按 `llvm-objdump`的方式为地址命名.
2. `Decoder.decode()`读取前和REX,然后根据单字节或双字节操作码映射分派.
3. `_State.modrm()`读取 ModRM、SIB 和位移,并记录位移字段的偏移──
4. `resolve_reference()`转移或立即数字段上的重定位应用`S + A - P`,我知道.
5. `linear_sweep()`和 `recursive_descent()`两种方法,各自的记录失败情况.
6. `recover_table()`和 `jump_table_resolver()`通过重定位或字节读取表.
7. `ControlFlowGraph`构建首条例,块和带类型边,`dominators()`实现代算法――
8. `analyze_function()`对于一个函数运行的所有方法,`compare_with_oracle()`检查解码器――

还有两个命令.`python3 code/main.py disasm FILE.o`打印清单,并带重定位目标的每条指令后显示该目标.`python3 code/main.py cfg FILE.o FUNCTION`打印单个函数的分析――

## 实际使用

为了新目标文件,按照此顺序使用三种方法.

1. 首先运行参考对照.解码器若在普通指令上与`llvm-objdump`不一致,就有错误,后续所有的结构都继承它.
2. 从每个函数符号开始运行回归下降,并阅读`unresolved`,每项都是你还没有掌握的目标间接跳转或调用.
3. 对于每一个未解析的跳转,寻找表的常用形式以及指向表的重定位.
4. 字节比线性扫描和递归下降.只有扫描确定命令的字节是填充或数据;这两种未确定字节是不可达代码,或属于你尚未找到的函数.
5. 通过恢复表后的回归下降结果构建CFG,并查看回边.`while`或`for`,我知道.

转移到新编译器版本时,重新捕获它们,因为清单变化意味着样本也改变了.

## 交互实验

### 实验A:先在纸上解码,再检查

在`code`现在打开Python:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow/code
python3 -q
```

运行:

```python
from main import *
decode(bytes.fromhex("48 8d 0d 00 00 00 00"), 0).text
decode(bytes.fromhex("8d 44 08 fa"), 0).text
decode(bytes.fromhex("66 66 66 66 66 2e 0f 1f 84 00 00 00 00 00"), 0).length
```

每次调用前先写下预期结果――然后删除第一项中`48`观察操作数大小变化.`decode(bytes.fromhex("0f 0a"), 0)`阅读`DecodeError`,我知道.

### 实验B:离开上重定位

```python
elf = load_fixture("ledger-x86_64-O0.o")
code = elf.section(".text").data
lea = decode(code, 0x66)
lea.displacement_offset
resolve_reference(elf, lea)
```

引用结果是`.rodata+0x0`〔将地址改成〕`grade_label`中中 `0x116`读取指向`.data`引用了,然后解码了.`0x10e`处的`callq`并且解析了它.`R_X86_64_PLT32 grade-0x4`解析后的目标为`0x30`现在,我还在`grade`,我知道.

### 实验C:观察两种方法的分歧

```python
trap = load_fixture("sweep-trap.o")
text = trap.section(".text").data
[i.text for i in linear_sweep(text, 0, 0x20).instructions]
[i.text for i in recursive_descent(text, [0], 0x20).sorted_instructions()]
```

统计每列表中的指令数,从`0x13`开始那条.然后将.`sweep-trap.s`中表的最后一节`0x48`改为`0xe8`现在,线性扫描将将将`addl`和 `retq`吞进一条目标位于节外的`callq`函数似乎没有返回.

### 实验 D:手算支配节点

```python
analysis = analyze_function(load_fixture("ledger-x86_64-O1.o"), "total")
analysis.cfg.edges
analysis.cfg.reverse_postorder()
analysis.cfg.dominators()
analysis.cfg.back_edges()
```

在纸上画出五块,先计算控制节点再看结果.`-O0`下一个`grade`运行相同的代码,解释为什么`idom(0xa1)`是 `0x30`而不是`0x62`,我知道.

## 实践实验

举例添加一个间接调用点,并扩展分析.

要求:

- 编写一个C 函数,通过从小数组中选取的函数指标调用函数──分别使用`-O0`和 `-O1`构建,将目标文件及其`llvm-objdump`文本一起提交.
- 让解码器在两个目标文件上都与参考结果一致.
- 扩展`recursive_descent()`让间接调用将调用点记录到`calls`目标设为`None`随后继续执行.
- 编写解析器,通过重定位读取函数指针数组并报告可能的调用者──
- 将被调用者集合以`indirectCalls`添加到函数报告,并为每个目标提供证据类型.
- 编写测试,使解析器返回非函数符号的目标时测试失败──

成功标准是:`python3 code/main.py cfg`能列出每一个可能被调用者及证明其重定位,并且所有目标文件仍然通过参考对照.

## 评分实验

五个关于本课件的题目. 用你构建的代码找到每个答案,然后写入.`code/lab_answers.json`△数字写成数字,或写成`"0x40"`这样十六进制字符串;列表写成JSON列表.

1. `t1`归降在 -O1 的级中解码出的指令数.
2. `t2`:-O1的总数 中基本块的数量――
3. `t3`:-O1 的总中循环头的地址,写成十六进制──
4. `t4`在扫描陷中,覆盖 0x14 的线性扫描指令的起始地址,写成十六进制
5. `t5`:-O0 的级 中跳转表的条目数量──

检查你的答案:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/lab.py
```

检查器在已提交的固定上使用 `code/main.py`计算每个期望值.`PASS`,我知道.`FAIL`或`TODO`只有五个问题全部通过,才以0退出.`python3 code/lab.py my-answers.json`可检查另一个文件.`code/tests/test_lab.py`证明检查器接受正确答案并拒绝错误答案──

### 看它运行

[Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler?program=trap&sweep=linear)机器将本课作为其解码台和基本块板来运行.`sweep-trap.o`解码台显示被视为解码的四个数据字节,并有一个标记指出位于`0x13`处`addq`内部 地址`0x14`跳转目标:把解码器切换到递归下降,可以看到跳转过了这些数据.

## 本课产物

本课包含`outputs/skill-disassembly-and-control-flow.md`△它将目标文件和函数名称转换为经过检查的清单,基本块,带类型边缘,控制节点以及所有未解析的控制转移. 它要求提供参考对照,两种反汇编方法,字节核算,每个恢复表的重定位证据以及未知内容说明.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/main.py
python3 code/tests/test_main.py
```

验证应证明:

- 解码器在四个例子中,目标文件的全部237条指令上与`llvm-objdump -d`一致
- 选择 64 位操作数,REX.R 和 REX.B 扩展寄存器字段
- 模特RM和SIB正确呈现AT&T内存操作数,包括缩放因子,索引和有符号位移
- 关于移动的区块与其在指令中的区块的移动记录
- 重复传统前和段覆盖的解码结果与参考结果一致
- 强制`66`前选择 SSE 操作码,并让寄存器保持 32 位
- 8 位即时数用于算术进行符号扩展,用于移位计数时为无符号数
- 超过15字节的命令,被截断的命令和未知的操作码都会被抛出.`DecodeError`
- `lea`上的`R_X86_64_PC32`解析为表,`call`上的`R_X86_64_PLT32`解析为被调用者
- 线性扫描将被陷入陷中的表解码为代码,然后跳转目标处没有指令
- 递归下降从不将表或填充认定为指令,并在目标处读取`addl $0x1, %eax`
- `llvm-objdump`在陷上犯了与线性扫描相同的错误
- 命令内部的入口会被记录为冲突
- 没有解决的间接跳转会停止回归下降,并被列出
- `-O1`下一个`total`有五块,五条带类型边,一条回边,以及预期的直接控制节点.
- 手工构造带循环形图产生算法定义的控制节点
- `-O2`下一个`total`有两个循环.
- `-O0`下一个`grade`从`.rela.rodata`恢复出五项跳转表,目标为`0x91, 0x88, 0x7f, 0x76, 0x76`
- 没有恢复表时,`-O0`下一个`grade`有三个块和一个未解答跳转
- `-O1`和 `-O2`下一个`grade`是值表`[1, 2, 3, 4, 4]`没有间接跳转
- `-O2`下一个`grade_label`通过五个重定位读取相对字符串表
- 互联图嵌入式数据与分析产生的数据相同

## 生产环境失败模式

| 故障 | 较弱工具的报告 | 分析必须证明的内容 |
|---|---|---|
| `.text` 内有数据 | 每个字节都被解码、看似合理的清单 | 递归下降未认定任何数据字节为指令，且跳转目标是指令起点 |
| 最后一次返回之后的填充 | 函数末尾有一条 `nopw` | 这些字节从入口不可达 |
| 通过表的间接跳转 | “jmp rax”和四个死块 | 表地址来自 `lea` 重定位，条目数来自边界检查，目标来自 `.rela.rodata` |
| switch 变成值表 | “带重定位的跳转表” | 从 `.rodata+0x14` 进行 `movl` 加载，三个块，没有间接转移 |
| 位移为零的调用 | `callq 0x113`，即下一条指令 | `R_X86_64_PLT32 grade-0x4` 解析为 `0x30` |
| 解码器猜测未知操作码 | 看起来正确的助记符 | 带地址的 `DecodeError`，扫描记录该字节 |
| 指令超过 15 字节 | 一条很长的“指令” | 游标在读取第 16 字节之前抛出异常 |
| 分支进入指令中间 | 两份重叠的清单 | 包含两个地址的冲突记录 |
| 循环被报告为直线代码 | 伪代码中没有 `while` | 一条目标支配源节点的回边 |
| 参考输出来自不同编译器 | 测试在过时文本上通过 | 样例 README 标明精确的编译器和命令 |

## 操作准则

以判定器核对解码的参考,从已知入口遍历控制流,将每个字节核算为已认定代码、填充、数据或不可达成内容――从可明确指定的重定位或表中恢复每个间接目标――其余内容带上地址,记录为未知――

## 延伸阅读

- [Intel 64 and IA-32 Architectures Software Developer's Manual，第 2 卷第 2 章：指令格式](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [AMD64 Architecture Programmer's Manual 第 3 卷第 1 章：指令编码](https://docs.amd.com/v/u/en-US/24594_3.38_APM_Vol3_PUB)
- [System V Application Binary Interface，AMD64 Architecture Processor Supplement，表 4.9：重定位类型](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Schwarz、Debray、Andrews，《Disassembly of Executable Code Revisited》（WCRE 2002）](https://www2.cs.arizona.edu/~debray/Publications/disasm.pdf)
- [Andriesse 等，《An In-Depth Analysis of Disassembly on Full-Scale x86/x64 Binaries》（USENIX Security 2016）](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/andriesse)
- [Allen，《Control Flow Analysis》（1970）](https://doi.org/10.1145/800028.808479)
- [Cooper、Harvey、Kennedy，《A Simple, Fast Dominance Algorithm》（2001）](https://www.cs.tufts.edu/~nr/cs257/archive/keith-cooper/dom14.pdf)
- [Lengauer、Tarjan，《A fast algorithm for finding dominators in a flowgraph》（1979）](https://doi.org/10.1145/357062.357071)
- [Capstone 6.0.0-Alpha10 发布说明](https://github.com/capstone-engine/capstone/releases/tag/6.0.0-Alpha10)
- 本课描述的 rea 6.5.0 源码位于标签 `3b79af2`其他:`README.md`,我知道.`docs/ghidra-provider.md`,我知道.`docs/ghidra-dos.md`,我知道.`docs/reverse-engineering-tools.md`,我知道.`bridge/ghidra/ReaGhidraBridge.java`,我知道.`src/contracts/officialToolContracts.ts`,我知道.`src/ghidra/GhidraAnalysisProfile.ts`,我知道.
