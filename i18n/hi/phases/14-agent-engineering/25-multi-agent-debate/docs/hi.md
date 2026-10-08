# बहु-एजेंट बहस और सहयोग

> Du et al. ((ICML 2024,Society of Minds) ने N 个模型实例, इन उदाहरणों को पहले स्वतंत्र रूप से उत्तर प्रस्तुत किया, फिर R 轮中相互代批判, प्राप्ति को प्राप्त करने के लिए प्राप्त── यह वास्तविकता को उन्नत कर सकता है、 नियम-अनुपालन और तर्कवितर्क──Sparse topology 在 टोकन 成本上优于全网──

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 12（Workflow Patterns），Phase 14 · 05（Self-Refine and CRITIC）
**Time:** ~60 分钟

## 学习目标
-  व्याख्या बहस प्रोटोकॉल:N 个 प्रस्तावक  轮,并收到一个共享答案──
- 描述为什么辩论 能提升事实性、规则-अनुपालन 和推理──
-  व्याख्या दुर्लभ टॉपॉलजीः नहीं हर बहस करने वाले को अन्य सभी बहस करने वालों को देखने की आवश्यकता है
- लिपिबद्ध LLM 上实现一个 stdlib बहस, समाहित पूर्ण- जाल 和稀少变体; माप टोकन 成本与精度──

## 问题
आत्म-संशोधन (Self-Refine) एक आलोचनात्मक मॉडल है स्वयं, समूह विचार है 风险――CRITIC (Self-Refine) 风险――CRITIC (Self-Refine) 风险──CRITIC (Self-Refine) 风险──CRITIC (Self-Refine) 风险──CRITIC (Self-Refine) 风险──CRITIC (Self-Refine) 风险──CRITIC (Self-Refine) 风险──CRITIC (Self-Refine) 风险──CRITIC (Self-Refine) ⇒Critic (Self-Refine) ⇒Critic (Self-Refine) ⇒Critic (Self-Refine) ⇒Critic (Self-Refine) ⇒Critic (Self-Refine) ⇒Critic (Self-Refine) ⇒Critic (Self-Refence) ⇒Critic (Self-Refence) ⇒Critic (Self-Refence) ⇒) ⇒ (Self-Refence) ⇒ (Self-Refence) ⇒ (Self-Refence) ⇒ (Self-Refence) ⇒) ⇒ (Self-Reffect) ⇒ (Self-Reffect) ⇒ (Self-Reffect) ⇒) (Self-Reffect) (Self-Reffect) (Self-Reffect) (Self-Reffect) (Self-R) (Self-R) (Self-R) (Self) (Self-R) (Self-R) (Self) ), (Self-R) (Self-R) (Self) (Self) (Self-R) (Self) (Self) (Self) (S)) (स) (स) (स) (स) (स))))) (स)) (स)) (स)))) (स)) (स)))) (स)) (स)) (स))

## 概念
### सोसाइटी ऑफ माइंड्स (Du et al., ICML 2024)

- एक ही प्रश्न के उत्तरों को स्वतंत्र रूप से प्रस्तुत करने के लिए N 个模型例
- R 轮中, प्रत्येक मॉडल अन्य मॉडल के प्रस्तावों को पढ़ता है और उन्हें आलोचना करता है।
- 模型根据批评 更新自己的答案──
- R 轮后,返回收后的答案──

मूल प्रयोगों में लागत पर विचार करने के लिए N=3、R=2── पर कठिनाई के मुद्दों पर प्रयोग किया गया था।

क्रॉस-मोडल 组合优于单模型辩论:ChatGPT + Bard 组合 > 任一单独模型──

### स्पायर टॉपॉलजी

स्पायर कम्युनिकेशन टॉपलॉजी के साथ मल्टी-एजेंट बहस में सुधार(arXiv:2406.11776,2024-2025) से पता चलता है, पूर्ण-मेश बहस 并不总是最优优──स्पायर टॉपलॉजीज(स्टार、रिंग、हब-एंड-स्पोक) का उपयोग करके कम टोकन 成本 तक पहुंचने की क्षमता है── प्रत्येक बहसकर्ता केवल अपने साथियों का एक वर्ग को देखता है──

 प्रभावः

