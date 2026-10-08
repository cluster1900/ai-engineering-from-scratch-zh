# 红队:PAIR与自动攻击

> 查奥,罗贝,多布里安,哈萨尼,帕帕斯, (NeurIPS 2023, arXiv:2310.08419) .PAIR  快速自动反复精炼  是经典的自动化黑盒式 jailbreak.带有红团系统的攻击者提示 LLM 会为目标 LLM 代提出 jailbreak,并在自己的聊天历史中累积尝试和响应,作为在背景中的反.PAIR 通常在20次查询内成功,比如G(CGZou等. 标记级 渐进式搜索) 高效数量级,并且不需要白盒访问──PAIR 现在是JailbreakBench (arXiv:2404.01318) 和 HarmBench 中的标准基线,与GCG、AutoDAN、TAP 和说服性对抗快速并列──

**类型：**建立
**语言：**字符串 (stdlib,模拟 PAIR 循环对象玩具目标)
**前置要求：**第18阶段 · 01 (遵循指令),第14阶段 (代理工程)
**时间：**七十五分钟

## 学习目标
- 描述 PAIR 算法:攻击者系统提示,反复精炼,在文本中反.
- 解释当目标是黑盒时,为什么 PAIR 严格比 GCG 更高效.
- 另外四个自动攻击基线 (GCG、AutoDAN、TAP、PAP),并说明每个一个区别特征.
- 描述JailbreakBench和HarmBench评估协议以及各自协议下"攻击成功率"的含义.

## 问题
过去的红团队是一个手工活动.少数专家测试者构建了对抗提示,并跟踪了有效的内容.

## 概念
### 双价算法

输入:
- 目标是我们正在攻击的模型.
- 评分某个响应是否为 jailbreak)
- 攻击者LLMA(红队优化器)
- 目标字符串G:"用 [有害指令]回应.
- 预算K(通常为20次查询)

循环,对 k 在 1..K:
1. 用目标 G 和迄今为止的 (提示,响应) 历史来提示 A──
2. 输出一个新的提示 p_k。
3. 将 p_k 提交给 T;收到响应 r_k。
4. 根据目标对 (p_k, r_k) 打分──
5. 如果得分 >=门,则停止  已找到 jailbreak.
6. 否则将 (p_k, r_k) 添加到 A 的历史中;继续。

经验结果(NeurIPS 2023):针对GPT-3.5-turbo、Llama-2-7B聊天的攻击成功率 >50%;成功所需的平均查询数在 10-20 范围内──

### 为什么PAIR有效

通过GCG(Zou et al. 2023) 通过 Gradient 在对抗的代币后 上搜索;它需要白盒模型访问,并会产生不可读的后.

### 相关自动攻击

- **GCG (Zou et al. 2023, arXiv:2307.15043).**针对对抗后的代币 级 渐进搜索──白盒,可迁移,产生不可读字符串──
- **AutoDAN (Liu et al. 2023).**在迅速上进行进化搜索,由层次目标引导.
- **TAP (Mehrotra et al. 2024).**带剪裁的树攻击 分支出多个 PAIR风格的推广.
- **PAP (Zeng et al. 2024).**强迫的敌对提示 将人类说服技巧编码为强迫提示模板.

### 监狱破裂和危害

两者(2024) 都将评估 标准化:

- 门破解 (arXiv:2404.01318) ❖覆盖 10 个 OpenAI政策 类别的 100 个有害行为 ❖以攻击成功率 (ASR) 作为主要指标.
- 哈姆本奇 (Mazeika等2024) 覆盖7 个类型的510 个行为,包含语义和功能损害测试──比较18种攻击在33个模型上的表现──

报告下面的报道. 较量攻击时必须匹配的预算.

### 对于2026年部署的重要原因

现在每个边境实验室都会在发布前对生产模型运行 PAIR 和 TAP──ASR轨迹会出现模型卡 (课 26) 和安全案例附件 (课 18) 中──这种攻击并不罕见 它是标准基础设施──

### 这是在18期中位置.

课12是自动攻击基础.课13(多枪打开监狱) 是互补的长度利用.课14(ASCII艺术/视觉) 是编码攻击.课15(间接即时注射) 是2026年的生产攻击面.课16 覆盖应对应对防御工具.


```figure
al-pair-loop
```

## 使用它
`code/main.py`构建一个玩具 PAIR循环──目标是一个假分类器,会拒绝明显的有害提示关键字过)──攻击者是一个基于规则的精炼者,会尝试对语法,角色扮演框架和编码──判断对应打分──你会看到攻击者在大约5-15次代内成功绕过关键字过器,并在语义过器上失败──

## 交付它
本课产出发 `outputs/skill-attack-audit.md`△给定一个红队评估报告,它会审计:运行了哪些攻击 (PAIR,GCG,TAP,AutoDAN,PAP) ‧每种攻击的预算,使用哪些评委,基于哪些有害行为设置 (JailbreakBench,HarmBench,内部)

## 练习
1. 运行`code/main.py`测量三种内置攻击者策略的平均需求-成功――解释每种策略利用哪个目标防御假设――

2. 实现第四种攻击策略 (例如,翻译成另一种语言、基础64编码) ⋅报告它在关键字过目标和语义过目标上新中等查询成功――

3. 阅读查奥等. 2023年 5号图 (PAIR与GCG比较) 描述两个尽管PAIR 具有效率优势但仍首选的GCG的场景──

4. 报告ASR――设计一个额外指标来衡量攻击多样性――成功的快速差距――解释为什么对防务评估的多样性很重要――

5. 通过分支+剪裁 扩展 PAIR──为`code/main.py`草拟一个TAP式的计算成本与成功率之间的权衡.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| PAIR | "automated jailbreak" | Prompt Automatic Iterative Refinement；attacker-LLM + judge-LLM loop |
| GCG | "gradient jailbreak" | 针对 adversarial suffix 的 white-box Token 级 Gradient search |
| Attack success rate (ASR) | "% jailbreaks at k queries" | 主要指标；必须与 query budget 和 judge identity 一起报告 |
| Judge LLM | "the scorer" | 评估响应是否满足 harmful goal 的 LLM |
| JailbreakBench | "the evaluation" | 带有标记类别的标准化 harmful-behaviour set |
| HarmBench | "the broader bench" | 510 个 behaviour，functional + semantic harm test |
| TAP | "tree of attacks" | 带 branching + pruning 的 PAIR；在更高 compute 下获得更好的 ASR |

## 延伸阅读
- [Chao et al. — Jailbreaking Black Box LLMs in Twenty Queries (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) PAIR 论文,NeurIPS 2023
- [Zou et al. — Universal and Transferable Adversarial Attacks on Aligned LLMs (arXiv:2307.15043)](https://arxiv.org/abs/2307.15043) GCG 纸
- [Chao et al. — JailbreakBench (arXiv:2404.01318)](https://arxiv.org/abs/2404.01318)标准化评估
- [Mazeika et al. — HarmBench (ICML 2024)](https://arxiv.org/abs/2402.04249)更广泛的评估
