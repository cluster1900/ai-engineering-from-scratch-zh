# CLIP và sự huấn luyện ngôn ngữ thị giác tương phản

> OpenAI CLIP(2021) chứng minh một ý tưởng cốt lõi đủ để thúc đẩy tiếp theo năm tiếp theo: chỉ sử dụng các cặp hình ảnh-chủ đề Web 杂 và một tổn thất tương phản, đưa mã hóa hình ảnh và mã hóa văn bản để phù hợp với cùng một không gian vector trong ∼零 nhãn giám sát.

**Type:** Build
**Languages:** Python（stdlib，InfoNCE + sigmoid loss 实现）
**Prerequisites:** Phase 12 · 01（ViT patches），Phase 7（Transformers）
**Time:** ~180 分钟

## Học mục tiêu
- Từ thông tin lẫn nhau 推导 InfoNCE mất,并实现 một số lượng ổn định Vectorized 版本。
- 解释 tại sao Sigmoid cặp lỗ (SigLIP) có thể mở rộng đến lô 32768+, và không cần softmax yêu cầu của tất cả các tập hợp 开销。
- 通过构造 văn bản mẫu`a photo of a {class}`)并对 cosine similarity 取 argmax,运行零射图像网分类──
- Nói ra CLIP / SigLIP dự phòng tập  cho bạn bốn 杆: kích thước lô, nhiệt độ, mẫu nhanh, chất lượng dữ liệu.

## 问题
Tầm nhìn trước CLIP là giám sát. Thu thập các tập hợp dữ liệu có nhãn: ImageNet:1.2M hình ảnh, 1000 lớp), đào tạo CNN, sau đó phát hành.

Ảnh:                                                                                                                                                                                                                                                              

Câu trả lời của CLIP:把图像标题对 当作匹配任务──给定一个包含N 张图像和N 条标题的批,学习将每张图像与它自己的标题匹配,并区分N-1 个分散器──监督信号是这两个东西属于一起;这两个东西不属于一起──没有类标签──没有人工标签──只有一个反相损──

得到的嵌入空间 能做不止 CLIP 被训练做的事情──ImageNet 能工作,是因为 "một bức ảnh của một con mèo" 嵌入会接近那些从未被明显标记为猫的猫图像──这是催生每个2026 VLM 的注──

## 概念
### Bộ mã hóa kép

CLIP có hai tháp:

- Mã mã hình ảnh `f`:ViT hoặc ResNet, mỗi张 hình ảnh 输出 một D-dim Vector
- Mã mã văn bản `g`: nhỏ biến thể, mỗi dòng caption 输出一个 D-dim Vector。

Hai tháp đều chuẩn hóa đầu ra thành chiều dài đơn vị.`cos(f(x), g(y)) = f(x)^T g(y)`

Đối với một bao gồm N 个(photos, caption) cặp của lô, cấu trúc hình 为 `(N, N)`của sự tương đồng Matrix `S`- Có thể là:

```
S[i, j] = cos(f(x_i), g(y_j)) / tau
```

Trong số đó `tau`là học tập đạt nhiệt độ (CLIP khởi nghiệp là 0.07; trong log-space 中学习)

### Lãng InfoNCE

CLIP trong các hàng và cột 上 sử dụng giao hợp:

```
loss_i2t = CE(S, labels=identity)     # each image's positive is its own caption
loss_t2i = CE(S^T, labels=identity)   # each caption's positive is its own image
loss = (loss_i2t + loss_t2i) / 2
```

Đây là điểm mềm tối đa trong InfoNCE──CE 强制每张图像与其标题的匹配程度高于批次中所有其他标题──"负面"是所有其他批次的物品──较大的批次 = 更多负面 = 更强信号──CLIP 在批次32k 上训练;规模 很重要──

### Nhiệt độ

`tau`控制 softmax 的尖──低 tau → 尖分布,具有硬负矿业效果──高 tau → 软,所有样本都会贡献──CLIP 学习 log(1/tau),并进行剪切以防崩──SigLIP 2 固定初始 tau,并改用学习偏见──

### Tại sao sigmoid 扩展性更好(SigLIP)

Softmax  cần toàn bộ sự tương đồng Matrix  giữ đồng bộ. Trong đào tạo phân tán, bạn phải đưa mỗi nhúng tất cả-làm tập hợp đến mỗi bản sao, sau đó làm softmax.

