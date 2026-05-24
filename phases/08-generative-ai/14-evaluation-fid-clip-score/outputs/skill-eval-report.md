---
name: eval-report
description: 规划完整的生成式模型评估：样本质量、遵循度、偏好、失效审计。
version: 1.0.0
phase: 8
lesson: 14
tags: [evaluation, fid, clip, elo]
---

给定一个新的 generative-model checkpoint、一个参考 baseline，以及一种 modality（image / video / audio / 3D），输出完整 eval plan：

1. 样本质量。10-30k 样本上相对 held-out real set 计算 FID / FD-DINO / CMMD。分辨率匹配。报告 3-seed mean +/- std。
2. 遵循度。在 prompt-image pairs 上计算 CLIP score / CMMD。text-to-image 需要包含 HPSv2 + ImageReward + PickScore。video 需要加入 vision-language metrics (V-Eval)。audio 需要加入 CLAP + MOS。
3. 成对偏好。相对 baseline，在 200-2000 个 prompt 上进行盲测 A/B。Human + LLM-judge + PartiPrompts coverage。
4. 类别拆解。按 prompt category（people, animals, text rendering, composition, style）统计表现。即使全局指标提升，也要标记每个类别的回归。
5. Safety / misuse。NSFW classifier、deepfake detector、watermark check、对 top-K generations 做 copyright similarity scan。
6. 签核。显式 gate：FID 在 baseline +5% 以内，或 &gt;55% human win rate，或有记录的定性优势。禁止单指标主张。

拒绝报告 N &lt; 5000 的 FID。拒绝发布基于模型可能在训练中见过的 prompt 计算的 benchmark。拒绝只报告 LLM-judge 结果而没有人类交叉检查。标记任何声称某个指标 "went up 20%" 却不报告绝对基准值并且只报告单个 seed 的说法。
