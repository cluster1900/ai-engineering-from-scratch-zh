# Sự kết hợp của các chuyên gia (MoE)

> Một biến thể 70B dày đặc sẽ được sử dụng cho mỗi token  kích hoạt tất cả các tham số  Một 671B MoE Mỗi token chỉ kích hoạt 37B tham số, nhưng trên tất cả các tiêu chuẩn 上胜它──稀疏性 là quy mô quan trọng nhất trong thập kỷ này 思想──

**Type:** Build
**Languages:** Python
**先修要求:**Giai đoạn 7 · 05 (Tổng biến đổi), Giai đoạn 7 · 07 (GPT)
**Time:** ~45 minutes

## 问题

Density Transformer trong suy luận 时的FLOPs等于它的参数(Forward pass 乘以 2);;扩展一个密集模型 时,每个代币都必须支付完整计算成本;;到2024年,边界 已经撞击了计算墙:要显著变得更聪明,你需要每个代币指数级更多的FLOPs;;

Sự kết hợp của các chuyên gia đã phá vỡ mối quan hệ này.`E`个独立专家 + 一个为每个代币 选择 `k`个 chuyên gia của router──总参数 = `E × FFN_size`△ Tỷ số hoạt động của mỗi token = `k × FFN_size`❖ Tương tự 2026 配置:`E=256`- Tôi không biết.`k=8`❖ Kho lưu trữ`E`扩展,计算随`k`扩展──

Biên giới năm 2026  gần như toàn bộ là MoE:DeepSeek-V3(671B tổng / 37B hoạt động) 、Mixtral 8×22B、Qwen2.5-MoE、Llama 4、Kimi K2、gpt-oss。 trên bảng xếp hạng độc lập của Phân tích Kỹ thuật trên,排名前 10 của open source模型全都是 MoE。

## 概念

![MoE layer: router selects k of E experts per token](../assets/moe.svg)

### FFN 替换

khối Transformer dày đặc:

```
h = x + attn(norm(x))
h = h + FFN(norm(h))
```

Phòng MoE:

```
h = x + attn(norm(x))
scores = router(norm(h))              # (N_tokens, E)
top_k = argmax_k(scores)              # pick k of E per token
h = h + sum_{e in top_k}(
        gate(scores[e]) * Expert_e(norm(h))
    )
```

Mỗi chuyên gia đều là một FFN độc lập (thường là SwiGLU). Router là một lớp đơn tuyến.`k`Các chuyên gia,并获得它们输出门混合──

### cân bằng tải 问题

Nếu router 让90% mã thông qua chuyên gia 3, các chuyên gia khác sẽ bị chết đói.

1. **Auxiliary load-balancing loss**(Switch Transformer、Mixtral) ――Tăng một với chuyên gia tỷ lệ sử dụng khác nhau thành tỷ lệ trừng phạt.
2. **Expert capacity + token dropping**(早期 Switch) ✿ Mỗi chuyên gia 最多处理 `C × N/E`个 Tốc Token 溢出的 Tốc Token 跳过该层──会损害质量──
3. **Auxiliary-loss-free balancing**(DeepSeek-V3)。 thêm một sự thiên vị có thể học được cho mỗi chuyên gia, được sử dụng để chuyển hướng các router trên cùng  chọn lựa── thiên vị trong việc mất tập luyện  外部更新──不对主目标添加惩罚── đây là một bước đột phá quan trọng của năm 2024──

Thực hành của DeepSeek-V3: Sau mỗi bước đào tạo, đối với mỗi chuyên gia kiểm tra tỷ lệ sử dụng của nó là cao hơn hoặc thấp hơn mục tiêu.`±γ`微调 bias──选择时使用 `scores + bias` Sử dụng các khả năng chuyên gia của các cửa  vẫn sử dụng chưa sửa đổi của nguyên bản `scores` This will routing with expression 解──

### Các chuyên gia chung

