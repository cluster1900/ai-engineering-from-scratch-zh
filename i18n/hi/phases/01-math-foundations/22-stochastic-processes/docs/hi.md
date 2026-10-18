# स्टोकास्टिक प्रक्रियाएँ

> 具有结构的随机性──随机走行──मार्कोव चेन 和 विसारण मॉडल 背后的数学──

**Type:** Learn
**Language:**पायथन
**Prerequisites:** Phase 1, Lessons 06-07（probability, Bayes）
**Time:** ~75 分钟

## 学习目标
- 模拟 1D 和 2D यादृच्छिक चलने,并验证位移的 $\sqrt{n}$缩放规律
- 构建 मार्कोव श्रृंखला 模拟器,并通过自身组合 计算其静止分布
- मात्रा-हस्टिंग्स MCMC एवं Langevin गतिशीलता को प्राप्त करना, उद्देश्य वितरण से उपयोग किया जाता है
- आगे फैलाव प्रक्रिया को ब्राउनीयन आंदोलन से जोड़ें, रिवर्स प्रक्रिया को समझाएं

## 问题
कई एआई सिस्टम समय के साथ विकसित होने की यादृच्छिकता से संबंधित हैं। यह स्थैतिक यादृच्छिकता नहीं है, बल्कि संरचनात्मक क्रमबद्धता है, जिसमें से प्रत्येक चरण पहले हुई सामग्री पर निर्भर करता है।

भाषा मॉडल एक बार एक टोकन उत्पन्न करते हैं। प्रत्येक टोकन पहले से ही संदर्भ पर निर्भर करता है। मॉडल एक संभावना वितरण का उत्पादन करता है, फिर इसे जारी रखता है। यह एक स्टोकास्टिक प्रक्रिया है।

विसारण मॉडल 逐步图像添加噪音,直到它变成纯静态噪音──然后它们反转这个过程,逐步谴责这个过程,逐步谴责这个过程,直到出现一张新图像──前进过程是一个马科夫链──反转过程是一个反向运行的学到的马科夫链──

एक नए राज्य की ओर एक निश्चित संभावना के साथ प्रत्येक क्रिया होती है। एक स्वतंत्र दुनिया में एक स्वतंत्र नीति का पालन करने वाले एजेंटों की एक पूरी तरह से एक मार्कोव निर्णय प्रक्रिया होती है।

MCMC नमूनाकरण Bayesian inference का आधार है, यह एक Markov श्रृंखला का निर्माण करता है, इसका स्थिर वितरण है,

ये सब चार बुनियादी विचारों पर आधारित हैंः
1. यादृच्छिक चलने  सबसे सरल स्टोकैस्टिक प्रक्रिया
2. मार्कोव चेन  带有过渡矩阵的结构化随机性
3. Langevin गतिशीलता  带噪音的渐进下降
4. मेट्रोपोलिस-हस्टिंग्स                                                                                                                                                                                                                                                           

## 概念
### यादृच्छिक पैदल यात्रा

〇位置 0 开始── प्रत्येक चरण,抛一枚公平硬币──正面:向右移动(+1)──反面:向左移动(-1)──

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             $n$步后, आपका स्थान है $n$个随机 $\pm 1$值的总和──期望位置是0(यह पैदल चलना निष्पक्ष है)──लेकिन मूल बिंदु से दूरी की अपेक्षा दूरी के अनुसार $\sqrt{n}$增长──

यह एक विपरीत है। यह एक समान है, दोनों दिशाओं में कोई बहना नहीं है। लेकिन समय के साथ, यह आगे बढ़ता है।$n$步后 के मानक विचलन $\sqrt{n}$

```
Step 0:  Position = 0
Step 1:  Position = +1 or -1
Step 2:  Position = +2, 0, or -2
...
Step 100: Expected distance from origin ~ 10 (sqrt(100))
Step 10000: Expected distance from origin ~ 100 (sqrt(10000))
```

**在 2D 中**,walk 以相等概率 ऊपर 向下 向左或向右移动$\sqrt{n}$缩放规律──路径会描绘出类似的碎形的模式──

