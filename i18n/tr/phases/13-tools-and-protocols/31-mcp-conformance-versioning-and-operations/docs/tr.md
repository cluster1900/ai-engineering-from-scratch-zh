# MCP 致性工程: versiyon kontrol, kanıt ve taşımacılık

> 服务端不能因为正常路径在某SDK中巧合运通就称一致合规;; gerçek uyumluluk mevcut orijinal 线路上、版本边界间、穿越中代理时,以及面临回滚的时刻;;

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 17 (gateways), Phase 13 · 30 (registry admission)
**Time:** ~100 minutes

## Öğrenme hedefi

- Nöbetçi bir MCP 协议规则将规范性的 MCP 协议规则转化为黄金记录(金) 与负面拒绝(负面)交互语料库──
- Çok ciddi.`2026-07-28`行為与受约束的旧版回退 (Hadisyenin geri dönüşü)
- 精确区分附加性未知字段与非法的未知 `resultType`- Evet.
- İlk JSON-RPC testi ile SDK'nin standartlaştırılmasından sonraki görünümün karşılaştırılmasını yapın.
- Gerçek bir temsilci seviyesinde, HTTP başlıklarını ve istekçi olanları incelemek için uyum ve bütünlük gerekir.
-                                                                                                                                                                                                                                                               

## 核心问题

SDK'den geçerek müşterilerinize ulaştırdı .`tools/list`Not found tool list.

Ama bu, çözülmeyen birçok önemli soruyu bırakıyor:

- İsteyecek bildirimde modern talep ayrım anlaşması verileri gerçekten taşıyor mu?
- `MCP-Protocol-Version`- Evet.`Mcp-Method`和 `Mcp-Name`JSON-RPC isteklerine tam olarak uymuş mu?
- 响应报文在线路上是否合法 `resultType`Ya da SDK'nin kendi kararına göre tamamlanmış mı?
- 客户端能否无损保留未来前向附加字段?
-  Anlaşılan Modern Protokol hata kodunu aldıktan sonra, eski sürümdeki el sürümünün indirilmesine neden olur mu?
- Orta ajanın kaynak istasyonunun HTTP durum kodu ile JSON-RPC  yanlış ayrıntıları tam olarak aktarıp geçmesi mümkün mü?
- Tek yönlü bildirimlerin düzenlenmesi için bir cevap bildirimi yayınlandı mı?
- 运维团队, bir versiyonun neden yükseltildiğini veya neden geri döndürüldüğünü kanıtlamak için, açıklanmamış bir sertifika anahtarı şartıyla, bir versiyonun neden yükseltildiğini kanıtlayabilir mi?

协议一致性, objektif gözlemlenebilir değişkenliklerin bir grupudur.

```figure
mcp-conformance-operations
```

## Şimdiki sürümden

MCP `2026-07-28`规范采用了完全自包含的按请求元数据(per request metadata)`params._meta.io.modelcontextprotocol/protocolVersion`和 `params._meta.io.modelcontextprotocol/clientCapabilities`                                                                                                                                                                                                                                                              `protocolVersion`Ya da`clientCapabilities`裸键均属于格式变化── HTTP 边界存在镜像路由标题时,其数值必须与 JSON-RPC 请求体严格一致──现代规范下所有成功的响应结果都必须携带──`resultType`- Evet.

Ve sonrakine kadar.`2025-11-25`Bu dönemde, eksikliği var.`resultType`Eski sürümün sonucu ancak müşteri tarafından açıkça görüşülmüş ve bu eski sürümün tarihinden sonra açıklanarak tamamlanmıştır.

绝对不要编写一个同时宽容接受两种格式的万能宽松校验器──必须严格分为两种独立分支:

| 分支 | 准入凭证 | 缺少 `resultType` 的处理 | 初始化握手 |
|---|---|---|---|
| 现代纪元（Modern） | 成功的 `server/discover` 或已识别的现代响应 | 判定为非法（Invalid） | 不再作为默认建立连接路径 |
| 旧版纪元（Legacy） | 现代探测无果后，目标命中白名单且返回合法的旧版 `initialize` 响应 | 解释为 complete | 该纪元所必需的强制步骤 |

Bu sıkı ayrım biçimsel hatalı modern noktayı, sınavın kolaylığı ve sınavın başarısı nedeniyle ortadan kaldırmıştır.

### 严格模式

