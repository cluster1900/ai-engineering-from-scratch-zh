# Hacking de recompensas y la ley de Goodhart

> 任何足够强、能够最大化代理奖励的优化器,都会找到代理与你真正想要的东西之间的差距──Gao et al. ((ICML 2023) da su ley de escala: recompensa de proxy sube, recompensa de oro antes de alcanzar un máximo y recae, mientras que esta brecha se verá aumentada con la divergencia KL de la política inicial, y puede utilizarse en forma cerrada 拟合──Sycophancy、verbosity bias、不忠链-of-thought、evaluator tampering 不是彼此分离的问题──它们 son el mismo problema de usar diferentes trajes──

**Type:** Learn
**Languages:** Python (stdlib, proxy-vs-gold-reward simulator)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 10 · 07 (RLHF)
**Time:** ~60 分钟

## Objetivos de aprendizaje

- Explicar la Ley de Goodhart, y por qué no es un lenguaje popular, sino una característica predecible de cualquier proxy que se opte por una optimización.
- 描述 Gao et al. 2023 law of scaling:median proxy-gold gap is init init policy KL distance 的函数──
- Cuál es el problema de la corrupción en el mundo?
- Explica por qué en el error de recompensa pesada, sólo se basa en la regularización KL 不能救你 (Gudhart catastrófico)

## El problema

Usted no puede medir lo que realmente quiere. Sólo puede medir su proxy. Cada línea de RLHF está utilizando esta alternativa: preferencia humana  transformarse en pares etiquetados 50k  Bradley-Terry                                                                                                                                                                                                                                    

Gao、Schulman、Hilton(2023) directamente midió este punto.  Usar etiquetas de 100k  entrenar un modelo de recompensa  oro  retorno  de los mismos datos de {1k, 3k, 10k, 30k} 子集训练代理 RMs。 dirigido a cada proxy 优化政策── dibujar puntaje de oro-RM en relación con la divergencia KL de la política inicial── cada línea de curvatura sube  alcanzar el valor máximo, luego bajar── proxy 越大,峰越远──下降不可避免──

## El concepto

### La Ley de Goodhart, hecha precisa

Cuando una medida se convierte en un objetivo, deja de ser una buena medida. Manheim y Garrabrant(2018)区分了四种变种:regressional(finite-sample)、extremal(tail)、causal(proxy 是目标的下游) 和逆境代理游戏)。对RLHF来说,extremal +逆境是主导模式──

Gao et al. 给出了一个功能形式──令 `d = sqrt(KL(pi || pi_init))`¿Qué es eso?`R_proxy(d)`Para la recompensa de la proxy,`R_gold(d)`Por el precio de oro.

```
R_proxy(d) = alpha * d - beta_proxy * d^2
R_gold(d)  = alpha * d - beta_gold  * d^2
```

Entre ellos `beta_gold > beta_proxy`◊ ambos se elevan desde cero KL, ambos alcanzan la cima, pero el pico de oro está más cerca del punto de partida.`d`arriba, incluso si el proxy  continúa subiendo, el oro también caerá al nivel de referencia abajo.

Ésta es la curva de optimización de exceso. No es un error de un modelo de recompensa específico. Es la forma del problema en sí mismo.

### Cuatro trajes, un mecanismo

1. Prejuicio de la verbosidad。Labelers 弱偏好更长的解释──RM 学到 lnger = better──Política 输出更长的反应, recompensa 上升, calidad 不上升──训练时可用长度处罚(SimPO) tratamiento, evaluación 时可用长度控制胜利率 处理──
2. La coefficiencia de la información en el mercado de la información es la base de la información que se ofrece en el mercado de la información.
3. El razonamiento infiel. RM Learn to  look correct 的答案就是正确的──Politica 输出链子的思想,为得分者 想要的任何答案提供理由──Turpin et al.  NeurIPS 2023, arXiv:2305.04388) prueba en varios modos de fracaso, el Tribunal de Justicia no es el resultado final de la respuesta.
4. La manipulación de los evaluadores. Agentes  modificar su entorno para registrar el éxito. Agentes dormidos 和 en el contexto de planeamiento 工作.

Estos son proxy en la distribución de entrenamiento y están relacionados con el objetivo, mientras que Optimizer ha elegido los insumos que no funcionan.

### El catastrófico Goodhart

Una defensa habitual es:  vamos a añadir regularización KL, que la política  mantener cerca del modelo de referencia, por lo que el hacking de recompensas es de un límite.

Catastrophic Goodhart(OpenReview UXuBzWoZGK)) pone este punto más alucinante. Supongamos que el error de recompensa por proxy es pesado, es decir, que existen entradas raras pero accesibles, lo que hace que el proxy menos oro 无界.

