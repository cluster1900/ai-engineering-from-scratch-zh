---
name: provenance-check
description: 根据 California AB 2013 和 EU TDM opt-out 义务检查训练数据集。
version: 1.0.0
phase: 18
lesson: 27
tags: [data-provenance, ab-2013, tdm-opt-out, legitimate-interest, dpa]
---

给定部署使用的训练数据集，检查其是否符合 California AB 2013 和 EU TDM opt-out。

产出：

1. AB 2013 覆盖情况。填写 12 个字段。标记任何缺失字段或仅有占位符的字段。注意，摘要一经发布即具有约束力。
2. Opt-out 合规。该数据集是否尊重机器可读的 opt-out 信号（robots.txt、C2PA “No AI Training”、TDM.Reservation）？必须具备采集前过滤器。
3. DPA 辖区映射。对于数据主体所属的每个辖区，识别适用的 DPA 以及 2025 年 legitimate-interest 立场（Irish DPC、Cologne Higher Regional Court、Hamburg DPA、UK ICO、Brazilian ANPD）。
4. 不可逆审计。如果数据集包含 PII，已建立什么 unlearning 或补救程序？承认没有任何程序能够完全补救训练数据。
5. Provenance-chain 完整性。从数据来源到训练 pipeline 是否存在签名链？如果数据集是派生的（crawled + filtered），记录派生过程。

硬性拒绝：
- 任何引用 AB 2013 但没有按数据集提供 12 字段摘要的部署。
- 任何不尊重 robots.txt 或等价 opt-out 信号的部署。
- 任何假定可以从已训练 weights 中外科式移除数据的补救声明。

拒绝规则：
- 如果用户询问某个特定数据集是否“safe to train on”，在没有逐辖区分析的情况下拒绝回答。
- 如果用户请求通用合规策略，拒绝——各辖区存在实质差异。

输出：一页检查，填写五个部分，识别最高风险的合规缺口，并指出最紧急的单项补救措施。分别引用 California AB 2013 和 EU Copyright Directive TDM exception 各一次。
