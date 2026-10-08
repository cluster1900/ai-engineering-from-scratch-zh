# 结构化输出  JSON Schema, Pydantic, Zod, kısıtlı dekode

>  İyi gereksinimli model JSON'u geri gönderir Hatta ön kenar modellerde bile% 5 ila 15%'lik zaman başarısız olacaktır Structured output through Constrained Decoding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  `responseSchema`、Pydantik AI'nin `output_type`, ve Zod'un `.parse`Bu ders, şema onaylayıcıyı ve sıkı mod sözleşmesini oluşturacak ve öğrenciler onları her üretim aşamasında kullanacaklar.

**类型：**Yapım
**语言：**Python(stdlib,JSON Schema 2020-12 子集)
**前置要求：**13 · 02 aşama
**时间：**75 dakika kadar .

## Öğrenme hedefi

- kullanın 正确的约束(enum、min/max、required、pattern)
- 解释为什么严格模式和 限制式解码 提供的保证与 生成后再验证──
- 区分三种失败模式:parse error、schema violation、model reddesi、
- 交付一条带 tipi tamir 和 tipi redded handling 

## 问题

Bir okuyucu satın alma siparişleri postacı bir ajanı özgür metin çevirmek zorunda kalır`{customer, line_items, total_usd}`Üç farklı yöntem var.

**方法一：提示模型输出 JSON。** JSON 回复,字段包括客户、line_items、total_usd。前沿模型上有85%~95%的时间可用──会以六种方式失败:缺少大括号、尾随逗号、类型错误、幻觉字段、在代币 限制处截断、泄漏类似

**方法二：生成后验证。**Özgürlük üretim 解析                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

**方法三：Constrained Decoding。**提供商在解码时强制执行方案──无效Token 会从采样分布中被掩盖掉──输出保证可解析,并且保证通过验证──失败会收到一种模式:拒绝(模型判断输入不符合方案)──

2026 yılına kadar, her öncü sağlayıcı bir çeşit yöntem sunar.

- **OpenAI。** `response_format: {type: "json_schema", strict: true}`Eğer model reddedilirse, cevaplar içerir.`refusal`- Evet.
- **Anthropic。**- Evet .`tool_use`输入执行 şema uygulanması;`stop_reason: "refusal"`Var değil ama araç çağrı yok.`end_turn`İşte sinyal.
- **Gemini。**Lütfen sınıflandırın.`responseSchema`2026 Year Gemini  belirli tipler için Token 级 dilbilgisinin kısıtlamaları
- **Pydantic AI。** `output_type=InvoiceModel`Çıkış tipi`InvoiceModel`Yapılandırma`RunResult`- Evet.
- **Zod (TypeScript)。**运行时 parser, Zod schema 验证提供商输出; OpenAI ile birlikte `beta.chat.completions.parse`配合使用。

共同点是: bir kez açıklama şema, sonunda zorunlu bir şekilde gerçekleştirilmektedir.

## 概念

### JSON Şema 2020-12  通用语

Her satıcı JSON Şema 2020-12'yi kabul ediyor.

- `type`- ...`object`- Evet.`array`- Evet.`string`- Evet.`number`- Evet.`integer`- Evet.`boolean`- Evet.`null`Bir tane.
- `properties`:字段名到 alt planın映射──
- `required`: must appear of字段名列表──
- `enum`: allowed value of封闭集合──
- `minimum`- Ne ?`maximum`(数字),`minLength`- Ne ?`maxLength`- Ne ?`pattern`- Evet.
- `items`:: her bir elementin alt planına uygulanır.
- `additionalProperties`- ...`false`禁止额外字段 ():                                                                                                                                                                                                                                                           

OpenAI'nin sıkı modunda üç şart daha belirtildi: Her mülk bir araya gelmelidir.`required`Ortada, tüm yerler olmalı.`additionalProperties: false`, ve çözülmemiş olabilir .`$ref` Eğer bu taleplerin ihlali olursa, API 400 

### Pydantic,Python 绑定

Pydantic v2         `model_json_schema()`Dataclass 形状のモデルから 生 生成 JSON Schema。Pydantic AI bunun üzerine bir kapak yaptı, böylece şöyle yazabilirsiniz:

```python
class Invoice(BaseModel):
    customer: str
    line_items: list[LineItem]
    total_usd: Decimal
```

Agent Framework 会在边界处把 schema 转换到 OpenAI 严格模式、Anthropic `input_schema`Ya da İkizler.`responseSchema`◊ modellerin türleşmesi`Invoice`实例返回──验证错误会抛出 `ValidationError`, ≠ ≠ ≠ ≠ ≠ ≠ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞

### Zod,TypeScript 绑定

Zod(`z.object({customer: z.string(), ...})`)                                                                                                                                                                                                                                                               `zodResponseFormat(Invoice)`, API'nin JSON Schema payload olarak dönüştürülür.

### İtirazlar

Sıkı mod 不能强迫模型回答──如果输入无法适应 schema(邮件是一首诗,不是发票),模型会发发含原因的`refusal`字段──Kodu başarısızlık olarak değil, ilk sonuç olarak ele alınmalıdır. 字段──Kodu da güvenlik sinyali olarak ele alınmalıdır.

### 开放环境中的 Sıkısal Şifreleme

开放权重实现三种技术的使用.

1. **Grammar-based decoding**(`outlines`- Evet.`guidance`- Evet.`lm-format-enforcer`): Şema 构建决定性有限自动机;在每一步,mask 掉会违反FSM'in Token logits──
2. **带 JSON parser 的 logit masking**:运行一个与模型同步的流通JSON解析器;在每一步计算有效-下一个代码集合──
3. **带 verifier 的 speculative decoding**:廉价草案模型 提议 Token,verifier 强制执行方案。

