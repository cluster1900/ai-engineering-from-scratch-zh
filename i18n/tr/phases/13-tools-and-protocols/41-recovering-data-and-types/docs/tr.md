# Data Recovery ve tür: yapı­ ̇ sayı¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

> Anti-kompilatör var tip çizgi zaman çıkış `a->balance`, hiç zaman `*(int *)(param_1 + 4)`Bu ders, ziyaret çalışmaları ile yapılandırma tip çizelgesini, DWARF 5'ten gerçek tip çizelgeleri okuyarak, iki türün birliğini gösterir.

**Type:** Build
**Languages:** Python, C, C++, x86-64 assembly
**Prerequisites:** Phase 13 · 33（反汇编与控制流）、Phase 13 · 34（提升为伪代码）
**Time:** ~140 分钟

## Öğrenme hedefi

- Intel SDM 寻址规则,将结构体成员访问解读为基址寄存器加位移,将数组访问解读为基址加索乘步长──
- Hand工将 Sistem V                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `struct account`, her bir doldurma bölümünü açıkla.
- 构建类型恢复分析遍,将清单中的访问转换为字段偏移、宽度、类别、步长和大小,并为每项提供证据──
- Hedef dosyasını yeniden ayarlayabilmek için.`.debug_info`- Evet.`.debug_abbrev`- Evet.`.debug_str_offsets`和 `.debug_addr`编写 DWARF 5 读取器,并对照 `llvm-dwarfdump`Kontrol.
- Dönüştürülmüş yapı ile DWARF yapı karşılaştırıldığında, her farklılık kayıp kanıt, birleşik giriş veya kanıtlanamayan sınıflara sınıflandırılır.
- Yeniden konumlandırma kayıtlarından Itanium C++ 虚函数表、类型信息和修饰名称,并将虚调用解析到槽位──

## 问题

Sen yanımda değilsin .`-g`Bu yüzden de bu konuyu tercüme etmemiz gerekiyor.`account.c`Sonra da ajanı sor.`bump`Bu yüzden, hedef dosyaları Ghidra 12.1.4'e teslim edecekleri bir ajan aşağıdaki sonuçları elde edecek:

```c
void bump(long param_1,int param_2)
{
  *(int *)(param_1 + 4) = param_2 + *(int *)(param_1 + 4);
  return;
}
```

Bir kaynak koduyla.`-g`编译后,同一个反编译器给出的结果如下:

```c
int bump(account *a,int by)
{
  a->balance = by + a->balance;
  return a->balance;
}
```

İki hedef dosyasındaki talimatlar tamamen aynıdır, fark tip çizelgesinde yer alır. Bu çizelge varsa, anti-kompilatör ilk parametreni 32 字tteki bir yapısal yapısalına işaret eder, bunun arasında 4 ̊'ün yönü isimlidir.`balance`字节 `int`Bu tablo yok, sadece bilir.`%rdi`Orta bir 8 字节宽的值, ve `+4`处的4字节被读取和写入──

Çevresindeki her bir şeyin kaynağı vardır.`addl 0x4(%rax), %ecx`位移字节; 宽度 4 来自 `l`后;名称来自 `.debug_info`Orta `DW_TAG_member`条目──本课构建这两个部分:一个恢复命令所能证明信息的分析遍,以及一个解码编译器记录的读取器──两者之间的差异,就是获得类型名称需要付出的代价──

```figure
re-41-struct-recovery
```

## 成员访问就是位移

Intel SDM 第 1 卷 第 3.7.5 节将有效地址定义为 `Offset = Base + (Index * Scale) + Displacement`, oran faktörleri 1、2、4 veya 8, 8、16 veya 32 位 olarak değiştirilir.`RIP + Displacement`形式──结构体成员访问采用第一种形式但没有索引:基址寄存器保存对象地址,位移就是成员偏移──数组访问加入索引项,比例因子或单独的乘法承载元素大小──

E`-O0`Aşağıda `bump`Örneğin...`llvm-objdump -d -r`清单如下:

```text
       4: 48 89 7d f8                  	movq	%rdi, -0x8(%rbp)
       e: 48 8b 45 f8                  	movq	-0x8(%rbp), %rax
      12: 03 48 04                     	addl	0x4(%rax), %ecx
      15: 89 48 04                     	movl	%ecx, 0x4(%rax)
```

33 . Sınıfın Kuralları`03 48 04`- Evet.`03`Göster`ADD r32, r/m32`❖ ModRM `48`Evet .`01 001 000`- ...`mod = 01`göstermek 8 位位移的内存操作数,`reg = 001`Evet .`%ecx`- Evet .`r/m = 000`Evet .`%rax`△位移字节为 `04`❖ 該命令读取 `%rax + 4`4 字节,并将其加到`%ecx`- Evet.`llvm-objdump`输出 `l`后表示操作数大小,因此字段宽 4 字节。`%rax`- Evet .`-0x8(%rbp)`Çukurlar, çukurlar alıyor.`%rdi`Sistem V'de belirlenmiş ilk tam sayısal parametre kullanılır. Bu üç gerçekle sonuçlanır: İlk parametresi bir işaret; yönlendirdiği nesne 4'te bir 4 字节字段 vardır.`bump`读取并写入该字段──

Bu kısımlar açıklanmamış .`int`- Evet.`balance`Ya da`struct account`, ayrıca nesneyi çok fazla açıklamadı.`bump`Görülmez.

## Sistem V 布局 kuralları

x86-64 psABI Bölüm 3.1.2 üç adet birleştirme tipini kuralları verir:  yapı ve birleşme, en sıkı üyelerinin birleştirme gereksinimlerini karşılamak için birleştirilmiştir.`char`1 ve 1 için.`short`2 ve 2`int`4 ve 4 için.`double`8 ve 8 için, herhangi bir işaret 8 ve 8 olarak belirlenir.

Bu kuralları uygulayacaklar.`account.c`Orta yapı:

```c
struct account {
    char kind;
    int balance;
    short code;
    double rate;
    const char *label;
};
```

| 成员 | 大小 | 对齐 | 满足条件的最低偏移 | 前置填充 |
|---|---|---|---|---|
| `kind` | 1 | 1 | 0 | 0 |
| `balance` | 4 | 4 | 4 | 3（字节 1 至 3） |
| `code` | 2 | 2 | 8 | 0 |
| `rate` | 8 | 8 | 16 | 6（字节 10 至 15） |
| `label` | 8 | 8 | 24 | 0 |

Son bir üye 32'de sona erer. En sert bir düzen 8,32'nin 8'in katı sayısıdır. Bu nedenle, büyüklük 32, kısım doldurulmaz.

Üyelik sırası karar verir.`double, pointer, int, short, char`排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排列, 排, 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 排 `code/main.py`Orta `sysv_layout()`Bu üç kural uygulamak iki sonuç elde etti.`ctypes`模块通过宿主编译器约定应用相同规则;对同一结构体,`ctypes.sizeof`- Evet.`ctypes.alignment`和各字段的 `.offset`32/8'e kadar ayır.`0, 4, 8, 16, 24`❖ Bu makinede bir program oluşturulduğunda ve çalıştırıldığında, program kendiliğinden üçüncü sonuçları yazdırır:

```text
sizeof 32 align 8
kind 0 balance 4 code 8 rate 16 label 24
sum 315 tag -3 projected 318.75 label_length 7
```

Armadaki yapı ise arm64'dir. Armad AAPCS64 Bölüm 5.10.1 Bölüm aynı birleştirme tipini belirler. Apple'ın arm64 dosyası da bu beş tip birleştirme biçimini korur. Bu nedenle iki hedef platformu sayısı aynıdır.`-target x86_64-unknown-linux-gnu`编译,以便第33 课的 ELF 读取器和下文的 DWARF 读取器能够处理它们──

