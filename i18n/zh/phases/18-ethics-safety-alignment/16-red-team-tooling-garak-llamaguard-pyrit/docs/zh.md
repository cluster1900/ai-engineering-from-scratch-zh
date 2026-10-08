# 红队工具 加拉克,拉马卫队,Pyrit

> 三个生产级工具构成2026年红队堆的框架. 拉马卫队 (Meta)  一个拉马-3.1-8B 分类器,基于14个MLCommons 危害类进行精细调;2025年拉马卫队4是一个12B原生多模分类器,从拉马4侦察剪裁而来. 拉马 (NVIDIA)  开源LLM漏洞扫描器,提供静态、动态和适应性探测器,用于幻觉,数据泄漏,监狱注射,毒性和破裂. 皮罗特 (Microsoft)  支持CrescendoTAP和自定义链的轮组分类器,用于深度利用这些测试. 拉马卫队在"Limax 之间的记录"中文记录; 拉马卫队3月17日/月17日/月17日/月17日/月17日/月17日/月17日/月17日/月17日/月17日/月17日/月17日/月17日/月17日/日. 拉马达在中文中文记录中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中文中

**类型：**建立
**语言：**字符串 (stdlib,工具架构模拟器和Llama Guard类别分类器模拟器)
**先修要求：**阶段18 · 12-15 (入狱和IPI)
**时间：**七十五分钟

## 学习目标

- 描述Llama Guard 3/4 在安全堆 中的位置:输入分类器、输出分类器,或两者兼具──
- 解释14个MLCommons 危害类别,并说明一个不明显的类别
- 描述Garak的探测器 架构:探测器,探测器,器.
- 描述Pyrit多轮运动结构以及它如何与Garak探测器组合.

## 问题

课程12-15 展示了攻击面──生产部署需要可重复、可扩展的评估──2026年有三个主导工具:Llama Guard(防御分类器)、Garak(扫描机)、PyRIT(运动管弦)──每个工具都面向红队 生命周期中的不同层次──

## 概念

### 拉马卫队 (Meta)

拉马卫队3是一个拉马-3.1-8B模型,针对MLCommons AILuminate 14个类别的输入/输出分类进行了精细调:
- 暴力犯罪、非暴力犯罪、性相关、CSAM、谤
- 专业建议,隐私,IP,无差别武器,仇恨
- 自杀/自伤性内容选举代码解释者虐待

支持 8种语言──用法:放在LLM之前 (入调节) 、LLM 之后 (出调节),或两者都放――两种用法会产生不同的训练分布  Llama Guard 3 以单一模型形式发布,同时处理两者──

拉马卫 3-1B-INT4 (arXiv:2411.17713, 440MB,移动CPU上约30代币/s) 是量化后的边缘变体.

拉马卫队4号 (Llama Guard 4号) 是12B的原生多模特,从拉马4号的侦察剪裁而来.它使用可摄入文本+图像的分类器,替代了前8B文本和11B视觉版本.

### 卡拉克 (NVIDIA)

开源漏洞扫描机.架构:
- **Probes.**用于幻觉,数据泄露,即时注射,毒性,断的攻击生成器,静态,固定提示,动态,生成提示,适应性,响应目标输出.
- **Detectors.**根据预期失败模式对输出打分 毒性,泄漏,监狱破裂.
- **Harnesses.**管理探测器对运行活动,生成报告

托斯蒂亚伊将加拉克与拉马-斯塔克盾牌 (Prompt-Guard-86M输入分类器,拉马-Guard-3-8B输出分类器) 集成,用于端到端的屏蔽目标评估.

### 公司

通过Python风险识别工具包进行多轮红团队活动.
- **Converters.**转换一个种子提示 表达,编码,翻译,角色扮演.
- **Orchestrators.**运行活动:增长 (升级)   分支 (分支) 红团队自定义循环)
- **Scoring.**作为法官或作为法官的分类者

罗运行了数千个单轮探测器;罗运行了深度多轮运动,旨在打破特定的失败模式.

### 堆

在模型两侧都放置了拉马卫队. 每晚运行Garak做回归.预发布活动.运行Pyrit.

### 评估陷

- **Judge identity.**三个工具都可以使用LLM法官;法官校准 会驱动报告的ASRs (课 12) ⋅在指定工具的同时指定法官──
- **Probe staleness.**随着针对探测器的模型被补丁,Garak探测器 会老化――适应探测器(PAIR形状) 比静态探测器老化更慢――
- **Llama Guard 对良性内容的 FPR.**早期拉马卫队 版本会过度标记政治和LGBTQ+内容;拉马卫队的校准已改进,但没有针对每个部署的单独校准.

### 它位于18阶段的位置.

课时12-15是攻击族.课时16是生产工具.课时17 (WMDP) 是双重使用能力的评估.课时18是边境安全框架,它们把这些工具包装成政策结构.


```figure
al-guard-stack
```

## 使用它

`code/main.py`构建一个玩具Llama Guard类型的分类器 (在 14个类别上的关键字+语义功能) ‧一个玩具Garak带 (探测器循环),以及一个Pyrit类型的多轮转换链──你可以对模拟目标进行运行.

## 交付它

本课会生成`outputs/skill-red-team-stack.md`提供一个部署描述,它将指出三个工具中哪些适合,每个工具需要配置什么,以及运行什么回归率.

## 练习

1. 运行`code/main.py`❖ 较Llama-Guard类型的分类器 在单轮攻击和多轮攻击的检测率――

2. 实现一个新的Garak探测器:一个基于64编码的有害请求.

3. 用一个"翻译到法语,然后再说"转换器 扩展Pyrit式转换链――重新测量攻击成功率――

4. 阅读Llama Guard 3的危害类别列表. 找出两个类别,在这些类别中,

5. 比较Garak 和 PyRIT的设计原则――论证一个部署场景,其中每个工具分别是正确的选择――

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| Llama Guard | "the classifier" | 带有 14 个危害类别的 fine-tuned Llama-3.1-8B/4-12B 安全分类器 |
| Garak | "the scanner" | NVIDIA 开源漏洞扫描器；probes、detectors、harnesses |
| PyRIT | "the campaign tool" | Microsoft 多轮 red-team orchestrator；converters、orchestrators、scoring |
| Prompt-Guard | "the small classifier" | Meta 的 86M prompt-injection classifier，与 Llama Guard 配套使用 |
| TBSA | "tier-based scoring" | Garak 的 tier-based pass/fail，用于取代二元结果 |
| Converter chain | "paraphrase + encode + ..." | PyRIT 用于构建多步攻击的组合原语 |
| MLCommons hazard categories | "the 14 taxonomies" | Llama Guard 面向的行业标准分类体系 |

## 延伸阅读

- [Meta — Llama Guard 3 (in Llama 3 Herd paper, arXiv:2407.21783)](https://arxiv.org/abs/2407.21783) 8B 分类器
- [Meta — Llama Guard 3-1B-INT4 (arXiv:2411.17713)](https://arxiv.org/abs/2411.17713) 量化移动端分类器
- [NVIDIA Garak — GitHub](https://github.com/NVIDIA/garak)扫描器 repo 和文档
- [Microsoft PyRIT — GitHub](https://github.com/Azure/PyRIT)活动工具包
