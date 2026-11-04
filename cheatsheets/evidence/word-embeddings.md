# Evidence: cheatsheets/word-embeddings.md

Abbreviations: P05 = phases/05-nlp-foundations-to-advanced. B = P05/02-bag-of-words-tfidf, W = P05/03-word-embeddings-word2vec, G = P05/04-glove-fasttext-subword. d = docs/en.md, c = code/main.py.

## Skip-gram with negative sampling (architecture, 5 nodes, 4 edges)
- one-hot(center) input over the vocabulary: W/d:29, 32
- W center table, the embedding you keep: W/d:29, 32-34, 72
- hidden d-dim, no nonlinearity: W/d:29, 32
- W' context table: W/d:32, 72
- sigmoid scores for 1 positive and k negatives: W/d:37, 89, 101-102
- dot product W[center] · W'[context]: W/d:89

## One training step: train_pair (flow, 6 steps)
1. skipgram_pairs over the window: W/c:22-29
2. k_neg negatives, center and context ids dropped: W/c:70-71
3. sigmoid(v_c @ u_pos) near 1, sigmoid(u_negs @ v_c) near 0: W/c:48-49, W/d:115
4. pos_err = sigmoid(...) - 1.0, neg_errs: W/c:48-49
5. W_prime rows updated with lr * err * v_c: W/c:52-54
6. W[c_idx] -= lr * grad_center: W/c:51, 55

## Tasks in code (task-table, 8 rows)
- bag_of_words(docs, vocab): B/c:21
- l2_normalize(tfidf(bow)): B/c:76
- train(docs, dim=16, window=2, k_neg=5, epochs=100, lr=0.05, seed=0): W/d:120
- analogy(vocab, W, "man", "king", "woman"): W/d:161-163, 169
- build_cooccurrence(docs, window=5): G/d:44
- glove_train(vocab, pair_counts, dim=16, epochs=100, lr=0.05, x_max=100, alpha=0.75, seed=0): G/d:61
- char_ngrams(word, n_min=3, n_max=6): G/d:90
- learn_bpe(corpus, k_merges=10), apply_bpe("lowest", merges): G/d:171-173

## Libraries in production (annotated-code, 9 lines)
- TfidfVectorizer fit_transform, IDF weighting and L2 normalization: B/d:155-156, 160
- Word2Vec(sentences, vector_size=100, window=5, min_count=1, sg=1, negative=5, workers=4, epochs=30): W/d:187-196
- model.wv.most_similar("cat", topn=3): W/d:199
- fasttext.util.download_model("en", if_exists="ignore"), fasttext.load_model("cc.en.300.bin"): G/d:186-187
- ft.get_word_vector("zoomerapproved"): G/d:189
- AutoTokenizer.from_pretrained("gpt2"), tok.tokenize("unbelievably tokenized"): G/d:197-198
- Ġ marks word boundaries: G/d:205

## Formulas (concepts, 8 bullets)
- TF-IDF = count/|d| · log(N/df): B/d:24-29
- smoothed IDF log((n+1)/(d+1)) + 1, every-doc word keeps IDF 1: B/c:40, B/d:96, 99
- cosine = dot product of L2-normalized vectors, 1 identical, 0 orthogonal: B/d:140, 254
- GloVe v_i · v_j + b_i + b_j ≈ log(X[i][j]): G/d:24
- weight (x/x_max)^alpha below x_max, else 1.0: G/d:71, 85
- W + W_tilde sum beats one table: G/d:82, 85
- FastText vector = sum of n-gram vectors: G/d:26, 104
- BPE vocabulary of k + 256 tokens: G/d:28

## Vectorizer knobs (command-table, 6 rows)
- ngram_range=(1, 2): B/d:166
- min_df=2: B/d:167
- max_df=0.95: B/d:168
- stop_words="english", not for sentiment: B/d:169
- sublinear_tf=True, 1 + log(tf): B/d:170
- get_feature_names_out: B/d:152, 238

## Tips (tips, 5 bullets)
- under 500 labeled examples, TF-IDF baseline first: B/d:230
- TF-IDF weighted embeddings below about 50k labeled examples: B/d:192, 211
- analogy accuracy alone is not enough: W/d:244
- download pretrained vectors: W/d:202, G/d:182
- 30k-100k merges in GPT / BERT / T5 tokenizers: G/d:178

## Defaults and numbers (defaults, 8 rows)
- vector_size 100, typical 100-300: W/d:189, 257
- gensim window 5, from-scratch window 2: W/d:190, W/c:22
- negative 5, k_neg=5: W/d:193, W/c:58
- sg 1 skip-gram, better on rare words: W/d:192, 27
- init rng.normal(0, 0.1, size=(vocab_size, dim)): W/d:80
- x_max 100, weight 1.0 at or above: G/d:61, 71
- alpha 0.75, downweights frequent pairs: G/d:61, 85
- n-grams 3 to 6 characters with < and > wrap: G/d:91, 104

## Troubleshooting (troubleshooting, 8 rows)
- "not good at all" vs "excellent", semantic blindness: B/d:181-186; bigrams: B/d:166
- Zoomer-approved OOV, subword embeddings: B/d:188, W/d:221, G/d:16
- bank polysemy, contextual embeddings: W/d:217-219
- long documents dominate without normalization: B/d:140
- stopwords carry negations in sentiment: B/d:169, 230
- norm below 0.01 or above 100 is a training bug: W/d:242
- tokenizer-model mismatch, never swap: G/d:213, 236
- stay sparse for 100k documents: B/d:160

## Abbreviations (glossary, 8 bullets)
- BoW counts, throws away order: B/d:20, 249
- TF and DF: B/d:250-251
- IDF downweights words that appear everywhere: B/d:252
- CBOW predict center from context: W/d:25
- Skip-gram predict context, became the default: W/d:24, 27
- GloVe Global Vectors, co-occurrence factorization: G/d:24, W/d:204
- OOV, Word2Vec/GloVe fail: G/d:254, W/d:262
- BPE merge most frequent adjacent pair: G/d:28, 253

## Questions (qa, 5 bullets)
- TF-IDF wins: spam, topic, logs, low data, latency, explainability: B/d:174-177
- softmax over 100k words too expensive, binary task: W/d:37
- king - man captures "royal": W/d:173
- FastText for misspellings / neologisms / rich morphology: G/d:212
- no custom tokenizer when fine-tuning a pretrained LLM: G/d:238
