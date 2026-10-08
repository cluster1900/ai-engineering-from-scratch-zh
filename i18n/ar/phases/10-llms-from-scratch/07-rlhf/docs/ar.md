# RLHF: نموذج الجائزة + PPO

> نموذج الكنيسة SFT يتبع التعليمات. ولكن لن يعلم النموذج أي استجابة أفضل.

**类型：**الإنشاء
**语言：**(بايثون)
**前置要求：**المرحلة 10، الدروس 06 ((موافقة التعليمات / SFT)
**时间：**حوالي 90 دقيقة

## 學习目标
- بناء نموذج مكافأة، باستخدام تفضيلات البشر على ((اختيار مقابل رفض)
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
-  شرح لماذا RLHF  بحاجة إلى ثلاثة نماذج                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
- من خلال تحسين التقارن الاختيارات

## 问题
إلى نموذج تساؤل  شرح الحوسبة الكمية، فإنه قد ينتج:

**Response A:** الحساب الكمي يستخدم الكوبيت، فإنها يمكن أن تكون في التنظيم، مما يعني أنها يمكن أن تكون 0 、1 أو في نفس الوقت هي الاثنين. هذا يجعل الكمبيوتر الكمي قادرة على معالجة بعض الحسابات بسرعة من الكمبيوتر الكلاسيكي سريع المعدل. الجيومات الرئيسية تشمل خوارزمية شور المستخدمة في تحليل العدد الكبير، وكذلك خوارزمية جروفر المستخدمة في البحث في قاعدة بيانات غير مرتبة.

**Response B:** الحساب الكمي هو طريقة حسابية تستخدم حدوثات القوة الكمية. تم طرحها في أوائل الثمانينيات. ريشارد فيينمان اقترح أنه يمكن استخدام الحاسوب الكمي لتشابه النظام الكمي. بعد ذلك ، تم التطور الكبير في هذا المجال.

兩回應在事實中都是正确的──语法也都没有问题──它们都遵循指令──但答案A 明显更好──它更简洁、信息量更高、结构也更好──人类每次都会选择A──

SFT  لا يمكن أن تلتقط هذا الفرق. إنها في  صحيح  رد فعل على نموذج التدريب، ولكن لا يوجد آلية لإظهار  هذا الرد أفضل من ذلك الرد .

حل RLHF هذه المشكلة. انه تدريب نموذج مكافأة لتنبؤ أي ردود فعل تفضيل البشر ، ثم باستخدام هذه الإشارة مكافأة  دعم نموذج اللغة 生成更高质量的输出.

## 概念
### المراحل الثلاثة

RLHF ليس عملية تدريبية منفصلة. إنه خط أنابيب يتكون من ثلاث مراحل متتالية، كل مرحلة تم بناؤها على مرحلة سابقة.

**Stage 1: SFT.**في أزواج التعليمات-الرد على النموذج الأساسي للتدريب ((درس 06)  هذا يحصل على نموذج قادر على اتباع التعليمات ، لكنه لا يعرف أي رد فعل أفضل من أي رد فعل آخر 

**Stage 2: Reward Model.**جمع بيانات التفضيلات البشرية: إلى المؤشر عرض نفس الاستجابة الإرتداءين، ومسألة أيه أفضل؟ تدريب نموذج لتنبؤ هذه التفضيلات.

**Stage 3: PPO.**استخدام نموذج مكافأة 为 لغة نموذج 生成训练信号。 نموذج لغة 生成响应, نموذج مكافأة 为其打分,PPO 更新语言模型,使其产生分数更高的响应──KL انحراف عقوبة 防止语言模型 偏离 SFT 太远──

```mermaid
graph TD
    subgraph Stage1["Stage 1: SFT"]
        B["Base Model"] --> S["SFT Model"]
        D["Instruction Data\n(27K examples)"] --> S
    end

    subgraph Stage2["Stage 2: Reward Model"]
        S --> |"Generate responses"| P["Preference Pairs\n(prompt, winner, loser)"]
        H["Human Annotators"] --> P
        P --> R["Reward Model\nR(prompt, response) → score"]
    end

    subgraph Stage3["Stage 3: PPO"]
        S --> |"Initialize policy"| PI["Policy Model\n(being optimized)"]
        S --> |"Freeze as reference"| REF["Reference Model\n(frozen SFT)"]
        PI --> |"Generate"| RESP["Response"]
        RESP --> R
        R --> |"Reward signal"| PPO["PPO Update"]
        REF --> |"KL penalty"| PPO
        PPO --> |"Update"| PI
    end

    style S fill:#1a1a2e,stroke:#51cf66,color:#fff
    style R fill:#1a1a2e,stroke:#e94560,color:#fff
    style PI fill:#1a1a2e,stroke:#0f3460,color:#fff
    style REF fill:#1a1a2e,stroke:#0f3460,color:#fff
    style PPO fill:#1a1a2e,stroke:#e94560,color:#fff
```

### نموذج الجائزة

نموذج الجائزة هو تم تغييره إلى نموذج اللغة من打分器.

输入:一个提示与响应 拼接后后的序列──输出:单个 skalar reward score──

訓練資料是人類偏好對──對每個提示,標標記者看到兩回應并選擇更好的一個──這會創造訓練三元组:(快速, 首選_回應, 拒絕_回應)──

وظيفة الخسارة استخدام تفضيلات زوجية نموذج برادلي-تيري:

```
loss = -log(sigmoid(reward(preferred) - reward(rejected)))
```

هذه هي الصيغة الرئيسية`sigmoid(reward(A) - reward(B))`عطاء الإجابة A 相比 الإجابة B 更受偏好的概率── هذا الخسارة ستعزز نموذج المكافأة 给偏好的答案 分配更高分数──

لماذا تستخدم المقارنات المزدوجة وليس النتائج المطلقة؟ لأن البشر لا يمتلكون قدرة كبيرة على تقديم عدد من النتائج المطلقة للجودة المطلقة.

**InstructGPT numbers:**قام شركة OpenAI بجمع 33 ألف زوج مقارنة من 40 مقاول هناك. كل مقارنة تستغرق حوالي 5 دقائق.

### PPO: تحسين السياسة القريبة

PPO هو نوع من تعزيز التعلم 算法。 في RLHF،بيئة هي نموذج الجائزة،وكيل هي نموذج اللغة،عمل هو إنتاج Token。

目标:

```
maximize: E[R(prompt, response)] - beta * KL(policy || reference)
```

الأول: دفع النموذج إلى إنتاج مكافأة عالية.

لماذا تحتاج إلى عقوبة KL؟ بدونها، النموذج سوف يجد إعادة التأثير. النموذج الثمن هو في مجموعة بيانات محدودة من المفضلة الإنسانية 上 تدريبات.

- 重复 أنا مفيدة جداً و غير مؤذية!  会在 مفيدة / غير مؤذية نموذج مكافأة 上得高分
- الصوت الرسمي ولكن المحتوى الفارغ
- استخدام بيانات التدريبات مناسبة مع مكافأة عالية

تعليقات ك.ل. تعبر عن: يمكنك تحسينها، ولكن لا يمكن أن تصبح نموذجًا مختلفًا تمامًا.

**InstructGPT numbers:**تدريب PPO استخدام lr=1.5e-5、KL معدل بيتا=0.02、256K حلقات(زوجات الاستجابة السريعة) ، وكل مجموعة القيام 4  دورات PPO。 أنبوب RLHF بأكمله في مجموعة GPU 上需要几天时间。

```mermaid
graph LR
    subgraph PPO["PPO Training Loop"]
        direction TB
        PROMPT["Sample prompt\nfrom dataset"] --> GEN["Policy generates\nresponse"]
        GEN --> SCORE["Reward model\nscores response"]
        GEN --> KL["Compute KL divergence\nvs reference model"]
        SCORE --> OBJ["Objective:\nreward - beta * KL"]
        KL --> OBJ
        OBJ --> UPDATE["PPO gradient update\n(clipped surrogate loss)"]
        UPDATE --> |"repeat"| PROMPT
    end

    style PROMPT fill:#1a1a2e,stroke:#0f3460,color:#fff
    style SCORE fill:#1a1a2e,stroke:#51cf66,color:#fff
    style KL fill:#1a1a2e,stroke:#e94560,color:#fff
    style OBJ fill:#1a1a2e,stroke:#e94560,color:#fff
```

### هدف منظمة التعاون البشري 详解

استخدام PPO قطع هدف بديل لمنع التحديثات الكبيرة‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

```
ratio = pi_new(action | state) / pi_old(action | state)
clipped_ratio = clip(ratio, 1 - epsilon, 1 + epsilon)
loss = -min(ratio * advantage, clipped_ratio * advantage)
```

وظيفة الميزة  التقديرات الردود الحالية مقارنة مع الجودة المتوقعة أقل بكثير 

```
advantage = reward(prompt, response) - baseline
```

عادة ما تكون المرحلة الأساسية هي متوسط الجائزة للرد على المدى القريب. الميزة الصالحة تعبر عن أن الرد على المعدل؛ الميزة السلبية تعبر عن أنه أقل من المعدل.

التقطيع  منع تحديث الكوارث  إذا حصل رد فعل واحد على مكافأة عالية بشكل غير عادي، فإن نسبة عدم قطع قد تكون كبيرة جدا، مما يؤدي إلى تحول النموذج بشكل كبير إلى هذا رد فعل

### مكافأة التسلل

هذا هو الظلام المظلم من RLHF. النموذج اللغوي يستهدف نموذج الجائزة 优化، بينما نموذج الجائزة هو النموذج غير الكامل من تفضيلات البشر.

常见失败模式:

| Failure | What happens | Why |
|---------|-------------|-----|
| Verbosity | 模型生成越来越长的响应 | 人类标注者常常偏好更长、更详细的响应，因此 reward model 会给长度更高的分数 |
| Sycophancy | 模型同意用户说的所有内容 | 标注者偏好认同问题前提的响应 |
| Hedging | 模型拒绝给出明确答案 | 模棱两可的响应（“This is a complex topic with many perspectives...”）很少被标为错误 |
| Format gaming | 模型过度使用 bullet points 和 headers | 格式化响应在标注者看来更“polished” |

缓解策略:更强的 KL दण्ड(防止模型偏离到足以利用弱点的程度) 在对抗性示例上训练奖励模型(修补已知失败模式),以及使用多种不同架构的奖励模型 ((更难同时攻破所有模型) 

### خطوط أنابيب RLHF الحقيقية

| Model | Comparison Pairs | Annotators | RM Size | PPO Steps | KL Coeff |
|-------|-----------------|------------|---------|-----------|----------|
| InstructGPT | 33K | 40 | 6B | 256K | 0.02 |
| Llama 2 Chat | ~1M | undisclosed | 70B | undisclosed | 0.01 |
| Claude | undisclosed | undisclosed | undisclosed | undisclosed | undisclosed |
| Anthropic RLHF paper | 22K | 20 | 52B | 50K | 0.001 |

ورقة Anthropic 2022 في 22000 مقارنة تم تدريب نموذج مكافأة 52B. نموذج مكافأة أكبر سوف ينتج إشارة أكثر موثوقية، مما يجعل تدريب PPO أكثر استقرارًا.


```figure
rlhf-pipeline
```

## بناءها
### الخطوة 1: بيانات تفضيلات صناعية

في الإنتاج، يخلق المؤشر البشري بيانات الاختيارات.

```python
import numpy as np

PREFERENCE_DATA = [
    {
        "prompt": "What is the capital of France?",
        "preferred": "The capital of France is Paris.",
        "rejected": "France is a country in Europe. It has many cities. The capital is Paris. Paris is known for the Eiffel Tower.",
    },
    {
        "prompt": "Explain gravity in one sentence.",
        "preferred": "Gravity is the force that attracts objects with mass toward each other.",
        "rejected": "Gravity is something that makes things fall down when you drop them.",
    },
    {
        "prompt": "What is 15 times 7?",
        "preferred": "15 times 7 is 105.",
        "rejected": "Let me think about this. 15 times 7. Well, 10 times 7 is 70, and 5 times 7 is 35, so the answer might be around 105.",
    },
    {
        "prompt": "Name three programming languages.",
        "preferred": "Python, Rust, and TypeScript.",
        "rejected": "There are many programming languages. Some popular ones include various languages like Python and others.",
    },
    {
        "prompt": "What year did World War II end?",
        "preferred": "World War II ended in 1945.",
        "rejected": "World War II was a major global conflict. It involved many countries. The war ended in the mid-1940s, specifically in 1945.",
    },
    {
        "prompt": "Define machine learning.",
        "preferred": "Machine learning is a field where algorithms learn patterns from data to make predictions without being explicitly programmed.",
        "rejected": "Machine learning is a type of AI. AI stands for artificial intelligence. Machine learning uses data to learn.",
    },
]
```

ردود الفعل المفضلة 简洁而直接── ردود الفعل المرفوضة 展现了常见失败模式:不必要的填充、封锁、冗余解释和不精确── هذا هو SFT 无法捕捉、但RLHF 能够捕捉的区别──

### 步骤 2: نموذج المكافأة الهندسة المعمارية

نموذج مكافأة 复用mini GPT 中的تحولات الهندسة المعمارية، ولكن سوف الصوت الصادرة حجم المفردات بدلاً من ذلك إلى مجرد التنبيه المتعدد.

```python
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "04-pre-training-mini-gpt", "code"))
from main import MiniGPT, LayerNorm, Embedding, TransformerBlock


class RewardModel:
    def __init__(self, vocab_size=256, embed_dim=128, num_heads=4,
                 num_layers=4, max_seq_len=128, ff_dim=512):
        self.embedding = Embedding(vocab_size, embed_dim, max_seq_len)
        self.blocks = [
            TransformerBlock(embed_dim, num_heads, ff_dim)
            for _ in range(num_layers)
        ]
        self.ln_f = LayerNorm(embed_dim)
        self.reward_head = np.random.randn(embed_dim) * 0.02

    def forward(self, token_ids):
        seq_len = token_ids.shape[-1]
        mask = np.triu(np.full((seq_len, seq_len), -1e9), k=1)

        x = self.embedding.forward(token_ids)
        for block in self.blocks:
            x = block.forward(x, mask)
        x = self.ln_f.forward(x)

        last_hidden = x[:, -1, :]
        reward = last_hidden @ self.reward_head

        return reward
```

نموذج الجائزة 取*最后* a Token 位置的隐藏状态,并将其投影为 skalar.为什么是最后的 Token?因为 السببية الاهتمام أقناع يعني أن آخر موقع قد حضر حتى الآن من كل Token.

### الخطوة الثالثة: خسارة برادلي تيري

استخدام برادلي تيري زوجية الخسارة في أزواج تفضيلات

```python
def tokenize_for_reward(prompt, response, vocab_size=256):
    prompt_tokens = [min(t, vocab_size - 1) for t in list(prompt.encode("utf-8"))]
    response_tokens = [min(t, vocab_size - 1) for t in list(response.encode("utf-8"))]
    return prompt_tokens + [0] + response_tokens


def sigmoid(x):
    return np.where(
        x >= 0,
        1.0 / (1.0 + np.exp(-x)),
        np.exp(x) / (1.0 + np.exp(x))
    )


def bradley_terry_loss(reward_preferred, reward_rejected):
    diff = reward_preferred - reward_rejected
    loss = -np.log(sigmoid(diff) + 1e-8)
    return loss


def train_reward_model(rm, preference_data, num_epochs=10, lr=1e-4, max_seq_len=128):
    print(f"Training Reward Model: {len(preference_data)} preference pairs, {num_epochs} epochs")
    print()

    losses = []
    accuracies = []

    for epoch in range(num_epochs):
        epoch_loss = 0.0
        epoch_correct = 0
        num_pairs = 0

        indices = np.random.permutation(len(preference_data))

        for idx in indices:
            pair = preference_data[idx]

            preferred_tokens = tokenize_for_reward(pair["prompt"], pair["preferred"])
            rejected_tokens = tokenize_for_reward(pair["prompt"], pair["rejected"])

            preferred_tokens = preferred_tokens[:max_seq_len]
            rejected_tokens = rejected_tokens[:max_seq_len]

            preferred_ids = np.array(preferred_tokens).reshape(1, -1)
            rejected_ids = np.array(rejected_tokens).reshape(1, -1)

            r_preferred = rm.forward(preferred_ids)[0]
            r_rejected = rm.forward(rejected_ids)[0]

            loss = bradley_terry_loss(r_preferred, r_rejected)

            if r_preferred > r_rejected:
                epoch_correct += 1

            diff = r_preferred - r_rejected
            grad = sigmoid(diff) - 1.0

            rm.reward_head -= lr * grad * rm.ln_f.forward(
                rm.embedding.forward(preferred_ids)
            )[:, -1, :].flatten()

            epoch_loss += loss
            num_pairs += 1

        avg_loss = epoch_loss / max(num_pairs, 1)
        accuracy = epoch_correct / max(num_pairs, 1)
        losses.append(avg_loss)
        accuracies.append(accuracy)

        if epoch % 2 == 0:
            print(f"  Epoch {epoch + 1:3d} | Loss: {avg_loss:.4f} | Accuracy: {accuracy:.1%}")

    return rm, losses, accuracies
```

المقاييس الدقيقة 很直接: نموذج الجائزة 能正确排序 多少比例的偏好对?随机模型得分为 50%──在干净数据上训练良好的奖励模型 应超过 70%──InstructGPT的奖励模型在进行比较上达到约72%的准确性,听起来不高,但实际上不错,因为许多偏好对甚至对人类来说也存在歧义(

### الخطوة 4: حلقة PPO مبسطة

完整PPO 很复杂── هذا التنفيذ تمكن من الوصول إلى الآلية الأساسية: توليد رد فعل、打分、 حساب ميزة،并使用 KL عقوبة 更新政策──

```python
def compute_kl_divergence(policy_logits, reference_logits):
    policy_probs = np.exp(policy_logits - policy_logits.max(axis=-1, keepdims=True))
    policy_probs = policy_probs / policy_probs.sum(axis=-1, keepdims=True)
    policy_probs = np.clip(policy_probs, 1e-10, 1.0)

    ref_probs = np.exp(reference_logits - reference_logits.max(axis=-1, keepdims=True))
    ref_probs = ref_probs / ref_probs.sum(axis=-1, keepdims=True)
    ref_probs = np.clip(ref_probs, 1e-10, 1.0)

    kl = np.sum(policy_probs * np.log(policy_probs / ref_probs), axis=-1)
    return kl.mean()


def generate_response(model, prompt_tokens, max_new_tokens=30, temperature=0.8, max_seq_len=128):
    tokens = list(prompt_tokens)

    for _ in range(max_new_tokens):
        context = np.array(tokens[-max_seq_len:]).reshape(1, -1)
        logits = model.forward(context)
        next_logits = logits[0, -1, :]

        next_logits = next_logits / max(temperature, 1e-8)
        probs = np.exp(next_logits - next_logits.max())
        probs = probs / probs.sum()
        probs = np.clip(probs, 1e-10, 1.0)
        probs = probs / probs.sum()

        next_token = np.random.choice(len(probs), p=probs)
        tokens.append(int(next_token))

    return tokens


def copy_model_weights(source, target):
    target.embedding.token_embed = source.embedding.token_embed.copy()
    target.embedding.pos_embed = source.embedding.pos_embed.copy()
    target.ln_f.gamma = source.ln_f.gamma.copy()
    target.ln_f.beta = source.ln_f.beta.copy()
    for s_block, t_block in zip(source.blocks, target.blocks):
        t_block.attn.W_q = s_block.attn.W_q.copy()
        t_block.attn.W_k = s_block.attn.W_k.copy()
        t_block.attn.W_v = s_block.attn.W_v.copy()
        t_block.attn.W_out = s_block.attn.W_out.copy()
        t_block.ffn.W1 = s_block.ffn.W1.copy()
        t_block.ffn.W2 = s_block.ffn.W2.copy()
        t_block.ffn.b1 = s_block.ffn.b1.copy()
        t_block.ffn.b2 = s_block.ffn.b2.copy()
        t_block.ln1.gamma = s_block.ln1.gamma.copy()
        t_block.ln1.beta = s_block.ln1.beta.copy()
        t_block.ln2.gamma = s_block.ln2.gamma.copy()
        t_block.ln2.beta = s_block.ln2.beta.copy()


def ppo_training(policy_model, reference_model, reward_model, prompts,
                 num_episodes=20, lr=1.5e-5, kl_coeff=0.02, max_seq_len=128):
    print(f"PPO Training: {num_episodes} episodes, lr={lr}, KL coeff={kl_coeff}")
    print()

    rewards_history = []
    kl_history = []

    for episode in range(num_episodes):
        prompt_text = prompts[episode % len(prompts)]
        prompt_tokens = [min(t, 252) for t in list(prompt_text.encode("utf-8"))]

        response_tokens = generate_response(
            policy_model, prompt_tokens,
            max_new_tokens=20, temperature=0.8, max_seq_len=max_seq_len
        )

        response_ids = np.array(response_tokens[:max_seq_len]).reshape(1, -1)
        reward = reward_model.forward(response_ids)[0]

        policy_logits = policy_model.forward(response_ids)
        ref_logits = reference_model.forward(response_ids)
        kl = compute_kl_divergence(policy_logits, ref_logits)

        total_reward = reward - kl_coeff * kl

        rewards_history.append(float(reward))
        kl_history.append(float(kl))

        for block in policy_model.blocks:
            update_scale = lr * total_reward
            block.ffn.W1 += update_scale * np.random.randn(*block.ffn.W1.shape) * 0.01
            block.ffn.W2 += update_scale * np.random.randn(*block.ffn.W2.shape) * 0.01

        if episode % 5 == 0:
            avg_reward = np.mean(rewards_history[-5:]) if rewards_history else 0
            avg_kl = np.mean(kl_history[-5:]) if kl_history else 0
            print(f"  Episode {episode:3d} | Reward: {reward:.4f} | KL: {kl:.4f} | "
                  f"Avg Reward: {avg_reward:.4f}")

    return policy_model, rewards_history, kl_history
```

الحلقة الأساسية: 1) اتخاذ استئناف ، 2) توليد الاستجابة ، 3) استخدام نموذج الجائزة 打分 ، 4) حسابات النقاشات KL من المرجحات 结 ، 5) حسابات ضبط بعد الجائزة جائزة خفض عقوبة KL) ، 6) سياسة جديدة.

