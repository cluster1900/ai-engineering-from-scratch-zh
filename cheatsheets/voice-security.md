---
id: voice-security
title: Speaker Verification, Spoofing and Watermarks
code: SV
subtitle: 注册、打分并设阈值判定说话人，检测伪造音频，并用水印和 C2PA 标记每次生成。
hue: 0
sources: phases/06-speech-and-audio/06-speaker-recognition-verification, phases/06-speech-and-audio/16-anti-spoofing-audio-watermarking, phases/18-ethics-safety-alignment/23-watermarking-synthid-stable-signature-c2pa
source_hash: 724639f70381c5ae
---

## 验证与标记
type: architecture
from: phases/06-speech-and-audio/06-speaker-recognition-verification/docs/en.md, phases/06-speech-and-audio/16-anti-spoofing-audio-watermarking/docs/en.md

```arch
node | test | 1,1 | Test utterance | 3 s or more | client
node | cm | 2,1 | Countermeasure | AASIST or RawNet2 | model
node | emb | 3,1 | Speaker encoder | ECAPA-TDNN, 192-d | model
node | score | 4,1 | Cosine score | threshold from a dev set | process
node | gen | 1,2 | TTS output | every generation | model
node | wm | 2,2 | AudioSeal | 16-bit payload | process
node | c2pa | 3,2 | C2PA manifest | signed metadata | store
node | enr | 4,2 | Enrollment | 3 to 5 clean clips, mean | store
edge | test | cm | real or fake
edge | cm | emb | real
edge | emb | score |
edge | enr | score | anchor
edge | gen | wm |
edge | wm | c2pa | sign
```

## 代码中的任务
type: task-table
from: phases/06-speech-and-audio/06-speaker-recognition-verification/docs/en.md, phases/06-speech-and-audio/16-anti-spoofing-audio-watermarking/docs/en.md, phases/18-ethics-safety-alignment/23-watermarking-synthid-stable-signature-c2pa/code/main.py
span: 2

| 任务 | 代码 |
|---|---|
| 验证说话人 | `verify(enroll, test, threshold=0.75)` |
| EER 及其阈值 | `eer(same_scores, diff_scores)` |
| 给会议做说话人分离 | `Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")` |
| 加载水印生成器 | `AudioSeal.load_generator("audioseal_wm_16bits")` |
| 检测水印 | `detector.detect_watermark(watermarked, sample_rate=16000)` |
| 玩具欺骗特征 | `spectral_rolloff(spec, percentile=0.85)` |
| 玩具文本水印 | `watermarked_sample(n, seed_prefix, bias=0.9)` |
| 绿色 token 的 z-score | `detect(tokens)` |

## 用 ECAPA 验证
type: annotated-code
lang: python
from: phases/06-speech-and-audio/06-speaker-recognition-verification/docs/en.md

```python
from speechbrain.pretrained import EncoderClassifier
clf = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb")
enroll = torch.stack([clf.encode_batch(load(x))           # 3-5 clean samples
                      for x in enrollment_clips]).mean(0)  # average them
score = clf.similarity(enroll, clf.encode_batch(load("test.wav"))).item()
verdict = score > 0.25                                     # tune on your data
```

## 嵌入并检测 AudioSeal
type: annotated-code
lang: python
from: phases/06-speech-and-audio/16-anti-spoofing-audio-watermarking/docs/en.md

```python
generator = AudioSeal.load_generator("audioseal_wm_16bits")
detector = AudioSeal.load_detector("audioseal_detector_16bits")
audio = load_wav("generated.wav", sr=16000)[None, None, :]
payload = torch.tensor([[1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0]])
watermark = generator.get_watermark(audio, sample_rate=16000, message=payload)
watermarked = audio + watermark
result, decoded_payload = detector.detect_watermark(watermarked, sample_rate=16000)
```

## 发出一次生成
type: flow
from: phases/06-speech-and-audio/16-anti-spoofing-audio-watermarking/docs/en.md

1. **同意**：有克隆参考时，先做 `verify_consent(user_id, clone_reference)`。
2. **合成**：`tts_model.synthesize(text, voice)`。
3. **水印**：`audioseal_embed(audio, payload=build_payload(user_id, model_id))`。
4. **签名**：`c2pa_sign(audio_with_wm, user_id, timestamp=now())` 给出 manifest。
5. **记录**：保留符合留存策略的审计日志。
6. **检查**：在 CI 里运行检测器。

## 公式
type: concepts
from: phases/06-speech-and-audio/06-speaker-recognition-verification/docs/en.md, phases/18-ethics-safety-alignment/23-watermarking-synthid-stable-signature-c2pa/docs/en.md, phases/18-ethics-safety-alignment/23-watermarking-synthid-stable-signature-c2pa/code/main.py, phases/06-speech-and-audio/16-anti-spoofing-audio-watermarking/docs/en.md

- **EER**：错误接受率等于错误拒绝率时的阈值。
- **AAM-softmax**：对正确类别用 $\cos(\theta + m)$。典型 $m = 0.2$，$s = 30$。
- **验证**：1:1。识别：1:N。开集：测试集中有未注册说话人。
- **绿名单**：对前 K 个 token 做哈希，给绿色 logit 加上 $\delta$。
- **z-score**：（绿色计数 - 期望）/ $\sqrt{n p (1 - p)}$，$p = 0.5$。
- **Bit Recovery Accuracy**：攻击后恢复的 payload 比特比例。

