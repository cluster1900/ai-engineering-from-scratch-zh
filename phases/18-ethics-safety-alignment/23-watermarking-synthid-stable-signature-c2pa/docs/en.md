# Watermarking — SynthID、Stable Signature、C2PA

> 三项技术构成了 2026 年 AI 生成内容来源追踪的基础。SynthID (Google DeepMind) — image watermarking 于 2023 年 8 月推出，text+video 于 2024 年 5 月推出（Gemini + Veo），text 于 2024 年 10 月通过 Responsible GenAI Toolkit 开源，统一的 multi-media detector 于 2025 年 11 月随 Gemini 3 Pro 一同发布。Text watermarking 会以难以察觉的方式调整 next-token sampling probabilities；image/video watermarks 可以经受 compression、cropping、filters、frame-rate changes。Stable Signature (Fernandez et al., ICCV 2023, arXiv:2303.15435) — fine-tune latent diffusion decoder，使每个输出都包含固定消息；对 cropped（保留 10% 内容）的生成图像，在 FPR<1e-6 时检测率 >90%。后续研究 "Stable Signature is Unstable" (arXiv:2405.07145, 2024 年 5 月) — fine-tuning 可以在保持质量的同时移除 watermark。C2PA — cryptographically signed、tamper-evident metadata standard（C2PA 2.2 Explainer 2025）。Watermarking 与 C2PA 是互补的：metadata 可以被剥离但承载更丰富的来源信息；watermarks 可以在 transcoding 后保留，但承载的信息更少。

**Type:** Build
**Languages:** Python (stdlib, token-watermark embed + detect)
**Prerequisites:** Phase 10 · 04 (sampling), Phase 01 · 09 (information theory)
**Time:** ~75 分钟

## 学习目标

- 描述 token-level watermarking（SynthID-text 风格）以及它可被检测的机制。
- 描述 Stable Signature 以及 2024 年击破它的 removal attack。
- 说明 C2PA 的作用，以及为什么它与 watermarking 互补。
- 描述关键限制：model-specific signal、paraphrase 下的鲁棒性，以及 meaning-preserving attacks (arXiv:2508.20228)。

## 问题

2023-2024 年，deepfakes 和 AI 生成内容大规模进入政治与消费场景。Watermarking 是被提出的技术性来源信号：在创建时标记生成内容，之后再检测。2025 年的证据表明：没有任何 watermark 具备无条件鲁棒性，但与 C2PA metadata 分层结合时，这种组合可以提供可用的来源追踪方案。

## 概念

### Text watermarking（SynthID-text 风格）

Kirchenbauer et al. 2023 机制，由 Google 产品化：

1. 在每个 decoding step，对前 K 个 Token 做 hash，生成一个 pseudorandom partition，将 vocabulary 分成 "green" 和 "red" 集合。
2. 通过给 green logits 加上 δ，使 sampling 偏向 green 集合。
3. 生成结果包含的 green Token 数量会高于随机情况下的期望。

检测：对每个 prefix 重新 hash，统计生成结果中的 green Token，计算 z-score。Watermarked text 的 z-score >0，human text 约为 0。

特性：
- 读者难以察觉（δ 足够小，质量损失较轻）。
- 在可以访问 vocabulary partition function 时可检测。
- 对 paraphrase 不鲁棒 — 重写文本会破坏该信号。

SynthID-text 于 2024 年 10 月通过 Google 的 Responsible GenAI Toolkit 开源。

### Stable Signature（image）

Fernandez et al. ICCV 2023。Fine-tune latent diffusion decoder，使每张生成图像都包含一个写入 latent representation 的固定 binary message。检测通过 neural decoder 从 latent 中解码。对 cropped（保留 10% 内容）的图像，在 FPR<1e-6 时检测率 >90%。

2024 年 5 月 "Stable Signature is Unstable" (arXiv:2405.07145)：fine-tuning decoder 可以在保持图像质量的同时移除 watermark。对抗性的 post-generation fine-tuning 成本很低；该 watermark 的 adversarial robustness 有限。

### SynthID unified detector（2025 年 11 月）

随 Gemini 3 Pro 一同发布：一个 multi-media detector，可在同一个 API 中读取 text、image、audio、video 中的 SynthID signals。它统一了 Google 的来源追踪技术栈。

### C2PA

Coalition for Content Provenance and Authenticity。Cryptographically signed tamper-evident metadata standard。C2PA 2.2 Explainer (2025)。C2PA manifest 会记录 provenance claims（谁创建、何时创建、做过哪些 transformations），并由创建者的 key 签名。

