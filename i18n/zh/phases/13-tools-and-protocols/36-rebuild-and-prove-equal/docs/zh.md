# 重建并证明等价:差分测试、字节比较与证据闭环

> 测试通过只能证明这些测试的结果一致;为了支持等价格,需要覆盖每个边界的输入网格,以及屏蔽重新定位后仍然匹配的字节.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 34（提升为伪代码）、Phase 13 · 35（证据、置信度与未知项）
**Time:** ~110 分钟

## 学习目标

- 根据指令清单编写重建实现,并指出依据的证据记录.
- 为了每类风险建立输入网格:零值保护,负数,向零截断的除法,32位溢出和除法陷.
- 在同一程序中运行原始函数和重建函数,记录每个输入单元,包括陷.
- 使用原始编译参数重新编译重建实现,屏蔽重定位字段后比较函数数字节──
- 读取并比重定位指向常量,防止错误字面量被混通.
- 通过小型的工作室客户端驱动的MCP服务器,并为每一步记录证标识符.
- 生成采用保守失败原则的证明记录,其标识由断言和证据链接的哈希构成.

## 问题

你向真人求具`ledger-x86_64-O1.o`中 中`percent_change`根据Ghidra 12.1.4 返回伪代码,智能体写出以下C代码:

```c
int percent_change(int before, int after) {
    if (before == 0) return 0;
    return (int)(((long)after - before) * 100 / before);
}
```

通过四个测试:`(100, 150)`得到50个`(200, 100)`得到 -50`(0, 5)`得到了0`(50, 100)`得到100个.`grade`基于90807060的四个模型.`if`语句,另外六个测试也通过了.

但该报告没有回答下列任何问题:

- 当 当`(after - before) * 100`无法使用32位表示时,原始函数返回什么?
- 分数为110时,原始函数返回什么?
- 重建实现能否编译成原始函数相同的16字节?
- 两个编译后函数的字节相同时,它们的重定位是否指向相同常量?
- 重建实现来自哪条证据记录?智能体读的是指令清单,还是伪代码?
- 宿主机没有C编译器时,证明应是什么状态?

本课程的每一个目标都是我们自己编写和编译的程序. 第32节课程的范围和法律规则仍然适用,不变.

```figure
re-36-prove-equal
```

## 证据说明了什么

`code/main.py`通过工作室发出了6次调整,运行记录位于`code/fixtures/runs/agent-run.json`△服务器对`initialize`应对包含协议版本`2025-11-25`◎其中三次调用回归证据记录:

| 步骤 | 工具 | 耗时 | 证据标识符 |
|---|---|---|---|
| 2 | `analyze_function percent_change` | 6.31 秒 | `ev_e88b10dc0c6400e51bb6f7fdc3eaea8d2c97cc02463f0db3e6afeefc273197cd` |
| 3 | `analyze_function grade` | 0.02 秒 | `ev_67b6d3f992eaf49a2e16de084b6ebfdd9884e8c5c7f75e175b7bb20f4f748ce1` |
| 4 | `read_bytes 0x1000b4, 20` | 0.00 秒 | `ev_c26146cfedf4c1ee146d8ff00cfa9a5d3f5335bdd9c97ccf4e1af5f6ea3ed6bc` |

第一次调用承担了Ghidra 导入和自动分析的开销.`confidence: "observed"`,我知道.`authority: "shipped-artifact"`目标文件的SHA-256:`9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f`  载可重定位目标文件时,将 `.text`放在一个地方`0x100000`为了`percent_change`位于`0x100000`没有任何`grade`位于`0x100010`,我知道.

`long`现在`percent_change`现在,我们要做什么?

```c
undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)
{
  long lVar1;
  undefined1 auVar3 [16];
  if (param_1 != 0) {
    lVar1 = (long)((param_2 - param_1) * 100);
    auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
    auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
    return auVar3;
  }
  ...
}
```

反编译器看`cltd`和 `idivl`同时写入`edx`与`eax`便将其建模为使用64位除法16字节返回值.

```
0x100000: TEST EDI, EDI
0x100002: JZ 0x0010000d
0x100004: SUB ESI, EDI
0x100006: IMUL EAX, ESI, 0x64
0x100009: CDQ
0x10000a: IDIV EDI
0x10000c: RET
0x10000d: XOR EAX, EAX
0x10000f: RET
```

