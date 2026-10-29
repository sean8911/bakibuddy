---
name: BakiBuddy
description: "Know your balance. Own your future."
colors:
  background: "#F7F8F4"
  surface: "#FFFFFF"
  canvas: "#E8EEEB"
  navy: "#182D35"
  secondary: "#586B70"
  muted: "#586B70"
  line: "#E4EAE5"
  fieldBorder: "#74867B"
  emerald: "#11634E"
  emeraldSoft: "#E8F1E9"
  mint: "#D8EFCC"
  onEmerald: "#E0F0E6"
  amber: "#8A571B"
  amberSoft: "#FAEEDB"
  orange: "#A6532D"
  orangeSoft: "#F9EDE4"
  blue: "#355D86"
  blueSoft: "#EAF0F8"
  purple: "#70548A"
  purpleSoft: "#F0EBF5"
  graySoft: "#EDF0ED"
typography:
  display:
    fontFamily: "Manrope_700Bold"
    fontSize: "42px"
    lineHeight: "52px"
    fontWeight: 700
    letterSpacing: "-1.2px"
  heading:
    fontFamily: "Manrope_700Bold"
    fontSize: "28px"
    lineHeight: "37px"
    fontWeight: 700
    letterSpacing: "-0.7px"
  title:
    fontFamily: "Manrope_700Bold"
    fontSize: "18px"
    lineHeight: "26px"
    fontWeight: 700
    letterSpacing: "-0.3px"
  body:
    fontFamily: "System"
    fontSize: "15px"
    lineHeight: "23px"
    fontWeight: 400
  label:
    fontFamily: "System"
    fontSize: "14px"
    lineHeight: "21px"
    fontWeight: 600
  caption:
    fontFamily: "System"
    fontSize: "12px"
    lineHeight: "18px"
    fontWeight: 400
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  section: "36px"
components:
  button-primary:
    backgroundColor: "{colors.emerald}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-secondary:
    backgroundColor: "{colors.emeraldSoft}"
    textColor: "{colors.emerald}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-disabled:
    backgroundColor: "{colors.graySoft}"
    textColor: "{colors.secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-danger:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  financial-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.navy}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  financial-card-soft:
    backgroundColor: "{colors.emeraldSoft}"
    textColor: "{colors.navy}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  balance-card:
    backgroundColor: "{colors.emerald}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  local-badge:
    backgroundColor: "{colors.emeraldSoft}"
    textColor: "{colors.emerald}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
  form-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.navy}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  form-choice:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  form-choice-selected:
    backgroundColor: "{colors.emeraldSoft}"
    textColor: "{colors.emerald}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  form-error:
    backgroundColor: "{colors.orangeSoft}"
    textColor: "{colors.orange}"
    rounded: "{rounded.md}"
    padding: "14px"
  confirm-delete:
    backgroundColor: "{colors.background}"
    textColor: "{colors.navy}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  category-icon:
    rounded: "{rounded.md}"
    size: "46px"
  tab-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
---

# Design System: BakiBuddy

## Overview

**Creative North Star: "The Daily Planner"**

BakiBuddy makes everyday money feel understandable through a calm reading order, recognizable category symbols, and clear amounts. Phase 8 extends the established premium, clean, friendly, and trustworthy system: deep navy text, a strong emerald balance surface, warm off-white pages, and softly rounded cards.

This records the implemented React Native + Expo system for Android and iOS, with a supplemental React Native Web preview. It is a light-only system. The local SQLite ledger starts empty and presents only accounts and records the user adds. Budget planning uses those recorded funds, explicitly entered schedules, savings reserves and spending limits; expected income remains conditional. Statement imports and image scans add only reviewed, explicitly confirmed records through the same local-ledger visual language. The assistant adds locally calculated question-and-fact summaries, separately reviewed category changes and optional cloud help with an operation-specific data preview and consent. Privacy & data extends the same Settings/form composition with reviewed reference exports, a separate local-deletion review and plainly stated storage limits. Unavailable actions name their future phase. Historical fictional fixtures remain outside the real ledger. No raster composition was approved or generated; the implementation and its production browser captures are the visual evidence.

**Key Characteristics:**

- Emerald carries financial emphasis and selected states.
- Manrope headings and tabular money sit beside familiar platform body text.
- A single scrolling column, tonal surfaces, and chronological rows keep density practical.
- Native navigation, scalable text, and visible local-storage context support trust.

The normative frontmatter is extracted from `bakibuddy/src/theme/tokens.ts` and actual component use. Portable `px` values represent the same numeric React Native logical units; they are not instructions to disable native font scaling. The sidecar extends this file with native notes and illustrative browser snippets. It does not introduce a second primitive token source.

## Colors

The palette pairs quiet natural surfaces with emerald emphasis; warm, blue, and purple accents identify categories without turning the interface into a multicolor dashboard.

### Primary

