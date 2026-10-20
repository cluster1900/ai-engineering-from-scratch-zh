# 2. Sistem farkı karşılaştırma ile simge: uyumlu işlev ve çözüme giriş

> İki fonksiyonun uyumluluğu, bir çeşit imza ile bir çeşit kalitede verilen sonuçlardır; çözülmüş girişler, bir çeşit yol koşullarının bir modelidir. Bu iki yöntemin yapılandırılması, bir radff2、Ghidra、angr 和 z3 kontrollerine karşılaştırılmaktadır.

**Type:** Build
**Languages:** Python, C, x86-64 assembly, Java (one Ghidra script)
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、34（提升为伪代码）、36（重建并证明等价）
**Time:** ~150 分钟

## Öğrenme hedefi

- hedef dosya ve listeye göre beş fonksiyon imza oluşturmak:
- BinDiff 风格的分阶段贪心匹配器, sadece iki tarafta tek kez uyuşan imzalanır ve her uyuşmanın arkasındaki aşama ve kaliteyi kaydeder.
- 复现两个字节完全相同的函数在加载映像上无法通过字节关联器、屏蔽后却可通过情况,并使用重定位算术解释四个变化字节──
- Levenshtein'in                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
- Küçük IR'de, her yol için koşullar taşınır ve her nokta için bir sınır arama yapılır.
- 測定 符号边界の循環中の路径爆発,并将数、类和模型与angr 10.0.3、z3 5.1.0 比较──

## 问题

Sen de`-O2`Yeniden inşa edildi.`ledger.c`, sorgulama ajanı 相比 `-O1`Konstrüksiyonda değişiklikler olup olmadığını;  ajan 运行差异工具后报告 `grade`Bu değişiklik, iki yüklenmeden sonra programdaki yazı tipi farklı olduğu için değiştirilmiştir.`grade`46 字节 tamamen aynı.`-O2`Programı`.rodata`后移了0x70 字节, bu yüzden `grade`Bir yer hareket 0x70'e kadar yükseldi.

Aynı gün öğleden sonra, sen soruyorum hangi puanı verecek `grade`返回 4──agent 阅读伪代码后回答90──这是只是一个答案──函数对90至109的每个分数都返回4,而问题没有限制边界,所以你需要集合,agent却给了一个样本──

两种失败源于同一个缺口:匹配和求解输入都是背后有方法支的结论. 本课 Python 标准库构建这两种方法,并旁边运行生产工具. 工具与代码一致时,你有两条推导; 不一致时,则有地址、字节或边界可查.

```figure
re-44-matches-and-paths
```

## 函数签名是带质量 sonucu

Flake 2004 yılında iki benzer uygulanabilir dosya fonksiyon koleksiyonu arasında yapı ve yapı olarak tanımladı. Dullien ve Rolles 2005 yılında temel blok ve talimatlara genişletti. BinDiff kavramı, bu gelişme stratejisini tanımladı: her fonksiyonun iki tarafında bir özelliği hesaplanır; eğer bir değer her tarafta bir kez ortaya çıkarsa, yapı uyumluluğu meydana gelir; birçok değer farklılıkları ortaya çıkarsa, bu eşit fiyat sınıfı içinde aşağıdaki özelliğin ayrıntılı şekilde ayrılması gerekir; bir konunun değerinin korunması gerekmez.

Her türlü eşleşme algoritması kaliteli olacaktır. Bu sayfa, orijinal fonksiyon sayıları bölümünün hash eşleşmesi ve adı hash eşleşmesi değerini çok iyi değerlendirecektir.

Bu ders, en önemli kurallardan biri olan iki tarafın tek olması ve eşleşmemesi için beş özellikten oluşmaktadır.

## Bir fonksiyon kaydından beş imza elde ettim.

差异比较器 字节、符号大小和                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               `.rela.*`Kayıt;`llvm-objdump -d`清单提供指令边界和助记符, 第33 课已证明解码器在这些目标文件中的每条指令上与清单一致.`function_record()`检查每条清单指令的字节是否等于目标文件对应地址的字节,否则抛出异常――过期清单意味着样本发生变化――

E`ledger-x86_64-O1.o`Orta `grade`Örneğin, simgeler 0x10 ̊ büyüklük 46 ̊ yönlendirme gösterir. Bu nedenle 0x10 ̊ 0x3 ̊ e kadar olan kayıtlar, bir fonksiyonun iki karakterini içermez.`nop`- Evet.

精确字节签名是这46字节的 SHA-256──屏蔽字节签名先将每个重定位字段置零──这里只有一个字段:偏移 0x36 处的记录`R_X86_64_PC32 .rodata+0x10`, geniş dört harf,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `leaq (%rip), %rcx`RELA  hedef dosyasında, bu dört karakterin asılı sıfırdır, bu nedenle burada her hedef dosyasının her fonksiyonunun iki imzası aynıdır.

助记符签名对以下 14 助记符的序列取哈希:

```text
movslq imulq movq sarq shrq addl addl xorl cmpl ja movl leaq movl retq
```

流图形签名, 33 numaralı ders temel blok ve bant tipi kenarından gelir ve sadece giriş edilebilir blokları içerir.`-O1`Aşağıda `grade`Üç blok var.`ja 0x3d`Sonunda, bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde bir sekilde olarak tekde bir sekilde bir sekilde bir sekilde bir sekilde olarak tekde bir sekilde bir sekilde bir sekilde olarak tekde bir sekilde bir sekilde olarak tekde bir sekilde bir sekilde olarak tekde bir sekilde olarak tekte bir sekilde bir sekilde olarak tekte olarak tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek tek`3b 3e [0/2,1/1,2/0]`- Evet.`-O0`Aşağıda `grade`33 numaralı ders gibi, beş tane.`.rela.rodata`条目解析间接跳转, get 八块、十一条边,其中四条是 `table`- Evet.

