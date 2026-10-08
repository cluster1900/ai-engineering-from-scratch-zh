# Konuşma-Sözleşme  Moshi、Hibiki ve Tam Dubleks Diyaloğu

> 2024-2026 yıllarında ses sesini yeniden tanımladı AI。Moshi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 13 (Neural Audio Codecs), Phase 6 · 11 (Real-Time Audio), Phase 7 · 05 (Full Transformer)
**Time:** ~75 分钟

## 问题

Her ders 11 + 12 üzerine kurulu bir ses ajansı, temel bir gecikme sınırına sahiptir, yaklaşık olarak 300-500 ms: VAD 触发, STT 处理, LLM 推理, TTS 生成── her aşamada kendi en az gecikme sınırları vardır── düzenleyebilir ve paralelleştirilebilir, ancak boru hattının şekli sınırları vardır──

Moshi ((Kyutai,2024-2026) farklı bir soru ortaya koydu: Eğer tüp hattı yoksa, nasıl olacak? Eğer bir model doğrudan ses alıyorsa ve ses çıkıyorsa, devam ederse, ve metin sadece bir orta iç monologu ise, gerekli aşama değilse, nasıl olacak?

Cevap:**full-duplex speech-to-speech**△ teorilerde 160 ms ⋅ 80 ms Mimi çerçeve + 80 ms akustik gecikme) ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅                                                                                                                                                                                

## 核心概念

![Moshi architecture: two parallel Mimi streams + inner-monologue text](../assets/moshi-hibiki.svg)

### Moshi mimarisi

**输入。**两条 Mimi kodek akışı, ortalama 12.5 Hz × 8 kod defterleri:

- Akım 1: kullanıcı音频(Mimi-kodlanmış,持续到达)
- Akım 2:Moshi 自己的音频(由 Moshi 生成)

**Transformer。**Bir 7B-parametre Zamanlı Transformer Aynı zamanda iki akışla işleme ve bir yazı inner monolog  akışı──

