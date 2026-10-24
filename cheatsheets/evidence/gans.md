# Evidence: cheatsheets/gans.md

Abbreviations: T = phases/08-generative-ai/01-generative-models-taxonomy-history, G3 = phases/08-generative-ai/03-gans-generator-discriminator, P2P = phases/08-generative-ai/04-conditional-gans-pix2pix, SG = phases/08-generative-ai/05-stylegan, CV9 = phases/04-computer-vision/09-image-generation-gans. d = docs/en.md, c = code/main.py.

## StyleGAN 生成器 (architecture, 7 nodes, 6 edges)
- z, N(0, I) with 512 dims: SG/d:22
- Mapping network, 8-layer MLP: SG/d:14, 22
- w in W, roughly disentangled: SG/d:125
- Learned constant 4×4×512: SG/d:14, 24
- Synthesis block upsample, conv, AdaIN, noise: SG/d:24
- Image, resolutions 4 up to 1024, doubling: SG/d:24
- Per-layer noise with a learned per-channel factor: SG/d:34
- AdaIN at every resolution: SG/d:3, 14

## 一个训练步 (flow, 7 steps)
1. Real batch and z ~ N(0, I): CV9/d:28, G3/d:28
2. D scores real against 1 and G(z).detach() against 0: CV9/c:67-70, CV9/d:183-185
3. Fresh fakes, D(G(z)) against 1: CV9/c:75-76, G3/d:89
4. One D step, one G step: G3/d:37, CV9/d:171
5. Probe every 100 steps, warn below 50 per mode: G3/c:174-180
6. Look at 64 samples every epoch: CV9/d:99
7. p_G = p_data, D outputs 0.5 everywhere: CV9/d:51

## 损失与公式 (concepts, 8)
- Minimax: CV9/d:46
- D loss is BCE on real=1, fake=0: G3/d:34
- Non-saturating G loss -log D(G(z)): G3/d:35, CV9/d:60
- WGAN loss_D and loss_G: G3/d:134
- Pix2Pix loss_G with lambda L1: P2P/d:30
- Cycle consistency F(G(x)) ≈ x, G(F(y)) ≈ y: P2P/d:39
- AdaIN formula: SG/d:29
- Truncation w' = ŵ + ψ(w − ŵ), ψ < 1 trades diversity for quality: SG/d:36

## DCGAN train_step (annotated-code, 12 lines)
- opt_d.zero_grad, d_real, d_fake with detach: CV9/c:66-68
- loss_d as two BCE-with-logits terms: CV9/c:69-70
- backward and step for D: CV9/c:71-72
- G step with D(G(z)) and ones_like: CV9/c:74-78
- Sigmoid only in the loss: CV9/d:167
- detach stops gradients into G: CV9/d:199

## 代码中的任务 (task-table, 8)
- Generator(z_dim=64, img_channels=3, feat=32): CV9/c:114
- spectral_norm(c): CV9/c:46
- Adam(lr=2e-4, betas=(0.5, 0.999)): CV9/d:236
- sample(G, n=8, z_dim=z_dim, device=device): CV9/c:132
- sum(p.numel() for p in G.parameters()): CV9/c:119
- inp = z + one_hot(c, num_classes): P2P/c:49
- w = mapping(z, mapping_net): SG/c:90
- w_bar[i] + psi * (w_test[i] - w_bar[i]): SG/c:110

## 四种 GAN 对比 (comparison, 5 rows)
- Input: noise z (CV9/d:39), image x with dropout as z (P2P/d:18), domain X (P2P/d:39), z mapped to w (SG/d:14)
- Generator: transposed convs and tanh (CV9/d:28, 73), U-Net with skips (P2P/d:22), G: X to Y and F: Y to X (P2P/d:39), constant plus AdaIN (SG/d:24)
- Extra loss: lambda L1 (P2P/d:30, 35), cycle consistency (P2P/d:39), path-length regularization in StyleGAN2 (SG/d:43)
- Data: paired (P2P/d:13), unpaired (P2P/d:39), narrow domain faces (SG/d:48, 101)
- Use for: 32x32 images (CV9/d:12), sketch to photo (P2P/d:96), horses to zebras, summer to winter (P2P/d:39), faces and editing (SG/d:48, 102)

## 单次前向与多步对比 (comparison, 2 rows)
- Steps 1, 20, 1-4, 20-30: P2P/d:132-135
- Latency at 512² on a single L4: ~30 ms, ~1.2 s, ~0.15-0.35 s, ~3-5 s: P2P/d:130-135

## 默认值 (defaults, 8)
- lr 2e-4: CV9/c:116-117, CV9/d:236
- betas (0.5, 0.999), low beta1: CV9/d:236
- z_dim 64: CV9/c:109, CV9/d:114
- LeakyReLU 0.2 on all D layers: CV9/d:74
- lambda 100, anneal down: P2P/d:35, 86-87
- ~70×70 receptive field per cell: P2P/d:24
- psi 0.7, use 1.0 for diversity: SG/d:36, 94
- TTUR factor 2-4: CV9/d:93, 300

## 故障排查 (troubleshooting, 8)
- Mode collapse signature and fix: CV9/d:82, 91
- D wins signature and fix: CV9/d:83, 92
- Oscillation signature and fix: CV9/d:84, 93
- D above 95% accuracy, cut D learning rate by 2-5x: G3/d:106
- G memorizes a mode, noise on D inputs or WGAN-GP: G3/d:107
- Condition ignored, condition D early, projection D: P2P/d:85
- L1 weight too high gives blur, anneal: P2P/d:87
- Droplet artifacts, weight demodulation: SG/d:92

## 术语 (glossary, 8)
- DCGAN rules: CV9/d:70-74, G3/d:47
- WGAN-GP: G3/d:48
- Spectral norm bounds Lipschitz constant: CV9/d:301
- TTUR two learning rates: CV9/d:300
- cGAN G(z, c), D(x, c): P2P/d:118
- PatchGAN N × N grid: P2P/d:24
- AdaIN: SG/d:126
- FID, lower is better: CV9/d:100

## 何时用哪个 (tips, 6)
- GAN for real-time under 10 ms, style transfer, image-to-image: CV9/d:279
- StyleGAN3 for faces with a fixed pose: G3/d:118
- Pix2Pix with thousands of pairs, narrow task, fast inference: P2P/d:105
- CycleGAN without pairs: P2P/d:39
- Freeze mapping network for domain adaptation: SG/d:105
- Diffusion or flow matching for multi-modal, open-ended: G3/d:123

## 问答 (qa, 6)
- detach stops gradients into G: CV9/d:199
- D(G(z)) near zero gives vanishing gradients: CV9/d:55
- eval mode uses batch norm running stats: CV9/d:250
- D needs the pair to check consistency: P2P/d:20, 88
- StyleGAN3 under 10 ms at 1024² on a 4090: SG/d:108, 135
- GAN is implicit density, no p(x): T/d:26, 115
