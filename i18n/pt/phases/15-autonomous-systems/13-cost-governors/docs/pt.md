# Orçamentos de acção, limites de iteração e governadores de custos

> 某中型电子商务代理的月度 LLM 成本,在团队启动"orden-tracking"habilidade 后,从 $1,200 跳到了 $4.800── isto não é um bug de preços── isto é um agente descobriu um novo ciclo, e continua no ciclo de gastos.`max_tokens`、 Token de cada tarefa 和美元预算、日月度上限、Iteration caps、分层模型路由、快速缓存、文本窗口、昂贵操作上的HITL checkpoints、预算违约时的杀开关──Anthropic's Claude Code Agent SDK utilizou diferentes nomes para oferecer a mesma capacidade básica──o limite de velocidade financeira, por exemplo, em 10 minutos, superior a $50 para cortar a visita, comparação entre o limite de um ciclo de captura mais rápido──

**Type:** Learn
**Languages:** Python (stdlib, layered cost-governor simulator)
**先修要求：**Fase 15 · 10 (modos de autorização), Fase 15 · 12 (execução duradoura)
**Time:** ~60 minutes

## 问题

Cada rodada de agentes autônomos gastará dinheiro real. O mau-output do chatbot é um mau-output; o mau-output do agente é um erro de conta. O termo para esse modelo de fracasso é "Denial of Wallet" em arquivos de indústria:agent continuar o cálculo continuar o uso de ferramentas continuar a contabilização, sem que nada o impeça, porque no início não havia um mecanismo de bloqueio projetado.

O método de reparação não é um número, mas um conjunto de diferentes medidas de tempo e de limitações de graxa: por pedido, por missão, por hora, por dia, por mês.

Esta é uma aula de engenharia: matemática é simples, equipe fracassou em lugar em um processo.

## 概念

### governador de custos 

1. **每次请求的 `max_tokens`。**简单―― evitar qualquer interrupção de produção sem limites.
2. **每个任务的 Token 预算。**Durante todo o processo de execução, deve exceder N 个 Token── até chegar ao limite de tempo de parada.
3. **每个任务的美元预算。**Com Token  similar, mas unidade é moeda.`max_budget_usd`- Não.
4. **每个工具调用上限。**Não excede N vezes `WebFetch`- Não, não.`shell_exec`调用, etc. etc.
5. **Iteration cap (`max_turns`)。**O número total de vezes de ciclo de agente; prevenção de ciclo de cálculo ilimitado.
6. **每分钟 / 每小时 / 每天 / 每月上限。**滚动窗口── Usado em diferentes medidas de tempo para capturar a fuga──
7. **财务速度限制。**Por exemplo, se o custo em 10 minutos for superior a $50, corte a visita.
8. **分层 model routing。**默认使用更小的模型; apenas quando o classificador 判断任务值得时才升级到更大的模型──
9. **Prompt caching。**Sistema de prompt 和 estabilização contexto existente fornecedor cache em; re-envio de Token 成本接近零──
10. **Context windowing。**通過縮小 /概括 把活文脈 保持在值以下;直接降低 Token 成本。
11. **昂贵操作上的 HITL checkpoints。**Antes de uma operação já conhecida, um modelo caro é necessário confirmar o uso de ferramentas de longo prazo.
12. **预算违约时的 kill switch。**任一上限触发时会议 中止──记录触发的上限; 需要单独的重新启动路径──

### Por que é necessário, e não um limite único?

单个月度上限只会在钱包已经空后才抓住失控代理――单个月度上限只能在会议层面抓住任何问题――不同失败模式需要不同时间度:

- **失控循环**(Agente 卡在 5 秒重试中): Por velocidade limitada capturar.
- **缓慢泄漏**(Agente Cada tarefa fez cerca de 2x 预期工作): Por dia, limite superior capturado.
- **糟糕发布**(nova versão usando 5x Token): 由每周 / 每月上限抓住──
- **合法激增**(Real necessidade, não bug):由小时 / 天上限抓住,并产生清晰日志。

### Área de orçamento do Código Claude

Claude Code Agente SDK 暴露了(公开文档):

