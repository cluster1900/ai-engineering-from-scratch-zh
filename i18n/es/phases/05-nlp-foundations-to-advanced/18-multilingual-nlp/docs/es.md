# Políticas de aprendizaje

> Un modelo, más de 100 idiomas, la mayoría de los cuales no tienen ningún entrenamiento.

**Type:** Learn
**Languages:** Python
**先修要求：**Fase 5 · 04 (GloVe, FastText, Subword), Fase 5 · 11 (Traducción automática)
**Time:** ~45 分钟

##  problemas

Inglés tiene miles de millones de muestras con etiquetas. En Urdu hay miles de lenguas. Casi ninguna. En cualquier sistema de NLP práctico dirigido a usuarios globales, todos deben ser capaces de procesar los datos de entrenamiento de tareas específicas.

El modelo multilingüe se forma a la vez en varios idiomas para resolver este problema. El modelo puede migrar de la capacidad de aprendizaje de alta fuente a la de baja fuente. El análisis emocional del modelo se puede ajustar a la técnica de análisis de la lengua inglesa, y puede ser utilizado para dar una predicción emocional bastante correcta de la lengua urdu.

Esta clase explicará las medidas de peso y los modelos clásicos, así como la decisión de un equipo que ha empezado a trabajar en varios idiomas:

## 概念

![通过共享多语言 Embedding space 实现跨语言迁移](../assets/multilingual.svg)

**共享词表。**Muchos modelos de lenguaje utilizan en todos los textos de lenguaje objetivo para entrenar SentencePiece o WordPiece tokenizer.`anti-`Te daré el mismo token.

**共享表示。**En muchos idiomas con el uso de un lenguaje enmascarado 预训练的Transformer,会学到不同语言中语义相似的句子会产生相似的隐藏状态──mBERT、XLM-R和 NLLB 都表现出这一点──英语中"cat"的嵌入会聚集在法语中语中语中语中语义相似的句子会产生相似的隐藏状态──mBERT、XLM-R和 NLLB都表现出这一点──英语中猫的嵌入会聚集在法语中语中语中语中语中语义相似的句子中语相似的句子会产生相似的隐藏状态──英语中猫的嵌入会聚集在法语中语中语中语中语中语中语中语语中语语相似的句子中语中语相似的句子中语中语中语相似的句子中语中语语中语相似的句子中语中语语中语中语相似的句子中语语中语语相似的句子中语语中语中语语中语语中语相似的句相似的句子中语语语语中语中语中语中语语中语中语中语语语语中语中语语中语语中语语中语语中语语中语相似的语语语语语语语中语相似的语语语语语语语中语语语语语中语中语语语语相似的语语语语语语语语语语语中语语语语语语语中语语语语中语语语语语中语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语

**Zero-shot 迁移。**En un idioma (usualmente en inglés) con etiquetas de datos de la modalidad de trabajo, el resultado es muy fuerte; en el caso de las lenguas más distantes, el resultado es más débil.

**Few-shot fine-tuning。**En el idioma objetivo añadir 100-500 ejemplos con etiquetas. La tasa de precisión de las tareas de la clase se elevará al 95-98% de la línea de base del inglés.

## 模型

| Model | Year | Coverage | Notes |
|-------|------|----------|-------|
| mBERT | 2018 | 104 languages | 在 Wikipedia 上训练。第一个实用的多语言 LM。低资源语言表现较弱。 |
| XLM-R | 2019 | 100 languages | 在 CommonCrawl 上训练（比 Wikipedia 大得多）。确立了跨语言 baseline。Base 270M，Large 550M。 |
| XLM-V | 2023 | 100 languages | 具有 1M-token 词表的 XLM-R（相比 250k）。低资源语言表现更好。 |
| mT5 | 2020 | 101 languages | 用于多语言生成的 T5 架构。 |
| NLLB-200 | 2022 | 200 languages | Meta 的翻译模型；包含 55 种低资源语言。 |
| BLOOM | 2022 | 46 languages + 13 programming | 以多语言方式训练的开放 176B LLM。 |
| Aya-23 | 2024 | 23 languages | Cohere 的多语言 LLM。在阿拉伯语、印地语、斯瓦希里语上表现强。 |

按用例选择──分类任务可以把XLM-R-base 作为稳定默认值──生成任务需要根据翻译还是开源生成,在mT5或NLLB 之间选择──LLM 风格工作可以搭配 Aya-23或Claude,并使用明确的多语言提示──

## 源语言决策(2026 研究)

La mayoría de los equipos de expertos han aceptado el uso del inglés como lenguaje de ajuste.

语言相似性比原始语料规模更能预测迁移质量──对于斯拉夫语目标语言,德语或俄语往往优于英语──对于印度语族目标语言,印度语往往优于英语──**qWALS**Para el año 2026, se ha realizado una cuantificación de este punto, basándose en las características del Atlas Mundial de Estructuras Lingüísticas.**LANGRANK**(Lin et al., ACL 2019) es otro método más temprano, que combina la similitud de lenguaje, la escala de lenguaje y la relación de género, para organizar a los candidatos a la lenguaje fuente.

 Reglas prácticas: Si tu idioma objetivo tiene un tipo de lenguaje de alto recurso que se acerque al aprendizaje, primero intenta ajustar el tono en ese idioma, y luego ajustar el tono en comparación con el inglés.


