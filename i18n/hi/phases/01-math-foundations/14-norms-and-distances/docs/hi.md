# 范数和距离

> आपका दूरी फ़ंक्शन परिभाषित करता है कि क्या कहा जाता है  समान ── चुना गया, नीचे सब कुछ समस्याएं पैदा होती हैं 

**Type:** Build
**Language:**पायथन
**前置要求：**चरण 1, पाठ 01 (रेखीय बीजगणित अंतर्ज्ञान),02 (वेक्टर, मैट्रिक्स और संचालन)
**Time:** ~90 分钟

## 学习目标

- शून्य से L1、L2、कोसाइन、महलनॉबी、जैकार्ड 和 संपादन दूरी  फ़ंक्शन को प्राप्त करें
- एक दिए गए ML कार्य को उपयुक्त दूरी माप चुनें, और समझाएं कि अन्य विकल्प क्यों विफल होंगे
- L1 और L2 范数 को LASSO、Ridge औऱ उसके भू-केंद्रित क्षेत्र से जोड़ना
-  दिखाएँ एक ही डेटा संग्रह में भिन्न मात्रा में उत्पन्न होंगे विभिन्न निकटतम पड़ोसियों

## 问题

आप दो वेक्टरों है. वे शब्द एम्बेडमेंट हो सकता है. यह भी हो सकता है उपयोगकर्ता छवि हो सकता है. यह भी हो सकता है कि एक विज़ुअल संख्या है. आप जानना चाहते हैंः वे करीब हैं?

答案 पूरी तरह से आप किस दूरी फ़ंक्शन का चयन करते हैं पर निर्भर करता है। एक माप में दो डेटा बिंदु निकटतम पड़ोसी हो सकते हैं, दूसरे माप में लेकिन बहुत दूर हैं। आपका KNN वर्गीकरणकर्ता, अनुशंसा इंजन, वेक्टर डेटाबेस, क्लस्टरिंग एल्गोरिदम, हानि फ़ंक्शन इस विकल्प पर निर्भर करता है।

कोई सामान्य उपयोग की सर्वोत्तम दूरी नहीं है। L2 适合空间数据――Cosine समानता NLP में प्रमुखता  जैकार्ड 处理集合――Edit distance 处理字串――Mahalanobis 会考虑相关性――Wasserstein会移动概率质量―― प्रत्येक प्रकार के बारे में 相似含义 के विभिन्न परिकल्पनाएँ编码 করা হয়েছে――

यह कक्षा शून्य से प्रत्येक मुख्य दूरी कार्य का निर्माण करेगी, यह समझाएगी कि किस प्रकार का उपयोग करना है, और यह दिखाएगी कि एक ही डेटा का उपयोग करके अलग-अलग मापों के कारण पूरी तरह से अलग-अलग निकटतम पड़ोसी कैसे उत्पन्न होते हैं।

## 概念

### मानदंडः测量 वेक्टर

范数衡量一个向量的大小── दो वेक्टरों के बीच प्रत्येक दूरी फ़ंक्शन को उनके अंतर मूल्य के范数 में लिखा जा सकता हैःd, b) = a - b) = a 

### L1 नॉर्म (म्यान्हट्टन दूरी)

L1 मानदंड सभी अंशों के लिए पूर्ण मूल्य की मांग और

```
||x||_1 = |x_1| + |x_2| + ... + |x_n|
```

इसे मैनहट्टन दूरी कहा जाता है, क्योंकि यह उस दूरी को मापता है जो आप शहर के नेटवर्क के बीच में चलते हैं, जहां आप केवल एक रेखांकन अक्ष के साथ चल सकते हैं, न कि एक कोण के साथ।

```
Point A = (1, 1)
Point B = (4, 5)

L1 distance = |4-1| + |5-1| = 3 + 4 = 7

On a grid, you walk 3 blocks east and 4 blocks north.
```

何時使用 L1:
- 高维稀疏数据(文本特征、एक-गर्म एन्कोडिंग)
- जब आप अपेक्षाओं के लिए अधिक स्थिर समय चाहते हैं (एक बड़ा अंतर परिणाम नहीं होगा)
- विशेषण चयन समस्या (L1 नियमितता 会促进稀疏性)

