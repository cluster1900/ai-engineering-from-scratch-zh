# Utilize HTN e Evolutionary Search  planejar

> Planejamento simbólico  Plano de tratamento 可证明正确的场景──Evolutionary code search 处理健身功能 可由机器检查的场景──ChatHTN (2025) 和 AlphaEvolve (2025) 展示了二者与LLM 结合后分别能解锁什么能力──

**类型:**Construção
**语言:**Python (stdlib)
**先修要求:**Fase 14 · 02 (ReWOO e planeamento e execução)
**时间:**- 75 minutos.

## Objectivo de aprendizagem

- 解释 Hierárquias de tarefas: tarefas, métodos, operadores, pré-condições, efeitos.
- 描述 ChatHTN's hybrid loop  busca simbólica加 LLM fallback decomposição。
- Explicar o ciclo evolutivo do AlphaEvolve, bem como por que ele só é adequado para o avaliador programático.
- Utilize stdlib  implementar um brinquedo HTN Planner 和一个 brinquedo evolução de busca。

## 问题

ReWOO (Lessão 02)、Plan-and-Execute 和 ReAct 覆盖了大多数agent planning──它们不太擅长覆盖两个场景:

1. **可证明正确的 plans。**Planejamento, itinerário de voo, fluxos de trabalho de conformidade, plano, deve estar na construção, é sólido, mas ocasionalmente alucinante, o plano de Mestrado em Pós-Graduação é inaceitável.
2. **带有机器可检查 fitness function 的优化。**Multiplicação de matriz, heurística de programação, passagens de compilador  目標不是一个正确的计划,而是最好的计划──

O planejamento HTN e AlphaEvolve resolvem dois problemas diferentes.

## 概念

### Redes de tarefas hierárquicas

HTN incluem:

- **Tasks** composto (→ espera decomposto) e primitivo (→ execução directa)
- **Methods** Ter tarefas compostas divididas em subtarefas, com condições prévias.
- **Operators** 带有前条件和效果的原始行动──
- **State** 一组事实──

Planejamento: dar uma tarefa de meta e estado inicial, encontrar uma desintegração, tornando-a condição prévia 按顺序满足的原始运算者──

HTN já apareceu no LLM e ainda é um método de referência para provar planos verdadeiros.

### ChatHTN (Gopalakrishnan et al., 2025)

ChatHTN (arXiv:2505.11814) vai simbolizar HTN com LLM consultas 交错执行:

1. 尝试使用现有方法 分解当前复合任务──
2. Se não houver um método, consulte o Mestrado em Direito e Direito.`s`Como é que vais desintegrar?`task`- Não .
3. A resposta do LLM será transformada em subtarefas candidatas.
4. 根据运营商方案做验证; rejeitar descomposições ineféticas.
5. - Não.

论文的核心主张:生成的每一个计划都可证明声音,因为 LLM sugestiões só como candidato descomposições 进入,永远不会直接编辑计划──Simbólico camada 负责正确性;LLM 扩展方法库──

Aprendizagem de métodos on-line OpenReview `gwYEDY9j2x`,2025 acompanhamento) se juntar a um aluno, através de regressão 泛化 LLM 生成的分解  最多可减少 75%  LLM query 频率──

### AlphaEvolve (Novikov et al., 2025)

AlphaEvolve (arXiv:2506.13131, DeepMind, junho 2025) é outro tipo de coisa: germin 2.0 Flash/Pro conjunto 编排的进化代码搜索──

Loop:

1. Desde o programa de sementes + avaliador programático 开始(返回健身分)。
2. Ensemble LLM  propôs mutações¬
3. Vai dar mutações ao avaliador.
4. Mantém o melhor; continua a mudar-se.

已发表成果:

- 56 anos para a primeira vez, a 4x4 complex matriz de Strassen foi modificada 48 vezes por multiplicações escalares.
-  através de programação heurística Borg  recuperar 0,7% do computação do Google
- Na carga de trabalho de fronteira, alcançar 32% de FlashAttention speedup.

硬性约束:função de aptidão 必須可由机器检查── para respostas em prosa fazer uma busca evolutiva 不会收──

### Qual é o tempo de usar?

