# कैपस्टोन 05  स्वयंसिद्ध अनुसंधान एजेंट(एआई-वैज्ञानिक 类)

> साकाना के एआई-साइंटिस्ट-v2 ने एक पूर्ण शोध प्रकाशित किया। एजेन्ट लैबोरेटरी ने प्रयोग किया। एलेन एआई ने एक ट्रैक साझा किया। 2026 के वर्ष के प्रारूप में, एक प्रयोग पर योजना-कार्य-सत्यापन पेड़ खोज, लागत के साथ बजट, साखोशीकृत कोड निष्पादन, दृष्टि-वापसी लेटेक्स लेखक, और स्वचालित न्यूरआईपीएस शैली समीक्षक समूह का आयोजन किया गया है। यह एक ऐसा सिस्टम बनाने का मुख्य पत्थर है, जो प्रत्येक लेख में $ 30 से अंत तक चलेगा, और साकाना के माध्यम से रेत-उड़ान लाल टीम को रिकॉर्ड करेगा।

**Type:** Capstone
**Languages:** Python（agent + sandbox）、LaTeX（output）
**Prerequisites:** Phase 2（ML）、Phase 3（Deep Learning）、Phase 7（transformers）、Phase 10（LLMs from scratch）、Phase 14（agents）、Phase 15（autonomous）、Phase 16（multi-agent）、Phase 18（safety）
**Phases exercised:**P0 · P2 · P3 · P7 · P10 · P14 · P15 · P16 · P18
**Time:** 40 小时

## 问题
स्वयंसिद्ध अनुसंधान एजेंट ने 2026 में एक द्वार पार किया। साकाना एआई के एआई-वैज्ञानिक-v2 ने नेचर में प्रकाशित किया, उत्पन्न हुए लेख ने कार्यशाला समकक्ष समीक्षा को पारित किया। शिंकाईवलव (ICLR) 2026 में इस दिशा को विकास परिकल्पना तक विस्तारित किया जाएगा। एएमडी के एजेंट प्रयोगशाला ने एक पुनः प्राप्ति योग्य निशान जारी किए हैं। ये एजेंट आश्चर्यजनक नहीं हैं कि वे उम्मीदवारों के प्रयोग के पेड़ पर चल रहे योजना-कार्य-सत्यापन, लूप के साथ लागत-सीमित बीज के साथ सत्यापित करते हैं।

आप एक संकीर्ण क्षेत्र में बीज विचार पर एक एजेंट को लागू करने के लिए इस लूप को सीखेंगे। उदाहरण के लिए, 100M में 参数 ट्रांसफार्मर पर ध्यान देने योग्य अपवर्तन करें।

## 概念
यह एजेंट एक सबसे अच्छा पहला पेड़ खोज है――节点是实验规格:(अनुमान, कॉन्फिग, कोड, अपेक्षित परिणाम) ―― विस्तार 步骤通过小改动提出孩子们(替代优化器、调整批量尺寸、ablate 一个组件) ―― प्रत्येक बच्चा नई सैंडबॉक्स में परिचालन में है जिसमें हार्ड संसाधनों की सीमा है── परिणाम反到得分功能,根据(नवता × गुणवत्ता × शेष बजट)

लेखक है मल्टीमोडल के. यह लैटेक्स ड्राफ्ट, संकलन, रैंकिंग आंकड़ा,并把染后的 PDF 送回 क्लाउड ओपस 4.7 के विजन मोड, उपयोग के लिए आलोचनात्मक लेआउट, आंकड़ा 可读性, तथा दावे-साबूत संरेखण.

सुरक्षा है भारी संरचना। प्रत्येक प्रयोग में नेटवर्क निकास के बिना है। सीमित वॉल-क्लॉक, E2B या डेटोन सैंडबॉक्स के भीतर निरंतर संसाधन प्रतिबंध।

## 架构
```
seed idea + domain
      |
      v
  literature search (Semantic Scholar + OpenAlex + FAISS cache)
      |
      v
  LangGraph plan-execute-verify tree
      |
      v
  +--- expand node ----+      per-node sandbox
  |                    |      (E2B / Daytona)
  v                    v      resource caps
  child_1           child_k   no network egress
  |                    |      deterministic seeds
  v                    v
  run experiment       run experiment
  |                    |
  v                    v
  score nodes by (novelty, quality, budget)
      |
      v
  best branch -> LaTeX writer
      |
      v
  compile + vision critique (Opus 4.7 vision)
      |
      v
  reviewer ensemble (5 LLM judges, NeurIPS rubric)
      |
      v
  paper.pdf + review.md + trace.json
```

