# Đội Red Tooling  Garak, Llama Guard, PyRIT

> 三个生产级工具构成 2026年红队堆的框架──Llama Guard (Meta)  一个Llama-3.1-8B 分类器,基于14个MLCommons 危害类进行调整;2025年的Llama Guard 4 là một 12B 原生多模分类器, từLlama 4 Scout 剪剪而来来──Garak (NVIDIA)  开源LLM漏洞扫描器, cung cấp tĩnh、动态 和适应探测器,用于幻觉, jail data rò rỉ, 毒性 和破裂.

**类型：**Xây dựng
**语言：**Python (stdlib, mô phỏng công cụ kiến trúc và giả mạo phân loại kiểu Llama Guard)
**先修要求：**Giai đoạn 18 · 12-15 (các lần bỏ tù và IPI)
**时间：**~ 75 phút

## Học mục tiêu

- 描述 Llama Guard 3/4 在安全堆中位置:Input classifier、output classifier,或两者兼具──
- Nói ra 14 个 MLCommons 危害类别,并说明一个不明显的类别 (Code Interpreter Abuse)
- 描述 Garak's probe 架构:sondes、detektor、harnesses。
- Mô tả cấu trúc chiến dịch nhiều vòng của PyRIT, cũng như cách nó kết hợp với các thăm dò Garak.

## 问题

Bài học 12-15  trình bày mặt tấn công.

## 概念

### Llama Guard (Meta)

Llama Guard 3 là một mô hình Llama-3.1-8B, nhằm vào MLCommons AILuminate 14 个类别 进行了细节调整:
- Violent crime、非暴力犯罪、性相关、CSAM、谤
- 专业建议、隐私、IP、无差别武器、仇恨
- Tự sát/ tự thương, tình dục, bầu cử, lạm dụng người giải mã

支持 8种语言──用法:放在 LLM 之前(input moderation)、LLM 之后(output moderation),或两者都放──两种用法会产生不同的训练分布  Llama Guard 3 以单一模型形式发布,同时处理两者──

Llama Guard 3-1B-INT4 (arXiv:2411.17713, 440MB, 移动 CPU 上约 ~30 token/s) là quy mô sau của cạnh 变体。

Llama Guard 4 (Làm 4 tháng 4 năm 2025) là 12B、 nguyên sinh đa mô hình, từ Llama 4 Scout  cắt cắt và đến đây── nó sử dụng một phân loại văn bản + hình ảnh có thể nhập, thay thế phiên bản 8B 文本 và 11B vision 版本──

### Garak (NVIDIA)

开源漏洞扫描器──架构:
- **Probes.**用于幻觉、数据泄漏、即时注射、毒性、jailbreaks的攻击生成器──静态(固定提示)、动态(生成提示)、适应的(响应目标输出)。
- **Detectors.**Theo dự đoán thất bại của mô hình đối với xuất khẩu 打分  độc hại, rò rỉ, jailbreak 
- **Harnesses.**管理 probe-detector đối với, vận hành các chiến dịch, tạo báo cáo.

TrustyAI sẽ Garak và Llama-Stack Shields(Prompt-Guard-86M input classifier、Llama-Guard-3-8B output classifier) 集成,用于端到端 shielded-target 评估。Tier-based scoring (TBSA) 取代二元 pass/fail  Một mô hình có thể ở cùng một thăm dò trên thông qua mức độ nghiêm trọng 3, nhưng ở mức độ nghiêm trọng 5 失败。

### PyRIT (Microsoft)

Python Risk Identification Toolkit──多轮红团运动──围绕以下部分构建:
- **Converters.**转换一个种子提示  ngữ pháp, mã hóa, dịch, đóng vai.
- **Orchestrators.**Chiến dịch vận hành:Crescendo(升级) 
- **Scoring.**LLM-as-judge hoặc phân loại-as-judge

PyRIT là Garak 更重的近亲──Garak 运行数千 lần thăm dò đơn vòng;PyRIT 运行 nhiều vòng sâu, nhằm mục đích tấn công vào một mô hình thất bại cụ thể──

