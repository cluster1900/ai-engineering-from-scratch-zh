# Tahmin edici çözme ve Eagle

> sınır LLM 生成一个代币 需要对数十亿参数进行一次完整的前进通行. Bu ileri geçişin配置远超实际需求:大多数时候,一个小得多的模型就能正确猜出接下来的3-5个代币,而大模型只需要 *verify*这个猜测.

**Type:** Build
**Languages:** Python (with numpy)
**Prerequisites:** Phase 10 Lesson 12 (Inference Optimization), Phase 10 Lesson 04 (Pre-training Mini-GPT)
**Time:** ~75 minutes

## 问题

70B sınıfı model H100'in üstündeki dekodlama throughput genellikle 40-80 token/sedir. Her token bir kez tam bir ileri geçiş gerektirir. HBM'den tüm model ağırlıklarını okur.

Autoregresif nesil doğal gibi görünüyor.`x_{t+1} = sample(p(· | x_{1:t}))`Ama burada bir şans var. Eğer ucuz bir tahminci varsa, bir sonraki 4 simgeyi kullanırsın.**大 model 的单次 forward pass**İçinde 5 pozisyon verilir, en uzun eşleşimi kabul eder.

Leviathan、Kalai、Matias(2023,Speculative Decoding ) tarafından Transformers'ten hızlı bir şekilde aktarma 規則精确实现 this point,该规则保留目标模型的样本分布──相同的输出分布,速度提升 2-4x──

## 概念

### 双 Model  ayar

- **Target model** `M_p`: tu thực sự muốn từ Trung采样的大型、缓慢、高质量模型──Kütletim:`p(x)`- Evet.
- **Draft model** `M_q`:小型、快速、質量较低的模型──Distribüsiyon:`q(x)`5-30 x.

Her adımda:

1. Önemli bir şekilde 提议 `K`个 İşaret:`x_1, x_2, ..., x_K ~ q`- Evet.
2. Hedef modeli tümüne`K+1`个位置并行运行 一次前进通票,为每提议代币 生成 `p(x_k)`- Evet.
3. 按下面修改后的拒绝-样本取法 规则从左到右 接受/reject 每个代币──接受最长匹配前──
4. Eğer herhangi bir Token reddedildiyse, değiştirilen Token'in değişimi durdurulmaz.`p(· | x_1...x_K)`Bir bonus simgesi var.

Eğer taslak hedefe tamamen uymuşsa, her hedef ilerlemişken K+1 Token alabilirsin. Eğer taslak 1 pozisyonda yanlış olursa, sadece 1 Token alabilirsin.

### 精确性规则

Tahmin edici çözme **在 distribution 上可证明等价于从 p 采样**❖ İtiraz 规则:

```
For each drafted token x_t:
    r ~ Uniform(0, 1)
    if r < p(x_t) / q(x_t):
        accept x_t
    else:
        sample replacement from residual: (p - q)+ / ||(p - q)+||_1
        stop
```

İçlerinden `(p - q)+`Gösterme: Bireyin ve hedeflerin birliği`p ≈ q`) zaman, kabul  yakın 1 ⋅ zaman, geri kalan dağılım                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               `p`- Evet.

**Greedy 情况。**Temperatür = 0 örneklemesi için sadece kontrol yapılması gerekmektedir.`argmax(p) == x_t`Eğer evet, kabul et; eğer değil, çıkar.`argmax(p)`Ve durduruldu.

### 期望 Hızlılık

Eğer proje modelinin Token 级 kabul oranı ise `α`,则每次目标前进通过 生成的期望代币 数为:

```
E[tokens] = (1 - α^{K+1}) / (1 - α)        # K = draft length, α in [0, 1]
```

- Evet .`α = 0.8, K = 4`- ...`(1 - 0.8^5)/(1 - 0.8) = 3.36`个 Token Her seferinde. 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个`cost_q * K + cost_p`(K 个 taslak adım bir kez hedef doğrulama)`cost_p >> cost_q * K`,sürüm oranı hızlandırma oranı`3.36× / 1 = 3.36×`- Evet.

Tek gerçek parametre`α`Bu tamamen proje-hedef birleştirilmesine bağlı. İyi bir taslak işte her şey.

### 訓練 Draft: Destilasyon

随机的小模型会成为非常差的草案―― standart uygulama hedef destill:

1. 选择一个小建筑(70B hedef için yaklaşık 1B,7B hedef için yaklaşık 500M)
2. Büyük çapta metin dilinin üzerinde çalıştırılan hedef model; sonraki token dağıtımlarını depolamak
3. KL farklılıklarını kullan 訓練 drafı, hedef dağıtımını yapıp yerçekim gerçeği tokenlerini yaparak değil.

Sonuç şu:`α`Kodlama sırasında genellikle 0.6-0.8 olarak, doğal dil sohbetinde 0.7-0.85 olarak üretilir.

### Eagle:Ağır Çubuğu + Özellik Tekrar Kullanımı

