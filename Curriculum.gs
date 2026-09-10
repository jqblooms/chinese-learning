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
    group: 'Tutorial',
    lesson: 1,
    title: 'Animals',
    subtitle: '动物 · tutorial',
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

  // Year 7 Term 1A (HSK 1 support). Core Language from the unit plans.
  y7_foundation: {
    id: 'y7_foundation',
    group: 'Year 7',
    lesson: 1,
    title: 'Unit 1: Foundation & Greetings',
    subtitle: '中文基础与问候 · HSK 1',
    status: 'available',
    words: [
      { id: 'hello',       zh: '你好',   en: 'hello',                 py: 'nǐ hǎo' },
      { id: 'hellopolite', zh: '您好',   en: 'hello (polite)',        py: 'nín hǎo' },
      { id: 'hellogroup',  zh: '你们好', en: 'hello (to a group)',    py: 'nǐmen hǎo' },
      { id: 'helloall',    zh: '大家好', en: 'hello everyone',        py: 'dàjiā hǎo' },
      { id: 'goodmorning', zh: '早上好', en: 'good morning',          py: 'zǎoshang hǎo' },
      { id: 'helloteacher',zh: '老师好', en: 'hello, teacher',        py: 'lǎoshī hǎo' },
      { id: 'thankyou',    zh: '谢谢',   en: 'thank you',             py: 'xièxie' },
      { id: 'yourewelcome',zh: '不客气', en: "you're welcome",        py: 'bú kèqi' },
      { id: 'sorry',       zh: '对不起', en: 'sorry',                 py: 'duìbuqǐ' },
      { id: 'nevermind',   zh: '没关系', en: "it's OK / never mind",  py: 'méi guānxi' },
      { id: 'goodbye',     zh: '再见',   en: 'goodbye',               py: 'zàijiàn' },
      { id: 'you',         zh: '你',     en: 'you',                   py: 'nǐ' },
      { id: 'youpolite',   zh: '您',     en: 'you (polite)',          py: 'nín' },
      { id: 'youplural',   zh: '你们',   en: 'you (plural)',          py: 'nǐmen' },
      { id: 'everyone',    zh: '大家',   en: 'everyone',              py: 'dàjiā' },
      { id: 'teacher',     zh: '老师',   en: 'teacher',               py: 'lǎoshī' },
      { id: 'pluralmarker',zh: '们',     en: 'plural marker (people)',py: 'men' },
      { id: 'good',        zh: '好',     en: 'good / well',           py: 'hǎo' }
    ]
  },

  y7_greetings: {
    id: 'y7_greetings',
    group: 'Year 7',
    lesson: 2,
    title: 'Unit 2: All About Me',
    subtitle: '中文基础与问候 · HSK 1',
    status: 'available',
    words: [
      { id: 'zero',      zh: '零',     en: 'zero',                py: 'líng' },
      { id: 'one',       zh: '一',     en: 'one',                 py: 'yī' },
      { id: 'two',       zh: '二',     en: 'two',                 py: 'èr' },
      { id: 'three',     zh: '三',     en: 'three',               py: 'sān' },
      { id: 'four',      zh: '四',     en: 'four',                py: 'sì' },
      { id: 'five',      zh: '五',     en: 'five',                py: 'wǔ' },
      { id: 'six',       zh: '六',     en: 'six',                 py: 'liù' },
      { id: 'seven',     zh: '七',     en: 'seven',               py: 'qī' },
      { id: 'eight',     zh: '八',     en: 'eight',               py: 'bā' },
      { id: 'nine',      zh: '九',     en: 'nine',                py: 'jiǔ' },
      { id: 'ten',       zh: '十',     en: 'ten',                 py: 'shí' },
      { id: 'hundred',   zh: '百',     en: 'hundred',             py: 'bǎi' },
      { id: 'i',         zh: '我',     en: 'I / me',              py: 'wǒ' },
      { id: 'you',       zh: '你',     en: 'you',                 py: 'nǐ' },
      { id: 'he',        zh: '他',     en: 'he / him',            py: 'tā' },
      { id: 'she',       zh: '她',     en: 'she / her',           py: 'tā' },
      { id: 'called',    zh: '叫',     en: 'to be called',        py: 'jiào' },
      { id: 'tobe',      zh: '是',     en: 'to be',               py: 'shì' },
      { id: 'have',      zh: '有',     en: 'to have',             py: 'yǒu' },
      { id: 'name',      zh: '名字',   en: 'name',                py: 'míngzi' },
      { id: 'yearsold',  zh: '岁',     en: 'years old',           py: 'suì' },
      { id: 'birthday',  zh: '生日',   en: 'birthday',            py: 'shēngrì' },
      { id: 'month',     zh: '月',     en: 'month',               py: 'yuè' },
      { id: 'dayofmonth',zh: '号',     en: 'day (of the month)',  py: 'hào' },
      { id: 'what',      zh: '什么',   en: 'what',                py: 'shénme' },
      { id: 'howmany',   zh: '几',     en: 'how many',            py: 'jǐ' },
      { id: 'which',     zh: '哪',     en: 'which',               py: 'nǎ' },
      { id: 'person',    zh: '人',     en: 'person',              py: 'rén' },
      { id: 'china',     zh: '中国',   en: 'China',               py: 'Zhōngguó' },
      { id: 'uk',        zh: '英国',   en: 'the UK / Britain',    py: 'Yīngguó' },
      { id: 'thailand',  zh: '泰国',   en: 'Thailand',            py: 'Tàiguó' },
      { id: 'chinese_p', zh: '中国人', en: 'Chinese (person)',    py: 'Zhōngguórén' },
      { id: 'british_p', zh: '英国人', en: 'British (person)',    py: 'Yīngguórén' },
      { id: 'thai_p',    zh: '泰国人', en: 'Thai (person)',       py: 'Tàiguórén' }
    ]
  },

  // Year 8 Term 1A (HSK 2 support).
  y8_town: {
    id: 'y8_town',
    group: 'Year 8',
    lesson: 1,
    title: 'Unit 1: My Town & Neighbourhood',
    subtitle: '我的城市和社区 · HSK 2',
    status: 'available',
    words: [
      { id: 'school',     zh: '学校',   en: 'school',              py: 'xuéxiào' },
      { id: 'shop',       zh: '商店',   en: 'shop',                py: 'shāngdiàn' },
      { id: 'supermarket',zh: '超市',   en: 'supermarket',         py: 'chāoshì' },
      { id: 'restaurant', zh: '饭店',   en: 'restaurant',          py: 'fàndiàn' },
      { id: 'cafe',       zh: '咖啡店', en: 'café',                py: 'kāfēidiàn' },
      { id: 'hospital',   zh: '医院',   en: 'hospital',            py: 'yīyuàn' },
      { id: 'bank',       zh: '银行',   en: 'bank',                py: 'yínháng' },
      { id: 'park',       zh: '公园',   en: 'park',                py: 'gōngyuán' },
      { id: 'cinema',     zh: '电影院', en: 'cinema',              py: 'diànyǐngyuàn' },
      { id: 'trainstation',zh: '火车站',en: 'train station',       py: 'huǒchēzhàn' },
      { id: 'citycentre', zh: '市中心', en: 'city centre',         py: 'shìzhōngxīn' },
      { id: 'home',       zh: '家',     en: 'home',                py: 'jiā' },
      { id: 'nearby',     zh: '附近',   en: 'nearby',              py: 'fùjìn' },
      { id: 'at',         zh: '在',     en: 'at / in',             py: 'zài' },
      { id: 'have',       zh: '有',     en: 'to have / there is',  py: 'yǒu' },
      { id: 'nothave',    zh: '没有',   en: "not have / there isn't", py: 'méiyǒu' },
      { id: 'infront',    zh: '前面',   en: 'in front',            py: 'qiánmiàn' },
      { id: 'behind',     zh: '后面',   en: 'behind',              py: 'hòumiàn' },
      { id: 'beside',     zh: '旁边',   en: 'beside / next to',    py: 'pángbiān' },
      { id: 'opposite',   zh: '对面',   en: 'opposite',            py: 'duìmiàn' },
      { id: 'leftside',   zh: '左边',   en: 'the left side',       py: 'zuǒbiān' },
      { id: 'rightside',  zh: '右边',   en: 'the right side',      py: 'yòubiān' },
      { id: 'far',        zh: '远',     en: 'far',                 py: 'yuǎn' },
      { id: 'near',       zh: '近',     en: 'near',                py: 'jìn' },
      { id: 'big',        zh: '大',     en: 'big',                 py: 'dà' },
      { id: 'small',      zh: '小',     en: 'small',               py: 'xiǎo' },
      { id: 'lively',     zh: '热闹',   en: 'lively',              py: 'rènao' },
      { id: 'quiet',      zh: '安静',   en: 'quiet',               py: 'ānjìng' },
      { id: 'convenient', zh: '方便',   en: 'convenient',          py: 'fāngbiàn' },
      { id: 'like',       zh: '喜欢',   en: 'to like',             py: 'xǐhuan' },
      { id: 'think',      zh: '觉得',   en: 'to think / feel',     py: 'juéde' },
      { id: 'because',    zh: '因为',   en: 'because',             py: 'yīnwèi' },
      { id: 'therefore',  zh: '所以',   en: 'so / therefore',      py: 'suǒyǐ' }
    ]
  },

  y8_directions: {
    id: 'y8_directions',
    group: 'Year 8',
    lesson: 2,
    title: 'Unit 2: Directions & Getting Around',
    subtitle: '问路与交通 · HSK 2',
    status: 'available',
    words: [
      { id: 'gostraight', zh: '一直走',   en: 'go straight on',     py: 'yìzhí zǒu' },
      { id: 'goforward',  zh: '往前走',   en: 'walk forwards',      py: 'wǎng qián zǒu' },
      { id: 'turnleft',   zh: '左转',     en: 'turn left',          py: 'zuǒ zhuǎn' },
      { id: 'turnright',  zh: '右转',     en: 'turn right',         py: 'yòu zhuǎn' },
      { id: 'arrive',     zh: '到',       en: 'to arrive at',       py: 'dào' },
      { id: 'from',       zh: '从',       en: 'from',               py: 'cóng' },
      { id: 'first',      zh: '先',       en: 'first',              py: 'xiān' },
      { id: 'then',       zh: '然后',     en: 'then / after that',  py: 'ránhòu' },
      { id: 'finally',    zh: '最后',     en: 'finally',            py: 'zuìhòu' },
      { id: 'howtowalk',  zh: '怎么走',   en: 'how do I get there', py: 'zěnme zǒu' },
      { id: 'howtogo',    zh: '怎么去',   en: 'how do I go to',     py: 'zěnme qù' },
      { id: 'excuseme',   zh: '请问',     en: 'excuse me (may I ask)', py: 'qǐngwèn' },
      { id: 'whereis',    zh: '在哪儿',   en: 'where is …?',        py: 'zài nǎr' },
      { id: 'onfoot',     zh: '走路',     en: 'to walk / on foot',  py: 'zǒulù' },
      { id: 'bycar',      zh: '坐车',     en: 'to go by car / bus', py: 'zuòchē' },
      { id: 'drive',      zh: '开车',     en: 'to drive',           py: 'kāichē' },
      { id: 'bus',        zh: '公共汽车', en: 'bus',                py: 'gōnggòng qìchē' },
      { id: 'train',      zh: '火车',     en: 'train',              py: 'huǒchē' },
      { id: 'bytrain',    zh: '坐火车',   en: 'to take the train',  py: 'zuò huǒchē' },
      { id: 'bike',       zh: '自行车',   en: 'bicycle',            py: 'zìxíngchē' },
      { id: 'ridebike',   zh: '骑自行车', en: 'to ride a bike',     py: 'qí zìxíngchē' },
      { id: 'subway',     zh: '地铁',     en: 'subway / metro',     py: 'dìtiě' },
      { id: 'road',       zh: '路',       en: 'road',               py: 'lù' },
      { id: 'infront',    zh: '前面',     en: 'in front',           py: 'qiánmiàn' },
      { id: 'behind',     zh: '后面',     en: 'behind',             py: 'hòumiàn' },
      { id: 'leftside',   zh: '左边',     en: 'the left side',      py: 'zuǒbiān' },
      { id: 'rightside',  zh: '右边',     en: 'the right side',     py: 'yòubiān' },
      { id: 'far',        zh: '远',       en: 'far',                py: 'yuǎn' },
      { id: 'near',       zh: '近',       en: 'near',               py: 'jìn' }
    ]
  },

  // Year 9 Term 1A (HSK 3 support).
  y9_family: {
    id: 'y9_family',
    group: 'Year 9',
    lesson: 1,
    title: 'Unit 1: Me & My Family',
    subtitle: '我和我的家人 · HSK 3',
    status: 'available',
    words: [
      { id: 'familymember', zh: '家人',   en: 'family member(s)',   py: 'jiārén' },
      { id: 'parents',      zh: '父母',   en: 'parents',            py: 'fùmǔ' },
      { id: 'dad',          zh: '爸爸',   en: 'dad',                py: 'bàba' },
      { id: 'mum',          zh: '妈妈',   en: 'mum',                py: 'māma' },
      { id: 'olderbrother', zh: '哥哥',   en: 'older brother',      py: 'gēge' },
      { id: 'oldersister',  zh: '姐姐',   en: 'older sister',       py: 'jiějie' },
      { id: 'youngerbro',   zh: '弟弟',   en: 'younger brother',    py: 'dìdi' },
      { id: 'youngersis',   zh: '妹妹',   en: 'younger sister',     py: 'mèimei' },
      { id: 'onlychild',    zh: '独生子女',en: 'an only child',     py: 'dúshēng zǐnǚ' },
      { id: 'friend',       zh: '朋友',   en: 'friend',             py: 'péngyou' },
      { id: 'age',          zh: '年纪',   en: 'age',                py: 'niánjì' },
      { id: 'job',          zh: '工作',   en: 'job / work',         py: 'gōngzuò' },
      { id: 'tall',         zh: '高',     en: 'tall',               py: 'gāo' },
      { id: 'shortheight',  zh: '矮',     en: 'short (in height)',  py: 'ǎi' },
      { id: 'long',         zh: '长',     en: 'long',               py: 'cháng' },
      { id: 'shortlength',  zh: '短',     en: 'short (in length)',  py: 'duǎn' },
      { id: 'pretty',       zh: '漂亮',   en: 'pretty',             py: 'piàoliang' },
      { id: 'handsome',     zh: '帅',     en: 'handsome',           py: 'shuài' },
      { id: 'clever',       zh: '聪明',   en: 'clever',             py: 'cōngming' },
      { id: 'friendly',     zh: '友好',   en: 'friendly',           py: 'yǒuhǎo' },
      { id: 'cheerful',     zh: '开朗',   en: 'cheerful / outgoing',py: 'kāilǎng' },
      { id: 'quiet',        zh: '安静',   en: 'quiet',              py: 'ānjìng' },
      { id: 'interesting',  zh: '有意思', en: 'interesting',        py: 'yǒuyìsi' },
      { id: 'humorous',     zh: '幽默',   en: 'humorous',           py: 'yōumò' },
      { id: 'conscientious',zh: '认真',   en: 'conscientious',      py: 'rènzhēn' },
      { id: 'warmhearted',  zh: '热情',   en: 'warm / enthusiastic',py: 'rèqíng' },
      { id: 'together',     zh: '一起',   en: 'together',           py: 'yìqǐ' },
      { id: 'often',        zh: '常常',   en: 'often',              py: 'chángcháng' },
      { id: 'sometimes',    zh: '有时候', en: 'sometimes',          py: 'yǒu shíhou' },
      { id: 'usually',      zh: '平时',   en: 'usually',            py: 'píngshí' },
      { id: 'weekend',      zh: '周末',   en: 'weekend',            py: 'zhōumò' },
      { id: 'like',         zh: '喜欢',   en: 'to like',            py: 'xǐhuan' },
      { id: 'think',        zh: '觉得',   en: 'to think / feel',    py: 'juéde' },
      { id: 'thesame',      zh: '一样',   en: 'the same',           py: 'yíyàng' },
      { id: 'different',    zh: '不一样', en: 'different',           py: 'bù yíyàng' }
    ]
  },

  y9_friends: {
    id: 'y9_friends',
    group: 'Year 9',
    lesson: 2,
    title: 'Unit 2: Friends & Relationships',
    subtitle: '朋友与人际关系 · HSK 3',
    status: 'available',
    words: [
      { id: 'friend',      zh: '朋友',     en: 'friend',             py: 'péngyou' },
      { id: 'goodfriend',  zh: '好朋友',   en: 'good friend',        py: 'hǎo péngyou' },
      { id: 'bestfriend',  zh: '最好的朋友',en: 'best friend',       py: 'zuì hǎo de péngyou' },
      { id: 'know',        zh: '认识',     en: 'to know / to meet',  py: 'rènshi' },
      { id: 'relationship',zh: '关系',     en: 'relationship',       py: 'guānxi' },
      { id: 'personality', zh: '性格',     en: 'personality',        py: 'xìnggé' },
      { id: 'friendly',    zh: '友好',     en: 'friendly',           py: 'yǒuhǎo' },
      { id: 'cheerful',    zh: '开朗',     en: 'cheerful / outgoing',py: 'kāilǎng' },
      { id: 'humorous',    zh: '幽默',     en: 'humorous',           py: 'yōumò' },
      { id: 'warmhearted', zh: '热情',     en: 'warm / enthusiastic',py: 'rèqíng' },
      { id: 'clever',      zh: '聪明',     en: 'clever',             py: 'cōngming' },
      { id: 'honest',      zh: '诚实',     en: 'honest',             py: 'chéngshí' },
      { id: 'interesting', zh: '有意思',   en: 'interesting',        py: 'yǒuyìsi' },
      { id: 'important',   zh: '重要',     en: 'important',           py: 'zhòngyào' },
      { id: 'together',    zh: '一起',     en: 'together',           py: 'yìqǐ' },
      { id: 'chat',       zh: '聊天',     en: 'to chat',             py: 'liáotiān' },
      { id: 'watchfilm',  zh: '看电影',   en: 'to watch a film',    py: 'kàn diànyǐng' },
      { id: 'sport',      zh: '运动',     en: 'sport / to exercise',py: 'yùndòng' },
      { id: 'eatmeal',    zh: '吃饭',     en: 'to eat (a meal)',    py: 'chīfàn' },
      { id: 'study',      zh: '学习',     en: 'to study',           py: 'xuéxí' },
      { id: 'gooutfun',   zh: '出去玩',   en: 'to go out and have fun', py: 'chūqù wán' },
      { id: 'help',       zh: '帮助',     en: 'to help',            py: 'bāngzhù' },
      { id: 'think',      zh: '觉得',     en: 'to think / feel',    py: 'juéde' },
      { id: 'consider',   zh: '认为',     en: 'to think / consider',py: 'rènwéi' },
      { id: 'formeview',  zh: '对我来说', en: 'in my view / for me',py: 'duì wǒ lái shuō' },
      { id: 'because',    zh: '因为',     en: 'because',             py: 'yīnwèi' },
      { id: 'therefore',  zh: '所以',     en: 'so / therefore',     py: 'suǒyǐ' },
      { id: 'although',   zh: '虽然',     en: 'although',           py: 'suīrán' },
      { id: 'but',        zh: '但是',     en: 'but',                py: 'dànshì' },
      { id: 'besides',    zh: '另外',     en: 'besides / in addition', py: 'lìngwài' }
    ]
  },

  // Year 10 Term 1A, Cambridge IGCSE Mandarin Chinese (0547).
  y10_home: {
    id: 'y10_home',
    group: 'Year 10',
    lesson: 1,
    title: 'Unit 1: My Home',
    subtitle: '我的家 · IGCSE 0547',
    status: 'available',
    words: [
      { id: 'home',        zh: '家',     en: 'home / family',       py: 'jiā' },
      { id: 'house',       zh: '房子',   en: 'house',               py: 'fángzi' },
      { id: 'flat',        zh: '公寓',   en: 'flat / apartment',    py: 'gōngyù' },
      { id: 'building',    zh: '楼',     en: 'building / storey',   py: 'lóu' },
      { id: 'room',        zh: '房间',   en: 'room',                py: 'fángjiān' },
      { id: 'bedroom',     zh: '卧室',   en: 'bedroom',             py: 'wòshì' },
      { id: 'livingroom',  zh: '客厅',   en: 'living room',         py: 'kètīng' },
      { id: 'kitchen',     zh: '厨房',   en: 'kitchen',             py: 'chúfáng' },
      { id: 'bathroom',    zh: '洗手间', en: 'bathroom / toilet',   py: 'xǐshǒujiān' },
      { id: 'balcony',     zh: '阳台',   en: 'balcony',             py: 'yángtái' },
      { id: 'garden',      zh: '花园',   en: 'garden',              py: 'huāyuán' },
      { id: 'upstairs',    zh: '楼上',   en: 'upstairs',            py: 'lóushàng' },
      { id: 'downstairs',  zh: '楼下',   en: 'downstairs',          py: 'lóuxià' },
      { id: 'bed',         zh: '床',     en: 'bed',                 py: 'chuáng' },
      { id: 'table',       zh: '桌子',   en: 'table / desk',        py: 'zhuōzi' },
      { id: 'chair',       zh: '椅子',   en: 'chair',               py: 'yǐzi' },
      { id: 'sofa',        zh: '沙发',   en: 'sofa',                py: 'shāfā' },
      { id: 'tv',          zh: '电视',   en: 'television',          py: 'diànshì' },
      { id: 'fridge',      zh: '冰箱',   en: 'fridge',              py: 'bīngxiāng' },
      { id: 'aircon',      zh: '空调',   en: 'air conditioning',    py: 'kōngtiáo' },
      { id: 'computer',    zh: '电脑',   en: 'computer',            py: 'diànnǎo' },
      { id: 'door',        zh: '门',     en: 'door',                py: 'mén' },
      { id: 'window',      zh: '窗户',   en: 'window',              py: 'chuānghu' },
      { id: 'big',         zh: '大',     en: 'big',                 py: 'dà' },
      { id: 'small',       zh: '小',     en: 'small',               py: 'xiǎo' },
      { id: 'new',         zh: '新',     en: 'new',                 py: 'xīn' },
      { id: 'old',         zh: '旧',     en: 'old (of things)',     py: 'jiù' },
      { id: 'pretty',      zh: '漂亮',   en: 'pretty / beautiful',  py: 'piàoliang' },
      { id: 'comfortable', zh: '舒服',   en: 'comfortable',         py: 'shūfu' },
      { id: 'quiet',       zh: '安静',   en: 'quiet',               py: 'ānjìng' },
      { id: 'convenient',  zh: '方便',   en: 'convenient',          py: 'fāngbiàn' },
      { id: 'modern',      zh: '现代',   en: 'modern',              py: 'xiàndài' },
      { id: 'spacious',    zh: '宽敞',   en: 'spacious',            py: 'kuānchang' }
    ]
  },

  y10_town: {
    id: 'y10_town',
    group: 'Year 10',
    lesson: 2,
    title: 'Unit 2: Town & Neighbourhood',
    subtitle: '城市与社区 · IGCSE 0547',
    status: 'available',
    words: [
      { id: 'citycentre',  zh: '市中心',   en: 'city centre',         py: 'shìzhōngxīn' },
      { id: 'shop',        zh: '商店',     en: 'shop',                py: 'shāngdiàn' },
      { id: 'mall',        zh: '商场',     en: 'shopping mall',       py: 'shāngchǎng' },
      { id: 'supermarket', zh: '超市',     en: 'supermarket',         py: 'chāoshì' },
      { id: 'restaurant',  zh: '饭店',     en: 'restaurant',          py: 'fàndiàn' },
      { id: 'cafe',        zh: '咖啡店',   en: 'café',                py: 'kāfēidiàn' },
      { id: 'hospital',    zh: '医院',     en: 'hospital',            py: 'yīyuàn' },
      { id: 'bank',        zh: '银行',     en: 'bank',                py: 'yínháng' },
      { id: 'park',        zh: '公园',     en: 'park',                py: 'gōngyuán' },
      { id: 'cinema',      zh: '电影院',   en: 'cinema',              py: 'diànyǐngyuàn' },
      { id: 'gym',         zh: '体育馆',   en: 'sports hall / gym',   py: 'tǐyùguǎn' },
      { id: 'school',      zh: '学校',     en: 'school',              py: 'xuéxiào' },
      { id: 'trainstation',zh: '火车站',   en: 'train station',       py: 'huǒchēzhàn' },
      { id: 'airport',     zh: '机场',     en: 'airport',             py: 'jīchǎng' },
      { id: 'market',      zh: '市场',     en: 'market',              py: 'shìchǎng' },
      { id: 'nearby',      zh: '附近',     en: 'nearby',              py: 'fùjìn' },
      { id: 'opposite',    zh: '对面',     en: 'opposite',            py: 'duìmiàn' },
      { id: 'beside',      zh: '旁边',     en: 'beside / next to',    py: 'pángbiān' },
      { id: 'distfrom',    zh: '离',       en: '(distance) from',     py: 'lí' },
      { id: 'far',         zh: '远',       en: 'far',                 py: 'yuǎn' },
      { id: 'near',        zh: '近',       en: 'near / close',        py: 'jìn' },
      { id: 'urbanarea',   zh: '市区',     en: 'urban area',          py: 'shìqū' },
      { id: 'suburbs',     zh: '郊区',     en: 'suburbs',             py: 'jiāoqū' },
      { id: 'city',        zh: '城市',     en: 'city',                py: 'chéngshì' },
      { id: 'countryside', zh: '农村',     en: 'countryside',         py: 'nóngcūn' },
      { id: 'lively',      zh: '热闹',     en: 'lively / bustling',   py: 'rènao' },
      { id: 'quiet',       zh: '安静',     en: 'quiet',               py: 'ānjìng' },
      { id: 'convenient',  zh: '方便',     en: 'convenient',          py: 'fāngbiàn' },
      { id: 'inconvenient',zh: '不方便',   en: 'inconvenient',        py: 'bù fāngbiàn' },
      { id: 'clean',       zh: '干净',     en: 'clean',               py: 'gānjìng' },
      { id: 'dirty',       zh: '脏',       en: 'dirty',               py: 'zāng' },
      { id: 'safe',        zh: '安全',     en: 'safe',                py: 'ānquán' },
      { id: 'crowded',     zh: '拥挤',     en: 'crowded',             py: 'yōngjǐ' },
      { id: 'modern',      zh: '现代',     en: 'modern',              py: 'xiàndài' },
      { id: 'boring',      zh: '无聊',     en: 'boring',              py: 'wúliáo' },
      { id: 'interesting', zh: '有意思',   en: 'interesting',         py: 'yǒuyìsi' },
      { id: 'advantage',   zh: '优点',     en: 'advantage',           py: 'yōudiǎn' },
      { id: 'disadvantage',zh: '缺点',     en: 'disadvantage',        py: 'quēdiǎn' }
    ]
  },

  // Year 11 Term 1A, Cambridge IGCSE Mandarin Chinese (0547). Core Language
  // from the unit plans. Word lists must match CURRICULUM in Index.html.
  y11_school: {
    id: 'y11_school',
    group: 'Year 11',
    lesson: 1,
    title: 'Unit 1: School & Education',
    subtitle: '学校与教育 · IGCSE 0547',
    status: 'available',
    words: [
      { id: 'school',       zh: '学校',   en: 'school',                py: 'xuéxiào' },
      { id: 'secondary',    zh: '中学',   en: 'secondary school',      py: 'zhōngxué' },
      { id: 'student',      zh: '学生',   en: 'student',               py: 'xuésheng' },
      { id: 'teacher',      zh: '老师',   en: 'teacher',               py: 'lǎoshī' },
      { id: 'classmate',    zh: '同学',   en: 'classmate',             py: 'tóngxué' },
      { id: 'subject',      zh: '科目',   en: 'school subject',        py: 'kēmù' },
      { id: 'chinese',      zh: '中文',   en: 'Chinese (language)',    py: 'Zhōngwén' },
      { id: 'english',      zh: '英文',   en: 'English (language)',    py: 'Yīngwén' },
      { id: 'maths',        zh: '数学',   en: 'maths',                 py: 'shùxué' },
      { id: 'science',      zh: '科学',   en: 'science',               py: 'kēxué' },
      { id: 'pe',           zh: '体育',   en: 'PE / sport',            py: 'tǐyù' },
      { id: 'art',          zh: '美术',   en: 'art',                   py: 'měishù' },
      { id: 'music',        zh: '音乐',   en: 'music',                 py: 'yīnyuè' },
      { id: 'lesson',       zh: '课',     en: 'lesson / class',        py: 'kè' },
      { id: 'homework1',    zh: '功课',   en: 'homework',              py: 'gōngkè' },
      { id: 'homework2',    zh: '作业',   en: 'assignment',            py: 'zuòyè' },
      { id: 'exam',         zh: '考试',   en: 'exam',                  py: 'kǎoshì' },
      { id: 'grades',       zh: '成绩',   en: 'grades / results',      py: 'chéngjì' },
      { id: 'course',       zh: '课程',   en: 'course / curriculum',   py: 'kèchéng' },
      { id: 'classroom',    zh: '教室',   en: 'classroom',             py: 'jiàoshì' },
      { id: 'library',      zh: '图书馆', en: 'library',               py: 'túshūguǎn' },
      { id: 'gym',          zh: '体育馆', en: 'sports hall / gym',     py: 'tǐyùguǎn' },
      { id: 'field',        zh: '操场',   en: 'playground / field',    py: 'cāochǎng' },
      { id: 'canteen',      zh: '食堂',   en: 'canteen',               py: 'shítáng' },
      { id: 'computerroom', zh: '电脑室', en: 'computer room',         py: 'diànnǎoshì' },
      { id: 'uniform',      zh: '校服',   en: 'school uniform',        py: 'xiàofú' },
      { id: 'facilities',   zh: '设施',   en: 'facilities',            py: 'shèshī' },
      { id: 'rules',        zh: '规则',   en: 'rules',                 py: 'guīzé' },
      { id: 'interesting',  zh: '有意思', en: 'interesting',           py: 'yǒuyìsi' },
      { id: 'boring',       zh: '无聊',   en: 'boring',                py: 'wúliáo' },
      { id: 'easy',         zh: '容易',   en: 'easy',                  py: 'róngyì' },
      { id: 'difficult',    zh: '难',     en: 'difficult',             py: 'nán' },
      { id: 'useful',       zh: '有用',   en: 'useful',                py: 'yǒuyòng' },
      { id: 'important',    zh: '重要',   en: 'important',             py: 'zhòngyào' },
      { id: 'strict',       zh: '严格',   en: 'strict',                py: 'yángé' },
      { id: 'friendly',     zh: '友好',   en: 'friendly',              py: 'yǒuhǎo' },
      { id: 'pressure',     zh: '压力',   en: 'pressure / stress',     py: 'yālì' },
      { id: 'strength',     zh: '优点',   en: 'strength / plus point', py: 'yōudiǎn' },
      { id: 'weakness',     zh: '缺点',   en: 'weakness / drawback',   py: 'quēdiǎn' },
      { id: 'improve',      zh: '改善',   en: 'to improve',            py: 'gǎishàn' }
    ]
  },

  y11_careers: {
    id: 'y11_careers',
    group: 'Year 11',
    lesson: 2,
    title: 'Unit 2: Future Plans & Careers',
    subtitle: '未来计划与职业 · IGCSE 0547',
    status: 'available',
    words: [
      { id: 'future',        zh: '将来',     en: 'the future',            py: 'jiānglái' },
      { id: 'afterwards',    zh: '以后',     en: 'afterwards / later',    py: 'yǐhòu' },
      { id: 'nextyear',      zh: '明年',     en: 'next year',             py: 'míngnián' },
      { id: 'university',    zh: '大学',     en: 'university',            py: 'dàxué' },
      { id: 'study',         zh: '学习',     en: 'to study',              py: 'xuéxí' },
      { id: 'major',         zh: '专业',     en: 'major / specialism',    py: 'zhuānyè' },
      { id: 'continue',      zh: '继续',     en: 'to continue',           py: 'jìxù' },
      { id: 'graduate',      zh: '毕业',     en: 'to graduate',           py: 'bìyè' },
      { id: 'plan_n',        zh: '计划',     en: 'a plan',                py: 'jìhuà' },
      { id: 'plan_v',        zh: '打算',     en: 'to plan to',            py: 'dǎsuàn' },
      { id: 'hope',          zh: '希望',     en: 'to hope',               py: 'xīwàng' },
      { id: 'decide',        zh: '决定',     en: 'to decide',             py: 'juédìng' },
      { id: 'work',          zh: '工作',     en: 'work / job',            py: 'gōngzuò' },
      { id: 'occupation',    zh: '职业',     en: 'occupation',            py: 'zhíyè' },
      { id: 'teacher_c',     zh: '老师',     en: 'teacher',               py: 'lǎoshī' },
      { id: 'doctor',        zh: '医生',     en: 'doctor',                py: 'yīshēng' },
      { id: 'nurse',         zh: '护士',     en: 'nurse',                 py: 'hùshi' },
      { id: 'engineer',      zh: '工程师',   en: 'engineer',              py: 'gōngchéngshī' },
      { id: 'businessper',   zh: '商人',     en: 'businessperson',        py: 'shāngrén' },
      { id: 'designer',      zh: '设计师',   en: 'designer',              py: 'shèjìshī' },
      { id: 'lawyer',        zh: '律师',     en: 'lawyer',                py: 'lǜshī' },
      { id: 'company',       zh: '公司',     en: 'company',               py: 'gōngsī' },
      { id: 'salary',        zh: '工资',     en: 'salary / wages',        py: 'gōngzī' },
      { id: 'workinghours',  zh: '工作时间', en: 'working hours',         py: 'gōngzuò shíjiān' },
      { id: 'colleague',     zh: '同事',     en: 'colleague',             py: 'tóngshì' },
      { id: 'experience',    zh: '经验',     en: 'experience',            py: 'jīngyàn' },
      { id: 'clever',        zh: '聪明',     en: 'clever',                py: 'cōngming' },
      { id: 'conscientious', zh: '认真',     en: 'conscientious',         py: 'rènzhēn' },
      { id: 'patient',       zh: '有耐心',   en: 'patient',               py: 'yǒu nàixīn' },
      { id: 'experienced',   zh: '有经验',   en: 'experienced',           py: 'yǒu jīngyàn' },
      { id: 'speakforeign',  zh: '会说外语', en: 'can speak a foreign language', py: 'huì shuō wàiyǔ' },
      { id: 'usecomputer',   zh: '会用电脑', en: 'can use a computer',    py: 'huì yòng diànnǎo' },
      { id: 'helpothers',    zh: '喜欢帮助别人', en: 'likes helping others', py: 'xǐhuan bāngzhù biéren' },
      { id: 'meaningful',    zh: '有意义',   en: 'meaningful',            py: 'yǒu yìyì' },
      { id: 'stable',        zh: '稳定',     en: 'stable',                py: 'wěndìng' },
      { id: 'tough',         zh: '辛苦',     en: 'tough / hard-going',    py: 'xīnkǔ' },
      { id: 'stressful',     zh: '压力大',   en: 'stressful',             py: 'yālì dà' },
      { id: 'wellpaid',      zh: '工资高',   en: 'well paid',             py: 'gōngzī gāo' },
      { id: 'suit',          zh: '适合',     en: 'to suit / be suitable', py: 'shìhé' },
      { id: 'advantage_c',   zh: '优点',     en: 'advantage',             py: 'yōudiǎn' },
      { id: 'disadvantage_c',zh: '缺点',     en: 'disadvantage',          py: 'quēdiǎn' }
    ]
  }
});

var CL_GROUP_ORDER = ['Tutorial', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'];

/** Ordered, word-free summary for the client sidebar, grouped by year. */
function CL_TOPIC_SUMMARY_() {
  return Object.keys(CL_TOPICS)
    .map(function (key) {
      var t = CL_TOPICS[key];
      return {
        id: t.id,
        group: t.group || 'Other',
        lesson: t.lesson,
        title: t.title,
        subtitle: t.subtitle,
        status: t.status,
        wordCount: t.words.length
      };
    })
    .sort(function (a, b) {
      var ga = CL_GROUP_ORDER.indexOf(a.group);
      var gb = CL_GROUP_ORDER.indexOf(b.group);
      if (ga < 0) ga = 99;
      if (gb < 0) gb = 99;
      return ga - gb || a.lesson - b.lesson;
    });
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
    // No usable direction on the attempt: fall back to the client's judgement.
    expected = (direction === 'zh_py') ? word.py : word.en;
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
