# CLIP y el entrenamiento de la lenguaje de visión contrastable

> OpenAI's CLIP(2021) demostró una idea central suficiente para impulsar el siguiente cinco años: sólo usar pares de imágenes-capción de la Web y una pérdida contrastable, poner el codificador de imágenes y el codificador de texto a la vez en el mismo espacio vectorial.

**Type:** Build
**Languages:** Python（stdlib，InfoNCE + sigmoid loss 实现）
**Prerequisites:** Phase 12 · 01（ViT patches），Phase 7（Transformers）
**Time:** ~180 分钟

## El objetivo del aprendizaje
- Desde información mutua 推导 InfoNCE pérdida,并实现 una cantidad de valor estable Vectorizada 版本。
- 解释为什么 sigmoid pairwise loss(SigLIP) puede extenderse hasta el lote 32768+, y no necesita softmax de todo el requisito 开销。
- 通过构造 texto plantillas(`a photo of a {class}`)并对 cosino similarity 取 argmax,运行 cero-shot ImageNet clasificación。
- Explicar el CLIP / SigLIP preentrenamiento  darte cuatro pistas: tamaño de lote, temperatura, plantilla de instrucción, calidad de datos 

##  problemas
La visión anterior de CLIP es supervisada. Recolecta conjuntos de datos etiquetados (ImageNet:1.2M imágenes, 1000 clases), entrena a CNN, luego publica. Las etiquetas son caras, las etiquetas se orientan hacia el contenido que el marcador puede alcanzar, y en caso de no tener ajuste fino, las etiquetas no pueden ser transferidas a nuevas tareas.

Foto de un golden retriever, el texto es "mi perro Max en el parque", lleva un señal de vigilancia:文本描述图像──

Respuesta de CLIP:把图像标题对 当作匹配任务──给定一个包含N 张图像和N 条标题的批,学习将每张图像与它自己的标题匹配,并区分N-1 个分扰器──监督信号是 两件事都属于一起;这N-1 个不属于一起──没有类标签──没有人工标签──只有一个反相损失──

得到的嵌入空间 能做不止 CLIP 被训练做的事情──ImageNet zero-shot 能工作, es porque "una foto de un gato" de Embedding se acercará a aquellos nunca claramente marcados para el gato imágenes── esto es la causa de cada 2026 VLM 注──

## 概念
### El doble codificador

CLIP tiene dos torres:

- Código de imagen `f`:ViT o ResNet, cada imagen 输出一个D-dim Vector──
- Código de texto`g`: pequeño transformador, cada subtítulo 输出一个 D-dim Vector。

Las dos torres han normalizado la salida hasta la longitud de la unidad.`cos(f(x), g(y)) = f(x)^T g(y)`¿Qué es eso?

对于一个包含N 个(图片,标题) pares de lote, construir forma 为 `(N, N)`de la similitud Matrix `S`¿Qué es esto ?

```
S[i, j] = cos(f(x_i), g(y_j)) / tau
```

Entre ellos `tau`Es la temperatura de aprendizaje obtenida.

### Perdida de información sobre la NCE

CLIP en las filas y columnas 上 utilizar entropía cruzada simétrica:

```
loss_i2t = CE(S, labels=identity)     # each image's positive is its own caption
loss_t2i = CE(S^T, labels=identity)   # each caption's positive is its own image
loss = (loss_i2t + loss_t2i) / 2
```

Éste es el softmax de InfoNCE──CE 强制每张图像与其标题的匹配程度高于批次中所有其他标题──"negativos"是所有其他批次的项目──更大的批次 = 更多负面 = 更强信号──CLIP 在批次32k 上训练;规模 很重要──

### Temperatura

`tau`Control de la nitidez de la suavidad. La nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitidez de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de la nitida de

### ¿Por qué sigmoid 扩展性更好(SigLIP)

Softmax  necesita toda la similitud Matrix  mantener el mismo ritmo  En el entrenamiento distribuido, debes poner cada incorporación todo-recolectado hasta cada réplica, y luego hacer softmax.

