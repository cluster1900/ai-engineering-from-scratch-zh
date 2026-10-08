# Tradução automática

> A tradução é uma tarefa que foi realizada durante 30 anos para o estudo da PNL e continua a ser realizada.

**Type:** Build
**Languages:** Python
**先修要求：**Fase 5 · 10 (Attenção), Fase 5 · 04 (GloVe, FastText, Subword)
**Time:** ~75 minutes

## 问题
Um modelo 读取一种语言的句子,并生成另一种语言的句子──长度会变化──词序会变化──有些源语言词会映射到多个目标语言词,反之亦然──习语拒绝对一映射──英语里"I miss you"在法语里是"tu me manques" 字面意思是"you are missing me"── não há alinhamento de classes de palavras que possa ser conservado nessa situação──

A tradução automática é a que obriga a PNL a desenvolver codificadores-decodificadores, atenção e transformadores, e finalmente impulsiona a formação de todo o paradigma da LLM.

O programa de investigação sobre a tecnologia da informação e da informação sobre a tecnologia da informação e da informação, que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido em 2006 e que foi desenvolvido com o desenvolvimento.

## 概念
![MT pipeline: tokenize → encode → decode with attention → detokenize](../assets/mt-pipeline.svg)

现代 MT é em texto paralelo 上训练的 Transformer encoder-decoder──encoder 读取按其语言代码化 处理后的源──decoder 通过横断注意 (Lessão 10) Usando o encoder, produz uma única subpalavra──decoding, usando o beam search para evitar a armadilha da codia──output 会被 detokenized、detrucased,并与参考 评分对比──

Três opções operacionais determinam a qualidade da MT no mundo real.

- **Tokenizer.**SentencePiece BPE в混合语言 corpus 上 тренинг──跨语言 compartido vocabulário 正是NLLB 能实现零射语言对的原因──
- **Model size.**NLLB-200 destilado 600M pode ser usado em computador portátil.
- **Decoding.**通用内容使用梁宽 4-5──使用长度罚 避免输出 过短──在需要术语一致性 时使用限制解码──


```figure
seq2seq-alignment
```

## Construí-lo
### 步骤 1: Uma chamada de MT pré-treinada

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

Há três coisas importantes.`src_lang`告诉 tokenizer 应用哪种脚本和细分.`forced_bos_token_id`告诉 decoder 要生成哪种语言──两者都是NLLB-specific tricks;mBART 和 M2M-100 使用各自的约定,不能互换──

### 步骤 2: BLEU 和 chrF

BLEU  medida de saída e referência                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

A sua avaliação é mais sensível ao formato de linguagem rica, pois a BLEU vai fazer uma avaliação inferior.

```python
import sacrebleu

hypotheses = ["Les chats courent."]
references = [["Les chats courent."]]

bleu = sacrebleu.corpus_bleu(hypotheses, references)
chrf = sacrebleu.corpus_chrf(hypotheses, references)
print(f"BLEU: {bleu.score:.1f}  chrF: {chrf.score:.1f}")
```

始终使用 `sacrebleu`                                                                                                                                                                                                                                                              

### Níveis de avaliação de três níveis (2026)

现代 MT avaliação Utilize Three classes of互补的 метрических семейства──上线时至少使用其中两类──

- **Heuristic**(BLEU, chrF)──快速、referência-base、可解释, mas para parafrase não sensível── para comparação de legado 和 detecção de regressão──
- **Learned**(COMET, BLEURT, BERTScore)  Em julgamento humano, os modelos neurais treinados; comparação de tradução com a semântica semântica da fonte e referência  Desde 2023, a ligação entre a investigação COMET e MT é mais alta, e em questões de qualidade, o cenário é o de produção de 2026 
- **LLM-as-judge**(sem referência)  Proposição de um grande modelo de fluência, adequação, tom, adequação cultural para traduções 打分── quando rubrica 设计良好时, GPT-4-as-judge correspondência com a homogeneidade humana é de cerca de 80%── para conteúdo aberto sem referência──

实用2026 stack: 用 `sacrebleu`计算 BLEU 和 chrF,用 `unbabel-comet`計算 COMET,并用促 LLM 作为最终面向人类的信号──在信任任何指标 用生产数据 之前,先用50-100 个人类标签的例子 进行校准──

