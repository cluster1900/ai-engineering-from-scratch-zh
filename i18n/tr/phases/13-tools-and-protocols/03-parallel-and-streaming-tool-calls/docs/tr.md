# Paralel Araç Çağrıları &amp; amp; Araçların Akışları

> Üç bağımsız hava sorusu Eğer bir dizi çalıştırılırsa, işte üç kez geri döner. Bir dizi çalıştırıldıktan sonra, toplam tüketim en yavaş tek bir ayarlamalara düşer. Şimdi her sınır sağlayıcısı tek bir sırada birden fazla araç çağrısı gönderebilir.

**类型：**Yapım
**语言：**Python(stdlib, ip havuzu + akış harnes)
**前置要求：**13 · 02 aşama
**时间：**75 dakika kadar .

## Öğrenme hedefi

- Neden var olduğunu açıkla .`parallel_tool_calls: true`Ne zaman kullanmamalıyız?
- paralel fan-out sırasında, akıştı tartışmalar parçacıkları 关联到正确的工具-call id──
- Öte yandan, bölümü.`arguments`string 重组为完整 JSON。
- 运行一个三城市天气基准, sıralı vs paralel gecikme göstermek

## 问题

没有平行电话 时,一个代理 回答 Bengaluru, Tokyo ve Zürich'te hava durumu nasıl:

```
user -> LLM
LLM -> call get_weather(Bengaluru)
host -> run executor, reply with result
LLM -> call get_weather(Tokyo)
host -> run executor, reply with result
LLM -> call get_weather(Zurich)
host -> run executor, reply with result
LLM -> final text answer
```

Üç kez LLM 往返,每次還要付出執行器延迟──大約是理想壁時計時間的4倍──

Paralel aramalar kullan:

```
user -> LLM
LLM -> call get_weather(Bengaluru); call get_weather(Tokyo); call get_weather(Zurich)
host -> run all three executors concurrently, reply with three results
LLM -> final text answer
```

Bir kere LLM 往返──Executor 时间是三者的最大值,而不是总和──在OpenAI、Anthropic 和 Gemini 上的生产基准显示, 扇-out iş yükleri için, duvar saati %60 ila %70 oranında azalmaktadır──

代价是相关性复杂性──三调调乱序完成时,你的结果必须带带匹配的`tool_call_id`, model                                                                                                                                                                                                                                                              

## 概念

### 启用 paralel

- **OpenAI。** `parallel_tool_calls: true`默认开启──设置为 `false`- Zorlu seri.
- **Anthropic。**- Evet .`disable_parallel_tool_use: false`实现 paralel Claude 3.5 及以上默认开启)`true`Seriye göre.
- **Gemini。**始终具备平行能力;`tool_config.function_calling_config.mode = "AUTO"`让模型决定――

Eğer aletler var, bu da çok önemli.`create_file`Sonra .`write_file`) 、bir düzenli giriş diğer düzenli girişleri etkiler, veya oran sınırlayıcı ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞

### İd ilişkisi

Model                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `id`◊ host 返回的每个结果都必须包含同一个ID──没有这个ID,结果就会含糊不清──

- **OpenAI。**Her bir araç rolü mesajı  上 的`tool_call_id`- Evet.
- **Anthropic。**Her biri .`tool_result`blok yukarı `tool_use_id`- Evet.
- **Gemini。**Her biri .`functionResponse`Yukarı `id`(Gemini 3 及以上;Gemini 2 按名 匹配,这会在同名平行通话中出错)

### İşlemi gerçekleştirmek

Ev sahibi kendi iplerinde  coru veya uzaktan çalışan  上运行每个调用执行器──最简单的使用字段;生产环境使用异步配合 配合 `asyncio.gather`Yapılandırılmış eşzamanlılık, tamamlanıp gerçekleşmesi öngörülemez, sadece bir tanımlama.