SigLIP Used sigmoid por elemento  sustituir softmax: para cada par `(i, j)`,perdida es una clasificación binaria, juzgar ¿es pareja de coincidencia?

```
L = -1/N sum over (i, j) [ y_ij log sigmoid(S[i,j]) + (1-y_ij) log sigmoid(-S[i,j]) ]
```

Si es que`i == j`, entonces`y_ij = 1`, si no es por 0―, cada par de pérdidas es independiente―, no necesita todo reunido―, cada GPU  calcula su propio bloque local y se busca y se busca―, SigLIP 2 puede expandirse a bajo costo hasta el lote 32k-512k, mientras que CLIP tendrá que aumentar la comunicación en proporción―,

### Clasificación de tiro cero

给定 N 个 nombres de clases, para cada clase 构建一个文本模板:

```
"a photo of a {class}"
```

Utiliza codificador de texto Embedding Cada plantilla。 Utiliza codificador de imagen Embedding 你的图像──Argmax cosine similaridad = predicción de clase──不需要在目标类上训──

Las plantillas rápidas son muy importantes. Para cada clase se utilizan 80 plantillas.

### Las sondas lineales y la regulación de la finalidad

La sonda lineal está en línea de base. En las características de CLIP congeladas, las clases de capacitación de una capa lineal se ejecutan en las tareas de dominio.

### SigLIP 2: NaFlex y características densas

SigLIP 2(2025) Añadir:
- NaFlex: modelo único  procesar las relaciones de aspecto variables y resoluciones。
- Las características más densas, utilizadas para la segmentación y la estimación de profundidad, se utilizan en VLMs como columna vertebral congelada.
- Multilingüe: en más de 100 idiomas 上训练, mientras que CLIP 仅仅是英文──
- 1B para la escala, y el CLIP máximo hasta 400M.

En los VLM abiertos de 2026 años, SigLIP 2 SO400m/14 es una torre de visión por defecto. Para la recuperación de imágenes y texto, si la distribución de entrenamiento LAION-2B específica se ajusta a su patrón de consulta, CLIP sigue siendo una opción por defecto.

### El objetivo de la presente Decisión es garantizar que los Estados miembros puedan adoptar medidas de seguridad en el marco de la aplicación de la presente Directiva.

ALIGN(Google,2021): con CLIP similar ideas,1.8B par escala,90% ruidoso。 prueba de datos ruidosos 可以规模──OpenCLIP(LAION): en LAION-400M / 2B 上对 CLIP的开放复制,多种规模,是常用的开放检查点──EVA-CLIP:从面具图像建模初始化;是VLMs强的脊柱──BASIC:Google的 CLIP+ALIGN混合物──它们 pertenecen a la misma familia,只是 datos 和调整 不同──

### El techo de tiro cero

Los modelos de clase CLIP de ImageNet de captura cero arriba límite es de aproximadamente 76%(CLIP-G、OpenCLIP-G)。 continúa la actualización necesita más datos(SigLIP 2  alcanzar el 80%+) o cambios de arquitectura(supervisados cabezas、 más parámetros)。BENCHMARK está en el proceso de implementación; el verdadero valor es el espacio de incorporación de los VLMs 消费的嵌入空间──


```figure
multimodal-fusion
```

## Usalo
`code/main.py`实现:

1. Un juguete doble codificador de imágenes basado en hash, características de gráficos de texto, hacer que no necesites ser numpy, así que podrás ver la forma de InfoNCE.
2. 纯 Python 的 InfoNCE pérdida(a través de log-sum-exp 保证 la estabilidad numérica)。
3. Utilizado en comparación con la pérdida sigmoide en pares.
4. Una rutina de clasificación de tiro cero: calcular con un grupo de preguntas de texto de similitud cosina,并使用 argmax 进行预测──

运行它并观察损失曲线──绝对数值是玩具;形状与真实CLIP trainer 输出一致──

