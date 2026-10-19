# 动态分析 chính quy trình:调试器、跟踪与静态结论的验证

> 断点命中只是对某一构建的运行观察――本课构建测试驱动器,将这些观察转换为针对静态分析课程结论的已确认已反驳和未观察判定──

**Type:** Build
**Languages:** Python, C, arm64 assembly, lldb command language
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、Phase 13 · 35（证据、置信度和未知项）
**Time:** ~130 分钟

## Học mục tiêu

- 解释调试器 trên Linux 上 cần hỗ trợ hệ điều hành nào`ptrace`), trong macOS 上 cần bất kỳ hỗ trợ nào (Mach 任务端口和异常端口), cũng như shell trong hộp 沙为什么无法启动被调试进程──
- 按名称和清单地址 đặt phần mềm断点, đặt phần cứng quan sát điểm,并理解处理器对两者施加的限制──
- Từ Python theo chế độ xử lý hàng hóa, sử dụng dừng子 trong mỗi dừng ghi nhớ ký 存器, bộ nhớ và biến động, và sẽ sẽ sẽ sẽ sẽ ghi lại phân tích lại thời gian.
- Đối với các thời gian này kiểm tra các kết luận tĩnh của bài học 32 ̊33 ̊34 ̊41: các số ký 存器 ̊结构体 ̊段偏移 ̊ điều kiện ̊支 thực sự đi qua bên, cũng như đã xảy ra调调
- Đối với`-O2`构建运行同一计划,解读已解析却从未预期中的断点,并说明这能证明什么,不能证明什么.
- 保存和加载核心文件,并指出式核心 遗漏了什么──
- Đối với gdb và lldb  lệnh tập,将 `strace``ltrace``bpftrace``dtrace`和 `rr`放到正确的操作系统,并说明版本和许可证──
- Giải thích điều kiện ký mã nào của macOS cho phép lldb tự tạo các hệ thống thứ hai, cũng như hai tình huống mà nó sẽ từ chối.

## 问题

第41 课从 DWARF 读取 `struct account`, chỉ ra`balance`位于偏移 4──第 33 课构建 `classify`n 1 để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để để`return -1`块──第 32 课指出前两个参数通过 `x0`和 `x1`传入──每句都从字节推导而来,没有一句来自实际观察──

Sau đó, một đại lý  đọc cùng một quy trình并 báo cáo:`bump``classify`和 `sum_balances` biểu tượng liệt kê ba hàm này, vì vậy câu này trông có vẻ đáng tin cậy.`-O2` cấu trúc chương trình, thiết lập các điểm và chạy cho mỗi hàm.`hit count = 0`

Việc đánh giá về mã nguồn của đại lý không có sai, sai là đánh giá về cấu trúc của người dùng.`sum_balances(rows, 3)`pngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngngng

本课构建执行观察的驱动器.`account.c`,读取清单,规划一次 lldb会话,运行并根据停止时显示的信息评判每个静态结论――判定有三种结果:`confirmed`Cụ thể một kết luận về việc ngừng hoạt động này được chứng minh;`refuted`biểu hiện một sự dừng lại chứng minh nó không hợp lệ;`not-observed`Chỉ ra không ngừng kiểm tra nó, ghi lại trong cuộc họp giải thích lý do.`controlled-replay`của `observed`记录──

```figure
re-42-run-timeline
```

## 调试器 là 3 hệ thống dịch vụ

调试器 sẽ làm bốn điều với quá trình không có mã: ngừng quá trình, đọc viết ký, đọc viết trong bộ nhớ, và nhận biết quá trình dừng lại một lần nữa.

Linux trên dịch vụ là `ptrace(2)`                                                                                                                                                                                                                                                              `PTRACE_TRACEME`让子进程声明其父进程将跟踪它;`PTRACE_ATTACH` thêm vào quá trình không liên quan;`PTRACE_PEEKDATA`读取被跟踪进程内存中 addr 地址处的一个字;`PTRACE_GETREGS`读取寄存器;`PTRACE_SINGLESTEP`执行一条指令──Yama 模块限制附加操作:`/proc/sys/kernel/yama/ptrace_scope`默认值 1 nghĩa là  mục tiêu quy trình phải là quy trình sau của người dùng  2, biểu hiện chỉ có người quản lý có thể thêm vào, 3 biểu hiện bất cứ ai không thể 

macOS của `ptrace`接口较小──Apple 手册列出 `PT_TRACE_ME``PT_ATTACHEXC``PT_STEP``PT_CONTINUE`和 `PT_KILL`,并说明 sử dụng `PT_ATTACHEXC`时,子进程的信号以马赫异常形式传给父进程──内存和寄存器根本不过`ptrace`lldb của `debugserver`调用 `task_for_pid()`获取进程的Mach 任务端口, sau đó调用 `task_set_exception_ports()`, để kết thúc một quá trình bảo vệ hệ thống`taskgated`Quyết định ai có thể sử dụng `task_for_pid`

Một bản ghi lại của bài học này cho thấy chi phí của thiết kế này. Cỏ của bài học này hoạt động dưới vỏ vỏ vỏ.

```text
(lldb) run
error: process exited with status -1 (attach failed ((os/kern) invalid address))
```

进程 đã được tạo, nhưng không thể được调试器接管. 错涉及调试器权限, không thể giải thích rằng trình tự có bất kỳ vấn đề nào. 驱动器 sẽ ghi lại nó như khởi động thất bại, dừng số lần là 0, không xác định.

那张表就是断点表――调试器记住自己在哪个地址替换了哪个命令字节,以便继续执行时恢复原内容,并按位置累计命中次数――`breakpoint list`Bác in bảng này, động cơ sẽ đọc vào cuối mỗi lần chạy.

## 断点: thay đổi một字节或一个字

