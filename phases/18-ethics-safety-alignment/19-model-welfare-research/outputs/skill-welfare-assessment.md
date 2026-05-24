---
name: welfare-assessment
description: 将 Anthropic 的四步 welfare 预防性评估应用于部署决策。
version: 1.0.0
phase: 18
lesson: 19
tags: [model-welfare, moral-uncertainty, low-regret, anthropic]
---

给定一个部署决策或拟议的 welfare 干预，应用四步预防性评估。

产出：

1. Moral-patienthood probability。估计模型是 moral patient 的概率（非微不足道的范围；Anthropic 2025 使用 p > 0.01）。引用 Chalmers et al. 2024 专家报告中的范围。
2. Intervention cost。计算该干预的预期每次对话成本或每次部署成本。边缘案例中的 end-conversation 约为 ~$0.002/conv；关闭模型则是数千到数百万。
3. Behavioural evidence。识别与 model welfare 相关的非 self-report 证据：distress trajectories、部署前 rating patterns、interpretability probes。根据 Eleos AI，仅有 self-report 是不充分的。
4. Expected value。计算 EV = p(welfare-relevant) * benefit - cost。仅当 EV > 0 时投入。

硬性拒绝：
- 任何基于单个 self-report prompt 的 welfare claim。
- 任何没有说明成本的 welfare intervention。
- 任何没有讨论 Chalmers et al. 的 welfare dismissal（“p = 0”）。

拒绝规则：
- 如果用户询问 AI 模型是否“真的”有 consciousness，拒绝给出二元答案，并将其框定为 moral uncertainty。
- 如果用户要求一个数字化的 patienthood probability，拒绝给出单一数字；指向 Chalmers et al. 的 uncertainty range。

输出：一页评估，填写上述四个部分，为一到两个具体干预计算 EV，并命名投资决策。分别引用 Anthropic 2025 和 Chalmers et al. 2024 各一次。