名称签名就是符号名称──存在时它是最强的事实,构建被剥离符号时则无作用──

Ayrıca, son düzeltme durumunda kullanılan bir bölüm vardır.`.rodata``lea`Yeniden konumlandırma, sınır kontrolü ve indeks yükleme sırasında,`referenced_table()`按第 36 课的方式读取表:`ja`Önceki`cmpl $0x4`5 madde, yükleme`movl (%rcx,%rax,4), %eax`Göstermek için her 4 ayet.`-O1`Aşağı`grade``.rodata+0x14`Ürünleri`1, 2, 3, 4, 4`- Evet.

## 贪心匹配器

`match_functions()`序列运行各阶段──各阶段按该阶段签名分别对两侧未相匹配的函数分组,各侧恰恰有一个函数的值──相匹配记录阶段、阶段质量、其他同样一致的签名,以及相似度比例──

```python
for stage in order:
    for signature, candidates in left_groups.items():
        partners = right_groups.get(signature, [])
        if len(candidates) != 1 or len(partners) != 1:
            continue
        a, b = candidates[0], partners[0]
        agreeing = [s.id for s in STAGES if a.signatures()[s.id] == b.signatures()[s.id]]
        matches.append(Match(a, b, stage, agreeing, radare2_ratio(a.raw, b.raw), data_equal))
```

Bu dersin sırası önce dört yapı aşamasını yürütür, son olarak adı kullanır, yapı aşamasını kontrol altına alır, sonra adı tarafından olayın son değerlendirmesi edilir.`-O1`ile`-O2`Aşağıda anlatılır:

| 函数 | 阶段 | 一致的签名 | 相似度 |
|---|---|---|---|
| `percent_change` | 精确字节 | 全部五种 | 1.000 |
| `grade` | 精确字节 | 全部五种 | 1.000 |
| `total` | 名称 | 仅名称 | 0.171 |
| `grade_label` | 精确字节 | 全部五种 | 1.000 |

`total`31 字节、13 条 yönlendirmesi 140 字节、41 条 yönlendirmeye yükseldi, çünkü clang SSE2 ile ölçüm döngüsüne doğru, ve bir ölçümsal ek sayı döngüsünü korudu.

- Evet .`-O0`ile`-O1`Aynı şekilde bir hata oluşur:

| -O0 函数 | 匹配的 -O1 函数 | 阶段 | 名称一致 |
|---|---|---|---|
| `percent_change` | `grade_label` | 流图形状 | 否 |
| `grade` | `grade` | 名称 | 是 |
| `total` | `total` | 名称 | 是 |
| `grade_label` | 未匹配 | | |

`-O0`Aşağıda `percent_change`Yapılan kararlar:`before == 0`, iki bölük, yeniden birleşik olarak geri dönmek.`0/2, 1/1, 1/1, 2/0`- Evet.`-O1`Aşağıda `grade_label`İçeride.`grade`Bu şekil, iki tarafta da benzersizdir, kurallarda kabul edilir. Ortalama kalite etiketi uyarıdır, ardından yürütülen isim aşamaları da onunla çelişkilidir.`grade_label`, gerçek bir sonuç .`percent_change`和 `grade_label`配对保持未匹配──

存在真名时,BinDiff 顺序将名称匹配放在第二阶段,代码中 `BINDIFF_ORDER`Ben de öyleyim. Bu sırayı kullanın.`-O0`函数都按名称匹配到其 `-O1`版本, this is also the result of the downstream Ghidra.`if`和 `else`Şekil:

## Aynı yazı, yeniden konumlandırma sonrası işlem sayısı

Ghidra 导入目标文件当应用重定位,因此其字节关联器比较加载后的映像,第36 课也正因如此屏蔽重定位字段──`load_image()`复现导入过程: bölük bölükleri boyunca bölük bölükleri, bölük bölükleri boyunca bölük bölükleri`sh_addralign`0x100000'den başlayarak, sonra her kayıt uygulamak:`R_X86_64_PC32`和 `R_X86_64_PLT32`- Ben de .`S + A - P`写为有符号 32 位值,`R_X86_64_64`- Ben de .`S + A`写为 64 位值──

Programın her bir bölümü Ghidra 12.1.4 ile aynıdır, test kitleri kontrol edilmektedir.

| 节 | `-O1` 程序 | `-O2` 程序 |
|---|---|---|
| `.text` | 0x100000，159 字节 | 0x100000，271 字节 |
| `.rodata` | 0x1000a0 | 0x100110 |
| `.rodata.str1.1` | 0x1000f0 | 0x100160 |

`-O2`Aşağı`.text`增长 112 字节,即 `total`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `.rodata`后移 0x70 字节──两个程序的 `grade`0x100010 yerleşik yerler.`leaq`0x36'da bir konumlandırma bölümü oluştu.`.rodata+0x14`- Evet.

- Evet .`-O1`Filmler:`0x1000a0 + 0x14 - 0x10003a = 0x7a = 122`- Evet.`-O2`Filmler:`0x100110 + 0x14 - 0x10003a = 0xea = 234`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊   ◊ ◊    ◊ ◊            ◊                                                                                                                                                      `7a 00 00 00`, başka bir için `ea 00 00 00`∼46 字节中一个字节不同,Levenshtein 比例为0.978,精确字节阶段失败;屏蔽字节阶段将字段清零后通过──`grade_label`Gösterisi aynı şekilde 0x70'e hareket etti, bu nedenle hareket aynı şekilde, iki görüntü arasında doğru bir harf ile uyumlu kalır.

Ghidra                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `-O1`ile`-O2`,Tam fonksiyon baytları eşleşir 找到 `percent_change`和 `grade_label`;Tamlı fonksiyon talimatları Düzleşir 额外找到 `grade`;Exact Function Mnemonics Match 找到相同的三个函数──命令关联器屏蔽操作数,因此覆盖该位移──本课映像视图的精确字节匹配恰好应 Ghidra 字节关联器找到的两个函数,屏蔽字节一致性恰好应其命令关联器找到的三个函数──测试套件断言

