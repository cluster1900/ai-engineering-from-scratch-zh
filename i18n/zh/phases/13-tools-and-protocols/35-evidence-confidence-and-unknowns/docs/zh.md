# 分析中的证据,信任与未知

> 编译程序的一个发现应该是有着哈希,信任,权力来源以及无法证明的事项的记录.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 32（从零构建 ELF）、Phase 13 · 33（反汇编与控制流）、Phase 13 · 34（提升为伪代码）
**Time:** ~105 分钟

## 学习目标

- 参照 实际的`Evidence`构建证据记录,区分观察收入"",推导收入和推测收入的信任类别.
- 计算基于内容的标识符,使文件移动到其他目录时标识符保持不变.
- 提供者不能展示的内容将被限制,并让记录与传递的限制.
- 在函数的实际观察运行提供支持之前,拒绝断言结果.
- 将剩余未知的项目保存为通过哈希链接的带修改版本记录.
- 按精确键缓存提供者的回答,并拒绝过期重放.

## 问题

你问一个智能体:`ledger-x86_64-O1.o`中中 `grade`对分数55 返回什么?智能体调用 rea,读取Ghidra 伪代码,回答0――审阅者追问它是如何知道的――智能体手中只有一个段 Ghidra 输出文本――默认路径上的文本是`uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);`△该位置的字节却表示`xor eax, eax`,我知道.

