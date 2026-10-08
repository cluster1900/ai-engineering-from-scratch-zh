# Hızlı Kaydetme ve Kontekst Kaydetme

> Sisteminiz hızlıca 4.000 Token var. RAG bağlamınızda 20.000 Token var. Her seferinde iki tane gönderin. Her seferinde iki tane ödeme yapın.

**Type:** Build
**Languages:** Python
**前置要求:**11 · 01 aşaması (Hızlı Mühendislik), 11 · 05 aşaması (Kontext Mühendisliği), 11 · 11 aşaması (Kesinleme ve Maliyet)
**Time:** ~60 分钟

## 问题

Bir kodlama ajanı, Claude'a her konuşmanın bir kısmında aynı 15.000 token sistemi gönderiyor.$3/M input tokens 计算，二十轮仅 input 成本就是 $0.90 Bu da kullanıcıların herhangi bir gerçek mesajını içermez. Günlük 10.000 kez konuşma yaparak, sürekli değişmeyen metin hesapları günde 9.000 dolarlık bir miktar elde eder.

Kaliteli etkilemedikçe kısa sürede gönderilemez. Her seferinde ihtiyacımız olan bir model göndermekten kaçınabilirsiniz. Tek yöntem:

Bu uygulama hızlı önbelleğe alınmaktır. Antropik, 2024 yılının Ağustos ayında bunu piyasaya sürdü ve 2025 yılında 1 saatlik uzatılmış TTL variyatifini piyasaya sürdü. OpenAI, bu yılın daha geç saatlerinde otomatikleştirdi. Google, Gemini 1.5 ile birlikte açık bağlamalı önbelleğe başlattı.

## 概念

![Prompt caching: 写入一次，读取便宜](../assets/prompt-caching.svg)

**机制。**Bir istek öncüme, yakın zamanda yapılan isteklerin bir öncümi ile eşleşince, sağlayıcı bu simgelerin yeniden kodlanması yerine, doğrudan önceki seferde çalıştırılan KV-cache kullanır. İlk defa bir küçük yazma ödemesi yaparsanız, sonra her seferinde büyük bir indirim elde edilir.

**2026 年的三种 provider 风格。**

| Provider | API 风格 | 命中折扣 | 写入溢价 | 默认 TTL | 最小可缓存 |
|---------|-----------|--------------|---------------|-------------|---------------|
| Anthropic | 在 content blocks 上显式使用 `cache_control` markers | input 费用减免 90% | 25% surcharge | 5 分钟（可扩展到 1 小时） | 1,024 tokens (Sonnet/Opus), 2,048 (Haiku) |
| OpenAI | 自动 prefix detection | input 费用减免 50% | 无 | 最多 1 小时（best-effort） | 1,024 tokens |
| Google (Gemini) | 显式 `CachedContent` API | 按存储计费；读取约为正常价格的 25% | 每 token·hour 收取存储费 | 用户设置（默认 1 小时） | 4,096 tokens (Flash), 32,768 (Pro) |

**不变量。**Üçüncü kez sadece depolama önlemleri vardır. Eğer talepler arasında herhangi bir belirti farklı ise, ilk farklı belirti sonrası her şey kaybolacaktır.

### - Evet . - Evet .

```
[system prompt]          <-- 缓存这个
[tool definitions]       <-- 缓存这个
[few-shot examples]      <-- 缓存这个
[retrieved documents]    <-- 如果会复用就缓存，否则不要
[conversation history]   <-- 缓存到上一轮为止
[current user message]   <-- 永远不要缓存（每次都不同）
```

Bu sırayı çiğnemeden kullanıcı mesajını sistem prompt'ına yerleştirir veya hareketli geri alımları yapar.

### 計算

Antropik'in %25 写入溢价 anlamı, bir önbelleğe en az iki kez okunması gerekir, böylece net省钱──1 次写入 + 1 次读取, ortalama her başvuru maliyeti 0.675x(节省 32%);1 次写入 + 10 次读取, ortalama 0.205x(节省 80%)── deneyim kuralları:缓存任何你预计在 TTL内至少复用3次内容──


```figure
prompt-cache-hit
```

## Yapın onu.

### 步骤 1: Antropic prompt caching kullanmak

```python
import anthropic

client = anthropic.Anthropic()

SYSTEM = [
    {
        "type": "text",
        "text": "You are a senior Python reviewer. Follow the rubric exactly.\n\n" + RUBRIC_15K_TOKENS,
        "cache_control": {"type": "ephemeral"},
    }
]

def review(code: str):
    return client.messages.create(
        model="claude-opus-4-7",
        max_tokens=1024,
        system=SYSTEM,
        messages=[{"role": "user", "content": code}],
    )
```

