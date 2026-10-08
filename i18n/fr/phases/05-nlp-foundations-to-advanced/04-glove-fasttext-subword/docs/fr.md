# GloVe、FastText et les insertions de sous-parts

> Word2Vec 为每个词训练一个嵌入──GloVe对共现矩阵做分化──FastText Embedding 词的组成片段──BPE 连接到了变体──

**类型:**Construire
**语言:**Python
**先修要求:**Phase 5 · 03 (Word2Vec à partir de zéro)
**时间:**- 45 minutes

##  problématique

Word2Vec a laissé deux questions ouvertes:

Premièrement, il y a aussi une autre ligne de recherche qui se rapporte directement à la factualisation de la matrice commune actuelle (LSA, HAL), plutôt que de faire un saut-gramme en ligne.**GloVe** Réponse à cette question: couplage de l'émotion de choix de Perte, facteurisation de matrice peut correspondre même au-delà de Word2Vec, et le coût de formation est plus faible

Deuxièmement, les deux méthodes n'ont pas traité de propositions de mots jamais vues.`Zoomer-approved`- Je suis là.`dogecoin`、上周刚被创造的任何专名词、罕见词根的每种屈曲形式──**FastText**通过嵌入字符n-grammes 解决了这个问题: un mot est le résumé de ses composants, y compris les morphèmes, de sorte que même hors vocabulaire 词也能得到合理的矢量──

Troisièmement, lorsque les transformateurs sont apparus, les problèmes se sont de nouveau modifiés. Le vocabulaire de classe de mots est généralement le plus élevé d'environ un million; le véritable langage est beaucoup plus ouvert que celui-ci.**Byte-pair encoding (BPE)** et ses méthodes associées  résolue ce problème                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

Cette classe va expliquer ces trois-là, puis expliquer quand choisir lequel.

## 概念

**GloVe (Global Vectors)。**构建词-词共现 Matrice `X`, parmi lesquels `X[i][j]`Prononciation `j`Apprendre le mot`i`Réaction de la fréquence dans le texte.`v_i · v_j + b_i + b_j ≈ log(X[i][j])`◊ Pour le Perte de plus de pouvoir, éviter de plus de fréquences

**FastText。**Un mot est son caractère n-grammes, plus le mot lui-même est son ensemble.`where`变成 `<wh, whe, her, ere, re>, <where>`◊词 Vector is these composing Vector 总和──按 Word2Vec的方式训练──好处:未见过的词(`whereupon`) peut être composé de n-grammes connus.

**BPE (Byte-Pair Encoding)。**Le vocabulaire de chaque paire de mots est un autre type de mot.`k`Résultat: obtenir un contenu`k + 256`个 Token 的词汇库,其中高频序列(`ing`- Je suis là.`tion`- Je suis là.`the`) est un seul jeton, rares mots seront démoli en morceaux mûrs.


```figure
n5-subword-merge
```

## Construction

### GloVe: factorize la matrice 共现

```python
import numpy as np
from collections import Counter


def build_cooccurrence(docs, window=5):
    pair_counts = Counter()
    vocab = {}
    for doc in docs:
        for token in doc:
            if token not in vocab:
                vocab[token] = len(vocab)
    for doc in docs:
        indexed = [vocab[t] for t in doc]
        for i, center in enumerate(indexed):
            for j in range(max(0, i - window), min(len(indexed), i + window + 1)):
                if i != j:
                    distance = abs(i - j)
                    pair_counts[(center, indexed[j])] += 1.0 / distance
    return vocab, pair_counts


def glove_train(vocab, pair_counts, dim=16, epochs=100, lr=0.05, x_max=100, alpha=0.75, seed=0):
    n = len(vocab)
    rng = np.random.default_rng(seed)
    W = rng.normal(0, 0.1, size=(n, dim))
    W_tilde = rng.normal(0, 0.1, size=(n, dim))
    b = np.zeros(n)
    b_tilde = np.zeros(n)

    for epoch in range(epochs):
        for (i, j), x_ij in pair_counts.items():
            weight = (x_ij / x_max) ** alpha if x_ij < x_max else 1.0
            diff = W[i] @ W_tilde[j] + b[i] + b_tilde[j] - np.log(x_ij)
            coef = weight * diff

            grad_W_i = coef * W_tilde[j]
            grad_W_tilde_j = coef * W[i]
            W[i] -= lr * grad_W_i
            W_tilde[j] -= lr * grad_W_tilde_j
            b[i] -= lr * coef
            b_tilde[j] -= lr * coef

    return W + W_tilde
```

