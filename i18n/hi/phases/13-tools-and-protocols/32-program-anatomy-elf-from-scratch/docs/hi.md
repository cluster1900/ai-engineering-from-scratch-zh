# 程序解剖: 零编写 ELF 读取器

> 编译后程序 एक समूह के परस्पर ओरिएंटल शेड्यूलों है। स्वयं लिखित पाठक यंत्र एक से दूसरे से अनुक्रमित करने के लिए एक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक से अधिक।

**Type:** Build
**Languages:** Python（标准库）、C（仅用于测试夹具）
**Prerequisites:** Phase 0 · 01（开发环境），已安装 clang；Python 3.10 或更高版本；十六进制运算
**Time:** ~120 分钟

## 学习目标

- व्याख्या इस श्रृंखला प्रत्येक विश्लेषणात्मक लक्ष्य के अधिकार के नियम, तथा 17 U.S.C. 1201 (f) के चार प्रतिबंधों
- उपयोग `struct.unpack`读取 ELF 文件头、节头表和两个字符串表──
- 根据 gABI 与 x86-64 psABI 中的名称解码 `.symtab`条目与 `.rela`记录──
- 返回指定函数的准确字节,并将每个文件偏移映射到其属结构──
- 读取程序头,通过 `PT_LOAD`将虚拟地址映射为文件偏移──
- 读取 Mach-O 目标文件的加载命令,并指出每命令对应的ELF 概念──

## 开始之前:授权与法律

धारा 32 से 36 तक के प्रत्येक पाठ का लक्ष्य स्वयं का लेखन एवं संपादन प्रक्रिया है।`code/fixtures/ledger.c`, जिसमें चार संक्षिप्त सी फ़ंक्शन हैं। स्रोत कोड, संपादन आदेश और उत्पन्न लक्ष्य फ़ाइलें आपके हाथ में हैं। यहां कोई लाइसेंस पढ़ने की आवश्यकता नहीं है। सुरक्षा को पार करने की आवश्यकता नहीं है, और किसी भी तीसरे पक्ष के कोड को खोलने की आवश्यकता नहीं है।

इस नियम का कारण यह है कि कानून को प्रति-संहिता को प्रति-संहिता के रूप में माना जाएगा। *Sega Enterprises Ltd. v. Accolade, Inc.*, 977 F.2d 1510 (9th Cir. 1992)  मामले में, अदालत ने मान्यता दी कि प्रति-संहिता प्रक्रिया में उत्पन्न मध्य प्रतियां  कॉपीराइट कानून के अर्थ में प्रति-संहिता के अंतर्गत आती हैं। इसके बाद अदालत ने फैसला कियाः जब प्रति-संहिता कंप्यूटर प्रोग्राम में प्रति-संहिता के संरक्षण में मौजूद विचारों और कार्यशील तत्वों को प्राप्त करने का एकमात्र तरीका है, और जब इस प्रकार के लिए उचित कारणों से खोज की जाती है, तो प्रति-संहिता कानून में इस प्रति-संहिता संरक्षण कार्य का उचित उपयोग करती है।

दूसरा मामला है *सोनी कंप्यूटर एंटरटेनमेंट, इंक. बनाम कनेक्टिक्स कॉर्प*, 203 F.3d 596 (9th Cir. 2000) ⋅ कनेक्टिक्स ने प्लेस्टेशन बायोस को कॉपी करने के लिए एक मॉडल विकसित किया, अदालत ने इन कॉपी को उचित उपयोग के लिए मान्यता दी।

 दो प्रावधानों में सीमाएँ निर्धारित की गई हैं 17 U.S.C. 1201 (f)  अनुमति देता है  कानूनी रूप से प्राप्त कंप्यूटर प्रोग्राम का उपयोग करने का अधिकार व्यक्ति द्वारा उपयोग नियंत्रण से परे, लेकिन एकमात्र उद्देश्य स्वतंत्र रूप से स्थापित कंप्यूटर प्रोग्राम और अन्य कार्यक्रमों के साथ परस्पर संचालन को प्राप्त करने के लिए आवश्यक तत्वों की पहचान और विश्लेषण करना चाहिए🏻 चार प्रतिबंधों को एक साथ पूरा करना चाहिएः副本合法、 प्रयोजन के लिए परस्पर संचालन、 संबंधित तत्व पहले नहीं  आसानी से प्राप्त, और विश्लेषण स्वयं अन्य उल्लंघनों का गठन नहीं करता है️ अनुच्छेद 1201 (f)  अनुच्छेद केवल विनियमों के खिलाफ एक अपवाद है; न्याय करना चाहिए कि क्या कानूनी रूप से पुनः उपयोग करना अभी भी उचित उपयोग पर आधारित है🏻

यूरोपीय संघ में,दिशा 2009/24/ईसी के अनुच्छेद 5 (३)  के अंतर्गत अनुसंधान से संबंधित है। इस अधिकार का उपयोग किसी भी प्रक्रिया के पीछे के विचार और सिद्धांतों को निर्धारित करने के लिए, एक अध्ययन या परीक्षण प्रक्रिया के संचालन पर ध्यान देने के लिए, एक प्रतिलिपि का उपयोग करने का अधिकार है। यह अधिकार लोड, प्रदर्शित, चलाने, प्रसारण या भंडारण प्रक्रिया के दौरान लागू होता है।

धारा 6  अनुमतियाँ प्रदान करती हैं कि स्वतंत्र रूप से बनाए गए कंप्यूटर प्रोग्राम के परस्पर संचालन के लिए आवश्यक जानकारी और अपरिहार्य है, बिना अधिकारियों के अधिकार के इसका अनुवाचन किया जा सकता है।

