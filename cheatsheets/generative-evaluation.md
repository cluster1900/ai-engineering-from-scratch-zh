---
id: generative-evaluation
title: Evaluating Generative Models
code: EG
subtitle: FID、CLIP score、CMMD、Elo、WER、MOS、SECS、EER 与 FAD。代码、样本量以及每个数字的失效方式。
hue: 45
sources: phases/08-generative-ai/14-evaluation-fid-clip-score, phases/06-speech-and-audio/17-audio-evaluation-metrics, phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified
source_hash: 90f888ea41e1551e
---

## FID 与 CLIP score
type: architecture
from: phases/08-generative-ai/14-evaluation-fid-clip-score/docs/en.md

```arch
node | real | 1,1 | Real images | held-out set | store
node | gen | 1,2 | Generated images | 10k or more | store
node | inc | 2,1 | Inception-v3 | 2048-D features | model
node | gauss | 3,1 | Gaussian fit | mean and covariance | process
node | fid | 4,1 | FID | lower is better | client
node | prompt | 1,3 | Prompt | | client
node | clip | 2,3 | CLIP encoders | image and text | model
node | cos | 3,3 | Cosine | per image | process
node | score | 4,3 | CLIP score | higher is better | client
edge | real | inc |
edge | gen | inc |
edge | inc | gauss | two pools
edge | gauss | fid | Fréchet distance
edge | gen | clip |
edge | prompt | clip |
edge | clip | cos |
edge | cos | score | mean over 30k
```

## 生产评估报告
type: flow
from: phases/08-generative-ai/14-evaluation-fid-clip-score/docs/en.md

1. **样本质量**：在 10-30k 个样本上对照留出真实集计算 FID。
2. **遵循度**：在同一批样本上对照其 prompt 计算 CLIP score 或 CMMD。
3. **偏好**：在盲评竞技场中对上一个模型的胜率。
4. **失败审计**：随机抽 50 个输出，标记手、文字和物体数量问题。
5. **随机种子**：至少运行 3 个种子。报告标准差。
6. **每个 PR**：在 500 个样本的子集上算 FID 和 CLIP score，约 30 分钟。
7. **每晚**：完整的 10k FID、HPSv2 和 Elo。

## 公式
type: concepts
from: phases/08-generative-ai/14-evaluation-fid-clip-score/docs/en.md, phases/06-speech-and-audio/17-audio-evaluation-metrics/docs/en.md, phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified/docs/en.md

- **FID**：$\lVert \mu_r - \mu_g \rVert^2 + \mathrm{Tr}(\Sigma_r + \Sigma_g - 2 (\Sigma_r \Sigma_g)^{0.5})$
- **CLIP score**：`CLIP_image(x_gen)` 与 `CLIP_text(prompt)` 的余弦。
- **Elo 期望**：$E_a = 1 / (1 + 10^{(r_b - r_a)/400})$
- **Elo 更新**：$r_a \leftarrow r_a + k (s_a - E_a)$。B 朝相反方向移动相同的量。
- **WER**：归一化后为 $(S + D + I) / N$。CER 按字符计算。
- **DER**：(FA + Miss + Confusion) / 说话人总时长。
- **EER**：FAR 等于 FRR 时的阈值。
- **Show-o mask 比例**：$\cos\left(\frac{\pi t}{2T}\right)$，第 0 步为 1.0，第 T 步为 0。

## 代码中的图像指标
type: annotated-code
lang: python
from: phases/08-generative-ai/14-evaluation-fid-clip-score/code/main.py

```python
mu_r = mean_vec(real_features)
mu_g = mean_vec(gen_features)
cov_r = covariance(real_features, mu_r)
mean_sq = sum((a - b) ** 2 for a, b in zip(mu_r, mu_g))
sqrt_prod = jacobi_sqrt(prod)                    # matrix square root
return mean_sq + trace(cov_r) + trace(cov_g) - 2 * trace(sqrt_prod)
score = clip_like(image, prompt)                 # cosine, higher is better
expected_a = 1 / (1 + 10 ** ((r_b - r_a) / 400))
actual_a = 1.0 if winner == "a" else 0.0
delta = k * (actual_a - expected_a)              # k=32
return r_a + delta, r_b - delta
```

## 代码中的音频指标
type: annotated-code
lang: python
from: phases/06-speech-and-audio/17-audio-evaluation-metrics/docs/en.md

```python
transform = Compose([ToLowerCase(), RemovePunctuation(), Strip()])
score = wer(truth="<ref>", hypothesis="<hyp>",
            truth_transform=transform, hypothesis_transform=transform)
sv = EncoderClassifier.from_hparams("speechbrain/spkrec-ecapa-voxceleb")
emb_ref = sv.encode_batch(load_wav("reference.wav"))
emb_clone = sv.encode_batch(load_wav("cloned.wav"))
secs = torch.nn.functional.cosine_similarity(emb_ref, emb_clone, dim=-1).item()
fad = FrechetAudioDistance()
score = fad.get_fad_score("generated_folder/", "reference_folder/")
```

## 指标函数
type: task-table
from: phases/08-generative-ai/14-evaluation-fid-clip-score/code/main.py, phases/06-speech-and-audio/17-audio-evaluation-metrics/code/main.py, phases/06-speech-and-audio/17-audio-evaluation-metrics/docs/en.md

