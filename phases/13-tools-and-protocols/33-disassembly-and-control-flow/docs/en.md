# 反汇编与控制流：从字节到可验证的图

> 反汇编清单是在断言哪些字节是指令；本课将构建解码器和图，检验这一断言。

**Type:** Build
**Languages:** Python, C, x86-64 assembly
**Prerequisites:** Phase 13 · 32（从零构建 ELF）
**Time:** ~150 分钟

## 学习目标

- 根据 Intel SDM 第 2 卷第 2 章的规则，解码 ledger 测试样例中的 x86-64 指令子集。
- 对每个样例构建产物的每条指令，与 `llvm-objdump -d` 对照验证解码器。
- 对相同字节运行线性扫描和递归下降，并解释各自出错的位置。
- 将指令划分为基本块，构建带类型边的控制流图。
- 用 Cooper、Harvey 和 Kennedy 的迭代算法计算直接支配节点，并通过回边寻找循环。
- 从指向跳转表的重定位条目恢复间接跳转的目标。

## 问题

你用 `-O0` 编译了 `ledger.c`，然后询问一个 agent：`grade` 做什么？agent 调用反汇编器、读取清单，回答说该函数以目标未知的 `jmpq *%rax` 结束。随后它写出的伪代码只有一条 `return 0`。

你用 `llvm-objdump -d` 打开同一个目标文件，看到跳转后有四个块，分别存储 4、3、2、1。它们一直都在清单里。清单没有说明执行如何到达这些块，因此工具将它们当作死代码。

清单只回答一个问题：哪些字节构成哪条指令。它不会说明哪些指令会执行、以何种顺序执行、从哪里开始执行。要回答这些问题，还需要三种结构：控制流能到达的字节、基本块，以及块之间的边。

rea 6.5.0 没有自己的反汇编器。若要深入分析，其 README 要求你自行提供 Ghidra、Hopper 或 IDA。离线检查时，rea 也能调用你安装的 GNU objdump 或 Rizin。它的调用图会止步于未解析的目标：“调用者/被调用者仅包含已解析的函数……没有目标的计算型控制流仍然未知。”本课构建的就是产生这些事实的部分，让你能判断工具报告的结果。

```figure
re-33-sweep-vs-descent
```

## 指令格式的每个字段都有对应规则

Intel SDM 第 2 卷图 2-1 给出了每条指令的字节顺序。首先是可选前缀，然后是一至三个操作码字节，再后面是可选的 ModRM 字节和可选的 SIB 字节。接着是 0、1、2 或 4 字节的位移，然后是 0、1、2 或 4 字节的立即数。整条指令最多 15 字节（SDM 2.3.11）。AMD APM 第 3 卷第 1 章第 1.1 至 1.7 节用更少的篇幅描述了相同格式，适合交叉核对。

每个字段决定下一个字段的含义。因此，解码器是一连串小决策，每个决策背后都能在手册中找到对应说明。

### 前缀分为四组

SDM 2.1.1 列出了传统前缀。第 1 组包含 `F0` lock 和重复前缀 `F2`、`F3`。第 2 组包含六种段覆盖（`2E` 是 `%cs`）以及分支提示。第 3 组是 `66`，即操作数大小覆盖。第 4 组是 `67`，即地址大小覆盖。

手册说每组可以使用一个前缀，但编译器会生成更多。`ledger-x86_64-O0.o` 中偏移 `0xf2` 的对齐填充是 `66 66 66 66 66 2e 0f 1f 84 00 00 00 00 00`，连续出现五个 `66`。`llvm-objdump` 将其打印为 `nopw %cs:(%rax,%rax)`，你构建的解码器也是如此。解码器收集看到的所有前缀字节，稍后再判断哪些真正起作用。

`66` 还有第二个作用。对于 SSE 指令，它是选择操作码的强制前缀，因此 `66 0f ef c0` 是 `pxor %xmm0, %xmm0`，而不是什么 16 位操作。`F3 0f 6f` 是 `movdqu`。解码器首先查找“强制前缀与第二个操作码字节”的组合。只有该组合没有对应条目时，`66` 才表示 16 位操作数。

### REX 增加四个位，而且必须紧挨操作码

SDM 2.2.1 将 REX 定义为 `40` 到 `4F` 之间的一个字节，格式为 `0100WRXB`。`W` 选择 64 位操作数。`R` 扩展 ModRM 的 reg 字段。`X` 扩展 SIB 的 index 字段。`B` 扩展 ModRM 的 r/m 字段、SIB 的 base 字段或操作码字节中的寄存器（表 2-4）。REX 必须紧接在操作码或转义字节之前；如果 REX 后面跟着传统前缀，它就会被忽略。

