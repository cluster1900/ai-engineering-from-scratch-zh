# 分块策略 Comparar

> O bloco decide o que o pesquisador pode ver. Quando a fronteira está errada, não há modelos embutidos.

**Type:** Build
**Languages:** Python
**Prerequisites:** 第 11 阶段课程 04（嵌入）、06（RAG）、07（高级 RAG）；第 19 阶段 B 轨基础（第 20-29 课）
**Time:** ~90 分钟

## Objectivo de aprendizagem
- Desde o início, a implementação de cinco estratégias de segmentação: janela fixa, frase, regressão, segmentação, aglomeração de palavras e marcadação estrutural.
- Em nota, o texto "PDF" é um texto que é escrito em uma linguagem de texto.
- 读取块长度分布并识别每个策略注入的故障模式: isolação de sentenças, corte de símbolos intermediários, apenas blocos de tópicos,
-  através da verificação de três atributos para selecionar o novo material de base de dados, sem a necessidade de executar um teste de base: tipo de documento, duração média do episódio e se o formato tem uma estrutura clara

## 问题

Cada tubo RAG vai primeiro cortar o arquivo de fonte em um pedaço: um pedaço deve ser pequeno para ser inserido no modelo, mas também grande para ser suficiente para suportar uma ideia independente.

 Só quando a conservação de um pedaço de valor suspenso  Quando chegar, a consulta  orçamento suspenso  valor é o que é que  de consulta  é que será bem sucedido. Se o cortador de janelas fixo despejar o valor do seu ambiente, a inserção se moverá para outro, BM25  número de divisões irá diminuir, o redutor verá que o ruído é, LLM  O resultado da resposta também sairá errado. O artigo de 2024  LongRAG: Enhancing Retrieval-Augmented Generation with Long-Context LLMs  Teste, apenas um pedaço de bloco selecionado leva a 35% de recall  Absolutamente inconstante  2025 anos de trabalho posterior sobre cabeçalhos de contextualização reduziram essa diferença, mas não eliminaram 

Esta aula constrói cinco estratégias, colocando-as em uma base de linguagem fixa com intervalos de respostas com rótulos de ouro, e deixando-se ler a si mesmo.

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

### Fixado vitrine

蛮力基线── cada N 个字符被剪切一次──可选地重叠, de modo que, em posição N 处剪切的句子完整地出现从位置 N 开始的块内 - 重叠──快速──确定性、边界糟糕──将其用作控件,而不是默认值──

### - Não .

Utilize o modo de expressão normal ou simples de estado para dividir as frases. O modo de fazer uma ou mais frases é de fazer uma única parte de um bloco, até atingir o orçamento de caracteres-alvo.

### 递归分割

Estrutura de estratégias de nível em circulação em 2023: tentar primeiro dividir o mais forte separador, depois voltar para o próximo, depois dividir em sentenças, depois dividir em caracteres, quando o bloco estiver em conformidade com o orçamento, retornará ao fim, muito adequado para o arquivo de estruturas incompatíveis, pois será ajustado de acordo com a região.

### 语义聚类

嵌入每个句子──将共享主题质心的连续句子聚类──每当与质心的运行相似度下降到值以下时就进行切割──边界反映了意义,而不是字符──construção de velocidade mais lenta e depende do modelo de embutidação, mas para os documentos de mudança de tópicos em um parágrafo é flexível──

###  Struktur化 Marcação 标题

 Para o arquivo com uma estrutura definida ([[Markingdown]], [[RestructuredText]], RFC style numbering section]]), por favor, faça uma separação na margem do título. Cada peça contém o título e tudo o que está abaixo dele, até o próximo título do mesmo ou de maior nível.

### recall@k 如何衡量边界选择

 Uma consulta de tokens de ouro traz a resposta de um conjunto de documentos de origem. Depois de um bloco de dados, você vai perguntar: o bloco anterior do pesquisador retorna se sobrepõe ao bloco de ouro?


```figure
ci-chunk-boundaries
```

## Construí-lo

`code/main.py`实现:

- `fixed_window(text, size, overlap)`- É o que é?
- `sentence_chunks(text, target)`- 简单句子打包器──
- `recursive_split(text, separators, target)`- A partir de agora.
- `semantic_chunks(text, similarity_threshold)`- em definição de um modelo embuído em base a um aglomerado de qualidade.
- `structural_markdown(text)`- O que é que é?
- `mock_embed(text, dim)`- Baseado em embutidos hash, o ciclo pode ser executado offline.
- `DenseIndex`- A mesma forma utilizada no curso de pesquisa misturada do tráfego B do 19o estágio.
- `eval_recall(strategy, corpus, queries, k)`- Comparar com o ciclo.
- `main()`, em fixação 语料库上运行每个策略并印回忆@k 表。

