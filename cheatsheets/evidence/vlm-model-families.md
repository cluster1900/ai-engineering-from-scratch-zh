# Evidence: cheatsheets/vlm-model-families.md

Abbreviations: P = phases/12-multimodal-ai. L05 = P/05-llava-visual-instruction-tuning, L06 = P/06-any-resolution-patch-n-pack, L08 = P/08-llava-onevision-single-multi-video, L09 = P/09-qwen-vl-family-dynamic-fps, L10 = P/10-internvl3-native-multimodal. d = docs/en.md, c = code/main.py.

## 各家族并排对比 (comparison, 7 rows)
- Vision to LLM: LLaVA 2-layer MLP with GELU L05/d:37. OneVision same projector L05/d:96. Qwen2-VL MLP on merged patch tokens L09/d:44. InternVL3 no alignment pretraining, no projector freezing stage L10/d:41.
- Recipe: post-hoc list (LLaVA, Qwen-VL) L10/d:17, L10/c:73. Native pretraining L10/d:34, L10/c:73.
- High resolution: AnyRes 336 crops plus thumbnail L05/d:90. AnyRes-9 and AnyRes-4 with 384 tiles L08/d:34. Native res divisible by 28 L09/d:42. ViR tiers L10/d:59-61.
- Video: per-frame concat L05/d:107. 32 frames, 196 tokens L08/d:36. Dynamic FPS and absolute-time M-RoPE L09/d:53-54. 5% video-text L10/d:39.
- Visual tokens: 576 and 2880 L05/d:102. 6000-9000 per sample L08/d:32. Budget scales with input L08/d:80. 256, 576, 2048+ L10/d:61.
- Training: two stages L05/d:53-61. Stages SI, OV, TT L08/d:42-46. Stages emphasize OCR, grounding, agent behavior L09/d:3. Single stage then instruction tuning L10/d:43.
- Swap the LLM: retrain the projector L05/d:78. Post-hoc retrains only the adapter, native gives up the option L10/d:87. Base-LLM swap impossible for native L10/c:72.

## LLaVA 前向传播 (architecture, 6 nodes, 5 edges)
- Image 336x336, CLIP ViT-L/14 @ 336: L05/d:36.
- 576 patches of dim 1024: L05/d:43.
- 2-layer MLP 1024 → 4096 → 4096, GELU: L05/d:37, 44.
- Prompt with system + <image> + user: L05/d:45.
- Replace <image> with 576 projected tokens: L05/d:46.
- LLM Vicuna-13B, later Llama-3.1-8B: L05/d:38. Feed full sequence: L05/d:47.

## Qwen-VL 演进 (flow, 5 steps)
1. Qwen-VL 448 res, grounding as text, Q-Former with 256 queries: L09/d:30-33, L09/c:168.
2. Qwen2-VL M-RoPE, native dynamic resolution, MLP projector: L09/d:38-44, L09/c:169.
3. Qwen2.5-VL dynamic FPS, absolute-time M-RoPE, window attention: L09/d:49-55.
4. JSON tool calls, ScreenSpot 55% to 84%: L09/d:56, 109.
5. Qwen3-VL Qwen3 base, thinking mode, OCR, ViT and M-RoPE stay: L09/d:63, L09/c:171.

## 各家族的适用场景 (tips, 6)
- LLaVA ~20 hours on 8xA100: L05/d:128.
- OneVision one model for three scenarios, predictability: L08/d:38, 80.
- Qwen2.5-VL timestamps, JSON agent output, min_pixels/max_pixels: L09/d:53-56, 147.
- InternVL3 fewer text-benchmark points lost, native compute cost: L10/d:73, 85.
- Post-hoc LLM swap and cheaper: L10/d:87, 89.
- AnyRes when encoder frozen at 336x336: L06/c:175-176, L06/d:55.

## 各课的玩具代码 (task-table, 8)
- MLPProjector(PATCH_DIM, HIDDEN_DIM, LLM_DIM): L05/c:98.
- build_llava_prompt(system, user, image_tokens=576): L05/c:67, 116.
- pack_batch(images, patch): L06/c:42.
- build_dense_mask(pack): L06/c:52.
- anyres_cost(img, tile=336, thumb=336): L06/c:64.
- square_cost(img, side=336, patch=14): L06/c:92.
- plan_video(budget): L08/c:77.
- vir_sim(tiers): L10/c:46.

