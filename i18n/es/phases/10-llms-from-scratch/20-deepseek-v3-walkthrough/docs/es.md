# Profundidad-V3 架构讲解

> Fase 10 · Lección 14  Nombró cada modelo abierto seis arquiteturas que se regularán  DeepSeek-V3  12 de enero de 2024,                                                                                                                                                                                                                                           

**类型：**El aprendizaje
**语言：**Python(stdlib,参数计算器)
**先修要求：**Fase 10 · 14(Open Modelo讲解) 、Fase 10 · 17(NSA) 、Fase 10 · 18(MTP) 、Fase 10 · 19(DualPipe)
**时间：**75 minutos

## El objetivo del aprendizaje

- Desde arriba hasta abajo lee Configuración de DeepSeek-V3, y utiliza seis GPT-2 旋加四 DeepSeek 特有新增项来解释每段──
- 推导总参数(671B)、活跃参数(37B), así como sus componentes
- 计算 128k context 下 MLA's KV cache 占用,并与一个活跃参数相同、使用 GQA's dense model 需要付出的代价进行比较──
- En el artículo, que describe cuatro proyectos de DeepSeek, se menciona que MLA, MTP, routing auxiliar sin pérdidas, DualPipe, y se señala en qué parte de cada uno de ellos se trata de una estructura o una pila de entrenamiento.

##  problemas

DeepSeek-V3 es la primera estructura en la que existe una diferencia de principio entre la familia de Llama y el modelo abierto. Llama 3 405B es la primera en regular los seis giros de GPT-2🏼.

Aprender sus beneficios es: DeepSeek-V3 de Open Weights  Publicar cambió el significado de la capacidad de frontera en el modelo abierto . Esta estructura es una de las muchas carreras de capacitación de 2026 .

## 核心概念 核心概念 核心概念 核心概念

### No cambia el núcleo, vuelve a ver una vez más.

DeepSeek-V3  sigue siendo autoregresista── sigue siendo un conjunto de bloques de decodificación── cada bloque  sigue siendo un bloque de atención, además de MLP, además de dos RMSNorm── sigue siendo un sistema de MLP con un sistema de control de velocidad.

### 转折:用 MLA 取代 GQA

Desde la Fase 10 · 14 Ya sabes, GQA 通过让多组 Q heads 共享 K 和 V 来缩小 KV cache──Multi-Head Latent Attention(MLA) Más adelante: K 和 V se comprime a una representación latente de bajo rango compartida(`kv_lora_rank`), luego en el cálculo en tiempo por cabeza 解压──KV caché sólo se almacena latente, por lo general es por cada token cada capa 512 个浮点数, en lugar de 8 x 128 = 1024 个浮点数──

En el contexto de 128k, utiliza DeepSeek-V3 de MLA, para cada token, cada capa, una compartición latente.`c^{KV}`;K y V están pasando por la proyección ascendente de este latente 派生, mientras que estas proyecciones ascendentes pueden ser absorbidas hasta el posterior matmul):

```
kv_cache = num_layers * kv_lora_rank * max_seq_len * bytes_per_element
         = 61 * 512 * 131072 * 2
         = 7.6 GB
```

Una hipótesis de GQA 基线(Llama 3 70B 形状,8 头KV,头 Dim 128) necesita:

```
kv_cache = 2 * 61 * 8 * 128 * 131072 * 2
         = 30.5 GB
```

En el contexto de 128k, MLA es menor que Llama-3-70B 风格的 GQA cache 小 4 倍──

权衡是:MLA en cada atención 计算时增加一步按头的解压――额外计算量相对省的带宽很小――对长背景 推理说,净收益为正――

### Enrutamiento:equilibrio de carga sin pérdidas auxiliares

Los routers de MoE deciden cada token por parte de los mejores expertos en el procesamiento. Routers simples concentrarán demasiado trabajo en unos pocos expertos, lo que llevará a otros expertos a colocarlo. El método de revisión estándar consiste en agregar un elemento auxiliar de pérdida, para castigar el desequilibrio de carga.

DeepSeek-V3 introdujo un tipo de programa auxiliar sin pérdidas.`e`过载,就降低 `bias_e`Si la carga es insuficiente, ¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡

Efecto de la pérdida principal: no se puede medir. Efecto de la estructura de la EMO: más, no se necesita modificar el hiperparámetro auxiliar de pérdida.

### MTP: más intenso entrenamiento + 免费草案

Desde la Fase 10 · 18 ya sabes, DeepSeek-V3  ha aumentado el módulo MTP de D=1, para ser utilizado para predecir los dos signos de las siguientes posiciones ∙ En la fase de cálculo, el módulo de entrenamiento bueno fue reutilizado como un proyecto de descifrado especulativo, aceptación ∙ más del 80% ∙ En la fase de entrenamiento, cada estado oculto ∙ fue supervisado por D+1 = 2 个目标, proporcionando señales más densas ∙

