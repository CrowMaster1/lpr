# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static HTML/CSS/JS website — **DCCG's LPR Projekt** — a Danish medical coding tool for the Danish Colorectal Cancer Group (DCCG). It helps clinicians look up and record SKS (Sundhedsvæsenets Klassifikations System) codes for the National Patient Registry (LPR). Version ~0.991.

There is no build system, no package manager, and no test suite. Development is done by editing files directly and serving them over a local HTTP server (required because pages use `fetch()` for JSON and navigation).

## Running Locally

The site must be served over HTTP — opening HTML files directly as `file://` will fail due to CORS on `fetch()` calls. Use any static server, e.g.:

```bash
python -m http.server 8000
# or
npx serve .
```

## Architecture

### Page Structure

Each data-entry page (page1–page8) is a nearly identical HTML file. The active page is identified by `data-page-id` on `<body>` (e.g. `<body data-page-id="page3">`). This ID drives:
- Which JSON file is loaded: `data/{pageId}_data.json`
- Which secondary JSON is used for the "Tilføj Ekstra Valg" modal: `data/{pageId}_data_secondary.json`
- Which vejledning (instructions) page is shown: `vejledninger/{pageId}_vejledning.html`
- Which `localStorage` key namespace is used for saved data

The eight pages and their subjects:

| Page | Subject |
|---|---|
| page1 | Basis Informationer |
| page2 | Operationer |
| page3 | Komplikationer |
| page4 | Endoskopiske indgreb |
| page5 | Onkologi Kemoterapi |
| page6 | Onkologi Stråleterapi |
| page7 | Operationer Metastasekirurgi |
| page8 | Kontrol & Recidiv |

Navigation is loaded dynamically into every page via `fetch('navigation.html')`. The `datacontrol.html` link in `navigation.html` is hidden (`hidden` attribute) and intended for developers only.

### External Dependencies (CDN)

All pages load these from CDN — there are no local copies:
- Bootstrap 4.3.1 (CSS + JS)
- jQuery 3.5.1
- Popper.js 1.14.7
- Font Awesome 5.15.4

### JavaScript Modules (all loaded via `<script defer>`)

| File | Responsibility |
|---|---|
| `js/pages_script.js` | Core: fetches JSON, renders groups/items, conditional visibility (`showIf`), "Mere/Mindre" toggle for `udvidet` items |
| `js/saveload_script.js` | Save/load selections to/from `localStorage` under key `savedSelections`, marks nav icons for pages with saved data |
| `js/summarymodal.js` | "Vis SKS navn og kode" — renders a table of selected SKS codes + VPH codes |
| `js/cprmodal.js` | CPR modal — adds CPR number before triggering browser print |
| `js/vphmodal.js` | VPH modal — captures a 4-digit VPH code and associates it with a selected item |
| `js/vejledningmodal.js` | Loads and shows the page-specific vejledning HTML in a modal; falls back to `vejledninger/default_vejledning.html` |
| `js/addextramodal.js` | "Tilføj Ekstra Valg" — loads secondary JSON and lets users add extra items to the current page |
| `js/datacontrol.js` | Dev-only audit tool: compares SKS codes in a page's JSON against `dumpfiles/sks_processed.json` using Levenshtein similarity |

### JSON Data Format

Each `data/pageX_data.json` follows this schema:

```json
{
  "Groups": [
    {
      "GroupHeading": "string",
      "Description": "string",
      "AllowsMultipleSelections": false,
      "SeeAlso": { "URL": "...", "LinkText": "..." },
      "showIf": { "Condition": "SKScode", "Value": true },
      "Items": [
        {
          "LabelText": "string",
          "SKSnavn": "string",
          "SKScode": "string",
          "Vejledning": "string",
          "DisplayType": "simple | udvidet",
          "Show": true
        }
      ]
    }
  ]
}
```

- `AllowsMultipleSelections: true` → renders checkboxes; `false` → radio buttons
- `DisplayType: "udvidet"` → item is hidden until user clicks "Mere" button on that group
- `showIf` → the group is only visible when the referenced `SKScode` is selected on the page
- Items with `Show: false` are excluded from the datacontrol audit
- `data/pageX_data_secondary.json` has the same schema; it populates the "Tilføj Ekstra Valg" modal

### CSS Files

- `css/styles.css` — global base styles
- `css/navigation_bar.css` — top nav bar
- `css/pages_styles.css` — group boxes, items, layout for data-entry pages
- `css/modals.css` — all modal dialogs
- `css/tooltips.css` — SKS code tooltip on hover
- `css/pagebuttonstyle.css` — bottom button row
- `css/questionmark.css` — info (?) button on group headings
- `css/hamster.css` / `css/indexstyle.css` — index page only

### Utility Scripts

| Script | Purpose |
|---|---|
| `update_data.py` | Fetches raw SKS data as CSV from medinfo.dk API (POST to `dump.php`), parses it, and saves to a `data/pageX_data.json`. Response encoding is ISO-8859-1. Requires `pip install requests`. |
| `dumpfiles/process_dump.py` | Parses a large `dumpfiles/SKS_klassifikation.xml` file (not committed) into `dumpfiles/sks_processed.json` — the reference dataset used by `datacontrol.html` for auditing. Uses streaming `iterparse` for memory efficiency; only keeps codes with `sks_datoTil == '25000101'` (active). |
| `data/json_to_excel.py` | Converts between `data/pageX_data.json` and Excel. Uses pandas + tkinter. |
| `data/json_to_excel_or_rev.py` | Bidirectional JSON ↔ Excel conversion. Uses pandas + tkinter. |

## Key Patterns

- **Adding a new page**: create `pageN.html` (copy an existing one, update `data-page-id` on `<body>` — marked with `<!-- ÆNDRE HER -->` comment — and update the `<h1>` heading), add `data/pageN_data.json`, `data/pageN_data_secondary.json`, `vejledninger/pageN_vejledning.html`, and add a nav link in `navigation.html`.
- **Conditional group visibility**: add a `showIf: { "Condition": "<SKScode>", "Value": true }` field to the group in JSON. The group will only appear when that SKScode is selected.
- **Cache busting**: JS files use `?v=1.0` query strings on `<script src>` tags — increment version when deploying JS changes.
- **SKS code audit**: navigate to `datacontrol.html` in a running local server to compare any page's SKS names against the reference dataset.
