# Open-Weight VLM Recipes：真正重要的是什么

> 2024-2026 年的 open-weight VLM 文献是一片 ablation tables 的森林。Apple 的 MM1 测试了 13 种 image encoder、connector 和 data mix 的组合。Allen AI 的 Molmo 证明，详细的人类 captions 胜过 GPT-4V distillation。Cambrian-1 做了 20+ 项 encoder 对比。Idefics2 将五轴 design space 形式化。Prismatic VLMs 在受控 benchmark 上比较了 27 种 training recipes。在这些噪声之中，有一小组结果跨 papers 都成立：image encoder 比 connector architecture 更重要，data mixture 比二者都更重要，而详细的人类 captions 胜过 distilled synthetic data。本课替你读完这些表格。

**Type:** Learn + lab
**Languages:** Python (stdlib, ablation table parser + recipe picker)
**Prerequisites:** Phase 12 · 05 (LLaVA baseline)
**Time:** ~180 分钟

## 学习目标
- 说出五轴 VLM design space：image encoder、connector、LLM、data mix、resolution schedule。
- 阅读 MM1 / Idefics2 / Cambrian-1 ablation table，并预测哪个 knob 会改变给定 benchmark。
- 在给定 compute budget 和 task mix 的情况下，为新的 VLM 选择 recipe（encoder、connector、data、resolution）。
- 解释为什么在相同 token count 下，详细的人类 captions 胜过 GPT-4V distillation。

## 问题
已经有数百个 open-weight VLM。多数从“good”到“state-of-the-art”的差距并不来自 architecture，而是 data、resolution schedule 和 encoder choice。当你的 model 表现不佳时，知道先调哪个 knob，可以避免一次 500 万 GPU 小时的错误。

2023 年浪潮（LLaVA-1.5、InstructBLIP、MiniGPT-4）基于 caption-pair pretraining + LLaVA-Instruct-150k。不错的 baseline。上限约在 MMMU 35%。

2024 年浪潮（MM1、Idefics2、Molmo、Cambrian-1、Prismatic VLMs）做了详尽的 ablations。结果既意外又实用。

## 概念
### 五轴 design space

Idefics2（Laurençon et al., 2024）命名了这些 axes：

1. Image encoder。CLIP ViT-L/14、SigLIP SO400m/14、DINOv2 ViT-g/14、InternViT-6B。Encoders 在 patch size、resolution 和 pretraining objective 上不同。
2. Connector。MLP（2-4 layers）、Q-Former（32 queries + cross-attn）、Perceiver Resampler（64 queries）、C-Abstractor（convolutional + bilinear pooling）。
3. Language model。Llama-3 8B / 70B、Mistral 7B、Phi-3、Gemma-2、Qwen2.5。LLM size 是主要的 parameter cost。
4. Training data。Caption pairs（CC3M、LAION）、interleaved（OBELICS、MMC4）、instruction（LLaVA-Instruct、ShareGPT4V、PixMo、Cauldron）。
5. Resolution schedule。Fixed 224/336/448、AnyRes、native dynamic。在训练过程中 ramp 或保持 constant。

每个 production VLM 都会在每条 axis 上做选择。MMMU scores 的大部分 variance 由 axes 1、4 和 5 解释，而不是由你选择了哪个 connector 解释。

### Axis 1：encoder > connector

MM1 Section 3.2 显示：从 CLIP ViT-L/14 换成 SigLIP SO400m/14，MMMU 增加 3+ points。从 MLP 换成 Perceiver Resampler，增加不到 1 point。Idefics2 复现了这一点：SigLIP > CLIP，Q-Former ≈ MLP ≈ Perceiver，在相同 token count 下相近。

Cambrian-1 的 “Cambrian Vision Encoders Match-Up”（Tong et al., 2024）在 vision-centric benchmark（CV-Bench）上跑了 20+ 个 encoders。排行榜顶部是 DINOv2 和 SigLIP 的混合；CLIP 位于中游；ImageBind 和 ViT-MAE 更低。CLIP ViT-L 到 DINOv2 ViT-g/14 在 CV-Bench 上的差距约为 5-7 points。

