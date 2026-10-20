# 重建并证明等价:差分测试、字节比较与证据闭环

> Testler bu testlerin sonuçlarının aynı olduğunu kanıtlayabilir; eşitlik için her sınırın giriş ağını kaplamalı ve yeniden konumlandırma önleminden sonra da uyumlu olan bir kısım olmalıdır.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 34（提升为伪代码）、Phase 13 · 35（证据、置信度与未知项）
**Time:** ~110 分钟

## Öğrenme hedefi

- Bu, bir yönetim kurulu olarak yeniden inşa edilmesi için yapılan bir düzenlemedir.
- Giriş Netki oluşturmak için: sıfır değer koruma, negatif sayı, sıfır kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim kesim
- Aynı programda çalıştırılan orijinal işlevi ve yeniden yapılandırma işlevi, her giriş birimini, tuzağı da dahil olmak üzere kaydetir.
- kullanın orijinal yapılandırma parametri yeniden yapılandırma,屏蔽重定位字段后比较函数节──
- 读取并比较重定位指向的常量,误字面量蒙混通过的防止
- Küçük stüdyo 客户端驱动的MCP 服务器,并为每一步记录证标识符──
- Bu, bir diğer delil olarak, bir delil olarak belirtilmiştir.

## 问题

Sen de sana bir şey dileyeceksin.`ledger-x86_64-O1.o`İçeride`percent_change`Bu nedenle, bu programın bir parçası olarak, bir diğerinden daha fazla bilgi almak için, bir diğerinden daha fazla bilgi edinmek için, bir başka yöntemle, bir başka bir şekilde, daha fazla bilgi edinmek için, bir başka yöntemle, daha fazla bilgi edinmek için, daha fazla bilgi edinmek için, daha fazla bilgi edinmek için, daha fazla bilgi edinmek için, daha fazla bilgi edinmek için, daha fazla bilgi edinmek için, daha fazla bilgi edinmek için, daha fazla bilgi edinmek için, daha fazla bilgi edinmek için

```c
int percent_change(int before, int after) {
    if (before == 0) return 0;
    return (int)(((long)after - before) * 100 / before);
}
```

Dört test geçiyor:`(100, 150)`- 50'e ulaştım.`(200, 100)`-50'e ulaştım.`(0, 5)`0'u al.`(50, 100)`100 tane alıyorum.`grade`90'ın, 80'in, 70'in, 60'ın dörtüne dayanarak yeniden inşa ediliyor.`if`语句, altı test de geçti.

Ancak bu rapor aşağıdaki soruların hiçbirine cevap vermedi:

- - Evet .`(after - before) * 100`32 bit göstermek için kullanılamıyorsa, orijinal işlevi geri döndürür ne?
- %s 110'a dönerken, orijinal fonksiyon neyi geri döndürür?
- 重建实现能否编译成 原始函数相同的16字节?
- İki komple fonksiyonun bir arada bir olarak, onların yeniden konumlandırılması aynı normal değere mi yönlendiriyor?
- Tekrar Yapım Hangi Kanıt Kayıtından Geldi?
- Ev sahibi ne durumda?

Bu dersin her bir amacı kendiliğinden yazılmış ve düzenlenmiş bir prosedürdür.

```figure
re-36-prove-equal
```

## Kanıtlar ne olduğunu gösteriyor.

`code/main.py`Orta akıllı vücut döngüsü stüdyo tarafından 6.5.0 rea için altı kez düzenlenmiş, çalışma kaydı yer almaktadır.`code/fixtures/runs/agent-run.json`❖ servisçiye karşı`initialize`Çözümleşme içerir.`2025-11-25`❖ Üç kez tekrar kullanıldı kanıt kayıtları:

| 步骤 | 工具 | 耗时 | 证据标识符 |
|---|---|---|---|
| 2 | `analyze_function percent_change` | 6.31 秒 | `ev_e88b10dc0c6400e51bb6f7fdc3eaea8d2c97cc02463f0db3e6afeefc273197cd` |
| 3 | `analyze_function grade` | 0.02 秒 | `ev_67b6d3f992eaf49a2e16de084b6ebfdd9884e8c5c7f75e175b7bb20f4f748ce1` |
| 4 | `read_bytes 0x1000b4, 20` | 0.00 秒 | `ev_c26146cfedf4c1ee146d8ff00cfa9a5d3f5335bdd9c97ccf4e1af5f6ea3ed6bc` |

İlk kez Ghidra'nın giriş ve otomatik analiz satışını gerçekleştirdi.`confidence: "observed"`- Evet.`authority: "shipped-artifact"`, ve hedef dosya SHA-256:`9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f`❖ Ghidra 加载可重定位目标文件时,将 `.text`- Evet .`0x100000`Bu yüzden `percent_change`位于 `0x100000`- Evet .`grade`位于 `0x100010`- Evet.

`long`- Evet .`percent_change`Bu sahte kod:

```c
undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)
{
  long lVar1;
  undefined1 auVar3 [16];
  if (param_1 != 0) {
    lVar1 = (long)((param_2 - param_1) * 100);
    auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
    auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
    return auVar3;
  }
  ...
}
```