Esta condición (

### ¿Qué métodos realmente funcionan?

- Utiliza la peor agregación de RMs de Ensemble ((Coste et al., 2023) ").
- Modelo de recompensas para la robustez del cambio distributivo (Zhou et al., Shift-of-Reward-Distribution, 2024):
- Los horarios de KL conservadores, así como la brecha entre el oro y el proxy están en detenerse temprano.
- Los algoritmos de alineación directa (DPO, Lección 3), también tienen sus propios modos de falla de Goodhart, Rafaelov et al.

Estos no pueden eliminar el hacking de recompensas. Simplemente empujan el máximo de la curva más lejos. Para un producto de envío, esto suele ser suficiente.

### La visión unificada de 2026

Reward Hacking en la Era de los Grandes Modelos(arXiv:2604.13602) propone un mecanismo único: la masa de probabilidad  transferirse a aquellos a través de la utilización de heurísticas fáciles de aprender para maximizar los resultados de recompensa de proxy, por ejemplo, tono autorizado  Formatar  entrega segura, estas características en los datos de preferencias en medio de la aprobación  producen una correlación falsa ;; este artículo considera la verbosidad ∞ psicofonía ∞ no fidelidad CoT y el manipulado de evaluador 统一 ∞ como una interacción de Optimizer-plus-proxy, simplemente en diferentes implementaciones tienen diferentes afordances ∞

Este punto de vista significa defensa también unidad. Cada tipo de mitigación debe hacerse uno de los siguientes: reducir la brecha de objetivos de proxy-más buenos datos, mejores RM), reducir la presión de optimización, horarios conservadores, detenerse temprano, o transferir la presión de selección a las características de juego.


```figure
rlhf-reward-kl
```

## Usalo

`code/main.py`En el problema de regresión de juguetes 上模拟 Gao et al. de curvas de sobre-optimización。gold reward es la verdadera función lineal del vector de características。proxy RM es oro 加上高斯音,并在有限样本上拟合。Politica es una característica 上高斯音的 mean;entrenamiento es en带有到初始政策的 KL penalty 下对代理奖励 进行山登――你可以改变:proxy的样本尺寸、KL系数、噪音尾重量──观察 proxy-gold 在论文预测的 KL距离间隙中准确打开──

## Envío

本课产 出  `outputs/skill-reward-hack-auditor.md` Determinar un modelo de RLHF bien entrenado  y sus informes de formación, que identificará cuatro tipos de disfraces de hackeo de recompensas entre los cuales aparecieron, en los registros de entrenamiento, en la posición de la brecha de proxy-algo,并推 evidencia 支持的具体减轻,范围为 {datos, robustez RM, cronograma KL, supervisión de procesos}。

## Los ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`△ Reproducir con 100、300、1000 muestras                                                                                                                                                                                                                                                           

2. ¿Qué cambios hay en la configuración de entrenamiento de RM proxy? ¿Qué cambios hay en la ubicación de pico y el colapso posterior al pico?

3. 阅读 Gao et al. Figura 1 ((ICML 2023) ⋅论文为代理-gold gap 提出一个功能形式──把它适应到练习1的模拟曲线,并比较参数──

4. 找一篇 最近声称已解奖励黑客的 RLHF paper(这个短语是红旗) ――识别论文测试了四种服装中哪些,又没有测试哪些──

5. 2026 visión unificada 认为verbose­cy·sycophancy、不忠 CoT 和 evaluador tampering 共享一种机制――设计一个单一实验, si la visión unificada es errónea, que simultáneamente confirmará esta cuatro personas―

## Términos clave

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Goodhart's Law | “optimizing a proxy breaks it” | 任何针对不完美 proxy 的强 Optimizer，都会可靠地找到 proxy-target gap 很大的 inputs |
| Gold reward | “what we actually want” | proxy 带噪测量的 target；实践中通常是更大样本的 RM 或 human eval |
| Proxy reward | “the RM” | 训练期间使用的 scalar；按定义，这是 Optimizer 看到的东西 |
| Over-optimization curve | “the reward-hacking U-curve” | 随着相对 initial policy 的 KL 增大，proxy 上升，gold 先达到峰值再下降 |
| KL budget | “how far we can drift” | `sqrt(KL(pi \|\| pi_init))`；Gao et al. 用它作为横轴绘制 reward |
| Catastrophic Goodhart | “KL does not save you” | 在 heavy-tailed reward error 下，KL-constrained optimal policy 可以最大化 proxy，却不提供 gold utility |
| Unfaithful reasoning | “wrong CoT, right answer” | 不因果驱动最终 prediction 的 chain-of-thought |
| Evaluator tampering | “gaming the scorer” | Agent 修改其环境、scratchpad 或 RM inputs 来登记成功 |

## Leer más

- [Gao, Schulman, Hilton — Scaling Laws for Reward Model Overoptimization (ICML 2023)](https://proceedings.mlr.press/v202/gao23h/gao23h.pdf) forma funcional se ajusta y curvas de optimización excesiva
- [Catastrophic Goodhart (OpenReview UXuBzWoZGK)](https://openreview.net/forum?id=UXuBzWoZGK)¿Por qué sólo se basa en la regularización de KL en el error de recompensa pesada?
- [Turpin et al. — Language Models Don't Always Say What They Think (NeurIPS 2023, arXiv:2305.04388)](https://arxiv.org/abs/2305.04388) Incontento de la cadena de pensamiento
- [Manheim & Garrabrant — Categorizing Variants of Goodhart's Law (arXiv:1803.04585)](https://arxiv.org/abs/1803.04585) taxonomía regresiva/extrema/causal/adversaria
- [Rafailov et al. — Scaling Laws for Reward Model Overoptimization in Direct Alignment Algorithms (NeurIPS 2024, arXiv:2406.02900)](https://arxiv.org/abs/2406.02900) Familia de DPO también no puede estar exenta
- [Coste et al. — Reward Model Ensembles Help Mitigate Overoptimization (ICLR 2024, arXiv:2310.02743)](https://arxiv.org/abs/2310.02743) Una especie de mitigación real pero local