Metricas sem referência ((COMET-QE, BLEURT-QE, LLM-as-judge) Deixe-se avaliar traduções em caso de não haver referência, isso é muito importante para não haver traduções de língua de cauda longa 

### Passo 3: produção

O que acontece é que o trabalho em cima é muito mais fácil, mas não é fácil.

- **Hallucination.**Modelo 发明源 中不存在的内容──常见于不熟的域名词汇──症状:output 很流,但声称源源 没有陈述的事实──Mitigação:对域名术语使用限制解码,对受管制内容使用人文审查,并监控输出 是否比输入 长很多──
- **Off-target generation.**Modelo 翻译成错误语言──NLLB 在罕见语言对上尤其容易出现这个问题──Mitigação:验证 `forced_bos_token_id`,并始终使用语言-ID modelo de verificação 检查输出──
- **Terminology drift.**"Subscrever" em doc 1 中 transforma-se em "s'inscrire", em doc 2 中 transforma-se em "creer un compte"── para o texto da interface e para as cadeias de uso, consistência em relação à qualidade bruta, mais importante──Mitigação: decodificação com restrições de glossário ou dicionário pós-edição──
- **Formality mismatch.**法语 "tu" vs "vous",日语 politeness levels──model 会选择 training 中更常见的形式──对于客户面向内容, this is usually err的──Mitigation:如果模型 支持,用形式性符号 作为快速预写,或者在正式的 corpora上细调 一个小型──
- **Length explosion on short input.**很短的输入句子 经常产生过长的翻译,因为在低于约5源代币 时长处罚 会突然失效──Mitigação:使用与源长 成比例的硬最大长度盖──

### 步骤 4: For a domain  realizar ajuste fino

Os modelos pré-treinados são generalistas.

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

几千个高质量平行例 胜过几十万个噪音网页剪辑例──训练数据质量是生产中最大的单一杆──

## Use-o
Estaca de produção de MT para 2026:

| Use case | Recommended starting point |
|---------|---------------------------|
| Any-to-any, 200 languages | `facebook/nllb-200-distilled-600M`（laptop）或 `nllb-200-3.3B`（production） |
| English-centric, high quality, 50 languages | `facebook/mbart-large-50-many-to-many-mmt` |
| Short runs, cheap inference, English-French/German/Spanish | Helsinki-NLP / Marian models |
| Latency-critical browser-side | ONNX-quantized Marian（~50 MB） |
| Maximum quality, willing to pay | GPT-4 / Claude / Gemini with translation prompts |

截至2026年, LLMs em vários pares de idiomas 上 já ultrapassaram os modelos MT especializados, especialmente em conteúdo idiomático 和 longo contexto 上。取舍是每代币成本 和延迟──当背景长度、スタイリスト一致性 或通过促实现域调整比吞吐量 更重要时,选择 LLM──

## Entrega-o
保存为 `outputs/skill-mt-evaluator.md`- Não .

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
1. **Easy.**Utilização `nllb-200-distilled-600M`将一个 5 句英文段落翻译成法语,再翻译回英语──衡量回路与原始的接近程度── você deve ver preservação semântica, acompanhada de derivação de escolha de palavras──
2. **Medium.**Utilização `fasttext lid.176`Ou `langdetect`Para as saídas de tradução  realizar o controle de identificação de idioma 将将其集集成到MT call 中,让非目标世代在返回前被捕
3. **Hard.**Em sua escolha, corpus de domínio de 5.000 pares, para ajustar a sua melodia.`nllb-200-distilled-600M` Em ajuste fino                                                                                                                                                                                                                                                                                                                                   

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
- [Costa-jussà et al. (2022). No Language Left Behind: Scaling Human-Centered Machine Translation](https://arxiv.org/abs/2207.04672) Papel da NLLB。
- [Post (2018). A Call for Clarity in Reporting BLEU Scores](https://aclanthology.org/W18-6319/)Porquê ?`sacrebleu`É a única forma correta de relatar o BLEU.
- [Popović (2015). chrF: character n-gram F-score for automatic MT evaluation](https://aclanthology.org/W15-3049/)Papel de papel cromático
- [Hugging Face MT guide](https://huggingface.co/docs/transformers/tasks/translation) 实用精细调度 walkthrough──
