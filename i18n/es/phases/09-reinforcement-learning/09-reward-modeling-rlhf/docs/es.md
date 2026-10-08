# Modelado de recompensas y RLHF

> La gente no puede hacer una buena respuesta de asistente por la función de recompensa de escritura, pero pueden comparar dos respuestas, y escoger una mejor.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 05 (Sentiment), Phase 9 · 08 (PPO)
**Time:** ~45 分钟

##  problemas

Ya ha utilizado el objetivo de predicción de los próximos tokens  entrenar un modelo de lenguaje  puede escribir en inglés correctamente  también mentir, y rechazar rechazar  no puede pasar por más pre-entrenamiento 修复  el texto web es un problema, no una solución

Usted quiere una* recompensa de la cantidad*, indicó para la instrucción X, respuesta A a la respuesta B mejor mejor──Escribe esta función de recompensa es imposible──Helpfulness 不是 Token 上的封面表情──但人类可以比较两个输出并标记偏好──这可以低成本大规模收集──

RLHF(Christiano et al. 2017; Ouyang et al. 2022) tratan las preferencias 转换为奖励模型, luego usan PPO 针对该奖励 优化 LM。分三步:SFT → RM → PPO。 esto es 20232025年交付 ChatGPT、Claude、Gemini 以及其他所有所有一致-LLM配方──

Hasta 2026 años, el PPO 步骤大多 será sustituido por DPO (Fase 10 · 08) porque es más barato, y para el ajuste de alineamiento para decir casi lo mismo. Pero el *modelo de recompensa* 部分 todavía se apoya en cada mejor muestra de N 、 cada RL-de-verificable-rewards pipeline, así como cada modelo de razonamiento del uso de proceso de recompensa modelo― entendiendo RLHF, ya entiendes toda la pila de alineamiento―

## 概念

![Three-stage RLHF: SFT, RM training on pairwise prefs, PPO with KL penalty](../assets/rlhf.svg)

**Stage 1：Supervised Fine-Tuning（SFT）。**Desde el modelo base pre-entrenado 开始──在目标行为的人类编写示范 上细调(respuestas que siguen instrucciones、respuestas útiles etc)──结果是一个`π_SFT`El modelo, que está orientado hacia el buen comportamiento, pero todavía tiene un espacio de acción ilimitado.

**Stage 2：Reward Model training。**

- 收集对提示                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `x`de los pares de respuesta `(y_+, y_-)`, por humanos etiquetado por y_+ 优于 y_──
-  entrenamiento modelo de recompensa `R_φ(x, y)`, déjame hacerlo .`y_+`Por lo tanto, no hay más que un número de partes.
- Las pérdidas:**Bradley-Terry pairwise logistic**¿Qué es esto ?

  `L(φ) = -E[ log σ(R_φ(x, y_+) - R_φ(x, y_-)) ]`

  σ 是 sigmoid──reward 的差值隐含偏好 的 log-odds──BT desde 1952 años (Bradley-Terry) desde siempre es el método estándar, también es la principal opción en RLHF moderno──

- `R_φ`Normalmente se inicia desde el modelo SFT, y en la parte superior se añade una cabeza escalar. La misma columna vertebral del transformador; una capa lineal única.

**Stage 3：带 KL penalty、针对 RM 的 PPO。**

- Desde`π_SFT`Política de formación inicial`π_θ`                                                                                                                                                                                                                                                              `π_ref = π_SFT`¿Qué es eso?
- Respuesta `y`结束时的奖励:

  `r_total(x, y) = R_φ(x, y) - β · KL(π_θ(·|x) || π_ref(·|x))`

  KL penalidad 防止 `π_θ`任意漂离                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `π_SFT` Es un *regulador*, no una región de confianza de la dureza―`β`Normalmente es`0.01`- ¿ Qué ?`0.05`¿Qué es eso?
- Utiliza esta recompensa 运行 PPO(Ley 08)。Ventajas en la trayectoria de nivel de token 上计算, pero RM sólo da una respuesta completa 打分。

**为什么需要 KL？**没有它,PPO 会很乐意找到奖励黑客策略  RM 只有在分销完成上训过;;`π_θ`保持在 RM 训练过的多元体 附近──它是RLHF中最重要的单个旋──

**2026 状态：**

- **DPO**(Rafailov 2023):algebra de forma cerrada Colocar la etapa 2+3 doblar en un dato de preferencia  上的 supervisado pérdida── sin RM, sin PPO── sólo se necesita una pequeña parte de la computación,就能在排列基准上达到相同质量──Fase 10 · 08 会讲──
- **GRPO**(DeepSeek 20242025):PRO's variación, con base de grupo-relativa en lugar de crítica, recompensa de *verifier*(codificación / matemáticas de respuesta coincide), en lugar de RM de entrenamiento humano.
- **Process reward models（PRMs）：**给部分解决方案 (每步推理)打分,用于RLHF 和推理的GRPO 变体──
- **Constitutional AI / RLAIF：**Utiliza el LLM alineado para crear preferencias, en lugar de utilizar el humano.


```figure
reward-model
```

## Construirlo

Este curso utiliza microtipo de comprobaciones sintéticas y respuestas, expresadas en letras.`code/main.py`¿Qué es eso?

### Paso 1: Datos de preferencias sintéticas

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

En el verdadero RLHF, esto será reemplazado por etiquetadores humanos.`(prompt, preferred_response, rejected_response)` 完全相同──

### Paso 2: Modelo de recompensa Bradley-Terry

Punto lineal:`R(x, y) = w · bag(y)` Entrenamiento para minimizar BT pérdida de registro en pares:

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