在 `48 89 e5` 中，字节 `48` 是设置了 `W` 的 REX。操作码 `89` 是 `MOV r/m, r`，ModRM `e5` 选择将 `%rsp` 移入 `%rbp`。去掉 REX，其余相同字节就变成 `movl %esp, %ebp`。

REX 也会改变字节寄存器的名称。只要存在任何 REX，编码 4 至 7 就会选择 `%spl`、`%bpl`、`%sil`、`%dil`，而不是 `%ah`、`%ch`、`%dh`、`%bh`。因此解码器维护两张表。

### 操作码分布在两张映射表中

单字节操作码最常见。`0F` 转义到双字节映射表，而 `0F 38` 或 `0F 3A` 转义到样例从未使用的三字节映射表（SDM 2.1.2）。有些操作码将 ModRM 的 reg 字段用作额外的三个操作码位，手册中写作 `/digit`。`83 /7` 是带 8 位立即数的 `cmp`，`83 /5` 是 `sub`，`FF /4` 是间接 `jmp`。

`code/main.py` 中的解码器覆盖四个样例目标文件中的操作码以及少量相近操作码。包括八种算术形式、`mov`、`lea`、`movslq`、`movzbl`、`imul`、移位、`test` 和 `idiv`，以及 `push`、`pop`、`call`、`ret`、十六种条件跳转、多字节 `nop` 和五个 SSE2 操作码。任何其他操作码都会抛出带地址和原因的 `DecodeError`。猜测的解码器比停止工作的解码器更糟。

### ModRM 和 SIB 选择操作数

SDM 2.1.3 将 ModRM 分为 `mod`（位 7:6）、`reg`（5:3）和 `r/m`（2:0）。`mod = 11` 表示 r/m 是寄存器。`mod = 00`、`01`、`10` 分别表示无位移、8 位位移或 32 位位移的内存寻址。`r/m = 100` 表示后面跟着一个 SIB 字节。SIB 分为 `scale`（7:6）、`index`（5:3）和 `base`（2:0）；index 为 `100` 表示没有索引寄存器。

表 2-2 中有两条特殊规则在 64 位模式下很重要。`mod = 00` 且 `r/m = 101` 并不是 `(%rbp)`，而是相对于下一条指令的 32 位位移（SDM 2.2.1.6）。`mod = 00` 且 SIB 的 base 为 `101`，则表示没有基址寄存器的 32 位位移。

以 `-O0` 下 `grade` 中的 `8d 44 08 fa` 为例。操作码 `8D` 是 `lea`。ModRM `44` 是 `01 000 100`：8 位位移、reg 为 `%eax`，后面跟着 SIB。SIB `08` 是 `00 001 000`：缩放因子 1、索引 `%rcx`、基址 `%rax`。位移字节 `fa` 是 -6。AT&T 文本为 `leal -0x6(%rax,%rcx), %eax`，计算的是 switch 索引 `score / 10 - 6`。

### 位移是链接器写入的位置

`48 8d 0d 00 00 00 00` 是 `leaq (%rip), %rcx`。四个零字节是 RIP 相对操作数的位移字段。在可重定位目标文件中，它们是占位符。`.rela.text` 中偏移 `0x69` 的条目写着 `R_X86_64_PC32.rodata-0x4`。psABI（表 4.9）将 `R_X86_64_PC32` 定义为 `S + A - P`：符号地址加上加数，再减去该字段的地址。

处理器将该字段加到下一条指令的地址，因此最终目标是 `S + A + (end - P)`。对于这条 `lea`，该字段占最后四字节，所以 `end - P` 为 4，目标是 `.rodata + (-4) + 4 =.rodata + 0x0`。加数 -4 预先补偿了这四字节。样例中的每个 RIP 相对操作数都在加数中包含这个 -4，因此 `-O1` 的 `lea` 上的 `.rodata+0x10` 实际意味着 `.rodata+0x14`。

解码器记录每条指令内部位移字段的偏移。`resolve_reference()` 在重定位表中查找该偏移，并报告链接后操作数将指向哪里。正是这个函数把 `leaq (%rip), %rcx` 转变成了“位于 `.rodata+0x0` 的表”。

### 立即数最多 32 位，只有一个例外

