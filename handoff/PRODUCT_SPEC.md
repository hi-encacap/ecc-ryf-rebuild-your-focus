# ReMind — Rebuild Your Focus
## Product & Implementation Specification
Version: 1.0 | Language: Vietnamese (retain English technical terminology) | Scope: personal wellness MVP

> Instructions for Codex: Treat this document as the source of truth for product intent, behavior and acceptance criteria. `program.v1.json` is the versioned seed curriculum. Inspect the repository before choosing implementation details. Preserve its existing conventions if suitable. Deliver a working application, not just static mockups. Do not invent medical claims, scores, research, or integrations.

## 1. Product vision
A calm personal web app for a 30-day experiment in attention, independent thinking, deliberate reading, recall, digital habits and physical recovery. The app should help a busy knowledge worker spend less time consuming passively and more time thinking, creating and resting. The product's success is offline behavior, not app engagement.

Primary persona: Vietnamese-speaking adult knowledge worker / Solution Architect, working on a computer, using AI regularly, accessing the app on desktop and mobile. Personal use initially; not a clinical tool.

Primary user journey: first open → understand the approach → set baseline and start date → see today's plan → perform tasks (mostly away from app) → log outcomes → review weekly trends → adapt goals → day 30 retrospective → retain sustainable habits.

Non-goals: diagnostic or therapeutic software; clinical cognitive test; dopamine detox; AI coach/chatbot; social network; leaderboard; infinite content feed; punitive streaks; automatic OS screen-time collection; account, server, subscriptions, integrations or notifications in MVP. Do not claim that 30 days reverses brain damage, improves IQ or cures ADHD. No pressure to complete at the expense of sleep or necessary work.

## 2. Knowledge base and scientific boundaries
Display short, expandable topic cards. Every card contains: what it means, why it matters, practical action, caveats, linked source if relevant. Make distinctions between association, experimental evidence, general health guidance and app-designed exercises. The following are paraphrases, not quotes.

| ID | Topic | In-app core content | Action | Evidence |
|---|---|---|---|---|
| K01 | Brain rot | A colloquial description of feeling mentally dulled or struggling with attention, not a medical diagnosis. It can overlap with stress, insufficient sleep, burnout or other conditions. Eight signs in onboarding are reflection prompts only, not a validated scale. | Observe behavior without labeling yourself. | Context / not diagnostic |
| K02 | Attention and short-form content | A 2025 synthesis of 71 studies (98,299 participants) found heavier short-video use associated with poorer attention and inhibitory control; association does not establish causation. Evidence for other cognitive domains is more limited. | Reduce unplanned scrolling; turn off nonessential notifications; schedule deliberate entertainment. | E01 |
| K03 | Digital environment | A randomized 2025 experiment restricted mobile internet for two weeks, retaining calls/texts and computer internet; outcomes suggest potential benefits for attention and wellbeing, with variability. This is not a trial of this app's exact limits. | Keep phone out of reach during focus; use OS Focus and app limits; preserve emergency access. | E02 |
| K04 | Deep Work | Single-tasking on a defined task with fewer interruptions. The 15–60 minute progression is a practical training proposal, not a proven clinical protocol. | Pick one concrete task; log interruption counts; take breaks. | App-designed practice |
| K05 | Retrieval Practice | Try retrieving information from memory before reviewing it. This can strengthen learning compared with passive review. | Close the source; recall five key ideas; then verify. | E03 |
| K06 | Spaced Practice | Spread review over multiple days rather than cram. Exact intervals depend on material and performance. | Review at +1, +3, +7, +14 days as a configurable default. | E03 |
| K07 | Deep Reading | Read with a purpose, avoid switching sources, then explain and check understanding. | Start with 10 minutes; increase when comfortable. | App-designed practice informed by E03 |
| K08 | Independent Thinking and AI | Delegating routine operations can be useful; this app encourages retaining responsibility for complex reasoning. It does not claim AI universally damages cognition. | Write problem, constraints, assumptions and options before requesting AI critique. | App-designed practice |
| K09 | Sleep | Sleep duration and quality both matter. CDC recommends at least 7 hours for adults aged 18–60; needs vary by age and individual. | Consistent sleep/wake schedule; do not sacrifice sleep for app tasks. | E04 |
| K10 | Exercise | WHO guidance for adults: 150–300 min moderate or 75–150 min vigorous aerobic activity weekly (or equivalent), plus strength work on 2+ days, when appropriate. | Start gradually; adapt to health and ability; count real moderate/vigorous activity. | E05 |
| K11 | Rest and impulse awareness | Pausing before opening a distracting app and resting without constant input are behavioral experiments, not a mechanism for resetting dopamine. | Try a short phone-free walk or pause; preserve essential communications. | App-designed practice |
| K12 | When to seek help | Persistent or worsening problems with memory, focus, mood, sleep or fatigue that affect daily function warrant professional assessment. Sudden severe confusion or new neurological symptoms warrant urgent care. | Show clear, non-alarmist signposting; do not diagnose. | Safety guidance |

