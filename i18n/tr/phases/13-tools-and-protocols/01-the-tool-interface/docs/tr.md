# Araç Aracı  Neden Ajanlar  yapılandırılmış I/O gerektirir

> 语言模型 will generate tokens──程序 will execute an operation── ikisi arasındaki fark araç arayüzüdür: bir sözleşme, modellerin bir an an an an an an an an an an an an an an an an operation request etmesini sağlar, host'ın bunu gerçekleştirmesini sağlar.`tools/call`A2A'nın görev parçaları aynı dört adımlı döngünün farklı kodlamalarıdır. Bu ders bu döngüye isim vererek, bunun çalışması için gerekli en az mekanizmayı gösterir.

**Type:** Learn
**Languages:** Python (stdlib, no LLM)
**Prerequisites:** Phase 11 (LLM completion APIs)
**Time:** ~45 minutes

## Öğrenme hedefi
- Neden sadece metin üreten bir LLM gerçek dünyaya kendiliğinden hareket edemeyeceğini açıklayın.
- 画出四步工具-call loop (bkz: Çözüm → karar → yürütme → gözlemle)
- Bir araç tanımını 写成三部分:name、JSON Schema giriş, yanı sıra kesinlik bir işleyicisi işlevi。
- 区分纯工具和副作用工具,并说明为什么这种分分对安全很重要.

## 问题
LLM 输出 is the probability distribution of a token── This is its entire output surface── Eğer bir sohbet modelini sorsan Bengaluru 现在天气如何, mantıklı görünen bir cümle yazabilir, ancak atmosfer API'ye bağlanamaz.

Bu farkı gidermek, araç arayüzünün amacıdır. Ev sahibi programı, ajanın çalıştırma süresi, Claude Desktop, ChatGPT, Cursor veya bir kendiliğinden yazılım, bir dizi ayarlanabilir araçlar üretir.

Bu sözleşmenin ilk sürümü 2023 Haziran ayında OpenAI'nin  fonksiyonları parametre biçiminde yayınlandı.`tool_use`Bloks--- Gemini birkaç ay sonra katıldı`functionDeclarations`▽ şimdi her sağlayıcı aynı şekli ortaya çıkar: JSON-Schema 标注类型 araç listesini gir, JSON-payload araç çağrısı çıkar.

Dört adımlı döngü, bu sistemlerin altındaki değişmezliktir.

## 概念
### Birinci adım: tanımlayın

Host kullanıyor üç bölüm açıklama her araç için.

- **Name.**Bir sabit  makine okuyabilir bir işaretçi  kullanın`get_weather`Bu hava olayı değil.
- **Description.**Bir bölüm doğal dil basitleştirmek. Kullanıcılar belirli bir şehrin mevcut hava durumu hakkında sorular sorarken kullanmak. Tarih verileri kullanmak için kullanılmasın.
- **Input schema.**Bir birincil açıklama araç argümanlarının JSON Schema nesneyi(Yöntem 2020-12)。

Modeller bu listeni alacak. Modern sağlayıcılar bu açıklamaları sistemde bir anında sıralanıcak şekilde sağlayıcı-özel şablon kullanırlar.

### İkinci adım: karar ver

给定用户消息和可用工具,模型会选择三种行为之一──

1. **直接用文本回答**❖ Kullanıcı çağrısı yapmayın.
2. **调用一个或多个 tools。**输出 yapılandırılmış çağrı nesneleri──在 `parallel_tool_calls: true`Aşağı(OpenAI 和 Gemini 默认启用,Anthropic 需要选择), model bir dönüşte birden fazla arama çıkarabilir.
3. **拒绝。**Sıkı modda yapılandırılmış çıkışlar bir tipleştirilmiş oluşturabilir.`refusal`- Blok, çağrı değil.

Bir araç çağrı yükü üç sabit bölüm var: çağrı `id`、 alet `name`, ve JSON `arguments`nesne ▽ id'in varlığı, sunucu'nun belirli bir çağrı ile sonraki sonuçları birleştirebilmesi için önemlidir.

### Üçüncü adım: Yürüt