Çözümcüğü`cltd`和 `idivl`Aynı zamanda yazıyorum.`edx`ile`eax`,64 bit ayrıştırma yasasının 16 字节 geri dönüş değerini kullanmak için oluşturulmuştur. Aynı kayıtta bulunan talimat listesi daha net:

```
0x100000: TEST EDI, EDI
0x100002: JZ 0x0010000d
0x100004: SUB ESI, EDI
0x100006: IMUL EAX, ESI, 0x64
0x100009: CDQ
0x10000a: IDIV EDI
0x10000c: RET
0x10000d: XOR EAX, EAX
0x10000f: RET
```

Her operasyon 32 bit genişliktedir.`IMUL EAX, ESI, 0x64`32'yi gerçekleştirmek, sadece aşağı kısımını korumak.`CDQ`- Ben de .`eax`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `edx`- Evet .`IDIV EDI`则用32位除数去除这个64位寄存器对──按命令清单重建,应使用 `int`类型 `100 * (after - before) / before`- Evet.

`grade`Bu da bir kayıt.`*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)`, ve bir tane ver .`0x66666667`构成、难读的默认表达式──命令清单使用 `IMUL RAX, RAX, 0x66666667`- Evet.`SAR RCX, 0x22`- Evet.`SHR RAX, 0x3f`- Evet.`ADD ECX, EAX`实现除以 10 〜`ADD ECX, -0x6`- Evet.`CMP ECX, 0x4`和 `JA`Bulma 10                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `XOR EAX, EAX`给出默认值 0`LEA RCX, [0x1000b4]`和 `MOV EAX, dword ptr [RCX + RAX*0x4]`读取包含五个 4 字节条目的表――

4 adım 读出了这20字节:`01000000 02000000 03000000 04000000 04000000`◊表的内容为 `1, 2, 3, 4, 4`,对应十位商 6、7、8、9、10── işte bu`ledger.c`Orta `switch`, içinden `case 10`和 `case 9`共用值 4。

Gerçek  kendiliğinden kanıt sayfasındaki iki kanıt da emirlerin açıklaması ve düzenli olarak uygulanması ile ilgilidir.`read_bytes`Başlangıç: DX-Ball orijinal sahte kod hiçbir giriş yok`FUN_00406400(void)`, instruction video rectified it. Önce oku, önce kaydı belirtir, sonra tekrar yaz C.

## 编写候选实现

`code/fixtures/candidates/`Kayıt sekiz yeniden yapılandırma gerçekleştirilmesini içerir, her dosya bir işlevi içerir. Bunlardan dördü talimat listeye uyarak veya aynı kod olarak düzenlenebilir. Diğer dördü de mantıklı gibi görünen ama hataları bir el yazma testi tarafından bulunur.

| 文件 | 源码 | 作用 |
|---|---|---|
| `percent_change_mul_first.c` | `100 * (after - before) / before` | 指令清单的 C 表达 |
| `percent_change_split.c` | `(after * 100 - before * 100) / before` | 文本不同，clang 折叠后字节相同 |
| `percent_change_wide.c` | `(int)(((long)after - before) * 100 / before)` | 沿用伪代码的 `long`，先除法再截回 |
| `percent_change_div_first.c` | `(after - before) / before * 100` | 先做除法，因此舍入不同 |
| `grade_switch.c` | 带五个分支的 `switch (score / 10)` | 原始源码 |
| `grade_table.c` | `unsigned slot = score / 10 - 6; slot < 5 ? points[slot] : 0` | 指令清单的 C 表达 |
| `grade_thresholds.c` | `if (score >= 90) return 4; ...` | 最高分段没有上界 |
| `grade_case10_wrong.c` | `case 10: return 3;` | 一个表条目错误 |

Her dosya bir emirle yazılı.`clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c`编译――编译后的目标文件与源码一起提交,以便没有克朗的宿主机也能运行测试――

## İlk Test Yolları: İcra Etmek

McKeeman, 1998'de bir farklılık testi tanımlamasında, iki veya daha fazla karşılaştırılabilir sistemin girişini ve farklı sonuçların çıkmasını ve çökmesini eksik bir aday olarak görmeyi talep etti.

### 设计输入网格

`code/main.py`Orta `input_grid()`92 adet birim inşa et.`percent_change`- On tane aldı .`before`值和七个 `after`值所有配对:

```
before: 0, 1, -1, 3, -3, 7, 100, -100, 2147483647, -2147483648
after:  0, 5, -5, 105, 536870911, 2147483647, -2147483648
```

- Evet .`grade`, 22 sayı alır: her bölge sınırın iki tarafı ≠ 0 ≠ 110, ve iki `int`极值──`classify()`Bu, birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birim için birimim için birim için birim için birim için birim için birim için birimimim için birim için birim için bir