每个操作都是32位宽.`IMUL EAX, ESI, 0x64`执行32位乘法,只保留低半部分.`CDQ`将`eax`的符号扩展到`edx`没有任何`IDIV EDI`则使用32位除数去除这个64位寄存器对──按指令清单重建,应使用`int`类型`100 * (after - before) / before`,我知道.

`grade`记录也是如此.`*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)`给了一个`0x66666667`构成难以阅读默认表达式.`IMUL RAX, RAX, 0x66666667`,我知道.`SAR RCX, 0x22`,我知道.`SHR RAX, 0x3f`,我知道.`ADD ECX, EAX`实现除以10次.`ADD ECX, -0x6`,我知道.`CMP ECX, 0x4`和 `JA`保留十位商 6 至 10 │比较前`XOR EAX, EAX`给出默认值 0`LEA RCX, [0x1000b4]`和 `MOV EAX, dword ptr [RCX + RAX*0x4]`读取包含五个 4 字节条目的表.

步骤 4 读出这20个字节:`01000000 02000000 03000000 04000000 04000000`│表的内容为`1, 2, 3, 4, 4`对于应位商 6、7、8、9、10──这就是`ledger.c`中中 `switch`在其中`case 10`和 `case 9`共用值4──

实际上,自证页面中的两个证据都来自指令清单和对常量执行.`read_bytes`开始――DX-Ball最初的伪代码是没有输入的`FUN_00406400(void)`命令视图纠正了它.

## 编写候选实现

`code/fixtures/candidates/`目录包含八个重建实现,每个文件都有一个函数.其中四个遵循指令清单,或可以编译为相同的代码.

| 文件 | 源码 | 作用 |
|---|---|---|
| `percent_change_mul_first.c` | `100 * (after - before) / before` | 指令清单的 C 表达 |
| `percent_change_split.c` | `(after * 100 - before * 100) / before` | 文本不同，clang 折叠后字节相同 |
| `percent_change_wide.c` | `(int)(((long)after - before) * 100 / before)` | 沿用伪代码的 `long`，先除法再截回 |
| `percent_change_div_first.c` | `(after - before) / before * 100` | 先做除法，因此舍入不同 |
| `grade_switch.c` | 带五个分支的 `switch (score / 10)` | 原始源码 |
| `grade_table.c` | `unsigned slot = score / 10 - 6; slot < 5 ? points[slot] : 0` | 指令清单的 C 表达 |
| `grade_thresholds.c` | `if (score >= 90) return 4; ...` | 最高分段没有上界 |
| `grade_case10_wrong.c` | `case 10: return 3;` | 一个表条目错误 |

每个文件都用了具命令.`clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c`编译――编译后的目标文件与源码一起提交,以便没有的宿主机也能运行测试――

## 第一条验证路径:执行并比较

麦克基曼在1998年对差分测试的定义要求将机械生成的测试例输入两个或更多可比系统,并将不同结果起或崩视为缺陷候选人.他指出了难点:测试中最棘手的问题是评测结果.这里使用原始函数作为参考基准. 我们不必预先知道正确的答案,只需要在覆盖每个类型的输入网格上,确保原始实现和重建实现任何不一致.

### 设计输入网格

`code/main.py`中中 `input_grid()`构建92个单元.`percent_change`现在我还在做.`before`值和七个`after`价值所有配对:

```
before: 0, 1, -1, 3, -3, 7, 100, -100, 2147483647, -2147483648
after:  0, 5, -5, 105, 536870911, 2147483647, -2147483648
```

对于`grade`它们分别是22个分数:每分段边界的两侧,负数,0,110,以及两个`int`极值――`classify()`为每单元加标签:溢出32个 个 负数17个 边界14个 普通12个 零值保护7个;负数切断5个 舍进2个 超出开关 范围2个 陷1个 个 个

