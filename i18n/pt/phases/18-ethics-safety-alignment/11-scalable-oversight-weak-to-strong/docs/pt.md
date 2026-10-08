# Supervisão Escalar e Generalização Fraca a Forte

> Burns et al. ((OpenAI Superalignment,Weak-to-Strong Generalization,2023) propôs uma submissão de superalignment  problem : usar etiquetas geradas por modelos fracos para ajustar um modelo forte.

**类型：**- aprendizagem
**语言：**Python(stdlib,W2SG simulador de lacunas)
**先修：**Fase 18 · 01(seguição de instruções)
**时间：**Cerca de 60 minutos

## Objectivo de aprendizagem

- 定義 skalável supervisão 和 weak-to-strong generalização,并解释它们如何互补──
- 描述 Burns et al. 2023 的实验设置:使用来自GPT-2 的标签来细调GPT-4──
- 解释 performance gap recovered (PGR) indicator e seu content de medida
- Há três principais mecanismos de supervisão escalável (debate, modelagem recorrente de recompensas, decomposição de tarefas) e uma das suas vantagens:

## 问题

Até agora, cada tipo de alinhamento na Fase 18 技术都假设监督者能够评估模型行为―― quando o modelo atinge um nível superhumano, o监督者就成了弱环节――superalignment 问题是: um supervisor mais fraco será capaz de produzir de forma confiável um modelo mais forte e alinhado?

Burns et al. reduziram este problema a uma configuração de experiência operacional: com o modelo fraco, monitorar o modelo forte, medir o número de modelos fortes que possam ser mantidos sob supervisão fraca. Não é uma solução de superalignamento, mas uma tarefa de agente para que possamos medir o progresso.

## 概念

### W2SG:Burns et al.

- 弱模型:GPT-2 级别──
- 强模型:GPT-4 级别──
- 目標:任务上强 GPT-4 o teto.

流程:
1. Obtenção de modelos fracos em uma missão de tiro zero 预测。
2. Em fechado em dados de etiquetas,
3. 衡微调强模型的准确率──

基线:弱模型自身的准确率、强模型在金标签 监督下的天限――

Gap indicator:Performance Gap Recovered (PGR) = (finamente ajustado - fraco) / (loft - fraco) ――PGR 为 表示弱监督完全弥合了差距;PGR 为 0 表示弱监督没有帮助──

### Experiência de Burns et al.

Em tarefas de PNL, esquisitos e modelos de recompensa, o PGR sempre está em funcionamento: o modelo forte generaliza-se para superar os erros de um supervisor fraco.

Burns et al. Indicações limitadas:
- O fraco-forte é o diferencial de capacidade, não o alinhamento. O modelo fraco é o alinhamento.
- A generalização do modelo forte pode ser mais do que da experiência de tarefa, em vez de recuperar a intenção de verdade fundamental.
- O conhecimento latente de um modelo de extrema força é apenas uma questão real; a medição de RPG é uma forma de operação específica.

### Supervisão em escala: 三种机制

- **Debate（Irving et al. 2018）。**Os dois exemplos de U são o debate de posição oposta; o juiz fraco faz um julgamento. Sua hipótese é: encontrar uma resposta verdadeira de persuasão é mais fácil do que encontrar uma falsa resposta de persuasão.
- **Recursive Reward Modeling（Leike et al. 2018）。**U 帮助人类训练 U+1 的奖励模型──监督者的有效能力随着模型能力增长──
- **Task Decomposition（Christiano, Shlegeris, Amodei 2018）。**O problema da tarefa é dividido em subtarefas que podem ser examinadas pelo ser humano.

Cada mecanismo faz uma espécie de hipótese de alinhamento da estrutura de tarefas ou dos componentes intermediários.

### Por que a supervisão escalável e o W2SG são complementares

Supervisão escalável  melhorar a qualidade de sinal eficaz do supervisor。
O W2SG 弥合监督者能够提供任何不完美信号所带来的差距──

Lang et al.  Debate Helps Weak-to-Strong Generalization ((arXiv:2501.13124) 将二者结合:debate 协议提供更好的弱标签,强模型在这些标签上训练──报告显示 NLP 任务上的 PGR 有所提升──

###  Mudanças no nível organizacional

O grupo de Superalinhamento de OpenAI foi lançado em Jan Leike em 2024 em 5 de maio de 2012 para a partir de um trabalho em Antropic 后解散──该议程(supervisão escaladora、W2SG、autoalignamento de pesquisa) em Antropic 和学术实验室 continuar a avançar, incluindo MATS(Lessão 28)、Redwood(Lessão 10)、Apollo(Lessão 8)、METR(Lessão 28)

### Está na fase 18 .

Lições 6-10 descrevem as ameaças e as defesas sob a premissa de uma U não-confiável. Lição 11 é a forma de ataque:


```figure
scalable-oversight
```

## Use-o

`code/main.py`Em uma missão de síntese em simulação de W2SG de sintonia fina. Em uma missão de sintonia, o modelo de sintonia de sintonia é de 95%.

## Entrega-o

本课会生成 `outputs/skill-w2sg-pgr.md`△ deu uma supervisão 设置描述,它会识别弱监督者、强模型、监督质量,并计算(或请求) PGR。它会标记该主张是弱可以监督强还是弱 + mecanismo de supervisão pode监督强──

## 练习

1. 运行 `code/main.py` Relatório de fraca precisão = 0,60、0,70、0,80 时的PGR──explicar a forma da curva PGR──

2. Modificar o marcador fraco, tornando-o com erros estruturais, por exemplo, em uma determinada classe de entrada, sempre é um erro.

3. 阅读 Burns et al. 2023 Seção 4.3 (Tascas de NLP)  Reaparição  Perda auxiliar de confiança  的直觉: quando um modelo forte é mais confiante do que um sinal fraco, quem vai vencer?

4. Para um software-engenharia 任务设计一个结合辩论和任务分解的可扩展式监督 协议―― dizer que cada componente é um modo de falha,并解释这种组合如何处理或无法处理这些失败模式――

5. Por exemplo, a teoria de que a generalização de fraca para forte é a viabilidade de superalinhamento é uma teoria de que o que você precisa ver é um sinal de experiência.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------|----------|
| Scalable oversight | “让监督者更强” | 提高监督者评估更强模型能力的机制 |
| W2SG | “弱监督强” | 在弱标签上 fine-tuning 强模型，并衡量恢复的能力 |
| PGR | “performance gap recovered” | (fine-tuned - weak) / (ceiling - weak)；1.0 = 完全弥合，0 = 无帮助 |
| Debate | “两个 U 实例辩论” | 一种 scalable oversight 机制，其中弱 judge 在两个 U defenders 之间做选择 |
| RRM | “recursive reward modeling” | U 帮助训练 U+1 的 reward model；监督者能力跟随 U |
| Task decomposition | “人类检查子任务” | 将困难任务递归拆解为人类可以验证的子任务 |
| Superalignment | “对齐超人类 AI” | 关注对齐人类无法直接评估的模型的研究议程 |

## 延伸阅读

- [Burns et al. — Weak-to-Strong Generalization (OpenAI 2023)](https://openai.com/index/weak-to-strong-generalization/) W2SG 论文
- [Irving, Christiano, Amodei — AI safety via debate (arXiv:1805.00899)](https://arxiv.org/abs/1805.00899) debate  mecanismo
- [Leike et al. — Scalable agent alignment via reward modeling (arXiv:1811.07871)](https://arxiv.org/abs/1811.07871) Modelagem recorrente de recompensas
- [Khan et al. — Debating with More Persuasive LLMs Leads to More Truthful Answers (arXiv:2402.06782)](https://arxiv.org/abs/2402.06782) Debate sobre os debatedores mais fortes de 2024  Experiência de estudo
- [Lang et al. — Debate Helps Weak-to-Strong Generalization (arXiv:2501.13124)](https://arxiv.org/abs/2501.13124) Debate de 2025 + W2SG
