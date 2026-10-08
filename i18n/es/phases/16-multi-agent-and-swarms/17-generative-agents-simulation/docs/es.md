# Agentes generativos y emergentes

> Park et al. 2023 (UIST '23, arXiv:2304.03442) Utilizó tres partes de la estructura**Smallville**, una caja de arena que contiene 25 agentes:**memory stream**(自然言語日志)**reflection**(agente basado en su propio flujo de producción de más alto nivel)**plan**(日级行为,然后是子计划) ―― el resultado es el surgimiento de la fiesta del Día de San Valentín: un agente fue implantado y quiere organizar una fiesta del Día de San Valentín, sin más guión, se produjo una invitación a la difusión en grupos  समन्वय日期, y finalmente organizó una fiesta de 24 personas que comenzaron a tener poco conocimiento de este agente.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**Fase 16 · 04 (modelo primitivo), Fase 16 · 13 (memoria compartida)
**Time:** ~75 minutes

##  problemas

La mayoría de los sistemas multi-agentes son equipos de escritura estricta: planificador  elaborar plan, codificador  escribir código, revisor  hacer revisión. Esto se aplica para definir tareas claras.

Smallville 架构就是它的基准. Antes de Park 2023, el mejor agente 模拟是浅层脚本跟随者; después de ello, este modelo se convirtió en la arquitectura predeterminada de Generative Agents en el mundo abierto. Si en 2026 construyes un agente 模拟, o bien estás usando los tres componentes de Smallville, o necesitas explicar claramente por qué no lo estás usando.

## 概念

### Tres componentes

**Memory stream。**Una sólo observación adicional, movimiento, reflexión y plan 日志── cada artículo tiene tiempo、 tipo、 descripción ([[linguística natural]]) y datos de los eventos:**recency**¿Qué es esto?**importance**(agente 自评 1-10) y **relevance**(Con la similitud de los otros cuerpos de la investigación actual)

```
[2026-02-14 09:12:03] observation: Isabella Rodriguez asked me if I like jazz
[2026-02-14 09:14:22] reflection:   I enjoy long conversations about music
[2026-02-14 10:05:00] plan:         Attend Isabella's Valentine's Day party tonight
```

Recuperación de memoria 组合三个分数:`score = w_recency * e^(-decay * age) + w_importance * importance + w_relevance * cos_sim`✿ Top-k 条目 entrar en el momento siguiente ✿

**Reflection。**周期性地(每 N 条记忆或发生重要事件时),agente de la memoria reciente 生成更高阶综合──Reflexión 条目会写回流,并像其他记忆 一样可检查──这是代理的构建理解的方式,也就是该架构中长期信念等价──

**Plan。**Desde arriba hacia abajo se descompone. Primero es un plan de día de trabajo, luego un plan de tiempo de trabajo, luego un plan de trabajo, luego un plan de trabajo.

### ¿Por qué tres cosas importantes?

Park et al. hicieron una separación de las ablaciones de observación, reflexión y plan.

- No hay .**observation**, agente 会错过上下文,并基于过去的信念行动.
- No hay .**reflection**, agente no puede formar una creencia de clase superior; la interacción se detiene en la baja.
- No hay .**plan**, el comportamiento se convierte en un ruido reactivo; el objetivo se desvanece.

El índice de credibilidad dado por los evaluadores humanos es el más alto en los tres componentes; eliminar cualquier uno generará degradaciones de la medida.

### El día de San Valentín

Una agente, Isabella Rodríguez, fue implantada en el objetivo de organizar una fiesta de San Valentín en el Hobbs Cafe el 14 de febrero a las 5 pm.

1. El plan de Isabel incluye invitar a otros.
2. Cada invitación se convierte en una observación en el flujo de memoria de los vecinos.
3. La reflexión del vecino creía que Isabella estaba dando una fiesta.
4. El plan del vecino se incluye en la fiesta del 14 de febrero.
5. Los vecinos dicen a los demás vecinos. Invitan a la difusión sin coordinación central.
6. 2 月 14 日下午 5 点, varios agentes se reunieron en el Hobbs Cafe.

Es una tendencia en el sentido técnico: un sistema de comportamiento (un派对) viene de la interacción local (un invitado a la organización), sin un orquestaje central (un orquestaje central).

### 文档记录的失败模式 文档记录的失败模式 文档记录的失败模式

Park et al. 明确记录了:

- **空间规范错误。**Agente entra en una tienda cerrada. Agente intenta usar el mismo sanitario de una sola persona. Agente en una habitación no adecuada para la comida.
- **Memory overflow。**La memoria de la memoria se reduce a la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la memoria de la que la que la que la que la que la que la que la que la que la que la que la que la que la que la que la que la que la que la que la que la que la que la que la que la que la que
- **Reflection hallucination。**Reflexión puede crear flujo de memoria 中不存在的关系──缓解方式: en el prompt de reflexión, se incluyen las identidades de memoria de la fuente, y en la recuperación 时验证──

Estos son modelos de fracaso relacionados con la producción: cualquier agente de 2026 se parece a todos los que los heredan.

### Tres componentes de la aplicación de la regla

1. **Memory 是 append-only。**Nunca cambies la memoria.
2. **Importance 分数要便宜。**写入时调用 LLM 评估 1-10 的重要性──缓存该分数──
3. **Retrieval 是排序，不是过滤。**按组合分数取 Top-k; no use hardware (en inglés)
4. **Reflection 周期性运行。**Cuando no se ha procesado la memoria importancia 总和超过值时触发(por ejemplo 150)。
5. **Plans 可以修订。**Cuando una nueva observación contradice con un plan, sólo se vuelve a generar un fragmento afectado, no todo el plan.

### Agentes Generativos fuera de Smallville

La documentación posterior de 2024-2026 amplió esta estructura:

- **用于政策 / 市场研究的 multi-agent 社会模拟。**类 Smallville 群体模拟用户对功能的行为响应──比A/B tests更快; precisión todavía es controvertida──
- **游戏中的 NPC AI。**带有Smalvilleagente de RPG 会产生涌现故事线, en lugar de tareas de guionamiento.
- **Generative-agent 评估基准。**El indicador no es la precisión de tareas, sino la credibilidad +                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

La estructura es un estándar de referencia. Se utiliza para almacenar vectores de memoria, recuperar reflexión aumentada, pero se conserva tres partes de la estructura.

### ¿Por qué es importante para la ingeniería multi-agente ?

Smallville es una prueba de concepto: cuando el componente es correcto, la multiplotación puede ser muy conveniente.**emergent social behavior**El sistema de producción utiliza esta forma.**tight task execution**模式── 模式── 模式── 模式── 系统都会使用本阶段 前面介绍的 supervisor / roles / primitivos 模式──


```figure
a5-memory-reflection
```

## Construirlo

`code/main.py`Utilizando las políticas de Python y guionismo de agentes (no hay verdadera LLM) implementar tres componentes.

- `MemoryStream` 带 recency/importance/relevance retrieval  带 recency/importance/relevance retrieval  日志。
- `reflect(stream)` Reflexión sobre la memoria de gran importancia reciente 
- `plan(agent_state)`  Basado en el plan de los niveles y horas de las creencias actuales.
- En el escenario: 5 agentes. Agente 1 a partir de la fiesta de 5 pm.

运行:

```
python3 code/main.py
```

预期输出: cada tick trace. Hasta el último tick. 5 agentes entre al menos 3 aparecen en el plan, y se reúnen en la ubicación del partido.

## Usalo

`outputs/skill-simulation-designer.md`Diseñar una simulación de agente generativo:agente, número, esquema de memoria, cadencia de reflexión, horizonte de plan y métrica de evaluación.

##  Publicarlo

Reglas de producción:

- **Memory 就是数据库。**En la escalación, seleccionar el almacenamiento real de datos.
- **记录 retrieval trace。**Para cada acción, el registro impulsa sus memorias de mayor calidad.
- **为每个 agent 预算 tokens。**Cada tick 中 Cada agente de recuperar + reflejar + plan es O(k) LLM llamadas;;N agentes × T ticks × llamadas-por-tick 可能压你的预算──
- **周期性 compact memory。**Resumen y recorte 条目――La política de retención es la decisión de diseño, no la sección―
- **显式检测空间 / 社会规范违规。**La arquitectura no aprenderá a conocerlos.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`¿Confirmar que 3+ agentes se reúnen en el partido? ¿Aumentar a 10 agentes?
2. 移除反思步骤──行为会是什么样样?映射到Park 2023 中的放弃 发现──
3. Introducir un objetivo semillado de competenciaKlaus quiere dar una charla de investigación a las 5 pm)。Agent 会分流, también es un objetivo que ocupa la cabeza? ¿Qué es el factor decisivo?
4. ¿Hobbs Cafe tiene capacidad para 4 agentes? ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
5. 阅读 Park et al. (arXiv:2304.03442) Sección 6 Emergentes experimentos de comportamiento  找出你的微型版本无法复现的行为 您需要增强架构中的哪个组件?

## 关键术语: "El hombre es un hombre"

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