### Evidence register
- E01: (2025), *Feeds, feelings, and focus: A systematic review and meta-analysis examining the cognitive and mental health correlates of short-form video use*, Psychological Bulletin. https://doi.org/10.1037/bul0000498 ; https://pubmed.ncbi.nlm.nih.gov/41231585/
- E02: Castelo et al. (2025), *Blocking mobile internet on smartphones improves sustained attention, mental health, and subjective well-being*, PNAS Nexus. https://doi.org/10.1093/pnasnexus/pgaf017 ; https://pubmed.ncbi.nlm.nih.gov/39967678/
- E03: Dunlosky et al. (2013), *Improving Students’ Learning With Effective Learning Techniques*, Psychological Science in the Public Interest. https://doi.org/10.1177/1529100612453266
- E04: CDC, *About Sleep*. https://www.cdc.gov/sleep/about/
- E05: WHO, *Physical activity*. https://www.who.int/europe/news-room/fact-sheets/item/physical-activity
- E06 (context/limitations): 2026 systematic review, *Short-form video, cognitive and mental health outcomes*. https://doi.org/10.1136/bmjph-2025-004086 ; highlights heterogeneous measures, bidirectionality and causality limitations.

Do not attach source badges to app-designed numeric targets. Sources describe general evidence, not efficacy of ReMind. Knowledge cards should not take more than a few minutes to read. No endless browsing.

## 3. Scope and information architecture
MVP navigation (responsive): Today | Program | Insights | Library | Settings. Journal and tools accessible contextually from Today and Program. On mobile use bottom navigation; on desktop sidebar. A dashboard should lead with a single next action rather than an analytics wall.

| Module | Required MVP capability |
|---|---|
| Onboarding | Optional 8 reflection prompts, baseline, editable goals, start date, timezone; explain local storage and wellness boundaries |
| Today | Day/phase, next action, 8 relevant habit statuses, one daily mission, timer shortcut, quick log, reflection, minimum-day mode |
| Program | 30-day timeline, daily instructions/outcome, phase goals, day navigation, weekly review, final review |
| Focus tools | Configurable timer, active/pause/resume/finish/cancel, record actual elapsed time and interruptions; no background claims |
| Journal | Short daily notes; reading recall cards; independent-thinking template; edit/delete/search own entries |
| Insights | Baseline vs latest seven logged-day window with coverage, daily trends, weekly activity, adherence, missed days and reviews |
| Library | 12 knowledge cards, 3 exercise guides, AI usage policy, evidence links, safety caveats |
| Settings | Goals, phase adjustment, schedule, timezone display, backup/export/import, reset data with confirmation |