`cache_control`marker  antropic                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

**Response usage fields:**

```python
response = review(code_a)
response.usage
# InputTokensUsage(
#     input_tokens=120,
#     cache_creation_input_tokens=15023,   # 按 1.25x 付费
#     cache_read_input_tokens=0,
#     output_tokens=340,
# )

response_b = review(code_b)
response_b.usage
# cache_creation_input_tokens=0
# cache_read_input_tokens=15023           # 按 0.1x 付费
```

Bu iki bölümde bir kontrol yapın.`cache_read_input_tokens`Çok defa istek ederken, kaydındaki anahtarların hareket halinde olduğunu göster.

### 步骤 2: 一小时 uzatılmış TTL

对于长时间运行的批次工作,5分默认值会在工作之间过期──设置 `ttl`- ...

```python
{"type": "text", "text": RUBRIC, "cache_control": {"type": "ephemeral", "ttl": "1h"}}
```

1 saatlik TTL'nin yazma ödemesi maliyeti 2x ((% 25 yerine % 50 artış) olarak değerlendirilir), ancak 5 kez daha fazla bir taklit prefiksi için, çok hızlı bir şekilde geri dönüşecektir.

### 步骤 3: OpenAI otomatik önbelleği

OpenAI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

```python
from openai import OpenAI
client = OpenAI()

resp = client.chat.completions.create(
    model="gpt-5",
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT},   # 长且稳定
        {"role": "user", "content": user_msg},
    ],
)
resp.usage.prompt_tokens_details.cached_tokens  # 获得折扣的部分
```

