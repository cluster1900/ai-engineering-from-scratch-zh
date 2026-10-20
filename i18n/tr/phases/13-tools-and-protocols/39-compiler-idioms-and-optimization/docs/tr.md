# 编译器惯用模式:优化如何改写代码以及如何反向读懂它

> 优化编译器将使用更低成本的指令形态替代源码结构──各形有推导依据,本课构建一个反向执行推导、并对照源码验证的识别器──

**Type:** Build
**Languages:** Python, C, x86-64 assembly, AArch64 assembly
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、Phase 13 · 34（提升为伪代码）、Phase 13 · 38（调用约定）
**Time:** ~150 分钟

## Öğrenme hedefi

- Granlund-Montgomery sınırını kullanarak, herhangi bir sabit zamanın büyümesi ve hareketleri, clangın normal yaşamının geri dönüşü için bir sınır oluşturur.
- LLVM'i azaltmak`switch`Beş farklı yöntemle hedef dosyalardan, sayı, konum ve içeriği okudum.
- Vectorial döngülerin sayılarını, toplam sayılarını, her döngü elementlerini, nesillerin sayılarını, kısaltma ve eksik sayı döngüslerini açıklamak için kullanılır.
- 识别尾调用、内联的被调用函数、无分支选择,以及转化为`memset`Ya da`memcpy`Çemberin.
- X86-64 ile AArch64 için,`-O0`- Evet .`-O3`Rapor Sertifikaları ve Çözüm Çıkış Kısımları
- Sonuçları Ghidra, Angr, Radare2 、 Rizin, Lldb ile aynı bölümün çıkış oranı ile karşılaştırın.

## 问题

- Ne ?`-O2`编译了 `idioms.c`,问智能体 `div7u`Ne yapıyorum? Akıllı beden okudu.`imulq $0x24924925, %rax, %rax`, cevap verirken bu işlevi 613566757 ile çarpır, yeniden yer değiştirir, bir daha yapılır.`x / 7`- Evet.

Aynı hedef dosyasında, bir tane de var ama hiç atlamadı.`switch`, bir atlama çizgisinin beş bölümü haline geldi .`switch`, bir dönüştürülmüş .`sete`和 `cmovne`İki bölük`switch`Ve bir de bir de bir.`n`个整数的循环: her bir döngü iki döngü içinde`xmm`寄存器中処理八个整数,再利用第二循环处理余元素──在 `-O0`Aşağıda, aynı kaynak kod üretildi.`divl`、7 条目的跳转表和一个标量循环;`-O1`Aşağıda, 七分支  anahtarı değer çizelgesine dönüştürülmüştür, ve 量 döngüsü henüz ortaya çıkmamıştır.

Bu biçimler, alışkanlıklı bir biçimdir. Çıkış kodunun içindeki kontrol kurallarına göre, bir yazıcı her bir biçimi oluşturur, bunları orijinal yapılara yeniden çözülebilir.`0x66666667`Bu ders, tüm bu modellerin tanımlayıcılarını kapsayan 18 yapısal çalışmalar için kendi kodumuzu oluşturdu ve tüm 373 rapor ve C kaynak kodu testini düzenledi.

```figure
re-39-idioms-by-level
```

## 惯用模式是有推导依据的形式

Usual Mode, bir yazıcı tarafından kaynak kod yapısı oluşturulan bir talimat sırasına yöneliktir. Bu nedenle tanımlanabilir, çünkü sabit bir biçime sahiptir. Operasyon sayısı, tahmin edilen konuların düzenli miktarını taşıyor ve biçim programcıların genellikle el yazılı kodlarından farklıdır.

`code/main.py`Çözümleme cihazı`llvm-objdump -d -r`Bu nedenle, bu işlemin bir sonraki aşamasında, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğer işlevin, bir diğerinin, bir diğerinin, bir diğerinin, bir diğerinin, bir diğerinin, bir diğerinin, bir diğerinin, bir diğerinin, bir diğerinin, bir diğerinin, bir diğerinin, bir diğerinin, bir diğerinin, bir diğerinin, bir diğerinin, bir diğerinin, bir diğerinin, bir diğerinin, bir diğerinin, diğerinin, diğerinin, diğerinin, diğerinin, diğerinin, diğerinin, diğerinin, diğerinin, diğerinin, diğerinin, diğerinin de de de de de de diğerinin, diğerinin, diğerinin, diğerinin de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de`.rodata`Bu yüzden, bu konuda çok fazla bilgi edinelim.`.rela.rodata`条目。

Her bir sınav bir yazı.`Idiom`Kayıt, içerir.`kind`Çıkarım.`source`Şekil`evidence`Adres listesi`detail`字典和 `verified`标志──标志来自C 源码──`parse_source()`读取 `idioms.c`, find her işlevi,提取 `/`ile`%`后除数,`*`Son sayıları`switch`分支 ve değerleri`? :`运算符,`for`Çevre ve çağrılanlar. Çevre ve çağrılanlar. Çevre ve çağrılanlar. Çevre ve çağrılanlar.`unverified`Liste sona erdi, test suetleri tüm 18 yapı bu liste boştu.

解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要名称──识别器 解码需要数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数数`-O0`代码的溢出保存操作──在每个块入口合并前驱状态;若状态不同,先前模式分配的名称优先于常量──正如因此,`digest`Orta `cmovll %edx, %eax`Okuyabilir`sum % 10 < 5 ? sum % 10 : 5`: döngü modeli                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `sum`,除法模式将商命名为`sum / 10`,取模模式将结果命名为 `sum % 10`❖ Çıkışlı yazı`rem > 5 ? 5 : rem`, iki tür ifade alındı .`rem`ve 5'in daha küçük değerini ve`rem == 5`Zamanla uyumlu.

## Normalden başka

Granlund 和 Montgomery 的Kısımlama çarpma kullanarak değişmez tam sayılar ile (PLDI 1994)`n / d`△ △ △ △ △ △ △ △`s`Ünlü sayı`m = ceil(2^s / d)`Sadece bir hata yap.`e = m * d - 2^s`足足小,范围内所有 `n``floor(n * m / 2^s)`- Benzer.`floor(n / d)`△对无符号 32 位 `n`Sınırımız...`e <= 2^(s - 32)`Ve karşılayacağım .`|n| < 2^31`- Evet.`n`, sınırlı `e <= 2^(s - 31)`ve `n`Negatif zaman geçiş simgesi 1'ye eklenir, çünkü aşağıya doğru tüm negatif işlerin yönü değişir.

`main.py`Orta `magic_numbers(d, bits, signed)`32'den başla arama yap`s`, ilk grup sınırları karşılamak için parametre geri dönmek.

### 10'dan fazla sayı

`2^35 / 10 = 3435973836.8`Yukarı çıkıp dur.`3435973837 = 0xCCCCCCCD`△ yanlış △`0xCCCCCCCD * 10 - 2^35 = 2`... ve ...`s = 35`Çeviri:`2^3 = 8`若 `s = 34`, hata 6 , sınır 4 'ü aşar, bu nedenle 35 en az hareket miktarıdır.`n = 123`检查:`123 * 3435973837 = 422624781951`- Evet .`422624781951 >> 35 = 12`- Evet.

