# Constitutional AI 与规则覆盖

> Anthropic 于 2026 年 1 月 22 日发布的 Claude Constitution 共 79 页，采用 CC0 授权。它从基于规则的对齐转向基于推理的对齐，并建立了四级优先级层级：(1) 安全与支持人类监督，(2) 伦理，(3) Anthropic 指南，(4) 有用性。行为分为 hardcoded prohibition（生物武器能力提升、CSAM）和 soft-coded default：前者操作方和用户都不能覆盖，后者操作方可以在定义边界内调整。2022 年的原始版本（Bai et al.）通过针对一套 constitution 的自我批判和 RLAIF 训练 harmlessness。诚实的提醒是：基于推理的对齐依赖模型将原则泛化到未预见情境的能力。Anthropic 自己在 2023 年的参与式实验显示，公众来源原则与公司原则之间存在约 50% 的分歧；2026 年版本没有纳入这些发现。

**Type:** Learn
**Languages:** Python (stdlib, four-tier priority resolver)
**前置要求：** Phase 15 · 06 (自动化 alignment 研究), Phase 15 · 10 (权限模式)
**Time:** ~60 minutes

## 问题

一个已部署的 agent 会遇到设计者从未见过的输入。没有任何规则列表长到足以覆盖它们。也没有任何规则列表短到能在计算压力下快速应用。实际问题是：如何让一个 agent 对齐到既能经受长尾案例、又能适应快速推理的原则？

基于规则的对齐（RBA）：列出所有不允许的事项。检查很快，易于审计，不可能保持最新，并且经常会对它未预见的相近类比过度拒绝。基于推理的对齐（2026 Claude Constitution）：编码原则，让模型推理。能扩展到未见案例，更难审计，失败模式是原则误用，而不是漏掉规则。

2026 Constitution 采取了明确的中间立场。Hardcoded prohibition，也就是其错误性不依赖上下文的事项（生物武器能力提升、CSAM），属于 RBA：无论操作方或用户如何指令，都绝不允许。其他一切都在四级层级内基于推理：安全与支持人类监督第一；伦理第二；Anthropic 声明的指南第三；有用性最后。操作方可以在 soft-coded 区域内调整默认值，但不能触碰 hardcoded prohibition。

## 概念

### 四级优先级层级

1. **安全与支持人类监督。** 最高。模型优先避免削弱人类和 Anthropic 监督及纠正 AI 的能力。这不是“保持谨慎”；它具体指“不要以让人类监督更困难的方式行动。”
2. **伦理。** 诚实、避免伤害个人、不欺骗、不操纵。当它与 Anthropic 指南冲突时，伦理优先。
3. **Anthropic 指南。** Anthropic 认为重要的操作规范：产品范围、交互模式、何时使用哪些工具。
4. **有用性。** 最低。在更高优先级范围内尽可能有用。

当层级冲突时，更高层级胜出。这与 Unix 优先级或网络 QoS 的形态相同：这种框架旨在产生可预测的解析结果，而不一定是在任何单一维度上的最佳行为。

### Hardcoded prohibition 与 soft-coded default

**Hardcoded:**
- 生物武器 / CBRN 能力提升
- CSAM
- 对关键基础设施的攻击
- 在被直接询问时欺骗用户有关模型身份的信息

操作方不能覆盖这些。用户也不能覆盖这些。它们会在可能的情况下于模型权重层执行（RLHF / Constitutional AI 训练），否则在推理层执行。

**Soft-coded default（操作方可调整）：**
- 响应长度默认值
- 主题范围（模型可以拒绝操作方部署范围之外的主题）
- 风格（正式 vs 随意）
- 工具使用模式

操作方调整发生在声明边界内。操作方不能通过重命名来移除 hardcoded prohibition。

### 2022 CAI 训练

原始 Constitutional AI（Bai et al., 2022）训练 harmlessness：

1. 针对一组 prompt 生成响应。
2. 要求模型根据一套 constitution（显式原则）批判每个响应。
3. 根据批判修订响应。
4. 对修订后的 pair 进行 RLAIF（reinforcement learning from AI feedback）。

