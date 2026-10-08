# Makine çevirisi

> Tercüme, NLP Araştırmaları için 30 yıllık bir görevdir ve şimdi de devam ediyor.

**Type:** Build
**Languages:** Python
**先修要求：**5 · 10 aşaması (Dikkat), 5 · 04 aşaması (GloVe, FastText, Subword)
**Time:** ~75 minutes

## 问题
Bir model 读取一种语言的句子,并生成另一种语言的句子──长度会变化──词序会变化──有些源语言词会映射到多个目标语言词,反之亦然──习语拒绝对一对一映射──英语里的"Seni özledim" 在法语里是"tu me manques"  字面意思是"you are missing me"──

Makine Tercümesi, NLP'yi kodlayıcı-dekodörler, dikkat, transformatörler üretmeye zorladı ve sonunda tüm LLM paradigması oluşturma görevini ilerletti.

Bu ders, 2026 yılının kullanılabilir boru hattını anlatıyor:Önce eğitilmiş çok dilli kodlayıcı-dekoder ((NLLB-200 veya mBART) ), alt sözcük tokenizasyonu、 ışın araması、BLEU 和 chrF değerlendirme, ve hala üretime giren birkaç başarısızlık modunun bulunmadığı görülüyor.

## 概念
![MT pipeline: tokenize → encode → decode with attention → detokenize](../assets/mt-pipeline.svg)

现代 MT is in parallel text 上训练的 Transformer encoder-decoder──encoder 读取按其语言代码化 处理后的源──decoder 通过横断注意(10 ders) kodlayıcı kullanmak, bir kez bir alt kelime oluşturmak──decoding, 束搜索, 避开贪心解码陷──output 会被 detokenized、detrucased,并与引用 评分对比──

Üç operasyonel seçenek gerçek dünyada MT kalitesini belirler.

- **Tokenizer.**SentencePiece BPE 在混合语言 corpus 上训练──跨语言 ortak kelimeforumu 正正是NLLB 能实现零射语言对的原因──
- **Model size.**NLLB-200 destilled 600M can can on laptop 上运行。NLLB-200 3.3B is published production default。54.5B is research ceiling。
- **Decoding.**Genel olarak, bu kısımlar, bir dizi metin ve bir dizi metinlerin birleştirilmesi için kullanılır.


```figure
seq2seq-alignment
```

## Yapın onu.
### 1 adım: Bir önceden eğitilmiş MT çağrı

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_id = "facebook/nllb-200-distilled-600M"
tok = AutoTokenizer.from_pretrained(model_id, src_lang="eng_Latn")
model = AutoModelForSeq2SeqLM.from_pretrained(model_id)

src = "The cats are running."
inputs = tok(src, return_tensors="pt")

out = model.generate(
    **inputs,
    forced_bos_token_id=tok.convert_tokens_to_ids("fra_Latn"),
    num_beams=5,
    length_penalty=1.0,
    max_new_tokens=64,
)
print(tok.batch_decode(out, skip_special_tokens=True)[0])
```

```text
Les chats courent.
```

Burada üç önemli şey var.`src_lang`告诉 tokenizer 应用哪种脚本和细分――`forced_bos_token_id`告诉 decoder 应生成哪种语言──两者都是NLLB-specific tricks;mBART 和 M2M-100 使用各自的约定,不能互换──

### 步骤 2: BLEU 和 chrF

BLEU  ölçüm çıkışı ile referans  arasındaki n-gram örtüşmeleri。 dört çeşit referans n-gram boyutları(1-4)、 hassaslıkların geometrik ortalaması, ayrıca kısa çıkışlara yönelik kısıtlılık cezası。分数范围是 [0, 100]。常用──解释起来令人30 BLEU "kullanılabilir";40 "iyi";50 "içerkin";1 BLEU'nun farkı gürültüye aittir。

HF  karakter seviyesindeki F puanını ölçmek.

```python
import sacrebleu

hypotheses = ["Les chats courent."]
references = [["Les chats courent."]]

