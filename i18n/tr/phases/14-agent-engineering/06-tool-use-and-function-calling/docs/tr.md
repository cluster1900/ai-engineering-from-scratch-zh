# Araç Kullanımı ve Fonksiyon Çağrıları

> Toolformer (Schick et al., 2023) 开创了自监督工具注释──Berkeley Function Calling Leaderboard V4 (Patil et al., 2025) 设定 2026年标准:40% ajanc、30% multi-turn、10% live、10% non-live、10% halüsinasyon──单轮 已解决──memory、dynamic decision-making 和 long-horizon tool chains 还没有解决──

**Type:** Build
**Languages:** Python (stdlib)
**前置要求:**Fase 14 · 01 (Agent Loop), Fase 13 · 01 (Dik dalış çağrısı)
**Time:** ~60 分钟

## Öğrenme hedefi
- 解释 Toolformer'ın kendi kendine denetimli eğitim sinyali: Only when execution can reduce next-Token Loss 时,才保留工具注释──
- BFCL V4'in beş değerlendirme kategorisini ve her bir ölçüm sınıfını açıklayın.
- 实现一个stdlib tool registry,包含方案验证、argument coercion 和执行 sandboxing──
- 诊断 2026 yılın üç açık sorunu: uzun uzayda araç zinciri, dinamik karar verme ve hafıza¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

## 问题
早期 tool use 问的是:model 能否预测一个正确的功能调用?现代 tool use 问的是:model 能否跨 40 个步骤链式调用 tools,具备内存,处理部分可观测性,恢复从工具故障中,并且不幻觉不存在的工具?

Toolformer 基线:modeller oluşturuldu. Kendiliğinden denetim yoluyla araçları kullanılabilir.

## 概念
### Toolformer (Schick et al., NeurIPS 2023)

Düşünce: Bırak model kullanın aday API çağrıları 标签自己的预训 corpus──对每个候选人 执行它──只有当包含工具结果 能降低一个代币 上的损失时,才保留该注释──然后在过后的 corpus 上的细调──

覆盖的工具:计算器、QA 系统、搜索引擎、翻译、日历──自监控信号 纯粹关注工具 是否有助预测文本,不需要人标签──

规模结果:tool use 会在规模足够时涌现──较小的模型 会因工具注释受损;较大的模型会受益──这就是为什么2026年边界模型内置强的工具使用能力,而大多数7B model 显然需要工具使用精细调才可靠──

### Berkeley Fonksiyon Çağrıları Liderboard V4 (Patil et al., ICML 2025)

BFCL, 2026 yıl fak fakte üzerinde değerlendirme ve değerlendirme.

- **Agentic (40%)** 完整代理轨迹:memory、multi-turn、dynamic decisions──
- **Multi-Turn (30%)** 带 tool chains 的交互式对话──
- **Live (10%)** User's submitted real prompts (User'in gönderdiği gerçek istekler)
- **Non-Live (10%)** sentetik test vakaları。
- **Hallucination (10%)** 检测何时不应调用 araç──

V3 devlet tabanlı değerlendirmeyi başlattı: ⇒ araç dizisi ⇒ sonra, API'nin gerçek durumunu kontrol etmek için (örneğin 文件是否已创建?), yerine eşleşen araç çağrılarının AST── V4 增添了网页搜索、记忆和格式敏感性类别──

2026 yıl关键发现:single-turn işlevi çağrısı 基本已解决。失败集中在记忆(跨轮 携带背景)、动态决策的取决方式 (前前结果选择工具)、长视线链 (长视线链) 后漂移 (后漂移) 后漂移) 后漂移 (后漂移) 后漂移) 后漂移 (后漂移) 后漂移) 后漂移 (后漂移) 后漂移 (后漂移) 后漂移 (后漂移) 后漂移 (后漂移) 后漂移 (后漂移) 后漂移 (后漂移) 后漂移 (后漂移) 后漂移 (后漂移) 后漂移 (后漂移) 后漂移 (后漂移) 后漂移 (后漂移) 后漂移 (后漂移) 后漂移 (后漂移) 后漂移 (后漂移) 后漂移) 后转移 (后转移) 后转移) 后转移 (后转移) 后转移) 后转移 (后转移) 后转移 (后转移) 后转移) 后转移 (后转移) 后转移) 后转移 (后转移) 后转移) 后转移)

### Araç Şeması

Her sağlayıcıda farklı bir şema vardır.

```
name: string
description: string (what it does, when to use it)
input_schema: JSON Schema (properties, required, types, enums)
```

Antropik 直接使用 `input_schema`❖ AçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçıkAçık`function.parameters`◊ ikisi de JSON Şemalarını kabul eder. ◊ Açıklamalar önemli bir rol oynar, model onları doğru araçları seçmek için okuyacaktır.

### Düzgünleştirme

Hiçbir araç çağrısı yapmayın.

