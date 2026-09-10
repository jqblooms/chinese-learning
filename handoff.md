# Chinese Learning — handoff

Living project doc. Update after every session's changes.

## 2026-09-10 — project created

New standalone project. Does **not** share code, a repo, or an Apps Script
project with `bloomsbury-computing-main` or `behaviour-management-system`;
it was only modelled on how those wire a client to Apps Script.

### What was built

- **App shell** (`Index.html`): a collapsible left sidebar (icon toggle on
  desktop, slide-over on mobile) listing the course lessons. Lesson 1
  (Animals) is `status: 'available'`; Numbers, Colours, Family, Food and
  Classroom are placeholders rendered locked with a "Coming soon" panel.
- **Animals lesson**: ported wholesale from the standalone prototype
  (`chinese_animals_complete_game.html`). Six modes kept intact — Mixed
  mastery, 汉字↔Pinyin, 汉字↔Meaning, Pinyin↔Meaning, Falling characters,
  Stroke order (HanziWriter from jsDelivr).
- **Backend** (`Code.gs`, `Curriculum.gs`, `Storage.gs`):
  - `doGet` serves `Index`. Web app executes as deployer, access ANYONE so
    signed-out students can still practise (no save).
  - `getBootstrapData()` returns identity + `isTeacher` + the ordered
    topic summary + the signed-in student's saved mastery.
  - `syncChineseProgress({topic, attempts[], mastery})` re-validates every
    quiz/falling attempt against `Curriculum.gs`, appends graded rows to
    the `Attempts` sheet, and upserts the `Mastery` snapshot.
  - `getChineseAdminData()` — teacher-only; feeds the in-app Teacher view
    (words mastered, quiz correct/attempts, falling matches, stroke chars
    per student).
  - Data lives in one auto-created Google Sheet; its ID is kept in Script
    Property `CL_DATA_SPREADSHEET_ID`. Deploying account seeded as the
    first teacher.

### Sync design (client)

- `SYNC` module in `Index.html`. Attempts are queued and debounced
  (~600 ms after an answer, ~1.2 s after a mastery change), flushed in
  batches of 80 via `google.script.run.syncChineseProgress`. On failure
  the batch is prepended back to the queue and retried after 4 s; a
  `beforeunload` flush is attempted. Save-status chip in the header shows
  saving / saved / will-retry, or "this device only" when signed out.
- Offline / opened as a plain file: `HAS_BACKEND` is false, every server
  call is skipped, the game runs fully on `localStorage`
  (`chineseLearning:v1:animals`).

### Merge rule (known limitation, acceptable for v1)

On load, `adoptServerMastery` replaces local state with the server
snapshot when local has zero attempts **or** the server `updatedAt` is
newer. It does not field-merge two diverged snapshots — last writer wins
per topic. Fine for one student on one device at a time; revisit if
students routinely practise on two devices in parallel.

### Keep in sync by hand

`WORDS` in `Index.html` and `CL_TOPICS.animals.words` in `Curriculum.gs`
are duplicated on purpose (client needs pinyin/sound-guide fields the
validator does not). Any edit to the animal list must touch both.

### Deploy state (2026-09-10)

- Apps Script project created via `clasp create-script --type standalone`.
  `scriptId` `1vXL3YOrATx9kEJuUPpN9fZKymPxE0SwhzTqH_sze-6ypa-3D-ngiPcHa`
  (also in `.clasp.json`). Editor:
  `https://script.google.com/d/1vXL3YOrATx9kEJuUPpN9fZKymPxE0SwhzTqH_sze-6ypa-3D-ngiPcHa/edit`
- `clasp push` + `clasp create-deployment` run this session. Deployment
  `AKfycbyYDPe1hehMHxain7Pt8J3q58GrTEhsLkzMa2F2Qddn4BlV3sC42__N-eVKKHyyRRVy` @1.
  Web app: `https://script.google.com/macros/s/AKfycbyYDPe1hehMHxain7Pt8J3q58GrTEhsLkzMa2F2Qddn4BlV3sC42__N-eVKKHyyRRVy/exec`
- **First run still needs James**: open the web app URL once while signed
  in as jamesquinney@bloomsbury.ac.th and accept the OAuth consent
  (userinfo.email + spreadsheets). That first authenticated call creates
  the `Chinese Learning Data` spreadsheet and seeds him as teacher.
- `clasp create-script` overwrites `appsscript.json` with a bare default;
  the real manifest (Asia/Bangkok, scopes, webapp block) was rewritten
  after create and before push. Watch for this on any future re-create.
- GitHub: `https://github.com/jqblooms/chinese-learning` (public), `main`.

### Next

- Build Lesson 2 (Numbers 1-10): add words to `CL_TOPICS.numbers`, flip
  its status to `available`, and either generalise the lesson UI in
  `Index.html` to read the active topic's word list or add a second
  lesson module.
- Consider a real teacher allowlist UI instead of editing the `Teachers`
  sheet by hand.
