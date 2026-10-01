---
title: Loss-ratio hotspots
summary: Training a model to predict losses, then asking it which factors drove them.
draft: true
---

:::note
This was built inside Swiss Re, so the data and model aren't public. What follows is the idea and the outcome from my CV, nothing internal.
:::

## The problem

An insurance portfolio loses money in some places and not others. The loss ratio is claims paid divided by premiums earned; above 100%, the insurer pays out more than it takes in. The question was not "what will the loss be?" but "where, and why?"

## The idea: explain the prediction

A model that predicts losses well has learned something about what drives them. SHAP is a way to ask it: for any one prediction, it splits the result into each input's contribution, fairly, even when inputs interact.

![Each dot is one policy. Its position shows how far one factor pushed that policy's predicted loss.](figures/shap.svg)

Read the picture row by row. Dots right of the centre line are policies where that factor *raised* the predicted loss; dots to the left, where it lowered it. Filled dots are high values of the factor. A row where filled dots sit far right says: high values of this factor drive losses up.

## What came of it

A key-driver analysis on a US portfolio of agents and lawyers, with SHAP on top of the model, gave a 2.5% signal uplift over the base model. It surfaced drivers such as claim frequency, policy tenure and regional risk; the changes that followed brought loss ratios down by 5%.
