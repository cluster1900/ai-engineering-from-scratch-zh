# 动态分析自己的程序:调试器、跟踪与静态结论的验证

> 断点命中只是对某个构建的运行观察. 本课程构建测试驱动器,将这些观察转换为针对静态分析课程的结论.

**Type:** Build
**Languages:** Python, C, arm64 assembly, lldb command language
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、Phase 13 · 35（证据、置信度和未知项）
**Time:** ~130 分钟

## 学习目标

- 解释调试器在Linux上需要哪些操作系统支持(`ptrace`),在macOS上需要哪些支持 (Mach 任务端口和异常端口),以及沙箱中的 shell 为什么无法启动调试进程.
- 按名称和清单地址设置软件断点,设置硬件观察点,并理解处理器对两者施加的限制.
- 从Python以批量处理模式驱动lldb,使用停止子在每次停止时记录寄存器,内存和变量,并将会话记录解析回时间线.
- 对照该时间线检查第32、33、34、41 课的静态结论:参数寄存器、结构体字段偏移、条件分支实际走过边,以及发生调调――
- 对于`-O2`构建运行同一个计划,解读已解析但从未预期的断点,并说明这能证明什么,不能证明什么.
- 保存和加载核心文件,并指出式核心遗漏了什么.
- 对照 gdb 和 lldb 命令集,将 `strace`,我知道.`ltrace`,我知道.`bpftrace`,我知道.`dtrace`和 `rr`放到正确的操作系统,并说明版本和许可证.
- 解释macOS的哪些代码签名条件允许lldb调试自构建的二进制,以及它会拒绝的两种情况.

## 问题

第41课从DWARF 读取`struct account`指出`balance`位于偏移 4──第 33 课构建 `classify`控制流图,指出余额为负时,第一个分支进入`return -1`块──第 32 课标指出前两个参数通过 `x0`和 `x1`传入──每句都从字节推导而来,没有一句来自实际观察──

随后,一个代理 阅读同一个程序并报告:`bump`,我知道.`classify`和 `sum_balances`符号表列出了这三个函数,所以这句话看起来可靠.`-O2`构建程序,为每个函数设置断点并运行. 进程打印四行后退出,所有断点都报告.`hit count = 0`,我知道.

编译器内联了所有三个调用,并将`sum_balances(rows, 3)`折叠为常量315――要知道机器上这个二进制的实际情况,就必须在调试器下运行并观察――

本课构建执行观察的驱动器.`account.c`根据停止时显示的信息评判每个静态结论,判定有三种结果:`confirmed`表示停止证明该运行的结论是成立的;`refuted`表示某次停止证明它不成立;`not-observed`表明没有停止能检查它,记录中会说明原因. 第35课`controlled-replay`的`observed`记录.

```figure
re-42-run-timeline
```

## 调试器是三项系统服务加一张表

调试器会对其无代码的进程做四件事:停止进程,读写寄存器,读写内存,以及获知进程再次停止.内核为每一个操作提供服务,不同操作系统的服务.

Linux 上的服务是`ptrace(2)`手册说明,它提供了一种方式,使一个进程 (跟踪者) 能够观察并控制另一个进程的执行.`PTRACE_TRACEME`让子进程声明其父亲进程将跟踪它;`PTRACE_ATTACH`加入无亲关系进程;`PTRACE_PEEKDATA`读取被跟踪进程内存中地址处的一个字母;`PTRACE_GETREGS`读取寄存器;`PTRACE_SINGLESTEP`执行一条指令.`/proc/sys/kernel/yama/ptrace_scope`默认值 1 表示目标进程必须是调用者的后代进程,2表示只有管理员可附加,3表示任何人都不能

 macOS 的`ptrace`接口较小.`PT_TRACE_ME`,我知道.`PT_ATTACHEXC`,我知道.`PT_STEP`,我知道.`PT_CONTINUE`和 `PT_KILL`并说明使用`PT_ATTACHEXC`时,子进程的信号以马赫的异常形式传给父进程.内存和寄存器根本不经过.`ptrace`◎ ◎ ◎ ◎`debugserver`调用`task_for_pid()`获取进程的Mach任务端口,然后调用`task_set_exception_ports()`让一个断点以异常信息形式到达.`taskgated`决定谁可以调用`task_for_pid`,我知道.

本课程保留的一份会议记录显示了这种设计的价格.会议的子在沙箱下运行.

```text
(lldb) run
error: process exited with status -1 (attach failed ((os/kern) invalid address))
```

进程已经创建,但无法被调试器接管. 错误涉及调试器权限,无法说明程序本身有任何问题. 驱动器将记录它为启动失败,停止次数为零,没有确定.

那张表就是断点表――调试器记住自己在哪个地址替换了哪个命令字节,以便继续执行时恢复原始内容,并按位置累计命中次数――`breakpoint list`打印这张表,驱动器将在每次运行结束时读取.

## 断点:替换一个字节或一个字

软件断点是处理器会陷入异常指令,它覆盖目标停止指令的起始节节.`INT3`操作码`CC`长度为一个字节,Intel 手册描述其用途为调用调试异常处理程序──arm64 使用 `BRK #imm16`首选返回地址就是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选返回地址是 首选`BRK`命令本身,因此停止报告是被替换命令的地址,而不是下一条地址.

按名称设置,它会跳过序言:

```text
(lldb) breakpoint set -n bump
Breakpoint 1: where = account-O0`bump + 12 at account.c:13:19, address = 0x00000001000004bc
```

`bump + 12`是第四条指令.`sub sp, sp, #0x10`,我知道.`str x0, [sp, #0x8]`和 `str w1, [sp, #0x4]`建立代码──停止时,`x0`和 `x1`仍然保存参数,因为序言只是复制它们.

按地址设置,lldb 需要知道地址属于哪个模块.`breakpoint set -a 0x100000504`没有应对节点的加载地址; 在第一次测试中,它一直是`unresolved`且`hit count = 0`△驱动器使用的形式会指明模块:

```text
(lldb) breakpoint set -a 0x100000504 -s account-O0
Breakpoint 4: address = 0x0000000100000504
```

使用 `-s`后,该数值表示 `account-O0`内部文件地址,lldb 加上加载偏移,运行后该位置显示 `resolved, hit count = 2`△第33课程清单给出文件地址,因此这种形式将静态清单连接到动态停止──

### 工业解码分支

`-O0`下一个`classify`首先,我们必须要做一个.`0x1000004f0`处的字`36f800a8`没有任何`llvm-objdump`打印的`tbz w8, #0x1f, 0x100000504`根据A64的手臂`TBZ`编码解码它.

