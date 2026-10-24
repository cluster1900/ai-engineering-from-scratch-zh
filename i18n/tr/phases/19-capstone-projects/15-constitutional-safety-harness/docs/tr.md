# 综合项目 15  Anayasa Güvenliği Harness + Red-Team Range

> Anthropic'in Antropic'in Anayasa sınıflandırıcıları, Meta'nın Llama Guard 4、Google'ın ShieldGemma-2、NVIDIA'nın Nemotron 3 İçerik Güvenliği, yanı sıra çok dilli  kapsamlı X-Guard, 2026 yılına yönelik güvenlik sınıflandırıcıları yığınını  garak、PyRIT、NVIDIA Aegis 和 promptfoo  standart bir karşı karşı karşı değerlendirme  araç olarak  NeMo Guardrails v0.12 onları üretim borusuna bağlayacak. Bu baş taşı tüm içeriği bir araya getirecek: hedef uygulamayı çevreleyerek katmanlı güvenlik kemeri inşa etmek, 6+                                                                                                                                                                                                                                                                                                                                                                        

**类型：**Kap taşı
**语言：**Python(güven hattı、kırmızı ekip)、YAML(politik yapılandırmaları)
**先修要求：**10 aşama (sıradan inşaat LLM)  11 aşama (LLM mühendisliği)  13 aşama (örnekler)  14 aşama (ajanlar)  18 aşama (etik, güvenlik, uyum)
**涉及阶段：**P10 · P11 · P13 · P14 · P18
**时间：**25 saat

## 问题

2026 yılında LLM güvenliği ön kenarında olan sorun, sınıflandırıcı değil değil değildirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdirdir

攻击演化同样重要──PAIR 和 TAP 自动化发现 jailbreak──GCG 运行基于 Gradient 的后音攻击──Multi-turn 和 code-switch attacks 利用代理内存──任何已部署的 LLM 都需要一个红团队范围,garak 和 PyRIT 是可典驱动,并且还需要记录减缓和根据 CVSS 评分的发现──

Siz bir hedef uygulamasını kurmaya başlayacaksınız. Bu uygulama, 8B talimatları ile ayarlanmış bir model veya diğer baş taşılardan biri olan RAG chatbot'u oluşturur.

## 概念

Güvenlik boru hattı beş katlı.**Input sanitize**:移除零宽字符,解码 base64/rot13,规范化 Unicode──**Policy layer**NeMo Guardrails v0.12 rayları ((domain dışı ‒toksiklik ‒ PII çıkarımı)**Classifier gate**:输入侧使用Llama Guard 4,非英文使用X-Guard,图像输入使用ShieldGemma-2──**Model**: hedef LLM。**Output filter**Llama Guard 4, Presidio PII scrub kullanın ve sitasyon uygulanması için kullanın.**HITL tier**: high risk için işaretli çıkış Slack sırasına girmek için

Red-team aralığı 按安排者 运行──PAIR 和 TAP 自主发现 jailbreak──GCG 运行基于 Gradient 的后音攻击──ASCII / base64 / rot13 kodlama saldırıları──Multi-turn saldırıları──persona adoption、memory exploitation──Code-switch saldırıları──混合英语与斯瓦希里或泰语)──每次运行都会产出一个结构化发现文件,包含CVSS puanlaması和披露时间线──

Anayasa-kendini eleştirme koşulu eğitim-zaman müdahalesi ⋅ alın 1k 个 个 害-çaban istekleri,让模型 起草响应,根据书面宪法(do-not-harm rules) eleştirme yapın, ve eleştirme döngüsü 上 retraining──在保持 eval 上测量 before/after harmlessness delta──

## Yapılandırma

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

- Güvenlik sınıflandırıcıları:Llama Guard 4 ‒ShieldGemma-2 ‒NVIDIA Nemotron 3 İçerik Güvenliği ‒X-Gard
- Gardail Framework:NeMo Guardrails v0.12 + OPA
- Kırmızı takım sürücüleri:garak(NVIDIA)、PyRIT(Microsoft Azure)、NVIDIA Aegis、promptfoo
- Hapishane kaçakçıları:PAIR(Chao et al., 2023)
- Antropik tarzlı kendi eleştirisi döngüsü + eleştirilerde SFT
- PII scrub: Presidio
- Hedef: 8B talimatlı bir model veya diğer baş taşılar arasında bir RAG chatbot


```figure
cf-safety-stack
```

## Yapın onu.

1. **目标设置。**VLLM'de bir 8B talimat ayarlı modeli başlatmak için, bir diğer baş taşı içindeki RAG chatbot kullanın.