Host  Alışkanlık çağrısı, açıklamalara göre schema 验证 arguments,并运行执行器。 inefficient arguments meaning model halüsinated 了某段或使用错类型这是弱模型上非常常见的失败模式。 üretim ortamındaki sunucular, inefficient arguments karşısında genellikle üç şeyden biri yapar:快速失败并将错误暴露给模型; kısıtlı parser 修复 JSON;或在提示中包含验证错误 后重试模型。

İcracı aslında sadece sıradan kodlardır. Python、TypeScript、shell komutu、database sorusu。 genellikle bir dizilerdir, ancak herhangi bir JSON değeri veya yapılandırılmış içerik bloğu olabilir. MCP'de metin、 görüntü veya kaynak referansı olabilir.

### Dördüncü adım: gözlem

Ev sahibi bir araç sonucu ekleyecek sohbetin ortasında`id``tool`rol mesajı),并调用模型──模型现在在背景中拥有工具输出,可以生成最终答案,或请求更多通话──这个过程将持续到模型停止输出通话,或主机达到代次数的安全上限──

### Güven bölünmüştü .

İki tür araç var güvenlik için çok önemli.

- **Pure.**Sadece oku, kesinlik, yan etkileri yok.`get_weather`- Evet.`search_docs`- Evet.`get_current_time`️ Güvenli bir şekilde spekülasyon yapılabilir 调用️
- **Consequential.**Devlet, para, kullanıcı verileri değişecek.`send_email`- Evet.`delete_file`- Evet.`execute_trade`Kapıyı eklemek zorundayım.

Meta 2026 yıl kullanılır ajan güvenlik Rule of Two  ifade, bir dönüş, en fazla yalnızca aynı zamanda aşağıdaki üçlerden iki şeyi içerir: güvenilmeyen giriş, hassas veriler, sonuç eylemleri.

### Çubuk yaşadığı yer

| Context | Who describes | Who decides | Who executes |
|---------|---------------|-------------|--------------|
| Single-turn function calling (OpenAI/Anthropic/Gemini) | App developer | LLM | App developer |
| MCP | MCP server | LLM via MCP client | MCP server |
| A2A | Agent Card publisher | Calling agent | Called agent |
| Web browser (function-calling agent) | Browser extension / WebMCP | LLM | Browser runtime |

Her yerde, her şey aynıdır.

### Neden doğrudan bir model olarak JSON çıkartmıyor?

让模型使用 JSON 回复, ortaya çıkan modelleri çağıran bir fonksiyondur. 让模型使用 JSON 回复, sınır modelleri üzerinde %5 ile %15 arasında bir zaman kaybı vardır, daha küçük modelleri üzerinde başarısızlık oranı daha yüksektir. 失败模式包括缺少大括号、尾随号、幻觉字段 和错误类型──

Doğal fonksiyon arama daha iyi, neden üç noktayı vardır. Birinci olarak, sağlayıcı, model için tam bir arama şeklini kullanacak. Sonundan sona  eğitimi, bu nedenle sıkı mod aşağıdaki geçerli JSON oranı %98'e kadar %99'a kadar yükseltilecek.`tool_use`Gemini'nin`responseSchema`) zorunlu şema uyumluluğu---输出保证能够通过验证---

13 · 02 会并排讲解三供应商API──13 · 04 会深入结构化输出──

### Çeviri kesicileri

Model çıkış çağrılarını durdurduğunda veya host maksimum dönüş sayısına ulaştığında, döngü sona erer. Üretim ortamı hostları genellikle 5 ila 20 dönüş arasında ayarlanır. Bu aralığı aşan, neredeyse kesinlikle modelden çıkışsız döngüye girmiş olursunuz.

Diğer seçenek: sınırsız döngüler. Her altı ayda bir ajanla görüşürüz. Bir gece içinde 400 dolarlık API aramalar yapılır.

Fase 14 · 12 会深入讲解 错误恢复和自我治愈;Fase 17 会覆盖生产率限制──

### 13. aşama.

