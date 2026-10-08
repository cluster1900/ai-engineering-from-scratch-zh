# गतिशील प्रोग्रामिंग  नीति पुनरावृत्ति & मूल्य पुनरावृत्ति

> गतिशील प्रोग्रामिंग RL है带作弊的.आप पहले से ही संक्रमण और इनाम कार्यों को जानते हैं;आपके केवल आवश्यकता है दोहराएँ बेलमैन समीकरण, जब तक `V`या `π`यह प्रत्येक नमूना आधारित विधि है जो कि मूलभूत के करीब आने की कोशिश करती है।

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs)
**Time:** ~75 minutes

## 问题

आप एक ज्ञात मॉडल के MDP: आप किसी भी राज्य कार्रवाई जोड़ी के लिए पूछ सकते हैं `P(s' | s, a)`和 `R(s, a, s')`◊ भंडार प्रबंधक जानता है आवश्यकता वितरण──棋盘 खेल निश्चित संक्रमण है── ग्रिडवर्ल्ड केवल चार पंक्तियों के लिए आवश्यक है── आप एक *मॉडल*──

मॉडल मुक्त आरएल ((Q-learning、PPO、REINFORCE) का आविष्कार मॉडल के अभाव में हुआ है, यानी आप केवल पर्यावरण से नमूना ले सकते हैं। लेकिन जब आपके पास मॉडल होता है, तो बेहतर तरीके से गतिशील प्रोग्रामिंग का उपयोग किया जाता है। बेलमैन ने इन तरीकों को 1957 में डिजाइन किया था। वे आज भी सही ढंग से परिभाषित करते हैंः जब लोग कहते हैं कि यह एमडीपी की इष्टतम नीति है, तो वे डीपी को रिटर्न नीति कहते हैं।

आप 2026 में अभी भी उन्हें जरूरत है, कारण है तीन बिंदुओं. पहला, आरएल अनुसंधान में प्रत्येक तालिका वातावरण में (GridWorld, FrozenLake, CliffWalking) डीपी का उपयोग करेंगे, स्वर्ण मानक नीति उत्पन्न करने के लिए) दूसरा, सटीक मान आपको नमूना लेने की विधि * डिबग* कर सकते हैंः यदि Q-लर्निंग के लिए`V*(s_0)`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

## 概念

![Policy iteration and value iteration, side by side](../assets/dp.svg)

**两个算法，都是 Bellman 上的 fixed-point iteration。**

**Policy iteration。**交替执行两步,直到政策不再变──

1. *मूल्यांकन:* 给定 नीति `π`,反复应用 `V(s) ← Σ_a π(a|s) Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`, जब तक收, इस प्रकार गणना `V^π`
2. *सुधार*`V^π`,让 `π`तुलना `V^π`变为贪:`π(s) ← argmax_a Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`

收是有保证的,因为 (a) प्रत्येक सुधार चरण को बनाए रखना है`π`कुछ राज्यों में सुधार करना होगा।`V^π`, (ख) निर्धारक नीति का स्थान सीमित है। यहां तक कि बड़े आकार के राज्य स्थानों में भी, आमतौर पर लगभग 520 बार बाहरी पुनरावृत्तियों में भी होता है।

**Value iteration。** मूल्यांकन एवं सुधार 合并成一次扫描──应用 बेलमैन *अनुकूलता* समीकरण:

`V(s) ← max_a Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`

重复 तक तक `max_s |V_{new}(s) - V(s)| < ε`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

**Generalized policy iteration (GPI)。**统一视角── मूल्य फ़ंक्शन 和 नीति एक द्वि-तरफा सुधार लूप में लॉक की जाती है; किसी भी समय दो को एक-दूसरे की ओर बढ़ाने के लिए एक-दूसरे से सहमत तरीके से काम करना (असिनक मूल्य पुनरावृत्ति, संशोधित नीति पुनरावृत्ति, क्यू-लर्निंग, अभिनेता-आलोचक, पीपीओ) जीपीआई का एक उदाहरण है।

**为什么 `γ < 1` 很重要。**बेलमैन ऑपरेटर में सुपर-नॉर्म नीचे एक है`γ`-संकुचनः`||T V - T V'||_∞ ≤ γ ||V - V'||_∞`◊ संकुचन का अर्थ है एक ही निश्चित बिंदु 和几何收──`γ < 1`, तुम बस गारंटी खो दिया है, एक सीमित क्षितिज या अवशोषित टर्मिनल राज्य की आवश्यकता है.

## 动手构建

### चरण 1: GridWorld MDP मॉडल का निर्माण

उपयोग पाठ 01 में एक ही 4×4 ग्रिडवर्ल्ड. . . हम एक स्टोकास्टिक 变体: एजेंट 以 `0.1`की संभावनाएं क्रमशः ऊर्ध्वाधर दिशा में होती हैं।

