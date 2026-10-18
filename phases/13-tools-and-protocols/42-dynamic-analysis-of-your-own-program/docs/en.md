# 动态分析自己的程序：调试器、跟踪与静态结论的验证

> 断点命中只是对某个构建的一次运行的观察。本课构建测试驱动器，将这些观察转换为针对静态分析课程结论的“已确认”“已反驳”和“未观察到”判定。

**Type:** Build
**Languages:** Python, C, arm64 assembly, lldb command language
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、Phase 13 · 35（证据、置信度和未知项）
**Time:** ~130 分钟

## 学习目标

- 解释调试器在 Linux 上需要哪些操作系统支持（`ptrace`），在 macOS 上需要哪些支持（Mach 任务端口和异常端口），以及沙箱中的 shell 为什么无法启动被调试进程。
- 按名称和清单地址设置软件断点，设置硬件观察点，并理解处理器对两者施加的限制。
- 从 Python 以批处理模式驱动 lldb，使用停止钩子在每次停止时记录寄存器、内存和栈帧变量，并将会话记录解析回时间线。
- 对照该时间线检查第 32、33、34、41 课的静态结论：参数寄存器、结构体字段偏移、条件分支实际走过的边，以及发生过的调用。
- 对 `-O2` 构建运行同一计划，解读已解析却从未命中的断点，并说明这能证明什么、不能证明什么。
- 保存和加载 core 文件，并指出栈式 core 遗漏了什么。
- 对照 gdb 和 lldb 命令集，将 `strace`、`ltrace`、`bpftrace`、`dtrace` 和 `rr` 放到正确的操作系统上，并说明版本和许可证。
- 说明 macOS 的哪些代码签名条件允许 lldb 调试自行构建的二进制，以及它会拒绝的两种情况。

## 问题

第 41 课从 DWARF 读取 `struct account`，指出 `balance` 位于偏移 4。第 33 课构建 `classify` 的控制流图，指出余额为负时，第一个分支进入 `return -1` 块。第 32 课指出前两个参数通过 `x0` 和 `x1` 传入。每句话都从字节推导而来，没有一句来自实际观察。

随后，一个 agent 阅读同一程序并报告：“main 调用 `bump`、`classify` 和 `sum_balances`。”符号表列出了这三个函数，因此这句话看起来可靠。你以 `-O2` 构建程序，为每个函数设置断点并运行。进程打印四行后退出，所有断点都报告 `hit count = 0`。

agent 对源码的判断没有错，错的是对用户所问构建的判断。编译器内联了全部三个调用，并将 `sum_balances(rows, 3)` 折叠为常量 315。要知道这台机器上这个二进制的实际情况，就必须在调试器下运行并观察。

本课构建执行观察的驱动器。它编译 `account.c`，读取清单，规划一次 lldb 会话，运行并根据停止时显示的信息评判每个静态结论。判定有三种结果：`confirmed` 表示某次停止证明该结论对此次运行成立；`refuted` 表示某次停止证明它不成立；`not-observed` 表示没有停止能检验它，记录中会说明原因。第 35 课随后将每个判定存为权威来源是 `controlled-replay` 的 `observed` 记录。

```figure
re-42-run-timeline
```

## 调试器是三项系统服务加一张表

调试器会对其不拥有代码的进程做四件事：停止进程，读写寄存器，读写内存，以及获知进程再次停止。内核为每项操作提供服务，不同操作系统的服务不同。

Linux 上的服务是 `ptrace(2)`。手册说明，它“提供了一种方式，使一个进程（跟踪者）能够观察并控制另一个进程的执行”。`PTRACE_TRACEME` 让子进程声明其父进程将跟踪它；`PTRACE_ATTACH` 附加到无亲缘关系的进程；`PTRACE_PEEKDATA` 读取“被跟踪进程内存中 addr 地址处的一个字”；`PTRACE_GETREGS` 读取寄存器；`PTRACE_SINGLESTEP` 执行一条指令。Yama 模块限制附加操作：`/proc/sys/kernel/yama/ptrace_scope` 默认值 1 意味着“目标进程必须是调用者的后代进程”，2 表示仅管理员可附加，3 表示任何人都不可以。

macOS 的 `ptrace` 接口较小。Apple 手册列出 `PT_TRACE_ME`、`PT_ATTACHEXC`、`PT_STEP`、`PT_CONTINUE` 和 `PT_KILL`，并说明使用 `PT_ATTACHEXC` 时，“子进程的信号以 Mach 异常形式传给父进程”。内存和寄存器根本不经过 `ptrace`。lldb 的 `debugserver` 调用 `task_for_pid()` 获取进程的 Mach 任务端口，然后调用 `task_set_exception_ports()`，使断点以异常消息形式到达。系统守护进程 `taskgated` 决定谁可以调用 `task_for_pid`。

本课保留的一份会话记录展示了这种设计的代价。会话的 shell 运行在 Seatbelt 沙箱下。同一计划在沙箱外产生十一次停止，在沙箱内则产生如下结果：

```text
(lldb) run
error: process exited with status -1 (attach failed ((os/kern) invalid address))
```

进程已创建，但无法被调试器接管。错误涉及调试器权限，不能说明程序本身有任何问题。驱动器将它记录为启动失败，停止次数为零，没有判定。