**为什么是 $\sqrt{n}$？**प्रत्येक चरण में एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक-एक$n$步后,位置 $S_n = X_1 + X_2 + \cdots + X_n$, उनमें से प्रत्येक $X_i$शहर है$\pm 1$ प्रत्येक चरण का भिन्नता 1 है और प्रत्येक चरण एक दूसरे से स्वतंत्र है, इसलिए $\mathop{\mathrm{Var}}(S_n) = n$◊मानक विचलन = $\sqrt{n}$ केन्द्रीय सीमा प्रमेय के अनुसार,$S_n / \sqrt{n}$收到标准 सामान्य वितरण──

इस तरह की $\sqrt{n}$缩放在 ML 中随处可见──SGD 噪音按1/sqrt(बच_size) 缩放──Embedding 维度按 $\sqrt{d}$缩放──平方根是独立随机加和的标志──

**与 Brownian motion 的联系。**取一个步骤尺寸 为 $1/\sqrt{n}$、 प्रति यूनिट समय $n$步的随机走行──当 $n$ढ़ेरों दिनों से, इस पैदल यात्रा को ब्राउनियन आंदोलन से प्राप्त होगा $B(t)$ एक निरंतर समय प्रक्रिया, उनमें से $B(t)$服从平均值为 0 变量 为$t$का सामान्य वितरण

ब्राउनियन गति विसारण के गणितीय आधार है। यह द्रव्यमान के बीच कणों की गतिशीलता, शेयर मूल्य की गति, तथा विसारण मॉडल के बीच शोर प्रक्रिया को दर्शाता है।

**Gambler's ruin。**एक आकस्मिक स्थान से चलने वाला$k$开始,在 0 和 $N$处有吸收障碍──到达 $N$0 तक पहुंचने की संभावना क्या है?$P(\text{到达 } N) = k/N$ यह बहुत सरल है और सुंदर है यह मार्टिंगल्स से जुड़ा हुआ है  सिद्धांत  公平 यादृच्छिक चलना एक मार्टिंगल है भविष्य में अपेक्षित मूल्य = वर्तमान मूल्य) 

### मार्कोव चेन

मार्कोव श्रृंखला एक प्रणाली है, जो राज्यों के बीच स्थिर संभावना के अनुसार परिवर्तित होती है।

```math
P(X_{t+1} = j \mid X_t = i, X_{t-1} = \ldots) = P(X_{t+1} = j \mid X_t = i)
```

यह मार्कोव गुण है. इसका मतलब है कि आप एक संक्रमण मैट्रिक्स के साथ कर सकते हैं.$P$ संपूर्ण गतिशीलता का वर्णन करें:

```math
P[i][j] = \text{从状态 } i \text{ 转移到状态 } j \text{ 的概率}
```

$P$. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

**示例 —— Weather：**

```
States: Sunny (0), Rainy (1), Cloudy (2)

P = [[0.7, 0.1, 0.2],    (if sunny: 70% sunny, 10% rainy, 20% cloudy)
     [0.3, 0.4, 0.3],    (if rainy: 30% sunny, 40% rainy, 30% cloudy)
     [0.4, 0.2, 0.4]]    (if cloudy: 40% sunny, 20% rainy, 40% cloudy)
```

किसी भी राज्य से 开始── अनेक परिवर्तनों के बाद, राज्यों का वितरण 收到静止分布 $\pi$, उनमें से $\pi P = \pi$ यह है $P$का स्वमूल्य 为 1 का बाएं स्ववेक्टर──

 长期来看, चाहे जितनी भी स्थिति हो,                                                                                                                                                                                                                                                        

```mermaid
graph LR
    S["Sunny"] -->|0.7| S
    S -->|0.1| R["Rainy"]
    S -->|0.2| C["Cloudy"]
    R -->|0.3| S
    R -->|0.4| R
    R -->|0.3| C
    C -->|0.4| S
    C -->|0.2| R
    C -->|0.4| C
```

**计算 stationary distribution。**दो तरीके हैंः