bleu = sacrebleu.corpus_bleu(hypotheses, references)
chrf = sacrebleu.corpus_chrf(hypotheses, references)
print(f"BLEU: {bleu.score:.1f}  chrF: {chrf.score:.1f}")
```

始终使用 `sacrebleu`️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️        ️                                                                            

### Üç katı değerlendirme seviyesi (2026)

Modern MT değerlendirme kullanın Üç sınıflı birbirine karşılıklı metrik aileleri.

- **Heuristic**(BLEU, chrF)──快速、reference-based、可解释,但对抛词不敏感──用于遗产比较和回归检测──
- **Learned**(COMET, BLEURT, BERTScore) ◊ İnsan yargısı üzerine eğitimli sinirsel modeller; çeviri ile kaynak ve referansın semantik benzerliği karşılaştırmak ◊ 2023 yılından bu yana, COMET ile MT araştırmaları arasında en yüksek bağlantı var ve kalite konularında 2026 yılı üretim defaultı durumudur.
- **LLM-as-judge**(referanssız)  Özet: ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒  ⇒ ⇒      ⇒     ⇒                                                                                                                                                

实用2026 stack: 用 `sacrebleu`计算 BLEU 和 chrF,用 `unbabel-comet`計算 COMET,并用促したLLM 作为最终面向人类的信号──在信任任何指标 用生产数据之前,先用50-100 个人标签的例子 进行校准──

Referanssız ölçümler ((COMET-QE, BLEURT-QE, LLM-as-judge) Referanssız durumlarda tercüme değerlendirmenizi sağlar.

### Adım 3: Üretim nerede kötü olacak?

Yukarıdaki iş boruları %80'de başarısızlık halinde, %20'de başarısızlık halinde:

- **Hallucination.**Model 发明源 中不存在的内容──常见于不熟的域词汇──症状:output 很流,但声称源 没有陈述的事实──Mitigation:对域词 使用限制式解码,对受管制内容 使用人文审查,并监控输出 是否比输入 长很多──
- **Off-target generation.**Model 翻译成错误语言──NLLB  Rare language pairs 上尤其容易出现这个问题──Mitiation:验证 `forced_bos_token_id`,并始终使用语言-ID model kontrol 检查输出──
- **Terminology drift.**"Amanat" olarak "s'inscriire" olarak, "creer un compte" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "glosary-seri sınırlı dekode etmek veya "değil" olarak, "post-edit dictionary olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil" olarak, "değil, "değil, "değil" olarak, "değil, "değil, "değil" olarak, "değil, "değil" olarak, "değil" olarak, "değil, "değil, "değil, "değil" olarak, "değil" olarak, "değil, "de" olarak, "değil, "değil" olarak, "değil" olarak, "değil" olarak, "değ" olarak, "değ" olarak, "değ" olarak, "değ" olarak, "değ" olarak, "değ" olarak, "değ" olarak, "değ" olarak, "değ" olarak
- **Formality mismatch.**Fransızca "tu" vs "vous", Japonca edeplilik seviyeleri。model 会選訓練 中より常见的形式。 Müşteriye yönelik içerik için, bu genellikle yanlışlı¬dır。Mitigasyon: eğer model 支持, formalite token 作为即刻前सर्ग,或在正式的 corpora上细调 一个小型──
- **Length explosion on short input.**很短的输入句子 经常产生过长的翻译,因为在低于约5源代币时长度处罚 会突然失效──Mitigation:使用与源长 成比例的硬最大长度盖──

### 步骤 4: 为一个域   ince ayarlama yapın

Önceden eğitilmiş modeller genelistlerdir. Hukuki, tıbbi veya oyun-diyalog çevirisi, alan paralel verilerdeki ince ayarlamalardan açıkça yararlanır.

```python
from transformers import Trainer, TrainingArguments
from datasets import Dataset

pairs = [
    {"src": "The defendant pleaded guilty.", "tgt": "L'accusé a plaidé coupable."},
]

ds = Dataset.from_list(pairs)


def preprocess(ex):
    return tok(
        ex["src"],
        text_target=ex["tgt"],
        truncation=True,
        max_length=128,
        padding="max_length",
    )


ds = ds.map(preprocess, remove_columns=["src", "tgt"])

