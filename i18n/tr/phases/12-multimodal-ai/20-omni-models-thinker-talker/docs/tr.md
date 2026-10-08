# Omni Modeller: Qwen2.5 Omni ve Düşünce Konuşması  拆分

> GPT-4o 2024 Mayıs'taki ürün gösterisi için neden etkilenmeye değer değil, çünkü alt model, ama ürün biçimi: bir ses arayüzü, konuşma, model görüntüde gördüğü içeriği, ve 250ms iç iç iç ses yanıtları. Açık ekolojik 2024 yılın余下时间 ve 2025 yılın devamlı yarış hızında, bu ürün yüzeyine ulaşmaya çalışmak.

**Type:** Build
**Languages:** Python（stdlib，streaming pipeline 延迟模拟器 + VAD 循环）
**Prerequisites:** Phase 12 · 19（audio-LLMs），Phase 12 · 16（any-to-any）
**Time:** ~180 分钟

## Öğrenme hedefi
- Bu nedenle, bu yayınlar için bir dizi yayın yayın yapılması gerekmektedir.
- 逐组件计算一次对话交互的时间-to-first-audio-byte (TTFAB) bütçe
- TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın TMRoPE'yi tanımlayın
- Üç farklı konuşma modüsü: yarı çiftlik, dönüş, tam çiftlik.

## 问题
Gerçek zamanlı bir ses asistanı çok şey hızlı bir şekilde tamamlamalıdır.

1. 听用户──实时语音 Tokenization, ses etkinliği tespit(VAD) kullanıcıyı nasıl kullanıldığını belirlemek için kullanılır
2. Seçili görüntüler: 2-4 FPS                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
3. 思考──Base dialog 历史 组织回应──
4. Söylemek, Yapılandırma, Sonraki Sıcaklık

Her adım da gecikme artıyor. Sohbet gereksinimleri %2'ye kadar devam ediyor.

Her bir parça akışına ihtiyaç duyar.

## 概念
### Düşünen ve Konuşan

Qwen2.5-Omni'nin ayrımı:

- Düşünceci: bir 7B-80B 文本生成 Transformer。消费交错的文本 + 图像 + 音频 Token。输出表示要说什么的文本 Token。
- Konuşmacı: bir daha küçük语音生成 Transformer(200M-1B) ――消费 Thinker's文本输出 符号加上最近的语音上下文 符号──输出离散语音 符号(residual-VQ 索引) ――
- Konuşma dekodörü: bir akış dalga biçimi dekodörü(SNAC、MoVQGAN ailesi),将语音 Token 实时转换为音频样品──

Bu ayrım önemlidir. Düşünen, iyi düşünme yeteneğine sahip olmak için yeterince büyük olmalıdır. Konuşmacı çok küçük olabilir, çünkü onun görevi yeralçaktır: metni dil belirtilerine dönüştürmek.

两者并行运行:

1. Düşünceci 发出文本
2. Konuşmacı 消费 t_i(通過流),并发出语音 Token s_i、s_{i+1}、...、s_{i+k}。
3. Konuşma dekodörü, ses simgesi olarak kullanılırken, sesli örnekler çıkarılır.
4. Düşünceci geldiğinde, konuşmacı zaten yayını yapıyor.

### TMRoPE  时间对齐的 çok modal 位置

Düşünceci  needs to integrate images (örneğin 4 FPS ile) 音频 (50 /秒 ile) ve dialog tarihi metinlerinden ── basit bir dizi sırasıyla 🏻 tüm resim, sonra tüm 音频, sonra metin) zaman kaybedecektir ────────────────────────────────────────────

TMRoPE için her bir simge bölünmüş mutlak zaman ⋅ t=2.3s ⋅ t=2.32s ⋅ t=2.32s ⋅ t=2.32s ⋅ t=2.35s ⋅ RoPE ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.35s ⋅ t=2.3s ⋅ t=2.3s ⋅ t=2.3s ⋅ t=2.3s ⋅ t=2.3s ⋅ t=2.3s ⋅ t=2.3s ⋅ t=3.5 ⋅ t=3.5 ⋅ t=3.5 ⋅ t=3.5 ⋅ t=3.5 ⋅ t=3.5 ⋅ t=3.5 ⋅ t=3.5 ⋅ t=3.5 ⋅ t=3.5 ⋅ t=3 ⋅ t=3

Bu, bir kenara çekilmek ve bir kenara selam vermek için kullanılır.

### Akış 语音合成

语音 Token 必须流通──Mini-Omni(Xie & Wu, 2024) 语音 Token 必须流通──Mini-Omni(Xie & Wu, 2024) 语音 modeller 语音 语音 语音 语音 必须流通──Xie & Wu, 2024) 语音 modeller 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音 语音

Moshi(Défossez et al., 2024 yıl 10 月) en hızlı açık gerçekleşme olmuştur.

### VAD ve dönüş

