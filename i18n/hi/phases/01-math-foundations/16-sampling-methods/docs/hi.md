# नमूना लेने की विधि

> नमूनाकरण एक ऐसा तरीका है जो एआई द्वारा संभावनाओं की खोज करने के लिए किया जा सकता है।

**Type:** Build
**Language:**पायथन
**Prerequisites:** Phase 1, Lessons 06-07 (Probability, Bayes' Theorem)
**Time:** ~120 minutes

## 学习目标
- ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ्
- के लिए भाषा मॉडल टोकन 生成 संरचना तापमान、top-k 和 top-p (नक्लस) नमूनाकरण
-  समझाएँ रिपरमेटरीकरण ट्रिक, और यह क्यों कर सकता है VAEs में नमूनाकरण  समर्थन बैकप्रॉपेगेशन
- 运行 मेट्रोपोलिस-हस्टिंग्स MCMC, से未归一化的 लक्ष्य वितरण में नमूना

## 问题
एक भाषा मॉडल  आपके प्रॉम्प्ट के प्रसंस्करण के बाद, एक वेक्टर उत्पन्न होगा जिसमें 50,000 लॉजिट्स होंगे ∙ शब्दावली में प्रत्येक टोकन के लिए एक ∙ अब इसे एक चुनना होगा ∙ कैसे चुनें?

यदि यह हमेशा सबसे अधिक संभावना वाले टोकन का चयन करता है, तो प्रत्येक प्रतिक्रिया पूरी तरह से समान होगी।

नमूनाकरण न केवल पाठ उत्पादन के लिए उपयोग किया जाता है। पुनर्मूल्यांकन सीखने के माध्यम से नमूनाकरण प्रक्षेपवक्रों के माध्यम से नीतिगत ग्रेडिएंटों का अनुमान लगाने के लिए।

प्रत्येक जनरेटिव एआई प्रणाली एक नमूनाकरण प्रणाली है। नमूनाकरण रणनीति आउटपुट की गुणवत्ता, विविधता और नियंत्रण को निर्धारित करती है। यह पाठ्यक्रम प्रत्येक मुख्य नमूनाकरण विधि के शून्य से निर्माण से, समान यादृच्छिक संख्या से लेकर आधुनिक एलएलएम और जनरेटिव मॉडल की तकनीक तक शुरू होता है।

## 概念
### नमूना लेने का महत्व क्यों है

एआई और मशीन लर्निंग में नमूने निकालना चार बुनियादी भूमिकाएं निभाता हैः

**Generation.**भाषा मॉडल, प्रसारण मॉडल तथा जीएएन नमूनाकरण के माध्यम से उत्पन्न आउटपुट हैं। नमूनाकरण एल्गोरिथ्म रचनात्मकता, संवर्धन और विविधता पर सीधे नियंत्रण रखता है। तापमान, शीर्ष-के और नाभिक नमूनाकरण इंजीनियरों द्वारा दैनिक रूप से समायोजित किया जाता है।

**Training.**स्टोकास्टिक ग्रेडिएंट ड्रेसेंट बैठक मिनी बैचों का नमूनाकरण――ड्रोपॉउट बैठक नमूनाकरण आवश्यक बंद करने के लिए न्यूरॉन्स――डेटा एग्जॉन्टेशन बैठक यादृच्छिक परिवर्तनों का नमूनाकरण――महत्व नमूनाकरण 会对样本重新加权,以降低强化学习 (PPO,TRPO) 中的 ग्रेडिएंट 方差──

**Estimation.**एमएल में बहुत मात्रा में कोई बंद-रूप समाधान नहीं है। डेटा वितरण पर अपेक्षाएं हानि ऊर्जा आधारित मॉडल विभाजन समारोह, बेयिसियन निष्कर्ष।

**Exploration.**एमसीएमसी एल्गोरिदम में बेयसियन इन्फेरेंस में खोजें पिछली वितरणों में;; विकासवादी रणनीतियों में शामिल हैं नमूनाकरण पैरामीटर व्यवधानों में;; थॉम्पसन नमूनाकरण में बैंडिट्स में संतुलन खोज और शोषण में;;

核心挑战是: आप केवल सरल वितरण में से सीधे नमूनाकरण (uniform ≠ normal) से ही प्राप्त कर सकते हैं।

### समान यादृच्छिक नमूनाकरण

प्रत्येक नमूना विधि यहाँ से शुरू होती है। एक समान यादृच्छिक संख्या जनरेटर [0, 1) में संख्यात्मक मूल्य उत्पन्न होता है, जिसमें से किसी भी वेंगिंग्स क्षेत्र में समान संभावनाएं होती हैं।

```
U ~ Uniform(0, 1)

P(a <= U <= b) = b - a    for 0 <= a <= b <= 1

Properties:
  E[U] = 0.5
  Var(U) = 1/12
```

                                                                                                                                                                                                                                                              

关键洞察: एकल समान यादृच्छिक संख्या 恰好包含从任意分布中生成一个样本的随机性――技巧在找到正确的转化――

### उल्टा सीडीएफ विधि (उपवर्ती परिवर्तन नमूनाकरण)

संचयी वितरण फ़ंक्शन (CDF) 会把数值映射到概率:

```
F(x) = P(X <= x)

Properties:
  F is non-decreasing
  F(-inf) = 0
  F(+inf) = 1
  F maps the real line to [0, 1]
```

उल्टा सीडीएफ 会把概率映射回数值── यदि यू ~ समान(0, 1), तो X = F_inverse(U) 服从目标分布──

```
Algorithm:
  1. Generate u ~ Uniform(0, 1)
  2. Return F_inverse(u)

Why it works:
  P(X <= x) = P(F_inverse(U) <= x) = P(U <= F(x)) = F(x)
```

**Exponential distribution 示例：**

```
PDF: f(x) = lambda * exp(-lambda * x),   x >= 0
CDF: F(x) = 1 - exp(-lambda * x)

Solve F(x) = u for x:
  u = 1 - exp(-lambda * x)
  exp(-lambda * x) = 1 - u
  x = -ln(1 - u) / lambda

Since (1 - U) and U have the same distribution:
  x = -ln(u) / lambda
```

जब आप बंद रूप के F_inverse 时 लिख सकते हैं, तो इस विधि का प्रभाव एकदम सही है। सामान्य वितरण के लिए, कोई बंद-रूप के विपरीत CDF नहीं है, इसलिए हम अन्य तरीकों का उपयोग करते हैं।

**离散版本：** विवश वितरण के लिए, CDF  को संचयी राशि के रूप में बनाएं, U उत्पन्न करें, फिर संचयी राशि  से अधिक U का पहला सूचकांक ढूंढें यह है पाठ 06 में `sample_categorical`का कामकाज विधि

### अस्वीकार नमूनाकरण

जब आप CDF को उलट नहीं सकते, लेकिन एक अलग सामान्य स्थिति में लक्ष्य का मूल्यांकन कर सकते हैं, तो अस्वीकृति नमूनाकरण उपलब्ध है।

```
Target distribution: p(x)  (can evaluate, possibly unnormalized)
Proposal distribution: q(x)  (can sample from)
Bound: M such that p(x) <= M * q(x) for all x

Algorithm:
  1. Sample x ~ q(x)
  2. Sample u ~ Uniform(0, 1)
  3. If u < p(x) / (M * q(x)), accept x
  4. Otherwise, reject and go to step 1

Acceptance rate = 1/M
```

M 越紧, स्वीकृति दर 越高──在低维1−3) में, अस्वीकृति नमूनाकरण 效果很好──在高维中, स्वीकृति दर 会指数级下降,因为 प्रस्ताव मात्रा का अधिकांश हिस्सा都会被拒绝──这是拒绝样本采集的诅咒的维度──

