# APIs de lote  50%  desconto se tornaram padrões do setor

> Cada principal fornecedor oferece uma API de lote sincronizado, com 50% de desconto e cerca de 24 horas de turnaround. OpenAI, Anthropic, Google, bem como a maioria das plataformas de inferência (Fireworks batch tier, Batch Together) implementaram o mesmo modelo.

**Type:** Learn
**Languages:** Python (stdlib, toy batch-vs-sync cost simulator)
**前置要求：**Fase 17 · 14 (Cachagem Prontamente e Semântica)
**Time:** ~45 minutes

## Objectivo de aprendizagem
- Explicar três fornecedores de lotes de APIs ((OpenAI、Anthropic、Google) bem como 50% de desconto + 24h de rotação garantia。
- 计算 overnight Classificação de carga de trabalho 中叠加批量 + costos de entrada em cache,并与同步-未存基线对比──
- A partir de agora, a função de um grupo de trabalho será de:
- Para explicar duas armadilhas: interatividade parcial (eficiente) e derivação de esquema de saída (eficiente)

## 问题
Sua equipa publicou um pipeline de geração de relatórios noturnos, 50.000 documentos, resumo individual, resumos de cluster, reapreciação executiva,

Batch 能给你 50% 折扣──你还在系统提示──所有50k电话 共享) 启动了快速缓存── 叠加后,账单降至180$/night约为基线的9%──同一个管道,只改变了三个配置──

Batch é o LLM mais barato, mas muito poucos usam as tuas. A principal razão é que a equipe pensa que é em tempo real, mas o SLA é na verdade que é na manhã seguinte.

## 概念
### Três lotes de APIs

**OpenAI Batch API**O que é um dos principais benefícios de um sistema de transferência de dados?`/v1/batches`ponto final. As entradas correspondentes às condições do cache podem também ser obtidas preços de entrada no cache.

**Anthropic Message Batches**JSONL upload──24 horas de recuperação──50% de desconto──suporte `cache_control`O cache escreve é evidente, lê-se que vai acontecer automaticamente dentro do lote.

**Google Vertex AI Batch Prediction**O Geminí tem um desconto similar de 50%.

### Semântica: sincrono, não lento

Batch é 我承诺在24小时内回归不是这会花24小时──典型P50 é 2-6小时──Provedor irá regular seu lote em uma janela não alta de GPU 库存利用不足──

### Com caching 叠加

Uma resumo de 50k documentos, usando o mesmo sistema de 4K-token prompt:

- Sincrono não caché:$input × 4000 + $Output × 200), em taxas completas:
- Sincrono em cache: sistema de prompt em primeira redação 后被缓存; restante 49999 vezes obter entrada 10x de便宜──
- Batch caché:以上全部, 再加上 read 和 write 两者的50%折扣──

叠加效果:batch + cache = 约为同步未缓存账单的10%──任何一夜运行且拥有共享系统提示 的工作负载 都应使用它──

### Classificação da carga de trabalho

**Interactive** Usage:  User waits for response──TTFT 很重要──使用带 prompt caching 的同步调用──不能批次──

**Semi-interactive** Utilizador enviar tarefas, alguns minutos depois voltar para ver.

**Batch** Users expect results by morning ou next hour──Content pipelines、massas classificação、análise offline──始终 batch,始终叠加缓存──

常见错误: pois o pipeline é produção, vamos classificar tudo como interativo.

### Interação parcial 陷

Alguns recursos parecem interativos, mas podem ser tolerados por 5-10 minutos. Por exemplo: levar um relatório de saúde de clientes noturno em um clique.

A questão é: o que significa 24 horas para este usuário? Se a resposta for que eles não perceberem, vamos batendo.

### Output-scheme 陷

Formatos de arquivo de lote 因 provider而异:

- - JSONL, cada pedido.
- Antropic:JSONL, cada vez uma mensagem; formato de resposta 内嵌。
- Vertex:BigQuery tabela ou com prefixo GCS do TFRecord.

跨 provider 编写 one batch client significa que cada fornecedor precisa de código de adaptador。 propaganda de gateways multi-provider batch(Portkey、LiteLLM certos níveis) ainda é apenas para o formato bruto fazer de envelope fina。

### Você deve lembrar-se de números

- Desconto de lote do fornecedor: entrada + saída 统一 50%。
- SLA de reviravolta:保证 24 小时, típico P50 为 2-6 小时──
- 叠加 batch + entrada em cache:约为 sincronização 10% do custo não em cache.
- Triagem de carga de trabalho 规则: se 24h de latência 可接受,始终批量──


```figure
batch-lane-triage
```

## Use-o
`code/main.py`Para uma carga de trabalho de 50k documentos  calcular o custo de sincronização, sincronização + caché, lote, lote + caché, relatar em $ 和 % de poupança em

## Entrega-o
本课会产出 `outputs/skill-batch-triager.md` Determinar as características da carga de trabalho, dividir-se em interativo/semi/batch, não calcular a poupança 

## 练习
1. 运行 `code/main.py` Para um pipeline de 100k-doc, use 3K-token system prompt 和 500-token output, calcula full stack(batch + cache) comparado com a linha de base de sincronização de poupança。
2.  escolher um dos três recursos que você conhece de produtos reais  vai distribuir cada recurso para interativo/semi/batch
3. Os usuários reclamam que o relatório deles passou 3 horas. É um erro de triagem de lote, ou é interativo legalmente?
4. Seu batch API retorno SLA é 24h, mas P99 é 20 horas.
5. 计算 break-even:shared-prefix length 达到多少时,batch + cache 会会比你自己的预备 GPU 上一夜运行更便宜?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Batch API | “async discount” | 50% off，24h turnaround |
| JSONL | “batch format” | 每行一个 JSON request；OpenAI/Anthropic standard |
| Message Batches | “Anthropic batch” | Anthropic 的 batch API product name |
| Batch prediction | “Vertex batch” | Vertex AI 的 batch API product |
| Turnaround SLA | “24h promise” | 保证，不是典型值；典型是 2-6h |
| Workload triage | “interactivity decision” | Interactive / semi / batch routing decision |
| Output schema | “response format” | 每个 provider 的 JSONL layout；不可移植 |
| Stacked discount | “batch + cache” | 两者都适用时，约为 uncached sync bill 的 10% |

## 延伸阅读
- [OpenAI Batch API](https://platform.openai.com/docs/guides/batch) JSONL formato 和 `/v1/batches`Semântica.
- [Anthropic Message Batches](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing) formato de lote 和 `cache_control`Interação.
- [Vertex AI Batch Prediction](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/batch-prediction) Batch Gemini 语义。
- [Finout — OpenAI vs Anthropic API Pricing 2026](https://www.finout.io/blog/openai-vs-anthropic-api-pricing-comparison)
- [Zen Van Riel — LLM API Cost Comparison 2026](https://zenvanriel.com/ai-engineer-blog/llm-api-cost-comparison-2026/)
