# ASCII Art và Visual Jailbreaks

> Jiang, Xu, Niu, Xiang, Ramasubramanian, Li, Poovendran, "ArtPrompt: ASCII Art-based Jailbreak Attacks against Aligned LLMs" (ACL 2024, arXiv:2402.11753)  Trong các yêu cầu có hại che giấu và bảo mật liên quan đến Token, sử dụng cùng chữ cái ASCII-art 染 thay thế chúng, sau đó gửi lời yêu cầu sau khi giả mạo này  GPT-3.5GPT-4、Gemini、Claude、Llama-2 都无法稳健识别 ASCII-art Token──该攻击绕过 PPL((Retransplexity filters)  Phân tích phòng thủ và về công nhận định.

**类型：**Xây dựng
**语言：**Python (stdlib, ArtPrompt token-masking harness)
**前置要求：**Giai đoạn 18 · 12 (PAIR), Giai đoạn 18 · 13 (MSJ)
**时间：**约60分钟

## Học mục tiêu

- 描述 ArtPrompt 攻击:word-identification 步骤、ASCII-art 替换、最终伪装后的提示──
- 解释为什么标准防御 ((PPL、Paraphrase、Retokenization) 会在 ArtPrompt 上失败。
- 定义 ViTC,并描述它衡量什么──
- 将 StructuralSleight 描述为向任意不常文本编码结构的泛化.

## 问题

Thông qua đoạn phần và trò chơi vai trò (Lớp 12) và thông qua bối cảnh dài (Lớp 13) của tấn công, tác dụng lên mô hình của văn bản.

## 概念

### ArtPrompt,两步

Bước 1. Chứng chỉ từ. Đặt một yêu cầu có hại, kẻ tấn công sử dụng một LLM để xác định các từ liên quan đến an ninh.

Bước 2. Cụm lại Thế hệ nhanh chóng. Sẽ thay thế mỗi từ được nhận dạng thành từ ASCII-art 染.

Kết quả:GPT-4、Gemini、Claude、Llama-2、GPT-3.5 全部失败── trên điểm chuẩn của họ, tỷ lệ thành công tấn công vượt quá 75%──

### Tại sao các tiêu chuẩn phòng thủ thất bại

- **PPL（perplexity filter）。**Nghệ thuật ASCII  có độ phức tạp cao, nhưng tất cả các nhập mới cũng vậy.
- **Paraphrase。**Để nhanh chóng làm các đoạn phrases sẽ phá hủy nghệ thuật ASCII. Trong thực tế, các đoạn phrases LLM thường sẽ giữ lại hoặc tái tạo các nghệ thuật này.
- **Retokenization。**Theo cách khác nhau phân chia token, sẽ không thay đổi mô hình của hình ảnh nhận dạng đang nhận dạng hình chữ cái.

根本问题在于,安全过器处于Token或语义层面;ArtPrompt 作用于视觉识别层面──

### Chỉ số chuẩn ViTC

识别非语义视觉提示──衡量模型读取ASCII-art、wingdings 和其他非文本语义视觉内容的能力──ArtPrompt's有效性与ViTC精度相关:模型越擅长读取视觉文本,ArtPrompt 在它上越有效──这是一种能力与安全的衡量──

### Dòng cấu trúc

泛化 ArtPrompt:Thông cấu trúc mã hóa văn bản không phổ biến (UTS) ――树、图、嵌套 JSON、CSV-in-JSON、Block code kiểu khác nhau―― Nếu một cấu trúc trong dữ liệu đào tạo an ninh hiếm gặp, nhưng có thể được phân tích mô hình, nó có thể ẩn nội dung độc hại。

防御含义: an ninh phải có thể được phổ biến thành mô hình có thể giải quyết được biểu hiện cấu trúc.

### hình ảnh-modality 类比

Visual LLMs ((GPT-5.2、Gemini 3 Pro、Claude Opus 4.5、Grok 4.1) đã mở rộng diện tích tấn công.

### Nó nằm ở vị trí giữa giai đoạn 18

Bài học 12-14 mô tả ba loại tấn công chính xác. Víctor:代 tinh vi (PAIR)  chiều dài ngữ cảnh (MSJ) và mã hóa (ArtPrompt/StructuralSleight)  Bài học 15 từ một tấn công tập trung vào mô hình chuyển sang một hệ thống biên giới tấn công (indirect prompt injection)  Bài học 16 mô tả các công cụ phòng thủ (defense tool response)).


```figure
al-ascii-cloak
```

## Sử dụng nó

`code/main.py`构建一个玩具 ArtPrompt── bạn có thể sử dụng glyphs ASCII-art 伪装有害查询 中中的特定词,验证伪装后的字符串能通过关键字过器,并且(可选) bằng đơn giản nhận dạng sẽ伪装后的字符串解码回来──

## 交付 nó

本课会产出 `outputs/skill-encoding-audit.md` Đưa ra một báo cáo phòng thủ jailbreak, nó sẽ đưa ra các hệ thống mã hóa của các cuộc tấn công (ASCII art, base64, let-speak, UTF-8 homoglyph, UTES) cũng như các lớp phòng thủ của mỗi loại tấn công.

## 练习

1. 运行 `code/main.py`▽验证伪装后的字符串可通过简单关键字过──报告所需的字符级变更──

2. 实现第二种编码: đối với cùng một mục tiêu từ sử dụng cơ sở64── so sánh nó so với ArtPrompt của lọc-bypass rate 和恢复难度──

3. 阅读 Jiang et al. 2024 Phần 4.3 ((五模型结果) 』 đề xuất một lý do, giải thích tại sao Claude ở cùng điểm chuẩn trên của ArtPrompt-đối kháng cao hơn Gemini。

4. 设计一个预代 防御,用于检测 prompt 中 ASCII-art-shaped 区域──在合法代码、表格和数学记号上衡假阳性率──

5. StructuralSleight đã liệt kê 10 loại cấu trúc mã hóa.

## 关键术语

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|-----------------|------------------------|
| ArtPrompt | "ASCII-art attack" | 使用 ASCII-art 渲染遮蔽安全词的两步 jailbreak |
| Cloaking | "隐藏这个词" | 用模型能读取但过滤器读不到的视觉表示替换被禁止的 Token |
| UTES | "不常见结构" | Uncommon Text-Encoded Structure — 树、图、嵌套 JSON 等，用于夹带内容 |
| ViTC | "visual-text capability" | 衡量模型读取非语义视觉编码能力的 benchmark |
| Perplexity filter | "PPL defense" | 拒绝高 perplexity 的 prompt；会失败，因为合法结构化输入也会得到高分 |
| Retokenization | "tokenizer shift defense" | 用不同的 Tokenizer 预处理 prompt；会失败，因为识别是视觉层面的 |
| Homoglyph | "外观相似字符" | 看起来与拉丁字母相同的 Unicode 字符；绕过 substring 检查 |

## 延伸阅读

- [Jiang et al. — ArtPrompt (ACL 2024, arXiv:2402.11753)](https://arxiv.org/abs/2402.11753) ASCII-art jailbreak 论文
- [Li et al. — StructuralSleight (arXiv:2406.08754)](https://arxiv.org/abs/2406.08754) UTES 泛化
- [Chao et al. — PAIR (Lesson 12, arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) 互补的代攻击
- [Anil et al. — Many-shot Jailbreaking (Lesson 13)](https://www.anthropic.com/research/many-shot-jailbreaking) 互补的长度攻击