### الخطوة 5: مقارنة درجة المكافأة

بعد RLHF ,استجابة النموذج السياسي في نموذج الجوائز  上的分应高于原始 SFT 模型的响应.

```python
def compare_models(sft_model, rlhf_model, reward_model, prompts, max_seq_len=128):
    print("Model Comparison (reward scores)")
    print("-" * 60)
    print(f"  {'Prompt':<35} {'SFT':>10} {'RLHF':>10}")
    print("  " + "-" * 55)

    sft_total = 0.0
    rlhf_total = 0.0

    for prompt in prompts:
        prompt_tokens = [min(t, 252) for t in list(prompt.encode("utf-8"))]

        sft_response = generate_response(
            sft_model, prompt_tokens,
            max_new_tokens=20, temperature=0.6, max_seq_len=max_seq_len
        )
        rlhf_response = generate_response(
            rlhf_model, prompt_tokens,
            max_new_tokens=20, temperature=0.6, max_seq_len=max_seq_len
        )

        sft_ids = np.array(sft_response[:max_seq_len]).reshape(1, -1)
        rlhf_ids = np.array(rlhf_response[:max_seq_len]).reshape(1, -1)

        sft_reward = reward_model.forward(sft_ids)[0]
        rlhf_reward = reward_model.forward(rlhf_ids)[0]

        sft_total += sft_reward
        rlhf_total += rlhf_reward

        truncated_prompt = prompt[:33] + ".." if len(prompt) > 35 else prompt
        print(f"  {truncated_prompt:<35} {sft_reward:>10.4f} {rlhf_reward:>10.4f}")

    n = len(prompts)
    print("  " + "-" * 55)
    print(f"  {'Average':<35} {sft_total/n:>10.4f} {rlhf_total/n:>10.4f}")

    return sft_total / n, rlhf_total / n
```