## Hand工读取 yapı vücudunun geri kalanı

`bump`Sadece bir bölüm görebiliyorum.`account.c`Diğer dört fonksiyon, kalan bölümleri görebilir ve her fonksiyon farklı bir talimat biçimi gösterir.`account-x86_64-O0-g.objdump.txt`- Evet.

`sum_balances`Bu yapıtanın bir dizi için indeksi:

```text
      51: 48 8b 45 f8                  	movq	-0x8(%rbp), %rax
      55: 48 63 4d ec                  	movslq	-0x14(%rbp), %rcx
      59: 48 c1 e1 05                  	shlq	$0x5, %rcx
      5d: 48 01 c8                     	addq	%rcx, %rax
      60: 8b 40 04                     	movl	0x4(%rax), %eax
```

`%rax`Evet .`list`- Evet .`%rcx`64'e kadar genişlemiş.`i`... ve ...`shlq $0x5`32'de gerçekleşecek.`addq`后,`%rax`Çı`list + 32 * i`, yükleme işlemini okuyun`i`个元素偏移 4 处的 4 字节──移位次数, bu hedef dosyasında sayısal biçimdeki mevcut yapısal biçimdeki en büyük yerin tek yeridir── içerir bu talimatların döngüsü.`0x49`延伸到                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `0x72`- Ne ?`jmp 0x49`- Evet.

`tag`读取两个狭字段:

```text
      8c: 0f be 00                     	movsbl	(%rax), %eax
      98: 0f bf 48 08                  	movswl	0x8(%rax), %ecx
```

`movsbl`Ürün 0'da bir fijt oluşturuyor ve bir fijt genişletiliyor, bu nedenle fijt oluşturuyor.`movswl`Gelirken 8'in iki metni genişletilmiş, bu nedenle Gelirken 8'in 2 metni tamamlanmıştır.`-O1`İlk ziyaretim oldu.`cmpb $0x6c, (%rdi)`, hala 0'da 1 karakter var, ama bir kod belirtmez.

`projected`读取浮点数:

```text
      cc: f2 0f 2a 40 04               	cvtsi2sdl	0x4(%rax), %xmm0
      d5: f2 0f 59 40 10               	mulsd	0x10(%rax), %xmm0
```

`cvtsi2sdl`Kayıtta bulunan 32 sayısal tamamı sayı iki kesinlik sayı olarak değiştirildi, doğrulamayı 4 sayısal tamamı sayı olarak kaydetildi.`mulsd`乘以内存中的双精度数, dolayısıyla偏移 16 处保存 8 字节浮点值──

`label_length`读取指针,然后沿着指针访问:

```text
      f3: 48 8b 40 18                  	movq	0x18(%rax), %rax
      f7: 48 63 4d f4                  	movslq	-0xc(%rbp), %rcx
      fb: 80 3c 08 00                  	cmpb	$0x0, (%rax,%rcx)
```

`movq`读取偏移 24 处的 8 字节──单看这一步,它可能是8 字节整数,也可能是指针──`cmpb`Bu değer, bir akış açısı işlevi sayısının temel adresini kullanır.`cmpb`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `%rcx`处的 1 字节;在 `-O1`Aşağıda, döngü içinde geçiyor.`leaq 0x1(%rcx), %rcx`推进指针, bu nedenle yönlendirici elementler间隔为 1 字节──

综合五个函数,结构体为 `{ i8 at 0, i32 at 4, i16 at 8, f64 at 16, pointer at 24 }`,步长为 32──1至3 和 10至15 的空隙恰好是 psABI 规则预测的填充──指令未说明的内容包括:成员名称;指针类型是`const char *`;偏移 0 处有符字节的声明类型,源码写作 `char`Ve beş fonksiyon alımı aynı tipte.`main`, aynı  nesneyi tüm beş işlevi ile aktarır.`-O0`Aşağıda, bunu netleştirmek için:`leaq -0x70(%rbp), %rdi`后,在 `callq bump`Önü`addq $0x20, %rdi`, `callq tag`Önü`addq $0x40, %rdi`❖ 偏移 0`0x20`和 `0x40`Aynı sayıdaki üç element; sayıdaki üç elementin doldurulması için kullanılır.`memcpy`Çizgi`0x60`字节, yani 96 字节,正好是三个 32 字节元素──

## 分析遍

`code/main.py`Orta `trace_function()`Adres sırasıyla bir işlevin talimatını takip ederek, küçük bir soyut durumunu korur.`-0x8(%rbp)`槽── her pozisyon üç değerden biridir──`Pointer`Bu kısımların sayısı, bu kısımların sayısı ile birlikte belirsiz bir katılık gösterir.`Index`Bilinmeyen sayı değeridir, ancak belirli bir oran için faktörlerin toplamının sayısını bir kaç katına çıkarır.

İlk Durumlar 6 Sistem V 参数寄存器分別保存 `Pointer("param0", 0)`- Evet .`Pointer("param5", 0)`                                                                                                                                                                                                                                                              

- 64 位寄存器 ve 槽 arasındaki `movq`複製值──寄存器'ın 32 bit veya daha küçük yazısı oran faktöründe 1'e değişecektir.`Index`- Evet.
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `leaq`Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler: Ürünler::: Ürünler:::::::::::`scale * index_scale`❖`%rbp`Ya da`%rsp`Bu yüzden...`leaq`Bu da bir şey.`main`传递 `rows`Nasıl...
- - Evet .`Index`执行 `shlq $n`Ölçüm oranı `2^n`, execu `imulq $k`- Evet.`k`- Evet.
- İndeksi ile İndeksi artı `addq`Bulguyu tutmak,并将索引比例因子加入步长集合──对索引执行 `addq $k`Bu kaydı değiştirirken kaydı kaydetir.
- 调用使所有调用者保存寄存器变为未知;保存指针的参数寄存器会记录为调用点──
- 基址寄存器保存指针'nin herhangi bir内存 işletim sayısı değişir `Access`, bu da işaretlerin köklerini ve eteklerini içerir, Kütüp yazarı tarafından belirlenen genişlik ve sınıflar, demekleme işaretleri

宽度和类别 yalnızca yardımcı yazar tarafından belirlenir.`access_width()`- Ben de .`b`- Evet.`w`- Evet.`l`- Evet.`q`后映射到1、2、4、8 字节;将 `movsbl`和 `movswl`映射为有符号狭加载,`movzbl`映射为无符号加载;将 `sd`和 `ss`标量 SSE 指令映射为 8 字节和 4 字节浮点数;将 `cvtsi2sdl`映射为有符号 4 字节整数源;将 16 字节的 `movaps`Örgütler:`leaq`Ve her türden`nop`Ziyarete ait değil.

```python
if memory.base in FRAME_REGISTERS:
    return Pointer(f"frame({memory.base}{format_signed(memory.displacement) if memory.displacement else ''})", 0)
base = env.get(memory.base)
if not isinstance(base, Pointer):
    return Unknown
strides = set(base.strides)
if memory.index is not None:
    index_value = env.get(memory.index)
    strides.add((index_value.scale if isinstance(index_value, Index) else 1) * memory.scale)
return Pointer(base.root, base.offset + memory.displacement, frozenset(strides), base.origin)
```

通过指针加载 8 字节会生成一个新指针,其根标识值来自的字段,例如 `param0->0x18`◊ Bu değerden sonra kullanılır veya geçerlidir `leaq`推进时,来源字段就被标记为已证明是指针──这条规则将偏移 24 从8 字节变为指针──