## 技术
- संग्राहलय: नियंत्रण रेखा तथा मानव अनुमोदन गेट का लैंगग्राफ
- पेड़ खोजः प्रयोग नोड के आधार पर स्व-परिभाषा सबसे अच्छा-पहला से आता है (सकान v2 के AB-MCTS-शैली से)
- सैंडबॉक्स: प्रत्येक प्रयोग एक E2B, डॉकर-इन-डोकर बैक; cgroups के माध्यम से 施加资源 कैप
- साहित्यःसैमानिक विद्वान ग्राफ एपीआई + ओपनएलेक्स + 本地 FAISS अमूर्त कैश
- लेखक:लैटेक्स टेम्पलेट + क्लाउड ओपस 4.7(दृश्य मोड) चित्र आलोचना और लेआउट के लिए उपयोग किया जाता है
- समीक्षक:5 个评委的组合(Opus 4.7、GPT-5.4、Gemini 3 Pro、DeepSeek R1、Qwen3-Max),带重积
- प्रयोग ढांचाः भौतिक प्रयोग के लिए PyTorch 2.5,W&B लॉगिंग के लिए उपयोग किया जाता है
- अवलोकनशीलताः एजेंट ट्रैक के लिए प्रयोग किया गया Longfuse, प्रति लेख लेख $ 30 硬 बजट


```figure
ce-experiment-tree
```

##  इसे निर्माण
1. **Seed and domain scoping.**选取一个种子想法 (उदाहरण के लिए, sub-1B ट्रांसफार्मरों के ध्यान मानचित्रों में स्पायरसिटी पैटर्न की जांच करें)

2. **Literature pass.**查询 सेमेटिक विद्वान + OpenAlex 中最相关且引用最多的 50 篇论文;本地缓存摘要;生成 1 页域名消化──

