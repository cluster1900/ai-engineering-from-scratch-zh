#  静静   自学推理

> 最小的自我改进循环就位于逻辑内部.模型产生一个思想链,保留得到正确答案的结果,并对这些结果进行细节调整.

**Type:** 学习
**Languages:** Python (stdlib, bootstrap-loop 模拟器)
**Prerequisites:** Phase 13 · 01-03 (Reasoning and CoT), Phase 15 · 01 (long-horizon 框架)
**Time:** ~60 分钟

## 问题

教模型进行推理的直接方式是收集人类编写的推理痕迹.

根据已知答案给它们打分,会怎么办?循环是:

1. 采样一个推理的痕迹 和答案.
2. 如果最终答案是正确的,就留下这个痕迹.
3. 在保留下来的痕迹上细调.
4. 复制

它有效. GSM8K 和 CommonsenseQA 都在没有新增人工标记的情况下获得提升. 但这个循环有一个内置偏差:任何产生正确答案的理性都会保留,无论推理本身是否可靠.

## 概念

### 启动的结果

从一个有某种弱的推理能力的基础模型开始. 在每个训练问题上,采用一个逻辑和答案.

如果模型永远无法回答某个问题,这个循环就无法从中学习.**rationalization**对于模型失败的问题,把正确答案作为提示注入,并重新提示模型产生一个导向该答案的理性.

原论文结果 (Zelikman等人, 2022):一个GPT-J基模型通过多轮带合理化的STaR,在 GSM8K上升从5.8%升至10.7%,绝对升至约5个百分点.在 CommonsenseQA上,STaR训练的GPT-J 6B达到72.5%,接近精细调的GPT-3 175B (~73%),而后者是在人工标注理性的上训练的模型,规模大约30倍.

### 通过DPO 训练验证器

通过STaR会丢弃错误理性.霍塞尼等人 (2024) 观察到这些也是数据:每一对 (理性, "这是正确的") 都可以训练验证者.

报告的差异:在GSM8K和 MATH上,相比较前的自我改进基线 升级为 +4 到 +17个百分点,其中大部分收益来自将验证器用于推断时间选择,而不是用于额外的发电机细节调整.

### 根据每个代币的内部推理

泽利克曼等人提出:如果模型学习在每个代币位置生成一个短暂的内部理性,而不仅仅是在问题和答案之间,会怎么样?

结果:Mistral 7B 在没有任务特定的细节调整的情况下,在 GSM8K 上的零射 绝对表现从 5.9% 升至 10.9%,CommonsenseQA 从 36.3% 升至 47.2% 模型学会了"什么时候思考":困难代币会得到更长的内部理性;简单代币 几乎没有.

### 为什么三个人都有共同的安全问题

三种方法都用最终答案作为渐进信号. 一个通过有缺陷的推理得到正确答案的推理,无论是利用捷径、猜测,还是使用无法泛化的模式,都会正向强化. 在在分销问题上,这个捷径有效.在在分销问题上,它会默默失效.

通过学习对理性排序来缓解这一点,但验证器是在同一套标签集中训练的. 它可能学会偏好形式的良好但错误推理,而不是诚实的不确定性.

### 对于

| Method | Training signal | Inference cost | Data waste | Known failure mode |
|---|---|---|---|---|
| STaR | 如果正确，则保留 (rationale, answer) | 1x | 丢弃所有错误 rationales | shortcut rationales |
| STaR + rationalization | 上述方法 + 带正确答案提示的重试 | 1x | 更少 | rationalized rationales 可能不可信 |
| V-STaR | STaR + 来自两个类别的 DPO verifier | Nx (best-of-N) | 最小 | verifier 可能强化自信的错误 |
| Quiet-STaR | per-Token rationale + mixing weight | 1.5-3x | 最小 | 仍然是 answer-conditioned Gradient |

### 它在2026年堆中部位置

已经不新了――但这个模式在2025-2026年到处重现――可验证数学问题上的RL (DeepSeek-R1,Kimi-k1.5,o1) 是STaR的答案条件的渐进信号的放大版――过程奖励模型 (Lightman等人,2023年;OpenAI的"让我们一步一步验证") 是过程监督的替代方案――AlphaEvolve (课3) 是面向代码的STaR,只是使用程序评估器 替代标签――达尔文·戈德尔机器 (课4) 是面向代理架构自己的STaR――

了解STaR会让所有这些变得清晰.


```figure
reflection-loop
```

## 使用它

`code/main.py`现在,我们在一个玩具算术任务上运行模拟STaR循环.

- 精度如何随着启动圈上升.
- 捷径如何混入:模拟器包含一个"惰"的理性类,它有40%的时间得到正确答案,但泛化很差.
- 一个验证者 (V-STaR风格) 在推断中如何提供帮助,但无法完全切除在训练期间引入的捷径──

## 交付它

`outputs/skill-star-loop-reviewer.md`帮助你在训练前审计一个拟议的自学推理管道.

## 练习

1. 运行模拟器――将快捷方式频率设为零,然后设为0.4――尽管两次运行都在训练分布上达到>90%,最终精度会相差多少?

2. 给模拟器添加一个持续的OOD测试――从不同分布中抽取问题,并在分销和OOD集上评估启动模型――量化差距――

3. 阅读 Quiet-STaR 论文 (arXiv:2403.09629) 第3节──分别用三句话解释"思想结束"标志 和混合重量头──

4. 对于STaR的保持如果正确的过器与一个过程监督的替代方案相比,后者会独立奖励每个合理的步骤――识别标签成本与可能的质量差异――

5. 设计一个评估,以捕获部署的模型中捷径理性――它不一定完美,但必须能够打破STaR循环强化最简单的捷径――

## 关键术语

| Term | What people say | What it actually means |
|---|---|---|
| STaR | "Self-Taught Reasoner" | 在得到正确答案的模型生成 rationales 上 fine-tune；重复 |
| Rationalization | "Hinted retry" | 注入正确答案，并在 base model 失败的问题上重新 prompt 生成 rationale |
| V-STaR | "Verifier STaR" | 在正确和错误 rationales 上 DPO-train 一个 verifier，并将其用于 inference-time selection |
| Quiet-STaR | "Per-token rationales" | 在每个 Token 位置生成隐藏 thoughts；与 baseline prediction 混合 |
| Answer-conditioned gradient | "Outcome-based signal" | 训练循环奖励最终答案，而不是 reasoning steps |
| Process reward model | "Step-level verifier" | 在 per-step correctness 上训练的 reward model，而不是 outcome；与 STaR 形成对比 |
| Shortcut rationale | "Right answer, wrong reasoning" | 一个通过无法泛化的模式得到标签的 rationale；STaR 会保留这些 |

## 延伸阅读

- [Zelikman et al. (2022). STaR: Bootstrapping Reasoning With Reasoning](https://arxiv.org/abs/2203.14465) 原始论文──
- [Hosseini et al. (2024). V-STaR: Training Verifiers for Self-Taught Reasoners](https://arxiv.org/abs/2402.06457) 加入用于推断时间选择的DPO验证器──
- [Zelikman et al. (2024). Quiet-STaR: Language Models Can Teach Themselves to Think Before Speaking](https://arxiv.org/abs/2403.09629)每代币内部理性
- [Lightman et al. (2023). Let's Verify Step by Step](https://arxiv.org/abs/2305.20050)过程奖励模型,即替代渐进信号.
- [DeepSeek-R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948)可验证任务上的RL将扩展到边境培训.
