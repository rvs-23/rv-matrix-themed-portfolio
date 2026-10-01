---
title: Customer prioritization
summary: Ranking trial users by how likely they are to buy, so a small sales team calls the right few hundred.
draft: true
---

## The problem

Thousands of people visited the site each day for a free horoscope report, and some of them went on to buy. The sales team could call only a few hundred. An earlier rule-of-thumb list picked whom to call; most of those calls went nowhere.

So the question became: of everyone who visited in the last 24 hours, who is most likely to convert today?

## The idea, in one picture

Every visitor becomes a point described by their behaviour: payment attempts, sessions, device. A linear classifier learns a line that separates people who bought from people who didn't. A visitor's distance from that line, on the buying side, becomes their score.

![One straight line separates likely buyers from the rest; distance from it becomes the score.](figures/boundary.svg)

## How it was built

1. **Features.** Fifty-odd behavioural signals per visitor, aggregated over their recent sessions.
2. **Model.** A classifier trained with stochastic gradient descent. SGD can learn from a day's new data with `partial_fit`, so the model kept up without retraining from scratch.
3. **Evaluation.** 97.9% balanced accuracy and 98% recall on held-out data. Recall mattered most: a missed buyer costs more than a wasted call.
4. **Delivery.** A small Flask service on Heroku produced the daily `top_250` list and an actual-versus-predicted dashboard for the sales team.

:::note
Balanced accuracy averages the accuracy on each class. It matters when buyers are rare, because plain accuracy rewards a model that predicts "won't buy" for everyone.
:::

## What changed

Sales called 83% fewer people, and conversions rose 63% over the old list.

This was a team project for Packt Publishing in 2021; the code is public.