SDM 2.2.1.5 规定，在 64 位模式下立即数仍然最多 32 位，并进行符号扩展。例外是 `MOV r64, imm64`（带 `REX.W` 的 `B8+r`），AT&T 语法称之为 `movabsq`。对于算术操作，解码器将 8 位立即数读取为有符号数（`83 c1 fa` 是 `addl $-0x6, %ecx`）；对于移位计数和重排选择器，则读取为无符号数（`pshufd $0xee`）。这种区分与 `llvm-objdump` 的输出一致。

近分支、`push` 和 `pop` 默认使用 64 位操作数并忽略 `66`（SDM 2.2.1.7）。因此解码器无需读取操作数大小前缀，就会将它们命名为 `pushq`、`popq`、`callq` 和 `retq`。

## 手工解码一条指令

在信任代码之前，先在纸上解码 `grade` 中的 `48 69 c0 67 66 66 66`。

1. `48` 位于 `40` 到 `4F` 之间，因此是 `W = 1` 的 REX。操作数大小为 64 位。
2. `69` 是 `IMUL r, r/m, imm32`。
3. `c0` 是 ModRM `11 000 000`：寄存器形式，reg 为 `%rax`，r/m 为 `%rax`。
4. 接下来四字节是小端序立即数：`0x66666667`。
5. AT&T 顺序为立即数、源、目标：`imulq $0x66666667, %rax, %rax`。

总计七字节，`llvm-objdump` 打印的文本完全相同。这个常数是一个倒数，让 clang 可以通过乘法和随后的 `sarq $0x22`（右移 34 位）实现除以 10。第 34 课还会遇到这对操作，届时提升器会将其还原为 `score / 10`。

解码器在 `Decoder.decode()`、`_State.modrm()` 和 `_State.finish()` 中执行这五步。按此顺序阅读，并将每个分支与其文档字符串中标注的 SDM 小节对应起来。

## 线性扫描

Schwarz、Debray 和 Andrews 在《Disassembly of Executable Code Revisited》（WCRE 2002）第 3.1 节描述了线性扫描：从代码节的第一个字节开始，解码一条指令，再从它后面的字节继续，直到末尾。`objdump` 如此工作，`llvm-objdump` 也是如此。

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

这种方法有一种失败模式，论文图 1 展示了它。数据字节被解码为指令，随后解码器会暂时错过真正的指令边界。在 x86 上，解码器通常在几个字节内重新同步，这让错误难以察觉。只有遇到非法操作码才能检测到问题，因此论文结论是这些算法会“静默失败”。

线性扫描也是本课的参考判定器（oracle）。解码器必须在每个样例的每条指令上与 `llvm-objdump -d` 一致，而 `llvm-objdump` 本身就是线性扫描。捕获的文本位于 `code/fixtures/*.objdump.txt`。测试将每一行解析为地址、字节和文本，删除 `#` 后的注释，再进行比较。四个目标文件分别包含 86、56、84 和 11 条指令，总计 237 条，解码器全部匹配。

## 递归下降

同一篇论文第 3.2 节将第二种方法称为递归遍历。从已知入口开始，解码直到遇到控制转移。对于直接跳转，从目标继续；对于条件分支，从目标和下一条指令两处继续；对于调用，从其后继续，因为被调用者会返回；对于返回，则停止。维护已访问地址集合，确保遍历能够终止。

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

这种方法的失败模式恰好相反。间接跳转的字节里没有目标，遍历会在这里停止，所有只能经该跳转到达的块都仍然未知。论文图 2 展示了第二种风险：从重定位推导的目标集合指向某条指令的中间。`main.py` 中的递归下降会将此情况记录为冲突并停止该路径，让重叠显现出来，而不是静默地解码两次。

Andriesse 等人用 981 个编译器生成的二进制文件评测了九个反汇编器（USENIX Security 2016）。真实编译器输出中的内嵌数据和重叠代码，比文献假设的更少见，而困难的基础任务是恢复函数边界。请记住这两个结论：下一节的陷阱在编译器输出中很少见，而 `grade` 中的间接跳转很常见。

## 一个线性扫描错误、递归下降正确的样例

`code/fixtures/sweep-trap.s` 是 24 字节的手写汇编，函数体内包含一张四字节的表。函数用 `movzbl (%rcx,%rax), %eax` 索引该表，再跳过它。

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

