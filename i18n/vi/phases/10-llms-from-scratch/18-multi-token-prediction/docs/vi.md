# Dự đoán đa token (MTP)

> Từ GPT-2 đến Llama 3, mỗi tự quay trở lại LLM ở mỗi vị trí đều dựa trên một lỗ  luyện tập: dự đoán tiếp theo Token。DeepSeek-V3 ở mỗi vị trí tăng một lỗ thứ hai: dự đoán lại sau đó Token。 thêm 14B 参数( trên mô hình 671B) thông qua dòng chảy Gradient được蒸回主模型, trong khi các đầu MTP được đào tạo tốt được sử dụng lại trong các bản thảo giải mã phỏng đoán, tỷ lệ chấp nhận vượt quá 80%。1.8× sinh lượng 吞吐量 gần như miễn phí.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 10 · 04（预训练 mini GPT）、Phase 10 · 15（speculative decoding）
**Time:** ~60 分钟

## Học mục tiêu

- Nói rõ MTP  tập luyện mục tiêu,并推导 khác nhau dự đoán độ sâu 上的关节损失──
- 解释 Gloeckle et al. của các đầu MTP song song 2024) và các mô-đun MTP theo trình của DeepSeek-V3, cũng như vì sao chuỗi 设计能保留 nguyên nhân chuỗi.
- 计算在预训运行中加入MTP模块的参数和内存开销──
- Từ zero thực hiện một mô-đun MTP:đồng phần nhúng,đối đa độ khối biến đổi,đối chiếu và đầu đầu ra chung.

## 问题

Dự đoán token tiếp theo là mục tiêu đào tạo LLM tiêu chuẩn. Mỗi trạng thái ẩn được giám sát để dự đoán một điều duy nhất:紧随其后的Token. Đây là một tín hiệu yếu kém đáng kinh ngạc. Phần lớn thông tin trong chuỗi được mở rộng ra ngoài một token.

MTP đặt ra một câu hỏi là: Nếu mỗi trạng thái ẩn được giám sát để một lần dự đoán nhiều Token tương lai 会怎样?Gloeckle et al. (Meta, 2024) chứng minh điều này có ích. Việc thực hiện của chúng là đặt một số đầu đầu đầu ra độc lập trên xương sống, mỗi đầu dự đoán các sự bù đắp khác nhau.

DeepSeek-V3 (Mỹ) sẽ thiết kế MTP 重新为序列模块, trong mỗi độ sâu dự đoán 上保留因果链――模型从 `h_i^(0)`预测 `t+1`Và sau đó từ trạng thái ẩn mới.`h_i^(1)`预测 `t+2`, và `h_i^(1)`结合了 `h_i^(0)`和 `E(t+1)`Đáp nhập, theo loại đề xuất này. Mỗi chiều sâu đều có khối biến thể nhỏ riêng. Đáp nhập chia sẻ và đầu đầu sản xuất chia sẻ  để các tham số mở bán ở mức trung bình.

本课会从零构建单个MTP模块和D-depth loss──数学很整洁──实现约150 行──

## 核心概念

### MTP theo trình độ 配方

DeepSeek-V3 trên mô hình chính`D`个 MTP mô-đun。 mỗi mô-đun `k`(từ đó `k = 1..D`)预测 độ sâu `k`Địa chỉ, cũng là trong định vị.`i`时预测 `t_{i+k}`

Module `k`包含:

- Một khối biến thể`T_k`, có sự chú ý của riêng mình và MLP
- Một matrix chiếu`M_k`, sẽ kết hợp với trạng thái ẩn sâu của một nền tảng thực tại của một nền tảng sâu 
- chia sẻ nhúng `E`(与主模型相同)
- đầu đầu ra chung `Out`(与主模型相同)

 tập luyện, đối với vị trí `i`Đề xuất của, theo độ sâu ẩn trạng thái 为:

```
h_i^(0) = main model backbone at position i
h_i^(k) = T_k( M_k * concat(RMSNorm(h_i^(k-1)), RMSNorm(E(t_{i+k}))) )   for k >= 1
```