### Dört adım

`infer_layout()`合并所有见证函数的访问,并从四种来源收集步长,每个项都附产生它的指示──

| 类别 | 来源 | 展示它的构建 |
|---|---|---|
| `scale` | 由 `shlq $0x5` 或 `imulq` 产生、比例因子大于 1 的 `Index` 到达指针 | `-O0`，`0x59` 处的 `shlq $0x5, %rcx` |
| `loop-step` | 循环内基址或索引寄存器的 64 位增量，且同一循环也包含该访问 | `-O1`，`0x24` 处的 `addq $0x20, %rdx` |
| `offset-delta` | 同一循环中通过同一基址寄存器、宽度相同且偏移间距恒定的访问 | `-O2`，八次间隔 32 的加载 |
| `call-site` | 将同一栈帧对象传给见证函数时所采用的偏移 | `-O0`，`main` 传递 `rows`、`rows+0x20`、`rows+0x40` |

循环由向后的 `jmp`Ya da koşullar belirlenir, ancak döngü kapsamı aynı zamanda artış ve ziyaretler içerir, artış sadece kanıtlar için hesaplanmıştır.`-O0`Aşağıya doğru ilerle`i``addl $0x1, %eax`32 bit artış olduğu için ve ziyaret geçmediği için.`%eax`◊ Final step length, tüm bulduğumuz sayıların en büyük konvantaj sayısıdır.

### -O2 Aşağıdaki otikasyon döngüsü

- Evet .`-O2`Aşağı, clang `sum_balances`Ölçümlendirme.`0x50`- Ne ?`0xaa`Çemberin her döngüsü 8 element içerir:

```text
      3b: 48 8d 87 e4 00 00 00         	leaq	0xe4(%rdi), %rax
      50: 66 0f 6e 50 80               	movd	-0x80(%rax), %xmm2
      55: 66 0f 6e 98 60 ff ff ff      	movd	-0xa0(%rax), %xmm3
      61: 66 0f 6e 90 40 ff ff ff      	movd	-0xc0(%rax), %xmm2
      69: 66 0f 6e a0 20 ff ff ff      	movd	-0xe0(%rax), %xmm4
      7d: 66 0f 6e 10                  	movd	(%rax), %xmm2
      81: 66 0f 6e 58 e0               	movd	-0x20(%rax), %xmm3
      8a: 66 0f 6e 50 c0               	movd	-0x40(%rax), %xmm2
      8f: 66 0f 6e 60 a0               	movd	-0x60(%rax), %xmm4
      a0: 48 05 00 01 00 00            	addq	$0x100, %rax
      aa: 75 a4                        	jne	0x50 <sum_balances+0x40>
```

`%rax`- Evet .`list + 0xe4`開始──八位移使加载位置对对对 `list`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `0x04, 0x24, 0x44, 0x64, 0x84, 0xa4, 0xc4, 0xe4`Yani ...`4, 36, 68, 100, 132, 164, 196, 228`                                                                                                                                                                                                                                                              `0x100`, yani 256¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

`fold_unrolled()`应用一条规则: Bir döngü içinde, aynı adres kayıtçısı tarafından yapılan aynı geniş ziyaretleri alınır.`d`Bu da 32.. Eğer bir döngü uzun sürerse.`k * d`Ve gerçekten var.`k`个不同偏移,则循环展开了 `k`Bir sonraki ziyaretler de çok farklı.`(offset - lowest) mod d`处的同一个元素访问──这里`256 = 8 * 32`, ve sekiz hareket var, bu yüzden sekiz yükleme tüm çarpma 4'e kadar çarpıyor.`offset-delta 32`- Evet.`unrolled 32`和 `loop-step 256`- Evet.`0xe0`处的标量余数循环 yine `shlq $0x5, %rdx`加入 `scale 32`, `addq $0x20, %rdx`加入 `loop-step 32`❖ Beş sayısal değerin en büyük konvansiyon sayısı 32 ❖

Bir resim var ki, bir resim var.`-O2`Yapımcılık, 32'den sonraki yedi bölümden oluşur ve büyüklük yoktur. Bu sadece bir yer hareketinin, bir döngü incelemenin bir okuyucunun göreceği bir durumdur.

## Çıkışlar:

`account.c``-g`Yapımcılık, taşımak ve sekiz tane inceleme.`.debug_info`493 字节,`.debug_abbrev`179,`.debug_str`230,`.debug_str_offsets`124,`.debug_addr`112,`.debug_line`312'e.`.debug_line_str`12`.debug_frame`264 DWARF 5 标准的引言将`.debug_str_offsets`- Evet.`.debug_addr`和 `.debug_line_str`列为第5 版新增内容──`code/main.py`Orta okuyucu makinesi için ön beş bölüm gereklidir.

### 单元头

标准第 7.5.1.1 节 give complete编译单元头:`unit_length`- Evet.`version`- Evet.`unit_type`- Evet.`address_size`和 `debug_abbrev_offset`- Evet.`.debug_info`Bu bölümde şunlar yer alıyor:

```text
e9 01 00 00   unit_length = 0x1e9 = 489
05 00         version = 5
01            unit_type = DW_UT_compile
08            address_size = 8
00 00 00 00   debug_abbrev_offset = 0
```

`unit_type`字节, 5. baskının yeni bir parçasıdır, standart aynı bölümde bunu açıklıyor.`4 + 489 = 493`Başlayın, işte bu bölümün sonu.`llvm-dwarfdump --debug-info`Bu arada`Compile Unit:`Yapılan ilk test ise, 5 değer ile aynı değerleri yazıyor.

### 缩写

Bölüm 2.1 节说明, her bir 调试信息条目由标识标签和一系列属性组成──条目自身只保存缩写代码──代码选择 条目本身保存缩写代码──代码选择`.debug_abbrev`(7.5.3 Bölüm) içinde bulunan açıklama, etiketlerin, arka planın ve içeriklerin olup olmadığını belirleyen açıklama, her tür özelliklerin ve kodlama biçimlerinin listelenmesini sağlar.

```text
[12] DW_TAG_structure_type  DW_CHILDREN_yes
     DW_AT_name              DW_FORM_strx1
     DW_AT_byte_size         DW_FORM_data1
     DW_AT_decl_file         DW_FORM_data1
     DW_AT_decl_line         DW_FORM_data1
[13] DW_TAG_member           DW_CHILDREN_no
     DW_AT_name              DW_FORM_strx1
     DW_AT_type              DW_FORM_ref4
     DW_AT_decl_file         DW_FORM_data1
     DW_AT_decl_line         DW_FORM_data1
     DW_AT_data_member_location  DW_FORM_data1
```

`parse_abbreviations()`读取 ULEB128 代码、ULEB128 标签、一个子条目标志字节,然后读取属性与形式的配对,直到遇到`0, 0`7.5.6 Bölüm:`data1`Çıkacak bir kısım;`ref4`Birimlere karşı 4 字节 hareket;`strx1`Çekilme göstergesinin 1 字节 indeksi;`sec_offset`和 `data4`为 4 字节;`addrx`IP adres listesi için ULEB128 索引;`exprloc`Çevre sayısı için ULEB128 长度及相应 sayısı;`flag_present`Tamamen eksik.

### Hand工解码 bakiye 成员

`account`Yapılık                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `0x195`,字节为 `0c 15 20 00 03`△ kısaltma kodı 12 için,表示结构体──`DW_AT_name`Evet, evet.`0x15`- Evet .`DW_AT_byte_size`Çı`0x20`= 32,`DW_AT_decl_file`0 için.`DW_AT_decl_line`3 için,  `struct account {`- Yürüyüşte.

