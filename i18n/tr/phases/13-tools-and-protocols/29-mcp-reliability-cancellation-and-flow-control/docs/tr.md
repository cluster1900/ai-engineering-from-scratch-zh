# MCP güvenilirliği, giderme ve kontrol

> İtiraf et, sadece bağlantılı mesajı istemez. Yan etkileri güvenli hale getiremez, arka plan iş sürecini durduramaz, ve verileri yavaş tüketicilerin gerginliğinden koruyamaz.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lessons 09 and 13
**Time:** ~120 minutes

## Öğrenme hedefi

- STUDIO ve Streamable HTTP ayrılığı doğru istek kaldırma sinyalini gerçekleştirmek için.
- 解決完成 (完成) ve取消 (取消) arasındaki rekabet durumu,
- 严格区分时请求取消与持久化 `tasks/cancel`Çeviri:
- ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆
- Gelişme sıralarının kapasitesinin sınırını belirlerken, son tepki atılmadığından emin olun.
- 通過再連結、权重拉(refetch) ve 带动的退避机制实现流的恢复──

## 核心问题

En pahalı dağıtımlı sistem eksiklikleri genellikle normal yolların dışında başarıyla uygulanır.

客户端调用一个工具――服务端开始执行――进度通知源源不断发发出――反向代理在中间缓冲了事件流――客户端触发超时并断开连接――服务端恰好在 1 毫秒后完成业务处理――客户端使用新的 JSON-RPC id 发起重试――于是,该操作写作转变) 两次执行――

Bağlantıda her bileşen kendi yerinden hiçbir hata görmedi, ama tüm sistem tüm yerden çöktü.

MCP  kuralları mesaj biçimi ve aktarım seviyesini tanımlar, ancak uygulamanız hala kişisel olarak sorumlu olmalıdır:

- 时间预算 (zaman bütçeleri);
- 业务等性 (işletme yetkisi);
- Çekilen sıralar;
- 重试分类(Retire sınıflandırması);
- 持久化任务状态 (Durable task state)
- 重连与重新拉取策略 (Yenileştirme ve yeniden bağlama politikası)

Bu ders, bu kararları bir belirsizlik simülatöründe inşa edecek. Burada uyku, gerçek ağ soketi veya herhangi bir sorun yok.

## Ürünler için geçerli olmayan bir uygulama

Hangi yolla aktarım protokolü kullanıldıysa kullanılsın, müşteriye yönelik amaçlar aynıdır: mevcut olarak uygulanmakta olan sonuçların artık gerekliliği yoktur.

### studio