## M-RoPE、动态 FPS、工具调用 (annotated-code, 10 lines)
- MRoPEConfig(hidden=48, temporal_dim=16, height_dim=16, width_dim=16): L09/c:110.
- mrope_angles for image (0, 5, 7) and video t=3: L09/c:27, 114-115.
- mrope_rotate rotates each band by its axis: L09/c:40-59.
- VideoPlan(duration_s, tokens_per_frame=81, budget=32768, motion): L09/c:62-67, 132-135. 600.0 low motion: L09/c:129.
- plan.fps() first candidate <= fps_max: L09/c:69-80.
- plan.frame_times(): L09/c:82-86.
- plan.total_tokens() frames times tokens_per_frame: L09/c:88-89.
- parse_tool_call json.loads then slice { to }: L09/c:92-104.

## Token 计算 (concepts, 8)
- 576 tokens, 1472 left at 2048: L05/d:51.
- 4 * 576 + 576 = 2880: L06/d:53.
- 1344x1344 at 4x4 is 9216 + 576 ≈ 9800: L06/d:55.
- 1120x672 is 40x24 merged patches, 960 tokens: L09/d:42.
- AnyRes-9, 2x2 pool, 9 * 182 + 182 = 1820: L08/d:34.
- 32 * 196 = 6272: L08/d:36.
- fps_max = B / (T * tokens_per_frame): L09/d:89.
- 60 s at 4 FPS with 81 tokens per frame = 19440: L09/d:94.

## 训练配方 (comparison, 5 rows)
- First: train MLP only on 558k pairs L05/d:55. SI single image AnyRes L08/d:44. Native pretrain L10/d:34, 43.
- Second: 158k GPT-4 turns, projector + LLM L05/d:61. OV mix 0.5 / 0.3 / 0.2 L08/c:109. Instruction tuning follows L10/d:43.
- Third: TT target task mix L08/d:46.
- Frozen: ViT and LLM frozen in stage 1 L05/d:55. No weight reset L08/d:45. No projector freezing stage L10/d:41.
- Data: LAION-CC-SBU L05/d:55, LLaVA-Instruct L05/d:168. LLaVA-NeXT data plus OneVision data L08/d:44. 40/35/20/5 mix L10/d:36-39.

## 课程中的默认值 (defaults, 8)
- anyres_cost tile and thumb 336: L06/c:64. 576 per 336 tile: L05/c:131, L06/d:53.
- square_cost side 336: L06/c:92.
- image_tokens=576: L05/c:116.
- MRoPEConfig base 10000.0: L09/c:24.
- Qwen2-VL video 1-2 FPS default, any frame count: L09/d:45.
- OneVision toy planner budget = 4096: L08/c:125.
- Dynamic-FPS budget = 32768, 81 tokens after 3x pool: L09/c:124, 132.
- dvd_throughput llm_tokens 128: L10/c:52-53.

## 故障排查 (troubleshooting, 6)
- Square resize distorts text and chart labels: L06/d:23. Max-pixels cap, native aspect: L06/d:91.
- AnyRes 4x4 about 9800 tokens, M-RoPE no tile overhead: L06/d:55, 63.
- Block-diagonal mask, cu_seqlens: L06/d:37, 73-80.
- Wrong curriculum order hurts image performance: L08/d:48.
- GSM8K drops 5-10 points from post-hoc: L10/d:25. 40% text floor: L10/c:92.
- MRoPE-v2 scaling for long video frequency range: L09/d:57.

## 缩写 (glossary, 6)
- M-RoPE: L06/d:131, L09/d:142.
- V2PE: L10/d:47-53, 123.
- NaFlex 256/729/1024: L06/d:67, 130.
- ViR: L10/d:59, 124.
- DvD: L10/d:65, 125.
- SI, OV, TT: L08/d:44-46.

## 问答 (qa, 5)
- MLP beat Q-Former, LM loss, LLM swap, 32k-128k+ contexts: L05/d:76-78, 110.
- OneVision fixes budget and scales pooling, Qwen2.5-VL scales with input: L08/d:80.
- M-RoPE (t, h, w), t = 0 for images, no table: L09/d:43, 81.
- Native costs: compute, data scarcity, no LLM reuse: L10/d:85-87.
- DvD 8B + 400M encoder roughly doubles throughput: L10/d:67.
