/**
 * Server-side curriculum. This is the source of truth for answer validation:
 * the client grades locally for instant feedback, but syncChineseProgress
 * re-checks every gradable attempt against the word list here before it is
 * written to the Attempts log.
 *
 * Keep the `animals` word list identical to the WORDS array in Index.html.
 * Future lessons are added as new entries with `status: 'available'`.
 */

// Number of correct answers per direction that counts a word as mastered.
// Must match TARGET in Index.html.
var CL_TARGET = 3;

var CL_DIRECTIONS = Object.freeze({
  zh_py: { from: 'zh', to: 'py', label: 'Character to pinyin' },
  py_zh: { from: 'py', to: 'zh', label: 'Pinyin to character' },
  zh_en: { from: 'zh', to: 'en', label: 'Character to meaning' },
  en_zh: { from: 'en', to: 'zh', label: 'Meaning to character' },
  py_en: { from: 'py', to: 'en', label: 'Pinyin to meaning' },
  en_py: { from: 'en', to: 'py', label: 'Meaning to pinyin' }
});

function CL_DIRECTION_LABEL_(key) {
  return (CL_DIRECTIONS[key] && CL_DIRECTIONS[key].label) || key || '';
}

var CL_GRADABLE_MODES = Object.freeze({ standard: true, falling: true });

var CL_TOPICS = Object.freeze({
  animals: {
    id: 'animals',
    lesson: 1,
    title: 'Animals',
    subtitle: '动物',
    status: 'available',
    words: [
      { id: 'dog',      zh: '狗',   en: 'dog',      py: 'gǒu' },
      { id: 'cat',      zh: '猫',   en: 'cat',      py: 'māo' },
      { id: 'goldfish', zh: '金鱼', en: 'goldfish', py: 'jīnyú' },
      { id: 'rabbit',   zh: '兔子', en: 'rabbit',   py: 'tùzi' },
      { id: 'bird',     zh: '鸟',   en: 'bird',     py: 'niǎo' },
      { id: 'snake',    zh: '蛇',   en: 'snake',    py: 'shé' },
      { id: 'horse',    zh: '马',   en: 'horse',    py: 'mǎ' },
      { id: 'panda',    zh: '熊猫', en: 'panda',    py: 'xióngmāo' },
      { id: 'dragon',   zh: '龙',   en: 'dragon',   py: 'lóng' }
    ]
  },

  // Placeholders so the sidebar shows the shape of the course. These carry
  // no word list yet and the client renders them locked.
  numbers:   { id: 'numbers',   lesson: 2, title: 'Numbers 1-10', subtitle: '数字', status: 'coming-soon', words: [] },
  colours:   { id: 'colours',   lesson: 3, title: 'Colours',      subtitle: '颜色', status: 'coming-soon', words: [] },
  family:    { id: 'family',    lesson: 4, title: 'Family',       subtitle: '家庭', status: 'coming-soon', words: [] },
  food:      { id: 'food',      lesson: 5, title: 'Food & drink', subtitle: '食物', status: 'coming-soon', words: [] },
  classroom: { id: 'classroom', lesson: 6, title: 'Classroom',    subtitle: '教室', status: 'coming-soon', words: [] }
});

/** Ordered, word-free summary for the client sidebar. */
function CL_TOPIC_SUMMARY_() {
  return Object.keys(CL_TOPICS)
    .map(function (key) {
      var t = CL_TOPICS[key];
      return {
        id: t.id,
        lesson: t.lesson,
        title: t.title,
        subtitle: t.subtitle,
        status: t.status,
        wordCount: t.words.length
      };
    })
    .sort(function (a, b) { return a.lesson - b.lesson; });
}

function CL_WORD_(topic, wordId) {
  var t = CL_TOPICS[topic];
  if (!t) return null;
  for (var i = 0; i < t.words.length; i++) {
    if (t.words[i].id === wordId) return t.words[i];
  }
  return null;
}

/**
 * Normalises a value for comparison: trims, lower-cases, and strips spaces so
 * "jīn yú" and "jīnyú" match. Tone marks are kept — they are part of a
 * correct pinyin answer.
 */
function CL_NORMALISE_(value) {
  return String(value == null ? '' : value).trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * Grades one raw client attempt. Returns an Attempts row array, or null if
 * the attempt is malformed. `Correct` is the server's own judgement for
 * gradable modes; for stroke practice (not gradable here) the client flag
 * is stored and Source is marked 'client'.
 */
function gradeAttempt_(email, topic, now, raw) {
  raw = (raw && typeof raw === 'object') ? raw : {};
  var mode = cleanToken_(raw.mode, 30) || 'standard';
  var direction = cleanToken_(raw.direction, 10);
  var wordId = cleanToken_(raw.wordId, 40);
  var answer = cleanText_(raw.answer, 200);
  var elapsedMs = Math.max(0, Math.min(600000, Number(raw.elapsedMs) || 0));

  var word = CL_WORD_(topic, wordId);
  if (!word) return null;

  var expected = '';
  var correct = '';
  var source = 'client';

  if (CL_GRADABLE_MODES[mode] && CL_DIRECTIONS[direction]) {
    var toField = CL_DIRECTIONS[direction].to;
    expected = word[toField];
    var chosenId = cleanToken_(raw.chosenId, 40);
    if (chosenId) {
      correct = chosenId === wordId;
    } else {
      correct = CL_NORMALISE_(answer) === CL_NORMALISE_(expected);
    }
    source = 'server';
  } else if (mode === 'falling') {
    expected = word.en;
    correct = raw.clientCorrect === true;
    source = 'server';
  } else {
    // stroke or anything else: keep the client's own judgement
    correct = raw.clientCorrect === true ? true : (raw.clientCorrect === false ? false : '');
  }

  var promptField = CL_DIRECTIONS[direction] ? CL_DIRECTIONS[direction].from : 'zh';
  return [
    now.toISOString(),
    email,
    topic,
    mode,
    direction,
    wordId,
    word[promptField] || word.zh,
    answer,
    expected,
    correct,
    source,
    elapsedMs
  ];
}
