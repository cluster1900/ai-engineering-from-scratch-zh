# FinOps de LLM  单位经济性与多租户归因

> 传统 FinOps 在 LLM 支出上会失效──成本是Token 交易,而不是资源在线时长──标签无法映射, uma chamada API é uma transação, não é um activo──工程决策(prompto 设计、文本窗、输出长度)就是财务决策──2026 playbook 要求从第一天起就埋点三个归因维度:per-user:`user_id`) para a fixação dos preços dos assentos, e a expansão, por tarefa`task_id`+ `route`) para o custo e a prioridade dos produtos, por inquilino`tenant_id`O valor da transferência de dados para o usuário é de aproximadamente 2 milhões de euros. O valor da transferência de dados para o usuário é de aproximadamente 2 milhões de euros. O valor da transferência de dados para o usuário é de aproximadamente 2 milhões de euros.

**类型：**Aprenda
**语言：**Python(stdlib,带 kill switch of brinquedos simulador de atribuição de custos)
**先修：**Fase 17 · 13(Observabilidade),Fase 17 · 14 ((Cachagem)
**时间：**Cerca de 60 minutos

## Objectivo de aprendizagem

- 解释为什么传统FinOps (tags + tiers) LLM 支出上会失效,并说出三个新归因维度──
- 枚举四个代币层 ((pronto、tool、memória、resposta),并说明为什么单桶发票会隐藏成本──
- Por multi-tenant 产品设计执法梯 (produtos de design)  (taxa → limite de gastos → interruptor de eliminação) 
- 选择单位指标(Costo por consulta / artefato resolvido), em vez de $/M Token。

## 问题

A sua conta mostra US$ 40.000.
- Que inquilino gastou o dinheiro?
- O que é que o produto caracterizou o gasto?
- Existe algum usuário individual em uso abusivo?
- Culpa é um inchaço rápido, ou uma amplificação da memória.

Tag-and-aggregate do lado do provedor para os recursos da nuvem ((EC2、S3) válido, pois os tags vão se espalhar para os itens da linha。 LLM API chamadas não vão automaticamente levar tag, você deve estar no site de chamadas 打上 user/task/tenant,并一路传递──事后归因总会漏掉边缘案──

## 概念

### Três caracteres

**Per-user**(`user_id`): quem gerou o quanto custos;. impulsionar o preço dos assentos;. expansão das conversas,并识别电力用户。

**Per-task**(`task_id`+ `route`): qual a superfície do produto  gerou o quanto de custos  impulsionou a priorização das características, bem como a decisão de matar ou não as características caras 

**Per-tenant**(`tenant_id`): qual cliente é rentável.

Desde o primeiro dia, estamos no local de chamada.

### Quatro níveis de tokens

| Layer | Example | Typical % of total |
|-------|---------|---------------------|
| Prompt | system + user input | 40-60% |
| Tool | tool-call results fed back | 20-40%（agent workloads） |
| Memory | prior conversation / retrieved docs | 10-30% |
| Response | model output | 10-30% |

Colocar todas as quatro camadas num balde vai fazer a optimização desaparecer.

### Escada de execução

1. **Rate limit**按租客 设置──预期峰值的2-3x──返回带 `Retry-After`O inquilino será impedido; não haverá contabilidade inesperada.

2. **Daily spend cap**按租客 设置──合同上限的1.5-3x──触发: limite de taxa de receita + alerta de sucesso do cliente──

3. **Kill switch**Baseada em relação à linha de base do inquilino de gastos z-score > 4。 inquilino de pausa automática; página em chamada; upgrade em operações + CS。

### 归因模式

- **Tag-and-aggregate**O que é o "metadata" é um "metadata" que é um "metadata" ou "metadata" que é um "metadata" ou "metadata" que é um "metadata" ou "metadata" que é um "metadata" ou "metadata" que é um "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metadata" ou "metad "metad "metad "metad" ou "metad "metad" ou "metad" ou "metad" ou "metad "metad" ou "metad" é "metad "metad" ou "metad" ou "metad "metad" ou "metad" ou "metad "
- **Telemetry joiner**Por meio de IDs de rastreamento Coloque os rastreamentos                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
- **Sampling + extrapolation**A taxa de pagamento é de 5 a 10%, re- multiplicando-se novamente.
- **Model-based allocation**: Us regressão 推断 cost driver── aplica-se a dados legados sem tags──
- **Event-sourced**Os eventos de Kafka / Kinesis (em tempo real)
- **Real-time streaming**O painel de controlo está a ser revestido.

### Custo por X é indicador de unidades

$/M Token é vendedor 语言──产品指标是:

- Cada custo de trabalho já resolvido.
- Cada artigo gerado custo.
- O custo de cada tarefa de um agente bem sucedido.
- Cada usuário vai falar por hora.

Para isso, o custo é limitado ao resultado do produto.

### 成本归因 结构

```
trace_id: abc123
  user_id: u_42
  tenant_id: t_7
  task_id: task_classify_doc
  route: model_haiku
  layers:
    prompt_tokens: 1800
    tool_tokens: 600
    memory_tokens: 400
    response_tokens: 150
  cost_usd: 0.0135
  cached_input: true
  batch: false
```

Cada chamada emitirão o arquivo de dados.

### 复合节省 复合节省 

Stack: cache + lote + rota + gateway──四个都用上时:
- Cache L2(Fase 17 · 14): entrada 约便宜 10x。
- Batch ((Fase 17 · 15): 50% de desconto
- Rota até modelo conveniente (Fase 17 · 16): custo reduzido 60%。
- A eficiência do gateway (fase 17 · 19): redundância + retestes。

O melhor estático  Caso: cerca de 5-10% da linha de base ingênua. A maioria das equipes ativou 2-3 alavancas; muito raramente, quatro estão empilhadas.

### Você deve lembrar-se de números

- 归因维度: por utilizador, por tarefa, por inquilino
- Quatro níveis de tokens: imediato, ferramenta, memória, resposta.
- O interruptor de extinção: gastar o z-score > 4..
- 单位指标:cost per query resolvido, em vez de $/M Token。
- Optimizações em pilhas: é possível atingir a linha de base de cerca de 5 a 10%.


```figure
i4-spend-ladder
```

## Use-o

`code/main.py`模拟一个多租户LLM服务,带三层执法梯子―― Inject into an abusive tenant,并演示杀开关 触发――

## Entrega-o

本课会生成 `outputs/skill-finops-plan.md`△ dado produto 和 escala, esquema de atribuição de design 和 escada de execução

## 练习

1. 运行 `code/main.py`Como é que você escolhe o valor?
2. Designar um painel de custo por inquilino ⋅ por tarefa ⋅ Você vai primeiro construir qual ⋅ 5 visualizações?
3. Seu maior inquilino é unit-economico-negativo.
4. Por produto de suporte  calcular custo por bilhete resolvido:3M Token/ticket, cerca de 800 bilhetes/dia, taxa em cache GPT-5.
5. 论证 Tagging retroativo 是否可能有效── quando é aceitável?

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Per-user attribution | “user-level cost” | 每次 call 都打上 `user_id` |
| Per-task attribution | “feature cost” | `task_id` + `route` 识别 product surface |
| Per-tenant attribution | “customer cost” | `tenant_id`；驱动单位经济性 |
| Four token layers | “cost layers” | prompt + tool + memory + response |
| Rate limit | “429 guard” | 在 gateway 强制执行的 per-tenant ceiling |
| Daily spend cap | “daily ceiling” | Tenant-scoped budget，带 alert |
| Kill switch | “auto-pause” | Spend z-score > 4 触发 auto-suspension |
| Cost per resolved | “product unit metric” | 成本绑定到产品结果，而不是 Token |
| Telemetry joiner | “trace-to-billing” | 准确性最高的归因模式 |
| Stacked optimization | “cache+batch+route+gateway” | 复合节省到约 5-10% baseline |

## 延伸阅读

- [FinOps Foundation — AI FinOps Overview](https://www.finops.org/wg/finops-for-ai-overview/)
- [FinOps School — Cost per Unit 2026 Guide](https://finopsschool.com/blog/cost-per-unit/)
- [Digital Applied — LLM Agent Cost Attribution 2026](https://www.digitalapplied.com/blog/llm-agent-cost-attribution-guide-production-2026)
- [PointFive — Azure OpenAI 中的 Managed LLMs](https://www.pointfive.co/blog/finops-for-ai-economics-of-managed-llms-in-azure-open-ai)