1. **Power method**: होगा किसी भी प्रारम्भिक वितरण反复乘以 $P$🏻 पर्याप्त पुनरावृत्ति के बाद, यह प्राप्त होगा🏻
2. **Eigenvalue method**:找到 $P$का स्वमूल्य = 1 का बाएं स्ववेक्टर$P^T$का स्वमूल्य 为 1 का स्ववेक्टर──

两种方法都要求链 满足收条件──

**收敛条件。**यदि एक मार्कोव श्रृंखला  निम्नलिखित शर्तों को पूरा, यह एकमात्र स्थिर वितरण प्राप्त होगाः
- **Irreducible**प्रत्येक राज्य में किसी भी अन्य राज्य से पहुंच सकते हैं
- **Aperiodic**: श्रृंखला स्थिर चक्र चक्र में नहीं होगी

आप ML में मिलने वाली अधिकांश श्रृंखलाएं इन दोनों शर्तों को पूरा करती हैं।

**Absorbing states。**अगर एक बार किसी राज्य में प्रवेश किया तो कभी नहीं छोड़ेंगे$P[i][i] = 1$), यह अवस्था  absorbing  absorbing  absorbing Markov chains  can be used to build with terminal states  एक समाप्ति का खेल  एक churn का ग्राहक  एक भाग्य में पाठ के अंत टोकन के टोकन अनुक्रम 

**Mixing time。**需要多少步,chain 才会接近stationary distribution?形式化地说,就是 कुल भिन्नता दूरी और स्थिरीकरण की दूरी किसी 值 से नीचे की आवश्यकता चरण संख्या में कम हो जाती है।$P$                                                                                                                                                                                                                                                              

### भाषा मॉडल के साथ संपर्क

भाषा मॉडल 中的 टोकन पीढ़ी 近似是一个马科夫过程──给定当前文本,模型输出下一个 टोकन 上的分布──温度 控制敏度:

```math
P(\text{token}_i) = \frac{\exp(\text{logit}_i / \text{temperature})}{\sum_j \exp(\text{logit}_j / \text{temperature})}
```

- तापमान = 1.0: मानक वितरण
- तापमान < 1.0:更尖(更确定性)
- तापमान > 1.0:更平坦(更随机)
- तापमान $\to 0$:argmax(लाभपूर्ण)

शीर्ष-के नमूनाकरण संभाव्यता के उच्चतम तक का $k$个 टोकन──Top-p(nucleus) नमूनाकरण 截断到累积概率 超过 $p$集合──两者都会修改马科夫 संक्रमण संभावनाएँ──

### ब्राउनियन मोशन

रैंडम वॉक की निरंतर समय सीमा──स्थिति $B(t)$इसमें तीन विशेषताएं हैंः
1. $B(0) = 0$
2. $B(t) - B(s)$服从平均值为 0 变量 为$t - s$के सामान्य वितरण$t > s$)
3. 相互独立 不重叠区间上 相互独立 相互独立 相互独立

ब्राउनियन गति निरंतर है, लेकिन यह हर आयाम पर गतिशील है।

अलग-अलग मूवमेंट में, आप इस तरह के निकटता Brownian आंदोलन कर सकते हैंः

```math
B(t + dt) = B(t) + \sqrt{dt} \, z, \quad \text{其中 } z \sim \mathcal{N}(0, 1)
```

$\sqrt{dt}$缩放 बहुत महत्वपूर्ण है―― यह आकस्मिक चलने के लिए प्रयोग किए जाने वाले केंद्रीय सीमा प्रमेय से आया है―

### लैंग्विन डायनामिक्स

ग्रेडिएंट अवतरण 寻找函数的最小值──लंजेविन गतिशीलता 寻找与 $\exp(-U(x)/T)$                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             $U$ऊर्जा कार्य है,$T$यह तापमान है

```math
x_{t+1} = x_t - dt \, \nabla U(x_t) + \sqrt{2 T \, dt} \, z_t
```

कणों पर दो प्रकार के प्रभाव हैंः
1. **Gradient force**($-dt \cdot \nabla U$): कम ऊर्जा की ओर प्रवृत्त होना
2. **Random force**($\sqrt{2T dt} \cdot z$): प्रवर्तन के लिए