SigLIP 用 yếu tố thông minh sigmoid  thay thế softmax: đối với mỗi cặp `(i, j)`, mất là một phân loại nhị phân, phán xét Đây là cặp phù hợp?chữ hiệu lớp tích cực là đường viền, tất cả những thứ khác đều âm.

```
L = -1/N sum over (i, j) [ y_ij log sigmoid(S[i,j]) + (1-y_ij) log sigmoid(-S[i,j]) ]
```

Nếu `i == j`,则 `y_ij = 1`, nếu không thì là 0, mỗi cặp mất là độc lập, không cần phải tập hợp tất cả, mỗi GPU tính toán khối địa phương của riêng mình và tìm kiếm và tìm kiếm, SigLIP 2 có thể chi phí thấp mở rộng đến lô 32k-512k, trong khi CLIP sẽ cần phải tăng tỷ lệ giao thông.

### Định dạng không bắn

给定 N 个 tên lớp, cho mỗi lớp  xây dựng một mẫu văn bản:

```
"a photo of a {class}"
```

用文字编码器 嵌入 每个模板──用图像编码器 嵌入 你的图像──Argmax cosine similarity = dự đoán lớp──不需要在目标类上训──

Template nhanh  rất quan trọng。CLIP 原论文为每个类使用了80个 Template(tự nhiên, nghệ thuật, ảnh, vẽ, 等)并平均嵌入式。ImageNet 提升 +3 điểm。现代用法通常选择一两个 Template。

### Các thăm dò tuyến tính và điều chỉnh tốt

Zero-shot là đường cơ sở。Sonde tuyến tính(在冷凍 CLIP tính năng 之上为目标类 训练一个线性层) 在域内任务 上胜过零-shot。Full fine tuning 在域内 上胜过线性 sonde,但可能损害零-shot转移──三种政法,三种交易对比──

### SigLIP 2: NaFlex và đặc điểm dày đặc

SigLIP 2(2025)加入:
- NaFlex: đơn lẻ mô hình xử lý tỷ lệ khía cạnh và độ phân giải khác nhau.
- Các tính năng dày đặc hơn, được sử dụng để phân đoạn và ước tính độ sâu, mục tiêu là trong VLMs như xương sống đóng băng.
- Nhiều ngôn ngữ: trên 100 ngôn ngữ 上训练, CLIP chỉ bằng tiếng Anh thôi.
- 1B thang điểm, CLIP cao nhất đến 400M.

Trong số các VLM mở năm 2026, SigLIP 2 SO400m/14 là tháp tầm nhìn mặc định. Đối với việc lấy lại hình ảnh-môn văn, nếu phân phối đào tạo LAION-2B cụ thể phù hợp với mô hình truy vấn của bạn, CLIP vẫn là lựa chọn mặc định.

### ALIGN, BASIC, OpenCLIP, EVA-CLIP

ALIGN(Google,2021):与 CLIP相同的想法,1.8B cặp quy mô,90% ồn ào. 证明噪音数据可以规模──OpenCLIP(LAION): trên LAION-400M / 2B 上对 CLIP的开放复制,多种规模,是常用的开放检查点──EVA-CLIP:从面膜图像建模初始化;是VLMs强的脊柱──BASIC:Google的 CLIP+ALIGN混合物──它们都属于同一家族,只是数据和调整不同──

### Màn trần không bắn

Các mô hình CLIP-class của ImageNet zero-shot lên hạn khoảng 76%(CLIP-G、OpenCLIP-G)。 tiếp tục nâng cấp cần dữ liệu lớn hơn(SigLIP 2  đạt 80%+) hoặc thay đổi kiến trúc(chủ đầu được giám sát、 nhiều tham số hơn)。Bênchmark 正在和; giá trị thực sự là 下游 VLMs 消费的嵌入空间。


```figure
multimodal-fusion
```

## Sử dụng nó
`code/main.py`实现:

1. Một trò chơi mã hóa kép dựa trên hash tính năng hình ảnh, tính năng biểu đồ văn bản),让你无需 numpy 就能看到InfoNCE的形状──
2. 纯 Python 的 InfoNCE mất đi (通过 log-sum-exp保证 số ổn định)
3. Sử dụng đối với sự mất tích cặp sigmoid đối với...
4. Một thói quen phân loại bằng không: tính toán với một nhóm các yêu cầu văn bản tương tự của cosine,并使用 argmax 进行预测。

