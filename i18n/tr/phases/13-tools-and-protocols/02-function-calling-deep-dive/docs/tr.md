# Fonksiyon Çağrı derin入解析  OpenAI, Anthropic, Gemini

> Bu üç sınır sağlayıcı 2024 yılında aynı araç çağrı döngüsüne ulaştı, sonra diğer tüm yerlerde dağıtıldı.`tools`和 `tool_calls`❖ Antropik kullanım `tool_use`和 `tool_result`bloklar。Gemini 使用 `functionDeclarations`Ünlü bir tanımlama ilişkisi. Bu ders üç kişinin bir diğerine aktarıldığında bozulmaz.

**Type:** Build
**Languages:** Python (stdlib, schema translators)
**Prerequisites:** Phase 13 · 01（the tool interface）
**Time:** ~75 分钟

## Öğrenme hedefi
- Açık AI、Antropik 和 Gemini fonksiyonları çağıran payloadlar  arasındaki üç sınıf şekil 差异
- Bir araç açıklaması 翻译到三个提供商格式,并预测 严格模式限制 会在哪里不同──
- Her sağlayıcıda kullanılır`tool_choice`Yasaklık, yasak veya otomatik olarak araç seçimi çağrıları.
-  Her sağlayıcı'nın sert sınırlarını anlamak,  araç sayımı,  schema derinliği,  argüman uzunluğu,                                                                                                                                                                                                                                                                                                                                     

## 问题
İşlev çağrısı talebinin şekli, sağlayıcı ve farklı olarak, aşağıda 2026 üretim yığınlarının arasında üç özel örneği bulunmaktadır:

**OpenAI Chat Completions / Responses API.**Sen içeri girdi .`tools: [{type: "function", function: {name, description, parameters, strict}}]`◊model'in yanıtı 包含 `choices[0].message.tool_calls: [{id, type: "function", function: {name, arguments}}]`, içinden `arguments`Evet, JSON dizilisini çözmek zorundasın.`strict: true`) kısıtlı dekodlama yoluyla 强制方案 uyumu¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

**Anthropic Messages API.**Sen içeri girdi .`tools: [{name, description, input_schema}]`◊ cevap`content: [{type: "text"}, {type: "tool_use", id, name, input}]`Geri dön.`input`已被解析(是对象,不是字符串)──你再回复一个新的 `user`Mesaj, içermektedir.`{type: "tool_result", tool_use_id, content}`Blok.

**Google Gemini API.**Sen içeri girdi .`tools: [{functionDeclarations: [{name, description, parameters}]}]`(Sanağlı)`functionDeclarations`Aşağı) ⋅ cevap`candidates[0].content.parts: [{functionCall: {name, args, id}}]`- Gitti, onlardan biri.`id`Bu, benzersiz bir şekilde paralel çağrı ilişkisi için kullanılır.`{functionResponse: {name, id, response}}`- Evet.

Aynı döngü. Farklı alan isimleri. Farklı yuvalamalar. Farklı ipler ve nesneler. Farklı ilişki mekanizmaları.

Bu ders bir çevirmen oluşturur, üç biçimi bir kanonik araç açıklaması haline getirir ve kenarında yönlendirme yapar.

## 概念
### Ortak yapı

Her tedarikçi beş şey istiyor:

1. **Tool list.**Her bir araçın adı, açıklaması ve giriş şeması.
2. **Tool choice.** belirli araçları zorla kullanmak  yasaklama araçları, veya model karar vermek 
3. **Call emission.**命名 aracı 和 argümanların yapılandırılmış çıkışı¬¬
4. **Call id.**关联到正确的电话将响应 关联到正确的电话将响应 关联到正确的电话将响应将关联到正确的电话将响应将关联到正确的电话将响应将关联到正确的电话将关联到正确的电话将关联的电话将关联的电话将关联的电话将关联到正确的电话将关联的电话将关联到正确的电话将关联到正确的电话将关联到正确的电话将关联到正确的电话将关联的电话将关联至关重要
5. **Result injection.**Bir mesaj veya blok, sonuçta 绑定回调――

### 个个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个