- Ders 02 ile 05 arasında, sağlayıcı düzeyinde alet-arıza çağrısı yüzeyidir.
- Dersler 06-14 Bu döngü MCP olarak genel hale getirilecek.
- Dersler 15-18 会防护 Bu döngü, düşman sunucuları, düşman kullanıcıları ve kimliklerini doğrulanmamış uzaktan yazılım yüzeylerini önlemek.
- Dersler 19-22 Bu model, ajan-a-agent işbirliği, gözlemlenebilirlik, yönlendirme ve paketleme gibi alanlara yayılacak.
- Ders 23 会交付一个使用每个原始的完整的生态系统――

Geride kalan her ders bu dört adımlı döngünün başlangıcıdır. Lütfen onu kalıcı olarak unutmayın.


```figure
tp-tool-loop
```

## Kullan
`code/main.py`Hükümet tarafından yapılan bir kararın tamamlanması için, bir kullanıcı mesajı ile bir model eşleştirmek için yapılan bir yanlış decider  fonksiyonu kullanılır.

需要关注的内容:

- Her bir araç için üç bölüm vardır: isim, açıklama, şema ve uygulayıcı referansı.
- Validator en az bir JSON Schema alt kümesi ((types、required、enum、min/max), sadece stdlib kullanılarak 编写。Phase 13 · 04 会提供更完整的版本──
- Çevre tekrar sayısını sınırlayacak.

## - Söyle.
本课会产 出 `outputs/skill-tool-interface-reviewer.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                  

## 练习
1. - Evet .`code/main.py`添加第四个工具,名为 `get_stock_price(ticker)`将其描述 写成:当用户按 ticker 询问当前股票价格时使用──不要用于历史价格或市场摘要── 运行利用,并确认假决策者 会将提克的查询 路由到这个新工具──

2. 破坏 schema validator──传入一个 `arguments`nesne 缺少 مطلوبہ فیلڈ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

3. İçindeki her aletin kullanımı, saf veya sonuçlı olarak sınıflandırılır.`consequential: true`bayrak,并修改循环,使其在选择后果工具时打印一行  would confirm with the user──这是每个生产主都需要的确认门 形状──

4. Kağıt üzerinde dört adımlı bir döngü çizin ve yukarıdaki sağlayıcı sütun tablosunu kullanın. En sevdiğiniz müşteriyi doldurun.

5. OpenAI'nin fonksiyon çağrı kılavuzunu baştan sona okuyun. İsteğe yer alan bir bölüm bulun, ancak bu metinde sunulan dört adımlı döngüden bir bölüm bulun.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Tool | “模型可以调用的东西” | name + JSON-Schema-typed input + executor function 组成的三元组 |
| Function calling | “Native tool use” | Provider-level API 支持，用于输出结构化 tool calls，而不是 prose |
| Tool call | “模型发出的行动请求” | 模型输出的一个 JSON payload，包含 `id`、`name`、`arguments` |
| Tool result | “tool 返回的内容” | executor 的输出，被包装在带有匹配 id 的 `tool` role message 中 |
| Parallel tool calls | “一次多个 calls” | 一个 model turn 中的多个 call objects，彼此独立，并可通过 id 排序 |
| Strict mode | “Guaranteed JSON” | Constrained decoding，强制模型输出通过已声明 schema 的验证 |
| Pure tool | “Read-only tool” | 无 side effects；可以安全地重新运行 |
| Consequential tool | “Action tool” | 会改变 external state；需要 gate、audit 或用户确认 |
| Four-step loop | “The tool-call cycle” | describe → decide → execute → observe |
| Host | “Agent runtime” | 持有 tool registry、调用模型并运行 executor 的程序 |

## 延伸阅读
- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) OpenAI tarzı araç açıklamaları 和 çağrı şekilleri kanonik referans
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)Claude'ın `tool_use`- Ne ?`tool_result`blok biçimi
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) Gemini 中的 `functionDeclarations`和 paralel çağrı semantikası
- [Model Context Protocol — Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) Şimdiki durumsuz  Genel olarak kullanılan araçlar ve bağlantılar
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) Her modern araç API şehirlerde kullanılan schema dili
