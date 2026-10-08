# Política de escalación responsable antropófica v3.0

> RSP v3.0 se lanzó en 2026 y se ha puesto en vigencia el 24 de febrero de 2023. sustituye la política de 2023  Medidas de alivio de dos niveles: las acciones que se tomen en el conjunto de las reuniones antropológicas, así como los contenidos expresados como recomendaciones de la industria  Incluye RAND SL-4 seguridad estándar  Nuevo aumento de Hojas de ruta de seguridad fronteriza y informes de riesgos, como documentos de rodaje permanente, no como entregas de una sola vez  Eliminación de la promesa de suspensión de 2023  Introducción de R&D-4  Valores: una vez superada esta categoría, Anthropic  Debe publicar una declaración positiva, identificar el riesgo y medidas de alivio  Claude Opus 4.6  No ha superado  En el anuncio de v3.0 de Antropic  El valor de la Antropic  Eliminar este cambio es difícil    Safer RSP 2023  No se clasificará  1.0  Introducción de la categoría de 1.0  Introducción de las promesas de suspensión de la categoría de la ANTropic   Una de la menor vulnerabilidad  Determinación de la categoría de la ANTropic   Determinación de la vulnerabilidad 

**类型：**El aprendizaje
**语言：**Python (stdlib,RSP)
**先修：**Fase 15 · 06(AAR),Fase 15 · 07(RSI)
**时间：**- 45 minutos

##  problemas

Frontier  Laboratories publican políticas de escalado, parte es el archivo técnico, parte es el archivo administrativo, parte es también la señal a los reguladores. RSP v3.0 es el archivo antropológico actual.

La diferencia entre v3.0 y v2.0 es una unidad de análisis útil. Se ha añadido lo siguiente:Mapas de ruta de seguridad fronteriza, informes de riesgos, IA R&D-4 valores, se ha eliminado lo siguiente: el compromiso de suspensión de 2023 reafirma lo siguiente: el calendario de medidas de alivio se ha dividido en dos niveles: Antropic 单方面行动和行业建议.

## 概念

### 双层缓解措施时间表

- **Anthropic 单方面行动**En el caso de los laboratorios, los humanos pueden hacer lo que sea que hagan.
- **行业范围建议**En el caso de la industria, la industria debería adoptar medidas colectivas, incluyendo RAND SL-4 seguridad estándar.

En el v2 no hay esta estructura de dos niveles. Esto significa que el lector necesita ver en qué línea se encuentra cada compromiso.

### AI I+D-4 value

Es el siguiente valor importante que indica RSP v3.0  Valor . En concreto: un modelo capaz de automatizar una parte considerable del costo competitivo de los estudios de IA . Una vez que Anthropic                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

Según la declaración de v3.0, Claude Opus 4.6 no ha superado este valor. El documento añade:

Lección 6 (Automated Alignment Research) y Lección 7 (Recursive Self-Improvement) directamente relacionadas con este valor.

### Carta de ruta de seguridad fronteriza y informes de riesgos

v3.0 genera dos clases de artefactos 提升为常设文档:

- **Frontier Safety Roadmap**El proyecto de investigación de seguridad en el programa, la capacidad de previsión y la reducción de la situación, se desarrolla en el marco de un estudio de la investigación de seguridad en el programa.
- **Risk Report**: publicado después de la publicación de un archivo de observación de un modelo específico, describiendo la capacidad de observación y el riesgo restante.

Ambos son abiertos. Ambos son utilizados para hacer un seguimiento de lo que Anthropic dice que va a hacer en la hoja de ruta, y si el contenido del informe de riesgo coincide con lo que dicen.

### 删除暂停条款

2023 RSP incluye un compromiso de suspensión claro: si el modelo supera la capacidad específicavalor, el entrenamiento se suspenderá hasta que la medida de alivio llegue a su lugar──v3.0 Usando una expresión más suave sustituyó el suspensión claro.

El punto de vista político de este cambio es: el punto de referencia de la capacidad de la Comisión para el año 2023 para el año 2026 se vuelve imposible, ya que el punto de referencia en sí mismo se ha vuelto a reducir.

