# Show-o 和 Khác phân phân 统一模型

> Transfusion 混合连续和离散表示──Show-o(Xie et al., 2024 年 8 月)走的是另一条路:text tokens 使用因果下代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代

**Type:** Learn
**Languages:** Python (stdlib, masked-discrete-diffusion sampler)
**Prerequisites:** Phase 12 · 13 (Transfusion)
**Time:** ~120 minutes

## Học mục tiêu
- 解释 ải luân phân biệt nén:一种先均 mask Tokens、再让 Transformer 恢复它们的时间表──
- Từ tốc độ và chất lượng trên so sánh并行 hình ảnh giải mã (Show-o, MaskGIT) với tự động giải mã hình ảnh (Chameleon, Emu3):
- Nói ra Show-o ở một điểm kiểm soát Trung xử lý ba loại nhiệm vụ: T2I、VQA、phức ảnh inpainting。
- 选择一种掩盖 lịch trình ((coine、linear、truncated),并推理它对样品质量的影响──

## 问题
Trải nghiệm hai lỗ của truyền máu có hiệu quả, nhưng động lực là khó khăn hơn: Loss Diffusion liên tục với NTP Loss phân biệt nằm trên các thước đo số khác nhau.

Câu trả lời của show-o là: giữ hai loại hình thức đều tách rời như Chameleon, nhưng thông qua sự phân tán phân biệt được che giấu và tạo ra hình ảnh, thay vì tạo ra thứ tự. Mục tiêu đào tạo trở thành một dự đoán biểu tượng được che giấu đơn lẻ, nó tự nhiên phổ biến dự đoán biểu tượng tiếp theo.

## 概念
### Phân phối phân biệt được che giấu (MaskGIT)

技巧很优雅──从一个完全蒙面的图像开始每个代币都是特殊的`<MASK>`id) ・ trong mỗi bước,并行预测 tất cả các token được che giấu, sau đó giữ được top-K 个置信度最高的预测,并重新掩盖 其余部分──大约8-16次代后, tất cả các token đều được lấp đầy hoàn thành── từng bước mở mặt nhiều ít token lịch trình 需要调优,cosine lịch trình 效果很好──

训练 rất đơn giản: từ [0, 1] trung bình采样一个掩盖比例,将其应用到图像的VQ代币上,训练变压器恢复被掩盖的部分──这是BERT对文字做的事情,只是扩展到图像生成──

### Show-o: một Transformer, mặt nạ lai

Show-o sẽ MaskGIT 放进 nguyên nhân ngôn ngữ mô hình Transformer──

- Các mã thông báo văn bản: nguyên nhân (standard LLM)
- Địa chỉ hình ảnh: 在图像区内完全双向的(这样的掩面的代币 在预测时可以看到所有其他图像代币) 』
- Text-to-image: text attend đến trước các hình ảnh,image attend đến trước các văn bản.

训练在以下任务之间交换:
1. tiêu chuẩn NTP trên các chuỗi văn bản:
2. T2I 样本:text → image, sử dụng mã thông báo hình ảnh ẩn 和 mã thông báo ẩn Loss。
3. VQA 样本:image → text, sử dụng mã thông báo văn bản ẩn mặt

