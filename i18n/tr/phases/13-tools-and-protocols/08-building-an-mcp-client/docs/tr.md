# 构建 MCP Client:服务发现、路由与双时代回归

> Modern MCP Client her bir istek üzerinde tümüyle tekrar tekrarlamasını yapar. Eski Server'in gerçek bir Legacy yapı olduğuna karar vermek için en zorlu uyumluluk kararı verir.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07（构建 MCP Server）
**Time:** ~85 分钟

## Öğrenme hedefi

- Her MCP için`2026-07-28`Lütfen, 0 yapıdaki en son veri paketini oluşturun.
- Kullanım`server/discover`探测 stadio tabanlı sunucu,并协商双方均支持的版本──
-                                                                                                                                                                                                                                                               
- Sadece desteklenen sürümün geçerli olduğunu kanıtlamıştır.`initialize`Sonuçta, sadece mirasını kabul ettim.
- 合并确定性 Araç 列表, 杜绝静默覆盖重名冲突──
- Bu nedenle, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir sürececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececece

## 问题背景

Ajan Host genellikle birden fazla MCP Server ile aynı zamanda iletişim kurmalıdır. Her bir sunucuyu bulunmalıdır.

`2026-07-28`规范, her istek tamamen kendi kendine içerdiği için sabit bir işlevi çok basitleştirir.

- 支持首选版本的现代 Server;
- 返回可识别的版本或 Header 错误的现代 Server;
- Hiç duymadım .`server/discover`                                                                                                                                                                                                                                                              
- - Tamam .`initialize`Elini uzat ve sessiz kal.

Eğer tüm tespit hataları genel olarak Legacy Server olarak görülürse, bu çok tehlikeli olacaktır. Şekilde hata yapan modern istekler, yüklenen Server, gerçek eski Server ile bağlantılı süreçler, aynı süper zaman veya bağlantı kesinti sinyallerini oluşturabilir. Bu sinyaller kendiliğinden farklılıklarla dolu olacaktır. Müşteri, açıkça çalışanların niyetlerini doğru yönlü bir protokol kanıtı ile birleştirmeli, böylece kararlar Legacy çağına girmelidir.

## 核心概念

### Üzerine (Örtüm) ve anlaşma (Association of European Economic and Social Developments)

Her bir sunucu süreci veya ağ端点维护一个传输对端 (Transport Peer) kayıt:

- 传输句柄或发送函数;
-  selected协议时代与具体版本号;
- Son keşfedilen sunucu yetenekleri;
- Son kez çekilen kesinlik araç listesini;
- İsteği kimliği 映射;
- 传输层的物理健康状态──

Bu, Client'in içindeki yönetim hesabına aittir, kesinlikle çağrılan  protokol Sessiyon  durumu ── modern MCP'de, sunucu hala her işletme talebinde bağımsız olarak mevcut sürüm ve kapasite açıklamasını alır.

### Çıktırma ve kurulum

```python
def modern_request(request_id, method, params, version, capabilities):
    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "method": method,
        "params": {
            **params,
            "_meta": {
                "io.modelcontextprotocol/protocolVersion": version,
                "io.modelcontextprotocol/clientCapabilities": capabilities,
                "io.modelcontextprotocol/clientInfo": CLIENT_INFO,
            },
        },
    }
```

Bağlantı nesneye sadece bir kez eklenmesi gerekmez. Net bir bağlantı bağlantısına ulaşabildiğini varsaymak için.

### 现代服务发现

`server/discover`返回支持的版本、Server 能力、使用说明、缓存提示以及推的 Server 身份──Client 选择双方均支持的最高现代版本──

純現代クライアント için, servis bulunması seçeneğe uygun; ancak studio 模式下 şiddetle önerilen kullanım.`tools/list`Bu, gerçek başarının bir parçası olabilir.`server/discover`能够建立分明的时代分界线──

### stdio 兼容性探测流程

双时代(iki çağ) stdio Müşteri 在发送任何其他请求之前,优先发送携带其首选现代元数据的 `server/discover`❖ Üç tür sonuç elde edilebilir:

1. **DiscoverResult（成功发现）**Server için modern yapı, ortak destekletilmiş bir sürüm seçmek ve her istekle veri taşımak için iş iletişimini sürdürmek.
2. **Recognized modern error（已识别的现代协议错误）**:Server 仍然为现代架构──若返回 `-32022`, `data.supported`中选择可用版本并使用新请求 ID 重试;若为头条或 Capability 错误,修正请求内容即可──**严禁回退发送 `initialize`。**
3. **Ambiguous signal（歧义信号）**JSON-RPC 报错、超时、连接关闭或空响应均无法确定协议时代──必须默认按失败关闭(fail closed),除非该端被运维显式配置了继承 兼容白名单──

