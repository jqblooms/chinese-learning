# Chinese Learning

A Mandarin practice platform for Bloomsbury, built as a Google Apps Script
web app. A collapsible left sidebar lists the course lessons; **Lesson 1,
Animals**, is the first one built.

## Layout

| File | Role |
| --- | --- |
| `Code.gs` | Web app entry (`doGet`), identity, and the callable endpoints (`getPageData`, `getBootstrapData`, `getMyChineseProgress`, `syncChineseProgress`, `getChineseAdminData`). |
| `Curriculum.gs` | Server-side topic and word data. Source of truth for answer validation. Keep `CL_TOPICS.animals.words` in step with the `WORDS` array in `Index.html`. |
| `Storage.gs` | Auto-provisioned data spreadsheet, teacher list, and read/write helpers for the `Attempts` and `Mastery` sheets. |
| `Index.html` | The whole client: app shell, sidebar, and the Animals lesson (six practice modes ported from the standalone prototype) plus the sync layer. |
| `appsscript.json` | Manifest. Web app runs **as the deploying user**, open to **anyone** so students without a Google session can still practise. |

## Data model

One Google Sheet, created automatically on first use; its ID is stored in
Script Properties (`CL_DATA_SPREADSHEET_ID`). Sheets:

- **Attempts** one row per graded question attempt (the raw activity log).
- **Mastery** one row per `(student, topic)`: the client's progress
  aggregate stored as JSON, used to restore progress on any device.
- **Teachers** one email per row. These accounts see the **Teacher view**.
  The deploying account is seeded automatically so admin is never locked out.

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