### SaferAI 的下调

SaferAI es una organización independiente, responsable de evaluar RSP 风格文档──他们的公开评分:2023 Antropic RSP 得分 2.2((该量表中 4.0 代表当前最佳 RSP,1.0 为名分)──v3.0 得分 1.9──这使Antropic从中等降至弱,与OpenAI和DeepMind一起进入弱类──

Factores de clasificación más seguros:
- 定性 值取代了定量 值──
- 暂停承诺被删除──
- Las medidas de alivio de la IA R&D-4 value se describen como 正面论证, y no como medidas concretas.
- 评审机制依赖Antropic's Safety Advisory Group,独立监督有限, en el marco de la investigación y desarrollo de la tecnología de la información.

### Este curso no es lo que

Este no es un capítulo de la normalización. RSP v3.0 no es una normalización; no hay nada que imponga la Antropía  cumplir con ella. El enfoque de este curso es tener en cuenta la especificidad y el espíritu de duda que debe tener.


```figure
a5-rsp-ladder
```

## Usalo

`code/main.py` Implementar un pequeño motor de decisión, mapear la estructura de evaluación de valor de RSP: dar un modelo candidato y un grupo de medición de capacidad, devolver la IA R&D-4 valor se ha superado  los capítulos de análisis de la realidad necesaria, así como si la implementación puede continuar 

##  entregarlo

`outputs/skill-scaling-policy-review.md`根据 v3.0 参考结构审查一个扩展政策(Antropic、Open AI、DeepMind或内部政策):双层结构、值、暂停承诺、独立评审──

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` introducir tres modelos sintéticos de diferentes niveles de capacidad  confirmar value evaluator según el trabajo previsto, y generar modelos de análisis de la realidad 

2. 完整阅读 RSP v3.0(32 páginas)  Identificar cada uno de los compromisos que se encuentran en el ámbito de la industria 建议层级的承诺── ¿Cuáles de los compromisos en el v2 se encuentran en el ámbito de la Antropic 单方面?

3. ¿Cuál es la línea de rubrica que más afecta a la reducción?

4. Se eliminó el compromiso de suspensión del 2023; se propuso un compromiso alternativo, reconociendo el punto de referencia del 2026 y la nueva reducción del problema, al mismo tiempo que se mantuvo la credibilidad de la política.

5. Para comparar RSP v3.0 con OpenAI Preparedness Framework v2 ((Lección 20) se debe seleccionar un aspecto más fuerte de la versión 3.0

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| RSP | “Anthropic 的 scaling policy” | Responsible Scaling Policy；v3.0 于 2026 年 2 月 24 日生效 |
| AI R&D-4 | “研究自动化阈值” | 以有竞争力的成本自动化大量 AI 研究的能力 |
| Affirmative case | “安全论证” | 公开论证风险已被识别且缓解措施足够 |
| Frontier Safety Roadmap | “前瞻计划” | 关于计划中的安全工作和预期能力的常设文档 |
| Risk Report | “模型回顾” | 关于发布后观察到的能力和剩余风险的常设文档 |
| Two-tier mitigation | “单方面 vs 行业” | 区分 Anthropic 承诺与行业建议 |
| Pause commitment | “2023 条款” | 明确承诺暂停训练；已在 v3.0 中删除 |
| SaferAI rating | “独立 RSP 评分” | 第三方 rubric；v3.0 得分 1.9（v2 为 2.2） |

## 延伸阅读

- [Anthropic — Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) 完整的 32 页政策──
- [Anthropic — RSP v3.0 announcement](https://www.anthropic.com/news/responsible-scaling-policy-v3) v2 desde el momento de la transformación.
- [Anthropic — Frontier Safety Roadmap](https://www.anthropic.com/research/frontier-safety) RSP v3.0 链接的常设文档──
- [Anthropic — Risk Report: Claude Opus 4.6](https://www.anthropic.com/research/risk-report-claude-opus-4-6) 关于当前边境模式 的回顾──
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) Conectar AI R&D-4 con la autonomía de la prueba.
