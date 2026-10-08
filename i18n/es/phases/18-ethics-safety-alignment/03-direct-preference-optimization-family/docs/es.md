# Optimización de preferencias directas Familias

> Rafailov et al. (2023) demostraron que la mejor solución de RLHF puede utilizar datos de preferencias 写成闭式形式, por lo que se puede saltar el modelo de recompensa evidente, política de optimización directa. Este intuitivo ocasionó una familia:IPO,KTO,SimPO,ORPO,BPO, cada método ha reparado un modo de fracaso de DPO.

**Type:** Learn
**Languages:** Python (stdlib, 六种 preference-loss comparator)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking), Phase 10 · 08 (DPO basics)
**Time:** ~75 分钟

## Objetivos de aprendizaje

- Desde la RLHF de KL de la DPO 闭式形式──
- Explicar el IPO, KTO, Simpo, ORPO, BPO, cada uno de ellos ha modificado el modo de falla del DPO.
- 区分implicit reward gap和preference strength,并解释PIPO identidad de mapas ¿Por qué es importante
-  Explicar por qué Rafailov et al. (NeurIPS 2024)  probar DAAs incluso sin RM evidente también se optimizarán demasiado。

##  problemas

Objetivo del RLHF:

```text
max_pi E_{x,y~pi} [ r(x, y) ] - beta * KL(pi || pi_ref)
```

Hay una mejor solución:

```text
pi*(y|x) = (1/Z(x)) * pi_ref(y|x) * exp(r(x, y) / beta)
```

Por lo tanto, la recompensa se define en términos de política óptima y de referencia:

```text
r(x, y) = beta * log(pi*(y|x) / pi_ref(y|x)) + beta * log Z(x)
```

Lo cambiamos a la probabilidad de preferencia Bradley-Terry, después, la función de partición.`Z(x)`¡Me voy a matar!`x`¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡

 problema reside en: este teorema de la hipótesis de la preferencia es en distribución, y la política de referencia es el verdadero anclaje de modo. Estas condiciones no tienen una existencia completa.

## 概念

### DPO (Rafailov y otros, 2023)

```text
L_DPO = -log sigmoid(
  beta * log(pi(y_w | x) / pi_ref(y_w | x))
  - beta * log(pi(y_l | x) / pi_ref(y_l | x))
)
```

Puede que haya un error:

- la brecha implícita de recompensas `beta * (log(pi/pi_ref)_w - log(pi/pi_ref)_l)`Es un poco pequeño, pero también puede haber una gran brecha.
- Esta pérdida se elege y los log-probos rechazados se vuelven en dirección opuesta.
- Las preferencias fuera de distribución (recurso de muestras raras a muestras raras) generarán recompensas implícitas arbitrarias.

### El mercado de la inversión se ha convertido en un mercado de inversión.

Optimización de preferencias de identidad Usando la probabilidad de preferencias                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

```text
L_IPO = (log(pi(y_w | x) / pi_ref(y_w | x)) - log(pi(y_l | x) / pi_ref(y_l | x)) - 1/(2 beta))^2
```

margen 被`1/(2 beta)`限定──preferencia fuerza con la diferencia implícita-recompensación 成比例── no se va a romper──

### KTO (Ethayarajh et al., 2024)

La optimización de Kahneman-Tversky  completamente elimina la estructura ⋅ para determinar una salida de un único marcador, así como una señal deseable o undesirable de un segundo, que se proyecta a la utilidad de la teoría de perspectivas:

```text
v(x, y) = sigma(beta * log(pi(y|x) / pi_ref(y|x)) - z_ref)
```

No se trata de ganancias y pérdidas. Utiliza diferentes peso y aversión a la pérdida.

### SimPO (Meng et al., 2024)

Optimización de preferencias simples 让训练信号与生成过程对齐―― total eliminación de la política de referencia,并按长度归纳化日志-概率:

```text
L_SimPO = -log sigmoid(
  (beta / |y_w|) * log pi(y_w | x)
  - (beta / |y_l|) * log pi(y_l | x)
  - gamma
)
```

Margen de uso`gamma`Para estabilizar el entrenamiento, la longitud se ha reducido a la de la utilización de la motivación de la modalidad de fracaso de la longitud de la DPO.`y_w`El log-prob gap (Log-prob gap)

### ORPO (Hong et al., 2024)

Optimización de preferencias en la probabilidad de registro negativo de SFT estándar 上添加一个优先语句:

```text
L_ORPO = L_NLL(y_w) + lambda * L_OR
L_OR = -log sigmoid(log(odds(y_w) / odds(y_l)))
```

 no hay política de referencia, el término SFT es un regulador desde el modelo base hasta el modelo alineado sólo se necesita un entrenamiento en un solo paso

### BPO (envía ICLR 2026 OpenReview id=b97EwMUWu7)

识别了 Degraded Selected Responses 问题:DPO 会保持排序 `y_w > y_l`Pero ...`y_w`El BPO aumentó una sola corrección, a la respuesta elegida de la disminución de la movilidad aplicada castigo. Según el informe, en la tarea de cálculo matemático de Llama-3.1-8B-Instruct, la tasa de precisión de DPO aumentó +10.1% en comparación.

