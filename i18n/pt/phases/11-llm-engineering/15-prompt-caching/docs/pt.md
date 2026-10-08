# Caching rápido e Caching de contexto

> Seu sistema de contato rápido tem 4.000 Tokens. Seu contexto RAG tem 20.000 Tokens. Por cada vez que você solicite, você também vai enviar dois simultaneamente. Você também vai pagar por dois. Por cada vez que você solicita, o provedor de contato rápido mantém o prefixo em seu lado e reutiliza em 10% da taxa normal.

**Type:** Build
**Languages:** Python
**前置要求:**Fase 11 · 01 (Engenharia de Pronto), Fase 11 · 05 (Engenharia de Contexto), Fase 11 · 11 (Cachagem e Custos)
**Time:** ~60 分钟

## 问题

Um agente de codificação em cada rodada de conversa vai enviar o mesmo sistema de 15 mil tokens para Claude.$3/M input tokens 计算，二十轮仅 input 成本就是 $0,90 Isto também não inclui qualquer mensagem real do usuário.

Você não pode reduzir o tempo em caso de não afetar a qualidade. Você também não pode evitar enviar o modelo.

Esta prática é o caching rápido. Antropic lançou o caching em agosto de 2024 e lançou o TTL variante de 1 hora em 2025, OpenAI o automatizou mais tarde no mesmo ano, o Google lançou o caching de contexto de forma explícita com o Gemini 1.5 e agora todos os modelos de sua linha de frente o oferecem como uma função de primeira linha.

## 概念

![Prompt caching: 写入一次，读取便宜](../assets/prompt-caching.svg)

**机制。**Quando um prefixo de um pedido se encaixa com um prefixo de um pedido de prazo recente, o provedor usará diretamente o KV-cache executado pela primeira vez, em vez de recodificar esses Tokens.

**2026 年的三种 provider 风格。**

| Provider | API 风格 | 命中折扣 | 写入溢价 | 默认 TTL | 最小可缓存 |
|---------|-----------|--------------|---------------|-------------|---------------|
| Anthropic | 在 content blocks 上显式使用 `cache_control` markers | input 费用减免 90% | 25% surcharge | 5 分钟（可扩展到 1 小时） | 1,024 tokens (Sonnet/Opus), 2,048 (Haiku) |
| OpenAI | 自动 prefix detection | input 费用减免 50% | 无 | 最多 1 小时（best-effort） | 1,024 tokens |
| Google (Gemini) | 显式 `CachedContent` API | 按存储计费；读取约为正常价格的 25% | 每 token·hour 收取存储费 | 用户设置（默认 1 小时） | 4,096 tokens (Flash), 32,768 (Pro) |

**不变量。**Três são apenas prefixos de cache. Se houver qualquer Token diferente entre os pedidos, então tudo que ocorre após o primeiro Token diferente será perdido.

### Para o cache da minha amiga.

```
[system prompt]          <-- 缓存这个
[tool definitions]       <-- 缓存这个
[few-shot examples]      <-- 缓存这个
[retrieved documents]    <-- 如果会复用就缓存，否则不要
[conversation history]   <-- 缓存到上一轮为止
[current user message]   <-- 永远不要缓存（每次都不同）
```

 Contrariamente a esta ordem  Colocar a mensagem do usuário   colocar o sistema de prompt acima, ou  colocar a recuperação de modo  em poucas fotos  entre cache  nunca será executado

### - equilíbrio

Antropic 25% 写入溢价 significa, um bloco em cache pelo menos deve ser lido duas vezes, para conseguir um netto省钱──1 次写入 + 1 次读取, média por pedido custo de 0,675x(节省 32%);1 次写入 + 10 次读取, média de 0,205x(节省 80%)──


```figure
prompt-cache-hit
```

## Construí-lo

### 步骤 1: usar marcadores de expressão Antropic prompt caching

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

`cache_control`marcador  dizer Anthropic                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

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

Em IC, verifique estes dois segmentos se`cache_read_input_tokens`Em várias vezes em pedido, sempre para zero, indique que as chaves do cache estão em movimento.

### 步骤 2: 一小时 prolongado TTL

对于长时间运行的批次工作,5分默认值会在工作中过期── 设置`ttl`- Não .

```python
{"type": "text", "text": RUBRIC, "cache_control": {"type": "ephemeral", "ttl": "1h"}}
```