1. 位31 是位编号的高位 `b5`值为 0:
2. 位 30 至 25 为`011011`位 24 为 0,选择 `TBZ`而不是`TBNZ`,我知道.
3. 位23至19是位编号的低五位`b40`其他:`11111`结合 结合 结合`b5`= 0,被测试的是位 31,即32位值的符号位.
4. 位 18 至 5 是`imm14`其他:`00000000000101`移动分支为`imm14 * 4`子`0x14`为了实现这一目标`0x1000004f0 + 0x14 = 0x100000504`,我知道.
5. 位 4 至 0 是`Rt`其他:`01000`寄存器是`w8`,我知道.

`w8`在前一条命令中由`ldr w8, [x8, #0x4]`转移四处的`a->balance`,我知道.`TBZ`在该位为零时跳转,因此符号位为零,即`balance >= 0`时走跳转边.`if (a->balance < 0) return -1;`现在,我们在上跳转.`return -1`块,`0x1000004f4`处的顺序落下边进入该块.因此,驱动器携带的静态结论是带谓词的边缘结论:`a->balance >= 0`时跳转,否则顺序落下――第二分支的提升方式相同――`subs w8, w8, #0xc8`计算`balance - 200`结果至多为零,即`balance <= 200`时,`b.le 0x100000524`跳转.

## 观察点依赖硬件,数量有限

观察点在某个地址内存被访问时停止进程. 它不能通过替换指令实现,因为任意位置的任意指令都可能进行访问. 因此,处理器提供少量地址比较器. x86-64 使用调试寄存器:`DR0`至 `DR3`保存最多4个断点的地址,`DR7`启用各种并设置条件(执行、写或读写) 和长度(1、2、4或8 字节) ・arm64 使用寄存器对:`DBGWVR<n>_EL1`保存用于观察点匹配的数据虚拟地址,`DBGWCR<n>_EL1`保存控制信息;手册说明 一个实现可以包含2至64个观察点──

国际贸易组织将报告获得的数量:

```text
(lldb) watchpoint set variable a->balance
Watchpoint created: Watchpoint 1: addr = 0x16fdfe00c size = 4 state = enabled type = m
(lldb) watchpoint list
Number of supported hardware watchpoints: 4
```

这台机器上有四个.`0x16fdfe00c`是 `x0 + 4`在`bump`停止处的结构指标,加上 DWARF 给出的`balance`偏移.`size = 4`应对`int`没有任何`type = m`表示修改.当槽位耗尽时,lldb 拒绝下一个观察点;而未对齐或大小的二区域可能占有两个槽位,因此可设置的观察点数可能少于四个.

数据观察点在访问后报告.Intel 手册说明,写内存的指令会先覆盖原数据,然后产生数据断点引发调试异常;lldb将旧值保留在自己的缓存中,以便同时打印新的旧值:

```text
Watchpoint 1 hit:
old value: 250
new value: 255
* thread #1, queue = 'com.apple.main-thread', stop reason = watchpoint 1
    frame #0: 0x00000001000004d0 account-O0`bump(a=0x000000016fdfe008, by=5) at account.c:14:12
