# Flamingo và VLM được sử dụng trong vài lần bắn

> DeepMind của Flamingo(2022) đã hoàn thành hai điều sớm hơn mọi người khác. Nó chứng minh một mô hình đơn lẻ có thể xử lý hình ảnh, video và văn bản theo thứ tự của bất kỳ giao lưu nào. Nó cũng chứng minh rằng VLM có thể được thực hiện trong bối cảnh học tập.   cung cấp bao gồm ba hình ảnh, tiêu đề) ví dụ về một vài cú chấn động, mô hình sẽ có thể trong trường hợp không có bất kỳ bước cấp độ nào để tạo ra hình ảnh mới.

**Type:** Learn
**Languages:** Python (stdlib, gated cross-attention + Perceiver resampler demo)
**Prerequisites:** Phase 12 · 03 (BLIP-2 Q-Former)
**Time:** ~120 minutes

## Học mục tiêu
- 解释 如何通过 tanh(gate) = 0 在初始化时保留结 LLM 的文本能力──
- 逐步讲解 Perceiver resampler:N 个 hình ảnh patches → K 个 cố địnhlatentqueries,经跨重点关注 完成──
-  mô tả Flamingo  làm thế nào để tôn trọng hình ảnh vị trí  xử lý giao lưu hình ảnh- văn bản chuỗi。
- 复现 vài cú chụp Multimodal prompt 结构(3 个 hình ảnh-caption示例,然后是一个查询图像) 』

## 问题
BLIP-2 sẽ đưa 32 mã thông báo trực quan vào lớp đầu vào của LLM. Mỗi prompt một hình ảnh khi có thể làm việc. Nhưng nếu bạn muốn nhập *多张* với hình ảnh giao lưu văn bản, ví dụ: đây là hình ảnh A, để tạo tiêu đề cho nó; đây là hình ảnh B, để tạo tiêu đề cho nó; bây giờ đây là hình ảnh C, để tạo tiêu đề cho nó.

Phản ứng của Flamingo là: hoàn toàn không thay đổi dòng nhập của LLM. Trong các khối LLM hiện có, các lớp liên quan khác nhau được đưa vào các lớp. Các mã thông báo văn bản vẫn như thường xuyên được truyền thông.

