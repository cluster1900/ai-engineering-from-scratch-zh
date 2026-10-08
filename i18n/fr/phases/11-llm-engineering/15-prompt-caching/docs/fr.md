# Cachage rapide et Cachage de contexte

> Votre système de mise en cache rapide a 4000 Tokens. Votre contexte RAG a 20.000 Tokens. Chaque fois que vous le faites, vous enverrez deux en même temps. Vous en paierez également deux à chaque fois.

**Type:** Build
**Languages:** Python
**前置要求:**Phase 11 · 01 (ingénierie rapide), phase 11 · 05 (ingénierie contextuelle), phase 11 · 11 (caching et coût)
**Time:** ~60 分钟

##  problématique

Un agent de codage dans chaque round de dialogue va envoyer à Claude le même système de 15 000 tokens.$3/M input tokens 计算，二十轮仅 input 成本就是 $0,90 Cela ne comprend pas les messages réels des utilisateurs.

Vous ne pouvez pas éviter de l'envoyer en cas de non-impact sur la qualité. Vous ne pouvez pas éviter de l'envoyer en mode Chaque tour vous en avez besoin.

Cette pratique consiste à mettre en cache rapidement. Anthropic l'a lancé en août 2024 et a lancé en 2025 une version prolongée de 1 heure de TTL. OpenAI l'a automatisé plus tard cette année-là, Google a lancé une mise en cache de contexte explicite avec Gemini 1.5.

## 概念

![Prompt caching: 写入一次，读取便宜](../assets/prompt-caching.svg)

**机制。**Lorsque le préfixe d'une demande correspond à un préfixe de la demande à court terme, le fournisseur utilisera directement le cache KV de la première fois de fonctionnement, au lieu de recoder ces jetons.

**2026 年的三种 provider 风格。**

| Provider | API 风格 | 命中折扣 | 写入溢价 | 默认 TTL | 最小可缓存 |
|---------|-----------|--------------|---------------|-------------|---------------|
| Anthropic | 在 content blocks 上显式使用 `cache_control` markers | input 费用减免 90% | 25% surcharge | 5 分钟（可扩展到 1 小时） | 1,024 tokens (Sonnet/Opus), 2,048 (Haiku) |
| OpenAI | 自动 prefix detection | input 费用减免 50% | 无 | 最多 1 小时（best-effort） | 1,024 tokens |
| Google (Gemini) | 显式 `CachedContent` API | 按存储计费；读取约为正常价格的 25% | 每 token·hour 收取存储费 | 用户设置（默认 1 小时） | 4,096 tokens (Flash), 32,768 (Pro) |

**不变量。**Les trois sont uniquement des préfixes de cache. Si entre les requêtes il y a un seul Token différent, alors tout ce qui se passe après le premier Token différent est perdu.

### Pour le cache

```
[system prompt]          <-- 缓存这个
[tool definitions]       <-- 缓存这个
[few-shot examples]      <-- 缓存这个
[retrieved documents]    <-- 如果会复用就缓存，否则不要
[conversation history]   <-- 缓存到上一轮为止
[current user message]   <-- 永远不要缓存（每次都不同）
```

 Contrary à cet ordre  Placez le message de l'utilisateur                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

### dépassement

En effet, les données de base de l'Anthropic 25% 写入溢价 signifient qu'un bloc caché doit être lu au moins deux fois, afin de réaliser un net省钱──1 fois 写入 + 1 次读取, moyenne pour chaque demande de coûts de 0.675x(économie 32%);1 fois 写入 + 10 次读取, moyenne pour 0.205x(économie 80%)──Expérience:缓存任何你预计在 TTL内至少复用3次的内容──


```figure
prompt-cache-hit
```

## - Je le construis.

### 步骤 1: Utiliser des marqueurs apparents de mise en cache des prompts anthropiques

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

`cache_control`marqueur  tell Anthropic                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

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

Dans le CI, vérifier ces deux paragraphes si`cache_read_input_tokens`Dans plusieurs requêtes, toujours pour zéro, indiquez que vos clés de cache sont en déplacement.

### 步骤 2: 一小时 prolongé TTL

Pour les emplois de lot en cours de long temps, 5 minutes de valeur par défaut`ttl`- Le numéro de la liste:

```python
{"type": "text", "text": RUBRIC, "cache_control": {"type": "ephemeral", "ttl": "1h"}}
```

Le coût de la rédaction et de la surcharge d'une heure de TTL est de 2 fois plus élevé que la moyenne de base (augmentation de 50% au lieu de 25%), mais pour tout préfixe à refaire de plus de 5 fois, il reviendra rapidement.

### 步骤 3: OpenAI automatique de mise en cache

OpenAI   n'a pas besoin de votre configuration de contenu  Tous les tokens supérieurs à 1 024  et correspondant au préfixe de la demande à court terme, vous obtiendrez automatiquement 50% de réduction

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