| Aspect | OpenAI | Anthropic | Gemini |
|--------|--------|-----------|--------|
| Declaration envelope | `{type: "function", function: {...}}` | `{name, description, input_schema}` | `{functionDeclarations: [{...}]}` |
| Schema field | `parameters` | `input_schema` | `parameters` |
| Response container | assistant message 上的 `tool_calls[]` | type 为 `tool_use` 的 `content[]` | type 为 `functionCall` 的 `parts[]` |
| Arguments type | stringified JSON | parsed object | parsed object |
| Id format | `call_...`（OpenAI 生成） | `toolu_...`（Anthropic） | UUID（Gemini 3+） |
| Result block | role `tool`, `tool_call_id` | 带 `tool_result`, `tool_use_id` 的 `user` | 带匹配 `id` 的 `functionResponse` |
| Force-a-tool | `tool_choice: {type: "function", function: {name}}` | `tool_choice: {type: "tool", name}` | `tool_config: {function_calling_config: {mode: "ANY"}}` |
| Forbid tools | `tool_choice: "none"` | `tool_choice: {type: "none"}` | `mode: "NONE"` |
| Strict schema | `strict: true` | schema-is-schema（始终 enforce） | request level 的 `responseSchema` |

### Gerçekte karşılaştığın kısıtlamalar

- **OpenAI.**Her istek en fazla 128 个工具──Schema derinliği 5──Argument İpi <= 8192 bytes──Strict mode 要求没有 `$ref`, üst üste geçişleri yok .`oneOf`- Ne ?`anyOf`- Ne ?`allOf`Her mülk bir yerde .`required`İçeride.
- **Anthropic.**Her talep en fazla 64 araçtır. Şema derinliği aslında sınır yoktur, ama pratik sınır 10tır.
- **Gemini.**Her istek en fazla 64 个函数──Schema türleri OpenAPI 3.0 alt kümesi olur.

### `tool_choice`davranış

Üç farklı model var, sadece farklı isimler var.

- **Auto.**Model 选择 tool 或 text──默认值──
- **Required / Any.**Model en az bir araç kullanmalıdır.
- **None.**Model, araçları kullanmıyor.

Ayrıca, her sağlayıcıda özel bir model vardır:

- **OpenAI.**按名 强制使用特定工具──
- **Anthropic.**按名 强制使用特定工具;`disable_parallel_tool_use`bayrak 区分 tek vs çoklı
- **Gemini.** `mode: "VALIDATED"`Bu, her yanıtın nasıl bir model niyetinden bağımsız olarak bir şema onaylayıcısı üzerinden geçmesine izin verir.

### Dönüş çağrılar

OpenAI'nin `parallel_tool_calls: true`(默认) bir asistan mesajı içinde birden fazla arama gönderecek.`tool_call_id`Bir giriş için: Antropik geçmiş tek çağrıdır.`disable_parallel_tool_use: false`(截至Claude 3.5 的默认值) multi──Gemini 2 允许平行通话,但没有给出稳定的ID;Gemini 3 增加 UUID,因此, sıradan cevaplar干净地相关──

### Akış

三者都支持 akışlı araç çağrıları。kablo biçimi 不同:

- **OpenAI.** `tool_calls[i].function.arguments`Delta parçaları, toplanıp toplanıp biter.`finish_reason: "tool_calls"`- Evet.
- **Anthropic.**Blok başlangıç / blok delta / blok durma olayları。`input_json_delta`parçalar 携带部分 arguments──
- **Gemini.** `streamFunctionCallArguments`(Gemini 3 新增)发出带 `functionCallId`Bu yüzden birçok paralel çağrı yapılabilir.

Eğitim süreci 13 · 03 会深入讲 paralel + akış yeniden birleştirme。本课聚焦宣言 和单调形──

### Hatalar ve onarım

Geçersiz-argument hatalarının göstergesi de farklıdır.

- **OpenAI (non-strict).**Model 返回 `arguments: "{bad json}"`, JSON parse  başarısız, sen bir hata mesajı girdi ve yeniden aramak
- **OpenAI (strict).**Validasyon sırasında gerçekleşir; geçersiz JSON görünmesi mümkün değil, ancak ortaya çıkabilir `refusal`- Evet.
- **Anthropic.** `input`Belki beklenmedik alanlar içerir; şema tavsiyedir.
- **Gemini.**OpenAPI 3.0 garipliği: nesne alanları 上的 `enum`Huzursuzluktan uzak durursun. Kendini doğrula.

### Tercüman örneği

Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çözüm: Çizlem: Çizlem: Çizlem: Çizlem: Çizlem: Çizlem: Çizlem: Çizlem: Çizlem: Çizlem: Çizlem: Çizlem: Çizlem: Çiz

```python
Tool(
    name="get_weather",
    description="Use when ...",
    input_schema={"type": "object", "properties": {...}, "required": [...]},
    strict=True,
)
```

