# 2. Sistemli analizdeki kanıtlar, güven ve bilinmeyenler

> Bir derleme prosedürünün bir bulguyu, bir kaydı, bir de kanıtlanamayan olayların listesi ile birlikte, bir de güven ve yetki kaynağı olmalıdır.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 32（从零构建 ELF）、Phase 13 · 33（反汇编与控制流）、Phase 13 · 34（提升为伪代码）
**Time:** ~105 分钟

## Öğrenme hedefi

- 参照 rea `Evidence`Dayanış Kayıtları, Dayanış Kayıtları, Dayanış Kayıtları, Dayanış Kayıtları, Dayanış Kayıtları, Dayanış Kayıtları, Dayanış Kayıtları, Dayanış Kayıtları ve Dayanış Kayıtları
- 计算基于内容哈希的标识符,文件移动到其他目录时标识符保持不变──
- Her bir sunucu gösteremediği içeriği kaydetmek için sınırlandırır ve kayıtlarla birlikte aktarmak için sınırlandırır.
- Bu nedenle, bu işlemin gerçek gözlemini desteklemek için, bir sonucu reddetmek için kullanılır.
- Geri kalan bilinmeyen konular, hash bağlantısı ile kaydedilmiş versiyon kayıtları olarak kaydedilecek.
- 按精确键缓存提供方的回答,并拒绝过期重放──

## 问题

Bir akıllı kişiyi sor:`ledger-x86_64-O1.o`Orta `grade`Bu yüzden, bu konuda bir tek soru var. Bu soruların cevapları:`uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);`△该位置的字节却表示 △`xor eax, eax`- Evet.