使用 `clang -target x86_64-unknown-linux-gnu -c sweep-trap.s` 构建它。四个表字节经过特意挑选，可以解码成看似合理的指令。`31 c0` 是 `xorl %eax, %eax`，`90` 是 `nop`。`48` 是 REX 前缀，因此线性扫描将其与真正的 `addl $1, %eax` 的三个字节合并，打印为 `addq $0x1, %rax`。捕获的 `llvm-objdump` 输出正是如此：

```text
       e: eb 04                        	jmp	0x14 <lookup+0x14>
      10: 31 c0                        	xorl	%eax, %eax
      12: 90                           	nop
      13: 48 83 c0 01                  	addq	$0x1, %rax
      17: c3                           	retq
```

这份清单看不出任何损坏：每个字节都被解码，每个助记符都真实存在，而且还有 `retq`。但清单仍有三处错误。`0xe` 处跳转的目标是 `0x14`，清单中却没有任何指令从 `0x14` 开始。真正从 `0x14` 执行的是 32 位 `addl`，清单却在前一个字节显示了 64 位 `addq`。四个表字节也被显示成了代码。

从 `lookup` 符号开始的递归下降解码出六条指令，沿跳转到达 `0x14`，报告 `addl $0x1, %eax`。它没有将四个表字节或 `plus_one` 前面的八个填充字节中的任何一个认定为指令。`main.py` 中的 `trap_report()` 打印比较结果：

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

测试 `test_sweep_and_objdump_share_the_same_mistake` 断言，`llvm-objdump` 在 `0x13` 打印了 `addq $0x1, %rax`。参考判定器是线性扫描，也继承了它的盲点。与参考判定器一致，只能检验解码器；递归下降才检验哪些指令会执行。

## 基本块

Allen 在《Control Flow Analysis》（1970）中定义了基本块：一段只能从首条指令进入、从最后一条指令离开的指令序列。Yakdan 等人在《No More Gotos》（NDSS 2015）第 II.A.2 节针对反编译重述了该定义，并将头节点设为函数入口。

构建过程对按地址排序的已解码指令执行两遍扫描。第一遍收集首指令（leader）：入口、分支或跳转目标、表目标，以及任何控制转移后的指令。第二遍在每个首指令以及地址序列的每个空隙处开始一个新块。

```python
for instruction in self.instructions:
    if instruction.address in leaders or current is None or current.end != instruction.address:
        current = Block(instruction.address, [])
        self.blocks[instruction.address] = current
    current.instructions.append(instruction)
```

边由每个块的最后一条指令决定。返回没有后继；跳转有一个，标记为 `jump`；条件分支有两个，分别标记为 `taken` 和 `fallthrough`。块末尾的普通指令顺序落入下一个块，这发生在下一条指令是分支目标时。间接跳转的后继是其表中的目标，标记为 `table`；若没有目标，则将该块记入 `unresolved`。

同一次扫描还产生另外两个事实。入口无法到达的块是不可达块，`-O0` 下对 `grade` 的扫描会产生五个。若某块的起始地址落在另一种方法清单的某条指令内部，就是陷阱样例中的重叠情况。

## total 的控制流图

`-O1` 下的 `total` 有 31 字节、13 条指令：

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

首指令分别是 `0x40`（入口）、`0x44`（`jle` 之后）、`0x50`（`jne` 的目标）、`0x5b`（`jne` 之后）和 `0x5c`（`jle` 的目标）。五个块、五条边：

| 起点 | 终点 | 类型 | 原因 |
|---|---|---|---|
| `0x40` | `0x44` | fallthrough | `jle` 未跳转，计数为正 |
| `0x40` | `0x5c` | taken | 计数为零或负数，返回 0 |
| `0x44` | `0x50` | fallthrough | `nopw` 是块内的对齐填充，执行会经过它 |
| `0x50` | `0x50` | taken | `jne 0x50`，即循环 |
| `0x50` | `0x5b` | fallthrough | 循环退出，返回总和 |

`0x4a` 处的六字节 `nopw` 是填充，让 `0x50` 处的循环头位于 16 字节边界。它是可达的，因此属于块 `0x44`。最后一条 `retq` 之后、`0x5f` 处的单字节 `nop` 也是填充，但没有路径能到达它。线性扫描会为它创建第六个块，`unreachable()` 会将其列出。

在 `-O2` 下，同一函数有 140 字节和两个循环。`0x80` 处的 SSE2 循环体通过 `paddd` 每轮累加八个值，标量余项在 `0xc0` 处理。CFG 有两条回边：`0x80 -> 0x80` 和 `0xc0 -> 0xc0`，测试套件检查了这两条边。

