# Từ CLIP đến BLIP-2  Q-Former  như cầu Modality

> CLIP đối với hình ảnh và văn bản, nhưng không thể tạo bản ghi chú, trả lời câu hỏi hoặc tiến hành cuộc trò chuyện. BLIP-2 (Salesforce, 2023) sử dụng một cây cầu có thể đào tạo nhỏ để giải quyết vấn đề này. 32 个学习可查询 Vector 通过横向关注 结结 ViT的功能,然后直接插入结冰LLM的输入流. 188M 参数的桥接将一个11B LLM 连接到 ViT-g/14──直到2026年,每个基于适配器的VLM  MiniGPT-4──Instruct LIPIP、LLaVA 的近亲 都是它的后代. 本课阅读Q-Former的结构,解释它的两个阶段玩具训练,并输建一个版本,把Token 视觉解码器进入结冰文中.

**Type:** Build
**Languages:** Python (stdlib, cross-attention + learnable-query demo)
**前置要求:**Giai đoạn 12 · 02 (CLIP), Giai đoạn 7 (Các máy biến đổi)
**Time:** ~180 minutes

## Học mục tiêu
- 解释 tại sao đặt một chai có thể đào tạo giữa bộ mã hóa thị giác đóng băng và LLM đóng băng, tốt hơn cả việc chỉnh sửa hoàn chỉnh từ đầu đến cuối, về chi phí và độ ổn định.
- 实现一个跨重视区块, trong đó một nhóm các truy vấn học tập được xác định 关注外部图像特征──
- 走读 BLIP-2 的两阶段预训练: đại diện (ITC + ITM + ITG), sau đó tạo ra( Sử dụng decoder đông lạnh của mất LM)。
- Để so sánh Q-Former với máy chiếu MLP đơn giản hơn trong LLaVA,并论证各自何时更占优──

## 问题
Bạn có một ViT đóng băng, nó tạo ra 256 个 图像 补丁符号 1408 图像. Bạn có một 7B LLM đóng băng, nó mong đợi 4096 图像 嵌入式.

Vấn đề của BLIP-2 là: liệu có thể làm cho đại diện hình ảnh 256 token  bị nén thành ít hơn nhiều token (ví dụ như 32), đồng thời giữ lại đủ thông tin, để LLM có thể tạo ra tiêu đề hình ảnh, trả lời câu hỏi và đưa ra suy luận?

答案是:Q-Former──32 个可学习的"query" vector, đối với ViT của patch Token làm tham dự chéo, tạo ra một 32-Token của video摘要供 LLM sử dụng──总计 188M 参数──在接触 LLM 之前,先用对比性、匹配和生成性目标 训练──

## 概念
### Các câu hỏi có thể học được

Kỹ năng cốt lõi của Q-Former: không để LLM của văn bản Đèn để chú ý đến các bản vá hình ảnh, mà là giới thiệu một nhóm mới 32  thể học truy vấn Vector `Q`,并让*它们*关注图像补丁──这些查询是模型参数它们在训练期间学习,并且同一组 32查询用于每张图像──

Sau khi qua sự chú ý chéo, mỗi truy vấn  nắm giữ một bản tóm tắt hình ảnh   mô tả các đối tượng chính   mô tả bối cảnh    số đối tượng  như vậy. Các truy vấn không phải là chữ viết chuyên về các nhãn ngữ nghĩa; chúng sẽ học bất cứ điều gì có thể làm cho mất mát dòng chảy xuống dưới.

### Kiến trúc