已识别的现代协议错误码包括:

- `-32020`BaşlıkTamışmaz( başlık ile başlık eşleşmiyor)
- `-32021`EksikKlientKabilliği (Klient 能力)
- `-32022`Desteklenmeyen ProtokolVersion(不支持的协议版本)

Hatta, bir gün bile çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaş hatalar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağdaşlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar, çağlar,`initialize`Bu tehlikeli bir saldırı.

Kesinlikle yapamazsın.`-32601`(metod uncovered) Legacy'ye girme hakkının tam olarak kanıtlanması için, yalnızca bir kez sınırlı süreyle bir Legacy araştırması başlatmak için yeterli durumda olduğunu temsil eder.

### BİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİNİN

Miras 兼容性, belirtilen terminal konutlamalarının açık özelliği olmalıdır:

```python
client.add_server("archive", archive_transport, allow_legacy=True)
```

Bu seçeneği belirgin bir konumu belirlemek için bağlamak gerekir.`allow_legacy=True`Bu yüzden, bu konuda bir şey yapmamalıyız.`initialize`- Evet.

White List sadece arama başlatma hakkını veriyor. Müşteri, nakliye aşamasında zorunlu bir süre içinde tek bir gönderiyor.`initialize`Lütfen, sonra ciddi şekilde aşağıdaki şartları yerine getirmek için:

-  Bu talebe uygun bir JSON-RPC alındı `2.0`响应;
- Sadece içerir`result`字段,且无 `error`- ...
- `protocolVersion`ten Client 允许配置的旧版集合中属于;
- 包含对象类型 `capabilities`字段;
- 包含非空字符串 `name`ile`version``serverInfo`- Önemli bir şey.

任何超时、断开、报错、形结果、ID 错乱或未支持的版本均直接失败──只有结构完全合规的正向结果才能对端标记为Legacy 时代──

### 命名空间无冲突合并

İki sunucu , isimlerini ortaya çıkarabilir .`search`Bu yöntemleri kullanmak gerekir:

1. **冲突时加前缀（Prefix on collision）**: ilk araçların kurallarını korumak, sonradan yeniden kullanmak`<server>/<tool>`- Evet.
2. **冲突时拒绝（Reject on collision）**:不加载重复工具,并抛出清晰的配置报错──
3. **静默覆盖（Silent overwrite）**- ...**坚决杜绝**❖ Bu modelin gerçekte kullanıldığı hedef sunucuyu gizler.

### 调用路由机械

路由是纯粹的映射查找:

```text
规范工具名
  -> 对端名称 + 本地工具名
  -> 生成全新的 JSON-RPC 请求 ID
  -> 现代请求元数据 或 显式 Legacy 结构
  -> 匹配响应 ID 并返回
```

```figure
tp-client-merge
```

## 动手实践

`code/main.py`內存對端函数 通過內存對端函数 透過清晰顯示了整个协议决策树──它連接到兩现代對端和一顯白名单标志的傳承對端,合并并路由它们的工具:

```bash
cd code
python3 main.py
python3 -m unittest discover tests -v
```

单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元测试 单元

- 现代请求逐次重复元数据;
- - Görüşmek .`-32022`时重试现代发现,绝不退化为握手;
- 已识别的现代错误绝不发生降级;
- 超时、断开与未知错误在无白名单时绝不触发 `initialize`- ...
- Yeni listeler sadece yeni standartlara göre kabul edilir.`initialize`响应后才成立为遗产;
- Seçilen zaman, son nakliye yaşam döngüsünde sabit olarak varlığını sürdürmektedir.

## 交付物

本课交付 `outputs/skill-mcp-client-harness.md`◊ bu, modern istekler için kullanılabilir.

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| 对端 (Peer) | Client 端维护的单个 Server 传输句柄及其发现信息的记录实体 |
| 协议时代 (Protocol era) | 现代逐请求元数据模式，或旧版初始化握手语义 |
| 服务发现探测 (Discovery probe) | 用于识别 stdio 对端时代的初始 `server/discover` 请求 |
| 已识别现代错误 (Recognized modern error) | 证明对端属于现代架构并禁止 Legacy 回退的特定协议错误 |
| Legacy 白名单 (Legacy allowlist) | 运维显式授权对指定对端进行一次受限兼容探测的配置 |
| 正向 Legacy 证据 (Positive legacy evidence) | 针对受支持旧版协议返回的有效、ID 匹配的 `initialize` 结果 |
| 合并命名空间 (Merged namespace) | 跨所有活跃对端规范化后的工具全局名称集合 |
| 冲突策略 (Collision policy) | 处理重名工具的加前缀或报错拒绝规则 |

## 延伸阅读

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
