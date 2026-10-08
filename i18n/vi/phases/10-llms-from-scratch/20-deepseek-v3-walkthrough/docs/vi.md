# DeepSeek-V3 架构讲解

> Giai đoạn 10 · Bài học 14 đặt tên cho mỗi mô hình mở đều sẽ điều chỉnh sáu cấu trúc quay──DeepSeek-V3(12月, 2024 năm, tổng số 671B, hoạt động số 37B) điều chỉnh tất cả sáu quay,并额外加入四项:Multi-Head Latent Attention、无辅助负载均衡、Multi-Token Prediction,以及DualPipe training──本课会从上下阅读DeepSeek-V3的架构,并根据发布配置已推推出每参数──毕竟,你将能够学会解释为什么671B/37B 这个是正确的押注,以及为什么MLA + MoE 组合在前沿模型中单独占用比例.

**类型：**Học tập
**语言：**Python(stdlib,参数计算器)
**先修要求：**Giai đoạn 10 · 14(开放模型讲解) 、Giai đoạn 10 · 17(NSA) 、Giai đoạn 10 · 18(MTP) 、Giai đoạn 10 · 19(DualPipe)
**时间：**约75分钟

## Học mục tiêu

- Từ trên xuống đọc DeepSeek-V3 cấu hình, và sử dụng sáu GPT-2 旋加四 DeepSeek đặc biệt có thêm các mục mới để giải thích mỗi phần.
- 推导总参数 ((671B) 、活跃参数 ((37B), cũng như các thành phần riêng rẽ của nó.
- 计算 128k context 下 MLA's KV cache 占用,并与一个活跃参数相同、使用 GQA's dense model 需要付出代价进行比较──
- Nói về bốn mục DeepSeek đặc biệt có sáng tạo ((MLA、MTP、 phụ trợ không mất mát tuyến đường、DualPipe), và chỉ ra từng phần của cấu trúc hoặc tập hợp tập luyện.

## 问题

DeepSeek-V3 là cấu trúc đầu tiên trên cơ cấu với Llama Family có sự khác biệt thực chất trong mô hình mở rộng. Llama 3 405B là một cấu trúc điều chỉnh 6 vòng GPT-2🏼 DeepSeek-V3 là GPT-2 cộng với tất cả 6 vòng, thêm vào 4 vòng.

Học được lợi ích của nó là: DeepSeek-V3 mở cân nặng  phát hành đã thay đổi mô hình mở capacity frontier s ý nghĩa.

## 核心概念

### Không thay đổi tâm, xem lại một lần nữa

DeepSeek-V3 vẫn là tự lập. Nó vẫn còn tích hợp các khối decoder. Mỗi khối vẫn còn chứa Attention, MLP, RMSNorm.

### 转折:用 MLA 取代 GQA

Từ giai đoạn 10 · 14 Bạn đã biết, GQA  thông qua để nhiều nhóm đầu Q chia sẻ K 和 V để làm giảm cache KV.`kv_lora_rank`), sau đó trong tính toán thời gian theo đầu 解压;; KV cache chỉ lưu trữ ẩn, thường là mỗi token Mỗi lớp 512 个浮点数, thay vì 8 x 128 = 1024 个浮点数。

Trong bối cảnh 128k, sử dụng MLA của DeepSeek-V3( mỗi token Mỗi lớp một chia sẻ ẩn `c^{KV}`;K và V đều thông qua lên chiếu từ 派生 này ẩn, trong khi những lên chiếu có thể hấp thụ vào các tiếp theo:

```
kv_cache = num_layers * kv_lora_rank * max_seq_len * bytes_per_element
         = 61 * 512 * 131072 * 2
         = 7.6 GB
```

Một giả định của GQA 基线(Llama 3 70B 形,8 đầu KV, đầu dim 128) cần:

```
kv_cache = 2 * 61 * 8 * 128 * 131072 * 2
         = 30.5 GB
```

Trong bối cảnh 128k, MLA hơn Llama-3-70B 风格 GQA cache 小 4 倍.

权衡是:MLA 在每次注意 计算时增加一步按头的解压;;额外计算量相对于省省的带宽很小;;对长背景 推理说,净收益为正;;

### Đường hướng:Tương đương tải trọng không mất phụ trợ

Các router MoE quyết định mỗi token bởi những chuyên gia hàng đầu xử lý. Router đơn giản sẽ tập trung quá nhiều công việc vào một số chuyên gia nhỏ, dẫn đến các chuyên gia khác đặt.

DeepSeek-V3  giới thiệu một loại giải pháp hỗ trợ không mất mát  Đưa các logit router Ứng dụng bias của chuyên gia, và trong quá trình đào tạo sử dụng một quy tắc đơn giản: nếu chuyên gia `e`过载,就降低 `bias_e`Nếu tải không đủ, hãy nâng cao nó. Không thêm thêm thêm Loss 项.

Ảnh hưởng của Loss đối với chính: không thể đo lường.

### MTP: Căn luyện tập tập trung hơn + 免费草案

Từ giai đoạn 10 · 18 Bạn đã biết, DeepSeek-V3 đã tăng mô-đun MTP của D=1, được sử dụng để dự đoán hai vị trí sau đó. Trong quá trình suy nghĩ, mô-đun được đào tạo tốt được sử dụng lại như một dự thảo giải mã phỏng đoán, chấp nhận hơn 80%. Trong quá trình đào tạo, mỗi trạng thái ẩn bị giám sát bởi D+1 = 2 mục tiêu, cung cấp tín hiệu sâu sắc hơn.

参数: trong 671B tăng trên 之 14B                                                                                                                                                                                                                                                        

### 训练: DualPipe

Từ giai đoạn 10 · 19 Bạn đã biết, DualPipe là một loại đường ống dẫn hai chiều, sẽ đi về phía trước và trở lại các đoạn với các nút giao tiếp tất cả mọi thứ. Trong quy mô 2.048-H800 của DeepSeek-V3, nó khoảng bắt lại 1F1B nguyên thủy bởi bong bóng đường ống mất 245k giờ GPU.

### Config,逐字段解析

下面是 DeepSeek-V3 config (đơn giản):

```
hidden_size: 7168
intermediate_size: 18432   (dense MLP hidden size, used on first few layers)
moe_intermediate_size: 2048 (expert MLP hidden size)
num_hidden_layers: 61
first_k_dense_layers: 3    (first 3 layers use dense MLP)
num_attention_heads: 128
num_key_value_heads: 128   (formally equal to num_heads under MLA, but
                           the real compression is in kv_lora_rank)
kv_lora_rank: 512          (MLA latent dimension)
num_experts: 256            (MoE expert count per block)
num_experts_per_tok: 8      (top-8 routing)
shared_experts: 1           (always-on shared expert per block)
max_position_embeddings: 163840
rope_theta: 10000.0
vocab_size: 129280
mtp_module: 1               (1 MTP module at depth 1)
```

解析如下:

- `hidden_size=7168`: Đêm 维度。
- `num_hidden_layers=61`- Đường sâu.
- `first_k_dense_layers=3`:前 3 个块 使用大小为 18432 的密集 MLP──其余 58 个使用 MoE──
- `num_attention_heads=128`- Thì?
- `kv_lora_rank=512`K và V được nén xuống ở chiều ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm ầm 
- `num_experts=256, num_experts_per_tok=8`Mỗi khối MoE có 256 chuyên gia, sử dụng các tuyến đường 8 hàng đầu.
- `shared_experts=1`Ngoài 256 chuyên gia hướng dẫn, còn có 1 chuyên gia luôn luôn trên sẽ đóng góp cho mỗi token 输出.
- `moe_intermediate_size=2048`Mỗi chuyên gia MLP có kích thước ẩn. Nó lớn hơn MLP dày đặc.

### 参数核算

完整计算在 `code/main.py`中──核心结论:

- Đêm:`vocab * hidden = 129280 * 7168 = ~0.93B`
- 前 3 个 khối dày đặc:带 MLA 的注意( mỗi khối 约 144M) + khối dày đặc MLP( mỗi khối 约 260M) + tiêu chuẩn。 tổng计约 1.2B。
- 58 khối ME:带 MLA 关注(约144M) + 256 专家(每约30M) + 1 专家共享(30M) + chuẩn mực;;按包含所有专家 计算,每块 总计约7.95B──58 专家 总计 461B──
- MTP Module:14B:

Tổng số: kiến trúc cốt lõi 约 476B + 14B MTP; và đã được phát hành 671B 数字还会单独计入额外结构参数(bias tensors、专家特定组件、共享专家规模等) ⋅ Chúng tôi trong máy tính tính có sự khác biệt giữa số và giá trị đã được phát hành trong khoảng 3-5% trong, sự khác biệt từ báo cáo DeepSeek  Phần 2 phụ lục trong ghi chép phân tích hạt nhân核算──

Mỗi lần tiến lên của hoạt động:

- Lưu ý: mỗi lớp 144M * 61 = 8.8B
- MLP hoạt động:前 3 层密集(3 * 260M = 780M),58 个 MoE layer 中每层激活 8 个路由 + 1 个共享 +路由上海费――每层活跃 MLP 约 260M──总计:3 * 260M + 58 * 260M = ~15.9B──
- Đáp nhập + chuẩn mực:1.2B。
- 总活跃: khoảng 26B core + 14B MTP(trenage时使用,但推理时不总是运行)≈ 37B。

### 671B / 37B Ví dụ

18 lần tỷ lệ hiếm nhỏ (tỷ lệ hoạt động là 5,5%)  DeepSeek-V3 là tỷ lệ hoạt động hiếm nhất của các mô hình MoE  Mixtral 8x7B là 13/47  28%, nên dày đặc hơn  Llama 4 Maverick là 17B/400B (tỷ lệ 4,25%), tương đương với nó  DeepSeek đặt cược là:

### DeepSeek-V3 vị trí

| 模型 | 总参数 | 活跃参数 | 比例 | Attention | 新想法 |
|-------|------|-------|-------|-----------|-------------|
| Llama 3 70B | 70B | 70B | 100% | GQA 64/8 | — |
| Llama 4 Maverick | 400B | 17B | 4.25% | GQA | — |
| Mixtral 8x22B | 141B | 39B | 27% | GQA | — |
| DeepSeek V3 | 671B | 37B | 5.5% | MLA 512 | MLA + MTP + aux-free + DualPipe |
| Qwen 2.5 72B | 72B | 72B | 100% | GQA 64/8 | YaRN 扩展 |

### 后续:R1、V4

DeepSeek-R1(2025) là một lần chạy trên xương sống V3 để thực hiện việc đào tạo lý luận. R1 sử dụng cùng cấu trúc.

DeepSeek-V4 (Nếu phát hành) dự kiến sẽ giữ lại MLA + MoE + MTP,并 gia nhập DSA (DepSeek Sparse Attention), cũng là giai đoạn 10 · 17 trong NSA.


```figure
moe-routing
```

## Sử dụng nó

`code/main.py`Đây là một thiết bị tính toán số liệu có hình dạng DeepSeek-V3 ⋅ chạy nó, sẽ xuất ra để so sánh với số trong bài luận, và sử dụng nó để thử nghiệm giả định biến thể.

需要关注:

- 总参数对已发布的671B──
- 活跃参数与已发布的37B──
- Khung cảnh 128k 下的 KV cache,也就是 MLA vs GQA 的比较──
- Lớp của phân giải, để quan sát các yếu tố ngân sách thực tế phát triển ở đâu.

## 交付 nó

本课会生成 `outputs/skill-deepseek-v3-reader.md` Đưa ra một mô hình gia đình DeepSeek (V3、R1, hoặc bất kỳ biến thể nào trong tương lai), nó sẽ tạo ra một kết quả kiến trúc từng thành phần, đặt tên cho mỗi phần cấu hình, theo số lượng các thành phần, và xác định mô hình sử dụng bốn mô hình DeepSeek đặc biệt có những sáng tạo nào.

## 练习

1. 运行 `code/main.py` Báo cáo Phần 2 có phân đoạn hoàn chỉnh.

2.  sửa đổi cấu hình, sẽ xếp hạng MLA từ 512  đổi thành 256 ⋅ tính 128k ngữ cảnh 下得到的 KV缓存大小──它带来多少百分比的下降?

3. So sánh DeepSeek-V3 của(256 chuyên gia, top-8) hướng đi với một giả thuyết của(512 chuyên gia, top-8) biến thể。 tổng số tham số tăng; active parameter giữ không thay đổi。 Về lý thuyết, thêm chuyên gia 容量带来 lợi ích gì?

4. 阅读 DeepSeek-V3 báo cáo kỹ thuật ((arXiv:2412.19437) Phần 2.1 关于MLA内容──用三句话解释为什么 K 和 V 的解压矩阵可以在推理效率上被吸收到后续 matmul中──

5. DeepSeek-V3 đối với hầu hết các hoạt động sử dụng đào tạo FP8 ⋅ tính toán sử dụng FP8 vs BF16  lưu trữ 671B trọng lượng ⋅ nó có liên quan gì đến ngân sách đào tạo mã hóa 14.8T?

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| MLA | “Multi-Head Latent Attention” | 将 K 和 V 压缩到共享低秩 latent（kv_lora_rank，通常为 512），并按 head on-the-fly 解压；KV cache 只存储 latent |
| kv_lora_rank | “MLA compression dim” | K 和 V 共享 latent 的大小；DeepSeek-V3 使用 512 |
| First k dense layers | “早期 layers 保持 dense” | 前几个 MoE-model layers 跳过 MoE router，并运行 dense MLP 以提高稳定性 |
| num_experts_per_tok | “Top-k routing” | 每个 token 会触发多少个 routed experts；DeepSeek-V3 使用 8 |
| Shared experts | “Always-on experts” | 无论 routing 如何都会处理每个 token 的 experts；DeepSeek-V3 使用 1 |
| Auxiliary-loss-free routing | “Bias-adjusted load balance” | 在训练期间调整按 expert 的 bias 项，以在不添加 Loss 项的情况下保持 expert 负载均衡 |
| MTP module | “额外 prediction head” | 从 h^(1) 和 E(t+1) 预测 t+2 的 Transformer block；更密集训练，免费的 speculative-decoding draft |
| DualPipe | “Bidirectional pipeline” | 将 forward/backward 计算与跨节点 all-to-all 重叠的 training schedule |
| Active parameter ratio | “Sparsity” | active_params / total_params；DeepSeek-V3 达到 5.5% |
| FP8 training | “8-bit training” | 使用 FP8 存储训练数据，并在许多 compute ops 中使用 FP8；相比 BF16 大约内存减半，质量代价很小 |

## 延伸阅读

- [DeepSeek-AI — DeepSeek-V3 Technical Report（arXiv:2412.19437）](https://arxiv.org/abs/2412.19437)  完整的架构、训练与结果文档
- [Hugging Face 上的 DeepSeek-V3 model card](https://huggingface.co/deepseek-ai/DeepSeek-V3) config 文件与部署说明
- [DeepSeek-V2 paper（arXiv:2405.04434）](https://arxiv.org/abs/2405.04434) 引入 MLA's前身模型
- [DeepSeek-R1 paper（arXiv:2501.12948）](https://arxiv.org/abs/2501.12948) 基于 V3 架构的推理培训 后继模型
- [Native Sparse Attention（arXiv:2502.11089）](https://arxiv.org/abs/2502.11089) DeepSeek-family Attention 的未来方向
- [DualPipe repository](https://github.com/deepseek-ai/DualPipe) Khán giả về lịch trình đào tạo
