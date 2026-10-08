# Reflexión: Aprendizaje de refuerzo verbal

>  Basado en RL de Gradiente  necesita miles de veces de experimentación y un cluster de GPU 才能修复一种失败模式──Reflexion(Shinn et al., NeurIPS 2023) con el lenguaje natural para completar este hecho: después de cada intento de fracaso, el agente 写下一段反思,将其存储在情节记忆中,并让下一次试验基于这个记忆──这是Letta's sleep-time computing、Claude Code's CLAUDE.md aprendizajes, así como la regla de aprendizaje de pro-workflow 后背模式──

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 02 (ReWOO)
**Time:** ~60 minutes

## El objetivo del aprendizaje
- Cuentan los tres componentes de la reflexión: actor, evaluador, autorreflector y el papel de la memoria episódica.
- 实现 un stdlib Reflexion loop, que contiene evaluador binario, buffer de reflexión y nuevos intentos de repetición.
-  para realizar una tarea determinada, entre fuentes de retroalimentación escalar, heurística y autoevalua­da 
- Explicar por qué el refuerzo verbal puede captarse a partir de RL basado en Gradiente requiere miles de pruebas para corregir errores.

##  problemas
Un agente  misión ha fracasado. En el estándar RL, volverás a ejecutar miles de pruebas, calcular gradientes, actualizar pesos.

