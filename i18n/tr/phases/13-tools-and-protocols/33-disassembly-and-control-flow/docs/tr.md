# Antröym ve kontrol akımı: şifreden doğrulanabilir çizimlere

> Bu ders, hangi metinlerin talimat olduğunu belirten bir liste oluşturur.

**Type:** Build
**Languages:** Python, C, x86-64 assembly
**Prerequisites:** Phase 13 · 32（从零构建 ELF）
**Time:** ~150 分钟

## Öğrenme hedefi

- Intel SDM Bölüm 2 Bölüm 2 Kurallarına göre, çöz code ledger 测试样例中的 x86-64 指令子集──
- Her örnek inşaat ürünleri için her talimat,`llvm-objdump -d`Kontrol kontrol cihazı için.
- Aynı karakterlerin işlevi için, kendi hatalı konumlarını açıklayın.
- Bu yönlendirmeyi temel bloklara ayırarak, yapılandırma ile kontrol yapısı yaparak yapılandırmak için bir kontrol yapısı oluşturmak.
- Cooper, Harvey ve Kennedy'nin 代算法's (Ölkemdeki) kullanarak doğrudan kontrol noktasını hesaplar ve döngü arayarak tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar tekrar
- Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Görevi: Göre

## 问题

- Ne ?`-O0`编译了 `ledger.c`Sonra bir ajanı sor .`grade`Ne yapayım?Agent 调用反汇编器、读取清单, cevap ver: Bu işlevin amacı bilinmiyor `jmpq *%rax`Sonunda, sadece bir yazı yazmış.`return 0`- Evet.

- Ne ?`llvm-objdump -d` Aç aynı hedef dosyasını, atlamadan sonra dört blok var, ayrılı olarak 4、3、2、1  depolumu vardır. Bunlar her zaman liste içinde bulunmaktadır.

清单只回答一个问题:哪些字节构成哪条指令──它不会说明哪些命令会执行、以什么顺序执行、从哪里开始执行──回答这些问题,还需要三种结构:控制流能到达的字节、基本块,以及块之间的边──

rea 6.5.0  kendi bir anti-汇编器 yok. Eğer derinlemesine analiz etmek istiyorsanız, README  kendiliğinden Ghidra、Hopper veya IDA olarak sunmanızı gerektirir.

```figure
re-33-sweep-vs-descent
```

## Öneriler biçiminin her bölümünde bir kural vardır.

Intel SDM 2. bölüm 2 - 1 - 1 図, her bir emir için bir kısım dizini belirler. Öncelikle seçilebilir ön, sonra üç işlem kod dizisi, sonra seçilebilir ModRM 字节 ve seçilebilir SIB 字节.

Bu nedenle, çözücü bir dizi küçük karardır, her kararın arkasında tüm yanıtları el kitabında bulabilirsiniz.

### Önceki bölüm

SDM 2.1.1 列出了传统前──第 1 组包含 `F0`kilitle ve tekrar tekrar`F2`- Evet.`F3`△第 2 组包含六种段覆盖`2E`Evet .`%cs`) ve 分支提示──第 3 组是 `66`Operasyon sayısı büyük bir kapsamlılık.`67`,即地址大小覆盖──

Manual diyor ki her grup bir öncü kullanabilir ama bir düzenleyici daha fazlasını üretir.`ledger-x86_64-O0.o`Orta yön`0xf2`Bu çok güzel.`66 66 66 66 66 2e 0f 1f 84 00 00 00 00 00`, devamlı ortaya çıkıyor .`66`- Evet.`llvm-objdump`Bu yüzden basıyorum.`nopw %cs:(%rax,%rax)`Bu yüzden, inşa ettiğiniz çözücü de öyle. Tüm önceki yazıları görerek, daha sonra neyin gerçekten işe yaradığını belirleyebilirsiniz.

`66`SSE talimatları için, bu bir işlem kodunun seçilmesi zorunludur.`66 0f ef c0`Evet .`pxor %xmm0, %xmm0`16'luk bir iş değil.`F3 0f 6f`Evet .`movdqu`◊ çözücü öncelikle  zorunlu ön  ile ikinci işletim kodı                                                                                                                                                                                                                                                     `66`才表示 16 位操作数──

### REX'in dört kişilik birliği var.

SDM 2.2.1 REX'i tanımlayacak`40`- Ne ?`4F`之间的一个字节,格式为 `0100WRXB`- Evet.`W`选择 64 位操作数。`R`扩展 ModRM 的 reg 字段──`X`扩展 SIB 字段──`B`扩展 ModRM'nin r/m 字段、SIB'nin temel 字段或操作码字节中的寄存器(表 2-4);;REX 操作码或转义字节之前紧接着必须; eğer REX 后面跟随传统前,就会被忽略──

- Evet .`48 89 e5`中,字节 `48`Yapıldı.`W`Bu bir şey.`89`Evet .`MOV r/m, r`ModRM `e5`选择将  Seçim`%rsp`移入 `%rbp` REX'i yok et, kalanı aynı yazı biçiminden oluşuyor.`movl %esp, %ebp`- Evet.

REX de kaydetme cihazının adını değiştirecektir.`%spl`- Evet.`%bpl`- Evet.`%sil`- Evet.`%dil`- Hayır .`%ah`- Evet.`%ch`- Evet.`%dh`- Evet.`%bh`                                                                                                                                                                                                                                                              

### Operasyon kodu iki harita tablosunda paylaşıldı

单字节操作码最常见──`0F`转义到双字节映射表, 转义到双字节映射表, 转义到双字节映射表,而`0F 38`Ya da`0F 3A`转义到样例从未使用的三字节映射表(SDM 2.1.2) ・・・ bazı操作码将 ModRM 字段用作额外的三字节映射表,手册中写作 `/digit`- Evet.`83 /7`Evet, 8'de bir kaç kişi var.`cmp`- Evet .`83 /5`Evet .`sub`- Evet .`FF /4`Evet , evet .`jmp`- Evet.

