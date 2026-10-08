# Derin Q-Ağlar (DQN)

> 2013: Mnih, ilk pixellerde bir Q-öğrenme ağı geliştirdi, yedi Atari oyununda tüm klasik RL ajanını yendi. 2015: 49 oyuna yayımlandı, Nature'da yayınlandı, derin-RL çağını başlattı.

**类型：**Yapım
**语言：**Python
**前置要求：**3 · 03 aşaması (Dönüştürme), 9 · 04 aşaması (Q-öğrenme, SARSA)
**时间：**~ 75 dakika

## 问题

Tablolar Q-öğrenme                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

Son görünüşte, düzeltme yöntemleri çok açık:`Q(s, a; θ)`deadly triad 下发散:function approximation + bootstrapping + policy learning。Mnih et al. (2013, 2015) deadline learning processin üç teknikini buldu:

1. **Experience replay**让过渡 去相关──
2. **Target network**结 bootstrap hedefi。
3. **Reward clipping**归一化 Gradient 幅度。

Atari'nin DQN'i ilk kez tek bir yapı ve tek bir hiperparametrle oluşturulmuştur. İlk önce orijinal piksellerden birkaç kontrol sorunu çözüldü.

## 概念

![DQN training loop: env, replay buffer, online net, target net, Bellman TD loss](../assets/dqn.svg)

**目标。**DQN Nöral Q fonksiyonda bir adımlı TD kaybını en aza indirmek:

`L(θ) = E_{(s,a,r,s')~D} [ (r + γ max_{a'} Q(s', a'; θ^-) - Q(s, a; θ))² ]`

`θ`= çevrimiçi ağ, her adım Gradient Descent 更新──`θ^-`= hedef ağ, döngüsel olarak `θ`复制(約每 10,000 步一次)`D`= geçmiş geçişlerin tekrarlama tamponu

**三个技巧，按重要性排序：**

**Experience replay。**Bir içerik`~10⁶`Bu, zaman ilişkileriyi kırır, ağın nadir ödüllendirici geçişlerden yararlanmasına izin verir.

**Target network。**Bellman'ın yolunun her iki tarafı aynı ağı kullanıyor.`Q(·; θ)`, hedef her güncelleme sırasında hareket eder, yani  kendi尾巴 koşusunu takip ──`Q(·; θ^-)`, onun ağırlıkları 结──每隔 `C`步,复制 `θ → θ^-`Bu, binlerce adımdan sonra gerileme hedefini sabit tutmaya yardımcı olur.`θ^- ← τ θ + (1-τ) θ^-`(DDPG, SAC için kullanılır) daha düz bir değişim.

**Reward clipping。**Atari'nin ödül oranı 1 ila 1000+ arasında değişir.`{-1, 0, +1}`Bir tek oyunun yönetimini engelleyebilirsiniz. Ödül büyüklüğü önemli olduğunda bu yanlış olur.

**Double DQN。**Hasselt (2016) 修复了最大化偏见:使用网 来*选择*行动,使用目标网 来*评估*它──

`target = r + γ Q(s', argmax_{a'} Q(s', a'; θ); θ^-)`

Bu bir alternatif, daha iyi bir etki.

**其他改进（Rainbow, 2017）：**öncelikli tekrarlama(更多采样 yüksek TD hata geçişleri)  duelleme mimarisi(分离 `V(s)`Ve avantajlı başlar) ̳Gürültülü ağlar(bilimli keşif) ̳N-adım geri dönüşü ̳Kütleyici Q (C51/QR-DQN) ̳Kulti-adımlı başlatma ̳


```figure
f3-dqn-stability
```

## Yapın onu.

Burada kod sadece stdlib ve numpy-free: biz çok küçük bir sürekli GridWorld'de, el yazılı tek gizli katman MLP kullanıyoruz, bu yüzden her antrenman adımları mikrosekundada içe aktarılabilir.

### 步骤 1: yeniden oynatma tamponu

```python
class ReplayBuffer:
    def __init__(self, capacity):
        self.buf = []
        self.capacity = capacity
    def push(self, s, a, r, s_next, done):
        if len(self.buf) == self.capacity:
            self.buf.pop(0)
        self.buf.append((s, a, r, s_next, done))
    def sample(self, batch, rng):
        return rng.sample(self.buf, batch)
```

Atari yaklaşık 50.000'in kapasiteyi kullanıyor. Oyuncaklarımız ise 5.000'e yeter.

### 步骤 2: çok küçük bir Q-ağı(手写 MLP)