- **Emerald** (`emerald`) is the balance-card field, actionable text, primary-button fill, selected navigation and choice states, and income/refund amount color. The optional welcome preview also uses it as a solid introductory stage.
- **Soft emerald** (`emeraldSoft`) supports secondary buttons, selected choices and tab indicators, local-storage disclosure, positive category symbols, and the Settings about card.
- **Mint** (`mint`) provides a restrained icon accent on the emerald field. In the optional welcome preview it also supplies the inverted wallet tile and a word accent; **on emerald** (`onEmerald`) remains secondary copy on that field. Primary balance amounts use `surface`.

### Secondary

- **Amber** and **soft amber** (`amber`, `amberSoft`) identify the bills category. Amber text also marks overdue schedules, account funding cautions, some zero-allowance explanations, scan uncertainty, unreviewed or already-saved image rows, unsupported-image recovery and unencrypted-export warnings, always with explicit copy. The retained historical DemoBadge uses this pair. ProgressIndicator defaults to emerald on the line-colored track and now shows actual category shares and budget-cap usage in Insights; over-cap usage uses orange with explicit text.

### Tertiary

- **Orange / soft orange** identify food and drinks, validation messages and the form-error surface. Orange text also highlights protected-funds and payment-timing shortfalls. Orange fills the explicit destructive confirmation button; its label supplies the action's meaning.
- **Blue / soft blue** identify transport and education.
- **Purple / soft purple** identify shopping, entertainment, and subscriptions.

These are semantic pairs from `src/constants/categories.ts`, not interchangeable decorative accents. Health and groceries use the emerald pair; Other uses the secondary/gray pair.

### Neutral

- **Warm off-white** (`background`) is the app page.
- **White** (`surface`) is the resting card and navigation surface.
- **Quiet canvas** (`canvas`) surrounds the bounded supplemental web preview.
- **Deep navy** (`navy`) is primary text and expense amounts.
- **Soft slate** (`secondary`, with the identical `muted` token) is supporting text and neutral transfers.
- **Fine line** (`line`) is the divider and unselected choice border.
- **Field border** (`fieldBorder`) gives text, search and web date inputs a visible outline on white.
- **Soft gray** (`graySoft`) is the disabled-button surface and Other category field.

**The Meaning Before Color Rule.** Income/refunds carry a plus sign, expenses a minus sign, and transfers explicit transfer copy. Color reinforces those meanings; it never supplies the only distinction.

The unused `emeraldDark` source token is intentionally omitted from the normative extracted palette. Component-local divider and modal scrim shades remain local details rather than new global palette roles.

## Typography

**Display Font:** locally bundled Manrope Bold, registered as `Manrope_700Bold`; falls back to the platform body face if loading fails.  
**Body Font:** the native platform default: `System` on iOS and React Native's default on Android. The browser resolves its own system fallback.  
**Display money:** the bundled Manrope face with tabular numerals, regardless of the selected AppText role. Editable amounts use the platform input face rather than display-money styling.

The type pairing puts a distinctive, rounded voice on headings and amounts while keeping supporting copy familiar and easy to scan. No network font request is required.

### Hierarchy

- **Display:** the frontmatter display role establishes the largest money tier and is reused unchanged for the optional welcome message. BalanceCard starts at 40 logical units, retains the display line height, and fits its balance onto one line down to half that size when necessary.
- **Heading:** page and form titles, the daily allowance, and the amount on payment review.
- **Title:** section headings, compact brand wordmark, empty-state title, and balance-card money-in/out amounts.
- **Body:** subtitles, explanatory text, and longer descriptions.
- **Label:** transaction/category names, field labels, choices, action labels, and compact values.
- **Caption:** dates, account names, explanatory notes, footers, and supporting status.

AppText defaults to body and navy. Its heading, title, and display variants use Manrope; the money flag additionally applies tabular numerals. System text scales by default: no `allowFontScaling={false}` or maximum scaling cap is set.

**The Readable Amount Rule.** Preserve the display money face, tabular numerals, explicit MYR formatting, and room for values. Editable amounts remain plain decimal text under an RM field label. Do not replace readable amounts with decorative counters.

Small component-specific typography is not another global ramp: the local-storage badge uses a compact uppercase status label, native tabs request 11-unit labels, and the web adapter uses 10/16 labels. The badge is functional disclosure, not a general-purpose heading eyebrow. Form inputs use 16-unit text; the transaction search uses 15. Amount inputs accept up to two decimal places without commas or an RM prefix; saved values use formatted MYR display.

## Layout

The app uses a single vertically scrolling content column. Screen's content fills available width and is centered with a maximum of 600 logical units. Below a window width of 360, horizontal page padding is 16; at 360 and above it is 24. Top padding is 16 and bottom content padding is 32. Transaction history uses FlatList at the same maximum width with 20-unit horizontal padding. FormScreen also uses 20-unit horizontal padding, with 24-unit gaps between fields and groups. The supplemental web app shell stops at 600, with canvas on either side; native app surfaces remain full width while their content stays bounded.