`code/main.py`Ortalama çözücü, hedef dosyaların dört örneği kapsamaktadır.`mov`- Evet.`lea`- Evet.`movslq`- Evet.`movzbl`- Evet.`imul`、移位、`test`和 `idiv`, ve `push`- Evet.`pop`- Evet.`call`- Evet.`ret`、十六种条件跳转、多字节 `nop`Ve beş SSE2 işletim kodu. Diğer tüm işletim kodları da adres ve nedenlerle atılır.`DecodeError`❖ Tahmin etmek için çalışmayı durdurmak için çalışmak daha kötü bir çözümleme cihazı.

### ModRM 和 SIB 选择操作数

SDM 2.1.3 ModRM'yi bölmek`mod`(Bit 7:6)`reg`(5:3) ve `r/m`(2:0)。`mod = 11`R/m is寄存器──`mod = 00`- Evet.`01`- Evet.`10`分别表示无位移、8位位移或32位位位移的内存寻址──`r/m = 100`Şöyle bir SIB'i takip et.`scale`(7:6)`index`(5:3) ve `base`(2:0);indeksi 为 `100`% % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %

Tablo 2-2'de 64'lik bir modda iki özel kural vardır.`mod = 00`Ve`r/m = 101`Hayır .`(%rbp)`Bu, yeni bir yönetim kurulu olarak kabul edilmiştir.`mod = 00`SIB'nin tabanı`101`,则表示没有基址寄存器的32位位位移──

E`-O0`Aşağı`grade`Orta `8d 44 08 fa`Örneğin, işletim kodu.`8D`Evet .`lea`❖ ModRM `44`Evet .`01 000 100`:8 位位移、reg 为 `%eax`, arka tarafı SIB ve SIB ile .`08`Evet .`00 001 000`:缩放因子 1 索引 `%rcx`、基址 `%rax`△位移字节 `fa`Evet, evet.`leal -0x6(%rax,%rcx), %eax`, hesaplamak  switch  index `score / 10 - 6`- Evet.

### 位移是链接器的写入位置 位移是链接器的写入位置 的位置

`48 8d 0d 00 00 00 00`Evet .`leaq (%rip), %rcx`◊ 4 零字节 RIP ile Operasyon sayısının yer değiştirme ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞`.rela.text`Orta yön`0x69`Yazıların yazısı`R_X86_64_PC32.rodata-0x4`◊psABI ◊表 4.9) `R_X86_64_PC32`定义为 `S + A - P`:符号地址加上加数,再减去该字段的地址──

İşleyici bu bölümü bir sonraki yönlendirmenin adresine ekleyecek, bu nedenle son hedef `S + A + (end - P)`Bu makale için.`lea`,该字段占最后四字节,所以 `end - P`4 için, hedef `.rodata + (-4) + 4 =.rodata + 0x0`△ 4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `-O1``lea`Yukarı `.rodata+0x10`- Aslında anlamı`.rodata+0x14`- Evet.

解码器记录每条命令内部位移字段的偏移──`resolve_reference()`Bu hareketin yerini yeniden konumlandırma tablosunda bul, ve bağlantı sonrası işlemlerin gösterdiği yönü rapor et.`leaq (%rip), %rcx`转变了 转变了  转变了 转变了 转变了 转变了 转变了 转变了 转变了 转变了 转变了 转变了 转变了 转变了 转变了`.rodata+0x0`- Evet.

###                                                                                                                                                                                                                                                               

SDM 2.2.1.5                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `MOV r64, imm64`(带 `REX.W``B8+r`),AT&T 语法称之为 `movabsq`❖ Hesaplama işlemleri için, çözücü 8 位即座数读取为有符号数`83 c1 fa`Evet .`addl $-0x6, %ecx`); Geçiş sayısı ve ağırlık seçeneği için ise,`pshufd $0xee`Bu farklılık`llvm-objdump`Çıkışın birliği.

Yakınlık`push`和 `pop`默认使用 64 位操作数并忽略 `66`Bu nedenle, çözücülerin adı `pushq`- Evet.`popq`- Evet.`callq`和 `retq`- Evet.

## Çözüm bir emir

Önce kağıt üzerinde çözün.`grade`Orta `48 69 c0 67 66 66 66`- Evet.

1. `48`位于 `40`- Ne ?`4F`之间, therefore is `W = 1`REX¬ Operasyon sayısı 64 bit.
2. `69`Evet .`IMUL r, r/m, imm32`- Evet.
3. `c0`Evet ModRM `11 000 000`:寄存器形式,reg 为 `%rax`, r/m 为 `%rax`- Evet.
4. Sonraki dört kısım küçük bir sayıdır:`0x66666667`- Evet.
5. AT&T 顺序为立即数、源、目标:`imulq $0x66666667, %rax, %rax`- Evet.

总计七字节,`llvm-objdump`印文本完全相同──この常数は倒数, let clang can can go through乘法と次数 `sarq $0x22`(右移 34 位) gerçekleştirmek için 10 〜 34 课 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜`score / 10`- Evet.

Çözme makinesi`Decoder.decode()`- Evet.`_State.modrm()`和 `_State.finish()`Bu beş adımını uygulayarak, her bölümünü, SDM'nin küçük bölümlerini, dosya satırlarında belirtilen bir şekilde, bu sırada okuyun.

## 线性扫描

