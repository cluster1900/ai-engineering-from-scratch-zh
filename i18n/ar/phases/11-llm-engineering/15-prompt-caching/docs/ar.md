# التخزين السريع وتخزين السياق

> نظامك سريع لديه 4000 رمز. توكنتك RAG سياقك لديه 20,000 رمز. كل مرة اطلبني أن أرسلها معا.

**Type:** Build
**Languages:** Python
**前置要求:**المرحلة 11 · 01 (الهندسة السريعة) ، المرحلة 11 · 05 (الهندسة السياقية) ، المرحلة 11 · 11 (الاحتفاظ بالملف والتكلفة)
**Time:** ~60 分钟

## 问题

وكيل برمجة في كل دور من المحادثات سوف يرسل إلى كلود نفس 15000 نظام التوكن على الفور$3/M input tokens 计算，二十轮仅 input 成本就是 $0.90 هذا لا يشمل أيضا أي رسائل حقيقية للمستخدم.

لا يمكنك أن تتجنب إرسالها على كل دورة تحتاجها. الطريقة الوحيدة هي: لا تعود للمزود  لقد رأيت سابقة  دفع كامل السعر.

هذه الممارسة هي التخزين السريع. أطلقتها شركة الأنثروبات في آب/أغسطس 2024، وأطلقت في عام 2025 تطبيقات التخزين التشغيلي الممتدة لمدة ساعة واحدة. أطلقتها شركة OpenAI في وقت لاحق من ذلك العام. أطلقت جوجل التخزين 1.5 على التخزين السياقي الواضح.

## 概念

![Prompt caching: 写入一次，读取便宜](../assets/prompt-caching.svg)

**机制。**عندما يتناسب مقدمة طلب مع مقدمة في طلبات الأجل الأخير ، سوف يستخدم مزود مباشرة الاحتفاظ بالخزنة KV التي تم تشغيلها في المرة السابقة ، بدلاً من إعادة تشفير هذه الرموز.

**2026 年的三种 provider 风格。**

| Provider | API 风格 | 命中折扣 | 写入溢价 | 默认 TTL | 最小可缓存 |
|---------|-----------|--------------|---------------|-------------|---------------|
| Anthropic | 在 content blocks 上显式使用 `cache_control` markers | input 费用减免 90% | 25% surcharge | 5 分钟（可扩展到 1 小时） | 1,024 tokens (Sonnet/Opus), 2,048 (Haiku) |
| OpenAI | 自动 prefix detection | input 费用减免 50% | 无 | 最多 1 小时（best-effort） | 1,024 tokens |
| Google (Gemini) | 显式 `CachedContent` API | 按存储计费；读取约为正常价格的 25% | 每 token·hour 收取存储费 | 用户设置（默认 1 小时） | 4,096 tokens (Flash), 32,768 (Pro) |

**不变量。**ثلاثة من كل الجهازات فقط تخفيض المسبقات. إذا كان هناك أي رمز مختلف بين الطلبات، ثم كل شيء بعد الجهاز الأول مختلفة سوف تفوت.

### إلى مخبأ

```
[system prompt]          <-- 缓存这个
[tool definitions]       <-- 缓存这个
[few-shot examples]      <-- 缓存这个
[retrieved documents]    <-- 如果会复用就缓存，否则不要
[conversation history]   <-- 缓存到上一轮为止
[current user message]   <-- 永远不要缓存（每次都不同）
```

 خلاف هذا الترتيب  وضع رسالة المستخدم وضع نظام سريع فوق، أو  وضع تحركات استرداد  في بضع لقطات وسط المنظمة

### الاختراق المحدد 计算

