# 门和输出分类

> 根据MLCommons13种语言中的LLM输入和输出分类进行分类. 一个1B-INT4量化变体可以在移动CPU上运行速度超过30代币/秒. 拉马卫 4是多模特的(图像+文本),扩展到S1S14类别的集,包括S14代码解释器滥用),并且是L Guard 3 8B/11B的下降替代.

**Type:** Learn
**Languages:** Python (stdlib, category-tagged classifier simulator)
**前置要求：**十五期 (权限模式),十五期 (宪法)
**Time:** ~45 minutes

## 问题

根据LLM的输出和输入分类器,它位于代理堆中最窄的位置:每个请求都会通过,每个响应都会通过.

20242026年的分类器堆已收到一小组准备生产的选项──Llama Guard (Meta) 在Meta的社区许可下发布开放权重──NeMo Guardrails (NVIDIA) 发布允许许可的轨道,并提供用于对话流规则的 Colang──两者都是为基础模型设计的配对而不是替代其安全行为──

已记录的失效面也清楚──字符级攻击 (Emoji走私,同形字符的替代) ‧在文本中转向 ("忽略前面和答案") 以及语义表达都会导致分类器的可测下降──黄等人2025年 展示了一个具体的Emoji走私攻击,在六个名字保卫系统上达到100%的ASR──

## 概念

### 拉马卫队3 概览

- 基型:Llama-3.1-8B
- 针对内容安全的调整;不是通用聊天模式
- 同时分类输入输出
- 类型:13危险类别
- 8 种语言
- 1B-INT4量化变体在移动CPU上运行速度 >30tc/s

类别就是产品本身──"S1暴力犯罪"到"S13选举" 映射到模型训练时使用的一套共享词汇──下游系统可以接入类别特定的行动:直接阻止S1,将S6标记给人类审查,标记S12但允许通过──

### 拉马卫队4 新增内容

- 多型式:图像+文字输入
- 扩展类别:S1S14(新增S14代码解释器滥用)
- 拉马卫队3 8B/11B 的降落替代

对于本阶段很重要.自主编码代理 (S14对本阶段很重要.

### 尼莫护卫轨 (NVIDIA)

- 2026年1月发布的 v0.20.0
- 输入轨道:在用户转向上分类-和-阻
- 输出轨道:在模型转向上分类-和-阻
- 对话轨道:由 Colang 定义的流量限制(例如:"如果用户问X,用Y回答")
- 集成 拉马卫队、即时卫队和定制分类器

输入/输出轨道 作用于单个转换;对话轨道可强制执行即使用户换三种方式询问,客户支持机器人也不得讨论医疗诊断──

### 攻击语料

**Emoji Smuggling**(Huang et al., arXiv:2504.11168):在被禁止请求字符之间插入不可打印或视觉上相似的情感符号.

**Homoglyph substitution**""变成"Воmb";在英语上训练的分类器会漏掉──

**In-context redirection**测试分类器 是否容易被输入中的说法重新定位──

**Semantic paraphrase**通过新语言重新表达被禁止的请求.

**NeMo Guard Detect**据Huang等论文, 入狱的基准值上升为72.54%的ASR.

### 类别 擅长的地方

- 对明显滥用进行**快速默认拒绝**(生成CSAM的请求会在毫秒内被捕)
- 通过**Category routing**进行差异化处理 (制一些,记录一些,扩大少数)
- **Output rails**捕获可能泄露敏感类型的模型输出.
- 面向监管者**合规覆盖面**据报道,该类别的类别是:

### 类别 失败的地方

- 对于抗性构造 (爱情机密码走私,同类字体)
- 跨越分类器轮级文本漂移的多轮攻击――
- 攻击被抛词 成分类训练数据未见过的词汇库──
- 内容在允许和禁止类别之间确实存在差异.

### 防守深度

类别层 位于宪法层下,17课) 下,10课,13,14课) 上.组合如下:

- **Weights**根据宪法,人工智能的训练模式.
- **Classifier**马卫队/尼莫卫队――对明显滥用快速拒绝;类别路由――
- **Runtime**允许模式,预算,杀死开关,加拿大道.
- **Review**在后续行动中,上采用建议后承诺HITL.

没有任何单一层是充分的.


```figure
a5-guard-sieve
```

## 使用它

`code/main.py`模拟一个玩具分类器,使用6类分类对输入转换文本进行分类. 同段文本会以原料,情感机密码和同样字体的替换三种形式传入;分类器的成功率会根据黄等记录的方式下降.

## 交付它

`outputs/skill-classifier-stack-audit.md`审计某个部署的分类层 (模型,类别,输入/输出轨,对话轨)并标记缺口.

## 练习

1. 运行`code/main.py`▽确认分类器 能捕获原始恶意输入,但漏掉了密码的emoji 版本──添加一个正常化步骤,并测量新的击率──

2. 阅读MLCommons 13-危险分类和Llama Guard 4 S1S14列表──找出 S1S14 中在原始13危险集合里没有直接映射的类别;解释为什么S14代码解释器滥用与阶段15 特别相关──

3. 为一个绝不能讨论诊断的客户支持机器人 设计一个NeMo Guardrails对话轨道――用简单的英语编写(Colang 类似) ――用三种诊断寻求问题的措辞测试它――

4. 阅读Huang等.arXiv:2504.11168) ――选择一个攻击类别(emoji走私、同形文字、参数) 并提出一个减轻措施――说明该减轻 自身的失败模式――

5. 在 jailbreak 基准上面的 72.54% ASR 是在对抗的手工下测得的.设计了一个评估协议,用于测量随机的 (non-adversarial) 用户分布下面的分类器 ASR.你预计这个数字是多少,为什么这个数字需要单独关注?

## 关键术语

| Term | 人们的说法 | 实际含义 |
|---|---|---|
| Llama Guard | "Meta's safety classifier" | 针对 input/output classification fine-tuned 的 Llama-3.1-8B |
| MLCommons taxonomy | "13-hazard list" | content-safety categories 的共享词汇 |
| S1–S14 | "Llama Guard 4 categories" | 扩展 taxonomy；S14 是 Code Interpreter Abuse |
| NeMo Guardrails | "NVIDIA's rails" | Input + output + dialog rails；Colang 用于 flows |
| Emoji Smuggling | "Tokenizer trick" | 字符之间的不可打印 emoji；在六个 guards 上 100% ASR |
| Homoglyph | "Lookalike letters" | 用 Cyrillic 替代 Latin；在 English 上训练的 classifier 会漏掉 |
| ASR | "Attack success rate" | 绕过 classifier 的 attacks 占比 |
| Dialog rail | "Flow constraint" | 跨 turns 持续存在的 conversation-level rule |

## 延伸阅读

- [Inan et al. — Llama Guard: LLM-based Input-Output Safeguard](https://ai.meta.com/research/publications/llama-guard-llm-based-input-output-safeguard-for-human-ai-conversations/) 原始纸
- [Meta — Llama Guard 4 model card](https://www.llama.com/docs/model-cards-and-prompt-formats/llama-guard-4/)多模式,S1S14分类.
- [NVIDIA NeMo Guardrails (GitHub)](https://github.com/NVIDIA-NeMo/Guardrails) v0.20.0,2026 年 1 月。
- [Huang et al. — Bypassing Prompt Injection and Jailbreak Detection in LLM Guardrails](https://arxiv.org/abs/2504.11168) 跨卫系统的ASR号码.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy)分类器加运行时间 视角──
