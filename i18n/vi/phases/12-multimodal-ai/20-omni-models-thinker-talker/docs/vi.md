# Omni Models:Qwen2.5-Omni 与Thinker-Talker 拆分

> GPT-4o trong năm 2024 tháng 5 của sản phẩm trình bày vì vậy có sức mạnh, không phải vì mô hình tầng dưới, mà vì hình dạng sản phẩm: một giao diện thoại, nói chuyện, mô hình nhìn thấy nội dung trong ảnh nhìn thấy, và 250ms trong nội dung thoại đáp ứng. Open生态 trong năm 2024 năm余下时间 và 2025 năm liên tục cạnh tranh, cố gắng đạt được mặt hàng của sản phẩm này.

**Type:** Build
**Languages:** Python（stdlib，streaming pipeline 延迟模拟器 + VAD 循环）
**Prerequisites:** Phase 12 · 19（audio-LLMs），Phase 12 · 16（any-to-any）
**Time:** ~180 分钟

## Học mục tiêu
- 将推理管线 拆分为Thinker (文本推理) 和 Talker (语音合成),并解释为什么并行流动 (能工作).
- 逐组件计算一次对话交互的时间到第一音频字节 (TTFAB) 预算──
- Mô tả TMRoPE trong Thinker 内部跨视觉、音频和文本的时间对齐位置编码──
- Nói ra 3 kiểu nói chuyện thực tế: nửa kép, quay lại, hoàn toàn kép.

## 问题
Một trợ lý tiếng nói thực tế phải nhanh chóng hoàn thành rất nhiều việc:

1. 听用户──实时语音 Tokenization, phát hiện hoạt động giọng nói(VAD) được sử dụng để đánh giá người dùng何时说完──
2. Choose to see. : 2 - 4 FPS 输入摄像头画面, cùng với âm thanh phát đến Thinker.
3. 思考―― dựa trên cuộc đối thoại
4. Nói话──合成音频 Token,解码为波形,并流到用户扬声器──

Mỗi bước đều tăng chậm lại. Hỗn thoại yêu cầu quay trở lại thời gian < 500ms; thấp hơn giá trị này, người dùng không còn cảm thấy chậm lại rõ ràng.

Mỗi bộ phận đều cần được phát trực tuyến. Không thể đính kèm lại.

## 概念
### Người suy nghĩ và người nói

Qwen2.5-Omni 的分解:

- Người suy nghĩ: một 7B-80B 文本生成 Transformer。消费交错的文本 + 图像 + 音频 Token。输出表示要说什么的文本 Token。
- Người nói: một hơn nhỏ của语音生成 Transformer(200M-1B) ――消费 Thinker 的文本输出代码加上最近的语音上下文代码──输出离散语音代码(残留-VQ索引)。
- Bộ giải mã giọng nói: Một bộ giải mã dạng sóng phát sóng(SNAC、MoVQGAN gia đình),将语音 Token 实时转换为音频样本。

Sự phân tách này rất quan trọng. Người suy nghĩ phải đủ lớn để có khả năng suy nghĩ tốt. Người nói có thể rất nhỏ, vì nhiệm vụ của nó là nội bộ: chuyển văn bản thành biểu tượng tiếng. Người nói lớn hơn không có khả năng biểu hiện hơn. Nó chỉ chậm hơn.

两者并行运行:

1. Thinker 发发出文本 Địa chỉ t_i。
2. Người nói 消费 t_i( thông qua phát trực tuyến),并发出语音 Điểm chỉ s_i、s_{i+1}、...、s_{i+k}。
3. Bộ giải mã giọng nói trong biểu tượng tiếng Anh đến khi tiêu thụ chúng,并发发出音频样本.
4. Khi người nghĩ đến văn bản Địa chỉ t_{i+3} 时, Người nói 已为 t___..t_{i+2} phát 了音频。

### TMRoPE  时间对齐的 đa phương tiện 位置

Người suy nghĩ cần tích hợp hình ảnh (ví dụ: 4 FPS đến) 音频 (với 50 / giây đến) và các văn bản từ lịch sử cuộc nói chuyện.

TMRoPE dành cho mỗi token chia sẻ tuyệt đối thời gian──t=2.3s 的视觉 Token──t=2.32s 的音频 Token──来自用户文本 Token stop 位于 t=2.35s──RoPE 按时间旋转 注意;模型将它们看作在时间同时发生──

Đó là để anh ấy một bên lôi tay một bên nói hello能够工作的基础设施: mô hình trong cùng một khái niệm đã được xem video和音频

### Streaming 语音合成

语音 Token 必须流媒体──Mini-Omni(Xie & Wu, 2024) đề xuấtlanguage models can hear, talk while thinking in streaming:Thinker 输出 Token 和 Talker 输出 Token 在同一个序列中交错──Talker 在 Thinker 确认下一个文本 Token 后立即启动──没有批量 边界──

Moshi(Défossez et al., 2024 年 10 月) là sự thực hiện mở nhanh nhất.

### VAD và quay