## 水印家族
type: concepts
from: phases/06-speech-and-audio/16-anti-spoofing-audio-watermarking/docs/en.md, phases/18-ethics-safety-alignment/23-watermarking-synthid-stable-signature-c2pa/docs/en.md

- **AudioSeal**：局部化，逐帧。能挺过 MP3、AAC、EQ、±10% 变速、+10 dB SNR 噪声。
- **WavMark**：32 bits/sec。高斯噪声或 MP3 压缩会去掉它。
- **WaveVerify**：FiLM 生成器，Mixture-of-Experts 检测器。能处理反转和变速。
- **Stable Signature**：微调过的图像解码器。解码器微调会去掉它。
- **SynthID-text**：有偏的下一 token 采样。释义改写会毁掉它。
- **音高变换**：所有水印的 Bit Recovery Accuracy 都低于 0.6。

## 数字
type: defaults
from: phases/06-speech-and-audio/06-speaker-recognition-verification/docs/en.md, phases/06-speech-and-audio/16-anti-spoofing-audio-watermarking/docs/en.md, phases/18-ethics-safety-alignment/23-watermarking-synthid-stable-signature-c2pa/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| ECAPA 嵌入 | 192-d | WavLM-large 是 256-d |
| ECAPA 阈值 | 0.25 | SpeechBrain 典型值，要调 |
| 注册样本 | 3-5 | 干净样本，取平均 |
| ECAPA 在 VoxCeleb1-O 上 | 0.87% | EER，15 M 参数 |
| ASVspoof 5 SOTA | ~7.23% | EER。野外预计 5-10% |
| AudioSeal payload | 16-bit | 16 kHz 下逐帧 |
| AudioSeal 检测器 | 485× realtime | 比 WavMark 快 1000× |
| 文本水印 z | 4 | z >= 4 是非常强的证据 |

## 缩写
type: glossary
from: phases/06-speech-and-audio/06-speaker-recognition-verification/docs/en.md, phases/06-speech-and-audio/16-anti-spoofing-audio-watermarking/docs/en.md, phases/18-ethics-safety-alignment/23-watermarking-synthid-stable-signature-c2pa/docs/en.md

- **ECAPA-TDNN**：1D conv、squeeze-excitation、注意力池化到 192-d。
- **PLDA**：Probabilistic LDA。在余弦之上做似然比打分。
- **AS-norm**：用一组冒充者队列归一化每个分数。
- **CM**：countermeasure。真实语音或合成语音。
- **SASV**：说话人验证加上 CM，组成一个生物识别系统。
- **AASIST**：在频谱特征上的图注意力。反欺骗 SOTA。
- **C2PA**：加密签名、防篡改的出处元数据。
- **SynthID**：用于文本、图像、音频和视频的水印。

## 排障
type: troubleshooting
from: phases/06-speech-and-audio/06-speaker-recognition-verification/docs/en.md, phases/06-speech-and-audio/16-anti-spoofing-audio-watermarking/docs/en.md, phases/18-ethics-safety-alignment/23-watermarking-synthid-stable-signature-c2pa/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 电话上 EER 升高 | 在 VoxCeleb 网络视频上训练 | 在目标信道上评估 |
| EER 急剧变差 | 测试音频不足 3 秒 | 拿到更长的测试音频 |
| 某个说话人的锚点失败 | 一次嘈杂的注册 | 对 3 个或更多干净样本取平均 |
| 幅度主导分数 | 嵌入未归一化 | 先做 L2 归一化 |
| 检测器在真实世界失败 | AASIST 在 ASVspoof LA 上过拟合 | 在你的域上校准 |
| 编辑后水印消失 | 激进的音高变换 | 保留检测兜底 |
| 转存后 manifest 丢失 | 剥离元数据并重新编码 | 也加上水印 |
| 文本水印消失 | 释义改写 | 不要单独依赖它 |

## 何时用 X
type: tips
from: phases/06-speech-and-audio/06-speaker-recognition-verification/docs/en.md, phases/06-speech-and-audio/16-anti-spoofing-audio-watermarking/docs/en.md

- 边缘上的闭集 1:1：ECAPA-TDNN 加余弦阈值。
- 云上的开集：WavLM-SV 加 AS-norm。
- 会议和播客：`pyannote/speaker-diarization-3.1`。
- 上线 TTS 或克隆：每个输出都打 AudioSeal。
- 语音解锁：AASIST 与 ECAPA 集成，外加活体挑战。
- 呼叫中心欺诈：对 20% 的通话抽样跑 AASIST。

## 问题
type: qa
from: phases/06-speech-and-audio/16-anti-spoofing-audio-watermarking/docs/en.md, phases/18-ethics-safety-alignment/23-watermarking-synthid-stable-signature-c2pa/docs/en.md, phases/06-speech-and-audio/06-speaker-recognition-verification/docs/en.md

- **水印还是检测器？** 都要。音高变换会去掉大多数水印。
- **活体口令能挡住克隆吗？** 它挡住重放，挡不住实时克隆。
- **没有 SynthID 信号就是真的？** 不是。其他模型不会加它。
- **为什么既要 C2PA 又要水印？** 元数据丰富但可剥离。水印能留下，但只携带比特。
- **报告 EER 时还报什么？** EER 以及 EER 处的阈值。
