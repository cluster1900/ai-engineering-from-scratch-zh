# STAR, V-STAR, Quieto-STAR  Razonamiento autodidacta

> El último ciclo de auto-reforma se encuentra en la racionalidad 内部──模型生成一段思想链,保留那些得到正确答案的结果,并调整这些结果.

**Type:** 学习
**Languages:** Python (stdlib, bootstrap-loop 模拟器)
**Prerequisites:** Phase 13 · 01-03 (Reasoning and CoT), Phase 15 · 01 (long-horizon 框架)
**Time:** ~60 分钟

##  problemas

El método de razonamiento es recoger rastros de razonamiento escritos por humanos. Esto es costoso y lento, y está limitado a la voluntad humana de escribir una cadena de pensamiento de alta calidad.

STaR (Self-Teught Reasoner, Zelikman et al., 2022) propone un problema: si deja que un modelo redacte sus propias racionalidades, y según las respuestas conocidas les da un par de puntos, ¿cómo?

1. 采样一个推理的痕迹 和答案──
2. Si la respuesta final es correcta, deja este rastro.
3. En los restos que se guardaron arriba de la melodía.
4. ¿Qué es eso?

Es válido. GSM8K y CommonsenseQA también obtienen un aumento sin nuevas etiquetas artificiales. Pero este ciclo tiene una diferencia interna: cualquier razón que produzca una respuesta correcta se mantiene, independientemente de si el razonamiento es fiable. V-STaR (Hosseini et al., 2024) con verificador aprendido

## 概念

### STaR: en efectivo resultado en bootstrap

Desde un modelo base de capacidad de razonamiento de una forma débil ∞ en cada problema de entrenamiento, tomar una razón y una respuesta∞ si la respuesta coincide con el etiquetado, retenir este (problema, razón, respuesta) triple∞ en el conjunto de mantenimiento de la regla del modelo∞.

Hay un cambio importante. Si el modelo nunca puede responder a un problema, este ciclo no puede aprender de él.**rationalization**Para el problema del fracaso del modelo, insertar la respuesta correcta como un consejo, y volver a pedir que el modelo genere una razón que guíe a la respuesta.

El resultado de este estudio fue que el modelo base de GPT-J alcanzó un 72,5% de la GPT-J 6B, cerca de la GPT-3 175B (~73%), mientras que el último se encontraba en la racionalización de marcas artificiales.

### V-STaR: Usado por el DPO  entrenamiento verificador

STaR 会丢弃错误理性――Hosseini et al. (2024) 观察到这些也是数据:每一对 (rational, "es correcto esto") 都可以训练验证者──他们使用正确和错误解法上直接偏好优化来构建排名──在推断时间,采样N 个理性,并选择验证器 排名最高的一个──

报告的差异: en GSM8K 和 MATH 上,相比前的自我改进基线 提升 +4至 +17个百分点, la mayor parte de los beneficios provienen del verificador que se utiliza para la selección de tiempo de inferencia, en lugar de para el ajuste fino del generador adicional.

### Quiet-STAR: cada token de su interno

Zelikman et al. (2024)  propone: si el modelo aprende en cada Token  posición generar una racionalidad interna corta, no sólo en la situación entre el problema y la respuesta, ¿qué pasará? Quiet-STaR  entrenamiento modelo en cada predicción Token  antes de emitir un "pensamiento" oculto, luego a través del peso aprendido, la predicción consciente del pensamiento se mezclará con la predicción de la línea de base 

Resultado:Mistral 7B en el caso de no ajuste específico de tarea, en GSM8K en el nivel de cero-shot  absolutamente el rendimiento aumentó del 5.9%  升级 a 10.9%,CommonsenseQA aumentó del 36.3% 升级 a 47.2% 模型学会了"cuando pensar":困难 Token 会得到更长的内部理性;简单 Token 几乎没有──

### ¿Por qué los tres tienen preocupaciones comunes de seguridad?

Tres métodos utilizan la respuesta final como señal gradiente. Un razonamiento con fallas obtiene la razón de la respuesta correcta, ya sea utilizando el modo de distribución, la conjetura o el uso de un modelo no generalizado.

El verificador de V-STaR                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

### En comparación

| Method | Training signal | Inference cost | Data waste | Known failure mode |
|---|---|---|---|---|
| STaR | 如果正确，则保留 (rationale, answer) | 1x | 丢弃所有错误 rationales | shortcut rationales |
| STaR + rationalization | 上述方法 + 带正确答案提示的重试 | 1x | 更少 | rationalized rationales 可能不可信 |
| V-STaR | STaR + 来自两个类别的 DPO verifier | Nx (best-of-N) | 最小 | verifier 可能强化自信的错误 |
| Quiet-STaR | per-Token rationale + mixing weight | 1.5-3x | 最小 | 仍然是 answer-conditioned Gradient |