6.5.0'un`compare_functions`Provider için 文本 için bir-birinden farklılık göstermek için 文本 için 文本 için 文本 için 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 

## Radiff2 测量 ne

Radare2 6.2.4 提供 `radiff2`。 kullan `-AC`时, iki dosyayı analiz ederek her işlevi için bir satır yazdırırır: sol tarafı büyüklük ile adres, MATCH veya UNMATCH、 oranı, sağ tarafı büyüklük ile adres, bu sınıfın hedef dosyasının yakalama satırı aşağıdaki gibi:

| 比较对 | `percent_change` | `grade` | `total` | `grade_label` |
|---|---|---|---|---|
| `-O0` 对 `-O1` | UNMATCH 0.130435 | UNMATCH 0.426829 | UNMATCH 0.106061 | UNMATCH 0.269841 |
| `-O1` 对 `-O2` | MATCH 1.000000 | MATCH 1.000000 | UNMATCH 0.171429 | MATCH 1.000000 |
| `-O1` 对 `-O1` | MATCH 1.000000 | MATCH 1.000000 | MATCH 1.000000 | MATCH 1.000000 |

Radarın %2 源码中比例为 `1 - distance / max(len_a, len_b)`, içinde mesafe iki işlevin çizgisinin arasındaki Levenshtein mesafesi, çizgisinin adres sırasıyla yapıştırılması işlevin temel blokunun sonucu olarak 0.7 olarak değerlendirilmiştir.`code/main.py`Orta `radare2_ratio()`İlk fonksiyon için aynı formülü gerçekleştirmek için 0.130435、0.1060、61、0.269841 和 0.171429 复现到小数点后六位──

Bu bir şey değil .`-O0`Aşağı`grade`Bu işlevi tüm 118 字节, oranı 0.296610 ⋅ radar2 在大小列打印 `118`, ama parmak izi daha kısa. Yeniden konumlandırılmadığında, atlama tablosunu çözemez, bu yüzden analiz sadece giriş bloklarına ulaşır.`jmpq *%rax`終の块、默认分支和返回:共 82 字节,正是第 33 课普通递归下降认定的那82 字节──这82 字节与 `-O1`Levenshtein 距离为 47,因此 `1 - 47/82 = 0.426829`Başlangıç`-e bin.relocs.apply=true`后,radare2 找到全部 118 字节,打印 0.288136,等于本课重定位映像计算的比例; 映像中的四位移字节与目标文件的零字段不同──只有比较相同字节时,两工具才一致,大小列不说明实际输入了哪些字节──

`-O`İşlem kodı kısımlarına işaretleyerek, işlem sayısını sıfırlayacaktır.`-O0`- Evet .`-O1`% 0.239130 ̊ 0.512195 ̊ 0.303030 ̊ 0.523810 ̊`total`- Evet .`-O1`- Evet .`-O2`时提高到0.192857── ayrıca tüm dosyanın mesafesini hesaplayabilirsiniz:`-s`(Myers) Rapor iki hedef dosya benzerliği 0.956  mesafe 162;`-ss`(Levenshtein) rapor 0.927 和 137── bu sayı değerleri kapsamaktadır头、符号表和重定位节, fonksiyon durumunu açıklayamıyor──

## Ghidra Versiyon Takip Etme 关联器

Ghidra'nın Versiyon Takipleme Aracı Bağlantı aracı tarafından kaynak programı ile hedef program uyumluluğu sağlar. Fonksiyon bağlantı cihazı tam fonksiyon byte maçı, tam fonksiyon talimatları maçı, tam fonksiyon mnemonikası maçı ve çift fonksiyon talimatları maçı içerir.

Bu ders bağlantı cihazı çıkışını kavramsız bir şekilde yakalar.`capture_ghidra_vt.sh`Üç hedef dosyası, bir proje, bir çalışma`ListVersionTrackingMatches.java`Bu kısa yazı devam ediyor.`AbstractGhidraVersionTrackingScript`, açılışı ve hedef programına göre, otomatik sürüm takipine göre  sıradan çalıştırılır altı referans olmayan bağlantı cihazı, ve her bir blok için 函数 关联器和匹配印一行──本节 tüm değerleri bu iki metin dosyasından alınmıştır──

| 关联器 | `-O0` 到 `-O1` | `-O1` 到 `-O2` |
|---|---|---|
| Exact Symbol Name Match | 4 个函数 | 4 个函数、5 个数据项（`labels.rel`、`.L.str.1` 至 `.L.str.4`） |
| Exact Data Match | 0 | 0 |
| Exact Function Bytes Match | 0 | 2（`percent_change`、`grade_label`） |
| Exact Function Instructions Match | 0 | 3（增加 `grade`） |
| Exact Function Mnemonics Match | 0 | 3 |
| Duplicate Function Instructions Match | 0 | 0 |

- Evet .`-O0`- Ne ?`-O1`Bu nedenle, her işlevi değiştirir, bu nedenle sadece uyum olarak adlandırılır, bu da BinDiff'i kullanan bu sınıf uyumlu cihazın sonuçlarıdır.

Aletler Aşağıdaki Program Farkları başka bir şeydir. Aynı adres alanındaki iki programı hedefler. Aynı adresde şifre, etiket, kod birimi, alıntı, not ve işlevi karşılaştırır.

## 根据文档了解Diaphora 和 Binary Ninja

