# Agentes geradores

> Park et al. 2023 (UIST '23, arXiv:2304.03442) Use三部分架构填充了 **Smallville**, um contém 25 agentes de caixa de areia:**memory stream**(自然言語日志)**reflection**(Agente baseado em seu próprio fluxo de produção de mais alto nível)**plan**(日级行为,然后是子计划) ―― o resultado da festa foi a surgência de um agente implantado que quer organizar uma festa de São Valentino, sem mais script, já surgiu um convite de divulgação em grupos  समन्वय日期, e finalmente organizou um fest de 24 pessoas que começaram a não saber sobre este agente.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**Fase 16 · 04 (Modelo primitivo), Fase 16 · 13 (Memória compartilhada)
**Time:** ~75 minutes

## 问题

A maioria dos sistemas multi-agentes são um grupo de escrituração rigorosa: planejador, codificador, revisor, revisor, revisor. Isso é aplicado a definir tarefas claras. Não pode ser capturado como um agente, tendo memória, prioridade e comportamento não-escritorial, gerado no mundo aberto.

Smallville 架构就是它的基准. Até Park 2023, o melhor agente 模拟是浅层脚本跟随者; depois disso, esse modelo se tornou a estrutura padrão de Agentes Generativos em todo o mundo. Se você construir um agente 模拟 em 2026, ou usar os três componentes de Smallville, ou precisar de explicar claramente por que não é usado.

## 概念

### Três componentes

**Memory stream。**Uma observação, movimento, reflexão e plano adicionais para cada item tem tempo, tipo e descrição.**recency**- Não.**importance**(agente 自评 1-10)**relevance**(Com a semelhança do resto da pesquisa actual)

```
[2026-02-14 09:12:03] observation: Isabella Rodriguez asked me if I like jazz
[2026-02-14 09:14:22] reflection:   I enjoy long conversations about music
[2026-02-14 10:05:00] plan:         Attend Isabella's Valentine's Day party tonight
```

Recuperação de memória 组合三个分数:`score = w_recency * e^(-decay * age) + w_importance * importance + w_relevance * cos_sim`✿ Top-k 条目 entrar em contato imediato✿

**Reflection。**周期性地(每 N 条记忆或发生重要事件时),agente De memória recente 生成更高阶综合──Reflexão 条目会回流,并像其他记忆 一样可检查──这是agente 构建理解的方式,也就是该架构中长期信念等价──

**Plan。**O plano pode ser modificado: quando observado com o plano, o agente irá reorganizar os episódios de impacto.

### Por que são três coisas importantes?

Park et al. fez uma separação de observação, reflexão e ablações de plano.

- Não há nada .**observation**,Agente 会错过上下文,并基于过去的信念行动――
- Não há nada .**reflection**,agente não pode formar crenças de classe superior; a comunicação fica no nível inferior.
- Não há nada .**plan**, o comportamento se transforma em um ruído reactivo; o objetivo se dissipa.

O índice de credibilidade dado pelo avaliador humano é o mais alto dos três componentes; eliminando qualquer uma das cidades, produz-se uma degradação de quantidade mensurável.

### Dia dos Namorados

Uma agente, Isabella Rodriguez, foi implantada como objetivo para organizar uma festa de Fête des Enfantes no Hobbs Café em 14 de fevereiro às 17h. Outros 24 agentes não receberam sementes assim.

1. O plano de Isabella inclui convidar os outros.
2. Cada vez que eu invito você a ser um observador no fluxo de memória do vizinho.
3. A reflexão do vizinho cria a convicção de que Isabella está a dar uma festa.
4. O plano do vizinho é participar da festa em 14 de fevereiro.
5. O vizinho diz ao outro vizinho.
6. 2 月 14 日下午 5 点, vários agentes  reunir-se no Hobbs Cafe.

É um fenómeno tecnológico: um comportamento de nível sistémico (un派对) proveniente de um ambiente de comunicação (unité local) e sem um orquestrador central (unité central).

### 文档记录的失败模式

Park et al. 明确记录了:

- **空间规范错误。**Agente 走进已关闭的商店──Agente 尝试使用同一个人卫生间──Agente 在不适用餐室里吃饭──Modelo não pode apenas inferir de ambiente as normas sociais-físicas──
- **Memory overflow。**A profundidade do modelo de operação conduz à recuperação de memória.
- **Reflection hallucination。**Refleção 可能编造记忆流 中不存在关系──缓解方式: em um prompt de reflexão, contém ids de memória de origem e em recuperação 时验证──

Estes são os modelos de falha relacionados à produção: qualquer agente de 2026 模拟都将继承它们.

### 3 componentes implementação de regras

1. **Memory 是 append-only。**Nunca alterar a memória.
2. **Importance 分数要便宜。**写入时调用 LLM 评估 1-10 的重要性──缓存该分数──
3. **Retrieval 是排序，不是过滤。**按组合分数取 Top-k; não use hardware (tão difícil de usar)
4. **Reflection 周期性运行。**Quando não processada memória importância 总和超过值时触发(por exemplo 150)。
5. **Plans 可以修订。**Quando uma nova observação contradiz o plano, apenas se reproduzem os fragmentos afetados, e não todo o plano.

### Agentes Generativos fora de Smallville

A literatura posterior para 2024-2026 amplia a estrutura:

- **用于政策 / 市场研究的 multi-agent 社会模拟。**类 Smallville 群体模拟用户对功能的行为响应──比A/B testes 更快; 准确性仍存在争议──
- **游戏中的 NPC AI。**Com um agente de Smallville, o RPG vai gerar uma história em linha, e não uma missão de roteiro.
- **Generative-agent 评估基准。**O indicador não é mais a precisão da tarefa, mas a credibilidade no funcionamento de longo prazo + a coerência de comportamento.

A estrutura é um padrão de referência. A estrutura é usada para armazenar vectores de memória, retomar reflexões aumentadas e planos neurosimbólicos, mas mantém três partes.

### Por que é importante para a engenharia multi-agente

Smallville é uma prova de conceito: quando o componente é correto, a multiplotação pode ser muito conveniente.**emergent social behavior**Todos os sistemas de produção usam essa forma.**tight task execution**模式── 模式── 模式── 模式── 模式── 模式── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 模式── 模式── 模式── 模式── 模式── 模式── 模式── 模式── 模式── 模式── 模式── 模式── 模式── 模式── 模式── 模式── 模式── 模式── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统── 系统


```figure
a5-memory-reflection
```

## Construí-lo

`code/main.py`Utilizando as políticas de Python e de escritura de agentes (no real LLM) implementar três componentes.

- `MemoryStream` 带 recency/importance/relevance retrieval  apêndice apenas 日志。
- `reflect(stream)` Refleção sobre a memória de alta importância recente.
- `plan(agent_state)` Baseado em planos de nível e de hora de convicções atuais.
- O agente 1 é o primeiro a lançar uma festa às 17h.

运行:

```
python3 code/main.py
```

预期输出: cada tick trace. Até a última tick. 5 agentes, pelo menos 3 aparecem no plano, e eles se reúnem no local do partido.

## Use-o

`outputs/skill-simulation-designer.md`design a simulação de agente gerador:agente, números, esquemas de memória, cadência de reflexão, horizonte de plano e métricas de avaliação

##  Publicá-lo

Regras de produção:

- **Memory 就是数据库。**Em escalação, selecione o armazenamento real.
- **记录 retrieval trace。**Para cada ação, o registro impulsiona as suas memórias mais altas.
- **为每个 agent 预算 tokens。**Cada um deles. Cada um deles. Cada um deles.
- **周期性 compact memory。**Resumo-e-prima  baixas importância 条目。 Política de retenção é decisão de design, não é detalhes。
- **显式检测空间 / 社会规范违规。**A construção não vai aprender a fazê-los.

## 练习

1. 运行 `code/main.py`Confirmar 3+ agentes  reunir para o partido                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
2. 移除反思步骤──行为会是什么样样?映射到Park 2023 中的放弃 发现──
3. Klaus quer dar uma palestra de pesquisa às 17h) Agent 会分流, também é um objetivo que ocupa a liderança?
4. O Hobbs Cafe, que tem capacidade para 4 agentes, vai ser um bom tratamento para o desbordamento ou um bom banheiro para uma pessoa?
5. 阅读 Park et al. (arXiv:2304.03442) Seção 6 ((experimentos de comportamento emergentes)  encontrar um seu micro tipo de versão não pode ser recuperado  Você precisa aumentar qual componente da estrutura?

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Memory stream | “agent 的日记” | 观察、动作、reflection、plan 的 append-only 日志。 |
| Recency | “这条 memory 有多新” | 按年龄计算的指数衰减分数。 |
| Importance | “agent 有多在意” | 写入时自评 1-10。已缓存。 |
| Relevance | “与当前查询有多相关” | 余弦相似度（Embedding-based）。 |
| Reflection | “更高阶信念” | 从最近 memories 生成的综合，并作为新 memory 重新摄入。 |
| Plan | “日/小时/动作分解” | 自顶向下的 plan tree。当 observation 矛盾时可修订。 |
| Smallville | “Park 2023 的 sandbox” | 产生 Valentine's Day 涌现的 25-agent 模拟。 |
| Believability | “质量指标” | 人类评分者对行为是否像一个可信 agent 的评分。 |

## 延伸阅读

- [Park et al. — Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442) 参考架构
- [UIST '23 paper page](https://dl.acm.org/doi/10.1145/3586183.3606763) 发表场所
- [Smallville code release](https://github.com/joonspk-research/generative_agents) 参考 Python 实现
- [Hayes-Roth 1985 — A Blackboard Architecture for Control](https://www.sciencedirect.com/science/article/abs/pii/0004370285900639) 结构化记忆代理的前序工作
