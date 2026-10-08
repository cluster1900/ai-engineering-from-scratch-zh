# MCP Güvenlik:                                                                                                                                                                                                                                                             

> 无状态不意味零信任 (ağırlık)                                                                                                                                                                                                                                                        

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 08 (MCP client)
**Time:** ~60 minutes

## Öğrenme hedefi

- Araç tanımlaması, notasyonu, müşteri bilgi ve servis bilgiyi güvenilir olmayan veri olarak görmektedir.
- 检测元数据投毒(metadata zehirlenmesi) 描述器 恶意改(rug pull)以及跨服务器的名字冲突与遮蔽(shadowing) ・・・
- 验证 2026-07-28 版本的请求元数据与流通 HTTP 路由头部──
- 保护 MRTR `requestState`免受改,并将人工确认与精确调用论据 强绑定──
- Ücret ve hız sınırlaması (Rate Limit) Ücret ve Hükümeti Üyesi (Primary) Üye Yapılacak, Ama Çekilmemiş Sözleşme Sessiyonu Olmayacak.

## 问题

模型依赖读取工具描述 来决定调用什么――路由器依赖读取工具名称 来决定将请求发送到哪儿――用户依赖读取界面标签 来决定批准什么操作――只需要一个恶意构建的描述器,就能同时发动攻击――

MCP'nin resmi güvenlik rehberliği çok doğrudan: Tamamen güvenilir bir sunucudan gelen açıklamalar ve notlar dışında, bir yasa güvenilirliğin durumu da değişebilir.

Geçmişteki anlaşma güvenlik sınırlarını değiştirdi. 2026-07-28'de, çekirdek anlaşmada, el ele geçirme aşaması ve nakliye aşamasında bir seans yok.`Mcp-Session-Id`Ratifye onaylama, hız sınırlaması veya denetim tarihi güvenliği tasarımı bağlanması için, mevcut anlaşma standartlarına uymazlar.

## 概念

### Kontrol edilmeye değer yedi saldırı yüzü

Bir açık savunma listesi izlemek yerine, dikkatli olmalısınız:

1. **元数据投毒（Metadata poisoning）：**Açıklama içinde bir açıklama aracı yerleştirilmiştir 行为完全无关的命令(如提示注入、越狱) 
2. **Descriptor 恶意篡改（Descriptor rug pull）：**之前已被用户或系统批准的名称、描述、方案或注释 发生静默变更──
3. **跨 server 名字遮蔽（Cross-server shadowing）：**İki sonucun aynı sınırsız araç adını ortaya koyduğu halde, yolcu ise kayıt sırasına göre, sessizce birini seçti.
4. **Header 与 Body 混淆（Header and body confusion）：**HTTP 头部 `Mcp-Method`Ya da`Mcp-Name`JSON-RPC ile uyumsuz.
5. **Capability 权限提权（Capability escalation）：**Uygulama, bir istek içinde bir uzantı veya müşteri özelliklerini belirtirken, sunucu bu açıklamayı yanlışlıkla yetkili bir sertifika olarak görür.
6. **MRTR 状态篡改（MRTR state tampering）：**客户端 改了   客户端 改了   客户端 改了  客户端 改了 客户端 客户端 改了 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户端 客户 客户 客户端 客户 客户端 客户 客户 客户 客户 客户 客户 客户`requestState`、 tamamen farklı bir doğrulama sorusuna yanıt verdi veya eski doğrulama sertifikalarını değiştirdikten sonra tekrarlayan argümanlara kadar kullanıldı.
7. **供应链身份混淆（Supply-chain identity confusion）：**Bir yayıncı veya sunucu olarak gerçek kimlik kanıtını göstermek için bir tanıklık yapın.

Bu saldırı yüzleri birbirleriyle sık sık bağlanır. Hash kilitlenmesi, tanımlayıcıyı bulmaya yardımcı olur. Ancak, orijinal tanımlayıcıyı kanıtlayamaz.

### Bu bir kanıt değil bir kimlik.

2026-07-28'in her bir versiyonunun istekleri şunları içerir:

```json
{
  "_meta": {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {
      "elicitation": {"form": {}}
    },
    "io.modelcontextprotocol/clientInfo": {
      "name": "security-lab",
      "version": "1.0.0"
    }
  }
}
```

Her bir istek üzerinde protokol versiyonunu ve kapasite yapısal etkinliğini test etmek gerekir.**绝不能**- Ne ?`clientInfo`Sertifika ile ilgili başlıklı bilgi, müşteriye ait bir rapor vergisidir.

