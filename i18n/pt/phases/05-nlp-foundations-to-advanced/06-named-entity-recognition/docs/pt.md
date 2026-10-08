# Identificação da entidade denominada

> Deixe-me dizer o que é que é.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word Embeddings)
**Time:** ~75 minutes

## 问题

"A Apple processou o Google por causa do seu acordo de pesquisa do iPhone nos EUA". 五个实体:Apple (ORG)  Google (ORG)  iPhone (PRODUCT) 搜索交易(也许算) 美国 (GPE) ⋅一个好的NER 系统会提取全部实体,并给出正确类型──一个差的系统会漏掉iPhone,把水果 Apple和公司 Apple 混,也将"US"标签成 PERSON──

O NER é cada artigo estruturado extrair o pipeline de fundo. Você quase não vê isso, mas você sempre depende dele.

Este curso vai seguir o caminho clássico (Regular-based、HMM、CRF) em direção ao moderno (BiLSTM-CRF, então transformadores) ⋅ Cada passo resolve uma limitação específica do passo anterior ⋅ Este modelo de desenvolvimento é o ponto de partida do curso ⋅

## 概念

**BIO tagging**(ou BILOU) 把实体抽取转化为序列标注问题――为每个标注 `B-TYPE`(实体开始)`I-TYPE`(não é um organismo)`O`(qualquer corpo fora)

```
Apple    B-ORG
sued     O
Google   B-ORG
over     O
its      O
iPhone   B-PRODUCT
search   O
deal     O
in       O
the      O
US       B-GPE
.        O
```

Muitos símbolos de corpo estão ligados:`New B-GPE`- Não.`York I-GPE`- Não.`City I-GPE`❖ compreender o modelo de BIO pode ser extraído de qualquer espaço.

架构演进:

- **Rule-based.**Regex + gazetteer 查找──对已知实体精度 高,对新实体覆盖 为零──
- **HMM.**Modelo de Markov oculto── probabilidade de emissão de tokens de tag, bem como probabilidade de transição da tag até tag── usando o decodificação Viterbi── em treinamento em dados de tag──
- **CRF.**Campo aleatório condicional. Semelhante ao HMM, mas pertence a um modelo discriminativo, por isso pode misturar qualquer característica (forma de palavra, grandeza de escrita, vizinhança de palavras) até 2026, em baixa recursos, continua a ser a principal força produtiva.
- **BiLSTM-CRF.**Usal Neural Features substituir manuel Features. LSTM 双向读取句子,顶部CRF 层强制标签 序列一致.
- **Transformer-based.**Utilize o teste de classificação de tokens 微调 BERT──准确率最高──计算量最大──


```figure
ner-bio-tagging
```

## Construí-lo

### 步骤 1: Assessores de etiquetado de bio

```python
def spans_to_bio(tokens, spans):
    labels = ["O"] * len(tokens)
    for start, end, label in spans:
        labels[start] = f"B-{label}"
        for i in range(start + 1, end):
            labels[i] = f"I-{label}"
    return labels


def bio_to_spans(tokens, labels):
    spans = []
    current = None
    for i, label in enumerate(labels):
        if label.startswith("B-"):
            if current:
                spans.append(current)
            current = (i, i + 1, label[2:])
        elif label.startswith("I-") and current and current[2] == label[2:]:
            current = (current[0], i + 1, current[2])
        else:
            if current:
                spans.append(current)
                current = None
    if current:
        spans.append(current)
    return spans
```

```python
>>> tokens = ["Apple", "sued", "Google", "over", "iPhone", "sales", "."]
>>> labels = ["B-ORG", "O", "B-ORG", "O", "B-PRODUCT", "O", "O"]
>>> bio_to_spans(tokens, labels)
[(0, 1, 'ORG'), (2, 3, 'ORG'), (4, 5, 'PRODUCT')]
```

### 步骤 2: Características artesanas

Para o clássico, o NER não neural é o núcleo das características:

```python
def token_features(token, prev_token, next_token):
    return {
        "lower": token.lower(),
        "is_upper": token.isupper(),
        "is_title": token.istitle(),
        "has_digit": any(c.isdigit() for c in token),
        "suffix_3": token[-3:].lower(),
        "shape": word_shape(token),
        "prev_lower": prev_token.lower() if prev_token else "<BOS>",
        "next_lower": next_token.lower() if next_token else "<EOS>",
    }


def word_shape(word):
    out = []
    for c in word:
        if c.isupper():
            out.append("X")
        elif c.islower():
            out.append("x")
        elif c.isdigit():
            out.append("d")
        else:
            out.append(c)
    return "".join(out)
```

`word_shape("iPhone")` Retorno `xXxxxx`- Não.`word_shape("USA-2024")` Retorno `XXX-dddd`◊                                                                                                                                                                                                                                                              

### 步骤 3: Uma simples linha de base base baseada em regras + dicionário

