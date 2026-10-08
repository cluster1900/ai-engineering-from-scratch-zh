# BERT  Modélisation du langage masqué

> GPT 预测下一个词――BERT 预测缺失的词――只差一句话,却带来了半十年的各种嵌入式形――

**类型:**Construction
**语言:**Python
**先修:**Phase 7 · 05 (transformateur complet), phase 5 · 02 (文本表示)
**时间:**- 45 minutes

##  problématique

En 2018, chaque tâche de PNL  analyse émotionnelle  NER、QA、entailment tous seront à partir de la formation de leur propre modèle sur leurs propres données de marque  En ce temps-là, il n'y avait pas encore de réglage pré-entraîné  compréhension de l'anglais point de contrôle  ELMo (2018)  prouve qu'il est possible d'utiliser des embedding contextuels bidirectionnels LSTM pré-train; il est utile, mais la capacité de généralisation n'est pas suffisante 

BERT (Devlin et coll. 2018) a posé un problème: si nous prenons un encodeur Transformer, l'entraînons sur chaque phrase sur Internet, et le forçons à le faire en fonction des deux côtés, comment ?

Le résultat est: en 18 mois, BERT et ses variants (RoBERTA, ALBERT, ELECTRA) ont dominé le classement des PNL à l'époque.

Jusqu'en 2026, le modèle de récupération et de récupération est toujours un outil de classification et de structuration. Chaque jeton fonctionne à une vitesse supérieure à celle du décodeur.

## 核心概念

![Masked language modeling: pick tokens, mask them, predict originals](../assets/bert-mlm.svg)

### 訓練信号

Je suis un homme.`the quick brown fox jumps over the lazy dog`Il y a une autre.

Les démarches de la marque

```
input:  the [MASK] brown fox jumps [MASK] the lazy dog
target: the  quick brown fox jumps  over  the lazy dog
```

訓練模型在被面膜的位置预测原始 Token──因为编码是双向的,所以在位置 1 预测 `[MASK]`时, peut utiliser position 2+ 的 `brown fox jumps`C'est exactement ce que le GPT ne fait pas.

### Règles du secteur de la pêche

Dans les 15% des jetons choisis:

- 80% sont remplacés`[MASK]`Il y a une autre.
- 10% sont échangés pour des jetons.
- 10% 保持不变──

Pourquoi pas toujours ?`[MASK]`Pourquoi ?`[MASK]`Il n'y aura jamais de problème. Si le modèle d'entraînement est à 100% en position masquée, on s'attend à ce qu'il soit en position masquée.`[MASK]`, il y aura une répartition de décalage entre la pré-entraînement et l'ajustement de la mise en forme.

### Prédiction de la phrase suivante (NSP) et pourquoi elle a été retirée

Le premier BERT a également entraîné le NSP: donner deux phrases A et B, prédiction B est-il suivi dans le fond de A ? RoBERTa (2019) a fait une expérience de dissipation à ce sujet, prouvant que le NSP a un effet négatif.

### 2026: ModernBERT

Le projet ModernBERT de 2024 a été reconstruit en utilisant les éléments de base de 2026:

| Component | Original BERT (2018) | ModernBERT (2024) |
|-----------|----------------------|-------------------|
| Positional | Learned absolute | RoPE |
| Activation | GELU | GeGLU |
| Normalization | LayerNorm | Pre-norm RMSNorm |
| Attention | Full dense | Alternating local (128) + global |
| Context length | 512 | 8192 |
| Tokenizer | WordPiece | BPE |

En plus de la stack de 2018, elle prend en charge Flash-Attention.

### 2026 année encore choisir des utilisateurs de codeur

| Task | 为什么 encoder 胜过 decoder |
|------|------------------------------|
| Retrieval / semantic search embeddings | Bidirectional context = 每个 Token 更好的 Embedding 质量 |
| Classification (sentiment, intent, toxicity) | 一次 forward pass；没有生成开销 |
| NER / token labeling | 逐位置输出，天然 bidirectional |
| Zero-shot entailment (NLI) | encoder 顶部的 classifier head |
| Reranker for RAG | Cross-encoder scoring，比 LLM rerankers 快 10x |


```figure
transformer-residual
```

## - Je le construis.

### 步骤 1: masquer la logique

