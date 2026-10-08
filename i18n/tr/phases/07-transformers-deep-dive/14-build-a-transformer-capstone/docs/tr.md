# From零构建 Transformer  Capstone 项目

> 十三节课──一个模型──不走捷径──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 01 到 13。不要跳过。
**Time:** 约 120 分钟

## 问题

Siz her makaleyi okudunuz. Şimdi onları gerçek bir görevde işbirliği içinde çalıştırın.

Bu temel taş: Bir karakter seviyesindeki dil modelleme görevi  görev üstü üstü üstü üstü küçük bir dekodörle çalışan bir transformatör eğitimi ∞.

Bu dersin nanoGPT── bu orijinal değil  Karpathy 2023 yılının nanoGPT öğretim kursu, her öğrencinin en az bir kez bir referans uygulaması yazmasıdır── biz onun şeklini kullanıyoruz ve bu ders etrafında konuşulan içeriği yeniden düzenliyoruz──

## 概念

![Transformer-from-scratch block diagram](../assets/capstone.svg)

架构标注如下:

```
input tokens (B, N)
   │
   ▼
token embedding + positional embedding  ◀── Lesson 04 (RoPE option)
   │
   ▼
┌──── block × L ────────────────────┐
│  RMSNorm                          │  ◀── Lesson 05
│  MultiHeadAttention (causal)      │  ◀── Lesson 03 + 07 (causal mask)
│  residual                         │
│  RMSNorm                          │
│  SwiGLU FFN                       │  ◀── Lesson 05
│  residual                         │
└────────────────────────────────── ┘
   │
   ▼
final RMSNorm
   │
   ▼
lm_head (tied to token embedding)
   │
   ▼
logits (B, N, V)
   │
   ▼
shift-by-one cross-entropy            ◀── Lesson 07
```

### Neyi teslim edeceğiz ?

- `GPTConfig` 统一配置所有超参数的地方──
- `MultiHeadAttention` sebepçi  seri,                                                                                                                                                                                                                                                           `scaled_dot_product_attention`)。
- `SwiGLUFFN` 现代 FFN。
- `Block` pre-norm, with residual 包裹注意 + FFN。
- `GPT` yerleşim  yığınlı bloklar LM başı  oluşturmak )
- AdamW、kosine LR、gradyen kesiminin eğitim döngüsünü kullanın.
- Shakespeare'in yazılarında,

### Biz neyi teslim etmiyoruz ?

- RoPE  Ders 04 已从概念上实现──这里为了简单使用学会的位置嵌入──练习会要求你换成RoPE──
- 生成期 KV cache  Her nesil adımında tam bir önbölge üzerinde yeniden hesaplanmış dikkat edilmektedir. Daha yavaş ama daha basit.
- Flash Dikkat  PyTorch 2.0+ 会在输入匹配时自动发送;我们使用 `F.scaled_dot_product_attention`- Evet.
- MoE  Her blokda tek bir FFN kullanıyor.

### 目标指标

Mac M2 dizüstü bilgisayarında, 4 katlı, 4 başlı, 128'in GPT'si var.`tinyshakespeare.txt`Ünce 2000 adım:

- Eğitim kaybı yaklaşık 6 dakika içinde yaklaşık 4.2  rastgele olarak yaklaşık 1.5 
- 采样输出 looks looks like Shakespeare's formatt:古风词汇、换行,以及像 ROMEO: 这样专名称会出现──
- Val kaybı (seksin son %10'u) eğitim kaybı ile yakından takip edilir; bu boyutta/ bütçede aşağıda fazla uygun değildir.


```figure
n5-block-stack
```

## Yapın onu.

本课使用 PyTorch──安装 `torch`(CPU yapı 即可)`code/main.py`❖脚本会处理:

- Eğer eksikse indir`tinyshakespeare.txt`(或读取本地副本)
- Byte seviyesindeki char tokenizerı
- 90/10'ün tren/val bölümü
- Bu durumda, bf16 otomatik yayınını destekleyen bir cihaz üzerinde kullanın.
- 訓練完成后のサンプル採集──

### 1 adım: veriler

```python
text = open("tinyshakespeare.txt").read()
chars = sorted(set(text))
stoi = {c: i for i, c in enumerate(chars)}
itos = {i: c for c, i in stoi.items()}
encode = lambda s: [stoi[c] for c in s]
decode = lambda xs: "".join(itos[x] for x in xs)
```

65 个唯一字符──极小的词汇──适合4字节词汇_size──没有BPE,也没有代码器 麻烦──

### 步骤 2: model

参见 `code/main.py`Bu blok, Ders 05'in standart yazma yöntemidir.  Pre-norm, RMSNorm, SwiGLU, neden MHA, 4/4/128'in parametrelerinin sayısı: yaklaşık 800K.

### 步骤 3: Eğitim döngüsü

随机取一批长度为 256 标志性窗──前面──转变-by-one 横断-entropy──倒退──AdamW adım──Log──重复──

```python
for step in range(max_steps):
    x, y = get_batch("train")
    logits = model(x)
    loss = F.cross_entropy(logits.view(-1, vocab_size), y.view(-1))
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    opt.step()
    opt.zero_grad()
```

### 步骤 4: örnek

给定一个提示,反复前进,从顶部logits 中样本,添加,然后继续──500 token 后停止──

### 步骤 5: çıkış okuyun

2000 adım 后:

```
ROMEO:
Away and mild will not thy friend, that thou shalt wit:
The chief that well shame and hath been his friends,
...
```

Bu Shakespeare değil ama Shakespeare'in şekliyle... 800K'lik bir parametreler ve dizüstü bilgisayar için 6 dakikalık bir eğitim için, bu kesin bir başarı.

## Kullan

Bu temel taş bir referans mimarisi. Gerçek kullanılabilir bir şeye yayılmak için üç yön vardır:

1. **更换 tokenizer。**BPE kullanmak`tiktoken.get_encoding("cl100k_base")`)―Vokab boyutu 65'ten yaklaşık 50.000'e kadar atlıyor.
2. **在更大的 corpus 上训练。**Kullanım`OpenWebText`Ya da`fineweb-edu`(HuggingFace) ・・・ On B Token kullanın  訓練一 125M-param GPT 大約需要24小時──
3. **添加 RoPE + KV cache + Flash Attention。**Aşağıdaki egzersizler her bir şeyi tamamlamanıza yardımcı olacaktır.

En sonunda 125M-parametrelik bir GPT elde edeceğim, bunun için bir sınır modeli olmayacak. Ama aynı kod yolu sadece daha büyük olacak.

## - Söyle.

参见 `outputs/skill-transformer-review.md`Bu beceriler, 13 bölümün doğruluğunu ele alırken, sıfırdan dönüştürücü uygulamasını inceler.

## 练习

1. **Easy.**运行  İşlem`code/main.py`❖ Test Your trained model ❖ Son aşamada onay kaybı ❖ 2.0 ❖ ✓`max_steps`2000'den 5000'e kadar değer kaybı devam edecek mi?
2. **Medium.**RoPE'yi değiştirmek için öğrenilen pozisyonsal yerleşimleri kullanın.`MultiHeadAttention`内部对 Q 和 K 应用转转――训练并验证 val kaybı en az aynı seviyede──
3. **Medium.**Örnekleme döngüsünde KV cache uygulamak için.
4. **Hard.**给模型 添加第二个头,用来预测下一个多个代币(MTP  DeepSeek-V3'den Multi-Token Prediction) ――联合训练――¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
5. **Hard.**4 uzman MoE kullanın  değiştirin her blok içinde tek FFN── Router + top-2 yönlendirme──                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| nanoGPT | “Karpathy 的 tutorial repo” | 最小化的 decoder-only transformer training code，约 300 LOC；canonical reference。 |
| tinyshakespeare | “标准 toy corpus” | 约 1.1 MB 文本；自 2015 年以来几乎每个 character-LM tutorial 都使用它。 |
| Tied embeddings | “共享 input/output matrix” | LM head weight = token embedding matrix 的转置；节省 parameters，并提升质量。 |
| bf16 autocast | “Training precision trick” | 用 bf16 运行 forward/back，在 fp32 中保留 optimizer state；自 2021 年以来成为标准做法。 |
| Gradient clipping | “阻止 spikes” | 将 global grad norm 限制在 1.0；防止 training blowups。 |
| Cosine LR schedule | “2020+ 默认选择” | LR 先线性上升（warmup），然后按 cosine 形状衰减到峰值的 10%。 |
| MFU | “Model FLOP Utilization” | 实际达到的 FLOPs / 理论峰值；2026 年 40% dense、30% MoE 已经很强。 |
| Val loss | “Held-out loss” | 在 model 从未见过的数据上计算 Cross-Entropy；overfit detector。 |

## 延伸阅读

- [The Annotated Transformer (Harvard NLP)](https://nlp.seas.harvard.edu/annotated-transformer/) 经典的注释的实施.