## 用迭代算法计算支配节点

如果从入口到块 `b` 的每条路径都经过块 `d`，则称 `d` 支配 `b`。`b` 的直接支配节点，是 `b` 的支配节点中距离 `b` 最近的一个。这一概念经 Allen（1970）可追溯至 Prosser（1959），第 34 课正是依靠这种结构正确放置 `if` 和 `while`。

Cooper、Harvey 和 Kennedy 撰写了《A Simple, Fast Dominance Algorithm》（2001）。他们认为，采用紧凑表示、按逆后序运行的数据流算法，在大约一千个节点以下的图上优于 Lengauer-Tarjan（1979）。论文说其目的“不是提出一种新算法”，而是说明简单算法在实践中也能胜出，并且适合教学。函数 CFG 几乎不会有一千个节点。

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

`number` 保存每个块在逆后序中的位置，入口为 0。`intersect` 用两个指针沿当前支配树向上走，直到相遇。论文采用后序编号和 `<` 进行比较。本代码使用逆后序编号，因此比较符是 `>`。其余部分都遵循论文的伪代码。

对于 `-O1` 下的 `total`，结果是 `idom(0x44) = 0x40`、`idom(0x50) = 0x44`、`idom(0x5b) = 0x50` 和 `idom(0x5c) = 0x40`。边 `0x50 -> 0x50` 是回边，因为目标支配源节点；回边标志着循环（Allen 1970）。`back_edges()` 返回这条边。测试 `test_dominators_on_a_hand_built_diamond_with_a_loop` 在带汇合点的 16 字节序列上运行相同代码，让 `intersect` 处理两个前驱。

## -O0 下 grade 中的跳转表

在 `-O0` 下，clang 将 `grade` 中的 `switch` 编译为位置无关跳转表的惯用形式：

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

将它读作四个事实。`subl $0x4` 后跟 `ja` 是边界检查：大于 4 的索引转到 `0x9a` 的默认分支，因此表有五项。带重定位的 `leaq` 将表地址放入 `%rcx`，上一节已经说明该地址为 `.rodata+0x0`。`movslq` 以 4 为缩放因子加载一个有符号 32 位条目。`addq` 加上表基址，因此每项都是从表到对应 case 块的距离。

目标文件中的每个表字节都是零。目标仅以 `.rela.rodata` 中的重定位形式存在：

```text
RELOCATION RECORDS FOR [.rodata]:
OFFSET           TYPE                     VALUE
0000000000000000 R_X86_64_PC32            .text+0x91
0000000000000004 R_X86_64_PC32            .text+0x8c
0000000000000008 R_X86_64_PC32            .text+0x87
000000000000000c R_X86_64_PC32            .text+0x82
0000000000000010 R_X86_64_PC32            .text+0x86
```

对偏移 `4k` 的第 `k` 项应用 `S + A - P`。存储值为 `.text + A - (.rodata + 4k)`，代码再加上 `.rodata + 0`，所以目标是 `.text + A - 4k`。第 0 项是 `0x91 - 0 = 0x91`，第 1 项是 `0x8c - 4 = 0x88`，第 2 项是 `0x87 - 8 = 0x7f`。第 3、4 项分别是 `0x82 - 12 = 0x76` 和 `0x86 - 16 = 0x76`。`score / 10` 的 case 6、7、8、9、10 分别到达存储 1、2、3、4、4 的块。这与 C 源码逐行对应，包括 9 和 10 共享的 case。

`recover_table()` 执行这些计算。`jump_table_resolver()` 从 `jmpq` 向后匹配惯用形式，找到生成该寄存器值的 `addq`、加载它的 `movslq`、生成基址的 `leaq`，以及执行边界检查的 `ja`。递归下降随后将四个不同目标加入待处理集合并继续。已链接可执行文件的表中包含最终值，没有重定位；此时同一个函数读取有符号 32 位条目并加上表地址，`evidence` 记录生成目标所用的路径。

以下是 `-O0` 下 `grade` 的数据，来自 `python3 code/main.py cfg code/fixtures/ledger-x86_64-O0.o grade`：

