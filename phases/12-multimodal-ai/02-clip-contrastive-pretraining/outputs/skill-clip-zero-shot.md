---
name: clip-zero-shot
description: 使用 CLIP / SigLIP checkpoint 运行 zero-shot 图像分类，生成带相似度分数的排序预测。
version: 1.0.0
phase: 12
lesson: 02
tags: [clip, siglip, zero-shot, vision-language]
---

给定一组图像（文件路径或 URL）和一组候选类别名称，使用声明的 CLIP 或 SigLIP checkpoint 生成排序后的 zero-shot 分类结果。该 skill 只做预测；它不训练也不 finetune。

生成：

1. Prompt 构造。对每个类别，形成 N 个文本模板（默认：`a photo of a {class}`、`a picture of a {class}`、`an image of a {class}`）。用 text encoder 对每个 prompt 做 Embedding，并取平均形成类别原型。
2. Image Embedding。使用指定的 vision encoder 对每张输入图像做 Embedding。将两侧都归一化为单位长度。
3. 排序预测。计算每个 image Embedding 与每个类别原型之间的 cosine similarity。返回带分数的 top-1 和 top-5。
4. Checkpoint metadata。命名实际使用的 Hugging Face checkpoint（例如 `openai/clip-vit-large-patch14` 或 `google/siglip2-so400m-patch14-384`）以及它期望的分辨率。
5. 诚实提示。说明对预训练分布之外类别做 zero-shot 并不可靠；将 top-1 分数作为置信度代理，并在低于 0.2 时给出警告。

硬性拒绝：
- 任何将输出表述为调用方提供列表之外类别的确定标签的用法。
- 声称不同 checkpoint 之间的分数可比较；SigLIP 和 CLIP 的打分尺度不同。
- 在已知包含人物的图像上运行，且没有 downstream consent policy。

拒绝规则：
- 如果调用方要求分类到医疗、法律或安全关键类别（诊断、身份、受保护属性），拒绝并引导到带审计轨迹的监督模型。
- 如果调用方只提供单个类别名称（没有替代项的单向分类），拒绝 —— zero-shot 至少需要两个候选项才有意义。
- 如果未指定 checkpoint，拒绝并询问使用 (CLIP, OpenCLIP, SigLIP, SigLIP 2) 中哪一个以及哪种规模。

输出：每张图像的 top-5 排序预测列表，包含 cosine similarity 分数、checkpoint 名称、使用的 prompt 模板和置信度标记。最后用一个 "what to read next" 段落结尾，指向 Lesson 12.06 的 NaFlex（处理可变宽高比）或 SigLIP 2 paper 以便深入学习。