Klang x86-64'in içinde `-O2`Aşağıda`div10u`Doğuşun bu şekli:

```text
       0: 89 f9                        	movl	%edi, %ecx
       2: b8 cd cc cc cc               	movl	$0xcccccccd, %eax
       7: 48 0f af c1                  	imulq	%rcx, %rax
       b: 48 c1 e8 23                  	shrq	$0x23, %rax
```

`0x23`35'i.`movl %edi, %ecx`32 bit parameterini 0'ye 64 bit kaydeticine genişletmek, bu simgesiz biçimdir.`imulq`提供输入的 `movl $imm`读取乘数,读取移位量,然后调用 `divisor_from_magic(0xCCCCCCCD, 35)`△该函数尝试 `2^35 // m = 10`Hediye 11'i kabul etmiyor.`magic_numbers(10)`返回相同乘数和移位量──

Arş64'te aynı fonksiyon var.`mov w8, #0xcccd; movk w8, #0xcccc, lsl #16; umull x8, w0, w8; lsr x0, x8, #35`                                                                                                                                                                                                                                                              `umull`,移位量以十进制书写──识别器拼接半部后,报告同一个除数──

### Hands Countless (Bölümsüz)

`2^35 / 7 = 4908534052.57`Yukarı çıkıp dur.`4908534053 = 0x124924925`, 33 bit gerektiriyor. Hata 3 sınır 8'i aşmaz, bu nedenle, hareket hacmi 35'dir, daha küçük hareket hacmi de geçerli değildir.`0x24924925`, tekrar sabit bir diziye göre,

```text
      32: 48 69 c0 25 49 92 24         	imulq	$0x24924925, %rax, %rax
      39: 48 c1 e8 20                  	shrq	$0x20, %rax
      3d: 29 c7                        	subl	%eax, %edi
      3f: d1 ef                        	shrl	%edi
      41: 01 f8                        	addl	%edi, %eax
      43: c1 e8 02                     	shrl	$0x2, %eax
```

Onu okuyacağım.`t = (n * 0x24924925) >> 32`Sonra ...`q = (((n - t) >> 1) + t) >> 2`总移位量为 `32 + 1 + 2 = 35`- Evet.`n = 100`时:`t = 14`- Evet .`(100 - 14) >> 1 = 43`- Evet .`43 + 14 = 57`- Evet .`57 >> 2 = 14`❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖    ❖`sub`- Evet.`shr`- Evet.`add`- Evet.`shr`Son bölüm, sayıyı artır.`2^32`, geri dönmek için 7..`evaluate_division()`精确执行 this set sequence, test on 32 bit cephede değerleri üzerinde `n // 7`Bıqqı¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬`sub w9, w0, w8; add w8, w8, w9, lsr #1; lsr w0, w8, #2`Çünkü hareket etmek bir emir, bu yüzden küçük bir emir.

### 3'den fazla bir simge var.

`2^32 / 3 = 1431655765.33`Yukarı çıkıp dur.`1431655766 = 0x55555556`,误差 2,`s = 32`Zamanın bir sınırı var.`2^1 = 2`恰好满足界限, therefore移位量 is 32, clang 使用 `shrq $0x20`- Evet.`n = -7`时,乘积为 `-10021590362`,算术右移 32 位 `-3`;符号位已置位,修正加 1,结果为 `-2`Tam olarak C'nin ortalarında.`-7 / 3`有符号具 `div10s`和 `div3s`Şehir için bir uçuşu gerçekleştirmek`shrq $0x3f`, tekrar `addl`实现修正──

### 常量 kendisi ne olduğunu açıklayamaz.

Sadece çarpı sayı belirlenemez.`0x66666667`配合移位 34 表示 10; 相同乘数配合移位 33 则表示 5,第 34 课已示过.`clangMatchesAlgorithm`字段记录 字段记录 字段记录 字段记录 字段记录 字段记录 字段记录 字段记录 字段记录 字段记录 字段记录 字段记录 字段记录 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字     字 字    `magic_numbers()`Bu yüzden onları reddedeceğim. Çünkü bir yazıcı, bir kodla değiştirilmiş bir yer değiştirmiş.`mod8s`Bu biçimi göstermek için.

### 惯用模式属于指令选择阶段

- Evet .`-O0`Aşağı,`div10u`Evet .`movl $0xa, %ecx; xorl %edx, %edx; divl %ecx`- Evet .`div10s`Evet .`cltd; idivl %ecx`Ama aynı hedef dosyasında.`digest`Kullan .`imulq $0x66666667`Bu daireyi 10 ile ayırmak için bir parametre var.`idioms-x86_64-nofastisel-O0.o`Kullanım`-O0 -mllvm -fast-isel=false`构建,其中每次除法都变成乘法,包括使用 `movl $0xcccccccd, %ecx; imulq %rcx, %rax; shrq $0x23``div10u`❖ Hardware Debatı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `-O0`下的选择;乘法是 SelectionDAG'ın düşüş sonucu, LLVM'den `UnsignedDivisionByConstantInfo`和 `SignedDivisionByConstantInfo`- Evet.`digest`İçeride ayrıştırılmış parçalar da bulunmaktadır.`switch`Bu yüzden bu bloklar SelectionDAG'a verilir.`hardware idivl`ile`magic multiply`两种形式,图中显示混合形式 `-O0`函数。

## 取模跟随商

`x % d`Ben de öyleyim .`x - (x / d) * d`△编译器先用上述模式计算商,再乘回除数并相减──x86-64 上乘回 10 是 △`addl %ecx, %ecx; leal (%rcx,%rcx,4), %ecx`,即 `2 * q * 5`✿AArch64 上只需一条 ✿`msub w0, w8, w9, w0`- Evet .`w9 = 10`时计算 `w0 - w8 * w9`❖ Identification apparate, kopyalama işlemleri takip eden, kaydeten, geçiyor`add`- Evet.`lea`- Evet.`shl`- Evet.`imul`Bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de`sub`- Evet.

Aynı zamanda diğer ifadeler için de kullanıldığında, rapor iki biçimi korur.`-O1`Aşağıda, bir yazıcı var.`digest`Ortalama bir kere hesaplanır.`sum / 10`, aynı zamanda kullanılır `switch`索引和取模──在 x86-64 上, it even twice 合并该商:取模用 `leal (%rax,%rsi), %edi`- Çıkart.`addl %esi, %eax`❖ Tanımlayıcı rapor bir kez çıkarıp bir kez çıkarır, ve ortaklık için işaretlenir.`switch`İndirimler çok zor.

2'nin                                                                                                                                                                                                                                                              

```text
      92: 8d 48 07                     	leal	0x7(%rax), %ecx
      95: 85 ff                        	testl	%edi, %edi
      97: 0f 49 cf                     	cmovnsl	%edi, %ecx
      9a: 83 e1 f8                     	andl	$-0x8, %ecx
      9d: 29 c8                        	subl	%ecx, %eax
```

Negatif sayı`x`, kodun gizlenmeden önce 7'e eklenmesi , kesimlerin C                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `x`,相减后留下 `x % 8`✿AArch64 使用 `negs w8, w0; and w9, w0, #0x7; and w8, w8, #0x7; csneg w0, w9, w8, mi`Aynı zamanda gizlenir.`x`和 `-x`,再按符号选择并取负──Ghidra 将此规则命名为`RuleSignMod2nOpt`,简介为转换 INT_SREM 形式:`(V + (sign >> (64-n)) & (2^n-1)) - (sign >> (64-n)) => V s% 2^n`- Evet.