每个类别都有明确的目的.`TEST EDI, EDI`分支──负数单元检查向零截断的除法:C 和 `idiv`进零零,因此`-9 / 10`为0,`-10 / 10`为 -1――舍入单元检查乘法先于除法,因此 `(105 - 100) * 100 / 100`为5而不是0――溢出单元使`(after - before) * 100`超出32位. 唯一的陷单元让回绕后的乘积等于`INT_MIN`同时`before`为 -1 个

、陈、艾德 和 雷赫构建了Csmith,用于生成未定义行为程序.对未定义行为的参考结果分歧只是噪音,不应形成缺陷报告.C中有符号溢出属于未定义行为;但在这里的参考基准是行为已确定编译目标文件,因此溢出单元仍然在范围内.关键是确定哪些单元依赖语言标准,哪些依赖编译后的字节.

### 驱动程序与陷

`code/driver.c`从每行读取一个单元,输出输入,原始结果和重建结果.`build_harness()`用`-Dpercent_change=cand_percent_change -Dgrade=cand_grade`在 x86-64 Linux 主机上,原始实现是具目标文件本身;在其他主机上,则是原生编译的.`ledger.c`报告会记录`original_kind: fixture-source`,我知道.

驱动程序使用`sigsetjmp`和 `siglongjmp`装备`SIGFPE`处理器.`before = -1`,我知道.`after = 536870911`时,差为 536870912,32位乘积回绕到 -2147483648──在 x86-64 上,`idiv`由于商无法使用32位表示,将其转化为记录值.`trap`,我知道.

上64`sdiv`不触发陷,同样的操作数会返回 -2147483648──我们在 arm64 Mac 上运行恰好记录了这一结果──参考结果依赖于架构,因此报告必须说明实际运行的架构──

### 结果

`prove_behaviour(PLAUSIBLE)`构建使用`long`十个简单的例子通过,但网格中28个单元失败:

| 函数 | 输入 | 类别 | 原始结果 | 重建结果 |
|---|---|---|---|---|
| `percent_change` | 3, 2147483647 | 溢出 | -133 | -1431655899 |
| `percent_change` | 100, 2147483647 | 溢出 | -101 | 2147483547 |
| `percent_change` | 2147483647, 5 | 溢出 | 0 | -99 |
| `grade` | 110 | 超出 switch 范围 | 0 | 4 |
| `grade` | 2147483647 | 超出 switch 范围 | 0 | 4 |

`percent_change`失败的26次都发生在`|before| > 1`现在的单元上溢出.`before`为 1 或 -1 时,64 位的交易截回后恰好等于回绕值,因此这些单元只是偶然一致.`grade`失败,是因为原始交换没有十位商为11及以上分支,而`110 / 10`为11个

`prove_behaviour(EQUAL)`构建`percent_change_mul_first.c`和 `grade_switch.c`总共有92个单元一致.`percent_change_div_first.c`在四个简单的例子中,失败了两个,这是手写测试确实能发现的错误之一.

`oracle_disagreements()`还要查看另一个问题.`percent_change_model()`和 `grade_model()`是指令清单的 Python 模型,使用 `wrap32()`表达 32 位乘法,使用 `idiv32()`报告对每个单元的模型与实际观察的原始结果进行比较.零分歧意味着模型和二进制程序在所有这些单元上一致.模型是推导证据,运行是观察证据;报告将保持两者之间的不同段落.

## 第二条验证路径:重新编译并比较

网格上的行为是一条验证路径――第二条路径考察:使用相同编译器和参数编译重建实现,是否产生相同字节――DX-Ball 项目报告其辅助函数63字节匹配,TH04 项目报告 2,139字节匹配,两者都使用各自年代的编译器――rea 自身无法完成这项工作;它的`compare_functions`对于提供方文的逐行比较,并附带限制:汇编是不透明的提供方文;无法进行重定位规范化

### 读取目标文件

`code/main.py`中中 `ElfObject`用`struct.unpack_from`读取一个 ELF64 可重定位目标文件. 它检查了数量,64位类别,小端数据,`e_machine`其他`e_type`1,然后遍历节头,字符串表,`.symtab`及每个`.rela`在中,`percent_change`从`.text`偏移 0 开始,大小16;`grade`从`0x10`开始,大小 46;`total`从`0x40`开始,大小31;`grade_label`从`0x60`开始,大小 63..

