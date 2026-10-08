# त्वरित कैशिंग और संदर्भ कैशिंग

> आपके सिस्टम प्रॉम्प्ट में 4,000  टोकन हैं। आपके RAG संदर्भ में 20,000  टोकन हैं। प्रत्येक बार कृपया दो को एक साथ भेजें। आप भी दो को भुगतान करने के लिए भुगतान करेंगे। प्रत्येक बार।

**Type:** Build
**Languages:** Python
**前置要求:**चरण 11 · 01 (प्रॉम्प्ट इंजीनियरिंग), चरण 11 · 05 (सामग्री इंजीनियरिंग), चरण 11 · 11 (कैशिंग और लागत)
**Time:** ~60 分钟

## 问题

एक कोडिंग एजेंट वार्तालाप के प्रत्येक दौर में क्लाउड को भेजेगा 15,000-टोकन सिस्टम के समान संकेत।$3/M input tokens 计算，二十轮仅 input 成本就是 $0.90 यह भी शामिल नहीं है उपयोगकर्ता के किसी भी वास्तविक संदेशों को. प्रति दिन 10,000 बार बातचीत के साथ, निरंतर परिवर्तनशील पाठ खाते में $9,000/दिन तक पहुंच जाएगा.

आप गुणवत्ता को प्रभावित नहीं करते समय त्वरित संक्षिप्त नहीं कर सकते हैं। आप इसे हर बार जरूरत के मॉडल भेजने से बचने से भी नहीं बच सकते हैं। एकमात्र तरीका यह हैः

यह प्रथा शीघ्र कैशिंग है। मानव ने इसे 2024 में अगस्त में लॉन्च किया और 2025 में 1 घंटे के विस्तारित टीटीएल वेरिएंट को लॉन्च किया, ओपनएआई ने इसे उसी वर्ष के बाद में स्वचालित किया, गूगल ने जेमिनी 1.5 के साथ स्पष्ट संदर्भ कैशिंग शुरू की। आज तीनों ने इसे अपनी सीमा मॉडल में एक समान कार्यक्षमता प्रदान करने के रूप में पेश किया है।

## 概念

![Prompt caching: 写入一次，读取便宜](../assets/prompt-caching.svg)

**机制。**जब किसी अनुरोध का पूर्वावलोकन हाल के अनुरोध में किसी पूर्वावलोकन से मेल खाता है, तो प्रदाता इन टोकनों को पुनः एन्कोडिंग के बजाय सीधे पहले बार चल रहे KV-कैश का उपयोग करेगा। पहली बार आप एक छोटा सा हिस्सा लिखावट प्रीफ्रेम का भुगतान करते हैं, उसके बाद प्रत्येक बार आपको भारी रीडक्शन छूट मिलती है।

**2026 年的三种 provider 风格。**

| Provider | API 风格 | 命中折扣 | 写入溢价 | 默认 TTL | 最小可缓存 |
|---------|-----------|--------------|---------------|-------------|---------------|
| Anthropic | 在 content blocks 上显式使用 `cache_control` markers | input 费用减免 90% | 25% surcharge | 5 分钟（可扩展到 1 小时） | 1,024 tokens (Sonnet/Opus), 2,048 (Haiku) |
| OpenAI | 自动 prefix detection | input 费用减免 50% | 无 | 最多 1 小时（best-effort） | 1,024 tokens |
| Google (Gemini) | 显式 `CachedContent` API | 按存储计费；读取约为正常价格的 25% | 每 token·hour 收取存储费 | 用户设置（默认 1 小时） | 4,096 tokens (Flash), 32,768 (Pro) |

**不变量。**तीनों में केवल कैश-बैक प्रीफिक्स होते हैं। यदि अनुरोध के बीच कोई भी टोकन अलग होता है, तो पहले अलग टोकन के बाद सब कुछ गायब हो जाता है।

### एक दोस्ती के लिए कैश

```
[system prompt]          <-- 缓存这个
[tool definitions]       <-- 缓存这个
[few-shot examples]      <-- 缓存这个
[retrieved documents]    <-- 如果会复用就缓存，否则不要
[conversation history]   <-- 缓存到上一轮为止
[current user message]   <-- 永远不要缓存（每次都不同）
```

 इस क्रम के विपरीत  उपयोगकर्ता संदेश  सिस्टम शीघ्र ऊपर रखें, या  कुछ शॉट में  बीच में  कैश  हमेशा नहीं होगा 

