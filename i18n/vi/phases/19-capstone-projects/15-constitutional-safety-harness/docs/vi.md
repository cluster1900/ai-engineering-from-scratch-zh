# 综合项目 15  Cải chắn an ninh hiến pháp + Đội đội đỏ

> Các phân loại hiến pháp của Anthropic, Llama Guard 4 của Meta, Google ShieldGemma-2 của NVIDIA, và các sản phẩm của Nemotron 3 Content Safety, cũng như X-Guard được sử dụng trong nhiều ngôn ngữ, đã đồng thời xác định được một loạt các phân loại an toàn năm 2026: garak, pyrit, NVIDIA Aegis và promptfoo trở thành một công cụ đánh giá đối lập tiêu chuẩn. NeMo Guardrails v0.12 sẽ kết nối chúng vào đường ống sản xuất.

**类型：**Capstone
**语言：**Python(các đường ống an toàn  đội đỏ YAML  quy định chính sách)
**先修要求：**Giai đoạn 10 (để xây dựng LLM từ零) Giai đoạn 11 (đại học) Giai đoạn 13 (công cụ) Giai đoạn 14 (các đại lý) Giai đoạn 18 (xét lý, an toàn, sự phù hợp)
**涉及阶段：**P10 · P11 · P13 · P14 · P18
**时间：**25 小时

## 问题

Vấn đề tiên phong của an toàn LLM năm 2026 không phụ thuộc vào phân loại liệu có hiệu quả hay không, mà còn phụ thuộc vào cách thức lắp ráp chúng,既不过拒答,也不留下明显漏洞.

攻击演化同样重要──PAIR 和 TAP 自动化发现 jailbreak──GCG 运行基于 Gradient 的后音攻击──Multi-turn 和代码-switch attacks利用代理记忆──任何已部署的 LLM 都需要一个红团队范围,garak 和 PyRIT 是常规驱动器,并且还需要记录减缓和根据CVSS 评分的发现──

Bạn sẽ cố gắng để xác định một ứng dụng mục tiêu (một mô hình được điều chỉnh theo hướng dẫn của 8B, hoặc một chatbot RAG trong các miếng đá cuối khác), đối với các hoạt động của nó 6+ 攻击家族,并产出前/后无害度测量──

## 概念

Đường ống an toàn có 5 tầng.**Input sanitize**:移除零宽字符,解码 base64/rot13,规范化 Unicode。**Policy layer**:NeMo Guardrails v0.12 đường ray ((trên miền、 độc tính、PII khai thác) ]]**Classifier gate**:输入侧使用 Llama Guard 4,非英文使用 X-Guard,图像输入使用 ShieldGemma-2──**Model**: mục tiêu LLM:**Output filter**:输出侧使用 Llama Guard 4,Presidio PII scrub, và适用场景执行报名执法──**HITL tier**: được đánh dấu là một đầu ra có nguy cơ cao vào hàng Slack.

Red-team range 按安排器 运行──PAIR 和 TAP 自主发现 jailbreak──GCG 运行基于 Gradient 的后音攻击──ASCII / base64 / rot13 mã hóa tấn công──Multi-turn attacks(个体采用、记忆利用)──Code-switch attacks(混合英语与斯瓦里或泰语)──每次运行都会产出一个结构化发现文件,包含CVSS分数和披露时间线──

Đánh giá chính trị của bản thân là sự can thiệp thời gian đào tạo.

## 架构

```
request (text / image / multilingual)
      |
      v
input sanitize (strip zero-width, decode, normalize)
      |
      v
NeMo Guardrails v0.12 rails (off-domain, policy)
      |
      v
classifier gate:
  Llama Guard 4 (English)
  X-Guard (multilingual, 132 langs)
  ShieldGemma-2 (image prompts)
  Nemotron 3 Content Safety (enterprise)
      |
      v (allowed)
target LLM
      |
      v
output filter: Llama Guard 4 + Presidio PII + citation check
      |
      v
HITL tier for flagged outputs

parallel:
  red-team scheduler
    -> garak (classic attacks)
    -> PyRIT (orchestrated red team)
    -> autonomous jailbreak agent (PAIR + TAP)
    -> GCG suffix attacks
    -> multilingual / code-switch
    -> multi-turn persona adoption

output: CVSS-scored findings + disclosure timeline + before/after harmlessness delta
```

## 技术

- Các phân loại an toàn:Llama Guard 4 ShieldGemma-2 NVIDIA Nemotron 3 Content Safety X-Guard
- Quản lý Guardrail:NeMo Guardrails v0.12 + OPA
- Các trình điều khiển nhóm đỏ:garak(NVIDIA) PyRIT(Microsoft Azure) NVIDIA Aegis、promptfoo
- Các nhân viên thoát tù:PAIR(Chao et al., 2023)
- Việc đào tạo hiến pháp:Bộ tự phê bình theo phong cách nhân đạo + SFT về phê bình
- PII scrub:Presidio
- Mục tiêu: một mô hình điều chỉnh hướng dẫn 8B, hoặc một chatbot RAG trong các tảng đá khác


```figure
cf-safety-stack
```

##  xây dựng nó

1. **目标设置。**Trong vLLM 上 khởi động một mô hình điều chỉnh hướng dẫn 8B (hoặc sử dụng chatbot RAG khác trong vLLM)

2. **包装 safety pipeline。**周围目标接入五层管道──验证 每层都可单独观测(Langfuse 中每层一个跨度)──

3. **Classifier 覆盖。**加载 Llama Guard 4、X-Guard(Thiên tiếng)、ShieldGemma-2(photos)。在一个小型标记的集合上运行每个分类器,以建立基线──

