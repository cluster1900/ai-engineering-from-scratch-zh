# 面向 Prefijo-Tornos de trabajo pesados de SGLang y RadixAttención

> SGLang va a almacenar el cache KV 视为一等、可复用资源,并存储在基根树中──vLLM 根据FCFS(first-come, first-served)调度请求, mientras que el cronista consciente de caché de SGLang va a priorizar el procesamiento con un requisito de prefijos compartidos más largos, en esencia es la primera profundidad de la travesía de radix, dejar que las ramas calientes 保持在 HBM ⋅ en Llama 3.1 8B 配合GPT-like 1K GPU ⋅ en el campo de las instrucciones de la Llama 3.1 ⋅ GPT ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ Gp ⋅ G ⋅ G ⋅ G ⋅ G ⋅ G ⋅ G ⋅ G ⋅ G ⋅ G ⋅ G ⋅ G ⋅ G ⋅ G ⋅ G ⋅ G ⋅ G ⋅ G                                                   

**Type:** Learn
**Languages:** Python (stdlib, toy radix-tree cache + cache-aware scheduler)
**前置要求：**Fase 17 · 04 (VLLM Serving Internals), Fase 14 (Agentic RAG)
**Time:** ~75 minutes

## El objetivo del aprendizaje
- draw out RadixAttención:prefijos cómo almacenarse en el árbol radix, así como bloques KV cómo en las secuencias de raíz en la misma rama  compartición
- Explicar la planificación consciente de caché, y por qué FCFS no se adapta al tráfico pesado de prefijos.
- 给定 prefix-cache hit rate 和 prompt length distribution, calcular un determinado trabajo de carga de velocidad prevista―
- Para decir que 6.4x este número es real, no es una disciplina de orden de errores.

##  problemas
经典服务 会把每个请求的提示 当作不透明──即使5000个RAG请求都用同一个2000-Token系统提示加同一个检索序言 开头,vLLM也会对这个2000-Token预写填写5000次──GPU 一次又一次地做同一个工作──

观察结论是:agentic 和 RAG workloads 中的提示 几乎总是共享长久的预写.

RadixAttention está haciendo esto. Los tokens son indexados en el árbol radix; cada nodo  posee una secuencia de tokens desde la raíz hasta el nodo  en el camino hacia los bloques KV correspondientes.

El reto está en la programación. Si dos solicitudes comparten prefijo de 2,000 tokens, y la tercera solicitudes sólo comparten el mismo prefijo de 200 tokens, usted querrá poner dos solicitudes de larga compartición juntos en el servicio, hacer que el prefijo de larga compartición permanezca en el HBM.

## 概念
### 作为 KV índice de árbol de radix

árbol radix(trie compacto) almacenamiento Secuencias de Token。 cada nodo 拥有一个 Token range,以及为该范围 计算出的 KV blocks。Children 会把 secuencia 扩展一个或多个 Token。

```
root
 |- "You are a helpful assistant..."  (2,000 tokens, 124 KV blocks)
      |- "Context: <doc A>..."        (500 tokens, 31 blocks)
           |- "Question: Alice..."    (80 tokens, 5 blocks)
           |- "Question: Bob..."      (95 tokens, 6 blocks)
      |- "Context: <doc B>..."        (520 tokens, 33 blocks)
```

Una nueva solicitud con un sistema de solicitud + "Contexto: <doc A>" + "Preguntas: Carol" 进来──调度器遍历:system prefix 匹配(复用124 blocks),doc-A rama 匹配(复用31 blocks), entonces sólo para "Preguntas: Carol" 分配新块(4 blocks)──Prefilar costo: 4 bloques de nuevos Token──没有这个树: 160 blocks──prefill 省约 ~40x──

### Programación de almacenamiento en caché

Si el cache no se desvanece, el uso repetido de los árboles radix no tiene sentido.

1. **Depth-first dispatch**◊ Seleccionar una petición en la cola, priorizando la selección con el conjunto de ejecuciones en curso  Rooted to the same branch                                                                                                                                                                                                                                              
2. **Branch level 的 LRU，而不是 block level 的 LRU** Destruir todas las ramas de las hojas más cortas utilizadas 开始), en lugar de bloques individuales, así que la forma de caché 才与基根形 匹配──

FCFS  violaron estos dos puntos  Compartir la solicitud de 2,000 Tokens  Compartir 50 Tokens  Después de la solicitud de 50 Tokens, luego la rama de 2,000 Tokens fue expulsada, para poder admitir la solicitud de 50 Tokens 

### Debes recordar el índice de referencia

