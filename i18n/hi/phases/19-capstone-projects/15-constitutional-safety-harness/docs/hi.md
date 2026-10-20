# 综合项目 15  संवैधानिक सुरक्षा शस्त्रागार + रेड-टीम रेंज

> मानव जाति के संवैधानिक वर्गीकरणकर्ता, मेटा के लामा गार्ड 4、 गूगल के शील्डगेमा-2、एनवीडीआईए के नेमोट्रॉन 3 सामग्री सुरक्षा, साथ ही बहुभाषी  कवर करने वाले एक्स गार्ड ने 2026 के लिए सुरक्षा-वर्गीकरण स्टैक को परिभाषित किया है।

**类型：**कैपस्टोन
**语言：**Python(सुरक्षा पाइपलाइन、रेड टीम)、YAML(नीति कॉन्फ़िग)
**先修要求：**चरण 10 (零构建LLM) ‧चरण 11 (LLM इंजीनियरिंग) ‧चरण 13 (उपकरण) ‧चरण 14 (एजेंट) ‧चरण 18 (नैतिकता、सुरक्षा、अनुरूपता)
**涉及阶段：**P10 · P11 · P13 · P14 · P18
**时间：**25 小时

## 问题

2026 में एलएलएम सुरक्षा का अग्रिम मुद्दा, वर्गीकरणकर्ता पर निर्भर नहीं है या नहीं प्रभावी है, बल्कि यह है कि उत्पादन ऐप के आसपास कैसे सही रूप से उन्हें संयोजित किया जाए, पहले से ही अत्यधिक अस्वीकार किया गया है, न ही स्पष्ट त्रुटि छोड़ दी गई है।

攻击演化同样重要──PAIR 和 TAP 自动化发现 jailbreak──GCG 运行基于 Gradient 的后音攻击──多转和代码-开关攻击利用代理记忆──任何已部署的LLM 都需要一个红团队范围,garak 和 PyRIT 是正规的驱动程序,并且还需要记录减缓和根据CVSS 评分的发现──

आप एक लक्ष्य अनुप्रयोग को स्थापित करेंगे, एक 8B निर्देश-ट्यून मॉडल, या अन्य capstones में से एक RAG चैटबॉट), इसके संचालन के लिए 6+ 攻击家族,并产出前/पश्चात हानिरहितता मापण──

## 概念

सुरक्षा पाइपलाइन के पांच स्तर हैं।**Input sanitize**: हटाना शून्य-चौड़ाई के अक्षर,解码 आधार64/रोट13,规范化 यूनिकोड──**Policy layer**:NeMo Guardrails v0.12 रेलों ((गैर डोमेन  विषमता  पीआईआई निष्कर्षण) **Classifier gate**:输入侧使用Llama Guard 4,非英文使用X-Guard,图像输入使用ShieldGemma-2──**Model**: लक्ष्य LLM。**Output filter**:输出侧使用Llama Guard 4,Presidio PII scrub, और适用场景执行引文执法──**HITL tier**: उच्च जोखिम के लिए चिह्नित किया गया है के लिए बाहर निकालने में Slack कतार में प्रवेश करें

रेड-टीम रेंज अनुसूचक 运行。PAIR 和 TAP 自主发现 jailbreak。GCG 运行基于 Gradient के प्रत्यय हमले。ASCII / base64 / rot13 एन्कोडिंग हमले。 मल्टी-टर्न हमले。व्यक्तिगत स्वीकृति、मेमोरी शोषण)。 कोड स्विच हमले(混合英语与 Swahili या थाई)。 प्रत्येक बार运行都会产出一个结构化发现文件,包含CVSS स्कोरिंग和披露时间线──

संवैधानिक-स्व-आलोचना दौड़ है प्रशिक्षण-समय हस्तक्षेप──Take 1k 个 हानिकारक-प्रयास संकेत,让模型 起草响应,根据书面宪法(Do-not-harm rules) आलोचना करें, और आलोचना लूप上 retrain──在持续 eval 上测量 before/after harmlessness delta──

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

- सुरक्षा वर्गीकरणःलामा गार्ड 4 ∙ShieldGemma-2 ∙NVIDIA Nemotron 3 सामग्री सुरक्षा ∙X-गार्ड
- गार्डरेल फ्रेमवर्क:NeMo गार्डरेल v0.12 + OPA
- रेड-टीम ड्राइवर:garak(NVIDIA) ✓PyRIT(Microsoft Azure) ✓NVIDIA Aegis、promptfoo
- जेल ब्रेक एजेंट:PAIR(Chao et al., 2023)
- संवैधानिक प्रशिक्षणःमानव शैली की आत्म-आलोचना लूप + आलोचना पर एसएफटी
- पीआईआई स्क्रब: प्रेसिडियो
- लक्ष्यः एक 8B निर्देश-ट्यून मॉडल, या अन्य capstones में एक RAG चैटबॉट


```figure
cf-safety-stack
```

##  इसे निर्माण

1. **目标设置。**एक 8B निर्देश-ट्यून मॉडल को प्रारंभ करें या एक और कैपस्टोन के भीतर RAG चैटबॉट का उपयोग करें।

2. **包装 safety pipeline。**周围目标连接五层管道――验证每一层都可单独观测(लंगफ्यूज में प्रत्येक层一个跨度)

