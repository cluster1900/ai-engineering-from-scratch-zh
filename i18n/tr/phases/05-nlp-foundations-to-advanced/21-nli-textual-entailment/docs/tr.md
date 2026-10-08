# Doğal dil  文本含

> "t içerir h" anlamı, t 后会得出 h 为真论――NLI ise öngörüleme içerir / çelişki / tarafsız görev── yüzeysel olarak kurum, ancak üretim sırasında önemli bir rol oynar──

**类型：**Öğrenme
**语言：**Python
**先修：**5 · 05 aşaması (duygu analizi), 5 · 13 aşaması (sorulara cevap vermek)
**时间：**~ 60 dakika

## 问题

Bir özet oluşturduğunuzu biliyorsunuz. Bu özetin halüsinasyon içermediğini nasıl biliyorsunuz?

Bir chatbot oluşturdun. "Evet" cevabını verdi.

Konuya göre 10 bin haber makalesi yazmalısın.

Bu üç sorun doğal dil çıkarımına çevrilebilir.`t`Bir hipotez var.`h`- Evet .`h`Evet .`t`Ne olursa olsun, bu bir anlaşmazlık mıdır?

- **Hallucination check:** `t`= kaynak belge,`h`= özetli iddia¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- **Grounded QA:** `t`= alınmış geçiş,`h`= oluşturulan cevap değil, sonuç = uydurma
- **Zero-shot classification:** `t`= belge,`h`= sözlü etiket ("Bu sporla ilgili")。İçinde = öngörülen etiket。

Bir görev, üç üretim amacı. Bu yüzden her RAG değerlendirme çerçevesinin alt kattaki bir NLI modeli vardır.

## 概念

![NLI: three-way classification, premise vs hypothesis](../assets/nli.svg)

**三个 labels。**

- **Entailment.** `t`→ `h`"Kedi çarşafta" demek "Bir kedi var".
- **Contradiction.** `t`→`h`"Kedi çarşafta" "Kedi yok" ile çelişmektedir.
- **Neutral.**"Kedi çarşafta" "Kedi aç" için tarafsız.

**不是逻辑 entailment。**NLI, *doğal* dil sonucu, yani tipik insan okuyucucucucucucuğun sonucu olarak, sert bir mantık yerine, sert bir mantık olarak, "John dog walked" olarak adlandırılır.

**Datasets。**

- **SNLI**(2015)──570k 人工标注 作为前提──领域较窄──
- **MultiNLI**(2017)──跨 10 个类的 433k çift──2026 年的标准培训 corpus──
- **ANLI**(2019) ――Adversarial NLI──人类专门编写用于击穿现有模型的例子──更难──
- **DocNLI, ConTRoL**(202021) ――Dokument uzunluğu premises──测试 multi-hop 和 uzun menzilli sonuçlar──