## 4. Onboarding
Step 1: introductory explanation; optional self-reflection (never present as medical screening or total severity score):
1. Reading long documents feels difficult. 2. Prefer speeding up videos. 3. Automatically pick up phone when idle. 4. Read a lot but recall little. 5. Ask AI before thinking. 6. Struggle to sustain focus. 7. Busy but little durable learning. 8. Avoid complex topics.
Use Vietnamese natural phrasing, answer options `often / sometimes / rarely / skip`, with no diagnosis, score or personalized medical advice.

Step 2: enter baseline from prior 7 calendar days where possible: daily average short-video minutes, phone pickups, sleep hours, reading minutes; focus session length, mental energy 1–10; optional interruption count in a fixed 15-min task, recall 0–5. All optional or explicitly unknown; do not fill fabricated personal defaults. Show illustrative placeholders only. Screen Time/Digital Wellbeing are manually entered; OS totals may not distinguish short-form content; mark source as manual estimate if needed. Baseline can be edited with updated timestamp and a warning that comparison changes.

Step 3: choose start local date (default today), timezone (default detected, user-editable; Asia/Ho_Chi_Minh suitable), goals and routine. Default goals below, all editable, no forced early wake time. If no baseline exists, user chooses absolute short-video cap or leaves it unset until baseline is known. Day 1 can be used to establish it.

## 5. Curriculum and progression
Use `program.v1.json` (30 complete missions, phase configuration). Seed is immutable/versioned; never mutate the curriculum when user modifies goals. Goal overrides live on user's run. Each daily mission should include why, steps and concrete result. One mission plus routine is enough; integrate focus into work, not overtime. Weekends can be lighter.

| Days | Phase | Focus min/session | Reading min/day | Think-first min/complex task | Short video cap (% baseline) | Activity guideline |
|---|---|---:|---:|---:|---:|---|
| 1–7 | Stabilization | 15–20 | 10–15 | 5 | 70% | 15–20 min/day as tolerated |
| 8–14 | Attention Recovery | 25–30 | 20 | 10 | 50% | 25–30 min on active days as tolerated |
| 15–21 | Cognitive Rebuilding | 35–45 | 25 | 15 | 30% | Work toward 150 moderate-equivalent min/week + strength 2 days |
| 22–30 | Consolidation | 45–60 | 30 | 20 | 20% | Maintain appropriate activity; review rolling 7 days |

Default target = upper bound where a range exists, with easy lower bound as suggested starting point. These are training heuristics, not clinical thresholds. Short-video cap is rounded to whole minute, never negative; if baseline zero cap is zero (no percent-change division). Manual overrides are allowed. Deep Work metric counts actual session duration, not hours worked. Think-first rule applies only to complex tasks; no complex task that day = N/A.

Optional routine template: morning light/walk and no nonessential feed for 30–60 minutes; during work set priorities and focus block; afternoon purposeful AI use; evening activity, reading + recall and recreation; short reflection; consistent bedtime. No fixed clock time required. Example schedule can be edited.

### Run calendar and adaptation
- Day N date = startDate plus N−1 local calendar days, using run timezone (not elapsed milliseconds). Dates are YYYY-MM-DD; timestamps UTC ISO strings. Freeze run timezone for historical mapping; changing display timezone does not shift recorded days.
- Past missing days remain missing; do not require completion to unlock future days. Allow backfill and edits, label backfilled entries. Future days read-only previews; no completion data until that date.
- Day 7/14/21 and 29–30 reviews; day 30 ends the program, does not delete data. After day 30 show review/maintenance summary and allow deliberate new run; prior runs retained. MVP no automatic 90-day plan, offer habit selection for maintenance.
- If 3 consecutive logged standard days have adherence below 75%, or user reports overload, show suggestion (not automatic): reduce next goals by 20–30% or keep current phase intensity. Allow dismiss, accept, custom. Missing data is not failure. Accepted changes take effect from selected current/future day; save per-day goal snapshot once log is created. Changes never retroactively change previous scores unless user explicitly edits that day's goal and confirms.
- Minimum Viable Day (MVD): focus 10m, read 5m, gentle walk 10m if safe, reflection 2m. Total 27m when all applicable. Keep sleep priority; no make-up burden. Standard and MVD adherence separate; do not mix them as if same difficulty. Switching mode retains existing measurements and requires confirmation if completed checklist statuses will change; log mode change.

