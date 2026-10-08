# Utiliza LMCache KV Descarga de la pila de producción de vLLM

> La producción-estaca de vLLM es referencia a Kubernetes 部署,把路由器、引擎和可观察性 连接在一起──LMCache es la capa de descarga KV, extrae la caché KV de la memoria de la GPU, y utiliza entre consultas y motores ̇ primero CPU DRAM, luego disco/Ceph)──vLLM 0.11.0 KV descarga Connector(1 de enero de 2026) a través de la API de conector v0.9.0+) ̇ hacer que este proceso sea asincrono ̇ y accesible──Offload latencia no se comparte directamente con el usuario── incluso sin prefijos,LMCache también tiene un gran precio: cuando se utiliza KV ̇, se pueden recuperar el máximo de las solicitudes de precarga, no se puede volver a calcular ̇ basado en un precuadro de 4V ̇ un alto nivel de 16V ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇

**Type:** Learn
**Languages:** Python (stdlib, toy KV-spill simulator)
**前置要求：**Fase 17 · 04 (VLLM Serving Internals), Fase 17 · 06 (SGLang/RadixAttention)
**Time:** ~60 minutes

## El objetivo del aprendizaje
- 图出 vLLM producción-pica de cada uno de los niveles: enrutador, motores, descarga de KV, observabilidad.
- 解释 KV Offloading Connector API ((v0.9.0+), así como 0.11.0 camino asincrónico 如何隐藏脱载延迟──
- 量化 LMCache CPU-DRAM 何時有幫助 (KV > HBM),以及何時只增加上空费 (KV)  小到足以放入 HBM) 
- 根据部署限制,在本土 vLLM CPU脱载和LMCache连接器 之间做选择──

##  problemas
Su vLLM se sirve en concurrencia 上升时显示 GPU HBM 达到 100%,并出现预先事件── Requests 被驱逐、requeue,然后与一个2K-token prompt 在一分钟内被重新填充四次──GPU computador 被花在重复的预填上; 产量远低于原产量──

增加更多GPU 成本是线性的──增加更多HBM 不可能──但CPU DRAM 很便宜,一个插座就像有512GB+,延迟比HBM 差几数级,但对临时保温的KV缓存来说足够──

LMCache 会把 KV cache 抽取到CPU DRAM,让预先请求 快速恢复,并让引擎 之间的重复预先语 共享缓存,而不需要每个引擎都重新预先充

## 概念
### VLLM - pila de producción

`github.com/vllm-project/production-stack`Para referirse a la organización Kubernetes:

- **Router** Cache-consciente(Fase 17 · 11)。消费 KV eventos。
- **Engines** trabajadores de VLLM── cada GPU, o cada grupo TP/PP, uno──
- **KV cache offload** Despliegue de LMCache o conector nativo。
- **Observability** Prometheus raspadura, tablas de control de Grafana, huellas de OTEL.
- **Control plane** descubrimiento de servicios configurar  actualizaciones de rodaje

以 Helm chart + operador 形式交付。

### API de conector de descarga de KV (v0.9.0+)

vLLM 0.9.0  introdujo la API de Conector, para utilizar los backends de caché KV enchufables. Su motor descargará los bloques hacia el conector; el conector los almacenará en su memoria.

vLLM 0.11.0(2026 年 1 月) aumentó la ruta de descarga sincrónica: en los casos comunes, la descarga puede ocurrir en la base, por lo que el motor no será bloqueado. La latencia de extremo a extremo y el rendimiento siguen dependiendo de la forma de la carga de trabajo, la tasa de caché de KV y la presión del sistema.

### Descarga de CPU nativa vs LMCache

**Native vLLM CPU offload**:motor-local──把 KV bloques 存储在主机RAM中──实现快,零网络 hop──不能跨引擎──

**LMCache connector**:Cluster-scale──把 bloques 存储在共享LMCache servidor(CPU DRAM + Ceph/S3 tier) 中── cualquier motor pueden acceder a los bloques── ya hay 16x H100 referentes 发布──

Cuando un solo motor tiene presión HBM 时选择 native──当多个引擎 共享预写 时选择 LMCache(带共同系统提示的RAG、带共享模板的多租户)──

### Comportamiento de referencia

Distribuido en 4 台 a3-highgpu-4g 上的 16x H100(80 GB HBM) Test:

- Bajo impacto de KV: reducción de las instrucciones, baja concurrencia: todas las configuraciones son equivalentes a la línea de base, LMCache aumenta aproximadamente el 3-5% de los gastos generales.
- Moderada huella:LMCache 开始在引擎 之间的 prefijo reutilización 上带来帮助。
- KV  supera HBM:descarga de CPU nativa y LMCache se incrementan significativamente el rendimiento; LMCache  aumenta más, ya que hay intercambio entre motores。

### Cuando el LMCache es decisivo

- 多个租户 共享系统提示 的多租户服务──
- Los fragmentos de documentos en las consultas 之间重复的 RAG──
- Con la misma base de las variantes mejoradas de la LoRA, el modelo base KV reutiliza reducido el trabajo de repetición.
- Cargas de trabajo pesadas de prevención: desde la CPU restaurar 比重新预充更便宜──

### Cuando NO habilitar

- La presión de HBM es muy pequeña.
- Contexto corto ((< 1K tokens): tiempo de transferencia > 重新 prefill。
- Carga de trabajo de un solo inquilino: no hay reutilización captada.

### Integración con servicio desglosado

Fase 17 · 17 desagregado de servicio + LMCache 会叠加增益: de prefill pool hasta el decodear pool de transferencias de KV si no se utiliza, se cae en LMCache; posteriores consultas 会从 LMCache 拉取──Fase 17 · 11 router consciente de caché puede enviar las solicitudes a caché local o en el motor de caché compartido de LMCache 匹配──

### Números que debes recordar

- vLLM 0.9.0: API del conector 发布──
- vLLM 0.11.0(2026 年 1 月):camino de descarga sincrónico; impacto de latencia de extremo a extremo 取决于工作负荷、KV hit rate 和系统压力(不是绝对保证) 』
- 16x H100: Cuando la huella de KV supera a la HBM, LMCache tiene ayuda.
- Presión de HBM: tiene un coste general del 3-5% y no tiene ningún beneficio.


```figure
zero-sharding
```

## Usalo
`code/main.py`Se trata de un proyecto de investigación que se desarrolla en el sector de la tecnología de la información y de la información.

##  entregarlo
本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-vllm-stack-decider.md` dar forma determinada de la carga de trabajo y la implementación de vLLM, juzgar seleccionar nativo ◦ LMCache, o bien los dos están en juego.

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`¿Cómo se puede empezar a planificar el uso de HBM?
2. 某租户 每小时 200 查询 共享一个 6K-token系统提示──计算每租户 预期的 LMCache节省──
3. El servidor LMCache es un punto único de fracaso.
4. LMCache en disco giratorio 上存到 Ceph──对于70B FP8 下4K-token KV(500 MB), leer tiempo 相比重填怎么样?
5. 论证 vLLM 0.11.0 camino sincrónico ¿Y si?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Production-stack | “参考部署” | vLLM 的 Kubernetes Helm chart + operator |
| Connector API | “KV backend interface” | vLLM 0.9.0+ 的 pluggable KV store interface |
| Native CPU offload | “engine-local spill” | 把 KV 存到同一 engine 的 host RAM 中 |
| LMCache | “cluster KV cache” | CPU DRAM + disk 上的 cross-engine KV cache server |
| 0.11.0 async | “non-blocking offload” | 隐藏在 engine stream 后面的 offload |
| Preemption | “evict to make room” | HBM 满时的 KV cache shuffle |
| Prefix reuse | “same system prompt” | 多个 queries 共享开头；cache hit |
| Ceph tier | “disk tier” | cache hierarchy 中 DRAM 下方的 durable storage |

## 延伸阅读
- [vLLM Blog — KV Offloading Connector (Jan 2026)](https://blog.vllm.ai/2026/01/08/kv-offloading-connector.html)
- [vLLM Production Stack GitHub](https://github.com/vllm-project/production-stack) Diagrama del casco + operador。
- [LMCache for Enterprise-Scale LLM Inference (arXiv:2510.09665)](https://arxiv.org/html/2510.09665v2)
- [LMCache GitHub](https://github.com/LMCache/LMCache) Implementación de los conectores。
- [vLLM 0.11.0 release notes](https://github.com/vllm-project/vllm/releases) detalles del camino asincrónico。