Diaphora, 2015 yılında ilk kez yayınlanan IDA Pro eklentisi, 2026-08-18 tarihleri için 3.4.2 olarak 3.4.2 olarak yayımlanmıştır. 2.0'dan itibaren AGPL-3.0'u kullanmak için IDAPython'a ihtiyaç duyulur. Bu nedenle IDA Home veya IDA Pro'da çalıştırılabilir, IDA Free'de çalıştırılamaz. SQL'e aktarılan her veri tabanını SQL'e SQL'ın arama çalışmasını başlatır. Her türlü başlatma adı en iyi/ kısmi/davranmaz 类别、比例类别, SAME_CPU veya SLOW gibi seçilebilir blok işaretleri, aynı zamanda aynı sınıflandırılmış bir kitleye benzer bir kaynak kodunun adı vardır. Ancak daha fazla:Bytes hash sınıfı, Aynı ve mnemonik, Aynı sıralanmış bir topluluk, Aynı küçük prim ürün sorunları, Aynı düğümler, editörler, döngüler ve üst düzey bileşenler, ayrıca aynı zamanda aynı zamanda aynı zamanda yayınlanan bir hash biçiminin de gösterilmesi gereken bir yapılandırma biçimi vardır.

2026-09-03  yayınlanan Binary Ninja 6.0  binary benzerlik  framework,包含 provider 和 resolver。 it will BinDiff  as structur provider,并 provide WARP, to tolerate re-location operations exact function matching。 guide recommendation: function apart from re-location instructions outside concordance when using WARP; re-compiled still maintain structural contact when using BinDiff。 bu işlev yalnızca Ultimate 版。

BinDiff 2023-09-25'ten bu yana Apache 2.0'da açık kaynaklı olarak yayımlanmıştır. Son sürüm v8 olarak yayınlanmıştır.

## Aynı kod, farklı normal miktar

第36 课 Bir tane kalsın`grade`候选重建,表的最后一项为3,而原始值为4──`grade_case10_wrong.o`ile`-O1`Aşağıda `grade`完全相同的46 个代码字节──匹配器按精确字节配对,所有签名一致──引用表检查通过重定位读出 `1, 2, 3, 4, 4`, başka bir okuma yoluyla`1, 2, 3, 4, 3`Rapor`dataEqual: false`❖ Diğer üç `-O1`函数在左侧未匹配, çünkü aday hedef dosyası yalnızca bir işlevi vardır。

Bu, eklem analizinin tipik biçimidir. Sadece kontrol kod karakterinin işlevi kıyaslatıcıları değişmez. Gitra'nın Tam Veri Düzeni ve BinDiff'in karakter referansları da bu nedenle var. Bu dersin versiyonu çok küçük: her uyumlu, karşılaştırma işlevi ağırlığı konumlandırma yönündeki karakterler, sayıları sınır kontrolünden, genişliği yüklemeyden gelir.

## 符号执行: route、条件和求解器

King 1976 yılında bir işaret gerçekleştirmek için bir giriş yaptı. Bir giriş, bir işaret deposu olarak, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş, bir giriş,

Baldoni、Coppa、D'Elia、Demetrescu 和 Finocchi, 2018 yılında bu alanı genel olarak özetledi. 5. bölümünde, patlama yolunun temel maliyet olduğunu belirtti: yürütücü her bölümde bölünmüş olabilir, bu nedenle durum sayısı her bölümde bir dizi sayısal gösterge artırabilir; eğer döngü sınırları simge girişimine bağlı ise, sonsuz yollar topluluğu oluşur.

KLEE(Cadar、Dunbar、Engler,OSDI 2008) LLVM bitkodunun üstündeki simgelerden oluşmaktadır.`clang -emit-llvm`输出, değil二进制──i POSIX 环境模型和重放库提供. 89 GNU temel programlarında %84.5  行覆盖率, geliştiriciler testinde %67.7 oranında, 56 ciddi eksikliği buldu. KLEE 3.2 2025-12-23'te NCSA 许可证, LLVM 16 ⇒ ile yayınlandı.

面向二进制工作──`angr.Project`包含映射目标文件并应用重定位的 CLE 加载器,将块转换为 VEX IR(`block.vex`)                                                                                                                                                                                                                                                               `SimState`保存寄存器、内存和求解器──`SimulationManager`Adı için`active`- Evet.`deadended`- Evet.`found`- Evet.`avoided`和 `errored`Bu durumun bir araya gelmesi,`explore(find=..., avoid=...)`Bu süreç, her adım motorunun başarısızlık işlemini, sistem düzenlemesini, belirli verilerin birincil parçası olarak kullanmasını, son olarak VEX'e geri dönmesini, açıklama Z3'ün üzerinde bir çözüm ön ucunda, 10.0'da, içe yerleştirilmiş olarak değiştirilmesini,`from angr import claripy`导入──angr 10.0.3 于 2026-10-10 上传, BSD-2-Clause, Python 3.12 veya更新版本ı gerekir──Z3 5.1.0 于 2026-08-16 发布, MIT, is angr、Triton 以及 KLEE 可选后端后背的求解器──

## 基于第 34 课 IR'in küçük uygulayıcıları

`code/main.py`Ortalama uygulayıcılar küçük IR kullanıyor,语句形态与第34 课一致:`Assign`- Evet.`Branch`- Evet.`Jump`- Evet.`Return`, 34 . Ders uygulamada deney gereksinimleri gerçekleştirilmek için`Switch`终结指令──表达式包括 `Const`- Evet.`Var`、 带宽度 `Bin`- Evet.`Cast`、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、    、 、 、 、   、 、                      、                                                                                                                                                                                                          `Load`和 `Not` Dört örnek işlevi, 34'ün basitleştirilmesinden sonra elde edilen seviye handwork yükseltme, şu anda`0x66666667`乘法已变为 `score / 10`, her IR 块都列出源指令地址──`check_ir_against_listing()`Bu adreslerin bir kez daha oluştuğunu söyleyin.

İR'de`-O0`Aşağıda `grade`- ...