**示例：从 truncated normal 中 sampling。**संकुचित श्रेणी में ऊपर समान प्रस्ताव का उपयोग करें──मॉल M इस क्षेत्र के भीतर सामान्य PDF का अधिकतम मूल्य है──

**示例：从 semicircle 中 sampling。**समयावधि में समरूप प्रस्ताव। यदि बिंदु अर्ध वृत्त में गिर जाता है, तो स्वीकार करना।

### महत्व का नमूनाकरण

कभी कभी आपको लक्ष्य वितरण p(x) के नमूने की आवश्यकता नहीं है── आपको अनुमान लगाने की आवश्यकता है p(x) नीचे की अपेक्षा, और आपके पास अन्य वितरण q(x) के नमूने हैं──

```
Goal: estimate E_p[f(x)] = integral of f(x) * p(x) dx

Rewrite:
  E_p[f(x)] = integral of f(x) * (p(x)/q(x)) * q(x) dx
            = E_q[f(x) * w(x)]

where w(x) = p(x) / q(x)  are the importance weights.

Estimator:
  E_p[f(x)] ~ (1/N) * sum(f(x_i) * w(x_i))    where x_i ~ q(x)
```

यह प्रवर्धन सीखने में बहुत महत्वपूर्ण है। पीपीओ (अंतरिक नीति अनुकूलन) में, आप पुरानी नीति में पिक_आउट का संग्रह करते हैं, लेकिन नई नीति में सुधार की उम्मीद करते हैं।

