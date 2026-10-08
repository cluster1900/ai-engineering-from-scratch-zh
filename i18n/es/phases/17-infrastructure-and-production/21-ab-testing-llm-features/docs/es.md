# Pruebas A/B LLM  función  GrowthBook、Statsig y problemas de percepción

> 传统 A/B Testing no es para la construcción de LLM de incertidumbre. 关键区别:evals 回答模型能完成这项工作吗? A/B tests 回答用户意意吗?两者都必不可少;靠氛围检查 发布已结束.**Statsig**(El 20 de septiembre de 2025 fue adquirido por OpenAI en un valor de $1.1B)  ensayos secuenciales CUPED 一体化**GrowthBook** código abierto ∼ almacén nativo ∼ Bayesiano + Frequentista + Sequencial  motores ∼CUPED ∼SRM  inspección ∼Benjamini-Hochberg + Bonferroni 校正── tu elección depende de si prefieres el almacén SQL, así como de si es importante para tu organización ∼

**Type:** Learn
**Languages:** Python (stdlib, toy sequential test simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 20 (Progressive Deployment)
**Time:** ~60 minutes

## El objetivo del aprendizaje
- 区分 evals(模型能完成这个工作吗) y pruebas A/B(用户在意吗)
- 列举三个可测试轴线(prompt、model、parámetros),并为每个轴线选择指标──
- 解释 CUPED、testing secuencial 和 Benjamini-Hochberg correcciones de comparación múltiple―
- 基于仓库-SQL 姿态和企业收购立场,在Statsig或 GrowthBook 之间做做选择──

##  problemas
Tu manual ha modificado un sistema de inmediato. Se siente mejor. Lo publicaste. La tasa de conversión cambia como el ruido.

Evals  respuesta modelo si puede completar tareas en un conjunto de etiquetas  Ellos no responden si el usuario prefiere más la salida  Sólo un experimento en línea controlado puede responder a esta pregunta, y el supuesto es que el experimento tiene suficiente poder, control de incertidumbre, y hacer correcciones a múltiples comparaciones 

## 概念
### Evals vs pruebas A/B

**Evals** 离线、带标签集合、judge(rubrica、LLM-as-judge o artificial)  respuesta: En esta distribución fija, ¿será el resultado correcto / 有帮助 / 安全?

**A/B test** En línea 、 usuarios reales 、 distribuciones de tiempo  Respuesta: ¿Ha impulsado el nuevo cambio el indicador de nivel de usuario clave?

两者都需要──Evals 在曝光前捕捉回归;A/B 在上线后确认产品影响──

### Qué probar

1. **Prompt engineering** 措辞、system-prompt 结构、示例──指标: tasking success rate、user留存、cost/request──
2. **Model selection** GPT-4 vs GPT-3.5-Turbo vs Llama-OSS── 标签:acuratecy(任务) + cost/requisito + latencia P99──多目标──
3. **Generation parameters** temperatura,top-p,max_tokens,  indicación: tarea específica, 输出多样性 vs 确定性, 

### CUPED  方差降低

Experimentos controlados utilizando datos de pre-experimento.

实现:Statsig 和 GrowthBook fueron realizados.

### Pruebas secuenciales

经典 A/B 假设固定样本量──Sequenciales pruebas(peek-and-decide) 在重复查看时控制 false-positive rate── Siempre válidos procedimientos secuenciales(mSPRT、Howard's confidence sequences) 让你在明确赢家出现时提前停止──

### Más peso que corrección

En un 95% de confianza, se ejecutan 20 pruebas A/B, que producen un falso positivo por casualidad. La corrección de Bonferroni se ejecutan en cada prueba.

### Desajuste de la relación de muestras SRM 

El hash de asignación distribuirá al usuario a su manera en los variables. Si 50/50 de la cantidad de bits se obtiene efectivamente 47/53, indicará que algo está mal.

### Statsig vs GrowthBook

**Statsig**¿Qué es esto ?
- Fue abierto por la OpenAI en US$1.1 mil millones.
- Pruebas secuenciales CUPED poblaciones excluidas
- Enclusión: señales de características + experimentación + observabilidad.
- Lo mejor es que el equipo ya quiere comprar productos y no quiere abrirse a la propiedad.

**GrowthBook**¿Qué es esto ?
- El código abierto (MIT); almacén nativo(directamente desde Snowflake/BigQuery/Redshift 读取)
- Más de un motor: bayesiano, frecuentista, secuencial.
- CUPED、SRM、Bonferroni、BH correcciones。
- Auto-host o en la nube gestionada.
- Lo que se puede hacer es hacer un trabajo de trabajo de trabajo de trabajo.

### La incertidumbre hace que la estadística funcione compleja

Como un prompt 会产生 diferentes output. Los cálculos tradicionales de potencia 假设 IID 观测. Debido a la incertidumbre de LLM, la cantidad de muestras válidas es menor que la nominal.

### Resultados reales de los casos

- Modelo de recompensa de chatbot 变体: +70% 对话长度 +30% 留存──
- Las líneas de trabajo siguientes: función de recompensa 优化后 +1% CTR──
- Khan Academy Khanmigo: alrededor de la retraso y el índice de precisión matemática

### Contrario: con sensación en línea

Cada ingeniero adjunto puede decir que una función se publicó porque se sentía mejor y no se produjo A/B. La mayoría de ellos no se dieron cuenta durante meses de que el indicador de producto se volvió a producir.

### Debes recordar el número

- Statsig 被 OpenAI 收购: $1.1B,2025 年 9 月。
- Crecimiento Libro: MIT de código abierto; Bayesiano + Frequentista + Secuencial。
- CUPED 方差降低: 30 a 70%
- LLM no está definido → +30-50% 样本量缓冲──


```figure
mx-sequential-test
```

## Usalo
`code/main.py`模拟一个带有固定边界和序列边界的序列A/B test──展示序列 如何让你提前停止──

##  entregarlo
本课生成                       `outputs/skill-ab-plan.md` Cambios de características, carga de trabajo, línea de base, selección de plataformas, puertas, tamaño de muestra.

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ ¿Cuánta cantidad de muestras se necesita para alcanzar el 80% de potencia para la conversión del 3% de referencia?
2. Para un paciente de salud  supervisado en el lugar  clientes seleccionan Statsig o GrowthBook。
3. Design a/b, test GPT-4 vs GPT-3.5 en costo por billete resuelto                                                                                                                                                                                                                                                    
4. Su canario ha pasado, pero A/B muestra -1,2% de conversión. ¿Estoy publicando?
5. Para aplicar el CUPED a un período previo, el aumento de la muestra se calcula en un 60% de la pre-periodo.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Eval | “offline test” | 对模型能力的带标签集合评估 |
| A/B test | “experiment” | 面向用户的在线随机比较 |
| CUPED | “variance reduction” | 用前期回归来降低方差 |
| Sequential test | “peek-ok test” | 允许提前停止的 always-valid procedure |
| Multiple comparison | “the family error” | 运行许多测试会放大 false positives |
| Bonferroni | “tight correction” | 将 α 除以测试数量 |
| Benjamini-Hochberg | “BH FDR” | false-discovery-rate 控制，较不保守 |
| SRM | “bad split” | Sample ratio mismatch；分配 bug |
| Statsig | “OpenAI owned” | 商业一体化平台，2025 年被收购 |
| GrowthBook | “the OSS one” | MIT warehouse-native 平台 |
| mSPRT | “sequential probability ratio test” | 经典 sequential procedure |

## 延伸阅读
- [GrowthBook — How to A/B Test AI](https://blog.growthbook.io/how-to-a-b-test-ai-a-practical-guide/)
- [Statsig — Beyond Prompts: Data-Driven LLM Optimization](https://www.statsig.com/blog/llm-optimization-online-experimentation)
- [Statsig vs GrowthBook comparison](https://www.statsig.com/perspectives/ab-testing-feature-flags-comparison-tools)
- [Deng et al. — CUPED](https://www.exp-platform.com/Documents/2013-02-CUPED-ImprovingSensitivityOfControlledExperiments.pdf)
- [Howard — Confidence Sequences](https://arxiv.org/abs/1810.08240)