### ब्रेक-ईव 计算

मानव के 25% 写入溢价 का अर्थ है, एक कैश ब्लॉक को कम से कम दो बार पढ़ा जाना चाहिए, ताकि शुद्ध省钱──1 बार लिखने का +1 बार पढ़ने का, औसत प्रति अनुरोध लागत 0.675x है(बचत 32%);1 बार लिखने का +10 बार पढ़ने का, औसत 0.205x है(बचत 80%)── अनुभव विधि:缓存任何你预计在 TTL内至少复用3次的内容──


```figure
prompt-cache-hit
```

##  इसे निर्माण

### 步骤 1: उपयोग स्पष्ट मार्कर के मानव संकेत कैशिंग

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

`cache_control`मार्कर  बताएं एंथ्रोपिक  यह ब्लॉक  भंडारण  5 मिनट                                                                                                                                                                                                                                                      

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

इन दोनों खण्डों को जांचें यदि`cache_read_input_tokens`कई बार अनुरोध में हमेशा के लिए शून्य, अपनी कैश कुंजी बताएं चल रहा है।

### 步骤 2: 一小时 विस्तारित टीटीएल

对于长时间运行的批发工作,5分默认值会在工作之间过期设置 `ttl`:

```python
{"type": "text", "text": RUBRIC, "cache_control": {"type": "ephemeral", "ttl": "1h"}}
```

1 घंटे के टीटीएल की प्रतिलिपि-प्रोफ्री लागत 2x है, जो मूल रेखा के मुकाबले 25% की बजाय 50% बढ़ जाती है, लेकिन 5 बार से अधिक बार दोहराए जाने वाले प्रीफिक्स के लिए, यह बहुत जल्दी वापस आ जाएगा।

### 步骤 3: ओपनएआई स्वचालित कैशिंग

OpenAI  ने आपके द्वारा विनियोजित सामग्री की आवश्यकता नहीं है  1,024 टोकन से अधिक कोई भी  और हाल के अनुरोध के पूर्वसर्ग के अनुरूप, आप स्वचालित रूप से 50% छूट प्राप्त करेंगे

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

इसी तरह कैश के लिए अनुकूल अनुकूलन व्यवस्था नियम. दो चीजें OpenAI के कैश को नष्ट कर सकती हैं, लेकिन Anthropic को नहीं: बदलाव `user`字段(यह कैश कुंजी के रूप में उपयोग किया जाता है 组成部分), तथा重排 उपकरण──

### 步骤 4: मिथुन 显式 संदर्भ कैशिंग

मिथुन एक प्रकार का वस्तु को कैश करेगा जिसे आप बनाएंगे और नामित करेंगेः

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

जब तक कैश  जीवित है, Gemini  टोकन  घंटे  संग्रहण शुल्क लेगा, और सामान्य इनपुट  दर  25% की कीमत पढ़ेंगे  जब आपको कई दिनों में कई सत्रों के बीच  दोहराने की आवश्यकता होती है  एक ही विशाल प्रॉम्प्ट  जब, यह आकार उपयुक्त है

### 步骤 5: उत्पादन में हिट दर का माप

参见 `code/main.py`, जिसमें से एक模拟的三供应商记账器,会跟踪写/读/错误计数,并计算每1K अनुरोधों के混合成本――将部署门禁绑定到目标打击率 上大多数生产人类配置在热升后应看到>80%读分量――

## 2026 में भी इस तरह की फंसी होगी।

- **顶部的动态 timestamps。**प्रणाली शीघ्र 顶部的 `"Current time: 2026-04-22 15:30:02"` प्रत्येक अनुरोध सभी याद आएँ                                                                                                                                                                                                                                                           
- **Tool reordering。**इस स्थिर क्रम क्रम क्रमबद्धता उपकरण  तैनाती  के बीच एक बार डिक्ट रिशॉफल  हर बार भाग्य को नष्ट करेगा
- **自由文本近似重复。**"आप सहायक हैं" बनाम "आप सहायक हैं।"一个字节 不同 = 完整 miss──
- **太小的 blocks。**मानव 强制 1,024-Token 下限(हायकू 为 2,048)。更小的块 会静默地不被缓存──
- **盲目的成本 dashboards。**"इनपुट टोकन" को कैश और अनकैश के लिए विभाजित किया जाएगा। अन्यथा प्रवाह घट जाएगा।

