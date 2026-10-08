# Evaluación de la capacidad de uso dual de la WMDP

> Li et al., "El índice de referencia de WMDP: medición y reducción del uso malicioso con el desaprendizaje" (ICML 2024, arXiv:2403.03218)。 abarca la bioseguridad (1.520)、ciberseguridad (2.225) y química (412) 4.157 temas de elecciones  El problema se encuentra en la "zona amarilla"                                                                                                                                                                                                                  

**类型：**El aprendizaje
**语言：**Python (stdlib, arnés de evaluación de elevación en forma de WMDP)
**先修要求：**Fase 18 · 16 (herramientas de equipo rojo), Fase 14 (ingeniería de agentes)
**时间：**- 60 minutos

## El objetivo del aprendizaje

- Describir los tres ámbitos de la WMDP, el número de problemas y la "zona amarilla" selección de estándares.
-  Explicar RMU, y por qué WMDP es tanto evaluación como referencia de no aprendizaje
- 描述 2024-2025 的升起 叙事:"轻微升起" -> "处于临界点" -> "不足以排除ASL-3"──
- 区分相对新手的升级 和专家绝对能力──

##  problemas

双用途能力是每个实验室前沿安全框架 (LECCIÓN 18) 下面测量问题──问题是: ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿

## 概念

### "zona amarilla"

Estos problemas requieren conocimiento acerca de la proximidad de los procesos nocivos, pero no de la preparación directa de la composición. "¿Qué reactivo  catalisa [camino publicado] en el cuarto paso?" y no "Cómo fabricar [compuesto peligroso]?" Cada problema fue revisado por expertos de varios campos, y pasó por ITAR/EAR.

 total de 4.157 problemas de la vía:
- Bioseguridad: 1.520
- Seguridad cibernética: 2.225
- Química: 412

Muchos modelos de selección. El modelo no se requiere que asista a nada; por lo tanto, se puede medir la capacidad en caso de no provocar comportamientos nocivos.

### RMU  Representación Desorientamiento para el Desaprendizaje

配套的不学习方法──应用于LLaMa-2-7B 后, se reducirá el porcentaje de WMDP hasta acercarse a la oportunidad, al mismo tiempo que se mantendrá en unos pocos cientos de puntos 配套的不学习方法──已发表的方法是随后的每篇生物化学网络不学习论文的不学习基线──

### 2024-2025 elevación 叙事

Tres etapas:

1. **2024 "轻微 uplift"。**OpenAI y Anthropic  Early Preparedness/RSP  evaluación report, para los nuevos usuarios de las tareas bioadjacentas, los modelos tienen pequeñas ventajas en comparación con la búsqueda en Internet.

2. **2025 年 4 月 "处于临界点"。**OpenAI's Preparedness Framework v2  reportó que el modelo "está en un sentido para ayudar a los nuevos a fabricar puntos críticos de amenazas biológicas conocidas"― esto no es una declaración de capacidad, sino una advertencia de que el punto crítico ya está cerca―.

3. **Anthropic 的 2025 生物武器获取试验。**Un estudio de nuevos participantes, que incluye la evaluación de la tasa de éxito de las tareas de la fase de obtención, ha reportado un aumento de 2,53 veces.

### Por el contrario, el juego es un juego de cartas.

Un cambio clave:

- **相对于新手的 uplift。**¿Cuál es la gran ayuda del modelo para los no expertos? Es la cantidad de multiplicadores.
- **专家绝对能力。**¿Cuánto información puede generar el modelo en el máximo esfuerzo?

Seguridad casos (LECCIÓN 18) a la vez dirigida a ambos: "El modelo no puede dar a los nuevos un elevado nivel suficiente para ejecutar" Además "los expertos no pueden extraer información no pública del modelo"".

### 测量陷