Her sınıfın belirgin bir amacı vardır.`TEST EDI, EDI`分支──負数単位检查向零截断的除法:C 和 `idiv`"Yoktan"`-9 / 10`0 için.`-10 / 10`Bu yüzden, 1 ⁄ 2 ⁄ 3 ⁄ 3 ⁄ 3 ⁄ 3 ⁄ 3 ⁄ 3 ⁄ 3 ⁄ 3 ⁄ 3 ⁄ 4 ⁄ 3 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4  ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4 ⁄ 4         ⁄ 4    ⁄ 4                                                                                                                                                                          `(105 - 100) * 100 / 100`5 değil 0 溢出单元使`(after - before) * 100`超出32位──唯一陷单元让回绕后的乘积等于 `INT_MIN`Aynı zamanda`before`- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

Yang、Chen、Eide 和 Regehr, Csmith'i, tanımlanmamış davranışların sonuçlarını oluşturmak için oluşturdu. Bu nedenle tanımlanmamış davranışların sonuçları için ayrılıqlar sadece gürültüdür, hata raporları oluşturmamalıdır. C'nin içindeki belirtilmiş bir işlemlerin sonucu tanımlanmamış davranışlara aittir.

###  Dürerler ve Tuzaklar

`code/driver.c`Stikinden Her satır bir birim, çıkış, giriş, başlangıç ve yeniden inşa sonuçları olarak okunuyor.`build_harness()`Kullan .`-Dpercent_change=cand_percent_change -Dgrade=cand_grade`编译候选实现, iki sürümün aynı uygulamaya farklı isimlerle bağlanabilmesini sağlar. x86-64 Linux host机ında, orijinal gerçekleşme ise 具目标文件本身; diğer host机larda ise 原生编译的.`ledger.c`, rapor edeceğim kayıtları`original_kind: fixture-source`- Evet.

驱动程序使用 `sigsetjmp`和 `siglongjmp`- Yapımcılık`SIGFPE`İşleme makinesi.`before = -1`- Evet.`after = 536870911`时,差为 536870912,32 位乘积回绕到 -2147483648──在 x86-64 上,`idiv`Bu işlemci, 32 bit kullanamadığı için, bir hata oluştu.`trap`- Evet.

AArch64 上的 `sdiv`Bu sonuçlar, aynı işletim sayısını tekrar tekrar elde ederek -2147483648- üzerinde yapılan çalışmayı doğru bir şekilde kaydetmişizdir.

### Sonuç

`prove_behaviour(PLAUSIBLE)`构建使用 `long`Bu süreçte, yeni bir yapı oluşturmak için yapılan yeni yapılandırma ve değerlere dayalı yeniden yapılandırma çalışmaları geçmiştir.

| 函数 | 输入 | 类别 | 原始结果 | 重建结果 |
|---|---|---|---|---|
| `percent_change` | 3, 2147483647 | 溢出 | -133 | -1431655899 |
| `percent_change` | 100, 2147483647 | 溢出 | -101 | 2147483547 |
| `percent_change` | 2147483647, 5 | 溢出 | 0 | -99 |
| `grade` | 110 | 超出 switch 范围 | 0 | 4 |
| `grade` | 2147483647 | 超出 switch 范围 | 0 | 4 |

`percent_change`26 defa başarısızlık oldu.`|before| > 1`Ürünlerin ötesinde.`before`1 veya -1'de, 64 bit ticaret kesimi, aslında bir dönüm değeriyle eşittir, bu nedenle bu birimler sadece tesadüf olarak eşittir.`grade`Başarısızlık, çünkü ilk değişim 没有十位商为 11 及以上的分支,而`110 / 10`11'i.

`prove_behaviour(EQUAL)`Yapımcılık`percent_change_mul_first.c`和 `grade_switch.c`, tüm 92 个单元一致──`percent_change_div_first.c`Bu, el yazma testi gerçekten de fark edebilecek bir hatadır.

`oracle_disagreements()`Başka bir şey kontrol edelim.`percent_change_model()`和 `grade_model()`模型,使用  Python`wrap32()`Çıktı 32 位乘法, kullanım `idiv32()`Yapısal kuralları ifade etmek. Rapor her birimdeki modellerin gerçek gözlemlenen orijinal sonuçlarla karşılaştırılması.

## İkinci Test Yolları: yeniden düzenlenme ve karşılaştırma

网格上的行为 is a verification pathway。第二条 Pathway考察: Using the same compiler and parameters compiler rebuild implementation, whether to produce the same character, DX-Ball 项目报告其辅助函数63 字节匹配,TH04 项目报告 2,139 字节匹配,两者都使用各自年代的编译器──rea 自身无法完成该工作;它的`compare_functions`Sunucu metni birbiriyle karşılaştırmak için sınırlamalar: 汇编是不透明的提供方文;无法进行重定位规范化

### 读取目标文件

`code/main.py`Orta `ElfObject`Kullan .`struct.unpack_from`读取一个ELF64可重定位目标文件――它检查魔数、64位类别、小端数据、`e_machine`62 和 `e_type`1, sonra da geçiyor.`.symtab`及 her biri`.rela`- Evet.`percent_change`- Evet .`.text`偏移 0 开始, büyük 16`grade`- Evet .`0x10`Başlayın, büyük 46;`total`- Evet .`0x40`Başlayın, büyük 31'ü.`grade_label`- Evet .`0x60`Başlayın, büyük 63...

