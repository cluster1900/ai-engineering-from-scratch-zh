# LLaVA với điều chỉnh hướng dẫn thị giác

> LLaVA(4 tháng 4 năm 2023) là cấu trúc đa mô hình được sao chép nhiều nhất trên Trái đất. Nó sử dụng MLP 2 tầng thay thế BLIP-2 của Q-Former, bằng kết nối token đơn giản thay thế sự chú ý chéo cổng của Flamingo, và chuyển sang 158k 条 hướng dẫn hình ảnh để tập luyện, dữ liệu này được tạo ra bởi GPT-4 từ các bản tóm tắt trong văn bản thuần túy.

**类型：**构建
**语言：**Python(stdlib、projector + trình tạo mẫu hướng dẫn)
**先修：**Giai đoạn 12 · 02(CLIP),Giai đoạn 11(LLM Engineering  điều chỉnh hướng dẫn)
**时间：**~ 180 phút

## Học mục tiêu

- 构建一个2层 MLP投影机,将 ViT patch Embedding(dim 1024)映射到LLM的 Embedding dim(dim 4096)。
- 走通 LLaVA công thức hai giai đoạn:(1) trên 558k cặp caption 上做 chiếu sắp xếp,(2) trên 158k GPT-4-được tạo ra lượt 上做 thị giác hướng dẫn điều chỉnh。
- 构建一个LLaVA-format prompt,包含图像 Token placeholder、system prompt 和 user/assistant turns。
- 解释为什么社区从Q-Former 转向MLP, mặc dùQ-Former 在代币预算上有优势──

## 问题

BLIP-2 của Q-Former(Dân 12.03) đưa một张图像 bị nén thành 32 Token──干净、高效、基准表现好──但它 có hai vấn đề──

Thứ nhất,Q-Former là có thể đào tạo, nhưng mất mát của nó không phải là nhiệm vụ cuối cùng.

Thứ hai, Q-Former có 188M param, trong khi ở quy mô 2023 của LLaVA, bạn phải đưa nó và mục tiêu LLM Một起协同设计,换 LLM, cần phải tái đào tạo Q-Former, đổi hình ảnh mã hóa, cũng phải tái đào tạo, mỗi bộ phận là một dự án R&D độc lập.

LLaVA's Answer Simple to Embarrasing: lấy 576 Patch Token của ViT, để mỗi Token thông qua một MLP 2 tầng`1024 → 4096 → 4096`), sau đó đưa tất cả 576 thành phần vào chuỗi nhập vào LLM. Không có chai. Không có dự thi giai đoạn 1 dựa trên mục tiêu kỳ lạ.

Số liệu từ đâu đến?LLaVA's 2nd洞见: sử dụng GPT-4(chỉ văn bản) tạo dữ liệu hướng dẫn。把图像的COCO caption 和 bounding-box data 输入 GPT-4,让它生成对话、描述和复杂推理问题──免费得到158k hướng dẫn-响应转──无需人工标注──

Kết quả: một trong 8 张 A100 上运行一天、在MMMU 上击败 Flamingo、并发布 VLM của cộng đồng có thể mở rộng kiểm soát điểm.

## 概念

### 架构

LLaVA-1.5 ở 13B:
- Mã mã thị giác: CLIP ViT-L/14 @ 336(giai đoạn 1 结,giai đoạn 2 可选解) 』
- Động cơ chiếu:带 GELU kích hoạt của 2 lớp MLP,`1024 → 4096 → 4096`
- LLM: Vicky-13B (sau đó là Llama-3.1-8B)

图像 + 文本 prompt 的 chuyển tiếp:

```
img -> ViT -> 576 patches of dim 1024
patches -> MLP -> 576 tokens of dim 4096
prompt: system + "<image>" placeholder + user question
replace <image> token with the 576 projected tokens
feed the full sequence to the LLM
decode response
```

图像占用 LLM context 中的 576 个 Token──在 2048 context 下,文本还剩下1472 个 Token──在 32k context 下,这只是一个舍进错误──

### Giai đoạn 1: Định hướng máy chiếu

结 ViT──结 LLM──只训练 2-layer MLP──Dataset:558k image-caption pairs(LAION-CC-SBU)──Loss:在投影图像代号条件下,对标题做语言建模──

以批量 128 训练单个时代,几小时就能完成――projector 学会把 ViT-space 映射到LLM-space――没有任务具体监督――

### Giai đoạn 2: Định hướng trực quan