```python
class QNet:
    def __init__(self, n_in, n_hidden, n_actions, rng):
        self.W1 = [[rng.gauss(0, 0.3) for _ in range(n_in)] for _ in range(n_hidden)]
        self.b1 = [0.0] * n_hidden
        self.W2 = [[rng.gauss(0, 0.3) for _ in range(n_hidden)] for _ in range(n_actions)]
        self.b2 = [0.0] * n_actions
    def forward(self, x):
        h = [max(0.0, sum(w * xi for w, xi in zip(row, x)) + b) for row, b in zip(self.W1, self.b1)]
        q = [sum(w * hi for w, hi in zip(row, h)) + b for row, b in zip(self.W2, self.b2)]
        return q, h
```

Önceki geçiş: doğrusal → ReLU → doğrusal──

### 步骤 3: DQN güncelleme

```python
def train_step(online, target, batch, gamma, lr):
    grads = zeros_like(online)
    for s, a, r, s_next, done in batch:
        q, h = online.forward(s)
        if done:
            y = r
        else:
            q_next, _ = target.forward(s_next)
            y = r + gamma * max(q_next)
        td_error = q[a] - y
        accumulate_grads(grads, online, s, h, a, td_error)
    apply_sgd(online, grads, lr / len(batch))
```

Bu, 04 dersi içindeki Q öğrenme şeklidir. Sadece iki farklılık var:`Q(·; θ)`İndirim tablosu değil, geri yayım yapın.`Q(·; θ^-)`- Evet.

### 步骤 4: dış katlı döngü

Her bölümde,`Q(·; θ)`执行 ε-greedy,把 transitions 放入缓冲,采样minibatch,执行一次 Gradient step,并周期性同步 `θ^- ← θ`❖ Şekil:

```python
for episode in range(N):
    s = env.reset()
    while not done:
        a = epsilon_greedy(online, s, epsilon)
        s_next, r, done = env.step(s, a)
        buffer.push(s, a, r, s_next, done)
        if len(buffer) >= batch:
            train_step(online, target, buffer.sample(batch), gamma, lr)
        if steps % sync_every == 0:
            target = copy(online)
        s = s_next
```

Bu 16 boyutlu bir sıcak devlet kullanırken, Agent 会在约500 bölümlerde内学到接近最佳政策── Atari'de, 200M çerçeveye kadar genişletmek, CNN özellikleri eklemek──

## 常见陷

- **Deadly triad。**İşlev yaklaşımı + politika dışı + başlangıç yolu 可能发散──DQN Kullanın hedef ağ + tekrarlama 缓解这个问题;不要移除任何一个──
- **Exploration。**ε                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- **Overestimation。**Gürültülü bir sesle .`max`Üretim sırasında ikili DQN kullanımı hep geçerlidir.
- **Reward scale。**剪或归归化奖励; Gradient 幅度与奖励大小 成正比──
- **Replay buffer coldstart。**Buffer'de birkaç bin geçiş yapın. Daha önce eğitim yapmayın. 20 tane örnek üzerine kurulmuş erken derecelerin bir araya gelmesi gerekiyor.
- **Target sync frequency。**太频繁 ≈ 没有目标网;太不频繁 ≈目标 过时――Atari DQN 使用 10,000 个 env adımları──体验规则:每约1/100 个训练视野 同步一次──
- **Observation preprocessing。**Atari DQN 堆叠 4 ,使状态 满足 Markov──任何包含速度信息的环境都需要框架-stacking 或复发状态──

## Kullan

2026 yılına kadar, DQN çok az teknolojiye sahip, ama hala referans dışı algoritma:

| Task | 首选 Method | 为什么不是 DQN？ |
|------|-------------|------------------|
| Discrete-action Atari-like | Rainbow DQN or Muesli | 同一框架，更多技巧。 |
| Continuous control | SAC / TD3 (Phase 9 · 07) | DQN 没有 policy network。 |
| On-policy / high-throughput | PPO (Phase 9 · 08) | 没有 replay buffer；更容易扩展。 |
| Offline RL | CQL / IQL / Decision Transformer | Conservative Q targets，没有 bootstrapping blowups。 |
| Large discrete action spaces (recommender) | DQN with action embedding, or IMPALA | 可以；细节装饰很重要。 |
| LLM RL | PPO / GRPO | Sequence-level，而不是 step-level；Loss 不同。 |

Bu deneyimler hala genel olarak kullanılmaktadır. SAC, TD3, DDPG, SAC-X, AlphaZero'nun kendi kendine oynama tamponu ve her türlü çevrimdışı RL yönteminde bulunmaktadır.

