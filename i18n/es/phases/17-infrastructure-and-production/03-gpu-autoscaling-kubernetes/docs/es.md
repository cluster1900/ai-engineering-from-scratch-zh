# Kubernetes 上的 GPU Autoscaling  Karpenter, KAI Scheduler, Ordenamiento de pandillas

> Es un sistema de tres niveles, no de una capa. Carpenter 动态供给节点(不到一分钟,比 Cluster Autoscaler 快 40%) ∙KAI Scheduler 处理团队安排、拓感知和分层队列  它能避免 7-of-8 de las divisiones de la distribución :七节点因为缺缺 GPU而等并烧钱──应用层自动式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式式`DCGM_FI_DEV_GPU_UTIL`Es la medida del ciclo de trabajo: el 100 por ciento, es posible que sea 10 peticiones, es posible que sea 100 por ciento.`WhenEmptyOrUnderutilized` estrategia, porque terminará el trabajo de la GPU en funcionamiento en el proceso de elaboración.

**Type:** Learn
**Languages:** Python (stdlib, toy queue-depth autoscaler simulator)
**前置要求：**Fase 17 · 02 (Economía de la plataforma de inferencia), Fase 17 · 04 (servicios internos de VLLM)
**Time:** ~75 minutes

## El objetivo del aprendizaje
- 画出三层自动扩展 架构 节点供给、帮规划、应用层),并说出每层使用的工具──
- Explica por qué`DCGM_FI_DEV_GPU_UTIL`Es el error de HPA 信号,并说出两个 sustitutivos de señal.
- 描述帮派安排以及 KAI Scheduler 防止的部分分配失败模式(8 GPUs en el que hay 7 个空等待) ⋅
- "Cuando terminamos de trabajar en la GPU, tenemos que consolidar la estrategia de Karpenter".`WhenEmptyOrUnderutilized`),并说明2026年的安全替代方案──

##  problemas
Tu equipo en Kubernetes publicó un servicio de LLM 服务──你把HPA 设置为使用 `DCGM_FI_DEV_GPU_UTIL`Como señal. En el tiempo de negocio, el servicio ha estado en el 100% de la tasa de utilización.

Además, usaste el Cluster Autoscaler 管理节点──凌晨2点来一个1M-Token prompt; cluster pasó 3 minutos suministrando节点,请求超时──

Además, se despliega un nodo que necesita atravesar 2 nodos usando un modelo 70B de 8 GPUs. El cluster tiene 7 GPUs vacíos, y hay 1 GPU distribuido en 3 nodos.

Tres niveles, tres diferentes modelos de fracaso. La autoescalación consciente de la GPU de 2026 no es un sistema de conexión de datos.

## 概念
### Capas 1  节点供给 (carpenter)

Carpenter  monitor pending pods, y en aproximadamente 45-60 segundos suministrar los puntos  Cluster Autoscaler para GPU                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                `NodePool`约束动态选择实例类型  Si tu pod necesita 8 H100, y el grupo no tiene nodos de correspondencia, Carpenter se suministrará directamente a un nodo, en lugar de ampliar un grupo existente。

**consolidation 陷阱**Carpenter 默认的 `consolidationPolicy: WhenEmptyOrUnderutilized`Para el conjunto de GPU 很危险――它将终止正在运行的 GPU 节点,把 pod 迁移到更便宜且更合适尺寸的实例――对于推理工作负载, esto significa que se despraza la solicitud en ejecución, y se vuelve a cargar el modelo 70B en el nuevo节点――损失是几分钟容量外加请求失败――

Configuración de seguridad de la piscina de GPU:

```yaml
disruption:
  consolidationPolicy: WhenEmpty
  consolidateAfter: 1h
```

Permitir a Karpenter en una hora después de la consolidación, pero no expulsar el trabajo que está en marcha.

### Capas 2  programación de pandillas(KAI Programador)

KAI Scheduler(项目原名 "Karp",后改名)处理默认 kube-scheduler 不处理的事情:

**Gang scheduling** Total o total sin ajuste de posición.  Necesita 8 pods de inferencia distribuida de GPU, o 8 juntos, o uno todo no se inicia.

**拓扑感知** 知道哪些GPU共享 NVLink、哪些位于同一架、哪些之间有InfiniBand──并据此放置 pod──DeepSeek-V3 67B tensor-parallel workload 必须留在一个NVLink域内;KAI Scheduler将遵守这一点──

**分层队列** Más equipos en prioridad y cuota  competencia con un grupo de GPU  Necesidades de producción urgentes del equipo A sólo se permiten cuando las reglas de prioridad                                                                                                                                                                                                                                                                              

KAI  como programador secundario y kube-programador 一起部署; 你通过注释 让工作负载 使用它──Ray 和 vLLM producción-stack 都有集成──

### Capas 3  应用层信号

**HPA 陷阱**¿Qué es esto ?`DCGM_FI_DEV_GPU_UTIL`Es una métrica de ciclo de trabajo  mide si la GPU está trabajando en cada tipo de intervalos. El 100% de utilización puede significar 10 y también puede ser 100 solicitudes.

Lo peor es que el VLLM y el motor similares se asignan de antemano a la memoria caché KV.`--gpu-memory-utilization`(..) Incluso si solo se hace una solicitud, el uso de memoria también se mantiene cerca del 90%―.

**2026 年替代信号**¿Qué es esto ?

