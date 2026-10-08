# MIO với bất kỳ mô hình đa phương tiện phát trực tuyến nào

> GPT-4o  giao hàng một phần lớn các mô hình mở 无法复现的产品: một能实时听到语音、看视频并开口回应的代理── đến cuối năm 2024, giải pháp cho hệ sinh thái mở là MIO(Wang et al., tháng 9 năm 2024)──MIO Tokenize 文本、图像、语音和音乐, trên chuỗi giao lưu đào tạo một biến thể nhân quả,并能 từ bất kỳ chế độ nào 生成 đến bất kỳ chế độ nào──AnyGPT(Zhan et al., tháng 2 năm 2024) là bằng chứng về khái niệm; MIO là quy mô;Unified-IO 2(Allen AI, tháng 12 năm 2023) là mang tầm nhìn gần với hành động.

**Type:** Learn
**Languages:** Python (stdlib, four-modality token allocator + streaming decode loop)
**Prerequisites:** Phase 12 · 11 (Chameleon), Phase 6 (Speech and Audio)
**Time:** ~120 minutes

## Học mục tiêu
- Thiết kế một từ vựng chung, được sử dụng để chứa văn bản, hình ảnh, ngữ âm và nhạc Token, và không xảy ra xung đột.
- Từ áp suất + 重建取舍角度比较 SEED-Tokenizer (图像) và SpeechTokenizer (VQ)
- 解释 xây dựng bất kỳ sinh học sinh nào có khả năng phát triển
- Nói ra ba công thức mở bất cứ-to-những 及其主要取舍:MIO、AnyGPT、Unified-IO 2。

## 问题
Một mô hình đa phương tiện thống nhất  dễ tuyên bố, nhưng rất khó để xây dựng quy mô. Cho đến năm 2024, hầu hết các hệ thống "bất cứ ai đến bất cứ ai" đều là hệ thống thay đổi: mô hình tầm nhìn → 文本表示 → mô hình nói chuyện → 音频。 mỗi nhảy sẽ mất thông tin、 tăng trì hoãn,并让训练变复杂──GPT-4o  trình bày một mô hình đơn có phản ứng cấp 2 替代方案; hệ thống mở 落后了数月──

工程挑战:

- Mỗi loại hình đều phải có Tokenizer, nén phải đủ gần không bị tổn thất để tái xây dựng, và tạo ra Token với tốc độ chuyển đổi 能消耗.
- 单一词汇 必须为文本(32k+) 图像(16k+) 语音(4k+) 音乐(8k+) phân phối không gian──最低也需要四万多条目──
- 训练数据 phải bao gồm mỗi cặp đầu vào-phản xuất (text→image、image→speech、speech→image等), hoặc mô hình phải có thể được hợp nhất.
- Inference 必须足足足足快地流 输出 Token,以满足对话延迟 ((<500ms time-to-first-audio-byte) ]]

## 概念
### 4 hình thức của 4 Tokenizer

MIO của Tokenizer đống:

- Văn bản: chuẩn BPE, âm thanh ~32000。
- Hình ảnh:SEED-Tokenizer (2023)  带离散代码簿 的量化VAE,4096 条目,每张图像 32x32 个代码.
- Khả năng phát biểu:SpeechTokenizer residual-VQ (2023)  sẽ định dạng sóng 16kHz 编码为 8 个层次代码书; tầng nhất là nội dung粗粒度,后续层加入 prosody 和扬声器身份──
- Âm nhạc: tương tự như còn lại-VQ(Meta của MusicGen / Encodec gia đình),4-8 个 codebook──

Mỗi phương thức đều tạo ra một số lượng lớn các Token. Những Token này được nhận được các phạm vi ID không chồng lên trong từ vựng chung:

```
text:   0..31999
image:  32000..36095  (4096 image tokens)
speech: 36096..40191  (4096 speech base tokens, plus residual layers)
music:  40192..48383  (8192 music tokens)
sep:    48384..48390  (<image>, <speech>, <music>, </...>, etc.)
```

