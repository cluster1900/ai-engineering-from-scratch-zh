# Evidence: cheatsheets/vision-transformers.md

Abbreviations: V414 = phases/04-computer-vision/14-vision-transformers, V709 = phases/07-transformers-deep-dive/09-vision-transformers, M01 = phases/12-multimodal-ai/01-vision-transformer-patch-tokens, M06 = phases/12-multimodal-ai/06-any-resolution-patch-n-pack, C58 = phases/19-capstone-projects/58-vision-encoder-patches, C59 = phases/19-capstone-projects/59-vit-transformer. d = docs/en.md, c = code/main.py.

## ViT 流水线 (architecture, 8 nodes, 7 edges)
- Image (3, 224, 224): V414/d:31
- Patch embedding conv 16x16 s=16: V414/d:31
- Flatten to (196, 768) tokens: V414/d:32
- Prepend [CLS], 197 tokens: V414/d:33, 64
- Add learned positional embed, (197, 768): V414/d:34, 74
- N transformer encoder blocks, pre-LN: V414/d:35, 81, 94
- Take [CLS] token output: V414/d:36
- MLP classifier: V414/d:37

## 形状与开销计算 (concepts, 8 bullets)
- (H/P) x (W/P) grid, 224 at 16 gives 14x14 = 196: M01/d:28, 31
- 3 P^2 values, 16 x 16 x 3 = 768: M01/d:28, 32
- nn.Conv2d(3, D, kernel_size=P, stride=P), same as unfold then linear: M01/d:35, C58/d:46
- sequence 197 with CLS, registers add to it: M01/d:33, M01/c:49-52
- 196 * 196 = 38,416 vs 150,528 * 150,528 = 22.6 billion: C58/d:38
- head_dim = hidden / num_heads, 768 / 12 = 64: C59/d:52
- block = 12 * 768^2 + 3k = 7.1M, 12 blocks = 85M: M01/d:80-82
- 3 * P * P * hidden + hidden, 590,592: C58/d:54, 58

## 微型 ViT 前向 (annotated-code, 8 lines)
- ViT(image_size=64, patch_size=16, num_classes=10, dim=192, depth=6, num_heads=3): V414/c:65
- forward body: V414/c:53-60
- shapes (N, 16, 192) and (N, 17, 192): V414/d:254
- trunc_normal_ std=0.02 init of pos_embed: V414/c:50
- pre-LN block: V414/c:31-36, V414/d:158

## ViT-B 规模的 pre-LN 块 (annotated-code, 8 lines)
- ViTConfig defaults 224, 16, 768, depth 12, heads 12: C59/c:49-55
- qkv reshape and permute, q, k, v split: C59/c:91-92
- scores with self.scale = 1.0 / math.sqrt(cfg.head_dim): C59/c:81, 94
- F.softmax, no mask, bidirectional encoder: C59/c:95, C59/d:72
- pre-LN residual lines: C59/c:131-132
- FFN hidden -> 4 * hidden -> hidden: C59/d:56
- tokens, cls = encoder(img), (1, 197, 768): C59/c:195, C59/c:165, C59/d:100

## 代码中的任务 (task-table, 8 rows)
- timm.create_model("vit_base_patch16_224", ...): V414/d:238
- patchify(image, patch_size): V709/c:17
- sinusoidal_2d(grid_h, grid_w, dim): C58/c:42
- unfold_then_linear(x, weight, bias, patch_size): C58/c:149
- seq_length(cfg): M01/c:49
- flops_per_forward(cfg): M01/c:88
- pack_batch(images, patch): M06/c:42
- build_dense_mask(pack): M06/c:52

## 命令 (command-table, 4 rows)
- python3 code/main.py (19.58), output (1, 197, 768): C58/d:82, 85
- python3 code/main.py (19.59), about 86M params: C59/d:97, 100
- python3 -m unittest code/test_main.py: C58/d:104, C59/d:126
- code/main.py (12.01) patch tokenizer and geometry calculator: M01/d:106

## 模型规模 (defaults, 8 rows)
- ViT-B/16 86M, dim=768, depth=12, heads=12: V414/d:90, 267
- ViT-Large ~307M: V709/d:106. hidden=1024, depth=24, heads=16: C59/d:106
- ViT-Huge ~632M: V709/d:106. 1280 feature dim: V414/d:57
- SigLIP So400M 400M, hidden=1152, depth=27, heads=16: C59/d:68, 106, M01/d:92
- Tiny ViT 2.8M, dim=192, depth=6, CPU: V414/d:213, 219
- MLP 4x, 2x underfits, 8x overfits: C59/d:56
- 4 register tokens, DINOv2 and SigLIP 2: M01/d:49, 95, C59/d:109
- MAE mask 75%, encoder sees 25%: V414/d:124

## patch 大小与 token 数 (defaults, 7 rows)
- patch 16 gives 196 tokens: V414/d:98
- patch 32 gives 49 tokens: V414/d:99
- patch 8 gives 784 tokens, quadratic cost: V414/d:100
- SigLIP 2 SO400m/14 at 384, 729 patch tokens: M01/d:91, 93
- NaFlex 256, 729, 1024: M06/d:67, 130
- AnyRes 672x672 2x2 + thumbnail = 2880: M06/d:53
- OCR 1024-4096 tokens, photos 256-576: M06/d:86, 88

## 用 patch-n'-pack 打包混合 batch (flow, 6 steps)
1. Native grid at patch 14: M06/d:34
2. Flatten per image: M06/d:35
3. Concatenate, offsets, cu_seqlens: M06/d:36, 76, M06/c:46-49
4. Block-diagonal mask: M06/d:37, 73
5. 2D RoPE or fractional positions: M06/d:38
6. 576 + 256 + 768 = 1600-token sequence, no padding: M06/d:40

## 池化与位置的选择 (concepts, 7 bullets)
- [CLS], original ViT, CLIP: M01/d:47
- Mean pool, SigLIP, DINOv2: M01/d:48
- Register tokens 4-16, artifacts, discarded before handoff: M01/d:49, 51
- Learned 1D ties to training resolution: M01/d:39
- 2D sinusoidal fixed, 0 params, half row half column: C58/d:50, 55
- 2D-RoPE rotates q and k by (row, column), no table: M01/d:41, M06/d:131
- VLM handoff skips pooling: M01/d:51

## 排障 (troubleshooting, 8 rows)
- ViT loses to ResNet on ImageNet-1k, DeiT, MAE: V414/d:21, 106, 126
- Post-LN struggles past 6-8 layers, pre-LN: V414/d:94
- Learned table needs interpolation, 2D-RoPE handles any grid: M01/d:39, 41
- Square resize squishes text and destroys labels: M06/d:23
- Pad wastes 50%+ tokens: M06/d:25
- High-norm artifact patches, registers: M01/d:49
- patch_size must divide image_size: C58/c:31-34
- sinusoidal_2d dim must be divisible by 4: C58/c:49-50

## 问题 (qa, 5 bullets)
- 150,528 tokens, quadratic attention: M01/d:17, C58/d:19
- pre-LN trains deep stacks without warmup: V414/d:94
- patch 14 more tokens, OCR, slower: M01/d:68, 142
- DINOv2 dense, CLIP/SigLIP for text matching: M01/d:62
- learned wins at fixed resolution, sinusoidal when resolution changes: C58/d:109
