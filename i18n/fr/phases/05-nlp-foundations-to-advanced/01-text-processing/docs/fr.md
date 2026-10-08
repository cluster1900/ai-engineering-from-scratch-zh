# Traitement du texte  Tokenization, stemming, lemmatisation

> Le processus de pré-traitement est un processus de construction.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 2 · 14 (Naive Bayes)
**Time:** ~45 分钟

## Le problème

模型不能读读"Les chats couraient".―

Chaque système de PNL commence par les mêmes trois questions. Les mots commencent par les mêmes trois questions.

La Tokenization fait une erreur, le modèle va apprendre à partir du déchet. Si votre Tokenizer le met en place,`don't`Quand on est en train de faire un jeton, on le fait.`do n't`Quand on a deux jetons, on est démonté.`organization`et `organ`Si votre lemmatizer a besoin d'une partie du discours, mais vous n'avez pas de transmission, le mot d'ordre sera traité comme un mot de passe.

Ce cours va commencer par ces trois étapes de préprocessage, puis montrer comment faire le même travail à partir de zéro, en vous permettant de voir quelles sont les différentes étapes.

## Le concept

Trois opérations: chacun a ses propres responsabilités et mode d'échec.

**Tokenization**Le mot "Token" est un mot qui reste flou, car la graisse exacte dépend de la tâche.

**Stemming**Avec des règles de coupe, après.`running -> run`Il y a une autre.`organization -> organ`Le second est le mode d'échec.

**Lemmatization**Utilisation de la langue française pour la langue française.`ran -> run`(Ne pas oublier que "courir" est le passé de "courir")`better -> good`(Ne pas oublier la comparaison de la classe)

经验法则──速度重要且可忍受噪音时使用源源的搜索索索索索索,粗略分类)──语义重要时使用化问题答案,语义重要时使用语义重要时使用语义重要时使用语义重要时使用语义重要时使用语义的搜索,语义的搜索,任何用户会阅读的内容)──


```figure
edit-distance
```

## Faites-le

### Étape 1: Un jeton de mot regex

Le Tokenizer le plus simple et utile sera défini en caractères numériques non-alphabetés, tout en conservant le point de référence comme son propre Token.

```python
import re

def tokenize(text):
    return re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?|[0-9]+|[^\sA-Za-z0-9]", text)
```

Trois modèles de mots laissés à l'intérieur`don't`- Je suis là.`it's`)。Pure Numbers。Any single non-空白、非字母数字字符作为独立Token(标点)。

```python
>>> tokenize("The cats weren't running at 3pm.")
['The', 'cats', "weren't", 'running', 'at', '3', 'pm', '.']
```

需要注意的失败模式──`3pm`Il sera coupé.`['3', 'pm']`, parce que nous échangeons entre les lettres et les chiffres. Pour la plupart des tâches, les URL, les e-mails, les hashtags sont des problèmes.

### Étape 2: Un porte-avions

L'algorithme complet de Porter a cinq étapes de règles. La seule étape 1a consiste à couvrir le plus courant de l'anglais.

```python
def stem_step_1a(word):
    if word.endswith("sses"):
        return word[:-2]
    if word.endswith("ies"):
        return word[:-2]
    if word.endswith("ss"):
        return word
    if word.endswith("s") and len(word) > 1:
        return word[:-1]
    return word
```

```python
>>> [stem_step_1a(w) for w in ["caresses", "ponies", "caress", "cats"]]
['caress', 'poni', 'caress', 'cat']
```

按从上到下读取规则──`ies -> i`La règle est:`ponies -> poni`Au lieu de`pony`Les règles sont plus importantes que les règles uniques.

### Étape 3: Un lemmatizer basé sur la recherche

Une véritable lematisation nécessite une morphologie.

```python
LEMMA_TABLE = {
    ("running", "VERB"): "run",
    ("ran", "VERB"): "run",
    ("runs", "VERB"): "run",
    ("better", "ADJ"): "good",
    ("best", "ADJ"): "good",
    ("cats", "NOUN"): "cat",
    ("cat", "NOUN"): "cat",
    ("were", "VERB"): "be",
    ("was", "VERB"): "be",
    ("is", "VERB"): "be",
}

def lemmatize(word, pos):
    key = (word.lower(), pos)
    if key in LEMMA_TABLE:
        return LEMMA_TABLE[key]
    if pos == "VERB" and word.endswith("ing"):
        return word[:-3]
    if pos == "NOUN" and word.endswith("s"):
        return word[:-1]
    return word.lower()
```

```python
>>> lemmatize("running", "VERB")
'run'
>>> lemmatize("cats", "NOUN")
'cat'
>>> lemmatize("better", "ADJ")
'good'
>>> lemmatize("watched", "VERB")
'watched'
```

Le dernier exemple est le point de formation clé.`watched`Il n'est pas à notre table, et le retour est à notre disposition.`ing`◊ Réelle légalisation 会覆盖 `ed`、不规则动词、比较级形容词、带音变的复数(`children -> child`)― c'est la raison pour laquelle le système de production utilise le morphologiseur WordNet、spaCy ou l'analyseur morphologique complet―

### Étape 4: Rassemblez-les

```python
def preprocess(text, pos_tagger=None):
    tokens = tokenize(text)
    stems = [stem_step_1a(t.lower()) for t in tokens]
    tags = pos_tagger(tokens) if pos_tagger else [(t, "NOUN") for t in tokens]
    lemmas = [lemmatize(word, pos) for word, pos in tags]
    return {"tokens": tokens, "stems": stems, "lemmas": lemmas}
```

缺失一块是 POS tagger──Phase 5 · 07 (POS Tagging) 会构建一个──现在,默认全部为 `NOUN`Je ne reconnais pas cette restriction.