Flamingo  trả lời câu hỏi thứ hai là: làm thế nào để xử lý mỗi prompt trong số lượng hình ảnh có thể biến đổi ((0、1 hoặc多张)?

## 概念
### LLM đóng băng

Flamingo Từ结的Chinchilla 70B LLM 开始──全部70B cân 保持不变──现有文本 自注意 和 FFN 正常运行──

### Tâm đơn nhận thức

Đối với các hình ảnh trong lập tức, ViT sẽ tạo ra N 个 patch token.

1. Sự chú ý qua nhau: K 个 latents attend đến N 个 patch tokens ((Q từ latents, K / V từ patches) ⋅
2. Lạtên 内部的自我注意 + FFN。

Sau khi trải qua 6 khối mẫu lại,输出 là K=64 个 dim 1024 của các mã thông báo trực quan, bất kể ViT sinh thành bao nhiêu bản váy. 224x224 图像(196 bản váy) và 480x480 图像(900 bản váy) đều sẽ xuất ra cho 64 个 mẫu lại mã thông báo.

Đối với video, mẫu sẽ theo thời gian ứng dụng: mỗi lần các bản vá được tạo thành 64 个 ẩn, trong khi mã hóa vị trí thời gian 让模型区分 t=0 和 t=N。 video hoàn chỉnh được biến thành T * 64 个视觉代币。

### Sự chú ý qua nhau

Trong mỗi m 层 giữa M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M M

```
x_after_llm_block = llm_block(x_before)
cross = cross_attn(x_after, resampler_output)
gated = tanh(alpha) * cross + x_after
x_before_next_block = gated
```

- `alpha`là một tính toán học tập có thể bắt đầu từ 0
- `tanh(0) = 0`, Vì vậy, khi bắt đầu, chi nhánh đóng cửa đóng góp là 0.
- 随着 `alpha`远离零,trước sự chú ý 贡献会平滑增长。
- Kết nối còn lại có nghĩa là ngay cả khi cổng  hoàn toàn mở, cũng sẽ không bao gồm văn bản của LLM; nó chỉ đơn giản là thêm thông tin trực quan vào nó.

Đây là lựa chọn thiết kế quan trọng nhất trong Flamingo: điều kiện trực quan là phụ gia, được mở cửa, và trong quá trình khởi nghiệp là 0.

### Sử dụng sự chú ý ngã mặt của các đầu vào được giao tiếp

Trong một lời nhắc giống như "<image A> caption A <image B> caption B <image C> ?" , mỗi mã văn bản chỉ nên nhìn thấy các hình ảnh nằm trong các chuỗi trước đó.`t`Các mã thông báo văn bản chỉ cần tham gia vào chỉ mục hình ảnh `i < i_t`của hình ảnh resampler token, trong đó `i_t``t`之前最近的图像──只看最近的前置图像或看到所有的前置图像都是有效选择; Flamingo 选择前者──

### Học tập trong bối cảnh ít ảnh

Flamingo prompt trông giống như:

```
<image1> A photo of a cat. <image2> A photo of a dog. <image3> A photo of a
```

模型看补全模式并输出 "bird" (或图3 显示任何内容) ⋅ không có bước tiến Gradient ⋅ 结 LLM's in-context learning 能力通过门禁横断注意保留下来  Đây là dòng chữ của bài luận, cũng là lý do quan trọng.

### Dữ liệu đào tạo

Flamingo sử dụng ba tập huấn:

1. MultiModal MassiveWeb (M3W):4300.000 chứa các trang web của các hình ảnh và văn bản, tái tạo.
2. Các cặp hình ảnh-môn văn (ALIGN + LTIP):44 tỷ đối tượng
3. Video-Text Pairs (VTP): 27 triệu clip video ngắn

OBELICS(2023) là một phần của các mô hình giống Flamingo được đào tạo trên nó.

### OpenFlamingo và Otter

OpenFlamingo(2023) là mở rộng复现──Architecture 相同(Perceiver resampler + 结 LLaMA hoặc MPT 上的门横关注)──Checkpoints 为 3B、4B、9B──由于基础LLM 更小且数据更少,质量落后于 Flamingo──

Otter(2023) dựa trên OpenFlamingo, và MIMIC-IT((((một hướng dẫn đa phương thức 数据集) trên để thực hiện điều chỉnh hướng dẫn, cho thấy sự chú ý chéo bị khóa cũng áp dụng cho hướng dẫn sau đây。

### Những hậu duệ

- Idefics / Idefics2 / Idefics3: Hugging Face's gated cross-attention lineage,逐步简化(Idefics2  từ bỏ resampler,改为使用带适应性聚合的直接补丁代币) ⋅
- Chuyển đổi Flamingo-to-Chameleon: đến năm 2024, nhiều đội chuyển sang sự hợp nhất sớm (Dân 12.11); trong môi trường sản xuất của xương sống, sự quan tâm chéo phong cách Flamingo vẫn còn tồn tại.
- Sự nhập vào liên kết của Gemini: khái niệm đã thừa hưởng tính linh hoạt định dạng liên kết của Flamingo, mặc dù cơ chế chính là độc quyền.

### So sánh với BLIP-2

| | BLIP-2 | Flamingo |
|---|---|---|
| Visual bridge | 输入处一次性使用 Q-Former | 每 M 层使用 gated cross-attention |
| Visual tokens | 每张图像 32 个 | 每张图像每个 cross-attn layer 64 个 |
| Frozen LLM | Yes | Yes |
| Few-shot in-context | 弱 | 强 — 论文的核心 |
| Interleaved inputs | 无原生支持 | Yes，设计目标 |
| Training data | 130M pairs | 1.3B pairs + 43M interleaved pages |
| Parameter count | 188M trained | ~10B trained (cross-attn layers) |
| Compute | 8 个 A100 上数天 | 数千个 TPUv4 上数周 |

预算 giới hạn đơn sơ VQA  chọn BLIP-2── cần交错输入、少数投射或多图推理时选择 Flamingo/Idefics2──


```figure
cross-attention-fusion
```

## Sử dụng nó
`code/main.py`演示:

1. Trong 36 mã bản vá giả trên máy nhận dạng, sử dụng 8 mã khóa có thể học được (đơn thuần Python)
2. Một bước quan tâm ngã ngã, trong đó `alpha = 0`→ 输出等于输入(LLM 不变), rồi `alpha = 2.0`→ 混入视觉贡献──
3. Một nhà xây dựng mặt nạ nhộn nhịp,为 "(hình 1) (mục 1) (mục 2) (mục 2)"序列生成 2D attention mask──

## 交付 nó
本课产 出 `outputs/skill-gated-bridge-diagnostic.md`△ Đặt một cấu hình mở của VLM (với mẫu Y/N、tần số xuyên-attn、cổng), nó sẽ nhận ra các yếu tố dòng dõi Flamingo và giải thích chiến lược đóng băng.

## 练习
1. 计算 Flamingo-9B số lượng tham số thị giác: 9B LLM + 1.4B lớp chú ý chéo được khóa + 64M mẫu lại.

2. Trong PyTorch thực hiện các phần còn lại bị khóa `y = tanh(alpha) * cross + x`❖ Thông qua thí nghiệm`alpha=0`时, khởi đầu `y==x`精确成立──

3. 阅读 OpenFlamingo Phần 3.2 ((arXiv:2308.01390), hiểu khi số lượng hình ảnh của mỗi yêu cầu khác nhau, họ xử lý như thế nào trong loạt số hình ảnh多张图像―― mô tả chiến lược đệm。

4. Tại sao mặt nạ chú ý chéo của Flamingo  để mã thông báo văn bản tham dự đến * gần nhất * hình ảnh đặt trước, thay vì tất cả hình ảnh đặt trước?

5. Trong bối cảnh vài lần chụp: Để tạo ra một biến thể Flamingo mới  cấu tạo một chứa 4 hình ảnh → màu sắc của đối tượng chính  mô tả của các mẫu  mô tả khi số lượng mẫu từ 0 đến 8  thay đổi, dự đoán chính xác mô hình 如何变化──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Perceiver resampler | "Fixed-latent cross-attention" | 从可变数量的 input patches 中生成 K 个固定 tokens 的 module |
| Gated cross-attention | "Tanh-gated bridge" | residual layer `y = tanh(alpha)*cross + x`，learnable alpha，初始化为 0 |
| Interleaved input | "Mixed sequence" | 图像和文本按阅读顺序自由混合的 prompt format |
| Frozen LLM | "No LLM gradients" | 文本 LLM 的 weights 不更新；只训练 resampler + cross-attn layers |
| Few-shot | "In-context examples" | 在 prompt 中给出少量（image, answer）对；模型无需 finetuning 即可泛化 |
| OBELICS | "Interleaved web corpus" | 包含 141M 个网页的开放数据集，图像和文本按阅读顺序排列 |
| Chinchilla | "70B frozen base" | Flamingo 的冻结文本 LLM，来自 DeepMind 的 Chinchilla paper |
| Gate schedule | "How alpha moves" | 训练期间 cross-attention gate 打开的速率 |
| Cross-attn frequency | "Every M layers" | 插入 gated cross-attention block 的频率；Flamingo 使用 M=4 |
| OpenFlamingo | "Open reproduction" | MosaicML/LAION 的 3-9B 开放 checkpoint；architecture 与 Flamingo 相同 |

## 延伸阅读
- [Alayrac et al. — Flamingo (arXiv:2204.14198)](https://arxiv.org/abs/2204.14198) 原始论文──
- [Awadalla et al. — OpenFlamingo (arXiv:2308.01390)](https://arxiv.org/abs/2308.01390) 开放复现──
- [Laurençon et al. — OBELICS (arXiv:2306.16527)](https://arxiv.org/abs/2306.16527) 交错网页语料──
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795) 通用 Thiết kế nhận thức
- [Li et al. — Otter (arXiv:2305.03726)](https://arxiv.org/abs/2305.03726) 经过指示调的 Flamingo 后续模型──
- [Laurençon et al. — Idefics2 (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246) Phương pháp tiếp cận Flamingo của hiện đại đơn giản hóa.