| 方法 | 指令数 | 块数 | 边数 | 字节 | 问题 |
|---|---|---|---|---|---|
| 线性扫描 | 34 | 9 | 7 | 118 代码 + 10 填充 | 5 个不可达块，没有进入四个 case 块的边，填充被解码为 `nopw` |
| 递归下降 | 25 | 3 | 2 | 82 代码 | 36 个代码字节从未到达，`0x74` 处的 `jmpq *%rax` 未解析 |
| 带表的递归下降 | 33 | 8 | 11 | 118 代码 | 无 |

恢复表后，支配树完整了。每个 case 块的 `idom` 是包含跳转的块 `0x62`。`0xa1` 的 `idom` 是入口 `0x30`，因为来自 `0x9a` 的默认路径无需经过 `0x62` 就能到达 `0xa1`。

## 优化器在 -O1 下对 grade 做了什么

你可能见过这样的描述：`grade` 是一个编译成跳转表的 switch。但字节揭示的情况更具体。在 `-O1` 和 `-O2` 下，`grade` 中根本没有间接跳转：

```text
      2c: 83 f9 04                     	cmpl	$0x4, %ecx
      2f: 77 0c                        	ja	0x3d <grade+0x2d>
      31: 89 c8                        	movl	%ecx, %eax
      33: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		0000000000000036:  R_X86_64_PC32	.rodata+0x10
      3a: 8b 04 81                     	movl	(%rcx,%rax,4), %eax
      3d: c3                           	retq
```

重定位加数 `0x10` 加上通常的 4，得到表地址 `.rodata+0x14`。加载只是普通的 `movl`，该处字节为 `01 00 00 00 02 00 00 00 03 00 00 00 04 00 00 00 04 00 00 00`。编译器用包含五个返回值的表取代了五个 case 块。这里有重定位、有表、也有边界检查，但控制流只有三个块、三条边和一个条件分支。`find_value_tables()` 将其报告为 `value-table`，条目为 `[1, 2, 3, 4, 4]`，并带有 `evidence: "bytes"`。

`-O2` 下的 `grade_label` 更进一步。包含五个字符串指针的 `labels` 数组，变成位于 `.rodata+0x0`、包含五个 32 位偏移的表。每项都带有针对字符串节的 `R_X86_64_PC32` 重定位，函数将表地址加到所加载的条目上。`recover_table()` 读取这五个重定位，返回 `.rodata.str1.1` 中的偏移 `0, 2, 4, 6, 8`，它们分别保存 `F`、`D`、`C`、`B`、`A`。恢复跳转表的同一套计算也能恢复相对数据表，因为二者都是已知偏移处的 `S + A - P`。

这两个构建版本带来的教训是：按字节呈现的实际情况命名。跳转表改变控制流图，值表改变一次加载。把二者都叫作“switch”，会掩盖第 34 课必须重建的区别。

## rea 和 Ghidra 在这里提供什么

rea 6.5.0 配合 Ghidra 12.1.4 provider，将 `procedure_assembly` 中函数的 Listing 文本作为一个字符串返回。`inspect_native_instruction` 返回单条指令的字节、长度、解码文本、操作数 token、带类型引用和控制流，其中返回操作根据 p-code 分类。`xrefs` 返回 Ghidra 的 `ReferenceManager.getReferencesTo` 所提供的排序去重源地址。`analyze_function` 包含函数的 CFG 和 `body`。`procedure_info` 将函数体表示为两端都包含的地址范围，并提醒：“不能将空隙和共享尾部视为函数拥有的字节”。

这些事实都是 Ghidra 的递归下降与分析器结果的序列化形式。rea 分析配置固定了 `instruction_flow_evidence`、`function_references` 和 `jump_table_evidence` 的契约版本。因此结果会标明产生它的规则，但无法展示推导过程。当 Ghidra 找不到表时，控制流是“unknown”，case 块就会从调用者、被调用者和 CFG 中缺失。

现在你已经有了推导过程。在同一个目标文件上运行 `python3 code/main.py cfg`，将块起始地址、边数和恢复的表与 provider 返回的内容对照。一致之处意味着你有两份独立推导；不一致之处则提供了一个可具体检查的地址，这正是第 35 课要记录的未知项。

再从程序安全角度提醒一点：Capstone 6.0.0-Alpha10（2026-07-21）修复了 CVE-2026-55893 和 CVE-2026-55894 涉及的越界读写，5.0.9（2026-05-28）则回移了 CVE 修复。解码器读取的字节并非由自己生成。15 字节限制、`_Cursor.byte()` 的截断检查，以及拒绝猜测未知操作码，都在保护 `main.py`，避免处理超出其设计范围的输入。