Schwarz、Debray 和 Andrews 在Executable Code'nin Çıkarılması Revisited(WCRE 2002) 3.1. bölüm linear tarama tanımladı: kod bölümünün ilk bölümünden başlayarak, bir emir çözüp, tekrar arkasından, sonuna kadar devam eden bir bölümden başlayarak.`objdump`如此工作,`llvm-objdump`Evet, öyle.

```python
def linear_sweep(code: bytes, start: int = 0, end: int | None = None) -> SweepResult:
    position = start
    while position < end:
        try:
            instruction = decode(code[:end], position)
        except DecodeError:
            undecodable.append((position, code[position]))
            position += 1
            continue
        instructions.append(instruction)
        position = instruction.end
```

Bu yöntemin bir başarısızlık modeli vardır, makale şekili 1 bunu göstermektedir. Veritabilimler emir olarak çözülür, ardından çözücü gerçek emir sınırını geçici olarak geçer. X86'de çözücü genellikle birkaç metrede yeniden eşzamanlanır, bu da hataları fark etmek zorlaştırır.

线性扫描也是本课的参考判定器 (→ ) ⋅解码器 (→ ) ⋅ her örnekte her talimatın üzerinde çalışmalıdır.`llvm-objdump -d`Birliği, ve `llvm-objdump`Bu bir internet taraması.`code/fixtures/*.objdump.txt`△测试将每一行解析为地址、字节和文本,删除 `#`后的注释,再进行比较──四个目标文件分别包含 86、56、84 和 11 条条指令,总计 237 条,解码器全部匹配──

## 递归下降

Aynı makalede 3.2 bölüm ikinci yöntem olarak adlandırılır geri dönüş yolu. Bilinen girişden başlayarak, çözülene kadar kontrol yolu ile geçişle karşılaşmak.

```python
if instruction.flow == "branch":
    worklist.append(instruction.target)
    address = instruction.end
elif instruction.flow == "indirect-jump":
    table = resolver(instruction, instructions) if resolver else None
    if table is None:
        unresolved.append(instruction)
        break
```

Bu yöntemin başarısızlık modeli tam tersine, dolaylı atlama biçimlerinin bir amacı yok, tüm atlamalar burada durur, atlamaların gerçekleşebileceği tüm parçalar hala bilinmez.`main.py`Orta geri dönüş ve düşüş toplantısı, bu durumu iki kez sessizce çözülmek yerine, bir çatışma ve bir yolun durdurulması olarak kaydeder.

Andriesse  et al. 981 bir düzenleyici tarafından üretilen ikileme dosyaları kullanarak dokuz adet anti-report editörü değerlendirdi.`grade`Çeviri: Çeviri:

## Bir linye tarama hatası, geri dönüşü ve düşüşü doğru örnek

`code/fixtures/sweep-trap.s`24 字节li bir yazı, bir 字节li bir şefkat içerir.`movzbl (%rcx,%rax), %eax`İndir, tekrar atlayalım.

```asm
lookup:
        movslq  %edi, %rax
        leaq    .Ltable(%rip), %rcx
        movzbl  (%rcx,%rax), %eax
        jmp     .Ldone
.Ltable:
        .byte   0x31, 0xc0, 0x90, 0x48
.Ldone:
        addl    $1, %eax
        retq
```

Kullanım`clang -target x86_64-unknown-linux-gnu -c sweep-trap.s`Bu, dört karakterden oluşmuş, doğru bir talimat olarak çözülebilir.`31 c0`Evet .`xorl %eax, %eax`- Evet .`90`Evet .`nop`- Evet.`48`Bu yüzden, bu gerçekle bağlantılı olarak,`addl $1, %eax`Bu üç metin için yazılmış.`addq $0x1, %rax`- Yakaladık.`llvm-objdump`Çıkış bu şekilde:

```text
       e: eb 04                        	jmp	0x14 <lookup+0x14>
      10: 31 c0                        	xorl	%eax, %eax
      12: 90                           	nop
      13: 48 83 c0 01                  	addq	$0x1, %rax
      17: c3                           	retq
```

Bu liste hiçbir hasar görmez: her yazı tipi çözülmüş, her yazı tipi gerçek var, ve daha fazlası var.`retq`Ama yine de üç hatalı var.`0xe`处跳转的目标是 `0x14`Bu listeye herhangi bir emir girmedi .`0x14`Gerçekten başladım.`0x14`32 kişi tarafından gerçekleştirildi .`addl`, liste ama önceki bir bölüm 64 yer gösterdi .`addq`◊ 4 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書 図書

- Evet .`lookup`符号开始的递归下降解码出六条命令,沿跳转到达 `0x14`Rapor`addl $0x1, %eax`- 4 şifre falan yok.`plus_one`Önceki sekiz doldurma harfinden herhangi biri bir yönlendirme olarak belirlenmiştir.`main.py`Orta `trap_report()`打印比较结果:

```json
"linearSweep": {
  "instructions": 9,
  "atJumpTarget": {"starts": "0x13", "text": "addq\t$0x1, %rax", "startsAtTarget": false},
  "claimedDataBytes": 4,
  "claimedPaddingBytes": 8
},
"recursiveDescent": {
  "instructions": 6,
  "atJumpTarget": "addl\t$0x1, %eax",
  "claimedDataBytes": 0,
  "claimedPaddingBytes": 0
}
```

测试 `test_sweep_and_objdump_share_the_same_mistake`- Evet.`llvm-objdump`- Evet .`0x13`- Çaplanmış .`addq $0x1, %rax`Reference Determinator is linear scan, also inherited its blind point. Reference Determinator'la uyumlu olarak, sadece kontrol edici kodlayıcıdır.

## 基本块

