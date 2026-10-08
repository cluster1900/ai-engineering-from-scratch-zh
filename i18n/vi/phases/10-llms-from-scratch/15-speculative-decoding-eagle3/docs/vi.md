# Việc giải mã giả định và EAGLE-3

> Giai đoạn 7 · Bài học 16 chứng minh toán học: Leviathan  từ chối quy tắc sẽ đảm bảo phân phối của các chứng minh. Bốn bài học từ đào tạo  nhìn nhìn xem phân phối của các chứng minh. 2026 năm sản xuất cấp độ Khác định tính. EAGLE-3 sẽ dự thảo mô hình từ chi phí gần như trở thành một mạng nhỏ được thiết kế chuyên biệt, nó dựa trên các trạng thái ẩn của các chứng minh.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 16（speculative decoding math），Phase 10 · 12（inference optimization）
**Time:** ~75 minutes

## Học mục tiêu
- Sử dụng một câu để mô tả lý thuyết Leviathan,并 chứng minh vòng suy đoán sinh ra của mẫu và phân bố chứng minh hoàn toàn phù hợp.
- Từ việc giải mã đặc điểm vanilla (Leviathan 2023) đến sự phát triển của EAGLE、EAGLE-2 và EAGLE-3, và cho biết mỗi bước di chuyển có giới hạn chính xác.
- Theo tỷ lệ chấp nhận`α`和 dự thảo-to-verifier 成本比 `c`计算期望加速,并为每种制度 选择最优草案 长度 `N`
- Từ zero thực hiện toàn bộ vòng đầu cơ: bản thảo, xác minh, từ dư trong từ chối-chví hình, trong từ chối, quay lại kho lưu trữ KV, trong hoàn toàn chấp nhận, xuất khẩu mã thông báo thưởng.

## 问题
Trong mô hình 70B, làm mã hóa tự động, trên H100 có thể chỉ có 35 Token mỗi giây. GPU 远未和── Memory bandwidth 才是上限: mỗi Token đều phải tải lên từ HBM, thực hiện phép tính bước, sau đó tạo ra một float──计算单元大部分时间都处于空状态──

Việc giải mã giả định sẽ biến nó thành một vấn đề phân giải thực sự.`N`次小型 前進パス 中提出 `N`个 Token──验证器在前音加上所有 `N`个草案 上运行一次―― Nếu máy kiểm tra đang ở vị trí `i`∆ phân bố và dự thảo ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ `N+1`个 được chấp nhận Đèn chỉ, chứ không phải là một.

Thuyết quan trọng từ Leviathan, Kalman, Matias (ICML 2023): Output phân bố với phân bố trực tiếp từ các mẫu thử nghiệm hoàn toàn phù hợp. Không gần như phù hợp.

Giai đoạn 7 · Bài học 16 给你是数学――本课给你是训练―― một bản thảo tốt 带来的加速价值比廉价草案高 2×──EAGLE、EAGLE-2 和 EAGLE-3 (Li et al., 20242025) 将草案 = 同一模型的小版本转化为一门精确的工程学科──2026年生产推理服务器默认使用EAGLE−3──

## 概念
### 不变量: Tiểu mẫu từ chối Leviathan

Làm cho`p(t)`biểu hiện trong một định nghĩa trước 下草案 đối với một Token phân bố,`q(t)`表示验证器的分布──采样一个草案Token `d ~ p`❖  `min(1, q(d) / p(d))` Nếu từ chối, thì từ phân phối dư thừa `(q - p)_+ / ||(q - p)_+||_1`Trong khi đó, cuối cùng,`q` `p`多差,这都成立;越差就越常拒绝, nhưng输出 vẫn chính xác.

- Đưa đi.`N`Tiếp theo như vậy điều chỉnh đầu cuối, sử dụng một lần kiểm tra phía trước  xử lý `prefix + d_1 + ... + d_N`❖ kiểm chứng器会同时返回 `q_1, q_2, ..., q_{N+1}` Từ trái đến phải qua khắp nơi `j`Lần đầu tiên từ chối, từ`residual(q_j, p_j)`采样并停止──若全部接受,则从 `q_{N+1}`Như một biểu tượng tiền thưởng.

### Điều gì quyết định tốc độ

Làm cho`α`Đối với mỗi dự thảo Token Ước tính chấp nhận tỷ lệ.`c = cost(draft) / cost(verifier)`Đối với chi phí:

```
E[accepted] = (1 - α^(N+1)) / (1 - α)
```

Mỗi nhận token của kỳ vọng tổng thời gian tường là `(N * c + 1) / E[accepted]` `N`Để làm nó nhỏ hơn, bạn có thể nhận được điểm tốt nhất.`α = 0.8, c = 0.05`: 最优 `N`Khoảng 57, tăng tốc là 3,2 x.`α = 0.95, c = 0.02`: 最优 `N`Khoảng 810... tăng tốc gần 5x...

Lượng lớn nhất là `α`   `N = 5`时, từ `α = 0.6`(Tạo thảo vanilla)提升到 `α = 0.9`(EAGLE-3), sẽ làm cho mỗi lần kiểm chứng trước kỳ vọng nhận mã thông báo từ 2.2 提升到4.1 ⋅ sử dụng cùng một kiểm chứng,吞吐几乎翻倍──

### Sự tiến triển hai năm

**Vanilla speculative (Leviathan, 2023).**Mô hình dự thảo là một chương trình đào tạo độc lập trong cùng một gia đình.`α ≈ 0.6`Tốt nhất là chỉ có 2 lần tăng tốc.

**EAGLE-1 (Li et al., 2024).**Dự thảo là một biến thể kiểu nhỏ, thường là một đến hai tầng, nó được sử dụng trong trạng thái ẩn lớp cuối của xác nhận như là nhập và trực tiếp dự đoán một Token tiếp theo.`α`Tăng lên 0,7 0,8 

**EAGLE-2 (Li et al., 2024).**加入动态草案树:不是提出单条包含 `N`个Token的序列, thay vào đó đưa ra một cây ứng cử viên nhỏ, sử dụng một cái chứng minh máy tiến lên phía trước (tránh chú ý của cây) cho mỗi ứng cử viên, sau đó tiến lên phía trước trên con đường có tỷ lệ cao nhất.`α`Tăng lên 0,85 hơn.

**EAGLE-3 (Li et al., 2025, NeurIPS).**Ngoài ra, đã thực hiện hai thay đổi. Thứ nhất, hoàn toàn loại bỏ mất tính năng dự đoán: EAGLE-1/2  dự thảo đào tạo 去匹配验证器's hidden states, điều này hạn chế được thu nhập hơn. EAGLE-3  trực tiếp dựa trên dự đoán token 训练. thứ hai, kiểm tra thời gian đào tạo (TTT): trong quá trình đào tạo dự thảo, hãy xem dự án tự trước như là nhập phản đến nhiều bước tiếp theo, phù hợp với cách vận hành của nó trong quá trình suy luận. Điều này sẽ đối với phân bố đào tạo và thử nghiệm, ngăn chặn sự tích tụ sai lầm.

### KV cache rollback

验证会在一次通过 中将验证器的 KV缓存 扩展 `N`个条目──如果在位置 `j`发生拒绝,那么位置 `j-1`后的缓存内容就是错误的──常见实现有两种:写入划分缓冲并在接受时提交(vLLM、TensorRT-LLM), hoặc维护一个物理KV缓存加逻辑长度,并拒绝时截断──无论如何,滚back 成本都是每个层每个头的字节,与前进通过 成本相比可以忽略──

Đối với tìm kiếm cây EAGLE-2, các nhà kiểm tra sẽ sử dụng kính trọng mặt nạ không gây hại của cây 运行 Attention。工程上细节繁, nhưng tính toán bản chất là một lần mang mặt nạ tùy chỉnh tiêu chuẩn flash-trông tâm 调用。

### Dự thảo kiến trúc vào năm 2026

| Strategy | Draft type | `α` | Speedup | Training cost |
|----------|-----------|-----|---------|---------------|
| Vanilla | 独立小型 LLM | 0.55-0.70 | 1.8-2.3× | 无（复用现有小模型） |
| Medusa | 验证器上的额外 LM heads | 0.65-0.75 | 2-3× | ~1B SFT tokens |
| EAGLE-1 | hidden states 上的 1-layer transformer | 0.70-0.80 | 2.5-3× | ~60B tokens |
| EAGLE-2 | EAGLE-1 + dynamic draft tree | 0.80-0.88 | 3-4× | ~60B tokens |
| EAGLE-3 | Multi-layer feature fusion + TTT | 0.88-0.92 | 3.5-6.5× | ~60-200B tokens |
| Lookahead | 无 draft（Jacobi iteration） | N/A | 1.3-1.6× | 无 |

