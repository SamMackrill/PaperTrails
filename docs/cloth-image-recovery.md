# Recovering failed cloth images

The three context layers (#65, #66 and #67) have completed review and merged
into `prototype/ui-pass2`. The remaining #65 historical-fallback finding was
already corrected in the required successor #66, before publication.

The final browser audit exposed a separate failure path: SVG images inside
definitions do not reliably deliver their errors through the visible `<use>`
copies. The raster loader now identifies each failed event by its persisted ID
(or title for records without an ID). The renderer marks all those records for
their existing fallback in one frame. SVG errors share the same retry scheduler.
Each record retries only once; failed fallback files retain the continuous SVG
landscape. Cancellation still prevents a disposed or superseded model from
installing a texture. No artwork files, crop metadata or historical dates change.

Reduced-motion CSS previously assigned a transition duration to every element.
Elements without a transition consequently acquired an `all` transition, so the
timeline's measured width could remain at its previous size while its inline
width and folds had reached maximum zoom. Pan controls then remained disabled
and the date range showed the full timeline. Reduced motion now disables
transitions instead of introducing that extra width animation.

The browser audit also waits for zoom controls to settle before clicking pan,
and for the date range to change before asserting its result. It reports its
current phase instead of leaving a long-running check silent.

Validation includes the raster failure regression, the native application and
operator suites, and the browser audit with every generated artwork PNG blocked,
normal cloth proportions and complete unfolding, maximum-zoom panning, the
eight-stop charge trail, keyboard activation, sharing and legacy links, phone
overflow, and a printable eight-stop handout with 27 references.

Delivery uses a separate worktree and review slot. The original integration
worktree contains changes from the artwork thread and is left untouched. A clean
isolated publication checkout packages only the prototype's reviewed commit.
The review gate stays at 61 minutes; no changes target main or production.
