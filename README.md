# Partnering on People Ops and Systems

A single-page, hash-routed site that shows how Cat Nolasco would partner with Eric Williams (IT) and Angela Fairfax (People Partnership) at Panorama Education. It is a follow-up to the Director of People Operations and Systems interview.

## What is in it

- Home, The big picture, and one page each for Eric and Angela, with workflow boards
- Where we overlap (a Venn), Who owns what, Payroll governance, and a working sample Employee Action Form
- Where Claude fits, Rippling Workflow Studio (90 ready-made workflows), and the Rippling timeline to the January 1 go-live

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole site: styles, routes and page code |
| `wf.js` | Workflow board data for the Eric and Angela pages |
| `auto.js` | Payroll approval recipe and automation notes |
| `eaf.js` | Sample Employee Action Form and approval rules |
| `ripwf.js` | Rippling Workflow Studio workflows, from the Rippling Automation Repository 2026 |
| `photos.js` | Embedded photos used on the site |

## Run it locally

No build step. From this folder:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Notes

- Content is a proposal, written to be adjusted together with Eric and Angela.
- Dates marked as stated come from Panorama: shadow payrolls on Nov 15, Nov 30 and Dec 15, and go-live on Jan 1. Everything else is proposed.
- `photos.js` contains photos of real people and the site names real colleagues, so keep this repository private.
