# LLM Producción de Ingeniería del Caos

> Para 2026, la dirección hacia la ingeniería del caos de los LLM 已成为 una práctica independiente. En la producción se ejecutarán condiciones previas de la experiencia: SLI/SLO definido  traza+métricas+log observabilidad  rollback automatizado  libretas de ejecución  en llamada  arquitectura Hay cuatro planos: control  programación de experimentos  objetivo  servicios  infra  almacenes de datos  seguridad  tasa de abortos  filtros de tráfico  observabilidad  métricas  rastros  retroalimentación  entrada  SLO  Garda es un requisito obligatorio: si ChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaCha

**类型：**El aprendizaje
**语言：**Python, el experimento de juego y el caos)
**前置条件：**Fase 17 · 23(SRE para IA),Fase 17 · 13(Observabilidad)
**时间：** 60 minutos

## El objetivo del aprendizaje

- Explicó por qué saltar cualquier uno de ellos destruirá esta práctica.
-  dibujar cuatro planos  control, objetivo, seguridad, observabilidad) y entrar en el ciclo de retroalimentación de la SLO
- 枚举五个LLM experimentos específicos ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇  ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇     ̇ ̇   ̇       ̇     ̇ ̇   
- 根据堆 选择工具  Arneses、LitmusChaos、Chaos Mesh──

##  problemas

传统堆中的混乱测试 已经很成熟──LLM堆增加了新的失败模式──一个带有毒字符的4K-token提示 会让代币器卡住 12秒──上游提供商 返回 429; tu puerta de entrada 进行重复试验; tu servicio 由于重复加大同步而OOM──爆 load 下的KV cache eviction storm 会导致重复预填,进而耗尽计算──

Estos no aparecen en las pruebas de unidades. La ingeniería del caos es el método para descubrirlos antes de que los usuarios los encuentren.

## 概念

### Previo condición

Si no hay el siguiente contenido, no hay caos en la producción:

1. **SLI/SLO** 已定义的服务水平指标和目标──
2. **Observability** rastros, métricas, registros,并连接到仪表板──
3. **Automated rollback** Fase 17 · 20 Rollo de la bandera política
4. **Runbooks** 结构化,Fase 17 · 23。
5. **On-call**Alguien es responsable de la respuesta.

 La falta de cualquiera, todo significa que el caos se convertirá en un verdadero incidente

### Cuatro aviones + retroalimentación

**Control plane** programación de experimentos(flujo de trabajo de Litmus、Chaos Mesh programación、Harness UI) 。

**Target plane** servicios, pods, nodos, balanceadores de carga, almacenes de datos,

**Safety plane** interruptor de apagado, ventanas de supresión, límites de radio de explosión, puertas de error de presupuesto,

**Observability plane** 常规 métricas + correlación de rastro-ID, para la división de fallos inducidos por el caos y fallos naturales。

**Feedback loop** 发现结果反到 SLO ajuste, actualizaciones de libros de cálculo, correcciones de código.

### Los barandillas son un requisito obligatorio

- **Burn-rate alert**Si el error diario de la quema de presupuesto                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
- **Suppression windows**Durante el experimento, se emitirán alertas de silencio no experimento en el radio de la explosión.
- **Trace-ID correlation**Todos los errores inducidos por el experimento llevan una etiqueta, que en la llamada se puede volver a hacer.

### 五个 experimentos específicos de LLM

1. **Memory overload**  通过高并发发发发发送长文本请求,强制触发 KV cache preemption storm──观察:service 是优雅地输货,还是崩?

2. **Network failure** 切断 inference gateway 连接与供应商之间──观察:fallback 是否在 SLA内生效?

3. **Provider outage simulation**¿Se puede hacer una ruta de errores en el sistema de antropic?

4. **Malformed prompt** Inserir para hacer que el tokenizer 卡住的 payload (por ejemplo, un código unicode profundamente anidado, un enorme código UTF-8)  observar: una sola solicitud ¿hacerá bloqueo a un trabajador?

5. **KV eviction storm**                                                                                                                                                                                                                                                              

