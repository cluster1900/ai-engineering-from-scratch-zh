# MIO ve Herhangi Bir Akışla Çok Modal Modeller

> GPT-4o  teslim çoğu açık model 无法复现的产品:一个能实时听到语音、看视频并开口回应的代理── 2024 yılının sonuna kadar, açık ekosistemin yanıtı MIO(Wang et al., Eylül 2024)──MIO Tokenize 文本、图像、语音和音乐,交错序列 üzerinde bir sebepli dönüştürücü eğitmek,并能从任意模式生成任意模式──AnyGPT(Zhan et al., Şubat 2024) ‒ kavramın kanıtı;MIO ‒ skalatma;Unified-IO 2 ‒ Allen AI, Aralık 2023) ‒带有视觉+动作基近亲──本课阅读任何方式  四个 Tokenizer、一个 decode-friendly Transformer──

**Type:** Learn
**Languages:** Python (stdlib, four-modality token allocator + streaming decode loop)
**Prerequisites:** Phase 12 · 11 (Chameleon), Phase 6 (Speech and Audio)
**Time:** ~120 minutes

## Öğrenme hedefi
- Kendi bir kelime birikimi tasarlayın, metin, resim, ses ve müzik simgesi için kullanılır ve çatışmazlık olmayacaktır.
- Sıfırlama + ağırlıklı açılardan SEED-Tokenizer (Şekil) ve SpeechTokenizer (Sözleme)
- 解释构建任何生成能力的四阶段课程――
- Üç açık herhangi bir tarif ve onun ana değişikliği:MIO、AnyGPT、Unified-IO 2。

## 问题
Birleştirilmiş Multimodal model                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

工程挑战:

- Her modalite bir Tokenizer olmalı, yeniden inşa etmek için yeterince hasarsız bir şekilde sıkıştırılmalı ve Transformer'ın tüketimi hızıyla Token üretilmelidir.
- 单一词库 必须为文本(32k+) 图像(16k+) 语音(4k+) 音乐(8k+) 分享空间──最低也需要四万多条目──
- 训练数据必须覆盖每种输出输出对 (text→image、image→speech、speech→image等),或者模型必须能够组合──
- İndirme 必須足足足足快地 输出 Token,以满足对话延迟 ((<500ms time-to-first-audio-byte) ⋅

## 概念
### Dört çeşitlikten dört tane Tokenizer

MIO'nun Tokenizer Stak:

- Metin: standart BPE, sesli ~32000。
- Resim:SEED-Tokenizer (2023)  带离散代码簿 的量化 VAE,4096 条目,每张图像 32x32 个代码.
- Konuşma:SprechTokenizer residual-VQ (2023)  16kHz dalga biçimi 编码为 8 层级代码书;第一层是粗粒度内容,后续层加入 prosody 和扬声器身份──
- Müzik: benzer gibi kalıntılı-VQ(Meta'nın MusicGen / Encodec ailesi),4-8 个代码簿──

Her modalite tam sayıda Token üretir. Bu Tokenler ortak sözlükler arasında birbirinden üst üste olmayan kimlik aralıkları elde eder:

```
text:   0..31999
image:  32000..36095  (4096 image tokens)
speech: 36096..40191  (4096 speech base tokens, plus residual layers)
music:  40192..48383  (8192 music tokens)
sep:    48384..48390  (<image>, <speech>, <music>, </...>, etc.)
```

总计:约48k词汇――输入嵌入和输出投影 覆盖全部条目――

### Akışlı dekode

语音生成使用残留-VQ──Transformer 预测 base(layer 0) Konuşma Token; paralel olarak çözülmüş bir geri kalan kuantitör 预测后续层── her katman 0 Token 大约对应 16kHz 音频中的 50ms──

Akış 模式:

1. Kullanıcı için makron konuşma; gerçek zamanlı ses Tokenizer Her 50 ms  konuşma gönderme Token。
2. MIO 在 Token 到达时消费它们(快速预填 + 增进前)
3. Çıktı Token 随生成流式输出; paralel konuşma dekodörü 以约50-150ms 延迟将其转换为音频样本──
4. Zaman-birinci ses-bayt:MIO kağıdı Ortalama 300-500 ms, GPT-4o'nun yakınında 250 ms

Mini-Omni ((arXiv:2408.16725) 、GLM-4-Voice(arXiv:2412.02612) y Moshi(arXiv:2410.00037) birbirine ek akış konuşma-LLM tasarımlarıdır.

### Dört aşama kurikulum

MIO'nun eğitim programı:

1. Etap 1  uyumla­şmak── büyük ölçekli modalit-par korporasi: metin-resim、 metin-düşünme、 metin-müzik── her çift kendi Token kelimeforumu bölümünü kullanmak── eğitim paylaşım kelimeforumu──
2. Etap 2  birbirine karışmış, çok modalitelerle birbirine karışmış belgeler ((带图像 + 视频的博客、带抄录的播客等)                                                                                                                                                                                                                                           
3. Etap 3  konuşma geliştirilmiştir, konuşma kalitesini ve yazma kapasitesini artırmak için kullanılır.
4. 4. aşama SFT──跨 modality 的指示调整:VQA、captioning、narration、speech-to-speech dialogue──

缺少某阶段会削弱特定能力:跳过阶段 2,模型会失去跨模式背景;跳过阶段 3,语音会很差──

### Görsel düşünce zinciri

MIO 引入-chain-of-visual-thought:模型发出中间图像 Token 作为推理步骤──对于 " kedi bir ağaca tırmanıyor mu?",模型会:

1. 发发发 `<image>`Token 来染场景 (输入图像或草图) ⋅
2. 发出文本分析该草图──
3. Son Cevap:

染出的中部图像作为 scratchpad──在空间推理任务上,benchmarks 有提升──这个想法类似文本推理中的链思维──

### Herhangi bir rakip

- Herhangi birGPT(arXiv:2402.12226): 4 种方式(text、image、speech、music),design相似──
- Birleştirilmiş-IO 2 ((arXiv:2312.17172): görme eyleminin çıkışlarını arttırmak, derinlik, normallik, görev daha yüksek, büyüklüğü daha küçük.
- NExT-GPT(arXiv:2309.05519):LLM + modalite-specifik difüzyon dekodörleri── tek model olmayan 方法──
- CoDi(arXiv:2305.11846):Yarıtılabilir yayılma; ortak gizli 实现 any-to-any¬

MIO en yakın saf-töken herhangi biri-e-kimsi.

### Gecikme bütçesi

Bir konuşma ürünü için, her bileşenin gecikmesi önemlidir:

- Mikrofonlara ses simgesi: ~50 ms。
- Ön doldurun(audio Token + tarih):8B modeli 上 ~100ms。
- İlk çıkış simgesi: ~50ms
- Paralel kalan-VQ + konuşma dekodörü: ~ 100-150 ms。

总时间到第一音频字节:最低约 ~300ms──GPT-4o 声称 ~250ms──Moshi 声称 160ms──根据公开基准,MIO/AnyGPT 位于400-600ms 范围──

### Neden herhangi bir  hala zor

Hatta 2026 yılında, herhangi bir model açmak iki aksanın üzerinde hala kapalı olanlara geride kalıyor:

- 语音质量──residual-VQ Tokenizer is有损的; ElevenLabs sınıfı sesleriyle karşılaştırıldığında, dialog语音听起来更机械──
- Çarpışıklıklı düşünce, gördüğünüz şeyi "söylemeyi" daha kolay başarısızlığa uğratır.

Bunlar açık araştırma sorunlarıdır. Qwen3-Omni (Düşünme 12.20) 2025 yılının en gelişmiş açık girişimidir.


```figure
any-to-any-stream
```

## Kullan
`code/main.py`- ...

- Dört modalite kelime dağarcığını tanımlayın, onu yazın.
- Bir çok modal giriş listesi (tesk, görüntü, sesli klip, müzik) Tokenizer yönlendiricisi yoluyla 路由。
- 模拟文字-to-speech tepkisi 模拟文字-to-speech response 模拟文字-to-speech response 模拟文字-to-speech response 模拟文字-to-speech response 模拟文字-to-speech response 模拟-to-speech-to-speech-to-speech-to-speech-to-speech-to-speech-to-speech-to-speech-to-speech-to-speech-to-speech-speech-to-speech-to-speech-speech-to-speech-to-speech-to-speech-to-speech-to-speech-to-speech-to-speech-to-speech-speech-to-speech-to-speed-speed-to-speed-to-speed-speed-to-speed-to-speed-speed-to-speed-to-speed-speed-to-speed-speed-to-speed-to-speed-speed-speed-to-speed-speed-speed-speed-to-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed-speed
- Gösterilen kodlama, önceden doldurma ve dekodlama gecikmelerinde hesaplama beklenen zaman-den-birinci ses-baytı-

## - Söyle.
本课产 出 `outputs/skill-any-to-any-pipeline-auditor.md` Konuşma ürün spesifikasyonu belirlemek,  modaliteler belirlemek,  gecikme hedefi belirlemek,  MIO-aile tasarım seçimlerini denetlemek ve  gecikme bütçesini hesaplamak.

## 练习
1. Ürünleriniz konuşma girişini kabul eder ve konuşma çıkışını geri gönderir.

2. SpeechTokenizer residual-VQ kullanmak 8 kod defteri, paralel dekode residual seviyelerinin neden gerekli olduğunu, ayrıca neyi getiren gecikme tasarrufu olduğunu açıklıyor.

3. Sözcükleriniz 32k metin + 4k görüntü + 4k konuşma 👍 8k müzik ve yaklaşık 10 ayırıcı 👍 gizli dim 4096 时,Embedding Matrix'in parametreler maliyeti ne kadar?

4. Görsel düşünce zinciri, bir görüntü oluşturur. Hangi tür sorunlar yararlanır?

5. 阅读 Moshi(arXiv:2410.00037)。 onun "dahili monologunu" tanımlamak 技术,并与MIO'nun görsel düşünce zinciri

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Any-to-any | "Multimodal in/out" | 一个单一模型，能够在任意方向接受并发出 text、image、speech 和 music |
| Residual-VQ | "Speech tokenizer stack" | Multi-codebook Tokenization，每一层都添加信息；base layer 是内容，后续层是 prosody |
| SEED-Tokenizer | "Image codes" | MIO 使用的离散 image Tokenizer，带 4096-entry codebook |
| Chain-of-visual-thought | "Visual scratchpad" | 模型在最终答案前生成一张中间图像作为 reasoning step |
| Time-to-first-audio-byte | "TTFAB" | 从用户语音到第一个 audio output 的延迟；<500ms 才有对话感 |
| Four-stage curriculum | "Training recipe" | Alignment -> interleaved -> speech-enhanced -> SFT，按此顺序 |

## 延伸阅读
- [Wang et al. — MIO (arXiv:2409.17692)](https://arxiv.org/abs/2409.17692)
- [Zhan et al. — AnyGPT (arXiv:2402.12226)](https://arxiv.org/abs/2402.12226)
- [Lu et al. — Unified-IO 2 (arXiv:2312.17172)](https://arxiv.org/abs/2312.17172)
- [Wu et al. — NExT-GPT (arXiv:2309.05519)](https://arxiv.org/abs/2309.05519)
- [Tang et al. — CoDi (arXiv:2305.11846)](https://arxiv.org/abs/2305.11846)
