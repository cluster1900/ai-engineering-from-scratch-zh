# MCP 模型输入:Sampling 迁移与无状态 MRTR

> MCP 2026-07-28 规范弃用面向新设计的样本化特性,并移除服务器向客户端发送反向请求的通道──如果现有工作流仍需使用客户端模型,服务器会返回`input_required`Sonuç olarak, müşteri tarafından 带模型输出 重试原始请求――推理循环在协议层由此转变为显然、有界且无状态的机制――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources and prompts)
**Time:** ~75 minutes

## Öğrenme hedefi

- 解释为何 MCP 2026-07-28 弃用了样本化,并为新构建的服务器 选择使用直接集成模型 (direkt model entegrasyonu) 的默认架构──
- 实现一套兼容工作流,多轮往返请求 (Multi Round-Trip Requests, MRTR) 承载`sampling/createMessage`- Evet.
- Her dileğin içinde.`_meta`Bu konularda, protokol sürümleri ve müşteri yetenekleri yer alıyor.
- Geri dön .`resultType: "input_required"`,并使用全新的 JSON-RPC id 重试原始方法──
- - Evet .`requestState`完整性保护 (integrity-protected),并将其绑定到主体 (主体) 、方法、参数及过期时间──
-                                                                                                                                                                                                                                                               

## Protokol tasarımı öncesi yapısal kararlar

形如 `summarize_repo`Bu araç genellikle iki tür iş gerektirir:

1. 确定性工作:列出文件、读取允许访问的文件、校验路径以及组装内容──
2. 模型工作:挑选代表性文件并综合生成摘要──

Şimdi iki yasal yapı seçeneği var.

### Yeni inşa Server: doğrudan集成模型提供方

Bu mevcut öntanımlı tavsiye uygulamasıdır. Server'ın kendiliğinden yönetim modeli seçimi, yeterlilik ayarlamaları, bütçe ayarlamaları, yeniden deneme stratejileri ve gözlemsellikleri.`tools/call`Sonuç:

Eğer sunucu bir hosting hizmeti olarak hizmet vermektedir veya tahmin edilebilir bir modelin performansının, borçlu bir sunucu modelinden daha önemli olduğu durumlarda, lütfen bu programı kullanın.

### 现有 工作流: MRTR'ye taşınma

Ücretsiz geçiş döneminde, örnekleme hala var. 2026-07-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `sampling/createMessage`Arama karşısında, bunun yerine, bu arama içine yerleştirilir.`InputRequiredResult`İçeri dön.

Sadece müşteriye yönelik model ve kanıtların açık ürün sertliği gereksinimleri olduğunda, bu uyumlu yol seçilir.

## 无状态契约

2026 yılının Temmuz ayında yapılan anlaşma kuralları kaldırıldı.`initialize`El ele tutmak,`notifications/initialized`Ve `Mcp-Session-Id` Geçmişte elindeki bilgiler, şimdi her dileğiyle doğrudan taşıyor:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}},
      "io.modelcontextprotocol/clientInfo": {
        "name": "lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

Sunucu, her istek üzerinde test protokol versiyonu olacaktır. Versiyon eksikliği veya olmayan bir şablon tipi, etkin olmayan bir parametre aittir.`-32602`△ Desteklenmeyen sürüm 字符串返回 `-32022`, ve kesin verileri taşıyor .`{"supported":["2026-07-28"],"requested":"<client version>"}`◊ Eğer örnekleme yeteneği eksik 则返回 `-32021`,并将 `data.requiredCapabilities`设为 `{"sampling":{}}`- Evet.

没有 JSON-RPC `id`Bu nedenle, bu durumun bir sonraki yönünde, bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmesini sağlayan bir mesaj gönderilmektedir.`202 Accepted`- Evet.

Sunucu da gerçekleştirilir .`supportedVersions`键、能力、`ttlMs`和 `cacheScope``server/discover`方法, client in调用 tool 之前能够获知并缓存服务器的契约──由于发现 声明 `tools`...server de zorunlu bir şekilde çalıştırılmalıdır.`tools/list`△ Onun kesinliği `summarize_repo`描述符包含合法的 nesne 类型 `inputSchema`- Evet.`resultType: "complete"`、server kimliği ve kamu 缓存提示──

Her başarılı modern protokolün sonuçları bir ayırt edici içerir:

- `resultType: "complete"`İşlem tamamlandı.
- `resultType: "input_required"`Client'in 必須履行内嵌的输入请求并进行重试──
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `"task"`- Evet.

## 单轮 MRTR 交互流程

Sunucu, istemciyi işleme sırasında çağrıştıramadı.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "pick_files": {
        "method": "sampling/createMessage",
        "params": {
          "messages": [
            {
              "role": "user",
              "content": {
                "type": "text",
                "text": "Choose three representative files and return a JSON array."
              }
            }
          ],
          "systemPrompt": "Return only the requested value.",
          "modelPreferences": {
            "costPriority": 0.8,
            "intelligencePriority": 0.2
          },
          "maxTokens": 400
        }
      }
    },
    "requestState": "opaque-integrity-protected-value"
  }
}
```

Müşteri 验证自己支持 样本化,应用其审核批准与模型策略,并获取模型响应──随后, müşteri 发送一个带有全新的 JSON-RPC id 的新请求:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "inputResponses": {
      "pick_files": {
        "role": "assistant",
        "content": {
          "type": "text",
          "text": "[\"README.md\", \"server.py\", \"docs/intro.md\"]"
        },
        "model": "host-model",
        "stopReason": "endTurn"
      }
    },
    "requestState": "opaque-integrity-protected-value",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}}
    }
  }
}
```

