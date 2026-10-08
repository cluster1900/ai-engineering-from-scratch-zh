# Janus-Pro: được sử dụng để thống nhất Multimodal 模型的解 Encoder

> 统一多模模型存在一种不可避免的张力――理解需要语义特征,即 SigLIP或 DINOv2 输出矢量,富含概念级信息――生成需要有利于重建代码,即能够重新组合清晰像素的 VQ Tokens――这两个目标在单个编码器中不兼容――Janus(DeepSeek,2024年10月) 和 Janus-Pro(DeepSeek,2025年1月)认为修复方式是停止强奏统一:解两个编码器同时共享变压器体,但理解通过 SigLIP 路由,通过 VQ Tokenizer 路由.

**类型：**Xây dựng
**语言：**Python(stdlib, định tuyến mã hóa kép + tín hiệu shared-body)
**先修：**Giai đoạn 12 · 13(Triết truyền),Giai đoạn 12 · 14(Show-o)
**时间：**约120分钟

## Học mục tiêu
- 解释 tại sao một đồng bộ mã hóa sẽ phải hy sinh một bên trong việc hiểu chất lượng hoặc sản xuất chất lượng.
- Mô tả định tuyến của Janus-Pro: hiểu sử dụng các tính năng SigLIP ở bên nhập, tạo trên cả hai bên nhập và ra ngoài sử dụng VQ Token。
- 追踪 để Janus-Pro thành công, còn Janus không thể làm được sự mở rộng dữ liệu.
- 比较 tách rời (Janus-Pro) ‧ nối tiếp (Coupled-continuous) ‧ chuyển tiếp (Transfusion) ‧ nối kín (Discrete) ‧ Show-o) 架构──

## 问题
统一模型在理解和生成之间共享 Transformer body──此前的尝试(Chameleon、Show-o、Transfusion) đều sử dụng cùng một Tokenizer thị giác trên hai hướng── Tokenizer này là một loại折中:

- 为重建优化(生成):VQ-VAE 捕捉细粒度 pixel 细节, nhưng tạo ra Tokens 语义一致性较弱──
- 为语义优化(理解):SigLIP Embeddings 会把"cat" 图像聚到"cat" Tokens 附近,但无法支持良好重建──

Show-o và Transfusion do đó, một hướng nào đó đã trả giá chất lượng có thể nhìn thấy. Janus-Pro đặt ra câu hỏi: khi nhu cầu nhiệm vụ khác nhau, tại sao lại cần một Tokenizer?

## 概念
### 解视觉编码

Kiến trúc của Janus-Pro được chia thành hai Encoder:

- hiểu đường径──输入图像 → SigLIP-SO400m → 2 lớp MLP → Cơ thể biến thể──
- 生成路径──输入图像(如果基于已有图像进行调节)→ VQ Tokenizer → Token ID → Transformer body──
- 输出生成──Transformer 预测的图像代币 → VQ decoder → pixel──

Cơ thể biến thể là chung. Cơ thể lên và xuống đều là nhiệm vụ cụ thể.

输入 thông qua định dạng nhanh chóng 消除歧义:`<understand>`Tag  thông qua SigLIP 路由;`<generate>`通过VQ 路由──或路由也可以由任务隐式决定──

### Tại sao nó hiệu quả?

Sự mất trí  nhận được các tính năng SigLIP, trong khi CLIP kiểu trước đào tạo  đã được điều chỉnh để phù hợp với ngữ义相似性── mô hình của cảm nhận chuẩn 优于 Show-o / Transfusion, vì các tính năng nhập nhập hơn phù hợp với nhiệm vụ này──

生成损失 获得VQ Tokens,而 Tokenizer 已被调优为适合重建──图像质量优于 Show-o,因为VQ mã 能干净地组合回像素──

Cơ thể biến thể sẽ thấy hai loại phân phối nhập nhập (siglip và vq),并学习同时处理二者──其主张是:

### 数据扩展:Janus vs Janus-Pro

Janus(原始版,arXiv 2410.13848) giới thiệu hiểu, nhưng quy mô nhỏ hơn(1.3B param,数据有限) ・Janus-Pro(arXiv 2501.17811) đã mở rộng:

- 7B tham số (相对 1.3B)
- giai đoạn 1(sẵn sàng) sử dụng 90M cặp hình ảnh-môn văn bản,高于 72M。
- giai đoạn 2 (đồng nhất) sử dụng 72M,高于 26M。
- giai đoạn 3  tăng 200k mẫu hướng dẫn hình ảnh-gen。

Kết luận là:Janus-Pro-7B ở MMMU trên匹配 LLaVA(60.3 vs ~58), và trên GenEval trên vượt qua DALL-E 3(0.80 vs 0.67)。 một mô hình mở, ở cả hai bên của hệ thống谱系 đều có sức cạnh tranh。

### JanusFlow:thường chảy được chỉnh sửa 变体

