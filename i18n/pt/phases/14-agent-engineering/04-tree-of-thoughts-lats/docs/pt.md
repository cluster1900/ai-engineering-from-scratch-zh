# Árvore dos Pensamentos e LATS: Pesquisa deliberada

> 单条 chain-of-thought trajectory 没有回溯空间──ToT(Yao et al., 2023) vai o raciocínio transformar-se em uma árvore, e em cada nó para realizar auto-avaliação──LATS(Zhou et al., 2024)

**类型：**Construir
**语言：**Python (stdlib)
**先修：**Fase 14 · 01 (Loop de Agentes), Fase 14 · 03 (Reflexão)
**时间：**- 75 minutos.

## Objectivo de aprendizagem

- O raciocínio expresso para busca: nó é pensamento, limite é expansão, valor é esperança.
- 实现一个stdlib ToT-style BFS tree search,并用自我评估评分──
- 扩展为一个玩具 LATS MCTS loop,包含选择/扩展/模拟/反扩散──
- 判断什么时候搜索 值得 Token 倍增成本(Game of 24、code generation),什么时候单条轨迹就足够(简单 Q&A) 』

## 问题

A cadeia de pensamento é um caminho linear. Se o primeiro passo estiver errado, cada passo posterior será construído sobre um pressuposto errado.

O raciocínio necessita é apresentar vários candidatos, avaliá-los, escolher candidatos com esperança e ter a capacidade de se encontrar em um beco sem saída 时回溯── é a busca──Tre dos Pensamentos 和 LATS são duas formulações canônicas──

## 概念

### Árvore dos Pensamentos (Yao et al., NeurIPS 2023)

Cada nó é um passo intermediário que se segue. Cada nó pode ser expandido para um pensamento infantil.

```
                     (root: "find 24 from 4 6 4 1")
                    /               |            \
           ("6 - 4 = 2")    ("4 + 1 = 5")    ("4 * 6 = 24")  <- Score: HIGH
              /   \              |                  |
          ...    ...          ...                finish
```

A autoavaliação é parte da sua pesquisa.`sure / likely / impossible`classificação,`1..10`A pontuação numérica, bem como a votação entre os candidatos, é muito melhor do que a CoT (GPT-4) de 4% a 74%.

### LATS (Zhou et al., ICML 2024)

LATS em MCTS, reúne-se a TOT, ReAct e Reflexion, e LLM desempenha três papéis:

- **Policy**■ apresentar candidaturas para a próxima acção (react-style)
- **Value function**:为 parcial trajetória 打分(T-style auto-evaluado)
- **Self-reflector**O que é um "desenvolvimento de uma nova geração de pessoas" é um "desenvolvimento de uma nova geração de pessoas".

Feedback ambiental (observação) irá interferir na função de valor, portanto, a pesquisa irá ser feita através de ferramentas reais para fornecer informações, e não apenas uma opinião sobre modelos.

### MCTS, forma mínima

Cada iteração tem quatro etapas:

1. **Select** Utilize UCT ((confiança superior ligada às árvores) da raiz 走到叶──
2. **Expand**   através da política 生成 K 个孩子──
3. **Simulate** Utilize policy From child rollout to leaf,并用 value function (ou recompensa ambiental) 打分──
4. **Backpropagate** 沿路径向上更新 visitas e estimativa de valor

Formulha de TCC:`Q(s, a) + c * sqrt(ln N(s) / N(s, a))`O primeiro é exploração, o segundo exploração.`c`- Não.

### 成本现实

O jogo de 24 horas acima do jogo de 24 horas acima do jogo de 24 horas acima do jogo de 24 horas acima do jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de 24 horas após o jogo de jogo de 24 horas após o jogo de 24 horas após o jogo de jogo de jogo de 1 horas após o jogo de jogo de 1 horas após o jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo de jogo

- 单条轨迹被证明不足的任务 (Jogo de 24 复杂 código)
- O relógio de parede não é correto. É uma tarefa importante.
- Há conveniente e confiável função de valor tarefa ((code unit test ≠ mathematic explicit target) ⋅

Se a sua tarefa tiver uma única resposta correta e um avaliador com ruído, a pesquisa geralmente vai piorar as coisas, porque ela vai encontrar respostas erradas de pontuação alta.

### 2026 定位

A maioria dos agentes de produção não opera em LATS.

- Testar 作为值函数的编码代理 (HumanEval-style)
- 探索多条 procura de um agente de pesquisa profunda.
- Subgrafo de LangGraph 内部 planeamento-fluxo de trabalho pesado。

AlphaEvolve (Lessão 11) é o exemplo final do ano de 2025: fazer uma pesquisa evolutiva em código, fazer uma pesquisa de condicionamento controlado por máquina, ganhar mais fronteiras, por primeira vez em 56 anos.


```figure
tree-of-thoughts
```

## Construí-lo

`code/main.py`实现:

- Uma tarefa aritmética de seleção estátilizada, que funciona em pequenos ToT BFS.
- Uma tarefa em jogo é a seguinte:
- Uma combinação de pontuação simbólica e função de valor de pontuação auto-evaluação.

- Não .

```
python3 code/main.py
```

trace 会显示 ToT Used BFS Cada nó expandir Três candidatos,并与LATS 通过 MCTS 收到最佳推广 进行对比──双人的代号数 都会印出来──

## Use-o

LangGraph vai explorar em estilo ToT  como padrão de subgrafo 提供;LangChain team 关于 LATS 的博客(2024 年 5 月) 是参考教程──LlamaIndex 提供 `TreeOfThoughts`Em 2026 a maioria dos agentes de produção`if task_complexity > threshold: use_search()`Portais 后面见 05 中 中的评价者-优化器模式──

## Entrega-o

`outputs/skill-search-policy.md`De acordo com a forma da tarefa, orçamento e fidelidade do avaliador, é possível fazer uma escolha entre ReAct linear, TOT, LATS e pesquisa evolutiva.

## 练习

1. Utilizando UCT c=0.1 e c=2.0 运行玩具LATS──trace Que mudança aconteceu?
2. Vai mudar a função de valor para um marcador de ruído maior.
3. 实现 beam-search ToT( cada nível de retenção superior-k)并 em relação ao BFS.
4. 阅读 LATS Seção 5.1──复现 HumanEval trajectory count: Necessite quanto lançamento 才能达到报告的pass@1?
5. 阅读LATS paper 中关于当LATS ajuda menos的讨论──写一段决策规则,将任务形状映射到搜索策略──

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Tree of Thoughts | “Branching CoT” | Yao et al. — 带有 self-evaluation 的 thought node 树 |
| LATS | “MCTS for LLMs” | Zhou et al. — 在 MCTS 下统一 ToT + ReAct + Reflexion |
| UCT | “Upper confidence bound” | 在 exploitation (Q) 和 exploration (ln N / n) 之间平衡的 select formula |
| Value function | “这个 state 有多好” | Prompted LLM score 或 environment reward；反馈给 backprop |
| Policy | “Action proposer” | ReAct-style generator；发出候选 next thought/action |
| Rollout | “Simulated trajectory” | 使用 policy 从 node 走到 leaf，并用 value 打分 |
| Backpropagate | “更新 ancestors” | 将 leaf 的 reward 沿路径向上推，更新 visit count 和 Q |
| Search cost | “Token explosion” | Game of 24 上是 CoT 的 100-1000 倍；采用前先做 budget |

## 延伸阅读

- [Yao et al., Tree of Thoughts (arXiv:2305.10601)](https://arxiv.org/abs/2305.10601) 经典论文
- [Zhou et al., LATS (arXiv:2310.04406)](https://arxiv.org/abs/2310.04406) 带有反思反的 MCTS
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) Usado para o padrão de subgráfico de pesquisa
- [AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) 带 programmatic evaluator  带 programmatic evaluator  带 programmatic evaluator  带 programmatic evaluator  带 programmatic evaluator  带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 带 programmatic evaluator 带 带 带 programmatic evaluator 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 
