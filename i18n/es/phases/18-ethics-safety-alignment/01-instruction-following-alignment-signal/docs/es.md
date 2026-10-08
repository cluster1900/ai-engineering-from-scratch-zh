# Seguimiento de instrucciones  como señal de alineación

> Después de cada crítica a RLHF están en contra de esta línea de trabajo. Antes de estudiar la presión de optimización cómo torcer un proxy, debes ver primero este proxy. InstructGPT(Ouyang et al., 2022) define la arquitectura de referencia: en pares de instrucciones-respuesta, hacer ajustes supervisados; en pares de clasificación de preferencias, un modelo de recompensa de entrenamiento; luego usar PPO con una penalización KL para el modelo de recompensa  optimización,并约束到SFT política.

**Type:** Learn
**Languages:** Python (stdlib, toy three-stage pipeline)
**Prerequisites:** Phase 10 · 06 (SFT), Phase 10 · 07 (RLHF), Phase 10 · 08 (DPO)
**Time:** ~45 分钟

## Objetivos de aprendizaje

- Explicar las tres fases de la tubería de la InstructGPT, así como la pérdida de uso de cada etapa.
- Explicación de por qué 1.3B modelo ajustado a instrucciones en la evaluación de preferencias humanas en derrotó el original 175B GPT-3。
- Explicar la penalización KL en la etapa 3 en la prevención de lo que, y por qué la eliminación se reducirá a un comportamiento de búsqueda de modo.
-  describir el impuesto de alineación, así como Ouyang et al. Utilizando para aliviar su PPO-ptx

## El problema

Los modelos de lenguaje pre-entrenados 会补全文本──它们不会回答问题──问 GPT-3 写一个Python函数,反转一列表,你经常会得到另一个提示,因为大多数训练分布是将继续接接更多的网文的网文──模型在做它工作,但这个工作本身错了──

Cada laboratorio se utiliza para reparar este problema como proxy es la preferencia humana. Dos completos  entregan al evaluador; el evaluador selecciona un mejor; el modelo de recompensa, aprende este evaluador. Luego un ciclo RL Coloca una política  proponer un modelo de recompensa  otorgar resultados de alta porción.

## El concepto

### Fase 1: ajuste fino supervisado (SFT)

收集快速响应对, entre los cuales la respuesta es un buenintención的人会写出的内容──Ouyang et al. Utilizó las instrucciones 13k de los etiquetadores y OpenAI API── con el estándar de pérdida de entropía cruzada en estos datos, el modelo base de ajuste fino──

SFT  te da algo: el modelo ahora responderá a la pregunta, en lugar de continuar completando la pregunta completa― no te da algo: cuando más respuestas son plausibles , el rator prefiere el mensaje de la respuesta―

### Fase 2: modelo de recompensa (RM)

Para cada respuesta, desde el modelo SFT 采样 K 个完成──Labeler对它们排序──训练一个奖励模型,为任意快速反应对 打分,使对于 `y_w`Fue muy bien ganado.`y_l`de los pares:

```
L_RM = -log sigmoid(r(x, y_w) - r(x, y_l))
```

Es la pérdida de preferencia en pareja Bradley-Terry. RM normalmente se inicia en el modelo SFT, sustituyendo la cabeza LM por la cabeza escalar.

Los modelos de recompensas 很小:6B 足足服务 175B InstructGPT──它们 también son muy frágiles, en el artículo 5 节 se habla principalmente de comportamientos de hackeo de recompensas que aparecen a pequeña escala──

### Etapa 3: PPO con penalización KL

definición de objetivo:

```
J(pi) = E_{x~D, y~pi(.|x)} [ r(x, y) ] - beta * KL(pi(.|x) || pi_SFT(.|x))
```

Utilizando el término PPO maximizar.`pi`No se apartará de la política de SFT 太远──没有它, Optimizer encontrará ejemplos adversarios, es decir, en RM Bajo puntajes muy altos, la razón no es que los humanos realmente prefieran a ellos, sino que RM nunca los ha visto──

Coeficiente KL `beta`Es el RLHF, el mayor parámetro de la RLHF.

### El impuesto de alineación

Después de RLHF, el modelo se encuentra más prefijado por los humanos, pero en los puntos de referencia estándar (SquAD、HellaSwag、DROP) se le llama impuesto de alineación, y no se utiliza PPO-ptx 修复:

```
J_ptx(pi) = J(pi) + gamma * E_{x~D_pretrain} [ log pi(x) ]
```

PPO-ptx 成为标准做法──Antropic、DeepMind 和 Meta 都使用某种变化──

### El resultado

Una instrucción de 1.3B GPT(SFT + RM + PPO-ptx) fue preferentemente superada por los etiquetadores por 175B base GPT-3, proporción de aproximadamente el 70%―en las instrucciones ocultas de prueba del tráfico de producción, esta diferencia se ampliará―de este número se pueden leer dos cosas:

1. Alineación es con capacidad Diferente de eje. Modelo 175B tiene una capacidad más fuerte. Modelo 1.3B tiene más alineación. Etiquetas más preferentemente alineadas.
2. El nivel de capacidad está determinado por el modelo base.

### ¿Por qué es la Fase 18 de referencia?

后续课程中的每个批评:reward hacking(Leyón 2)、DPO(Leyón 3)、psychophancy(Leyón 4)、CAI(Leyón 5)、sleeper agents(Leyón 7)、alignment faking(Leyón 9),都在反对这一条的某部分──Reward hacking 攻击阶段 2──DPO 把阶段 2 和 3 合并──CAI 替代人类标签──Sykophancy 表明标签是偏见的信号──Alignment faking 表明政策可以完全绕过阶段 3──如果你没有这个条款的管道,就无法理解这些批评──


```figure
al-instruct-pipeline
```

## Usalo

`code/main.py`En los datos de preferencias de juguete 上模拟三个阶段。Base policies 是一个在行动 {A, B, C} 上的偏见硬币。Stage 1 SFT 在 200 个提示上模拟标签行动。Stage 2 从 500 个对等排名 适合布拉德利-特里奖励模型。Stage 3 运行简化PPO更新,并带有到SFT政策的奖励 KL penalty──你可以观察上升KL分歧 变大、政策漂移,也可以关闭 KL术语,看黑客在 50 个奖励更新步骤内出现──

Para observar el contenido:

- `beta = 0.1`Con`beta = 0.0`La trayectoria de recompensa de abajo.
- Entrenamiento pasos 中的 KL pi pi SFT)
- Distribución de acción final en comparación con la preferencia del etiquetador.

## Envío

本课产 出  `outputs/skill-instructgpt-explainer.md` Determinar una descripción del oleoducto de RLHF o un resumen de papel, que identifique cuál de las tres fases ha sido modificada, cuál es la pérdida utilizada en cada fase, y si existe una penalización KL o un regulador equivalente.

## Los ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ configuración `beta = 0.0`, informe 200 pasos de PPO 后的行动分布──用一段话解释模式寻找行为──

2. Modificar el modelo de recompensa, hacer que la acción B tenga un sesgo de +0,5`beta = 0.1`¿La penalización PPO-KL ha impedido la política de utilización de este sesgo?`beta`¿La explotación comenzó a aparecer?

3. 阅读 Ouyang et al.(arXiv:2203.02155) Figura 1― 通过运行 PPO 1、5、20、100 pasos,并测量相对SFT modelo de preferencia,复现标签-preferencia curva―

4. 论文 Sección 4.3 报告 1.3B InstructGPT 击败 175B GPT-3 el porcentaje es de aproximadamente 70%―¿Por qué este porcentaje en las solicitudes de producción ocultas 上会高于标签师 自己的提示?

5. En los mismos datos de preferencia arriba, se sustituye la pérdida de PPO por DPO (Fase 10 · 08) ―― Compare la política final a la derivación de KL de SFT) y la recompensa final―En la recompensa coincidente abajo, ¿qué tipo de método se deriva más lejos?

## Términos clave

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| SFT | “instruction tuning” | Stage 1：在 prompt-response pairs 上用 cross-entropy fine-tune |
| Reward model | “the RM” | 在 (prompt, response) 上的 scalar regressor，使用 Bradley-Terry 在 pairwise labels 上训练 |
| Bradley-Terry | “pairwise preference loss” | -log sigmoid(r_w - r_l)；把 pairwise ranking 约简为 binary classification |
| KL penalty | “the regularizer” | `beta * KL(pi \|\| pi_SFT)` — 让 RL policy 保持接近 SFT anchor |
| PPO-ptx | “PPO with pretraining mix” | 向 PPO objective 加入一部分 pre-training log-likelihood，用来抵消 alignment tax |
| Alignment tax | “the RLHF regression” | RLHF 之后，在 RLHF 未针对的标准 benchmarks 上下降 |
| Labeler preference | “the ground truth” | human rankings 的样本；RM 是它的 statistical proxy，而不是 “human values” 的 proxy |

## Leer más

- [Ouyang et al. — Training language models to follow instructions with human feedback (arXiv:2203.02155)](https://arxiv.org/abs/2203.02155) Instrucción de papel de GPT, también después de cada articulo del oleoducto RLHF
- [Stiennon et al. — Learning to summarize from human feedback (arXiv:2009.01325)](https://arxiv.org/abs/2009.01325) RLHF-para resumen de la situación
- [Christiano et al. — Deep reinforcement learning from human preferences (arXiv:1706.03741)](https://arxiv.org/abs/1706.03741) Formulación de RL basada en preferencias
- [Bai et al. — Training a Helpful and Harmless Assistant with RLHF (arXiv:2204.05862)](https://arxiv.org/abs/2204.05862) Extensión de HH de la tubería de la Antropic GPT de Instruct