`percent_change`的 16 字节为`85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3`没有重定位.`grade`有一条:函数内偏移`0x26`类型`R_X86_64_PC32`符号`.rodata`增加数量`0x10`,它属于偏移.`0x23`处的7字节`leaq`它们的最后四节是移动的节目.

### 预屏蔽,再比较记录

在RELA 目标文件中,加数存储在重定位记录中,四个字段字节均为零.`grade_switch.o`因此,即使两个重定位向不同的位置,直接字节比较仍然会通过.`mask_relocations()`仍将两侧字段清零,类似的方法也适用于加数存放在字段中的REL 目标文件和Mach-O──

随后`prove_bytes()`按偏移,类型和目标节比较重定位记录.`.rodata+0x10`候选人`.rodata-0x4`由于候选人目标文件的转换表前面没有`labels.rel`表――不同加数意味着不同偏移,不一定意味着函数不同――

### 读取重定位指向的常量

对于位于命令末尾的PC 相对字段,CPU加上是下一条命令地址,因此目标为符号加数加4──原始文件中是`.rodata+0x14`候选人是`.rodata+0x0`,我知道.`read_table()`从此读取五个四字节条目,两者都是`1, 2, 3, 4, 4`,我知道.

数量五来自指令清单:`CMP ECX, 0x4`配合`JA`允许索引 0 至 4,而`[RCX + RAX*0x4]`对于每个索引读取4字节.`code/main.py`中中 `CLAIMS`记录了`grade`现在,我们已经开始了.`percent_change`没有重定位.

这一步源于TH08 项目记录的一个缺陷.旧的比较方法把目标地址填写到命令重定位字段,再比较命令字节,但不检查该地址处的浮点字面量数据.`0.0`似乎是目标.`128.0`完全一致. 修复时审计了1548个浮点字面量引用,又纠正了12个部分.`grade_case10_wrong.c`是本课程构建的同类错误:其46字节代码与原始一致,重定位记录结构也相同,但表为`1, 2, 3, 4, 3`只有常量检查才能让它失败.

### 结果

| 候选 | 大小 | 屏蔽后的字节 | 重定位记录 | 表 | 状态 |
|---|---|---|---|---|---|
| `percent_change_mul_first` | 16 对 16 | 相同 | 无 | 无 | pass |
| `percent_change_split` | 16 对 16 | 相同 | 无 | 无 | pass |
| `percent_change_wide` | 16 对 26 | 大小不同 | 无 | 无 | fail |
| `percent_change_div_first` | 16 对 18 | 大小不同 | 无 | 无 | fail |
| `grade_switch` | 46 对 46 | 相同 | 结构相同 | 两者均为 `1,2,3,4,4` | pass |
| `grade_table` | 46 对 46 | 相同 | 结构相同 | 两者均为 `1,2,3,4,4` | pass |
| `grade_thresholds` | 46 对 39 | 大小不同 | 1 对 0 | 无 | fail |
| `grade_case10_wrong` | 46 对 46 | 相同 | 结构相同 | `1,2,3,4,4` 对 `1,2,3,4,3` | fail |

两种结果值得一遍看.`percent_change_split.c`字节完全相同,因为将有符号溢出视为未定义行为,把`after * 100 - before * 100`折叠为一次乘法.`grade_table.c`也逐字节匹配,说明编译器从数组索引和`switch`得到相同的表.字节匹配证明:这个编译器使用这些参数,将实现编译为相同的代码;它不证明候选是原始源码文本.

大小是诊断信息,不是接受条件. 地区证据页面记录了一个1,825字节的候选人,长度正确但有467字节不同.`wide`重建有26字节,是因为`movslq`,我知道.`imulq`,我知道.`cqto`和 `idivq`在任何编译发生之前,指令清单已经告诉我们宽度.

## 通过实际运行智能体循环

没有应对CLI命令的65个MCP工具,`verify_reconstruction`这就是其中之一.`code/main.py`中中 `McpStdioClient`是能够调用它们的最小客户端.`npx -y rea-agents@6.5.0 mcp`通过一个 JSON-RPC 请求,并从线程中读取一个 JSON 对象.`2025-11-25`发送`initialize`发发`notifications/initialized`最后发`tools/call`△每次调用默认截止时间为330秒,与实际允许的冷启动时间相同.