stdio 采用单条共享的双向通道──客户端发送一个通知:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/cancelled",
  "params": {
    "requestId": 41,
    "reason": "User closed the operation"
  }
}
```

Bu bildirim ise 即发即弃(fire-and-forget)  servis端不需要且绝不能对对其返回任何 JSON-RPC 响应──

Servisci­ne, çalışma­nı durdurmalı, kaynak­ları serbest bırakmalı ve iptal edilen talebe cevap verme­meli.

形式错误、未知请求或针对已完成请求的取消通知都将被服务端默默忽略──如果将这些并发竞态转化为新错报文,只会引发更多竞态问题──

### Akışlanabilir HTTP

现代 Streamable HTTP için her istek bağımsız olarak dağıtıldı HTTP 响应或 SSE 响应流──客户端通过**直接关闭该请求的响应流**İndirme sinyalini göndermek için.

Çözümlü HTTP Lütfen POST gönder`notifications/cancelled`                                                                                                                                                                                                                                                              

Bir seferinde servis uçuşu bağlantı kesildiğinde, çalışma durdurulmalı ve hiçbir şekilde bu istek için herhangi bir sonraki mesaj gönderemez.

### 服务端发起的取消范围极其有限

服务端绝不能使用 `notifications/cancelled`Bu nedenle, stüdyo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `subscriptions/listen`监听请求―― bu çok dar bir yol ile müşteri tarafından başlatılan düzenli istekler arasında ciddi bir ayrım yapılması gerekir.

## 取消 bir maç halinde

İki olayın sırası tamamen yasal.

### 取消获胜

```text
request starts（请求启动）
client sends cancellation signal（客户端发送取消信号）
server marks request cancelled（服务端将请求标记为已取消）
worker reaches completion（工作线程执行完成）
server suppresses the response（服务端抑制并不发送响应）
```

### 完成获胜

```text
request starts（请求启动）
worker commits the result（工作线程提交业务结果）
server sends the response（服务端发送响应）
cancellation arrives late（取消信号迟到）
server ignores the late notification（服务端忽略迟到的通知）
```

客户端 de reddettiği isteklere karşı geç kalma tepkisini aktif olarak ihmal etmelidir.  Ağ gecikmesi varlığı nedeniyle, herhangi bir tarafın durum değişimini ilk gözlemleyen kişi olduğunu diğer tarafın kesin olarak kanıtlayamadığı görülmektedir.

```figure
mcp-reliability-race
```

本课的 `RequestCoordinator`Bir kayıt yok edildiğinde,`complete()`Hiçbir cevap geri dönmeyecek; ve geç saatte iptal bildirimi de tamamlanmış kayıtları asla değiştiremez.

## Süper zaman mekanizması iki saat gerektiriyor.

单一的无活动(无活动)计时器是远远不够的──

Şimdi iki zaman sınırı da dahil edilmelidir:

1. **空闲超时（Idle timeout）**Bu nedenle, bu süre içinde çok fazla zaman geçmiştir.
2. **最大超时（Maximum timeout）**Bu nedenle, bu programın başlatılması için gerekli olan programlar,

Durumsuz gelişmeler oluştu.**绝不能**推迟或消除最大截止时间──

```text
start: 0 ms
progress: 400 ms
progress: 800 ms
progress: 1200 ms
idle timeout: 500 ms
maximum timeout: 2000 ms
```

1500 ms'de, taleb hâlâ aktif bir durumda, çünkü önceki gelişme olayının mesafesinin sadece 300 ms'i geçtiği için. Ancak 2000 ms'de, en büyük sonlama, isteği kaldırmak zorunda kalacak, hatta 1999 ms'de yeni bir gelişme olayı ortaya çıkmış olsa bile.

进度通知是可选的. Servis端完全可以接受进度令牌 (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (进度令牌)  (超时时限)  (超时限)  (超时限限) 时限)  (

MCP'nin ilerleme değeri tek bir şekilde artmalıdır. Tamamlandıktan veya kaldırıldıktan sonra tüm bildirimler derhal durdurulmalıdır.

## Dilekçe取消不等于`tasks/cancel`

Bu iki mekanizma tamamen farklı yaşam döngüsü seviyelerindeki sorunları çözmektedir.

| 机制 | 作用目标 | 线路信号 | 成功意味着什么 |
|-----------|--------|--------|--------------------|
| stdio 上的请求取消 | 单次在途 RPC | `notifications/cancelled` | 客户端放弃了该请求；若可行服务端应当停止执行 |
| HTTP 上的请求取消 | 单个在途响应流 | 关闭该流 | 客户端放弃了该请求；若可行服务端应当停止执行 |
| `tasks/cancel` | 单个持久化 Task | 普通 MCP 请求 | 服务端已确认收到取消意图 |

`tasks/cancel`Bu işçi, işinin devam etmesini sağlayamadı.`working`状态, hasta işçi bir kontrol noktasında işaret çıkarma işareti algılamadan önce başarıyla gerçekleştirilmiştir.

HTTP bağlantısı kesildiğinde,**绝不要**清除持久化任务的状态――创建任务的初衷正是为了使其生命周期能够超越单次请求与单条连接的限制――

## Yeni JSON-RPC ID  kesinlikle 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性 等性

JSON-RPC idleri sadece bağlantı için kullanılır tek bir istek ve yanıt, onlar kesinlikle iş operasyonu kendileri temsil etmez.

假设客户端提交一笔账单扣款 (BİZD)`41`), ortalama olarak servisin yanıtını kaybetti, sonra ise müşteri kullanımı id `42`发起重试―― servis端'i iki farklı mesaj görüyor. Eğer uygulama katmanının tek tanımı yoksa, servis端'i aynı hesap talebini temsil ettiklerini anlamakta zorlanmaktadır.

等键 (İdempotency key) 明确代表了业务意图:

```json
{
  "name": "charge_account",
  "arguments": {
    "account": "acct-7",
    "cents": 1200,
    "idempotencyKey": "checkout-7"
  }
}
```

服务端会持久化记录:

- 等键;
- 操作参数的哈希指纹(argument parmak izi);
- 已提交的执行结果──

Aynı anahtarla aynı parametreler doğrudan önceki depolama sonuçlarına geri dönecektir. Aynı anahtar farklı parametreler taşıyorsa, kararlı olarak reddedilecektir. Bu, yanlış kullanım nedeniyle diğer farklı işletme işlemlerini değiştirmek için önleyebilir.

### 账本边界必须具有原子性和持久性

Aşağıdaki uygulama süreleri son derece tehlikeli ve güvensiz:

```text
check key（检查键是否存在）
run mutation（执行写操作）
store result（存储执行结果）
```

 iki işçi aynı anda bu anahtarın yok olduğunu fark edebilir ve aynı zamanda bu yan etkileri olan yazma işlemini gerçekleştirir. Daha da kötüsü, eğer bir işlem yan etkileri tamamlandıktan sonra ̊ depolama sonuçları çöktüğünde, tekrar deneme sırasında tekrar çalıştırma da meydana gelir.

Bu ders dosya tabanlı SQLite kullanıyor.`BEGIN IMMEDIATE`Anahtar kontrolleri, simülasyonlu iş yan etkileri, yürütme hesap makinesi ve sonuç depolamaları aynı işlem içinde sıralanır. İki bağımsız hesap bağlantısı aynı anahtarı kullanırsa bile, sadece bir gerçek iş yürütülmesi ve gönderilen sonuçları kaydetmekle sonuçlanır.

Tüm geri dönüş değerleri depolanan JSON yeniden yeniden yeniden yeniden düzenlenme üretimi üzerinden geçer. Kullanıcılar doğrudan hesapta bulunan değişken nesnelerin alıntılarını asla elde etmeyeceklerdir. Bu nedenle, Kullanıcıların geri dönüş sözlüğünü değiştirme ve kirlenme sonrası yeniden yayınlama sonuçlarının zararlarını ortadan kaldırırlar.

模拟器 içindeki iş yan etkileri aynı SQLite işinde bulunan alım ve hesap makinesi. Üretim ortamında gerçek ödeme, konteyner yerleştirme veya dış üçüncü taraf API kullanımı, hiçbir zaman yerel veri tablosuna dayanarak bir kayıt yazmak değildir. Atomik bir şekilde elde edilebilir.

### 重试决策矩阵

Yeniden deneme mantığını gerçekleştirmeden önce, yeniden deneme için net bir sınıf oluşturulmalıdır.

| 类别 | 示例 | 重试规则 |
|------|---------|------------|
| 安全（Safe） | 无副作用的确定性读操作 | 在明确故障边界后，可使用新的 JSON-RPC id 直接重试 |
| 有条件（Conditional） | 具备持久化幂等键的写操作（Mutation） | 必须使用完全相同的幂等键和完全相同的参数发起重试 |
| 不安全（Unsafe） | 未提供业务去重机制的写操作 | 严禁自动重试；必须先进入人工或系统对账调和流程 |

工具描述符中附带的   araç tanımlayıcı `readOnlyHint`和 `idempotentHint`Sadece inanılmaz dış ipuçları vardır. Gerçek yeniden deneme güvenliği tamamen uygulama seviyesinin anlaşma ve servis uçunun alt seviyesinin gerçekleşmesinden bağlıdır.

## 背压正确性 bir parçası

SSE üreticileri gelişme olaylarının üretimi hızını, müşteri, temsilci veya ağ bağlantısı tüketim kapasitesini çok daha fazla aşar.

必須有界隊列 (Binded queue) kullanmak, ve yüklenme sırasında neyi feda edebileceğimizi belirlemek.

进度通知是可替代的──对同一个进度令牌,后到的进度数值自然取代前者的旧值──然而,最终的JSON-RPC 响应绝对不可替代的──

Bu ders gerçekleştirilen缓冲区 aşağıdaki akış kontrol stratejisi uygulanmaktadır:

1. 合并(Coalesce) Aynı令牌相邻的进度更新;
2. Koordinat kapasiteden yukarı geldiğinde, en eski gelişme verilerini terk eder.
3. Olayların belirtilmesi için yetki gerektirir.
4. 始终完整保留最终响应;
5. Eğer son tepkiyi tutmak başka bir son tepkiyi değerlendirmek için bırakmak zorunda kalırsa, bu durumu reddeder.

Bu, açık bir kurtarma mekanizması olan 有界丢弃──静默丢失绝对不合规的策略──

### 代理缓冲问题

Servis端可能在完美流式输出中,而中间的反向代理却在私积事件缓冲中.

SSE  响应 için aşağıdaki 响应 başlıkları olmalıdır:

```http
Content-Type: text/event-stream
Cache-Control: no-cache
X-Accel-Buffering: no
```

2026 yılının Akışlı HTTP  规范强烈建议配置 `X-Accel-Buffering: no`Bu nedenle, Nginx gibi bir temsilci sunucuyu hemen bir zamanda müşteriye göndermek için kullanılabilir.

长期处于静静状态长连接,需定期发送 SSE 注释行(保活心跳):

```text
:
```

客户端会自动忽略注释行──中间代理设备则能够看到网络活动,从而避免切断看似空的连接──

传输保活不等于业务进步――绝不能因为收到传输层的保活注释就顺带重置业务操作的语义空超时计时器――

## Yeniden çekilmek demek.

现代 Akışlı HTTP 协议**不支持**- Evet .`Last-Event-ID`- Evet. - Evet.

- Evet .`subscriptions/listen`事件流意外中断后:

1. Yeni bir JSON-RPC kimliği kullanmak için yeni bir izleme istekleri başlatmak;
2. Yeniden kayıt için gerekli olan kayıt filtresi;
3. 调用权威接口全量拉取可能受影响的工具、资源、提示或任务;
4. Uygulanma aşamasında tüm sistemin tek belirtileri doğrultusunda yeniden yüklenme;
5. 绝对不要只因为前应失失就盲目重放未保护的危险写操作――

Örnekte geri dönüş programı açıkça `sendLastEventId`設定為 false,并列出需要全量重拉的资源清单──

### 防止重连风暴 (Kurt Etkisi)

Eğer 10.000 müşteri bağlantı kesildikten sonra tam 1 saniye boyunca tekrar bağlantıya geçirse, yeni kurulan servis servisi hemen tekrar açılacak.

Bu ders, birim testi tamamen tekrarlanabilir hale getirmek için, müşteri kimliği ve tekrar deneme sayısı temelinde kesinlik 动偏移 hesaplanması gerekir.

```text
attempt 0: up to 250 ms
attempt 1: up to 500 ms
attempt 2: up to 1000 ms
...
cap: 8000 ms
```

Üretim ortamı, kodlama güvenliği veya çalışmalar sırasında asansör sayısını kullanılabilir. Değişmeyenlerin merkezi belirli bir matematik formülü değil, zaman dağılımının dağılmasında yer alır.

## Çözüm

`code/main.py`5 temel temel yapı oluşturuldu:

### `RequestCoordinator`

-  Başlatma ve koruma için en fazla ikili çekim süresi;
- 发送单调递增的进度通知;
- STDIO ve HTTP arasında farklılık yaratma kurallarının kaldırılması;
- 忽略非法的取消通知;
- 顯示裁決取消與完成之間的終态竞彩;
- 确保服务端发起的取消仅用于studio 订阅。

### `MutationLedger`

- 演示Besiness key eksikliği durumunda, iki kez farklı JSON-RPC kimlik kullanımı iki kez tekrarlama gerçekleştirilmesine neden olur;
- SQLite'de dosya tabanlı bir iş yapımı, anahtar kontrolü, iş sonuçlarını simgeleme, hesaplama ve sonuç gönderme;
- 支持跨多独立账本连接, aynı 等键和完全一致参数的全局重重;
-  aynı anahtarı kullanmayı reddetmek ama parametreyi değiştirmek için;
- Değişkinlik ve güvenlik için geri gönderilen bilgiler, yeniden açıldıktan sonra da tam olarak saklanmaktadır.

### `DurableTaskService`

- "Bilgiyi onaylamak için yapılan bir talep"
- 保持 Görev 处于 `working`status, till工作线程主动检查到标记;
- Doğrudan da görevin sona ermiş olması gibi bir şey değildir.

### `BoundedSseBuffer`

- Yüksek basınç altında eski gelişmeleri birleştirmek veya ortadan kaldırmak;
- 明确记录当前流已需要进行权威数据全量重拉;
- Son cevapları asla bırakma.

### 恢复辅助工具

- 输出代理环境的 SSE标标题与保活心跳注释;
- Tam bir yük bağlaması ve tam bir yük yükleme uygulaması;
-                                                                                                                                                                                                                                                               

## 运行验证

Çıkış:

```bash
cd phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/code
python3 main.py
python3 -m unittest discover tests -v
```

Gösterim programı, iki yönlü temel yarış durumu, geçici dosyalarda SQLite'de yüklenme işlemlerine dayalı yazma işlemlerini tamamlamak, sınırlı ilerlemeli bir artan yükleme alanına yükleme basıncı uygulanması ve sürdürülebilirlik Görevini nasıl onaylanmış bir kaldırma işleminden işçiye adım adım geçiş yapılması, gözlem ve onaylanmış bir kaldırma işlemini göstermek üzere bir süre süre süre gösterecektir.

## 交互式实验

Uyku süresi eklenmeden önce, dört özel olayın ardından devam et.

1. Başlangıç talebi`A`,将其取消, 调用`complete()`- Evet.
2. Başlangıç talebi`B`, tamamlanıp, sonra da geç kalmış bir sinyal gönderilmiştir.
3. Başlangıç talebi`C`, her boşluktan önce tüm gelişmeler gönderilir ama en büyük mutlak süper zaman değerini en sonunda kırar.
4. Akışlı HTTP başlatma talebi`D`,并直接关闭其响应流──

 her türlü olay için kayıt:

- Yalvarın final deşe'nin final status;
- Son tepkiyi oluşturmuş veya oluşturmamıştır;
- Telefon hattında gönderilen sinyallerin iptal edilmesi;
- Müşteri olayları akimiyetle göz ardı etmelidir.

Sonra bir sahne olacak.`D`改为studio 传输―― iş operasyonu tamamen uyumludur, ancak iletişim hattında oluşan giderme sinyalleri değişmelidir.

## 动手实践

Çı`MutationLedger`扩展一个 `reserve_inventory`(库存预留) 写操作。

需求规范:

1.                                                                                                                                                                                                                                                               
2. Aynı anahtarı ve tamamen aynı parametreleri tekrar denediğinde, ilk üretilen ön kalma sonuçlarına doğrudan geri dönmek gerekir.
3. Aynı anahtarı kullanmak, ancak yeniden başlatıldığında, ikinci bir rezervasyon oluşturmak zorunda kalır.
4. Yazım işlemleri hizmette gönderildiğinde, ancak cevap geri gönderilmekte kaybolduğunda, destekleyici kredi ve diğer anahtarlar başlatılır.
5. Sonuçta gizli bilgiler veya ödeme hassas bilgileri kaydetmek mümkün değil.
6. Eğer kullanıcılar bu gibi anahtarları kullanırken sağlamıyorsa otomatik tekrar deneme mekanizmasını doğrudan kapatır.
7. Bu kayıtların tümü, bir karar vermeden önce, bir karar vermeden önce, bir kayıt kayıtlarının tümüyle yeniden oluşturulmasını sağlayan bir durumdur.
8. 启动两个位于同步屏障(Barrier) 前的账本连接,并发提交同一个等键──断言全局只有一次预留成功提交──
9. 改第一次返回的预留对象──重新传入该键进行重放,证明底层存储的真实结果没有受到任何污染──
10. ÖGÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜNÜÜÜÜ

Lütfen iş güveni koruyun: Eğer stok verileri aslında başka bir bağımsız mikro serviste bulunursa, bu servisin aynı anahtarı desteklediğini veya işlem gönderme kutusunu (Transaksiyonal Outbox) oluşturup yerel gönderme ve uzaktan yan etkileri ile bağlantı kurup oluşturmadığını açıkça belirtin.

## 交付产物

`outputs/skill-mcp-reliability-reviewer.md`MCP'nin üzümleri, aktarım katmanı, süper zaman stratejisi, tekrar deneme kuralları, sıralama stratejisi ve kurtarma mekanizması, yani tam bir rekabet analizi tablosu, tekrar deneme sınıf tablosu,  gibi sınır tanımları, akım kontrol kontrol kontrol kontrol listesi ve karşı karşıya hata test örnekleri üretmek için kullanılabilir.

## 验证标准

Aşağıdaki tüm görevler yerine geldiğinde, bu bölümün hedefi tamamlanmak demektir:

- stdio 取消操作发送 `notifications/cancelled`Ve hiç cevap almamıştır.
- Akışlı HTTP 取消操作直接关闭响应流,绝不发送多余的取消 POST 请求。
- 先取消后完成能正确抑制并抹除最终响应──
- 先完成手取消能保留合法响应并静默忽略迟到的取消信号──
- Gelişme bildirimi boşluktan sonra tekrar ayarlanabilir ama en büyük zaman için asla geciktiremez.
- Yeni JSON-RPC kimliğini değiştirmek, korunmadık bir yazma işleminin ikinci kez gerçekleştirilmesine neden olur.
- İki bağlantı ve birleştirme durumunda, aynı  eşli anahtar ve uyumlu parametreler sadece bir kez gerçekleştirilmesini sağlar.
- 已提交记录在关闭并重新开后完好保存,且重放返回是防御性副本──
- Düzgün dönüştürülen nesneler, alt katlı kalıcı depolama verilerini bozabilir.
- Sınırlı bir şekilde kontrol edilen bir buçukluk bölgesi, basınç altında ve kesinlikle son tepkiyi kaybetmez.
- Yeni bir istek başlatmak için bir yükleme mekanizması.`Last-Event-ID`,并全量重拉受影响状态──
- `tasks/cancel`检查点发现前保持非终态──

## 生产环境故障模式

| 故障现象 | 观察到的表象 | 正确处理方案 |
|---------|--------------------|------------------|
| HTTP 客户端 POST 发送取消通知 | 服务端与客户端对请求的生命周期产生分歧 | 直接关闭该请求专有的 SSE 响应流 |
| 服务端在接受取消后依然回传响应 | 客户端收到一份已无法使用的陈旧无用结果 | 当取消获胜时停止业务计算并抑制所有后续消息 |
| 进度通知无限重置所有超时时钟 | 挂起卡死的任务永久占用资源无法退出 | 维持一个独立的全局绝对最大超时硬上限 |
| 将新的 RPC id 当成请求去重依据 | 扣款、发布或删除操作被多次重复执行 | 在应用层引入并强制校验持久化幂等键 |
| 键检查与业务副作用彼此分离 | 并发执行的多个 worker 同时判定键不存在 | 将键占位、副作用记录与结果提交放入单次原子事务 |
| 在多副本集群中使用内存级账本 | 节点重启或换到另一台机器后遗忘了先前的提交 | 使用持久化共享存储或依赖上游系统的幂等支持 |
| 直接返回底层存储的可变对象引用 | 调用方的内存修改意外污染了后续重放结果 | 将提交结果序列化存储，返回时构造深拷贝副本 |
| 相同的键被复用于篡改后的参数 | 单个幂等键混淆了两种不同的业务意图 | 持久化记录并校验调用参数的哈希指纹 |
| 进度通知队列无界增长 | 遇到慢消费者时服务内存持续飙升直至 OOM | 在容量限制内对可替代的进度通知进行合并与淘汰 |
| 在高压下误丢弃了最终响应 | 客户端永远无法获知该请求的最终成败 | 预留专用容量或只淘汰进度通知，绝不丢弃最终响应 |
| 反向代理缓冲了 SSE 事件 | 进度事件呈突发性到达，或在全部执行完后才下发 | 禁用代理缓冲（`X-Accel-Buffering: no`）并调整代理超时 |
| 盲目假定支持 `Last-Event-ID` | 客户端尝试从服务端根本不支持的位点续传 | 使用新请求重连并向权威数据源全量拉取 |
| 所有客户端在断开后同一瞬间重连 | 系统恢复的瞬间引发严重的次生雪崩风暴 | 采用带上限保护、结合随机抖动的指数退避重连机制 |
| 将 Task 的确认回执当成已完成取消 | 前端界面显示已停止，而后台 worker 仍在计费运行 | 持续轮询 Task 状态直到其真正进入终态 |

## Kap taşı 串联

工具生态 Capstone  projeler sistem yapısal yazının iki satırı yerine sistem güvenilirliğini uygulanabilir kod belgesi olarak görmelidir.

Capstone 必須提供以下交付凭证:

-  her türlü nakliye anlaşmasının kaldırılması için;
-  tüm açıklama işlemlerinin yeniden deneme kararları için;
-  tıpkı anahtar kalıcılık kaydı ve parametre eşleşmezken yapılan interfeksiyon testi;
- Kilitli bir kontrol kayıtları, yeniden başlatıldıktan sonra devamlı bir nükleer test ve değişken nesne ayırma testleri;
- Çeviri kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrolü kontrol
- Antirajçı SSE 标头配置与空保活策略说明;
- Yetkili veri çekimi bağlantısı kesinti ve tam miktarda geri kazanma programını belirledi;
- Önderleme Görevleri  genişleme sırasında, tam bir kalıcılık Görevleri  取消追踪链路──

Tek bir yerel süreçte başarılı bir şekilde çalıştırmak sadece temel işlevlerin başarıyla yürütüldüğünü kanıtlayabilir. Sadece kayıp tepki, geç kalıp iptal edilmesi, yavaş tüketicilerin ve tekrar fırtınaların gerçekleşmesi ile kesin bir sonuç elde edilebilir.

## 关键术语

| 术语 | 含义 |
|------|---------|
| 请求取消（Request cancellation） | 放弃单次处于在途状态的 MCP RPC 请求 |
| 取消竞态（Cancellation race） | 终态执行完成与取消信号抵达之间的时序争夺 |
| 空闲超时（Idle timeout） | 距离上一次产生有效请求活动的最大允许时间 |
| 最大超时（Maximum timeout） | 从请求开始时刻算起、不受进度通知影响的全局绝对时间上限 |
| 幂等键（Idempotency key） | 唯一标识单次特定业务意图的应用层去重标识符 |
| 原子账本（Atomic ledger） | 将键校验、副作用记录与结果提交绑定为不可分割单元的持久化存储 |
| 背压（Backpressure） | 在生产者生成速度超过消费者处理能力时施加的流量控制机制 |
| 进度合并（Progress coalescing） | 用更新的权威进度数值替换掉旧的进度更新 |
| 权威重拉（Refetch） | 在数据流中断或出现断层后，向权威接口重新读取当前全量状态 |
| 抖动（Jitter） | 在重试退避间隔中引入的随机偏移，用于在时间轴上打散瞬时并发高峰 |

## 延伸阅读

- [MCP 请求取消机制规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/cancellation)
- [MCP 进度通知规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/progress)
- [MCP Streamable HTTP 传输规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Tasks 扩展规范提案](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
