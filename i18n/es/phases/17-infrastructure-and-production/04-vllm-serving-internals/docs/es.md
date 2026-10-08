# vLLM Servicio interno:PageAttención, Batchamiento continuo, Preempleo en pedazos

> vLLM en 2026 su dominio depende de tres configuraciones predeterminadas superpuestas entre sí, no de una sola técnica. PagedAttention 始终开启.Continuous batching 会在解码演变之间将新请求输入活批.`code/main.py`Un juego continuo en batcher termina, se hace como vLLM un modo de preemplazo y decodificación.

**Type:** Learn
**Languages:** Python (stdlib, toy continuous batching scheduler)
**前置要求：**Fase 17 · 01 (Servir de modelo), Fase 11 (Ingeniería de LLM)
**Time:** ~75 minutes

## El objetivo del aprendizaje
- 将 PagedAttention  Explicar el alocador de caché KV:bloques, tablas de bloques, y por qué la fragmentación se mantiene en el 4% de carga de producción abajo:
- En la iteración 层面画出连续批发:完成的序列 如何离开批发,新序列 如何加入,而不需要排水──
- Usar una frase para describir el preempleo en pedazos,并说出它保护的是哪哪个延迟度度 (título: es la cola TTFT, y no el rendimiento medio)
- Explicar que 2026 vLLM v0.18.0 afectará a aquellos que una vez activaron todos los equipos optimizados de la gotcha.

##  problemas
PyTorch simple sirve en un ciclo una vez ejecuta una solicitud: tokenize, prefill, decode hasta EOS, retorno. Un usuario tiene tiempo para esto. Cuando hay cien usuarios, es un equipo de personas que esperan pacientemente.

vLLM 同时解决三个问题──PagedAttention 阻止KV cache 碎片化像经典连续分配那样吃掉60-80% de la memoria de la GPU──Continuous batching 允许 las solicitudes en cada iteración de descodage entre la incorporación y la salida del lote, por lo que el lote 始终充满真实工作──Cumplido preempleo 32 将k-token prompt 拆成约512-token 的切片,并与解码交错执行,因此长速不结 GPU 上的每个解码代码令──

El valor predeterminado de producción para el año 2026 es el primero en todo. Necesitas entender el papel de cada mecanismo, porque el modelo de fracaso está en el cronograma, no en el modelo.

## 概念
### PagedAttention  como sistema de memoria virtual

KV cache para cada secuencia para decir que es`num_layers × 2 × num_heads × head_dim × seq_len × bytes_per_element` Para los 8192 tokens de Llama 3.3 70B, en BF16 abajo cada secuencia ≈ 1.25 GB── si para cada solicitud 预留 8192 槽, pero en promedio la solicitud sólo utiliza 1500 tokens, entonces usted perderá alrededor del 82% de los HBM previamente reservados── clásico lotes 会付出这个部分浪费──

PagedAttention 借鉴了 OS virtual memory的思想──KV cache no se basa en secuencia 连续存放的──它以固定大小的块 分配(默认16代币)──cada secuencia tiene una tabla de bloque, que se proyecta en su posición lógica de token 映射到物理块 ID──cuando una secuencia 超越分配的块 时,会再添加一个块──cuando termine, sus bloques volverán a la piscina──

碎片化 de 60-80% (clásico modo) bajará al 4% (en inglés):`--gpu-memory-utilization`(默认 0.9), dice que vLLM en carga de pesas y activaciones 后, para KV bloques 预留多少HBM──

### Iteración 层面的 Batchamiento continuo

旧式 dynamic batching 会等一个窗口(比如10 ms) para llenar el lote, luego ejecutar prefill + decode + decode + decode, hasta que cada secuencia 完成──快序列 会提前离开并置, mientras que la GPU 继续处理慢序列──

Batchamiento continuo en cada paso de decodificación 之间运行──把正在运行的序列 集合称为 `RUNNING`Lista── en cada iteración

1. `RUNNING`Cualquier secuencia de EOS o max_tokens que haya alcanzado el punto de partida será eliminada.
2. programador 查看 espera cola。 si hay bloques KV, que recibirá nuevas secuencias(preenchar o reanudar)。
3. pase hacia adelante en el momento`RUNNING`El contenido del medio se ejecuta, para cada secuencia Emitir un nuevo token 

Tamaño del lote  Nunca será empolvado hasta el número fijo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               `V1 scheduler` Key Invariant: Scheduler Cada iteración de decodificación 运行一次, en lugar de cada solicitud 运行一次。

### Precarga en pedazos  protección de cola TTFT

Prefill es un proceso de computación. En el ciclo de servicio, la latencia de un primer token de un largo prompt se convertirá en la latencia de un par de otros usuarios.

Preemplazo en pedazos preemplazará preemplazará en pedazos de tamaño fijo (defórmado 512 tokens), y se ejecutará en pedazos como unidad de regulación. Entre pedazos, el programador puede permitir que las secuencias de decodificación avancen hacia un token.

### Tres configuraciones por defecto interactuarán

Estas tres funciones se suponen mutuamente existen. Atención pagada para programador. proporciona un recurso de KV de pequeña magnitud para sopesar.`RUNNING`Las decisiones tomadas por el programa son simplemente otra política de planificación, no un sistema independiente.

Usted no necesita saber cada bandera. Usted necesita saber el programador.

### 2026 años v0.18.0 de gotcha

