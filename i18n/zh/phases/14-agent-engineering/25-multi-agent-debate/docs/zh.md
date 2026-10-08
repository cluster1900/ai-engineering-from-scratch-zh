# 多代理辩论与协作

> 两者等 (ICML 2024,社会思想)运行N个模型实例,这些实例先独立提出答案,然后在R轮中相互代批判,以实现收──它能提升事实性、规则遵循和推理──积拓在代币成本上优于全网──

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 12（Workflow Patterns），Phase 14 · 05（Self-Refine and CRITIC）
**Time:** ~60 分钟

## 学习目标
- 解释辩论协议:N 个提出者,并收到一个共享答案.
- 描述为什么辩论可以提升事实性,遵循规则和推理.
- 解释稀疏的主题:不是每个辩论者都需要看到其他所有辩论者.
- 在脚本上实现一个小题辩论,包含全网和稀少的变体;衡量代币成本与准确性.

## 问题
自我清理 (第05课) 是一个模型的批评自我,存在的团体思维风险――Critic (第05课) 将批评的基础放在外部工具中,但这些工具并非总是可用.

## 概念
### 思想社会 (Du et al., ICML 2024)

- 针对同一个问题独立提出答案的模型例.
- 在R轮中,每个模型读取其他模型的建议并批评它们.
- 模型根据批评更新自己的答案.
- 轮后,回收后的答案.

原始实验是考虑使用N=3、R=2──在困难问题上,更多的代理和更多轮次会提高准确性.

跨型组合优于单型辩论:ChatGPT + Bard 组合 > 任一单独模型──

### 光顶点

通过散通信拓学改善多代理辩论 arXiv:2406.11776,2024-2025) 表明,全网辩论并非总是最优秀的.散拓学 (星、环、和语) 可以使用更低的代币 成本达到相近的准确性.

影响:

- 满网N=5,R=3 =5 × 3 =15个提案,每个都读取4个同行 =60次评论 ops──
- 星N=5,R=3 ((一个中心+4个发言) =15个建议,发言只读取中心 =12次评论操作――

### 辩论有什么帮助

- **Factuality。**独立的建议,交叉检查 降低幻觉.
- **Rule-following。**象棋运动有效性 中,一个模型漏掉规则,其他模型会抓出来.
- **Open-ended reasoning。**多种框架会逐步缩小到正确答案.

### 当辩论痛

- **Latency-sensitive UX。**没有什么可忍受的延迟.
- **Cost-sensitive scale。**每个问题需要N × R标记.
- **Simple factual lookups。**现在,我们还要做一些事情.

### 2026 实用实例

- **Anthropic orchestrator-workers**带合成步骤的辩论变体.
- **LangGraph supervisor**专业代理可以把辩论实现为一个节点.
- **OpenAI Agents SDK**通过交付来回进行反复批评.
- **Multi-agent evals** 将辩论+评价者-优化器 配对,用于评价信号.

### 这个模式很容易出错的地方

- **Convergence collapse。**所有代理都收到第一个错误答案.
- **Hub failure。**在恒星拓中,一个糟糕的枢纽会污染所有人――转换枢纽或使用多个枢纽――
- **Prompt homogenization。**所有代理使用相同提示;它们会产生相同的答案.


```figure
debate-converge
```

## 构建它
`code/main.py`实现了这一问题辩论:

- `Debater`课程,每个辩论者都在看论.
- `FullMeshDebate`和 `SparseDebate`跑步者
- 三个问题:一个事实,一个规则,一个推理.
- 标准:转变答案,转变至转变,总批评操作.

运行:

```
python3 code/main.py
```

输出:每个协议的准确性和成本;节省在 2/3 问题上以更低的成本匹配全网.

## 使用它
- **Anthropic orchestrator-workers**根据简单的2-3个工人辩论.
- **LangGraph**为了带来检查点的多轮辩论.
- **Custom**用于研究或专用准确性保证.

## 交付它
`outputs/skill-debate.md`建立一个多代理辩论,具有可配置的拓理,N、R 和融合规则.

## 练习
1. 实现强制不一致 规则:在第1轮中,每个辩论者必须提出不同的建议,
2. 添加信心权重集结:辩论者 返回 (答案,信心);总结者 按信心加权──它有帮助吗?
3. 异性是否提高准确性?
4. 在你的3个问题上衡量完整的网格与稀少的代币 成本――绘制成本与准确性――
5. 阅读"思想社会"论文. 把你的玩具移植到N=5 R=3

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Debate | “Multi-agent critique” | N 个 proposers，R 轮 cross-critique，并收敛 |
| Full mesh | “Everyone reads everyone” | 每个 debater 每轮读取每个 peer |
| Sparse topology | “Limited peer view” | Debaters 只读取 peers 的一个子集 |
| Hub-and-spoke | “Star topology” | 一个 central debater，N-1 个 spokes 只读取 hub |
| Convergence | “Agreement” | Debaters 收敛到一个共享答案 |
| Society of Minds | “Du et al. debate paper” | ICML 2024 multi-agent debate method |

## 延伸阅读
- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) 经典多代理辩论
- [Sparse Communication Topology (arXiv:2406.11776)](https://arxiv.org/abs/2406.11776)稀疏的拓 结果
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)管家工人 作为一个辩论变体
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651)单一模式对应方法的自我批评
