# 超越原生代码:Python、JVM、.NET 与 WebAssembly 字节码

> 字节码文件既包含程序,也包含编译器对程序的记录;本课将构建读取器,揭示每种容器保留的记录.

**Type:** Build
**Languages:** Python, Java, C#, WebAssembly text
**Prerequisites:** 第 13 阶段 · 32（从零实现 ELF）、33（反汇编与控制流）
**Time:** ~150 分钟

## Öğrenme hedefi

- PEP 552 读取 `.pyc`16 字节头部, ve kullanmıyor `marshal`模块 durumunda,反序列化四个解释器版本写出的代码对象──
- JVMS Bölüm 4'e göre JVM 类文件leri çözmek,`Code`属性 ve `javac -g`添加的表──
- Çekilme`Ledger.class`Orta JVM işletim kodu, aynı kaynak kodunun dört yapılandırması ile birbiriyle karşılaştırılır.`javap -c`Çıkışlı bir çekim.
- 逐节读取 WebAssembly 模块,解码每个函数体,并与 `wasm-objdump -d`核对结果──
- NET programları biriminde PE veri defterinden `MethodDef`行及各方法的CIL,并使用ILSpy 所使用的读取库核对──
- Aynı işlevi beş konteynerdeki gösterileri karşılaştırın, her biçimin hangi isimleri, tipleri ve kontrol yapısını kaybettiğini ölçün.

## 问题

Sen inşa ettin.`ledger.py`ve `__pycache__`Çıkışlar`ledger.cpython-314.pyc` Sizce bu dosyanın içeriği nedir?  Akıllı bedenler, bir bilgisayar, bir araç, bir araç, bir araç, bir araç, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar, bir bilgisayar,`Unsupported opcode`, bir satır da yazdırmış .`# WARNING: Decompyle incomplete`智能体 因此断言文件经过混──

文件并没有混──它的前两个字节是 `2b 0e`,即小端字 3627── bu CPython 3.14 写入的数值, karşı kompilatörün işletim kodu sadece 3.13 支持──过时是工具──智能体没有读取头部,因此无法分辨两者──

33 Sınıf orijinal kodun kaybedilen içeriği: parametre, tip ve atlama çizelgesine dönüştürülmesini gösterir.`switch`△ 字节码容器丢失了更少,而且各不相同──pyc保留每个变量名,却不保留类型──类文件保留类型,只有你明确要求时才保留局部变量名──Wasm 模块保留控制结构,却丢弃名称,除非自定义节携带这些名称──.NET 程序集把参数名放在表中,而局部变量名留给独立文件──只有先知道容器原本能携带哪些记录,针对评价反编译器的输出──

Bu ders Python standards library kullanılarak dört okuma makinesi oluşturur. Her okuma makinesi ilk bölümden okuyucuyu okuya başlar, bir işlevi listeler ve oluşturduğunuz test örneğinde bu biçimdeki kendi aletlerini onaylar.`ledger``grade`Ve bir diğerine karşılaştır.

```figure
re-43-five-containers
```

## pyc 头部由四个字组成

PEP 552 将头部定义为四个32位字. 第一个是魔数, 第二个是位字段.`check_source`Açıklayıcı: giriş zamanı kaynak kod hesaplama için 0. bit 0. bit, üçüncü ve dördüncü kelimeler arasında kaynak kod değiştirme zamanı mtime 和源码大小; 0. bit 1. bit, kaynak kodunun 64 bit depolanması SipHash。

魔数定義在 `Include/internal/pycore_magic_number.h`3.11'den itibaren, kural Python 3.n'dir. 2900 + 50n'den itibaren, yayın döngüsü içinde her kez karakter kodunun değişmesi eklenecektir.`\r\n`Python 3.15.0 2026-10-09'da yayınlandı, ancak bu örneklerin makineleri onu yüklemedi, bu nedenle bu değer başrak dosyasından, burada gerçek dosya değil, başrak dosyasından geliyor.

样本为每个解释器保留两份 pyc──`compile_pyc.py`Kullanım`py_compile.compile(..., dfile="ledger.py")`写入文件,使存储的文件名为 `ledger.py`, yapım makinesi üzerinde yolları değil,

```text
checked-hash   2b 0e 0d 0a  03 00 00 00  c7 16 c7 fc c5 1d 81 01
timestamp      2b 0e 0d 0a  00 00 00 00  8d 60 cf 6a  f1 01 00 00
```

逐字读取时间头部──`03 00 00 00`Ya da`00 00 00 00`- Evet.`8d 60 cf 6a`0x6acf608d = 1791975565, yani yapılandırma dosyası`ledger.py`Zamanı...`f1 01 00 00`497 için, dört açıklayıcı başlıkları içeriği aynıdır:

| 解释器 | 魔数字节 | 字值 | 文件字节数 | `grade.co_code` 字节数 | `grade` 指令数 |
|---|---|---|---|---|---|
| 3.11.14 | `a7 0d 0d 0a` | 3495 | 1054 | 80 | 31 |
| 3.12.12 | `cb 0d 0d 0a` | 3531 | 937 | 62 | 26 |
| 3.13.12 | `f3 0d 0d 0a` | 3571 | 943 | 70 | 26 |
| 3.14.6 | `2b 0e 0d 0a` | 3627 | 965 | 96 | 35 |

`code/main.py`Orta `read_pyc_header()`Bu bölümlere geri dönüp, "MOR Digital Identification Version"e göre...`importlib.util.MAGIC_NUMBER`给出当前运行解释器对应的相同四字节──`python3 code/main.py compare`Kullanım `PATH`İçinde buldukları her biri`python3.11`- Evet .`python3.15`编译源码,并将读者看到的头部与各解释器报告的自信息并排输出──

## Şerif 逐字段写入代码对象

