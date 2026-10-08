# Chameleon với các mô hình đa mô hình chỉ có token early-fusion

> Cho đến nay, mỗi VLM mà chúng ta đã thấy đã phân tách hình ảnh và văn bản từ một bộ xử lý khác nhau. Các mã hình ảnh được chuyển đổi từ mã hóa hình ảnh, chảy vào máy chiếu, sau đó trong LLM  bên trong với văn bản gặp gỡ.

**类型：**Xây dựng
**语言：**Python(stdlib, tokenizer VQ-VAE + decoder được nhét giữa nhau)
**先修：**Giai đoạn 12 · 05, Giai đoạn 8 (AI phát triển)
**时间：**约180分钟

## Học mục tiêu

- 解释 tại sao vốn từ vựng chung + mất mát đơn lẻ 会改变模型能力。
- Mô tả VQ-VAE  làm thế nào để đặt hình ảnh Tokenize thành với Transformer mục tiêu token tiếp theo 兼容的离散序列──
- Nói về bài tập của Chameleon: QK-Norm, Drop-out placement, LayerNorm ordering,
- So sánh phương pháp Q-Former của Chameleon với BLIP-2,并 mô tả tình huống thích hợp của riêng mình.

## 问题

基于适配器的VLM(LLaVA、BLIP-2、Qwen-VL) 把文本和图像当作两种不同的东西──文本代码 经过`embed(text_token)`; hình ảnh qua `visual_encoder(image) → projector → ... pseudo_tokens` mô hình có hai đường nhập và giữa đường cùng nhau.

3 hậu quả:

1. LLM chỉ có thể tiêu thụ hình ảnh, không thể xuất ra hình ảnh.
2. 混合模态文档 (例如文章中段落和图像交换出现) 很别扭: bạn muốn么在模型外部解析 多模态输入,要么串联多次生成──
3. 分布不匹配──视觉 Token 和文本 Token  nằm ở các khu vực khác nhau của không gian ẩn, sẽ gây ra các vấn đề về sự phù hợp nhỏ.

Chameleon  từ chối giả định này: hình ảnh chỉ từ chia sẻ từ biểu tượng chia rẽ Token 序列。 dùng giao lưu tài liệu đào tạo mô hình, một mất mát、 một decoder tự động,就能直接获得混合模态生成能力。

## 概念

### VQ-VAE 作为图像Tokenizer

Đây là một mã hóa tự động biến thể được định lượng theo vector.

- Mã mã:CNN + ViT, sẽ hiển thị hình ảnh cho bản đồ tính năng không gian, ví dụ 32x32 个 dim 为 256 个特征.
- Codebook: một học được của K 个 Vector 的词表(Chameleon 使用 8192), cũng như dim 为 256。
- Quantization: đối với mỗi tính năng không gian, qua khoảng cách L2 查找 gần nhất codebook entry。 dùng chỉ số toàn bộ 替换连续特征。
- Bộ giải mã:CNN, sẽ định lượng các tính năng 转回像素──

训练:VAE tái tạo mất + cam kết mất + codebook mất──Codebook chỉ số 构成图像的离散字母──

Đối với Chameleon 来说: 一张图像变成32*32 = 1024 个标志, 来自大小为8192 的词表──与文本 标志( 来自 LLM 的 BPE 词表,例如 32000)拼接──最终词表:40192──Transformer 看到的是一个序列、一个损失──

### 共享词表

Chameleon's từ表组合文本 Token、图像 Token 和模态分隔符── mỗi token đều có một ID riêng lẻ──输入 嵌层把每个 ID 映射到 D-dim 隐藏向──输出投影把隐藏 映射回语音 logits──Softmax 下选择一个 token,不管它属于什么模态──

分隔符 rất quan trọng:`<image>`和 `</image>`标签包住图像 序列 代号. 生成时,如果模型输出 `<image>`, Download software đã biết 1024 token tiếp theo sẽ được gửi cho decoder để thực hiện các chỉ số VQ của hình ảnh 染.

### 混合模态生成

Inference 是在共享词表上的下一个代号预测――例提示:"Draw a cat and describe it". Chameleon 输出:

```
<image> 4821 1029 2891 ... (1024 image tokens) </image>
The cat is orange, sitting on a windowsill...
```

模型自主选择序列:它可能先生成图像再生成文本,先生成文本再生成图像,或交错生成──相同的解码器,相同的损失──

Trong khi đó, việc tạo ra VLM của bộ điều chỉnh chỉ giới hạn trong văn bản.

### 训练稳定性:QK-Norm, bỏ qua, LayerNorm đặt hàng

Việc tập hợp sớm 训练 quy mô lớn không ổn định.

- QK-Norm──在 Attention 内部,对 query 和 key projection 先应用 LayerNorm,再做点产品──防止深层网络中的逻辑大小爆炸──多个2024年后的大模型都使用它──
- Đặt bỏ rơi                                                                                                                                                                                                                                                             
- LayerNorm đặt hàng. Rặng dư lên sử dụng Pre-LN( quy tắc), tái tạo trong cuối cùng một khối của skip kết nối.

Không có những kỹ thuật này,34B-param Chameleon được đào tạo tại nhiều điểm kiểm soát  phát tán.

### Tokenizer của xây dựng lại lên giới hạn

VQ-VAE là có tổn thất. Trong 8192 mục trong codebook ∞ mỗi张 512x512 图像 1024 个 token, tái tạo PSNR lên giới hạn khoảng 26-28 dB.