İkinci üyelik`0x1a3`開始,字节为 `0d 10 88 01 00 00 00 05 04`- ...

1. `0d`Evet, 13'ü kısaltmak, üyelik göstermek.
2. `10`Evet`strx1`编码的 `DW_AT_name`Şarkı: 字符串索引 16──
3. `88 01 00 00`Evet`ref4`编码的 `DW_AT_type`Birlikler hareket etmektedir.`0x188`,即名为`int``DW_TAG_base_type`条目。
4. `00`Evet .`DW_AT_decl_file`- Evet .`05`Evet .`DW_AT_decl_line`- ...`account.c`5. bölümde.
5. `04`Evet .`DW_AT_data_member_location`:偏移 4。

Bölüm 5.7.6 节说明, member 条目 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属性 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 属 `addl 0x4(%rax), %ecx`Ortadaki hareket sayısı aynı,`compare_layouts()`İşte bu iki işlevi birbiriyle karşılaştırır.

### 字符串和地址 经由两张表解析

字符串索引 16 不是 `.debug_str`Orta yönlendirmeler.`DW_AT_str_offsets_base`,其值为 8,然后读取 `.debug_str_offsets`İçeride`8 + 4 * 16`处的 4 字节条目──该条目保存 `"balance"`- Evet .`.debug_str`Orta yön taşımacılık.`sum_balances`条目以字节 `07 07`Başlık: kısaltma 7 göstermek için program, sonra ise `addrx`7'nin kodlaması`DW_AT_low_pc`- Evet.`.debug_addr`İçeride`8 + 8 * 7`处的 8 字节条目为 `0x30`,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `.text`Orta Adresı: │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ 

Yeniden konumlandırılabilir hedef dosyasında, iki tabloda son değer saklanmamıştır.`.debug_str_offsets`Her bir şey 0'dur.`.rela.debug_str_offsets`保存针对 `.debug_str`29'u var.`R_X86_64_32`重定位,真实偏移在加数中──`.debug_addr`13 tane hedef var.`.text`和 `.rodata.str1.1``R_X86_64_64`Çıkışlı.`.debug_info`自身有四重定位:缩写偏移;以 `.debug_str_offsets+0x8`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `DW_AT_str_offsets_base`- ...`DW_AT_stmt_list`Ve`.debug_addr+0x8`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `DW_AT_addr_base`在读取器解析节之前,`ElfObject.relocated()`32 ve 64 adet uygulama tipi`S + A`△ hedef dosyasındaki 节符号值 0, bu nedenle 字段获得加数──`llvm-dwarfdump`执行 the same analysis, this is its output power to display name and address                                                                                                                                                                                                                                                       

### 类型、函数和位置

`DwarfInfo.type_name()`    `DW_AT_type`引用追踪──`label`成员指向 `DW_TAG_pointer_type`Sonraki yön`DW_TAG_const_type`, yeniden yönlendirilir`char`基本类型, 组合出的名称是`const char *`- Evet.`type_size()`Temel tür ve yapılara geri dönme`DW_AT_byte_size`, göstergeyi geri döndür 8, bir diziyi geri döndür sayı çarpı element büyüklükte.`type_kind()`Genel olarak`DW_AT_encoding`简化为带符号性 `int`Ya da`float`,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `pointer`Bunlar, karşılaştırma sırasında kullanılan sınıflardır.

`DwarfInfo.functions()`读取六个 `DW_TAG_subprogram`条目。`bump`- Evet .`0x0`延伸到                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `0x21`,即 `DW_AT_low_pc`Üstüne`DW_AT_high_pc`长度──它的基址为 `DW_OP_reg6 RBP`,参数 `a`Yerleri ifade etmek için`91 78`- ...`DW_OP_fbreg`Üstüne SLEB128  değer`0x78`, yani -8 . Bu tam olarak bir liste .`0x4`- Ben de .`%rdi`存入的槽 `-0x8(%rbp)`◊调试信息和命令从两个角度描述同一个槽──

## İki tabloyu karşılaştır

`compare_layouts()`遍历 DWARF 成员,并寻找相同偏移处的推断字段──没有对应字段的成员标记为 `no-evidence`;字段大小不同为 `size-mismatch`;字段从未被解引用的指针成员为 `pointer-unproven`;类别不一致为 `kind-mismatch`Örneğin, tip bir evrak sayı ve tüm sayısal hesaplama yöntemini kullanma talimatı.`unexpected`◊                                                                                                                                                                                                                                                              `DW_AT_byte_size`Ben de.

Üç yapısal değeri`python3 code/main.py`- ...

| 构建 | 通过第一个参数的访问数 | 字段 | 步长证据 | 匹配成员 | 大小 |
|---|---|---|---|---|---|
| `-O0` | 11 | 5 | `scale 32`、`call-site 32`、`call-site 64` | 5/5 | 32，匹配 |
| `-O1` | 9 | 5 | `loop-step 32` | 5/5 | 32，匹配 |
| `-O2` | 17 | 折叠后 5，折叠前 12 | `offset-delta 32`、`unrolled 32`、`loop-step 256`、`scale 32`、`loop-step 32` | 5/5 | 32，匹配 |

Her bir yapısal tahmin boşluğu, 1 ila 3 ve 10 ila 15 karakterler arasındadır. Bu, DWARF'in düzenlemesinin doldurma karakterlerine eşitdir.`natural_alignment_ok()`Bu konuyu kaydetmiş olacağım.

个个加入函数时,结果也随之变化──只有有`bump`时,布局只有偏移4 的一个字段,大小未知,下界为8──`sum_balances`加入步长;`tag`加入偏移 0 和 8;`projected`加入偏移 16 的浮点数;`label_length`加入偏移 24 的指针,并证明它是指针──`main`- Evet .`-O0`Aşağıya sokulma noktası,`-O1`和 `-O2`Aşağıda içeriği artırılmamıştır, çünkü düzenleyici içinde tüm düzenler vardır.

Üç sınıf bilgi hala elde edilemiyor.`const`Ayrıca emirlerde yok.`label`Bu tip sadece bir çizgi döngüsünden oluşur.`leaq 0x1(%rcx), %rcx`Bir elementin bir kısmı olduğunu bilmek, bu da mümkün.`char`- Evet , evet .`unsigned char`Ya da`_Bool`- Evet.`-O1`Aşağı, 0'ın etkisi bilinmiyor, çünkü `cmpb $0x6c, (%rdi)`Sadece karşılaştırıp genişletme.`int8`, ve kullanılır `movsbl`符号扩展的                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `-O0`Aşağı rapor`i8`35. Sınıf bu olayları bilinmeyen bir konuya kaydetmiştir.

## C++ nesneleri

`shapes.cpp`- Defini etti .`Shape`,虚析构函数、纯虚  içerir`area()`和虚 `name()`Ayrıca kendi hayatını da tanımlamıştır.`Shape`İki tane daha.`int`成员的   üyelik`Rect`❖ İtanyum C++ ABI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

### 修饰名称

ABI 5.1.2 Bölüm                                                                                                                                                                                                                                                            `_Z`── hedef dosyasında 19 tane bu tip simge vardır.`_ZNK4Rect4areaEv`Çıkış:`_Z`, sonra`N`Göstermek için bir isim.`K`表示 const 成员函数,`4Rect`和 `4area`Evet, bu çok güzel bir şey.`E`Bu da bir şey.`v`Gösterme:`llvm-cxxfilt`输出 `Rect::area() const`- Evet.`_Z8describeRK5Shapei`Evet .`describe(Shape const&, int)`- ...`R`Çıkış:`K`Göster const,`5Shape`Evet,`i`Göster`int`5.1.4 Bölümlerin özel isimleri vardır:`_ZTV`Göstermek için:`_ZTI`Tip bilgi gösterir,`_ZTS`表示类型信息名称字符串── yapılandırma işlevi ve yapılandırma işlevi kullanımı `C1`- Evet.`C2`- Evet.`D0`- Evet.`D1`- Evet.`D2`Bu yüzden `_ZN4RectD0Ev`和 `_ZN4RectD2Ev`Şehir dışı`Rect::~Rect()`: removetype Analysis Konstruktion Fonksiyonu ve Ki Object Analysis Konstruktion Fonksiyonu Ortak Kaynak Kodu adı。

