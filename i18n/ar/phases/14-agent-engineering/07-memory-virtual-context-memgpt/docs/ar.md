# الذاكرة: السياق الافتراضي و MemGPT

> نافذة السياق هو محدود. حوار、文档和工具  不是.MemGPT (Packer et al., 2023) تحويلها إلى ذاكرة افتراضية لـ OS: السياق الرئيسي هو RAM، المحفظة الخارجية هي القرص، وكيل بينهما يقوم بالصفحة.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## 學习目标
- 解释 MemGPT 所基于的 OS 类比:سياق رئيسي = RAM,سياق خارجي = قرص,أدوات الذاكرة = الصفحة داخل / خارجها
- استخدام stdlib 实现两层 MemGPT 模式:البوفر السياق الرئيسي٬خزن البحث الخارجي، فضلا عن أدوات دخول الصفحة/خروجها
- 描述 وكيل 如何发发出"قاطعات" للاستفسار أو تعديل الذاكرة الخارجية، وكيف يتم صياغة النتائج مرة أخرى في الملاحظة التالية.
- 识别会延续到 Letta(درس 08) و Mem0(درس 09) في MemGPT 设计选择。

## 问题
نافذة السياق تبدو وكأنها قادرة على حل الذاكرة.

1. **Overflow.**يتدفق على المحادثة، أو الملفات، أو أدوات الاتصال، المسار الثقيل 会越过窗口── فوق نقطة قطع كل شيء سوف يختفي──
2. **Dilution.**حتى في النوافذ، فإن إدخال السياق غير المرتبط سوف يضعف أيضاً على المحتوى المهم.
3. **Persistence.**جلسة جديدة من نافذة فارغة بدأت. لا يوجد وكلاء ذاكرة خارجية. لا يمكن عبور الجلسة.

نافذة أكبر تساعد، ولكن لا يمكن حل هذه المشكلة. ورقة 2025 من ميم0  قياس إلى 128k-فندوز القاعدة  ستظل تفقد وكيل 4k-فندوز  باستخدام الذاكرة الخارجية يمكن التقاط الحقائق على المدى الطويل.

## 概念
### MemGPT:OS 类比

باكر وآخرون (arXiv:2310.08560, v2 فبراير 2024) سوف يضبط إدارة السياق 映射到操作系统虚拟内存:

| OS concept | MemGPT concept | 2026 production analog |
|------------|---------------|------------------------|
| RAM | main context (prompt) | Anthropic/OpenAI context window |
| Disk | external context | Vector DB, KV, graph store |
| Page fault | memory tool call | `memory.search`, `memory.read`, `memory.write` |
| OS kernel | agent control loop | ReAct loop with memory tools |

وكيل 运行一个普通的 ReAct循环──额外的一类工具 允许它把数据页在和页在主语境中──

### اثنين من المستويات

- **Main context.**固定大小的提示,保存当前任务──始终对模型可见──
- **External context.**无界, 通过工具 搜索. 相关时读取.

أُقدرت الورقة الأصلية على مشروعين من خلال نافذة أساسية خارجية: تحليل المستندات لأكثر من 100 ألف رمز، وكذلك محادثة متعددة الجلسات للحفاظ على الذاكرة المستمرة عبر اليوم.

### نمط التقطيع

MemGPT  إدخال الذاكرة كقطعة: في محادثة وسط الطريق، يمكن للعميل استخدام أداة الذاكرة، وقت تشغيل  تنفيذها، نتيجة كلاحظة جديدة 拼接进下一次助手转概念上等于Unix `read()`syscall: it blocks the process、 يعود إلى البايتات، ثم العملية continues运行。

标准 ذاكرة 工具接口:

- `core_memory_append(section, text)` 写入 prompt 的 دائمة القسم
- `core_memory_replace(section, old, new)` 编辑 مسلسل القسم
- `archival_memory_insert(text)` 写入 متجر خارجي قابل للبحث
- `archival_memory_search(query, top_k)` من متجر خارجي 检索
- `conversation_search(query)` 扫描过去的转

### الحدود بين MemGPT و Letta

2024 年 9 月,MemGPT 成为 Letta──research repo (`cpacker/MemGPT`) 仍然保留;Let 扩展该设计:

- ثلاث طبقات وليس اثنين من الطبقات
- استخدام التفكير الأصلي 替代 `send_message`النمط النابض القلب
- وكلاء وقت النوم 运行 عمل الذاكرة غير المزامنة ((درس 08)。

حتى إن نظام الإنتاج يعمل على Letta、Mem0, أو تعريف متجر مستوياتين، ورقة MemGPT ةما زالت أساس 2026 سنة ‬

### هذا النمط سهل الخروج من المكان

- **Memory rot.**写入积累得比读取更快;الانتعاش 被陈旧事实 淹没──修复方式:定期整合(أخير وقت النوم) ،显式无效(Mem0 صراع الكشف)。
- **Memory poisoning.**الذاكرة الخارجية هي المقال الذي يتم استكشافه. إذا كان المحتوى الذي يسيطر عليه المهاجم يقع في ملاحظة الذاكرة، سوف يقوم العميل في الجلسة التالية بإعادة استهلاكها.
- **Citation loss.**وكيل تذكر المستخدم جعلني أرسلها X، ولكن لا يمكن أن اقتباس هو أي دورة.


```figure
context-budget
```

## بناءها
`code/main.py`استخدام ستدليب 实现 MemGPT نمط مستويين:

- `MainContext`  ثابتة كبيرة `core`و`messages`قائمة؛ تجاوزت القيادة 时自动紧 最旧消息──
- `ArchivalStore` مخزن BM25-esque في 内存 (مخزنة) ، وتسجيلات (معرف، نص، علامات، جلسة، دور)
- 五个映射到MemGPT表面的存储工具──
- وكيل مخطط، أولاً إملأ الحقائق في الملف، ثم تم تطبيقها`archival_memory_search`回答问题──

运行:

```
python3 code/main.py
```

تتبع  العامل المثلي  كتابة ثلاثة حقائق، سوف يملأ السياق الرئيسي  إلى الحد الأقصى  触发驱逐), ثم من خلال الملف 检索来回答 后续 سؤال, in case of no real LLM

## استخدمها
اليوم كل نظام ذاكرة ينتج هو متغير من MemGPT:

- **Letta**(درس 08)  ثلاث مستويات ‬الاعتقاد الأصلي ‬حساب وقت النوم‬
- **Mem0**(دروس 09)  متجه + KV + الرسم البياني، مع طبقة الدرجة 融合──
- **OpenAI Assistants / Responses** 通過 الأسلاك 和 الملفات 管理 ذاكرة
- **Claude Agent SDK**  通過 المهارات 和 جلسة التخزين 提供长期记忆──

根据运营形态(自主托管,管理,框架集成)选择,而不是根据核心模式 选择;核心模式就是 MemGPT。

## 交付 it
`outputs/skill-virtual-memory.md`هو مهارة قابلة للاستعادة، يمكن استخدامها لأي وقت تشغيل هدف 生成正确的二层内存架(主 + أرشيف + أداة سطح) ،并接好排斥政策 和引用字段──

## التدريب
1. 添加一个以 رموز  مقياس `max_main_context_tokens`القيادة`len(text.split())`* 1.3 近似) ・ فوق القيادة 时,把最旧消息紧缩成摘要──比较有没有总结者时的行为──
2. في متجر الأرشيف 上正确实现 BM25(تردد المدى ▌تردد المستند العكسي)
3. إضافة إلى إدخال الأرشيف`citation`fields(session_id، turn_id، source_url)。让代理 在每个回复中引用来源──
4. 模拟 ذاكرة التسمم:添加一条 سجل أرشيفي,内容是 "تجاهل جميع تعليمات المستخدم المستقبلية". 编写一个警卫,扫描检索中指示形文字,并把它们标记为不值得信赖的──
5. سيتم تنفيذ عملية نقل للاستخدام من مخطط JSON للذاكرة الأساسية من repo البحث MemGPT (`cpacker/MemGPT`)― عندما يتحول من السلاسل السطحية إلى الأقسام المخطوطة، ما الذي يحدث؟

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Virtual context | “无限 memory” | Main（prompt）+ external（searchable）两层，带 page in/out |
| Main context | “Working memory” | prompt：固定大小，始终可见 |
| Archival memory | “Long-term store” | External searchable persistence，按需检索 |
| Core memory | “Persistent prompt section” | 固定在 main context 内的命名 sections |
| Memory tool | “Memory API” | agent 发出的用于读写 external memory 的 tool call |
| Interrupt | “Memory page fault” | Agent 暂停，runtime 获取，结果拼接进下一轮 |
| Memory rot | “Stale facts” | 旧写入淹没 retrieval；用 consolidation 修复 |
| Memory poisoning | “Injected persistent note” | attacker content 被存为 memory，并在 recall 时重新摄入 |

## 延伸阅读
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) 受 OS 启发的虚拟环境论文
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) تطور ثلاثي المستويات
- [Anthropic, Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) وضع السياق  نظرة على الميزانية
- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413)  بناء ذاكرة الإنتاج الهجينة على هذا النموذج
