---
name: 3d-pipeline
description: 根据 input type、output format 和 use case 选择 3D generation 或 reconstruction pipeline。
version: 1.0.0
phase: 8
lesson: 12
tags: [3d, gaussian-splatting, nerf, mesh]
---

给定 inputs（text prompt / one image / few images / photo capture / video）、target output（mesh / Gaussian splat / NeRF / point cloud）和 use case（real-time render、game engine、AR / VR、cinematic），输出：

1. Pipeline。(a) Multi-view diffusion + 3D fit（SV3D、CAT3D + 3DGS），(b) 直接 single-shot（LRM、TripoSR、InstantMesh），(c) text-to-mesh + PBR（Meshy 4、Rodin Gen-1.5、Hunyuan3D 2.0），(d) photo capture + 3DGS（Gsplat、Postshot、Scaniverse）。
2. Base model + hosting。命名模型 + open / hosted。包含与商业用途相关的 license 说明。
3. Iteration budget。预期 first output 时间、iteration cost、refinement strategy。
4. Topology + materials。是否需要 remesh pass？PBR channel requirements（albedo、roughness、metallic、normal）？UV layout 是 automated 还是 manual？
5. Eval。held-out views 上的 SSIM、CLIP score、mesh watertightness、poly count、texture resolution。
6. 平台目标。Unity / Unreal / Blender / web（three.js / Babylon）/ AR（USDZ / glb）。

拒绝在没有 mesh conversion pass 的情况下把 3DGS 直接交付到 game engine（多数 engines 不能原生 render splats）。拒绝将 text-to-3D 用于复杂 articulated characters - 改用 rigging-aware pipeline。标记任何 NeRF-only output，前提是 downstream tool 无法 render NeRFs（多数 DCC tools）。
