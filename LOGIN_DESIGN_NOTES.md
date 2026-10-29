# Animated entry design — 29 October 2026

The user requested a login design inspired by https://gianmediagroup.com/ and selected **Animated design first**. They then asked to inspect https://sdchack.my/, adapt its starting animation to BakiBuddy's logo/colors and **start the login page**. Version **0.8.1** implements the optional screen in the app, using the previously recommended Emerald stage layout. This is a scoped visual implementation with guest navigation. Real authentication, a startup gate, remote hosting, Phase 9 distribution and data migration remain outside this scope.

## Implemented screen

Open **Settings → Welcome & sign-in → Open login preview**. The local `/login` route shows a roughly 1.1-second emerald/mint wallet opening with immediate Skip intro. Replay opening animation runs it again. Reduced motion and native screen-reader preferences bypass it; leaving, backgrounding or unmounting cancels it. The ordinary Home route and existing deep links remain available. Continue as guest opens Home without creating an account or changing records. Close returns to the prior route, or Home from a direct entry. Email/password fields and Sign in are explicitly unavailable; no real credentials are accepted, saved or transmitted.

The native React Native source is `bakibuddy/src/app/login.tsx`, with `components/WelcomeOpening.tsx` and `hooks/useMotionPreference.ts`. Brand adds an opt-in inverted variant; existing uses retain their default rendering. Fields additionally expose their disabled state explicitly to the browser adapter. Source tokens are unchanged. No new feature dependency, raster artwork, authentication provider or financial/storage logic is introduced.

Expo's compatibility check required matching SDK 58 patches: Expo 58.0.21, Router 58.0.28 and the expected asset/constants/file/font/linking/sharing/splash/system-ui patches. React Native 0.88, React 19.3 and Reanimated 4.7.1 remain unchanged. The first check exposed the removed `absoluteFillObject` helper; the overlay now uses explicit absolute edges. React Native Web's screen-reader query is constant true in the installed adapter, so browser motion uses the real reduced-motion preference; native screen-reader detection remains active.

## Current executed checks

- TypeScript and lint pass; retained **192** automated tests pass.
- Expo compatibility, peer check and frozen install pass. Expo Doctor passes **20/20** when invoked with the bundled npm package; the initial invocation lacked npm on this host and was not a pass.
- Android, iOS and web exports pass with **25 routes**, including `/login`. This is bundle evidence, not native runtime evidence.
- Browser checks on a separate empty local preview origin (`localhost:8084`): Settings entry, visible intro and automatic release, replay, immediate skip, disabled/read-only empty credential fields, disabled sign-in, guest → Home, close → Settings, direct-entry close → Home and small/large/landscape scrolling. No browser console warnings/errors were logged. No financial record was created/deleted, and the ordinary browser/native ledgers were not reset.
- Current captures are the **11** `implemented-*.jpg` files and their source/capture manifest in `.impeccable/review/login/`. Final layouts cover 320 × 740, 390 × 844, 430 × 932, 568 × 320, 1440 × 900 and the settled default viewport of 1175 × 930. The initial review's default capture was a duplicate landscape view; the final recapture supersedes it. Initial sketch captures are historical. Early intro captures deliberately show the rotating mark before it settles. The GIF uses 48 actual browser frames recorded over 1424 ms, plus a final held frame; it is not generated artwork or native performance evidence.
- Opening a second concurrent web tab hit the existing SQLite storage-opening recovery state. After closing the first test tab and reloading the second, direct entry and close passed. No data was cleared. Concurrent web-tab support is not claimed.
- Current audit still reports **one high and one low** tooling advisory, zero critical; see `bakibuddy/test-results/login-audit.json` and the existing SECURITY_REVIEW.md limits. No clean-audit claim.
- Formal native finish review: **recapture**, recorded in `.impeccable/review/login/native-finish-review.md`. iPhone/Android captures, gestures, safe areas, large system text, assistive technology and on-device motion/frame rate remain unverified. The supplemental source/web review identified one major focus-boundary issue. The fix adds a web dialog, inert background, Skip focus, Tab/Shift+Tab containment, Escape and guarded prior/fallback focus restoration. **13 actual DOM observations** pass across portrait/landscape, skip, Escape and timeout; no console warning/error was recorded. The same reviewer scores that single material fix **resolved**, disposition **ship at scored-fix source/web scope**, in `supplemental-verdict.md`. This does not establish a fresh whole-surface or native acceptance. Live OS/media reduced-motion preference switching remains unexecuted; source integration was inspected. The fresh documenter completed the descriptive DESIGN.md comparison in `document-comparison.md`; source/capture manifests and protected normative-frontmatter, token and sidecar hashes were independently rechecked and match. No raster asset ships.

Commands used: `node node_modules/typescript/bin/tsc --noEmit`, `node node_modules/eslint/bin/eslint.js src`, `node --test tests/*.test.mjs`, `pnpm exec expo install --check`, `pnpm peers check`, `pnpm install --frozen-lockfile`, `pnpm --package=npm --package=expo-doctor dlx expo-doctor`, `pnpm exec expo export --platform all --max-workers 2`. Browser checks used the in-app browser against the documented isolation-header preview server.

