# Fictional TNG fixtures

These two-page PDFs were generated with ReportLab and pypdf for Phase 5 tests. Every name, wallet ID, reference and amount is fictional. The locked copy uses the test-only password `fixture-pass` and AES-256. No real statement or its password is included.

Expected: 19 successful wallet rows; one failed wallet row; two excluded GO+ appendix rows. The first expense is 1,230 sen; its wallet balance is a separate 8,770 sen. References wrap across three lines and `DUITNOW_RECEIVEFROM` wraps across two. Page two continues the table without repeating its header. The ordinary and encrypted copies contain identical pages. These fixtures and the original supplied sample were checked separately; the fictional fixtures do not prove support for every TNG export variant.
# Phase 6 image fixtures

`scan-fictional-receipt.png`, `scan-fictional-activity.png`, `scan-fictional-overlap.png` and `scan-blank.png` are programmatically generated fictional OCR inputs. They contain no personal source rows. `scripts/make-scan-fixtures.py` regenerates them using Pillow and Windows Arial; no Python runtime is needed to use the committed PNGs. The overlap differs in image bytes while showing the same payment, exercising possible-duplicate review.

