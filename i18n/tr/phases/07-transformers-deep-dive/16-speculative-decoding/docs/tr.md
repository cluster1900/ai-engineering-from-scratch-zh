# Tahmin edici Çözümleme  Özetleme  Doğrulama  Tekrarlama

> Autoregressive decoding is a series of lines── her token has to wait for a previous Token── Speküel decoding  break this chain: a cheap model first draft N 个 Token, expensive model in a single forward pass in verify 全部 N 个 Token── taslakta doğru olduğunda, bir büyük bir şekilde ileride N 次生成 tamamlanır.

**Type:** Build
**Languages:** Python
**先修要求:**7 · 07 aşaması (GPT Sebep LM), 7 · 12 aşaması (KV Kaş ve Akşam Dikkat)
**Time:** ~60 minutes

## 问题

Bir 70B LLM H100 üzerinde bir token örneği 30 ms civarında. Bir 3B taslak modeli 3 ms civarında. Eğer 3B taslakı 5 token üretirse, 70B'nin sadece bir kez çalışmasına izin versin.`5×3 + 30 = 45 ms`, en fazla kabul edilebilir 5 Token; ve doğrudan üretimi gerekir `5×30 = 150 ms`︎ İşte Speküel Dekodlama'nın tam satış noktası: az miktarda ekstra GPU belleği ile değiştirmek için 24× daha düşük dekodlama gecikmesi︎

关键在必须保留分布──Leviathan et al. (2023) 以及 Chen et al. 同期提出的投机性样本化保证输出序列与大模型单独生成时的分布**完全相同**                                                                                                                                                                                                                                                              

2026 yılına kadar, dört sınıf taslak-verifier 组合主导推断:

1. **Vanilla speculative (Leviathan 2023)。**独立草案模型 (e.g. Llama 3 1B) + doğrulayıcı (e.g. Llama 3 70B) ⋅
2. **Medusa (Cai 2024)。**Verifier'a bir sürü kodlama başlığı ekle,`t+1..t+k`❖ bağımsız bir taslak modeli gerekmiyor.
3. **EAGLE family (Li 2024, 2025)。**复用验证器 hidden states 的轻量草案;vanilla 比接受率 更接近;典型为34×。
4. **Lookahead decoding (Fu 2024)。**Jacobi İterasyonu; tamamen gerek yok taslak modeli。Öz spekülasyon。小众但没有依赖。

2026 yılında her üretim aşamasında sonucu aşamaları varsayımlı dekodlama sağlamak üzere kullanılır.

## 核心概念

### 核心算法

给定一个验证器 `M_q`Ve daha ucuz bir taslak.`M_p`- ...

1. Yapmak`x_1..x_k`Çıktırılmış prefiks
2. **Draft**: kullan `M_p`autoregressiv 提议 `d_{k+1}, d_{k+2}, ..., d_{k+N}`,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `p_1..p_N`- Evet.
3. **并行 verify**: `x_1..x_k, d_{k+1}, ..., d_{k+N}`Bir kere çalışıyorum.`M_q`, konumunuzu bul .`k+1..k+N+1`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `q_1..q_{N+1}`- Evet.
4. **从左到右 accept/reject 每个 draft token**Herkese:`i`,                `min(1, q_i(d_i) / p_i(d_i))`Kabul ediyorum.
5. Yerinde`j`İlk reddedilme: Geri kalan dağılım.`(q_j - p_j)_+`Çeviri`t_j`- Evet.`j`Sonrasında tüm taslaklar atıldı.
6. Eğer hepsi `N`个都被接受: 个`q_{N+1}`采样一个额外Token `t_{N+1}`(gratis bonus simgesi)

Geri kalan dağılım bu teknik , çıkış dağılımını ve `M_q`Bu, tamamen uyumlu bir matematik anlayışıdır.

### Ne karar verir hızlandırmak

Yapmak`α`= Her bir taslak token'un kabul oranı `c`= taslak ve denetleyiciler arasındaki maliyet oranı──

- Saçma nesil her bir token 1 büyük model çağrısı gerektirir.
- - Evet .`α`Çok yüksek zaman, Tahminler her gün.`(1 - α^{N+1}) / (1 - α) ≈ 1/(1-α)`Bir tane büyük model çağrısı gerekiyor.

- Evet .`α = 0.75`Ve`N = 5`时,典型体验法则是:大型调用 减少 3×──草案成本是5×便宜──总体壁表 约下降2.5×──

**α 取决于：**

- Verifiyeci'nin yaklaşım derecesi, aile/öğrenim verileri ile birlikte önemli ölçüde artar.
- Dekodlama stratejisi。Kırgın taslakçısı:α 高。Hava örneklemesi:更难匹配; kabul 下降。
- Görev tipi──Kod ve yapılandırılmış çıktı 接受更多(更可预测);自由形式创意写作接受更少──