3. **Tree scaffolding.**बीज परिकल्पना प्रारंभिकरणमूल---पूर्ति`expand(node) -> children`, प्रयोग छोटे बदलाव प्रस्ताव ((( प्रत्येक बच्चे एक विन्यास परिवर्तन)`score(node)`实现为加权的新奇性 × गुणवत्ता × बजट 项──

4. **Sandbox wrapping.**हर प्रयोग चल रहा है`docker run --network=none --memory=8g --cpus=2 --pids-limit=256 --read-only`(या बराबर मूल्य की ई2बी नीति)  बीज 写入砂箱;输出以只读的方式  装回外部──

5. **Plan-execute-verify loop.** `plan` बच्चों को प्रस्तावित करना `execute`运行 सैंडबॉक्स, कैप्चर लॉग 和 मेट्रिक`verify`मेट्रिक 运行 इकाई जाँच पर  हानि क्या घट गई है? अपघटन क्या अलग हुआ है प्रभाव?

6. **Writer.**बजट के उपयोग के बाद, सर्वोत्तम分支── Using matplotlib 染 आंकड़ा──通过 क्लाउड ओपस 4.7 生成 LaTeX ड्राफ्ट,并把 शाखा का पता 放入文脈──编译──把编译后的 PDF 送回 Opus 4.7 दृष्टि 进行批评──代──

7. **Reviewer ensemble.**五个评委 根据 NeurIPS 风格 rubric,对草案的(नवियत、 कठोरता、 स्पष्टता、 पुनरुत्पादनशीलता、 प्रभाव)打分──如果意思 <4.0/5,则带批判 返回作家──3 बार पुनर्लेखन 后硬停止──

8. **Red team.**构建或集成一组针对沙盒的对抗性任务: कांस्य बम、网络外filtration प्रयास、 फाइल सिस्टम भाग、LLM 写出的 Shell Metacharacter──确认全部被阻止──写出发现──

9. **Reproducibility.**प्रत्येक पेपर में पेड़-खोज का पता लगाया गया है JSON, बीज, W&B रन लिंक, सैंडबॉक्स कॉन्फ़िगरेशन, साथ ही एक अंत से अंत तक इसका रीडएमई।

## इसका उपयोग करें
```
$ ai-scientist run --seed "attention sparsity in sub-1B transformers" --budget 30
[lit]    50 papers, digest in 12s
[tree]   expanded 8 nodes, budget 12/30
[exec]   node #3 sparsity=top-8, loss=2.83 (best so far)
[exec]   node #6 sparsity=top-4, loss=3.12 (worse)
[exec]   ...
[tree]   chose branch rooted at node #3 (novelty 0.62, quality 0.81)
[write]  LaTeX draft v1 complete
[vision] critique: figure 2 legend too small, claim-evidence ok
[write]  draft v2 after 3 edits
[review] mean 4.2/5 (novelty 3.9, rigor 4.3, clarity 4.1, repro 4.5, impact 4.2)
[done]   paper.pdf + review.md + trace.json     $28.40 spent
```

## 交付 यह
`outputs/skill-ai-scientist.md`यह एक बीज विचार + एक डोमेन + $30 बजट, यह पूरी पाइपलाइन चलाएगा, और एक समीक्षा योग्य पेपर, साथ ही एक पुनरुत्पादन योग्य बंडल का उत्पादन करेगा।

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Paper quality | 根据已发表 workshop paper 做 blind rubric review |
| 20 | Experimental rigor | Baseline、seed、ablation；每个 claim 都由 results table 中的一个 cell 支撑 |
| 20 | Cost and compute discipline | 强制执行 $30/paper 上限，并由 Langfuse trace |
| 20 | Safety | Sandbox red team 通过；network policy 和 kill-switch 已验证 |
| 15 | Reproducibility | 使用相同 seed 一条命令 rerun 可复现 paper |
| **100** | | |

## अभ्यास
1. एक ही डोमेन के बीच तीन अलग-अलग बीज विचार 运行管道── पेड़-खोज के किस भाग के ओवरलैप──识别重复浪费的计算──

2. प्रयोग निष्पादन से पहले, $ 5 से अधिक के नोड का अनुमान लगाने के लिए मानव-इन-द-लूप गेट जोड़ें।

3.                                                                                                                                                                                                                                                               

4. 引入 नेटवर्क-exfiltration लाल टीम परीक्षण:एजेंट 写出尝试 `curl`बाहरी पता का पता`--network=none`नीति इसे रोकने के लिए।

5. अपने पेड़-खोज को फ्लैट रैंडम बेसलाइन से तुलना करें, एक ही बजट, कोई विस्तार रणनीति नहीं)

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Tree search | “AB-MCTS-style expansion” | 用 novelty×quality×budget score 在 experiment node 上进行 best-first exploration |
| Sandbox | “Experiment isolation” | 无 network、CPU/memory 有界、固定 seed、read-only input 的 container |
| Vision critique | “Render-then-read” | 将 paper 编译为 PDF，把 PDF 送回 VLM，用于 layout 和 claim-evidence critique |
| Reviewer ensemble | “Automated peer review” | 多个 LLM judge 使用 NeurIPS rubric 为 paper 打分；weighted aggregate gate 控制 pipeline |
| Novelty score | “Is this new?” | 对接近 50-paper literature cache 的内容施加惩罚的 heuristic |
| Cost ceiling | “$ budget” | 每篇 paper 的总花费硬上限；Langfuse counter + pre-run estimate |
| Red team | “Sandbox-escape audit” | 如果 policy 错误就会逃出 sandbox 的 adversarial task |

## 延伸阅读
- [Sakana AI-Scientist-v2 repository](https://github.com/SakanaAI/AI-Scientist-v2) 参考 उत्पादन अनुसंधान एजेंट
- [Sakana AI-Scientist-v1 paper (arXiv:2408.06292)](https://arxiv.org/abs/2408.06292) मूल पद्धति
- [ShinkaEvolve (Sakana ICLR 2026)](https://sakana.ai) विकास  विस्तार
- [Agent Laboratory (AMD)](https://github.com/SamuelSchmidgall/AgentLaboratory) बहु-भूमिका अनुसंधान प्रयोगशाला ढांचा
- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) 参考 ऑर्केस्ट्रेशन लेयर
- [Semantic Scholar Graph API](https://api.semanticscholar.org/) साहित्य खोज
- [E2B sandboxes](https://e2b.dev) 参考 प्रयोग अलगाव
- [NeurIPS reviewer guidelines](https://neurips.cc/Conferences/2026/Reviewer-Guidelines) समीक्षक समूह 编码的条目