Q-Former là một bộ biến đổi nhỏ ((12 tầng, khoảng 100M params), có hai đường:

1. Query path:32 个 query Vector 流经自注意(彼此), sau đó đối với băng giá ViT của thẻ dán làm sự chú ý chéo, cuối cùng qua FFN。
2. Hướng văn bản: một giống như BERT của mã hóa văn bản với đường truy vấn 共享自我注意 和 FFN weights──text path 禁用横断注意──

训练时两条路径都会运行──查询 和文本通过共享自我关注 交互,这意味着在需要文本的任务中(ITM、ITG) trong các câu hỏi có thể được điều kiện bằng văn bản──VLM 交互的推断阶段,只让问题流过,产生32 视觉代币──

### Việc đào tạo hai giai đoạn

BLIP-2 分两阶段预训练:

Giai đoạn 1: học đại diện không LLM:
- ITC (phần phản đối hình ảnh- văn bản):Tương phản CLIP,作用于 pooled query Token 和 text CLS Token。
- ITM (phản ứng hình ảnh-t văn bản): phân loại nhị phân  这对图像-text 是否匹配? sử dụng cứng âm-đài mỏ。
- ITG (phản xuất văn bản dựa trên hình ảnh): đầu LM nguyên nhân trên văn bản,以查询 为条件――迫使查询 编码可由文本生成的内容――

Chỉ tập Q-Former。ViT là đóng băng。 không có LLM  tham gia。

Giai đoạn 2: Học sinh thế hệ.  Nhập vào một LLM đóng băng (OPT-2.7B hoặc Flan-T5-XL)  Thông qua một lớp tuyến tính nhỏ sẽ đưa ra 32 truy vấn 输出投影到 LLM của Embedding dim──把它们前置到文本 prompt── chỉ trong拼接后的 prompt + image + caption 序列 LM loss 训练线性投影 和 Q-Former──

Giai đoạn 2 之后,Q-Former + chiếu chính là một bộ chuyển đổi hình ảnh hoàn chỉnh.

### Kinh tế tham số

BLIP-2 使用 ViT-g/14(1.1B, đông lạnh) + OPT-6.7B(6.7B, đông lạnh) + Q-Former(188M, được đào tạo) = 总计 8B, đào tạo 188M。Q-Former 本身约为完整堆积 参数的 2.4%──训练成本也体现这一点:少量 A100 上训数天,而不是结尾训数周──

质量:BLIP-2 在零射VQA 上达到或超过Flamingo-80B,同时体量小 50倍──这个桥接有效──

### Báo cáo BLIP và chỉ thị cảm nhận kiểu Q-Former

InstructBLIP (2023) sử dụng một额外输入扩展了 Q-Former:instruction text 本身──在交叉注意时,查询 现在可以访问图像补丁和指示──查询可以根据说明 专门化("计车"、"描述情绪"),而不是学习单个固定摘要──在完成任务上基准 提升──

### MiniGPT-4 với phương pháp chỉ chiếu

MiniGPT-4 đã giữ lại Q-Former, nhưng chỉ tập để phát ra dự đoán tuyến tính, đồng thời kết thúc tất cả các phần khác.

### Tại sao LLaVA trở nên đơn giản hơn

LLaVA(2023,Lớp 12.05) thay thế bằng MLP 2 tầng thông thường, sẽ thay thế Q-Former, sẽ mỗi ViT Patch Token 投投投到LLM 空间  đối với 24x24 网格, mỗi张图像 576 个 Token,全部输入LLM──压缩更差, nhưng để LLM 能关注原始补丁──当时这是有争议; đến cuối năm 2023 nó trở nên chủ yếu, vì dữ liệu hướng dẫn trực quan(LLaVA-Instruct-150k) chứng minh MLP có thể đào tạo để giữ đủ tín hiệu──舍是:LLaVA lấy bối cảnh 填充快得多,但它可以自然扩展到多图片和视频──

Đến năm 2026, các lĩnh vực sẽ xuất hiện phân khúc: Q-Former trong ngân sách token  giữ lại trong các hiện trường quan trọng; MLP dự án chiếm ưu thế trong các hiện trường ưu tiên hàng Token nguyên thủy.

### Phong trào liên tục: Flamingo, tổ tiên này

Flamingo (Lớp 12.04) trước BLIP-2, đã sử dụng sự chú ý chéo tương tự như vậy, nhưng nó xảy ra trên mỗi lớp LLM đóng băng, thay vì như một cầu riêng. BLIP-2 cho thấy bạn chỉ có thể nén lên lớp đầu vào, vẫn còn hiệu quả.

### Những người kế thừa năm 2026

- Q-Từ:BLIP-2、InstructBLIP、MiniGPT-4, cũng như phần lớn các ví dụ về ngân sách Token 原因的视频语言模型──
- Các hình ảnh của người nhận thức:Flamingo 的变体(Dạy 12.04);Idefics gia đình  Eagle、OmniMAE。
- Máy chiếu MLP:LLaVA、LLaVA-Next、LLaVA-OneVision、Cambrian-1。
- Đội ngũ chú ý: VILA、PaliGemma。

Các vấn đề quyết định là bạn bị giới hạn trong ngân sách token, hoặc bị giới hạn trong chất lượng mỗi token.


```figure
modality-projection
```

## Sử dụng nó
`code/main.py` xây dựng một sự chú ý qua nhau theo kiểu Q-Former:

1. 模拟 256 个 hình ảnh patch Token(dim 128)。
2. 实例化 32 个 hỏi học được
3. 运行 quy mô điểm sản phẩm sự chú ý chéo ((Q đến từ các truy vấn, K / V đến từ các bản vá)
4. 通过线性层 投影到 LLM-dim ((512) ⋅
5. 输出 32 个 LLM sẵn sàng thị giác Token。

Tất cả các toán học đều sử dụng Python tinh khiết (xác đối với Vector sử dụng vòng tròn tổ) ✿ Tuy nhiên hình dạng chính xác── sẽ in Matrix trọng lượng chú ý, để bạn có thể xem mỗi truy vấn từ những đệm 拉取信息──

## 交付 nó
本课生成 `outputs/skill-modality-bridge-picker.md` Đưa ra một mục tiêu VLM 配置(định dạng hóa hình ảnh Đèn số ✓ LLM context budget、部署约束、质量目标), nó sẽ đề xuất Q-Former vs MLP vs Perceiver resampler,并 cung cấp lý do ngắn gọn và ước tính số lượng của mỗi cây cầu.

## 练习
1. Sử dụng PyTorch 实现 cross-attention block──验证在 32 个查询 和 256 个键/值 下, Attention-weight Matrix là 32 x 256,并且软max 后每一行求和为 1──

2. Trong giai đoạn 1 của BLIP-2, Q-Former cùng lúc vận hành 3 loại lỗ hổng: ITC、ITM、ITG── sử dụng mã giả sử  viết ra mỗi loại chữ ký phía trước―.

3. So sánh số lượng:Q-Former(12 tầng,768 ẩn) vs máy chiếu MLP 2 tầng(1408 → 4096, hai tầng)  Trong số nhiều quy mô lớn LLM trên,188M Q-Former của chi phí sẽ thông qua đào tạo hiệu quả nhận lại?

4. 阅读 BLIP-2 bài báo(arXiv:2301.12597) Phần 3.2, hiểu Q-Former 如何初始化──解释为什么从BERT-base初始化(而不是随机初始化) 会加速收──

5. Đối với một 10 分钟视频,以 1 FPS 采样到 60 ,计算每 Token 成本:(Q-Former → 32 token/frame) vs (MLP projector → 576 token/frame) ――哪一个能放进 128k-Token LLM context window?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Q-Former | "Querying transformer" | 带有 32 个可学习 query Vector 的小型 transformer，对 frozen ViT features 做 cross-attend |
| Learnable queries | "Soft prompt for vision" | 一组固定参数，作为 cross-attention 的 query 侧；按模型学习，在所有输入之间共享 |
| Cross-attention | "Q from here, K/V from there" | query、key、value 来自不同来源的 Attention；queries 从 ViT patches 拉取信息的方式 |
| ITC | "Image-text contrastive" | 应用于 Q-Former pooled queries vs text CLS 的 CLIP-style loss |
| ITM | "Image-text matching" | 在 hard-negative-mined pairs 上的 binary classifier；迫使 queries 区分细粒度不匹配 |
| ITG | "Image-grounded text generation" | 文本以 queries 为条件生成时的 causal LM loss；迫使 queries 编码 text-decodable content |
| Two-stage pretraining | "Representation then generative" | Stage 1 单独训练 Q-Former（ITC/ITM/ITG）；Stage 2 接入 frozen LLM，并且只训练 projection + Q-Former |
| Frozen backbone | "Do not finetune" | vision encoder 和 LLM weights 固定；只训练 bridge |
| Projection head | "Linear to LLM dim" | 将 Q-Former 输出映射到 LLM Embedding dimension 的最终 linear layer |
| Perceiver resampler | "Flamingo's version" | 类似的 learnable-query cross-attention，由 Flamingo 在每一层使用，而不是作为单个 bridge |

## 延伸阅读
- [Li et al. — BLIP-2 (arXiv:2301.12597)](https://arxiv.org/abs/2301.12597) 核心文件──
- [Li et al. — BLIP (arXiv:2201.12086)](https://arxiv.org/abs/2201.12086) 使用 ITC/ITM/ITG 三件套的前身──
- [Li et al. — ALBEF (arXiv:2107.07651)](https://arxiv.org/abs/2107.07651) "định hướng trước khi hợp nhất"  giai đoạn 1 đào tạo concept ancestor。
- [Dai et al. — InstructBLIP (arXiv:2305.06500)](https://arxiv.org/abs/2305.06500) hướng dẫn-thông thức Q-Former。
- [Zhu et al. — MiniGPT-4 (arXiv:2304.10592)](https://arxiv.org/abs/2304.10592)  chỉ là phương pháp của máy chiếu
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795) kiến trúc chung của sự quan tâm chéo-phát học-phát tra.
