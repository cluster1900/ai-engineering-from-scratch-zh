# Comparar estrategias

> Se decide por el bloque lo que el buscador puede ver. Una vez que el límite está mal, no hay un modelo de emplazamiento.

**Type:** Build
**Languages:** Python
**Prerequisites:** 第 11 阶段课程 04（嵌入）、06（RAG）、07（高级 RAG）；第 19 阶段 B 轨基础（第 20-29 课）
**Time:** ~90 分钟

## El objetivo del aprendizaje
- Desde el principio se implementaron cinco estrategias de segmentación: ventana fija, frase, recapitución, lenguaje, colección y marcado estructural.
- En la base de datos fijos de las respuestas con etiquetas de oro, se explica por qué una estrategia es adecuada para el texto, otra estrategia es adecuada para el texto técnico.
- 读取块长度分布并识别每个策略注入的故障模式: aislar la frase, cortar el símbolo medio, sólo el título, la frase, la derivación, etc.
-  mediante la inspección de tres atributos para seleccionar el valor predeterminado de la nueva base de datos, y sin necesidad de realizar un test de base: tipo de archivo, longitud media del tramo y estructura de formato.

##  problemas

Cada tubo RAG se encarga de cortar el archivo de origen en un fragmento: el fragmento debe ser pequeño para poder colocarlo en un modelo, y también debe ser grande para poder llevar una idea independiente.

 Sólo cuando se conserva suspenderse un pedazo de valor 可达时, preguntar presupuestse suspender¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿

Este curso se compone de cinco estrategias, las coloca en una base de texto fija con un rango de respuestas con etiquetas de oro, y te permite leer y recordar números.

## 概念

```mermaid
flowchart LR
  Doc[Source Document] --> S1[Fixed Window]
  Doc --> S2[Sentence]
  Doc --> S3[Recursive Split]
  Doc --> S4[Semantic Cluster]
  Doc --> S5[Structural Markdown]
  S1 --> Chunks1[Chunks]
  S2 --> Chunks2[Chunks]
  S3 --> Chunks3[Chunks]
  S4 --> Chunks4[Chunks]
  S5 --> Chunks5[Chunks]
  Chunks1 --> Index[Embedding Index]
  Chunks2 --> Index
  Chunks3 --> Index
  Chunks4 --> Index
  Chunks5 --> Index
  Index --> Eval[Recall@k vs Gold Spans]
```

### Fixed window

蛮力基线── cada N 个字符被剪切一次──可选地重叠, de modo que en la posición N 处剪切的句子完整地出现从位置 N 开始的块内 - 重叠──快速、确定性、边界糟糕──将其作为控制件,而不是默认值──

### 句子

Utiliza la expresión normal o el estado de estado simple para dividir la frase en un bloque. También se puede cortar el medio de la palabra.

### 递归分分

La estrategia de la estructura de nivel de la biblioteca de 2023 es intentar primero dividir los más fuertes de los segmentos de la biblioteca, luego volver a la siguiente, luego dividir en frases, luego dividir en letras, cuando el bloque cumple con el presupuesto, regresar a la conclusión, pues se ajustará a los documentos de la estructura incompatible, ya que se realizará según la región.

### 语义聚类

嵌入每句子──将共享主题质心的连续句子聚类──每当与质心的运行相似度下降到值以下时就进行切割──边界反映了意义,而不是字符──construcción de velocidad más lenta y depende del modelo de emplazamiento, pero para los archivos de los temas de cambio en el fragmento es flexible──

###  estructurado Marca abajo 标题

对于具有明确结构 (Markdown, ReStructuredText, RFC 样式编号部分) 的文档, por favor, realice una sección en el borde del título. Cada pieza contiene el título y todo lo que se encuentra debajo de él, hasta el siguiente título de la misma o más alta categoría.

### recall@k 如何衡量边界选择

 La consulta de los tokens de oro lleva el rango de respuesta del archivo de origen de la cantidad de caracteres desplazados.  Después de los bloques, se le preguntará: ¿se superpone el bloque anterior de la búsqueda del buscador con la franja de oro? Si es así, entonces la consulta de recall@k 为1. Si no, entonces es 0. El valor medio de todo el conjunto de preguntas.


```figure
ci-chunk-boundaries
```

## Construirlo

`code/main.py` realización:

- `fixed_window(text, size, overlap)`- ¿Qué es eso?
- `sentence_chunks(text, target)`- 简单句子打包器──
- `recursive_split(text, separators, target)`- ¿Qué pasa?
- `semantic_chunks(text, similarity_threshold)`- En la determinación de la forma de integrar en la base de la calidad de la concentración.
- `structural_markdown(text)`- El primer sensor de separación.
- `mock_embed(text, dim)`- basado en el hash, por lo que el ciclo puede funcionar fuera de línea.
- `DenseIndex`- La misma forma que se utiliza en el curso de búsqueda mixta de la ruta B de la etapa 19.
- `eval_recall(strategy, corpus, queries, k)`- Comparado con el ciclo.
- `main()`, en fijo 语料库上运行每个策略并印记 recall@k 表。