Reflexión ((Shinn et al., arXiv:2303.11366) planteó otro problema: si el agente  simplemente piensa en sí mismo por qué fracasó,并把 esta idea en el momento 里再试一次,会怎么?

结果是: en ALFWorld 上, superó ReAct 和其他 no sintonizados líneas de base. En HotpotQA 上, se ha mejorado en relación con ReAct. En la generación de código HumanEval/MBPP, se alcanzó el estado de la técnica en ese momento.

## 概念
### Los tres componentes

```
Actor         : generates a trajectory (ReAct-style loop)
Evaluator     : scores the trajectory — binary, heuristic, or self-eval
Self-Reflector: writes a natural-language reflection on the failure
```

Añadir una estructura de datos:

```
Episodic memory: list of prior reflections, prepended to the next trial's prompt
```

Una vez se ejecutó el ensayo Actor. El evaluador lo evaluó. Si el resultado es menor, el autorreflector generará una reflexión.

### Tres tipos de evaluadores

1. **Scalar** Exterior señal binaria―ALFWorld éxito o fracaso―HumanEval pruebas 通过或失败―最简单,信号 最强―
2. **Heuristic** 预定义的失败签名──如果代理连续两次产生相同行动,就标记为卡了──如果轨迹超过50步,就标记为不效──
3. **Self-evaluated** LLM a su propia trayectoria 打分──当没有基础真理 时需要它──Signal 较弱;适合与工具基底证实 搭配使用(LECCIÓN 05  CRITIC) ‖

El método de uso de la heurística como vía de seguridad es el uso de la heurística como vía de seguridad.

### ¿Por qué esto generaliza

La reflexión es un nuevo algoritmo, no como decir que es un modelo denominado. Casi todos los agentes de producción de auto-curación funcionan en algún tipo de variación:

- Letta's computación del tiempo de sueño (LECCIÓN 08): un agente independiente reflexionando en las conversaciones pasadas,并写入记忆块──
- El código de Claude `CLAUDE.md`/ save memory 模式:将 reflexiones 捕获为学习,并预pendi到未来的会议──
- Pro-flujo de trabajo `/learn-rule`Comando:将 correcciones 捕获为显式规则──
- Los nodos de reflexión de LangGraph: un nodo para la salida 打分, y en el tiempo necesario路由到精炼──

Todos ellos provienen de la misma idea: el lenguaje natural es un medio suficientemente rico, que puede llevarme entre carreras.

### ¿Cuándo es efectivo, cuándo es inefficiente?

Reflexión  Aplicable a:

- Tiene una clara señal de falla de prueba error de herramienta respuesta incorrecta
- clase de tareas 可复现(el mismo tipo de problemas volverá a aparecer)。
- reflexión tiene espacio para mejorar la trayectoria (hay un presupuesto de acción suficiente)

Reflexión no se aplica a:

- El primer intento ha sido un éxito.
- 失败来自外部因素(red baja 工具破碎) 反思 网络 estaba baja 对未来运行 没有帮助──
- Reflexión  convirtiéndose en una fantasía                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

2026 年的陷:memory rot──Reflections 会累积; algunos de ellos ya han pasado el tiempo o se han equivocado; con el buffer episódico 变大, re-runs 会变慢──缓解方法:定期 compaction(Leyón 06)、对reflections 设置 TTL,或使用单独的睡眠时间清洁剂(Letta)。


```figure
react-trace
```

## Construirlo
`code/main.py`En un rompecabezas de juguete 上实现 Reflexión: generar una lista de 3 elementos, hacer que su suma等等到目标值──Actor 产出候选人名单;Evaluator 检查 sum;Self-Reflector 写一行关于哪里出错的诊断──Reflexión 会进入 episodios de memoria,供下一次试用──

Componentes:

- `Actor` Una política guionada, en la reflexión 时会改进──
- `Evaluator.binary()`  Basado en la suma del objetivo de pase/fallo
- `SelfReflector` 生成一行 diagnóstico de fracaso
- `EpisodicMemory` Una lista limitada de semántica TTL con

运行:

```
python3 code/main.py
```

Trace 展示三次试点──Trial 1 失败,存储一段反思;trial 2 看到反思 后有改进但仍失败;trial 3 成功──与基线运行(无反思)对比它会卡在试点1的答案上──

## Usalo
LangGraph va a reflejar  como patrón de nodos  proporcionar。Code de Claude `/memory`comando y pro-flujo de trabajo `/learn-rule`El programa de seguridad de los agentes de OpenAI SDK no proporciona reflexión directa; puede utilizar un control de seguridad de la memoria que puede ejecutarse a través de un control de memoria.`Session`Vamos a construirlo.

##  entregarlo
`outputs/skill-reflexion-buffer.md`创建并维护一个节奏缓冲,包含反思捕获、TTL 和减复――给定一个任务类 和一次失败,它会产出一段真正帮助下一次试验的反思(而不是泛泛的要更小心) 

##  ejercicios
1. ¿Acaso es más rápido? ¿Es más rápido?
2. Para reflexiones añadir 10 ensayos de TTL. Más allá de este punto, ¿son perjudiciales o beneficiosas las reflexiones más antiguas?
3. 实现 heurística evaluador: si la misma acción vuelve a aparecer,就将试验 标记为卡了── esto con el Auto-Reflector 如何交互?
4. Uso会忽略反思的逆向演员 运行反思――为了迫使演员注意到它们,最小反思快速工程是什么?
5. 阅读反思论文 中关于AlfWorld的第4节 从概念上复现 130% éxito de tasa de mejora: Comparado con la vainilla ReAct, ¿qué es el delta clave?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Reflexion | “Self-correction” | Shinn et al. 2023 — Actor、Evaluator、Self-Reflector 加 episodic memory |
| Verbal reinforcement | “Learning without gradients” | prepend 到下一次 trial prompt 的自然语言 reflection |
| Episodic memory | “Per-task reflections” | 针对一个 task class 的 prior reflections bounded buffer |
| Scalar evaluator | “Binary success signal” | 来自 ground truth 的 pass/fail 或 numeric score |
| Heuristic evaluator | “Pattern-based detector” | 预定义 failure signatures（例如 stuck-loop、too-many-steps） |
| Self-evaluator | “LLM-as-judge on own trace” | 没有 ground truth 时使用的 lower-signal fallback — 与 tool-grounded verification 搭配 |
| Memory rot | “Stale reflections” | Episodic buffer 被过时 entries 填满；用 compaction/TTL 修复 |
| Sleep-time reflection | “Async self-reflection” | 在 hot path 之外运行 Self-Reflector，使 primary agent 保持快速 |

## 延伸阅读
- [Shinn et al., Reflexion: Language Agents with Verbal Reinforcement Learning (arXiv:2303.11366)](https://arxiv.org/abs/2303.11366) 经典 papel
- [Letta, Sleep-time Compute](https://www.letta.com/blog/sleep-time-compute) producción 中的 async reflexión
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) Configurar el buffer episódico como parte del contexto
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) patrón de nodo de reflexión
