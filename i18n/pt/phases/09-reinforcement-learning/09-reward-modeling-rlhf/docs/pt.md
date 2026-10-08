# Modelagem de recompensas & RLHF

> O grupo não pode fazer uma boa resposta de assistente, mas eles podem comparar duas respostas, e escolher uma melhor.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 05 (Sentiment), Phase 9 · 08 (PPO)
**Time:** ~45 分钟

## 问题

Você já usou o objetivo de previsão de tokens seguintes  treinar um modelo de linguagem  pode escrever linguagem  também vai mentir , e recusar a rejeitar  você não pode passar por mais treinamento 修复  texto da web é um problema, não uma solução

Você quer uma * recompensa de escala*, indicando para instrução X, resposta A é melhor que resposta B.

RLHF(Christiano et al. 2017; Ouyang et al. 2022) transformar as preferências em modelo de recompensa, e então usar PPO  para o objetivo de recompensa  optimizar LM。分三步:SFT → RM → PPO。 é 20232025年交付 ChatGPT、Claude、Gemini 以及其他所有的配配方――LLM.

Até 2026, o PPO 步骤大多被DPO ((Fase 10 · 08)取代, pois é mais barato, e para o ajuste de alinhamento para dizer quase que o mesmo.

## 概念

![Three-stage RLHF: SFT, RM training on pairwise prefs, PPO with KL penalty](../assets/rlhf.svg)

**Stage 1：Supervised Fine-Tuning（SFT）。**Desde o modelo base pré-treinado 开始──在目标行为的人类编写示范 上细调(resposta a seguir instruções、respostas úteis etc)`π_SFT`O modelo, que tem tendência a um bom comportamento, mas ainda tem espaço de acção ilimitado.

**Stage 2：Reward Model training。**

- 收集对提示 `x`dos pares de resposta `(y_+, y_-)`, por humanos marcados por y_+ 优于 y_-。
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `R_φ(x, y)`- Deixa-me dar-te .`y_+`- É melhor.
- Perda:**Bradley-Terry pairwise logistic**- Não .

  `L(φ) = -E[ log σ(R_φ(x, y_+) - R_φ(x, y_-)) ]`

  σ 是 sigmoid──reward 的差值隐含偏好 的 log-odds──BT desde 1952 年 (Bradley-Terry) desde sempre é método padrão, também é a principal escolha no RLHF moderno──

- `R_φ`Normalmente, a partir do modelo SFT inicialmente, e em cima, adicionar uma cabeça escalar.

**Stage 3：带 KL penalty、针对 RM 的 PPO。**

- De`π_SFT`Política de formação inicial`π_θ`                                                                                                                                                                                                                                                              `π_ref = π_SFT`- Não.
- Resposta `y`结束时的奖励:

  `r_total(x, y) = R_φ(x, y) - β · KL(π_θ(·|x) || π_ref(·|x))`

  KL penalidade 防止 `π_θ`任意漂离 `π_SFT` É um *regularizador*, não é uma região de confiança de hardware―`β`Normalmente é`0.01`- Não .`0.05`- Não.
- Use esta recompensa 运行 PPO(Lessão 08)。 Avanços na trajetória de nível de token 上计算, mas RM apenas dá resposta completa 打分。

**为什么需要 KL？**Não há, a OPPO vai estar muito feliz em encontrar estratégias de hacking de recompensas. RM só está em conclusões de distribuição.`π_θ`保持在 RM 训练过的多样性 附近──它是RLHF 中最重要的单个旋──

**2026 状态：**

- **DPO**(Rafailov 2023): álgebra de forma fechada Colocar o estágio 2+3 dobrar em um dado de preferência  上的监督损失──没有 RM,没有 PPO──只需要一小部分计算,就能在对齐基准上达到相同质量──Phase 10 · 08 会讲──
- **GRPO**(DeepSeek 20242025):O PPO é transformado em um modelo de base de grupo, em vez de um critico, em vez de um "verificador" (com o código executado) ou um "match" de matemática (com o método de matemática), em vez de um RM.
- **Process reward models（PRMs）：**给部分解决方案 (GROP) 变体 (GROP) 变体 (GROP) 变体) 打分, para uso no RLHF 和 raciocínio
- **Constitutional AI / RLAIF：**Utilize alinhadas LLM 生成 preferências, em vez de usar humanos.


```figure
reward-model
```

## Construí-lo

O RM é um marcador linear baseado em sacos de tokens, não há um LLM real, o que importa é a forma do pipeline, não a dimensão.`code/main.py`- Não.

### Passo 1: Dados de preferência sintéticos

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

Em RLHF real, isto será substituído por etiquetadores humanos.`(prompt, preferred_response, rejected_response)`- É o mesmo.

### Passo 2: Modelo de recompensa Bradley-Terry

Ponto de pontuação linear:`R(x, y) = w · bag(y)` Treinamento para minimizar BT par de perda de log:

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

Depois de algumas centenas de atualizações,`w`Vou dar-lhe tokens de boas palavras, dividir o peso da palavra, dar-lhe tokens de más palavras, dividir o peso da palavra.

### Passo 3: Política de PPO em RM 之

A nossa política de brinquedos irá gerar um token do vocabulário.`log π_θ(token | prompt)`,Add KL-to-reference penalty,并应用 clipped PPO suporte.

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

### Passo 4: monitor KL

