# Evidence: cheatsheets/unified-multimodal.md

Abbreviations: P12 = phases/12-multimodal-ai. VAR = phases/08-generative-ai/19-visual-autoregressive-var. CH = P12/11-chameleon-early-fusion-tokens, EMU = P12/12-emu3-next-token-for-generation, TF = P12/13-transfusion-autoregressive-diffusion, SO = P12/14-show-o-discrete-diffusion-unified, JP = P12/15-janus-pro-decoupled-encoders, MIO = P12/16-mio-any-to-any-streaming. d = docs/en.md, c = code/main.py.

## Four unified designs side by side (comparison, 7 rows)
- Image form: CH/d:36-42 discrete VQ, TF/d:31 continuous 16x16 patches, SO/d:19 discrete, JP/d:29-31 SigLIP in, VQ out
- Image loss: CH/d:42 one loss, EMU/d:36 next-token, TF/d:37 and TF/d:63-64 flow matching MSE, SO/d:41 cross-entropy on MASK tokens, JP/d:65 emits VQ tokens autoregressively
- Image attention: CH/d:27 one autoregressive decoder, TF/d:43 and TF/d:50 bidirectional within image, SO/d:33 bidirectional within image block, JP/d:67 text-style transformer body
- Image decode: SO/d:48 1024-4096 passes, TF/d:69 10-30 steps, SO/d:45 ~16 steps, JP/d:65 autoregressive
- Visual encoders: CH/d:33-38 VQ-VAE, TF/d:88 linear projection, SO/d:19 discrete tokens, JP/d:27-31 SigLIP and VQ
- Weak point: CH/d:84-85 tokenizer ceiling, SO/d:83 slow inference, TF/d:91 loss weights need tuning, SO/d:84 lossy by tokenizer, JP/d:83 two tokenizers to train
- Key number: EMU/d:67 FID 5.4 vs 5.6, TF/d:87 3-5 FID points at 7B, SO/d:45 ~16 vs ~1000, JP/d:54 GenEval 0.80 vs 0.67

## Use X when (tips, 8)
- Chameleon family for image generation, mixed-modality output: CH/d:59, CH/d:93
- Adapter VLM for understanding only, reuses pretrained compute: CH/d:93, LLaVA-family JP/d:83
- Emu3 one checkpoint, prompt templates, gen + chat + video: EMU/d:55-61
- Transfusion when quality is paramount, two-loss plumbing: SO/d:88
- Show-o for T2I + inpainting + VQA, reasonable speed: SO/d:88
- Janus-Pro for both, SD3 / Flux for generation only: JP/d:85-87
- VAR about 10 passes vs DiT 28-50: VAR/d:69
- MIO speech in and out, <500ms TTFAB: MIO/d:24, MIO/d:145

## Janus-Pro decoupled routing (architecture, 8 nodes)
- Input image, understand path starts here: JP/d:29
- SigLIP-SO400m then 2-layer MLP: JP/d:29
- Generation path through VQ tokenizer, optional conditioning image: JP/d:30, JP/c:79-80
- Text prompt, task tag routes: JP/d:35, JP/c:50-61
- Shared body, init DeepSeek-MoE-7B: JP/d:33, JP/d:69
- Image VQ tokens predicted by the body: JP/d:31, JP/d:65
- Text out autoregressively: JP/d:64
- VQ decoder to pixels: JP/d:31

## Show-o masked sampling loop (flow, 6 steps)
1. All tokens MASK, SEQ_LEN 16, VOCAB 8: SO/c:14-16, SO/c:67
2. cosine_schedule(T), T=8: SO/c:19-21, SO/c:66, SO/c:92
3. predict all masked in parallel: SO/d:45, SO/c:46-53
4. keep most confident, keep_ratio = max(0.15, 1 - ratios[step]): SO/c:57-62, SO/c:74
5. rest stay masked for next step: SO/c:60-63, SO/c:70-76
6. step_unmask(tokens, prompt_seed, 1.0) fills the rest: SO/c:77-78

## Residual multi-scale tokenizer (annotated-code, 10 lines)
- SCALES = (1, 2, 4, 8), 8x8 image: VAR/c:35-36
- CODEBOOK = 16: VAR/c:37
- residual = img.copy() and loop over zip(SCALES, codebooks): VAR/c:109-111
- downsample, encode, recon = book[tok], residual update, tokens.append: VAR/c:112-116
- decoder out = out + upsample(book[tok], IMG): VAR/c:120-126

