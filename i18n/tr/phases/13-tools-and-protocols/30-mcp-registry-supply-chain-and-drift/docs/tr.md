# MCP Kayıtları  tedarik zinciri:准入、漂移与回滚

> Kayıt 条目 sadece yayıncı tarafından açıklananları açıklayabilir. Üretim seviyesine girme kontrolü, neyi aldığınızı, neyi gözlemlediğinizi, neyi onayladığınızı ve neyi güvence altına alacağınızı kanıtlamalıdır.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 17 (gateways and registries), Phase 13 · 18 (production authentication)
**Time:** ~90 minutes

## Öğrenme hedefi

- 明确切分 Registry 发布、软件包出处 (来源) 运行时发现与本地审批等不同边界──
- MCP'nin hizmet merkezi kayıtlarının kendi açıklamalarının gerekçesiyle, bağımsız olarak onaylanmıştır.
- Değişmez yayın kayıtları, yürütme kaynakları, yazılım paketleri ve gerçek zamanlı araç tanımlayıcıları için sabit kanıtlar
- Giriş sonrasında, gerçek zamanlı kontrol kayıtları  durum değişimleri ve çalışma sırasında davranışlar漂移──
- Tarih kayıtlarını yeniden yazma teriminde, yollar güvenli bir şekilde daha önce hazırlanmış versiyona geri dönecektir.
- 维护一个防改的准入账本 (Admission ledger), her karar için bir audit açıklaması sağlamak.

## 核心问题

Kayıtta buldun .`com.example/inventory`◊ Bu açıklama tamamen ihtiyaçlara uygun görünüyor.`server/discover`- Evet.

Bu tek bir gerçek değil, farklı yetkili kuruluşlar tarafından yazılmış bir gerçek zinciri:

1. Bu isimle ilgili bir kayıt gönderdi.
2. Bir paket kayıt merkezi, özel bir işleme ile hash özetini oluşturur.
3. Bir gerçek işletim son noktasında protokol sürümleri, destekleme yetenekleri, kullanılabilir araçlar ve teşhis hizmetleri son bilgileri rapor edilmiştir.
4. Organizasyonunuz bu kesin komployu stratejide uygun ve yürütülmesine izin verildiğini belirler.

Bu aşamaları bir araya getirirsek, basitçe  diye düşünün  çünkü kayıtta olduğundan, doğrudan güvenebiliriz , tedarik zinciri güvenliği üzerinde büyük bir kör bölge kalır . bir yasal yayın sürümü her zaman atılabilir .

Çözüm yolu, her sınırda bir giriş kontrolörü oluşturmak ve sınavı kabul etme yetkisini almak.

## Kayıt, senin onay sisteminin değil, bir gösterge.

官方 MCP Registry Used for storage service端元数据──其`server.json`记录声明一个服务版本,并列出一个或多个软件包或远程端点――发布规则包含命名空间认证、软件包所有权检查、限注册源规则以及严格限制的发行者元数据存储位置――

Bu kontrol önlemleri cevap olarak**发布层面**Sorular: Ancak üretim ve çevre güvenliği stratejiniz hâlâ cevaplanmalıdır.**部署层面**Çözüm:

| 边界 | 核心问题 | 证据所有者 |
|---|---|---|
| 命名空间 | 该发布者是否有权使用此名称？ | Registry 认证凭证 + 本地验证过的命名空间输入 |
| 发布记录 | 发布者针对该版本具体声明了什么？ | 不可变的 `server.json` 内容摘要 |
| 执行源 | 最终执行的是哪个软件包或远程端点？ | 已声明的源字段、已验证的所有权结果、传输协议以及可信内容摘要 |
| 运行时 | 该端点当前实际暴露了什么能力？ | 实时 `server/discover` 结果与工具描述符 |
| 准入决策 | 本地安全策略是否批准了这套确切的组合？ | 本地固定的指纹（Pin）与账本记录项 |
| 运维治理 | 当前服务是否依然安全？故障时何者可替代？ | 漂移检测、状态同步、健康检查与备用回滚路由 |

