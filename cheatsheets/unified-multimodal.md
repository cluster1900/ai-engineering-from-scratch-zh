---
id: unified-multimodal
title: Unified Multimodal Models
code: UM
subtitle: 选择一种统一架构。离散 NTP、双损失扩散、掩码扩散、解耦编码器、next-scale、任意到任意。
hue: 290
sources: phases/08-generative-ai/19-visual-autoregressive-var, phases/12-multimodal-ai/11-chameleon-early-fusion-tokens, phases/12-multimodal-ai/12-emu3-next-token-for-generation, phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion, phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified, phases/12-multimodal-ai/15-janus-pro-decoupled-encoders, phases/12-multimodal-ai/16-mio-any-to-any-streaming
source_hash: 7f3e1ab854d2d772
---

## 四种统一架构并排对比
type: comparison
span: 2
from: phases/12-multimodal-ai/11-chameleon-early-fusion-tokens/docs/en.md, phases/12-multimodal-ai/12-emu3-next-token-for-generation/docs/en.md, phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion/docs/en.md, phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified/docs/en.md, phases/12-multimodal-ai/15-janus-pro-decoupled-encoders/docs/en.md

| 因素 | Chameleon, Emu3 | Transfusion | Show-o | Janus-Pro |
|---|---|---|---|---|
| 图像形式 | 离散 VQ token | 连续的 16x16 patch | 离散 VQ token | 输入用 SigLIP，输出用 VQ token |
| 图像损失 | 下一个 token 的交叉熵 | Flow matching MSE | 被掩码 token 上的交叉熵 | 在 VQ token 上做 next-token |
| 图像注意力 | 因果 | 图像块内双向 | 图像块内双向 | 与文本同样的共享主体 |
| 图像解码 | 1024-4096 次前向，逐 token 生成 | 10-30 个扩散步 | 约 16 个并行步 | 逐 token 生成 |
| 视觉编码器 | 一个 VQ tokenizer | 线性 patch 投影 | 一个 VQ tokenizer | SigLIP 加 VQ tokenizer |
| 弱点 | tokenizer 上限，推理慢 | 损失权重需要调 | 受 tokenizer 损失限制 | 要训练两个 tokenizer |
| 关键数字 | Emu3 FID 5.4，SDXL 为 5.6 | 7B 时比 Chameleon 式好 3-5 个 FID 点 | 约 16 步，对比约 1000 步 | GenEval 0.80，DALL-E 3 为 0.67 |

## 何时用 X
type: tips
from: phases/12-multimodal-ai/11-chameleon-early-fusion-tokens/docs/en.md, phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified/docs/en.md, phases/12-multimodal-ai/15-janus-pro-decoupled-encoders/docs/en.md, phases/12-multimodal-ai/12-emu3-next-token-for-generation/docs/en.md, phases/08-generative-ai/19-visual-autoregressive-var/docs/en.md, phases/12-multimodal-ai/16-mio-any-to-any-streaming/docs/en.md

- Chameleon 家族：需要从一个解码器同时得到图像生成和混合模态输出。
- 适配器式 VLM（LLaVA 家族）：只需要理解能力。它复用了更多预训练算力。
- Emu3：想用一个 checkpoint 配合提示模板完成图像生成、感知和视频。
- Transfusion：质量优先，并且能承担双损失的工程管线。
- Show-o：想在一个开源模型里以合理速度完成 T2I、inpainting 和 VQA。
- Janus-Pro：理解和生成都需要。只做生成时选 SD3 或 Flux。
- VAR：想在约 10 次前向内生成类别条件图像，DiT 需要 28-50 次。
- MIO：需要一个模型完成语音输入和语音输出，TTFAB 低于 500ms。

## Janus-Pro 解耦路由
type: architecture
from: phases/12-multimodal-ai/15-janus-pro-decoupled-encoders/docs/en.md, phases/12-multimodal-ai/15-janus-pro-decoupled-encoders/code/main.py

```arch
node | img | 1,1 | Input image | | client
node | prompt | 1,2 | Text prompt | task tag picks the path | client
node | siglip | 2,1 | SigLIP-SO400m | then 2-layer MLP
node | vqin | 2,2 | VQ tokenizer | optional image condition
node | body | 3,1 | Shared body | init DeepSeek-MoE-7B | model
node | vqout | 3,2 | Image VQ tokens | predicted by the body
node | text | 4,1 | Text out | autoregressive
node | dec | 4,2 | VQ decoder | pixels
edge | img | siglip | understand
edge | img | vqin | generate
edge | prompt | body | text tokens
edge | siglip | body |
edge | vqin | body |
edge | body | text |
edge | body | vqout |
edge | vqout | dec |
```

