/**
 * Data storage for Chinese Learning.
 *
 * All data lives in one Google Sheet, created automatically the first time
 * an endpoint needs it. Its ID is kept in Script Properties so it survives
 * redeploys. The deploying account is seeded as the first teacher so the
 * admin view is never locked out.
 *
 * Sheets:
 *   Attempts  one row per graded question attempt (the raw activity log)
 *   Mastery   one row per (student, topic): an opaque client aggregate as JSON
 *   Teachers  one email per row; these accounts can open the admin view
 */

function getDataSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(CL_DATA_PROP_KEY);

  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (err) {
      // The stored ID no longer opens (deleted, permissions). Fall through
      // and create a fresh workbook rather than failing every request.
    }
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(CL_LOCK_TIMEOUT_MS);
  try {
    id = props.getProperty(CL_DATA_PROP_KEY);
    if (id) {
      try { return SpreadsheetApp.openById(id); } catch (err) { /* recreate */ }
    }
    var ss = SpreadsheetApp.create(CL_DATA_SPREADSHEET_NAME);
    initSheet_(ss, CL_SHEETS.ATTEMPTS, CL_ATTEMPT_HEADERS);
    initSheet_(ss, CL_SHEETS.MASTERY, CL_MASTERY_HEADERS);
    initSheet_(ss, CL_SHEETS.TEACHERS, CL_TEACHER_HEADERS);

    var seededTeacher = '';
    try {
      seededTeacher = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
    } catch (err) {
      seededTeacher = '';
    }
    if (seededTeacher) {
      ss.getSheetByName(CL_SHEETS.TEACHERS).getRange(2, 1).setValue(seededTeacher);
    }

    var defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet) ss.deleteSheet(defaultSheet);

    props.setProperty(CL_DATA_PROP_KEY, ss.getId());
    SpreadsheetApp.flush();
    return ss;
  } finally {
    lock.releaseLock();
  }
}

function initSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  sheet.setFrozenRows(1);
  return sheet;
}

function getSheet_(name, headers) {
  var ss = getDataSpreadsheet_();
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = initSheet_(ss, name, headers);
  return sheet;
}

/* ------------------------------------------------------------------ *
 * Teachers
 * ------------------------------------------------------------------ */

function isTeacherEmail_(email) {
  if (!email) return false;
  var target = String(email).trim().toLowerCase();
  var sheet = getSheet_(CL_SHEETS.TEACHERS, CL_TEACHER_HEADERS);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim().toLowerCase() === target) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ *
 * Attempts log
 * ------------------------------------------------------------------ */

function appendAttemptRows_(rows) {
  if (!rows || !rows.length) return;
  var sheet = getSheet_(CL_SHEETS.ATTEMPTS, CL_ATTEMPT_HEADERS);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, CL_ATTEMPT_HEADERS.length).setValues(rows);
  trimAttempts_(sheet);
}

/** Keeps the Attempts sheet from growing without bound across a school year. */
function trimAttempts_(sheet) {
  var lastRow = sheet.getLastRow();
  var overflow = lastRow - 1 - CL_MAX_ATTEMPT_ROWS;
  if (overflow > 0) sheet.deleteRows(2, overflow);
}

function readRecentAttempts_(limit) {
  var sheet = getSheet_(CL_SHEETS.ATTEMPTS, CL_ATTEMPT_HEADERS);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var count = Math.min(limit || 200, lastRow - 1);
  var values = sheet.getRange(lastRow - count + 1, 1, count, CL_ATTEMPT_HEADERS.length).getValues();
  return values.map(function (row) {
    return {
      timestamp: row[0] ? new Date(row[0]).toISOString() : '',
      email: row[1],
      topic: row[2],
      mode: row[3],
      direction: row[4],
      wordId: row[5],
      prompt: row[6],
      answer: row[7],
      expected: row[8],
      correct: row[9] === true,
      source: row[10],
      elapsedMs: Number(row[11]) || 0
    };
  }).reverse();
}

/* ------------------------------------------------------------------ *
 * Mastery snapshots
 * ------------------------------------------------------------------ */

function masteryKey_(email, topic) {
  return String(email).trim().toLowerCase() + '::' + topic;
}

function readMasteryForEmail_(email) {
  var target = String(email).trim().toLowerCase();
  var sheet = getSheet_(CL_SHEETS.MASTERY, CL_MASTERY_HEADERS);
  var lastRow = sheet.getLastRow();
  var result = {};
  if (lastRow < 2) return result;
  var values = sheet.getRange(2, 1, lastRow - 1, CL_MASTERY_HEADERS.length).getValues();
  values.forEach(function (row) {
    if (String(row[0] || '').trim().toLowerCase() !== target) return;
    var topic = String(row[1] || '');
    if (!topic) return;
    result[topic] = {
      data: safeParseJson_(row[2]),
      updatedAt: row[3] ? new Date(row[3]).toISOString() : null
    };
  });
  return result;
}

function writeMasteryForEmail_(email, topic, data) {
  var target = String(email).trim().toLowerCase();
  var sheet = getSheet_(CL_SHEETS.MASTERY, CL_MASTERY_HEADERS);
  var lastRow = sheet.getLastRow();
  var json = JSON.stringify(data).slice(0, 45000);
  var now = new Date().toISOString();

  if (lastRow >= 2) {
    var keys = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var i = 0; i < keys.length; i++) {
      if (String(keys[i][0] || '').trim().toLowerCase() === target && String(keys[i][1] || '') === topic) {
        sheet.getRange(i + 2, 3, 1, 2).setValues([[json, now]]);
        return;
      }
    }
  }
  sheet.appendRow([target, topic, json, now]);
}

function readAllMastery_() {
  var sheet = getSheet_(CL_SHEETS.MASTERY, CL_MASTERY_HEADERS);
  var lastRow = sheet.getLastRow();
  var byEmail = {};
  if (lastRow < 2) return byEmail;
  var values = sheet.getRange(2, 1, lastRow - 1, CL_MASTERY_HEADERS.length).getValues();
  values.forEach(function (row) {
    var email = String(row[0] || '').trim().toLowerCase();
    var topic = String(row[1] || '');
    if (!email || !topic) return;
    if (!byEmail[email]) byEmail[email] = {};
    byEmail[email][topic] = {
      data: safeParseJson_(row[2]),
      updatedAt: row[3] ? new Date(row[3]).toISOString() : null
    };
  });
  return byEmail;
}

function safeParseJson_(value) {
  try {
    var parsed = value ? JSON.parse(value) : {};
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch (err) {
    return {};
  }
}
