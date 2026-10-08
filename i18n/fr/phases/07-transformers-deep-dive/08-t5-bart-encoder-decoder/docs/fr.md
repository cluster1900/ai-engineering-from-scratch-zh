# T5, BART  Modèles de décodeur-encodeur

> Encore une fois, le codeur est responsable de la compréhension.

**Type:** Learn
**Languages:** Python
**先修要求:**La phase 7 · 05 (transformateur complet), la phase 7 · 06 (BERT), la phase 7 · 07 (GPT)
**Time:** ~45 minutes

##  problématique

Les travaux de décodeur-seulement GPT et de décodeur-seulement BERT ont été élaborés en 2017 pour un objectif différent.

- Traduction: anglais → français.
- Résumé: 5 000 Tokens 文章 → 200 Tokens 摘要。
- Reconnaissance du langage: 音频 Token → 文本 Token。
- 结构化抽取: 散文 → JSON。

Pour ces tâches, le décodeur-encodeur est la forme la plus appropriée. Le décodeur produit des résultats, et à chaque étape, il effectue des émissions de données.

两篇论文 définit la pratique moderne:

1. **T5**(Raffel et coll. 2019). " Transformateur de transfert texte-texte. " va chaque tâche de la PNL être réécrite en texte-en-tête, texte-out.
2. **BART**"Transformateur bidirectionnel et auto-régressif". 去噪音 autoencoder:以多种方式破坏输入(shuffle、masque、delete、rotate),让解码重建原始内容──

En 2026, le format encodeur-décodeur est toujours présent dans la structure d'entrée où il est important:

- Sous-pard (parler → texte).
- Google a écrit:
- Certains ont un contexte précis et éditer 结构的代码-completation / réparation 模型。
- Il est utilisé pour le raisonnement structuré du Flan-T5 et de ses variants.

Le décodeur-seul a gagné la lumière, mais le décodeur-encodeur n'a pas disparu.

## 概念

![Encoder-decoder with cross-attention](../assets/encoder-decoder.svg)

### Le cycle

```
source tokens ─▶ encoder ─▶ (N_src, d_model)  ──┐
                                                 │
target tokens ─▶ decoder block                   │
                 ├─▶ masked self-attention       │
                 ├─▶ cross-attention ◀───────────┘
                 └─▶ FFN
                ↓
              next-token logits
```

Le codeur ne fonctionne qu'une seule fois pour chaque entrée. Le codeur fonctionne de manière autorégressive, mais chaque étape est croisée à un même codeur.

### T5 预训练  étendue de la corruption

随机选择输入中的 span(平均长度 3 个 Token,总计 15%) ―― utiliser un seul sentinel 替换每个 span:`<extra_id_0>`- Je suis là.`<extra_id_1>`Et puis, le décodeur ne fait que sortir la durée de la destruction, et il est chargé de la résolution de la sentinelle.

```
source: The quick <extra_id_0> fox jumps <extra_id_1> dog
target: <extra_id_0> brown <extra_id_1> over the lazy
```

Par rapport à la prédiction de toute la séquence, c'est un signal plus abordable. Dans l'ablation du thèse T5, il est compétitif avec MLM (BERT) et préfixe-LM (UniLM).

### BART 预训练  dénonciation de bruit multiples

BART 尝试了五种噪音功能:

1. Le masquage des jetons.
2. Suppression des jetons.
3. Le texte est rempli de masques, décodeurs, et le contenu est en grande partie intégré.
4. Permutation de la phrase.
5. La rotation des documents.

Le composé de l'infiltration de texte + de la permution de phrases a produit le meilleur résultat. Le décodeur a toujours reconstruit le contenu original.

### 推理

Avec GPT, la génération autorégressive, la génération avide, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, la génération de faisceaux, est la génération de plus petite.

### 2026 années de choix

| Task | Encoder-decoder? | Why |
|------|------------------|-----|
| Translation | 是，通常如此 | 明确的源序列；固定的输出分布；beam search 有效 |
| Speech-to-text | 是 (Whisper) | 输入 modality 与输出不同；encoder 塑造音频特征 |
| Chat / reasoning | 否，decoder-only | 没有持久的“input”——对话本身就是序列 |
| Code completion | 通常否 | decoder-only 搭配长上下文更强；像 Qwen 2.5 Coder 这样的代码模型是 decoder-only |
| Summarization | 两者皆可 | BART、PEGASUS 超过了早期 decoder-only baseline；现代 decoder-only LLMs 已经能与它们匹配 |
| Structured extraction | 两者皆可 | T5 很干净，因为“text → text”可以吸收任何输出格式 |

Depuis environ 2022 les tendances sont: le décodeur-seul a pris le contrôle de la tâche principale du décodeur-encodeur, car (a) les LLM décodeur-seul ajustés aux instructions peuvent être généralisés à n'importe quelle tâche, (b) une seule architecture est plus facile à étendre que deux architectures, (c) RLHF 假设使用 decoder──encodeur-decodeur 仍然保留在输入方式、不同(speechimages)


