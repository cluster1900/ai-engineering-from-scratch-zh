# Çoklu Token Tahmin (MTP)

> GPT-2'den Llama 3'e kadar her kendi kendine geri dönüş LLM'nin her pozisyonu bir kaybın üzerine kuruluyor. Her pozisyonda bir kaybın önüne geçiyor. DeepSeek-V3'ün her pozisyonunda ikinci kaybın artışı var.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 10 · 04（预训练 mini GPT）、Phase 10 · 15（speculative decoding）
**Time:** ~60 分钟

## Öğrenme hedefi

- MTP  訓練目標,并推导不同预测深 上的关节损失──
- 解释 Gloeckle et al. ′s paralel MTP başları 2024) ile DeepSeek-V3′nin sıralı MTP modülleri  arasındaki fark, ve neden sıralı 设计能保留因果链──
- 計算中预训运行中加入 MTP modüllerinin parametreleri ve内存开销──
- MTP modülünü gerçekleştirmek için: paylaşılan yerleştirme, derinliklere göre transformatör blokları, projeksiyonlar ve paylaşılan çıkış başlığı

## 问题

Sonraki belirti tahminleri standart LLM eğitim hedefidir. Her gizli durum tek bir şeyi tahmin etmek için izlenir: yakınlık göstergesini. Bu, beklenmedik bir şekilde zayıf bir sinyaldir.

MTP  Sorusu: Eğer her gizli durum bir kez izlenirse bir kez tahmin etmek için ne olacak?Gloeckle et al. (Meta, 2024) bunu kanıtlamak yardımcı olur. Onların gerçekleşmesi omurgasının üzerinde birkaç bağımsız çıkış başını yerleştirir, her baş farklı önyargıları öngörer.

DeepSeek-V3 (2024 yıl 12 月) MTP'yi, her tahmin derinliğinde, üstü kaynağı koruyacak bir dizi modül olarak yeniden tasarlayacak.`h_i^(0)`预测 `t+1`Sonra da yeni bir gizli durumdan.`h_i^(1)`预测 `t+2`... ve ...`h_i^(1)`- Evet .`h_i^(0)`和 `E(t+1)`Embedding, depinde bu tip öneriler. Her derinlik kendi küçük transformator blokları vardır. Paylaşılan embedding ve paylaşılan çıkış başlığı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

Bu ders, bir tek MTP modülü oluşturma ve D- derinlik kaybından başlayarak gerçekleşir. Matematik çok temizdir.

## 核心概念

### sıradan MTP 配方

DeepSeek-V3 Üst model üzerinde eklenir`D`个 MTP modülleri。 her modül `k`(Ondan `k = 1..D`)预测深度 `k`Bu da bir işaret.`i`时预测                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `t_{i+k}`- Evet.

Modül`k`包含:

- Bir Transformer blok .`T_k`Kendi dikkatine sahip olmak, MLP'ye sahip olmak.
- Bir projeksiyon matrisi`M_k`, önde bir derinlik gizli durumu ve aşağı bir derinlik temel gerçeği simgesi yerleştirme 结合起来──
- paylaşılan yerleştirme `E`(与主模型相同)
- paylaşılan çıkış başlığı `Out`(与主模型相同)

訓練時,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `i`Prefiks, derinliklere göre gizli durum 为:

```
h_i^(0) = main model backbone at position i
h_i^(k) = T_k( M_k * concat(RMSNorm(h_i^(k-1)), RMSNorm(E(t_{i+k}))) )   for k >= 1
```

Derinlik tahminı 为:

```
logits_{i+k} = Out(h_i^(k-1))   for k = 1..D
```

Derinlik kaybı , temel gerçeğe göre .`t_{i+k}`Çelişkili entropi:

```
L_k = CE(logits_{i+k}, t_{i+k})
```

跨 depth                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

```
L_MTP = (lambda / D) * sum_{k=1..D} L_k
```

`lambda`Daha küçük bir ağırlık faktörü, DeepSeek-V3 için %10 kullanın.`L_main + L_MTP`- Evet.

### Neden paralel değil, sıralı?

Gloeckle'nin ilk paralel MTP'leri, her biri doğrudan uygulanır.`h_i^(0)`                                                                                                                                                                                                                                                              `t_{i+k}`Normal bir şekilde antrenman yapabilirsin ama bu tahminler birbirine bağlı değil.`head_1`Çıkışlı yardım`head_2`Bu kafalar, birer başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı başlı

DeepSeek-V3'ün sıralı tasarımından`h_i^(k-1)`Ek olarak gerçek bir sonraki simge yerleştirme `E(t_{i+k})`Yapımcılık`h_i^(k)`Bu, önceden tahmin etmek için nedenlik zinciri korudu.`t_{i+k+1}`, derinlik`k+1`Modül görülecektir.`t_{i+k}`处的内容── This is in structure with the self-backed decoder 消费 itself output method, therefore MTP modules can be directly as speculative-decoding drafters ▸