Khám phá hoạt động giọng nói 运行在输入侧──两种模式:

- Half-duplex: người dùng nói chuyện,模型听――模型说话, người dùng nghe――通过 VAD 静音检测(~200ms)实现清晰交接――
- Full-duplex: cả hai bên có thể nói chuyện cùng lúc. Mô hình có thể backchannel.

Qwen2.5 Omni 默认支持半duplex, thông qua静音值 thực hiện chuyển đổi.

### Qwen3-Omni(2025 年 11 月)

后继版本──Qwen3-80B Thinker, Greater Talker,改进的TMRoPE-v2──延迟接近GPT-4o的250ms──开放权重──在OmniBench上的基准与Gemini 2.0 Live 具有竞争力──

### Ngân sách thời gian trễ sản xuất

Đối với các loại streaming 交互:

- Mic -> 音频 Token:40-80ms。
- Prefill(quan nhanh + lịch sử):7B 上 100-200ms,70B 上高得多。
- Thứ nhất Thinker 文本 Token:40ms
- Người nói 处理第一个文本 Token:20ms。
- 第一个语音 Địa chỉ tham gia:40ms。
- Résidual-VQ decode: 30ms.
- 语音 dạng sóng decode:50-80ms。

Tổng TTFAB:7B 上 320-510ms,70B 上 600-900ms。 Border 质量 thường có nghĩa là 70B+; đây là nguồn gốc của biên giới 延迟差距。

### Phương pháp toán tỷ lệ token

Đối với 16kHz 语音和 50 Hz 基础层语音代币,你每秒输出需要50语音代币――Speaker 必须发发出 ≥50 tok/s 才能跟上――在H100上,典型 LLM throughput为30-80 tok/s,因此小型(200-300M)Speaker 足够快;7B Speaker 会落后――

Đó là lý do tại sao sẽ có mô hình Speakers chuyên dụng nhỏ, thay vì mô hình chính trực tiếp.


```figure
l5-thinker-talker
```

## Sử dụng nó
`code/main.py`- Có thể là:

- Sử dụng mã thông báo giả 发射速率模拟Thinker-Talker ống dẫn
- Đối với kích thước mô hình có thể được cấu hình và tỷ lệ lấy mẫu máy tính TTFAB
- 用 VAD 静音值演示 nửa kép lật-lật-lật

## 交付 nó
本课产 出 `outputs/skill-omni-streaming-budget.md`△给定一个实时语音产品的目标 TTFAB 和功能集合(vision-in、双语、full-duplex), chọn Qwen2.5Omni、Qwen3-Omni、Moshi 或 Mini-Omni,并确定 Thinker/Talker's size。

## 练习
1. Mục tiêu của bạn TTFAB là 300ms. Trong 7B Thinker và 300M Talker, viết ra mỗi bộ phận của sự chậm trễ.

2. Qwen2.5-Omni Sử dụng TMRoPE。 mô tả một lời nhắc như vậy 中模型看的内容:用户在 t=1s 开始说话,摄像头在 t=1.2s 捕捉到一个手势。

3. Full-duplex 支持要求模型在听的同时发音频―― đề xuất một hình thức đào tạo dữ liệu để giảng dạy này――

4. 阅读 Moshi 论文 Phần 4  mô tả một bài độc thoại bên trong chia rẽ, cũng như lý do tại sao nó đã tránh được Thinker-Talker chia rẽ.

5.  tính năng thông qua  ngân sách: Để theo dõi trên 16kHz 语音 và 50 tầng nền tảng Token / giây, người nói  phải phát hành Token với tốc độ nhanh hơn?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Thinker | “推理大脑” | 生成要说什么的大型文本生成 Transformer |
| Talker | “语音生成嘴巴” | 从 Thinker 文本生成离散语音 Token 的小型 Transformer |
| TTFAB | “延迟预算” | Time-to-first-audio-byte：从用户语音结束到第一个音频 sample 输出 |
| TMRoPE | “时间对齐 RoPE” | 使用跨视觉、音频、文本的绝对时间戳的位置编码 |
| Half-duplex | “Turn-taking” | 用户和模型交替；VAD 静音检测用户已说完 |
| Full-duplex | “同时进行” | 模型可以同时说话和聆听；具备 backchannel 能力 |
| Inner monologue | “Moshi 分离” | 单模型设计，其中思考流和说话流交错 |

## 延伸阅读
- [Xu et al. — Qwen2.5-Omni (arXiv:2503.20215)](https://arxiv.org/abs/2503.20215)
- [Qwen Team — Qwen3-Omni (arXiv:2509.17765)](https://arxiv.org/html/2509.17765v1)
- [Xie & Wu — Mini-Omni (arXiv:2408.16725)](https://arxiv.org/abs/2408.16725)
- [Défossez et al. — Moshi (arXiv:2410.00037)](https://arxiv.org/abs/2410.00037)
- [Zeng et al. — GLM-4-Voice (arXiv:2412.02612)](https://arxiv.org/abs/2412.02612)