Üç küçük işlev üç çeşit sunucu şekillerine çevirir.`code/main.py`Orta harness bunu yapıyor, sonra da sahte bir araç çağırıyor her sağlayıcının yanıt şekli üzerinden yapın dönüş yolculuğu.

Üretim ekibi bu tercümeyi içeri alacak .`AbstractToolset`(Pydantik AI)`UniversalToolNode`(LangGraph) veya `BaseTool`(LlamaIndex) ――Fase 13 · 17 会交付一个门户,在三者任意一个前面暴露OpenAI şeklinde API──


```figure
function-call-args
```

## Kullan
`code/main.py`定義一个法典的 `Tool`Dataclass, ve üç çevirmen, OpenAI、Anthropic 和 Gemini açıklaması JSON olarak göndermek için kullanılır. Sonra her biçimdeki el yapımı sunucu yanıtını 解析为同一个可нониcal call object,展示语义在表层之下是相同的.

需要观察的点:

- Üç açıklama bloğu sadece zarf içinde ve alan isimleri üzerinde farklı.
- Üç yanıt blokunun farkı çağrı konumında yer almaktadır .`tool_calls`- Evet.`content[]`blok`parts[]`Giriş)
- Bir tane .`canonical_call()`işlevi tüm üç tepki şekillerinden 中提取 `{id, name, args}`- Evet.

## - Söyle.
本课产 出 `outputs/skill-provider-portability-audit.md` Bir sunucuya yönelik bir fonksiyon çağrısı entegrasyonu belirlenmesi, bu beceri taşınabilirlik denetimini oluşturacaktır: hangi sunucu sınırlarına bağlıdır  hangi alanların yeniden adlandırılması ve diğer sunucuya aktarılmasında hangi kırıklıklar oluşur 

## 练习
1. 运行  İşlem`code/main.py`, Verification üç sunucu açıklaması JSONs hepsi bir alt katman için sıralanmış .`Tool`Obyektı── Modify kanonik araç, Add a enum parametre,并确认只有双子座译者 需要处理 OpenAPI quirk──

2. Her sağlayıcı için bir ekle`ListToolsResponse`Parser, modelden `list_tools`Ya da keşif çağrısı 后返回的内容中提取工具列表──OpenAI 原生没有这个项目;记录这个不对称性──

3.  gerçekleştirmek `tool_choice`dönüşüm:将 kanonik `ToolChoice(mode="force", tool_name="x")`映射到三种供应商形――然后映射 `mode="any"`和 `mode="none"`◊ Check本课的差表──

4. 选择三个供应商中一个,从头到尾阅读它的函数调用指南――找出它的方案规范中一个其他两个不支持的领域――候选项:OpenAI `strict`、Antropik `disable_parallel_tool_use`Gemini`function_calling_config.allowed_function_names`- Evet.

5. 写一个测试向量:一个论点 违反声明的方案的工具调用――将它运行过每个供应商的验证器(Lesson 01 中的 stdlib验证器可以作为代理),并记录触发了哪些错误──记录你在生产中会为了严格性使用哪个供应商──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Function calling | "Tool use" | 用于 structured tool-call emission 的 provider-level API |
| Tool declaration | "Tool spec" | Name + description + JSON Schema input payload |
| `tool_choice` | "Force / forbid" | Auto / required / none / specific-name modes |
| Strict mode | "Schema enforcement" | OpenAI flag，用于约束 decoding 以匹配 schema |
| `tool_use` block | "Anthropic's call shape" | 带 id、name、input 的 inline content block |
| `functionCall` part | "Gemini's call shape" | 包含 name、args 和 id 的 `parts[]` entry |
| Arguments-as-string | "Stringified JSON" | OpenAI 将 args 作为 JSON string 返回，而不是 object |
| Parallel tool calls | "Fan-out in one turn" | 一个 assistant message 中的多个 tool calls |
| Refusal | "Model declines" | strict-mode-only 的 refusal block，而不是 call |
| OpenAPI 3.0 subset | "Gemini schema quirk" | Gemini 使用一种类似 JSON-Schema 的 dialect，存在细微差异 |

## 延伸阅读
- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) 包含严格模式和并行调的经典参考
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) `tool_use`和 `tool_result`blok semantikası
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) paralel çağrılar, benzersiz kimlikler, OpenAPI alt kümesi
- [Vertex AI — Function calling reference](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling)Gemini'nin işletme sınıfı yüzeyi
- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) sıkı mod şema 强制执行细节