`percent_change`16 字节为`85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3`, hiç yeniden konumlandırılmamıştı.`grade`有一条: Fonktion内偏移 `0x26`, tipi`R_X86_64_PC32`, 符号`.rodata`, ekle`0x10`❖ Bu bir hareket.`0x23`处的 7 字节 `leaq`Son dört bölüm ise bir bölümdür.

### Önceki yazı, yeniden karşılaştır

RELA  hedef dosyalarında, yeniden konumlandırma kayıtlarında, dört bölümlük bölümlerin ortalama sayısı sıfırdır.`grade_switch.o`Bu nedenle, iki yeniden konum farklı konumlara doğru yönlendirilse de, doğrudan bir kısım karşılaştırma hala geçer.`mask_relocations()`仍将两侧字段清零, böylece aynı yöntem aynı bölümde REL 目标文件和 Mach-O ⋅ olarak yerleştirilen rakamları artırmak için de uygulanabilir.

Sonra ...`prove_bytes()`偏移、类型和目标节比较重定位记录──原始记录为 `.rodata+0x10`,候选为`.rodata-0x4`◊Kendi sayı farklılıkları, aday hedef dosyasının değişimi nedeniyle oluşmaktadır.`labels.rel`表──不同加数 farklı yönlü bir değişim anlamına gelir, fonksiyon farklı anlamına gelmez──

### 读取重定位指向的常量

对于位于命令末尾的PC相对字段,CPU加上是下一条命令地址,因此目标为符号加数加4──原始文件中是 `.rodata+0x14`,候选中是`.rodata+0x0`- Evet.`read_table()`Buradan okuduğumuz beş dört kelime var.`1, 2, 3, 4, 4`- Evet.

Numar 5'den gelen emirler:`CMP ECX, 0x4`配合 `JA`允许索引 0 至 4,而 `[RCX + RAX*0x4]`Her bir referans için 4 bölüm okunur.`code/main.py`Orta `CLAIMS`Kayıtlı .`grade`Bu yapı da kaydedildi.`percent_change`没有重定位──

Bu adım TH08  projesi tarafından kaydedilen bir eksiklikten kaynaklanıyor. Eski karşılaştırma yöntemi, hedef adresini talimatın yeniden konumlandırma bölümüne doldurmak, tekrar talimat harflerini karşılaştırmak, ancak bu adresin bulunduğu浮点字面量数据ı kontrol etmemek için kullanılıyor.`0.0`Hedeflerle birlikte görünmek.`128.0`Tamamen uyumlu. Düzeltme sırasında 1,548 tane yazı biçimi alıntı yapıldı ve 12 bölüm düzeltildi.`grade_case10_wrong.c`Bu ders oluşturma aynı sınıf hataları: onun 46 字节 kodu orijinal uyumlu, yeniden konumlandırma kayıt yapısı aynı, ama göstermek için `1, 2, 3, 4, 3`Sadece düzenli kontroller başarısızlığa yol açabilir.

### Sonuç

| 候选 | 大小 | 屏蔽后的字节 | 重定位记录 | 表 | 状态 |
|---|---|---|---|---|---|
| `percent_change_mul_first` | 16 对 16 | 相同 | 无 | 无 | pass |
| `percent_change_split` | 16 对 16 | 相同 | 无 | 无 | pass |
| `percent_change_wide` | 16 对 26 | 大小不同 | 无 | 无 | fail |
| `percent_change_div_first` | 16 对 18 | 大小不同 | 无 | 无 | fail |
| `grade_switch` | 46 对 46 | 相同 | 结构相同 | 两者均为 `1,2,3,4,4` | pass |
| `grade_table` | 46 对 46 | 相同 | 结构相同 | 两者均为 `1,2,3,4,4` | pass |
| `grade_thresholds` | 46 对 39 | 大小不同 | 1 对 0 | 无 | fail |
| `grade_case10_wrong` | 46 对 46 | 相同 | 结构相同 | `1,2,3,4,4` 对 `1,2,3,4,3` | fail |

İki sonuç var. Tekrar bakmaya değer.`percent_change_split.c`源码文本不同,字节却完全相同,因为 clang will have symbol overflowing for undefined behavior,把 `after * 100 - before * 100`Bir kez çarpmak için çarpın.`grade_table.c`Ayrıca, bir dizi dizini ve bir dizi dizini ile birleştirilmiştir.`switch` get the same table──字节匹配证明: bu yazıcı bu parametreleri kullanır, 候補实现 编译成相同代码; 候補就是原始源码文本.

Büyük bir miktar teşhis bilgileri, kabul edilebilir koşullar değil. Bölge'nin kanıt sayfası bir 1.825 字节 aday kaydetti.`wide`26 yazı var, çünkü.`movslq`- Evet.`imulq`- Evet.`cqto`和 `idivq`32 bit biçimi değiştirdi. Hiçbir türden bir düzenleme olmadan önce, talimatların açıklaması bize genişliği göstermişti.

