# اثبات في التحليلات الثنائية

> وبالنسبة لجدول الإعداد، يجب أن يكون هناك سجل من مصدر السلطة، ومصدر من مصدر الاختبار، والسجل من قائمة الأشياء التي لا يمكن إثباتها.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 32（从零构建 ELF）、Phase 13 · 33（反汇编与控制流）、Phase 13 · 34（提升为伪代码）
**Time:** ~105 分钟

## 學习目标

- 参照 rea 的 `Evidence` بناء سجلات الأدلة، وتقسيم مشاهدة الدخل  إدراج الدخل والإدراج من فئة الإيمان
- 计算基于内容哈希的标识符,使文件移动到其他目录时标识符保持不变──
- سيتم تحديد محتوى لا يمكن للمقدم أن يظهر، وتحديد الحدود مع السجلات معا.
- في الملاحظة العملية للعمل، قبل أن تقدم دعم، رفضت النتيجة.
- سيتم حفظ البقية من المعلومات إلى سجل الإصدار المعدل من خلال رابط الجهاز.
- 按精确键缓存提供方的回答,并拒绝过期重放──

## 问题

سألتني عن ذكي:`ledger-x86_64-O1.o`وسط`grade`على النسبة 55 返回什么? الذكاء المستخدمة الحقيقية,读取 Ghidra 伪代码,回答 0── مراجعة المستخدم يسأل كيف تعرفها──`uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);`◊ 該位置的字节却表示 `xor eax, eax`.