Bu tekrar deneme anlaşma dışı konuşmanın devamıdır. Bu tamamen yeni bir istektir: Tekrar deneme yöntemleri ve parametreleri, sadece önceki sıraların eklenmesi.`inputResponses`,并原封不动地逐字节回显 `requestState`- Evet.

MRTR sadece ortaya çıkmasına izin veriyor .`tools/call`- Evet.`prompts/get`和 `resources/read`中──Server 绝对不能从无关方法中返回 `input_required`- Evet.

## Do轮 durum yönetimi

Bu ders iki model kullanımı gerektirir:

1. `pick_files`返回一个 JSON 数组──
2. `summary`返回最终的摘要文字──

Her tekrar deneme sadece bu dönemin tepkisini taşıdığı için, sunucu, mevcut aşama (s) ve okulun geçişi arasındaki verileri bir sonraki aşama (s) içine koymak zorunda kalır.`requestState`İçeride.

Lütfen bu değerleri saldırganın kontrolündeki veriler olarak görün. Sadece aşama isimlerini basit bir şekilde imzalamak yeterli değildir.

- 经过鉴权的主体 (authenticated principal), kendiliğinden bildirilmemiş`clientInfo`- ...
- 发起调用原始方法;
- Çıkışlar:
- 较短的过期时间;
- Geçmiş aşamada ve deneyimlerin orta değeri

HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC kullanılabilir. HMAC.`-32602`- Evet.

Müşteri kesinlikle çözemez.`requestState` Onun tek görevi, tekrar deneme sırasında, orijinal olarak, bu satırları aktarmaktır.

## 模型偏好 sadece ipuçları için

`costPriority`- Evet.`speedPriority`ile`intelligencePriority`Bu seçenekler, olasılık dağılımları değildir ve toplamda 1 olması gerekmez.

Eğer hâlâ eski sürümün örneği sürecini koruyorsanız lütfen`includeContext`保持为 `"none"`△ Diğer üst üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste üste ü ü ü ü ü ü ü ü ü üste üste ü ü üste üste ü ü ü ü ü ü ü ü ü ü ü üste ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü ü

## Güvenlik değişmezliği

İçeride örnekleme istekleri için, müşteri tek güvenilir sınırdır:

- Kural yapay onay talep ettiğinde, kullanıcıya açıkça göster sunucu, modelin ne işlem yapmasını talep ediyor.
- 限 MRTR 轮次上限──否则恶意服务器可能构建无休止的模型消费循环──
- Örneklemeyi dosya adı olarak kullanmak için URL veya araç olarak kullanmak için, zorlu bir deneme yapın.
- 限制每轮往返的字节数和符号数──
- 拒绝在当前客户端能力中未声明的输入请求──
- 避免让模型输出决定授权鉴权逻辑──
- 记录发起的方法及输入请求 key, 记录发起的方法及输入请求 key, 记录发起的方法及输入请求 key, 记录发起的方法及输入请求 key, 记录发起的方法及输入请求 key, 记录发起的方法及输入输入的方法及输入请求 key, 记录发起的方法及输入输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法及输入的方法

`clientInfo`和 `serverInfo`Sadece gösterme ve teşhis verileri için kullanılabilir.

```figure
t3-sampling-flip
```

## Çözüm

`code/main.py`Üçüncü bir paketle bağlı değil, iki sıra dönüş sürecini tamamıyla gerçekleştirdi:

- `server/discover`Geri dön .`supportedVersions`, açıklama aracı 支持,并返回缓存提示。
- `tools/list`返回具有对象输入方案的、确定性且可缓存的 `summarize_repo`描述符──
- `tools/call`校验每个请求的元数据──
- İlk sonuç seçilen dosya için yerleştirilmiştir.`sampling/createMessage`- Evet.
- İlk tekrar deneme modelinin sonucu ve ikinci istek yerleştirilmiştir.
- HMAC 保护的 `requestState`Özgürlük talepleri arasında güvenlik ile geçiş ve yürütme aşamasında.
- Son Sonuç Kullanım`resultType: "complete"`- Evet.

模拟的主机 模型证实了示例的确定性──当连接到真实主机 时,只需更换 `fake_host_model`❖Server tarafındaki durum, her zaman belirginlik ve test edilmesi kolay olmalıdır.

## Kullanım ve çalışmalar

Bu işlevler:

```bash
cd phases/13-tools-and-protocols/11-mcp-sampling/code
python3 main.py
python3 -m unittest discover tests -v
```

预期检查点:

- Bulma  Geri dönüş `ttlMs`和 `cacheScope`Bu da sonucudur.
- Araç keşfi 返回排序相同的描述符,带有 `resultType`、server 、status ve缓存提示──
-  Eksik yetenek ve desteklenmeyen sürüm ayrılığı `-32021`ile`-32022`Yanlış veriler.
- 没有 id 的通知 不产生任何 JSON-RPC 响应──
- Lütfen kimliğinize bakın .`[1, 2, 3]`, her MRTR'nin tamamen bağımsız olduğunu kanıtlamak
- Önceki iki sonuç türü`input_required`- Evet.
- Son Sonuç Tip`complete`,并包含选出的文件以及最终摘要──
- Yeniden deneme sırasında 改 原始参数会导致请求-state 校验失败──

## 交付产物

`outputs/skill-sampling-loop-designer.md`现已升级为迁移规划器――首先, örneklemeyi reddetmek 改用直接模型集成──如果必须保留兼容性,它会产生MRTR 交互轮次、状态绑定、能力 门禁、预算控制、数据校验以及平稳退役方案──

## 课后练习

1. Yapılandırma yapılır. Yapılandırma yapılır.`-32602`Ve bu, kör bir inanç modeli değil.
2. İlk defa kullanma ile yeniden kullanma arasında değişiklikler`audience`参数── açıklama neden mühürlenmiş durum, dileği tekrarlamayı engelleyebilmektedir.
3.  Üçüncü tur görüşmesini artırmak, host'a özetleri eleştirmek için gereklilik;  Önceki özetleri imzalı durumda tutmak ve tüm süreci en fazla üç tur için sıkı bir şekilde sınırlamak.
4. 完全移除 Sampling:将模拟的宿主回调替换为服务器自持的模型适配器──列出此时有哪些批准、计费和可观测性职责转移到服务器端──
5. 添加一个过期测试:传入一个已过期期限的状态值1秒,验证校验失败──

## 关键术语

| 术语 | 2026-07-28 中的含义 |
|------|------------------------|
| Sampling | 已弃用特性，用于请求 client 端的模型执行文本补全 |
| MRTR | 多轮往返请求（Multi Round-Trip Requests），用于在请求中获取 client 输入的无状态重试模式 |
| `InputRequiredResult` | 带有 `resultType: "input_required"` 的结果对象 |
| `inputRequests` | Server 分配的映射表，包含内嵌的 elicitation、sampling 或 roots 请求 |
| `inputResponses` | Client 在当前轮次提交的响应，键名与 `inputRequests` 一一对应 |
| `requestState` | 不透明的 server 状态字符串，由 client 原样回显并由 server 校验完整性 |
| `resultType` | 现代 MCP 返回结果中必须包含的类型判别器 |
| 直接模型集成（Direct model integration） | 新建 server 需要模型推理时的官方推荐替代方案 |
| Capability 门禁（Capability gate） | 防止向未声明相应支持的 client 发送内嵌请求的安全规则 |
| 循环预算（Loop budget） | 本次操作允许的最大轮次、token 数、字节数、执行时长以及花费上限 |

## 旧版兼容性

2025-11-25 sürümünde sabit olan müşteri , hala canlı bağlantıda eski sunucu kullanıyor olabilir .`sampling/createMessage`流程── lütfen bu davranışı, 2026-07-28 sunucusunun altyapısı olarak özel olarak kullanılan adapte cihazlar arasında sıkı bir şekilde ayırın.

官方 SDK 可以将现代的 `input_required`Bu 片shim) 兼容性 sınırdır, kesinlikle bu yeni bağımlılık konuşmaların mantıklarına eklenmesine izin vermez.

## 延伸阅读

- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP Sampling deprecation](https://modelcontextprotocol.io/seps/2577-deprecate-roots-sampling-and-logging)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