`code/main.py`Orta `Demangler`Bu bölümün kapsamını ve 5.1.5.2 bölümünün içe girmiş tip kodunu ve 5.1.10 bölümünü kapsamaktadır.`S_`替换──测试会对全部19名运行它,并与捕获的 `llvm-cxxfilt --no-strip-underscore`输出比较── bu işaret macOS üzerinde çok önemlidir, çünkü araç ön yönlendirmeyi unuttu ve sonra tanımlanamadı.`Z8describe...`- Evet.

### From重定位读取虚函数表

ABI 2.5.2 Bölüm sırayla listelenmiş虚函数表構成部分:虚调用偏移、虚基类偏移、上层对象的偏移、类信息指针,最后是虚函数指针──地址点是对象的 vptr 保存的值,即第一个函数指针的地址──第 2.6.2 节)`Rect`虚基类 yoktur, bu nedenle tablo üst düzey nesnelerin etkisi 信息类型 ve işlevi 

符号 `_ZTV4Rect`Hedef dosyasındaki her bir metin sıfırdır, içeriği yer alır.`.rela.data.rel.ro._ZTV4Rect`- ...

```text
0000000000000008 R_X86_64_64              _ZTI4Rect
0000000000000010 R_X86_64_64              _ZN4RectD2Ev
0000000000000018 R_X86_64_64              _ZN4RectD0Ev
0000000000000020 R_X86_64_64              _ZNK4Rect4areaEv
0000000000000028 R_X86_64_64              _ZNK4Rect4nameEv
```

槽 0 保存到顶层对象的偏移,此处为 0,不需要重定位──槽 1 是类型信息──地址点在 `+16` Buradan, 0'luk boşluk tam bir nesne ayrımı fonksiyonu, 1'luk boşluk ayrımı fonksiyonu, 2'lük boşluk ayrımı fonksiyonu,`area`, Sıkıntı 3 `name`- Evet.`read_vtable()`读取符号大小、其范围内的重定位以及偏移 0 的零──`Shape`Aynı şekil, 2 tane.`__cxa_pure_virtual`, yani sadece gerçekleştirilir.

### RTTI

Bölüm 2.9.4`std::type_info`描述为 vptr 后一个指向修饰类型名指针,并列出其派生类──`_ZTI4Rect`Üç tane yer var:`_ZTVN10__cxxabiv120__si_class_type_infoE+0x10`- Evet.`_ZTS4Rect`和 `_ZTI5Shape`Birinci,`__si_class_type_info`Bu ABI, sadece bir genel olmayan varlıklı sınıfı sınıfı için kullanılır.`+0x10`则是该虚函数表的地址点──第二个向字符串 `4Rect`,即修饰类型名;`type_info`上调用 `name()`返回的正是该字符串──第三表示基类──`_ZTI5Shape`Kullanım`__class_type_info`, hiçbir temel işaretleme yok.`read_typeinfo()`Bu üç gerçeğe geri dön.

### 虚调用

`-O0`Aşağıda `describe`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

```text
       f: 48 8b 7d f8                  	movq	-0x8(%rbp), %rdi
      13: 48 8b 07                     	movq	(%rdi), %rax
      16: ff 50 10                     	callq	*0x10(%rax)
```

Birinci .`movq`Ürün göstergesi yüklenmek. İkinci okuyuş, nesne hareketinin 0'da olduğu 8 字节, yani vptr, çünkü ABI onu boş fonksiyonlu sınıfların en önüne koyar.`callq`经由 vptr 后 `0x10`处的指针调用,而`0x10 / 8`2'ye karşı.`find_virtual_calls()`匹配该模式并报告两候选人: 来自`_ZTV4Rect``Rect::area() const`, ve de `_ZTV5Shape``__cxa_pure_virtual`                                                                                                                                                                                                                                                              

DWARF aynı bölgeyi kaydetti.`area``DW_TAG_subprogram`条目均带有 `DW_AT_vtable_elem_location (DW_OP_constu 0x2)`- Evet .`name`带有槽 3,解析构函数带有槽 0──`Rect`Evet 16 字节的`DW_TAG_structure_type`,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `Shape``DW_TAG_inheritance`条目,以及偏移 8 的成员 `w`Hızlı ve 12  `h`- Evet.`Shape`8 字节, bir yapay üye içerir.`_vptr$Shape` Yeniden konumlandırma ve düzenleme düzenlemeleri`area`Çevre 2'dir.

- Evet .`-O1`Aşağı, hedef dosya tamamen boş bir işlevi listesi yok.`main`- Ben de .`Rect`构建为局部对象,因此编译器在编译期解析并内联了 `r.name()`和 `describe(r, 2)` hiçbir yerde                                                                                                                                                                                                                                                             `describe`仍包含 `movq (%rdi), %rax`和 `callq *0x10(%rax)`Çünkü parametre istisnai olabilir.`Shape`虚函数表缺失只是关于某一个目标文件的事实,测试 `test_the_optimised_object_keeps_the_call_pattern_but_drops_the_vtables`Bu iki yönü kontrol et.

Microsoft ABI'nin her ayrıntıda farklı bir özellik vardır.`?`开头并编码调用约定, bu nedenle C++ olarak `__cdecl`编译的`void test(void)`Evet .`?test@@ZAXXZ` RTTI 定位器                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `_RTTICompleteObjectLocator`形式位于 `vfptr[-1]`符号`??_7`Vftable gösterir,`??_R4`Programı: Microsoft'un kendi dosyası, C++ adı ve standartları yok.

## 工具如何呈现恢复出的类型

Aşağıda, çıkış çizgisi, tüm bu makinede üretilen ve yakalanan değeri belirtilen.`code/fixtures/tools/`▽未安装工具的行只描述其文档,并明确标注──

| 工具 | 版本、许可证 | 类型存放位置 | 在本课样例上的结果 |
|---|---|---|---|
| Ghidra | 12.1.4，2026-09-21，Apache-2.0 | Data Type Manager 包含内置、用户定义和派生类型；`.gdt` 存档；程序使用的类型会复制到程序中 | 有 DWARF：`/DWARF/account.c/account size=32 align=8` 和 `a->balance = by + a->balance;`。无 DWARF：`*(int *)(param_1 + 4)`，以及 `long param_1`、`tag(char *param_1)` 和 `*(char **)(param_1 + 0x18)` |
| IDA Pro | 9.4，2026-07-13，商业软件；IDA Free 限非商业使用，云反编译器仅支持 x86 | Local Types 窗口、`.til` 类型库，将 DWARF 和 PDB 导入 `dwarf` 或 `pdb` 文件夹 | 未安装。仅依据文档 |
| Binary Ninja | 6.0，2026-09-03，商业软件，提供 Free 版 | 类型编辑、头文件导入导出、类型存档、DWARF 和 PDB 调试信息、类型库、平台类型 | 未安装。仅依据文档 |
| radare2 | 6.2.4，2026-10-05，LGPLv3 | `ts`、`tsc`、`afvd` | 对设置 `bin.dbginfo=true` 的可重定位目标文件，`ts` 和 `tsc account` 未输出内容；`pdf` 显示 `mov dword [rax + 4], ecx`，附有来自 DWARF 的源码行注释 |
| rizin | 0.9.1，2026-06-29，核心采用 LGPL | `ts`、`tsc`、`afvd` | `tsc account` 从 DWARF 打印 `struct account { char kind; int balance; short code; double rate; const char *label; };`；不带 `-g` 的构建只列出工具自带的头文件类型 |
| lldb | lldb-1703.0.236.21 | `image lookup -t` | 从 ELF 目标文件得到 `byte-size = 32` 及完整 `compiler_type` 文本 |
| gdb | 此处未安装 | `ptype /o` 打印“结构体字段的偏移和大小”，并标记空隙 | 仅依据文档 |
| pyelftools | 0.33，公有领域 | 面向 `.debug_info` 的 Python API | 一个 43 行脚本打印相同五个成员和 `unit version 5` |
| llvm-dwarfdump | Apple LLVM 17.0.0 | `--debug-info`、`--debug-abbrev`、`--debug-str-offsets` | 每个读取器测试的对照基准 |

