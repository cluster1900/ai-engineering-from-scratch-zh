# Arquitetura Hierárquica  e seu Modo de Falha

> Hierárquica é o supervisor de um conjunto. Agentes gerentes estão em sub-gerentes.`Process.hierarchical`É um livro de texto.`manager_llm`动态委派任务并验证输出──LangGraph 中的等价形式是 `create_supervisor(create_supervisor(...))`Quando a tarefa em si é real, é um padrão natural. É também o padrão mais fácil de cair para o looping gerencial: agentes gerentes, distribuídos de trabalho mal, interpretam mal as sub-outputes, ou não conseguem chegar a um consenso.

**类型：**学习 + 构建
**语言：**Python (stdlib)
**前置要求：**Fase 16 · 05 (Patrão de supervisor)
**时间：**- 60 minutos.

## 问题

Uma vez que compreendemos o padrão de supervisor, o próximo passo da natureza é: se os trabalhadores são também supervisores, a equipe tem sub-grupos; a empresa tem setores, setores. Arquiteturas hierárquicas estão na estrutura de um espelho.

O problema é que os gerentes de LLM e os gerentes humanos são diferentes. O gerente humano sabe o que há de certo para os subordinados.

## 概念

### 形态

```
                 Manager
                 ┌─────┐
                 └──┬──┘
           ┌────────┴────────┐
           ▼                 ▼
       Sub-Mgr A         Sub-Mgr B
       ┌─────┐           ┌─────┐
       └──┬──┘           └──┬──┘
         ┌┴──┬──┐          ┌┴──┐
         ▼   ▼  ▼          ▼   ▼
       W1  W2  W3         W4  W5
```

Cada um dos seus elementos interno vai planejar, delegar e sintetizar.

### 适用场景

- **清晰的 org mapping。**Se real tarefa é de departamento, revisão legal do documento, revisão financeira do documento, revisão de engenharia do documento, então resumo para execução, hierarquia é claro.
- **Local summarization。**Cada sub-gerente vai ver o gerente superior antes de sintetizar o output do seu próprio grupo.

### 失效位置

2026 anos pós-mortem 持续发现三种故障模式:

1. **Task assignment error。**O gerente 读取目标,幻觉出一个分解,并委派给错误的副管理员――由于副管理员会顺从地处理收到的任务, o erro só aparecerá na síntese superior, a distância do ser humano pode ser encontrado já está separada de uma camada――
2. **Output misinterpretation。**Sub-gerente 返回不能验证索赔 X──Top manager 总结为索赔 X未确认──含义在每一层都会漂移──
3. **Consensus loops。** dois sub-gerentes 意见不一致; top manager 要求它们和解;它们向下重新委托;工人重新运行;sub-managers 返回略有不同的答案;循环开始──CrewAI 的 `Process.hierarchical`Usar limites de passos para evitar essa situação, mas esse limite se tornou um hiperparâmetro.

###   decisão

Sequencial (→ Linha de Pipeline) vs hierárquica: sua tarefa realmente tem sub-équipe independente, também é um processo linear de árvore? Se é o último, use sequencial. Se é o primeiro, use hierárquica, mas para regras de reconciliação claras.

### Realização da CrewAI

`Process.hierarchical`Gerente Gerente LLM 接在专业团队 之上──Gerente 会:

- 接收 tarefa de nível superior,
- Distribuir subtarefas para equipes,
-  avaliar as saídas da tripulação,
- Decidir aceitar, re-delegar ou iterar.

文档:https://docs.crewai.com/en/introduction（在Conceptos fundamentais 下查找 "Procés hierárquico")

### Realização de LangGraph

LangGraph usando um conjunto de`create_supervisor`Os chamadas são feitos por um supervisor interno, que tem seu próprio gráfico; o supervisor externo irá ver o gráfico interno como um nó opaco.

 referência:https://reference.langchain.com/python/langgraph-supervisor。


```figure
swarm-hierarchy-token
```

## Construí-lo

`code/main.py`运行一个3级层次等级:

- Gerente: vai desmantelar as tarefas em "engenharia" e "legal"
- Sub-gerente de engenharia: separar-se em trabalhadores "frontend" e "backend",
- Sub-gerente jurídico: um trabalhador.

Demo versus Happy Path (do que é que é que é que é que é)**perturbed path**A decomposição do gerente superior será "legal" 错标为"finance",然后观察错误级联:sub-gerente 顺从地执行财务 工作,top synthesizer 报告财务发现,原始法律问题 没有得到答应――

运行:

```
python3 code/main.py
```

输出会展示两条路径,并清晰并排对比what was asked和what was delivered──

## Use-o

`outputs/skill-hierarchy-fitness.md`评估给定任务应使用等级级,顺序,还是平面监督者――输入:task description、org structure、调整预算――输出:pattern recommendation,并包含需要防范的具体失败模式――

##  Publicá-lo

Se você publicar hierarquica:

- **将 tree depth 限制在 2。**Três camadas já estão escondidas da observabilidade.
- **明确 reconciliation budget。**O gerente de topo deve fazer o máximo de rodadas anteriores.
- **每次 synthesis 都要有 provenance。**O resumo de cada ponto deve citar para produzir as suas saídas de folha.
- **对 decomposition drift 告警。**记录 cada passo gerente de decomposição; fazer diferença com a consulta do usuário.

## 练习

1. 运行 `code/main.py`Não é mais feliz do que perturbado.
2. 添加第三层(top → sub → sub → worker) ―― com a profundidade 增长, medida perturbada caminho 多常会自我修正,以及多常会完全偏离──
3. Em cada sub-gerente 处实现一个"加拿大"工人,它始终收到未变的原始用户问题――使用加拿大答案 检测分解漂移――当加拿大答案与合成答案不一致时,管理员 应如何反应?
4. 阅读 CrewAI `Process.hierarchical`文档──识别 CrewAI 应用一个具体 guardrail(step limit、manager_llm constraint),并描述它针对的失败模式──
5. Comparar os supervisores de LangGraph em blocos com os hierárquicos da CrewAI. Qual dos outros pode ser mais barato em testar os circuitos de reconciliação?

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Hierarchical | "Org chart pattern" | supervisors 位于 supervisors 之上；只有叶子节点执行工作。 |
| Manager LLM | "The boss" | 在内部节点执行 decomposes、assigns 和 validates 的 LLM。 |
| Decomposition drift | "The boss lost the plot" | Top manager 的拆分不再覆盖原始问题。 |
| Reconciliation loop | "Endless meetings" | Sub-managers 意见不一致；top re-delegates；workers re-run；循环直到 budget 耗尽。 |
| Depth-2 ceiling | "Don't go deeper than 2 levels" | 经验性 guardrail：3+ 层会让 observability 坍塌。 |
| Canary question | "Ground truth at every level" | 一个始终收到未改动原始 query 的 worker，用于检测 drift。 |
| Provenance chain | "Who said what" | 从每次 synthesis 回溯到产生它的 leaf outputs 的 trace。 |

## 延伸阅读

- [CrewAI introduction — Process.hierarchical](https://docs.crewai.com/en/introduction) 带有经理 LLM 的教科书式等级
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor)  através `create_supervisor`实现嵌套 supervisor
- [Anthropic engineering — Research system](https://www.anthropic.com/engineering/multi-agent-research-system) Por que Antropic tem intenção de escolher um supervisor plano e não hierárquico
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) Taxonomia MAST; sobre falhas de coordenação capítulos registaram a deriva de decomposição
