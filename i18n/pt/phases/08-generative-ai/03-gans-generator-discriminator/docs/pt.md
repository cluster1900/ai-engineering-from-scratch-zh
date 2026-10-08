# GANs  Generador vs Discriminador

> Bom amigo, em 2014 as técnicas foram completamente saltadas sobre a densidade. Duas redes. Uma fabricação de falsos. Um os pega. Eles se opõem uns aos outros até que falsos e amostras reais não podem ser distinguidos.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 08 (Optimizers), Phase 8 · 02 (VAE)
**Time:** ~75 minutes

## 问题

Os VAEs geram amostras confusas, porque a perda de decodificador MSE delas é a melhor para as imagens Bayes, enquanto a média de muitos números razoáveis é um número confuso. Você quer uma perda de recompensa* razoável, em vez de uma recompensa com um objetivo no nível pixel-wise.

Ideia de um bom amigo: treinar um classificador `D(x)`Para distinguir imagens reais e falsas. Treinar um gerador.`G(z)`Para enganar .`D`- Não.`G`O sinal de perda é:`D`Quando pensamos que algo parece real,`G`Melhore, este sinal também será atualizado, perseguindo um objetivo móvel.`G`É o que nunca escrevi.`log p(x)`Em caso de aprendizagem, a distribuição de dados.

É um jogo de adversários.

```
min_G max_D  E_real[log D(x)] + E_fake[log(1 - D(G(z)))]
```

Até 2026, os GANs já não são geradores de SOTA (difusão e correspondência de fluxo) mas o StyleGAN 2/3 continua sendo o modelo de rosto mais lucrativo publicado, os discriminadores GAN são utilizados para treinamento de difusão em *perdas perceptivas*, enquanto o treinamento adversário é apoiado em distillações rápidas em 1 passo (SDXL-Turbo, SD3-Turbo, LCM), permitindo que você possa entregar difusão em tempo real).

## 概念

![GAN training: generator and discriminator in minimax](../assets/gan.svg)

**Generator `G(z)`。**Vector de ruído`z ~ N(0, I)`映射到样品 `x̂`△ um decodificador 形状的网络(dense 或 transposed conv) △

**Discriminator `D(x)`。**A amostra será projetada para probabilidade escalar (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) ▽ (s) (s) (s) ▽ (s) (s) (s) (s) (s) ▽ (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) ) (s)

**Loss。**两个交替更新:

- **训练 `D`：** `loss_D = -[ log D(x) + log(1 - D(G(z))) ]`◊对 real=1, fake=0 fazer entropia binária cruzada.
- **训练 `G`：** `loss_G = -log D(G(z))`这是好友 使用的 *non-saturating* 形式(原始的 `log(1 - D(G(z)))`Vai saturar-se e vai-se`D`Muito confiante, quando a gente está a matar gradientes.

**Training loop。**Uma etapa`D`, passo a passo `G`- Não, não.

**为什么它能工作。**Se `G`完美匹配 `p_data`- Então ?`D`Fazer melhor que adivinhar, e fazer melhor que sair 0,5;`G`Não se consegue mais obter gradiente.

**为什么它会失效。**Colapso de modo`G`找到一个 `D`Não posso distinguir o modo, e depois, sempre, o fazer.`D`Aprendi muito depressa.`log D`Saturações) ̳instabilidade do treino ̳tas de aprendizagem ̳tama de lote ̳qualquer coisa) ̳

## 让 GANs Variantes utilizáveis

| Year | Innovation | Fix |
|------|------------|-----|
| 2015 | DCGAN | Conv/deconv、batch norm、LeakyReLU —— 第一个稳定 architecture。 |
| 2017 | WGAN, WGAN-GP | 用 Wasserstein distance + gradient penalty 替换 BCE。修复 vanishing gradient。 |
| 2017 | Spectral normalization | 对 discriminator 做 Lipschitz-bound。2026 年的 discriminators 中仍在使用。 |
| 2018 | Progressive GAN | 先训练低分辨率，再添加 layers。首次达到 megapixel results。 |
| 2019 | StyleGAN / StyleGAN2 | Mapping network + adaptive instance norm。固定领域 photorealism 的 state of the art。 |
| 2021 | StyleGAN3 | Alias-free、translation-equivariant —— 2026 年仍然是 face gold standard。 |
| 2022 | StyleGAN-XL | Conditional、class-aware、更大 scale。 |
| 2024 | R3GAN | 以更强 regularization 重新包装；无需 tricks 即可在 1024² 上工作。 |


```figure
gan-minimax
```

## Construí-lo

`code/main.py`Em dados 1-D 上训练一个小型GAN:两个高西亚的混合物──发电机和分辨器 都是单隐藏层MLPs──我们手写实现前进、后退 和最小x loop──目标是看两个关键失败模式──模式崩 +渐变消失) 如何发生──

### 步骤 1: perda não saturante

Vanilla Goodfellow perda`log(1 - D(G(z)))`A concentração de G em G é de alta confiança, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração, o G é de baixa concentração.`-log D(G(z))`具有相反的表情: Quando D 很自信时它会爆增, dá a G um sinal forte.

```python
def g_loss(d_fake):
    # maximize log D(G(z))  <=>  minimize -log D(G(z))
    return -sum(math.log(max(p, 1e-8)) for p in d_fake) / len(d_fake)
```

### Passo 2: Cada passo gerador é um passo discriminatório

```python
for step in range(steps):
    # train D
    real_batch = sample_real(batch_size)
    fake_batch = [G(z) for z in sample_noise(batch_size)]
    update_D(real_batch, fake_batch)

    # train G
    fake_batch = [G(z) for z in sample_noise(batch_size)]  # fresh fakes
    update_G(fake_batch)
```