DeepSeek-V2/V3 còn chia các chuyên gia thành *shared* và *routed*── mỗi token sẽ trải qua tất cả các chuyên gia chia sẻ──Routed experts 通过 top-k 选择──Shared experts 捕获通用知识;routed experts 负责专门化──V3 运行 1 chuyên gia chia sẻ, cộng với 256 chuyên gia chia sẻ trong số 8 chuyên gia đầu tiên──

### Các chuyên gia hạt mỏng

经典 MoE(GShard、Switch): Mỗi chuyên gia 和完整FFN 一样宽──`E`较小(8-64),`k`较小(1-2)。

现代 hạt mỏng MoE(DeepSeek-V3、Qwen-MoE): mỗi chuyên gia 更窄(1/8 FFN kích thước)`E`很大(256+),`k`Hơn nữa, tổng số参数 giống nhau, nhưng tổng số组合扩展快得多.`C(256, 8) = 400 trillion`种可能的每代币 专家──质量提升,延迟 保持不变──

### 成本图片

Mỗi token √ từng tầng:

| Config | Active params / token | Total params |
|--------|-----------------------|--------------|
| Mixtral 8×22B | ~39B | 141B |
| Llama 3 70B (dense) | 70B | 70B |
| DeepSeek-V3 | 37B | 671B |
| Kimi K2 (MoE) | ~32B | 1T |

DeepSeek-V3 trong hầu hết các điểm chuẩn 上都胜过 Llama 3 70B (thiết bị dày đặc), đồng thời**每个 Token 使用更少的活跃 FLOPs**△更多参数 = 更多知识──更多活跃 FLOPs = Mỗi token 更多计算──MOE sẽ giải mã chúng──

### 代价: ký ức

Bất kể các chuyên gia nào được kích hoạt, tất cả các chuyên gia đều phải ở trên GPU. Một mô hình 671B cần khoảng 1.3 TB VRAM để lưu trữ trọng lượng fp16.


```figure
expert-routing
```

##  xây dựng nó

参见 `code/main.py` một lớp MoE chặt chẽ sử dụng trong một thời gian ngắn, bao gồm:

- `n_experts=8`个近似 SwiGLU của các chuyên gia (để dễ dàng giải thích, mỗi chỉ có một tuyến tính)
- top-k=2 định tuyến
- trọng lượng cửa được chuẩn hóa với độ mềm tối đa
- Thông qua sự thiên vị của mỗi chuyên gia  thực hiện cân bằng không mất mát phụ trợ

### 步骤 1: bộ định tuyến

```python
def route(hidden, W_router, top_k, bias):
    scores = [sum(h * w for h, w in zip(hidden, W_router[e])) for e in range(len(W_router))]
    biased = [s + b for s, b in zip(scores, bias)]
    top_idx = sorted(range(len(biased)), key=lambda i: -biased[i])[:top_k]
    # softmax over ORIGINAL scores of the chosen experts
    chosen = [scores[i] for i in top_idx]
    m = max(chosen)
    exps = [math.exp(c - m) for c in chosen]
    s = sum(exps)
    gates = [e / s for e in exps]
    return top_idx, gates
```

Bias  ảnh hưởng đến lựa chọn, không ảnh hưởng đến trọng lượng cổng. Đây là kỹ năng của DeepSeek-V3: Bias 在不引导模型预测的情况下修改负载不平衡.

### 步骤 2: Hãy 100 个 mã thông qua router

Theo dõi những chuyên gia được kích hoạt và kích hoạt tần suất. Không có thiên vị.`-γ`, sử dụng thiếu sử dụng`+γ`(c) sau đó, tỷ lệ sử dụng sẽ được phân phối trung bình trong vài thế hệ.

### 步骤 3: số lượng đối với

印一个 MoE config 的 密度相当──DeepSeek-V3 形状:256 định tuyến + 1 chia sẻ,8 hoạt động,d_model=7168──总参数非常惊人──活跃参数只有密度 Llama 3 70B 的七分之一──

## Sử dụng nó