```text
0x30: local_8 = score; local_10 = score / 10 - 6; if (local_10 >u 4) goto 0x9a else 0x62
0x62: switch local_10 -> 0x91, 0x88, 0x7f, 0x76, 0x76
0x76: local_4 = 4; goto 0xa1        0x7f: local_4 = 3; goto 0xa1
0x88: local_4 = 2; goto 0xa1        0x91: local_4 = 1; goto 0xa1
0x9a: local_4 = 0                    0xa1: return local_4
```

 分支表                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `jump_table_targets()`, 33'cü sınıf ile aynı ağırlıklı konumlama aritmetikini kullanmak, dolayısıyla IR 实际读取样例──

`execute()`维护路径状态工作列表――状态包含当前块、块轨迹、条件列表,以及将每个变量映射为输入表达的环境――`Assign`Çevreyi Değiştirme ve Kaydetme Sonuçları`Branch`Bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere de bir kere bir kere bir kere bir kere bir kere de bir kere bir kere bir kere bir kere de bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere bir kere`Switch`                                                                                                                                                                                                                                                              `Return`Çeviri dönüş değerine girmek ve kapatmak için bir nokta oluşturmak.

İşler ilerliyor.`return 4`Yollar bir kez daha geçiyor.`local_10 = score / 10 - 6`❖ Bu yolun koşulları`local_10 >u 4`Bu nedenle, koşullar listesi içerir.`!(score / 10 - 6 >u 4)`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                         `score / 10 - 6 == 3 || score / 10 - 6 == 4`△块 0x76 赋值 `local_4 = 4`, 0xa1'e atlayarak , değerini geri döndürerek ,`4`❖ Yedeği, bu koşul ve değerden oluşan iki gruptan oluşur.

Çözüm Aracı`BoundedSearch` Bu, her giriş için sınırlı alanlar, bu alanların kartı sayısı, ve C 语义计算每束:32 位回绕、截断除法、有符号与无符号比较,以及算术或逻辑移位──除零或表索引越界将使该赋值无法满足约束──`score`-200'den 1200'e kadar.`grade`Bu yolların toplamı 44 bin 460 kez aralıksız kalır.

| 叶节点 | 返回值 | 条件 | 边界内的分数 |
|---|---|---|---|
| 0x76 | 4 | `!(q >u 4) && (q == 3 \|\| q == 4)` | 90 至 109，20 个输入 |
| 0x7f | 3 | `!(q >u 4) && q == 2` | 80 至 89，10 个输入 |
| 0x88 | 2 | `!(q >u 4) && q == 1` | 70 至 79，10 个输入 |
| 0x91 | 1 | `!(q >u 4) && q == 0` | 60 至 69，10 个输入 |
| 0x9a | 0 | `q >u 4` | 1,351 个输入，即域中其余输入 |

`q`代表 `score / 10 - 6`- Evet.`-O1`Aşağıda `grade`Aynı sınıf da oluşur, ancak sadece iki yol vardır:`lookup_14[q]`Bu nedenle, bu soru, 0'dan geri dönüşün öntanımlı yolu olarak belirlenir.`lookup_14`Hedef dosyasından`.rodata`Bu da bir hikaye.

边界就是该方法的限制──有界搜索在域内完结,在域外不作结论──在 -200'den 1200'e, 60'den 109'a kadar olan hiçbir sayı geri dönüşü olmayan 0.110 veya daha büyük sayılarda geri dönüşü olmayan hiçbir sayı bulunmuyor── z3 完全2^32 个数证明这两项; 下一节展示两种方法会在哪些地方返回不同见证──

## 测量路径爆炸

`-O1`Aşağıda `total`Bu da 33 . Sınıfın döngüsü:`count`, döngü toplama `values[rdx]`Gelişmiş`rdx`- Ne ?`rdx != rcx`Zaman geçiyor`jne`Dönüşümde.`rcx`Çı`zext64(count)`- Evet .`rdx`Her seferinde, her zaman.`rdx != count`Üzün, içinden `rdx`Bu yüzden de.`count = c`Çeviri:`c`Sonra çıkıyorum.`count`限定为 0 至 2,执行器找到 3 条路径;0 至 4 时为 5 条;0 至 8 时为 9 条.`-O2`; onun döngü devreye girme gereksiniminin sayısı en az 8'dir, bu nedenle bu aralığında yol sayısı değişmez.

Sınırsız bir zaman, uygulayıcı asla bitmez, çünkü her  generasyon bir başka yol vardır.`count`Maksimum 64 运行时返回 22 条路径、截断 2 条,并且 65 条可能路径中另41 条从未开始── rapor bu üç rakamı veriyor──求解成本也增加:边界 2 时求值 33 次,4 时 115 次,8 时 531 次,限运行时 6,900 次──

## Uzzr 和 z3  cevap aynı soruya

`capture_angr.py`Üç hedef dosyasında çalıştırılır Angr 10.0.3。CLE ELF kullanın 后端 her yeniden konumlandırılabilir hedef dosya yüklenir 0x400000, karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı`-O0`应用 13 重定位,对其他文件应用 8 个,并解析四个符号――对具有一个符号的64 位参数的 `grade`- Evet .`run()`- Evet .`-O0`5 tane ölü durum elde ettim.`-O1`和 `-O2`Aşağıdaki 2'de, zaman ayırmak için 0.475 ̊0.408 ̊0.318 ̊s ̊.`eax == v`, sorgu sorgucu her optimizasyon seviyesinde, en az ve en büyük değerleri belirleyen bir simge göstermek istedi.`v`1 ila 4 saatte 60 ila 69、70 ila 79、80 ila 89、90 ila 109; 0 saatte -2147483648 ila 2147483647♦ iki çapraz kontrolün tamamı tatmin edilmedi.

Bütçeye ulaşmak için`-O0`Aşağıda `grade`CFGFast kullanın, liste çıkın 33  ders bulduklarının sekiz blok, tekrar geçin `explore(find=0x400076)`寻找存储4的块──0.47 saniye sonra bir durum bul, hala üç aktif 状态;参数最小值 90、最大值 109,样本为 91、93、94、97 和 101──

