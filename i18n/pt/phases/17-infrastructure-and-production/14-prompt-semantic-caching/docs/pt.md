# Cachagem rápida e Cachagem semântica 经济学

> **Pricing snapshot 日期为 2026-04。**A declaração de valor abaixo reflete os cartões de taxas de fornecedores da coleção durante a publicação desta aula; em seguida, antes de citar o seguinte, por favor, primeiro, verifique o link do arquivo.

> Caching 发生在两层──L2(provider-level)prompt/prefix caching 会为重复 prefix 复用注意 KV  Antropic 的快速缓存文件 宣称,在长提示上最高可降低 90% 成本、降低 85%延迟;对于Claude 3.5 Sonnet,cache reads 为$0.30/M，而 fresh 为 $3.00/M,TTL para 5 minutos, 1 hora TTL opções têm 2x escrever prémio(docs.anthropic.com,2026-04)。OpenAI prompt caching 会自动应用于 ≥1024 tokens,并将缓存输入 定价相对新鲜约90%折扣(platform.openai.com,2026-04); preciso por modelo taxa de caching 取决于现金率卡──L1(app-level) 语义缓存 会在嵌入式相似性中完全跳过LLM──Vender 95%精度指的是匹配正确度,而不是  报告的击率  报告的击率不是从10%开封聊) 升级到结构化查询 (不等);

**Type:** Learn
**Languages:** Python (stdlib, toy two-layer cache simulator)
**前置要求：**Fase 17 · 04 (VLLM Servings Internals), Fase 17 · 06 (SGLang RadixAttention)
**Time:** ~60 分钟

## Objectivo de aprendizagem
- 区分 L2 prompt/prefix caching(provedor 侧 KV 复用) com L1 semântica caching(对相似提示 绕过 LLM)。
- 解释 Antropic 的 `cache_control`显式标记, bem como dois TTL 选项 ((5-min e 1 hora) e seus multiplicadores de preços。
- De acordo com a taxa de sucesso, a mistura de resposta/prompto e os preços dos tokens, calcula-se o pré-
- Diz que a contra-patrão de paralelação de 5-10x de inflação, bem como a taxa de impacto de colapso de um padrão anti-conteúdo dinâmico.

## 问题
Você deu seu próprio serviço RAG, adicionou o caching rápido. O seu cálculo não mudou. Você mediu a taxa de acessórios; apenas 7%. As suas instruções parecem estarem em estado de estado, mas na verdade não são o sistema de instruções.

Além disso, seu agente irá responder a cada pergunta do usuário e executar 10 chamadas de ferramenta. 10 solicitações estão no primeiro cache de escrever antes de terminar até chegar ao provedor.

O caching é um acordo, não uma bandeira.

## 概念
### L2  Cachagem de antecedentes/prefixos do fornecedor

Provedor  armazenamento cacheable pré-fixo de atenção KV, e em seguida, em seguida, a seguinte correspondência para o pré-fixo de pedido 上复用它──你只支付一次写费,阅读 几乎免费──

**Anthropic (Claude 3.5 / 3.7 / 4 series)**:request 中的显式 `cache_control`marcador── Você marca quais blocos podem ser armazenados em cache──TTL:5-minuto(costos de escrita para 1,25x base) ou 1 hora(costos de escrita para 2x base)──Cache diz:Claude 3.5 Sonnet 上为$0.30/M，而 fresh 为 $3.00/M  便宜 10x(docs.anthropic.com,截至2026-04)。不同模型的价格 不同(Opus/Haiku 分别发布);始终交叉核对现场价格页──

**OpenAI**Para: Contatos de ≥1024 tokens Automatic caching(platform.openai.com,2026-04)。 sem flag flag flag.`usage.cached_tokens`Para medir a tua própria situação.

**Google (Gemini)**: através de API expressa fazer conteúdo em cache; 1M-token context significa "benefícios de cache"

**Self-hosted (vLLM, SGLang)**:Fase 17 · 06 介绍 RadixAttention  在你自己的计算上采用相同模式──

### L1  aplicativo 级 cache semântico

Em primeiro lugar, em primeiro lugar, em primeiro lugar, em primeiro lugar, em primeiro lugar, em primeiro lugar, em primeiro lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo lugar, em segundo segundo lugar, em segundo segundo segundo segundo lugar, em segundo lugar, em segundo lugar, em segundo segundo segundo segundo segundo segundo segundo segundo lugar, em segundo lugar, em segundo lugar, em segundo segundo segundo segundo segundo segundo segundo segundo lugar, em segundo lugar, em segundo segundo segundo segundo segundo segundo segundo segundo segundo segundo segundo segundo).

Open-source:Redis Vector Similarity、GPTCache、Qdrant。Commercial:Portkey Cache、Helicone Cache。

As alegações de precisão do fornecedor indicam a resposta em cache de retorno na frequência adequada, em vez de na frequência de produção.

