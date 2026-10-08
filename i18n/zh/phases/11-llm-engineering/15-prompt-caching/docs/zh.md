# 快速缓存和文本缓存

> 你的系统提示有4000个代币. 你的RAG文本有20000个代币. 每次请你都会同时发送两种代币. 你也会为两者付费. 每次. 提示缓存让供应商在其侧保持这个预先热启动,并在重复使用时按正常费率10%向你计费.

**Type:** Build
**Languages:** Python
**前置要求:**11 · 01阶段 (即时工程), 11 · 05阶段 (文本工程), 11 · 11阶段 (存储和成本)
**Time:** ~60 分钟

## 问题

一个编码代理在每一轮对话中都会向克劳德发送相同的15000代码系统提示.$3/M input tokens 计算，二十轮仅 input 成本就是 $总体而言,用户的实际信息也没有被包含.

你不能在不影响质量的情况下缩短提示. 你也不能避免发送它模型 每轮都需要它.

这种做法就是快速缓存.在2024年8月,人类公司推出了它,并在2025年推出了1小时的扩展TTL变体,OpenAI在当年稍晚自动化了它,谷歌则随着Gemini 1.5推出了显式背景缓存.如今,三者都在其边界模型上将其作为一等功能提供.

## 概念

![Prompt caching: 写入一次，读取便宜](../assets/prompt-caching.svg)

**机制。**当一个请求的前与近期请求中的某个前匹配时,提供商会直接使用前一次运行的KV缓存,而不是重新编码这些代币.

**2026 年的三种 provider 风格。**

| Provider | API 风格 | 命中折扣 | 写入溢价 | 默认 TTL | 最小可缓存 |
|---------|-----------|--------------|---------------|-------------|---------------|
| Anthropic | 在 content blocks 上显式使用 `cache_control` markers | input 费用减免 90% | 25% surcharge | 5 分钟（可扩展到 1 小时） | 1,024 tokens (Sonnet/Opus), 2,048 (Haiku) |
| OpenAI | 自动 prefix detection | input 费用减免 50% | 无 | 最多 1 小时（best-effort） | 1,024 tokens |
| Google (Gemini) | 显式 `CachedContent` API | 按存储计费；读取约为正常价格的 25% | 每 token·hour 收取存储费 | 用户设置（默认 1 小时） | 4,096 tokens (Flash), 32,768 (Pro) |

**不变量。**三者都只存储前. 如果请求之间有任何一个不同的标志,那么从第一个不同的标志之后的一切都会错过.把*稳定*部分放在顶部,把*可变*部分放在底部.

### 为了保证我们的设计

```
[system prompt]          <-- 缓存这个
[tool definitions]       <-- 缓存这个
[few-shot examples]      <-- 缓存这个
[retrieved documents]    <-- 如果会复用就缓存，否则不要
[conversation history]   <-- 缓存到上一轮为止
[current user message]   <-- 永远不要缓存（每次都不同）
```

违反这个顺序,把用户信息放在系统提示上方,或者把动态检索在几次内间缓存就永远不会被命中.

### 破平 计算

预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预测: 预


```figure
prompt-cache-hit
```

## 构建它

### 步骤1: 使用显式标记的人类提示缓存

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

`cache_control`标记 告诉人类将这个区块存储 5 分钟. 在这个窗口内复用会命中.过期后复用会再次写入.

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

在IC中检查这两个字段如果`cache_read_input_tokens`在多次请求中始终为零,说明你的缓存密钥正在漂移.

### 步骤 2: 一小时延长的TLT

对于长时间运行的批量工作,5 分钟默认值会在工作之间过期设置`ttl`其他:

```python
{"type": "text", "text": RUBRIC, "cache_control": {"type": "ephemeral", "ttl": "1h"}}
```

对于每小时的TTL的写入溢价成本是2x(相对于基线增加了50%而不是25%),但对于任何重复使用的预先超过5次的批量,它都会很快回本.

### 步骤3:自动缓存

任何超过1024个代币的代码和与近期请求的预写相匹配,都会自动获得50%折扣.

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

两件事会破坏OpenAI的缓存,但不会破坏人类的:更改`user`字段(它被用作缓存键组成部分),以及重排工具──

### 步骤 4:双子座显式内幕缓存