Allen Control Flow Analysis(1970) içinde temel blokları tanımladı: 一段 only can from the first条 instruction to enter、 from the last条 instruction to leave the instruction sequence。Yakdan 等人在No More Gotos(NDSS 2015) II.A.2 Bölümün karşı bir şekilde yeniden tanımlanmıştır.

Construction process on the order to order addresses has been decoded to execute two times scan── first time collect the order to order: entry、分支或跳转目标、表目标, as well as any control transfer instructions── second time in each order and each gap in the address sequence to start a new block──

```python
for instruction in self.instructions:
    if instruction.address in leaders or current is None or current.end != instruction.address:
        current = Block(instruction.address, [])
        self.blocks[instruction.address] = current
    current.instructions.append(instruction)
```

边由每个块的最后条命令决定──回归没有后继;跳转一个,标记为`jump`Şartlar:`taken`和 `fallthrough`△ Blok sonunun sıradan emir sırası bir sonraki blokta düşer, bu da bir sonraki emir için bir hedef olarak belirlenir.`table`Eğer hedef yoksa, bu bloktan kayda geçiyor.`unresolved`- Evet.

Aynı tarama ile iki başka gerçek ortaya çıktı.`-O0`Aşağıya`grade`Bir parçaın başlangıç adresi başka bir yöntemle bir dizi yönlendirme içinde düşerse, bu da bir örneğin içinde bir üstlenme durumudur.

## toplam kontrol

`-O1`Aşağıda `total`31 字节、13 条 命令:

```text
      40: 85 f6                        	testl	%esi, %esi
      42: 7e 18                        	jle	0x5c <total+0x1c>
      44: 89 f1                        	movl	%esi, %ecx
      46: 31 d2                        	xorl	%edx, %edx
      48: 31 c0                        	xorl	%eax, %eax
      4a: 66 0f 1f 44 00 00            	nopw	(%rax,%rax)
      50: 03 04 97                     	addl	(%rdi,%rdx,4), %eax
      53: 48 ff c2                     	incq	%rdx
      56: 48 39 d1                     	cmpq	%rdx, %rcx
      59: 75 f5                        	jne	0x50 <total+0x10>
      5b: c3                           	retq
      5c: 31 c0                        	xorl	%eax, %eax
      5e: c3                           	retq
```

