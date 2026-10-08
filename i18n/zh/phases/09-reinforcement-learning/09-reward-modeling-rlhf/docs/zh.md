# 奖励模型和RLHF

> 人类无法为好的助理响应手写奖励函数,但他们可以比较两个响应,并选择更好的一个.把奖励模型适合这些比较,然后使用RL让语言模型对其优化.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 05 (Sentiment), Phase 9 · 08 (PPO)
**Time:** ~45 分钟

## 问题

你已经使用下一个标志预测目标 训练了一个语言模型――它可以写出语法正确的英语――它也会撒谎,并且拒绝拒绝――你无法通过更多的预训修复这个点

你想要一个*标量奖励*,表示对指令X,响应A比响应B更好──手写这个奖励函数是不可能的── 帮助 不是标志上封闭形式的表达──但人类可以比较两个输出并标记偏好──这可以低成本大规模收集──

们的优势将转换为奖励模式,然后使用PPO 针对该奖励优化LM──分三步:SFT → RM → PPO──这是20232025年交付ChatGPT、Claude、Gemini以及所有其他符合LLM配方──

到2026年,PPO 步骤大多被DPO取代,因为它更便宜,而且对对对齐调整来说几乎一样好.但 *奖励模型* 部分仍然支着每个最佳的N样本"",每个RL-从可验证的奖励管道,以及每个使用过程奖励模型的推理模型――理解RLHF,你就已经理解了整个对齐堆――

## 概念

![Three-stage RLHF: SFT, RM training on pairwise prefs, PPO with KL penalty](../assets/rlhf.svg)

**Stage 1：Supervised Fine-Tuning（SFT）。**从预训练的基础模型开始. 在目标行为的人类编写示范 上细调.`π_SFT`模式偏向良好行为,但仍然存在无限的行动空间.

**Stage 2：Reward Model training。**

- 收集对提示`x`的反应对`(y_+, y_-)`通过人类标注为y_+ 优于y_----
- 训练奖励模式`R_φ(x, y)`让它给我`y_+`分配更高分数.
- 损失:**Bradley-Terry pairwise logistic**其他:

  `L(φ) = -E[ log σ(R_φ(x, y_+) - R_φ(x, y_-)) ]`

  由于BT自1952年 (Bradley-Terry)以来一直是标准方法,也是现代RLHF中的主流选择.

- `R_φ`通常从SFT模型初始化,并在顶部加上一个尺度头――同样的变压器脊柱;一个单独的线性层输出奖励――

**Stage 3：带 KL penalty、针对 RM 的 PPO。**

- 从`π_SFT`初始化可培训政策`π_θ`保留一个结尾的引用`π_ref = π_SFT`,我知道.
- 答案`y`结束时的奖励:

  `r_total(x, y) = R_φ(x, y) - β · KL(π_θ(·|x) || π_ref(·|x))`

  罚款 防止`π_θ`任意漂离`π_SFT` 它是一个调节者,不是硬性信任区域.`β`通常是`0.01`- 没有什么.`0.05`,我知道.
- 借此奖励运行PPO(第08课) 优势在代币水平轨迹上计算,但RM只给了完整的答案打分――

**为什么需要 KL？**没有它,PPO 会很乐意找到奖励黑客策略  RM 只在在在分发完成上训练过――一个在分发的反应可能比任何人类写的反应 分数都高――KL 让`π_θ`保持在RM训练过的多元附近.

**2026 状态：**

- **DPO**关闭形式代数 把阶段2+3 折叠成一个优先数据 上面监督损失――没有RM,没有PPO――只需要一小部分的计算,就能在配线基准上达到相同质量――10阶段 · 08 会讲――
- **GRPO**(DeepSeek 20242025):PPO 的变体,用组相关基线代替批评,奖励来自 *verifier*(代码运行 /数学答案匹配),而不是人类训练的 RM──它在推理模型中占主导地位──9 阶段 · 12 会讲──
- **Process reward models（PRMs）：**给部分解决方案 (每一个推理步骤)打分,用于RLHF 和推理的GRPO变体――
- **Constitutional AI / RLAIF：**采用符合法学专业的优惠,而不是使用人类的优惠预算.


```figure
reward-model
```

## 构建它

本课使用微型合成的提示和答案,表示为字符串──RM 是基于代币的线性得分符号表示──没有真实LLM  重要的是管道的*形状*,不是规模──见`code/main.py`,我知道.

### 步骤1:合成优先数据

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

在真实RLHF中,这会被人类标签 替换.`(prompt, preferred_response, rejected_response)`完全相同.

### 步骤2:布拉德利-特里奖励模型

线性分数:`R(x, y) = w · bag(y)`△训练以最小化BT双日记损失:

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

经过几百次更新后,`w`给了好话的代币 分配正权重,给了坏话的代币 分配负权重.

### 步骤3:RM 之上的PPO类似政策

