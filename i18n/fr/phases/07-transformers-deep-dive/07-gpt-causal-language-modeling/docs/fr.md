# GPT  Modélisation du langage de causalité

> BERT 能看到两侧──GPT 只有能看到过去──三角面膜是现代AI中影响最深远的一行代码──

**Type:** Build
**Languages:** Python
**先修要求:**La phase 7 · 02 (auto-attention), la phase 7 · 05 (transformateur complet), la phase 7 · 06 (BERT)
**Time:** ~75 分钟

##  problématique

Modèle de langue 回答一个问题:给定前 `t-1`Les jetons, les jetons.`t`Avec cette formation de signal, c'est-à-dire la prédiction du prochain jeton, vous obtenez un modèle qui peut générer un jeton à la fois ‒ générer n'importe quel texte ‒.

Pour effectuer un entraînement de bout en bout sur toute la séquence, vous devez laisser la prédiction de chaque position dépendre uniquement de la position précédente.

Le masque de causalité est fait pour ça.`-inf`√ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √

GPT-1 (2018), GPT-2 (2019), GPT-3 (2020), GPT-4 (2023), GPT-5 (2024), Claude, Llama, Qwen, Mistral, DeepSeek, Kimi                                                                                                                                                                                                                                         

## 概念

![Causal mask creates a triangular attention matrix](../assets/causal-attention.svg)

### masque

给定长度为 `N`La séquence, construire un`N × N`matrice:

```
M[i, j] = 0       if j <= i
M[i, j] = -inf    if j > i
```

Dans le softmax, avant,`M`À la première note d'attention.`exp(-inf) = 0`, donc le poids de contribution de la position du masque est de zéro. Chaque ligne de la matrice d'attention est simplement une répartition des probabilités de la position précédente.

实现成本: une fois `torch.tril()`调用──计算时间:纳秒级── sur l'impact de tout le domaine:一切──

### Il n'a pas fait d'entraînement, il a fait des recommandations.

训练: à l'ensemble `(N, d_model)`Une séquence effectue une fois de passage à l'avant, calculer N 个 entropie croisée pertes ((( chaque position),求和,backprop。 le long de la séquence并行── voilà la raison pour laquelle GPT 训练能够扩展: vous pouvez traiter 1M de jetons dans un seul GPU passer en série──

Tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu sais, tu es, tu sais, tu es, tu sais, tu es, tu sais, tu es, tu sais, tu es, tu es, tu sais, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es, tu es.`[t1, t2, t3]`Je suis là .`t4` Entrée`[t1, t2, t3, t4]`Je suis là .`t5` Entrée`[t1, t2, t3, t4, t5]`Je suis là .`t6` Le cache KV  Leçon 12) 保存 `t1…tn`Les états cachés, de sorte que vous n'avez pas besoin de les recalculer à chaque étape. Mais la profondeur de la chaîne de calcul = la longueur de sortie.

### Perte  changement par changement

给定 tokens `[t1, t2, t3, t4]`- Le numéro de la liste:

- Enregistrement: `[t1, t2, t3]`
- Objectifs: `[t2, t3, t4]`

Pour chaque position`i`, calcul `-log P(target_i | inputs[:i+1])`△求和─── c'est la croisée entropie de toute la séquence.

Vous avez entendu dire que chaque transformateur LM utilise cette perte  entraînement  Pré-entraînement  Tonnage  SFT  perte 

### Stratégies de décoding

Après l'entraînement, le choix des échantillons est plus important que ce que les gens imaginent.

| Method | What it does | When to use |
|--------|--------------|-------------|
| Greedy | 每一步取 Argmax | 确定性任务、code completion |
| Temperature | 将 logits 除以 T，然后 sample | 创造性任务，T 越高多样性越强 |
| Top-k | 只从 top-k tokens 中 sample | 消除低概率长尾 |
| Top-p (nucleus) | 从累计概率 ≥ p 的最小集合中 sample | 2020+ 默认选择；会适应分布形状 |
| Min-p | 保留 `p > min_p * max_p` 的 tokens | 2024+；比 top-p 更擅长拒绝长尾 |
| Speculative decoding | draft model 提出 N 个 tokens，big model 验证 | 在质量相同的情况下减少 2–3× 延迟 |

En 2026, pour les modèles à poids ouvert, min-p + température 0,7 est une valeur de référence raisonnable. Le décoding spéculatif est la configuration fondamentale de toute pile d'inférence de production.

### 让 GPT recette  起作用的因素

1. **Decoder-only.**Pas de codeur. Attention + FFN passe.
2. **Scaling.**124M → 1.5B → 175B → trillions。 Les lois de l'échelle de Chinchilla(L'enseignement 13) vous dire comment distribuer l'informatique。
3. **In-context learning.**Il est possible de suivre quelques exemples.
4. **RLHF.**基于人类偏好后培训 把原始预训文模型转化为聊天助手──
5. **Pre-norm + RoPE + SwiGLU.**支大规模稳定训练──

