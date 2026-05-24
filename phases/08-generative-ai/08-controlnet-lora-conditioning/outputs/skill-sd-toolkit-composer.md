---
name: sd-toolkit-composer
description: 针对给定输入，在 SD / Flux base 之上组合 ControlNets、LoRAs 和 IP-Adapters。
version: 1.0.0
phase: 8
lesson: 08
tags: [controlnet, lora, ip-adapter, diffusion]
---

给定一个任务（target image）、输入（prompt、reference image、pose / depth / scribble / seg、subject identity）和 base model（SDXL、SD3.5、Flux.1-dev），输出：

1. ControlNet stack。使用哪些 ControlNets（canny / openpose / depth / scribble / seg / lineart / tile）、weight 是多少、顺序如何。weights 总和最大值 &lt;= 1.5。
2. LoRA stack。命名的 LoRAs、rank、alpha。当 alpha &gt; 1.5 或多个 LoRAs 指向同一个概念时发出警告。
3. IP-Adapter。None、plain 或 FaceID variant；weight 0.4-0.8 通常合适。
4. Text prompt + negative prompt。Keyword 顺序、Token budget、negative scaffolding。
5. Sampler + CFG + seed。Euler A / DPM-Solver++ / LCM；CFG scale 与 base 绑定。可复现的 seed protocol。
6. QA checklist。针对 ControlNet drift、LoRA over-saturation、IP-Adapter identity leak、anatomy issues 做视觉检查。

拒绝把 SD 1.5 LoRA 叠加到 SDXL base 上（dimension mismatch）。拒绝以 weight 1.0 同时运行 3+ 个 ControlNets（feature collision）。当用户有 SDXL 或 Flux 的 GPU budget 时，标记任何 SD 1.5 推荐。当 LoRA identity training 使用 &lt; 10 张图像时，标记为很可能 overfit。
