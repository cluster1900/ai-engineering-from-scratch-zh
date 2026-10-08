# Data Provenance e treinamento de dados

> A Lei da UE sobre IA exige que os desenvolvedores publiquem um resumo de um conjunto de dados que contenha 12 segmentos obrigatórios de dados. A DPA sobre tendências de interesse legítimo no ano de 2025: DPC irlandesa.

**类型：**- aprendizagem
**语言：**Python(stdlib,12 字段 California AB 2013 脚手架生成器)
**先修要求：**Fase 18 · 24(监管),Fase 18 · 26(cartas)
**时间：**- 60 minutos.

## Objectivo de aprendizagem

- Descrição do California AB 2013 para o treinamento de IA Gerativa DATA Transparency Regulation 12 个强制字段──
- Explicar o DPA de 2025 para o LLM de interesse legítimo  training立场(Irlandês DPC、UK ICO、Hamburg、Cologne)
- 描述不可逆问题:为什么GDPR 删除权对已训练的神经网络 没有实际等价物──
- Concordância em Crises 发现──

## 问题

訓練データ管理是每一張模型卡 (Lessão 26) 和监管义务 (Lessão 24) 上游──2024-2025 年, a estrutura de supervisão envolve três princípios:

## 概念

### California AB 2013

Seção 3111 (a) Requer que os desenvolvedores publiquem um resumo de alto nível do conjunto de dados para treinamento, e contém 12 projetos legais:
1. Fonte ou proprietário de dados
2. Informações sobre como promover a IA  sistemas   objetivos previstos:
3. Número de pontos de dados em dados em conjunto (incluindo o número de pontos de dados em dados em conjunto)
4. Número de dados: (exemplo: "Não há dados sobre o número de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de um conjunto de dados de dados de um conjunto de dados de um conjunto de dados de dados de um conjunto de dados de dados de um conjunto de dados de dados de um conjunto de dados de dados de um conjunto de dados de dados de dados de um conjunto de dados de dados de dados de um conjunto de dados de dados de dados de dados de um conjunto de dados de dados de dados de dados de dados de um conjunto de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados
5. O conjunto de dados contém-se em qualquer dado protegido por direitos autorais, marcas ou patentes, ou pertence-se inteiramente ao domínio público?
6. O número de dados é de:
7. Número de dados que contenham informações pessoais (conforme o Código Civil da Califórnia, §1798.140 (v))
8. O número de dados é o número de dados de consumo agregados, conforme o código civil da Cal. § 1798.140 (b))
9.  a limpeza, tratamento ou outras modificações efectuadas pelo desenvolvedor, bem como os objectivos previstos.
10. Se a recolha ainda estiver em curso, é necessário indicar:
11. Database data de primeira utilização no processo de desenvolvimento.
12. 系统是否使用或持续使用合成数据生成──

Seção 12 项 (dados sintéticos) Relativamente a Gebru 等人 2018 anos de fichas de dados ▌ são novos conteúdos.

### Lei da UE sobre IA (Lessão 24)

A excepção à Directiva de Direitos de Autor da UE para a extração de textos e dados permite a realização de treinamentos sobre conteúdos de uso público, a menos que os direitos autorais optam por não participar.

### Tendências de DPA para o interesse legítimo de 2025

O Conselho Europeu de Administração e de Desenvolvimento (CEDEAO) de Londres, em 15 de março de 2015, aprovou um acordo com a Comissão Europeia sobre a aplicação da legislação em matéria de segurança social e de segurança social (CEDEAO) e a Comissão Europeia (CE) de Administração e de Desenvolvimento Social (CE) de Londres (CE) de 20 de março de 2015, que estabelece um acordo sobre a aplicação da legislação em matéria de segurança social e segurança social e de segurança social.

趋同原则: interesse legítimo pode ser baseado em conteúdo de primeira mão de uso público e fornecer treinamento de opção de saída para fornecer razões justificadas.

### ANPD brasileiro(2024 年 6 月)

Por falta de transparência da informação, a meta suspendeu o tratamento dos dados dos utilizadores brasileiros para a formação de IA.

### Infelizmente

O consentimento de cookie é projetado para rastrear em tempo real e reversível. Os dados de treinamento são diferentes: uma vez que os dados entram em pesos do modelo, é impossível realizar a remoção de forma extra-clínica.

部分补救:
- **Unlearning。**近似移除;通過 MIA 衡量 (Lessão 22)
- **基于 influence function 的定位。**Identificação dos maiores pesos que podem influenciar os dados; seleção e actualização.
- **Fine-tune-suppression。**O modelo de treinamento recusa a saída de fontes de dados do conteúdo.

Estes métodos não podem resolver completamente o problema.

### Iniciativa de Provença de Dados

dataprovenance.org──Longpre、Mahari、Lee 等,Consent in Crisis(7 月 2024 年): auditoria em larga escala do commons de dados de treinamento de IA ∞.

### Está na fase 18 .

Lição 26 é modelo de classe de documentos. Lição 27 é dados conjunto de classe de gestão.


```figure
an-provenance-oneway
```

## Use-o

`code/main.py`Será feito para um conjunto de dados de brinquedo.

## Entrega-o

本课会产出 `outputs/skill-provenance-check.md` Determinar um conjunto de dados para treino, que irá examinar AB 2013 12 字段覆盖、opt-out  infraestrutura compliance、DPA 对齐, bem como avaliação de risco irreversível。

## 练习

1. 运行 `code/main.py`◊ Para um conjunto de dados de brinquedo 生成 12 字段摘要,并识别哪些字段说明不足──

2. A Diretiva TDM sobre o Direito de Autor da UE propõe um formato padrão de opção de opção de opção, e o define como um sistema de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção de opção.

3. 阅读 Data Provenance Initiative's Consent in Crisis(2024 年 7 月) ⋅ descrição limitação de crescimento mais rápido de três conteúdos,并论证一个经济后果──

4. 2025 DPA para a aceitação de interesses legítimos em uso de treinamento de conteúdo público.

5. 勾勒一个训练数据来源宣言,使它能够与AB 2013 字段以及每个数据集的C2PA-signed provenance chain 组合――identificar um obstáculo tecnológico e um obstáculo legal――

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|-----------------|------------------------|
| AB 2013 | “the California law” | Generative AI 训练数据透明度；12 个强制字段 |
| TDM exception | “text-and-data-mining” | EU Copyright Directive 中带 opt-out 的训练数据例外 |
| Legitimate interest | “the EU basis” | 可能为公共内容训练提供正当理由的 GDPR Article 6 依据 |
| Opt-out signal | “machine-readable no-train” | robots.txt、C2PA “No AI Training”、TDM.Reservation |
| Irreversibility | “cannot un-train” | model weights 中的数据无法被外科式移除 |
| Unlearning | “approximate removal” | 训练后干预，用于降低模型对特定数据的依赖 |
| Consent in Crisis | “the DPI audit” | 2024 年 7 月关于 robots.txt 限制加速增长的发现 |

## 延伸阅读

- [California AB 2013](https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB2013) Artificial Intelligence gerativo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
- [EU AI Act + GPAI Code of Practice (Lesson 24)](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) Direito de autor 章节
- [Longpre, Mahari, Lee et al. — Consent in Crisis (dataprovenance.org, July 2024)](https://www.dataprovenance.org/consent-in-crisis-paper) Auditoria do IPD
- [IAPP — EU Digital Omnibus GDPR amendments (2025)](https://iapp.org/news/a/eu-digital-omnibus-amendments-to-gdpr-to-facilitate-ai-training-miss-the-mark) 监管背景