| 来源 | 允许的行为 | 条件 |
|---|---|---|
| 17 U.S.C. 1201(f) | 绕过访问控制以分析程序 | 合法副本、互操作目的、信息不易获得、不构成侵权 |
| Directive 2009/24/EC 第 5(3) 条 | 观察、研究和测试运行中的程序 | 有权使用副本，行为处于正常加载和运行范围内 |
| Directive 2009/24/EC 第 6 条 | 反编译 | 被许可人、互操作目的、信息不易获得、仅限必要部分 |
| *Sega v. Accolade* | 构成合理使用的反汇编 | 获取思想和功能要素的唯一途径，且理由正当 |
| *Sony v. Connectix* | 逆向工程过程中的中间复制 | 最终产品不侵权 |

इन सूचनाओं से कानून के अनुच्छेदों और निर्णयों की राय, कानूनी सुझावों का गठन नहीं करते हैं। इसके बाद जब आप अपने लक्ष्य से बाहर हो जाते हैं, तो पहले लिखित प्राधिकरण प्राप्त करें और फिर से दस्तावेज़ खोलें, और प्रमाणों के साथ अधिकार को सहेजें।

## 问题

तुम कोकपिश्ले किया है`ledger.c`, और लक्ष्य फ़ाइलों पर काम किया गया ।`llvm-objdump -t`                                                                                                                                                                                                                                                              `percent_change` `0000000000000000`, बड़े आकार के लिए `0000000000000010`◊ इस 1,768 字节 फ़ाइल में से कौन सा 16 字节 इस फ़ंक्शन का है?`0x36`处显示 `R_X86_64_PC32 .rodata+0x10`, और इस फ़ाइल में इस स्थान के चार वर्ण हैं शून्य. वे अंततः क्या बन जाएगा?`0x14`开始, क्यों बढ़े लेकिन `0x10`?

उपयोग `inspect_binary_layout`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `REA_PWNTOOLS_PYTHON`4.15।0। इस मैक ऊपर कोई नहीं है।`address_to_file_offset`需要 Ghidra 会话,以及 SHA-256 匹配的原始文件完整字节副本──`inspect_artifact`मार्ग और सामग्री के अनुसार कंटेनर में सामग्री को सूचीबद्ध किया गया है, लेकिन लक्ष्य फ़ाइल के अंदर के तालिका को नहीं पढ़ा गया है।`struct.unpack`和零 बाहरी निर्भरता स्वयं संपादन पाठक                                                                                                                                                                                                                                                           `llvm-objdump`文本 तुलना करें

```figure
elf-byte-map
```

## 文件就是指向其他表的表

System V GABI भाग 4 अध्याय 4-1 में एक ही फ़ाइल के दो दृश्यों को प्रदर्शित किया गया है। लिंक दृश्य में ELF फ़ाइल शीर्षक, चयनित प्रोग्राम शीर्षक, और आवश्यक प्रोग्राम शीर्षक शामिल हैं। निष्पादन दृश्य में ELF फ़ाइल शीर्षक, आवश्यक प्रोग्राम शीर्षक, और चयनित प्रोग्राम शीर्षक शामिल हैं।

gABI ने भी एक विशिष्ट प्रकार का निर्धारण किया है, तथा घोषणा की है कि वह खुद को एक विशिष्ट क्षेत्र के रूप में उपयोग नहीं कर रहा है।`Elf64_Addr`和 `Elf64_Off`प्रत्येक 8 字节,`Elf64_Half`占 2 字节,`Elf64_Word`占 4 字节,`Elf64_Xword`占 8 字节──x86-64 psABI 第 4.1.1 节要求使用 `ELFCLASS64``ELFDATA2LSB`,`e_machine``EM_X86_64`(62),`e_flags`∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞`<`पूर्व के `struct.unpack`, एक बार调用就能读取一条记录.

`ledger-x86_64-O1.o`的前 64 字节:

```text
00000000: 7f45 4c46 0201 0100 0000 0000 0000 0000  .ELF............
00000010: 0100 3e00 0100 0000 0000 0000 0000 0000  ..>.............
00000020: 0000 0000 0000 0000 2804 0000 0000 0000  ........(.......
00000030: 0000 0000 4000 0000 0000 4000 0b00 0100  ....@.....@.....
```

SELF Header पृष्ठ पढ़ें ये लेख`e_ident`占 16 字节,包含 `7f 45 4c 46`(魔数,即识别文件格式的固定字节) 类别 2(64位) DATA编码 1(小端) 版本 1、OS ABI 0(System V)及填充──

接着,`e_type``0x0001` प्रदर्शित`ET_REL`, अर्थात् लक्ष्य फ़ाइल को पुनः निर्धारित करना।`e_machine``0x003e`62 के लिए, अर्थात्`EM_X86_64` लक्ष्य फ़ाइल में प्रवेश बिंदु नहीं है, इसलिए `e_entry`零; इसमें कोई प्रक्रिया नहीं है, इसलिए `e_phoff`零零`e_shoff``0x428`, तालिका के फाइलों के स्थानांतरण.`e_ehsize` `0x40``e_phentsize`0`e_phnum`0`e_shentsize` `0x40``e_shnum` `0x0b`(11 个节头), तथा`e_shstrndx` `0x0001`

读取器用一次调用解析 इस पंक्ति:

```python
fields = struct.unpack_from("<HHIQQQIHHHHHH", data, 16)
```

形式字符串对应从左到右读取的 gABI 图:两个半字、一个字、三个 8字节值、一个字、六个半字──读取器拒绝魔数、类别或字节序不符的文件,也拒绝不符合 64 和 56 的`e_shentsize`या `e_phentsize`△ चौड़ाई एक बार त्रुटि होने पर, सभी परिचालनों में त्रुटि होती है, इसलिए जांच को सबसे पहले रखना चाहिए।

## 节头与两个字符串表