2. **包装 safety pipeline。**周围目标接入五层管道――验证 每一层都可单独观测(Langfuse 中每层一个跨度) 』

3. **Classifier 覆盖。**Ünlü dillerde kullanılan Llama Guard 4 ̊X-Guard ̊ShieldGemma-2 ̊image ̊.

4. **Red-team scheduler。**调度 garak、PYRIT、 PAIR ajanı、TAP ajanı、GCG koşucu、 çok dönüşlü saldırganı, kod değiştiren saldırganı── herkes tek başına sırada.

5. **Attack suite。**六个攻击家族:(1) PAIR otomatik hapishane,(2) TAP ağaç saldırıları,(3) GCG gradient sufixi,(4) ASCII / base64 / rot13 kodlama,(5) çok dönüşlü persona,(6) çok dilli kod değiştirme── rapor her aile başarısı oranı──

6. **Constitutional self-critique。**选 1k 个有害试图提示──对于每个提示,目标先起草响应──一个评论员 根据书面宪法(无害、引用证、拒绝非法请求) 评分──批判者 提出异议的提示 会被重写;目标在批判-改善对上细调──在保持的评估上测量前/后无害性──

7. **Over-refusal measurement。**Bu nedenle, bu testlerin en iyi sonuçları, yanlış pozitif oranı takip etmesi ve bu testlerin en iyi sonuçları ile sonuçlanması için kullanılır.

8. **CVSS scoring。**Her başarılı jailbreak için, CVSS 4.0 评分  saldırı vektörü、 karmaşıklık、 etkisi)  açıklama zaman çizelgesi ve azaltma planı 

9. **Range automation。**Daha fazla tüm içerik hepsi cron üzerinde; bulgular  yazı kuyruk; aşırı reddedilen geri dönüş uyarıları  Slack'e gönderilmiştir。

## Kullan

```
$ safety probe --model=target --family=PAIR --budget=50
[attacker]   PAIR agent running on target
[attack]     attempt 1/50: disguise query as academic research ... blocked
[attack]     attempt 2/50: appeal to roleplay ... blocked
[attack]     attempt 3/50: chain-of-thought coax ... SUCCEEDED
[finding]    CVSS 4.8 medium: roleplay bypass on target
[range]      7 successes out of 50 (14% success rate)
```

## - Söyle.

`outputs/skill-safety-harness.md`Bu, bir üretim derecesindeki katmanlı güvenlik borusu, ayrıca kırmızı ekip aralığı, ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ 

| 权重 | 标准 | 如何测量 |
|:-:|---|---|
| 25 | Attack-surface coverage | 覆盖 6+ 攻击家族、2+ 种语言 |
| 20 | True-positive / false-positive trade-off | Attack block rate vs XSTest benign pass rate |
| 20 | Self-critique delta | held-out eval 上的 before/after harmlessness |
| 20 | Documentation and disclosure | 带 timeline 的 CVSS-scored findings |
| 15 | Automation and repeatability | 所有内容在 cron 上运行并带 alerts |
| **100** | | |

## 练习

1. RAG chatbot 上运行 garak'ın hızlı enjeksiyon eklentisi,并比较有无输出过器层 时的攻击成功率──

2. 添加第七个攻击家族: Yaptığım belgeleri indirekt olarak enjekte etmek için gerekli ekstra savunmayı ölçmek için.

3.  reddetme ile yardım  modelini gerçekleştirmek:  gardail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

4. Çok dilli kapsam boşluğu: bir X-Guard 表现不足的语言―― bir yüzünü ortaya koymak için ince ayarlanmış bir veri kümesi――

5. 30B modelinde, anayasa kendi kendini eleştirme,并测量 delta 是否随规模提升──

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

- [Anthropic Constitutional Classifiers](https://www.anthropic.com/research/constitutional-classifiers) Eğitim zaman referansı
- [Meta Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/) 2026 yıl giriş/çıktı sınıflandırıcısı
- [Google ShieldGemma-2](https://huggingface.co/google/shieldgemma-2b) görüntü + Çok modal güvenlik
- [NVIDIA Nemotron 3 Content Safety](https://developer.nvidia.com/blog/building-nvidia-nemotron-3-agents-for-reasoning-multimodal-rag-voice-and-safety/) Kurumsal referans
- [X-Guard (arXiv:2504.08848)](https://arxiv.org/abs/2504.08848) 132 dil Çok dilli güvenlik
- [garak](https://github.com/NVIDIA/garak) NVIDIA kırmızı takım araç kümesi
- [PyRIT](https://github.com/Azure/PyRIT) Microsoft Red Team Framework
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) Demiryolu çerçevesini
- [PAIR (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) Cezaevi hapishanesi ajanı kağıdı
