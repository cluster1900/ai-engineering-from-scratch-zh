# 二进制分析中的证据、置信度与未知项

> 对编译程序的一项发现，应是一条带有哈希、置信度、权威来源，以及无法证明事项清单的记录。

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 32（从零构建 ELF）、Phase 13 · 33（反汇编与控制流）、Phase 13 · 34（提升为伪代码）
**Time:** ~105 分钟

## 学习目标

- 参照 rea 的 `Evidence` 构建证据记录，区分观察所得、推导所得和推测所得的置信类别。
- 计算基于内容哈希的标识符，使文件移动到其他目录时标识符保持不变。
- 将每个提供方无法展示的内容记为限制，并让限制随记录一同传递。
- 在函数的实际观察运行提供支持之前，拒绝断言结果。
- 将剩余未知项保存为通过哈希链连接的带修订版本记录。
- 按精确键缓存提供方的回答，并拒绝过期重放。

## 问题

你问一个智能体：`ledger-x86_64-O1.o` 中的 `grade` 对分数 55 返回什么？智能体调用 rea，读取 Ghidra 伪代码，回答 0。审阅者追问它如何知道。智能体手中只有一段 Ghidra 输出的文本。默认路径上的文本是 `uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);`。该位置的字节却表示 `xor eax, eax`。