- Chat aberto: 10-15%
- FAQ estruturada / apoio: 40-70%¬
- Questões de código: 20-30%
- Agentes de voz repetindo instruções:50-80%

### O padrão anti-paralelalização

Seu agente não foi enviado para enviar 10 chamadas de ferramenta. Todas as 10 têm o mesmo sistema de 4K-token prompt. Antropic cache escreve é por pedido. Primeira cache-escrever no provedor. Veja o prompt.

修复:batch com sequencial-first  单独发起请求 1,然后在 1 的缓存 已经填充 后再触发 2-10──给第一工具调用 增加300 ms;节省 5-10x 账单──

### O antipatrão de conteúdo dinâmico

O seu sistema de urgência parece:

```
You are a helpful assistant. The current time is 14:32:17.
User ID: abc123. Today is Tuesday...
```

Cada pedido é único. Cada pedido é escrito.

修复:把所有真正静态的内容移动到缓存前;把动态内容 添加到缓存边界 之后:

```
[cacheable]
You are a helpful assistant. [rules, examples, instructions]
[/cacheable]
[dynamic, not cached]
Current time: 14:32:17. User: abc123.
```

O ProjectDiscovery  através deste método, elevou a taxa de hits de cache de 7% para 74%, e publicou a anatomia 

### Batch de pilha + cache para cargas de trabalho noturnas

As APIs de lote ((Fase 17 · 15) em turnaround de 24 horas 下 oferecem 50% de desconto.

### Números que você deve lembrar

Os pontos de preços são dados de 2026-04 recolhidos dos documentos do fornecedor do link, e variam a cada mês.

- Antropic em cache:Claude 3.5 Sonnet 上 $0.30/M, cerca de 10x 便宜 便宜 10x ((docs.anthropic.com) ⋅
- Antropic cache write premium:1.25x(5-min TTL) ou 2x(1-hora TTL)。
- OpenAI auto-cache: aplicável a ≥1024 pedidos de tokens; em cartões de taxa atual, entrada em caché 定价约为新输入的10%(platform.openai.com) 👇
- Taxa de hits de cache semântico ((relatado pela comunidade):chat aberto 约 ~ 10%; FAQ estruturada 最高约 ~ 70%── não base documentada pelo fornecedor。
- ProjectDiscovery: através de 移出前, taxa de sucesso de 7% → 74%
- Anti-patrão de paralelação: típico relatório mostra, quando N 个 requisições paralelas 错过第一次 cache write 时,账单会膨胀 510x。


```figure
semantic-cache-hit
```

## Use-o
`code/main.py`模拟混合工作负载 上的 L1 + L2 caching──报告 hit rates、billet,并显示并并行处罚──

## Entrega-o
本课产 出 `outputs/skill-cache-auditor.md` Fornecer um modelo de tráfego e de controlo de cachéabilidade e recomendar uma reestruturação.

## 练习
1. 运行 `code/main.py`❖ trocar bandeira de paralelação ― 账单变化多少?
2. Seu sistema de prompt, has days期, 把它移出去, 展示, antes/após o cálculo da taxa de acidente.
3. Em caso de taxa de chegada de solicitações, calcule o break-even de 1 hora TTL ((2x escrever) com 5 minutos TTL ((1.25x escrever)
4. Cache semântico em 0.95 limiar 下命中 20%── em 0.85 下命中 50%, mas você vê respostas erradas em cache── escolher um limiar correto 并说明理由──
5. Você para cada batch de perguntas de usuário 10 sub-queries paralelas.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| L2 prompt cache | "prefix cache" | Provider 存储重复 prefix 的 KV |
| `cache_control` | "Anthropic cache marker" | 标记 cacheable blocks 的显式 attribute |
| Cache write premium | "write tax" | 从首次 miss 到 cache 的额外成本（1.25x 或 2x） |
| L1 semantic cache | "embedding cache" | 调用 LLM 前在 app-level 进行 hash-and-embed |
| GPTCache | "LLM caching lib" | 流行的 OSS L1 cache library |
| Cache hit rate | "hits / total" | 从 cache 服务的 requests 占比 |
| Parallelization anti-pattern | "the N-write trap" | N 个 parallel requests 会 N 次 miss cache |
| Dynamic content trap | "the time-in-prompt trap" | prefix 中的 dynamic bytes 会破坏 hit rate |
| RadixAttention | "intra-replica cache" | SGLang 的 prefix-cache implementation |

## 延伸阅读
- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) oficial `cache_control`Semântica e TTLs
- [OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching) comportamento de caching automático e elegibilidade。
- [TianPan — Semantic Caching for LLMs Production](https://tianpan.co/blog/2026-04-10-semantic-caching-llm-production)
- [ProjectDiscovery — Cut LLM Costs 59% With Prompt Caching](https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching)
- [DigitalOcean / Anthropic — Prompt Caching](https://www.digitalocean.com/blog/prompt-caching-with-digital-ocean)
