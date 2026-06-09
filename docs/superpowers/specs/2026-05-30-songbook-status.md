# Songbook / Chord-Diagrams — Status (2026-05-30)

Living status of the effort to render ChordMark songs as print-style "songbook"
pages (centered title + composer, chord-diagram dictionary, two-column body) in
Chord Chart Studio, plus the supporting chord-mark renderer/parser work.

## Repos (all under ~/Github/chordmark/, siblings)

- **chord-symbol** — chord parsing/rendering. Untouched this effort.
- **chord-mark** (fork, v0.17.0) — ChordMark format: parser + renderer. The
  chord-diagram feature lives here. Most work this effort is here.
- **chord-chart-studio** — the web app (React + Vite) that renders ChordMark.
  Consumes chord-mark. The songbook view is built on its existing **print mode**.
- **~/Github/songsheet-parser** (separate project) — generates the `.chordmark`
  files (and the now-retired `json/` intermediate). A new source format is WIP.

## Dev setup (how to run the studio against the fork)

The studio's `node_modules/chord-mark` is symlinked to the local fork via a
`portal:` resolution added to `chord-chart-studio/package.json` (root):

```json
"resolutions": {
  "chord-mark": "portal:../chord-mark/packages/chord-mark",
  "dompurify": "3.4.7"
}
```

The `dompurify` pin resolves a portal link conflict (fork wants 3.4.7, tree had
3.0.9). **These two entries are dev-only and must NOT be committed/pushed.**
chord-mark's `main` is `src/chordMark.js`, so Vite bundles the fork source
directly — no build step needed.

