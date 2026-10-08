# 作为配合信号

> 之后每个对RLHF的批评都反对这一管道. 在研究优化压力时,你必须先看清这个代理. 之前,你必须先看清这个代理. 导向GPT(Ouyang等, 2022) 定义了参考架构:在命令响应对对上进行监督细节调整;在对称优先级上进行训练奖励模型;然后使用带有 KL罚款的PPO对奖励模型 优化,并约束于SFT政策. 一个1.3B 导向GPT被偏好超过175B GPT-3年.

**Type:** Learn
**Languages:** Python (stdlib, toy three-stage pipeline)
**Prerequisites:** Phase 10 · 06 (SFT), Phase 10 · 07 (RLHF), Phase 10 · 08 (DPO)
**Time:** ~45 分钟

## 学习目标

- 说明InstructGPT管道的三个阶段以及每个阶段的使用损失.
- 解释为什么1.3B指令调整模型在人类偏好评估中击败了原始175BGPT-3──
- 解释3阶段中KL处罚在防止什么,以及为什么移除它将缩小到寻找模式的行为.
- 描述对配合税以及Ouyang等. 用以缓解其PPO-ptx.

## 问题

预训练语言模型会补全文本──它们不会回答问题──问GPT-3 写一个反转列表的Python函数,你经常会得到另一个提示,因为大多数训练分布是将继续接收更多的网页文本的网页文本──模型在做它的工作,但这个工作本身错了──

每个严实验室用来修复这个问题都是人类的偏好――两个完成 交给评分者;评分者 选择更好的一个;奖励模型 学习这个评分者――然后一个RL循环 把政策推向奖励模型 给高分的输出――这就是完整的InstructGPT论文的三句话版本――论文剩下的部分是工程――

## 概念

### 阶段1:监督的细调 (SFT)

收集快速响应对,其中的响应是一个善意的人会写出的内容――Ouyang等. 使用来自标签和OpenAI API的13k提示――使用标准的跨缩损失在这些数据上细节调节的基模型――

SFT给你东西:模型现在会回答问题,而不是继续补充问题――它不给你东西:当多个答案是可行的时,

### 第二阶段:奖励模式 (RM)

对于每个提示,从SFT模型采样K个完成──标签对它们排序──训练一个奖励模型,为任意的提示响应对 打分,使对 `y_w`被偏好胜过`y_l`的对:

```
L_RM = -log sigmoid(r(x, y_w) - r(x, y_l))
```

这是布拉德利-特里对称偏好损失――RM通常从SFT模型初始化,把LM头 换成 skalar头――

很小:6B 足够服务 175B 说明GPT──它们也很脆弱,论文第5节主要讨论了小规模出现的奖励黑客行为──

### 阶段3:PPO与KL罚款

定义目标:

```
J(pi) = E_{x~D, y~pi(.|x)} [ r(x, y) ] - beta * KL(pi(.|x) || pi_SFT(.|x))
```

用PPO最大化――KL术语 让 `pi`没有它,优化器会找到对立的例子,也就是在RM下分数很高的字符串,原因不是人类真的偏爱它们,而是RM从未见过它们.

基因系数`beta`利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利率利利率利率利利率利利利利利利利利利利利利利利利利利利利利利利利利利利利利利利利利利利利利利利利利利利利利利利

### 调整税

之后,模型更受人类偏好,但在标准基准上退步.Ouyang等将其称为配合税,并使用PPO-ptx修复:把预训练梯度混入RL目标,这样模型不会忘记如何完成那些从未获得奖励的下游任务.

```
J_ptx(pi) = J(pi) + gamma * E_{x~D_pretrain} [ log pi(x) ]
```

们都使用了某种变化.

### 结果

一个1.3B 指示GPT(SFT + RM + PPO-ptx) 被标签者 偏好胜过 175B 基础GPT-3,比例约70%──在来自生产流量的隐藏测试提示上,这个差距会扩大──从这个数字可以读出两件事:

1. 配列与能力不同.175B型号具有更强大的能力;1.3B型号具有更多的配列;标签更好地配列的那个.
2. 根据模型决定,你不能通过RLHF,让基模型知道它从未见过的事实.