महत्व के नमूने लेने वाले अनुमानक का अंतर q से p के समानता की डिग्री पर निर्भर करता है। यदि q से p बहुत भिन्न है, तो कुछ नमूने भारी वजन प्राप्त करेंगे और यह अनुमान है।

```
E_p[f(x)] ~ sum(w_i * f(x_i)) / sum(w_i)
```

### मोन्टे कार्लो अनुमान

मोन्टे कार्लो अनुमान ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ 

```
Goal: estimate I = integral of g(x) dx over domain D

Method:
  1. Sample x_1, ..., x_N uniformly from D
  2. I ~ (Volume of D / N) * sum(g(x_i))

Error: O(1 / sqrt(N))   regardless of dimension
```

误差率与维度无关. यही कारण है कि उच्च स्तर के परिदृश्य में जो ग्रिड आधारित एकीकरण को प्राप्त करना असंभव है, मोंटे कार्लो विधियां 占据主导地位.

**估计 pi：**

```
Sample (x, y) uniformly from [-1, 1] x [-1, 1]
Count how many fall inside the unit circle: x^2 + y^2 <= 1
pi ~ 4 * (count inside) / (total count)
```

**估计期望：**

```
E[f(X)] ~ (1/N) * sum(f(x_i))    where x_i ~ p(x)

The sample mean converges to the true expectation.
Variance of the estimator = Var(f(X)) / N
```

### मार्कोव चेन मोंटे कार्लो (एमसीएमसी):मेट्रॉपॉलिस-हस्टिंग्स

MCMC  एक मार्कोव श्रृंखला का निर्माण करता है, जिससे इसका स्थिर वितरण लक्ष्य वितरण p(x) 😇 होता है। इसके बाद पर्याप्त कदमों से गुजरकर, श्रृंखला के मध्य के नमूने 就(近似)  से आते हैं।

```
Target: p(x)  (known up to a normalizing constant)
Proposal: q(x'|x)  (how to propose the next state given the current state)

Metropolis-Hastings algorithm:
  1. Start at some x_0
  2. For t = 1, 2, ..., T:
     a. Propose x' ~ q(x'|x_t)
     b. Compute acceptance ratio:
        alpha = [p(x') * q(x_t|x')] / [p(x_t) * q(x'|x_t)]
     c. Accept with probability min(1, alpha):
        - If u < alpha (u ~ Uniform(0,1)): x_{t+1} = x'
        - Otherwise: x_{t+1} = x_t
  3. Discard first B samples (burn-in)
  4. Return remaining samples
```

 सममित प्रस्तावों के लिए (q) = q) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x) = x = x) = x = x = = x) = x = = = = = = = = = x) = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

**为什么有效。**स्वीकृति नियम विवरण संतुलन सुनिश्चित करेंः x पर नहीं बढ़ता x' की संभावना, x पर नहीं बढ़ता x' की संभावना के बराबर है।

**实践注意事项：**
- जल-इन: श्रृंखला में  संतुलन प्राप्त करने से पहले प्रारंभिक नमूने छोड़ दिया
- पतला करनाः प्रति क 个 नमूना रखो, ताकि ऑटो-संदर्भ कम हो सके
- प्रस्तावों का पैमाना:太小会让链 移动缓慢(उच्च स्वीकृति, धीमी खोज);太大会让大多数 प्रस्ताव被拒绝(低 स्वीकृति, स्थगित)
- 高维中 गौशियन प्रस्ताव का सर्वोत्तम स्वीकृति दर 0.234 के आसपास है

### गिब्स नमूना

गिब्स नमूनाकरण बहु-विविध वितरण का एक विशेष MCMC है। यह सभी आयामों पर एक बार नहीं, बल्कि प्रत्येक बार सशर्त वितरण से एक चर को अपडेट करता है।

```
Target: p(x_1, x_2, ..., x_d)

Algorithm:
  For each iteration t:
    Sample x_1^{t+1} ~ p(x_1 | x_2^t, x_3^t, ..., x_d^t)
    Sample x_2^{t+1} ~ p(x_2 | x_1^{t+1}, x_3^t, ..., x_d^t)
    ...
    Sample x_d^{t+1} ~ p(x_d | x_1^{t+1}, x_2^{t+1}, ..., x_{d-1}^{t+1})
```

गिब्स नमूनाकरण  आप प्रत्येक सशर्त वितरण p                                                                                                                                                                                                                                                         
- बेईज़ियन नेटवर्कःग्राफ संरचना से शर्तें
- गौसी मिश्रण: शर्तें है गौसी
- Ising मॉडल: प्रत्येक स्पिन की सशर्त केवल अपने पड़ोसियों पर निर्भर