- Llama 3.1 8B、H100、ShareGPT 1K solicitudes:SGLang ~ 16,200 tok/s,对比 vLLM ~ 12,500(aproximadamente 29% 优势) ⋅
- Prefijo RAG pesado ((seme sistema + 相同 doc, variación pregunta):SGLang 上最高可达6.4x。
- Cargas de trabajo de clonación de voz: 86,4% de prefijos y tasas de caché de acceso.
- Las tasas de éxito de producción de los clientes de SGLang: depende de la disciplina inmediata, por el 50-99%.
- 2026 años ya se ha desplegado en 400.000+ GPUs.

### ordenando 陷

6.4x Este número depende de la orden de plantilla de pedidos. Si su cliente en ciertas peticiones se compone de pedidos.`[system, tools, context, history, question]`, entre otras peticiones`[system, context, tools, history, question]`, árbol no puede encontrar prefijo compartido. Para humanos parece algo como prefijo compartido, para árbol radix, dos secuencias diferentes.

工程师的杆: tu plantilla de solicitud es la clave de caché.

En el caso actual de la investigación: mover el contenido dinámico  mover el prefijo cachéable, hacer una vez la tasa de éxito de la implementación de caché  a través de una modificación de 7%  aumentar a 74% ⋅

### RadixAttention Win en donde,输 en donde

Las ganancias:
- RAG ((el mismo preámbulo de recuperación, pregunta de cambio)
- Agentes (esquemas de herramientas similares, consulta de cambios)
- 带长系统提示的聊天──
- 具有重复 preámbulos de la voz / visión cargas de trabajo。

Perderes( Volver a la capacidad de nivel VLLM):
- Utiliza las instrucciones únicas de generación de un solo disparo de código completado, no hay un sistema de instrucciones de chat abierto.
- Cada solicitud tiene contenido único 交错插入 prefijo de las instrucciones dinámicas.

### ¿Por qué es un programación  problema, no sólo un núcleo  problema

Se puede hacer reutilizar KV en un truco del núcleo. Solo cuando el regulador haga que la rama caliente se mantenga residente, se puede reutilizar.

### Interacciones con el VLLM

Estos dos sistemas no son una competencia estricta.`--enable-prefix-caching`La diferencia se ha reducido, pero no ha desaparecido por completo, toda la pila de SGLang es radix-first; vLLM es posterior a la siguiente.


```figure
roofline
```

## Usalo
`code/main.py` Implementar una caché KV de árbol radix de juguete, así como un cronista con dos estrategias:FCFS y caché-consciente.  Permitirá que la misma carga de trabajo se dividan a través de ambos.  Report prefijo-cache hit rate y delta de rendimiento.  Luego ejecutará una ordenada con problemas  carga de trabajo, mostrando 6.4x  cómo se derrumbe.

##  entregarlo
本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-radix-scheduler-advisor.md` dar una descripción de la carga de trabajo  la forma de la plantilla de solicitud  el patrón de recuperación  la cantidad de inquilinos concurrentes  generar una receta de pedido de solicitud de solicitud, así como el uso de la opción de no-entrada de SGLang 

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ en la misma carga de trabajo 上比较FCFS 和缓存意识──delta ¿de dónde viene, es prefill ahorros ‧decode ahorros, o retraso en la cola?
2. Modificar la carga de trabajo, hacer las instrucciones 随机排列 `[system, tools, context]`¿Qué ocurrirá? ¿Por qué?
3. 计算在 Llama 3.1 8B 上, como una rama radix 保持一个2000-Token sistema de inmediato residente de HBM costo── con 16 secuencias de costo de lote de reutilización sin prefijo hacer comparación──
4. 阅读 SGLang RadixAttention paper──用三句话解释为什么在预写重负载下,arbol de forma de LRU desalojo 优于 bloque de forma de LRU──
5. 某客户报告缓存击率只有8%──说出三个可能原因,以及你会为每一个原因运行的诊断──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| RadixAttention | "SGLang 那个东西" | KV cache 以 radix tree 索引，使 shared prefixes 能复用 blocks |
| Radix tree | "compact trie" | 每个 node 拥有一个 Token range 及其 KV blocks 的 tree |
| Cache-aware scheduler | "hot-branch-first" | 优先处理共享 resident branch 的请求的调度器 |
| Prefix-cache hit rate | "你的 prompt 有多少是免费的" | 从复用 KV blocks 服务的 prompt Tokens 比例 |
| FCFS | "first-come first-served" | 会破坏 prefix locality 的默认 scheduling |
| Branch-level LRU | "驱逐 leaf" | 与 radix shape 匹配的 eviction policy |
| Prompt template ordering | "cache key" | prompt 的 component order 决定 tree 能共享什么 |
| System prompt pinning | "resident prefix" | 保持 immutable system portion pinned，以避免 eviction thrash |

## 延伸阅读
- [SGLang GitHub](https://github.com/sgl-project/sglang) fuente 和 docs。
- [SGLang documentation](https://sgl-project.github.io/) RadixAttención y programación 细节──
- [SGLang paper — 高效编程 Large Language Models (arXiv:2312.07104)](https://arxiv.org/abs/2312.07104) 设计参考──
- [LMSYS blog — SGLang with RadixAttention](https://www.lmsys.org/blog/2024-01-17-sglang/) referencia numeral y razonamiento del programador。
- [vLLM — Prefix Caching](https://docs.vllm.ai/en/latest/features/prefix_caching.html) vLLM  propia realidad de tipo radix, para comparar 
