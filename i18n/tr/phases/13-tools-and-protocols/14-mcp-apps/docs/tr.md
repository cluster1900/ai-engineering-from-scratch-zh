# Stateless protokolüne dayalı MCP Uygulamaları

> 交互式結果本质上仍然是MCP aracı ve kaynakların değişim süreci. 2026-07-28 核心规范让这个交换过程完全自含,而Apps 扩展则进一步添加了沙箱化浏览器运行界面.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources)
**Time:** ~75 minutes

## Öğrenme hedefi

- - Evet .`server/discover`MCP Uygulamaları ile ilgili görüşmeler yapıldı.
- Bu araçın kullanımı için kullanılırken, bu araçın tanımlanması için kullanılırken,`ui://`kaynaklı kaynaklar
- 2026-07-28  无状态连线上返回完整的工具与资源 执行结果──
-  Özel Kullanımlar `ui/initialize`桥接消息 ve iptal edilmiş MCP 核心握手 严格区分开来──
- 综合应用源验证 (origin validation) 沙箱隔离 (origin validation) 沙箱隔离 (origin validation) 沙箱隔离 (origin validation) 沙箱隔离 (origin validation) 沙箱隔离 (origin validation) 沙箱隔离 (origin validation) 沙箱隔离 (origin validation) 沙箱隔离 (origin validation) 沙箱隔离 (origin validation) 沙箱隔离 (origin validation) 沙箱隔离 (origin validation) 沙箱隔离 (origin validation) 沙箱隔离 (origin validation) 沙箱隔离 (origin validation) 沙箱隔离 (origin validation) 沙箱隔离 (origin validation) 沙箱隔离 (origin validation) 沙箱隔离 (origin validation) 沙箱隔離 (origin validation) 沙箱隔離) 沙箱隔離 (origin) 内容 security (origin limit) 原則) ⋅

## 问题

純文文結果時間線'i tarif edebilir, ancak kullanıcılara özgürce seçilebilecek, incelenebilecek veya etkileşime girebilecek bir hareketli zaman hattı sağlayamaz.

MCP Apps                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `ui://`kaynaklılık: Host, araçın çalışmasından önce önce önce öncelikleriyle kontrol edebilir, kaynakları bir sandıkla yapıştırılmış bir iframe içinde bulabilir ve JSON-RPC 桥接协议协调代理所有 app 操作。

核心协议 2026-07-28 规范中发生了深刻变化.

- Çekirdek yok.`initialize`Lütfen.`notifications/initialized`İletişim.
- Yok .`Mcp-Session-Id`Lütfen başını...
- Her isteğim var .`params._meta`Orta taşıta protokol versiyonu ve müşteri yetenekleri.
- Sunucu  gerçekleştirilmelidir `server/discover`, müşteriye 审查协议版本、核心能力与扩展支持──
- Her başarı sonuçları da beraberinde gelir.`resultType`- Bilgisayar.
- Akışla HTTP için her istek için tek seferde POST kullanmak.

桥接通信中仍包含名为 `ui/initialize`通信方言, kesinlikle herhangi bir çekirdek MCP 会话ı diriltmeyecek.

## 核心概念

### İki protokol katmanı, bir tam özellik

保持清晰的分层视角:

1. MCP 核心协议承载 `server/discover`- Evet.`tools/list`- Evet.`tools/call`- Evet.`resources/list`Ve `resources/read`- Evet.
2. MCP Apps  genişletilmiş kullanıcı kullanımı açıklamak için, iframe tanımlamak için host'ın bağlantı bağlantısı için.
3. 浏览器沙箱规则严格限制该UI所可触及的边界──

扩展标识符为 `io.modelcontextprotocol/ui`◊两端均采用选择性加入(opt-in) mekanismesi── Müşteri, her bir istek kapasitesinde, kullanıcılar arasında genişletilmesini desteklediğini belirtir:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "server/discover",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/ui": {}
        }
      },
      "io.modelcontextprotocol/clientInfo": {
        "name": "timeline-host",
        "version": "1.0.0"
      }
    }
  }
}
```

`clientInfo` Diagnostic 排错.                                                                                                                                                                                                                                                           

### 染前发现声明

Server'ın keşfi sonuçları bu genişlemeyi desteklediğini açıkladı:

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {},
    "resources": {},
    "extensions": {
      "io.modelcontextprotocol/ui": {}
    }
  },
  "ttlMs": 300000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "timeline-app-server",
      "version": "2.0.0"
    }
  }
}
```