स्वीकृति दर 总是 1 ((प्रत्येक प्रस्ताव स्वीकार किया गया है), क्योंकि सटीक सशर्त नमूना से स्वचालित रूप से विस्तृत संतुलन को पूरा किया जाएगा।

**局限。**जब चर उच्चता से संबंधित होते हैं, तब गिब्स नमूना मिश्रण बहुत धीमा होता है, क्योंकि एक बार एक चर को अपडेट करने के लिए वितरण में बड़े डायगोनल आंदोलन नहीं हो सकते हैं।

### तापमान नमूनाकरण (LLMs के लिए)

भाषा मॉडल 会为 शब्दावली 中每个 टोकन 输出 लॉगिट z_1, ..., z_V──Softmax 会将它们转换成概率──温度 会在软max 前重新缩放 लॉगिट:

```
p_i = exp(z_i / T) / sum(exp(z_j / T))

T = 1.0: standard softmax (original distribution)
T -> 0:  argmax (deterministic, always picks highest logit)
T -> inf: uniform (all tokens equally likely)
T < 1.0: sharpens the distribution (more confident, less diverse)
T > 1.0: flattens the distribution (less confident, more diverse)
```

**为什么有效。**यदि z_1 = 2 और z_2 = 1, यदि T = 0.5 के बाद प्राप्त z_1/T = 4 और z_2/T = 2, तो अंतर बदल जाता है।

**实践中：**
- T = 0.0: लोभी डिकोडिंग, सबसे उपयुक्त तथ्य प्रकार Q&A
- T = 0.3-0.7: थोड़ा रचनात्मक, कोड पीढ़ी के लिए उपयुक्त
- T = 0.7-1.0: संतुलन,适合一般对话
- T = 1.0-1.5: रचनात्मक लेखन, ब्रेनस्टॉर्मिंग
- T > 1.5: वतन वतन, आमतौर पर बहुत कम उपयोगी

तापमान नहीं बदलता है जो टोकन है संभव है. यह प्रत्येक टोकन की संभावना द्रव्यमान को वितरित करने के लिए परिवर्तन करता है.

### शीर्ष-क नमूना

शीर्ष-के नमूनाकरण होगा उम्मीदवार संग्रह को अधिकतम संभावना के लिए सीमित k 个 टोकन, फिर पुनः归结, और इस सीमित संग्रह में से नमूनाकरण से।

```
Algorithm:
  1. Compute softmax probabilities for all V tokens
  2. Sort tokens by probability (descending)
  3. Keep only the top k tokens
  4. Renormalize: p_i' = p_i / sum(p_j for j in top-k)
  5. Sample from the renormalized distribution

k = 1:  greedy decoding
k = V:  no filtering (standard sampling)
k = 40: typical setting, removes long tail of unlikely tokens
```

Top-k 会防止模型选择极低概率的 टोकन (拼写错误、无意义内容), ये टोकन 存在于词汇分布的长尾中. समस्या यह है कि: चाहे ऊपर नीचे कैसे लिखा जाए, k 都是固定的.

### शीर्ष-पी (नक्लियस) नमूनाकरण

शीर्ष-पी नमूनाकरण 会动态调整候选选集合大小── यह निश्चित संख्या के टोकन को बरकरार नहीं रखता, बल्कि संचयी संभावनाओं को पी के न्यूनतम टोकन 集合 से अधिक रखता है──

```
Algorithm:
  1. Compute softmax probabilities for all V tokens
  2. Sort tokens by probability (descending)
  3. Find smallest k such that sum of top-k probabilities >= p
  4. Keep only those k tokens
  5. Renormalize and sample

p = 0.9:  keeps tokens covering 90% of probability mass
p = 1.0:  no filtering
p = 0.1:  very restrictive, nearly greedy
```

जब मॉडल बहुत अच्छी तरह से पता है, नाभिक नमूनाकरण बहुत कम टोकन को बनाए रखेगा (~ 2-3 个) ⋅ जब मॉडल अनिश्चित है, तो यह बहुत कुछ बनाए रखेगा (~ 200 个) ⋅ इस प्रकार का आत्म-अनुकूलन व्यवहार नाभिक नमूनाकरण है आमतौर पर शीर्ष-क से बेहतर बना है।

**常见组合：**
- तापमान 0.7 + शीर्ष-पी 0.9: अच्छा सामान्य सेटिंग
- तापमान 0.0 (लाभकारी): सर्वाधिक उपयुक्त निर्धारणात्मक कार्य
- तापमान 1.0 + शीर्ष-के 50: फैन et al. (2018) 原论文设置

शीर्ष-क और शीर्ष-प को संयोजन किया जा सकता है।

### पुनर्मूल्यांकन चाल (वीएई के लिए)

वैरिएशनल ऑटोकोडर (VAE) का सीखने का तरीका यह हैः इनपुट को कोड करके लटेंट स्पेस में एक वितरण में, इस वितरण में से नमूना लेना, फिर नमूना को वापस निकालना। समस्या यह हैः आप एक नमूना संचालन से नहीं गुजर सकते हैं।

```
Standard sampling (not differentiable):
  z ~ N(mu, sigma^2)

  The randomness blocks gradient flow.
  d/d_mu [sample from N(mu, sigma^2)] = ???
```

पुनरावर्तन चाल को क्रमबद्ध करने के लिए अलग किया जाएगा

```
Reparameterized sampling:
  epsilon ~ N(0, 1)          (fixed random noise, no parameters)
  z = mu + sigma * epsilon   (deterministic function of parameters)

  Now z is a deterministic, differentiable function of mu and sigma.
  d(z)/d(mu) = 1
  d(z)/d(sigma) = epsilon

  Gradients flow through mu and sigma.
```

यह इसलिए प्रभावी है, क्योंकि N  m, सिग्मा ^ 2) के साथ mu + सिग्मा * N  0, 1)  समान वितरण है── महत्वपूर्ण जानकारी यह हैः                                                                                                                                                                                                                                            