Ghidra 带 DWARF'ın çıkışı aynı iki kural gösterdi.`tag`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `char *`, çünkü işlevi bir kısım ile karşılaştırır.`0x18`处的字段分配 `char **`Çünkü ...`label_length`解引用加载的值并比较字节──这是本课分析遍布采用的两条规则:从指令确定宽度,从解引用确定指针──Ghidra'nın反编译器文档说明,p-code'nin varnode不一定关联数据类型,反编译器通过传播最终分配正式数据类型──Infer constant pointers选项将同样传播扩展到常量──Ghidra 12.1 olarak反编译器加入位字段恢复,本课样本没有覆盖这种能力──

Hand工构建的表是另一半──Ghidra'nın Data Type Manager、IDA'nın Local Types、Binary Ninja'nın tip arşivi, yanı sıra rizin `td`, t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t

rea 6.5.0  Ghidra sağlayıcısı ile birlikte, kayıt geri dönüşü olarak yazılı olarak çevirilecektir. Ghidra'nın o bir satırdaki tüm içeriği aynı şekilde uygulanır, ancak kayıt sadece tip isimleri taşıyor, bu isimlerin kanıtlarını üretmiyor.`python3 code/main.py infer`Bu kanıtları elde edebilirim.

## 类型推断研究

Burada analiz, tip tahmin sisteminde oluşturulan bir kısımdır ve sadece bir yapısal yapısal yapı ile sınırlıdır.

- TIE(Lee、Avgerinos、Brumley,NDSS 2011) ikili sistemli IR'de üretimi ve çözümü talep etmesi, muhafazacılığı ve doğruluğu ölçmek ve 87 temel yapısal işlem üzerinde ticaret anti-kompilatörlerle karşılaştırmak için yeniden inşa edilmiştir.
- Retypd(Noonan、Loginov、Cok,PLDI 2016) 'da, ız tipi、多态和递归类型'ın artması,并报告指针`const`Özgürleşme oranı %98'dir.
- OSPREY(Zhang 等,IEEE S&P 2021) her bir内存 konumunu, tahmin olasılığı en yüksek tip olarak görecektir.
- DIRTY(Chen等,USENIX Security 2022) ve ReSym(Xie等,CCS 2024) kullanımı öğrenme modeli karşı karşılaştırma ile yapılan işlemleri,ReSym  rapor tam yapısal düzeni kesinlik oranı %72.9 olarak.
- RecStruct(Chen 等,USENIX Security 2026)

上结构体是本课分析遍首跳过的情况──在 `-O1`Aşağı,`main`- Ben de .`rows`İçinde kalmak, içinde kalmak`0x24(%rsp)`- Evet.`0x40(%rsp)`- Evet.`0x48(%rsp)`- Evet.`0x30(%rsp)`和 `0x38(%rsp)`◊ Bu 32 取模后分别是4、0、8、16、24: Aynı yapı, fakat başlangıç tohum olarak kullanılabilir hiçbir parametresi yoktur.

## 亲手构建

运行演示:

```bash
cd phases/13-tools-and-protocols/41-recovering-data-and-types
python3 code/main.py
```

输出, beş bölüm içeren bir JSON raporudur.`dwarf`保存 `-O0`目標文件の単元頭、構造体および関数;`oracles`保存 psABI 规则布局、`ctypes`布局、DWARF 布局、原生运行结果和 `agree`标志;`builds`保存三个目标文件各自访问、推断布局和比较结果;`cxx`保存解修饰名称、两张虚函数表、两类信息记录、虚调用和 DWARF 槽位;`tools`列出捕获的工具输出──

预期结构:

```json
{
  "dwarf": {"unit": {"unitLength": 489, "version": 5, "unitType": "DW_UT_compile", "addressSize": 8, "abbrevOffset": 0}, "...": "..."},
  "oracles": {"agree": true, "psabiRules": {"size": 32, "align": 8, "...": "..."}, "...": "..."},
  "builds": {
    "O0": {"layout": {"stride": 32, "size": 32, "gaps": [1, 2, 3, 10, 11, 12, 13, 14, 15], "...": "..."}, "comparison": {"matches": 5, "members": 5, "...": "..."}},
    "O1": {"...": "..."},
    "O2": {"...": "..."}
  },
  "cxx": {"virtualCalls": [{"slot": 2, "candidates": {"Shape": "__cxa_pure_virtual", "Rect": "_ZNK4Rect4areaEv"}, "...": "..."}], "...": "..."}
}
```

按以下顺序阅读 `code/main.py`- ...