- Não .

```bash
python3 code/main.py
```

输出是一个小表,每个策略一行,每个 k 一列──句子策略在结构化 fixture 上失败──结构化 Markdown 在 Markdown fixture 上获胜──递归策略在混合 fixture 上有一席,因为递归会自适应──语义聚类在没有有用结构线索的散文 fixture 上获胜──

## Não há nenhum problema oculto

**孤立句子。**O que é um erro de inserção em um bloco de um ponto?

**中间符号剪切。**O código ou o YAML em janela fixa irá dividir o identificador em duas partes.

**仅包含标题的 chunk。** Strukturalis Markdown 会发出只包含 `## Title`O que é que você está fazendo?

**语义漂移。**Quando o material é em sintonia com o tema, o grupo de idiomas se enfraquece.

**过时的嵌入。**语义聚类使用嵌入模型──如果改模型,你也将改块──将块模型与检索模型分开固定,或一起重建索引──

## 选择默认值而不运行基准测试 (em inglês)

Três atributos determinam os blocos de texto de uma nova biblioteca.

|属性 |值|默认|
|----------|-------|---------|
|文件类型|没有结构的散文 |递归分割，目标 800 |
|文件类型| Markdown / RFC / API 文档 |结构化 Markdown |
|文件类型|代码| AST 感知（超出范围；请参阅第 19 阶段第 02 课）|
|段落长度|长而单一的主题 |句子，目标500 |
|段落长度|简短、混合的主题 |语义，阈值 0.6 |

Se tiver dúvidas, por favor escolha a regressão à divisão. É a mais forte base de estratégia única.

## Use-o

Modelo de produção:

- Avaliação de funcionamento antes de publicar o novo canal; não acredite nas estratégias de sua biblioteca.
- Cada vez que você mudar de modelo ou de linguagem de conjunto, por favor re-lançar avaliação; o vencedor depende da linguagem de conjunto.
- O nome da estratégia será mantido em cada bloco de dados, para que possa ser atribuído mais tarde.

## 发货

No curso 69 , o sistema RAG utiliza o separador de seleção como sua primeira fase.`eval_recall`返回的相同形中读取recall@k。 escolher em seu linguagem de base estratégia de vencer e avançar em frente。

## 练习

1. 添加第六种策略: usar `tiktoken`Em vez de uma janela de símbolo de contagem de caracteres, comparar com a janela fixa na mesma fixação.
2. Inserir 30% do bloco de código em um dispositivo de散文 中──重新运行该表── explicar por que todas as estratégias, exceto a Markdown estruturada, perderam a memória──
3. A definição de um sistema de informação é uma forma de informação que pode ser utilizada para a informação.
4. para cada bloco 添加一个`summary`字段: 一句质心描述──重新运行 eval,并将摘要附加到块主体──测量召回提升──

## 关键术语

|术语 |人们怎么说|它实际上意味着什么 |
|------|-----------------|------------------------|
|recall@k | “我们拿到正确 chunk 了吗？” |任何前 k 个 chunk 与 gold answer span 重叠的查询比例 |
|块重叠| “滑动窗口”|将前一个块的最后 N 个字符重新包含在下一个块中 |
|结构分割器| “标题感知块” |在 H1/H2/H3 边界处切分；标题文本也是 chunk 的一部分 |
|语义分块器 | “主题感知块” |嵌入句子、按质心相似度聚类、漂移剪切 |
|质心漂移| 「话题转移」|运行平均值与下一个句子之间的余弦相似度下降超过阈值 |

##  weiterlesen

- [LongRAG: Enhancing Retrieval-Augmented Generation with Long-context LLMs (arXiv 2406.15319)](https://arxiv.org/abs/2406.15319)
- [人择、上下文检索](https://www.anthropic.com/news/contextual-retrieval)
- [LlamaIndex，生产组块策略 RAG](https://docs.llamaindex.ai/en/stable/optimizing/production_rag/)
- 第 11 阶段 第 06 课 - RAG 基础知识
- 第 11 阶段 第 07 课 - 高级 RAG
- No 19                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- No 19                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