## 6. Exercises and tools
### Focus timer
Select category (focus / reading / independent thinking / quiet rest / custom), set goal, optionally write one outcome. Start/pause/resume/cancel/finish. Store accumulated active seconds plus current segment start timestamp; derive display from timestamps, not interval count. Recover after reload/background/lock; if elapsed seems inconsistent after clock change or long absence ask user to confirm actual minutes; don't auto-count offline idle time as completed focus. One active session per device/store; protect from duplicate submissions; multiple tabs synchronize active state or prevent competing starts. Record interruptions only on explicit user action; page visibility is not a reliable distraction signal. No mandatory sound, animation, push permission or device lock. User can manually log sessions.

### Deep Reading
Choose material; define purpose; read uninterrupted; close source; write recall; compare with source and record 0–5 recalled items after verification. Example 30-minute combined session: 2 prep, 18 reading, 5 recall, 5 check. For tracking pure reading minutes, exclude prep/recall; alternatively log combined time separately. Daily reading target refers to actual reading time. Avoid forced speed.

### Active Recall and Spaced Practice
Create card: source title, date, 1–5 reference key ideas (plain text), optional link. In review hide reference until user submits recall or selects reveal. Compare self-assessed matched key ideas, normalize score as matched/total (only 5-item cards show x/5). Default due dates +1,+3,+7,+14 from creation; each is a separate review; missed reviews remain available, don't require all overdue at once; cap suggested daily review queue at 3; allow defer. Recall after 24h metric uses 5-item cards reviewed on next local day, label as next-day recall not precise 24h if time differs. Record self assessment, not objective clinical measurement.

### Independent Thinking
Template fields: Problem Definition; Constraints; Assumptions; Options; Trade-offs (security, maintainability, scalability, cost if relevant); Decision; Validation. Save draft locally, copy as plain Markdown for external AI review; no built-in LLM or sending automatically. AI policy: routine translation, format and boilerplate can be delegated with verification; new learning, architecture, complex debugging and major decisions should begin with independent reasoning; use AI to challenge, not blindly decide. Manual daily count of complex tasks and count attempted independently, numerator ≤ denominator. Optional example prompts: critique assumptions, identify failure modes, request counterexamples, find verification methods.

## 7. Daily tracking and scoring
Daily entry supports actual numeric data plus status per applicable habit. Never convert unknown into zero. Explicit `0` means observed zero. No clinical score, no cognitive-age score, no claim that adherence equals cognition.

Standard habits: sleep goal; short-video limit; focus goal (at least one session); reading goal; recall practice; think-first policy; planned activity; reflection. Suggested completion automatically when measurable thresholds met, with clear manual override and reason. Recall: one real retrieval attempt. AI policy: all applicable complex tasks followed policy for daily checkbox; show ratio separately. Activity: only on planned active days, restorative days can be N/A. No recall card yet: still allow immediate recall exercise. Notes alone do not mark tasks complete unless explicit user confirms. Daily mission status independent of 8 habits, report separately.

Statuses: `pending`, `done`, `not_done`, `not_applicable` (reason optional), plus no entry/missing day. Daily score only for submitted days = done / applicable count; pending at submit prompts confirm mark not_done or leave as pending (if left pending, draft; no score). Denominator excludes N/A; zero applicable = undefined. Show e.g. 6/8, not "brain score". MVD same formula on 4 items separately. Save draft automatically; explicit Finish Day finalizes; can reopen and re-submit. Day without log = missing, not 0. Weekly adherence weighted by applicable tasks across submitted standard days; always display coverage and mode counts. Do not infer compliance on days with no record. Target adherence 75–80% is a personal experiment heuristic.