args = TrainingArguments(output_dir="out", per_device_train_batch_size=4, num_train_epochs=3, learning_rate=3e-5)
Trainer(model=model, args=args, train_dataset=ds).train()
```

几千个高质量平行例 胜过几十万个噪音的网页剪图例──训练数据质量是生产中最大的单一杆──

## Kullan
2026 yılı MT üretim aşaması:

| Use case | Recommended starting point |
|---------|---------------------------|
| Any-to-any, 200 languages | `facebook/nllb-200-distilled-600M`（laptop）或 `nllb-200-3.3B`（production） |
| English-centric, high quality, 50 languages | `facebook/mbart-large-50-many-to-many-mmt` |
| Short runs, cheap inference, English-French/German/Spanish | Helsinki-NLP / Marian models |
| Latency-critical browser-side | ONNX-quantized Marian（~50 MB） |
| Maximum quality, willing to pay | GPT-4 / Claude / Gemini with translation prompts |

截至2026年, LLM'ler birkaç dil çiftinde 上已经超过了专业 MT modelleri, özellikle idiomatik içeriği ve uzun bağlamda 上。取舍是每代币成本和延迟──当文脈长度、スタイリスト的一致性或通过促促实现域适应比吞吐量 更重要时,选择LLM──

## - Söyle.
保存为 `outputs/skill-mt-evaluator.md`- ...

```markdown
---
name: mt-evaluator
description: Evaluate a machine translation output for shipping.
version: 1.0.0
phase: 5
lesson: 11
tags: [nlp, translation, evaluation]
---

给定 source text 和 candidate translation，输出：

1. Automatic score estimate。你预期的 BLEU 和 chrF ranges。说明是否有 reference。
2. 五点 human-verifiable check list：(a) content preservation（无 hallucinations），(b) correct language，(c) register / formality match，(d) terminology consistency with glossary if provided，(e) 无 truncation 或 length explosion。
3. 一个需要探查的 domain-specific issue。例如 legal：named entities 和 statute citations。medical：drug names 和 dosages。UI：placeholder variables `{name}`。
4. Confidence flag。"Ship" / "Ship with review" / "Do not ship"。将它与 step 2 中发现的问题 severity 绑定。

如果 output 没有 language-ID check，拒绝 ship translation。除非 user 明确选择 reference-free scoring（COMET-QE, BLEURT-QE），否则拒绝在没有 reference 的情况下 evaluate。标记任何超过 1000 tokens 的内容，因为它很可能需要 chunked translation。
```

## 练习
1. **Easy.**Kullanım`nllb-200-distilled-600M`Bir 5 句英語段落翻译成法语,再翻译回英语──meğer dönüş-gezi orijinaline yakınlık derecesi──you should see semantic preservation, simultaneously accompanied by word-choice drift──
2. **Medium.**Kullanım`fasttext lid.176`Ya da`langdetect`Çevirme çıkışlarına 实现语言-ID check──将其集成到MT调中,让非目标世代在返回前被捕──
3. **Hard.**Seçtiğin 5.000 çift alanı korpusunu ince ayarlama `nllb-200-distilled-600M`◊Düzgün ayarlamalarda, BLEU  ölçümleri kullanın. Blanket hangi cümle türlerini  iyileştirdiğini, hangi geri dönüşü görüyorsa rapor edin.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| BLEU | Translation score | 带 brevity penalty 的 N-gram precision。[0, 100]。 |
| chrF | Character F-score | Character-level F-score。对形态丰富的语言更敏感。 |
| NMT | Neural MT | 在 parallel text 上训练的 Transformer encoder-decoder。2017+ default。 |
| NLLB | No Language Left Behind | Meta 的 200-language MT model family。 |
| Constrained decoding | Controlled output | 强制特定 tokens 或 n-grams 在 output 中出现 / 不出现。 |
| Hallucination | Invented content | source 不支持的 model output。 |

## 延伸阅读
- [Costa-jussà et al. (2022). No Language Left Behind: Scaling Human-Centered Machine Translation](https://arxiv.org/abs/2207.04672)NLLB kağıdı
- [Post (2018). A Call for Clarity in Reporting BLEU Scores](https://aclanthology.org/W18-6319/)Neden ?`sacrebleu`BLEU'nun raporlama için tek doğru yolu budur.
- [Popović (2015). chrF: character n-gram F-score for automatic MT evaluation](https://aclanthology.org/W15-3049/) chrF kağıdı
- [Hugging Face MT guide](https://huggingface.co/docs/transformers/tasks/translation) 实用 fine tuning walkthrough。