L1 नियमितीकरण (Lasso) के साथ संपर्कः में शामिल होगा आपका नुकसान फ़ंक्शन1, जो आपके वजन के लिए एक निश्चित मूल्य के साथ होगा। यह एक निश्चित शून्य पर एक छोटा वजन लाएगा, जिससे स्वचालित विशेषता चयन को निष्पादित किया जाएगा। L1 दंड वजन के स्थान में एक  आकार के क्षेत्र में उत्पन्न होगा, जबकि  आकार के कोन एक आसन अक्ष पर स्थित होंगे, जहां कुछ वजन शून्य होगा।

√ हानि फ़ंक्शन के संबंधः औसत पूर्ण त्रुटि (MAE) = अनुमानित मूल्य और लक्ष्य मूल्य के बीच L1 दूरी का औसत मूल्य।

### L2 मानक (यूक्लिडियन दूरी)

L2 मानदंड है सीधा दूरी। यह वर्ग वर्ग के बराबर है।

```
||x||_2 = sqrt(x_1^2 + x_2^2 + ... + x_n^2)
```

यही है कि आप ने भूगोल के विषय में जो दूरी सीखी है, वह है

```
Point A = (1, 1)
Point B = (4, 5)

L2 distance = sqrt((4-1)^2 + (5-1)^2) = sqrt(9 + 16) = sqrt(25) = 5.0

The straight line, cutting diagonally through the grid.
```

何時使用 L2:
- निम्न से मध्यम आयाम के निरंतर डेटा
- जब विशेषता माप तुलनात्मक
- 物理距离(空间数据、传感器读数)
- 像素级的图像相似度

L2 नियमितीकरण (Ridge) के साथ संबंधः में शामिल होने के बाद आपके नुकसान का भार बढ़ेगा। L1 के विपरीत, यह भार को शून्य तक नहीं बढ़ाएगा। यह अनुपात के अनुसार स्वामित्व को शून्य तक कम करेगा। L2 दंड क्षेत्र को घेर देगा, इसलिए सीट अक्ष पर कोई कोण नहीं होगा।

√ हानि फ़ंक्शन के संपर्क मेंः औसत वर्ग त्रुटि (MSE) = L2 दूरी 平方的平均值──平方会比小误差更重地惩罚大误差──

```
MAE (L1 loss):  |y - y_hat|         Linear penalty. Robust to outliers.
MSE (L2 loss):  (y - y_hat)^2       Quadratic penalty. Sensitive to outliers.
```

### Lp मानदंडः通用族

L1 और L2 Lp मानदंड की विशेष परिस्थितियां हैंः

```
||x||_p = (|x_1|^p + |x_2|^p + ... + |x_n|^p)^(1/p)
```

अलग अलग p मूल्य उत्पन्न होगा एकता गेंदों के विभिन्न आकारों(अंतर मूल बिंदु से 1 के सभी बिंदुओं का संग्रह):

```
p=1:    Diamond shape      (corners on axes)
p=2:    Circle/sphere      (the usual round ball)
p=3:    Superellipse       (rounded square)
p=inf:  Square/hypercube   (flat sides along axes)
```

### L-अनंतता मानक (चेबिशेव दूरी)

जब पी                                                                                                                                                                                                                                                              

```
||x||_inf = max(|x_1|, |x_2|, ..., |x_n|)
```

 दो बिंदुओं के बीच की दूरी उन दोनों में सबसे अधिक अंतर के कारण निर्धारित होती है

```
Point A = (1, 1)
Point B = (4, 5)

L-inf distance = max(|4-1|, |5-1|) = max(3, 4) = 4
```

何時使用 L-अनंतता:
- जब एक एकल आयाम में सबसे खराब स्थिति अंतर महत्वपूर्ण है
- 游戏棋盘(国际象棋中的国王按L-अनंत 移动:任意方向走一步的代价都是1)
- 制造公差 (प्रत्येक आयाम को नियमानुसार होना चाहिए)

### कॉसिन समानता और कॉसिन दूरी

दो वेक्टरों के बीच के कोणों को मापने के लिए, इनका आकार अनदेखा करना

```
cos_sim(a, b) = (a . b) / (||a||_2 * ||b||_2)
```