```

停止地址为`0x1000004d0`其他`0x1000004cc`处的`str w8, [x9, #0x4]`后的命令.解析输出.前需要了解一个特点:刚执行.`watchpoint set`后,我会打印`Watchpoint 1 hit:`旧值为空,`new value: 250`这只是初始读取,驱动器会忽略没有旧价值的命运.

## 单步,停止子和批量处理模式

命令语法为`<noun> <verb> [-options] [arguments]`单步命令包括`thread step-in`(`s`) `thread step-over`(`n`) `thread step-inst`(`si`) `thread step-inst-over`(`ni`) 和 `thread step-out`(`finish``thread until 12`运行到某行,`thread return <expr>`携带一个值提前返回. 本驱动器不执行单步,而在计划地址停止,让停止子读取数据:

```text
target stop-hook add -o "register read x0 x1 pc" -o "memory read -s4 -fx -c24 $x0" -o "frame variable -P 1"
```

`-o`可以重复,命令会按顺序执行在每次停止时.`register read`指定两个参数寄存器和程序计数器.`memory read -s4 -fx -c24 $x0`从`x0`中的地址起,以十六进制打印24个四字节字,共96字节,即三行`struct account`,我知道.`frame variable -P 1`印制参数和局部变量,并将指针展开一层,因此`a`会显示其五个字段.

批量处理模式是`lldb -b`△手册说明,`--batch`运行`-s`,我知道.`-S`,我知道.`-o`,我知道.`-O`提供命令后退出;如果命令因信号或崩而停止,调试器将返回交互提示符.`-s`传入. 一个重要设置是.`settings set interpreter.stop-command-source-on-error false`没有它,后的过程退出第一.`continue`终止了整个命令文件,`breakpoint list`永远不会运行. 有了它,我会打印.`error: Process must be launched.`后仍会继续.

输出形式的两个事实决定了解分析器的工作方式.`frame #0`行的`Process N stopped`因此,解析器先将寄存器,内存和变量行收集到待处理块,然后将其添加到下一个遇到的块.`frame #0`行──若块中的程序计数器位于`dyld`的`_dyld_start`程序执行前的入口停止,没有任何.`frame #0`接收它.`--auto-continue`动机的初版使用自动继续,结果都没有记录.`continue`命令.

## 计划来自清单

`Plan.commands()`根据即将运行的二进制`llvm-objdump -d`文本构建命令文件──对 `account-O0`其他:

```text
breakpoint set -n bump
breakpoint set -n classify
breakpoint set -n sum_balances
breakpoint set -a 0x100000504 -s account-O0
breakpoint set -a 0x1000004f4 -s account-O0
breakpoint set -a 0x100000524 -s account-O0
breakpoint set -a 0x100000514 -s account-O0
target stop-hook add -o "register read x0 x1 pc" -o "memory read -s4 -fx -c24 $x0" -o "frame variable -P 1"
run
watchpoint set variable a->balance
watchpoint list
continue
...
breakpoint list
watchpoint list -v
```

三个名称断点对应函数入口 四个地址断点对应`Listing.conditional_branches()`在`classify`标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签`0x1000004f0`处的`tbz`和 `0x100000510`处的`b.le`观察点在第一次停止时设置,计划预期该停止在`bump`后来有十六个.`continue`命令,超过任何一次运行所需的数量, 余额命令在退出后无害失败.

`claims_for()`用相同的输入构建结论:

| Id | 类别 | 结论 | 来源 |
|---|---|---|---|
| `arg-registers` | argument-register | 每次进入函数时，前几个参数通过 `x0` 和 `x1` 传入 | 第 32 课和 AAPCS64 |
| `field-offsets` | field-offset | `struct account` 为 32 字节，`kind` 在 0，`balance` 在 4，`code` 在 8，`rate` 在 16，`label` 在 24 | 第 41 课和 DWARF 转储 |
| `branch-1` | branch-taken | 当 `a->balance >= 0` 时，`0x1000004f0` 处的 `tbz` 跳到 `0x100000504`，否则到 `0x1000004f4` | 第 33 课的边和第 34 课的提升 |
| `branch-2` | branch-taken | 当 `a->balance <= 200` 时，`0x100000510` 处的 `b.le` 跳到 `0x100000524`，否则到 `0x100000514` | 第 33 课的边和第 34 课的提升 |
| `calls` | call-edge | `main` 调用 `bump` 一次、`classify` 三次、`sum_balances` 一次 | 源码文本和 `nm` |
| `store-once` | store | `bump` 写入 `a->balance` 一次，新值等于旧值加 `by` | 第 34 课伪代码 |
| `stride` | struct-stride | `list[i].balance` 位于 `list + 32*i + 4` | 第 41 课和 psABI 聚合类型规则 |
| `output` | behaviour | 程序打印 `class 0 1 -1` 和 `sum 315` | 源码算术 |

字段偏移来自`struct_layout()`它们从DSYM 转储读取带有`DW_AT_byte_size (0x20)`的`DW_TAG_structure_type`五个`DW_TAG_member`条目的`DW_AT_data_member_location`△计划从不硬编码数字 4,而是读取它.

## 运行:十一次停止

第一次停止是`bump`断点──子在停止块之前打印了以下内容:

```text
      x0 = 0x000000016fdfe008
      x1 = 0x0000000000000005
      pc = 0x00000001000004bc  account-O0`bump + 12 at account.c:13:19
0x16fdfe008: 0x00000073 0x000000fa 0x00000009 0x00000000
0x16fdfe018: 0x00000000 0x3ff40000 0x00000719 0x00000001
0x16fdfe028: 0x0000006c 0xffffffd8 0x00000003 0x00000000
0x16fdfe038: 0x00000000 0x40000000 0x00000721 0x00000001
(account *) a = 0x000000016fdfe008 {
  kind = 's'
  balance = 250
  code = 9
  rate = 1.25
  label = 0x0000000100000719 "savings"
}
(int) by = 5
```

对照 DWARF 偏移读取第一行八个字.偏移 0 的字 0 为`0x73`其他`'s'`现在,我还在`kind`字节,后面是三个填充字节.`0xfa`子,子,子,子`balance`偏移 8 的字 2 为`0x9`其他`code`低半部是`short`高半部有两个字符.偏移12字符.`double`前的填充──偏移 16 的字母 4 和 5 为 `0x3ff4000000000000`转移 24 的字符 6 和 7 为`0x100000719`指向`__TEXT`的`label`针,然后八个字母以`0x6c``'l'`和 `0xffffffd8`字节后的第三行.`loan`△每一个数值都与`frame variable`一致,因此`_check_layout()`在这个停顿中`field-offsets`记录为`confirmed`并且`x0`保存结构体指针的全部十一次停止中重复确认.

`x0`等于`a`没有任何`x1`等于`by`现在,我们已经进入了这个城市.`arg-registers`△驱动器只比较声明参数.`classify`停止处,`x1`仍为`0x5`这就是`bump`遗留的值;而`classify`只有一个参数,因此不用比较. 没有载载参数的寄存器只是噪音,第32课的结论不涉及它.

第二次停止是观察点,旧值250,新值255,`by`整个运行只发生一次,因此`store-once`得到确认.`classify`执行三次,每次有一个进口停止和一个到两个边停止:

| 停止 | 地址 | 停止原因 | 检验内容 |
|---|---|---|---|
| 2 | `0x1000004e8` | breakpoint 2.1 | 入口，`a->balance` = 100，`x0` = `a` |
| 3 | `0x100000504` | breakpoint 4.1 | `tbz` 跳转，100 >= 0，确认 `branch-1` |
| 4 | `0x100000524` | breakpoint 6.1 | `b.le` 跳转，100 <= 200，确认 `branch-2` |
| 5 | `0x1000004e8` | breakpoint 2.1 | 入口，`a->balance` = 255 |
| 6 | `0x100000504` | breakpoint 4.1 | `tbz` 跳转，255 >= 0 |
| 7 | `0x100000514` | breakpoint 7.1 | `b.le` 顺序落下，255 > 200 |
| 8 | `0x1000004e8` | breakpoint 2.1 | 入口，`a->balance` = -40 |
| 9 | `0x1000004f4` | breakpoint 5.1 | `tbz` 顺序落下，-40 < 0 |
| 10 | `0x100000544` | breakpoint 3.1 | `sum_balances` 入口，`x1` = 3 |

`_check_branches()`将停止按函数执行实例分组,读取入口处的余额,并对每个边停止计算升级后的预测词的后继――五边停止全部一致:`branch-1`确认三次,`branch-2`确认两次――停止 5 显示余额为255,正是观察点看到写入的值――这是同一程序的运行,证据相互连接――

在停止10个小时`list`读取24个字符.`_check_stride()`取字 1、字 9 和字 17,即偏移 4、36、68:100、255 和 -40──它将每个值与 `classify`其他其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型的产品, 其他类型, 类型的产品, 类型, 类型, 类型, 类型, 类型, 类型, 类型, 类型, 类型, 类型, 类型, 类型, 类型, 类型, 类型, 类型, 类型, 类型, 类型, 类型,类型,类,类型,类型,类型,类型,类型,类,类型,类型,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类,类`sum 315`行比较──随后进程以0状态退出,`breakpoint list`显示名称断点的命中次数为1、3、1,四边断点为2、1、1、1──全部八个结论最终均为`confirmed`后面有25条记录,其中23条关联停止,两条关联完整运行.

## 运行:零次停止

同一个源码在`-O2`下是不同的程序.`main`的`llvm-objdump -d`输出只有四条`bl`全部调用`printf`◎原有调用被`mov w8, #-0x1`,我知道.`mov w8, #0x1`通过`xzr`提供零,以及价值为315的`mov w8, #0x13b`取代──编译器在编译期计算了所有结果──`nm`仍列出`_bump`,我知道.`_classify`和 `_sum_balances`由于它们是外部函数,必须保留非内联副本用于其他目标文件调用.`DW_TAG_subprogram`条目,但没有任何东西`DW_TAG_inlined_subroutine`条目,所以连调试信息也未记录这次内联.

建设计划有三个分点,没有边缘分点.`-O2`下一个`classify`只有六条命令:`ldr`,我知道.`cmp`,我知道.`cset`,我知道.`cmp`,我知道.`csinv`,我知道.`ret`没有条件分支.`-O0`清单边结论在这个二进制中没有地址,驱动器不会将它们移动到来.

运行结果:

```text
(lldb) breakpoint set -n bump
Breakpoint 1: where = account-O2`bump at account.c:13:16, address = 0x0000000100000460
(lldb) run
sizeof 32 align 8
offsets 0 4 8 16 24
class 0 1 -1
sum 315
Process 48444 exited with status = 0 (0x00000000)
(lldb) watchpoint set variable a->balance
error: Command requires a process which is currently stopped.
(lldb) breakpoint list
1: name = 'bump', locations = 1, resolved = 1, hit count = 0
```

每个分点都被解析了. 址存在,符号存在,lldb也在那里写了.`BRK`△命中次数为零,是因为没有任何指令指向到达该地址.

| 结论 | 判定 | 记录 |
|---|---|---|
| `calls` | 已反驳 | 完整运行以状态 0 退出后，入口停止次数为 bump 0、classify 0、sum_balances 0 |
| `output` | 已确认 | 四行输出及退出状态 0 |
| `arg-registers` | 未观察到 | 没有停止检验它，命中次数全为 0 |
| `field-offsets` | 未观察到 | 没有停止检验它 |
| `store-once` | 未观察到 | 未在 bump 停止，因此从未设置观察点 |
| `stride` | 未观察到 | 未在 sum_balances 停止 |

必须准确说明反驳的含义.`main`在这个程序中调用三个函数. 对这个构建的这次运行,它没有调用;驱动器检查了运行完成,因为退出前命中次数为零只能说明运行尚未达到调用.`balance`放在偏移4`-O2`虽然这次运行没有停止阅读内存来展示它.`not-observed`保持这一区别,第35课会将保持未知项目开放,直到某个运行真正观察到它.

## 核心转储

文件将进程内存和寄存器写到磁盘上,使调试器在程序消失后仍然可以读取其停止状态.`core(5)`解释,少数导致进程异常终止的信号,也将进程内存状态记录写入磁盘,位置为`/cores/core.pid`前提是终止进程具有该目录的写权,并且目录存在──`sysctl`报告`kern.coredump: 1`和 `kern.corefile: /cores/core.%P`没有任何`/cores`存在,模式为`drwxrwxr-t root admin`子的`ulimit -c`为 0 ⋅在使用`ulimit -c unlimited`提高限制,或使用`launchctl limit core unlimited`系统级提高限制之前,内核不会写出核心.

无需崩即可按需写出核心.`bump`断点处:

```text
(lldb) process save-core --style stack account-O0-stack.core
Saving 49152 bytes of data for memory region at 0x16fdf4000

Modified-memory or stack-memory only corefile created.  This corefile may 
not show library/framework/app binaries on a different system, or when 
those binaries have been updated/modified. Copies are not included
in this corefile.  Use --style full to include all process memory.
```

文件为53,248字节.

```text
(lldb) target create "./account-O0" --core "account-O0-stack.core"
(lldb) bt
* thread #1, stop reason = ESR_EC_BRK_AARCH64 (fault address: 0x0)
  * frame #0: 0x00000001000004bc account-O0`bump(a=0x000000016fdfe008, by=5) at account.c:13:19
    frame #1: 0x0000000100000640 account-O0`main at account.c:40:5
    frame #2: 0x000000019a949d54 dyld`start + 7184
(lldb) frame variable *a
(account) *a = (kind = 's', balance = 250, code = 9, rate = 1.25, label = "")
(lldb) frame variable a->label
(const char *) a->label = 0x0000000100000719 ""
```

复古和整数段是完美的,因为它们位于保存的核心上.`label`显示为空字符串,但其指针完整.`0x100000719`是正确的;它指向的字节是可执行文件.`__TEXT`段中的字面量`"savings"`式核心不包含该段. 指针是观察结果,字符串不可使用,lldb不会编制它.`--style full`包含全部进程内存; 在研究机器上,这个34 KB 程序的完整核心 达到2.1 GB,因为进程映射了共享缓存.`ESR_EC_BRK_AARCH64`记得发生了断点`BRK`异常.

基于Linux内核`/proc/sys/kernel/core_pattern`写出核心,这个模板使用`%p`表示PID,`%e`表示命令名,`%s`显示信号`%t`表示时间,前导 `|`系统将通过管道交付程序转储.`systemd-coredump`再使用`coredumpctl list`,我知道.`info`,我知道.`dump`和 `debug`取回保存的数据――`gdb prog core`和 `lldb -c core prog`城市能开启结果.

## 照顾

两个调试器使用不同的命令完成相同的工作.`COMMAND_MAP`有35行,可通过`python3 code/main.py commands`打印──本课使用的如下:

| 任务 | gdb | lldb | lldb 别名 |
|---|---|---|---|
| 在函数处断下 | `break bump` | `breakpoint set -n bump` | `b bump` |
| 在某模块内的地址处断下 | `break *0x1000004f0` | `breakpoint set -a 0x1000004f0 -s account-O0` | |
| 每次停止时运行命令 | `define hook-stop` ... `end` | `target stop-hook add -o '...'` | |
| 列出断点及命中次数 | `info breakpoints` | `breakpoint list` | `br l` |
| 观察变量写入 | `watch a->balance` | `watchpoint set variable a->balance` | `wa s v a->balance` |
| 列出观察点 | `info watchpoints` | `watchpoint list -v` | `wa l -v` |
| 读取一个寄存器 | `p $x0` | `register read x0` | |
| 以字为单位读取内存 | `x/8xw 0x16fdfe008` | `memory read -s4 -fx -c8 0x16fdfe008` | `x -s4 -fx -c8 0x16fdfe008` |
| 显示参数 | `info args` | `frame variable --no-locals` | |
| 单步执行一条指令 | `stepi` | `thread step-inst` | `si` |
| 运行至函数返回 | `finish` | `thread step-out` | `finish` |
| 写入 core 文件 | `gcore core` | `process save-core --style stack core` | |
| 打开 core 文件 | `gdb account-O0 core` | `lldb -c core account-O0` | |

在中,`p`是 `dwim-print`的别名:普通变量通过 `frame variable`路径打印,其他情况回归`expression`,我知道.`v`这就是`frame variable`△驱动器中应优先使用`frame variable`读取DWARF位置,从未被调试过程中执行代码.

下一篇: 版权信息截至2026-10-14──lldb 使用LLVM 版本号,llvm.org 当前发布版为2026-10-06 发布的LLVM 23.1.3,采用附带LLVM 例外的Apache许可证 2.0──Homebrew 通过独立公式`lldb`提供它. 这台机器的命令行工具提供了果自编号的.`lldb-1703.0.236.21`已具备调试签名. GDB 18.1 于2026-09-25 发布,采用GPL-3.0或后版本.`.gdb_index`、AArch64 `FPMR`和Python`gdb.Corefile`截至18月1日,GDB 尚未生生支持果进程:2025年10月发布包含15个补丁的 首次AArch64-Darwin支持系列,2026年2月维护者说明先完成版权转让和BFD补丁的落地路径──`gdb`配方有64个手臂,但在构建时伪装为`--target=x86_64-apple-darwin20`加入这些包装的 PR 明确说明不能通过GDB调试 aarch64-darwin 二进制──macOS 上任何非果调试器也需要自签证和`com.apple.security.cs.debugger`权限,否则`task_for_pid`本课程将用于Linux,Debian稳定在 arm64 上提供gdb 16.3,`rr`也运行在那里.

## 核核程序要求什么?

调试器显示程序停止时的状态,跟踪器则显示程序对系统的影响,而不长时间停止程序――工具按操作系统区分――

| 工具 | 操作系统 | 版本 | 许可证 | 记录内容 |
|---|---|---|---|---|
| `strace` | Linux | 7.2，2026-08-18 | LGPL-2.1-or-later | 系统调用及参数和返回值 |
| `ltrace` | Linux | 最后发布的 tarball 为 0.7.3，Debian 使用 git 快照 | GPL-2.0 | 动态库调用 |
| `bpftrace` | Linux | v0.27.0，2026-09-10 | Apache-2.0 | 通过 eBPF 记录内核和用户态探针 |
| `dtrace` 和 `dtruss` | macOS | macOS 26.2 中为 `Sun D 1.19` | CDDL，源自 Sun OpenSolaris | D 探针；`dtruss` 打印系统调用 |

`dtruss`手册说明:由于使用DTrace,只有具有根权限的用户才能运行该命令.`dtrace(1)`补充:在默认系统完整性保护设置下,不允许D程序访问内核地址值或内核内存内容,且SIP下不允许破坏性操作.本课程没有在这个机器上运行.`sudo dtruss ./account-O0`由于驱动器不使用根,并将此记录为未验证. 追踪答案与驱动器不同:`printf`发出了`write`是跟踪问题;到达`bump`时 时间`x1`保存是不是调试器的问题.

## 记录与重放

`rr`记录一次运行,并将gdb 下确定性重放,支持反向执行:对关心的值设置观察点,`reverse-cont`项目自述为:只需要记录一次失败,然后就能按需要多次确定性调试该记录. 目前发布版为2025-02-13的5.9.0,采用MIT许可并包含BSD-2-条款部分. 它仅支持Linux,需要硬件性能计数器统计分支,因此可运行于Intel Nehalem和更新架构,部分AMD Zen 核心,以及Linux 下某些AArch64微架构,例如ARM Neoverse N1或果 Silicon M系列.

现在,我们还有一个软件记录器.`record full`记录进程执行日志,默认上限为200,000条命令;`record btrace`在macOS机器上,驱动器保存的会话文本就是记录:同一计划作用于同一二进制,会以相同顺序产生相同的停止,样本测试固定了这个顺序.

## 一次运行能证明什么

一次运行只证明一个构建上的一个输入.C 标准将未定义行为定义为:使用不可移植或错误的程序构建或错误数据时,本文件不施加任何要求的行为.`int`溢出程序在`-O0`和 `-O2`下合法地产生不同结果. 第36课在`percent_change`溢出单元中遇到过这种情况――UBSan将问题转换为停止:`-fsanitize=signed-integer-overflow -fsanitize-trap=undefined`                                                                                                                                                                                                                                                              

优化代码还会移动你想观察的内容――GDB 手册说明,优化器重排你的代码,调试器展示现实存在的内容;被优化到不存在的变量是GDB 永远看不到的变量――GDB 将这种值打印为`<optimized out>`源码将与它相结合`<unavailable>`区分:前者实际上不存在程序中,后者存在程序中机层),但GDB无法获取──当程序计数器位于变量 DWARF 位置列表的全部范围之外时,lldb 打印`<variable not available>`寄存器中的局部变量设置内存观察点不会触发,因为寄存器不是内存.`-O2`运行展示了极端情况:整个函数被折叠了,从未设置的观察点保持沉默,无法证明任何事物.

因此,驱动器只写三种记录,绝不写第四种.`confirmed`检验后不一致,为`refuted`没有任何停止能够检查,为`not-observed`原因,决定命中次数也是原因的一部分.`controlled-replay`的`observed`记录,将第三种保留为开放未知的项目.

## 在macOS上只调试自己的构建

在果上,链接器会为你签名.果的.`ld(1)`对于`-adhoc_codesign`解释:果 二进制默认进行临时 签名 对例运行`codesign -dvvv account-O0`打印:

```text
Format=Mach-O thin (arm64)
CodeDirectory v=20400 size=387 flags=0x20002(adhoc,linker-signed) hashes=9+0 location=embedded
Signature=adhoc
TeamIdentifier=not set
```

`0x20002`是 `CS_ADHOC`(`0x2`加`CS_LINKER_SIGNED`(`0x20000`),后者在果代码签名头文件中解释为由链接器自动签名──`codesign -d --entitlements -`在可执行文件名称后不打印任何内容:二进制无权限声明.`DevToolsSecurity -status`报告开发者模式目前已被禁用,在系统完整性保护启动的情况下,lldb 仍启动它,命中全部断点,设置硬件观察点并写出核心

两个权限控制谁可以调试谁,分别位于两侧.`com.apple.security.cs.debugger`属于调试器:一个总值,表示应用是否是调试器,以及能否添加其他进程或获取任务端口.`debugserver`携带其私有形式;对命令线工具中副本运行`codesign -d --entitlements -`会列出`com.apple.private.cs.debugger`,我知道.`com.apple.private.set-exception-port`,我知道.`com.apple.private.thread-set-state`和 `com.apple.private.logging.diagnostic`,我知道.`com.apple.security.get-task-allow`属于目标.Xcode将其注入调试构建,在输出时移除,而公证会拒绝仍然携带其二进制.`get-task-allow`时,任务端口将被拒绝.`clang`建建没有强化运行时,不触发该拒绝条件.`codesign --options runtime`给样例签名,调试前需使用 `codesign -s - -f --entitlements get-task-allow.plist`现在,我还在做什么?

还有三个事实. 第一,在登录会话中第一次调试时,可能看到开发者工具访问需要控制另一个调试过程,以继续对话框.`sudo DevToolsSecurity -enable`可为`admin`或`_developer`组成员免去额外密码――第二,调试自己的代码无需关闭SIP――果说明从Xcode运行和调试应用不需要关闭SIP;涉及调试的SIP组件,仅是`csrutil enable --without debug`为了让别人放宽自己的进程.`task_for_pid`样例`sandbox-O0.lldb.txt`显示结果.无法启动的运行属于环境事实,驱动器也如此报告.

本课程的全部适用于你自己编译的程序.只有当另一个进程的所有者主动允许时,同样的命令才可以添加到它;本课程不教授如何改变这一条件.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program
python3 code/main.py
```

输出是基于已保存的会议记录的JSON报告. 每种构建列表断分点的解析状态和命运次数,硬件观察点数,每次停止的寄存器和参数,退出状态,程序输出,lldb 打印错误,以及结论,判断和后来的证据记录.报告还包含核心保存加载往返,Python API 结果,沙箱失败,以及本机缺少的外部工具.

预期结构:

```json
{
  "program": "account.c",
  "variants": {
    "O0": {
      "binary": "account-O0",
      "breakpoints": {"1": {"spec": "name=bump", "address": "0x1000004bc", "resolved": true, "hits": 1}, "...": "..."},
      "hardwareWatchpoints": 4,
      "watchpoints": {"1": {"address": "0x16fdfe00c", "size": 4, "type": "m", "hits": [[250, 255]], "hitCount": 1}},
      "stops": [{"index": 0, "pc": "0x1000004bc", "function": "bump", "kind": "entry", "registers": {"x0": "0x16fdfe008", "x1": "0x5"}, "...": "..."}],
      "exitStatus": 0,
      "claims": [{"id": "arg-registers", "verdict": "confirmed", "confirmed": 5, "refuted": 0, "not-observed": 0, "...": "..."}],
      "evidence": [{"claim": "arg-registers", "verdict": "confirmed", "stop": 0, "observation": "bump: x0 = 0x16fdfe008 and a = 0x000000016fdfe008, x1 = 0x5 and by = 5"}]
    },
    "O2": {"stops": [], "claims": [{"id": "calls", "verdict": "refuted", "...": "..."}], "...": "..."}
  },
  "core": {"savedAt": {"function": "bump", "pc": "0x1000004bc"}, "labelString": "", "...": "..."},
  "types": {"python": "3.9.6", "size": 32, "...": "..."},
  "sandbox": {"stops": 0, "errors": ["process exited with status -1 (attach failed ((os/kern) invalid address))"]},
  "absentTools": ["bpftrace", "gdb", "llvm-objdump", "ltrace", "rr", "strace"]
}
```

按以下顺序阅读 `code/main.py`其他:

1. `Listing`将`llvm-objdump -d`文本解析为函数和指令,`Function.conditional_branches()`查找分支及目标与顺序落下地址──
2. `struct_layout()`从`llvm-dwarfdump`文本读取结构体和成员条目.
3. `lift_condition()`为了让一个条件分支转换为谓词,这是第34课针对`tbz`,我知道.`cbz`和比较后分支形式的提升步骤.
4. `Plan.commands()`根据清单写出了LDB命令文件,`Plan.lldb_command()`提供批量处理调用.
5. `parse_transcript()`按照输出顺序,构建包含寄存器,内存,变量和观察点值的`Stop`记录,以及断点表和退出状态.
6. `claims_for()`声明八个结论,`evaluate()`使用 `_check_*`函数逐次停止评判它们.
7. `rollup()`记录将归纳为每一个结论一个判断,反驳优先确认.
8. `capture()`和 `capture_extras()`生成例;当 `clang`和 `lldb`运行时,`live()`在新建上重复整个流程.

还有四个命令.`python3 code/main.py plan O0`打印某构建的命令文件;`python3 code/main.py commands`打印gdb 和 lldb对照表;`python3 code/main.py tools`报告`PATH`上有任何外部工具;`python3 code/main.py live O0`将`account.c`编译到临时目录,根据新清单制定计划,运行 lldb,再根据本次运行评判结论.

## 实际使用

按下列顺序将驱动器用于自己的程序.

1. 使用 `-g`和计划交付的优化级别构建――将二进制、dSYM或 DWARF,以及`llvm-objdump -d`文本同保存.
2. 运行前写结论. 每个指标函数,寄存器或地址或偏移,预期值或边,以及其来源课程或文档.
3. 根据清单生成计划并阅读. 每个地址都应追溯到清单的一行.
4. 以批处理模式运行一次,保留会话记录,并在头部记录命令行和调试器版本.
5. 进行判断. 阅读确认结果之前,先读每条.`not-observed`记录及原因――原因会告诉你需要其他输入,其他构建或其他结论.
6. 用相同结论运行优化构建――编译器内联处可能出现已解析但零命中的断点,应保留相应结论的未决状态――
7. 将确认和反驳记录作为`observed`、权威来源`controlled-replay`写入第35课本,每次停止一条记录──未观察的结论仍然作为未知项,附上断点命中次数──

## 交互实验

### 实验A:手工读取一次停止

从`code`目录启动Python:

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program/code
python3 -q
```

运行:

```python
from main import *
t = load_transcript("session-O0.lldb.txt")
s = t.stops[0]
hex(s.pc), s.function, s.reason, s.registers
[hex(w) for w in s.memory[:8]]
s.struct_pointer().fields
```

执行第二行之前,先写下预期哪个字保存 250,哪两个字保存 1.25──然后运行`struct.unpack("<d", struct.pack("<II", s.memory[4], s.memory[5]))`没有比较.`t.stops[1].watch_hit`和 `t.stops[1].pc`在`account-O0.objdump.txt`在找到该地址:它是存储后的指令.

### 实验B:分支与后继

```python
plan = make_plan("O0")
plan.branches()
classify = plan.listing.function("classify")
[lift_condition(classify, b, "a->balance")[0] for b in plan.branches()]
[(hex(s.pc), s.struct_pointer().field_int("balance")) for s in t.stops_in("classify")]
```

预测后者,然后运行.`[e.to_dict() for e in evaluate(plan, t, struct_layout(open("fixtures/account-O0.dwarfdump.txt").read(), "account")) if e.claim.startswith("branch")]`没有比较.

### 实验C:从未停止运行

```python
o2 = load_transcript("session-O2.lldb.txt")
len(o2.stops), o2.exit_status, o2.hits()
o2.errors[:3]
make_plan("O2").branches()
rollup(evaluate(make_plan("O2"), o2, struct_layout(open("fixtures/account-O2.dwarfdump.txt").read(), "account")))
```

用自己的话解释每个人都`not-observed`然后打开`account-O2.objdump.txt`找到`main`中取代调用四个常量――再使用`count_tags()`统计`account-O2.dwarfdump.txt`中中 `DW_TAG_inlined_subroutine`,我知道.

### 实验 D:破坏证据

```python
text = open("fixtures/session-O0.lldb.txt").read().replace("x1 = 0x0000000000000005", "x1 = 0x0000000000000006", 1)
broken = parse_transcript(text)
[e.to_dict() for e in evaluate(plan, broken, struct_layout(open("fixtures/account-O0.dwarfdump.txt").read(), "account")) if e.claim == "arg-registers"][:2]
```

修改一个寄存器,就会让第一条`arg-registers`记录及汇总变为`refuted`剩下的四个入口仍然存在`confirmed` 随后删除观察点停止前的 `old value: 250`行,观察 `store-once`变为`not-observed`,没有任何决定.

如果可以在你的中启动进程,最后运行.`python3 main.py live O0`和 `python3 main.py live O2`地址会与样例不同,判定不应改变

## 实践实验

为驱动器增加关于`sum_balances`循环结论

要求:

- 使用 `conditional_branches()`在`-O0`清单中找到`sum_balances`在循环上增加点.
- 增加结论:当`count`循环头执行`count + 1`接下来,这对应第33课的回边加上退出检查.
- 扩展停止子或计划,使子在每次循环头停止时读取循环计数器的槽,并编写`_check_loop()`记录计数器值序列――
- 在Ildb 能启动进程的机器上,使用`python3 main.py capture O0`重新捕获会话并重跑套件──在提交的命令文件与新计划匹配之前,计划测试会失败,这正是该测试的目的──
- 增加测试,修改会话记录中的一个计数器值,并断言结论变为 `refuted`,我知道.

成功标准是: 报告按顺序显示循环头停止和计数器值,`-O2`运行将新结论保留为 `not-observed`循环量化或折叠消除.

## 本课产物

本课包含`outputs/skill-dynamic-analysis-of-your-own-program.md`△将自行构建的程序,清单和静态结论列表转换为保存的调试器会议记录,以及每个结论的判定,并附带产生判定停止和每个未观察到结论的原因.

## 验证

运行演示和确定性套件:

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

套件无需 lldb 即可运行,它读取一次捕获`code/fixtures/`会议记录――验证应证明:

- 清单解析器找到四个函数及其范围,以及`-O0`下一个`classify`两个条件分支,目标和顺序落地址
- `tbz w8, #0x1f`提升为`a->balance >= 0`没有任何`subs`加  `b.le`提升为`a->balance <= 200`
- `-O0`下一个`main`调用`bump`三次`classify`和 `sum_balances`没有任何`-O2`下一个`main`只是调用`printf`
- 没有什么问题`j<cc>`助记符属于条件分支,`jmp`和 `callq`不属于
- 转储产生大小 32 字节,成员位于 0、4、8、16、24 的结构体
- `-O2`没有任何程序条例.`nm`仍列出三个函数
- 两项构建计划与提交命令文件相等,会话头条记录实际运行的LDB命令
- `-O0`会话在预期函数中10次停止,退出状态为0,包含四行输出
- 子输出附加到其后的停止,其中`x1`子,子,子,子,子,子`x0`开始,并包含标签字符串
- 断点表带解析状态,命中次数为1、3、1、2、1、1、1
- 观察点为`x0 + 4`处的 4 字节修改 类型,命中一次,旧值 250、新值 255,并报告四个硬件槽位
- `-O2`没有停顿,三个已解断点均零命中,没有观察点,每个未使用的`continue`都应应一个错误
- 沙箱启动在任何停止前因附加错误失败
- 核心 保存加载往返 保留回溯和 `balance`没有什么可惜.`label`指向的字符串
- 无需进程即可读取五个字段、大小32 和函数范围
- 手写 x86-64 会话能解析 `rdi`,我知道.`rsi`和 `rip`
- `-O0`根据每项结论均已确认,分别有5、11、3、2、1、1、1条记录
- 分支证据指明价值,条件和边缘
- 字段偏移证据通过 DWARF 布局解码各个字
- 存储和步长证据带有新旧值及三行余额
- `-O2`运行反驳调用边,将其他结论保留为未观察
- 修改寄存器值会被反驳,删除观察点命中会被未观察,汇总时反驳优先
- 命令映射每行均有gdb 和 lldb 形式,硬件表列出四个x86 调试寄存器
- 演示列出缺失工具而不是失败,实时模式按名称报告缺失工具
- 图像数据来自两个会议,站点模块嵌入相同的数据

## 生产环境失效模式

| 失效情况 | 薄弱报告的说法 | 驱动器必须证明什么 |
|---|---|---|
| 已解析断点零命中 | “函数运行了”或“函数是死代码” | 完整运行的退出状态、命中次数，且仅对调用边给出 `refuted` 判定 |
| 在错误停止处读取寄存器 | “`classify` 中 `x1` = 5” | 仅在入口停止比较声明的参数 |
| 不看偏移就读结构体 | 一列十六进制字 | 每个字映射到 `DW_AT_data_member_location`，并与 `frame variable` 比较 |
| 仅凭助记符评判分支 | “`tbz` 表示负数时跳转” | 从编码提升出的谓词，以及后继处的停止 |
| 观察存放在寄存器中的局部变量 | “没有发生写入” | 观察点确实设置在地址上并命中，否则记录应为 `not-observed` |
| 自动继续断点 | 干净但没有停止的会话记录 | 普通断点、停止钩子和继续次数预算 |
| 地址断点未指定模块 | `unresolved, hit count = 0` | 使用 `-s MODULE`，将清单地址解析为加载地址 |
| 第一个命令错误结束批处理 | 结尾没有 `breakpoint list` | `interpreter.stop-command-source-on-error false` |
| 将栈式 core 当作完整内存读取 | 将 `label = ""` 报告为程序值 | core 类型、指针及其指向的段 |
| 沙箱 shell | “lldb 坏了” | 将 `attach failed ((os/kern) invalid address)` 记录为环境事实 |
| 强化目标没有 `get-task-allow` | “macOS 禁止调试” | Apple 规则中的两个条件，以及对自己的二进制重新签名 |
| 判定后丢弃会话记录 | 判定没有来源 | 会话文件、命令行和调试器版本 |

## 操作准则

根据清单规划停止,按批处理模式运行一次,保留会话记录,并每次检查可行的某种静态结论的停止处评判它――只从停止证书中写出确认或反驳;未观察时写出决定中次数和原因,绝不要用断点已解析取代一次运行――只调试自己构建的程序――

## 延伸阅读

- [LLDB Tutorial: command grammar, breakpoints, watchpoints, stop hooks](https://lldb.llvm.org/use/tutorial.html)
- [lldb(1) manual page: --batch, --one-line, --source, --core](https://lldb.llvm.org/man/lldb.html)
- [GDB to LLDB Command Map](https://lldb.llvm.org/use/map.html)
- [LLDB Python Reference: SBTarget, SBFrame, SBValue, and the embedded interpreter](https://lldb.llvm.org/use/python-reference.html)
- [LLDB Caveats: the Python build lldb links against](https://lldb.llvm.org/resources/caveats.html)
- [LLVM 23.1.3 release](https://github.com/llvm/llvm-project/releases/tag/llvmorg-23.1.3)
- [GDB 18.1 release announcement, 2026-09-25](https://sourceware.org/pipermail/gdb-announce/2026/000150.html)
- [GDB manual: Process Record and Replay](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Process-Record-and-Replay.html)
- [GDB manual: Debugging Optimized Code](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Optimized-Code.html)
- [GDB wiki: Permissions on Darwin, code signing a debugger](https://sourceware.org/gdb/wiki/PermissionsDarwin)
- [gdb-patches: Initial AArch64-Darwin support series, October 2025](https://sourceware.org/pipermail/gdb-patches/2025-October/222196.html)
- [Homebrew gdb formula pull request adding arm64 bottles](https://github.com/Homebrew/homebrew-core/pull/209753)
- [ptrace(2), Linux manual page](https://man7.org/linux/man-pages/man2/ptrace.2.html)
- [lldb debugserver MachTask.mm: task_for_pid and task_set_exception_ports](https://github.com/llvm/llvm-project/blob/main/lldb/tools/debugserver/source/MacOSX/MachTask.mm)
- [Intel SDM Volume 2: INT n, INTO, INT3, INT1](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [Intel SDM Volume 3: debug registers DR0 to DR7 (Debug, Branch Profile, TSC, and Resource Monitoring Features)](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [Arm A64 ISA: BRK, Breakpoint instruction](https://developer.arm.com/documentation/ddi0602/latest/Base-Instructions/BRK--Breakpoint-instruction-)
- [Arm A64 ISA: TBZ, Test bit and branch if zero](https://developer.arm.com/documentation/ddi0602/latest/Base-Instructions/TBZ--Test-bit-and-branch-if-zero-)
- [Arm Architecture Reference Manual, D2.9 Watchpoint exceptions](https://developer.arm.com/documentation/ddi0487/latest/)
- [Apple ld(1): -adhoc_codesign](https://keith.github.io/xcode-man-pages/ld.1.html)
- [Apple ld64 LinkEdit.hpp: CS_LINKER_SIGNED](https://github.com/apple-oss-distributions/ld64/blob/59a99ab60399c5e6c49e6945a9e1049c42b71135/src/ld/LinkEdit.hpp)
- [Apple: Debugging Tool Entitlement, com.apple.security.cs.debugger](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.security.cs.debugger)
- [Apple: Hardened Runtime](https://developer.apple.com/documentation/security/hardened-runtime)
- [Apple: Resolving common notarization issues, the get-task-allow entitlement](https://developer.apple.com/documentation/security/resolving-common-notarization-issues)
- [Apple: Disabling and Enabling System Integrity Protection](https://developer.apple.com/documentation/security/disabling-and-enabling-system-integrity-protection)
- [Apple Developer Forums: debugserver may not get the taskport of a hardened process](https://developer.apple.com/forums/thread/127544)
- [Apple DevToolsSecurity(8)](https://keith.github.io/xcode-man-pages/DevToolsSecurity.8.html)
- [Apple core(5)](https://keith.github.io/xcode-man-pages/core.5.html)
- [Apple Technical Note TN2124: Mac OS X Debugging Magic, core dumps](https://developer.apple.com/library/archive/technotes/tn2124/_index.html)
- [lldb `process save-core` help text](https://github.com/llvm/llvm-project/pull/143126)
- [core(5), Linux manual page](https://man7.org/linux/man-pages/man5/core.5.html)
- [coredumpctl(1)](https://man7.org/linux/man-pages/man1/coredumpctl.1.html)
- [Apple dtrace(1)](https://keith.github.io/xcode-man-pages/dtrace.1.html)
- [Apple dtruss(1m)](https://keith.github.io/xcode-man-pages/dtruss.1m.html)
- [strace releases](https://github.com/strace/strace/releases)
- [ltrace](https://ltrace.org/)
- [bpftrace CHANGELOG](https://github.com/bpftrace/bpftrace/blob/master/CHANGELOG.md)
- [rr project](https://rr-project.org/)
- [rr 5.9.0 release](https://github.com/rr-debugger/rr/releases/tag/5.9.0)
- [rr wiki: Building And Installing, hardware and VM requirements](https://github.com/rr-debugger/rr/wiki/Building-And-Installing)
- [Clang UndefinedBehaviorSanitizer](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html)
- [ISO/IEC 9899:2024 working draft N3220, clause 3.5 undefined behavior](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n3220.pdf)
- [DWARF Debugging Information Format Version 5](https://dwarfstd.org/doc/DWARF5.pdf)
- [Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64)](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst)
- [System V Application Binary Interface, AMD64 Architecture Processor Supplement](https://gitlab.com/x86-psABIs/x86-64-ABI)