严格模式(Strict mode) gereksinimleri, bir süreliğine başarılı bir anlaşma yapmalarının doğrudan kanıtı olarak ortaya çıkması gerekir.`server/discover`即可确立现代分支──收到已识别的现代 JSON-RPC 错误(如`-32020`- Evet.`-32021`Ya da`-32022`) aynı zamanda modern bölgeyi de belirleyebilir.**绝不能**降级回退到旧版协议──

### Geri dönüş modeli

Geri dönüş modu (Fallback mode) bir kez sınırlı sınırlı modern arama yapmasına izin verir. Eğer bir kez aşırı zamanla karşılaşırsa, boş tepki, bağlantı kesimi veya tanımlanamayan tepki, bunlar  sonucu olmayan  (Inconclusive)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel) )  (öntemsel)  (öntemsel)  (öntemsel)  (öntemsel)  (ön)  (ön)  (ön)  (ön)  (ön)  (ön)  (ön) )  (ön)  ( ()  ()  ()  ()  ( ()  ()  ( ()  ()  ( ()  ()  ()  ( ()  ()  ()  ()  ()  ()  ()  ( ()  ()  ( () () () () () () () () () () () () () ( () () () () ( () () () () (`initialize`结果及协商版本通过验证后,才能正式切换到旧版分支──

Geri dönüş kesinlikle  bir kez haber hatası                                                                                                                                                                                                                                                          

Bu tasarım saldırganı, ağ arızalarını veya aşırı hareketlerini kasten modern tepkiyi zorla düşürmekle önleyebilir. Lütfen sonsuz modern gözlemler, doğru doğruluk belgelerinin eski sürümlerinin ve son olarak seçilen sürümlerin tarihsel kayıt kayıtlarını oluşturun.

Her bir iletişim kaydı yanında belirgin bir işaret belirlenmiş bir dönem olmalıdır. Eğer bir dönemden ayrılırsa, bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir dönemden bir süreye kadar ölümcül bir dönemden bir dönemden bir dönemden bir süreye kadar geçerli olarak kabul edilir.

## 构建交互记录语料库(Transcript Corpus)

Bir düzenli iletişim kayıtı 具 (fix) kayıt, sadece SDK katmanının düzenlenmesinden ziyade, gerçek geçiş sınırının gerçek haberini kaydeder:

```json
{
  "name": "golden-modern-list",
  "era": "modern",
  "headers": {
    "MCP-Protocol-Version": "2026-07-28",
    "Mcp-Method": "tools/list"
  },
  "request": {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {
      "_meta": {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {}
      }
    }
  },
  "responseStatus": 200,
  "responseBody": {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
      "resultType": "complete",
      "tools": []
    }
  }
}
```

测试语料库 iki büyük kayıt türü korunmalıdır:

### 黄金记录(Gold Transcripts)

黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金记录 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄金 黄

- Anlaşımlar ve belirtiler ile uyumlu modern bulgular veya yöntem istekleri taşın;
- 携带必需字段的完整结果(`complete`);
- Bu yöntem daha fazla iletişim gerektirir.`input_required`Sonuçlar
-  Sadece önceden açıklanan tepki yeteneğinin geri dönüşü için izin verilen genişleme sonuçları;
- "Onlar, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir sürece, bir sürece, bir sürece, bir sürecececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececece`resultType`Yaşıt bir sonuç.
- Notation processing 处理过程の任何 JSON-RPC 响应の返回を返さない.

Altın kayıtları, belirsizlik üretimi stratejisini veya oranın öncesinde düzenlenmiş bir şekilde değişen kimlik ve zaman için doğru ve sıkı olmalıdır.

### 负面记录(Negatif Transkriplar)

负面记录, ihlallerin kesin olarak reddedildiğini kanıtlamak için kullanılır:

- Başlık talep ile uyumsuz;
- 缺少对每次请求的能力声明;
- 协商版本 desteklenmiyor;
- 现代请求下缺失  modern çağrı`resultType`- ...
- Bilinmeyen veya bilinmeyen bir haber.`resultType`- ...
- 响应中   响应中`jsonrpc`- Hayır .`2.0`, veya geri dönüş ID'si sayısal değer veya JSON  türüne uyumsuz;
- Aynı zamanda içerir.`result`和 `error`, veya her ikisi de eksik;
- 缺少整数 `code`Ya da bir kelime.`message`Yanlış bir şey;
- Bilinen protokol hatası yanlış bir HTTP durum kodu olarak görüntülenir;
- İletici 错发送了响应;
- 变的 JSON-RPC 信封格式;
- Bir anlaşma hataları için bir temsilci var.

                                                                                                                                                                                                                                                              `-32020`Bu, başarısızlık olarak adlandırılabilir, ancak taşımacıların bilgileri tamamen aynı anda konuşulamaz.

标题不匹配的测试器必须强制断言服务端实际返回了HTTP 400,并带有匹配的请求 ID与错误码 `-32020`❖ Her gün yerel okul denetleyicisi tarafından gözlemlenir.`HeaderMismatch`Bu nedenle, bu ifadeyi zorla yerine getirmek gerekir, ancak seçilebilir bir işaret olarak kabul edilmez. Eğer isteksiz HTTP 500'i geri döndüğünde, yerel olarak belirlenmiş bir reddedilme kodu doğru olursa, test başarısız olur.

官方 MCP 一致性测试套件 değerli bir dış standart ve versiyon referenceslerdir. Ancak, genel kamu test kitlesinin belirli bir temsilciyi, belirli bir SDK'yi, belirli bir tanımlama akışını ve üretim yayın yolunu kapsayabildiği için kendi iletişim kayıtlarını yerel olarak korumak gerekir.

## 标标值必须与RPC 要求体匹配

Modern Streamable HTTP protokolünde, orta temsilci, görüntü etiketlerinin yürütülmesi veya güvenlik stratejisini gerçekleştirmek için kullanılabilir. Ancak JSON-RPC istekleri her zaman protokol katındaki tek gerçek kaynağıdır.

必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須: 必須:

1. 解析并校验 JSON-RPC 信封及元数据字段类型;
2. - Ben de .`MCP-Protocol-Version`ile`params._meta.io.modelcontextprotocol/protocolVersion`- ...
3. - Ben de .`Mcp-Method`ile`method`- ...
4. Bu yöntemin belirli bir yol adı vardır.`Mcp-Name`&quot;&quot; dilekçede
5. Tamamen uyumlu bir şekilde belirlenince, uyumlu bir protokol sürümünün ve kapasite grubunun desteklendiğini yeniden belirle.

Bu ilk sırada bir hata olacak .`-32020`Çözüm: % 1`-32022`清晰区分开来──它也可以从根本上防止网关校验和批准标签中的安全工具,而源站实际上执行请求体中恶意工具的欺诈攻击──

HTTP 字段名不区分大小写,但其字段值严格区分大小写.`Mcp-Name`, önce onu tam olarak belirlemeli .`=?base64?{Base64EncodedValue}?=`UTF-8 哨兵编码,再与请求体比对──未完成哨兵、无效Base64、非法 UTF-8 或未编码的不安全字符,一律以`-32020`拒绝──未编码的原始首尾空白即便是与请求体字符完全相同的也属于非法, çünkü aktarım kuralları zorunlu olarak bu tür değerleri aktarmadan önce görevlilerin tarafından kodlanması gerekir.

Orta ajan MCP servis ucundan gelen bir istekten önce doğrudan değişen HTTP raporunu reddedebilir, bu nedenle rapor hatası JSON-RPC'nin saf HTTP hatasını içermez.

## Bilinmeyen bölümler Bilinmeyen sonuçlara eşit değildir

后向兼容'ın gerçekleşmesi için iki farklı kuralın uygulanması gerekir:

### 附加未知字段

结果对象(Result nesneleri)`_meta`映射表中随时可能增加新字段. 校验器应根据自己的职责定位,选择无损传传保留或安全忽略这些附加字段,除非该字段直接违反保留关键字的契约.                                                                                                                                                                                                                                      `futureHint`Bu da bir artış.

Eğer açık bir temsilciyseniz, bilinmeyen bölümleri korumak genellikle körden daha güvenli olur; eğer son uygulama müşterisiyseniz, bunu göz ardı etmek yasaldır. Ancak her neyse, fark testi kitleri SDK'nin bu bölümleri sıralanma sırasında terk ettiğini doğru şekilde ortaya çıkarmalı ve bu davranışın, beklenmedik bir ihmal değil, düşünülmüş bir tasarım kararı olduğunu sağlamalıdır.

### Bilmiyorum .`resultType`

`resultType`属于核心生命周期判别器 ()                                                                                                                                                                                                                                                          `complete`ile`input_required` Genişleme anlaşması, yeni değerlerin ancak kendi çözüm kapasitesini önceden açıkladıktan ve müzakere başarısından sonra, yeni değerlerin getirilmesine izin verir.`task`)。

Bilinmeyen veya açıklanmamış ilanların sonuç belirleyicisi için, asla kendiliğinden başvurulması mümkün değildir.`complete`Bu nedenle, müşteri, kendi gözleriyle terk ettiği yaşam döngüsü durumunun ne olduğunu anlamayacak.

İlk cevap raporu ile birlikte, tamamen aynı zamanda  yasayı bilinmeyen genişleme alanı  ile  ölümcül olmayan bilinmeyen sonuç türü                                                                                                                                                                                                                                              

判別器只是校試的第一门,后也必须根据具体方法校試的专属载荷──`tools/list`Bu sonuçlar içermelidir.`tools`sayı, ve tanımlayıcıları boş olmayan eşsiz isimleri, açık açıklamaları ve nesne köken noktaları vardır.`inputSchema`- ...`task`Sonuç sadece görevlerin yasal olmasıdır .`tools/call`中有效,且强制要求包含 `taskId`、Bilgili durum 、 Oluşturma ve güncelleme süresi 、`ttlMs`Ve yasal sorgular arası;`completion/complete`Bu sonuç 100'den fazla karakter içermez.`completion`Objektifler ve seçilebilir negatif olmayan toplamlar`total`Ve seçilebilir değer`hasMore`▽ 拼写正确的`resultType`绝不能提供免除的形式残缺的负载.

## İletişim tek yönlü değişmezliği

JSON-RPC İletişim 消息没有 `id`❖ Alışveriş**绝不能**Dışarıya göndermek için herhangi bir JSON-RPC başarısı veya hata 响应报文。

HTTP'de başarılı bir şekilde alınan bildirim için test kitleri beklenen servis端'i boş bir HTTP talebi olan bir HTTP'ye geri gönderir.`202 Accepted`MCP`2026-07-28`规范并未在 Streamable HTTP 上定义核心的客户端到服务端通知──本课例只使用一个带有命名空间的课程扩展通知,专门用于验证传输层序列化器是否满足绝不回复任何JSON-RPC 报文的不变量──请勿误认为它是新的核心协议方法──

Test sırasında en dış katmanlı sıralamacıyı kaplamalıdır, ancak sadece test işleme fonksiyonunun kendisi değil.`None`Ama dış katmanlı orta parçalar otomatik olarak paketlenmiş.`{result: null}`JSON Başarılı Cevapları:

## 引入 SDK 差异对比(SDK Farklılık)

SDK'lar genellikle alt katlı bağlantı nesnelerinin paketlenmesini yüksek dil içe aktarılmış kolay veri türlerine dönüştürür. Bu gelişme deneyimini arttırır, ancak düzenlenmeden sonra nesnelerin ağ bağlantılarına geri dönüştürülemez hale gelmesine neden olur.

 her yüksek risk test kullanımı için, aynı anda dört katmanlık bir görüntü elde edilmelidir:

1. SDK 解码前'nın orijinal HTTP 状态码、响应标标与响应体;
2. SDK  normlandırma dönüşümünden sonra çıkış yapan değerlerin geri dönüşü nesneleri veya anormal örnekler;
3. 针对当前选定版本纪元的预期语义映射投影;
4. SDK 提升、无中生有合成、强行剥离或改的字段清单──

Gösterme kodları SDK'yi  Sadece Bilinen Lineu protokollerini çıkarmaya izin verir`resultType`- Evet.`_meta`- Evet.`ttlMs`和 `cacheScope`), aynı zamanda alt düzey iş yükü karşısında.`futureHint`, test suetleri bu şekilde açıklanmaktadır.

Bu tür gizli dönüşümlerin tamamen belirgin hale gelmesinde temel hedef vardır. Komponent konumunuzun gerçekten bir izin bırakma ek bölümlerin uygulama uç noktası olduğu, ayrıca bir bölümlerin sadık olarak korunması gereken bir açık temsilcisi olduğu açıkça görülür.

Yayınlanmadan önce, sürdürdüğünüz her SDK ve hedef sürümleri için farklılık testi yapılmalıdır. Eğer iki farklı SDK'nin tamamen aynı etkileşim kayıtlarına farklı normlaşma çıkışı oluşursa, yayım stratejisi hangi davranışların norm yasal olduğunu, kesinlikle mümkün olmayan ve nadir bir şekilde karar vermelidir.

## Yaptığım kanıtlar

Üretim ortamında MCP'lerin büyük çoğunluğu çatlaklıkların tümü, bir süreç boyunca veya bir aracı aracı aracı aracılığıyla yapılan bir ağ sınırında meydana gelmektedir.

| 视角 | 最小必要凭据 |
|---|---|
| 入口（Ingress） | 客户端原始请求头、JSON-RPC 请求体、Content-Type、已认证路由、接收时间戳 |
| 源站（Origin） | 代理转发出的标头与请求体哈希、源站 HTTP 状态、源站响应头与响应体 |
| 出口（Egress） | 客户端最终可见的 HTTP 状态、响应头、最终响应体、发送时间戳 |

Örnek kod özellikle iki en yaygın temsilci değişikliğine yönelik olarak test yeteneğini oluşturdu:

- 源站原本规范返回的 HTTP 400 veya 404 JSON-RPC 协议错误, ortalama ajan tarafından basitçe sertçe genel kullanım HTTP 500'e dönüştürüldü;
- En son gönderilen müşteriye gönderilen çıkış JSON-RPC Arama ve kaynak istasyonunun geri dönüş içeriği içerikli olarak değişmektedir.

Ÿ Gerçekte deployment yapılarına göre, ayrıca Content-Type için de genişletilmiş olabilir.`Accept`、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、

## 证据离开内存前 yapılır

脱敏, konularda yapılan düzeltmelerin sonucunda değil, uyumluluk sisteminin temel yapısal adımlarına aittir. 脱敏, sertifika sıralanması, hesaplama, yazma, kayıtlama, test işlemi veya üst-üstüne gönderme hatası raporundan önce, 脱敏, memedede tamamlanmalıdır.

Örnek kodları önce birleştirilmeden önce birleştirilmeden önce küçük yazılar yazılmadan önce tüm bağlantı noktalarını çıkarır ve sonra tekrar silinir.`Authorization`- Evet.`Cookie`- Evet.`Set-Cookie`- Evet.`X-Api-Key`- Evet.`accessToken`- Evet.`clientSecret`- Evet.`registrationAccessToken`- Evet.`token`- Evet.`password`- Evet.`secret`Ve `api_key`Çevreye düşen ve değişen bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan bir gruptan oluşan gruptan oluşan gruptan oluşan gruptan oluşan gruptan oluşan gruplar.`query`Bu gibi görünen zararsız anahtar isimler, kişisel gizlilik veya düzenleme denetim verilerini de içerebilir.

計算哈希时基于已脱敏的证据捆绑包进行计算. İlk de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de

## Sağlık kontrolü ve geri dönüşü için yasağı çıkartmak

协议层一致合规发布的必要条件,绝非充分条件―― 协议层一致合规发布的必要条件,绝非充分条件―― 协议层一致合规发布的必要条件, 协议层一致合规发布的必要条件, 协议层一致合规发布的必要条件, 协议层一致合规发布的必要条件, 协议层一致合规发布的必要条件, 协议层一致合规发布的必要条件, 协议层一致合规发布的必要条件, 协议层一致合规的候选版本, 协议层一致的候选版本, 协议层一致合规发布的必要条件, 协议层一致合规发布的必要条件, 协议层一致合规发布的必要条件, 协议层一致合规发布的必要条件, 协议层的候选版本, 协议层的可能发生超时时,内存泄漏或压下游依赖的条件――

Bu nedenle, bu durumun bir sonraki aşamasında, bir sağlık gözlem penceresi tanımlanması gerekir.

- En küçük istek örnek kapasitesi;
- Maksimum allowed error ratevalue;
- 延迟分位数(P95/P99) 上限;
- 资源和度与算力限制;
- 持续观测的时间跨度;
- Kılavuz kılavuz göstergesi ile karşılaştırıldığında:

Aynı şekilde, geri dönüş sertifikası da öntanımlı olarak hazır olmalıdır:

- 精确的前序版本标识;
- Önceki giriş belgesi
- SHA-256 工件与描述符固定指纹;
- 当前最新的登录 官方状态;
- Güncel sağlık denetim değerlendirme raporu;
- 经过过练习的路由恢复标准作业程序;
- Bu konuda bir bilgi sahibi olmak için, bu bilgiyi kullanın.

Bu geri dönüşün zorunlu gereksinimleri, başvuru versiyonu onaylanmadan önce sağlıklı ve onaylanmış durumda olması gerekir, ancak başvuru versiyonu çevrimiçi olarak patlamadan sonra geçici bir şekilde bir yol aramakla meşgul olmaktır.

Eğer aday versiyonu bir hata oluşursa, ve şu anda belirlenen geri dönüş hedefi tam bir giriş sertifikası desteği eksikliğiyle, sistem kararlı olarak durdurmayı seçmeli, hiçbir zaman normal görünen versiyonun geri dönüşüne güvenemez.

绝不要将就绪检查降级为非空字符串判断,`healthy: "yes"`Ya da istekli durum işaretleri. Örnek kodları, belirli bir tipin, aktif durumun, üç anahtar SHA-256 özetinin, güvenilir bir imza nesnesinin ve tam yükleme üzerine hesaplanan yasal HMAC-SHA-256 imzasının uyumluluğunu zorunlu şekilde gerektirir. Örneklerdeki kesinlik anahtarı gizli olmayan test üçümlerine aittir.

发布门禁还会坚决拒绝内容为空的交互记录、SDK 差异凭证或代理层证――每个证据源都必须提供有效摘要指针―― 一段看似全绿的健康曲线,绝不能用来掩盖一个从未真正被测试的系统边界――

## Çözüm

运行基于标准库实现的一致性工程框架:

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations
python3 code/main.py
```

Demonstrasyon programı, 15 grup altınla negatif etkileşim kayıtlarını (konformasyonla  değişimlerin otomatik olarak tamamlanması)  kullanımı örneklerini de içerecek. Demonstrasyon programı, orijinal verilerle SDK görünümlerinin farkına göre,  değiştirilmiş kaynak sitesi hatalı kodunun orta temsilcisini kontrol edecek,  Sağlık penceresi göstergesini değerlendirecek,  dönüşüm sertifikası dijital imzasını doğrulacak ve sonunda güvenli bir dönüşüm hedefini seçecek.

预期输出结构:

```json
{
  "transcriptsPassed": 15,
  "transcriptsTotal": 15,
  "sdkDroppedFields": ["futureHint"],
  "proxyIssues": [
    "proxy collapsed a protocol error into HTTP 500",
    "proxy changed the origin JSON-RPC body"
  ],
  "releaseAction": "rollback",
  "evidenceDigest": "..."
}
```

建议按以下顺序阅读 `code/main.py`Çıkış:

1. `validate_request()`: belirli bir sürüm için taleplerin başlık uyumluluk kurallarını zorla yerine getirmek;
2. `validate_result()`:精确分旧版缺失判别器、现代合法取值、扩展类型及未知类型;
3. `select_era()`• Sıkı bir modü ve kısıtlamalarla geri dönüş stratejisini gerçekleştirmek;
4. `run_transcript()`Altın kaydı ve olumsuz reddedilmeyi değerlendirmek;
5. `compare_sdk_view()`: SDK 规范化 sürecinde 字段差异leri ortaya çıkarmak;
6. `inspect_proxy()`: tüm bağlantı giriş, kaynak ve ihracat için üç önemli nokta;
7. `redact()`: kanıtların alıntılarını oluşturmadan önce açık bir hassaslıktan tamamen kurtulmak;
8. `rollback_evidence_ready()`:校验回滚指纹的精确字段与可信发布签名;
9. `ReleaseGate.evaluate()`Bu nedenle, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda, bu kararın sonucunda,

## 运行与使用

Bu uyumluluk test akışını yürütmek için yazılım geliştirme ve teslimatın dört anahtar noktası vardır:

1. Her zaman kod değişken, sürecin içinde test adaptasyon hızla çalıştırılır;
2. ), gerçek fiziksel aktarım katmanında çalıştırılan, inşa edilen müşteri ve servis terminalinin ikinci sınıf ürünleri için;
3. Önceden yayınlanan (Staging) ortamda, gerçekte deploymenın aksine temsilci veya net关运行;
4. Bu, bir diğer devirde yapılan bir çalışma olarak görülmektedir.

Tüm test seviyelerinde genel olarak uyumlu kullanım örneği tanımlama adı tutulmalıdır.`negative-header-body-mismatch`Tek birim testi, son sonuna kadar test, vekil testi ve birim raporlarında aynı değişkenliği temsil etmek zorundadır.

Testing System Enter version control Git)                                                                                                                                                                                                                                                        

## 交互式实验

### 实验 A:验证版本纪元边界

 Giriş`code`Python'u açmaya başlayın:

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/code
python3 -q
```

运行如下代码:

```python
from main import *
validate_result({"tools": []}, "legacy")
validate_result({"tools": []}, "modern")
```

Eski baskıda , bu konuda doğru bir sonucu var .`complete`Modern dönemde ise doğrudan atılır.`ProtocolViolation`异常──接下来测试回退逻辑:

```python
select_era({"kind": "timeout"}, "fallback")
select_era(
    {"kind": "timeout"},
    "fallback",
    legacy_allowed=True,
    legacy_evidence={"kind": "initialize_success", "protocolVersion": LEGACY_VERSION},
)
select_era({"kind": "jsonrpc_error", "code": -32021}, "fallback")
```

İlk süper zamanlı toplantı güvenliği başarısız oldu, çünkü sonun sessizliği kesinlikle eski sürüm protokolünün yasal kanıtı değildir. İkinci çağrı başarıyla eski sürüm seçildi, çünkü konfigürasyon açıkça yetkileri açtı ve yasal eski sürüm el tutma sertifikalarını gözlemledi.

### 实验 B: 附加字段与判别器对比

```python
validate_result({"resultType": "complete", "tools": [], "futureHint": True}, "modern")
validate_result({"resultType": "future_mode", "tools": []}, "modern")
```

İlk sonuç tam olarak saklandı.`futureHint`扩展字段;第二条结果则被坚决拦截,因为其生命周期判定器完全未知──

### 实验 C:检查 SDK 转换

```python
compare_sdk_view(
    {"resultType": "complete", "tools": [], "futureHint": {"mode": "new"}},
    {"tools": []},
)
```

结合你的组件定位评估: 当前系统是否允许丢弃 `futureHint`Bu proje kararını açıkça ekip yayın kurallarına yazmak için, kesinlikle dinlenmez.

### 实验 D:修复代理层问题

调整演示程序中的交互报文, böylece ihracat istasyonunun orijinal durumunu ve isteklerini yeniden gerçekleştirmek için 调整演示程序中的交互报文,使出口处能够忠诚通过传输源站的原生状态与请求体――重新执行`python3 main.py` Uygulamalar ortadan kaldırıldı, ancak SDK'nin hala bir bölümünü terk ettiği için, bırakmalar hala durduruldu.`futureHint`Bu nedenle, tüm boyutların tüm kanıtlarının sınavdan geçtikten sonra, gözlemci hareketleri düzenli olarak değiştirmek için`promote`- Hayır.

## 动手实践

Çeviri: SİZİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİYİ

需求规范:

-  HTTP 响应 durum kodu, İçerik Tipi, SSE olayları sırası ve bağlantı son sinyalini yakalamak;
- 证明, SSE üzerinden yayımlanan her JSON-RPC olayının, kendi sürümüne uygun sonuçları veya hataları vardır;
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
-  编写负面测试用例: bir SSE 事件中的 JSON-RPC id , başlangıçta başlatılan istek id ile eşleşmeyen bir hata tespit etmek;
- Durumların devam etmesi için kanıtlar sunulmadan önce tam olarak ölçülmüş bir şekilde hareket etmeleri;
- Bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumun gerçekleşmesi için, bu durumununununun gerçekleşmesi için, bu durumunununun gerçekleşmesi için, bu durumunununununununununununun gerçekleşmesi için,
-                                                                                                                                                                                                                                                               

验收标准: Aynı kullanım örneği doğrudan çalışabilmek ve aracı çalışmalar geçmek, ve üretilen değerlendirme raporları hangi 跳网络边界引发行为变化的位置的确确定可.

## 交付产物

本课程交付 `outputs/skill-mcp-conformance-release-gate.md` Bu cihazı herhangi bir servis, müşteri, ağ bağlantısı veya SDK'nin sürümünün değişikliği için kullanmak ve standartlardaki sürüm uyumluluğu matçına dönüştürmek için kullanmak. Bu ürünlerin orijinal yol sertifikası, olumsuz test sonuçları, açık bir danışmanlık kaydı, SDK'nin temsilci seviyesinin geçiş sertifikası, kayda dayanıklılık sertifikası, sağlık göstergesi kapısı ve tamamlanmış bir dönüşüm sertifikası sunması zorunludur.

## 验证标准

运行演示程序与全套确定性测试套件:

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

测试应严格证明:

- Altın ve negatif kayıtların 15 grupunun tamamı beklenen belirlenmiş sonuçlara ulaştı .
- 现代请求强制要求带精确命名空间的元数据键的使用;
- HTTP 标标题名称比对不区分大小写,且编码后的 `Mcp-Name`值被无损精准回原;
- 标头与请求体不一致时准确返回现代错误码  标头与请求体不一致时准确返回现代错误码  标头与请求体不一致时准确返回现代错误码 标头与请求体不一致时准确返回现代错误码`-32020`- ...
- 响应版本、ID 一致性、 sonuçlar ve yanlış bir karşı karşıya kalma、 yanlış nesne yapısı ve HTTP 映射ı sıkı bir şekilde denetlenmiştir;
- 强制执行针对 `tools/list`、Tüm görevlerin genişletilmesi ve tamamlanması için özel yükleme kuralları;
- Sadece ortaya çıkmak için.`HeaderMismatch`, HTTP 400 ile JSON-RPC'yi yakalanması gerekiyor .`-32020`响应;
- Çizgilik`Mcp-Name`首尾空白被拒绝,而使用哨兵编码的空白字符能精准往返原;
- 缺失 `resultType`Sadece belirgin olarak seçilen eski baskılar arasında yasal olarak görülür.
- 附未知字段能够安全保留,而未知生命周期结果类型则将被坚决拒绝;
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
-  Anlaşılan çağdaş protokol hatası kesinlikle eski sürümdeki protokolün derecelendirilmesine neden değildir;
- İletişim  kesinlikle herhangi bir biçimdeki JSON-RPC  yanıtı oluşturmaz;
- SDK'nin protokol kayıtlı bölümlerin normal ayrımı ve işletme anlamlı bölümlerin yanlış kaybedilmesi konusunda net bir şekilde tespit;
- 精准检出代理层对错码的吞没变,且在小驼峰与带连符等多种风格变体下均可归归脱敏证据;
- 晋级放行, aynı zamanda boş olmayan iletişim kayıtlarına, SDK 差異larına, vekil denetimlerine ve sağlık bölgesi içinde olanların taşımacılık belgelerine sahip olmalıdır.
- İster bırakılsın ister geri dönsün, her zaman bir imza sertifikası, parmak izi sabitlenmiş, aktif durumda ve sağlıklı geri dönme hedefini belirleyen bir zorunluluk gerektirir.

## 生产环境故障模式

| 故障现象 | 浅层粗糙测试的假象报告 | 测试工具链必须证明的实质 |
|---|---|---|
| SDK 擅自补全了缺失的判别器 | “tools/list 运行通过” | 原始线路上缺失现代 `resultType`，属于非法响应 |
| 收到 `-32021` 后客户端自行降级 | “旧版重试成功” | 收到已识别的现代错误绝不允许降级回退 |
| 未知结果类型被当成 complete | “响应成功解析” | 未经能力通告的生命周期判别器必须被坚决拒绝 |
| 代理批准了 A 工具而源站执行了 B 工具 | “请求成功抵达服务端” | 确保每一跳的 `Mcp-Name` 均与请求体中的路由名称严格一致 |
| 测试在读取服务端响应前自行报错终止 | “标头不匹配测试通过” | 必须真实捕获并验证 HTTP 400 及 JSON-RPC `-32020` 响应体 |
| 代理将源站 400 转换为通用的 500 | “上游服务端报错” | 源站与出口两端的 HTTP 状态及错误体必须原样保留 |
| Notification 中间件强行输出 `{result: null}` | “处理函数正常返回了 None” | 最终网络出口的请求体必须为空，且不存在任何 JSON-RPC 报文 |
| SDK 擅自剥离了前向附加字段 | “强类型对象转换一致” | 原始视图与规范化视图清晰指出具体哪一个字段被丢弃 |
| 事故排查工件泄露了 Bearer Token | “已成功上传调试数据包” | 在计算哈希、写入日志或上传网络之前已彻底完成脱敏 |
| 命名风格变体绕过了脱敏拦截 | “黑名单中已包含 api_key” | 小驼峰、中划线等所有变体在脱敏前均统一规范化为规范形式 |
| 金丝雀发布在毫无流量时显示指标全绿 | “零错误率” | 强制校验最小请求样本容量门槛 |
| 故障回滚切到了一个未经测试的未知构建 | “已恢复先前部署” | 回滚目标、准入摘要、固定指纹、状态与健康凭据必须全部完备 |

## 运维守则

Test etmek için gönderdiğiniz her gerçek şifreyi, test etmek için gönderilen her bir orta temsilci tarafından gönderilen gerçek şifreyi, test etmek için her SDK'nin dışta ortaya çıkan spesifik anlamını, ayrıca sürpriz yüksek basınç altında çalışan ekiplerin güvenmesi gereken teşhis kanıtlarını.

## 延伸阅读

- [MCP 2026-07-28 基础协议规范](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP 版本协商机制规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
- [MCP Streamable HTTP 规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [官方 MCP 一致性测试工程仓库](https://github.com/modelcontextprotocol/conformance)
