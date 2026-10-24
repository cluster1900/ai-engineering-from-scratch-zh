# दोहरे विश्लेषण में साक्ष्य, विश्वास और अज्ञात

> एक संपादन प्रक्रिया के लिए एक खोज है, जिसमें एक हैशी, विश्वास, अधिकार स्रोत, और असमर्थता के साथ एक सूची का रिकॉर्ड होना चाहिए।

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 32（从零构建 ELF）、Phase 13 · 33（反汇编与控制流）、Phase 13 · 34（提升为伪代码）
**Time:** ~105 分钟

## 学习目标

- 参照 वास्तविक `Evidence` साक्ष्य रिकॉर्ड का निर्माण,  आय का निरीक्षण,  आय का अनुमान और  आय का अनुमान लगाने के विश्वास वर्गों को अलग करना
- 计算基于内容哈希的标识符, फ़ाइलों को अन्य निर्देशिकाओं में स्थानांतरित करने के लिए करते हैं, जब标识符保持不变──
- प्रत्येक प्रदाता द्वारा प्रदर्शित नहीं की जा सकने वाली सामग्री को सीमित करने और रिकॉर्ड के साथ प्रसारित करने की अनुमति देने की अनुमति दें।
- में फ़ंक्शन के वास्तविक निरीक्षण कार्य को समर्थन देने से पहले, खंडन फ़ैसले
- शेष अज्ञात वस्तुओं को हसी लिंक के साथ संशोधित संस्करण रिकॉर्ड के लिए सहेजा जाएगा।
- 按精确键缓存提供方的回答,并拒绝过期重放──

## 问题

तुम एक बुद्धिमान व्यक्ति से पूछोः`ledger-x86_64-O1.o`मध्य `grade`返回什么? 智能体调用 rea,读取 Ghidra 伪代码,回答 0──审阅者追问它如何知道──智能体手中只有一个段 Ghidra 输出文本──默认路径上的文本是`uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);`该位置的字节却表示 `xor eax, eax`