3. **Classifier 覆盖。**加载 लामा गार्ड 4、X-गार्ड(बहुभाषी)、ShieldGemma-2(छवि)──在一个小型标签集上运行每个分类器,以建立基线──

4. **Red-team scheduler。**调度 garak、PYRIT、 एक PAIR एजेंट、 एक TAP एजेंट、 एक GCG धावक、 एक बहु-टर्न हमलावर तथा एक कोड-स्विच हमलावर── प्रत्येक व्यक्ति एक अलग कतार में है।

5. **Attack suite。**六个攻击家族:(1) PAIR स्वचालित जेलब्रेक,(2) TAP पेड़-ऑफ-आक्रमण,(3) GCG ग्रेडिएंट प्रत्यय,(4) ASCII / base64 / rot13 एन्कोडिंग,(5) मल्टी-टर्न पर्सन,(6) बहुभाषी कोड-स्विच── रिपोर्ट प्रत्येक परिवार की सफलता दर──

6. **Constitutional self-critique。**选 1k 个有害企图提示──对于每一个提示,目标先起草响应──一个评论员 根据书面宪法(无害、引用证据、拒绝非法请求) 评分──批判者 提出异议的提示 会被重写;目标在批判-改善对上细调──在进行的评估上测量前/后无害性──

7. **Over-refusal measurement。**में सौम्य शीघ्र सूट (उदाहरण के लिए XSTest) पर झूठी सकारात्मक दर का पालन करना। लक्ष्य को सौम्य प्रश्नों में ऊपर मददगार रहना चाहिए।

8. **CVSS scoring。**प्रत्येक सफल जेलब्रेक के लिए, CVSS 4.0 评分 के अनुसार, हमला वेक्टर, जटिलता, प्रभाव) ∙

9. **Range automation。**ऊपर सभी सामग्री सभी में क्रॉन ऊपर चल रहा है; खोजें  लिखने में कतार; ओवर-निषेध regression अलर्ट Slack पर भेज दिया गया है。

## इसका उपयोग करें

```
$ safety probe --model=target --family=PAIR --budget=50
[attacker]   PAIR agent running on target
[attack]     attempt 1/50: disguise query as academic research ... blocked
[attack]     attempt 2/50: appeal to roleplay ... blocked
[attack]     attempt 3/50: chain-of-thought coax ... SUCCEEDED
[finding]    CVSS 4.8 medium: roleplay bypass on target
[range]      7 successes out of 50 (14% success rate)
```

## 交付 यह

`outputs/skill-safety-harness.md`यह एक उत्पादन स्तर की परतों वाली सुरक्षा पाइपलाइन है, जिसमें रेड-टीम रेंज शामिल है, जिसमें हानिरहितता डेल्टा से पहले/बाद में शामिल है।

| 权重 | 标准 | 如何测量 |
|:-:|---|---|
| 25 | Attack-surface coverage | 覆盖 6+ 攻击家族、2+ 种语言 |
| 20 | True-positive / false-positive trade-off | Attack block rate vs XSTest benign pass rate |
| 20 | Self-critique delta | held-out eval 上的 before/after harmlessness |
| 20 | Documentation and disclosure | 带 timeline 的 CVSS-scored findings |
| 15 | Automation and repeatability | 所有内容在 cron 上运行并带 alerts |
| **100** | | |

## अभ्यास

1. RAG चैटबॉट में ऊपर चल रहा है गाराक का शीघ्र-इंजेक्शन प्लगइन,并比较有无输出-过器层 时的攻击成功率──

2. 添加第七个攻击家族: प्राप्त दस्तावेजों के अप्रत्यक्ष शीघ्र इंजेक्शन के माध्यम से

3.  एक refuse-with-help  मोड को प्राप्त करनाः जब गार्डरेल 阻断 होता है, तो लक्ष्य एक अधिक सुरक्षित संबंधित उत्तर प्रदान करता है, न कि सीधे अस्वीकार करता है।

4. बहुभाषी कवरेज अंतरः एक X-Guard अभिव्यक्ति अभाव की भाषा का पता लगाने के लिए एक चेहरे की ओर एक बारीक-ट्यूनिंग डेटासेट का प्रस्ताव करना।

5. 30B मॉडल में संवैधानिक आत्म-आलोचना का संचालन किया गया है,并测量 delta 是否随规模提升──

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

- [Anthropic Constitutional Classifiers](https://www.anthropic.com/research/constitutional-classifiers) प्रशिक्षण समय संदर्भ
- [Meta Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/) 2026 साल इनपुट/आउटपुट वर्गीकरण
- [Google ShieldGemma-2](https://huggingface.co/google/shieldgemma-2b) छवि + बहुआयामी सुरक्षा
- [NVIDIA Nemotron 3 Content Safety](https://developer.nvidia.com/blog/building-nvidia-nemotron-3-agents-for-reasoning-multimodal-rag-voice-and-safety/) उद्यम संदर्भ
- [X-Guard (arXiv:2504.08848)](https://arxiv.org/abs/2504.08848) 132 भाषाएँ बहुभाषी सुरक्षा
- [garak](https://github.com/NVIDIA/garak) NVIDIA रेड-टीम टूलकिट
- [PyRIT](https://github.com/Azure/PyRIT) माइक्रोसॉफ्ट रेड टीम फ्रेमवर्क
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) रेल ढांचा
- [PAIR (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) जेल ब्रेक एजेंट पेपर
