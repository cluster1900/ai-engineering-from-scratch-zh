# FinOps de LLM  单位经济性与多租户归因

> 传统FinOps en LLM 支出上会失效──成本是Token 交易,而不是资源在线时长──标签无法映射, una llamada API es una transacción, no es un activo──工程决策(prompto 设计、文本窗口、输出长度)就是财务决策──2026 playbook 要求从第一天起就埋点三个归因维度:per-user:`user_id`) para el precio de los asientos y la expansión, por tarea`task_id`¿ Qué es eso ?`route`) para el coste y la prioridad del producto, por inquilino`tenant_id` Para el tiempo de espera de los clientes: 2x, 2x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 3x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4x, 4

**类型：**Aprende
**语言：**Python(stdlib,带 kill switch de simulador de atribución de costos de los juguetes)
**先修：**Fase 17 · 13(Observabilidad),Fase 17 · 14(Caching)
**时间：** 60 minutos

## El objetivo del aprendizaje

- 解释为什么传统FinOps (tags + tiers) en LLM 支出上会失效,并说出三个 nuevos niveles de atribución:
- 枚举四个代币层(pronto、工具、memory、response),并说明为什么单桶支付会隐藏成本──
- Por varios inquilinos 产品设计执法梯 (la escalera de aplicación de la ley) 
- 选择单位指标(costo por consulta / artefacto resuelto), en lugar de $/M Token。

##  problemas

Su cuenta muestra $40,000.
- ¿Qué inquilino gastó ese dinero?
- ¿Qué característica de producto impulsó este gasto?
- ¿Hay algún usuario individual en uso abusivo?
- Sin embargo, el problema es que la inflamación rápida, las llamadas de herramientas, o la amplificación de la memoria.

El proveedor de etiquetas y agregados para los recursos de la nube (EC2、S3) es válido, ya que las etiquetas se propagarán a los elementos de la línea.

## 概念

### Tres dimensiones de la naturaleza

**Per-user**(El artículo`user_id`): quien ha generado muchos costes― impulsando el precio de los asientos―expansión de las conversaciones,并识别电源用户―

**Per-task**(El artículo`task_id`¿ Qué es eso ?`route`): ¿Cuál es la superficie del producto  que ha generado un coste  la prioridad de las características impulsora, así como la decisión de si se matan las características costosas 

**Per-tenant**(El artículo`tenant_id`): ¿qué cliente es rentable?

Desde el primer día estamos en el sitio de llamadas.

### Cuatro niveles de tokens

| Layer | Example | Typical % of total |
|-------|---------|---------------------|
| Prompt | system + user input | 40-60% |
| Tool | tool-call results fed back | 20-40%（agent workloads） |
| Memory | prior conversation / retrieved docs | 10-30% |
| Response | model output | 10-30% |

Pon todas las cuatro capas en un balde, para que se pierdan.

### Escala de ejecución

1. **Rate limit**按租客 设置──预期峰值的2-3x──返回带 `Retry-After`El tenente se siente obstaculizado; no se producirá una cuenta inesperada.

2. **Daily spend cap**按租客 设置──合同上限的 1.5-3x──触发: límite de tasa de recepción + alerta del éxito del cliente──

3. **Kill switch**基于相对于租户基线的支出 z-score > 4──Auto-pause租户;页面在调用;升级给 ops + CS──

### 归因模式

- **Tag-and-aggregate**:打 metadatos cabeceras;稍后聚合──简单;粗略──
- **Telemetry joiner**Por medio de las identificaciones de rastro Colocar rastros  conectados a la facturación―
- **Sampling + extrapolation**El costo de la muestra es de 5 a 10%, re- multiplicando y re- desplazando.
- **Model-based allocation**: Usar regresión 推断 cost driver── se aplica a los datos heredados sin etiquetas──
- **Event-sourced**Los eventos en el canal de Kafka / Kinesis.
- **Real-time streaming**El tablero de control se actualiza.

