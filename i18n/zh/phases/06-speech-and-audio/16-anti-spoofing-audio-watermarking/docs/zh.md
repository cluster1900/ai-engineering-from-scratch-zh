# 语音反欺骗与音频水印  ASVspoof 5, AudioSeal, WaveVerify

> 语音系统需要两种东西:一个将真语音与假语音分类检测器 (AASIST,RawNet2) 和一个能经受压缩和编辑的水印 (AudioSeal) 两者都需要上线,否则就不要上线语音克隆――

**Type:** Build
**Languages:** Python
**先修要求：**阶段6 · 06 (扬声器识别),阶段6 · 08 (语音克隆)
**Time:** ~75 minutes

## 问题

三类相关防御:

1. **Anti-spoofing / deepfake detection.**给定一段音频,它是合成的还是真实的?ASVspoof基准(ASVspoof 2019 → 2021 → 5) 是黄金标准──
2. **Audio watermarking.**在生成音频中嵌不可知信号,检测器后可以提取它──AudioSeal(Meta) 和WavMark 是开放选项──
3. **Authenticated provenance.**对音频文件和元数据进行加密签名──C2PA /内容真实性倡议──

检测 处理不配合的对抗者──水标处理合规性,AI 生成的音频应被识别为这种音频──2026年两者都必需──

## 概念

![Anti-spoofing vs watermarking vs provenance — 三层防御](../assets/spoofing-watermark.svg)

### 美国国家标准标准5  2024-2025年

相比之前版本最大的变化:

- **Crowdsourced data**现实条件――
- **~2000 speakers**之前约有100人.
- **32 个 attack algorithms.**语音转换+反击性扰乱――
- **Two tracks.**独立检测;面向生物识别系统的伪造强大的ASV (SASV) ⋅

美国国家经济增长率:7.23% 美国经济增长率:7.23% 美国经济增长率:0.42% 美国经济增长率:7.23% 美国经济增长率:7.23% 美国经济增长率:7.23% 美国经济增长率:0.42% 美国经济增长率:7.23% 美国经济增长率:7.23% 美国经济增长率:7.23% 美国经济增长率:0.42% 美国经济增长率:0.42% 美国经济增长率:7.23% 美国经济增长率:7.23% 美国经济增长率:7.23% 美国经济增长率:7.23% 美国经济增长率:7.23% 美国经济增长率:0.42%

### 检测模型家族

**AASIST**现在是美国Spoof 5反措施任务的SOTA──

**RawNet2.**基于原始波形的卷积前端+TDNN背骨――更简单的基线;经过细调后仍有竞争力――

**NeXt-TDNN + SSL features.**2025 变体:ECAPA式+波浪LM功能+焦点损失──在ASVspoof 2019 LA上达到0.42%的EER──

### 音频密码  2024年默认水标

标签:**AudioSeal**标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签

- **Localized.**以 16 kHz 采样分辨率 ((1/16000s) 逐个检测水标──
- **Generator + detector jointly trained.**发电器学会 嵌入不可听信号;探测器学会在增强后找到它.
- **Robust.**能经受 MP3 / AAC 压缩,EQ,速度变化 ±10% 噪音混合 +10 dB SNR──
- **Fast.**探测器以485×实时运行;比WavMark快1000×──
- **Capacity.**可编码模型ID,生成时间,用户ID) 可嵌入每个语句.

### 波音标

无线电系统: 无线电系统:

- 时间的推移速度很慢.
- 可被高斯噪音或MP3压缩移除
- 不适合现实时.

### 波波验证 ()

解决AudioSeal的弱点,特别是时间操作(反转,速度) ・使用基于FiLM的发电机 +专家混合探测器――在标准攻击上与AudioSeal 竞争;能处理时间编辑――

### 对抗者利用的缺陷

来自AudioMarkBench:"在音调转移下,所有水标显示Bit恢复精度低于0.6,表明几乎完全删除. "**Pitch-shift 是通用攻击。**2026年没有任何水印能完全抵御激进的音速修改.

### 内容真实性倡议

不是ML技术,而是一个明显的形式――音频文件带着关于创建工具,作者,日期的加密签名元数据――Audobox/Seamless 使用它――适合原产地;但如果恶意行为者重新编码并剥离元数据,它就无力为力――


```figure
v4-audio-watermark
```

## 构建它

### 步骤1: 一个简单的光谱特征探测器 (玩具)

```python
def spectral_rolloff(spec, percentile=0.85):
    cum = 0
    total = sum(spec)
    if total == 0:
        return 0
    threshold = total * percentile
    for k, v in enumerate(spec):
        cum += v
        if cum >= threshold:
            return k
    return len(spec) - 1

def is_suspicious(audio):
    spec = magnitude_spectrum(audio)
    rolloff = spectral_rolloff(spec)
    return rolloff / len(spec) > 0.92
```