Registry Schema  versiyon ile MCP  protokol versiyonu birbirinden bağımsızdır.`2025-12-11`服务端规范, gerçekte de çalışan servis端ler MCP'yi destekler.`2026-07-28`️Bir versiyondan diğerini asla karar veremez.

```figure
mcp-registry-admission
```

## Tek seferlik bir karar verme sürecinde yedi kontrol

### 1. 命名空间验证

官方 Registry'ın isimlendirilmesi, bir kişilik sertifikası kullanılarak adlandırılma alanı kullanılır.`example.com`Kontrol hakkı belirlenebilir.`com.example/*`- Bu bir kanun.

绝对不能使用简单的字符串前检查:

```python
server_name.startswith("com.example")
```

Çünkü bu yargılama da yanlış olur ve kötü niyetleri yaptırır.`com.exampleevil/tool`- Bu çok önemli .`/`切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切分名称, 切切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切割, 切, 切, 切, 切割, 切割, 切, 切, 切, 切, 切, 切, 切, 切, 切, 切, 切, 切, 切, 切, 切, 切, 切, 切, 切, 切, 切, 切, 切, 切, 切, 切

GitHub'a dayalı örgütlenmiş isimlendirme alanı ile alan adlarına dayalı isimlendirme alanı farklı onay yollarına sahiptir. Giriş kontrolcüsü bu iki yolun aynı giriş parametresi olarak birleştirilmesi gerekir: Tamamen uyumlu ve onaylanmış isimlendirme alanı karakterleri.

### 2. 出处关联(Provenance İlişki)

Software package tiplerinin kayıtları için, açıklama verileri aşağıdaki açık bölümlerde gerçek çekilen işleme ile sıkı ilişkilidir:

- 软件包注册中心类型(PYPI ≠npm gibi)
- 软件包标识符
- 软件包版本号
- 已验证 mülkiyet kontrol sonuçları
- 实际下载工件的内容哈希摘要

Aynı zamanda, test açıklaması için de bir nakliye protokolü gerekir. Eğer bir kayıt sadece uzaktan bir uç noktasını belirtirse, bu da tamamen uyumlu olur ve hiçbir zaman yazılım eksikliği nedeniyle hataları reddedilemez. Uzaktan kaynak için, açıklamanın URL ve nakliye türü bağımsız olarak onaylanmış bir uç noktasının mülkiyetine, ayrıca güvenilir bağlantı veya dağıtım kanıtı için hash özetine ilişkilidir.

Bu ders örnek kodları aynı zamanda bu iki kaynak türünü destekler ve seçilen kaynaklar ve Kayıt Kayıt Kayıtı 源、服务端名称、Registry 版本、记录摘要以及凭证摘要共同计算出一个哈希──生成的出处摘要(来源摘要) tam bir kanıt zincirinin 紧指针, ancak tam bir orijinal kanıtın kalıcı kalıcılığını asla değiştiremez.

绝不能直接接受由待验工件本身单方面提供的摘要――, güvenilir bir indirilen sınırda yeniden hesaplanmış bir摘要, veya onaylanmış olan çalışma sonuçlarını kabul eden bir güvencelik paket yönetim hizmetinden alınmalıdır――

### 3. Sıkı bir karar, sadece sabit bir versiyon değil

Registry  versiyonu tek yayınlama işaretçisidir. Yayınlanan veri değişmez. Kayıtların herhangi bir değiştirilmesi tamamen yeni bir sürüm için yayınlanmalıdır.

Bu da benzer bir şey demek.`^1.4`Bu ifade yasal değil Pin, denilen latest更不是──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

```json
{
  "server": "com.example/inventory",
  "version": "1.0.0",
  "recordDigest": "...",
  "source": {"kind": "package", "registryType": "pypi"},
  "sourceDigest": "...",
  "toolsetDigest": "...",
  "provenanceDigest": "...",
  "registryStatus": "active"
}
```

