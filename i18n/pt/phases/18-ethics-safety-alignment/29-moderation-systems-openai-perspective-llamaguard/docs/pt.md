# 内容审核系统  OpenAI, Perspective, Guarda Lama

> Os sistemas de moderação de nível de produção vão definir políticas de segurança em lições 12-16 操作化。OpenAI Moderation API:`omni-moderation-latest`(2024)  baseado em GPT-4o, pode ser usado em uma única consulta para texto + imagens 分类; em多语言测试集上上上一版本提升 42%; esquema de resposta 返回 13 个类别布鲁尔语  assédio, assédio/ameaça, ódio, ódio/ameaça, ilícito, ilícito/violento, auto-harmagem/intentão, auto-harmagem/instruções, sexual, sexual/minor, violência, violência/grafica; em relação à maioria dos desenvolvedores 免费。Layer retirado padrões: Moderação de entrada (pre-geração) ‧Moderação de saída (pós-geração) ‧Moderação de usuário (regras de domínio) ‧Assincronização de conteúdo paralela chamada de latência ocultação; Lefensores de segurança Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legitores Legores Legores Legores Legores Legores Legores Legores Legores Legores Legores Legores Legores Legores Legores Legores Legores Legores Legores Legores Legores Legores Leg

**Type:** Build
**Languages:** Python (stdlib, three-layer moderation harness)
**前置要求：**Fase 18 · 16 (Llama Guard / Garak / PyRIT)
**Time:** ~60 minutes

## Objectivo de aprendizagem
- Descreva a taxonomia de categoria da OpenAI Moderation API, bem como o conjunto de MLCommons da Llama Guard 3
- 描述三级调节模式 ((input、output、custom),并指出每一层的一个失败模式──
- Descrever a API de perspectiva como a linha de base da era pré-LLM, bem como por que ainda é usada para o estudo.
- Explicar a linha de tempo de depreciação do Azure.

## 问题
Lições 12-16  Descrição de ataques e ferramentas de defesa  Lição 29                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

## 概念
### API de Moderação OpenAI

`omni-moderation-latest`(2024) ・ Baseado em GPT-4o ・ uma vez调用即可对文本 +图像 分类──对大多数开发者免费──

Categorias ((esquema de resposta 中的 13 个布鲁尔语):
- acoso, acoso/ameaça
- ódio, ódio/ameaça
- Auto-leão, auto-leão/intenção, auto-leão/instruções
- Sexual, sexual/menores
- Violência, violência/grafica
- Ilícito, ilícito/violento

Apoio multimodal 适用于 `violence`- Não.`self-harm`和 `sexual`, mas não é aplicável `sexual/minors`; rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema rema

Em`code/main.py`Para ensinar a simplicidade, vamos.`/threatening`- Não.`/intent`- Não.`/instructions`和 `/graphic`Subcategorias  Folding para os pais de nível superior de eles。 Produzir código deve usar um esquema completo de 13 categorias。

Em vários idiomas, o nível de moderação é de 42% mais elevado do que na última geração.

### Guarda de lama 3/4

已在教学16 覆盖──14 个 MLCommons hazard categories(组织方式不同于OpenAI's 13 个响应方案布鲁尔语)──支持 8语言 (v3)──Llama Guard 4 (2025 年 4 月) 原生支持多模,12B──

As taxonomias de OpenAI e Llama Guard têm sobreposição, mas também diferenças. A OpenAI será "ilícita" como uma categoria ampla; a Llama Guard será "crimes violentos" e "crimes não violentos" divididos.

### API de perspectiva (Google Jigsaw)

O sistema de pontuação de toxicidade do LLM como moderador 浪潮(pre-2020)

É amplamente usado como base de pesquisa de moderação de conteúdo, pois essa API está estável, tem arquivo e possui dados de calibração de vários anos.

### O padrão de três camadas

1. **Input moderation.**Na geração 前对用户提示 分类──若标记,则拒绝──延迟:一次分类器调用──
2. **Output moderation.**Em entrega 前对模型输出 分类──如果标记,则替换为拒绝──延迟:代后一次分类器调用──
3. **Custom moderation.**Regras específicas de domínio (regex, autorizados, política empresarial)

Este três níveis de design são sequenciais: moderação de entrada  deve ser realizada na geração anterior, moderação de saída na geração posterior.

### Modos de falha

- **Input only.**捕捉不到 output hallucinations (Lessão 12-14 de codificação de ataques irá contornar os classificadores de entrada)
- **Output only.**允许 qualquer entrada até o modelo; aumentar os custos; expô-lo ao atacante expor o raciocínio interno―
- **Custom only.**无法稳健覆盖各类类别;regexes 很脆弱──

Em camadas é um método de "emagrecimento".

### Deprecação do Azure

Moderador de Conteúdo do Azure: 2024 ano 2 月 depreciado,2027 ano 2 月 aposentado.

### Onde isto encaixa na Fase 18

Lição 16 em contexto de equipe vermelha 中覆盖 умерентование инструментали­sing──Lessão 29 覆盖 развернуто умерен­ция──Lessão 30 以当前双用途能力证据 收尾──


```figure
an-moderation-layers
```

## Use-o
`code/main.py`构建一个三层调节器:输入调节器 (input moderator) 关键词 +类别分数) 输出调节器 (output moderator) 对于输出使用相同的分类器) 定制调节器 (custom moderator) 域规则 (域规则) ⋅ Você pode fazer as entradas 跑过它,并观察哪一层捕捉到了什么──

## Entrega-o
本课产 出 `outputs/skill-moderation-stack.md` Para determinar uma implementação, ele irá recomendar configuração de stack de moderação: entrada, utilização de um classificador, saída, utilização de um classificador, utilização de regras personalizadas, bem como casos de borda, utilização de um juiz 

## 练习
1. 运行 `code/main.py` vai ser benigna, limite e entrada prejudicial                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

2. 扩展 harness,加入针对特定类别的 Perspective-API-style toxicity scoring── comparar seu comportamento limiar com o score de categoria──

3. 阅读OpenAI Moderation API docs 和 Llama Guard 3 categoria lista。将每个 OpenAI categoria 映射到最接近的Llama Guard categories──找出三个无法干净映射的类别──

4. Para a implementação de assistentes de código (por exemplo, GitHub Copilot) desenhar uma pilha de moderação, identificar as categorias mais relacionadas e mais não relacionadas, e apresentar regras personalizadas.

5. Moderador de Conteúdo do Azure vai aposentar-se em 2027 e planejar-se para a Segurança de Conteúdo do Azure AI.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| OpenAI Moderation | "omni-moderation-latest" | 基于 GPT-4o 的 13-category (text) classifier，带部分 Multimodal support |
| Perspective API | "Google Jigsaw toxicity" | Pre-LLM-era toxicity scoring baseline |
| Llama Guard | "MLCommons 14-category" | Meta 的 hazard classifier（v3：8B text，8 langs；v4：12B Multimodal） |
| Input moderation | "pre-generation filter" | model call 前作用于 user prompt 的 classifier |
| Output moderation | "post-generation filter" | delivery 前作用于 model output 的 classifier |
| Custom moderation | "domain rules" | Deployment-specific rules（regex、allowlist、policy） |
| Layered moderation | "all three layers" | 标准生产部署模式 |

## 延伸阅读
- [OpenAI Moderation API docs](https://platform.openai.com/docs/api-reference/moderations) ponto final de omni-moderação
- [Meta PurpleLlama + Llama Guard](https://github.com/meta-llama/PurpleLlama) Llama Guard repo
- [Google Jigsaw Perspective API](https://perspectiveapi.com/) pontuação da toxicidade
- [Azure AI Content Safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/) Substituição do Azure