Server  Discovery'yi desteklemesi gerekiyor. Ancak her hareketin öncesinde istemci keşif kullanmak zorunda değildir. Çünkü her hareket kendi kendine kendi yeteneklerini taşır.

### Çalışım tanımlama içinde açıklama

现代 Apps 契约在 `tools/list`Uygulama kullanıcılarını belirli bir araçla bağlamak:

```json
{
  "name": "notes_timeline",
  "description": "Render a timeline of notes.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "_meta": {
    "ui": {
      "resourceUri": "ui://notes/timeline.html"
    }
  }
}
```

Bu, kullanılmış olan statik veri için tasarlanmıştır. Host HTML'in gerçek kullanılma sonuçları gerektirdiği zaman önce, önceden yüklenebilir, depolanabilir ve HTML'e güvenlik gözden geçirilebilir.`_meta.ui.resourceUri`Yapı:

Şu anki temel kurallarda`tools/list`Bu, bir dizi belirlenme sırasını içerir.`ttlMs`Ve `cacheScope`◊ Kullanıcı veya sertifika farklılıkları varsa, kullanın `private`- Evet.

### 返回数据,交由 主人公 绑定视图

Araç 调用回归常规内容与结构化数据:

```json
{
  "resultType": "complete",
  "content": [
    {"type": "text", "text": "Timeline ready."}
  ],
  "structuredContent": {
    "notes": [
      {"id": "note-1", "title": "Discover", "created": "2026-07-28"}
    ]
  },
  "isError": false
}
```

Host                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

### App  olarak Kaynak  hizmet sağlayıcı

Çünkü sunucu keşifte açıkladı .`resources`Bu nedenle zorunlu bir uygulama yapılması gerekiyor.`resources/list`操作──其确定性的列表条目包含规范 URI、稳定的名称、描述以及 MIME 类型──列表结果同样包含 `resultType`Server, veri.`ttlMs`和 `cacheScope`, tıpkı kesinlik aracı gibi 列表

Ev sahibi 发送 `resources/read`在 Streamable HTTP 上, request has the following structure:

```text
POST /mcp
MCP-Protocol-Version: 2026-07-28
Mcp-Method: resources/read
Mcp-Name: ui://notes/timeline.html
```

HTTP 头字段值 JSON-RPC 正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文  正文     正文                                                                                                                                               `-32020`- Evet.

返回結果包含 HTML kaynağı ve缓存提示:

```json
{
  "resultType": "complete",
  "contents": [
    {
      "uri": "ui://notes/timeline.html",
      "mimeType": "text/html;profile=mcp-app",
      "text": "<!doctype html>...",
      "_meta": {
        "ui": {
          "csp": {
            "connectDomains": [],
            "resourceDomains": [],
            "frameDomains": [],
            "baseUriDomains": []
          },
          "permissions": {}
        }
      }
    }
  ],
  "ttlMs": 60000,
  "cacheScope": "public"
}
```

### UI Kaynakları  View作可执行内容缓存

Uygulama kaynağı ve genel metin içeriği arasında bir içerik farkı vardır.`cacheScope`Özellikle, depolama anahtarları düzenlemeleri içermelidir.`ui://`URI ✓ giriş sunucu ✓ özellik ve sürüm ✓ kaynak                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

Bu durumda, kayda düzenlemesini geçersiz kılmak gerekir:`ttlMs`Zamanı, aletleri.`_meta.ui.resourceUri`绑定发生变更、服务器 版本或准入描述符固定指纹变更,或已确认的资源变更订阅中指定该 URI──在重新挂载之前,必须重新拉取并重新进行 CSP 和权限审查──过期的iframe 绝不能仅仅因为新版本的资源 尚未加载完成就继续保留更广泛的权限──

