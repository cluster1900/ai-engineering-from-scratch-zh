# Bằng chứng trong phân tích 2

> Một phát hiện của một quy trình biên dịch là một tài liệu có tính chất có tính chất, tin tưởng, quyền lực, và ghi lại danh sách các vấn đề không thể chứng minh được.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 32（从零构建 ELF）、Phase 13 · 33（反汇编与控制流）、Phase 13 · 34（提升为伪代码）
**Time:** ~105 分钟

## Học mục tiêu

- 参照 thực tế `Evidence` xây dựng hồ sơ chứng cứ, phân biệt quan sát thu nhập  thu nhập dẫn và thu nhập dẫn theo phân loại tín ngưỡng
- 计算 dựa trên nội dung Hash của các chỉ số, để các tập tin di chuyển đến các danh mục khác khi chỉ số giữ không thay đổi.
- Mỗi người cung cấp sẽ không thể hiển thị nội dung ghi nhớ được hạn chế, và sẽ cho phép hạn chế cùng lưu trữ được truyền tải.
- Trong thực tế quan sát của hàm, trước khi cung cấp hỗ trợ, từ chối kết quả.
- sẽ lưu các mục chưa biết còn lại để ghi lại bản sửa đổi của các liên kết Hash.
- 按精确键缓存提供方的答案,并拒绝过期重放──

## 问题