प्रत्येक अध्याय एक 64 字节 का है `Elf64_Shdr`(GABI 图 4-8):`sh_name``sh_type``sh_flags``sh_addr``sh_offset``sh_size``sh_link``sh_info``sh_addralign``sh_entsize`                                                                                                                                                                                                                                                              `<IIQQQQIIQQ``sh_name`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `e_shstrndx`                                                                                                                                                                                                                                                              `e_shstrndx`1. कlang 将该节命名`.strtab`, इसलिए एक ही चश्मे में एक ही समय में भंडारण节名称和符号名称──

读取器输出 -O1 目标文件的 11 节头:

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

सूचक 0 है आरक्षित का空节头──`.text`फ़ाइलों में स्थानांतरित`0x40`处存放 159 字节代码,紧接文件头,标志为`A`(मध्ये内存中分配) तथा `X`(可执行) `.rodata`存放 80 字节只读数据──`.rodata.str1.1`存放五个标签符串 `F\0D\0C\0B\0A\0`,共 10 字节,标志为 `M`(可合并) और `S`(字符串)

`.comment`存放 47 字节的编译器标记 `\0Apple clang version 17.0.0 (clang-1700.6.3.2)\0``.llvm_addrsig` के प्रकार `0x6fff4c03`, gABI में स्थित है ऑपरेटिंग सिस्टम के लिए विशेष प्रकार के लिए रखा जाता है`SHT_LOOS`至 `SHT_HIOS`范围内,LLVM के `ELF.h` उसका नाम दिया  उसका संकेत `E``SHF_EXCLUDE`, तो लिंक डिवाइस इसे छोड़ देगा.

`sh_link`和 `sh_info`两列是表之间的指针──`.rela.text``sh_info`2`sh_link`10: यह भाग 2 को संशोधित करता है, और भाग 10 से प्राप्त प्रतीक`.symtab``sh_link`为 1,指向符号名称字符串表;`sh_info`9, पहला गैर-स्थानीय प्रतीक सूचकांक को दर्शाता है।`sh_addr`शहर के लिए शून्य है, क्योंकि लक्ष्य फ़ाइल में अभी तक कोई पता नहीं है; पता लिंक द्वारा वितरित किया गया है।

gABI के दो नियम पढ़ने वाले यंत्र को पूर्ण फ़ाइल का नक्शा तैयार करने में सक्षम बनाते हैंः节连续且不重叠,文件包含未使用空间── पढ़ने वाले यंत्र प्रत्येक संरचना क्रम में偏移 करके, और रिक्त स्थानों में भरकरः

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

तीन खाली जगहों में 10 字节, सभी के लिए एक साथ.`.rodata``sh_addralign`इसलिए, 8 से।`0xe0`नहीं `0xdf`开始──`.symtab`            `.comment`之后有七字节未使用──节头表本身也按8字节对齐──

`SHT_NOBITS`类型节完全不占文件字节,因此映射会跳过它们──本目标文件没有这种类型节,但已链接程序中的 `.bss` इस श्रेणी में शामिल हैं; यदि पाठक वहाँ अंधेरे विश्वास `sh_size`, , बस फ़ाइल के अंत के बाहर पढ़ सकता है

## 符号:绑定、类型、属节、值与大小

`Elf64_Sym`占 24 字节(gABI 图 4-18):`st_name``st_info``st_other``st_shndx``st_value``st_size`, स्वरूप के लिए`<IBBHQQ``st_info`打包了两个字段:高四位为绑定属性,低四位为类型──gABI 定义的绑定为 `STB_LOCAL`0`STB_GLOBAL`1`STB_WEAK`2; प्रकार `STT_NOTYPE`0`STT_OBJECT`1`STT_FUNC`2`STT_SECTION`3`STT_FILE`4 `st_other`                                                                                                                                                                                                                                                              `STV_DEFAULT`0

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

索引 0 是保留的未定义符号──`st_shndx`指定定义符号的节, अन्य तीन आरक्षित मान हैंः`SHN_UNDEF`0 、 फाइलनाम के लिए `SHN_ABS` `0xfff1`, तथा `SHN_COMMON` `0xfff2`节符号名称为空, इसलिए `llvm-objdump`会打印节本身的名称,读取器也如此处理──gABI 规定所有具有STB_LOCAL 绑定的符号都排在弱符号和全局符号之前,这里体现为前九行,也正因此`.symtab``sh_info`9 में रिकॉर्ड किया गया है।

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `sh_addr`零,`st_value`∈ ∈ R. अतः फ़ंक्शन का फ़ाइल्ड                                                                                                                                                                                                                                                        `sh_offset + st_value - sh_addr`,长度为 `st_size`:

```python
section = elf.sections[symbol.st_shndx]
file_offset = section.sh_offset + (symbol.st_value - section.sh_addr)
code = elf.data[file_offset : file_offset + symbol.st_size]
```

`percent_change`और, परिचालन है`0x40 + 0`,16 个字节为 `85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3`                                                                                                                                                                                                                                                              `grade``.text` के परिचालन `0x3e`处结束──紧随其后的两个字节 `66 90`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `nop`हवाई संचालन निर्देश, करने के लिए `total`से `0x40`यह एक 16 字节 सीमा शुरू हो गया है। ये दो 字节 किसी भी प्रतीक से संबंधित नहीं हैं।`st_size` प्रति विनिमय संयोजक के रुके रहने की शर्त के रूप में, धारा 36  इन भरने के खण्डों को तुलनात्मक पुनर्निर्माण के परिणामों से पहले अवरुद्ध करेगी

## 重定位:零字节 का क्या अर्थ है