WMDP es un agente de capacidad, no una medida de implementación. Un modelo de WMDP con un puntaje alto, en la práctica, depende de si puede ser utilizado por los nuevos usuarios:
- 引出抗性(不触发安全过器而取出能力有多难) 没有触发安全过器而取出能力有多难)
- 默会知识 (necesita de habilidades de laboratorio húmedo y no de información)
- 执行障碍(采购、设备) y el uso de los dispositivos de la empresa

El experimento de obtención de armas biológicas de 2025 de Anthropic se ha incorporado a la nueva estrategia de capacidad de tipo WMDP: mide la tasa de éxito de tareas reales, en lugar de la capacidad de múltiples opciones.

### Está en la fase 18

Lecciones 12-16 es sobre el modelo de ataque y defensa de los instrumentos. Lección 17 es capacitación de doble uso de la capacitación de la capacitación de los marcos de seguridad fronteriza.


```figure
al-wmdp-yellow-zone
```

## Usalo

`code/main.py`Construir una versión de juguete de WMDP en forma de arnés de evaluación. Un modelo simulado se encuentra en el grupo de preguntas de prueba.

##  entregarlo

本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-wmdp-eval.md` Dedicar una declaración de capacidad de doble uso ("Nuestro modelo no ayudará significativamente a los comportamientos relacionados con las armas biológicas"), que revisará: qué puntos de referencia se han ejecutado, evaluará qué métodos se han utilizado para rechazar la realización de las operaciones (completado en bruto vs. puenteado en política), así como si el estudio se ha completado con múltiples resultados de selección.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Reporting 步骤前后各领域精度──解释通用能力权衡──

2. Para jugar WMDP  aumentar el cuarto campo  por ejemplo radiológico  especificar dos tipos de zonas amarillas  Exemplaridad del tipo de problemas  Explicar por qué escribir este tipo de problemas es más difícil  Problemas más difíciles 

3. 阅读WMDP 2024 Sección 5 (RMU metodología) 勾勒一种更简单的不学习方法 (por ejemplo, dirigido a áreas de contenido que inhiben las neuronas de la parte superior de la membrana),并描述其预期的通用能力成本──

4. Informe de experimentación de obtención de armas biológicas de Anthropic 2025 2.53x elevación. Describe este número de dos formas de posible dependencia de la cantidad de muestras nuevas.

5.  Explicar los casos de seguridad de ASL-3 en el proceso de desaprendizaje de WMDP  además de lo que se necesita  Nombrar al menos dos estudios complementarios 

## 关键术语: "El hombre es un hombre"

| Term | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| WMDP | "双用途 benchmark" | yellow zone 中跨 bio/cyber/chem 的 4,157 道 MCQ 问题 |
| Yellow zone | "促成但非合成" | 邻近有害能力的接近性知识，但不是合成配方 |
| RMU | "unlearning baseline" | Representation Misdirection for Unlearning；降低 WMDP 分数，同时保留通用能力 |
| Novice-relative uplift | "它对非专家有多大帮助" | 对新手而言，相比现状 internet search 的乘法优势 |
| Expert-absolute capability | "专家的上限" | 有动机的专家可从模型中提取的最大信息量 |
| Acquisition-phase task | "合成前的步骤" | 采购、设备、许可 —— 危害路径最早期的部分 |
| ITAR/EAR | "出口管制合规" | 约束某些促成性知识发布的法律框架 |

## 延伸阅读

- [Li et al. — The WMDP Benchmark (arXiv:2403.03218, ICML 2024)](https://arxiv.org/abs/2403.03218) referencia y RMU 论文
- [OpenAI — Preparedness Framework v2 (April 15, 2025)](https://openai.com/index/updating-our-preparedness-framework/) "处于临界点" de la expresión "Estamos en el punto de referencia"
- [Anthropic — Responsible Scaling Policy v3.0 (February 2026)](https://www.anthropic.com/responsible-scaling-policy) ASL-3 bio value y resultados de los ensayos obtenidos
- [DeepMind — Frontier Safety Framework v3.0 (September 2025)](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) CCL de elevación biológica