Ses etkinliği algılama 运行在输入侧──两种模式:

- Yarım-dupleks: kullanıcı konuşuyor, model dinliyor, model konuşuyor, kullanıcı dinliyor, VAD 静音检测 (VAD) 静音检测 (~ 200 ms) 实现清晰交接 (~ 200 ms) 实现清晰交接 (~ 200 ms) 实现清晰交接 (~ 200 ms) 实现清晰交接 (~ 200 ms) 实现清晰交接 (~ 200 ms) 实现清晰交接 (~ 200 ms) 实现清晰交接 (~ 200 ms) 实现清晰交接 (~ 200 ms) 实现清晰交接 (~ 200 ms) 实现清晰交接 (~ 200 ms) 实现清晰交接 (~ 200 ms) 实现清晰交接 (~ 200 ms) 实现
- Tam bir çiftlik: her iki taraf aynı anda konuşabilir. Model arka kanal olabilir.

Qwen2.5 Omni 默认支持半duplex,通过静音值进行转变──Full-duplex 需要应用层处理──

### Qwen3-Omni(2025 年 11 月)

后继版本──Qwen3-80B Thinker, Greater Talker,改进的TMRoPE-v2──延迟接近GPT-4o'nun 250ms──开放权重──在OmniBench上的基准与Gemini 2.0 Live 具有竞争力──

### Üretim gecikmesi bütçesi

对于典型流 交互:

- Mik -> 音频 Token:40-80ms。
- Ön doldurun: 7B 上 100-200ms, 70B 上高得多
- İlk Düşünceci.
- Konuşmacı 处理第一个文本 Token:20ms。
- İlk ses: Token commit:40ms
- Geri kalan-VQ çözümü:30 ms.
- 语音 dalga biçimi dekode:50-80ms。

总 TTFAB:7B 上 320-510ms,70B 上 600-900ms。Sınır 质量通常意味着70B+; İşte sınır 延迟差的来源──

### Token oranı matematiği

16kHz 语音和 50 Hz 基础层语音 代号,你每秒输出需要50 语音 代号――Solucer 必须发发发 ≥50 tok/s 才能跟上―― H100'de tipik LLM throughputı 30-80 tok/s,因此小型(200-300M)Solucer 足够快;7B Sohuncu 会落后――

Bu yüzden, doğrudan kullanan ana model yerine küçük özel konuşmacı  modelleri vardır.


```figure
l5-thinker-talker
```

## Kullan
`code/main.py`- ...

- Tıpkı düşünce-sözcü borusu gibi.
- Yapılandırılabilir model boyutları ve mikro  örnekleme oranı hesaplama TTFAB
- VAD 静音值演示 yarım duplex dönüş yapma

## - Söyle.
本课产 出 `outputs/skill-omni-streaming-budget.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                           

## 练习
1. Senin hedefin TTFAB 300 ms. 7B Düşünceci ve 300M Konuşmacı'da, her bir bileşenin gecikmesini yaz.

2. Qwen2.5-Omni TMRoPE kullanın. Bu tür bir istekle anlatın.

3. Tam bir ikili 支持要求模型在听的同时发发音频── bunu öğretmek için bir eğitim biçimi önerdi.

4. Moshi'nin Dersi Bölüm 4. İç monologun ayrılması ve düşünce konuşucusunun ayrılması neden kaçınılması

5.  hesaplama  bütçe: 16kHz 语音 ve 50 基层 Token/s'e uymak için, Konuşmacı daha hızlı bir hızda Token göndermek zorunda mı?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Thinker | “推理大脑” | 生成要说什么的大型文本生成 Transformer |
| Talker | “语音生成嘴巴” | 从 Thinker 文本生成离散语音 Token 的小型 Transformer |
| TTFAB | “延迟预算” | Time-to-first-audio-byte：从用户语音结束到第一个音频 sample 输出 |
| TMRoPE | “时间对齐 RoPE” | 使用跨视觉、音频、文本的绝对时间戳的位置编码 |
| Half-duplex | “Turn-taking” | 用户和模型交替；VAD 静音检测用户已说完 |
| Full-duplex | “同时进行” | 模型可以同时说话和聆听；具备 backchannel 能力 |
| Inner monologue | “Moshi 分离” | 单模型设计，其中思考流和说话流交错 |

## 延伸阅读
- [Xu et al. — Qwen2.5-Omni (arXiv:2503.20215)](https://arxiv.org/abs/2503.20215)
- [Qwen Team — Qwen3-Omni (arXiv:2509.17765)](https://arxiv.org/html/2509.17765v1)
- [Xie & Wu — Mini-Omni (arXiv:2408.16725)](https://arxiv.org/abs/2408.16725)
- [Défossez et al. — Moshi (arXiv:2410.00037)](https://arxiv.org/abs/2410.00037)
- [Zeng et al. — GLM-4-Voice (arXiv:2412.02612)](https://arxiv.org/abs/2412.02612)