Spacing comes from the frontmatter scale. Repeated card padding is 24, with denser financial summaries and row groups using 16. Sections generally separate by 24 or 32; the footer begins after 36. Rows use flex growth, minimum widths for readable details, and wrapping rather than fixed absolute placement. Amounts align at the trailing edge and may wrap when space is tight.

Screen and history apply top/left/right safe-area edges and automatic content-inset adjustment. FormScreen covers all four safe-area edges, scrolls and uses KeyboardAvoidingView with padding on iOS and height behavior elsewhere. Native tabs own platform navigation; the web bar adds at least 8 logical units or the bottom safe-area inset. Preserve the scrolling footer and tab-bar clearance. The exact behavior around a notch, home indicator, system gesture area, or keyboard still requires device verification.

All pressable controls target at least 48 logical units. The browser tab target is at least 56 high; its smaller icon pill is a visual element inside that target. Text inputs have a minimum height of 52; multiline fields start at 88. The 46/38 category symbols and local-storage badge are informational rather than touch targets.

Phase 2 production web captures remain under `bakibuddy/test-results/phase2/`. Phase 3 adds 53 supplemental web captures under `.impeccable/review/phase3/`: Home, Budget, budget-plan editing, Bills & income, new/edit scheduled items, payment review and a linked transaction at widths 320, 390, 430 and 1440, with middle/bottom views at 390. Additional views cover a landscape plan form, plan validation, and empty, healthy and shortfall Budget states. These are browser layout evidence. Android/iOS runtime, system text scaling, VoiceOver/TalkBack, safe areas, date pickers, keyboard avoidance and native back gestures remain pending physical-device or simulator verification.

Phase 5 adds 47 current production-web captures under `.impeccable/review/phase5/` at widths 320, 390, 430 and 1440, plus a 568-by-320 landscape recovery view. The packet covers initial account setup, password/file errors, paginated review, inline validation, locked duplicates, confirmation and success. The independent finish review records ship for the sampled source and supplemental browser scope. These captures do not establish native picker/WebView, font scaling, back behavior or screen-reader acceptance.

Phase 6 adds 102 original supplemental web captures under `.impeccable/review/phase6/`, with 17 contact sheets. They cover account setup, image selection/expansion, actual OCR progress, unreviewed candidates, correction/validation, transfers, confirmation, success, duplicate locks and blank recovery at widths 320, 375, 390, 430 and 1440, plus 568-by-320 landscape. The native finish review returned recapture for missing iPhone and Android capture sets and stopped before source assessment. No native finish approval is recorded. The user reported that OCR shows candidate rows on a physical iPhone; no native screenshots, save acceptance or Android observation were supplied. Web captures, reported checks and native bundles do not establish native WebView/WASM, picker, memory, safe-area, keyboard, large-text, gesture or assistive-technology acceptance.

Phase 7 adds 141 supplemental React Native Web viewport PNGs and 18 contact sheets under `.impeccable/review/phase7/`, covering question/answer, conditional forecast, empty/unsupported/invalid questions, optional cloud setup and data consent, waiting/cancel/fallback, category review and repeated-merchant confirmation at widths 320, 375, 390, 430 and 1440, plus 568-by-320 landscape. The saved browser result lists 31 checks with no recorded page errors or external requests and identifies eight synthetic provider requests; this is saved test evidence, not a live OpenAI evaluation. The initial supplemental audit's four material findings and two singular/plural strings were scored resolved in `supplemental-verdict.md`. That source/web disposition is separate from `native-finish-review.md`, which remains recapture for missing native iPhone and Android screenshots. The original native report records its earlier 132-PNG/17-sheet packet; the current manifest has 141/18 and still no native screenshots. Native networking, safe areas, larger text, keyboards, navigation, gestures and assistive technology remain unverified. No live provider or native acceptance is established by this packet.

Phase 8 adds 72 original supplemental React Native Web PNGs and 12 contact sheets under `.impeccable/review/phase8/`. The saved 14-check browser result covers Settings entry, empty/real counts, JSON/CSV review and downloads, export failure, armed deletion cancellation/backgrounding, offline deletion and fresh-ledger persistence. The packet spans 320, 375, 390, 430 and 1440 widths, plus 568-by-320 landscape and browser text stress; full-width originals are retained where sheets center-crop the app column. The independent supplemental review returns ship only for its sampled source/browser scope, with no material fixes. The separate native finish review remains recapture for missing iPhone/Android state, keyboard and large-text capture sets. Neither this packet nor browser text stress establishes native sharing, safe areas, keyboard handling, OS font scaling, gestures, lifecycle behavior, screen-reader focus or acceptance.

## Elevation & Depth

This is a flat tonal system. Cards and the deletion dialog have no authored shadows or elevation tokens. White and soft emerald surfaces separate groups from the off-white page; thin lines separate chronological rows. The emerald balance card gains prominence through color and type scale. ConfirmDelete uses a translucent navy scrim to separate its centered surface from the screen. Native system tabs and date pickers may render platform materials outside these StyleSheet rules.