- Evet .`-O0`Arç 64 kullanıyor.`sdiv w9, w8, w10; mul w9, w9, w10; subs w0, w8, w9`İfade: ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽`hardware sdiv + mul + subs`- Evet.

## Çıkışın beş çeşit indirimi

LLVM iki pozisyonda karar verdi .`switch`形态──`SimplifyCFG::simplifySwitchLookup`- Evet .`-O1`及以上运行: Her bir bölümde en az üç bölüm varsa, her bölümde sürekli miktar oluşur ve hedef olarak gösterge aramakta destek bulunur.`SingleValueKind`- Evet.`LinearMapKind`- Evet.`BitMapKind`和 `ArrayKind`- Evet.`-O0`流水线不运行该过程──残留开关 进入命令选择阶段的 `SwitchLowering::findJumpTables`En azından var.`min-jump-table-entries`个条目(默认 4) ve yeterince yoğun zaman yapı 跳转表──密度条件为 `NumCases * 100 >= Range * MinDensity`, ordinal function of `jump-table-density`10'u.`-Os`Ülkeler, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalıntılar, kalım.`splitWorkItem`选择枢轴──具为每种结果提供一个函数──

| 函数 | 源码 | `-O0` x86-64 | `-O2` x86-64 | `-O2` AArch64 |
|---|---|---|---|---|
| `linear_switch` | 分支 0 至 6 返回 10 至 70 | 7 条目跳转表 | 线性映射 `10*k + 10`，默认 -1 | `madd` 和 `csinv` |
| `table_switch` | 分支 0 至 6 返回 10 至 60，再返回 71 | 7 条目跳转表 | `.rodata+0x28` 处的查找表 | `.rodata+0x0` 处的查找表 |
| `call_switch` | 分支 0 至 4 调用五个指针中的一个 | 5 条目跳转表 | 5 条目跳转表 | 比较树，枢轴 1 |
| `sparse_switch` | 分支 1、100、10000、1000000、100000000 | 比较链 | 比较树，枢轴 9999 | 比较树，枢轴 9999 |
| `two_cases` | 分支 3、4 返回 7、9 | 比较链 | 选择链 `k != 3 ? (k == 4)*9 : 7` | 两条 `csel` |

### Görevi dosyalardan

`-O2`Aşağıda `table_switch`- ...

```text
      d0: b8 ff ff ff ff               	movl	$0xffffffff, %eax
      d5: 83 ff 06                     	cmpl	$0x6, %edi
      d8: 77 0c                        	ja	0xe6 <table_switch+0x16>
      da: 89 f8                        	movl	%edi, %eax
      dc: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		00000000000000df:  R_X86_64_PC32	.rodata+0x24
      e3: 8b 04 81                     	movl	(%rcx,%rax,4), %eax
      e6: c3                           	retq
```

边界检查 `cmpl $6; ja`7 geçerli madde göstermek için.`0x24`RIP'e ek olarak,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `.rodata+0x28`Bu da 33 . ders kuralı.`0a 00 00 00 14 00 00 00 ...`, 条目为`[10, 20, 30, 40, 50, 60, 71]`,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `.s`文件中将表命名为 `.Lswitch.table.table_switch`,并附注释 `@switch.table.table_switch` hedef dosya içinde sadece yeniden konumlandırma ve yazı var.

AArch64 形式通过 `adrp x8`和 `add x8, x8, #0x0`İçe çıkış adresleri, iki tarafı bir yönü ile.`.rodata`Yeniden kullanın.`ldr w0, [x8, w0, uxtw #2]`Üstüne bir tanıklık cihazı.`add`Yeniden konumlandırma sayısı:

### 完全没有表的线性映射

`linear_switch`0'dan 6'a kadar.`k`Geri dön .`10 * (k + 1)`- Evet.`simplifySwitchLookup`检测到仿射关系,改为生成算术操作:

```text
      b0: 83 ff 07                     	cmpl	$0x7, %edi
      b3: 8d 04 bf                     	leal	(%rdi,%rdi,4), %eax
      b6: 8d 4c 00 0a                  	leal	0xa(%rax,%rax), %ecx
      ba: b8 ff ff ff ff               	movl	$0xffffffff, %eax
      bf: 0f 42 c1                     	cmovbl	%ecx, %eax
```

求值器将 `leal (%rdi,%rdi,4)`读为 `5*k`,将 `leal 0xa(%rax,%rax)`读为 `10*k + 10`,将 `cmpl $7`Sonraki`cmovb`读为 `k < 7 ? 10*k + 10 : -1`△ sonra herkese bir bilgi kaynağı verilir.`madd w8, w0, w8, w9`和 `csinv w0, w8, wzr, lo`Aynı ifadeyi elde et, içinden bir tane.`wzr``csinv`Önemli yollar açısından oluşuyor.`-1`- Evet.

### Çıkış çizelgesinden

`-O2`Aşağıda `call_switch`33 . Sınıf`-O0``grade`Yenilenme biçimi aynı:`cmpl $4; ja`Yönlendirme`.rodata-0x4``leaq`、读取 4 字节条目的 `movslq`- Evet.`addq`, tekrar `jmpq *%rax`❖ 5条条目 ❖`.rela.rodata`Orta ağırlık,`target = addend - 4k`- Al .`0x10c, 0x107, 0x10e, 0x110, 0x109`,分別指向五个不同的块,每个块通过函数指针尾跳转──`dispatch`具将其扩展为16 个分支:x86-64 上有16 条重定位;AArch64 上则是16 个单字节组成的压缩表,用 `ldrb w11, [x9, x8]`读取,以 `add x10, x10, x11, lsl #2`4'e çarpıp, ilk bölümü yönlendir.`adr`Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri`[0x24, 0x74, 0x54, ...]`,并报告 `compressed: true`- Evet.

### Aynı anahtarın dört optimizasyon sınıfı

`digest`包含对 `sum / 10`Bu değişkenin 6 ila 10 arası var. 1 ̊2 ̊4 ̊8 ̊8 değerinde.`-O0`Aşağıya atlamak için,`-O1`Aşağıdaki kısım`[16, 32, 64, 128, 128]`Çekim yapma, yapma.`-O2`和 `-O3`Yine dönüşüm çizelgesi, dört parça ayırarak kaydedildi.`0x10`- Evet.`0x20`- Evet.`0x40`- Evet.`0x80`❖ ından `-O1`16'da bir bölgeye girmek.`-O0`Aşağıda, bölge kaydediliyor 1、2、4、8,乘法 hâlâ değişmekte 后──对 `-O1`查找表,识别器将条目与源码值比较,找到固定比率,并报告 `foldedFactor: 16`✿AArch64'in ✿`-O2`形式是枢轴为 8 的比较树,含对 6、7、8 的相等测试,以及范围测试 `sub w9, w9, #9; cmp w9, #2; b.hs`, iki test operasyonu ile kapsamlı 分支 9 和 10 识别器报告`rangeTests: [[9, 10]]`- Evet.