```python
ORG_GAZETTEER = {"Apple", "Google", "Microsoft", "OpenAI", "Meta", "Amazon", "Netflix"}
GPE_GAZETTEER = {"US", "USA", "UK", "India", "Germany", "France"}
PRODUCT_GAZETTEER = {"iPhone", "Android", "Windows", "ChatGPT", "Claude"}


def rule_based_ner(tokens):
    labels = []
    for token in tokens:
        if token in ORG_GAZETTEER:
            labels.append("B-ORG")
        elif token in GPE_GAZETTEER:
            labels.append("B-GPE")
        elif token in PRODUCT_GAZETTEER:
            labels.append("B-PRODUCT")
        else:
            labels.append("O")
    return labels
```

Há milhões de artigos da Wikipedia e da DBpedia 抓取的条目──Cobreza 很好──Disambiguation(Company Apple vs 水果 Apple) 很糟──这就是统计模型胜出的原因──

### 步骤 4: CRF 步骤(草图, não é uma realização completa)

Se não houver base para a probabilidade, não se pode criar uma CRF completa a partir de zero com 50 páginas.`sklearn-crfsuite`- Não .

```python
import sklearn_crfsuite

def to_features(tokens):
    out = []
    for i, tok in enumerate(tokens):
        prev = tokens[i - 1] if i > 0 else ""
        nxt = tokens[i + 1] if i + 1 < len(tokens) else ""
        out.append({
            "word.lower()": tok.lower(),
            "word.isupper()": tok.isupper(),
            "word.istitle()": tok.istitle(),
            "word.isdigit()": tok.isdigit(),
            "word.suffix3": tok[-3:].lower(),
            "word.shape": word_shape(tok),
            "prev.word.lower()": prev.lower(),
            "next.word.lower()": nxt.lower(),
            "BOS": i == 0,
            "EOS": i == len(tokens) - 1,
        })
    return out


crf = sklearn_crfsuite.CRF(algorithm="lbfgs", c1=0.1, c2=0.1, max_iterations=100, all_possible_transitions=True)
X_train = [to_features(s) for s in sentences_tokenized]
crf.fit(X_train, bio_labels_train)
```

`c1`和 `c2`É a regularização de L1 e L2.`all_possible_transitions=True`让模型学习非法序列 (por exemplo)`O`- O que é isso?`I-ORG`) probabilidade é baixa, é o CRF em forma forçada BIO unilateral em caso de não precisar de sua mão de escrever.

### Passo 5: BiLSTM-CRF  aumentou o que

Features become learning gets of──输入:token embeddings(GloVe 或 fastText)──LSTM From left to right、 from right to left读取──拼接后的隐藏状态 进入 CRF 输出层──CRF 仍然强制标签 序列一致;LSTM 则用学习得到的特征替代手工特征──

```python
import torch
import torch.nn as nn


class BiLSTM_CRF_Head(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, n_labels):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, bidirectional=True, batch_first=True)
        self.fc = nn.Linear(hidden_dim * 2, n_labels)

    def forward(self, token_ids):
        e = self.embed(token_ids)
        h, _ = self.lstm(e)
        emissions = self.fc(h)
        return emissions
```

CRF 层使用 `torchcrf.CRF`(Pip instalar pitorcha-crf) ―― Comparado com CRF feito à mão, a elevação é mensurável, mas a menos que você tenha milhares de sentenças de marcação, a elevação da amplitude geralmente é menor do que você espera.

## Use-o

O espaço está aberto e está a ser produzido em NER.

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("Apple sued Google over its iPhone search deal in the US.")
for ent in doc.ents:
    print(f"{ent.text:20s} {ent.label_}")
```

```
Apple                ORG
Google               ORG
iPhone               ORG
US                   GPE
```

Atenção .`iPhone`- Não .`ORG`Não é?`PRODUCT`,spaCy modelo pequeno para a cobertura da entidade de produto 较弱──大型(`en_core_web_lg`O modelo de transformador`en_core_web_trf`- Vai ser melhor.

NER baseado em BERT de Hugging Face:

```python
from transformers import pipeline

ner = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")
print(ner("Apple sued Google over its iPhone in the US."))
```

```
[{'entity_group': 'ORG', 'word': 'Apple', ...},
 {'entity_group': 'ORG', 'word': 'Google', ...},
 {'entity_group': 'MISC', 'word': 'iPhone', ...},
 {'entity_group': 'LOC', 'word': 'US', ...}]