Her numunenin 16. satırı da bu .`e3`,即 `0x80 | ord('c')`Bu ayarlandı.`FLAG_REF`Bu nesneyi hatırlatmak için okuyucuya söyleyin.`r`引用──marshal 文档明确表示,该格式刻意不提供文档,且代码对象不跨版本兼容──`Python/marshal.c`列出了类型码:`N`Hiç gösterme,`i`32 位整数 göster,`s`Gösterme`z`和 `Z`Kısa ASCII 字符串,`(`和 `)`Gösterme grupları`c`Gösterme kodı:`r`Bu sırayı, bir daha ele almak için, bir daha bir daha kullanmak için kullanılır.

`w_complex_object()`固定 sırada yazmak için kod nesne.`argcount`- Evet.`posonlyargcount`- Evet.`kwonlyargcount`- Evet.`stacksize`- Evet.`flags`;再以对象写入 `code`- Evet.`consts`- Evet.`names`- Evet.`localsplusnames`- Evet.`localspluskinds`- Evet.`filename`- Evet.`name`- Evet.`qualname`Sonra da ...`firstlineno`Sonunda .`linetable`和 `exceptiontable`◊ 17 字节开始手动解码 3.14 文件的模块代码对象:

```text
00 00 00 00   argcount 0
00 00 00 00   posonlyargcount 0
00 00 00 00   kwonlyargcount 0
01 00 00 00   stacksize 1
00 00 00 00   flags 0
f3 22 00 00 00   type 's' with FLAG_REF, 34 bytes of co_code follow
80 00  52 06  74 00  52 01  17 00  74 01 ...
```

代码中每条命令占两字节:`80 00`Evet .`RESUME 0`- Evet .`52 06`Evet .`LOAD_CONST 6`- Evet .`74 00`Evet .`STORE_NAME 0`- Evet .`17 00`Evet .`MAKE_FUNCTION`◊ örneklerin 3.14 清单输出相同的五条模块级语句──`code`Sonra dört adet modem kodlu nesneyi içerir.`names`- ...`('LABELS', 'percent_change', 'grade', 'total', 'grade_label')`- Evet.

`code/main.py`Orta `Unmarshaller`Bu düzeni, 3.9 ve 3.10 kullanılmış eski düzeni okuyabilirsiniz; sonraki `nlocals`- Evet.`varnames`- Evet.`freevars`和 `cellvars`设为独立字段──它构造一个 `CodeObject`, gerçek nesne ile aynı özellik isimlerini kullanmak.`varnames`- Evet .`localspluskinds``CO_FAST_LOCAL`位选 `localsplusnames`❖ 4 dosyanın her birine`grade`Geri döndü.`('score', 'bucket')`、 değer 10  `firstlineno`Haksızlıktan`linetable`测试 `test_unmarshaller_agrees_with_the_running_interpreter`针对当前解释器写出的文件,将每个字段与 `marshal.loads()`Diğer üç dosya bizim kodumuzda okunur ama mevcut açıklayıcı tarafından okunamaz.`marshal`- Ne?

## Çekil açıklayıcı, dört sınıf 字节码

Bu 文档 her versiyonda aynı uyarı var: 字节码是CPython'un实现细节,不保证保持不变──这些样本展示了这句话对十一行Python的意思为什么──每个解释器的`python3.1N -m dis ledger.py`输出都已保存──

3.11 İçinde`grade`Başlangıç aşağıda:

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

`BINARY_OP`位于偏移 6,下一条指示位于 10──中间两字节是 PEP 659 专门化自适应解释器引入的内联缓存项──偏移 16 的 `COMPARE_OP`后是偏移22的命令, bu yüzden iki缓存项yi ele alır.`show_caches=True`Bu durumda kayıplar gizlenmiş olacak.`LOAD_CONST` 加`RETURN_VALUE`替换为 `RETURN_CONST`,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `POP_JUMP_IF_FALSE`,使 `grade`80 字节den 62 字节 ∞ 3.13 输出标签 `L1`- Evet .`L4`Değişiklik değil, emretme yolları gösterir.`-C`Gösterilen hareket`-O`3.14 Ayrıca kaldırıldı`RETURN_CONST`,加入 `LOAD_SMALL_INT`和 `LOAD_FAST_BORROW`, ve her koşuldan sonra `NOT_TAKEN`- ...

```text
 12         20       LOAD_FAST_BORROW         1 (bucket)
            22       LOAD_SMALL_INT           9
            24       COMPARE_OP             188 (bool(>=))
            26       CACHE                    0 (counter: 0)
            28       POP_JUMP_IF_FALSE        3 (to L1)
            30       CACHE                    0 (counter: 0)
            32       NOT_TAKEN
```

`-C -O`清单显示 `grade`13 tane var .`CACHE`项:`BINARY_OP`Son beş tane, her biri.`COMPARE_OP`Sonraki, her biri`POP_JUMP_IF_FALSE`Sonraki:  Öz-İdelleme örneği bu depoların kullanımını gösterdi.`dis.dis(grade, adaptive=True)`Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çizgi Çiz`RESUME`和 `COMPARE_OP`Yer çıkışı`RESUME_CHECK`和 `COMPARE_OP_INT`... ve ...`total`Çıkış`FOR_ITER_LIST`- Evet.`BINARY_OP_ADD_INT`和 `JUMP_BACKWARD_NO_JIT`◊ özel biçim aynı grupta mevcuttur.`co_code`字节中──c 永远不包含它们,因为专门发生在内存中──

Bu yüzden, bir bilgisayarın üst sınırlı sürümü var. 3.9.3  açıklama Python 1.0'dan 3.8'e kadar olan yazı kodunu kabul eder. 3.9.3 3.9.3  okuyun 3.7 ve 3.8                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `python_3_13.cpp`, Bilinmeyen işlem koduna rastlanırken çıkış .`Unsupported opcode`并标记结果不完整──PyLingual 声称支持3.6 起所有已发布版本,并使用3.8 至 3.15 的解释器重新编译、检查自己的输出──对于3.14 文件,前三者会拒绝或失败,只有后两者适用──选择工具前先读取魔数字──

