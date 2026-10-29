# Design Trio collaboration guide

This working agreement joins **Design with Intent**, **UI/UX Pro Max**, and **Impeccable** for BakiBuddy and future UI projects. It defines complementary responsibilities; it does not authorize a new development phase or redesign.

## Ownership

| Skill family | Primary role | Owns | Hands off |
|---|---|---|---|
| [Design with Intent — Ghaida](https://github.com/ghaida/intent) | Product and experience strategist | User problem, evidence vs assumptions, flows, information architecture, language, consent, inclusive behavior, success criteria | A concise intent brief: audience, task, flow, important states, copy, constraints, and acceptance criteria |
| [UI/UX Pro Max — Next Level Builder](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Design-system and platform advisor | Relevant local database searches, candidate patterns, typography/color/spacing guidance, stack-specific implementation advice, accessibility/interaction checks | A recommendation set tied to the brief and the actual framework, with tradeoffs and explicit exceptions |
| Impeccable — installed Codex skill | Visual design and implementation lead | Cohesive visual direction, final token/component application, responsive composition, visual polish, rendered review, design documentation | Implemented UI, screenshots or device evidence, concrete findings, and the final design-system record |

One Codex session coordinates these roles by default. Skills are instructions and tools, not three continuously running independent agents. Use real subagents only when the user or applicable skill instructions authorize them and tools support it; do not create new sidebar chats just to simulate collaboration.

## Work across a project's lifecycle

| Development stage | Intent responsibility | UI/UX Pro Max responsibility | Impeccable responsibility | Exit evidence |
|---|---|---|---|---|
| Understand and scope | Lead problem framing, user task, existing evidence, constraints and success criteria | Identify platform-specific risks; inspect the real stack | Inspect incumbent visual truth and reusable assets | Shared brief with unresolved material questions |
| Structure the experience | Lead journeys, navigation, information hierarchy, copy and recovery states | Check patterns, accessibility and interaction guidance | Translate the agreed structure into a distinctive visual direction | Understandable flow and state coverage |
| Define the system | Verify hierarchy supports the user's task | Lead relevant token/pattern recommendations; check search-result fit | Own the final visual selection and its consistent implementation | One accepted token/component system, with reasons |
| Build an approved feature | Check flow and copy remain faithful | Advise on the detected stack and platform behavior | Lead UI composition, responsive implementation and polish | Working feature within authorized scope |
| Verify and fix | Evaluate task completion, honesty, consent and accessibility | Check measurable interaction/platform criteria | Review actual renders; fix specific visual defects | Executed checks plus explicit unverified coverage |
| Release or hand off | Review onboarding/help, consent, and completion/recovery journeys | Check platform presentation and interaction consistency | Finish visual assets and documentation when in scope | Reviewable release candidate; release permission remains separate |
| Maintain | Trace reported friction back to user intent | Diagnose the relevant pattern/stack issue | Make a narrow consistent fix | Regression evidence, without reopening settled decisions |

Do not run every skill or every stage for a small change. A button-label fix needs the relevant copy and accessibility guidance, not a fresh research study, seven concepts, or a new design system. Backend-only work remains engineering work unless it changes a user-facing experience.

## One context, one design system

1. Read the user's current request and existing project instructions first. Record the approved phase and protected behavior.
2. Reuse `PRODUCT.md`, `DESIGN.md`, existing tokens, roadmap and progress before interviewing again. Ask only questions whose missing answers materially change the work. Respect a user's instruction to choose sensible defaults.
3. Intent contributes the reason and experience contract. Read only its relevant specialist skills, such as `journey`, `articulate`, `include`, or `evaluate`.
4. UI/UX Pro Max queries its local database with one focused concern at a time. Use the actual stack (`react-native` for BakiBuddy). Verify result relevance. Never turn a web recommendation into a native dependency by accident.
5. Impeccable turns the agreed intent and recommendations into one visual implementation. Preserve the user's pinned brand and an established project identity.
6. Keep normative tokens in the project's established source and `DESIGN.md`; `PRODUCT.md` owns product truth. UI/UX Pro Max output is a candidate, not a competing authority. Do not create or overwrite a second MASTER.md without a concrete need and authorization to replace existing decisions. If an existing project already uses MASTER.md as its authority, respect that system and link records rather than duplicating them.
7. Capture decisions and actual verification in an existing project log. For substantial collaboration, add a short entry stating each role's contribution, accepted/rejected recommendations and evidence. Do not put process narration into product screens.

## Handoff format

Keep each contribution short enough for the next role to act on:

```text
Scope: approved feature/phase and protected behavior
Inputs: brief, source files, existing tokens, relevant evidence
Decision: recommendation and why it serves the user task
Handoff: flow/state/copy/token or specific implementation instruction
Acceptance: observable behavior or measurable check
Open: only material unknowns and unverified coverage
```

The coordinator records the final choice once. The next role reviews it instead of silently replacing it. A disagreement is resolved against the user's explicit choices, accessibility and functional correctness, the real platform, and the established project system. Ask the user only when a material product/brand tradeoff remains unresolved. Do not invent research, user approval, test results, or regulatory conclusions.

## BakiBuddy's nine-phase responsibilities

This is a project-specific example. Other projects keep their own phase names and approval policy; they do not inherit BakiBuddy's current gate.

| Phase | Design with Intent | UI/UX Pro Max | Impeccable |
|---|---|---|---|
| 1. Foundation | Clarify five-screen purpose, demo honesty, navigation and accessible reading order | Validate React Native guidance, touch/contrast/layout recommendations | Own tokens, reusable components, five polished demo screens and rendered review |
| 2. Storage and transactions | Shape add/edit/delete, validation, account/transfer meaning, empty/error/recovery states | Advise on forms, keyboard behavior, lists and accessible feedback | Implement the approved transaction UI consistently with the existing system |
| 3. Budget engine | Explain reserves, income cycles, uncertainty and shortfalls clearly | Advise on financial inputs, progress, schedules and warning patterns | Build clear budget controls and forecast presentation using verified engine outputs |
| 4. Analytics | Define which question each chart answers and avoid misleading claims | Recommend appropriate accessible charts and a compatible library | Own chart hierarchy, responsive labels, legends and empty/insufficient-data presentation |
| 5. TNG import | Lead review/confirm/correct/duplicate and unsupported-file journeys | Advise on file-selection, preview-list and error patterns | Build a coherent import-review interface after actual export formats are verified |
| 6. OCR | Lead uncertainty and correction before saving | Advise on image selection, extraction feedback and accessible forms | Implement scan review, confidence presentation and visual recovery states |
| 7. AI assistant | Lead explicit consent, truthful explanations and non-AI fallback | Advise on assistant input, loading, timeout and error interactions | Implement a calm assistant UI tied to verified calculations |
| 8. Security and QA | Review consent, export/deletion, accessibility and harmful/deceptive patterns | Audit relevant interaction/platform criteria | Review actual screens, fix visual regressions and document evidence |
| 9. Distribution | Review onboarding/help/privacy wording within approved scope | Check platform-specific launch and release presentation | Prepare final icon/splash/store visuals and visual QA when authorized |

Financial arithmetic, storage integrity, security engineering and automated tests remain engineering responsibilities. Design skills must never replace deterministic calculations with AI-generated financial figures.

**Current gate:** Phase 6 was approved by “continue phase 6” on 27 October 2026. Extend the incumbent import/review experience for local receipt/screenshot OCR and preserve prior financial behavior. Phase 7 and release actions remain unapproved. The earlier PDF sample gate was satisfied during Phase 5.

## Reuse in future projects

User-scope installation is saved under `C:\Users\USER\.codex\skills\`. Discovery aliases are available under `C:\Users\USER\.agents\skills\`. The coordinator is `$design-trio`; a global `C:\Users\USER\.codex\AGENTS.md` routes appropriate UI/UX work to it. Impeccable 4.8.0 is installed globally for Codex at `C:\Users\USER\.agents\skills\impeccable`, using the publisher's installer. Resolve it from the current skill catalog instead of a hard-coded cache version. The older curated 4.3.1 plugin remains registered; its skill is disabled locally to avoid duplicate instructions, and its files are retained. No new hook manifests were installed.

Use this starting prompt:

> Use $design-trio for this project. Read its existing instructions and current scope first. Let Design with Intent frame the experience, UI/UX Pro Max advise on the system and actual stack, and Impeccable lead implementation and final visual review. Preserve established decisions and report what was tested.

New skills should be available on the next turn. If they do not appear, restart Codex. This installs instruction packages, not daemon processes or automatic background collaborators.

Pinned upstream revisions and local compatibility adaptations are recorded in the coordinator's `references/installation.json`. Upstream scripts, release hooks and platform-agent registries are not automatically activated. Review future upstream changes before updating, and preserve local collaboration instructions.

## Phase 1 integration check

The three roles were connected against the existing BakiBuddy foundation without changing its approved scope:

- Intent's evaluation/inclusion guidance was used for a bounded review of demo honesty, clear expense/income/transfer meaning, meaningful labels, and routes out of placeholder screens. Existing product context was reused; no user research or native accessibility test was claimed.
- UI/UX Pro Max's local `touch target` search returned platform-specific 44pt iOS / 48dp Android guidance. The React Native `accessibilityLabel` search returned active 0.86.x guidance. An initial `safe area` stack search returned no match; an explicit app-interface `safe area insets` search then returned relevant iOS/Android/React Native guidance. Results were checked against source, with physical-device verification still pending.
- Impeccable's finish reviewer inspected 31 browser captures. Its grouped transaction-label finding was corrected and scored resolved; actual browser labels were checked afterward. Its documenter generated DESIGN.md and the sidecar from source tokens and validated eight representative component specimens.

These are separate instruction-guided contributions integrated by Codex, not three background agents or proof that native phone testing happened. The existing Phase 1 visual identity was preserved.

## Phase 5 integration check

Intent/fortify shaped the local statement journey, no-write preview, account/opening-balance explanation, password recovery, uncertain classification, cancellation and preserved edits. Articulate informed direct labels and recoverable errors. UI/UX Pro Max supplied focused React Native form/keyboard/accessibility advice; established tokens and 48px controls remained authoritative. No new palette or rival design system was generated.

Impeccable implemented the Operate extension in the Daily Planner identity. Its mandatory fresh reviewer checked all 47 current production-web capture dimensions, six contact sheets and selected originals, requested one landscape error/recovery recapture, then returned **ship** after a full review. The ship verdict covers sampled source and supplied web previews; it is not a parser audit or native runtime certification. Native Files/WebView, safe areas, scaling, gestures and screen-reader acceptance remain manual. The independent documenter updated only current descriptive DESIGN.md prose and verified its normative frontmatter, sidecar and tokens remained byte-identical; preexisting sidecar drift was reported and left unchanged. Detailed evidence and phase gates are in PHASE_5_REPORT.md and PROGRESS.md.

## Phase 7 integration check

Intent/fortify/articulate shaped verified scope and assumptions, minimal operation-specific cloud consent, local recovery and deliberately reviewed category-only changes. UI/UX Pro Max supplied focused React Native loading/error guidance; the installed RN 0.88 stack,48-unit targets and existing tokens stayed authoritative. No rival generated system or user research was invented.

Impeccable extended the incumbent Operate forms/rows. Formal native review returned **recapture** for missing device screenshots and stopped before source/craft review. A separate supplemental source/web audit found four P2 issues; one batch fixed all four and two cosmetic strings.141 final browser PNGs/18 sheets include the affected matrix, in-flight cancellation and pending/in-flight category requests moving to confirmation. 31 browser checks and 168 unit/SQL/server checks pass. The reviewer’s scoring disposition is **ship for those six fixes only**; no native/live-provider acceptance is implied.

The fresh documenter compared final source, sampled rendered originals and saved evidence, updated only descriptive DESIGN.md prose and preserved normative frontmatter/sidecar/source-token hashes. Pre-existing sidecar narrative drift was reported without repair. Details and remaining live-provider/native gates are in PHASE_7_REPORT.md and `.impeccable/review/phase7/`.

## Phase 8 integration check

Intent/fortify/articulate framed export scope, plaintext/destination disclosure, reference-only copies, proportional deletion consent, stale-data recovery and clear outcomes. UI/UX Pro Max supplied focused React Native semantics/device-testing guidance; actual RN 0.88, existing tokens and 48-unit controls remained authoritative. No new design system, identity, notification scope or research claim was introduced.

Impeccable extended the established Settings/forms. Root inspected all 66 initial views through eleven sheets; final recaptures are byte-identical and six new CSV originals were inspected. The fresh reviewer inspected all 72 captures through twelve sheets plus eight originals/current UI source and returned **ship for supplemental source/React Native Web only**, with no requested fixes. Formal native review remains **recapture**. The fresh documenter updated only descriptive DESIGN.md prose, preserving normative frontmatter/sidecar/source-token hashes and reporting old drift without repair. Scanner-only/runtime follow-ups do not inflate the data-control verdict. User-reported iPhone share-sheet opening, deletion cancellation and OCR candidates are recorded separately from automated/browser evidence and full native acceptance. See PHASE_8_REPORT.md and .impeccable/review/phase8/.
