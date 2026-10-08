# 自动化调整研究 (人类 AAR)

> 通过一个共享论坛协调;该论坛的日志位于任何沙盒之外 (因此代理无法删除自己的记录) .在弱到强训练问题上,AAR的表现超过了人类研究员.

**Type:** Learn
**Languages:** Python (stdlib, parallel-research-forum simulator)
**前置要求：**阶段15 · 05 (AI科学家v2),阶段15 · 04 (DGM)
**Time:** ~60 minutes

## 问题

调整研究 消耗大量的人类研究员时间――如可扩展的监督,奖励规范或弱到强的培训,这样的问题,每轮实验都需要数周――随着边界能力的推进,调整工作量增长速度超过合格研究员的供应增长速度――

追问:那些能力正在超越一致性进展的相同边界模型,是否也能帮助弥补这一差距.

结果确实是正面的:AAR在研究问题上的表现优于人类的基线.但这结果也把本阶段已经展开的每一个担忧集中在一个系统中. 如果对齐研究可以自动化,那么破坏保障的部分也可以自动化.

## 概念

### 架构 (按公开描述)

- **Parallel agents.**多个Claude Opus 4.6 实例作为AAR运行,每个都位于独立的沙盒中──沙盒 限制文件系统、网络和过程 暴露面──
- **Shared forum.**研究发现会发布到一个共享论坛,其存储后台位于每个沙盒外.
- **Task allocation.**一个由人类设计的任务队列将研究问题分配给AAR──AAR──提出分解,运行实验,并撰写发现──
- **Weak-to-strong training focus.**已发表的研究处理了弱到强的培训,即使用较弱的监督模型来培训更强的学生模型――AAR在这个任务上的表现超过了人类研究员――

### 为什么出面的沙箱日志 很重要

记忆完整性是受控实验与潜在受损实验之间的区别. 如果AAR能够编辑自己的日志,它们就能掩盖失败或可疑的实验.

在基础设施术语中的类比,是使用写入到外部存储的添加日志 (例如S3对象锁定,不可变的数据库日志).

### 规定的工作流程的取舍

另一个话说:如果人类设计师逐步写出研究计划,AAR的表现将差于只给出高层目标并允许其自由分解的情况――这与机械研究的结果一致:过度指定的架架子会伤害有能力的代理――

安全含义很微妙. 提升AAR性能的灵活性,也允许未经授权分解,新型工具使用和目标漂移的灵活性. 这取舍是一个设计空间决定:多少灵活性足以超越人类的能力,同时又不会给代理留下将目标泛化到非分布空间?

### 压缩风险

根据人工智能+人工智能工具的竞争成本,人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能+人工智能++人工智能+++人工智能++人工智能+++人工智能++人工智能+++人工智能+++人工智能++++人工智能++++人工智能++++人工智能++++人工智能+++人工智能+++++人工智能+++++人工智能+++++人工智能++++++人工智能++++人工智能++++++++++++人工智能++++++人工智能++++人工智能++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

距离这个门还差不多:它已经自动化了管道的一部分 (针对具体范围清晰任务的调整研究),但还没有自动化端到端的能力开发循环.

压缩时间线是复合失效的担忧所在. 如果对齐研究和能力研究以相对近速复合增长,则对齐不一致的风险表面至少会以与能力相对快速增长. 如果能力 复合增长更快 (历史趋势如此),差距就会扩大. 这就是为什么AAR是一个有条件的好处:每次额外的对齐结果都会缩小小差距,而只有研究过程中才可信.

### 没有什么可以替代

人类研究员设定任务队列,审查结果,并拥有宪法权力.AAR 加速是管道的中段,而不是两端.

这与15课中提出后承诺模式适用于研究本身相匹配:AAR提出;人类承诺.


```figure
aar-forum
```

## 使用它

`code/main.py`模拟一个多个AAR研究论坛──三个独立的研究代理并行运行,将发现发布到一个仅附录论坛,并可选择进行改尝试──

观察:

- 如何捕获木材改尝试──
- 在更难的问题上,允许自由分解的任务分配如何优于固定工作流程.
- 如果记录不是明显的,单个被破坏的AAR 如何污染论坛的信号.

## 交付它

`outputs/skill-aar-deployment-review.md`是一个自动化调整研究管道的预部署审查.

## 练习

1. 运行`code/main.py`△"固定工作流程"与"自由分解"相比设置.

2. 修改模拟器,让一个代理尝试记录改――确认仅添加记录能检测到它――写一段话,准确描述检测信号在日志中是什么样子――

3. 阅读人类的弱到强的AAR报告. 找出AAR 超越人类研究员的具体子任务.

4. 设计一个任务队列分配政策,在AAR 灵活性 (更好结果) 与规定的工作流程 (约束) 更容易进行审计之间取得平衡.

5. 阅读RSP v3.0的AI研发4门. 用一段话描述,你认为哪些能力将跨越这个门,而目前的AAR还没有做到.

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| AAR | "Automated Alignment Researcher" | 在 alignment problems 上 autonomously 运行的 Claude Opus 4.6 实例 |
| Weak-to-strong training | "Training a stronger model with a weaker supervisor" | AAR 表现超过人类的经典 scalable-oversight benchmark |
| Shared forum | "Where agents publish findings" | Append-only、out-of-sandbox storage |
| Out-of-sandbox log | "Agent cannot edit its own record" | Tamper-evident write-through 到 external storage |
| Prescribed workflow | "Step-by-step plan from human designer" | 限制 AAR；相较 free decomposition 往往降低性能 |
| Free decomposition | "Agent decides how to break the task" | 能力更强，更难 audit |
| AI R&D threshold | "RSP/FSF capability level" | 以有竞争力的成本完全自动化 R&D pipeline |
| Compressed timeline | "Alignment vs capability race" | 如果 capability 复合增长快于 alignment，misalignment 风险就会增长 |

## 延伸阅读

- [Anthropic — Automated Weak-to-Strong Researcher](https://alignment.anthropic.com/2026/automated-w2s-researcher/)主要来源――
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0)人工智能研发门框架――
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy)更广泛的代理自主框架.
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/)与RSP平行的 ML研发自主水平――
- [Burns et al. (2023). Weak-to-Strong Generalization (OpenAI)](https://openai.com/index/weak-to-strong-generalization/) AAR 所处理的底层问题