İki parametre bu sınırları hareket ettiriyor.`-fno-jump-tables`X86-64'te Ünlü`table_switch`- Evet.`call_switch`和 `digest`转为比较树,七分支函数的枢轴为 2 和 4──AArch64 上,`-mllvm -min-jump-table-entries=4`仍让 `call_switch`保持比较树, bu nedenle bu hedefe göre 条目数量不是决定因素──具`idioms-arm64-jt4-O2.o`Bu seferki olayı kaydettim.

GCC iki karar verecek .`tree-switch-conversion.cc`中,使用 `jump_table_cluster`- Evet.`bit_test_cluster`- Evet.`switch_decision_tree`和 `switch_conversion`类──`-ftree-switch-conversion`- Evet .`-O2`Açın.`-fjump-tables`和 `-fbit-tests`- Evet .`-O1`开启,跳转表 价值来自 `case-values-threshold`Bu cihaz GCC'de yüklenmedi, bu nedenle bu isimler GCC'den kaynaklanmıştır.

## Çeviri: 向量化、展开或替换

LLVM'in döngü ölçüm cihazı`-O2`- Evet.`-O3`- Evet.`-Os`Aç, aç.`-O0`- Evet.`-O1`关闭,这条规则可追溯到2014 yılının 1 月的LLVM 3.4──`-O2`Aşağıda `sum_n`Bu biçimin her bir bölümünü gösterdi:

```text
     1f6: 83 fe 07                     	cmpl	$0x7, %esi
     1f9: 77 09                        	ja	0x204 <sum_n+0x14>
     206: 81 e2 f8 ff ff 7f            	andl	$0x7ffffff8, %edx
     230: f3 0f 6f 14 37               	movdqu	(%rdi,%rsi), %xmm2
     235: 66 0f fe c2                  	paddd	%xmm2, %xmm0
     239: f3 0f 6f 54 37 10            	movdqu	0x10(%rdi,%rsi), %xmm2
     23f: 66 0f fe ca                  	paddd	%xmm2, %xmm1
     243: 48 83 c6 20                  	addq	$0x20, %rsi
     24a: 75 e4                        	jne	0x230 <sum_n+0x40>
     24c: 66 0f fe c8                  	paddd	%xmm0, %xmm1
     250: 66 0f 70 c1 ee               	pshufd	$0xee, %xmm1, %xmm0
     262: 66 0f 7e c8                  	movd	%xmm1, %eax
     270: 03 04 97                     	addl	(%rdi,%rdx,4), %eax
     279: 75 f5                        	jne	0x270 <sum_n+0x80>
```

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `cmpl $7; ja`8'den az bir 代送入标量循环.`andl $0x7ffffff8`Bu, bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir sürece bir sürece bir sürece bir sürece bir sürece bir sürece bir sürece bir sürece bir sürece bir sürece bir sürece bir sürecece bir sürececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececece`xmm`累加器, her birinde dört 32 bit geçid vardır, bu nedenle 量化因子为 4交错因子为 2 循环后,`paddd`İki tane.`pshufd`、另外两条 `paddd`和 `movd`8 yolu bir bütün sayısına dönüştürmek.`0x270`处的循环是处理最后的0至7元素的标量余数循环──识别器通过回边找到循环,识别SIMD 寄存器,从 识别器通过回边找到循环,识别SIMD 寄存器,从 识别器通过回边找到循环,识别SIMD 寄存器,从 识别器通过回边找到循环,从 识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过识别器通过`paddd`读取通道数,统计不同累加器,将步长 `0x20`4'ten sonra rapor`4 lanes x 2 accumulators = 8 elements per iteration`,并以字段形式记录掩码、保护条件、归约和余数循环──AArch64 用`ldp q2, q3`İki tane.`add v.4s`- Evet.`addv s0, v0.4s`和 `fmov w8, s0`Aynı işi tamamlayın.

Sıkı zamanlı bir döngü ortadan kaldırmak için.`sum4`Bir Aralık`movdqu`、                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `movd`Yapım, dönme yok.`poly8`⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒  ⇒    ⇒  ⇒     ⇒                                                                                                                                                                                                                                                                                                           `%rdi`∆ ∆ ∆ ∆ ∆`0x1c`Çekilmek için 8 kez, her seferinde 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, 5 kez, veya 5 kez, veya 5 kez, veya 5 kez, veya 5 kez, veya 5 kez, veya 5 kez, veya 5 kez, veya 5 kez, veya 5 kez, veya 5 kez, veya 5 kez, veya 5 kez, veya 5 kez, veya 7 kez, veya 7 kez, veya 7 kez, veya 7 kez, veya 7 kez, veya 7 kez, veya 7 kez, veya 7 kez, veya 7 kez, veya veya veya veya veya 7 kez, veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya veya`acc * 31` İtirafcıların istatistikleri ve aynı konumu taşımacılık yükleme, rapor`loop unrolled by 8, no back edge`◊AArch64'in aynı yükü ∼4 `ldp`Çıkış.

Kullan .`-fno-vectorize -fno-slp-vectorize`关闭向量化器后,`sum_n`变为展开八次的标量循环,包含八条 `addl k(%rdi,%rdx,4), %eax`和 `addq $8`, tekrar ekli sayı döngüsü`sum4`则变成四次加法──识别器对前者报告 `unrolled loop`- Evet.`copies: 8`和 `indexStep: 8`, sonrakilere rapor`copies: 4`- Evet.

Bölüm 33`-O2``total`Bu ders, iki döngü olarak adlandırılan iki döngü bulur; daha da belirtir ki, aynı kaynak kod döngüsünün vektör konusu ve ölçümsal üye sayısı bölümdür.`is_loop()`Bu şartı kontrol et, çünkü AArch64'in `digest`包含向后跳到共享默认块的分支,它们不是循环,而识别器第一版误认为其为向量循环.

### 变成库调用循环

- Evet .`-O1`起,`LoopIdiomRecognize`Birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden birden`memset`- Evet.`-O2`Aşağıda `fill`Evet .`testl %esi, %esi; jle; movl %esi, %edx; xorl %esi, %esi; jmp memset@PLT`                                                                                                                                                                                                                                                              `R_X86_64_PLT32 memset-0x4`重定位的尾跳转, işlevi `retq`Sadece şimdi boş yollarda göründüğünü görüyorum.`store loop recognized as memset(...)`,并对照源码循环验证, çünkü源码 hiç doğrudan kullanılmamıştır `memset`- Evet.

`copy16`UZ常量 16 调用 `memcpy`,x86 后端将其内联为 `movups (%rsi), %xmm0; movups %xmm0, (%rdi)`, her seferinden fazla değil .`memcpy`En fazla 8 kez depolama sınırlaması.`-O0`Aşağıda aynı düzenle 2'e 8'e`movq`。 kullan `-fno-builtin`时,调用保留为带 `movl $0x10, %edx``jmp memcpy@PLT`- ...`fill`Saklama döngüsü, ölçer, sonra her döngüde iki kez 16 字节 `movups`存储──识别器 `vectorized store loop: 2 x 16-byte stores = 32 bytes per iteration`- Evet.

## 消失或变成跳转调用