这种表达和指令对所有输入都产生了0,但智能体不知道这一点.[NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)),指出四种反复出现的弱点:训练偏差,过度信任观察结果,上下文限制,以及坚持原计划.[arXiv 2607.12507](https://arxiv.org/abs/2607.12507)

 rea 6.5.0 为此提供一个词汇. 每次成功的工具调用都会产生一条`Evidence`记录,其`confidence`为`observed`,我知道.`derived`或`inferred`没有带有`authority`和 `limitations`列表──随附技能告诉智能体:每一个结论都必须区分观察、推断和未知项──引用证据ID,保留限制和不完整的覆盖范围,绝不能暗示静态分析观察到了执行──

实际将留给你处理的三个事情:快照缓存是精确的查询结果,而不是分析;当某个比较维度未改变时,验证就决定断言通过,但源码注释明确说,通过并不能确定全局实现等价;义务账本只接收了JavaScript和托管图的候选,因此原生函数无法通过它.`verified`,我知道.

本课程使用纯Python 补充缺失部分. 你将编写一个账本,将关于具的每一个事实存储成内容哈希的记录.`percent_change`和 `grade`作出预测,标记为推测,再使用自己编译的测试程序运行结果核对;还会导入两条真实的真实记录及其来源快照,让账本重新计算真实写的每哈希――

```figure
re-evidence-ledger
```

## 三种置信类别,五种权威来源

`confidence`只有三个值的举例,绝对不是数值.`authority`有五个值――生产者未作说明时,rea默认使用`shipped-artifact`和 `observed`,我知道.

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

两种混最浪费时间. 第一种把伪代码视为对行为的观察.实际上,它只是对Ghidra 输出内容的观察. 第二种把空列表视为不存在的证明.`code/main.py`中央账本将实现这两条规则编码.

## 记录

据报道,该地区已有16个段落,`code/main.py`由于使用与真相相似的名称,因此双方产生的记录都能通过对方验证.`relationship_coverage`表示调用者或被调用者列表的完整程度.`complete`,我知道.`partial`或`unknown`操作不报告调用关系,则为`null`,我知道.

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

下面是真正的原因`grade`写入的真实记录,只保留本节关注的字段.`code/fixtures/rea-evidence-grade.json`长小为37573字节.

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

分析配置中真实的`parameters`实在有25个键,真实.`limitations`列表有十句话――请全部保留――限制属于内容的一部分,删除一项就会改变标识符,账本也会因此拒绝该记录――

注意记录没有说什么.`environment`为`null`因为Ghidra只读文件,没有运行代码.`locations`由于操作在空中`normalized_result`报告地址:`relationship_coverage`的状态为`complete`由于这些问题,但其诊断说明只返回已解析的Ghidra调用引用,未解析的计算型或间接调用仍然为未知.

## 标识符是内容哈希,路径不参与计算

根据RFC 8785 规范化为JSON,计算SHA-256,再加上`ev_`之前,得到了`evidence_id`◎该投影保留主体的`digest`,我知道.`format`和 `architecture`走掉`name`和 `local_path`,当`relationship_coverage`为`null`时也删除它,因此不含调用关系的记录,仍然保持该段出现之前的标识符.`raw_result`和每一个限制,都会参与哈希.

RFC 8785 对象键排序,移除空白,并固定数字和字符串的表示形式. 对数字全部为整数的记录,Python 标准库可以产生相同字节:

```python
def canonical_json(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
```

`code/main.py`在哈希之前拒绝浮点数,因为RFC 8785与Python对某些浮点数的输出不同.

| rea 的值 | `code/main.py` 重新计算的结果 |
|---|---|
| `grade` 的 `ev_67b6d3f992eaf49a…` | 相同 |
| `percent_change` 的 `ev_e88b10dc0c6400e5…` | 相同 |
| 对 `{provider, parameters}` 计算的配置摘要 `9c7f6b24be69294e…` | 相同 |
| `grade` 快照条目的 `query_26122aebe9d8abae…` | 相同 |
| `percent_change` 条目的 `query_0f95ef38038d3666…` | 相同 |

为什么排除路径?对相同字节的相同观察,无论机器和目录如何变化,都应获得相同的标识符.`local_path`指向某台Mac 上的目录;将具复制到`/home/you/re`后,标识不会改变.`rebind_subject_path()`允许使用新路径展示记录;当`sha256`,我知道.`format`或`architecture`另外,它会拒绝. 区域6.5.0 在为新路径目标重放快照记录时,也通过.`rebindEvidenceToTargetPath`执行同样操作.

`validate_evidence()`重新计算标识符,若不匹配则使用 rea 的消息拒绝:证据语义识别符不匹配其记录──若记录的 `analysis_profile.provider`与`provider`不一致,它也会拒绝.`test_tampered_id_and_mismatched_profile_are_rejected`修改真实`grade`记录中的一行伪代码,并观察账本拒绝它.

## 自己观察目标文件

在调用任何提供者之前,账本先读取文件.`observe_object()`用`struct.unpack_from`解析ELF64 节头`.symtab`,我知道.`.strtab`和 `.rela.text`,它写入一条`inspect_object`记录,并为每个函数符号写入一条`read_function_bytes`记录――这五条记录均为`observed`权威来源为`shipped-artifact`因为它来自磁盘文件.

| 记录 | 内容 | 标识符 |
|---|---|---|
| `inspect_object` | 五个节的偏移、大小和哈希，四个函数，三条重定位 | `ev_645e0a145f28bd5c…` |
| `read_function_bytes percent_change` | `.text+0x00` 处的 16 字节 | `ev_2572a7d254ad15cb…` |
| `read_function_bytes grade` | `.text+0x10` 处的 46 字节，SHA-256 为 `ffcb75c2a7bb1104…` | `ev_a467c2427bfc0c56…` |
| `read_function_bytes total` | `.text+0x40` 处的 31 字节 | `ev_b1e845cea2543073…` |
| `read_function_bytes grade_label` | `.text+0x60` 处的 63 字节 | `ev_c50041be26e6b7f4…` |

`llvm-objdump -t`与之相符:`grade`位于`0000000000000010`为了`2e`,我知道.`.rela.text`中中三条重定位均为针对性`.rodata`的`R_X86_64_PC32`偏移分别为`0x36`,我知道.`0x84`,我知道.`0x93`增加分别为`0x10`,我知道.`0x24`,我知道.`-0x4`每条记录都带有`file-offset-range`位置和一个限制:节字节从磁盘文件读取──读取器不应用重定位,也不运行代码──

第32课完整构建了这个读取器.这里只需要60行,因为这课关注的是你如何记录读取过程.

## 推导表,并明确说明它是推导结果

`grade`节目中包含第33节的四种模式:

| 字节 | 指令 | 在 `grade` 中的偏移 |
|---|---|---|
| `48 69 c0 67 66 66 66` | `imul rax, rax, 0x66666667` | 3 |
| `48 c1 f9 22` | `sar rcx, 34` | 13 |
| `83 c1 fa` | `add ecx, -6` | 23 |
| `83 f9 04 77 0c` | 先 `cmp ecx, 4`，再 `ja` | 28 |

乘以`0x66666667`后右移 34位,相当于有符号除以 10 ⋅文件中没有 10 ⋅`derive_grade_model()`根据乘数 0x66666667 和移位量 34 推导的.文件中没有10.

`add ecx, -6`第一个分支设为6个.`cmp ecx, 4`配合无符号跳转允许五分支,即6至10

`.text+0x33`处的`lea`带有更多的数量为`0x10`重定位的实际地址计算涉及四节位移的末端,因此表现从`.rodata+0x14`开始──那里的五个小字为`1, 2, 3, 4, 4`,我知道.`ledger.c`中间交换器将交换 转换 返回值查找表

生成的记录`ev_605106bff2d9998f…`的`confidence`为`derived`没有任何`evidence_links`转向依赖的两条观察记录. 从账本中删除字节记录,推导记录就会出现悬空链接.`ev_a467c242…`时,上图会显示这个状态.

现在与Ghidra比较.它对相同字节的伪代码如下:

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

基德拉 应用重定位,并将表命名为`DAT_001000b4`当它将`.text`放到`0x100000`后,这是`.rodata+0x14`△它恢复出除以10和五分支.对于默认值,它输出一个永远等于0的表达式,但从来没有直接写出0的表达式.`native_value_flow`中部的p代码将这些操作标记为`is_dead: true`,你从中理解的含义属于推导,而你预期运行会得到的价值属于推测.

`percent_change`记录显示了另一种失败.`undefined1 [16] percent_change(int param_1,int param_2,ulong param_3)`源码是`int percent_change(int before, int after)`,我知道.`idiv`写入`EDX:EAX`零值路径没有修改`EDX`因此反编译器推断了16字节回值和第三个参数.`grade`给出`native_api.return_type.confidence`是 `"low"`应恢复签名视为提供者的推断,并如实记录.

## 预测是推测记录

预测是关于行为的断言,尚未得到任何观察结果的陈述.`claim_suite()`根据推导模型和源码构建十八项预测.`record_prediction()`将每项存活为`confidence`为`inferred`,我知道.`authority`为`analyst-inference`记录,并链接到所依赖的记录.

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

`predict()`使用C语义,而不是Python语义。`c_div()`截至零截至`wrap32()`将每个中间值折返32位.`//`负无穷取整体,因此`(3 - -7) * 100 // -7`得到 -143,而C程序得到 -142――第36课将大幅扩大这个输入网格――

每项预测都会新建一个剩余未知项.`controlled-replay`的`observed`证据,并建议一次探测:在宿主机构建上执行`execute_function`△下一节会产生这种证据. 第一个级断言问题是:

## 对照实际运行检查

`code/fixtures/harness.c`包含`ledger.c`每次调用打印一个结果.`observe_runs()`使用上找到的第一条`clang`,我知道.`cc`或`gcc`编译它,并将网格中的每一个输入运行一次.

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

运行记录的主体是测试驱动程序二进制文件,在Mac上它是Mach-O arm64文件,拥有自己的SHA-256──提供方是`course-harness`附带编译器版本行,这里为`Apple clang version 17.0.0 (clang-1700.6.3.2)`,我知道.`evidence_links`指向源码记录`ev_2f1e6d251543d017…`由于运输产品和目标文件只共享`ledger.c`其他不同.

请把第一项限制读两遍. x86-64 目标文件从未运行过这个机器.实际运行的是同一源码针对另一架构的第二次构建. 这仍然是观察,而且在没有模拟器的情况下,它是最强大的证据,所以断言可以通过,但必须附上这个限制.

预测全部符合.`code/fixtures/run-evidence.json`保存了这17条记录和源码记录,于2026-10-13使用`--record`导出──没有编译器时,`build_ledger()`导入该证书包,不运行程序,并报告`runs`字段中明确说明――

## 提升规则

断言只通过观察运行才能得到支持.`check_claim()`查找函数和参数相同`execute_function`记录,将每个结果与预测比较,并统计覆盖的输入:

| 状态 | 条件 | rea 的完成账本 |
|---|---|---|
| `pass` | 每个输入都有一致的运行，且没有不一致结果 | `pass` |
| `fail` | 任一次运行不一致 | `fail` |
| `unknown` | 部分输入有运行，其他输入没有 | `unknown` |
| `unsupported` | 没有任何输入有运行记录 | `unsupported` |

`promote_claim()`是严格版本.`inferred`或`derived`记录时,它都会抛出`ClaimError`标识符指向其他函数或其他参数运行时,也会抛出异常;列表为空或运行覆盖输入时,也少于断言要求,同样如此.`grade(55)`虽然有了Ghidra 伪代码记录和表模型,但它们都不能提升这一断言.`ev_7be90c0c…`你会看到一个下降的断言`unsupported`尽管关于`grade`两条记录仍然存在.

范围断言显示部分覆盖情况. 在其十个输入中,只有95和100个现出运行网格中.`check_claim()`返回`unknown`没有任何`covered`为11个中的2个;`promote_claim()`则拒绝,消息为 211条输入已经观察到运行──账本不会把这个结果上升成完整覆盖──

`completion_ledger()`应对的`EvidenceCompletionLedger`△其标识符是`ecl_`记录内容的哈希,而且只有`pass`等于`total`时,`complete`才为真――因为那一项范围断言,演示输出`ecl_da64933ea13befed…`并显示`complete: false`,我知道.

## 无人知项是带哈希链的记录

实际将剩余未知的项目保存为严格结构记录.`code/main.py`使用相同字段和相同不变量.

标识符是`unk_`加  `{domain, question, scope_digest}`两个分析师对同一文件提出相同的问题,得到相同的标识符.`scope_digest`是目标文件的SHA-256──

每次修改都产生新修改版本.`previous_revision_digest`为`null`◎后续每次修订都引用前一版本的`revision_digest`摘要覆盖除了自己以外的所有字段.`verify_unknown_chain()`遍历列表,重新计算每个摘要,检查每个链接是否指向前一版本,并检查每个版本引用的变化证据是否存在账本中.

每次变化本身也是证据记录,与实际使用提供方`rea-unknown-registry`课程记录的做法相同.`confidence`为`derived`没有任何`authority`为`analyst-inference`没有主体,其限制为: 注册表变更记录分析师的决定,不证明问题的答案.

这就是这项演示的81条记录中包含36条推导型变更记录的原因:18次新建和18次更新.

每个修改都必须满足三个不变量:

- 只有`resolved`没有什么可知.`resolution`只有修订1 没有前驱.
- `contradicted`不知项至少引用一个反驳证据标识符,并且同一标识符不能同时出现在两个列表中.
- `verified`解决结果至少引用一个具有需要信任类别和权威来源的证据标识符.

第三条规则是账本最常拒绝操作的地方.`resolve_unknown()`拒绝表范式,也拒绝权威来源为`shipped-artifact`观察记录,但接受运行记录`ev_f4ffbe8f922ec7fe…`,我知道.`grade(95)`已解决的修订为版本 2,其`previous_revision_digest`为`ffca840b55a8a188…`修订1的摘要

`update_unknown()`接收`expected_revision`随着时间的过期,`revision-conflict`与实际的`update_unknown`工具相同──正确应对方式也与 rea的说明一致:重新读取当前版本,再作决定──

演示结束后,还有一个未知项目未关闭:`unk_f2eb0d7f84c80a19…`问题是,编译后的函数运行时,90到100的每个分数是否都满足了分数 (分数) == 4?其状态为`investigating`支持证据包括两次运行,探测建议仍列出9次未运行的输入.

## 回答缓存不是分析数据库

实际上有三种看起来像缓存的东西.`-readOnly -deleteProject`导入,关闭时删除――内存中的 `AnalysisSnapshotCache`为了一个二进制身份保存至10,000条目.`target`,我知道.`binding`,我知道.`entries`,我知道.`workflow_entries`和 `evidence_bundle`,我知道.

缓存键是`query_`加  `{target, binding, operation, parameters}`现在,我们需要一个方法.`target`为`{sha256, kind, format, architecture}`没有任何`raw-binary`目标还包含`entry_point`,我知道.`binding`包含提供方及整个分析配置,连同摘要.修改25个配置参数中的任意一个,例如将`jump_table_evidence`从`typed-case-default-blocks-v1`改为`v2`摘要会变化,所有关键也会随之变化.

`code/fixtures/rea-snapshot.json`是实际在两次运行期间写入的文件,大小142,690字节. 区域 写入权限仅限于仓库副本,可读者阅读. 它包含两个条款,以及保存两条记录的证据包.`AnswerCache.import_snapshot()`重新计算每一个`query_id`任何不一致就拒绝了整个文件.`target`或`binding`与当前价值不同,则使用re 的措辞`profile_mismatch`拒绝;若`format_version`不是`course-answer-cache-1`我也会拒绝.

这台机器上的三次测量如下:首次`grade`查询重新导入Ghidra,耗时8.6秒;针对相同的快照`percent_change`查询时间8.5秒,因为不同查询不会被缓存.`grade`查询时间2.1秒,返回完全相同的记录和记录.`evidence_id`◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎`lookup()`另外,也添加类似说明,让读者分开重放与新回答.

变更会终止缓存使用――在6.5.0 rea 中,重新命名或添加注释会在调用发送给提供者之前清空快照缓存――失败响应不能证明已回滚的写入,因此写入失败也会停止重放――会修改数据库的元数据导入,同样如此――

## 为什么智能体需要它

通过MCP 驱动的智能体,每次调用都会看到完整的记录,并可在报告中引用`evidence_id`△2026年的研究指出,过度信任工具输出是NDSS BAR研究发现的四个弱点之一. 植入文本的研究中,即使只将二进制内容呈现为数据,40次中仍有15次不安全建议;加入来源检查和工具授权后,这些建议才被消除.[arXiv 2606.06838](https://arxiv.org/abs/2606.06838)):对于拥有数百个函数的二进制文件,只有10%至15%的函数才在智能体生成代码之前得到真正的分析.

账本用记录回应每一个问题,智能体只报告账本中已有的内容――没有观察运行的断言为`unsupported`只有部分运行的断言为`unknown`提供方文本的`observed`只有针对供应商的输出,不代表更多.`outputs/`无论是使用Claude,Cursor,Codex,OpenClaw,Hermes还是其他读 Skill.md的智能体,都应如此.

## 构建自己

运行仅使用标准库的演示:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
```

演示读取目标文件,导入两条 rea 记录,验证 rea 快照,并推导两个模型.

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

没有C编译器时,`runs`显示`imported 17 recorded run records from run-evidence.json`其他都是相同的.

按以下顺序阅读 `code/main.py`其他:

1. `canonical_json()`和 `compute_evidence_id()`实现哈希方法和语义投影――
2. `create_evidence()`和 `validate_evidence()`构建并检查记录――
3. `EvidenceLedger.record()`和 `import_bundle()`保存记录并拒绝冲突.
4. `open_unknown()`,我知道.`update_unknown()`和 `resolve_unknown()`维护修订链――
5. `observe_object()`读取ELF,`derive_grade_model()`读取表.
6. `claim_suite()`,我知道.`predict()`和 `record_prediction()`写入推测层记录――
7. `observe_runs()`将测试驱动程序的每次运行转化为观察记录.
8. `check_claim()`,我知道.`promote_claim()`和 `completion_ledger()`应用提升规则――
9. `AnswerCache`像真实 快照一样为回答设置键,并拒绝过期结果.

## 使用它

为每一个目标,每一次调查分别维护账本. 在每个主题中写目标的SHA-256, 在每个未知的项目中写问题范围摘要.`provider`让标识符自然分化. 重新构建具时,主体摘要改变,所有旧记录都成为关于另一个文件的证据.

一旦知道限制,就立即写下――读取器不应用重定位,就明确说明;运行的是主机机构建,就明确说明;模型推导了除数,也明确说明――缺少限制的记录看起来会比事实允许更强,后来的读者无法弥补这种损失――

通过将每个段子提供方文本都视为数据. 来自目标的字符串和伪代码都是由目标控制的文本,绝不能变成指令,也绝不能变成行为观察.`_meta.provenance.untrusted_content: true`标记此类结果――其服务器指令要求模型将目标内容视为数据,并将其中要求运行,安装,下载或发送内容的请求报告作为提示注入企图――标记有帮助,但账本仍然必须确保目标文本不会进入指令层――

## 交互实验

### 实验 A:重新计算 标识符

在`code`目录中启动Python:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns/code
python3 -q
```

运行:

```python
from main import *
record = load_evidence_file(FIXTURES / "rea-evidence-grade.json")
record["evidence_id"] == compute_evidence_id(record)
record["subject"]["local_path"] = "/home/you/re/ledger-x86_64-O1.o"
record["evidence_id"] == compute_evidence_id(record)
record["limitations"].pop()
record["evidence_id"] == compute_evidence_id(record)
```

由于路径不参与哈希. 第三种是假的,因为限制属于内容.

### 实验B:拒绝提升

```python
ledger, report = build_ledger(live_runs=False)
claim = [c for c in claim_suite(ledger.find(operation="derive_switch_model")[0], ledger.find(operation="derive_arithmetic_model")[0], ledger.find(operation="read_source")[0]) if c.claim_id == "grade(55)"][0]
promote_claim(ledger, claim, [ledger.find(operation="derive_switch_model")[0]["evidence_id"]])
```

调用抛出`ClaimError`指出推导记录的标识符.

```python
run = run_records_for(ledger, "grade", [55])[0]
promote_claim(ledger, claim, [run["evidence_id"]])["status"]
```

状态为`pass`返回的`limitations`保留宿主机构建说明

### 实验C:拒绝过期快照

```python
import json
snapshot = json.loads(REA_SNAPSHOT_PATH.read_text())
target, binding = rea_snapshot_binding(snapshot)
AnswerCache(target, binding).import_snapshot(snapshot)
stale = dict(binding["analysis_profile"]["parameters"], jump_table_evidence="typed-case-default-blocks-v2")
AnswerCache(target, {"provider": binding["provider"], "analysis_profile": make_profile(binding["provider"], stale)}).import_snapshot(snapshot)
```

第一次进返回,第二次抛出带`profile_mismatch`的`CacheError`只是一个版本字符串,整个快照就被拒绝了.

### 实验 D:破坏链

```python
unknown_id = [u for u, r in ledger.unknowns.items() if r[-1]["status"] == "investigating"][0]
ledger.verify_unknown_chain(unknown_id)
ledger.unknowns[unknown_id][0]["severity"] = "critical"
ledger.verify_unknown_chain(unknown_id)
```

第一次调用回归 2... 第二次抛出`EvidenceIntegrityError`修订1不再与自身摘要相匹配,而修订2则指向一个已经不存在的摘要.

## 实践实验

关闭未解决的未知项目,并添加第二个提供方.

要求:

- 扩展`run_grid()`运行范围断言缺少的九条输入,然后确认未知的项目在修订3 变为`resolved`,我知道.
- 将`llvm-objdump -d`添加为第二个提供方,使用自己的.`provider`对象将其`grade`清单记录为`observed`,我知道.
- 写入一条`derived`记录,说明Ghidra 和 llvm-objdump的两个单单解码出相同的14条指令,并同时链接两者──
- 为`grade_label(105)`新建严重程度为`high`由于表索引 4 会读取 `labels[4]`通过实际运行解决它.
- 使用 `export_bundle()`导出账本,再导入全新账本,证明每条链仍然可以通过验证.

成功标准:报告的每句话都引用证据包中的标识符,且那项`unknown`断言已消除.

## 评分实验

五个关于本课件的题目. 用你构建的代码找到每个答案,然后写入.`code/lab_answers.json`△数字写成数字,或写成`"0x40"`这样十六进制字符串;列表写成JSON列表.

1. `t1`计算证据 作为实际证据的类型.
2. `t2`记录中限制的数量.
3. `t3`记录的关系_覆盖 状态――
4. `t4`记录的信心和权威,由两个字符组成的列表.
5. `t5`类型: 记录中科目 的 SHA-256。

检查你的答案:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/lab.py
```

检查器在已提交的固定上使用 `code/main.py`计算每个期望值.`PASS`,我知道.`FAIL`或`TODO`只有五个问题全部通过,才以0退出.`python3 code/lab.py my-answers.json`可检查另一个文件.`code/tests/test_lab.py`证明检查器接受正确答案并拒绝错误答案──

### 看它运行

[Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler?symbols=off)机器维护一本证据账本,分为四个托盘:观察,衍生,推导和未知――这个链接在关闭符号表的情况下开运行,因此函数名称和函数结尾归入未知,起始位置归入归入推断――

## 本课产物

本课产出发 `outputs/skill-evidence-ledger.md` 智能体将每项发现都写成信任类别,权力来源,限制和链接记录,说明如何使用修改版本维护未知项目,以及何时将判断断言`pass`,我知道.`fail`,我知道.`unknown`或`unsupported`,我知道.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

测试证明:

- 两种`evidence_id`、配置摘要及两个快照`query_id`城市可以从内容重新计算
- 改变路径不改变标识符,改变限制则改变标识符
- 改记录,提供不匹配配置,浮点数和未知的举值都会被拒绝
- 重复记录回归 `duplicate`冲突记录出现异常,证据包装导入具有原子性
- 已记录的运行证据包入口后有18条记录,没有悬空链接
- 已关闭评论 已关闭评论`expected_revision`只有观察.`controlled-replay`证据才能解决它
- 编辑修订内容会破坏链
- 提升拒绝推测,推导,空列表和无关证据,只有在运行结果一致时通过
- 部分覆盖为`unknown`运行则为`fail`
- 缓存只在键完全一致时命中,其他参数不会命中
- 缓存拒绝升级配置版本、错误目标、错误格式版本和改键
- 读取器在偏移,大小,字节和重定位上与`llvm-objdump`一致,表中读出`1, 2, 3, 4, 4`
- 预测使用C除法语义,且已记录运行与全部17项单输入断言一致
- 存在编译器时,实时运行结果也一致

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

用三种类别记录你读的内容,计算的内容和预期结果. 用标识符关闭未知项,绝不需要一句话代替证据.

## 延伸阅读

- [rea 6.5.0 source, `src/domain/evidence.ts` and `src/domain/residualUnknown.ts`](https://github.com/morluto/rea)
- [RFC 8785, JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785)
- [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Agent Failure Patterns in CTF Reverse Engineering, NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)
- [When Binaries Talk Back: Representation-Confusion Attacks on LLM-Assisted Reverse Engineering, arXiv 2607.12507](https://arxiv.org/abs/2607.12507)
- [Agentic decompilation study, arXiv 2606.06838](https://arxiv.org/abs/2606.06838)
- [When LLM Decompilers Recompile More and Preserve Less, arXiv 2609.05370](https://arxiv.org/abs/2609.05370)
- 本课描述的 rea 6.5.0 源码,标签为 `3b79af2`其他`src/domain/evidence.ts`现在`.agents/skills/reverse-engineer-anything/SKILL.md`现在`docs/cli.md`现在`src/domain/reconstructionVerification.ts`现在`src/application/ReconstructionObligationCandidates.ts`现在`docs/tool-design.md`现在`src/domain/evidenceCompletionLedger.ts`现在`src/domain/residualUnknown.ts`现在`src/application/investigation/UnknownEvidence.ts`现在`.agents/skills/reverse-engineer-anything/references/evidence-workflows.md`现在`src/application/binary/AnalysisSnapshotCache.ts`现在`src/domain/analysisSnapshot.ts`现在`src/application/binary/BinarySession.ts`现在`src/application/binary/BinarySessionRecords.ts`现在`docs/mcp-contracts.md`现在,我们要去.
