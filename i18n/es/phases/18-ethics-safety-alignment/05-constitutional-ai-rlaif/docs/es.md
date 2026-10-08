# La IA constitucional y el RLAIF

> Bai et al. (arXiv:2212.08073, 2022) plantearon un problema: si sustituimos a los marcadores humanos en una lista de principios de IA, ¿cómo? La IA constitucional tiene dos etapas: primero en la constitución 约束下进行自我批判和修改, luego en la AI Feedback 进行 RL. Esta tecnología creó RLAIF Este término, y se utilizó en la línea de tubería post-entrenamiento de Claude 1.

**Type:** Learn
**语言：**Python (stdlib, bucle de autocrítica y revisión de juguete)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking)
**Time:** ~60 minutes

## El objetivo del aprendizaje
- Describir las dos fases de la IA constitucional (la crítica y revisión de las FFT, la RL de los comentarios de la IA) y la Constitución en cada fase.
- Explicar por qué usar etiquetadores de IA para reemplazar los etiquetadores de preferencia humana no es más barato, sino que cambiará los modos de falla de la tubería.
- 总结 2026 ¿Qué cambios ocurrieron en la estructura de cuatro niveles de prioridad de la Constitución de Claude, así como en su versión de 2023 reescritura en relación con ella?
- 描述 Constitutional Classifiers, así como gastos generales de cálculo desde el 23.7% (v1)

##  problemas
RLHF necesita marcadores. La velocidad de los marcadores es lenta, tiene prejuicios y es costosa. Se puede utilizar un modelo de sustitución de marcadores para eliminar a los marcadores.

 el problema consiste en: la señal de preferencia  ahora generada por el mismo tipo de modelo que estás entrenando ∙ los etiquetadores                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               

## 概念
### Fase 1  监督式自我批判与修订

Desde un modelo SFT útil pero aún inofensivo 开始──给定一个红团提示,模型会产生初始反应──第二模型──或同一个模型在第二轮中)读取从宪法中采用原则,并批评该反应──第三步会修改反应 以回应批评──修改后的反应就是SFT目标──

La constitución es una lista de principios. Bai et al. 2022 utilizó 16 principios, incluyendo la prioridad para elegir el mínimo de peligro y la respuesta ética.

### Fase 2  de la RL de la retroalimentación de IA (RLAIF)

Se trata de un modelo de retroalimentación que se basa en los principios constitucionales de la Constitución para cada compleción. Se trata de un modelo de retroalimentación. Se utiliza un modelo de recompensas para entrenar las preferencias de la IA.

RLAIF = señal de preferencia por AI 生成──La parte restante de la tubería sigue siendo RLHF 形──

### ¿Por qué no es sólo un RLHF más barato?

- El sesgo de etiquetadores de la etiquetación psicológica del marcador se transfiere por principio de explicación. La interpretación de un etiquetador de IA para ser honesto puede ser más estricta o más flexible que cualquier humano; esta estricta medida se mantendrá en la misma medida en todo el conjunto de datos.
- Se puede leer el principio, la crítica y la revisión. Las etiquetas humanas son poco transparentes.
- Los modos de fracaso 会改变──Sycophancy 会下降(AI labeler 没有需要讨好用户)──Goodhart's Law 仍然存在(proxy 现在是模型对原则集 X 的解释,它仍然是不完美的测量)──

CAI en 2022: el modelo de entrenamiento posterior es más inofensivo y prácticamente igualmente útil que el modelo RLHF de datos comparables.

### 2026 La Constitución de Claude 重写

Anthropic 于 2026 年 1 月 21 日 publicó una modificación sustancial de la Constitución.

1. Es decir, el modelo de la CSAM se expande por principios y por razones de que perjudica a los niños.
2. Cuatro niveles de prioridad:
   - Nivel 1: evitar resultados catastróficos (en general, las víctimas de grandes cantidades de víctimas de las catástrofes)
   - Tier 2: seguir las directrices de Anthropic.
   - Nivel 3: La norma de la calidad de vida
   - Nivel 4: útil y candidato
    conflictos de su propia y de su propia solución¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
3. 首个主要实验室对模型道德地位不确定性的正式承认 (→ Fase 18 · 19 Bienestar Modelo)
4. En CC0 1.0 se publicó otro laboratorio que puede utilizarse o modificarse sin restricciones.