| Metric | Input / calculation | Suggested target |
|---|---|---|
| Short video | minutes, manually measured | 80% reduction if feasible |
| Phone pickups | manual OS estimate, count | 30–50% reduction |
| Focus | longest actual uninterrupted focus segment per day (manual or timer, user confirms interruptions) | 45–60 min |
| Context switching | voluntary switch count in comparable fixed 15-min test; separate from timer interruption log | 50% reduction, only comparable tests |
| Reading | actual reading minutes sum | 30 min/day |
| Next-day recall | matched / 5 on comparable five-item card next local day | 4/5 |
| Think-first | independent complex tasks / all complex tasks; denom 0 => N/A | ≥80% across tasks |
| Sleep | hours actual, optional subjective quality | 7–9h personal goal |
| Exercise | moderate minutes + 2× vigorous minutes; separately light minutes and strength days | 150 moderate-equivalent min in rolling 7 days as appropriate |
| Mental energy | subjective 1–10, no diagnosis | trend, no fixed target |

Baseline comparison uses baseline metric and final/latest seven **calendar** days with valid values only; show sample count n/7, missing values gaps. Day 29/30 final uses D24–30 when available (partial before end). Short-video % reduction = (baseline − observed mean)/baseline×100 only if baseline > 0 and samples exist. Negative reduction = increase; absolute change otherwise; do not cap percentages deceptively. Activity totals indicate missing coverage. For ratios aggregate sums before divide, not average daily ratios. No causal conclusions. Compare focus/interruption/recall under similar conditions; label self-report. Mental energy chart is descriptive.

### Reviews
Weekly review: what improved, what was hard, which triggers mattered, which goals need adjustment, next week's one change. Day 1/14/29 use comparable 15-minute task/read test and log actual test duration and switch count; use similar difficulty, not same memorized passage. Day 29 optionally also attempt 30-minute extended reading and reasoning exercises; not directly compare longer test counts with 15-min baseline. Day 30 final: show descriptive baseline comparison, task coverage, user's reflection, and select sustainable habits. If insufficient baseline or data, explain rather than estimate.

## 8. UX and screen design
UI language Vietnamese, natural terms (e.g. "Tập trung sâu", "Nhớ lại", "Suy nghĩ trước khi hỏi AI"). Product label English. Mobile-first responsive, calm warm off-white backgrounds, muted teal/indigo accent, readable text, restrained cards. Dark mode optional. No bright reward colors for failures; use neutral status and useful accessible labels. WCAG 2.2 AA target: keyboard navigation, focus styles, semantics, meaningful labels, contrast, reduced motion, charts with text summaries, usable 44px touch targets. Avoid progress as pressure. No red missed-day punishment, animations or modal overload. Use 2–5 minute total logging budget; one primary CTA per screen.

Today layout: header day/phase and small progress → next best action → quick focus button → today's mission → compact habits + quick metrics → reflection → finish day. Empty state: next action setup; after submission show "Hôm nay đủ rồi" and an exit-oriented CTA. Insights: cards for coverage, actual focus, short video, sleep; optional chart details, standard vs MVD filters, weekly review. Program: 4 phases, list of days, current day highlighted, future preview, no hard locks. Library: finite categories, no feed. Settings: visible local-data status, last backup info, import/export, reset.

## 9. Architecture (proposed MVP)
Use existing repository stack if appropriate; otherwise React + TypeScript (strict) + Vite + React Router, MUI or existing component system, Zustand only for ephemeral UI state if useful, Dexie/IndexedDB for persistent data, Zod for validation, simple accessible charts (e.g. Recharts). PWA install/offline app shell via compatible service-worker setup, same-origin assets. Avoid new backend, auth, AI APIs, microservices, external analytics, CDN fonts and sensitive integrations. No network calls for logs. Do not pretend browser can read OS Screen Time, block apps, or run guaranteed background timers. User may manually set OS controls. Data stays in browser origin/device/profile; no automatic cross-device sync. Browser eviction/clearing site data or origin changes can lose data; export backups recommended. PWA requires HTTPS or localhost; service worker update must preserve data and prompt safe reload when active session. Verify package compatibility and pin lockfile rather than assuming latest versions.

