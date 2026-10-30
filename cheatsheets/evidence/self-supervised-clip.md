# Evidence: cheatsheets/self-supervised-clip.md

Abbreviations: P04 = phases/04-computer-vision. L17 = P04/17-self-supervised-vision, L18 = P04/18-open-vocab-clip, L20 = P04/20-image-retrieval-metric, M02 = phases/12-multimodal-ai/02-clip-contrastive-pretraining. d = docs/en.md, c = code/main.py, s = outputs/skill-clip-zero-shot.md.

## 家族与模型 (concepts, 8)
- Contrastive SimCLR, MoCo, CLIP, positives together, negatives apart: L17/d:31, 42
- Teacher-student DINO, BYOL, iBOT, EMA teacher, no explicit negatives: L17/d:32, 57
- Masked MAE, BEiT, SimMIM, mask 75%, reconstruct pixels: L17/d:33, 72
- CLIP two towers, 400M pairs, zero supervised labels: L18/d:21, M02/d:3
- SigLIP per-pair sigmoid, no all-gather, better at small batch: L18/d:59-68, M02/d:69
- Linear probe frozen encoder + linear classifier, feature quality: L17/d:99, 106
- Probe top-1 SimCLR ~71%, DINO ~77%, MAE ~76%, DINOv2 ~86%: L17/d:101-104
- Category level works off-the-shelf, instance level needs metric learning: L20/d:97-98

## CLIP 双塔 (architecture, 8 nodes)
- Image, batch of N pairs: M02/d:35
- Image encoder ViT or ResNet: M02/d:30
- Image L2 normalise to unit length, D-dim: M02/d:33, L18/d:41
- Caption, N captions: M02/d:35
- Text encoder small transformer: M02/d:31, L18/d:32
- Text L2 normalise to unit length, D-dim: M02/d:33, L18/d:41
- Similarity S (N, N) divided by tau: M02/d:35-39
- Symmetric CE (i2t + t2i) / 2, diagonal targets: L18/d:47-55, M02/d:47-51

## 公式 (concepts, 8)
- InfoNCE L_ij: L17/d:45-51
- CLIP S[i, j] = cos / tau, shape (N, N): M02/d:35-39
- CLIP loss rows and columns over 2: L18/d:50-52
- SigLIP log(1 + exp(-y sim)), y = +1 or -1: L18/d:61-66
- DINO EMA teacher update: L17/d:63
- Triplet loss with margin: L20/d:54-56
- ||a - b||^2 = 2 - 2 cos(a, b) for unit vectors: L20/d:69
- Recall@K definition: L20/d:75-77

## InfoNCE 与 MAE 掩码 (annotated-code, 10 lines)
- info_nce body with tau=0.1, eye mask, -inf fill, targets, cross_entropy: L17/d:152-164, L17/c:5
- L2-normalise before calling: L17/d:167
- num_patches = 196, random_mask_indices(num_patches, mask_ratio=0.75): L17/d:195-196, L17/c:15
- keep 1 - mask_ratio of patches: L17/d:188

## CLIP 损失与零样本 (annotated-code, 8 lines)
- sim = logit_scale * image_emb @ text_emb.T, arange targets, two cross_entropy, mean: L18/d:128-134, L18/c:25-31
- random init loss near log(N): L18/d:170
- zero-shot normalise image_proj and text_proj, i @ t.T, argmax: L18/d:148-151

## 三元组损失与 recall@K (annotated-code, 10 lines)
- triplet_loss with margin=0.2, pairwise_distance p=2, relu mean: L20/d:114-117, L20/c:6
- semi_hard_negatives(emb, y), hardest positive, semi-hard negative: L20/d:152, 199
- triplet_loss(emb, emb[pos_idx], emb[neg_idx]): L20/d:200
- sim, topk, matches, float().mean().item(): L20/d:158-161
- inner product on L2-normalised equals cosine: L20/d:164

## 零样本分类 (flow, 7 steps)
1. "a photo of a {class}" per class: L18/d:74
2. average templates, extra 1-3% top-1: L18/d:80
3. T shape (C, d): L18/d:75
4. I shape (1, d): L18/d:76
5. normalize both sides to unit length: M02/s:15
6. I @ T.T shape (1, C): L18/d:77
7. argmax predicted class: L18/d:78; warn when top-1 below 0.2: M02/s:18

## 代码中的任务 (task-table, 8)
- info_nce(z1, z2, tau=0.1): L17/c:5
- DinoHead teacher temp=0.04 with centre: L17/c:24, 39-41
- clip_loss(i, t, logit_scale): L18/c:25
- zero_shot_classify(model, image_feats, class_text_feats, class_names): L18/c:35
- semi_hard_negatives(emb, labels, margin=0.2): L20/c:12
- recall_at_k(query_emb, gallery_emb, query_labels, gallery_labels, k=1): L20/c:39
- infonce_loss(S): M02/c:43
- sigmoid_loss(S, bias=0.0): M02/c:64

## 默认值与数字 (defaults, 8)
- SimCLR tau 0.1, lower needs more negatives: L17/d:50, 167
- CLIP tau init 0.07, logit_scale 2.6592 = ln(1/0.07): L18/d:55, 115, L18/c:11
- SimCLR batch 512-8192: L17/d:53
- mask_ratio 0.75, BERT 15%: L17/d:90, 186
- MAE decoder 8-layer, 512-dim, encoder sees visible patches only: L17/d:83
- DINO m 0.996: L17/d:63
- teacher temp 0.04, student temp 0.1: L17/c:36, 39
- triplet margin 0.2, semi-hard margin 0.2: L20/c:6, 12

## 选择 FAISS 索引 (command-table, 8)
- IndexFlatIP / IndexFlatL2 brute force, exact, no training, up to ~1M: L20/d:87
- IndexFlatIP on cosine for 100k vectors: L20/d:91
- IndexIVFFlat K cells, needs training, 10M: L20/d:88, 91
- IndexHNSW graph, fastest for many queries, large index: L20/d:89
- IndexIVFPQ product quantisation, 100M+: L20/d:91
- DINOv2 + FAISS general retrieval: L20/d:209
- CLIP + FAISS text queries: L20/d:210
- Fine-tuned DINOv2 + FAISS instance, re-ID, e-commerce: L20/d:211

## 排障 (troubleshooting, 8)
- batch matters, SimCLR 512-8192, MoCo momentum queue: L17/d:13, 53
- collapse prevented by centring and sharpening: L17/d:66, 249
- 75% mask so extrapolation cannot solve it: L17/d:82, 95
- recall@10 > 0.95, recall@1 < 0.5, longer fine-tune or re-rank: L20/d:79
- mixing cosine and L2 changes nearest: L20/d:69
- instance-level needs fine-tuning with metric learning: L20/d:98
- easy triplets give zero loss, semi-hard mining: L20/d:60
- softmax needs all-gather, sigmoid does not: M02/d:61, 69

## 问题 (qa, 6)
- 75% vs 15%, low entropy patches: L17/d:88-95
- random pairs log(2N - 1) about 3.4 for 16 pairs: L17/d:181
- log(8) = 2.08 at random init: L18/d:170
- fine-tuning adds 2-5 points: L17/d:106
- outputs.last_hidden_state[:, 0], CLS token, 768-dim: L17/d:219-222
- probe beats zero-shot in domain, fine-tune can hurt zero-shot: M02/d:85