**The Tonal Surface Rule.** Use the established surface colors and spacing to define hierarchy. The implemented cards do not need a new shadow vocabulary.

There is no shared duration/easing scale or mandatory opening for the ledger. Buttons and the eye control reduce opacity while pressed; the web tabs have their own pressed opacity. The optional welcome preview has one finite, component-local wallet opening, described below. The loading indicator remains a platform activity indicator.

## Shapes

Cards and the deletion dialog use the large rounded corner; buttons, fields, choices and standard category tiles use the medium corner; small category tiles use the small corner. Pills are reserved for compact status/disclosure shapes and retained progress tracks. The wallet mark is a rounded emerald tile, 36 square normally and 50 square in its larger Settings presentation. Its opt-in inverted variant uses a mint tile, emerald wallet icon and white wordmark with a mint full stop on the welcome stage.

Dividers and field/choice outlines are one logical unit. Cards are generally borderless; the future-action icon tile uses a fine border. ProgressIndicator is a clipped, fully rounded 6-unit track used for category shares and budget-cap usage in Insights; the Budget planner continues to explain amounts with text and rows. These existing exceptions are part of the system, so there is no blanket ban on lines or borders.

## Components

### Buttons

AppButton has primary, secondary and danger variants, an optional leading Ionicon, centered text, a medium corner, and padding from the frontmatter. All variants have a minimum height of 48, with wrapped/scalable labels allowed to increase height. Primary uses emerald/white; secondary uses soft emerald/emerald; danger uses orange/white for explicit deletion confirmation, including Delete all local records. Disabled overrides every variant to soft gray/slate, exposes disabled accessibility state and aria-disabled for the browser adapter, and does not invoke an action. Pressed opacity is 0.72.

Primary actions add and save real accounts or transactions, budget plans and scheduled items, open actual payment recording, or open the export destination chooser after scope review. Secondary actions navigate, reveal filters, link an existing matching transaction, offer a separate save after a duplicate warning, or open removal confirmation. Saving/deleting labels disclose busy state and disable controls. Native controls retain platform accessibility behavior; the app does not define bespoke hover or focus-ring tokens.

### Disclosure Chips

LocalBadge appears beside the brand in tab headers, reinforced by the saved-on-device footer. It has emerald uppercase text on soft emerald and states ON THIS DEVICE. It is informational. ChoiceGroup is the separate interactive pattern for form selections and history filters. DemoBadge remains as a historical component and is not used to label real ledger data.

### Cards / Containers

FinancialCard has white and soft-emerald tones, a large corner, and 24-unit default padding. Transaction summaries use denser padding; Settings cards group related text. Cards have no shadow. SectionHeader pairs a title with an optional labeled route link; the row can wrap and the link keeps a minimum 48-unit height.

EmptyState centers a 72-unit soft-emerald icon tile, title, and description with a maximum copy width of 320. Empty accounts/history explain the first action; filtered history supplies no-results recovery. Budget uses BudgetSummary's setup card when no plan exists, and its schedule lists use contextual text when empty. Insights uses the same EmptyState for a genuinely empty ledger or selected range, with account/transaction setup or filter-reset actions. A selection with no expenses has no invented category or spending chart; refunds and transfers remain distinct.

### Inputs / Fields and Choices

Field places a persistent label above a white input with a field-border outline, medium corner and 8-unit group gap. Hints and inline errors sit below it. Errors replace the hint and turn the border orange; FormError uses an orange-on-soft-orange alert with an assertive live region for operation failures. Values stay in the editor after failure. Inputs expose their error or hint as an accessibility hint and their disabled state explicitly. They become noneditable while busy, without an invented disabled color treatment. The PDF-opening-password field reuses this treatment with obscured entry, no autocomplete, autocorrection or capitalization, and a persistent local-use/clearing hint.

Amount fields use numeric keyboards suited to their task: decimal-pad for transaction amounts, scheduled amounts, reserves and spending limits, and numbers-and-punctuation for signed opening balances. Labels and hints explain plain decimal entry, full scheduled amounts, and the difference between a blank cap and a zero cap. ChoiceGroup wraps 48-unit radio targets with visible labels; the selected option changes both border and tonal fill to emerald and exposes checked state. Income cycles, schedule type/repeat/account/category choices and payment-status filters reuse this pattern. History type/account/category filters retain their clear-search-and-filters action when active.

Native DateField opens the community platform date picker, using an iOS spinner with a Done action and the Android default picker. The web adapter uses a light native HTML date input with the same outlined form treatment. Both identify Kuala Lumpur financial dates and support a caller-supplied label and maximum date. Scan correction permits an empty date rather than inventing one; native DateField displays Choose date until an explicit picker selection or iOS Done action supplies it. Actual transaction dates and the first cycle start default to today as the latest date; schedule due dates and cycle-end/review dates permit future planning. Browser evidence does not verify the native picker or keyboard.

### Deletion Confirmation

