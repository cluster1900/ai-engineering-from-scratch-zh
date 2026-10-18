# 程序解剖: from零编写 ELF 读取器

> المخططات بعد التدوين هي مجموعة من المخططات المتعلقة بالترابط.

**Type:** Build
**Languages:** Python（标准库）、C（仅用于测试夹具）
**Prerequisites:** Phase 0 · 01（开发环境），已安装 clang；Python 3.10 或更高版本；十六进制运算
**Time:** ~120 分钟

## 學习目标

- شرح هذا المسلسل للقواعد المفروضة على كل هدف تحليل، فضلا عن الحد الأربع من 17 المادة 1201 (f)
- استخدام `struct.unpack`读取 ELF 文件头、节头表和两个字符串表──
- 根据 gABI 与 x86-64 psABI 中的名称解码 `.symtab`条目与 `.rela`-تاريخ
- 返回指定函数的准确字节,并将每个文件偏移映射到其属结构──
- 读取程序头,通过 `PT_LOAD`سوف يتم تحويل المواقع إلى الملفات
- 读取 Mach-O 目标文件的加载命令,并指出每个命令对应的ELF概念──

## 开始之前:授权与法律

المادة 32 إلى 36 كل هدف من الدروس هو كتابة نفسك ومعدل البرنامج.`code/fixtures/ledger.c`، والتي تحتوي على أربعة أوراق قصيرة من C  وظيفة.

ويتمثل السبب في هذا القاعدة في أن القانون سوف ينظر إلى النسخة النسخة النسخة في حالة *Sega Enterprises Ltd. v. Accolade, Inc.*، 977 F.2d 1510 (9th Cir. 1992) ة، قامت المحكمة بتصديق أن النسخة الوسطى التي تنشأ في عملية النسخة النسخة النسخة تنتمي إلى النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخة النسخ

الحالة الثانية هي * Sony Computer Entertainment, Inc. v. Connectix Corp.*، 203 F.3d 596 (9th Cir. 2000) Connectix في تطوير المعدات المتنسخة عندما نسخ نظام البيولوجيا البلايستيشن BIOS، وقالت المحكمة أن هذه النسخ تنتمي إلى استخدام معقول  كلتا الحالتين حماية السلوك البحثي، ولكن لا يحماية النسخة في المنتج النهائي 

يحدد قانون إعداد الحدود. 17 المادة 1201 ((f) يسمح بالتحايل على السيطرة على الوصول من قبل الأشخاص الذين يحصلون على حقوق استخدام برنامج كمبيوتر قانوني، ولكن الغرض الوحيد يجب أن يكون التعرف على وتحليل العناصر اللازمة لتنفيذ التفاعل بين برنامج كمبيوتر وبرامج أخرى التي تم إنشاؤها بشكل مستقل.

في الاتحاد الأوروبي،التوجيه 2009/24/EC 第 5 3) 条涉及研究── يملكون حق استخدام نسخة واحدة من هذه المعلومات يمكن أن يلاحظوا عمل إجراءات البحث أو الاختبار، لتحديد الأفكار والمنظمات الخلفية لبرنامج واحد.

المادة 6 تسمح بتفاعل المعلومات اللازمة لتحقيق إنشاء مستقل من برامج الكمبيوتر، ولا حاجة إلى ترخيص حقوق الإنسان، ويمكن القيام بها في إعادة التنظيم.

| 来源 | 允许的行为 | 条件 |
|---|---|---|
| 17 U.S.C. 1201(f) | 绕过访问控制以分析程序 | 合法副本、互操作目的、信息不易获得、不构成侵权 |
| Directive 2009/24/EC 第 5(3) 条 | 观察、研究和测试运行中的程序 | 有权使用副本，行为处于正常加载和运行范围内 |
| Directive 2009/24/EC 第 6 条 | 反编译 | 被许可人、互操作目的、信息不易获得、仅限必要部分 |
| *Sega v. Accolade* | 构成合理使用的反汇编 | 获取思想和功能要素的唯一途径，且理由正当 |
| *Sony v. Connectix* | 逆向工程过程中的中间复制 | 最终产品不侵权 |

هذه المعلومات تأتي من المواد القانونية والحكمات، لا تشكل نصيحة قانونية. عندما تواجه بعد ذلك لا تنتمي إلى هدفك، يجب عليك أولا الحصول على الاختيار المكتوب لإعادة فتح الملف، و سوف يتم حفظ الاختيار مع الأدلة.

## 问题

أنتَ مُعدّل`ledger.c`, و تم إنجاز الملف المستهدف`llvm-objdump -t` الخروج`percent_change`        `0000000000000000`, لـ (بـ)`0000000000000010`◊ من بين هذه 1768 字节 الملفات أي 16 字节 تنتمي إلى هذه الوظيفة؟`0x36`处显示 `R_X86_64_PC32 .rodata+0x10`وكل أربعة أجزاء من الموقع في الملف هي صفر. ماذا ستصبح في النهاية؟`0x14`بدأت، لماذا يزيد العدد؟`0x10`- ماذا ؟

استخدام حقيقي `inspect_binary_layout`رد على الموضة، ولكن هذه الأداة فقط على لينكس x64`REA_PWNTOOLS_PYTHON`استخدام أدوات 4.15.0... هذا ماك على لا وجود له.`address_to_file_offset`需要 Ghidra 会话,以及 SHA-256 匹配的原始文件完整字节副本──`inspect_artifact`حسب الطرق والمحتوى، لا يمكن أن يقرأ المحتويات في الحاوية، ولكن لا يمكن أن يقرأ جدول داخل الملف المستهدف.`struct.unpack`و 0 خارجية تعتمد على الجهاز الاكتتابي الخاص بك.`llvm-objdump`文本 للمقارنة

```figure
elf-byte-map
```