## استخدمها
### التجربة الكاملة لخط أنابيب RLHF

```python
if __name__ == "__main__":
    np.random.seed(42)

    print("=" * 70)
    print("RLHF PIPELINE: REWARD MODEL + PPO")
    print("=" * 70)
    print()

    print("STAGE 1: SFT Model (from Lesson 06)")
    print("-" * 40)
    sft_model = MiniGPT(
        vocab_size=256, embed_dim=128, num_heads=4,
        num_layers=4, max_seq_len=128, ff_dim=512
    )
    print(f"  Parameters: {sft_model.count_parameters():,}")
    print()

    print("STAGE 2: Train Reward Model")
    print("-" * 40)
    rm = RewardModel(
        vocab_size=256, embed_dim=128, num_heads=4,
        num_layers=4, max_seq_len=128, ff_dim=512
    )

    rm, rm_losses, rm_accuracies = train_reward_model(rm, PREFERENCE_DATA, num_epochs=10, lr=1e-4)
    print()

    print("Reward Model Evaluation:")
    print("-" * 40)
    correct = 0
    for pair in PREFERENCE_DATA:
        pref_tokens = tokenize_for_reward(pair["prompt"], pair["preferred"])[:128]
        rej_tokens = tokenize_for_reward(pair["prompt"], pair["rejected"])[:128]

        r_pref = rm.forward(np.array(pref_tokens).reshape(1, -1))[0]
        r_rej = rm.forward(np.array(rej_tokens).reshape(1, -1))[0]

        if r_pref > r_rej:
            correct += 1
        print(f"  Preferred: {r_pref:+.4f} | Rejected: {r_rej:+.4f} | {'Correct' if r_pref > r_rej else 'Wrong'}")

    print(f"\n  Accuracy: {correct}/{len(PREFERENCE_DATA)} = {correct/len(PREFERENCE_DATA):.1%}")
    print()

    print("STAGE 3: PPO Training")
    print("-" * 40)

    policy_model = MiniGPT(
        vocab_size=256, embed_dim=128, num_heads=4,
        num_layers=4, max_seq_len=128, ff_dim=512
    )
    reference_model = MiniGPT(
        vocab_size=256, embed_dim=128, num_heads=4,
        num_layers=4, max_seq_len=128, ff_dim=512
    )

    copy_model_weights(sft_model, policy_model)
    copy_model_weights(sft_model, reference_model)

    train_prompts = [pair["prompt"] for pair in PREFERENCE_DATA]

    policy_model, rewards, kls = ppo_training(
        policy_model, reference_model, rm,
        train_prompts, num_episodes=20, lr=1.5e-5, kl_coeff=0.02
    )
    print()

    print("=" * 70)
    print("COMPARISON: SFT vs RLHF")
    print("=" * 70)
    print()

    eval_prompts = [
        "What is the capital of France?",
        "Explain gravity.",
        "Name three programming languages.",
    ]

    sft_avg, rlhf_avg = compare_models(sft_model, policy_model, rm, eval_prompts)
    print()

    print("=" * 70)
    print("KL DIVERGENCE ANALYSIS")
    print("=" * 70)
    print()

    if kls:
        print(f"  Initial KL: {kls[0]:.4f}")
        print(f"  Final KL:   {kls[-1]:.4f}")
        print(f"  Max KL:     {max(kls):.4f}")
        kl_threshold = 0.1
        print(f"  KL > {kl_threshold}: {'Yes (model drifted significantly)' if max(kls) > kl_threshold else 'No (model stayed close to reference)'}")
```