参数: en 671B principal 之上增加 14B──开销:2.1%──

### 训练:DualPipe

Desde la Fase 10 · 19 ya sabes, DualPipe es una especie de tubería bidireccional, que se moverá hacia adelante y hacia atrás con los trozos de todo a todo  comunicación sobreposición ⋅ en la escala de 2,048-H800 de DeepSeek-V3, aproximadamente se recupera de 1F1B original debido a las burbujas de tubería ⋅ pérdida de 245k GPU-hora ⋅

### Config,逐字段解析

La siguiente es la configuración de DeepSeek-V3:

```
hidden_size: 7168
intermediate_size: 18432   (dense MLP hidden size, used on first few layers)
moe_intermediate_size: 2048 (expert MLP hidden size)
num_hidden_layers: 61
first_k_dense_layers: 3    (first 3 layers use dense MLP)
num_attention_heads: 128
num_key_value_heads: 128   (formally equal to num_heads under MLA, but
                           the real compression is in kv_lora_rank)
kv_lora_rank: 512          (MLA latent dimension)
num_experts: 256            (MoE expert count per block)
num_experts_per_tok: 8      (top-8 routing)
shared_experts: 1           (always-on shared expert per block)
max_position_embeddings: 163840
rope_theta: 10000.0
vocab_size: 129280
mtp_module: 1               (1 MTP module at depth 1)
```

解析如下:

- `hidden_size=7168`:Inmembración 维度──
- `num_hidden_layers=61`:总块深度──
- `first_k_dense_layers=3`:前3个块 使用大小为18432 的密集MLP──其余58个使用MoE──
- `num_attention_heads=128`¿Qué es esto?
- `kv_lora_rank=512`:K 和 V se comprime a esta dimensión latente, no se abre la cabeza 解压──
- `num_experts=256, num_experts_per_tok=8`Cada bloque de MoE tiene 256 expertos, que utilizan el top-8 de routing.
- `shared_experts=1`: Además de los 256 expertos enrutados, hay un experto siempre en cada token contribuye a la salida.
- `moe_intermediate_size=2048`Cada experto tiene un tamaño oculto de MLP. Es más denso que el MLP.

### 参数核算 (en inglés)

完整计算在 `code/main.py`En el fondo, el resultado es:

- Incluir:`vocab * hidden = 129280 * 7168 = ~0.93B`¿Qué es eso?
- Antes de 3 bloques densos:带 MLA 的注意(per bloque 约144M) + denso MLP(per bloque 约260M) + normas。总计约1.2B。
- 58 bloques de MoE:带 MLA 的注意(约144M) + 256 专家(每约30M) + 1 专家共享(30M) + norma──按包含所有专家 计算,每块 总计约7.95B──58 专家 总计 461B──
- Modulo MTP:14B:

总计:core architecture 约 476B + 14B MTP; y publicado 671B 数字还会单独计入额外结构参数(bias tensors、expert-specific components、shared expert scaling等) ⋅ Nosotros en el calculador vemos que los números que se replantean en el cálculo con el valor publicado difieren entre el 3-5% en el interior, la diferencia proviene de la sección 2 apéndice del informe de DeepSeek 

Cada vez en adelante de los parámetros activos:

- Atención: cada capa 144M * 61 = 8.8B
- MLP activo:前 3 层密集(3 * 260M = 780M),58 个 MoE layers 中每层激活 8 个路由 + 1 个共享 +路由上费――每层活 MLP 约 260M──总计:3 * 260M + 58 * 260M = ~15.9B──
- Incluir normas: 1.2B。
- 总活跃: aproximadamente 26B core + 14B MTP(entrenamiento en uso, pero la idea no siempre es de ejecución)≈ 37B。

### 671B / 37B Por ejemplo

18 veces más rara proporción de parámetros activos es 5.5% de la suma de parámetros. DeepSeek-V3 es el más raro de los primeros pesos abiertos de la MoE  modelo. La proporción de 8x7B de la mezcla es 13/47  28%), debe ser denso.

### Posiciones de DeepSeek-V3

| 模型 | 总参数 | 活跃参数 | 比例 | Attention | 新想法 |
|-------|------|-------|-------|-----------|-------------|
| Llama 3 70B | 70B | 70B | 100% | GQA 64/8 | — |
| Llama 4 Maverick | 400B | 17B | 4.25% | GQA | — |
| Mixtral 8x22B | 141B | 39B | 27% | GQA | — |
| DeepSeek V3 | 671B | 37B | 5.5% | MLA 512 | MLA + MTP + aux-free + DualPipe |
| Qwen 2.5 72B | 72B | 72B | 100% | GQA 64/8 | YaRN 扩展 |