2026 年生产环境中:vLLM 和 SGLang 在可用时默认使用EAGLE-3,否则使用EAGLE-2──TensorRT-LLM 为 Meta 和 NVIDIA 公开模型提供最快的Medusa 路径──llama.cpp 为 CPU 部署提供 vanila草案──


```figure
l5-spec-decode-eagle
```

##  xây dựng nó
见 `code/main.py`Đây là vòng lặp đầu cơ Leviathan hoàn chỉnh, bao gồm tất cả các thành phần: bản thảo của N, kiểm chứng và thông qua từng vị trí từ chối, lấy mẫu dư thừa, token tiền thưởng, rollback KV, cũng như sử dụng để kiểm chứng phân phối đầu ra và trực tiếp từ`q`采样一致的经验检查──

### 步骤 1: từ chối quy tắc

```python
def accept(q_prob, p_prob, u):
    if p_prob <= 0:
        return True
    return u < min(1.0, q_prob / p_prob)
```

### 步骤 2: phân phối dư thừa

```python
def residual(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    if s == 0:
        return list(q)
    return [r / s for r in raw]
```

### 步骤 3: một bước đầu cơ đầy đủ

`spec_step`函数 từ `p`Dự thảo`N`个 token, rồi trong một lần并行 `q`đánh giá 中验证它们── nó sẽ đối với mỗi bản thảo Token 应用拒绝规则, và lần đầu tiên từ chối 时从残留中采样修正──如果全部接受,则从`q_{N+1}`输出 một token tiền thưởng.

### 步骤 4: KV rollback kế toán

模拟器会为每个员工跟踪逻辑 `kv_length`❖ chấp nhận `k`个 bản thảo 时,`kv_length += k`   `j`Khi bị từ chối, cache đã được viết.`j`Nhưng logic longitude sẽ được đặt ra`prefix_length + j + 1`,也就是修正符号 后一个位置──后续读取将截截至逻辑长度──

### 步骤 5: kiểm tra Leviathan

运行 50,000 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个`q`直接采样 50,000 lần so sánh 统计量应显著低于关键值 △该定理在实践中成立

### 步骤 6: tăng tốc so với α

通过不同幅度扰动 `p`Để nó đi`q`, quét chất lượng dự thảo.`α`, rồi vẽ khác nhau .`α`和 `N`下每次验证器调用期望 Token 数――代码会印一张表,展示EAGLE-3 级别的草案质量(`α ≈ 0.9`) làm thế nào để mở khóa mỗi lần kiểm tra thiết bị sử dụng 45 个 token.

## Sử dụng nó
Sử dụng cấp sản xuất của EAGLE-3 `vllm serve`- Có thể là:

```bash
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --speculative-config '{
    "model": "yuhuili/EAGLE3-LLaMA3.3-Instruct-70B",
    "num_speculative_tokens": 5,
    "method": "eagle3"
  }'
```

Trong H100 trên lô 64 sử dụng SGLang của EAGLE-3: Theo giấy EAGLE-3,相比 lô-64 vanilla giải mã,吞吐大约提升1.38×。

适合使用  định thuật giải mã:

- 任何p50延迟比峰值吞吐更重要交互式聊天工作负载──
- 代码生成和结构化输出(JSON、SQL) ・・・ vì mục tiêu phân bố cao có thể dự đoán,`α`Tối cao hơn 0,9...
- 长文本生成 ((数千 Token) 』摊销后的加速会持续收益──

Không phù hợp với tình huống:

- 很小的模型(< 3B) ・Draft 并不比验证器便宜太多──
- 极小批-1 CPU 部署。Mô hình bản dự thảo 內存开销可能不值得──
- nêu nhiệt độ rất cao, ngay lúc này`α`Sẽ sụp đổ.

## 交付 nó
本课会生成 `outputs/skill-eagle3-tuner.md` Đưa ra một quy định về khối lượng công việc (đối tượng, kích thước lô, độ trễ mục tiêu, hồ sơ nhiệm vụ), nó sẽ đề xuất các chiến lược giải mã phỏng đoán và điều chỉnh các thành phần của gia đình dự thảo`N`、thiên cây 、thời gian chuyển đổi nhiệt độ)

## 练习
1. 运行 `code/main.py`❖ xác nhận Leviathan phân bố chi-quad trong kiểm tra  thống kê ở trên 50.000 mẫu giữ dưới 95% giá trị quan trọng ❖