ConfirmDelete is a centered background-colored dialog with 24-unit padding, 16-unit internal gaps and a maximum width of 440, inside a 24-unit padded translucent navy scrim. It states the consequence, offers an orange Confirm deletion action and a soft-emerald Keep it action, and exposes modal/alert semantics. Busy state disables both actions; native back requests cancel only when idle. Screen-reader focus behavior still needs native testing.

Budget-plan removal, schedule deletion and payment unlinking reuse this dialog. Their copy distinguishes what stops or becomes pending from what stays recorded: removing a plan keeps schedules and transactions; deleting a schedule keeps transactions; unlinking keeps the transaction and restores the pending occurrence.

### Navigation

Android and iOS use Expo Router NativeTabs in the order Home, Transactions, Budget, Insights, Settings. The platform renders SF Symbols on iOS and Material symbols on Android, with emerald selected state, secondary unselected state, white background, soft-emerald indicator, and history-based back behavior. Do not recreate a browser tab bar on native platforms.

The supplemental web adapter uses the same routes with headless Expo Router tabs. Each tab exposes tab role and selected state, uses a 48-by-30 icon pill, and keeps its label visible. It has a white bar, fine top line, at least 56-unit targets, and bottom safe-area padding. This adapter is illustrative of shared identity, not proof of native navigation rendering.

### Welcome and Login Preview

The optional Settings entry opens a bounded scrolling column with a solid emerald stage above the off-white form. The stage reuses the inverted Brand, a 48-unit close target, the display-role two-line message and on-emerald supporting copy. The stage uses 24-unit horizontal/bottom padding and 16-unit top padding; the form uses 24-unit padding, 16-unit group gaps and 12-unit gaps between its two main actions. Persistent email/password labels and outlined Field controls retain their usual visual treatment while disabled. The gray Sign in action explicitly says Coming later; the emerald Continue as guest action opens the existing Home. A centered saved-on-device caption and secondary Replay opening animation action complete the form. This is an optional preview, with no account or startup gate.

WelcomeOpening places the existing vector wallet inside layered mint-toned 96-unit tiles with large corners on a solid emerald overlay. It adds no shadow, image asset or reusable motion token. The mark arrives through rotation and scale, its supporting tiles translate and rotate, and the overlay fades during one finite sequence (about 1.1 seconds), with a bounded completion timer. Portrait copy sits below the symbol; below 480 units of window height the symbol and copy share a row. The outlined Skip intro control is immediately available, at least 140 by 48 units, above the bottom safe-area inset. Replay is explicit rather than a recurring loop.

The source bypasses the opening for reduced-motion and native screen-reader preferences, disables Replay with explanatory copy, and cancels motion on route departure, backgrounding or unmount. While open, background controls are hidden from accessibility and pointer interaction. The supplemental web implementation makes the background inert, gives the opening modal-dialog semantics, focuses Skip, contains Tab/Shift+Tab, supports Escape and restores a valid settled control after dismissal. Saved browser focus observations support that web behavior; live OS/media preference switching and native assistive technology, safe areas, enlarged text, gestures and on-device animation performance remain unverified. The formal native finish disposition is recapture. This component extends the existing palette, type and control system; it does not set a global entrance-animation requirement.

### BalanceCard

A solid emerald card receives real balance, income, expense and account-count props. Recorded balance includes opening balances and all recorded effects; it is not a live bank balance or a safe-to-spend forecast. With no accounts it shows zero and the record-based explanation; once an account exists it adds this month's income/expenses in Kuala Lumpur time. Refunds are separately disclosed outside the card. Its minimum 48-square eye control changes its accessible label between Show/Hide balance and exposes expanded state. Hidden state masks the balance and visible period totals; it is local presentation state and resets on reload. The lower totals wrap naturally. The internal green divider is a component-local shade, not an extra palette token.

### BudgetSummary and Planning Surfaces

BudgetSummary reuses the soft FinancialCard and existing AppText/AppButton hierarchy. With no plan it explains setup and provides the next action. An active plan shows a tabular MYR daily allowance in the heading role, the remaining days including today, and the exclusive cycle-end date. A compact Home presentation links to Budget. Expired or upcoming plans replace the allowance with a date-update explanation; calculation errors use FormError and an edit-plan action. Shortfalls and zero allowances have explicit explanations alongside semantic color.

Budget lays out the recorded balance, unpaid bills, reserve, optional spending-cap figures and extra spending as wrapping amount rows with fine dividers. It states that daily amounts round down to whole sen, transfers do not count as spending and refunds do not reset the cap. Expected income is excluded from today's allowance until recorded. A separate white card labels conditional forecasts before extra spending and after the full allowance, with assumptions beside the amounts. Timing shortfalls, overdue expected income and individual account funding cautions use plain text rather than charts or an invented risk score. The formulas and recurrence rules remain in `BUDGET_RULES.md`.