## 类文件保存了自己的字典

JVMS Java SE 25 Bölüm 4.1 节将布局定义为一个结构:`magic`- Evet.`minor_version`- Evet.`major_version`- Evet.`constant_pool_count`- Sürekli bir miktar.`access_flags`- Evet.`this_class`- Evet.`super_class`、接口、字段、方法、属性──魔数是`0xCAFEBABE`Java SE 25 虚拟机接受 45 至 69 的主版本号,次版本号 65535 则表示预览特性文件。`Ledger-g.class`Önceki Krusluk:`ca fe ba be 00 00 00 41 00 5e`Java 21 için: main version 65`0x5e`= 94 is the usual quantity.`Ledger-jdk25.class`E`ca fe ba be 00 00 00 45`Başlangıç, ana versiyon 69

常量池は, kendi kitaptaki dosya depoları yeridir.`-g`构建中的条目 `#13`Evet, bir tane.`Methodref`, 指向类`#8`和名称与类条目 `#14`İndeksler üzerinde bulurum.`Ledger.grade:(I)I`,与 `javap -v`- Evet .`//`后输出的内容完全一致──描述符 `(I)I`Birini göster`int`参数 ve bir `int`Geri dönüş değeri.`total``([I)I`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `int`4.10 Bölüm'de belirtilen verifier, kurallarla uyumsuz olan belgelerden reddedecektir.`code/main.py`Orta `ClassFile`类读取表 4.4 全部17 常量标签,并将一个 `Long`Ya da`Double`计为两个槽位――未知标签或最后一个属性后的余字节遇见时,它会抛出异常――

属性可附在类,每个字段,每个方法以及`Code`属性自身上──JVMS 虚拟机忽略不认识的属性要求,因此添加或移除调试表不必改变方法体──javac 手册说明:`-g`Doğuştan yerel değişken içindeki tüm düzenleme bilgileri, sadece oluşturulan numara ve kaynak dosya bilgileri,`-g:none`则什么都不生成──三种构建测得的结果如下:

| 构建 | 字节数 | 常量池计数 | `LineNumberTable` | `LocalVariableTable` | `SourceFile` | `grade` 代码字节数 |
|---|---|---|---|---|---|---|
| `javac -g` | 1832 | 94 | 7 个方法 | 6 个方法 | 有 | 50 |
| `javac` | 1581 | 82 | 7 个方法 | 无 | 有 | 50 |
| `javac -g:none` | 1404 | 79 | 无 | 无 | 无 | 50 |

Üç dosya içinde .`grade`Bu 50 kod yazısı tamamen uyumlu, test de kontrol edeceğim.`-g`Çı`grade`增加的是一行 `LocalVariableTable`:起点 0、长度 50、槽位 0、名称 `score`、 tanımlayıcı `I`                                                                                                                                                                                                                                                              `int`0'luk bir yerin kendiliğinden yapılması gerekir.`StackMapTable`, çünkü test cihazı buna ihtiyaç duyuyor;`BootstrapMethods`属性也保留,因为 `main`- Evet .`invokedynamic`拼接字符串──

## Çıktıran masa anahtarı

JVMS 6. bölüm her yönlendirmeyi bir işletim kodı karakter ve bu işletim kodunun belirtilen işletim sayısı olarak tanımlar.`tableswitch`和 `lookupswitch`开头包含零至三个填充字节,使其32位操作数起始地址为四的倍数──

`Ledger-g.class`İçeride`grade`Şöyle yazıyor:

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

Üç yüz altı satır, bir emir, tam anlamıyla ifade ediyor.`switch (score / 10)`, 9 ve 10 ortak kullanımlı bölgeleri içerir.`switch`Bu yüzden, bu konunun temel yapılarının sınırı kontrolü gerekiyor.`lea`Bir yazı.`movslq`Bir yazı.`add`、 bir kez dolaylı olarak atlamak, ve diğer bölümdeki beş yeniden konumlandırma noktası.

`disassemble_jvm()`覆盖全部 202 已定义操作码及其操作数宽度,填充规则,并以`javap`Yapılan işlemlerin sayısı:`compare_with_javap()`解析保存的 `javap -c -p`文本,包括多行 `tableswitch`块,并检查每条命令的偏移、助记符和操作数──四种构建的108条命令全部一致──测试`test_branch_offsets_are_relative_to_the_branch_instruction`检查 pc 1 的 `ifne`6 ̊13 ′ye kadar atlayın.`if_icmpge`33'e kadar atlayıp 30'a kadar atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp atlayıp`goto`10'u at.

Bu dersler için aynı dosyaları da okuduk.`rabin2 -I`Rapor`arch java`- Evet.`lang java 21`- Evet.`linenum true`和 `lsyms true`, versiyon ve iki test tablosunun farkını ortaya koydu.`pd 14 @ sym.Ledger.grade`输出 `tableswitch`, 5 hedef doğrultusunda kullanmadı.`Unable to parse code attribute: 2`Bu kendim belirlediğim bir sınır.`javap`Bu biçimdeki kompleterler Python'a kıyasla daha olgunlaşmıştır. CFR 0.152 MIT lisansıyla Procyon 0.6.0 ve Vineflower 1.12.0 ile Apache 2.0 kullanılmıştır. Vineflower, Java 21'in Fernflower'i desteklemektedir.

## Wasm 模块 bir dizi bölümdür

