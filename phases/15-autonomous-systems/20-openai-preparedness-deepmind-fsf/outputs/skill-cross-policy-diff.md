---
name: cross-policy-diff
description: 使用 OpenAI Preparedness Framework v2、Anthropic RSP v3.0 和 DeepMind FSF v3 作为参考，为特定能力生成跨政策对比。
version: 1.0.0
phase: 15
lesson: 20
tags: [preparedness-framework, fsf, rsp, cross-policy, scaling-policy]
---

给定一项具体的 frontier capability（例如，“long-range autonomy”、“autonomous replication and adaptation”、“R&D automation”），生成一份 cross-policy diff，展示三个框架分别如何分类该能力，以及会触发哪些缓解措施。

生成：

1. **OpenAI PF v2 classification.** Tracked 或 Research。如果是 Tracked，命名 Capabilities + Safeguards Report 的触发条件。如果是 Research，指出政策措辞是“potential” mitigations。
2. **Anthropic RSP v3.0 classification.** 哪个阈值（ASL-3、AI R&D-4、hardcoded prohibition）？哪个缓解措施（affirmative case、security + deployment）？确认该承诺属于 Anthropic-unilateral tier 还是 industry-recommendation tier。
3. **DeepMind FSF v3 classification.** 哪个领域（Cyber、Bio、ML R&D、CBRN）？哪个 CCL 或 Tracked Capability Level？是否调用 deceptive alignment monitoring？
4. **Convergence summary.** 三项政策是否同意该能力的严重性，还是存在有意义的分歧？哪项分类最严谨，哪项最不严谨？
5. **Measurement dependency.** 每项分类都依赖能力测量。说明该能力如何被测量，以及哪个 eval provider（METR、Apollo、internal、third-party）负责该测量。

硬性拒绝：
- 仅基于公告措辞相似性、但没有文档级证据，就声称 cross-policy alignment。
- 任何无法指向源文档中特定条款的分类。
- 将“Research Category”（OpenAI）当作等同于“Tracked Category”处理，它们有不同的操作后果。

拒绝规则：
- 如果用户无法为每项分类提供源文档段落，则拒绝并先要求引用。
- 如果用户把政策存在本身当作 mitigation-in-practice 的证据，则拒绝并要求提供具体缓解措施被触发的证据。
- 如果某项能力被声称由某框架“覆盖”，但该词没有出现在文档中，则拒绝并要求提供具体条款引用。

输出格式：

返回一份 diff 文档，包含：
- **Capability definition**（一句话）
- **OpenAI PF v2 row**（classification、trigger、source clause）
- **Anthropic RSP v3.0 行**（classification、trigger、unilateral-vs-recommendation）
- **DeepMind FSF v3 row**（domain、CCL / TCL、deceptive-alignment involvement）
- **Convergence summary**（agreement + meaningful disagreement）
- **Measurement ownership**（eval provider、eval cadence）
- **Reader recommendation**（most rigorous、least rigorous，并给出理由）
