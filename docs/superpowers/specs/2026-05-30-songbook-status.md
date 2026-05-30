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

### chord-chart-studio (commits 1eb377b, e23e576, on master, UNPUSHED)
- Songbook design spec + this status doc (`docs/superpowers/specs/`).
- **Print preview songbook**: serif title + composer header (`PageHeader`),
  chord dictionary block on page 1 (the `<p>`-line extraction dropped it before),
  serif/diagram CSS. Built on top of the existing `| C  Am |` chord-line layout.
- **Uncommitted**: `src/db/options/editorModeOptions.js` (surfaces the
  `showChordDiagrams`/`diagramPosition`/`diagramSize` options that the WIP defined
  but never listed for any mode); plus the dev-only `portal:`/`dompurify` resolution.

## Verified
A full inline-voiced samba renders in the studio print view as: dictionary of
~50 diagrams on top + clean chord-over-lyric body + title/composer header.

## Remaining

- **Phase 2 — diagram fidelity**: Roman-numeral fret positions + barre lines in
  chord-mark `renderChordDiagram` (currently Arabic positions, dot-based) to match
  the reference lead sheet. A proof renderer with Roman/barres exists in the
  throwaway generator and in `songsheet-parser` render output.
- **Phase 3 — alignment for unmarked sources**: the `joao-gilberto` `.chordmark`
  files have no `_` markers, so chords don't sit over the right syllables in the
  studio. Fix upstream in songsheet-parser (emit `_`).
- **Bars per line**: not a render option — it follows the source (one chord line =
  one output line, with however many bars). Control it in songsheet-parser output
  (group N bars per chord line). A renderer reflow option is feasible only for
  chord-only charts (lyrics bind to chord lines).
- **Commit hygiene**: studio `editorModeOptions` change to commit; nothing pushed
  in any repo (per the user's workflow — they decide pushing).

## Notes / domain facts
- In this (Brazilian/bossa) repertoire, `+` in a chord name means **major 7**
  (e.g. `A7+` = `AM7` = Amaj7), NOT augmented. chord-symbol normalizes `+` to ♯5,
  which is wrong for this corpus — worth a custom filter if name display matters.
- The throwaway proof generators (chega target render, comma-voicing demo) wrote
  HTML into `songsheet-parser/data/joao-gilberto/rendered-html/` (committed on a
  `chega-songbook-render` branch there).