Ticaret sağlayıcıları, bir sonraki seçimi yapar. 2026 yılının en son seviyesi: kısa yapısal üretim, normal üretimden daha hızlı, uzun yapısal üretim hızı neredeyse aynıdır.

### Üç çeşit başarısızlık modeli

1. **Parse error。**输出 is not valid JSON. ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒    ⇒ ⇒    ⇒     ⇒       ⇒                ⇒                                                                                                                                                                                                                                                                
2. **Schema violation。**Çıkış çözülebilir, ama şema tersine.
3. **Refusal。**模型拒绝──必须作为类化结果处理──

### 重试策略

Eğer sıkı modda değilseniz, antropik araç kullanımı, sıkı olmayan OpenAI, eski Gemini'den daha fazla kullanmayın.

```
generate -> parse -> validate -> if fail, inject error and retry, max 3x
```

Bir tekrar deneme genellikle yeterli olacaktır. Üç tekrar deneme zayıf bir modelin ortaya çıkmasını sağlayacaktır.

### Küçük model destek

Sınırlı Çözümleme  küçük model için uygundur  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model  Structured model   Structured model  Structured model  Structured model   Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured  Structured 


```figure
constrained-decoding
```

## Kullan

`code/main.py`提供一个用 stdlib 编写的最小 JSON Schema 2020-12 validator(types、required、enum、min/max、pattern、items、additionalProperties) ⋅ it packages a `Invoice`Şema, MLL'nin sahte çıkışını validator üzerinden yaptırmak, gösterim analiz hatası, şema ihlali ve reddedilme yolları.

需要关注的点:

- Validatör 返回一个类型化的 `[ValidationError]`Bu da tekrar deneme süresi için göstermek istediğin bir mesaj.
- reddediler 分支不会重试──它会记录日志并返回类型化 reddediler──Fase 14 · 09  使用拒绝 作为安全信号──
- `additionalProperties: false`检查会在对抗性测试输入上触发, neden sıkı modunu gösterir 检查会在门外的幻觉字段在门外的

## - Söyle.

本课产 出 `outputs/skill-structured-output-designer.md` Özgür metin çıkarma hedefi belirlemiş, faturayı, destek biletlerini, özetlemeleri vb.) bu beceri, 2020-12'de sıkı modaya uyumlu bir JSON Schema, ayrıca bir ile birlikte görüntülenen Pydantic modelini, tıklanmış reddedimi ve yeniden çalıştırma stubunu oluşturacaktır.

## 练习

1. 运行  İşlem`code/main.py`❖ Ekle dördüncü test üyelik,其 `total_usd`│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │`minimum`Bu yol onu reddetti.

2. 扩展验证器,使其支持带歧视的 `oneOf`❖ Genel durum:`line_item`Ya ürün, ya hizmet,`kind`打标签──Strict mode Burada bazı küçük kurallar vardır; lütfen OpenAI'nin yapılandırılmış çıkış rehberini görün。

3. Bir faturası şemaı bir Pydantic BaseModel olarak yazın,并将`model_json_schema()`输出与你手写的图对比──找出 Pydantic 默认设置但手写版本遗漏的一个字段──

4. 测量拒绝率 ∼构造十个不应可提取的输入(一段歌词、一个数学证明、一个空白邮件),并通过带严格模式的真实提供商运行它们──统计拒绝与幻觉输出──这是你进行拒绝意识的重复试验的基本真理──

5. OpenAI'nin yapılandırılmış çıkışları kılavuzunu baştan sona okuyun. Sıkı modda açıkça yasaklanmış olduğunu bul, ancak normal JSON Şema'nın bir yapılandırmaya izin verdiğini bul. Sonra bu yapılandırmayı kısıtlayan bir şema kullanmakla gereksiz bir şekilde yeniden yapılandırılıp sıkı uyumlu hale getirildi.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| JSON Schema 2020-12 | “schema spec” | 每个现代提供商都支持的 IETF-draft schema dialect |
| Strict mode | “保证符合 schema” | OpenAI 通过 Constrained Decoding 强制执行 schema 的标志 |
| Constrained decoding | “Logit masking” | decode 时的强制执行，会 mask 无效的下一个 Token |
| Refusal | “模型拒绝” | 输入无法适配 schema 时的类型化结果 |
| Parse error | “无效 JSON” | 输出无法解析为 JSON；在 strict 下不可能发生 |
| Schema violation | “形状错误” | 已解析但违反 type / required / enum / range |
| `additionalProperties: false` | “不允许额外字段” | 禁止未知字段；OpenAI strict 中必需 |
| Pydantic BaseModel | “类型化输出” | 会发出并验证 JSON Schema 的 Python class |
| Zod schema | “TypeScript output type” | 用于提供商输出验证的 TS runtime schema |
| Grammar enforcement | “开放权重 constrained decode” | 基于 FSM 的 logit masking，如 outlines / guidance 中所用 |

## 延伸阅读

- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) sıkı mod 、 reddedilme ve şema gereksinimleri
- [OpenAI — Introducing structured outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) 2024 yıl 8 月发布文章,解释 dekode garantisi
- [Pydantic AI — Output](https://ai.pydantic.dev/output/) İbadetleri her tedarikçinin türlendirilmiş output_type bağlamalarına göre düzenlenir
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) Kanonik özellik
- [Microsoft — Structured outputs in Azure OpenAI](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs) 企业部署说明和严格模式注意事项 企业部署说明和严格模式注意事项 企业部署说明和严格模式注意事项 企业部署说明和严格模式注意事项 企业部署说明和严格模式注意事项