इसका दायरा -1 ((उपक्रम) से +1 ((उपक्रम) तक है।

कॉस्मीन दूरी इसे दूरी में बदल देगा: कॉस्मीन_दूरी = 1 - कॉस्मीन_समानता── दायरा है 0(उसी दिशा) से 2(उसी दिशा相反)──

```
a = (1, 0)    b = (1, 1)

cos_sim = (1*1 + 0*1) / (1 * sqrt(2)) = 1/sqrt(2) = 0.707
cos_dist = 1 - 0.707 = 0.293
```

क्यों कॉसीन NLP में और एम्बेडिंग्स में प्रमुख है: ग्रंथों में, दस्तावेज की लंबाई समानता को प्रभावित नहीं करना चाहिए।

何時使用 कोसाइन समानता:
- 文本相似度(TF-IDF वेक्टर, शब्द एम्बेडमेंट, वाक्य एम्बेडमेंट)
- किसी भी आकार में शोर है, दिशा संकेत क्षेत्र है
- 推系统(उपयोगकर्ता पसंद वेक्टर)
- वेक्टर डेटाबेस को एम्बेड करना  लगभग हमेशा कॉसिन या डॉट उत्पाद का उपयोग करना)

### डॉट उत्पाद समानता बनाम कॉसिन समानता

两个 भेक्टर का डॉट उत्पाद है:

```
a . b = a_1*b_1 + a_2*b_2 + ... + a_n*b_n
      = ||a|| * ||b|| * cos(angle)
```

कॉसाइन समानता दो बड़े आकार के गुणों के बाद की गुणों के उत्पाद पर होती है।

```
If ||a|| = 1 and ||b|| = 1:
    a . b = cos(angle between a and b)
```

它们的不同情况:dot product 包含大小信息──大小更大的矢量会得到更高的点 product 分数── कुछ खोज प्रणाली में, यदि आप 热门物品排名更高 चाहते हैं, तो यह महत्वपूर्ण है──大小会作为隐式质量或重要性信号──

```
a = (3, 0)    b = (1, 0)    c = (0, 1)

dot(a, b) = 3     dot(a, c) = 0
cos(a, b) = 1.0   cos(a, c) = 0.0

Both agree on direction, but dot product also reflects magnitude.
```

实践中:
- जब आप चाहते हैं कि शुद्ध दिशा में समानता के रूप में, प्रयोग कॉसिन समानता
- जब बड़े आकार में सार्थक जानकारी ले जाने, उपयोग डॉट उत्पाद
- 许多矢量数据库(Pinecone、Weaviate、Qdrant) आपको इन दोनों के बीच चयन करने की अनुमति देता है
- यदि आपके एम्बेडमेंट  L2 सामान्य हो गया है, तो चुनें कौन है जो कुछ भी आवश्यक है

### महलनोबी दूरी

यूक्लिडियन दूरी सभी आयामों के लिए समान है। लेकिन यदि आपकी विशेषताएं संबंधित हैं, या आयाम अलग हैं, तो L2 गलत दिशा देने वाला परिणाम देगा।

महलनबी दूरी  संरचना   के आंकड़ों की भिन्नता को ध्यान में रखना होगा

```
d_M(x, y) = sqrt((x - y)^T * S^(-1) * (x - y))
```

इनमें से S डेटा की कोवरिएंस मैट्रिक्स है।

直观理解:महलनॉबी दूरी पहले डेटा को संबंधित और पुनः एकत्रित करने के लिए होगी, फिर परिवर्तन के बाद अंतरिक्ष में गणना की जाएगी L2 दूरी── यदि S पहचान मैट्रिक्स है, तो महलनॉबी दूरी यूक्लिडियन दूरी में वापस जाएगी──

```
Example: height and weight are correlated.
Someone 6'2" and 180 lbs is not unusual.
Someone 5'0" and 180 lbs is unusual.

Euclidean distance might say they are equally far from the mean.
Mahalanobis distance correctly identifies the second as an outlier
because it accounts for the height-weight correlation.
```

何時使用 महलनोबी दूरीः
- अप्रासंगिक पता लगाना ((= औसत महलनोबी दूरी  बड़े बिंदु अप्रासंगिक हैं)
- जब विशेषताएं भिन्न होती हैं और संबंध होते हैं तो वर्गीकरण
- जब आप पर्याप्त डेटा है एक विश्वसनीय सह-विवर्तन मैट्रिक्स का अनुमान लगाने के लिए जब
- 制造质量控制 (उत्पादन के लिए एक उपकरण)

### जैकार्ड समानता (उपयोगी संचलन)

जैकार्ड समानता  दो संचियों के बीच के ओवरलैप की डिग्री को मापने

```
J(A, B) = |A intersect B| / |A union B|
```

इसका दायरा 0 है (कोई ओवरले नहीं) से 1 तक (एक ही संच) है (जैकार्ड दूरी = 1 - जैकार्ड समानता)

```
A = {cat, dog, fish}
B = {cat, bird, fish, snake}

Intersection = {cat, fish}         size = 2
Union = {cat, dog, fish, bird, snake}  size = 5

Jaccard similarity = 2/5 = 0.4
Jaccard distance = 0.6
```

何時使用 Jaccard:
- लेबल, वर्ग या विशेषता संग्रह की तुलना करें
- 基于词是否出现的文档相似度 (शब्दों की उपस्थिति की तुलना में)
- 近重复检测(जैकार्ड के मिनहाश 近似)
- तुलना करें द्वितीयक विशेषता वेक्टर (अस्तित्व/अस्तित्व डेटा)
- 评估分割模型(संघ के पार का चौराहा = जैकार्ड)

### दूरी ] ] लेविनश्टीन दूरी संपादित करें)

दूरी संपादित करें 计算把一个字符串转换到另一个字符串所需的最小单字符操作数――操作包括:插入、删除或替换──

```
"kitten" -> "sitting"

kitten -> sitten  (substitute k -> s)
sitten -> sittin  (substitute e -> i)
sittin -> sitting (insert g)

Edit distance = 3
```

उपयोग动态规划计算──填充一个矩阵,其中条目 (i, j) 是字符串 A 的前 i 个字符串与字符串 B 的前 j 个字符之间的编辑距离──

```
        ""  s  i  t  t  i  n  g
    ""   0  1  2  3  4  5  6  7
    k    1  1  2  3  4  5  6  7
    i    2  2  1  2  3  4  5  6
    t    3  3  2  1  2  3  4  5
    t    4  4  3  2  1  2  3  4
    e    5  5  4  3  2  2  3  4
    n    6  6  5  4  3  3  2  3
```

何時使用 संपादन दूरीः
- 拼写 जाँच और सुधार
- डीएनए अनुक्रम संरेखण (带加权操作)
- 模糊字符串匹配
- 脏文本数据去重

### KL विचलन (दूरी नहीं है, लेकिन हमेशा एक दूरी के रूप में प्रयोग किया जाता है)

KL विभेदन  एक संभावना वितरण और एक अन्य संभावना वितरण के अंतर को मापने। यह विषय पाठ 09 में बताया गया है, लेकिन यह इस चर्चा में शामिल है, क्योंकि लोग इसे अक्सर दूरी के रूप में उपयोग करते हैं, हालांकि यह दूरी नहीं है।

```
D_KL(P || Q) = sum(p(x) * log(p(x) / q(x)))
```

关键性质:KL विभेदन 不是对称的──

```
D_KL(P || Q) != D_KL(Q || P)
```

इसका अर्थ है कि यह दूरी की मात्रा की मूल आवश्यकताओं को पूरा नहीं करता है।

आगे KL(D_KL(P                                                                                                                                                                                                                                                           
उल्टा KL(D_KL(Q जज P)) मोड-खोजने वाला:Q 专注于P的单个模式──

आप इन स्थानों में KL विचलन देखेंगेः
- VAEs(ELBO के बीच KL 项会把潜伏分布 推向前)
- ज्ञान का विसर्जन (छात्र 试图匹配 शिक्षक का वितरण)
- RLHF(KL पेनल्टी 让细调模型 保持接近基模型)
- नीति ग्रेडिएंट पद्धति (अधिनियम)

### वास्स्टीन दूरी (Earth Mover's Distance)

वास्स्टीन दूरी  माप एक संभावना वितरण को दूसरे संभावना वितरण में परिवर्तित करने के लिए आवश्यक न्यूनतम कार्य── इस प्रकार समझा जा सकता हैः यदि एक वितरण एक ढेर में है, तो दूसरा एक खदान है, आपको कितनी भूमि को स्थानांतरित करने की आवश्यकता है  कितनी दूर?

```
W(P, Q) = inf over all transport plans gamma of E[d(x, y)]
```

 1D विभाजन के लिए, यह संचयी वितरण फ़ंक्शन के लिए सरल होगा

```
W_1(P, Q) = integral |CDF_P(x) - CDF_Q(x)| dx
```

क्यों वास्स्टीन  महत्वपूर्णः
- यह एक वास्तविक मीट्रिक है (
- यहां तक कि वितरण नहीं है, यह भी ग्रेडिएंट प्रदान कर सकते हैं(केएल विचलन 会趋向无穷大)
- इस प्रकृति ने इसे वास्स्टीन GANs के केंद्र में बनाया, जिन्होंने मूल GANs के प्रशिक्षण की अस्थिरता को हल किया

```
Distributions with no overlap:

P: [1, 0, 0, 0, 0]    Q: [0, 0, 0, 0, 1]

KL divergence: infinity (log of zero)
Wasserstein: 4 (move all mass 4 bins)

Wasserstein gives a meaningful gradient. KL does not.
```

何時使用 वास्स्टीन:
- GAN प्रशिक्षण(WGAN、WGAN-GP)
- तुलना संभव नहीं ओवरलैप वितरण
- इष्टतम परिवहन 问题
- 图像检索(比较颜色直方图)

### क्यों विभिन्न कार्यों को अलग दूरी की आवश्यकता होती है

| Task | Best distance | Why |
|------|--------------|-----|
| 文本相似度 | Cosine | 大小是噪声，方向是含义 |
| 图像像素比较 | L2 | 空间关系重要，特征尺度可比较 |
| 稀疏高维特征 | L1 | 稳健，不会放大罕见的大差异 |
| 集合重叠（标签、类别） | Jaccard | 数据天然是集合值，而不是 Vector 型 |
| 字符串匹配 | Edit distance | 操作映射到人类编辑直觉 |
| Outlier detection | Mahalanobis | 考虑特征相关性和尺度 |
| 比较分布 | KL divergence | 衡量使用 Q 而不是 P 时丢失的信息 |
| GAN training | Wasserstein | 即使分布不重叠也能提供 Gradients |
| Embeddings（vector DB） | Cosine or dot product | Embeddings 被训练为在方向中编码含义 |
| 推荐 | Dot product | 大小可以编码流行度或置信度 |
| DNA sequences | Weighted edit distance | 替换成本因核苷酸对而异 |
| Manufacturing QC | L-infinity | 任意维度中的最坏情况偏差都很重要 |

### हानि कार्य के साथ संपर्क

हानि फ़ंक्शन = पूर्वानुमान और लक्ष्य मूल्य के बीच दूरी फ़ंक्शन।

```
Loss function       Distance it uses       Behavior
MSE                 L2 squared             Penalizes large errors heavily
MAE                 L1                     Penalizes all errors equally
Huber loss          L1 for large errors,   Best of both: robust to outliers,
                    L2 for small errors    smooth gradient near zero
Cross-entropy       KL divergence          Measures distribution mismatch
Hinge loss          max(0, margin - d)     Only penalizes below margin
Triplet loss        L2 (typically)         Pulls positives close, pushes
                                           negatives away
Contrastive loss    L2                     Similar pairs close, dissimilar
                                           pairs beyond margin
```

### औपचारिकता से संबंध

भार भार के लिए दंडात्मक संख्या में शामिल होने के लिए हानि फ़ंक्शन में औपचारिकता।

```
L1 regularization (Lasso):   loss + lambda * ||w||_1
  -> Sparse weights. Some weights become exactly zero.
  -> Automatic feature selection.
  -> Solution has corners (non-differentiable at zero).

L2 regularization (Ridge):   loss + lambda * ||w||_2^2
  -> Small weights. All weights shrink toward zero.
  -> No feature selection (nothing goes to exactly zero).
  -> Smooth solution everywhere.

Elastic Net:                  loss + lambda_1 * ||w||_1 + lambda_2 * ||w||_2^2
  -> Combines sparsity of L1 with stability of L2.
  -> Groups of correlated features are kept or dropped together.
```

क्यों L1 दुर्लभता उत्पन्न करेगा जबकि L2 नहींः कल्पना 2D 权重空间中的束区域──L1 形, L2 圆形──Loss Function के等高线(圆) सबसे अधिक संभावना है कि कॉर्नर पर संपर्क形, जबकि वहाँ कुछ भार शून्य है──वे एक समतल बिंदु पर संपर्क圆形 में होंगे, जबकि वहां दो भार शून्य हैं──

### निकटतम पड़ोसी की खोज

प्रत्येक दूरी फ़ंक्शन में एक निकटतम पड़ोसी खोज शामिल होती है  प्रश्न: एक क्वेरी बिंदु निर्धारित करें, डेटासेंसर में सबसे निकटतम बिंदु को ढूंढें 

निकटतम पड़ोसी खोज में n 个点、d 个维度 के डेटासेंजर शामिल हैं, प्रत्येक खोज की जटिलता O n * d)  है। बड़े डेटासेंजर के लिए, यह बहुत धीमा है।

निकटतम पड़ोसी (ANN) एल्गोरिथ्म के साथ कम मात्रा में सटीक दर के बदले में भारी गति बढ़ानाः

```
Algorithm         Approach                      Used by
KD-trees          Axis-aligned space partition   scikit-learn (low-dim)
Ball trees        Nested hyperspheres            scikit-learn (medium-dim)
LSH               Random hash projections        Near-duplicate detection
HNSW              Hierarchical navigable         FAISS, Qdrant, Weaviate
                  small-world graph
IVF               Inverted file index with       FAISS (billion-scale)
                  cluster-based search
Product quant.    Compress vectors, search       FAISS (memory-constrained)
                  in compressed space
```

HNSW(पदानुक्रमिक नेविगेबल स्मॉल वर्ल्ड) आधुनिक वेक्टर डेटाबेस में प्रमुख एल्गोरिथ्म है। यह एक बहुस्तरीय चित्र बनाता है, प्रत्येक खंड अपने निकटतम पड़ोसियों से जुड़ा होता है।


```figure
norm-unit-balls
```

##  इसे निर्माण

### 步骤 1: सभी प्रकार संख्या और दूरी फ़ंक्शन

完整实现见 `code/distances.py` प्रत्येक फ़ंक्शन शून्य से निर्मित है, केवल पायथन के आधार पर प्रयोग किया जाता है।

### 步骤 2: समान डेटा, अलग दूरी, अलग-अलग पड़ोसी

`distances.py`मध्य में डेमो एक डेटा सेट बनाएँ, एक क्वेरी बिंदु चुनें, और दिखाएँ कि निकटतम पड़ोसी  कैसे दूरी के साथ आयाम परिवर्तन और परिवर्तन करते हैं L1 में नीचे निकटतम के बिंदु, L2 में या कॉसिन में नीचे संभव नहीं है

### 步骤 3:इम्बेडिंग समानता खोज

代码 समाहित एक नकली एम्बेडिंग समानता खोज, प्रयोग कॉसिन समानता के साथ L2 दूरी 查找与查询 最相似的文档,展示排名可能不同──

## इसका उपयोग करें

सबसे आम उपयोगः वेक्टर डेटाबेस में समान तत्वों की खोज करें

```python
import numpy as np

def cosine_similarity_matrix(X):
    norms = np.linalg.norm(X, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)
    X_normalized = X / norms
    return X_normalized @ X_normalized.T

embeddings = np.random.randn(1000, 768)

sim_matrix = cosine_similarity_matrix(embeddings)

query_idx = 0
similarities = sim_matrix[query_idx]
top_k = np.argsort(similarities)[::-1][1:6]
print(f"Top 5 most similar to item 0: {top_k}")
print(f"Similarities: {similarities[top_k]}")
```

जब आप调用 `model.encode(text)`तब वेक्टर डेटाबेस  Search vector database , bottom layer happens is this thing──Embedding model 会把文本映射为矢量──Vector database 会计算您的查询矢量和每个已存储的矢量 之间的宇宙相似性(或点产品),并使用 ANN 算法避免一检查全部矢量──

## अभ्यास

1. 計算 (1, 2, 3) 和 (4, 0, 6)  के बीच L1、L2 和 L-अनंत दूरीएँ──验证 किसी भी एक对点 के लिए,总有L-inf <= L2 <= L1──证明为什么这个顺序一定成立──

2.  दो वेक्टर बनाएं, जिससे कॉस्मीन की समानता  बहुत उच्च️> 0.9), लेकिन L2 दूरी  बहुत बड़ी️> 10)。

3. ∞ एक फ़ंक्शन को पूरा करें, एक डेटा सेट और एक क्वेरी बिंदु प्राप्त करें,并分别返回 L1、L2、कोसिन 和 महलनोबी दूरी नीचे के निकटतम पड़ोसी को ढूंढें, जिससे चार अलग-अलग दूरी पर किसी भी बिंदु पर सभी राय असहमत हो जायें।

4. उपयोग CDF 方法手动计算 [0.5, 0.5, 0,0] 和 [0, 0, 0.5, 0.5]  के बीच वास्स्टीन दूरी──然后计算 [0.25, 0.25, 0.25, 0.25] 和 [0, 0, 0.5, 0.5]  के बीच दूरी──哪个更大,为什么?

5. ⇒ निकटता जैकार्ड समानता 实现 MinHash── उत्पन्न 100 个随机集合,计算所有对的精确 Jaccard,并使用 50、100、200 个哈希函数的 MinHash 近似进行比较──绘制近似误差──

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Norm | “Vector 的大小” | 一个把 Vector 映射到非负标量的函数，满足三角不等式、绝对齐次性，并且只有零 Vector 的值为零 |
| L1 norm | “Manhattan distance” | 分量绝对值之和。在优化中产生稀疏性。对 outliers 稳健 |
| L2 norm | “Euclidean distance” | 平方分量之和的平方根。Euclidean space 中的直线距离 |
| Lp norm | “Generalized norm” | 分量绝对值 p 次方之和的 p 次根。L1 和 L2 是特殊情况 |
| L-infinity norm | “Max norm” 或 “Chebyshev distance” | 最大绝对分量值。当 p 趋近无穷大时 Lp 的极限 |
| Cosine similarity | “Vectors 之间的角度” | 按两个大小归一化的 dot product。范围从 -1 到 +1。忽略 Vector 长度 |
| Cosine distance | “1 minus cosine similarity” | 将 cosine similarity 转换为距离。范围从 0 到 2 |
| Dot product | “Unnormalized cosine” | 按分量相乘后求和。等于 cosine similarity 乘以两个大小 |
| Mahalanobis distance | “Correlation-aware distance” | 在使用数据 covariance matrix 进行 whitened（去相关和归一化）后的空间中的 L2 distance |
| Jaccard similarity | “Set overlap” | 交集大小除以并集大小。用于集合，而不是 Vectors |
| Edit distance | “Levenshtein distance” | 将一个字符串转换为另一个字符串所需的最少插入、删除和替换次数 |
| KL divergence | “Distance between distributions” | 不是真正的距离（不对称）。衡量使用 Q 编码 P 时产生的额外 bits |
| Wasserstein distance | “Earth mover's distance” | 将质量从一个分布运输到另一个分布所需的最小 work。真正的 metric |
| Approximate nearest neighbor | “ANN search” | 比精确搜索快得多地找到近似最近点的算法（HNSW、LSH、IVF） |
| HNSW | “The vector DB algorithm” | Hierarchical Navigable Small World graph。用于快速 approximate nearest neighbor search 的多层图 |
| L1 regularization | “Lasso” | 将权重的 L1 norm 加入 Loss。把权重推向零（稀疏性） |
| L2 regularization | “Ridge” 或 “weight decay” | 将权重的平方 L2 norm 加入 Loss。将权重向零收缩，但不产生稀疏性 |
| Elastic Net | “L1 + L2” | 结合 L1 和 L2 regularization。比任意单独一种方法都更好地处理相关特征组 |

## 延伸阅读

- [FAISS: A Library for Efficient Similarity Search](https://github.com/facebookresearch/faiss)- मेटा एक अरब के पैमाने पर एएनएन खोज की किटों के साथ उपयोग किया जाता है
- [Wasserstein GAN (Arjovsky et al., 2017)](https://arxiv.org/abs/1701.07875)- पृथ्वी के गतिशील की दूरी को परिभाषित करना 引入GANs 的论文
- [Locality-Sensitive Hashing (Indyk & Motwani, 1998)](https://dl.acm.org/doi/10.1145/276698.276876)- 基础 ANN 算法
- [Efficient Estimation of Word Representations (Mikolov et al., 2013)](https://arxiv.org/abs/1301.3781)- Word2Vec, कोसिन समानता में एम्बेडमेंट्स में बन गया है जहाँ एक मर्जर चयन
- [sklearn.neighbors documentation](https://scikit-learn.org/stable/modules/neighbors.html)- छोटे-छोटे-शैक्षिक मध्य दूरी माप और पड़ोसी एल्गोरिदम का व्यावहारिक मार्गदर्शन