运行它并观察 mất mát đường cong.

## 交付 nó
本课生成 `outputs/skill-clip-zero-shot.md`△给定一组图像(通过路径) 和一组目标类, nó sẽ sử dụng mẫu CLIP 构建文本提示, sử dụng chỉ định kiểm soát điểm(例如 `openai/clip-vit-large-patch14`)Thiêm 两侧,并返回带相似度的前-1 /前-5预测──该技能 拒绝对提示列表 中不存在的类做出判断──

## 练习
1. 手动为一个包含4 个对的批量实现 InfoNCE──构建4x4 similarity Matrix,运行softmax,取出横向,计算交叉entropy──使用这个手算结果验证你的Python实现──

2. Ngoài nhiệt độ, SigLIP cũng sử dụng các tham số thiên vị.`b`- Có thể là:`S'[i,j] = S[i,j]/tau + b`◊ Khi đợt  có sự mất cân bằng lớp học lớn hơn ()`b`起什么作用? đọc SigLIP Phần 3 ((arXiv:2303.15343)

3. Để tạo ra một phân loại không bắn.`a photo of a {class}`和 `a picture of a {class}`◊ Trong 100 张 hình ảnh thử nghiệm  đo độ chính xác.

4. 计算 512-GPU、batch 32k 运行时,softmax InfoNCE với sigmoid đôi chi phí giao tiếp──哪个按 O(N) thang,哪个按 O(N^2) thang?引用 SigLIP Section 4──

5. 阅读 OpenCLIP quy mô- quy luật giấy ((arXiv:2212.07143,Cherti et al.) ◦ Theo hình ảnh复现他们关于数据扩展的结论:在固定模型尺寸下,ImageNet zero-shot accuracy与训练数据尺寸之间的日线关系是什么?

## 关键术语
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| InfoNCE | "Contrastive loss" | 对一个 batch 的 similarity Matrix 做 cross-entropy；每个 item 的 positive 是它配对的 item，negatives 是其他所有项 |
| Sigmoid loss | "SigLIP loss" | Per-pair binary cross-entropy；没有 softmax，没有 all-gather，在 distributed training 中低成本 scale |
| Temperature | "tau" | 在 softmax/sigmoid 之前缩放 logits 的 scalar；控制 distribution 的 sharpness |
| Zero-shot | "no-finetune classification" | 使用 text prompts 构建 class Embeddings，并通过 cosine similarity 分类；不在目标 classes 上训练 |
| Prompt template | "a photo of a ..." | 围绕 class name 的文本脚手架；会影响 zero-shot accuracy 1-5 points |
| Dual encoder | "Two-tower" | 一个 image encoder + 一个 text encoder，输出到共享 D-dim space |
| Hard negative | "Tough distractor" | 与 positive 足够相似的 negative，迫使 model 努力将它们分开 |
| Linear probe | "Frozen + one layer" | 只在 frozen features 之上训练一个 linear classifier；衡量 feature quality |
| NaFlex | "Native flexible resolution" | SigLIP 2 的能力：无需 resize 即可摄入任意 aspect ratio 和 resolution 的 images |
| Temperature scaling | "log-parametrized tau" | CLIP 将 `log(1/tau)` 参数化，使 gradients 表现良好；通过 clipping 防止 collapse 到接近零的 tau |

## 延伸阅读
- [Radford et al. — Learning Transferable Visual Models From Natural Language Supervision (arXiv:2103.00020)](https://arxiv.org/abs/2103.00020) giấy CLIP
- [Zhai et al. — Sigmoid Loss for Language Image Pre-Training (arXiv:2303.15343)](https://arxiv.org/abs/2303.15343) SigLIP。
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786) đa ngôn ngữ + NaFlex。
- [Jia et al. — ALIGN (arXiv:2102.05918)](https://arxiv.org/abs/2102.05918) Sử dụng quy mô dữ liệu web ồn ào
- [Cherti et al. — Reproducible scaling laws for contrastive language-image learning (arXiv:2212.07143)](https://arxiv.org/abs/2212.07143) OpenCLIP quy mô luật