- 队列深度( espera preemplen de las peticiones)。
- Utilización de caché KV (%) distribuido a la secuencia activa de bloques (por ejemplo)
- Cada réplica de P99 TTFT de tu SLA  señal)
- Goodput ((( por segundo satisfacer todos los requerimientos de SLO)

NVIDIA Dynamo Planner 和 llm-d Variante de carga de trabajo Autoscaler 会消费这些信号并扩缩复lica──它们将完全取代用于 LLM服务的 HPA──

### ¿Cuándo usar qué?

| Scale decision | Tool |
|----------------|------|
| 添加/移除节点 | Karpenter |
| 调度 multi-GPU job | KAI Scheduler |
| 添加/移除 replica | Dynamo Planner / llm-d WVA（或基于队列深度的自定义 HPA） |
| 选择 GPU type | Karpenter NodePool |
| 抢占 low-priority | KAI Scheduler queues |

### Preemplazo/decodificación desglosado 会让一切更复杂

Si se ejecuta preempleo/decodificación desagregada (fase 17 · 17), usted tendrá dos tipos de pod, y ellos tienen disparadores de escalación diferentes: preempleo pod  basado en la profundidad de la línea de amplificación, decodificación pod  basado en la presión de caché KV  amplificación capacidad―llm-d Los expondrá a tener por rol HPA de independencia `Services`No intentes dejar una HPA separada en la cara de ambos.

### El inicio frío aquí también es importante

La mitigación de arranque en frío (Fase 17 · 10) es el punto de suministro de tiempo para convertirse en un lugar de usuario visible tardío.`min_workers=1`), o en la aplicación de la utilización de puntos de control de estilo Modal.

### Debes recordar el número

- Carpenter 节点供应: aproximadamente 45-60s,对比 Cluster Autoscaler 约 90-120s(GPU 节点) ⋅
- Programación de la CAI  prevenir la distribución de los desperdicios  7 de 8 陷──
- `DCGM_FI_DEV_GPU_UTIL`作为 HPA 信号:坏掉的; usar la profundidad de la línea de trabajo o el índice de utilización de KV。
- Carpenter `WhenEmptyOrUnderutilized`Por ejemplo, el uso de la GPU en el sistema de procesamiento de datos es un proceso de procesamiento de datos.`WhenEmpty + consolidateAfter: 1h`¿Qué es eso?


```figure
autoscaling
```

## Usalo
`code/main.py`En burst GPU workload 上模拟一个三层自动规模器──比较天真 HPA(círculo de trabajo) 、排列-depth HPA 和 KAI-gang-scheduled scaling──报告未满足请求、idle-GPU 分钟数和复合分数──

##  entregarlo
本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-gpu-autoscaler-plan.md` Dado la topología del grupo  forma de carga de trabajo y SLO, se diseña un esquema de autoescalado de tres niveles 

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ En la carga de trabajo explosiva, bajo el ciclo de trabajo, HPA perdía cuántas solicitudes de profundidad de cola HPA puede tomar? ¿De dónde proviene la diferencia?
2. Para un en H100 SXM5 en el servicio Llama 3.3 70B FP8 de un grupo  diseño de Carpenter NodePool  especificado `capacity-type`¿Qué es esto?`disruption.consolidationPolicy`¿Qué es esto?`consolidateAfter`, así como una carga de trabajo no GPU  no puede ajustar a estos nodos de la contaminación.
3. ¿Es el programa de Karpenter cubo o el programa de KAI? ¿Qué métricas pueden confirmar?
4. Por ejemplo, el módulo de preempleo desagregado 选择一个自动扩展信号,并为解码 pod 选择另一个不同信号――说明两者理由――
5. 计算 `WhenEmptyOrUnderutilized`Consolidación  En la trampa de un coste de 24x7 producción de servicio: este servicio tiene un evento de caída de solicitudes de 60 veces al día en promedio, y P99 TTFT > 10s:

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Karpenter | "the node provisioner" | Kubernetes 节点 autoscaler；亚分钟级供给 |
| Cluster Autoscaler | "the old scaler" | Kubernetes 节点 autoscaler 的前身；更慢，基于 group |
| KAI Scheduler | "the GPU scheduler" | 用于 gang + topology + queues 的 secondary scheduler |
| Gang scheduling | "all or nothing" | 原子化调度 N 个 pod，或全部延后 |
| Topology awareness | "rack-aware" | 基于 NVLink/IB/rack placement 放置 pod |
| `DCGM_FI_DEV_GPU_UTIL` | "GPU utilization" | Duty-cycle metric；不是 LLM 的 scaling signal |
| Queue depth | "waiting requests" | 对 prefill-bound scaling 正确的 HPA 信号 |
| KV cache utilization | "memory pressure" | 对 decode-bound scaling 正确的 HPA 信号 |
| Consolidation | "Karpenter consolidation" | 终止节点以迁移到更便宜的 instance type |
| `WhenEmpty + 1h` | "safe consolidation" | 不驱逐正在运行 GPU job 的策略 |

## 延伸阅读
- [KAI Scheduler GitHub](https://github.com/kai-scheduler/KAI-Scheduler) 设计文档和配置示例──
- [Karpenter Disruption Controls](https://karpenter.sh/docs/concepts/disruption/) política de consolidación 语义和 GPU-safe 默认值──
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) Dinamo Planner de escala de señales。
- [Ray docs — KAI Scheduler for RayClusters](https://docs.ray.io/en/latest/cluster/kubernetes/k8s-ecosystem/kai-scheduler.html)Ray está en el camino.
- [AWS EKS Compute and Autoscaling Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/aiml-compute.html) Guía específica de Kubernetes administrada
- [llm-d GitHub](https://github.com/llm-d/llm-d) Variación de carga de trabajo Autoscaler 设计。
