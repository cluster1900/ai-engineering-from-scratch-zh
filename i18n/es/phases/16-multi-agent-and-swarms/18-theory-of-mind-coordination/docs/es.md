# Teoría de la mente y coordinación de la evolución

> Li et al. (arXiv:2310.10701) 表明,合作型文本游戏中的 LLM agentes 会表现出**涌现式高阶 Theory of Mind**(ToM)                                                                                                                                                                                                                                                             **只有**Los requisitos de coordinación se producen en forma complementaria y orientada a objetivos; los LLM de baja capacidad sólo se muestran en una falsa apariencia. Es decir, la coordinación se produce en función de los requisitos y modelos de la persona.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**Fase 16 · 07 (Sociedad de la mente y el debate), Fase 16 · 17 (Agentes generacionales)
**Time:** ~75 minutes

##  problemas

协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调 协调   协调  协调  协调  协调     协调     协调       协调                                                                                                                                                                                     

El descubrimiento de 2025 es más estricto: en condiciones controladas, sólo cuando los agentes son invitados a considerar**其他 agents 的 minds**(ToM) 时, coordinar才会涌现. 没有 ToM prompt, incluso modelos fuertes también se manifestarán incapaces de pasar por un modelo de coordinación controlado estadísticamente.

Este curso considera el TOM como una capacidad concreta, la idea de la creencia, la construcción de un agente mínimo consciente del TOM, y la medición de la diferencia entre la coordinación real y la modificación rápida de los ejemplos.

## 概念

### ¿Qué es eso ?

发展心理学:3 岁儿童认为任何人的内在世界都和自己一致――5 岁儿童理解他人有不同信仰――7 岁儿童会推论关于信仰的信念(她认为我认为球在杯子下面)──这些分别是零阶段、一阶段和二阶段 ToM──

En el caso de los agentes de LLM, el número de niveles de competencia es:

- **Zeroth-order:**No hay otro modelo. Sólo se basa en su propia observación.
- **First-order:**Agente  tener cada otro agente  modelo de creencias Alice cree X.
- **Second-order:**Alice cree que Bob cree en X.

Li et al. 2023                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

### Prueba Sally-Anne 简述

Una prueba de creencias falsas de 1985: Sally pone una bola en el cuadro A, luego se va. Annie la pone en el cuadro B. Sally vuelve a buscar.

Los LLM de la era GPT-4 pueden ser aprobados en pruebas de estilo Sally-Anne propuestas directamente. Cuando las historias son largas, los escenarios cambian varias veces, o los problemas se expresan de manera indirecta, ellos fracasan.

### Riedl's coordinated measurement

Riedl (arXiv:2510.05174) 构建一个群体规模测试:N 个代理,一个合作目标,可变快速条件――测量:

1. **Identity-linked differentiation.**¿Los agentes se forman con el tiempo un papel estable?
2. **Goal-directed complementarity.**¿Acaso la acción de los agentes es complementar y no repetir?
3. **Higher-order synergy.**Una medida estadística, utilizada para determinar si un grupo ha logrado resultados que ningún grupo puede lograr.

结果: sólo en condiciones de ToM prompt, tres indicadores sólo producen señales superiores a la línea de base.  Cuando no hay un ToM prompt, el indicador del modelo de capacidad media se acerca a la oportunidad.

### 协调幻觉

 no hay control estadístico,  coordinación emergente en el medio demográfico suele reflejarse en:

- Ingeniería rápida 把协调内置进去(sistema pide 写着work together)。
-  observer偏差 (Vemos el modelo de nuestro propio esperanzas)
- El éxito de la selección.

Si el sistema de producción anuncia una coordinación emergente sin señales de detección, debe considerarse como una comercialización.

### Un agente consciente de todo lo que es.

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

`other_models`属性就是 ToM estado.  一阶 ToM  只保留一层.  二阶加入.`other_models[i][other_models_of_j]` Creo que el agente i 认为 el agente j 相信什么──

### ¿Por qué el largo horizonte se dañará?

Li et al.  registraron: los límites de contexto llevarán a los agentes  olvidar cuáles son las creencias de quiénes.  La alucinación hará que las creencias falsas se unan a otros modelos de agentes.

论文和 2024-2026 后续研究中记录的缓解方式:

- **在 prompt 中显式写出 ToM state.**结构化格式:`{agent_id: belief_list}`❖ Recuperación forzosa ❖
- **更短的 reasoning chains.**Cada vez menos actualizaciones de ToM pueden reducir las alucinaciones.
- **外部 ToM store.**En el contexto de la LLM, el modelo de mantenimiento es más allá; cada ronda sólo se injeta en la sección relacionada.

### ¿Qué sucederá en la producción?

- **Adversarial settings.**Los agentes de buena calidad son más fáciles de manipular
- **Heterogeneous teams.**Cuando el modelo es diferente, se aplica a un modelo ToM de un oponente no se generaliza.
- **Ground-truth-dependent tasks.**Para centrarse en la creencia; si la verdad depende de los hechos, para centrarse en la atención puede distraerse.

### Su capacidad de medida real

判断团队协调是真实的,而不是 rápidamente 修改的三个实用信号:

1. **Complementarity over time.**En la tarea de múltiples turnos, ¿la acción de los agentes cubre subtareas no superpuestas?
2. **Anticipation.**¿Depende la acción del agente A en el turno T+1 de la predicción de la acción de B en el T+2, y la predicción se ha demostrado posteriormente correcta?
3. **Correction.**Cuando A en el turno T 误读 B de la creencia, ¿A es o no en el turno T + 2 前纠正?

Estos pueden ser medidos en el sistema multi-agente de la agenda. Son la versión de la historia.


```figure
sw-theory-of-mind
```

## Construirlo

`code/main.py` realización:

- `ToMAgent` Seguir sus propias creencias y el modelo de creencias de cada otro agente.
- Una tarea de cooperación: tres agentes deben recoger tres Tokens de tres cajas; cada caja sólo puede contener un Token.
- 两种配置:`zeroth_order`(no tiene que ser) y `first_order`(Tenemos una capa de modelo de creencias)
- En 200 veces de ensayo al azar 上测量: complet rate、重复 rate(dos agentes 目标为同一个盒) 平均完成轮数──

运行:

```
python3 code/main.py
```

预期输出:agentes de orden cero se replantean en una proporción de aproximadamente 35% y completan en 10 vueltas alrededor del 60% de los ensayos.

## Usalo

`outputs/skill-tom-auditor.md`Es una habilidad utilizada para auditar el sistema multiagente para la coordinación de emergencias.

##  Publicarlo

协调声明 lista de control:

- **Control condition.**Su sistema elimina el coordinador de la respuesta de la última versión.
- **Statistical test.**En su indicador, el sistema y el control de la diferencia es`p < 0.05`¿Aquí en el fondo?
- **Complementarity measure.**Con el tiempo las acciones no se superponen, sino que son un éxito final
- **Failure-case log.**Cuando los agentes coordinan el fracaso, ¿qué es tu estado?
- **Model-capacity disclosure.**Si el efecto desaparece en un modelo más pequeño, se explica claramente.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Confirmar que la primera fase de la TCM reducirá la tasa de repetición aproximadamente 7 veces.
2. 实现二阶 ToM agent A 建模 B 如何看待 C) ・・・ ¿Es mejor que una etapa? ¿En qué tareas?
3. En el estado de entrada una vez **hallucination**¿Cuánto disminuirá el rendimiento de una etapa?
4. 阅读 Li et al. (arXiv:2310.10701)。复现长视线降解发现:当轮数从10 增加到30 时,你的一阶 ToM 性能如何变化?
5. 阅读 Riedl 2025 (arXiv:2510.05174)──¿Existe este efecto en el logro de estadísticas de sinergia de mayor orden en su modelo de logro?

## 关键术语: "El hombre es un hombre"

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

- [Li et al. — Theory of Mind for Multi-Agent Collaboration via Large Language Models](https://arxiv.org/abs/2310.10701) 合作游戏中的涌现式 ToM;moduos de fracaso de largo horizonte
- [Riedl — Emergent Coordination in Multi-Agent Language Models](https://arxiv.org/abs/2510.05174) 群体规模测量;Toda la información que se le pide es de carga
- [Premack & Woodruff — Does the chimpanzee have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-chimpanzee-have-a-theory-of-mind/1E96B02CD9850E69AF20F81FA7EB3595) ToM 概念在 1978 年的起源
- [Baron-Cohen, Leslie, Frith — Does the autistic child have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-autistic-child-have-a-theory-of-mind/) Sally-Anne 论文(1985)