Bir çok farklı düzeyde aynı anda parmaklık sabitlenmesi, bir sıra sıralamalarda hangi sınırların değişeceğini hızlı bir şekilde belirlemenizi sağlar: aynı Registry  versiyon altında kayıt resmini değiştirmek, Registry'ye ait veri tamamlığı bozulması; aynı yazılım paketinde oturma veya uzaktan görevlendirmek altında kaynak resmini değiştirmek, yürütme kaynağı değişmek; araç kümesi resmini (toolset digest) değiştirmek, çalıştırma sırasında davranışın hareketine aittir.

### 4. 实时运行时漂移检测

准入流必须主动观测实际接收业务流量的服务端实例──通过信任通道调用 `server/discover`, listelenmesi veya ortaya çıkışını elde etmesi için kullanılan araç tanımlayıcıları, ve onaylama:

- `supportedVersions`İçeriyor`2026-07-28`- ...
- Tüm gerekli yetenekler mevcuttur.
- Her bir araç tanımlayıcıda bir kural tanımlama ve Şema tanımlama yüzeyi vardır.
- 规范化后的描述符摘要在后续复查时与已准备的固定指纹完全一致──

结果中可选的 `_meta["io.modelcontextprotocol/serverInfo"]`Sadece kendi kendine ait olan bir gösterim, 日志与排错上下文──**绝不能**Bu, bir verileme alanı, bir yazılım paketinin sahibiliği, bir giriş izni veya herhangi bir güvenlik kararı için bir temel olarak kullanılır.`_meta`Dışişleri doğrudan`serverInfo`别名更不属于官方契约字段, kesinlikle yasal teşhis kanıtı olarak yükseltilmesi gerekmez.

Bu ders örneği, sabit bir araç adı ile araç listesine göre düzenlenir. Bu nedenle saf bir şekilde geri dönüştürülen sıralama değişimleri, hareket olarak yanlış bildirilmez. Ancak, tanımlayıcıdaki herhangi bir bölümden asla vazgeçmez. Yeni araçlar, Şema'yı değiştirmek, Yazı metnini değiştirmek veya yeni bir açıklama getirmek için hemen değişen araçlar cömertliği özetleri vardır.

Örnek kod, herhangi bir biçim hatası tanımlayıcı veya tanımlayıcı özetinin değişimlerini davranış olarak görerek, hemen bu parmak iziyi ayırmak, karantinaya almak, aktif yollarını kaldırmak ve geri dönüş hedefi olarak kullanma hakkını kısıtlamak için kullanılır.

### 5. Kayıt  durumu is realtime动态 durumu

Kayıt API'si her servis uçusunda kayıtların yanında bir cevap sınıfı eklenecektir.`_meta`Görevi: Kayıt tarafından resmi yönetim tarafından depolanan`_meta["io.modelcontextprotocol.registry/official"]`路径下──准入控制器需解析该响应并读取 `_meta["io.modelcontextprotocol.registry/official"].status`                                                                                                                                                                                                                                                              `_meta.status`Resmi bir iletişim biçimine uymayan bir durumdur. Dış tepki verilerini kayıt içindeki yayın verilerini ile karıştırmayın.

- `active`:默认返回,本地准入候选资格;
- `deprecated`: İptal edilmiş, hala kontrol edilebilir ama polisle birlikte, otomatik önerme seçeneği için işbirliği yapmaya uygun değil;
- `deleted`: silinmiş, öntanımlı listede gizlenmiş, ama silinmiş veya artış açısından bağlantı yoluyla yapılabilir

准入完成后必须持续同步状态―― orijinal aktif versiyon imha veya kaldırılması olarak işaretlendiğinde, parmak izlerini hemen ayırmalı ve yeni akım yoluyla ayrılmayı bırakmalı―― aynı zamanda tüm tarihsel sertifikaları  yukarıdaki kayda göre listeden silinmelidir, bu da yerel olarak silinebileceğiniz bir şey değildir.

Yayıncı tarafından kendiliğinden sağlanan kendiliğinden tanımlanmış veri , yayım kayıtlarında sadece kaydedilebilir .`_meta.io.modelcontextprotocol.registry/publisher-provided`❖Registry 托管的响应元数据是完全独立的──绝不能允许发行者自行改变其官方状态──