तापमान$T = 0$时, यह शुद्ध ग्रेडिएंट निस्तारण है. उच्च तापमान. नीचे, यह लगभग यादृच्छिक चलना है.

**与 diffusion models 的联系。**विसारण मॉडल की आगे की प्रक्रिया है:

```math
x_t = \sqrt{\alpha_t} \, x_{t-1} + \sqrt{1 - \alpha_t} \cdot \text{noise}
```

यह एक है जो डेटा को धीरे-धीरे शोर के साथ मिश्रित करता है।$x_T$यह शुद्ध गौसीन शोर है।

रिवर्स प्रोसेस  शोर से डेटा तक लौटने  यह भी एक मार्कोव चेन है, लेकिन इसकी संक्रमण संभावनाएं न्यूरल नेटवर्क द्वारा सीख प्राप्त है──网络学习预测 प्रत्येक कदम में शोर शामिल है, फिर इसे घटाएगा──

```mermaid
graph LR
    subgraph "Forward Process (add noise)"
        X0["x_0 (data)"] -->|"+ noise"| X1["x_1"]
        X1 -->|"+ noise"| X2["x_2"]
        X2 -->|"..."| XT["x_T (pure noise)"]
    end
    subgraph "Reverse Process (denoise)"
        XT2["x_T (noise)"] -->|"neural net"| XR2["x_{T-1}"]
        XR2 -->|"neural net"| XR1["x_{T-2}"]
        XR1 -->|"..."| XR0["x_0 (generated data)"]
    end
```

### MCMC: मार्कोव चेन मोंटे कार्लो

कभी कभी आप एक से एक की जरूरत है कि आप मूल्य प्राप्त कर सकते हैं अनुमति देता है एक निरंतर संख्या के लिए) लेकिन सीधे नहीं कर सकते हैं$p(x)$中采样──拜疆后貌是经典例                                                                                                                                                                                                                                                         

**Metropolis-Hastings**् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ्$p(x)$की मार्कोव श्रृंखलाः

