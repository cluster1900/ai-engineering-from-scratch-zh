# Modélisation des récompenses et RLHF

> Les gens ne peuvent pas faire une bonne réponse assistante récompense de récompense à la main, mais ils peuvent comparer deux réponses, et choisir une meilleure.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 05 (Sentiment), Phase 9 · 08 (PPO)
**Time:** ~45 分钟

##  problématique

Vous avez déjà utilisé l'objectif de prédiction des prochains signes  entraîné un modèle de langue  il peut écrire un langage correct  il va également mentir , et il refuse de refuser  vous ne pouvez pas passer par plus de prétrain 修复  le texte Web est un problème, pas une solution 

Vous voulez une * étiquette de récompense*, indiquant pour une instruction X, la réponse A est supérieure à la réponse B.

RLHF(Christiano et coll. 2017; Ouyang et coll. 2022) Place les préférences 转换成奖励模型, puis utilise PPO 针对该奖励 优化 LM。分三步:SFT → RM → PPO。这是 20232025年交付 ChatGPT、Claude、Gemini以及其他所有所有的配配方-LLM。

D'ici 2026, le PPO est remplacé par le DPO (Phase 10 · 08) parce qu'il est plus économique, et que l'alignement est presque aussi bon. Mais le modèle de récompense reste basé sur chaque échantillon Best-of-N, chaque RL-from-verifiable-rewards pipeline, ainsi que sur chaque modèle de raisonnement de récompense de processus utilisés.

## 概念

![Three-stage RLHF: SFT, RM training on pairwise prefs, PPO with KL penalty](../assets/rlhf.svg)

**Stage 1：Supervised Fine-Tuning（SFT）。**De la base de modèle prétrainée 开始──在目标行为的人类编写示范 上细调(réponse suivant les instructions、responsions utiles, etc.)──结果是一个`π_SFT`Le modèle est orienté vers le bon comportement, mais il reste un espace d'action illimité.

**Stage 2：Reward Model training。**

- 收集对提示 `x``(y_+, y_-)`, y_+ 优于 y_-。
-  formation modèle de récompense `R_φ(x, y)`Laissez-moi le faire .`y_+`Le plus grand nombre de partisans.
- Perte:**Bradley-Terry pairwise logistic**- Le numéro de la liste:

  `L(φ) = -E[ log σ(R_φ(x, y_+) - R_φ(x, y_-)) ]`

  σ 是 sigmoid──reward 的差值隐含偏好 的 log-odds──BT depuis 1952 Bradley-Terry) depuis toujours est le méthode standard, également le principal choix dans le RLHF moderne──

- `R_φ`Généralement, il est initié à partir du modèle SFT et ajouté à la tête de la taille de la taille de la taille de la taille de la taille de la taille de la tête de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille.

**Stage 3：带 KL penalty、针对 RM 的 PPO。**

- De `π_SFT`Politique de formation initiale `π_θ`                                                                                                                                                                                                                                                              `π_ref = π_SFT`Il y a une autre.
- Réponse `y`La récompense est:

  `r_total(x, y) = R_φ(x, y) - β · KL(π_θ(·|x) || π_ref(·|x))`

  Pénalité KL 防止 `π_θ`任意漂离 `π_SFT` C'est un régulateur, pas une région de confiance.`β`Il est normal.`0.01`- Je suis là.`0.05`Il y a une autre.
- Utilisez cette récompense 运行 PPO(Léction 08)。Avantages dans la trajectoire au niveau des jetons 上计算, mais RM ne donne que la réponse complète 打分。

**为什么需要 KL？**没有它,PPO 会很乐意找到奖励黑客策略  RM 只有在分发完成 上训过;;`π_θ`保持在 RM 训练过的多元体 附近──它是RLHF's single single most important rotation──

**2026 状态：**

- **DPO**(Rafailov 2023):algebra de forme fermée Place la phase 2+3 folding into a preference data  上的监督损失──没有 RM,没有 PPO──只需一小部分计算,就能在配合基准上达到相同质量──Phase 10 · 08 会讲──
- **GRPO**(DeepSeek 20242025): Les variantes du PPO, avec une base de référence relative au groupe, au lieu de critique, récompense provenant de *verifier* (code runs / math math maths answers matches), au lieu de RM.
- **Process reward models（PRMs）：**给部分解决方案 () 打分,用于RLHF 和 reasoning 的 GRPO 变体──)
- **Constitutional AI / RLAIF：**Utiliser des préférences de formation en droit alignées, plutôt que de l'utilisation de l'humanité.