Suggested feature-first modules: `app/` routing/layout, `features/onboarding`, `features/today`, `features/program`, `features/focus`, `features/journal`, `features/insights`, `features/library`, `features/settings`, `domain/` curriculum, date, target and scoring functions, `data/` Dexie schemas/repositories/migrations, `content/` versioned program & knowledge, `shared/` UI/utilities. Keep domain pure, independent of React and storage; UI calls services/repositories; derive analytics rather than persisting aggregates. Do not duplicate IndexedDB into global state. Keep dependency count low. Use schema migration tests and explicit versioning. Scope for one user/multiple runs on one device; future sync boundary at repository layer only, not speculative distributed architecture.

### Logical data model
IDs UUID; date strings local to run; UTC timestamps for audit. All optional metrics nullable, no magic sentinel. Define typed validators for finite/non-negative values, 0–24 sleep, 1–10 energy, 0–1440 daily minute fields and nonnegative integer counts. Validate reasonable timer duration and timestamps; permit manual corrections. Free text bounded (e.g. 10,000 chars). Allow deletion, no sensitive technical secrets.

| Entity | Key / essential attributes |
|---|---|
| ProgramDefinition | version, 4 phases, 30 immutable missions, references; bundled content |
| Run | id, programVersion, startDate, timeZone, status, baseline snapshot, goals, createdAt, updatedAt |
| GoalOverride | id, runId, effectiveFromDay, changed targets, reason, createdAt |
| DailyLog | unique [runId, dayNumber], localDate, mode, goalSnapshot, habit statuses, metrics, mission status, reflection, draft/submitted, backfilled, timestamps |
| FocusSession | id, runId, dayNumber, category, plannedSeconds, activeSeconds, startedAt, endedAt, status, interruption count, confirmed actual metrics |
| JournalEntry | id, runId, dayNumber, type, title, plainText or structured fields, timestamps |
| RecallCard | id, runId, source, referenceIdeas[], createdLocalDate, reviewDueDates[], archived flag |
| RecallReview | id, cardId, dueDate, actualDate, response, matchedCount, totalCount, timestamps; unique [cardId, dueDate] |
| Review | unique [runId, dayNumber], type, reflection fields, timestamps |
| AppSettings | singleton, schemaVersion, display preferences, lastBackupAt |

Use transactions for related writes and replace import. Index runId/day/date queries. Session and manually logged aggregate data must not double count: define manual total override or distinct manual session entries, not both. E.g. focus/reading minutes from confirmed sessions + explicit manual session entries; form displays sum; allow edit underlying entries. Active sessions don't count toward outcomes until confirmed. Focus longest uninterrupted duration: if interruptions logged, use marked segment durations or explicit confirmed longest segment; never assume total session was uninterrupted. No local date drift at midnight: assign session to selected run day at start, display attribution, allow move/correction.