统一 Loss là `<MASK>`Các token trên của cross-entropy, nó cũng bao gồm văn bản NTP( chỉ có một token cuối cùng được masked) và hình ảnh được che giấu-chếch tán ((随机子集被 masked) 

### Tiêu chuẩn lấy mẫu song song

Show-o sử dụng khoảng 16 bước tạo một hình ảnh, thay vì khoảng 1000 bước (tất cả các token đều tự rút lại) hoặc khoảng 20 bước (tải) trong mỗi bước,并行预测 tất cả các token được che giấu; gửi Top-K 高置信度 Tokens;重复──

Đối với:
- Chameleon / Emu3(对 Tokens autoregressive):N_tokens 次 前行, thường mỗi张图 1024-4096 次。
- Chuyển máu: 20 bước, mỗi bước một lần hoàn chỉnh Transformer đi qua.
- Show-o(đánh phân tích phân biệt nén được che giấu): khoảng 16 步, mỗi bước một lần hoàn chỉnh Transformer đi qua.

Trong mô hình quy mô gần, Show-o hơn Chameleon hơn nhanh; nó lớn致匹配 Transfusion số bước, đồng thời mỗi bước chi phí thấp hơn (được tính theo các logic từ ngữ riêng biệt so với MSE Loss liên tục)

### Các nhiệm vụ tại một điểm kiểm soát

Show-o 在推理时支持四类任务,由快速格式 选择:

- Tạo văn bản: tiêu chuẩn xuất bản văn bản tự động.
- VQA:photos in, text out.
- T2I:text in, thông qua phân tán phân biệt được che giấu 输出 hình ảnh
- Đơn:输入带有部分 罩 Tokens 的图像,并填充──

inpainting 能力来自蒙面预测 训练,几乎是免费的──蒙面 VQ-token grid 的一个区域,输入其余部分加一个文字提示,预测蒙面代币──

### Thời gian đeo mặt nạ

Mỗi bước mở mặt nạ 多少 Tokens 的日程 会塑造质量──Show-o 推 cosine:

```
mask_ratio(t) = cos(pi * t / (2 * T))   # t = 0..T
```

第 0 步, tất cả các token đều được che giấu( tỷ lệ 1.0)。第 T 步, không có token được che giấu。Cosine sẽ tập trung trọng lượng vào tỷ lệ giữa các区间, nơi dự đoán có lượng thông tin nhất。

### Show-o2

Show-o2(2025 theo dõi, arXiv 2506.15564) mở rộng Show-o: lớn hơn LLM cơ sở, tốt hơn Tokenizer, cải tiến lịch trình mặt nạ, cấu trúc mô hình giống nhau.

### Ở chỗ Show-o ngồi

Trong phân loại năm 2026:

- Các token riêng biệt + NTP:Chameleon、Emu3──简单但推理慢──
- Các token riêng biệt + phân tán ẩn:Show-o、MaskGIT、LlamaGen、Muse。并行采样, nhưng vẫn bị Tokenizer mất 限制。
- Continuous + Diffusion:Transfusion、MMDiT、DiT──质量最高,训练更复杂──
- Liên kết liên tục + dòng chảy trong VLM:JanusFlow、InternVL-U──最新路线──

按任务选择:当你想在一个开放模型中同时获得T2I + inpainting + VQA,并且速度合理时,选择 Show-o;当质量最重要且你能承担两损管道时,选择转──


```figure
masked-diffusion-unmask
```

## Sử dụng nó
`code/main.py`模拟 Tiêu mẫu:

- Một lưới đồ chơi chứa 16 mã VQ.
- Một giả mạo Transformer, nó dựa trên prompt 和当前 Unmasked Tokens 预测 logits。
- Sử dụng lịch trình cosine làm 8 bước并行 n soi mẫu.
- 打印中间状态 (tự phát triển mô hình mặt nạ) và cuối cùng Tokens。

运行它,观察面具 如何一步一步消解──

## 交付 nó
本课产 出 `outputs/skill-unified-gen-model-picker.md`△给定一个既需要理解(VQA, captioning) 又需要生成(T2I, inpainting) của sản phẩm,并且有开权重 约束,它会在 Show-o gia đình、Transfusion/MMDiT gia đình 和 Emu3 / Chameleon gia đình 之间做选择,并给出具体 trade-offs──

## 练习
1. Phân phối phân biệt nén được che giấu trong khoảng 16 bước hoàn thành mô hình. Tại sao không phải 1 bước? Nếu bạn che giấu tất cả nội dung trong bước 0, sẽ có vấn đề gì?

2. Sử dụng truyền tải mặt nạ 时, in painting 几乎是免费的──提出一个产品用例(真实或假设), trong đó Show-o của in painting 胜过专业模型──

3. Chương trình Cosine vs lịch trình tuyến tính: theo dõi T=8 时 mỗi bước số lượng của các token không che giấu.

4. Một张 512x512 của hình ảnh hiển thị là 1024 Tokens。 trong từ K=16384 时, mô hình输出 1024 * log2(16384) = 14,336 bit(khoảng 1,75 KiB) dữ liệu。 Sản xuất ổn định Diffusion 输出 512*512*24 bit = 6,291,456 bit(khoảng 768 KiB) của nguyên liệu phích số。 tỷ lệ nén là bao nhiêu? nó đã thay đổi đến chất lượng gì?

5. 阅读 LlamaGen(arXiv:2406.06525) ―― Mô hình hình ảnh tự rút theo điều kiện lớp học của LlamaGen với cách tiếp cận che giấu của Show-o Có gì khác biệt?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Masked discrete diffusion | “MaskGIT-style” | 训练模型预测 masked Tokens；推理时，迭代式 unmask 置信度最高的预测 |
| Cosine schedule | “Unmask schedule” | mask ratio 随推理步数衰减；将置信度增长集中在中间区间 |
| Parallel decoding | “All tokens at once” | 每一步用一次 forward pass 预测完整的 masked Token 序列，然后提交 top-K |
| Hybrid attention | “Causal + bidirectional” | 一种 mask：对 text tokens 是 causal，在 image blocks 内是 bidirectional |
| Inpainting | “Fill-in generation” | 以部分 Tokens 被 masked 的 image 为条件，预测缺失部分；从训练目标中免费获得 |
| Commitment rate | “Top-K per step” | 每次迭代中有多少 Tokens 被声明为“完成”；控制推理与质量的 trade-off |

## 延伸阅读
- [Xie et al. — Show-o (arXiv:2408.12528)](https://arxiv.org/abs/2408.12528)
- [Show-o2 (arXiv:2506.15564)](https://arxiv.org/abs/2506.15564)
- [Chang et al. — MaskGIT (arXiv:2202.04200)](https://arxiv.org/abs/2202.04200)
- [Sun et al. — LlamaGen (arXiv:2406.06525)](https://arxiv.org/abs/2406.06525)
- [Chang et al. — Muse (arXiv:2301.00704)](https://arxiv.org/abs/2301.00704)