dự đoán sâu 为:

```
logits_{i+k} = Out(h_i^(k-1))   for k = 1..D
```

Sự mất mát sâu sắc là đối với sự thật cơ bản.`t_{i+k}`của sự thâm nhập chéo:

```
L_k = CE(logits_{i+k}, t_{i+k})
```

跨 độ sâu của mất khớp:

```
L_MTP = (lambda / D) * sum_{k=1..D} L_k
```

`lambda`là một yếu tố trọng lượng nhỏ hơn, DeepSeek-V3 trong tập luyện trước 10% sử dụng 0.3, sau đó sử dụng 0.1── tổng việc tập luyện mất`L_main + L_MTP`

### Tại sao là liên tục, chứ không phải song song

Gloeckle ban đầu của song song MTP có D  đầu đầu ra, mỗi ứng dụng trực tiếp đến `h_i^(0)`Mỗi đầu đều ở trong cùng một trạng thái ẩn của xương sống.`t_{i+k}`n có thể tập luyện bình thường, nhưng những dự đoán này không được điều kiện lẫn nhau.`head_1`    `head_2`, những cái đầu này là những cái đầu của các con.

DeepSeek-V3  thiết kế theo trình tự từ `h_i^(k-1)`加上 thực tế next-token nhúng `E(t_{i+k})` xây dựng `h_i^(k)`Điều này giữ lại chuỗi nguyên nhân: để dự đoán`t_{i+k+1}`, độ sâu `k+1`của mô-đun sẽ thấy`t_{i+k}`处的内容──这在结构上与自归解码器 消费自输出方式相同,因此MTP mô-đun có thể trực tiếp được sử dụng như các bản thảo giải mã phỏng đoán──

推理时:将 `h_i^(k-1)`和草拟出 `t_{i+k}`输入 mô-đun `k+1`, nhận được đối với`t_{i+k+1}`Đây chính là bản thảo kiểu EAGLE, chỉ sử dụng mô-đun MTP được đào tạo tốt như một mạng lưới dự thảo. DeepSeek-V3 báo cáo tỷ lệ chấp nhận của mô-đun MTP đầu tiên vượt quá 80%, và đạt được khoảng 1.8x tăng tốc.

### 参数核算

对于隐藏 为 `h`、词表为 `V`Mô hình:

- Chủ mô hình: hàng tỷ tham số, cộng với một phần lớn`V * h`của đầu đầu ra.
- Đầu sản xuất chia sẻ: Dupuy chủ mô hình đầu. Không có phụ kiện phụ.
- Chia sẻ nhúng:复用主模型的嵌入──没有额外参数──
- Mỗi mô-đun MTP:
  - Dự án `M_k`- Có thể là:`(2h) * h = 2h^2`
  - Phòng biến đổi `T_k`:attention(MHA 为 `4h^2`)加 MLP(SwiGLU 且比例为8/3 时通常为`8h^2`() Mỗi khối 约 `12h^2`

Tổng số lượng phụ của mỗi mô-đun:`~14h^2`❖ Đối với DeepSeek-V3 `h = 7168`,D = 1 mô-đun: giấy trên mặt là `~14 * 7168^2 = ~720M`参数──DeepSeek-V3  báo cáo là 14B, sự khác biệt chủ yếu đến từ các lớp chuyên gia trong mô-đun MTP cũng áp dụng MoE──

### - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

Trong thời gian đào tạo, các mô-đun MTP sẽ làm cho việc đào tạo thay đổi chậm khoảng 10% (đối đa số tính toán tiến, mất mát phụ)

1. Các hoạt động này được thực hiện bởi các nhà khoa học chuyên ngành về các phương pháp kiểm tra và kiểm tra.

2. 推理时免费的投机解码草案──MTP module 已被训练预测下几代币──重新使用网络草案时,它能达到80%+的接受率── 在这个水平下,N=3或N=5的规范解码可带来1.8×吞吐量──10%的训练成本将在第一次运行推理时就开始回本──

### Quan hệ với Eagle

EAGLE trong quá trình đào tạo trước một cách độc lập đào tạo một mô hình dự thảo nhỏ. MTP sẽ dự thảo vào quá trình đào tạo trước.

| Dimension | EAGLE-3 | MTP (DeepSeek-V3) |
|-----------|---------|------------------|
| When trained | 预训练之后 | 预训练期间 |
| Backward-compatible with existing weights | 是 | 否（需要重新训练） |
| Draft params | 1-2 个 transformer layers | 1 个 transformer block + projection |
| Acceptance rate | 0.88-0.92 | depth 1 时 0.80+ |
| Benefit beyond speedup | 仅 speculative decoding | 更密集的训练信号 + 加速 |


```figure
multi-token-predict
```

##  xây dựng nó

`code/main.py`端到端构建一个MTP模块:shared embedding、projection、transformer block、shared output head──然后它会在一段简短的合成序列上计算每深度交叉缩损失,并按组件印参数──32 个代币的玩具词汇让数字更容易读──

### 步骤 1: bàn nhúng chung

Một `vocab_size x hidden`Bảng được mô hình chính và mỗi mô-đun MTP trên mỗi độ sâu 共同使用── không phải là bản thứ hai, mà là cùng một tensor──

### 步骤 2: kết hợp độ sâu

```python
def combine(prev_hidden, next_token_embed, M_k):
    # concat along feature dim, then project down to hidden
    concat = rms_norm(prev_hidden) + rms_norm(next_token_embed)  # vector addition stand-in
    projected = matvec(M_k, concat)
    return projected
```

Thực sự DeepSeek-V3 sẽ trải qua hai RMSNorm của vector concat vì `[2h]`, không dùng một `h x 2h`Matrix 投影──This toy 为了 stdlib 简洁,用矢量加法来代替──

### 步骤 3: độ sâu k của khối biến thể

Sự chú ý tự trị 加 MLP──在玩具中,一个单层线性注意区 和一个SwiGLU MLP 让结构可见,同时避免使用 numpy──

### 步骤 4: đầu đầu ra chung

复用主模型的输出投影──输出覆盖词汇的 logits──

### 步骤 5:Lạc sâu

softmax(logits) 相对 bù đắp`k`处 thực tại token của cross-entropy。使用 `lambda / D`缩放因子跨深度 聚合──

### 步骤 6: Các số tính toán

打印总参数、共享(embedding、head)参数, cũng như mỗi mô-đun 额外参数── hiển thị MTP 额外参数与主模型大小的比例──

## Sử dụng nó

MTP đã được tập hợp đến DeepSeek-V3(2024 年 12 月) và DeepSeek-R1 系列中──推理时:

- DeepSeek  tự phục vụ hàng đống 可开箱即用地将 MTP mô-đun 作为投机解码器 使用。
- 截至 2026 年 4 月,vLLM 和 SGLang 已有DeepSeek-V3 MTP的集成路径──
- AMD ROCm SGLang giáo dục cho thấy một cấu hình giải mã dự đoán MTP cụ thể, và trên điểm kiểm tra V3 lên测得 1.8× 加速──

Trong các hoạt động huấn luyện mới sử dụng MTP:

- Bạn kiểm soát toàn bộ đường ống đào tạo trước, và mong muốn trước tiên nhận được tín hiệu đào tạo sâu hơn.
- Bạn biết mình sẽ phục vụ mô hình này, và mong muốn miễn phí có được giải mã giả định.
- Kích thước ẩn của bạn ít nhất là 4096... dưới quy mô 1B, thiệt hại gây ra từ việc bán hàng thường vượt quá lợi nhuận.

Không phù hợp sử dụng:

- Đối với hiện có mô hình tập luyện dày đặc thực hiện điều chỉnh tinh tế.
- Nghiên cứu mô hình bạn mong muốn có một đường cơ sở sạch  tiến hành so sánh. MTP sẽ thay đổi cấu trúc.

## 交付 nó

本课会生成 `outputs/skill-mtp-planner.md` Đặt một quy tắc vận hành dự kiến (模型大小、数据、计算), nó sẽ quay lại một quy trình MTP tích hợp: độ sâu số D、`lambda`lịch trình, bộ nhớ và các dây đai giải mã dự đoán trong thời gian

## 练习

1. 运行 `code/main.py` hiển thị theo tín hiệu tổng hợp 增强,per-depth loss 单调下降;; sửa đổi tổng hợp, làm cho nó sử dụng một mô hình cố định,并验证 độ sâu-1 和 độ sâu-2 mất 城市收──

2. 计算一个密度70B 模型(隐藏 8192,80 层) 在D=1 MTP模块 下的参数开销――与 DeepSeek-V3 报告的 14B 开销进行比较――解释为什么 DeepSeek 的数字更高:MTP变压器块 继承了相同的MoE 结构,从而扩大了每个模块的参数――

3. Trong trò chơi thực hiện D=2: thêm mô-đun MTP thứ hai, nhận h^(1) 并预测 `t_{i+2}` Báo cáo về lỗ liên kết và tính toán số với các phương trình của DeepSeek giấy 19-21 匹配。

4. 将玩具换为平行MTP(Gloeckle-style): Trong trạng thái ẩn chính 之上添加D 个输出头,每个预测不同的抵消――测量在同一个合成信号上,每个深度的损失与序列版本相比如何――对于 k > 1,序列版本应产生更低的深度-k损失,因为它在中间预测为条件――

5. Để đào tạo tốt mô-đun MTP sử dụng như EAGLE kiểu dự thảo:`t_{i+k}` Trong chuỗi được tổ chức trên, đo các mã dự thảo này tương đối với tỷ lệ chấp nhận của mô hình chính dự đoán  Nếu bạn đạt 50% + trên trò chơi, bạn đã có thể nhận được tính chất kinh nghiệm của MTP như dự thảo 

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MTP module | “额外 loss block” | 一个小型 transformer block 加 projection，用来预测主模型前方 `k` 个位置的 Token |
| Prediction depth | “哪个 offset” | 整数 `k`，使得 module `k` 基于截至位置 `i` 的 prefix 预测 `t_{i+k}` |
| Parallel MTP | “Gloeckle-style” | 位于同一个 backbone hidden state 之上的 D 个独立 heads，没有条件链 |
| Sequential MTP | “DeepSeek-V3 style” | 每个 module 都以先前 depth 的 hidden state 加下一个 Token 的 embedding 为条件；保留 causal chain |
| Shared output head | “复用主 head” | MTP modules 调用主模型的 LM head，而不是单独的 output projection |
| Shared embedding | “复用主 table” | 同一个 vocabulary embedding table 在所有地方使用；没有重复参数 |
| Projection matrix M_k | “结合 hidden + next-token” | 一个 `h x 2h` linear layer，将前一个 hidden state 和 target-token embedding 折叠为下一深度的输入 |
| Joint loss L_MTP | “平均额外 losses” | per-depth cross-entropy losses 的算术平均值，并按 `lambda` 缩放 |
| Acceptance rate at depth 1 | “MTP draft 多常正确” | D=1 MTP module 的 top-1 prediction 等于主模型 top-1 prediction 的比例；DeepSeek-V3 上超过 80% |
| Lambda weighting | “额外 loss 的重要性” | per-depth 缩放因子；DeepSeek-V3 在训练开始时为 0.3，之后为 0.1 |

## 延伸阅读

- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) 完整的顺序MTP 描述(Bản 2.2), bao gồm các phương trình mất liên kết 和推理时的 1.8× 加速
- [Gloeckle et al. — Better & Faster Large Language Models via Multi-token Prediction (arXiv:2404.19737)](https://arxiv.org/abs/2404.19737) DeepSeek 设计所改进的平行 MTP cơ sở
- [DeepSeek-V3 model card on Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-V3) 685B 总量(671B chính + 14B MTP),部署说明
- [Leviathan et al. — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192)](https://arxiv.org/abs/2211.17192) MTP 所适配的 định nghĩa định nghĩa 框架
- [Li et al. — EAGLE-3 (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840) Dự thảo kiến trúc 2025 của EAGLE, cũng là chương trình đối phó của MTP 竞争对应方案
