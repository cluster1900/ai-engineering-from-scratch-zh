# 宪法 AI 与 RLAIF

> 拜等人提出了一个问题:如果我们把人类标志者替换为一个会阅读原则列表的AI,会怎样?宪法AI有两个阶段:先在宪法约束下进行自我批评和修改,然后从AI反进行RL. 该技术创造了RLAIF这个术语,并用于Claude 1的后培训管道.

**Type:** Learn
**语言：**字符串 (stdlib,玩具自我批评和修订循环)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking)
**Time:** ~60 minutes

## 学习目标
- 描述宪法AI的两个阶段 (批判和修订SFT、来自AI反的RL),以及宪法在每个阶段中的作用.
- 解释为什么使用AI标签 替代人类偏好标签不是更便宜的RLHF,而是会改变管道失败模式.
- 总结2026年克劳德宪法的四层优先结构以及与2023年重写版本相比发生了什么变化.
- 描述宪法分类,以及计算总费从23.7% (v1) 下降到1%.

## 问题
标记者需要标记者――标记者速度慢,有偏见,而且昂贵――你可以通过一个会阅读显式原则的模型来消除标记者――Bai等的宪法AI是这种替代的第一个正式版本――它的效果足够好,到目前为止,每个边境实验室都在后培训中使用某种AI反变体――

问题在于:偏好信号 现在由你正在训练的同类模型生成――标签中的偏见――现在是原则中的偏见,加上标签模型对原则的解释) 可能会被放大,而不是被削弱――课 4 关于缩的论点仍然适用;标签符只是被移到循环内部――

## 概念
### 监督式自我批判与修订

从一个有用但尚未无害的SFT模型开始――给定一个红队提示,模型会产生初始反应――第二个模型――或同一个模型在第二轮中读取从宪法中采用的原则,并批评该反应――第三步会修改反应――回应批评――修改后的反应就是SFT目标――

宪法是原则列表.Bai等人2022年使用了16条原则,包括优先选择危害最小且合乎伦理的反应、避免说教、助手应该是有用的、诚实的、无害的──这组原则刻意保持较小,让批评保持聚焦──

### 阶段2 来自AI反的RL (RLAIF)

生成对完成的.一个反模式会根据采用的宪法原则为每一个完成的.打分.偏好信号是反模型的排序.

RLAIF = 优先信号由AI 生成──管道的剩余部分仍然是RLHF 形状──

### 为什么这不只是更便宜的RLHF

- 标签者偏见 从标记者心理转移为原则解释.AI标签者对诚的解释可能比任何人类更严格或更宽松;这种严格程度将在整个数据集中保持一致.
- 偏好信号具有强大的可读性:你可以阅读原则、批判和修订──人类标签是不透明的──
- 失败模式会改变――Sykophancy 会下降(AI标签器 没有需要讨好用户) ――古德哈特定律 仍然存在(代理现在是模型对原则集 X 的解释,它仍然是不完美的测量) ――

 CAI在2022年的主张是:训练后模型比使用可比数据的RLHF模型更无害,而且几乎同样有用.

### 2026年克劳德宪法 重写

于2026年1月21日,人类组织发布了大幅修改后的宪法.

1. 以解释性推理取代规定性规则──先前的规则──不要生成CSAM) 扩展为原则+推理──因为它会伤害儿童,...),并期望模型得到普遍化──
2. 四层优先结构:
   - 阶级1:避免灾难性结果(大规模伤亡、关键基础设施)
   - 层次2:遵循安卓的指导方针,操作员优先,平台规则)
   - 级3:广义伦理(标准HHH)。
   - 级4:有帮助的和坦率的
   冲突自上而下解决.
3. 首个主要实验室对模型道德地位不确定性的正式承认 (关联到18期·19期模型福利)
4. 以CC0 1.0 发布.其他实验室可不受限制使用或改编.

### 宪法分类器

