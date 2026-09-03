# Design QA

## Target and evidence

- Target: SpeedcubeQuest 3×3 algorithm-library structure, adapted into an original Chinese personal-learning product.
- Reference desktop, 1265 px wide, OLL default state: `outputs/reference/speedcubequest-oll-desktop.png`
- Reference mobile, 390×844, OLL default state: `outputs/reference/speedcubequest-oll-mobile.png`
- Implementation desktop, 1265×806, OLL default state: `outputs/implementation-cfop-desktop-1265.png`
- Implementation mobile, 390×844, OLL default state: `outputs/implementation-cfop-mobile.png`
- Implementation mobile detail, 390×844, F2L 01 dialog: `outputs/implementation-cfop-mobile-detail.png`
- Side-by-side comparison: `outputs/comparison-oll-desktop.png`

## Visible comparison

The implementation preserves the reference’s major information architecture: persistent global navigation, left-side case library on desktop, compact stage introduction, expandable guidance, grouped algorithm cards, and mobile-first linearization. It deliberately uses an original CFOP LAB brand, indigo palette, typography, icons, copy, and generated diagrams instead of copying the reference site’s identity or assets.

## Findings and iteration history

1. P1 — At the 791 px desktop breakpoint, the second grid column became an implicit row and left the main content blank. Fixed by retaining `minmax(0, 1fr)` as the second column in the 1050 px media rule.
2. P2 — Two OLL groups remained in English. Added Chinese labels for “Corners Correct” and “L-Shapes”.
3. P2 — Full-page capture is intentionally very tall for 57 cases; added viewport evidence and a same-width side-by-side comparison for meaningful visual judgment.

## Functional checks

- F2L stage shows 41 cards and all images load.
- PLL search for `T-Perm` narrows to one card.
- Cross page exposes four training lessons.
- Mobile detail dialog opens for F2L 01 and has no broken image.
- Browser console contains no error or warning entries from the application.
- Production build generates 119 SVG diagrams and completes successfully.

## Final result

Passed after one layout correction. No open P0, P1, or P2 visual defects found in the checked states.