Anh hỏi một người thông minh:`ledger-x86_64-O1.o`Trung `grade`Đối với số điểm 55  trả lại gì? Nhóm thông minh sử dụng thực tế, đọc Ghidra 伪代码, trả lời 0──`uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △    △ △ △ △ △               △ △                                                       `xor eax, eax`

Sự biểu hiện này và chỉ thị này cho tất cả các đầu vào đều tạo ra 0, nhưng các bộ não thông minh không biết điều này. Nó chỉ đơn giản là bởi vì văn bản từ công cụ đã tin vào nó. Một nghiên cứu năm 2026 cho phép ba bộ não thông minh thực hiện 24 nhiệm vụ kỹ thuật ngược chiều.[NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)), chỉ ra bốn điểm yếu lặp lại: tập luyện phân biệt, quá mức tin tưởng quan sát kết quả, hạn chế trên văn bản, cũng như tuân thủ kế hoạch ban đầu.[arXiv 2607.12507](https://arxiv.org/abs/2607.12507)(■)

rea 6.5.0 để cung cấp một bộ từ ngữ.`Evidence`记录,其 `confidence`Vì vậy`observed``derived`Hoặc`inferred`,并带有`authority`和 `limitations`列表──随附技能告诉智能体: Mỗi kết luận đều phải phân biệt quan sát, kết luận và những điều chưa biết──引用证据ID,保留限制和不完整的覆盖范围,绝不能暗示静态分析观察到了执行──

Thực ra sẽ để cho bạn xử lý ba điều: Quick照缓存 là kết quả truy vấn chính xác, chứ không phải phân tích; khi một số quy mô so sánh không thay đổi, xác nhận đã quyết định kết luận thông qua, nhưng nguồn mã ghi nhận rõ ràng, thông qua không thể xác định toàn bộ thực hiện giá bình đẳng; obligations sổ chỉ nhận được từ JavaScript và các ứng cử viên trong quản lý, do đó hàm gốc không thể đạt được nó.`verified`

Bài học này sử dụng Python hoàn thiện phần thiếu sót. Bạn sẽ viết một sổ sách, lưu lại từng sự thật về các thiết bị trong một bản ghi nội dung.`percent_change`和 `grade`作出预测,标记为推测,再使用自己编译的测试程序的运行结果核对;还会导入两条真实的真实记录及其来源快照,让账本重新计算真实写入的每哈希――

```figure
re-evidence-ledger
```

## 三种置信类别,五种权威来源

`confidence`Chỉ có 3 giá trị, không phải là giá trị số.`authority`Có 5 giá trị:`shipped-artifact`和 `observed`

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

两种混最浪费时间――第一种把伪代码视为对行为观察;实际上,它只是对 Ghidra 输出内容的观察――第二种把空列表视为不存在的证明――区域的设计说明非常严格:缺缺覆盖意味着未知,而不是不存在――`code/main.py`Trung tâm sổ cái sẽ thực hiện hai quy tắc mã hóa này.

## 记录

Một câu chuyện ghi lại có 16 đoạn, vùng 6.5.0 sẽ từ chối bất kỳ đoạn nào khác.`code/main.py`Sử dụng cùng tên với thực, do đó, các hồ sơ được tạo ra từ cả hai bên đều có thể qua chứng nhận đối tác.`relationship_coverage`Quản lý danh sách người dùng hoặc người được sử dụng đầy đủ.`complete``partial`Hoặc`unknown`Nếu hoạt động không báo cáo về mối quan hệ, thì`null`

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

Đứng dưới là thật.`grade`写入的真实记录, chỉ giữ lại phần quan tâm của phần này.`code/fixtures/rea-evidence-grade.json`, 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字节: 字: 字节: 字: 字: 字节: 字: 字: 字: 字: 字: 字: 字: 字: 字: 字: 字: 字:

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

分析配置中真实的 `parameters`Đối tượng có 25 khóa, thật sự.`limitations`列表有十句话──请全部保留──限制属于内容的一部分,删除一项就会改变标识符,账本也会因此拒绝该记录──

chú ý ghi chép không nói gì.`environment`Vì vậy`null`Vì Ghidra chỉ đọc tài liệu, không có mã hành trình.`locations`Vì vậy, vì điều này hoạt động trong `normalized_result`Nội dung báo cáo:`relationship_coverage`  trạng thái`complete`, nhưng chỉ dẫn chẩn đoán của nó chỉ trả lại các trích dẫn đã được phân tích, các loại tính toán chưa được phân tích hoặc các loại điều tra gián tiếp vẫn còn chưa được biết.

## 标识符 là nội dung 哈希,路径不参与计算

sẽ ghi lại một dự án theo RFC 8785  quy định hóa thành JSON, tính SHA-256, thêm vào`ev_`Trước, nhận được `evidence_id`◊ 該投影保留主体的 `digest``format`和 `architecture`, đi đi`name`和 `local_path``relationship_coverage`Vì vậy`null`时也删除它, do đó không bao gồm ghi chép của mối quan hệ, vẫn giữ các mã thông báo trước khi đoạn này xuất hiện.`raw_result`Và mỗi giới hạn, tất cả mọi người đều sẽ tham gia.

RFC 8785 đối với các mục thứ tự khóa, di chuyển trống,并 cố định hình thức biểu hiện số và chuỗi. Đối với các số toàn bộ cho toàn bộ số ghi chép, Python  tiêu chuẩn thư viện có thể tạo ra các chữ cái tương tự:

```python
def canonical_json(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
```

`code/main.py`Trong khi đó, RFC 8785 đã từ chối số điểm浮点, vì RFC 8785 và Python không giống nhau với các đầu ra của số điểm浮点.

| rea 的值 | `code/main.py` 重新计算的结果 |
|---|---|
| `grade` 的 `ev_67b6d3f992eaf49a…` | 相同 |
| `percent_change` 的 `ev_e88b10dc0c6400e5…` | 相同 |
| 对 `{provider, parameters}` 计算的配置摘要 `9c7f6b24be69294e…` | 相同 |
| `grade` 快照条目的 `query_26122aebe9d8abae…` | 相同 |
| `percent_change` 条目的 `query_0f95ef38038d3666…` | 相同 |

Tại sao loại bỏ đường? đối với cùng một văn bản quan sát, bất kể máy tính và danh mục thay đổi như thế nào, tất cả đều nên nhận được cùng một nhận dạng.`local_path`指向某台 Mac 上的目录;将具复制到 `/home/you/re`后, 标识 sẽ không thay đổi.`rebind_subject_path()`允许使用新路径展示记录;当 `sha256``format`Hoặc`architecture`Đồng thời, nó sẽ từ chối.`rebindEvidenceToTargetPath`执行同样操作――

`validate_evidence()`重新计算标识符,若不匹配则使用 rea 的消息拒绝:证据语义标识符不匹配其记录──若记录的 `analysis_profile.provider`Với`provider`Không phù hợp, nó cũng sẽ từ chối.`test_tampered_id_and_mismatched_profile_are_rejected`修改真实 `grade`Trong một dòng mã giả trong hồ sơ,并观察账本拒绝它.

## Bản thân quan sát mục tiêu

Trong khi sử dụng bất kỳ cung cấp nào, sổ sách trước đọc các tài liệu.`observe_object()`用 `struct.unpack_from`解析 ELF64 节头、`.symtab``.strtab`和 `.rela.text` Nó viết vào một bài`inspect_object`记录,并为每个函数符号写入一条 `read_function_bytes`记录──这五条记录均为 `observed`, quyền lực xuất phát từ`shipped-artifact`Vì nguồn gốc là các tài liệu đĩa.

| 记录 | 内容 | 标识符 |
|---|---|---|
| `inspect_object` | 五个节的偏移、大小和哈希，四个函数，三条重定位 | `ev_645e0a145f28bd5c…` |
| `read_function_bytes percent_change` | `.text+0x00` 处的 16 字节 | `ev_2572a7d254ad15cb…` |
| `read_function_bytes grade` | `.text+0x10` 处的 46 字节，SHA-256 为 `ffcb75c2a7bb1104…` | `ev_a467c2427bfc0c56…` |
| `read_function_bytes total` | `.text+0x40` 处的 31 字节 | `ev_b1e845cea2543073…` |
| `read_function_bytes grade_label` | `.text+0x60` 处的 63 字节 | `ev_c50041be26e6b7f4…` |

`llvm-objdump -t`与之相符:`grade`位于 `0000000000000010`, ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm`2e``.rela.text`Trung 三条重定位均为针对 `.rodata`của `R_X86_64_PC32`,偏移分分为 `0x36``0x84``0x93`, tăng số phân biệt vì `0x10``0x24``-0x4` Mỗi bài đăng đều có`file-offset-range`位置和一项限制: 节字节 từ đĩa đơn文件读取──读取器不应用重定位,也不运行代码──

Chương 32  Bài học hoàn toàn xây dựng máy đọc này. Ở đây chỉ cần 60 bài, vì bài học này tập trung vào cách bạn ghi lại quá trình đọc.

##                                                                                                                                                                                                                                                               

`grade`Trong 46 chữ cái có chứa 33 课解码过的四种模式:

| 字节 | 指令 | 在 `grade` 中的偏移 |
|---|---|---|
| `48 69 c0 67 66 66 66` | `imul rax, rax, 0x66666667` | 3 |
| `48 c1 f9 22` | `sar rcx, 34` | 13 |
| `83 c1 fa` | `add ecx, -6` | 23 |
| `83 f9 04 77 0c` | 先 `cmp ecx, 4`，再 `ja` | 28 |

- Đúng rồi.`0x66666667`后右移 34位, tương đương với có biểu tượng trừ 10 ⋅ trong tài liệu không có 10 ⋅`derive_grade_model()`Để viết thực tế này để hạn chế: 除 số 10 là dựa trên số nhân 0x66666667 和移位量 34 推导的──文件中没有10──

`add ecx, -6`Đặt phần thứ nhất là 6`cmp ecx, 4`配合无符号跳转允许五分支, tức là 6 đến 10

`.text+0x33`处的 `lea`带有加数为 `0x10`Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác của PC32 Địa điểm chính xác`.rodata+0x14`开始──那里的五个小端字为 `1, 2, 3, 4, 4``ledger.c`Đổi trung bình đối với 60 đến 69  quay lại 1, đối với 70段 quay lại 2, đối với 80段 quay lại 3, đối với 90 đến 100  quay lại 4― biên dịch viên sẽ chuyển đổi để quay lại giá trị tìm kiếm biểu tượng―

Biểu sử sinh sản`ev_605106bff2d9998f…`của `confidence`Vì vậy`derived`- Tôi không biết.`evidence_links`Chỉ hướng vào nó hai bài quan sát ghi chép. Từ sổ xóa ghi chép chữ, ghi chép ghi chép sẽ xuất hiện trong các liên kết không gian.`ev_a467c242…`时,上图会显示 trạng thái này.

现在与Ghidra比较──它对同样字节给出的伪代码如下:

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

Ghidra  áp dụng đã định vị lại,并将表命名为`DAT_001000b4`Khi nó sẽ `.text`放到 `0x100000`后, đó là `.rodata+0x14` Nó được khôi phục ra với chia bằng 10 và 5 phần tử. Đối với giá trị mặc định, nó xuất ra một mãi bằng 0 nhưng không bao giờ trực tiếp viết ra biểu thức 0.`native_value_flow`Mã p trung tâm sẽ đánh dấu các hoạt động này như`is_dead: true`                                                                                                                                                                                                                                                              

`percent_change`记录 cho thấy một sự thất bại khác.`undefined1 [16] percent_change(int param_1,int param_2,ulong param_3)`Nhưng nguồn gốc là`int percent_change(int before, int after)``idiv`写入 `EDX:EAX`, và đường giá trị 0 không được sửa đổi`EDX`, do đó, các nhà biên dịch đưa ra 16 字节 trở lại và một số thứ ba.`grade` Giới thiệu `native_api.return_type.confidence` `"low"`◊ Đáng lẽ sẽ được khôi phục như một bản ghi nhận của người cung cấp.

## 预测是推测记录

预测 là một tuyên bố về hành vi, chưa có kết quả quan sát nào.`claim_suite()`根据推导模型和源码构建十八项预测──`record_prediction()`Để mỗi phần tồn tại`confidence`Vì vậy`inferred``authority`Vì vậy`analyst-inference`Các tài liệu của,并链接到所依赖的记录.

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

`predict()`Sử dụng C 语义, thay vì Python 语义。`c_div()`Đối với phân đoạn,`wrap32()`将每个中间值折回 32 位──Python của `//`        `(3 - -7) * 100 // -7`得到 -143, C 程序得到 -142.

Mỗi dự đoán sẽ xây dựng một dự án chưa được biết.`controlled-replay`của `observed`证据,并建议一次探测: trong tổ chức chủ nhà xây dựng trên thực hiện `execute_function`△下一节会产生这种证据──第一个级 断言问题是:编译后的函数实际运行时,级(95) == 4 是否成立?

## đối với kiểm tra thực tế

`code/fixtures/harness.c`包含 `ledger.c`, mỗi lần dùng in một kết quả.`observe_runs()`Sử dụng con đường trên tìm thấy thứ nhất `clang``cc`Hoặc`gcc`编译它,并将网格中的每个输入运行一次──每次运行都成为一个记录:

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

运行记录的主体是测试驱动程序二进制文件, trên Mac 上它是Mach-O arm64文件, có SHA-256 提供方是`course-harness`,附带编译器版本行, đây为 `Apple clang version 17.0.0 (clang-1700.6.3.2)``evidence_links`Chỉ dẫn nguồn tài liệu`ev_2f1e6d251543d017…`, vì vận chuyển sản phẩm và mục tiêu chỉ chia sẻ tài liệu`ledger.c`, ngoài ra không giống nhau.

Xin hãy giới hạn thứ nhất đọc hai lần. x86-64  mục tiêu tài liệu chưa bao giờ được chạy trên máy này. Thực tế là cùng một mã nguồn được chạy để xây dựng thứ hai của cấu trúc khác.

17 次单输入运行全部符合预测──`code/fixtures/run-evidence.json`保存了这17条记录和源码记录,于2026-10-13 使用 `--record`导出──没有编译器时,`build_ledger()`导 nhập chứng khoán này không chạy hành trình, và báo cáo `runs`字段中明确说明。

## 提升规则

断言 chỉ thông qua việc quan sát được, để được hỗ trợ từ suy đoán biến đổi.`check_claim()`查找 hàm và tham số giống nhau `execute_function`记录, sẽ mỗi kết quả so sánh với dự đoán,并统计覆盖的输入:

| 状态 | 条件 | rea 的完成账本 |
|---|---|---|
| `pass` | 每个输入都有一致的运行，且没有不一致结果 | `pass` |
| `fail` | 任一次运行不一致 | `fail` |
| `unknown` | 部分输入有运行，其他输入没有 | `unknown` |
| `unsupported` | 没有任何输入有运行记录 | `unsupported` |

`promote_claim()`                                                                                                                                                                                                                                                              `inferred`Hoặc`derived`记录时, nó sẽ bị bỏ ra `ClaimError`; Các chỉ số chỉ ra các hàm hoặc các tham số khác, cũng sẽ bị bỏ ra bất thường khi chạy; danh sách không hoặc chạy bao gồm nhập ít hơn khi yêu cầu tuyên bố, tương tự như vậy.`grade(55)`Đồng thời có Ghidra 伪代码记录和表模型, nhưng chúng đều không thể nâng cao câu nói này.`ev_7be90c0c…`, anh sẽ thấy lời nói xuống `unsupported`, mặc dù về `grade`n 2 ghi chép vẫn còn tồn tại.

Các tuyên bố có thể cho thấy tình hình của một phần bao phủ. Trong mười đầu vào, chỉ có 95 và 100 xuất hiện trong các hoạt động mạng.`check_claim()` quay lại `unknown`- Tôi không biết.`covered`为 11 个中的 2 个;`promote_claim()`则拒绝,消息为2 trong số 11 đầu vào đã quan sát được chạy──账本不会把这个结果上成完整覆盖──

`completion_ledger()`Đối phó với sự`EvidenceCompletionLedger`△ Its identifier is `ecl_`加记录内容的哈希,且只有 `pass`Đúng vậy.`total`时,`complete`才为真──因为那一项范围断言,演示输出 `ecl_da64933ea13befed…`,并显示 `complete: false`

## Không biết là ghi chép của Hồ Chí Minh

Thực sự sẽ lưu trữ những mục chưa được biết được để ghi lại cấu trúc nghiêm ngặt.`code/main.py`Sử dụng cùng một đoạn và cùng một không thay đổi.

标识符 là `unk_`加 `{domain, question, scope_digest}`Trong SHA-256, trong số các vấn đề liên tục trống trắng gấp lại thành một trống đơn.`scope_digest`Đó là mục tiêu của SHA-256:

Mỗi lần sửa đổi đều có một phiên bản mới.`previous_revision_digest`Vì vậy`null`后续每修订都引用前一版本的 `revision_digest`,摘要覆盖除自身以外的所有字段──`verify_unknown_chain()`Tham khảo danh sách, tính lại từng trích dẫn, kiểm tra từng liên kết có chỉ đến phiên bản trước, và kiểm tra liệu các thay đổi của từng phiên bản có tồn tại trong sổ sách hay không.

Mỗi biến đổi tự nó cũng là chứng cứ ghi lại, với thực sự sử dụng cung cấp `rea-unknown-registry`Thực hành giống nhau.`confidence`Vì vậy`derived`- Tôi không biết.`authority`Vì vậy`analyst-inference`, không có chủ đề, không có giới hạn cho:

Đó là lý do tại sao ghi chép 81 điều của bài thuyết trình có 36 điều dẫn đến sự thay đổi ghi chép: 18 lần xây dựng và 18 lần cập nhật.

Mỗi sửa đổi phải đáp ứng ba không thay đổi:

- Chỉ có`resolved`Không biết là có gì.`resolution`, và chỉ có sửa đổi 1 没有前驱――
- `contradicted`Các mục chưa biết ít nhất trích dẫn một biểu tượng chứng minh phản đối, và cùng một biểu tượng không thể xuất hiện cùng một lúc trong hai danh sách.
- `verified`Kết quả giải quyết ít nhất trích dẫn một nhân tố chứng minh có thể được tin tưởng và có nguồn quyền lực cần thiết.

Điều thứ ba quy tắc là nơi mà các kế toán thường từ chối hoạt động.`resolve_unknown()`拒绝表模型, cũng từ chối quyền lực`shipped-artifact`n ghi chép quan sát, nhưng chấp nhận ghi chép vận hành `ev_f4ffbe8f922ec7fe…``grade(95)`已解决的修订为版本 2,其`previous_revision_digest`Vì vậy`ffca840b55a8a188…`,即修订 1 的摘要──

`update_unknown()`接收 `expected_revision`, khi quá hạn `revision-conflict`, với thực tế`update_unknown`工具相同──正确应对方式也与 rea的说明一致:重新读取当前版本,再作决定──

 Sau khi diễn thuyết kết thúc, vẫn còn một mục chưa được biết:`unk_f2eb0d7f84c80a19…`, vấn đề là:  biên dịch sau hàm vận hành, 90 đến 100 của mỗi phân số liệu đã đáp ứng điểm số) == 4?其状态为`investigating`, hỗ trợ chứng cứ bao gồm hai lần vận hành, các đề xuất tìm kiếm vẫn còn được liệt kê trong 9 mục nhập chưa được vận hành.