### 6. Geri dönmek , geri dönüş anlamına gelir .

Değişmez yayınlama kayıtları, dönüşüm sürecinde asla değiştirilmez.

Bir güvenli dönüş hedefi aynı zamanda karşılanmalıdır:

1.  tam ve yasal giriş kaydına sahip olmak;
2. Şimdiki yerel stratejide, kayıt durumunun aktif olarak kalması;
3. İletişim sırasında herhangi bir güvenlik belgesi veya güvenlik belgesi ile ayırt edildiği durumda bulunmamış;
4. 仍然能精确解析到已固定的软件包和线上描述符集合;
5. 通過当前最新健康檢查──

Bu ders örneklemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemelemeleme

### 7. Ekstra准入账本

准入数据库 yalnızca şu anda aktif olanların ne olduğunu açıklayabilir, 准入账本 (Admission ledger) ise neden olduğunu kaydeder.

Bu ders defterindeki her kayıtlı madde, başlangıç, zaman, olay türü, servis merkezi tanımı, sürüm sayısı, karar sonuçları, nedenler, kanıtlar kitlesi, önceki bir hat ve bu proje hatlarının sonuçlarını değiştirerek, bu kayıt ve tüm sonraki zincirlerin hatlarının tamamen başarısız olmasına neden olur.

Bu, kontrol yeteneğini değiştirme yeteneğine sahip bir mekanizmadır, ancak sihirli bir şekilde bozulmaz. Bu düzenli olarak hesaplarını bağımsız bir güven alanına, örneğin dijital imzaların yayınlama sistemine veya tek yazılı bir deposu olarak belirlemeli.

## Çözüm

Kontrol cihazı kodları doğrudan çalıştırılır`code/main.py`中, hepsi Python'a dayanıyor 標準库实现──

首先运行有限状态演示:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift
python3 code/main.py
```

Bu gösterim beş temel işlevi gerçekleştirir:

1. 准入 `1.0.0`,核验匹配的命名空间、包出处、协议版本、能力及工具集;
2. 准入 `1.1.0`Ve aktif bir yol olarak değiştirir.
3. Gelişim sırasında beklenmedik bir silme aracı izle;
4. 观测到 `1.1.0`Kayıtlardaki resmi durum değişir`deprecated`- ...
5. Yol düzeltme, öncesine kadar devam edecek.`1.0.0`固定指纹──

预期输出结构:

```json
{
  "admitted": [true, true],
  "driftAllowed": false,
  "rollbackAllowed": true,
  "activeVersion": "1.0.0",
  "ledgerValid": true
}
```

建议按以下顺序研读实现代码:

1. `namespace_for_domain()`ile`namespace_matches()`: establishment of precised naming space identification rights border;
2. `digest()`ile`normalized_tools()`: kesinlik kanıtı özetini oluşturmak;
3. `RegistryAdmissionController.admit()`: bir araya gelerek kayıtlar, çıkış belgeleri, çalışma zamanları, gözlemler ve yerel stratejiler;
4. `check_live()`: En son gözlem verilerine göre belirlenmiş parmak izi;
5. `observe_registry_status()`: Registre  durumu değişiminin sürümünü gerçekleştirmek için ayrıştırmak;
6. `rollback()`Sadece önceden kabul edilmiş ve uygun olan yasal geri dönüş hedefi ile etkinleştirilmek;
7. `AdmissionLedger.verify()`Tarih kayıtlarının herhangi bir değişikliğine doğru doğru bir deneme yapılması.

## 运行与使用

Giriş kontrol cihazı, bulma ve yol arasında yerleştirilir:

```text
Registry sync -> artifact verifier -> live discovery -> admission controller -> route table
                                                |                 |
                                                v                 v
                                           evidence store    admission ledger
