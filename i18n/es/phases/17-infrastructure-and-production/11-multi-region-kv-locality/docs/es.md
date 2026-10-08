# MLL de varias regiones con KV localidad de caché

> Para la caché de datos, el balance de carga de la red de robin es perjudicial. Una solicitud si no se cae en el punto de tener su prefijo, debe pagar el prefecto completo. El tiempo de caché alcanza aproximadamente 80 ms. Hasta 2026, el modelo de producción es el router consciente de caché.

**Type:** Learn
**Languages:** Python (stdlib, toy prefix-cache-aware router simulator)
**Prerequisites:** Phase 17 · 04 (vLLM Serving), Phase 17 · 06 (SGLang RadixAttention)
**Time:** ~60 minutes

## El objetivo del aprendizaje
- 解释为什么圆轮负载平衡会破坏缓存式推理,并量化 TTFT 惩罚──
- 画出 cache-consciente router:输入(KV-cache eventos) 算法(prefijo-hash match) ‧tie-breaker(utilización de GPU)
- Cuentan que el 32% de los LLM DR 失败驱动因素(缺失 Tokenizer 文件 / quantization config),并陈述三文件 DR checklist──
- 区分商业 transregional 产品(Bedrock CRI、GKE Multi-Cluster Gateway) con el enrutamiento con conocimiento de KV―

##  problemas
Su servicio se ejecuta en el este de los Estados Unidos-1、el oeste de los Estados Unidos-2 和 eu-oeste-1── Usted está en la parte delantera de un ALB,并使用圆.

La conclusión de la Inferencia de LLM es que el diseño es el de un estado: el caché KV codifica el modelo todo lo que ya ha visto.

Además, tu equipo tiene un plan DR. Tú has puesto los pesos de modelo en reserva hasta S3 transregional.

El programa de LLM multi-regional que sirve es el caché 问题、路由 问题和 DR higiene 问题, no es un equilibrio de carga 问题。

## 概念
### Enrutamiento consciente de la caché

Por favor, llegue con rapidez. Router hace hash a los prefijos (por ejemplo, 512 tokens); pregunta a cada réplica: ¿Tienes este prefijo en caché? 🏼 Réplica en bloques de distribución y expulsión 时, por medio de un canal público / sub 发布 KV-cache events。 Router selecciona una réplica que se ajuste; si no se ajuste, se retrocede a un tie-breaker basado en GPU-utile。

**vLLM Router**(Rust,2026 producción-estaca): 订阅 `kv.cache.block_added`eventos,维护 prefijo-hash → índice de réplica, usando O(1) búsqueda 路由──没有匹配时回落到最小排列深──

**llm-d router**: el mismo modelo,Kubernetes nativo.

**SGLang RadixAttention**(Fase 17 · 06) es el tipo de rotación de la réplica intrarreplica.

### Números

2K-token de la señal de arriba de TTFT P50,Llama 3.3 70B FP8,H100:
- El caché se encuentra en la misma réplica, prefijo residente: ~ 80 ms。
- Cache falta de preempleo frío): ~ 800 ms。

10x 差距── Si tu router entre réplicas  alcanza el 60-80% de prefijo de caché entre réplicas 命中, estás en N-replica 容量下接近单反复 性能── si es sólo el 10%, estás cerca de escalación ingenua──

### La latencia de la red en la región

RTT interregional:
- US-East-1  US-West-2: ~65 ms。
- Estados Unidos-este-1  eu-oeste-1: ~75 ms。
- Estados Unidos-este-1  ap-sureste-1: ~ 220 ms。

Si el enrutamiento Coloca una solicitud desde el este de los EE.UU.-1 送到 ap-southeast-1 的热前,节省的预填(800 → 80 ms) será objeto de 440 ms de viaje de ida y vuelta 抵消──GORGO(2026 investigación)把这一点显式化:联合最小化`prefill_time + network_latency`, en lugar de sólo minimizar el pre-cargamento. La respuesta es mantener el enrutamiento regional, a menos que el pre-cargamento ocupa la mayor parte de los prefijos de múltiples MB.

###  Comercio "inferencia transregional" aquí ayuda no está ocupado

Inferencia transregional de AWS Bedrock 会在容量压力期间自动把请求路由到其他地区──它优化可用性,不优化TTFT,并把 inferencia当作黑盒──GKE Multi-Cluster Gateway 也是一样的:service-level failover,不感知 KV cache──

Es decir, usando estos productos, todavía necesitas un router consciente de la caché de la app-layer.