##  trả lời缓存 không phải cơ sở dữ liệu phân tích

Có 3 cách trông giống như thứ lưu trữ.`-readOnly -deleteProject`导入,关闭时删除──内存中的 `AnalysisSnapshotCache`Để một hệ thống lưu trữ thứ hai lên đến 10.000 mục.`target``binding``entries``workflow_entries`和 `evidence_bundle`

缓存键是 `query_`加 `{target, binding, operation, parameters}`của SHA-256。`target`Vì vậy`{sha256, kind, format, architecture}`- Tôi không biết.`raw-binary`目标 cũng bao gồm `entry_point``binding`包含提供方及整个分析配置,连同摘要──修改 25 配置参数中的任意一个,例如将`jump_table_evidence`Từ `typed-case-default-blocks-v1`改为 `v2`, Quá trình sẽ thay đổi, tất cả các yếu tố cũng sẽ thay đổi.

`code/fixtures/rea-snapshot.json`là thực trong hai lần vận hành được viết trong tài liệu, lớn 142.690 字节.`AnswerCache.import_snapshot()`重新计算 mỗi `query_id`Nếu bất đồng thì bác bỏ toàn bộ tài liệu.`target`Hoặc`binding`Không giống như giá trị hiện tại, thì sử dụng thực của từ ngữ `profile_mismatch`拒绝;若 `format_version`Không `course-answer-cache-1`, cũng sẽ từ chối.