O custo de entrada e prejuízo de 1 hora de TTL é de 2x ((aumento de 50% em relação à linha de base, em vez de 25%), mas para qualquer prefixo de reutilização superior a 5 vezes, ele será rapidamente reproduzido.

### 步骤 3: OpenAI auto-caching

OpenAI  não precisa de você configurar o conteúdo. Qualquer token superior a 1.024 e correspondente ao prefixo de solicitação de prazo recente, obtém automaticamente 50% de desconto.

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

Também é aplicável ao cache. Há duas coisas que podem destruir o cache do OpenAI, mas não prejudicarão o Anthropic.`user`字段(它被用作缓存键 组成部分), bem como ferramentas de re-排.

### 步骤 4: Gemini 显式 contexto em cache

Gemini vai cachar os objetos que você criou e nomeou:

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

Enquanto o cache  sobreviver, Gemini  cobrará o custo de armazenamento por token·hora  e a taxa de entrada normal  25%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

### 步骤 5: Em produção medir a taxa de impacto

参见 `code/main.py`, um dos três fornecedores 记账器, irá acompanhar a escrita/leia/miss 计数,并计算每 1K requisites 的混合成本――将部署门禁绑定到目标击率 上大多数生产人类配置在加热后应看到>80% read fraction――

## O ano 2026 ainda será um ano de trânsito.

- **顶部的动态 timestamps。**sistema de urgência 顶部的 `"Current time: 2026-04-22 15:30:02"`Todos os pedidos vão ser perdidos.
- **Tool reordering。**Para estabilizar a ordem, as ferramentas de distribuição de um único ditado de reorganização vão destruir cada vez que o destino.
- **自由文本近似重复。**"Você é útil". vs "Você é um assistente útil".一个字节 不同 = 完整 miss。
- **太小的 blocks。**Antropic 强制 1,024-Token 下限(Haiku 为 2,048)。
- **盲目的成本 dashboards。**"Tocos de entrada" serão separados em cache e não cachés.

## Use-o

Estaca de cache de 2026:

| Situation | Pick |
|-----------|------|
| 拥有稳定 10k+ system prompt 且多轮交互的 agent | Anthropic `cache_control` with 5-min TTL |
| 复用某个 prefix 30+ 分钟的 batch job | Anthropic with `ttl: "1h"` |
| GPT-5 上的 serverless endpoints，无自定义 infra | OpenAI automatic（只需让你的 prefix 稳定且足够长） |
| 对巨大 code/doc corpus 进行多日复用 | Gemini explicit `CachedContent` |
| 跨 provider fallback | 在各 provider 间保持 cacheable prefix layout 完全一致，这样任何命中都可用 |

Com caching semântico(Fase 11 · 11)结合, para uso de mensagem do usuário 层:prompt caching 处理 *Token 完全相同*的复用,semantic caching 处理*语义完全相同*的复用。

## Entrega-o

保存 `outputs/skill-prompt-caching-planner.md`- Não .

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

1. **Easy。**取一个针对克劳德的10轮对话,其中包含5000-Token系统提示──先不使用 `cache_control`运行,再使用它运行―― relatório em duas situações
2. **Medium。**编写一个测试harness:给定提示模板 和请求日志,计算每个供应商的预期打击率 和美元节省(Antropic 5m、Anthropic 1h、OpenAI automático、Gemini explicit) 
3. **Hard。**Construir um layout optimizer: given determining a prompt 和一组标记为 `stable=True/False`Os campos, reescrever prompt, colocarão o único ponto de ruptura do cache em o maior local de cache, ao mesmo tempo em que não perderão informações.

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

- [Anthropic — Prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)- Não .`cache_control`1h TTL, mesas de equilíbrio
- [OpenAI — Prompt caching](https://platform.openai.com/docs/guides/prompt-caching) Automática de correspondência de prefixos
- [Google — Context caching](https://ai.google.dev/gemini-api/docs/caching)- Não .`CachedContent`API 和 preços de armazenamento
- [Anthropic engineering — Prompt caching for long-context workloads](https://www.anthropic.com/news/prompt-caching) 原始发布文章, contém números de latência。
- Fase 11 · 05 (Engenharia de Contexto)  如何切分 prompt,让缓存可以落地──
- Fase 11 · 11 (Cachagem e Custos)                                                                                                                                                                                                                                                         
- [Pope et al., "Efficiently Scaling Transformer Inference" (2022)](https://arxiv.org/abs/2211.05102) cache rápido exposição ao modelo de memória KV-cache do usuário; explica por que ler prefixo em cache 比重新计算便宜约10×。
- [Agrawal et al., "SARATHI: Efficient LLM Inference by Piggybacking Decodes with Chunked Prefills" (2023)](https://arxiv.org/abs/2308.16369) prefill é a fase do atalho de cache rápido;本文解释为什么缓存击会显著降低TTFT,而TPOT不受影响──
- [Leviathan et al., "Fast Inference from Transformers via Speculative Decoding" (2023)](https://arxiv.org/abs/2211.17192) cache rápido com descodificação especulativa  Flash Attention  MQA/GQA , são 折推理成本曲线的杆;阅读本文了解另外三者──
