# Evidence: cheatsheets/diffusion-models.md

Abbreviations: P08 = phases/08-generative-ai. VAE = P08/02-autoencoders-vae, GAN = P08/03-gans-generator-discriminator, DDPM = P08/06-diffusion-ddpm-from-scratch, LDM = P08/07-latent-diffusion-stable-diffusion, CN = P08/08-controlnet-lora-conditioning, FM = P08/13-flow-matching-rectified-flows, EV = P08/14-evaluation-fid-clip-score. doc = docs/en.md, code = code/main.py.

## Architecture: 带 CFG 的潜空间扩散 (8 nodes)
- text "Text encoder, frozen, CLIP or T5": LDM/doc:28
- noise "Noisy latent, starts as N(0, I)": LDM/doc:26, DDPM/doc:44
- den "Denoiser, U-Net or DiT": LDM/doc:26, 128
- cfg "CFG mix, cond and uncond": LDM/doc:70-73
- lat "Clean latent 64 x 64 x 4": LDM/doc:16, VAE/doc:103
- dec "VAE decoder, latent to pixels": LDM/doc:26, VAE/doc:147
- img "Image 512 x 512 x 3": VAE/doc:103
- enc "VAE encoder, training and img2img": LDM/doc:26, VAE/doc:147
- edge "cross attn": LDM/doc:28, 83. "T steps": DDPM/doc:44. "add noise": LDM/doc:26, 30

## Flow: DDPM 的训练与采样 (7)
1. linear beta 1e-4 to 0.02, alpha bar: DDPM/doc:26, code:98-105
2. draw x0, t, eps: DDPM/doc:42, code:114-117
3. closed form x_t: DDPM/doc:42, code:118
4. sinusoidal time embedding, eps_hat: DDPM/code:5-13, 119-120, doc:118
5. squared error, gradient step: DDPM/doc:94, code:121-122
6. x_T ~ N(0, I): DDPM/doc:44, code:129
7. reverse T to 1, noise except last: DDPM/doc:44, code:130-138

## 关键公式 (8)
- Forward q(x_t | x_0): DDPM/doc:23
- Alpha bar: DDPM/doc:26
- Simple loss: DDPM/doc:39, 161
- Reverse step: DDPM/doc:31
- VAE loss: VAE/doc:33-36
- GAN minimax: GAN/doc:19
- CFG: LDM/doc:73, 125
- Flow matching x_t and L: FM/doc:27, 39

## 代码中的任务 (8)
- x_t closed form: DDPM/code:118
- reparameterize: VAE/doc:70
- non-saturating G loss: GAN/doc:70-72
- label dropout 0.1, NULL_CLASS: LDM/code:143
- eps_cfg: LDM/doc:73
- target = x1 - x0: FM/doc:95
- Euler step x -= dt * net_forward(x, t): FM/doc:109
- pipe.vae.enable_tiling(): VAE/doc:149

## Annotated code: DDPM 调度、加噪与反向循环 (13 lines)
- betas, alphas, alpha_bars: DDPM/code:99-104
- eps, x_t: DDPM/code:117-118
- x = rng.gauss(0, 1), loop: DDPM/code:129-130
- eps_hat forward: DDPM/code:132
- mean: DDPM/code:134
- noise only when t > 0: DDPM/code:135-138 (if/else folded into a comment)

## 采样器与步数 (8)
- DDPM 1000: DDPM/doc:164, 170
- DDIM 20-50, same objective: DDPM/doc:165, 172
- DPM-Solver++ 10-20: DDPM/doc:172
- UniPC 8-16: DDPM/doc:172
- Flow Euler 4-8: FM/doc:71, code:143
- 2 reflows, 2-4 steps: FM/doc:63
- distillation 1-4, retraining: DDPM/doc:129, 173
- VAE or GAN one pass: VAE/doc:41, GAN/doc:154

## 默认值与数字 (8)
- beta start 1e-4: DDPM/doc:26
- beta end 0.02, x_T approx N(0, I): DDPM/doc:26
- T 1000, toy 40: DDPM/doc:26, code:160
- CFG w 3, sweet spot 3-7: LDM/doc:76, 93
- label dropout 10%: LDM/doc:70, DDPM/doc:151
- scaling_factor 0.18215 after encoding: LDM/doc:90
- LoRA rank 4-16, 64-128 heavy: CN/doc:48
- FID 10k: EV/doc:35, 141

## 故障排查 (8)
- posterior collapse, beta 0 to 1, free bits: VAE/doc:100
- mode collapse fixes: GAN/doc:41, 107
- D too strong, >95%, cut lr 2-5x: GAN/doc:106
- CFG too high, oily, 3-7: LDM/doc:93
- VAE scaling mismatch: LDM/doc:90
- NaN fp16 SD 1.x VAE at 1024², fp16-fix or bf16: VAE/doc:150
- LoRA on wrong base no-op: CN/doc:104
- FID low N, 3 seeds: EV/doc:35, 128, 130

## 缩写 (8)
- VAE: VAE/doc:137
- ELBO: VAE/doc:138
- GAN G and D: GAN/doc:28-30, 143
- DDPM: DDPM/doc:164
- DDIM: DDPM/doc:165
- CFG: DDPM/doc:166
- DiT: LDM/doc:128
- FID: EV/doc:162

## 问答 (5)
- log sigma2 unconstrained, softplus trap: VAE/doc:62
- blurry samples, mean: VAE/doc:101
- latent diffusion ~64x fewer FLOPs: LDM/doc:14
- FM and DDPM equivalent for Gaussian paths: FM/doc:75
- FID formula, Inception-v3, lower is better: EV/doc:28-32

## 提示 (6)
- closed form KL, Monte Carlo 3x slower: VAE/doc:86
- fresh fakes for G: GAN/doc:85, 89
- proper time embedding, raw t fails: DDPM/doc:126
- cosine schedule when quality plateaus: DDPM/doc:125
- ControlNet weights sum near 1.0, LoRA alpha <= 1.5: CN/doc:102-103
- report several metrics together: EV/doc:73-80