Je vous en prie .`code/main.py`◊ fonction `create_mlm_batch`接收一个代币ID 列表、语音大小和面具概率──返回输入IDs(已应用面具) 和标签((只在面具位置有值,其他位置为 -100这是PyTorch的无视指数 约定) 

```python
def create_mlm_batch(tokens, vocab_size, mask_prob=0.15, rng=None):
    input_ids = list(tokens)
    labels = [-100] * len(tokens)
    for i, t in enumerate(tokens):
        if rng.random() < mask_prob:
            labels[i] = t
            r = rng.random()
            if r < 0.8:
                input_ids[i] = MASK_ID
            elif r < 0.9:
                input_ids[i] = rng.randrange(vocab_size)
            # else: keep original
    return input_ids, labels
```

### Étape 2: Dans un corpus de micro-type

En plus de 20 mots, 200 phrases, un codeur de 2 couches + tête MLM.

### 步骤 3: Comparer le type de masque

展示三路规则                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `[MASK]`Dans certains cas, il est encore possible de prévoir les deux types de symboles, car les deux types de symboles ont été observés dans l'entraînement.

### 步骤 4: tête de réglage

Dans un ensemble de données de sentiments de jouets, utilisez la tête de classification pour remplacer la tête de MLM.

## Utilisez-le

```python
from transformers import AutoModel, AutoTokenizer

tok = AutoTokenizer.from_pretrained("answerdotai/ModernBERT-base")
model = AutoModel.from_pretrained("answerdotai/ModernBERT-base")

text = "Attention is all you need."
inputs = tok(text, return_tensors="pt")
out = model(**inputs).last_hidden_state   # (1, N, 768)
```

**Embedding models 是 fine-tuned BERT。** `sentence-transformers`Le centre `all-MiniLM-L6-v2`Ce modèle est utilisé pour l'entraînement de la perte de contraste.

**Cross-encoder rerankers 也是 fine-tuned BERT。**Dans le`[CLS] query [SEP] doc [SEP]`上做 paire-classification──query 和 doc 之间的 attention bidirectionnelle,正是 le croisement d'encodeur par rapport au bi-encodeur 具有质量优势的原因──

**2026 年什么时候不该选 BERT。**任何生成式任务──编码器 没有合理方式 autoregressively 生成 Token──另外: n'importe quel paramètre 1B 以下、其中, un petit décodeur 能以更高灵活性达到相同质量的任务 (Phi-3-Mini, Qwen2-1.5B)──

## Je le livre.

Je vous en prie .`outputs/skill-bert-finetuner.md`◊ cette compétence sera utilisée pour une nouvelle classification ou extraction  tâche définition BERT fine-tune de la portée de la réaction 选择、head 规格、数据、eval、停止条件) ◊

## 练习

1. **Easy.**运行  référencement`code/main.py`, et imprimé 10 000 Token. Le masque est distribué. Confirme que 15% ont été sélectionnés, dont 80% sont devenus`[MASK]`Il y a une autre.
2. **Medium.**实现全词掩盖: si un mot est coupé par Tokenizer 切成字段,则一起掩盖所有字段,或全部不掩盖――衡量这是否能在500-sentence corpus 上提升MLM精度――
3. **Hard.**Dans un ensemble de données publiques de 10 000 phrases, entraînez un petit BERT (2 couches, d=64) pour la mise au point fine du sentiment SST-2.`[CLS]`Les paramètres correspondants à la base de codeur seulement

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| MLM | "Masked language modeling" | 训练信号：随机将 15% 的 Token 替换为 `[MASK]`，预测原始 Token。 |
| Bidirectional | "双向看" | Encoder Attention 没有 causal mask——每个位置都能看到其他所有位置。 |
| `[CLS]` | "The pooler token" | 一个添加到每个 sequence 开头的特殊 Token；它的最终 Embedding 用作句子级表示。 |
| `[SEP]` | "Segment separator" | 分隔成对的 sequence（例如 query/doc、sentence A/B）。 |
| NSP | "Next sentence prediction" | BERT 的第二个 pretraining 任务；在 RoBERTa 中被证明无用，2019 年后被移除。 |
| Fine-tuning | "适配一个任务" | 基本保持 encoder 冻结；在其上训练一个小 head 来完成下游任务。 |
| Cross-encoder | "一个 reranker" | 一个同时接收 query 和 doc 作为输入，并输出相关性分数的 BERT。 |
| ModernBERT | "2024 refresh" | 用 RoPE、RMSNorm、GeGLU、交替 local/global attention、8K context 重建的 encoder。 |

## 延伸阅读

- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805) 原始论文──
- [Liu et al. (2019). RoBERTa: A Robustly Optimized BERT Pretraining Approach](https://arxiv.org/abs/1907.11692) 如何正确训练 BERT; déplacement du NSP。
- [Clark et al. (2020). ELECTRA: Pre-training Text Encoders as Discriminators Rather Than Generators](https://arxiv.org/abs/2003.10555)Dans le même calcul, la détection de jetons remplacés a surpassé MLM.
- [Warner et al. (2024). Smarter, Better, Faster, Longer: A Modern Bidirectional Encoder](https://arxiv.org/abs/2412.13663) ModernBERT 论文──
- [HuggingFace `modeling_bert.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/bert/modeling_bert.py) 标准 encoder 参考。
