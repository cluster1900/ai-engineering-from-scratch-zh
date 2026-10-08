# MCP Server yapılandır: Python ve TypeScript durumu yok

> Modern MCP Server 绝不记住握手状态──它校验每个请求中的元数据,执行对应的处理器,并返回单个带有类型标识的结果──

**Type:** Build
**Languages:** Python, TypeScript
**Prerequisites:** Phase 13 · 06（MCP 基础）
**Time:** ~85 分钟

## Öğrenme hedefi

- Çekilme`2026-07-28`规范实现强制要求的                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `server/discover`- Yöntem.
- Her alınan talebin üstü Üyelik Protokolü Versiyonu ve Müşteri Deneyim Açıklaması
- 以确定性排序暴露 Araçlar, Kaynaklar, İpuçlar 列表──
- Doğru sonuçlar içinde geri dön .`resultType`、Server Identity (Server Kimliği)
- Python ve TypeScript'te, değişken bir stüdyo ile aynı durumsuz protokol anlaşmasını gerçekleştirmek için.

## 问题背景

İlk haber aldıktan sonra, Client 的能力'nın Server'ini kayda kaydetmek için, basit bir uygulama olmasına rağmen, üretim sürecinde çok zayıf bir süreç olabilir. Aynı süreç daha sonra birden fazla Müşteri  için hizmet sunar. Uzaktan gelen istekler de farklı işçilere dağıtılabilir. Eski kapasite bildirimleri daha fazla bilgi sızmasına neden olabilir.

MCP `2026-07-28`规范通过使**每个请求自描述**Bu anlaşma seviyesindeki sorunu tamamen çözdü. Uygulamalarınız hala kalıcı bir not, görev iş veya açık durum sözcüklerini koruyabilir.

Bu ders, iki kez bir not oluşturulacak: Server:Python ve TypeScript  sürümleri sadece protokol çekirdeklerini gerçekleştirmek için orijinal standartlarını kullanır, ikisi de tamamen aynı iletişim yöntemini ortaya çıkarır ve tamamen aynı iletişim sözleşmesini zorla yerine getirir.

## 核心概念

### 现代请求分发循环 (Diplâtörün Çeviri)

```text
读取一行 JSON-RPC 文本
解析外层 Envelope
若为通知（Notification），则不予响应
针对当前请求校验 params._meta
根据 method 执行路由分发
使用 resultType 与 serverInfo 封装成功结果
写回一行 JSON-RPC 响应文本
立即遗忘当前请求作用域的元数据
```

Studio Mode'da üç önemli kural vardır:

- 仅向 stdout 写入 JSON-RPC 消息; tüm 调试与诊断日志 转向输出至 stderr。
- 报文以换行符分隔,并在每次写回应后执行 flush──
- EOF'a ulaştığında, süreç hemen çıkmalıdır.

进程in yaşam döngüsü sadece fiziksel aktarım katmanının yaşam döngüsünü temsil eder, modern MCP 协议 anlamında kesinlikle Sessiyon değildir.

### Lütfen veri deneyimi yapın

Her talebinde şunlar bulunmalıdır:

```json
{
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "notes-client",
        "version": "1.0.0"
      }
    }
  }
}
```

Önceki iki bölüm:`clientInfo`Öneriler: Eğer kimlik verileri sağlanırsa, veri yapısını doğrulayabilirsiniz, ancak kesinlikle güvenlik sertifikası olarak görülemez.

Eğer bu versiyon desteklenmiyorsa, geri dön hata kodu`-32022`Ve beraberinde`requested`ile`supported` Eğer istekle veri eksikliği, yasadışı parametre, return error code `-32602`❖ Hiç tarihi bir şekilde eksik olan değer verilerini dolduramaz.

### 强制的服务发现 (Mandatory Discovery)

