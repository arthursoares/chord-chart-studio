# Songbook print theme for Chord Chart Studio

**Date:** 2026-05-30
**Status:** Draft (awaiting review)
**Goal:** Let Chord Chart Studio render a ChordMark song as a print-style
"songbook" page — centered title + composer, a chord-diagram dictionary,
two-column body with chords positioned over the lyrics — matching the
reference lead-sheet look (e.g. the "Chega de Saudade" target).

## Background & key decisions

A standalone proof produced the target look but was throwaway: it read the
(soon-retired) JSON, was hardcoded to one song, and rendered the body with a
**bespoke** layout that *faked* chord-over-lyric alignment by distributing
syllables across beats.

The decision is to build this **into Chord Chart Studio** instead, reusing the
app's existing rendering. Two decisions taken during brainstorming:

1. **Alignment via `_` markers (accepted).** The studio aligns chords over
   lyrics with ChordMark's `_` position markers (through `wrapChordLyricLines`).
   We adopt that — we do **not** port the proof's beat-distribution faking. The
   template will look correct for well-authored ChordMark. Existing
   `joao-gilberto` exports have no `_` and will not align until they carry it
   (see Phase 3, out of scope here).
2. **Composer added to ChordMark.** Title already exists in the studio's song
   model; composer does not exist anywhere. Add an optional `composer `
   directive to ChordMark (mirroring the existing `key ` directive).

## What already exists (do not rebuild)

The studio has a Print mode at `src/songRenderers/printPreview/` that already
provides: A4 pages, multi-column layout, page breaks, document margins, and a
`PageHeader` rendering the song title. It renders chord-over-lyric via the
default chordmark path with `wrapChordLyricLines: true`. "Songbook" is a
**theme + small enhancements on this print mode**, not a new renderer.

The chord-diagram feature (dictionary/inline) is already wired into the
studio's rendering options (`showChordDiagrams`, `diagramPosition`,
`diagramSize` in `src/optionsPanels/rendering/allWidgets.js`).

## Scope

### In scope (this spec)

- **Phase 0 — plumbing prerequisite.** Refresh the studio's bundled
  `chord-mark` so it includes the diagram feature **and** the recent fork fixes
  (comma voicings, diagram size/label-band, two-digit fret clip). Confirm
  `yarn dev` runs and the current print mode renders.
- **Phase 1 — songbook theme.**
  - A `cmTheme-songbook` (serif typography, bold chords, centered title +
    composer subtitle), selectable in the print preview.
  - `composer ` directive in ChordMark (fork): parsed, exposed on the song
    model, shown in the songbook `PageHeader`. Backward compatible.
  - Ensure the two-column body + the chord-diagram **dictionary** read well
    under the songbook theme.

### Out of scope (follow-on, separate specs)

- **Phase 2 — diagram fidelity:** Roman-numeral fret positions + barre lines in
  chord-mark's `renderChordDiagram` (fork change; the studio inherits it).
- **Phase 3 — unmarked sources:** add `_` markers to the `joao-gilberto`
  exports in the songsheet-parser conversion so their chords align.

## Architecture

### Composer directive (chord-mark fork)

Mirror the `key ` directive:

- `src/parser/syntax.js`: add `composerDeclarationPrefix: 'composer '`.
- New line type `COMPOSER` in `src/parser/lineTypes.js`, with a matcher
  (`isComposerDeclaration`) and a parser (`parseComposerDeclaration`).
- Integrate into `parseSong` so the result carries `composer` (a string;
  `undefined` if absent). The composer line is **metadata** — it is not emitted
  into the rendered chart body (so it never appears inline).
- Backward compatible: no `composer` line ⇒ `composer` is `undefined`; existing
  songs and the 100%-coverage gate are unaffected (new code fully tested).

### Studio integration

- The songbook view needs the composer string. Since `PrintPreview` already
  calls `renderAsHtml(content, ...)`, add a small path to also obtain
  `parseSong(content).composer` (e.g. a `getSongMeta(content)` helper in
  `src/core/`) and pass it to `PageHeader` alongside the title.
- `PageHeader` renders the composer subtitle when present (centered, small-caps
  serif), title always.
- Add `cmTheme-songbook` as a theme option for print/songbook and a
  `Songbook.scss` (or extend the print SCSS) for serif type, two-column tuning,
  and dictionary styling. Apply the theme class in the print preview wrapper.

### Theme vs. new mode

Songbook is a **theme applied within the existing Print mode**, not a new
editor mode — it reuses pagination, columns, margins, and export-to-PDF (browser
print) for free. (If a dedicated nav entry is later wanted, it can wrap the same
preview; not required now.)

## Files to touch (Phase 1)

**chord-mark (fork):**
- `src/parser/syntax.js` — `composerDeclarationPrefix`
- `src/parser/lineTypes.js` — `COMPOSER`
- `src/parser/matchers/isComposerDeclaration.js` — new matcher (+ test)
- `src/parser/parseComposerDeclaration.js` — new parser (+ test)
- `src/parser/parseSong.js` — surface `composer` on the result (+ test)
- docs note for the new directive

**chord-chart-studio:**
- `src/core/` — `getSongMeta` helper (parse → composer)
- `src/songRenderers/printPreview/_components/PageHeader.jsx` — render composer
- print theme wiring + `cmTheme-songbook` SCSS (serif, two-column, dictionary)
- options: surface the songbook theme choice (and confirm diagram options are
  available in this view)

## Testing

- **chord-mark:** unit tests for the composer matcher/parser; a `parseSong`
  test asserting `composer` is populated and that a composer line is not
  rendered into the body; legacy songs unaffected. Maintain the 100% coverage
  gate.
- **chord-chart-studio:** component test that `PageHeader` shows the composer
  when present and omits it otherwise; a render smoke test for the songbook
  theme.
- **Visual:** run `yarn dev`, render a well-authored ChordMark song (with `_`
  and a `composer` line) in songbook print preview, screenshot, compare to the
  reference.

## Risks / open questions

- **Fork relink mechanism (Phase 0):** the studio's `node_modules/chord-mark`
  is a built copy (lib only), not a symlink; the exact refresh mechanism
  (rebuild + copy, yarn `portal:`/`link:`, or local version bump) must be
  settled first — it gates everything.
- **Composer render location:** chosen to live in the studio `PageHeader` (not
  inline via chord-mark) so it sits in the page header like the reference. If we
  later want composer in non-print renders too, chord-mark could optionally
  render it — deferred.
- **Diagram look:** Phase 1 uses chord-mark's current diagram style (Arabic
  positions, no barres); Roman/barres are Phase 2.