### Medusa  没有草案模型 的草案

Medusa Uzd verifier                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `t`- ...

```
shared trunk → hidden h_t
    ├── head_0: predict token at t+1  (standard LM head)
    ├── head_1: predict token at t+2
    ├── head_2: predict token at t+3
    ├── head_3: predict token at t+4
```

Her baş 输出自己的logits──Inference 时,你从每头 样品得到候选序列,然后使用一次前进通过 和树注意方案 同时考虑所有候选继续来验证──

优点:没有第二个模型──缺点: eğitimli parametreleri artırmak; denetim altında ince ayarlama 阶段(約 1B Token); kabul oranı 比使用优秀草案的 vanila spekülatörü 略低──

### KİÇİN  Çok gizli durumlarla  Daha iyi bir taslak elde etmek

EAGLE-1/2/3 (Li et al., 20242025) tasarlanmış bir taslak modeli çok küçük bir transformatör için tasarlanmıştır, genellikle 1 kat), verifikatörün giriş son katman gizli durumları vardır.

EAGLE-3 (2025)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

### KV önbelleği dansı

Verifikasyon İzleyici`N`个草案代码在一次前进通中给验证器──这将把验证器的KV缓存扩展`N`项── Eğer bazı taslaklar reddedildiyse, öntanımlı öntanımların uzunluğuna geri dönmelisiniz.