25% من الانترافية 写入溢价 يعني، كتلة مخزن مخزن على الأقل يجب أن يتم قراءتها مرتين، من أجل تحقيق净省钱──1 次写入 + 1 次读取، متوسط كل طلب تكلفة 0.675x(节省 32%؛1 次写入 + 10 次读取, متوسط 0.205x(节省 80%)── تجربة قانون:缓存任何你预计在 TTL 内至少复用 3 次的内容──


```figure
prompt-cache-hit
```

## بناءها

### الخطوة 1: استخدام علامات واضحة من التخزين الإستعلامي الأنثروبية

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

`cache_control`ماركر  أخبر أنثروپيك  ستقوم بتخزين هذا الكتيب  5 دقائق  في هذا النافذة  في هذا النافذة  في هذا النافذة  في هذا النافذة  في هذا النافذة  في هذا النفذة

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

في المعلومات المركزية تحقق هذه الصفحتين إذا`cache_read_input_tokens`في العديد من الطلبات، أوضح مفاتيح الاحتفاظ الخاصة بك،

### 步骤 2: 一小时 تمديد TTL

对于长时间运行的批次工作,5分钟默认值会在工作之间过期──设置 `ttl`:

```python
{"type": "text", "text": RUBRIC, "cache_control": {"type": "ephemeral", "ttl": "1h"}}
```

تكلفة إدخال المكلفة المرتفعة لـ 1 ساعة من TTL هي 2x ((إضافة 50%، بدلا من 25%) مقارنة بالخط الأساسي ، ولكن بالنسبة لأي إضافة إعادة استخدام أكثر من 5 مرات ، فإنها سوف تعود بسرعة إلى النظام الأساسي.

### الخطوة 3: OpenAI التخزين الآلي

لا تحتاج OpenAI إلى إعداد محتوى. أيّ رمز يتجاوز 1024 رمزًا ويتوافق مع مقدمة الطلبات القريبة، سيتم الحصول على خصم بنسبة 50٪ تلقائيًا.

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

نفس التطبيق على الاحتفاظ بقواعد وضعية جيدة. هناك شيئين من شأنه أن يفسد الاحتفاظ بـ OpenAI، ولكن لن يفسد Anthropic:更改 `user`字段(كانت تستخدم كفتحة الاحتفاظ (Cache Key) ، فضلا عن أدوات التركيز.

### 步骤 4: Gemini 显式 المحفظة المحفوظة

التوأم سوف تخفيظ 视为你创建并命名等级对象:

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

طالما أن الاحتفاظ بالخزنة الحية، الجيميني سوف يقوم بتحويل تكاليف التخزين حسب الوهم الساعة  وتحويل رسوم التخزين  معدل إدخال  25%                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

### الخطوة 5: في الإنتاج قياس معدل الضربة

参见 `code/main.py`، من بينها واحد模拟的三供应商记账器,会跟踪写/阅读/错过计数,并计算每1K请求的混合成本――将部署门禁绑定到目标击率 上大多数生产人类配置在热化后应看到>80%阅读分数――

## 2026 سَيَبْقىُ مُبعَثَ على الإنترنت

- **顶部的动态 timestamps。**النظام على الفور 顶部 `"Current time: 2026-04-22 15:30:02"`كل طلب يُفوت، ووضع العلامات الزمنية في نقطة وقف الاحتفاظ بالخزنة
- **Tool reordering。**إثبات الترتيب الترتيبية أدواتتعزيز تعزيز تغيير إعادة التنظيم تدمير كل مرة في الحكم
- **自由文本近似重复。**"أنت مفيدة". مقابل "أنت مساعد مفيد".一个字节 不同 = 完整 miss。
- **太小的 blocks。**الأنثروبي 强制 1,024-Token 下限(هايكو 为 2,048)。
- **盲目的成本 dashboards。**سوف تتمزق "رموز المدخلات" إلى مخزن و غير مخزن.

## استخدمها

كومة التخزين الآلي لعام 2026:

| Situation | Pick |
|-----------|------|
| 拥有稳定 10k+ system prompt 且多轮交互的 agent | Anthropic `cache_control` with 5-min TTL |
| 复用某个 prefix 30+ 分钟的 batch job | Anthropic with `ttl: "1h"` |
| GPT-5 上的 serverless endpoints，无自定义 infra | OpenAI automatic（只需让你的 prefix 稳定且足够长） |
| 对巨大 code/doc corpus 进行多日复用 | Gemini explicit `CachedContent` |
| 跨 provider fallback | 在各 provider 间保持 cacheable prefix layout 完全一致，这样任何命中都可用 |

مع التخزين الاحتياطي الاسموي ((مرحلة 11 · 11)结合,用于用户-message 层:prompt caching 处理 *Token 完全相同*的复用,semantic caching 处理*语义完全相同*的复用。

## 交付 it

保存 `outputs/skill-prompt-caching-planner.md`:

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

## التدريب

1. **Easy。**خذ محادثة على كلود على مدار 10 مرات، منها 5000 رمز نظام محاولة`cache_control`运行,再使用它运行――报告两种情况的输入代码 账单――
2. **Medium。**编写一个测试 harness:给定提示模板 和请求日志,计算每个供应商的预期打击率 和美元节省(Anthropic 5m、Anthropic 1h、OpenAI 自動、双胞胎明确) 
3. **Hard。**إنشاء محفز التخطيط: Give determin a prompt 和一组标记为 `stable=True/False`في حال تم إعادة كتابة الحقول، سوف يتم وضع نقطة وقف واحدة في الاحتفاظ بأقصى موقع صديق للاحتفاظ، دون فقدان المعلومات.

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

- [Anthropic — Prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) `cache_control`、1h TTL、قطع الجداول حتى
- [OpenAI — Prompt caching](https://platform.openai.com/docs/guides/prompt-caching) تطابق المُستعارة الذاتية
- [Google — Context caching](https://ai.google.dev/gemini-api/docs/caching) `CachedContent`معدل التخزين و التكلفة
- [Anthropic engineering — Prompt caching for long-context workloads](https://www.anthropic.com/news/prompt-caching) 原始发布文章,包含 latency numbers──
- المرحلة 11 · 05 (هندسة السياق)  如何切分 prompt,让缓存可以落地──
- المرحلة 11 · 11 (التخزين والتكلفة)  سوف تطلب التخزين المحفظي مع رسائل المستخدم 上的语义缓存 配对──
- [Pope et al., "Efficiently Scaling Transformer Inference" (2022)](https://arxiv.org/abs/2211.05102) التخزين السريع عرجه على نموذج الذاكرة الاحتياطية KV للمستخدم ؛ شرح لماذا تقرأ المقبلات المتخزين 比重新计算便宜约 10×。
- [Agrawal et al., "SARATHI: Efficient LLM Inference by Piggybacking Decodes with Chunked Prefills" (2023)](https://arxiv.org/abs/2308.16369) prefill هو مرحلة من المقصورة التخزين السريع؛本文解释为什么会显著降低 TTFT,而 TPOT不受影响.
- [Leviathan et al., "Fast Inference from Transformers via Speculative Decoding" (2023)](https://arxiv.org/abs/2211.17192) التخزين السريع مع التشفير المضارب  فلاش انتباه  MQA/GQA  ، كلها 折推理成本曲线的杆;阅读本文了解另外三者──
