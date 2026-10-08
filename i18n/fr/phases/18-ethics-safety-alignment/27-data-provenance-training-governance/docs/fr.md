# Provenance des données et gestion des données

> La loi sur l'IA de l'UE exige que les développeurs publient un résumé de 12 séries obligatoires de données sur l'IA de 2025 concernant les tendances d'intérêt légitime: DPC irlandais: 21 mai 2025.) Après avoir accepté l'avis de l'EDPB, Meta en vertu de mesures de garantie, utilisent la première partie publique de l'UE/EEE pour effectuer des entraînements LLM sur le contenu des utilisateurs adultes; Cour régionale supérieure de Cologne: 23 mai 2025.) interdiction de rejet; Hambourg DPA: non abandonner des informations sur les problèmes d'urgence; ICO UK: 23 septembre 2025.

**类型：**Apprendre à apprendre
**语言：**Python(stdlib,12 字段 Californie AB 2013 脚手架生成器)
**先修要求：**La phase 18 · 24(监管), la phase 18 · 26(cartes)
**时间：**- 60 minutes

## Objectif de l'apprentissage

- 描述 California AB 2013 关于生成人工智能培训数据透明度规定的 12 个强制字段──
- Il est également possible de décrire les conditions de la formation de la formation en droit de l'éducation et de la formation en droit de l'éducation.
- 描述不可逆问题:为什么GDPR 删除权对已训练的神经网络 没有实际等价物──
- Il est également possible de décrire les effets de la crise sur les données.

##  problématique

訓練データ管理是每一張模型卡 (Léction 26) 和监管义务 (Léction 24) 上游──2024-2025年, la réglementation est axée sur trois principes:

## 概念

### Californie AB 2013

Pour les systèmes publiés le 1er janvier 2022 ou après, le document doit être publié le 1er janvier 2026 ou avant.
1. Source ou propriétaire de données
2. Les données de l'ensemble de l'information sur la façon de promouvoir l'IA système prévue de l'objectif
3. Quantité de points de données dans un ensemble de données (en anglais)
4. Indication du type de données:
5. Les données de l'ensemble contiennent-elles des données protégées par le droit d'auteur, la marque de commerce ou le brevet, ou appartiennent-elles entièrement au domaine public ?
6. Les données sont-elles achetées ou autorisées à être obtenues ?
7. Le numéro de compte contient-il des informations personnelles ?
8. Le nombre de données contenues dans le groupe de données de consommation est-il globalement supérieur à celui de la population civile ?
9.  le nettoyage, le traitement ou d'autres modifications effectués par le développeur, ainsi que les objectifs prévus.
10. Temps de collecte de données; si la collecte est toujours en cours, il faut indiquer:
11. Date de première utilisation du data collection dans le processus de développement.
12. 系统是否使用或持续使用合成数据生成──

La Commission a adopté une décision de la Commission européenne concernant la protection des données concernant les données relatives aux données relatives à la sécurité et à l'intégrité des aéronefs et à la sécurité nationale uniquement au niveau fédéral.

### La loi de l'UE sur l'IA (leçon 24) et le refus de la TDM

L'exception de la directive européenne sur le droit d'auteur en matière de extraction de texte et de données permet de pratiquer des formations sur le contenu accessible au public, sauf si les droits d'auteur optent pour le faire.

### Tendance de l'APD à l'égard des intérêts légitimes en 2025

Le DPC irlandais (DPC) a rejeté l'ordonnance de retrait de Meta: opt-out est suffisant. L'APD de Hambourg (en vue d'une uniformité à l'échelle de l'UE) a abandonné les procédures d'urgence.

趋同原则:l'intérêt légitime peut être justifié en fonction du contenu accessible au public et de l'option de renoncement à l'exercice.

### Le Brésil ANPD(2024 年 6 月)

En raison de l'insuffisance de transparence de l'information, Meta a suspendu le traitement des données des utilisateurs brésiliens pour l'entraînement en IA.

### Une question incontournable

Le consentement à la cookie est conçu pour le suivi en temps réel. Les données de formation sont différentes: une fois que les données entrent dans les poids du modèle, il est impossible de procéder à la suppression en chirurgie.

部分补救:
- **Unlearning。**Il est également possible de faire des changements dans la structure de l'appareil.
- **基于 influence function 的定位。**识别受该数据影响最大的权重; 选择性更新──
- **Fine-tune-suppression。**Le modèle de formation refuse de sortir le contenu de la source de ces données.

Ces méthodes ne peuvent pas résoudre complètement le problème.

### Initiative de prénom des données

Les données de l'entreprise sont en train de se rétrécir rapidement. En 2023, environ 25% des sources de formation de haut niveau ont été ajoutées à une certaine limite.

### C'est dans la phase 18 .

Leçon 26 est un modèle de classe de documentation. Leçon 27 est un ensemble de données de classe de gestion. Les deux définissent ensemble la transparence.


```figure
an-provenance-oneway
```

## Utilisez-le

`code/main.py`Vous pouvez remplir ces passages et observer quels passages seront incités à la confidentialité ou au droit d'auteur 后续义务。

## Je le livre.

本课会产出 `outputs/skill-provenance-check.md` déterminer un ensemble de données à utiliser pour la formation, il examinera AB 2013 12 字段覆盖、opt-out 基础设施合规、DPA对齐, ainsi que l'évaluation des risques irréversibles。

## 练习

1. 运行  référencement`code/main.py`◊ Pour un ensemble de données de jouets 生成 12 字段摘要,并识别哪些字段说明不足──

2. La directive européenne sur le droit d'auteur TDM opte-out est une méthode de communication de signaux de type opt-out, et elle est comparée à robots.txt et C2PA.

3. 阅读 Data Provenance Initiative's Consent in Crisis(2024 年 7 月) ⋅ description limiting growth tercepiest的三个内容类别,并论证一个经济后果──

4. 2025 DPA est prêt à accepter l'utilisation légitime de l'intérêt public pour la formation du contenu public, la construction d'un intérêt légitime, la mise en place d'un cadre de soutien insuffisant et la reconnaissance des besoins de l'offreur en fonction de la loi.

5. 勾勒一个训练数据来源宣言, en permettant de pouvoir se connecter à AB 2013 字段 ainsi qu'à la chaîne de provenance signée par C2PA de chaque ensemble de données 组合──识别一个技术障碍和一个法律障碍──

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

- [California AB 2013](https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB2013) L'IA générative  entraînement de la transparence des données
- [EU AI Act + GPAI Code of Practice (Lesson 24)](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) Droit d'auteur 章节
- [Longpre, Mahari, Lee et al. — Consent in Crisis (dataprovenance.org, July 2024)](https://www.dataprovenance.org/consent-in-crisis-paper) Audit de l'IPD
- [IAPP — EU Digital Omnibus GDPR amendments (2025)](https://iapp.org/news/a/eu-digital-omnibus-amendments-to-gdpr-to-facilitate-ai-training-miss-the-mark) 监管背景
