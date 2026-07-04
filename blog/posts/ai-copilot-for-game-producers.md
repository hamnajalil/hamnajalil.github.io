---
title: An AI Copilot for Game Producers — What Actually Sticks
date: 2026-06-20
description: I spent a quarter running LLMs against real production work — standups, risk registers, vendor threads. Here's the honest scorecard: three workflows that stuck, two that failed, and the rule I use to tell them apart.
tags: [ai, product management, workflows]
---

For the last quarter I've been deliberately routing my production workload through LLM tooling and keeping score. Not demos — real milestones, real vendor threads, real postmortems. Here's the scorecard.

## What stuck

### 1. Meeting synthesis with a decision ledger

Transcripts in, structured output out — but the prompt matters. I don't ask for "a summary." I ask for a **decision ledger**:

| Field | Why it matters |
| --- | --- |
| Decision made | The thing everyone forgets by Friday |
| Owner | A decision without an owner is a rumor |
| Reversible? | Tells you how much diligence it deserved |
| Deadline it affects | Connects talk to the schedule |

This alone recovered maybe three hours a week, and arguments about "what we agreed" dropped to nearly zero.

### 2. Backlog hygiene passes

Once a sprint, I have a model sweep the backlog for duplicates, stale acceptance criteria, and tickets whose description contradicts their title. It flags; a human decides. It routinely catches 10–15% of the backlog drifting out of date.

### 3. First-draft risk registers

LLMs are surprisingly good at *breadth* on risk identification — they'll list the boring risks (key-person dependency, holiday-season vendor slowdown) that experienced people skip because they're unexciting. The severity scoring, though, is mine. Which brings me to what failed.

## What failed

- **Estimation.** Every model I tried was confidently wrong about task sizing, because sizing is a function of *this team's* history, not language patterns. Feeding it velocity data helped less than you'd hope.
- **Stakeholder comms sent unedited.** The tone is always 5% off — too smooth, weirdly enthusiastic. People can tell. I draft with it, but every outbound word gets rewritten in my voice.

## The rule I ended up with

**Delegate synthesis, never judgment.** If the task is "compress a large amount of true information," the copilot is excellent. If the task is "decide what matters," the model produces something that *looks* like judgment — and that resemblance is exactly the danger.

```text
Good delegation:  transcripts → decision ledger
Good delegation:  200 tickets → drift report
Bad delegation:   drift report → what to cut
```

Next up, I'm testing agentic workflows against build-pipeline triage. If it works, that's the next scroll; if it fails, that's a more interesting one.
