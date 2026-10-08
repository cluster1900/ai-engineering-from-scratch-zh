# El tráfico de sombras de los LLM, el despliegue de las Canarias y el despliegue progresivo

> Los lanzamientos de LLM se unen a la parte más difícil de la implementación de software: no hay módulos de pruebas de unidad, no hay módulos de falla, las señales están atrasadas.

**Type:** 学习
**语言：**Python, simulador de progresión de juguete canario)
**Prerequisites:** Phase 17 · 13（Observability），Phase 17 · 21（A/B Testing）
**Time:** ~60 分钟

## El objetivo del aprendizaje

- 区分影音模式 (shadow mode) 零影响比较) 加纳里 (canario) 直播流量 (progresividad)  A/B (stabilización)  稳定性确认后的比较) 
- 列举五个LLC-specific canary metrics (latencia, coste, solicitud, error, rechazo, distribución de longitud de salida, comentarios de los usuarios)
- 解释为什么LLM no-determinismo ((mayor que 15%) va a cambiar el despliegue en stable的含义──
- Diseñar un proceso de retrocesión de la política en lugar de un proceso de retrocesión de la política.

##  problemas

Usted publicó un nuevo modelo. Evaluaciones fuera de línea. Muestran precisión. Mejorar el 3%. Usted está en producción.

Todo esto podría haber sido evitado. El modo sombra se puede capturar hasta un 40% de aumento de costos antes de que cualquier usuario vea. El Canary se puede detener en un 10% de cambios. El retorno de la bandera política debe tomar sólo 30 segundos.

## 概念

### Modo de sombra

Candidato  recepción y producción Similar requisites; resultados serán registrados, pero no se devolverán al usuario ⋅ para el usuario ⋅ impacto ⋅ registro:

- Contenido de la producción
- Cuentas de tokens (delta de costo)
- La latencia.
- Rechazo y error.

能捕捉:cost blow-ups、length regressions、manifestes cambios de rechazo、errores difíciles──no puede capturar: el usuario percibirá hasta el delta de calidad──Shadow es un test de humo, no un test de calidad──

### Despliegue de las Canarias

带 gate 的 progresivo cambio de tráfico 典型进度:1% → 10% → 25% → 50% → 75% → 100%── cada paso basado en 5 métricas 设置门:

1. **Latency percentiles** P50、P95、P99。 violación:canario de P99 > de base de 1.5x。
2. **Cost per request** 混合 $──违规:高于基线 >20%──
3. **Error / refusal rate** 5xx 加明显拒绝──违规:baseline 的 2x──
4. **Output length distribution** promedio + P99。 violación de la normativa: cambio de distribución。
5. **User-feedback rate** pulgares hacia abajo / archivos de boletos。 violación: baseline 的 1.5x。

### El no-determinismo es una nueva varianza .

La misma entrada producirá no exactamente la misma salida.

- La no-asociabilidad de la GPU FP (orden de reducción de puntos flotantes) 会随批 变化)
- Varianza de tamaño de lote (en el mismo momento, en el lote de 128 y en el lote de 16).
- Muestreo de temperatura > 0)

实测: en los mismos conjuntos de evaluación 上, la variación de precisión de ejecución a ejecución máxima de hasta 15%。Stable en el rollout significa métricas 处于预期变化内, en lugar de la línea de base 完全相同──把门 设置在噪音 floor 之上──

### El costo es variable

Un buen modelo del 20% Cada vez que se utiliza puede costar 3 veces. Costo/ Solicitud es uno de los cinco puertas.

### El retroescalado es un arma .

- Flag de política (Figure flag system): en configuración (en inglés): %s;
- Modelo de fijación de registros: modelo fijado 不会自动升级──
- Rollback = reverse flag + set pinned digest a la anterior──数秒, en lugar de数小时──

Si tu pila necesita redistribuir para volver a la rotación, antes de la rotación, primero repara esto.

### Equipamiento

**Argo Rollouts**- ¿ Qué ?**Flagger** Controlladores de entrega progresiva Kubernetes──与 Istio/Linkerd enrutamiento ponderado 集成──