**在 VAE training loop 中：**
1. प्रत्येक इनपुट के लिए एन्कोडर 输出 mu 和 log(sigma^2)
2. नमूना ईप्सिलन ~ N(0, 1)
3. 计算 z = mu + सिग्मा * epsilon
4. decode z 以重建 इनपुट
5. 穿越步骤 4、3、2、1  बैकप्रॉगरेशन करें

 बिना रिपरमेटरीकरण ट्रिक के, VAE का उपयोग मानक Backpropagation  प्रशिक्षण  से नहीं हो सकता है  यह एक-एक अंतर्दृष्टि VAE को  करने योग्य बनाने के लिए 

### Gumbel-Softmax(可微的 श्रेणीगत नमूना)

पुनरावर्तन चाल 连续分布 (Gaussian)  के लिए उपयुक्त है।

**Gumbel-Max trick（不可微）：**

```
To sample from a categorical distribution with log-probabilities log(p_1), ..., log(p_k):
  1. Sample g_i ~ Gumbel(0, 1) for each category
     (g = -log(-log(u)), where u ~ Uniform(0, 1))
  2. Return argmax(log(p_i) + g_i)

This produces exact categorical samples.
```

**Gumbel-Softmax（可微近似）：**

```
Replace the hard argmax with a soft softmax:
  y_i = exp((log(p_i) + g_i) / tau) / sum(exp((log(p_j) + g_j) / tau))

tau (temperature) controls the approximation:
  tau -> 0:  approaches a one-hot vector (hard categorical)
  tau -> inf: approaches uniform (1/k, 1/k, ..., 1/k)
  tau = 1.0: soft approximation
```

Gumbel-Softmax 会产生 discrete sample 的连续松──输出是概率矢量(软一个热),而不是硬一个热──Gradients 会穿过软max 流动──在训练的前进通过中, आप "直穿" अनुमानक का उपयोग कर सकते हैंः前进通过 使用硬 argmax,但后进通过 使用软 Gumbel-Softmax梯度──

**应用：**
- VAEs के बीच विवश लटीन चर
- तंत्रिका वास्तुकला खोज (选择离散 संचालन)
- कठोर ध्यान तंत्र
- 带 discrete actions के प्रवर्धन सीखना

### स्तरीकृत नमूनाकरण

标准 मोंटे कार्लो नमूनाकरण संभव है क्योंकि नमूना स्थान में किसी भी प्रकार की अनियमितता है।

```
Standard Monte Carlo:
  Sample N points uniformly from [0, 1]
  Some regions may have clusters, others gaps

Stratified sampling:
  Divide [0, 1] into N equal strata: [0, 1/N), [1/N, 2/N), ..., [(N-1)/N, 1)
  Sample one point uniformly within each stratum
  x_i = (i + u_i) / N   where u_i ~ Uniform(0, 1),  i = 0, ..., N-1
```

मानक मोंटे कार्लो की तुलना में, स्ट्रैटिफाइड नमूनाकरण का अंतर हमेशा कम या समान होता हैः

```
Var(stratified) <= Var(standard Monte Carlo)

The improvement is largest when f(x) varies smoothly.
For piecewise-constant functions, stratified sampling is exact.
```