`Elf64_Rela`占 24 字节(gABI 图 4-23):`r_offset``r_info`और वहाँ प्रतीक है `r_addend`, स्वरूप के लिए`<QQq` पुनः स्थान रिकॉर्ड विवरण लिंक के लिए आवश्यक सुधार के स्थान एवं गणना विधि`r_info`:`ELF64_R_SYM(i)``i >> 32`,`ELF64_R_TYPE(i)``i & 0xffffffff`                                                                                                                                                                                                                                                              `r_offset``sh_info`सो निर्दिष्ट节内偏移──类型名称和公式来自 x86-64 psABI 表 4.9,其中 `S`符号值,`A`है, जोड़ा गया है,`P`है सुधार की स्थिति,`L`                                                                                                                                                                                                                                                              `R_X86_64_64``S + A`,`R_X86_64_PC32``S + A - P`,`R_X86_64_PLT32``L + A - P`

-ओ1  लक्ष्य फ़ाइल में आठ लेख रिकॉर्ड हैंः

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

拆解第一条记录──偏移 `0x36`位于 `grade`内,后者范围为 `0x10`至 `0x3e``0x33`处的指令是 `48 8d 0d 00 00 00 00`, यानी गणना RIP 相对地址 के `lea`,其四字节位移位于 `0x36`◊ प्रसंस्करणकर्ता को अगले आदेश के पते पर स्थानांतरित किया जाएगा `0x3a`ऊपर

编译器希望结果为 `.rodata + 0x14`, वहाँ एक है जिसमें 5 32 बिट्स मूल्य है ।`1, 2, 3, 4, 4`                                                                                                                                                                                                                                                              `(.rodata + 0x14) - 0x3a`公式 `S + A - P``P = 0x36`时得到 `.rodata + A - 0x36`令两者相等可得 `A = 0x14 - 4 = 0x10`                                                                                                                                                                                                                                                              

यह एक झलक है जो एक झलक है`grade``switch`                                                                                                                                                                                                                                                              `0x66666667`和两次移位计算 `score / 10`, पुनः घटाएँ 6 、 तुलना करें 4 , फिर सूचकांक करें इस तालिका में ∙-O1 ELF  लक्ष्य फ़ाइल में इस तालिका में कोई संकेतक नहीं है; उद्धरण है 节 संकेतक `.rodata`एक अतिरिक्त संख्या के साथ, केवल एक ही स्रोत के साथ arm64  निर्माण इसे नामित किया जाएगा `l_switch.table.grade`第二条记录位于 `grade_label``0x84`, दिशा में`.rodata + 0x28`处第二张由 8 字节值组成的表──第三条位于 `0x93`, दिशा में`.rodata + 0x0`,即 `labels.rel`की उठती है

五条 `.rela.rodata` रिकॉर्ड भरा `labels.rel` प्रत्येक अनुच्छेद स्थित है`4i`, और संख्या भी है ।`4i`, इसलिए `S + A - P`化简为字符串地址减去表基址──`grade_label`उपयोग `movslq`读取条目,再加回表基址,就得到指针──第一条记录引用节符号 `.rodata.str1.1`, जोड़ संख्या के लिए 0, क्योंकि字符串 `F`से से इस भाग के पहले भाग में शुरू हुआ।`.L.str.1`至 `.L.str.4`, वे एक संकलक हैं .`D``C``B``A`生成的局部标签──

एक ही स्रोत कोड को तीन प्रकार के अनुकूलन स्तरों में तीन अलग-अलग रूपों में संकलित किया जाता है।

| 构建 | `labels` 的位置 | `grade` 如何选择 | `grade_label` 如何到达 `grade` |
|---|---|---|---|
| -O0 | `.data`，五个 8 字节指针，五条 `R_X86_64_64` 记录 | `.rodata` 中的跳转表：五条指向 `.text` 的 `R_X86_64_PC32` 记录 | 带有 `R_X86_64_PLT32 grade-0x4` 的调用 |
| -O1 | `.rodata` 中的 `labels.rel`，五个 32 位相对条目 | `.rodata+0x14` 处的值表，一条 `R_X86_64_PC32` | 已内联，没有调用 |
| -O2 | 与 -O1 相同 | 与 -O1 相同 | 已内联，`total` 增长到 140 字节 |

-0 नीचे,`switch`                                                                                                                                                                                                                                                              `.text`मध्य `+0x91``+0x8c``+0x87``+0x82`和 `+0x86`对 `grade`                                                                                                                                                                                                                                                              `-0x4`अतिरिक्त संख्या, कारण और `lea`इसी प्रकार-ओ1 में, अनुकूलक प्रत्येक भाग को सामान्य मात्रा में वापस पाता है, अतः परिणाम के रूप में प्रतिफलित कूदता है।

## 程序头: लोडर का दृश्य

पुनः निर्धारित लक्ष्य फ़ाइलें कोई प्रक्रिया नहीं है, इसलिए `e_phnum`◊ निष्पादन योग्य फ़ाइलें और साझा लक्ष्य फ़ाइलें में प्रक्रम शीर्षक होता है, लोडर केवल ये जानकारी पढ़ता है।`Elf64_Phdr`占 56 字节(gABI 图 5-1):`p_type``p_flags``p_offset``p_vaddr``p_paddr``p_filesz``p_memsz``p_align`, स्वरूप के लिए`<IIQQQQQQ`gABI 为 `PT_LOAD`条目规定三条规则:按 `p_vaddr`升序排列;`p_memsz`बड़ा `p_filesz`का भाग शून्य भरने के लिए;`p_vaddr``p_offset``p_align`取模同余──