合成语音通常具有异常平坦的高频能量.

### 步骤 2: 音频密封嵌入+检测

```python
from audioseal import AudioSeal
import torch

generator = AudioSeal.load_generator("audioseal_wm_16bits")
detector = AudioSeal.load_detector("audioseal_detector_16bits")

audio = load_wav("generated.wav", sr=16000)[None, None, :]
payload = torch.tensor([[1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0]])
watermark = generator.get_watermark(audio, sample_rate=16000, message=payload)
watermarked = audio + watermark

result, decoded_payload = detector.detect_watermark(watermarked, sample_rate=16000)
# result: float in [0, 1] — probability of watermark presence
# decoded_payload: 16 bits; match against embedded payload
```

### 步骤3:评估 EER

```python
def eer(real_scores, fake_scores):
    thresholds = sorted(set(real_scores + fake_scores))
    best = (1.0, 0.0)
    for t in thresholds:
        far = sum(1 for s in fake_scores if s >= t) / len(fake_scores)
        frr = sum(1 for s in real_scores if s < t) / len(real_scores)
        if abs(far - frr) < best[0]:
            best = (abs(far - frr), (far + frr) / 2)
    return best[1]
```

### 步骤4: 生产集成

```python
def safe_tts(text, voice, clone_reference=None):
    if clone_reference is not None:
        verify_consent(user_id, clone_reference)
    audio = tts_model.synthesize(text, voice)
    audio_with_wm = audioseal_embed(audio, payload=build_payload(user_id, model_id))
    manifest = c2pa_sign(audio_with_wm, user_id, timestamp=now())
    return audio_with_wm, manifest
```

每次生成都包含: 1) 水标, 2) 签署的公告, 3) 符合保留政策的审计日志.

## 使用它

| Use case | Defense |
|----------|---------|
| 上线 TTS / voice cloning | 每个输出都Embedding AudioSeal（不可协商） |
| Biometric voice unlock | AASIST + ECAPA ensemble；liveness challenge |
| Call-center fraud detection | 对 20% 的来电样本运行 AASIST |
| Podcast authenticity | 上传时进行 C2PA signing，若为 AI-generated 则使用 AudioSeal |
| Research / training detectors | ASVspoof 5 train/dev/eval sets |

## 陷

- **Watermark 从未被 detector 运行检测。**没有意义.把探测器放进你的CI.
- **Detection 没有 calibration。**在美国,LA上训练的AASIST会过度;真世界准确率下降.
- **Pitch-shift gap.**激进的音速转移 会移除大多数水标――准备检测倒退――
- **Metadata strip-and-rehost.**通过重新编码,C2PA 很容易被转换.
- **把 liveness 当成 detection。**要求用户说一个随机短语――它可以阻止重播攻击,但不能阻止实时克隆――

## 交付它

保存为`outputs/skill-spoof-defender.md`◎为语音代码 部署选择检测模型、水印、来源表 和操作操作手册──

## 练习

1. **Easy.**运行`code/main.py`在合成音频上使用玩具探测器+玩具水印嵌入/检测
2. **Medium.**装备`audioseal`在 TTS 输出中嵌入16位实用载荷,再重新解码――用噪音破坏音频并测量位恢复精度――
3. **Hard.**在 ASVspoof 2019 LA 上细调 一个RawNet2或AASIST──测量EER──在一组持久的F5-TTS 生成片段上测试,观察OOD检测如何退化──

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| ASVspoof | benchmark | 两年一次的 challenge；2024 = ASVspoof 5。 |
| CM (countermeasure) | Detector | Classifier：真实语音 vs synthetic / converted。 |
| SASV | Speaker verif + CM | 集成的 biometric + spoof detection。 |
| AudioSeal | Meta watermark | Localized，16-bit payload，比 WavMark 快 485×。 |
| Bit Recovery Accuracy | Watermark survival | 攻击后恢复的 payload bits 比例。 |
| C2PA | Provenance manifest | 关于创建 / 作者身份的加密 metadata。 |
| AASIST | Detector family | 基于 graph-attention 的 anti-spoofing SOTA。 |

## 延伸阅读

- [Todisco et al. (2024). ASVspoof 5](https://dl.acm.org/doi/10.1016/j.csl.2025.101825) 当前的基准――
- [Defossez et al. (2024). AudioSeal](https://arxiv.org/abs/2401.17264)默认水标――
- [Chen et al. (2025). WaveVerify](https://arxiv.org/abs/2507.21150)面向时间攻击的MoE探测器.
- [Jung et al. (2022). AASIST](https://arxiv.org/abs/2110.01200) SOTA 检测脊柱──
- [AudioMarkBench (2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/5d9b7775296a641a1913ab6b4425d5e8-Paper-Datasets_and_Benchmarks_Track.pdf)强度评估──
- [C2PA specification](https://c2pa.org/specifications/specifications/)来源表格式──