| 问题类别 | 使用 | 原因 |
|---------------|-----|-----|
| 带硬约束的 Scheduling | HTN + ChatHTN | 可证明的 soundness |
| Compiler optimization | AlphaEvolve | 机器可检查的 fitness |
| Multi-step task execution | ReAct / ReWOO | LLM in the loop，没有 formal guarantees |
| 带 tests 的 Code improvement | AlphaEvolve | Tests 就是 evaluator |
| Policy-bound automation | HTN | Preconditions 编码 policy |

### Este modo é fácil de errar.

- **没有 operators 的 HTN。**没有前条件/效果方案,健全性 主张就会崩塌──ChatHTN 的LLM sugere decomposição要求 schema 能拒绝无效运动──
- **没有真实 evaluator 的 AlphaEvolve。**question LLM 代码 否更好不是健身功能──Evaluator 必须确定性且快──
- **过度工程化。**A maioria das tarefas de agente não precisa de ambos.


```figure
htn-tree-expand
```

## Construí-lo

`code/main.py`Realizaram dois exemplos de brinquedos:

- Um planejador de HTN deficiente, contendo operadores, métodos, pré-condições, efeitos, bem como quando não há método para combinar tarefas compostas 时触发 `LLMFallback`O LLM é um descompostor de script, portanto, o planejador pode operar.
- Uma busca evolutiva de programas aritméticos para o estudo: aumentar as expressões, fazer seu output em um conjunto de testes 上最小化 `|f(x) - target|`O avaliador é determinista.

运行:

```
python3 code/main.py
```

Trace 会展示 HTN planner 分解一个复合任务 (中途带一次LLM fallback), bem como o ciclo evolutivo 收到一个目标表达──

## Use-o

- **HTN planners**- Não .`pyhop`- Não.`SHOP3`, ou para a aplicação de políticas específicas de domínio construir o seu próprio 
- **ChatHTN** código de pesquisa; esse modelo ((simbólico + LLM fallback)) pode ser transferido para qualquer planejador HTN。
- **AlphaEvolve** DeepMind paper; esse modelo(ensemble + evaluator)可复现──OpenEvolve 和类似开源叉 正在出现──
- **Agent frameworks** Atualmente ainda não há HTN de primeira classe ou AlphaEvolve.

## Entrega-o

`outputs/skill-hybrid-planner.md`生成一个混合规划器架架 (HTN ou evolução),并明确限定 LLM papel.

## 练习

1. Utilizando retrocessão  Extender HTN Planner: Quando um operador está em post-condição em tempo de execução  fracassado, volte a rolar e tente o seguinte método。
2. 给 ChatHTN 添加 LLM-método cache:当 LLM 在状态模式 `P`- Descomposição`T`时,存储结果──下一次调用时先重新检查方法库──
3. Evolver uma função de classificação de 20 casos de teste; report收 需要世代──
4. 阅读 AlphaEvolve's evaluator design notes──为你关心的域名 设计一个评价器(SQL query optimization、test-suite minimization、deployment YAML)──
5. 组合使用: utilizar HTN para dividir tarefas compostas em subtarefas, e então, em cada subtarefa, utilizar o operador primitivo para a busca evolutiva.

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| HTN | “Hierarchical planner” | 带有 operators、preconditions、effects 的 task decomposition |
| Method | “Decomposition rule” | 将 compound task 拆分为 subtasks 的方式 |
| Operator | “Primitive action” | 带有 precondition 和 effect 的具体步骤 |
| ChatHTN | “LLM + HTN” | 当没有 method 匹配时，symbolic planner 询问 LLM |
| AlphaEvolve | “Evolutionary code search” | Ensemble LLMs mutate code；deterministic evaluator 负责选择 |
| Fitness function | “Evaluator” | 针对 outputs 的 deterministic、机器可检查 score |
| Online method learning | “Cached LLM decomposition” | 存储并泛化 LLM plans，以降低 query cost |

## 延伸阅读

- [Gopalakrishnan et al., ChatHTN (arXiv:2505.11814)](https://arxiv.org/abs/2505.11814) simbólico + LLM 混合 planner
- [Novikov et al., AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) 带 LLM mutações de busca de código evolutivo
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 何時選擇 planejador,何時選擇 simples ciclo
