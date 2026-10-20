# 链接、加载与剥离符号后的二进制:PLT、GOT、导入、修正与函数识别

> 链接后程序将调用本身不包含的函数――本课读取链接器为这些调用写入三种形式表,沿着一次调用追踪到载器填充的槽位,并在构建产品名称消失后找回其中的函数――

**Type:** Build
**Languages:** Python, C, x86-64 和 arm64 汇编
**Prerequisites:** Phase 13 · 32（从零理解 ELF）、33（反汇编与控制流）、38（调用约定）
**Time:** ~160 分钟

## Öğrenme hedefi

-  Yeniden konumlandırma kayıtlarına ve simgelerine göre, bir bağlantı cihazı, sabit mesafe için işleyecek  GOT 槽位'un PLT 条目 veya hareketli yeniden konumlandırma için.
- 读取位置无关 ELF 可执行文件的动态节、PLT 和 GOT,并使用 psABI 公式沿沿一调用穿越这些结构──
- 读取 COFF 目标文件(20 字节文件头、40 字节节表项、18 字节符号记录、10 字节重定位记录) ve PE32+ 映像的导入、导出和基址重定位目录──
- 逐字解码 Mach-O 链式修正链,并将每个字与 `dyld_info`- Evet.
- Açıklama her türlü biçim içinde`strip`削除什么、保留什么,并运行剥离后的程序证明它仍然能工作──
- Kullan .`LC_FUNCTION_STARTS`、序言扫描和调用目标恢复已剥离 arm64 构建产品的函数起点,对照未剥离副本的符号表给每种方法评分,并使用FLIRT 式签名为函数命名──

## 问题

Sen de öyle olacak .`main.c`ile`libledger.dylib`Bir ajanı sor.`main`- Evet .`0x1000005a0`调用了哪个函数──agent 反汇编该命令,读到 `bl 0x100000694`                                                                                                                                                                                                                                                              `adrp x16`- Evet.`ldr x16, [x16, #0x38]`- Evet.`br x16`◊Agent  沿载操作追踪到 `0x100004038`, okuyacak 8 bölüm`00 00 00 00 00 00 10 80`Raporlama süreci bir bozulma göstergesi ile nükleer alanı kullanmaya başladı.

Sonra, aynı prosedürün sabit yapısal ürünlerini çıkarıp, bunların kaç tane fonksiyon olduğunu soruyorsun.`nm`Sadece bir isim görüyorum .`__mh_execute_header`Birini cevaplamak için.

İki cevap da dosyayı çalışmakta olan bir süreç olarak okudu.`0x100004038`处的字是链式修正──第 63 位表示绑定,十二位表示下一个修正的位置,低位表示要绑定哪个导入──dyld 在 `main`运行前将该字替换为 `_puts`İptal sonrası dosyaların adresleri, kodları kayboldu ama saklandı.`LC_FUNCTION_STARTS`Sonraki dokuz metin ile tüm beş fonksiyonun başlangıç noktalarını listedeyor.

Bu ders Python 標準庫を構成する: kendi hedef dosyalarımızın COFF 読み取機, ayrıca okuma giriş, çıkış ve köşe yeniden konumlandırma katalogunun PE32+ 読み取機; okuma yükleme emri, 、间接符号表、链式修正链,`dyld_info`逐字核对;读取动态节、PLT 和 GOT'in ELF 读取器,加上预测这些目标文件经 PIE 链接会生成什么的规划器; use four methods seeking for the already detached constructed middle function、并 for various methods rating function seeking;以及 FLIRT 式 signing constructor, will reposition the character section set for the common distribution,并计算尾部的 CRC16──

Bu araç sadece bağlantı kurar. Mach-O──arm64  Executable files and dylib 已完成链接、符号剥离并实际运行──ELF 和 COFF 目标文件在这里使用`clang -target`编译;由于没有安装 ELF或PE 链接器,这两种形式的已链接视频由固定 文件中的两个Python脚本按规范逐字节写出──`llvm-objdump`Ve araştırma programı hepsini okuyabilir.

```figure
re-40-call-through-three-formats
```

## 链接器 nasıl yeniden konumlandırılır

Bölüm 32  Ders Dersler Yeni Üyelik Kaydı, Bölüm 33  Dersler`S + A - P`应用于一条 `lea`一条记录指定位置 `P`、 tipi 符号 `S`Üyelik`A`◊x86-64 psABI Tablo 4.9`L`Çıktı PLT 条目位置,`G`Çekilmek için,`GOT`- Adresini bul.`B`Bu, bir dizi yenilikçi ve yenilikçi bir film.

链接器将值写入字段,记录随之消失──针对输入中已定义符号的 `R_X86_64_PC32`Bu durumun içine girer. Yerleşim nasıl yüklenirse yüklenirse yüklenme, aynı görüntüdeki iki metin arasındaki mesafe değişmez.

链接器创建一个 PLT 条目和一个 GOT 槽位──针对未定义函数的 `R_X86_64_PLT32`Bu durumdan biri.`L + A - P`, yani 条目的距離──条目经槽位跳转──`.rela.plt`Orta `R_X86_64_JUMP_SLOT`记录通知动态链接器 doldur bu boşluk için.

链接器为载器保留一个重定位──`R_X86_64_64`Evet, 8 ayet kesinlikle adres, ve yer ise yüklenene kadar dosyaların yerine getirilmesi gerekmez.`.rela.dyn`Orta `R_X86_64_RELATIVE`,公式为`B + A`- Evet.

`main-x86_64-O1.o`18 条 kayıt var:`.text`İçinde 14 条`.data.rel.ro`Orta 2 条`.rodata`Orta 2 条。`code/main.py`Orta `plan_dynamic_link()`Bu kayıtlara uygulanmış üç kuralın yanı sıra`ledger-x86_64-O1.o`- ...

| 记录 | 数量 | 决策 | 原因 |
|---|---|---|---|
| 指向 `.rodata`、`.L.str`、`fns`、`.rodata` 中表的 `R_X86_64_PC32` | 16 | 原地处理 | 符号在输入中已定义 |
| 指向 `percent_change`、`grade`、`total`、`grade_label` 的 `R_X86_64_PLT32` | 4 | 直接调用，不使用 PLT | 在 `ledger-x86_64-O1.o` 中已定义，因此链接器将 PLT32 化简为 PC32 |
| 两次指向 `puts`、两次指向 `printf` 的 `R_X86_64_PLT32` | 4 | PLT 条目和 GOT 槽位 | 未定义，由共享库提供 |
| 指向 `fns[]` 中 `grade` 的 `R_X86_64_64` | 2 | `R_X86_64_RELATIVE` | PIE 中的绝对地址字段 |

两个导入产生 48 字节 的 `.plt`(PLT0 + 2 16 字节条目) 、40 字节的 `.got.plt`(Üç tane rezervasyon ve iki tane rezervasyon) ve 48 字节 `.rela.plt`◊ iki ağırlıklı konum kaydı oluştu 48 字节 `.rela.dyn`Bu rakamlar, kayıtlarımızda uygulanmış olan standartlardan geliyor.`tiny-dyn-x86_64`Aynı iki giriş için planlama ile uyumlu olan PLT'nin bu planlama kısmını gerçekleştirdi.