### Bu konuda bir çok farklılık var.

校验逻辑 has a strict precedent sequence: öncelikle JSON-RPC biçimi, zorunlu bir string protokolü olarak veri ile nesne tipi istemci yetenekleri 映射 tablosu; ardından核对路由请求头条是否符合正文内容;最后才判断匹配协议版本是否支持── bu sırada, temsilci aracılık ve son sunucuların aynı talebe karşı farklı yorumlar yapmalarını etkili bir şekilde önleyebilir.

| 异常情况 | HTTP 状态码 | JSON-RPC 错误 |
|---|---|---|
| 请求头与正文在版本、方法或名称上不一致 | 400 | `-32020` |
| 请求头与正文一致，但版本不受支持 | 400 | `-32022`，且 `data` 准确为 `{"supported":["2026-07-28"],"requested":"<实际版本>"}` |
| `resources/read` 缺少 Apps 扩展 capability | 400 | `-32021`，附带 `data.requiredCapabilities.extensions.io.modelcontextprotocol/ui` |
| 请求的方法未知 | 404 | `-32601` |

JSON-RPC bildirimi 没有 `id`Bu nedenle sunucu 绝绝不能为其生成 JSON-RPC 响应──接受的HTTP通知会返回带有空正文的 202── hatalar HTTP 状态码i değiştirse de, yine de bildirim için JSON-RPC 错误正文 olarak üretemez.

### 沙箱は防御境界,而非信任背书

Host 牢牢掌握着iframe──App 无法直接读取主机的cookie──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储.

Lütfen aşağıdaki güvenlik kurallarını takip edin:

- Tüm CSP 域名列表默认置空, sadece App 添加 真正需要的来源(origin) 』将`connectDomains`Getch  XHR  ve WebSocket için kullanılır.`resourceDomains`Yazı, biçim, resim ve yazı için kullanılır.
- Mümkün olduğu durumlarda, kod ve kaynak verileri içerebilir.
- Kullanıcı tarafından görülebilir fonksiyonlar belirtilmedikçe, fotoğraf, iklim veya coğrafi konum yetkisi talep edilmez.
- - Ben de .`postMessage` Strengly bound to an exact origin of the end, refusing to come from any other origin of the event―
- Bu, bir araç olarak görülen bir girişdir.
- Kullanıcı onayını kullanıcının onayını kullanıcının onayını kullanıcının onayını kullanıcının onayını kullanıcının onayını kullanıcının onayını kullanıcının onayını kullanıcının onayını kullanıcının onayını kullanması için kullanılır.

Öğrencilik yapma.`sandbox`属性直接照搬至所有主中──Host 必须根据App's source model及其自身的隔离设计来谨慎选择沙箱 标志──

允许的域名仍然属于数据外发信.`connectDomains: ["https://api.example.com"]`Bu uygulama içindeki herhangi bir işlem için veri veri gönderilebilir. Bu adreste doğru bir kaynak belirlenir. Ama yüklenme içeriğinin geçerli olup olmadığını belirleyemez. Bu nedenle, kullanıcıların isteklerini kontrol etmek için, iframe'ye yerleştirilmesini engelleyerek, iframe'e bağlantı kurmayı engelleyerek, mümkün olduğunca host aracı aracılığıyla, küçük işlem, sınırlama istekleri ve yanıt büyüklüğü ile, hangi kullanıcı isteklerini gerçekleştirdiğini kontrol eder.`resourceDomains`ile`connectDomains`Açıklama; yazı tipi veya yazı yazma hakkı kesinlikle herhangi bir aktarma hakkı verilmemelidir.

### Uygulamalar 桥接通道 bağımsız bir yaşam döngüsü ile

Uygulamalar 桥接协议 is established `postMessage`之上 JSON-RPC 方言──它可以交换 `ui/initialize`ile`ui/*`通知, aynı zamanda çekirdek anlaşma yöntemlerini temsil edebilirsiniz.`tools/call`)。

