# Emu3: được sử dụng để tạo hình ảnh và video dự đoán tiếp theo

> BAAI's Emu3(Wang et al.,2024 年 9 月) là kết quả của cuộc tranh chấp ưa thích và tự do phân tán 之争的2024年本应终结 Diffusion与autoregressive之争的结果── một bộ biến thể đơn lẻ kiểu Llama-style decoder-only Transformer, chỉ tập luyện trên dự đoán token tiếp theo 目标, bao gồm văn bản + token hình ảnh VQ + token video 3D VQ 统一词汇, trên hình ảnh tạo ra đánh bại SDXL, trên cảm giác đánh bại LLaVA-1.6── không có CLIP mất── không có kế hoạch phân tán miễn phí──Classifier không có hướng dẫn trong lý luận được sử dụng để nâng cao chất lượng, nhưng đó là mục tiêu tập trung tập luyện là đưa giáo viên bắt buộc dự đoán token tiếp theo── được xuất bản trên tạp chí.

**Type:** Learn
**语言：**Python(stdlib,3D video tokenizer toán + mô hình mẫu tự rút)
**Prerequisites:** Phase 12 · 11（Chameleon）
**Time:** ~120 分钟

## Học mục tiêu
- 解释 tại sao mục tiêu của Emu3 chỉ số mất mát duy nhất có thể hoạt động, mặc dù từ lâu người ta đã giả định chất lượng hình ảnh cần sự pha trộn.
- Mô tả 3D video tokenizer:spatiotemporal VQ codebook 是什么样子,为什么补丁 会跨越时间──
- So sánh Emu3 với Stable Diffusion XL trong đào tạo tính toán                                                                                                                                                                                                                                                       
- Nói ra cùng một mô hình Emu3 扮演的三个角色:Emu3-Gen(image gen) 、Emu3-Chat(perception) 、Emu3-Stage2(video gen) 。

## 问题
截至 2024 năm quan điểm truyền thống là: hình ảnh tạo cần sự phân tán. Ước điểm của nó là: các mã thông báo hình ảnh riêng biệt sẽ mất quá nhiều thông tin, không thể xây dựng lại các chi tiết, trong khi việc lấy mẫu tự rút sẽ có hàng ngàn mã thông báo trên sự tích lũy sai lầm.

Emu3 正面挑战这个论点──它的主张是: Better Visual Tokenizer + 足够的规模 + 下一个代码损失 = Trong mô hình cùng một cũng có thể làm cảm giác,实现击败 Diffusion 的图像生成──

Nó được xuất bản trong thời gian này đã có nhiều tranh cãi. Hai năm sau, mở nguồn gia đình thế hệ thống nhất (Emu3、Show-o、Janus-Pro、Transfusion) đã trở thành một phương pháp nghiên cứu được chấp nhận; các mô hình giới hạn cấp sản xuất dường như cũng sử dụng một số biến thể.

## 概念
### Chiếc token Emu3

关键成分是视觉Tokenizer──Emu3 训练一个定制 IBQ-class Tokenizer(Inverse Bottleneck Quantizer,SBER-MoVQGAN family), mỗi token làm 8x8 độ phân giải- giảm──一张 512x512 图像会变成64x64 = 4096 token, mã sách kích thước 为 32768──

Đây là một trong những điểm mạnh của các mã thông báo của các mã thông báo trong K=8192 时, có 1024 mã thông báo lớn hơn, nhưng mỗi mã thông báo rẻ hơn, có thể được sử dụng để tìm kiếm các mã thông báo nhỏ hơn, có thể được sử dụng để tạo ra các mã thông báo.

Đối với video: 3D VQ Tokenizer sẽ được mã hóa cho một số lượng toàn bộ. Một clip 4s, 8 FPS, có 32 khung hình. Trong 256x256、4x không gian và 4x giảm thời gian, số lượng token là (256/4) * (256/4) * (32/4) = 64 * 64 * 8 = 32,768 token.

Tokenizer chất lượng là giới hạn trên.

### Việc đào tạo một lần mất

Emu3 sử dụng một mục tiêu: trong ký hiệu văn bản, ký hiệu hình ảnh 2D và ký hiệu video 3D chia sẻ từ vựng trên làm dự đoán ký hiệu tiếp theo trong thời gian tập luyện sẽ theo các yếu tố cụ thể về phương thức nhân trọng lượng để cân bằng đóng góp, nhưng hàm mất là giống nhau.

训练数据混合 bao gồm:
- Gen hình ảnh:`<text caption> <image> image_tokens </image>`
- Nhận thức hình ảnh:`<image> image_tokens </image> <question> text_tokens`
- Video Gen:`<text caption> <video> video_tokens </video>`
- Video nhận thức: similar。
- Chỉ văn bản: tiêu chuẩn NTP。

模型会从数据分布中学习何时输出图像代币何时输出文本代币――生成能力来自模型在`<image>`标签后预测 hình ảnh token

### Chỉ dẫn không có phân loại và nhiệt độ

Autoregressive 图像生成在推理时使用分类器免 guide(CFG) 会好很多──Emu3 đã sử dụng nó:生成两次,一次使用完整标题,一次使用空标题,然后使用指导权重 混合 logits(典型值 3.0-7.0)──这是 Diffusion 使用的同一个CFG 技巧,借用到了autoregressive 设置中──

Nhiệt độ  rất quan trọng: quá cao sẽ tạo ra bóng giả; quá thấp sẽ làm suy sụp chế độ.

### Ba vai, một mô hình

Emu3 có 3 chức năng khác nhau trên các API, nhưng tầng dưới cùng là một bộ trọng lượng:

- Emu3-Gen──图像生成──输入文本,输出图像代币──
- Emu3-Chat──VQA 和 captioning──输入图像(tokens),输出 văn bản──
- Emu3-Stage2──视频生成和视频 VQA──输入文本或视频,输出文本或视频──

Không có các tiêu đề cụ thể về nhiệm vụ. Chỉ có các mẫu đơn giản khác nhau.

### Điểm chuẩn

Từ bài báo Emu3 ((2024 年 9 月):

- 图像生成: 在 MJHQ-30K FID(5.4 vs 5.6)、GenEval tổng thể(0.54 vs 0.55,统计上打平) và Deep-Eval của hợp chất 上 đạt được tương đương mức hoặc tốt hơn, vượt qua SDXL。
- 图像感知: 在 VQAv2(75.1 vs 72.4) 上超过LLaVA-1.6, 在 MMMU 上大致持平──
- 视频生成:4-second-clip 质量在 FVD 上与 Sora-era 具有竞争力──

Những con số này không phải lúc nào cũng là thắng, Em sẽ ở đây nhiều hơn một分, còn ở đó ít hơn một分, nhưng dự đoán mã thông báo tiếp theo là tất cả những gì bạn cần.

### Chi phí tính toán

Emu3 sử dụng mô hình tham số 7B, trong khoảng 300 tỷ mã thông báo đa phương thức 上练――GPU-hours 大致相当于Llama-2-7B pretraining(A100-class silicon 上 2k-4k GPU-years) ――Stable Diffusion 3 这样 Diffusion models 训练预算类似,但需要独立的文本编码和更复杂的管道――

推理时,Emu3 每张图像比 SDXL 慢:4096 hình ảnh token,以 30 tok/s 计算,大约每张 512x512 图像 2 分钟,而 SDXL 为 2-5 秒.

### Tại sao nó quan trọng

Đó là một cách có thể thực hiện được. Mô hình tương lai không cần các mã hóa văn bản độc lập, lập trình lập trình phân phối độc lập, lập trình phân phối độc lập, một biến thể, mỗi phương pháp một Tokenizer, sau đó mở rộng quy mô.

Show-o、Janus-Pro 和 InternVL-U đều được xây dựng trên luận điểm này, hoặc đưa ra thách thức cho nó.


```figure
l5-emu3-next-token
```

## Sử dụng nó
`code/main.py` xây dựng hai đồ chơi:

- Một 2D vs 3D VQ Tokenizer số lượng máy tính: given ((định nghĩa, bản vá, độ dài của clip, FPS), tính toán hình ảnh và video của Token số.
- Một hướng dẫn không có phân loại và mô hình tự rút của nhiệt độ.

CFG thực hiện phù hợp với Emu3 của các phương pháp, tức là sử dụng trọng lượng hướng dẫn 混合 conditional 和 unconditional logits。

## 交付 nó
本课产 出 `outputs/skill-token-gen-cost-analyzer.md` Đưa ra một quy tắc sản phẩm sản xuất (图像或视频、目标分辨率、质量层、延迟预算), nó sẽ tính toán số lượng token、推理成本, và đưa ra lựa chọn giữa Emu3 family và Diffusion 

## 练习
1. Emu3 trong giảm 8x8 下, mỗi张 512x512 图像 tạo ra 4096 token──计算 1024x1024 và 2048x2048 số lượng tương đương giá──推理延迟会发生什么?

2. 阅读 Emu3 Phần 3.3 trong Nội dung về video tokenizer.

3. Đánh nặng hướng dẫn không phân loại 5.0 vs 3.0: hiệu ứng hình ảnh có sự thay đổi gì? theo dõi `code/main.py`Trung học Phương pháp toán học

4. 计算 Emu3-7B trong 300B token 下的训练 FLOPs,并与稳定扩散3比较──哪个训练成本更高?

5. Emu3 trên FID vượt qua SDXL, nhưng trên VQAv2 trên không giống như VLM chuyên nghiệp.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Next-token prediction | "NTP" | 标准 autoregressive loss：给定 token[0..i] 预测 token[i+1]；tokenized 后适用于每种 modality |
| IBQ tokenizer | "Inverse bottleneck quantizer" | 一类 VQ-VAE，codebooks 更大（32768+），重建效果优于 Chameleon 的 Tokenizer |
| 3D VQ | "Spatiotemporal quantizer" | 由（time、row、col）索引的 codebook；一个 Token 覆盖一个 4x4x4 pixel cube |
| Classifier-free guidance | "CFG" | 用 weight gamma 混合 conditional 和 unconditional logits；在推理时提升图像质量 |
| Unified vocabulary | "Shared tokens" | Text + image + video 都来自同一个 integer space；模型预测接下来出现的任何 modality |
| MJHQ-30K | "Image gen benchmark" | 含 30k prompts 的 Midjourney-quality benchmark；Emu3 在这里报告 FID |

## 延伸阅读
- [Wang et al. — Emu3: Next-Token Prediction is All You Need (arXiv:2409.18869)](https://arxiv.org/abs/2409.18869)
- [Sun et al. — Emu: Generative Pretraining in Multimodality (arXiv:2307.05222)](https://arxiv.org/abs/2307.05222)
- [Liu et al. — LWM (arXiv:2402.08268)](https://arxiv.org/abs/2402.08268)
- [Yu et al. — MAGVIT-v2 (arXiv:2310.05737)](https://arxiv.org/abs/2310.05737)
- [Tian et al. — VAR (arXiv:2404.02905)](https://arxiv.org/abs/2404.02905)