`agent_loop()`发出六次调用并记录每次:

```json
{
  "step": 2,
  "tool": "analyze_function",
  "arguments": {"procedure": "percent_change"},
  "seconds": 6.31,
  "is_error": false,
  "evidence_id": "ev_e88b10dc0c6400e51bb6f7fdc3eaea8d2c97cc02463f0db3e6afeefc273197cd",
  "confidence": "observed",
  "authority": "shipped-artifact",
  "limitations": ["Resolved reference metadata identifies computed, indirect, external, call, jump, and data edges; unresolved targetless flows remain unknown, and function classifications distinguish thunks and externals.", "..."],
  "result_sha256": "..."
}
```

完整证据 记录按标识符保存在同一文件中.`table_address()`在`grade`清单中找到`LEA`操作数,并将其传给`read_bytes`,我知道.`open_binary`,我知道.`get_evidence_bundle`和 `close_binary`不返回证据记录,因此其记录中的标识符为零.

当路上有`npx`且`GHIDRA_INSTALL_DIR`指向一个目录时,`run_agent(live=True)`试试更进一步:`code/tests/fake_rea_server.py`是替代服务器,对每次`tools/call`返回相同的工具和参数对应的记录结果. 每次测试都让客户端和循环与它交互,不需要安装rea、Ghidra或Java.

### 实际验证器能说什么,不能说什么

实际的`verify_reconstruction`接收指向比较 证据的断言,并为每项回复通过、失败或未知──其固定限制为:通过意味着每项声明的断言都通过;它并不能确立全局实现等价──函数断言比较`compare_functions`返回的提供方文本;行为断言比较 `compare_process_captures`返回的两个已记录的过程被捕.`unknown`△内没有任何部分会编译重建函数,或在您的输入网格上运行它.

实际义务账本期望证明记录包含`predicate_type: "rea.reconstruction-proof"`,我知道.`operation: "verify_reconstruction_obligations"`,我知道.`confidence: "observed"`及`normalized_result.passed === true`没有公开的真实工具会产生这种记录.`code/main.py`中中 `build_proof()`会产生它:

```json
{
  "predicate_type": "rea.reconstruction-proof",
  "operation": "verify_reconstruction_obligations",
  "confidence": "observed",
  "authority": "controlled-replay",
  "normalized_result": {
    "passed": true,
    "status": "pass",
    "claims": [
      {"claim_id": "percent_change.behaviour", "kind": "behavioral", "status": "pass", "evidence_ids": ["ev_e88b10dc..."]},
      {"claim_id": "grade.behaviour", "kind": "behavioral", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]},
      {"claim_id": "percent_change.bytes", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_e88b10dc..."]},
      {"claim_id": "grade.bytes", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]},
      {"claim_id": "grade.referenced-constants", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]}
    ]
  },
  "evidence_links": ["ev_e88b10dc...", "ev_67b6d3f9..."],
  "evidence_id": "ev_..."
}
```

标识符为`ev_`加记录删除标识符后的 SHA-256,使用键排序、紧形式的 JSON。`aggregate()`采用保守失败原则:`fail`优先,其次是`unknown`空断言列表也是`unknown`◎ 宿主机没有 C 编译器时,两项行为断言都是`unknown`尽管两节断言通过,`unknown`,我知道.`authority`为`controlled-replay`由于证据来自我们的测试驱动程序,而不是只是目标文件.

## 研究结果说明了什么

・拉夫和米辛斯基在2026年测量了八种反编译系统的九种配置.通过基准全部测试的候选人,在模糊测试输入中仍然偏离原始结果,总比率为4.9%,某系统高达13%.在300个 GitHub库函数和287个与CVE相关函数中,最强大的改进模型将Ghidra的构建成功率从75%提高到90%,但同一批函数的行为匹配率从74%降至62%.研究原因追溯到模型制造的字段,类型,调用者和保护条件,它们取代了传统反编译器的保留原始未知的项目.

本课的`percent_change_wide.c`假代码给出`long`在LLM4Decompile的指标下,这两者都可能被计算为可重新执行,因为该指标会重新编译输出运行基准断言.

