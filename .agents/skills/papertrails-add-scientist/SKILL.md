---
name: papertrails-add-scientist
description: Research and add a named scientist to the PaperTrails scientific-history timeline. Use when Codex must extend data/scientists.yaml with verified biographical details and landmark publications, download a suitably licensed portrait into images/, generate a matching illustrated portrait in images/cartoons/, and validate both data and UI using web searches and authoritative sources.
---

# Add a PaperTrails Scientist

Add one named scientist as a complete, reviewable change: YAML metadata, photographic portrait, generated illustration, landmark works, source links, and UI verification.

## Establish the repository contract

1. Locate the PaperTrails root by confirming `data/scientists.yaml`, `images/`, `images/cartoons/`, `src/dataLoader.js`, `src/timelineRenderer.js`, and `src/modalManager.js` exist. Do not assume the current directory is the root.
2. Read `README.md`, the complete current `data/scientists.yaml`, `images/ATTRIBUTION.md`, and the code that consumes scientist data before editing. Also read the repo-local Paper Trails cartoon portrait skill when present. Treat the repository as authoritative if it has evolved beyond the conventions below.
3. Inspect `git status --short`. Preserve all unrelated user changes and avoid reformatting existing YAML.
4. Inspect several current portraits and illustrations, including recently added examples, before choosing crops or generating art.
5. Do not modify discoveries, significant events, application code, or the timeline date range unless the user explicitly includes them.

The currently established scientist shape is:

```yaml
scientist_id:
  name: "Full Name"
  summary: "One concise sentence explaining why this scientist and their work matter."
  color: "#336699"
  photo: "images/scientist_id.jpg"
  cartoon: "images/cartoons/scientist_id.png"
  nationality: "British"
  birth: "1900-01-01"
  death: "1980-01-01"
  academic_affiliations:
    - institution: "Example University"
      association: "Student and later professor"
      coat: "images/institutions/example-university.png"
  publications:
    - year: 1930
      title: "Canonical Publication Title"
      abstract: "One concise sentence explaining its scientific contribution."
```

Follow the fields supported by the current repository. `summary` is the short profile text shown in the scientist detail panel and should identify the person's enduring scientific significance without duplicating publication abstracts. `academic_affiliations` records verified university-level education, teaching, or research associations; include only real academic associations, omit the array when none can be verified, and do not substitute unrelated employment, honorary membership, or a learned-society fellowship merely to fill the section. Do not add URLs, citations, awards, prose biographies, or unconsumed metadata to the YAML. Keep research sources in working notes and cite them in the final response.

For each affiliation, verify the institution and relationship. Reuse an existing local `coat` only when it represents that institution. If a new emblem is appropriate, use an official or repository-compatible historical asset, store it under `images/institutions/`, and record its provenance and licence in `images/institutions/ATTRIBUTION.md`. When no compatible emblem can be verified, omit `coat` so the UI uses its neutral academic-building icon; update any exact neutral-affiliation list or count maintained in `README.md`.

## Research on the web

Web research is mandatory. Search separately for identity, life dates and nationality, landmark publications, and a portrait with licensing information.

1. Resolve the scientist's identity. Search the full name plus field, institution, or life dates. If multiple people remain plausible, ask the user to disambiguate before editing.
2. Verify the preferred full name, diacritics, nationality descriptor, birth date, and death date against at least two reliable sources where practical. Prefer official academies, universities, Nobel or professional-society biographies, national archives, and reputable reference institutions. Use Wikipedia only as a discovery aid, never as the sole authority.
3. Find the scientist's most important original scientific works. Prefer original journal or book records, DOI/publisher pages, scholarly archives, library catalogues, academy records, and authoritative bibliographies.
4. Select 1–3 landmark works, normally 2–3 when evidence supports them. Favor works responsible for the scientist's best-established breakthroughs or enduring methods; do not rank by raw citation count alone and do not pad the list with weak choices.
5. Verify the canonical title and publication year of every selected work. Use the original-language title when it is the standard scholarly form; otherwise use the established English title. Preserve diacritics.
6. Write each abstract as an original, neutral, single-sentence summary of the scientific contribution. Do not copy source wording or exaggerate priority, sole authorship, or impact.
7. Retain the direct URLs used for each fact, publication, and image license for the final handoff.

Never guess a precise date. For a living scientist, use `death: ""` and mention the limitation in the handoff. If only a partial historical date can be verified, use the most precise truthful value supported by the current schema and call it out. If the important works fall outside the configured timeline range, stop and explain the scope conflict rather than silently choosing inferior works or changing application configuration.

## Choose identifiers and values

- Create a unique, ASCII, lowercase `snake_case` ID derived from the scientist's commonly used surname or full name. Follow current conventions but do not copy legacy camelCase anomalies. Check both YAML keys and filenames for collisions.
- Use the same ID for `images/<id>.jpg` and `images/cartoons/<id>.png`.
- For filenames containing both a surname and given name, follow the repository's surname-first convention. Keep surname particles together, and prefer a surname-only filename when it is unambiguous.
- Choose an unused six-digit hex color that remains visible in both themes. Compare it with current scientist colors; avoid an unnecessary duplicate.
- Use an adjective or established compact nationality description matching nearby entries.
- Quote all strings. Keep years as integers and life dates as ISO `YYYY-MM-DD` strings when full dates are known.
- Sort the selected publications by year. Add a single top-level YAML block with the same spacing and indentation as existing entries; avoid moving unrelated entries.