## 10. Privacy, security, reliability
- Treat notes, behavioral metrics and wellness data as private. No analytics, third-party embeds, advertising, cloud calls, or tracking. External evidence opens only on user request with safe rel. Never request health account or employer credentials.
- Store data locally in IndexedDB. Explain that local-only ≠ encrypted vault; anyone with access to same browser profile or compromised device may access it. Avoid false encryption claims; no hardcoded keys. Do not store confidential work details, passwords or customer data in exercises. User controls exports; warn exported JSON contains private data.
- Render all free text as text; no raw HTML/unsafe Markdown. Allow only http/https links (prefer https), reject javascript/data URLs. Apply restrictive CSP and security headers compatible with build; self-host assets; no secrets in bundle. Review dependency vulnerabilities and document limitations. No service worker caching remote sensitive responses.
- JSON backup envelope: `format: "remind-backup"`, `schemaVersion`, `exportedAt`, `data` containing runs, overrides, logs, sessions, journal, recall, reviews, settings. Export full data; optional CSV for daily metrics (CSV is not complete backup, escape formula-injection prefixes). Import validates schema, size (e.g. 10 MB), references, enum/ranges, duplicate keys, dates/timezones, known program versions, and migration support. Reject unsupported newer versions with clear error. MVP import replace only: preview counts, warning, explicit confirm, offer pre-import backup; atomic transaction, no partial changes on error. Never execute imported content.
- Clear all data only after explicit confirmation; include export option; service worker assets can remain (no personal data in cache). Handle quota/storage errors prominently, retain unsaved input and offer retry/export when possible. Browser persistence request optional, never claim guarantee. No writes from read-only previews. Update/migration must preserve valid data.

## 11. Delivery and verification
Build order: (1) domain/data + seed validation + onboarding; (2) Today/Program and persistent daily logs; (3) timer and journal/recall; (4) insights/weekly reviews; (5) settings, export/import, offline and accessibility polish. Do not stop after a dashboard mockup. Prefer a coherent thin vertical slice then remaining MVP. README includes setup, commands, architecture decisions, limitations and storage/backup notes. Include sample fixture only as explicit demo mode, never mixed with actual personal data.

Acceptance criteria:
1. Fresh app presents onboarding, no fabricated baseline. Skip unknowns and choose start date; correct day/phase shown. All 30 missions exist and render in Vietnamese.
2. Mark habits, enter metrics and journal; reload/offline retains data. Draft, submission, N/A and missing days are distinct. Mode switch does not lose measurements. Editing a past day refreshes derived insights.
3. Timer survives reload/visibility changes, pause/resume accurate, completion recorded once; conflicting tabs handled or explicitly prevented; manual correction available.
4. Recall hides reference until user reveals/submits; due reviews computed in local calendar; no double counting. Think-first template saves and copies locally.
5. Target overrides do not rewrite past goal snapshots; minimum day score separate. Three low-adherence submitted standard days can trigger non-punitive suggestion; missing days not failure.
6. Insights handle zero/unknown baseline, missing days, no complex tasks, N/A, 0 actual minutes, rolling windows, coverage, and comparable metrics; no clinical interpretation.
7. Export→clear→import round-trip restores data; invalid/malformed/oversize backup fails without mutation; reset requires confirmation. No log data transmitted.
8. Day rollover handles month/year/leap/DST via timezone-aware calendar logic; missed days/backfill/day30/new-run behavior correct. App works at mobile 360px and desktop; keyboard accessible and reduced motion.
9. Installable/offline app shell works after initial online load; offline logging and reload work; no silent data loss from update. Disclose browser limitations.
10. Production build passes; run unit tests on date/targets/scoring/analytics/recall, storage migrations/backup and timer state, plus minimal integration smoke paths. Report test results and any unimplemented acceptance criteria; do not fabricate test success.

## 12. Later, only if explicitly requested
Optional cross-device sync with authentication/authorization, encryption design and deletion/export controls; native screen-time integration where OS permits; optional user-scheduled reminders; longer maintenance programs. These are NOT MVP dependencies. Do not build speculative infrastructure.

## 13. Codex handoff note
When starting: read this specification and seed, inspect repo, state key assumptions briefly, then implement. Make sensible low-risk implementation decisions without blocking on cosmetic preferences. Use Vietnamese UI; English identifiers and repository docs are acceptable. Keep the app small, calm and privacy-preserving. Provide how to run locally, how to deploy a static build, actual verification results, and known limitations. Do not silently expand scope.