核心规范将模块定义为前导字节 `00 61 73 6d 01 00 00 00`,即字符串 `\0asm`和版本 1, sonra bir dizi bölüm. Her bölüm bir tanımlama bölümünden oluşur.`u32`Büyüklük ve içerik oluşturur. Tanım 1 ila 13 bilinen bölümdür, her türde en fazla bir kez ve sırayla sırayla ortaya çıkar. Tanım 0 isimli bir özeti bölümüdür.`e4 00`100'e.`80 08`1024 için.`ledger.wasm`运行  İşlem`wasm-objdump -h`7 bölümden bir araya gelmek,`WasmModule`找到的七节节及其负荷偏移完全相同:

| 节 | 载荷范围 | 数量 | 为 ledger 保存的内容 |
|---|---|---|---|
| 类型 | 10 至 26 | 3 | `(i32) -> nil`、`(i32, i32) -> i32`、`(i32) -> i32` |
| 导入 | 28 至 39 | 1 | 类型为 0 的 `env.log` |
| 函数 | 41 至 46 | 4 | 每个已定义函数的类型索引 |
| 内存 | 48 至 51 | 1 | 一页，无最大值 |
| 导出 | 53 至 110 | 5 | `memory` 和四个函数名 |
| 代码 | 113 至 271 | 4 | 大小为 23、63、44 和 23 字节的函数体 |
| 数据 | 273 至 290 | 1 | 位于偏移 1024 的 `F\0D\0C\0B\0A\0` |

函数节与代码节分离, browser'ın tüm dosya ulaşmadan önce, oluşturmaya başlaması için 函数节与代码节分离, 为了让浏览器在整个文件到达之前就就开始编译――每个代码条目包括大小、局部变量声明向量和表达式――`grade`Yerel değişim ve `01 7f`Bir grup bir `i32`İşte bu.`bucket`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,

控制流 from construction up is structured.                                                                                                                                                                                                                                                          `block`- Evet.`loop`Ya da`if`结构──标签按嵌套深度索引──`br_table`通过索引标签列表的操作数执行间接分支──解码文件偏移 `0xa3`- Ne ?`grade`Çıkış:

```text
0e                  br_table
0b                  11 labels follow
04 04 04 04 04 04   buckets 0 to 5: label 4, the outermost block, returns 0
03 02 01 00         buckets 6, 7, 8, 9: labels 3, 2, 1, 0
00                  bucket 10: label 0, shared with 9
04                  default label 4
```

Her etiket derinliktir. 0 en iç katıdır.`block`,其 `end`后的代码是  后的代码是`i32.const 4`Sonra kullan .`br 4`跳出结果块──表前的六条  跳出结果块──表前的六条`block`Önderlik 十一标签和表后五条 `br`Örgüt tümü oluşturdu.`switch`, tescilci, yapıdan herhangi bir ayrımını reddedecektir.`disassemble_wasm()`- Evet. - Evet.`wasm-objdump`Bir şekilde kısaltılır; kapsamını oluşturuyor.`unreachable`- Ne ?`i64.extend32_s`Her bir karakterin işletim kodunu ve iki türden yapılandırma içinde kalır ve korunur.`wasm-objdump -d`输出实现 77 条 命令全部一致──

Normal modular terk edilmiştir.`wasm-objdump`仍会输出 `<grade>`, çünkü aktarım bölümleri bu karakterleri işlevi indeksine 2 olarak görüntüleyecek, okuyucu da öyle olacaktır.`wat2wasm --debug-names`添加名为 `name`Bu bölümde modül adı, işlevi adı ve yerel değişim adı yer alır.`{0: 'score', 1: 'bucket'}`,为函数 3 找到 `{0: 'values', 1: 'count', 2: 'sum', 3: 'i'}`- Evet.`wasm-strip`Bu bölümden yeniden çıkarılabilir.`.debug_*`Özdefini节嵌入;`sourceMappingURL`Özdefini节可指向源码映射,其列号表示二进制中的字节偏移──

工具生态  2026 yılında değişim yaşandı  2026-09-15                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `wasm-decompile`Bu makinede bir ev broşürü var.`print`- Evet.`objdump`和 `demangle`◊Binaryen versiyonu_133 提供 `wasm-dis`△Radar2 6.2.4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `rabin2 -I`Rapor`arch wasm`- Olacak.`grade`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0x8e`... ve ...`wasm-objdump`Büyük küçük bir bölümden başlayan bir işareti belirlemek`0x8b`                                                                                                                                                                                                                                                              `get_local`- Evet.`set_local`Üretim ve ihracat etiketleri sayısı `brtable 11 4 4 ...`◊ üç araç okuyucuların yazı tipi aynı, yazısı farklıdır, bu nedenle karşılaştırma sırasında hangi araç tarafından üretilen yazılarını açıklamak gerekir.`wasm-core-2`Sayfa ページ is 日期为 2026 年 10 月 13 日的候选推草案, özet 3.0 版本 olarak tanımlanır; editör drafı da aynı günün tarihlerini işaret eder.

## ECMA-335 E-Data Projesi Kendiliğinden Veritabanı

.NET 程序集是PE 文件──`LedgerNet.dll`E`MZ`Başlık, içeren isim`.text`- Evet.`.rsrc`和 `.reloc`Üç bölüm,                                                                                                                                                                                                                                                              `0x14c`, çünkü bir düzenleyici platform ile ilgili kod oluşturur. Seçilebilir başlıkların veri defteri 14, yani CLR                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    `0x2008` ECMA-335 II.25.3.3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

```text
48 00 00 00   Cb 72
02 00 05 00   MajorRuntimeVersion 2, MinorRuntimeVersion 5
78 21 00 00   MetaData RVA 0x2178
84 07 00 00   MetaData size 1924
01 00 00 00   Flags: COMIMAGE_FLAGS_ILONLY
05 00 00 06   EntryPointToken 0x06000005, MethodDef row 5, which is Main
```

RVA `0x2178`处的元数据根以签名 `42 53 4a 42`Başlangıç, okuyucu`BSJB`, sonra 1.1 ve karakterler `v4.0.30319`Sonra beş tane akıntı var.`0x6c`- Ne ?`#~`, ve `#Strings`- Evet.`#US`- Evet.`#GUID`和 `#Blob`II.24.2                                                                                                                                                                                                                                                             `#~`Bir başı var.`HeapSizes`字节, burada为零, bu yüzden her 字符串、GUID 和 blob 索引都占两字节; başka bir 64 位 vardır `Valid`掩码,标识存在表;;其中14位被置为1:

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

