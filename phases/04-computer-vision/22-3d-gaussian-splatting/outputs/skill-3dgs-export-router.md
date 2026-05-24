---
name: skill-3dgs-export-router
description: 根据下游 viewer 或 engine 选择正确的 3DGS 导出格式（.ply / .splat / glTF KHR_gaussian_splatting / USD）
version: 1.0.0
phase: 4
lesson: 22
tags: [3d-gaussian-splatting, export, glTF, OpenUSD, pipeline]
---

# 3DGS 导出 Router

将下游目标映射到正确的 3DGS 文件格式。省下数小时“它加载不了”的 debugging 时间。

## 何时使用

- 在训练完 3DGS scene 后、将其交给 content pipeline 之前。
- 在 research-grade（.ply）和 production-grade（glTF / USD）格式之间做选择。
- Pipeline handoff：采集团队 -> 3DGS 工程师 -> 游戏设计师 / VFX 艺术家 / web 开发者。

## 输入

- `target_engine`: unreal | unity | omniverse | blender | vision_pro | three_js | babylon_js | cesium | playcanvas | supersplat
- `priority`: portability | file_size | quality_preservation
- `include_sh_degree`: 0 | 1 | 2 | 3

## 格式决策

| Target | Recommended format | Why |
|--------|--------------------|-----|
| Unreal Engine（virtual production） | Volinga plugin 或 glTF KHR_gaussian_splatting | Native Unreal SDK path |
| Unity（XR / game） | 通过 Aras-P Unity-GaussianSplatting plugin 使用 .ply | 社区标准 Unity pipeline |
| NVIDIA Omniverse, Pixar tools | OpenUSD 26.03（UsdVolParticleField3DGaussianSplat） | Native USD prim type |
| Apple Vision Pro | OpenUSD 26.03 | Native to visionOS 2.x |
| Blender | .ply + KIRI Engine add-on | 社区 add-on 可读取 raw splats |
| Three.js web viewer | glTF KHR_gaussian_splatting 或 .splat | Browser 标准，可配合 `GaussianSplats3D` 使用 |
| Babylon.js V9+ | glTF KHR_gaussian_splatting | V9 增加了 native support |
| Cesium（CesiumJS 1.139+, Cesium for Unreal 2.23+） | glTF KHR_gaussian_splatting | 已发布明确支持 |
| PlayCanvas | .splat | PlayCanvas native quantised format |
| SuperSplat（editor） | .ply 或 .splat | Import + export |

## Quantisation 权衡

- `.ply` full-precision：文件最大、无损、适用于任意 viewer。
- `.splat`：小 4x-8x，SH3 coefficients 有轻微质量损失，是 PlayCanvas ecosystem 标准。
- glTF KHR：可通过 EXT_meshopt_compression 配置；在最高兼容性下体积最小。
- USD：由 USDZ packaging 压缩；对 Apple pipelines 最小。

## 输出报告

```
[export plan]
  target:         <engine>
  format:         <name>
  sh degree:      <0|1|2|3>
  compression:    <none|meshopt|quantisation|usdz>
  expected size:  <MB>
  compatible with: <list of viewers>

[pipeline]
  1. source: <.ply from training>
  2. optional: SuperSplat cleanup pass
  3. convert: <tool + CLI or API call>
  4. package: <.gltf / .glb / .usd / .usdz / .splat / .ply>
  5. validate: <viewer sanity check>
```

## 规则

- 绝不要静默移除 SH3 coefficients，这会明显改变 specular reflections。
- 如果 `priority == file_size`，推荐 `.splat` 或带 meshopt 的 glTF；同时提醒会有质量损失。
- 对 Apple platforms，在 2026 年优先选择 USD / USDZ 而不是 glTF；USDZ 对 visionOS 有 first-class support。
- 如果目标 viewer 的 3DGS support 仍是 pre-standard（2026 年 2 月之前），推荐 `.ply` 和该 viewer 的 custom loader；Khronos-standard glTF 还不会被识别。
- 在 handoff 之前，务必至少在一个 viewer 中验证导出的文件；quantisation 过程中可能发生静默损坏。
