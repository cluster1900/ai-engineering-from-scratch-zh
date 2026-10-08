# Modelo de enrutamiento  como medio básico de reducción de costes

> Un corredor dinámico evaluará cada solicitud (título de tarea, longitud de los tokens, similitud de los embedidos, confianza), y enviará una consulta simple, enviará un modelo barato, y actualizará una consulta compleja a un modelo fronterizo. También se llama cascada de modelos. Estudios de caso de producción muestran que en la implementación de los Estados Unidos/Reino Unido/UE, la calidad de la tecnología puede disminuir en un 20% a un 60%; en el SaaS de alta circulación, un 30% de mejora de la eficiencia de enrutamiento se convertirá en un ciclo anual de seis dígitos.$20/M 降到约 $La mayor parte de la disminución proviene de mejores estacas de servicio (Fase 17 · 04-09), no es hardware. En caso de que el enrutamiento no cause regresión del producto, se convierte en un modo de margen.

**Type:** Learn
**Languages:** Python (stdlib, toy cascading router simulator)
**前置要求：**Fase 17 · 01 (Plataformas de gestión de LLM), Fase 17 · 19 (Portales de IA)
**Time:** ~60 分钟

## El objetivo del aprendizaje

- 解释模型 cascading: barata-primero con control de confianza, baja confianza 时升级──
- 枚举四个路由信号(clasificación de tareas、prompto longitud、Embedding similitud con el conjunto conocido-hard、primero paso de la confianza en sí mismo)
- En el objetivo de enrutamiento se divide y la tolerancia de pérdida de calidad se calcula el costo combinado esperado.
- Cuál es la mejor manera de controlar el creep de modelos baratos?

##  problemas

Su análisis muestra que el 70% de las consultas son muy simples: "¿qué hora es en París?" "refrasear esta frase". El modelo de clase Haiku puede ser procesado con un costo de 3% de estos.

Si usted pone el 70% de la ruta en un modelo barato, si pone el 30% de la ruta en un modelo caro, en la misma calidad del producto, su facturación disminuirá aproximadamente el 65%.

## 概念

### Cuatro señales de enrutamiento

1. **Task classification**Puede ser clasificador basado en reglas, pequeño LLM, Haiku-class, $0.25/M), o hasta etiquetado embutidos de Embedding similaridad,

2. **Prompt length**Las instrucciones >4K Token normalmente necesitan frontera para mantener la coherencia。Las instrucciones <500 Token normalmente no necesitan。

3. **Embedding similarity to known-hard set**Si la consulta se acerca a un cubo conocido de durabilidad, escala directamente hasta la frontera.

4. **Self-confidence from first-pass**Si los log-probos del modelo muestran baja confianza, o se niega, o se saca un lenguaje de cobertura, se trata de una nueva prueba de tráfico de aproximadamente un 10% en aumento de la latencia de P95, pero en otro 90% se ahorra un 50% +.

### Tres modalidades

**Pre-route**(前置分类器): incremento de la latencia de unos 5-10 ms;整体最快──

**Cascade**(prima, baja confianza 时 escalar): latencia media 约1.2x(corrida barata加验证), escalada 时约2x──nivel de calidad 最好──

**Ensemble route**(对样本并行运行廉价 和 frontier,由奖励模型选择):cualdad máxima, costo máximo; sólo para A/B clave

###  realización

Las nuevas tecnologías de inteligencia artificial (AI) (Fase 17 · 19) expone el enrutamiento.`router`Config──Portkey tiene guardias + enrutamiento──Kong AI Gateway tiene enrutamiento basado en plugins──OpenRouter modelo de mercado  Exposure Recommendation API──

Fuente abierta:RouteLLM (LMSYS) 、No Diamond (comercial) 、Prompt Mule。

### 2026 价格曲线

| Model class | 2022 年末 | 2026 | 变化 |
|-------------|-----------|------|--------|
| GPT-4-level quality | ~$20/M | ~$0.40/M | 便宜 50x |
| Frontier (GPT-5, Claude 4) | — | ~$3-10/M | 新 tier |

La mayor parte de la mejora proviene de la eficiencia de servicio, es decir, la Fase 17 · 04-09 en el que los cursos centrales se transforman en proveedores de servicios.

### La deriva es un verdadero riesgo

Tu ruta Colocar el 40% en un modelo barato. Después de seis meses, la distribución de tareas cambia. El usuario es más experto, el problema es más largo. El router no se dio cuenta, ya que su clasificación se basa en los datos de la primera fase. La calidad se redujo. Nadie ha hecho quejas suficientemente fuertes.

Utilice métricas de calidad en línea para la ruta 设 gate:

- Cada ruta de usuario pulgares hacia arriba / pulgares hacia abajo.
- Cada ruta 上对持久的样本 ((5%) hacer automático LLM-juez
- Taxa de escalación: Si la cascada de la ruta ascendente > 30%, significa que el modelo barato se ha sobre-routado.
- Taxa de rechazo de cada ruta:

### Debes recordar el número

- 2026  Iso-qualidad  Reducción de los costes de ruta: estudios de caso  20-60% 
- La caída de los precios de los LLM 2022-2026:agregado 约每年10x──
- GPT-4 nivel 2022 vs 2026: ~$20/M → ~$0,40/M:
- Impacto de la latencia en cascada: media 约1.2x, escalada 约2x ((约10% de tráfico) 


```figure
model-cascade-router
```

## Usalo

`code/main.py`En el caso de los Estados miembros, el riesgo de pérdida de calidad y de escalada de los costes es más alto que el riesgo de pérdida de calidad.

##  entregarlo

本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-router-plan.md` Determinar la carga de trabajo y el presupuesto de calidad, seleccionar el patrón de enrutamiento y las señales.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`¿En qué piso de precisión, abajo, la cascada se superará antes de la ruta?
2. Su base de usuarios es el 30% de empresas (cuestiones complejas) ‒70% de nivel gratuito (simples) ‒ diseño de routing split― ¿Qué métricas en línea ‒como puerta?
3.  una ruta 让质量下降2%,但省 40%──¿debería el envío?
4. Utiliza OpenAI / APIs antropológicos logprobs  lograr la verificación de confianza  ¿De qué umbral  empezar?
5. En seis meses, la tasa de escalada pasó del 8% al 22%.

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Model routing | "cost broker" | 每个 request 动态选择 model |
| Model cascade | "cheap-first escalate" | 先运行 cheap，low confidence 时 fall through 到 frontier |
| Pre-route | "classify first" | 前置 classifier；不重新运行 |
| Ensemble route | "parallel pick" | 运行多个，由 reward-model 选最佳 |
| Escalation rate | "uprouted %" | cascade requests 中被 escalated 的比例 |
| RouteLLM | "LMSYS router" | OSS router library |
| Not Diamond | "commercial router" | SaaS model-routing product |
| Drift | "cheap creep" | distribution shift 发生但 router 没注意到 |
| Online quality gate | "live check" | 对 live traffic 采样做 automated LLM-judge |

## 延伸阅读

- [AbhyashSuchi — Model Routing LLM 2026 最佳实践](https://abhyashsuchi.in/model-routing-llm-2026-best-practices/)
- [Lukas Brunner — Rise of Inference Optimization 2026](https://dev.to/lukas_brunner/the-rise-of-inference-optimization-the-real-llm-infra-trend-shaping-2026-4e4o)
- [RouteLLM paper / code](https://github.com/lm-sys/RouteLLM)
- [Not Diamond — model routing](https://www.notdiamond.ai/)
- [OpenRouter](https://openrouter.ai/) 带 routing primitivos de multi-modelo puerta de enlace。