4. **Red-team scheduler。**Một đại lý PAIR, một đại lý TAP, một người chạy GCG, một kẻ tấn công nhiều lượt và một kẻ tấn công chuyển mã.

5. **Attack suite。**六个攻击家族:(1) PAIR tự động jailbreak,(2) TAP tree-of-attacks,(3) GCG gradient hậu tố,(4) ASCII / base64 / rot13 mã hóa,(5) multi-turn persona,(6) đa ngôn ngữ mã-switch── báo cáo tỷ lệ thành công của mỗi familia──

6. **Constitutional self-critique。**选 1k 个 个 害意的提示──对于每个提示,目标先起草响应──一个评论员 LLM 根据书面宪法(无害、引用证据、拒绝非法请求) 评分──批评者 提出异议的提示 会被重写;目标在批评-改善对上调──在进行评估 上测量前/后无害性──

7. **Over-refusal measurement。**Trong một bộ truy vấn nhanh lành mạnh (ví dụ như XSTest) trên theo dõi tỷ lệ dương tính sai. Mục tiêu phải ở các câu hỏi lành mạnh để giữ hữu ích.

8. **CVSS scoring。**Đối với mỗi jailbreak thành công, theo CVSS 4.0 评分(vêctor tấn công, phức tạp, tác động)  sản xuất thời gian tiết và kế hoạch giảm thiểu.

9. **Range automation。**Trên hết mọi nội dung đều trên cron 上运行; phát hiện 写入队列; quá từ chối báo cáo hồi quy 发送到Slack。

## Sử dụng nó

```
$ safety probe --model=target --family=PAIR --budget=50
[attacker]   PAIR agent running on target
[attack]     attempt 1/50: disguise query as academic research ... blocked
[attack]     attempt 2/50: appeal to roleplay ... blocked
[attack]     attempt 3/50: chain-of-thought coax ... SUCCEEDED
[finding]    CVSS 4.8 medium: roleplay bypass on target
[range]      7 successes out of 50 (14% success rate)
```

## 交付 nó

`outputs/skill-safety-harness.md`Một đường ống an toàn lớp cấp sản xuất, cộng với phạm vi đội đỏ có thể phục hồi,并包含 trước/sau các vùng đống vô hại.

| 权重 | 标准 | 如何测量 |
|:-:|---|---|
| 25 | Attack-surface coverage | 覆盖 6+ 攻击家族、2+ 种语言 |
| 20 | True-positive / false-positive trade-off | Attack block rate vs XSTest benign pass rate |
| 20 | Self-critique delta | held-out eval 上的 before/after harmlessness |
| 20 | Documentation and disclosure | 带 timeline 的 CVSS-scored findings |
| 15 | Automation and repeatability | 所有内容在 cron 上运行并带 alerts |
| **100** | | |

## 练习

1. Trong chatbot RAG 上运行 garak của plugin tiêm nhanh,并比较有无输出过层 时的攻击成功率──

2. 添加第七个攻击家族: thông qua tiêm trực tiếp nhanh chóng các tài liệu được lấy lại.

3. 实现一个 拒绝-with-help 模式:当 guardrail 阻断时,目标提供一个更安全的相关答案,而不是直接拒绝――测量 XSTest delta――

4. Sự chênh lệch về bảo hiểm đa ngôn ngữ: tìm ra một bộ dữ liệu x-guard biểu hiện thiếu ngôn ngữ.

5. Trong mô hình 30B 上运行 tự phê bình hiến pháp,并测量 delta 是否随规模提升──

## 关键术语

| 术语 | 常见说法 | 实际含义 |
|------|-----------------|------------------------|
| Layered safety | “Defense in depth” | 在 input、gate、output、HITL 多处设置 guardrails |
| Llama Guard 4 | “Meta's safety classifier” | 2026 年参考级 input/output content classifier |
| PAIR | “Jailbreak agent” | 关于 LLM-driven jailbreak discovery 的论文（Chao et al.） |
| TAP | “Tree-of-Attacks” | PAIR 的 tree-search 变体 |
| GCG | “Greedy coordinate gradient” | 基于 Gradient 的 adversarial suffix attack |
| Constitutional self-critique | “Anthropic-style training” | Target drafts -> critic scores -> rewrite -> retrain |
| XSTest | “Benign probe set” | 用于 over-refusal regression 的 benchmark |
| CVSS 4.0 | “Severity score” | safety findings 的标准 vulnerability scoring |

## 延伸阅读

- [Anthropic Constitutional Classifiers](https://www.anthropic.com/research/constitutional-classifiers) Tiêu chuẩn thời gian đào tạo
- [Meta Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/) 2026 năm phân loại đầu vào/phục xuất
- [Google ShieldGemma-2](https://huggingface.co/google/shieldgemma-2b) hình ảnh + An toàn đa phương tiện
- [NVIDIA Nemotron 3 Content Safety](https://developer.nvidia.com/blog/building-nvidia-nemotron-3-agents-for-reasoning-multimodal-rag-voice-and-safety/) Khán giả doanh nghiệp
- [X-Guard (arXiv:2504.08848)](https://arxiv.org/abs/2504.08848) 132-lời ngữ An toàn đa ngôn ngữ
- [garak](https://github.com/NVIDIA/garak) NVIDIA red-team toolkit
- [PyRIT](https://github.com/Azure/PyRIT) Microsoft Red Team framework
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) Quản lý đường sắt
- [PAIR (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) giấy tờ của nhân viên jailbreak