En vLLM v0.18.0 , no puedes ser`--enable-chunked-prefill`Con el modelo de proyecto de descifrado especulativo`--speculative-model`Las notas de liberación de N-gram en los horarios de V1 son excepciones a la descifrado especulativo de GPU N-gram. Los que no leen las notas de liberación en el equipo de todos los banderas se encontrarán con un error de tiempo de ejecución en el inicio, en lugar de una regresión de la softness. Si su especulación                                                                                                                                                                                                                                                                                                                                                                                                                                            

### Debes recordar el número

- Llama 3.3 70B FP8, H100 SXM5,128 并发, 三者全开:2,200-2,400 tok/s。
- Como modelo,默认 vLLM (((no preemplazo en pedazos): ~ 1,800 tok/s。
- El mismo modelo, simple PyTorch en bucle hacia adelante: ~600 tok/s.
- Productos y servicios de transporte de vehículos de alta velocidad
- 混合负载下 P99 ITL: utiliza precarga en pedazos 时 ~15 ms,不使用时 ~50 ms。

### modelo de programador

```
while True:
    finished = [s for s in RUNNING if s.is_done()]
    for s in finished: release_blocks(s); RUNNING.remove(s)

    while WAITING and have_free_blocks_for(WAITING[0]):
        s = WAITING.pop(0)
        allocate_initial_blocks(s)
        RUNNING.append(s)

    # schedule prefill chunks + decode in one batch
    batch = []
    for s in RUNNING:
        if s.in_prefill:
            batch.append(next_prefill_chunk(s))   # e.g. 512 tokens
        else:
            batch.append(decode_one_token(s))     # 1 token

    run_forward(batch)                            # one fused GPU call
```

`code/main.py`Está en este ciclo de Python  versión, usando falsos recuentos de tokens 和 falsos latencia hacia adelante.


```figure
tensor-parallel
```

## Usalo
`code/main.py`模拟一个vLLM风格的调度器,并带有可切换功能──运行:

- `NAIVE`Modo: una sola solicitud, sin lotes.
- `STATIC`modo: paje y espera, clásico lotado
- `CONTINUOUS`modo:iteration 级别的 admisión 和 liberación。
- `CONTINUOUS + CHUNKED`modo:precumplir 切片与解码 交错。

输出会展示总吞吐量 (títulos por segundo virtual) 、TTFT mean 和 P99 ITL。`CONTINUOUS + CHUNKED`Esta línea en el tráfico mixto debería tener un beneficio.

##  entregarlo
本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-vllm-scheduler-reader.md` dar una configuración de servicio:  tamaño de lote  utilización de memoria KV  tamaño de preenrollo en pedazos  configuración especulativa), generará un diagnóstico de cronómetro, señalando cual de los tres configuraciones de configuración está siendo un problema y qué debe ser modificado.

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ en contenidos de cortas peticiones y de larga demanda de trabajo mixto 上比较 `STATIC`Con`CONTINUOUS`¿La diferencia de rendimiento proviene de dónde, es la eficiencia de preempleo, la eficiencia de decodificación o la latencia de cola?
2. Modificar este horario de juegos, añadir`--max-num-batched-tokens`△ Para el funcionamiento de Llama 3.3 70B FP8 de H100, ¿cuánto es el valor exacto?
3. 重新阅读 vLLM v0.18.0 notas de lanzamiento... ¿Qué banderas 组合 es mutuo?
4. 针对 1,000 个请求的追踪 计算 KV cache 碎片化浪费,平均 1,500 output tokens,std 600 tokens,分别在以下条件下:(a) 以 8192 max 进行连续每请求分配,(b) 使用16 token blocks 的 PagedAttention。
5. Usage ein段话 Explique por qué el preempleo en pedazos ayuda a P99 ITL, pero solo mira no aumenta el rendimiento.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| PagedAttention | “KV trick” | 用于 KV cache 的固定大小 block allocator；碎片化 <4% |
| Block table | “page table” | 每个 sequence 从 logical token position 到 physical KV block 的映射 |
| Continuous batching | “dynamic batching, but right” | 每个 decode iteration 都做 admit/release 决策 |
| Chunked prefill | “prefill splitting” | 将长 prefill 拆成 512-token 切片并与 decode 交错 |
| TTFT | “first token time” | Prefill + queue + network；在长 prompts 下由 prefill 主导 |
| ITL | “inter-token latency” | 连续 decode tokens 之间的时间；由 batch size 主导 |
| Goodput | “满足 SLO 的 throughput” | 每个 request 仍命中 TTFT 和 ITL targets 时的 tokens/sec |
| V1 scheduler | “new scheduler” | vLLM 的 2026 scheduler；N-gram spec decode 是与 chunked-prefill 兼容的路径 |
| `--gpu-memory-utilization` | “memory knob” | 在 weights 和 activations 之后为 KV blocks 预留的 HBM 比例 |

## 延伸阅读
- [vLLM documentation — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode/) 关于 关于 碎片预填与 兼容性的官方来源
- [vLLM Release Notes (NVIDIA)](https://docs.nvidia.com/deeplearning/frameworks/vllm-release-notes/index.html) 2026 cadencia de lanzamiento 和 especificaciones de la versión
- [vLLM Blog — PagedAttention](https://blog.vllm.ai/2023/06/20/vllm.html) 仍然定义如何理解分配器 的原始文章──
- [PagedAttention paper (arXiv:2309.06180)](https://arxiv.org/abs/2309.06180) 碎片化分析与时间表设计──
- [Aleksa Gordic — Inside vLLM](https://www.aleksagordic.com/blog/vllm) 带有火焰图的详细 V1 cronista paseo a través。