Aynı şekilde, cache için uygulanabilir.`user`字段((bu kullanılır cache anahtarı 组成部分), yanı sıra重排 araçları。

### 步骤 4: Gemini 显式 bağlamı önbelleği

Gemini , senin için bir nesneyi kaydetir .

```python
from google import genai
from google.genai import types

client = genai.Client()

cache = client.caches.create(
    model="gemini-3-pro",
    config=types.CreateCachedContentConfig(
        display_name="rubric-v3",
        system_instruction=RUBRIC,
        contents=[FEW_SHOT_EXAMPLES],
        ttl="3600s",
    ),
)

resp = client.models.generate_content(
    model="gemini-3-pro",
    contents=["Review this code:\n" + code],
    config=types.GenerateContentConfig(cached_content=cache.name),
)
```

Eğer kası  canlıysa, Gemini saat başına  depolama ücretini alır ve normal giriş oranının %25'ini alır.

### 5 adım: Üretimde vurma oranını ölçmek

参见 `code/main.py`, bir benzer üç sağlayıcı 记账器, 会跟踪写/read/miss 计数,并计算每 1K isteklerin混合成本――将部署门禁绑定到目标击率 上大多数生产人类配置在热升后应看到>80%读取分量――

## 2026 yılı hala çevrimiçi bir tuzağa düşecek.

- **顶部的动态 timestamps。**Sistem prompt 顶部 `"Current time: 2026-04-22 15:30:02"`◊ Her istek kaybedilecek. ◊ Time stamps ◊ Move to cache breakpoint ◊
- **Tool reordering。**Bir düzeltme düzenli olarak kullanılır.
- **自由文本近似重复。**"Yardımcısın". vs "Yardımcı bir asistansın".一个字 不同 = 完整 miss──
- **太小的 blocks。**Antropik 强制 1,024-Token 下限(Haiku 为 2,048)。 Daha küçük bloklar 会静默地不被缓存。
- **盲目的成本 dashboards。**"Geliş tokens"ı "cached" ve "uncached" olarak ayırırsak...

## Kullan

2026 yılının önbelleği:

| Situation | Pick |
|-----------|------|
| 拥有稳定 10k+ system prompt 且多轮交互的 agent | Anthropic `cache_control` with 5-min TTL |
| 复用某个 prefix 30+ 分钟的 batch job | Anthropic with `ttl: "1h"` |
| GPT-5 上的 serverless endpoints，无自定义 infra | OpenAI automatic（只需让你的 prefix 稳定且足够长） |
| 对巨大 code/doc corpus 进行多日复用 | Gemini explicit `CachedContent` |
| 跨 provider fallback | 在各 provider 间保持 cacheable prefix layout 完全一致，这样任何命中都可用 |

• • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •

## - Söyle.

保存 `outputs/skill-prompt-caching-planner.md`- ...

```markdown
---
name: prompt-caching-planner
description: 设计对 cache 友好的 prompt layout，并选择合适的 provider caching mode。
version: 1.0.0
phase: 11
lesson: 15
tags: [llm-engineering, caching, cost]
---

给定一个 prompt（system + tools + few-shot + retrieval + history + user）和一个 usage profile（requests per hour, TTL needed, provider），输出：

1. Layout。重排后的 sections，并标记单个 cache breakpoint；解释哪些 sections 是 stable，哪些是 volatile。
2. Provider mode。Anthropic cache_control、OpenAI automatic 或 Gemini CachedContent。根据 TTL 和 reuse pattern 说明理由。
3. Break-even。TTL 内每次写入的预期读取次数；用数学计算说明相对 no-cache 的净成本。
4. Verification plan。CI 断言第二个 identical request 上 cache_read_input_tokens > 0；dashboard 按 cached vs uncached tokens 拆分。
5. Failure modes。列出该设置中 cache 最可能 miss 的三个原因（dynamic timestamp、tool reorder、near-duplicate text），以及你将如何预防每一个。

拒绝交付将 dynamic field 放在 breakpoint 上方的 cache plan。拒绝在没有足以让 2x write premium 回本的 reuse count 时启用 1h TTL。
```

## 练习

1. **Easy。**Claude'un 10 dönüşlü konuşmasını alın, bunlardan biri 5.000 Token'li bir sistem isteklidir.`cache_control`运行,再使用它运行―― rapor iki durumda giriş-token 账单――
2. **Medium。**编写一个测试harness:给定提示模板 和请求日志,计算每个供应商的预期 hit rate 和美元节省(Antropic 5m、Anthropic 1h、OpenAI otomatik、Gemini explicit) 👇
3. **Hard。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `stable=True/False`Bu bölümde, yeniden yazma süresi, en büyük cache dostu konumdaki tek cache kırılma noktasını yerleştirecek, aynı zamanda bilgiyi kaybetmeyecek.

## 关键术语

| Term | 人们的说法 | 它实际的含义 |
|------|-----------------|-----------------------|
| Prompt caching | “让长 prompts 变便宜” | 复用 provider-side KV-cache 来匹配 prefixes；对重复 input tokens 提供 50-90% 折扣。 |
| `cache_control` | “Anthropic marker” | Content-block attribute，用于声明“到这里为止的一切都可缓存”；`{"type": "ephemeral"}`。 |
| Cache write | “支付溢价” | 填充 cache 的第一个请求；Anthropic 按约 1.25x input rate 计费，OpenAI 免费。 |
| Cache read | “折扣” | 后续匹配 prefix 的请求；按 10% (Anthropic)、50% (OpenAI)、约 25% (Gemini) 计费。 |
| TTL | “它存活多久” | cache 保持 warm 的秒数；Anthropic 默认 5m（可扩展 1h），OpenAI best-effort 最多 1h，Gemini 由用户设置。 |
| Extended TTL | “1-hour Anthropic cache” | `{"type": "ephemeral", "ttl": "1h"}`；2x write premium，但对于 batch reuse 值得。 |
| Prefix match | “为什么我的 cache miss 了” | 只有从开头到 breakpoint 的每个 Token 都 byte-identical 时，cache 才会命中。 |
| Context caching (Gemini) | “显式的那个” | Google 的命名型、按存储计费的 cache object；最适合对 large corpora 进行多日复用。 |

## 延伸阅读

- [Anthropic — Prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) `cache_control`1 saat TTL ∙ Break-even masalar
- [OpenAI — Prompt caching](https://platform.openai.com/docs/guides/prompt-caching) 自动 prefix eşleşme。
- [Google — Context caching](https://ai.google.dev/gemini-api/docs/caching) `CachedContent`API 和 depolama fiyatlandırması
- [Anthropic engineering — Prompt caching for long-context workloads](https://www.anthropic.com/news/prompt-caching) 原始发布文章, içerir gecikme numaraları。
- EY 11 · 05 (Kontext Mühendisliği)  如何切分 prompt,让缓存可以落地──
- 11 · 11 aşama (Kesi ve Maliyet)  Kullanıcı mesajları üstün semantik kaşiş 配对─
- [Pope et al., "Efficiently Scaling Transformer Inference" (2022)](https://arxiv.org/abs/2211.05102) prompt caching 暴露给用户的KV-cache memory model;解释为什么读取缓存前比重计算便宜约10×。
- [Agrawal et al., "SARATHI: Efficient LLM Inference by Piggybacking Decodes with Chunked Prefills" (2023)](https://arxiv.org/abs/2308.16369) prefill prompt caching shortcut'un aşamasıdır;本文 neden cache'i vurulduğunu açıklıyor.
- [Leviathan et al., "Fast Inference from Transformers via Speculative Decoding" (2023)](https://arxiv.org/abs/2211.17192) hızlı önbelleğe kaydetme ve spekülatif dekodlama  Flash Attention  MQA/GQA bir arada, 折推理成本曲线的杆;