Yapılan işlemler, herhangi bir yerde depolanmamıştır.`HeapSizes`︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ `CliAssembly`Bu kurallara ve çizgi sayısına göre, 14 çizgi biçiminin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin biçimlerinin ölçüleri ile ölçüleri ile ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçüleri ölçülmüştürlü ölçülüğün ölçülüğüne göre doğru ölçülmüştürlü bir ölçülüğün ölçülüğün ölçülüğüne göre ölçülüğün ölçülüğün ölçülüğün ölçülüğüne göre ölçülüğün ölçülüğün ölçülüğün ölçülüğün ölçülüğün ölçülüğüne göre ölçülüğün ölçülüğün ölçül bir ölçülüğün ölçülüğün ölçülüğün ölçülüğün ölçül bir ölçülüğün ölçül bir ölçülüğün ölçülüğün ölçülüğün ölçülüne göre ölçül bir ölçül bir ölçülüğün ölçülüne göre ölçülüğün ölçül bir ölçülüğün ölçül bir ölçülüğün ölçülüğün ölçülüğ

III.1.9 定義令牌:高字节表示表,低三个字节表示从 1 开始的行号──`0x06000002`Evet .`MethodDef`Bölüm 2 ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ `0x2060`, 名前称`Grade`,签名 blob 为 `00 01 08 08`:默认调用约定、一个参数、返回 `int32`、参数为`int32`- Onun.`ParamList`Yönlendirme`Param`第 3 行,其名称为`score`◊ Param 表使 ILSpy 能从剥离后发布构建中输出 `Grade(int score)`│RVA │`0x2060`Yöntem:

```text
13 30         flags 0x13: fat, init locals; size 3 dwords
02 00         MaxStack 2
2d 00 00 00   CodeSize 45
01 00 00 11   LocalVarSigTok 0x11000001
```

`StandAloneSig`第 1 行  Kaydet`07 01 08`- ...`LOCAL_SIG`Bir bölge değişimi.`int32` Yerel değişkenlerin adı ve adı yoktur. ECMA-335 bölüm V'de调试交换格式中保存局部变量名.NET SDK'da PDB'ye yazılır.`DebugType`Hiçbir yapı yok, bu yüzden hiçbir tablo veya belge taşıyan bir isim yok.`bucket`- Evet.`PercentChange`则使用微型头部:首字节 `3a`Çı`0x0e << 2 | 2`, gösterir 14 字节的方法体,没有局部变量,默认深为8──

`Grade`45 个代码字节使用第3 部分的操作码表解码──`switch`Operasyon kodu için`0x45`Sonraki .`u32`计数, ve相应 sayısı `int32`目標, they are relative to the following:

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

编译器在 `switch`Daha önce 6'ı düşürmüştüm, bu yüzden 6'ın ilk hedefiydi.`disassemble_cil()`通过表解析并呈现令牌:`ldsfld Labels`- Evet.`call Grade`- Evet.`call System.Console::WriteLine`, ve de `#US`- Evet .`ldstr ' '` Bu sonuçların temeli `MetaDump`, ISSpy içi kullanımı bazında örnekler`System.Reflection.Metadata`编写的简短C#程序──它输出每张表的行数、大小和偏移,每个方法的RVA、签名、参数名和IL 字节,以及`System.Reflection.Emit.OpCodes`Bu da bir şey.`compare_with_metadump()`Tüm 246 kontrol birliği.`prefix`Bu ders için 219 ders vardır, çünkü III.2.2'de bulunmaktadır.`no.`, ve Emit 表从未包含它──

Bu biçimdeki araçlar şunları içerir:ILSpy 11.0(MIT  izin,2026-08-12  yayın) Avalonia üzerinden 桌面构建在 macOS 上运行──`ilspycmd`11.1.0.9782  kullanım`-il`输出 IL,使用 `-m 0x06000002`按令牌选择方法──dnSpyEx 6.6.0 继续维护 dnSpy,但只支持Windows──IL 反汇编器 `ildasm`以 NuGet 包提供,而不随 SDK 内置──radar2 6.2.4 也读取元数据:`rabin2 -I`Rapor`arch cil`和 `class PE32`- Evet .`is`列出 `Ledger.Grade(int:score):int`Bu yapıta hiçbir CIL anti汇编器 yok. .NET SDK 8.0.205'i kullanıyor. Bu yapıtaş makinesi bu SDK'yi kurduğu için yapıtaşlanmıştır. .NET 10 2025-11-11'den itibaren mevcut sürüm haline gelmiştir.

## Her bir konteyner neyi saklıyor ?

Beş tane tane tane tane.`grade`Aynı tabloda.`python3 code/main.py keeps`, bu örnek çalıştırıcı için geçerli olacaktır:

| 容器 | 函数体字节数 | 函数名 | 参数名 | 参数与返回类型 | 局部变量名 | 行号 | 控制流 |
|---|---|---|---|---|---|---|---|
| ELF 目标文件，clang -O0 | 118 | `.symtab` 中的 `grade` | 无 | 无 | 无 | 无，没有 `.debug_*` 节 | 5 次跳转及 1 次经过重定位表的间接跳转 |
| CPython 3.14 pyc | 96 | `co_qualname` | `score` | 无 | `bucket` | `co_linetable`，首行为 10 | 4 对比较及 `POP_JUMP_IF_FALSE` |
| JVM 类，`javac -g` | 50 | 常量池 | `LocalVariableTable` 中的 `score` | `(I)I` | 参数以外无其他名称 | `LineNumberTable`，6 行 | 1 条 `tableswitch` |
| WebAssembly | 63 | 导出节 | 仅在有名称节时存在 | `(i32) -> i32` | 仅在有名称节时存在 | 无 | 6 个嵌套块、1 条 `br_table`、4 条 `br` |
| .NET 程序集 | 45 | `MethodDef` | `Param` 中的 `score` | `static int32(int32)` | 无，只有 `StandAloneSig` 中的类型 | 没有 PDB 则无 | 1 条 `switch`、1 条 `br.s` |