इस श्रृंखला के प्रत्येक लक्ष्य अपने आप बनाया है कार्यक्रम है, जबकि इस मैक पर नहीं कर सकते हैं`ledger.o`生成 लिनक्स可执行文件的链接器──因此具 `tiny-x86_64`से`code/fixtures/build_tiny_elf.py`, यह उपयोग करता है`struct.pack`写出 736 字节──文件包含 ELF 文件头,两个程序头,36 字节的 `_start`、3 字节 `.rodata`、符号表和六节头──`_start`向文件描述符 1 写入 `ok\n`, फिर स्टेट कोड 42  आउटपुट  यह लिनक्स x86-64 पर चल सकता है; यहाँ, यह एक परीक्षण  उपकरण है जो प्रक्रिया के शीर्ष प्रसंस्करण पथ को कवर करता है 

```text
Program headers:
  PT_LOAD          r-x offset=0x0 vaddr=0x400000 filesz=0x2e0 memsz=0x2e0 align=0x1000
  PT_GNU_STACK     rw- offset=0x0 vaddr=0x0 filesz=0x0 memsz=0x0 align=0x10

entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

唯一 `PT_LOAD`पूरे 736 字节 फ़ाइल को मैप करने के लिए`0x400000`△读取器找到包含某地址的 `PT_LOAD`, पुनः गणना `p_offset + (address - p_vaddr)`, तत्काल पता पता के लिए फ़ाइल स्थानांतरण के लिए मैपिंग किया जा सकता है.`0 + (0x4000b0 - 0x400000) = 0xb0`, सही है`.text`की उठती है

यह वास्तव में है ।`address_to_file_offset`背后的计算──对 Ghidra 目标,该工具返回 `{address, file_offset}` हूपर                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `provider_file_offset`和 `image_base_file_offset`◊ उपकरण को मूल फ़ाइल की पूर्ण प्रति की आवश्यकता होती है, तथा SHA-256 की प्रति के लक्ष्य के अनुरूप होना चाहिए।`inspect_binary_layout`文档中还有一句值得记住的话: 链接地址不是运行时地址──位置无关可执行文件将上载到内核选择的基址,只有文件偏移是稳定坐标──

程序头也解释了为什么在剥离信息后的可执行文件仍可运行──链接器可以完全移除节头表,此时`e_shoff`变为零――遍历节 के उपकरण किसी भी सामग्री को नहीं देखते, और लोडर कभी भी इन खण्डों पर निर्भर नहीं करता है――

## मच-ओ 中的对应概念

Apple ने Mach-O के लिए कोई वर्डप्रेस संस्करण नहीं जारी किया है।`EXTERNAL_HEADERS/mach-o/loader.h``nlist.h`和 `reloc.h`具 `ledger-arm64-O1.o`एक से एक `ledger.c`उपयोग `clang -target arm64-apple-macos -O1 -fno-asynchronous-unwind-tables -c`构建――

`mach_header_64`占 32 字节:`magic``cputype``cpusubtype``filetype``ncmds``sizeofcmds``flags``reserved`                                                                                                                                                                                                                                                              `0xfeedfacf`,即 `MH_MAGIC_64``cputype``0x0100000c`,即 `CPU_TYPE_ARM64``filetype`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `MH_OBJECT``ncmds`५,`sizeofcmds`616: लोड आदेश, अधिग्रहण फ़ाइल के बाद के 616 字节, प्रत्येक आदेश के अनुसार`{cmd, cmdsize}`开始──标志 `0x2000``MH_SUBSECTIONS_VIA_SYMBOLS`

```text
Load commands:
  0 LC_SEGMENT_64                cmdsize=472 at 0x20
  1 LC_BUILD_VERSION             cmdsize=24 at 0x1f8
  2 LC_LINKER_OPTIMIZATION_HINT  cmdsize=16 at 0x210
  3 LC_SYMTAB                    cmdsize=24 at 0x220
  4 LC_DYSYMTAB                  cmdsize=80 at 0x238
```

`LC_SEGMENT_64`(0x19) 应 ELF के 两张表――其`segment_command_64`包含 `segname``vmaddr``vmsize``fileoff``filesize``maxprot``initprot``nsects`和 `flags` उसी आदेश में `nsects`条 `section_64`记录,每条 80 字节──`loader.h` के बारे में `MH_OBJECT`इन खंडों में एक खाली खंड है।`fileoff`648 के लिए,`filesize`456 में 5 भाग शामिल हैं।

```text
  Idx Section                    Addr   Size Offset Reloff Nreloc Type
    1 __TEXT,__text               0x0   0xd0    648   1104      6 S_REGULAR
    2 __DATA,__const             0xd0   0x28    856   1152      5 S_REGULAR
    3 __TEXT,__cstring           0xf8    0xa    896      0      0 S_CSTRING_LITERALS
    4 __TEXT,__const            0x108   0x40    912      0      0 S_REGULAR
    5 __LD,__compact_unwind     0x148   0x80    976   1192      4 S_REGULAR
