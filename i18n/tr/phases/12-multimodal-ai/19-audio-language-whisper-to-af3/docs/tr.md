# Sesli Dil Modeller: Whisper'den Audio Flamingo 3'ün gelişimine

> Whisper(Radford 等,2022 yıl 12 月) 让语音识别尘埃落定:68万小时弱监督多语言语音、一个简单的编码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码

**类型：**Yapım
**语言：**Python (stdlib, log-Mel spektrogram + ses Q-eski skelet)
**前置要求：**6. aşama (Söz ve Ses), 12. aşama · 03 (Q-Former)
**时间：**180 dakika kadar .

## Öğrenme hedefi
- Dalga şekli  hesaplama log-Mel spektrogramı: pencereler FFT  filtreler bankaları  log transform¬¬¬
- Bireyin: Şapışkan Şapışkan, BEAT'lar, AF-Şapışkın hibridleri, kendi başlarına nasıl kazanıldıklarını anlamak
- 构建 audio Q-former:让 N 个可学习 queries对光谱补丁做交叉出席──
- 解释 cascaded(Whisper-then-LLM) vs. end-to-end audio-LLM 训练:为什么端到更适合扩展到推理能力──

## 问题
语音识别已被 Whisper 解决──音频的 OCR 已商品化──但商品化止步于转写──如果模型不能推理它听到的内容:时间点、说话者、情绪、音乐结构、环境声音,那么仅靠转写无法支产品功能──

Üç条 açık yolu:

1. Cascade:Whisper 转写,LLM için transkript 推理。

2. Sonundan sonuna kadar ses-LLM: ses kodlayıcı 直接输入 LLM,跳过转写──保留声学信息(情绪、说话者、环境) ・ yeni eğitim verilerine ihtiyaç vardır。

3. Hibrit: ses kodlayıcı + metin dekodörü,既能转写也能推理──Qwen-Audio 和 Audio Flamingo 选择这条路线──

## 概念
### Log-Mel spektrogramı:输入特征

Her ses kodlayıcı aynı özellikten başlıyor: log-mail spektrogramı.

1. 16 kHz'e kadar yeniden örneklenir.
2. 25 ms penceresi kullanın 10 ms atlayın kısa Fourier dönüşümü yapın.
3. 取 FFT 结果的大小──
4. 应用 Mel filter banks (genellikle 80 个在 0-8000 Hz 上按 log 间隔分布的过器), 映射到感知频率──
5. Uzal log kompresı(log(1 + x)) dinamik aralığı işleme

结果:形状为 (T, 80) 2D dizi, T ise zaman çerçeveleri 数量──对 100 Hz çerçeve hızının 30 saniye klip:形状为 (3000, 80)──

### Şapşırın kodlayıcı

Whisper'ın kodlayıcısı, 12 katmanlı ViT tarzı Transformer, 序列处理──输出: her zaman çerçevesinde gizli devlet vektörü olacaktır.

对于 ASR,Whisper 的解码器是一个跨注意变压器,它在编码输出条件下生成文字代码――标准编码器-解码器――

对于ALMs(audio-LLMs),你希望把编码输出 作为输入交给另一个LLM──模式是:Hisper encoder frozen,Q-former trainable,LLM frozen or tuned──

### BEATs 和音频 özel kodlayıcılar

Sıfırlama, sesli olarak kullanılır.

BEATs(Chen 等,2022) bir AudioSet üzerinde eğitimli bir kendi kendine denetim Transformer.