### 后续:R1、V4

DeepSeek-R1(2025) es una carrera de entrenamiento de razonamiento en V3 en la espina dorsal, en lugar de entrenamiento previo.

DeepSeek-V4 (si se publica) se prevé que se mantenga MLA + MoE + MTP,并加入 DSA (DepSeek Sparse Attention), es decir, la fase 10 · 17 en la NSA.


```figure
moe-routing
```

## Usalo

`code/main.py`Es especialmente adaptado a la configuración de DeepSeek-V3 format parameter calculador.

需要关注:

- 总参数对已发布的 671B──
- 活参数对已发布的37B──
- Contexto de 128k, abajo de KV cache, es la comparación entre MLA y GQA.
- 按层的解解, para observar los parámetros presupuestarios en realidad se desarrollan en el campo.

##  entregarlo

本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-deepseek-v3-reader.md` Dado un modelo familiar de DeepSeek (V3、R1, o cualquier futuro variable), generará un resultado de la estructura de cada componente, nombrará cada segmento de la configuración, según el número de componentes, y identificará el modelo utilizando cuatro modelos de DeepSeek que tienen innovaciones especiales.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Comparar las estimaciones de los parámetros totales de los calculadores con las 671B publicadas, y identificar las diferencias de origen.

2.  Modificar la configuración, cambiar el rango de MLA de 512                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

3. Comparar DeepSeek-V3 de ((256 expertos,top-8) en ruta con una hipótesis de ((512 expertos,top-8) en variación;; el total de los parámetros aumenta; el número activo permanece invariable;; en teoría, ¿qué beneficios trae la capacidad de expertos extra? ¿Cuál es el precio del tiempo de la investigación?

4. 阅读DeepSeek-V3 technical report(arXiv:2412.19437) Sección 2.1 关于MLA的内容──用三句话解释为什么 K 和 V 的解压矩阵可以在推理效率上被吸收到后续 matmul中──

5. DeepSeek-V3 para la mayoría de las operaciones utiliza el entrenamiento FP8― calcular con FP8 vs BF16  almacenamiento de 671B pesos― ¿Qué relación tiene con el presupuesto de entrenamiento de 14.8T-token?

## 关键术语: "El hombre es un hombre"

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| MLA | “Multi-Head Latent Attention” | 将 K 和 V 压缩到共享低秩 latent（kv_lora_rank，通常为 512），并按 head on-the-fly 解压；KV cache 只存储 latent |
| kv_lora_rank | “MLA compression dim” | K 和 V 共享 latent 的大小；DeepSeek-V3 使用 512 |
| First k dense layers | “早期 layers 保持 dense” | 前几个 MoE-model layers 跳过 MoE router，并运行 dense MLP 以提高稳定性 |
| num_experts_per_tok | “Top-k routing” | 每个 token 会触发多少个 routed experts；DeepSeek-V3 使用 8 |
| Shared experts | “Always-on experts” | 无论 routing 如何都会处理每个 token 的 experts；DeepSeek-V3 使用 1 |
| Auxiliary-loss-free routing | “Bias-adjusted load balance” | 在训练期间调整按 expert 的 bias 项，以在不添加 Loss 项的情况下保持 expert 负载均衡 |
| MTP module | “额外 prediction head” | 从 h^(1) 和 E(t+1) 预测 t+2 的 Transformer block；更密集训练，免费的 speculative-decoding draft |
| DualPipe | “Bidirectional pipeline” | 将 forward/backward 计算与跨节点 all-to-all 重叠的 training schedule |
| Active parameter ratio | “Sparsity” | active_params / total_params；DeepSeek-V3 达到 5.5% |
| FP8 training | “8-bit training” | 使用 FP8 存储训练数据，并在许多 compute ops 中使用 FP8；相比 BF16 大约内存减半，质量代价很小 |

## 延伸阅读

- [DeepSeek-AI — DeepSeek-V3 Technical Report（arXiv:2412.19437）](https://arxiv.org/abs/2412.19437)                                                                                                                                                                                                                                                              
- [Hugging Face 上的 DeepSeek-V3 model card](https://huggingface.co/deepseek-ai/DeepSeek-V3) config 文件与部署说明
- [DeepSeek-V2 paper（arXiv:2405.04434）](https://arxiv.org/abs/2405.04434)  Introducción Modelo de la situación anterior de MLA
- [DeepSeek-R1 paper（arXiv:2501.12948）](https://arxiv.org/abs/2501.12948) 基于 V3 架构的推理培训 后继模型
- [Native Sparse Attention（arXiv:2502.11089）](https://arxiv.org/abs/2502.11089) Profundos Buscar-familia Atención de la futura dirección
- [DualPipe repository](https://github.com/deepseek-ai/DualPipe) Referencia al programa de formación