## Two-loss step (annotated-code, 8 lines)
- weights dict with text_w 1.0, img_w 0.1: TF/c:114
- build_mask(tokens), causal text, bidirectional image: TF/c:44-45, TF/c:130
- text_loss line: TF/c:94
- t = random.random(): TF/c:97
- xt interpolation: TF/c:98
- target_vel = n - x: TF/c:103
- img_loss = mse(pred_flat, tgt_flat): TF/c:107
- total line: TF/c:109

## Tasks in code (task-table, 8)
- tokenize_multiscale(img, codebooks): VAR/c:106
- image_to_tokens(img), 8x8 to 4 tokens: CH/c:44-58, CH/c:140
- TokCost("image 512x512", 512, 8) and tokens(): EMU/c:17-32, EMU/c:40
- cfg_mix(cond_logits, uncond_logits, gamma): EMU/c:61-64
- sample_tokens(cond, uncond, gamma=3.0, temp=0.8): EMU/c:92-93, EMU/c:111
- route(prompt): JP/c:50-61
- build_vocab(): MIO/c:23-41
- streaming_decode_latency(model_size_b=8): MIO/c:79-82, MIO/c:149

## Key formulas (concepts, 7)
- Residual VQ sum: VAR/d:36-40
- Flow matching x_t and MSE against epsilon - x_0: TF/d:63-64
- CFG mixed = uncond + gamma * (cond - uncond): EMU/c:63
- Cosine mask ratio, 1.0 at step 0, none at step T: SO/d:69-73
- Show-o loss on MASK tokens, text masks only last token: SO/d:41
- 32000 + 8192 = 40192: CH/d:42
- 32 * 32 * 8 = 8,192 video tokens, 4 s at 8 FPS, 256x256: EMU/d:30

## Numbers to keep (defaults, 8)
- 8192, 1024 tokens per 512x512: CH/d:36, CH/d:42
- 32768, 4096 tokens, 30.5 dB: EMU/d:26, EMU/d:28
- CFG 3.0-7.0, with and without caption: EMU/d:49
- temperature 0.8, 1.0 for perception: EMU/d:51
- 10-30 steps, conditioned on prior text: TF/d:69
- MaskGIT 8-16 iterations, cosine works well: SO/d:24
- VAR K = 10, 10 passes for 256x256: VAR/d:69
- <500ms conversational: MIO/d:24, MIO/d:145

## Troubleshooting (troubleshooting, 8)
- 34B diverged, logit magnitude explosion, QK-Norm and dropout after every residual-add: CH/d:67-71
- PSNR 26-28 dB ceiling, better tokenizer: CH/d:75-77, continuous patches TF/d:17-23
- one head dominates, schedule mismatch, tune loss weights: TF/d:91
- image artifacts when temperature is too high, 0.8 for image gen: EMU/d:51
- mode collapse when temperature is too low: EMU/d:51
- ~2 minutes per 512x512, 4096 tokens at 30 tok/s, speculative decoding and KV-cache: EMU/d:77
- skip stage 2 loses cross-modality context: MIO/d:66, MIO/d:70
- skip stage 3 speech is poor: MIO/d:67, MIO/d:70

## Abbreviations (glossary, 8)
- VAR: VAR/d:125
- VQ-VAE: CH/d:33, CH/d:138
- NTP: EMU/d:115
- CFG: EMU/d:118
- IBQ, 32768+: EMU/d:26, EMU/d:116
- MMDiT, joint attention: TF/d:134
- TTFAB: MIO/d:145
- Residual-VQ, base content, later prosody: MIO/d:142

## Questions (qa, 6)
- one encoder fails, VQ weak semantics, SigLIP poor reconstruction: JP/d:19-20
- inpainting free from masked prediction: SO/d:63
- VAR one pass per scale in parallel: VAR/d:69, VAR/d:75
- Transfusion text attends to previous images, image to preceding text: TF/d:51-52
- Janus-Pro 7B vs 1.3B, 72M vs 26M stage 2: JP/d:47-51
- MIO disjoint ID ranges: MIO/d:36
