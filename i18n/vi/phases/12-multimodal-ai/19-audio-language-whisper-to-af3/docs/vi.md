# Audio-Language Models: từ Whisper đến Audio Flamingo 3

> Whisper(Radford 等,2022 年 12 月) 让语音识别尘埃落定:68万小时弱监督多语言语音、一个简单的编码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码

**类型：**Xây dựng
**语言：**Python (stdlib, log-Mel spectrogram + âm thanh Q-ex xương)
**前置要求：**Giai đoạn 6 (Vào nói và âm thanh), Giai đoạn 12 · 03 (Q-Former)
**时间：**约180分钟

## Học mục tiêu
- Từ hình dạng sóng 计算 log-Mel quang phổ: cửa sổ FFT  lọc ngân hàng  chuyển đổi log 
- Hãy so sánh mã hóa 选项:Whisper encoder、BEATs、AF-Whisper hybrid── hiểu cách thức của họ何时胜出──
- 构建 audio Q-former:让 N 个可学习 truy vấn đối với các bản vá quang phổ thực hiện việc phục vụ chéo.
- 解释 Cascaded(Whisper-then-LLM) Vs End-to-end audio-LLM 训练:为什么端到端 更适合扩展到推理能力──

## 问题
语音识别已经被 Whisper 解决了──音频的 OCR 已商品化──但商品化止步于转写──如果模型无法推理其听到的内容:时间点、说话者、情绪、音乐结构、环境声音,那么 chỉ靠转写无法支产品功能──

三条 rõ ràng:

1. Cascade:Whisper 转写,LLM đối với bản sao 推理。适用于纯语音场景。 đối với âm nhạc、环境音频、多说话人重叠、情绪会失败。

2. End-to-end audio-LLM:audio encoder 将 audio tokens 直接输入 LLM,跳过转写──保留声学信息(情绪、说话者、环境) ・ cần dữ liệu đào tạo mới──

3. Hybrid: âm thanh mã hóa + mã hóa văn bản,既能转写也能推理──Qwen-Audio 和 Audio Flamingo 选择这条路线──

## 概念
### Log-Mel quang phổ:输入特征

Mỗi bộ mã hóa âm thanh đều có cùng một đặc điểm bắt đầu: log-mail spectrogram.

1. Mẫu lại đến 16 kHz.
2. Sử dụng cửa sổ 25ms  10ms nhảy thực hiện chuyển đổi Fourier ngắn thời gian 
3. 取 FFT 结果的大小──
4. 应用 Mel filter banks (thường là 80 个在 0-8000 Hz 上按 log 间隔分布的过器),映射到感知频率──
5. 用 log compress(log(1 + x)) xử lý phạm vi động。

Kết quả: hình dạng为 (T, 80) của 2D mảng, trong đó T là khung thời gian 数量── đối với tốc độ khung 100 Hz clip 30 giây: hình dạng为 (3000, 80)──

### Whisper của mã hóa

Whisper 的编码器 là một Transformer kiểu ViT 12 tầng, sẽ log-Mel quang phổ 作为时间框架 序列处理──输出: mỗi khung thời gian Một vector trạng thái ẩn──

Đối với ASR,Whisper's decoder là một Transformer chuyển đổi sự chú ý, nó tạo ra các mã thông báo văn bản dưới điều kiện phát ra của bộ encoder.

Đối với ALM (audio-LLM), bạn muốn đưa ra đầu ra mã hóa như một dòng chữ khác.

### BEATs 和音频 đặc biệt mã hóa

Whisper được đào tạo dựa trên dữ liệu của chủ thể âm thanh.

BEATs(Chen 等,2022) là một Transformer tự giám sát được đào tạo trên AudioSet.

AF-Whisper(Audio Flamingo 3 的混合):将 Whisper + BEATs tính năng concat 作为音频输入──Whisper 携带语言信号,BEATs 携带声学信号──

### Audio Q-former

Với BLIP-2 hình ảnh Q-trước đây 模式 tương tự. Số lượng cố định của các truy vấn có thể học được.

训练对齐阶段:只训练 Q-former,在音频文字对中(AudioCaps、Clotho) 上使用对比 + tiêu đề mất đi。Instruction 阶段:end-to-end,unfreeze LLM,在教学数据上训──

### Đây là một trong những điều mà tôi muốn nói.

SALMONN(Tang 等,2023):Whisper + BEATs + Q-former + LLaMA。第一个具有严推理能力的开放音频-LLM──MMAU基准 上复合约0.55──

Qwen-Audio(Chu 等,2023):架构类似,训练数据集更丰富, nhắm vào các cuộc đối thoại nhiều lượt 调优――MMAU 约 0.60──

LTU  Listen, Think, Understand(Gong 等,2023): dữ liệu lý luận rõ ràng, tập trung vào đoạn phim âm thanh 上的链思维――规模更小但更聚焦――