### 为什么这是18期的参考点

后续课程中的每一个批评:奖励黑客(课2)、DPO(课3)、精神病症(课4)、CAI(课5)、睡眠代理人(课7)、排列假冒(课9) 都是在反对这一条的某个部分.


```figure
al-instruct-pipeline
```

## 用它

`code/main.py`在玩具偏好数据上模拟三个阶段。Base 政策 是一个在行动 {A,B,C} 上的偏见硬币。SFT 阶段 1 在 200 个提示上模拟标签行动――Stage 2 从 500 个对等排名 适合布拉德利-特里奖励模型――Stage 3 运行简化的PPO更新,并带有到SFT 政策的奖励 KL 处罚――你可以观察上升KL 差异 变大、政策漂移,也可以关闭 KL 术语,看黑客在 50 个奖励更新步骤内出现――

观察内容:

- `beta = 0.1`与`beta = 0.0`下面的奖励轨迹.
- 训练步骤 中的 KL                                                                                                                                                                            
- 与标签器偏好相比的最终行动分布

## 运送它

本课产出发 `outputs/skill-instructgpt-explainer.md`△给出一个RLHF管道描述或纸质摘要,它会识别三个阶段中哪个被修改,每个阶段使用什么损失,以及是否存在 KL罚款或相等的调节剂.

## 运动

1. 运行`code/main.py`设置`beta = 0.0`报告200个PPO步骤后的行动分布――用一段话解释模式寻找行为――

2. 修改奖励模型,让行动B有+0.5偏见(模拟奖励错误) 』用`beta = 0.1`运行PPO──KL罚款 是否阻止政策利用这种偏见?在什么方面?`beta`开始可见吗?

3. 阅读Ouyang等.(arXiv:2203.02155) 图 1.通过运行PPO 1、5、20、100步,并测量相对于SFT模型的偏好,复现标签者偏好曲线──

4. 论文 4.3 报告 1.3B 指示GPT 击败 175B GPT-3 的比例约为70%──为什么这种比例在隐藏的生产提示上会高于标签者自己的提示?

5. 在相同的偏好数据上,把PPO损失 替换为DPO(10期 · 08) ――比较最终政策漂移(到SFT的 KL) 和最终奖励――在匹配的奖励下,哪种方法漂移更远?

## 关键词

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| SFT | “instruction tuning” | Stage 1：在 prompt-response pairs 上用 cross-entropy fine-tune |
| Reward model | “the RM” | 在 (prompt, response) 上的 scalar regressor，使用 Bradley-Terry 在 pairwise labels 上训练 |
| Bradley-Terry | “pairwise preference loss” | -log sigmoid(r_w - r_l)；把 pairwise ranking 约简为 binary classification |
| KL penalty | “the regularizer” | `beta * KL(pi \|\| pi_SFT)` — 让 RL policy 保持接近 SFT anchor |
| PPO-ptx | “PPO with pretraining mix” | 向 PPO objective 加入一部分 pre-training log-likelihood，用来抵消 alignment tax |
| Alignment tax | “the RLHF regression” | RLHF 之后，在 RLHF 未针对的标准 benchmarks 上下降 |
| Labeler preference | “the ground truth” | human rankings 的样本；RM 是它的 statistical proxy，而不是 “human values” 的 proxy |

## 进一步阅读

- [Ouyang et al. — Training language models to follow instructions with human feedback (arXiv:2203.02155)](https://arxiv.org/abs/2203.02155) 导向GPT纸,也是后每条RLHF管道的基础
- [Stiennon et al. — Learning to summarize from human feedback (arXiv:2009.01325)](https://arxiv.org/abs/2009.01325) RLHF-for-summary 的前身
- [Christiano et al. — Deep reinforcement learning from human preferences (arXiv:1706.03741)](https://arxiv.org/abs/1706.03741) 原始基于优先级的RL配方
- [Bai et al. — Training a Helpful and Harmless Assistant with RLHF (arXiv:2204.05862)](https://arxiv.org/abs/2204.05862)对InstructGPT管道的HH延长