- Evet .`percent_change`İki tane kalmış durum elde ettim.`before[31:0] != 0`和 `before[31:0] == 0`◊ 0 olmayan durum talebi`eax == 50`, `-O0`Aşağıya çık .`before = 21055744, after = 332315210`, `-O1`Aşağıya çık .`40566804, 834296877`, `-O2`Aşağıya çık .`-24484867, 993934694`❖ 16 ila 16 arasında bir sınır arama ver`before = -10, after = -15`◊z3 için 34 课单 清单 cevap aynı soruyu, 给出 `before = -25092599, after = 305712160` Test kitleri IR 求值器 ile hesaplanır.

`capture_z3.py`32 kişilik bir yapı.`grade``-O1`清单,包含乘法、两次移位和表,并提出另外四个问题──是否存在某个32位分数,使清单与源码 清单与源码`switch`Not:0.068 saniye içinde satılmamıştır, bu nedenle, düzenleme işlevi tüm 2^32 girişleri üzerinde kaynağa eşit olacaktır.`score / 10`Bu nedenle, ııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııı`percent_change`,要求 `before == 3`且結果為 -133,在 `after = 1073741823`36'da birim olarak satılır.`after = -1`Bu zaman`(-1 - 3) * 100 / 3`Kesinlikle -133'e kadar.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution
python3 code/main.py
```

输出 bir JSON raporudur.`diffs`保存 `-O0`- Evet .`-O1`- Evet.`-O1`- Evet .`-O2`Bu, BinDiff'in hedef dosyaları ile yüklenen görüntülerin uyumlu ve BinDiff'in düzenli olarak çalışmasıdır.`-O0`- Ben de.`toolComparison`Bu, her fonksiyonun bir aşamasını belirlemek için kullanılır.`patch`Evet .`grade_case10_wrong.o`Örneğin.`radare2Ratios`复现 radiff2 数值,`gradeRelocationCase`展示布局和两位移,`symbolic`保存路径、类和爆炸计数──

按以下顺序阅读 `code/main.py`- ...

1. `ElfObject`读取节、符号和 `.rela.*`Kayıt,`parse_listing()`读取 `llvm-objdump`- Evet.
2. `jump_table_targets()`和 `build_cfg()`                                                                                                                                                                                                                                                              `FunctionRecord.signatures()`构建五种签名──
3. `load_image()`布局已分配节,并应用 `S + A - P`和 `S + A`- Evet.
4. `match_functions()`分阶段匹配器;`levenshtein()`和 `radare2_ratio()`提供相似度──
5. `parse_radiff2()`和 `parse_ghidra_vt()`读取捕获的工具输出,用于比较──
6. `evaluate()`- Evet.`substitute()`和 `BoundedSearch`提供表达式语义和求解器──
7. `execute()`枚举路径,`solve_returns()`Kısayolları için bir grup oluşturmak için.
8. `grade_ir_o0()`- Evet.`grade_ir_o1()`- Evet.`percent_change_ir_o1()`和 `total_ir_o1()`Bu da bir iş.

Üç emir daha var.`python3 code/main.py diff A.o B.o`İki yanlışına göre,`--image`则比较加载映像──`python3 code/main.py paths grade O0`print a function's pathways and classes,`paths total 8`印有边界的循环──`python3 code/main.py figure-data`打印交互图嵌入的数据──

## 实际使用

Kendi programının iki yapılandırması için, aşağıdaki sırada bir karşılaştırıcı ve bir uygulayıcı kullanın:

1. Her hedef için bir listeyi yakalayın.`function_record()`İlk olarak, bir değişiklik yaparak.
2. Önce hedef dosyaları karşılaştırın. Her uyumlu aşamayı okuyun. İkinci imza anlaşması olmadan önce, uyumlu şekil sadece öneriler olarak görülecek.
3. Gösterim görüntülerini karşılaştırın. Bilgiye göre hareket eden bir işlevi, belirli bir metinden koruma metinine geri döner.
4. Her bir eşleşme karşılaştırma referans gösterisi için. Aynı kod farklı konularda, hala işlevi değişmektedir.
5. 运行名称阶段并比较──有符号时采用BinDiff 顺序, yalnızca yapı sonuçlarını kullanarak her aşamayı değerlendirebilirsiniz──
6. 工具报告比例时, önce hangi yazı tipiyi girdiğini belirle, sonra kendi sonuçlarıyla karşılaştırın.
7. Giriş işlevini çözmek için, her bir ifade ile adresinin IR'ini yazın, her bir simge döngüsü hesaplayıcı için sınırları belirleyin.`execute()`,并求解每叶节点──报告结果时同时报告边界──
8. Kullanılabilir zaman, angr veya z3 ile aynı soruyu yürütmek ve sınıf sınırları karşılaştırmak.

## 交互实验

### 实验 A: 手工计算五种签名

- Evet .`code`Python'u aç:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution/code
python3 -q
```

运行:

```python
from main import *
grade = {r.name: r for r in fixture_records("ledger-x86_64-O1.o")}["grade"]
grade.raw.hex(" ")
grade.masked_bytes() == grade.raw
grade.mnemonics
grade.cfg_shape()
grade.signatures()
```

打印 `grade.raw`Ön, önce yazın, önce yazın, önce yazın, sonra yazın.`ledger-x86_64-O0.o`Orta `grade`运行相同代码,统计 `grade.edges`Orta `table`- Evet.

### 实验 B:观察重定位 nasıl yıkılır 字节哈希

```python
case = grade_relocation_case()
case["layout"]
case["displacements"], case["rodataShift"]
case["objectBytesEqual"], case["imageBytesEqual"], case["maskedImageBytesEqual"]
```