The plan editor reuses FormScreen, ChoiceGroup, DateField and Field for weekly, monthly, custom and irregular cycles, a savings reserve and an optional spending cap. Its hints explain that reserves protect existing money and schedules never create income automatically. Insights now reads actual saved records for the approved Phase 4 analytics and links to transaction history.

### Scheduled Items and Payment Review

Bills & income separates schedule definitions from dated payments to review. Repeating rows use existing label/body text, fine dividers and secondary review/edit buttons; pending and linked records use ChoiceGroup, with a labeled action to reveal more payments. Overdue state is written explicitly and reinforced by amber. Schedule editing reuses the incumbent form controls, supplies an account-setup recovery path, and explains locked financial fields when records are already linked.

Payment review shows the full amount, due date and account before its actions. It distinguishes recording an actual payment after money moves from linking a matching transaction already in the ledger. Matching requires the same type, full amount and account. Linked state offers the recorded transaction and explicit unlinking; it does not imply a bank payment or a second transaction. Errors retain the recoverable form treatment. These surfaces add no new palette, type scale, corner, elevation or control primitive.

### Insights and Charts

Insights preserves the inherited scrolling column and hierarchy. ChoiceGroup offers current-month, last-seven-day, last-thirty-day and custom inclusive ranges, plus an account filter. Custom DateFields and an Apply action retain invalid drafts beside a clear error, while the prior applied range stays visible. These historical filters are separate from the explicitly labeled current-cycle, all-account budget section.

Recorded income, gross expenses, refunds and net flow appear as wrapping amount rows, with the exclusions stated beside them. Gifted Charts draws flat bars using verified integer-sen values and the existing emerald/navy palette; it owns no money calculations. Spending can group by day, Monday-based week or calendar month. Up to seven buckets appear per page, with visible dates, earlier/later actions and a Show chart values fallback for exact amounts. Sparse and zero buckets are retained without interpolation. Bars do not animate or require hover. Single-bucket layouts retain a readable period label and the exact-value fallback.

Category rows combine explicit names, exact amounts, two-decimal shares and the incumbent ProgressIndicator in each category's semantic color. Largest-remainder percentage labels add to 100.00%. Income/expense/refund bars retain direct labels and exact figures in the adjacent cash-flow section. Descriptive equal-length-period comparisons disclose missing baselines rather than inventing percentages. Recorded summaries never claim complete activity or financial predictions.

Current budget usage reuses existing cap rules: gross recorded expenses plus unpaid bills. Exact amounts and over-cap percentages remain visible when the graphic stops at 100%; zero, missing and inactive caps have explicit recovery states. The formulas and drawing/financial boundary are recorded in ANALYTICS_RULES.md. The Phase 4 evidence and native-device limitations are recorded in PHASE_4_REPORT.md.

### TNG Statement Import

Import TNG on Home and Import TNG statement in Settings open the same FormScreen route. It preserves the bounded scrolling column, Manrope heading, platform body text, outlined fields, wrapping ChoiceGroup controls and primary/secondary AppButton hierarchy. First use offers Add eWallet account with the existing account editor preselected to eWallet, alongside opening-balance guidance. File selection and password recovery remain in the form; visible progress, an activity indicator and Cancel reading explain active extraction. The hidden local PDF reader has no independent visual treatment.

Review begins with statement dates, the destination account, masked wallet suffix and excluded-row counts. A selection/classification count and disabled continuation state keep readiness visible. Ten rows per page use fine bottom dividers, 16-unit vertical padding, 48-unit minimum checkbox targets and flexing detail text. All, Need classification and Selected filters reuse ChoiceGroup; pagination stacks its labeled controls. Nothing starts selected. The inline row editor reuses Field, DateField, ChoiceGroup and FormError, with persistent source context, separate money direction/type choices, a tracked-account choice for transfers, and Apply/Cancel row changes actions. Errors retain entered values. Suggestions, classifications and exact amounts are written explicitly rather than communicated by color alone.

Already-imported or conflicting source rows are visibly locked with orange explanatory text and disabled checkboxes. Possible manual duplicates keep an explicit separate-transaction checkbox. Confirmation is another FormScreen state, with selected count/account, excluded count and separate expense, new-income, refund and between-account totals before the primary Confirm import action. Back to review preserves the draft; save failure retains it with FormError. Success names the saved count and offers View transactions and Import another statement. These states add no palette, typography, corner or elevation token; import rules and native-runtime limits remain in IMPORT_RULES.md and PHASE_5_REPORT.md.

### Receipt and Screenshot Scanning

Scan receipt on Home and Scan receipt or screenshot in Settings open the same FormScreen route. The scanner extends the statement-import composition with the existing bounded column, Manrope heading, platform body copy, outlined fields, wrapping choices and primary/secondary buttons. Account setup, image layout and supported-input guidance precede image selection. A white, medium-corner source preview can expand proportionally for comparison; recognized text is selectable. The local reader adds progress copy, the platform activity indicator and Cancel image reading, without a new visible reader surface.