Bir adet üzre hata: Çeviri listesi 顺序回复结果, yerine完成顺序回复;;`tool_call_id`Ancak bir sonuç kaybedildiğinde veya tekrarlandığında, düzenli olarak gönderilen düzenleme denemeyi daha zorlaştırır.

### Akış araç çağrıları

Model olarak akış  biçiminde çıkış zaman,`arguments`Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef: Hedef:f: Hedef:f: d:f: d:f:f: d:f:f:f: d:f:f:f: d:f:f:f:f:f:f:f:f: d:f:f:f:f:f:f:f:f:f:f:f:f:f:f:f:f:f:f:fifififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififififi

按供应商的结构:

- **OpenAI。**Her parça da öyle .`choices[0].delta.tool_calls[i].function.arguments`(bölüm satırı)`index`(Hız listesi içinde) ▽ ▽ ▽ ▽ ▽ ▽`id`İlk kez ortaya çıktığında okudu ve onu aldı.`finish_reason = "tool_calls"`时解析 JSON。
- **Anthropic。**Akış olayları `message_start`Sonra her blokta bir tane .`content_block_start`,类型为`tool_use`(id,name,空 giriş içerir)`content_block_delta`olaylar 携带 `input_json_delta`Çubuklar.`content_block_stop`Her blok kapatılıyor.
- **Gemini。** `streamFunctionCallArguments`(Kızılcım 3 及以上)`functionCallId`Bu yüzden aramalar yapılabilir.

### Bölümsel JSON 和 parse-early 陷

- Evet .`arguments`完整之前不能解析──像 `{"city": "Beng`Bu kısmi JSON geçerli JSON değil, hata yapar.`finish_reason = "tool_calls"`、Antropik `content_block_stop`...veya Gemini'nin akış sonu olayı... ...sadece o zamana kadar denemek.`json.loads`更健壮的做法是使用增量 JSON parser,在结构完成时产出事件;OpenAI'nin streaming guide 推这种做法,用于实时展示的思考指标的 UX──Brace-counting 作为完整性测试并不可靠(引用字符串或逃逸内容中的 braces将导致虚假积极),只能作为非正式调试测学──

### Sipariş dışı tamamlama

```
call_A: fast API, returns first
call_B: slow API, returns second
call_C: median API, returns third
```

Ev sahibi cevap 仍然必须引用 ids:

```
[{role: "tool", tool_call_id: "call_A", content: ...},
 {role: "tool", tool_call_id: "call_B", content: ...},
 {role: "tool", tool_call_id: "call_C", content: ...}]
```

ÖYİ veya ANTROPİK'te, yanıtlar sırası doğruyu etkilemez.

### Benchmark: sıralı vs paralel

`code/main.py`Orta harness 模拟三个执行器, latency 分别为 400、600 和 800 ms──Sequential 运行总共需要 1800 ms──Parallel 运行需要 max(400, 600, 800) = 800 ms──差异是常量,而不是比例,所以节省会随着工具数 增长──

Gerçek dünya dikkatleri: paralel aramalar 会给下游 API 增加压力──对利率有限服务做10路风扇out 会失败──Phase 13 · 17 会覆盖 gateway-level backpressure;retry semantics 计划放在未来阶段──

### Akıştı fan-out of duvar saati

Eğer model kendiliğinden akış biçiminde çıkarsa, bir çağrı argümanlarının 完整后立即开始执行,而不是等等所有的通话都完成── bu OpenAI tarafından kaydedilen bir optimization, ancak tüm SDK'lar değil 暴露──本课的利用会这样做:只要模拟流产出完整的参数对象,主机就会启动那个通话──


```figure
tp-parallel-fanout
```

## Kullan

`code/main.py`İki bölüm vardır.`concurrent.futures.ThreadPoolExecutor`, sırası ve paralel çalışmalar, üç simülasyonlu hava çağrısı, duvar saatini yazıyor.`arguments`parçalar,并用 `StreamAccumulator`按 id 重组──没有LLM,没有网络,只有重组逻辑──