推理时:将 `h_i^(k-1)`Yönlendirilmiş`t_{i+k}`输入 modülü `k+1`- Evet .`t_{i+k+1}`Bu EAGLE tarzı taslak, sadece iyi bir eğitimli MTP modülü kullanmak için bir taslak ağı olarak. DeepSeek-V3 ilk MTP modülünün kabul oranını %80'den fazla rapor ediyor ve yaklaşık 1.8× hız kazanıyor.

### 参数核算

Gizli bir şey için .`h`、词表为 `V`Model:

- Önemli model: milyarlarca parameter, bir tane daha büyük.`V * h`Çıktı başı
- Paylaşılan çıkış başı: Dupuyol main model'ın başı。 hiçbir ekstra parametre yoktur。
- Paylaşılan yerleştirme: Duplease main模型的嵌入──没有额外参数──
- Her MTP modülü:
  - Proje `M_k`- ...`(2h) * h = 2h^2`- Evet.
  - Transformer blokları `T_k`Dikkat`4h^2`)加 MLP(SwiGLU 且比例为8/3 时通常为`8h^2`)― her blok `12h^2`- Evet.

Her modülün toplam ekseği:`~14h^2`DeepSeek-V3 için.`h = 7168`,D = 1 modül: kâğıt üzerinde `~14 * 7168^2 = ~720M`参数──DeepSeek-V3  rapor 14B, farkı çoğunlukla MTP modülü arasındaki uzman katmanlarından ve MoEyi de kullanmaktadır──

### spekülatör-dekodlama 回报

Ön eğitim sırasında, MTP modülleri, eğitimin yavaşlamasına yaklaşık %10'luk bir süre sağlayacak.

1. Daha yoğun bir eğitim sinyalleri. Her gizli durum D+1 个监督目标                                                                                                                                                                                                                                                      

2. 推理时免费的投机式解码草案──MTP moduları 已被训练来预测下几代币──再使用网络草案时,它能达到80%+的接受率──在这个水平下,N=3 或N=5 的规范解码可带来1.8×吞吐量──10% 的训练成本将在第一次运行推理时就开始回本──

### KİÇİN ile ilişki

EAGLE, ön eğitimden sonra tek başına bir küçük taslak modeli eğitmek üzere hazırlanır. MTP, ön eğitim için bir taslak hazırlar.

| Dimension | EAGLE-3 | MTP (DeepSeek-V3) |
|-----------|---------|------------------|
| When trained | 预训练之后 | 预训练期间 |
| Backward-compatible with existing weights | 是 | 否（需要重新训练） |
| Draft params | 1-2 个 transformer layers | 1 个 transformer block + projection |
| Acceptance rate | 0.88-0.92 | depth 1 时 0.80+ |
| Benefit beyond speedup | 仅 speculative decoding | 更密集的训练信号 + 加速 |


```figure
multi-token-predict
```

## Yapın onu.

`code/main.py`端到端构建一个MTP模块:shared embedding、projection、transformer block、shared output head──然后它会在一段简短的合成序列上计算每深度交叉热损失,并按组件印印参数──32 个代币的玩具词汇让数字更易读──

### 步骤1: paylaşılan yerleştirme tablosu

Bir tane .`vocab_size x hidden`Tabloya göre, her derinlikteki her MTP modülü bir ikinci bir kopya değil, aynı tenzor kullanılır.

### 步骤 2: derinliklere göre birleştirme

```python
def combine(prev_hidden, next_token_embed, M_k):
    # concat along feature dim, then project down to hidden
    concat = rms_norm(prev_hidden) + rms_norm(next_token_embed)  # vector addition stand-in
    projected = matvec(M_k, concat)
    return projected
```

Gerçek DeepSeek-V3 iki RMSNorm vektör kopyasını yaşayacak .`[2h]`, bir tane kullanmadı .`h x 2h`Matrix 投影── bu oyuncak 为了 stdlib 简洁, vector加法来代替──

### 步骤3: k'in derinliği transformatör blok

Kendi dikkatini artı MLP── Oyuncaklar içinde, tek katlı bir çizgi dikkat bloğu 和一个SwiGLU MLP 让结构可见,同时避免使用 numpy──

### 步骤 4: paylaşılan çıkış başı

复用主模型的输出投影──输出覆盖词汇的 logits──

### 步骤 5: Derinlik kaybı

Softmax (Logits)`k`处 temel gerçeklik simgesi `lambda / D`缩放因子跨深度 聚合──

### 步骤 6: parametre değerlendirme

打印总参数、共享(embedding、head)参数, yanı sıra modül başına 额外参数──MTP 额外参数与主模型大小的比例──

## Kullan

MTP 已集成到DeepSeek-V3(2024年 12 月) 和DeepSeek-R1 系列中──推理时:

- DeepSeek  kendi servis yığını 可开箱即用地将 MTP modülleri 作为投机解码器 使用。
- 截至2026年 4 月,vLLM 和 SGLang 已有DeepSeek-V3 MTP 的集成路径──
- AMD'nin ROCm SGLang öğretimi, belirli bir MTP spekülasyonsal-dekodlama konfigürasyonu gösterdi ve V3 kontrol noktasında 1.8× hızlandırıldı.

Yeni bir tren sürümünde MTP kullanma sahnesi:

- Tam bir önceden eğitim hattını kontrol ediyorsun ve daha yoğun bir eğitim sinyalini elde etmek istiyorsun.
- Kendinizi büyük bir hizmette görürsünüz.
- 1B'de, satışın getirdiği zarar genellikle kazançtan daha fazla.

İstifadeden uygun olmayan durumlar:

- mevcut hazırlık yoğun model için ince ayarlama yapın.
- Araştırma modelinde, net bir temel çizgi olmasını istersin.

## - Söyle.

本课会生成 `outputs/skill-mtp-planner.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                                         `lambda`Programı, kayda kayıt, ve tahmin süresi spekülatif-dekodlama kabloları.

## 练习

1. 运行  İşlem`code/main.py` göstermek sentetik sinyal 增强,per-depth loss 单调下降── modifiye sintetik, make it use fixed mode,并验证 depth-1 和 depth-2 loss 都会收──

2. 計算一個密集 70B 模型 ((隱藏 8192,80 層) 在 D=1 MTP 模組下的参数开销── DeepSeek-V3 報告的 14B 开销與进行比较──解释为什么 DeepSeek'in 數字更高:MTP 變壓器積木 继承了相同的 MoE 结构,从而增加了每模組 参数──

3. Oyuncak içinde gerçekleştirilen D=2: Ekle ikinci MTP modülü, al h^(1) 并预测 `t_{i+2}`❖ Testing joint loss 和 parametre核算与DeepSeek kağıdı △ 19-21 匹配──

4. Bu oyuncak paralel MTP olarak değiştirilmiştir: Hedefi gizli durumda 之上 D 个输出头,每个预测不同的抵消――测量在同一个合成信号上,每个深度的损失与序列的版本相比如何――对于 k > 1,sequential 版本应产生更低的深度的损失,因为它在中间预测为条件――

5. İyi bir eğitim MTP modülü kullanmak EAGLE tarzı taslak:`t_{i+k}` Bu taslakları üst sıralamalarda ölçerek, başlıca model tahminlerinin kabul oranına göre ölçerek, %50'e ulaşırsanız, MTP-as-draft deneyimi niteliğini yeniden ortaya çıkarır.

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MTP module | “额外 loss block” | 一个小型 transformer block 加 projection，用来预测主模型前方 `k` 个位置的 Token |
| Prediction depth | “哪个 offset” | 整数 `k`，使得 module `k` 基于截至位置 `i` 的 prefix 预测 `t_{i+k}` |
| Parallel MTP | “Gloeckle-style” | 位于同一个 backbone hidden state 之上的 D 个独立 heads，没有条件链 |
| Sequential MTP | “DeepSeek-V3 style” | 每个 module 都以先前 depth 的 hidden state 加下一个 Token 的 embedding 为条件；保留 causal chain |
| Shared output head | “复用主 head” | MTP modules 调用主模型的 LM head，而不是单独的 output projection |
| Shared embedding | “复用主 table” | 同一个 vocabulary embedding table 在所有地方使用；没有重复参数 |
| Projection matrix M_k | “结合 hidden + next-token” | 一个 `h x 2h` linear layer，将前一个 hidden state 和 target-token embedding 折叠为下一深度的输入 |
| Joint loss L_MTP | “平均额外 losses” | per-depth cross-entropy losses 的算术平均值，并按 `lambda` 缩放 |
| Acceptance rate at depth 1 | “MTP draft 多常正确” | D=1 MTP module 的 top-1 prediction 等于主模型 top-1 prediction 的比例；DeepSeek-V3 上超过 80% |
| Lambda weighting | “额外 loss 的重要性” | per-depth 缩放因子；DeepSeek-V3 在训练开始时为 0.3，之后为 0.1 |

## 延伸阅读

- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) 完整的序列 MTP 描述(Bölüm 2.2), ortak kayıp denklemleri de dahil
- [Gloeckle et al. — Better & Faster Large Language Models via Multi-token Prediction (arXiv:2404.19737)](https://arxiv.org/abs/2404.19737) DeepSeek 设计所改进的平行 MTP temel hat
- [DeepSeek-V3 model card on Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-V3) 685B 总量(671B main + 14B MTP),部署说明
- [Leviathan et al. — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192)](https://arxiv.org/abs/2211.17192) MTP 所适配的 spekülatör-dekodlama  framework
- [Li et al. — EAGLE-3 (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840) EAGLE'nin 2025 tasarısı da MTP 竞争对应方案
