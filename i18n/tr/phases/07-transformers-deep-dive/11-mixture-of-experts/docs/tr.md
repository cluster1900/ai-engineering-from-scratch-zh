# Uzmanların Karışığı (MoE)

> Bir yoğun 70B Transformer her bir token için olacak  tüm parametreleri aktive edecektir― bir 671B MoE Her bir token sadece 37B  parametrelerini aktive edecektir, ama tüm referans marketi üzerinde onu üstesinden gelecektir― bu on yılın en önemli ölçekleme 思想──

**Type:** Build
**Languages:** Python
**先修要求:**7. faz · 05 (Tüm Transformer), 7. faz · 07 (GPT)
**Time:** ~45 minutes

## 问题

Dense Transformer flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow flow 

Uzmanların karışımı bu bağlantıyı kopardı.`E`个独立专家 + 一个为每个代币 选择 `k`个专家的路由器──总参数 = `E × FFN_size`△ Her Token'in aktif参数 sayısı = `k × FFN_size`❖2026'da tipik bir konut:`E=256`- Evet .`k=8`❖ Depolama`E`扩展,计算随 `k`扩展──

2026 yılının sınırı  neredeyse tamamı MoE:DeepSeek-V3(671B toplam / 37B aktif) 、Mixtral 8×22B、Qwen2.5-MoE、Llama 4、Kimi K2、gpt-oss──

## 概念

![MoE layer: router selects k of E experts per token](../assets/moe.svg)

### FFN 替换

yoğun Transformer blokları:

```
h = x + attn(norm(x))
h = h + FFN(norm(h))
```

MoE blok:

```
h = x + attn(norm(x))
scores = router(norm(h))              # (N_tokens, E)
top_k = argmax_k(scores)              # pick k of E per token
h = h + sum_{e in top_k}(
        gate(scores[e]) * Expert_e(norm(h))
    )
```

Her uzman bağımsız bir FFN (genellikle SwiGLU) ⋅ yönlendiricisi tek bir hattalık katman ⋅ her token  kendi seçeneğini ⋅`k`个专家,并获得它们输出门混合──

### yük dengeleme 问题

Eğer yönlendiricinin %90'ı bir uzmanı 3'e geçse diğer uzmanlar açlıktan ölecek.

1. **Auxiliary load-balancing loss**(Switch Transformer、Mixtral) ―― Bir uzmanı ile birleştirir.
2. **Expert capacity + token dropping**(Önce Değiş)  Her uzmanın en son işlemi`C × N/E`个Token;溢出的Token 跳过该层──会损害质量──
3. **Auxiliary-loss-free balancing**(DeepSeek-V3)──Add a can-learner bias, used to shift router's top-k choice──bias in training loss 外部更新──不对主目标添加惩罚──这是2024年重要突破──

DeepSeek-V3 uygulaması: Her eğitim aşamasının ardından, her uzmanın kullanım oranının yüksek veya düşük olduğunu kontrol edin.`±γ`微调偏──选择时使用 `scores + bias`◊ Giriş için kullanılan uzman olasılıkları  hala kullanın değiştirilmemiş orijinal `scores`Bu yönlendirme ile ifade 解──

### Ortak uzmanlar

DeepSeek-V2/V3 ayrıca uzmanları ayırarak *shared* ve *routed*── her token tüm ortak uzmanlardan geçti.

### Güzel tahıllardaki uzmanlar

经典 MoE(GShard、Switch): Her uzman 和完整FFN 一样宽──`E`较小(8-64),`k`较小(1-2)。