解译本ch测量了来自130个真实程序的23,400个函数,发现LLM方法的正确性比工业级反编译器低52.2%,但可理解性得分更高.

该领域使用的三种证明方法,就是你可以构建三条验证路径――尼克斯和DREAM 重新编译输出并运行原始程序的测试――麦克基曼和Csmith将生成的输入与原始程序相比,同时将限制输入在已定义的行为范围内――拉莫斯和恩格勒使用界符号执行检查两个C 函数,证明在给定输入中大小内所有探索路径上的等价值――本课程构建前两种;当输入网格小到不足以信任时,第三种是第35课程证书的实践方向――

## 构建自己

运行仅使用标准库的测试框架:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal
python3 code/main.py
```

通过语,演示会编译两个对候选实现,并为每运行92个单元;随后重新编译八个候选,重放智能体运行,并生成证明记录.没有语,读取已提交的目标文件,并将行为断言报告为`unknown`,我知道.

在 arm64 Mac 上预期输出结构如下:

```json
{
  "host": "aarch64 Darwin",
  "originalKind": "fixture-source",
  "gridCells": 92,
  "plausible": {"naivePassed": true, "gridMismatches": 28, "oracleDisagreements": 0},
  "equal": {"naivePassed": true, "gridMismatches": 0, "oracleDisagreements": 0},
  "legTwo": {
    "percent_change_mul_first": {"status": "pass", "reasons": []},
    "percent_change_wide": {"status": "fail", "reasons": ["size 16 vs 26 bytes"]},
    "grade_case10_wrong": {"status": "fail", "reasons": ["referenced constants differ: [1, 2, 3, 4, 4] vs [1, 2, 3, 4, 3]"]}
  },
  "agentRun": {"mode": "replayed fixture", "server": {"name": "rea", "version": "6.5.0", "protocolVersion": "2025-11-25"}},
  "proof": {"status": "pass", "evidence_id": "ev_..."}
}
```

按以下顺序阅读 `code/main.py`其他:

1. `wrap32()`,我知道.`c_div()`,我知道.`idiv32()`和两个`*_model()`函数实现指令清单的整数语义──
2. `input_grid()`和 `classify()`构建并标记 92个单元.
3. `build_harness()`和 `execute()`将原始实现,重新命名的候选人实现和`driver.c`编译成一个程序,然后运行各单元.
4. `prove_behaviour()`返回第一条 验证路径报告,包括不匹配项和模型分歧
5. `ElfObject`读取文件头,符号和`.rela`记录;`mask_relocations()`和 `read_table()`为比较作准备.
6. `prove_bytes()`返回第二条 检验路径报告,包括大小,屏蔽范围,重定位结构和表.
7. `McpStdioClient`和 `agent_loop()`动力并记录每一步.
8. `build_proof()`和 `aggregate()`通过保守失败原则的记录生成.

## 使用它

为了证明一个新函数等价,重复以下步骤:

1. 获取该函数的`analyze_function`结果并记录证据标识符──先读指令清单,再读伪代码──
2. 按清单中操作的位宽编写候选实现――保留原始函数名――
3. 列出列表中的每次乘乘加减除操作,加除可以使每个操作在其位置宽处回周围的网格输入.
4. 对于清单中的每一个比较常量添加两侧输入.`grade`它们是减法后的6和4
5. 添加每一个可能在目标上触发陷的除数,并记录运行网格的架构.
6. 运行两条验证路径,先看原因,再看状态.
7. 将证明记录保存在候选人实现旁边.`evidence_links`告诉读者断言根据什么记录.

每次编译器更新后都重新运行两条路径――字节匹配只针对一个编译器和一组参数成立――

## 交互实验

### 实验A:模型与运行

在`code`目录中启动Python:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal/code
python3 -q
```

运行:

```python
from main import *
percent_change_model(3, INT_MAX)
percent_change_model(-1, 536870911, "x86_64")
percent_change_model(-1, 536870911, "aarch64")
report = prove_behaviour(PLAUSIBLE)
report.naive_passed, len(report.mismatches), report.mismatches[0]
```

第一次调用得到 -133,即回绕乘乘除以 3;第二次得到`'trap'`报告显示,通过10个简单的例子,28个网格单元失败了.`report.oracle_disagreements`与空排列相比.

