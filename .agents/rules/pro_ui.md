# Pro UI rules (src/pro)

Any work under `src/pro/` follows `docs/pro-ui/DESIGN.md`, not `design_system.md` (that file is for
the classic UI only).

Short version:
- One component at a time. Research the options in the library roster, ask the owner, record the
  answer in the Decision log of `docs/pro-ui/DESIGN.md`, then build only that component.
- Never choose a library, variant, colour or animation on the owner's behalf.
- HeroUI v3 free core first (no HeroUI Pro), Hugeicons only, bklit for charts/KPIs. BoardUI,
  Magic UI, React Bits and Untitled UI only where decided. Origin UI is dropped.
- Every button, pill, label and header has an icon (icon + text, or icon only with aria-label).
- Phone first, light and dark, no glass (only exception: the mobile nav pill, React Bits Glass
  Surface).
- Product name is always "HAD" (long form "Home Assistant Dashboard"). Never write "HOMZ".
- Status pills are green / orange / red only (fine / needs a look / problem).
- Current state, reusable pieces, known gotchas and what to build next: `docs/pro-ui/HANDOFF.md`.