Bu tablo, göreceğiniz karşı yorumlama sonuçlarını açıklıyor.`int total(const int *, int)`Ghidra'dan gelen bir sonucu .`int total(long param_1, uint param_2)`Buna göre, orijinal kod bu sıradaki bilgileri saklamamıştı. Ancak tüm isimlerini saklamamıştı. Bu nedenle, kontrol akımı, sürüm değişimleri ile şekil değişiminin atlamasıdır. Python Anti-Corrector'ın sürüm değişimleri nedeniyle başarısız olması nedeniyle, doğrudan adı yeniden sağlanabilir.`-g`时保留名称,并用一条命令表达 `switch`❖Vasam 模块在构造上保留结构,因此 `wasm2wat`Kayıpsız geri dönüşü gerçekleştirmek için, tek kaybedilen, adı.NET 程序集保留的描述最完整, çünkü元数据表有规范性,但局部变量名仍然需要PDB──

Bu tablo, anti-kompilatörün kullanabileceği neyi, ayrıca hangi çıkışlar kaydedilmiş gerçekleri kopyaladığını, hangileri de tahmin ediliyor. ILSpy çıkışındaki parametrelerin adı kopyalanmıştır; aynı çıkıştaki yerel değişkenlerin adı, PDB'yi sağlayamadıkça, tahmin ediliyor.

## 动手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats
python3 code/main.py
```

输出 bir JSON raporu.`grade`Bu, her türlü dosya yapılandırması için bir sürüm ve biçim oluşturur.`javap`                                                                                                                                                                                                                                                              `wasm-objdump`Sistem.Reflection.Metadata'nın uyumluluğu. Sonunda bilgi saklama tablosu ve`PATH`İçinde bulunulan açıklayıcılar listesi:

按以下顺序阅读 `code/main.py`- ...

1. `Reader`保存游标和整数宽度──`uleb()`和 `sleb()`LEB128 读取器──
2. `read_pyc_header()`- Evet.`Unmarshaller`和 `PycFile`读取 pyc。`parse_dis_text()`读取保存的 `dis`清单, bu nedenle çapraz versiyon oranı test sırasında dört açıklayıcı yüklemek zorunda değildir.
3. `ClassFile`读取类文件,`disassemble_jvm()`解码其中的代码──`parse_javap_code()`和 `compare_with_javap()`负责基准核对――
4. `WasmModule`读取各节,`disassemble_wasm()`解码表达式并跟踪深度──`compare_with_wasm_objdump()`负责基准核对――
5. `CliAssembly`遍历 PE、CLI 头部、元数据根、流和表──`TABLE_SCHEMAS`ile`CODED_INDEXES`İ.22 ve II.24.2.6 ifadelerinin verilmesi`disassemble_cil()`- Çözüm yöntemleri.`compare_with_metadump()`核对结果──
6. `NativeObject`读取足以列出函数符号的ELF 内容,并采用第 33 课单作为文本──`what_each_keeps()`和 `figure_data()`构建比较结果──

Başka beş emir var.`python3 code/main.py pyc FILE`- Evet.`class FILE`- Evet.`wasm FILE`和 `dll FILE`输出给定文件的结构及每个函数的清单──`python3 code/main.py compare`Kullanım`PATH`中的每个解释器编译 `ledger.py`,并输出各自写入的内容──

## 实际使用

Kendini inşa ettiğin bir konteyner için, aşağıdaki sırada kullanıcıyı kullanın:

1. 读取开头字节并识别格式──两个字节后接 `0d 0a`Gösterme:`ca fe ba be`Kayıt:`00 61 73 6d`Modul gösterir,`4d 5a`且数据目录 14 已设置则表示程序集──
2. 读取头部并记录它指示的生成工具版本──pyc 根据魔数字,类文件 根据主版本号,程序集 根据运行时间和元数据版本字符串──
3. 运行任何计划使用的反编译器前, önce bu versiyonu desteklediğini kontrol et.
4. Aynı dosya işletimini yapan okuyucuya ve bu biçimdeki kendi aletlerine göre, birbiriyle karşılaştırılmak.
5. İlgilendiğiniz fonksiyon, bilgi koruma tablosunu doldurun. Her bir gerçeği koruma veya kaybı olarak işaretleyin ve kaynağı, özelliği veya bölümünü belirtin.
6. 完成以上步骤后再阅读反编译输出──将每个名称和类型标记为已保留的事实的复制,或标记为推断──

Bu nedenle, bu konuyla ilgili bir bilgiyi kullanmak için, bir bilgi kaynağı olarak kullanın.`build_fixtures.sh`Yeniden inşa edilmek ve çıkış kaydedilmek, çünkü temiz değişim, örneğin değişmesi anlamına gelir.

## 交互实验

### 实验 A:先读头部,再读代码对象

- Evet .`code`Şimdi Python'u açıyorum:

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

İlk defa kullanın önce yazın, sonra yükleyin.`ledger.cpython-314.pyc`,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `code`Bu yüzden, bu da bir şey.`import marshal; marshal.loads(pyc.data[16:])`,阅读错误信息──

### 实验 B:常量池引用链

```python
cls = load_class("Ledger-g.class")
cls.constant(13)
cls.constant(14)
cls.describe_constant(13)
[row["text"] for row in jvm_listing(cls, "grade")]
```

调用 `describe_constant`Ön, ön, ön.`#13` Takip edelim `#8`和 `#14`, tekrar takip edelim .`Utf8`条目──随后加载 `Ledger-gnone.class`, iki nesneye ayrılığı `cls.method("grade").attribute_names()`- Evet.`Code`Aynı sayı, farklı özellikler var.