Bu ifade ve bu emir tüm girişlere 0, ancak akıllı beden bunu bilmiyor. Sadece metin araçtan geldiğinden inanıyor. 2026 yılında yapılan bir araştırmada üç akıllı bedenin 24 ters yönlü mühendislik görevi gerçekleştirmesine izin verilir.[NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)), dört defa ortaya çıkan zayıflıkları belirtti: eğitim önyargısı, aşırı güven gözlem sonuçları, yukarıdaki kısıtlamalar ve orijinal planı tutmak.[arXiv 2607.12507](https://arxiv.org/abs/2607.12507))。

rea 6.5.0 bunun için bir kelime kümesi sağlıyor.`Evidence`Kayıt,其`confidence`Çı`observed`- Evet.`derived`Ya da`inferred`, 并带有 `authority`和 `limitations`列表──随附技能告诉智能体: her sonucu                                                                                                                                                                                                                                                       

Gerçek üç şeyi size bırakır: hızlı bir şekilde kaydetmek analitik değil, kesin bir sorgu sonucu; bir kıyaslama boyutunun değişmediğinde, doğrulama kararlı bir karar verir, ancak kaynaklı bir açıklama açıkça belirtir ki, genel bir uygulama gerçekleştiremez; yükümlülük kitabı yalnızca JavaScript ve yönetim grafiklerinden gelen adayları alır, bu nedenle orijinal işlevi buna ulaşamaz.`verified`- Evet.

Bu ders, saf Python'da eksik olan kısımları tamamlayacak bir kitap yazacaksın, bu kitapta bulunan her bir şey hakkında bir kayıt kaydedeceksin.`percent_change`和 `grade`Önceden tahmin, tahmin için işaret, kendi tarafından düzenlenen test programının çalışma sonuçlarını tekrar kullanmak; ayrıca iki gerçek gerçek kayıt ve kaynakları, hesaba yeniden hesaplanmak için göndermek.

```figure
re-evidence-ledger
```

## Üç çeşit inançlı sınıflar, beş çeşit yetki kaynağı

`confidence`Sadece üç değerden bir örnek, kesinlikle sayısal değeri değil.`authority`Hayı beş değer. Üreticinin açıklaması yok.`shipped-artifact`和 `observed`- Evet.

| 值 | 在夹具上的含义 | 本课中的记录 |
|---|---|---|
| `observed` | 从字节或运行中读取的事实 | ELF 读取器读取的节和符号、两条 Ghidra 记录、17 次宿主机运行 |
| `derived` | 根据观察记录计算出的事实 | switch 表模型、除法模型、每次未知项变更 |
| `inferred` | 尚无观察结果陈述的预期 | 18 项预测 |
| `shipped-artifact` | 来源是磁盘上的文件 | 对 `ledger-x86_64-O1.o` 的每次读取 |
| `controlled-replay` | 由你控制的运行产生的事实 | `harness.c` 的宿主机运行 |
| `analyst-inference` | 你自己的判断 | 预测及未知项变更 |
| `historical-reference` | 旧版本源码树或文档 | 本课没有 |
| `external-service` | 文件和宿主机之外的服务 | 本课没有 |

İki çeşit karışıklık en fazla zaman kaybıdır. Birinci çeşit sahte kodları davranış gözlemleri olarak görüyor. Aslında, sadece Ghidra'nın içerik çıkışı gözlemleri olarak görüyor.`code/main.py`Orta Kitap bu iki kuralın kodunu gerçekleştirir.

## Kayıt

Bir kayıtta 16 bölüm var. Bölge 6.5.0 diğer bölümleri reddedecek.`code/main.py`Bu nedenle, her iki tarafın da oluşturduğu kayıtlar birbirlerinin onayıyla geçerlidir.`relationship_coverage`Kullanıcı veya Kullanılanlar Listesinin Tamlığını Göstermek`complete`- Evet.`partial`Ya da`unknown`Operasyon rapor edilmezse,`null`- Evet.

| 字段 | 内容 |
| --- | --- |
| `evidence_id` | `ev_` 加 64 位十六进制数字，表示内容哈希 |
| `subject` | `name`、`digest.sha256`、`format`、`architecture`、`local_path`，或 `null` |
| `provider` | `id`、`name`、`version`，或 `null` |
| `analysis_profile` | 提供方的设置及其摘要，或 `null`；该字段始终存在 |
| `predicate_type` | 标签，默认为 `rea.analysis` |
| `operation`, `parameters` | 工具及其输入 |
| `raw_result`, `normalized_result` | 提供方输出及规范化结果 |
| `confidence`, `authority` | 上述枚举值 |
| `environment` | `id`、`platform`、`architecture`、`isolation`，或 `null` |
| `limitations` | 用普通句子描述的限制 |
| `relationship_coverage` | `status` 为 `complete`、`partial` 或 `unknown`，附带诊断信息；或为 `null` |
| `locations` | `address`、`address-range`、`artifact-path`、`file-offset`、`file-offset-range` |
| `evidence_links` | 本记录所依赖的 `ev_` 标识符 |

Aşağıda gerçek bir neden var.`grade`写入的真实记录, sadece bu bölümün ilgi alanının bölümünü koru.`code/fixtures/rea-evidence-grade.json`, 字节: 37,573

```json
{
  "evidence_id": "ev_67b6d3f992eaf49a2e16de084b6ebfdd9884e8c5c7f75e175b7bb20f4f748ce1",
  "subject": {
    "name": "ledger-x86_64-O1.o",
    "digest": { "sha256": "9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f" },
    "format": "elf",
    "architecture": "x86_64",
    "local_path": "/private/tmp/aiefs-re/phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns/code/fixtures/ledger-x86_64-O1.o"
  },
  "provider": { "id": "ghidra", "name": "Ghidra", "version": "12.1.4" },
  "analysis_profile": {
    "provider": { "id": "ghidra", "name": "Ghidra", "version": "12.1.4" },
    "parameters": { "jump_table_evidence": "typed-case-default-blocks-v1", "import_mode": "ephemeral-source-immutable" },
    "digest": "9c7f6b24be69294e61da046e4583e3856cb9e40433b149c1bf8bb534d2fe03ef"
  },
  "operation": "analyze_function",
  "parameters": { "procedure": "grade" },
  "confidence": "observed",
  "authority": "shipped-artifact",
  "environment": null,
  "limitations": [
    "Default-space addresses use lowercase 0x-prefixed hexadecimal; other address spaces use <percent-encoded-space>:0x<hex>.",
    "Resolved reference metadata identifies computed, indirect, external, call, jump, and data edges; unresolved targetless flows remain unknown, and function classifications distinguish thunks and externals."
  ],
  "relationship_coverage": {
    "status": "complete",
    "diagnostics": [
      "Only resolved Ghidra call references are returned; unresolved computed or indirect calls remain unknown, while function classifications distinguish thunks and externals."
    ]
  },
  "locations": [],
  "evidence_links": []
}
```

分析配置中真实的 `parameters`- 25 tane anahtar var.`limitations`Listede 10 cümle var. Lütfen tümünü sakla. İçeriğin bir kısmını kısıtla. Bir öğeyi kaldır.

Dikkat kayıtları hiçbir şey söylemiyor.`environment`Çı`null`Çünkü Ghidra sadece dosyaları okudu, kod çalışmadı.`locations`Bu iş için boş.`normalized_result`İç rapor adresleri:`relationship_coverage`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `complete`Ancak, teşhis açıklaması sadece çözülmüş Ghidra 调用引用, çözülmemiş hesap türü veya dolaylı olarak yapılan konuşmaları geri döndürmektedir.

## 标识符是内容哈希,路径不参与计算

RFC 8785'e göre bir projeyi gerçekleştirecek.`ev_`Ön, get `evidence_id`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊   ◊ ◊    ◊ ◊                                                                                                                                                                                                         `digest`- Evet.`format`和 `architecture`- Git .`name`和 `local_path`- Evet.`relationship_coverage`Çı`null`Bu nedenle, bu bölümün ortaya çıkmasından önceki belirtici belirtilerini tutarak, ilişki kayıtlarını da yok eder.`raw_result`Ve her bir sınırlama, herkes katılır.

RFC 8785 nesne anahtarı sıralaması için, boşluğu kaldırmak, sabit sayı ve karakterlerin ifade biçimi için.

```python
def canonical_json(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
```

`code/main.py`RFC 8785'in Python ile bazı float sayılarının çıkışı farklı olduğu için float sayılarını reddetmişlerdir.

| rea 的值 | `code/main.py` 重新计算的结果 |
|---|---|
| `grade` 的 `ev_67b6d3f992eaf49a…` | 相同 |
| `percent_change` 的 `ev_e88b10dc0c6400e5…` | 相同 |
| 对 `{provider, parameters}` 计算的配置摘要 `9c7f6b24be69294e…` | 相同 |
| `grade` 快照条目的 `query_26122aebe9d8abae…` | 相同 |
| `percent_change` 条目的 `query_0f95ef38038d3666…` | 相同 |

Neden bir yol çıkarmak? Aynı yazı tipi için aynı gözlem, makinelerin ve katalogların nasıl değişmesine bakılmaksızın, hepsi aynı tanımlayıcıyı elde etmelidir.`local_path`Yukarıdaki dizini bir Mac'e yönlendir.`/home/you/re`后, 标识符不会改变──`rebind_subject_path()`允许使用新路径展示记录;当 `sha256`- Evet.`format`Ya da`architecture`Aynı zamanda, bu da reddedilir. Bölge 6.5.0 yeni yolların hedefini yeniden açarak kaydetir.`rebindEvidenceToTargetPath`Aynı şekilde çalıştırmak.

`validate_evidence()`重新计算标识符,若不匹配则使用 rea 的消息拒绝:证据语义标识符不匹配其记录──若记录的 `analysis_profile.provider`ile`provider`İtiraz etmiyor, reddediyor.`test_tampered_id_and_mismatched_profile_are_rejected`修改真实 `grade`Kayıtta bir satır sahte kod var, ve kitaptan bir kaç tane de reddediliyor.

## Kendi gözümün önünde

Bu yüzden, her türlü bilgiyi kullanmadan önce, kitap önce bir dosya okuyun.`observe_object()`Kullan .`struct.unpack_from`解析 ELF64 节头、`.symtab`- Evet.`.strtab`和 `.rela.text`Bir yazı yazmış.`inspect_object`记录,并为每个函数符号写入一条 `read_function_bytes`Kayıt.`observed`, 权威来源为`shipped-artifact`Çünkü kaynak disk dosyası.

| 记录 | 内容 | 标识符 |
|---|---|---|
| `inspect_object` | 五个节的偏移、大小和哈希，四个函数，三条重定位 | `ev_645e0a145f28bd5c…` |
| `read_function_bytes percent_change` | `.text+0x00` 处的 16 字节 | `ev_2572a7d254ad15cb…` |
| `read_function_bytes grade` | `.text+0x10` 处的 46 字节，SHA-256 为 `ffcb75c2a7bb1104…` | `ev_a467c2427bfc0c56…` |
| `read_function_bytes total` | `.text+0x40` 处的 31 字节 | `ev_b1e845cea2543073…` |
| `read_function_bytes grade_label` | `.text+0x60` 处的 63 字节 | `ev_c50041be26e6b7f4…` |

`llvm-objdump -t`Önemli olan:`grade`位于 `0000000000000010`, büyüklükte`2e`- Evet.`.rela.text`Ortalama                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `.rodata``R_X86_64_PC32`,偏移分分为 `0x36`- Evet.`0x84`- Evet.`0x93`, fazladan bölünme için `0x10`- Evet.`0x24`- Evet.`-0x4`                                                                                                                                                                                                                                                              `file-offset-range`位置和一项限制: 节字节从磁盘文件读取──读取器不应用重定位,也运行代码──

Bölüm 32  Ders tamamıyla bu okuyucuyu oluşturdu. Burada sadece 60  行 kullanılıyor. Çünkü bu ders, nasıl okuyucuyu kaydetmekle ilgilidir.

## 推导表,并明说明它是推导结果

`grade`46'da 33'ü içerir.

| 字节 | 指令 | 在 `grade` 中的偏移 |
|---|---|---|
| `48 69 c0 67 66 66 66` | `imul rax, rax, 0x66666667` | 3 |
| `48 c1 f9 22` | `sar rcx, 34` | 13 |
| `83 c1 fa` | `add ecx, -6` | 23 |
| `83 f9 04 77 0c` | 先 `cmp ecx, 4`，再 `ja` | 28 |

- Yukarı .`0x66666667`后右移 34位, eşittir 符号除以 10──文件中并没有 10──`derive_grade_model()`Bu gerçeği sınırlı olarak yazın: 除数 10 除数 10 除数 10x66666667 除数 0x66666667 移位量 34 推导的.

`add ecx, -6`İlk bölümün 6 olması lazım.`cmp ecx, 4`配合无符号跳转允许五分支,即6至10──

`.text+0x33`- Ne ?`lea`带有加数为 `0x10`PC32 重定位ün gerçek adresi hesaplama, dört kısımlı bir konum taşıma sonuna ilişkindir.`.rodata+0x14`Başlayın. Orada beş küçük kelime var.`1, 2, 3, 4, 4`- Evet.`ledger.c`Orta anahtar 60 ila 69  dönüş 1, 70 段 dönüş 2, 80 段 dönüş 3, 90 ila 100  dönüş 4 ⋅ Çözümcü dönüşü dönüştürür değer aramak için ⋅

Doğuş kaydı`ev_605106bff2d9998f…``confidence`Çı`derived`- Evet .`evidence_links`Bu nedenle, bu kayıtlar, bir önceki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir sonraki tarihten sonra bir tarihe görecek.`ev_a467c242…`Bu durumu gösterir.

现在与Ghidra比较──它对同样字节给出的伪代码如下:

```c
uint grade(int param_1)
{
  uint uVar1;
  uint uVar2;

  uVar2 = param_1 / 10 - 6;
  uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);
  if (uVar2 < 5) {
    uVar1 = *(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4);
  }
  return uVar1;
}
```

Ghidra  aplikııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııı`DAT_001000b4`- Ne zaman olacak ?`.text`- Bırak .`0x100000`Bu da o.`.rodata+0x14`                                                                                                                                                                                                                                                              `native_value_flow`Ortalama p-kod bu işlemleri işaretleyecek .`is_dead: true`Bu kayıt Ghidra'nın çıkışını gerçekten gözlemledi; sen ondan anladığın anlam, tahminlere aittir, ama sen de elde edeceğin değer, tahminlere aittir.

`percent_change`Kayıtlar başka bir başarısızlıktan bahsediyor.`undefined1 [16] percent_change(int param_1,int param_2,ulong param_3)`- Kaynak kodumuz...`int percent_change(int before, int after)`- Evet.`idiv`写入 `EDX:EAX`, ve sıfır değer yolu değiştirilmedi .`EDX`Bu nedenle, anti-kompilatör 16 字节 geri değeri ve üçüncü parametre çıkarmıştır.`grade`Verilenler`native_api.return_type.confidence`Evet .`"low"`◊ Resmi kayıtlar olarak, gönderilen imzalanmaların yeniden sağlanması gerekmektedir.

## 预测是推测记录

预测, davranışlar hakkında henüz hiçbir gözlem sonucu elde edilmemiş bir ifade.`claim_suite()`根据推导模型和源码构建十八项预测──`record_prediction()`Her bir şey var .`confidence`Çı`inferred`- Evet.`authority`Çı`analyst-inference`Kayıt, ̇ bağlantı ̇ bağımlılık kaydı ̇

| 断言 | 预测值 | 依据 |
|---|---|---|
| `percent_change(12400, 15500)` | 25，来自 310000 / 12400 | 除法模型 `ev_076a9167…` |
| `percent_change(0, 5)` | 0，零值保护分支 | 除法模型 |
| `percent_change(100, 50)` | -50 | 除法模型 |
| `percent_change(-7, 3)` | -142，因为 `idiv` 向零截断 | 除法模型 |
| `grade(55)` | 0，索引 -1 无法通过无符号比较 | 表模型 `ev_605106bf…` |
| `grade(60)`, `grade(69)` | 1, 1 | 表模型 |
| `grade(70)`, `grade(85)` | 2, 3 | 表模型 |
| `grade(95)`, `grade(100)`, `grade(105)` | 4, 4, 4 | 表模型 |
| `grade(110)`, `grade(-5)` | 0, 0 | 表模型 |
| `total(1, 2, 3)`, `total()` | 6, 0 | 源码记录 `ev_2f1e6d25…` |
| `grade_label(85)` | `"B"` | 源码记录和表模型 |
| 90 至 100 的 `grade(score)` | 十一个输入都返回 4 | 表模型 |

`predict()`C 语义 kullan, Python 语义 değil.`c_div()`"Zero kesim"`wrap32()`32 位─Python'un `//`Önemli değil.`(3 - -7) * 100 // -7`-143'e, C'ye -142'e ulaştı.

Her tahmin yeni bir bilinmeyen proje oluşturur.`controlled-replay``observed`证据,并建议一次探测:在宿主机构建上执行 `execute_function`△下一节会产生这种证据──第一个级断言问题是:编译后的函数实际运行时,级(95) == 4 是否成立?

## Gerçeklik kontrolü

`code/fixtures/harness.c`包含 `ledger.c`, her seferinde bir sonuç basın.`observe_runs()`İstihbaratın ilk yolu`clang`- Evet.`cc`Ya da`gcc`编译它,并将网格中的每一个输入运行一次――每一次运行都成为一个记录:

```json
{
  "operation": "execute_function",
  "parameters": { "function": "grade", "args": [95] },
  "normalized_result": { "result": 4, "stdout": "4\n", "exit_code": 0 },
  "confidence": "observed",
  "authority": "controlled-replay",
  "environment": { "id": "host-process", "platform": "darwin", "architecture": "arm64", "isolation": "process" },
  "limitations": [
    "The run executed a host build of ledger.c, not the x86-64 object. The claim about the object rests on the shared source and on the compiler.",
    "One run observes one input. It proves nothing about other inputs."
  ]
}
```

运行记录的主体是测试驱动程序二进制文件, Mac 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上 上`course-harness`,附带编译器版本行, burada için `Apple clang version 17.0.0 (clang-1700.6.3.2)`- Evet.`evidence_links`Yön kaynak kayıtları`ev_2f1e6d251543d017…`, çünkü ürün ve hedef dosyaları sadece paylaşılır.`ledger.c`Ama aynı değil.

Lütfen ilk kısıtlama iki kez okuyun. x86-64  hedef dosya bu makinede hiç çalışmamıştır. Aslında aynı kaynak kodunun diğer yapıların ikinci yapılarına karşı çalışmasıdır. Bu hala gözlemdir ve simülasyon kullanmadığında, elde edilebilecek en güçlü kanıtdır. Bu nedenle bir iddiayı kabul edebilirsiniz, ancak bu kısıtlama ile birlikte yapılması gerekir.

17 adet tek bir giriş ve giriş tümü öngörüye uymuştur.`code/fixtures/run-evidence.json`Bu 17 madde kayıt ve kaynak kayıtları, 2026-10-13 kullanımı.`--record`导出──没有编译器时,`build_ledger()`portı, bu belgeyi uygulamadan içeriye sokarak rapor eder. `runs`字段中明确说明──

## 提升规则

Sadece gözlemlenmiş bir şekilde, tahminlerin desteklenmesi için desteklenmesi gerekir.`check_claim()`查找函数和参数相同 `execute_function`记录,将每个结果与预测比较,并统计覆盖的输入:

| 状态 | 条件 | rea 的完成账本 |
|---|---|---|
| `pass` | 每个输入都有一致的运行，且没有不一致结果 | `pass` |
| `fail` | 任一次运行不一致 | `fail` |
| `unknown` | 部分输入有运行，其他输入没有 | `unknown` |
| `unsupported` | 没有任何输入有运行记录 | `unsupported` |

`promote_claim()`Bu çok ciddi bir sürüm.`inferred`Ya da`derived`Kayıtlı bir zaman, her şey atılır.`ClaimError`; işaretçi, diğer fonksiyonların veya diğer parametrelerin çalışmasına işaret ederken, aynı şekilde anormaller ortaya çıkarır; listeler boş veya çalışmalar kapsamlı olarak giriş, aynı şekilde ifade gerektirirken daha azdır.`grade(55)`Aynı zamanda Ghidra'nın sahte kod kayıtları ve şefter modeline sahip, ama bu ifadeyi geliştiremezler.`ev_7be90c0c…`, sen göreceksin karar düşecek `unsupported`,  hakkında`grade`İki kayıt hâlâ var.

范围断言部分覆盖的情形――其十一条输入中, yalnızca 95 和 100 现在运行网格中――`check_claim()`Geri dön .`unknown`- Evet .`covered`11'den 2'si;`promote_claim()`则拒绝,消息为211 girişden 🏼 hesap bu sonucu yukarı  into complete coverage 🏼

`completion_ledger()`Bu konuda`EvidenceCompletionLedger`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △`ecl_`Kayıt içeriği çok fazla, sadece `pass`Ben de öyleyim .`total`时,`complete`才为真──因为那一项范围断言,演示输出 `ecl_da64933ea13befed…`,并显示 `complete: false`- Evet.

## Bilinmeyen bir şey , bir şeyle bağlantılı bir kayıt .

Geri kalan bilinmeyen konuları ciddi bir yapısal kayıt olarak saklayacaktır.`code/main.py`Aynı bölüm ve aynı değişim yok.

标识符是 `unk_` 加`{domain, question, scope_digest}`SHA-256'nın sorunlarındaki sürekli boşluklar tek boşluklara katlanır.`scope_digest`SHA-256'ın hedef dosyası.

Her değişiklik yeni bir değişiklik yapmıştır.`previous_revision_digest`Çı`null`后续每修订都引用前一版本的 `revision_digest`, resim kapsamı kendisinden başka tüm bölümleri`verify_unknown_chain()`遍历列表,重新计算每个摘要,检查每个链接是否指向前一版本,并检查每个版本引用的变更证据是否存在账本中──

Her değişim kendiliğinden de kanıt kayıtları, gerçek kullanım sağlayanları ile birlikte.`rea-unknown-registry`Aynı yöntem.`confidence`Çı`derived`- Evet .`authority`Çı`analyst-inference`, hiçbir başlıklı, sınırlı, kayıt kayıtları analizci tarafından yapılan kararlar, sorunun cevabını kanıtlamıyor.

Bu, gösterinin 81'i kayıtlarında 36'sı da dahil olmak üzere: 18 yeni inşaat ve 18 yenilik.

Her değişiklik üç değişkenliği karşılamalıdır:

- Sadece .`resolved`Bilinmeyen bir şey var .`resolution`, ve sadece modifikasi 1 没有前驱──
- `contradicted`Bilinmeyen bir isim en az bir itiraz tanıklığı işaretini belirtir ve aynı tanıklık iki listede aynı anda bulunamaz.
- `verified`解決結果 en az bir güven sınıfı ve yetki kaynağı olan bir kanıt işaretçisini alıntılamak.

Üçüncü kural, "Hazırların en sık reddedilen yerleri"dir.`resolve_unknown()`拒绝表模型,也拒绝权威来源为 `shipped-artifact`Gözlem kayıtları, ama çalışma kayıtlarını kabul et.`ev_f4ffbe8f922ec7fe…`- Evet.`grade(95)`已解决的修订为版本 2,其`previous_revision_digest`Çı`ffca840b55a8a188…`,即修订 1 の摘要──

`update_unknown()`接收 `expected_revision`, zamanın geçtiği zaman atıldı`revision-conflict`, ile rea `update_unknown`工具相同──正确应对方式也与 rea的说明一致:重新读取当前版本,再作决定──

Gösterinin sonundan sonra hala bir bilinmeyen konuyla ilgili açıklamalar yapıldı:`unk_f2eb0d7f84c80a19…`, problem is 编译后的函数运行时,90至100'ün her分数是否都满足等级 (score) == 4?其状态为 `investigating`, iki seferlik çalışmaları içerir, araştırma önerileri hala çalışmamış dokuz giriş listesi oluşturmaktadır.

## 回答缓存不是分析数据库

Bu kitapta, bir kaç tane gizli bir şey var.`-readOnly -deleteProject`导入,关闭时删除──内存中的 `AnalysisSnapshotCache`Bir ikinci sistem olarak 10.000'e kadar bir yazı vardır.`target`- Evet.`binding`- Evet.`entries`- Evet.`workflow_entries`和 `evidence_bundle`- Evet.

缓存键是 `query_` 加`{target, binding, operation, parameters}`SHA-256'ın.`target`Çı`{sha256, kind, format, architecture}`- Evet .`raw-binary`目標                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `entry_point`- Evet.`binding`包含提供方及整个分析配置,连同摘要──修改25配置参数中任意一个,例如将`jump_table_evidence`- Evet .`typed-case-default-blocks-v1`改为 `v2`...bkz: her şey değişir.

`code/fixtures/rea-snapshot.json`Bu, iki kez çalıştırıldığında yazılmış dosyaların, büyüklüğü 142.690 字节──area 写作时权限仅限所有者, deponun副本则人可读──`AnswerCache.import_snapshot()`重新计算每个 `query_id`Herhangi bir anlaşmazlık tüm dosyayı reddeder.`target`Ya da`binding`Şimdiki değerden farklı olarak, rea'nın ifadelerini kullanır.`profile_mismatch`拒绝;若 `format_version`Hayır .`course-answer-cache-1`Ben de reddedeceğim.

Bu makinede üç kez ölçülmüştür:`grade`Ghidra'ya yeniden yönlendirme, 8.6 saniye sürüyor.`percent_change`Soruşturma 8.5 saniye sürer çünkü farklı sorular kaydedilmez .`grade`Soruşturma 2,1 saniye sürer ve tamamen aynı kayıtları geri alır.`evidence_id`◊ area's内存重放会添加限制:从本地 REA 分析快照加载;本次调用没有重新运行提供方──本课的 `lookup()`Ayrıca benzer açıklamalar da eklendi.

变更会终止缓存使用──在 rea 6.5.0 中, yeniden adlandırılır veya eklenir注释会在调用发送给提供者之前清空快照缓存──失败响应不能证明已回滚的写入,因此写入失败也会停止重放──将修改数据库的元数据导入同样──

## Neden akıllı bedenin ihtiyacı var?

MCP'den gelen akıllı bedenler, her çağrıyı tam kayıt olarak görür ve raporlarda alıntı yapılır.`evidence_id`◊2026 yılında yapılan bir araştırmada kolaylıkla yanlış yerler belirtildi. Aşırı güven araç çıkışı NDSS BAR araştırmasının bulunduğu dört zayıf noktadan biridir.[arXiv 2606.06838](https://arxiv.org/abs/2606.06838)): Yüzlerce işlevi olan ikili dosya için, sadece 10% ila 15% işlevi akıllı vücut tarafından oluşturulan kodun öncesinde gerçek bir analiz elde edilir.

账本用记录回应每一个问题,智能体只报告账本中已有的内容――没有观察运行的断言为`unsupported`, sadece bir kısmını yürütmek için .`unknown`❖ 提供方文本的 `observed`Sadece üreticilerin çıkarma ve çıkışına yönelik olarak.`outputs/`İçinde bulunan beceri dosyaları akıllı bedenlere verilir ve kitap kitapların son yazmalarının tek yerine dönüştürülür.

## Kendini oluştur

运行仅使用标准库的演示:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
```

演示读取目标文件,导入两条 rea 记录,验证 rea 快照,并推导两个模型――随后记录18项预测、新建18项未知项目、编译并运行测试驱动程序、检查每项断言,再解决17项未知――预期结构如下:

```json
{
  "records": 81,
  "by_confidence": { "observed": 25, "derived": 38, "inferred": 18 },
  "rea_snapshot": { "entries": 2, "replay_hit": true, "stale_profile_refused": true },
  "grade_table": [1, 2, 3, 4, 4],
  "runs": "live: Apple clang version 17.0.0 (clang-1700.6.3.2)",
  "claims": [ { "claim_id": "grade(95)", "status": "pass", "covered": "1/1" }, { "claim_id": "grade(90..100)", "status": "unknown", "covered": "2/11" } ],
  "completion_ledger_id": "ecl_da64933ea13befed9483f8b00447bb3f4ceb74324c01e2515eff03f3af3ca750",
  "complete": false,
  "unknowns": { "resolved": 17, "investigating": 1 }
}
```

没有 C 编译器时,`runs`显示 `imported 17 recorded run records from run-evidence.json`Gerisi de aynı.

按以下顺序阅读 `code/main.py`- ...

1. `canonical_json()`和 `compute_evidence_id()`实现哈希方法和语义投影──
2. `create_evidence()`和 `validate_evidence()`构建并检查记录──
3. `EvidenceLedger.record()`和 `import_bundle()`保存记录并拒绝冲突──
4. `open_unknown()`- Evet.`update_unknown()`和 `resolve_unknown()`维护修订链。
5. `observe_object()`读取 ELF,`derive_grade_model()`读取表──
6. `claim_suite()`- Evet.`predict()`和 `record_prediction()`写入推测层记录──
7. `observe_runs()`Test sürücüsünün her çalışması gözlem kaydı haline dönüştürülür.
8. `check_claim()`- Evet.`promote_claim()`和 `completion_ledger()`应用提升规则──
9. `AnswerCache`像 rea 快照一样为回答设置键,并拒绝过期结果──

## Kullan

Bu, SHA-256'ın her bir hedef için, her bir araştırmanın ayrı ayrı bir defter için, her bir konu için, her bir bilinmeyen projenin için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir bilinmeyen projenin için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, her bir hedef için, bir hedef için, bir özetleme, bir hedef için, bir hedef için, bir hedef için, bir hedef için, bir hedef için, bir hedef için, bir hedef için, bir hedef, bir hedef, bir hedef, bir hedef, bir hedef, bir hedef, bir hedef, bir hedef, bir hedef, bir hedef, bir hedef, bir hedef, bir hedef, bir hedef, bir hedef, bir hedef veya bir hedef, bir hedef veya bir hedef veya bir hedef veya bir hedef veya bir hedef olarak, bir hedef olarak, bir hedef olarak, bir hedef olarak, bir hedef olarak, bir hedef olarak, bir değerlendirme veya bir değerlendirme.`provider`, let the identifier naturalise¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

Bir kez bilirsin ki kısıtlama, hemen yazın. Okuyucu yeniden konumlandırılmıyor, açıkça açıklıyor. Çalışanlar ev sahibi kuruluşunun kurulduğu, açıkça açıklıyor.

Bu, bir dizi metni oluşturur. Bu metinlerin tümü, bir veri olarak görülebilir.`_meta.provenance.untrusted_content: true`标记此类结果──其服务器指令要求模型将目标内容视为数据,并将其中要求运行,安装,下载或发送内容的请求报告作为提示注入企图──标记有帮助,但账本仍然必须确保目标文本不会进入指令层──

## 交互实验

### 实验 A: yeniden hesaplama 标识符

- Evet .`code`Python'u aç:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns/code
python3 -q
```

运行:

```python
from main import *
record = load_evidence_file(FIXTURES / "rea-evidence-grade.json")
record["evidence_id"] == compute_evidence_id(record)
record["subject"]["local_path"] = "/home/you/re/ledger-x86_64-O1.o"
record["evidence_id"] == compute_evidence_id(record)
record["limitations"].pop()
record["evidence_id"] == compute_evidence_id(record)
```

Önceki iki karşılaştırma sonucu gerçek çünkü yol katılmaz. Üçüncü ise sahte çünkü kısıtlama içeriğe bağlıdır.

### 实验 B: reddediler

```python
ledger, report = build_ledger(live_runs=False)
claim = [c for c in claim_suite(ledger.find(operation="derive_switch_model")[0], ledger.find(operation="derive_arithmetic_model")[0], ledger.find(operation="read_source")[0]) if c.claim_id == "grade(55)"][0]
promote_claim(ledger, claim, [ledger.find(operation="derive_switch_model")[0]["evidence_id"]])
```

Bu düzenleme`ClaimError`,并指出推导记录的标识符──现在传入运行记录标识符:

```python
run = run_records_for(ledger, "grade", [55])[0]
promote_claim(ledger, claim, [run["evidence_id"]])["status"]
```

Durum`pass`, geri dön .`limitations`Gelen ev sahibi kuruluşu

### 实验 C: 拒绝过期快照

```python
import json
snapshot = json.loads(REA_SNAPSHOT_PATH.read_text())
target, binding = rea_snapshot_binding(snapshot)
AnswerCache(target, binding).import_snapshot(snapshot)
stale = dict(binding["analysis_profile"]["parameters"], jump_table_evidence="typed-case-default-blocks-v2")
AnswerCache(target, {"provider": binding["provider"], "analysis_profile": make_profile(binding["provider"], stale)}).import_snapshot(snapshot)
```

İlk giriş, ikinci atış.`profile_mismatch``CacheError`Sadece bir sürüm değiştirildi, tüm şablonlar reddedildi.

### 实验 D:破坏链

```python
unknown_id = [u for u, r in ledger.unknowns.items() if r[-1]["status"] == "investigating"][0]
ledger.verify_unknown_chain(unknown_id)
ledger.unknowns[unknown_id][0]["severity"] = "critical"
ledger.verify_unknown_chain(unknown_id)
```

İlk kez 2... ikinci kez atış.`EvidenceIntegrityError`, çünkü 1 numaralı değişiklik kendi özetine uygun değilken 2 numaralı değişiklik zaten olmayan bir özetine yönlendiriyor.

## 实践实验

关闭未解决未知项目,并添加第二提供方──

要求:

- 扩展 `run_grid()`,运行范围断言缺少的九条输入, sonra belirlenmeyen konularda belirlenmiş.`resolved`- Evet.
- - Ben de .`llvm-objdump -d`İkinci bir sunucu için ekle, kendi kullanın.`provider`Görevi,`grade`清单记录为 `observed`- Evet.
- 写入一条  Yazmak için`derived`记录,说明 Ghidra 和 llvm-objdump'ın iki bölümünde aynı 14 条 命令,并同时链接两者──
- Çı`grade_label(105)`Yeni inşaat ciddiyetleri`high`Bilinmeyen olaylar, çünkü gösterim göstergesi 4 会读取 `labels[4]`Bu durumun çözümü için tekrar pratik bir şekilde çalışmak gerekir.
- Kullanım`export_bundle()`导出账本,再导入全新账本,证明每条链仍可通过验证──

Başarılı Standart: Rapor'un her cümlesi, kanıt paketindeki belirtecilere ve bu cümleye değinir.`unknown`Kesinlikle yok oldu.

## 本课产物

本课产 出 `outputs/skill-evidence-ledger.md` Akıllı bedenin her bulguyu güven sınıfı, yetki kaynağı, sınırlama ve bağlantı kayıtları olarak yazacağını, değiştirilmiş sürümleri nasıl koruyacağını ve ne zaman karar verildiğini açıklayacağını gösterir.`pass`- Evet.`fail`- Evet.`unknown`Ya da`unsupported`- Evet.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

28 项测试证明:

- İki tane`evidence_id`、配置摘要及两个快照 `query_id`İçeriği yeniden hesaplayabilir
- 改变路径不改变标识符,改变限制则改变标识符
- 改记录、提供不匹配配置、浮点数和未知枚举值都将被拒绝
- 重复记录返回 `duplicate`, çatışma kayıtları ortaya çıkıyor, kanıt paketleri atomik olarak aktarılıyor
- Kaydedilen yolculuk belgesi paketinin içeriği 18 adet kaydı var ve hiçbir bağlantı bulunmuyor.
- Bilinmeyen konular 1  başlayın, reddet `expected_revision`Ve sadece izlenir.`controlled-replay`Bunu çözmek için kanıtlar var.
- 编辑修订内容会破坏链
- 提升拒绝推测、推导、空列和无关证, sadece çalışma sonuçları uyumlu olduğunda geçerli
- 部分覆盖为 `unknown`,不一致运行则为 `fail`
- Kayıt sadece anahtarın tamamıyla uyumlu olduğu zaman oluşur, diğer parametreler oluşmaz
- 缓存 refused upgrade of configuration version、 err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err
- ELF 读取器 偏移、大小、字节和重定位上与 `llvm-objdump`Birlikte, birlikte okuyun.`1, 2, 3, 4, 4`
- 预测使用 C 除法语义,且已记录运行与全部17 项单输入断言一致
- 存在编译器时,实时运行结果也一致

## 生产环境中的失败模式

| 失败 | 不严谨的报告会说什么 | 账本的要求 |
|---|---|---|
| 将伪代码读作行为 | “grade 对不及格分数返回 0” | 该输入的 `execute_function` 记录，否则为 `unsupported` |
| 信任反编译器签名 | “percent_change 返回 16 字节” | 将签名标为提供方推断，并保留其 `low` 置信度 |
| 将空列表读作不存在 | “函数没有调用者” | `unknown` 状态，或工具提供的覆盖字段 |
| 将路径纳入标识符哈希 | 复制后“记录变了” | 不含 `name` 和 `local_path` 的语义投影 |
| 复制时丢弃限制 | 记录看起来比来源更强 | 标识符不匹配，导入时拒绝 |
| 将部分网格夸大为完整覆盖 | “90 起的所有分数都通过” | `unknown`，并显示 `covered` 为 11 中的 2 |
| 将宿主机运行说成目标文件运行 | “x86-64 目标文件返回了 25” | 断言必须携带宿主机构建的限制说明 |
| 用一句话关闭未知项 | “已解决，见上文” | `verified` 解决结果，引用所需权威来源的观察证据标识符 |
| 覆盖过期修订 | 两位分析者的编辑冲突 | `revision-conflict`，然后重新读取 |
| 新版本发布后重放旧快照 | 回答来自已变更的契约 | 导入时返回 `profile_mismatch` |
| 重命名后仍保留缓存 | 重放掩盖了元数据写入 | 发送操作前使缓存失效，并令导出失败 |

## Operasyon kuralları

Üç sınıf olarak okuduklarınızı kaydetmek, hesaplanmış içeriği ve beklenen sonuçları oluşturmak için kullanın. Bilinmeyen konularda bir cümleyi değiştirmek için kullanın.

## 延伸阅读

- [rea 6.5.0 source, `src/domain/evidence.ts` and `src/domain/residualUnknown.ts`](https://github.com/morluto/rea)
- [RFC 8785, JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785)
- [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Agent Failure Patterns in CTF Reverse Engineering, NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)
- [When Binaries Talk Back: Representation-Confusion Attacks on LLM-Assisted Reverse Engineering, arXiv 2607.12507](https://arxiv.org/abs/2607.12507)
- [Agentic decompilation study, arXiv 2606.06838](https://arxiv.org/abs/2606.06838)
- [When LLM Decompilers Recompile More and Preserve Less, arXiv 2609.05370](https://arxiv.org/abs/2609.05370)
- Bu ders anlatın                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `3b79af2`- Evet .`src/domain/evidence.ts`- Evet .`.agents/skills/reverse-engineer-anything/SKILL.md`- Evet .`docs/cli.md`- Evet .`src/domain/reconstructionVerification.ts`- Evet .`src/application/ReconstructionObligationCandidates.ts`- Evet .`docs/tool-design.md`- Evet .`src/domain/evidenceCompletionLedger.ts`- Evet .`src/domain/residualUnknown.ts`- Evet .`src/application/investigation/UnknownEvidence.ts`- Evet .`.agents/skills/reverse-engineer-anything/references/evidence-workflows.md`- Evet .`src/application/binary/AnalysisSnapshotCache.ts`- Evet .`src/domain/analysisSnapshot.ts`- Evet .`src/application/binary/BinarySession.ts`- Evet .`src/application/binary/BinarySessionRecords.ts`- Evet .`docs/mcp-contracts.md`- Evet .