## इसका उपयोग करें

2026 साल का कैशिंग स्टैकः

| Situation | Pick |
|-----------|------|
| 拥有稳定 10k+ system prompt 且多轮交互的 agent | Anthropic `cache_control` with 5-min TTL |
| 复用某个 prefix 30+ 分钟的 batch job | Anthropic with `ttl: "1h"` |
| GPT-5 上的 serverless endpoints，无自定义 infra | OpenAI automatic（只需让你的 prefix 稳定且足够长） |
| 对巨大 code/doc corpus 进行多日复用 | Gemini explicit `CachedContent` |
| 跨 provider fallback | 在各 provider 间保持 cacheable prefix layout 完全一致，这样任何命中都可用 |

के साथ अर्थिक कैशिंग (Fase 11 · 11)结合,用于用户-message 层:prompt caching 处理 *Token 完全相同*的复用, अर्थिक कैशिंग 处理*语义完全相同*的复用。

## 交付 यह

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

## अभ्यास

1. **Easy。**取一个针对Claude的10-टर्न वार्तालाप, जिसमें 5,000-टोकन प्रणाली प्रम्प्ट शामिल है──先不使用 `cache_control`运行,再使用它运行―― रिपोर्ट दो प्रकार के मामलों के इनपुट-टोकन 账单――
2. **Medium。**编写一个测试带:给定提示模板 和请求日志,计算每个供应商的预期打击率 和美元节省(Anthropic 5m、Anthropic 1h、OpenAI स्वचालित、Gemini स्पष्ट) 
3. **Hard。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `stable=True/False`के फ़ील्ड, पुनः लिखना शीघ्र, एक एकल कैश ब्रेकपॉइंट  को अधिकतम कैश-अनुकूल स्थिति में रखा जाएगा, साथ ही साथ जानकारी नहीं खोई जाएगी।

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

- [Anthropic — Prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) `cache_control`、1h TTL、ब्रेक-ईव टेबल
- [OpenAI — Prompt caching](https://platform.openai.com/docs/guides/prompt-caching) स्वचालन पूर्वावचन मिलान──
- [Google — Context caching](https://ai.google.dev/gemini-api/docs/caching) `CachedContent`एपीआई तथा भंडारण मूल्य निर्धारण
- [Anthropic engineering — Prompt caching for long-context workloads](https://www.anthropic.com/news/prompt-caching) 原始发布文章, समाहित विलंबता संख्याएँ。
- चरण 11 · 05 (सामग्री इंजीनियरिंग)  如何切分 prompt,让缓存可以落地──
- चरण 11 · 11 (कैशिंग और लागत)  उपयोगकर्ता संदेशों के साथ कैशिंग को शीघ्र करेगा 上的语义缓存 配对──
- [Pope et al., "Efficiently Scaling Transformer Inference" (2022)](https://arxiv.org/abs/2211.05102) शीघ्र कैशिंग उपयोगकर्ता के KV-कैश मेमोरी मॉडल को उजागर करना; व्याख्या why why read cached prefix 比重新计算便宜约10×──
- [Agrawal et al., "SARATHI: Efficient LLM Inference by Piggybacking Decodes with Chunked Prefills" (2023)](https://arxiv.org/abs/2308.16369) prefill is prompt caching shortcut के चरण;本文 समझाता है कि क्यों कैश हिट होगा TTFT को काफी कम, जबकि TPOT प्रभावित नहीं होगा।
- [Leviathan et al., "Fast Inference from Transformers via Speculative Decoding" (2023)](https://arxiv.org/abs/2211.17192) शीघ्र कैशिंग तथा अनुमानित डिकोडिंग、Flash Attention、MQA/GQA एकजुट, सभी 折推理成本曲线的杆;