**应用：**
- संख्यात्मक एकीकरण (क्वासि-मोंटे कार्लो)
- प्रशिक्षण डेटा विभाजित करना सुनिश्चित करें प्रत्येक गुना मध्य के वर्ग संतुलन)
- 带 स्तरीकरण के महत्व नमूनाकरण (组合两种技术)
- NeRF (Neural Radiance Fields) कैमरा किरणों के साथ प्रयोग करें स्तरीकृत नमूनाकरण

### विसारण मॉडल से संबंध

फैलाव मॉडल  नमूनाकरण प्रक्रिया के माध्यम से 生成图像── आगे की प्रक्रिया 会在 T 步中向图像添加高斯音,直到它变成纯噪音── उल्टा प्रक्रिया 学习指责,逐步恢复原始图像──

```
Forward process (known):
  x_t = sqrt(alpha_t) * x_{t-1} + sqrt(1 - alpha_t) * epsilon
  where epsilon ~ N(0, I)

  After T steps: x_T ~ N(0, I)  (pure noise)

Reverse process (learned):
  x_{t-1} = (1/sqrt(alpha_t)) * (x_t - (1 - alpha_t)/sqrt(1 - alpha_bar_t) * epsilon_theta(x_t, t)) + sigma_t * z
  where z ~ N(0, I)

  Each denoising step is a sampling step.
```

इस कोर्स के साथ संपर्कः
- प्रत्येक निरोधक चरण में रीपरमेटरीकरण चाल का उपयोग किया जाता है
- शोर अनुसूची {alpha_t}  नियंत्रण एक तापमान annealing
- प्रशिक्षण का उपयोग करें मोंटे कार्लो अनुमान 来近似 ELBO (सबूत नीचे सीमा)
- विसारण मॉडल के बीच पूर्वजों के नमूने एक मार्कोव श्रृंखला है (प्रत्येक चरण केवल वर्तमान स्थिति पर निर्भर करता है)

 संपूर्ण छवि निर्माण प्रक्रिया ही पुनरावर्ती नमूनाकरण है: शोर से  शुरू, प्रत्येक चरण में, सीखने के आधार पर, नमूना एक शोर थोड़ा छोटा संस्करण 


```figure
monte-carlo-pi
```

##  इसे निर्माण
### 步骤 1: समान और उल्टा सीडीएफ नमूनाकरण

```python
import math
import random

def sample_uniform(a, b):
    return a + (b - a) * random.random()

def sample_exponential_inverse_cdf(lam):
    u = random.random()
    return -math.log(u) / lam
```

生成 10,000 个指数样本,并验证均值为1/lambda──

### 步骤 2: अस्वीकार नमूना

```python
def rejection_sample(target_pdf, proposal_sample, proposal_pdf, M):
    while True:
        x = proposal_sample()
        u = random.random()
        if u < target_pdf(x) / (M * proposal_pdf(x)):
            return x
```

प्रयोग अस्वीकार नमूनाकरण से संकुचित सामान्य वितरण से 中抽样──通过对样品 绘制 histogram 来验证形──

### 步骤 3: महत्व का नमूना

```python
def importance_sampling_estimate(f, target_pdf, proposal_pdf, proposal_sample, n):
    total = 0
    for _ in range(n):
        x = proposal_sample()
        w = target_pdf(x) / proposal_pdf(x)
        total += f(x) * w
    return total / n
```

उपयोग एक समान प्रस्ताव  अनुमानित सामान्य वितरण 下的 E[X^2]──与已知答案(mu^2 + sigma^2) तुलना

### 步骤 4: मोन्टे कार्लो अनुमान

```python
def monte_carlo_pi(n):
    inside = 0
    for _ in range(n):
        x = random.uniform(-1, 1)
        y = random.uniform(-1, 1)
        if x*x + y*y <= 1:
            inside += 1
    return 4 * inside / n
```

### 步骤 5: मेट्रोपोलिस-हस्टिंग्स MCMC

```python
def metropolis_hastings(target_log_pdf, proposal_sample, proposal_log_pdf, x0, n_samples, burn_in):
    samples = []
    x = x0
    for i in range(n_samples + burn_in):
        x_new = proposal_sample(x)
        log_alpha = (target_log_pdf(x_new) + proposal_log_pdf(x, x_new)
                     - target_log_pdf(x) - proposal_log_pdf(x_new, x))
        if math.log(random.random()) < log_alpha:
            x = x_new
        if i >= burn_in:
            samples.append(x)
    return samples
```

द्वि-आयामी वितरण से (दो गौसीयन के मिश्रण) में नमूनाकरण―可视化链的轨迹―

### 步骤 6: गिब्स नमूना