生产实现(vLLM 的 `--speculative-model`、TensorRT-LLM'in LookaheadDecoder) tarafından çizim KV tamponları 处理 this thing──先写入,接受时再 commit──概念上不难,但细节很繁──


```figure
draft-verify-tokens
```

## Yapın onu.

Görüyorum .`code/main.py`◊Biz aşağıdaki bileşenlerle çekirdek spekülatif örnekleme algoritmasını gerçekleştiririz:

- Bir "büyük model", el yazısı dağılımında belirleyici-sımsıkı maksimum olarak kullanılır.
- Bir "tasla modeli", büyük modelin rahatsız edici versiyonu.
- Bir kabul / reddetme döngüsü, doğrudan örnekleme ile benzer bir kenar dağılım oluşturur.

### 步骤 1: reddetme adım

```python
def accept_or_reject(q_prob, p_prob, draft_token, u):
    ratio = q_prob / p_prob if p_prob > 0 else float("inf")
    return u < min(1.0, ratio)
```

`u`Bu bir eşsiz rastgele sayı.`q_prob`Bu, bir verifiyeci olarak tasarlanmış bir token olasılığını gösterir.`p_prob`Bu, Bernoulli kararının yanı sıra geri alınan ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰stikleri ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s ‰s       ‰s ‰s  ‰s ‰s ‰

### 步骤 2: Geri kalan dağıtım

```python
def residual_dist(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    return [r / s for r in raw]
```

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `q`İçinden düşe`p`, negatif değerleri sıfıra kadar sıkıştırır, sonra yeniden yeniden birleştirir.

### 3 adım: Bir spekülatif adım

```python
def spec_step(prefix, q_model, p_model, N, rng):
    drafts = []
    p_probs = []
    ctx = list(prefix)
    for _ in range(N):
        p_dist = p_model(ctx)
        d = sample(p_dist, rng)
        drafts.append(d)
        p_probs.append(p_dist[d])
        ctx.append(d)

    q_dists = [q_model(prefix + drafts[:i]) for i in range(N + 1)]

    for i, d in enumerate(drafts):
        u = rng.random()
        q_prob = q_dists[i][d]
        p_prob = p_probs[i]
        if u < min(1.0, q_prob / p_prob if p_prob > 0 else float("inf")):
            prefix = prefix + [d]
        else:
            res = residual_dist(q_dists[i], p_model(prefix))
            prefix = prefix + [sample(res, rng)]
            return prefix
    prefix = prefix + [sample(q_dists[N], rng)]
    return prefix
```

接受五个 → 一个奖金 → 一次验证通过 生成六个代币。

### 步骤 4: Ölçüm kabul oranı

Çeşitli taslak kalitesi içinde 水平下运行 10,000 个投机步骤―― çizim kabul oranı ile taslak 和 doğrulayıcı arasında KL farklılıklarındaki ilişkiyi yaymak― açık bir tek düzenli ilişkiyi görmelisiniz―

### Adım 5: Testing Distribution Equivalence

 تجرب验证:speculative loop 生成的Token 直方图应匹配直接从验证器 采样得到的直方图――这是实践中的利维亚坦定理――Chi-square test 会确认差异在样本错误范围内――

## Kullan

Üretim:

```bash
# vLLM with EAGLE
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-model /models/llama-3.1-eagle-70b \
    --speculative-draft-tensor-parallel-size 1 \
    --num-speculative-tokens 5

# vLLM with vanilla draft model
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-model meta-llama/Llama-3.2-1B-Instruct \
    --num-speculative-tokens 5
```

2026 yılına kadar, TensorRT-LLM en hızlı Medusa yoluna sahiptir.`faster-whisper`Şapşır-büyük bir paketle küçük bir taslakla spekülasyonu çözmeye başladım.

**选择 draft：**

| Strategy | 何时选择 | Speedup |
|----------|--------------|---------|
| Vanilla draft (1B/3B Llama family) | 快速 prototype，无需 training | 1.8–2.3× |
| Medusa heads | 你可以 fine-tune verifier | 2–3× |
| EAGLE-2 / 3 | Production，最高速度 | 3–4× |
| Lookahead | 无 draft、无 training、无额外 params | 1.3–1.6× |

**什么时候不要 spec-decode：**

- Sadece 15 个 Token'in tek sıralı nesil üretmek.
- 极具创意 / Yüksek sıcaklık örneklemesi ((α 会下降)
- Hatıra kısıtlı uygulamalar (Draft Model 会增加 VRAM)

## - Söyle.

Görüyorum .`outputs/skill-spec-decode-picker.md`◊ bu beceri 会为新推断工作负荷 选择一种投机式解码策略 (vanilla / Medusa / EAGLE / lookahead) 以及调调参数 (N、草案温度) ◊

## 练习

1. **Easy。**运行  İşlem`code/main.py`❖ Haklılık ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖  ❖
2. **Medium。**- Evet .`α = 0.5, 0.7, 0.85`, çizim hızlandırması( her büyük model ileriye doğru`N`                                                                                                                                                                                                                                                              `N`▽(Tip: ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽`(1 - α^{N+1}) / (1 - α)`◊)
3. **Hard。**实现一个小的梅杜萨:取课14的结石GPT,添加3个额外的LM头,分别预测位置 t+2、t+3、t+4──在小摇钱树上用联合多头损失训练──与通过截断同一个模型得到的香草草草案比较接受率──
4. **Hard。**实现 rollback: from a 10-token prefix KV cache 开始,入 5 草案代币,模拟在位置 3 প্রত্যাখ্যান──验证下一轮代时你的缓存 读取结果正确匹配 "prefix + ilk 2 kabul edilen taslak"──

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| Draft model | “便宜的那个” | 一个更小的模型，用于提出候选 Token；通常比 verifier 便宜 10–50×。 |
| Verifier | “大的那个” | 我们要保留其分布的目标模型；每个 speculative step 运行一次。 |
| Acceptance rate (α) | “draft 有多常对” | verifier 接受 draft 的 per-token probability。典型为 0.7–0.9。 |
| Residual distribution | “rejection fallback” | 归一化后的 `(q - p)_+`；rejection 时从这里采样可保留 verifier 的分布。 |
| Bonus token | “免费的那个” | 当全部 N 个 draft 被接受时，从 verifier 的 next-step distribution 再采样一个。 |
| Medusa | “Draft-less speculative” | verifier 上的多个 LM heads 并行预测位置 t+1..t+k。 |
| EAGLE | “Hidden-state draft” | 以 verifier last-layer hidden states 为条件的 tiny transformer draft。 |
| Lookahead decoding | “Jacobi iteration” | 使用 fixed-point iteration 的 self-speculation；没有 draft model。 |
| Tree attention | “一次 verify 多个候选” | 同时考虑多个 draft continuations 的 branching verification。 |
| KV rollback | “撤销 rejected drafts” | Scratch KV buffer；接受时 commit，reject 时 discard。 |

## 延伸阅读

- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) 核心算法与等式定理──
- [Chen et al. (2023). Accelerating Large Language Model Decoding with Speculative Sampling](https://arxiv.org/abs/2302.01318) 同期提出; klar klar klar of Bernoulli-i reddetme 証明。
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774)Medusa 论文; ağaç dikkat 验证。
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) EAGLE-1; gizli durum şartlarına dayalı 
- [Li et al. (2024). EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees](https://arxiv.org/abs/2406.16858) Eagle-2; dinamik ağaç derinliği
- [Li et al. (2025). EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test](https://arxiv.org/abs/2503.01840) Eagle-3。
- [Fu et al. (2024). Break the Sequential Dependency of LLM Inference Using Lookahead Decoding](https://arxiv.org/abs/2402.02057)Bakın, bir taslak yok.
- [vLLM docs — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode.html)                                                                                                                                                                                                                                                              
- [SafeAILab / EAGLE reference implementation](https://github.com/SafeAILab/EAGLE) EAGLE-1/2/3'ün referans kodları