Il y a deux éléments d'activité à noter.`f(x) = (x/x_max)^alpha`会降低非常高频词对(比如`(the, and)`L'implantation finale est`W`(centre) et `W_tilde`(context) Les techniques publiées dans les deux tableaux sont généralement meilleures que l'un d'eux.

### FastText: les intégrations sensibles aux sous-mot

```python
def char_ngrams(word, n_min=3, n_max=6):
    wrapped = f"<{word}>"
    grams = {wrapped}
    for n in range(n_min, n_max + 1):
        for i in range(len(wrapped) - n + 1):
            grams.add(wrapped[i:i + n])
    return grams
```

```python
>>> char_ngrams("where")
{'<where>', '<wh', 'whe', 'her', 'ere', 're>', '<whe', 'wher', 'here', 'ere>', '<wher', 'where', 'here>'}
```

Chaque mot est composé de ses n-grammes 集合表示(habituellement de 3 à 6 caractères)。词 Embedding est son n-gram Embedding's总和── Pour le skipping-gramme 训练, le mettre en relation avec Word2Vec.

```python
def fasttext_vector(word, ngram_table):
    grams = char_ngrams(word)
    vecs = [ngram_table[g] for g in grams if g in ngram_table]
    if not vecs:
        return None
    return np.sum(vecs, axis=0)
```

Pour les mots inconnus, tant que certains n-grammes sont connus, vous pouvez toujours obtenir un vecteur.`whereupon`Avec `where`Partage`<wh`- Je suis là.`her`- Je suis là.`ere`et `<where`Alors, les deux seront en position de proximité.

### BPE: le vocabulaire de sous-parts que vous obtenez

```python
def learn_bpe(corpus, k_merges):
    vocab = Counter()
    for word, freq in corpus.items():
        tokens = tuple(word) + ("</w>",)
        vocab[tokens] = freq

    merges = []
    for _ in range(k_merges):
        pair_freq = Counter()
        for tokens, freq in vocab.items():
            for a, b in zip(tokens, tokens[1:]):
                pair_freq[(a, b)] += freq
        if not pair_freq:
            break
        best = pair_freq.most_common(1)[0][0]
        merges.append(best)

        new_vocab = Counter()
        for tokens, freq in vocab.items():
            new_tokens = []
            i = 0
            while i < len(tokens):
                if i + 1 < len(tokens) and (tokens[i], tokens[i + 1]) == best:
                    new_tokens.append(tokens[i] + tokens[i + 1])
                    i += 2
                else:
                    new_tokens.append(tokens[i])
                    i += 1
            new_vocab[tuple(new_tokens)] = freq
        vocab = new_vocab
    return merges


def apply_bpe(word, merges):
    tokens = list(word) + ["</w>"]
    for a, b in merges:
        new_tokens = []
        i = 0
        while i < len(tokens):
            if i + 1 < len(tokens) and tokens[i] == a and tokens[i + 1] == b:
                new_tokens.append(a + b)
                i += 2
            else:
                new_tokens.append(tokens[i])
                i += 1
        tokens = new_tokens
    return tokens
```

```python
>>> corpus = Counter({"low": 5, "lower": 2, "newest": 6, "widest": 3})
>>> merges = learn_bpe(corpus, k_merges=10)
>>> apply_bpe("lowest", merges)
['low', 'est</w>']
```

La première rencontre a lieu le plus fréquent des paires voisines.`low`- Je suis là.`est`- Je suis là.`tion`) deviendra un seul jeton, rares mots sont déchiffrés.

Réellement, les Tokenizers GPT / BERT / T5 vont apprendre 30 000 à 100 000 fusions.

## Utilisation

En pratique, vous faites peu de choses vous-même.

```python
import fasttext.util
fasttext.util.download_model("en", if_exists="ignore")
ft = fasttext.load_model("cc.en.300.bin")
print(ft.get_word_vector("whereupon").shape)
print(ft.get_word_vector("zoomerapproved").shape)
```