```python
def gibbs_sampling_2d(conditional_x_given_y, conditional_y_given_x, x0, y0, n_samples, burn_in):
    x, y = x0, y0
    samples = []
    for i in range(n_samples + burn_in):
        x = conditional_x_given_y(y)
        y = conditional_y_given_x(x)
        if i >= burn_in:
            samples.append((x, y))
    return samples
```

### 步骤 7: तापमान नमूनाकरण

```python
def softmax(logits):
    max_l = max(logits)
    exps = [math.exp(z - max_l) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]

def temperature_sample(logits, temperature):
    scaled = [z / temperature for z in logits]
    probs = softmax(scaled)
    return sample_from_probs(probs)
```

展示 तापमान 如何改变一组 टोकन लॉगिट का输出分布──

### 步骤 8: शीर्ष-के और शीर्ष-पी नमूनाकरण

```python
def top_k_sample(logits, k):
    indexed = sorted(enumerate(logits), key=lambda x: -x[1])
    top = indexed[:k]
    top_logits = [l for _, l in top]
    probs = softmax(top_logits)
    idx = sample_from_probs(probs)
    return top[idx][0]

def top_p_sample(logits, p):
    probs = softmax(logits)
    indexed = sorted(enumerate(probs), key=lambda x: -x[1])
    cumsum = 0
    selected = []
    for token_idx, prob in indexed:
        cumsum += prob
        selected.append((token_idx, prob))
        if cumsum >= p:
            break
    sel_probs = [pr for _, pr in selected]
    total = sum(sel_probs)
    sel_probs = [pr / total for pr in sel_probs]
    idx = sample_from_probs(sel_probs)
    return selected[idx][0]
```

### 步骤 9: Reparameterization ट्रिक

```python
def reparam_sample(mu, sigma):
    epsilon = random.gauss(0, 1)
    return mu + sigma * epsilon

def reparam_gradient(mu, sigma, epsilon):
    dz_dmu = 1.0
    dz_dsigma = epsilon
    return dz_dmu, dz_dsigma
```

√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√

### 步骤 10: गुम्बल-सॉफ्टमैक्स

```python
def gumbel_sample():
    u = random.random()
    return -math.log(-math.log(u))

def gumbel_softmax(logits, temperature):
    gumbels = [math.log(p) + gumbel_sample() for p in logits]
    return softmax([g / temperature for g in gumbels])
```

 demonstrating low temperature  कैसे करे आउटपुट एक-गर्म वेक्टर के करीब

पूर्णता और सभी दृश्यता में`code/sampling.py`मध्य में

## इसका उपयोग करें
उपयोग NumPy 和 SciPy 时,उत्पादन  संस्करण इस प्रकार हैः

```python
import numpy as np

rng = np.random.default_rng(42)

exponential_samples = rng.exponential(scale=2.0, size=10000)
print(f"Exponential mean: {exponential_samples.mean():.4f} (expected 2.0)")

from scipy import stats
normal = stats.norm(loc=0, scale=1)
print(f"CDF at 1.96: {normal.cdf(1.96):.4f}")
print(f"Inverse CDF at 0.975: {normal.ppf(0.975):.4f}")

logits = np.array([2.0, 1.0, 0.5, 0.1, -1.0])
temperature = 0.7
scaled = logits / temperature
probs = np.exp(scaled - scaled.max()) / np.exp(scaled - scaled.max()).sum()
token = rng.choice(len(logits), p=probs)
print(f"Sampled token index: {token}")
```

ढ़ेर बड़े पैमाने पर एमसीएमसी के लिए, विशेष भंडार का उपयोग करेंः
- PyMC: NUTS (अनुकूली एचएमसी) का प्रयोग पूर्ण बेईसीन मॉडलिंग
- emcee:एम्बेसे MCMC नमूना
- NumPyro/JAX:GPU-एक्सेलेरेटेड MCMC

आप इन तरीकों को शून्य से बना चुके हैं। अब आप जानते हैं कि इन पुस्तकालय कॉलों में क्या करना है।

## अभ्यास
1.  Cauchy distribution 实现逆 CDF sampling──CDF है F(x) = 0.5 + आर्कटान(x) / pi── 10,000 个样本生成,并把 histogram 与真实 PDF 画在一起──注意重尾(远离中心的极端值)──