¿Qué es eso ?

```bash
python3 code/main.py
```

输出是一个小表,每个策略一行,每个 k 一列──句子策略在结构化 fixture上失败──结构化Markdown在 Markdown fixture上胜──递归策略在混合 fixture上有一席之地,因为递归会自适应──语义聚类在没有有用结构线索的散文 fixture上胜──

## El modo de fallas no se oculta en el expreso

**孤立句子。**句子打包会产生错过主题句的块──然后嵌入指向错误的──

**中间符号剪切。**El código o la ventana fija dentro de YAML se dividirá en dos semillas.

**仅包含标题的 chunk。** estructuradas Marca abajo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `## Title`Por lo tanto, no hay nada que pueda hacerse más fácil.

**语义漂移。**Cuando la base de lenguajes se concentra en un tema, el grupo de lenguajes se debilita. Los bloques de 5000 caracteres envuelven muchas respuestas concretas en un emplazamiento disperso.

**过时的嵌入。**语义聚类使用嵌入模型──如果改模型,你也将改块──将块模型与检索模型分开固定,或一起重建索引──

## 选择默认值而不运行基准测试 选择默认值而不运行基准测试 选择默认值而不运行基准测试 选择默认值而不运行基准测试

Tres características determinan los bloques de texto de la nueva biblioteca.

|属性 |值|默认|
|----------|-------|---------|
|文件类型|没有结构的散文 |递归分割，目标 800 |
|文件类型| Markdown / RFC / API 文档 |结构化 Markdown |
|文件类型|代码| AST 感知（超出范围；请参阅第 19 阶段第 02 课）|
|段落长度|长而单一的主题 |句子，目标500 |
|段落长度|简短、混合的主题 |语义，阈值 0.6 |

Si hay dudas, por favor elija el regreso a la división. Es la base de estrategia más fuerte.

## Usalo

Modelo de producción:

- Evaluar el funcionamiento antes de publicar el nuevo tubo; no confíe en la estrategia de su biblioteca.
- Cada vez que usted cambia el modelo de inserción o el conjunto de la biblioteca de lenguaje, por favor reutilice la evaluación; el ganador depende de la biblioteca de lenguaje.
- El nombre de la estrategia se conservará en los datos de cada bloque, para que pueda ser atribuido más tarde.

## 发货

En el curso de la sección 69 del programa F 端到端 RAG 系统 utiliza este tipo de selecciones de bloques como su primera fase.`eval_recall`返回的相同形中读取recall@k。 seleccionar la estrategia de ganar en su base de palabras y avanzar hacia adelante。

##  ejercicios

1. 添加第六种策略: usar `tiktoken`En lugar de la ventana de símbolo de la cuenta de caracteres, se debe comparar con la ventana fija en el mismo fijo.
2. Inserir el 30% de los bloques de código en el fijo de散文 中──重新运行该表── explicar por qué todas las estrategias, excepto la Markdown estructural, han perdido su memoria──
3. Se sustituirá la determinación de los emplazamientos por la determinación de los proveedores reales de proyectos.
4. para cada bloque añadir uno`summary`字段: 一句质心描述──重新运行 eval,并将摘要附加到块主体──测量召回提升──

## 关键术语: "El hombre es un hombre"

|术语 |人们怎么说|它实际上意味着什么 |
|------|-----------------|------------------------|
|recall@k | “我们拿到正确 chunk 了吗？” |任何前 k 个 chunk 与 gold answer span 重叠的查询比例 |
|块重叠| “滑动窗口”|将前一个块的最后 N 个字符重新包含在下一个块中 |
|结构分割器| “标题感知块” |在 H1/H2/H3 边界处切分；标题文本也是 chunk 的一部分 |
|语义分块器 | “主题感知块” |嵌入句子、按质心相似度聚类、漂移剪切 |
|质心漂移| 「话题转移」|运行平均值与下一个句子之间的余弦相似度下降超过阈值 |

##  más阅读

- [LongRAG: Enhancing Retrieval-Augmented Generation with Long-context LLMs (arXiv 2406.15319)](https://arxiv.org/abs/2406.15319)
- [人择、上下文检索](https://www.anthropic.com/news/contextual-retrieval)
- [LlamaIndex，生产组块策略 RAG](https://docs.llamaindex.ai/en/stable/optimizing/production_rag/)
- 第 11 阶段 第 06 课 - RAG 基础知识
- 第11 阶段 第07 课 - 高级 RAG
- 19 阶段 第65 课 - Requisitos mixtos de clasificación de los bloques generados en este lugar
- 19 阶段 第68 课 - Instrumento de evaluación de la selección de estrategias en producción