### Está en la pila 2026 en la posición central

STaR 已不新了──但这个模式在 2025-2026年到处重现──可验证数学问题上的 RL (DeepSeek-R1, Kimi-k1.5, o1) es la versión ampliada de STaR de respuesta-condicionada Gradient 信号的放大版──Proceso de los modelos de recompensa (Lightman et al., 2023; "Verificemos paso a paso") de OpenAI es un proceso supervisado 替代方案──AlphaEvolve (Lección 3) es el STaR de la cara de los代码, simplemente con el evaluador de programas 替代标签──Darwin Godel Machine (Lección 4) es el STaR de la cara de los agentes 

Comprender que STaR hará que todo esto sea claro... es el menor bucle de auto-mejora posible.


```figure
reflection-loop
```

## Usalo

`code/main.py`会在一个玩具算法任务 上运行模拟 STaR循环── Puedes observar:

- Precisión 如何随随扣轮上升──
- 捷径如何混入:模拟器 contiene una racionalidad "perezosa", tiene un 40% del tiempo en que obtiene la respuesta correcta, pero la generalización es muy diferente.
- Una verificadora (V-STaR 风格) ¿cómo proporcionar ayuda en la inferencia, pero no puede eliminar completamente la introducción de la vía durante el entrenamiento。

##  entregarlo

`outputs/skill-star-loop-reviewer.md` ayudarle en el entrenamiento pre-audit de una propuesta de auto-aprendizaje de razonamiento pipeline。

##  ejercicios

1. 运行模拟器──将快捷路率 设为零,然后设为0.4──尽管两次运行都在训练分布上达到>90%,最终精度会相差多少?

2. 给模拟器添加一个持续的OOD test――从不同分布中抽取问题,并在分发和OOD sets 上评估 bootstrapped model――量化差距――

3. 阅读 Quiet-STaR 论文 (arXiv:2403.09629) Sección 3。分别用三句话解释 "fin de pensamiento" Token 和 mezcla de peso cabeza。

4. Comparar el filtro de mantenimiento si es correcto de STaR con un sistema de sustitución supervisado por procesos, el último se encargará de recompensar independientemente cada paso racional.

5. Design a evaluar, para capturar las raciones de acceso directo del modelo desplegado―no es necesariamente perfecto, pero debe ser capaz de romper el más simple camino de fortalecer el ciclo de STaR―.

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|---|---|---|
| STaR | "Self-Taught Reasoner" | 在得到正确答案的模型生成 rationales 上 fine-tune；重复 |
| Rationalization | "Hinted retry" | 注入正确答案，并在 base model 失败的问题上重新 prompt 生成 rationale |
| V-STaR | "Verifier STaR" | 在正确和错误 rationales 上 DPO-train 一个 verifier，并将其用于 inference-time selection |
| Quiet-STaR | "Per-token rationales" | 在每个 Token 位置生成隐藏 thoughts；与 baseline prediction 混合 |
| Answer-conditioned gradient | "Outcome-based signal" | 训练循环奖励最终答案，而不是 reasoning steps |
| Process reward model | "Step-level verifier" | 在 per-step correctness 上训练的 reward model，而不是 outcome；与 STaR 形成对比 |
| Shortcut rationale | "Right answer, wrong reasoning" | 一个通过无法泛化的模式得到标签的 rationale；STaR 会保留这些 |

## 延伸阅读

- [Zelikman et al. (2022). STaR: Bootstrapping Reasoning With Reasoning](https://arxiv.org/abs/2203.14465) 原始论文──
- [Hosseini et al. (2024). V-STaR: Training Verifiers for Self-Taught Reasoners](https://arxiv.org/abs/2402.06457) 加入用于推理时间选择的DPO verificador。
- [Zelikman et al. (2024). Quiet-STaR: Language Models Can Teach Themselves to Think Before Speaking](https://arxiv.org/abs/2403.09629) por token 内部 rationales。
- [Lightman et al. (2023). Let's Verify Step by Step](https://arxiv.org/abs/2305.20050) modelos de recompensas de procesos,即替代 Gradient 信号。
- [DeepSeek-R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) RL en tareas de validación, STaR  expandiéndose a la formación fronteriza―
