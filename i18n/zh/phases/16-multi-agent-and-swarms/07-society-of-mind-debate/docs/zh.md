# 思想社会与多代理辩论

> 根据1986年的前提,即智能是一个由专家组成的社会,每十年都会被重新发现一次.**multiple agents**和 **multiple rounds**城市独立贡献效果――社会 胜过单独的单独演讲;多轮交流 胜过一次投票――

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## 问题
根据模型的不同情况,你可以增加最便宜的推理, 改进.

辩论打破了这种和──不是从一个模型中取出N个独立的样本,而是让N个代理阅读彼此的推理并修改──样本之间的相关性下降(它们不再是),并且结点常常在选自信地错时给出正确答案──

## 概念
### 算法

来自 arXiv:2305.14325 (ICML 2024):

1. 它们中的每一个代理都为问题产生了初始答案.
2. 对轮 r = 2..R:向每个代理 展示其他代理 在轮 r-1 的答案,并要求它考虑这些,给你的更新答案.
3. 轮后,对最终答案做出多数投票.

论文在MMLU、GSM8K、传记、数学和事实性基准上测试──辩论持续优于CoT和自我反思──

### 两个独立旋

同一篇论文中的摘要:

- **Agent count alone**通过"单个代理"的任务,将进入平台期.
- **Round count alone**几乎没有帮助,也就是反思的已知弱点.
- **Both together**带来了大幅提升.

### 为什么有效

两个机制:

1. **暴露于分歧。**当一个代理看到另一个代理的推理链,得出不同的结论时,它必须要么证明,要么更新――无论如何,r+1的环境都比r更丰富――
2. **相关错误减少。**在自相一致性中,所有样本都来自同一个模型,因此错误相关,你会平均到一个自信但错误的答案――不同模型或不同种子会相关――不同的 *争论观点*会进一步相关――

### 异质辩论

通过使用不同基模型,Llama + Claude + GPT 辩论会减少单种植崩,因为一个模型家庭的相关错误不会被其他模型家庭共享.

缺点:弱模型 参与辩论 时可能会把共识拉向它的错误答案

### 美国国家安全局 129-代理 扩展

朱格等人. 自然语言基础的思想社会中的思想风暴, arXiv:2305.17066) 将这个想法扩展到129个成员社会.

### 失败模式

- **Sycophancy cascade。**所有代理都服从最自信的代理人.辩论缩短成最大声的观点.
- **Topic drift。**多轮辩论 会偏离原始问题――缓解措施:每轮重新注入问题――
- **Compute blowup。**五个代理,5轮辩论是25次,并且背景持续增长. 每个问题的成本可能超过单次CT电话的10×──


```figure
multi-agent-debate
```

## 构建它
`code/main.py`在数学问题上运行3个代理 ×3轮辩论,其中每个代理都从不同的(可能错误的) 答案开始.

演示展示了两个关键效果:

- 单轮交换会让代理人更接近正确答案.
- 后期额外轮次显示收益率下降,符合Du等等等的水平.

运行:

```
python3 code/main.py
```

## 使用它
`outputs/skill-debate-configurator.md`为新任务配置辩论:代理 数量、轮数、异性(同样的模型与混合) 角色分配(对称与一个对立) ⋅它也会在运行前估计代币 成本。

## 交付它
如果你想上线辩论:

- **将 rounds 上限设为 3。**两者表示,三轮获取了大部分的收益.
- **将 agents 上限设为 5。**超过5 后,环境膨胀和成本占主导地位.
- **默认 heterogeneous。**池中至少有两个不同的基模型.
- **Adversarial slot。**一个代理被提示不管怎么说都不同意.
- **记录每一轮。**隐藏的中期轮的辩论系统无法调试或审计.

## 练习
1. 运行`code/main.py`之后将轮数设为5,观察降低回报. 到哪一轮的额外融合停止?
2. 加入一个带有对抗作用的第四个代理:总是不同意当前多数人.
3. 绘制 (印) 每轮的协议分数 (成绩) 站在多数答案上部代理人比如) 什么时候达到1.0?这是否等于正确?
4. 阅读 Du et al. 第4节的废除. 使用这个代码 复现 仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅仅是 仅仅仅仅仅仅仅仅仅仅仅是 仅仅仅仅仅仅仅仅仅仅是 仅仅仅仅仅仅是 仅仅仅仅仅仅仅是 仅仅仅仅仅仅是 仅仅仅仅仅仅是
5. 阅读 我们应该疯狂吗? (arXiv:2311.17371),并列出了两种轮辩论的变化,例如,

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Society of Mind | “Minsky 的想法” | Intelligence 是互动专家集合；1986 年的 framing 现在通过 LLM debate 被 operationalized。 |
| Multi-agent debate | “Agents 争论” | N 个 agents 提出答案、相互 critique、经过 R 轮 revise，然后 majority-vote。 |
| Consensus | “他们达成一致” | 不是 epistemic truth，只是 fraction-on-majority-answer。可能自信地错误。 |
| Rounds | “Exchange steps” | 一轮 = 每个 agent 读取其他 agents 并 update 一次。 |
| Heterogeneous debate | “混合 model families” | 使用不同 base models 来去相关 errors。 |
| Sycophancy cascade | “每个人都同意那个大声的人” | 一种 debate failure：agents 不管正确性如何，都顺从最自信的 agent。 |
| NLSOM | “129-agent society” | Natural-language society of mind；Zhuge et al. 的 scaled version。 |
| Correlated error | “同一个 model，同一个 bug” | self-consistency 饱和的原因；跨不同 views 的 debate 会去相关。 |

## 延伸阅读
- [Du et al. — 通过 Multiagent Debate 提升 Language Models 的事实性与推理能力](https://arxiv.org/abs/2305.14325)参考文件,ICML 2024
- [Zhuge et al. — Mindstorms in Natural Language-Based Societies of Mind](https://arxiv.org/abs/2305.17066) 129 代理NLSOM
- [Should we be going MAD? A Look at Multi-Agent Debate Strategies for LLMs](https://arxiv.org/abs/2311.17371)基准辩论变体
- [Debate project page](https://composable-models.github.io/llm_debate/) Du et al 的代码,示范和除细节