3 lần đo trên máy tính này là:`grade`查询重新导入 Ghidra, mất 8,6 giây; đối với cùng một bức ảnh `percent_change`Việc hỏi mất 8,5 giây, vì các câu hỏi khác nhau sẽ không được lưu trữ.`grade`Chuyện này mất 2,1 giây, trả lại hoàn toàn cùng một hồ sơ.`evidence_id`                                                                                                                                                                                                                                                                                                `lookup()`Cũng thêm một lời giải thích tương tự, để cho người đọc phân biệt lại với câu trả lời mới.

Trong rea 6.5.0, đổi tên hoặc thêm注释会在调用发送给提供者之前清空快照缓存──失败响应不能证明写入已回滚,因此写入失败也会停止重放──将修改数据库的元数据导入同样──

## Tại sao một cơ thể thông minh cần nó?

Thông qua MCP 驱动 rea của các cơ thể thông minh, mỗi lần gọi đều sẽ thấy ghi chép đầy đủ, và có thể được trích dẫn trong báo cáo `evidence_id`Nghiên cứu năm 2026 chỉ ra rằng dễ dàng sai lầm. Xuất khẩu công cụ quá mức niềm tin là một trong bốn điểm yếu của nghiên cứu NDSS BAR. Trong nghiên cứu của văn bản cấy ghép, ngay cả khi chỉ trình bày nội dung thứ hai như dữ liệu, trong 40 lần vẫn có 15 lần không an toàn; sau khi tham gia kiểm tra nguồn và ủy quyền công cụ, những đề xuất này chỉ được loại bỏ.[arXiv 2606.06838](https://arxiv.org/abs/2606.06838)): Đối với các tập tin thứ hai có hàng trăm hàm, chỉ có 10% đến 15% hàm được phân tích thực sự trước khi mã được tạo ra bởi một cơ thể thông minh.

账本用记录回应每个问题,智能体只报告账本中已有的内容――没有观察运行的断言为`unsupported`, chỉ có một phần của hành động cho rằng`unknown`❖ cung cấp văn bản `observed`Chỉ đối với người cung cấp xuất khẩu, không đại diện cho nhiều hơn.`outputs/`Các tài liệu kỹ năng trong đó được trao cho một cơ thể thông minh, và làm cho sổ sách trở thành vị trí duy nhất để ghi vào kết luận của nó.

## tự xây dựng

运行 chỉ sử dụng tiêu chuẩn库的演示:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
```

演示读取目标文件,导入两条 rea 记录,验证 rea 快照,并推导两个模型――随后记录18项预测、新建18项未知项目、编译并运行测试驱动程序、检查每项断言,再解决17项未知――预期结构如下:

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

Không có C 编译器时,`runs`显示 `imported 17 recorded run records from run-evidence.json`, còn lại là như vậy.

按以下顺序阅读 `code/main.py`- Có thể là:

1. `canonical_json()`和 `compute_evidence_id()`实现哈希方法和语义投影──
2. `create_evidence()`和 `validate_evidence()`构建并检查记录──
3. `EvidenceLedger.record()`和 `import_bundle()`保存记录并拒绝冲突。
4. `open_unknown()``update_unknown()`和 `resolve_unknown()`维护修订链。
5. `observe_object()`读取 ELF,`derive_grade_model()`读取表――
6. `claim_suite()``predict()`和 `record_prediction()`写入推测层记录──
7. `observe_runs()`Để chuyển đổi mỗi lần chạy của các trình điều khiển thử nghiệm thành ghi chép quan sát.
8. `check_claim()``promote_claim()`和 `completion_ledger()`应用提升规则──
9. `AnswerCache`像 rea 快照一样为回答设置键,并拒绝过期结果──

## Sử dụng nó

Để mỗi mục tiêu, mỗi cuộc khảo sát riêng biệt, kế hoạch kế toán.`provider`,让标识符自然分化── tái xây dựng 器具, chủ đề rút ngắn thay đổi, tất cả các hồ sơ cũ đã trở thành bằng chứng về một tài liệu khác──

Một khi biết giới hạn, lập tức viết xuống. Đọc viên không áp dụng định vị lại, hiểu rõ.

Để cung cấp mỗi đoạn văn bản đều được xem như dữ liệu. Các chuỗi và mã giả từ mục tiêu là văn bản được kiểm soát bởi mục tiêu, không thể biến thành chỉ thị, cũng không thể biến thành hành vi quan sát.`_meta.provenance.untrusted_content: true`标记此类结果──其服务器指令要求模型将目标内容视为数据,并将其中要求运行,安装,下载或发送内容的请求报告作为提示注入企图──标记有帮助,但账本仍必须确保目标文本不会进入指令层──

## 交互实验

### 实验 A:重新计算 标识符

Trong `code`目录中启动 Python:

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

Trước hai kết quả so sánh là thực, vì đường lối không tham gia.

### 实验 B: từ chối nâng cấp

```python
ledger, report = build_ledger(live_runs=False)
claim = [c for c in claim_suite(ledger.find(operation="derive_switch_model")[0], ledger.find(operation="derive_arithmetic_model")[0], ledger.find(operation="read_source")[0]) if c.claim_id == "grade(55)"][0]
promote_claim(ledger, claim, [ledger.find(operation="derive_switch_model")[0]["evidence_id"]])
```

Việc调用抛出`ClaimError`,并指出推导记录的标识符──现在传入运行记录标识符:

```python
run = run_records_for(ledger, "grade", [55])[0]
promote_claim(ledger, claim, [run["evidence_id"]])["status"]
```

 trạng thái`pass`, quay lại `limitations`Bảo trì cơ quan chủ nhà xây dựng:

### 实验 C: từ chối quá期快照

```python
import json
snapshot = json.loads(REA_SNAPSHOT_PATH.read_text())
target, binding = rea_snapshot_binding(snapshot)
AnswerCache(target, binding).import_snapshot(snapshot)
stale = dict(binding["analysis_profile"]["parameters"], jump_table_evidence="typed-case-default-blocks-v2")
AnswerCache(target, {"provider": binding["provider"], "analysis_profile": make_profile(binding["provider"], stale)}).import_snapshot(snapshot)
```

Lần đầu tiên nhập trở lại, lần thứ hai ném ra.`profile_mismatch`của `CacheError` chỉ thay đổi một phiên bản 字符串, toàn bộ 快照就被拒绝

### 实验 D:破坏链

```python
unknown_id = [u for u, r in ledger.unknowns.items() if r[-1]["status"] == "investigating"][0]
ledger.verify_unknown_chain(unknown_id)
ledger.unknowns[unknown_id][0]["severity"] = "critical"
ledger.verify_unknown_chain(unknown_id)
```

Lần đầu tiên dùng 2... lần thứ hai ném ra`EvidenceIntegrityError`, vì sửa đổi 1 không phù hợp với bản tóm tắt của chính nó, trong khi sửa đổi 2 hướng tới một tóm tắt đã không tồn tại.

## 实践实验

关闭未解决未知项,并添加第二提供方──

要求:

- 扩展 `run_grid()`, vận hành phạm vi tuyên bố thiếu sót 9 nhập, sau đó xác nhận không biết mục trong sửa đổi 3 变为 `resolved`
- sẽ`llvm-objdump -d`添加为第二个提供方, sử dụng riêng của mình `provider`đối tượng,并将其`grade`清单记录为 `observed`
- 写入一条 `derived`记录,说明 Ghidra 和 llvm-objdump 的两份清单解码出相同的14条指令,并同时链接两者──
- Vì vậy`grade_label(105)`Tăng cường xây dựng`high`                                                                                                                                                                                                                                                              `labels[4]`; Re: Thông qua thực tế vận hành giải quyết nó.
- Sử dụng `export_bundle()`导出账本,再导入全新账本,证明每条链仍可通过验证──

Kiểm chuẩn thành công: mỗi câu trong báo cáo đều trích dẫn các dấu hiệu trong gói chứng cứ, và điều đó `unknown`断言已消除──

## 评分实验

5 cách về các bài học này. Sử dụng mã xây dựng của bạn để tìm ra mỗi câu trả lời, sau đó viết vào.`code/lab_answers.json`◊ số viết thành số, hoặc viết thành `"0x40"`Như vậy, các chuỗi được tạo thành các chuỗi JSON.

1. `t1`:compute_evidence_id 为 rea-evidence-grade.json 给出的证据 id──
2. `t2`:grade 记录中限制的数量──
3. `t3`:grade 记录的关系_coverage 状态──
4. `t4`:grade 记录的信心和权威, được viết thành từ hai chữ cái bao gồm danh sách:
5. `t5`:grade 记录中 đối tượng của SHA-256。

检查你的答案:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/lab.py
```

检查器在已提交的固定 上使用 `code/main.py`计算每个期望值── nó cho mỗi bài toán输出 `PASS``FAIL`Hoặc`TODO`Và tất cả, chỉ có 5 câu hỏi được thông qua khi chỉ có 0  xuất phát.`python3 code/lab.py my-answers.json`可检查另一个文件.`code/tests/test_lab.py`证明检查器 chấp nhận đúng câu trả lời并拒绝错误答案──

### Xem nó hoạt động

[Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler?symbols=off)机器维护一本证据账本,分为四托盘:observed、derived、inferred 和 unknown──

## 本课产物

本课产 出 `outputs/skill-evidence-ledger.md` Nó hướng dẫn các nhà thông minh sẽ ghi lại từng phát hiện như một danh mục tin tưởng, nguồn quyền lực, giới hạn và ghi lại các liên kết, giải thích cách sử dụng phiên bản sửa đổi để duy trì những điều chưa biết, và khi nào sẽ đưa ra phán quyết`pass``fail``unknown`Hoặc`unsupported`

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

28 项测试证明:

- 两个 rea `evidence_id`、 định dạng sơ lược và hai hình ảnh nhanh `query_id`Thành phố có thể tính lại nội dung
- 改变路径不改变标识符,改变限制则改变标识符
- Chữ liệu thay đổi  cung cấp không phù hợp cấu hình  số điểm và giá trị không biết được đưa ra sẽ bị từ chối
- 重复记录 回复 `duplicate`, hồ sơ xung đột xuất hiện bất thường, chứng cứ đóng gói nhập khẩu có tính nguyên tử
- 已记录的运行证据包包导入后有18条记录,且没有悬空链接
- Từ sửa đổi 1  bắt đầu, từ chối quá期 `expected_revision`Và chỉ có thể nhìn thấy.`controlled-replay`Bằng chứng để giải quyết nó
- 编辑修订 nội dung sẽ phá hủy链
- 提升拒绝推测、推导、空列表和无关证据, chỉ được thông qua khi kết quả hoạt động phù hợp
- 部分覆盖为 `unknown`,不一致运行则为 `fail`
- 缓存 chỉ trong khóa hoàn toàn phù hợp khi định mệnh, các yếu tố khác sẽ không định mệnh
- 缓存 từ chối nâng cấp phiên bản cấu hình 错误目标 错误格式版本和改的键
- ELF 读取器 转移、大小、字节和重定位上与 转移、大小、字节和重定位上与 转移、大小、字节和重定位上与 转移,大小、字节和重定位上与`llvm-objdump`Một致,表中读出 `1, 2, 3, 4, 4`
- 预测 sử dụng C trừ Pháp语义, và đã ghi chép hoạt động phù hợp với tất cả 17 项单输入断言
- 存在编译器时,实时运行结果也一致

## Mô hình thất bại trong môi trường sản xuất

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

Sử dụng 3 loại phân biệt ghi lại nội dung bạn đọc, tính toán nội dung và kết quả dự kiến. Sử dụng các mã thông báo đóng các mục chưa biết, không cần một câu thay thế bằng chứng. Chỉ cần đặt lại câu trả lời dưới khóa xác định trong lưu trữ, miễn là một phiên bản chuỗi không giống nhau thì từ chối.

## 延伸阅读

- [rea 6.5.0 source, `src/domain/evidence.ts` and `src/domain/residualUnknown.ts`](https://github.com/morluto/rea)
- [RFC 8785, JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785)
- [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Agent Failure Patterns in CTF Reverse Engineering, NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)
- [When Binaries Talk Back: Representation-Confusion Attacks on LLM-Assisted Reverse Engineering, arXiv 2607.12507](https://arxiv.org/abs/2607.12507)
- [Agentic decompilation study, arXiv 2606.06838](https://arxiv.org/abs/2606.06838)
- [When LLM Decompilers Recompile More and Preserve Less, arXiv 2609.05370](https://arxiv.org/abs/2609.05370)
- 本课描述的 rea 6.5.0 源码,标签为 `3b79af2``src/domain/evidence.ts`- `.agents/skills/reverse-engineer-anything/SKILL.md`- `docs/cli.md`- `src/domain/reconstructionVerification.ts`- `src/application/ReconstructionObligationCandidates.ts`- `docs/tool-design.md`- `src/domain/evidenceCompletionLedger.ts`- `src/domain/residualUnknown.ts`- `src/application/investigation/UnknownEvidence.ts`- `.agents/skills/reverse-engineer-anything/references/evidence-workflows.md`- `src/application/binary/AnalysisSnapshotCache.ts`- `src/domain/analysisSnapshot.ts`- `src/application/binary/BinarySession.ts`- `src/application/binary/BinarySessionRecords.ts`- `docs/mcp-contracts.md`- Tôi không biết.