Five candidates per page use fine dividers, 16-unit vertical padding and explicit amount/date placeholders when needed. Every row starts excluded and needs review. Amber copy names uncertainty, missing fields or an already-saved image row; reviewed state uses an explicit label and emerald. The inline editor retains the image above it and reuses Field, DateField, ChoiceGroup and FormError for corrections, transaction type, category and transfer direction/other account. A 48-unit minimum checkbox row records the field check; Include reviewed row validates it before making the row selectable. Edits clear that check. Recognized source text follows the editor actions.

Same-image locks omit review and inclusion controls and state Already saved from this image. Possible duplicates show the existing orange error treatment and a separate-payment acknowledgement. With no included row, Continue with reviewed rows is disabled and nearby copy explains the required review/selection; continuation errors appear beside that action. Confirmation lists each selected transaction with a neutral Account label for nontransfers and From/To accounts for transfers, followed by separate expense, income, refund and transfer totals before Confirm scanned transactions. Back to scan review preserves the draft; save failure retains it with FormError. Success names the saved count and offers View transactions and Scan another image. Blank results retain retry, layout and manual-entry recovery. Transient source image/text are cleared on discard, leaving or backgrounding. These states introduce no palette, type, corner, elevation or motion token; input/privacy rules and device limits remain in SCANNING_RULES.md and PHASE_6_REPORT.md.

### Local Money Questions

Ask about your money on Home and under Your assistant in Settings opens a FormScreen with the existing Manrope heading, platform body copy, persistent multiline question field, wrapping default-period choices and primary Ask locally action. The single column keeps the question, scope and result together. Examples are disclosed by a secondary action; Review expense categories opens its own form. These controls inherit the existing minimum target sizes and pressed states.

The white FinancialCard answer repeats the submitted question and its scope, then an emerald Calculated on this device label, selectable authored fact text and secondary caption cautions. Current balance uses an as-of financial date; historical spending uses its selected range; weekly change names both equal periods; forecasts name their inclusive end date and conditional assumptions. Empty history, missing plans and unsupported questions remain explicit. A changed record or financial date hides stale facts and offers Refresh this answer. A recoverable calculation error keeps the previous answer. Cloud-selected facts can appear first while all verified facts and assumptions remain available. Fact sentences use ordinary body text with inline MYR values, rather than introducing another display-money tier.

### Optional Cloud Consent

AssistantCloud follows the main local task as a flat section separated by a fine top rule and existing spacing. Its On this device / Set up cloud choices use ChoiceGroup. Session setup reuses the outlined URL and secure token fields; the copy distinguishes a companion server token from a provider API key and explains that localhost refers to the current device. The approved 0.7.1 provider follow-up identifies Groq, links its data policy, explains free quotas/paid-plan costs and states its retention exceptions. Connection readiness states that nothing has been sent. Destination/provider text and an amber local-HTTP notice precede request actions. Existing visual tokens and controls are unchanged; native evidence gates remain open.

Review this request displays the question and selected period, the exact verified fact text for insight selection, or merchant names with temporary row labels for category suggestions. The latter explicitly excludes amounts, dates, accounts, notes and images. An optional selectable exact-fields view, data-policy action, cost/retention explanation and primary Send this request make the approval specific to that operation. Before sending, Cancel without sending states that nothing was sent. While waiting, the platform indicator and Cancel cloud request remain visible; the disclosure says the request was sent and provider processing or charges may continue. Errors use FormError and keep the local result available. Clear connection, route departure and backgrounding have source paths to abort active work, clear session credentials and discard unapplied cloud output; native lifecycle behavior remains a manual check. Revision changes invalidate pending requests and reject stale output. These are task states in the incumbent system, not a new consent-dialog, motion or elevation vocabulary.

### Expense Category Review

Review expense categories uses FormScreen and five fine-divided rows at a time for expenses currently in Other. A row shows merchant, date, expense amount, current category and the source or uncertainty of the suggestion. Wrapping ChoiceGroup controls allow correction; the reused minimum-48-unit ScanCheck explicitly includes a changed category. Nothing starts selected, and changing a category clears inclusion. With no selection, nearby copy explains the disabled review action. Empty, stale and saved states supply direct status or reload actions; pagination warns that moving pages clears unsaved selections.

Final confirmation repeats each selected merchant with its local date, exact amount and account before the old-to-new category text, distinguishing repeated names. It explains preserved payment details, offers Confirm category changes and Back to category review, and shows that cloud suggestions are paused. Entering confirmation invalidates pending/in-flight category requests so they cannot replace deliberate selections; returning requires a new request. Category changes affect category reports without creating transactions or changing amounts/balances. The route reuses existing row spacing, rules, fields, buttons and errors; it adds no palette, type, corner, elevation or motion token. Financial/privacy boundaries remain in ASSISTANT_RULES.md; executed checks and device limits remain in PHASE_7_REPORT.md.

### Privacy and Data Controls

