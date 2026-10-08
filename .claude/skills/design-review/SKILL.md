---
name: design-review
description: A sign off pass on a visual change, ending in approve, approve with changes, or block.
disable-model-invocation: true
---

# Design review

Review what this branch changes visually (`git diff origin/main...HEAD -- src/components src/styles src/data`, or what Red names), on its deployed preview, at phone width (390x844) and desktop width (1440x900), in all three views.

Judge, in order:

1. **Hierarchy**: the first thing the eye lands on is the most important thing; one memorable element per section, the rest quiet.
2. **Readability**: text contrast meets WCAG AA over every backdrop the zone can show; line lengths stay under about 80 characters; nothing overlaps at phone width.
3. **The zone**: colours from the zone's `--accent` and `ZONE_ACCENTS`, the zone's switch effect, the zone's box style. Nothing borrowed from another zone.
4. **Motion**: purposeful, `transform` and `opacity` only, nothing when reduced motion is on, nothing that runs off screen.
5. **Phones**: the same features as desktop, touch targets of 44px or more, no horizontal scroll, the HUD bar not covering content.
6. **Copy**: the content-rules skill.

End with one verdict:

- **Approve**: ship it.
- **Approve with changes**: a numbered list of small fixes, each with where and what.
- **Block**: what is wrong, why it matters, and the smallest change that would unblock it.

Attach the screenshots you judged from.