Audio Flamingo 3(Goel 等,2025 年 7 月):当前 open SOTA──8B LLM backbone(Qwen2 7B)、Whisper-big encoder concat BEATs、64-query Q-former, trong 1000000+ cặp hướng dẫn văn bản âm thanh 上练──MMAU 0.72, trong một số phụ trách 上匹配 độc quyền biên giới──

AF3 cũng giới thiệu chuỗi suy nghĩ theo yêu cầu của âm thanh: mô hình có thể xuất ra các mã thông báo suy nghĩ trong phần cuối cùng của câu trả lời trước:

### Cascaded vs end-to-end

Đường ống nước:

1. Whisper 将音频转写为文本.
2. LLM đối với tư vấn văn bản:

总结这个播客非常有效对于以下情况会失败:
-                                                                                                                                                                                                                                                               
- Who is talking, Alice là Bob?                                                                                                                                                                                                                                                          
- Chuyện nổ xảy ra trong vài giây?
- Đây là âm thanh thật hay là âm thanh tạo?Phát hiện giả mạo sâu 需要声学特征──

End-to-end 保留声学信号──Qwen-Audio 和 AF3 能原生处理音乐、环境和情绪──

### Công thức sản xuất 2026

对于新音频理解产品:

- Cascaded nếu: mục tiêu là chuyển viết, không có nhạc, không có tình cảm推断.
- AF3 / Qwen-Audio-family nếu:音乐、情绪、多说话人,或复杂音频推理──

Cascaded 更便宜、更简单──End-to-end 能力更强──

### MMAU:音频推理 chuẩn

MMAU(Mối quan hệ âm thanh đa phương tiện lớn) là điểm chuẩn 2024-2025 音频推理:

- 10.000 cặp âm thanh văn bản QA của âm thanh, âm nhạc, âm thanh môi trường.
- 覆盖 phân loại, lý luận thời gian lý luận nguyên nhân, QA mở
- 测试 đường ống nước rơi  hệ thống性遗漏的能力──

Open SOTA(AF3)为0.72;proprietary frontier 约0.78(Gemini 2.5 Pro、Claude Opus 4.7)。


```figure
audio-text-ctc
```

## Sử dụng nó
`code/main.py`- Có thể là:

- 用 stdlib 实现 log-Mel spectrogram 计算:windowing、naive DFT、Mel filter-bank。
- Audio Q-ex-squleton:给定 encoder output frames,计算 Q、K、V、注意,并输出 N 个代币──
- Trong một nhiệm vụ đồ chơi 上比较 Cascaded-vs-end-to-end.

## 交付 nó
本课会产出 `outputs/skill-audio-llm-pipeline-picker.md`△给定一个音频任务(tác phẩm sao chép, gắn thẻ âm nhạc, suy luận cảm xúc, nhật ký đa loa, phân loại môi trường), nó sẽ chọn AF3 kết thúc, hoặc lai.

## 练习
1. Đối với một cửa sổ 16kHz 2,5ms 10ms hop 80 Mel bins clip 30 giây, tính toán log-Mel quang phổ 维度.

2. Tại sao Whisper trong âm nhạc biểu diễn kém hơn?

3. 64 câu hỏi so với 32 câu hỏi của Audio Q-former: Trong nhiệm vụ nào phức tạp?

4. 阅读 AF3 Phần 4 关于关于按需思考的内容──提出三个链思想 最有帮助的音频任务──

5. Sử dụng AF3 để thực hiện một đường ống nhật ký tối thiểu. Bạn làm thế nào để đánh dấu sự thay đổi của người nói?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Log-Mel spectrogram | “Mel features” | 经过 Mel filter banks 后得到的 log-magnitude values 的 2D（time, frequency）array |
| Audio Q-former | “Audio Perceiver” | 从 audio encoder output 到 fixed-length queries 的 cross-attention bottleneck，供给 LLM |
| Cascaded | “ASR-then-LLM” | Whisper 转写后由 text LLM 推理的 pipeline；会丢失声学信息 |
| End-to-end | “Audio-LLM” | 音频特征通过 Q-former 直接进入 LLM；保留声学信号 |
| BEATs | “Audio AudioSet encoder” | 在 AudioSet 上训练的 SSL Transformer；擅长音乐 + 环境声音 |
| MMAU | “Audio reasoning bench” | 跨语音、音乐、环境的 10k QA pairs；2024 eval standard |
| On-demand thinking | “Audio CoT” | 模型可以在最终答案前可选地输出 reasoning tokens，将准确率提升 3-5 pts |

## 延伸阅读
- [Radford et al. — Whisper (arXiv:2212.04356)](https://arxiv.org/abs/2212.04356)
- [Chu et al. — Qwen-Audio (arXiv:2311.07919)](https://arxiv.org/abs/2311.07919)
- [Goel et al. — Audio Flamingo 3 (arXiv:2507.08128)](https://arxiv.org/abs/2507.08128)
- [Tang et al. — SALMONN (arXiv:2310.13289)](https://arxiv.org/abs/2310.13289)
- [Gong et al. — LTU (arXiv:2305.10790)](https://arxiv.org/abs/2305.10790)