## 动手构建

运行演示：

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/main.py
```

输出是一份 JSON 报告。它对每个样例目标文件给出与参考判定器的一致性；对每个函数给出三种方法下的指令数、块数和边数。它还列出不可达块、未解析间接跳转、回边、直接支配节点以及所有表，最后给出陷阱样例的比较。

预期结构：

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

按以下顺序阅读 `code/main.py`：

1. `ElfObject` 读取节头、符号和 `.rela.*` 条目，`symbolize()` 按 `llvm-objdump` 的方式为地址命名。
2. `Decoder.decode()` 读取前缀和 REX，然后根据单字节或双字节操作码映射分派。
3. `_State.modrm()` 读取 ModRM、SIB 和位移，并记录位移字段的偏移。
4. `resolve_reference()` 对位移或立即数字段上的重定位应用 `S + A - P`。
5. `linear_sweep()` 和 `recursive_descent()` 是两种方法，各自记录失败情况。
6. `recover_table()` 和 `jump_table_resolver()` 通过重定位或字节读取表。
7. `ControlFlowGraph` 构建首指令、块和带类型边，`dominators()` 实现迭代算法。
8. `analyze_function()` 对一个函数运行所有方法，`compare_with_oracle()` 检查解码器。

还有两个命令。`python3 code/main.py disasm FILE.o` 打印清单，并在带重定位目标的每条指令后显示该目标。`python3 code/main.py cfg FILE.o FUNCTION` 打印单个函数的分析。

## 实际使用

对新的目标文件，按此顺序使用三种方法。

1. 先运行参考对照。解码器若在普通指令上与 `llvm-objdump` 不一致，就有 bug，后续所有结构都会继承它。
2. 从每个函数符号开始运行递归下降，并阅读 `unresolved`。每项都是你尚未掌握目标的间接跳转或调用。
3. 对每个未解析跳转，寻找表的惯用形式以及指向表的重定位。若不匹配，读取跳转前的字节并记录观察。这条记录就是第 35 课中的第一个未知项。
4. 逐字节比较线性扫描与递归下降。只有扫描认定为指令的字节是填充或数据；两者都未认定的字节是不可达代码，或属于你尚未找到的函数。
5. 用恢复表后的递归下降结果构建 CFG，并查看回边。每条回边都是一个循环，第 34 课将把它转成 `while` 或 `for`。

将参考文本文件与目标文件保存在一起。迁移到新编译器版本时，重新捕获它们，因为清单变化意味着样例也变了。

## 交互实验

### 实验 A：先在纸上解码，再检查

在 `code` 目录中打开 Python：

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow/code
python3 -q
```

运行：

```python
from main import *
decode(bytes.fromhex("48 8d 0d 00 00 00 00"), 0).text
decode(bytes.fromhex("8d 44 08 fa"), 0).text
decode(bytes.fromhex("66 66 66 66 66 2e 0f 1f 84 00 00 00 00 00"), 0).length
```

每次调用前先写下预期结果。然后删除第一项中的 `48`，观察操作数大小变化。再尝试 `decode(bytes.fromhex("0f 0a"), 0)`，阅读 `DecodeError`。

### 实验 B：lea 上的重定位

```python
elf = load_fixture("ledger-x86_64-O0.o")
code = elf.section(".text").data
lea = decode(code, 0x66)
lea.displacement_offset
resolve_reference(elf, lea)
```

引用结果是 `.rodata+0x0`。将地址改成 `grade_label` 中的 `0x116`，读取指向 `.data` 的引用。然后解码 `0x10e` 处的 `callq` 并解析它。立即数字段带有 `R_X86_64_PLT32 grade-0x4`，解析后的目标为 `0x30`，也就是 `grade`。

### 实验 C：观察两种方法的分歧

```python
trap = load_fixture("sweep-trap.o")
text = trap.section(".text").data
[i.text for i in linear_sweep(text, 0, 0x20).instructions]
[i.text for i in recursive_descent(text, [0], 0x20).sorted_instructions()]
```

统计每个列表中的指令数，找到从 `0x13` 开始的那条。然后将 `sweep-trap.s` 中表的最后一个字节从 `0x48` 改为 `0xe8`，重新构建，再次运行两种方法。此时线性扫描会把 `addl` 和 `retq` 吞进一条目标位于节外的 `callq`，函数看起来就没有返回了。

### 实验 D：手算支配节点