2. उपयोग अस्वीकृति नमूनाकरण, Uniform ((0, 1) प्रस्ताव से बीटा ((2, 5) वितरण 生成 नमूना──把接受样本与真实贝塔 PDF 画在一起──理论接受率是多少?

3. प्रयोग मोन्टे कार्लो, प्रयोग 1,000、10,000 和 100,000 个样本 估计 sin(x) 0 से लेकर pi के积分──比较每个级别的误差──验证误差按 O(1/sqrt(N)) 缩放──

4. 实现 मेट्रोपोलिस-हस्टिंग्स, एक 2D वितरण से नमूनाकरण, जिसमें p(x, y) exp(-(x^2 * y^2 + x^2 + y^2 - 8*x - 8*y) / 2);; नमूना चित्रण 和 श्रृंखला की प्रक्षेपवक्र──尝试 विभिन्न प्रस्ताव मानक विचलन──

5. 构建一个完整的文本生成演示:给定一个包含 10 个词及 logits的词汇,使用 (a) लोभी、(b) तापमान=0.7、((c) शीर्ष-क=3、(((d) शीर्ष-p=0.9 生成长度为 20 टोकन के क्रमशः──比较 5 次运行中输出的多样性──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Sampling | “抽取随机值” | 按照 probability distribution 生成数值。所有 generative AI 背后的机制 |
| Uniform distribution | “所有值同等可能” | [a, b] 中每个值都有相同 probability density 1/(b-a)。所有 sampling methods 的起点 |
| Inverse CDF | “概率变换” | F_inverse(U) 会把 uniform sample 转换成来自任意已知 CDF 分布的 sample。精确且高效 |
| Rejection sampling | “提出并接受/拒绝” | 从简单 proposal 中生成，按 target/proposal ratio 成比例的概率接受。精确但浪费 samples |
| Importance sampling | “重新加权 samples” | 使用来自 q(x) 的 samples，通过用 p(x)/q(x) 加权每个 sample，估计 p(x) 下的期望。RL 中 PPO 的核心 |
| Monte Carlo | “平均 random samples” | 将积分近似为 sample averages。误差 O(1/sqrt(N))，与维度无关 |
| MCMC | “会收敛的 random walk” | 构造一个 Markov chain，使其 stationary distribution 是目标分布。Metropolis-Hastings 是基础算法 |
| Metropolis-Hastings | “接受上坡，有时接受下坡” | 提出 moves，基于 density ratio 接受。Detailed balance 确保收敛到目标分布 |
| Gibbs sampling | “一次一个 variable” | 在固定其他 variables 的情况下，从每个 variable 的 conditional distribution 中更新。Acceptance rate 为 100% |
| Temperature | “置信度旋钮” | 在 softmax 前用 T 除以 logits。T<1 使分布更尖锐（更自信），T>1 使分布更平坦（更多样） |
| Top-k sampling | “保留最好的 k 个” | 除概率最高的 k 个 Token 外全部置零，重新归一化，然后 sampling。候选集合大小固定 |
| Nucleus sampling (top-p) | “保留可能性高的那些” | 保留累计概率超过 p 的最小 Token 集合。候选集合大小自适应 |
| Reparameterization trick | “把随机性移到外部” | 写成 z = mu + sigma * epsilon，其中 epsilon ~ N(0,1)。让 sampling 可微。VAE training 的关键 |
| Gumbel-Softmax | “软 categorical sampling” | 使用 Gumbel noise + 带 temperature 的 softmax，对 categorical sampling 做可微近似 |
| Stratified sampling | “强制覆盖” | 把 sample space 分成 strata，并从每个 stratum 中 sampling。方差总是低于 naive Monte Carlo |
| Burn-in | “预热期” | 在 chain 达到其 stationary distribution 之前丢弃的初始 MCMC samples |
| Detailed balance | “可逆性条件” | p(x) * T(x->y) = p(y) * T(y->x)。这是 p 成为 Markov chain stationary distribution 的充分条件 |
| Diffusion sampling | “迭代 denoising” | 从 noise 开始，并应用学到的 denoising steps 来生成数据。每一步都是 conditional sampling operation |

## 延伸阅读
- [Holbrook (2023): The Metropolis-Hastings Algorithm](https://arxiv.org/abs/2304.07010)- एमसीएमसी के आधार पर विस्तृत पाठ्यक्रम के बारे में
- [Jang, Gu, Poole (2017): Categorical Reparameterization with Gumbel-Softmax](https://arxiv.org/abs/1611.01144)- 原始 गंबल-सॉफ्टमैक्स 论文
- [Holtzman et al. (2020): The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751)- न्यूक्लियस (टॉप-पी) नमूनाकरण 论文
- [Kingma & Welling (2014): Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114)- 介绍 पुनरामेट्रिककरण चाल का VAE 论文
- [Ho, Jain, Abbeel (2020): Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239)- डीडीपीएम नमूनाकरण को छवि उत्पादन से जोड़ देगा
