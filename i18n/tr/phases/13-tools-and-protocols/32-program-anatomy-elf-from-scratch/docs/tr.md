# 程序解剖: from零编写 ELF 读取器

> 编译后程序, birbirine yönlendirilmiş bir dizi tablo. Kendi yazısındaki okuma makinesi, bir kısım tarafından bir kez daha oluşturulabilecek bir nüfuz çıkışı sağlayabilir.

**Type:** Build
**Languages:** Python（标准库）、C（仅用于测试夹具）
**Prerequisites:** Phase 0 · 01（开发环境），已安装 clang；Python 3.10 或更高版本；十六进制运算
**Time:** ~120 分钟

## Öğrenme hedefi

- Bu dizi, her analiz hedefinin yetkili kurallarını ve 17 U.S.C. 1201 (f) 'in dört kısıtlamasını açıklıyor.
- Kullanım`struct.unpack`读取 ELF 文件头、节头表和两个字符串表──
- 根据 gABI与 x86-64 psABI 中的名称解码 `.symtab`条目与 `.rela`Kayıt.
- 返回指定函数的准确字节,并将每个文件偏移映射到其属结构──
- 读取程序头,通过 `PT_LOAD`Bu yüzden, bu bir şey değil.
- 读取 Mach-O 目标文件的加载命令,并指出每个命令对应的ELF 概念──

## 开始之前:授权与法律

Bölüm 32 ila 36'da her bir hedef kendi yazma ve düzenleme programıdır.`code/fixtures/ledger.c`Bu dizi, dört kısa C işlevi içerir. Kaynak kodu, düzenleme emri ve oluşturulan hedef dosyaları sizin kontrolünüzde. Burada açıklama izni gerekmiyor. Koruma ihtiyacı yoktur.

Bu kuralın nedeni, yasa karşı汇编 olarak kabul edileceğinden kaynaklanır. *Sega Enterprises Ltd. v. Accolade, Inc.*, 977 F.2d 1510 (9th Cir. 1992) daki davadaki, mahkeme, bir kopyalanma sürecinde ortaya çıkan orta kopyanın, 版权法 anlamındaki kopyalanmaya aittir.

İkinci örnek ise *Sony Computer Entertainment, Inc. v. Connectix Corp.*, 203 F.3d 596 (9th Cir. 2000) ⋅Connectix, PlayStation BIOS'u kopyaladığında, mahkeme bu kopyaları makul kullanımın içine girdiğini kabul etti.

 iki yazılım sınır belirliyor. 17 U.S.C. 1201  f)  yasal olarak elde edilmiş bilgisayar programının kopyalarını kullanma hakkını  kişinin giriş kontrolünü aşmasına izin verir, ancak  tek amacı bağımsız olarak oluşturulan bilgisayar programını diğer programlarla birlikte çalışmayı gerçekleştirmek için gerekli olan elementleri tanımlamak ve analiz etmek olmalıdır. 

Avrupa Birliği, 2009/24/EK Direktifi'nin 5. (3) maddesinde araştırma ile ilgili olarak, bu hak, bir programın arkasındaki fikir ve prensiplerin bir kısmını belirlemek için bir çalışma veya test prosedürünün yürütülmesini gözlemleyebilir, yükleme, gösterme, yürütme, aktarma veya depolama süreci sırasında uygulanabilir.

Bölüm 6 条, bağımsız bir şekilde oluşturulan bilgisayar programlarının birbirine işlem yapabilmesi için gerekli olan bilgileri kullanmak için gerekli olan bilgileri kullanmak için, hak sahibi yetkisi olmadan, yeniden düzenlenebilir.

| 来源 | 允许的行为 | 条件 |
|---|---|---|
| 17 U.S.C. 1201(f) | 绕过访问控制以分析程序 | 合法副本、互操作目的、信息不易获得、不构成侵权 |
| Directive 2009/24/EC 第 5(3) 条 | 观察、研究和测试运行中的程序 | 有权使用副本，行为处于正常加载和运行范围内 |
| Directive 2009/24/EC 第 6 条 | 反编译 | 被许可人、互操作目的、信息不易获得、仅限必要部分 |
| *Sega v. Accolade* | 构成合理使用的反汇编 | 获取思想和功能要素的唯一途径，且理由正当 |
| *Sony v. Connectix* | 逆向工程过程中的中间复制 | 最终产品不侵权 |

Bu bilgiler, yasal madde ve kararlar tarafından alınan önerilerden oluşmaz. Daha sonra hedefinize ait olmayan bir durumla karşılaştığınızda, öncelikle bir yazılı yetki alınmalı ve yeniden açılmalıdır.

## 问题