इस अभिव्यक्ति और इस निर्देश के अनुसार सभी इनपुटों पर 0, उत्पन्न होता है, लेकिन बुद्धिमान व्यक्ति इस बात को नहीं जानता है। यह केवल इसलिए है क्योंकि पाठ उपकरण से आता है और इस पर विश्वास करता है। एक 2026 वर्ष के अध्ययन में तीन बुद्धिमान व्यक्ति 24 उलट-तक्र इंजीनियरिंग कार्य करते हैं।[NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)), चार बार फिर से उत्पन्न होने वाली कमजोरियों पर प्रकाश डालते हैंः प्रशिक्षण विकृति, अत्यधिक विश्वास का अवलोकन परिणाम, ऊपर नीचे की सीमा, तथा मूल योजना का पालन करना।[arXiv 2607.12507](https://arxiv.org/abs/2607.12507))。

rea 6.5.0 इसके लिए एक शब्दकोश प्रदान करता है। प्रत्येक सफल उपकरण का उपयोग करके एक लेख उत्पन्न होता है।`Evidence`记录,其 `confidence``observed``derived`या `inferred`,并带有 `authority`和 `limitations`列表──随附技能告诉智能体: प्रत्येक निष्कर्ष में निरीक्षण, अनुमान और अज्ञात तत्वों का अंतर होना चाहिए──引用 साक्ष्य आईडी, आरक्षण प्रतिबंध और अधूरा कवरेज,绝不能暗示静态分析观察到了执行──

वास्तविक तीन चीजें आपको संभालती हैं: त्वरित कैशिंग सटीक पूछताछ परिणाम है, विश्लेषण नहीं; जब किसी तुलना आयाम में परिवर्तन नहीं होता है, तो सत्यापन निर्णय निर्णय निर्णय पारित करता है, लेकिन स्रोत कोड टिप्पणी स्पष्ट रूप से कहता है, पारित नहीं कर सकता है पूर्ण स्थान को पूरा करने के लिए बराबर मूल्य; बाध्यता खाता केवल जावास्क्रिप्ट और प्रबंधन के चयन से प्राप्त करता है, इसलिए मूल फ़ंक्शन इसे प्राप्त नहीं कर सकता है।`verified`

इस पाठ में शुद्ध पायथन के साथ प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान प्लान `percent_change`和 `grade`                                                                                                                                                                                                                                                              

```figure
re-evidence-ledger
```

## तीन प्रकार के विश्वास वर्ग, पाँच प्रकार के अधिकार स्रोत

`confidence`केवल तीन मानों का ही उदाहरण है, निश्चित रूप से संख्यात्मक नहीं है।`authority`                                                                                                                                                                                                                                                              `shipped-artifact`和 `observed`

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

两种混最浪费时间――第一种把伪代码当作行为观察;实际上, यह केवल गिद्रा 输出内容的观察――第二种把空列表当作不存在的证明――区域的设计说明非常严格:缺少覆盖的意思是未知,而不是不存在――`code/main.py`मध्य के हिसाब से इन दो नियमों को लागू किया जाएगा।

## 记录

एक रिकॉर्ड ठीक है कि वहाँ 16 खंड हैं, क्षेत्र 6.5.0 किसी भी अन्य खंड को अस्वीकार करेगा।`code/main.py`प्रयोग तथा वास्तविक समान नाम, इसलिए दोनों पक्षों द्वारा उत्पन्न रिकॉर्ड सभी परस्पर सत्यापन के माध्यम से पारित हो सकते हैं।`relationship_coverage`अनुशरणकर्ता या अनुशरणकर्ता सूची की पूर्णता को प्रदर्शित करना`complete``partial`या `unknown`यदि ऑपरेशन न रिपोर्ट करे तो संबंध`null`

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

नीचे वास्तव में है`grade`写入的真实记录, केवल इस节关注的字段──完整文件为 `code/fixtures/rea-evidence-grade.json`, बड़े आकार के लिए 37,573 字节.

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

分析配置中真实的 `parameters`वस्तुओं में 25 कुंजी हैं, वास्तविक `limitations`列表有十句话──请全部保留──限制属于内容的一部分,删除一项就会改变标识符,账本也会因此拒绝该记录──

ध्यान दें कि रिकॉर्ड कुछ नहीं कहता है।`environment``null`, क्योंकि गिदरा ने सिर्फ कागजात पढ़े, कोई कोड नहीं चलाया।`locations`इस ऑपरेशन में`normalized_result`内報告地址──`relationship_coverage` के लिए स्थिति`complete`, लेकिन इसके निदान विवरण केवल हल किए गए Ghidra 调用引用 पर लौटते हैं, अनसुलझे हुए गणना प्रकार या अप्रत्यक्ष रूप से अभी भी अज्ञात हैं।

## 标识符是内容哈希,路径不参与计算

एक परियोजना को आरएफसी 8785 के अनुसार रीयल रिकॉर्ड करेगा।`ev_`पहले, प्राप्त `evidence_id`                                                                                                                                                                                                                                                              `digest``format`和 `architecture`, दूर हो जाओ `name`和 `local_path``relationship_coverage``null`时也删除它, इसलिए调用关系的记录, अभी भी इस खण्ड में पहले के पहचानकर्ता को बनाए रखना, अन्य सभी सामग्री, सहित `raw_result`और हर एक सीमा, तुम भी इसमें भाग लेंगे

आरएफसी 8785 वस्तु कुंजी क्रमबद्ध करने के लिए, रिक्त स्थान को हटाने, और संख्याओं और वर्णों के प्रतिनिधित्व के रूप को तय करने के लिए।

```python
def canonical_json(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
```

`code/main.py`哈希 से पहले浮点数 को अस्वीकार किया गया था, क्योंकि RFC 8785 और पायथन कुछ浮点数 के लिए अलग-अलग आउटपुट हैं।

| rea 的值 | `code/main.py` 重新计算的结果 |
|---|---|
| `grade` 的 `ev_67b6d3f992eaf49a…` | 相同 |
| `percent_change` 的 `ev_e88b10dc0c6400e5…` | 相同 |
| 对 `{provider, parameters}` 计算的配置摘要 `9c7f6b24be69294e…` | 相同 |
| `grade` 快照条目的 `query_26122aebe9d8abae…` | 相同 |
| `percent_change` 条目的 `query_0f95ef38038d3666…` | 相同 |

एक ही अक्षर के समान अवलोकन के लिए, चाहे मशीन और कैटलॉग कैसे बदलें, सभी को एक ही पहचानकर्ता प्राप्त करना चाहिए।`local_path`                                                                                                                                                                                                                                                              `/home/you/re`后, पहचानकर्ता नहीं बदलेंगे.`rebind_subject_path()`允许用新路径展示记录;当 `sha256``format`या `architecture`साथ ही, यह खंड 6.5.0 में भी अस्वीकार कर दिया जाएगा।`rebindEvidenceToTargetPath`执行同样操作──

`validate_evidence()`重新计算标识符,若不匹配则使用 rea 的消息拒绝:证据语义识别符不匹配其记录──若记录的 `analysis_profile.provider``provider`यह भी अस्वीकार करेगा।`test_tampered_id_and_mismatched_profile_are_rejected`修改真实 `grade`记录中一行伪代码,并观察账本拒绝它──

## स्वनिरीक्षण लक्ष्य文件

किसी भी प्रदाता के लिए, पहले एक पुस्तक पढ़ लीजिए।`observe_object()`उपयोग `struct.unpack_from`解析 ELF64 节头、`.symtab``.strtab`和 `.rela.text`यह एक लेख में लिखा गया है `inspect_object`记录,并为每一个函数符号写入一条 `read_function_bytes`记录── ये ५条记录均为 `observed`, अधिकार स्रोत `shipped-artifact`, क्योंकि स्रोत डिस्क फ़ाइलों से है.

| 记录 | 内容 | 标识符 |
|---|---|---|
| `inspect_object` | 五个节的偏移、大小和哈希，四个函数，三条重定位 | `ev_645e0a145f28bd5c…` |
| `read_function_bytes percent_change` | `.text+0x00` 处的 16 字节 | `ev_2572a7d254ad15cb…` |
| `read_function_bytes grade` | `.text+0x10` 处的 46 字节，SHA-256 为 `ffcb75c2a7bb1104…` | `ev_a467c2427bfc0c56…` |
| `read_function_bytes total` | `.text+0x40` 处的 31 字节 | `ev_b1e845cea2543073…` |
| `read_function_bytes grade_label` | `.text+0x60` 处的 63 字节 | `ev_c50041be26e6b7f4…` |

`llvm-objdump -t`के साथ相符:`grade`位于 `0000000000000010`, बड़े आकार के लिए `2e``.rela.text`中中三条重定位均为针对`.rodata``R_X86_64_PC32`,偏移分别为 `0x36``0x84``0x93`, बढ़े हुए संख्या में अलग करने के लिए `0x10``0x24``-0x4` हर एक रिकॉर्ड के साथ `file-offset-range`位置和一项限制: 节字节从磁盘文件读取──读取器不应用重定位,也运行代码──

धारा 32  संपूर्ण पाठ इस पाठक को बनाया है  यहाँ केवल 60 पंक्तियाँ ही हैं, क्योंकि इस पाठ पर ध्यान केंद्रित है कि आप कैसे रिकॉर्ड पढ़ने की प्रक्रिया 

## 推导表,并明确说明它是推导结果

`grade`के 46 字节 में शामिल है 33 课解码过的四种模式:

| 字节 | 指令 | 在 `grade` 中的偏移 |
|---|---|---|
| `48 69 c0 67 66 66 66` | `imul rax, rax, 0x66666667` | 3 |
| `48 c1 f9 22` | `sar rcx, 34` | 13 |
| `83 c1 fa` | `add ecx, -6` | 23 |
| `83 f9 04 77 0c` | 先 `cmp ecx, 4`，再 `ja` | 28 |

乘以 `0x66666667`后右移 34位, बराबर है 10 ≠ 符号除以 10 ⋅ फाइल में 10 ⋅ नहीं है`derive_grade_model()`इस तथ्य को सीमित करने के लिए लिखेंः 除数 10 है, जो गुणा संख्या 0x66666667 और स्थानांतरण मात्रा 34 पर आधारित है 推导的──文件中没有10──

`add ecx, -6`पहली शाखा 6 के लिए सेट करेगा`cmp ecx, 4`配合无符号跳转 अनुमति देता है पाँच分支, अर्थात् 6 से 10

`.text+0x33`处的 `lea`带有加数为 `0x10`                                                                                                                                                                                                                                                              `.rodata+0x14`开始──那里的五个小端字为 `1, 2, 3, 4, 4``ledger.c`मध्य स्विच 60 से 69 तक लौटने के लिए 1, 70 से 10 से 2 तक लौटने के लिए 2, 80 से 100 से 3 तक लौटने के लिए 4 पर लौटने के लिए 编译器 转换 转换 为了返回值查找表――

生成的记录 `ev_605106bff2d9998f…``confidence``derived`,`evidence_links`इस पर निर्भर दो अवलोकन रिकॉर्डों को इंगित करना।`ev_a467c242…`时,上图会显示这个状态――

现在与Ghidra比较── यह उसी字节 के लिए दिया गया है

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

Ghidra 应用了重定位,并将表命名为 `DAT_001000b4`जब यह होगा`.text`放到 `0x100000`后, यह है `.rodata+0x14` यह 10 और 5 से विभाजित भागों से बाहर निकलता है  डिफ़ॉल्ट मान के लिए, यह 0 के बराबर एक हमेशा के लिए बाहर निकलता है  लेकिन कभी भी 0 के अभिव्यक्ति को सीधे नहीं लिखता है`native_value_flow`मध्य पी-कोड इन कार्यों को चिह्नित करेगा`is_dead: true` इस रिकॉर्ड ने गिद्रा के आउटपुट का निरीक्षण किया है; आप उससे समझते हैं कि इसका अर्थ क्या है, यह अनुमान का है, जबकि आपके द्वारा प्राप्त होने का मूल्य अनुमान का है

`percent_change`记录 ने एक और असफलता दिखाई है.`undefined1 [16] percent_change(int param_1,int param_2,ulong param_3)`, स्रोत कोड है`int percent_change(int before, int after)``idiv`写入 `EDX:EAX`, जबकि शून्य मूल्य पथ में कोई संशोधन नहीं हुआ है `EDX`, इसलिए, एंट्रॉ कॉम्पाइलर ने 16 字节 रिटर्न वैल्यू और तीसरे पैरामीटर का अनुमान लगाया।`grade`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `native_api.return_type.confidence``"low"`应恢复签名视为提供者的推断,并如实记录

## 预测是推测记录

预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预测 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预 预`claim_suite()`根据推导模型和源码构建十八项预测──`record_prediction()`प्रत्येक वस्तु को जीवित रखा जाएगा`confidence``inferred``authority``analyst-inference`के रिकॉर्ड,并链接到所依赖的记录──

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

`predict()`C 语义, बजाय पायथन 语义。 का प्रयोग करें`c_div()`शून्य से शून्य तक,`wrap32()`प्रत्येक मध्य मूल्य को 32 位─पायथन के `//`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `(3 - -7) * 100 // -7`得到 -143, जबकि C 程序得到 -142──第 36 课会大幅扩大这个输入网格──

प्रत्येक पूर्वानुमान एक शेष अज्ञात परियोजना का निर्माण करेगा।`controlled-replay``observed`证据,并建议一次探测: मेजबान संस्था में निर्माण पर निष्पादन`execute_function`下一节会产生这种证据──第一个级 断言问题是:编译后的函数实际运行时,级(95) == 4 是否成立?

## वास्तविक परिचालन जांच के लिए

`code/fixtures/harness.c`包含 `ledger.c`, प्रत्येक बार एक परिणाम मुद्रित करें`observe_runs()`उपयोग पथ ऊपर खोजने का पहला `clang``cc`या `gcc`编译它,并将网格中的每一个输入运行一次──每一次运行都成为一条记录:

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

运行记录的主体是测试驱动程序二进制文件, इस मैक 上上它是Mach-O arm64 文件,拥有自己的SHA-256──提供方是 `course-harness`,附带编译器版本行, यहाँ为 `Apple clang version 17.0.0 (clang-1700.6.3.2)``evidence_links` 指向源码记录 `ev_2f1e6d251543d017…`, क्योंकि उत्पाद और लक्ष्य दस्तावेज केवल साझा किए जाते हैं`ledger.c`, इसके अलावा एक ही नहीं है.

कृपया पहले पैरामीटर को दो बार पढ़ें- x86-64  लक्ष्य फ़ाइल इस मशीन पर कभी नहीं चलती है। वास्तविक रूप से एक ही स्रोत कोड दूसरे ढांचे के दूसरे निर्माण के लिए चल रहा है। यह अभी भी एक अवलोकन है, और बिना एमेच्योर के मामले में, यह सबसे मजबूत प्रमाण है, इसलिए यह निष्कर्ष पारित किया जा सकता है, लेकिन इस पैरामीटर को साथ रखना चाहिए।

17 गुना एक ही प्रवाहित प्रवाहित सब कुछ पूर्वानुमान के अनुरूप है।`code/fixtures/run-evidence.json`यह 17 条记录和源码记录, 2026-10-13 को सहेजा गया `--record`导出──没有编译器时,`build_ledger()`प्रक्रिया में प्रवेश करने और रिपोर्ट करने के लिए `runs`字段中明确说明──

## 提升规则

केवल निरीक्षण के माध्यम से ही अनुमानों का समर्थन किया जा सकता है।`check_claim()`查找函数和参数相同 `execute_function`记录,将每个结果与预测比较,并统计覆盖的输入:

| 状态 | 条件 | rea 的完成账本 |
|---|---|---|
| `pass` | 每个输入都有一致的运行，且没有不一致结果 | `pass` |
| `fail` | 任一次运行不一致 | `fail` |
| `unknown` | 部分输入有运行，其他输入没有 | `unknown` |
| `unsupported` | 没有任何输入有运行记录 | `unsupported` |

`promote_claim()`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️`inferred`या `derived`रिकॉर्डिंग के समय, यह सब फेंक दिया जाएगा`ClaimError`; पहचानकर्ता अन्य फ़ंक्शन या अन्य पैरामीटर के संचालन के लिए संकेत देता है, असामान्य भी छोड़ देगा; सूची के लिए या कार्य कवर में प्रवेश कम है जब निष्कर्ष आवश्यकता है, इसी तरह से।`grade(55)`साथ ही साथ गिदरा के पास भी है, लेकिन वे इस कथन को नहीं बढ़ा सकते हैं।`ev_7be90c0c…`, आप देखेंगे कि क्या कहना है`unsupported`, हालांकि बारे में `grade`का दो रिकॉर्ड अभी भी मौजूद है।

范围断言显示部分覆盖的情形──其十一条输入中, केवल 95 和 100 ही वर्तमान में运行网格中`check_claim()` लौटें `unknown`,`covered`∙ 11 个 में से 2 个;`promote_claim()`则拒绝,消息为2 11 इनपुटों में से 2 रनों का अवलोकन किया गया है──账本不会把这个结果上成完整覆盖──

`completion_ledger()`प्रतिरोधक`EvidenceCompletionLedger`                                                                                                                                                                                                                                                              `ecl_`और केवल `pass`और `total`时,`complete`才为真──因为那一项范围断言,演示输出 `ecl_da64933ea13befed…`,并显示 `complete: false`

## अज्ञात में है के साथ एक हिचकिचाहट के रिकॉर्ड

शेष अज्ञात वस्तुओं को कठोर संरचना के रिकॉर्ड के लिए संग्रहीत किया जाएगा।`code/main.py`प्रयोग समान字段和 समान不变量──

पहचानकर्ता है`unk_`加 `{domain, question, scope_digest}`SHA-256, जिसमें से एक प्रश्न में एक ही रिक्त स्थान के लिए लगातार रिक्त फ़ॉल्ड होते हैं।`scope_digest`                                                                                                                                                                                                                                                              

प्रत्येक संशोधन में एक नया संशोधन संस्करण उत्पन्न होता है।`previous_revision_digest``null`后续每修订都引用前一版本的 `revision_digest`, सारांश कवर除自己以外的所有字段──`verify_unknown_chain()`遍历列表, पुनः गणना प्रत्येक सारांश, जाँच प्रत्येक लिंक का संदर्भ पूर्ववर्ती संस्करण की ओर है या नहीं,并 जाँच प्रत्येक संस्करण के संदर्भ के परिवर्तन के प्रमाण की उपस्थिति में खाता में मौजूद है या नहीं.

प्रत्येक परिवर्तन स्वयं प्रमाण रिकॉर्ड है, वास्तविक उपयोग प्रदान करने के साथ।`rea-unknown-registry`अभ्यास एक ही है।`confidence``derived`,`authority``analyst-inference`, कोई विषय नहीं, इसकी सीमाएँ हैं:

यही कारण है कि इस प्रदर्शनी के 81 अनुच्छेदों में 36 अनुच्छेदों का समावेश है।

प्रत्येक संशोधन को तीन अपरिवर्तनीय मात्राओं को पूरा करना होगा:

-  केवल `resolved`अनजान में है`resolution`,और केवल संशोधन 1 没有前驱──
- `contradicted`अज्ञात में कम से कम एक प्रतिवाद प्रमाण पहचानकर्ता का उल्लेख किया गया है, और एक ही पहचानकर्ता दो सूची में एक साथ नहीं दिखाई दे सकता है।
- `verified` समाधान परिणाम कम से कम एक प्रमाण पहचानकर्ता का उल्लेख करें जिसमें विश्वास श्रेणी और अधिकार स्रोतों की आवश्यकता होती है।

तृतीय नियम है कि, क्षेत्र के कामकाज के लिए सबसे अधिक अस्वीकार किए जाने वाले स्थानों पर काम किया जाता है।`resolve_unknown()`拒绝表模型,也拒绝权威来源为 `shipped-artifact`                                                                                                                                                                                                                                                              `ev_f4ffbe8f922ec7fe…``grade(95)`已解决的修订为版本 2,其`previous_revision_digest``ffca840b55a8a188…`,即修订 1 का सारांश

`update_unknown()`接收 `expected_revision`, जब उसके ओवरटाइम `revision-conflict`, के साथ वास्तविक `update_unknown`工具相同──正确应对方式也与 rea的说明一致:重新读取当前版本,再作决定──

प्रदर्शन के अंत के बाद एक अज्ञात परियोजना अभी भी बंद हैः`unk_f2eb0d7f84c80a19…`, प्रश्न है  संकलित के बाद के कार्य के संचालन में, 90 से 100 के प्रत्येक अंक का क्या सभी ग्रेड पूरा करते हैं (स्कोर) == 4?其状态为 `investigating`, समर्थन प्रमाण दो बार चलाने सहित, खोज सुझावों में अभी भी नौ अप्रयुक्त प्रविष्टियों को सूचीबद्ध किया गया है।

##  उत्तर缓存 नहीं विश्लेषण डेटाबेस

वास्तव में वहाँ तीन प्रकार की लग रही है जैसे कि भंडारण की चीज़ों.`-readOnly -deleteProject`导入,关闭时删除──内存中 `AnalysisSnapshotCache`एक द्वितीयक रूप से संरक्षित होने के लिए 10,000 से अधिक लेखों को शामिल किया गया है।`target``binding``entries``workflow_entries`和 `evidence_bundle`

缓存键是 `query_`加 `{target, binding, operation, parameters}`का SHA-256──`target``{sha256, kind, format, architecture}`,`raw-binary`目标 भी शामिल `entry_point``binding`包含提供方及整个分析配置,连同摘要──修改 25 配置参数 में से किसी एक, उदाहरण के लिए `jump_table_evidence`से `typed-case-default-blocks-v1`改为 `v2`, सारांश बदल जाएगा, सभी की बातें भी उसके साथ बदल जाएंगी

`code/fixtures/rea-snapshot.json`यह दो बार चलाने के दौरान लिखे गए दस्तावेजों, बड़े आकार 142,690 字节──क्षेत्र  लिखने के समय अधिकार केवल मालिकों तक सीमित है, भंडार के प्रति-कही व्यक्ति द्वारा पठनीय प्रस्तुत किए जाते हैं। इसमें दो लेख, साथ ही दो रिकॉर्ड के साक्ष्य के साथ संग्रहीत किए गए हैं।`AnswerCache.import_snapshot()`重新计算每 `query_id`, किसी भी असंगति को पूरा फाइल अस्वीकार कर दिया जाता है`target`या `binding`वर्तमान मूल्य से भिन्न, तो उपयोग करें वास्तविक का शब्दावली `profile_mismatch` नकार ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् `format_version`नहीं है`course-answer-cache-1`, भी मना कर देगा.

इस मशीन पर तीन बार माप इस प्रकार हैः पहली बार `grade`查询 पुनः导入 Ghidra, समय 8.6 सेकंड; उसी त्वरित तस्वीर के लिए `percent_change`प्रश्न 8.5 सेकंड का होता है, क्योंकि विभिन्न प्रश्नों को कैश में नहीं रखा जाता है।`grade`पूछताछ समय 2.1 सेकंड, वापस पूरी तरह से एक ही रिकॉर्ड और`evidence_id`                                                                                                                                                                                                                                                              `lookup()`इसके अतिरिक्त, पाठक को नए उत्तरों के बीच अंतर करने दें।

变更会终止缓存使用── 6.5.0 में, पुनः नामकरण या अतिरिक्त注释会在调用发送给提供者之前清空快照缓存── असफल प्रतिक्रियाएं पूर्व-परिवर्तित लेखन का प्रमाण नहीं दे सकतीं, इसलिए लेखन असफल भी पुनःप्रकाशित करना बंद कर देती हैं── डाटाबेस के पूर्व-डेटा आयात को संशोधित करेगी।

## क्यों बुद्धिजीवी को इसकी आवश्यकता है

MCP                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `evidence_id`◊2026 के अध्ययन में कहा गया है कि यह आसानी से गलत है। ◊ अत्यधिक विश्वास उपकरण आउटपुट NDSS BAR अध्ययन के चार कमजोरियों में से एक है। ◊संपादित पाठ के अध्ययन में, यहां तक कि अगर केवल द्विआधारी सामग्री डेटा के रूप में प्रस्तुत की जाती है, तो 40 बार में से 15 बार असुरक्षित सुझाव हैं।[arXiv 2606.06838](https://arxiv.org/abs/2606.06838)): सैकड़ों फ़ंक्शन वाले द्विआधारी फाइलों के लिए, केवल 10% से 15% फ़ंक्शन को ही बुद्धिजीवी द्वारा उत्पन्न कोड से पहले वास्तविक विश्लेषण किया जाता है।

账本用记录回应每一个问题,智能体只报告账本中已有的内容──没有观察运行的断言为`unsupported`, केवल भाग के लिए काम करने के लिए कहा जाता है`unknown`                                                                                                                                                                                                                                                              `observed`केवल प्रदाता के लिए आउटपुट, अधिक का प्रतिनिधित्व नहीं करते हैं।`outputs/`इस पुस्तक को एक बुद्धिमान व्यक्ति को सौंप दिया गया है, और उसे केवल एक ही स्थान पर लिखा गया है।

## स्वयं निर्माण

运行仅使用标准库的演示:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
```

演示读取目标文件,导入两条 rea 记录,验证 rea 快照,并推导两个模型―― इसके बाद रिकॉर्ड 18 项预测、新建 18 项未知、编译并运行测试驱动程序、检查每项断言,再解决 17 项未知──预期结构如下:

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

没有 C 编译器时,`runs`显示 `imported 17 recorded run records from run-evidence.json`, शेष समान है.

按以下顺序阅读 `code/main.py`:

1. `canonical_json()`和 `compute_evidence_id()`实现哈希方法和语义投影──
2. `create_evidence()`和 `validate_evidence()`构建并检查记录──
3. `EvidenceLedger.record()`和 `import_bundle()`保存记录并拒绝冲突──
4. `open_unknown()``update_unknown()`和 `resolve_unknown()`维护修订链──
5. `observe_object()`读取 ELF,`derive_grade_model()`读取表――
6. `claim_suite()``predict()`和 `record_prediction()`写入推测层记录──
7. `observe_runs()`परीक्षण ड्राइवर के प्रत्येक चाल को अवलोकन रिकॉर्ड में परिवर्तित करना
8. `check_claim()``promote_claim()`和 `completion_ledger()`应用提升规则──
9. `AnswerCache`像 rea 快照一样为回答设置键,并拒绝过期结果──

## इसका उपयोग करें

प्रत्येक लक्ष्य हेतु, प्रत्येक सर्वेक्षण हेतु, प्रत्येक विषय में लक्ष्य के लेखन के लिए, प्रत्येक अज्ञात परियोजना में लक्ष्य के लेखन के लिए, प्रत्येक विषय में लक्ष्य के लेखन के लिए, प्रत्येक अज्ञात परियोजना में लेखन के लिए, प्रत्येक सर्वेक्षण के लिए, प्रत्येक विषय में लक्ष्य के लेखन के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक अज्ञात परियोजना में लेखन के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में लक्ष्य के लिए, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, और प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, प्रत्येक विषय में, और प्रत्येक में, प्रत्येक विषय में, प्रत्येक में, प्रत्येक विषय में, प्रत्येक में, प्रत्येक विषय में, और प्रत्येक में, प्रत्येक में, प्रत्येक में, प्रत्येक में, प्रत्येक में, प्रत्येक में, प्रत्येक में, प्रत्येक में, प्रत्येक में, प्रत्येक में, प्रत्येक में, प्रत्येक में, और अन्य अन्य अन्य अन्य अन्य अन्य अन्य अन्य अन्य अन्य अन्य अन्य अन्य अन्य अन्य अन्य अन्य अन्य अन्य अन्य में, में, में,`provider`,让标识符自然分化―― पुनःनिर्माण器具时,主体摘要改变,所有旧记录就成了关于另一个文件的证据――

एक बार जान जान सीमा,就立即写下──读取器不应用重定位,就明说明;运行的是宿主机构建,就明说明;模型推推推出除数,也明说明──缺少限制的记录看起来会比事实允许更强,后来的读者无法弥补这种损失──

प्रत्येक खंड को प्रदान करने वाले पाठ को सभी डेटा के रूप में देखा जाता है। लक्ष्य से प्राप्त वर्णक और नकली कोड लक्ष्य द्वारा नियंत्रित पाठ हैं, यह निर्देशों में नहीं बदल सकता है, न ही व्यवहार के अवलोकन में। क्षेत्र 6.5.0 उपयोग करें।`_meta.provenance.untrusted_content: true`标记此类结果──其服务器指令要求模型将目标内容视为数据,并将其中要求运行,安装,下载或发送内容的请求报告作为提示注入企图──标记有助,但账本仍必须确保目标文本不会进入指令层──

## 交互实验

### 实验 A: पुनः गणना 标识符

`code`目录中启动 पायथन:

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

पहले दो तुलना परिणाम वास्तविक हैं, क्योंकि मार्ग में भाग नहीं लिया गया है।

### 实验 B: अस्वीकार提升

```python
ledger, report = build_ledger(live_runs=False)
claim = [c for c in claim_suite(ledger.find(operation="derive_switch_model")[0], ledger.find(operation="derive_arithmetic_model")[0], ledger.find(operation="read_source")[0]) if c.claim_id == "grade(55)"][0]
promote_claim(ledger, claim, [ledger.find(operation="derive_switch_model")[0]["evidence_id"]])
```

调用抛出 `ClaimError`,并指出推导记录的标识符──现在传入运行记录标识符:

```python
run = run_records_for(ledger, "grade", [55])[0]
promote_claim(ledger, claim, [run["evidence_id"]])["status"]
```

 स्थिति के लिए `pass`, वापसी की `limitations`रखरखाव मेजबान संस्था निर्माण विवरण

### 实验 C: अस्वीकार过期快照

```python
import json
snapshot = json.loads(REA_SNAPSHOT_PATH.read_text())
target, binding = rea_snapshot_binding(snapshot)
AnswerCache(target, binding).import_snapshot(snapshot)
stale = dict(binding["analysis_profile"]["parameters"], jump_table_evidence="typed-case-default-blocks-v2")
AnswerCache(target, {"provider": binding["provider"], "analysis_profile": make_profile(binding["provider"], stale)}).import_snapshot(snapshot)
```

पहली बार आयात-वापस दो, दूसरी बार फेंक-बाहर`profile_mismatch``CacheError` केवल एक संस्करण में बदलाव, पूरे त्वरित चित्र को अस्वीकार कर दिया गया 

### 实验 D:破坏链

```python
unknown_id = [u for u, r in ledger.unknowns.items() if r[-1]["status"] == "investigating"][0]
ledger.verify_unknown_chain(unknown_id)
ledger.unknowns[unknown_id][0]["severity"] = "critical"
ledger.verify_unknown_chain(unknown_id)
```

पहली बार调用返回 2... दूसरी बार抛出 `EvidenceIntegrityError`, क्योंकि संशोधन 1 अपने स्वयं के सारांश से मेल नहीं खाता है, जबकि संशोधन 2 एक पहले से मौजूद सारांश की ओर इशारा करता है।

## 实践实验

关闭未解决未知项目,并添加第二提供方──

要求:

- 扩展 `run_grid()`, परिचालन दायरा का दावा गायब नौ प्रविष्टियों, फिर पुष्टि अज्ञात में संशोधन 3 变为`resolved`
- `llvm-objdump -d`添加为第二个提供方, अपने स्वयं के उपयोग `provider`् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् `grade`清单记录为 `observed`
- 写入一条 `derived`记录,说明 Ghidra 和 llvm-objdump के दो भागों को एक ही 14 条 निर्देश से निकालना,并同时链接两者──
- `grade_label(105)`नई गंभीरता के लिए`high`का अज्ञात, क्योंकि शो सूचकांक 4 会读取 `labels[4]`; पुनः व्यावहारिक संचालन से इसे हल करना।
- उपयोग `export_bundle()`导出账本,再导入全新账本,证明每条链仍可通过验证──

सफलता मानकः रिपोर्ट के प्रत्येक वाक्य में साक्ष्य पैकेज में पहचानकर्ता का उल्लेख किया गया है, और वह `unknown`断言已消除──

## 评分实验

五道关于本课件的题目――आपके द्वारा निर्मित कोड के साथ प्रत्येक उत्तर का पता लगाएं, फिर लिखें `code/lab_answers.json`数字写成数字, या लिख成 `"0x40"`इस प्रकार के षट् षट् षट् षट् षट् षट्; सूची को JSON 列表 में लिखा गया है।

1. `t1`:compute_evidence_id 为 वास्तविक-evidence-grade.json 给出的证据 id──
2. `t2`:grade 记录中限制的数量──
3. `t3`:grade 记录的关系_coverage 状态──
4. `t4`:grade 记录的信心和权威,写成由两个字符串组成的列表──
5. `t5`:grade 记录中 विषय का SHA-256。

检查你的答案:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/lab.py
```

检查器在已提交的固定 上使用 `code/main.py`计算每期望值── यह प्रति题输出 `PASS``FAIL`या `TODO`और कुल मिलाकर, केवल पांच प्रश्न पूरे समय से ही 0 से बाहर निकलते हैं।`python3 code/lab.py my-answers.json`एक और फाइल को चेक करें।`code/tests/test_lab.py`证明检查器 सही उत्तर स्वीकार करें并拒绝错误答案──

### देखो यह काम करता है

[Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler?symbols=off)机器维护一本证据账本,分为四托盘:observed、derived、inferred 和 unknown── यह कड़ी बंद प्रतीक पत्र के मामले में चालू संचालन में है, इसलिए फ़ंक्शन नाम और फ़ंक्शन का अंत अज्ञात में, प्रारंभ स्थान में प्रवेश करने के लिए निष्कर्ष निकाला गया है──

## 本课产物

本课产 出 `outputs/skill-evidence-ledger.md`यह निर्देश देता है कि बुद्धिमान व्यक्ति प्रत्येक खोज को विश्वास श्रेणी, अधिकार स्रोत, सीमा और लिंक के रिकॉर्ड के रूप में लिखेंगे, यह बताता है कि संशोधित संस्करण के साथ अज्ञात वस्तुओं को कैसे बनाए रखा जाए, और कब निष्कर्षों का न्याय किया जाएगा।`pass``fail``unknown`या `unsupported`

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

28 项测试证明:

- 两个 rea `evidence_id`、配置摘要及两个快照 `query_id`शहर से सामग्री पुनः गणना कर सकते हैं
- 改变路径不改变标识符,改变限制则改变标识符
- परिवर्तन की रिकॉर्ड अनुरूपता प्रदान करने वाले प्रभाग अज्ञात अंक और मूल्य सूची को अस्वीकार कर दिया जाएगा
- 重复记录返回 `duplicate`, संघर्ष रिकॉर्ड, परमाणु संपन्नता
- यादा दर्ज किए गए प्रवाहित प्रमाण पत्र के पैकेज में 18 लेख हैं, और कोई लंबित लिंक नहीं है
- अज्ञात परियोजना से संशोधन 1  प्रारंभ, अस्वीकार `expected_revision`और केवल देखने के लिए।`controlled-replay` सबूत इसे हल करने के लिए
- 编辑修订内容会破坏链
- 提升拒绝推测、推导、空列表和无关证据, केवल तभी पारित होता है जब परिचालन परिणाम सहमत होते हैं
- 部分覆盖为 `unknown`,不一致运行则为 `fail`
- 缓存 केवल कुंजी में पूर्णतः संगत है, अन्य तत्वों को नहीं है
- 缓存 अस्वीकार उन्नयन विन्यास संस्करण、 गलत लक्ष्य、 गलत प्रारूप संस्करण और 改的键
- ELF 读取器 偏移、大小、字节和重定位上与 `llvm-objdump`एक致,表中读出 `1, 2, 3, 4, 4`
- 预测 उपयोग C 除法语义,且已记录运行与全部17 项单输入断言一致
- 存在编译器时,实时运行结果也一致

## उत्पादन वातावरण में विफलता मोड

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

तीन प्रकार के अलग-अलग प्रकार के साथ आपके द्वारा पढ़े गए सामग्री को रिकॉर्ड करें, गणना की गई सामग्री और अपेक्षित परिणामों को रिकॉर्ड करें। पहचानकर्ता के साथ अज्ञात वस्तुओं को बंद करने के लिए, साक्ष्य के लिए एक वाक्य का उपयोग करने की आवश्यकता नहीं है।

## 延伸阅读

- [rea 6.5.0 source, `src/domain/evidence.ts` and `src/domain/residualUnknown.ts`](https://github.com/morluto/rea)
- [RFC 8785, JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785)
- [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Agent Failure Patterns in CTF Reverse Engineering, NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)
- [When Binaries Talk Back: Representation-Confusion Attacks on LLM-Assisted Reverse Engineering, arXiv 2607.12507](https://arxiv.org/abs/2607.12507)
- [Agentic decompilation study, arXiv 2606.06838](https://arxiv.org/abs/2606.06838)
- [When LLM Decompilers Recompile More and Preserve Less, arXiv 2609.05370](https://arxiv.org/abs/2609.05370)
- 本课描述的 rea 6.5.0 源码,标签为 `3b79af2``src/domain/evidence.ts`,`.agents/skills/reverse-engineer-anything/SKILL.md`,`docs/cli.md`,`src/domain/reconstructionVerification.ts`,`src/application/ReconstructionObligationCandidates.ts`,`docs/tool-design.md`,`src/domain/evidenceCompletionLedger.ts`,`src/domain/residualUnknown.ts`,`src/application/investigation/UnknownEvidence.ts`,`.agents/skills/reverse-engineer-anything/references/evidence-workflows.md`,`src/application/binary/AnalysisSnapshotCache.ts`,`src/domain/analysisSnapshot.ts`,`src/application/binary/BinarySession.ts`,`src/application/binary/BinarySessionRecords.ts`,`docs/mcp-contracts.md`. .