Depuis le GPT-2, la structure centrale n'a pas beaucoup changé.


```figure
causal-mask
```


```figure
mask-derivation
```

## - Je le construis.

### 步骤 1: masque de causalité

Je vous en prie .`code/main.py`Il y a une autre chose.

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

Dans le softmax, il faut le mettre sur les notes d'attention.

### 步骤 2: Un modèle GPT à 2 couches

堆叠两个解码块(masqué auto-attention + FFN, sans attention croisée)。添加代币嵌入、位置编码 和无嵌入(与代币嵌入矩阵 绑定,这是自 GPT-2 以来来的标准技巧)。

### 步骤 3: prédiction du prochain jeton, de bout en bout

Dans un vocabulaire de jouets à 20 jetons, chaque position produit des logites.

### 步骤 4: prélèvement d'échantillons

实现 avide, température, top-k, top-p, min-p, ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒                                                                                                                                                      

## Utilisez-le

PyTorch, 2026

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")
tok = AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")

prompt = "Attention is all you need because"
inputs = tok(prompt, return_tensors="pt")
out = model.generate(
    **inputs,
    max_new_tokens=64,
    temperature=0.7,
    top_p=0.9,
    do_sample=True,
)
print(tok.decode(out[0]))
```

Dans le fond,`generate()`运行前行,取出最后位置 logits,sample 下一个代币,追加它,然后重复──每个生产级LLM inference stack(vLLM, TensorRT-LLM, llama.cpp, Ollama, MLX)都用重度优化实现同一个循环 批量预填、连续批量、KV cache paging、投机解码──

**GPT vs BERT，各用一句话：**GPT 预测 `P(x_t | x_{<t})`│BERT 预测 │`P(x_masked | x_unmasked)`◊perte décide si le modèle peut être généré

## Je le livre.

Je vous en prie .`outputs/skill-sampling-tuner.md`◊ Cette compétence sera utilisée pour la nouvelle génération de tâches                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

## 练习

1. **Easy.**运行  référencement`code/main.py`, validation softmax 后的因果注意矩阵是下三角的──抽查:第3 行应该只在第03 列有权重──
2. **Medium.**实现宽度为 4 的梁搜索──在 10 个短提示 上比较梁-4 与贪的困惑──beam 总是会赢吗?
3. **Hard.**实现 décodage spéculatif: utiliser un modèle à 2 couches de type micro 作为草稿, utiliser un modèle à 6 couches 作为验证器──测量 100 个长度为 64 的完成 上的壁表速度──确认输出与验证器的贪输出匹配──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Causal mask | “三角形” | 加到 attention scores 上的上三角 `-inf` matrix，使位置 `i` 只能看到位置 `≤ i`。 |
| Next-token prediction | “loss” | 模型在每个位置上的分布与真实下一个 token 之间的 cross-entropy。 |
| Autoregressive | “一次生成一个” | 将输出反馈为输入；并行性只存在于训练阶段，不存在于生成阶段。 |
| Logits | “pre-softmax scores” | softmax 之前 LM head 的原始输出；sampling 就发生在这些值上。 |
| Temperature | “创造力旋钮” | 将 logits 除以 T；T→0 = greedy，T→∞ = uniform。 |
| Top-p | “Nucleus sampling” | 将分布截断为累计和 ≥p 的最小集合；从剩余部分 sample。 |
| Min-p | “比 top-p 更好” | 保留满足 `p ≥ min_p × max_p` 的 tokens；会根据分布尖锐程度调整 cutoff。 |
| Speculative decoding | “draft + verify” | 便宜模型提出 N 个 tokens；大模型并行验证。 |
| Teacher forcing | “训练技巧” | 训练时输入真实的前一个 token，而不是模型的预测。每个 seq2seq LM 的标准做法。 |

## 延伸阅读

- [Radford et al. (2018). Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf) GPT-1。
- [Radford et al. (2019). Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf) GPT-2。
- [Brown et al. (2020). Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165) GPT-3 和 apprentissage dans le contexte
- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) décoding spécifique 论文。
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) 标准 causalisé-LM 参考代码。
