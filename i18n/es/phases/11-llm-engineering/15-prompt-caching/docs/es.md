# Caching rápido y Caching de contexto

> Tu sistema de caché rápido tiene 4.000 Tokens. Tu contexto RAG tiene 20.000 Tokens. Por cada vez que lo hagas, envíe dos Tokens. También te dará dos para pagarlos. Por cada vez que lo hagas.

**Type:** Build
**Languages:** Python
**前置要求:**Fase 11 · 01 (Ingeniería de la Pronta), Fase 11 · 05 (Ingeniería del Contexto), Fase 11 · 11 (Caching y Costo)
**Time:** ~60 分钟

##  problemas

Un agente de codificación en cada ronda de conversación enviará a Claude el mismo sistema de 15,000 tokens en un instante.$3/M input tokens 计算，二十轮仅 input 成本就是 $0.90 Esto también no incluye ninguna información real del usuario.

Usted no puede evitar enviarlo en caso de no afectar la calidad. Usted también no puede evitar enviarlo en un modelo.

Esta práctica es el caché rápido. En agosto de 2024 se lanzó Anthropic, y en 2025 se lanzó un variante de TTL extendido de 1 hora. OpenAI lo automatizó más tarde en el mismo año, Google lanzó el caché de contexto abierto junto con Gemini 1.5 y ahora los modelos de su frontera lo ofrecen como una función de primer nivel.

## 概念

![Prompt caching: 写入一次，读取便宜](../assets/prompt-caching.svg)

**机制。**Cuando un prefijo de una solicitud coincide con un prefijo de una solicitud de plazo reciente, el proveedor utilizará directamente el KV-cache de la primera vez en funcionamiento, en lugar de volver a codificar estos Tokens.

**2026 年的三种 provider 风格。**

| Provider | API 风格 | 命中折扣 | 写入溢价 | 默认 TTL | 最小可缓存 |
|---------|-----------|--------------|---------------|-------------|---------------|
| Anthropic | 在 content blocks 上显式使用 `cache_control` markers | input 费用减免 90% | 25% surcharge | 5 分钟（可扩展到 1 小时） | 1,024 tokens (Sonnet/Opus), 2,048 (Haiku) |
| OpenAI | 自动 prefix detection | input 费用减免 50% | 无 | 最多 1 小时（best-effort） | 1,024 tokens |
| Google (Gemini) | 显式 `CachedContent` API | 按存储计费；读取约为正常价格的 25% | 每 token·hour 收取存储费 | 用户设置（默认 1 小时） | 4,096 tokens (Flash), 32,768 (Pro) |

**不变量。**Tres personas solo almacenan prefijos. Si entre las solicitudes hay un Token diferente, entonces todo lo que se pasa después del primer Token diferente se pierde.

### Para el caché de la estructura amigable

```
[system prompt]          <-- 缓存这个
[tool definitions]       <-- 缓存这个
[few-shot examples]      <-- 缓存这个
[retrieved documents]    <-- 如果会复用就缓存，否则不要
[conversation history]   <-- 缓存到上一轮为止
[current user message]   <-- 永远不要缓存（每次都不同）
```

 Contrariamente a este orden  Colocar el mensaje del usuario   colocar el sistema de inmediato arriba, o   en algunos disparos  en el caché 间中就永远不会命中.

### el equilibrio

El 25% de la antropic 写入溢价 significa que un bloque almacenado en caché debe ser leído al menos dos veces, para lograr la pureza de dinero.


```figure
prompt-cache-hit
```

## Construirlo

### Paso 1: Utiliza marcadores de forma clara de Antropic de caché de los pedidos

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

`cache_control`marcador  tell Anthropic                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

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

En el CI, revise estos dos segmentos si`cache_read_input_tokens`En varias veces de la solicitud siempre para cero, indique que sus llaves de caché están en movimiento.

### 步骤 2: 一小时 extendido TTL

对于长时间运行的批次工作,5 分钟默认值会在工作中过期──设置 `ttl`¿Qué es esto ?

```python
{"type": "text", "text": RUBRIC, "cache_control": {"type": "ephemeral", "ttl": "1h"}}
```

El costo de la entrada y la sobretaja de TTL de 1 hora es de 2x (aumento del 50% en lugar del 25% en relación con la línea de referencia), pero para cualquier prefijo de uso repetido que exceda de 5 veces, se volverá rápidamente a producir.

### Paso 3: OpenAI auto almacenamiento en caché

OpenAI  no necesita que usted configure contenido. Cualquier token superior a 1.024 y correspondiente a los prefijos de la solicitud de plazo reciente, obtendrá automáticamente un 50% de descuento.

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

También se aplica a la caché de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la`user`字段(se utiliza como clave de caché 组成部分), así como herramientas de re-排──

### 步骤 4: Gemini 显式 contexto almacenamiento en caché

Gemini va a cachar los objetos que se creen y nombran:

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