### 实验B:读取目标文件

```python
obj = ElfObject(ORIGINAL_OBJECT)
grade = obj.function("grade")
grade.size, grade.data[0x26:0x2a].hex(), grade.relocations
read_table(obj, grade.relocations[0], 5, 4)
```

字段字节为`00000000`△重定位引用`.rodata`增加数量为`0x10`表内容为`[1, 2, 3, 4, 4]`,我知道.

### 实验C:破坏一个常量

```python
report = prove_bytes("grade", CANDIDATES / "grade_case10_wrong.o")
report.masked_equal, report.relocations_match, report.tables_equal, report.reasons()
```

字节匹配,记录匹配,但表格不匹配.`grade_case10_wrong.c`让我们`case 10`重新返回 4,使用具命令重新编译,观察状态变为 `pass`,我知道.

### 实验 D:驱动

装备后面:

```bash
GHIDRA_INSTALL_DIR=/opt/homebrew/Cellar/ghidra/12.1.4/libexec \
JAVA_HOME=/opt/homebrew/opt/openjdk@21 \
python3 code/main.py --live
```

第一次`analyze_function`会花费几秒钟,因为Ghidra 正在导入目标文件.将新证据标识符与已提交的运行比较.

## 实践实验

将两条验证路径扩展到相同目标文件中`total`和 `grade_label`,我知道.

要求:

- 对于`total`构建计数为0、负计数、单元,以及求和在32个位置的环绕单元.
- 对于`grade_label`函数内联调用`grade`并读取`labels.rel`它是五个相对字符偏移组成的表,在`.rela.rodata`它们有各自的重定位.
- 为`grade_label`添加一条`CLAIMS`包含两条重定位和五个4字节条目的表,并比较条目的字符串.
- 如果模型与运行在某些单元上不一致,记录这些单元,并根据指令单单单解释.
- 在证明记录中,为每个函数的每条验证路径添加一个断言,并让汇总始终采用保守失败原则.

成功标准:证明记录列出四个函数,每个断言都携带证据标识符,并且任一标签符串不同时`grade_label`我会失败.

## 评分实验

五个关于本课件的题目. 用你构建的代码找到每个答案,然后写入.`code/lab_answers.json`△数字写成数字,或写成`"0x40"`这样十六进制字符串;列表写成JSON列表.

1. `t1`没有什么可能的.
2. `t2`没有任何变化.
3. `t3`其他类型:
4. `t4`单元格数量中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中
5. `t5`模型发生陷的网格单元数量.

