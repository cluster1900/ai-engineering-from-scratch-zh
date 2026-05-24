---
name: ner-picker
description: 为给定的 extraction task 选择合适的 NER approach。
version: 1.0.0
phase: 5
lesson: 06
tags: [nlp, ner, extraction]
---

给定一个 task 描述（domain、label set、language、latency、data volume），输出：

1. Approach。Rule-based + gazetteer、CRF、BiLSTM-CRF 或 Transformer fine-tune。
2. Starting model。命名它（spaCy model ID，例如 `en_core_web_sm` / `en_core_web_trf`，Hugging Face checkpoint ID，例如 `dslim/bert-base-NER`，或 "custom, trained from scratch"）。
3. Labeling strategy。BIO、BILOU 或 span-based。用一句话说明理由。
4. Evaluation。使用 `seqeval`。始终报告 entity-level F1，绝不要报告 token-level。

除非用户已经有 pretrained domain model（例如用于 medical 的 BioBERT），否则拒绝建议在少于 500 个 labeled examples 的情况下 fine-tuning Transformer。将 nested entities 标记为需要 span-based 或 multi-pass models。如果用户在使用 out-of-the-box CoNLL-2003 labels 的同时提到 "production scale"，则要求进行 gazetteer audit。
