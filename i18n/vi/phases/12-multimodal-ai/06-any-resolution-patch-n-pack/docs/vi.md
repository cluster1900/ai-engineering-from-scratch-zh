# 任意分辨率 Vision: Patch-n'-Pack 和 NaFlex

> Trình thực không phải hình vuông 224x224 ⋅ Nhận thức là 9:16, hình ảnh là 16:9, chụp y tế có thể là 4096x4096, đoạn cắt điện thoại là 9:19.5⋅ Phản ứng của VLM trước năm 2024 ⋅ thay đổi kích thước tất cả nội dung thành hình vuông cố định ⋅ mất để OCR ⋅ hiểu tài liệu và phân tích khung cảnh độ phân giải thực sự có thể thực hiện tín hiệu. NaViT ⋅ Google,2023) cho thấy có thể sử dụng khối hình đệm sẽ có thể thay đổi độ phân giải các bản vá trong một lô biến số đơn ⋅ M-RoPE của Qwen2-VL ⋅2024) hoàn toàn loại bỏ bảng xếp hạng vị trí ⋅ LVA sẽ có thể làm cho hình ảnh độ phân giải cao của NextRes Resolution của các bản vá thành cơ sở + phụ hình ⋅ SigL 2 NaFlex ⋅ 2025) hiện đang mở các khía cạnh của VLM, được sử dụng để thực hiện bất kỳ kết quả kiểm tra kết nối nào.

**Type:** Build
**Languages:** Python (stdlib, patch packer + block-diagonal mask)
**Prerequisites:** Phase 12 · 01 (ViT patches), Phase 12 · 05 (LLaVA)
**Time:** ~120 minutes

## Học mục tiêu
- Đặt một loạt các bản vá trong hình ảnh phân giải biến đổi 打包成一个序列,并构建块角线注意口罩──
- 针对给定任务,在 AnyRes tiling (LLaVA-NeXT) 、NaFlex (SigLIP 2) và M-RoPE (Qwen2-VL) 做选择──
- Trong trường hợp không thay đổi kích thước, tính toán ngân sách token cho OCR, biểu đồ và ảnh.
- Nói ra ba chế độ thất bại của hình vuông: được squeezed văn bản, được cắt nội dung, đệm trên phí phí Token.

## 问题
Transformers  cần một chuỗi. Một loạt là một lắp dài giống nhau. Nếu hình ảnh của bạn là 224x224, mỗi lần bạn sẽ nhận được 196 bản vá.

现实不配合──文档是版(8.5x11 英寸,约 2:3)──图表截图是横版(16:9)──收据又高又窄(1:3)──医学影像通常是2048x2048或更大──移动设备截图是1170x2532(0.46:1)──

Ba lựa chọn trước năm 2024 và tại sao chúng sẽ thất bại:

1. Resize to fixed square shape ((224x224 hoặc 336x336) ⋅挤压会扭曲文本和人脸。下采样会破坏图表标签和OCR 内容。
2. Crop to fixed aspect ratio. Bạn sẽ mất phần lớn nội dung của hình ảnh, và chọn crop location là một vấn đề.
3. Pad đến dài nhất bên. Nó đã giải quyết được, nhưng đối với  bản hình ảnh, 50% hơn của các token sẽ lãng phí trên đệm.

2024-2025 答案:让变压器 吃下图像原生分辨率的补丁,并弄清楚如何将不同构成批量 打包成一个序列,同时避免浪费计算――

## 概念
### NaViT và patch-n'-pack

NaViT(Dehghani et al., 2023) là bằng chứng về phương pháp này có thể quy mô công việc.

1. Đối với mỗi bức ảnh trong lô, theo kích thước vá được chọn (ví dụ như 14) tính toán lưới vá nguyên sinh của nó.
2. Để các vết băm của mỗi bức ảnh phẳng thành chuỗi độ dài thay đổi của riêng mình.
3. Sẽ có một chuỗi dài của tất cả các bản vá hình ảnh kết nối.
4. Xây dựng mặt nạ chú ý khối hình dạng, để các bản vá của hình ảnh A chỉ có trong hình ảnh A  bên trong tham dự.
5. 携带每个补丁的位置信息(2D RoPE hoặc các vị trí nhúng phân tích)。

三张图像组成的批量:336x336(576 Token)、224x224(256 Token) và 448x336(768 Token), sẽ trở thành một chuỗi 1600 Token, kèm theo một khối hình dạng mặt nạ 1600x1600── không đệm── không phí tính toán──Thermal có thể xử lý bất kỳ tỷ lệ khía cạnh nào──

NaViT cũng trong quá trình đào tạo đã đưa ra các bộ đệm nhỏ giảm trong toàn bộ bộ bộ đệm trong khi tự nhiên bỏ rơi 50% các bộ đệm.

### AnyRes (LLaVA-NeXT)

AnyRes của LLaVA-NeXT là một ứng dụng thay thế thực tế.

1. Từ predefinition集合中选择一个格格布局(1x1)、(1x2)、(2x1)、(1x3)、(3x1)、(2x2) 等使其最匹配图像的 aspect ratio──
2. Cắt hình ảnh hoàn chỉnh vào lưới; mỗi mảng giấy biến thành một cây trồng 336x336
3. Đồng thời tạo một hình ảnh nhỏ:整张图像大小到336x336,作为全球语境代码.
4. Sẽ gửi vào mỗi tấm khoáng đóng băng 336 mã hóa 编码。 Concatenate tile Token + thumbnail Token。

Đối với một张 672x672 图像, sử dụng lưới 2x2 cộng với hình ảnh nhỏ: 4 * 576 + 576 = 2880 个 thị giác Token。 đắt tiền nhưng hiệu quảLLM Đồng thời xem phần phần và toàn phần trên phần dưới。

Khi mã hóa của bạn được đóng băng và chỉ hỗ trợ một loại phân giải,AnyRes là đường đầu tiên. Nó sẽ làm cho hình ảnh lớn của Token số nổ.

### M-RoPE (Qwen2-VL)

Qwen2-VL  đã giới thiệu Multimodal Rotary Position Embedding。 khác với các vị trí phân đoạn của NaViT hoặc các tấm và hình nhỏ của AnyRes, mỗi vá đều mang một vị trí 3D                                                                                                                                                                                                                                       

M-RoPE 原生提供动态分辨率,无需重新训练――Inference 时输入任意HxW 图像,patch embedder 生成H/14 x W/14 个代币,每个代币 获得自己的 (t=0, r=row, c=col) 位置,RoPE sử dụng đúng tần số quay 关注,完成──Qwen2.5-VL 和 Qwen3-VL 延续这一点──V2PE củaInternVL3 là giống nhau, chỉ theo chế độ sử dụng có thể được thay đổi kode──

Không giống với AnyRes, M-RoPE trong phân giải nguyên thủy là O(H x W / P^2) Token không có tile 带来的乘法开销. Không giống với NaViT, nó vẫn mong đợi mỗi lần tiếp tục chỉ xử lý một bức ảnh.

### NaFlex (SigLIP 2)

NaFlex là phương pháp kiểm tra nội bộ của SigLIP 2. Một mô hình trong suy luận  hỗ trợ nhiều thứ tự dài  256、729、1024 mã thông báo (Token)  bên trong trong trong thời gian tập luyện sử dụng các gói vá kiểu NaViT,并为 mỗi đệm  sử dụng các vị trí phân tích tuyệt đối  bán điểm là: một điểm kiểm tra, theo nhiệm vụ trong suy luận  chọn ngân sách mã thông báo

语义任务(luật tự phân loại, lấy lại) sử dụng 256 Token。OCR hoặc图表理解用 1024 Token。无需重新训练。

### Mặt nạ đóng gói

Mặt nạ khối hình dạng là nơi hầu hết các thực hiện dễ dàng xuất hiện sai lầm.`N_total`của chuỗi đóng gói, phủ hình ảnh `i=0..B-1`, riêng biệt dài hạn`n_i`, hình dạng`(N_total, N_total)`của mặt nạ `M`Trong hai chỉ dẫn đặt vào khối của cùng một bức ảnh 时为 1,否为 0. Bạn có thể xây dựng nó từ danh sách chiều dài tích lũy:

```
offsets = [0, n_0, n_0+n_1, ..., N_total]
M[i, j] = 1 iff there exists b where offsets[b] <= i < offsets[b+1] and offsets[b] <= j < offsets[b+1]
```

Trong PyTorch, nó có thể được sử dụng.`torch.block_diag`或显式集合 一行实现── FlashAttention 的变量长路径(`cu_seqlens`) hoàn toàn nhảy qua mặt nạ, trực tiếp sử dụng tensor chiều dài tích lũy trong các chuỗi  bên trong tham dự  đối với lô điển hình, so với mặt nạ dày đặc 快约 10x。

### Ngân sách token

按任务选择策略:

- OCR / tài liệu:1024-4096 Token。SigLIP 2 NaFlex tại 1024, hoặc AnyRes 3x3 + thumbnail。
- Hình ảnh và UI:384-448 原生分辨率下 729-1024 Token。使用带max pixel cap 的 Qwen2.5VL động độ phân giải。
- Hình ảnh tự nhiên: 256-576 Địa chỉ đã đủ rồi.
- Video: không gian tập hợp 后每 64-128 token,2-8 FPS──Lớp 12.17 会讲这个──

Quy tắc sản xuất năm 2026: chọn một nắp tối đa pixel mỗi nhiệm vụ, theo tỷ lệ độ phân tích nguyên sinh 编码 đến nắp này,打包批量,并跳过填充──Qwen2.5VL 曝光`min_pixels`和 `max_pixels`, chính là để sử dụng cho vòng quay này.


```figure
mm-patch-n-pack
```

## Sử dụng nó
`code/main.py`Để một loạt các hình ảnh khác nhau sử dụng các hình ảnh toàn bộ để thực hiện patch-n'-pack.

- 接收一个 (H, W) 图像尺寸列表
- 按补丁尺寸 14 计算每张图像的补丁序列长度──
- Đặt chúng thành một bộ dài.`sum(n_i)`của chuỗi.
- 构建 khối hình dạng chú ý mặt nạ
- So sánh chi phí đóng gói với kích thước vuông và bất kỳ tay nào.
- Để một loạt hỗn hợp (được in)

Số lượng xuất hiện giải thích tại sao mỗi VLM mở năm 2026 đều sử dụng gói vá n'-pack.

## 交付 nó
本课生成 `outputs/skill-resolution-budget-planner.md`△ Đặt một tỷ lệ tính cách hỗn hợp 工作负载(OCR, biểu đồ, hình ảnh, khung video) và tổng số tiền mã thông báo, nó sẽ chọn đúng chiến lược (((NaFlex,AnyRes,M-RoPE hoặc vuông cố định), và xuất ra theo yêu cầu cấu hình。 Khi bạn làm kích thước VLM trong sản phẩm 时 sử dụng kỹ năng này nó có thể tránh sự tĩnh lặng 10x mã thông báo 膨胀, nếu không nó sẽ giết chết ngân sách trễ ⋅

## 练习
1. Một张收据是600x1500(1:2.5)。 kích thước đệm 为 14 时, có bao nhiêu mã thông báo phân giải bản địa?

2. Để tạo ra một loạt hình ảnh có bốn bức hình, xây dựng mặt nạ hình dạng khối, độ dài của chúng là 256,576,729,1024.`256^2 + 576^2 + 729^2 + 1024^2`个非零条目──

3. Đối với một张 1792x896 图像, patch 14,比较:(a) kích thước vuông đến 336 后编码,(b) AnyRes 2x1 + hình ảnh nhỏ,(c) M-RoPE tại bản địa──哪种使用最少 Token?哪种保留最多细节?

4. 实现 fractional patch dropping: given determining a packed sequence,uniformly at random 丢弃 50% 的Token,并相应更新块-diagonal mask──测量 mask 的稀疏性 变化──

5. 阅读 Qwen2-VL 论文(arXiv:2409.12191) của Mục 3.2──用两句话描述 `min_pixels`和 `max_pixels`控制什么,以及为什么两个边界都重要.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Patch-n'-pack | "NaViT-style packing" | 将来自不同图像的可变长度 patch sequences concatenate 到一个 batch dimension 中 |
| Block-diagonal mask | "Packing mask" | Attention mask，将每张图像的 patches 限制为只 attend 自己，而不是 pack 中的相邻图像 |
| AnyRes | "LLaVA-NeXT tiling" | 将高分辨率图像切成固定大小 tiles 的 grid，并加一个全局 thumbnail；用固定 encoder 编码每个 tile |
| NaFlex | "SigLIP 2 native-flex" | 单个 SigLIP 2 checkpoint，可在 inference 时服务 256/729/1024-Token budgets，无需重新训练 |
| M-RoPE | "Multimodal RoPE" | 3D rotary position encoding（time、row、column），无需 position tables 即可处理任意 H、W、T |
| cu_seqlens | "FlashAttention packing" | FlashAttention varlen path 使用的 cumulative-length tensor，用来替代 dense block-diagonal mask |
| min_pixels / max_pixels | "Resolution bounds" | Qwen2.5-VL 的 per-request knobs，用于限制非常小或非常大输入上的 Token count |
| Visual token budget | "How many tokens per image" | 每张图像发出的 patch Token 粗略数量；决定 LLM 的 prompt budget 和 Attention cost |

## 延伸阅读
- [Dehghani et al. — Patch n' Pack: NaViT (arXiv:2307.06304)](https://arxiv.org/abs/2307.06304)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Laurençon et al. — What matters when building vision-language models? (Idefics2, arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