Run: `yarn workspace chord-chart-studio dev` (Vite, http://localhost:5173/).
Studio state (songs + options) lives in one `localStorage` key `state`
(redux-persist); selected file is `fileManager.selected`; `editorMode` is
`ui.layout.app.editorMode`. Inject test songs by editing that key + reload.

## Done

### chord-mark (commits 2a99d73 … 9761af5, on master, UNPUSHED)
- Diagram bug fixes: label fallback for unparseable names; size-class fallback;
  CSS heights matched then made `height:auto`; inline label-band removed; **two-
  digit fret positions no longer clipped**.
- **Comma-form inline voicings**: `Cmaj7[x,12,10,12,12,x]` accepted alongside the
  compact `[x32010]`; backward compatible; 0–24 range; decodes identically.
- **`composer <name>` directive**: parsed into `parseSong(...).composer`, never
  rendered into the chart body (for the studio's page header). Mirrors `key`.
- **Wrap + inline-diagram corruption fixed**: inline diagrams are suppressed when
  `wrapChordLyricLines` is on (the wrap renderer tokenizes text and otherwise
  pulled SVG marker glyphs — fret #, ×, ○ — into chords, e.g. `4××A6`).
- **Inline voicings feed the dictionary**: `getInlineChordVoicings` collects them
  so inline-voiced songs get a populated dictionary in wrapped renders.
- 1437 tests, 100% coverage gate, eslint/prettier clean.

### chord-chart-studio (commits 1eb377b, e23e576, d00db69, on master, UNPUSHED)
- Songbook design spec + this status doc (`docs/superpowers/specs/`).
- **Print preview songbook**: serif title + composer header (`PageHeader`),
  chord dictionary block on page 1 (the `<p>`-line extraction dropped it before),
  serif/diagram CSS. Built on top of the existing `| C  Am |` chord-line layout.
- **Surfaced the diagram options** (`editorModeOptions.js`, commit d00db69) —
  `showChordDiagrams`/`diagramPosition`/`diagramSize` were defined in allWidgets.js
  but never listed for any mode, so they never appeared in the panel.
- **Uncommitted (dev-only, do NOT push)**: the `portal:` chord-mark link +
  `dompurify` resolution in root `package.json`.

## Verified
A full inline-voiced samba renders in the studio print view as: dictionary of
~50 diagrams on top + clean chord-over-lyric body + title/composer header.

## Done — Phase 2 + print polish (2026-06-01)

- **Phase 2 diagrams** (chord-mark `ae0fe99`): Roman-numeral fret positions
  (`toRoman`) and **barre lines** (`cmChordDiagram-barre`, drawn when ≥2 strings
  share the position fret) in `renderChordDiagram`; left margin sized to the Roman
  label so it isn't clipped; themes scss got a `.cmChordDiagram-barre` rule. 1450
  tests / 100%.
- **Print style polish** (chord-chart-studio `6abe159`, `38ec82a`): bold chords /
  regular lyrics; small-caps section labels; column divider; quiet bar separators;
  title letter-spacing; phrase spacing on empty lines; a **"Key: …"** header line
  (from `allKeys`); a per-page **footer** ("title — Page N of M"); and
  **section-label orphan control** in `mapLinesToColumns`. The footer + key line
  are included in the `getPagesHeight` measurement so pagination stays correct.
  Verified live: Roman/barre dictionary + key + footer + 2-page pagination all
  render together with nothing clipped.

## Done — Bar mode + options (2026-06-0x)

Supersedes the old "bars per line is not a render option" note — it now IS one:

- **chord-mark** (`e0f9bae`, `a7bdf66`, `63e38f4`): `barsPerLine` renderer option
  re-segments chord lines (Bar mode), including reflowing/merging chord lines to
  fill the target width, plus a fix for a reflow chunk positioned without its
  lyric line. 1492 tests / 100% coverage (verified green 2026-06-09).
- **chord-chart-studio** (`7e8915a`, `aec1670`, `64ec62a`, `d21c748`, `65c6a62`):
  Bar/Lyric layout-mode + bars-per-line controls; a "Chord durations" option
  (always/uneven/never); first-page height fix so the dictionary no longer
  overstuffs page 1; desktop Edit menu (clipboard shortcuts); the "Getting
  started" sample is now a full ChordMark syntax showcase.

## Done — Phase 3: `_`-anchored corpus (2026-06-09, songsheet-parser)

The per-song corpus (`data/joao-gilberto/songs/<album>/<NN>-<song>.json`,
chord-anchored model) already carried per-entry lyric fragments, and
`chordmark_render.py` already emitted `_`-anchored lyric lines — the stale
flat `chordmark/` files had simply been generated from the retired old JSON.
Done in songsheet-parser (committed on `main`):
- `json_to_chordmark.py` walks dirs recursively and mirrors the per-album
  layout; single-song docs are named after the file stem (`NN-` prefix), so
  repeated titles across albums don't collide.
- `render_song` emits `composer`/`key` declarations (key gated to real key
  names) and drops fully empty bars (vision-parse noise).
- `normalize_chord_name` extended: comma/dot tension stacks (`E13,9`→`E13`),
  slash-4 sus (`C#4/9`→`C#9sus4`, `G7/4`→`G7sus4`), `m7-9`→`m7b9`.
- Corpus regenerated: 185 songs under `chordmark/<album>/`, all parse in the
  fork, 4986 lyric lines carry chord anchors. Verified visually in the studio
  print view (chords sit over their syllables). Remaining 45 fallen-back
  chord lines in 25 files are OCR junk in the corpus JSON (`Bm7/Fa`,
  rootless `dim`, `B79/Dº`…) — fix in the JSON, not the emitter.

## Done — Desktop Open/Save wired to Redux (2026-06-09)

- `src/desktop/registerDesktopHandlers.js` (studio) bridges `window.desktop`:
  `file:opened` → `importFile` titled after the file name (re-opening the
  same path reloads the same file); menu Save/Save As pull the selected file
  from the store and remember the dialog-picked path as the next defaultPath.
  Registered from `app.js`; no-op in the web build. Unit-tested.
- `file:openPath` IPC (main+preload): open an explicit path with no dialog,
  converging on the same `file:opened` event — hook for CLI/"Open With" and
  for driving the app in tests. `CCS_REMOTE_DEBUG=<port>` exposes CDP in dev.
- Verified live in Electron: menu Open imports into the store; menu Save
  writes the selected file byte-identical to disk; openPath imports + dedups;
  the imported songbook renders in the print view.

## Done — PDF export tweaks (2026-06-09, studio `01a576c`)

- Export PDF captures the **print view** (bridge flips the mode and restores
  it), defaults the file name to the song title, and passes
  `preferCSSPageSize` against an `@page` rule injected by the preview, so the
  exported pages are exactly the previewed pages.
- New **Page size** print option: A4 / A4 landscape / Letter / Letter
  landscape / Boox Max 2 Pro (documentSize was already plumbed through the
  preview + measuring pipeline; surfaced it and added the missing CSS sizes).
- Verified live: A4 export = 595×842pt, Letter-landscape = 792×612pt, both
  matching the preview pagination. Next candidate: **Export Songbook** (batch
  render the corpus via `file:openPath` into one bookmarked PDF with TOC).

## Remaining
- **Corpus data cleanup**: ~45 chord lines in 25 generated files still fall
  back to lyric text because of OCR-junk chord names in the per-song JSON
  (`Bm7/Fa`, `dim`/`dim+5` without root, `B79/Dº`, `A*maj9`…). Fix the JSON.
- **Desktop follow-ups**: code signing / notarization; auto-update; optionally
  open files passed on the command line via the new `file:openPath` path.
- **Commit hygiene**: nothing pushed in any repo (chord-mark master ahead 44,
  studio master ahead 21, songsheet-parser main ahead 5 — per the user's
  workflow, they decide pushing). Untracked throwaways in chord-mark root:
  demo/validation HTML+PNG and `tests/_renderTarget.spec.js` (writes the
  chega target render into songsheet-parser; exclude via jest
  `--testPathIgnorePatterns _renderTarget`).

## Desktop app (Electron)

`packages/desktop` — an **electron-forge** wrapper (commit 1b52d81). electron-forge's
Vite plugin builds only the **main** + **preload**; the studio renderer is loaded
separately:
- **dev**: `BrowserWindow` loads `http://localhost:5173` (start the studio dev
  server separately: `yarn workspace chord-chart-studio dev`, then
  `yarn workspace chord-chart-studio-desktop dev`).
- **prod**: a custom `app://ccs` protocol serves the studio build
  (`packages/chord-chart-studio/build/`, copied via forge `extraResource`).

The studio's `vite.config.js` gates `VitePWA` off and uses a relative base when
`VITE_TARGET=electron` (no service worker on `file://`); the web build is
unchanged otherwise. Build the renderer for Electron with `bundle:electron`.
Security: contextIsolation, sandbox, no nodeIntegration, CSP, Fuses, ASAR. The
app menu wires File → Open/Save `.chordmark` (dialog + fs via preload IPC) and
**Export PDF** (`webContents.printToPDF`).

Verified headlessly: Electron loads the prod build and `printToPDF` yields a
valid ~49KB PDF. **Follow-ups**: hook the Open/Save IPC into the studio's Redux
store (the renderer side is stubbed); code signing / notarization; auto-update.
**Dev-only, uncommitted**: root `package.json` resolutions + `yarn.lock`
(contaminated by the local `portal:` fork link).

## Notes / domain facts
- In this (Brazilian/bossa) repertoire, `+` in a chord name means **major 7**
  (e.g. `A7+` = `AM7` = Amaj7), NOT augmented. chord-symbol normalizes `+` to ♯5,
  which is wrong for this corpus — worth a custom filter if name display matters.
- The throwaway proof generators (chega target render, comma-voicing demo) wrote
  HTML into `songsheet-parser/data/joao-gilberto/rendered-html/` (committed on a
  `chega-songbook-render` branch there).