JanusFlow(arXiv 2411.07975) sử dụng đường sinh sản chỉnh sửa (rectified-flow 生成路径(continuous) thay thế VQ 生成路径──拆分成 SigLIP-for-understanding + rectified-flow-for-generation──质量上限进一步提高──架构仍然是脱码器-shared-body──

### Công việc của cơ quan chung

Cơ quan biến thể xử lý các bộ phận, nhưng đối diện với hai loại phân phối nhập.

- Để hiểu: tiêu dùng Các tính năng SigLIP + Mã thông báo văn bản → 自回归地输出文本。
- 对生成:消费 văn bản Địa chỉ +(可选图像 VQ Tokens)→ 自回归地输出图像 VQ Tokens。

Không có trọng lượng cụ thể trong mỗi khối. Đó là một bộ chuyển đổi kiểu văn bản trong Qwen hoặc Llama.

Ý nghĩa là, cơ thể của Janus-Pro có thể được đào tạo từ LLM sơ khai.

### So với InternVL-U

InternVL-U (Lớp 12.10) là một phần của năm 2026:

- Tiền đào tạo đa phương thức bản địa (InternVL3)
- Đường dẫn mã hóa không kết nối ((SigLIP vào, VQ + phát tán đầu ra)。
- 统一理解 + 生成 + 编辑。

InternVL-U sẽ tiếp nhận các lựa chọn cấu trúc của Janus-Pro trong một khuôn khổ lớn hơn.

### Cấm

解 Encoder sẽ tăng sự phức tạp cấu trúc.  cần đào tạo hai Tokenizers, bảo vệ hai đường nhập, xử lý hai nhóm các chế độ thất bại.

Đối với các sản phẩm không cần hiểu,Janus-Pro 能力过剩, chọn Stable Diffusion 3 / Flux 模型即可──

Đối với cả hai sản phẩm cần thiết, Janus-Pro hiện là một tài liệu mở.


```figure
l5-janus-decouple
```

## Sử dụng nó
`code/main.py`模拟 Janus-Pro định tuyến:

- Hai mã hóa giả:SigLIP giống như( tạo ra 256-dim 语义 vectors) và VQ giống như( tạo ra mã số nguyên số)。
- Một router nhanh, theo thẻ nhiệm vụ  chọn Encoder。
- Một cơ quan chia sẻ (stand-in), bất kể Tokens 序列 bởi bất kỳ Encoder  tạo ra, đều được xử lý.
- Từ giai đoạn 1 (sự sắp xếp) đến giai đoạn 3 (sự sắp xếp hướng dẫn) của bảng xếp hạng mẫu 切换──

打印 3 ví dụ về các đường dẫn: hình ảnh QA、T2I、phác thảo hình ảnh。

## 交付 nó
本课会生成 `outputs/skill-decoupled-encoder-picker.md`❖ Đưa ra một mong muốn trong thời gian này đạt được một sản phẩm có chất lượng hàng xôi, nó sẽ chọn Janus-Pro、JanusFlow hoặc InternVL-U, và đưa ra các đề xuất quy mô dữ liệu cụ thể.

## 练习
1. Janus-Pro-7B trên GenEval 上 vượt qua DALL-E 3。 giải thích tại sao một mô hình 7B mở 模型能在生成上匹配边界 专有模型,但在理解上不能──

2. 实现 một chức năng router:给定 prompt text,将其分类为 `understand`Hoặc`generate`✿How do you handle "tập tắt và sau đó vẽ" kiểu như những lời nhắc nhở?

3. JanusFlow sử dụng dòng chảy chỉnh sửa thay thế VQ 路径。 Cơ thể biến đổi 现在输出什么?

4.  đề xuất Janus-Pro 架构 có thể thông qua thêm một giải pháp  Encoder 来处理的第四种任务──例:phần phân đoạn hình ảnh (DINO-style) 深度 (MiDaS-style) 

5. 阅读 Janus-Pro Phần 4.2 về nội dung mở rộng dữ liệu.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Decoupled encoding | "两个 visual encoders" | 每个方向使用单独的 Tokenizer 或 Encoder：理解使用语义向，生成使用重建向 |
| Shared body | "一个 Transformer" | 单个 Transformer 处理任一 Encoder 的输出；没有 modality-specific weights |
| SigLIP for understanding | "语义 features" | CLIP-family vision tower，提供丰富的概念 features，但重建较差 |
| VQ for generation | "重建 codes" | Vector-quantized Tokens，可以干净地 decode 回 pixels |
| JanusFlow | "Rectified-flow variant" | 使用 continuous flow-matching generation head 替代 VQ 的 Janus-Pro |
| Routing tag | "Task tag" | Prompt marker（`<understand>` / `<generate>`），用于选择输入 Encoder |

## 延伸阅读
- [Wu et al. — Janus (arXiv:2410.13848)](https://arxiv.org/abs/2410.13848)
- [Chen et al. — Janus-Pro (arXiv:2501.17811)](https://arxiv.org/abs/2501.17811)
- [Ma et al. — JanusFlow (arXiv:2411.07975)](https://arxiv.org/abs/2411.07975)
- [InternVL-U (arXiv:2603.09877)](https://arxiv.org/abs/2603.09877)
- [Dong et al. — DreamLLM (arXiv:2309.11499)](https://arxiv.org/abs/2309.11499)
