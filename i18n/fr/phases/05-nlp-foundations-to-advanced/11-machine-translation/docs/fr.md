# Traduction automatique

> La traduction est une tâche qui a duré 30 ans et qui continue à se poursuivre.

**Type:** Build
**Languages:** Python
**先修要求：**La phase 5 · 10 (attention), la phase 5 · 04 (glove, texte rapide, sous-mot)
**Time:** ~75 minutes

##  problématique
Un modèle 读取一种语言的句子,并生成另一种语言的句子──长度会变化──词序会变化──有些源语言词会映射到多个目标语言词,反之亦然──习语拒绝对一映射──英语里"I miss you" 在法语里是"tu me manques"  字面意思是"you are missing me"──没有任何词级结合能在这种情况下保留下来──

La traduction automatique a forcé la PNL à inventer des encoders-décoteurs, des attention transformateurs et a finalement favorisé la formation de l'ensemble du paradigme de la LLM. Chaque étape de la progression est due à la qualité de la traduction, qui peut être mesurée, tandis que la différence entre l'homme et la machine est encore constante.

Le programme de recherche de la technologie de l'information et de l'information sur les technologies de l'information et de l'information est un outil de communication technique qui permet de mieux comprendre les besoins de l'information et de la communication.

## 概念
![MT pipeline: tokenize → encode → decode with attention → detokenize](../assets/mt-pipeline.svg)

现代 MT is in parallel text 上训练的 Transformer encoder-decoder──encoder 读取按其语言代码化 处理后的源──decoder 通过横向注意力(leçon 10) Utiliser l'encoder pour produire une seule sous-phrase──decoding Utiliser le faisceau de recherche pour éviter le piège du décoding avide──output 会被 detoquénized、detruecased,并与参考 评分对比──

Trois choix opérationnels décident de la qualité de la MT dans le monde réel:

- **Tokenizer.**Le vocabulaire partagé entre les langues est la raison pour laquelle la NLLB peut réaliser des paires de langues à tirage zéro.
- **Model size.**NLLB-200 distillé 600M peut être utilisé sur ordinateur portable.
- **Decoding.**Généralement, les utilisateurs utilisent des techniques de déchiffrement limitées.


```figure
seq2seq-alignment
```

## - Je le construis.
### 步骤 1: Un appel MT prétrainé

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

Il y a trois choses importantes.`src_lang`告诉 tokeniser 应用哪种脚本和细分――`forced_bos_token_id`告诉 decoder 生成哪种语言──两者都是 des astuces spécifiques à la NLLB; mBART 和 M2M-100 使用各自的约定,不能互换──

### 步骤 2: BLEU et chrF

BLEU  mesure la production et la référence  entre n-grammes de superposition ∙∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙  ∙ ∙ ∙      ∙     ∙ ∙     ∙      ∙                ∙                                                                               

chrF  mesure le score F au niveau des caractères― pour les langages riches en forme, car BLEU va faire des comparaisons à faible valeur― habituellement avec BLEU dans un rapport―

```python
import sacrebleu

hypotheses = ["Les chats courent."]
references = [["Les chats courent."]]

bleu = sacrebleu.corpus_bleu(hypotheses, references)
chrf = sacrebleu.corpus_chrf(hypotheses, references)
print(f"BLEU: {bleu.score:.1f}  chrF: {chrf.score:.1f}")
```

始终使用 `sacrebleu` Il est standardisé par la tokenization, permet de comparer entre les documents                                                                                                                                                                                                                                                     

### Niveau d'évaluation à trois niveaux (2026)

现代 MT évaluation 使用三类互补的 метрических семей──上线时至少使用其中两类──

- **Heuristic**(BLEU, chrF)── rapid­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­
- **Learned**(COMET, BLEURT, BERTScore)  Dans le jugement humain, les modèles neuraux de formation; comparaison de la traduction avec la similitude sémantique de la source et de la référence  Depuis 2023, la relation entre la recherche COMET et MT est la plus élevée et, en matière de qualité, le cas de production est le plus défavorable en 2026 
- **LLM-as-judge**(sans référence)  Proposition d'un grand modèle en fonction de la fluidité, de l'adéquation, du ton, de l'adéquation culturelle pour les traductions 打分── lorsque la rubrique 设计良好时, GPT-4-as-judge correspondant à l'humanité correspondance est d'environ 80%── pour le contenu sans référence à l'ouverture.

实用2026 stack: 用`sacrebleu`计算 BLEU 和 chrF,用 `unbabel-comet`計算 COMET,并用促 LLM 作为最终面向人类的信号──在信任任何指标 用生产数据 之前,先使用50-100 个标签的人类的例子 进行校准──