Cada atualização segue o significado`KL(π_θ || π_ref)`Se ele se arrasta`~5-10`, política  já se deslocou `π_SFT`Muito longe mais baixo`β`Está a aumentar ou a recompensa está a começar. É o diagnóstico mais importante do RLHF.

### Passo 5: Utilize TRL

Compreender o pipeline de brinquedos 后,下面是同一循环作为真实图书馆用户的写法──Hugging Face 的 [TRL](https://huggingface.co/docs/trl) Fase 2 `RewardTrainer`É o estágio 3.`PPOTrainer`(内置 KL-to-reference)

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

A biblioteca vai fazer três coisas por ti.`adap_kl_ctrl=True`实现 adaptive-β schedule: se observado KL  exce `target_kl`,β 翻倍; se inferior a metade,β 减半──Modelo de referência 按约定是结的  你不能意外地和 `policy`Parâmetros de Compartilhamento.`AutoModelForCausalLMWithValueHead`- Adicione um MLP escalare cabeça), é por isso que TRL vai separar relatório .`policy/kl`和 `value/loss`- Não.

## 陷

- **Over-optimization / reward hacking。**RM não está perfeito;`π_θ`O resultado da avaliação humana é igual ou inferior.`β`、 ampliar os dados de formação RM­
- **Length hacking。**Em respostas úteis 上训练的RMs 往往隐式奖励 长度──Politics 学会填充答案──补救:recompensa normalizada de comprimento,或使用RLAIF de RMs conscientes de comprimento──
- **RM 太小。**RM Minimally needs and policy, assim como grande.
- **KL tuning。**β 太低 → drift 和 reward hacking──β 太高 → política 几乎不变──标准技巧是使用一个以固定为每步 KL 为目标的 *adaptive* β──
- **Preference-data noise。**Cerca de 30% dos rótulos humanos têm ruído ou confusão.
- **Off-policy problems。**Os dados do PPO na primeira época 后会略略脱政策──像课08 那样监控片分数──

## Use-o

O RLHF de 2026 é de:

| Layer | Target | Method |
|-------|--------|--------|
| Instruction following, helpfulness, harmlessness | Alignment | DPO（Phase 10 · 08）优于 RLHF-PPO。 |
| Reasoning correctness（math, code） | Capability | 使用 verifier reward 的 GRPO（Phase 9 · 12）。 |
| Long-horizon multi-step tasks | Agentic | 在 steps 上使用 process reward models 的 PPO / GRPO。 |
| Safety / refusal behavior | Safety | RLHF-PPO with separate safety RM，或 Constitutional AI。 |
| Best-of-N at inference | Fast alignment | 在 decode time 使用 RM；不需要 policy training。 |
| Reward distillation | Inference compute | 在 frozen LM 顶部训练一个小的 “reward head”。 |

O RLHF é um método de 20222024 2024 2026 2026 2026 2026 2026 2024 2024 2024 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2026 2022 2022 2022 2022 2022 2022 2022 2022 2022 2022 2022 2022 2022 2022 2022 2022 2022 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20  20   20      20          20                         

## Entrega-o

保存为 `outputs/skill-rlhf-architect.md`- Não .

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

1. **简单。**Em`code/main.py`中用500 个合成偏好对子 训练布拉德利-特里奖励模型──在 hold-out 的100 个对子 上测量对准度──应超过90%──
2. **中等。**Utilização `β ∈ {0.0, 0.1, 1.0}`运行 toy PPO-RLHF loop──对每个值,绘制 RM score vs KL-to-reference over updates── quais corridas 发生奖励-hack?
3. **困难。**Em dados de preferência, em comparação com o RLHF-PPO, em cálculo de uso e alcançando a pontuação final RM,

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

- [Christiano et al. (2017). Deep Reinforcement Learning from Human Preferences](https://arxiv.org/abs/1706.03741) 开创 RLHF 的论文──
- [Ouyang et al. (2022). InstructGPT — Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) ChatGPT 背后配方──
- [Stiennon et al. (2020). Learning to summarize with human feedback](https://arxiv.org/abs/2009.01325) 更早用于概括的RLHF──
- [Rafailov et al. (2023). Direct Preference Optimization](https://arxiv.org/abs/2305.18290) DPO;2026 anos pós-RLHF
- [Bai et al. (2022). Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073) RLAIF 和 autocrítica loop。
- [Anthropic RLHF paper (Bai et al. 2022). Training a Helpful and Harmless Assistant](https://arxiv.org/abs/2204.05862) HH 论文──
- [Hugging Face TRL library](https://huggingface.co/docs/trl) Classe de produção `RewardTrainer`和 `PPOTrainer`❖阅读 treinador fonte, compreender adaptativo-KL 和 valor-head 细节──
- [Hugging Face — Illustrating Reinforcement Learning from Human Feedback](https://huggingface.co/blog/rlhf)por Lambert, Castricato, von Werra, Havrilla  带图解的三阶段管道 经典 walkthrough──
- [von Werra et al. (2020). TRL: Transformer Reinforcement Learning](https://github.com/huggingface/trl)Biblioteca;`examples/`Há uma cara para Llama、Mistral 和 Qwen de end-to-end RLHF scripts。
- [Sutton & Barto (2018). Ch. 17.4 — Designing Reward Signals](http://incompleteideas.net/book/RLbook2020.pdf) recompensa-hipótese 视角;思考 recompensa hacking 的必要前置知识──