## 通过 rea 运行智能体循环

65 MCP aracı var. CLI'nin emirlerine karşı gelmiyorlar.`verify_reconstruction`İşte bunlardan biri.`code/main.py`Orta `McpStdioClient`Bu en küçük müşteriye göre kullanılabilir.`npx -y rea-agents@6.5.0 mcp`, stdin için her satır bir JSON-RPC yazma isteği ve şablon içinde stdout her satır bir JSON nesne okumak için.`2025-11-25`Gönderme`initialize`, tekrar发 `notifications/initialized`Son olarak .`tools/call`❖ Her çağrı için öntanımlı kesinti süresi 330 saniye, gerçek ısalı soğuk başlatma süresi ile aynıdır.

`agent_loop()`发发发六次调用并记录每次:

```json
{
  "step": 2,
  "tool": "analyze_function",
  "arguments": {"procedure": "percent_change"},
  "seconds": 6.31,
  "is_error": false,
  "evidence_id": "ev_e88b10dc0c6400e51bb6f7fdc3eaea8d2c97cc02463f0db3e6afeefc273197cd",
  "confidence": "observed",
  "authority": "shipped-artifact",
  "limitations": ["Resolved reference metadata identifies computed, indirect, external, call, jump, and data edges; unresolved targetless flows remain unknown, and function classifications distinguish thunks and externals.", "..."],
  "result_sha256": "..."
}
```

完整证据 记录按标识符保存在在同一文件中;; yeniden inşa edilmesi için yapılan kâmil kod ve talimatların bir parçasıdır.`table_address()`- Evet .`grade`清单中找到 `LEA`Operasyon sayısı, 并将其传给 `read_bytes`- Evet.`open_binary`- Evet.`get_evidence_bundle`和 `close_binary`Not return Evidence 记录, therefore its record in identifier is null──

Yoldayken`npx`, ve `GHIDRA_INSTALL_DIR`Bir dizinle,`run_agent(live=True)`Bu nedenle, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir sürececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececece`code/tests/fake_rea_server.py`- Evet, evet.`tools/call` Aynı araç ve parametrelerin karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı

### Gerçek bir test cihazı ne söyleyebilir, ne söyleyemez.

gerçek `verify_reconstruction`接收指向比较 Kanıtların ifadesi,并为每项返回pass、fail或未知──其固定限制为:Pass`compare_functions`返回的提供方文本; davranışlar `compare_process_captures`返回の2つの已記錄されたプロセス捕獲──若源記録の调用覆盖不完整,调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用に関する断言は, 调用による, 调用による, 调用による, 调用による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, による, `unknown`◊ area 内部 任何部分会编译重建函数,或在您的输入网格上运行它──本课的两条验证路径,就是真正留给您的工作──

Gerçeklik yükümlülükleri hesaplama beklentisi kayıt içerir`predicate_type: "rea.reconstruction-proof"`- Evet.`operation: "verify_reconstruction_obligations"`- Evet.`confidence: "observed"`, ve `normalized_result.passed === true`Bu kayıtlar ortaya çıkmayacak.`code/main.py`Orta `build_proof()`Bu bir şey.

```json
{
  "predicate_type": "rea.reconstruction-proof",
  "operation": "verify_reconstruction_obligations",
  "confidence": "observed",
  "authority": "controlled-replay",
  "normalized_result": {
    "passed": true,
    "status": "pass",
    "claims": [
      {"claim_id": "percent_change.behaviour", "kind": "behavioral", "status": "pass", "evidence_ids": ["ev_e88b10dc..."]},
      {"claim_id": "grade.behaviour", "kind": "behavioral", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]},
      {"claim_id": "percent_change.bytes", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_e88b10dc..."]},
      {"claim_id": "grade.bytes", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]},
      {"claim_id": "grade.referenced-constants", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]}
    ]
  },
  "evidence_links": ["ev_e88b10dc...", "ev_67b6d3f9..."],
  "evidence_id": "ev_..."
}
```

标识符为 `ev_`Ek kayıt, SHA-256'dan sonra bir tanımlayıcıyı kaldırmak için, JSON biçimindeki bir anahtar sıralaması kullanın.`aggregate()`保守失败 prensibini kullanmak:`fail`Öncelikle, sonra`unknown`,空断言                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `unknown`❖ Host host机没有 C 编译器时,两项行为断言都是 ⇒`unknown`Bu yüzden iki bölüm bile geçse de, tüm kayıt hala devam ediyor.`unknown`- Evet.`authority`Çı`controlled-replay`Çünkü kanıtlar kendi test sürücüleriyle değil, sadece hedef dosyalarla geliyor.

## Araştırma sonuçları neyi açıklıyor ?