解 máy chiếu ((仍然可训练) ――解 LLM(通常全量,有时使用LoRA) ―― 在 158k视觉指令转上训──

Dữ liệu hướng dẫn là cách tạo:
1. 取一张 COCO 图像──
2. 提取文本描述(5 条 phụ đề con người + danh sách hộp giới hạn)。
3. Sử dụng 3 mẫu đơn giản gửi cho GPT-4:
   - Cuộc trò chuyện: tạo ra một đoạn user và trợ lý xung quanh bức ảnh này để trao đổi cuộc trò chuyện.
   - 详细描述:Give a rich, detailed description of the image.
   - 复杂推理:  đưa ra một câu hỏi cần phải được đưa ra dựa trên hình ảnh, sau đó trả lời nó.
4. 将 GPT-4 的输出解析为: hướng dẫn, phản ứng

Tất cả quá trình không liên lạc trực tiếp với hình ảnh chỉ liên lạc với văn bản mô tả GPT-4 会 ảo giác  hợp lý hình ảnh nội dung có một số tiếng ồn, nhưng nó đã hoạt động: 158k quay 足以解锁对话能力

### Tại sao cộng đồng đã sao chép chương trình này

- Không cần phải điều chỉnh các tổn thất cụ thể giai đoạn-1.
- Động cơ chiếu  luyện tập theo giờ, chứ không theo ngày.
- Chỉ cần luyện tập lại máy chiếu, bạn có thể thay thế LLM ((LLaVA-Llama2、LLaVA-Mistral、LLaVA-Llama3)
- Lợi dây ống dữ liệu hướng dẫn thị giác sử dụng GPT-4, và chi phí tái tạo đối với lĩnh vực mới rất thấp.

### LLaVA-1.5 với LLaVA- NEXT

LLaVA-1.5(2023 年 10 月)加入:
- Để phân tích dữ liệu nhiệm vụ học tập (VQA、OKVQA、RefCOCO)
- Hệ thống tốt hơn nhanh hơn.
- 2048 → 32k context。

LLaVA-NeXT(2024 年 1 月)加入:
- AnyRes:把高分辨率图像切成2x2或1x3 网格的336x336 crop,再加一个全球低分辨率图片.
- Sử dụng ShareGPT4V(高质量 GPT-4V phụ đề) của sự kết hợp dữ liệu hướng dẫn tốt hơn.
- 更强的基础 LLM(Mistral-7B、Yi-34B)

### LLaVA-OneVision

Bài học 12.08 会深入讲 OneVision──简短版: cùng một máy chiếu, nhưng bằng một chương trình giảng dạy 训练, trong một mô hình bao gồm một hình ảnh、 nhiều hình ảnh 和 video,并共享 thị giác-chèn hiệu ngân sách──

### So sánh với Q-Former

| | Q-Former（BLIP-2） | MLP（LLaVA） |
|---|---|---|
| 每张图像的 visual Token | 32 | 576（base）或 2880（AnyRes） |
| 可训练参数 | 188M + LM | 40M + LM |
| Stage 1 loss | ITC+ITM+ITG | 仅 LM |
| LLM drop-in | 需要重新训练 | 最小重新训练即可替换 |
| Multi-image | 别扭 | 自然（concat） |
| Video | 别扭 | 自然（per-frame concat） |
| Token budget | 小 | 大 |

MLP 赢在简单性和 Token 灵活性──Q-Đã 赢在 Token ngân sách──Tới cuối năm 2023, ngân sách Token 已不再是约束瓶(LLM bối cảnh  tăng lên 32k-128k+),简单性占上风──

### Phương thức nhanh

```
A chat between a curious human and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the human's questions. USER: <image> Describe this image in detail. ASSISTANT: The image shows ...
```

`<image>`Trong token hóa, nó sẽ được thay thế thành 576 token hình ảnh (AnyRes) xuống 2880 token (Tokenizer) được xem trong chuỗi hơn một chút trong thời gian đào tạo, nhưng LLM có thể xử lý các mục nhập mới này, vì giai đoạn 1 đã dạy nó.

### 参数经济性

LLaVA-1.5-7B 分解:
- CLIP ViT-L/14 @ 336:303M(Phase 1 结,phase 2 thường解)
- Động cơ chiếu ((2x tuyến tính): ~ 22M 可训练。
- Llama-7B:7B:
- 总计:7.3B Params;; giai đoạn 2 期间可训练:完整7B + 22M máy chiếu;;

Tiêu chuẩn 2 của chi phí đào tạo: 8xA100 lên khoảng 20 giờ. Đây là con số quan trọng của một ngày.


```figure
mm-llava-projector
```

## Sử dụng nó

`code/main.py`实现:

1. 纯 Python 中的 2 lớp MLP chiếu máy ((tình chơi quy mô 下 dim 16 → 32 → 32)。
2. Đường ống xây dựng nhanh: hệ thống nhanh + 用 N 个 dự kiến Token 替换 `<image>`+ lượt người dùng + người phụ trách thế hệ đặt phòng 👇
3. Một trình hình ảnh, được sử dụng để hiển thị khối hình ảnh 576-token trong bối cảnh LLM 中的样子(占用2k / 32k / 128k ngữ cảnh 的百分比)

## 交付 nó

本课产 出 `outputs/skill-llava-vibes-eval.md` Đưa ra một điểm kiểm soát gia đình LLaVA, nó sẽ chạy một bộ vibes-ev 10 ngay lập tức  3 bản ghi chú  3 VQA  2 lý luận  2 từ chối), và báo cáo một thẻ điểm số có thể đọc được của con người  Nó không phải là tiêu chuẩn; thay vào đó, kiểm tra khói, để xác nhận máy chiếu và LLM  kết nối tốt 

## 练习

1. 计算 `1024 → 4096 → 4096`Số lượng tham số có thể đào tạo của máy chiếu MLP 2 tầng ⋅ với GELU và bias ⋅, nó chiếm tỷ lệ LLaVA-13B là bao nhiêu?

2. Để một trường hợp từ chối  xây dựng LLaVA prompt  hình ảnh chứa cá nhân  viết ra phản ứng trợ lý dự kiến  Tại sao LLaVA  nên không bắn    từ chối yêu cầu này? cần những dữ liệu đào tạo nào để tăng cường từ chối?

3. 阅读 LLaVA-NeXT blog của AnyRes 部分──计算一张 1344x672 图像在 AnyRes 下的视觉代币计量──与 336x336 下的基 576代币对比──

4. LLaVA giai đoạn 1 máy chiếu sử dụng tiêu đề 上的 LM mất 训练。 Nếu nhảy qua giai đoạn 1, trực tiếp vào giai đoạn 2(visual hướng dẫn điều chỉnh),会发生什么?引用Prismatic VLMs ablation(arXiv:2402.07865)作答。

5. LLaVA-Instruct-150k sử dụng GPT-4 và COCO phụ đề 生成 hướng dẫn。 đối với một lĩnh vực mới(X quang y tế、 hình ảnh vệ tinh), mô tả tạo hướng dẫn miền của ống dẫn dữ liệu bốn bước。 mỗi bước có thể xuất hiện vấn đề gì?

## 关键术语

| 术语 | 人们的说法 | 它实际上的含义 |
|------|----------------|------------------------|
| Projector | “MLP bridge” | 带 GELU 的 2-layer MLP，将 ViT dim 映射到 LLM dim |
| Image Token | “<image> placeholder” | Prompt marker，在 inference 前被 N 个 projected visual Token 替换 |
| Visual instruction tuning | “LLaVA stage 2” | 在 GPT-4-generated（image, instruction, response）triplets 上训练 |
| Stage 1 alignment | “Projector pretraining” | 冻结 ViT 和 LLM，用 captions 上的 LM loss 训练 projector |
| AnyRes | “Multi-crop tiling” | 将高分辨率图像切分为 tile grid，并拼接每个 tile 的 visual Token |
| LLaVA-Instruct | “GPT-4-generated” | 从 COCO captions + GPT-4 合成的 158k instruction-response pairs |
| Vision encoder freeze | “Backbone locked” | CLIP weights 在 stage 1 不更新，有时在 stage 2 也不更新 |
| ShareGPT4V | “Better captions” | 由 GPT-4V 生成的 1M dense captions，用于更高质量 alignment |
| VQA | “Visual question answering” | 回答关于图像的自由形式问题的任务 |
| Prismatic VLMs | “Design-space paper” | Karamcheti 2024 ablation，系统测试 projector 和 data choices |

## 延伸阅读

- [Liu et al. — Visual Instruction Tuning (arXiv:2304.08485)](https://arxiv.org/abs/2304.08485) LLaVA 论文。
- [Liu et al. — Improved Baselines with Visual Instruction Tuning (arXiv:2310.03744)](https://arxiv.org/abs/2310.03744) LLaVA-1.5。
- [Chen et al. — ShareGPT4V (arXiv:2311.12793)](https://arxiv.org/abs/2311.12793) tiêu đề dày đặc 数据集。
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865) thiết kế không gian ablations。
- [Li et al. — LLaVA-OneVision (arXiv:2408.03326)](https://arxiv.org/abs/2408.03326) 统一的单图、多图、视频──
