# Design direction — v2 (reference: variant.com)

**Taken from variant.com:** near-black canvas, a fixed left column that holds the pitch and controls while content scrolls on the right; a neo-grotesk headline at a modest size (32px, not a giant hero) with one *italic grey* phrase for voice; small 13px body copy in two greys (white for emphasis, grey for the rest); hairline **dashed** dividers on the content grid; tiny rectangular bordered buttons with a glyph (`→|`, `✳`); instrument-panel detail (mono numerals, small-caps labels like "CHANNEL"); one warm accent (amber) used sparingly.

**Fonts** (next/font, free): Inter Tight (UI + headlines, 400/500), Instrument Serif italic (the one voice phrase per page), JetBrains Mono (counts, dates, tags, labels — uppercase 10.5px, tracked).

**Palette:** bg `#0b0b0b`, raised `#121212`, line `#242424` (dashed for grid, solid for inputs), text `#ececec`, muted `#8b8b8b`, faint `#5a5a5a`, accent amber `#f2a516` (entry-level marker, focus, apply CTA hover). No gradients, no shadows, no emoji, radius 2–4px max.

**Grid:** desktop = 320px sticky sidebar + fluid content, max 1360px, 24px gutters. Mobile = single column, sidebar collapses to the top.

**Components**
- Job row: table-like 4-col grid — mono index · title/company · location · level/stack · age. Dashed bottom rule, hover = text brightens + `→` appears. No logo blobs.
- Filters: label in mono caps above a bare select/input with 1px border; level as a link list with counts (like a spec sheet).
- Buttons: 28px tall, 1px border, glyph prefix. Primary = white fill / black text.
- Detail page: two columns — long-form body (65ch, 15px/1.7) and a sticky spec sheet (key/value rows in mono) with the Apply button.
- Newsletter: one-line input + button in the sidebar, mono status line.