After the final source correction, TypeScript/lint and all-platform exports passed again. Metro was restarted using `pnpm exec expo start --clear --lan --port 8081 --max-workers 2` (exec session 10982). The iOS manifest reports version **0.8.1**, SDK **58.0.0**, HTTP 200; its development bundle returned HTTP 200 with **12,036,799 bytes**. This verifies host delivery, not a physical iPhone run. The separate browser preview runs at `http://localhost:8084/login` (session 32002) and its tab is retained as the local deliverable. These are development servers, not publication.

## Phone check

Reload version 0.8.1 in Expo Go, open the Settings entry, observe the opening, try Replay and Skip, and use Continue as guest. Confirm the original accounts/transactions are still visible. Also inspect large system text, reduced motion, native Back/edge-swipe and landscape. Do not enter real credentials; authentication is not connected.

## Reference observations

Inspected the live site in the in-app browser at desktop and 390 × 844. The site uses a black cinematic field, oversized white type, a compact floating header, changing header text, a horizontal client carousel and a tilted gallery around a central heading. These are visible observations, not a measured performance or accessibility assessment. No site assets, branding, content or source code are copied.

SDC's live hero was inspected before/after reload: strong display type, a saturated field, mascot and layered floating panels. A separate full-screen preloader was not reproduced in the available browser. The wallet opening is an authored adaptation of the requested idea rather than an exact copy. No reference mascot, logo or website source ships.

BakiBuddy retains its existing emerald/off-white palette, locally bundled Manrope headings, platform body face, flat tonal surfaces, 12–16-unit corners and native controls. Reference influence is limited to decisive type scale and one coordinated motion sequence. No animated financial amount, claim of account protection or decorative perpetual loop is introduced.

## Experience and states

- Guest access continues to the existing local ledger without an account, data transfer, reset or implied cloud backup.
- Email sign-in is clearly unavailable in this design stage; previews must not accept real credentials or simulate an authenticated session.
- The planned form uses persistent email/password labels. Optional show-password and later recovery/account creation are not presented as working services.
- The early sketches explored aligned ribbons. The implementation instead uses a finite layered wallet-mark opening from the user's later animation request, with immediate skip and explicit replay.
- Spatial movement is removed for reduced motion; content and control feedback remain. Animation stops when unfocused/backgrounded. No runtime dependency is needed beyond the installed React Native/Reanimated stack.
- The app implementation must check 320/390/430 widths, landscape, keyboard, large text, native back, screen readers and reduced motion. Browser sketches are composition evidence only.

## Structure candidates

Ordered candidates for the established visual world:

1. Emerald stage: colored upper-third introduction, form directly below, guest access adjacent to the disabled sign-in.
2. Quiet entry: form first on the light ground, compact motion panel last.
3. Side-by-side entry: paired story/form columns when expanded, stacked on phones.
4. Inset welcome: bounded light introduction above a compact inset form, no full-width color field.
5. Form with aside: centered full-height form with a narrow peripheral motion region on expanded screens.
6. Single-panel entry: brand, headline and fields inside one full-height light column with a colored action footer.
7. Open welcome: full emerald entry, guest action first; the email preview is a second native route/state.

The earlier surface roll dealt **7, 1, 2**, with 7 leading. Reference: **seed:1e72731ee8ea444f**. Code-led composition sketches remain in `.impeccable/mocks/decision/`; `.impeccable/login-options.json` is historical. The user subsequently instructed implementation rather than choosing a card. The coordinator used the previously recommended Emerald stage and the user's new animation reference, recording that assumption before editing. The current direction contract is `.impeccable/surfaces/bakibuddy-src-app-login-tsx.md`; the app route is now implemented.

## Design Trio handoff

Intent/journey: optional account entry, immediate guest path, truthful unavailable state, no implied sync/security promise. Articulate: short persistent field labels, explicit preview notice and action names. UI/UX Pro Max: focused `animation reduce motion --stack react-native` search returned UI-thread worklets/Reanimated guidance, applicable to the installed library; its 0.86 version note is not authority over this project's 0.88 baseline. Impeccable: preserve the established world, compare three concrete compositions before implementing the selected one, then review actual renders.

## Historical sketch verification

Reference inspected live. Opened all three sketches through the local comparison page; inspected their complete 390 × 844 composition frames and saved JPEG captures under `.impeccable/review/login/`. Each frame contains its complete actions and preview notice. The expanded raw preview tabs had wider browser canvases, so the saved phone images are explicit frame crops, not responsive-device or native runtime evidence. The comparison-page capture is `choices.jpg`. No browser warnings/errors were reported in the three raw previews. The HTML includes embedded copies of the existing Manrope font and a CSS reduced-motion alternative; OS preference switching and animation frame performance have not been tested.

The earlier comparison ran at `http://127.0.0.1:57598/` and expired without a card choice. It is superseded by the user's instruction to begin implementation and the actual app route. Do not reopen that choice gate or claim a card was clicked.

At the sketch stage no app code changed. Current implementation/checks are recorded above. Schema, tokens, secrets and financial records remain untouched. Phase 9 remains unapproved.
