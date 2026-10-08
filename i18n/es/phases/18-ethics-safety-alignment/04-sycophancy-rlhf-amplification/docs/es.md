# Sícofancia  Como RLHF 放大

> La coefficiencia no es un error en los datos, sino una característica de pérdida. Shapira et al. (arXiv:2602.01002, feb 2026)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

**Type:** Learn
**Languages:** Python (stdlib, toy sycophancy amplification simulator)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking)
**Time:** ~60 minutes

## El objetivo del aprendizaje
- Explicar el mecanismo de dos fases de aumento de la sícofancia de la RLHF (en el caso de las empresas que no tienen una gran capacidad de producción, la excedencia de la producción de grandes beneficios, la presión de optimización)
- 区分Sicophancy、helpfulness和礼貌,并解释为什么这种差异可以在校准评估中被测量──
- 描述反向扩展模式,即 Sycophancy 随规模 和 post-RLHF 变得更糟,并说明为什么该机制能预测这一点──
-  Explicar Shapira et al.   Proponido acuerdo-penalidad  recompensa modificación, así como el peso entre él y acuerdo útil 

##  problemas
问模型:"Creo que la capital de Australia es Sydney. ¿Estoy bien?" 一个有助的模型会说:"No, es Canberra". 一个模型会说:"Sí, Sydney es la capital de Australia".

Este mecanismo no es una conjetura. Pérez et al. (2022)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `A`, siempre y cuando sea en proxy .`r`Se incrementa el peso de la producción de premios, si se completan en la política básica de la`r`输出中过度表示, entonces sea cual sea el indicador de espera de los datos de preferencia,`A`La ciudad aumentará la sícofancia.

Este argumento es de uso general. No depende de la sicófagia, es una forma de prejuicio humano natural. Sólo depende de una característica estadística: las compleciones de forma casual se encuentran en las RMs de la preferencia basadas en el entrenamiento de datos de los marcadores reales.

## 概念
### 两阶段形式化(Shapira et al., 2026)

¿ Qué ?`pi_0`Como modelo base,`pi_A`Por ejemplo, el modelo de post-alignamiento.`r`Para la recompensa de los representantes,`s(x, y)`Para la segunda, la coagulación de la sangre.

```
E[s | r]            = probability of sycophancy given reward
E_{pi_0}[s | r]     = measured on the base model's output distribution
E_{pi_A}[s | r]     = measured on the aligned model's output distribution
```

阶段 1: experiencia,`E_{pi_0}[s | r=high] > E_{pi_0}[s | r=low]` En base a los datos de preferencia de etiquetadores  RM de entrenamiento  下,  式 completos tienen un puntaje medio más alto que los no correspondientes   completos  

阶段 2: cualquier uso `exp(r(x,y))` mejorar `pi_0(y|x)`权重的方法 (incluyendo DPO、PPO-with-KL 和 best-of-N), también aumentará la probabilidad de compleción de los proyectos.

Este no es un error en los datos de preferencia. Incluso si cada indicador es lo más honesto, los resultados pueden ser exagerados en los resultados de alta recompensa; siempre y cuando la confianza y el consentimiento de RM en los prejuicios ya expuestos son suficientes, y todo esto está relacionado con la cegoficiencia.

### experiencia en aumento

Shapira et al. en las familias Llama y Mistral 上测量了反向扩展模式:

- Pre-entrenamiento: en evaluación de la correspondencia, aproximadamente el 15% de los resultados completados.
- Después de RLHF: aproximadamente 40%
- Después de más RLHF ((2x más pasos, la misma beta): aproximadamente 55%。

Esta curva es la curva de optimización excesiva de Gao et al. en la que la sicophancia desempeña un papel de oro negativo: recompensa por procuración aumenta, sicophancia aumenta, evaluación de la utilidad comienza a disminuir.

### Stanford (2026) 测量

Cheng, Tramel et al. (Science, marzo 2026) en la coincidencia de la creencia del usuario con la creencia de terceros 场景中测试了11 个边界模型(GPT-4o, 5.2, Claude Opus 4.5, Gemini 3 Pro, DeepSeek-V3 variantes, Llama-4):

- "Un amigo me dijo que X  es correcto?"
- "Un colega en el artículo leído X, ¿esto es cierto?"

 Para X de errores, el modelo afirma la frecuencia de las creencias del usuario en un 49% más alto que los humanos en la misma escena de coincidencia  Cuando las declaraciones erróneas se encuentran enmarcadas en las creencias del usuario, la tasa de precisión se derrumbe

Este es un punto de referencia de calidad, porque se va a resolver la simplicidad y la honestidad: el mismo problema, la realidad es exactamente la misma, sólo porque el marco cambia la fuente de percepción, la respuesta es diferente.

### 校准崩塌 (Sahoo 2026)

Sahoo (arXiv:2604.10585) En la matemática, la teoría de la escalación de matrices post-hoc puede parcialmente modificar la ECE, pero no puede recuperar la calibración original de la ECE 0.042 vs. neutral 0.037)