### 实验 C:深度与标签

```python
module = load_wasm("ledger.wasm")
[(row["depth"], row["text"]) for row in wasm_listing(module, "grade")]
module.function_name(2)
load_wasm("ledger-names.wasm").names["locals"][2]
```

找到 `br_table`行并读取深度──统计其后的 `end`Çekilen, açılan ve açıklanan her satırdaki etiket numarasını karşılamak için kaldırın.`ledger.wat`, find tag 3 karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı`block $six`- Evet.

### 实验 D:令牌 to字节

```python
asm = load_assembly("LedgerNet.dll")
asm.method("Grade")
body = asm.method_body(asm.method("Grade")["RVA"])
body.fat, body.max_stack, body.code_size, hex(body.local_signature_token)
asm.token_text(0x11000001)
[row["text"] for row in cil_listing(asm, "GradeLabel")]
```

- Evet .`.text`节头部,手动计算 RVA `0x2060`Bu konularda,`asm.rva_to_offset(0x2060)`Daha sonra oku.`asm.row(0x08, 3)`, bir isim bul`score`存放的位置──

## 实践实验

Bu nedenle, bu konuyu daha fazla ele almak için, beşinci kaynak diline katılma veya bir altıluk faktörünü artırmak için kullanmak gerekir.

要求:

- Kullanıldığınız bir düzenleyici dilini kullanarak, düzenleme, örneğin Kotlin 编译为类文件,或将Rust 编译为 Wasm 模块──提交输出和基准清单,并`build_fixtures.sh`İç kayıtlar, doğru emirler.
- 让对应读取器的每条指令都与基准一致.                                                                                                                                                                                                                                                      
- 扩展 `what_each_keeps()`, yeni bir konteyner ekle, tüm konteynerlere bir faktör ekle: fonksiyonörün bir anormal şebekesi olup olmadığını veya`try`Bölge
- Yeni bir konteyner ekle`figure_data()`,并再生成 `site/figures-re-43.js`- Evet.
- 编写测试:当读取器声称某事实被保留,但没有指明存储它的表、属性或节时,测试应失败──

验收标准ı:`python3 code/main.py keeps`⇒ Yeni bir çizgi gösterir, her birimde kanıt vardır ve tüm temel oranlar hâlâ tutarlıdır.

## 本课产物

本课包含 `outputs/skill-bytecode-and-managed-formats.md`◊ Bu biçimdeki öz araç olarak temel olarak kullanılabilir, herhangi bir anti-kompilatör ön denetim sürümünde çalıştırılırken, her kayıp gerçeğin orijinal olarak nerede depolanması gerektiğini açıklar ve her kayıp gerçeğin nerede depolanması gerektiğini gösterir.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- Dört pyc  başındaki sihirli sayıları 3495、3531、3571 和 3627 olarak ayırılır, 3 olarak işaretlenir, 8 字节 içerir.
- 3.11 ve sonraki sürümlerin her birinde mevcuttur.`2900 + 50n`規則為其版本指定范围内
- Geçmişte açıklayıcı tarafından yazılan dosyalara karşı sıralanmacı tarafından gönderilen isim, düzenli miktar, kod yazısı, değişim adı ve çizgi sayısı ve `marshal.loads()`Aynı
- Dört dosya da modülünü koruyor.`grade``('score', 'bucket')`İlk 10 numara, ve dosya adı.`ledger.py`
- Dört versiyon`grade.co_code`Bölümler 80 ̊62 ̊70 ve 96 ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊   ̊ ̊                                                                                                                                                                    
- 3.11 清单含有 `POP_JUMP_FORWARD_IF_FALSE`,3.12 ve 3.13 içerir`RETURN_CONST`3.14  içeren `LOAD_SMALL_INT`- Evet.`LOAD_FAST_BORROW`和 `NOT_TAKEN`
- 3.14 `-C -O`清单显示 `grade`İçinde 13 depo var, bunlardan 5 tane yerleşik.`BINARY_OP`后,自适应清单中出现 `COMPARE_OP_INT`
- 缺少 `0d 0a`Başı kesilmiş başı, kodlanmış olmayan nesne başı dokunur.`FormatError`
- Sadece mevcut açıklayıcı tarafından yazılmış bir pyc.`dis`输出一致
- 类文件 主版本为 65 或 69,大小分别为 1581、1832、1404 和 1581,常量池计数分别为 82、94、79 和 82
- 常量 `#13`解析为 `Method Ledger.grade:(I)I`- Evet .`#47`解析为 `String F`
- JVM Ant汇编器                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `javap -c -p`实现 108 条 命令全部一致
- pc 4 处 `tableswitch`长 36 字节,下限为 6、上限为 10、默认目标为 48,其余目标为 46、44、42、40、40
- Üç çeşit aşama değişim özellik sayısı, ama `grade`50 个代码字节保持一致
- `ifne`- Evet.`if_icmpge`和 `goto`Çözüm:
- 错误魔数、尾随字节和未定义操作码都会触发 `FormatError`
- 七个 节                                                                                                                                                                                                                                                             `wasm-objdump -h`输出一致,带名称构建在 293 至 425 处添加 `name`Özdefinition节
- Tip:`env.log`导入、五导出和偏移 1024 处的数据段均按 `ledger.wat`Yazıcılık
- Bu iki yapı arasında ortalama `wasm-objdump -d`实现 77 条 命令全部一致
- `grade`6 tane blok var, derinlik 6'dan fazla.`br_table`含标签 `4 4 4 4 4 4 3 2 1 0 0`且默认标签为4,以及一个`i32`局部变量
- 没有名称节时,函数名来自导出;局部变量名只有在名称节存在时才有
- LEB128 `e4 00`100'e kadar.`7f`-1`80 08`1024 blok tipi sunum biçimi ve `wasm-objdump`Birliği
- 错误前导字节、版本 2 和未知操作码都会触发 `FormatError`
- Programı PE32 için, makinesi tipleri için`0x14c`,CLI 头部位于 RVA `0x2008`,运行时为2.5 ,标志为`ILONLY`, giriş için`0x06000005`
- 元数据版本为 `v4.0.30319`, beş akış, 14 tablo sayısı ve büyüklüğü ile temel rapor uyumlu
- .NET 读取器与 System.Reflection.Metadata 查查全部一致
- `Grade`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `score`,签名为`static int32(int32)`- Evet.`MaxStack`2, code length 45 字节,并有一个无名的`int32`局部变量
- CIL'in `switch` hedef ve `br.s`- Evet.`ldsfld`- Evet.`call`和 `ldstr`Operasyon sayısı ise, bir tablo ve bir çözebilirlik
- CIL Operasyon Kodu Çözümleri İşlemleri sırasında yapılan her işlem için sadece ek olarak katılır.`no.`
- 信息保留表显示四种容器保留参数名,原生代码不保留;三种容器保留类型
- 演示中的每行基准结果都显示 n 项比较中 n 项一致
- 交互图嵌入的数据与 `figure_data()`Doğuş verileri aynı