## - Söyle.

保存为 `outputs/skill-dqn-trainer.md`- ...

```markdown
---
name: dqn-trainer
description: 为 discrete-action RL task 生成 DQN training config（buffer、target sync、ε schedule、reward clipping）。
version: 1.0.0
phase: 9
lesson: 5
tags: [rl, dqn, deep-rl]
---

给定一个 discrete-action environment（observation shape、action count、horizon、reward scale），输出：

1. Network。Architecture（MLP / CNN / Transformer）、feature dim、depth。
2. Replay buffer。Capacity、minibatch size、warmup size。
3. Target network。Sync strategy（hard every C steps 或 soft τ）。
4. Exploration。ε start / end / schedule length。
5. Loss。Huber vs MSE、gradient clip value、reward clipping rule。
6. Double DQN。默认启用，除非有明确理由禁用。

拒绝交付没有 target network、没有 replay buffer，或 ε 固定为 1 的 DQN。拒绝 continuous-action tasks（路由到 SAC / TD3）。标记任何 reward range > 10× per-step mean 的情况，说明需要 clipping 或 scale normalization。
```

## 练习

1. **Easy。**运行  İşlem`code/main.py`◊ bölüm başına geri dönüş eğri çizmek― devam ortalaması ∼10  kaç bölüm gerekecek?
2. **Medium。**禁用目标网络 (Bellman hedefi) 两侧都使用网) 测量训练不稳定性:回归 会震荡还是发散?
3. **Hard。**添加 Çift DQN: kullanın online net 选择 `argmax a'`, target net kullan 评估。Comparer noisy-reward GridWorld 上 тренинг 1,000 个集 后,使用与不使用双DQN 时`Q(s_0, best_a)`Gerçekle karşılaştırıldığında`V*(s_0)`Önyargılılık.

## 关键术语
| Term | 人们怎么说 | 它实际是什么意思 |
|------|------------|------------------|
| DQN | “Deep Q-learning” | 带有 Neural Q-function、replay buffer 和 target network 的 Q-learning。 |
| Experience replay | “Shuffled transitions” | 每个 Gradient step 都均匀采样的 ring buffer；让数据去相关。 |
| Target network | “Frozen bootstrap” | 用于 Bellman target 的 Q 的周期性副本；稳定训练。 |
| Deadly triad | “为什么 RL 会发散” | Function approximation + bootstrapping + off-policy = 没有收敛保证。 |
| Double DQN | “修复 maximization bias” | Online net 选择 action，target net 评估它。 |
| Dueling DQN | “V and A heads” | 分解 Q = V + A - mean(A)；输出相同，Gradient flow 更好。 |
| Rainbow | “所有技巧” | DDQN + PER + dueling + n-step + noisy + distributional 合在一起。 |
| PER | “Prioritized Replay” | 按 TD-error magnitude 成比例采样 transitions。 |

## 延伸阅读

- [Mnih et al. (2013). Playing Atari with Deep Reinforcement Learning](https://arxiv.org/abs/1312.5602) Open Deep RL'nin 2013 yılının NeurIPS atölyesi makalesi
- [Mnih et al. (2015). Human-level control through deep reinforcement learning](https://www.nature.com/articles/nature14236) Nature 论文,49 oyun DQN。
- [Hasselt, Guez, Silver (2016). Deep Reinforcement Learning with Double Q-learning](https://arxiv.org/abs/1509.06461) DDQN。
- [Wang et al. (2016). Dueling Network Architectures](https://arxiv.org/abs/1511.06581)DQN düelloları
- [Hessel et al. (2018). Rainbow: Combining Improvements in Deep RL](https://arxiv.org/abs/1710.02298) 叠加技巧的论文──
- [OpenAI Spinning Up — DQN](https://spinningup.openai.com/en/latest/algorithms/dqn.html) 清晰的现代讲解──
- [Sutton & Barto (2018). Ch. 9 — On-policy Prediction with Approximation](http://incompleteideas.net/book/RLbook2020.pdf) 教科書中对 致命三三(Fonksiyon yaklaşımı + bootstrapping + off-policy) 处理;DQN'in hedef ağı 和重播缓冲 正是为服服它而设计的──
- [CleanRL DQN implementation](https://docs.cleanrl.dev/rl-algorithms/dqn/) Ablation çalışmalarına yönelik referans tek dosya DQN; bu dersin sıfırdan basılmış versiyonuna uygun olarak birlikte okuyun:
