# T5, BART  Kodlayıcı-Küçükleme Modelleri

> Kodlayıcı  sorumlu anlamak. Dekoder  sorumlu üretmek. Onları yeniden bir araya getirmek, bir giriş için özel bir model elde etmek.

**Type:** Learn
**Languages:** Python
**先修要求:**7. · 05 aşaması (Tüm Transformer), 7. · 06 aşaması (BERT), 7. · 07 aşaması (GPT)
**Time:** ~45 minutes

## 问题

Sadece dekodör GPT ve sadece kodlayıcı BERT, 2017 yılının yapılarına farklı hedefler koymak için bir çok basitleştirme yapıldı.

- Çevirim: İngilizce → Fransızca.
- Toplam: 5.000-Token 文章 → 200-Token 摘要──
- Konuşma tanımı: 音频 Token → 文本 Token。
- 结构化抽取: 散文 → JSON。

Bu görevler için, kodlayıcı-dekodör en uygun biçimdir. Kodlayıcı, içeriğin yoğunluk göstergesini oluşturur.

两篇论文定义了现代做法:

1. **T5**"Text-to-Text Transfer Transformer". her bir NLP görevini tekrar metin-in, metin-out olarak ifade edecek.
2. **BART**(Lewis et al. 2019). "Bidirectional and Auto-Regressive Transformer. " 去噪 无声自动编码器:以多种方式破坏输入(shuffle、mask、delete、rotate),让解码器重建原始内容──

2026 yılına kadar, kodlayıcı-dekoder biçimi hala giriş yapısında önemli bir yerlerde var:

- Şapşır (söz → metin).
- Google'ın tercüme tekniği
- Bazıları belirgin bağlam ve düzenleme 结构的代码-completation / repair 模型──
- Yapılandırılmış düşünce kullanılarak  görevlerin Flan-T5  ve onun değişikleri

Sadece dekodörler 聚光灯 kazanmış, ama kodlayıcı dekodörler ortadan kaybolmamıştı.

## 概念

![Encoder-decoder with cross-attention](../assets/encoder-decoder.svg)

### Ön döngü

```
source tokens ─▶ encoder ─▶ (N_src, d_model)  ──┐
                                                 │
target tokens ─▶ decoder block                   │
                 ├─▶ masked self-attention       │
                 ├─▶ cross-attention ◀───────────┘
                 └─▶ FFN
                ↓
              next-token logits
```

关键, her giriş için kodlayıcı sadece bir kez çalışır. Dekoder bir otomatik olarak çalışır, ancak her adım aynı kodlamaya karşı katılır.

### T5 预训练  yolsuzluk

随机选择输入中的 span(平均长度 3 个 Token,总计 15%) ―― her zaman yerine tek bir sentinel kullanın:`<extra_id_0>`- Evet.`<extra_id_1>`Decooder sadece çıkışın bozulduğu zamanın içinde, ve yanındaki sentinel üzerinde:

```
source: The quick <extra_id_0> fox jumps <extra_id_1> dog
target: <extra_id_0> brown <extra_id_1> over the lazy
```

T5 makalesinin ablasyonunda, MLM (BERT) ve prefiks-LM (UniLM) ile rekabet gücüne sahiptir.

### BART 预训练  Çok gürültülü denoizing

BART 尝试了五种噪音功能:

1. İşaret maskeli.
2. İşaret silinmesi.
3. Metin doldurma maskası, dekodör, içeriği tam olarak yerleştirmek.
4. Cevabı değiştirmek.
5. Belge dönüşümü.

Metin doldurma + cümle permutasyonu kombinasyonu en iyi aşağı游 sonuçları üretti. Dekodör 始终重建原始内容──BART'ın çıkışı sadece yıkılmış bir süre değil, tam bir dizi olarak oluştu.

### 推理

GPT ile aynı olan autoregressive generation──greedy / beam / top-p sampling 都适用──beam search(宽度 45) is the standard practice of translation and abstract, because output distribution比 chat 更狭──

### 2026 yıl hangi zaman her değişimi seçeceksin

| Task | Encoder-decoder? | Why |
|------|------------------|-----|
| Translation | 是，通常如此 | 明确的源序列；固定的输出分布；beam search 有效 |
| Speech-to-text | 是 (Whisper) | 输入 modality 与输出不同；encoder 塑造音频特征 |
| Chat / reasoning | 否，decoder-only | 没有持久的“input”——对话本身就是序列 |
| Code completion | 通常否 | decoder-only 搭配长上下文更强；像 Qwen 2.5 Coder 这样的代码模型是 decoder-only |
| Summarization | 两者皆可 | BART、PEGASUS 超过了早期 decoder-only baseline；现代 decoder-only LLMs 已经能与它们匹配 |
| Structured extraction | 两者皆可 | T5 很干净，因为“text → text”可以吸收任何输出格式 |

2022 yılından bu yana tendensi: sadece dekodörler tarafından yönetilen görevler geçti. Çünkü (a) talimat ayarlı sadece dekodörler tarafından yönetilen LLM'ler herhangi bir görev için genel hale getirilebilir, (b) tek bir yapı iki yapıdan daha kolay genişletilmektedir, (c) RLHF  decoder kullanmayı varsayıyor.


```figure
encoder-decoder
```

## Yapın onu.

Görüyorum .`code/main.py`Bu ders için en faydalı tek bölümdür çünkü hemen hemen her kodlayıcı-dekoder hazırlık süslemesinde ortaya çıkmıştır.

### 步骤 1: süresi yolsuzluk

```python
def corrupt_spans(tokens, mask_rate=0.15, mean_span=3.0, rng=None):
    """Pick spans summing to ~mask_rate of tokens. Return (corrupted_input, target)."""
    n = len(tokens)
    n_mask = max(1, int(n * mask_rate))
    n_spans = max(1, int(round(n_mask / mean_span)))
    ...
```

hedef 格式遵循 T5 约定:`<sent0> span0 <sent1> span1 ...`◊ bozuk giriş 会把未改变的Token 与 span 位置上的 sentinel Token 交错排列──

### 步骤 2: dönüş yolculuğu doğrulama

给定腐败输入 和目标,重建原始句子──如果你的腐败是可逆的,那么前进通过就是良定义的──这是一个智力检查真实训练从不这样做,但这个测试成本很低,并且能够捕捉跨度会计管理中的偏差──

### 步骤 3: BART gürültüsü

五个函数:`token_mask`- Evet.`token_delete`- Evet.`text_infill`- Evet.`sentence_permute`- Evet.`document_rotate`◊ 组合其中2并显示结果──

## Kullan

Öğütleme Yüzü 参考:

```python
from transformers import T5ForConditionalGeneration, T5Tokenizer
tok = T5Tokenizer.from_pretrained("google/flan-t5-base")
model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-base")

inputs = tok("translate English to French: Attention is all you need.", return_tensors="pt")
out = model.generate(**inputs, max_new_tokens=32)
print(tok.decode(out[0], skip_special_tokens=True))
```

T5'in teknikleri: görev adı giriş metinde girer. Aynı model onlarca görev ele alabilir. Çünkü her görev metin içe, metin dışa çıkıyor. 2026 yılına kadar, bu model talimat ayarlı dekodör-tek 模型泛化 olmuştu, ancak T5 önce bunu düzenleyecek.

## - Söyle.

Görüyorum .`outputs/skill-seq2seq-picker.md`◊ Bu beceri, giriş-çıxım struktur、延迟和质量目標'e göre, yeni bir görev için kodlayıcı-dekoder ve sadece dekoder arasında seçim yapmaktadır.

## 练习

1. **Easy.**运行  İşlem`code/main.py`, 30 Token 句子 uygulama uzadı yolsuzluğu için,验证将非哨兵源代币与解码目标跨度 拼接后可以复现原始句子──
2. **Medium.**BART'i gerçekleştirmek`text_infill`Şiddetli gürültü:`<mask>`Token  değiştirmek  dekoder  doğru                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
3. **Hard.**Bir çok küçük İngilizce → Domuz-Latin corpus(200 对)`flan-t5-small`△ 50 çiftli bir dizi üzerinde ölçüm BLEU。`Llama-3.2-1B`Sonuçları karşılaştırmak için.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Encoder-decoder | “Seq2seq transformer” | 两个 stack：用于输入的 bidirectional encoder，以及带 cross-attention、用于输出的 causal decoder。 |
| Cross-attention | “源内容与目标内容对话的地方” | decoder 的 Q × encoder 的 K/V。这是 encoder 信息进入 decoder 的唯一位置。 |
| Span corruption | “T5 的预训练技巧” | 用 sentinel Token 替换随机 span；decoder 输出这些 span。 |
| Denoising objective | “BART 的游戏” | 对输入应用 noise function，训练 decoder 重建 clean sequence。 |
| Sentinel token | “`<extra_id_N>` 占位符” | 特殊 Token，用于在 source 中标记被破坏的 span，并在 target 中重新标记它们。 |
| Flan | “Instruction-tuned T5” | 在超过 1,800 个任务上 fine-tuned 的 T5；让 encoder-decoder 在 instruction-following 上具备竞争力。 |
| Beam search | “Decoding strategy” | 在每一步保留 top-k 个 partial sequence；是翻译/摘要的标准做法。 |
| Teacher forcing | “Training-time input” | 训练期间，把真实的前一个输出 Token 喂给 decoder，而不是采样出来的 Token。 |

## 延伸阅读

- [Raffel et al. (2019). Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer](https://arxiv.org/abs/1910.10683)T5
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training for Natural Language Generation, Translation, and Comprehension](https://arxiv.org/abs/1910.13461)- BART.
- [Chung et al. (2022). Scaling Instruction-Finetuned Language Models](https://arxiv.org/abs/2210.11416) Flan-T5──
- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) Whisper,2026 yılının kanonik kodlayıcı-dekoderleri。
- [HuggingFace `modeling_t5.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/t5/modeling_t5.py) 参考实现。