Nhấp mặt

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("mistralai/Mixtral-8x22B-v0.1")
```

Kết luận sản xuất năm 2026: vLLM 原生支持 MoE định tuyến. SGLang có đường đồng bộ chuyên gia nhanh nhất.

**何时选择 MoE：**
- Bạn muốn có chi phí suy luận token thấp hơn để đạt được chất lượng biên giới.
- Bạn có cơ sở hạ tầng VRAM / chuyên gia song song.
- Nhiệm vụ làm việc của bạn là mã thông báo nặng nề, chứ không phải văn bản dài dài.

**何时不要选择 MoE：**
- Việc triển khai cạnh: bạn sẽ trả cho bất kỳ FLOP hoạt động nào 支付完整存储成本──
- Lạt-chẩn trọng một người dùng phục vụ: chuyên gia định tuyến 会增加 Overhead。
- 小模型(<7B):MôE của chất lượng ưu thế chỉ xuất hiện trong quá trình vượt qua một số ngưỡng tính toán (khoảng 6B hoạt động tham số) sau.

## 交付 nó

参见 `outputs/skill-moe-configurator.md`◊该技能 会根据参数预算, training tokens 和部署目标,为新的MOE 选择 E、k 和共享专家布局──

## 练习

1. **Easy.**运行 `code/main.py`◊ Xem cập nhật thiên vị không mất phụ trợ 如何在50次代中拉平专家使用──
2. **Medium.**Sử dụng router dựa trên hash (định nghĩa, không cần học) thay thế router học ổng.
3. **Hard.**实现 GRPO-style rollout-matched routing(DeepSeek-V3.2 技巧): ghi kết luận 期间哪些专家被触发,在 Gradient 计算期间强制使用相同路由──在一个玩具政策-gradient设置 上测量效果──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| Expert | “众多 FFN 中的一个” | 一个独立 feed-forward network；参数专用于 FFN 计算中的一个稀疏切片。 |
| Router | “gate” | 一个很小的 linear layer，用来为每个 Token 对每个 expert 打分；执行 top-k selection。 |
| Top-k routing | “每个 Token 有 k 个 active experts” | 每个 Token 的 FFN 计算恰好经过 k 个 experts，并由 gate 加权。 |
| Auxiliary loss | “Load-balance penalty” | 一个额外 Loss term，用来惩罚偏斜的 expert usage。 |
| Auxiliary-loss-free | “DeepSeek-V3 的技巧” | 只在 router 的 selection 上通过 per-expert bias 实现 balance；没有额外 Gradient。 |
| Shared expert | “Always on” | 每个 Token 都会经过的额外 expert；捕获通用知识。 |
| Expert parallelism | “按 expert 分片” | 将不同 experts 分配到不同 GPUs；通过网络 route tokens。 |
| Sparsity | “active params < total params” | 比率 `k × expert_size / (E × expert_size)`；DeepSeek-V3 为 37/671 ≈ 5.5%。 |

## 延伸阅读

- [Shazeer et al. (2017). Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer](https://arxiv.org/abs/1701.06538) Nguồn của ý tưởng này.
- [Fedus, Zoph, Shazeer (2022). Switch Transformer: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity](https://arxiv.org/abs/2101.03961) Switch, Classic MoE。
- [Jiang et al. (2024). Mixtral of Experts](https://arxiv.org/abs/2401.04088) Mixtra 8×7B。
- [DeepSeek-AI (2024). DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) MLA + hỗ trợ không mất mát MoE + MTP。
- [Wang et al. (2024). Auxiliary-Loss-Free Load Balancing Strategy for Mixture-of-Experts](https://arxiv.org/abs/2408.15664) 基于偏见的平衡论文──
- [Dai et al. (2024). DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models](https://arxiv.org/abs/2401.06066) 本课路由器 使用的细粒+ chia sẻ-xác giả chia rẽ。
- [Kim et al. (2022). DeepSpeed-MoE: Advancing Mixture-of-Experts Inference and Training](https://arxiv.org/abs/2201.05596) 最早的共享专家论文──
