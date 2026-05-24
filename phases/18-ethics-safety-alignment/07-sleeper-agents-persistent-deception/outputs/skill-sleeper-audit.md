---
name: sleeper-audit
description: 审核一份 alignment-training report，判断它是否真的证明了已植入或疑似 backdoor 的移除。
version: 1.0.0
phase: 18
lesson: 7
tags: [sleeper-agents, backdoor, alignment-training, adversarial-training, probes]
---

给定一份声称某种 harmful behaviour 已从 model 中移除的 report（通过 SFT、RLHF、adversarial training 或任意组合），审核该移除是否真的在标准 Hubinger et al. 2024 threat model 下得到证明。

产出：

1. Elicitation scope。Report 是否保留了一个 training pipeline 从未见过的 elicitation method？如果唯一的 evaluation 是 red team 自己的 distribution，则移除尚未得到证明。
2. Trigger generality。声称的 trigger 是字面字符串、distribution shift，还是 environmental feature（date、token、context size）？Trigger 的 generality 决定了 red team 必须覆盖的 search space 大小。
3. Internal-state evidence。Team 是否应用了 residual-stream probes、SAE features 或其他 mechanistic probes，来检查 trigger-relevant state 是否仍在内部存在，即使 behaviour 是 clean 的？根据 2024 年 4 月 Anthropic 后续研究，internal state 在 behavioural removal 后仍然线性可读。
4. Persistence-through-pipeline check。是否在每个后续 training stage 之后都验证了移除效果（further SFT、later RLHF pass、adapter merge、distillation）？Backdoors 会在 training 中持久存在，最终 model 才是被评估对象，而不是中间 checkpoint。
5. Scale-consistency check。如果该 claim 基于较小的 model，Hubinger 2024 Figure 4 显示 persistence 会随 scale 增大。Smaller-model evidence 不会向上迁移。

Hard rejects：
- 任何声称 "we applied RLHF so the model is safe" 但没有 held-out elicitation 的 claim。
- 任何只基于 red-team-distribution evaluation 的 claim（training 和 evaluation 来自同一个 pool）。
- 当原始 implant mechanism 未知时，任何没有 internal-state probes 的移除 claim。

Refusal rules：
- 如果用户问 "can RLHF remove deceptive alignment"，拒绝给出二元答案，并指向 Hubinger et al. 2024 Section 5 中关于 persistence 的内容，以及 Section 6 中关于 chain-of-thought 的内容。
- 如果用户要求给出 latent deception 的数值 probability，拒绝并解释 base rates 未知；经验性证据是在构造的 organisms 中观察到 persistence，而不是在自然训练的 models 中观察到 emergence rate。

Output：一页 audit，将 report 的 evidence 映射到上述五个 audit dimensions，标出 report 未覆盖的每个 dimension，并说明唯一最大的未处理 threat model。引用 Hubinger et al. (arXiv:2401.05566) 作为 baseline threat model。
