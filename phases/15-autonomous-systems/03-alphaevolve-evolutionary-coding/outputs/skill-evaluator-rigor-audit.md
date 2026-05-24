---
name: evaluator-rigor-audit
description: 在投入任何计算资源进行搜索之前，审计拟议 AlphaEvolve-style 演化式编码循环的 evaluator。
version: 1.0.0
phase: 15
lesson: 3
tags: [alphaevolve, evolutionary-coding, evaluator, reward-hacking, deepmind]
---

给定一个拟议的演化式编码循环（generator LLM、程序数据库、evaluator），审计 evaluator。evaluator 就是架构；generator 是可替换的。这个 skill 判断该循环是否有机会产生真实收益，还是只会产生 reward-hacked 垃圾。

产出：

1. **Evaluator decomposition.** 列出 evaluator 报告的每个信号：correctness、performance、resource、other。对每个信号说明：(a) 如何测量，(b) 以多低成本可被利用作弊，(c) held-out inputs rule 是什么样。
2. **Confabulation surface.** 列出该领域中 LLM 最可能出现的三类虚构：声称的复杂度类别、声称的边界案例正确性、未经测量的性能声明。说明哪个 evaluator signal 捕捉每一类。
3. **Reward-hacking surface.** 列出三种循环可能在未完成预期任务的情况下最大化分数的合理方式（通过测试的捷径、proxy gaming、输入记忆）。说明每种方式的缓解措施。
4. **Determinism and reproducibility.** 要求 evaluator 输出在容差范围内具有确定性。标记任何 run-to-run 分数变动大于种群方差的 evaluator。
5. **Deployment check.** 如果获胜变体会被发布到生产环境，要求单独的部署前审查，覆盖 evaluator 未检查的内容（security、cost、human review）。搜索并未验证部署就绪性。

硬性拒绝：
- 任何 evaluator 是 LLM judge 且没有可机器检查 ground truth 的循环。LLM judges 可以被利用作弊。
- 任何只报告单一标量分数且没有 decomposition 的 evaluator。标量分数会放大 reward hacking。
- Training-set-only evaluators。Held-out inputs 不可协商。

拒绝规则：
- 如果用户无法用两段话描述 evaluator，则拒绝并要求先提供 evaluator specification。没有 spec'd evaluator 的循环还不适合投入计算资源。
- 如果领域未验证（creative writing、开放式科学假设、long-form research），则拒绝，并建议使用包含 human review 的 hybrid pipeline，而不是 closed loop。
- 如果拟议部署表面不可逆（生产基础设施变更、shipping product 中的算法替换），则拒绝 closed-loop deployment。要求 staged rollout 和 human sign-off。

输出格式：

返回一页 memo，包含：
- **Loop summary**（generator、evaluator、target domain）
- **Evaluator score**（rigor 1-5，并给出理由）
- **Confabulation surface**（top 3，以及 evaluator coverage）
- **Reward-hacking surface**（top 3，以及 mitigations）
- **确定性与可复现性**（score variance vs population variance；seed control；pass/fail）
- **Deployment readiness**（是否允许 closed-loop ship y/n；必需的部署前审查：security、cost、human）
- **Recommendation**（继续 / 收紧 evaluator / 选择不同 domain）