| 任务 | 代码 |
|---|---|
| 图像 FID | `fid(real_features, gen_features)` |
| 由一对结果计算 Elo | `elo_update(r_a, r_b, winner, k=32)` |
| 词错误率 | `wer(ref, hyp)` |
| 字符错误率 | `cer(ref, hyp)` |
| 等错误率 | `eer_from_scores(same, diff)` |
| FAD 形式的距离 | `embedding_fad_like(real_embeds, fake_embeds)` |
| 多项选择准确率 | `mmau_accuracy(predictions, golds)` |
| TTS 往返 WER | `ttr_wer(tts_model, asr_model, texts)` |

## 图像指标对比
type: comparison
from: phases/08-generative-ai/14-evaluation-fid-clip-score/docs/en.md
span: 2

| 因素 | FID | CLIP score | CMMD | 人类偏好 |
|---|---|---|---|---|
| 衡量 | 样本质量 | prompt 遵循度 | 质量、细微差异 | 整体偏好 |
| 特征 | Inception-v3，2048-D | CLIP 图像与文本 | CLIP | 人或 LLM 评委 |
| 最少样本 | 10k，对照留出真实集 | 30k | 5k | 200 个盲评对 |
| 弱点 | N 小、领域远离 ImageNet | 组合能力弱、prompt 短 | 未涉及 | 评委方差、prompt 选择 |

## 统一模型的采样成本
type: comparison
from: phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified/docs/en.md

| 因素 | Chameleon、Emu3 | Transfusion | Show-o |
|---|---|---|---|
| 解码 | 自回归 token | 连续扩散 | 掩码离散扩散 |
| 步数 | 1024-4096 次前向 | ~20 | ~16 |
| 每一步 | 一个 token | 完整 transformer 前向 | 确定 top-K 个 token |

## 要超越的音频数字
type: concepts
from: phases/06-speech-and-audio/17-audio-evaluation-metrics/docs/en.md

- **WER**：朗读语音上低于 5% 即与人类持平。
- **UTMOS**：与人类 MOS 相关度 ~0.9。F5-TTS 为 3.95，真实录音为 4.08。
- **SECS**：高于 0.75 即为可辨认的克隆。
- **CLAP**：高于 0.3 即为合理的文本-音频对齐。
- **EER**：ECAPA 在 VoxCeleb1-O 上为 0.87%。
- **FAD**：MusicGen-small 在 MusicCaps 上为 4.5。越低越好。
- **MMAU-Pro**：4 个选项时随机水平为 25%。
- **插话打断**：目标低于 150 ms。

## 默认值
type: defaults
from: phases/08-generative-ai/14-evaluation-fid-clip-score/docs/en.md, phases/08-generative-ai/14-evaluation-fid-clip-score/code/main.py, phases/06-speech-and-audio/17-audio-evaluation-metrics/docs/en.md, phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| Elo `k` | 32 | `elo_update` |
| Elo 初始分 | 1000 | 两个模型都是 |
| FID 样本数 | 10k | 小 N 的 FID 不可靠 |
| CLIP score 样本数 | 30k | 平均为一个标量 |
| Inception 输入 | 299×299 | 分辨率要一致 |
| MOS 听众 | 20+ | 每个模型 100+ 个样本 |
| Show-o 步数 `T` | 8 | 余弦调度 |
| 保留比例下限 | 0.15 | 每步 `keep_ratio` |

## 故障排查
type: troubleshooting
from: phases/08-generative-ai/14-evaluation-fid-clip-score/docs/en.md, phases/06-speech-and-audio/17-audio-evaluation-metrics/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 用少量样本得到低 FID | 小 N 低估协方差 | 使用 10k 或更多的 N |
| FID 在人脸或艺术上没有意义 | Inception 在 ImageNet 上训练 | 用领域特征提取器，例如 FD-DINO |
| FID 随分辨率变化 | 299×299 缩放 | 在一致的分辨率下比较 |
| CLIP score 上升，图像却没变好 | "high quality, 4k, masterpiece" | 检查绑定与饱和 |
| Elo 没有意义 | 模型见过基准 prompt | 使用留出的 prompt 集 |
| 5% WER 掩盖了口音上的 30% | 聚合 WER | 按人群切片报告 |
| 克隆音频的 UTMOS 很差 | 在干净语音上训练 | 使用领域 MOS 听评小组 |
| FAD 无法比较 | 参考集不同 | 所有模型使用相同参考集 |

## 规则
type: tips
from: phases/08-generative-ai/14-evaluation-fid-clip-score/docs/en.md, phases/06-speech-and-audio/17-audio-evaluation-metrics/docs/en.md

- 计算 WER 前先归一化文本。报告归一化规则。
- 报告分布。延迟报告 P50/P95/P99，并按类别、按分类报告。
- 运行一个公开基准和一个内部留出集。
- 把真实特征一次性缓存为 `.npz` 文件。
- 用 `num_images_per_prompt=8` 批量生成评估样本。
- 使用三个结论一致的指标，再加一次定性审查。

## 问答
type: qa
from: phases/08-generative-ai/14-evaluation-fid-clip-score/docs/en.md, phases/06-speech-and-audio/17-audio-evaluation-metrics/docs/en.md, phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified/docs/en.md

- **为什么用 CMMD？** 它使用 CLIP 特征和 MMD。偏差更小，且没有高斯假设。
- **SECS 高、MOS 低？** 音色对了，但声音不自然。
- **EER 还是 minDCF？** minDCF 更贴近生产。它在某个工作点上为代价加权。
- **10k 个 SDXL 样本要多少成本？** 单张 L4、一次一个请求，约 11 小时。
- **为什么 Show-o 能免费做 inpainting？** 它的训练就是预测被掩码的 token。