## 交付 it
本课会产出 `outputs/prompt-reward-model-designer.md`، هو عرض لتصميم خطوط تدريب نموذج الجوائز.

## التدريب
1. 修改 نموذج الجائزة، باستخدام جميع الحالات الخفية المتوسط، بدلاً من استخدام الموقع الأخير فقط.

2. 实现 reward model calibration── تدريب بعد، دع جميع أزواج التفضيلات 通过 reward model,并计算:((a) متوسط مكافأة الردود المفضلة،(b) متوسط مكافأة الردود الرفضة،(ج) الهامش(المرحوب -الرفض)──校准良好的模型应该有明确的 margin──然后添加 4 个新的 زوجات التفضيلات، فحص الهامش 是否能在未见的数据上保持──

3. 模拟奖励黑客──创建一个给长响应高分的奖励模型(奖励 = len(回应) / 100)──使用这个有缺陷的奖励模型 运行PPO,观察政策模型 生成越来越长、越来越重复的输出──然后添加 0.1 KL 罚款,并显示它会防止这种退化行为──

4. 实现多 उद्देश مكافأة── تدريب نموذجين من المكافآت: واحد للاستفادة، والآخر للاختصار──将它们组合为 R = 0.7 * R_helpful + 0.3 * R_concise──展示组合目标会产生既有帮助又简洁的响应,避免单一的帮助奖励 带来的词语陷──

5. تقارن معدل KL مختلفة──分别 باستخدام beta=0.001(过低,reward hacking)、beta=0.02(标准) و beta=0.5(过高,无法学习) لتنفيذ PPO── رسم كل نوع من تعديل المكافأة 和 KL curve──beta=0.02

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| RLHF | “Training with human feedback” | Reinforcement Learning from Human Feedback：一个三阶段 pipeline（SFT、reward model、PPO），使用人类偏好信号优化 language model 输出 |
| Reward model | “A model that scores responses” | 一个带 scalar output head 的 Transformer，使用 Bradley-Terry loss 在 pairwise human preferences 上训练 |
| Bradley-Terry | “The comparison model” | 一种概率模型，其中 P(A > B) = sigmoid(score(A) - score(B))，可将 pairwise preferences 转换为一致的 scoring function |
| PPO | “The RL algorithm” | Proximal Policy Optimization：更新 policy 以最大化 reward，同时裁剪更新幅度以防止不稳定 |
| KL divergence | “How different two distributions are” | 衡量 policy model 的 Token distribution 与 reference model 之间差异的指标，用作 penalty 来防止 reward hacking |
| KL penalty | “The leash on the model” | 从 reward signal 中减去的 Beta * KL(policy \|\| reference)，防止 policy 偏离 SFT checkpoint 太远 |
| Reward hacking | “Gaming the reward” | policy 通过利用 reward model 的弱点找到退化的高 reward 输出，而不是真正改进 |
| Preference pair | “Which is better, A or B?” | 由（prompt, preferred_response, rejected_response）组成的训练样本，是 RLHF training data 的基本单位 |
| Reference model | “The frozen SFT checkpoint” | SFT model 的一个副本，其 weights 永不变化，用作 KL divergence computation 的 anchor |

## 延伸阅读
- [Ouyang et al., 2022 -- "Training language models to follow instructions with human feedback" (InstructGPT)](https://arxiv.org/abs/2203.02155)-- 让RLHF                                                                                                                                                                                                                                                            
- [Schulman et al., 2017 -- "Proximal Policy Optimization Algorithms"](https://arxiv.org/abs/1707.06347)-- ورقة OpenAI الأصلية من PPO
- [Bai et al., 2022 -- "Training a Helpful and Harmless Assistant with Reinforcement Learning from Human Feedback"](https://arxiv.org/abs/2204.05862)-- ورقة RLHF من Anthropic، تحليل مفصل على إختراق مكافأة و عقوبة KL
- [Stiennon et al., 2020 -- "Learning to summarize with human feedback"](https://arxiv.org/abs/2009.01325)-- استخدام RLHF لجمع، عرض نماذج مكافأة يمكن أن تلتقط تحديدات نوعية
- [Christiano et al., 2017 -- "Deep reinforcement learning from human preferences"](https://arxiv.org/abs/1706.03741)-- حول أساسية العمل في وظائف المكافأة للتعلم من الإنسان