给 G 用新品假冒,否则梯度 会过期──

### 步骤 3: 观察 modo colapso

```python
if step % 200 == 0:
    samples = [G(z) for z in sample_noise(500)]
    mode_a = sum(1 for s in samples if s < 0)
    mode_b = 500 - mode_a
    if min(mode_a, mode_b) < 50:
        print("  [!] mode collapse: one mode is starved")
```

经典症状: Em dois modos reais, um para ser gerado. Discriminador não o corrige mais, porque nunca foi considerado falso.

## 陷

- **Discriminator 太强。**A taxa de aprendizagem de D                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
- **Generator 记住了一个 mode。**给 D inputs加 noise, use minibatch-discriminator layer,或切换到WGAN-GP──
- **Batch norm 泄漏 statistics。**Batch real + batch falso 流经同一个BN layer 会混合它们的统计――改用实例规范或光谱规范――
- **Inception-score gaming。**FID 和 IS em baixa contagem de amostras.
- **对于 conditional tasks，one-shot sampling 是谎言。**Ainda precisas de escalas CFG, truques de truncamento e re-sampulação para obter resultados disponíveis.

## Use-o

Estaca de GAN de 2026:

| Situation | Pick |
|-----------|------|
| Photoreal human faces, fixed pose | StyleGAN3（最锐利、最小） |
| Anime / stylized faces | StyleGAN-XL 或 Stable Diffusion LoRA |
| Image-to-image translation | Pix2Pix / CycleGAN（Phase 8 · 04）或 ControlNet（Phase 8 · 08） |
| Fast 1-step text-to-image | diffusion 的 adversarial distillation（SDXL-Turbo, SD3-Turbo） |
| Perceptual loss inside a diffusion trainer | image crops 上的小型 GAN discriminator |
| Anything multi-modal, open-ended | 不要用 —— 使用 diffusion 或 flow matching |

GANs 利但狭窄── once your domain 打开, e.g. fotos、任意 text prompt、video,就切换到 diffusion──adversarial trick 作为组件继续存在(perceptual losses、distillation),而不是独立生成器──

## Entrega-o

保存 `outputs/skill-gan-debugger.md` Habilidade de receber uma vez uma execução GAN fracassada (perdas de curvas, grelhas de amostra, tamanho do conjunto de dados), e de fazer saídas de acordo com a probabilidade de sequência de causas, correções de linha única e protocolo de repetição.

## 练习

1. **Easy。**Utilize默认设置运行 `code/main.py`。 Então, configuração `D_LR = 5 * G_LR`Não voltar a funcionar. Perda de G.
2. **Medium。**Utilize perda WGAN  substituir perda Goodfellow BCE:`loss_D = E[D(fake)] - E[D(real)]`- Não .`loss_G = -E[D(fake)]`, e vai fazer o clip de peso de D até `[-0.01, 0.01]`◊ Treinamento é mais estável? Comparado com a convergência do relógio de parede ◊
3. **Hard。**Para ampliar o exemplo 1-D para os dados 2-D ((8 √ Gaussians mistura) ∞ seguimento gerador em etapas 1k、5k、10k ∞ capturar 8 ∞ modos ∞ implementar a discriminação de minibatch ∞ re-medida ∞

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Generator | "G" | noise-to-sample network，`G: z → x̂`。 |
| Discriminator | "D" | Classifier `D: x → [0, 1]`，real vs fake。 |
| Minimax | "The game" | joint objective 的 `min_G max_D`。 |
| Non-saturating loss | "The fix" | 对 G 使用 `-log D(G(z))`，而不是 `log(1 - D(G(z)))`。 |
| Mode collapse | "G memorized one thing" | 尽管 data 多样，Generator 只产生少量不同 outputs。 |
| WGAN | "Wasserstein" | 用 Earth-Mover distance + gradient penalty 替换 BCE；gradient 更平滑。 |
| Spectral norm | "Lipschitz trick" | 约束 D 的 weight norms 来 bound 它的 slope；稳定 training。 |
| StyleGAN | "The one that works" | Mapping network + AdaIN；faces 领域 best-in-class，2026 年仍然如此。 |

## Nota de produção: inferência de um tiro é GAN de

GANs em qualidade de amostra de geração de domínio aberto 上不再获胜, mas eles ainda estão em custo de inferência 上获胜;;

- **没有 prefill，没有 decode stages。**Uma vez.`G(z)`Passagem avançada.
- **没有 KV-cache pressure。**O único estado é o peso. O tamanho do lote é limitado pela memória de ativação.
- **Trivial continuous batching。**Como cada pedido consome os mesmos FLOPs fixos, o servidor geralmente é o melhor. Não é necessário um agendador de voo.

É por isso que a destilação GAN (SDXL-Turbo, SD3-Turbo, ADD, LCM) é um processo de texto-imagem rápido de 2026 的主导技术: ele reduz o fluxo de difusão de 20 a 50 passos para 1 a 4 passes avançadas no estilo GAN, mantendo a distribuição da base de difusão.

## 延伸阅读

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) Origins GAN papel。
- [Radford et al. (2015). Unsupervised Representation Learning with DCGAN](https://arxiv.org/abs/1511.06434) 第一个稳定建筑──
- [Arjovsky, Chintala, Bottou (2017). Wasserstein GAN](https://arxiv.org/abs/1701.07875) WGAN。
- [Miyato et al. (2018). Spectral Normalization for GANs](https://arxiv.org/abs/1802.05957) SN。
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) StyleGAN2──
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423)- É o que é?
- [Sauer et al. (2023). Adversarial Diffusion Distillation](https://arxiv.org/abs/2311.17042) SDXL-Turbo。
