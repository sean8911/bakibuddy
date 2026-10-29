---
mode: Operate
primaryTarget: bakibuddy/src/app/scan-receipt.tsx
relatedTargets:
  - bakibuddy/src/components/ScanRowEditor.tsx
  - bakibuddy/src/app/(tabs)/index.tsx
  - bakibuddy/src/app/(tabs)/settings.tsx
---

# Phase 6 — local image scanning

Extend the existing import/review composition in the Daily Planner world. PRODUCT.md, DESIGN.md and source tokens remain authoritative. No new palette, type scale, elevation, illustration, comp or visual-world change is approved.

Select one printed receipt/payment image or TNG Activity screenshot; read on device; compare every included row to the source; correct missing/uncertain fields; classify money; review duplicates; confirm separate totals and accounts before atomic save. Initially exclude every row. Never invent dates, correct OCR digits silently, count points/balances as payments, or treat a QR code as payment proof.

Use incumbent forms, native navigation, 48-unit targets, wrapping choices, explicit error/recovery, paginated rows and selectable recognized text. Keep source image available during corrections; discard transient image/text on leaving or backgrounding. No raw scan image/text is persisted.

Evidence: source + actual OCR/unit/SQL tests and supplemental browser captures at 320/375/390/430/1440 and landscape. Android/iPhone runtime, WebView/WASM, picker, memory, Dynamic Type, gestures and screen-reader checks remain manual unless actually observed. Review is limited to supplied evidence; web captures never stand in for native screenshots.