```python
SLIP = 0.1

def transitions(state, action):
    if state == TERMINAL:
        return [(state, 0.0, 1.0)]
    outcomes = []
    for direction, prob in action_probs(action):
        outcomes.append((apply_move(state, direction), -1.0, prob))
    return outcomes
```

`transitions(s, a)` लौटें `(s', r, p)`列表── यह है पूरे मॉडल──

### चरण 2: नीतिगत मूल्यांकन

给定政策 `π(s) = {action: prob}`,代 बेलमैन समीकरण, जब तक `V`ऩयव परिवर्तनः

```python
def policy_evaluation(policy, gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in states()}
    while True:
        delta = 0.0
        for s in states():
            v = sum(pi_a * sum(p * (r + gamma * V[s_prime])
                              for s_prime, r, p in transitions(s, a))
                   for a, pi_a in policy(s).items())
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            return V
```

### चरण 3: नीतिगत सुधार

उपयोग के लिए तुलना `V`                                                                                                                                                                                                                                                              `π` यदि `π` कोई बदलाव नहीं, हम वापस आ गए हैं, क्योंकि हम इष्टतम तक पहुंच चुके हैं

```python
def policy_improvement(V, gamma=0.99):
    new_policy = {}
    for s in states():
        best_a = max(
            ACTIONS,
            key=lambda a: sum(p * (r + gamma * V[s_prime])
                              for s_prime, r, p in transitions(s, a)),
        )
        new_policy[s] = best_a
    return new_policy
```

### चरण 4: 组合起来

```python
def policy_iteration(gamma=0.99):
    policy = {s: "up" for s in states()}   # arbitrary start
    for _ in range(100):
        V = policy_evaluation(lambda s: {policy[s]: 1.0}, gamma)
        new_policy = policy_improvement(V, gamma)
        if new_policy == policy:
            return V, policy
        policy = new_policy
```

4×4 上典型会在 46 बार बाहरी पुनरावृत्तियों内收──输出 `V*(0,0) ≈ -6`, तथा एक कठोर कदमों की संख्या को कम करने की नीति

### चरण 5: मूल्य पुनरावृत्ति(单 loop  संस्करण)

```python
def value_iteration(gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in states()}
    while True:
        delta = 0.0
        for s in states():
            v = max(sum(p * (r + gamma * V[s_prime])
                       for s_prime, r, p in transitions(s, a))
                   for a in ACTIONS)
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            break
    policy = policy_improvement(V, gamma)
    return V, policy
```

समान निश्चित बिंदु, कम कोड लाइन संख्या

## 常见陷

- **忘记处理 terminals。**यदि आप अवशोषण स्थिति के लिए Bellman आवेदन, यह अभी भी एक कुछ भी नहीं बदल जाएगा सर्वश्रेष्ठ कार्रवाई── उपयोग `if s == terminal: V[s] = 0`防护──
- **Sup-norm vs L2 convergence。**उपयोग `max |V_new - V|`, औसत मूल्य का उपयोग न करें। सिद्धांत रूप में, यह एक सुपर-नॉर्म है।
- **In-place vs synchronous updates。**मूल `V[s]`(गॉस-सेडेल) से तुलना में उपयोग करने के लिए अलग`V_new`dict(Jacob)收更快──उत्पादन कोड प्रयोग इन-प्लेस──
- **Policy ties。**यदि दो कार्यों के समान Q-मूल्य है,`argmax`हो सकता है कि प्रत्येक पुनरावृत्ति विभिन्न तरीकों से पॉलिसी स्थिर 检查振荡── उपयोग स्थिर टाई-ब्रेक 固定 क्रम में पहला कार्य)
- **State-space explosion。**डीपी हर बार झाड़ना है`O(|S| · |A|)` सबसे ज्यादा उपयोग में आने वाले लगभग 107 राज्यों में  से अधिक आकार के लिए आपको फ़ंक्शन अनुमान की आवश्यकता है


```figure
value-iteration-gamma
```

## इसका उपयोग करें

2026 में, डीपी सही है, योजनाकारों के आंतरिक लूपः

| Use case | Method |
|----------|--------|
| 精确求解小型 tabular MDP | Value iteration（更简单）或 policy iteration（outer steps 更少） |
| 验证 Q-learning / PPO 实现 | 在 toy environment 上与 DP-optimal V* 对比 |
| Model-based RL（Phase 9 · 10） | 在 learned transition model 上做 Bellman backup |
| AlphaZero / MuZero 中的 Planning | Monte Carlo Tree Search = async Bellman backup |
| Offline RL（CQL、IQL） | Conservative Q-iteration，即带有 OOD actions penalty 的 DP |