### Cadencia

- **每周** En la etapa de la realización de pequeños experimentos canarios, también puede haber un 5% de la producción de la producción 流量上运行──
- **每月** 针对特定场景 安排游戏日;跨团队参与; postmortem。
- **每季度** Auditoría de la resiliencia entre equipos; actualización del mapa de dependencia。

### Equipamiento

- **Harness Chaos Engineering** 商业工具; recomendaciones de experimentos derivados de la IA; reducción de la escala del radio de explosión; integración de herramientas de MCP。
- **LitmusChaos** CNCF graduado; basado en el flujo de trabajo de Kubernetes。
- **Chaos Mesh** Capa de arena CNCF; CCRD nativo de los Kubernetes 风格。
- **Gremlin** 商业工具; amplio apoyo。
- **AWS FIS**- ¿ Qué ?**Azure Chaos Studio** Ofertas de nube gestionadas。

### Desde pequeño comienza

Primer experimento: en estabilidad de tráfico bajo pod-kill una réplica de decodificación, observar el desvío y la recuperación, si puede funcionar y parece seguro, se actualiza al caos de la red.

Primer experimento específico de LLM: inyectar un proveedor 429, durado 5 minutos. Observar el retroceso. La mayoría de los equipos descubrirán que su retroceso no ha sido probado adecuadamente.

### Debes recordar el número

- Cuatro planos: control, objetivo, seguridad, observabilidad.
- Pausa de la tasa de quemaduras: previsión de la quema del presupuesto diario de 2x──
- Cadencia:canario semanal, día de juego mensual, auditoría trimestral.
- 五个LLM experimentos: memoria, red, proveedor, malformación de la información, tormenta de KV.


```figure
i4-chaos-guard
```

## Usalo

`code/main.py`Utiliza puertas de avión de seguridad 模拟三个 experimentos de caos.

##  entregarlo

本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-chaos-plan.md`△ dado la pila y la madurez, seleccionar los tres experimentos y la herramienta.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`¿Qué experimento ha provocado la velocidad de quemaduras?
2. Para un servicio RAG basado en vLLM diseñar los primeros cinco experimentos de caos. Incluye criterios de éxito.
3. ¿Cómo puedes determinar la causa de la muerte? ¿Es caos o es natural?
4. ¿Debería el caos funcionar en la producción o solo en la etapa de producción? ¿Cuándo la producción es la respuesta correcta?
5. En el caso de los sistemas de gestión de la red, el sistema de gestión de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la red de la

## 关键术语: "El hombre es un hombre"

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| SLI / SLO | "service targets" | Indicator + objective；必需前置条件 |
| Blast radius | "scope" | 受 experiment 影响的 services / users 集合 |
| Burn-rate alert | "budget gate" | 当 error-budget burn rate > 预期的 2x 时触发 |
| Game day | "monthly drill" | 计划好的 cross-team chaos exercise |
| LitmusChaos | "CNCF workflow" | Graduated CNCF Kubernetes chaos tool |
| Chaos Mesh | "CNCF CRD" | CNCF sandbox Kubernetes-native chaos |
| Harness CE | "commercial AI-assisted" | 带有 AI recommendations 的 Harness chaos |
| Malformed prompt | "tokenizer bomb" | 会让 tokenization 卡住的输入 |
| KV eviction storm | "preemption cascade" | 大规模 eviction 触发 re-prefills |

## 延伸阅读

- [DevSecOps School — Chaos Engineering 2026 指南](https://devsecopsschool.com/blog/chaos-engineering/)
- [Ankush Sharma — Observability for LLMs（书）](https://www.amazon.com/Observability-Large-Language-Models-Engineering-ebook/dp/B0DJSR65TR)
- [LitmusChaos（CNCF）](https://litmuschaos.io/)
- [Chaos Mesh（CNCF）](https://chaos-mesh.org/)
- [Harness Chaos Engineering](https://www.harness.io/products/chaos-engineering)
- [AWS FIS](https://aws.amazon.com/fis/)