## الملفات هي الملفات التي تظهر في الملفات الأخرى

نظام V GABI باب 4 الصورة 4-1 تظهر منظرين من نفس الملف. الرؤية الارتباطية تحتوي على ELF  عنوان الملف. الرؤية المزودة للبرنامج. الرؤية المزودة للبرنامج. الرؤية التنفيذية تحتوي على ELF  عنوان الملف. الرؤية المزودة للبرنامج. الرؤية التنفيذية تحتوي على ELF  عنوان الملف. الرؤية المزودة للبرنامج. الرؤية التنفيذية تحتوي على ELF  عنوان الملف. الرؤية المزودة للبرنامج. الرؤية المزودة للبرنامج. الرؤية التنفيذية تحتوي على ELF  عنوان الملف. الرؤية المزودة للبرنامج. الرؤية التنفيذية تحتوي على ELF  عنوان الملف. الرؤية المزودة للبرنامج. الرؤية التنفيذية تحتوي على الرؤية المزودة المزودة للبرنامج.

غابي أيضاً تحدد نوع العلامات، وعلنت أن نفسها لا تستخدم المجال`Elf64_Addr`和 `Elf64_Off`كل واحد 8 字节`Elf64_Half`占 2 字节،`Elf64_Word`占 4 字节،`Elf64_Xword`占 8 字节──x86-64 psABI 第4.1.1 节要求使用 `ELFCLASS64`.`ELFDATA2LSB`،`e_machine`لأجل`EM_X86_64`(62) ،`e_flags`为 △小端字节序加上固定宽度 يعني: استخدام带 `<`السابق `struct.unpack`, مرة واحدة تدعو على قادرة على قراءة سجل

`ledger-x86_64-O1.o`字节:

```text
00000000: 7f45 4c46 0201 0100 0000 0000 0000 0000  .ELF............
00000010: 0100 3e00 0100 0000 0000 0000 0000 0000  ..>.............
00000020: 0000 0000 0000 0000 2804 0000 0000 0000  ........(.......
00000030: 0000 0000 4000 0000 0000 4000 0b00 0100  ....@.....@.....
```

لمشاهدة غابي SELF Header الصفحة`e_ident`占 16 字节,包含 `7f 45 4c 46`(魔数,即识别文件格式的固定字节) 类别 2(64位) DATA编码 1(小端) 版本 1、OS ABI 0(System V)及填充。

بعد ذلك`e_type``0x0001` عرض`ET_REL`, تعود إلى تحديد المستهدف`e_machine``0x003e`62، أي`EM_X86_64` الملف المستهدف لا يوجد نقطة دخول لذلك`e_entry`لم يكن هناك أي خطة، لذلك`e_phoff`-من أجل`e_shoff`لأجل`0x428`, يتحرك الملفات من المخططات.`e_ehsize` `0x40`.`e_phentsize`0`e_phnum`0`e_shentsize` `0x40`.`e_shnum` `0x0b`(11 个节头) ، و`e_shstrndx` `0x0001`.

读取器用一次调用解析 هذه الصفحة:

```python
fields = struct.unpack_from("<HHIQQQIHHHHHH", data, 16)
```

字符串对应从左到右读取的 gABI图:两个半字、一个字、三个 8字节值、一个字、六个半字──读取器拒绝魔数、类别或字节序不符的文件,也拒绝不符合 64 和 56`e_shentsize`أو`e_phentsize`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                                                                          

## 节头与两个字符串表

كل فصل هو واحد 64 字节 `Elf64_Shdr`(مؤشرات الرسومات 4-8):`sh_name`.`sh_type`.`sh_flags`.`sh_addr`.`sh_offset`.`sh_size`.`sh_link`.`sh_info`.`sh_addralign`.`sh_entsize`✿ ✿ ✿ ✿ ✿ ✿`<IIQQQQIIQQ`.`sh_name`هو دليل`e_shstrndx`في المقطع الاولى، يبدأ في المقطع الاولى.`e_shstrndx`و من أجل ذلك سيتم تسمية القسم`.strtab`، لذلك نفس المخططات في نفس الوقت الاحتفاظ بالاسم والرمز

读取器输出 -O1 目标文件的 11 节目:

```text
Idx Name             Type         Flags   Offset     Size       Addr Link Info Align
  0                  NULL                    0x0      0x0        0x0    0    0     0
  1 .strtab          STRTAB                0x368     0xbe        0x0    0    0     1
  2 .text            PROGBITS     AX        0x40     0x9f        0x0    0    0    16
  3 .rela.text       RELA         I        0x2a8     0x48        0x0   10    2     8
  4 .rodata          PROGBITS     A         0xe0     0x50        0x0    0    0     8
  5 .rela.rodata     RELA         I        0x2f0     0x78        0x0   10    4     8
  6 .rodata.str1.1   PROGBITS     AMS      0x130      0xa        0x0    0    0     1
  7 .comment         PROGBITS     MS       0x13a     0x2f        0x0    0    0     1
  8 .note.GNU-stack  PROGBITS              0x169      0x0        0x0    0    0     1
  9 .llvm_addrsig    LLVM_ADDRSIG E        0x368      0x0        0x0   10    0     1
 10 .symtab          SYMTAB                0x170    0x138        0x0    1    9     8
```