这个表达式和这条指令对所有输入都产生 0，但智能体并不知道这一点。它只是因为文本来自工具就相信了它。一项 2026 年研究让三个智能体执行 24 个逆向工程任务（[NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)），指出四种反复出现的弱点：训练偏差、过度信任观察结果、上下文限制，以及坚持原计划。另一项 2026 年研究在二进制文件内植入文本，发现在 40 个案例中，模型有 35 次提出了植入的不安全操作（[arXiv 2607.12507](https://arxiv.org/abs/2607.12507)）。

rea 6.5.0 为此提供了一套词汇。每次成功的工具调用都会产生一条 `Evidence` 记录，其 `confidence` 为 `observed`、`derived` 或 `inferred`，并带有 `authority` 和 `limitations` 列表。随附技能告诉智能体：“每项结论都必须区分观察、推断和未知项。引用 Evidence ID，保留限制和不完整的覆盖范围，绝不能暗示静态分析观察到了执行。”

rea 将三件事留给你处理：快照缓存的是精确查询结果，而非分析；当某个比较维度未变化时，验证就判定断言通过，但源码注释明确说，通过“并不能确立全局实现等价”；义务账本只接收来自 JavaScript 和托管图的候选项，因此原生函数无法通过它达到 `verified`。

本课用纯 Python 补上缺失的部分。你将编写一个账本，把关于夹具的每项事实存成带内容哈希的记录；对 `percent_change` 和 `grade` 作出预测，标记为推测，再用自己编译的测试程序的运行结果核对；还会导入两条真实的 rea 记录及其来源快照，让账本重新计算 rea 写入的每个哈希。

```figure
re-evidence-ledger
```

## 三种置信类别，五种权威来源

`confidence` 是只有三个值的枚举，绝不是数值。`authority` 有五个值。生产者未作说明时，rea 默认使用 `shipped-artifact` 和 `observed`。

| 值 | 在夹具上的含义 | 本课中的记录 |
|---|---|---|
| `observed` | 从字节或运行中读取的事实 | ELF 读取器读取的节和符号、两条 Ghidra 记录、17 次宿主机运行 |
| `derived` | 根据观察记录计算出的事实 | switch 表模型、除法模型、每次未知项变更 |
| `inferred` | 尚无观察结果陈述的预期 | 18 项预测 |
| `shipped-artifact` | 来源是磁盘上的文件 | 对 `ledger-x86_64-O1.o` 的每次读取 |
| `controlled-replay` | 由你控制的运行产生的事实 | `harness.c` 的宿主机运行 |
| `analyst-inference` | 你自己的判断 | 预测及未知项变更 |
| `historical-reference` | 旧版本源码树或文档 | 本课没有 |
| `external-service` | 文件和宿主机之外的服务 | 本课没有 |

两种混淆最浪费时间。第一种把伪代码当成对行为的观察；实际上，它只是对 Ghidra 输出内容的观察。第二种把空列表当成不存在的证明。rea 的设计说明非常严格：“缺少覆盖意味着未知，而不是不存在。”`code/main.py` 中的账本将这两条规则编码实现。

## 记录

一条记录恰好有十六个字段，rea 6.5.0 会拒绝其他任何字段。`code/main.py` 使用与 rea 相同的名称，因此双方产生的记录都能通过对方验证。第十六个字段 `relationship_coverage` 表示调用者或被调用者列表的完整程度。其值为 `complete`、`partial` 或 `unknown`；若操作不报告调用关系，则为 `null`。

| 字段 | 内容 |
| --- | --- |
| `evidence_id` | `ev_` 加 64 位十六进制数字，表示内容哈希 |
| `subject` | `name`、`digest.sha256`、`format`、`architecture`、`local_path`，或 `null` |
| `provider` | `id`、`name`、`version`，或 `null` |
| `analysis_profile` | 提供方的设置及其摘要，或 `null`；该字段始终存在 |
| `predicate_type` | 标签，默认为 `rea.analysis` |
| `operation`, `parameters` | 工具及其输入 |
| `raw_result`, `normalized_result` | 提供方输出及规范化结果 |
| `confidence`, `authority` | 上述枚举值 |
| `environment` | `id`、`platform`、`architecture`、`isolation`，或 `null` |
| `limitations` | 用普通句子描述的限制 |
| `relationship_coverage` | `status` 为 `complete`、`partial` 或 `unknown`，附带诊断信息；或为 `null` |
| `locations` | `address`、`address-range`、`artifact-path`、`file-offset`、`file-offset-range` |
| `evidence_links` | 本记录所依赖的 `ev_` 标识符 |

下面是 rea 为 `grade` 写入的真实记录，只保留本节关注的字段。完整文件为 `code/fixtures/rea-evidence-grade.json`，大小为 37,573 字节。

```json
{
  "evidence_id": "ev_67b6d3f992eaf49a2e16de084b6ebfdd9884e8c5c7f75e175b7bb20f4f748ce1",
  "subject": {
    "name": "ledger-x86_64-O1.o",
    "digest": { "sha256": "9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f" },
    "format": "elf",
    "architecture": "x86_64",
    "local_path": "/private/tmp/aiefs-re/phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns/code/fixtures/ledger-x86_64-O1.o"
  },
  "provider": { "id": "ghidra", "name": "Ghidra", "version": "12.1.4" },
  "analysis_profile": {
    "provider": { "id": "ghidra", "name": "Ghidra", "version": "12.1.4" },
    "parameters": { "jump_table_evidence": "typed-case-default-blocks-v1", "import_mode": "ephemeral-source-immutable" },
    "digest": "9c7f6b24be69294e61da046e4583e3856cb9e40433b149c1bf8bb534d2fe03ef"
  },
  "operation": "analyze_function",
  "parameters": { "procedure": "grade" },
  "confidence": "observed",
  "authority": "shipped-artifact",
  "environment": null,
  "limitations": [
    "Default-space addresses use lowercase 0x-prefixed hexadecimal; other address spaces use <percent-encoded-space>:0x<hex>.",
    "Resolved reference metadata identifies computed, indirect, external, call, jump, and data edges; unresolved targetless flows remain unknown, and function classifications distinguish thunks and externals."
  ],
  "relationship_coverage": {
    "status": "complete",
    "diagnostics": [
      "Only resolved Ghidra call references are returned; unresolved computed or indirect calls remain unknown, while function classifications distinguish thunks and externals."
    ]
  },
  "locations": [],
  "evidence_links": []
}
```

分析配置中真实的 `parameters` 对象有 25 个键，真实的 `limitations` 列表有十句话。请全部保留。限制属于内容的一部分，删除一项就会改变标识符，账本也会因此拒绝该记录。

注意记录没有说什么。`environment` 为 `null`，因为 Ghidra 只读了文件，没有运行代码。`locations` 为空，因为此操作在 `normalized_result` 内报告地址。`relationship_coverage` 的状态为 `complete`，但其诊断说明只返回已解析的 Ghidra 调用引用，未解析的计算型或间接调用仍为未知。因此，调用者和被调用者列表只对已解析的调用完整。

## 标识符是内容哈希，路径不参与计算

rea 将记录的一个投影按 RFC 8785 规范化为 JSON，计算 SHA-256，再加上 `ev_` 前缀，得到 `evidence_id`。该投影保留主体的 `digest`、`format` 和 `architecture`，去掉 `name` 和 `local_path`。当 `relationship_coverage` 为 `null` 时也去掉它，因此不含调用关系的记录，仍保持该字段出现之前的标识符。其他所有内容，包括 `raw_result` 和每项限制，都会参与哈希。

RFC 8785 对对象键排序、移除空白，并固定数字和字符串的表示形式。对于数字全部为整数的记录，Python 标准库可以产生相同字节：

```python
def canonical_json(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
```

`code/main.py` 在哈希之前拒绝浮点数，因为 RFC 8785 与 Python 对某些浮点数的输出不同。两条 rea 记录和快照都不含浮点数，因此该方法能复现每个 rea 哈希：

| rea 的值 | `code/main.py` 重新计算的结果 |
|---|---|
| `grade` 的 `ev_67b6d3f992eaf49a…` | 相同 |
| `percent_change` 的 `ev_e88b10dc0c6400e5…` | 相同 |
| 对 `{provider, parameters}` 计算的配置摘要 `9c7f6b24be69294e…` | 相同 |
| `grade` 快照条目的 `query_26122aebe9d8abae…` | 相同 |
| `percent_change` 条目的 `query_0f95ef38038d3666…` | 相同 |

为何排除路径？对相同字节的相同观察，无论机器和目录如何变化，都应获得相同标识符。上方记录中的 `local_path` 指向某台 Mac 上的目录；将夹具复制到 `/home/you/re` 后，标识符不会改变。`rebind_subject_path()` 允许用新路径展示记录；当 `sha256`、`format` 或 `architecture` 不同时，它会拒绝。rea 6.5.0 在为新路径目标重放快照记录时，也通过 `rebindEvidenceToTargetPath` 执行同样操作。

`validate_evidence()` 重新计算标识符，若不匹配则使用 rea 的消息拒绝：“Evidence semantic identifier does not match its record”。若记录的 `analysis_profile.provider` 与 `provider` 不一致，它也会拒绝。测试 `test_tampered_id_and_mismatched_profile_are_rejected` 修改真实 `grade` 记录中的一行伪代码，并观察账本拒绝它。

## 自己观察目标文件

在调用任何提供方之前，账本先读取文件。`observe_object()` 用 `struct.unpack_from` 解析 ELF64 节头、`.symtab`、`.strtab` 和 `.rela.text`。它写入一条 `inspect_object` 记录，并为每个函数符号写入一条 `read_function_bytes` 记录。这五条记录均为 `observed`，权威来源为 `shipped-artifact`，因为来源是磁盘文件。

| 记录 | 内容 | 标识符 |
|---|---|---|
| `inspect_object` | 五个节的偏移、大小和哈希，四个函数，三条重定位 | `ev_645e0a145f28bd5c…` |
| `read_function_bytes percent_change` | `.text+0x00` 处的 16 字节 | `ev_2572a7d254ad15cb…` |
| `read_function_bytes grade` | `.text+0x10` 处的 46 字节，SHA-256 为 `ffcb75c2a7bb1104…` | `ev_a467c2427bfc0c56…` |
| `read_function_bytes total` | `.text+0x40` 处的 31 字节 | `ev_b1e845cea2543073…` |
| `read_function_bytes grade_label` | `.text+0x60` 处的 63 字节 | `ev_c50041be26e6b7f4…` |

`llvm-objdump -t` 与之相符：`grade` 位于 `0000000000000010`，大小为 `2e`。`.rela.text` 中的三条重定位均为针对 `.rodata` 的 `R_X86_64_PC32`，偏移分别为 `0x36`、`0x84`、`0x93`，加数分别为 `0x10`、`0x24`、`-0x4`。每条记录都带有 `file-offset-range` 位置和一项限制：“节字节从磁盘文件读取。读取器不应用重定位，也不运行代码。”

第 32 课完整构建了这个读取器。这里仅用 60 行，因为本课关注的是你如何记录读取过程。

## 推导表，并明确说明它是推导结果

`grade` 的 46 字节中包含第 33 课解码过的四种模式：

| 字节 | 指令 | 在 `grade` 中的偏移 |
|---|---|---|
| `48 69 c0 67 66 66 66` | `imul rax, rax, 0x66666667` | 3 |
| `48 c1 f9 22` | `sar rcx, 34` | 13 |
| `83 c1 fa` | `add ecx, -6` | 23 |
| `83 f9 04 77 0c` | 先 `cmp ecx, 4`，再 `ja` | 28 |

乘以 `0x66666667` 后右移 34 位，相当于有符号除以 10。文件中并没有 10。`derive_grade_model()` 将此事实写为限制：“除数 10 是根据乘数 0x66666667 和移位量 34 推导的。文件中没有 10。”

`add ecx, -6` 将第一个分支设为 6。`cmp ecx, 4` 配合无符号跳转允许五个分支，即 6 至 10。

`.text+0x33` 处的 `lea` 带有加数为 `0x10` 的重定位。PC32 重定位的实际地址计算涉及四字节位移的末端，因此表从 `.rodata+0x14` 开始。那里的五个小端字为 `1, 2, 3, 4, 4`。`ledger.c` 中的 switch 对 60 至 69 返回 1，对七十分段返回 2，对八十分段返回 3，对 90 至 100 返回 4。编译器将 switch 转化为了返回值查找表。

生成的记录 `ev_605106bff2d9998f…` 的 `confidence` 为 `derived`，`evidence_links` 指向它依赖的两条观察记录。从账本中删除字节记录，推导记录就会出现悬空链接。关闭图中的 `ev_a467c242…` 时，上图会显示这一状态。

现在与 Ghidra 比较。它对相同字节给出的伪代码如下：

```c
uint grade(int param_1)
{
  uint uVar1;
  uint uVar2;

  uVar2 = param_1 / 10 - 6;
  uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);
  if (uVar2 < 5) {
    uVar1 = *(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4);
  }
  return uVar1;
}
```

Ghidra 应用了重定位，并将表命名为 `DAT_001000b4`；当它将 `.text` 放到 `0x100000` 后，这就是 `.rodata+0x14`。它恢复出了除以 10 和五个分支。对于默认值，它输出一个永远等于 0、却从不直接写出 0 的表达式。`native_value_flow` 中的 p-code 将这些操作标记为 `is_dead: true`。该记录忠实观察了 Ghidra 的输出；你从中理解出的含义属于推导，而你预期运行会得到的值属于推测。

`percent_change` 记录展示了另一种失败。Ghidra 的签名为 `undefined1 [16] percent_change(int param_1,int param_2,ulong param_3)`，源码却是 `int percent_change(int before, int after)`。`idiv` 写入 `EDX:EAX`，而零值路径没有修改 `EDX`，因此反编译器推断出了 16 字节返回值和第三个参数。它自身为 `grade` 给出的 `native_api.return_type.confidence` 是 `"low"`。应将恢复出的签名视为提供方的推断，并如实记录。

## 预测是推测记录

预测是关于行为的断言，尚未得到任何观察结果的陈述。`claim_suite()` 根据推导模型和源码构建十八项预测。`record_prediction()` 将每项存为 `confidence` 为 `inferred`、`authority` 为 `analyst-inference` 的记录，并链接到所依赖的记录。

| 断言 | 预测值 | 依据 |
|---|---|---|
| `percent_change(12400, 15500)` | 25，来自 310000 / 12400 | 除法模型 `ev_076a9167…` |
| `percent_change(0, 5)` | 0，零值保护分支 | 除法模型 |
| `percent_change(100, 50)` | -50 | 除法模型 |
| `percent_change(-7, 3)` | -142，因为 `idiv` 向零截断 | 除法模型 |
| `grade(55)` | 0，索引 -1 无法通过无符号比较 | 表模型 `ev_605106bf…` |
| `grade(60)`, `grade(69)` | 1, 1 | 表模型 |
| `grade(70)`, `grade(85)` | 2, 3 | 表模型 |
| `grade(95)`, `grade(100)`, `grade(105)` | 4, 4, 4 | 表模型 |
| `grade(110)`, `grade(-5)` | 0, 0 | 表模型 |
| `total(1, 2, 3)`, `total()` | 6, 0 | 源码记录 `ev_2f1e6d25…` |
| `grade_label(85)` | `"B"` | 源码记录和表模型 |
| 90 至 100 的 `grade(score)` | 十一个输入都返回 4 | 表模型 |

`predict()` 使用 C 语义，而不是 Python 语义。`c_div()` 向零截断，`wrap32()` 将每个中间值折回 32 位。Python 的 `//` 向负无穷取整，因此 `(3 - -7) * 100 // -7` 得到 -143，而 C 程序得到 -142。第 36 课会大幅扩展这个输入网格。

每项预测都会新建一个剩余未知项。未知项要求权威来源为 `controlled-replay` 的 `observed` 证据，并建议一次探测：在宿主机构建上执行 `execute_function`。下一节会产生这类证据。第一个 grade 断言的问题是：“编译后的函数实际运行时，grade(95) == 4 是否成立？”

## 对照实际运行检查

`code/fixtures/harness.c` 包含 `ledger.c`，每次调用打印一个结果。`observe_runs()` 使用 PATH 上找到的第一个 `clang`、`cc` 或 `gcc` 编译它，并将网格中的每个输入运行一次。每次运行都成为一条记录：

```json
{
  "operation": "execute_function",
  "parameters": { "function": "grade", "args": [95] },
  "normalized_result": { "result": 4, "stdout": "4\n", "exit_code": 0 },
  "confidence": "observed",
  "authority": "controlled-replay",
  "environment": { "id": "host-process", "platform": "darwin", "architecture": "arm64", "isolation": "process" },
  "limitations": [
    "The run executed a host build of ledger.c, not the x86-64 object. The claim about the object rests on the shared source and on the compiler.",
    "One run observes one input. It proves nothing about other inputs."
  ]
}
```

运行记录的主体是测试驱动程序二进制文件，在这台 Mac 上它是 Mach-O arm64 文件，拥有自己的 SHA-256。提供方是 `course-harness`，附带编译器版本行，这里为 `Apple clang version 17.0.0 (clang-1700.6.3.2)`。`evidence_links` 指向源码记录 `ev_2f1e6d251543d017…`，因为运行产物与目标文件只共享 `ledger.c`，除此之外并不相同。

请把第一项限制读两遍。x86-64 目标文件从未在这台机器上运行过。实际运行的是同一源码针对另一架构的第二次构建。这依然是观察，而且在不使用模拟器的情况下，它是能获得的最强证据，所以断言可以通过，但必须附带这句限制。省略它的报告会丢失读者需要的信息。

17 次单输入运行全部符合预测。`code/fixtures/run-evidence.json` 保存了这 17 条记录和源码记录，于 2026-10-13 使用 `--record` 导出。没有编译器时，`build_ledger()` 导入该证据包而不运行程序，并在报告的 `runs` 字段中明确说明。

## 提升规则

断言只有通过观察到的运行，才能从推测变为得到支持。`check_claim()` 查找函数和参数相同的 `execute_function` 记录，将每个结果与预测比较，并统计覆盖的输入：

| 状态 | 条件 | rea 的完成账本 |
|---|---|---|
| `pass` | 每个输入都有一致的运行，且没有不一致结果 | `pass` |
| `fail` | 任一次运行不一致 | `fail` |
| `unknown` | 部分输入有运行，其他输入没有 | `unknown` |
| `unsupported` | 没有任何输入有运行记录 | `unsupported` |

`promote_claim()` 是严格版本。任何标识符对应 `inferred` 或 `derived` 记录时，它都会抛出 `ClaimError`；标识符指向其他函数或其他参数的运行时，也会抛出异常；列表为空或运行覆盖输入少于断言要求时，同样如此。`grade(55)` 同时拥有 Ghidra 伪代码记录和表模型，但它们都不能提升该断言。关闭图中的 `ev_7be90c0c…`，你会看到断言降为 `unsupported`，尽管关于 `grade` 的两条记录仍然存在。

范围断言展示了部分覆盖的情形。其十一个输入中，只有 95 和 100 出现在运行网格中。`check_claim()` 返回 `unknown`，`covered` 为 11 个中的 2 个；`promote_claim()` 则拒绝，消息为“2 of 11 inputs have observed runs”。账本不会把这个结果向上凑成完整覆盖。

`completion_ledger()` 对应 rea 的 `EvidenceCompletionLedger`。其标识符是 `ecl_` 加记录内容的哈希，且只有 `pass` 等于 `total` 时，`complete` 才为真。因为那一项范围断言，演示输出 `ecl_da64933ea13befed…`，并显示 `complete: false`。

## 未知项是带哈希链的记录

rea 将剩余未知项保存为严格结构的记录。`code/main.py` 使用相同字段和相同不变量。

标识符是 `unk_` 加 `{domain, question, scope_digest}` 的 SHA-256，其中问题中的连续空白折叠为单个空格。两个分析者针对同一文件提出相同问题，会得到相同标识符。`scope_digest` 是目标文件的 SHA-256。

每次修改都产生新修订版本。修订 1 的 `previous_revision_digest` 为 `null`。后续每个修订都引用前一版本的 `revision_digest`，摘要覆盖除自身以外的所有字段。`verify_unknown_chain()` 遍历列表，重新计算每个摘要，检查每个链接是否指向前一版本，并检查每个版本引用的变更证据是否存在于账本中。

每次变更本身也是证据记录，与 rea 使用提供方 `rea-unknown-registry` 的做法相同。本课记录的 `confidence` 为 `derived`，`authority` 为 `analyst-inference`，没有主体。其限制为：“注册表变更记录分析者作出的决定，并不证明问题的答案。”

这就是演示的 81 条记录中包含 36 条推导型变更记录的原因：18 次新建和 18 次更新。

每个修订都必须满足三个不变量：

- 只有 `resolved` 未知项才带有 `resolution`，且只有修订 1 没有前驱。
- `contradicted` 未知项至少引用一个反驳证据标识符，且同一标识符不能同时出现在两个列表中。
- `verified` 解决结果至少引用一个具有所需置信类别和权威来源的证据标识符。

第三条规则是账本最常拒绝操作的地方。rea 的工作流说明写道：“只有符合条件的观察证据才能验证解决结果。”因此，`resolve_unknown()` 拒绝表模型，也拒绝权威来源为 `shipped-artifact` 的观察记录，但接受运行记录 `ev_f4ffbe8f922ec7fe…`。`grade(95)` 已解决的修订为版本 2，其 `previous_revision_digest` 为 `ffca840b55a8a188…`，即修订 1 的摘要。

`update_unknown()` 接收 `expected_revision`，当其过期时抛出 `revision-conflict`，与 rea 的 `update_unknown` 工具相同。正确应对方式也与 rea 的说明一致：重新读取当前版本，再作决定。

演示结束后仍有一个未知项未关闭：`unk_f2eb0d7f84c80a19…`，问题是“编译后的函数运行时，90 至 100 的每个分数是否都满足 grade(score) == 4？”其状态为 `investigating`，支持证据包括两次运行，探测建议仍列出尚未运行的九个输入。

## 回答缓存不是分析数据库

rea 有三种看起来像缓存的东西。Ghidra 目标快照是输入的私有副本，使用 `-readOnly -deleteProject` 导入，关闭时删除。内存中的 `AnalysisSnapshotCache` 为一个二进制身份保存至多 10,000 个条目。快照文件则包含 `target`、`binding`、`entries`、`workflow_entries` 和 `evidence_bundle`。

缓存键是 `query_` 加 `{target, binding, operation, parameters}` 的 SHA-256。`target` 为 `{sha256, kind, format, architecture}`，`raw-binary` 目标还包含 `entry_point`。`binding` 包含提供方及整个分析配置，连同摘要。修改 25 个配置参数中的任意一个，例如将 `jump_table_evidence` 从 `typed-case-default-blocks-v1` 改为 `v2`，摘要就会变化，所有键也随之变化。

`code/fixtures/rea-snapshot.json` 是 rea 在两次运行期间写入的文件，大小 142,690 字节。rea 写入时权限仅限所有者，提交到仓库的副本则人人可读。它包含两个条目，以及保存同样两条记录的证据包。`AnswerCache.import_snapshot()` 重新计算每个 `query_id`，任意一个不一致就拒绝整个文件。如果快照的 `target` 或 `binding` 与当前值不同，则使用 rea 的措辞 `profile_mismatch` 拒绝；若 `format_version` 不是 `course-answer-cache-1`，也会拒绝。

这台机器上的三次测量如下：首次 `grade` 查询重新导入 Ghidra，耗时 8.6 秒；针对同一快照的 `percent_change` 查询耗时 8.5 秒，因为不同查询不会命中缓存；第三次 `grade` 查询耗时 2.1 秒，返回完全相同的记录和 `evidence_id`。rea 的内存重放会添加限制：“从本地 REA 分析快照加载；本次调用没有重新运行提供方。”本课的 `lookup()` 也添加类似说明，让读者区分重放与新回答。

变更会终止缓存使用。在 rea 6.5.0 中，重命名或添加注释会在调用发送给提供方之前清空快照缓存。失败响应不能证明写入已回滚，因此写入失败也会停止重放。会修改数据库的元数据导入同样如此。

## 为什么智能体需要它

通过 MCP 驱动 rea 的智能体，每次调用都会看到完整记录，并可在报告中引用 `evidence_id`。2026 年的研究指出了容易出错的地方。过度信任工具输出是 NDSS BAR 研究发现的四个弱点之一。植入文本的研究中，即使只将二进制内容呈现为数据，40 次中仍有 15 次不安全建议；加入来源检查和工具授权后，这些建议才被消除。第三项研究观察了智能体通过 MCP 驱动 Ghidra 的过程（[arXiv 2606.06838](https://arxiv.org/abs/2606.06838)）：对于拥有数百个函数的二进制文件，只有 10% 至 15% 的函数在智能体生成桩代码之前得到真正分析。

账本用记录回应每个问题，智能体只报告账本中已有的内容。没有观察运行的断言为 `unsupported`，只有部分运行的断言为 `unknown`。提供方文本的 `observed` 只针对提供方输出，不代表更多。把 `outputs/` 中的技能文件交给智能体，并让账本成为它写入结论的唯一位置。无论使用 Claude、Cursor、Codex、OpenClaw、Hermes，还是其他读取 SKILL.md 的智能体，都应如此。

## 自己构建

运行仅使用标准库的演示：

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
```

演示读取目标文件，导入两条 rea 记录，验证 rea 快照，并推导两个模型。随后记录 18 项预测、新建 18 个未知项、编译并运行测试驱动程序、检查每项断言，再解决 17 个未知项。预期结构如下：

```json
{
  "records": 81,
  "by_confidence": { "observed": 25, "derived": 38, "inferred": 18 },
  "rea_snapshot": { "entries": 2, "replay_hit": true, "stale_profile_refused": true },
  "grade_table": [1, 2, 3, 4, 4],
  "runs": "live: Apple clang version 17.0.0 (clang-1700.6.3.2)",
  "claims": [ { "claim_id": "grade(95)", "status": "pass", "covered": "1/1" }, { "claim_id": "grade(90..100)", "status": "unknown", "covered": "2/11" } ],
  "completion_ledger_id": "ecl_da64933ea13befed9483f8b00447bb3f4ceb74324c01e2515eff03f3af3ca750",
  "complete": false,
  "unknowns": { "resolved": 17, "investigating": 1 }
}
```

没有 C 编译器时，`runs` 显示 `imported 17 recorded run records from run-evidence.json`，其余相同。

按以下顺序阅读 `code/main.py`：

1. `canonical_json()` 和 `compute_evidence_id()` 实现哈希方法和语义投影。
2. `create_evidence()` 和 `validate_evidence()` 构建并检查记录。
3. `EvidenceLedger.record()` 和 `import_bundle()` 保存记录并拒绝冲突。
4. `open_unknown()`、`update_unknown()` 和 `resolve_unknown()` 维护修订链。
5. `observe_object()` 读取 ELF，`derive_grade_model()` 读取表。
6. `claim_suite()`、`predict()` 和 `record_prediction()` 写入推测层记录。
7. `observe_runs()` 将测试驱动程序的每次运行转化为观察记录。
8. `check_claim()`、`promote_claim()` 和 `completion_ledger()` 应用提升规则。
9. `AnswerCache` 像 rea 快照一样为回答设置键，并拒绝过期结果。

## 使用它

为每个目标、每次调查分别维护账本。在每个主体中写入目标的 SHA-256，在每个未知项中写入问题的范围摘要。更换工具时，修改 `provider`，让标识符自然分化。重新构建夹具时，主体摘要改变，所有旧记录就都成为关于另一个文件的证据。

一旦知道限制，就立即写下。读取器不应用重定位，就明确说明；运行的是宿主机构建，就明确说明；模型推导出了除数，也明确说明。缺少限制的记录看起来会比事实允许的更强，后来的读者无法弥补这种损失。

将每段提供方文本都视为数据。来自目标的字符串和伪代码都是由目标控制的文本，绝不能变成指令，也绝不能变成行为观察。rea 6.5.0 用 `_meta.provenance.untrusted_content: true` 标记此类结果。其服务器指令要求模型将目标内容视为数据，并将其中要求运行、安装、下载或发送内容的请求报告为提示注入企图。标记有帮助，但账本仍必须确保目标文本不会进入指令层。

## 交互实验

### 实验 A：重新计算 rea 标识符

在 `code` 目录中启动 Python：

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns/code
python3 -q
```

运行：

```python
from main import *
record = load_evidence_file(FIXTURES / "rea-evidence-grade.json")
record["evidence_id"] == compute_evidence_id(record)
record["subject"]["local_path"] = "/home/you/re/ledger-x86_64-O1.o"
record["evidence_id"] == compute_evidence_id(record)
record["limitations"].pop()
record["evidence_id"] == compute_evidence_id(record)
```

前两个比较结果为真，因为路径不参与哈希。第三个为假，因为限制属于内容。

### 实验 B：拒绝提升

```python
ledger, report = build_ledger(live_runs=False)
claim = [c for c in claim_suite(ledger.find(operation="derive_switch_model")[0], ledger.find(operation="derive_arithmetic_model")[0], ledger.find(operation="read_source")[0]) if c.claim_id == "grade(55)"][0]
promote_claim(ledger, claim, [ledger.find(operation="derive_switch_model")[0]["evidence_id"]])
```

该调用抛出 `ClaimError`，并指出推导记录的标识符。现在传入运行记录标识符：

```python
run = run_records_for(ledger, "grade", [55])[0]
promote_claim(ledger, claim, [run["evidence_id"]])["status"]
```

状态为 `pass`，返回的 `limitations` 保留宿主机构建说明。

### 实验 C：拒绝过期快照

```python
import json
snapshot = json.loads(REA_SNAPSHOT_PATH.read_text())
target, binding = rea_snapshot_binding(snapshot)
AnswerCache(target, binding).import_snapshot(snapshot)
stale = dict(binding["analysis_profile"]["parameters"], jump_table_evidence="typed-case-default-blocks-v2")
AnswerCache(target, {"provider": binding["provider"], "analysis_profile": make_profile(binding["provider"], stale)}).import_snapshot(snapshot)
```

第一次导入返回 2，第二次抛出带 `profile_mismatch` 的 `CacheError`。只改了一个版本字符串，整个快照就被拒绝。

### 实验 D：破坏链

```python
unknown_id = [u for u, r in ledger.unknowns.items() if r[-1]["status"] == "investigating"][0]
ledger.verify_unknown_chain(unknown_id)
ledger.unknowns[unknown_id][0]["severity"] = "critical"
ledger.verify_unknown_chain(unknown_id)
```

第一次调用返回 2。第二次抛出 `EvidenceIntegrityError`，因为修订 1 不再与自身摘要匹配，而修订 2 指向了一个已经不存在的摘要。

## 实践实验

关闭尚未解决的未知项，并添加第二个提供方。

要求：

- 扩展 `run_grid()`，运行范围断言缺少的九个输入，然后确认未知项在修订 3 变为 `resolved`。
- 将 `llvm-objdump -d` 添加为第二个提供方，使用自己的 `provider` 对象，并将其 `grade` 清单记录为 `observed`。
- 写入一条 `derived` 记录，说明 Ghidra 和 llvm-objdump 的两份清单解码出相同的 14 条指令，并同时链接两者。
- 为 `grade_label(105)` 新建严重程度为 `high` 的未知项，因为表索引 4 会读取 `labels[4]`；再通过实际运行解决它。
- 使用 `export_bundle()` 导出账本，再导入全新账本，证明每条链仍能通过验证。

成功标准：报告的每句话都引用证据包中的标识符，且那项 `unknown` 断言已消除。

## 本课产物

本课产出 `outputs/skill-evidence-ledger.md`。它指导智能体将每项发现写为带置信类别、权威来源、限制和链接的记录，说明如何用修订版本维护未知项，以及何时将断言判为 `pass`、`fail`、`unknown` 或 `unsupported`。

## 验证

运行演示和确定性测试套件：

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

28 项测试证明：

- 两个 rea `evidence_id`、配置摘要及两个快照 `query_id` 都能从内容重新计算
- 改变路径不改变标识符，改变限制则改变标识符
- 篡改的记录、提供方不匹配的配置、浮点数和未知枚举值都会被拒绝
- 重复记录返回 `duplicate`，冲突记录抛出异常，证据包导入具有原子性
- 已记录的运行证据包导入后有 18 条记录，且没有悬空链接
- 未知项从修订 1 开始，拒绝过期的 `expected_revision`，且只有观察到的 `controlled-replay` 证据才能解决它
- 编辑修订内容会破坏链
- 提升拒绝推测、推导、空列表和无关证据，只在运行结果一致时通过
- 部分覆盖为 `unknown`，不一致运行则为 `fail`
- 缓存仅在键完全一致时命中，其他参数不会命中
- 缓存拒绝升级的配置版本、错误目标、错误格式版本和篡改的键
- ELF 读取器在偏移、大小、字节和重定位上与 `llvm-objdump` 一致，表中读出 `1, 2, 3, 4, 4`
- 预测使用 C 除法语义，且已记录运行与全部 17 项单输入断言一致
- 存在编译器时，实时运行结果也一致

## 生产环境中的失败模式

| 失败 | 不严谨的报告会说什么 | 账本的要求 |
|---|---|---|
| 将伪代码读作行为 | “grade 对不及格分数返回 0” | 该输入的 `execute_function` 记录，否则为 `unsupported` |
| 信任反编译器签名 | “percent_change 返回 16 字节” | 将签名标为提供方推断，并保留其 `low` 置信度 |
| 将空列表读作不存在 | “函数没有调用者” | `unknown` 状态，或工具提供的覆盖字段 |
| 将路径纳入标识符哈希 | 复制后“记录变了” | 不含 `name` 和 `local_path` 的语义投影 |
| 复制时丢弃限制 | 记录看起来比来源更强 | 标识符不匹配，导入时拒绝 |
| 将部分网格夸大为完整覆盖 | “90 起的所有分数都通过” | `unknown`，并显示 `covered` 为 11 中的 2 |
| 将宿主机运行说成目标文件运行 | “x86-64 目标文件返回了 25” | 断言必须携带宿主机构建的限制说明 |
| 用一句话关闭未知项 | “已解决，见上文” | `verified` 解决结果，引用所需权威来源的观察证据标识符 |
| 覆盖过期修订 | 两位分析者的编辑冲突 | `revision-conflict`，然后重新读取 |
| 新版本发布后重放旧快照 | 回答来自已变更的契约 | 导入时返回 `profile_mismatch` |
| 重命名后仍保留缓存 | 重放掩盖了元数据写入 | 发送操作前使缓存失效，并令导出失败 |

## 操作准则

用三种类别分别记录你读到的内容、计算出的内容和预期结果。用标识符关闭未知项，绝不用一句话代替证据。仅在存储时的精确键下重放回答，只要一个版本字符串不同就拒绝。

## 延伸阅读

- [rea 6.5.0 source, `src/domain/evidence.ts` and `src/domain/residualUnknown.ts`](https://github.com/morluto/rea)
- [RFC 8785, JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785)
- [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Agent Failure Patterns in CTF Reverse Engineering, NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)
- [When Binaries Talk Back: Representation-Confusion Attacks on LLM-Assisted Reverse Engineering, arXiv 2607.12507](https://arxiv.org/abs/2607.12507)
- [Agentic decompilation study, arXiv 2606.06838](https://arxiv.org/abs/2606.06838)
- [When LLM Decompilers Recompile More and Preserve Less, arXiv 2609.05370](https://arxiv.org/abs/2609.05370)
- 本课描述的 rea 6.5.0 源码，标签为 `3b79af2`： `src/domain/evidence.ts`, `.agents/skills/reverse-engineer-anything/SKILL.md`, `docs/cli.md`, `src/domain/reconstructionVerification.ts`, `src/application/ReconstructionObligationCandidates.ts`, `docs/tool-design.md`, `src/domain/evidenceCompletionLedger.ts`, `src/domain/residualUnknown.ts`, `src/application/investigation/UnknownEvidence.ts`, `.agents/skills/reverse-engineer-anything/references/evidence-workflows.md`, `src/application/binary/AnalysisSnapshotCache.ts`, `src/domain/analysisSnapshot.ts`, `src/application/binary/BinarySession.ts`, `src/application/binary/BinarySessionRecords.ts`, `docs/mcp-contracts.md`.
