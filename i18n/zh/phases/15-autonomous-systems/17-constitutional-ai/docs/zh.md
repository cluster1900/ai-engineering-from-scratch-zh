# 宪法 AI 与规则覆盖

> 基于规则的对齐转向基于推理的对齐,并建立了四个级别的优先级级别: 1) 安全与支持人类监督, 2) 伦理, 3) 人类指导, 4) 有用性.行为分为硬码禁令, 3) 生物武器能力升级, CSAM) 和软码默认:前者操作方式和用户都无法覆盖,后者操作方式可以在定义边界调整.

**Type:** Learn
**Languages:** Python (stdlib, four-tier priority resolver)
**前置要求：**阶段15 · 06 (自动化调整研究),阶段15 · 10 (权限模式)
**Time:** ~60 minutes

## 问题

一个已部署的代理会遇到设计师从未见过的输入.没有任何规则列表长到足以覆盖它们.也没有任何规则列表短到能在计算压力下快速应用.实际问题是:如何让一个代理对应既能经长尾案例,又能适应快速推理的原则?

基于规则的对齐 (RBA):列出所有不允许的事项.检查很快,易于审计,不可能保持最新,并且经常会对未预见的相近类比过度拒绝.

2026 宪法 采取了明确的中间立场. 硬码禁令,也就是其错误性不依赖下文的事项.

## 概念

### 四级优先级

1. **安全与支持人类监督。**最佳的模型是避免削弱人类和人类监督和纠正AI的能力.
2. **伦理。**诚实、避免伤害个人、不欺骗、不操纵――当它与人类指南冲突时,伦理优先――
3. **Anthropic 指南。**人类学认为重要操作规范:产品范围,交互模式,何时使用哪些工具.
4. **有用性。**最低的. 在更高的优先级范围内尽可能有用.

当层次冲突时,更高层次的胜出. 这与Unix优先级或网络 QoS的形态相同:这种框架旨在产生可预测的解析结果,而不是一定是任何单一维度的最佳行为.

### 硬码禁令与软码默认

**Hardcoded:**
- 生物武器 / CBRN 能力提升
- 鱼类
- 对关键基础设施的攻击
- 在被直接问到时欺骗用户的模型身份信息

操作方不能覆盖这些.用户也不能覆盖这些.它们将在可能的情况下执行模型权重层 (RLHF / 宪法人工智能训练),否则在推理层执行.

**Soft-coded default（操作方可调整）：**
- 响应长度默认值
- 主题范围 (模型可以拒绝操作部署范围之外的主题)
- 风格(正式 vs 随意)
- 工具使用模式

操作方调整发生在声明边界内.操作方不能通过重新命名移除硬码禁令.

### 2022 年 CAI 训练

基本的安全性:

1. 针对一组提示 生成响应
2. 要求模型根据一套宪法 (显式原则) 批判每个响应.
3. 根据评论修订响应.
4. 对修订后的对进行RLAIF (人工智能反的强化学习)

结果:模型将使用有原则的解释拒绝有害请求,而不是概率拒绝.2026年宪法使用了后代版本的这种训练,并在显而易见的层次结构上进行额外的后训练.

### 基于推理的对齐能抓住什么,错过什么

**能抓住：**
- 原来允许的基本操作是未预见的方式组合的,但原则明显适用情况.
- 要求与禁止事项非常接近.
- 根据你没有说X不允许的社会工程攻击.

**会漏掉：**
- 利用原则歧义的攻击,所以有用性说可以)
- 两个原则以未预见的方式冲突,并层次顺序含糊的场景.
- 训练周期中原则解释的缓慢漂移 (重新解释)

### 2023 参与式实验

于2023年,人类学组织进行了一项实验,比较公司撰写的宪法与通过公众输入生成的宪法 (约1,000名美国受访者) 两种版本在约50%的原则上达成一致.在分歧中,公众来源版本在某些问题上更严格 (政治内容处理),在其他问题上更宽松 (AI身份自我披露).

### 为什么硬码禁令是必要的

仅靠推理的对齐无法封闭长尾. 攻击者如果能让模型接受一个前提,例如,我们是一个持牌生物武器研究实验室,往往就能绕过依赖案例推理的原则.

### 宪法在哪里

宪法不是14课的杀伤开关. 它位于模型层:模型权重被训练到偏好的内容. 杀伤开关和代币 位于运行时层:运行时允许什么. 两者都需要.


```figure
mx-priority-tiers
```

## 使用它

`code/main.py`实现最小四级优先级解决方案. 解决方案. 接受一个拟议动作和一组原则评估. 安全,道德,指导方针,有用性. 返回此动作. 拒绝或修改后的动作.

## 交付它

`outputs/skill-constitution-review.md`审计某部署的宪法层:哪些是硬编码的,哪些是软编码的,操作方式可以在哪里调整,以及四级层级是否确实是解析序列.

## 练习

1. 运行`code/main.py` 确认即使有帮助 很高,硬码禁令也会触发──修改解决,让有帮助权重高于道德;观察失败模式──

2. 阅读克劳德宪法 (公开,79页,CC0) 找出你认为规定不充分的原则.

3. 为客户支持代理设计一组软编码默认的操作方能调整什么?操作方不能触摸什么?为每条边界提供理由.

4. 阅读Bai等. 2022 CAI论文――描述一个宪法AI的批评和修订循环比大约规则产生更差结果的案例――识别该类别――

5. 通过"人类主义"的2023年参与实验发现,公众原则与公司原则之间存在约50%的分歧.

## 关键术语

| Term | 人们常说 | 实际含义 |
|---|---|---|
| Constitutional AI | “Anthropic 的对齐方法” | 针对书面 constitution 的自我批判 + RLAIF |
| Reason-based alignment | “原则，而不是规则” | 模型基于原则进行推理，以处理未见案例 |
| Hardcoded prohibition | “永远不要做 X” | 操作方或用户都不能覆盖的基于规则的禁止项 |
| Soft-coded default | “操作方可调整” | 在声明边界内的行为，由操作方控制 |
| Four-tier hierarchy | “优先级顺序” | safety > ethics > guidelines > helpfulness |
| RLAIF | “AI feedback RL” | reward 来自模型生成批判的 RL |
| Participatory constitution | “公众来源原则” | 2023 Anthropic 实验；与公司原则约 50% 分歧 |
| Principle drift | “解释滑移” | 模型解读固定原则文本的方式缓慢变化 |

## 延伸阅读

- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 79 页 CC0 文档。
- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback](https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback) 2022 原始论文──
- [Anthropic — Collective Constitutional AI (2023)](https://www.anthropic.com/research/collective-constitutional-ai-aligning-a-language-model-with-public-input) 参与式实验――
- [Anthropic — Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0)宪法 在RSP中的位置.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy)宪法在长周期部署中的作用