هذا التعبير و هذا التوجيه على جميع الإدخالات يخلق 0 ، ولكن الذكاء لا يعرف ذلك. انها مجرد لأن النص من الأدوات يعتقد به.[NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)), يشار إلى أربع نقاط ضعف متكررة: التدريب على التفاوتات، والإعتقاد المفرط، والقيود على النص الأساسي، والانصراف على الخطط الأصلية.[arXiv 2607.12507](https://arxiv.org/abs/2607.12507)(‬)

rea 6.5.0 لهذا يوفر مجموعة من الكلمات.`Evidence`记录,其 `confidence`لأجل`observed`.`derived`أو`inferred`, لم يكن معي`authority`和 `limitations`列表──随附技能告诉智能体: كل استنتاج يجب أن يميز بين الملاحظة والتخمين والجهول.‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

سوف تترك ثلاثة أشياء لك للتعامل: السرعة السريعة الكاشوف هي نتائج استفسار دقيقة، وليس تحليل؛ عندما يكون هناك اختلاف في الامتثال لا يتغير، فإن التحقق يقضي على القرار المعتمد، ولكن المبدأ يوضح، من خلال لم يستطع تحديد المجال الكامل لتحقيق التكافؤ؛ واجب الكشوف فقط تتلقى من جاواسكابير وتوترات الترتيب، وبالتالي وظيفة الأصل لا يمكن أن تمر بها.`verified`.

هذا الدروس يستخدم Python  إضافة إلى جزء المفقود. سوف تكتب كتاباً، وتضع كل واقع من الأحداث حول  تَحْفظُ في سجلات محتويات `percent_change`和 `grade`كتابة التنبؤات، والمعارضات للتنبؤات، واستعادة استخدام إجراءات الاختبارات التي تم تجميعها بنفسك؛ أيضاً إدخال اثنين من الحقائق الحقيقية  سجلاتها ومصدرها  السرعة، والحسابات إعادة حسابات الفكرة  كتبها  كل مرة

```figure
re-evidence-ledger
```

## ثلاثة أشكال من المؤمنين

`confidence`فقط ثلاثة قيمة، لا قيمة عددية`authority`هناك خمسة قيمة. المنتج لم يوضح,المنطقة`shipped-artifact`和 `observed`.

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

两种混最浪费时间――第一种把假代码作为行为观察;实际上, it is simply an observation of Ghidra 输出内容――第二种把空列表作为不存在的证明――区域的设计说明非常严格:缺缺覆盖意味着未知,而不是不存在――`code/main.py`الحسابات الوسطى ستقوم بتحقيق هذه القواعد المذكورة.

## 记录

في المادة 6.5.0 سوف ترفض أيّة فصيلة أخرى`code/main.py`استخدام مع حقيقة نفس الاسم، وبالتالي يمكن أن يتم التحقق من كل من البيانات التي نشأت على الجانبين.`relationship_coverage`تعبر عن الكمال في قائمة المستخدمين أو المستخدمين.`complete`.`partial`أو`unknown`إذا كانت العملية لا تقرير عن علاقة،`null`.

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

-أجل`grade`写入的真实记录, فقط حافظ على هذا المقطع`code/fixtures/rea-evidence-grade.json`, الكبير لـ 37,573 字节

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

تحليل المعلومات`parameters`المُحَمّلُ 25 مُفتاحَ، حقيقيّة`limitations`列表有十句话──请全部保留──限制属于内容的一部分,删除一项就会改变标识符,账本也会因此拒绝该记录──

انتبه لا يوجد شيء في السجل`environment`لأجل`null`لأن (غيدرا) قرأت فقط الملفات، ولم ينجح في إصدار الكود`locations`لأجل هذا التشغيل`normalized_result`في تقرير عن طريق`relationship_coverage`     `complete`ولكن إشارات التشخيص لا تعود إلا إلى المشاركات المحددة المحددة المحددة، والطريقة الحسابية أو المباشرة المحددة لا تزال غير معروفة.

## المعرف هو المحتوى

سيقومون بتسجيل إضافة واحدة من الإضافات حسب RFC 8785  تطبيقها إلى JSON, حساب SHA-256, إضافة `ev_`قبل، الحصول على `evidence_id`◊ هذا الإشارة الاحتفاظ بالمرجع`digest`.`format`和 `architecture`, إذهب`name`和 `local_path`۞ الآن`relationship_coverage`لأجل`null`时也删除它,因此不含调用关系的记录,仍然保持该字段出现之前的标识符──其他所有内容,包括 `raw_result`وكل حظر، وكل مشاركة

RFC 8785 لترتيب كلمات الارقام المحددة للكائنات 移除空白,并固定数字和字符串的表示形式── لترتيبات الأرقام الكاملة لعدد كامل، يمكن أن تنتج Python 标准库 نفس الخطوط:

```python
def canonical_json(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
```

`code/main.py`قبل الاختيار رفضت النقاط المفتوحة، لأن RFC 8785 تختلف عن Python لبعض النقاط المفتوحة.

| rea 的值 | `code/main.py` 重新计算的结果 |
|---|---|
| `grade` 的 `ev_67b6d3f992eaf49a…` | 相同 |
| `percent_change` 的 `ev_e88b10dc0c6400e5…` | 相同 |
| 对 `{provider, parameters}` 计算的配置摘要 `9c7f6b24be69294e…` | 相同 |
| `grade` 快照条目的 `query_26122aebe9d8abae…` | 相同 |
| `percent_change` 条目的 `query_0f95ef38038d3666…` | 相同 |

لماذا استبعاد الطريق؟ على نفس الملاحظة من نفس الخطوط، بغض النظر عن كيفية تغيير الآلة والسجل، يجب أن تحصل على نفس العلامة.`local_path`إندرس إلى ماك إصدارات الملفات`/home/you/re`بعد، لا تغير المعرفات`rebind_subject_path()`允许使用新路径展示记录;当 `sha256`.`format`أو`architecture`في نفس الوقت، سوف ترفض المنطقة 6.5.0 في هدف جديد للوصول إلى السفر`rebindEvidenceToTargetPath`أداء نفس العملية

`validate_evidence()`重新计算标识符,若不匹配则使用 rea 的消息拒绝:证据语义标识符不匹配其记录──若记录的 `analysis_profile.provider`مع`provider`غير متوافق، فإنه أيضا سوف يرفض.`test_tampered_id_and_mismatched_profile_are_rejected`修改真实 `grade`في السجلات، ولاحظ الحساب رفضها.

## أنظري إلى الغاية

قبل استخدام أيّ مُقدّم، الكتيب أولاً يُقرأ الملف.`observe_object()`استخدام`struct.unpack_from`解析 ELF64 节头、`.symtab`.`.strtab`和 `.rela.text`إنه يكتب في مقال `inspect_object`记录,并为每一个函数符号写入一条 `read_function_bytes`记录──这五条记录均为 `observed`, مصدر السلطة`shipped-artifact`لأن المصدر هو ملفات القرص

| 记录 | 内容 | 标识符 |
|---|---|---|
| `inspect_object` | 五个节的偏移、大小和哈希，四个函数，三条重定位 | `ev_645e0a145f28bd5c…` |
| `read_function_bytes percent_change` | `.text+0x00` 处的 16 字节 | `ev_2572a7d254ad15cb…` |
| `read_function_bytes grade` | `.text+0x10` 处的 46 字节，SHA-256 为 `ffcb75c2a7bb1104…` | `ev_a467c2427bfc0c56…` |
| `read_function_bytes total` | `.text+0x40` 处的 31 字节 | `ev_b1e845cea2543073…` |
| `read_function_bytes grade_label` | `.text+0x60` 处的 63 字节 | `ev_c50041be26e6b7f4…` |

`llvm-objdump -t`مع معظمها:`grade`位于 `0000000000000010`, لـ (بـ)`2e`.`.rela.text`中中三条重定位均为针对 `.rodata``R_X86_64_PC32`,偏移分分为 `0x36`.`0x84`.`0x93`, إضافة عدد`0x10`.`0x24`.`-0x4`كل سجل معهم`file-offset-range`位置和一项限制: 节字节从磁盘文件读取──读取器不应用重定位,也运行代码──

32  درس كامل بنيت هذه الجهاز القارئ ‬ هنا فقط 60 صف، لأن هذا الدرس يركز على كيفية تسجيل عملية القراءة‬‬

## 推导表,并明确说明 أنه نتيجة

`grade`يحتوي المادة 33 على أربعة أنماط:

| 字节 | 指令 | 在 `grade` 中的偏移 |
|---|---|---|
| `48 69 c0 67 66 66 66` | `imul rax, rax, 0x66666667` | 3 |
| `48 c1 f9 22` | `sar rcx, 34` | 13 |
| `83 c1 fa` | `add ecx, -6` | 23 |
| `83 f9 04 77 0c` | 先 `cmp ecx, 4`，再 `ja` | 28 |

乘以 `0x66666667`后右移 34位, يعادل لديه رمز منفصل عن 10 ∙ في الملف ليس هناك 10 ∙`derive_grade_model()`إضافة إلى ذلك، فإن الحد من العدد 10 هو على أساس عدد 0x66666667 و نقل المواقع 34 推导的.

`add ecx, -6`ستقوم بالفصل الأول بتحديد 6`cmp ecx, 4`配合无符号跳转允许五分支,即 6 إلى 10

`.text+0x33`处的 `lea`مع زيادة في العدد`0x10`يُحسب الإدراج الفعلي لـ PC32 重定位 يتعلق بالانتهاء من نقل أربعة خيوط، وبالتالي،`.rodata+0x14`بدأو هناك خمسة أشهر`1, 2, 3, 4, 4`.`ledger.c`المفتاح المتوسط على 60 إلى 69  العودة 1 ، على 70 段 عودة 2 ، على 80 段 عودة 3 ، على 90 إلى 100  عودة 4  المُعدل سوف يُحول  لتحويل العودة

سجلات النمو`ev_605106bff2d9998f…``confidence`لأجل`derived`،`evidence_links`إشارة إلى ذلك تعتمد على اثنين من الملاحظات السجلات.`ev_a467c242…`时,上图会显示这一状态──

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

غيدرا  تطبق 重定位,并将表命名为 `DAT_001000b4`عندما يكون`.text`放到 `0x100000`بعد، هذا هو`.rodata+0x14` يعود إلى 10 و 5 فصول. بالنسبة للقيمة الاصطناعية، فإنه يخرج إلى 0 إلى الأبد، ولكن لا يكتب أبدا مباشرة تعبير 0.`native_value_flow`في الوسط رمز p يُعَلِّم هذه العمليات`is_dead: true`                                                                                                                                                                                                                                                              

`percent_change`التسجيل يظهر نوع آخر من الفشل.`undefined1 [16] percent_change(int param_1,int param_2,ulong param_3)`، لكن المصدر هو`int percent_change(int before, int after)`.`idiv`写入 `EDX:EAX`, و طريق الصفر غير مُعدّل`EDX`، لذلك فإن المُعدّل المُضيف يُخْتَصّ إلى 16 字节 عودة القيمة والعيار الثالث.`grade` إعطاء `native_api.return_type.confidence`نعم`"low"`يجب أن يتم استعادة توقيعات المقدم على أنه يقدمها، ومثلتها سجلات حقيقية.

## 预测是推测记录

التنبؤ هو تصريح عن السلوك، لم تحصل على أي نتائج مراقبة.`claim_suite()`بناء على النموذج الموصى به والصادرة`record_prediction()`ستعمل كل شيء`confidence`لأجل`inferred`.`authority`لأجل`analyst-inference`سجلات،并链接到所依赖的记录──

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

`predict()`استخدام C 语义، بدلا من Python 语义。`c_div()`إلى التقطيع`wrap32()`{\cHFFFFFF} سأقوم بتعديل كل قيمة متوسطة إلى 32 نقطة`//`إلى负无穷取整, لذلك `(3 - -7) * 100 // -7`حصلت على -143، بينما حصلت على -142.

كلّ توقع سيتم بناء واحد غير معروف.`controlled-replay``observed`شهادة،并建议一次探测: في مؤسسة مضيفة بناء على تنفيذ`execute_function`                                                                                                                                                                                                                                                                              

## لمراقبة عمليات التفتيش

`code/fixtures/harness.c`包含 `ledger.c`, كل مرة طبع نتيجة`observe_runs()`استخدام الطريق على العثور على الأول `clang`.`cc`أو`gcc`编译它,并将网格中的每一个输入运行一次──每次运行都成为一条记录:

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

المادة الرئيسية من سجل التشغيل هي الملف التجريبي الثاني ، في هذا ماك على انها ميش-أو arm64 文件 ، تمتلك SHA-256 الخاصة بها.`course-harness`,附带编译器版本行, هنا为 `Apple clang version 17.0.0 (clang-1700.6.3.2)`.`evidence_links`إصدارات المعلومات`ev_2f1e6d251543d017…`، لأن المنتجات والمقصدات المشتركة فقط`ledger.c`، إلا أنه ليس نفسها

يرجى قراءة القرار الأول مرتين. x86-64  الملف المستهدف لم يعمل على هذا الجهاز قط. في الواقع يعمل نفس المصدر ضد بناء آخر من بنية أخرى. هذا ما زال ملاحظةً، وفي حالة عدم استخدام المثليات، فهو أقوى دليل يمكن الحصول عليه، لذلك يمكن أن يتم التصريح، ولكن يجب أن يكون مع هذا القرار.

17 次单输入运行全部符合预测──`code/fixtures/run-evidence.json`حفظت هذه السجلات والسجلات المصدرة، في 2026-10-13 استخدام `--record`导出──没有编译器时,`build_ledger()`导入该证书包不运行程序,并报告 `runs`字段中明确说明。

## 提升规则

القول فقط من خلال النشاط الملاحظ، لكي يتم دعم التفكير.`check_claim()`查找 وظيفة والعلامات نفسها `execute_function`记录,将每个结果与预测比较,并统计覆盖的输入:

| 状态 | 条件 | rea 的完成账本 |
|---|---|---|
| `pass` | 每个输入都有一致的运行，且没有不一致结果 | `pass` |
| `fail` | 任一次运行不一致 | `fail` |
| `unknown` | 部分输入有运行，其他输入没有 | `unknown` |
| `unsupported` | 没有任何输入有运行记录 | `unsupported` |

`promote_claim()`هو إصدار صارم.`inferred`أو`derived`عندما يكتشف ذلك، يرمي كل شيء`ClaimError`؛ يُشار إلى إشعارات أخرى عند تشغيل وظيفة أو عدة عناصر أخرى، كما أنّها تُرمي إلى غير عادية؛ كما أنّ القائمة لا تغطي المعلومات أو الإشعار لا تغطي الإدخال أقل من طلبات الإفتراضات، كما هو الحال في ذلك.`grade(55)`كما تمتلك غيدرا  صور و نماذج مزيفة، لكنها لا تستطيع تحسين هذا القول.`ev_7be90c0c…`، سترى القرارات`unsupported`على الرغم من`grade`لا يزال هناك سجلاً

范围断言展示部分覆盖的情形──其十一条输入中,只有 95 和 100 现出运行网格中──`check_claim()`عودتي`unknown`،`covered`2 من 11`promote_claim()`则拒绝,消息为2 من 11 مدخلات لاحظت الجري──账本不会把这个结果上成完整覆盖──

`completion_ledger()`للتعامل مع`EvidenceCompletionLedger` Its identifier is `ecl_`إضافة إلى المحتويات المكتوبة`pass`... و هكذا`total`时،`complete`فقط لتحقيقها.`ecl_da64933ea13befed…`,并显示 `complete: false`.

## المجهولات هي سجلات

سيقومون بحفظ البقايا غير المعروفة لـ سجلات بنية صارمة.`code/main.py`استخدام نفس الفصل و نفس عدم التغيرات

المعرف هو`unk_`加 `{domain, question, scope_digest}`في SHA-256 ، يتم تعديل السائل السريعة على الفضاء إلى الفضاء الواحد.`scope_digest`هو الملف المستهدف SHA-256

كلّ تغيير يُحدثُ إصدارًا جديدًا.`previous_revision_digest`لأجل`null`后续 كل تعديل都引用前一版本 `revision_digest`, خلاصة تغطية خارج عن نفسه`verify_unknown_chain()`遍历列表,重新计算每个摘要, تحقق كل رابط ما إذا كان يشير إلى الإصدار السابق,并检查 ما إذا كان هناك أدلة على التغييرات التي تم اقتباسها في كل إصدار في الحساب.

كل تغيير هو نفسه دليل السجل، مع استخدام حقيقي`rea-unknown-registry`نفس الممارسة.`confidence`لأجل`derived`،`authority`لأجل`analyst-inference`لا يوجد موضوع، لا يوجد حد للقرار الذي اتخذه المحلل، لا يثبت الإجابة على السؤال.

هذا هو سبب وجود 36 مدعاة في المقالة 81 من المقالة التالية: 18 مرات تغييرات وتحديث 18 مرات.

كل تعديل يجب أن يستوفي ثلاثة عدم التغيرات:

- فقط`resolved`لا أعرف ما يحصل`resolution`, و فقط تعديل 1 没有前驱。
- `contradicted`لا يعرفون أن هناك على الأقل إشارة إلى علامة إثبات الرد على الرد، ولا يمكن أن تظهر نفس العلامة في نفس الوقت في القائمةين.
- `verified`حل النتيجة على الأقل إشارة إلى علامة إثبات ذات فئة ثقة ومصدر سلطة مطلوبة.

القاعدة الثالثة هي أن أشهر أوقات رفض العمل في الحسابات.`resolve_unknown()`رفض المظهر نموذج, أيضا رفض السلطة مصدر للمعلومات `shipped-artifact`‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬`ev_f4ffbe8f922ec7fe…`.`grade(95)`حلّ الحلّة`previous_revision_digest`لأجل`ffca840b55a8a188…`,即修订 1 摘要:

`update_unknown()`接收 `expected_revision`، عندما تمت فترة التوقيت`revision-conflict`, مع واقع`update_unknown`工具相同──正确应对方式也与 rea的说明一致:重新读取当前版本,再作决定──

بعد انتهاء العرض لا يزال هناك مشروع غير معروف غير مغلق:`unk_f2eb0d7f84c80a19…`, المشكلة هي: هل كل من أرقام 90 إلى 100 من المعدات تلبي درجة ((معدل)) == 4؟`investigating`، دعم الأدلة بما في ذلك عمليتين، ووصفت البحوث أن هناك تسعة إدخالات لم يتم تنفيذها بعد.

##  جواب缓存 ليست قاعدة بيانات التحليل

هناك ثلاثة أشكال تبدو مثل الاحتفاظ بالأشياء.`-readOnly -deleteProject`导入,关闭时删除──内存中 `AnalysisSnapshotCache`لـ إثنين من المواد المحتفظة بحضورها إلى 10،000 条目.`target`.`binding`.`entries`.`workflow_entries`和 `evidence_bundle`.

缓存键是 `query_`加 `{target, binding, operation, parameters}`من SHA-256`target`لأجل`{sha256, kind, format, architecture}`،`raw-binary` هدف أيضاً `entry_point`.`binding`包含提供方及整整分析配置,连同摘要──修改 25 配置参数中的任意一个,例如将 `jump_table_evidence`من`typed-case-default-blocks-v1`改为 `v2`, المقتطف سيتغير , كل الأساس يتغير أيضاً

`code/fixtures/rea-snapshot.json`هو حقا في الملفات التي تم كتابتها خلال عمليتين، الكبيرة 142.690 字节.`AnswerCache.import_snapshot()`重新计算 لكل `query_id`أيّ خلافٍ، فمن ثمّ يرفض الملف بأكمله`target`أو`binding`مختلفة عن القيمة الحالية، فإن استخدام الفصائل الحقيقية`profile_mismatch`رفض `format_version`لا ..`course-answer-cache-1`، و سوف ترفض أيضا

هذه هي الامتحانات الثلاثة على الجهاز`grade`استفسار إعادة إدخال Ghidra، يستغرق 8.6 ثانية؛ لمراقبة نفس الصور`percent_change`استغرق استفسار 8.5 ثانية لأن استفسارات مختلفة لن تكون في الحافظة`grade`استغرق التحقيق 2.1 ثانية، أعد كل ما هو مكتوب`evidence_id` إعادة إرسال إضافة الحد:  من محلي REA  تحليل                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `lookup()`إضافة شرح مماثل، دع القارئ يفصل إعادة الإعداد مع الإجابة الجديدة.

变更会终止缓存使用──在 rea 6.5.0 中, 重命名或添注释会在调用发送给提供者之前清空快照缓存──失败响应不能证明写入已回滚,因此写入失败也会停止重放──将修改数据库的元数据导入同样──

## لماذا يحتاج الذكاء له

من خلال MCP   محركات الذكاء ، كل مرة تدخلونها سوف ترى السجل الكامل ، ويمكن اقتباسها في التقرير `evidence_id` أشار بحث عام 2026 إلى أن إصدار أدوات الإعتماد المفرط هو واحد من نقاط الضعف الأربعة التي اكتشفتها دراسة NDSS BAR.[arXiv 2606.06838](https://arxiv.org/abs/2606.06838)): بالنسبة لملفات ثنائية تحتوي على مئات الوظائف، فإن فقط 10٪ إلى 15٪ من الوظائف يتم تحليلها الحقيقي قبل أن يتم إنتاج الكود في الجهاز الذكي.

账本用记录回应每一个问题,智能体只报告账本中的已有的内容──没有观察运行的断言为`unsupported`, فقط جزء من النشاطات`unknown`◊ تقديم المقالة `observed`فقط لمقدمة المخرجات، لا تمثل المزيد.`outputs/`تم تسليم وثائق المهارات في الوسط إلى الكيان الذكي، وجعل الكتاب يكون المكتب الوحيد الذي يكتب في النتيجة. سواء باستخدام كلود، كورس، كودكس، أوبين كلوب، هرمز، أو غيرها من قراءة SKILL.md الكيان الذكي، كل ذلك ينبغي.

## أنفسها

运行仅使用标准库的演示:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
```

演示读取目标文件,导入两条 rea 记录,验证 rea 快照,并推导两个模型. 随后记录 18 项预测,新建 18 项未知,编译并运行测试驱动程序,检查每项断言,再解决 17 项未知,预期结构如下:

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

没有 C 编译器时,`runs`显示 `imported 17 recorded run records from run-evidence.json`, الباقي هو نفسه

按以下顺序阅读 `code/main.py`:

1. `canonical_json()`和 `compute_evidence_id()`实现哈希方法和语义投影──
2. `create_evidence()`和 `validate_evidence()`构建并检查记录──
3. `EvidenceLedger.record()`和 `import_bundle()`保存记录并拒绝冲突。
4. `open_unknown()`.`update_unknown()`和 `resolve_unknown()`维护修订链。
5. `observe_object()`读取 ELF،`derive_grade_model()`读取表。
6. `claim_suite()`.`predict()`和 `record_prediction()`写入推测层记录──
7. `observe_runs()`سيتم تحويل كل عملية من برامج التجربة إلى سجلات مراقبة
8. `check_claim()`.`promote_claim()`和 `completion_ledger()`تطبيقات التطوير
9. `AnswerCache`像 rea 快照一样为回答设置键,并拒绝过期结果──

## استخدمها

لِكل هدف، كل مسح على حدة، حفظ الكتب. في كل موضوع، كتابة هدف SHA-256، في كل مشروع غير معروف، المجموعة المختصرة للمشكلة.`provider`، جعل العلامات الطبيعية تفرقها. عندما تم إعادة بناء الأدوات، تغير المادة الموجبة، كل المستندات القديمة أصبحت دليلا على وثيقة أخرى.

عندما تعرف الحد، تبدأ الكتابة على الفور. القارئ لا يطبق تعيين جديد، تبدأ في التوضيح.

سوف يقدم كل جزء من النص المستند إلى البيانات. الصفوف والرموز المزيفة من الهدف هي نص تحكمه الهدف، لا يمكن أن تصبح إرشادات، ولا يمكن أن تصبح مراقبة السلوك.`_meta.provenance.untrusted_content: true`标记此类结果──其服务器指令要求模型将目标内容视为数据,并将其中要求运行,安装,下载或发送内容的请求报告作为提示注入企图──标记有帮助,但账本仍然必须确保目标文本不会进入指令层──

## 交互实验

### 实验 A:重新计算 标识符

في`code`目录中启动 بايثون:

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

النتائج السابقة والثلاثة هي مزيفة لأن الحد من المحتويات هو حقيقي.

### تجربة ب: رفض التقدم

```python
ledger, report = build_ledger(live_runs=False)
claim = [c for c in claim_suite(ledger.find(operation="derive_switch_model")[0], ledger.find(operation="derive_arithmetic_model")[0], ledger.find(operation="read_source")[0]) if c.claim_id == "grade(55)"][0]
promote_claim(ledger, claim, [ledger.find(operation="derive_switch_model")[0]["evidence_id"]])
```

         `ClaimError`,并指出推导记录的标识符──现在传入运行记录标识符:

```python
run = run_records_for(ledger, "grade", [55])[0]
promote_claim(ledger, claim, [run["evidence_id"]])["status"]
```

 حالة `pass`، عودتي`limitations`المضيف المُبقي

### 实验 C: رفض过期快照

```python
import json
snapshot = json.loads(REA_SNAPSHOT_PATH.read_text())
target, binding = rea_snapshot_binding(snapshot)
AnswerCache(target, binding).import_snapshot(snapshot)
stale = dict(binding["analysis_profile"]["parameters"], jump_table_evidence="typed-case-default-blocks-v2")
AnswerCache(target, {"provider": binding["provider"], "analysis_profile": make_profile(binding["provider"], stale)}).import_snapshot(snapshot)
```

أول إدخال و إرجاع ، ثاني إلقاء و إطلاق`profile_mismatch``CacheError`فقط تغيير نسخة واحدة، والصورة كلها تم رفضها

### 实验 D:破坏链

```python
unknown_id = [u for u, r in ledger.unknowns.items() if r[-1]["status"] == "investigating"][0]
ledger.verify_unknown_chain(unknown_id)
ledger.unknowns[unknown_id][0]["severity"] = "critical"
ledger.verify_unknown_chain(unknown_id)
```

أول مرة تعود إلى 2...`EvidenceIntegrityError`، لأن التعديل الأول لم يعد يتناسب مع المقتطف نفسه ، بينما التعديل الثاني يتوجه إلى مقتطف لم يعد موجودا.

## 实践实验

关闭未解决未知项目,并添加第二个提供方

要求:

- 扩展 `run_grid()`، وتطبيق نطاق الاختيارات التسعة المفقودة ، ثم تأكيد المعلومات غير المعروفة في التعديل 3 变为 `resolved`.
- ستعمل`llvm-objdump -d`إضافة للمقدم الثاني، استخدام الخاص بك `provider`للموضوع، و`grade`清单记录为 `observed`.
- 写入一条 `derived`记录,说明 Ghidra 和 llvm-objdump 的两份清单解码出相同的14条指令,并同时链接两者──
- لأجل`grade_label(105)`جديّة بناء`high`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `labels[4]`؛ ؛ من خلال عملية عملية لحلها
- استخدام `export_bundle()`导出账本,再导入全新账本,证明每条链仍可通过验证──

معيار النجاح: كل جملة من تقرير كل ما يذكر هو علامة في حزمة الأدلة، وذلك`unknown`لقد تم إزالة القول

## 评分 تجربة

5 طرق حول هذه المواد المثبتة. استخدم كودك لتكتشف كل إجابة ثم اكتبها`code/lab_answers.json` الرقم يكتب ليصبح رقمياً، أو يكتب ليصبح`"0x40"`هذا هو الخطوط المعدلة

1. `t1`:compute_evidence_id 为re-evidence-grade.json 给出的证据 id。
2. `t2`:grade 记录中限制 的数量──
3. `t3`:grade 记录的关系_coverage 状态──
4. `t4`:درجة ثقة وسلطة السجلات، كتب من اثنين من الخطوط المكونة من قائمة
5. `t5`:grade 记录中 الموضوع  SHA-256。

检查答案:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/lab.py
```

المفتش في المعدات المقدمة 上使用 `code/main.py`计算每期望值──它为每道题输出 `PASS`.`FAIL`أو`TODO`وبالإضافة إلى ذلك، هناك فقط خمسة قضايا تمر بها`python3 code/lab.py my-answers.json`يمكن التحقق من ملف آخر`code/tests/test_lab.py`证明检查器接受正确答案并拒绝错误答案──

### انظر انها تعمل

[Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler?symbols=off)机器维护一本证据账本,分为四托盘: مشاهدة、 مشتقة、أدخل 和 مجهول.

## 本课产物

本课产出 `outputs/skill-evidence-ledger.md` يوجّه الكيان الذكي أن يكتب كل اكتشاف على أنه قائمة بالثقة، ومصادر السلطة، والقيود والربط، ويوضح كيفية استخدام الإصدار المعدل للحفاظ على المجهولات، ومتى سيتم تحديد القرارات`pass`.`fail`.`unknown`أو`unsupported`.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

28 项测试证明:

-  اثنين من المواقع `evidence_id`、 تخصيص الموجبات و اثنين من الصور`query_id`مدينة قادرة على إعادة الحساب من المحتوى
- تغيير الطريق لا تغيير العلامة تغيير الحد من تغيير العلامة
- سجلات التغييرات والإعطاءات غير المتطابقة والتنظيمات والفوايات والقيم غير المعروفة سيتم رفضها
- 重复记录 回复 `duplicate`, سجلات الصراع تظهر بشكل غير طبيعي , دليل
- 已记录的运行证据包导入后有18条记录,而没有悬空链接
- غير معروف من المراجعة 1  بدأ، رفض过期 `expected_revision`و فقط لم يلاحظ`controlled-replay`دليل على حلّه
- 编辑修订内容会破坏链
- التقدم رفض التوصيل والتوصيلات والقائمة الفارغة والدليل غير المتعلقة، فقط عندما يتم التوافق بين نتائج النشاط
- 部分覆盖为 `unknown`,不一致运行则为 `fail`
- 缓存 فقط في المفاتيح تماما متفق في وقت الحكم، والعناصر الأخرى لن تكون في الحكم
- 缓存 رفض الترقية إصدار التخصيصات 错误目标 错误格式版本和改的键
- ELF 读取器在偏移、大小、字节和重定位上与`llvm-objdump`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `1, 2, 3, 4, 4`
- 预测 استخدام C 除法语义,且已记录运行与全部17 项单输入断言一致
- 存在编译器时,实时运行结果也一致

## نمط الفشل في بيئة النمو

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

باستخدام ثلاث فئات من الفئات: تسجيل المحتوى الذي قرأته، والحسابات والمنتائج المتوقعة. باستخدام العلامات المعلنة، لا حاجة إلى جملة واحدة بدلاً من الأدلة.

## 延伸阅读

- [rea 6.5.0 source, `src/domain/evidence.ts` and `src/domain/residualUnknown.ts`](https://github.com/morluto/rea)
- [RFC 8785, JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785)
- [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Agent Failure Patterns in CTF Reverse Engineering, NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)
- [When Binaries Talk Back: Representation-Confusion Attacks on LLM-Assisted Reverse Engineering, arXiv 2607.12507](https://arxiv.org/abs/2607.12507)
- [Agentic decompilation study, arXiv 2606.06838](https://arxiv.org/abs/2606.06838)
- [When LLM Decompilers Recompile More and Preserve Less, arXiv 2609.05370](https://arxiv.org/abs/2609.05370)
- 本课描述的 rea 6.5.0 源码,标签为 `3b79af2`: `src/domain/evidence.ts`،`.agents/skills/reverse-engineer-anything/SKILL.md`،`docs/cli.md`،`src/domain/reconstructionVerification.ts`،`src/application/ReconstructionObligationCandidates.ts`،`docs/tool-design.md`،`src/domain/evidenceCompletionLedger.ts`،`src/domain/residualUnknown.ts`،`src/application/investigation/UnknownEvidence.ts`،`.agents/skills/reverse-engineer-anything/references/evidence-workflows.md`،`src/application/binary/AnalysisSnapshotCache.ts`،`src/domain/analysisSnapshot.ts`،`src/application/binary/BinarySession.ts`،`src/application/binary/BinarySessionRecords.ts`،`docs/mcp-contracts.md`. . .