2026 年 open VLMs 的默认 encoder 是用于 semantic + dense features 的 SigLIP 2 SO400m/14，有时会与 DINOv2 ViT-g/14 features 拼接（Cambrian 的 “Spatial Vision Aggregator” 就这样做）。

### Axis 2：connector design 差异不大

MM1、Idefics2、Prismatic 和 MM-Interleaved 都得出了相同结论：在固定 visual-token count 下，connector architecture 几乎不重要。对 mean-pooled patches 使用 2-layer MLP，在相同 token budget 下，表现距离 32-query Q-Former 不到 1 point。

真正重要的是 token count。更多 visual tokens = 更多 LLM compute = 更好表现，直到某个点后收益递减。每张图像 64 tokens 对 OCR 太少。576-1024 tokens 是多数 open VLMs 的 sweet spot。2048+ 只对 documents 和 charts 有帮助。

Q-Former vs MLP 是成本问题，不是质量问题：无论 image resolution 如何，Q-Former 都把 tokens 限制在 32-64；MLP 输出全部 patch tokens。对 high-res inputs，Q-Former 节省 LLM context；对 low-res，差异只是噪声。

### Axis 3：LLM size 决定上限

在每篇 VLM paper 中，把 LLM 从 7B 翻倍到 13B，通常都会让 MMMU 增加 2-4 points。到 70B 时，大多数 benchmarks 会饱和。VLM 的 Multimodal reasoning ceiling 就是 LLM 的 text reasoning ceiling —— visual encoder 只能喂信息，不能替它推理。

这就是为什么 Qwen2.5-VL-72B 和 Claude Opus 4.7 在 MMMU-Pro 和 ScreenSpot-Pro 上大幅领先：language brain 很大。一个 7B VLM 不能靠巧妙的 connector design 替代 70B VLM。

### Axis 4：data —— 详细的人类 captions 胜过 distillation

Molmo + PixMo（Deitke et al., 2024）是每个人都应该阅读的 2024 年结果。Allen AI 让人类标注员用 1-3 分钟的 dense speech-to-text passes 描述图像，得到 712K densely-captioned images。训练数据中完全没有 GPT-4V distillation。

Molmo-72B 在 11/11 个 benchmarks 上击败 Llama-3.2-90B-Vision。差异不在 architecture，而在 caption quality。详细的人类 captions 每张图像包含的信息量比短 web captions 多 5-10x，并且在 GPT-4V distillation 容易 hallucinate 的地方保持事实 grounded。

ShareGPT4V（Chen et al., 2023）和 Cauldron（Idefics2）采用了同样的 playbook，混合 human + GPT-4V captions。趋势很明确：对 2026 frontier 而言，caption density > caption quantity > distillation convenience。

### Axis 5：resolution 及其 schedule

Idefics2 的 ablations：384 -> 448 增加 1-2 points。448 -> 980 配合 image splitting（AnyRes）在 OCR benchmarks 上再增加 3-5。Flat resolution training 会在中等 accuracy 附近 plateau；resolution ramping（从 224 开始，以 448 或 native 结束）训练更快，最终更高。

Cambrian-1 做了 resolution vs tokens trade-off：在固定 compute 下，你可以选择低 resolution 下更多 tokens，或高 resolution 下更少 tokens。更高 resolution 对 OCR 胜出；lower-res-more-tokens 对 general scene understanding 胜出。

2026 年 production recipe：Stage 1 以 384 fixed 训练，Stage 2 对 OCR-heavy tasks 使用最高 1280 的 dynamic resolution。

### Prismatic 的受控对比

Prismatic VLMs（Karamcheti et al., 2024）是控制了所有 axes 的 paper。相同 13B LLM、相同 instruction data、相同 evaluation —— 每次只改变一条 axis。结果：

- Per-image visual-token count 解释约 60% variance。
- Encoder choice 解释约 20%。
- Connector architecture 解释约 5%。
- 其他所有因素（data mix、scheduler、LR）解释剩余约 15%。

这是一个粗略分解，但也是文献中对“我应该先 ablate 什么”最清晰的回答。

### 2026 年 picker

基于证据，2026 年新项目的默认 open-VLM recipe：

