# 自我精炼和批判:代式输出改进

> 通过将验证路由到外部工具来强化反步骤. 到2026年,这种模式将以"评估者优化器" () 类 () 或防护圈 () 形式出现在每个框架中.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 03 (Reflexion)
**Time:** ~60 分钟

## 学习目标

- 解释为什么对精炼提示很重要.
- 解释Critic的关键洞见:没有外部的基础,LLMs 在自我验证上不可靠.
- 实现一个带历史和可选外部验证器的自定义循环.
- 将这种模式映射到Anthropic的评估者优化器工作流程和OpenAI代理SDK的输出防护窗口.

## 问题

一个代理生出了一个几乎正确的答案――也许某行代码有语法错误――也许总结太长――也许计划错过了一个边缘案例――你想要的是:代理批评自己的输出,然后修复它――

自我清理 表明:使用单个模型、不需要培训数据、不需要RL,也能做到这一点――但有一个问题:LLM不擅长硬实实做自我验证――Critic 命名这个修复方案:把验证 步骤路由到外部工具 (搜索,代码解释器,计算器,测试运行者) .

这两篇论文共同定义了2026年代式改进的默认模式:生成,验证,清理,通过时停止.

## 概念

### 其他类型的产品:

一个法学士,三个角色:

```
generate(task)            -> output_0
feedback(task, output_0)  -> critique_0
refine(task, output_0, critique_0, history) -> output_1
feedback(task, output_1)  -> critique_1
refine(task, output_1, critique_1, history) -> output_2
...
stop when feedback says "no issues" or budget exhausted.
```

关键细节:`refine`报纸的历史,质量会急剧下降.

核心结果:在7个任务中平均带来+20的绝对提升,包括GPT-4──无需培训──无需外部工具──单个模型──

### 评论: 评论: 评论:

对于事实性说法而言,这并非不可靠的.`verify(task, output, tools)`替换`feedback(task, output)`在其中`tools`包括:

- 根据事实性索赔的搜索引擎.
- 用代码正确的代码解释器.
- 通过算术的计算器.
- 特定领域的验证器 (单位测试,类型检查器,灯具)

验证器会基于工具结果生成结构化批评――然后精炼器基于这个批评进行改写――

核心结果:CRITIC 在事实性任务上优于自我清理,因为批判有基础. 在没有外部验证者的任务上,

### 停止条件

两种常见形态:

1. **Verifier 通过。**外部测试 返回成功.有可用条件时首选.
2. **没有发出 feedback。**模型说 输出很好. 成本更低但不可靠;要搭配最大代 cap──

2026 默认做法:组合二者── 如果验证器通过,或模型说好且反复 >= 2,或反复 >= max_iterations,则停止──

### 评价者-优化器 (Anthropic, 2024)

于2024年12月的文章中,人类学将其命名为五种工作流程模式之一.

- 评价者:给输出打分并产生批评.
- 根据评论 修订输出.

循环直到评估者通过. 这就是人类表述中的自我清理/关键.

### 开放AI代理SDK输出防护护

作为"输出护"提供了这一模式. 护是在代理的验证器.`OutputGuardrailTripwireTriggered`),输遇被拒绝,代理可以再试.

### 2026 年的坑

- **Rubber-stamp loops。**采用不同的提示,或使用更小的模型做批判.
- **过度 refine。**每次精炼都会增加延迟和代币.
- **在 trivial tasks 上使用 CRITIC。**如果没有外部验证器,Critic会退化为自定义;不要为 stub验证器支付延迟.


```figure
self-refine
```

## 构建它

`code/main.py`在一个玩具任务上实现自我清洗 和 CRITIC:给定话题,生成一个简短的弹药列表――verifier 检查格式(3个弹,每个小于60个字符) ――CRITIC 增加一个外部的 事实验证,用于惩罚已知的幻觉──

组件:

- `generate`剧本制作人──
- `feedback` 法学士式的自我批评
- `verify_external`Critic类型的基层验证器──
- `refine`根据历史的历史,
- 通过或最多 4 次代.

运行:

```
python3 code/main.py
```

比较自我清洗和批判的运行结果――CRITIC 捕捉到自我清洗 漏掉的事实错误,因为外部验证者 拥有自我批评 不具备的基础――

## 使用它

通过克劳德友好的语言表述这一模式――OpenAI Agents SDK的输出屏蔽呈CRITIC形态,屏蔽可调用工具.

## 交付它

`outputs/skill-refine-loop.md`根据任务形状,验证器可用性和代预算配置评估器-优化器循环,输出生成器,评估器/验证器和优化器的提示以及停止政策.

## 练习

1. 运行这个玩具. 关键 仍然有帮助吗?
2. 换个外观验证器 换成噪音验证器 (随机 30% 假阳性) 圈会怎样?这是2026年大多数护堆的现实.
3. 实现一个不同模型的生成器批评 变体:大模型 生成,小模型批评.
4. 阅读Critic Section 3 ((arXiv:2305.11738 v4) 〕说出三类验证工具类别,并为每类给出一个例子――
5. 将OpenAI代理 SDK 的`output_guardrails`映射到Critic的验证器角色.SDK做错了什么,又做了什么?

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|----------------|------------------------|
| Self-Refine | “会修复自己的 LLM” | 在一个 model 中执行 Generate -> feedback -> refine loop，并带 history |
| CRITIC | “Tool-grounded verification” | 用外部 verifier（search、code、calc、tests）替换 feedback |
| Evaluator-Optimizer | “Anthropic workflow pattern” | 两个角色：evaluator 打分，optimizer 修订，并循环到收敛 |
| Output guardrail | “Post-hoc check” | OpenAI Agents SDK validator，在 agent 生成输出后运行 |
| Verify step | “Critique phase” | 承重决策点：grounded 还是 self-rated |
| Refine history | “Model 已经尝试过的内容” | 先前 outputs + critiques 被前置到 refine prompt；去掉后质量会崩塌 |
| Rubber-stamp loop | “Self-agreement failure” | 相同 prompt 的 critique 返回 “looks good”；用结构上不同的 prompts 修复 |
| Stop condition | “Convergence test” | Verifier 通过，或没有 feedback 且达到 iteration cap；绝不能只有单一条件 |

## 延伸阅读

- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) 经典纸
- [Gou et al., CRITIC (arXiv:2305.11738)](https://arxiv.org/abs/2305.11738)基于工具的验证
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)评估者-优化器工作流程模式
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) 作为Critic型验证器的输出护
