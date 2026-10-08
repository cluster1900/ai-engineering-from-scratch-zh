# VLAs incorporados:RT-2, OpenVLA, π0, GR00T

> A primeira vez que um modelo da web leu o menu e executa no kitchen machine, foi RT-2 ((Google DeepMind, 2023 7 月) ⋅RT-2 vai fazer uma operação de separação em texto Token, em dados web com dados de ação robô, para co-finitura de VLM, demonstrando que a linguagem de visão em escala web conhecimento pode ser transferido para o controle de máquinas. OpenVLA ((OpenVLA)) em 6 de 2024 lançou uma referência aberta a 7B ⋅ Realização de P0 série de Inteligência Física ⋅ 2024-2025) para participar de especialistas em ação de correspondência de fluxo.

**Type:** 学习
**语言：**Python(stdlib, Tokenizer de ação + VLA 推理骨架)
**Prerequisites:** Phase 12 · 05（LLaVA），Phase 15（Autonomous Systems，已引用）
**Time:** ~180 分钟

## Objectivo de aprendizagem

- Descrição de tokenização de ação:离散 bin 编码(RT-2)、FAST 高效action Token、连续 flow-matching actions(π0)。
- Explicar por que os dados da web + robô são co-finados, para manter a transferência de conhecimento geral da nova missão.
- Em comparação com a mesma máquina, a operação de "OpenVLA" (OpenVLA) é uma operação de "openVLA" (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVLA) (OpenVL) (OpenV) (OpenV) (OpenV) (OpenV) (OpenV) (OpenV) (OpenV) (OpenV) (OpenV) (OpenV)) (OpenV)) (OpenV) (OpenV)) (OpenV)) (OpenV)) (OpenV)) (OpenV)) (en)) (en)) (en)) (en)) (en)) (en))
- Exposição ao conjunto de dados do Open X-Embodiment e seu papel como corpo de treinamento do RT-X:

## 问题

O modelo de VLA é usado como uma estrutura VLM semelhante à VQA, mas a saída não é texto, mas sim movimentos.

Desafios especiais da VLA:

1. 动作空间是连续的(angulos conjuntos、forças),并且高维(7-DOF braço + 3-DOF agarre = 10 dims a 30 Hz)
2. 机器人专用训练数据稀缺──Open X-Embodyment Há cerca de 1M trajetórias; Web text-image é 5B+──
3. Frequência de controle é fundamental. O ciclo de controle de 30 Hz significa que cada movimento é de apenas 33ms.
4. Segurança. Error operation will damage hardware.

## 概念

### Tokenization de ações (RT-2)

Técnicas do RT-2: colocar cada alvo conjunto em um token de texto posterior a quantificação.

Em dados mistos para PaLM-X VLM  realizar co-fina-tune:

- Pares de imagem-texto da web ((captioning、VQA)。
- Demonstrações de robôs, ação, demonstração para Token.

模型看 pick up the red cube(language)→ image(vision)→ 10-Token sequência de ação(discretos objetivos conjuntos)。Web pre-training 保留 geral-conhecimento transferência:

RT-2 论文中的推论为 3-5 Hz, limitada ao decódito autoregressivo VLM.

### OpenVLA  开放的 7B 参考实现

OpenVLA(Kim et al.,2024 年 6 月) é a "Open权重的 RT-2 等价物──7B Llama backbone,DINOv2 + SigLIP 双视觉编码器, baseada em tokenization de ação de 256 bins──

Em Open X-Embodiment 上 тренинг(跨 22 个机器人的 970k轨迹) ・附带 LoRA-fine-tuning 支持,用于适配新机器人──

Inferência: em A100, pode chegar a 4-5 Hz, mas não é adequado para o controle de alta frequência.

### FAST tokenizer  更快的动作解码

Pertsch et al. (pp.2024) apontam que a tokenização discreta bin 效率不高, pois a maioria dos movimentos se concentra em uma pequena área do espaço bin.

Uma trajetória de ação de 30 passos  transformar em cerca de 10 Tokens FAST, em vez de 300 Tokens discretos-bin──Inferência  velocidade de aumento de 3-5x, e não perder qualidade──

### π0 和 ações de correspondência de fluxo

Inteligência Física  π0(Black et al.,2024 年 10 月) us flow-matching action expert 替代离散 action Token:

- Um pequeno transformador de ação 读取 VLM's hidden states,并通过 rectified flow 输出连续的50-step action sequence──
- Cabeça de ação Utilize fluxo de correspondência perda  тренинг; VLM pretraining 保持不变。
- Inferência: sequência de ação completa em cerca de 5 passos de denotação, alcançando, na prática, 50 Hz 控制。

π0 的主张: em amplo conjunto de tarefas operacionais derrotar OpenVLA 和 Octo── contínua ação

π0.5 和 π0-FAST é aumento de escalação.

### GR00T N1  面向人形的双系统

NVIDIA's GR00T N1(2025 年 3 月) Face towards humanoid robots(>30 DOF, todo corpo) Construção:

- Sistema 2: grandes VLM 读取场景 + 指令,并以约1 Hz 产生高水平子目标──
- Sistema 1: Transformador de cabeça de ação pequeno, de acordo com os sub-objetivos  produzir comandos conjuntos de 50-100 Hz de nível baixo―

Esta separação entre o rápido pensamento e o lento pensamento de Kahneman:Sistema 2  planejamento,Sistema 1  execução.

GR00T N1.7(2025 anos de fim)改进了数据规模化──GR00T 使用来自Omniverse的真实数据 进行细调──

### O corpo X aberto

训练数据──RT-X(2023 年 10 月)汇集了22 数据集,覆盖了22 机器人上的1M轨迹──Open X-Embodiment是所有人使用的体库:

- ALOHA / Bridge V2 / Droid / RT-2 Kitchen / Language Table。
- Cada um deles é um "robot" de um estado, visualização de câmera, instrução, sequência de ação.
- 訓練卫生:统一行动空间、归一化关节范围、调整摄像机尺寸──

OpenVLA 和 π0 都在Open X-Embodiment 上训练──到任意特定机器人域空隙,可通过在100-1000 条任务专用演示上进行LoRA fine-tuning 来弥合──

### Co-ajuste perfeito com apenas robô

Co-fina-tuning irá combinar dados VQA da web com trajetórias de robôs 混合──比例很重要:VQA 太多,模型会忘记动作;robot data 太多,模型会丢失通用知识──

RT-2: aproximadamente 1:1──OpenVLA:web-to-robot 约 0.5:1──π0: análogo──精确比例是需要根据数据集大小调整的超参数──

Apenas robô 训练会产生任务专用模型,遇到出发的指令就会失败。Co-fine-tuning 的差异在于,模型不仅能处理 摘取红立方块(em demo) ,还能处理 摘取左边第三大物体 (em demo) ──

### Limite de segurança e de acção

Cada VLA de produção tem:

- 硬 joint limits ((( não pode exceder o torque de aplicação)
- Limite de velocidade (smooth clipping)
- Limite do espaço de trabalho (Final Effector Não pode sair da mesa)
- Para novas missões, utilizar a aprovação humana no ciclo.

Estes como controles de camada de controle estão localizados no exterior do VLA.


```figure
mm-action-tokens
```

## Use-o

`code/main.py`- Não .

- 实现 256-bin tokenization de ação 和 de-tokenization。
- Baseado em DCT + quantização 草拟 FAST tokenizer。
- Comparar: "Discret-bin"",FAST"",continuous-flow") em cada passo de ação
- 打印 RT-2 → OpenVLA → π0 → GR00T 的谱系摘要──

## Entrega-o

本课产 出 `outputs/skill-vla-action-format-picker.md` dado um trabalho de máquina ([[manipulação]], navegação]], corpo inteiro humanoide), em bin discreto + RT-2、FAST + OpenVLA、comparação de fluxo + π0 ou sistema dual + GR00T ¦

## 练习

1. Um braço de 10 DOF, com 30 Hz de frequência de controlo de operação. Tokenization discretos de 256 binos por segundo emitirá quantas tokens?

2. A tokenization FAST irá reduzir as trajetórias de 30 passos para cerca de 10 tokens. Se a trajetória contém movimentos de alta frequência, por exemplo, bater, o usuário perderá o que?

3. A cabeça de correspondência de fluxo de π0 em cerca de 5 passos é denotada. Comparar sua capacidade de transmissão com a decodificação autoregressiva de OpenVLA em 4-5 Hz.

4. Sistema 1 / Sistema 2 de GR00T 拆分对应 Kahneman── propôs um sistema diferente de separação(Sistema 3?), que pode ajudar a andar bipedal──

5. 阅读Open X-Embodiment Seção 4 关于数据集库化的内容──说出防止域名泄漏的三条库化规则──

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|----------|
| VLA | "Vision-language-action" | 接收 image + instruction 并输出 action commands 的模型 |
| Action tokenization | "Discrete bins" | 将连续 joint targets 量化为每个 dim 256 个 bin，每个 bin 是一个 vocab ID |
| FAST tokenizer | "Frequency action tokens" | DCT + quantize，将 30-step trajectories 压缩到约 10 个 Token |
| Co-fine-tune | "Mix web + robot" | 在 robot demos 旁边同时使用 web VQA data 训练，以保留通用知识 |
| Flow-matching action head | "π0 continuous output" | 小型 transformer，通过 rectified flow 输出 50-step action sequence |
| System 1 / System 2 | "Dual-system control" | 大型 VLM 慢速规划，小型 action head 快速行动；GR00T 模式 |
| Open X-Embodiment | "RT-X dataset" | 1M-trajectory 跨机器人 dataset；training corpus |

## 延伸阅读

- [Brohan et al. — RT-2 (arXiv:2307.15818)](https://arxiv.org/abs/2307.15818)
- [Kim et al. — OpenVLA (arXiv:2406.09246)](https://arxiv.org/abs/2406.09246)
- [Black et al. — π0 (arXiv:2410.24164)](https://arxiv.org/abs/2410.24164)
- [NVIDIA — GR00T N1 (arXiv:2503.14734)](https://arxiv.org/abs/2503.14734)
- [Open X-Embodiment Collab — RT-X (arXiv:2310.08864)](https://arxiv.org/abs/2310.08864)