`tail_caller`Geri dön .`tail_target(x + 1)`- Evet.`-O0`Aşağıda, bu `addl $0x1, %edi; callq tail_target@PLT; addq $0x10, %rsp; popq %rbp; retq`Bu da ...`-O2`Aşağı, sadece `incl %edi; jmp tail_target@PLT`△调用者消失,被调用者直接返回调用者的调用者──AArch64 上是带 `R_AARCH64_JUMP26``b tail_target`❖ Tanım cihazı yeniden konumlandırma ile birlikte kullanılacak.`jmp`Ya da`b`视为尾调用──第 33 课的递归下降必须将它视为函数出口,因为目标位于函数之外──

`twice_sum`调用 `leaf_add`- Evet.`-O0`Aşağıda var `callq leaf_add@PLT`; `-O1`起,`leaf_add`              `leal (%rdi,%rsi), %eax`- Şimdi çık .`twice_sum`İç, artık tutunma.`-O0`Aşağıda, her fonksiyon için bir işaretleme yap.`optnone`和 `noinline`, sadece zorla iç bağlantı makinesi kullanıyor.`twice_sum`- Evet .`leaf_add`, Eğer bir调用 ya da尾跳转 bulunmazsa,调用cu arasında调用cu tarafından kullanılan işletim biçimi aramakta bulun:`add w8, w1, w0`能匹配被调用者中                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `add w0, w1, w0`                                                                                                                                                                                                                                                              

`dispatch`Aynı zamanda iki modü birleştirir.`movl %esi, %edi; jmp fN@PLT`❖ Identifier report a switch 和 16 个尾调用,并全部与源码中的 16 个调用验证──

## 变得数据移动的分支

`clamp_max`Evet .`movl %esi, %eax; cmpl %esi, %edi; cmovgl %edi, %eax`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △`%edi`命名为`a`- Evet.`%esi`命名为`b`, kayıt karşılaştırma, tekrar `cmovg`解读为`a > b ? a : b`, kaynağı ile uyumlu olarak`abs_int`Evet .`movl %edi, %eax; negl %eax; cmovsl %edi, %eax`,读作 `-x < 0 ? x : -x`Arş64 则写作`cmp w0, #0; cneg w0, w0, mi`,读作 `x < 0 ? -x : x`- Evet.`is_pos`Evet .`xorl %eax, %eax; testl %edi, %edi; setg %al`,即 `(x > 0)`◊GCC bu tür dönüşümlere `-fif-conversion`,LLVM 则称为`cmov`选择──LLVM 的 `X86CmovConversion`                                                                                                                                                                                                                                                              `cmov`Yeniden dönüşüm bölümü, aynı kaynak kodunun döngü içinde ortaya çıkabileceği bir biçimi de açıklıyor.

- Evet .`-O0`Bu modeller yok.`clamp_max`- Ben de...`jle`、 aynı boşlukta iki depolama ve bir yükleme.`-O0`Aşağı raporlama modüsü,`-O1`Rapor`branchless select`, çizgi doğrudan bunu gösterir.

`mul9`Sadece bir makale var.`leal (%rdi,%rdi,8), %eax`, Identifier rapor`strength reduction`和 `x * 9`, çünkü kaynak kodu gerçekten 9 katıdır. Sadece kaynak kodu bu faktörü içerir.`lea`Çıkışın kaynağı olarak kabul edilmemelidir.

##  2 adet model gibi görünür

 protector is a compiler characteristic, will be left down easily by intelligent bodies misread for the form of program logic.`canary.c`X86-64 Linux üzerinde kullanın `-fstack-protector-strong`编译, get:

```text
       7: 64 48 8b 04 25 28 00 00 00   	movq	%fs:0x28, %rax
      10: 48 89 44 24 40               	movq	%rax, 0x40(%rsp)
      26: 64 48 8b 0c 25 28 00 00 00   	movq	%fs:0x28, %rcx
      2f: 48 3b 4c 24 40               	cmpq	0x40(%rsp), %rcx
      34: 75 05                        	jne	0x3b <with_canary+0x3b>
      3b: e8 00 00 00 00               	callq	0x40 <plain_leaf>
		000000000000003c:  R_X86_64_PLT32	__stack_chk_fail-0x4
```

`%fs:0x28`Evet , çok güzel .`tcbhead_t`Orta `stack_guard`,字节偏移为 40;LLVM 的 `getIRStackGuard`Bu boşluğu belirlemek için, bir fonksiyon başlangıcı, bu boşluğu oluşturmak için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boşluğu belirlemek için, bu boş boşluğu kullanmak için, bu boşluğu kullanmak için, bu boşluklar için, bu boşluklar için, bu boşluklar için, bu boşluklar için, bu boşluklar için, boşluklar için, boşluk için, boşluk için, boşluk için, boşluk için, boşluk için, boşluk için, boşluk için, boşluk için, boşluk için, boşluk için, boşluk için, boşluk için, boşluk için, boşluk için, boşluk için, boşluk için, boşluk için, boşluk için, boşluk için, gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek`__stack_chk_fail`◊AArch64 Linux 上, protection value from the whole局 `__stack_chk_guard`- Götür.`adrp`和 `ldr`Başarmak, başarmak`bl __stack_chk_fail` Tanımlayıcı raporları koruma değerleri kaynak √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √`plain_leaf`- Evet .`strong`Aşağıda kanarya yok; bu modda koruma var.`alloca`veya lokal değişim adresinin elde edilmesi için kullanılan fonksiyonlar.`/GS`形式:cookie  `%rsp`混合, geç `__security_check_cookie`检查──机器上没有MSVC 链接器,因此这种形态只根据编译器汇编输出描述──

`-fcf-protection=full`- Ben de .`endbr64`(字节 `f3 0f 1e fa`) her fonksiyonun ilk yönlendirme bölümüne yerleştirilmiştir.`nop`执行──Ghidra'nın x86-64 函数起始模式因此包含带 `endbr64`Önceki `push rbp; mov rbp, rsp`变体──识别器将其报告为 `cet landing pad`, dört alışılmadık karakter ile başlayan işlevi bir veri olarak yanlış tanımlamayı önlemek için.

## Anti编译器会折叠哪些模式

37. Sınıfdaki her bir tercümeci yeniden yazma kurallarını yerine getirir.`ruleaction.cc`Çeviri:`RuleDivOpt`将 INT_MULT 与移位形式转为 INT_DIV 或 INT_SDIV,包含形式 `sub( (zext(V)*c), d) >> e => V / (2^n/(c-1)) where n = d*8 + e`, ve kullanımı`sext`和 `s>>`Bu bir değişim.`RuleModOpt`                                                                                                                                                                                                                                                              `RuleDivTermAdd`处理加法修正,`RuleSignDiv2`- Ben de .`(V + -1*(V s>> 31)) s>> 1`转成 `V s/ 2`- Evet .`RulePositiveDiv`则将符号位为零的值的有符号除法转变为无符号除法.`-O1`Aşağı`grade`İçinde yazıyor.`uVar2 = param_1 / 10 - 6;`, açıklama ayrıntıları çarpıştırıldı

