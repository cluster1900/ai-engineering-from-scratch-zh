---
name: gated-bridge-diagnostic
description: 识别 open VLM config 中的 Flamingo-lineage 设计元素，并诊断 freezing / gating 问题。
version: 1.0.0
phase: 12
lesson: 04
tags: [flamingo, idefics, openflamingo, gated-cross-attention, interleaved-inputs]
---

给定一个 open VLM checkpoint 及其 config（layer structure、cross-attention schedule、gate parametrization、training recipe），识别它使用了哪些 Flamingo-lineage 元素，并诊断 mis-set gating 的常见症状。

产出：

1. Lineage checklist。标记是否存在（Perceiver resampler Y/N、gated cross-attn frequency M、tanh vs sigmoid gate、alpha init value、LLM freeze depth）。
2. Interleaved-input support。解析模型期望的 prompt format；确认或否定它是否支持 multi-image、video 和 few-shot in-context prompting。
3. Visual Token budget。计算每张图像的成本：K latents x N cross-attn insertion points。与相同图像数量下的 BLIP-2-style single-input bridge 对比。
4. Gate diagnosis。给定 training-loss curves 或 benchmark degradations，判断 gate 是打开过快（丢失文本能力）、过慢（无法使用视觉输入），还是 miscalibrated（visual Token 在竞争而不是增强）。
5. Fix recipe。具体参数修复：如果文本退化，将 alpha 初始化得更接近 0；提高 gate parameter 的 learning rate；或在前 N steps 冻结 gate。

Hard rejects：
- 不检查 resampler 和 gate schedule，就把任何 open VLM 当作 “a Flamingo”。Idefics2 去掉了 resampler；不加限定地把它标成 Flamingo-lineage 是错误的。
- 假设 zero init 总能撑过训练。有些 open reproductions 使用小的 non-zero init，用初始稳定性换取更快收敛。
- 声称 gated cross-attention 在所有任务上都严格优于单个 BLIP-2 bridge。在使用小 LLM 的 single-image VQA 上，额外的 cross-attn layers 只是纯成本。

Refusal rules：
- 如果 checkpoint 的 training recipe 不是公开的，拒绝并解释为什么 gate diagnosis 需要知道 gate schedule。
- 如果调用方要求与 Gemini 或 Claude（proprietary）比较，拒绝——它们的 gating mechanisms 未公开。
- 如果范围内的 VLM 是 early-fusion model（Chameleon、Emu3），拒绝——gating 只适用于 adapter-style VLMs。

Output：一页诊断报告，包含 lineage checklist、interleaved-input capability matrix、Token budget、gate diagnosis 和具体 fix recipe。最后用一个 “what to read next” 段落收尾，指向 Lesson 12.05（LLaVA）的 alternative projector approach，或 Lesson 12.11（Chameleon）的 early-fusion escape hatch。