Tokenizer là một chai ── Tokenizer tốt hơn 🏻 MAGVIT-v2、IBQ、SBER-MoVQGAN) sẽ nâng lên giới hạn.

### Chameleon vs BLIP-2 / LLaVA

Chameleon ((phù hợp sớm,共享词表):
- Một mất mát, một decoder.
- 生成混合模态输出:
- Tokenizer là chất lượng trên giới hạn.
- 成本高: đường dẫn dẫn 上 每张生成图像都需要VQ-VAE decoder──

BLIP-2 / LLaVA ((trễ kết hợp,分离塔):
- 视觉输入, chỉ có thể输出 văn bản.
- 复用 được đào tạo trước LLM。
- Tôi hiểu nhiệm vụ không có Tokenizer 瓶──
- 便宜: đơn次 đi trước điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền điền

Nếu bạn cần hình ảnh, chọn gia đình Chameleon. Nếu bạn chỉ cần hiểu, adapter-VLM hơn đơn giản, và sử dụng nhiều tính toán được đào tạo trước.

### Fuyu và AnyGPT

Fuyu(Adept,2023) là một phương pháp liên quan: hoàn toàn nhảy qua mã hóa tầm nhìn độc lập, đưa các bản vá hình ảnh nguyên thủy như Token như được gửi vào dự đoán đầu vào của LLM, không sử dụng Tokenizer。比 Chameleon 更简单, nhưng đã mất khả năng chia sẻ từ ngữ 输出生成──

AnyGPT(Zhan et al., 2024) đưa Chameleon  mở rộng thành bốn kiểu: văn本、图像、语音、音乐──每种模态都使用相同的VQ-VAE 技巧,共享变革器──Any-to-any generation──Lesson 12.16 中会进一步介绍──


```figure
vq-codebook
```

## Sử dụng nó

`code/main.py`Construct một mô hình kết hợp sớm đồ chơi đầu đến cuối:

- Một máy định lượng kiểu VQ-VAE rất nhỏ, đưa 8x8 bản vá 映射 vào chỉ số codebook ((K=16)。
- Một共享词表,由(text ids 0..31) +(image ids 32..47) +(separators 48, 49)组成。
- Một trò chơi tự động giải mã giảm tốc (Bigram table), trong các chuỗi tạo caption + hình ảnh-token 上训练。
- Một vòng lấy mẫu, cho định hướng 后输出交换的文本 + 图像 Token。

代码有意让变压器极小(bigrams), để bạn có thể theo dõi dòng tín hiệu từ đầu đến cuối.

## 交付 nó

本课产 出 `outputs/skill-tokenizer-vs-adapter-picker.md` Được định hình sản phẩm đặc điểm (仅理解 vs 理解 + 生成、 需图像质量、成本预算), nó sẽ được lựa chọn giữa Chameleon-family (early fusion) và LLaVA-family (late fusion) và sử dụng quy mô kinh nghiệm (定量经验法则说明理由──).

## 练习

1. Chameleon sử dụng K=8192 个 codebook entry, mỗi张 512x512 图像 1024 个代币――估算对24bit RGB 图像的压缩比――¿It is有损吗?有损吗?

2. Một张 4K 图像(3840x2160) trong cùng mật độ VQ-VAE 下会 tạo ra bao nhiêu hình ảnh Token?Chameleon kiểu 模型 có thể trong một cuộc gọi suy luận trung gian tạo ra một张 4K 图像?

3. Sử dụng Python  thực hiện QK-Norm ⋅ cho định một truy vấn 64 chiều và khóa, hiển thị LayerNorm trước sau của sản phẩm chấm ⋅ Tại sao điều khiển quy mô trong mạng sâu ⋅ quan trọng?

4. 阅读Chameleon Phần 2.3 trong Nội dung về tập luyện ổn định.

5. 扩展玩具解码器,使其在给定纯文本提示时输出混合模态响应――在训练数据分布为60%文本-第一 / 40%图像-第一的情况下,测量模型选择图像-第一与文本-第一的频率――

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Early fusion | "Unified tokens" | 图像从第一步起就被转换为离散 Token，并共享 Transformer 的词表 |
| VQ-VAE | "Image tokenizer" | CNN + ViT + codebook，将图像映射为 Transformer 可预测的整数 indices |
| Shared vocabulary | "One dictionary" | 覆盖文本 + 图像 + 模态分隔符的单一 Token ID 空间 |
| QK-Norm | "Attention stabilizer" | 在 query 和 key 做 dot product 之前对它们应用 LayerNorm，防止 norm blowup |
| Mixed-modality generation | "Text + image output" | 一次 pass 中自主生成交错文本和图像 Token 的 inference |
| Codebook size | "K entries" | VQ-VAE 可 quantize 到的离散 Vector 数量；在压缩率和 fidelity 之间权衡 |
| Tokenizer ceiling | "Reconstruction limit" | 解码 VQ Token 能达到的最佳 PSNR；限制模型的图像质量 |

## 延伸阅读

- [Chameleon Team — Chameleon: Mixed-Modal Early-Fusion Foundation Models (arXiv:2405.09818)](https://arxiv.org/abs/2405.09818)
- [Aghajanyan et al. — CM3 (arXiv:2201.07520)](https://arxiv.org/abs/2201.07520)
- [Yu et al. — CM3Leon (arXiv:2309.02591)](https://arxiv.org/abs/2309.02591)
- [Zhan et al. — AnyGPT (arXiv:2402.12226)](https://arxiv.org/abs/2402.12226)
- [Adept — Fuyu-8B blog (adept.ai)](https://www.adept.ai/blog/fuyu-8b)