##  entregarlo
本课生成                       `outputs/skill-clip-zero-shot.md`△给定一组 images ((por el camino) y一组 de clases objetivo, que utiliza la plantilla CLIP  construir instrucciones de texto, con un punto de control especificado (por ejemplo, `openai/clip-vit-large-patch14`)Inmembración 两侧,并返回带相似度的前-1 /前-5 predicciones──该技能 拒绝对提示列表 中不存在的类做出判断──

##  ejercicios
1. Manual para un lote que contiene 4 pares 实现 InfoNCE──construir Matriz de similitud 4x4 , ejecutar softmax, extraer diagonal, calcular entropía cruzada── utilizar este manual para verificar tu Python ⋅

2. Además de la temperatura, SigLIP también utiliza parámetros de sesgo.`b`¿Qué es esto ?`S'[i,j] = S[i,j]/tau + b`◊ cuando el grupo  existe un mayor desequilibrio de clases  cada línea negativa  远多于积极)`b`¿Qué hay de nuevo en el sistema?

3. Por los gatos vs perros  Construir un clasificador de tiro cero―intentar dos plantillas de respuesta:`a photo of a {class}`Y `a picture of a {class}`◊ en 100 张 de pruebas de imágenes                                                                                                                                                                                                                                                          

4. 計算 512-GPU、batch 32k 运行时,softmax InfoNCE y sigmoid en pareja de costos de comunicación──哪个按 O(N) escala,哪个按 O(N^2) escala?引用SigLIP Section 4──

5. 阅读OpenCLIP escalar-leyes de papel(arXiv:2212.07143,Cherti et al.)。 Bases en la gráfica Reproduct ellos sobre la escala de datos de la conclusión: en tamaño fijo del modelo 下,ImageNet de la precisión de tiro cero y el tamaño de datos de entrenamiento ¿qué es la relación de registro-lineal entre el tamaño de los datos?

## 关键术语: "El hombre es un hombre"
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| InfoNCE | "Contrastive loss" | 对一个 batch 的 similarity Matrix 做 cross-entropy；每个 item 的 positive 是它配对的 item，negatives 是其他所有项 |
| Sigmoid loss | "SigLIP loss" | Per-pair binary cross-entropy；没有 softmax，没有 all-gather，在 distributed training 中低成本 scale |
| Temperature | "tau" | 在 softmax/sigmoid 之前缩放 logits 的 scalar；控制 distribution 的 sharpness |
| Zero-shot | "no-finetune classification" | 使用 text prompts 构建 class Embeddings，并通过 cosine similarity 分类；不在目标 classes 上训练 |
| Prompt template | "a photo of a ..." | 围绕 class name 的文本脚手架；会影响 zero-shot accuracy 1-5 points |
| Dual encoder | "Two-tower" | 一个 image encoder + 一个 text encoder，输出到共享 D-dim space |
| Hard negative | "Tough distractor" | 与 positive 足够相似的 negative，迫使 model 努力将它们分开 |
| Linear probe | "Frozen + one layer" | 只在 frozen features 之上训练一个 linear classifier；衡量 feature quality |
| NaFlex | "Native flexible resolution" | SigLIP 2 的能力：无需 resize 即可摄入任意 aspect ratio 和 resolution 的 images |
| Temperature scaling | "log-parametrized tau" | CLIP 将 `log(1/tau)` 参数化，使 gradients 表现良好；通过 clipping 防止 collapse 到接近零的 tau |

## 延伸阅读
- [Radford et al. — Learning Transferable Visual Models From Natural Language Supervision (arXiv:2103.00020)](https://arxiv.org/abs/2103.00020) Papel de CLIP。
- [Zhai et al. — Sigmoid Loss for Language Image Pre-Training (arXiv:2303.15343)](https://arxiv.org/abs/2303.15343) SigLIP。
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786) multilingüe + NaFlex。
- [Jia et al. — ALIGN (arXiv:2102.05918)](https://arxiv.org/abs/2102.05918) Usando una escala de datos web ruidosa。
- [Cherti et al. — Reproducible scaling laws for contrastive language-image learning (arXiv:2212.07143)](https://arxiv.org/abs/2212.07143) Ley de escalación de OpenCLIP。