Les mesures sans référence (COMET-QE, BLEURT-QE, LLM-as-judge) permettent d'évaluer les traductions dans le cas où il n'y a pas de référence, ce qui est très important pour les paires de langues à longue queue de traductions de référence 

### Étape 3: La production est en train de se dégrader

Le pipeline de travail supérieur est traduit en 80% et en 20% par défaut.

- **Hallucination.**Modèle 发明来源 中不存在的内容──常见于不熟悉的域名词汇──症状:output 很流,但声称源源 没有陈述的事实──Mitigation:对域名术语使用限制解码,对受管制内容使用人文审查,并监控输出 是否比输入 长很多──
- **Off-target generation.**Modèle 翻译成错误语言──NLLB Dans les paires de langues rares 上尤其容易出现这个问题──Mitiation:验证 `forced_bos_token_id`,并始终使用语言-ID modèle de vérification 检查输出──
- **Terminology drift.**"Sign up" dans le document 1 devient "s'inscrire", dans le document 2 devient "créer un compte"── pour le texte de l'interface utilisateur et les chaînes d'utilisation, la cohérence par rapport à la qualité brute, c'est plus important──Mitification: décoding restreint par glossaire ou dictionnaire post-édition──
- **Formality mismatch.**Pour le contenu destiné aux clients, ceci est généralement un défaut. Mitiation: si le modèle est soutenu, utilisez le jeton de formalité comme préfixe rapide, ou dans les corporations formelles uniquement, en mettant un petit modèle en fine-tune.
- **Length explosion on short input.**很短的输入句子 经常产生过长的翻译,因为在低于约5源代币时长度罚 会突然失效──Mitigation:使用与源长度 成比例的硬最大长度盖──

### 步骤 4: Pour un domaine  effectuer une mise à jour fine

Les modèles prétrainés sont généraux. La traduction juridique, médicale ou de dialogue de jeu sera manifestement bénéficiée par la mise à jour des données parallèles dans le domaine.

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

几千个高质量平行例 胜过几十万个噪音网页剪辑例──培训数据质量是生产中最大的单一杆──

## Utilisez-le
Stack de production MT pour l'année 2026:

| Use case | Recommended starting point |
|---------|---------------------------|
| Any-to-any, 200 languages | `facebook/nllb-200-distilled-600M`（laptop）或 `nllb-200-3.3B`（production） |
| English-centric, high quality, 50 languages | `facebook/mbart-large-50-many-to-many-mmt` |
| Short runs, cheap inference, English-French/German/Spanish | Helsinki-NLP / Marian models |
| Latency-critical browser-side | ONNX-quantized Marian（~50 MB） |
| Maximum quality, willing to pay | GPT-4 / Claude / Gemini with translation prompts |

截至 2026年, les LLM dans plusieurs paires de langues 上 déjà dépassé les modèles spécialisés MT, en particulier dans le contenu idiomatique et le long contexte 上。取舍是 per-token cost 和 latency──当 context length、 stylistic consistency 或通过 prompting 实现域适应比 throughput 更重要时,选择LLM──

## Je le livre.
保存为 `outputs/skill-mt-evaluator.md`- Le numéro de la liste:

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
1. **Easy.**Utilisation `nllb-200-distilled-600M`Pour la première fois, la définition de la langue est la même que celle de la langue française.
2. **Medium.**Utilisation `fasttext lid.176`Ou `langdetect`Pour les sorties de traduction  réaliser la vérification de l'identification de langue                                                                                                                                                                                                                                                     
3. **Hard.**Dans votre choix de 5000 paires de domaines corpus en haut de la fine-tune `nllb-200-distilled-600M`◊ Dans l'ajustement de la fin, utilisez un ensemble de mesure Bleu ◊ rapport quelles types de phrases  ont été améliorées, quelles ont été rétrogradées ◊

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
- [Costa-jussà et al. (2022). No Language Left Behind: Scaling Human-Centered Machine Translation](https://arxiv.org/abs/2207.04672) Papers de la NLLB
- [Post (2018). A Call for Clarity in Reporting BLEU Scores](https://aclanthology.org/W18-6319/)Pourquoi ?`sacrebleu`C'est la seule façon correcte de signaler BLEU.
- [Popović (2015). chrF: character n-gram F-score for automatic MT evaluation](https://aclanthology.org/W15-3049/) papier chrF。
- [Hugging Face MT guide](https://huggingface.co/docs/transformers/tasks/translation) 实用 fine tuning walkthrough──
