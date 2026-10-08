# 多语言 PNL

> Um modelo, 100+ idiomas, a maioria dos quais não tem nenhum treinamento.

**Type:** Learn
**Languages:** Python
**先修要求：**Fase 5 · 04 (GloVe, FastText, Subword), Fase 5 · 11 (Tradução automática)
**Time:** ~45 分钟

## 问题

Inglês tem bilhões de exemplares com etiquetas. Uldurês tem milhares.

O modelo multilingüe passa por treinar um modelo para resolver este problema em várias línguas. O compartilhamento mostra que o modelo pode mudar de capacidade de aprendizagem de alta fonte para baixa fonte. Usando o analise emocional em inglês para fazer uma sintonia fina com o modelo, ele pode abrir uma caixa de dados para fornecer uma previsão emocional bastante boa para o Urdu.

Esta aula descreve os modelos de peso e a decisão de um grupo que começou a trabalhar em várias línguas:

## 概念

![通过共享多语言 Embedding space 实现跨语言迁移](../assets/multilingual.svg)

**共享词表。**Multi-lingual modelo usado em todos os textos de língua-alvo para treinar SentencePiece ou WordPiece tokenizer.`anti-`Vou ter o mesmo token.

**共享表示。**Em vários idiomas, a utilização de linguagem mascarada de modelagem 预训的Transformer,会学到不同语言中语义相似的句子会产生相似的隐藏状态──mBERT、XLM-R 和 NLLB 都表现出这一点──英语中"cat"的嵌入会聚集在法语中语中语中语中语义相似的句子中语相似的句子会产生相似的隐藏状态──mBERT、XLM-R 和 NLLB 都表现出这一点──英语中语中猫的嵌入会聚集在法语中语中语中语中语中语语中语义相似的句子中语相似的句子中语相似的句子产生相似的隐藏状态──mBERT、XLM-R 和 NLLB 都表现出这一点──英语中语中猫的嵌入会聚集在法语中语中语中语中语中语中语中语中语中语中语中语中语中语语中语中语语中语相似的句子中语中语中语中语中语中语相似的句子中语中语中语中语中语相似的相似的句子中语语中语中语中语中语中语中语中相似的相似的相似的句子中语语语语中相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似的相似性会会会会出现了.

**Zero-shot 迁移。**Em um idioma (normalmente inglês) com o tag de dados de um modelo, é perfeitamente ajustado.

**Few-shot fine-tuning。**Na língua-alvo, adicionar 100-500 个带标签样本――分类任务的准确率将跃升到英语基线的95-98%―― é o maior preço de NLP multilingue em relação ao nível médio.

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

按用例选择──分类任务可以将XLM-R-base 作为稳定默认值──生成任务需要根据翻译还是开源生成,在mT5或NLLB 之间选择──LLM 风格工作可以搭配 Aya-23或Claude,并使用明确的多语言提示──

## 源语言决策(2026 研究)