- पूर्ण जाल N=5,R=3 = 5 × 3 = 15 个 प्रस्ताव, प्रत्येक都读取 4 个同行 = 60 बार आलोचनात्मक कार्य──
- स्टार N=5,R=3 ((एक हब + 4 个 个 个) = 15 个 प्रस्ताव, 个 个 个, 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 

### जब बहस मदद करती है

- **Factuality。**N 个独立提案,क्रॉस-चेक  कमी होश
- **Rule-following。**शतरंज चाल वैधता में, एक मॉडल नियम खो देता है, अन्य मॉडल पकड़ लेंगे।
- **Open-ended reasoning。**कई प्रकार के ढांचे को सही उत्तर तक संकुचित किया जाएगा।

### जब बहस दर्द करती है

- **Latency-sensitive UX。**N × R 个串行轮次会产生你可能无法承受的延迟──
- **Cost-sensitive scale。**प्रत्येक समस्या को N × R टोकन की आवश्यकता होती है
- **Simple factual lookups。**एक बार पांच बहसों से अधिक सस्ता.

### 2026 व्यावहारिक उदाहरण

- **Anthropic orchestrator-workers**(第 12 课)  带合成 चरण का एक प्रकार का बहस 变体──
- **LangGraph supervisor**(第 13 课)  केंद्रीय राउटर + विशेषज्ञ एजेंट एक नोड के रूप में बहस को लागू कर सकते हैं
- **OpenAI Agents SDK**(第 16 课)  एजेंट 通过 हस्तान्तरण 来回进行反复批评──
- **Multi-agent evals** चर्चा + मूल्यांकनकर्ता-अनुकूलनकर्ता 配对, मूल्यांकन संकेत के लिए प्रयोग किया जाता है

### यह तरीका आसानी से गलत जगह पर है

- **Convergence collapse。**सभी एजेंटों ने पहला गलत उत्तर प्राप्त किया है।
- **Hub failure。**स्टार टॉपॉलजी में, एक खराब केंद्र सभी को प्रदूषित करेगा।
- **Prompt homogenization。**सभी एजेंट एक ही प्रॉम्प्ट का उपयोग करते हैं; वे एक ही उत्तर उत्पन्न करते हैं।


```figure
debate-converge
```

##  इसे निर्माण
`code/main.py`实现了 stdlib बहस:

- `Debater`कक्षा (带有每个辩论者意见漂移的剧本 LLM)
- `FullMeshDebate`和 `SparseDebate`धावक
- तीन प्रश्न: एक तथ्यगत, एक नियम आधारित, एक तर्क।
- मीट्रिकःसंकलन उत्तर,संकलन के लिए राउंड्स,संकलन के लिए कुल आलोचनात्मक कार्य।

运行:

```
python3 code/main.py
```

输出: प्रत्येक प्रोटोकॉल की सटीकता और लागत;sparse में 2/3  पर कम लागत के लिए पूर्ण जाल के साथ मेल खाने के लिए समस्याएँ

## इसका उपयोग करें
- **Anthropic orchestrator-workers**सरल 2-3-कर्मियों के बहस पर आधारित है।
- **LangGraph**राज्य के साथ बहुराउंड बहस के लिए।
- **Custom**अनुसंधान या विशेष सटीकता गारंटी के लिए उपयोग किया जाता है।

## 交付 यह
`outputs/skill-debate.md` एक बहु-एजेंट बहस का निर्माण, एक विन्यास योग्य टॉपलॉजी N、R तथा अभिसरण नियम के साथ

## अभ्यास
1.  एक जबरदस्ती असहमति को प्राप्त करना नियम: 第 1 轮中, प्रत्येक बहसकर्ता एक अलग प्रस्ताव उत्पन्न करना चाहिए
2. 添加信心-weighted aggregation:debaters 返回 (जवाब, विश्वास); Aggregator 按 विश्वास 加权── यह क्या मदद करता है?
3. एक एजेंट को दूसरे एजेंट के साथ बदलकर अलग-अलग राय रखने वाले एक एलएलएम के लिए लिखना है।
4. अपने 3 个问题上衡量全网与稀少的代币 成本──绘图成本与精度──
5. 阅读 Society of Minds पेपर― अपने खिलौने को N=5  R=3 移植 करें

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Debate | “Multi-agent critique” | N 个 proposers，R 轮 cross-critique，并收敛 |
| Full mesh | “Everyone reads everyone” | 每个 debater 每轮读取每个 peer |
| Sparse topology | “Limited peer view” | Debaters 只读取 peers 的一个子集 |
| Hub-and-spoke | “Star topology” | 一个 central debater，N-1 个 spokes 只读取 hub |
| Convergence | “Agreement” | Debaters 收敛到一个共享答案 |
| Society of Minds | “Du et al. debate paper” | ICML 2024 multi-agent debate method |

## 延伸阅读
- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) 经典 बहु-एजेंट बहस
- [Sparse Communication Topology (arXiv:2406.11776)](https://arxiv.org/abs/2406.11776) दुर्लभ टॉपॉलजी 结果
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) संगीतकार-कर्मियों 作为一种辩论 变体
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) एकल मॉडल आत्म-आलोचना प्रतिरोध पद्धति
