/**
 * Chinese Learning — web app entry point and identity.
 *
 * Deployment model:
 *   - Execute as: User deploying the web app
 *   - Who has access: Anyone (so students without a Google session can still
 *     open and practise; saving is disabled until a real school account is seen)
 *
 * The active visitor is verified on every callable endpoint using
 * Session.getActiveUser(). A client-supplied email is never trusted.
 */

var CL_ALLOWED_DOMAIN = 'bloomsbury.ac.th';
var CL_DATA_PROP_KEY = 'CL_DATA_SPREADSHEET_ID';
var CL_DATA_SPREADSHEET_NAME = 'Chinese Learning Data';

var CL_SHEETS = Object.freeze({
  ATTEMPTS: 'Attempts',
  MASTERY: 'Mastery',
  TEACHERS: 'Teachers'
});

// Accounts that can always open the Teacher view, in addition to whatever
// is in the Teachers sheet. Seeded into the sheet when it is first created
// and re-checked on every admin load, so adding an email here still takes
// effect on an existing workbook.
var CL_SEED_TEACHERS = Object.freeze(['sisiwu@bloomsbury.ac.th']);

var CL_ATTEMPT_HEADERS = Object.freeze([
  'Timestamp', 'Email', 'Topic', 'Mode', 'Direction',
  'WordId', 'Prompt', 'Answer', 'Expected', 'Correct', 'Source', 'ElapsedMs'
]);
var CL_MASTERY_HEADERS = Object.freeze(['Email', 'Topic', 'DataJson', 'UpdatedAt']);
var CL_TEACHER_HEADERS = Object.freeze(['Email']);

var CL_MAX_ATTEMPTS_PER_SYNC = 80;
var CL_MAX_ATTEMPT_ROWS = 20000;
var CL_LOCK_TIMEOUT_MS = 25000;

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Chinese Learning')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

/** Small identity payload used by the client to enable or disable saving. */
function getPageData() {
  var email = getActiveSchoolEmail_();
  return {
    currentUser: email,
    isTeacher: email ? isTeacherEmail_(email) : false,
    topics: CL_TOPIC_SUMMARY_()
  };
}

/**
 * Everything the client needs on load: identity plus, for a signed-in
 * student, their saved per-topic mastery so progress restores on any device.
 */
function getBootstrapData() {
  var email = getActiveSchoolEmail_();
  var payload = {
    currentUser: email,
    isTeacher: email ? isTeacherEmail_(email) : false,
    topics: CL_TOPIC_SUMMARY_(),
    mastery: {}
  };
  if (email) {
    payload.mastery = readMasteryForEmail_(email);
  }
  return payload;
}

/** Returns the signed-in student's saved mastery, keyed by topic id. */
function getMyChineseProgress() {
  var email = requireSchoolEmail_();
  return { mastery: readMasteryForEmail_(email) };
}

/**
 * Client sync endpoint. Accepts a batch of raw attempts and the current
 * per-topic mastery snapshot for ONE topic, re-validates every gradable
 * attempt server-side, appends them to the Attempts log, and stores the
 * mastery snapshot. Authorises against the verified active user.
 *
 * payload = {
 *   topic: 'animals',
 *   attempts: [{ mode, direction, wordId, answer, chosenId, elapsedMs, clientCorrect }],
 *   mastery: { ...opaque client aggregate... }
 * }
 */
function syncChineseProgress(payload) {
  var email = requireSchoolEmail_();
  payload = (payload && typeof payload === 'object') ? payload : {};

  var topic = cleanToken_(payload.topic, 60);
  if (!topic || !CL_TOPICS[topic]) throw new Error('Unknown topic.');

  var attempts = Array.isArray(payload.attempts) ? payload.attempts.slice(0, CL_MAX_ATTEMPTS_PER_SYNC) : [];
  var mastery = (payload.mastery && typeof payload.mastery === 'object') ? payload.mastery : null;

  var lock = LockService.getScriptLock();
  lock.waitLock(CL_LOCK_TIMEOUT_MS);
  try {
    var graded = [];
    var now = new Date();
    for (var i = 0; i < attempts.length; i++) {
      var row = gradeAttempt_(email, topic, now, attempts[i]);
      if (row) graded.push(row);
    }
    if (graded.length) appendAttemptRows_(graded);

    if (mastery) writeMasteryForEmail_(email, topic, mastery);

    SpreadsheetApp.flush();
    return {
      ok: true,
      graded: graded.length,
      serverCorrect: graded.filter(function (r) { return r[9] === true; }).length
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Teacher-only. Returns a detailed per-student breakdown for the Teacher
 * view: mastery, attempts needed, per-character difficulty, direction
 * strengths and weaknesses, falling and stroke stats, and time studied.
 */
function getChineseAdminData() {
  var email = requireSchoolEmail_();
  if (!isTeacherEmail_(email)) {
    throw new Error('This account is not on the Chinese Learning teacher list.');
  }
  syncSeedTeachers_();
  return buildAdminBreakdown_('animals');
}

/* ------------------------------------------------------------------ *
 * Identity helpers
 * ------------------------------------------------------------------ */

function getActiveSchoolEmail_() {
  var email;
  try {
    email = Session.getActiveUser().getEmail();
  } catch (err) {
    return '';
  }
  email = email ? String(email).trim().toLowerCase() : '';
  if (!email) return '';
  var domain = email.split('@')[1] || '';
  return domain === CL_ALLOWED_DOMAIN ? email : '';
}

function requireSchoolEmail_() {
  var email = getActiveSchoolEmail_();
  if (!email) {
    throw new Error('Sign in with your Bloomsbury Google account to save progress.');
  }
  return email;
}

function cleanToken_(value, maxLength) {
  var text = String(value == null ? '' : value).trim();
  if (!text) return '';
  if (text.length > (maxLength || 120)) text = text.slice(0, maxLength || 120);
  return /^[A-Za-z0-9_.:-]+$/.test(text) ? text : '';
}

function cleanText_(value, maxLength) {
  return String(value == null ? '' : value).slice(0, maxLength || 240);
}