Il y a deux choses qui détruiront le cache d'OpenAI, mais ne détruiront pas Anthropic.`user`字段(它被用作缓存键 组成部分), ainsi que des outils de répartition.

### 步骤 4: Gémeaux 显式 caching de contexte

Gemini va cacher 视为你创建并命名 un objet de la même catégorie:

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

Tant que le cache est en vie, Gemini se charge en fonction des jetons, des frais de stockage, et des frais d'entrée normaux à 25% de la valeur de lecture.

### Étape 5: Mesurer le taux de réussite dans la production

参见 `code/main.py`, dont un de trois fournisseurs 记账器, suivra l'écriture/lecture/miss 计数,并计算 per 1K demandes de mix-synthesis.

## L'année 2026 sera toujours en train de tomber en ligne

- **顶部的动态 timestamps。**Le système est rapide`"Current time: 2026-04-22 15:30:02"`◊ Chaque requête sera manquée. ◊ Mettre les timestamps ◊ déplacer à la cache point de rupture.
- **Tool reordering。**Pour établir l'ordre des outils de déploiement, une réorganisation de dicté détruira chaque fois la situation.
- **自由文本近似重复。**"Vous êtes utile". vs "Vous êtes un assistant utile".一个字节 不同 = 完整 miss。
- **太小的 blocks。**Les blocs sont plus petits et les blocs sont plus petits et les blocs sont plus petits.
- **盲目的成本 dashboards。**Les "tokens d'entrée" seront divisés en caches et en caches non cachées.

## Utilisez-le

Stack de mise en cache de 2026:

| Situation | Pick |
|-----------|------|
| 拥有稳定 10k+ system prompt 且多轮交互的 agent | Anthropic `cache_control` with 5-min TTL |
| 复用某个 prefix 30+ 分钟的 batch job | Anthropic with `ttl: "1h"` |
| GPT-5 上的 serverless endpoints，无自定义 infra | OpenAI automatic（只需让你的 prefix 稳定且足够长） |
| 对巨大 code/doc corpus 进行多日复用 | Gemini explicit `CachedContent` |
| 跨 provider fallback | 在各 provider 间保持 cacheable prefix layout 完全一致，这样任何命中都可用 |

Avec le caching sémantique(Phase 11 · 11)结合, utilisé pour le caching de message utilisateur 层:prompt 处理 *Token 完全相同*的复用,semantic caching 处理*语义完全相同*的复用。

## Je le livre.

保存 `outputs/skill-prompt-caching-planner.md`- Le numéro de la liste:

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

1. **Easy。**Prenez une conversation à 10 tours pour Claude, qui contient un prompt système de 5000 Toques.`cache_control`运行, reuse it运行―― rapport de deux cas de jetons d'entrée 账单――
2. **Medium。**编写一个测试 harness:给定提示模板 和请求日志,计算每个供应商的预期打击率 和美元节省(Anthropo 5m、Anthropo 1h、OpenAI automatique、Gemini explicit) 
3. **Hard。**Construire un optimisateur de mise en page: donner un prompt 和一组标记为 `stable=True/False`Les champs, réécrire prompt, va mettre un seul point de rupture de cache  dans la position la plus large cache-friendly  position, en même temps ne pas perdre de l'information.

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

- [Anthropic — Prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) `cache_control`1h TTL, tables à égaler
- [OpenAI — Prompt caching](https://platform.openai.com/docs/guides/prompt-caching) Automatisation du préfixe
- [Google — Context caching](https://ai.google.dev/gemini-api/docs/caching) `CachedContent`API et prix de stockage
- [Anthropic engineering — Prompt caching for long-context workloads](https://www.anthropic.com/news/prompt-caching) 原始发布文章, contenant des numéros de latence。
- Phase 11 · 05 (ingénierie de contexte)  如何切分 prompt,让缓存可以落地──
- Phase 11 · 11 (Cachage et coût)  Prompter le caching avec les messages utilisateurs 上的语义缓存 配对。
- [Pope et al., "Efficiently Scaling Transformer Inference" (2022)](https://arxiv.org/abs/2211.05102) prompt caching  exposer à l'utilisateur KV-cache modèle de mémoire; expliquer pourquoi lire préfixe caché 比重计算便宜约10×。
- [Agrawal et al., "SARATHI: Efficient LLM Inference by Piggybacking Decodes with Chunked Prefills" (2023)](https://arxiv.org/abs/2308.16369) préfill est la phase du raccourci de mise en cache rapide;本文解释为什么缓存击会显著降低TTFT,而TPOT不受影响──
- [Leviathan et al., "Fast Inference from Transformers via Speculative Decoding" (2023)](https://arxiv.org/abs/2211.17192) rapidement mis en cache avec le décoding spéculatif  Flash Attention  MQA/GQA un起, sont 折推理成本曲线的杆;阅读本文了解另外三者──
