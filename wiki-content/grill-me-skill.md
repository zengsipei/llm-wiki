---
id: cmpgyj6en000forxt4i89v9ni
title: grill-me-skill
type: concept
tags:

created: 2026-05-22T13:51:40.417Z
updated: 2026-05-22T14:36:56.625Z
---

---
source_url: https://github.com/RobMitt/grill-me-skill
ingested: 2026-05-14
sha256: 4ed31ccf8a5f5250a8620c09e02bde51a5bd08bded555f3c7219b74e7b640e9d
---

# grill-me-skill

## Repository Info
- **Repo:** RobMitt/grill-me-skill
- **URL:** https://github.com/RobMitt/grill-me-skill
- **Stars:** 9 | **Forks:** 4
- **Created:** 2026-04-11 | **Last updated:** 2026-05-14
- **License:** None | **Language:** None (skill file only)

## README.md

# grill-me

A Claude Code / Cowork skill that interviews you relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree.

Use it when you want to stress-test a plan, poke holes in a design, or just say "grill me".

## Install

Drop the `SKILL.md` (or the whole folder) into your skills directory:

```
~/.claude/skills/grill-me/SKILL.md
```

Then trigger it by saying "grill me" or asking Claude to stress-test a plan.

## SKILL.md

---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

Interview the user relentlessly about every aspect of their plan until you reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.

## How to ask questions

Use the **AskUserQuestion tool** for every question you ask. Never pose questions as plain text in your response — always use the multiple-choice popup so the user can quickly select an answer or type a custom one.

Ask **one question at a time**. Wait for the user's answer before moving to the next question. This keeps the conversation focused and prevents overwhelm.

For each question, provide 2–4 concrete multiple-choice options representing the most likely answers or directions. Think about what the user would realistically choose — generic options like "Yes" / "No" aren't helpful unless the question is genuinely binary. The user always has the "Other" field available to write something custom.

## Flow

1. After receiving an answer, briefly acknowledge the decision (1–2 sentences max), then immediately ask the next question via AskUserQuestion.
2. If a question can be answered by exploring the codebase or files, explore them yourself instead of asking the user.
3. Continue until all branches of the design tree are resolved.
4. When finished, provide a concise summary of all decisions made.

## Related Variant

- **grill-me-fix** (dexuwang627-cloud/grill-me-fix, ★3): A fork/variant that translates vague visual feelings into precise code changes. AI locates the code, translates your description into technical root causes you can pick from, then modifies only after confirmation.

## Forks
- mithyer/grill-me-skill
- anvers/grill-me-skill
- blackpiazhi/grill-me-skill
- wymanwong/grill-me-skill