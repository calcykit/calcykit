# CalcyKit — Shared Architecture

This replaces "one giant HTML file per calculator" with a shared theme,
shared header/footer, and JSON-driven content — while keeping the site
100% static (still deploys to Vercel free tier, no server/PHP needed).

## What changed

```
assets/
  css/theme.css          ← every color, font, and component style. One file.
  js/include.js           ← injects header.html / footer.html into any page
  js/render-content.js    ← renders the content grid from a JSON file
partials/
  header.html              ← nav markup, edit once, updates every page
  footer.html               ← footer markup, edit once, updates every page
data/
  calculators/
    emi-calculator.json    ← content for one calculator (see schema below)
finance/
  emi-calculator.html      ← page shell + the unique calculator widget only
```

## How a page is built now

Every calculator page has three things, and only the third one is unique:

1. `<link rel="stylesheet" href="/assets/css/theme.css">` — no inline `<style>` block.
2. `<div data-include="/partials/header.html">` and the same for `footer.html`,
   loaded by `include.js`.
3. `<body data-accent="blue" data-calculator="emi-calculator">` — the
   `data-calculator` attribute tells `render-content.js` which JSON file
   to fetch and pour into the placeholder `<div id="content-...">` blocks.
   `data-accent` picks the category color (`blue`, `gold`, `green`, `red`,
   `rose`/`crypto`, `purple`) — this is the fix for the earlier bug where
   pages referenced color variables that were never defined. Now there is
   exactly one place (`theme.css`) where accent colors exist.

The calculator widget itself (the inputs, the JS math, the sliders) stays
hand-written per page in the `.calc-box` — that logic is genuinely unique
per calculator and isn't worth abstracting.

## The content grid (JSON schema)

Every calculator's explanatory content — About, How to Use, Formula,
Example, extra sections, FAQs, Related Calculators, Author/Last-updated —
now lives in one JSON file per calculator under `data/calculators/`.
See `emi-calculator.json` for a filled-out example. Shape:

```json
{
  "slug": "emi-calculator",
  "title": "...",
  "metaTitle": "...",
  "metaDescription": "...",
  "canonical": "https://calcykit.com/finance/emi-calculator.html",
  "tag": "FINANCE CALCULATOR",
  "breadcrumbCategory": { "label": "Finance", "href": "/#calculators" },
  "intro": "...",
  "about": "...",
  "howToUse": ["step one", "step two"],
  "formula": { "title": "...", "expression": "...", "vars": [{ "symbol": "P", "desc": "..." }] },
  "example": { "intro": "...", "highlightLabels": ["Monthly EMI"], "rows": [{ "label": "...", "value": "..." }] },
  "sections": [{ "heading": "...", "subsections": [{ "title": "...", "body": "..." }] }, { "heading": "...", "list": ["..."] }],
  "faqs": [{ "q": "...", "a": "..." }],
  "related": [{ "icon": "📈", "title": "...", "cat": "FINANCE", "href": "..." }],
  "author": { "name": "CalcyKit Team", "initials": "CK", "role": "Finance Tools" },
  "lastUpdated": "July 2026"
}
```

`render-content.js` also auto-generates the `FAQPage` and `WebApplication`
JSON-LD from this same file, so SEO structured data can never drift out of
sync with the visible FAQ content again.

## Adding a new calculator page

1. Copy `finance/emi-calculator.html` as a starting shell.
2. Replace the `.calc-box` contents and `<script>` with the new
   calculator's actual fields and math (the only hand-written part).
3. Set `data-calculator="your-slug"` and `data-accent="..."` on `<body>`.
4. Write `data/calculators/your-slug.json` with the content grid.
5. Done — no more copy-pasting nav, footer, FAQ markup, or color variables.

## Migrating the existing 22 pages

Only `emi-calculator.html` has been rebuilt so far as a proof of the
pattern. The rest of the finance/crypto calculators and blog posts still
use the old inline-style format from the previous delivery. Say the word
and I'll port the remaining pages + write their JSON content files the
same way.

## Local testing

Because `include.js` and `render-content.js` use `fetch()`, opening the
HTML file directly (`file://`) will fail — the browser blocks local
fetches. Serve the folder over HTTP to test, e.g.:

```
python3 -m http.server 8000
```

Vercel (and any real static host) serves over HTTP by default, so this
only matters for local preview.