Aynı uyarı sonuçlar için de geçerlidir.`io.modelcontextprotocol/serverInfo`                                                                                                                                                                                                                                                              

### Önceki verifi yolu, yeniden yürütme stratejisi

- Evet .`tools/call`,Akışlabilir HTTP 传输层 aşağıdaki bölümleri içerir:

```text
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.export
```

Başlık İçindeki yöntem 必須  beden İçindeki yöntem 完全一致。 Başlık İçindeki isim 必須  beden İçindeki `params.name`完全一致──在选择后端、应用 RBAC(基于角色的访问控制) 或消耗限流代币 之前, bir kez uyumsuzluk tespit edildiğinde, hemen geri dönmek gerekir `-32020`Yanlış bir reddetme.

Bu verifikasyon sırası, yaygın farklılıkları ortadan kaldırır: bir bileşenin vücut tabanlı  yetkili oluşmasını önlerken, diğer bir net bağlantı bileşeninin başlık yolu koşullarına göre oluşmasını önler.

Alt katlı rapor verifikasyonu, sıkı bir zaman terimini izler: önce başlık ve vücut değerine göre JSON-RPC ve değerli veri türünü test ederek, ardından uygun sürümün desteklendiğini kontrol ederek başlık uyumsuzluğu HTTP 400 ile hata kodu geri gönderir.`-32020` Eğer başlık ve vücut aynı ama sürüm desteklenmiyorsa, HTTP 400 ile hata kodu geri dön`-32022`, ve `data`必須精确為`{"supported":["2026-07-28"],"requested":"<actual>"}`◊ Eğer bilinmeyen bir yöntem istese, HTTP 404 ile hata kodu geri gönder `-32601`- Evet.

Sözleşme yapılandırılmış olarak geri kazanılmak için gerekli olduğunda, her hata nesne seçilebilir bir şey içerir.`data`字段──由于通知(notification) yok `id`Bu nedenle JSON-RPC başarısı veya hata cevabını asla alamayacaktır. Kabul edilen HTTP bildirimi HTTP 202'ye geri dönüp cevaplamaları için boş olmalıdır.

### Tüm Descriptor için                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

仅对描述 计算哈希会遗漏 schema 和注释的改──必须对用户批准的所有描述者 字段进行规范化(canonicalize)并计算哈希:

```python
normalized = json.dumps(tool, sort_keys=True, separators=(",", ":"))
digest = hashlib.sha256(normalized.encode()).hexdigest()
```

Bu da bir şey değil .`notes.export`) ), ve üretim ortamında kayıtlı yayıncıların onay ve onay süresi ──

Her gün yenilemekte veya bulunduklarında:

- Anlamsız: Karantin, yapay inceleme tamamlanana kadar.
- Aynı kilit, farklı bir ses:
- 重复的未限定名称:强制要求确定性的命名空间划分──
- 静态扫描命中:拦截并全面审查整个描述器──

哈希一致 sadece içeriğin değişmediğini kanıtlayabilir, özgüvenin güvenliğini kanıtlayamaz.

### 静态扫描 bir haber hattı

简单的模式匹配能够标记角色标签、命令覆盖、隐藏行为、秘密访问以及可疑网络外连接目的── bu tür tarama maliyeti son derece düşüktür, kurulum sırasında ve CI 流水线 içinde çalışmaya çok uygundur──

Ancak, statik tarama, bir ifade kanıtı olarak kullanılamaz. Güvenli bir tanım, yasal güvenlik uyarısında işaret edilen kısayolları içerebilir.

### 合并之前进行命名空间隔离

İki sunucu isimlerini ortaya çıkardığını varsayalım .`search`Bu araç, kimden yararlanmasını belirlemek için kayıtlı bulguların öncesinden sonraki sıradan bir şekilde asla belirlenemez.

```text
notes.search
issues.search
```

完全限定名就是对外曝光的门户 公共名称──后端映射关系应单独记录──稳定的命名能确保审批,审计,哈希锁定以及`Mcp-Name`路由全部指向同一实体对象──

### Yetenekler 兼容性声明

Her dileğin içinde .`clientCapabilities`Sadece sunucuyu bilgilendirir.**绝不代表**Klantin'e erişim araçları, veriler veya işlem hakkı verilmektedir.