Privacy & data controls in Settings opens the existing FormScreen with its native-style back action, Manrope heading and bounded scrolling column. Current account, transaction, schedule, payment-link, plan and source-marker counts use wrapping secondary body text. Take a copy, How your data is handled and Remove local records use title-role headings, 16-unit group gaps and fine top rules with 24-unit top padding. These are flat task sections rather than a new card hierarchy. Empty storage disables deletion and explains why beside the action.

JSON and CSV each replace the task content with Review your export, persistent counts, exact scope and exclusions, an amber unencrypted-file warning, destination/privacy context and the unavailable-restore limit before Choose export destination. JSON is a reference archive of allowlisted ledger inputs; CSV is transaction-only and explicitly discloses its formula-text prefix treatment. Primary export and secondary cancellation reuse AppButton. Preparing export changes the action label and locks relevant controls. FormError stays beside the action after failure. Web completion says a download was requested; native completion says the share sheet closed and asks the person to check their destination. Neither message claims a copy was saved.

Delete local records? is a separate full form state, rather than the smaller ConfirmDelete dialog used for individual items. It repeats affected collections and counts, the irreversible consequence, unavailable restore and external-copy/secure-erasure limits. The existing minimum-48-unit ScanCheck requires an explicit acknowledgement; the outlined Field separately requires exact uppercase DELETE. The orange Delete all local records action stays disabled until both are supplied and the reviewed content is current. Cancel deletion is a visible secondary action. Stale review and failure remain recoverable; failure clears the armed text and acknowledgement. Successful deletion returns to controls with empty counts and a polite live status naming the unchanged external copies. Backgrounding while idle clears pending task review; native lifecycle behavior remains unverified.

Read privacy notice replaces the content with title-role section headings and familiar secondary body text, followed by the Groq policy action and Back to data controls. Storage protection, selected files, optional cloud data, retention, exports/deletion and development limits are explicit; no app-managed encryption or restore is claimed. Common fields, errors and acknowledgements expose hint, disabled, alert and checked semantics, without another visual treatment. These surfaces add no palette, type, corner, elevation, motion or raster asset. Native share-sheet, keyboard, larger-text, focus/announcement and gesture behavior still require device verification.

### TransactionItem and CategoryIcon

TransactionItem groups an icon tile, title/type/account detail, and trailing amount, with fine dividers between records. Income/refunds are positive emerald, expenses negative navy, and transfers neutral with “Between accounts · not spending” copy. A row supplied with an edit action exposes button semantics, an edit/delete hint and pressed opacity of 0.7. Its grouped accessible label includes title, direction, amount, type and account; real records never announce demo status. History is chronological and its summary explicitly says all time, distinct from Home's monthly figures.

CategoryIcon uses Ionicons inside a 46-square medium-corner tile or 38-square small variant. Income/refund replaces the category symbol with a down arrow; transfer uses swap arrows. These are vector icon components; emoji and text glyph substitutes are not the shipped icon system. Decorative icons are hidden from accessibility so meaningful labels are announced once.

### ProgressIndicator and FutureAction

ProgressIndicator, introduced in Phase 1, is now reused in Insights for category shares and current-cycle budget-cap usage. It clamps finite values to 0–100, falls back to zero for nonfinite input, and exposes a labeled progressbar value. Budget forecast and planner screens continue to use text and rows. Historical demo fixtures and their tests are retained separately and are never seeded into SQLite or mixed into real totals.

FutureAction remains a retained disabled pattern that names its phase and uses a neutral bordered icon tile with an accessible unavailability label. Home now presents working secondary Ask about your money, Import TNG and Scan receipt actions. Settings includes working image scanning, Statement import, Your assistant and Privacy & data entry points, with separate money-question and category-review actions. Reference export and reviewed local deletion are active Phase 8 controls; Settings no longer presents them as a future row.

## Do's and Don'ts

### Do:

- **Do** use semantic tokens and the existing components before introducing a new visual primitive.
- **Do** keep local-storage disclosure visible and distinguish recorded balances, period totals, daily allowances and conditional forecasts.
- **Do** keep expected income, unpaid bills, reserves and payment links explicit beside the financial amounts they explain.
- **Do** preserve tabular MYR amounts, explicit transaction direction, and neutral transfer treatment.
- **Do** retain native navigation, safe-area support, default text scaling, and at least 48-unit control targets.
- **Do** allow headers, amounts, and chronological rows to wrap on compact screens.
- **Do** keep future actions disabled or explicitly unavailable with a phase label.
- **Do** use persistent field labels, specific hints, visible selected states and recoverable validation feedback.

### Don't:

- **Don't** add dark-mode claims, animated money counters, or an unimplemented motion scale.
- **Don't** use category color as the only way to explain transaction kind or budget status.
- **Don't** promote component-local colors or the unused emeraldDark token into new global roles without a deliberate implementation change.
- **Don't** seed fictional fixtures into the real ledger or present them beside real totals.
- **Don't** treat browser captures or native bundle generation as successful Android/iOS runtime testing.
- **Don't** add unapproved Phase 9 or release behavior under this documentation pass.