1. 消耗最新用户 Mimi Token ((8 个代码簿) ⋅
2. 消耗最近的Moshi Mimi Token(8 个代码簿,按生成结果) 』
3. 生成下一个 Moshi 文本 Token(dış monolog)
4. Bir küçük derinlik transformörü ile 8 kod defteri oluşturdum.

Üç条 akış: kullanıcı音频、Moshi 音频、Moshi 文本并行运行──Moshi konuşurken kullanıcıyı duyabilir; kullanıcı kesildiğinde kendini kesebilir; arka kanalı yürütebilir(mhm) kendini kesmeden ana sözleşmeyi──

**Depth Transformer。**Bir çerçeve içinde, 8 kod defteri, aynı zamanda tahmin edilmez, bunlar bir kod defterine bağımlıdır.

### İç monolog metni neden yardımcı olur ?

Eğer açık metin yoksa, model akustik akışta gizlenmiş bir yapıtaş dili olmalıdır. Moshi'nin anlayışı: ses kanalının yanında metin tokeni çıkarmasını zorlamak. Metin akışı aslında Moshi'nin söylediği kelimelerin dönüşümüdür. Bu da dil bağlamını artırır, dil model başını daha kolay değiştirir ve ücretsiz olarak size dönüşüm sonuçlarını verir.

### Hibiki:sözden konuşma çevirisini akışlandırma

Aynı yapı, kullanmak için tercüme eğitimi için, hedef dil sesleri için, hedef dil sesleri için, hedef dil sesleri için, hedef dil sesleri için, hedef dil sesleri için, hedef dil sesleri için, hedef dil sesleri için, hedef dil sesleri için, hedef dil sesleri için, hedef dil sesleri için, hedef dil sesleri için, hedef dil sesleri için, hedef dil diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedef diller için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler için, hedefler olarak, hedefler olarak, hedefler olarak, hedefler olarak, hedefler olarak, hedefler olarak, hedefler olarak, hedefler olarak, hedefler olarak, hedefler olarak, hedefler olarak, hedefler olarak, hedefler olarak, hedefler olarak, hedefler olarak, hedefler olarak, kullanılar, hedefler olarak, kullanılar, kullanılar, kullanılar, hedefler, hedefler olarak kullanılar, hedefler olarak kullanılar, hedefler olarak kullanılar, hedefler olarak kullanılar, kullanılarak,

İlk destek dört dil için; yaklaşık 1000 saatlik veri yeni dil için uyarlanabilir.

### Daha geniş Kyutai yığın(2026)

- **Moshi** tam ikili diyalog(法语优先,英语支持良好)
- **Hibiki / Hibiki-Zero** Aynı anda konuşma çevirisi
- **Kyutai STT** akış ASR ((500 ms veya 2.5 saniye önümüze bakmak)
- **Kyutai Pocket TTS** 100M-param TTS 可在CPU 上运行(2026年 1月)
- **Unmute** Bu yeteneklerin kamu hizmetlerinde toplanması için tam bir boru hattı

L40S GPU 上的吞吐量:64 个并发 sesi, 3× gerçek zamanlı

### Sesam CSM  近亲

Sesame CSM (şehir 2025) benzer bir düşünce yolu kullanmıştır, bir Llama-3 omurgası olan Mimi kodek başı ile. Ancak CSM, tam dupleks değil, tek yönlü bir durumdur.

### 2026 performans sayıları

| Model | Latency | Use case | License |
|-------|---------|----------|---------|
| Moshi | 200 ms (L4) | full-duplex English / French dialogue | CC-BY 4.0 |
| Hibiki | 12.5 Hz framerate | French ↔ English streaming translation | CC-BY 4.0 |
| Hibiki-Zero | same | 5 language-pairs, no aligned data | CC-BY 4.0 |
| Sesame CSM-1B | 200 ms TTFA | context-conditioned TTS | Apache-2.0 |
| GPT-4o Realtime | ~300 ms | closed, OpenAI API | commercial |
| Gemini 2.5 Live | ~350 ms | closed, Google API | commercial |


```figure
sp-fullduplex
```

## Yapın onu.

### 步骤1:birleştirme

Moshi, bir WebSocket sunucusu açığa çıkarıp 80 ms'lik Mimi kodlanmış ses parçasıyı alır ve 80 ms'lik Mimi kodlanmış ses parçasıyı geri gönderir.

```python
import asyncio
import websockets
from moshi.client_utils import encode_audio_mimi, decode_audio_mimi

async def moshi_chat():
    async with websockets.connect("ws://localhost:8998/api/chat") as ws:
        mic_task = asyncio.create_task(stream_mic_to(ws))
        spk_task = asyncio.create_task(stream_from_to_speaker(ws))
        await asyncio.gather(mic_task, spk_task)
```

### 步骤 2: Tam çiftlik döngüsü

```python
async def stream_mic_to(ws):
    async for chunk_80ms in mic_stream_at_12_5_hz():
        mimi_tokens = encode_audio_mimi(chunk_80ms)
        await ws.send(serialize(mimi_tokens))

async def stream_from_to_speaker(ws):
    async for msg in ws:
        mimi_tokens, text_token = deserialize(msg)
        audio = decode_audio_mimi(mimi_tokens)
        await play(audio)
```

双方向同时运行──Python asyncio 或 Rust futures is standard传输方式──

### 步骤 3:öğrenme amacı

 Her 80 ms çerçeve için `t`- ...

- Giriş:`user_mimi[0..t]`- Evet.`moshi_mimi[0..t-1]`- Evet.`moshi_text[0..t-1]`
- Önceden:`moshi_text[t]`Sonra da `moshi_mimi[t, codebook_0..7]`

文本先于音频预测(yüksek monolog);音频在深度变压器内按代码簿 顺序预测。

### Adım 4: Moshi 赢在哪里,输在哪里

Moshi 赢在:

- Bu, kolay bir şekilde 250 ms'den daha düşük bir süreye kadar gerçekleşecek.
- Doğal arka kanalı ve kesinti.
- Pipeline yapıştırıcı koduna gerek yok.

Moshi 不擅长:

- Bu eğitim için araç çağrısı yoktur.
- 长推理(Moshi bir 8B 左右 diyalog modeli, Claude/GPT-4) değil.
- Küçük bir konu üzerinde gerçek doğruluğu.
- %2026 yılında hala kullanılıyor)

## Kullan

| Situation | Pick |
|-----------|------|
| 最低延迟语音 companion | Moshi |
| 实时翻译通话 | Hibiki |
| 语音 demo / research | Moshi, CSM |
| 带 tools 的企业 agent | Pipeline (Lesson 12), not Moshi |
| context 中的 custom-voice TTS | Sesame CSM |
| Speech-to-speech，任意语言 | GPT-4o Realtime or Gemini 2.5 Live (commercial) |

## 陷

- **有限的 tool calling。**Moshi, bir iletişim modeli, bir ajan çerçevesidir.
- **特定声音 conditioning。**Moshi kullanıyor tek bir antrenman kişilik; ses klonlaması bir başka tek antrenman.
- **语言覆盖。**Fransızca + İngilizce çok iyi; diğer diller sınırlıdır. Hibiki-Zero yardımcı, ama hala eğitim verisi gerekir.
- **资源成本。**Bir tam Moshi oturum GPU yuvasını kaplayacak; ucuz olmayan ortak kiracı 部署 modu değil.

## - Söyle.

保存为 `outputs/skill-duplex-pipeline.md`◊ bir sesli ajan iş yükü için  seçin boru hattı veya tam çiftlik  yapı,并给出理由──

## 练习

1. **Easy。**运行  İşlem`code/main.py`◊ iki akımlı + iç monolog yapısı gibi bir simge şeklinde yapılır.
2. **Medium。**HuggingFace 拉取 Moshi,运行服务器,测试一次对话──测量 从用户话语结束到 Moshi 开始响应的墙钟延迟──
3. **Hard。**拿你的课 12管道代理,在20 条匹配测试演说 上与莫希比较P50延迟──写出管道──仍然在架构上取胜的情况──

## 关键术语

| Term | 人们常说的意思 | 实际含义 |
|------|-----------------|-----------------------|
| Full-duplex | 同时听和说 | 同一个模型上同时活跃两条 audio stream。 |
| Inner monologue | 模型的文本 stream | Moshi 在输出音频的同时发出文本 Token。 |
| Depth transformer | codebook 间预测器 | 在一个 80 ms frame 内预测 8 个 codebook 的小型 Transformer。 |
| Mimi | Kyutai 的 codec | 12.5 Hz × 8 codebooks；semantic+acoustic；驱动 Moshi。 |
| Streaming S2S | 实时 audio → audio | 逐块翻译/对话，没有 pipeline stage。 |
| Back-channeling | “Mhm” 反应 | Moshi 可以发出小的确认反馈，而不打断自己的 turn。 |

## 延伸阅读

- [Défossez et al. (2024). Moshi — speech-text foundation model](https://arxiv.org/html/2410.00037v2) 论文。
- [Kyutai Labs (2026). Hibiki-Zero](https://arxiv.org/abs/2602.12345) 无需对齐数据的流媒体翻译──
- [Sesame (2025). Crossing the uncanny valley of voice](https://www.sesame.com/research/crossing_the_uncanny_valley_of_voice) CSM spesifikasyonu
- [Kyutai — Moshi repo](https://github.com/kyutai-labs/moshi) 安装 + server。
- [OpenAI — Realtime API](https://platform.openai.com/docs/guides/realtime) 封闭商业同类。
- [Kyutai — Delayed Streams Modeling](https://github.com/kyutai-labs/delayed-streams-modeling) 底层 STT/TTS çerçevesinde
