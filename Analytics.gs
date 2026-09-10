/**
 * Teacher-view analytics. Reads the raw Attempts log plus each student's
 * Mastery snapshot and builds a per-student breakdown:
 *
 *   - overall accuracy, words mastered, time studied, sessions, last active
 *   - per character: attempts, wrong answers, accuracy, average answer time,
 *     average attempts needed to master, directions mastered
 *   - per direction: attempts, wrong, accuracy
 *   - strengths and weaknesses (characters ranked by accuracy)
 *   - falling-game matches/errors per character, high score, best level
 *   - stroke-practice repetitions and mistakes per character
 *
 * The Attempts log is authoritative for quiz and falling numbers; the
 * Mastery snapshot supplies falling/stroke aggregates and time studied.
 */

function buildAdminBreakdown_(topic) {
  topic = topic || 'animals';
  var def = CL_TOPICS[topic];
  if (!def) throw new Error('Unknown topic.');

  var words = def.words;
  var dirKeys = Object.keys(CL_DIRECTIONS);

  var attempts = readAllAttempts_(topic);
  var masteryByEmail = readAllMastery_();

  var byEmail = {};
  attempts.forEach(function (a) {
    if (!a.email) return;
    (byEmail[a.email] = byEmail[a.email] || []).push(a);
  });

  var emailSet = {};
  Object.keys(byEmail).forEach(function (e) { emailSet[e] = true; });
  Object.keys(masteryByEmail).forEach(function (e) { emailSet[e] = true; });

  var students = Object.keys(emailSet).sort().map(function (email) {
    var list = (byEmail[email] || []).slice().sort(function (x, y) { return x.ts - y.ts; });
    var snapshot =
      (masteryByEmail[email] && masteryByEmail[email][topic] && masteryByEmail[email][topic].data) || {};

    var perWord = {};
    words.forEach(function (w) {
      perWord[w.id] = { attempts: 0, correct: 0, wrong: 0, timeMs: 0 };
    });
    var perDir = {};
    dirKeys.forEach(function (d) { perDir[d] = { attempts: 0, correct: 0, wrong: 0 }; });

    var totalAttempts = 0, totalCorrect = 0;
    var quizAttempts = 0, quizCorrect = 0, quizTimeMs = 0;
    var fallingAttempts = 0, fallingCorrect = 0;

    list.forEach(function (a) {
      totalAttempts++;
      if (a.correct) totalCorrect++;

      var pw = perWord[a.wordId];
      if (pw) {
        pw.attempts++;
        if (a.correct) pw.correct++; else pw.wrong++;
        pw.timeMs += a.elapsedMs;
      }

      if (a.mode === 'standard') {
        quizAttempts++;
        if (a.correct) quizCorrect++;
        quizTimeMs += a.elapsedMs;
        if (perDir[a.direction]) {
          perDir[a.direction].attempts++;
          if (a.correct) perDir[a.direction].correct++; else perDir[a.direction].wrong++;
        }
      } else if (a.mode === 'falling') {
        fallingAttempts++;
        if (a.correct) fallingCorrect++;
      }
    });

    // How many standard attempts it took to reach CL_TARGET correct in each
    // (character, direction) pair. null until that pair is mastered.
    function attemptsToMaster(wordId, dir) {
      var seen = 0, hits = 0;
      for (var i = 0; i < list.length; i++) {
        var a = list[i];
        if (a.mode !== 'standard' || a.wordId !== wordId || a.direction !== dir) continue;
        seen++;
        if (a.correct) hits++;
        if (hits >= CL_TARGET) return seen;
      }
      return null;
    }

    var wordRows = words.map(function (w) {
      var pw = perWord[w.id];
      var toMaster = [];
      var masteredDirs = 0;
      dirKeys.forEach(function (d) {
        var n = attemptsToMaster(w.id, d);
        if (n != null) { toMaster.push(n); masteredDirs++; }
      });
      return {
        id: w.id, zh: w.zh, en: w.en, py: w.py,
        attempts: pw.attempts,
        wrong: pw.wrong,
        accuracy: pw.attempts ? round2_(pw.correct / pw.attempts) : null,
        avgMs: pw.attempts ? Math.round(pw.timeMs / pw.attempts) : 0,
        masteredDirections: masteredDirs,
        totalDirections: dirKeys.length,
        avgAttemptsToMaster: toMaster.length
          ? round1_(toMaster.reduce(function (s, n) { return s + n; }, 0) / toMaster.length)
          : null
      };
    });

    var directionRows = dirKeys.map(function (d) {
      var pd = perDir[d];
      return {
        key: d,
        label: CL_DIRECTION_LABEL_(d),
        attempts: pd.attempts,
        wrong: pd.wrong,
        accuracy: pd.attempts ? round2_(pd.correct / pd.attempts) : null
      };
    });

    var ranked = wordRows
      .filter(function (r) { return r.attempts >= 3 && r.accuracy != null; })
      .sort(function (a, b) { return a.accuracy - b.accuracy || b.wrong - a.wrong; });
    var weaknesses = ranked.slice(0, 3).map(briefWord_);
    var strengths = ranked.slice().reverse().slice(0, 3).map(briefWord_);

    var falling = snapshot.falling || {};
    var fallingRows = words.map(function (w) {
      return {
        id: w.id, zh: w.zh, en: w.en,
        matches: numAt_(falling.totalCorrect, w.id),
        errors: numAt_(falling.totalWrong, w.id)
      };
    });

    var strokeStats = snapshot.stroke || { reps: {}, mistakes: {} };
    var strokeChars = Object.keys(strokeStats.reps || {});
    var strokeRows = strokeChars.map(function (c) {
      return {
        char: c,
        reps: Number(strokeStats.reps[c]) || 0,
        mistakes: numAt_(strokeStats.mistakes, c)
      };
    });
    var strokeMastered = strokeRows.filter(function (r) { return r.reps >= CL_TARGET; }).length;

    var masteredWords = wordRows.filter(function (r) {
      return r.masteredDirections >= dirKeys.length;
    }).length;

    var studyMs = Math.max(0, Number(snapshot.timeStudiedMs) || 0);
    var lastActive = list.length ? list[list.length - 1].ts : 0;
    var firstActive = list.length ? list[0].ts : 0;

    return {
      email: email,
      shortName: email.split('@')[0],
      totalAttempts: totalAttempts,
      overallAccuracy: totalAttempts ? round2_(totalCorrect / totalAttempts) : null,
      quizAttempts: quizAttempts,
      quizCorrect: quizCorrect,
      quizAccuracy: quizAttempts ? round2_(quizCorrect / quizAttempts) : null,
      fallingAttempts: fallingAttempts,
      fallingCorrect: fallingCorrect,
      masteredWords: masteredWords,
      wordCount: words.length,
      strokeMastered: strokeMastered,
      strokeCharCount: strokeRows.length,
      timeStudiedMs: studyMs,
      quizAnswerMs: quizTimeMs,
      sessionCount: Math.max(0, Number(snapshot.sessionCount) || 0),
      firstActive: firstActive ? new Date(firstActive).toISOString() : null,
      lastActive: lastActive ? new Date(lastActive).toISOString() : null,
      strengths: strengths,
      weaknesses: weaknesses,
      words: wordRows,
      directions: directionRows,
      falling: fallingRows,
      fallingHighScore: Math.max(0, Number(falling.highScore) || 0),
      fallingBestLevel: Math.max(1, Number(falling.bestLevel) || 1),
      stroke: strokeRows
    };
  });

  return {
    topic: topic,
    topicTitle: def.title,
    target: CL_TARGET,
    directionCount: dirKeys.length,
    generatedAt: new Date().toISOString(),
    students: students,
    topics: CL_TOPIC_SUMMARY_()
  };
}

function briefWord_(r) {
  return { zh: r.zh, en: r.en, accuracy: r.accuracy, attempts: r.attempts, wrong: r.wrong };
}
function numAt_(obj, key) {
  return (obj && Number(obj[key])) || 0;
}
function round1_(n) { return Math.round(n * 10) / 10; }
function round2_(n) { return Math.round(n * 100) / 100; }