读取 `displacements`Ön, ön, kağıt üzerinde hesaplama`0x100110 + 0x14 - 0x10003a`再将 `load_image()`Bu iki işletim numarasının birlikte hareket ettiği için 0x400000 olarak değiştirildi.

### 实验 C: yanlış uyumlu ve kaçınması sırası

```python
report = diff_fixtures("ledger-x86_64-O1.o", "ledger-x86_64-O2.o")
[(m.left.name, m.right.name, m.stage) for m in report.matches]
report = diff_fixtures("ledger-x86_64-O0.o", "ledger-x86_64-O1.o")
[(m.left.name, m.right.name, m.stage, m.names_agree) for m in report.matches]
report = diff_fixtures("ledger-x86_64-O0.o", "ledger-x86_64-O1.o", stages=BINDIFF_ORDER)
[(m.left.name, m.right.name, m.stage) for m in report.matches]
```

打印 `-O0`Aşağıda `records(...)["percent_change"].cfg_shape()`和 `-O1`Aşağıda `grade_label`, iki dereceyi okuyun. İkinci aşama yeniden yazın.

### D deney: route ve sınır

```python
report = grade_paths("O0")
[(p["trace"], p["condition"], p["returns"]) for p in report["paths"]]
report["returns"]["4"]
total_paths(2), total_paths(4), total_paths(8)
total_paths(64, step_limit=24)["truncated"]
```

- Ben de .`SCORE_DOMAIN`改为 `range(0, 110)`, tekrar koş`grade_paths("O0")`◊ 0'lu sınıfı 60'a kadar küçültülmüştür, iki geçiş kontrolü hala var.`range(90, 100)`Bakın hangi noktalarda hiç model yok.

## 实践实验

BinDiff'in örnekleri, üç sonuçla karşılaştırılmıştır.

要求:

- BinExport 扩展,导出三个账本 程序──记录 BinExport 发布标签和 Ghidra 版本──
- BinDiff 8 命令行, yalnızca benzerlik seçeneği oluşturmak kullan `-O0`- Evet .`-O1`和 `-O1`- Evet .`-O2`Sonuç:
- Bu, bir fonksiyonun benzerliği ve güvenilirliği ile ilgili olarak yapılır.`code/fixtures/`ve `build_fixtures.sh`İç kayıtlar kesin emirler..
- Çı`tool_comparison()`增加 `bindiff`列,并添加测试,比较 BinDiff 在 `-O1`- Evet .`-O2`Üstteki uyumluluk koleksiyonu ile bu ders koruma metin koleksiyonu
- BinDiff'e bir mesaj yazıp onu belirtmek için.`grade`Hangi algoritma kullanıldı ve yükleme görüntülerinin karşılaştırılması mı?

Başarılı Standart: gösterim, her işlevi için dört araç dilimini basıyor, yeni testler bir faz eşitliği veya açıklanmış bir farkı belirliyor.

## 本课产物

本课包含 `outputs/skill-binary-diffing-and-symbolic-execution.md` İki yapı ve bir işlevi kullanarak: uyumlu bir niteliğin belirlenmiş aşama fark raporları, her uyumsuz veya değişen işlevi açıklaması ve her bir nokta için bir giriş topluluğu ve bu topluluğun doğuruşunun sınırlarındaki yol raporları olarak dönüştürülecek.

## 验证

运行演示和套件:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- Simge 4 işlevi verir.`-O0`Büyüklük 46 ≈ 118 ≈ 66 ≈ 39,`-O1`16 ̊46 ̊31 ̊63,`-O2`16 ̊46 ̊140 ̊63
- `-O1`目标文件的  hedef belgeler`.rela.text`记录与 `llvm-objdump -r`打印的描述一致
- Her bir liste emri, belirti alanında, karakterler hedef dosyalara eşittir, değişiklikler yapılır.
- `-O1`Aşağı`total`Beş parça, beş kenar ve bir döngü var, şekil çizgi belirginliklidir.
- `-O0`Aşağı`grade`- Evet .`.rela.rodata`恢复五跳转表目标, get eight块十一边
- 没有跳转表时,`-O0`Aşağı`grade`4 bloktan 82 字节
- `-O0`Aşağı`percent_change`ile`-O1`Aşağı`grade_label` Aynı dört parça şekli ile
- Hedef dosyasının her işlevi yeniden konumlandırılabilir, kesin olarak HACH ile HACH ile uyumlu
- `-O1`和 `-O2`Aynı üç sayısal bölüm var.`-O0`和 `-O1`Hiç
- `grade`引用表为`1, 2, 3, 4, 4`,候选表为 `1, 2, 3, 4, 3`
- Üreticiler iki programı yapacak.`.text`- Evet.`.rodata`和 `.rodata.str1.1` Ghidra ile aynı konuma yerleştirildi
- `R_X86_64_PC32`按 `S + A - P`写入并产生位移 122,`.data`Orta `R_X86_64_64`条目获得字符串地址
- `grade`Bu, bir video üzerinde 0x70'lik bir yer değiştirme ile aynıdır.
- `-O1`- Evet .`-O2`Üç işlevi var.`total`按名称匹配;映像视图中 `grade`按屏蔽字节匹配,相似度为 1 - 1/46
- Bu ders sırasındadır.`-O0`- Evet .`-O1`Bir hata oluşur, bir çarpma oluşur, BinDiff  sırasıyla dört işlevi tamamı isimle uyumlu olur
- 补丁候选在字节上匹配,引用数据上失败
- Levenshtein 比例复现 0.130435、0.106061、0.269841、0.171429、82 字节 üzerindeki 0.426829,以及 radiff2 应用重定位后打印的重定位字节比例
- radiff2'nin MATCH koleksiyonu, görüntü görüntüsünün kesin ve koruma koleksiyonu, Ghidra'nın metni ve talimat bağlantı cihazı gibi.
- Ghidra `-O0`- Evet .`-O1`Sadece eşleşen isimler, her bir benzerlik derecesi 1.0 ̊ inanç derecesi 10.0
- Çekilme ve Çekilme Değerleri
- `grade`- Evet .`-O0`Aşağıda 5 adet şifre var.`-O1`İki yol var ama aynı sınıf.
- var界类别 60 至 69、70 至 79、80 至 89、90 至 109,与 angr 三个优化级及 z3 一致, deadended 状态为 5 和 2,到达块的范围为 90 至 109
- 双项交叉检查在有界域、angr 和 z3 中均无模型,z3 证明清单等于源码开关
- Arama alanı var.`percent_change`Model: Dedikleri değer
- `total`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- Şekil verileri iki görüntü ̇ yeniden konumlandırma değeri ve aynı veriyi yerleştiren beş sayfa düğmesi ve kendi giriş koleksiyonu, istasyon modülü içerir