Li、Wei、Zhang、Zhang(2024, EAGLE: Speküel Örnekleme Yeniden Düşünme Gerektirir Özellik belirsizlik) standart speküel çözme gözlemlenir 中的两个低效点:

1. Draft   个串行步骤,每个都是全堆──但是草案可以重复最近一次验证中目标的特征 ( gizli durumlar) ),因为目标 已经计算了丰富的表示,而草案正从头重新推推它们──
2. Draft 输出一条线性链──如果草案 能输出一个候选人 *tree*(每个节点有多个猜测),target's single-forward pass 就可以通过树注意面具并行验证多条候选人路径,并选择最长接受分支──

Eagle-1'in değişimi:
- Tasarım giriş = hedef, çiğ jetonlar yerine, konum t'in nihai gizli durumunda bulunur.
- Tasarım mimarisi = 1 个变压器解码器层(不是独立的小模型)
- Çıktı = Her derinlik, K = 4-8 aday, derinlik = 4-6 ağaç.

EAGLE-2(2024) 加入动态树拓科:在草案不确定位置,树变宽;在草案自信的位置,树保持较窄──在不增加验证成本的情况下提高`α_effective`- Evet.

EAGLE-3(Li et al. 2025,EAGLE-3: Training-Time Test yoluyla Büyük Dil Modellerinin İferensi Hızlanmasını Ölçütleme) sabit üst katman özellik bağımlılığını kaldırdı, yeni test-time simülasyon kaybı тренинг taslağı, yani hedef taslağı test-time dağıtımının çıkışına göre hazırlanmasını sağlamak, öğretmen zorlayıcı eğitim dağıtımında değil, EAGLE-2-den 0.75'e yükseltmekle birlikte, ortalama token/verifi 3.0'dan 4.5'e yükseltmekle birlikte.

### Ağaç Dikkatini Kontrol Et

Çekim ağacı, hedef modeli kullanın**tree attention mask**Bu, sadece ağaç içindeki atalarına ulaşmak için geçerli olan tek bir token değildir. Verify Pass  hala bir kez ileri, bir kez matmul; topolojik maskedir.

```
        root
       /    \
      a      b
     / \    / \
    c  d   e   f
```

Eğer `a, b`- İlk adaylar.`c, d, e, f`İkinci belirti adayları ise, tüm altı konum da bir kez ileri geçiş sırasında doğrulanır.

### Ne zaman işe yarıyor, ne zaman işe yaramaz?

**有效：**
- Çat / tamamlama, ve文本可预测(kod、常见 İngilizce、 yapılandırılmış çıkış)`α`- Evet.
- Dekode 阶段有未使用GPU hesaplama 设置(memory bound phase) ――Ağaç tasarımı 使用可用FLOPs──

**无效 / 没有收益：**
- Yüksek sıcaklıklı yaratıcı yazı)`α`Görüşmek`1/|vocab|`Aşağıya düştü.
- Çok yüksek eşzamanlılık, parti servis, parti doldurma, ağaç doğrulama alanı çok küçük.
- Çok küçük hedef modeller, bu arada küçük bir proje yok.

Üretim ekibi genellikle sohbet raporları yapar. 2-3 kat duvar saati hızlandırması, kod üretimi, 3-5 kat, yaratıcı yazma ise sıfırdan yakın.


```figure
speculative-decoding
```

## Yapın onu.

`code/main.py`- ...

- Bir referans gerçekleştirmek için.`speculative_decode(target, draft, prompt, K, temperature)`, it realize precise rejection 规则,并验证 it retains target distribution (empirikal KL < 0.01 vs. basit hedef örnekleme) ⋅
- Bir ağaç tasarıcısı, yukarıdaki p dallarını kullanarak derinlik K ağacını inşa eder.
- Bir ağaç dikkat maskası yapımcısı, doğru nedensel bir patern oluşturmak için bir verifier oluşturur.
- Bir kabul oranı harnes, küçük LM 上运行两者 (GPT-2- orta hedefden küçük bir GPT-2- küçük bir distill)

```python
def speculative_step(p_target, q_draft, K, temperature=1.0):
    """One round of speculative decoding. Returns list of accepted tokens."""
    # 1. Draft K tokens
    draft_tokens = []
    q_probs = []
    state = draft_state_init()
    for _ in range(K):
        probs = softmax(q_draft(state) / temperature)
        t = np.random.choice(len(probs), p=probs)
        draft_tokens.append(t)
        q_probs.append(probs[t])
        state = draft_step(state, t)

    # 2. Target computes p at every drafted position + 1 extra
    p_probs_all = target_forward_batched(p_target, draft_tokens, temperature)

    # 3. Accept/reject left-to-right
    accepted = []
    for k, tok in enumerate(draft_tokens):
        r = np.random.uniform()
        if r < p_probs_all[k][tok] / q_probs[k]:
            accepted.append(tok)
        else:
            residual = np.maximum(p_probs_all[k] - q_probs[k], 0)
            residual /= residual.sum()
            accepted.append(np.random.choice(len(residual), p=residual))
            return accepted
    # 4. All K accepted → sample bonus token from target
    accepted.append(np.random.choice(len(p_probs_all[-1]), p=p_probs_all[-1]))
    return accepted
```

