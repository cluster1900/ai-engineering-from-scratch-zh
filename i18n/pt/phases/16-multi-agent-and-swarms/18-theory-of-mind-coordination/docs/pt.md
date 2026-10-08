# Teoria da Mente e coordenação de emergências

> Li et al. (arXiv:2310.10701) 表明,合作型文本游戏中的 LLM agentes 会表现出**涌现式高阶 Theory of Mind**(ToM)                                                                                                                                                                                                                                                             **只有**A coordenação de emergência depende da coordenação de condições e modelos, não é gratuita. O programa permite a realização de um agente mínimo de consciência de TOM, executando uma tarefa de cooperação em caso de necessidade de TOM, e de acordo com o protocolo Riedl 2025.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**Fase 16 · 07 (Sociedade da Mente e Debate), Fase 16 · 17 (Agentes Gerenativos)
**Time:** ~75 minutes

## 问题

Multi-agente  coordenação frequentemente parece muito estranho: agentes 分工、预判彼此、避免重复── normalmente esta surgência  é um produto de engenharia rápida  Alguém diz aos agentes que precisam  coordenar── remover  prompt, coordenação também desaparece──

O Rio 2025 é mais rigoroso: sob condições de controlo, apenas quando os agentes são convidados a fazerem uma avaliação.**其他 agents 的 minds**(ToM) 时, coordenação才会涌现. 没有ToM prompt, mesmo que um modelo forte também se apresente incapaz de passar por um modelo de coordenação controlado estatística.

Este curso considera o TOM como uma capacidade específica de pensar sobre crenças, construir um agente mínimo de TOM, e medir a diferença entre coordenação real e o rápido

## 概念

### O que é que é ?

发展心理学:3 岁儿童认为任何人的内在世界都和自己一致──5 岁儿童理解他人有不同信仰──7 岁儿童会推论关于信仰的信念──她认为我认为球在杯子下面)──这些分别是零阶段,一阶段和二阶段 ToM──

Para os agentes de LLM, o número de fases de resposta é:

- **Zeroth-order:**Não há modelos de outros. Agente só baseado em suas próprias observações.
- **First-order:**Agente  иметь cada outro agente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
- **Second-order:**A Alice acredita que o Bob acredita em X.

Li et al. 2023                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

### Teste Sally-Anne 简述

Um teste de falsa crença de 1985: Sally colocou uma bola de ouro na cesta A, e depois saiu.

Os LLM da GPT-4 podem ser aprovados em testes de estilo Sally-Anne, apresentados diretamente. Quando as histórias são longas, as cenárias mudam muitas vezes, ou os problemas são expressos de forma indireta, eles falham.

### Riedl's coordenação

Riedl (arXiv:2510.05174) 构建一个群体规模测试:N 个代理,一个合作目标,可变快速条件――测量:

1. **Identity-linked differentiation.**Os agentes são ou não, a partir do tempo, formando uma divisão de papel estável?
2. **Goal-directed complementarity.**A acção dos agentes é complementar, não repetida?
3. **Higher-order synergy.**Uma medida estatística, usada para determinar se um grupo alcançou resultados que qualquer subconjunto não pode alcançar.

Resultado: somente em condições de ToM prompt, três indicadores apenas produzem sinais superiores à linha de base. Sem ToM prompt, o indicador do modelo de capacidade média se aproxima de uma altura.

### 协调幻觉

 não há controlo estatístico, a coordenação emergente entre os demos geralmente reflete:

- Engenharia rápida 把协调内置进去(sistema pede 写着work together)。
- 观察者偏差 (Os observadores se desviam de um outro lado)
- O que é que aconteceu?

Se o sistema de produção divulgar uma coordenação emergente em caso de falta de sinal de detecção, deve ser considerado como uma comercialização.

### Um agente consciente do mínimo.

结构:

```
agent state:
  own_beliefs:    {facts the agent believes}
  other_models:   {other_agent_id -> {beliefs_the_agent_attributes_to_them}}
  actions_last_N: [history of others' actions]

observation update:
  - update own_beliefs from direct observation
  - update other_models[agent_id] from their action + prior beliefs

action selection:
  - enumerate candidate actions
  - for each, predict what each other agent will do next given their modeled beliefs
  - pick action that maximizes joint outcome under those predictions
```

`other_models`属性就是 ToM state──一阶 ToM 只有保留一层──二阶加入 `other_models[i][other_models_of_j]`Acho que o agente acredita em algo.

### Por que o longo horizonte vai sofrer

Li et al.  registraram: limites de contexto levarão os agentes  esquecer quais crenças pertencem a quem.  A alucinação irá colocar crenças falsas em outros modelos de agentes.

论文和 2024-2026 后续研究中记录的缓解方式:

- **在 prompt 中显式写出 ToM state.**结构化格式:`{agent_id: belief_list}`❖ Retorno forçado ❖
- **更短的 reasoning chains.**Cada vez menos atualizações de ToM podem reduzir as alucinações.
- **外部 ToM store.**Em contexto de LLM, cada ciclo é apenas inserido em partes relacionadas.

### A produção não vai ser bem sucedida .

- **Adversarial settings.**Tem bons agentes de TOM mais fáceis de manipular
- **Heterogeneous teams.**Quando o modelo é diferente, o modelo ToM de um oponente é aplicado não se generaliza.
- **Ground-truth-dependent tasks.**Para Consentir a crença; se a correção depender do fato, Consais distrair a atenção

### Sua coordenação de medida de energia

判断团队协调是真实的,而不是快速修改的三个实用信号:

1. **Complementarity over time.**Em tarefas de várias rotas, as ações dos agentes cobrem sub-tarefas não superpuestas?
2. **Anticipation.**A acção do agente A em turno T+1 depende da previsão da acção de B em T+2, e a previsão foi provada posteriormente como verdadeira?
3. **Correction.**Quando A está em turno T                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

Estes podem ser medidos em um sistema multi-agente de carros de dados.


```figure
sw-theory-of-mind
```

## Construí-lo

`code/main.py`实现:

- `ToMAgent` Seguir as suas próprias crenças e o modelo de crenças de cada outro agente.
- Uma tarefa de cooperação: três agentes devem coletar três Tokens de três caixas; cada caixa só pode acomodar um Token.
- 两种配置:`zeroth_order`(sem TOM)`first_order`(Tenho uma camada de modelo de crença)
- Em 200 vezes random trial 上测量: completion rate、重复 rate ((dois agentes 目标为同一盒) 、平均完成轮数──

运行:

```
python3 code/main.py
```

预期输出:agentes de ordem zero vão repetir esforços em cerca de 35% e completar cerca de 60% dos ensaios em 10 voltas.

## Use-o

`outputs/skill-tom-auditor.md`É uma habilidade utilizada para a auditoria de sistemas multi-agentes para a declaração de coordenação emergente.

##  Publicá-lo

协调声明 lista de verificação:

- **Control condition.**Seu sistema elimina coordenação de prompt 后版本──两者都测量──
- **Statistical test.**Em seu indicador, a diferença entre o sistema e o controle está em`p < 0.05`É evidente?
- **Complementarity measure.** Com o tempo, as ações não se sobrepõem, não apenas o sucesso final
- **Failure-case log.**Quando os agentes coordenam a falha, o que é que acontece no estado?
- **Model-capacity disclosure.**Se o efeito desaparecer no modelo menor, é claro que o

## 练习

1. 运行 `code/main.py`Confirmar que a taxa de repetição de um estágio de TOM vai diminuir cerca de 7 vezes. Quando se expandir para 5 agentes e 5 caixas, esta diferença ainda existe?
2. 实现二阶 ToM(agente A 建模 B 如何看待 C) ・・・ é melhor do que um estágio?
3. Para o estado de entrada uma vez **hallucination**A cada rodada, a cada vez mais, a convicção é transformada.
4. 阅读 Li et al. (arXiv:2310.10701)。复现长视线降低发现:当轮数从10 增加到30 时,你的一阶 ToM 性能如何变化?
5. 阅读 Riedl 2025 (arXiv:2510.05174)──在你的模拟日志上实现高级协同统计──没有 ToM prompt 条件时,这个效果是否存在?

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|----------------|------------------------|
| Theory of Mind | “理解他人的 minds” | 建模另一个 agent 信念的能力。按阶数分级（0、1、2+）。 |
| Sally-Anne test | “false-belief test” | 1985 年发展心理学；LLMs 能通过简单版本，但会在复杂版本失败。 |
| First-order ToM | “A believes X” | 建模一个他人关于事实的信念。 |
| Second-order ToM | “A believes B believes X” | 更深一层的递归建模。 |
| Identity-linked differentiation | “随时间保持稳定角色” | Riedl 的指标：角色持续存在，而不是随机。 |
| Goal-directed complementarity | “不重叠行动” | agents 目标指向不同子任务，而不是同一个。 |
| Higher-order synergy | “群体超过任何子集” | Riedl 用于真实协调的统计度量。 |
| Coordination illusion | “看起来协调” | 没有可测信号的 prompt 修饰式协调表象。 |

## 延伸阅读

- [Li et al. — Theory of Mind for Multi-Agent Collaboration via Large Language Models](https://arxiv.org/abs/2310.10701) 合作游戏中的涌现式 ToM;long horizon failure modes
- [Riedl — Emergent Coordination in Multi-Agent Language Models](https://arxiv.org/abs/2510.05174) 群体规模测量;ToM induzir é suportar condições
- [Premack & Woodruff — Does the chimpanzee have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-chimpanzee-have-a-theory-of-mind/1E96B02CD9850E69AF20F81FA7EB3595) ToM 概念在 1978 年的起源
- [Baron-Cohen, Leslie, Frith — Does the autistic child have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-autistic-child-have-a-theory-of-mind/) Sally-Anne 论文(1985)
