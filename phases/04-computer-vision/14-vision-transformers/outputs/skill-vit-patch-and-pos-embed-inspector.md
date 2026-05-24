---
name: skill-vit-patch-and-pos-embed-inspector
description: 验证 ViT 的 patch embedding 和 positional embedding shape 是否与模型预期的序列长度匹配
version: 1.0.0
phase: 4
lesson: 14
tags: [vision-transformer, debugging, pytorch]
---

# ViT Patch 和 Positional Embedding 检查器

最常见的 ViT 移植 bug：把在 224x224 上 pretrained 的 checkpoint 加载到配置为 384x384 的模型中（或反过来）。positional embedding 的序列长度错误，模型会悄悄产生垃圾输出。

## 何时使用

- 在非默认分辨率上 fine-tuning 一个 pretrained ViT。
- 审计为什么 ViT-B/16 和 ViT-B/32 之间的 weight port 失败；检查器会标记 patch-size mismatch，让调用者知道应该更换架构，而不是强行移植。
- 调试一个加载时没有报错但训练效果很差的 ViT。

## 输入

- `model`：一个已实例化的 ViT `nn.Module`。
- `expected_image_size`：模型在生产环境中会看到的 H x W。
- `patch_size`：预期的 patch size。

## 步骤

1. 定位模型内部的 patch embedding conv。报告它的 `kernel_size`、`stride`、`in_channels`、`out_channels`。
2. 计算预期 patch 数量。对于正方形图像：`(image_size / patch_size)^2`。对于矩形：`(H / patch_size) * (W / patch_size)`。要求 `H % patch_size == 0` 且 `W % patch_size == 0`；否则标记并拒绝继续。
3. 定位 learned positional embedding。报告它的 shape `(1, N, dim)`。
4. 将 `N` 与 `num_patches + 1`（带 CLS）或 `num_patches`（不带 CLS）比较。不匹配意味着 checkpoint 是在不同分辨率或 patch size 上 pretrained 的。
5. 检查 patch conv 的 `out_channels` 是否等于 positional embedding 的 `dim`。
6. 如果模型应该为新分辨率插值 positional embeddings，验证插值工具是否存在（大多数 `timm` ViTs 会通过 `resize_pos_embed` 自动处理）。

## 报告

```
[vit-inspector]
  image_size:         HxW
  patch_size:         <int>
  num_patches (computed): <int>
  patch_conv:         k=<int>  s=<int>  in=<int>  out=<int>
  pos_embed shape:    (1, N, dim)
  has CLS token:      yes | no
  pos_embed N:        <int>    expected: <int>
  verdict:            ok | mismatch

[if mismatch]
  action:  reinitialise pos_embed for new sequence length
  tool:    timm.models.vision_transformer.resize_pos_embed
```

## 规则

- 绝不要在没有警告的情况下静默插值；要暴露该操作，让用户知道 pretrained positional structure 可能已经发生偏移。
- 如果 patch_size 不匹配，拒绝推荐插值——应切换到正确的架构。
- 不要尝试就地修复模型；只报告并提出建议。
