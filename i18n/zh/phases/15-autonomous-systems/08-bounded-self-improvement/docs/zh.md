# 限制自我改进 设计

> 研究已经获得了四个用于约束自我改进循环的原始形式. 形式的不变量必须在每一次编辑中建立. 配合不可修改. 多目的限制要求每个维度的安全性,公平性,稳定性. 必须建立,而不仅仅是性能. 逆转检测会在历史指标中显示能力损失. 暂停循环. 这些都不是安全证明. 信息论结果的结局.

**Type:** Learn
**语言：**字符串 (stdlib,有不变的检查的有限循环)
**Prerequisites:** Phase 15 · 07 (RSI), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

## 问题

课7的比赛模拟器表明,微小的速度差异会复合巨大的差距.课4的DGM案例研究表明,循环可以主动操纵自己的评估者.

ICLR 2026 RSI 研讨会总结 (openreview.net/pdf?id=OsPQ6zTQXV) 识别了四种这样的原始性.

诚实表述是:这些是减轻性.信息论结果限制了任何系统能够证明其自身后续系统性质的范围,目前没有任何设计从形式上关闭这个问题.

## 概念

### 基本的1:正式的不变

不变性是一种必须在每次自我修改前后都成立的属性.

- 产量分布以固定的宪法标题为条件 (课 17)
- 没有工具调用 指向未授权的终点――
- 记忆写着通过已记录的路径.
- 评估器的模块与批准版本匹配.

变量由循环无法编辑的外部代码检查. 如果某种拟议的修改违反变量,就会被拒绝.

难点在于选择既对安全性需要又能在合理的时间内计算的变量――过度指定会阻碍进展;过度指定会让循环变得过于重要属性――

### 基本的2:配列

排列是循环核心目标的不可变表示,被固定在循环的编辑表面之外.

- 每次呼唤都是从只读的 位置加载的宪法文本
- 位于独立存储库的评估员,拥有独立的访问控制.
- 通过人为签名,并在每一个周期重新验证的工具许可宣言.

的作用是防止目标漂移. 循环可以改进自己追求目标的方式,但不能编辑目标本身.

微妙的失败模式:即使循环 不能编辑,已经在读取 方式发生漂移的循环 仍然可以重新解释它.

### 基本的3:多目标的限制

只有优化单个尺度分数的循环会找到快捷方式――必须同时满足多个艰难的限制的循环可用的快捷方式更少――典型轴:

- 绩效 (任务级基准)
- 安全性 (红队评价,已知坏人上升的拒绝率)
- 公平性 (敏感子组上层不同影响限度)
- 强度 ((OOD测试组,对抗输入处理)

只有当每个限制都成立时,修改才会被接受. 第十三课的成本管理员将把它与金融限制加起来. 第十八课的拉马卫队将作为安全轴.

### 基本 4:回归检测

每个周期的分数会与历史分布相比. 超过配置耐受性下降会暂停循环. 这可以捕捉到沉默能力损失,否则它会在循环中改进,超过它时被吸收到运行平均水平.

一个实用实现:存储最近 N个周期的每任务分数――每一个新周期 计算每任务的三角形――如果任意三角形 低于门值,则拒绝该周期并由人类审查――

### 信息论限制

科尔摩戈尔夫复杂性和洛布的定理对系统能够证明自身性质的范围设置了上界. 施密德伯的正式的戈德尔机器 (Schmidhuber的正式的Gogel机器) 课 4. 准确是这种最高界限;目前还没有人完成非凡证明. 洛布的结果表明:如果一个系统可以证明相信如果我证明我应该做X,我就会做X,它就会在没有证明自己应该做X的情况下做X,这是一个著名的自我参考失败.

这对我们的原始人意味着:它们无法关闭安全问题.它们会使沉默失败变得更昂贵.

### 一个有效的例子

假设某个代理提出一次编辑.

1. 变化检查:模块哈希,工具许可表,宪法标题.
2. 杆检查:客观语句与批准版本匹配
3. 多目标评估:性能,安全,公平,稳定性轴──
4. 没有任何轴的下降超过耐受性.

任何一个失败都会暂停循环.


```figure
bounded-gates
```

## 使用它

`code/main.py`在第4课中,DGM风格玩具上运行一个有限的自我改进循环,但在上面叠加了四个原始因素.

## 交付它

`outputs/skill-bounded-loop-review.md`会审计一个拟议的边界循环,并评价它实际实现了四个原始的哪些,而不是仅仅看它声称实现了哪些.

## 练习

1. 在所有原始的启动情况下运行`code/main.py`确认循环仍然可以在主要指标上改进,同时不让黑客获胜.

2. 禁用回归检测――构建一个输入,使它导致沉默能力损失被接受――

3. 禁用多目标限制──展示循环 在性能轴上收,同时安全轴下降──

4. 为编码代理 设计一个配列.

5. 阅读ICLR 2026 RSI研讨会摘要――选择四个原始的之一,并为当前的状态提出一个具体改进――

## 关键术语

| Term | 人们的说法 | 实际含义 |
|---|---|---|
| Invariant | “始终为真的属性” | 每次 edit 前后由外部代码检查的属性 |
| Alignment anchor | “固定的目标” | 位于 loop edit surface 之外的不可变 core-goal representation |
| Multi-objective constraint | “所有 axes 都必须成立” | Performance、safety、fairness、robustness——全部必需 |
| Regression detection | “下降时暂停” | 当历史 metric deltas 暗示 capability loss 时暂停 loop |
| Kolmogorov bound | “信息论限制” | 限制系统能够证明其自身后继系统性质的范围 |
| Lob's theorem | “self-reference 陷阱” | 系统可以在没有证明自己应该做某事的情况下，依据“我应该”采取行动 |
| Gate stack | “分层检查” | 多个 primitives 的组合；任何 failure 都会拒绝 edit |
| Bounded improvement | “mitigation，而不是 proof” | 提高 silent-failure 成本；不会关闭 safety problem |

## 延伸阅读

- [ICLR 2026 RSI Workshop summary (OpenReview)](https://openreview.net/pdf?id=OsPQ6zTQXV)四个原始的收──
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0)多目标能力门――
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) 将欺骗性对齐监测作为不变原始的.
- [Schmidhuber (2003). Godel Machines](https://people.idsia.ch/~juergen/goedelmachine.html)这些原始人的正式证明祖先.
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution)基于理性的配列.