```

हर एक भाग से गुजरता है`segname`指明所属段, इसलिए दो名为 `__const`                                                                                                                                                                                                                                                              `__DATA,__const`, एक और है `__TEXT,__const`重定位通过 `reloff`和 `nreloc`按节存放;ELF 则为每目标节设置单独 `.rela.X`节──

प्रत्येक `relocation_info`占 8 字节, सबसे पहले 符号的`r_address`, उसके बाद एक 32 位字段,打包为 `r_symbolnum`(24 位)`r_pcrel`(1 位)`r_length`(2 位)`r_extern`(1 位) और `r_type`(4 位) 六条`__text`记录是三对 `ARM64_RELOC_PAGE21``ARM64_RELOC_PAGEOFF12`, प्रतिष् टक उद्धरण 应对一对――arm64 के `adrp`加 `add`实现了 x86-64 `lea`                                                                                                                                                                                                                                                              `__DATA,__const`记录为 `ARM64_RELOC_UNSIGNED`,`r_length`इसलिए प्रत्येक संशोधन एक 8 字节绝对指针──

ओ 1 नीचे,आर्म 64 निर्माण होगा `labels`सामान्य सूचक के लिए बनाए रखें, जबकि x86-64 निर्माण ने सापेक्षता का उत्पादन किया

`LC_SYMTAB`(0x2) समाहित `symoff`1240`nsyms`17`stroff`1512`strsize`176,1512 प्लस 176 आदि फाइल आकार 1688--- प्रत्येक `nlist_64`占 16 字节:`n_strx``n_type``n_sect``n_desc``n_value``n_type`यह क्षेत्र है।`N_TYPE`(掩码 `0x0e`) के बराबर `N_SECT`(`0xe`),表示符号定义在序号为 `n_sect`                                                                                                                                                                                                                                                              `N_EXT`(`0x01`) बाहरी प्रतीक चिन्हों

`nlist_64`没有大小字段──为获取 `_percent_change`के 24 字节,读取器使用同一节中下一个符号的地址,即位于 `0x18``_grade` यहाँ C 符号带有前导 `_`, अतः फ़ंक्शन नाम `_percent_change`

`LC_DYSYMTAB`(0xb) ELF के साथ रिकॉर्ड किया गया`sh_info`समान स्थानीय मानकों के प्राथमिकता नियमः`ilocalsym`0`nlocalsym`13`iextdefsym`13`nextdefsym`4 `LC_BUILD_VERSION`(0x32) 以打包的`XXXX.YY.ZZ`整数记录 `platform`1(macOS)`minos`26.0 और `sdk`26.2। इस आदेश के कारण, arm64 具 को एक字节 स्वरूप में प्रस्तुत किया जाना चाहिए; अन्य SDK के उपयोग के साथ Mac पर निर्माण विभिन्न फाइलें उत्पन्न करेगा

读取器的 `compare_formats`दो फाइलें并排 तुलना करेंः

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

वास्तविक    `inspect_macho`读取 Mach-O,该工具经由 `xcrun`运行 `otool -h -l``nm -gjU``dyld_info -imports -exports`和 `dwarfdump --uuid`आपके पाठक यंत्र को इन उपकरणों की आवश्यकता नहीं है, लेकिन `otool -l`输出相同 `symoff`和 `stroff` क्षेत्र का `open_binary`工具通过魔数识别 ELF、MZ、PE, तथा单架构或通用Mach-O, भी स्वचालित रूप से पढ़ ले偏移 18 处 `e_machine` यह वही है जो आप यहाँ प्राप्त कर रहे हैं                                                                                                                                                                                                                                                         `format: raw-binary`、 संरचना एवं प्रवेश पता──Ghidra  प्रदाता                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 `0xcafebabe`时也这样处理──

## स्वयं निर्माण

运行仅使用标准库的读取器:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
```

演示读取 `ledger-x86_64-O1.o`, फ़ाइल शीर्षक,节,符号,重定位, फ़ाइल परिचालन मैपिंग; फिर चार फ़ंक्शन के字节串 का आउटपुट,读取`ledger-arm64-O1.o`नहीं आउटपुट तुलना तालिका; अंतिम आउटपुट `tiny-x86_64`के प्रक्रिया शीर्षक ः पूर्वानुमान आउटपुट में शामिल हैंः

```text
percent_change: 16 bytes at file offset 0x40: 85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3
grade: 46 bytes at file offset 0x50: 48 63 c7 48 69 c0 67 66 66 66 ...
entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

传入路径可读取单个文件:`python3 code/main.py code/fixtures/ledger-x86_64-O0.o`△读取器根据前四字节选择 ELF अथवा Mach-O──

按以下顺序阅读 `code/main.py`:

1. `ElfFile._read_header()`检查魔数、类别、字节序和条目大小, फिर फ़ाइल टाँके को डिलीट करें
2. `ElfFile._read_sections()``read_cstring()`读取节头表,并通过 `e_shstrndx`解析名称──
3. `ElfFile._read_symbols()` तोड़ `st_info`, के माध्यम से `sh_link`解析名称,并保持保留节索引可读──
4. `ElfFile._read_relocations()`遍历每一个 `SHT_RELA`节, तोड़ `r_info`,并依据表 4.9 为类型命名──
5. `ElfFile.function_span()``function_bytes()`संकेतन को फ़ाइल दायरे तथा उसके अक्षरों में परिवर्तित करना
6. `ElfFile.file_offset_map()`按偏移排序 प्रत्येक संरचना,并补入未使用空间──
7. `ElfFile._read_program_headers()``address_to_file_offset()`处理可执行文件──
8. `MachOFile`读取文件头, 装载命令, 包含节的`LC_SEGMENT_64``LC_SYMTAB``LC_BUILD_VERSION`, तथा प्रत्येक खंड के पुनः स्थानों को।
9. `compare_formats()`दो दस्तावेजों में से प्राप्त मूल्य को प्रदर्शित करने के लिए एक ही अवधारणा के लिए प्रतिक्रियाएँ।

## इसका उपयोग करें

अगले पाठ्यक्रम में, पहले अपने पाठ्यक्रम के`code`目录加入 `sys.path`, फिर से पारित `from main import ElfFile`导入读取器──第 33 课会请求 `function_bytes`和 `relocations_for(".text")`◊ धारा 35 课将其输出记录用于观察证据―― धारा 36 课获取重定位偏移,以便在字节比较前屏蔽相应位置――

उपयोग समान `clang -target x86_64-unknown-linux-gnu -c`命令,将自己编写的C 编译为目标文件,再用读取器分析―― केवल x86-64 psABI 表 4.9 列出的重定位名称才可添加; केवल gABI अथवा生成文件的工具链文档记载的节类才可添加──遇到没有应名称的值时,读取器打印了十六进制数,而不是猜测──

## 交互实验

### 实验 A:手动读取文件头

`code`目录中启动 पायथन:

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

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `e_type`1`e_machine`62`e_shoff`1064, अर्थात्`0x428`                                                                                                                                                                                                                                                              `.strtab`储储节名称──

### 实验 B: स्विच 背后的值表

```python
rodata = elf.section_bytes(elf.section(".rodata"))
[int.from_bytes(rodata[i : i + 4], "little") for i in range(0x14, 0x28, 4)]
[int.from_bytes(rodata[i : i + 8], "little") for i in range(0x28, 0x50, 8)]
[r for r in elf.relocations_for(".text") if r.symbol == ".rodata"]
```

两张表都读出 `1, 2, 3, 4, 4`对照 `ledger.c`检查:`grade(65)`计算 `65 / 10 - 6 = 0`,读取条目 0, प्राप्त 1,即 `case 6`≈ मूल्य`grade(100)`读取条目 4, प्राप्त 4,即 `case 10``case 9`साम्य उपयोग मूल्य

###  प्रयोग C: एक ही स्रोत के तीन प्रकार के निर्माण

```python
for level in ("O0", "O1", "O2"):
    obj = ElfFile.from_path(FIXTURES / f"ledger-x86_64-{level}.o")
    print(level, [s.name for s in obj.sections if s.name in (".data", ".rodata")])
    print(level, sorted({r.type_name for r in obj.relocations}))
    print(level, {s.name: s.st_size for s in obj.symbols if s.type == "FUNC"})
