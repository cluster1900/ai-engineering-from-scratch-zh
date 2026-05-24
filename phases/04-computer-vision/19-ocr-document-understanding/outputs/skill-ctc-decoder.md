---
name: skill-ctc-decoder
description: 从零编写 greedy 和 beam-search CTC decoders，包括 length normalisation
version: 1.0.0
phase: 4
lesson: 19
tags: [ocr, ctc, decoding, sequence-models]
---

# CTC Decoder

为 CTC outputs 生成两个 decoding routines：greedy（快）和 beam（对 noisy inputs 更好）。

## 何时使用

- 在自定义 CRNN outputs 上运行 OCR inference。
- 针对不同 decoders benchmark 一个 pretrained OCR model。
- 在不引入 ctcdecode 的情况下实现一个简单的 beam search。

## 输入

- `log_probs`: (T, N, C) vocab 上的 log-softmax（按约定 index 0 = blank）。
- `vocab`: C 个 characters 的列表。
- `beam_width`（仅 beam）：通常为 5-10。

## Greedy decoder

```python
def greedy_ctc_decode(log_probs, vocab, blank=0):
    preds = log_probs.argmax(dim=-1).transpose(0, 1).cpu().tolist()
    out = []
    for seq in preds:
        decoded = []
        prev = None
        for idx in seq:
            if idx != prev and idx != blank:
                decoded.append(vocab[idx])
            prev = idx
        out.append("".join(decoded))
    return out
```

## Beam search decoder

```python
import heapq
import math

def beam_ctc_decode(log_probs, vocab, beam_width=5, blank=0):
    T, N, C = log_probs.shape
    lp = log_probs.cpu()
    results = []
    for n in range(N):
        beams = {("",): (0.0, -math.inf)}  # (prefix_tuple) -> (p_blank, p_nonblank)
        for t in range(T):
            logits_t = lp[t, n]
            new_beams = {}
            for prefix, (p_b, p_nb) in beams.items():
                for c in range(C):
                    p = logits_t[c].item()
                    if c == blank:
                        nb = p_b + p
                        nnb = p_nb + p
                        upd = new_beams.get(prefix, (-math.inf, -math.inf))
                        new_beams[prefix] = (
                            _logsumexp(upd[0], _logsumexp(nb, nnb)),
                            upd[1],
                        )
                    else:
                        last = prefix[-1] if prefix else ""
                        char = vocab[c]
                        if char == last:
                            # Case 1: stay on same prefix (collapse from p_nb)
                            upd = new_beams.get(prefix, (-math.inf, -math.inf))
                            new_beams[prefix] = (upd[0], _logsumexp(upd[1], p_nb + p))
                            # Case 2: extend prefix via blank-separated repeat ("a_a" -> "aa")
                            new_prefix = prefix + (char,)
                            upd = new_beams.get(new_prefix, (-math.inf, -math.inf))
                            new_beams[new_prefix] = (upd[0], _logsumexp(upd[1], p_b + p))
                        else:
                            new_prefix = prefix + (char,)
                            upd = new_beams.get(new_prefix, (-math.inf, -math.inf))
                            nb = _logsumexp(p_b, p_nb) + p
                            new_beams[new_prefix] = (upd[0], _logsumexp(upd[1], nb))
            beams = dict(heapq.nlargest(
                beam_width,
                new_beams.items(),
                key=lambda kv: _logsumexp(kv[1][0], kv[1][1]),
            ))
        best = max(beams.items(), key=lambda kv: _logsumexp(kv[1][0], kv[1][1]))[0]
        results.append("".join(best))
    return results


def _logsumexp(a, b):
    if a == -math.inf: return b
    if b == -math.inf: return a
    m = max(a, b)
    return m + math.log(math.exp(a - m) + math.exp(b - m))
```

## 规则

- 按照 PyTorch 的 `nn.CTCLoss` 约定，CTC 中的 blank index 为 0。
- Beam search 可以提升 low-confidence inputs 上的 accuracy；在 clean inputs 上提升小于 1% CER。
- 绝不要把 beam 剪枝到低于 5；在此以下 accuracy-latency trade 会趋于平坦。
- 当在严格 latency budget 内运行 beam search 时，降级到 greedy；在大多数 production OCR data 上 quality hit 很小。
- 对于大 vocabularies（包含 3000+ characters 的 CJK），改用 `ctcdecode`（C++），而不是上面的 pure Python version；Python beam 很快会成为 bottleneck。
