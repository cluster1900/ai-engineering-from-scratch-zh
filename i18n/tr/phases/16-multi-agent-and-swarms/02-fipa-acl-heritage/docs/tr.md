# FIPA-ACL ve Konuşma Aktı'nın bir aktarımı

> MCP'den önce, A2A'dan önce, FIPA-ACL vardı. 2000 yılında, İIEEE Akıllı Fiziksel Ajanlar Vakfı, 20 performanslı ızdıracak iki içerikli dil ve bir dizi etkileşim protokolü içeren bir ajan iletişim dili onayladı. Sözleşme net ızdıracak, abone olacak, bildirmek isteyecek zaman. Endüstri dünyasından bu yüzden çıktı, çünkü ontoloji ızdıracak ve web'e satış yapmak çok ağır, ancak LLM tarafından desteklenen çoklu ajan sistemleri ızdıracak, ızdıracak, ızdıracak, ızdıracak, sadece resmi anlamsızlık: JSON sözleşmeleri ızdıracak, ızdıracak, ızdıracak ızdıracak ızdıracak.

**Type:** 学习
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 01（Why Multi-Agent）
**Time:** ~60 分钟

## 问题

2026 yılında ajan-protokolu alanı çok yoğun: araç için MCP, ajan için A2A, işletme denetimi için ACP, güvenin merkezileştirilmesi için ANP, doğal dil içerikleri için NLIP, CA-MCP ve yirmi araştırma önerisi eklenir.

诚实地看, bunların çoğu çok spesifik bir ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ 

MCP'yi gördüğünde`tools/call`、A2A'nın görev yaşam döngüsü veya CA-MCP'nin paylaşılan bağlamı depolama 、 FIPA  kararlarının daha yumuşak bir biçimi 、 JSON- doğuştan gelen bir tekrar anlatımı görürsünüz. Bu bölümün anlatımını öğrenmek size iki şeyi söyleyecektir: hangi yeni yenilikler  yenilikler  aslında yeniden ortaya çıkmıştır, ve yeni özellikler hangi eski başarısızlık modlarını yeniden bulacaktır.

## 概念

### Uzal a段话 anlamak Konuşma eylemleri

Austin, bazı cümlelerin dünyayı tanımlamakta değil, dünyayı değiştirmekte olduğunu belirtti. Söz veriyorum.                                                                                                                                                                                                                                                 

### İİŞİF performatifleri (seçim listesi)

| Performative | Intent |
|---|---|
| `inform` | “我告诉你 P 为真” |
| `request` | “我请求你执行 X” |
| `query-if` | “P 是否为真？” |
| `query-ref` | “X 的值是什么？” |
| `propose` | “我提议我们执行 X” |
| `accept-proposal` | “我接受该 proposal” |
| `reject-proposal` | “我拒绝该 proposal” |
| `agree` | “我同意执行 X” |
| `refuse` | “我拒绝执行 X” |
| `confirm` | “我确认 P 为真” |
| `disconfirm` | “我否认 P” |
| `not-understood` | “你的 message 无法 parse” |
| `cfp` | “针对 X 发出 proposals 征集” |
| `subscribe` | “当 X 变化时通知我” |
| `cancel` | “取消正在进行的 X” |
| `failure` | “我尝试了 X，但失败了” |

完整列表在 `fipa00037.pdf`(FIPA ACL Mesaj Yapısı) 中──重点不是记住它,而是这些内容中的每一个,都应对 LLM 协议 最终会重新添加一个原始──

### 规范的 FIPA-ACL mesajı

```
(inform
  :sender       agent1@platform
  :receiver     agent2@platform
  :content      "((price IBM 83))"
  :language     SL0
  :ontology     finance
  :protocol     fipa-request
  :conversation-id   conv-42
  :reply-with   msg-17
)
```

七个字段承载 protokol zarfı;一个字段(`content`) payload taşıyor.                                                                                                                                                                                                                                                            

### 两个遗产平台

**JADE**(Java Agent DEvelopment framework,19992020s) ‒ en geniş kullanımlı FIPA uyumlu çalışma süresi──Agentler 继承一个基类,交换 ACL বার্তা,在容器内运行,并使用 行为 协调──相互作用-protocol library 附附合同-net、订阅-notify、请求-when 和提案-接受──

**JACK**(Agent Oriented Software,商业) 之上的 BDI üzerinde vurgulamak FIPA mesajları 之上的 BDI (İman-İstelik-İstelik) 推理──更形式化,但采用更少──

两者都在网堆 吞掉多代理使用案 后走向衰落──MCP 和 A2A 2026 yılının containers──

### FIPA neden çıkıyor ?

