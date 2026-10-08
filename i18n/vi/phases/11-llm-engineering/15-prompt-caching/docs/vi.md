# Caching nhanh và Caching ngữ cảnh

> Hệ thống của bạn sẽ nhanh chóng có 4.000 token. Trong bối cảnh RAG của bạn có 20.000 token. Mỗi lần bạn yêu cầu bạn sẽ cùng gửi hai token. Bạn cũng sẽ trả tiền cho hai token mỗi lần.

**Type:** Build
**Languages:** Python
**前置要求:**Giai đoạn 11 · 01 (Kỹ thuật nhanh chóng), Giai đoạn 11 · 05 (Kỹ thuật ngữ), Giai đoạn 11 · 11 (Tài lưu và chi phí)
**Time:** ~60 分钟

## 问题

Một đại lý lập mã trong mỗi vòng cuộc trò chuyện sẽ gửi cho Claude cùng một hệ thống 15,000-Token prompt.$3/M input tokens 计算，二十轮仅 input 成本就是 $0.90 Điều này không bao gồm bất kỳ tin nhắn thực tế nào của người dùng.

Bạn không thể không được chuyển giao cho các nhà cung cấp, bạn cũng không thể tránh được việc gửi nó mỗi lần.

Cách này là lưu trữ nhanh chóng. Anthropic đã ra mắt nó vào tháng 8 năm 2024 và ra mắt phiên bản TTL mở rộng 1 giờ vào năm 2025, OpenAI đã tự động hóa nó vào thời điểm cuối cùng của năm đó, Google đã bắt đầu ra mắt lưu trữ ngữ cảnh rõ ràng với Gemini 1.5.

## 概念

![Prompt caching: 写入一次，读取便宜](../assets/prompt-caching.svg)

**机制。**Khi một lệnh trước của yêu cầu phù hợp với một lệnh trước trong yêu cầu gần đây, nhà cung cấp sẽ trực tiếp sử dụng KV-cache chạy lần trước, thay vì mã hóa lại các mã thông báo này. Lần đầu tiên bạn thanh toán một phần nhỏ tiền thưởng, sau đó mỗi lần đều nhận được giảm giá lớn.

**2026 年的三种 provider 风格。**

| Provider | API 风格 | 命中折扣 | 写入溢价 | 默认 TTL | 最小可缓存 |
|---------|-----------|--------------|---------------|-------------|---------------|
| Anthropic | 在 content blocks 上显式使用 `cache_control` markers | input 费用减免 90% | 25% surcharge | 5 分钟（可扩展到 1 小时） | 1,024 tokens (Sonnet/Opus), 2,048 (Haiku) |
| OpenAI | 自动 prefix detection | input 费用减免 50% | 无 | 最多 1 小时（best-effort） | 1,024 tokens |
| Google (Gemini) | 显式 `CachedContent` API | 按存储计费；读取约为正常价格的 25% | 每 token·hour 收取存储费 | 用户设置（默认 1 小时） | 4,096 tokens (Flash), 32,768 (Pro) |

**不变量。**三者都只缓存前──如果请求之间有任何一个代币不同,那么从第一个不同代币之后的一切都会错过──把*稳定*部分放在顶部,把*可变*部分放在底部──

### Để giữ lại tình hình của bạn

```
[system prompt]          <-- 缓存这个
[tool definitions]       <-- 缓存这个
[few-shot examples]      <-- 缓存这个
[retrieved documents]    <-- 如果会复用就缓存，否则不要
[conversation history]   <-- 缓存到上一轮为止
[current user message]   <-- 永远不要缓存（每次都不同）
```

违反这个顺序 放用户消息 放系统提示 上面,或者把动态检索 在几次中间缓存就永远不会命中.

### break-even 计算

25% 写入溢价 của Anthropic có nghĩa là, một khối được lưu trữ tối thiểu phải được đọc hai lần, để thực hiện净省钱──1 lần写入 + 1 lần读取, trung bình mỗi lần yêu cầu chi phí là 0.675x( tiết kiệm 32%);1 lần写入 + 10 lần读取, trung bình là 0.205x( tiết kiệm 80%)──


```figure
prompt-cache-hit
```

##  xây dựng nó

### 步骤 1: Sử dụng các dấu hiệu hiển nhiên của Anthropic prompt caching

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

`cache_control`marker 告诉 Anthropic sẽ đóng khối 存储 5 phút.

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

Trong CI kiểm tra hai đoạn này nếu`cache_read_input_tokens`Trong nhiều lần yêu cầu, luôn luôn luôn cho không, cho biết chìa khóa cache của bạn đang di chuyển.

### 步骤 2: 一小时 mở rộng TTL

Đối với các công việc trong loạt dài thời gian hoạt động,5 分钟默认值会在工作之间过期──设置`ttl`- Có thể là:

```python
{"type": "text", "text": RUBRIC, "cache_control": {"type": "ephemeral", "ttl": "1h"}}
```