总计: khoảng 48k từ vựng.

### Đánh mã phát sóng

语音生成使用残留-VQ──Transformer 预测 base(layer 0) speech Token; một trình định lượng hóa dư thừa được giải mã song song 预测后续层── mỗi lớp 0 Token 大约对应 16kHz 音频中的50ms──

Streaming 模式:

1. Người dùng dùng dùng: 麦克风说话; Real-time audio Tokenizer 每50ms 发发言 Token。
2. MIO 在 Token 到达时消费它们(quan prefill + tăng lên tiến bộ)
3. Output Token 随生成流式输出; đồng bộ phát âm decoder 以约 50-150ms 延迟将其转换为音频样本。
4. Thời gian đến đầu tiên-audio-byte:MIO giấy Trung khoảng 300-500ms, gần GPT-4o của khoảng 250ms。

Mini-Omni(arXiv:2408.16725)、GLM-4-Voice(arXiv:2412.02612) và Moshi(arXiv:2410.00037) là các thiết kế phát thanh-LLM trực tuyến tương ứng. Trong đó, Moshi trên GPU đơn đã thực hiện 160ms đi lại-lại.

### Chương trình giảng dạy bốn giai đoạn

Chương trình giảng dạy đào tạo của MIO:

1. Giai đoạn 1  sự sắp xếp── quy mô lớn modality-pair corpora:text-image、text-speech、text-music── mỗi cặp sử dụng phân đoạn từ vựng Token riêng của mình──训练共享 từ vựng──
2. Giai đoạn 2  liên kết.  Các tài liệu liên kết đa phương thức. 带图像 + 视频的博客、带抄录的播客等)                                                                                                                                                                                                                                           
3. Giai đoạn 3  tăng cường ngôn ngữ 额外音频数据, được sử dụng để nâng cao chất lượng tiếng và không mất khả năng văn bản 
4. Giai đoạn 4  SFT──跨 modality 的指示调整:VQA、captioning、narration、speech-to-speech dialogue──

缺少某阶段会削弱特定能力: nhảy qua giai đoạn 2,模型会失去跨模式背景; nhảy qua giai đoạn 3,语音会很差──

### Dòng tư tưởng trực quan

MIO 引入链-of-visual-thought:模型发出中间图像 Token 作为推理步骤──对于"cat climbing a tree?",模型会:

1. 发发发 `<image>`Điểm biểu tượng đến 染场景 ((来自输入图像或草图)
2. 发出文本分析该草图.
3. 发发出最终答案──

染出的中间图像作为 scratchpad──在空间推理任务上,benchmarks 有提升──这个想法类似文本推理中的链思维──

### Bất cứ ai-to-any of竞争者

- AnyGPT(arXiv:2402.12226): 4 种种类
- Unified-IO 2 ((arXiv:2312.17172): tăng các kết quả hành động tầm nhìn, độ sâu, bình thường, nhiệm vụ nhiều hơn, quy mô nhỏ hơn.
- NExT-GPT(arXiv:2309.05519):LLM + các bộ giải mã phân tán cụ thể về phương thức── không phải là một mô hình 方法──
- CoDi(arXiv:2305.11846): phân tán hợp tác; thông qua chia sẻ tiềm ẩn 实现 bất kỳ-to-any。

MIO gần nhất là một biểu tượng hoàn toàn của bất cứ ai.

### Ngân sách thời gian trễ

Đối với một sản phẩm đối thoại, sự chậm trễ của mỗi bộ phận là rất quan trọng:

- Mic đến âm thanh Đèn: ~ 50ms。
- Prefill(audio Token + lịch sử):8B model 上 ~100ms。
- Đầu tiên đầu ra Tốc hiệu: ~ 50ms
- Hỗ trợ giải mã giọng nói: ~ 100-150ms.

Tổng thời gian từ đầu tiên đến đầu tiên: tối thiểu khoảng ~300ms──GPT-4o 声称 ~250ms──Moshi 声称 160ms──根据公开基准,MIO/AnyGPT 位于400-600ms 范围──

### Tại sao bất cứ ai vẫn gặp khó khăn

Ngay cả vào năm 2026, mở bất kỳ mô hình nào trên hai trục vẫn còn sau những mô hình đóng cửa:

- 语音质量──residual-VQ Tokenizer 是有损的; 相比与 ElevenLabs-class giọng nói,对话语音听起来更机械──
- Lý luận qua phương thức. Hãy để mô hình "người về những gì bạn thấy" vẫn còn dễ thất bại hơn so với các nhiệm vụ tầm nhìn thuần túy.

Đây là những vấn đề nghiên cứu mở.


```figure
any-to-any-stream
```

## Sử dụng nó
`code/main.py`- Có thể là:

- 定义 phân bổ từ vựng bốn phương thức 并印它。
- Để một đầu vào đa phương thức 列表 (text,image,audio,clip,music) thông qua router Tokenizer 路由──
- 模拟 text-to-speech response 的流媒体解码,并统计延迟──
- Trong trường hợp có độ trễ của bộ mã hóa, dự đoán dự đoán thời gian đến đầu tiên-byte âm thanh.

## 交付 nó
本课产 出 `outputs/skill-any-to-any-pipeline-auditor.md` Đặt một mô hình sản phẩm trò chuyện (mô hình trong ≠mô hình ra ≠mô hình theo mục tiêu trễ), nó sẽ kiểm tra các lựa chọn thiết kế gia đình MIO và tính toán ngân sách trễ ⋅

## 练习
1. Các sản phẩm của bạn nhận đầu vào giọng nói và trả lại đầu ra giọng nói.

2. SpeechTokenizer residual-VQ sử dụng 8 codebook.

3. Từ vựng của bạn có 32k văn bản + 4k hình ảnh + 4k nói chuyện.                                                                                                                                                                                                                                                     

4. Dòng tư tưởng trực quan sẽ phát ra hình ảnh trung gian. Những loại vấn đề nào sẽ được hưởng lợi? Những loại nào sẽ bị tổn thương thêm?

5. 阅读 Moshi(arXiv:2410.00037)。 mô tả "mônolog nội bộ" của nó 技术,并与MIO的链视觉思想比较──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Any-to-any | "Multimodal in/out" | 一个单一模型，能够在任意方向接受并发出 text、image、speech 和 music |
| Residual-VQ | "Speech tokenizer stack" | Multi-codebook Tokenization，每一层都添加信息；base layer 是内容，后续层是 prosody |
| SEED-Tokenizer | "Image codes" | MIO 使用的离散 image Tokenizer，带 4096-entry codebook |
| Chain-of-visual-thought | "Visual scratchpad" | 模型在最终答案前生成一张中间图像作为 reasoning step |
| Time-to-first-audio-byte | "TTFAB" | 从用户语音到第一个 audio output 的延迟；<500ms 才有对话感 |
| Four-stage curriculum | "Training recipe" | Alignment -> interleaved -> speech-enhanced -> SFT，按此顺序 |

## 延伸阅读
- [Wang et al. — MIO (arXiv:2409.17692)](https://arxiv.org/abs/2409.17692)
- [Zhan et al. — AnyGPT (arXiv:2402.12226)](https://arxiv.org/abs/2402.12226)
- [Lu et al. — Unified-IO 2 (arXiv:2312.17172)](https://arxiv.org/abs/2312.17172)
- [Wu et al. — NExT-GPT (arXiv:2309.05519)](https://arxiv.org/abs/2309.05519)
- [Tang et al. — CoDi (arXiv:2305.11846)](https://arxiv.org/abs/2305.11846)