```figure
n5-crosslingual-bridge
```

## Construcción

### Paso 1: tiro cero 跨语言分类

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

tok = AutoTokenizer.from_pretrained("joeddav/xlm-roberta-large-xnli")
model = AutoModelForSequenceClassification.from_pretrained("joeddav/xlm-roberta-large-xnli")


def classify(text, candidate_labels, hypothesis_template="This text is about {}."):
    scores = {}
    for label in candidate_labels:
        hypothesis = hypothesis_template.format(label)
        inputs = tok(text, hypothesis, return_tensors="pt", truncation=True)
        with torch.no_grad():
            logits = model(**inputs).logits[0]
        entail_score = torch.softmax(logits, dim=-1)[2].item()
        scores[label] = entail_score
    return dict(sorted(scores.items(), key=lambda x: -x[1]))


print(classify("I love this product!", ["positive", "negative", "neutral"]))
print(classify("मुझे यह उत्पाद पसंद है!", ["positive", "negative", "neutral"]))
print(classify("J'adore ce produit !", ["positive", "negative", "neutral"]))
```

Un modelo, tres idiomas, la misma API. XLM-R en NLI datos en entrenamiento, a través del truco de implicación 能很好地迁移到分类任务.

### 步骤 2: 多语言 Incluir espacio

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

pairs = [
    ("The cat is sleeping.", "Le chat dort."),
    ("The cat is sleeping.", "El gato está durmiendo."),
    ("The cat is sleeping.", "Die Katze schläft."),
    ("The cat is sleeping.", "The dog is barking."),
]

for eng, other in pairs:
    emb_eng = model.encode([eng], normalize_embeddings=True)[0]
    emb_other = model.encode([other], normalize_embeddings=True)[0]
    sim = float(np.dot(emb_eng, emb_other))
    print(f"  {eng!r} <-> {other!r}: cos={sim:.3f}")
```

译文会落在嵌入空间中相相近的位置――另一句不同的英语句子会落得更远―― es la razón por la cual la búsqueda y agrupación de diferentes idiomas y la similitud pueden funcionar――

### 步骤 3: estrategia de ajuste fino de pocos disparos

```python
from transformers import TrainingArguments, Trainer
from datasets import Dataset


def few_shot_finetune(base_model, base_tokenizer, examples):
    ds = Dataset.from_list(examples)

    def tokenize_fn(ex):
        out = base_tokenizer(ex["text"], truncation=True, max_length=128)
        out["labels"] = ex["label"]
        return out

    ds = ds.map(tokenize_fn)
    args = TrainingArguments(
        output_dir="out",
        per_device_train_batch_size=8,
        num_train_epochs=5,
        learning_rate=2e-5,
        save_strategy="no",
    )
    trainer = Trainer(model=base_model, args=args, train_dataset=ds)
    trainer.train()
    return base_model
```

 para 100-500 个目标语言样本,`num_train_epochs=5`Y `learning_rate=2e-5`Es un valor de la normalización. Una tasa de aprendizaje más alta conducirá al colapso de la lengua, y finalmente se obtendrá un modelo de sólo hablar inglés.

## Evaluación verdadera y efectiva

- **在 held-out 集上按语言统计准确率。**No se agrupen.
- **与单语言 baseline 对比。**Para un lenguaje con datos suficientes, el modelo monolingüe de entrenamiento a veces es superior al modelo multilingüe.
- **Entity-level 测试。**目標言語中的命名实体──多语言模型对远离拉丁文字的书写系统通常标记化较弱──
- **跨语言一致性。**Cuando dos idiomas expresan el mismo significado, debe producirse el mismo pronóstico.

## Uso

2026 技术:

| Task | Recommended |
|-----|-------------|
| Classification, 100 languages | XLM-R-base (~270M) fine-tuned |
| Zero-shot text classification | `joeddav/xlm-roberta-large-xnli` |
| Multilingual sentence embeddings | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` |
| Translation, 200 languages | `facebook/nllb-200-distilled-600M`（见 lesson 11） |
| Generative multilingual | Claude, GPT-4, Aya-23, mT5-XXL |
| Low-resource language NLP | XLM-V 或在相关高资源语言上做 domain-specific fine-tune |

Si el rendimiento es importante, debe ser ajustado al idioma objetivo 预留预算──Zero-shot es el punto de partida, no la respuesta final──

### Tokenization 成本(低资源语言会出什么问题)

El modelo multilingüístico comparte un tokenizer entre todos los idiomas. Este vocabulario se entrena en el lenguaje dominado por el inglés, el francés, el español, el chino y el alemán.

- **Fertility 成本。**低资源语言文本会被代币化成比英语更多的代币―― un indio语句可能需要等价英语句的 3-5x的代币―― este 3-5x se va a absorber tu arriba abajo de la ventana de la escritura、 la eficiencia de entrenamiento y el presupuesto de retraso―
- **变体恢复成本。**Cada error de ortografía, un cambio de símbolo adicional, un código único, una normalización descoincidente o una variación de escritura pequeña, se convierte en una secuencia de iniciación en frío en el espacio de emplazamiento.
- **容量外溢成本。**Los niveles de profundidad y de emplazamiento de dimensiones se consumen en la posición de abajo, dejando la capacidad de la racionalización real, sistemáticamente menor que la capacidad de un mismo modelo para el lenguaje de alto recurso.

 Los síntomas reales son: tu modelo se entrena en la lengua indí, la curva de pérdida se ve correcta, la perplejidad se ve razonable, la producción se produce pero se produce un error de forma muy pequeña.**Tokenizer 坏了，靠扩大数据规模救不回来。**

缓解方式: seleccionar un tokenizer bueno para el idioma objetivo  XLM-V  1M-token 词表就是直接修复; entrenamiento pre pre在 目标文本上验证 tokenization fertility; para el sistema de escritura de verdad长尾   字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字段 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字 字`byte_fallback=True`,GPT-2 风格 byte-level BPE), asegurando que nunca se produzca OOV.

## 交付

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-multilingual-picker.md`¿Qué es esto ?

```markdown
---
name: multilingual-picker
description: 为多语言 NLP 任务选择源语言、目标模型和评估计划。
version: 1.0.0
phase: 5
lesson: 18
tags: [nlp, multilingual, cross-lingual]
---

给定需求（目标语言、任务类型、每种语言可用的带标签数据），输出：

1. Fine-tuning 的源语言。默认英语；如果目标语言有类型学上接近的高资源语言，检查 LANGRANK 或 qWALS。
2. Base model。XLM-R（classification）、mT5（generation）、NLLB（translation）、Aya-23（generative LLM）。
3. Few-shot 预算。如果可用，从 100-500 个目标语言样本开始。只有在标注不可行时才使用 zero-shot。
4. 评估计划。按语言统计准确率（不是聚合）、跨语言一致性、非拉丁文字上的 entity-level F1。

拒绝交付没有按语言评估的多语言模型，因为聚合指标会掩盖长尾失败。将 tokenization 覆盖率低的书写系统（阿姆哈拉语、提格里尼亚语、许多非洲语言）标记为需要带 byte-fallback 的模型（带 byte_fallback=True 的 SentencePiece，或像 GPT-2 一样的 byte-level tokenizer）。
```

##  ejercicios

1. **Easy.**En inglés, francés, hindi y árabe, cada idioma tiene 10 frases, y se ejecuta un pipeline de clasificación de tiro cero.
2. **Medium.**Uso `paraphrase-multilingual-MiniLM-L12-v2`En un pequeño lenguaje mezclado en el lenguaje, se construye un buscador de diferentes idiomas.
3. **Hard.**En el trabajo de clasificación de idiomas indios en la India, ambos programas utilizan 500 ejemplos de idiomas objetivos para realizar ajustes de pocas tomas. El informe muestra que el idioma fuente ha producido una mejor precisión en el idioma indio, así como una mayor cantidad de resultados.

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Multilingual model | 一个模型，多种语言 | 跨语言共享词表和参数。 |
| Cross-lingual transfer | 在一种语言上训练，在另一种语言上运行 | 在源语言上 fine-tune，在没有目标语言标签的情况下在目标语言上评估。 |
| Zero-shot | 没有目标语言标签 | 不在目标语言上 fine-tune 的迁移。 |
| Few-shot | 少量目标标签 | 用于 fine-tuning 的 100-500 个目标语言样本。 |
| mBERT | 第一个多语言 LM | 在 Wikipedia 上预训练的 104 语言 BERT。 |
| XLM-R | 标准跨语言 baseline | 在 CommonCrawl 上预训练的 100 语言 RoBERTa。 |
| NLLB | Meta 的 200 语言 MT | No Language Left Behind。包含 55 种低资源语言。 |

## 延伸阅读

- [Conneau et al. (2019). Unsupervised Cross-lingual Representation Learning at Scale](https://arxiv.org/abs/1911.02116) XLM-R 论文──
- [Pires, Schlinger, Garrette (2019). How Multilingual is Multilingual BERT?](https://arxiv.org/abs/1906.01502) 开启跨语言迁移研究线的分析论文──
- [Costa-jussà et al. (2022). No Language Left Behind](https://arxiv.org/abs/2207.04672) NLLB-200 论文──
- [Üstün et al. (2024). Aya Model: An Instruction Finetuned Open-Access Multilingual Language Model](https://arxiv.org/abs/2402.07827) Aya,Cohere's Multilingual LLM。
- [Language Similarity Predicts Cross-Lingual Transfer Learning Performance (2026)](https://www.mdpi.com/2504-4990/8/3/65) QWALS / LANGRANK 源语言论文。