1. **Type coercion.**Model可能在 schema 要求 int 的地方返回字符串 `"5"` If明确无歧义就强制;否则拒绝
2. **Enum validation.**Eğer bir şema yazıyorsan`status in {"open", "closed"}`, ve model 输出 `"in_progress"`, descriptive error reject kullanın.
3. **Required fields.**缺少 مطلوب فیلد -> 立即把错误观察 返回模型,而不是崩──
4. **Format validation.**Tarihler, e-postalar, URL'ler  Regex değil, belirli parserler 验证

Her doğrulama başarısızlığı yapısal gözlemlere geri dönmelidir, modelin doğru biçimle yeniden denemesi mümkün olsun.

### Paralel araç çağrıları

现代 providers 支持在一个助手转中并行工具通话──Loop:

1. Model 3 tane farklı araç çağrısı yaptı.`tool_use_id`- Evet.
2. Çalışma zamanı  onları gerçekleştirmek  If each other independent则并行)
3. Her sonuç bir sonuç olarak ortaya çıkar .`tool_result`blok 返回,并通过 `tool_use_id`- Ne? - Hayır.

工程规则:把相关性 IDs 当作关键约束──把它们交换,就会导致错误工具到错误结果路由──

### Kum kutucu

Araç yürütme sandbox sınırıdır。详情见堂 09。简短版: Her araçtan ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒  ⇒ ⇒ ⇒  ⇒ ⇒    ⇒ ⇒    ⇒ ⇒ ⇒             ⇒                                                                                                               `run_shell(cmd)`- "Hazır" sinyalini;`git_status()`Daha güvenli.


```figure
tool-routing
```

## Yapın onu.
`code/main.py`实现 bir üretim biçimi araç kayıt:

- JSON Schema alt kümesi onaylayıcı( sadece stdlib)。
- Araç kayıt, içerir açıklama, giriş şema, zaman çıkışı ve uygulayıcı
- Duruş zorlaması 和 enum doğrulama。
- 带 korelasyon kimliklerinin paralel araç gönderimi。
- 作为结构化 strings 的错误观察──

- Yapma .

```
python3 code/main.py
```

Bir mini ajanın izini gösterir. Bir sırada üç alet kullanır. Bunlardan biri kasıtlı olarak yanlış şekillendirilen arama.

## Kullan
Her sağlayıcı kendi araç şeması vardır:Anthropic、OpenAI、Gemini、Bedrock。 Eğer çoklu sağlayıcıya ihtiyacınız varsa, tercüme katmanı kullanın(OpenAI Ajanları SDK、Vercel AI SDK、LangChain araç adaptörü)。BFCL bir referans referans simgesidir; Eğer araç kullanımı ürünün merkezi ise, yayınlanın ve lütfen bunu kullanarak ajanınızı test edin。

## - Söyle.
`outputs/skill-tool-registry.md`Bu, bir araçın tanımını anlatır mı?

## 练习
1. Bir "no-op" aracı ekle, modelin herhangi bir diğer aracı kullanmayı açıkça reddetmesini sağla.
2. İç-sırç olarak ve akış-sırç olarak üzünlü tartışmayı gerçekleştirmek zorlama.
3. 添加 per tool timeout 和 连续失败 3 次后,在60s内拒绝该工具) ――Bu nasıl modelin kurtarma yöntemini değiştirecek?
4. BFCL V4 açıklaması: Seçim bir kategori: "çok dönüş" gibi, 并让你的代理 跑 10 个例提示:
5. Pydantic'e veya Zod'a nakledilen bir verilatör olacak.

## 关键术语
| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Function calling | "Tool use" | 使用 validated schema 的 structured-output tool invocation |
| Toolformer | "Self-supervised tool annotation" | Schick 2023 — 保留那些结果能降低 next-Token Loss 的 tool calls |
| BFCL | "Berkeley Function Calling Leaderboard" | 2026 benchmark：40% agentic、30% multi-turn、10% live、10% non-live、10% hallucination |
| Tool schema | "给 model 的 function signature" | name、description、arguments 的 JSON Schema |
| tool_use_id | "Correlation ID" | 将 tool call 与其 result 绑定；对 parallel dispatch 至关重要 |
| Hallucination detection | "知道何时不调用" | V4 category：没有合适 tool 时拒绝调用 |
| Argument coercion | "String-to-int repair" | 针对可预测 schema mismatch 的窄修复；如果有歧义则 reject |
| Sandboxing | "Tool execution boundary" | 每个 tool 的 read/write surface、network、timeout、memory cap |

## 延伸阅读
- [Schick et al., Toolformer (arXiv:2302.04761)](https://arxiv.org/abs/2302.04761) Kendiliğinden denetim gören araç notasyonu
- [Berkeley Function Calling Leaderboard (V4)](https://gorilla.cs.berkeley.edu/leaderboard.html) 2026 değerlendirme referansı
- [Anthropic, Tool use documentation](https://platform.claude.com/docs/en/agent-sdk/overview) Claude Agent SDK 中的制作工具方案
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) fonksiyon araç tipi 和 Guardrails