Liu、Raff ve Micinski 2026 yılında sekiz anti-kompiliasyon sisteminin dokuz farklı yapılandırmasını ölçtüler. Tüm test adaylarının temel noktası geçerek, bulanık test girişlerinde hala orijinal sonuçlardan uzaklaşacaklar. Genel oranı %4.9'dur, bir sistemin %13'e kadar. GitHub'un 300 kutu fonksiyonu ve 287 CVE ile bağlantılı fonksiyonlarında en güçlü geliştirilmiş model, Ghidra'nın inşaat başarısı oranını %75'ten %90'a yükseltecek, ancak aynı grup fonksiyonlarının davranış uyum oranı %74'e düşecek.

本课的 `percent_change_wide.c`Bu tür bir yapım biçiminde:`long`Bu nedenle, bu değerlerin yeniden oluşturulması ve yeniden oluşturulması için yapılan çalışmalar, yeniden yapılandırılması ve yeniden yapılandırılması için yapılan çalışmalar ile sonuçlanmıştır.

DecompileBench, 130 gerçek programdan 23.400 işlevi ölçtü ve LLM yönteminin işlevsel doğruluğunu endüstri sınıfı anti-kompilatörlerden %52,2 daha düşük, ancak anlaşılabilir puan daha yüksek olduğunu buldu.

Bu alanda kullanılan üç kanıt yöntemi, yapılandırılabilecek üç verifiye yolu vardır. Phenix ve DREAM yeniden yapılandırılır çıkış ve çalıştırılır orijinal programın testleri. McKiman ve Csmith üretilen girişleri orijinal programla karşılaştırarak, aynı zamanda girişleri tanımlanmış davranışlar çerçevesinde sınırlayacaktır. Ramos ve Engler, verilen girişlerin büyüklüğünde tüm keşif yollarında eşit değerleri kanıtlayan iki C  fonksiyonunu kullanır. Bu ders, iki türden oluşur; girdi küçüklüğüne ulaştığında, üçüncü tür 35 .

## Kendini oluştur

运行仅使用标准库的测试框架:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal
python3 code/main.py
```

PATH 上有 clang 时,演示会编译两对候选实现,并为每对运行92个单元;随后重新编译八个候选、重放智能体运行,并生成证明记录──没有 clang 时,读取已提交的目标文件,并将行为断言报告为`unknown`- Evet.

Armada 64 Mac 上预期输出结构如下:

```json
{
  "host": "aarch64 Darwin",
  "originalKind": "fixture-source",
  "gridCells": 92,
  "plausible": {"naivePassed": true, "gridMismatches": 28, "oracleDisagreements": 0},
  "equal": {"naivePassed": true, "gridMismatches": 0, "oracleDisagreements": 0},
  "legTwo": {
    "percent_change_mul_first": {"status": "pass", "reasons": []},
    "percent_change_wide": {"status": "fail", "reasons": ["size 16 vs 26 bytes"]},
    "grade_case10_wrong": {"status": "fail", "reasons": ["referenced constants differ: [1, 2, 3, 4, 4] vs [1, 2, 3, 4, 3]"]}
  },
  "agentRun": {"mode": "replayed fixture", "server": {"name": "rea", "version": "6.5.0", "protocolVersion": "2025-11-25"}},
  "proof": {"status": "pass", "evidence_id": "ev_..."}
}
```

按以下顺序阅读 `code/main.py`- ...

1. `wrap32()`- Evet.`c_div()`- Evet.`idiv32()`İki tane`*_model()`函数实现命令清单的整数语义──
2. `input_grid()`和 `classify()`构建并标记 92 个单元──
3. `build_harness()`和 `execute()`Başlangıçta gerçekleştirilen, yeniden adlandırılan adayların gerçekleştirilmesi ve`driver.c`Bir program olarak tercüme ederiz ve sonra her birimden birim yapalım.
4. `prove_behaviour()`返回第一条 验证路径報告, eşleşmeyen yollar ve model ayrılığı dahil olmak üzere
5. `ElfObject`读取文件头、符号和 `.rela`Kayıt;`mask_relocations()`和 `read_table()`- Hazırlıklı olmak için.
6. `prove_bytes()`返回第二条 檢驗路径報告,大小、屏蔽範圍、重定位結構和表──
7. `McpStdioClient`和 `agent_loop()`驱动 rea 并记录每一步──
8. `build_proof()`和 `aggregate()`Doğuştan konservatör başarısızlık prensibi kayıtlarını kullanıyor.

## Kullan

Yeni bir fonksiyon göstermek için, aşağıdaki adımları tekrarlayın:

1. 获取该函数的 `analyze_function`结果并记录证据标识符──先读指令清单,再读伪代码──
2. 按清单中操作的位宽编写候选实现──保留原始函数名──
3. Listede bulunan her kez, ekleme, ekleme, her işlemin yerindeki genişlik ve çevrelenen ağ girişlerini sağlayabilir.
4. Listeye her bir karşılaştırma düzenli miktarı ekle.`grade`, bunlar 6 ve 4'ün artı kısımları.
5.                                                                                                                                                                                                                                                               
6. 运行两条验证路径,先看原因,再看状态──
7. Bu, bir seçim yapmanın bir parçası olduğunu kanıtlayacak.`evidence_links`告诉读者断言根据哪些记录──

Her bir düzenleyici yenilenmesinden sonra yeniden çalıştırılır.

## 交互实验

### 实验 A:模型与运行

- Evet .`code`Python'u aç:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal/code
python3 -q
```