那张表就是断点表。调试器记住自己在什么地址替换了哪个指令字节，以便继续执行时恢复原内容，并按位置累计命中次数。`breakpoint list` 打印这张表，驱动器会在每次运行结束时读取。

## 断点：替换一个字节或一个字

软件断点是处理器会陷入异常的指令，它覆盖目标停止指令的起始字节。x86-64 使用 `INT3`，操作码 `CC`，长度为一个字节，Intel 手册描述其用途为“调用调试异常处理程序”。arm64 使用 `BRK #imm16`，一条四字节指令，其异常“使用 EC 值 0x3C 将异常记录到 ESR_ELx”。Arm 手册还说明，首选返回地址就是 `BRK` 指令自身，因此停止报告的是被替换指令的地址，而不是下一条地址。

lldb 可以按名称、文件和行号或地址设置断点。按名称设置时，它会跳过序言：

```text
(lldb) breakpoint set -n bump
Breakpoint 1: where = account-O0`bump + 12 at account.c:13:19, address = 0x00000001000004bc
```

`bump + 12` 是第四条指令。前三条是 `sub sp, sp, #0x10`、`str x0, [sp, #0x8]` 和 `str w1, [sp, #0x4]`，即 DWARF 行号表归于函数起始行的栈帧建立代码。停止时，`x0` 和 `x1` 仍保存参数，因为序言只是复制了它们。

按地址设置时，lldb 需要知道地址属于哪个模块。在进程尚不存在时，单独的 `breakpoint set -a 0x100000504` 是一个没有对应节的加载地址；首次测试中，它在整个运行期间一直是 `unresolved`，且 `hit count = 0`。驱动器使用的形式会指明模块：

```text
(lldb) breakpoint set -a 0x100000504 -s account-O0
Breakpoint 4: address = 0x0000000100000504
```

使用 `-s` 后，该数值表示 `account-O0` 内的文件地址，lldb 加上加载偏移，运行后该位置显示 `resolved, hit count = 2`。第 33 课的清单给出文件地址，因此这种形式将静态清单连接到动态停止。

### 手工解码分支

`-O0` 下 `classify` 的第一个条件分支是 `0x1000004f0` 处的字 `36f800a8`，`llvm-objdump` 将其打印为 `tbz w8, #0x1f, 0x100000504`。根据 Arm A64 的 `TBZ` 编码解码它。

1. 位 31 是位编号的高位 `b5`，值为 0。
2. 位 30 至 25 为 `011011`，属于测试并分支指令组。位 24 为 0，选择 `TBZ` 而非 `TBNZ`。
3. 位 23 至 19 是位编号的低五位 `b40`：`11111` = 31。结合 `b5` = 0，被测试的是位 31，即 32 位值的符号位。
4. 位 18 至 5 是 `imm14`：`00000000000101` = 5。分支偏移为 `imm14 * 4` = 20 = `0x14`，因此目标为 `0x1000004f0 + 0x14 = 0x100000504`。
5. 位 4 至 0 是 `Rt`：`01000` = 8，因此寄存器是 `w8`。

`w8` 在前一条指令中由 `ldr w8, [x8, #0x4]` 加载，即偏移 4 处的 `a->balance`。`TBZ` 在该位为零时跳转，因此符号位为零，即 `balance >= 0` 时走跳转边。源码写的是 `if (a->balance < 0) return -1;`，所以编译器反转了条件：跳转边跳过 `return -1` 块，`0x1000004f4` 处的顺序落下边进入该块。因此，驱动器携带的静态结论是带谓词的边结论：`a->balance >= 0` 时跳转，否则顺序落下。第二个分支的提升方式相同。`subs w8, w8, #0xc8` 计算 `balance - 200`，当结果至多为零，即 `balance <= 200` 时，`b.le 0x100000524` 跳转。

## 观察点依赖硬件，数量有限

观察点在某个地址的内存被访问时停止进程。它不能通过替换指令实现，因为任意位置的任意指令都可能进行该访问。因此，处理器提供少量地址比较器。x86-64 使用调试寄存器：`DR0` 至 `DR3` 保存“最多 4 个断点的地址”，`DR7` 启用各项并设置条件（执行、写或读写）和长度（1、2、4 或 8 字节）。arm64 使用寄存器对：`DBGWVR<n>_EL1`“保存用于观察点匹配的数据虚拟地址”，`DBGWCR<n>_EL1` 保存控制信息；Arm 手册说明“一个实现可以包含 2 至 64 个观察点”。

lldb 会报告它获得的数量：

```text
(lldb) watchpoint set variable a->balance
Watchpoint created: Watchpoint 1: addr = 0x16fdfe00c size = 4 state = enabled type = m
(lldb) watchpoint list
Number of supported hardware watchpoints: 4
```

这台机器上有四个。被观察地址 `0x16fdfe00c` 是 `x0 + 4`：在 `bump` 停止处的结构体指针，加上 DWARF 给出的 `balance` 偏移。`size = 4` 对应 `int`，`type = m` 表示修改。槽位耗尽时，lldb 拒绝下一个观察点；而未对齐或大小不是二的幂的区域可能占用两个槽位，因此可设置的观察点数可能少于四个。

