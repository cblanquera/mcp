# AI Documentation Guidelines

The purpose of this document is to describe how to transform documentations to structured markdown for AI to easily search for context and have semantic understanding of the code in which the documentation is written about.

## 1. Consistent Sectioning

Always begin each file with a unique `# Title`. Use shallow, predictable headings like the following.

 - `## Purpose`
 - `## Rules` (explicit MUST/SHOULD/CAN)
 - `## Examples` (Good / Bad)
 - `## Exceptions`
 - `## References`

Keep paragraphs short; prefer bullet points.

## 2. YAML Front-Matter

Each file must begin with a YAML block like the following.

```yaml
---
id: react-guidelines-v1
title: React Guidelines
version: 1.3.0
area: frontend
tags: [react, hooks, testing, patterns]
audience: Team Joanna
owner: "@you"
updated: 2025-08-28
confidence: high
---
```

Preserve this metadata with each chunk during ingestion.

## 3. Rules in Machine-Friendly Style

Express rules with modal verbs. 

 - **MUST**: “Components **MUST** prefix hooks with `use`.”
 - **SHOULD**: “Prefer composition to inheritance.”
 - **MUST NOT**: “Do **NOT** export default Redux stores.”

Keep each bullet rule concise (<60 words).

## 4. Examples

Place examples near the rules they illustrate. Label explicitly:

 - **Good**
 - **Bad**

Always use language-tagged code fences (e.g., ```ts, ```tsx). After each example, add a one-line explanation of why it is good/bad.

## 5. Glossary

Maintain a `## Glossary` section with definitions of important terms. Improves semantic matching (e.g., “repo setup” vs. “bootstrapping”).

## 6. Stable Anchors

Do not rename headings casually. Use stable `id` fields in YAML front-matter. Ensure retriever can store that `id` with each chunk.

## 7. Chunking and Embedding

Split documents into chunks of ~200–500 tokens with 20–40 token overlap. Never break chunks inside code fences. Attach metadata (id, title, version, heading path, rule_level). Use hashes to de-duplicate chunks.

## 8. Formats

Plain Markdown is preferred. Avoid complex HTML or unsupported Markdown extensions. Use tables sparingly (e.g., Do/Don’t, Bad Smells).

## 9. Context Pack Manifest (Optional)

Provide an index file for discovery and weighting like the following.

```yaml
pack: "Engineering Playbook"
version: 2.1
default_embedding_model: "text-embedding-3-large"
include:
 - path: docs/coding-standards.md
    weight: 1.0
 - path: docs/testing-guidelines.md
    weight: 1.0
 - path: docs/react-guidelines.md
    weight: 1.2
 - path: libs/*/README.md
    weight: 0.9
policies:
  max_chunk_tokens: 400
  overlap_tokens: 32
filters:
  tags_any: [react, testing, standards]
```

## 10. Retrieval Instructions for AI

When retrieving, please consider the following points.

 - Return 6–8 chunks max.
 - Prefer **MUST** rules.
 - Match `area:` tags to the query.
 - Use newest `version`.

When answering, please consider the following points.

 - Cite the rule headings used.
 - If no rule is found, state clearly.
 - Follow **MUST** rules over **SHOULD**.

## 11. Instructions

Please follow the instructions below.

 1. Read only the markdown files in the `docs` folder.
    - Ignore the `docs/Context.md` file if it exists.
    - Read the `README.md` in the project root.
    - Ignore other markdown files that is not the `README.md` in the project root and not in the `docs`.
 2. Create or rewrite the `docs/Context.md`. 
    - Consolidate all the material into this file.
    - Re-number the headers so it can be followed in order
    - Follow the guidelines