المرجع 0 هو الحفاظ على الفضاء`.text`في الملفات المتجهة`0x40`处存放 159 字节代码,紧接文件头,标志为`A`(توزيع في الـ"内存" و`X`(可执行)`.rodata`存放 80 字节 فقط قراءة البيانات`.rodata.str1.1`存放五个标签符串 `F\0D\0C\0B\0A\0`,共 10 字节,标志为 `M`(可合并) و `S`(字符串)

`.comment`存放 47 字节的编译器标记 `\0Apple clang version 17.0.0 (clang-1700.6.3.2)\0`.`.llvm_addrsig`نوع من`0x6fff4c03`، في غابي الحفاظ على النظام التشغيلي نوع خاص`SHT_LOOS`إلى`SHT_HIOS`范围内,LLVM 的 `ELF.h`أعطيتها اسمها.`E`لأجل`SHF_EXCLUDE`، لذلك الجهاز التواصل سيتركها

`sh_link`和 `sh_info`两列是表之间的指针──`.rela.text``sh_info`2-`sh_link`10، أنه يصلح القسم الثاني، ويحصل على رمز من القسم العاشر.`.symtab``sh_link`为 1,指向符号名称字符串表;`sh_info`9، يعبر عن أول مؤشر لرمز غير محلي`sh_addr`مدونة صفر، لأن الملف المستهدف لا يزال لا يوجد عنوان، يتم توزيع عنوان من قبل المتصلين.

قواعد gABI: تمكن القارئ من رسم الملفات الكاملة: 节连续且不重叠,文件可以包含未使用空间── القارئ يتحرك بشكل متأثر إلى كل ترتيب هيكل,并填入空隙:

```text
     0x0 +64    header   ELF header
    0x40 +159   section  .text
    0xdf +1     gap      inactive space
    0xe0 +80    section  .rodata
   0x130 +10    section  .rodata.str1.1
   0x13a +47    section  .comment
   0x169 +7     gap      inactive space
   0x170 +312   section  .symtab
   0x2a8 +72    section  .rela.text
   0x2f0 +120   section  .rela.rodata
   0x368 +190   section  .strtab
   0x426 +2     gap      inactive space
   0x428 +704   table    section header table
```

ثلاث فجوات في 10 قصص، كل ذلك من أجل التوافق`.rodata``sh_addralign`8، لذلك`0xe0`بدلاً من ذلك`0xdf`بدأت`.symtab`وكل ما يتطلب من ذلك هو 8`.comment`بعد ذلك هناك 7 خرائط غير مستخدمة.

`SHT_NOBITS`类型节完全 لا تشكل فيديو字节، لذلك تخطي المخططات فوقها.`.bss`ينتمي إلى هذا الفئة ، إذا كان القارئ هناك`sh_size`,就可能读到文件末尾之外

## 符号:绑定、类型、属节、值与大小

`Elf64_Sym`占 24 字节 ((GABI 图 4-18):`st_name`.`st_info`.`st_other`.`st_shndx`.`st_value`.`st_size`, فارماً`<IBBHQQ`.`st_info`打包了两个字段:高四位为绑定属性,低四位为类型――gABI 定义的绑定为 `STB_LOCAL`0`STB_GLOBAL`1`STB_WEAK`2، نوع`STT_NOTYPE`0`STT_OBJECT`1`STT_FUNC`2`STT_SECTION`3`STT_FILE`4`st_other`من المحتمل أن تكون هناك كل شيء هنا`STV_DEFAULT`0:

```text
Idx            Value   Size Bind   Type    Section          Name
  0              0x0      0 LOCAL  NOTYPE  *UND*
  1              0x0      0 LOCAL  FILE    *ABS*            ledger.c
  2              0x0     20 LOCAL  OBJECT  .rodata          labels.rel
  3              0x0      0 LOCAL  SECTION .rodata          .rodata
  4              0x2      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.1
  5              0x4      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.2
  6              0x6      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.3
  7              0x8      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.4
  8              0x0      0 LOCAL  SECTION .rodata.str1.1   .rodata.str1.1
  9              0x0     16 GLOBAL FUNC    .text            percent_change
 10             0x10     46 GLOBAL FUNC    .text            grade
 11             0x40     31 GLOBAL FUNC    .text            total
 12             0x60     63 GLOBAL FUNC    .text            grade_label
```

索引 0 是保留的未定义符号──`st_shndx`指定定义符号的节, هناك ثلاثة قيمة احتفظية أخرى:`SHN_UNDEF`0 ‬ للاستخدام في الملفات`SHN_ABS` `0xfff1`، و`SHN_COMMON` `0xfff2` 节符号名称为空,因此 `llvm-objdump`会打印节本身的名称,读取器也如此处理──gABI 规定所有具有STB_LOCAL 绑定的符号都排在弱符号和全局符号之前,这里体现为前九行,也正因此 `.symtab`في`sh_info`لقد سجلت 9

في الملفات المستهدفة القابلة لتحديد المواقع`sh_addr`لأجل صفر`st_value`هو التحول في جزء رمزي.`sh_offset + st_value - sh_addr`,长度为 `st_size`:

```python
section = elf.sections[symbol.st_shndx]
file_offset = section.sh_offset + (symbol.st_value - section.sh_addr)
code = elf.data[file_offset : file_offset + symbol.st_size]
```

على`percent_change`وبالنسبة لي، فإنّها`0x40 + 0`, 16 个字节为 `85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3`◊ الكبيرة هي نفس الموقف المُهم`grade`في`.text`       `0x3e`处结束──紧随其后的两个字节 `66 90`هو محرر المترجم`nop`أوامر التشغيل، لجعلها`total`من`0x40`هذا هو 16 حرف الحدود البداية.`st_size`كشرط وقف المُعدّل، فإنّه سيتمّ حجب هذه الصفحات قبل أن يتمّ إعادة بناءها.

## 重定位:零字节 يعني ماذا

`Elf64_Rela`占 24 字节 ((GABI 图 4-23):`r_offset`.`r_info`و مع علامات`r_addend`, فارماً`<QQq` إعادة تحديد الموقع سجل تصفير الارتباطات تحتاج إلى إصلاح الموقع والطريقة الحسابية.`r_info`:`ELF64_R_SYM(i)`لأجل`i >> 32`،`ELF64_R_TYPE(i)`لأجل`i & 0xffffffff`في ملفات التعيين القابل للعودة`r_offset`نعم`sh_info`تغيرات في الحلقة المحددة.`S`هو قيمة`A`نعم،`P`هو مكان تم تصحيحه`L`هو عملية سلسلة الصفحة`R_X86_64_64`لأجل`S + A`،`R_X86_64_PC32`لأجل`S + A - P`،`R_X86_64_PLT32`لأجل`L + A - P`.

-أو1  المستهدف الملفات لديها 8 ريكورات:

```text
  .rela.text       0x36 R_X86_64_PC32          .rodata+0x10
  .rela.text       0x84 R_X86_64_PC32          .rodata+0x24
  .rela.text       0x93 R_X86_64_PC32          .rodata-0x4
  .rela.rodata      0x0 R_X86_64_PC32          .rodata.str1.1
  .rela.rodata      0x4 R_X86_64_PC32          .L.str.1+0x4
  .rela.rodata      0x8 R_X86_64_PC32          .L.str.2+0x8
  .rela.rodata      0xc R_X86_64_PC32          .L.str.3+0xc
  .rela.rodata     0x10 R_X86_64_PC32          .L.str.4+0x10
```

拆解第一条记录──偏移 `0x36`位于 `grade`في، والآخرين`0x10`إلى`0x3e`.`0x33`الوصية هي`48 8d 0d 00 00 00 00`, أي حساب RIP مقارنة بالمنطقة`lea`,其四字节位移位于 `0x36`سيتم نقل المعدل إلى عنوان المواصفات التالية`0x3a`أعلى

编译器希望结果为 `.rodata + 0x14`هناك 5 قيمة 32 نقطة`1, 2, 3, 4, 4`نقطة الظهور. لذلك يجب أن تكون قيمة الاحتفاظ`(.rodata + 0x14) - 0x3a`‬ ‬ ‬`S + A - P`في`P = 0x36`-حصل على`.rodata + A - 0x36`令两者相等可得 `A = 0x14 - 4 = 0x10`العدد المضمن هو القطع الأربعة بين التركيز المطلوب والتركيز المطلوب.

هذا هو المظهر الذي أظهر فيه الصوت`grade`中 `switch`الطريقة التى تُعدّدها`0x66666667`和两次移位计算 `score / 10`, إعادة تقليل 6 、 مقارنة مع 4 , ثم إدراج هذا المظهر.`.rodata`إضافة إلى رقم إضافي، فقط نفس المصدر من البرمجيات 64`l_switch.table.grade` 2 条记录位于`grade_label``0x84`, إندور`.rodata + 0x28`处第二张由 8 字节值组成的表──第三条位于 `0x93`, إندور`.rodata + 0x0`,即 `labels.rel`من الظهور

五条 `.rela.rodata` سجل ملء `labels.rel`كل شيء في مكان ما`4i`, إضافة العدد أيضا`4i`، لذلك`S + A - P`化简为字符串地址减去表基址。`grade_label`استخدام`movslq`读取条目,再加回表基址,就得到指针.`.rodata.str1.1`, اضف العدد لـ 0 , لأن الخط`F`من الفصل الأول من القسم بدأ`.L.str.1`إلى`.L.str.4`، هم مُعدّلون`D`.`C`.`B`.`A`تسمية الموقع

نفس المصدر يعدّل ثلاثة أشكال مختلفة في ثلاث درجات تحسينات:

| 构建 | `labels` 的位置 | `grade` 如何选择 | `grade_label` 如何到达 `grade` |
|---|---|---|---|
| -O0 | `.data`，五个 8 字节指针，五条 `R_X86_64_64` 记录 | `.rodata` 中的跳转表：五条指向 `.text` 的 `R_X86_64_PC32` 记录 | 带有 `R_X86_64_PLT32 grade-0x4` 的调用 |
| -O1 | `.rodata` 中的 `labels.rel`，五个 32 位相对条目 | `.rodata+0x14` 处的值表，一条 `R_X86_64_PC32` | 已内联，没有调用 |
| -O2 | 与 -O1 相同 | 与 -O1 相同 | 已内联，`total` 增长到 140 字节 |

في -0 أسفل،`switch`نعم , حقاً , لقد قمت بتحويل`.text`وسط`+0x91`.`+0x8c`.`+0x87`.`+0x82`和 `+0x86`على`grade`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `-0x4`إضافة إلى ذلك`lea`في -O1، أكتشف المحفز أن كل جزء يعود إلى الكمية العادية، فهي تستخدم النتائج على النحو المتبادل.

## 程序头: 卡载器的视图

لا يوجد برنامج لإعادة تحديد الملف المستهدف، لذلك`e_phnum`ويمكن تنفيذ الملفات ومشاركة الملفات المستهدفة إذا كان يحتوي على الرأس البرنامج، فإن المُحمّل يقرأ فقط هذه المعلومات.`Elf64_Phdr`占 56 字节 ((GABI 图 5-1):`p_type`.`p_flags`.`p_offset`.`p_vaddr`.`p_paddr`.`p_filesz`.`p_memsz`.`p_align`, فارماً`<IIQQQQQQ`✿ غابي 为 `PT_LOAD`条目规定三条规则:按 `p_vaddr`升序排列`p_memsz`كبيراً`p_filesz`جزء من استخدام صفر ملء`p_vaddr`مع`p_offset`على`p_align`取模同余──

كل هدف من هذه المسلسلة هو البرنامج الذي تقوم ببناءه بنفسك، بينما لا يمكن أن يكون على هذا ماك`ledger.o`生成 لينكس قابل لتنفيذ الملفات`tiny-x86_64`من`code/fixtures/build_tiny_elf.py`، انها تستخدم`struct.pack`كتابة 736 字节. الملفات تحتوي على ELF 文件头,两个程序头, 36 字节.`_start`、3 字节 `.rodata`、符号表和六节头──`_start`إلى المقال 1 写入 `ok\n`ثم باستخدام الحالة 42  الخروج. يمكن أن تعمل على لينكس x86-64 ؛ هنا، انها تغطي برنامج المعالجة الوسيطة.

```text
Program headers:
  PT_LOAD          r-x offset=0x0 vaddr=0x400000 filesz=0x2e0 memsz=0x2e0 align=0x1000
  PT_GNU_STACK     rw- offset=0x0 vaddr=0x0 filesz=0x0 memsz=0x0 align=0x10

entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

الاختيار الوحيد`PT_LOAD`ستقوم بتصوير الملف بأكمله`0x400000`△读取器找到包含某地址的 `PT_LOAD`,再计算 `p_offset + (address - p_vaddr)`,即可将地址映射为文件偏移──入口点的计算是 `0 + (0x4000b0 - 0x400000) = 0xb0`، صحيح`.text`من الظهور

هذا هو الواقع`address_to_file_offset`背后的计算──对 吉德拉 目标,该工具返回 `{address, file_offset}`؛ هوبر  يوفر فانك ستعود `provider_file_offset`和 `image_base_file_offset` تحتاج الأدوات إلى نسخة كاملة من الملف الأصلي، و يجب أن تكون نسخة SHA-256 متوافقة مع الهدف.`inspect_binary_layout`هناك أيضاً في الملفة كلمة تستحق الاعتبار:  لا يوجد عنوان للاتصالات في الوقت الذي يتم فيه تشغيله.

ويشرح أيضاً لماذا لا يزال الملفات القابلة للانفاذ يمكن تنفيذها بعد إزالة المعلومات.`e_shoff`变为零── عبر القسم الأدوات لن ترى أي محتوى، والحميل أبدا لا يعتمد على هذه القسمات──

## معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى معنى

Apple لم تنشر ماش-أو من المخطوطات النسخة النصية.`EXTERNAL_HEADERS/mach-o/loader.h`.`nlist.h`和 `reloc.h`具 `ledger-arm64-O1.o`من同一个`ledger.c`استخدام `clang -target arm64-apple-macos -O1 -fno-asynchronous-unwind-tables -c`بناء

`mach_header_64`占 32 字节:`magic`.`cputype`.`cpusubtype`.`filetype`.`ncmds`.`sizeofcmds`.`flags`.`reserved`۞ 魔数为 `0xfeedfacf`,即 `MH_MAGIC_64`.`cputype`لأجل`0x0100000c`,即 `CPU_TYPE_ARM64`.`filetype`- 1`MH_OBJECT`.`ncmds`5،`sizeofcmds`616: تحميل الأوامر تشتمل على 616 字节 بعد الصفحة`{cmd, cmdsize}`بدأ`0x2000`لأجل`MH_SUBSECTIONS_VIA_SYMBOLS`.

```text
Load commands:
  0 LC_SEGMENT_64                cmdsize=472 at 0x20
  1 LC_BUILD_VERSION             cmdsize=24 at 0x1f8
  2 LC_LINKER_OPTIMIZATION_HINT  cmdsize=16 at 0x210
  3 LC_SYMTAB                    cmdsize=24 at 0x220
  4 LC_DYSYMTAB                  cmdsize=80 at 0x238
```

`LC_SEGMENT_64`(0x19)对应 ELF 的两张表――其`segment_command_64`包含 `segname`.`vmaddr`.`vmsize`.`fileoff`.`filesize`.`maxprot`.`initprot`.`nsects`和 `flags`نفس الأوامر`nsects`条 `section_64`记录,每条 80 字节。`loader.h`حول`MH_OBJECT`تعبيرات، هذه المقاطع تقع في                                                                                                                                                                                                                                                          `fileoff`648`filesize`456، يتضمن خمسة أجزاء

```text
  Idx Section                    Addr   Size Offset Reloff Nreloc Type
    1 __TEXT,__text               0x0   0xd0    648   1104      6 S_REGULAR
    2 __DATA,__const             0xd0   0x28    856   1152      5 S_REGULAR
    3 __TEXT,__cstring           0xf8    0xa    896      0      0 S_CSTRING_LITERALS
    4 __TEXT,__const            0x108   0x40    912      0      0 S_REGULAR
    5 __LD,__compact_unwind     0x148   0x80    976   1192      4 S_REGULAR
```

كلّ جزء من ذلك`segname`إدّينغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغغ`__const`لا يوجد شيء مثله`__DATA,__const`، الآخر هو`__TEXT,__const`重定位通过 `reloff`和 `nreloc`按节存放;ELF 则为每一个目标节设置单独 `.rela.X`-الـ (إي)

كلّ مرة`relocation_info`يحتوي على 8 حرفات، أولاً هو لديه علامات`r_address`, ثم في 32 بـقطعة ,打包为 `r_symbolnum`(24 位)`r_pcrel`(1 位)`r_length`(2 位)`r_extern`(1 位) و `r_type`(4 位) 六条`__text`السجل هو ثلاثة`ARM64_RELOC_PAGE21`مع`ARM64_RELOC_PAGEOFF12`, في كل مرة اقتباس على التجاوب مع الـ`adrp`加 `add`实现了 x86-64 `lea`تأثير، لذلك كل مرجع تحتاج إلى اثنين من السجلات.`__DATA,__const`记录为 `ARM64_RELOC_UNSIGNED`،`r_length`3، لذلك كل إصلاح واحد 8 字节 مطلق الإشارة

في -O1 أسفل، الأسلحة64  بنية `labels`الحفاظ على المؤشر العادي، بينما x86-64  المكونات تولد جدول نسبي

`LC_SYMTAB`0x2) يحتوي`symoff`1240`nsyms`17`stroff`1512`strsize`176,1512 + 176 等于文件大小 1688──每一个`nlist_64`占 16 字节:`n_strx`.`n_type`.`n_sect`.`n_desc`.`n_value`.`n_type`هو منطقة`N_TYPE`(掩码)`0x0e`) =`N_SECT`(`0xe`),表示符号定义在序号为 `n_sect`في الحلقة الأولى من 1 开始`N_EXT`(`0x01`) تُعَرّفُ كَوْنَةَ الخارجِ

`nlist_64`没有大小字段──为获取 `_percent_change`يقع في نفس القسم`0x18``_grade`                                                                                                                                                                                                                                                              `_`, لذلك ,`_percent_change`.

`LC_DYSYMTAB`0xb) سجلت مع ELF`sh_info`قواعد الأولوية للمناطق:`ilocalsym`0`nlocalsym`13`iextdefsym`13`nextdefsym`4`LC_BUILD_VERSION`0x32) 以打包的`XXXX.YY.ZZ`整数记录 `platform`1(macOS)`minos`26.0 و`sdk`26.2  لأن هذا الأمر، يجب أن يتم تقديم arm64   具 بأصدار كتابة؛ في استخدام SDK آخر على Mac على بناء سوف تنتج وثائق مختلفة‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

读取器的 `compare_formats`ستقوم بتقارن اثنين من الملفات:

| 概念 | ELF，`ledger-x86_64-O1.o` | Mach-O，`ledger-arm64-O1.o` |
|---|---|---|
| 文件标识 | `e_ident` `7f 45 4c 46`，类别 64，数据 LSB | `magic` `0xfeedfacf` |
| 机器架构 | `e_machine` 62，`EM_X86_64` | `cputype` `0x100000c`，`CPU_TYPE_ARM64` |
| 文件种类 | `e_type` 1，`ET_REL` | `filetype` 1，`MH_OBJECT` |
| 表的位置 | `e_shoff` `0x428`，11 个节头 | 5 条加载命令，位于文件头后的 616 字节 |
| 代码 | `.text` 位于 `0x40`，大小 `0x9f`，标志 `AX` | 无名段内的 `__TEXT,__text` 位于 648，大小 `0xd0` |
| 符号名称 | `.symtab`（第 10 节），通过 `sh_link` 1 在 `.strtab` 中查找名称 | `LC_SYMTAB` 的 `symoff` 1240、`nsyms` 17，名称位于 `stroff` 1512 |
| 符号大小 | `st_size`：`percent_change` 为 16 字节 | 没有对应字段：下一符号减去当前符号，得到 24 字节 |
| 重定位 | `.rela.text`，3 条记录，`R_X86_64_PC32` | `__text` 的 `reloff` 1104，6 条记录，`PAGE21` 与 `PAGEOFF12` |
| 函数字节 | `percent_change`：`0x40` 处的 16 字节 | `_percent_change`：`0x288` 处的 24 字节 |

حقاً`inspect_macho`读取 ماك او,该工具经由 `xcrun`运行 `otool -h -l`.`nm -gjU`.`dyld_info -imports -exports`和 `dwarfdump --uuid`آلة القراءة الخاصة بك لا تحتاج إلى هذه الأدوات، ولكن سوف تقرأ مع`otool -l`输出相同 `symoff`和 `stroff` المنطقة`open_binary`工具通过魔数识别ELF、MZ、PE، وحدة البنية أو المشاريع العامة، أيضاً تقرأ تلقائياً الاختيارات 18 处 `e_machine`هذا هو بالضبط ما قمت به هنا في 20 كلمة الحل.`format: raw-binary`、架构和入口地址──Ghidra 提供方拒绝通用二进制文件,要求先提提取单架构切片──你的读取器遇到`0xcafebabe`时也这样处理──

## أنفسها

运行仅使用标准库的读取器:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
```

演示读取 `ledger-x86_64-O1.o`,输出文件头节符号重定位和文件偏移映射; ثم输出四个函数的字节串,读取`ledger-arm64-O1.o`ولم يخرج مقارنة، وأخيراً`tiny-x86_64`من المخططات:

```text
percent_change: 16 bytes at file offset 0x40: 85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3
grade: 46 bytes at file offset 0x50: 48 63 c7 48 69 c0 67 66 66 66 ...
entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

传入路径可读取单个文件:`python3 code/main.py code/fixtures/ledger-x86_64-O0.o`△读取器根据前四字节选择 ELF أو ماخ-او──

按以下顺序阅读 `code/main.py`:

1. `ElfFile._read_header()`检查魔数、类类、字节序和条目大小,然后解包文件头──
2. `ElfFile._read_sections()`مع`read_cstring()`读取节头表,并通过 `e_shstrndx`解析名称。
3. `ElfFile._read_symbols()` تفكيك `st_info`، من خلال`sh_link`解析名称,并保持保留节索引可读──
4. `ElfFile._read_relocations()`كلّ شخص`SHT_RELA`节، تفكيك `r_info`,并依据表 4.9 为类型命名──
5. `ElfFile.function_span()`مع`function_bytes()`تحويل الرمز إلى النطاق والخطوط من بينها
6. `ElfFile.file_offset_map()`按偏移排序 لكل هيكل،并补入未使用空间──
7. `ElfFile._read_program_headers()`مع`address_to_file_offset()`处理可执行文件──
8. `MachOFile`读取文件头,加载命令,包含节的`LC_SEGMENT_64`.`LC_SYMTAB`.`LC_BUILD_VERSION`وكل جزء من الموقع
9. `compare_formats()`يستخدم القيمة التي تمت قراءتها من اثنين من الملفات لتعرض نفس المفهوم للرد على العلاقة.

## استخدمها

في الدروس اللاحقة، أولاً`code`目录加入 `sys.path`, مرة أخرى`from main import ElfFile`导入读取器──第 33 课会请求 `function_bytes`和 `relocations_for(".text")` 35 课将其输出记录为观察证.‬ 36 课获重定位偏移,以便在字节比较前屏蔽相应位置.‬

استخدام نفس `clang -target x86_64-unknown-linux-gnu -c`命令,将自己编写的C 编译为目标文件,再用读取器分析――只有 x86-64 psABI 表 4.9 列出的重定位名称才可添加;只有 gABI 或生成文件的工具链文档记载的节类才可添加──遇到没有对应名称的值时,读取器打印十六进制数,而不是猜测──

## 交互实验

### 实验 A:手动读取文件头

في`code`目录中启动 بايثون:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch/code
python3 -q
```

运行:

```python
import struct
from main import ElfFile, FIXTURES
data = (FIXTURES / "ledger-x86_64-O1.o").read_bytes()
data[:4], data[4], data[5]
struct.unpack_from("<HHIQQQIHHHHHH", data, 16)
elf = ElfFile(data)
elf.header.e_shoff, elf.header.e_shnum, elf.sections[elf.header.e_shstrndx].name
```

المجموعة تظهر`e_type`1`e_machine`62`e_shoff`1064, أي`0x428`                                                                                                                                                                                                                                                              `.strtab`存储节名称。

### 实验 ب:البدء 背后的值表

```python
rodata = elf.section_bytes(elf.section(".rodata"))
[int.from_bytes(rodata[i : i + 4], "little") for i in range(0x14, 0x28, 4)]
[int.from_bytes(rodata[i : i + 8], "little") for i in range(0x28, 0x50, 8)]
[r for r in elf.relocations_for(".text") if r.symbol == ".rodata"]
```

两张表都读出 `1, 2, 3, 4, 4`✿对照 `ledger.c`检查:`grade(65)`计算 `65 / 10 - 6 = 0`,读取条目 0, الحصول على 1,即 `case 6`قيمة`grade(100)`读取条目 4,得到 4,即 `case 10`مع`case 9`قيمة المستخدمة

### تجربة C: ثلاثة أنواع من نفس المصدر

```python
for level in ("O0", "O1", "O2"):
    obj = ElfFile.from_path(FIXTURES / f"ledger-x86_64-{level}.o")
    print(level, [s.name for s in obj.sections if s.name in (".data", ".rodata")])
    print(level, sorted({r.type_name for r in obj.relocations}))
    print(level, {s.name: s.st_size for s in obj.symbols if s.type == "FUNC"})
```

-0  الملفات المستهدفة`.data`节和三种重定位类型──-O1 与 -O2 目标文件没有 `.data`و هناك نوع واحد فقط`total`في -O0 下为 66 字节,-O1 下为 31 字节,-O2 下为 140 字节──

### تجربة D: نفس الوظيفة في مركز

```python
from main import MachOFile
macho = MachOFile.from_path(FIXTURES / "ledger-arm64-O1.o")
[(c.name, c.cmdsize) for c in macho.load_commands]
macho.function_span("_percent_change")
macho.function_bytes("_percent_change")[:4].hex()
```

函数范围为文件偏移 648 处的24字节──前四字节是 `a0000034`,即指令`0x340000a0`في شكل صغير`llvm-objdump -d`لإنتاجها`cbz w0, 0x14`انها كذلك`before == 0`‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬`85 ff 74 09`نفس المراقبة

## 实践实验

扩展读取器,使其支持已链接程序──在Linux x86-64 机器上,运行 `clang -O1 -shared -fPIC code/fixtures/ledger.c -o libledger.so`, و إضافة`main`后运行 `clang -O1 code/fixtures/ledger.c -o ledger_main`ثم استخدم جهاز قراءة لتحليل هذه الملفات

要求:

- مع نفسها`Elf64_Sym`布局读取 `.dynsym`، لأن`SHT_DYNSYM`11، والرقم لا يتغير
- ستعمل`.dynamic`读取为由 `d_tag`和 `d_val`组成的 `Elf64_Dyn`记录,并依据 gABIديناميكية قسم页面命名 `DT_NEEDED`.`DT_STRTAB`.`DT_SYMTAB`.`DT_RELA`和 `DT_JMPREL`.
- ستعمل`st_shndx`لأجل`SHN_UNDEF`                                                                                                                                                                                                                                                              `.rela.plt`وسط`R_X86_64_JUMP_SLOT`记录列为到达它们调用位置──
- وفقاً لـ GABI                                                                                                                                                                                                                                                           `PT_LOAD`段映射到其含的节──
- استخدام`address_to_file_offset`证明,共享目标文件中每个定义函数的字节与 `function_bytes`تعود نفس القيمة
- ستقوم بتصميم الملفين`llvm-objdump -h -t -r -p`和 `llvm-objdump -T`文本采集到 `code/fixtures/`, و في اختبار مقارنة مع جهاز القراءة

معيار النجاح: إدخال قائمة 段映射 و كل وظيفة محدوده متوافقة مع أدوات الاستخدام وتخرج، و لا تعمل أثناء الاختبار أدوات.

## 本课产物

本课产出 `outputs/skill-program-anatomy-elf-from-scratch.md`يمكن استخدامها في كلود، كورسور، كودكس، أوبن كلوف، هرمز أو أي جهاز ذكي من SKILL.md. هذه المهارة سوف تحويل المستخدم المكونات المكونة من الملفات المعدل المعدل أو الملفات القابلة لتنفيذها إلى تقرير المخطط، وتعطى كل مجموعة من الملفات من الهيكل والرموز والتحديد الموقع، ومراقبة أدوات جمع المعلومات وتصدر التحققات.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

测试套件验证:

- ثلاثة x86-64  الملفات المستهدفة والفائيل الصغيرة التي يمكن تنفيذها، كل جزء من المؤشرات  الاسم  الحجم  عنوان و أنواعها `llvm-objdump -h`文本一致
- قيمة كل رمز، مقيدة، نوع، جزء، حجم و اسم كل شيء مع جمع`llvm-objdump -t`文本一致
- كل تحرك من الموقع، النوع من الاسم، الرمز والمزيد من الاصطناعات`llvm-objdump -r`文本一致,包括 -O0 下的 `R_X86_64_PLT32`和 `R_X86_64_64`
- `tiny-x86_64`الإجراءات الثنائية هي الإجراءات المشتركة.`llvm-objdump -p`المقال المتفق، والملف المستهدف لا يوجد برنامج
- `percent_change`位于文件偏移 `0x40`, طول 16 字节, 字节 مطابقة للتوقعات, وكل وظيفة تقع`.text`داخل
- 文件偏移映射恰好覆盖每件的每字节一次,且 -O1 目标文件的三个对齐空隙位置正确
- `tiny-x86_64`من نقطة دخول`PT_LOAD`映射到文件偏移 `0xb0`, ويمكن إعادة تحديد المستهدف
- ماك-او 文件头、每条加载命令、段、五节、`LC_SYMTAB`和 `LC_BUILD_VERSION`مدينة ومجمعة`--private-headers`文本一致
- رمز ماك او مع 15 条重定位都与采集的`llvm-objdump`文本一致,且 `_percent_change`位于偏移 648,长度 24 字节
- 错误魔数、32位类别、大端文件、截断表、通用二进制文件和C 源文件都触发 `FormatError`
- `build_tiny_elf.py`逐字节复现已提交的 `tiny-x86_64`
- 图示模块 `site/figures-re-32.js`包含 `ledger-x86_64-O1.o`     

## نمط الفشل في بيئة النمو

| 失败 | 不严谨的读取会报告什么 | 读取器必须证明什么 |
|---|---|---|
| 将 `st_value` 当成文件偏移 | “`percent_change` 在 0 处” | 偏移为 `sh_offset + st_value - sh_addr`，这里是 `0x40` |
| 将填充计为代码 | “`grade` 有 48 字节” | `st_size` 为 46，之后的 `66 90` 不属于任何符号 |
| 从错误的表读取节名称 | 乱码名称或异常 | `e_shstrndx` 指定名称表，这里是第 1 节 |
| 对 `SHT_NOBITS` 盲目信任 `sh_size` | 读到文件末尾之外 | `.bss` 不占文件字节，映射应跳过它 |
| 将零字节读成操作数 | “`lea 0(%rip)`” | `0x36` 处的 `.rela.text` 记录指定 `.rodata+0x10` |
| 将加数读成目标偏移 | “表从 `0x10` 开始” | `S + A - P` 结合指令末尾得到 `0x14` |
| 对剥离信息的可执行文件遍历节 | “文件没有代码” | `PT_LOAD` 映射加载器使用的每个地址 |
| 将链接地址视为运行时地址 | 随机基址下得到错误偏移 | 从 `PT_LOAD` 得到的文件偏移才是稳定坐标 |
| 只按 `sectname` 查找 Mach-O 节 | 两个 `__const` 节被合并成一个 | 名称应为 `segname,sectname` |
| 期待 `nlist_64` 有大小字段 | 异常或零字节 | 同一节内的下一个符号标记函数终点 |
| 将通用二进制文件当成单一 Mach-O 读取 | “未知魔数 `0xcafebabe`” | 拒绝读取，并要求提供单架构切片 |
| 在另一台 Mac 上重建 arm64 目标文件 | “夹具变了” | `LC_BUILD_VERSION` 记录 SDK，因此已提交的字节才是夹具 |

## 操作准则

读取可信的文件头,沿其偏移定位结构,并依据定义字段的规范为每个字段命名. سيتم استخدامها للثروات المقاربة للإنتاج المقدمة لل具,让比较无需运行工具. عندما لا يتم تسمية القواعد لبعض القيمة، فمن الممكن طباعة قيمة عددية.

## 延伸阅读

- [System V gABI, 第 4 章：目标文件](https://www.sco.com/developers/gabi/latest/ch4.intro.html)مع[ELF Header](https://www.sco.com/developers/gabi/latest/ch4.eheader.html)،[Sections](https://www.sco.com/developers/gabi/latest/ch4.sheader.html)،[Symbol Table](https://www.sco.com/developers/gabi/latest/ch4.symtab.html), مع[Relocation](https://www.sco.com/developers/gabi/latest/ch4.reloc.html)الصفحة
- [System V gABI, 第 5 章：程序头](https://www.sco.com/developers/gabi/latest/ch5.pheader.html)مع[Dynamic Linking](https://www.sco.com/developers/gabi/latest/ch5.dynamic.html)
- [System V ABI, AMD64 Architecture Processor Supplement](https://gitlab.com/x86-psABIs/x86-64-ABI), الصفحة 4.9: نوع تعيين جديد
- [Apple XNU `loader.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h)،[`nlist.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/nlist.h), مع[`reloc.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/reloc.h)
- [17 U.S.C. 1201](https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title17-section1201&num=0&edition=prelim)مع[Directive 2009/24/EC](https://eur-lex.europa.eu/eli/dir/2009/24/oj/eng)
- [Sega v. Accolade, 977 F.2d 1510](https://law.resource.org/pub/us/case/reporter/F2/977/977.F2d.1510.92-15655.html)مع[Sony v. Connectix, 203 F.3d 596](https://law.resource.org/pub/us/case/reporter/F3/203/203.F3d.596.99-15852.html)
- [rea 6.5.0 `docs/binary-diagnostics.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/binary-diagnostics.md)مع[`docs/ghidra-provider.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/ghidra-provider.md)