Mientras la caché  sobreviva, Gemini se encarga de cobrar un precio de almacenamiento por token·hora, y se utiliza un precio de entrada normal  tarifa de 25% de lectura.

### Paso 5: En la producción medir la tasa de impacto

参见 `code/main.py`, uno de ellos es un modelo de tres proveedores 记账器, seguirá el número de escrituras/lecturas/errores,并计算每1K solicitudes de mix-synthesis.

## El año 2026 seguirá siendo un año de trampa

- **顶部的动态 timestamps。**sistema de inmediato 顶部 `"Current time: 2026-04-22 15:30:02"`◊ Cada solicitud se pierde. ◊ Transferir los sellos de tiempo ◊ al punto de ruptura del caché abajo.
- **Tool reordering。**Para estabilizar el orden de los instrumentos de ordenamiento deploy  entre una reorganización dictada destruirá cada vez que se decide 
- **自由文本近似重复。**"Eres útil". vs "Eres una ayudante útil".一个字节 不同 = 完整 miss。
- **太小的 blocks。**Antropic 强制 1,024-Token 下限(Haiku 为 2,048)。 Más pequeños bloques 会静默地不被缓存。
- **盲目的成本 dashboards。**Se dividen los tokens de entrada en caché y caché.

## Usalo

Estaca de almacenamiento en caché de 2026:

| Situation | Pick |
|-----------|------|
| 拥有稳定 10k+ system prompt 且多轮交互的 agent | Anthropic `cache_control` with 5-min TTL |
| 复用某个 prefix 30+ 分钟的 batch job | Anthropic with `ttl: "1h"` |
| GPT-5 上的 serverless endpoints，无自定义 infra | OpenAI automatic（只需让你的 prefix 稳定且足够长） |
| 对巨大 code/doc corpus 进行多日复用 | Gemini explicit `CachedContent` |
| 跨 provider fallback | 在各 provider 间保持 cacheable prefix layout 完全一致，这样任何命中都可用 |

Conmemoración semántica (Fase 11 · 11) 结合, para uso en el mensaje de usuario 层:prompt caching 处理 *Token 完全相同*的复用,semántica caching 处理*语义完全相同*的复用。

##  entregarlo

保存 `outputs/skill-prompt-caching-planner.md`¿Qué es esto ?

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

##  ejercicios

1. **Easy。**取一个针对Claude's 10-turn conversation, incluyendo 5,000-Token sistema de respuesta──先不使用 `cache_control`运行,再使用它运行―― 报告两种情况的输入代码 账单―― 报告两种情况的输入代码 账单―― 运行,再使用它运行―― 报告两种情况的输入代码 账单―― 报告两种情况的输入代码 账单――
2. **Medium。**编写一个测试 harness:给定提示模板 和请求日志,计算每个供应商的预期打击率 和美元节省(Antropic 5m、Anthropic 1h、OpenAI automático、Gemini explicit) 
3. **Hard。**Construir un optimizador de diseño: Give determinan a prompt 和一组标记为 `stable=True/False`Los campos, reescribir en seguida, colocarán un único punto de ruptura de caché en la posición más fácil de almacenar, sin perder información.

## 关键术语: "El hombre es un hombre"

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

- [Anthropic — Prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)¿ Qué es esto ?`cache_control`、1h TTL、tablas de equilibrio de ruptura―
- [OpenAI — Prompt caching](https://platform.openai.com/docs/guides/prompt-caching) Auto-prefijo de coincidencia
- [Google — Context caching](https://ai.google.dev/gemini-api/docs/caching)¿ Qué es esto ?`CachedContent`API y precios de almacenamiento
- [Anthropic engineering — Prompt caching for long-context workloads](https://www.anthropic.com/news/prompt-caching) 原始发布文章, contenía números de latencia。
- Fase 11 · 05 (Ingeniería de contexto)  如何切分 prompt,让缓存可以落地──
- Fase 11 · 11 (Caching y costo)  Impulsará el caché con mensajes de usuario 配对
- [Pope et al., "Efficiently Scaling Transformer Inference" (2022)](https://arxiv.org/abs/2211.05102) caché rápido exposición al modelo de memoria KV-cache del usuario; explica por qué leer prefijo caché 比重新计算便宜约10×。
- [Agrawal et al., "SARATHI: Efficient LLM Inference by Piggybacking Decodes with Chunked Prefills" (2023)](https://arxiv.org/abs/2308.16369) prefill es la fase de acceso directo al caché rápido;本文解释为什么缓存击会显著降低TTFT,而TPOT不受影响──
- [Leviathan et al., "Fast Inference from Transformers via Speculative Decoding" (2023)](https://arxiv.org/abs/2211.17192) caching rápido y descodificación especulativa  Flash Attention  MQA/GQA uní, todo es 折推理成本曲线的杆;阅读本文了解另外三者──