## Download and prepare the portrait

1. Use image search to locate a recognizable portrait, then open the hosting/source page and verify its provenance and license. Prefer Wikimedia Commons, a national archive, a university archive, a museum, or another institution that exposes the original file and rights statement.
2. Use only a public-domain, CC0, or otherwise clearly repository-compatible image. PaperTrails is Unlicensed, so do not assume an image-search thumbnail or an unattributed web image can be redistributed. If no compatible portrait can be verified, stop and report the licensing blocker.
3. Download the original asset, not a search thumbnail or hotlink. Record the source page, creator when known, and license/status.
4. Prepare a true JPEG at `images/<id>.jpg`. Correct orientation, convert color mode if needed, and crop for a centered head-and-shoulders composition that survives the UI's circular `object-fit: cover` crop. Prefer at least 512×512 source detail, but do not invent detail by extreme upscaling.
5. Verify the final file opens, its encoded format matches `.jpg`, the subject is recognizable at 42 px, and no watermark, caption, border, or unrelated person remains in frame.
6. Add or update the portrait's source, creator, and rights status in `images/ATTRIBUTION.md` using the repository's existing format.

Preserve the downloaded original only when it is itself the final asset; do not leave temporary downloads in the repository.

## Generate the illustration

Use the available image-generation skill/tool and the repo-local Paper Trails cartoon portrait skill. This action is required, not optional.

1. Supply the prepared portrait as the identity reference and 2–3 representative files from `images/cartoons/` as style references.
2. Write down three visible recognition anchors, then request a square head-and-shoulders editorial caricature with recognizable facial features and period-appropriate clothing in the current Wry Engraver house style. Keep humour secondary to likeness, skin tones natural rather than globally sepia, and the face and shoulders safe inside 42 px and 92 px circular crops.
3. Ask the built-in image-generation tool for a genuinely transparent background. Treat preview checkerboards as untrusted: save the candidate to staging and run the repo-local portrait validator. If the result has a baked pale checkerboard or wrong dimensions, use the portrait skill's deterministic finisher only when its instructions permit, then validate again.
4. Save the accepted result as a true 1024×1024 RGBA PNG at `images/cartoons/<id>.png`. Confirm the corners and background are transparent, the subject has non-empty alpha coverage, and no halo, fringe, or lost pale detail remains. Do not substitute a renamed JPEG.
5. Inspect the full-size illustration over both light and dark backgrounds and inspect its 92 px and 42 px circular crops. Use the repo-local review-sheet helper when available. Regenerate or reprocess if identity, anatomy, crop safety, transparency, edge quality, palette, or visual style is materially inconsistent. Never depict scientific claims, props, or symbols merely to fill the frame.

## Edit the YAML

Add the scientist only after the facts and final asset paths are known. Use the smallest focused patch. Ensure:

- The ID is unique and both referenced files exist with exact case-sensitive paths.
- Names and titles use correct Unicode characters.
- The entry has an original, concise `summary` consistent with the current detail-panel schema.
- Birth precedes death when a death date exists.
- Every publication year is plausible for the scientist and inside the configured timeline.
- Each title/year pair is verified and each abstract describes that work rather than the scientist generally.
- The earliest selected publication is suitable as the scientist's timeline anchor because the renderer positions the portrait at the earliest listed work.
- Academic affiliations contain only verified institutions and associations; every `coat` path exists, and intentional coat omissions are reflected in repository documentation when it maintains an exact list.

## Validate the completed change

1. Parse `data/scientists.yaml` with an existing local YAML parser if available. Do not add a package dependency solely for validation. Confirm the new object has the current required fields, a non-empty summary, an array of publications, integer years, valid affiliation objects when present, and no duplicate key.
2. Check both image files exist, decode successfully, use the intended formats, and have sensible dimensions. Confirm the cartoon is RGBA with transparent background pixels and transparent corners, then inspect both images visually.
3. Run `git diff --check` and review `git diff -- data/scientists.yaml` plus the new asset list. Confirm no unrelated files or temporary artifacts were introduced.
4. Serve the static site over HTTP using the repository's documented command. Use the available collaborative browser preview to load it and check for YAML, console, and network errors.
5. Locate the new scientist on the timeline. Verify the photographic portrait, scientist detail panel, each publication marker and modal, highlight/link behavior, and the earliest-publication position.
6. Toggle cartoon mode and verify the generated illustration loads without fallback, is recognizable, has no visible backdrop or edge fringe, and crops cleanly. Check both light and dark themes when practical.
7. Update README dataset counts only if the repository currently maintains exact counts there. Compute them from the resulting YAML; do not estimate.

## Hand off

State the scientist ID, summary and affiliation coverage, added publications, asset paths, attribution updates, and validation performed. Link the sources supporting biography, publication metadata, portrait provenance, and portrait license. Explicitly note any unresolved ambiguity, omitted affiliation/emblem, or partial date. Do not claim success if the YAML did not parse, either asset failed to load, or the browser did not render the new entry.