- Encoder：native resolution 下的 SigLIP 2 SO400m/14 with NaFlex；如果需要 segmentation/grounding，则拼接 DINOv2 ViT-g/14 以获得 dense features。
- Connector：patch tokens 上的 2-layer MLP。除非 token-constrained，否则跳过 Q-Former。
- LLM：Qwen2.5 / Llama-3.1 / Gemma 2；7B 用于成本，70B 用于质量，根据目标 latency 选择。
- Data：PixMo + ShareGPT4V + Cauldron，并用 task-specific instruction data 补足。
- Resolution：dynamic（长边 min 256、max 1280 pixels）。
- Schedule：Stage 1 alignment（仅 projector）、Stage 2 full fine-tune、Stage 3 task-specific fine-tune。

这些默认项中的每一项，都可以追溯到本课末尾引用 papers 中的实测 ablation。

```figure
l5-vlm-recipe-knobs
```

## 使用它
`code/main.py` 是一个 ablation table parser 和 recipe picker。它编码了 MM1 和 Idefics2 ablation tables（浓缩版），并允许你查询：

- “给定 budget X 和 task Y，哪个 recipe 胜出？”
- “如果我在 7B Llama 上把 SigLIP 换成 CLIP，预期 MMMU delta 是多少？”
- “为了得到 80% confidence answer，我应该先 ablate 哪条 axis？”

输出是一个 ranked recipe list，包含预期 benchmark deltas 和 “ablate first” recommendation。

## 交付它
本课生成 `outputs/skill-vlm-recipe-picker.md`。给定目标 task mix、compute budget 和 latency target，它会输出完整 recipe（encoder、connector、LLM、data mix、resolution schedule），并为每个选择引用对应的 ablation。它能阻止 engineers 在每次新 VLM 项目开始时重新发明 Idefics2 ablation table。

## 练习
1. 阅读 MM1 Section 3.2。对于固定的 2B LLM，在 50M images budget 下，哪个 encoder 胜出？如果换成 13B LLM，答案会反转吗？为什么？

2. Cambrian-1 发现，拼接 DINOv2 + SigLIP 在 vision-centric benchmarks 上胜过单独使用任一者，但在 MMMU 上没有新增信号。预测哪些 benchmarks 会提升，哪些会持平。

3. 你的目标是在 2B LLM 上构建 mobile UI agent。选择 encoder、connector、resolution 和 data mix。用具体的 ablation table 证明每个选择。

4. Molmo 发布了 4B 和 72B models。4B 与 closed 7B VLMs 有竞争力；72B 在 11/11 个 benchmarks 上击败 Llama-3.2-90B-Vision。这对 LLM-size plateau hypothesis 说明了什么？

5. 设计一个 ablation table，用于在 7B VLM 上隔离 data-mix quality 和 encoder quality。最少需要多少次 training runs？提出四个 axis settings。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Ablation | “调一个 knob” | 训练多次 runs，它们只在一个 design-space axis 上不同，其他全部保持 constant |
| Connector | “Bridge” / “projector” | 将 vision encoder output 映射到 LLM token space 的 trainable module（MLP、Q-Former、Perceiver） |
| Detailed human caption | “Dense caption” | 多句人类撰写的描述（通常 80-300 tokens），比 web alt text 更丰富 |
| Distillation | “GPT-4V captions” | 由更强的 proprietary VLM 生成的 training data；方便，但容易继承 hallucination |
| AnyRes / dynamic res | “High-res path” | 通过 tiling 或 M-RoPE 输入大于 encoder native resolution 的图像的 strategy |
| Resolution ramp | “Curriculum” | 从 low-resolution 开始并逐步提高的 training schedule，可加快 alignment learning |
| Vision-centric bench | “CV-Bench / BLINK” | 强调细粒度 visual perception，而非 language-heavy reasoning 的 evaluation |
| PixMo | “Molmo's data” | Allen AI 的 712K densely-captioned image dataset；人类语音被转写为 dense captions |

## 延伸阅读
- [McKinzie et al. — MM1 (arXiv:2403.09611)](https://arxiv.org/abs/2403.09611)
- [Laurençon et al. — Idefics2 / What matters building VLMs (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Deitke et al. — Molmo and PixMo (arXiv:2409.17146)](https://arxiv.org/abs/2409.17146)
- [Tong et al. — Cambrian-1 (arXiv:2406.16860)](https://arxiv.org/abs/2406.16860)
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865)