Java kullanmadan da bu kuralların girişlerini görebilirsiniz.`code/fixtures/idioms-x86_64-O2.lifts.json`- Kaydetmiş .`div10s`Yazı: 7 emirler 112 maddeye uygulanır.`IMARK` İçinde bir tane var.`unique[95a00:8] = sext(0x66666667)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `RAX = RAX * unique[95a00:8]`, ve `RCX = RCX >> unique[d1a00:4]`- Evet.`RAX = RAX s>> unique[c5c00:4]`- Evet.`shrq`41 tane iş.`sarq`40 tane, büyük ölçüde hesaplama işaretleri için kullanılır.`RuleDivOpt`Bu akışta eşleşen iki kez hareket, ölme kodunu ortadan kaldırmak, hiç kimse tarafından okunmayan işaretleri ortadan kaldırmak.

10.0.3 için`-O2`目標文件运行,`idioms-x86_64-O2.angr.json`20 işlevinin özenli olarak kaydedildiği için,`div10u`Çı`return a0 / 10;`Ama çarpışmaz bir simbol biçimi vardır:`div10s`Çı`v1 = a0 * 1717986919; return ((long long)(v1) >> 0x22) + (v1 >> 63);`- Evet .`mod10s`Çı`a0 - (...) * 2 * 5`- Evet.`div7u`, dışarı çıkar .`(a0 / 7 + ((a0 * 6 / 7 & 0xffffffff) >> 1 & 0xffffffff) & 0xffffffff) >> 2`, düzeltmeler hâlâ bir matematik biçiminde var.`mul9`折叠为 `a0 * 9`- Evet.`linear_switch`Çı`(a0 < 7 ? a0 * 10 + 10 : 0xffffffff)`- Evet.`clamp_max`Çı`((int)a1 < (int)a0 ? a0 : a1)`- Evet.`is_pos`Çı`a0 > 0`- Evet.`fill`Çı`return memset(a0, 0, a1);`- Olacak.`table_switch`输出为不含表值的加载 `*(int *)(4 * a0 + 4195400)`- ...`sum_n`Kullanım`_mm_add_epi32`和 `_mm_shuffle_epi32`内建函数;`tail_caller`Çı`tail_target(); return;`, kaybeden parametre.`digest`Çeviri:                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `goto *((void *)(...))`,并展开表地址算术──

Kaynak kodundan yapılandırma çalışmalarına kadar radar2.6.2.4 ve rizin 0.9.1 aynı amaçlı dosyaların çalışmasına da yöneliktir.`pdc`- Ben de .`div10s`输出为 `rax = rax * 0x66666667; rcx >>>= 0x3f; rax >>= 0x22; eax += ecx`Bu , katlanmamış bir kayıt makinesi sınıfı sahte C;`table_switch`Çı`eax = dword [rcx + rax*4]`, `lea`Üncel`RELOC 32 .rodata`Not: 没有内建反编译器;其 `aoi`- Ben de .`imul`RzIL 打印为 128位乘积──lldb-1703.0.236.21 加载 ELF 目标文件后,`disassemble -n div10s`输出与 `llvm-objdump`Aynı yedi kural, çünkü ikisi de LLVM'yi kullanıyor.`ret`- Evet.`mode64`等分组; sadece çözücü, çözücü çıkışı geleneksel bir modü içermez. Burada IDA Pro ve Binary Ninja kullanılmaz. Dosyaları bu tür yeniden yazma aşamasını, yani mikrokod 优化 ve MLIL ile HLIL sürecini anlatır.

Yükleyici Explorer doğru doğrulama için kullanılır.`idioms.c`, x86-64 clang 18.1.0 veya ARM64 GCC 14.2.0'un bir araya getiren bir yapılandırma için bir yapılandırma seçeneği oluşturur.`GET /api/compilers/c`返回标识符,`POST /api/compiler/<id>/compile`JSON'a geri dönüp gönderdi. Matt Godbolt, 2019 ACM Sırası'nda bir makalede, çözümü, konum sayısını, şebekeler koşullarını ve talep ve modelini gösterdi. Bu makineyi kullanmakla GCC'nin üretilebilecek dışı çıkışlarını elde edebilecek, GCC'nin  değer ve GCC 12'nin  değerlerini sıçratabilecek.`-O2`                                                                                                                                                                                                                                                              

## Kendini oluştur

运行演示:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization
python3 code/main.py
```

输出 bir JSON raporu. 18 yapıtaştan her birine, her işlevi ve kullanımı biçimini listeler.`-O2`ile`-O3`Bireyin, ve `unverified`Listesi:

预期结构如下:

```json
{
  "builds": {
    "idioms-x86_64-O2": {
      "arch": "x86_64", "level": "O2", "flags": "x86_64",
      "functions": {
        "div7u": [{"kind": "division", "source": "x / 7", "evidence": ["0x30", "0x32", "0x39", "0x3d", "0x3f", "0x41", "0x43"], "verified": true, "form": "magic multiply with add fix-up", "magic": "0x24924925", "effectiveMagic": "0x124924925", "shift": 35, "...": "..."}],
        "table_switch": [{"kind": "switch", "source": "switch (k) as lookup table", "table": ".rodata+0x28", "entries": 7, "values": [10, 20, 30, 40, 50, 60, 71], "...": "..."}],
        "sum_n": [{"kind": "vector loop", "lanes": 4, "accumulators": 2, "elementsPerIteration": 8, "...": "..."}]
      }
    }
  },
  "kindMatrix": {"idioms-x86_64-O2": {"division": 5, "modulo": 3, "switch": 6, "vector loop": 3, "...": "..."}},
  "sameCodeAtO2AndO3": {"x86_64": {"identical": true}, "arm64": {"identical": false, "differences": ["..."]}},
  "unverified": []
}
```

按以下顺序阅读 `code/main.py`- ...

1. `parse_listing()`İki tür yapı oluşturur.`llvm-objdump -d -r`文文转成函数、命令和附带重定位──
2. `ElfFile`读取节、符号和 `.rela.*`条目,`words()`读取表条目──
3. `magic_numbers()`- Evet.`divisor_from_magic()`和 `evaluate_division()`Bölüm: Granlund-Montgomery'nin doğru yönlü yönlendirmelerini gerçekleştirmek, yönlendirmeler sırasını değerlendirmek ve yönlendirmeler sırasını gerçekleştirmek
4. `parse_source()`C 文件提取验证 ihtiyaç duyulan yapı¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
5. `Evaluator`Bu, bir blok tarafından yapılan bir işlemdir.
6. `find_divisions()`和 `find_modulos()`匹配乘法、移位、修正、乘回和2'nin 等形式──
7. `find_switches()`Kategoriler atlama çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizelge çizelgesi, çizgi çizgi çizgi çizgi çizgi
8. `find_vector_loops()`- Evet.`find_unrolled_loops()`- Evet.`find_tail_calls()`- Evet.`find_inlined_calls()`- Evet.`find_selects()`- Evet.`find_memory_builtins()`- Evet.`find_stack_protector()`- Evet.`find_cet()`和 `find_strength_reduction()`覆盖其余模式──
9. `analyze_function()`Bu adımları sırayla yürütmekle birlikte, her modelin sonucu bir sonraki sıra değer arama makinesine gönderilmektedir.

