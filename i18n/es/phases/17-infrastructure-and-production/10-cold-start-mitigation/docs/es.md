# Mitigación de los primeros en frío de los LLM sin servidor

> Una imagen de modelo de 20 GB desde frío hasta servicio  necesita 5-10 minutos(7B) hasta 20+ 分钟(70B) ・・・ en un mundo sin servidor real, esto no es calentamiento, sino apagón。 Mitificaciones 作用在五层: pre-seeded node images(AWS arriba de Bottlerocket、 doble volumen de arco) 、modelo streaming(NVIDIA Run:ai Model Streamer, vLLM 原生支持) 、GPU memoria instantáneas(Modal checkpoints,restart 最多快 10x) 、hot pools(`min_workers=1`La carga de los sistemas de transferencia de datos de datos de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los servidores de los

**Type:** Learn
**Languages:** Python (stdlib, toy cold-start path simulator)
**前置要求：**Fase 17 · 02 (Economía de la plataforma de inferencia), Fase 17 · 03 (GPU Autoscaling)
**Time:** ~60 minutes

## El objetivo del aprendizaje
- 列举五层缓解冷启动, y en cada uno de ellos se dice una herramienta o patrón.
- 将 70B modelo 计算为 (provisión de nodos) + (pesos descarga) + (pesos carga en HBM) + (motor init) 之和。
- 解释为什么直播迁移 传输输输入代币(KB) en lugar de KV cache(GB),以及代价是什么(recomputación)。
- ¿Cuál es el precio de la CPU?`min_workers > 0` convertirse en el umbral de SLA necesario

##  problemas
Su punto final de LLM sin servidor en la escala nocturna a cero.

1. Proveimiento de Karpenter un nodo de GPU:45-60s.
2. Contenedor tirando un un un peso de 30 GB de imagen: 120-300s.
3. El motor cargará los pesos hasta HBM:45-120s, dependiendo del tamaño del modelo y la velocidad de almacenamiento.
4. vLLM o TRT-LLM Iniciación de gráficos CUDA ∼KV pool cache ∼Tokenizer:10-30s─

总计:220-510s(大约 3-8 分钟) 后才会返回一个代币──你的SLA是2s──你发出一个热池──`min_workers=1`), el problema parece desaparecer, pero ahora tienes que pagar por una GPU 24x7 ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅    ⋅                                                                                                                        

La mitigación de arranques fríos es un método que se aproxima a la latencia siempre en marcha mientras se mantiene la economía sin servidores.

## 概念
### Capas 1  预置节点镜像(Bottlerocket)

En AWS, la arquitectura de doble volumen de Bottlerocket separará el sistema operativo de los datos.`EC2NodeClass`En el caso de los nuevos nodos, los pesos ya están en el NVMe local, el paso 2 y el paso 3 desaparecen.

GCP 上的等价方案:带有预备包装层的自定义VM images──Azure 上:采用相同模式的管理盘快照──

### Capas 2  modelo de transmisión (Run:ai Model Streamer)

No es que la carga completa de archivo se complete nuevamente en la primera solicitud, sino que cada uno de los niveles transmitirá los pesos a la memoria de la GPU, y luego el primer bloque de transformador se iniciará en el procesamiento.

### Capas 3  Snapshots de memoria de GPU (Modal)

Modal en la primera carga 后对 GPU state(peso、CUDA gráficos、KV caché región) hacer punto de control。后续 restarts 直接 deserialize到HBM,比重新初始化快 10x。这最接近在 2 segundos内启动 一个热的 GPU──Trade-off:快照 绑定 per-GPU-topology,所以如果Karpenter将你迁移到不同 SKU,你需要重新检查点──

### Capas 4  piscinas calientes (min_trabajadores=1)

La más simple de la mitigación: mantener una réplica siempre lista. El costo es la tasa por hora de una GPU 24x7 para los modelos pequeños.$0.85-$1,50 para evitar el inicio frío de los 30), para los modelos grandes 则更友好(每小时支付 $4 para evitar el inicio frío de 5 minutos) ・pools calientes 变得必需 SLA umbral: normalmente es el modelo 70B+ 上 TTFT P99 < 60s。

### Capas 5  Carga en capas (LLM sin servidor)

ServerlessLLM se va a almacenar 视为一个层级:NVMe(快但大)、DRAM(中等但可分层)、HBM(小但即时)。Peso 预先加载到DRAM;按需加载到HBM。Paper 报告,相比天真盘到HBM,冷负载的延迟 降低10-200x。Producción adopción 仍处早期,但已经存在与vLLM的整合──

### Capas 6  Migración en vivo (patrón de bonificación)