现代 ince tanelerli MoE(DeepSeek-V3、Qwen-MoE): her uzman 更狭(1/8 FFN boyut)`E`Çok büyük.`k`Daha büyük ((8+) ◊总参数 aynı, fakat组合数扩展快得多。`C(256, 8) = 400 trillion`种可能的每 Token 专家──质量提升,延迟 保持不变──

### 成本画像

Her bir simge:

| Config | Active params / token | Total params |
|--------|-----------------------|--------------|
| Mixtral 8×22B | ~39B | 141B |
| Llama 3 70B (dense) | 70B | 70B |
| DeepSeek-V3 | 37B | 671B |
| Kimi K2 (MoE) | ~32B | 1T |

DeepSeek-V3 neredeyse tüm referans değerini üstü üstü Llama 3 70B (sıkı)**每个 Token 使用更少的活跃 FLOPs**△更多参数 = 更多知识──更多活跃 FLOPs = 更多计算── MoE将它们解──

### 代价: hatıra

无论哪些专家被触发,所有专家都必须驻留在GPU 上――一个671B 模型需要约1.3 TB VRAM 来存储fp16重量――边界MoE 部署――需要专家平行:把专家分分到多个GPU 上,通过网络路线代币――延迟 主要由所有对所有通信 主导,而不是 matmul――


```figure
expert-routing
```

## Yapın onu.

参见 `code/main.py`                                                                                                                                                                                                                                                              

- `n_experts=8`个近似 SwiGLU'nun uzmanları(bu açıklamak için, her biri sadece bir çizgi)
- üst k=2 yönlendirme
- Softmax normalleştirilmiş kaplama ağırlıkları
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

### 步骤1: yönlendiricisi

```python
def route(hidden, W_router, top_k, bias):
    scores = [sum(h * w for h, w in zip(hidden, W_router[e])) for e in range(len(W_router))]
    biased = [s + b for s, b in zip(scores, bias)]
    top_idx = sorted(range(len(biased)), key=lambda i: -biased[i])[:top_k]
    # softmax over ORIGINAL scores of the chosen experts
    chosen = [scores[i] for i in top_idx]
    m = max(chosen)
    exps = [math.exp(c - m) for c in chosen]
    s = sum(exps)
    gates = [e / s for e in exps]
    return top_idx, gates
```

Tıpkı DeepSeek-V3'ün teknikleri gibi: Tıpkı önyargı ve önyargı ile yük dengesizliğini düzeltmek için.

### 步骤 2: 让 100 个代码 通过路由器

Hangi uzmanları takip ediyoruz 触发以及触发频率──没有偏见 时,使用率会偏斜──加入偏见更新循环(过度使用的专家用`-γ`, insufficient usage `+γ`) sonrasında kullanım oranı birkaç dönem içinde ortalama bir şekilde dağıtılacaktır.

### 3 adım: Konum karşılığı

印印一个 MoE config 的 密度相当──DeepSeek-V3 形状:256 yönlendirilmiş + 1 paylaşılan,8 aktif,d_model=7168──总参数非常惊人──活跃参数量只有密度 Llama 3 70B 的七分之一──

## Kullan

Kucaklanmak Yüzü Üstü:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("mistralai/Mixtral-8x22B-v0.1")
```

2026 yılının üretim sonucu:vLLM 原生支持MoE yönlendirme──SGLang 拥有最快的专家-parallel path──两者都会自动处理顶级选和专家平行──

**何时选择 MoE：**
- Hint fiyatı daha düşük bir şekilde elde etmek istiyorsunuz.
- VRAM / uzman paralel altyapıya sahipsiniz.
- İş yükü, bağlam ağırlığı değil, uzun belgeleri.

**何时不要选择 MoE：**
- Kenar dağıtım: herhangi bir aktif FLOP için 支付完整储存成本──
- Uygulama: Uzman yönlendirme, genel maliyetleri artırmak.
- Küçük model ((<7B):MoE'nin kalite avantajları sadece belirli bir hesaplama eşiğinden sonra ortaya çıkar.

## - Söyle.

参见 `outputs/skill-moe-configurator.md`◊ bu beceri, parametre bütçe, eğitim simgeler ve yeni bir MOE'yi seçmek için, E 、k 和 ortak uzman düzenlemesini seçmek için kullanılır.

## 练习

1. **Easy.**运行  İşlem`code/main.py`◊ Observer Auxiliary-loss-free bias update 如何在50 次中拉平专家使用──
2. **Medium.**Hash tabanlı yönlendiricisi kullanın (Hash tabanlı yönlendiricisi kullanın) Öğrenilen yönlendiricisini değiştirmek için.
3. **Hard.**实现 GRPO-style rollout-matched routing(DeepSeek-V3.2 技巧):记录 inference 期间 hangi uzmanlar tarafından触发,在 Gradient 计算期间强制使用相同路由──在一个玩具政策-gradient 设置 上测量效果──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| Expert | “众多 FFN 中的一个” | 一个独立 feed-forward network；参数专用于 FFN 计算中的一个稀疏切片。 |
| Router | “gate” | 一个很小的 linear layer，用来为每个 Token 对每个 expert 打分；执行 top-k selection。 |
| Top-k routing | “每个 Token 有 k 个 active experts” | 每个 Token 的 FFN 计算恰好经过 k 个 experts，并由 gate 加权。 |
| Auxiliary loss | “Load-balance penalty” | 一个额外 Loss term，用来惩罚偏斜的 expert usage。 |
| Auxiliary-loss-free | “DeepSeek-V3 的技巧” | 只在 router 的 selection 上通过 per-expert bias 实现 balance；没有额外 Gradient。 |
| Shared expert | “Always on” | 每个 Token 都会经过的额外 expert；捕获通用知识。 |
| Expert parallelism | “按 expert 分片” | 将不同 experts 分配到不同 GPUs；通过网络 route tokens。 |
| Sparsity | “active params < total params” | 比率 `k × expert_size / (E × expert_size)`；DeepSeek-V3 为 37/671 ≈ 5.5%。 |

## 延伸阅读

- [Shazeer et al. (2017). Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer](https://arxiv.org/abs/1701.06538)Bu düşüncenin kaynağı.
- [Fedus, Zoph, Shazeer (2022). Switch Transformer: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity](https://arxiv.org/abs/2101.03961) Switch, klasik MoE。
- [Jiang et al. (2024). Mixtral of Experts](https://arxiv.org/abs/2401.04088) Mıksal 8×7B。
- [DeepSeek-AI (2024). DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) MLA + yardımcı kayıpsız MoE + MTP。
- [Wang et al. (2024). Auxiliary-Loss-Free Load Balancing Strategy for Mixture-of-Experts](https://arxiv.org/abs/2408.15664)                                                                                                                                                                                                                                                              
- [Dai et al. (2024). DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models](https://arxiv.org/abs/2401.06066) 本课路由器 使用的细粒度 + ortak uzman bölümü。
- [Kim et al. (2022). DeepSpeed-MoE: Advancing Mixture-of-Experts Inference and Training](https://arxiv.org/abs/2201.05596) 最早的共享专家论文──