### El coste por X es un indicador de unidades

$/M Token es el proveedor 语言──产品指标是:

- Cada uno de los costes de la obra ha sido resuelto.
- Cada artículo generado por el costo.
- El costo de cada tarea de un agente exitoso.
- Cada usuario se encuentra en el sitio.

La mejoría no tiene ningún punto.

### 成本归因 结构

```
trace_id: abc123
  user_id: u_42
  tenant_id: t_7
  task_id: task_classify_doc
  route: model_haiku
  layers:
    prompt_tokens: 1800
    tool_tokens: 600
    memory_tokens: 400
    response_tokens: 150
  cost_usd: 0.0135
  cached_input: true
  batch: false
```

Cada llamada emitirá un lago de datos.

### 复合节省 复合节省 

Stack: caché + lote + ruta + puerta de entrada.
- Cache L2(Fase 17 · 14): entrada 约便宜 10x。
- Batch (Fase 17 · 15): 50% de descuento
- Rutas hasta el modelo conveniente (Fase 17 · 16): coste reducido en un 60%
- Eficiencia de la puerta de entrada (Fase 17 · 19):redundancia + retempos。

Lo mejor está apilado  Casi el 5-10% de la línea de base ingenuo. La mayoría de los equipos ha activado 2-3 palancas.

### Debes recordar el número

- 归因维度: por usuario, por tarea, por inquilino
- Cuatro niveles de tokens: inmediato, herramienta, memoria, respuesta.
- El interruptor de apagado: gastar z-score > 4..
- 单位指标:cost por consulta resuelta, en lugar de $/M Token。
- Optimizaciones apiladas: es posible alcanzar el 5-10% del nivel de referencia.


```figure
i4-spend-ladder
```

## Usalo

`code/main.py`模拟一个多租户LLM服务,带三层执法梯子──注入一个虐待租户,并演示杀开关 触发──

##  entregarlo

本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-finops-plan.md`△ dado producto y escala, esquema de atribución de diseño y escalera de aplicación―

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`¿Cómo elegir el valor?
2. Diseñar un panel de costos por inquilino, por tarea. ¿Construirás primero cuáles son las 5 imágenes?
3. Su mayor inquilino es unidad-economía-negativo.
4. Por el producto de soporte  calcular el coste por boleto resuelto:3M Token/ticket, aproximadamente 800 boletos/día, tasa caché de GPT-5.
5. 论证 etiquetado retroactivo ¿si no es posible efectiva...cuándo se puede aceptar?

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Per-user attribution | “user-level cost” | 每次 call 都打上 `user_id` |
| Per-task attribution | “feature cost” | `task_id` + `route` 识别 product surface |
| Per-tenant attribution | “customer cost” | `tenant_id`；驱动单位经济性 |
| Four token layers | “cost layers” | prompt + tool + memory + response |
| Rate limit | “429 guard” | 在 gateway 强制执行的 per-tenant ceiling |
| Daily spend cap | “daily ceiling” | Tenant-scoped budget，带 alert |
| Kill switch | “auto-pause” | Spend z-score > 4 触发 auto-suspension |
| Cost per resolved | “product unit metric” | 成本绑定到产品结果，而不是 Token |
| Telemetry joiner | “trace-to-billing” | 准确性最高的归因模式 |
| Stacked optimization | “cache+batch+route+gateway” | 复合节省到约 5-10% baseline |

## 延伸阅读

- [FinOps Foundation — AI FinOps Overview](https://www.finops.org/wg/finops-for-ai-overview/)
- [FinOps School — Cost per Unit 2026 Guide](https://finopsschool.com/blog/cost-per-unit/)
- [Digital Applied — LLM Agent Cost Attribution 2026](https://www.digitalapplied.com/blog/llm-agent-cost-attribution-guide-production-2026)
- [PointFive — Azure OpenAI 中的 Managed LLMs](https://www.pointfive.co/blog/finops-for-ai-economics-of-managed-llms-in-azure-open-ai)