1. `ElfObject`读取节、符号和重定位,`relocated()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `S + A`- Evet.
2. `parse_abbreviations()`和 `DwarfInfo._parse_unit()`读取头、缩写表和条目,然后通过两张表解析 `strx`和 `addrx`- Evet.
3. `DwarfInfo.struct_layouts()`和 `functions()`借助  Ödül`type_name()`- Evet.`type_size()`和 `type_kind()`,将条目转换为 `StructLayout`和 `FunctionInfo`Kayıt.
4. `parse_listing()`- Evet.`parse_memory()`和 `access_width()`读取 `llvm-objdump`- Evet.
5. `trace_function()`Bu bir çekim.`fold_unrolled()`和 `infer_layout()`Bu ziyaretiniz için bir düzenleme olacak.
6. `compare_layouts()`Doğum durumu,`sysv_layout()`和 `ctypes_layout()`İki tane daha var.
7. `Demangler`- Evet.`read_vtable()`- Evet.`read_typeinfo()`和 `find_virtual_calls()`负责 C++ 目标文件──

Dört emir daha var.`python3 code/main.py dwarf FILE.o`打印任意 DWARF 5 可重定位目标文件的结构体和函数──`python3 code/main.py infer LISTING.txt [FILE.o]`Çekilen çalışma analizleri için hedef dosyaları sunmak ise DWARF ile karşılaştırılmalıdır.`python3 code/main.py demangle NAME...`和 `python3 code/main.py vtable FILE.o`负责 C++ 部分──

## 实际使用

Kendine yeni hedef dosyaları oluşturmak için:

1. 捕获该目标文件的 `llvm-objdump -d -r`输出,并与目标文件一起保存──分析遍读此文──
2. Çekiltim ve yolculuk için`python3 code/main.py infer`❖ Öncelikle, bir işlev eksikliği varsa, işlevlerin işlevsel olarak ulaşmadığını veya analiz yoluyla takip edilmemiş olduğunu belirtir.
3. Bir ziyaret bir tanıklıktir. Sadece bir tanıklıktan bir bölüm kayıtlı olmalıdır.
4. 阅读步长证券──`call-site`Ya da`scale`条目是强证;没有其他类别支持的单条 条目是强证; 条目是强证; 条目是强证; 条目是强证; 条目是强证; 条目是强证; 条目是强证; 条条目是强证; 条条目是强证; 条条目是强证; 条目是强证; 条目是强证; 条目是强证; 条目是强证; 条目是强证; 条条目是强证; 条条目是强证; 条条目是强证; 条条目是强证; 条条目是强证; 条目是强证; 条条条条条是强证; 条条条条条是强证; 条条条条条是强证; 条条条条条是强证; 条条条条条是强证; 条条条条条是强证;`loop-step`Bu, çok güçlü bir kanıt, çünkü bir döngü raporunun çoklu elementlerin bir parçasıdır.`unrolled`,应手工检查折叠──
5. Eğer var`-g`Yapım, çalışım, karşılaştırma, okumak, her bir`match`Gitmiştim.`no-evidence`行指出没有函数触及的成员,`unexpected`行指出分析遍无法定位的访问──
6. Yapılandırmayı yapısal giriş araçlarının tip yöneticisi olarak kullanır ve hangi bölümlerin, isimlerin ve sınıfların tahminlere bağlı olduğunu kaydeder.

随时保留三个对照基准――如果规则、`ctypes`Üstelik, bu konuda bir çok farklı yöntemi oluşturan bir program var.

## 交互实验

### 实验 A:解码成员条目

- Evet .`code`Python'u aç:

```bash
cd phases/13-tools-and-protocols/41-recovering-data-and-types/code
python3 -q
```

运行:

```python
from main import *
elf = load_object("account-x86_64-O0-g.o")
dwarf = DwarfInfo(elf)
dwarf.header()
elf.section(".debug_info").data[0x1a3:0x1ac].hex(" ")
dwarf.dies[0x1a3].attributes
dwarf.type_name(dwarf.type_of(dwarf.dies[0x1a3]))
```

查看字典前, önce 13 on paper解码这九字节──随后读取未重定位的原始节 `elf.section(".debug_str_offsets").data[8:16].hex()`Ve yeniden yerleşim sonrası bölüm`elf.relocated(".debug_str_offsets")[8:16].hex()`,并解释差异──

### 实验 B: takip etmek bir işlevi

```python
listing = load_listing("account-x86_64-O0-g.objdump.txt")
trace = trace_function("label_length", listing["label_length"])
[(hex(a.address), a.root, a.offset, a.width, a.kind) for a in trace.accesses]
trace.pointer_uses
trace_function("sum_balances", listing["sum_balances"]).loops
```

运行前先写下,哪次访问证明偏移 24 是指针──然后对 `-O1`清单运行相同代码, ve `trace.increments`İçinde bulun`leaq 0x1(%rcx), %rcx`- Evet.

### 实验 C: çarpma ve boyutlandırma döngüsü

```python
o2 = load_listing("account-x86_64-O2-g.objdump.txt")
trace = trace_function("sum_balances", o2["sum_balances"])
sorted({a.offset for a in trace.accesses})
folded, evidence = fold_unrolled(trace, trace.accesses)
sorted({a.offset for a in folded}), [(e.kind, e.value, e.text) for e in evidence]
```

接着运行 `analyze_build("O2", fold=False)["comparison"]`, istatistik`unexpected`行数──                                                                                                                                                                                                                                                              `k * d`, ve `k`En az 2 kişilik bir ziyaret olduğunu onaylayın.`-O1`循环保持不变──

### 实验 D:虚函数表和名称

```python
shapes = load_object("shapes-x86_64-O0-g.o")
read_vtable(shapes, "_ZTV4Rect")
read_typeinfo(shapes, "_ZTI4Rect")
demangle("_ZNK4Rect4areaEv"), demangle("_Z8describeRK5Shapei")
find_virtual_calls(load_listing("shapes-x86_64-O0-g.objdump.txt"), [read_vtable(shapes, "_ZTV5Shape"), read_vtable(shapes, "_ZTV4Rect")])
```

Kağıt üzerinde.`callq *0x10(%rax)`計算槽位, sonra kullan `DwarfInfo(shapes).struct("Rect").virtual_methods`- Bildirmek istiyorum.`shapes-x86_64-O1-g.o`Bunu değiştirmeye çalışıyorum.`read_vtable`❖ Okuyucu`ElfError`Neden eksik olduğunu açıkla.

## 实践实验

 Geri dönüşüm`-O1`Aşağı`main`Orta 上 yapı 

要求:

- 扩展 `trace_function()`, 槽 bölgesini kök olarak kullanılabilir.`movaps`Seed için depolama, bu depolama `.data.rel.ro` doldur `0x0(%rsp)`- Evet .`0x5f(%rsp)`,即 `rows`96 字节初始化内容──
- Bu ziyaret`0x24(%rsp)`- Evet.`0x40(%rsp)`- Evet.`0x48(%rsp)`- Evet.`0x30(%rsp)`和 `0x38(%rsp)`归属该根,并报告其偏移对候选步长取模的结果──
- - Evet .`0x120`- Evet .`0x12c`Çemberde:`%r14`4'den başlayan,`0x20`递增直至 `0x64`Çeviri sınırlarını açıklar.`0x64`Bu üç element, bir bölümden bir kısmına eklenir.
- DWARF'ın tasarımına karşılaştırıldığında, beş uyumlulığa ulaştı ve hangi sınıfların henüz kanıtlanmadığını kaydetti.
- 添加一个测试,确保将根错归归参数时测试失败──

Başarılılık standartı:`-O1`清单运行 `python3 code/main.py infer`时,将 `main`列为具有根的见证函数,且仅凭`main`5 eşleşme göstermek için.

## 本课产物

本课包含 `outputs/skill-recovering-data-and-types.md` Çizim ve seçilebilir düzenleme yapılandırmaları kullanmak için: aşama aşama ile kanıtlı yapısal yapılandırma, belirtilen kaynakların uzunluğu, DWARF ile karşılaştırma ve hala bilinmeyen bilgi listesi için kullanılır.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/41-recovering-data-and-types
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

验证应证明:

- 单元头、14 个缩写和五个成员偏移与 `llvm-dwarfdump`Birliği
- 名称经由重定位后的 `.debug_str_offsets`Ürünler ve birimler`str_offsets_base`和 `addr_base`平均 8
- 六函数携带转储显示的地址范围、`DW_OP_reg6 RBP`和 `DW_OP_fbreg`位置,且其起始地址 listeddeki işlevin başlangıç noktasına eşittir
- 缺少 `.debug_info`Bu yüzden, bu bir şey değil.`0x78`-8 için
- `pyelftools`和 `lldb`Birişleme ve okuyucuya benzer bir düzeni
- psABI 规则、`ctypes`、DWARF 和原生运行均给出偏移 `0, 4, 8, 16, 24`和大小 32,重排后的结构体为 24 字节
- Çıkarıcılar`bump`中读取 13 条 命令,将 `R_X86_64_PLT32 bump-0x4`Ekle.`0x194`处的调用,并找到 `0x72`处的后向跳转
- İç bellek işletim sayısı, genişliği, sınıfı ve simgesi AT&T 文本及助记符解码
- `-O0`Aşağıda `bump`Çukura okumayı ve 3 kez ziyaretini yapmayı öğrendi.
- 步长在 `-O0`Aşağıdan geliyor`shlq $0x5`, `-O1`Aşağıdan geliyor`addq $0x20, %rdx`, `-O2`Aşağıdaki 256'den oluşan 8 yükleme
- `label_length`通過解引用证明偏移 24 是指针
- `main`- Evet .`-O0`Aşağıya doğru 0`0x20`和 `0x40`传递同一对象,在 `-O1`Sadece ayarlama`printf`
- Her yapı ise 5 üye ile uyumlu, büyüklüğü 32'dir, boşluklar DWARF ile uyumlu  dolduru
- Dönüştürülmezken,`-O2`Yapım raporunun yedi bölümü 32'den sonra yer almaktadır.
- 解修饰器复现全部 19 个 `llvm-cxxfilt`字符串
- 两张虚函数表、两类信息记录及 `0x16`处的虚调用均解析到槽 2,DWARF 也一致
- `-O1`C++ 目标文件调用模式保留, fakat虚函数表 yok
- Ghidra、rizin 和 radar2  Yakalama sonucu DWARF 时显示结构体,无 DWARF 时显示原始偏移
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

## Çevre üretim başarısızlık modeli

| 失效情况 | 能力不足的工具报告什么 | 分析必须证明什么 |
|---|---|---|
| 展开循环 | 八个间隔 32 字节的字段，以及一个 232 字节结构体 | 循环步幅 256 等于偏移差 32 的 8 倍，因此只有偏移 4 的一个字段 |
| 从单个增量读取步长 | 从 `addq $0x100` 得到 `sizeof` 为 256 | 所有步长来源的最大公约数，包括标量尾循环的 `addq $0x20` |
| 将 8 字节字段称为指针 | 偏移 24 处是 `void *` | 后续访问将加载的值作为基址，否则类别仍应为 `int64` |
| 将指针称为整数 | 偏移 24 处是 `long` | `0xfb` 处的解引用，应记录为指针证据 |
| 窄比较 | 带符号性的 `char` | `cmpb` 不携带符号性，只有 `movsbl` 或 `movzbl` 才携带 |
| 假定五个函数共享类型 | 没有别名证据却合并为一个结构体 | `main` 中传递同一栈帧对象的调用点，或分析人员的明确断言 |
| 按索引从 `.debug_str` 读字符串 | 从可重定位目标文件读出乱码名称 | `str_offsets_base` 加上重定位后的 `.debug_str_offsets` 条目 |
| 将地址直接作为数值读取 | 每个函数的 `low_pc` 都为 0 | 通过重定位后的 `.debug_addr` 表解析 `addrx` |
| DWARF 4 目标文件 | 读取器错误解析头部 | 检查第二个头字段中的版本；第 4 版没有 `unit_type` 字节 |
| 虚函数表缺失 | “这个类没有虚函数” | `-O1` 目标文件内联了全部调用；`-O0` 目标文件包含表及其重定位 |
| 从错误基址读取虚函数槽位 | 槽号偏差为二 | 地址点在符号之后 16 字节，位于到顶层对象的偏移和类型信息之后 |
| 修饰名称被剥离前缀 | `Z8describeRK5Shapei` 保持原样 | 在 macOS 使用 `--no-strip-underscore`，或使用检查 `_Z` 的解修饰器 |
| 根据单个工具的猜测定义结构体 | 将 `char *param_1` 当作字段类型 | 将宽度和解引用写为证据，并将名称标为猜测 |

## Operasyon kuralları

Başlangıçta, bu süreçte, her bir başlangıçın üzerinde bir dizi metin bulunmaktadır. Bu süreçte, her bir başlangıçın üzerinde bir dizi metin bulunmaktadır. Bu metinlerin birbiriyle birbiriyle karşılaştırıldığında, her bir başlangıçın üzerinde bir dizi metin bulunmaktadır.

## 延伸阅读

- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, section 3.1.2: Data Representation](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64), section 5.10: Composite Types](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst)
- [Writing ARM64 code for Apple platforms](https://developer.apple.com/documentation/xcode/writing-arm64-code-for-apple-platforms)
- [Intel 64 and IA-32 Architectures Software Developer's Manual, Volume 1, section 3.7.5: Specifying an Offset](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [DWARF Debugging Information Format Version 5, sections 2.1, 5.7.6, 7.5.1.1, 7.5.3, 7.5.6](https://dwarfstd.org/doc/DWARF5.pdf)
- [Itanium C++ ABI, sections 2.5 (Virtual Table Layout), 2.9 (Run-Time Type Information), 5.1 (External Names)](https://itanium-cxx-abi.github.io/cxx-abi/abi.html)
- [Microsoft Learn: Decorated names](https://learn.microsoft.com/en-us/cpp/build/reference/decorated-names?view=msvc-170)ve [Name Decoration](https://learn.microsoft.com/en-us/cpp/error-messages/tool-errors/name-decoration?view=msvc-170)
- [llvm-dwarfdump command guide](https://llvm.org/docs/CommandGuide/llvm-dwarfdump.html)ve [llvm-cxxfilt command guide](https://llvm.org/docs/CommandGuide/llvm-cxxfilt.html)
- [Python ctypes: Structure layout, sizeof, alignment](https://docs.python.org/3/library/ctypes.html)
- [Ghidra Data Type Manager](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Base/src/main/help/help/topics/DataTypeManagerPlugin/data_type_manager_description.htm)- Evet .[Decompiler Concepts](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/main/help/help/topics/DecompilePlugin/DecompilerConcepts.html)- Evet .[Decompiler Options](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/main/help/help/topics/DecompilePlugin/DecompilerOptions.html)ve[Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases/tag/Ghidra_12.1.4_build)
- [IDA 9.1 user guide: Types](https://docs.hex-rays.com/9.1/user-guide/types)- Evet .[IDA 9.4 release post](https://hex-rays.com/blog/ida-9.4-release-a-new-dyld-shared-cache-swift-analysis-new-teams-add-on-and-more-)ve[IDA Free](https://hex-rays.com/ida-free)
- [Binary Ninja user guide: Types](https://docs.binary.ninja/guide/types/)ve [Binary Ninja 6.0 Krypton](https://binary.ninja/2026/09/03/binary-ninja-6.0-krypton.html)
- [radare2 6.2.4 release](https://github.com/radareorg/radare2/releases/tag/6.2.4)ve [rizin v0.9.1 release](https://github.com/rizinorg/rizin/releases/tag/v0.9.1)
- [GDB manual: Examining the Symbol Table, ptype /o](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Symbols.html)
- [pyelftools on PyPI](https://pypi.org/project/pyelftools/)
- [Lee, Avgerinos, Brumley, "TIE: Principled Reverse Engineering of Types in Binary Programs" (NDSS 2011)](https://www.ndss-symposium.org/ndss2011/tie-principled-reverse-engineering-of-types-in-binary-programs/)
- [Noonan, Loginov, Cok, "Polymorphic Type Inference for Machine Code" (PLDI 2016)](https://arxiv.org/abs/1603.05495)ve [the retypd repository](https://github.com/GrammaTech/retypd)
- [Zhang et al., "OSPREY: Recovery of Variable and Data Structure via Probabilistic Analysis for Stripped Binary" (IEEE S&P 2021)](https://ieeexplore.ieee.org/document/9519451/)
- [Chen et al., "Augmenting Decompiler Output with Learned Variable Names and Types" (USENIX Security 2022)](https://www.usenix.org/conference/usenixsecurity22/presentation/chen-qibin)
- [Xie et al., "ReSym: Harnessing LLMs to Recover Variable and Data Structure Symbols from Stripped Binaries" (CCS 2024)](https://dl.acm.org/doi/10.1145/3658644.3670340)
- [Chen et al., "RecStruct" (USENIX Security 2026)](https://www.usenix.org/conference/usenixsecurity26/presentation/chen-yuxin)
