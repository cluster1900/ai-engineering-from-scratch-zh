# Evidence: cheatsheets/sequence-labeling.md

Abbreviations: N06 = phases/05-nlp-foundations-to-advanced/06-named-entity-recognition, N07 = phases/05-nlp-foundations-to-advanced/07-pos-tagging-parsing, N24 = phases/05-nlp-foundations-to-advanced/24-coreference-resolution, N25 = phases/05-nlp-foundations-to-advanced/25-entity-linking. d = docs/en.md, c = code/main.py.

## 抽取流水线 (architecture, 6 nodes, 5 edges)
- Order NER, coref, EL on each mention, one KB id per entity: N25/d:142, N24/d:118
- NER with BIO token labels to spans: N06/d:20, 37
- Coref outputs mention clusters: N24/d:25
- Candidate generation from an alias index, 10-30 candidates: N25/d:22, 31
- Disambiguation by prior + context or embeddings: N25/d:35-36
- NIL prediction: N25/d:123, 181

## 核心概念 (concepts, 8)
- BIO and New B-GPE, York I-GPE: N06/d:20, 37, 311
- BILOU adds L-X and U-X: N06/d:312
- HMM product of transition and emission: N07/d:86, 89
- CRF discriminative, arbitrary features, valid sequences: N06/d:43, 313
- Viterbi over the tag lattice: N07/d:89, 249
- Dependency parse, one head, labeled relation: N07/d:31, 248
- Mention types named entity, nominal, pronominal, appositive: N24/d:27-32
- P(entity | mention) × context-similarity(entity, text): N25/d:35

## 基于规则的代词消解 (flow, 6 steps)
1. extract_mentions, capitalized spans, pronouns, "the X": N24/d:75, N24/c:27
2. resolve, earlier ne and nominal candidates for each pronoun: N24/c:89-94
3. agreement_score, +1 number, -2 on gender clash: N24/c:71-81
4. recency_score, closer wins: N24/c:84-86, N24/d:78
5. highest sum links the antecedent: N24/c:98, N24/d:80
6. clusters with union-find: N24/c:103-120

## 代码中的任务 (task-table, 8)
- spans_to_bio(tokens, spans): N06/c:34
- bio_to_spans(tokens, labels): N06/c:43
- word_shape(word): N06/c:6
- rule_based_ner(tokens): N06/c:20
- predict_mft(tokens, word_best, default_tag): N07/c:27
- train_hmm(examples, alpha=0.01): N07/c:31
- viterbi(tokens, transitions, emissions, tags, vocab, alpha=0.01): N07/c:52
- disambiguate(mention, context, use_prior=True): N25/c:43

## CRF 与 transformer NER (annotated-code, 9 lines)
- sklearn_crfsuite.CRF(algorithm="lbfgs", c1=0.1, c2=0.1, max_iterations=100, all_possible_transitions=True): N06/d:177
- c1 and c2 are L1 and L2, illegal I-ORG after O: N06/d:182
- X_train = [to_features(s) ...], crf.fit: N06/d:178-179
- ~84 F1 on CoNLL-2003: N06/d:303
- pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple"): N06/d:236
- aggregation_strategy merges B-X, I-X: N06/d:247
- print(ner(...)): N06/d:237

## spaCy：标签、句法、实体、簇 (annotated-code, 10 lines)
- spacy.load("en_core_web_sm"), nlp("The cats were running at 3pm."): N07/d:175-176
- token.tag_, token.pos_, token.dep_, token.head.text: N07/d:178, Penn, UD, relation: N07/d:197
- doc.ents, ent.text, ent.label_: N06/d:218-219
- iPhone labeled ORG in the small model: N06/d:229
- spacy.load("en_coreference_web_trf") experimental: N24/d:61
- doc._.coref_clusters loop: N24/d:63-64

## 预期数字 (defaults, 8)
- MFT ~85% on Brown, the floor: N07/d:79
- Bigram HMM ~93%, gain from transitions: N07/d:155
- CRF ~97%, BiLSTM-CRF or transformer ~98%+: N07/d:159
- Annotators agree 97%, past 98% overfitting: N07/d:161
- PTB 36 tags, UD 17: N07/d:22, 245
- Coref ~83 F1 on CoNLL-2012, average of MUC, B³, CEAF: N24/d:42
- 10-30 candidates per mention: N25/d:31
- Classical NER wins under 50ms: N06/d:264

## 排障 (troubleshooting, 8)
- Domain shift, fine-tune on your domain: N06/d:271
- Nested entities, span-based or multi-pass: N06/d:272
- Long entities split, aggregation_strategy or post-process: N06/d:273
- Token-level F1 overstates, entity-level F1 with seqeval: N06/d:295, 315
- Singleton explosion, check all three metrics: N24/d:102
- ~15 F1 drop over 2,000 tokens: N24/d:103, sliding-window + merge: N24/d:105
- Popularity bias: N25/d:125, domain fine-tuning: N25/d:165, NIL: N25/d:123
- Mention boundary errors drop EL recall: N25/d:124

## 何时用 X (qa, 5)
- Classical under 50ms, 98%+ F1, on-prem: N06/d:264-267, LLM zero-shot first: N06/d:258
- PTB legacy English, UD multilingual: N07/d:227
- spaCy, stanza, trankit: N07/d:228
- BLINK or REL, exact-match prior for low latency: N25/d:135, 139
- LLM coref easy cases only, over-merge and dropped mentions: N24/d:40, 95

## 缩写 (glossary, 7)
- NER: N06/d:310
- CRF: N06/d:313
- PTB / UD: N07/d:22, 246-247
- EL: N25/d:20, 177
- NIL: N25/d:181
- CoNLL F1: N24/d:157
- Cataphora: N24/d:49, 155

## 提示 (tips, 4)
- Report both measurements, 99% on 80% recall is an 80% pipeline: N25/d:46
- Merge coref clusters into NER entities, one KB id per entity: N24/d:118, N25/d:142
- Constrain LLM EL to valid KB ids: N25/d:165
- Noun-verb ambiguity saw, book, can, sample 20 outputs: N07/d:230