```

`aggregation_strategy="simple"`Vai juntar-se em um espaço. Sem ele, você vai obter rótulos de nível de token, e você precisa juntar-se.

### NER baseado em LLM (NER baseado em LLM)

O NER de zero-shot e poucos-shot LLM já pode ser comparado com o modelo de competição de alta precisão em muitos domínios; em tempos de escassez de dados de marcação, o desempenho é claramente melhor.

- **Zero-shot prompting.**给 LLM 一组实体类型和一个示例方案――要求输出 JSON――开箱可用; 在新领域准确率中等――
- **ZeroTuneBio-style prompting.**将任务分解为候选人提取 → meaning explanation → judgment → re-check──多阶段 prompt(不是一 shot)能显著提升生物医学 NER 的准确率──同样模式也适用于法律、金融和科学领域──
- **Dynamic prompting with RAG.**Para cada chamada de inferência, a partir de um conjunto de sementes de sinalização de pequeno tamanho, o teste de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de 11-12% em 2026 em sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sinalização de sina sina sinalização de sinalização de sina sinalização de sina sina sina sina sina sina sina sina sina sinalização de sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina sina
- **Per-entity-type decomposition.**Para o longo dos documentos, uma vez o uso simultâneo de todos os tipos de corpos extraídos vai aumentar e diminuir a memória com a extensão.

截至2026年的生产建议: Before gathering training data, first make an LLM zero-shot baseline──很多时候F1 已经足够好,你根本不需要细调──

### 经典 NER 仍然胜出的地方

Mesmo que já existam LLM, o NER clássico ainda vence nas seguintes situações:

- Orçamento de latência  inferior a 50ms¬¬
- Tens milhares de exemplares de marcação, e precisas de 98%+ F1.
- ▌de um nível de formação de um nível de formação de nível superior,
- 监管约束要求 on-premis、非生成式模型──

### Vai falhar em qualquer lugar.

- **Domain shift.**Em CoNLL, o NER de treinamento usado em contratos legais, desempenho superior ao jornalista ainda é diferente.
- **Nested entities.**"Bank of America Tower" 同时是 ORG 和 FASILITY──标准BIO 无法表示重叠 span──你需要嵌套的NER(multi-pass或跨度型号)──
- **Long entities.**"Corporação Federal de Seguros de Depósitos dos Estados Unidos".`aggregation_strategy`Ou depois de processado.
- **Sparse types.**医疗 NER 标签包括 DRUG_BRAND、ADVERSE_EVENT、DOSE。通用模型完全不了解这些──Scispacy 和 BioBERT 是此的起点──

## Entrega-o

保存为 `outputs/skill-ner-picker.md`- Não .

```markdown
---
name: ner-picker
description: 为给定抽取任务选择合适的 NER 方法。
version: 1.0.0
phase: 5
lesson: 06
tags: [nlp, ner, extraction]
---

给定一个任务描述（领域、标签集、语言、延迟、数据量），输出：

1. 方法。Rule-based + gazetteer、CRF、BiLSTM-CRF，或 transformer fine-tune。
2. 起始模型。命名它（spaCy model ID、Hugging Face checkpoint ID，或 "custom, trained from scratch"）。
3. 标注策略。BIO、BILOU，或 span-based。用一句话说明理由。
4. 评估。使用 `seqeval`。始终报告 entity-level F1（不是 token-level）。

除非用户已经有 pretrained domain model，否则拒绝建议在少于 500 个标注样例上 fine-tuning transformer。如果存在 nested entities，标记为需要 span-based 或 multi-pass models。如果用户提到 "production scale"，且标签与 CoNLL-2003 相同，则要求进行 gazetteer audit。
```

## 练习

1. **Easy.** realização `bio_to_spans`(`spans_to_bio`de operação oposta), e 10 个句上验证回路一致性──
2. **Medium.**Em CoNLL-2003 Inglês NER conjunto de dados 上訓練 上の sklearn-crfsuite CRF。使用 `seqeval` relatório por entidade F1── típico resultado:~84 F1──
3. **Hard.**Em um domínio específico de dados NER (medicina, jurídica ou financeira)`distilbert-base-cased` Comparar com o modelo de espaçoC small model para comparar  registar as verificações de vazamento de dados,并写下让你意外的发现──

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| NER | 提取名称 | 给 token spans 标注类型（PERSON、ORG、GPE、DATE，...）。 |
| BIO | Tagging scheme | `B-X` 表示开始，`I-X` 表示继续，`O` 表示外部。 |
| BILOU | 更好的 BIO | 增加 `L-X`（last）、`U-X`（unit），让边界更清晰。 |
| CRF | 结构化 classifier | 对 labels 之间的 transitions 建模，而不只是 emissions。强制有效序列。 |
| Nested NER | 重叠实体 | 一个 span 是与其子 span 不同的实体。BIO 无法表达这一点。 |
| Entity-level F1 | 正确的 NER metric | 预测 span 必须与真实 span 完全匹配。Token-level F1 会高估准确率。 |

## 延伸阅读

- [Lample et al. (2016). Neural Architectures for Named Entity Recognition](https://arxiv.org/abs/1603.01360) BiLSTM-CRF 论文──经典──
- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers](https://arxiv.org/abs/1810.04805)  Introdução mais tarde tornou-se padrão de token-classificação 模式
- [spaCy linguistic features — named entities](https://spacy.io/usage/linguistic-features#named-entities)- Não .`Doc.ents`和 `Span`Referência prática de cada um dos seus atributos:
- [seqeval](https://github.com/chakki-works/seqeval)                                                                                                                                                                                                                                                              
