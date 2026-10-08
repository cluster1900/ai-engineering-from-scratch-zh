# Sequence à séquence 模型

> Deux RNN 假装自己是翻译器── elles se heurtent à un goulet d'étranglement, c'est la raison pour laquelle l'attention existe──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 08 (CNNs + RNNs for Text), Phase 3 · 11 (PyTorch Intro)
**Time:** ~75 minutes

##  problématique
Classification va changer la séquence 映射到单个标签──Translation va changer la séquence 映射到另一个变长序──输入和输出位于 différents vocabulaires,可能是不同语言,并且不保证长度一致──

Seq2seq 架构(Sutskever, Vinyals, Le, 2014) avec une recette simple et conçue  résolve ce problème。 deux RNN。 une phrase source, et génère un vecteur de taille fixe ⋅ un autre lecture de ce vecteur,并逐 Token 生成目标 sentence──就是你在课08 写的相同套代码,只是以不同方式粘在一起──

Ceci vaut la peine d'apprendre pour deux raisons. Premièrement, le gouffre de bouteille de contexte-vecteur est le défaut le plus important de la PNL. Il explique l'attention et les transformateurs sont bons pour tout. Deuxièmement, la recette de formation (le forcement des enseignants, le prélèvement de échantillons planifié, la recherche de faisceaux d'inference) est toujours applicable à tous les systèmes de production modernes de LLM.

## 概念
**Encoder.**读取 source sentence 的 RNN──它的 ultérieur état caché est **context Vector** Pour l'ensemble de l'entrée, rien ne sera perdu sauf la source.

**Decoder.**另一个用语境向量初始化 RNN──在每一步,它以前一次生成的代币 作为输入,并产生目标词汇上的分布──通过样本或 argmax 选择下一个代币──再把它回去──重复,直到产生`<EOS>`Le jeton ou atteint la longueur maximale.

**Training:**Dans chaque étape de décoder, calculer la perte d'entropie croisée,并沿序列 求和──通过两个网络做标准 backprop through time──

**Teacher forcing.**Pendant l'entraînement, le décodeur est en marche.`t`La position de l'entrée est la position`t-1`Le jeton de *ground-truth* au lieu du décodeur, se prédit soi-même une fois par jour.**exposure bias**Il y a une autre.

**The bottleneck.**Tout ce que vous avez appris sur la source doit être extrait dans le contexte Vecteur.

Attention(leçon 10) En faisant découler 查看 * chaque * encodeur est dans l'état caché, pas seulement le dernier, pour réparer ce problème―


```figure
lstm-gates
```

## - Je le construis.
### 步骤 1: un codeur

```python
import torch
import torch.nn as nn


class Encoder(nn.Module):
    def __init__(self, src_vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embed = nn.Embedding(src_vocab_size, embed_dim, padding_idx=0)
        self.gru = nn.GRU(embed_dim, hidden_dim, batch_first=True)

    def forward(self, src):
        e = self.embed(src)
        outputs, hidden = self.gru(e)
        return outputs, hidden
```

`outputs`La forme est `[batch, seq_len, hidden_dim]`Chaque entrée est dans un état caché.`hidden`La forme est `[1, batch, hidden_dim]` Ultérieur pas. Leçon 08 dit que  à la sortie faire un pool pour effectuer une classification ── ici nous conservons l'état caché final  en tant que vecteur de contexte,并忽略每一步的输出──

### 步骤 2: un décodeur

```python
class Decoder(nn.Module):
    def __init__(self, tgt_vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embed = nn.Embedding(tgt_vocab_size, embed_dim, padding_idx=0)
        self.gru = nn.GRU(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, tgt_vocab_size)

    def forward(self, token, hidden):
        e = self.embed(token)
        out, hidden = self.gru(e, hidden)
        logits = self.fc(out)
        return logits, hidden
```

Décoder Cada vez调用一步──输入:一批单个 Token 和当前隐藏状态──输出:下一个 Token 的词汇库 logits,以及更新后的隐藏状态──

### 步骤 3: cycle de formation avec l'enseignant forçant

```python
def train_batch(encoder, decoder, src, tgt, bos_id, optimizer, teacher_forcing_ratio=0.9):
    optimizer.zero_grad()
    _, hidden = encoder(src)
    batch_size, tgt_len = tgt.shape
    input_token = torch.full((batch_size, 1), bos_id, dtype=torch.long)
    loss = 0.0
    loss_fn = nn.CrossEntropyLoss(ignore_index=0)

    for t in range(tgt_len):
        logits, hidden = decoder(input_token, hidden)
        step_loss = loss_fn(logits.squeeze(1), tgt[:, t])
        loss += step_loss
        use_teacher = torch.rand(1).item() < teacher_forcing_ratio
        if use_teacher:
            input_token = tgt[:, t].unsqueeze(1)
        else:
            input_token = logits.argmax(dim=-1)

    loss.backward()
    optimizer.step()
    return loss.item() / tgt_len
```

Deux pièces qui méritent d'être nommées.`ignore_index=0`J'ai perdu le jeton de rembourrage.`teacher_forcing_ratio`C'est à chaque étape de l'utilisation de vrais jetons plutôt que de la probabilité de prédiction du modèle.

### 步骤 4: boucle d'inférence (compulsif)

```python
@torch.no_grad()
def greedy_decode(encoder, decoder, src, bos_id, eos_id, max_len=50):
    _, hidden = encoder(src)
    batch_size = src.shape[0]
    input_token = torch.full((batch_size, 1), bos_id, dtype=torch.long)
    output_ids = []
    for _ in range(max_len):
        logits, hidden = decoder(input_token, hidden)
        next_token = logits.argmax(dim=-1)
        output_ids.append(next_token)
        input_token = next_token
        if (next_token == eos_id).all():
            break
    return torch.cat(output_ids, dim=1)
```

Le décoding avide dans chaque étape choisir la probabilité la plus élevée de jetons.**Beam search**Je vais garder le haut...`k`个部分序列, et finalement choisir la séquence complète la plus élevée.

### 步骤 5: le goulet d'étranglement, démontré

Dans la tâche de copie de jouets 上训练模型: source `[a, b, c, d, e]`, cible `[a, b, c, d, e]` augmenter la longueur de la séquence  observer la précision 

```
seq_len=5   copy accuracy: 98%
seq_len=10  copy accuracy: 91%
seq_len=20  copy accuracy: 62%
seq_len=40  copy accuracy: 23%
```

单个GRU hidden state 无法无损记住 40-Token 输入──信息存在于每一个编码步骤,但解码器只看到最后一个状态──注意 直接修复了这一点──

## Utilisez-le
PyTorch 提供 `nn.Transformer`et à base`nn.LSTM`∞ Les modèles de la suite ∞`transformers`La bibliothèque fournit des modèles de codeur-décoeur complets, qui sont formés sur des milliards de tokens.

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

tok = AutoTokenizer.from_pretrained("facebook/bart-base")
model = AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-base")

src = tok("Translate this to French: Hello, how are you?", return_tensors="pt")
out = model.generate(**src, max_new_tokens=50, num_beams=4)
print(tok.decode(out[0], skip_special_tokens=True))
```

Les décodeurs modernes ont remplacé RNN à des transformateurs.

### 什么时候仍然选择 RNN-basé seq2seq

Pour les nouveaux projets, il est presque impossible de le faire.

- Translation en streaming, besoin d'avoir une limite de stockage une fois consommer un Token d'entrée.
- Génération de texte sur appareil, coût de stockage du transformateur est trop élevé.
- Pour comprendre le gouffre de l'encodeur-décodeur, comprenez les transformateurs.

### Préjugés d'exposition  et méthodes de réduction

- **Scheduled sampling.** pendant l'entraînement, le taux de contrainte de l'enseignant annal, 让模型学会从自己的错误中恢复──
- **Minimum risk training.**Utilisez le score BLEU au lieu de l'entropie croisée au niveau des jetons pour vous entraîner.
- **Reinforcement Learning fine-tuning.**Utilisation de la génératrice de séquences de récompense

Cette méthode est encore applicable à la production basée sur des transformateurs.

## Je le livre.
保存为 `outputs/prompt-seq2seq-design.md`- Le numéro de la liste:

```markdown
---
name: seq2seq-design
description: 为给定任务设计 sequence-to-sequence pipeline。
phase: 5
lesson: 09
---

给定任务（translation、summarization、paraphrase、question rewrite），输出：

1. 架构。默认使用 pretrained transformer encoder-decoder（BART、T5、mBART、NLLB）。RNN-based seq2seq 只适用于特定约束。
2. Starting checkpoint。命名它（`facebook/bart-base`、`google/flan-t5-base`、`facebook/nllb-200-distilled-600M`）。让 checkpoint 匹配任务和语言覆盖范围。
3. Decoding strategy。Greedy 用于 deterministic output，beam search（width 4-5）用于质量，带 temperature 的 sampling 用于多样性。用一句话说明理由。
4. 发布前要验证的一个 failure mode。Exposure bias 会表现为较长输出上的 generation drift；抽样 20 个位于 90th-percentile length 的输出并目检。

对于少于一百万 parallel examples 的情况，拒绝推荐从头训练 seq2seq。将任何面向用户内容却使用 greedy decoding 的 pipeline 标记为 fragile（greedy 会重复并陷入循环）。
```

## 练习
1. **Easy.**实现 jouet copie tâche──在 目标等于 source de saisie-sortie paires 上训练 GRU seq2seq──测量长度 5、10、20 的精度──复现瓶──
2. **Medium.**添加束宽度 3 的束搜索解码──在小型平行体上对比贪度测量 BLEU──记录束搜索 胜出的地方(通常是最后几个代币) 以及它没有差异的地方──
3. **Hard.**Dans 10K-paire de paraphrase ensemble de données`facebook/bart-base`◊ Comparer la sortie de faisceau 4 du modèle finement ajusté avec la sortie de base du modèle basé dans les entrées en suspens.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Encoder | Input RNN | 读取 source。产生 per-step hidden states 和最终 context Vector。 |
| Decoder | Output RNN | 从 context Vector 初始化。一次生成一个 target Token。 |
| Context vector | 摘要 | 最终 encoder hidden state。固定大小。Attention 要解决的 bottleneck。 |
| Teacher forcing | 使用真实 Token | 训练时喂入 ground-truth previous Token。稳定学习。 |
| Exposure bias | Train/test gap | 在真实 Token 上训练的模型，从未练习过从自身错误中恢复。 |
| Beam search | 更好的 decoding | 每一步保留 top-k partial sequences，而不是 greedy 地直接承诺。 |

## 延伸阅读
- [Sutskever, Vinyals, Le (2014). Sequence to Sequence Learning with Neural Networks](https://arxiv.org/abs/1409.3215) Origini papier de deuxième cycle 
- [Cho et al. (2014). Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation](https://arxiv.org/abs/1406.1078)  introduit GRU et encodeur-décodeur encadré
- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) Attention paper──读完本课后立刻阅读──
- [PyTorch NLP from Scratch tutorial](https://pytorch.org/tutorials/intermediate/seq2seq_translation_tutorial.html) 可构建的 seq2seq + Attention 代码──