与 watermarking 互补：
- Metadata 可以被剥离；watermarks（通常）不容易。
- Metadata 信息丰富（完整 provenance chain）；watermarks 承载 bit。
- C2PA 依赖平台采用；watermarks 会自动写入。

Google 在 Search、Ads 和 "About this image" 中同时集成两者。

### 限制

- **Model-specific.** SynthID 会对来自 SynthID-enabled models 的生成结果加 watermark。来自未启用 SynthID 的模型的生成结果没有 watermark，因此 "no SynthID signal" 并不能证明其真实性。
- **Paraphrase.** Text watermarks 无法经受 meaning-preserving paraphrase。
- **Transformation attacks.** arXiv:2508.20228 (2025) 展示了可以破坏 text watermarks 以及许多 image watermarks 的 meaning-preserving attacks。
- **Fine-tune removal.** 根据 "Stable Signature is Unstable"，post-generation fine-tuning 可以移除写入的 watermarks。

### EU AI Act Article 50

AI 生成内容标注的 Transparency Code（第一版草案 2025 年 12 月，第二版草案 2026 年 3 月，根据 [European Commission status page](https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content)，预计最终版 2026 年 6 月发布）。截至 2026 年 4 月，该 Code 仍为草案，时间线可能变化。监管层要求技术层提供这些措施。Deepfakes 必须标注。

### 它在 Phase 18 中的位置

Lessons 22-23 关注模型输出的内容（private data、provenance signal）。Lesson 27 覆盖 training-data governance。Lesson 24 是要求这些技术措施的监管框架。

```figure
an-watermark-greenlist
```

## 使用它

`code/main.py` 构建了一个玩具 text watermark。Tokens 是整数 0..N-1；watermarked sampling 会偏向 hash 定义的 green 集合。Detector 会计算 green-token z-score。你可以观察 1000-token generations 下的检测结果，看到 paraphrase 如何破坏该信号，并测量 human text 上的 false-positive rate。

## 交付它

本课会产出 `outputs/skill-provenance-audit.md`。给定一个带有 provenance claim 的内容部署，它会审计：watermark 机制（如有）、C2PA signing chain（如有）、各自的 adversarial robustness，以及每种 modality 的覆盖情况。

## 练习

1. 运行 `code/main.py`。报告 watermarked 1000-token generation 与 human-authored text 的 z-scores。识别 95% confidence threshold 下的 false-positive rate。

2. 实现一个 paraphrase attack，用 synonyms 替换 30% 的 Token。重新测量 z-score。

3. 阅读 Kirchenbauer et al. 2023 Section 6 中关于 robustness 的内容。为什么 text watermarks 会在 paraphrase 下失效，而 image watermarks 能经受 cropping？

4. 设计一个使用 SynthID-text + C2PA metadata 的部署。描述消费者看到的 provenance chain。识别每个组件的一个 failure mode。

5. 2024 年 "Stable Signature is Unstable" 结果表明，fine-tuning 可以移除 image watermark。设计一个限制此攻击的部署控制措施 — 例如，要求 fine-tuned checkpoints 的 signed releases。

## 关键术语

| Term | 人们怎么说 | 它实际含义 |
|------|------------|------------|
| SynthID | "Google's watermark" | Cross-modal provenance signal；text、image、audio、video |
| Token watermark | "Kirchenbauer-style" | Biased-sampling text watermark，可通过 green-token z-score 检测 |
| Stable Signature | "image watermark" | Fine-tuned-decoder watermark；ICCV 2023 |
| C2PA | "the metadata standard" | Cryptographically signed tamper-evident provenance metadata |
| Paraphrase robustness | "does rewording break it" | Text watermark 属性；目前有限 |
| Fine-tune removal | "adversarial unwatermark" | 通过 decoder fine-tuning 移除 image watermark 的攻击 |
| Cross-modal detector | "unified SynthID" | 2025 年 11 月跨 modalities 的 unified API |

## 延伸阅读

- [Kirchenbauer et al. — A Watermark for Large Language Models (ICML 2023, arXiv:2301.10226)](https://arxiv.org/abs/2301.10226) — token-watermark 机制
- [Fernandez et al. — Stable Signature (ICCV 2023, arXiv:2303.15435)](https://arxiv.org/abs/2303.15435) — image watermark 论文
- ["Stable Signature is Unstable" (arXiv:2405.07145)](https://arxiv.org/abs/2405.07145) — removal attack
- [Google DeepMind — SynthID](https://deepmind.google/models/synthid/) — cross-modal watermark
- [C2PA 2.2 Explainer (2025)](https://c2pa.org/specifications/specifications/2.2/explainer/Explainer.html) — metadata standard