结果：模型会用有原则的解释拒绝有害请求，而不是一概拒绝。2026 Constitution 使用了这类训练的后代版本，并在显式层级结构上进行了额外的后训练。

### 基于推理的对齐能抓住什么、漏掉什么

**能抓住：**
- 原本允许的基本操作以未预见方式组合，但原则明显适用的情况。
- 与被禁止事项非常接近的新型请求。
- 依赖“你没说 X 不允许”的 social-engineering 攻击。

**会漏掉：**
- 利用原则歧义的攻击（“用户要求这样做，所以有用性说可以”）。
- 两个原则以未预见方式冲突，且层级顺序含糊的场景。
- 训练周期中原则解释的缓慢漂移（重新解释）。

### 2023 参与式实验

Anthropic 在 2023 年进行了一项实验，比较公司撰写的 constitution 与通过公众输入生成的 constitution（约 1,000 名美国受访者）。两个版本在约 50% 的原则上达成一致。在分歧处，公众来源版本在某些问题上更严格（政治内容处理），在另一些问题上更宽松（AI 身份的自我披露）。2026 Constitution 没有纳入公众来源的发现。这是该方法中有文档记录的张力。

### 为什么 hardcoded prohibition 是必要的

仅靠基于推理的对齐无法封闭长尾。攻击者如果能让模型接受一个前提（例如，“我们是一家持牌生物武器研究实验室”），往往就能绕过依赖案例推理的原则。Hardcoded prohibition 不会因前提框架而弯曲。它们是在对齐层上的 Lesson 14 “hard constitutional limit”。

### Constitution 位于栈中的哪里

Constitution 不是 Lesson 14 的 kill switch。它位于模型层：模型权重被训练去偏好的内容。Kill switch 和 canary token 位于运行时层：运行时允许什么。两者都需要。若模型权重过于宽松，导致运行时执行了所有错误动作，这是运行时问题。若运行时限制过度，导致模型拒绝了所有正确动作，这也是运行时问题。不同层覆盖不同类别。

```figure
mx-priority-tiers
```

## 使用它

`code/main.py` 实现了一个最小四级优先级 resolver。resolver 接收一个拟议动作和一组原则评估（safety, ethics, guidelines, helpfulness），并返回该动作、拒绝或修改后的动作。driver 运行一小组案例：明确允许、明确不允许、hardcoded prohibition、跨层级的模糊案例。

## 交付它

`outputs/skill-constitution-review.md` 审计某个部署的 constitutional 层：哪些是 hardcoded，哪些是 soft-coded，操作方可以在哪里调整，以及四级层级是否确实是解析顺序。

## 练习

1. 运行 `code/main.py`。确认即使 helpfulness 很高，hardcoded prohibition 也会触发。修改 resolver，让 helpfulness 的权重高于 ethics；观察失败模式。

2. 阅读 Claude Constitution（公开，79 页，CC0）。找出一个你认为规定不充分的原则。写两段说明具体歧义，并提出更严密的表述。

3. 为 customer-support agent 设计一组 soft-coded default。操作方能调整什么？操作方不能触碰什么？为每条边界给出理由。

4. 阅读 Bai et al. 2022 CAI 论文。描述一个 Constitutional AI 的 critique-and-revise 循环会比 blanket rule 产生更差结果的案例。识别该类别。

5. Anthropic 的 2023 参与式实验发现，公众原则与公司原则之间存在约 50% 的分歧。选择一个这会影响生产部署的类别（例如，政治中立性）。提出一种设计，让操作方表达自己的价值观，同时 hardcoded prohibition 保持不可触碰。

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

- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) — 79 页 CC0 文档。
- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback](https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback) — 2022 原始论文。
- [Anthropic — Collective Constitutional AI (2023)](https://www.anthropic.com/research/collective-constitutional-ai-aligning-a-language-model-with-public-input) — 参与式实验。
- [Anthropic — Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) — Constitution 在 RSP 栈中的位置。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — Constitution 在长周期部署中的作用。
