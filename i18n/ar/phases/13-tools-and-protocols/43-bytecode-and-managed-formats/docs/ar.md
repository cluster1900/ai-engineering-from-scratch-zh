# 超越原生代码:بايتون、JVM、.NET مع WebAssembly 字节码

> 字节码文件既包含程序,也包含编译器对程序的记录; 本课将构建读取器,揭示每种容器保留了哪些记录.

**Type:** Build
**Languages:** Python, Java, C#, WebAssembly text
**Prerequisites:** 第 13 阶段 · 32（从零实现 ELF）、33（反汇编与控制流）
**Time:** ~150 分钟

## 學习目标

- وفقاً لـ (بي إيه بي 552 读取 `.pyc`16 字节头部, و لا تستخدم `marshal`في حالة 模块,反序列化四个解释器版本写出的代码对象──
- وفقاً لـ JVMS باب 4 تحليل JVM 类文件, بما في ذلك`Code`属性 و`javac -g`添加的表──
- رد:`Ledger.class`في وسط JVM 操作码، و على أربعة تشكيلات من نفس المصدر`javap -c`من الصحة النووية
- 逐节读取 WebAssembly 模块,解码 كل وظيفة,并与 `wasm-objdump -d`النتائج النووية
- 遍历 .NET 程序集的 ECMA-335 元数据,从PE数据目录到 `MethodDef`行及 كل طريقة من CIL,并 استخدام ILSpy المستخدمة في قراءة المجموعة
- مقارنة أداء نفس الوظيفة في حاويات خمسة، قياس كل نوع من الأشكال المحفوظة والخسارة أي أسماء، أنواع، وهياكل التحكم.

## 问题

لقد بنيت`ledger.py`و`__pycache__`中发现 `ledger.cpython-314.pyc` تسأل الذكاء الملف يحتوي على ماذا.`Unsupported opcode`, طبعت خطة`# WARNING: Decompyle incomplete`智能体因此断言文件经过混──

الملفات لم تتأثر.`2b 0e`,即小端字 3627── هي قيمة عدد CPython 3.14 写入的数值,而反编译器的操作码表只支持到3.13──过时是工具──智能体没有读取头部,因此无法分辨两者──

دراسة 33 تظهر المحتوى المفقود في البرمجة الأصلية: العناصر، النوع، وكذلك تحويل إلى جدول التحول`switch` الحاوية الحكمية المحدودة ضاعت أقل، وختلف عن نفسها.  الحفاظ على كل اسم المتغير، ولكن لا تحافظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.  الحفاظ على النوع.

هذا الدروس يستخدم Python 標準庫 بناء أربعة أدوات القراءة. كل أدوة القراءة من أول الفصل يبدأ في قراءة حاوية، ويرسل وظيفة، ويتم التحقق من أدواتها الخاصة في هذا النموذج على نموذج الاختبار الذي تقوم ببناءه.`ledger``grade`ليس مقارنة

```figure
re-43-five-containers
```

## الصورة:

PEP 552 将头部定义为四个32位字符――第一是魔数,第二是位字段――第0位为1表示文件基于哈希――第1位为1表示`check_source`: شرح في وقت الإدخال على حساب المصدرات. الحسابات المقدمة هي:

魔数定义在 `Include/internal/pycore_magic_number.h`من 3.11 ، قاعدة هي Python 3.n من 2900 + 50 ، بدء في دورة الإصدار في كل مرة في الطابع الكود تغيرت كل مرة.`\r\n`لذلك في النموذج المكتبي فتح البايتون سوف تحصل على عدد خاطئ من العبارات. القيمة النهائية تتمثل في 3.11 من 3495 ̊3.12 من 3531 ̊3.13 من 3571 ̊3.14 من 3627 ، وكذلك 3.15 من 3666 ̊3.15 من Python 3.15.0 تم إصدارها في 2026-10-09 ، ولكن بنيت هذه المعدات من المثال لم يثبثها ، لذلك هذه القيمة تأتي من الملفات الرئيسية ، وليس الملفات الفعلية هنا.

نموذج لكل مفسر احتفظ بثلاثة حصص`compile_pyc.py`استخدام `py_compile.compile(..., dfile="ledger.py")`写入文件,使存储的文件名为 `ledger.py`، بدلا من بناء الآلات على الطريق.

```text
checked-hash   2b 0e 0d 0a  03 00 00 00  c7 16 c7 fc c5 1d 81 01
timestamp      2b 0e 0d 0a  00 00 00 00  8d 60 cf 6a  f1 01 00 00
```

逐字读取时间头部──`03 00 00 00`أو`00 00 00 00`-إنها علامة`8d 60 cf 6a`0x6acf608d = 1791975565, أي تكوين الملفات `ledger.py`-منذ وقتها`f1 01 00 00`وبالإضافة إلى الأرقام المختلفة، فإن الملفات المختلفة تحمل قيمة 3 علامات و 8 خيارات.

| 解释器 | 魔数字节 | 字值 | 文件字节数 | `grade.co_code` 字节数 | `grade` 指令数 |
|---|---|---|---|---|---|
| 3.11.14 | `a7 0d 0d 0a` | 3495 | 1054 | 80 | 31 |
| 3.12.12 | `cb 0d 0d 0a` | 3531 | 937 | 62 | 26 |
| 3.13.12 | `f3 0d 0d 0a` | 3571 | 943 | 70 | 26 |
| 3.14.6 | `2b 0e 0d 0a` | 3627 | 965 | 96 | 35 |

`code/main.py`وسط`read_pyc_header()`返回这些字段,并根据魔数字识别版本──`importlib.util.MAGIC_NUMBER`给出当前运行解释器对应的相同四字节──`python3 code/main.py compare`استخدام في`PATH`في كل شيء`python3.11`إلى`python3.15`编译源码,并将读者看到的头部与各解释器报告的自信息并排输出──

## المارشال 逐字段写入代码对象

كل نموذج من 16 حرف هو`e3`,即 `0x80 | ord('c')`هذا هو المثبت`FLAG_REF`الرمز الرسمي للشخصية  نوع الرمز، أخبر القارئ أن يتذكر هذا الشىء، ليتم التمسك به`r`引用── Marshall 文档明确表示,该格式刻意不提供文档,且代码对象不跨版本兼容──这些两点都属实,但格式仍然足够小,可以自行读取──`Python/marshal.c`列出类型码:`N`لا يوجد`i`أظهرت 32 位整数`s`أظهرت`z`和 `Z`表示短 ASCII 字符串,`(`和 `)`تعبر عن الـ`c`تعبر عن كود`r`تعبر عن المعادلة إلى المشاركة.

`w_complex_object()`按固定顺序写入代码对象──对于3.11至3.15 ,先以32位整数写入 `argcount`.`posonlyargcount`.`kwonlyargcount`.`stacksize`.`flags`؛ re以对象写入 `code`.`consts`.`names`.`localsplusnames`.`localspluskinds`.`filename`.`name`.`qualname`ثمّة`firstlineno`، أخيراً`linetable`和 `exceptiontable` من 17 字节开始手动解码 3.14 文件的模块代码对象:

```text
00 00 00 00   argcount 0
00 00 00 00   posonlyargcount 0
00 00 00 00   kwonlyargcount 0
01 00 00 00   stacksize 1
00 00 00 00   flags 0
f3 22 00 00 00   type 's' with FLAG_REF, 34 bytes of co_code follow
80 00  52 06  74 00  52 01  17 00  74 01 ...
```

代码中每条命令占两字节:`80 00`نعم`RESUME 0`،`52 06`نعم`LOAD_CONST 6`،`74 00`نعم`STORE_NAME 0`،`17 00`نعم`MAKE_FUNCTION` 3.14 清单输出相同的五条模块级语句──`code`بعد ذلك يحتوي على أربعة أشكال من الكود العادي، بعد ذلك هو`names`:`('LABELS', 'percent_change', 'grade', 'total', 'grade_label')`.

`code/main.py`وسط`Unmarshaller`يمكن قراءة هذا المخطط، فضلا عن 3.9 و 3.10 استخدام المخطط القديم؛ الأخير سوف `nlocals`.`varnames`.`freevars`和 `cellvars`设为独立字段──它构造一个 `CodeObject`, استخدام نفس اسم الصفة التي تعود إلى الكائن الحقيقي`varnames`على أساس`localspluskinds``CO_FAST_LOCAL`位选 `localsplusnames`على كل من الملفات الأربعة`grade`، لقد عاد`('score', 'bucket')`、القدر هو 10 `firstlineno`和非空的 `linetable`测试 `test_unmarshaller_agrees_with_the_running_interpreter`وبالنسبة للمفسرين الحاليين، سيتم وضع كل حلقة مع`marshal.loads()`تقارن: الباقي من الملفات الثلاث يمكن قراءتها بواسطة كودنا، ولكن لا يمكن قراءتها بواسطة المفسح الحالي`marshal`读取:

## أربعة مفسرات، أربعة درجات 字节码

في كل نسخة من هذه المستندات هناك نفس الحذارة: 字节码是CPython实现细节,不保证保持不变──`python3.1N -m dis ledger.py`输出都已保存──

3.11 وسط `grade`أبدأ بالقول:

```text
 11           2 LOAD_FAST                0 (score)
              4 LOAD_CONST               1 (10)
              6 BINARY_OP                2 (//)
             10 STORE_FAST               1 (bucket)
 12          12 LOAD_FAST                1 (bucket)
             14 LOAD_CONST               2 (9)
             16 COMPARE_OP               5 (>=)
             22 POP_JUMP_FORWARD_IF_FALSE     2 (to 28)
```

`BINARY_OP`位于偏移 6,下一条指令位于 10──中间两字节是 PEP 659 专门化自适应解释器引入的内联缓存项──偏移 16 的 `COMPARE_OP`بعد ذلك هو إرشاد لتحرك 22، لذلك يحتل اثنين من البيانات.`show_caches=True`وإلا سيتم إخفاء الحفظات.`LOAD_CONST`加 `RETURN_VALUE`替换为 `RETURN_CONST`, سوف نقوم بإعادة تسمية`POP_JUMP_IF_FALSE`,使 `grade`من 80 字节 خفض إلى 62 字节──3.13 输出标签 `L1`إلى`L4`بدلا من التحرك، و لم تطلب أن تقدم`-C`و يظهر التحول`-O`3.14 أيضاً`RETURN_CONST`,加入 `LOAD_SMALL_INT`和 `LOAD_FAST_BORROW`و في كل حالة من هذه الحالات`NOT_TAKEN`:

```text
 12         20       LOAD_FAST_BORROW         1 (bucket)
            22       LOAD_SMALL_INT           9
            24       COMPARE_OP             188 (bool(>=))
            26       CACHE                    0 (counter: 0)
            28       POP_JUMP_IF_FALSE        3 (to L1)
            30       CACHE                    0 (counter: 0)
            32       NOT_TAKEN
```

`-C -O`清单显示 `grade`هناك 13 منهم`CACHE`项:`BINARY_OP`بعد خمسة، كل واحد`COMPARE_OP`آخر واحد، كل واحد`POP_JUMP_IF_FALSE`بعد ذلك، تم عرض نموذج التكييف الذاتي على استخدام هذه الاحتفاظات.`dis.dis(grade, adaptive=True)`في العادي الصفحة`RESUME`和 `COMPARE_OP`موقع الخروج`RESUME_CHECK`和 `COMPARE_OP_INT`و`total`في الظهور`FOR_ITER_LIST`.`BINARY_OP_ADD_INT`和 `JUMP_BACKWARD_NO_JIT` وجود أشكال متخصصة في نفس المجموعة`co_code`字节中──pyc 永远不包含它们,因为专门发生在内存中──

هذا هو السبب في وجود إصدارات ضد المُعدّل على الحد الأقصى. 3.9.3  إعلان قبول Python 1.0 إلى 3.8 من الكود الإفتراضي. 3.9.3 3.9.3  قراءة 3.7 و 3.8.`python_3_13.cpp`، واجهت رمز التشغيل غير معروف عندما خرجت`Unsupported opcode`并标记结果不完整──PyLingual 声称支持从3.6 起所有已发布版本,并使用3.8到3.15的解释器重新编译、检查自己的输出──对于3.14 文件,前三者会拒绝或失败,只有后两者适用──选择工具前先读取魔数字──

## 类文件 حفظ لغة نفسها

JVMS جاوا SE 25 第 4.1 节将布局定义为一个结构:`magic`.`minor_version`.`major_version`.`constant_pool_count`كمية دائمة`access_flags`.`this_class`.`super_class`、接口、字段、方法、属性、魔数是 `0xCAFEBABE`Java SE 25 虚拟机接受 45 至 69 的主版本号,次版本号 65535 则表示预览特性文件。`Ledger-g.class`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `ca fe ba be 00 00 00 41 00 5e`: الرئيسية الإصدار 65 على Java 21`0x5e`= 94 هو عدد الحجم المعتاد.`Ledger-jdk25.class``ca fe ba be 00 00 00 45`开头,主版本为 69

常量池是类文件存储自己的字典的地方──`-g`构建中的条目 `#13`نعم واحد`Methodref`, إند توير`#8`و اسم و نوع`#14` على طول المؤشر `Ledger.grade:(I)I`, مع `javap -v`في`//`后输出的内容完全一致──描述符 `(I)I`أظهري واحد`int`参数 و واحد `int`返回值──`total``([I)I` 表示参数为`int`عدد المواد والفصول والفصول التي تتعلق بها كل طريقة والرموز والفصول لديها هذه النصوص، فإن المؤكدين المنصوص عليها في القسم 4.10 سوف يرفضون الوثائق التي لا تتفق مع النصوص.`code/main.py`وسط`ClassFile`类读取表 4.4 全部 17 种常量标签,并将一个 `Long`أو`Double`يُعدّ لفتتين من المواقع. عندما يواجه علامة غير معروفة أو آخر صفة بعد الفائض، فإنه يُرمي إلى غير عادية.

الصفات يمكن إضافةها إلى كل قسم وكل طريقة وكل`Code`属性本身上──JVMS 要求虚拟机忽略不认识的属性,因此添加或移除调试表不必改变方法体──javac 手册说明:`-g`المعلومات المختلفة التي تتضمن جميع المعلومات المختلفة التي تتضمن التغيرات المحلية، والتي يتم تصميمها بشكل افتراضي فقط لتوليد المعلومات المستندة والصادرة.`-g:none`则什么都不生成──三种构建测得的结果如下:

| 构建 | 字节数 | 常量池计数 | `LineNumberTable` | `LocalVariableTable` | `SourceFile` | `grade` 代码字节数 |
|---|---|---|---|---|---|---|
| `javac -g` | 1832 | 94 | 7 个方法 | 6 个方法 | 有 | 50 |
| `javac` | 1581 | 82 | 7 个方法 | 无 | 有 | 50 |
| `javac -g:none` | 1404 | 79 | 无 | 无 | 无 | 50 |

ثلاث وثائق`grade`50 个代码字节完全一致,测试也会检查这一点.`-g`لأجل`grade`增加的是一行 `LocalVariableTable`: اُستُد 0 长度 50 槽位 0 名称 `score`、 وصف`I` بدونها، المُعدّلُونَ فقط يَرى النوعُ`int`من الموقع 0 ، يجب أن تقوم بتصميمها بنفسك.`StackMapTable`، لأن الجهاز المختبر يحتاجها`BootstrapMethods`属性 أيضا حفظ، لأن `main` من خلال `invokedynamic`拼接字符串──

## 手动解码 مبدل الطاولات

في JVMS القسم 6 سيتم تعريف كل أمر على أنه حروف رمز التشغيل والعدد من عمليات محددة في رمز التشغيل.`tableswitch`和 `lookupswitch`开头包含零到三个填充字节, مما يجعل عدد عملياتها البدء 32 نقطة في عنوان أربعة مرات.

`Ledger-g.class`中 `grade`من pc 4 开始的字节如下:

```text
aa                 tableswitch at pc 4
00 00 00           padding to pc 8
00 00 00 2c        default: 4 + 44 = 48
00 00 00 06        low 6
00 00 00 0a        high 10
00 00 00 2a        case 6:  4 + 42 = 46
00 00 00 28        case 7:  4 + 40 = 44
00 00 00 26        case 8:  4 + 38 = 42
00 00 00 24        case 9:  4 + 36 = 40
00 00 00 24        case 10: 4 + 36 = 40
```

ثلاثة عشر حروف، وصفة، تمثل كل شيء`switch (score / 10)`، بما في ذلك 9 و 10 المشتركة في الفصل.`switch`إنشاء الأحياء الأصلية يتطلب إجراءات التفتيش الحدودي`lea`、一条 `movslq`、一条 `add`、 قفز فوري، وكذلك خمسة نقاط تعديل في القسم الآخر.

`disassemble_jvm()`تغطي جميع 202 رمز تشغيل محدد ومعها عرض عدد عملياتها، وفق قواعد الوفاء،并以`javap`طريقة تقديم عملياتها`compare_with_javap()`解析保存的 `javap -c -p`文本,包括多行 `tableswitch`块,并检查每条指令的偏移、助记符和操作数──四种构建的108条指令全部一致──测试`test_branch_offsets_are_relative_to_the_branch_instruction`检查 pc 1 的 `ifne` قفز إلى 6 ‬ 13 ‬`if_icmpge` قفز إلى 33، و 30 `goto`跳回 10..

وذلك من خلال تقديم هذه الدروس من الرادار المكون من الرادار2.6.2.4`rabin2 -I` تقرير `arch java`.`lang java 21`.`linenum true`和 `lsyms true`، تميزها على الإصدارات والجدولين التجريبية.`pd 14 @ sym.Ledger.grade`输出 `tableswitch`، و لا يستخدم السهم لتحديد خمسة أهداف .`Unable to parse code attribute: 2`هذا هو الحد الذي أوضحته بنفسي، ويتم الاستمرار به أيضاً`javap`وذلك على سبيل المثال، مقارنة بـ Python، فإن هذا النمط من المُضاد للمُعدّل هو أكثر تقدماً. CFR 0.152 باستخدام رخصة MIT. Prokyon 0.6.0 و Vineflower 1.12.0 باستخدام Apache-2.0; Vineflower هو دعم فرنفلور من جاوا 21، فرنفلور هو نفسه يقع في مخزن مجتمع IntelliJ. JADX 1.5.6 يدعم النمط من Android DEX، بينما تم إصدار JD-GUI الأخير في عام 2019.

## كان 模块 هو سلسلة من المشاهد

核心规范将模块定义为前导字节 `00 61 73 6d 01 00 00 00`,即字符串`\0asm`و النسخة 1، بعدها سلسلة من القصص. كل قسم من خلال عبارة تعريفية.`u32`الكبيرة والحجم المكونة. العلامة 1 إلى 13 هي الحلقة المعروفة، كل نوع يظهر أكثر مرة و حسب الترتيب. العلامة 0 هي الحلقة ذاتية التعريف بالاسم، يمكن أن تقع في أي مكان.`e4 00`لـ100`80 08`1024...`ledger.wasm`运行 `wasm-objdump -h`سأخرج من هنا`WasmModule`找到的七节节及其负荷偏移完全相同:

| 节 | 载荷范围 | 数量 | 为 ledger 保存的内容 |
|---|---|---|---|
| 类型 | 10 至 26 | 3 | `(i32) -> nil`、`(i32, i32) -> i32`、`(i32) -> i32` |
| 导入 | 28 至 39 | 1 | 类型为 0 的 `env.log` |
| 函数 | 41 至 46 | 4 | 每个已定义函数的类型索引 |
| 内存 | 48 至 51 | 1 | 一页，无最大值 |
| 导出 | 53 至 110 | 5 | `memory` 和四个函数名 |
| 代码 | 113 至 271 | 4 | 大小为 23、63、44 和 23 字节的函数体 |
| 数据 | 273 至 290 | 1 | 位于偏移 1024 的 `F\0D\0C\0B\0A\0` |

                                                                                                                                                                                                                                                              `grade`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `01 7f`:           `i32`هذا هو`bucket`, هناك نوع و لا اسم

控制流从构建上就是结构化.`block`.`loop`أو`if`结构──标签按嵌套深度索引──`br_table`通过索引标签列表的操作数执行间接分支――解码文件偏移 `0xa3`处 `grade`من المفتاح:

```text
0e                  br_table
0b                  11 labels follow
04 04 04 04 04 04   buckets 0 to 5: label 4, the outermost block, returns 0
03 02 01 00         buckets 6, 7, 8, 9: labels 3, 2, 1, 0
00                  bucket 10: label 0, shared with 9
04                  default label 4
```

كل علامة هي عمق. علامة 0 هي أعلى مستوى.`block`,其 `end`后的代码是 `i32.const 4`ثم استخدم`br 4`跳出结果块──表前的六条 `block`إرشادات 十一标签 五条表后面`br`إرشادات تشكل كل شيء`switch`، الاختبار سوف ترفض أي انفصال عن هذا الهيكل`disassemble_wasm()`بعمق، دعها تصفح`wasm-objdump`مثل التخفيض؛ انها تغطي من`unreachable`إلى`i64.extend32_s`كل رمز واحد من الكلمات التشغيلية، ووضع في اثنين من النوعين من البناء والحفاظ عليه`wasm-objdump -d`输出实现 77 条 命令全部一致。

المادة العادية التي تُلغي هي اسمها`wasm-objdump`仍会输出 `<grade>`، لأن الإصدار الإيصال سوف يتم رسم هذه الخيطات إلى مؤشر الوظيفة 2 ، كما هو الحال مع القارئ.`wat2wasm --debug-names`添加名为 `name`من المكونات المكونة من اسم المكونات والمعاملات والمعاملات المحلية.`{0: 'score', 1: 'bucket'}`,为函数 3 找到 `{0: 'values', 1: 'count', 2: 'sum', 3: 'i'}`.`wasm-strip`يمكن أن يُحذف مرة أخرى هذا المقطع.`.debug_*`تعريف الحلقة التثبيت`sourceMappingURL`تعريف الطرف يمكن أن يشير إلى خريطة المصدر، its列号表示二进制中的字节偏移──

工具生态 في عام 2026 حدث تغيير                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   `wasm-decompile`، على هذه الآلة المنزلية المزروعة المكونة تماماً تحتوي على ما تبقى من أدوات .`print`.`objdump`和 `demangle`◊ النسخة الثنائية_133 提供 `wasm-dis`│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │`rabin2 -I` تقرير `arch wasm`سوف يكون`grade`علامات البدء المحددة لتحول حجم النقل`0x8e`و`wasm-objdump`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0x8b` استخدامها في التسجيلات`get_local`.`set_local`و سوف ننتج عدد العلامات`brtable 11 4 4 ...`◊ ثلاثة أدوات قراءة الخطوط هي نفسها، ولكن الكتابة مختلفة، لذلك يجب أن تشرح المقارنة في الوقت الحالي الوصف من أي أدوات تنتج.`wasm-core-2`الصفحة هي المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة في المشاركة.

## ECMA-335 المعلومات هي قاعدة بيانات البرنامج نفسه

.NET 程序集是 PE 文件──`LedgerNet.dll``MZ`开头,包含名为 `.text`.`.rsrc`和 `.reloc`ثلاثة أجزاء، و سوف تصريحات نوع الآلة`0x14c`، لأن المُعدّل يُولد من قبل منصة لا علاقة لها بالرقم.`0x2008` ECMA-335 II.25.3.3   定义该位置的 72 个字节:

```text
48 00 00 00   Cb 72
02 00 05 00   MajorRuntimeVersion 2, MinorRuntimeVersion 5
78 21 00 00   MetaData RVA 0x2178
84 07 00 00   MetaData size 1924
01 00 00 00   Flags: COMIMAGE_FLAGS_ILONLY
05 00 00 06   EntryPointToken 0x06000005, MethodDef row 5, which is Main
```

الـ RVA `0x2178`处的元数据根以签名 `42 53 4a 42`أبدأ، أبدأ`BSJB`, بعد ذلك هو النسخة 1.1 و الخطوط `v4.0.30319`بعد ذلك كان هناك خمسة أفكار:`0x6c`处的 `#~`، و`#Strings`.`#US`.`#GUID`和 `#Blob`II.24.2  ينص على أن كل نوع من التيارات تحدث مرة واحدة`#~`-أجل ، أنا كذلك`HeapSizes`字节, هنا为零, لذلك كل字符串、GUID 和 blob 索引都占两字节; هناك 64 位 `Valid`掩码,标识存在表──其中十四位被置为1:

| 表 | 标识 | 行数 | 行大小 | 各行内容 |
|---|---|---|---|---|
| Module | 0x00 | 1 | 10 | 模块名及其 GUID |
| TypeRef | 0x01 | 21 | 6 | `System.Object`、`System.Console` 及另外 19 项 |
| TypeDef | 0x02 | 4 | 14 | `<Module>`、`Ledger` 及两个编译器辅助类型 |
| Field | 0x04 | 2 | 6 | `Labels` 和一个静态数组初始化器 |
| MethodDef | 0x06 | 6 | 14 | 五个方法和 `.cctor` |
| Param | 0x08 | 5 | 6 | `before`、`after`、`score`、`values`、`score` |
| MemberRef | 0x0a | 16 | 6 | 12 个特性构造函数及 `Main` 调用的 4 个方法 |
| CustomAttribute | 0x0c | 12 | 6 | 编译器和 SDK 添加的特性 |
| StandAloneSig | 0x11 | 3 | 2 | 三个局部变量签名 |
| Assembly、AssemblyRef、ClassLayout、FieldRva、NestedClass | | 1、2、1、1、1 | | 标识、引用、布局 |

行大小不存储在任何位置.II.22 为每列指定类,II.24.2.6 给出大小规则.`HeapSizes`占两字节或四字节. عندما يكون عدد الروابط أقل من 65536 行时,简单表索引占两字节.`CliAssembly`根据这些规则和行数计算十四表的行大小──样本中的系统.反思. 转储数据报告相同的大小和表偏移,测试据此证明计算正确──

III.1.9 定义令牌:高字节表示表,低三个字节表示从 1 开始的行号。`0x06000002`نعم`MethodDef`第2 行──           `0x2060`, اسمها`Grade`, توقيع البقع`00 01 08 08`:默认调用约定、一个参数、返回 `int32`、参数为 `int32` ‬`ParamList`إندرو`Param`第3 行 , اسمه يُطلق عليه`score` إعداد المعلومات المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية المعلوماتية`Grade(int score)` الـ " رفا "`0x2060`أساليب البدء في الشعر:

```text
13 30         flags 0x13: fat, init locals; size 3 dwords
02 00         MaxStack 2
2d 00 00 00   CodeSize 45
01 00 00 11   LocalVarSigTok 0x11000001
```

`StandAloneSig`第 1 行 حفظ`07 01 08`:`LOCAL_SIG`、 a محلية التغيرات`int32` تغيرات محلية لها نوع و لا اسم لها. ECMA-335 في قسم V من النموذج المتحول في الحفاظ على اسم تغيرات محلية. .NET SDK كتابتها في PDB.`DebugType`لا يوجد أي بناء، لذلك لا يوجد أي رسالة أو وثيقة تحمل اسم`bucket`.`PercentChange`则使用微型头部:首字节 `3a`لأجل`0x0e << 2 | 2`, يعبر عن 14 字节的方法体,没有局部变量,默认深为8──

`Grade`45 个代码字节使用第 3 部分的操作码表解码──`switch`          `0x45`، بعد ذلك واحد`u32`计数، و عدد相应 `int32`目標, they relative to表后的下一条指令计算:

```text
IL_0000: 02           ldarg.0
IL_0001: 1f 0a        ldc.i4.s 10
IL_0003: 5b           div
IL_0004: 0a           stloc.0
IL_0005: 06           ldloc.0
IL_0006: 1c           ldc.i4.6
IL_0007: 59           sub
IL_0008: 45 05 00 00 00 08 00 00 00 06 00 00 00 04 00 00 00 02 00 00 00 02 00 00 00
                      switch (IL_0029, IL_0027, IL_0025, IL_0023, IL_0023)
IL_0021: 2b 08        br.s IL_002b
IL_0023: 1a 2a        ldc.i4.4, ret
```

编译器在 `switch`قبل ذلك فقدت 6، لذلك فان 6 هو الهدف الأول.`disassemble_cil()`通过表解析并呈现令牌:`ldsfld Labels`.`call Grade`.`call System.Console::WriteLine`و من`#US`堆的 `ldstr ' '`          `MetaDump`, على أساس النموذج من ILSpy  داخلية المستخدمات المكتبة `System.Reflection.Metadata` كتابة المختصرة C# 程序── فإنه ينبع عدد الصفحات من كل جدول                                                                                                                                                                                                                                                   `System.Reflection.Emit.OpCodes`226 个字段──`compare_with_metadump()`جميع 246 إطار التحققات متوافقة.`prefix`占位項──本课表有 219 项,因为它包含III.2.2 中的`no.`، و إصدار تب تب أبدا لا يحتوي عليه

أدوات هذا النموذج تشمل:ILSpy 11.0(MIT  رخصة,2026-08-12  إصدار) من خلال Avalonia 桌面构建在macOS 上运行──`ilspycmd`11.1.0.9782 استخدام `-il`输出 IL, استخدام `-m 0x06000002`按令牌选择方法──dnSpyEx 6.6.0 继续维护 dnSpy,但只支持Windows──IL 反汇编器 `ildasm`以 NuGet 包提供, بدون إضافة SDK 内置──radar2 6.2.4 أيضاً`rabin2 -I` تقرير `arch cil`和 `class PE32`،`is`列出 `Ledger.Grade(int:score):int`، من بينها الجمعيات والنوعين يأخذون من Param 表及 توقيع جدول. في هذا التكوين لا يوجد CIL 反汇编器. النموذج باستخدام .NET SDK 8.0.205 .

## كل حاوية احتفظت بما

ستعمل على تخزين الحاويات`grade`وضعت في نفس الموقع`python3 code/main.py keeps`، سوف يكون على نموذج النشاط القارئ:

| 容器 | 函数体字节数 | 函数名 | 参数名 | 参数与返回类型 | 局部变量名 | 行号 | 控制流 |
|---|---|---|---|---|---|---|---|
| ELF 目标文件，clang -O0 | 118 | `.symtab` 中的 `grade` | 无 | 无 | 无 | 无，没有 `.debug_*` 节 | 5 次跳转及 1 次经过重定位表的间接跳转 |
| CPython 3.14 pyc | 96 | `co_qualname` | `score` | 无 | `bucket` | `co_linetable`，首行为 10 | 4 对比较及 `POP_JUMP_IF_FALSE` |
| JVM 类，`javac -g` | 50 | 常量池 | `LocalVariableTable` 中的 `score` | `(I)I` | 参数以外无其他名称 | `LineNumberTable`，6 行 | 1 条 `tableswitch` |
| WebAssembly | 63 | 导出节 | 仅在有名称节时存在 | `(i32) -> i32` | 仅在有名称节时存在 | 无 | 6 个嵌套块、1 条 `br_table`、4 条 `br` |
| .NET 程序集 | 45 | `MethodDef` | `Param` 中的 `score` | `static int32(int32)` | 无，只有 `StandAloneSig` 中的类型 | 没有 PDB 则无 | 1 条 `switch`、1 条 `br.s` |

هذا المخطط يفسر نتائج المناقشة التي ستراها.`int total(const int *, int)`مع غيدرا من أصل المعلومات`int total(long param_1, uint param_2)`بالمقارنة، لأن الكود الأصلي لم يحافظ على المعلومات في هذه الصفوف. يمكن الحفاظ على جميع الأسماء دون الحفاظ على النوع، وتحكمها في التحولات في النوع مع التغيرات في النسخة، وبالتالي فإن Python ضد المُعدلين سوف يفشل بسبب التغيرات في النسخة، ولكن يمكن إعادة تعيين الاسم مباشرة.`-g`时保留名称,并用一条命令表达 `switch`كانت المواد الغامضة في البناء تحتفظ بالهيكل، لذلك`wasm2wat`يمكن تحقيق عدم فقدان العودة، والشيء الوحيد الذي يفقد هو وصف النظام الأساسي.

يوضح هذا الجدول ما يمكن استخدام المُضيف، وكذلك ما هي المخرجات التي نسخت الحقائق المخزنة، ما هي النتيجة.

## 动手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats
python3 code/main.py
```

输出 هو تقرير JSON ⋅ لكل جهاز، فإنه يوفر نوعين من الصفحات والملفات`grade`عدد التعليمات والرموز التشغيلية في قائمة الحفاظ على الكمبيوتر، وكذلك ما إذا كان المفسح الحالي قادر على قراءتها.`javap`حالة التوافق. لكل نوع من المواد المكونة، فإنه يوفر الحجم، النوع، الوظيفة، الاسم، المحتوى، والحجم.`wasm-objdump`الموافقة مع مجموعة البرامج، فإنه يوفر CLI رأسها 流 表行数 方法和与 System.Reflection.`PATH`中找到的解释器列表──

按以下顺序阅读 `code/main.py`:

1. `Reader`حفظ الملامح والعدد الكامل`uleb()`和 `sleb()`هو كان 及 .NET blob 堆所需的 LEB128 读取器──
2. `read_pyc_header()`.`Unmarshaller`和 `PycFile`读取 بيك`parse_dis_text()`读取保存的 `dis`清单, لذلك عبر الإصدارات لا حاجة إلى تركيب أربعة مفسرات أثناء الاختبار.
3. `ClassFile`读取类文件،`disassemble_jvm()`解码其中的代码──`parse_javap_code()`和 `compare_with_javap()`المسؤول عن المراقبة النووية
4. `WasmModule`读取各节،`disassemble_wasm()`解码表达式并跟踪深度──`compare_with_wasm_objdump()`المسؤول عن المراقبة النووية
5. `CliAssembly`عبر PE 、CLI 头部、元数据根、流和表──`TABLE_SCHEMAS`مع`CODED_INDEXES`سوف يكون II.22 و II.24.2.6 تعبير`disassemble_cil()`-الوسيلة`compare_with_metadump()`النتائج النووية
6. `NativeObject`读取足以列出函数符号的ELF 内容,并采用第 33 课单作为文本──`what_each_keeps()`和 `figure_data()`构建比较结果──

هناك خمسة أمور أخرى`python3 code/main.py pyc FILE`.`class FILE`.`wasm FILE`和 `dll FILE`输出给定文件的结构及每个函数的清单──`python3 code/main.py compare`استخدام `PATH`中的每个解释器编译 `ledger.py`,并输出各自写入的内容──

## 实际使用

للحاوية التي تقوم ببناءها بنفسك، حسب الترتيب التالي استخدام القرآن.

1. 读取开头字节并识别格式──两个字节后接 `0d 0a`أظهار`ca fe ba be`تعبيرات`00 61 73 6d`تعبر عن المكونات`4d 5a`且数据目录 14 已设置则表示程序集──
2. 读取头部并记录它指示的生成工具版本──pyc حسب الظواهر الرقمية،类文件依主版本号,程序集依运行时和元数据版本字符串──
3. قبل استخدام أي خطة ضد المُعدّل، تحقق أولاً ما إذا كانت تدعم هذه الإصدارة.
4. على نفس الملفات تشغيل القارئ و أدواتها في هذا النموذج، التقارن التفاصيل. عدم الاتفاق يعني أن القارئ لديه عيوب أو أدوات تتغير. مهما كانت الحالة، يجب أولاً تحديد السبب، والتي تصبح مجرد دليل.
5. للفعل الذي يهمك ملء جدول الاحتفاظ بالمعلومات.
6. 完成以上步骤后再阅读反编译输出──将每个名称和类型标记为复制已保留的事实,或标记为推断──

`build_fixtures.sh`重新构建并保存输出، لأن التغييرات الصافية تعني تغيير النموذج.

## 交互实验

### تجربة أ:先读头部,再读代码对象

من`code`الآن افتتاح Python:

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats/code
python3 -q
```

运行:

```python
from main import *
pyc = load_pyc("ledger.cpython-311.pyc")
pyc.header.to_dict()
pyc.module.names
pyc.functions()["grade"].varnames
len(pyc.functions()["grade"].code)
```

أول مرة تدوينها قبل أن تكتبها`ledger.cpython-314.pyc`, تقارن اثنين `code`طولها.  Continue in your explanator for 3.11 文件尝试 `import marshal; marshal.loads(pyc.data[16:])`,阅读错误信息──

### تجربة ب: 常量池引用链

```python
cls = load_class("Ledger-g.class")
cls.constant(13)
cls.constant(14)
cls.describe_constant(13)
[row["text"] for row in jvm_listing(cls, "grade")]
```

调用 `describe_constant`قبل، قبل يبدأ`#13`تتبع إلى`#8`和 `#14`، أعيد التتبع`Utf8`条目──随后加载 `Ledger-gnone.class`, لـ 2 أجهزة`cls.method("grade").attribute_names()`.`Code`عدد المجموعات نفسها، لكن الخصائص مختلفة

### تجربة C: عمق مع علامات

```python
module = load_wasm("ledger.wasm")
[(row["depth"], row["text"]) for row in wasm_listing(module, "grade")]
module.function_name(2)
load_wasm("ledger-names.wasm").names["locals"][2]
```

找到 `br_table`行并读取深度──统计其后的 `end`صف، ستقوم بفتح كل صف و رقم العلامات في الجدول`ledger.wat`, العثور على العلامات 3 على التوافقات `block $six`.

### تجربة D: من令牌 إلى字节

```python
asm = load_assembly("LedgerNet.dll")
asm.method("Grade")
body = asm.method_body(asm.method("Grade")["RVA"])
body.fat, body.max_stack, body.code_size, hex(body.local_signature_token)
asm.token_text(0x11000001)
[row["text"] for row in cil_listing(asm, "GradeLabel")]
```

على أساس`.text`节头部,手动计算 RVA `0x2060`تحركات الملفات`asm.rva_to_offset(0x2060)`تقارنة. ثم تشارك`asm.row(0x08, 3)`, أجد اسم`score`存放的位置──

## 实践实验

للمقارنة مع الانضمام إلى اللغة المصدرة الخامسة، أو لزيادة الدرجة السادسة في التأثير.

要求:

- استخدام لغة المُعدّل المُثبت، كتابة وظيفة تتضمن حلقة وتغيرات محلية، على سبيل المثال ستعمل Kotlin 编译为类文件، أو ستعمل Rust 编译为 Wasm 模块──提交输出和基准清单,并在`build_fixtures.sh`-من فضلكم
- 让对应读器的每条指令都与基准一致――只在样本需要时添加操作码――
- 扩展 `what_each_keeps()`,加入新容器,并为所有容器增加一个事实: هل تحمل المكونات شكل غير طبيعي أو`try`منطقة
- 将新容器加入 `figure_data()`,并重新生成`site/figures-re-43.js`.
- 编写测试: عندما يزعم القارئ أن شيء ما قد تم الاحتفاظ به، ولكن لا يحدد كيفية الاحتفاظ به أو خصائصه أو وقته، فإن الاختبار يجب أن يفشل.

المعايير الوصول هي:`python3 code/main.py keeps`يظهر الخط الجديد، كل وحدة لديها دليل، وكل المقارنات الأساسية لا تزال متطابقة.

## 本课产物

本课包含 `outputs/skill-bytecode-and-managed-formats.md` استخدامها يمكن أن تحويل حاوية رمز الخط إلى تقرير الرأس ‬موافقة قائمة وظائف واحدة، فضلا عن وضع كل اسم ‬نوع والهيكل على قائمة الفعليات المحفوظة أو المفقودة‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- أربعة أرقام من الرأس: 3495、3531、3571 و3627، علامة على 3، ويحتوي على 8 字节哈希؛ الوقت
- كل رقم في الإصدارات الثالثة والعقب`2900 + 50n`قواعد للإصدار المحدد
- على الملفات التي كتبتها المفسّر الحالي، يعود المُعدّل المُعدّل إلى اسمها، والكمية، والحروف الكودية، والاسم المتغير، والصفوفة.`marshal.loads()`مثله
- أربعة وثائق تحتفظ بـ "مودول اسمها"`grade``('score', 'bucket')`、首行号 10, وملف`ledger.py`
- أربعة نسخ `grade.co_code`تمتلكون 80 ̊62 ̊70 و 96 ̊ ̊ ̊ ̊، وتحتوي على 31 ̊26 ̊26 و 35 ̊ ̊ ̊
- 3.11 清单含有 `POP_JUMP_FORWARD_IF_FALSE`3،12 و 3،13  يتضمن`RETURN_CONST`.3.14  يتضمن `LOAD_SMALL_INT`.`LOAD_FAST_BORROW`和 `NOT_TAKEN`
- 3.14 `-C -O`清单显示 `grade`هناك 13 محفظة، من بينها 5 تقع`BINARY_OP`后,自适应清单中出现 `COMPARE_OP_INT`
- 缺少 `0d 0a`الرأس، قطع الرأس، وكذلك لا كود الكائن المُتَأَخِّرُ`FormatError`
- فقط لتحديد وصفات المفسرة الحالية`dis`输出一致
- 类文件 主要版本为 65 أو 69,大小分别为 1581、1832、1404 和 1581,常量池计数分别为 82、94、79 和 82
- 常量 `#13`解析为 `Method Ledger.grade:(I)I`،`#47`解析为 `String F`
- JVM مضاد المجموعات في أربعة أنواع من البناء`javap -c -p`实现 108 条 命令全部一致
- pc 4 处 `tableswitch`长 36 字节, 下限为 6 上限为 10 默认目标为 48, 其余目标为 46、44、42、40、40
- ثلاث طرق لتحويل عدد الصفات، ولكن `grade`50 个代码字节保持一致
- `ifne`.`if_icmpge`和 `goto`هدف مقارنة بالفصل
- 错误魔数、尾随字节和未定义操作码都会触发 `FormatError`
- 七节                                                                                                                                                                                                                                                              `wasm-objdump -h`输出一致,带名称构建在 293 至 425 处添加 `name`حدد
- نوع`env.log`导入五个导出和偏移 1024 处的数据段均按 `ledger.wat`أن تكتب المحتوى
- كان المتوسط بين اثنين من المباني`wasm-objdump -d`实现 77 条 命令全部一致
- `grade`هناك 6 قطع من الحجر`br_table`含标签 `4 4 4 4 4 4 3 2 1 0 0`ويعرف العلامة 4 و1`i32`局部变量
- 没有名称节时, 函数名来自导出; 局部变量名只有在名称节存在时才有
- LEB128 `e4 00`100`7f`- - -`80 08`1024, طرق عرض النوع`wasm-objdump`واحد
- الخطأ السابق الإرشاد الخطأ الإصدار 2 و غير المعروفة التشغيل`FormatError`
- 程序集为 PE32،机器类型为`0x14c`,CLI 头部位于 RVA `0x2008`,运行时为2.5 ,标志为`ILONLY`, دخول`0x06000005`
- 元数据版本为 `v4.0.30319`، هناك خمسة أشكال، 14 أشكال من الأوراق والخطوط والخطوط التي تتفق مع تقرير الأساس
- .NET 读取器与系统.reflection.Metadata 的 246 项检查全部一致
- `Grade`         `score`,签名为`static int32(int32)`، سمينة الرأس`MaxStack`2،代码长 45 字节,并有一个无名的`int32`局部变量
- CIL `switch` هدف و `br.s`.`ldsfld`.`call`和 `ldstr`操作數均通过表和堆解析
- كود عمل CIL 操作码表 تغطي كل كود عمل في عملية التشغيل، فقط إضافة إضافية `no.`
- 信息保留表显示四种容器保留参数名,原生代码不保留;三种容器保留类型
- كل خط من النتائج في المظهر يظهر n 项比较中 n 项一致
- 交互图嵌入的数据与 `figure_data()`البيانات نفسها

## نموذج عدم الفعالية في بيئة الإنتاج

| 失效情况 | 不完善的工具报告什么 | 分析必须证明什么 |
|---|---|---|
| 反编译器比解释器旧 | `Unsupported opcode`、输出被标记为不完整，或声称存在混淆 | 魔数字、它对应的版本及工具文档中的版本上限 |
| 用错误解释器读取 pyc | `marshal.loads` 抛出异常或返回无效数据 | 我们的反序列化器可读取任意 3.9 至 3.15 文件的名称、常量和大小，指令来自匹配的 `dis` |
| 将专门化操作码误认为文件内容 | 清单中出现 `COMPARE_OP_INT` | pyc 保存非专门化形式，专门化在预热后的内存中发生 |
| 声称默认 javac 构建保留局部变量名 | 将 `var1`、`var2` 当作源码名称 | `LocalVariableTable` 只在启用 `-g` 时存在，两种情况下的 50 个代码字节相同 |
| 分支目标偏差一个指令长度 | JVM 清单中的跳转落在指令中间 | 偏移相对于分支操作码，并与 `javap` 核对 |
| 跳过 switch 填充 | `tableswitch` 的默认目标错误，分支错位 | 用零至三个字节将 pc 对齐到 4，五个分支总计 36 字节 |
| 以为 Wasm 名称已被剥离 | “没有符号” | 导出为每个导出函数命名，局部变量需要 `name` 节，`wasm-strip` 只移除该节 |
| 三种工具，三种拼写 | `get_local` 与 `local.get`，函数位置为 `0x8b` 或 `0x8e` | 字节相同，并明确用于比较的清单由什么工具生成 |
| 猜测表行大小 | 第一张表之后的每行都被读错 | 行大小由 `HeapSizes`、行数及编码索引宽度决定，并与基准相同 |
| 期望发布程序集保留局部变量名 | 将 `V_0` 当作源码名称 | 局部变量类型在 `StandAloneSig` 中，名称只在 PDB 中，而 `DebugType` none 不会生成它 |
| 读取器猜测未知操作码或类型码 | 一个看似合理的助记符 | 抛出含偏移的 `FormatError`，并在此处停止基准比较 |
| 基准来自另一构建 | 测试依靠过时文本通过 | `build_fixtures.sh` 记录每个工具版本，并写入 `versions.txt` 和 `sha256.txt` |

## 操作原则

أولا قراءة الرأس، تحديد أداة إنتاج التي تشير إليها. استخدام المحتويات غير المعروفة على رفض استمرار القراءة القراءة حاوية، وتقوم على نفس الملف على قائمة مع هذا النموذج الخاصة بها. ثم على كل اسم ونوع في المخرجات ضد التكوين، تشير إلى أنه مخزن مخزن، أو أداة استنتاج.

## 延伸阅读

- [PEP 552：确定性 pyc](https://peps.python.org/pep-0552/)
- [CPython `Include/internal/pycore_magic_number.h`](https://github.com/python/cpython/blob/main/Include/internal/pycore_magic_number.h)
- [Python `marshal` 模块文档](https://docs.python.org/3/library/marshal.html)
- [CPython `Python/marshal.c`](https://github.com/python/cpython/blob/main/Python/marshal.c)
- [Python 3.14 `dis` 模块文档](https://docs.python.org/3.14/library/dis.html)
- [PEP 659：专门化自适应解释器](https://peps.python.org/pep-0659/)
- [PEP 626：供调试及其他工具使用的精确行号](https://peps.python.org/pep-0626/)
- [PEP 790：Python 3.15 发布计划](https://peps.python.org/pep-0790/)
- [PyPI 上的 uncompyle6](https://pypi.org/project/uncompyle6/).[PyPI 上的 decompyle3](https://pypi.org/project/decompyle3/).[PyPI 上的 xdis](https://pypi.org/project/xdis/).[GitHub 上的 pycdc](https://github.com/zrax/pycdc).[GitHub 上的 PyLingual](https://github.com/syssec-utd/pylingual)
- [Java 虚拟机规范，Java SE 25，第 4 章：类文件格式](https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-4.html)
- [Java 虚拟机规范，Java SE 25，第 6 章：Java 虚拟机指令集](https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-6.html)
- [javac 手册，Java SE 25](https://docs.oracle.com/en/java/javase/25/docs/specs/man/javac.html)和 [javap 手册](https://docs.oracle.com/en/java/javase/25/docs/specs/man/javap.html)
- [CFR](https://www.benf.org/other/cfr/).[Procyon](https://github.com/mstrobel/procyon).[Vineflower](https://github.com/Vineflower/vineflower).[intellij-community 中的 Fernflower](https://github.com/JetBrains/intellij-community/tree/master/plugins/java-decompiler/engine).[JADX](https://github.com/skylot/jadx)
- [Harrand、Soto-Valero、Monperrus、Baudry，《Java 反编译器的多样性及其在元反编译中的应用》（JSS 2020）](https://arxiv.org/abs/2005.11315)
- [ECMA-335，公共语言基础结构，第 6 版（2012 年 6 月）](https://ecma-international.org/publications-and-standards/standards/ecma-335/)
- [PE 格式，Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [System.Reflection.Metadata.Ecma335.TableIndex](https://learn.microsoft.com/en-us/dotnet/api/system.reflection.metadata.ecma335.tableindex)
- [GitHub 上的 ILSpy](https://github.com/icsharpcode/ILSpy).[NuGet 上的 ilspycmd](https://www.nuget.org/packages/ilspycmd).[GitHub 上的 dnSpyEx](https://github.com/dnSpyEx/dnSpy)
- [WebAssembly 核心规范：二进制格式，模块](https://webassembly.github.io/spec/core/binary/modules.html)和 [值](https://webassembly.github.io/spec/core/binary/values.html)
- [WebAssembly 核心规范：自定义节（名称节）](https://webassembly.github.io/spec/core/appendix/custom.html)
- [WebAssembly tool-conventions：调试](https://github.com/WebAssembly/tool-conventions/blob/main/Debugging.md)
- [wabt 1.0.42 发布说明](https://github.com/WebAssembly/wabt/releases/tag/1.0.42).[wasm-tools](https://github.com/bytecodealliance/wasm-tools).[Binaryen](https://github.com/WebAssembly/binaryen).[ghidra-wasm-plugin](https://github.com/nneonneo/ghidra-wasm-plugin)
- [GitHub 上的 radare2](https://github.com/radareorg/radare2), هذا الدروس استخدام من المصدر الإصدار 6.2.4
