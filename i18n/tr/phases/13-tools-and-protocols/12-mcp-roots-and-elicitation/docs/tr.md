# 显式权限范围与无状态 Elicitation

> MCP 2026-07-28 规范中中已被弃用,且它从来不是安全沙箱. Lütfen, sınırlı sınırlı sınırlılık aralığını 参数或资源 URI's, server tarafından belirlenmiş, kullanılabilir bir araçta belirlenmiş olarak kullanın.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 11 (stateless MRTR)
**Time:** ~60 minutes

## Öğrenme hedefi

- kullanılır 显式工作区参数、resource URI 或 server 静态配置替代已弃用 Roots。
- Sınıfı                                                                                                                                                                                                                                                             
- MRTR'den geçiyor.`input_required`结果交付表单模式(form-mode) `elicitation/create`- Evet.
- Her istemci yeteneklerinde açıklama 支持并拒绝不受支持模式──
-  严谨校验 `accept`- Evet.`decline`和 `cancel`Bu üç farklı etkileşim sonucu.
- Bu, bir diğer diğer seçeneği de belirten bir seçeneği oluşturur.

## İki benzer sorunun var.

Bir not aletini bulmuştum aşağıdaki istek:

Sunucu iki farklı soruya cevap vermeli:

1. Bu işlem hangi iş alanına dokunmasına izin veriyor?
2. Üç eşleşen notta, kullanıcıların anlamı nedir?

İlk soru kapsamına bağlıdır. İlk soru, kapsamına bağlıdır. İkinci soru, iletişim biçimine bağlıdır.

## Kökler 仅为迁移过渡表面

早期 MCP 规范 allow client 声明 Roots, and list occur changes when notification server。 Ancak Roots  merely suggestive guidance information  信息指导)                                                                                                                                                                                                                                           

MCP 2026-07-28  Yeni tasarım için tamamen kullanılmamıştı `roots/list`ile`notifications/roots/list_changed`◊ Şunu değiştirmek için aşağıdaki açıklama yöntemlerini kullanmak önerilmektedir:

- Sınıf değişikliği sırasında kullanımı`workspaceUri`Ya da`directory`Araç 参数。
- İşlem kendi kendine belirli kaynaklara yönelikken, kaynak URI kullanın.
- Özel bir bölümün tek bir iş bölgesi olduğu zaman, sunucu kullanın 配置文件。
- Eğer teknik olarak kodları engellemek zorunda kalırsanız, işlem sandbox (işleme sandbox) veya ayrıca dosya sistemi (jailed file system) kullanın.

Eğer mevcut 2026-07-28 İçe girme programı geçersiz geçiş döneminde hala gerekli ise `roots/list`, sunucu MRTR'de yerleştirilmelidir .`inputRequests`Bu, sadece bir göç adaptasyonu aracıdır; yeni yazılan işçi doğrudan açık bir kapsamı almalıdır.

Modelleri açıkça ifade edilen cümleleri (sözleri) görebilmekte ve iletişim katmanındaki gizli kapsamda saklandığı zaman inceleme, yeniden düzenleme, denetim ve yolculuk yapmak daha zorlaşmaktadır.

### Üç katlı savunma prensibi

顯示的URI本身不带自立合法性证明──必須嚴格執行以下三層防護:

1. **鉴权（Authorization）：**Bu çalışma alanını kullanma hakkı sahibi kişiye izin veriliyor mu?
2. **路径限制（Containment）：** URI'nin düzenlenme sonrası hedefleri yetkili çalışma alanlarının sınırları içinde sıkı tutuluyor mu?
3. **沙箱隔离（Sandbox）：**Bir sunucu saldırıya uğrarsa, işletim sistemi sınırın ötesinde kaçmasını engelleyebilir mi?

Çözülebilir sunucu 会维护一个信任工作区 URI 白名单,规范化处理百分号编码的路径,校验真实的路径组件边界,并执行物理删除前即刻重新检查路径限制──

幼稚的字符串前检查是存在严重漏洞的:

```text
allowed:   file:///work/notes
attacker:  file:///work/notes-evil/secret.md
traversal: file:///work/notes/%2e%2e/private.md
```

Bu iki kötü niyet yolunun başı yasal gibi görünüyor. Önce düzenleme yapılması gerekir, sonra da yol bileşenlerine karşı aşamalı olarak yeniden sınıflandırılması gerekir.

## İstihbarat hala var, ama iletişim biçimi değişti.