O número de grupos de trabalho que usam o inglês como linguagem de ajuste perfeito (Fonte: 源语言──近期研究(2026) indica que isso é um erro.

语言相似性比原始语料规模更能预测迁移质量──对于斯拉夫语目标语言,德语或俄语往往优于英语──对于印度语族目标语言,印度语往往优于英语──**qWALS**Paralelamente, a análise foi feita em 2026, com base nas características do Atlas Mundial de Estruturas de Línguas.**LANGRANK**(Lin et al., ACL 2019) é outro método mais antigo, que combina linguagem similaridade, tamanho de linguagem e relação de genealogia, para organizar linguagem candidata.

Regra prática: se a sua língua-alvo tem um tipo de linguagem de alto recurso, primeiro tente ajustar a linguagem, e depois ajustar a linguagem inglesa.


```figure
n5-crosslingual-bridge
```

## Construção

### 步骤 1: zero-shot 跨语言分类

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

Um modelo, três idiomas, uma mesma API. XLM-R em NLI dados no treinamento, através de truque de envolvimento 能很好地迁移到分类任务.

### 步骤 2: 多语言 Embutida espaço

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

译文会落在嵌入空间 中相相近的位置――另一句不同的英语句句会落得更远―― é por isso que a busca e o agrupamento de diferentes línguas e a semelhança podem funcionar――

### 步骤 3: estratégia de ajuste fino de poucas tiras

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

 para 100-500 个目标语言样本,`num_train_epochs=5`和 `learning_rate=2e-5`É um valor estável. Uma taxa de aprendizagem mais alta levará à queda de várias línguas, e, eventualmente, a obtenção de um modelo de apenas inglês.

## Evaluação verdadeira e eficaz

- **在 held-out 集上按语言统计准确率。**Não se aglomere.
- **与单语言 baseline 对比。**Para um idioma com dados suficientes, um modelo monolingüe de treinamento às vezes é superior a um modelo multilingüe.
- **Entity-level 测试。**目標言語中的命名实体──多语言模型对远离拉丁文字的书写系统通常标记化较弱──
- **跨语言一致性。**Quando duas línguas expressam o mesmo significado, deve-se produzir a mesma previsão.

## Utilização

2026 技术:

| Task | Recommended |
|-----|-------------|
| Classification, 100 languages | XLM-R-base (~270M) fine-tuned |
| Zero-shot text classification | `joeddav/xlm-roberta-large-xnli` |
| Multilingual sentence embeddings | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` |
| Translation, 200 languages | `facebook/nllb-200-distilled-600M`（见 lesson 11） |
| Generative multilingual | Claude, GPT-4, Aya-23, mT5-XXL |
| Low-resource language NLP | XLM-V 或在相关高资源语言上做 domain-specific fine-tune |

Se o desempenho é importante, deve ser feito para o objetivo de linguagem de ajuste de orçamento.

### Tokenization 成本(低资源语言会出什么问题)

O modelo multi-linguístico compartilha um tokenizer entre todas as línguas. Este vocabulário é treinado em linguagens dominadas pelo inglês, francês, espanhol, chinês e alemão.

- **Fertility 成本。**低资源语言文本会被代币化成比英语更多的代币―― um indí语句子可能需要等价英语句子的 3-5x代币―― esse 3-5x 会吞吞你的上下文窗口、训练效率和延迟预算――
- **变体恢复成本。**Cada erro de redação, variação de símbolos adicionais, Unicode, regularização incompatível ou variação de escrita de grande porte, se transforma em uma sequência de inicialização em estado de frio no espaço de inserção.
- **容量外溢成本。**Os resultados de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um sobre sobre sobre sobre sobre sobre sobre sobre sobre sobre o assunto sobre o assunto sobre o assunto sobre o assunto sobre o assunto sobre o assunto.

Os sintomas reais são: seu modelo em indiano está treinado normal, a perda de curva parece correta, a perplexidade é razoável, a produção é produzida por erros.**Tokenizer 坏了，靠扩大数据规模救不回来。**

缓解方式: escolher um tokenizer para target language覆盖良好的(XLM-V 1M-token 词表就是直接修复); training前在 目标文本上验证 Tokenization fertilidade; utilizar o sistema de escrita para o verdadeiro长尾 字符串的字符串的字符串的字符串的字符串是直接修复;`byte_fallback=True`,GPT-2 风格 BPE de nível de byte), garantir que nunca haja OOV.

## 交付

保存为 `outputs/skill-multilingual-picker.md`- Não .

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

## 练习

1. **Easy.**Em inglês, francês, indiano e árabe, cada língua tem 10 sentenças, e é executado um pipeline de classificação zero-shot.
2. **Medium.**Utilização `paraphrase-multilingual-MiniLM-L12-v2`Em um pequeno mixado linguagem linguística linguística construído em um cross-lingual check-in.
3. **Hard.**Em um estudo de pesquisa em língua indiana, o estudo foi realizado em um estudo de pesquisa em língua indiana, que mostrou que a língua indiana é mais boa do que a língua indiana.

## 关键术语

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