检查你的答案:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal
python3 code/lab.py
```

检查器在已提交的固定上使用 `code/main.py`计算每个期望值.`PASS`,我知道.`FAIL`或`TODO`只有五个问题全部通过,才以0退出.`python3 code/lab.py my-answers.json`可检查另一个文件.`code/tests/test_lab.py`证明检查器接受正确答案并拒绝错误答案──

### 看它运行

[Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler)机器最终输出了假代码,并将其归档为推断:页面没有证明它. 本课就是把这个主张变成了检查的主张的那一步.

## 输出技能

本课产出发 `outputs/skill-rebuild-and-prove-equal.md`△使用它将函数证据和候选人重建转化为双路证明和证明记录.

## 验证

运行演示和测试套件:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

35项测试证明:

- `c_div()`截至零截至`wrap32()`遵循二进制补码规则
- 模型对`(3, INT_MAX)`得到-133对陷单元在 x86-64 上得到`trap`在Aarch64上得到2147483648
- 网格有92个单元,覆盖每个风险类别,而简单的例子避免了所有困难类别
- 读取器在记录的偏移和大小中找到四个函数
- `percent_change`为16节且无重定位,`grade`在`0x26`处有一条`R_X86_64_PC32`
- 重定位字段字节为零,屏蔽在这个 RELA 目标文件中不会改变任何内容
- 所有8个已提交的候选人都达到预期状态,并列出了记录中的原因
- `grade_case10_wrong`通过屏蔽后节检查,只在常量检查上失败
- 已记录的第一条路径运行显示十个简单的使用例通过28个不匹配项零模型分歧
- 存在编译器时,两对实现重建并运行仍然得到相同的结果
- 智能体运行按SHA-256 定位已提交目标文件,顺序正确,每个证据 步骤都带有 `ev_`标识符
- `read_bytes`记录与ELF 读取器找到的表格相同
- 客户端驱动模拟服务器,记录与真实运行相同的证据标识符
- 服务器错误结果会进入运行记录
- `aggregate()`采用保守失败原则,证明标识符可由内容重新计算

## 生产环境中的失败模式

| 失败 | 不严谨的报告会说什么 | 测试框架必须证明什么 |
|---|---|---|
| 重建保留反编译器的 `long` | “十个测试通过” | 26 个溢出单元与原始结果不同 |
| 用阈值替代 switch | “每个分数段都通过” | 原始实现在 110 及更高输入上返回 0 |
| 先除后乘 | “公式在代数上等价” | 舍入单元不同，简单用例失败 |
| 跳过陷阱单元 | “没有崩溃” | x86-64 触发 `#DE`，AArch64 返回 `INT_MIN`，报告说明宿主架构 |
| 不屏蔽就比较字节 | “字节相同” | 重定位记录指向不同偏移 |
| 只屏蔽，不读常量 | “屏蔽后字节相同” | `1,2,3,4,3` 与 `1,2,3,4,4` 不同 |
| 把大小当接受标准 | “长度相同” | 相同长度内仍有不同字节 |
| 编译器或参数不同 | “字节不同，重建错误” | 相同源码会生成不同字节，因此该比较无效 |
| 将模型当作观察 | “模型一致” | 运行是观察，模型是推导，并列出分歧 |
| 断言没有证据标识符 | “已验证” | 每项断言链接到所覆盖函数的 `ev_` 记录 |
| CI 宿主机没有编译器 | “通过” | 行为断言为 `unknown`，汇总也为 `unknown` |
| 将伪代码视为源码 | “反编译器说是 long” | 清单显示 `IMUL EAX`、`CDQ`、`IDIV EDI` |

## 操作准则

根据指令清单编写重建实现,并指出源记录――在能让每个中间值回绕、跨越每个比较常量的输入网格上,与原始实现对照运行――使用原始参数重新编译,屏蔽重定位字段,比较记录,再读取它们指向的常量――为每一个断言记录证标识符,让未经验证的断言继续保持未知――

## 延伸阅读

- [McKeeman, Differential Testing for Software, Digital Technical Journal 10(1), 1998](https://www.cs.tufts.edu/comp/150FP/archive/bill-mckeeman/DifferentailTesting.pdf)
- [Yang, Chen, Eide, Regehr, Finding and Understanding Bugs in C Compilers, PLDI 2011](https://doi.org/10.1145/1993498.1993532)
- [Ramos, Engler, Practical, Low-Effort Equivalence Verification of Real Code, CAV 2011](https://doi.org/10.1007/978-3-642-22110-1_55)
- [Schwartz, Lee, Woo, Brumley, Native x86 Decompilation Using Semantics-Preserving Structural Analysis, USENIX Security 2013](https://www.usenix.org/conference/usenixsecurity13/technical-sessions/presentation/schwartz)
- [Liu, Raff, Micinski, When LLM Decompilers Recompile More and Preserve Less, arXiv 2609.05370, 2026](https://arxiv.org/abs/2609.05370)
- [Gao et al., DecompileBench, Findings of ACL 2025](https://aclanthology.org/2025.findings-acl.1194/)
- [Tan et al., LLM4Decompile, arXiv 2403.05286, 2024](https://arxiv.org/abs/2403.05286)
- [System V gABI, Chapter 4, Relocation](https://www.sco.com/developers/gabi/latest/ch4.reloc.html)
- [x86-64 psABI repository, relocation types](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Intel 64 and IA-32 Architectures Software Developer's Manual, Volume 2, IDIV](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [Arm Architecture Reference Manual for A-profile, DDI 0487, SDIV](https://developer.arm.com/documentation/ddi0487/latest)
- [rea 6.5.0 MCP contracts](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/mcp-contracts.md)
- [rea 6.5.0 reconstruction obligation ledgers](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/reconstruction-obligation-ledgers.md)