```figure
encoder-decoder
```

## - Je le construis.

Je vous en prie .`code/main.py` Nous avons créé un corpus de jouets pour réaliser la corruption de la durée de T5 风格 c'est la partie la plus utile de ce cours, car il apparaît dans presque tous les équipements de décodeur-encodeur 预训配配配

### 步骤 1: Corruption de la durée

```python
def corrupt_spans(tokens, mask_rate=0.15, mean_span=3.0, rng=None):
    """Pick spans summing to ~mask_rate of tokens. Return (corrupted_input, target)."""
    n = len(tokens)
    n_mask = max(1, int(n * mask_rate))
    n_spans = max(1, int(round(n_mask / mean_span)))
    ...
```

cible 格式遵循 T5 约定:`<sent0> span0 <sent1> span1 ...` entrée corrompue 会把未改变的代码与跨度位置上的哨兵代码 交错排列──

### 步骤 2: vérifier le retour

给定腐败输入 和目标,重建原始句子──如果你的腐败是可逆的,那么前进通过就是良定义的──这是一个智力检查真实训练从不这样做,但这个测试成本很低,并且能够捕捉到账时间中的一次的错误──

### 步骤 3: bruit de la partie

五个函数:`token_mask`- Je suis là.`token_delete`- Je suis là.`text_infill`- Je suis là.`sentence_permute`- Je suis là.`document_rotate`◊ 组合 de ces deux éléments et démontrer les résultats

## Utilisez-le

Coupe de coupe:

```python
from transformers import T5ForConditionalGeneration, T5Tokenizer
tok = T5Tokenizer.from_pretrained("google/flan-t5-base")
model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-base")

inputs = tok("translate English to French: Attention is all you need.", return_tensors="pt")
out = model.generate(**inputs, max_new_tokens=32)
print(tok.decode(out[0], skip_special_tokens=True))
```

T5 技巧: tâche nom entra dans le texte de saisie. Le même modèle peut traiter des dizaines de tâches, car chaque tâche est texte-en-tête-out.

## Je le livre.

Je vous en prie .`outputs/skill-seq2seq-picker.md` Cette compétence sera basée sur l'entrée-sortie 结构、延迟和质量目标, pour faire le choix entre une nouvelle tâche en encodeur-décodeur et décodeur-seulement 

## 练习

1. **Easy.**运行  référencement`code/main.py`, contre une corruption de la durée d'application de 30 tokens, les tokens source non sentinels seront testés avec des intervalles cibles décodés 拼接后可以复现原始句子。
2. **Medium.** Réalisation de BART `text_infill`Le bruit:`<mask>`Les symboles sont modifiés à chaque fois que le décodeur détermine la durée et le contenu.
3. **Hard.**Dans un très petit corpus anglais à la langue latine`flan-t5-small` dans un ensemble de 50 paires de résistance, mise en valeur BLEU.`Llama-3.2-1B`Les résultats sont comparés.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Encoder-decoder | “Seq2seq transformer” | 两个 stack：用于输入的 bidirectional encoder，以及带 cross-attention、用于输出的 causal decoder。 |
| Cross-attention | “源内容与目标内容对话的地方” | decoder 的 Q × encoder 的 K/V。这是 encoder 信息进入 decoder 的唯一位置。 |
| Span corruption | “T5 的预训练技巧” | 用 sentinel Token 替换随机 span；decoder 输出这些 span。 |
| Denoising objective | “BART 的游戏” | 对输入应用 noise function，训练 decoder 重建 clean sequence。 |
| Sentinel token | “`<extra_id_N>` 占位符” | 特殊 Token，用于在 source 中标记被破坏的 span，并在 target 中重新标记它们。 |
| Flan | “Instruction-tuned T5” | 在超过 1,800 个任务上 fine-tuned 的 T5；让 encoder-decoder 在 instruction-following 上具备竞争力。 |
| Beam search | “Decoding strategy” | 在每一步保留 top-k 个 partial sequence；是翻译/摘要的标准做法。 |
| Teacher forcing | “Training-time input” | 训练期间，把真实的前一个输出 Token 喂给 decoder，而不是采样出来的 Token。 |

## 延伸阅读

- [Raffel et al. (2019). Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer](https://arxiv.org/abs/1910.10683) T5──
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training for Natural Language Generation, Translation, and Comprehension](https://arxiv.org/abs/1910.13461)- Je suis désolé.
- [Chung et al. (2022). Scaling Instruction-Finetuned Language Models](https://arxiv.org/abs/2210.11416) Flan-T5──
- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) Whisper,2026 année de codeur-décodeur canonique。
- [HuggingFace `modeling_t5.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/t5/modeling_t5.py) 参考实现。