### Clasificadores constitucionales

另一条并行工作路线是: no cambiar el modelo de post-entrenamiento, sino entrenar a leer constitución 并 gate 模型输出的轻量级分类器──v1(2023) de la computación sobrecarga es de 23.7%──v2(2026) de aproximadamente ~1%, y tiene la menor tasa de éxito de ataque en todas las defensas que han sido probadas públicamente en Anthropic.

Este es un modelo de defensa de nivel: CAI  formación de comportamiento; clasificadores  ejecutar invariantes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

### CAI en la posición en el sistema de regímenes

- InstrucciónGPT:prefs humanos、RM、PPO。
- CAI / RLAIF: prefijos de IA generados por principios 、RM、PPO。
- DPO / familia: en prefijos de la forma cerrada en humanos o AI.
- Auto-recompensación, autocrítica: los principios se internalizan, el modelo desempeña un gran número de papeles.

Este eje es el señal de preferencia de la CAI de 2022 papel es la escala fronteriza arriba por primera vez en la gravedad de la señal humana a la señal de IA.


```figure
constitutional-ai
```

## Usalo
`code/main.py`En el léxico de juguetes 上模拟 CAI de crítica y revisión de la bucle. Un principio 会标记害重集中的Token.给定初始反应,批判会识别有害Token.

##  entregarlo
本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-constitution-writer.md` dar un dominio: apoyo al cliente, asesoramiento médico, asistente de codificación, herramienta de investigación, según la Constitución de 2026 de Claude 结构起草四层:eventual avoidance, normas de la plataforma, ética del dominio, utilidad.

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ Comparar el modelo base de la tasa de tokens nocivos con la versión entrenada por CAI. ¿Cuántos pasos de revisión se necesitan para acercarse a cero?

2. 阅读Antropic's 2026 constitution (en inglés) 列出一个应归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归

3. Para AI coding asistente diseñar una constitución. Definición de nivel 1 (catastrófico:未经批准的破坏性命令)

4. CAI utiliza etiquetadores de IA  sustituir etiquetadores humanos― dice que todavía puede ocurrir en modo de falla similar a la sícofancia en RLAIF, y diseña una detección―

5. 阅读宪法分类器 v2 metodología(si可用) ⋅ explica por qué ~1% de los gastos generales de cálculo en comparación con el 23.7% , es una historia de seguridad diferente en su naturaleza ⋅

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Constitutional AI | “用原则训练的 AI” | 两阶段 pipeline：self-critique-and-revise SFT，然后来自 AI feedback 的 RL |
| RLAIF | “没有人的 RLHF” | 使用由 AI labeler 生成的 preferences 的 RL；pipeline 的其余部分不变 |
| Constitution | “那些原则” | critique/labeler model 会参考的自然语言规则有序列表 |
| Critique-and-revise | “SFT loop” | 生成 response → 根据某条 principle 进行 critique → revise → SFT target |
| Constitutional Classifier | “output gate” | 轻量级 classifier，用 constitution 评估 outputs 并进行 block/log |
| Four-tier priority | “冲突解决器” | 2026 Claude constitution 层级：catastrophic > platform > ethics > helpful |
| Feedback model | “AI labeler” | 读取 principle 并对一对 completions 排序的模型 |

## 延伸阅读
- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback (arXiv:2212.08073)](https://arxiv.org/abs/2212.08073) Origen de dos fases del oleoducto
- [Anthropic — Claude's Constitution (Jan 2026)](https://www.anthropic.com/news/claudes-constitution) 2026 Cuatro niveles de redacción versión, CC0 1.0
- [Anthropic — Constitutional Classifiers (2024-2026)](https://www.anthropic.com/research/constitutional-classifiers) v2 中 sobrecarga 约为 ~ 1% de salida-puerta 防御
- [Lee et al. — RLAIF vs RLHF: Scaling Reinforcement Learning from Human Feedback (arXiv:2309.00267)](https://arxiv.org/abs/2309.00267) RLAIF / RLHF 的实证比较
- [Kundu et al. — Specific versus General Principles for Constitutional AI (arXiv:2310.13798)](https://arxiv.org/abs/2310.13798) Principio de la gran cantidad de
