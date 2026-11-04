# Evidence: cheatsheets/text-processing-classic.md

Abbreviations: T01 = phases/05-nlp-foundations-to-advanced/01-text-processing, T02 = phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf, T05 = phases/05-nlp-foundations-to-advanced/05-sentiment-analysis, T15 = phases/05-nlp-foundations-to-advanced/15-topic-modeling. d = docs/en.md, c = code/main.py.

## 经典文本流水线 (flow, 7 steps)
1. Tokenize, punctuation as standalone tokens: T01/d:24, 50
2. Stem for speed, lemmatize when meaning matters, POS needed: T01/d:30, 251
3. Negation scoping with NOT_ up to punctuation: T05/d:131
4. Bag of words, rows are documents, columns vocabulary: T02/d:20, 74
5. TF-IDF scales down ubiquitous words: T02/d:22, L2 rows and cosine as dot product: T02/d:140
6. Naive Bayes for baseline, logistic regression for production: T05/d:234
7. Per-class precision and recall, macro-F1, confusion matrix: T05/d:165-168

## 代码中的任务 (task-table, 8)
- preprocess(text, pos_tagger=demo_pos_tagger): T01/c:48, 73
- stem_step_1a(word): T01/c:11
- lemmatize(word, pos), table with fallback: T01/c:37-45
- bag_of_words, build_vocab: T02/c:12, 21
- l2_normalize(tfidf(bow)): T02/c:76
- apply_negation(tokens): T05/d:138
- train_nb(docs_by_class, vocab, alpha=1.0): T05/d:65
- collapsed_gibbs_lda(docs, n_topics=3, n_iters=300, seed=42): T15/c:99

## NLTK：token、词干、lemma (annotated-code, 8 lines)
- nltk.download punkt_tab, wordnet, averaged_perceptron_tagger_eng: T01/d:146-148
- word_tokenize, contractions and Unicode: T01/d:155, 174
- PorterStemmer().stem, all five phases: T01/d:156, 174
- pos_tag, Penn Treebank: T01/d:158, 174
- WordNetLemmatizer, lemmatize with nltk_pos_to_wordnet: T01/d:157, 171
- Mapping V to v, J to a, R to r, else n: T01/d:161-168

## scikit-learn 中的情感基线 (annotated-code, 10 lines)
- Pipeline with TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True, stop_words=None): T05/d:196-197
- LogisticRegression(C=1.0, max_iter=1000): T05/d:198
- pipe.fit, pipe.score: T05/d:200-201
- stop_words=None keeps negations, bigrams give not_good, sublinear_tf dampens, 75% to 85% on SST-2: T05/d:204

## Vectorizer 旋钮 (command-table, 8)
- CountVectorizer: T02/d:160
- TfidfVectorizer adds IDF and L2: T02/d:160
- ngram_range=(1, 2): T02/d:166
- min_df=2: T02/d:167
- max_df=0.95: T02/d:168
- stop_words="english", not for sentiment: T02/d:169
- sublinear_tf=True, 1 + log(tf): T02/d:170
- get_feature_names_out(): T02/d:152

## 主题模型 (annotated-code, 10 lines)
- CountVectorizer(max_features, stop_words="english", min_df=2, max_df=0.9): T15/d:58-63
- LDA expects raw counts: T15/d:83
- X = cv.fit_transform(documents): T15/d:64
- LatentDirichletAllocation(n_components, random_state=42, max_iter=50, learning_method="online"): T15/d:65-70
- doc_topic = lda.fit_transform(X), rows sum to 1: T15/d:30, 71
- BERTopic(embedding_model=..., min_topic_size=15), library default 10: T15/d:90-92, 104
- topics, probs = topic_model.fit_transform(documents): T15/d:96
- get_topic_info, Topic -1 outlier bucket: T15/d:97, 104

## 公式 (concepts, 8)
- TF-IDF formula: T02/d:24-29
- Smoothed IDF log((n+1)/(d+1)) + 1, IDF 1 for every-doc words: T02/d:96, 99
- L2 rows, long documents dominate otherwise: T02/d:140
- Naive Bayes log prior plus log word probs, max: T05/d:83-91
- Laplace (counts + alpha) / (total + alpha * |V|): T05/d:76-78, 94
- Logistic regression sigmoid(X @ w + b) >= 0.5: T05/d:102-103, 122
- Macro-F1 mean of per-class F1: T05/d:166
- c_v NPMI, cosine, higher is better: T15/d:110

## 默认值 (defaults, 8)
- NB alpha 1.0 teaching default, 0.01 common: T05/d:94
- LR l2 0.01, start and tune: T05/d:106, 125
- epochs 500, lr 0.05: T05/d:106
- C 1.0, max_iter=1000: T05/d:198
- min_topic_size library default 10, 50 or 100 over 10,000 docs: T15/d:104
- Gibbs alpha 0.1, beta 0.01, must be positive: T15/c:13, 16-17
- n_iters 200, demo 300: T15/c:13, 99
- Topic count max(5, round(sqrt(n_docs))), clamp 200 under 40,000: T15/d:157

## 排障 (troubleshooting, 8)
- Training / inference mismatch, ship preprocessing inside the model package: T01/d:212
- Reproducibility drift, pin versions, freeze 20 sentences: T01/d:210
- ponies to poni from the ies rule, step 1b fixes it: T01/d:81
- watched not in table, fallback only ing, use WordNet or spaCy: T01/d:123
- Negations dropped by stopwords, stop_words=None plus bigrams: T02/d:169, T05/d:204
- Micro-F1 on imbalance, macro-F1, AUPRC over 95-5: T05/d:171, 173
- LDA junk topics from stopwords and frequent terms: T15/d:159, min_df and max_df: T15/d:83
- -1 outlier cluster: T15/d:159, min_topic_size: T15/d:104, qualitative read: T15/d:112

## 何时用 X (qa, 6)
- Stem for search indexing, lemmatize for user-read text: T01/d:30
- NLTK teaching and swapping, spaCy production speed: T01/d:202-203
- TF-IDF for spam, logs, low data, explainability: T02/d:174-177
- Transformer for sarcasm, sentiment shifts, aspects, low-resource languages: T05/d:208-211
- LDA long docs with mixtures, BERTopic short text: T15/d:118-119
- No GPU, LDA or NMF: T15/d:120

## 提示 (tips, 3)
- Stay sparse, 100k documents dense does not fit: T02/d:160
- Pull 5 wrong predictions per class: T05/d:169
- Regenerate the baseline on your pipeline: T05/d:217