```

Bu görevlerin birbirinden ayrı olarak en az yetkiyi paylaşması için: Registry and the step tasks only need only read permissions of data; Work item verification tasks need to access software packages; route by adjustment and controllers need to activate the permission to obtain approval fingerprints;; hiçbir bileşen tüm yetkiyi öğrenmek zorunda değildir.

明确划分版本的状态模型:批准(已批准) 证券ın stratejik incelemeyi geçtiği anlamına gelir;Active(活跃) 代表当前路由正在选中它;Quarantine(已隔离) 表示禁止接收新业务请求;Superseded(已更换) 说明另一个已准备版真的处于活跃状态――绝不能使用单一的布尔值来混四种截然不同的状态――

必須在向 `tools/list`Bir hizmet servisi ortaya çıkmadan önce giriş sınavını gerçekleştirmek, yoksa müşteriye güvence stratejisi değerlendirmesinin yayınlama zaman penceresi                                                                                                                                                                                                                                               

## 交互式实验

Sen her sınırın bir yenilgiye uğradığını göreceksin.

### 实验 A:命名空间冲突

进入代码目录并打开 Python 交互环境:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/code
python3 -q
```

执行如下命令:

```python
from main import namespace_matches
namespace_matches("com.example/inventory", "com.example")
namespace_matches("com.exampleevil/inventory", "com.example")
```

İlk sonuç:`True`İkinci sonuç:`False`                                                                                                                                                                                                                                                              `startswith`, observe why the second evil name will break the boundaries.

### 实验 B: deskri符漂移

```python
from main import *
times = iter(f"2026-08-21T12:00:{n:02d}+00:00" for n in range(10))
c = RegistryAdmissionController(clock=lambda: next(times))
meta = {OFFICIAL_META_KEY: {"status": "active"}}
c.admit(sample_record("1.0.0"), meta, "com.example", evidence_for("1.0.0"), sample_live("1.0.0"))
c.check_live("com.example/inventory", "1.0.0", sample_live("1.0.0", True))
```

Kontrol geri dönüşünün nedeni ve yol durumu. Yazılım paketleri ve kayıt kayıtları hiçbir şekilde değişmedi, ancak çalışma sırasında araç yüzeyinde değişiklikler olduğu için, kontrol cihazı hemen ayırıldı ve sabit parmaklıkları durdurdu. Bu nedenle tedarik zinciri güvenlik kontrolü, kurulandan sonra tüm yaşam döngüsüne kadar geçmelidir.

### 实验 C: durum ve dönüş

准入 `1.1.0`, ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı ı

```python
c.admit(sample_record("1.1.0"), meta, "com.example", evidence_for("1.1.0"), sample_live("1.1.0"))
c.observe_registry_status("com.example/inventory", "1.1.0", "deprecated")
c.rollback("com.example/inventory", "1.1.0", "unsafe retry")
c.rollback("com.example/inventory", "1.0.0", "restore known release")
c.ledger.verify()
```

Ayrılıktan ayrılmış hedefler açıkça reddedilecek, ve öncelikle uyumlu olacak.`1.0.0`İşaretleri iyi aktif, hesapları hep geçerli kalır.

## 动手实践

Çııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııı

需求规范:

- 审核信息需要作为通过数字签名证的引用进行存储,必须作为可变字符串保存在指纹中;
- Bu ifadeye bir araç da dahil.`destructiveHint: true`Yüksek riskli araçlarda, iki farklı denetçi olarak imzalı olmak zorundadır.
- 拒绝包含重复身份的审批;
- Onaylama tamamlanmamışken, bu giriş girişiminin tam kayıtları hâlâ defterde;
- 编写测试,分别覆盖 0 人、1 人、重复身份以及 2 farklı yasal statusların onay senaryoları;
- Günlükte dijital imza, sertifika anahtarı veya tam özel araçlar için bir bölüm yazmak zorunda kalır.

验收标准: iki bağımsız denetçi eksikken, tamamen uyumlu kayıt özetleri, yazılım paketleri özetleri ve araç kümesi özetleri için imzalanan onaylar, yıkıcı araçlar kesinlikle aktif bir yol haline gelemez.

## 交付产物