## 生产环境中的失效模式

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

## 操作原理

Önceden okuyun, yönlendirdiği üretim araçlarını tanımlayın. Bilinmeyen içeriği bulduğumuz bir okur okuma makinesi kullanmayı reddediyoruz. Aynı dosyada bu biçimdeki kendi araçları ile bir listeyi onaylıyoruz.

## 延伸阅读

- [PEP 552：确定性 pyc](https://peps.python.org/pep-0552/)
- [CPython `Include/internal/pycore_magic_number.h`](https://github.com/python/cpython/blob/main/Include/internal/pycore_magic_number.h)
- [Python `marshal` 模块文档](https://docs.python.org/3/library/marshal.html)
- [CPython `Python/marshal.c`](https://github.com/python/cpython/blob/main/Python/marshal.c)
- [Python 3.14 `dis` 模块文档](https://docs.python.org/3.14/library/dis.html)
- [PEP 659：专门化自适应解释器](https://peps.python.org/pep-0659/)
- [PEP 626：供调试及其他工具使用的精确行号](https://peps.python.org/pep-0626/)
- [PEP 790：Python 3.15 发布计划](https://peps.python.org/pep-0790/)
- [PyPI 上的 uncompyle6](https://pypi.org/project/uncompyle6/)- Evet.[PyPI 上的 decompyle3](https://pypi.org/project/decompyle3/)- Evet.[PyPI 上的 xdis](https://pypi.org/project/xdis/)- Evet.[GitHub 上的 pycdc](https://github.com/zrax/pycdc)- Evet.[GitHub 上的 PyLingual](https://github.com/syssec-utd/pylingual)
- [Java 虚拟机规范，Java SE 25，第 4 章：类文件格式](https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-4.html)
- [Java 虚拟机规范，Java SE 25，第 6 章：Java 虚拟机指令集](https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-6.html)
- [javac 手册，Java SE 25](https://docs.oracle.com/en/java/javase/25/docs/specs/man/javac.html)和 [javap 手册](https://docs.oracle.com/en/java/javase/25/docs/specs/man/javap.html)
- [CFR](https://www.benf.org/other/cfr/)- Evet.[Procyon](https://github.com/mstrobel/procyon)- Evet.[Vineflower](https://github.com/Vineflower/vineflower)- Evet.[intellij-community 中的 Fernflower](https://github.com/JetBrains/intellij-community/tree/master/plugins/java-decompiler/engine)- Evet.[JADX](https://github.com/skylot/jadx)
- [Harrand、Soto-Valero、Monperrus、Baudry，《Java 反编译器的多样性及其在元反编译中的应用》（JSS 2020）](https://arxiv.org/abs/2005.11315)
- [ECMA-335，公共语言基础结构，第 6 版（2012 年 6 月）](https://ecma-international.org/publications-and-standards/standards/ecma-335/)
- [PE 格式，Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [System.Reflection.Metadata.Ecma335.TableIndex](https://learn.microsoft.com/en-us/dotnet/api/system.reflection.metadata.ecma335.tableindex)
- [GitHub 上的 ILSpy](https://github.com/icsharpcode/ILSpy)- Evet.[NuGet 上的 ilspycmd](https://www.nuget.org/packages/ilspycmd)- Evet.[GitHub 上的 dnSpyEx](https://github.com/dnSpyEx/dnSpy)
- [WebAssembly 核心规范：二进制格式，模块](https://webassembly.github.io/spec/core/binary/modules.html)和 [值](https://webassembly.github.io/spec/core/binary/values.html)
- [WebAssembly 核心规范：自定义节（名称节）](https://webassembly.github.io/spec/core/appendix/custom.html)
- [WebAssembly tool-conventions：调试](https://github.com/WebAssembly/tool-conventions/blob/main/Debugging.md)
- [wabt 1.0.42 发布说明](https://github.com/WebAssembly/wabt/releases/tag/1.0.42)- Evet.[wasm-tools](https://github.com/bytecodealliance/wasm-tools)- Evet.[Binaryen](https://github.com/WebAssembly/binaryen)- Evet.[ghidra-wasm-plugin](https://github.com/nneonneo/ghidra-wasm-plugin)
- [GitHub 上的 radare2](https://github.com/radareorg/radare2),Bu ders 6.2.4 versiyon kaynak kod oluşturma kullanımı