双子座将将视为你创建并命名的等级对象:

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

只要存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存存储存存储存存储存储存储存储存存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存存储存储存储存存储存储存储存存储存储存储存储存储存储存储存储存储存储存储存储存储存储存储存存储存储存储存存储存储存存存储存存储存存存储存储存存存存储存存存储存储存储存存存存存储存储存存存存储存存存存存储存存存存存储存存储存存储存存存存存储存存存存存存存储存存存存存存存存存存储存存存存存存储存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存存

### 步骤5: 在生产中衡量撞击率

参见`code/main.py`预计将部署禁绑定到目标目标率 上大多数生产人类配置在加热后应看到>80%读取分数――

## 2026年仍将被发射到线上

- **顶部的动态 timestamps。**系统提示 顶部的`"Current time: 2026-04-22 15:30:02"`,每一个请求都会错过.把时间标移到缓存断点下面.
- **Tool reordering。**以稳定序列化工具部署 之间一次的命令调整会破坏每一次命中.
- **自由文本近似重复。**"你是有帮助的. "vs"你是有帮助的助手. "一个字节 不同 = 完整的小姐.
- **太小的 blocks。**强制1024代币下限(海库为2,048)。更小的块 会静默地不被缓存──
- **盲目的成本 dashboards。**输入代币将被分为缓存和未缓存.

## 使用它

2026 年的缓存堆:

| Situation | Pick |
|-----------|------|
| 拥有稳定 10k+ system prompt 且多轮交互的 agent | Anthropic `cache_control` with 5-min TTL |
| 复用某个 prefix 30+ 分钟的 batch job | Anthropic with `ttl: "1h"` |
| GPT-5 上的 serverless endpoints，无自定义 infra | OpenAI automatic（只需让你的 prefix 稳定且足够长） |
| 对巨大 code/doc corpus 进行多日复用 | Gemini explicit `CachedContent` |
| 跨 provider fallback | 在各 provider 间保持 cacheable prefix layout 完全一致，这样任何命中都可用 |

与语义缓存(Phase 11 · 11)结合,用于用户消息层:即时缓存 处理 *Token 完全相同*的复用,语义完全相同*的复用――

## 交付它

保存`outputs/skill-prompt-caching-planner.md`其他:

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

1. **Easy。**取一个针对克劳德的10轮对话,其中包含5000个代码系统提示――先不使用`cache_control`运行,再使用运行――报告两种情况的输入代码 账单――
2. **Medium。**编写一个测试:给定提示模板和请求日志,计算每个供应商的预期成功率和美元节省量(人类5m、人类1h、OpenAI自动、双子明确) 
3. **Hard。**构建一个布局优化器:给定一个提示 和一组标记为`stable=True/False`随着重写的快速,将单个缓存破解点放在最大的缓存友好的位置,同时不丢失信息.

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

- [Anthropic — Prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) `cache_control`1小时的TTL,打破平衡表.
- [OpenAI — Prompt caching](https://platform.openai.com/docs/guides/prompt-caching)自动前匹配──
- [Google — Context caching](https://ai.google.dev/gemini-api/docs/caching) `CachedContent`储存价格和储存价格
- [Anthropic engineering — Prompt caching for long-context workloads](https://www.anthropic.com/news/prompt-caching) 原始发布文章,包含延迟数量──
- 如何切分提示,让缓存可以落地──
- 11 阶段 · 11 (缓存和成本) 将提示缓存与用户消息上的语义缓存配对.
- [Pope et al., "Efficiently Scaling Transformer Inference" (2022)](https://arxiv.org/abs/2211.05102)快速缓存 暴露给用户的KV缓存内存模型;解释为什么读取缓存前比重计算便宜约10×。
- [Agrawal et al., "SARATHI: Efficient LLM Inference by Piggybacking Decodes with Chunked Prefills" (2023)](https://arxiv.org/abs/2308.16369)预填是快速缓存快捷方式的阶段;本文解释了为什么缓存击中会显著降低TTFT,而TPOT不受影响.
- [Leviathan et al., "Fast Inference from Transformers via Speculative Decoding" (2023)](https://arxiv.org/abs/2211.17192)快速缓存与投机解码,Flash Attention,MQA/GQA 一起,都是折推理成本曲线的杆;阅读本文了解另外三者──