Dans le transformateur 时代使用 BPE 风格的字幕标记:

```python
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("gpt2")
print(tok.tokenize("unbelievably tokenized"))
```

```
['un', 'bel', 'iev', 'ably', 'Ġtoken', 'ized']
```

`Ġ`Il est également utilisé pour les symboles de la marque de référence.

### Quelle heure choisir qui ?

| 情况 | 选择 |
|-----------|------|
| 预训练通用词 Vector，不需要 OOV 容忍度 | GloVe 300d |
| 预训练通用词 Vector，必须处理拼写错误 / 新词 / 形态丰富的语言 | FastText |
| 任何输入 transformer 的内容（训练或 inference） | 模型随附的 Tokenizer。永远不要替换。 |
| 从零训练自己的语言模型 | 先在你的 corpus 上训练 BPE 或 SentencePiece Tokenizer |
| 使用 linear model 做生产级文本 Classification | 仍然是 TF-IDF。Lesson 02。 |

## 交付

保存为 `outputs/skill-embeddings-picker.md`- Le numéro de la liste:

```markdown
---
name: tokenizer-picker
description: Pick a tokenization approach for a new language model or text pipeline.
version: 1.0.0
phase: 5
lesson: 04
tags: [nlp, tokenization, embeddings]
---

Given a task and dataset description, you output:

1. Tokenization strategy (word-level, BPE, WordPiece, SentencePiece, byte-level). One-sentence reason.
2. Vocabulary size target (e.g., 32k for an English-only LM, 64k-100k for multilingual).
3. Library call with the exact training command. Name the library. Quote the arguments.
4. One reproducibility pitfall. Tokenizer-model mismatch is the single most common silent production bug; call out which pair must be used together.

Refuse to recommend training a custom tokenizer when the user is fine-tuning a pretrained LLM. Refuse to recommend word-level tokenization for any model targeting production inference. Flag non-English / multi-script corpora as needing SentencePiece with byte fallback.
```

## 练习

1. **Easy。**运行  référencement`char_ngrams("playing")`et `char_ngrams("played")`◊ calculer deux n-grammes de collection de Jaccard se chevauchent.`pla`- Je suis là.`lay`- Je suis là.`play`), c'est pourquoi FastText peut très bien migrer vers les formes variables.
2. **Medium。**扩展 `learn_bpe`Pour suivre le vocabulaire 增长── dessiner des jetons-par-corpus-character 随着数量变化函数的融合──你应该看到一开始快速压缩,然后渐近到约 ~2-3 chars per token──
3. **Hard。**Dans les œuvres complète de Shakespeare, on apprend à utiliser un BPE de 1K.

## 关键术语

| 术语 | 人们的说法 | 它实际上的含义 |
|------|-----------------|-----------------------|
| Co-occurrence matrix | 词-词频率表 | `X[i][j]` = 词 `j` 出现在词 `i` 周围窗口中的频率。 |
| Subword | 词的一部分 | 字符 n-gram（FastText）或学习得到的 Token（BPE/WordPiece/SentencePiece）。 |
| BPE | Byte-pair encoding | 迭代合并最高频相邻 pairs，直到 vocabulary 达到目标大小。 |
| OOV | Out of vocabulary | 模型从未见过的词。Word2Vec/GloVe 会失败。FastText 和 BPE 能处理。 |
| Byte-level BPE | 原始 bytes 上的 BPE | GPT-2 的方案。Vocabulary 从 256 个 bytes 开始，所以任何东西都不会 OOV。 |

## 延伸阅读

- [Pennington, Socher, Manning (2014). GloVe: Global Vectors for Word Representation](https://nlp.stanford.edu/pubs/glove.pdf) GloVe 论文,七页, jusqu'à présent encore est la meilleure recommandation pour la perte.
- [Bojanowski et al. (2017). Enriching Word Vectors with Subword Information](https://arxiv.org/abs/1607.04606) Rapide texte。
- [Sennrich, Haddow, Birch (2016). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) 将 BPE 引入现代NLP的论文──
- [Hugging Face tokenizer summary](https://huggingface.co/docs/transformers/tokenizer_summary) BPE、WordPiece 和 SentencePiece en pratique, il y a vraiment une différence.
