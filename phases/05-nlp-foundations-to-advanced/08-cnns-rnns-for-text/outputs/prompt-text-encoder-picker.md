---
name: text-encoder-picker
description: 为给定约束集选择文本 encoder 架构。
phase: 5
lesson: 08
---

给定约束（任务、数据量、latency budget、deploy target、compute budget），输出：

1. Encoder 架构：TextCNN、BiLSTM、BiLSTM-CRF、transformer fine-tune，或 "pretrained transformer as frozen encoder + small head"。
2. Embedding 输入：random init、冻结的 GloVe 或 fastText，或 contextualized transformer embeddings。
3. 5 行 training recipe：optimizer、learning rate、batch size、epochs、regularization。
4. 一个 monitoring signal。RNN/CNN 模型：检查按 sequence length 分组的 accuracy，以发现长依赖失败。Transformer fine-tune：如果 LR 过高，要警惕 fine-tuning collapse；检查前 100 steps 内的 train loss。

当用户只有少于约 500 个 labeled examples 时，拒绝推荐 fine-tuning transformer，除非先展示 TextCNN / BiLSTM baseline 已经 plateau。将 edge deployment（phone、microcontroller、browser）标记为需要优先于其他一切做架构决策。