```figure
reward-model
```

## - Je le construis.

Le RM est un scoreur linéaire basé sur des symboles de symboles. Il n'y a pas de vrai LLM.`code/main.py`Il y a une autre.

### Étape 1: Données de préférence synthétiques

```python
PROMPTS = ["help me", "answer me", "explain this"]
GOOD_WORDS = {"clear", "specific", "kind", "thorough"}
BAD_WORDS = {"vague", "rude", "wrong", "short"}

def make_pair(rng):
    x = rng.choice(PROMPTS)
    y_good = rng.choice(list(GOOD_WORDS)) + " " + rng.choice(list(GOOD_WORDS))
    y_bad = rng.choice(list(BAD_WORDS)) + " " + rng.choice(list(BAD_WORDS))
    return (x, y_good, y_bad)
```

Dans la vraie RLHF, cela sera remplacé par des étiquettes humaines.`(prompt, preferred_response, rejected_response)` 完全相同──

### Étape 2: Modèle de récompense Bradley-Terry

Score linéaire:`R(x, y) = w · bag(y)` entraînement pour minimiser les pertes de logs par paires:

```python
def rm_train_step(w, x, y_pos, y_neg, lr):
    r_pos = dot(w, bag(y_pos))
    r_neg = dot(w, bag(y_neg))
    p = sigmoid(r_pos - r_neg)
    for tok, cnt in bag(y_pos).items():
        w[tok] += lr * (1 - p) * cnt
    for tok, cnt in bag(y_neg).items():
        w[tok] -= lr * (1 - p) * cnt
```

Après quelques centaines de mises à jour,`w`Je vais donner des bons mots, et les mauvais mots, et les bons mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais mots, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les mauvais, et les autres, et les mauvais, et les autres, et les mauvais, et les autres, et les autres, et les autres, et les autres, et les autres, et les autres, et les autres, les autres, et les autres, et les autres, sont.

### Étape 3: Politique de type PPO en matière de RM

Notre politique de jouets va générer un jeton à partir du vocabulaire.`log π_θ(token | prompt)`, Ajouter KL-à-référence pénalité,并应用 coupé PPO substitué。

```python
def rlhf_step(theta, ref, w, prompt, rng, eps=0.2, beta=0.1, lr=0.05):
    logits_theta = policy_logits(theta, prompt)
    probs = softmax(logits_theta)
    token = sample(probs, rng)
    logits_ref = policy_logits(ref, prompt)
    probs_ref = softmax(logits_ref)
    reward = dot(w, bag([token])) - beta * kl(probs, probs_ref)
    # 在 theta 上做 ppo-style update，把 reward 当作 return
    ...
```

### Étape 4: Moniteur KL

Chaque mise à jour de la moyenne de suivi`KL(π_θ || π_ref)`Si elle est montée`~5-10`, la politique  déjà déja `π_SFT`- Je suis plus bas .`β`La récompense ou le piratage commence à augmenter.

### Étape 5: utiliser la recette de production de TRL