Chi phí nhập khẩu của TTL 1 giờ là 2x (( tăng 50% so với đường cơ bản, thay vì 25%), nhưng đối với bất kỳ prefix sử dụng lại nào  vượt quá 5 lần, nó sẽ nhanh chóng trở lại.

### 步骤 3: OpenAI tự động lưu trữ

OpenAI không cần bạn configure nội dung. Bất kỳ hơn 1.024 token và phù hợp với tiền đề yêu cầu gần đây, bạn sẽ tự động nhận được 50% giảm giá.

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

Cũng áp dụng cho cache Ước tính của các quy tắc thiết kế. Có hai điều sẽ phá hủy cache của OpenAI, nhưng sẽ không phá hủy Anthropic của:更改 `user`字段(它 được sử dụng như khóa cache 组成部分), cũng như các công cụ重排。

### 步骤 4: Gemini 显式 context caching

Gemini sẽ cache 视为你创建并命名的等级对象:

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

Chỉ cần lưu trữ tồn tại, Gemini sẽ nhận theo token·hour 收取存储费,并以约正常输入费率25% 价格阅读;;

### Bước 5: Trong sản xuất đo lường tỷ lệ tấn công

参见 `code/main.py`, trong đó có một mô hình của ba nhà cung cấp 记账器, sẽ theo dõi viết/ đọc/ bỏ qua 计,并计算 mỗi 1K yêu cầu của 混合成本――将部署门禁绑定到目标 hit rate 上大多数生产人类配置在热升后应看到 >80% đọc phần nhỏ――

## Năm 2026 vẫn sẽ bị đưa lên mạng

- **顶部的动态 timestamps。**hệ thống nhanh chóng 顶部的 `"Current time: 2026-04-22 15:30:02"`                                                                                                                                                                                                                                                              
- **Tool reordering。**Để ổn định trình tự trình tự hóa các công cụ triển khai ¦ một lần dikte tái tổ chức sẽ phá hủy mỗi lần命中。
- **自由文本近似重复。**"Bạn là người hữu ích". vs "Bạn là một trợ lý hữu ích".一个字节 不同 = 完整 miss。
- **太小的 blocks。**Anthropic 强制 1,024-Token 下限(Haiku 为 2,048)。Bài khối nhỏ hơn 会静默地不被缓存。
- **盲目的成本 dashboards。**Sẽ "tốc hiệu đầu vào" chia thành cache và không cache. Nếu không, lưu lượng giảm sẽ trông giống như một cache.

## Sử dụng nó

2026 năm bộ nhớ cache:

| Situation | Pick |
|-----------|------|
| 拥有稳定 10k+ system prompt 且多轮交互的 agent | Anthropic `cache_control` with 5-min TTL |
| 复用某个 prefix 30+ 分钟的 batch job | Anthropic with `ttl: "1h"` |
| GPT-5 上的 serverless endpoints，无自定义 infra | OpenAI automatic（只需让你的 prefix 稳定且足够长） |
| 对巨大 code/doc corpus 进行多日复用 | Gemini explicit `CachedContent` |
| 跨 provider fallback | 在各 provider 间保持 cacheable prefix layout 完全一致，这样任何命中都可用 |

Với cache ngữ nghĩa(Phase 11 · 11)结合,用于用户消息层:prompt cache 处理 *Token 完全相同*的复用,semantic caching 处理*语义完全相同*的复用。

## 交付 nó

保存 `outputs/skill-prompt-caching-planner.md`- Có thể là:

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

1. **Easy。**Hãy lấy một cuộc trò chuyện 10 lượt của Claude, trong đó có 5000 mã thông báo hệ thống.`cache_control`运行,再使用它运行―― báo cáo trong hai trường hợp
2. **Medium。**编写一个测试带:给定提示模板 和请求日志,计算每个供应商的预期打击率 和美元节省(Anthropic 5m、Anthropic 1h、OpenAI tự động、Gemini explicit) 👇
3. **Hard。** xây dựng một trình tối ưu hóa bố cục: Give determining a prompt 和一组标记为 `stable=True/False`Các trường, viết lại nhanh chóng, sẽ đặt một điểm phá vỡ cache đơn lẻ  đặt ở vị trí thân thiện với cache tối đa, đồng thời không bị mất thông tin.

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

- [Anthropic — Prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) `cache_control`、1h TTL、break-even bàn
- [OpenAI — Prompt caching](https://platform.openai.com/docs/guides/prompt-caching) tự động phù hợp với tiền tố
- [Google — Context caching](https://ai.google.dev/gemini-api/docs/caching) `CachedContent`API và giá lưu trữ.
- [Anthropic engineering — Prompt caching for long-context workloads](https://www.anthropic.com/news/prompt-caching) 原始发布文章,包含延迟 số.
- Giai đoạn 11 · 05 (Kỹ thuật ngữ)  如何切分 prompt,让缓存可以落地──
- Giai đoạn 11 · 11 (Caching and Cost)  sẽ yêu cầu lưu trữ cache với các tin nhắn người dùng 上的语义缓存 配对──
- [Pope et al., "Efficiently Scaling Transformer Inference" (2022)](https://arxiv.org/abs/2211.05102) prompt caching 暴露 cho người dùng mô hình bộ nhớ cache KV; giải thích tại sao đọc prefix được lưu trữ cached 比重新计算便宜约10×。
- [Agrawal et al., "SARATHI: Efficient LLM Inference by Piggybacking Decodes with Chunked Prefills" (2023)](https://arxiv.org/abs/2308.16369) prefill là giai đoạn của đường tắt cache nhanh; 本文 giải thích tại sao cache bị ảnh hưởng sẽ giảm đáng kể TTFT, trong khi TPOT không bị ảnh hưởng.
- [Leviathan et al., "Fast Inference from Transformers via Speculative Decoding" (2023)](https://arxiv.org/abs/2211.17192) prompt caching và phân tích dự đoán  Flash Attention  MQA/GQA , đều là 折推理成本曲线的杆;阅读本文了解另外三者──