```

-0  लक्ष्य फ़ाइलें हैं `.data`节和三种重定位类型──-O1 与-O2 目标文件没有 `.data`, और केवल एक प्रकार के प्रकार`total`में -O0 下为 66 字节,-O1 下为 31 字节,-O2 下为 140 字节──

### 实验 D:Mach-O 中的同一函数

```python
from main import MachOFile
macho = MachOFile.from_path(FIXTURES / "ledger-arm64-O1.o")
[(c.name, c.cmdsize) for c in macho.load_commands]
macho.function_span("_percent_change")
macho.function_bytes("_percent_change")[:4].hex()
```

函数范围为文件偏移 648 处的24 字节──前四个字节是 `a0000034`,即指令 `0x340000a0`के छोटे से प्रारूप में,`llvm-objdump -d`् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् `cbz w0, 0x14` यह है `before == 0`                                                                                                                                                                                                                                                              `85 ff 74 09`की जाँच समान है.

## 实践实验

扩展读取器,使其支持已链接程序──在Linux x86-64 机器上,运行 `clang -O1 -shared -fPIC code/fixtures/ledger.c -o libledger.so`, और जोड़ा `main`后运行 `clang -O1 code/fixtures/ledger.c -o ledger_main`, और फिर इन दो फ़ाइलों का विश्लेषण करने के लिए एक पाठक मशीन का उपयोग करें.

要求:

- उपयोग एक ही `Elf64_Sym`布局读取 `.dynsym`, क्योंकि `SHT_DYNSYM`11. और रिकॉर्ड प्रारूप में परिवर्तन नहीं होता है।
- `.dynamic`读取为由 `d_tag`和 `d_val`组成的 `Elf64_Dyn`记录,并依据 gABI गतिशील अनुभाग页面命名 `DT_NEEDED``DT_STRTAB``DT_SYMTAB``DT_RELA`和 `DT_JMPREL`
- `st_shndx``SHN_UNDEF`                                                                                                                                                                                                                                                              `.rela.plt`मध्य `R_X86_64_JUMP_SLOT`记录列为到达它们的调用位置.
- एक लक्ष्य फ़ाइल अनुच्छेद में एक या अधिक अनुभागों के नियमों के अनुसार, प्रत्येक अनुभाग में एक या अधिक अनुभाग शामिल होंगे।`PT_LOAD`段映射到其含的节──
- उपयोग `address_to_file_offset`证明, साझा लक्ष्य फ़ाइल में प्रत्येक परिभाषित फ़ंक्शन के वर्ण और `function_bytes`का रिटर्न वैल्यू समान है।
- दो दस्तावेजों को साझा करना`llvm-objdump -h -t -r -p`和 `llvm-objdump -T`文本采集到 `code/fixtures/`, और परीक्षण में पाठक के साथ आउटपुट तुलना करें

सफलता मानकः आयात सूची, चरण मैपिंग और प्रत्येक कार्य की सीमाएँ इकट्ठा करने के उपकरण के साथ मेल खाती हैं, और परीक्षण के दौरान उपकरण नहीं चल रहे हैं।

## 评分实验

五道关于本课件的题目――आपके द्वारा निर्मित कोड के साथ प्रत्येक उत्तर का पता लगाएं, फिर लिखें `code/lab_answers.json`数字写成数字, या लिख成 `"0x40"`इस प्रकार के षट् षट् षट् षट् षट् षट्; सूची को JSON 列表 में लिखा गया है।

1. `t1`: लेजर-x86_64-O1.o का ई_शोफ,写成数字──
2. `t2`: लेजर-x86_64-O1.o मध्य प्रतिशत_बदला का st_size──
3. `t3`:ledger-x86_64-O1.o 中 .text 的文件偏移,写成十六进制──
4. `t4`: लेजर-x86_64-O0.o 中的重定位类型名,排序后写成列表──
5. `t5`:ledger-x86_64-O1.o 中 .rodata+0x14 处的五个 int 值,写成列表──

检查你的答案:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/lab.py
```

检查器在已提交的固定 上使用 `code/main.py`计算每期望值── यह प्रति题输出 `PASS``FAIL`या `TODO`और कुल मिलाकर, केवल पांच प्रश्न पूरे समय से ही 0 से बाहर निकलते हैं।`python3 code/lab.py my-answers.json`एक और फाइल को चेक करें।`code/tests/test_lab.py`证明检查器 सही उत्तर स्वीकार करें并拒绝错误答案──

