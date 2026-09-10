# Chinese Learning

A Mandarin practice platform for Bloomsbury, built as a Google Apps Script
web app. A collapsible left sidebar switches between topics:

- **Animals** — a short tutorial topic (9 words).
- **Unit 1: School & Education** — Year 11 Term 1A, Cambridge IGCSE 0547 (40 words + sentence patterns).
- **Unit 2: Future Plans & Careers** — Year 11 Term 1A, Cambridge IGCSE 0547 (41 words + sentence patterns).

Each topic runs the same six practice modes. The web app is **domain
restricted** to `@bloomsbury.ac.th`; it executes as the deploying account
so every request can reach the one shared data spreadsheet.

## Layout

| File | Role |
| --- | --- |
| `Code.gs` | Web app entry (`doGet`), identity, seed-teacher list, and the callable endpoints (`getPageData`, `getBootstrapData`, `getMyChineseProgress`, `syncChineseProgress`, `getChineseAdminData`). |
| `Curriculum.gs` | Server-side topic and word data. Source of truth for answer validation. Keep each `CL_TOPICS[topic].words` in step with the matching entry in `CURRICULUM` in `Index.html`. |
| `Storage.gs` | Auto-provisioned data spreadsheet, teacher list, and read/write helpers for the `Attempts` and `Mastery` sheets. |
| `Analytics.gs` | `buildAdminBreakdown_` — the detailed per-student breakdown behind the Teacher view. |
| `Index.html` | The whole client: app shell, sidebar, and the Animals lesson (six practice modes ported from the standalone prototype) plus the sync layer. |
| `appsscript.json` | Manifest. Web app runs **as the deploying user**, open to **anyone** so students without a Google session can still practise. |

## Data model

One Google Sheet, created automatically on first use; its ID is stored in
Script Properties (`CL_DATA_SPREADSHEET_ID`). Sheets:

- **Attempts** one row per graded question attempt (the raw activity log).
- **Mastery** one row per `(student, topic)`: the client's progress
  aggregate stored as JSON, used to restore progress on any device.
- **Teachers** one email per row. These accounts see the **Teacher view**.
  The deploying account and everything in `CL_SEED_TEACHERS` (`Code.gs`)
  are seeded automatically so admin is never locked out.

The **Teacher view** gives a per-student breakdown: accuracy, words
mastered, average attempts needed to master each character, per-character
and per-direction difficulty, strengths and weaknesses, falling-game and
stroke-practice stats, and time studied.

## Validation

The client grades locally for instant feedback, but `syncChineseProgress`
re-checks every quiz and falling-character attempt against `Curriculum.gs`
before writing it to `Attempts`. Stroke-order completion is judged by the
HanziWriter quiz on the client and stored as reported.

## Deploy

```
clasp push
clasp deploy
```

The prototype the Animals lesson is based on lives at
`chinese_animals_complete_game.html` in the original download; it is not
part of this repo.