Üç emir daha var.`python3 code/main.py scan FILE.objdump.txt [FUNCTION]`Bir listeye göre bir işleme tanımlayıcısı bulun ve yanında hedef dosya ve eşleşen C 文件ı bulun.`python3 code/main.py magic DIVISOR [signed]`输出乘数、移位、误差,以及恒等式在边界值上是否存在──`python3 code/main.py figure-data`输出图示嵌入的数据──

## Kullan

Kendini oluşturan yeni hedef dosyaları için, aşağıdaki sırada kullanın:

1. Hedef dosyaları toplama`llvm-objdump -d -r`输出,并将准确编译命令一起保存──识别器 从清单头读取架构──
2. Çekiltim ve yolculuk için`scan`, önce oku`unverified`条目── her bir konuyla ilgili olarak, kaynak kodu çözücüye kayıp yapı, ya da tanımlayıcıya yanlış okunmuş biçim, tüm değerli değerlendirmeler için geçerli kanıt adresleri──
3. Her türlü ders için`algorithm`- Evet.`clangMatchesAlgorithm`Gerçek zaman için, düzenleyici en az geçerli hareket miktarını seçti; yanlış zaman için, düzenleyici için henüz belli olmayan nedenler olduğu açıklanmalıdır.
4. Her bir anahtar için, her bir optimizasyon seviyesine karşılaştırın.`lowering`◊ 表变成树或树变成表,标志着可从LLVM 源码中指出的值──
5. Her döngü için`elementsPerIteration`和 `scalarRemainderLoop`, 33 . Sınıf raporunun iki yönü bir kaynak döngüsüne karşı karşı bir araya gelmiştir.
6. Aynı hedef dosyasını bir anti-kompilatörle işlemek, metnini her modelin yanında alıntı yapmak ve hangi modellerin katlandığını kaydetmek.

## 交互实验

### 实验 A:推导魔数,再找到它

- Evet .`code`Python'u aç:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization/code
python3 -q
```

运行:

```python
from main import *
magic_numbers(10), magic_numbers(10, signed=True)
magic_numbers(7), magic_numbers(7, signed=True)
divisor_from_magic(0x66666667, 34, signed=True), divisor_from_magic(0x66666667, 33, signed=True)
```

İlk kez kullanmadan önce, önce kağıt üzerinde hesaplanır.`ceil(2^35 / 10)`Sonra da.`idioms.c`Çekilme`unsigned div13(unsigned x) { return x / 13; }`, `build_fixtures.sh`İç emirler`-O2`构建,将清单中的常量与 `magic_numbers(13)`- Evet.

### 实验 B:表与树

```python
listing = load_listing("idioms-x86_64-O2.objdump.txt")
elf = load_elf("idioms-x86_64-O2.o")
sources = load_source("idioms.c")
[i.to_dict() for i in analyze_function(listing, "table_switch", elf, sources)]
[i.to_dict() for i in analyze_function(listing, "sparse_switch", elf, sources)]
elf.words(".rodata", 0x28, 7)
```

- Evet .`table_switch`Bu da bir şey.`71`改回    değiştir`70`, `-O2`Yeniden oluştur, bir çizgi değerini yeniden 1000'e çevir, onu yine de tut.`ArrayKind`Çıkış

### 实验 C:三种设置下循环

```python
for name in ("idioms-x86_64-O1", "idioms-x86_64-O2", "idioms-x86_64-novec-O2"):
    print(name, [i.source for i in analyze_function(load_listing(name + ".objdump.txt"), "sum_n", load_elf(name + ".o"), sources)])
```

Çizgi`-O2`Aşağı`sum_n`Kontrol akışı, koruma koşullarını belirlemek, gizlemek, vektör konusu, geri dönüşüm ve eksik sayı döngüsü, yeniden`detail`字段比较。

### 实验 D: ortaklıklı ticaret

```python
for name in ("idioms-x86_64-O1", "idioms-arm64-O1"):
    print([(i.kind, i.source, i.detail.get("sharedQuotient")) for i in analyze_function(load_listing(name + ".objdump.txt"), "digest", load_elf(name + ".o"), sources)])
```

Okuyucu`digest``-O1`清单,找到 x86-64 上将商与符号修正合并的两条命令,再解释为什么AArch64 构建只需要一条──

## 实践实验

Bu yöntemle, bir kişiyi tanımlamak için bir araç oluşturmak için kullanılır.

要求:

- GCC iç yapı fonksiyonu ve hareketli veya işlemci dönüşümünü kullanmak, yazmak `popcount`- Evet.`ctz`- Evet.`rotl`函数,在 `-O2`Aşağıda bir şey var .`-mpopcnt -mbmi`构建,将目标文件和清单一起提交──
- 识别`TargetLowering::expandCTPOP`Doğuştan `0x55555555`- Evet.`0x33333333`- Evet.`0x0f0f0f0f`- Evet.`0x01010101`Rapor için yerleştirilmiş sayı sırası`popcount`,并以四常量作为证据──
- - Ben de .`rep bsfl`识别为`tzcnt`Ya da`bsf`Çekil,`roll %cl`识别为旋转,并将两者解码回内建函数──
- - Evet .`parse_source()`验证中加入新类别,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `popcount` Mode sadece kaynak koduna göre kullanılır `__builtin_popcount`时才被验证――
- Her model için bir test ekle.

Başarılılık Standarı:`python3 code/main.py`İki yapı arasında üç yeni sınıf rapor edilecek.`verified: true`,测试套件 hâlâ rapor空的 `unverified`Listesi:

## 本课产物

本课包含 `outputs/skill-compiler-idioms-and-optimization.md` Bu, bir listeyi, hedef dosyalarını ve kaynak kodunu, test edilmiş standart model raporlarına dönüştürür ve bir anti-kompilatör karşılaştırması içerir.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- Çözücü 清单解析器 `-O2`目標文件读取 25 个函数,保留字节,并将 `R_X86_64_PC32 .rodata+0x24`- Evet .`table_switch`Orta `leaq`
- ELF 读取器 `.rodata+0x28`Geri dön .`[10, 20, 30, 40, 50, 60, 71]`,并读取 `.rela.rodata`Çıkışlar
- `magic_numbers`返回移位 35 的 `0xcccccccd`、移位 34  `0x66666667`、移位 35 且带加法形式的 `0x124924925`、移位 32  `0x55555556`, ve 33'ü taşıdı`0xaaaaaaab`
- 2 ile 64 arasında her 2'nin 'nin ayrımı, simgeli veya simgeli olmamasından bağımsız olarak,恒等式ları 32 nokta sınır değerinde oluşur.
- `divisor_from_magic`10,5,7,3'e karşı bir hata yapmayı reddetti.
- 加法修正序列精确计算 `n // 7`
- Dört x86-64 Çekilme raporu doğru çarpma sayısı, yer değiştirme sayısı, biçim, dört AArch64 Çekilme kodu`mov`和 `movk`
- `-O0`Kullanım`divl`和 `idivl`- Evet .`-O0 -fast-isel=false`Uygulama, ve`-O0``digest`混合两者
- 取模可识别为乘回,`msub`2'nin...`sdiv` 加`mul` 加`subs`, ve硬件 `idivl`
- 共享商在 `-O1`Aşağıda da ayrıştırma ve alım
- 两种架构在 `-O2`Aşağıdaki beş farklı indirgenme biçimi, formül, değer, hedef, merkez akseli ve seçim ifadeleri ile sınıflandırılmıştır.
- `-O0`Aşağıdaki anahtar x86-64'te, yukarıdaki atlama çizelgesinde, yukarıdaki AArch64'te, karşılaştırma zinciri
- x86-64  `digest`değişim, 16 arama tablosu, 4 farklı hedeflerin atlama tablosu, AArch64'in 9 ila 10 aralığındaki testlerin karşılaştırma ağacı
- `-fno-jump-tables`Çiylik, 16 分支 `dispatch`X86-64 Üstü yeniden konumlandırma okuma hedef, AArch64 Üstü sıkıştırma
- Göreç döngüsü rapor 4 通道、2 累加器、 her döngüde 8 element, ayrıca gizleme、 koruma koşulları、 dönüşüm ve kalan sayı döngüsü
- Sıkı zamanlı döngü tamamen ölçülü veya tamamen açılmıştır.`-fno-vectorize`8 kez açıldı
- `-O1`没有向量化;x86-64 上 `-O2`ile`-O3`Aynı şey.`call_switch`Farklı.`-O3`17 emir var.`-O2`18 条 var.
- `-fno-builtin`Depolama döngüsü, kuantitatif depolama döngüsüne dönüştürülür ve`memcpy`Kalkın
- 尾调用,`memset`替换、内联 16 字节复制, ve `-O0`İki hareketli kopyaları tanınır
- - Evet .`-O1`起能根据函数体形态内联的调用者
- 选择表达式解码为 `a > b ? a : b`- Evet.`-x < 0 ? x : -x`- Evet.`(x > 0)`和 `sum % 10 < 5 ? sum % 10 : 5`
-  proteger rapor `%fs:0x28`Çanak ve`__stack_chk_fail`,CET  yapıdaki her fonksiyon rapor edilir `endbr64`
- 源码解析器读取函数指针参数、开关 分支、调用和累加器名称
- Her yapıdaki her model, sınıf matronları ile uyumlu olarak doğrulanmıştır.
-  交互图示嵌入式数据与分析输出相同