### देखो यह काम करता है

[Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler)机器把本课作为它的前两个工位来运行――卷盘读取存放 `percent_change`लक्ष्य फ़ाइल के शीर्ष, कैबिनेट खुला`.text`并读取这个符号──关闭 प्रतीकों, आप देख सकते हैं कि क्या तथ्य प्रतीकों द्वारा प्रदान किए जाते हैं──

## 本课产物

本课产 出 `outputs/skill-program-anatomy-elf-from-scratch.md` इसे क्लाउड, कोर्सर, कोड, ओपनक्लाव, हर्मेस या किसी भी SKILL.md के पढ़ने वाले स्मार्ट शरीर के लिए उपयोग किया जा सकता है। यह कौशल उपयोगकर्ता द्वारा निर्मित संकलन लक्ष्य फ़ाइल या निष्पादित फ़ाइल को एक लेआउट रिपोर्ट में परिवर्तित करेगा, प्रत्येक संरचना, प्रतीक और पुनर्स्थिति फ़ाइल दायरे को प्रदान करेगा, और सर्वेक्षण संग्रह के उपकरण के लिए आउटपुट सत्यापन करेगा।

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

测试套件验证 निम्नलिखित तथ्य:

- तीन x86-64  लक्ष्य फ़ाइलें एवं सूक्ष्म निष्पादन योग्य फ़ाइलों में, प्रत्येक खंड का सूचकांक, नाम, आकार, पता और प्रकार और संग्रह`llvm-objdump -h`文本一致
- प्रत्येक प्रतीक का मूल्य, बंधन, प्रकार, संबंधित खंड, आकार और नाम सभी संग्रह के साथ हैं`llvm-objdump -t`文本一致
- प्रत्येक पुनर्स्थान के विस्थापन, प्रकार के नाम, प्रतीक और संकेतक के साथ संग्रह`llvm-objdump -r`文本一致,包括 -O0 下的 `R_X86_64_PLT32`和 `R_X86_64_64`
- `tiny-x86_64`दोनों प्रक्रियाएं एकत्रित हैं।`llvm-objdump -p`文本一致, जबकि लक्ष्य文件 कोई प्रक्रिया सिर नहीं है
- `percent_change`位于文件偏移 `0x40`,长度 16 字节,字节 अनुरूप अपेक्षित, और प्रत्येक फ़ंक्शन स्थित है `.text`अंदर
- 文件偏移映射恰好覆盖每件的每字节一次,且 -O1 目标文件的三对齐空隙位置正确
- `tiny-x86_64`                             `PT_LOAD`映射到文件偏移 `0xb0`, और पुनः स्थगित लक्ष्य फ़ाइल अस्वीकार
- मच-ओ 文件头、 प्रत्येक लोड आदेश、段、五节、`LC_SYMTAB`和 `LC_BUILD_VERSION`शहर एवं संग्रह`--private-headers`文本一致
- मच-ओ 符号与15 条重定位都与采集的`llvm-objdump`文本一致,且 `_percent_change`位于偏移 648,长度 24 字节
- 错误魔数、32位类别、大端文件、截断表、通用二进制文件和C 源文件都触发 `FormatError`
- `build_tiny_elf.py`逐字节复现已提交的 `tiny-x86_64`
- 图示模块 `site/figures-re-32.js`包含 `ledger-x86_64-O1.o`的准确字节

## उत्पादन वातावरण में विफलता मोड

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

读取可信的文件头,沿其偏移定位结构,并根据定义字段的规范为每段命名. 读取可信的文件头,并根据定义字段的规范为每段命名. 读取可信的文件头,并根据定义字段的规范为每段命名. 读取可信的文件头,并根据定义字段的规范为每段命名. 读取可信的文件头,并根据定义字段的规范为每段命名. 读取可信的文件头,并根据定义字段的规范为每段命名. 读取可信的文件头,并根据定义字段的规范为每段命名. 读取可信的文件头,并根据定义字段的规范为每段的规范为每段的规范,并根据规范为每节核对的规范为每节的规范为某个值命名.

## 延伸阅读

- [System V gABI, 第 4 章：目标文件](https://www.sco.com/developers/gabi/latest/ch4.intro.html)के साथ[ELF Header](https://www.sco.com/developers/gabi/latest/ch4.eheader.html),[Sections](https://www.sco.com/developers/gabi/latest/ch4.sheader.html),[Symbol Table](https://www.sco.com/developers/gabi/latest/ch4.symtab.html), के साथ[Relocation](https://www.sco.com/developers/gabi/latest/ch4.reloc.html) पृष्ठ
- [System V gABI, 第 5 章：程序头](https://www.sco.com/developers/gabi/latest/ch5.pheader.html)[Dynamic Linking](https://www.sco.com/developers/gabi/latest/ch5.dynamic.html)
- [System V ABI, AMD64 Architecture Processor Supplement](https://gitlab.com/x86-psABIs/x86-64-ABI), तालिका 4.9: पुनः स्थलांतरण प्रकार
- [Apple XNU `loader.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h),[`nlist.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/nlist.h), के साथ[`reloc.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/reloc.h)
- [17 U.S.C. 1201](https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title17-section1201&num=0&edition=prelim)[Directive 2009/24/EC](https://eur-lex.europa.eu/eli/dir/2009/24/oj/eng)
- [Sega v. Accolade, 977 F.2d 1510](https://law.resource.org/pub/us/case/reporter/F2/977/977.F2d.1510.92-15655.html)[Sony v. Connectix, 203 F.3d 596](https://law.resource.org/pub/us/case/reporter/F3/203/203.F3d.596.99-15852.html)
- [rea 6.5.0 `docs/binary-diagnostics.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/binary-diagnostics.md)[`docs/ghidra-provider.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/ghidra-provider.md)