**Istio weighted routing** servicio-mesas 级流量拆分──

**KServe / Seldon Core** 内置 cánary 的模型服务──

**Feature flags** LanzamientoDarkly、Flagsmith、Unleash──Flip a nivel de política, no necesita redistribución──

### Cadencia de las métricas

Puertas Canarias Cada 5-15 minutos de inspección una vez, dependiendo de volumen de tráfico. El 1% del tráfico ▌y 10 req/min ▌, cada ventana tiene 50-150 puntos de datos  para la latencia ▌suficiente, pero para la retroalimentación del usuario de decir ruido mayor ▌10% ▌Trabajará con aproximadamente 10 veces más datos ▌Los avances ▌deberían suspenderse lo suficiente en cada paso, para acumular suficientes muestras ▌

### A/B 步骤是可选的

Si el nuevo modelo 明显不同( diferente comportamiento、 diferente curva de costos、 diferente tono), en canario 通過後以 50% hacer A/B test──如果它只是一个改进版本,当加拿大门 通過后直接到100%──

### Debes recordar el número

- Progresón canaria: 1 por ciento → 10 por ciento → 25 por ciento → 50 por ciento → 75 por ciento
- Techo de no-determinismo: variación de ejecución a ejecución de la misma entrada máxima máxima de 15%
- 五个加拿大指标:latency,cost,error/refusal,length of output,user feedback,
- Portela de coste:高于基线 >20% 即为违规──
- Rollback: pocos segundos, en lugar de unos pocos minutos.


```figure
i4-canary-ramp
```

## Usalo

`code/main.py`模拟带有注入回归的加拿大推广――报告推广 在哪个阶段 停止,以及哪个门被触发──

##  entregarlo

本课生成                       `outputs/skill-rollout-runbook.md` Proporcionar un modelo de candidato, línea de base y tolerancia al riesgo, diseño de sombra→canario→plan del 100%

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`¿En qué etapa se detiene la regresión de los costes del 25%?
2. Su nuevo modelo en línea tiene un aumento de 3% de precisión, pero el costo/solicitud es +18%── ¿Se publicará?
3. Diseñar un tiempo de despliegue de un extremo a otro de menos de 60 segundos.
4. No determinismo en tu evaluación 上显示 ±7%── establecer puertas canarias, evitar falsas alarmas──¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
5. Modo de sombra en el canario  precaptura hasta 40% de aumento de costos ⇒ write out触发 shadow 的警报规则 ⇒

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Shadow mode | “duplicate to new” | 用于 logging 的零影响 send-to-candidate |
| Canary | “progressive traffic” | 带 gates、暴露给用户的渐进式 rollout |
| Gates | “rollout checks” | 阻止 progression 的 metric thresholds |
| Non-determinism | “LLM variance” | 不可消除的 run-to-run differences |
| Policy flag | “flag flip rollback” | Config-level rollback，数秒而不是数小时 |
| Model pin | “registry digest” | 指向 model version 的不可变 reference |
| Argo Rollouts | “K8s progressive” | Kubernetes-native canary/rollback controller |
| KServe | “inference K8s” | 带 canary primitives 的 model serving |
| Istio weighted | “mesh split” | Service-mesh traffic splitter |

## 延伸阅读

- [TianPan — Releasing AI Features Without Breaking Production](https://tianpan.co/blog/2026-04-09-llm-gradual-rollout-shadow-canary-ab-testing)
- [MarkTechPost — Safely Deploying ML Models](https://www.marktechpost.com/2026/03/21/safely-deploying-ml-models-to-production-four-controlled-strategies-a-b-canary-interleaved-shadow-testing/)
- [APXML — Advanced LLM Deployment Patterns](https://apxml.com/courses/mlops-for-large-models-llmops/chapter-4-llm-deployment-serving-optimization/advanced-llm-deployment-patterns)
- [Argo Rollouts docs](https://argo-rollouts.readthedocs.io/)
- [Flagger docs](https://docs.flagger.app/)
