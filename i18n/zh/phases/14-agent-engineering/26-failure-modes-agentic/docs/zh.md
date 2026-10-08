# 失败模式:代理为什么会失败

> 微软的类别记录了现有AI失败如何在代理场景中被放大.行业现场数据收到五种反复出现的模式:幻觉行为,范围,陷错误,文本损失,工具滥用.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**先修要求：**阶段14 · 05 (自我精炼和批判性),阶段14 · 24 (可观察性)
**Time:** ~60 minutes

## 学习目标
- 描述MASFT的三类失败类别,并在每个类别中至少说明四种具体模式.
- 解释为什么代理失败会放大现有AI失败模式 (偏见,幻觉)
- 描述五种行业反复出现模式及其缓解方法.
- 实现一个失败模式标签的STLB探测器,标记代理痕迹.

## 问题
团队发布的代理在90%的痕迹上都能工作.剩余10%的失败不是随机噪音,而是落入少数重复出现的类别.

## 概念
### 美国国家:

多代理系统失败类别: 聚类为 3个类别: 介绍者科恩的卡帕为 0.88,说明这些类别可以靠谱地区分分.

核心主张:失败是多代理系统中的根本设计缺陷,而不是可以通过更好的基础模型修复LLM限制.

### 微软在代理人工智能系统中故障模式的分类

- 现有AI失败 (偏见,幻觉,数据泄露) 在代理场景中被放大.
- 新的失败来自自主:大规模的意外行动,工具滥用,任务漂移.
- 这份白皮书是代理产品的风险登记.

### 标识人工智能代理中的缺陷 (arXiv:2603.06847)

- 由于组织,内部状态的进化和环境的相互作用而出现的失败.
- 不只是坏代码或坏模型输出.

### 士研究员的幻觉调查 (arXiv:2509.18970)

两种主要表现:

1. **Instruction-following Deviation**代理 没有遵循系统提示.
2. **Long-range Contextual Misuse** 代理 忘记或误用更早轮次的文本.

错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误:错误

### 五种行业反复出现的模式

亚里兹·加利略·尼姆布莱恩2024-2026年现场分析收到:

1. **Hallucinated actions.**代理调用不存在的工具,或编制论点.
2. **Scope creep.**代理将扩展任务到超出用户要求的范围,
3. **Cascading errors.**一次幻觉会触发四次API电话,变成多系统事件.
4. **Context loss.**长周期任务忘记早期轮次的约束.
5. **Tool misuse.**用错误论证调用正确工具,或直接调用错误工具.

场是最致命的. 代理人无法区分我失败了,任务不可能完成,并且经常在400个错误中产生幻觉.

### 减轻:每一步都设置门

在推理链的每一步设置自动验证门,对照环境状态检查事实基础――具体包括:

- 每步安全分类器 (课 21)
- 工具调用参数验证 (课6):
- 交叉检查 (课05号,关键) 
- 通过重新探测状态来检测成功幻觉,文件真的被创建了吗?)

### 容易出错的地方

- **Tagging only crashes.**大多数代理失败会产生有效的产量.
- **No baseline.**没有它,你就无法判断
- **Over-alerting.**每次失败都会产生一个页面.


```figure
failure-cascade
```

## 构建它
`code/main.py`实现一个stdlib失败模式标签:

- 一个覆盖五种模式的合成痕迹数据集.
- 每种模式对应的探测器功能 (工具调用,输出,重复操作上面的签名模式)
- 一个标签,用于标记每条痕迹并报告模式的分布.

运行它:

```
python3 code/main.py
```

输出:每条痕迹的标签+总分布,这是对尼克斯的痕迹集群的低成本复现.

## 使用它
- **Phoenix**为了生产环境漂移集群 (课 24) 
- **Langfuse**用于回放+注释.
- **Custom**基于可观测平台无法检测的域名特定签名.

## 交付它
`outputs/skill-failure-detector.md`生成面向您所在域的故障模式探测器,并连接到追踪商店.

## 练习
1. 添加一个成功幻觉检测器: 代理回归成功,但目标状态没有变化.
2. 标记你构建的某一产品中100条真实痕迹――哪种模式占主导地位?修复成本是多少?
3. 实现一个射线的测量:给定第N步的失败,它影响了下游步骤多少?
4. 阅读 MASFT的14种故障模式选择――三种适用于您的产品模式――编写探测器――
5. 将一个探测器 连接到CI工作:如果>=5%的痕迹被标记为某种模式,则让构建失败.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MASFT | “Multi-agent failure taxonomy” | Berkeley 14-mode categorization |
| Cascading error | “Ripple failure” | 一个早期错误会通过 N 个步骤传播 |
| Context loss | “Forgot the constraint” | 长周期轮次丢失早期轮次事实 |
| Tool misuse | “Wrong tool / wrong args” | 调用有效，但调用方式错误 |
| Success hallucination | “Faked completion” | Agent 在 400 上声称成功；state 未变化 |
| Scope creep | “Overreach” | Agent 做了超出要求的事 |
| Instruction-following deviation | “Disobedience” | 忽略 system prompt 或用户 constraint |
| Sub-intention errors | “Plan bugs” | plan execution 中的 omission、redundancy、disorder |

## 延伸阅读
- [Cemri et al., MASFT (arXiv:2503.13657)](https://arxiv.org/abs/2503.13657) 14种故障模式,3个类别
- [Microsoft, Taxonomy of Failure Mode in Agentic AI Systems](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/final/en-us/microsoft-brand/documents/Taxonomy-of-Failure-Mode-in-Agentic-AI-Systems-Whitepaper.pdf)风险登记
- [Arize Phoenix](https://docs.arize.com/phoenix) 实践中的漂移集群
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)更简单的模式,何时能完全避免这些模式