授权仍然完全来自已认证的主体 (Büyük) & Resource Strategies (Ressources Strategies) ⇒ Sıkı bir şekilde yürütülen adımlar:

1. 认证传输层凭证──
2. 验证协议版本、headerler ve talep yapı¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
3. 检查能力 兼容性。
4. Konu, araç, kaynak ve argümanlar hakkında bilgi sahibi olma hakkı
5. 执行操作或向用户请求输入──

### 保护无状态 MRTR 确认

具有重大影响的工具 ([[konsequential tool]]) 用户确认──当前 MCP 多往返请求 (MTRR) 采用多往返请求 (MCP) 采用多往返请求 (MRTR) 采用多往返请求 (MCP) 采用多往返请求 (MRTR) 采用多往返请求 (MCP) 采用多往返请求 (MTR) 采用多往返请求) 采用多往返请求 (MCP) 采用多往返请求 (MTR) 采用多往返请求 (MCP) 采用多往返请求 (MCP) 采用多往返请求 (MCP) 采用多往往回调) 采用多回调 (MCP) 采用多往回调) 采用多回调 (MCP) 采用多回调) 采用多回调 (MCP) 采用多回调) 采用多回调 (MCP) 采用多回调) 采用多回调用 (MCP) 采用多回调用 (MCP) 采用) 采用多回调用 (MCP) 采用 (MCP) 采用) 采用MCP) 采用 (MCP) 采用MCP) 采用 (MCP) 采用 (MCP) 采用 (MCP) 采用方式) 采用 (MCP) 采用方式) 采用方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式方式

İlk cevap:

```json
{
  "resultType": "input_required",
  "inputRequests": {
    "confirm": {
      "method": "elicitation/create",
      "params": {
        "mode": "form",
        "message": "Export notes to archive?",
        "requestedSchema": {
          "type": "object",
          "properties": {
            "confirm": {"type": "boolean"}
          },
          "required": ["confirm"]
        }
      }
    }
  },
  "requestState": "opaque-integrity-protected-value"
}
```