जब कोई कहता है कि उत्तम मूल्य फ़ंक्शन 时, वे उच्चतम मूल्य फ़ंक्शन 时 का अर्थ है उच्चतम मूल्य फ़ंक्शन `V*`या `Q*`时, कृपया इस लूप को कल्पना करें

## 交付 यह

保存为 `outputs/skill-dp-solver.md`:

```markdown
---
name: dp-solver
description: 通过 policy iteration 或 value iteration 精确求解小型 tabular MDP。报告收敛行为。
version: 1.0.0
phase: 9
lesson: 2
tags: [rl, dynamic-programming, bellman]
---

给定一个已知 model 的 MDP，输出：

1. 选择。Policy iteration vs value iteration。理由需关联 |S|、|A|、γ。
2. 初始化。V_0、starting policy。Convergence sensitivity。
3. 停止条件。Sup-norm tolerance ε。预期 sweeps 数。
4. 验证。精确计算的 V*(s_0)。提取出的 Greedy policy。
5. 使用方式。这个 baseline 将如何用于 debug/evaluate sampling-based methods。

拒绝在 state spaces > 10⁷ 上运行 DP。没有 sup-norm check 时，拒绝声称收敛。将 infinite-horizon task 上任何 γ ≥ 1 标记为 guarantee violation。
```

## अभ्यास

1. **Easy.**4×4 ग्रिडवर्ल्ड ऊपर उपयोग `γ ∈ {0.9, 0.99}`运行 मूल्य पुनरावृत्ति──直到 `max |ΔV| < 1e-6` कितनी बार साफ़ करने की जरूरत है? `V*`打印为4×4 ग्रिड
2. **Medium.**में *stochastic* GridWorld(स्लिप संभावना `0.1`) ऊपर तुलना नीति पुनरावृत्ति 和 मूल्य पुनरावृत्ति──统计:sweeps、wall-clock time、最终 `V*(0,0)` कौन सी पुनरावृत्ति में ऊपर प्राप्त करने के लिए अधिक तेजी से? कौन सी दीवार घड़ी में ऊपर तेजी से?
3. **Hard.**构建 संशोधित नीति पुनरावृत्ति:在评估阶段中,只运行 `k`अगले साफ़ करते हैं, बजाय संचालित करने के लिए प्राप्त करने के लिए`k ∈ {1, 2, 5, 10, 50}`चित्रण `V*(0,0)`त्रुटि बनाम`k` यह वक्र  आपको मूल्यांकन/सुधार के व्यापार के बारे में क्या जानकारी बताता है?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Policy iteration | “DP algorithm” | 交替进行 evaluation（`V^π`）和 improvement（相对于 `V^π` 的 greedy `π`），直到 policy 不再变化。 |
| Value iteration | “Faster DP” | Bellman optimality backup 在一次 sweep 中应用；几何收敛到 `V*`。 |
| Bellman operator | “The recursion” | `(T V)(s) = max_a Σ P (r + γ V(s'))`；sup-norm 下的 `γ`-contraction。 |
| Contraction | “Why DP converges” | 任何满足 `\|\|T x - T y\|\| ≤ γ \|\|x - y\|\|` 的 operator `T` 都有唯一 fixed point。 |
| GPI | “Everything is DP” | Generalized Policy Iteration：任何推动 `V` 和 `π` 达到相互一致的方法。 |
| Synchronous update | “Jacobi-style” | 在一次 sweep 中始终使用旧的 `V`；便于清晰分析，但更慢。 |
| In-place update | “Gauss-Seidel-style” | 使用正在被更新的 `V`；实践中收敛更快。 |

## 延伸阅读

- [Sutton & Barto (2018). Ch. 4 — Dynamic Programming](http://incompleteideas.net/book/RLbook2020.pdf) नीति पुनरावृत्ति 和 मूल्य पुनरावृत्ति का क्लासिक प्रस्तुति。
- [Bertsekas (2019). Reinforcement Learning and Optimal Control](http://www.athenasc.com/rlbook.html) संकुचन मानचित्रण 论证的严谨处理──
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887) संशोधित नीति पुनरावृत्ति  और इसके अभिसरण विश्लेषण 
- [Howard (1960). Dynamic Programming and Markov Processes](https://mitpress.mit.edu/9780262582300/dynamic-programming-and-markov-processes/) मूल नीति पुनरावृत्ति पेपर
- [Bertsekas & Tsitsiklis (1996). Neuro-Dynamic Programming](http://www.athenasc.com/ndpbook.html) DP से लगभग-DP/Deep RL के पुल तक, बाद में प्रत्येक वर्ग का उपयोग किया जाएगा।