## Çevre üretim başarısızlık modeli

| 失效情况 | 能力不足的工具报告什么 | 分析必须证明什么 |
|---|---|---|
| 对加载映像取字节哈希 | 两个代码相同的构建之间“grade 被修改” | 字段偏移、两个位移和节的移动；屏蔽哈希匹配 |
| 对可重定位目标文件取屏蔽哈希 | “屏蔽没有影响” | 字段原本就是零；变更存在于重定位记录和引用常量中 |
| 只看流图形状 | 自信地配对两个无关函数 | 第二种签名一致，否则名称矛盾时丢弃匹配 |
| 对已剥离符号构建先用名称再用结构 | 无法匹配 | 各结构阶段及质量，以及未匹配列表 |
| 跨工具直接比较比例 | “radiff2 为 0.43，本课为 0.30” | 两侧各自取指纹的字节；无重定位时 82 字节，有重定位时 118 字节 |
| 相同代码，不同常量 | “精确匹配” | 通过重定位和边界检查读取的表 |
| 将一个模型报告为唯一输入 | “分数是 90” | 90 至 109 的类别、数量，以及发现它的边界 |
| 将有界搜索报告为 unsat | “没有输入产生 -133” | 只在边界内 unsat；z3 在边界外找到 1073741823 |
| 符号循环没有边界 | 超时 | 边界或上限，以及返回、截断和从未开始的路径 |
| 将未运行的闭源工具描述为已运行 | 没有捕获来源的数值 | 带命令和版本的捕获文件，或明确声明仅依据文档 |

## Operasyon kuralları

Her bir imza eşleşmesi, sadece iki tarafta olan benzersiz değerleri kabul eder ve eşleşmede aşama ve kalitesi korur. Ardından hedef dosya ve yükleme görüntülerini karşılaştırın, her iki görünüm arasında eşleşme aşamasının değişikliğini açıklayın.

## 延伸阅读

- [BinDiff concepts: matching strategy, algorithms, and quality ratings](https://github.com/google/bindiff/blob/main/docs/concepts.md)
- [BinDiff repository and the v8 open-source release](https://github.com/google/bindiff/releases/tag/v8)
- [BinExport README: IDA Pro, Binary Ninja, and Ghidra exporters](https://github.com/google/binexport)
- [Flake, "Structural Comparison of Executable Objects" (DIMVA 2004) and Dullien, Rolles, "Graph-based comparison of Executable Objects" (SSTIC 2005), shipped in the BinDiff repository](https://github.com/google/bindiff/tree/main/docs/papers)
- [Diaphora README and heuristics source](https://github.com/joxeankoret/diaphora)
- [Ghidra Version Tracking correlators help page](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/VersionTracking/src/main/help/help/topics/VersionTrackingPlugin/VT_Correlators.html)
- [Ghidra Auto Version Tracking help page](https://www.ghidradocs.com/11.0_PUBLIC/help/VersionTracking/help/topics/VersionTrackingPlugin/VT_AutoVT.html)
- [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Binary Ninja 6.0 "Krypton" release notes](https://binary.ninja/2026/09/03/binary-ninja-6.0-krypton.html)ve [Binary Similarity user guide](https://docs.binary.ninja/guide/similarity.html)
- [radare2 book: radiff2](https://book.rada.re/tools/radiff2/intro.html)ve [radare2 6.2.4 source](https://github.com/radareorg/radare2/releases/tag/6.2.4)
- [King, "Symbolic execution and program testing" (CACM 1976)](https://dl.acm.org/doi/10.1145/360248.360252)
- [Baldoni et al., "A Survey of Symbolic Execution Techniques" (ACM Computing Surveys 2018)](https://dl.acm.org/doi/10.1145/3182657)
- [Cadar, Sen, "Symbolic execution for software testing: three decades later" (CACM 2013)](https://dl.acm.org/doi/10.1145/2408776.2408795)
- [Cadar, Dunbar, Engler, "KLEE: Unassisted and Automatic Generation of High-Coverage Tests for Complex Systems Programs" (OSDI 2008)](https://www.usenix.org/legacy/events/osdi08/tech/full_papers/cadar/cadar.pdf)ve [KLEE 3.2 release](https://github.com/klee/klee/releases/tag/v3.2)
- [Shoshitaishvili et al., "SoK: (State of) The Art of War: Offensive Techniques in Binary Analysis" (IEEE S&P 2016)](https://oaklandsok.github.io/papers/shoshitaishvili2016.pdf)
- [angr documentation: loading, simulation managers, and the simulation pipeline](https://docs.angr.io/en/latest/core-concepts/toplevel.html)ve [angr 10.0.3 on PyPI](https://pypi.org/project/angr/)
- [Z3 5.1.0 release](https://github.com/Z3Prover/z3/releases/tag/z3-5.1.0)
- [Triton dynamic binary analysis library](https://github.com/JonathanSalwan/Triton)
- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, Table 4.9: Relocation Types](https://gitlab.com/x86-psABIs/x86-64-ABI)