Elicitation is модерн规范中用于在`tools/call`- Evet.`prompts/get`Ya da`resources/read`执行期间收集用户输入的客户端特性──方法名称仍然是 `elicitation/create`◊ Gerçek değişim, verilerin ağ bağlantılarının hareket yönüdür.

2026-07-28'in sunucusu JSON-RPC'ye geri gönderilmeyecek`InputRequiredResult`- ...

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "delete_choice": {
        "method": "elicitation/create",
        "params": {
          "mode": "form",
          "message": "Choose one matching note and confirm deletion.",
          "requestedSchema": {
            "type": "object",
            "properties": {
              "note_id": {
                "type": "string",
                "enum": ["note-3", "note-7", "note-14"]
              },
              "confirm": {"type": "boolean"}
            },
            "required": ["note_id", "confirm"]
          }
        }
      }
    },
    "requestState": "integrity-protected-delete-state"
  }
}
```

Host 负责染表单──用户可选择提交接受 (接受) 、显式拒绝 (拒绝) 、或直接取消/关闭 (取消) ──随后客户端 携带全新 id 重试原始的 `tools/call`- ...

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "notes_delete",
    "arguments": {
      "workspaceUri": "file:///Users/alice/Documents/Notes",
      "title": "TPS report"
    },
    "inputResponses": {
      "delete_choice": {
        "action": "accept",
        "content": {"note_id": "note-14", "confirm": true}
      }
    },
    "requestState": "integrity-protected-delete-state",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "elicitation": {"form": {}}
      }
    }
  }
}
```

İki çağrı arasında herhangi bir anlaşma bulunmuyor. Server 校验回显的状态,预期的方案 验证响应内容,确认中的笔记包含在经签名的候选集合中,重新对工作区的识别权,重新检查路径限制,最后才执行删除──

##  her talebe yönelik  müzakere yeteneği

支持表单模式 elicitation 的客户 会声明:

```json
{
  "io.modelcontextprotocol/clientCapabilities": {
    "elicitation": {"form": {}}
  }
}
```

空的 誘導能力`"elicitation": {}`) uyumlu düşünülmesi, tek bir şöyledir.`"elicitation": {"form": {}}`Aynı şekilde tek bir şablonunu destekler.`"elicitation": {"url": {}}`) ise bu uygulamayı desteklemiyor. Server ise bu uygulamayı açıklamış olsa da, mevcut isteklerin özelliklerini kesinlikle içine yerleştiremiyor.

Her dileğin yanında da olması gerekiyor.`io.modelcontextprotocol/protocolVersion`△ Versiyon eksik veya non-字符串类型返回 `-32602`▽不支持的版本字符串返回 `-32022`Kesinlikle değil.`supported`ile`requested`Önemli bir veri yok veya yalnızca desteklenen URL'lerin alınması`-32021`,并将 `data.requiredCapabilities`设为 `{"elicitation":{"form":{}}}`- Evet.

没有 JSON-RPC `id`Bu mesaj bir bildirime aittir. Bu mesajı doğrudan işlemeyin, JSON-RPC'yi göndermeyin. Başarılı veya yanlış yanıtlama.`202 Accepted`- Evet.

`clientInfo` teşhis hatası için kullanılabilir, ancak kendiliğinden açıklanmıştır ve kullanıcı kimliğini tanımlama hakkı için kullanılamaz.

Sunucu gerçekleştirildi .`server/discover`Ve geri dönmek`resultType: "complete"``supportedVersions`、 yetenekleri`ttlMs`Ve `cacheScope`❖ Bu modern tasarım için, dışa çıkmaz ❖ Roots ❖ Çünkü araçlar açıkladı, aynı zamanda zorunlu bir şekilde gerçekleştirdi ❖`tools/list`◊该结果返回确定性的 `notes_delete`描述符、合法的 nesne 类型 `inputSchema`、server kimliği ve kamu 缓存提示──

## 表单模式(Form Mode)

表单模式使用专为可用对话框设计的限限 JSON Schema──根节点必须是对象,其属性必须是对象,其属性必须是对象,其属性必须是对象,其属性必须是对象,其属性必须是对象的原始字段的平的平的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的原始字段的含义是的的的的含义是个个个个性的的的的的的的的的的.

Ünlü modüller:

- Bazı aday projelerinden birini seçin;
-  bir zararlı işlemin doğrulanmasını;
-   收集不含敏感信息的配置偏好;
- 采集少量, model kararının sayısal değeri değil, insan tarafından yapılmalıdır.