## 生产环境中的失败模式

| 失败 | 不严谨的工具报告 | 分析必须证明什么 |
|---|---|---|
| 乘以很大的奇数常量 | “乘以 1717986919” | 常量是某个 `d` 对应的 `ceil(2^s / d)`，误差满足界限，移位量是最小有效值 |
| 右移 32 位后的加法修正 | 五条算术指令 | 乘数为 33 位，尾部是同一方法的加法形式 |
| 相同乘数、不同移位 | 相同除数 | 移位决定除数：34 对应 10，33 对应 5 |
| 对 2 的幂有符号取模 | “加 7、掩码、相减” | 偏置使舍入向零，结果为 `x % 8` |
| 从 `.rodata` 索引加载 | “跳转表” | 它是值查找表，条目从加数加 4 处的字节读取 |
| 仿射算术加 `cmov` | “计算 10k + 10” | 这是降低为线性映射的 switch，并与每个源码分支验证 |
| 按序分割的比较链 | “一串 if” | 对分支常量的二分查找，并明确枢轴 |
| 向后分支到默认块 | “循环” | 目标通过无条件跳转离开区域，属于共享尾部 |
| 一个函数中两条回边 | “两个循环” | 一个源码循环的向量主体及其标量余数部分 |
| `jmp memset@PLT` 没有 `ret` | “函数没有返回” | 尾调用通过被调用者返回，替代了存储循环 |
| 调用图缺少被调用者 | “从未调用” | 已内联：调用者中出现被调用者的函数体形态 |
| `%fs:0x28` 加载和比较 | “读取线程局部数据” | 栈保护 canary，失败路径指向 `__stack_chk_fail` |
| 函数起始四个奇怪字节 | “函数前的数据” | `endbr64`，即 CET 落点 |
| 反编译器展示原始算术 | “工具错了” | 工具没有应用折叠；推导给出源码形式，引用输出记录差距 |

## Operasyon kuralları

匹配形态,反向执行推导,写出能证明它的常量──为每种模式报告证据地址和编码出出的源码形式,对照自己编译的源码逐一验证,并引用每一个反编译器对同一字节输出的内容──

## 延伸阅读

- [Granlund, Montgomery, "Division by Invariant Integers using Multiplication" (PLDI 1994)](https://gmplib.org/~tege/divcnst-pldi94.pdf)
- [Warren, Hacker's Delight, 2nd edition, Chapter 10: Integer Division By Constants](https://www.informit.com/store/hackers-delight-9780321842688)
- [Lemire, Kaser, Kurz, "Faster Remainder by Direct Computation" (2019)](https://arxiv.org/abs/1902.01961)
- [libdivide, header-only division by runtime constants](https://github.com/ridiculousfish/libdivide)
- [LLVM `DivisionByConstantInfo.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Support/DivisionByConstantInfo.cpp)
- [LLVM `SwitchLoweringUtils.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/SwitchLoweringUtils.cpp)ve [`TargetLoweringBase.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/TargetLoweringBase.cpp)
- [LLVM `SimplifyCFG.cpp`, `simplifySwitchLookup`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Transforms/Utils/SimplifyCFG.cpp)
- [LLVM Auto-Vectorization documentation](https://llvm.org/docs/Vectorizers.html)ve [LLVM 3.4 release notes](https://releases.llvm.org/3.4/docs/ReleaseNotes.html)
- [LLVM `LoopIdiomRecognize.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Transforms/Scalar/LoopIdiomRecognize.cpp)
- [LLVM `X86CmovConversion.cpp`](https://github.com/llvm/llvm-project/blob/release/20.x/llvm/lib/Target/X86/X86CmovConversion.cpp)
- [LLVM `StackProtector.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/StackProtector.cpp)ve [`X86ISelLoweringCall.cpp`, `getIRStackGuard`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Target/X86/X86ISelLoweringCall.cpp)
- [glibc `sysdeps/x86_64/nptl/tls.h`, `tcbhead_t`](https://sourceware.org/git/?p=glibc.git;a=blob;f=sysdeps/x86_64/nptl/tls.h)
- [GCC `tree-switch-conversion.cc`](https://github.com/gcc-mirror/gcc/blob/master/gcc/tree-switch-conversion.cc)- Evet .[GCC Optimize Options](https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html)ve[GCC 12 release notes](https://gcc.gnu.org/gcc-12/changes.html)
- [Ghidra decompiler `ruleaction.cc`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/decompile/cpp/ruleaction.cc)
- [angr decompiler documentation](https://docs.angr.io/en/latest/analyses/decompiler.html)
- [radare2 book: decompilers](https://book.rada.re/arch/decompile.html)
- [Compiler Explorer API](https://github.com/compiler-explorer/compiler-explorer/blob/main/docs/API.md)
- [Godbolt, "Optimizations in C++ Compilers: A practical journey", ACM Queue 17(5), 2019](https://queue.acm.org/detail.cfm?id=3372264)
- [Microsoft, `/GS` (Buffer Security Check)](https://learn.microsoft.com/en-us/cpp/build/reference/gs-buffer-security-check)