软件断点是处理器会陷入异常命令,它覆盖目标停止命令的起字节──x86-64 使用 `INT3`, hành động `CC`,长度为一个字节,Intel 手册描述其用途为调用调试异常处理程序──arm64 使用 `BRK #imm16`,一条四字节指示,其异常使用 EC 值 0x3C 将异常记录到 ESR_ELx──Arm 手册还说明,首选返回地址就是`BRK`Chỉ thị tự, do đó ngừng báo cáo là địa chỉ của chỉ thị được thay thế, chứ không phải là địa chỉ của下一条.

Lldb có thể theo tên, tài liệu và hành số hoặc địa chỉ đặt định điểm.

```text
(lldb) breakpoint set -n bump
Breakpoint 1: where = account-O0`bump + 12 at account.c:13:19, address = 0x00000001000004bc
```

`bump + 12`Đó là thứ tư.`sub sp, sp, #0x10``str x0, [sp, #0x8]`和 `str w1, [sp, #0x4]`, tức là DWARF 行号表归归函数起始行的建立代码──停止时,`x0`和 `x1`仍然保存参数, vì các nguyên văn chỉ sao chép chúng.

按地址设置时,lldb 需要知道地址属于哪个模块──在进程中尚不存在时,单独的 `breakpoint set -a 0x100000504`là một không có đối tác với các ứng dụng tải địa chỉ; trong thử nghiệm đầu tiên, nó đã luôn là trong suốt quá trình vận hành.`unresolved`, và`hit count = 0` Các mô hình sử dụng động cơ sẽ chỉ định:

```text
(lldb) breakpoint set -a 0x100000504 -s account-O0
Breakpoint 4: address = 0x0000000100000504
```

Sử dụng `-s`后,该数值表示 `account-O0`內文件地址,lldb 加上加载偏移,运行后该位置显示 `resolved, hit count = 2` Chương 33  Đơn vị của bài học đã cung cấp địa chỉ tài liệu, do đó hình thức này sẽ được liên kết đến động thái dừng.

### Làm việc

`-O0`下 `classify`Điều kiện đầu tiên của phân支 là `0x1000004f0`处的字 `36f800a8`- Tôi không biết.`llvm-objdump`Để in nó cho`tbz w8, #0x1f, 0x100000504`❖ Theo Arm A64 `TBZ`编码 giải mã nó.

1. 位 31 是位编号的高位 `b5`, giá trị là 0:
2. 位 30 đến 25 `011011`, thuộc trong nhóm chỉ dẫn và chỉ dẫn.`TBZ`Không`TBNZ`
3. 位 23 đến 19 là 位 số 5 位 thấp 位 số 5 位`b40`- Có thể là:`11111`= 31―结合 `b5`= 0, được kiểm tra là vị trí 31, tức là 32 vị trí giá trị của các符号位.
4. 位 18 至 5 là `imm14`- Có thể là:`00000000000101`= 5―分支偏移为 `imm14 * 4`= 20 = `0x14`, vì vậy mục tiêu là`0x1000004f0 + 0x14 = 0x100000504`
5. 位 4 至 0 là `Rt`- Có thể là:`01000`= 8, vì vậy寄存器 là `w8`

`w8`Trong một lệnh lệnh`ldr w8, [x8, #0x4]`Lưu ý:`a->balance``TBZ`Trong đó, nó nhảy vào thời điểm không, vì vậy nó được chuyển thành không, tức là`balance >= 0`时走跳转边── nguồn gốc viết là `if (a->balance < 0) return -1;`, Vì vậy, biên dịch viên ngược chuyển thành điều kiện: nhảy nhảy bên nhảy `return -1`块,`0x1000004f4`处的顺序落下边进入该块. Vì vậy, kết luận tĩnh của động cơ mang theo là kết luận bên cạnh của từ:`a->balance >= 0`时跳转,否则顺序落下――第二分支的提升方式相同――`subs w8, w8, #0xc8`计算 `balance - 200`, khi kết quả là quá quá, tức là`balance <= 200`时,`b.le 0x100000524`跳转.

## 观察点依赖硬件, số lượng giới hạn

观察点在某地址内存被访问时停止进程――它 không thể thực hiện bằng cách thay thế chỉ thị, vì bất kỳ chỉ thị nào ở bất kỳ vị trí nào đều có thể thực hiện truy cập này―― do đó, bộ xử lý cung cấp ít lượng địa chỉ so sánh――x86-64 使用调试寄存器:`DR0`至 `DR3`保存最大4个断点的地址,`DR7`启用各种并设置条件(执行、写或读写) 和长度(1、2、4 或 8 字节)`DBGWVR<n>_EL1` lưu trữ dữ liệu phù hợp với các điểm quan sát`DBGWCR<n>_EL1`保存控制信息;Arm 手册说明 Một thực hiện có thể chứa 2 đến 64 điểm quan sát。

LBD sẽ báo cáo số lượng nó nhận được:

```text
(lldb) watchpoint set variable a->balance
Watchpoint created: Watchpoint 1: addr = 0x16fdfe00c size = 4 state = enabled type = m
(lldb) watchpoint list
Number of supported hardware watchpoints: 4
```

Trên máy này có 4 cái.`0x16fdfe00c` `x0 + 4`: trong `bump`停止处的结构体指标,加上 DWARF  `balance`偏移──`size = 4`Đối với`int`- Tôi không biết.`type = m`Để biểu hiện thay đổi, khi dung lượng dung lượng hết, ldb  từ chối một điểm quan sát tiếp theo; trong khi không phù hợp hoặc không lớn của 2  khu vực có thể chiếm hai dung lượng, do đó số điểm quan sát có thể được thiết lập ít hơn bốn.

Các chỉ dẫn trong bộ nhớ sẽ được ghi lại trước khi dữ liệu gốc được phát hiện, sau đó tạo ra các điều chỉnh khác thường của các dữ liệu;lldb sẽ giữ lại giá trị cũ trong bộ nhớ của mình, để cùng thời gian in lại giá trị cũ:

```text
Watchpoint 1 hit:
old value: 250
new value: 255
* thread #1, queue = 'com.apple.main-thread', stop reason = watchpoint 1
    frame #0: 0x00000001000004d0 account-O0`bump(a=0x000000016fdfe008, by=5) at account.c:14:12
```

停止地址为 `0x1000004d0`,即 `0x1000004cc`处的 `str w8, [x9, #0x4]`后后的命令――解析输出前需要了解一个特点:刚执行 `watchpoint set`后,lldb 会打印 `Watchpoint 1 hit:`, giá trị cũ vì空,`new value: 250`Đó chỉ là một cái đầu tiên, động cơ sẽ bỏ qua không có giá trị cũ của cuộc đời.

## 单步、停止子和批处理模式

Lldb 命令语法为 `<noun> <verb> [-options] [arguments]`❖ đơn bước lệnh bao gồm `thread step-in`(`s`)`thread step-over`(`n`)`thread step-inst`(`si`)`thread step-inst-over`(`ni`) và `thread step-out`(`finish`(■)`thread until 12`运行到某行,`thread return <expr>`携带一个值提前返回──本驱动器不执行单步,而在计划地址停止,让停止子读取数据:

```text
target stop-hook add -o "register read x0 x1 pc" -o "memory read -s4 -fx -c24 $x0" -o "frame variable -P 1"
```

`-o`Có thể lặp lại, lệnh sẽ được thực hiện theo thứ tự trong mỗi lần dừng.`register read`指定两个参数寄存器和程序计数器──`memory read -s4 -fx -c24 $x0`Từ `x0`Trung địa chỉ bắt đầu,以十六进制打印 24 个四字节字,共 96 字节,即三行 `struct account``frame variable -P 1`印参数和局部变量,并将指针展开一层,因此 `a`会显示其五段.

批处理模式是 `lldb -b`                                                                                                                                                                                                                                                              `--batch`运行 `-s``-S``-o``-O` lệnh được cung cấp sau khi rút khỏi; Nếu lệnh  vì tín hiệu hoặc sụp đổ và dừng lại,调试器 sẽ quay lại giao tiếp 提示符──驱动器 sẽ lập kế hoạch viết vào tài liệu, thông qua lại `-s`传入── một thiết lập quan trọng là `settings set interpreter.stop-command-source-on-error false`Không có nó, quá trình quay lại sau đầu tiên`continue`Khi kết thúc toàn bộ các giấy tờ lệnh,`breakpoint list`Không bao giờ hoạt động. Có nó, tôi sẽ in.`error: Process must be launched.`后仍会继续──

输出形式的两个事实决定了解分析器的工作方式――首先,子运行时立即打印输出,之后才打印包含 `frame #0`行 của `Process N stopped`Vì vậy, bộ phân tích trước tiên sẽ thu thập các ký 存器, bộ nhớ và biến số để xử lý các khối, sau đó thêm vào các khối tiếp theo gặp gỡ.`frame #0`行──若块中的程序计器 nằm trong `dyld`của `_dyld_start`, đó là quá trình thực hiện trước khi cửa ngõ dừng lại, không có gì `frame #0`Anh sẽ nhận nó.`--auto-continue`Các đoạn kết hoàn toàn không báo cáo dừng, cũng không thực hiện dừng子.`continue`命令――

## 计划来自清单

`Plan.commands()`Theo sắp diễn ra của 2`llvm-objdump -d`文本构建命令文件──对 `account-O0`- Có thể là:

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

三个名称断点对应函数入口──四个地址断点对应 `Listing.conditional_branches()`Trong `classify`Trong tìm thấy từng điều kiện phân支的目标与顺序落下地址:`0x1000004f0`处的 `tbz`和 `0x100000510`处的 `b.le`◊ quan sát điểm trong lần đầu tiên dừng lại khi thiết lập, dự kiến dự kiến dừng lại trong`bump`Sau đó có mười sáu.`continue`Chỉ thị, vượt quá số lượng cần thiết để chạy một lần, lệnh dư thừa sau khi rút khỏi không gây tổn hại thất bại.

`claims_for()`Sử dụng cùng một đầu vào kết luận:

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

字段偏移来自 `struct_layout()`Nó từ dSYM  chuyển lưu 读取带有`DW_AT_byte_size (0x20)`của `DW_TAG_structure_type`, và 5 `DW_TAG_member`条目的 `DW_AT_data_member_location`n plan từ không khó编码 số 4 mà đọc nó

## -O0 运行:十一次停止

Lần đầu tiên dừng lại là`bump`断点──子在停止块之前印了以下内容:

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

对照 DWARF 偏移读取第一行的八个字──偏移 0 的字 0 为`0x73`,即 `'s'`, cũng vậy`kind`字节,后面是三个填充字节──偏移 4 的字 1 为 `0xfa`= 250,即 `balance`△偏移 8 的字 2 为 `0x9`,即 `code`, nửa dưới là `short`, nửa cao có hai chữ viết đầy ắp.`double`前的填充──偏移 16 的字母 4 和 5 为 `0x3ff4000000000000`, tức là 1.25 của IEEE-754 编码──偏移 24 的字符 6 和 7 为 `0x100000719`, tức là hướng`__TEXT`của `label`                                                                                                                                                                                                                                                              `0x6c`= `'l'`和 `0xffffffd8`= -40 开头: Đây là 32 字节后的第三行`loan` Mỗi số giá trị đều với `frame variable`Một致, vì vậy `_check_layout()`Trong thời gian này sẽ dừng lại`field-offsets`记录为 `confirmed`, và `x0`保存结构体指针的全部十一次停止中重复确认──

`x0`Đúng vậy.`a`- Tôi không biết.`x1`Đúng vậy.`by`, vì vậy tại đây nhập cảnh xác nhận`arg-registers`◊ động cơ chỉ so sánh các tham số của tuyên bố ◊ trong `classify`停止处,`x1`仍为 `0x5`, đó là `bump`遗留的值; và`classify`Chỉ có một tham số, vì vậy không có thể so sánh nó. Không có các tham số trong bộ lưu trữ chỉ là tiếng ồn, kết luận của bài thứ 32 không liên quan đến nó.

Lần thứ hai dừng lại là quan sát điểm, giá trị cũ 250, giá trị mới 255,`by`= 5 ⋅ toàn bộ hành trình chỉ xảy ra một lần, vì vậy `store-once`Được xác nhận.`classify`Trong ba lần thực hiện, mỗi lần có một cửa ngõ dừng và một đến hai cửa ngõ:

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

`_check_branches()`Để dừng theo hàm thực hiện các thí dụ phân nhóm, đọc phần dư của các cửa vào, và phù hợp với các từ dự đoán sau mỗi bên dừng tính toán nâng cao.`branch-1`确认三次,`branch-2`确认两次──停止 5 显示余额为255,正是观察点看写的值── đây là một lần chạy cùng một trình tự, chứng cứ kết nối lẫn nhau──

Trong dừng 10, 子从 `list`读取 24 个字:`_check_stride()`取字 1、字 9 和字 17,即偏移 4、36、68:100、255 和 -40── nó sẽ có mỗi giá trị với `classify`Trong số đó, số dư được quan sát trên cùng địa điểm, sẽ được tìm kiếm và nhận được 315, và các chương trình in lại.`sum 315`行比较── sau đó tiến trình được thực hiện ở trạng thái 0 退出,`breakpoint list`显示名称断点的命中次数为 1、3、1,四边断点为 2、1、1、──全部八个结论最终均为`confirmed`, đằng sau có 25 条记录, trong đó 23 条关联停止, hai 条关联完整运行.

## -O2 运行:零次停止

Cùng mã nguồn trong `-O2`Đây là một quy trình khác.`main`của `llvm-objdump -d`输出 chỉ có 4条 `bl`, tất cả调用 `printf`                                                                                                                                                                                                                                                              `mov w8, #-0x1``mov w8, #0x1`、 qua `xzr` cung cấp 0, cũng như giá trị là 315 `mov w8, #0x13b`取代──编译器在编译期计算了所有结果──`nm` vẫn xuất hiện `_bump``_classify`和 `_sum_balances`, vì chúng là các hàm bên ngoài, phải giữ các bản sao không liên kết để các tài liệu mục tiêu khác được sử dụng.`DW_TAG_subprogram`条目, nhưng không có gì `DW_TAG_inlined_subroutine`条目, vì vậy连调试信息也未记录这次内联──

Kế hoạch xây dựng có ba điểm kết thúc, không có điểm kết thúc.`-O2`下的 `classify`Chỉ có 6 lệnh:`ldr``cmp``cset``cmp``csinv``ret`, trong đó không có điều kiện分支── 来自 `-O0`清单边结论 trong hệ thống thứ hai này không có địa chỉ, động cơ sẽ không di chuyển chúng qua. 关于边结论属于清单确实存在该边构建.

Kết quả:

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

Mỗi đoạn đã được phân tích. Địa chỉ tồn tại, mã tồn tại, sẽ có những đoạn văn được viết ra.`BRK`Số lần đến được là không, vì không có bất kỳ chỉ dẫn nào để đến địa điểm này.

| 结论 | 判定 | 记录 |
|---|---|---|
| `calls` | 已反驳 | 完整运行以状态 0 退出后，入口停止次数为 bump 0、classify 0、sum_balances 0 |
| `output` | 已确认 | 四行输出及退出状态 0 |
| `arg-registers` | 未观察到 | 没有停止检验它，命中次数全为 0 |
| `field-offsets` | 未观察到 | 没有停止检验它 |
| `store-once` | 未观察到 | 未在 bump 停止，因此从未设置观察点 |
| `stride` | 未观察到 | 未在 sum_balances 停止 |

必须准确说明反驳的含义── nguyên kết luận là:`main`Trong chương trình này, được gọi ba hàm. Đối với lần này của cấu trúc này, nó không được điều chỉnh; trình điều khiển kiểm tra được kết thúc, vì số lần trước dự định là 0 chỉ có thể giải thích được rằng đã được thực hiện chưa được gọi. Kết luận này không tuyên bố hàm là mã chết, lần này cũng không chứng minh điều này: chúng được xuất phát, các tài liệu mục tiêu khác vẫn có thể được điều chỉnh.`balance` đặt ở vị trí 4,`-O2`DWARF cũng nói như vậy, nhưng hành trình này không ngừng đọc ghi nhớ để hiển thị nó.`not-observed`Giữ sự khác biệt này, Chương 35 sẽ giữ được các dự án chưa được biết đến mở cho đến khi một số hoạt động thực sự quan sát nó.

## Nô 转储

Core 文件将进程的内存和寄存器写到磁盘,使调试器在程序消失后仍然能读取其停止状态――Apple 的`core(5)`Nói rõ, một số ít dẫn đến tín hiệu quá trình bất thường kết thúc, cũng sẽ ghi lại ghi chép trạng thái trong quá trình vào đĩa, vị trí là `/cores/core.pid`, giả định là quá trình kết thúc có quyền viết của danh mục này, và danh mục tồn tại.`sysctl` báo cáo `kern.coredump: 1`和 `kern.corefile: /cores/core.%P`- Tôi không biết.`/cores`存在,模式为 `drwxrwxr-t root admin`, và vỏ của `ulimit -c`Vì vậy, nó được sử dụng.`ulimit -c unlimited`提高限制, hoặc dùng `launchctl limit core unlimited`系统级提高限制之前,内核不会写出核心──

Ldb 无需崩即可按需写出核心──在 `bump`断点处:

```text
(lldb) process save-core --style stack account-O0-stack.core
Saving 49152 bytes of data for memory region at 0x16fdf4000

Modified-memory or stack-memory only corefile created.  This corefile may 
not show library/framework/app binaries on a different system, or when 
those binaries have been updated/modified. Copies are not included
in this corefile.  Use --style full to include all process memory.
```

文件为 53,248 字节.

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

Trở lại và toàn bộ số đoạn hoàn hảo, vì chúng nằm trên lõi 保存的.`label`显示为空字符串, nhưng chỉ số của nó hoàn chỉnh. chỉ số của nó.`0x100000719`Đúng; nó chỉ ra các chữ cái là có thể thực hiện tài liệu .`__TEXT`段中的字面量 `"savings"`, và 式核心不包含该段. chỉ số là kết quả quan sát,字符串 không thể sử dụng,lldb sẽ không tạo nó.`--style full`包含全部进程内存; trên nghiên cứu机器, bộ lõi hoàn chỉnh của chương trình 34 KB  đạt 2.1 GB, vì quá trình đã hiển thị lưu trữ chia sẻ.`ESR_EC_BRK_AARCH64`:core  ghi lại các điểm khởi động `BRK`异常──

Linux 内核根据 `/proc/sys/kernel/core_pattern`写出核心,这个模板用 `%p`Tự chỉ PID`%e`Chỉ định tên,`%s`Khả năng biểu hiện`%t`表示时间,前导 `|` sẽ được chuyển lưu thông qua đường ống giao thông.`systemd-coredump`, tái sử dụng`coredumpctl list``info``dump`和 `debug`取回保存的数据──`gdb prog core`和 `lldb -c core prog`Thành phố sẽ mở ra kết quả.

## gdb với lldb đối với

两个调试器用不同命令完成相同工作──驱动器中的 `COMMAND_MAP`Có 35 đường, có thể qua `python3 code/main.py commands`打印──本课使用的如下:

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

Trong lldb,`p` `dwim-print`                                                                                                                                                                                                                                                              `frame variable`路径打印,其他情况回归到 `expression``v`Đó là`frame variable`◊ động cơ trong nên sử dụng ưu tiên `frame variable`:它读取 DWARF 位置,从未被调试过程中执行代码──

Các phiên bản và giấy phép thông tin cho đến năm 2026-10-14。lldb Sử dụng LLVM 版本号,llvm.org 当前发布版为 2026-10-06 发布的LLVM 23.1.3,采用附带LLVM 例外的Apache License 2.0。Homebrew 通过独立公式 `lldb`提供它. 提供机器的命令线工具 提供果自编号的 提供果自编号的`lldb-1703.0.236.21`,嵌入 Python 3.9.6; Apple's lldb 已具备调试签名──GDB 18.1 于 2026-09-25 发布,采用GPL-3.0 hoặc sau hơn──发布说明列出 Windows──`.gdb_index`、AArch64 `FPMR`和 Python `gdb.Corefile`截至 18.1,GDB  chưa có nguồn gốc hỗ trợ Apple silicon 进程:2025 tháng 10 đã được phát hành bao gồm 15 sửa chữa  Bộ hỗ trợ ban đầu của AArch64-Darwin 系列,2026 tháng 2 người bảo vệ đã giải thích trước khi hoàn thành quyền chuyển quyền và BFD  sửa chữa của HOMEBRUE `gdb`Công thức có bộ phận cơ cấu, nhưng trong khi xây dựng giả mạo là`--target=x86_64-apple-darwin20`;加入这些包的 PR 明确说明不能通过 GDB 调试 aarch64-darwin 二进制──macOS 上的任何非果调试器也需要自签证和 `com.apple.security.cs.debugger`权限,否则 `task_for_pid`会以(os/kern) thất bại (0x5)失败──本课程将gdb 用于Linux,Debian stable 在 arm64 上提供gdb 16.3,`rr`Cũng chạy ở đó.

## Theo dõi: tiến trình tiến hành trong hạt nhân đã yêu cầu gì

调试器显示程序停止时的状态,跟踪器则显示程序对系统的影响,而不长时间停止程序――工具按操作系统区分――

| 工具 | 操作系统 | 版本 | 许可证 | 记录内容 |
|---|---|---|---|---|
| `strace` | Linux | 7.2，2026-08-18 | LGPL-2.1-or-later | 系统调用及参数和返回值 |
| `ltrace` | Linux | 最后发布的 tarball 为 0.7.3，Debian 使用 git 快照 | GPL-2.0 | 动态库调用 |
| `bpftrace` | Linux | v0.27.0，2026-09-10 | Apache-2.0 | 通过 eBPF 记录内核和用户态探针 |
| `dtrace` 和 `dtruss` | macOS | macOS 26.2 中为 `Sun D 1.19` | CDDL，源自 Sun OpenSolaris | D 探针；`dtruss` 打印系统调用 |

`dtruss`手册说明:Dựa trên DTrace, chỉ có người dùng có quyền root mới có thể thực hiện lệnh này.`dtrace(1)`补充: 在默认系统完整性保护设置下, không cho phép D 程序 truy cập nội dung địa chỉ trong lõi hoặc nội dung trong lõi , và SIP 下不允许破坏性操作──本课没有在此机器上运行`sudo dtruss ./account-O0`, vì ổ đĩa không sử dụng root,并将此记录为未验证. Câu hỏi theo dõi khác với ổ đĩa:`printf`发发发 `write`是 theo dõi vấn đề;  đến `bump`时 `x1`Có phải lưu 5 là vấn đề của điều tra máy.

## 记录与重放

`rr`记录一次运行, và gdb 下确定性重放, hỗ trợ ngược hướng thực hiện: đối với quan tâm của giá trị thiết lập quan sát điểm,`reverse-cont`Dự án tự kể là: chỉ cần ghi lại một lần thất bại, sau đó có thể theo yêu cầu nhiều lần xác định điều tra bản ghi. Phiên bản phát hành hiện tại là 5.9.0 của 2025-02-13, sử dụng MIT  giấy phép và chứa BSD-2-Cụ thể 部分.

Gdb cũng có bộ ghi chép phần mềm riêng.`record full`记录进程执行日志,默认上限为200,000条命令;`record btrace`Sử dụng Intel 分支跟踪,不记录数据──lldb không cung cấp hai chức năng này── trên máy MacOS 机器, văn bản lưu trữ ổ đĩa là ghi chép: cùng một kế hoạch hoạt động trên cùng một hệ thống, sẽ tạo ra cùng một thứ tự, thử nghiệm mẫu đã cố định thứ tự này──

## Một lần chạy bộ có thể chứng minh điều gì

Một lần chạy chỉ chứng minh một nhập vào trên một cấu trúc. C  tiêu chuẩn sẽ không xác định hành vi được định nghĩa là:  sử dụng không thể di chuyển hoặc sai lệch của các chương trình xây dựng hoặc dữ liệu sai lệch, trong tài liệu này không áp dụng bất kỳ yêu cầu nào.`int`溢出程序在 `-O0`和 `-O2`下合法地产生不同结果.`percent_change`溢出单元中遇过这种情况――UBSan sẽ chuyển đổi vấn đề thành dừng:`-fsanitize=signed-integer-overflow -fsanitize-trap=undefined`Việc thực hiện lệnh bắt buộc, dừng lại trong tình trạng hình thành trong LLDB.

优化代码还会移动你希望观察的内容──GDB 手册说明,优化器重排你的代码,调试器显示现实存在的内容; được优化到不存在的变量是GDB 永远看不到的变量──GDB 将这种值打印为`<optimized out>`, nguồn mã sẽ nó với `<unavailable>`区分: trước đây không tồn tại trong chương trình, sau đây không tồn tại trong chương trình, nhưng GDB không thể lấy được.`<variable not available>` Đài đặt biến số nội bộ trong ký 存器 không kích hoạt, vì ký 存器 không phải là ký 存器.`-O2`运行 đã thể hiện tình huống cực đoan: toàn bộ hàm được gấp, từ giờ không đặt quan sát giữ yên lặng, không thể chứng minh bất cứ điều gì.

Vì vậy, động cơ chỉ viết 3 bản ghi, không viết 4 bản ghi.`confirmed`;检验后不一致,为 `refuted`Không có bất cứ sự dừng lại nào có thể kiểm tra, vì`not-observed`, và kết hợp nguyên nhân, số lần quyết định cũng là một phần của nguyên nhân.`controlled-replay`của `observed`记录,将第三种保留为开放未知项──

## Trong macOS lên chỉ điều chỉnh cấu trúc của riêng bạn

Trên silicon của Apple, các liên kết sẽ được ký tên cho bạn.`ld(1)`Đối với`-adhoc_codesign`Apple Silicon 二进制默认进行 ad-hoc 签名对样例运行 `codesign -dvvv account-O0`Ước gì:

```text
Format=Mach-O thin (arm64)
CodeDirectory v=20400 size=387 flags=0x20002(adhoc,linker-signed) hashes=9+0 location=embedded
Signature=adhoc
TeamIdentifier=not set
```

`0x20002` `CS_ADHOC`(`0x2`(加)`CS_LINKER_SIGNED`(`0x20000`), sau đó được giải thích trong Apple 代码签名头文件为由链接器自动签名──`codesign -d --entitlements -`Trong có thể thực hiện tên của tài liệu sau đó không in bất kỳ nội dung nào:`DevToolsSecurity -status`报告Developer mode hiện đang vô hiệu ● trong trường hợp được kích hoạt bảo vệ tính toàn diện hệ thống,lldb vẫn đã kích hoạt nó ● định mệnh toàn bộ các đoạn 设置硬件观察点并写出核心──

2 quyền kiểm soát ai có thể điều tra ai, phân biệt nằm ở hai bên.`com.apple.security.cs.debugger`属于调试器: 一个布尔值,表示应用是否是调试器,以及能否附加其他进程或获取任务端口──Apple 的 `debugserver`携带其私有形式;对命令线工具中副本运行 `codesign -d --entitlements -`,会列出 `com.apple.private.cs.debugger``com.apple.private.set-exception-port``com.apple.private.thread-set-state`和 `com.apple.private.logging.diagnostic``com.apple.security.get-task-allow`属于目标.Xcode sẽ được nhập vào các thiết kế, được di chuyển khi xuất, và công chứng nhận từ chối vẫn mang theo các hệ thống thứ hai.`get-task-allow`Khi đó, nhiệm vụ sẽ bị từ chối.`clang`建没有强化运行时,不触发该拒绝条件――如果曾经使用`codesign --options runtime`给样例签名,调试前需使用 `codesign -s - -f --entitlements get-task-allow.plist`重新签名:

Ngoài ra có ba sự thật. Thứ nhất, trong lần đầu tiên调试 trong login会话, có thể thấy Developer Tools Access cần phải kiểm soát một quá trình khác để gỡ lỗi để tiếp tục dialog box;`sudo DevToolsSecurity -enable`Có vì`admin`Hoặc`_developer`组成员免去额外密码──第二,调试自己的代码无需关闭SIP──Apple 解释从Xcode 运行和调试应用无需关闭SIP;涉及调试的SIP组件,仅仅是`csrutil enable --without debug`Để người khác tự do hơn, thứ ba, chiếc dây an toàn của cuộc họp đã hoàn toàn ngăn chặn.`task_for_pid`,样例 `sandbox-O0.lldb.txt` trình bày kết quả.  Không thể khởi động hoạt động thuộc về thực tế môi trường, động cơ cũng như báo cáo.

Tất cả mọi thứ trong bài học này đều áp dụng cho các quy trình tự biên dịch của bạn. Chỉ khi chủ sở hữu của một quy trình khác tích cực cho phép, chỉ có thể thêm vào nó cùng một lệnh; bài học này không dạy cách thay đổi điều kiện này.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program
python3 code/main.py
```

输出 dựa trên một bản ghi JSON đã được lưu giữ. 报告 cũng chứa các bản ghi chính 保存 tải về trở lại, kết quả của Python API 沙箱 thất bại, cũng như các công cụ bên ngoài nào trong cơ sở này thiếu.

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

按以下顺序阅读 `code/main.py`- Có thể là:

1. `Listing`sẽ`llvm-objdump -d`文本解析为函数和命令,`Function.conditional_branches()`查找分支及目标与顺序落下地址──
2. `struct_layout()`Từ `llvm-dwarfdump`文本读取 cấu trúc体和成员条目──
3. `lift_condition()`Để một điều kiện phân支 chuyển thành từ, đó là thứ 34 课针对`tbz``cbz`和比较后分支形式的提升步骤──
4. `Plan.commands()`Theo đơn sơ của LLDB,`Plan.lldb_command()`提供批处理调用。
5. `parse_transcript()`按顺序遍历输出, cấu trúc chứa寄存器、内存、变量和观察点值`Stop`记录, cũng như kết thúc và xuất hiện trạng thái.
6. `claims_for()`声明八个结论,`evaluate()`Sử dụng `_check_*`函数逐次停止评判它们──
7. `rollup()`Sẽ ghi lại về mỗi kết luận một phán quyết, phản bác ưu tiên hơn là xác nhận.
8. `capture()`和 `capture_extras()`生成例;当 `clang`和 `lldb`Có vận hành,`live()`Trong xây dựng mới, tái tạo toàn bộ quy trình.

Còn bốn lệnh nữa.`python3 code/main.py plan O0`打印某构建的命令文件;`python3 code/main.py commands`打印 gdb 和 lldb đối với bảng照;`python3 code/main.py tools` báo cáo `PATH`Có bất kỳ công cụ bên ngoài nào;`python3 code/main.py live O0`sẽ`account.c`编译到临时目录,根据新清单制定计划,运行 lldb,再根据本次运行评判结论──在沙箱内,它报告 lldb 无法启动进程,附带错误,并以 1 退出──

##  thực tế sử dụng

Theo quy trình sau đây sẽ sử dụng các trình điều khiển cho các chương trình của riêng mình.

1. Sử dụng `-g`Và kế hoạch giao dịch cấp độ tối ưu hóa xây dựng.`llvm-objdump -d`文本 cùng lưu trữ
2. 运行前写出结论―― mỗi mục chỉ định hàm,寄存器 hoặc địa chỉ hoặc chuyển hướng, giá trị dự kiến hoặc边, cũng như nguồn gốc của nó khóa học hoặc tài liệu―― xem dừng lại sau khi viết kết luận chỉ trong mô tả dừng lại, kiểm tra không có bất cứ điều gì――
3. 根据清单生成计划并阅读──每个地址都应追溯到清单的一行──若断点没有对应行,就删除它──
4. Trong chế độ xử lý hàng loạt, lưu giữ hồ sơ cuộc họp, và trong đầu ghi lại lệnh và phiên bản điều tra.
5. 进行判定──阅读 确认结果之前,先读每条 `not-observed`记录及原因──原因 sẽ cho bạn biết những kết luận cần các đầu vào khác, các cấu trúc khác hoặc các kết luận khác.
6. Sử dụng cùng kết luận vận hành tối ưu hóa cấu trúc.
7. Sẽ được xác nhận và đã phản đối như là ghi chép`observed`、 quyền lực nguồn gốc `controlled-replay`写入第 35 课账本,每次停止一条记录──未观察的结论仍作为未知项,附上断点命中次数──

## 交互实验

### 实验 A:手工读取一次停止

Từ `code`目录启动 Python:

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

执行第二行之前,先写下预期哪个字保存 250,哪两个字保存 1.25──然后运行 `struct.unpack("<d", struct.pack("<II", s.memory[4], s.memory[5]))`Không so sánh... tiếp tục xem`t.stops[1].watch_hit`和 `t.stops[1].pc`, trong `account-O0.objdump.txt`Trong tìm thấy địa chỉ này: Đó là chỉ thị sau khi lưu trữ.

### 实验 B:分支与后继

```python
plan = make_plan("O0")
plan.branches()
classify = plan.listing.function("classify")
[lift_condition(classify, b, "a->balance")[0] for b in plan.branches()]
[(hex(s.pc), s.struct_pointer().field_int("balance")) for s in t.stops_in("classify")]
```

Sẽ mỗi bên dừng lại và cửa vào dừng lại phù hợp, trước khi xem bằng chứng, quyết định được gọi là lời tiên đoán sau đó.`[e.to_dict() for e in evaluate(plan, t, struct_layout(open("fixtures/account-O0.dwarfdump.txt").read(), "account")) if e.claim.startswith("branch")]`Không so sánh.

### 实验 C: 从未停止的运行

```python
o2 = load_transcript("session-O2.lldb.txt")
len(o2.stops), o2.exit_status, o2.hits()
o2.errors[:3]
make_plan("O2").branches()
rollup(evaluate(make_plan("O2"), o2, struct_layout(open("fixtures/account-O2.dwarfdump.txt").read(), "account")))
```

Với câu nói của riêng mình giải thích cho mỗi người.`not-observed`, rồi mở ra`account-O2.objdump.txt`, tìm thấy `main`Trung thay thế调用四常量──再用 `count_tags()`统计 `account-O2.dwarfdump.txt`Trung `DW_TAG_inlined_subroutine`

### 实验 D:破坏证据

```python
text = open("fixtures/session-O0.lldb.txt").read().replace("x1 = 0x0000000000000005", "x1 = 0x0000000000000006", 1)
broken = parse_transcript(text)
[e.to_dict() for e in evaluate(plan, broken, struct_layout(open("fixtures/account-O0.dwarfdump.txt").read(), "account")) if e.claim == "arg-registers"][:2]
```

 sửa đổi một bộ ghi nhớ, sẽ làm bài đầu tiên `arg-registers`记录及汇总变为 `refuted`, còn lại 4 lối vào vẫn còn`confirmed`                                                                                                                                                                                                                                                              `old value: 250`行,观察 `store-once`变为 `not-observed`Không thể được cố ý làm sai máy phán quyết, không hề trong phán quyết.

Nếu Ildb có thể khởi động quá trình trong vỏ của bạn, cuối cùng chạy `python3 main.py live O0`和 `python3 main.py live O2` địa điểm sẽ khác với ví dụ, định không nên thay đổi

## 实践实验

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `sum_balances`Kết luận của chu kỳ:

要求:

- Sử dụng `conditional_branches()`Trong `-O0`清单中找到 `sum_balances`Trong vòng quay, trong vòng quay tăng điểm.
- 增加结论:当 `count`= 3 时, vòng đầu thực hiện`count + 1`Thứ hai, điều này đối với phần 33 của bài học và thêm vào kiểm tra xuất học.
-  mở rộng dừng 子 hoặc kế hoạch, để 子 đọc 槽 của máy tính vòng trong mỗi vòng dừng 子`_check_loop()`记录计计器值序列──
- Trong bộ máy của Ildb có thể khởi động quá trình, sử dụng`python3 main.py capture O0`重新捕获会话并重跑套件── Trước khi các đơn lệnh được gửi phù hợp với kế hoạch mới, kế hoạch thử nghiệm sẽ thất bại, đó chính là mục đích của bài kiểm tra──
- 增加测试, sửa đổi một tính toán trong hồ sơ,并断言结论变为 `refuted`

Kiểm chuẩn thành công là: báo cáo theo thứ tự hiển thị vòng dừng và giá trị máy tính, và`-O2`运行将新结论保留为 `not-observed`, nguyên nhân là vòng được định lượng hoặc gấp loại bỏ.

## 本课产物

本课包含 `outputs/skill-dynamic-analysis-of-your-own-program.md` Sử dụng nó sẽ tự xây dựng các quy trình, đơn giản và tĩnh kết luận danh sách chuyển thành một lưu trữ điều tra viên cuộc họp ghi chép, cũng như mỗi kết luận một phán quyết, kèm theo để tạo ra kết luận nhất định dừng và mỗi kết luận không quan sát được nguyên nhân.

## 验证

运行演示和确定性套件:

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

套件无需 lldb 即可运行, nó đọc một lần bắt giữ `code/fixtures/`                                                                                                                                                                                                                                                              

- 清单解析器 tìm bốn hàm và phạm vi của nó, cũng như `-O0`下 `classify`Hai điều kiện chia rẽ, mục tiêu và thứ tự
- `tbz w8, #0x1f`提升为`a->balance >= 0`- Tôi không biết.`subs`加 `b.le`提升为`a->balance <= 200`
- `-O0`下 `main`调用 `bump`3 lần`classify`和 `sum_balances`- Tôi không biết.`-O2`下 `main`Chỉ cần điều chỉnh `printf`
- x86-64 của `j<cc>`助记符 thuộc điều kiện分支,`jmp`和 `callq`Không thuộc
- DWARF 转储产生大小 32 字节、成员位于 0、4、8、16、24 的结构体
- `-O2`DWARF có 4 chương trình, 0 chương trình liên kết,`nm`仍然列出三个函数
- Hai kế hoạch xây dựng đều có liên quan đến các văn bản lệnh gửi, ví dụ như, các văn bản bản văn bản thực tế
- `-O0`会话 trong hàm dự đoán có mười lần dừng, trạng thái xuất phát là 0, chứa bốn dòng xuất phát
- 子输出附加到其后的停止, trong đó `x1`= 5,内存从 `x0`开始,并包含标签字符串
- 断点表携带解析状态, số lượng lượt định mệnh là 1、3、1、2、1、1
- 观察点为 `x0 + 4`处的 4 字节 sửa đổi 类型,命中一次,旧值 250、新值 255,并报告四硬件槽位
- `-O2`会话没有停止,三个已解断点均零命中,没有观察点,每个未使用的`continue`Đàn đối phó với một sai lầm
- 沙箱 khởi động trong bất kỳ dừng trước vì lỗi thêm thất bại
- core 保存加载往返 保留回溯和 `balance`= 250, nhưng mất đi`label`指向的字符串
- Python API 无需进程即可读取五字段、大小 32 和函数范围
- 手写 x86-64 会话能解析 `rdi``rsi`和 `rip`
- `-O0`Các kết luận đã được xác nhận, phân biệt có 5、11、3、2、1、1、1 条 条
- 分支证指明值,条件和边
- 字段偏移证据通过 DWARF 布局解码各个字
- 存储和步长证据携带新旧值及三行余额
- `-O2`运行反驳调用边,将其他结论保留为未观察
- 修改寄存器值会被反驳,删除观察点命中会被未观察,汇总时反驳优先
- 命令映射每行均有gdb 和 lldb 形式,硬件表列出四个x86 调试寄存器
- 演示列出缺失工具而不是失败,实时模式按名称报告缺失工具
- 图像 dữ liệu từ hai cuộc họp, các mô-đun điểm đặt vào dữ liệu tương tự

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

Theo kế hoạch kiểm toán dừng, chạy một lần theo chế độ xử lý hàng loạt, giữ hồ sơ họp, và đánh giá nó ở điểm dừng mỗi lần kiểm tra kết luận tĩnh tĩnh nào đó. Chỉ viết xác nhận hoặc phản bác từ chứng cứ dừng; không được quan sát khi viết số lần và nguyên nhân trong quyết định, không bao giờ sử dụng điểm đã giải quyết thay thế một lần chạy. Chỉ điều chỉnh các quy trình tự xây dựng.

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
