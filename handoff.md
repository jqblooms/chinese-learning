# Chinese Learning — handoff

Living project doc. Update after every session's changes.

## 2026-09-10 — Year 11 units + multi-topic engine + web-app access fix

### Web-app access — "not accessible" fix

The old deployment
`AKfycbyYDPe1hehMHxain7Pt8J3q58GrTEhsLkzMa2F2Qddn4BlV3sC42__N-eVKKHyyRRVy`
is **dead**: its web-app access setting got stuck requiring sign-in, and
`clasp update-deployment` cannot change an existing deployment's
access/executeAs. Redeploying to it does nothing.

**New live deployment:**
`AKfycbxM5ZmyrpPP_PikikX9_yPdDPpFn0Glbt0ki8Ap04MTa-EhWVBeB488KITuDFMlubTw`
Web app:
`https://script.google.com/macros/s/AKfycbxM5ZmyrpPP_PikikX9_yPdDPpFn0Glbt0ki8Ap04MTa-EhWVBeB488KITuDFMlubTw/exec`
Created fresh with `clasp create-deployment` while the manifest had
`access: "ANYONE_ANONYMOUS"` + `executeAs: "USER_DEPLOYING"`, so it serves
anonymously (verified: HTTP 200, no login redirect, app renders). Because
`update-deployment` keeps the original access setting, redeploying code to
THIS id is safe from now on — do not `create-deployment` again unless you
deliberately want a new URL.

`appsscript.json` is back to `ANYONE_ANONYMOUS` / `USER_DEPLOYING` (the
`DOMAIN` experiment made it worse — James's default browser account is
personal and the switcher wasn't obvious). Identity model: with
`ANYONE_ANONYMOUS` + `USER_DEPLOYING`, `Session.getActiveUser().getEmail()`
returns the visitor's address only when they are a same-domain
(`@bloomsbury.ac.th`) user; everyone else is anonymous. That is the split
we want.

**Sign-in nudge:** when `getBootstrapData` returns no `currentUser`, the
client shows a small centred modal ("Sign in to save your progress", a
"Sign in with Google" button opening accounts.google.com, and a tiny x).
Dismissal is remembered for the browser session (`sessionStorage`
`chineseLearning:v1:signinDismissed`). Gated on `HAS_BACKEND` so it never
shows in local preview.

**Still required from James:** open the new web-app URL once signed in as
jamesquinney@bloomsbury.ac.th and accept the OAuth consent
(userinfo.email + spreadsheets). Anonymous browsing already works; that
first authorised call is what creates the data spreadsheet and enables
saving.

### Multi-topic engine

`Index.html` no longer hard-codes the animals list. `CURRICULUM` holds all
topics; `loadTopic(id)` swaps `WORDS` / `STORE_KEY` / `ALL_STROKE_CHARS`;
`switchTopic(id)` (from the sidebar) flushes the current topic's sync,
reloads per-topic `localStorage`, pulls that topic's server mastery and
re-renders. Last topic is remembered in `localStorage`
(`chineseLearning:v1:lastTopic`). Per-topic progress keys were already
namespaced, so nothing collides.

- Quiz **choices are capped at 6** (correct + 5 random distractors,
  `pickChoiceWords`) — a 40-word grid of options was unusable.
- Falling has a **fixed working pool** of 8 words per run (`fall.pool`,
  `pickFallingPool`), re-picked on level-up. The meanings bank shows only
  those 8, so large units don't blow out the panel.
- Each topic can carry a `grammar` array; when present a "Sentence
  patterns for this unit" `<details>` panel renders it (reference only,
  not yet interactive).

### Year 11 Term 1A content (Cambridge IGCSE Mandarin 0547)

From `Year 11 Term1A - Unit 1/2 …docx`. Both added as available topics in
`CURRICULUM` (Index.html) and `CL_TOPICS` (Curriculum.gs) — the two copies
must stay in step.

- **y11_school — Unit 1: School & Education** (40 words): subjects,
  school environment, evaluation adjectives + 9 sentence patterns
  (比/更, 应该/必须, 虽然…但是…, 以前…现在…, 如果…就…, …).
- **y11_careers — Unit 2: Future Plans & Careers** (41 words): future
  study, jobs, skills/qualities, evaluation + 10 sentence patterns
  (打算/希望, 为了…, 优点/缺点是…, 如果…就…, multiple time frames).
- The invented placeholder topics (Numbers, Colours, …) were removed;
  only real content is listed now.

Word lists use only `id/zh/en/py`; `sound`/`note` (the UK pronunciation
guide) are optional and fall back to tone-stripped pinyin
(`stripTones`, `wordSoundText`).

### Not done yet (next)

- Interactive practice for the grammar / sentence patterns (gap-fill,
  sentence building, translation) — currently reference-only.
- Teacher view still reports on `animals` only; add a topic selector and
  pass it to `getChineseAdminData` / `buildAdminBreakdown_`.
- HanziWriter has no stroke data for a few of the rarer unit characters;
  those show a "could not load" status in Stroke mode (non-blocking).
- Falling game-over on a missed character is implemented but was only
  reviewed statically (the preview pane can't run requestAnimationFrame
  while hidden) — worth a real device check.

## 2026-09-10 — teacher view, seed teachers, falling full-screen

- **Teacher view rebuilt.** `getChineseAdminData` now returns a detailed
  per-student breakdown from `buildAdminBreakdown_` in `Analytics.gs`
  (reads the raw Attempts log + each Mastery snapshot):
  - overall + quiz accuracy, words mastered, sessions, first/last active
  - per character: attempts, wrong, accuracy, avg answer time, **avg
    attempts to master** (quiz answers until `CL_TARGET` correct in a
    direction), directions mastered
  - per direction: attempts, wrong, accuracy
  - **strengths / needs-work** chips (characters ranked by accuracy, min
    3 attempts)
  - falling matches/errors per character + high score / best level
  - stroke reps + mistakes per character
  - **time studied** (see below)
  The UI is now an accordion of expandable student cards, not one flat
  table; the modal is a fixed-height flex panel that scrolls internally.
- **Seed teachers.** `CL_SEED_TEACHERS` in `Code.gs` (currently
  `sisiwu@bloomsbury.ac.th`). `isTeacherEmail_` treats these as teachers
  without needing a sheet row; they are written into the Teachers sheet on
  creation and `syncSeedTeachers_()` back-fills them on every admin load,
  so this works on the already-created workbook too.
- **Study-time tracking.** Client adds 5 s per tick to
  `state.timeStudiedMs` while the lesson is visible, focused, and had
  interaction within 90 s; flushed with the mastery snapshot.
  `state.sessionCount` increments once per signed-in page load. Both ride
  the existing mastery sync (no new endpoint) and are surfaced in the
  teacher view.
- **Falling characters is now a full-screen panel.** Entering the mode
  adds `.falling-fullscreen` to `#fallingArea` (`position:fixed; inset:0`,
  flex column) and `body.falling-lock`; the field is `flex:1; min-height:0`
  so it sizes to whatever space is left after the compact HUD/controls and
  the meanings row. An **Exit** button returns to the previous non-special
  mode (`previousMode`, default `mixed`). Verified fits with no scroll at
  1300×860 and 375×812.

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