2. Trong `α` cố định là 0,9 且 `c`固定为0.04 时,将 `N`Từ 1 扫描 đến 10 绘制 mỗi lần kiểm tra thiết bị điều chỉnh kỳ vọng Địa chỉ số và thời gian tường thực tế của mỗi Địa chỉ  Tìm ra thời gian tường tối thiểu `N`❖ giải thích hình dạng đường

3.  sửa đổi mã mã để mô phỏng Eagle-2 tìm kiếm cây: mỗi bước trong, bản thảo  đưa ra hình dạng`[2, 2, 2]`☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐`α`Và tổng số token được sử dụng trong mỗi lần kiểm tra đối với số lượng tính toán giá bằng

4. Vì hai并发序列实现批量 KV rollback 模拟器──所有草案 của chuỗi A đều được chấp nhận; chuỗi B ở vị trí 2 拒绝── hiển thị chính xác của mỗi序列`kv_length`Tất cả đều được cập nhật, và không có phí làm việc.

5. 阅读EAGLE-3 bài báo Phần 4(Training-Time Test) ⋅ sử dụng hai câu giải thích tại sao không có đào tạo dự thảo ngây thơ của TTT sẽ bị thiên vị tiếp xúc, cũng như tại sao trong đào tạo đưa dự thảo của mình phản ứng cho nó có thể sửa chữa vấn đề này── sẽ được kết nối với các văn học lấy mẫu theo lịch trình trong seq2seq ⇒

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Leviathan rule | “min(1, q 除以 p)” | 以概率 `min(1, q(d)/p(d))` 进行 Bernoulli accept/reject；当 rejection 时从 residual 中采样，可精确保留验证器分布 |
| Residual distribution | “(q 减 p) 的正部，归一化” | `(q - p)_+` 在零处截断并重新归一化，是 rejection 时应采样的正确分布 |
| Acceptance rate α | “draft 对的频率” | 在拒绝规则下，每个 Token 的期望 Bernoulli 成功概率；支配所有加速数学 |
| EAGLE-1 | “hidden-state draft” | 条件化于验证器 last-layer hidden state 的微型 Transformer draft（Li et al., 2024） |
| EAGLE-2 | “dynamic draft tree” | EAGLE-1 加上一棵候选 continuation 树，并在一次验证器 pass 中用 tree attention 打分 |
| EAGLE-3 | “training-time test” | 去掉 feature-prediction loss，基于直接 Token prediction 训练，并在训练时把 draft 自己的输出反馈给它 |
| Training-time test (TTT) | “exposure bias 修复” | 训练时以 autoregressive 方式运行 draft，使训练和测试输入分布匹配，是 scheduled sampling 的直接类比 |
| KV rollback | “撤销被拒绝的 draft” | rejection 后将验证器 KV cache 重置到已接受 prefix 长度的 bookkeeping |
| Bonus token | “免费的那个” | 当全部 `N` 个 draft 都被接受时，以零额外验证器成本从 `q_{N+1}` 额外采样一个 Token |
| Tree attention | “一次验证许多候选” | 使用尊重 draft tree 拓扑的 non-causal mask 的 Attention；在一次 forward pass 中为树中的每个节点计算 `q_i` |

## 延伸阅读
- [Leviathan, Kalman, Matias — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192, ICML 2023)](https://arxiv.org/abs/2211.17192) 基础论文与等价性定理
- [Chen et al. — Accelerating Large Language Model Decoding with Speculative Sampling (arXiv:2302.01318)](https://arxiv.org/abs/2302.01318) cùng thời gian độc lập đề xuất phương pháp, chứng minh rõ ràng
- [Li et al. — EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077) EAGLE-1, dựa trên dự thảo được điều kiện của nhà nước ẩn
- [Li et al. — EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858) tìm kiếm cây động
- [Li et al. — EAGLE-3: Scaling up Inference Acceleration via Training-Time Test (arXiv:2503.01840, NeurIPS 2025)](https://arxiv.org/abs/2503.01840) 2026 năm sản xuất
- [Cai et al. — Medusa: Multiple Decoding Heads (arXiv:2401.10774)](https://arxiv.org/abs/2401.10774) 另一种无草案 方法
- [vLLM Speculative Decoding documentation](https://docs.vllm.ai/en/latest/features/spec_decode.html) 覆盖所有策略 接入的权威生产参考
