# Árbol de pensamientos y LATS: Buscar deliberadamente

> 单条 cadena de pensamiento 没有回溯空间──ToT(Yao et al., 2023) convertirá el razonamiento 变成一棵树, y en cada nodo realizar una autoevaluación──LATS(Zhou et al., 2024)

**类型：**Construir
**语言：**Python (stdlib)
**先修：**Fase 14 · 01 (Luz de agentes), Fase 14 · 03 (Reflexión)
**时间：**~ 75 minutos

## El objetivo del aprendizaje

- El razonamiento expreso para buscar:nodo es pensamiento, borde es expansión, valor es más esperanza.
- 实现 una búsqueda de árbol BFS estilo ToT,并用自评分──
- 扩展为一个玩具 LATS MCTS loop,包含选择/扩展/模拟/反扩散──
- 判断什么时候搜索 值得代币 倍增成本(Juego de 24、code generation),什么时候单条轨迹就足够(简单 Q&A) 』

##  problemas

La cadena de pensamiento es una línea de marcha. Si el primer paso se ha equivocado, cada paso posterior se basará en un supuesto equivocado. En el juego de 24 con cuatro números y + − × ÷  get 24) el índice de precisión de GPT-4 CoT es de 4%.

El razonamiento necesita es presentar múltiples candidatos, evaluarlos, elegir candidatos con esperanza y tener la capacidad de regresar a un final muerto.

## 概念

### Árbol de pensamientos (Yao et al., NeurIPS 2023)

Cada nodo es un paso intermedio en el que se puede pensar. Cada nodo puede expandirse para el pensamiento de un niño.

```
                     (root: "find 24 from 4 6 4 1")
                    /               |            \
           ("6 - 4 = 2")    ("4 + 1 = 5")    ("4 * 6 = 24")  <- Score: HIGH
              /   \              |                  |
          ...    ...          ...                finish
```

La autoevaluación es una parte importante del trabajo.`sure / likely / impossible`clasificación,`1..10`El resultado numérico, así como el voto entre los candidatos, fue muy positivo en el juego de 24 de enero.

### LATS (Zhou et al., ICML 2024)

LATS en MCTS se unió a TOT, React y Reflexión.

- **Policy**: presentar candidaturas para la próxima acción (react-style)
- **Value function**:为 parcial trayectoria 打分(T-estilo autoevaluación)
- **Self-reflector**La idea de que el mundo sea un lugar de reflexión es una forma de reflexión.

El feedback ambiental (observación) se mezcla en la función de valor, por lo que la búsqueda 会由真实工具结果 提供信息,而不仅仅是模型意见.

### MCTS, forma mínima

Cada iteración tiene cuatro etapas:

1. **Select** Utiliza UCT(confianza superior ligada a los árboles) desde la raíz 走到叶──
2. **Expand**  通过政策 生生成 K 个孩子──
3. **Simulate** Uso política desde el lanzamiento de niños hasta la hoja,并用值函数 (o recompensa ambiental)为叶 打分。
4. **Backpropagate** 沿路径向上更新 visitas y estimación de valor

Formula de TCC:`Q(s, a) + c * sqrt(ln N(s) / N(s, a))` La primera es la explotación; la segunda es la exploración.`c`¿Qué es eso?

### 成本现实

Se busca un token 爆──Jogo de 24  上的 ToT 使用的代币是CoT 的1001000倍──LATS 类似──

- 单条轨迹被证明不足的任务 (Juega de 24 复杂 código)
- El reloj de la pared no es correcto.
- Tiene una función de valor conveniente y fiable tarea de unidad de prueba de código  meta explícita de matemáticas)

Si tu tarea tiene una sola respuesta correcta y un evaluador tiene ruido, la búsqueda suele hacer que las cosas empeoren, porque encontrará una respuesta errónea de puntajes altos.

### 2026 定位

La mayoría de los agentes de producción no funcionan LATS── ellas funcionan con una verificación basada en herramientas de ReAct(CRITA,LECCIÓN 05)──Buscar aparece en nicho especializado en:

- Se evaluará el valor de la función de código de la función de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de
- 探索多条 búsqueda de la ruta de agente de investigación profunda.
- Subgrafo de LangGraph 内部 planificación-flujo de trabajo pesado。

AlphaEvolve (lección 11) es el último ejemplo de 2025: para el código  realizar búsqueda evolutiva  máquina-verificable fitness  aumento de la frontera  56 años viene por primera vez 4x4 matmul 改进) 


```figure
tree-of-thoughts
```

## Construirlo

`code/main.py`实现:

- Una tarea de cálculo de selección en forma estilizada, que funciona en la pequeña ToT BFS.
- Una en la misma tarea 上运行的 juguete LATS MCTS loop(Seleccionar / Expandiendo / Simulando / Retrocediendo), utilizar la selección UCT。
- Una combinación de puntuación simbólica y función de valor de puntuación autoevaluación.

¿Qué es eso ?

```
python3 code/main.py
```

trace 会显示 ToT Using BFS Cada nodo expande Tres candidatos,并与LATS 通过MCTS 收到最佳推广 进行对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──

## Usalo

LangGraph va a explorar en estilo ToT  como patrón de subgrafo 提供;LangChain equipo 关于 LATS 的博客(2024 年 5 月) 是参考教程──LlamaIndex 提供 `TreeOfThoughts`En la mayoría de los agentes de producción de 2026 se encuentra el patrón.`if task_complexity > threshold: use_search()`Por ejemplo, el sistema de evaluación de la calidad de la información se puede utilizar para la evaluación de los resultados de la evaluación.

##  entregarlo

`outputs/skill-search-policy.md`Se debe elegir entre ReAct, ToT, LATS y búsqueda evolutiva.

##  ejercicios

1. Utilizando UCT c=0.1 y c=2.0 ¿Qué ha cambiado en el rastro?
2. ¿Cuál es la mínima señal-a-ruido que puede tolerar?
3. 实现 beam-search ToT( cada nivel de retención de top-k)并 con BFS en comparación.
4. 阅读 LATS Sección 5.1──复现 HumanEval trajectory count: ¿Cuánto despliegue se necesita para alcanzar el report de pass@1?
5. 阅读LATS paper 中关于当LATS ayuda menos的讨论──写一段决策规则,将任务形状映射到搜索策略──

## 关键术语: "El hombre es un hombre"

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
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) Usado para el patrón de subgrafo de búsqueda
- [AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) 带 evaluador programático de búsqueda evolutiva