运行:

```python
from main import *
percent_change_model(3, INT_MAX)
percent_change_model(-1, 536870911, "x86_64")
percent_change_model(-1, 536870911, "aarch64")
report = prove_behaviour(PLAUSIBLE)
report.naive_passed, len(report.mismatches), report.mismatches[0]
```

İlk kez -133'e dönüşümlü bir çarpı çıkarmak için 3'e dönüşümlü bir çarpı çıkarmak için ikinci kez -133'e dönüşümlü bir çarpı çıkarmak için 3'e dönüşümlü bir çarpı çıkarmak için 1'e dönüşümlü bir çarpı çıkarmak için 1'e dönüşümlü bir çarpı çıkarmak için 1'e dönüşümlü bir çarpı çıkarmak için 1'e dönüşümlü bir çarpı çıkarmak için 1'e dönüşümlü bir çarpı çıkarmak için 1'e dönüşümlü bir çarpı çıkarmak için 1'e dönüşümlü bir çarpı kullanmak için 1'e dönüşümlü bir çarpı kullanmak için 1'e dönüşümlü bir çarpı kullanmak için 1'e dönüşümlü bir çarpı kullanmak için 1'e dönüşümlü bir çarpı kullanmak için 1'e dönüşümlü bir çarpı kullanmak için 1'e dönüşümlü bir çarpı kullanmak için 1'e dönüşümlü bir çarpı kullanmak için 1'`'trap'`, üçüncü kez elde -2147483648♦ rapor gösterir 10 basit örnekler geçiyor,28 网格单元失败──将`report.oracle_disagreements`Görelim.

### 实验 B:读取目标文件

```python
obj = ElfObject(ORIGINAL_OBJECT)
grade = obj.function("grade")
grade.size, grade.data[0x26:0x2a].hex(), grade.relocations
read_table(obj, grade.relocations[0], 5, 4)
```

字段字节为 `00000000`重定位引用`.rodata`, fazla sayı için `0x10`,表内容为 `[1, 2, 3, 4, 4]`- Evet.

### 实验 C:破坏一个常量

```python
report = prove_bytes("grade", CANDIDATES / "grade_case10_wrong.o")
report.masked_equal, report.relocations_match, report.tables_equal, report.reasons()
```

字节匹配、记录匹配,但表不匹配──现在编辑 `grade_case10_wrong.c`,让 `case 10`重新返回 4, 具命令重新编译,观察状态变为 `pass`- Evet.

### 实验 D: motor rea

6.5.0 ve Ghidra 12.1.4 后:

```bash
GHIDRA_INSTALL_DIR=/opt/homebrew/Cellar/ghidra/12.1.4/libexec \
JAVA_HOME=/opt/homebrew/opt/openjdk@21 \
python3 code/main.py --live
```

İlk kez.`analyze_function`Ghidra hedef dosya içeriyor. Yeni bir kanıt tanımlayıcıyı gönderilen çalışma ile karşılaştırır. Aynı analiz konfigürasyonu altında aynı yazı tipi aynı tanımlayıcıyı alır. Çünkü tanımlayıcı dosya yolunun içeriğini çıkarır.

## 实践实验

İki verification yolu aynı hedef dosyasına yayılır.`total`和 `grade_label`- Evet.

要求:

- - Evet .`total`, giriş için birim ve sayı¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- - Evet .`grade_label`,函数内联调用 `grade`,并读取 `labels.rel`Bu, beş farklı karakterden oluşan bir tablo.`.rela.rodata`Aralarında kendi konumları vardır.
- Çı`grade_label`添加一条   Ekle`CLAIMS`, iki yeniden konumlandırma ve beş 4 字节条目的表,并比较条向的字符串──
- Eğer model ve çalışma belirli birimlerde uyumsuzsa, bu birimleri kaydet ve talimat listesi uyarınca açıklayın.
- Bu nedenle, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiyeci, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir verifiye, bir, bir verifiye, bir verifiye, bir, bir, bir verifiye, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir

Başarılı Standart: kanıt kayıtları dört işlevi listeler, her bir ifade ile birlikte kanıt tanımlayıcı, ve bir etiket çizgi farklı zaman `grade_label`- Başaramayacağım.

## 输出技能

本课产 出 `outputs/skill-rebuild-and-prove-equal.md` Bu beceri, işlev kanıtları ve aday yeniden oluşturmalarını iki yollu kanıt ve kanıt kayıtlarına dönüştürür. Bu beceri öncelikle düzlem, tekrar okuma, sahte kodları, her tür riskleri kapsayacak bir giriş, yeniden konumlandırmayı ve kontrol düzenini korumak, ayrıca koruma başarısızlığı ilkesini benimsemek gerektirir.

## 验证

运行演示和测试套件:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

35 项测试证明:

- `c_div()`"Zero kesim"`wrap32()`İİşlemesi kurallarına uyma
- Modellere karşı`(3, INT_MAX)`-133'e ulaştık. -86-64'e ulaştık.`trap`Arş 64'te 2147483648'e ulaştık.
- 网格'de 92 birim var ve her risk sınıfını kapsar, basit örnekler tüm zorluk sınıflarını önler.
- ELF  Reader  Record'in Değişimi ve Büyüklüğü'nde dört işlevi bul
- `percent_change`16 字节 ve hiç ağırlıklı bir konum,`grade`- Evet .`0x26`Bir yazı var.`R_X86_64_PC32`
- Bu RELA hedef dosyasında hiçbir şey değişmeyecek.
- Tüm 8 aday beklenen durumuna ulaştı ve kayıtta nedenleri belirtildiler.
- `grade_case10_wrong`Sınırlama sonrası kontrol, sadece düzenli kontrollerde başarısız
- Kaydedilen ilk yol yürüyüşü 10 basit kullanım örneğini gösterir. 28 eşleşmeyen nokta, 0 model ayrılığı
- 编译器 olduğunda, iki gerçekleşmiş yeniden inşa ve çalışmalar aynı sonuç elde ediyor
- 智能体运行 SHA-256 定位已提交目标文件,顺序正确,每个证据 步骤都带有 `ev_`标识符
- `read_bytes`记录与 ELF 读取器找到的表相同
- 客户端驱动模拟服务器, kayıt ve gerçek operasyonla aynı kanıt tanımlayıcı
- 服务器错误结果会进入运行记录 服务器错误结果会进入运行记录
- `aggregate()`保守失败原理, kanıtlama tanımlayıcıları içeriği yeniden hesaplanabilir

## 生产环境中的失败模式

| 失败 | 不严谨的报告会说什么 | 测试框架必须证明什么 |
|---|---|---|
| 重建保留反编译器的 `long` | “十个测试通过” | 26 个溢出单元与原始结果不同 |
| 用阈值替代 switch | “每个分数段都通过” | 原始实现在 110 及更高输入上返回 0 |
| 先除后乘 | “公式在代数上等价” | 舍入单元不同，简单用例失败 |
| 跳过陷阱单元 | “没有崩溃” | x86-64 触发 `#DE`，AArch64 返回 `INT_MIN`，报告说明宿主架构 |
| 不屏蔽就比较字节 | “字节相同” | 重定位记录指向不同偏移 |
| 只屏蔽，不读常量 | “屏蔽后字节相同” | `1,2,3,4,3` 与 `1,2,3,4,4` 不同 |
| 把大小当接受标准 | “长度相同” | 相同长度内仍有不同字节 |
| 编译器或参数不同 | “字节不同，重建错误” | 相同源码会生成不同字节，因此该比较无效 |
| 将模型当作观察 | “模型一致” | 运行是观察，模型是推导，并列出分歧 |
| 断言没有证据标识符 | “已验证” | 每项断言链接到所覆盖函数的 `ev_` 记录 |
| CI 宿主机没有编译器 | “通过” | 行为断言为 `unknown`，汇总也为 `unknown` |
| 将伪代码视为源码 | “反编译器说是 long” | 清单显示 `IMUL EAX`、`CDQ`、`IDIV EDI` |

## Operasyon kuralları

                                                                                                                                                                                                                                                              

## 延伸阅读

- [McKeeman, Differential Testing for Software, Digital Technical Journal 10(1), 1998](https://www.cs.tufts.edu/comp/150FP/archive/bill-mckeeman/DifferentailTesting.pdf)
- [Yang, Chen, Eide, Regehr, Finding and Understanding Bugs in C Compilers, PLDI 2011](https://doi.org/10.1145/1993498.1993532)
- [Ramos, Engler, Practical, Low-Effort Equivalence Verification of Real Code, CAV 2011](https://doi.org/10.1007/978-3-642-22110-1_55)
- [Schwartz, Lee, Woo, Brumley, Native x86 Decompilation Using Semantics-Preserving Structural Analysis, USENIX Security 2013](https://www.usenix.org/conference/usenixsecurity13/technical-sessions/presentation/schwartz)
- [Liu, Raff, Micinski, When LLM Decompilers Recompile More and Preserve Less, arXiv 2609.05370, 2026](https://arxiv.org/abs/2609.05370)
- [Gao et al., DecompileBench, Findings of ACL 2025](https://aclanthology.org/2025.findings-acl.1194/)
- [Tan et al., LLM4Decompile, arXiv 2403.05286, 2024](https://arxiv.org/abs/2403.05286)
- [System V gABI, Chapter 4, Relocation](https://www.sco.com/developers/gabi/latest/ch4.reloc.html)
- [x86-64 psABI repository, relocation types](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Intel 64 and IA-32 Architectures Software Developer's Manual, Volume 2, IDIV](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [Arm Architecture Reference Manual for A-profile, DDI 0487, SDIV](https://developer.arm.com/documentation/ddi0487/latest)
- [rea 6.5.0 MCP contracts](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/mcp-contracts.md)
- [rea 6.5.0 reconstruction obligation ledgers](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/reconstruction-obligation-ledgers.md)