### DR higiene: el 32% de archivos faltantes 问题

El 32% de los LLM DR  fracasa, porque el equipo reserva pesas, pero se olvida:

- `tokenizer.json`O `tokenizer.model`
- Configuración de cuantificación`quantize_config.json`、escales AWQ、 puntos cero GPTQ)
- Configuraciones específicas de modelo ((RoPE escalado,mascarillas de atención,plantillas de chat)
- Configuración del motor`vllm_config.yaml`、muestreo de defectos 、manifestos de adaptador LoRA)

修复方式是三文件最小 DR manifest:

1. HF modelo repo 下所有文件(pesos + configuraciones + Tokenizer)
2. 引擎特定服务配置── en el que se encuentra el servicio
3. Manifiesto de despliegue ((K8s YAML、Dockerfile、bloqueo de dependencia) ⋅

Además: cada trimestre se realiza una simulación DR. JPMorgan US-East-1 simulación en el mes de noviembre de 2024 alcanzar 22 minutos de recuperación, simplemente porque el libro de jugadas ya ha practicado.

### Residencia de datos es un problema

Si su router con conocimiento de caché para que coincida con el prefijo, envíe una solicitud de envío a los EE.UU.-East-1, entonces, independientemente de los beneficios del TTFT, usted ya ha violado el RGPD―Previamente, según el límite de residencia para los routers, re-optimice el caché―

### Debes recordar el número

- El caché golpeado vs. Miss TTFT 差距: ~10x(2K prompt 上 80 ms vs. 800 ms) ]]
- RTT interregional entre Estados Unidos y la UE: ~75 ms。
- Fallo DR: 32%  falta de configuración de Tokenizer/quantum。
- JPMorgan us-east-1 falloover 2024 年 11 月:22 分钟(30-min SLA) ⋅


```figure
cache-aware-router
```

## Usalo
`code/main.py`En la carga de trabajo multi-regional 上模拟三种路由策略(round-robin、cache-aware regional、cache-aware global)  report cache hit rate、TTFT P50/P99 和 cross-regional bill──

##  entregarlo
本课产 出  `outputs/skill-multi-region-router.md` regiones determinadas, restricciones de residencia y SLA, diseño de un plan de ruta.

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`❖ En 75 ms RTT abajo, ¿cuánto tiempo de ruta transregional se superará a la ruta local?
2. Su tasa de caché de impacto del 70%  descendió al 12%  diagnóstico de tres causas posibles, así como de confirmar los observables de cada causa 
3. Para un en vLLM en servicio, llevar 5 adaptadores LoRA de 70B AWQ-quantizado modelo diseño DR manifiesto.
4. 论证 Bedrock la inferencia transregional sobre la existencia de una tecnología fintech estricta de TTFT SLO es si no es suficiente.
5. Una petición de París se ajusta al prefijo de US-East-1 en el medio. ¿Vas a viajar por ella?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Cache-aware routing | "smart LB" | 基于 prefix-hash match，把请求路由到持有 KV-cache 的 replica |
| KV-cache events | "cache pub-sub" | Replicas 发布 block add/evict；router 建索引 |
| Prefix hash | "cache key" | 前 N tokens 的 hash，用作 router lookup |
| GORGO | "cross-region routing research" | arXiv 2602.11688；把 network latency 作为显式项 |
| Cross-region inference | "Bedrock CRI" | AWS 产品；availability failover，不感知 TTFT |
| DR manifest | "the backup list" | 恢复所需的每个文件，不只是 weights |
| Data residency | "GDPR boundary" | 关于哪个 region 可以看到 user data 的法律约束 |
| RTT | "round-trip time" | Network latency；75 ms US-EU，220 ms US-APAC |
| LLM-aware LB | "cache-hit LB" | 作为产品类别的 cache-aware router |

## 延伸阅读
- [BentoML — Multi-cloud and cross-region inference](https://bentoml.com/llm/infrastructure-and-operations/multi-cloud-and-cross-region-inference)
- [arXiv — GORGO (2602.11688)](https://arxiv.org/html/2602.11688v1) 带 retrasos 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 
- [TianPan — Multi-Region LLM Serving Cache Locality](https://tianpan.co/blog/2026-04-17-multi-region-llm-serving-data-residency-routing)
- [AWS Bedrock Cross-Region Inference](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html) documentación de fallas de disponibilidad。
- [vLLM Production Stack Router](https://github.com/vllm-project/production-stack) fuente de router consciente de la caché。