**架构。**Bir Transformer Kodlayıcı ((BERT, RoBERTA, DeBERTA) 读取`[CLS] premise [SEP] hypothesis [SEP]`- Evet.`[CLS]`temsil 输入到3way softmax──在 MNLI 上训练,在持久的基准上评估,在在分发对上获得90%+精度──

**通过 NLI 做 zero-shot。**给定一个文件 和候选标签,把每个标签 转成一个假设("Bu metin spor hakkında")`zero-shot-classification`boru hattının arkasındaki mekanizmalar:


```figure
nli-router
```

## Yapın onu.

### 步骤 1: 运行一个预训练的NLI modeli

```python
from transformers import pipeline

nli = pipeline("text-classification",
               model="facebook/bart-large-mnli",
               top_k=None)  # return all labels; replaces deprecated return_all_scores=True

premise = "The cat is sleeping on the couch."
hypothesis = "There is a cat in the room."

result = nli({"text": premise, "text_pair": hypothesis})[0]
print(result)
# [{'label': 'entailment', 'score': 0.97},
#  {'label': 'neutral', 'score': 0.02},
#  {'label': 'contradiction', 'score': 0.01}]
```

Production Class NLI için,`facebook/bart-large-mnli`和 `microsoft/deberta-v3-large-mnli`Bu, bir çok farklı yönlerden yapılmıştı.

### 步骤 2: sıfır çekim sınıflandırma

```python
zs = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

text = "The stock market rallied after the central bank cut interest rates."
labels = ["finance", "sports", "politics", "technology"]

result = zs(text, candidate_labels=labels)
print(result)
# {'labels': ['finance', 'politics', 'technology', 'sports'],
#  'scores': [0.92, 0.05, 0.02, 0.01]}
```

默认 şablon is "Bu örnek {etiket}."―可用`hypothesis_template`Özdefini──不需要培训数据──不需要细调──开箱即用──

### 步骤 3: RAG'in sadakat kontrolü

```python
def is_faithful(answer, context, threshold=0.5):
    result = nli({"text": context, "text_pair": answer})[0]
    entail = next(s for s in result if s["label"] == "entailment")
    return entail["score"] > threshold
```

Bu RAGAS sadakatinin çekirdeği, ̋ oluşturulan yanıt ̋ atom iddialarına ayrılmış ̋, her iddia, alınan bağlamla göre ̋ raporların sonuçları oranında ̋.

### 步骤 4: 手写 NLI sınıflandırıcısı(概念版)

- Bakın .`code/main.py`Orta sadece stdlib oyuncağı kullanmak:premise 和 hipotezi  lexical overlap + negation detection  conduct comparison──it cannot with Transformer models 竞争, but demonstrated the shape of the task:输入两段文本,输出 3-way label, loss = `{entail, contradict, neutral}`Yukarıdaki çapraz entropi.

## 陷

- **Hypothesis-only shortcuts.**Modeller sadece hipotezi görüyor, SNLI'de yaklaşık %60'lık bir doğruluk oranı ile tahmin etiği, çünkü "hayır""",hakik""",hiçbir zaman" çelişki ile ilişkili.
- **Lexical overlap heuristic.**Sonraki heuristik (( her sonrakı                                                                                                                                                                                                                                                          
- **Document-length degradation.**Tek cümle NLI modelleri, belgeler uzunluğunda bir bölgede 上会下降 20+ F1──长上下文应使用 DocNLI eğitimli modeller──
- **Zero-shot template sensitivity.**"Bu örnek {etiket}"、"{etiket}"、"Teması {etiket}" 之间可能导致精度 波动 10+ point──需要调优模板──
- **Domain mismatch.**MNLI'nin genel İngilizce eğitiminde.

## Kullan

2026 yığın:

| Use case | Model |
|---------|-------|
| 通用 NLI | `microsoft/deberta-v3-large-mnli` |
| 快速 / edge | `cross-encoder/nli-deberta-v3-base` |
| Zero-shot classification（轻量） | `facebook/bart-large-mnli` |
| Document-level NLI | `MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli` |
| Multilingual | `MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli` |
| RAG 中的 hallucination detection | RAGAS / DeepEval 内部的 NLI layer |

2026 yılının meta-pattern: NLI is literally understanding of万能── As long as you need to judge A is supporting B? or A is contradicting B?                                                                                                                                                                                                                                       

## - Söyle.

保存为 `outputs/skill-nli-picker.md`- ...

```markdown
---
name: nli-picker
description: Pick an NLI model, label template, and evaluation setup for a classification / faithfulness / zero-shot task.
version: 1.0.0
phase: 5
lesson: 21
tags: [nlp, nli, zero-shot]
---

Given a use case (faithfulness check, zero-shot classification, document-level inference), output:

1. Model. Named NLI checkpoint. Reason tied to domain, length, language.
2. Template (if zero-shot). Verbalization pattern. Example.
3. Threshold. Entailment cutoff for the decision rule. Reason based on calibration.
4. Evaluation. Accuracy on held-out labeled set, hypothesis-only baseline, adversarial subset.

Refuse to ship zero-shot classification without a 100-example labeled sanity check. Refuse to use a sentence-level NLI model on document-length premises. Flag any claim that NLI solves hallucination — it reduces it; it does not eliminate it.
```

## 练习

1. **Easy.**20'den fazla yazı yazıyor.`facebook/bart-large-mnli`,覆盖所有三类──测量精度──加入逆的"次序的精法"陷("Törüyü yemedim" vs "Törüyü yedim"),看看它是否会失效──
2. **Medium.**100 条 AG Haber başlıkları 上比较零射模板 `"This text is about {label}"`- Evet.`"The topic is {label}"`和 `"{label}"`❖ Rapor doğruluk dalgalanması
3. **Hard.**构建一个RAG忠诚度检查器:atomic-claim decomposition + 每个索赔做NLI──在 50 个带金背景中的RAG-generated answers 上评估──测量对人工标签的错阳性和错负率──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| NLI | Natural Language Inference | premise-hypothesis 关系的 3-way classification。 |
| RTE | Recognizing Textual Entailment | NLI 的旧名称；同一任务。 |
| Entailment | "t implies h" | 给定 t，典型读者会得出 h 为真的结论。 |
| Contradiction | "t rules out h" | 给定 t，典型读者会得出 h 为假的结论。 |
| Neutral | "undecided" | 从 t 到 h 双向都无法推断。 |
| Zero-shot classification | NLI as classifier | 把 labels verbalize 成 hypotheses，选择最大 entailment。 |
| Faithfulness | 答案是否有支持？ | 在（retrieved context, generated answer）上做 NLI。 |

## 延伸阅读
- [Bowman et al. (2015). A large annotated corpus for learning natural language inference](https://arxiv.org/abs/1508.05326) SNLI。
- [Williams, Nangia, Bowman (2017). A Broad-Coverage Challenge Corpus for Sentence Understanding through Inference](https://arxiv.org/abs/1704.05426) MultiNLI。
- [Nie et al. (2019). Adversarial NLI](https://arxiv.org/abs/1910.14599) ANLI referans göstergesi。
- [Yin, Hay, Roth (2019). Benchmarking Zero-shot Text Classification](https://arxiv.org/abs/1909.00161) NLI-as-classifier。
- [He et al. (2021). DeBERTa: Decoding-enhanced BERT with Disentangled Attention](https://arxiv.org/abs/2006.03654)2026 yılının NLI 主力──
