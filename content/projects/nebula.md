---
title: Nebula, a retrieval assistant
summary: How an assistant answers from a pile of documents instead of from memory, and what that changed for underwriters.
draft: true
---

:::note
This was built inside Swiss Re, so the system itself isn't public. What follows is the idea behind it and the outcome from my CV, nothing internal.
:::

## The problem

To price a risk, an underwriter reads about the company behind it: news, filings, financial reports. That reading took days per case.

## The idea: retrieve, then answer

A language model on its own answers from what it absorbed in training, which is out of date and can't be checked. Retrieval-augmented generation (RAG) changes the order of things: first find the passages that matter, then let the model answer *only* from those passages, and cite them.

![Retrieve, then answer. The model only sees the passages the search found.](figures/rag.svg)

1. **Ingest.** Documents are split into passages and turned into vectors, numbers that capture what a passage is about.
2. **Search.** A question becomes a vector too; the closest passages are the relevant ones. This is semantic search: it matches meaning, not exact words.
3. **Answer.** The model gets the question plus those passages, and writes an answer that points back to them.

## What I built

PDF ingestion and the semantic search (Python for text extraction, TypeScript for the vector search), and an admin panel for prompts, evaluation and one-click reruns, all on Palantir Foundry. Underwriter research went from days to minutes.