Binyutels 2.31 ((H.J. Lu,2018-02-13) ve LLVM 7.0.0 ((D43383,2018-02-20) baştan,编译器对每次调用都写入 `PLT32`,不论目标已定义与否――决定权在链接器──因此,目标文件中的 `PLT32`Sadece bir kez yapılan bir düzenleme yapılır, PLT 条目inin olup olmayacağını açıklayamam.`R_X86_64_GOTPCRELX`和 `R_X86_64_REX_GOTPCRELX`(`G + GOT + A - P`) request不带 PLT'nin GOT 槽位, bu `-fno-plt`产生的形式;符号为本地符号时,链接器可能将其松为直接的 `lea`Ya da`call`(B) 附录 B) ⋅`R_X86_64_32`和 `R_X86_64_32S`PIE'deki adresleri kabul edemiyoruz, bağlantı başarısızlığına yol açar.

## 动态节、PLT ve GOT

GABİ Bölüm 5 belirttiği gibi, katılımcıların bir `PT_INTERP`Program başlıca, yüklenebilir tüm bölümlere önce yerleşmesi gerekir; ayrıca bir kapsamına sahip olmalıdır.`.dynamic`节的 `PT_DYNAMIC`Bu bölümde.`Elf64_Dyn`İki grup sayı, her grup bir simge etiket ve değer içerir,`DT_NULL`Bitirmek.

`tiny-dyn-x86_64`- Evet .`build_tiny_dyn_elf.py`按 gABI 和 psABI 写出,共 5,184 字节──它的动态节在 `0x1000`12 bölümü vardır:

| 标签 | 编号 | 值 | 含义 |
|---|---|---|---|
| `DT_NEEDED` | 1 | `libc.so.6` | 字符串表偏移 `0xb`，指定要加载的库 |
| `DT_HASH` | 4 | `0x1a0` | SysV 哈希表 |
| `DT_STRTAB` | 5 | `0x188` | `.dynstr` |
| `DT_SYMTAB` | 6 | `0x140` | `.dynsym`，每条目 24 字节 |
| `DT_STRSZ` | 10 | `0x15` | 21 字节的字符串 |
| `DT_SYMENT` | 11 | `0x18` | 24 |
| `DT_PLTGOT` | 3 | `0x10c0` | `.got.plt` |
| `DT_PLTRELSZ` | 2 | `0x30` | 两条 24 字节记录 |
| `DT_PLTREL` | 20 | 7 | 记录类型为 `DT_RELA` |
| `DT_JMPREL` | 23 | `0x1b8` | `.rela.plt` |
| `DT_FLAGS_1` | `0x6ffffffb` | `0x08000000` | `DF_1_PIE`，GNU 标签 |
| `DT_NULL` | 0 | 0 | 结束 |

GABI  açıkladı `DT_JMPREL`Açık: Bu  yalnızca süreç bağlantılama çizelgesi ile ilgili yeniden konumlandırma hedefleri adreslerini korur. Bu yeniden konumlandırma hedefleri ayrılığa geç kalırsa, hareketli bağlantı cihazı süreç başlatma sırasında onları göz ardı edebilir.`DT_FLAGS`Orta `DF_BIND_NOW`- Evet.`DT_FLAGS_1`Orta `DF_1_NOW`Ya da çevre içinde.`LD_BIND_NOW`Bu konularda, bağlantıların açılışında işlem yapılması için, bir bağlantı kurulumunun yapılması için, bir bağlantı kurulumunun yapılması için, bir bağlantı kurulumunun yapılması için, bir bağlantı kurulumunun yapılması için, bir bağlantı kurulumunun yapılması için, bir bağlantı kurulumunun yapılması için, bir bağlantı kurulumunun yapılması için, bir bağlantı kurulumunun yapılması için, bir bağlantı kurulumunun yapılması için, bir bağlantı kurulumunun yapılması için, bir bağlantı kurulumunun yapılması için, bir bağlantı kurulumun yapılması için, bir bağlantı kurulumun yapılması için, bir bağlantı kurulumun yapılması için, bir bağlantı kurulumun yapılması için, bir bağlantı kurulumun yapılması için, bir bağlantı kurulumun yapılması için, bir bağlantı kurulumun yapılması için, bir bağlantı kurulumun yapılması için, bir bağlantı kurulumun yapılması için.

### PLT0 ile yerleştirme

PSABI Bölüm 5.2 Şekil 5.2'de bu iki biçimi göstermiştir.

```text
     1f0: ff 35 d2 0e 00 00    pushq  0xed2(%rip)      # 0x10c8 = GOT+8
     1f6: ff 25 d4 0e 00 00    jmpq   *0xed4(%rip)     # 0x10d0 = GOT+16
     1fc: 0f 1f 40 00          nopl   (%rax)

     200: ff 25 d2 0e 00 00    jmpq   *0xed2(%rip)     # 0x10d8 = GOT+24, the slot for puts
     206: 68 00 00 00 00       pushq  $0x0             # index 0 into DT_JMPREL
     20b: e9 e0 ff ff ff       jmp    0x1f0            # PLT0
```

亲手计算一次──RIP 相对位移后一条命令为基准──`0x1f6 + 0xed2 = 0x10c8`,即 `.got.plt + 8`- Evet.`0x1fc + 0xed4 = 0x10d0`,即 `.got.plt + 16`- Evet.`0x206 + 0xed2 = 0x10d8`, yani dördüncü yuva.`0x210 - 0x20 = 0x1f0`, yani PLT0── her条目 16 字节, bu yüzden `exit`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0x210`Başlayın, geleceğim`$0x1`Giriş,并读取`0x10e0`- Evet.

GOT 保留三个槽位──psABI 5.2 规定:第零个条目保存 `_DYNAMIC`Bu nedenle, bu konuyla ilgili bir diğer açıklama yapıldı.`.got.plt`İçerik için`0x1000, 0, 0, 0x206, 0x216`❖ Glibc ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖`struct link_map`填入槽位一,将 `_dl_runtime_resolve`填入槽位二──文件中的槽位三保存 `0x206`,即 `puts@plt`İçeride`pushq`◊psABI                                                                                                                                                                                                                                                             

Bu yüzden ilk defa onu kullanıyorum.`call 0x200`- Evet .`jmpq *0x10d8`- Yeter .`pushq $0`- Evet .`jmp 0x1f0`使 GOT+8 入并经 GOT+16 跳入解析器;解析器读取 `DT_JMPREL`Yazı Kayıtları`R_X86_64_JUMP_SLOT puts`, `libc.so.6`Çıkışın sonu`puts`,将其地址写入 `0x10d8`Sonra da geçiyor. İkinci bir ayar sadece yapılması gerekiyor.`call`- Evet.`jmpq *0x10d8`Bu yüzden, ilk kez yapılan alışveriş dışında, tüm alışverişin sadece bir kez yapılmış olduğu bir atlama var.`%r11`脚注 açıklıyor 38 课中的寄存器选择: PLT'deki kodlar herhangi bir寄存器'ı saklamak için fazladan bir kod gerektirmez.

`.text`İçeride`0x227`处的调用点字节为 `e8 d4 ff ff ff`... ve ...`0x22c - 0x2c = 0x200`- Evet.`llvm-objdump`Bu yüzden basıyorum.`callq 0x200 <puts@plt>`,并根据 `.rela.plt`记录为条目命名,`plt_entries()`Aynı yöntemle de adlandırılır.

### Dosyada hiçbir şey yok .

Bu dosya yok .`PT_GNU_RELRO`❖ Yakub Jelinek 2004-01-06 binutels 邮件列表中提出 RELRO: yalnızca yeniden konumlandırma sırasında yazılan bölümler yazılabilir bölümlere taşınır, böylece hareketli bağlantı makinesi daha sonra kullanılabilir.`mprotect`Onu sadece okuyacak şekilde ayarlayacağım.`.init_array`- Evet.`.fini_array`- Evet.`.data.rel.ro`- Evet.`.dynamic`和 `.got`İçlerine gir, ama için.`.got.plt`, sadece üç tane boşluk 24 字节 olarak yerleştirilmiştir, çünkü kalan boşluklar yazılmaya gecikecek.`-z now` ayar `DF_BIND_NOW`,并将整个 `.got.plt`İçine girerek, tam bir RELRO oluştu, çünkü başlatıldıktan sonra gerçekleşmez.`_dl_protect_relro`Sayfalardaki genişlik`mprotect(start, end - start, PROT_READ)`- Evet.`-fno-plt`Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Çzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz`jmpq *name@GOTPCREL(%rip)`, gecikirek bağlanamaz, GCC 手冊称 Tüm dış işaretler yüklenirken çözülmektedir。

Bu dosyanın da bir versiyonu yok.`libc.so.6`- Evet .`.gnu.version`, her biri`.dynsym`条目对应一个 `Elfxx_Half`Ve bir de ekleyeceğim.`.gnu.version_r`Her biri birine karşı .`Verneed`, her versiyon adı对应一条 `Vernaux`Kayıt.`printf@GLIBC_2.2.5`Yani:`printf`- Evet .`.gnu.version`İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç İç Bir İçerik`vna_other`Bu indeksiye göre.`Vernaux``vna_name`GIIBC_2.2.5'e ait.`vn_file`Bu yüzden de.`Verneed`△索引 0 表示本地,1 表示全局,第 15 位(`VERSYM_HIDDEN`- Evet.`0x8000`. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

SysV'den bir haber.`DT_HASH`, içerir bir kutu ve bir üç zincir, toplam 24 字节──动态链接器需要 `DT_HASH`Ya da`DT_GNU_HASH`Bu dosyanın içeriği bulunmuyor, burada da çalışmıyor, bu nedenle glibc'nin tek bir kutu şifresini kabul edip etmediğini henüz doğrulanmamıştır.

### .dynsym、.symtab ve şerit

GABİ `.dynsym`和 `.dynstr`規定為分配内存的节,将 `.symtab`和 `.strtab`規定为不分配内存的节──动态链接器读取前一对,从不读取后一对──Drepper diyor:普通符号表运行时不使用,因此不必要从二进制中剥离它──它对性能没有影响──

GNU `strip --strip-all`删除 `.symtab`- Evet.`.strtab`- Evet.`.debug_*`和 `.comment` tüm bölükler saklanır:`.interp`- Evet.`.dynsym`- Evet.`.dynstr`- Evet.`.gnu.hash`- Evet.`.gnu.version*`- Evet.`.rela.dyn`- Evet.`.rela.plt`- Evet.`.plt`- Evet.`.text`- Evet.`.rodata`- Evet.`.eh_frame`- Evet.`.init_array`- Evet.`.dynamic`- Evet.`.got`- Evet.`.got.plt`- Evet.`.data`- Evet.`.bss`Ve notı.`--strip-section-headers`(Binütiller 2.41) veya运行 `llvm-strip --strip-sections`- Evet.`--strip-debug`Kalmak için bir işaret.`--only-keep-debug`写出调试文件, sonra kullanılabilir `--add-gnu-debuglink`Çıkarılmadan sonra, onu bir belgeye atarak,`.gnu_debuglink`中保存 CRC32;`ld --build-id`写入 `.note.gnu.build-id`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,

## COFF 目标文件

`clang -target x86_64-pc-windows-msvc -O1 -fno-asynchronous-unwind-tables -c`Hayatım.`main-x86_64.obj`和 `ledger-x86_64.obj` PE Format ページ defines this target file:20 字节文件头,没有可选头,节表每项40 字节,符号表每条记录18 字节,每个节重定位记录为10 字节──

`code/main.py`Orta `CoffObject`读取这四部分──文件头给出机器类型 `0x8664`、10 个节、37 条 符号记录, ve ≠ 0 `SizeOfOptionalHeader`│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │`.text`- Evet.`.data`- Evet.`.bss`、六名为 六个名为`.rdata`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `/16`❖`/`开头的名称是字符串表中的十进制偏移,字符串表以自身的四字节大小字段开头;`/16`解析为 `.llvm_addrsig`Yani ...`llvm-objdump -h`打印的名称──

37 条记录包含辅助记录──节符号(存储类别 3) 带有一条辅助记录,保存节长度、重定位数、校验和及COMDAT 选择策略──五个 `.rdata`节的选择值为 2,即any,每个都以 MSVC 修饰后的名称保存一个字符串字面量:`??_C@_04JDDJEAHN@even?$AA@`İşte bu bir yazı. Son kayıt.`.file`,辅助记录为main.c🏼`llvm-objdump -t`Onları basmak için.`[ 0]`- Evet.`AUX scnlen ...`- Evet.`[ 2]`Soru: Bu konuda bir araştırma yapalım.

重定位 şunları içerir:`.text`- Ne demek istiyorsun ?`IMAGE_REL_AMD64_REL32`, ve `.rdata`中 4 条 `IMAGE_REL_AMD64_ADDR64`- Evet.`REL32`Evet, bu da yerleşimden sonra 32'li bir bölümün yerleşiminin yerleşiminin yerleşiminin olduğu anlamına gelir.`-4``R_X86_64_PC32`:ELF 记录携带加数 `-4`Kayıtlarda sayıları artmış, ama COFF kayıtlarında yok.`ledger-x86_64.obj`- Evet .`0x36`- Evet.`0x84`和 `0x93`Üç tane var .`REL32`, 32. Sınıf`ledger-x86_64-O1.o`Çıkışlar`R_X86_64_PC32`Aynı üç yönde de aynı kodlar var.`ADDR64`Evet, tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam da tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam tam`labels`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,`R_X86_64_64`变为 `R_X86_64_RELATIVE`- Evet.

| | ELF `Elf64_Rela` | COFF 重定位 | Mach-O `relocation_info` |
|---|---|---|---|
| 记录大小 | 24 字节 | 10 字节 | 8 字节 |
| 字段 | 偏移、`r_info` 中的类型与符号、加数 | 偏移、符号索引、类型 | 地址，随后为含 symbolnum:24、pcrel:1、length:2、extern:1、type:4 的 32 位字 |
| 加数 | 显式给出 | 无，存于被修正字段内 | 无，或在真正记录之前有一条 `ARM64_RELOC_ADDEND` 记录 |
| 对 `puts` 的调用 | `R_X86_64_PLT32 puts-0x4` | `IMAGE_REL_AMD64_REL32 puts` | `ARM64_RELOC_BRANCH26 _puts` |

## PE 映像: 导入・导出与基址 重定位

`tiny-x86_64.exe`- Evet .`build_tiny_pe.py`写出,共 2,560 字节──它与微型ELF的任务相同:调用 `msvcrt.dll`Orta `puts`和 `exit`                                                                                                                                                                                                                                                              `pefile`2024.8.26 ve `llvm-objdump -p`Şehir okuyabilir, iki kişinin de yakalama ve çıkışı test  具 

逐步浏览头部──MS-DOS 以`MZ`Başlangıçta, hareket halinde`0x3c`处保存 `e_lfanew`, değer`0x40`- Evet.`0x40`- Evet .`PE\0\0`                                                                                                                                                                                                                                                              `0x8664`4 bölüm.`SizeOfOptionalHeader`240                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0x22`(Eğlence görüntülerini desteklemek)`Magic`字段开头, değer为 `0x20b`, PE32+ olarak ifade edilir.`AddressOfEntryPoint`Çı`0x1000`- Evet .`ImageBase`Çı`0x140000000`- Evet .`SectionAlignment`Çı`0x1000`- Evet .`FileAlignment`Çı`0x200`- Evet .`SizeOfImage`Çı`0x5000`- Evet .`Subsystem`"Sadece kontrol altındayım".`DllCharacteristics``0x8160`Çözüm için`HIGH_ENTROPY_VA 0x0020`- Evet.`DYNAMIC_BASE 0x0040`- Evet.`NX_COMPAT 0x0100`和 `TERMINAL_SERVER_AWARE 0x8000`◊ Ardından RVA ve DATA KATESTRI'nin oluşturduğu 16 veri katalogı vardır.`0x2080`、大小 `0x4d`,导入目录位于 `0x2000`、大小 `0x28`,基址重定位目录 yer alan `0x4000`、大小 `0xc`,IAT           `0x2040`、大小 `0x18`- Evet.

映像中的地址是RVA,即相对加载基址的偏移──节表将其映射为文件偏移:`.text`RVA için`0x1000`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,`0x200`- ...`.rdata`RVA için`0x2000`, Location`0x400`- ...`.data`RVA için`0x3000`, Location`0x600`- ...`.reloc`RVA için`0x4000`, Location`0x800`- Evet.`PeImage.rva_to_offset()`Bu da gerçekleştiriliyor.

### 导入目录

RVA `0x2000`处由20字字导入描述符组成、以全零描述符终止的数组──我们的数组只有一个:导入查找表`0x2028`Zaman 0 转发链 0 名称`0x2068`、导入地址表 `0x2040`△名称 RVA 指向 msvcrt.dll──查找表保存 64 位条目,以零结束。第 63 位置位表示按序号导入,序号位于第 15 至 0 位。第 63 位清零表示第 30 至 0 位是提示/name 条目的 RVA:先是16 位提示值,即导出名称指针表中的索引,然后是ASCII 名称。`0x2058`(提示 değer 0,puts)`0x2060`(提示值 0,exit)

规范指出,IAT 在视频绑定之前,导入查找表的内容完全相同──我们位于`0x2040`İİT'in iki RVA'yı aynı şekilde koruma, test test testi `0x2028`24 字节等等 处的`0x2040`处的 24 字节──绑定期间,导入地址表的条目会被导入符号的 32 位(PE32) 或 64 位(PE32+)地址覆盖──Windows yükleyici giriş noktasında运行前完成此事──这里没有延迟绑定,也没有──代码直接访问槽位:

```text
    100b: ff 15 2f 10 00 00    call qword ptr [rip + 0x102f]   # 0x1011 + 0x102f = 0x2040, the IAT slot of puts
    1013: ff 15 2f 10 00 00    call qword ptr [rip + 0x102f]   # 0x1019 + 0x102f = 0x2048, the IAT slot of exit
```

`FF /2`Bu iki emirin şifreyi aynıdır, çünkü sonuncu önceden sonra sekiz şifre, okuyucuğun槽位 de önceden sonra sekiz şifre yer alır.`iat_calls()`Çekim bölümünde.`ff 15`,加上六和位移,再依据导入目录为槽位命名──

### 导出目录

RVA `0x2080`处是 40 字节导出目录表:标志、时间、版本、指向tiny-x86_64.exe的名称 RVA、序号基数 1、1 个地址表条目、1 个名称指针── ardından üç张表──`0x20a8`处的导出地址表保存一个RVA `0x1000`- Evet.`0x20ac`处的导出名称指针表保存一个指向字符串tiny_entry的 RVA──`0x20b0`处的导出序号表保存一个16位未加基数的索引 0──名称 `k`映射到地址条目 `ordinals[k]`,导出序号为 `ordinals[k] + ordinal base` kural da kullanmadığımız bir kural ekliyor: Eğer adresin amacı bölümden çıkmaksa, örneğin bir çevirme satırıdır.`MYDLL.expfunc`;名称指针表则按字典序排列,以支持二分查找──

### 基址重定位

`.reloc`保存多块──每块以页面 RVA 和块大小开头,随后是16位条目,高四位为类型,低十二位为页面内偏移──我们的唯一块包含:页面 `0x3000`、大小 12 条目 `0xa000`、 10 tip, yani `IMAGE_REL_BASED_DIR64`、 0'dan 0'ya kadar bir tür 0'dan doldurma`IMAGE_REL_BASED_ABSOLUTE`│RVA │`0x3000`处的八字节保存 `0x1400020d0`,即映像基址加上字符串链接的 RVA。 Eğer yükleyici görüntüyi başka bir yere gönderirse, bu bölümde基址差值ı artırılır。规范说明:映像文件 does not contain COFF 重定位......映像以 .reloc 节中的基址重定位形式 contains重定位信息(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((`/DYNAMICBASE`Bu yüzden filmler var .`.reloc`和 `DYNAMIC_BASE`- Evet.

PE 映像                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `PointerToSymbolTable` Kayıtlar için sıfır olmalıdır, çünkü COFF 调试信息已弃用,名称存于单独的PDB中──每个映像都将保留导入目录、导出目录; 64 位代码,将保留`.pdata`, bunlardan `RUNTIME_FUNCTION`条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条   条  条   条      条                                                                                                                                                                                                                                                                                                                                                                                                                                                  

## Mach-O 映像: yükleme emri   间接符号表

`ledger_main`Bu da bir bağlantı.`otool -h`打印 19 条加载命令和标志 `0x00200085`- Evet.`MH_NOUNDEFS 0x1`- Evet.`MH_DYLDLINK 0x4`- Evet.`MH_TWOLEVEL 0x80`和 `MH_PIE 0x200000`Aynı değer elde edilir.`LC_SEGMENT_64`(`__PAGEZERO`- Evet.`__TEXT`- Evet.`__DATA_CONST`- Evet.`__LINKEDIT`), 两条`LC_LOAD_DYLIB`(先 `@rpath/libledger.dylib`, 后`/usr/lib/libSystem.B.dylib`), ve各一条 `LC_DYLD_CHAINED_FIXUPS`- Evet.`LC_DYLD_EXPORTS_TRIE`- Evet.`LC_SYMTAB`- Evet.`LC_DYSYMTAB`- Evet.`LC_LOAD_DYLINKER`- Evet.`LC_UUID`- Evet.`LC_BUILD_VERSION`- Evet.`LC_SOURCE_VERSION`- Evet.`LC_MAIN`- Evet.`LC_RPATH`- Evet.`LC_FUNCTION_STARTS`- Evet.`LC_DATA_IN_CODE`和 `LC_CODE_SIGNATURE`- Evet.`MachoFile.command_names()`返回与 `otool -l`Aynı ve sırayla uyumlu bir listedir.

`__TEXT`- Evet .`0x100000000`Başlayın.`__text`位于 `0x100000558`,长 256 字节, sadece `main`, çünkü dört büyüklük fonksiyonu DYLIB'de yer almaktadır.`__stubs`位于 `0x100000658`,长 84 字节,包含七个十二字节──`__DATA_CONST`- Evet .`0x100004000`開始,包含长 64 字节的 `__got`Bu türde sekiz tane işaretleme var.`S_NON_LAZY_SYMBOL_POINTERS`Ayrıca 长 32 字节的 `__const`,即 `main.c``fns[]`和 `names[]`Çıkış

### Birini çözmek için

`_puts`Bu da bir şey.`0x100000694`- ...

```text
    30 00 00 90    adrp x16, 0x100004000
    10 1e 40 f9    ldr  x16, [x16, #0x38]
    00 02 1f d6    br   x16
```

`0x90000030`Evet .`adrp`❖寄存器编号在低五位,值为 16。`immlo`30'dan 29'a kadar, değer 0'dur.`immhi`23'te 5'e kadar, değer 1'dir.`immhi << 2 | immlo = 4`, birim 4,096 字节'in sayfasıdır, bu yüzden hedef sayfa, talimat sayfasıdır.`0x100000000`Üstüne`0x4000`- Evet.`0xf9401e10`Evet .`ldr`, 8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `0x38`, bu yüzden yükleme`0x100004038`- Evet.`0xd61f0200`Evet .`br x16`ld64 源码中的 arm64 正是这个三指令 `StubAtom`- Evet.

槽位属于哪个名称,由间接符号表决定──`LC_DYSYMTAB`15 个符号表索引──节用 `reserved1`Kendini gösterme noktasını belirle, kullan.`reserved2`指出每个大小(12);;指针节使用 `reserved1`, her yer 8 bölüm için.`__stubs`索引 0 开始,`__got`İndeks 7'den başlayarak, bu nedenle 5'i göstermek için 10'uncu bölümüne yerleştirmek.`_puts`- Evet .`__got`Çevreyi 7 aynı bölümde de gösterilmiştir.`otool -Iv`Bu iki bölümün içini yaz.`indirect_table()`复现其中的每一行──

### 两级命名空间

`nm -m`打印 `(undefined) external _puts (from libSystem)`和 `(undefined) external _grade (from libledger)`◊ Kütüp bilgisi kendiliğinden kod kayıtlarından geliyor.`nlist.h`- Ben de .`GET_LIBRARY_ORDINAL(n_desc)`定义为 `n_desc`15'den 8'e kadar: 1`LC_LOAD_DYLIB`, 2 karşı karşı karşı,`0xfe`Çeviri:`0xff`Gösterilen dosyalar.`ld(1)`Açıklama:  kullanmak -two_levelnamespace (standard options) , bağlantı cihazı sadece emir çizgisinde belirtilen dillib içinde belirtilir,  işaretleri bulmak,  kayıt onları hangi dillib içinde bulmak için`nm_lines()`- Evet .`n_type`- Evet.`n_sect`- Evet.`n_desc`和 `n_value`染十二条记录,测试将将其输出与捕获的 `nm -m`逐行比较──用 `-Wl,-flat_namespace`重新链接,再读取 `otool -h`Görüyorum .`MH_TWOLEVEL`- Yok oldu.

## 逐字节理解链式修正

`LC_DYLD_CHAINED_FIXUPS`Evet, bir yazı.`linkedit_data_command`- ...`dataoff 0x8000`- Evet.`datasize 208` This 208 字节 `fixup-chains.h`- Evet.

Başlıkta yedi 32 bölüm var:`fixups_version 0`- Evet.`starts_offset 32`- Evet.`imports_offset 80`- Evet.`symbols_offset 112`- Evet.`imports_count 8`- Evet.`imports_format 1`(`DYLD_CHAINED_IMPORT`)`symbols_format 0`(未压缩)`llvm-objdump --macho --chained-fixups`Bu yedi değerleri yazdır, test yapıp karşılaştır.

偏移 32 处是 `dyld_chained_starts_in_image`- ...`seg_count 4`Ve dört bir hareket, her bir bölüm, hiçbir düzeltme yapmamış bir bölüm.`__DATA_CONST`Düzeltmeler var.`dyld_chained_starts_in_segment`İçerik için`size 24`- Evet.`page_size 0x4000`- Evet.`pointer_format 6`(`DYLD_CHAINED_PTR_64_OFFSET`, hedef ise,`segment_offset 0x4000`- Evet.`max_valid_pointer 0`- Evet.`page_count 1`, ve 0 için bir `page_start`- Evet.`DYLD_CHAINED_PTR_START_NONE`,即 `0xffff`, sayfa değiştirilmediğini belirtti.

链从文件偏移 `0x4000 + 0`开始──每个64字字带有两条信息:应在此写入什么,以及下一个字在哪里──

```text
  dyld_chained_ptr_64_bind    ordinal:24  addend:8  reserved:19  next:12  bind:1 = 1
  dyld_chained_ptr_64_rebase  target:36   high8:8   reserved:7   next:12  bind:1 = 0
```

读取第一个字`0x8010000000000000`❖第 63 位置位,表示绑定──`next`位 62 至 51 位, değer`0x002`, 1 4 字节, bu yüzden, 八字节后, 八字节后, 八字节后, 八字节后, 八字节后, 八字节后, 八字节后, 八字节后, 八字节后, 八字节后, 八字节后, 八字节后, 八字节后, 八字节后, 八字节后, 八字节后, 八字节后, 八字节后, 八字节后, 八字节后, 八字后, 八字后, 八字后, 八字后, 八字后, 八字后, 八字后, 八字后, 八字后, 八字后, 八字后, 八字后, 八字后, 八字后, 八字后, 八字后, 八字后, 八字, 八字, 后, 八字后, 后, 八字, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后, 后`0x4058`12. harf.`0x00000000000006db`△第 63 位清零,表示重设基址──`next`为 0, 链结束.`0x6db`Bu bir sanal bellek kaydırımı ve görüntüleme yapısı.`0x100000000`后成为 `0x1000006db`,即 `__cstring`İçeride bir kelime var.`0x00100000000006d6`则将 `names[0]`重设基址后指向even──

遍历访问十二个字:`__got`0'dan 7'e kadar sekiz kez bağlanmış.`__const`0'dan iki kez bağlanmıştır.`fns[]`İki madde de doğrultusunda.`_grade`), ve `names[]`İki tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane`chained_fixups()`返回它们及其文件偏移和原始字,测试将将12对 `(offset, raw)`ile`dyld_info -fixup_chain_details`İlk baskı için sonrakiler`raw: 0x8010000000000000 bind: (next: 002, bindOrdinal: 0x000000)`- Evet.

偏移 80 处的导入表有八个32位条目:`lib_ordinal:8`- Evet.`weak_import:1`- Evet.`name_offset:23`, isim yerinden uzaklaşır 112--- 0 ila 3 arasında bir sayı var.`_grade`- Evet.`_grade_label`- Evet.`_percent_change`- Evet.`_total`, ilk 4 ile 7 arasında 2'den geliyor.`___stack_chk_fail`- Evet.`___stack_chk_guard`- Evet.`_printf`- Evet.`_puts`- Evet.`fixup_rows()`连接两张表,生成 `dyld_info -fixups`打印的行, örneğin `__DATA_CONST __got 0x100004038 bind libSystem/_puts`;测试比较全部十二行──

Bu yüzden,`0x100004038`Bu zincirden bir kez daha yüklenirken, bir kez daha yüklenir.`_puts`Apple, WWDC22 konuşmasında şöyle açıkladı:  DATA'da 64 nokta işaretleme konumunda, bazı yerler bir sonraki düzeltme konumunun yönlendirmesine dahil olmuştur.  Xcode 13 bu düzeltmeyi bağlamak veya yeniden kurmak için bir nokta da paketleyecek.  Xcode 13 bu düzeltmeyi macOS 12 veya iOS 15'in öntanımlı biçimleri olarak ayarlayacak. Xcode 13.3 de macOS 11 ve iOS 13.4'e genişletilmiş olacak.`main`运行前完成绑定──

### Bu bir düzen değiştirir.

`ledger_main_nochain`Aynı bağlantı süreci kullan, ama ekle `-Wl,-no_fixup_chains`- Değiştirilmiş.`LC_DYLD_INFO_ONLY`, içerir dört 字节编码表:基址重设 8 字节、绑定 72 字节、延迟绑定 120 字节、导出 64 字节──; ayrıca, zincirlenmiş dosyada bulunmayan üç bölüm vardır:`__TEXT,__stub_helper`(108 字节) 、 sadece 16 字节且保存 `___stack_chk_guard`ile`dyld_stub_binder``__got`, ve `__DATA,__la_symbol_ptr`(Küçük bir yer, 7 tane tane)`dyld_info -fixups`列出七行  列出七行 `lazy-bind`Ve her şey bir gecikme noktası ile döner.`__stub_helper`İçinde kendi atlama tahtası.`dyld_stub_binder`,后者解析名称并写入槽位──这是前文 PLT 和 GOT 的马克-奥形态:`__la_symbol_ptr`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `.got.plt`- Evet .`__stub_helper`PLT0 ve   `pushq $index`- Evet .`dyld_stub_binder`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `_dl_runtime_resolve`- Evet.`code/main.py`Rapor dosyanın kısım ve kısımlarını, ama çözülmeyen kodları bağlayan işletim kodlarını; pratik deneylerin bu bölümü tamamlamasını gerektirir.

### 导出典树

`LC_DYLD_EXPORTS_TRIE`Bu, bir önceki ağaçın oluşumudur. Her bir noktayı önce uleb128 编码的终端数据大小;若非零,接着是 uleb128 标志和 uleb128 偏移; sonra bir 字节ün 子节点数; her 节点包含一条字符串边和一个 uleb128 节点偏移──`exports_trie()`Bu ağaca doğru.`libledger.dylib`Geri dönüyor .`_percent_change 0x410`- Evet.`_grade 0x428`- Evet.`_total 0x464`- Evet.`_grade_label 0x498`,即 `dyld_info -exports`Çaplama için dört yönlü bir hareket.`__mh_execute_header`- Evet.`_fns`和 `_main`- Evet.

## Çıkış 留下什么

Apple'ın `strip(1)`Açıklama, hareketli bağlantı için yürütülebilir dosya seçeneği olmayan bir programın çalışması sırasında, davranışları `-u -r`:保留未定义符号和动态引用的符号──`-x`删除本地符号──`-N`删除整个符号表和字符串表――动态共享库, maksimum ayrılma sınıfı genellikle -x, çünkü 动态链接过程只使用全局符号──

Testte gördükleri şey:`strip ledger_main`- Ben de .`LC_SYMTAB`12 条减为 10 条,并删除 `_main`- Evet.`_fns`和 `_names`❖ 8 tanımlanmamış giriş ve giriş, çünkü bunların isimleri bağlanmalıdır.`__mh_execute_header`Ve sakla, çünkü o.`REFERENCED_DYNAMICALLY`△第十条记录是一个类型为 `N_OPT`、名為 `radr://5614542`Bu yüzden, Apple'ın bir aracı var.`nm`Çıkartılmadan sonra yazılan program orijinal versiyonla aynı üç satırda basıldı ve 0 ile çıkıldı.`LC_FUNCTION_STARTS`Hâlâ bir başlangıç var.`main`- Evet.

Seçimler`strip libledger.dylib`- Normalde değil.`-x`Daha da çok:`LC_SYMTAB`0 条 kayıt var,`nm`印無符号──导出字典树仍在相同偏移处列出四个函数,因为ld 通过字典树绑定,从不通过 `LC_SYMTAB`- Evet.`LC_FUNCTION_STARTS`Dört tane daha var. Deneyim yeni bir tane olacak.`main.c`Çekilme sonrası bağlantı, bağlantı cihazının da bu kitaptaki ağaca bağlı olduğunu gösterir.

| 内容 | ELF 在 `--strip-all` 后 | PE 映像 | Mach-O 在 `strip` 后 |
|---|---|---|---|
| 静态符号表 | 删除 | 映像中从不存在 | 本地名称与已定义名称被删除，未定义导入保留 |
| 加载器绑定的名称 | `.dynsym` 和 `.dynstr` 保留 | 导入目录保留 | 导入保留在 `LC_SYMTAB` 和链式导入表中 |
| 导出的名称 | `.dynsym` 保留 | 导出目录保留 | 导出字典树保留 |
| 函数起点 | `.eh_frame` 的 FDE，除非构建时禁用了展开表 | 非叶函数的 `.pdata` | `LC_FUNCTION_STARTS` 保留 |
| 调试信息 | `.debug_*` 删除 | 位于 PDB，从不在映像中 | 位于 dSYM，从不在映像中 |
| 节头或加载命令头 | 除非使用 `--strip-section-headers`，否则保留 | 保留 | 保留 |

## 没有符号时查找函数

`static-arm64-O2`- Ben de .`main-arm64-O2.o`ile`ledger-arm64-O2.o`链接为一个可执行文件,`__text`İçinde beş işlevi var.`nm -n`Evet, gerçekten.`_main`位于 `0x100000500`(Büyük)`_percent_change`位于 `0x1000005f4`(24),`_grade`位于 `0x10000060c`(60),`_total`位于 `0x100000648`(248),`_grade_label`位于 `0x100000740`(72)`static-arm64-O2.stripped``__text`İçinde hiç yok .`N_SECT`符号。`FunctionFinder`Dört farklı yöntemle çalışmak.`score()`Her bir listenin gerçek bir temel ile karşılaştırılması

### LC_FUNCTION_STARTS

Bu emir doğru yönde.`__LINKEDIT`Orta dokuz paragraf:`80 0a f4 01 18 3c f8 01 00`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ `__TEXT`Adı:`80 0a`Çı`0x500`Bu yüzden ilk başlangıç noktası `0x100000500`- Evet.`f4 01`Çı`0xf4`- Al .`0x1000005f4`- Evet.`18`- Al .`0x10000060c`- Evet .`3c`- Al .`0x100000648`- Evet .`f8 01`- Al .`0x100000740`- Evet .`00`終列表──在 `-O0`和 `-O2`Aşağıda 5 tane var, hepsi ortaya çıktı ve yanlış bir rapor yok.`strip`Bu, bir şey değil.`dyld_info -function_starts`Çap, hayatı açığa çıkarır.`function_starts`- Evet.

### Başlangıç tarama

Ghidra'nın AARCH64 起点模式以 `fd 7b bf a9`Başlayın, hemen.`stp x29, x30, [sp, #-0x10]!`Dosyalarımızda, iki optimizasyon seviyesinde sadece 0/5 bulunur.`sub sp, sp, #N`, yeniden doğuştan doğru yönde hareket ediyor `stp x29, x30, [sp, #M]`Bu nedenle, hiçbir zaman ön gösterge biçimi ortaya çıkmadı.`sub sp, sp, #imm`Kullanıcılık`(word & 0xff0003ff) == 0xd10003ff`, her fonksiyonda var `-O0`Aşağıda 5/5 bulabilirim.`-O2`Sadece bir beş buldum.`percent_change`- Evet.`grade`- Evet.`total`和 `grade_label`Tümüyle                                                                                                                                                                                                                                                              `percent_change`E`cbz w0, ...`开始──序言扫描, bir tercümanın seçtiği içeriği yansıtır.

Bu iki tarama da yanlış bir rapor değil çünkü program çok küçük.`push rbp`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `55`Bu tip tek yazı biçimi, diğer emirlerin içinden oluşur; bu nedenle Ghidra'nın x86-64  biçimi dosya biçimi `55 48 89 e5`Bu tür bir arka planlama modeli ve `ret`Ya da`nop`Bu tür bir önlemleme modeli çiftleştirmek, önlemleme modeli bir fonksiyon bitmesini gerektirir.

### 调用目标

`__text`İçinde her biri`bl`C kod üretmek için bir düzenleyici olmayan için, işlevlerin ortasına atlamak için bir işlev oluşturmak için bir işlev oluşturmak için.`bl` 编码为`0x94000000`,带有有符号 26 位字偏移──`0x1000005a0`- Ne ?`bl`字节为 `3d 00 00 94`- ...`0x3d`Evet, 61, 4'e.`0xf4`Bu yüzden hedefimiz`0x100000694`- Evet.`ledger_main`Bu da.`_puts`Bu, bir durumdur.`call_targets()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `__text`İç hedef, terk edilmiş düşmüş.`__stubs`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `LC_MAIN`Giriş, çünkü herhangi bir fonksiyon yok.`main`◊ İki optimizasyon seviyesinin bulunduğu 5/5──Nucleus(Andriesse、Slowinska、Bos,2017) bu düşünceye dayanarak bir araştırmacı tarafından kod üretilen bir fonksiyonun oluşturulduğunu göstermiştir.

## FLIRT 式签名

Hex-Rays, FLIRT'i dosyada şöyle tanımlar: Mode is  fonksiyonun ön 32 字节idir, bunlardan tüm değişken 字节ler işaretlenir, değişken 字节ler düzeltme ve dış alıntılardan kaynaklanır, model ağaçta yer alır; modden sonra,  biz 33 konumdan başlayarak CRC16'daki hesaplama 字节ini hesapladık, ilk değişken 字节ine ulaştıkça,  ve CRC'nin uzunluğunu koruduk.  Mod ve CRC'nin benzer iki işlevi, son bölümden farklı konumdaki bir 字节den ayrılır, tekrar bunların alıntılarının isimleri ayrılır.  Eğer herhangi bir bilgi anlaşmazlığı ayırt edemezse,  İnsan akıllılığı tarafından çözülür.                                                                                                                                                                   

`signatures_from_object()`- Evet .`ledger-arm64-O2.o`和 `main-arm64-O2.o`Bu tür imzaları oluşturmak, FLAIR gibi.`relocation_info`记录覆盖一个四字节字,这些字节成为可变字节.`.pat`Yapılandırma: Modèle, CRC, CRC16, Fonksiyon,`:0000`Ünlü isimler ve her bir isim için`^offset name`- ...

```text
A00000342800004B890C8052087D091B000DC01AC0035FD6 00 0000 0018 :0000 _percent_change
E8CC8C52C8CCAC72087C289B09FD7FD308FD62930801090B081900511F110071 04 9AAF 003C :0000 _grade ^0000 l_switch.table.grade ^0001 l_switch.table.grade
E8CC8C52C8CCAC72087C289B09FD7FD308FD62930801090B081900511F110071 04 9AAF 0048 :0000 _grade_label ^0000 l_switch.table.grade_label ^0001 l_switch.table.grade_label ^0002 _labels ^0003 _labels
```

`_percent_change`长 24 字节, bu nedenle mode= tüm işlevi, CRC=长度=0。`_grade`长 60 字节,第一个重定位在字节 36, bu nedenle CRC 覆盖四个字节──CRC16 使用公开 `.pat`解析器中的算法:多项式 `0x8408`, ilk değer`0xffff`,取反,再交换两个字节──ASCII 字符串123456789的结果为 `0x6e90`, test bu değerini sabitleyecek aşağıya.

`match_signatures()`Bu, bir diğer işlev olarak kullanılır.`-O0`Aşağı, beş işlevi yeniden başlatıldı, hiçbir çatışma yok.`-O2`Aşağıda iki yol çatıştı.`grade_label`İçeride.`grade`Bu nedenle iki fonksiyon ortaklık içinde 36 字节 ve dört CRC 字节 .`0x10000060c`和 `0x100000740`Bölüm 44'de,`_grade`Evet .`20`- Evet .`_grade_label`Evet .`28`,分别对应 `ldr w0, [x9, w8, uxtw #2]`ile`ldr x8, [x9, w8, uxtw #3]`, uzunluk ayrılığı 60 ve 72 olarak gösterilmiştir. Rapor kayıtlı iki çatışma ve kararlı bir biçim oluşturmuştur.

测试 `test_object_bytes_equal_linked_bytes_outside_relocated_words`检查这个前提:每个目标文件函数的所有非可变字节,都等于已链接可执行文件的相同偏移处的字节,因此链接器只修改重定位的字节──`_total`没有重定位,也完全没有可变字节──

### 工具如何运用同样思路 Nasıl kullanılır

IDA Pro 9.4  FIRT  imzası, ayrıca imzayı oluşturmak için kullanılan `sigmake`工具;IDA Free 仅支持 x86 和 x86-64,限非商用使用──Lumina, md5 işleviyle 32 字节siz bir işlevi atlayacak ve anahtar depolama işlevi olarak verileri olan bir sunucu. Gitre 12.1.4 ((Apache-2.0) işlevi ID: yardımcı notör ve arama biçimi hesaplama tam hash, bağlantılara neden olan değişikliklere                                                                                                                                                                                                                    `zg`- Evet.`z/`- Evet.`zb`),并用 `zfs`读取 FLIRT `.sig`文件;rizin 0.9.1(LGPL-3.0) `Fc`Açık ikinci sistem oluşturma`.pat`Ya da`.sig`, `Fs`应用签名──

IDA ve Binary Ninja için kapalı kaynak araçları, burada tanıtıcı dosyalarına göre.`clang`- Evet.`ld`- Evet.`llvm-objdump`- Evet.`otool`- Evet.`nm`- Evet.`strip`和 `dyld_info`, ve keşif programı tarafından yürütülen LIEF 1.0.0 DATA 0.33 DATA PROFILE 2024.8.26 DATA LIEF DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA`ledger_main`報告十次绑定和两次基址重设,即同样十二次修正──pyelfulları`PEFormatError: 'DOS Header magic not found.'`- Hayır , hayır .`main-x86_64.obj`Ama başarılı olmak için küçük bir video okudum.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries
python3 code/main.py
```

输出, beş bölüm içeren bir JSON raporudur.`elf`保存2目标文件的重定位数、链接规划,以及 `tiny-dyn-x86_64`Çeviri: Çeviri:`coff`保存两个目标文件的节、重定位、函数和未定义名称──`pe`保存 `tiny-x86_64.exe`Başlık, Katalog, İndirim, İndirim, Çıkış, Kütle konumlandırma ve IAT 调用`macho`保存 `ledger_main`Çekişleme, düzeltme ve çıkarma`ledger_main_nochain`Eski tablo, dilbi ve iki ayrılan rapor.`identification`保存 `-O0`和 `-O2`Aşağıdaki gerçek temel ✓ değerlendirmenin dört yöntemi, ayrıca imzalanma ve çatışma ✓

预期结构:

```json
{
  "elf": {"linkPlan": {"pltSymbols": ["puts", "printf"], "sizes": {".plt": 48, ".got.plt": 40, ".rela.plt": 48, ".rela.dyn": 48}, "...": "..."}, "tiny-dyn-x86_64": {"...": "..."}},
  "coff": {"main-x86_64.obj": {"...": "..."}},
  "pe": {"imports": [{"dll": "msvcrt.dll", "iat": "0x2040", "...": "..."}], "...": "..."},
  "macho": {"ledger_main": {"flags": "0x200085", "fixupRows": ["__DATA_CONST __got 0x100004000 bind libledger/_grade", "..."], "...": "..."}, "strip": {"...": "..."}},
  "identification": {"O2": {"methods": {"functionStarts": {"recall": "5/5"}, "prologueSub": {"recall": "1/5"}, "...": "..."}, "correctNames": 5}}
}
```

按以下顺序阅读 `code/main.py`- ...

1. `ElfFile`读取头部、节、两张符号表和重定位,`dynamic_entries()`- Evet.`jump_slots()`- Evet.`plt_entries()`和 `plt0()`读取已链接映像──
2. `plan_dynamic_link()`4.9 ve 5.2 bölümleri yeniden konumlandırılabilir hedef dosyalarının yeniden konumlandırma kayıtlarına uygulanır.
3. `CoffObject`读取文件头、节表、带辅助记录的18 字节符号记录,以及10 字节重定位记录──
4. `PeImage`读取 MS-DOS 、PE 签名、可选头、数据目录、节,以及导入,导出和基址重定位目录,`iat_calls()`- Çıkış .`ff 15`- Evet.
5. `MachoFile`读取加载命令、段、`nlist`记录、间接符号表、、链式修正、导出字典树和目标文件重定位──
6. `FunctionFinder`运行四种起点搜寻器,`score()`Her sonucu gerçek temellerle karşılaştırmak.
7. `signatures_from_object()`和 `match_signatures()`构建并应用 FLIRT 式签名──
8. `parse_*`函数读取捕获的工具文本,供测试对照──

更多命令:`python3 code/main.py elf FILE`- Evet.`coff FILE`- Evet.`pe FILE`和 `macho FILE`Her bir rapor yazdırın.`python3 code/main.py plan OBJECT...`打印任意一组 ELF 目标文件的链接规划──`python3 code/main.py functions STRIPPED UNSTRIPPED OBJECT...`Kendi inşaat ürünlerinin diğerlerine arama makinesi ve imzayı değerlendirmek için.

## 实际使用

İnşa ettiğiniz program için, aşağıdaki sırada kullanmak için kullanıcıyı kullanın:

1. 读取头部,确定格式与类:可重定位目标文件、可执行文件或共享库──读取器会拒绝不认识的内容,这种拒绝本身也是信息──
2. 列出导入 ve tedarikçileri:使用 `DT_NEEDED`和 `.dynsym`、İçe aktarım, ya da zincirle aktarım`LC_LOAD_DYLIB`❖ Bu listeye ait her bir isimle ilgili kayıtlar mevcut görüntüden ayrılır.
3. Handwerk bir kez bir arama yaparak kendi boşluklarına ulaşmaktadır.
4. Simge tablosunu çıkarma ve işlevi ile karşılaştırmak.`strip`后保留,仅调试器需要的名称则不会──说明缺失名称原本属于哪一组──
5. Bu nedenle, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede, bu sayede,`LC_FUNCTION_STARTS`- Evet.`.pdata`Ya da`.eh_frame`, değil, şifre modüsü, ı kullanmak ı hedef doldurmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak ı kullanmak 
6. Kendi hedef dosyasından imza oluşturmak ve uygulamak. Her çatışmanın ve onun bölümlerinin ayrımını kaydetmek. Eğer iki imza bir isimle uyumlu olduğunu iddia ederse, sonuçlar bilinmez olarak görülmelidir.

Çıkış çeteleri değişkenlik, test aletleri de değişkenlik anlamına gelir.

## 交互实验

### 实验 A:手工分析 PLT

- Evet .`code`Python'u aç:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries/code
python3 -q
```

运行:

```python
from main import *
elf = load_elf("tiny-dyn-x86_64")
[(e.tag_name, e.text) for e in elf.dynamic_entries()]
elf.plt0()
[(e.symbol, hex(e.address), hex(e.slot), hex(e.slot_initial)) for e in elf.plt_entries()]
[hex(w) for w in elf.got_plt_words()]
```

Her seferinde, önce yukarıdaki yazıların şifrelerine göre hesaplanır.`build_tiny_dyn_elf.py`Orta `IMPORTS`改为三个名称,重新构建,并读取之前预测 `.plt`- Evet.`.got.plt`和 `.rela.plt`Yeni büyüklükte.

### 实验 B:一个链式修正

```python
exe = load_macho("ledger_main")
stub = next(s for s in exe.stubs() if s.symbol == "_puts")
stub.lines()
raw = int.from_bytes(exe.read(stub.slot, 8), "little")
hex(raw), raw >> 63, (raw >> 51) & 0xfff, raw & 0xffffff
[(i.index, i.name, i.library) for i in exe.chained_fixups()["imports"]]
```

Önceki yazı:                                                                                                                                                                                                                                                             `next`字段、序号──然后读取八字节后的字,确认它是下一个修正──再读取链中位于 `0x100004058`Son kelime, neden olduğunu açıkla.`next`Neden?

### 实验 C:剥离与重新链接

Bu programı, yeni bir programla tamamıyla koparmak için kullanılır.

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries/code/fixtures
clang -target arm64-apple-macos -O1 main.c -L. -lledger.stripped -Wl,-rpath,@executable_path -o /tmp/relinked
nm /tmp/relinked | grep ' U '
dyld_info -exports libledger.stripped.dylib
```

Hatta bir de.`LC_SYMTAB`Çekilen, bağlantı hala başarılı olabilir çünkü bağlantı makinesi okuyucuyu gönderir.`python3 ../main.py macho libledger.stripped.dylib`, karşılaştır`symtab`- Evet.`exports`和 `functionStarts`                                                                                                                                                                                                                                                              `-N`剥离静态构建,看看 `dyld_info -function_starts`Hala ne yazıyorsa yazsın.

### 实验 D: Konflikt

```python
from main import *
stripped = load_macho("static-arm64-O2.stripped")
sigs = signatures_from_object(load_macho("ledger-arm64-O2.o"))
[s.pat_line() for s in sigs]
starts = FunctionFinder(stripped).function_starts()
match_signatures(sigs, stripped, starts)
```

阅读两条冲突记录──然后从 `ledger-arm64-O0.o`构建签名,与 `static-arm64-O0.stripped`匹配,并根据 `.pat`行解释为何 `-O0`Aşağıda çatışma yok.`PATTERN_LENGTH`缩短到 16,统计有多少函数发生冲突──

## 实践实验

解码旧版绑定表,并添加 PE 查找器──

要求:

- - Ben de .`ledger_main_nochain``LC_DYLD_INFO_ONLY`基址重设、绑定和延迟绑定操作码流解码包含段、节、地址、类型及目标的行,使其与捕获的`dyld_info -fixups`文本中 21 行一致。
- - Evet .`build_tiny_dyn_elf.py`İçeride eklenir`PT_GNU_RELRO`程序头和带 `DF_BIND_NOW``DT_FLAGS`,将 `.got.plt`移入覆盖范围,使 `llvm-objdump -p`显示新头部──在固定 README 中说明这复现了完整RELRO的哪一部分,以及哪一部分只能由glibc 执行──
- PE32+ 映像编写 `.pdata`读取器,以及使用 `RUNTIME_FUNCTION`起始地址的函数查找器──用 `clang -target x86_64-pc-windows-msvc -c`构建一个目标文件,不加 `-fno-asynchronous-unwind-tables`,读取其 `.pdata`重定位,并说明哪些函数是该表省略的叶函数──
- Her bir okuyucu için yazma ve yakalama araç metnini karşılaştırma testi yapılmalıdır.

Başarılılık Standarı:`python3 code/main.py macho ledger_main_nochain`打印与 `dyld_info` 相同的 21 行修正;微型 ELF 携带能被 `llvm-objdump`Çıkışlar`PT_GNU_RELRO`- ...`.pdata`查找器命名它能找到的函数,并列出它无法找到的叶函数──

## 本课产物

本课包含 `outputs/skill-linking-loading-and-stripped-binaries.md` Bu programı bir rapor olarak dönüştürmek için kullanın: list list out importer and provider, once call tracking to loader filling slot, notation`strip`删除与保留的内容,并对已剥离构建中的函数起点和名称恢复进行评分――; 删除与保留的内容,并对已剥离构建中的函数起点和名称恢复进行评分――; 删除与保留的内容,并对已剥离构建中的函数起点和名称恢复的评分――; 删除与保留的内容,并对已剥离构建中的函数起点和名称恢复的评分――; 删除与保留的内容,并对已剥离构建中的函数起点和名称恢复的评分――; 删除与保留的内容,并对已剥离的复印为真基准的未剥离副本要求,并为每个结论提供捕获的工具清单,并记录每次冲突――;

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries
python3 code/main.py
python3 code/tests/test_main.py
```

验证应证明:

- `tiny-dyn-x86_64`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `llvm-objdump -p`逐标签一致, ve `DT_FLAGS_1`- Hayır .`DF_1_PIE`
- 两条  İki条`R_X86_64_JUMP_SLOT`记录与 `llvm-objdump -R`致,并分别命名 `puts`和 `exit`
- PLT0 GOT+8'e girecek GOT+16'a atlayacak, her bir yazı kendi槽位ini okuyacak, her槽位 kendi kendini koruyacak.`pushq`Adresleri
- 微型 ELF 节和程序头与 `llvm-objdump -h -p`Birliği
- 两个 ELF 目标文件的重定位记录与 `llvm-objdump -r`Birliği
- 链接规划 查找两个PLT 符号、四次直接调用、两条相对重定位,以及微型映像各部分的大小
- COFF 节表、含辅助记录 37 条符号记录以及重定位与`llvm-objdump -h -t -r`Birliği, ve`/16`解析为 `.llvm_addrsig`
- `ledger`Çıkışlar`REL32`记录位于三个 ELF `PC32`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- PE 头部`DllCharacteristics`ve veri defteri ile`llvm-objdump -p`Birliği
- 导入目录、提示/name 条目和IAT `llvm-objdump`及 `pefile`Birlikte, ve bağlanmadan önce IAT gibi arama formları
- 导出目录和 `DIR64`基址重定位可正确解码,重定位后的指针指向字符串链接手头
- RVA `0x100b`- Ne ?`ff 15`Çözümle`puts`İTİ 槽位
- Mach-O 标志、19 个加载命令名称和两个库与 `otool`Birliği
- 7                                                                                                                                                                                                                                                               `__got`槽位,间接符号表与 `otool -Iv`Birliği
- 链式修正头部与 `llvm-objdump --macho --chained-fixups`Birliği
- 链遍历复现 `dyld_info -fixup_chain_details`Tüm 12 orijinal kelime
- 修正行和导入表与 `dyld_info -fixups`及 `-imports`Birliği
- DILİB  ve onun 剥离副本的导出字典树与 `dyld_info -exports`Birliği
-  yürütülebilir belgeler ve kopyaları için,`nm_lines()`Ben de öyleyim .`nm -m`
- `strip`删除 `_main`- Evet.`_fns`和 `_names`, 九个名称和一条 `radr://5614542`Çekilen ve koparılan prosedürlerin baskı ve çıkışı aynıdır.
- Eski bir düzen`LC_DYLD_INFO_ONLY`7 gecikme işaretleri ve yön yönleri`__stub_helper`Çeviri
- arm64 目标文件重定位与 `llvm-objdump -r`Birliği
- `LC_FUNCTION_STARTS`İki optimizasyon seviyesinde 5/5 geri döndü ve `nm`和 `dyld_info -function_starts`Birliği
- `sub sp`扫描在 `-O0`5/5 bul,`-O2`1/5, find`stp`扫描一个也找不到
- `bl`目標加上 `LC_MAIN`Giriş geri kazanma 5/5
- İki optimizasyon sınıfında tüm beş fonksiyonun isimleri belirlenir ve 44'ten ayrılır.`grade` Konflikt
- 123456789 'ın CRC16                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 `0x6e90`, ve `main`GOT'ın yükleme emri kapsamına 8 karakter değişebilir karakterler.
- Değişmeyen hedef dosya karakterleri, karşılıklı bağlantılı karakterlere eşit.
-  Gösterme ve görüntü verileri rapor aynı adres ve istasyon modülü aynı verileri ES5 ile yerleştirir

## 生产环境中的失败模式

| 失败情况 | 能力不足的工具如何报告 | 分析必须证明什么 |
|---|---|---|
| `bl` 或 `call` 落入桩 | “调用了 0x694 处的未命名函数” | 桩的字节、它加载的槽位，以及该槽位绑定的导入 |
| 从文件读取 GOT 字 | “损坏指针 0x8010000000000007” | 第 63 位表示绑定，`next` 为 2，序号 7 是来自库 2 的 `_puts` |
| 目标文件中的 `PLT32` | “每次调用都经过 PLT” | 已定义符号被化简为直接距离，只有未定义符号才获得条目 |
| 将部分 RELRO 误读为完整 RELRO | “GOT 是只读的” | 不使用 `-z now` 时，`.got.plt` 中三个保留槽位之后的槽位位于 `PT_GNU_RELRO` 之外 |
| 将 COFF `REL32` 与 ELF `PC32` 比较 | “Windows 构建使用了不同重定位” | 偏移相同，`-4` 分别存于 ELF 加数和 COFF 字段中 |
| 加载前读取 IAT | “导入指向字符串” | 加载器绑定之前，IAT 等于查找表，而这些字符串属于 hint/name 条目 |
| 已剥离的 dylib | “没有符号，也没有导出” | 导出字典树和 `LC_FUNCTION_STARTS` 列出每个函数 |
| 在已剥离可执行文件上运行 `nm` | “一个函数” | `LC_FUNCTION_STARTS` 用九字节列出五个起点 |
| 在 `-O2` 下扫描序言 | “一个函数” | 四个叶函数没有栈帧，调用目标和起点表能找到它们 |
| 两个函数共享 36 个字节 | “grade_label 就是 grade” | 尾部字节 44 以及长度 60 和 72 将冲突区分开 |
| 在另一台机器的构建产物上运行工具 | 本文中的数字 | 从你自己的测试夹具重新捕获每份清单 |

## Operasyon kuralları

Bu nedenle, bu işlemler, bir bağlantı cihazı tarafından yazılan bir simgeyi yeniden başlatmak için kullanılır. Bu işlemler, bir bağlantı cihazı tarafından yazılan bir simgeyi yeniden başlatmak için kullanılır.

## 延伸阅读

- [System V gABI，第 5 章：程序加载与动态链接](https://www.sco.com/developers/gabi/latest/ch5.dynamic.html)
- [System V 应用二进制接口，AMD64 架构处理器补充规范：第 5.2 节与表 4.9](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Drepper，《如何编写共享库》，版本 4.1.2](https://akkadia.org/drepper/dsohowto.pdf)
- [Drepper，《ELF 符号版本控制》](https://akkadia.org/drepper/symbol-versioning)
- [Jelinek，《对 DSO/可执行文件进行少量加固以抵御利用》，binutils 邮件列表，2004-01-06](https://www.sourceware.org/ml/binutils/2004-01/msg00070.html)
- [Taylor，《链接器 relro》，2008](https://www.airs.com/blog/archives/189)
- [binutils 提交 bd7ab16b：为调用使用 PLT32，2018-02-13](https://gnu.googlesource.com/binutils-gdb/+/bd7ab16b4537788ad53521c45469a1bdae84ad4a)和 [LLVM D43383](https://reviews.llvm.org/D43383)
- [GNU Binutils：strip](https://sourceware.org/binutils/docs/binutils/strip.html)和 [llvm-objcopy](https://llvm.org/docs/CommandGuide/llvm-objcopy.html)
- [Microsoft，PE 格式](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [CALL 指令参考，FF /2](https://www.felixcloutier.com/x86/call)
- [Apple，mach-o/loader.h](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h)和 [mach-o/nlist.h](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/nlist.h)
- [Apple dyld, mach-o/fixup-chains.h](https://github.com/apple-oss-distributions/dyld/blob/main/include/mach-o/fixup-chains.h)
- [Apple ld64, stub_arm64.hpp](https://github.com/apple-oss-distributions/ld64/blob/main/src/ld/passes/stubs/stub_arm64.hpp)
- [Xcode 13 发布说明：链式修正](https://developer.apple.com/documentation/xcode-release-notes/xcode-13-release-notes)和 [WWDC22 第 110362 场，《快速链接：改善构建与启动时间》](https://developer.apple.com/videos/play/wwdc2022/110362/)
- [strip(1)](https://keith.github.io/xcode-man-pages/strip.1.html)- Evet.[ld(1)](https://keith.github.io/xcode-man-pages/ld.1.html)和 [dyld(1)](https://keith.github.io/xcode-man-pages/dyld.1.html)
- [Hex-Rays，深入理解 IDA F.L.I.R.T. 技术](https://docs.hex-rays.com/core/flirt/concepts/ida-f.l.i.r.t.-technology-in-depth)和 [Lumina 概览](https://docs.hex-rays.com/add-ons/lumina/overview)
- [Ghidra Function ID 帮助](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/FunctionID/src/main/help/help/topics/FunctionID/FunctionID.html)和 [AARCH64 函数起点模式](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/AARCH64/data/patterns/AARCH64_LE_patterns.xml)
- [Vector 35，WARP](https://github.com/Vector35/warp)和 [Binary Ninja WARP 指南](https://docs.binary.ninja/guide/warp.html)
- [BinDiff 手册](https://www.zynamics.com/bindiff/manual/)和 [BinDiff 源码](https://github.com/google/bindiff)
- [Diaphora](https://github.com/joxeankoret/diaphora)
- [rizin pat.c，.pat 解析器](https://github.com/rizinorg/rizin/blob/dev/librz/sign/pat.c)- Evet.[radare2 flirt.c](https://github.com/radareorg/radare2/blob/master/libr/anal/flirt.c)和 [radare2 手册：Zignatures](https://book.rada.re/signatures/zignatures.html)
- [Andriesse 等，《对完整规模 x86/x64 二进制反汇编的深入分析》（USENIX Security 2016）](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/andriesse)和 [Andriesse、Slowinska、Bos，《与编译器无关的二进制函数检测》（EuroS&P 2017）](https://danielandriesse.com/papers/eurosp-2017.pdf)
- [Bao 等，ByteWeight（USENIX Security 2014）](https://www.usenix.org/conference/usenixsecurity14/technical-sessions/presentation/bao)和 [Shin、Song、Moazzezi，《用神经网络识别二进制中的函数》（USENIX Security 2015）](https://www.usenix.org/conference/usenixsecurity15/technical-sessions/presentation/shin)
- [LIEF 更新日志](https://lief.re/doc/latest/changelog.html)- Evet.[pyelftools](https://github.com/eliben/pyelftools)和 [pefile](https://github.com/erocarrera/pefile)