AF-Whisper(Audio Flamingo 3'ün hibrid):将 Whisper + BEATs özellikleri concat 作为音频输入──Whisper 携带语言信号,BEATs 携带声学信号──

### Sesli Q-former

BLIP-2'nin görsel Q-eski 模式 aynıdır. Sıkı sayıda öğrenme sorusu vardır.

訓練对齐阶段:只训练 Q-former,在音频文档对中(AudioCaps、Clotho) 上使用对比 +字幕损失──Instruction 阶段:end-to-end,unfreeze LLM,在教学数据上训──

### Bu gelişme yolu: SALMONN, Qwen-Audio, AF3

SALMONN(Tang 等,2023):Susper + BEATs + Q-former + LLaMA。第一个具有严推理能力的开放音频-LLM──MMAU 基准 上复合约0.55──

Qwen-Audio(Chu 等,2023):架构类似,训练数据集更丰富,针对多轮对话 调优――MMAU 约0.60──

LTU  Dinle, Düşün, Anla ((Gong 等,2023): açıkça mantık verileri, konukseverlik ses sesli klip 上的链-of-thought──规模更小但更聚焦──

Audio Flamingo 3(Goel 等,2025 yıl 7 月):当前 open SOTA──8B LLM backbone(Qwen2 7B)、Whisper-big encoder concat BEATs、64-query Q-former,在100万+ sesli metin talimat çiftlerinde 上练──MMAU 0.72,在部分子任务上匹配专属边界──

AF3 ayrıca son cevapta düşünce belirtilerini çıkarabilecek bir düşünce zinciri de içeriyor:

### Kaskadör vs. uçtan sonuna

Su içi boru hattı:

1. Şapşırıp yazacağım.
2. LLM için metin önerisi

Bu podcast çok etkili. Aşağıdaki durumlar için başarısız olacağız:
- Bu şarkı ne duygu?
- Kim konuşuyor, Alice Bob mı?
- Bir kaç saniye içinde patlama oldu.
- Bu gerçek ses mi yoksa ses üretimi mi?Depfake algısı 需要声学特征──

Sonundan sona kadar 保留声学信号──Qwen-Audio 和 AF3 能原生处理音乐、环境和情绪──

### 2026 üretim tarifi

对于新音频理解产品:

- Eğer: hedef ise, şarkı yok, duygu yok.
- AF3 / Qwen-Audio-family if:音乐、情绪、多说话人,或复杂音频推理──

Daha kolay, daha basit. Sonundan sonuna kadar.

### MMAU:音频推理 referans değer

MMAU ((Massive Multimodal Audio Understanding) is 2024-2025 音频推理 基准:

- 10.000 个跨语音、音乐、环境声音的音频-text QA çiftleri
- 覆盖分類、時的な推理、因果推理、open-ended QA──
- 测试 kaskadör boru hattı 系统性遗漏的能力──

Açık SOTA(AF3) 0.72; mülkiyet sınırı 约 0.78(Gemini 2.5 Pro、Claude Opus 4.7) ・・・


```figure
audio-text-ctc
```

## Kullan
`code/main.py`- ...

- Kullanımlı bir program için log-Mel spektrogramı gerçekleştirmek için kullanın.
- Audio Q-eski skelet:给定 encoder output frames,计算 Q、K、V、attention,并输出 N 个代币──
- Bir oyuncak görevi üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üst

## - Söyle.
本课会产 出 `outputs/skill-audio-llm-pipeline-picker.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                              

## 练习
1. 16kHz 25ms penceresi için 10ms hop 80 Mel binlerinin 30 saniyelik klipini hesaplayın log-Mel spektrogramı 维度── 48kHz altında nasıl değişir?

2. Neden Şapışkırık müzikte daha zayıf performans gösterir?

3. 64 sorgu vs 32 sorgu of Audio Q-former: 64  değerli? 32 Hangi görevleri tasarruf hesaplama?

4. AF3 Bölümü 4  On-demand düşünce içeriği hakkında.

5. AF3'ün çıkışını en az günlükleştirme borusunu gerçekleştirmek için kullanın.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Log-Mel spectrogram | “Mel features” | 经过 Mel filter banks 后得到的 log-magnitude values 的 2D（time, frequency）array |
| Audio Q-former | “Audio Perceiver” | 从 audio encoder output 到 fixed-length queries 的 cross-attention bottleneck，供给 LLM |
| Cascaded | “ASR-then-LLM” | Whisper 转写后由 text LLM 推理的 pipeline；会丢失声学信息 |
| End-to-end | “Audio-LLM” | 音频特征通过 Q-former 直接进入 LLM；保留声学信号 |
| BEATs | “Audio AudioSet encoder” | 在 AudioSet 上训练的 SSL Transformer；擅长音乐 + 环境声音 |
| MMAU | “Audio reasoning bench” | 跨语音、音乐、环境的 10k QA pairs；2024 eval standard |
| On-demand thinking | “Audio CoT” | 模型可以在最终答案前可选地输出 reasoning tokens，将准确率提升 3-5 pts |

## 延伸阅读
- [Radford et al. — Whisper (arXiv:2212.04356)](https://arxiv.org/abs/2212.04356)
- [Chu et al. — Qwen-Audio (arXiv:2311.07919)](https://arxiv.org/abs/2311.07919)
- [Goel et al. — Audio Flamingo 3 (arXiv:2507.08128)](https://arxiv.org/abs/2507.08128)
- [Tang et al. — SALMONN (arXiv:2310.13289)](https://arxiv.org/abs/2310.13289)
- [Gong et al. — LTU (arXiv:2305.10790)](https://arxiv.org/abs/2305.10790)
