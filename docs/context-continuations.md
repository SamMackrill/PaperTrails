# Ongoing context between shorter events

When a shorter event ends, reveal a longer context that remains active. The Little
Ice Age can reappear after the English Civil War and before the famine without
implying a new onset. Preserve the existing period dates, independent braids,
proportional artwork and fixed-art cloth folds.

Plan the uncovered intervals on fixed material coordinates. Distribute distinct
source regions of the longer illustration through those intervals, each once;
never repeat the whole picture or stretch it across the full period. Quiet
landscape remains where no context illustration is allocated. A continuation is
an illustration of the same broad period, not a newly dated event or a claim
that a particular depicted activity occurred at its placement date.

This required user follow-up has a separate branch/worktree above PR #65 and
joins the same shared 61-minute review queue. Merge only to prototype/ui-pass2;
initial publication waits for every registered primary layer. Main stays isolated.

PR: https://github.com/SamMackrill/PaperTrails/pull/66.

`contextWindows` subtracts later foreground event footprints from the active
chapter, including the bounded illustration allowance for point events. Longer
panoramas are partitioned into disjoint source facets and assigned to surviving
windows in chronological order. Every window gets a facet when the source has
enough; remaining facets go to larger windows. With more windows than available
facets, placements span the available range without duplicating source regions.
The canvas and SVG use the same plan, and each continuation's material boundaries
participate in cloth-cell construction. Dates and chapter boundaries stay intact.

Continuation inscriptions identify the original period and full dates rather than
claiming a new onset. They use the existing caption collision handling. The original
record remains the selection target; no duplicate event or legacy alias is created.

Validation: 64 native tests and 25 operator tests pass. Added regression checks
cover the 1651–1693 Little Ice Age window, unchanged shorter events, disjoint native
source crops, nested overlaps and point events, density anchors and full unfolding.
T3 confirms the continuing inscription and original record dates, unchanged crop
boxes and retained faces throughout zoom reversal, and complete maximum-zoom
flattening. A new five-era winter atlas replaces the early winter source in this layer. Original PNG bytes and full built-in prompt are preserved in images/tapestry/README.md.
The publisher repeats the complete packaged browser audit before publication.


Reuse requires an explicit continuationRange or dated continuationSources.
Unapproved art stays at its initial placement; missing compatible art leaves
quiet cloth. Winter art is bounded to 1600–1700, 1700–1750, 1750–1800,
1800–1830 and 1830–1850. These editorial visual bounds add no historical dates.
Tests enforce Victorian selection and prevent unapproved reuse. T3 confirms the
Victorian source and visible SVG fallback in an isolated winter fixture. The
artifact audit checks fallback only on rendered sources: fully occluded context
has no image to fail loading but keeps its dated braid.

All custom artwork uses a distinct neutral landscape as its shipped loading fallback.
This integrates the upstream chapter-atlas fix without substituting an unrelated
historical event or era. Winter continuation selection carries the failure state
through its era-specific source lookup. Both source and fallback are tested.