Comprendre le pipeline de jouets 后,下面是同循环作为真实图书馆用户的写法──Hugging Face 的 [TRL](https://huggingface.co/docs/trl) Étapes 2 `RewardTrainer`- Étapes 3 et 3.`PPOTrainer`(内置 KL-à-référence)

```python
# Stage 2：来自 pairwise preferences 的 reward model
from trl import RewardTrainer, RewardConfig
from transformers import AutoModelForSequenceClassification, AutoTokenizer

tok = AutoTokenizer.from_pretrained("meta-llama/Llama-3.1-8B-Instruct")
rm = AutoModelForSequenceClassification.from_pretrained(
    "meta-llama/Llama-3.1-8B-Instruct", num_labels=1
)

# dataset rows: {"prompt", "chosen", "rejected"} — Bradley-Terry format
trainer = RewardTrainer(
    model=rm,
    tokenizer=tok,
    train_dataset=preference_data,
    args=RewardConfig(output_dir="./rm", num_train_epochs=1, learning_rate=1e-5),
)
trainer.train()
```

```python
# Stage 3：针对 RM 的 PPO，并对 SFT reference 加 KL penalty
from trl import PPOTrainer, PPOConfig, AutoModelForCausalLMWithValueHead

policy = AutoModelForCausalLMWithValueHead.from_pretrained("./sft-checkpoint")
ref    = AutoModelForCausalLMWithValueHead.from_pretrained("./sft-checkpoint")  # frozen

ppo = PPOTrainer(
    config=PPOConfig(learning_rate=1.41e-5, batch_size=64, init_kl_coef=0.05,
                     target_kl=6.0, adap_kl_ctrl=True),
    model=policy, ref_model=ref, tokenizer=tok,
)

for batch in dataloader:
    responses = ppo.generate(batch["query_ids"], max_new_tokens=128)
    rewards   = rm(torch.cat([batch["query_ids"], responses], dim=-1)).logits[:, 0]
    stats     = ppo.step(batch["query_ids"], responses, rewards)
    # stats 包含：mean_kl、clip_frac、value_loss — 三个 PPO diagnostics
```

La bibliothèque va te remplacer par trois choses.`adap_kl_ctrl=True`实现 l'horaire adaptatif-β: si l' observation de KL  dépasse `target_kl`,β 翻倍; si moins de la moitié,β 减半;; Modèle de référence 按约定是结的  你不能意外地和 `policy`Paramètres de partage: tête de valeur et politique`AutoModelForCausalLMWithValueHead`- Je suis un peu déçu .`policy/kl`et `value/loss`Il y a une autre.

## La trappe

- **Over-optimization / reward hacking。**RM n'est pas parfait;`π_θ`Les résultats de l'évaluation humaine sont égaux ou inférieurs.`β`、 étendre les données de formation RM¬
- **Length hacking。**Dans les réponses utiles, les RM sont souvent récompensés par la récompense 长度──Politique 学会填充 réponses──补救:récompense normalisée de longueur, ou utilisation de RLAIF de RM conscient de longueur──
- **RM 太小。**RM au moins besoin et politique, un peu plus grande.
- **KL tuning。**La politique de la démocratie est de fixer un KL à chaque étape en vue d'une démocratie adaptative.
- **Preference-data noise。**Environ 30% des étiquettes humaines sont bruyantes ou confuses.
- **Off-policy problems。**Les données de PPO dans la première ère 后会略略脱政策──像课08 那样监控片分数──

## Utilisez-le

Le RLHF de 2026 est divisé en:

| Layer | Target | Method |
|-------|--------|--------|
| Instruction following, helpfulness, harmlessness | Alignment | DPO（Phase 10 · 08）优于 RLHF-PPO。 |
| Reasoning correctness（math, code） | Capability | 使用 verifier reward 的 GRPO（Phase 9 · 12）。 |
| Long-horizon multi-step tasks | Agentic | 在 steps 上使用 process reward models 的 PPO / GRPO。 |
| Safety / refusal behavior | Safety | RLHF-PPO with separate safety RM，或 Constitutional AI。 |
| Best-of-N at inference | Fast alignment | 在 decode time 使用 RM；不需要 policy training。 |
| Reward distillation | Inference compute | 在 frozen LM 顶部训练一个小的 “reward head”。 |

Le RLHF est une méthode de 2022-2024 pour la production de pipelines d'alignement à partir de 2026 et sera utilisé uniquement pour des étapes de RM-intensive ou critiques pour la sécurité.

## Je le livre.

保存为 `outputs/skill-rlhf-architect.md`- Le numéro de la liste:

```markdown
---
name: rlhf-architect
description: 为 language model 设计 RLHF / DPO / GRPO alignment pipeline，包括 RM、KL 和 data strategy。
version: 1.0.0
phase: 9
lesson: 9
tags: [rl, rlhf, alignment, llm]
---

给定一个 base LM、一个目标行为（alignment / reasoning / refusal / agent），以及 preference 或 verifier budget，输出：

1. Stage。SFT？RM？DPO？GRPO？并给出理由。
2. Preference or verifier source。Humans、AI feedback、rule-based、unit-test-pass 或 reward distillation。
3. KL strategy。Fixed β、adaptive β 或 DPO（implicit KL）。
4. Diagnostics。Mean KL、reward stability、over-optimization guard（holdout human eval）。
5. Safety gate。Red-team set、refusal rate、与 helpfulness RM 分开的 safety RM。

拒绝在没有 KL monitor 的情况下交付 RLHF-PPO。拒绝使用小于 target policy 的 RM。拒绝 length-only rewards。把任何没有留出 blind human-eval set 的 pipeline 标记为缺少 over-optimization protection。
```

## 练习

1. **简单。**Dans le`code/main.py`En utilisant 500 paires de préférences synthétiques  entraînement du modèle de récompense Bradley-Terry ⋅ 100 paires de résistance ⋅ la précision des mesures par paires ⋅ devrait dépasser 90% ⋅
2. **中等。**Utilisation `β ∈ {0.0, 0.1, 1.0}`运行 toy PPO-RLHF loop──对每个值,绘制 RM score vs KL-to-reference over updates──哪些 runs 发生奖励-hack?
3. **困难。**Dans les mêmes données de préférence, la perte de probabilité de préférence de forme fermée (DPO) est réalisée, et le RLHF-PPO est utilisé dans le calcul et atteint le score final RM.

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| RLHF | "Alignment RL" | 三阶段 SFT + RM + PPO pipeline（Christiano 2017, Ouyang 2022）。 |
| Reward Model (RM) | "The scoring net" | 通过 Bradley-Terry 拟合 pairwise preferences 学到的 scalar function。 |
| Bradley-Terry | "Pairwise logistic loss" | `P(y_+ ≻ y_-) = σ(R(y_+) - R(y_-))`；标准 RM objective。 |
| KL penalty | "Stay near the reference" | reward 中的 `β · KL(π_θ \|\| π_ref)`；anti-reward-hacking regularizer。 |
| Reward hacking | "Goodhart's law" | Policy 利用 RM 缺陷；症状：reward 上升，human eval 持平。 |
| RLAIF | "AI-labeled preferences" | 标签来自另一个 LM 而非人类的 RLHF。 |
| PRM | "Process Reward Model" | 给 partial reasoning steps 打分；用于 reasoning pipelines。 |
| Constitutional AI | "Anthropic's method" | 由显式规则引导的 AI-generated preferences。 |

## 延伸阅读

- [Christiano et al. (2017). Deep Reinforcement Learning from Human Preferences](https://arxiv.org/abs/1706.03741) 开创RLHF 的论文──
- [Ouyang et al. (2022). InstructGPT — Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) ChatGPT 背后配方──
- [Stiennon et al. (2020). Learning to summarize with human feedback](https://arxiv.org/abs/2009.01325) RLHF 
- [Rafailov et al. (2023). Direct Preference Optimization](https://arxiv.org/abs/2305.18290) DPO;2026 année post-RLHF
- [Bai et al. (2022). Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073) RLAIF 和 boucle d'autocritique
- [Anthropic RLHF paper (Bai et al. 2022). Training a Helpful and Harmless Assistant](https://arxiv.org/abs/2204.05862) HH 论文。
- [Hugging Face TRL library](https://huggingface.co/docs/trl) Classe de production `RewardTrainer`et `PPOTrainer`❖ Lire source d'entraîneur, comprendre adaptive-KL 和 valeur-tête 细节。
- [Hugging Face — Illustrating Reinforcement Learning from Human Feedback](https://huggingface.co/blog/rlhf)par Lambert, Castricato, von Werra, Havrilla  带图解的三阶段管道 经典 walkthrough──
- [von Werra et al. (2020). TRL: Transformer Reinforcement Learning](https://github.com/huggingface/trl) bibliothèque;`examples/`Il y a des scripts de bout en bout de Llama、Mistral 和 Qwen.
- [Sutton & Barto (2018). Ch. 17.4 — Designing Reward Signals](http://incompleteideas.net/book/RLbook2020.pdf) l'hypothèse de récompense 视角; penser au piratage de la récompense ⋅