## Utilisez-le

NLTK et espaCy fournissent des versions de production.

### NLTK

```python
import nltk
nltk.download("punkt_tab")
nltk.download("wordnet")
nltk.download("averaged_perceptron_tagger_eng")

from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer, WordNetLemmatizer
from nltk import pos_tag

text = "The cats were running."
tokens = word_tokenize(text)
stems = [PorterStemmer().stem(t) for t in tokens]
lemmatizer = WordNetLemmatizer()
tagged = pos_tag(tokens)


def nltk_pos_to_wordnet(tag):
    if tag.startswith("V"):
        return "v"
    if tag.startswith("J"):
        return "a"
    if tag.startswith("R"):
        return "r"
    return "n"


lemmas = [lemmatizer.lemmatize(t, nltk_pos_to_wordnet(tag)) for t, tag in tagged]
```

`word_tokenize`J'ai traité les contractions, le code Unicode, et les circonstances de la disparition de votre régex.`PorterStemmer`Il y aura cinq étapes.`WordNetLemmatizer`需要把 POS tag from Penn Treebank scheme of NLTK 翻译到 WordNet的缩写集合上面──的转换接线是大多数教程跳过的部分──

### - le secteur

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("The cats were running.")

for token in doc:
    print(token.text, token.lemma_, token.pos_)
```

```text
The      the     DET
cats     cat     NOUN
were     be      AUX
running  run     VERB
.        .       PUNCT
```

L'espace et le pipeline sont cachés.`nlp(text)`后面──Tokenization、POS tagging 和 lemmatization 都会运行──大规模时比NLTK 更快──开箱即用更准确──取舍是你不容易替换单个组件──

### Quand choisir qui ?

| Situation | Pick |
|-----------|------|
| 教学、研究、替换组件 | NLTK |
| 生产、多语言、速度重要 | spaCy |
| Transformer pipeline（反正你会用模型自己的 Tokenizer） | 使用 `tokenizers` / `transformers`，跳过经典 preprocessing |

### Personne ne vous rappelle vos deux modes d'échec

La plupart des cours ne parlent que d'algorithmes, puis ils s'arrêtent.

**Reproducibility drift。**NLTK et spaCy dans les versions entre elles vont changer la tokenization et le lemmatizer  comportement.`['do', "n't"]`Le contenu, dans 3.x, peut être produit `["don't"]`◊ Votre modèle est entraîné sur une distribution ◊ Inference est actuellement en cours de fonctionnement sur une autre distribution ◊ Le taux de précision ◊ baisse, mais personne ne sait pourquoi ◊ dans ◊`requirements.txt`中固定 library 版本──写一个预处理回归测试,结 20 个例句的预期代码化──每次升级都运行它──

**Training / inference mismatch。**訓練時使用激進前処理 (en bas de lettre 停止字母除去、stemming),部署時却原始用户输入,然后看性能崩掉──这是最常见的生产NLP failure──如果訓練时做前处理,则输法 时必须运行完全相同的函数──把前处理 作为函数随模型包发布,而不是作为笔记本电脑细胞 让服务团队重写──

## La faire partir

Un prompt réutilisable, aide l'ingénieur à choisir la stratégie de pré-traitement dans le cas où il ne lit pas le matériel.

保存为 `outputs/prompt-preprocessing-advisor.md`- Le numéro de la liste:

```markdown
---
name: preprocessing-advisor
description: Recommends a tokenization, stemming, and lemmatization setup for an NLP task.
phase: 5
lesson: 01
---

You advise on classical NLP preprocessing. Given a task description, you output:

1. Tokenization choice (regex, NLTK word_tokenize, spaCy, or transformer tokenizer). Explain why.
2. Whether to stem, lemmatize, both, or neither. Explain why.
3. Specific library calls. Name the functions. Quote the POS-tag translation if NLTK is involved.
4. One failure mode the user should test for.

Refuse to recommend stemming for user-visible text. Refuse to recommend lemmatization without POS tags. Flag non-English input as needing a different pipeline.
```

## Exercices

1. **Easy.**扩展 `tokenize`, faire les URL 保持为单个代币──测试:`tokenize("Visit https://example.com today.")`Il devrait générer un URL Token.
2. **Medium.**实现 Porter step 1b. Si un mot contient un mot`ed`Ou `ing`结尾,移除它──处理双辅音规则(`hopping -> hop`- Je ne suis pas ...`hopp`)。
3. **Hard.**Construire un lemmatizer en utilisant WordNet  comme table de recherche, mais lorsque WordNet  n'a pas de répertoire  fallback à votre Porter voters ⋅ en corpus de balisés 上衡量它对平面 WordNet 和平面 Porter 的准确率──

## Les termes clés

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Token | 一个词 | 模型消耗的任何单位。可以是 word、subword、character 或 byte。 |
| Stem | 词根 | 基于规则的后缀剥离结果。不一定是真实单词。 |
| Lemma | 词典形式 | 你会去查词典的形式。需要语法上下文才能正确计算。 |
| POS tag | Part of speech | 像 NOUN、VERB、ADJ 这样的类别。准确 lemmatization 需要它。 |
| Morphology | 词形规则 | 词如何基于 tense、number、case 改变形式。Lemmatization 依赖它。 |

## Pour en savoir plus

- [Porter, M. F. (1980). An algorithm for suffix stripping](https://tartarus.org/martin/PorterStemmer/def.txt) Originiel, 5 pages, jusqu'à présent encore la plus claire explication.
- [spaCy 101 — linguistic features](https://spacy.io/usage/linguistic-features)  如何接线── 如何接线──
- [NLTK book, chapter 3](https://www.nltk.org/book/ch03.html) Vous ne vous êtes pas encore souvenu de la tokenization 边界情况──