- **Ontology 开销。**FIPA 要求使用共享 ontology 来 parse `content`■ Ontopolojilerde 达成一致 bir geçmiş yılların standartlaştırma süreci.
- **没人使用的 formal semantics。**SL ((Semantik Dil) sert gerçek koşulları sağladı, ancak çoğu üretim sistemi serbest biçim içerik kullanır, formalistliği göz ardı etmez.
- **Tooling lock-in。**JADE sadece Java'yı destekler; Jack ise ticari ürünlerdir.
- **internet 赢下了 stack。**REST, daha sonra JSON-RPC, daha sonra gRPC, ACL'nin taşıma yerini aldı.

### LLM 复兴是 FIPA-lite

FIPA ile karşılaştırın`request`Bir MCP ile`tools/call`- ...

```
(request                                {
  :sender  agent1                         "jsonrpc": "2.0",
  :receiver tool-server                   "method":  "tools/call",
  :content "(lookup stock IBM)"           "params":  {"name":"lookup_stock",
  :ontology finance                                   "arguments":{"symbol":"IBM"}},
  :conversation-id c42                    "id": 42
)                                        }
```

Aynı zarf, farklı sözcükler. İkisi de: kim, kime, niyet, payload, ilişki id.

Liu et al.'ın 2025 yılındaki araştırması ((A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP, arXiv:2505.02279) açıkça belirtti: MCP karşıtı araç kullanımı konuşma eylemleri, A2A karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı

### Doğrudan açıklama

**FIPA 给了你、而现代 specs 放弃的东西：**

- Formal semantik: kanıtlayabilirsin .`inform`Gönderenin içeriğini inandırmak anlamına geliyor.
- Bir kuralın performansları: Bir tane olması gerektiğini tekrar tartışmak zorunda değilsin.`cancel`- Evet.
- Yıllar boyunca etkileşim-protokola kalıpları: sözleşme-net, abonelik-bilgi, önerme- Kabul ve bilinen doğruluk özellikleri vardır.

**现代 specs 给了你、而 FIPA 没有的东西：**

- Tüm modern araçlar ve uyumlu JSON-devde payloadlar
- LLM'ler   无需手编码的 ontology 即可解释的自然语言内容──
- Web-stack taşımacılığı ((HTTP、SSE、WebSocket)
- Gerçek zamanlı bir MCP`server/discover`A2A Ajan Kartı ile                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

Daha rahat bir amaç semantiği, daha kolay bir gerçekleşme için değişim.

### Transport değerli etkileşim protokolleri

FIPA 15 tane etkileşim protokolü ile birlikte bulunmaktadır. Bunlardan üçü LLM çoklu ajan sistemlerine dahil edilmektedir:

1. **Contract Net Protocol (CNP)。**Müdür 发出 `cfp`(yardım çağrısı); teklif verenler`propose`响应;manager 接受/拒绝──这是规范的任务市场模式(16 .
2. **Subscribe/Notify。**Abone 发送 `subscribe`; Publisher on topic 变化时发送 `inform`Bu 2026 yılındaki her etkinlik otobüsü.
3. **Request-When。**当条件 Y 成立时执行 X──带预条件的延迟行动──2026 yılının analoğu dayanıklı iş akışı motorları arasında ertelenmiş görevlerdir(Fase 16 · 22 Üretim ölçeklemesi)。

Her biri, çağdaş mesaj kuyruklarına, HTTP + seçimlerine veya SSE akışına net şekilde görüntülenebilir.

### Ontopolojiyi bırakmak neyin bir sorunu doğuracak ?

 hiçbir ortak ontoloji, ajanlar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      **semantic drift**İki ajan aynı kelimeyi kullanıyor.`"customer"`) gösterir biraz farklı kavramlar, alıcının ajanı  yanlış yorumlanmış hareket, ve hiçbir schema onaylayıcı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

路线 走完整 ontology 路线 走完整 ontology 路线 走完整 ontology 路线 路线 走完整 ontology 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路 路线 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路

- `content`Yukarıdaki JSON Şema: Wire 层拒绝结构错误――
- Tipik eserler ((A2A): reject error of modality。
- zarf 中的显式表演: İçerik doğal dil olsa bile, aynı zamanda niyet 明确无歧义──

### 2026 Specs 映射到 konuşma-işlev mirası

| Modern spec | FIPA analog | What it keeps | What it drops |
|---|---|---|---|
| MCP `tools/call` | `request` | explicit intent、correlation id | formal semantics、ontology |
| MCP `resources/read` | `query-ref` | explicit intent、correlation id | formal semantics |
| A2A Task lifecycle | contract-net + request-when | async lifecycle、state transitions | formal completeness guarantees |
| A2A streaming events | subscribe/notify | async push | typed-predicate subscription |
| CA-MCP shared context | blackboard（Hayes-Roth 1985） | multi-writer shared memory | logical consistency model |
| NLIP | natural-language content | LLM-native | schema |

Bu tabloyu yukarıdan aşağıya okuyun, model: yapısal ilkelliği korumak, formallığı bırakmak, LLM'leri 掩盖歧义──


```figure
sw-contract-net
```

## Yapın onu.

`code/main.py`实现一个纯真的FIPA-ACL译者──它编码和编码规范的ACL封筒,并展示每种MCP / A2A mesaj şekli 如何归约为同样七个字段──这个演示:

- 将五条 MCP tarzı ve A2A tarzı mesajlar 编码为FIPA-ACL。
- FIPA-ACL 解码回现代等价形式を将します.
- Kullanım`cfp`- Evet.`propose`- Evet.`accept-proposal`- Evet.`reject-proposal`, bir yöneticisi ve üç teklifci arasında bir oyuncak sürümü çalıştırmak için bir sözleşme ağ müzakere edilmesi.

运行:

```
python3 code/main.py
```

输出, her bir modern mesajın 2026 JSON biçimi ve FIPA-ACL biçimi ile gösterilen bir parça, sonra bir kez sözleşme ağ teklifinin geri dönüş yolculuğunu gösterir.

## Kullan

`outputs/skill-fipa-mapper.md`Bu bir beceri, herhangi bir ajan-protokolu spesifikasyonu okuyacak ve FIPA-ACL haritalama üretir. Yeni protokolü kullanmadan önce, onunla yanıt:`inform`- Ne ?

## - Söyle.

FIPA-ACL'i geri getirme. Kontrol listesini geri getir.

- Her mesajın amacı ilkel performans nedir?
- İstem- yanıt ve iptal için kullanılacak bir ilişki kimliği var mı?
- JSON-RPC, düz metin, yapılandırılmış yazılı eser var mı?
- Etkinlik protokolleri birinci sınıf mı yoksa yeni bir sözleşme ağı mı?
- İki ajanın içeriğin anlamı hakkında ayrılığa düştüğünde ne olur?

Yeni protokoller üretime teslim edilmeden önce önce bu beş sorunu kaydet.

## 练习

1. 运行  İşlem`code/main.py` Görevi kodlamaları gözlemlemek  FIPA performanslı karşılamaları tanımlamak `tools/call`- Evet.`resources/read`A2A görev oluşturma.
2. Bir tane kullan .`cancel`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `cancel`- Tekrar denemeyi çözmek için ne tür bir başarısızlık var?
3. 阅读 FIPA ACL Mesaj Yapısı(http://www.fipa.org/specs/fipa00037/）第4.14.3 节── seçin bir本课未覆盖的性能,并描述其现代 JSON-RPC analog──
4. 阅读 Liu et al., arXiv:2505.02279──分别针对 MCP、A2A、ACP、ANP,列出它们保留和放弃的FIPA performative families──
5. Kendi sisteminde.`request`performative `content`字段设计一个最小的JSON-Schema──与纯自然语言相比, bu schema 给你什么,又带来什么成本?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Speech act | “一种会做事的 utterance” | Austin/Searle：把 utterances 视为 actions。ACL 的理论源头。 |
| FIPA | “那个老 XML 东西” | IEEE Foundation for Intelligent Physical Agents。2000 年标准化了 ACL。 |
| ACL | “Agent Communication Language” | FIPA 的 envelope format：performative + content + metadata。 |
| Performative | “那个动词” | 一条 message 的 intent class：`inform`、`request`、`propose`、`cfp` 等。 |
| KQML | “FIPA 的前身” | Knowledge Query and Manipulation Language（1993）。更简单，范围更窄。 |
| Ontology | “共享词汇表” | 对 content language 所谈论概念的 formal definition。 |
| SL0 / SL1 | “FIPA content languages” | Semantic Language levels 0 and 1，即 formal content language family。 |
| Contract Net | “Task market” | Manager 发出 cfp；bidders propose；manager accepts。规范的 interaction protocol。 |
| Interaction protocol | “Messages 的模式” | 一组具有已知 correctness 的 performatives 序列：request-when、subscribe-notify 等。 |

## 延伸阅读
- [Liu et al. — A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP](https://arxiv.org/html/2505.02279v1)                                                                                                                                                                                                                                                              
- [FIPA ACL Message Structure Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/)2000 yıl onaylanmış zarf biçimi
- [FIPA Communicative Act Library Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) 完整的表演目录
- [MCP specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) `request`- Ne ?`query-ref`Şimdiki durumsuz araç kullanımı等价格形式
- [A2A specification](https://a2a-protocol.org/latest/specification/) sözleşme-net 和 abone-bilgileyen 现代代理-peer等价格形式