## Show-o 掩码采样循环
type: flow
from: phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified/code/main.py, phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified/docs/en.md

1. **开始**：每个图像 token 都是 `MASK`。玩具示例用 `SEQ_LEN` 16 和 `VOCAB` 8。
2. **调度**：`cosine_schedule(T)` 为 T=8 步中的每一步给出一个掩码比例。
3. **预测**：transformer 并行预测所有被掩码的 token。
4. **确认**：保留置信度最高的 token。`keep_ratio = max(0.15, 1 - ratios[step])`。
5. **重复**：其余 token 在下一步继续保持掩码。
6. **结束**：`step_unmask(tokens, prompt_seed, 1.0)` 填上所有仍被掩码的 token。

## 残差多尺度 tokenizer（VAR）
type: annotated-code
lang: python
from: phases/08-generative-ai/19-visual-autoregressive-var/code/main.py

```python
SCALES = (1, 2, 4, 8)                       # 4 scales over an 8x8 image
CODEBOOK = 16                               # entries per scale
residual = img.copy()
for scale, book in zip(SCALES, codebooks):
    coarse = downsample(residual, scale)    # pool to scale x scale
    tok = encode(coarse, book)              # nearest code index
    recon = book[tok]
    residual = residual - upsample(recon, IMG)  # what is still missed
    tokens.append(tok)
out = out + upsample(book[tok], IMG)        # decoder sums every scale
```

## 双损失训练步（Transfusion）
type: annotated-code
lang: python
from: phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion/code/main.py

```python
weights = {"text_scale": 0, "img_scale": 0, "text_w": 1.0, "img_w": 0.1}
mask = build_mask(tokens)                   # causal text, bidirectional image
text_loss = sum(cross_entropy_toy(p) for p in text_probs) / len(text_probs)
t = random.random()                         # one timestep per image
xt = (1 - t) * x + t * n                    # noisy patch
target_vel = n - x                          # velocity target
img_loss = mse(pred_flat, tgt_flat)         # flow matching MSE
total = weights["text_w"] * text_loss + weights["img_w"] * img_loss
```

## 代码中的任务
type: task-table
from: phases/08-generative-ai/19-visual-autoregressive-var/code/main.py, phases/12-multimodal-ai/11-chameleon-early-fusion-tokens/code/main.py, phases/12-multimodal-ai/12-emu3-next-token-for-generation/code/main.py, phases/12-multimodal-ai/15-janus-pro-decoupled-encoders/code/main.py, phases/12-multimodal-ai/16-mio-any-to-any-streaming/code/main.py

| 任务 | 代码 |
|---|---|
| 每个尺度的残差 VQ token | `tokenize_multiscale(img, codebooks)` |
| 8x8 图像转成 4 个 token id | `image_to_tokens(img)` |
| 统计图像 token 数 | `TokCost("image 512x512", 512, 8).tokens()` |
| 混合引导 logits | `cfg_mix(cond_logits, uncond_logits, gamma)` |
| 以温度 0.8 做 CFG 采样 | `sample_tokens(cond, uncond, gamma=3.0)` |
| 选择理解还是生成 | `route(prompt)` |
| 布置 4 种模态的词表 | `build_vocab()` |
| 追踪 TTFAB 预算 | `streaming_decode_latency(model_size_b=8)` |

## 关键公式
type: concepts
from: phases/08-generative-ai/19-visual-autoregressive-var/docs/en.md, phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion/docs/en.md, phases/12-multimodal-ai/12-emu3-next-token-for-generation/code/main.py, phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified/docs/en.md, phases/12-multimodal-ai/11-chameleon-early-fusion-tokens/docs/en.md, phases/12-multimodal-ai/12-emu3-next-token-for-generation/docs/en.md

- **残差 VQ**：$f \approx \sum_k \mathrm{upsample}(\mathrm{embed}(z_k))$。尺度 k 保存尺度 1 到 k-1 遗漏的部分。
- **Flow matching**：$x_t = (1-t) x_0 + t \epsilon$。损失是 $v_\theta(x_t, t)$ 与 $\epsilon - x_0$ 的 MSE。
- **CFG**：mixed = uncond + gamma 乘以 (cond 减 uncond)。
- **余弦掩码比例**：$\cos(\pi t / 2T)$。第 0 步比例为 1.0，第 T 步没有掩码。
- **Show-o 损失**：被掩码 token 上的交叉熵。文本 NTP 只掩码最后一个 token。
- **Chameleon 词表**：32000 个文本 id 加 8192 个图像 id，共 40192。
- **Emu3 视频**：8 FPS、256x256 的 4 秒视频需要 32 * 32 * 8 = 8,192 个 token。