数据观察点在访问之后报告。Intel 手册说明，“写内存的指令会先覆盖原数据，然后才产生数据断点引发的调试异常”；lldb 在自己的缓存中保留旧值，以便同时打印新旧值：

```text
Watchpoint 1 hit:
old value: 250
new value: 255
* thread #1, queue = 'com.apple.main-thread', stop reason = watchpoint 1
    frame #0: 0x00000001000004d0 account-O0`bump(a=0x000000016fdfe008, by=5) at account.c:14:12
```

停止地址为 `0x1000004d0`，即 `0x1000004cc` 处的 `str w8, [x9, #0x4]` 之后的指令。解析输出前需要了解一个特点：刚执行 `watchpoint set` 后，lldb 会打印 `Watchpoint 1 hit:`，旧值为空，`new value: 250`。这只是初始读取，驱动器会忽略没有旧值的命中。

## 单步、停止钩子和批处理模式

lldb 命令语法为 `<noun> <verb> [-options] [arguments]`。单步命令包括 `thread step-in`（`s`）、`thread step-over`（`n`）、`thread step-inst`（`si`）、`thread step-inst-over`（`ni`）和 `thread step-out`（`finish`）。`thread until 12` 运行到某行，`thread return <expr>` 携带一个值提前返回。本驱动器不执行单步，而是在计划地址停止，让停止钩子读取数据：

```text
target stop-hook add -o "register read x0 x1 pc" -o "memory read -s4 -fx -c24 $x0" -o "frame variable -P 1"
```

`-o` 可以重复，命令会在每次停止时按顺序执行。`register read` 指定两个参数寄存器和程序计数器。`memory read -s4 -fx -c24 $x0` 从 `x0` 中的地址起，以十六进制打印 24 个四字节字，共 96 字节，即三行 `struct account`。`frame variable -P 1` 打印参数和局部变量，并将指针展开一层，因此 `a` 会显示其五个字段。

批处理模式是 `lldb -b`。手册说明，`--batch` 运行 `-s`、`-S`、`-o`、`-O` 提供的命令后退出；若命令“因信号或崩溃而停止，调试器将返回交互提示符”。驱动器将计划写入文件，再通过 `-s` 传入。一个重要设置是 `settings set interpreter.stop-command-source-on-error false`。没有它，进程退出后的第一个 `continue` 就会终止整个命令文件，`breakpoint list` 永远不会运行。有了它，lldb 打印 `error: Process must be launched.` 后仍会继续。

输出形式的两个事实决定了解析器的工作方式。首先，钩子运行时立即打印输出，之后才打印包含 `frame #0` 行的 `Process N stopped` 块。因此，解析器先将寄存器、内存和变量行收集到待处理块，再将其附加到下一个遇到的 `frame #0` 行。若块中的程序计数器位于 `dyld` 的 `_dyld_start`，那是程序执行前的入口停止，没有任何 `frame #0` 会接收它。其次，带 `--auto-continue` 的断点完全不报告停止，也不执行停止钩子。驱动器的初版使用自动继续，结果什么都没有记录。现在计划改用普通断点和固定数量的 `continue` 命令。

## 计划来自清单

`Plan.commands()` 根据即将运行的二进制的 `llvm-objdump -d` 文本构建命令文件。对 `account-O0`：

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

三个名称断点对应函数入口。四个地址断点对应 `Listing.conditional_branches()` 在 `classify` 中找到的每个条件分支的目标与顺序落下地址：`0x1000004f0` 处的 `tbz` 和 `0x100000510` 处的 `b.le`。观察点在第一次停止时设置，计划预期该停止位于 `bump`。随后有十六个 `continue` 命令，超过任何一次运行所需数量，多余命令在退出后无害失败。这个预算不是对程序行为的了解，只是一个上限。

`claims_for()` 用相同输入构建结论：

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

字段偏移来自 `struct_layout()`：它从 dSYM 转储读取带有 `DW_AT_byte_size (0x20)` 的 `DW_TAG_structure_type`，以及五个 `DW_TAG_member` 条目的 `DW_AT_data_member_location`。计划从不硬编码数值 4，而是读取它。

## -O0 运行：十一次停止

第一次停止是 `bump` 断点。钩子在停止块之前打印了以下内容：

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

对照 DWARF 偏移读取第一行的八个字。偏移 0 的字 0 为 `0x73`，即 `'s'`，也就是 `kind` 字节，后面是三个填充字节。偏移 4 的字 1 为 `0xfa` = 250，即 `balance`。偏移 8 的字 2 为 `0x9`，即 `code`，低半部是 `short`，高半部有两个填充字节。偏移 12 的字 3 是 8 字节对齐的 `double` 前的填充。偏移 16 的字 4 和 5 为 `0x3ff4000000000000`，即 1.25 的 IEEE-754 编码。偏移 24 的字 6 和 7 为 `0x100000719`，即指向 `__TEXT` 的 `label` 指针。随后八个字以 `0x6c` = `'l'` 和 `0xffffffd8` = -40 开头：这是 32 字节之后的第三行 `loan`。每个数值都与 `frame variable` 一致，因此 `_check_layout()` 在这次停止将 `field-offsets` 记录为 `confirmed`，并在 `x0` 保存结构体指针的全部十一次停止中重复确认。

`x0` 等于 `a`，`x1` 等于 `by`，因此在此次入口确认了 `arg-registers`。驱动器只比较声明的参数。在 `classify` 停止处，`x1` 仍为 `0x5`，这是 `bump` 遗留的值；而 `classify` 只有一个参数，因此不拿它做比较。未承载参数的寄存器只是噪声，第 32 课的结论不涉及它。

第二次停止是观察点，旧值 250，新值 255，`by` = 5。整个运行只命中一次，因此 `store-once` 得到确认。随后是 `classify` 的三次执行，每次有一个入口停止和一到两个边停止：

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

`_check_branches()` 将停止按函数执行实例分组，读取入口处的余额，并对每个边停止计算提升后的谓词所预测的后继。五个边停止全部一致：`branch-1` 确认三次，`branch-2` 确认两次。停止 5 显示余额为 255，正是观察点看到写入的值。这是同一个程序的一次运行，证据相互连接。

在停止 10，钩子从 `list` 读取 24 个字。`_check_stride()` 取字 1、字 9 和字 17，即偏移 4、36、68：100、255 和 -40。它将每个值与 `classify` 在同一地址观察到的余额比较，将它们求和得到 315，再与程序打印的 `sum 315` 行比较。随后进程以状态 0 退出，`breakpoint list` 显示名称断点的命中次数为 1、3、1，四个边断点为 2、1、1、1。全部八个结论最终均为 `confirmed`，背后有 25 条记录，其中 23 条关联停止，两条关联完整运行。

## -O2 运行：零次停止

同一源码在 `-O2` 下是不同的程序。`main` 的 `llvm-objdump -d` 输出只有四条 `bl`，全部调用 `printf`。原有调用被 `mov w8, #-0x1`、`mov w8, #0x1`、通过 `xzr` 提供的零，以及值为 315 的 `mov w8, #0x13b` 取代。编译器在编译期计算了所有结果。`nm` 仍列出 `_bump`、`_classify` 和 `_sum_balances`，因为它们是外部函数，必须保留非内联副本供其他目标文件调用。dSYM 包含全部四个函数的 `DW_TAG_subprogram` 条目，却没有任何 `DW_TAG_inlined_subroutine` 条目，所以连调试信息也未记录这次内联。

该构建的计划有三个名称断点，没有边断点。`-O2` 下的 `classify` 只有六条指令：`ldr`、`cmp`、`cset`、`cmp`、`csinv`、`ret`，其中没有条件分支。来自 `-O0` 清单的边结论在这个二进制中没有地址，驱动器不会将它们迁移过来。关于边的结论属于清单中确实存在该边的构建。

运行结果：

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

每个断点都已解析。地址存在，符号存在，lldb 也在那里写入了 `BRK`。命中次数为零，是因为没有任何指令取指到达该地址。判定如下：

| 结论 | 判定 | 记录 |
|---|---|---|
| `calls` | 已反驳 | 完整运行以状态 0 退出后，入口停止次数为 bump 0、classify 0、sum_balances 0 |
| `output` | 已确认 | 四行输出及退出状态 0 |
| `arg-registers` | 未观察到 | 没有停止检验它，命中次数全为 0 |
| `field-offsets` | 未观察到 | 没有停止检验它 |
| `store-once` | 未观察到 | 未在 bump 停止，因此从未设置观察点 |
| `stride` | 未观察到 | 未在 sum_balances 停止 |

必须准确说明反驳的含义。原结论是：`main` 在这个程序中调用三个函数。对这个构建的这次运行，它没有调用；驱动器检查了运行已完成，因为退出前命中次数为零只能说明运行尚未到达调用。该结论并未声称函数是死代码，这次运行也没有证明这一点：它们是导出的，其他目标文件仍可调用。其余四项既未确认也未反驳。这个构建的结构体仍将 `balance` 放在偏移 4，`-O2` DWARF 也如此说明，但这次运行没有任何停止读取内存来展示它。`not-observed` 保留这一区别，第 35 课会将未知项保持开放，直到某次运行真正观察到它。

## Core 转储

core 文件将进程的内存和寄存器写到磁盘，使调试器在程序消失后仍能读取其停止状态。Apple 的 `core(5)` 说明，“少数导致进程异常终止的信号，也会将进程内存状态记录写入磁盘”，位置为 `/cores/core.pid`，“前提是终止的进程具有该目录的写权限，且目录存在”。这台机器的 `sysctl` 报告 `kern.coredump: 1` 和 `kern.corefile: /cores/core.%P`，`/cores` 存在，模式为 `drwxrwxr-t root admin`，而 shell 的 `ulimit -c` 为 0。在用 `ulimit -c unlimited` 提高限制，或用 `launchctl limit core unlimited` 系统级提高限制之前，内核不会写出 core。

lldb 无需崩溃即可按需写出 core。在 `bump` 断点处：

```text
(lldb) process save-core --style stack account-O0-stack.core
Saving 49152 bytes of data for memory region at 0x16fdf4000

Modified-memory or stack-memory only corefile created.  This corefile may 
not show library/framework/app binaries on a different system, or when 
those binaries have been updated/modified. Copies are not included
in this corefile.  Use --style full to include all process memory.
```

文件为 53,248 字节。加载时需要同时提供二进制：

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

回溯和整数字段完好，因为它们位于 core 保存的栈上。`label` 显示为空字符串，但其指针完整。指针 `0x100000719` 是正确的；它指向的字节是可执行文件 `__TEXT` 段中的字面量 `"savings"`，而栈式 core 不包含该段。指针是观察结果，字符串不可用，lldb 不会编造它。`--style full` 包含全部进程内存；在研究机器上，这个 34 KB 程序的完整 core 达到 2.1 GB，因为进程映射了共享缓存。停止原因显示为 `ESR_EC_BRK_AARCH64`：core 记录了断点引发的 `BRK` 异常。

Linux 内核根据 `/proc/sys/kernel/core_pattern` 写出 core，这个模板用 `%p` 表示 PID、`%e` 表示命令名、`%s` 表示信号、`%t` 表示时间，前导 `|` 则将转储通过管道交给程序。systemd 发行版通过该管道交给 `systemd-coredump`，再用 `coredumpctl list`、`info`、`dump` 和 `debug` 取回保存的数据。`gdb prog core` 和 `lldb -c core prog` 都能打开结果。

## gdb 与 lldb 对照

两个调试器用不同命令完成相同工作。驱动器中的 `COMMAND_MAP` 有 35 行，可通过 `python3 code/main.py commands` 打印。本课使用的如下：

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

在 lldb 中，`p` 是 `dwim-print` 的别名：普通变量通过 `frame variable` 路径打印，其他情况回退到 `expression`。`v` 就是 `frame variable`。驱动器中应优先使用 `frame variable`：它读取 DWARF 位置，从不在被调试进程中执行代码。

以下版本和许可证信息截至 2026-10-14。lldb 使用 LLVM 版本号，llvm.org 当前发布版为 2026-10-06 发布的 LLVM 23.1.3，采用附带 LLVM 例外的 Apache License 2.0。Homebrew 通过独立 formula `lldb` 提供它。这台机器的 Command Line Tools 提供 Apple 自有编号的 `lldb-1703.0.236.21`，嵌入 Python 3.9.6；Apple 的 lldb 已具备调试签名。GDB 18.1 于 2026-09-25 发布，采用 GPL-3.0-or-later。发布说明列出 Windows、`.gdb_index`、AArch64 `FPMR` 和 Python `gdb.Corefile` 的变更，没有 Darwin 条目。截至 18.1，GDB 尚未原生支持 Apple silicon 进程：2025 年 10 月发布过包含 15 个补丁的“Initial AArch64-Darwin support”系列，2026 年 2 月维护者说明了先完成版权转让和 BFD 补丁的落地路径。Homebrew 的 `gdb` formula 有 arm64 二进制包，但构建时伪装为 `--target=x86_64-apple-darwin20`；加入这些包的 PR 明确说明“无法通过 GDB 调试 aarch64-darwin 二进制”。macOS 上的任何非 Apple 调试器还需要自签名证书和 `com.apple.security.cs.debugger` 权限，否则 `task_for_pid` 会以“(os/kern) failure (0x5)”失败。本课程将 gdb 用于 Linux，Debian stable 在 arm64 上提供 gdb 16.3，`rr` 也运行在那里。

## 跟踪：程序向内核请求了什么

调试器展示程序停止时的状态，跟踪器则展示程序对系统的影响，而不长时间停止程序。工具按操作系统区分。

| 工具 | 操作系统 | 版本 | 许可证 | 记录内容 |
|---|---|---|---|---|
| `strace` | Linux | 7.2，2026-08-18 | LGPL-2.1-or-later | 系统调用及参数和返回值 |
| `ltrace` | Linux | 最后发布的 tarball 为 0.7.3，Debian 使用 git 快照 | GPL-2.0 | 动态库调用 |
| `bpftrace` | Linux | v0.27.0，2026-09-10 | Apache-2.0 | 通过 eBPF 记录内核和用户态探针 |
| `dtrace` 和 `dtruss` | macOS | macOS 26.2 中为 `Sun D 1.19` | CDDL，源自 Sun OpenSolaris | D 探针；`dtruss` 打印系统调用 |

`dtruss` 手册说明：“由于使用 DTrace，只有具有 root 权限的用户才能运行该命令。”Apple 的 `dtrace(1)` 补充：“在默认系统完整性保护设置下，不允许 D 程序访问内核地址值或内核内存内容”，且 SIP 下不允许破坏性操作。本课没有在这台机器上运行 `sudo dtruss ./account-O0`，因为驱动器不使用 root，并将此记录为未验证。跟踪回答的问题不同于驱动器：“这次运行是否为每行 `printf` 发出了 `write`”是跟踪问题；“到达 `bump` 时 `x1` 是否保存 5”是调试器问题。两者都只针对单次运行。

## 记录与重放

`rr` 记录一次运行，并在 gdb 下确定性重放，支持反向执行：对关心的值设置观察点，`reverse-cont` 会倒退到写入点。项目自述为：“只需记录一次失败，之后就能按需多次确定性调试该记录。”当前发布版为 2025-02-13 的 5.9.0，采用 MIT 许可证并包含 BSD-2-Clause 部分。它仅支持 Linux，需要硬件性能计数器统计分支，因此可运行于 Intel Nehalem 及更新架构、部分 AMD Zen 核心，以及 Linux 下“某些 AArch64 微架构，例如 ARM Neoverse N1 或 Apple Silicon M 系列”。虚拟机内必须虚拟化这些计数器，项目 wiki 说明“Mac 上其他虚拟化方案也都不支持”，所以本机的 Docker 和 Colima 无法运行它。Pernosco 是基于 rr 记录构建的商业服务。

gdb 也有自己的软件记录器。`record full` 记录“进程执行日志”，默认上限为 200,000 条指令；`record btrace` 使用 Intel 分支跟踪，“不记录数据”。lldb 不提供这两种功能。在这台 macOS 机器上，驱动器保存的会话文本就是记录：同一计划作用于同一二进制，会以相同顺序产生相同停止，样例测试固定了这个顺序。

## 一次运行能证明什么

一次运行只证明一个构建上的一个输入。C 标准将未定义行为定义为：“使用不可移植或错误的程序构造或错误数据时，本文件不施加任何要求的行为。”因此，有符号 `int` 溢出的程序在 `-O0` 和 `-O2` 下合法地产生不同结果。第 36 课在 `percent_change` 溢出单元中遇到过这种情况。UBSan 将问题转换为停止：`-fsanitize=signed-integer-overflow -fsanitize-trap=undefined` 使溢出“执行陷阱指令”，在 lldb 中形成带有原因的停止。

优化代码还会移动你希望观察的内容。GDB 手册说明，“优化器重排了你的代码，调试器展示实际存在的内容”；被优化到不存在的变量是“GDB 永远看不到”的变量。GDB 将这种值打印为 `<optimized out>`，源码将它与 `<unavailable>` 区分：前者“实际上不存在于程序中”，后者“在程序中存在（机器层面），但 GDB 无法获取”。当程序计数器位于变量 DWARF 位置列表的全部范围之外时，lldb 打印 `<variable not available>`。对存放在寄存器中的局部变量设置内存观察点不会触发，因为寄存器不是内存。上面的 `-O2` 运行展示了极端情况：整个函数被折叠掉，从未设置过的观察点保持沉默，不能证明任何事。

因此，驱动器只写三种记录，绝不写第四种。某次停止检验结论且一致，为 `confirmed`；检验后不一致，为 `refuted`；没有任何停止能够检验，为 `not-observed`，并附原因，断点命中次数也是原因的一部分。第 35 课的账本将前两者接受为权威来源是 `controlled-replay` 的 `observed` 记录，将第三种保留为开放未知项。

## 在 macOS 上只调试自己的构建

在 Apple silicon 上，链接器会为你签名。Apple 的 `ld(1)` 对 `-adhoc_codesign` 说明：“Apple Silicon 二进制默认进行 ad-hoc 签名。”对样例运行 `codesign -dvvv account-O0` 会打印：

```text
Format=Mach-O thin (arm64)
CodeDirectory v=20400 size=387 flags=0x20002(adhoc,linker-signed) hashes=9+0 location=embedded
Signature=adhoc
TeamIdentifier=not set
```

`0x20002` 是 `CS_ADHOC`（`0x2`）加 `CS_LINKER_SIGNED`（`0x20000`），后者在 Apple 代码签名头文件中解释为“由链接器自动签名”。`codesign -d --entitlements -` 在可执行文件名称之后不打印任何内容：二进制没有权限声明。在 `DevToolsSecurity -status` 报告“Developer mode is currently disabled”、系统完整性保护启用的情况下，lldb 仍启动了它、命中全部断点、设置硬件观察点并写出了 core。

两个权限控制谁可以调试谁，分别位于两侧。`com.apple.security.cs.debugger` 属于调试器：“一个布尔值，表示应用是否是调试器，以及能否附加其他进程或获取任务端口。”Apple 的 `debugserver` 携带其私有形式；对 Command Line Tools 中的副本运行 `codesign -d --entitlements -`，会列出 `com.apple.private.cs.debugger`、`com.apple.private.set-exception-port`、`com.apple.private.thread-set-state` 和 `com.apple.private.logging.diagnostic`。`com.apple.security.get-task-allow` 属于目标。Xcode 将其注入调试构建，在导出时移除，而公证会拒绝仍携带它的二进制。Apple 工程师说明了拒绝规则：当目标启用了强化运行时且没有 `get-task-allow` 时，任务端口会被拒绝。普通 `clang` 构建没有强化运行时，不触发该拒绝条件。如果曾用 `codesign --options runtime` 给样例签名，调试前需用 `codesign -s - -f --entitlements get-task-allow.plist` 重新签名。

还有三个事实。第一，在登录会话中第一次调试时，可能看到“Developer Tools Access needs to take control of another process for debugging to continue”对话框；`sudo DevToolsSecurity -enable` 可为 `admin` 或 `_developer` 组成员免去额外密码。第二，调试自己的代码无需关闭 SIP。Apple 说明“从 Xcode 运行和调试应用不需要关闭 SIP”；涉及调试的 SIP 组件，仅是 `csrutil enable --without debug` 为其他人的进程放宽的那一项。第三，本会话的 Seatbelt 沙箱完全阻止 `task_for_pid`，样例 `sandbox-O0.lldb.txt` 展示了结果。无法启动的运行属于环境事实，驱动器也如此报告。

本课的一切都适用于你自己编译的程序。只有另一个进程的所有者主动允许时，相同命令才可附加到它；本课不教授如何改变这一条件。

## 亲手构建

运行演示：

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program
python3 code/main.py
```

输出是基于已保存会话记录的一份 JSON 报告。每种构建列出断点的解析状态与命中次数、硬件观察点数量、每次停止的寄存器和参数、退出状态、程序输出、lldb 打印的错误，以及结论、判定和背后的证据记录。报告还包含 core 保存加载往返、Python API 结果、沙箱失败，以及本机缺少哪些外部工具。

预期结构：

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

按以下顺序阅读 `code/main.py`：

1. `Listing` 将 `llvm-objdump -d` 文本解析为函数和指令，`Function.conditional_branches()` 查找分支及目标与顺序落下地址。
2. `struct_layout()` 从 `llvm-dwarfdump` 文本读取结构体和成员条目。
3. `lift_condition()` 将一个条件分支转换为谓词，这是第 34 课针对 `tbz`、`cbz` 和比较后分支形式的提升步骤。
4. `Plan.commands()` 根据清单写出 lldb 命令文件，`Plan.lldb_command()` 提供批处理调用。
5. `parse_transcript()` 按顺序遍历输出，构建包含寄存器、内存、变量和观察点值的 `Stop` 记录，以及断点表和退出状态。
6. `claims_for()` 声明八个结论，`evaluate()` 使用 `_check_*` 函数逐次停止评判它们。
7. `rollup()` 将记录归约为每个结论一个判定，反驳优先于确认。
8. `capture()` 和 `capture_extras()` 生成样例；当 `clang` 和 `lldb` 可运行时，`live()` 在新构建上重复整个流程。

还有四个命令。`python3 code/main.py plan O0` 打印某构建的命令文件；`python3 code/main.py commands` 打印 gdb 和 lldb 对照表；`python3 code/main.py tools` 报告 `PATH` 上有哪些外部工具；`python3 code/main.py live O0` 将 `account.c` 编译到临时目录，根据新清单制定计划，运行 lldb，再根据本次运行评判结论。在沙箱内，它报告 lldb 无法启动进程，附带错误，并以 1 退出。

## 实际使用

按以下顺序将驱动器用于自己的程序。

1. 使用 `-g` 和计划交付的优化级别构建。将二进制、dSYM 或 DWARF，以及 `llvm-objdump -d` 文本一同保存。
2. 运行前写出结论。每项指明函数、寄存器或地址或偏移、预期值或边，以及其来源课程或文档。看到停止后才写出的结论只是在描述停止，检验不了任何事。
3. 根据清单生成计划并阅读。每个地址都应能追溯到清单的一行。若断点没有对应行，就删除它。
4. 以批处理模式运行一次，保留会话记录，并在头部记录命令行和调试器版本。会话记录就是证据；判定由它推导，任何人都可以重新推导。
5. 进行判定。阅读确认结果之前，先读每条 `not-observed` 记录及原因。原因会告诉你哪些结论需要其他输入、其他构建或其他断点。
6. 用相同结论运行优化构建。编译器内联处可能出现已解析但零命中的断点，应保留相应结论的未决状态。
7. 将已确认和已反驳记录作为 `observed`、权威来源 `controlled-replay` 写入第 35 课账本，每次停止一条记录。未观察到的结论仍作为未知项，附上断点命中次数。

## 交互实验

### 实验 A：手工读取一次停止

从 `code` 目录启动 Python：

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program/code
python3 -q
```

运行：

```python
from main import *
t = load_transcript("session-O0.lldb.txt")
s = t.stops[0]
hex(s.pc), s.function, s.reason, s.registers
[hex(w) for w in s.memory[:8]]
s.struct_pointer().fields
```

执行第二行之前，先写下预期哪个字保存 250，哪两个字保存 1.25。然后运行 `struct.unpack("<d", struct.pack("<II", s.memory[4], s.memory[5]))` 并比较。接着查看 `t.stops[1].watch_hit` 和 `t.stops[1].pc`，在 `account-O0.objdump.txt` 中找到该地址：它是存储之后的指令。

### 实验 B：分支与后继

```python
plan = make_plan("O0")
plan.branches()
classify = plan.listing.function("classify")
[lift_condition(classify, b, "a->balance")[0] for b in plan.branches()]
[(hex(s.pc), s.struct_pointer().field_int("balance")) for s in t.stops_in("classify")]
```

将每个边停止与其入口停止匹配，在查看证据之前，判断谓词预测哪个后继。然后运行 `[e.to_dict() for e in evaluate(plan, t, struct_layout(open("fixtures/account-O0.dwarfdump.txt").read(), "account")) if e.claim.startswith("branch")]` 并比较。

### 实验 C：从未停止的运行

```python
o2 = load_transcript("session-O2.lldb.txt")
len(o2.stops), o2.exit_status, o2.hits()
o2.errors[:3]
make_plan("O2").branches()
rollup(evaluate(make_plan("O2"), o2, struct_layout(open("fixtures/account-O2.dwarfdump.txt").read(), "account")))
```

用自己的话解释每个 `not-observed`，然后打开 `account-O2.objdump.txt`，找到 `main` 中取代调用的四个常量。再用 `count_tags()` 统计 `account-O2.dwarfdump.txt` 中的 `DW_TAG_inlined_subroutine`。

### 实验 D：破坏证据

```python
text = open("fixtures/session-O0.lldb.txt").read().replace("x1 = 0x0000000000000005", "x1 = 0x0000000000000006", 1)
broken = parse_transcript(text)
[e.to_dict() for e in evaluate(plan, broken, struct_layout(open("fixtures/account-O0.dwarfdump.txt").read(), "account")) if e.claim == "arg-registers"][:2]
```

修改一个寄存器，就会让第一条 `arg-registers` 记录及汇总变为 `refuted`，其余四个入口仍为 `confirmed`。随后删除观察点停止前的 `old value: 250` 行，观察 `store-once` 变为 `not-observed`。无法被故意弄错的判定器，根本没有在判定。

如果 lldb 可以在你的 shell 中启动进程，最后运行 `python3 main.py live O0` 和 `python3 main.py live O2`。栈地址会与样例不同，判定不应改变。

## 实践实验

为驱动器增加关于 `sum_balances` 循环的结论。

要求：

- 使用 `conditional_branches()` 在 `-O0` 清单中找到 `sum_balances` 的循环回边，在循环头增加断点。
- 增加结论：当 `count` = 3 时，循环头执行 `count + 1` 次，这对应第 33 课的回边加上退出检查。
- 扩展停止钩子或计划，使钩子在每次循环头停止时读取循环计数器的栈槽，并编写 `_check_loop()` 记录计数器值序列。
- 在 lldb 能启动进程的机器上，用 `python3 main.py capture O0` 重新捕获会话并重跑套件。在提交的命令文件与新计划匹配之前，计划测试会失败，这正是该测试的目的。
- 增加测试，修改会话记录中的一个计数器值，并断言结论变为 `refuted`。

成功标准是：报告按顺序显示循环头停止及计数器值，而 `-O2` 运行将新结论保留为 `not-observed`，原因是循环被向量化或折叠消除。

## 本课产物

本课包含 `outputs/skill-dynamic-analysis-of-your-own-program.md`。用它将自行构建的程序、清单和静态结论列表转换为一份保存的调试器会话记录，以及每项结论的一个判定，并附上产生判定的停止和每项未观察到结论的原因。适用于 Claude、Cursor、Codex、OpenClaw、Hermes 或任何读取 SKILL.md 的 agent。

## 验证

运行演示和确定性套件：

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

套件无需 lldb 即可运行，它读取一次捕获到 `code/fixtures/` 的会话记录。验证应证明：

- 清单解析器找到四个函数及其范围，以及 `-O0` 下 `classify` 的两个条件分支、目标和顺序落下地址
- `tbz w8, #0x1f` 提升为 `a->balance >= 0`，`subs` 加 `b.le` 提升为 `a->balance <= 200`
- `-O0` 下 `main` 调用 `bump`、三次 `classify` 和 `sum_balances`，`-O2` 下 `main` 只调用 `printf`
- x86-64 的 `j<cc>` 助记符属于条件分支，`jmp` 和 `callq` 不属于
- DWARF 转储产生大小 32 字节、成员位于 0、4、8、16、24 的结构体
- `-O2` DWARF 有四个子程序、零个内联子程序条目，`nm` 仍列出三个函数
- 两个构建的计划都与提交的命令文件相等，会话头记录实际运行的 lldb 命令
- `-O0` 会话在预期函数中有十一次停止，退出状态为 0，包含四行输出
- 钩子输出附加到其后的停止，其中 `x1` = 5，内存从 `x0` 开始，并包含标签字符串
- 断点表携带解析状态，命中次数为 1、3、1、2、1、1、1
- 观察点为 `x0 + 4` 处的 4 字节 modify 类型，命中一次，旧值 250、新值 255，并报告四个硬件槽位
- `-O2` 会话没有停止，三个已解析断点均零命中，没有观察点，每个未使用的 `continue` 都对应一个错误
- 沙箱启动在任何停止前因附加错误失败
- core 保存加载往返保留回溯和 `balance` = 250，但丢失 `label` 指向的字符串
- Python API 无需进程即可读取五个字段、大小 32 和函数范围
- 手写 x86-64 会话能解析 `rdi`、`rsi` 和 `rip`
- `-O0` 下每项结论均已确认，分别有 5、11、3、2、1、1、1、1 条记录
- 分支证据指明值、条件和边
- 字段偏移证据通过 DWARF 布局解码各个字
- 存储和步长证据携带新旧值及三行余额
- `-O2` 运行反驳调用边，将其他结论保留为未观察到
- 修改寄存器值会得到反驳，删除观察点命中会得到未观察到，汇总时反驳优先
- 命令映射每行均有 gdb 和 lldb 形式，硬件表列出四个 x86 调试寄存器
- 演示列出缺失工具而不是失败，实时模式按名称报告缺失工具
- 图示数据来自两次会话，站点模块嵌入相同数据

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

根据清单规划停止，以批处理模式运行一次，保留会话记录，并在每次可检验某项静态结论的停止处评判它。只从停止证据写出确认或反驳；未观察到时写明命中次数和原因，绝不要用断点已解析代替一次运行。只调试自己构建的程序。

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