### 通用结论: los DAAs  todavía se optimizan demasiado

Rafailov et al. Leyes de escala para la sobreoptimización del modelo de recompensa en algoritmos de alineación directa (NeurIPS 2024) 在多个数据集和不同 KL presupuestos 下, con políticas de entrenamiento DPO、IPO、SLiC。golden-reward-vs.KL 曲线呈现出与Gao et al. 相同的峰值和崩形──隐含奖励在训练期间查询出发行样本;KL regularization 无法稳定这一点──

Los DAA no han escapado de Goodhart. Simplemente han cambiado la superficie de los problemas de los usuarios desde un modelo de recompensa.

### ¿Cómo elegir?

- Si tienes una gran cantidad de datos de preferencias emparejadas: utiliza DPO de beta conservado; si la longitud del paridad es evidente, entonces usa SimPO。
- Si tienes un feedback binario sin parejas: KTO。
- Si quieres salir del modelo base de la tubería de un solo paso:
- Si en los registros de DPO se ven degradados log-probos elegidos: BPO.
- Si las fuerzas de preferencia  diferencia muy grande y DPO está en el momento  y:IPO:

Cada laboratorio se ejecutará en un grupo de evaluaciones completando estos cinco métodos, y luego seleccionará el ganador según las tareas.


```figure
dpo-margin
```

## Usalo

`code/main.py`En un conjunto de datos de preferencias de juguete, comparamos seis tipos de pérdidas (DPO,IPO,KTO,Simpo,ORPO,BPO), entre las cuales la verdadera fuerza de preferencia se varia con el par de cambios. Cada pérdida se encuentra en la misma muestra de 500 pares.

## Envío

本课产 出  `outputs/skill-preference-loss-selector.md` dados datos de conjunto de estadísticas (pareados vs. sin parejas, variables vs. uniformes de la fuerza de preferencia, distribución de longitud) y objetivos (singular-estadio o SFT-then-preferencia),

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` reportar la caída final de registro-prob de DPO y BPO.

2.  Modificar los datos de preferencias, hacer que todos los pares tengan la misma fuerza 六种方法中哪一种最强?哪一种退化?

3. 让拒绝的答案的平均长度变成所选择的2倍――在不改变其他任何内容的情况下, utiliza el valor numérico para mostrar la explotación de la longitud del DPO y la modificación del SimPO――

4. Rafailov et al. (NeurIPS 2024) 声称 DAAs 会过优化──复现一个单点版本:绘制选中-减排-拒绝 KL divergencia,并观察大beta 下 DPO的过优化──

5. 阅读 BPO paper abstract (OpenReview b97EwMUWu7) 』写下 BPO 添加到 DPO 的那一行修正──对照 `code/main.py`En el medio de la realización de la confirmación.

## Términos clave

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| DPO | “没有 reward model 的 RLHF” | 从 RLHF 闭式最优解推导出的 loss；只含 policy parameters |
| Implicit reward | “log-ratio” | `beta * log(pi(y\|x) / pi_ref(y\|x))`，也就是 DPO 隐含的 reward |
| IPO | “bounded DPO” | 用 identity 替换 log-sigmoid；implicit reward gap 被 `1/(2 beta)` 限制 |
| KTO | “unpaired DPO” | 在带有 loss aversion 的单标签上使用 prospect-theory utility |
| SimPO | “reference-free DPO” | 长度归一化 log-likelihood + margin；没有 reference policy |
| ORPO | “one-stage DPO” | NLL + odds-ratio preference term；从 base model 单次训练完成 |
| BPO | “chosen-preserving DPO” | DPO 加上对 chosen response 绝对 log-prob 下降的惩罚 |
| Degraded Chosen | “chosen 下降了” | 只要 rejected 下降得更快，DPO 就会降低 chosen log-prob |
| DAA | “direct alignment algorithm” | 任何跳过显式 RM 的 preference-loss 方法 |

## Leer más

- [Rafailov et al. — Direct Preference Optimization (NeurIPS 2023, arXiv:2305.18290)](https://arxiv.org/abs/2305.18290)
- [Azar et al. — A General Theoretical Paradigm to Understand Learning from Human Preferences (AISTATS 2024, arXiv:2310.12036)](https://arxiv.org/abs/2310.12036) OPI
- [Ethayarajh et al. — KTO: Model Alignment as Prospect Theoretic Optimization (arXiv:2402.01306)](https://arxiv.org/abs/2402.01306)
- [Meng, Xia, Chen — SimPO (NeurIPS 2024, arXiv:2405.14734)](https://arxiv.org/abs/2405.14734)
- [Hong, Lee, Thorne — ORPO (EMNLP 2024, arXiv:2403.07691)](https://arxiv.org/abs/2403.07691)
- [BPO — Behavior Preservation Optimization (ICLR 2026 OpenReview b97EwMUWu7)](https://openreview.net/forum?id=b97EwMUWu7)
- [Rafailov et al. — Scaling Laws for RM Overoptimization in DAAs (NeurIPS 2024, arXiv:2406.02900)](https://arxiv.org/abs/2406.02900)