## 要记住的数字
type: defaults
from: phases/12-multimodal-ai/11-chameleon-early-fusion-tokens/docs/en.md, phases/12-multimodal-ai/12-emu3-next-token-for-generation/docs/en.md, phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion/docs/en.md, phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified/docs/en.md, phases/08-generative-ai/19-visual-autoregressive-var/docs/en.md, phases/12-multimodal-ai/16-mio-any-to-any-streaming/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| Chameleon codebook K | 8192 | 每张 512x512 图像 1024 个 token |
| Emu3 codebook | 32768 | 每张 512x512 图像 4096 个 token，PSNR 30.5 dB |
| CFG 引导权重 | 3.0-7.0 | 分别在有和没有 caption 时生成 |
| Emu3 温度 | 0.8 | 感知任务用 1.0 |
| Transfusion 去噪步数 | 10-30 | 以前面的文本为条件 |
| MaskGIT 迭代次数 | 8-16 | 余弦调度效果好 |
| VAR 尺度数 K | 10 | 256x256 图像需要 10 次前向 |
| TTFAB 目标 | <500ms | 对话般的体验 |

## 故障排查
type: troubleshooting
from: phases/12-multimodal-ai/11-chameleon-early-fusion-tokens/docs/en.md, phases/12-multimodal-ai/12-emu3-next-token-for-generation/docs/en.md, phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion/docs/en.md, phases/12-multimodal-ai/16-mio-any-to-any-streaming/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 34B 早融合训练发散 | 深层的 logit 幅值爆炸 | QK-Norm，每次残差相加后加 dropout |
| 图像 PSNR 停在 26-28 dB 附近 | VQ-VAE tokenizer 的上限 | 换更好的 tokenizer，或用连续 patch |
| 一个损失头占主导 | NTP 与扩散的调度不匹配 | 调整损失权重 |
| 图像有伪影 | 温度过高 | 图像生成用 0.8 |
| 模式坍缩 | 温度过低 | 调高温度 |
| 每张 512x512 图像约 2 分钟 | 30 tok/s 下要生成 4096 个 token | 投机解码、KV cache 优化 |
| 没有跨模态上下文 | 跳过了交错数据的第 2 阶段 | 训练全部四个课程阶段 |
| 语音效果差 | 跳过了语音增强的第 3 阶段 | 加入第 3 阶段的音频数据 |

## 缩写
type: glossary
from: phases/08-generative-ai/19-visual-autoregressive-var/docs/en.md, phases/12-multimodal-ai/11-chameleon-early-fusion-tokens/docs/en.md, phases/12-multimodal-ai/12-emu3-next-token-for-generation/docs/en.md, phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion/docs/en.md, phases/12-multimodal-ai/16-mio-any-to-any-streaming/docs/en.md

- **VAR**：Visual AutoRegressive。在 VQ 网格金字塔上做 next-scale 预测。
- **VQ-VAE**：向量量化变分自编码器。把特征映射成 codebook 索引。
- **NTP**：next-token prediction。由 token 0 到 i 预测 token i+1。
- **CFG**：classifier-free guidance。混合有条件和无条件的 logits。
- **IBQ**：Inverse Bottleneck Quantizer。Emu3 的 tokenizer 类型，codebook 32768+。
- **MMDiT**：多模态 DiT。SD3 的骨干，使用联合注意力。
- **TTFAB**：time-to-first-audio-byte。从用户语音到第一段音频输出的时间。
- **Residual-VQ**：堆叠的 codebook。基础层是内容，后续层补充韵律。

## 问答
type: qa
from: phases/12-multimodal-ai/15-janus-pro-decoupled-encoders/docs/en.md, phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified/docs/en.md, phases/08-generative-ai/19-visual-autoregressive-var/docs/en.md, phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion/docs/en.md, phases/12-multimodal-ai/16-mio-any-to-any-streaming/docs/en.md

- **为什么单个视觉编码器不够？** VQ 码的语义弱。SigLIP 特征又难以重建图像。
- **为什么 Show-o 的 inpainting 是免费的？** 训练就是预测被掩码的 token。掩住一个区域再预测它即可。
- **为什么 VAR 快？** 一次 transformer 前向就能并行预测整个尺度。
- **Transfusion 的文本关注什么？** 之前的文本和之前的图像。图像能看到前面的文本。
- **Janus-Pro 为什么胜过 Janus？** 7B 对 1.3B 参数，第 2 阶段 72M 对 26M 条数据对。
- **MIO 怎么让各模态的 ID 不冲突？** 每种模态在同一个词表中拥有互不相交的 ID 区间。