Başlıklı bir emir var.`0x40`(入口)`0x44`(`jle`之后)`0x50`(`jne`(Sözüm)`0x5b`(`jne`后) 和 `0x5c`(`jle`Çeviri: 5 blok

| 起点 | 终点 | 类型 | 原因 |
|---|---|---|---|
| `0x40` | `0x44` | fallthrough | `jle` 未跳转，计数为正 |
| `0x40` | `0x5c` | taken | 计数为零或负数，返回 0 |
| `0x44` | `0x50` | fallthrough | `nopw` 是块内的对齐填充，执行会经过它 |
| `0x50` | `0x50` | taken | `jne 0x50`，即循环 |
| `0x50` | `0x5b` | fallthrough | 循环退出，返回总和 |

`0x4a`处的六字节 `nopw`Evet, tamam, tamam.`0x50`Çemberin başı 16 字节 sınırında yer alır.`0x44`Sonraki yazı`retq`Sonra...`0x5f`处的单字节 `nop`Ayrıca doldurulur ama oraya ulaşmak için yol yok.`unreachable()`Ben de çıkardım.

- Evet .`-O2`Aşağıda aynı fonksiyonda 140 字节 ve iki döngü vardır.`0x80`处的SSE2 循环体通过 `paddd`Her seferinde 8 değer eklenir,`0xc0`处理──CFG 有两条回边:`0x80 -> 0x80`和 `0xc0 -> 0xc0`Test Suit, bu iki tarafı kontrol etti.

## Kullanılan algoritmalar

Eğer girişten blok'a kadarsa`b`Her yol bir bloktan geçiyor.`d`,则称 `d`支配 `b`- Evet.`b`Bu, doğrudan kontrol noktası.`b`Kontrol noktası arasındaki mesafe`b`Son bir... Bu kavramı Allen'ın (1970) tarihinde,`if`和 `while`- Evet.

Cooper、Harvey 和 Kennedy A Simple, Fast Dominance Algorithm

```python
def intersect(first: int, second: int) -> int:
    while first != second:
        while number[first] > number[second]:
            first = idom[first]
        while number[second] > number[first]:
            second = idom[second]
    return first

changed = True
while changed:
    changed = False
    for start in order[1:]:
        processed = [p for p in self.predecessors(start) if p in idom]
        candidate = processed[0]
        for other in processed[1:]:
            candidate = intersect(other, candidate)
        if idom.get(start) != candidate:
            idom[start] = candidate
            changed = True
```

`number`保存每个块在逆后序中的位置,入口为0──`intersect`İki işaretle, bir araya gelene kadar, şu anki yönetimi üzerinde yürüyerek yukarı doğru ilerleyin.`<`比較──本代码逆后序号を使用,因此比較符是 `>`                                                                                                                                                                                                                                                              

- Evet .`-O1`Aşağıda `total`Sonuçta .`idom(0x44) = 0x40`- Evet.`idom(0x50) = 0x44`- Evet.`idom(0x5b) = 0x50`和 `idom(0x5c) = 0x40`- Evet.`0x50 -> 0x50`Bu, bir dönüm noktasıdır.`back_edges()`Bu tarafı geri çevir.`test_dominators_on_a_hand_built_diamond_with_a_loop`16 metrekarelik bir dizi üzerinde aynı kod çalıştırın.`intersect`İşleme iki öncü.

## -O0 Aşağı sınıf Orta salı çizelgesi

- Evet .`-O0`Aşağı, clang `grade`Orta `switch`编译为位置无关跳转表的惯例形式:

```text
      5d: 83 e8 04                     	subl	$0x4, %eax
      60: 77 38                        	ja	0x9a <grade+0x6a>
      62: 48 8b 45 f0                  	movq	-0x10(%rbp), %rax
      66: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		0000000000000069:  R_X86_64_PC32	.rodata-0x4
      6d: 48 63 04 81                  	movslq	(%rcx,%rax,4), %rax
      71: 48 01 c8                     	addq	%rcx, %rax
      74: ff e0                        	jmpq	*%rax
```

Dört gerçek olarak okuyacağım.`subl $0x4`后跟 `ja`Yapılan sınır kontrolü: büyük 4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `0x9a`Bu yüzden bir şöyledir.`leaq`Adresini göster .`%rcx`, 上一节已经说明该地址为 `.rodata+0x0`- Evet.`movslq`E4 için kısaltma faktörü yüklenmiş bir 32 bitlik bir karakter var.`addq`Üstüne bir tablo oluşturulur, bu nedenle her bir bölüm, bir tablodan diğer bir bölgeye kadar bir mesafeden oluşur.

目標文件deki her bir yazı ise 零── 目標のみで`.rela.rodata`Orta dönüm biçimi mevcut:

```text
RELOCATION RECORDS FOR [.rodata]:
OFFSET           TYPE                     VALUE
0000000000000000 R_X86_64_PC32            .text+0x91
0000000000000004 R_X86_64_PC32            .text+0x8c
0000000000000008 R_X86_64_PC32            .text+0x87
000000000000000c R_X86_64_PC32            .text+0x82
0000000000000010 R_X86_64_PC32            .text+0x86
```

Değişiklik`4k`- Evet .`k`项应用 `S + A - P`◊ depo değeri`.text + A - (.rodata + 4k)`, code tekrar ekle `.rodata + 0`Amacımız bu.`.text + A - 4k`△第 0 项是 `0x91 - 0 = 0x91`,第 1 项是`0x8c - 4 = 0x88`, 2. 项是`0x87 - 8 = 0x7f`△第3、4 项分别是 `0x82 - 12 = 0x76`和 `0x86 - 16 = 0x76`- Evet.`score / 10`C 源码逐行对应, 9 和 10 ortaklık durumları dahil olmak üzere C 源码

`recover_table()`Bu hesapları gerçekleştirmek.`jump_table_resolver()`- Evet .`jmpq`Sonraki uyumlu biçim, bu kaydetmeci değerini oluşturmak için bul`addq`Onu yükle.`movslq`、 oluşturmak `leaq`, ve sınır kontrollerini gerçekleştirmek için.`ja` Geri dönüş ve düşüş ardından dört farklı hedef katılır.`evidence`记录生成目标所用的路径──

Aşağıda `-O0`Aşağı`grade`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `python3 code/main.py cfg code/fixtures/ledger-x86_64-O0.o grade`- ...

| 方法 | 指令数 | 块数 | 边数 | 字节 | 问题 |
|---|---|---|---|---|---|
| 线性扫描 | 34 | 9 | 7 | 118 代码 + 10 填充 | 5 个不可达块，没有进入四个 case 块的边，填充被解码为 `nopw` |
| 递归下降 | 25 | 3 | 2 | 82 代码 | 36 个代码字节从未到达，`0x74` 处的 `jmpq *%rax` 未解析 |
| 带表的递归下降 | 33 | 8 | 11 | 118 代码 | 无 |

恢复表后,支配树完整了──每个案块的`idom`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0x62`- Evet.`0xa1``idom`Evet , giriş .`0x30`Çünkü ben de öyleyim.`0x9a`Önemli olmayan bir yol.`0x62`- Gelmek üzere.`0xa1`- Evet.

## -O1'de sınıfı nasıl bir şekilde değiştiriyor?

Bu tür bir açıklama görmüş olabilirsiniz:`grade`Bu, bir atlama şifresinin anahtarı olarak tercüme edilmiştir.`-O1`和 `-O2`Aşağı,`grade`İçinde hiç bir içe içe sıçramadı:

```text
      2c: 83 f9 04                     	cmpl	$0x4, %ecx
      2f: 77 0c                        	ja	0x3d <grade+0x2d>
      31: 89 c8                        	movl	%ecx, %eax
      33: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		0000000000000036:  R_X86_64_PC32	.rodata+0x10
      3a: 8b 04 81                     	movl	(%rcx,%rax,4), %eax
      3d: c3                           	retq
```

重定位加数 `0x10`Normalde 4'e katılır.`.rodata+0x14` yüklenme sadece sıradan `movl`, 該处字节为`01 00 00 00 02 00 00 00 03 00 00 00 04 00 00 00 04 00 00 00`◊ 5 geri dönüş değerini içeren bir tablo, 5 adet blok yerine geçmiştir. Burada yeniden konumlandırma ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊       ◊   ◊ ◊                    ◊ ◊                               `find_value_tables()`Raporlama yapılması`value-table`,条目为 `[1, 2, 3, 4, 4]`, 并带有 `evidence: "bytes"`- Evet.

`-O2`Aşağıda `grade_label`Daha da fazlası. Beş karakterli işaret içerir.`labels`Numara, yerleşim`.rodata+0x0`、 beş 32 nokta yönlü tablo içerir.`R_X86_64_PC32`重定位, işlevi gösterir Adres eklenir yüklenmiş olan条目上──`recover_table()`Bu beş tane yeniden yerleşim, geri dön.`.rodata.str1.1`Orta yön`0, 2, 4, 6, 8`, onlar birbirinden koruyorlar .`F`- Evet.`D`- Evet.`C`- Evet.`B`- Evet.`A` Salma çizelgesinin aynı hesaplama kümesi de verilere göre yeniden kurulabilir, çünkü bunlar bilinen birer çevrelemedir.`S + A - P`- Evet.

Bu iki yapısal sürümden gelen dersler şunlardır: şifreye göre sunulan gerçek durumun adı, kontrol akışını değiştirme, değer çizelgesini değiştirme ve bir kez yükleme.

## Rea 和 Ghidra burada ne sunar

rea 6.5.0 配合 Ghidra 12.1.4 tedarikçisi,将 `procedure_assembly`中函数的列表文本作为一个字符串返回──`inspect_native_instruction`返回单条命令的字节、长度、解码文本、操作数符号、带类型引用和控制流,其中返回操作根据p-code 分类──`xrefs`Ghidra'nın geri dönüşü`ReferenceManager.getReferencesTo`Sorumlu sıralamalar`analyze_function`包含函数的 CFG 和 `body`- Evet.`procedure_info`Fonksiyonun iki ucundan da içerdiği adres aralığını ifade ederek,  hatırlatıyor:  boşluğu ve paylaşılan kısımları fonksiyonun sahip olduğu karakter olarak göremez.

Bu gerçekler Ghidra'nın geri dönüşü ve düşüşü ve analiz cihazının sonuçlarının sıralanma biçimidir.`instruction_flow_evidence`- Evet.`function_references`和 `jump_table_evidence`Bu nedenle sonuçlar, kurallarını belirleyecek, ancak yönlendirme sürecini gösteremez.

Şimdi, aynı hedef dosyasında çalışmaya başladın.`python3 code/main.py cfg`, blok başlangıç adresi, sınır sayısı ve geri dönüş sunucusunun verileceği içeriği kontrol etmesi.

CVE-2026-55893 ve CVE-2026-55894'i yeniden değiştirdi.`_Cursor.byte()`Kesinlikle kontrol edilmesi ve bilinmeyen işlem kodunu reddetmesi, tüm korunmaktadır.`main.py`, tasarımının kapsamından fazlasını işlemeyi önlemek için.

## 动手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/main.py
```

输出 bir JSON raporu olarak gösterilmektedir. Her örnek hedef dosyasının referans belirleyicisi ile uyumluluğunu verir; her işlevi üç yönteme göre talimat sayısı, blok sayısı ve kenar sayısı olarak gösterir. Ayrıca, ulaşamayan blokları, çözülmemiş, dolaylı olarak atlatılmamış, geriye dönmüş, doğrudan kontrol düğümlerini ve tüm tabloları listeler. Son olarak, bir örnek karşılaştırması verir.

预期结构:

```json
{
  "fixtures": {
    "ledger-x86_64-O0.o": {
      "oracle": "86/86 instructions agree with llvm-objdump",
      "functions": {
        "grade": {
          "range": "0x30-0xa6",
          "paddingBytes": 10,
          "linearSweep": {"instructions": 34, "blocks": 9, "edges": 7, "unreachableBlocks": ["0x76", "0x7f", "0x88", "0x91", "0xa6"], "...": "..."},
          "recursiveDescent": {"instructions": 25, "blocks": 3, "edges": 2, "unresolvedIndirectJumps": ["0x74"], "...": "..."},
          "recursiveDescentWithTables": {"instructions": 33, "blocks": 8, "edges": 11, "...": "..."},
          "tables": [{"kind": "jump-table", "table": ".rodata+0x0", "count": 5, "entries": ["0x91", "0x88", "0x7f", "0x76", "0x76"], "evidence": "relocation", "...": "..."}]
        }
      }
    }
  },
  "sweepTrap": {"...": "..."}
}
```

按以下顺序阅读 `code/main.py`- ...

1. `ElfObject`读取节头、符号和 `.rela.*`条目,`symbolize()`按 `llvm-objdump`Çeviri adı için bir yöntem.
2. `Decoder.decode()`读取前和REX,然后根据单字节或双字节操作码映射分派──
3. `_State.modrm()`读取 ModRM、SIB 和位移,并记录位移字段的偏移──
4. `resolve_reference()`Yer değiştirme veya hemen dijital segment üzerinde yeniden konumlandırma uygulaması `S + A - P`- Evet.
5. `linear_sweep()`和 `recursive_descent()`İki yöntem var, her biri başarısızlık durumunda.
6. `recover_table()`和 `jump_table_resolver()`通過重定位或字节读取表──
7. `ControlFlowGraph`构建首指令、块和带类型边,`dominators()`实现代算法──
8. `analyze_function()`Bir fonksiyon için tüm yöntemleri,`compare_with_oracle()`Çekim Çekimci

İki emir daha var.`python3 code/main.py disasm FILE.o`印清单, ve yeniden konumlandırma hedefi ile ilgili her yönlendirme sonra gösterilen hedef.`python3 code/main.py cfg FILE.o FUNCTION`打印单个函数的分析――

## 实际使用

Yeni hedef dosyaları için, bu sırada üç yöntem kullanın:

1. Önceden çalıştırmak için referans için kullanın.`llvm-objdump`Bu hatalar var, tüm yapıları da var.
2. Her fonksiyon simgesi çalışmaya başlar, geri döner ve düşer.`unresolved`❖ Her bir şey henüz hedefinizin üzerinde bir kontrolü yok.
3. Bu kayıt, 35. dersdeki ilk bilinmeyen konudur.
4. 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字节 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字    字 字 字 字      字     字                                                                                                                                    
5. Yenilenme şefterinin geri dönüşü ve düşüşü sonucu ile CFG'yi oluşturun ve geri dönüşü görün.`while`Ya da`for`- Evet.

Referans dosyası ile hedef dosyası birlikte kalır. Yeni bir çevirmen sürümüne taşınırken, yeniden ele alınır, çünkü temiz değişim örnekler de değişir.

## 交互实验

### 实验 A:先在纸上解码,再检查

- Evet .`code`Şimdi Python'u aç:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow/code
python3 -q
```

运行:

```python
from main import *
decode(bytes.fromhex("48 8d 0d 00 00 00 00"), 0).text
decode(bytes.fromhex("8d 44 08 fa"), 0).text
decode(bytes.fromhex("66 66 66 66 66 2e 0f 1f 84 00 00 00 00 00"), 0).length
```

Her seferinde önceden yazmış, sonra da ilk bölümden kaldırmış.`48`, observe operation number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `decode(bytes.fromhex("0f 0a"), 0)`, okuyucu`DecodeError`- Evet.

### 实验 B:lea 上的重定位

```python
elf = load_fixture("ledger-x86_64-O0.o")
code = elf.section(".text").data
lea = decode(code, 0x66)
lea.displacement_offset
resolve_reference(elf, lea)
```

引用结果是 `.rodata+0x0`△将地址改成 `grade_label`Orta `0x116`, 读取指向 `.data`- Evet.`0x10e`- Ne ?`callq`Ve onu çözelim.`R_X86_64_PLT32 grade-0x4`, çözülmüş olan hedef `0x30`Yani ...`grade`- Evet.

### 实验 C:观察两种方法的分歧

```python
trap = load_fixture("sweep-trap.o")
text = trap.section(".text").data
[i.text for i in linear_sweep(text, 0, 0x20).instructions]
[i.text for i in recursive_descent(text, [0], 0x20).sorted_instructions()]
```

统计                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `0x13`開始的那条──然后将 `sweep-trap.s`Çeviri son satırından`0x48`改为 `0xe8`Bu zaman, bir daha yeniden inşa edilecek ve tekrar çalıştırılacaktır.`addl`和 `retq`吞进一条目标位于节外的 `callq`Bu işlev geri dönmedi.

### 实验 D:手算支配节点

```python
analysis = analyze_function(load_fixture("ledger-x86_64-O1.o"), "total")
analysis.cfg.edges
analysis.cfg.reverse_postorder()
analysis.cfg.dominators()
analysis.cfg.back_edges()
```

Kağıt üzerinde beş parça çiz, önce kontrol noktasını hesapla sonra sonuçları tekrar gör.`-O0`Aşağıda `grade`运行相同四行代码, neden açıklayın `idom(0xa1)`Evet .`0x30`Hayır.`0x62`- Evet.

## 实践实验

Örnek: Bir indirekte ayarlama noktası ekle,并扩展分析──

要求:

-  C  işlevi yazmak, küçük bir dizi arasından seçilen işlevi göstergesi kullanarak 调用函数──分别用 `-O0`和 `-O1`构建,将目标文件及其 `llvm-objdump`文本一起提交──
- ¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢
- 扩展 `recursive_descent()`, let the interchange will record the interchange point .`calls`, hedefleri`None`, sonra da devam etmesi
- 编写解析器,通过重定位读取函数指针数组并报告可能的调用者──
- Adliyeci topluluğu olarak`indirectCalls`Fonksiyon raporuna eklenir ve her bir hedef için bir kanıt tipi verir.
- 编写测试,解析器ı nonfunctional符号的目标时测试失败的返回使得解析器返回非函数符号的目标时测试失败──

Başarılılık standartları:`python3 code/main.py cfg`能列出每可能被调用者及证明其重定位,并所有目标文件仍通过参考对照.

## 评分实验

Bu ders düzenlemeleri hakkında beş soru. Her cevapı oluşturduğunuz kodla bulup yazın.`code/lab_answers.json`△数字写成数字,或写成 `"0x40"`Bu da bir JSON listesi olarak yazılmış bir metin.

1. `t1`-O1'ün derecesinde:递归下降在 -O1'ün derecesinde 中解码出的指示数――
2. `t2`:-O1'in toplamı Orta temel blokların sayısı。
3. `t3`:-O1'ün toplam orta döngünün adresi, yazılı olarak
4. `t4`: in sweep-trap.o, coverage 0x14 ′ın 線性掃描指示の起始地址,写成十六进制──
5. `t5`:-O0'un derecesi 中跳转表的条目数──

Cevabını kontrol et:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/lab.py
```

检查器在已提交的固定 上使用 `code/main.py`計算每期值──它为每道题输出 `PASS`- Evet.`FAIL`Ya da`TODO`Ve tüm soruların hepsi 0'dan çıkmak için geçer.`python3 code/lab.py my-answers.json`Başka bir dosya kontrol edebilirsiniz.`code/tests/test_lab.py`証明検查器正确答案を接受并拒绝誤答を。

### Görüyor mu ?

[Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler?program=trap&sweep=linear)Makine bu dersi onun çözümü olarak ve temel blok panelenin çalışması için kullanıyor.`sweep-trap.o`Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Ç Ç Ç Ç Ç Ç Ç Çözüm: Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç`0x13`- Ne ?`addq`内部、地址 `0x14`Bu verilerin üzerinden atlama görebilirsiniz.

## 本课产物

本课包含 `outputs/skill-disassembly-and-control-flow.md` Kontrol edilmiş bir liste, temel bloklar, tip tipleri, kontrol noktaları ve tüm çözülmemiş kontrol transferleri için hedef dosya ve işlev adlarını dönüştürmek için kullanılır.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/main.py
python3 code/tests/test_main.py
```

验证应证明:

- Çözücü dört örnek hedef dosyaların tüm 237 条 命令上与`llvm-objdump -d`Birliği
- REX.W 选择 64 位操作数,REX.R 和 REX.B 扩展寄存器字段
- ModRM ve SIB, kısaltma faktörleri, indeksleri ve kodlar dahil AT&T'nin içi kayda işlemleri olarak gerçekleştirilir.
- RIP karşılaştırıldığında, bu yönlendirme ile ilgili bir bölümün kaydedilmesi
- 重复 传统前和段覆盖的解码结果与参考结果一致
- 强制 `66`Ön seç SSE 操作码,并让寄存器保持 32 位
- 8 sayısal simgelik hesaplama sırasında simgelik genişleme için kullanılır, simgelik hesaplama sırasında simgeliksiz olarak kullanılır
- 15 ayetten fazla olan emirler, kesilmiş emirler ve bilinmeyen işlem kodları atılır.`DecodeError`
- `lea`Yukarı `R_X86_64_PC32`解析为表,`call`Yukarı `R_X86_64_PLT32`解析为被调用者
- 线性扫描将陷中的表解码为代码,且跳转目标处无指令
- 递归下降 从不将表或填充认定为指令,并读在目标处 `addl $0x1, %eax`
- `llvm-objdump`Tuzakta, aynı hatayı yapıyorum.
- Yönetim içi giriş toplantısı çatışma olarak kaydedildi .
- Çözülmemiş indirek atlama, geri dönüş ve düşüş, listelenmiştir.
- `-O1`Aşağıda `total`Beş blok var, beş tane tip kenar, bir tane geri kenar ve beklenen doğrudan kontrol noktası.
- Handwerk yapılandırma  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil  şekil 
- `-O2`Aşağıda `total`İki döngü var .
- `-O0`Aşağıda `grade`- Evet .`.rela.rodata`恢复出五项跳转表, hedef为 `0x91, 0x88, 0x7f, 0x76, 0x76`
- - İyileşme zamanı.`-O0`Aşağıda `grade`Üç parça ve bir çözülmemiş atlama var .
- `-O1`和 `-O2`Aşağıda `grade`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `[1, 2, 3, 4, 4]`, hiç bir şekilde atlamadı
- `-O2`Aşağıda `grade_label`通過五重定位读取 相對字符串表
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

## 生产环境失败模式

| 故障 | 较弱工具的报告 | 分析必须证明的内容 |
|---|---|---|
| `.text` 内有数据 | 每个字节都被解码、看似合理的清单 | 递归下降未认定任何数据字节为指令，且跳转目标是指令起点 |
| 最后一次返回之后的填充 | 函数末尾有一条 `nopw` | 这些字节从入口不可达 |
| 通过表的间接跳转 | “jmp rax”和四个死块 | 表地址来自 `lea` 重定位，条目数来自边界检查，目标来自 `.rela.rodata` |
| switch 变成值表 | “带重定位的跳转表” | 从 `.rodata+0x14` 进行 `movl` 加载，三个块，没有间接转移 |
| 位移为零的调用 | `callq 0x113`，即下一条指令 | `R_X86_64_PLT32 grade-0x4` 解析为 `0x30` |
| 解码器猜测未知操作码 | 看起来正确的助记符 | 带地址的 `DecodeError`，扫描记录该字节 |
| 指令超过 15 字节 | 一条很长的“指令” | 游标在读取第 16 字节之前抛出异常 |
| 分支进入指令中间 | 两份重叠的清单 | 包含两个地址的冲突记录 |
| 循环被报告为直线代码 | 伪代码中没有 `while` | 一条目标支配源节点的回边 |
| 参考输出来自不同编译器 | 测试在过时文本上通过 | 样例 README 标明精确的编译器和命令 |

## Operasyon kuralları

Bilinen girişden kontrol akışına doğru, belirlenmiş kodlara, doldurma, veri veya ulaşamayan içeriğe göre her bir karakterin hesaplanması, belirlenebilir belirlenebilir konum veya tablolardan her bir iç hedef için geri kazanılması, diğer içeriğin adresine, kayıtların bilinmemesi için kullanılır.

## 延伸阅读

- [Intel 64 and IA-32 Architectures Software Developer's Manual，第 2 卷第 2 章：指令格式](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [AMD64 Architecture Programmer's Manual 第 3 卷第 1 章：指令编码](https://docs.amd.com/v/u/en-US/24594_3.38_APM_Vol3_PUB)
- [System V Application Binary Interface，AMD64 Architecture Processor Supplement，表 4.9：重定位类型](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Schwarz、Debray、Andrews，《Disassembly of Executable Code Revisited》（WCRE 2002）](https://www2.cs.arizona.edu/~debray/Publications/disasm.pdf)
- [Andriesse 等，《An In-Depth Analysis of Disassembly on Full-Scale x86/x64 Binaries》（USENIX Security 2016）](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/andriesse)
- [Allen，《Control Flow Analysis》（1970）](https://doi.org/10.1145/800028.808479)
- [Cooper、Harvey、Kennedy，《A Simple, Fast Dominance Algorithm》（2001）](https://www.cs.tufts.edu/~nr/cs257/archive/keith-cooper/dom14.pdf)
- [Lengauer、Tarjan，《A fast algorithm for finding dominators in a flowgraph》（1979）](https://doi.org/10.1145/357062.357071)
- [Capstone 6.0.0-Alpha10 发布说明](https://github.com/capstone-engine/capstone/releases/tag/6.0.0-Alpha10)
- Bu ders açıklaması 6.5.0 源码位于标签 `3b79af2`- ...`README.md`- Evet.`docs/ghidra-provider.md`- Evet.`docs/ghidra-dos.md`- Evet.`docs/reverse-engineering-tools.md`- Evet.`bridge/ghidra/ReaGhidraBridge.java`- Evet.`src/contracts/officialToolContracts.ts`- Evet.`src/ghidra/GhidraAnalysisProfile.ts`- Evet.