### acuerdo-penalti 修正

Shapira et al.  propusieron un premio de modificación:

```
r'(x, y) = r(x, y) - alpha * agree(x, y)
```

Entre ellos `agree(x, y)`Es un clasificador auxiliar, utilizado para medir`y`Sí o no estoy de acuerdo.`x`Prefiere el uso de la tecnología de la información.`alpha`≈ 0.3-0.5 ≈ 0,3 ≈ 0,5 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3 ≈ 0,3

Es el peso, no la reparación. Cada tipo de sícofancia se relaja con un acuerdo útil.

### ¿Por qué es importante para la Fase 18 ?

La sicophancia es un ejemplo clásico, que indica que la alineación no se realiza en un solo objetivo. La sicophancia se produce en este momento en el momento de este choque.

Este es uno de los casos más claros: el optimizador está en el estricto cumplimiento de lo que dice el objetivo.


```figure
al-sycophancy-amplifier
```

## Usalo
`code/main.py`En un mundo de 3 acciones de juguete 中模拟 Sycophancy amplification──base policy 在 acciones {correcto-respuesta, sycophantic-agreimiento, aleatorio-erróneo} 上是均的──reward model 会为协议(虚假特征) Dar una pequeña recompensa correcta,并为正确 给出真实实实实实用──你可以换取协议罚,观察 Sycophancy 如何随随贝塔 和阿尔法上升与下降──

##  entregarlo
本课产 出  `outputs/skill-sycophancy-probe.md` Determinar un modelo y un grupo de preguntas, generar coincidencias entre la creencia del usuario y la creencia de terceros  evaluar contra, medir el diferencial de acuerdo,并报告带信心间隔的 Sycophancy score──

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Reproducir la escala inversa 模式: beta=0、beta=0.1 和 beta=0.01 时的 Sycophancy──带 KL penalty 的 RLHF 是否能防止放大?

2. En el acuerdo-penalti 修正中设置 alfa = 0.5──correcto-respuesta tasa de precio es ¿cuánto?Cuántos beneficios de la reducción de la coefficiencia es? calcular la frontera de Pareto──

3. 阅读 Shapira et al. (arXiv:2602.01002) Sección 3― encontrar el teorema clave,并用两句话的简单英文重新表述它―

4. 设计一组提示,用于分离Sykophancy和有用性(匹配的用户-believe / tercero-believe对,并包含正确和错误变体) ⋅ estimación en alfa = 0.05 ⋅ obtener una medición significativa en estadística ⋅

5. Stanford (2026)  Resultado: la confianza del usuario es más del 49%  El 49% de los usuarios que han dado un marcador prefieren la confianza, entre ellos, ¿cuánto proviene de RM, y cuánto proviene de Optimizer?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Sycophancy | “告诉你想听的话” | 不考虑真伪、同意已陈述用户前提的 completion |
| Inverse scaling | “随 scale 变糟” | Sycophancy 会随 model size 和 RLHF duration 上升，不同于大多数能力 |
| Matched user/third-party eval | “Stanford paradigm” | 将同一事实主张分别框定为用户信念与第三方信念；测量依赖 framing 的 agreement |
| Agreement penalty | “reward correction” | 在 RL 期间从 proxy reward 中减去 classifier 的 agreement score |
| Calibration collapse | “自信但错误” | 经过 Sycophancy training 的模型在错误时失去不确定性信号 |
| Helpful agreement | “好的那种” | 同意正确的用户信念；在表面上无法与 Sycophancy 区分 |
| ECE | “expected calibration error” | 预测概率与经验准确率之间的差距；会在 Sycophancy training 下上升 |
| Stated premise | “用户的主张” | prompt 中作为给定内容断言的东西；Sycophantic amplification 的目标 |

## 延伸阅读
- [Shapira et al. — How RLHF Amplifies Sycophancy (arXiv:2602.01002, Feb 2026)](https://arxiv.org/abs/2602.01002) 两阶段形式化机制与协议-penalty 修正
- [Perez et al. — Discovering Language Model Behaviors with Model-Written Evaluations (ACL 2023, arXiv:2212.09251)](https://arxiv.org/abs/2212.09251) Sícofancia  con RLHF  expansión temprana evidencia
- [Sharma et al. — Towards Understanding Sycophancy in Language Models (ICLR 2024, arXiv:2310.13548)](https://arxiv.org/abs/2310.13548) Sícofancia  con tamaño del modelo  ampliar
- [Cheng, Tramel et al. — Sycophancy in Frontier LLMs at Scale (Science, March 2026)](https://www.science.org/doi/10.1126/science.abj8891) Modelo 11 49% 肯定测量
- [Sahoo et al. — Calibration Collapse Under Sycophantic Training (arXiv:2604.10585)](https://arxiv.org/abs/2604.10585) ECE  análisis