Cuando algún nodo es necesario, el patrón tradicional es el inicio en frío, otra réplica y la secuencia de solicitud de desagüe. La migración en vivo introducirá Token (kilobytes) y se moverá hasta el destino del modelo cargado y se volverá a calcular el caché KV en el destino.

### Las matemáticas de la piscina caliente

 Para el servicio de P99 TTFT SLA para 2s, el problema no es ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿

- Rutas interactivas de alto valor (chats en vivo, agente de voz):`min_workers=1-2`¿Qué es eso?
- Caminos de lote de fondo: acepta escala a cero, tolerabilidad de 5-10 minutos de inicio en frío.
- Nivel de Premium: cada inquilino `min_workers`Y capacidad dedicada.

### Medir antes de optimizar

Nuevo nodo 上 70B modelo de anatomía de arranque en frío:

| Phase | Time | Mitigation |
|-------|------|-----------|
| Node provision | 50s | Bottlerocket + pre-seeded image, warm pool |
| Image pull | 180s | Pre-seeded data volume (eliminate) |
| Weights to HBM | 75s | Model streamer (halve); GPU snapshot (eliminate) |
| Engine init | 20s | Persistent CUDA graph cache |
| First forward | 3s | Min inherent latency |
| **Total cold** | **328s** | |
| **Total with mitigations** | **~15s** | 22x reduction |

### Números que debes recordar

- Inicio frío módico: 2-4 segundos (Usar imágenes de GPU)
- Baseten 默认 frío de inicio: 5-10s; utilizar precalentamiento 时 sub-segundo
- Inicio frío de 70B: 3-8 minutos.
- Run:ai Modelo de transmisión: ~ 2x velocidad de carga de peso.
- Carga en niveles de servidorlessLLM:latencia 降低 10-200x


```figure
cold-start-pipeline
```

## Usalo
`code/main.py`Para la mitigación de los tipos de problemas de incubación y de incubación, el tiempo total de incubación en frío, el coste de la piscina caliente y la tasa de requisito de equilibrio de la piscina caliente se deben informar.

##  entregarlo
本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-cold-start-planner.md` Determinar el tamaño del modelo y la forma del tráfico, seleccionar qué medidas de mitigación deben superarse.

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` calcular la tasa de solicitud de equilibrio: después de superar esta tasa, la réplica caliente 会比因 SLO 下额外请求下落而支付冷开始税 更便宜──
2. Usted desplegó un modelo 13B, P99 TTFT SLA para 3s.
3. El pre-seeding de botellas eliminó la atracción de la imagen, pero los pesos todavía necesitan ser cargados desde la instantánea hasta el HBM. Si la velocidad de lectura de NVMe respaldada por instantánea es de 7 GB/s, calcular el reloj de pared del modelo 70B.
4. ¿Qué es la reducción de las imágenes de la CPU? ¿Qué es la reducción de las imágenes de la CPU? ¿Qué es la reducción de las imágenes de la CPU?
5. Design a tiered warm-pool policy:pay users、trial users 和 batch workloads 分別需要多少热复制?展示计算过程──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Cold start | “the big pause” | Fresh replica 上从 request 到 first token 的时间 |
| Warm pool | “always-on minimum” | `min_workers >= 1`，保持至少一个 replica ready |
| Pre-seeded image | “baked AMI” | Container weights 已预先常驻的 node image |
| Bottlerocket | “AWS node OS” | 支持 dual-volume snapshot 的 AWS container-optimized OS |
| Model streamer | “streaming load” | 将 weights I/O 与 compute setup 重叠 |
| GPU snapshot | “checkpoint to HBM” | 序列化 post-load GPU state；restart 时 deserialize |
| Tiered loading | “NVMe + DRAM + HBM” | Storage tiers 的 hierarchy；按需 load |
| Live migration | “move tokens” | 传输 input（KB），在 destination 上 recompute KV |
| `min_workers` | “warm replicas” | Serverless minimum keep-alive count |
| Scale-to-zero | “full serverless” | Idle 时无 cost；接受完整 cold-start tax |

## 延伸阅读
- [Modal — Cold start performance](https://modal.com/docs/guide/cold-start) Modal 发布的基准和检查点架构──
- [AWS Bottlerocket](https://github.com/bottlerocket-os/bottlerocket) patrón de instantáneas de volumen de datos pre-semeados。
- [NVIDIA Run:ai Model Streamer](https://github.com/run-ai/runai-model-streamer) 将 pesiones de carga y configuración de cálculo 重叠──
- [Baseten — Cold-start mitigation](https://www.baseten.co/blog/cold-start-mitigation/) Libro de juego de precalentamiento。
- [ServerlessLLM paper (USENIX OSDI'24)](https://www.usenix.org/conference/osdi24/presentation/fu) Diseño de carga en niveles。
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) Desagregaciones de despliegues de migración en vivo。
