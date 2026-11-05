# Evidence: cheatsheets/rnns-seq2seq.md

Abbreviations: R08 = phases/05-nlp-foundations-to-advanced/08-cnns-rnns-for-text, S09 = phases/05-nlp-foundations-to-advanced/09-sequence-to-sequence, M11 = phases/05-nlp-foundations-to-advanced/11-machine-translation, G16 = phases/05-nlp-foundations-to-advanced/16-text-generation-pre-transformer, W07 = phases/07-transformers-deep-dive/01-why-transformers. d = docs/en.md, c = code/main.py.

## Seq2seq 编码器-解码器 (architecture, 6 nodes, 6 edges)
- Source tokens are src ids embedded: S09/d:49-50
- Encoder GRU returns outputs, hidden: S09/d:43-52, 55
- Context vector is the final hidden state, the bottleneck: S09/d:18, 26, 201
- Decoder initialized from the context vector, one step at a time: S09/d:20, 74
- input_token starts as bos_id, then feeds back the chosen token: S09/d:83, 111, 115-117
- Vocabulary logits, argmax or beam: S09/d:20, 70, 123

## 核心公式 (concepts, 8)
- RNN h_t = f(W * x_t + U * h_{t-1} + b), shared W, U, b: R08/d:28
- LSTM gates and cell state: R08/d:30, 192
- GRU two gates, fewer parameters: R08/d:30, 193
- TextCNN filter as learnable n-gram, global max-pool: R08/d:24, 26
- N-gram count ratio: G16/d:42-46
- Perplexity formula, lower is better: G16/d:61-65
- Kneser-Ney absolute discounting plus continuation probability: G16/d:57, 246
- BLEU n-gram sizes 1-4, geometric mean, brevity penalty, [0, 100]: M11/d:64

## 代码中的任务 (task-table, 8)
- vanishing_gradient_sim(seq_len, recurrent_weight=0.9): R08/c:4
- greedy_decode(encoder, decoder, src, bos_id, eos_id, max_len=50): S09/d:108
- simple_bleu(hypothesis, reference, max_n=4): M11/c:34
- chrf(hypothesis, reference, n=6, beta=2): M11/c:53
- train_ngram(corpus_tokens, n=3): G16/d:81
- kneser_ney_bigram_model(corpus_tokens, discount=0.75): G16/d:118
- perplexity(prob_fn, sentences): G16/d:191
- rnn_style(xs, decay=0.9), attention_style(xs): W07/c:11, 19

## 用 teacher forcing 训练 (annotated-code, 12 lines)
- _, hidden = encoder(src): S09/d:81
- input_token = torch.full((batch_size, 1), bos_id, dtype=torch.long): S09/d:83
- nn.CrossEntropyLoss(ignore_index=0), skips padding: S09/d:85, 102
- decoder loop and step loss: S09/d:87-90
- use_teacher from torch.rand(1).item() < teacher_forcing_ratio: S09/d:91
- ground truth tgt[:, t].unsqueeze(1) or logits.argmax(dim=-1): S09/d:92-95, 24
- loss.backward(): S09/d:97

## TextCNN 前向传播 (annotated-code, 9 lines)
- self.embed(token_ids).transpose(1, 2), [batch, embed_dim, seq_len]: R08/d:61, 71
- loop over self.convs, widths (2, 3, 4): R08/d:50, 63
- F.relu(conv(x)), F.max_pool1d(c, c.size(2)).squeeze(2): R08/d:64-66
- torch.cat(pooled, dim=1), fixed size: R08/d:67, 71
- out, _ = self.lstm(x), out.max(dim=1).values: R08/d:87-88
- max-pool beats last state: R08/d:92

## 翻译并打分 (annotated-code, 8 lines)
- model_id facebook/nllb-200-distilled-600M, src_lang="eng_Latn": M11/d:39-40
- model.generate with forced_bos_token_id fra_Latn, num_beams=5, length_penalty=1.0, max_new_tokens=64: M11/d:46-52
- forced_bos_token_id sets the target language: M11/d:60
- tok.batch_decode: M11/d:53
- sacrebleu.corpus_bleu and corpus_chrf: M11/d:74-75

## 默认值与数字 (defaults, 8)
- teacher_forcing_ratio=0.9 signature: S09/d:79, start 1.0 anneal ~0.5: S09/d:102
- Beam width 3-5: S09/d:123, MT 4-5: M11/d:26
- KN discount=0.75: G16/d:118, 150
- n_filters=64, filter_widths=(2, 3, 4), dropout=0.3: R08/d:50
- 0.9 ^ 100 ≈ 2.7e-5: R08/d:104-105
- Copy accuracy 98% at 5, 23% at 40: S09/d:130-133
- BLEU 30 usable, 40 good, 50 exceptional, under 1 noise: M11/d:64
- 4-gram KN perplexity ~140 on Brown, transformer 15-30: G16/d:203

## 排障 (troubleshooting, 8)
- Exposure bias: S09/d:24, drift on longer outputs: S09/d:186, scheduled sampling: S09/d:164
- Fixed context vector loses detail on long inputs: S09/d:26, attention fix: S09/d:28
- Vanishing gradient in plain RNNs, LSTM and GRU fix: R08/d:96, 109
- Greedy repeats and loops: S09/d:188, beam width 4-5: S09/d:185
- Off-target generation, check forced_bos_token_id and language ID: M11/d:98
- Length explosion under ~5 tokens, cap by source length: M11/d:101
- Hallucination, constrained decoding, human review: M11/d:97
- Unseen n-grams get zero probability: G16/d:16, 48, Kneser-Ney: G16/d:16, 57

## 何时用 X (qa, 6)
- TextCNN edge, 10-100x smaller: R08/d:152
- LSTM streaming: R08/d:153, BiLSTM-CRF for 1k-10k sentences: R08/d:155
- RNN seq2seq almost never, streaming or on-device: S09/d:156-159
- N-gram autocomplete, rescoring, baseline: G16/d:208-210
- Everything else a transformer: R08/d:157, W07/d:81, depth 1 vs N: W07/d:66, O(N^2) memory: W07/d:34
- chrF sensitive for morphologically rich languages, reported with BLEU: M11/d:66

## 缩写 (glossary, 6)
- LSTM: R08/d:192
- GRU: R08/d:193
- NMT: M11/d:182
- NLLB: M11/d:183
- chrF: M11/d:181
- SSM: W07/d:83, 104

## 提示 (tips, 5)
- Always use sacrebleu: M11/d:79
- At least two metric families, COMET default: M11/d:83, 86
- Calibrate on 50-100 human-labeled examples: M11/d:89
- Perplexity only under identical tokenization: G16/d:230
- A few thousand clean pairs beat noisy ones: M11/d:134