- `max_turns` Capítulo de Iteração。
- `max_budget_usd` 美元上限;违约时会议 中止──
- `allowed_tools`- Não .`disallowed_tools` 工具 allowlist 和 denylist。
- 工具使用前的 hook points, para a auto-definição de custos de cálculo.

Com escada de modo de permissão (Lessão 10)`max_budget_usd`de `autoMode`A sessão é independente de administração.

### Lei da UE sobre IA ̊Agencias da OWASP Top 10

O conjunto de ferramentas de governança de agentes da Microsoft  abrangendo o OWASP Agentic Top 10 e a Lei da IA da UE Artigo 14  Supervisão humana  Requisitos  Para o ambiente de produção, registros e execução de limites da UE não são opcionais

### Observar$1,200 → $4.800 casos

O caso real no arquivo da Microsoft: um agente de comércio eletrônico, após a adição de novos instrumentos, o custo mensal duplicou-se. Este instrumento permite ao agente, em cada sessão, consultar o estado de pedidos. Não há um ciclo de verificação.


```figure
cost-governor-stack
```

## Use-o

`code/main.py`模拟一个有层次成本-governor stack 和没有该的代理 运行──模拟中的代理在几个轮后漂移进轮询循环; 模拟中的代理在几个轮后漂移进轮询循环; 模拟中的代理在几个轮后漂移进轮询循环; 模拟中的代理在几个轮后漂移进轮询循环; 模拟中的代理在几个轮后漂移进轮询循环; 模拟中的代理在几个轮后漂移进轮询循环; 模拟中的代理在几个轮后漂移进轮询循环; 模拟中的代理在速度窗口内抓住它,而单个月度上限在几天后才触发──

## Entrega-o

`outputs/skill-agent-budget-audit.md`审计一个拟议代理 部署的成本-governor stack,并标记缺失层──

## 练习

1. 运行 `code/main.py` Confirmar no ciclo de rotatividade, velocidade limitada antes do limite de iteração 触发── agora de uso limitado de velocidade, agente de medição 抓住它之前花了多少──

2. Como agente de navegador (Lessão 11) Design One Set Per Tool Up Limits. Quais ferramentas exigem limites mais rigorosos? Quais ferramentas podem funcionar sem limites sem riscos?

3. 阅读Microsoft Agent Governance Toolkit 文档――列出工具kit 命名的每种上限类型――把每种映射到某失败模式(失控循环、缓慢泄漏、糟糕发布、激增) 』

4. Por exemplo, triage 50 questões em um repo)`max_budget_usd`设为点估算的2x. 解释为什么是2x.

5. Claude Code `max_budget_usd`Baseado em sessão 聚合成本触发──design um que você vai executar externamente com a velocidade de complemento limitação──what will触发切断, reactivar é como?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Denial of Wallet | "Runaway bill" | agent 循环产生花费，并且没有上限阻止它 |
| max_tokens | "Per-request cap" | 单个 completion 大小的上限 |
| max_turns | "Iteration cap" | 一个 session 中 agent loop 迭代次数的上限 |
| max_budget_usd | "Dollar kill switch" | session 成本上限；违约时中止 |
| Velocity limit | "Rate cap" | 短窗口内花费的限制（例如，$50 / 10 min） |
| Tiered routing | "Small model first" | 默认使用便宜 model；只有 classifier 判断值得时才升级 |
| Prompt caching | "Cached system prompt" | provider 侧 cache 将重发 Token 成本降到接近零 |
| HITL checkpoint | "Human approval gate" | 昂贵操作前需要人工确认 |

## 延伸阅读

- [Anthropic Claude Code Agent SDK — agent loop and budgets](https://code.claude.com/docs/en/agent-sdk/agent-loop)- Não .`max_turns`- Não.`max_budget_usd`、 Autoridades de ferramentas
- [Microsoft Agent Framework — human-in-the-loop 与治理](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) governador de custos 检查点。
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) fornecedor 侧成本控制──
- [Anthropic — Prompt caching (Claude API docs)](https://platform.claude.com/docs/en/prompt-caching) mecanismo de armazenamento em cache:
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) custo-imagem de agentes de longo horizonte