### Thống

Trong mô hình, cả hai bên đều đặt Llama Guard. Mỗi đêm chạy Garak, làm sự lùi.

###  đánh giá

- **Judge identity.**三个工具都可以使用 LLM thẩm phán; thẩm phán校准 会驱动报告的ASRs(Lớp 12) ・ 在指定工具的同时指定法官──
- **Probe staleness.**随着模型针对探测被补丁,Garak探测会老化──适应探测器(PAIR hình dạng) hơn các thăm dò tĩnh 老化更慢──
- **Llama Guard 对良性内容的 FPR.**早期Llama Guard 版本会过标记政治和LGBTQ+ 内容;Cơ cấu của Llama Guard 3/4 đã được cải thiện, nhưng không dành riêng cho mỗi phân bố.

### Nó nằm ở vị trí giữa giai đoạn 18

Bài học 12-15 là tấn công. Bài học 16 là sản xuất công cụ. Bài học 17 (WMDP) là đánh giá khả năng sử dụng kép. Bài học 18 là khung an toàn biên giới, chúng đưa những công cụ này bao gồm trong chính sách.


```figure
al-guard-stack
```

## Sử dụng nó

`code/main.py`构建一个玩具Llama Guard-style classifier () 在 14个类别上的关键字 +语义功能) 一个玩具Garak harness (探测器循环),以及一个Pyrit-style多轮转换链──你可以对象模拟目标 运行这些三个工具,并观察不同的覆盖特征──

## 交付 nó

本课会生成 `outputs/skill-red-team-stack.md` Đưa ra một mô tả triển khai, nó sẽ chỉ ra những công cụ nào phù hợp với mỗi công cụ, và vận hành các tần số khấu hình nào.

## 练习

1. 运行 `code/main.py`❖ So sánh Llama-Guard kiểu phân loại trong một vòng tấn công và nhiều vòng tấn công ❖

2. 实现 một tàu thăm dò Garak mới: một yêu cầu gây hại của base64 编码.

3. Sử dụng một "đổi dịch sang tiếng Pháp, sau đó phác thảo" chuyển đổi  mở rộng chuỗi chuyển đổi kiểu PyRIT.

4. 阅读 Llama Guard 3 危害类别列表. Tìm ra hai loại, trong các loại này đào tạo dữ liệu thực tế sẽ tạo ra tỷ lệ dương tính sai cao hơn đối với nội dung của các nhà phát triển hợp pháp.

5. So sánh Garak 和 PyRIT's Design Principles──论证一个部署场景, trong đó mỗi công cụ分别是正确选择──

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| Llama Guard | "the classifier" | 带有 14 个危害类别的 fine-tuned Llama-3.1-8B/4-12B 安全分类器 |
| Garak | "the scanner" | NVIDIA 开源漏洞扫描器；probes、detectors、harnesses |
| PyRIT | "the campaign tool" | Microsoft 多轮 red-team orchestrator；converters、orchestrators、scoring |
| Prompt-Guard | "the small classifier" | Meta 的 86M prompt-injection classifier，与 Llama Guard 配套使用 |
| TBSA | "tier-based scoring" | Garak 的 tier-based pass/fail，用于取代二元结果 |
| Converter chain | "paraphrase + encode + ..." | PyRIT 用于构建多步攻击的组合原语 |
| MLCommons hazard categories | "the 14 taxonomies" | Llama Guard 面向的行业标准分类体系 |

## 延伸阅读

- [Meta — Llama Guard 3 (in Llama 3 Herd paper, arXiv:2407.21783)](https://arxiv.org/abs/2407.21783) 8B 分类器
- [Meta — Llama Guard 3-1B-INT4 (arXiv:2411.17713)](https://arxiv.org/abs/2411.17713) 量化移动端分类器
- [NVIDIA Garak — GitHub](https://github.com/NVIDIA/garak) 扫描器 repo 和文档
- [Microsoft PyRIT — GitHub](https://github.com/Azure/PyRIT) Bộ công cụ chiến dịch