客户端获取用户输入后, yeni JSON-RPC id 重试原始方法:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "notes.export",
    "arguments": {"query": "private", "destination": "archive"},
    "requestState": "opaque-integrity-protected-value",
    "inputResponses": {
      "confirm": {
        "action": "accept",
        "content": {"confirm": true}
      }
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "elicitation": {"form": {}}
      }
    }
  }
}
```

Her biri .`inputRequests`Değerler bir içermektedir.`method`和 `params`Bu, bir diğer önemli yöntemi de içerir.`inputResponses`Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Ç Ç Ç Çeviri: Ç Ç Ç Ç Çeviri: Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç`requestedSchema`, ve müşteri , sunucu üzerinde 发起请求前已声明的形式发动能力的服务器 发起请求前已声明的请求的函数发动能力的服务器 发发发请求前已声明的函数发动能力的服务器 发发发请求前已声明的函数发动能力的服务器 发发发请求前已声明的函数发动能力的服务器 发发发请求前已声明的函数发动能力的函数发动能力的服务器 发发发请求前已声明的函数发动能力的函数发动能力的函数发动能力的函数发动能力的函数发动能力的函数发动能力的函数发动能力的函数发动能力的函数发动能力的函数的函数

Şimdiki anlaşmanın iki tür yasal yeteneği vardır:`{"elicitation":{}}`隐式支持表单; ve `{"elicitation":{"form":{}}}`Açık açıklama. Eğer sadece URL'yi açıklarsak desteklenir.`{"elicitation":{"url":{}}}`),则不支持表单请求──此时服务器会返回 HTTP 400 与错误码 `-32021`, ve `data.requiredCapabilities`Çı`{"elicitation":{"form":{}}}`- Evet.

必須将 `requestState`Bu ders kodu HMAC ve kesin parametre oranlarını kullanarak net bir güvenlik sınırı oluşturmak için göstermiştir.

Nonce 账本绝不能仅存在单台门户内存中──可运行模型注入一个有限的、带 TTL 清理的防重放存储,可由多门户 实例共享──其原子性核销售(atomic claim) oluşturur: sadece onaylanmış onaylı işlem veya açık bir sonlama tarafından reddedilen bu durum tüketilecektir──format error response or`cancel`Hiçbir işlem gerçekleştirmez ve son dönem boyunca tekrar denenebilir durumda kalır.

切勿将确认上下文藏在某协议会议中──集群中任何一个服务器 实例都必须能够独立验证重试请求──

### 高风险调用的两人法则(İki Kuralı)

Üç boyuttan bir kez düzenlenmeye ayırılmak:

- Yapılamaz mı?
- Hissedici verilere erişebilme imkanı var mı?
- Bu durum, geri dönüşü olmayan dış büyük etkiler yaratacak mıdır?

Tek bir otomasyon adımları aynı anda bu üç özelliğe sahip olamaz. Bir kez birleşince, ayrıştırma, düşürme veya MRTR yoluyla açık bir insan onayı getirmek gerekir. Bu, bir tasarım başlatma prensibi, bir protokol sertliği yeteneği değil.

### Çekilme hakkı (Reduce Authority)

无状态本身不等于安全――隐藏的会话历史风险的消除虽然它消除了隐藏的会话历史风险,但一个自含的请求仍然可能利用权限过大的处理者 泄露数据或造成不可逆破坏――真正的安全来自在每个边界层层收缩权:

1. **类型化动词（Typed verb）：**暴露单一受限操作`archive_note`), genelleşmek yerine `run`Ya da`request`Bu tür tür bir araç olabilir.
2. **校验参数（Validated arguments）：**尽可能采用封闭的方案,拒绝未知字段,标识符单次规范化,限制用负荷大小,并策略评估前验证目标地址、租户归属与资源所有权──
3. **即时鉴权（Current authorization）：**Bu, belirli bir etkinlik, kaynak, çevre ve düzenleme için gerekli olan bir sınırlama değildir.
4. **绑定动作的审批（Action-bound approval）：** Yüksek etkileme uygulanması için, yapay onay ve tipleştirme etleri ve düzenleme parametrelerinin dijesini etleme, etleme etimi etimi ve tek geçerli stratejietleri içinetleri değişen herhangi bir parametrenin yeniden onaylanması gerekir
5. **一等拒绝（First-class refusal）：**Bu, kullanıcıların reddedilmesi ve güvensiz hedeflerin normal beklenen sonuçlar olarak görüldüğü için herhangi bir yan etkisi gerçekleştirilmediği için, kesinlikle derecelendirmeyi reddedecek ve güçsüz bir rezervasyon aracı olarak geri dönüşecek.
6. **脱敏审计证据（Redacted audit evidence）：**记录请求者、采用入口描述与策略版本、授权的规范化目标、允许或拒绝的原因,以及是否已开始执行──日志中记录 digest或脱敏值而非密钥明文──

Her bir bölüm, bir kısımın altında bir bileşenin uygulanabilir yetkisini oluşturur. Son işlem prosedürünün aldığı, orijinal model metni ile birlikte geniş çaplı bir yetki değil, onaylanmış alan emri olmalıdır. MRTR'de yeniden çalıştırıldığında görev yenilenmesi veya bir bağlantı dönüştürülmesi için, bu bağlantıya tamamen yeniden yönlendirilmelidir.

### 当前与遗留交互路径 (Bölümleşme)

2026-07-28 规范中,Roots、Sampling and Logging 针对新实现已正式废弃──Gateway 只有旧版本请求通道代码作为受版门禁控制的后兼容路径保留──

Sessiyon sayımına göre örnekleme  sınırlama makinesi  yeni savunma mekanizması oluşturmak  sınırlama oranı  onaylama konusu, yayıncı, özel kaynak, araç ve zaman penceresi üzerinde uygulanmalıdır 

### 无状态 Transport 检查项

- Bu yüzden, bu konuda bir şey yapmamalıyız.
- Bu noktaya yönelik modern GET 和 DELETE için 405 Metodu İzin verilmiyor.
- Ne doğururur ne de bağımlıdır .`Mcp-Session-Id`- Evet.
- 忽略旧版会议 和重放头部, harus将其作为授权输入──
- Bu POST için JSON veya request class rol alanının SSE'sini geri göndermek için başvurun.
- Sadece iki tarafın açık anlaşması altında kullanmak`subscriptions/listen`收到长生命周期的变更通知──

```figure
tp-tool-poisoning
```

## 动手构建

`code/main.py` Kolay bir süreç içinde güvenlik net关 modeli gerçekleştirmek.  Tam bir araç tanımlayıcısı  düzenleme ve hash kilitleme, raporlar, veriye giriş ve isim örtü,  denetleme                                                                                                                                                                                                                                                                                                                   `requestState`Bu iki aşamada yapılan bir yükleme işleminin tamamlanması ve birleştirilmesi mümkün olan ortak depolama ve yeniden depolama işleminin tamamlanması.

Model HTTP  Adaptör çöz JSON Başlıktan sonra başlatılır.`Content-Type`Ya da`Accept`△You can be connected to the same distributor with the same distributor with the same streamable HTTP adapter connection in the first 9   ⇒ 9. Sınıf boyunca tam olarak akışlanabilir HTTP  适配器 bağlantısı, sonradan zorunlu bir gereksinim `Content-Type: application/json`Ve`Accept`Aynı zamanda içerir.`application/json`ile`text/event-stream`- Evet.

- Yapma .

```bash
cd phases/13-tools-and-protocols/15-mcp-security-tool-poisoning
python3 code/main.py
python3 -m unittest discover code/tests -v
```

Örneğin kod bir tanımlayıcıyı değiştirmek için tasarlanmıştır.`input_required`响应与无状态重试的完整流程──

## Kullan

 将代码中的 `SAFE_TOOLS`替换为您的自认的服务器 规范化快照. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不可全面的人工审查新增或变变的描述.

Bu kontrol, internet bağlantısı aşamasında, servis bulma sırasında, resmi olarak dağıtılmadan önce tekrar yapılmalıdır. Bu işlem, tekrar yapılan bulmaların giderlerini azaltır, ancak tanımlayıcı değişirken, bu işlemin onay durumunun hemen geçersiz kalması veya sona ermesi gerekir.

## - Söyle.

本课交付 `outputs/skill-mcp-threat-model.md` mevcut anlaşmalara yönelik tehdit oluşturma becerileri, kapsamlı kapsamlı veri, yol, yetenek, yetki, MRTR, depolama, kayıt ve uyumluluk sınırları bir kitle sunmaktadır.

## 课后深练习

1. Tanınan kişiyi, mevcut yetkili kararlarla birlikte, gizli MRTR durumuna bağlayarak, farklı kişi olarak başlatılan yeniden deneme talebini reddetmekle birlikte,
2. Bu, iki işlemin aynı zamanda bir deyişle yok olabileceğini kanıtlamak için bir şartlı ekleme yapılmıştır.
3. Nükleer satışın ardından 模拟导出执行之前注入系统故障──定义并测试能够确保安全恢复的事务或等性规则──
4. Sadece bir araç değiştirmek için.`inputSchema`Ve açıklamasını tutmak değişmez, verification full quantity descriptor  lock mechanism can/canno/precision catch 該改──
5. 增加一项安全策略: When different subjects see what                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                `tools/list`存在差异时,禁止进行公共缓存(公共缓存)
6. Web-Connect'e arka tarafta eski bir sürüm sunucuyu bağlayarak tüm el ele geçireceğiz.`2025-11-25`兼容分支中──

## 关键术语

| 术语 | 含义 |
|------|------|
| 元数据投毒（Metadata poisoning） | 在 tool descriptor 中嵌入恶意提示词指令或欺骗性声明 |
| 恶意篡改（Rug pull） | 针对先前已获审批的 descriptor 进行未授权的静默修改 |
| 名字遮蔽（Tool shadowing） | 由未加限定的重复 tool name 导致的路由歧义与覆盖 |
| 头部不匹配（Header mismatch） | 路由 header 与 JSON-RPC body 内容冲突，触发错误 `-32020` |
| 哈希锁定（Hash pin） | 对经审核批准的完整规范化 descriptor 计算所得的 SHA-256 digest |
| MRTR | 多往返请求模式（Multi Round-Trip Requests），用于 server 主动请求输入并由 client 无状态重试 |
| `requestState` | 往返传递的不透明状态值，必须作为不可信输入进行完整性保护与校验 |
| Capability 声明 | 仅表示协议特性的兼容性声明，绝不代表授权与访问许可 |
| 隐式表单支持 | 空的 `elicitation` capability 对象 `{}`，等同于显式声明支持表单 |
| 完全限定名（Qualified tool name） | 网关层稳定的命名，如 `notes.search`，防止命名冲突 |

## 延伸阅读

- [MCP 安全与信任指南（Security and Trust Guidance）](https://modelcontextprotocol.io/specification/2026-07-28#security-and-trust--safety)
- [多往返请求（Multi Round-Trip Requests）规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [Streamable HTTP 传输协议](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [已废弃特性（Deprecated Features）清单](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