关注点:

- Düzsel zamanlama  1.8 saniye ⋅ paralel zamanlama ⋅ aynı sahte gecikmeler ⋅ 0.8 saniye ⋅
- Akkumülatör id tamponuyla, sadece her çağrıda JSON'u tamamıyla çözebilir, parçalara ulaşacak şekilde işlemeyi başarabilir.
- Bir id'in argümanlarını tamamlamak için 后立即启动, değil等 tüm akışları 结束──

## - Söyle.

本课会产 出 `outputs/skill-parallel-call-safety-check.md` Bir araç kayıt, bu beceri, hangi araçları güvenli bir şekilde paralelleştirmek, hangi sipariş bağımlılıkları, hangi çalışma basıncı  aşağı ücret sınırları,并返回一个带有每工具 `parallel_safe`bayraklar 修订 registry。

## 练习

1. 运行  İşlem`code/main.py`Ve değişim simgesi gecikmelerinin.`max/sum`(trüde programlaması, seriallaşması ve harness overhead ve ideal değerden biraz daha uzaklaşması nedeniyle gerçekleşir)

2. 扩展蓄積器,处理 call mid-stream 情况:`cancelled`Bu durumu kim kaydetti?`content_block_stop`语义和 OpenAI'nın `finish_reason: "length"`行为──

3. Kullan .`asyncio.gather`替换线程池──对两者做基准──你应该能够看到异步 有小幅收益,因为语境开关成本更低,但前提是执行者做真 I/O──

4. 选择两个不应对化的工具 (örneğin)`create_file`Sonra .`write_file`)。Kızdırma 添加一个 `ordering_dependency`grafik,并基于该图对平行风扇做门──这是依赖意识的规划的最小机制,未来的代理工程阶段 会将其形式化──

5. 阅读 OpenAI'nin paralel fonksiyon çağrı bölümü 和 Anthropic'in `disable_parallel_tool_use`Antropik 建议禁用对行的一个真实世界工具类型――(提示:对同一资源的后果变化──)

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Parallel tool calls | “一个 turn 里的 fan-out” | Model 在单个 assistant message 中发出多个 tool calls |
| `parallel_tool_calls` | “OpenAI 的 flag” | 启用或禁用 multi-call emission |
| `disable_parallel_tool_use` | “Anthropic 的反向开关” | Opt-out flag；默认启用 parallel |
| Tool call id | “Correlation handle” | 每次调用的标识符，result message 必须原样回显 |
| Accumulator | “Stream buffer” | 用于 partial `arguments` chunks 的 per-id string buffer |
| Out-of-order completion | “最快的先返回” | Parallel calls 以不可预测的顺序完成；ids 是粘合剂 |
| Dependency graph | “Ordering constraints” | 某些 tools 的输出会进入其他 tools 的输入；不能 parallelize |
| Parse-early trap | “JSON.parse 炸了” | 尝试解析不完整的 `arguments` string |
| `streamFunctionCallArguments` | “Gemini 3 feature” | 带有每次调用 unique id 的 streamed argument chunks |
| Completion-order reply | “不要等全部完成” | 结果一到就回复，并按 id 标记 |

## 延伸阅读

- [OpenAI — Parallel function calling](https://platform.openai.com/docs/guides/function-calling#parallel-function-calling) 默认行为和opt-out flag
- [Anthropic — Tool use: implementing tool use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implementing-tool-use) `disable_parallel_tool_use`& sonuç serileme
- [Google — Gemini function calling parallel section](https://ai.google.dev/gemini-api/docs/function-calling)Gemini 3 ' in ID ile ilgili paralel aramalar
- [OpenAI — Streaming responses with tools](https://platform.openai.com/docs/api-reference/responses-streaming) OpenAI akışlarının parçalanmış argüman yeniden birleştirilmesi
- [Anthropic — Streaming messages](https://docs.anthropic.com/en/api/messages-streaming) 带 `input_json_delta``content_block_delta`