```python
analysis = analyze_function(load_fixture("ledger-x86_64-O1.o"), "total")
analysis.cfg.edges
analysis.cfg.reverse_postorder()
analysis.cfg.dominators()
analysis.cfg.back_edges()
```

在纸上画出五个块，先计算支配节点再看结果。然后对 `-O0` 下的 `grade` 运行相同四行代码，解释为什么 `idom(0xa1)` 是 `0x30` 而不是 `0x62`。

## 实践实验

向样例添加一个间接调用点，并扩展分析。

要求：

- 编写一个 C 函数，通过从小数组中选取的函数指针调用函数。分别用 `-O0` 和 `-O1` 构建，将目标文件及其 `llvm-objdump` 文本一起提交。
- 让解码器在两个目标文件上都与参考结果一致。仅当样例中的指令需要时才添加操作码。
- 扩展 `recursive_descent()`，让间接调用将调用点记录到 `calls`，目标设为 `None`，随后继续执行。
- 编写解析器，通过重定位读取函数指针数组并报告可能的被调用者。
- 将被调用者集合以 `indirectCalls` 添加到函数报告，并为每个目标给出证据类型。
- 编写测试，使解析器返回非函数符号的目标时测试失败。

成功标准是：`python3 code/main.py cfg` 能列出每个可能的被调用者及证明它的重定位，而且所有目标文件仍通过参考对照。

## 本课产物

本课包含 `outputs/skill-disassembly-and-control-flow.md`。用它将目标文件和函数名转换为经过检查的清单、基本块、带类型边、支配节点，以及所有未解析的控制转移。它要求提供参考对照、两种反汇编方法、字节核算、每张恢复表的重定位证据，以及仍然未知的内容说明。

## 验证

运行演示和确定性测试套件：

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/main.py
python3 code/tests/test_main.py
```

验证应证明：

- 解码器在四个样例目标文件的全部 237 条指令上与 `llvm-objdump -d` 一致
- REX.W 选择 64 位操作数，REX.R 和 REX.B 扩展寄存器字段
- ModRM 和 SIB 正确呈现 AT&T 内存操作数，包括缩放因子、索引和有符号位移
- RIP 相对位移会连同其在指令内的字段偏移一起记录
- 重复的传统前缀和段覆盖的解码结果与参考结果一致
- 强制 `66` 前缀选择 SSE 操作码，并让寄存器保持 32 位
- 8 位立即数用于算术时进行符号扩展，用于移位计数时为无符号数
- 超过 15 字节的指令、被截断的指令和未知操作码都会抛出 `DecodeError`
- `lea` 上的 `R_X86_64_PC32` 解析为表，`call` 上的 `R_X86_64_PLT32` 解析为被调用者
- 线性扫描将陷阱中的表解码为代码，且跳转目标处没有指令
- 递归下降从不将表或填充认定为指令，并在目标处读取 `addl $0x1, %eax`
- `llvm-objdump` 在陷阱上犯了与线性扫描相同的错误
- 指令内部的入口会被记录为冲突
- 未解析的间接跳转会停止递归下降，并被列出
- `-O1` 下的 `total` 有五个块、五条带类型边、一条回边，以及预期的直接支配节点
- 手工构造的带循环菱形图产生算法定义的支配节点
- `-O2` 下的 `total` 有两个循环
- `-O0` 下的 `grade` 从 `.rela.rodata` 恢复出五项跳转表，目标为 `0x91, 0x88, 0x7f, 0x76, 0x76`
- 不恢复表时，`-O0` 下的 `grade` 有三个块和一个未解析跳转
- `-O1` 和 `-O2` 下的 `grade` 是值表 `[1, 2, 3, 4, 4]`，没有间接跳转
- `-O2` 下的 `grade_label` 通过五个重定位读取相对字符串表
- 交互图嵌入的数据与分析产生的数据相同

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

以参考判定器核对解码，从已知入口遍历控制流，将每个字节核算为已认定代码、填充、数据或不可达内容。从可明确指出的重定位或表中恢复每个间接目标。其余内容带上地址，记录为未知。

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
- 本课描述的 rea 6.5.0 源码位于标签 `3b79af2`：`README.md`、`docs/ghidra-provider.md`、`docs/ghidra-dos.md`、`docs/reverse-engineering-tools.md`、`bridge/ghidra/ReaGhidraBridge.java`、`src/contracts/officialToolContracts.ts`、`src/ghidra/GhidraAnalysisProfile.ts`。