本课程交付 `outputs/skill-mcp-registry-admission.md` Yeni bir kayıt yapımını veya bir çalışma sürümünü incelemek için, doğrudan tekrarlanabilir bir çalışma kitabı olarak değerlendirilebilir. Bu, giriş parametrelerini bağımsız olarak tanımladı, kuralları reddetti, kanıtları bağladı, durum düzenlemesini ve süreçleri ve dönüşüm sertifikalarını, herhangi bir özel örnek koddaki sınıf adlarına bağlı olmadan tanımladı.

## 验证标准

运行演示程序与全套确定性单元测试:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

测试套件:

- 精确的命名空间边界能成功拦截形似前的恶意名称;
- Sadece resmi isim değiştirme alanının kayıt durumunun, bu versiyonun adaylık için uygun olup olmadığını belirlemek için;
- Tecrübesiz veya içeriğiyle uyumsuz olan yazılım paketleri ve uzaktan uç noktası sertifikaları kesin olarak reddedilecektir.
- 官方托管元数据登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录登录
- 工具列表の排列が规范化され, aynı zamanda tanımlayıcıların esasındaki değişimi örtmeyerek yapıldı;
-  yapı değişikliği, güvenlik başarısızlığına yol açacak bir yazılım paket ve araç tanımlaması;
- `serverInfo`Sadece teşhis belgelerinde kalır, kesinlikle giriş yetkisini vermez;
- 描述符发生漂移时,系统会立即执行隔离、撤销路由,并封锁该指纹的回滚;
- Üst hareketli parmaklıkların ayırılmasına yön verebilir.
- Çekilmez veya bilinmeyen bir sürüm seçilemez;
- Bu kayıtların herhangi bir değişikliği hemen kontrol edilebilir.

## 生产环境故障模式

| 故障现象 | 发生原因 | 必须采取的应对措施 |
|---|---|---|
| 名称看似合法但命名空间从未经验证 | 准入策略轻信了记录内部的自述文本 | 严格拒绝，直到可信命名空间验证方提供精确前缀 |
| 相同软件包坐标拉取到了全新的二进制内容 | 上游版本被覆盖或分发源遭受投毒篡改 | 立即终止激活，保留两份摘要，调查拉取网络边界 |
| “latest”版本在未经人工审查的情况下发生漂移 | 浮动版本选择绕过了固定指纹机制 | 始终只解析和激活完全精确的已准入版本与摘要 |
| 安全审查通过后线上悄然出现新工具 | 发生了运行时行为漂移，或部署了不同镜像 | 隔离该路由，重新采集最新的实时描述符快照 |
| 已废弃的版本依然在线上持续运行 | 状态同步机制缺失或同步存在严重延迟 | 建立定时状态调和机制，并在每次路由激活前复核 |
| 已删除记录在默认同步中彻底消失 | 客户端只向 Registry 增量请求活跃记录 | 采用增量式或感知删除事件的调和机制，并在本地归档历史 |
| 回滚的目标版本根本从未通过准入审查 | 路由切换与准入审批状态彼此脱节 | 坚决拒绝回滚，强制对该目标走全新的准入流程 |
| 攻击者重写全部账本后本地依然校验通过 | 哈希链缺乏外部信任根的约束锚定 | 定期将带签名的账本头发布到独立的外部信任域 |
| 留存的凭据中泄露了 Bearer Token 或参数 | 日志和证据记录盲目复制了完整请求 | 在采集入口处执行脱敏，仅持久化留存最小必要凭据 |

## 运维守则

Yayınlama süreci, bu özel işlemi gerçekleştirmek ve bu özel davranışları büyük modelle ortaya çıkarmak konusunda emin miyiz? Bu iki kararı ciddi şekilde ayırmak, her bağlantı noktasına parmak izi sabitlemek, geri dönüşü, insan beyninin hafızasına bağımlı olmamak yerine, doğrulanabilir kanıtlara dayanarak yapılan bir tasarım hareketi haline getirmek için zorunludur.

## 延伸阅读

- [官方 Registry server.json 规范要求](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md)
- [官方 Registry OpenAPI 接口定义](https://registry.modelcontextprotocol.io/openapi.yaml)
- [MCP 2026-07-28 服务端发现规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