现代 Server                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `server/discover`◊ Bir tam hizmet bulma sonucu desteklenen modern protokol sürümleri, Server  kapasite kitleri, seçilebilir kullanım açıklaması, depolama önerileri ve sonuçları içerir.`_meta`Orta Sunucu Kimlik Kimliği:

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {"listChanged": false},
    "resources": {"listChanged": false, "subscribe": false},
    "prompts": {"listChanged": false}
  },
  "ttlMs": 3600000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "notes-server",
      "version": "2.0.0"
    }
  }
}
```

Servis Discovery Not Unlock Server'ın Önemi Büyüktür. Müşteri tamamen bir keşif düzenlemesi olmadan doğrudan başlatabilir.`tools/list`Çünkü ...`tools/list`Kendisi de aynı talep veriyi taşıyor.

### Araçlar

`tools/list`返回具有确定性排序工具 描述符列表──稳定排序能提高响应缓存命中率,并保持模型 Prompt 上下文的稳定性──该结果同样要求携带`ttlMs`和 `cacheScope`- Evet.

`tools/call`返回内容块( içeriği blokları) 和 `isError`状态── Sözleşme kapsamı veya yöntem parametri yasadışı olduğunda, JSON-RPC  hata yanıtları; 合规的工具 调用成功触发但在业务执行层面失败时,返回带有 `isError: true`Bu da bir normal sonuç.

Araç Notasyonları) sadece Host'ın ipucunu ver, zorunlu bir şekilde gerçekleştirilmeyi temsil etmez:

- `readOnlyHint`
- `destructiveHint`
- `idempotentHint`
- `openWorldHint`

Host, bu bilgileri iletişim doğrulama ve kullanıcı araları sunumları için kullanmalıdır, ancak Server, iş seviyesinde gerçek bir yetki vericiliğini zorlamalıdır.

### Kaynaklar ((resurs)

`resources/list`返回稳定的 URI 描述符──`resources/read`返回带类型内容──在 `2026-07-28`规范中, 两者均属于可缓存结果,必须包含 `ttlMs`和 `cacheScope`- Evet.

Kullanıcıya ait özel not verileri için kullanılması gerekir.`cacheScope: "private"` 共享缓存绝不能跨授权上下文复用私有响应──

现代数据变更推送 artık kullanılmıyor `resources/subscribe`Müşteriyi gönderiyorum.`subscriptions/listen`Açıklama`resourceSubscriptions`Ya da listesi değişir olaylar için uzun bağlantı gönderme

### İpuçlar (提示模板)

`prompts/list`Aynı şekilde kaydedilebilir ve kesin bir düzenleyicilik vardır.`prompts/get`染指定的参数 染指定的命名 Prompt──染后的 Prompt 结果属于完整的结果,但不需要如列表或读操作那样附附缓存提示──

### Her başarıdan bir sonuç çıkar.

Kod uygulamasında, tüm başarılı yanıtları birleştirilmiş paketleme makinesi ile işleyebilirsiniz:

```python
def complete(payload):
    return {
        "resultType": "complete",
        **payload,
        "_meta": {SERVER_INFO_KEY: SERVER_INFO},
    }
```

List, Okuş ve Servis Bulma İşçisi Ekstra Ekstra`ttlMs`ile`cacheScope`❖ Kesinleştirilmiş işleme, bireysel işlemeyi önleyebilir ❖ Modern kuralların gerekli bölümlerini kaçırmayı ❖

### 绝不发起 Server 端请求

Modern Server'ın gönderilmesi ve istemciyle doğrudan ilgili bildirim istemek veya istemci tarafından açılması mümkündür.`subscriptions/listen`流中推送通知──但服务器 **绝不能**主动发起独立的 JSON-RPC 請願──

İşleyici  örnekleme   Çıkış  Roots 输入时, it returns a `input_required`Sonuç: Müşteri, talebini yerine getirmek için yeni bir talebinin kimliğini kullanır.

```figure
t3-dispatch-loop
```

## 动手实践

Python Server'ın 运行完整演示与测试:

```bash
cd code
python3 main.py --demo
python3 -m unittest discover tests -v
```

TypeScript 运行器运行 TypeScript 版本 kullan:

```bash
npx tsx main.ts --demo
```

Gösterim süreci gönderilir`server/discover`、 her orijinal dilini 、 kullanma araçlarını listede, ve desteklenmeyen sürümlerde rapor hatası gösterir.

## 交付物

本课交付 `outputs/skill-mcp-server-scaffolder.md` Modern standartlara uygun bir sunucu tasarım bluetü oluşturabilir, hizmet bulma anlaşması, taleplerin birbiriyle karşılaştırılması, belirsizlik kaydının bir listesi ve seçilebilir bağımsız mirasın bir katmanını kapsar.

## 练习与思考

1. Bir istek içinde taşıma yetenekleri 字段,证明 Server 绝不会复用前请求中声明的旧能力──
2. 颠倒     altüst`TOOLS`- Evet.`PROMPTS`及笔记数据的录入顺序, tüm listeler sorgu sonuçlarının sabit kalmış olduğunu doğrulayın.
3. Yeni bir yıkıcı `notes_delete`工具, ve executor内部加入鉴权检查,验证 `destructiveHint`Sadece bir önceki görüşme.
4. 补充 `resources/templates/list`接口,要求附带 `ttlMs`- Evet.`cacheScope`Ve kesinlik sırası.
5. Çı`2025-11-25`编写一个完全隔离的 Legacy 适配器,并通过测试证明现代请求绝不会错进 Legacy 处理路径──

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| 无状态 Server (Stateless server) | 仅从每个请求自身的元数据处理调用，无任何协议 Session 内存记忆 |
| `server/discover` | 强制实现的现代方法，用于向调用方公布支持的版本与功能集 |
| 完整结果 (Complete result) | 携带 `resultType: "complete"` 的成功现代结果 |
| 可缓存结果 (Cacheable result) | 附带强制 `ttlMs` 与 `cacheScope` 提示的发现、列表或只读结果 |
| 确定性列表 (Deterministic list) | 逻辑相同的注册表必须输出完全一致、可复现的条目顺序 |
| Server 身份 (Server identity) | 在结果 `_meta` 中携带的 `io.modelcontextprotocol/serverInfo` 标识 |
| Tool 业务错误 (Tool error) | Tool 调用正常被解析执行，但业务逻辑失败，返回包含 `isError: true` 的 content |
| 协议错误 (Protocol error) | 非法的 JSON-RPC 格式或无效的 MCP 请求参数，直接通过顶层 `error` 报错返回 |

## 延伸阅读

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