️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

Sunucu, iletken içeriği yeniden denemesi gerekir. Müşteri'nin iletken gösterdiği veri yalnızca kullanıcı deneyimini artırabilir.

## URL 模式(URL Modu)

URL 模式发送一个安全的 Web URL 以进行带外(out-of-band)交互:

```json
{
  "method": "elicitation/create",
  "params": {
    "mode": "url",
    "message": "Connect the report service to continue.",
    "url": "https://mcp.example.com/connect/report-service"
  }
}
```

Hassas bilgiler doğrudan sunucu tarafından kontrol edilen web sürecine girilmesi gerektiğinde, lütfen URL biçimini kullanın. Müşteri, kullanıcıya tam atlama hedefini gösterir ve açılmadan önce kullanıcı onayını elde eder. Müşteri kesinlikle bu URL'e önceden yüklenemez.

`accept`响应 yalnızca kullanıcıların URL'yi açmaya razı olduğunu gösterir, dış iletişimin başarıyla tamamlandığını kanıtlamaz.`input_required`Sonuç:

URL başlatılması MCP istemcisi ile MCP sunucusu arasındaki tanımlama mekanizmasını asla değiştiremez. MCP sunucusu kullanıcı temsilcisi tarafından tasarlanmış dış etkileşimi gerçekleştirmek için tasarlanmıştır.

## 响应分支与处理分支

Bu konuda, diğerleri de aynı şekilde değil, ciddi bir ürün mantığı karar vermeye çalışmaktadırlar.

| 动作 | 含义 | 安全的 Server 处理行为 |
|---|---|---|
| `accept` | 用户提交了交互内容 | 校验内容并继续执行 |
| `decline` | 用户明确表示拒绝 | 返回一个执行完成且非错误的拒绝结果 |
| `cancel` | 用户关闭对话框或未能完成交互 | 安全停止并允许稍后重试 |

绝不要将缺失内容解读为默许同意. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝绝绝不要将衰退. 绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝绝

## 保护破坏性 MRTR  durumu

Seçim listesinin yalnızca derhal veya imzalanmamış Base64 değerinin içinde bulunması mümkün değildir. Müşteri, tüm ilettikleri üzerinde kontrolü vardır.

Bu ders, şu içerikleri içeren imzalama yapıldı:

- 经过鉴权的主体;
- 发起调用原始方法;
- `workspaceUri`ile`title`Çizgi;
- Çekilme belgesi:
- 操作执行阶段;
- Daha kısa bir süreli süre.

Çalışma değişiklikleri yapılmadan önce, sunucu, en son canlı not kayıtlarını kontrol eder. Bu, işlemlerin silinmesi durumunu ve iş bölgesinin sınırlarından hedef notların taşınmasının durumunu önleyebilir.

 Tek seferlik finansal işlem veya geri dönüşü olmayan işlem için, sadece HMAC ile yasal durumun geçerli döneminde yeniden yüklenmesini engelleyemektedir.  Tüm işlemcilerde ısaların paylaşılan bir yükleme önleme depolarında, atom işlemleri ile ciddi şekilde bir kezlik oranı üreterek tüketilmelidir.  Bu ders,  TTL otomatik temizleme depolarına yerleştirilmiştir ve  TTL otomatik temizleme depoları ile,  memur silme sırasında kendiliğinden atom açıklamaları tutmaktadır.  Üretim sınıfı veri tabanı aynı iş veya eşit fiyat koşullarında sınırlarda yazılarak aynı anda tamamlanmalıdır.  Açıklama ve veri değişimleri 

Açıklama yapmadan önce, görüşmenin yasallığını önce denemek gerekir.`cancel`Hiçbir değişiklik yapmaz ve durumun sonradan tekrar denemesi için izin vermez.`decline`Bu nedenle, bu ders tüketimi ≠ hiçbir kaldırım ≠ hiçbir kaldırım ≠ hiçbir kaldırım ≠

```figure
t3-roots-boundary
```

## Çözüm

`code/main.py`演示                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `notes_delete`araç:

- `tools/list`返回确定性、可缓存的描述符, gerekli çalışma alanı ve başlık şeması içerir.
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `workspaceUri`参数传递。
- Server  Konutlama  Çalışan Bölgeye erişim hakkı için mevcut ders başlıklarına verilmektedir.
- URI 规范化有效拒绝前混与编码后的目录遍历攻击──
- Tüm zararlı kaldırma, zorunlu bir şekilde çıkarılmasını gerektirir.
- Çözüm 封装在 `resultType: "input_required"`İç yolculuk.
- 签名 的`requestState` kesin aday listesi ve başlangıç parametreleri ile bağlanmıştır
- Giriş edilmiş anti-replacement depolama sistemi birçok sunucuda  örnekler arasında aynı kabul veya düşüş durumunu tekrarlamayı reddedebilir.
- 重试调用全新请求 id ile kabul edilmek ve geri dönmek`resultType: "complete"`- Evet.

Verita depoları, açık bir inceleme anlaşması davranışları için内存 uygulamasını kullanır.

## Kullanım ve çalışmalar

Bu işlevler:

```bash
cd phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/code
python3 main.py
python3 -m unittest discover tests -v
```

预期检查点:

- Bulma 声明 tools 且不包含 Roots。
- Araç keşfi 返回 `notes_delete`, yanım`resultType`、server 、status ve缓存提示──
- Lütfen kimlik göster .`1`- Evet .`inputRequests.delete_choice`İçeri dön.
- Lütfen kimlik göster .`2`Çıkış imzalama durumu并完成删除──
- Önceki: Yalancılık yolu ve kodlama yolu
- 改 başlık 无法复用先前的确认状态──
- 执行 decline 会保留笔记完好无损――
- 共享笔记与重放状态的两个服务器对象无法重复执行同一次确认──
- Açıklama ve açıklama açıklamaları normal çalışacak, ancak URL'leri açıklayacaktır.`-32021`Çekilme gereksinim hatası.
- Desteklenmeyen sürümlerin hata yanıtlamaları`-32022`Veriler yapısı:
- 没有 id 的通知 不产生任何 JSON-RPC 响应──

## 交付产物

`outputs/skill-elicitation-form-designer.md`能够辅助设计显式范围、识别权检查、MRTR 表单、响应分支与状态绑定──it strictly prohibits being abandoned Roots when used as a shadow box, also prohibits through displaying single mode collection of sensitive机密──

## 课后练习

1. Bu işlemler, iki işlemin aynı anda başarısız olduğunu kanıtlar.
2. 增加 `url`Bu nedenle, bu konuda bir diğer seçenek de bulunmaktadır.`inputResponses`- Evet.
3. Bu nedenle, bu konularda, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir sürece bir sürece bir sürecece bir sürecececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececece
4. Çekim, çeken bir bağlantıyı kaçışını engellemeye neden izin vermediğini açıklayın.
5. Design a 2025-11-25 适配器,将现代 MRTR handler 输出映射为旧式服务器 发起的发动,并保持其与当前处理的代码隔离――

## 关键术语

| 术语 | 2026-07-28 中的含义 |
|------|------------------------|
| Roots | 已弃用的提示性工作区指引，不具备鉴权或沙箱隔离能力 |
| 显式权限范围（Explicit scope） | 在请求参数中清晰可见的工作区、目录或 resource 句柄 |
| 路径限制（Containment） | 规范化路径组件校验，确保目标严格限制在受控边界之内 |
| Elicitation | 在 MCP 操作执行期间用于获取用户输入的 client 特性 |
| 表单模式（Form mode） | 使用受限扁平 schema 的带内（in-band）结构化用户输入 |
| URL 模式（URL mode） | 针对敏感或外部工作流的带外（out-of-band）Web 交互 |
| MRTR | 多轮往返请求，返回 input-required 结果后由 client 发起全新重试 |
| `requestState` | 不透明的状态凭证，由 client 原样回显并由 server 进行完整性校验 |
| Decline（拒绝） | 用户明确作出的拒绝操作 |
| Cancel（取消） | 用户主动关闭界面或在未获批准的情况下中断交互 |

## 旧版兼容性

 2025-11-25  versiyonunda sabitlenmiş olan son için,`roots/list`- Evet.`notifications/roots/list_changed`Ve gerçek zamanlı sunucu  Başlat `elicitation/create`Belki de var. Lütfen bu adaptörü miras olarak belirgin bir şekilde işaretleyin. Eski sürüm kök listesi sunucuyu çevirebilir.

## 延伸阅读

- [MCP 2026-07-28 Elicitation](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Roots deprecation](https://modelcontextprotocol.io/specification/2026-07-28/client/roots)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