## Kullan

- **vLLM**和 **SGLang**提供一等 spekülatör çözme 支持── Bayraklar:`--speculative_model`- Evet.`--num_speculative_tokens`◊Eagle-2/3 通过 `--spec_decoding_algorithm eagle`bayrak 支持。
- **NVIDIA TensorRT-LLM**Medusa ve Eagle ağaçları.
- **Reference draft models**- ...`Qwen/Qwen3-0.6B-spec`(Qwen3-32B'nin taslakları için kullanılır)`meta-llama/Llama-3.2-1B-Instruct-spec`(70B'nin taslakları için kullanılır)
- **Medusa heads**(Cai et al. 2024,Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads): Draft model kullanmak yerine hedef 自身上添加 K 个并行预测头──部署更简单,接受略低于EAGLE──

## - Söyle.

本课会产 出 `outputs/skill-speculative-tuning.md`, bu bir beceri, hedef modelinin iş yükünü analiz etmek için,并选择:草案模型、K(草案 uzunluğu)、 ağacın genişliği、温度,以及何時落back to plain decode──

## 练习

1. 实现精确拒绝 规则并进行实证验证──通过 `speculative_decode`和 basit hedef örnekleme 分別运行 10K örnekler; hesaplamak iki çıkış dağıtımları  arasındaki TV mesafe──应小于0.01──

2. 計算 公式──给定固定 `α`和 `K`, çizmek için her hedef-geri 期望 Token 数── bulmak ∈ {0.5, 0.7, 0.9} 时的最优 K──

3. 訓練一小草稿──取一小 124M GPT-2 hedefi, ve 100M tokens 上用 KL loss destill 一小 30M GPT-2草稿──测量 held-out text 上的 `α`❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖

4. 实现 EAGLE tarzı ağaç taslakı──不要使用链,而是让草稿 在每个深度 输出 top-3 dalları──构建树注意面具──验证目标──接受最长正确分支──

5. 测量 failure modes──在 temperature=1.5(高随机性) 下运行 猜测式解码──展示 α 崩塌,并且由于草案上海费,该算法比平面解码更慢──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|-----------------|------------------------|
| Target model | “大 model” | 你想从中采样的缓慢、高质量 model（p distribution） |
| Draft model | “speculator” | 小型、快速 predictor（q distribution）；小 5-30x |
| K / draft length | “Look-ahead” | 每次 verify pass 推测的 Token 数 |
| α / acceptance rate | “Hit rate” | draft 提议被接受的每 Token 概率 |
| Exact rejection rule | “accept test” | 保留 target distribution 的 r < p/q 比较 |
| Residual distribution | “修正后的 p-q” | (p - q)+ / ||(p - q)+||_1，rejection 时要从中采样的 distribution |
| Tree drafting | “Branching speculation” | Draft 输出候选 tree，并用 tree-structured attention mask 在一次 pass 中 verify |
| Tree attention mask | “Topological mask” | 编码 tree topology 的 causal mask，使每个 node 只 attend 到它的 ancestors |
| Medusa heads | “Parallel heads” | target 自身上的 K 个额外 prediction heads；没有独立 draft model |
| EAGLE feature reuse | “Hidden-state draft” | Draft input 是 target 的最后 hidden state，而不是 raw tokens，从而缩小 draft |
| Test-time simulation loss | “EAGLE-3 training” | 在匹配 target test-time distribution 的输出上训练 draft，而不是 teacher forcing |

## 延伸阅读

- [Leviathan, Kalai, Matias, 2023 — "Fast Inference from Transformers via Speculative Decoding"](https://arxiv.org/abs/2211.17192) 精确拒绝 规则和理论 分析   速度化
- [Chen, Borgeaud, Irving et al., 2023 — "Accelerating Large Language Model Decoding with Speculative Sampling"](https://arxiv.org/abs/2302.01318)DeepMind'in eşzamanlı spekülatör örneği
- [Cai, Li, Geng, Wang, Wang, Zhu, Dao, 2024 — "Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads"](https://arxiv.org/abs/2401.10774) model taslağı 替代方案
- [Li, Wei, Zhang, Zhang, 2024 — "EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty"](https://arxiv.org/abs/2401.15077) özellik yeniden kullanımı 和 ağaç çizimi
- [Li et al., 2024 — "EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees"](https://arxiv.org/abs/2406.16858) 动态 Ağaç topolojisi
- [Li et al., 2025 — "EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test"](https://arxiv.org/abs/2503.01840) Tren-saati test-saati eşleşimi
- [Fu, Haotian, Peng et al., 2024 — "Break the Sequential Dependency of LLM Inference Using Lookahead Decoding"](https://arxiv.org/abs/2402.02057) Jacobi/lookahead dekodlama, bir tür spekülatörün ihtiyacı yok