Görüntü 发送带有 `appInfo`和 `appCapabilities`   `ui/initialize`▽ Host 返回其能力与 host 上下文── yalnızca bu yanıtın aldıktan sonra,View 才会发送 `ui/notifications/initialized`❖ Host 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥

Bu bir yerleşim, tek bir iframe ile tek bir ev sahibi penceresi arasında bir brid梁 oluşturdu. MCP 协议 versiyonunu müzakere etme sorumluluğu yoktur, sunucu  durumu oluşturmaz, ne de bir transmisyon katman toplantısı yapmaz.`notifications/initialized`已被移除,而Apps 扩展中的 `ui/notifications/initialized`依然保留──桥梁生成的工具调用所触发的核心请求, 一个拥有全新的 JSON-RPC id 和完整的请求元数据的、自含的独立请求──

### Host 上下文、动作 Yönetim ve Yönetim İptalı

Host, bu yönlendirmenin en yüksek yetkisini sürdürüyor. Bu yönlendirmenin en yüksek yetkisini sadece host tarafından açıklama yapabilmesi için kullanılabilir.

Konuyu, boyut ve engelli uyumsuzlukla (aksesibilite) bir kez değil, hareketli değişimlerin ev sahibi olarak görme:

- 应用主机 提供的颜色与排版代码,主题或对比偏好变动时实时响应
- 允许查看上报其期望的尺寸,但由主播 限制并应用 iframe 尺寸,防止内容脱离布局或构建欺骗性遮盖层──
- Bu nedenle, bu sistemin içinde, bir ekran okuyucuya göre bir kısım olarak, bir ekran okuyucuya göre bir kısım olarak, bir ekran okuyucuya göre bir kısım olarak, bir ekran okuyucuya göre bir kısım olarak, bir ekran okuyucuya göre bir kısım olarak, bir ekran okuyucuya göre bir kısım olarak, bir ekran okuyucuya göre bir kısım olarak, bir ekran okuyucuya göre bir kısım olarak, bir ekran okuyucuya göre bir kısım olarak, bir ekran okuyucuya göre bir kısım olarak, bir ekran okuyucuya göre bir kısım olarak, bir ekran okuyucuya göre bir kısım olarak, bir ekran okuyucuya göre bir kısım olarak, bir ekran okuyucuya göre bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak
- pencerenin ayarlı boyut ve yeniden düzenlenmesinden sonra, yeniden test eden host kontrolü ile View kontrolü arasındaki odak dönüşümü

Uygulama açılışında, kullanıcıların hesap değiştirmesi, güvenlik stratejisi değişmesi, sunucuların ayrılık incelemesi veya sunucuların sınırlandırılması nedeniyle yetki alanı kısaltılmış olması nedeniyle ilgili yetkinlikler ortadan kaldırılabilir.`ui/initialize`握手时检查── once the privilege is revoked, should immediately refuse to hang up privilege调调调, stop no longer complying with the strategy of the network activity, clean sensitive infected state, and no longer be accessed when the UI resource itself is re-located or degraded back to the text mode── View 必须 will refuse to view normal results properly dealt with, don't blindly repeat again until host 妥协──

### 降级退退是契约的必要组成部分

Apps  Anlama yeteneğine sahip olan sunucu  açıklanmamış kullanıcı açısından genişletilmiş sunucuya hizmet verebilmelidir:

- - Evet .`tools/list`中返回不带 `_meta.ui`Aynı alet.
- Çı`tools/call`Değerli kalın.
- Açıklanmamış yetenekleri sunucusunun 读取 UI `resources/read`时返回缺失能力 错误――
- Bu, bir sistemin varlığını kesin olarak ortaya çıkarır.

```figure
t3-ui-sandbox
```

## Çözüm

`code/main.py`İşe Asılı olmayan SDK  Yapılandırılmış bir süreç içi protokol modeli                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `server/discover`声明 Apps 扩展, list出工具与资源,执行工具,并提供自含的HTML资源 服务──

Modelle alınan çözülmüş olan doğru metin ve yol başlığıdır.`Content-Type`Ya da`Accept`◊ tam akışlı HTTP 适配器 lütfen okuyun 第 09 课, it requires `Content-Type: application/json`Ve`Accept`Aynı zamanda içerir.`application/json`ile`text/event-stream`- Evet.

运行测试:

```bash
cd phases/13-tools-and-protocols/14-mcp-apps
python3 code/main.py
python3 -m unittest discover code/tests -v
```

Çekim ve çıkışın beş temel özelliği:

1. Her seferinde tamamen bağımsızdır.
2. Her dileğin yanında .`_meta`yetenekleri,
3. `resources/list`Bu nedenle, bu bilgiyi kullanmak için kullanın.
4. Her sonuç da var .`resultType`Ve sunucu olarak veriyi kullanıyorum.
5. Hiçbir temel anlaşma var değil.

## Kullanım ve çalışmalar

- Evet .`server/discover`Başlayın.`io.modelcontextprotocol/ui`Serverenin genişleme grafiklerinde görünmektedir. Ardından, taşıyan ve taşımayan uygulamaların yeteneği durumunda iki kez uygulanmaktadır.`tools/list`İlk kez kaynak açıklaması 绑定, ikinci kez doğrudan kullanılabilir saf metin aracı olarak tutmak.

读取 `ui://notes/timeline.html`在HTML中检索 `hostOrigin`Ve `event.origin`防护代码── bu iki satır kod, geçidinin kullanılmadığı için en az tanıklık edilecektir.

## 交付产物

本课交付 `outputs/skill-mcp-apps-spec.md` Framework Code'u yazmadan önce, uygulamanın 契约'unu incelemek için kullanılabilir. Bu, tasarımcıların açık bir açıklamasını zorlar.

## 课后练习

1. Müşteri yeteneğini değiştirmek için boşluk genişleme grafikini onaylamak.`tools/list`Bu aracı korudu ama UI kaynaklarını kaldırdı.
2. Gönderme`Mcp-Name: ui://notes/other.html`Ama doğru zamanda yanlış olduğunu doğrulamak için bir zaman çizelgesi okumak isteniyor.`-32020`- Evet.
3. Kaynakın depo özelliğini değiştirmek için`cacheScope: private`◊ Bu konuma katkıda bulunmalarını sağlayan kullanıcı özellik koşullarını açıklamak.
4. Yazım kaydedildi .`https://static.example.com/app.js`将该起源 添加到 `resourceDomains`Bu nedenle, yeni bir tedarik zinciri güvenliği riskini açıkladı.
5. 增加一个 `notes_open`Kullanıcı onayını her zaman host tarafında tutmak için.

## 关键术语

| 术语 | 含义 |
|------|---------|
| MCP Apps | 由 MCP host 渲染交互式 HTML 的可选扩展规范 |
| `io.modelcontextprotocol/ui` | 通信双方声明的扩展标识符 |
| `ui://` | 用于标识 App UI 模板的专用 resource scheme |
| `text/html;profile=mcp-app` | 用于 MCP App HTML 的标准 MIME 类型 |
| `server/discover` | 用于协议与 capability 发现的当前规范 RPC 方法 |
| `resources/list` | 当 server 声明支持 resources 时强制必须实现的资源枚举方法 |
| `resultType` | 现代协议规范中成功的返回结果所必须携带的判别器 |
| `ui/initialize` | Apps 桥接通道的首个请求，与已移除的核心协议握手完全独立 |
| `ui/notifications/initialized` | Apps View 在收到 host 响应后发出的就绪通知 |
| CSP | 用于限制脚本、样式、图片和网络 origin 的浏览器内容安全策略 |
| 文本降级（Text fallback） | 面向不支持 Apps 扩展的 host 所保留的 tool 基础行为 |

## 延伸阅读

- [MCP 2026-07-28 base protocol](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP Apps overview](https://modelcontextprotocol.io/extensions/apps/overview)
- [MCP Apps build guide](https://modelcontextprotocol.io/extensions/apps/build)
- [Official extension support matrix](https://modelcontextprotocol.io/extensions/client-matrix)