1. किसी स्थान से$x$开始
2. प्रस्ताव वितरण से$Q(x' \mid x)$提议一个新位置 $x'$
3. 计算 स्वीकृति अनुपातः$a = p(x') Q(x \mid x') / (p(x) Q(x' \mid x))$
4.                  $\min(1, a)$ स्वीकार $x'$否则留在 $x$
5. पुनः पुनः

यदि $Q$यह सममित है$Q(x' \mid x) = Q(x \mid x') = \mathcal{N}(x, \sigma^2){}$), अनुपात को सरल बनाने के लिए $a = p(x') / p(x)$ आप केवल संभावनाओं के अनुपात की आवश्यकता  सामान्यीकरण निरंतर 会相互抵消

तापमान के तहत, इस श्रृंखला गारंटी प्राप्त किया गया है।$p(x)$ लेकिन अगर प्रस्ताव 太小

**为什么它有效。**स्वीकृति अनुपात  विवरण संतुलन सुनिश्चित करना:$x$नहीं चला गया$x'$                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             $x'$नहीं चला गया$x$概率---विस्तृत संतुलन अर्थ $p(x)$इस श्रृंखला का स्थिर वितरण है। इसलिए पर्याप्त कदमों से गुजरने के बाद, नमूने से$p(x)$

**实践注意事项：**
- **Burn-in**                                                                                                                                                                                                                                                              $N$个样本――链 需要时间从起点到静止分布――
- **Thinning**: प्रत्येक भाग$k$个样本保留一个, autocorrelation को कम करने हेतु
- **Multiple chains**: विभिन्न बिंदुओं से कई श्रृंखलाएं चलती हैं। यदि वे एक ही वितरण तक पहुंचती हैं, तो प्राप्ति का प्रमाण उपलब्ध है।
- **Acceptance rate**: के लिए $d$维 गौशियन प्रस्तावों, सर्वोत्तम स्वीकृति दर 大约是 23% (Roberts & Rosenthal, 2001) 太高意味着链 几乎不移动──太低意味着它几乎全部拒绝──

### एआई में स्टोकास्टिक प्रक्रियाएं

| Process | AI Application |
|---------|---------------|
| Random walk | RL 中的 exploration、Node2Vec embeddings |
| Markov chain | Text generation、MCMC sampling |
| Brownian motion | Diffusion models（forward process） |
| Langevin dynamics | Score-based generative models、SGLD |
| Markov decision process | Reinforcement learning |
| Metropolis-Hastings | Bayesian inference、posterior sampling |


```figure
random-walk-diffusion
```

##  इसे निर्माण
### 步骤 1: यादृच्छिक चलने सिम्युलेटर

```python
import numpy as np

def random_walk_1d(n_steps, seed=None):
    rng = np.random.RandomState(seed)
    steps = rng.choice([-1, 1], size=n_steps)
    positions = np.concatenate([[0], np.cumsum(steps)])
    return positions


def random_walk_2d(n_steps, seed=None):
    rng = np.random.RandomState(seed)
    directions = rng.choice(4, size=n_steps)
    dx = np.zeros(n_steps)
    dy = np.zeros(n_steps)
    dx[directions == 0] = 1   # right
    dx[directions == 1] = -1  # left
    dy[directions == 2] = 1   # up
    dy[directions == 3] = -1  # down
    x = np.concatenate([[0], np.cumsum(dx)])
    y = np.concatenate([[0], np.cumsum(dy)])
    return x, y
```

1D चलना  भंडारण संचयी राशि ∙ प्रत्येक चरण +1 या -1 ∙$n$步后,位置就是总和──变量 随 随 $n$线性增长, इसलिए मानक विचलन 按 $\sqrt{n}$增长──

### 步骤 2: मार्कोव श्रृंखला

```python
class MarkovChain:
    def __init__(self, transition_matrix, state_names=None):
        self.P = np.array(transition_matrix, dtype=float)
        self.n_states = len(self.P)
        self.state_names = state_names or [str(i) for i in range(self.n_states)]

    def step(self, current_state, rng=None):
        if rng is None:
            rng = np.random.RandomState()
        probs = self.P[current_state]
        return rng.choice(self.n_states, p=probs)

    def simulate(self, start_state, n_steps, seed=None):
        rng = np.random.RandomState(seed)
        states = [start_state]
        current = start_state
        for _ in range(n_steps):
            current = self.step(current, rng)
            states.append(current)
        return states

    def stationary_distribution(self):
        eigenvalues, eigenvectors = np.linalg.eig(self.P.T)
        idx = np.argmin(np.abs(eigenvalues - 1.0))
        stationary = np.real(eigenvectors[:, idx])
        stationary = stationary / stationary.sum()
        return np.abs(stationary)
```

स्थिर वितरण है $P$का स्वमूल्य = 1 का बाएं स्ववेक्टर--- हम गणना के माध्यम से $P^T$के स्वयं वेक्टर इसे खोजने के लिए (पर बाएं स्वयं वेक्टर को दाएं स्वयं वेक्टर में बदल देगा)

### 步骤 3: लैंग्विन गतिशीलता

```python
def langevin_dynamics(grad_U, x0, dt, temperature, n_steps, seed=None):
    rng = np.random.RandomState(seed)
    x = np.array(x0, dtype=float)
    trajectory = [x.copy()]
    for _ in range(n_steps):
        noise = rng.randn(*x.shape)
        x = x - dt * grad_U(x) + np.sqrt(2 * temperature * dt) * noise
        trajectory.append(x.copy())
    return np.array(trajectory)
```

ग्रेडिएंट जनरल$x$推向低能量――噪音 防止它陷入局部停滞――在平衡时,样本分布与$\exp(-U(x)/\text{temperature})$ठीक है।

### 步骤 4: मेट्रोपोलिस-हस्टिंग्स

```python
def metropolis_hastings(target_log_prob, proposal_std, x0, n_samples, seed=None):
    rng = np.random.RandomState(seed)
    x = np.array(x0, dtype=float)
    samples = [x.copy()]
    accepted = 0
    for _ in range(n_samples - 1):
        x_proposed = x + rng.randn(*x.shape) * proposal_std
        log_ratio = target_log_prob(x_proposed) - target_log_prob(x)
        if np.log(rng.rand()) < log_ratio:
            x = x_proposed
            accepted += 1
        samples.append(x.copy())
    acceptance_rate = accepted / (n_samples - 1)
    return np.array(samples), acceptance_rate
```

इस एल्गोरिथ्म ने एक नया बिंदु प्रस्तावित किया, जांच की कि क्या इसकी उच्च संभावना है या नहीं, फिर दोहराया गया।

## इसका उपयोग करें
ा अभ्यास में, आप इन एल्गोरिदम को प्राप्त करने के लिए परिपक्व पुस्तकालय का उपयोग करेंगे  लेकिन डिबगिंग और ट्यूनिंग के लिए तंत्र को समझना  महत्वपूर्ण है 

```python
import numpy as np

rng = np.random.RandomState(42)
walk = np.cumsum(rng.choice([-1, 1], size=10000))
print(f"Final position: {walk[-1]}")
print(f"Expected distance: {np.sqrt(10000):.1f}")
print(f"Actual distance: {abs(walk[-1])}")
```

### संक्रमण मैट्रिक्स के numpy के साथ

```python
import numpy as np

P = np.array([[0.7, 0.1, 0.2],
              [0.3, 0.4, 0.3],
              [0.4, 0.2, 0.4]])

distribution = np.array([1.0, 0.0, 0.0])
for _ in range(100):
    distribution = distribution @ P

print(f"Stationary distribution: {np.round(distribution, 4)}")
```

 आरंभिक वितरण $P$ पर्याप्त पुनरावृत्ति के बाद, यह स्थिर वितरण तक पहुंच जाएगा, चाहे आप किस से शुरू करें यह बाएं स्वायत्त वेक्टर की शक्ति विधि की खोज है

### वास्तविक ढांचे के साथ कनेक्शन

- **PyTorch diffusion：**गले लगाते हुए चेहरा `diffusers`मध्य `DDPMScheduler`实现了 आगे और रिवर्स मार्कोव चेन
- **NumPyro / PyMC：**MCMC(NUTS नमूना का उपयोग करके, यह मेट्रोपोलिस-हस्टिंग्स के लिए सुधार है) बेयिसियन निष्कर्ष करने के लिए
- **Gymnasium (RL)：**पर्यावरण चरण समारोह  परिभाषित एक मार्कोव निर्णय प्रक्रिया

### 验证 मार्कोव श्रृंखला अभिसरण

```python
import numpy as np

P = np.array([[0.9, 0.1], [0.3, 0.7]])

eigenvalues = np.linalg.eigvals(P)
spectral_gap = 1 - sorted(np.abs(eigenvalues))[-2]
print(f"Eigenvalues: {eigenvalues}")
print(f"Spectral gap: {spectral_gap:.4f}")
print(f"Approximate mixing time: {1/spectral_gap:.1f} steps")
```

स्पेक्ट्रल गैप  tell you chain  forget its initial state speed──gap 0.2 का अर्थ है लगभग 5 步即可混合──gap 为 0.01 का अर्थ है लगभग 100 步──运行长度模拟 之前必检查这个点  mixing 很慢的链 会浪费计算──

## 交付 यह
本课产出:
- `outputs/prompt-stochastic-process-advisor.md` एक त्वरित, किसी भी स्टोकैस्टिक प्रक्रिया ढांचे के अनुकूल किसी भी समस्या को पहचानने में मदद करने के लिए

## संबंध

| Concept | Where it shows up |
|---------|------------------|
| Random walk | Node2Vec graph embeddings、RL 中的 exploration |
| Markov chain | LLMs 中的 Token generation、MCMC sampling |
| Brownian motion | DDPM 中的 forward diffusion process、SDE-based models |
| Langevin dynamics | Score-based generative models、stochastic gradient Langevin dynamics (SGLD) |
| Stationary distribution | MCMC convergence target、PageRank |
| Metropolis-Hastings | Bayesian posterior sampling、simulated annealing |
| Temperature | LLM sampling、RL 中的 Boltzmann exploration、simulated annealing |
| Mixing time | MCMC 的 convergence speed、spectral gap analysis |
| Absorbing state | End-of-sequence token、RL 中的 terminal states |
| Detailed balance | MCMC samplers 的 correctness guarantee |

विसारण मॉडल 值得特别关注──DDPM(Ho et al., 2020) ने एक आगे की मार्कोव श्रृंखला को परिभाषित किया हैः

```math
q(x_t \mid x_{t-1}) = \mathcal{N}\left(x_t; \sqrt{1-\beta_t} \, x_{t-1}, \beta_t I\right)
```

उनमें से $\beta_t$यह एक शोर कार्यक्रम है.$T$步后,$x_T$लगभग$\mathcal{N}(0, I)$◊ रिवर्स प्रक्रिया द्वारा एक पूर्वानुमान शोर के तंत्रिका नेटवर्क 参数化:

```math
p_\theta(x_{t-1} \mid x_t) = \mathcal{N}\left(x_{t-1}; \mu_\theta(x_t, t), \sigma_t^2 I\right)
```

पीढ़ी का प्रत्येक कदम मार्कोव श्रृंखला में सीखा गया एक कदम है। मार्कोव श्रृंखलाओं को समझने का अर्थ है कि कैसे और क्यों डेटा उत्पन्न करने में सक्षम है।

SGLD(Stochastic Gradient Langevin Dynamics) ले मिनी-बैच ग्रेडिएंट अवतरण और लैंग्विन शोर 结合起来──你不计算完整的 Gradient,而是使用 Stochastic अनुमान并添加校准的噪音──随着学习率 衰退,SGLD 会从优化 过渡到样本  你几乎免费得到近似的贝叶斯后样本──这是从神经网络 获得不确定性估计的最简单方式之一──

穿越这些联系的关键洞见是:स्टोकैस्टिक प्रक्रियाएं केवल सैद्धांतिक उपकरण नहीं हैं। वे आधुनिक एआई प्रणाली के भीतर की गणना तंत्र हैं। जब आप एलएलएम के तापमान को समायोजित करते हैं, तो आप एक मार्कोव श्रृंखला को समायोजित कर रहे हैं। जब आप विसारण मॉडल का अभ्यास करते हैं, तो आप एक ब्राउनीयन गति की तरह एक प्रक्रिया को उलट-बदलते हुए सीख रहे हैं। जब आप बेयिसियन निष्कर्ष का संचालन करते हैं, तो आप एक रिसेप्टर के पीछे की श्रृंखला का निर्माण कर रहे हैं।

## अभ्यास
1. **模拟 1000 条 10000 步的 random walks。**図解最終位置的分布──验证 यह औसत 0 標準 विचलन के समान है $\sqrt{10000} = 100$का गौसीयन.

2. **使用 Markov chain 构建 text generator。**एक छोटे से शरीर में ऊपर प्रशिक्षणः प्रत्येक शब्द के लिए,统计到下一个词的转变―― निर्माण संक्रमण मैट्रिक्स――通过从链中采样生成新句子――

3. **使用 Metropolis-Hastings 实现 simulated annealing。**उच्च तापमान से 开始 (लगभग सभी सामग्री को स्वीकार करें), फिर धीरे-धीरे降温 (लगभग सभी सामग्री को स्वीकार करें) 

4. **比较不同 temperatures 下的 Langevin dynamics。**डबल-वेल क्षमता से$U(x) = (x^2 - 1)^2$️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

5. **实现 forward diffusion process。**एक 1D संकेत से (उदाहरण के लिए, सिनेस वेव) शुरू करें। रैखिक शोर अनुसूची का उपयोग करें, 100 步中 धीरे-धीरे शोर जोड़ें।

### 提示

**练习 1。**1000  भिन्न बीज 调用 `random_walk_1d(10000, seed=i)`,并保留每次的最终位置──检查的意思是接近0否;标准偏差是接近100否;以及最终位置是否有约68% 落在-100到100之间──

**练习 2。**统计 प्रति आसन्न शब्दों पर होने वाली घटनाओं की संख्या, प्रत्येक पंक्ति को उस पंक्ति के योग के अनुसार विभाजित करके, प्रत्येक पंक्ति के साथ 1  को एक रैंक में प्रवेश करने के लिए `MarkovChain(transition_matrix, state_names)`,并调用 `simulate`◊ जाँच आउटपुट में प्रत्येक पर आसन्न एक शब्द क्या यह भी corpus में दिखाई देता है

**练习 3。**以 $\exp(-\Delta / T)$                                                                                                                                                                                                                                                              $T$乘以一个因子,例如 0.99──在一个已知最小的函数上测试,并与细网格搜索的结果核对──

**练习 4。**ग्रेडिएंट है$4x(x^2 - 1)$, इसे हमें दे देंगे`langevin_dynamics(grad_U, x0, dt, temperature, n_steps)`$x = 0$ के अवरोध उच्चता 1 है, इसलिए 0.05 से 1 के बीच विभिन्न तापमान में नीचे, आंकड़े $x$⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒  ⇒ ⇒ ⇒ ⇒ ⇒ ⇒  ⇒ ⇒     ⇒ ⇒ ⇒ ⇒ ⇒   ⇒            ⇒     ⇒                                                                                                                                                                     

**练习 5。**调用 `diffusion_forward(signal, 100)`,并将所有 $(1 - \beta_t)$एक कदम, अंतिम कदम प्राप्त करें।$\bar{\alpha}$ यदि $\bar{\alpha}$ अभी भी 0 से दूर है, संकेत केवल शोर नहीं है, बढ़ना आवश्यक है `beta_end`△ पहले प्रयोग वास्तविक शोर 测试 डीनोइज़र:此时 $(x_t - \sqrt{1 - \bar{\alpha}_t} \epsilon)/\sqrt{\bar{\alpha}_t}$必須精确還原原始信号──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Random walk | “抛硬币式移动” | 一个 position 在每一步按随机 increments 改变的过程 |
| Markov property | “无记忆性” | future 只依赖当前 state，而不依赖 history |
| Transition matrix | “概率表” | $P[i][j]$ = 从 state $i$ 移动到 state $j$ 的概率 |
| Stationary distribution | “长期平均” | 满足 $\pi P = \pi$ 的分布 $\pi$ —— chain 的 equilibrium |
| Brownian motion | “随机抖动” | random walk 的 continuous-time limit，$B(t) \sim \mathcal{N}(0, t)$ |
| Langevin dynamics | “带噪声的 Gradient Descent” | 结合 deterministic Gradient 与 random perturbation 的 update rule |
| MCMC | “向目标行走” | 构造一个 stationary distribution 为你想要的分布的 Markov chain |
| Metropolis-Hastings | “提议并接受/拒绝” | 使用 acceptance ratios 来确保收敛的 MCMC algorithm |
| Temperature | “随机性旋钮” | 控制 exploration 与 exploitation 之间权衡的参数 |
| Diffusion process | “噪声进，噪声出” | Forward：逐渐添加 noise。Reverse：逐渐移除 noise。生成 data。 |

## 延伸阅读
- **Ho, Jain, Abbeel (2020)** प्रसारण संभाव्यता मॉडल का खंडन करना. प्रसारण मॉडल खोलना 革命的 DDPM 论文──清晰推导了前进和反转马科夫链──
- **Song & Ermon (2019)**  डेटा वितरण के ग्रेडिएंट्स का अनुमान लगाकर जनरेटिव मॉडलिंग। Langevin गतिशीलता का उपयोग करें  नमूनाकरण का स्कोर आधारित 方法──
- **Roberts & Rosenthal (2004)** सामान्य राज्य अंतरिक्ष मार्कोव श्रृंखला और MCMC एल्गोरिदम.    MCMC 何时以及为什么有效的理论──
- **Norris (1997)** मार्कोव चेन. 标准教材── समावेशीकरण, स्थिर वितरण तथा हिट समय को कवर करती है──
- **Welling & Teh (2011)**  स्टोकास्टिक ग्रेडिएंट लैंग्विन डायनामिक्स के माध्यम से बेयिसियन लर्निंग। एसजीडी को लैंग्विन डायनामिक्स के साथ जोड़कर बेयिसियन निष्कर्षों का विस्तार करने के लिए उपयोग किया जाएगा──