Sen de yazdın .`ledger.c`, ve hedef dosyaları çalıştırıldı .`llvm-objdump -t`                                                                                                                                       `percent_change`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0000000000000000`, büyüklükte`0000000000000010`◊ Bu 1,768 字节 dosyasının hangi 16 字节 bu fonksiyona ait?`0x36`处显示 `R_X86_64_PC32 .rodata+0x10`Bu dosyada yer alan dört metin ise sıfırdır. Sonunda ne olacak?`0x14`Başlayın, neden artıyor?`0x10`- Ne ?

kullanmak`inspect_binary_layout`回答布局问题,但该工具只在Linux x64 上提供,并通过 `REA_PWNTOOLS_PYTHON`Bu Mac'in üstünde hiç bir şey yok.`address_to_file_offset`需要 Ghidra 会话,以及 SHA-256 匹配的原始文件完整字节副本──`inspect_artifact`Bu nedenle, yaklaşık 950 Python kullanırsınız.`struct.unpack`Ve 0 dıştan kendine bağlı yazıcı okuyucu. Test her tabloyu bir kez toplayıp bir parça olarak saklar.`llvm-objdump`文本 yapıştırmak için

```figure
elf-byte-map
```

## 文件就是指向其他表的表

Sistem V GABI Bölüm 4'ün 4-1'ü aynı dosyanın iki görüntüsünü gösterir. Bağlantı görüntüsü ELF 文件 başlığı  Seçilebilir program başlığı  Bölüm, ve gerekli program başlığı  Bölüm içerir. İcra görüntüsü ELF 文件 başlığı  gerekli program başlığı  Bölüm içerir. Ayrıca seçilebilir program başlığı  Bölüm. GABI'de bir cümle tüm okuyucuyu tasarlamaktadır:  Sadece ELF 文件 başlığı dosyadaki konum sabitdir. Diğer tüm yapılar başka bir yapı tarafından depolamaların yer değiştirilmesi ile konumlandırılır.

GABI ayrıca bir etiketleme türü belirledi ve kendini kullanmadığını belirtti.`Elf64_Addr`和 `Elf64_Off`Her zamanki gibi.`Elf64_Half`占 2 字节,`Elf64_Word`4 字节,`Elf64_Xword`占 8 字节──x86-64 psABI 第 4.1.1 节要求使用 `ELFCLASS64`- Evet.`ELFDATA2LSB`- Evet .`e_machine`Çı`EM_X86_64`(62),`e_flags`Çıktı genişliği, kullanımı anlamına gelir.`<`Önceki `struct.unpack`Bir kere konuşursan bir kayıt okuyabilirsin.

`ledger-x86_64-O1.o`字节:

```text
00000000: 7f45 4c46 0201 0100 0000 0000 0000 0000  .ELF............
00000010: 0100 3e00 0100 0000 0000 0000 0000 0000  ..>.............
00000020: 0000 0000 0000 0000 2804 0000 0000 0000  ........(.......
00000030: 0000 0000 4000 0000 0000 4000 0b00 0100  ....@.....@.....
```

GABİ'nin ELF Header page`e_ident`占 16 字节,包含 `7f 45 4c 46`(魔数,即识别文件格式的固定字节) 类别 2(64 位) DATA编码 1(小端) 版本 1、OS ABI 0(System V)及填充──

Sonra,`e_type``0x0001`Göster`ET_REL`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,`e_machine``0x003e`62, yani.`EM_X86_64` hedef dosya giriş noktası yok, bu yüzden `e_entry`Neden? Bu yüzden bir programı yok.`e_phoff`Neden?`e_shoff`Çı`0x428`,                                                                                                                                                                                                                                                               `e_ehsize` `0x40`- Evet.`e_phentsize`0`e_phnum`0`e_shentsize` `0x40`- Evet.`e_shnum` `0x0b`(11 个节头), ve`e_shstrndx` `0x0001`- Evet.

读取器用一次调用解析这个行:

```python
fields = struct.unpack_from("<HHIQQQIHHHHHH", data, 16)
```

形式字串对应从左到右读取的 gABI 图:两个半字、一个字、三个 8字节值、一个字、六个半字──读取器拒绝魔数、类别或字节序不符的文件,也拒绝不符合 64 和 56 的`e_shentsize`Ya da`e_phentsize`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                            

## 节头与两个字符串表

Her bölüm 64 karakterden oluşur .`Elf64_Shdr`(GABİ 4-8 sayfaları):`sh_name`- Evet.`sh_type`- Evet.`sh_flags`- Evet.`sh_addr`- Evet.`sh_offset`- Evet.`sh_size`- Evet.`sh_link`- Evet.`sh_info`- Evet.`sh_addralign`- Evet.`sh_entsize`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △`<IIQQQQIIQQ`- Evet.`sh_name`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `e_shstrndx`Bölümlerin birbiriyle değişmesi, adı ilk 0 bölümün birbiriyle bitmek.`e_shstrndx`Bu bölümün adı 1 olacak.`.strtab`, bu nedenle aynı tabloda aynı anda depolama bölüm adı ve kod adı vardır.

读取器输出 -O1 目标文件的 11 个节头:

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

索引 0 是保留的空节头──`.text`Dosyaları kaydır .`0x40`处存放 159 字节代码,紧接文件头,标志为`A`(内存中分配) ve `X`(可执行)`.rodata`存放 80 字节只读数据──`.rodata.str1.1`存放五个标签符串 `F\0D\0C\0B\0A\0`,共 10 字节,标志为 `M`(可合并) ve `S`- Evet.

`.comment`存放 47 字节的编译器标记 `\0Apple clang version 17.0.0 (clang-1700.6.3.2)\0`- Evet.`.llvm_addrsig`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0x6fff4c03`, gABI'de bulunur ve işletim sistemlerine özel bir türde`SHT_LOOS`- Evet .`SHT_HIOS`范围内,LLVM'in `ELF.h`                                                                                                                                                                                                                                                              `E`Çı`SHF_EXCLUDE`Bu yüzden bağlantı cihazı onu terk eder.

`sh_link`和 `sh_info`两列是表之间的指针──`.rela.text``sh_info`2'den fazla`sh_link`10. Bölüm 2'yi düzeltir, 10. bölümden kod alır.`.symtab``sh_link`为 1,指向符号名称字符串表;`sh_info`9, ilk yerellisiz simgeyi gösterir.`sh_addr`%2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %2$s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s

gABI'nin iki kuralı, okuyucuyu tam bir dosya çizmek için kullanılamayan bir boşluğu içerir.

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

Üç boşluk, 10 yazı, hepsi bir arada.`.rodata``sh_addralign`Bu yüzden de.`0xe0`Hayır.`0xdf`Başlayın.`.symtab`Bu yüzden 8'e kadar.`.comment`后有七字节未使用──节头表本身也按8字节对齐──

`SHT_NOBITS`类型节完全不占文件字节,因此映射会跳过它们. 本目标文件没有这种类型节,但已链接程序中的 `.bss`Bu sınıflara ait. Eğer bir okuyucu varsa, o da körü körü körü.`sh_size`...bu dosyanın sonuna kadar okumaya devam edebilirim.

## 符号:绑定、类型、属节、值与大小

`Elf64_Sym`占 24 字节 ((gABI 图 4-18):`st_name`- Evet.`st_info`- Evet.`st_other`- Evet.`st_shndx`- Evet.`st_value`- Evet.`st_size`, biçim için`<IBBHQQ`- Evet.`st_info`打包了两个字段:高四位为绑定属性,低四位为类型――gABI 定义的绑定为 `STB_LOCAL`0`STB_GLOBAL`1`STB_WEAK`2. tür`STT_NOTYPE`0`STT_OBJECT`1`STT_FUNC`2`STT_SECTION`3`STT_FILE`4..`st_other`Aşağıda iki yer var.`STV_DEFAULT`0:

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

索引 0 是保留的未定义符号──`st_shndx`指定定义符号的节, diğer üç koruma değeri vardır:`SHN_UNDEF`Dosya adı için kullanılır.`SHN_ABS` `0xfff1`, ve `SHN_COMMON` `0xfff2`△节符号名称为空,因此 `llvm-objdump`Bu nedenle, burada, STB_LOCAL'a bağlı olan tüm kodlar zayıf kodlar ve genel kodlar arasında yer alıyor.`.symtab`- Evet .`sh_info`9'u kaydettim.

Görevi dosyaları yeniden konumlandırılabilir, çünkü`sh_addr`Çıktı.`st_value`Bu nedenle fonksiyonun dosyası hareket etmektedir.`sh_offset + st_value - sh_addr`,长度为 `st_size`- ...

```python
section = elf.sections[symbol.st_shndx]
file_offset = section.sh_offset + (symbol.st_value - section.sh_addr)
code = elf.data[file_offset : file_offset + symbol.st_size]
```

- Evet .`percent_change`Bu yüzden, hareketli olmak.`0x40 + 0`,16 个字节为`85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3`◊ büyüklük ve başlangıç yeri aynı derecede önemlidir.`grade`- Evet .`.text`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0x3e`Son iki bölümden sonra.`66 90`Evet, bu çok güzel.`nop`Uygulama emri, kullanmak için`total`- Evet .`0x40`Bu 16 字節 边界开始── bu iki 字节 herhangi bir simgeye ait değil──第 33 课以`st_size`Bu kısımlar, karşılaştırma yeniden inşa edilmesinin sonuçlarından önce 36'luk ders, karşılaştırma düzenlemesinin durdurulması için şart olarak önlenir.

## 重定位:零字节 ne anlama geliyor?

`Elf64_Rela`占 24 字节 ((gABI 图 4-23):`r_offset`- Evet.`r_info`Ve bir işaret var.`r_addend`, biçim için`<QQq` Yeniden konumlandırma kaydı bağlantıların düzeltilmesi ve hesaplama biçimi için bir bağlantı tanımlamak.`r_info`- ...`ELF64_R_SYM(i)`Çı`i >> 32`- Evet .`ELF64_R_TYPE(i)`Çı`i & 0xffffffff`❖ yeniden konumlandırılabilir dosyalarda,`r_offset`Evet, evet.`sh_info`Kişilik ve formül x86-64 psABI Tablo 4.9'dan geliyor.`S`- Evet, evet.`A`Evet, evet.`P`Yapılan düzeltme yeridir.`L`Yapılan işlemler`R_X86_64_64`Çı`S + A`- Evet .`R_X86_64_PC32`Çı`S + A - P`- Evet .`R_X86_64_PLT32`Çı`L + A - P`- Evet.

-O1  hedef dosyası 8 adet kayıt var:

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

Birinci kaydı söküp atmak.`0x36`位于 `grade`İç, sonrakiler kapsamı `0x10`- Evet .`0x3e`- Evet.`0x33`- Bu emirler...`48 8d 0d 00 00 00 00`, yani hesap RIP görevi`lea`,其四字节位移位于 `0x36`❖ İşleyici bu noktaya eklenecek.`0x3a`Yukarı.

编译器希望结果为 `.rodata + 0x14`Orada bir tane var .`1, 2, 3, 4, 4`Bu nedenle depolama değeri de `(.rodata + 0x14) - 0x3a`△公式`S + A - P`- Evet .`P = 0x36`- Alıyorum .`.rodata + A - 0x36`❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖`A = 0x14 - 4 = 0x10`❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖  ❖ ❖ ❖           ❖                                                                                                 

Bu şöhret bir sesle ifade ediyor.`grade`İçeride`switch`Nasıl geçiyor?`0x66666667`和两次移位计算 `score / 10`, tekrar 6 ≠ 4 ile karşılaştırın, sonra bu tabloyu indeksi edin.`.rodata`Bir ekleme ekle, sadece aynı kaynaklı bir kodun varlığıyla, bu isimle adlandırılacak.`l_switch.table.grade`第二条记录位于 `grade_label``0x84`,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `.rodata + 0x28`处第二张由8字节值组成的表──第三条位于 `0x93`,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `.rodata + 0x0`,即 `labels.rel`- Evet.

五条 `.rela.rodata`Kayıt doldur .`labels.rel`❖ Her bir madde hareket halinde.`4i`- Evet.`4i`Bu yüzden `S + A - P`化简为字符串地址减去表基址──`grade_label`Kullan .`movslq`读取条目,再加回表基址,就得到指针──第一条记录引用节符号 `.rodata.str1.1`, + 0 , çünkü 字符串`F`Bu bölümün ilk bölümünden başlayarak.`.L.str.1`- Evet .`.L.str.4`, onlar bir türcüdür .`D`- Evet.`C`- Evet.`B`- Evet.`A`Ürünlerin yerleşimi etiketleri:

Aynı kaynak kodu üç farklı bir şekilde düzenlenir.

| 构建 | `labels` 的位置 | `grade` 如何选择 | `grade_label` 如何到达 `grade` |
|---|---|---|---|
| -O0 | `.data`，五个 8 字节指针，五条 `R_X86_64_64` 记录 | `.rodata` 中的跳转表：五条指向 `.text` 的 `R_X86_64_PC32` 记录 | 带有 `R_X86_64_PLT32 grade-0x4` 的调用 |
| -O1 | `.rodata` 中的 `labels.rel`，五个 32 位相对条目 | `.rodata+0x14` 处的值表，一条 `R_X86_64_PC32` | 已内联，没有调用 |
| -O2 | 与 -O1 相同 | 与 -O1 相同 | 已内联，`total` 增长到 140 字节 |

-O0 aşağıda,`switch`Gerçekten de, beş tane tane var.`.text`Orta `+0x91`- Evet.`+0x8c`- Evet.`+0x87`- Evet.`+0x82`和 `+0x86`- Evet.`grade`Bu da aynı.`-0x4`Daha fazla neden`lea`Aynı şekilde, optimizasyon cihazı her bir bölümün normal miktarda geri döndüğünü buldu ve sonuçta bu iki biçimi çözecek.

## 程序头: yükleyici's视图

Görevi dosyaları yeniden ayarlamak için bir program yok.`e_phnum`Bu dosyaların tamamlanması için, program başlığı ve yükleyici sadece bu bilgileri okuyabilir.`Elf64_Phdr`占 56 字节(gABI 图 5-1):`p_type`- Evet.`p_flags`- Evet.`p_offset`- Evet.`p_vaddr`- Evet.`p_paddr`- Evet.`p_filesz`- Evet.`p_memsz`- Evet.`p_align`, biçim için`<IIQQQQQQ`△GABİ 为 `PT_LOAD`条目规定三条规则:按 `p_vaddr`升序排列;`p_memsz`Büyüklükte .`p_filesz`%sı sıfır doldurulur.`p_vaddr`ile`p_offset`- Evet .`p_align`取模同余──

Bu serinin her hedefi kendi kendine oluşturduğun bir program. Bu Mac'in üzerinde de yapamayacağın bir program.`ledger.o`Linux'un uygulanabilir dosyaları için bağlantı makinesi.`tiny-x86_64`- Evet .`code/fixtures/build_tiny_elf.py`- Evet .`struct.pack`写出 736 字节──文件包含 ELF 文件头、两个程序头、36 字节的 `_start`、3 字节 的`.rodata`、符号表和六节头──`_start`Dosya tanımlayıcı 1 写入 `ok\n`, sonra 42 status code ile çıkıyor. Linux x86-64 üzerinde çalıştırılabilir; burada, bu programın baş işlem yollarını kapsar.

```text
Program headers:
  PT_LOAD          r-x offset=0x0 vaddr=0x400000 filesz=0x2e0 memsz=0x2e0 align=0x1000
  PT_GNU_STACK     rw- offset=0x0 vaddr=0x0 filesz=0x0 memsz=0x0 align=0x10

entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

- Tek bir şey .`PT_LOAD`Tüm 736 字节 dosyayı haritalama için .`0x400000`△读取器找到包含某地址的 △`PT_LOAD`,再计算 `p_offset + (address - p_vaddr)`, hemen adres haritalama için dosya yönlendirmesi için. Giriş noktası hesaplama `0 + (0x4000b0 - 0x400000) = 0xb0`- Evet .`.text`- Evet.

Bu gerçek.`address_to_file_offset`背后的计算──对 Ghidra 目标,该工具返回 `{address, file_offset}`Hopper                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `provider_file_offset`和 `image_base_file_offset`◊ araçlar tam bir orijinal dosya kopyasına ihtiyaç duyar ve SHA-256 kopyasının hedeflerle uyumlu olması gerekir.`inspect_binary_layout`文档中还有一句值得记住的话: 链接地址不是运行时地址──位置无关可执行文件将会上载到内核选择的基址,只有文件偏移是稳定坐标──

Program başlığı da neden bilgi çekilmesinden sonra da yürütülebilir dosyaların çalışmaya devam edebileceğini açıkladı.`e_shoff`变为零――遍历节的工具会看不到任何内容,而加载器从来不依赖这些节点――

## Mach-O 中的对应概念

Apple, Mach-O'nun yazılı versiyonunu yayınlamadı. XNU kaynak kodundaki başraklar ise şu kuralları içerir:`EXTERNAL_HEADERS/mach-o/loader.h`- Evet.`nlist.h`和 `reloc.h`具 `ledger-arm64-O1.o`Bir kişi tarafından.`ledger.c`Kullanım`clang -target arm64-apple-macos -O1 -fno-asynchronous-unwind-tables -c`Yapımcılık.

`mach_header_64`占 32 字节:`magic`- Evet.`cputype`- Evet.`cpusubtype`- Evet.`filetype`- Evet.`ncmds`- Evet.`sizeofcmds`- Evet.`flags`- Evet.`reserved`◊ 魔数为`0xfeedfacf`,即 `MH_MAGIC_64`- Evet.`cputype`Çı`0x0100000c`,即 `CPU_TYPE_ARM64`- Evet.`filetype`Çıktı.`MH_OBJECT`- Evet.`ncmds`5 için`sizeofcmds`616: yükleme emri, belgelerinin başından sonra, her emirden sonra`{cmd, cmdsize}`Başlayın.`0x2000`Çı`MH_SUBSECTIONS_VIA_SYMBOLS`- Evet.

```text
Load commands:
  0 LC_SEGMENT_64                cmdsize=472 at 0x20
  1 LC_BUILD_VERSION             cmdsize=24 at 0x1f8
  2 LC_LINKER_OPTIMIZATION_HINT  cmdsize=16 at 0x210
  3 LC_SYMTAB                    cmdsize=24 at 0x220
  4 LC_DYSYMTAB                  cmdsize=80 at 0x238
```

`LC_SEGMENT_64`(0x19) 对应 ELF 的两张表――其`segment_command_64`包含 `segname`- Evet.`vmaddr`- Evet.`vmsize`- Evet.`fileoff`- Evet.`filesize`- Evet.`maxprot`- Evet.`initprot`- Evet.`nsects`和 `flags`Aynı emirle birlikte.`nsects`条  `section_64`Kayıt, 每条 80 字节──`loader.h`Hakkında`MH_OBJECT`Bu bölümler, boş bir bölümde yer alır.`fileoff`648'e.`filesize`456'da beş bölüm var.

```text
  Idx Section                    Addr   Size Offset Reloff Nreloc Type
    1 __TEXT,__text               0x0   0xd0    648   1104      6 S_REGULAR
    2 __DATA,__const             0xd0   0x28    856   1152      5 S_REGULAR
    3 __TEXT,__cstring           0xf8    0xa    896      0      0 S_CSTRING_LITERALS
    4 __TEXT,__const            0x108   0x40    912      0      0 S_REGULAR
    5 __LD,__compact_unwind     0x148   0x80    976   1192      4 S_REGULAR
```

Her bölümden geçiyor.`segname`指明所属段, bu yüzden iki isim `__const`Bölüm aynı değil:`__DATA,__const`Birisi de.`__TEXT,__const` Yeniden konumlandırma`reloff`和 `nreloc`按节存放;ELF 则为每目标节设置单独 `.rela.X`- Evet.

Her gün`relocation_info`8 karakterde, öncelikle bir karakter vardır.`r_address`Sonra da 32 bölümden bir bölümden sonra.`r_symbolnum`(24 位)`r_pcrel`(1 位)`r_length`(II.`r_extern`(1 位)`r_type`- Ne? - Hayır.`__text`Kayıt üçtür .`ARM64_RELOC_PAGE21`ile`ARM64_RELOC_PAGEOFF12`, her bir ifade için bir karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı`adrp` 加`add`实现了 x86-64 一条 `lea`Bu nedenle, her bir alıntıda iki kayıt gerekmektedir.`__DATA,__const`Kayıt için`ARM64_RELOC_UNSIGNED`- Evet .`r_length`3. bu yüzden her bir 8 ayet tamamıyla bir işaret.

Armada 64'e göre bir inşaat projesi yapılıyor.`labels`Normal bir işaret için kalırken x86-64  yapı göreci bir tablo oluşturur.

`LC_SYMTAB`(0x2) içerir `symoff`1240`nsyms`17`stroff`1512`strsize`176.1512 artı 176 falan.`nlist_64`占 16 字节:`n_strx`- Evet.`n_type`- Evet.`n_sect`- Evet.`n_desc`- Evet.`n_value`- Evet.`n_type`- Evet.`N_TYPE`(掩码)`0x0e`)  gibi .`N_SECT`(`0xe`),表示符号定义在序号为 `n_sect`Bu bölümde, ilk bölümden başlayarak.`N_EXT`(`0x01`) 标记外部符号──

`nlist_64`没有大小字段──为获取 `_percent_change`Bu bölümde aynı karakterin adresi bulunur.`0x18``_grade`C'li bir işaret var.`_`, bu yüzden funkse adı `_percent_change`- Evet.

`LC_DYSYMTAB`(0xb) ELF ile kayıtlı`sh_info`Aynı yerel 符号優先規則:`ilocalsym`0`nlocalsym`13`iextdefsym`13`nextdefsym`4..`LC_BUILD_VERSION`0x32)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `XXXX.YY.ZZ`整数记录 `platform`1(macOS)`minos`26.0 `sdk`26.2  Çünkü bu emir, arm64   具  字节 biçiminde gönderilmelidir; diğer SDK kullanan Mac'lerde farklı dosyalar oluşur.

读取器的 读取器的 读取器的`compare_formats`İki dosya ile karşılaştır:

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

Gerçekten`inspect_macho`读取 Mach-O,该工具经由 `xcrun`运行  İşlem`otool -h -l`- Evet.`nm -gjU`- Evet.`dyld_info -imports -exports`和 `dwarfdump --uuid`️Bugün okuyucu cihazın bu aletlere ihtiyacı yok ama okuyucuların yanında olacak.`otool -l`输出相同 `symoff`和 `stroff`Bölgeye`open_binary`工具通过魔数识别 ELF、MZ、PE,以及单架构或通用Mach-O,也会自动读取偏移 18 处的 `e_machine`Bu senin burada gerçekleştirdiğin ilk 20 ayet çözümü.`format: raw-binary`、 yapı ve giriş adresi¬¬ Ghidra                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   `0xcafebabe`Bu da böyle bir iş.

## Kendini oluştur

运行仅使用标准库的读取器:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
```

演示读取 `ledger-x86_64-O1.o`, output file head、节、符号、重定位和文件偏移映射; ardından output four functions's字节串,读取 `ledger-arm64-O1.o`Not Output Comparison Table; final output `tiny-x86_64`Program başlıkları:

```text
percent_change: 16 bytes at file offset 0x40: 85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3
grade: 46 bytes at file offset 0x50: 48 63 c7 48 69 c0 67 66 66 66 ...
entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

传入路径可读取单个文件:`python3 code/main.py code/fixtures/ledger-x86_64-O0.o`△读取器根据前四字节选择 ELF 或 Mach-O──

按以下顺序阅读 `code/main.py`- ...

1. `ElfFile._read_header()`检查魔数、类、字节序和条目大小,然后解包文件头──
2. `ElfFile._read_sections()`ile`read_cstring()`读取节头表,并通过 `e_shstrndx`解析名称。
3. `ElfFile._read_symbols()`Çıkar .`st_info`, geçiyor .`sh_link`解析名称,并保持保留节索引可读──
4. `ElfFile._read_relocations()`Her birinden`SHT_RELA`- Çıkart.`r_info`,并依据表 4.9 为类型命名──
5. `ElfFile.function_span()`ile`function_bytes()`Bu karakterler dosya kapsamına ve içindeki karakterlere dönüştürülür.
6. `ElfFile.file_offset_map()`按偏移排序每个结构,并补入未使用空间──
7. `ElfFile._read_program_headers()`ile`address_to_file_offset()`处理可执行文件──
8. `MachOFile`读取文件头,加载命令,包含节的`LC_SEGMENT_64`- Evet.`LC_SYMTAB`- Evet.`LC_BUILD_VERSION`, ve her bölümün yeniden konumlandırılması.
9. `compare_formats()`İki dosyadan alınan değerleri göstermek için aynı kavramın karşılaştırma ilişkileri kullanmak.

## Kullan

Sonraki derslerde, önce bu derslerin.`code`Şimdiye kadar`sys.path`, tekrar geçiyor .`from main import ElfFile`导入读取器──第 33 课会请求 `function_bytes`和 `relocations_for(".text")` 35 课将其输出记录用于观察证. ♦ 36 课获取重定位偏移,以便在字节比较前屏蔽相应位置.

Aynı kullanın `clang -target x86_64-unknown-linux-gnu -c`命令,将自己编写的C 编译为目标文件,再用读取器分析――只有 x86-64 psABI 表 4.9 列出的重定位名称才可添加;只有 gABI 或生成文件的工具链文档记载的节类才可添加──遇到没有对应名称的值时,读取器打印了十六进制数,而不是猜测──

## 交互实验

### 实验 A:手动读取文件头

- Evet .`code`Python'u aç:

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

Gösterilen grup`e_type`1 için`e_machine`62'ye kadar.`e_shoff`1064, yani.`0x428`Son bir bölüm gösterdi`.strtab`存储节名称。

### 实验 B:switch 背后的值表

```python
rodata = elf.section_bytes(elf.section(".rodata"))
[int.from_bytes(rodata[i : i + 4], "little") for i in range(0x14, 0x28, 4)]
[int.from_bytes(rodata[i : i + 8], "little") for i in range(0x28, 0x50, 8)]
[r for r in elf.relocations_for(".text") if r.symbol == ".rodata"]
```

两张表都读出 `1, 2, 3, 4, 4`❖对照 `ledger.c`检查:`grade(65)`计算 `65 / 10 - 6 = 0`,读取条目 0, get 1,即 `case 6`Değerleri:`grade(100)`读取条目 4, get 4,即 `case 10`ile`case 9`共用值──

### 实验C: Aynı kaynaklı üç yapı

```python
for level in ("O0", "O1", "O2"):
    obj = ElfFile.from_path(FIXTURES / f"ledger-x86_64-{level}.o")
    print(level, [s.name for s in obj.sections if s.name in (".data", ".rodata")])
    print(level, sorted({r.type_name for r in obj.relocations}))
    print(level, {s.name: s.st_size for s in obj.symbols if s.type == "FUNC"})
```

-O0  hedef dosyaları var `.data`节和三种重定位类型──-O1 与 -O2 目标文件没有 `.data`Sadece bir tip vardır.`total`-O0 下为 66 字节,-O1 下为 31 字节,-O2 下为 140 字节──

### 实验 D:Mach-O 中的相同函数

```python
from main import MachOFile
macho = MachOFile.from_path(FIXTURES / "ledger-arm64-O1.o")
[(c.name, c.cmdsize) for c in macho.load_commands]
macho.function_span("_percent_change")
macho.function_bytes("_percent_change")[:4].hex()
```

函数范围为文件偏移 648 处的 24 字节──前四个字节是 `a0000034`,即指令 `0x340000a0`Küçük bir biçim,`llvm-objdump -d`Dışarı çıkış`cbz w0, 0x14`- Bu da öyle.`before == 0`Bu, bir diğer deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir de bir deyişle, bir deyişle, bir de bir deyişle, bir de bir deyişle, bir de bir deyişle, bir de bir deyişle, bir deyişle, bir de bir deyişle, bir de, bir de bir deyişle, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de`85 ff 74 09`Aynı kontrol.

## 实践实验

扩展读取器,使其支持已链接程序──在Linux x86-64 机器上,运行 `clang -O1 -shared -fPIC code/fixtures/ledger.c -o libledger.so`, ve ekle `main`后运行 `clang -O1 code/fixtures/ledger.c -o ledger_main`Sonra da bu iki dosyayı bir okuyucu ile analiz edelim.

要求:

- Aynı şeyi kullanın.`Elf64_Sym`布局读取 `.dynsym`Çünkü ...`SHT_DYNSYM`11. ve kayıt biçimi değişmez.
- - Ben de .`.dynamic`读取为由 `d_tag`和 `d_val`组成的 `Elf64_Dyn`记录,并依据 gABIDynamic Section页面命名 `DT_NEEDED`- Evet.`DT_STRTAB`- Evet.`DT_SYMTAB`- Evet.`DT_RELA`和 `DT_JMPREL`- Evet.
- - Ben de .`st_shndx`Çı`SHN_UNDEF`Çeviri: %s`.rela.plt`Orta `R_X86_64_JUMP_SLOT`记录列为到达它们调用位置.
- GABİ'ye göre, bir hedef dosyası bir veya daha fazla bölüm içerir.`PT_LOAD`段映射到其含的节──
- Kullan .`address_to_file_offset`证明,共享目标文件中每个已定义函数的字节与 `function_bytes`Yeniden değer aynı.
- İki dosya.`llvm-objdump -h -t -r -p`和 `llvm-objdump -T`文本采集到 `code/fixtures/`, testte ve okuyucu ile çıkış karşılaştırması

Başarılı Standart: %1 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2

## 评分实验

Bu ders düzenlemeleri hakkında beş soru. Her cevapı oluşturduğunuz kodla bulup yazın.`code/lab_answers.json`△数字写成数字,或写成 `"0x40"`Bu da bir JSON listesi olarak yazılmış bir metin.

1. `t1`:ledger-x86_64-O1.o'nun e_shoff,写成数字──
2. `t2`:ledger-x86_64-O1.o Orta yüzde_değişim
3. `t3`:ledger-x86_64-O1.o 中 .text 的文件偏移,写成十六进制──
4. `t4`:ledger-x86_64-O0.o 中的重定位类型名,排序后写成列表──
5. `t5`:ledger-x86_64-O1.o 中 .rodata+0x14 处的五个 int 值,写成列表──

Cevabını kontrol et:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/lab.py
```

检查器在已提交的固定 上使用 `code/main.py`計算每期值──它为每道题输出 `PASS`- Evet.`FAIL`Ya da`TODO`Ve tüm soruların hepsi 0'dan çıkmak için geçer.`python3 code/lab.py my-answers.json`Başka bir dosya kontrol edebilirsiniz.`code/tests/test_lab.py`証明検查器正确答案を接受并拒绝誤答を。

### Görüyor mu ?

[Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler)Makine bu dersi ilk iki iş yeri olarak kullanıyor.`percent_change`Hedef dosyasının başı, kutusu açıldı.`.text`Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not:

## 本课产物

本课产 出 `outputs/skill-program-anatomy-elf-from-scratch.md` Claude,Cursor,Codex,OpenClaw,Hermes veya herhangi bir SKILL.md akıllı birimi kullanılabilir. Bu beceri, kullanıcı tarafından oluşturulan bir yapılandırma hedef dosyası veya uygulanabilir dosyayı bir düzen raporu olarak dönüştürür, her yapı, simge ve yeniden konumlandırma dosyasının boyutunu verir ve kontrol araçlarının çıkış doğrulamalarını sağlar.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

测试套件验证 Aşağıdaki faktörler:

- Üç x86-64  hedef dosya ve küçük türden uygulanabilir dosya, her bölümün göstergesi, adı, büyüklüğü, adresi ve türleri ve toplamaları `llvm-objdump -h`文本一致
- Her bir simginin değeri, bağlanması, tipi, aitlik bölümü, büyüklüğü ve ismi, toplanıp toplanmaktadır.`llvm-objdump -t`文本一致
- Her bir konum değişimi, tip adı, simge ve eklem, toplama ile birlikte.`llvm-objdump -r`文本一致,包括 -O0 下的 `R_X86_64_PLT32`和 `R_X86_64_64`
- `tiny-x86_64`İki prosedürün başları toplama ile ilgilidir.`llvm-objdump -p`文本一致,而目标文件没有程序头
- `percent_change`位于文件偏移 `0x40`,长度 16 字节,字节 预期符合,且每个函数都位于 `.text`İç
- 文件偏移映射恰好覆盖每件的每字节一次,且 -O1 目标文件的三个对齐空隙位置正确
- `tiny-x86_64`İçeri giriş noktası`PT_LOAD`映射到文件偏移 `0xb0`, ve yeniden konumlandırılabilir hedef dosya reddedilen adres haritalama
- Mak-O 文件头、每条加载命令、段、五节、`LC_SYMTAB`和 `LC_BUILD_VERSION`Şehir ve toplama`--private-headers`文本一致
- Mak-O simgesi ve 15 条 yeniden konumlandırma`llvm-objdump`文本一致,且 `_percent_change`位于偏移 648,长度 24 字节
- 错误魔数、32位类别、大端文件、截断表、通用二进制文件和C 源文件都触发 `FormatError`
- `build_tiny_elf.py`逐字节复现已提交的 `tiny-x86_64`
- 图示模块 `site/figures-re-32.js`包含 `ledger-x86_64-O1.o`Gerçekten mi?

## 生产环境中的失败模式

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

## Operasyon kuralları

读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取可信的文件头, 读取的文件头, 读取可信的文件的文件头, 读取的文件的文件的文件的文件的文件, 读取的文件的文件的文件的文件的文件的文件, 读取的文件的文件的文件的文件的文件是可信的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的的

## 延伸阅读

- [System V gABI, 第 4 章：目标文件](https://www.sco.com/developers/gabi/latest/ch4.intro.html)[ELF Header](https://www.sco.com/developers/gabi/latest/ch4.eheader.html)- Evet .[Sections](https://www.sco.com/developers/gabi/latest/ch4.sheader.html)- Evet .[Symbol Table](https://www.sco.com/developers/gabi/latest/ch4.symtab.html), ile[Relocation](https://www.sco.com/developers/gabi/latest/ch4.reloc.html)Sayfa
- [System V gABI, 第 5 章：程序头](https://www.sco.com/developers/gabi/latest/ch5.pheader.html)ile[Dynamic Linking](https://www.sco.com/developers/gabi/latest/ch5.dynamic.html)
- [System V ABI, AMD64 Architecture Processor Supplement](https://gitlab.com/x86-psABIs/x86-64-ABI), Tablo 4.9: Yeniden konumlandırma tipi
- [Apple XNU `loader.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h)- Evet .[`nlist.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/nlist.h), ile[`reloc.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/reloc.h)
- [17 U.S.C. 1201](https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title17-section1201&num=0&edition=prelim)ile[Directive 2009/24/EC](https://eur-lex.europa.eu/eli/dir/2009/24/oj/eng)
- [Sega v. Accolade, 977 F.2d 1510](https://law.resource.org/pub/us/case/reporter/F2/977/977.F2d.1510.92-15655.html)ile[Sony v. Connectix, 203 F.3d 596](https://law.resource.org/pub/us/case/reporter/F3/203/203.F3d.596.99-15852.html)
- [rea 6.5.0 `docs/binary-diagnostics.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/binary-diagnostics.md)ile[`docs/ghidra-provider.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/ghidra-provider.md)