我们的玩具政策会从词汇中生成一个代币. 我们使用RM给这个代币.`log π_θ(token | prompt)`加入KL-向参考处罚并应用剪切PPO替代者──

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

### 步骤4:监控器 KL

每次更新都跟踪的意思`KL(π_θ || π_ref)`如果它爬了`~5-10`政策已漂离`π_SFT`很远 低`β`现在,我们在线观看,

### 步骤5:使用TRL的生产配方

后面是像真实图书馆用户的写法一样的循环.[TRL](https://huggingface.co/docs/trl)是参考实施  第二阶段 用`RewardTrainer`阶段3`PPOTrainer`(内置 KL-to-reference) 〔

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

图书馆会替你做三件事.`adap_kl_ctrl=True`实现适应β时间表:如果观察到KL 超过`target_kl`根据约定是结局的  你不能意外地和`policy`共享参数――值头与政策 位于同一个脊柱上`AutoModelForCausalLMWithValueHead`附加一个规模性MLP头),这就是为什么TRL会分别报告`policy/kl`和 `value/loss`,我知道.

## 陷

- **Over-optimization / reward hacking。**没有完美;`π_θ`结果是高分但质量差的对抗性完成. 症状:奖励 无限上升,而人类评价分 持平或下降.`β`、拓宽RM培训数据――
- **Length hacking。**在有用的回应上训练的RMs 往往隐式奖励 长度──政策 学会填充回应──补救:长度正常化的奖励,或使用长度意识的RLAIF──
- **RM 太小。**作为一个大小的RM,RM至少需要和政策.
- **KL tuning。**标准技巧是使用一个按步骤固定的 KL 为目标的 *适应性* β──
- **Preference-data noise。**通过协议过数据,上升训练RM 来校准,或在BT上使用温度.
- **Off-policy problems。**后会略微的政策外.

## 使用它

2026年,RLHF是分层的:

| Layer | Target | Method |
|-------|--------|--------|
| Instruction following, helpfulness, harmlessness | Alignment | DPO（Phase 10 · 08）优于 RLHF-PPO。 |
| Reasoning correctness（math, code） | Capability | 使用 verifier reward 的 GRPO（Phase 9 · 12）。 |
| Long-horizon multi-step tasks | Agentic | 在 steps 上使用 process reward models 的 PPO / GRPO。 |
| Safety / refusal behavior | Safety | RLHF-PPO with separate safety RM，或 Constitutional AI。 |
| Best-of-N at inference | Fast alignment | 在 decode time 使用 RM；不需要 policy training。 |
| Reward distillation | Inference compute | 在 frozen LM 顶部训练一个小的 “reward head”。 |

据悉,RLHF是2022年2024年*那个*方法.

## 交付它

保存为`outputs/skill-rlhf-architect.md`其他:

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

1. **简单。**在`code/main.py`中使用500个合成偏好对 训练布拉德利-特利奖励模型──在保持的100个对 上测量对准度──应该超过90%──
2. **中等。**使用 `β ∈ {0.0, 0.1, 1.0}`运行玩具PPO-RLHF循环――对每个值,绘制RM分数与KL-引用更新――哪些运行发生奖励黑客?
3. **困难。**在相同的偏好数据上实现DPO (闭式偏好概率损失),并与RLHF-PPO管道在使用计算和达到最终RM分上对比.

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

- [Christiano et al. (2017). Deep Reinforcement Learning from Human Preferences](https://arxiv.org/abs/1706.03741) 开创RLHF的论文──
- [Ouyang et al. (2022). InstructGPT — Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155)聊天GPT 背后配方
- [Stiennon et al. (2020). Learning to summarize with human feedback](https://arxiv.org/abs/2009.01325) 更早用于总结的RLHF──
- [Rafailov et al. (2023). Direct Preference Optimization](https://arxiv.org/abs/2305.18290) DPO;2026年后RLHF 的默认方法──
- [Bai et al. (2022). Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073) RLAIF 和自我批评循环
- [Anthropic RLHF paper (Bai et al. 2022). Training a Helpful and Harmless Assistant](https://arxiv.org/abs/2204.05862) HH 论文──
- [Hugging Face TRL library](https://huggingface.co/docs/trl) 生产级 `RewardTrainer`和 `PPOTrainer`阅读教练来源,理解适应性-KL 和值头 细节――
- [Hugging Face — Illustrating Reinforcement Learning from Human Feedback](https://huggingface.co/blog/rlhf)通过Lambert,Castricato,von Werra,Havrilla  带图解的三阶段管道 经典通行.
- [von Werra et al. (2020). TRL: Transformer Reinforcement Learning](https://github.com/huggingface/trl)图书馆`examples/`有面向拉马,米斯特拉尔和的端到端的RLHF脚本.
- [Sutton & Barto (2018). Ch. 17.4 — Designing Reward Signals](http://incompleteideas.net/book/RLbook2020.pdf)奖励假设 视角;思考奖励黑客的必要前置知识──
