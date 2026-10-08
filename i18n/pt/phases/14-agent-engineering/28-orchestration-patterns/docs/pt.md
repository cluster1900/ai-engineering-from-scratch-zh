# 编排模式:Supervisor, Swarm, Hierárquica

> Em 2026 aparecem quatro padrões de orquestração: supervisor-trabalhador, grupo de trabalhadores, grupo de pessoas, grupo de pessoas, debate e hierarquia.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**Fase 14 · 12 (Patrões de fluxo de trabalho), Fase 14 · 25 (Debate multi-agente)
**Time:** ~60 分钟

## Objectivo de aprendizagem
- Exercitar quatro tipos de orquestração repetidas, bem como cada tipo de cenário adequado.
- Descrição de 2026 anos de LangChain's recomendação: baseada na supervisão de ferramentas, e não em bibliotecas supervisoras.
- 解释 Antropic 的构建正确系统规则, bem como como como ela se refere à topologia 选择──
- Utilizando o STDlib, baseado em um scripted LLM                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

## 问题
Túmpuê sempre em necessidade real antes de usar multi-agente── quatro modelos aparecerão repetidamente em diferentes frameworks; uma vez que você pode dizer-los, é possível escolher a variedade correta, ou completamente saltar topologia──

## 概念
### Supervisor-trabalhador

- Um centro de envio de LLM, que entrega missões a agentes especializados.
-  a decisão inclui: voltar ao seu próprio ciclo  transferir para um especialista  terminar 
- Especialistas não se comunicam; todos os roteiros passaram por supervisor.

框架:LangGraph `create_supervisor`、Orquestração-trabalhadores antropóficos、CrewAI Processos Hierárquicos―

**2026 LangChain 建议：**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `create_supervisor` assim pode obter uma maior detalhe de engenharia de contexto  controle, você pode determinar exatamente cada especialista  ver o que

### Swarm / peer-to-peer

- Agentes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- Não há roteador central.
- 延迟低于监督 (tão pouco)
- Não há um único ponto de controle.

框架:LangGraph swarm topology、OpenAI Agents SDK handoffs(当所有代理都可以交付给所有其他代理时) ⋅

### - Hierarquias

- Supervisores 管理 sub-supervisores, sub-supervisores 再管理 trabalhadores。
- Em LangGraph, implementar para subgráficos aninhados; em CrewAI, implementar para tripulações aninhadas.
- O preço é mais elevado, mas a complexidade de operação é maior.

Qual é o contexto do orçamento de um só supervisor? Não pode aceitar a descrição de todos os especialistas?

### Debate

- E também os proponentes + 代 cruzada crítica (Lessão 25)
-  estritamente não é orquestração, mais como verificação, mas frequentemente aparece como uma topologia  escolha no quadro.

### CrewAI Crew vs Flow

A tripulação da AI formalizou dois modelos de implementação:

- **Flow**Utilizando a automação orientada por eventos de determinação (produzir ambiente)
- **Crew**Utilizando a colaboração baseada em papéis do autor.

Este está em relação com os quatro modelos acima, mas será mapeado para a topologia: Fluxo geralmente é supervisor ou hierárquico; Equipamento geralmente é com supervisor do roteador LLM.

### A orientação do Antropic

O sucesso no campo da LLM não depende da construção dos sistemas mais complexos, mas da construção dos sistemas certos para as suas necessidades.

决策顺序:

1. 单个代理 + workflow patterns (patrões de fluxo de trabalho) 课第12从这里开始──
2. Supervisor-trabalhador  Quando você tem 2-4  especialistas 时。
3. Swarm  Quando atraso é mais importante do que a definição de clareza.
4. O orçamento de supervisão é apenas um contexto de orçamento.
5. O debate é mais importante quando a taxa de precisão é superior ao custo.

### Este é um lugar fácil de sair

- **Topology-first thinking.**Antes de resolver o problema, dizemos que precisamos de um agente múltipla.
- **Bouncing handoffs in swarm.**A -> B -> A -> B。 Usar contadores de saltos。
- **Fake hierarchy.**Porque a empresa faz três níveis; na realidade, apenas duas equipes.


```figure
orchestration-pattern
```

## Construí-lo
`code/main.py`Utilizando o STDlib, baseado em escritura LLM  realçar todos os quatro modos:

- `Supervisor`Roteador central.
- `Swarm` 带直接 handoffs de peer-to-peer。
- `Hierarchical` supervisores de supervisores。
- `Debate` Não fazer propostas + crítica¬¬

Cada modo de processamento é igual a três tarefas de trabalho.

运行:

```
python3 code/main.py
```

输出: cada tipo de modelo de rastreamento + op contagem.

## Use-o
- **LangGraph**Utilizadas para supervisor e hierarquias (nesteadas)
- **OpenAI Agents SDK**Usado em forma de supervisor.
- **CrewAI Flow**Utilizadas para o ambiente de produção de determinação.
- **Custom**Para debater, ou quando quiser controlar.

## Entrega-o
`outputs/skill-orchestration-picker.md`选择一个topology并实现它──

## 练习
1. Por meio da remoção do roteador, transformar um supervisor-trabalhador em um enxame... o que vai estar errado? o que vai melhorar?
2. Dá ao enxame adicione o contador de salto 3 vezes de entrega depois de rejeitar. Pode capturar A->B->A de repetidas saltos?
3. Para um domínio de 12 especialistas construir um sistema hierárquico de dois níveis  sem nidificação , orçamento contextual 会在哪里失败?
4. Em relação à carga de trabalho de forma de produção, em que indicadores se consegue obter a latência, o custo, a precisão, a depurabilidade?
5. 阅读Antropic的 Building Effective Agents 文章──把你的每一个生产流流 映射到四种模式之一──有没有无法干净映射的吗?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Supervisor-worker | “Router + specialists” | 中心 LLM 分派给 specialists；它们彼此不通信 |
| Swarm | “Peer-to-peer” | 通过共享 tools 直接 handoffs；没有中心 router |
| Hierarchical | “Supervisors of supervisors” | 面向大规模群体的 nested subgraphs |
| Debate | “Proposer + critique” | 并行 proposers，cross-critique（Lesson 25） |
| Tool-call-based supervision | “Supervisor without a library” | 将 supervisor 实现为直接 tool calls，以控制 context |
| Crew | “Autonomous team” | CrewAI 的 role-based collaboration 模式 |
| Flow | “Deterministic workflow” | CrewAI 的 event-driven production 模式 |

## 延伸阅读
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 五种模式 + agente vs fluxo de trabalho
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) supervisor  grupo  hierarquica
- [CrewAI docs](https://docs.crewai.com/en/introduction) Tripulação vs Fluxo
- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) Padrão de debate