另一条并行工作路线是:不是改变模型的后培训,而是训练读取宪法并关门 模型输出的轻量级分类器──v1(2023) 的计算上为23.7%──v2(2026) 约为~1%,并且在人类公开测试的所有防御中具有最低的成功攻击率──截至2026年初,尚未报告通用 jailbreak──

这是一个分层防御模型:CAI 塑造行为;分类者 执行变量.

###  CAI 在谱系中的位置

- 导语GPT:人类预科,RM,PPO
- 通过原则生成的AI前、RM、PPO──
- /家族:在人或人工智能上,
- 自我回报,自我批评:原则被内部化,模型扮演多个角色.

这轴线是从哪里──CAI的2022年论文是边界规模上第一次严格地从人类信号转向人工智能信号──


```figure
constitutional-ai
```

## 使用它
`code/main.py`在玩具词典上模拟CAI的批评-修订循环──一个原则会标记有害的集中的代币──给定初始反应,批评会识别有害的代币,修订会替换它们──经过200次代后,训练模型已内部化了修订规则──在持久的提示集上比较基本模型、RLHF形玩具和CAI形玩具──

## 交付它
本课会生成`outputs/skill-constitution-writer.md`△给定一个领域:客户支持,医疗咨询,编码助理,研究工具,根据2026年克劳德的结构起草四层宪法:防灾,平台规则,域道德,帮助性.

## 练习
1. 运行`code/main.py`△将对基模型的有害代币比率与CAI训练的版本进行比较.

2. 阅读人类的2026年宪法 (www.anthropic.com/news/claudes-constitution) 列出应归纳在1级的原则和应归纳在4级的原则为什么优先结构对冲突很重要?

3. 为人工智能编码助理 设计一条宪法――指定一级:未经批准破坏性命令) ‧二级:三级:四级:每个级:保持3-5条原则――

4. 通过AI标签,代替人类标签. 指出,在RLAIF中可能发生的类似缩性失败模式,并为此设计了一个检测.

5. 阅读宪法分类器 v2方法论 (如果可用) 解释为什么~1%的计算费用与23.7%相比,是一种不同性质的安全叙事.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Constitutional AI | “用原则训练的 AI” | 两阶段 pipeline：self-critique-and-revise SFT，然后来自 AI feedback 的 RL |
| RLAIF | “没有人的 RLHF” | 使用由 AI labeler 生成的 preferences 的 RL；pipeline 的其余部分不变 |
| Constitution | “那些原则” | critique/labeler model 会参考的自然语言规则有序列表 |
| Critique-and-revise | “SFT loop” | 生成 response → 根据某条 principle 进行 critique → revise → SFT target |
| Constitutional Classifier | “output gate” | 轻量级 classifier，用 constitution 评估 outputs 并进行 block/log |
| Four-tier priority | “冲突解决器” | 2026 Claude constitution 层级：catastrophic > platform > ethics > helpful |
| Feedback model | “AI labeler” | 读取 principle 并对一对 completions 排序的模型 |

## 延伸阅读
- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback (arXiv:2212.08073)](https://arxiv.org/abs/2212.08073) 原始的两阶段管道
- [Anthropic — Claude's Constitution (Jan 2026)](https://www.anthropic.com/news/claudes-constitution) 2026 四层重写版本,CC0 1.0
- [Anthropic — Constitutional Classifiers (2024-2026)](https://www.anthropic.com/research/constitutional-classifiers) v2 中 开销 约为 ~ 1% 的输出门 防御
- [Lee et al. — RLAIF vs RLHF: Scaling Reinforcement Learning from Human Feedback (arXiv:2309.00267)](https://arxiv.org/abs/2309.00267) RLAIF / RLHF 的实证比较
- [Kundu et al. — Specific versus General Principles for Constitutional AI (arXiv:2310.13798)](https://arxiv.org/abs/2310.13798) 粒度影响原则
