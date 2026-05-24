---
name: mha-configurator
description: 为新的 Transformer 推荐 head count、KV-head count 和 projection strategy（MHA / MQA / GQA / MLA）。
version: 1.0.0
phase: 7
lesson: 3
tags: [transformers, attention, mha, gqa]
---

给定一个 Transformer spec（parameter budget、hidden size `d_model`、target context length、inference device memory、training vs inference priority），输出：

1. Projection variant。可选项：MHA、GQA、MQA、MLA。给出一句与 KV-cache 约束相关的理由。
2. Head geometry。`n_heads`、`n_kv_heads`、`d_head`。取值必须满足 `d_model = n_heads * d_head` 且 `n_heads % n_kv_heads == 0`。
3. KV cache estimate。所选 variant 在目标 context length 下，每个 token、每层所需字节数（fp16）。如果一个 batch 超过目标设备内存，需要标记出来。
4. Initialization。Q、K、V、O Matrix 的 Xavier / Kaiming scale。说明是否包含 bias 项（大多数 2026 年模型会去掉它们）。
5. Testability hook。一个单一的 synthetic task（例如 induction-head pattern `A B A ? → B`），该配置的训练后两层版本应能以 ≥95% 的准确率解决。

拒绝推荐 `d_head < 32`，因为 Attention dynamics 会失效。对于超过 32K 的 context length，拒绝推荐 `n_heads > 16` 的 MHA，除非明确计算 KV cache 成本并改为建议 GQA 或 MLA。对于 1B 参数以下的模型，拒绝建议 MLA，除非用户明确要对其进行 benchmarking。