Después de haber pasado por cientos de actualizaciones,`w`Le daré los tokens de buenas palabras, y los tokens de malas palabras, y los tokens de malas palabras, y les daré el peso negativo.

### Paso 3: Política similar a la PPO en la RM 之

Nuestra política de juguete se basa en el vocabulario para generar un token.`log π_θ(token | prompt)`, Añadir KL-a-referencia penalidad,并应用 recortado PPO sustituto。

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

### Paso 4: monitoreo KL

Cada actualización de seguimiento significa`KL(π_θ || π_ref)`Si se ha subido`~5-10`, política  ya está lejos `π_SFT`很远  más bajo `β`¿Está aumentando o está comenzando el hacking de recompensas?

### Paso 5: utilizar la receta de producción de TRL

Comprender el pipeline de juguetes 后,下面是同循环作为真实图书馆用户的写法──Hugging Face 的 [TRL](https://huggingface.co/docs/trl) Etapes 2 `RewardTrainer`, Etapa 3 Usado`PPOTrainer`(内置 KL-to-reference)

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

La biblioteca te reemplazará por tres cosas.`adap_kl_ctrl=True`实现 el calendario de adaptación-β: si se observa que el KL  supera `target_kl`,β 翻倍; si es inferior a la mitad,β 减半──Modelo de referencia 按约定是结的  你不能意外地和 `policy`Compartir parámetros. La cabeza de valor y la política.`AutoModelForCausalLMWithValueHead` añadir una cabeza MLP escalare), eso es por qué TRL 会分别报告 `policy/kl`Y `value/loss`¿Qué es eso?

## 陷

- **Over-optimization / reward hacking。**RM no está perfecto;`π_θ`Se encontrará un resultado alto pero de calidad inferior de los resultados adversarios.`β`、 ampliar datos de formación RM¬
- **Length hacking。**En respuestas útiles 上训练的RMs 往往隐式奖励 长度──Politics 学会填充回应──补救:length-normalized reward,或使用长度意识的RLAIF的RM──
- **RM 太小。**RM Minimally Needs and Policy Una forma grande.
- **KL tuning。**β 太低 → drift 和 reward hacking──β 太高 → política 几乎不变──标准技巧是使用一个以固定为每步 KL 为目标的 *adaptive* β──
- **Preference-data noise。**Aproximadamente el 30% de las etiquetas humanas tienen ruido o confusión.
- **Off-policy problems。**Los datos de PPO en la primera época 后会略略脱政策──像课08 那样监控片分数──

## Usalo

El RLHF de 2026 es de:

| Layer | Target | Method |
|-------|--------|--------|
| Instruction following, helpfulness, harmlessness | Alignment | DPO（Phase 10 · 08）优于 RLHF-PPO。 |
| Reasoning correctness（math, code） | Capability | 使用 verifier reward 的 GRPO（Phase 9 · 12）。 |
| Long-horizon multi-step tasks | Agentic | 在 steps 上使用 process reward models 的 PPO / GRPO。 |
| Safety / refusal behavior | Safety | RLHF-PPO with separate safety RM，或 Constitutional AI。 |
| Best-of-N at inference | Fast alignment | 在 decode time 使用 RM；不需要 policy training。 |
| Reward distillation | Inference compute | 在 frozen LM 顶部训练一个小的 “reward head”。 |

RLHF es el método de 20222024 años de* que*.

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-rlhf-architect.md`¿Qué es esto ?

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

##  ejercicios

1. **简单。**En el`code/main.py`En el caso de las máquinas de control de velocidad, el modelo de recompensas de Bradley-Terry debe ser más de 90%.
2. **中等。**Uso `β ∈ {0.0, 0.1, 1.0}`¿Qué es lo que ocurre con el hackeo de recompensas?
3. **困难。**En los mismos datos de preferencias, se logra la pérdida de probabilidad de preferencias de forma cerrada (DPO), se compara con el RLHF-PPO en la computación de uso y se alcanza el puntaje final de RM.

## 关键术语: "El hombre es un hombre"

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
- [Stiennon et al. (2020). Learning to summarize with human feedback](https://arxiv.org/abs/2009.01325) Más temprano utilizado para la resumen de RLHF。
- [Rafailov et al. (2023). Direct Preference Optimization](https://arxiv.org/abs/2305.18290) DPO;2026 años post-RLHF 的默认方法──
- [Bai et al. (2022). Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073) RLAIF 和 ciclo de autocrítica
- [Anthropic RLHF paper (Bai et al. 2022). Training a Helpful and Harmless Assistant](https://arxiv.org/abs/2204.05862) HH 论文。
- [Hugging Face TRL library](https://huggingface.co/docs/trl) Clasificación de producción `RewardTrainer`Y `PPOTrainer`❖阅读 entrenador fuente, comprensión adaptativa-KL 和 valor-head 细节──
- [Hugging Face — Illustrating Reinforcement Learning from Human Feedback](https://huggingface.co/blog/rlhf)por Lambert, Castricato, von Werra, Havrilla  带图解的三阶段管道 经典 walkthrough──
- [von Werra et al. (2020). TRL: Transformer Reinforcement Learning](https://github.com/huggingface/trl) biblioteca;`examples/`Tiene una cara hacia Llama、Mistral 和 Qwen de end-to-end RLHF guiones。
- [Sutton & Barto (2018). Ch. 17.4 — Designing Reward Signals](http://incompleteideas.net/book/RLbook2020.pdf) recompensa-hipótesis 视角; pensar en el hackeo de recompensa
